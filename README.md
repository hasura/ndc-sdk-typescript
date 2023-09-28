# Native Data Connector SDK for TypeScript

This SDK is mostly analogous to the Rust SDK, except where necessary.

All functions of the Connector interface are analogous to their Rust counterparts, with the addition of `get_configuration_schema` which does exactly what it sounds like.

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
