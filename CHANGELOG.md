# NDC TypeScript SDK Changelog

## Unreleased changes

## [8.0.0-rc.1] - 2025-01-30
- Updated to support the latest release candidate (rc.3) of [v0.2.0 of the NDC Spec](https://hasura.github.io/ndc-spec/specification/changelog.html#020)

## [8.0.0-rc.0] - 2025-01-08
**Breaking changes** ([#39](https://github.com/hasura/ndc-sdk-typescript/pull/39), [#40](https://github.com/hasura/ndc-sdk-typescript/pull/40)):
- Updated to support [v0.2.0 of the NDC Spec](https://hasura.github.io/ndc-spec/specification/changelog.html#020). This is a very large update which adds new features and some breaking changes.
- If the [`X-Hasura-NDC-Version`](https://hasura.github.io/ndc-spec/specification/versioning.html) header is sent, the SDK will validate that the connector supports the incoming request's version and reject it if it does not. If no header is sent, no action is taken.

## [7.0.0] - 2024-09-20
- Added support for exporting OpenTelemetry traces and metrics over GRPC. A new environment variable `OTEL_EXPORTER_OTLP_PROTOCOL` lets you switch between `http/protobuf` and `grpc`.
  - **Breaking change**: the default OpenTelemetry exporter has changed from `http/protobuf` sending to `http://localhost:4318` to `grpc` sending to `http://localhost:4317`. To return to the old defaults, set the following environment variables:
    - `OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"`
    - `OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318"`

## [6.1.0] - 2024-08-26
- Updated to support [v0.1.6 of the NDC Spec](https://hasura.github.io/ndc-spec/specification/changelog.html#016) ([#37](https://github.com/hasura/ndc-sdk-typescript/pull/37))
  - Support for [querying nested collections](https://hasura.github.io/ndc-spec/specification/queries/filtering.html#nested-collections) inside an EXISTS expression in a predicate

## [6.0.0] - 2024-08-08
Breaking changes ([#36](https://github.com/hasura/ndc-sdk-typescript/pull/36)):
- `Connector.healthCheck` has been removed and replaced with `Connector.getHealthReadiness`, which only returns whether the connector is able to accept requests, not whether any underlying connections to data sources actually work.
- The `/health` endpoint is now unauthorized, allowing healthchecks to be performed without authorization.
- `Connector.getCapabilities` now returns `Capabilities` instead of `CapabilitiesResponse`. The SDK will now take care of adding the correct NDC version to the `Capabilities` on behalf of the connector.

## [5.2.0] - 2024-07-30
- The connector now listens on both ipv4 and ipv6 interfaces by default. This can be configured by using the `HASURA_CONNECTOR_HOST` environment variable, which sets the host the web server listens on. ([#34](https://github.com/hasura/ndc-sdk-typescript/pull/34))
- Updated to support [v0.1.5 of the NDC Spec](https://hasura.github.io/ndc-spec/specification/changelog.html#015) ([#35](https://github.com/hasura/ndc-sdk-typescript/pull/35))
  - There are no real changes in this version; it is a version number-only change

## [5.1.0] - 2024-06-19
- Updated to support [v0.1.4 of the NDC Spec](https://hasura.github.io/ndc-spec/specification/changelog.html#014) ([#33](https://github.com/hasura/ndc-sdk-typescript/pull/33))
  - Support for [aggregates](https://hasura.github.io/ndc-spec/specification/queries/aggregates.html) over nested fields

## [5.0.0] - 2024-05-31
- Updated to support [v0.1.3 of the NDC Spec](https://hasura.github.io/ndc-spec/specification/changelog.html#013) ([#32](https://github.com/hasura/ndc-sdk-typescript/pull/32))
  - Breaking change: new `nested_fields` property on `QueryCapabilities`; set it to `{}` to retain previous v0.1.2 semantics and not support new v0.1.3 capabilities.
  - Support [field arguments](https://hasura.github.io/ndc-spec/specification/queries/arguments.html#field-arguments)
  - Support [filtering](https://hasura.github.io/ndc-spec/specification/queries/filtering.html#referencing-nested-fields-within-columns) and [ordering](https://hasura.github.io/ndc-spec/specification/queries/sorting.html#type-column) by nested fields
  - Added a [`biginteger` type representation](https://hasura.github.io/ndc-spec/specification/schema/scalar-types.html#type-representations)

## [4.6.0] - 2024-04-17
- Use [`prom-client`](https://github.com/siimon/prom-client) to implement the metrics endpoint ([#29](https://github.com/hasura/ndc-sdk-typescript/pull/29))
- Allow any error code in custom HTTP responses ([#30](https://github.com/hasura/ndc-sdk-typescript/pull/30))

## [4.5.0] - 2024-04-17
- Support [b3](https://github.com/open-telemetry/opentelemetry-js/tree/main/packages/opentelemetry-propagator-b3#b3-formats) (zipkin) OpenTelemetry trace propagation headers ([#28](https://github.com/hasura/ndc-sdk-typescript/pull/28))

## [4.4.0] - 2024-04-05
- Updated to support [v0.1.2 of the NDC Spec](https://hasura.github.io/ndc-spec/specification/changelog.html#012)
  - More precise [type representations](https://hasura.github.io/ndc-spec/specification/schema/scalar-types.html#type-representations) of scalar types were added and the general numeric ones were deprecated (`number` and `integer`)

## [4.3.0] - 2024-03-26
- Updated to support [v0.1.1 of the NDC Spec](https://hasura.github.io/ndc-spec/specification/changelog.html#011)
  - A more [precise definition of equality operators](https://hasura.github.io/ndc-spec/specification/schema/scalar-types.html#note-syntactic-equality)
  - Scalar types can now [specify a representation](https://hasura.github.io/ndc-spec/specification/schema/scalar-types.html#type-representations), including an enum representation

## [4.2.1] - 2024-02-28
- Add `main` and `types` properties to the `package.json` to enable `node10` module resolution to be used by projects using legacy TypeScript compiler settings

## [4.2.0] - 2024-02-23
- OpenTelemetry spans are now attributed with `internal.visibility: "user"` so that they show up in the Hasura Console
- `@hasura/ndc-sdk-typescript/instrumentation` now exports `withActiveSpan` to wrap a span around a function and `withInternalActiveSpan` which does the same but without the `internal.visibility: "user"` attribute.
- Automatic OpenTelemetry instrumentation for fetch requests has been added

## [4.1.0] - 2024-02-21
- Add OpenTelemetry support
  - Set env var `OTEL_EXPORTER_OTLP_ENDPOINT` to the endpoint to send OpenTelemetry to
  - `OTEL_SERVICE_NAME` overrides the service name
  - Command line arguments `--otlp-endpoint` and `--service-name` have been removed in favour of the environment variables
  - Import `@hasura/ndc-sdk-typescript/instrumentation` to use `initTelemetry` to initialize OpenTelemetry earlier in your startup, if necessary

## [1.3.0] - 2024-02-21
- Add OpenTelemetry support
  - Set env var `OTEL_EXPORTER_OTLP_ENDPOINT` to the endpoint to send OpenTelemetry to
  - `OTEL_SERVICE_NAME` overrides the service name
  - Command line arguments `--otlp_endpoint` and `--service-name` have been removed in favour of the environment variables
  - Import `@hasura/ndc-sdk-typescript/instrumentation` to use `initTelemetry` to initialize OpenTelemetry earlier in your startup, if necessary

## [4.0.0] - 2024-02-19
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

## [3.0.0] - 2024-02-13
Breaking change: support for the [v0.1.0-rc.15 of NDC Spec](https://github.com/hasura/ndc-spec/compare/v0.1.0-rc.14...v0.1.0-rc.15).

- The [mutation request/response format has changed](https://github.com/hasura/ndc-spec/pull/90).
  - `MutationOperation` fields are now defined as a `NestedField`
  - `MutationOperationResponse` now returns a single value rather than a rowset

## [2.0.0] - 2024-02-05
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

## [1.2.8] - 2024-01-18
- Add new `ConnectorError` types:
  - `UnprocessableContent`: The request could not be handled because, while the request was well-formed, it was not semantically correct. For example, a value for a custom scalar type was provided, but with an incorrect type
  - `BadGateway`: The request could not be handled because an upstream service was unavailable or returned an unexpected response, e.g., a connection to a database server failed
- Generate TypeScript declaration maps for better "go to definition" tooling

## [1.2.7] - 2023-12-21
- `get_serve_command` and `get_serve_configuration_command` now support creation without
  automatically starting servers. This allows usage in scenarios where a customized server startup
  is desired.

## [1.2.6] - 2023-12-15
- added auth hook using secret token
