import Fastify, { FastifyRequest } from "fastify";
import JSONSchema, { JSONSchemaObject } from "@json-schema-tools/meta-schema";

import { Connector } from "./connector";
import { ConnectorError } from "./error";

import { ErrorResponseSchema, ValidateResponse, ValidateResponseSchema } from "./schema";
import { configureFastifyLogging } from "./logging";

export interface ConfigurationServerOptions {
  port: number;
  logLevel: string;
  prettyPrintLogs: string;
}

const errorResponses = {
  400: ErrorResponseSchema,
  403: ErrorResponseSchema,
  409: ErrorResponseSchema,
  422: ErrorResponseSchema,
  500: ErrorResponseSchema,
  501: ErrorResponseSchema,
  502: ErrorResponseSchema,
};

export async function startConfigurationServer<
  RawConfiguration,
  Configuration,
  State
>(
  connector: Connector<RawConfiguration, Configuration, State>,
  options: ConfigurationServerOptions
) {
  const server = Fastify({
    logger: configureFastifyLogging(options),
  });

  // temporary: use JSON.stringify instead of https://github.com/fastify/fast-json-stringify
  // todo: remove this once issue is addressed https://github.com/fastify/fastify/issues/5073
  server.setSerializerCompiler(
    ({ schema, method, url, httpStatus, contentType }) => {
      return (data) => JSON.stringify(data);
    }
  );

  const rawConfigurationSchema = connector.getRawConfigurationSchema();

  server.get(
    "/",
    {
      schema: {
        response: {
          200: rawConfigurationSchema,
          ...errorResponses,
        },
      },
    },
    async function get_schema(
      _request: FastifyRequest
    ): Promise<RawConfiguration> {
      return connector.makeEmptyConfiguration();
    }
  );

  server.post(
    "/",
    {
      schema: {
        body: rawConfigurationSchema,
        response: {
          200: rawConfigurationSchema,
          ...errorResponses,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Body: RawConfiguration;
      }>
    ): Promise<RawConfiguration> => {
      return connector.updateConfiguration(
        // type assertion required because Configuration is a generic parameter
        request.body as RawConfiguration
      );
    }
  );

  server.get(
    "/schema",
    {
      schema: {
        response: {
          200: JSONSchema,
          ...errorResponses,
        },
      },
    },
    async (): Promise<JSONSchemaObject> => rawConfigurationSchema
  );

  server.post(
    "/validate",
    {
      schema: {
        body: rawConfigurationSchema,
        response: {
          200: ValidateResponseSchema,
          ...errorResponses,
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: RawConfiguration }>
    ): Promise<ValidateResponse> => {
      const resolvedConfiguration = await connector.validateRawConfiguration(
        // type assertion required because Configuration is a generic parameter
        request.body as RawConfiguration
      );
      const schema = await connector.getSchema(resolvedConfiguration);
      const capabilities = connector.getCapabilities(resolvedConfiguration);

      return {
        schema,
        capabilities,
        resolved_configuration: encodeJSON(resolvedConfiguration),
      };
    }
  );

  server.get("/health", async () => {});

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
    await server.listen({ port: options.port, host: "0.0.0.0" });
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

function encodeJSON(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}
// unused for now, but keeping as reference in case it is needed later.
function decodeJSON<T>(payload: string): T {
  return JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
}
