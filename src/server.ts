import fs from "fs";
import Fastify, { FastifyRequest } from "fastify";

import { Connector } from "./connector";
import { ConnectorError } from "./error";

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
} from "./generated";

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
  500: ErrorResponseSchema,
  501: ErrorResponseSchema,
};

export interface ServerOptions {
  configuration: string;
  port: number;
  serviceTokenSecret: string | null;
  otlpEndpoint: string | null;
  serviceName: string | null;
}

export async function start_server<Configuration, State>(
  connector: Connector<Configuration, State>,
  options: ServerOptions
) {
  const configuration = await get_configuration<Configuration>(
    options.configuration
  );

  const metrics = {}; // todo

  const state = await connector.try_init_state(configuration, metrics);

  const server = Fastify({
    logger: true,
    ajv: {
      customOptions: customAjvOptions,
    },
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
      return connector.get_capabilities(configuration);
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
    (_request): SchemaResponse => {
      return connector.get_schema(configuration);
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
      return connector.query(configuration, state, request.body);
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
    (request) => {
      return connector.explain(
        configuration,
        state,
        request.body as QueryRequest
      );
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
    (
      request: FastifyRequest<{
        Body: MutationRequest;
      }>
    ): Promise<MutationResponse> => {
      return connector.mutation(
        configuration,
        state,
        request.body as MutationRequest
      );
    }
  );

  server.setErrorHandler(function (error, _request, reply) {
    if (error.validation) {
      reply.status(400).send({
        message:
          "Validation Error - https://fastify.dev/docs/latest/Reference/Validation-and-Serialization#error-handling",
        details: error.validation,
      });
    } else if (error instanceof ConnectorError) {
      // Log error
      this.log.error(error);
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
    await server.listen({ port: options.port });
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

function get_configuration<Configuration>(path: string): Configuration {
  const data = fs.readFileSync(path);
  const configuration = JSON.parse(data.toString());
  return configuration as Configuration;
}
