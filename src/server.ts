import fs from "fs/promises";
import { watch } from "fs";
import Fastify, { FastifyBaseLogger, FastifyRequest } from "fastify";

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
import * as rxjs from "rxjs";

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
  watch: boolean;
}

type ServerState<Configuration, State> = {
  configuration: Configuration,
  connectorState: State
}

export async function start_server<RawConfiguration, Configuration, State>(
  connector: Connector<RawConfiguration, Configuration, State>,
  options: ServerOptions
) {
  let serverState = await build_server_state(options.configuration, connector);
  let connectorWatchSubscription: rxjs.Subscription | null = null;
  let configurationWatchSubscription: rxjs.Subscription | null = null;

  const server = Fastify({
    logger: true,
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
      return connector.get_capabilities(serverState.configuration);
    }
  );

  server.get("/health", (_request): Promise<undefined> => {
    return connector.health_check(serverState.configuration, serverState.connectorState);
  });

  server.get("/metrics", (_request) => {
    return connector.fetch_metrics(serverState.configuration, serverState.connectorState);
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
      return connector.get_schema(serverState.configuration);
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
      return connector.query(serverState.configuration, serverState.connectorState, request.body);
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
        serverState.configuration,
        serverState.connectorState,
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
        serverState.configuration,
        serverState.connectorState,
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

  server.addHook("onClose", () => {
    connectorWatchSubscription?.unsubscribe()
    configurationWatchSubscription?.unsubscribe()
  });

  try {
    await server.listen({ port: options.port, host: "0.0.0.0" });
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }

  if (options.watch) {
    function subscribeToConnectorStateChanges() {
      return connector.watch_for_state_change
        ? connector.watch_for_state_change(serverState.configuration)
            .subscribe({
                next: (newConnectorState) => {
                  serverState = { ...serverState, connectorState: newConnectorState };
                  server.log.info("Connector state updated")
                },
                error: (error) => {
                  server.log.warn(error, "Connector state update error")
                }
            })
        : null;
    }

    let connectorWatchSubscription: rxjs.Subscription | null = null;
    
    configurationWatchSubscription = 
      watch_configuration(options.configuration, connector, server.log)
        .subscribe(newServerState => {
          connectorWatchSubscription?.unsubscribe();

          serverState = newServerState;
          
          connectorWatchSubscription = subscribeToConnectorStateChanges();
          
          server.log.info("Configuration updated")
        });

    connectorWatchSubscription = subscribeToConnectorStateChanges();
    
    server.log.info("Watch mode enabled")
  }
}

async function build_server_state<RawConfiguration, Configuration, State>(
  configurationFilePath: string, 
  connector: Connector<RawConfiguration, Configuration, State>
  ): Promise<ServerState<Configuration, State>> {
  const data = await fs.readFile(configurationFilePath);
  const rawConfiguration = JSON.parse(data.toString("utf8"));
  const configuration = await connector.validate_raw_configuration(rawConfiguration);

  const metrics = {}; // todo

  const state = await connector.try_init_state(configuration, metrics);
  return {
    configuration,
    connectorState: state
  };
}

function watch_configuration<RawConfiguration, Configuration, State>(
  configurationFilePath: string, 
  connector: Connector<RawConfiguration, Configuration, State>,
  logger: FastifyBaseLogger
  ): rxjs.Observable<ServerState<Configuration, State>> {
    return new rxjs.Observable(subscriber => {
      const watcher = watch(
        configurationFilePath, 
        { persistent: false /* Watcher does not keep the process running */ }, 
        event => subscriber.next(event));
      
      return () => watcher.close(); // Unsubscribe function
    })
    .pipe(rxjs.debounceTime(200))
    .pipe(rxjs.mergeMap(async _event => {
      try {
        return await build_server_state(configurationFilePath, connector)
      } catch (e) {
        logger.warn(e, "Configuration update error");
        return undefined;
      }
    }))
    .pipe(rxjs.filter((v): v is ServerState<Configuration, State> => v !== undefined));
}
