import Fastify, { FastifyRequest } from "fastify";
import opentelemetry, {
  SpanStatusCode,
} from "@opentelemetry/api";

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
  VERSION,
  VERSION_HEADER_NAME,
  ErrorResponse,
} from "./schema";

import { Options as AjvOptions } from "ajv";
import { withActiveSpan } from "./instrumentation";
import { Registry, collectDefaultMetrics } from "prom-client";
import semver from "semver";

// Create custom Ajv options to handle Rust's uint types which are formats used in the JSON schemas, so this converts that to a number
const customAjvOptions: AjvOptions = {
  allErrors: true,
  removeAdditional: true,
  formats: {
    uint: {
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
  host: string;
  port: number;
  serviceTokenSecret: string | undefined;
  logLevel: string;
  prettyPrintLogs: string;
}

const tracer = opentelemetry.trace.getTracer("ndc-sdk-typescript.server");

export async function startServer<Configuration, State>(
  connector: Connector<Configuration, State>,
  options: ServerOptions
) {
  const configuration = await connector.parseConfiguration(
    options.configuration
  );

  const metrics = new Registry();
  collectDefaultMetrics({ register: metrics });

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

  // Authorization handler
  server.addHook("preHandler", async (request, reply) => {
    // Don't apply authorization to the healthcheck endpoint
    if (request.routeOptions.method === "GET" && request.routeOptions.url === "/health") {
      return;
    }

    const expectedAuthHeader =
      options.serviceTokenSecret === undefined
        ? undefined
        : `Bearer ${options.serviceTokenSecret}`;

    if (request.headers.authorization === expectedAuthHeader) {
      return;
    } else {
      reply.code(401).send(<ErrorResponse>{
        message: "Internal Error",
        details: {
          cause: "Bearer token does not match.",
        },
      });

      return reply;
    }
  });

  // NDC Version header handler
  const lowercaseVersionHeaderName = VERSION_HEADER_NAME.toLowerCase();
  const connectorSemVer = new semver.SemVer(VERSION);
  server.addHook("preHandler", async (request, reply) => {
    const versionHeader = request.headers[lowercaseVersionHeaderName];
    if (versionHeader === undefined) {
      return;
    }

    if (Array.isArray(versionHeader)) {
      reply.code(400).send(<ErrorResponse>{
        message: `Multiple ${VERSION_HEADER_NAME} headers received. Only one is supported.`,
      })
      return reply;
    }

    let wantedSemVer: semver.SemVer;
    try {
      wantedSemVer = new semver.SemVer(versionHeader);
    } catch (e) {
      reply.code(400).send(<ErrorResponse>{
        message: `Invalid semver in ${VERSION_HEADER_NAME}s header`,
        details: e instanceof Error ? { error: e.message } : {}
      })
      return reply;
    }

    const wantedSemVerRange = new semver.Range(`^${wantedSemVer.toString()}`);

    if (!semver.satisfies(connectorSemVer, wantedSemVerRange)) {
      reply.code(400).send(<ErrorResponse>{
        message: `The connector does not support the requested NDC version`,
        details: {
          connectorVersion: connectorSemVer.toString(),
          requestedVersionRange: wantedSemVerRange.toString(),
        }
      })
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
      return withActiveSpan(
        tracer,
        "getCapabilities",
        () => ({
          version: VERSION,
          capabilities: connector.getCapabilities(configuration),
        })
      );
    }
  );

  server.get("/health", async (_request): Promise<undefined> => {
    return connector.getHealthReadiness
      ? await connector.getHealthReadiness(configuration, state)
      : undefined;
  });

  server.get("/metrics", (_request) => {
    connector.fetchMetrics(configuration, state);
    return metrics.metrics();
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
      return withActiveSpan(
        tracer,
        "getSchema",
        () => connector.getSchema(configuration)
      );
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
      request.log.debug({ requestHeaders: request.headers, requestBody: request.body }, "Query Request");

      const queryResponse = await withActiveSpan(
        tracer,
        "handleQuery",
        () => connector.query(configuration, state, request.body)
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
      request.log.debug({ requestHeaders: request.headers, requestBody: request.body }, "Explain Request");

      const explainResponse = await withActiveSpan(
        tracer,
        "handleQueryExplain",
        () => connector.queryExplain(configuration, state, request.body)
      );

      request.log.debug(
        { responseBody: explainResponse },
        "Query Explain Response"
      );
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
      request.log.debug({ requestHeaders: request.headers, requestBody: request.body }, "Mutation Request");

      const mutationResponse = await withActiveSpan(
        tracer,
        "handleMutation",
        () => connector.mutation(configuration, state, request.body)
      );

      request.log.debug(
        { responseBody: mutationResponse },
        "Mutation Response"
      );
      return mutationResponse;
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
      request.log.debug(
        { requestHeaders: request.headers, requestBody: request.body },
        "Mutation Explain Request"
      );

      const explainResponse = await withActiveSpan(
        tracer,
        "handleMutationExplain",
        () => connector.mutationExplain(configuration, state, request.body)
      );

      request.log.debug(
        { responseBody: explainResponse },
        "Mutation Explain Response"
      );
      return explainResponse;
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
      const span = opentelemetry.trace.getActiveSpan();
      span?.recordException(error);
      span?.setStatus({ code: SpanStatusCode.ERROR });

      reply.status(500).send({
        message: error.message,
        details: {},
      });
    }
  });

  try {
    await server.listen({ port: options.port, host: options.host });
  } catch (error) {
    server.log.error(error);
    process.exitCode = 1;
  }
}
