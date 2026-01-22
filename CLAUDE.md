# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is the Native Data Connector (NDC) SDK for TypeScript, used to build Hasura data connectors. The SDK provides the server infrastructure, types, and utilities to implement the [NDC Spec](https://hasura.github.io/ndc-spec/).

## Build Commands

```bash
npm install    # Install dependencies
npm run build  # Compile TypeScript to dist/
```

There are no tests configured in this repository (`npm test` exits with an error).

## Regenerating Schema Types

The NDC spec types are generated from Rust types in `ndc-models`. This requires Rust/Cargo:

```bash
npm run regenerate-schema  # Runs typegen/regenerate-schema.sh
```

This generates:
- `src/schema/schema.generated.json` - JSON schema from Rust types via `typegen/src/main.rs`
- `src/schema/schema.generated.ts` - TypeScript types from JSON schema
- `src/schema/version.generated.ts` - VERSION and VERSION_HEADER_NAME constants

A patch file (`src/schema/schema.generated.ts.patch`) is automatically applied to fix type generation issues.

## Architecture

### Entry Point
`src/index.ts` exports the `start()` function which is the main entry point for connector implementations. It uses Commander.js to parse CLI args and environment variables, then starts a Fastify server.

### Connector Interface (`src/connector.ts`)
Connectors implement the `Connector<Configuration, State>` interface with these methods:
- `parseConfiguration(configurationDir)` - Load and validate configuration
- `tryInitState(configuration, metrics)` - Initialize connector state and register Prometheus metrics
- `getCapabilities(configuration)` - Return connector capabilities (synchronous)
- `getSchema(configuration)` - Return the connector's schema
- `query(configuration, state, request)` - Execute queries
- `mutation(configuration, state, request)` - Execute mutations
- `queryExplain/mutationExplain` - Generate execution plans
- `fetchMetrics(configuration, state)` - Update metrics
- `getHealthReadiness(configuration, state)` - Optional health check

### Server (`src/server.ts`)
Fastify-based HTTP server exposing NDC endpoints:
- `GET /capabilities` - Returns version and capabilities
- `GET /schema` - Returns the schema
- `POST /query` - Execute queries
- `POST /mutation` - Execute mutations
- `POST /query/explain`, `POST /mutation/explain` - Explain endpoints
- `GET /health`, `GET /metrics` - Health and Prometheus metrics

The server handles authorization via `HASURA_SERVICE_TOKEN_SECRET` and validates NDC version compatibility via the `X-Hasura-NDC-Version` header.

### Error Handling (`src/error.ts`)
`ConnectorError` is the base class. Convenience subclasses map to HTTP status codes:
- `BadRequest` (400), `Forbidden` (403), `Conflict` (409), `UnprocessableContent` (422)
- `InternalServerError` (500), `NotSupported` (501), `BadGateway` (502)

### Telemetry (`src/instrumentation.ts`)
OpenTelemetry is auto-initialized on SDK import. Supports GRPC and HTTP/protobuf protocols. Use `withActiveSpan()` to create user-visible spans.

Key environment variables:
- `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_PROTOCOL`
- `HASURA_CONNECTOR_NAME`, `HASURA_CONNECTOR_VERSION`

### Schema Types (`src/schema/`)
All NDC spec types are generated and exported from `schema.generated.ts`. The `index.ts` creates JSON schema wrappers used by Fastify for request/response validation.

## Code Quality Guidelines

- **Avoid `any` types** - Use proper TypeScript types instead of `any`. Leverage the generated types from `src/schema/schema.generated.ts` for NDC spec types. Create properly typed functions rather than using type casts with `any`.

## Runtime Configuration

Environment variables / CLI options for connector servers:
- `HASURA_CONFIGURATION_DIRECTORY` / `--configuration` (required)
- `HASURA_CONNECTOR_HOST` / `--host` (default: "::")
- `HASURA_CONNECTOR_PORT` / `--port` (default: 8080)
- `HASURA_SERVICE_TOKEN_SECRET` / `--service-token-secret`
- `HASURA_LOG_LEVEL` / `--log-level` (default: "info")
- `HASURA_PRETTY_PRINT_LOGS` / `--pretty-print-logs`

## Publishing

Push a version tag (e.g., `v8.2.0`) that matches `package.json` version to trigger NPM publish via GitHub Actions. The release notes are read from CHANGELOG.md.
