import { writeFileSync } from "fs";
import { compileFromFile } from "json-schema-to-typescript";

const schemas = [
  "CapabilitiesResponse",
  "SchemaResponse",
  "QueryRequest",
  "QueryResponse",
  "ErrorResponse",
  "ExplainResponse",
  "MutationRequest",
  "MutationResponse",
];

async function generate() {
  console.log("Generating types...");
  for (const schema of schemas) {
    writeFileSync(
      `../../src/generated/typescript/${schema}.ts`,
      await compileFromFile(
        `../../src/generated/json_schema/${schema}.schema.json`,
        {
          additionalProperties: false,
        }
      )
    );
  }
  console.log("done!");
}

generate();
