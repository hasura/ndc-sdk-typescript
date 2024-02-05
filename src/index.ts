import { Connector } from "./connector";
import { Command, Option, InvalidOptionArgumentError } from "commander";
import { ServerOptions, startServer } from "./server";
import {
  ConfigurationServerOptions,
  startConfigurationServer,
} from "./configuration-server";

export * from "./error";
export * from "./schema";
export { Connector, ServerOptions, ConfigurationServerOptions, startConfigurationServer, startServer };

/**
 * Starts the connector.
 * Will read runtimeflags or environment variables to determine startup mode.
 *
 * This shoudl be the entrypoint of your connector
 * @param connector An object that implements the Connector interface
 */
export function start<RawConfiguration, Configuration, State>(
  connector: Connector<RawConfiguration, Configuration, State>
) {
  const program = new Command();

  program.addCommand(getServeCommand(connector));
  program.addCommand(getServeConfigurationCommand(connector));

  program.parseAsync(process.argv).catch(console.error);
}

export function getServeCommand<RawConfiguration, Configuration, State>(
  connector?: Connector<RawConfiguration, Configuration, State>
) {
  const command = new Command("serve")
    .addOption(
      new Option("--configuration <path>")
        .env("CONFIGURATION_FILE")
        .makeOptionMandatory(true)
    )
    .addOption(
      new Option("--port <port>")
        .env("PORT")
        .default(8100)
        .argParser(parseIntOption)
    )
    .addOption(
      new Option("--service-token-secret <secret>").env("SERVICE_TOKEN_SECRET")
    )
    .addOption(new Option("--otlp_endpoint <endpoint>").env("OTLP_ENDPOINT"))
    .addOption(new Option("--service-name <name>").env("OTEL_SERVICE_NAME"))
    .addOption(new Option("--log-level <level>").env("LOG_LEVEL").default("info"))
    .addOption(new Option("--pretty-print-logs").env("PRETTY_PRINT_LOGS").default(false));

  if (connector) {
    command.action(async (options: ServerOptions) => {
      await startServer(connector, options);
    })
  }
  return command;
}

export function getServeConfigurationCommand<
  RawConfiguration,
  Configuration,
  State
>(connector?: Connector<RawConfiguration, Configuration, State>) {
  const serveCommand = new Command("serve")
    .addOption(
      new Option("--port <port>")
        .env("PORT")
        .default(9100)
        .argParser(parseIntOption)
    )
    .addOption(new Option("--log-level <level>").env("LOG_LEVEL").default("info"))
    .addOption(new Option("--pretty-print-logs").env("PRETTY_PRINT_LOGS").default(false));

  if (connector) {
    serveCommand.action(async (options: ConfigurationServerOptions) => {
      await startConfigurationServer(connector, options);
    });
  }

  return new Command("configuration").addCommand(serveCommand);
}

function parseIntOption(value: string, _previous: number): number {
  // parseInt takes a string and a radix
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new InvalidOptionArgumentError("Not a valid integer.");
  }
  return parsedValue;
}
