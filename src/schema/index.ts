import { JSONSchemaObject } from "@json-schema-tools/meta-schema";
import schema from "./schema.generated.json";
import { VERSION } from "./version.generated";

function schemaForType(type_name: string): JSONSchemaObject {
  return {
    $schema: schema.$schema,
    $ref: `#/definitions/${type_name}`,
    definitions: schema.definitions
  }
}

const CapabilitiesResponseSchema = schemaForType("CapabilitiesResponse");
const SchemaResponseSchema = schemaForType("SchemaResponse");
const QueryRequestSchema = schemaForType("QueryRequest");
const QueryResponseSchema = schemaForType("QueryResponse");
const ExplainResponseSchema = schemaForType("ExplainResponse");
const MutationRequestSchema = schemaForType("MutationRequest");
const MutationResponseSchema = schemaForType("MutationResponse");
const ErrorResponseSchema = schemaForType("ErrorResponse");
const ValidateResponseSchema = schemaForType("ValidateResponse");

export * from "./schema.generated";
export {
  CapabilitiesResponseSchema,
  SchemaResponseSchema,
  QueryRequestSchema,
  QueryResponseSchema,
  ExplainResponseSchema,
  MutationRequestSchema,
  MutationResponseSchema,
  ErrorResponseSchema,
  ValidateResponseSchema,
  VERSION,
};
