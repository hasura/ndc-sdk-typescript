import { Connector } from "./connector";
import { Command, Option, InvalidOptionArgumentError } from "commander";
import { ServerOptions, startServer } from "./server";
export * from "./error";
export * from "./schema";
export { Connector, ServerOptions, startServer };

/**
 * Starts the connector.
 * Will read command line arguments or environment variables to determine runtime configuration.
 *
 * This should be the entrypoint of your connector
 * @param connector An object that implements the Connector interface
 */
export function start<Configuration, State>(
  connector: Connector<Configuration, State>
) {
  const program = new Command();

  program.addCommand(getServeCommand(connector));

  program.parseAsync(process.argv).catch(console.error);
}

export function getServeCommand<Configuration, State>(
  connector?: Connector<Configuration, State>
) {
  const configurationOptions = new Option("--configuration <directory>")
    .env("HASURA_CONFIGURATION_DIRECTORY")
    .makeOptionMandatory(true)
  if (process.platform !== "win32") {
    configurationOptions.default("/etc/connector");
  }

  const command = new Command("serve")
    .addOption(configurationOptions)
    .addOption(
      new Option("--port <port>")
        .env("HASURA_CONNECTOR_PORT")
        .default(8080)
        .argParser(parseIntOption)
    )
    .addOption(
      new Option("--service-token-secret <secret>").env("HASURA_SERVICE_TOKEN_SECRET")
    )
    .addOption(new Option("--otlp-endpoint <endpoint>").env("OTEL_EXPORTER_OTLP_ENDPOINT"))
    .addOption(new Option("--service-name <name>").env("OTEL_SERVICE_NAME"))
    .addOption(new Option("--log-level <level>").env("HASURA_LOG_LEVEL").default("info"))
    .addOption(new Option("--pretty-print-logs").env("HASURA_PRETTY_PRINT_LOGS").default(false));

  if (connector) {
    command.action(async (options: ServerOptions) => {
      await startServer(connector, options);
    })
  }
  return command;
}

function parseIntOption(value: string, _previous: number): number {
  // parseInt takes a string and a radix
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new InvalidOptionArgumentError("Not a valid integer.");
  }
  return parsedValue;
}
