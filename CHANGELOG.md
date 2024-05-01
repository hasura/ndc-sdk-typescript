# Changelog

## 4.6.0
- Use [`prom-client`](https://github.com/siimon/prom-client) to implement the metrics endpoint ([#29](https://github.com/hasura/ndc-sdk-typescript/pull/29))
- Allow any error code in custom HTTP responses ([#30](https://github.com/hasura/ndc-sdk-typescript/pull/30))

## 4.5.0
- Support [b3](https://github.com/open-telemetry/opentelemetry-js/tree/main/packages/opentelemetry-propagator-b3#b3-formats) (zipkin) OpenTelemetry trace propagation headers ([#28](https://github.com/hasura/ndc-sdk-typescript/pull/28))

## 4.4.0
- Updated to support [v0.1.2 of the NDC Spec](https://hasura.github.io/ndc-spec/specification/changelog.html#012)
  - More precise [type representations](https://hasura.github.io/ndc-spec/specification/schema/scalar-types.html#type-representations) of scalar types were added and the general numeric ones were deprecated (`number` and `integer`)

## 4.3.0
- Updated to support [v0.1.1 of the NDC Spec](https://hasura.github.io/ndc-spec/specification/changelog.html#011)
  - A more [precise definition of equality operators](https://hasura.github.io/ndc-spec/specification/schema/scalar-types.html#note-syntactic-equality)
  - Scalar types can now [specify a representation](https://hasura.github.io/ndc-spec/specification/schema/scalar-types.html#type-representations), including an enum representation

## 4.2.1
- Add `main` and `types` properties to the `package.json` to enable `node10` module resolution to be used by projects using legacy TypeScript compiler settings

## 4.2.0
- OpenTelemetry spans are now attributed with `internal.visibility: "user"` so that they show up in the Hasura Console
- `@hasura/ndc-sdk-typescript/instrumentation` now exports `withActiveSpan` to wrap a span around a function and `withInternalActiveSpan` which does the same but without the `internal.visibility: "user"` attribute.
- Automatic OpenTelemetry instrumentation for fetch requests has been added

## 4.1.0
- Add OpenTelemetry support
  - Set env var `OTEL_EXPORTER_OTLP_ENDPOINT` to the endpoint to send OpenTelemetry to
  - `OTEL_SERVICE_NAME` overrides the service name
  - Command line arguments `--otlp-endpoint` and `--service-name` have been removed in favour of the environment variables
  - Import `@hasura/ndc-sdk-typescript/instrumentation` to use `initTelemetry` to initialize OpenTelemetry earlier in your startup, if necessary

## 1.3.0
- Add OpenTelemetry support
  - Set env var `OTEL_EXPORTER_OTLP_ENDPOINT` to the endpoint to send OpenTelemetry to
  - `OTEL_SERVICE_NAME` overrides the service name
  - Command line arguments `--otlp_endpoint` and `--service-name` have been removed in favour of the environment variables
  - Import `@hasura/ndc-sdk-typescript/instrumentation` to use `initTelemetry` to initialize OpenTelemetry earlier in your startup, if necessary

## 4.0.0
Breaking change: support for the [Connector Deployment Spec](https://github.com/hasura/ndc-hub/blob/main/rfcs/0000-deployment.md).

- The connector configuration server has been removed
- The way configuration is handled on `Connector` interface has changed
  - `getRawConfigurationSchema`, `makeEmptyConfiguration`, `updateConfiguration` have been removed.
  - `parseConfiguation` replaces `validateRawConfiguration`, and is given the directory path in which the connector's configuration files can be found
  - The `RawConfiguration` type parameter has been removed
- The default port has changed from 8100 to 8080
- The command line arguments passed to the `serve` command have changed:
  - The `--configuration` argument now takes the connector's configuration directory. Its associated environment variable is now `HASURA_CONFIGURATION_DIRECTORY`
  - The `--otlp_endpoint` argument has been renamed to `--otlp-endpoint` and its environment variable is now `OTEL_EXPORTER_OTLP_ENDPOINT`
  - The `PORT` environment variable has changed to `HASURA_CONNECTOR_PORT`
  - The `SERVICE_TOKEN_SECRET` environment variable has changed to `HASURA_SERVICE_TOKEN_SECRET`
  - The `LOG_LEVEL` environment variable has changed to `HASURA_LOG_LEVEL`
  - The `PRETTY_PRINT_LOGS` environment variable has changed to `HASURA_PRETTY_PRINT_LOGS`

## 3.0.0
Breaking change: support for the [v0.1.0-rc.15 of NDC Spec](https://github.com/hasura/ndc-spec/compare/v0.1.0-rc.14...v0.1.0-rc.15).

- The [mutation request/response format has changed](https://github.com/hasura/ndc-spec/pull/90).
  - `MutationOperation` fields are now defined as a `NestedField`
  - `MutationOperationResponse` now returns a single value rather than a rowset

## 2.0.0
Breaking change: support for the [v0.1.0-rc.14 of NDC Spec](https://github.com/hasura/ndc-spec/compare/v0.1.0-rc.13...v0.1.0-rc.14).

- Function name formatting is now standard JavaScript `camelCase`. NDC types used for wire-transmission match the spec (snake_cased).
- Added [nested field selections](https://github.com/hasura/ndc-spec/pull/70) (`Field.fields`)
- Capabilities now only specifies [a single supported version](https://github.com/hasura/ndc-spec/pull/82) (`CapabilitiesResponse.version`)
- `Expression.where` [renamed](https://github.com/hasura/ndc-spec/pull/87) to `Expression.predicate`
- `PathElement.predicate` is now [optional](https://github.com/hasura/ndc-spec/pull/87)
- Added [Predicate types](https://github.com/hasura/ndc-spec/blob/main/rfcs/0002-boolean-expression-types.md) (new `predicate` Type.type)
- Added [mutation capability](https://github.com/hasura/ndc-spec/pull/80)
- Comparison operators
- [Changes to explain](https://github.com/hasura/ndc-spec/pull/85):
  - `Connector.explain` renamed to `Connector.queryExplain` and endpoint moved from `/explain` to `/query/explain`.
  - `Connector.mutationExplain` added with endpoint `/mutation/explain`.
  - `explain` capability moved to `query.explain`. `mutation.explain` capability added.
- `ComparisonOperatorDefinition` now has `equal` and `in` as [two standard definitions](https://github.com/hasura/ndc-spec/pull/79/files) and custom operators can be defined. The equality operator is no longer required to be defined and must be explicitly defined.

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
