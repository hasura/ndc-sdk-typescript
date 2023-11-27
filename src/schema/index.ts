import { JSONSchemaObject } from "@json-schema-tools/meta-schema";
import schema from "./schema.generated.json";

function schema_for_type(type_name: string): JSONSchemaObject {
  return {
    $schema: schema.$schema,
    $ref: `#/definitions/${type_name}`,
    definitions: schema.definitions
  }
}

const CapabilitiesResponseSchema = schema_for_type("CapabilitiesResponse");
const SchemaResponseSchema = schema_for_type("SchemaResponse");
const QueryRequestSchema = schema_for_type("QueryRequest");
const QueryResponseSchema = schema_for_type("QueryResponse");
const ExplainResponseSchema = schema_for_type("ExplainResponse");
const MutationRequestSchema = schema_for_type("MutationRequest");
const MutationResponseSchema = schema_for_type("MutationResponse");
const ErrorResponseSchema = schema_for_type("ErrorResponse");
const ValidateResponseSchema = schema_for_type("ValidateResponse");

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
  ValidateResponseSchema
};
