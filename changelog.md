# Changelog

## 1.3.0
- Add OpenTelemetry support
  - Set env var `OTEL_EXPORTER_OTLP_ENDPOINT` to the endpoint to send OpenTelemetry to
  - `OTEL_SERVICE_NAME` overrides the service name
  - Command line arguments `--otlp_endpoint` and `--service-name` have been removed in favour of the environment variables
  - Import `@hasura/ndc-sdk-typescript/instrumentation` to use `initTelemetry` to initialize OpenTelemetry earlier in your startup, if necessary

## 1.2.8
- Add new `ConnectorError` types:
  - `UnprocessableContent`: The request could not be handled because, while the request was well-formed, it was not semantically correct. For example, a value for a custom scalar type was provided, but with an incorrect type
  - `BadGateway`: The request could not be handled because an upstream service was unavailable or returned an unexpected response, e.g., a connection to a database server failed
- Generate TypeScript declaration maps for better "go to definition" tooling

## 1.2.7

- `get_serve_command` and `get_serve_configuration_command` now support creation without
  automatically starting servers. This allows usage in scenarios where a customized server startup
  is desired.

## 1.2.6

- added auth hook using secret token
