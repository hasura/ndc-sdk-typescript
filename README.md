# Native Data Connector SDK for TypeScript

This SDK is mostly analogous to the Rust SDK, except where necessary.

All functions of the Connector interface are analogous to their Rust counterparts.

## Installing

### From NPM

```sh
npm install @hasura/ndc-sdk-typescript
```

### From this repo:

The repo does not include build artifacts, so you'll need to run the build step:

```sh
npm install https://github.com/hasura/ndc-sdk-typescript

cd node_modules/ndc-sdk-typescript

npm install

npm run build
```

## Using this SDK

The SDK exports a `start` function, which takes a `connector` object, that is an object that implements the `Connector` interface defined in `connector.ts`

This function should be your starting point.

A connector can thus start liks so:

```ts
const connector: Connector = {
  /* implementation of the Connector interface removed for brevity */
};

start(connector);
```

Please refer to the [NDC Spec](https://hasura.github.io/ndc-spec/) for details on implementing the Connector interface.

## Publishing a new version of the SDK to NPM

Pushing a new version tag will automatically publish the tag to NPM provided that it matches the version specified in `package.json`.

See `.github/workflows/build_test_publish.yaml` for details.

## Regenerating Schema Types
The NDC spec types are generated from the NDC Spec Rust types. First, a JSON schema is derived from the Rust types into `./src/schema/schema.generated.json` (see `./typegen/src/main.rs`).

Then the TypeScript types are generated from that JSON Schema document into `./src/schema/schema.generated.ts`.

In order to regenerate the types, run
```
> npm run regenerate-schema
```
