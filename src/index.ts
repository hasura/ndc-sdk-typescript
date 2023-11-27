import { Connector } from "./connector";
import { Command, Option, InvalidOptionArgumentError } from "commander";
import { ServerOptions, start_server } from "./server";
import {
  ConfigurationServerOptions,
  start_configuration_server,
} from "./configuration_server";

export * from "./error";
export * from "./schema";
export { Connector, start_configuration_server, start_server };

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

  program.addCommand(get_serve_command(connector));
  program.addCommand(get_serve_configuration_command(connector));

  program.parseAsync(process.argv).catch(console.error);
}

export function get_serve_command<RawConfiguration, Configuration, State>(
  connector: Connector<RawConfiguration, Configuration, State>
) {
  return new Command("serve")
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
    .action(async (options: ServerOptions) => {
      await start_server(connector, options);
    });
}

export function get_serve_configuration_command<
  RawConfiguration,
  Configuration,
  State
>(connector: Connector<RawConfiguration, Configuration, State>) {
  return new Command("configuration").addCommand(
    new Command("serve")
      .addOption(
        new Option("--port <port>")
          .env("PORT")
          .default(9100)
          .argParser(parseIntOption)
      )
      .action(async (options: ConfigurationServerOptions) => {
        await start_configuration_server(connector, options);
      })
  );
}

function parseIntOption(value: string, _previous: number): number {
  // parseInt takes a string and a radix
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new InvalidOptionArgumentError("Not a valid integer.");
  }
  return parsedValue;
}
