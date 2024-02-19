import Fastify, { FastifyRequest } from "fastify";

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

import { Options as AjvOptions } from "ajv";

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
  422: ErrorResponseSchema,
  500: ErrorResponseSchema,
  501: ErrorResponseSchema,
  502: ErrorResponseSchema,
};

export interface ServerOptions {
  configuration: string;
  port: number;
  serviceTokenSecret: string | undefined;
  otlpEndpoint: string | undefined;
  serviceName: string | undefined;
  logLevel: string;
  prettyPrintLogs: string;
}

export async function startServer<Configuration, State>(
  connector: Connector<Configuration, State>,
  options: ServerOptions
) {
  const configuration = await connector.parseConfiguration(options.configuration);

  const metrics = {}; // todo

  const state = await connector.tryInitState(configuration, metrics);

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
      return connector.getCapabilities(configuration);
    }
  );

  server.get("/health", (_request): Promise<undefined> => {
    return connector.healthCheck(configuration, state);
  });

  server.get("/metrics", (_request) => {
    return connector.fetchMetrics(configuration, state);
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
      return connector.getSchema(configuration);
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
      const queryResponse = await connector.query(
        configuration,
        state,
        request.body
      );
      request.log.debug({ responseBody: queryResponse }, "Query Response");
      return queryResponse;
    }
  );

  server.post(
    "/query/explain",
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
      request.log.debug({ requestBody: request.body }, "Query Explain Request");
      const explainResponse = await connector.queryExplain(
        configuration,
        state,
        request.body
      );
      request.log.debug({ responseBody: explainResponse }, "Query Explain Response");
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
      const mutuationResponse = await connector.mutation(
        configuration,
        state,
        request.body
      );
      request.log.debug(
        { responseBody: mutuationResponse },
        "Mutation Response"
      );
      return mutuationResponse;
    }
  );

  server.post(
    "/mutation/explain",
    {
      schema: {
        body: MutationRequestSchema,
        response: {
          200: ExplainResponseSchema,
          ...errorResponses,
        },
      },
    },
    async (request: FastifyRequest<{ Body: MutationRequest }>) => {
      request.log.debug({ requestBody: request.body }, "Mutation Explain Request");
      const explainResponse = await connector.mutationExplain(
        configuration,
        state,
        request.body
      );
      request.log.debug({ responseBody: explainResponse }, "Mutation Explain Response");
      return explainResponse;
    }
  );

  server.setErrorHandler(function (error, _request, reply) {
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
    process.exit(1);
  }
}
