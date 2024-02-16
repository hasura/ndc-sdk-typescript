// the instrumentation file must be the first import: https://opentelemetry.io/docs/languages/js/getting-started/nodejs/#setup
// we should consider instead using the require flag per the open telemetry instructions.
// this may be viable if we provide a standard dockerfile with the correct command
import { initTelemetry } from "./instrumentation";
import { Connector } from "./connector";
import { Command, Option, InvalidOptionArgumentError } from "commander";
import { ServerOptions, start_server } from "./server";
import {
  ConfigurationServerOptions,
  start_configuration_server,
} from "./configuration_server";

export * from "./error";
export * from "./schema";
export { Connector, ServerOptions, ConfigurationServerOptions, start_configuration_server, start_server };

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
    .addOption(
      new Option("--otel-exporter-otlp-endpoint <endpoint>")
        .env("OTEL_EXPORTER_OTLP_ENDPOINT")
        .default("http://localhost:4318")
    )
    .addOption(
      new Option("--otel-service-name <name>")
        .env("OTEL_SERVICE_NAME")
        .default("hasura-ndc")
    )
    .addOption(
      new Option("--log-level <level>").env("LOG_LEVEL").default("info")
    )
    .addOption(
      new Option("--pretty-print-logs").env("PRETTY_PRINT_LOGS").default(false)
    );

  if (connector) {
    command.action(async (options: ServerOptions) => {
      initTelemetry(options.otelServiceName, options.otelExporterOtlpEndpoint);
      await start_server(connector, options);
    });
  }
  return command;
}

export function get_serve_configuration_command<
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
      await start_configuration_server(connector, options);
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
