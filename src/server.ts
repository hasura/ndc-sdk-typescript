import fs from "fs";
import Fastify, { FastifyRequest } from "fastify";
import opentelemetry from '@opentelemetry/api';

import { Connector } from "./connector";
import { ConnectorError } from "./error";
import { configureFastifyLogging } from "./logging";

import {
  CapabilitiesResponseSchema,
  SchemaResponseSchema,
  QueryRequestSchema,
  QueryResponseSchema,
  ExplainResponseSchema,
  MutationRequestSchema,
  MutationResponseSchema,
  ErrorResponseSchema,
  CapabilitiesResponse,
  SchemaResponse,
  MutationResponse,
  MutationRequest,
  QueryRequest,
} from "./schema";

import Ajv, { Options as AjvOptions, ErrorObject as AjvErrorObject } from "ajv";
import fastify from "fastify";

// Create custom Ajv options to handle Rust's uint32 which is a format used in the JSON schemas, so this converts that to a number
const customAjvOptions: AjvOptions = {
  allErrors: true,
  removeAdditional: true,
  formats: {
    uint32: {
      validate: (data: any) => {
        return (
          typeof data === "number" &&
          data >= 0 &&
          data <= 4294967295 &&
          Number.isInteger(data)
        );
      },
      type: "number",
    },
  },
};

const errorResponses = {
  400: ErrorResponseSchema,
  403: ErrorResponseSchema,
  409: ErrorResponseSchema,
  500: ErrorResponseSchema,
  501: ErrorResponseSchema,
};

export interface ServerOptions {
  configuration: string;
  port: number;
  serviceTokenSecret: string | undefined;
  otelExporterOtlpEndpoint: string;
  otelServiceName: string;
  logLevel: string;
  prettyPrintLogs: string;
}

class ConfigurationError extends Error {
  validation_errors: AjvErrorObject[];

  constructor(message: string, errors: AjvErrorObject[]) {
    super(message);
    this.validation_errors = errors;
  }
}

const tracer = opentelemetry.trace.getTracer("ndc");

