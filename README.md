# Native Data Connector SDK for TypeScript

This SDK is mostly analogous to the Rust SDK, except where necessary.

All functions of the Connector interface are analogous to their Rust counterparts, with the addition of `get_configuration_schema` which does exactly what it sounds like.

## Installing

### From NPM

Note: not yet available!

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

```sh
npm run build
```

???
