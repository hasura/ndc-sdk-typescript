#!/usr/bin/env bash
set -eu -o pipefail

# Generate JSON schema from Rust types
cargo run -- ./src/schema

# Generate TypeScript types from JSON schema
json2ts -i ./src/schema/schema.generated.json -o ./src/schema/schema.generated.ts --no-additionalProperties
echo './src/schema/schema.generated.ts generated'

# Unfortunately we have a manual patch of the generated types in place
# to fix a type generation issue. This applies that patch
git add ./src/schema/schema.generated.ts
git apply --3way ./src/schema/schema.generated.ts.patch