export async function start_server<RawConfiguration, Configuration, State>(
  connector: Connector<RawConfiguration, Configuration, State>,
  options: ServerOptions
) {
  const ajv = new Ajv(customAjvOptions);
  const validateRawConfigurationAgainstSchema = ajv.compile<RawConfiguration>(
    connector.get_raw_configuration_schema()
  );

  const data = fs.readFileSync(options.configuration);
  const rawConfiguration: unknown = JSON.parse(data.toString("utf8"));
  if (!validateRawConfigurationAgainstSchema(rawConfiguration)) {
    throw new ConfigurationError(
      "Invalid configuration provided",
      validateRawConfigurationAgainstSchema.errors ?? []
    );
  }

  const configuration = await connector.validate_raw_configuration(
    rawConfiguration
  );

  const metrics = {}; // todo

  const state = await connector.try_init_state(configuration, metrics);

  const server = Fastify({
    logger: configureFastifyLogging(options),
    ajv: {
      customOptions: customAjvOptions,
    },
  });

  // temporary: use JSON.stringify instead of https://github.com/fastify/fast-json-stringify
  // todo: remove this once issue is addressed https://github.com/fastify/fastify/issues/5073
  server.setSerializerCompiler(
    ({ schema, method, url, httpStatus, contentType }) => {
      return (data) => JSON.stringify(data);
    }
  );

  server.addHook("preHandler", (request, reply, done) => {
    const expectedAuthHeader =
      options.serviceTokenSecret === undefined
        ? undefined
        : `Bearer ${options.serviceTokenSecret}`;

    if (request.headers.authorization === expectedAuthHeader) {
      return done();
    } else {
      reply.code(401).send({
        message: "Internal Error",
        details: {
          cause: "Bearer token does not match.",
        },
      });

      return reply;
    }
  });

  server.get(
    "/capabilities",
    {
      schema: {
        response: {
          200: CapabilitiesResponseSchema,
          ...errorResponses,
        },
      },
    },
    (_request: FastifyRequest): CapabilitiesResponse => {
      const capabilitiesResponse = tracer.startActiveSpan(
        "getCapabilities",
        (span) => {
          const capabilitiesResponse = connector.get_capabilities(configuration);
          span.end();
          return capabilitiesResponse;
        }
      );
      return capabilitiesResponse;
    }
  );

  server.get("/health", (_request): Promise<undefined> => {
    return connector.health_check(configuration, state);
  });

  server.get("/metrics", (_request) => {
    return connector.fetch_metrics(configuration, state);
  });

  server.get(
    "/schema",
    {
      schema: {
        response: {
          200: SchemaResponseSchema,
          ...errorResponses,
        },
      },
    },
    (_request): Promise<SchemaResponse> => {
      const schemaResponse = tracer.startActiveSpan(
        "getSchema",
        async (span) => {
          const schemaResponse = await connector.get_schema(configuration);

          span.end();

          return schemaResponse;
        }
      );

      return schemaResponse;
    }
  );

  server.post(
    "/query",
    {
      schema: {
        body: QueryRequestSchema,
        response: {
          200: QueryResponseSchema,
          ...errorResponses,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Body: QueryRequest;
      }>
    ) => {
      request.log.debug({ requestBody: request.body }, "Query Request");

      const queryResponse = await tracer.startActiveSpan(
        "handleQuery",
        async (span) => {
          const queryResponse = await connector.query(
            configuration,
            state,
            request.body
          );

          span.end();

          return queryResponse;
        }
      );

      request.log.debug({ responseBody: queryResponse }, "Query Response");
      return queryResponse;
    }
  );

  server.post(
    "/explain",
    {
      schema: {
        body: QueryRequestSchema,
        response: {
          200: ExplainResponseSchema,
          ...errorResponses,
        },
      },
    },
    async (request: FastifyRequest<{ Body: QueryRequest }>) => {
      request.log.debug({ requestBody: request.body }, "Explain Request");

      const explainResponse = await tracer.startActiveSpan(
        "handleQueryExplain",
        async (span) => {
          const explainResponse = await connector.explain(
            configuration,
            state,
            request.body
          );

          span.end();

          return explainResponse;
        }
      );
      request.log.debug({ responseBody: explainResponse }, "Explain Response");
      return explainResponse;
    }
  );

  server.post(
    "/mutation",
    {
      schema: {
        body: MutationRequestSchema,
        response: {
          200: MutationResponseSchema,
          ...errorResponses,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Body: MutationRequest;
      }>
    ): Promise<MutationResponse> => {
      request.log.debug({ requestBody: request.body }, "Mutation Request");

      const mutuationResponse = await tracer.startActiveSpan(
        "handleMutation",
        async (span) => {
          const mutuationResponse = await connector.mutation(
            configuration,
            state,
            request.body
          );

          span.end();

          return mutuationResponse;
        }
      );

      request.log.debug(
        { responseBody: mutuationResponse },
        "Mutation Response"
      );
      return mutuationResponse;
    }
  );

  server.setErrorHandler(function (error, _request, reply) {
    // pino trace instrumentation will add trace information to log output
    this.log.error(error);

    if (error.validation) {
      reply.status(400).send({
        message:
          "Validation Error - https://fastify.dev/docs/latest/Reference/Validation-and-Serialization#error-handling",
        details: error.validation,
      });
    } else if (error instanceof ConnectorError) {
      // Send error response
      reply.status(error.statusCode).send({
        message: error.message,
        details: error.details ?? {},
      });
    } else {
      reply.status(500).send({
        message: error.message,
        details: {},
      });
    }
  });

  try {
    await server.listen({ port: options.port, host: "0.0.0.0" });
  } catch (error) {
    server.log.error(error);
    process.exitCode = 1;
  }
}
