/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * Representations of scalar types
 */
export type TypeRepresentation =
  | {
      type: "boolean";
    }
  | {
      type: "string";
    }
  | {
      /** @deprecated since NDC Spec v0.1.2 - use sized numeric types instead */ // Manually added :(
      type: "number";
    }
  | {
      /** @deprecated since NDC Spec v0.1.2 - use sized numeric types instead */ // Manually added :(
      type: "integer";
    }
  | {
      type: "int8";
    }
  | {
      type: "int16";
    }
  | {
      type: "int32";
    }
  | {
      type: "int64";
    }
  | {
      type: "float32";
    }
  | {
      type: "float64";
    }
  | {
      type: "biginteger";
    }
  | {
      type: "bigdecimal";
    }
  | {
      type: "uuid";
    }
  | {
      type: "date";
    }
  | {
      type: "timestamp";
    }
  | {
      type: "timestamptz";
    }
  | {
      type: "geography";
    }
  | {
      type: "geometry";
    }
  | {
      type: "bytes";
    }
  | {
      type: "json";
    }
  | {
      type: "enum";
      one_of: string[];
    };
/**
 * Types track the valid representations of values as JSON
 */
export type Type =
  | {
      type: "named";
      /**
       * The name can refer to a primitive type or a scalar type
       */
      name: string;
    }
  | {
      type: "nullable";
      /**
       * The type of the non-null inhabitants of this type
       */
      underlying_type: Type;
    }
  | {
      type: "array";
      /**
       * The type of the elements of the array
       */
      element_type: Type;
    }
  | {
      type: "predicate";
      /**
       * The object type name
       */
      object_type_name: string;
    };
/**
 * The definition of a comparison operator on a scalar type
 */
export type ComparisonOperatorDefinition =
  | {
      type: "equal";
    }
  | {
      type: "in";
    }
  | {
      type: "custom";
      /**
       * The type of the argument to this operator
       */
      argument_type: Type;
    };
export type Aggregate =
  | {
      type: "column_count";
      /**
       * The column to apply the count aggregate function to
       */
      column: string;
      /**
       * Whether or not only distinct items should be counted
       */
      distinct: boolean;
    }
  | {
      type: "single_column";
      /**
       * The column to apply the aggregation function to
       */
      column: string;
      /**
       * Single column aggregate function name.
       */
      function: string;
    }
  | {
      type: "star_count";
    };
export type Field =
  | {
      type: "column";
      column: string;
      /**
       * When the type of the column is a (possibly-nullable) array or object, the caller can request a subset of the complete column data, by specifying fields to fetch here. If omitted, the column data will be fetched in full.
       */
      fields?: NestedField | null;
      arguments?: {
        [k: string]: Argument;
      };
    }
  | {
      type: "relationship";
      query: Query;
      /**
       * The name of the relationship to follow for the subquery
       */
      relationship: string;
      /**
       * Values to be provided to any collection arguments
       */
      arguments: {
        [k: string]: RelationshipArgument;
      };
    };
export type NestedField = NestedObject | NestedArray;
export type Argument =
  | {
      type: "variable";
      name: string;
    }
  | {
      type: "literal";
      value: unknown;
    };
export type RelationshipArgument =
  | {
      type: "variable";
      name: string;
    }
  | {
      type: "literal";
      value: unknown;
    }
  | {
      type: "column";
      name: string;
    };
export type OrderDirection = "asc" | "desc";
export type OrderByTarget =
  | {
      type: "column";
      /**
       * The name of the column
       */
      name: string;
      /**
       * Path to a nested field within an object column
       */
      field_path?: string[] | null;
      /**
       * Any relationships to traverse to reach this column
       */
      path: PathElement[];
    }
  | {
      type: "single_column_aggregate";
      /**
       * The column to apply the aggregation function to
       */
      column: string;
      /**
       * Single column aggregate function name.
       */
      function: string;
      /**
       * Non-empty collection of relationships to traverse
       */
      path: PathElement[];
    }
  | {
      type: "star_count_aggregate";
      /**
       * Non-empty collection of relationships to traverse
       */
      path: PathElement[];
    };
export type Expression =
  | {
      type: "and";
      expressions: Expression[];
    }
  | {
      type: "or";
      expressions: Expression[];
    }
  | {
      type: "not";
      expression: Expression;
    }
  | {
      type: "unary_comparison_operator";
      column: ComparisonTarget;
      operator: UnaryComparisonOperator;
    }
  | {
      type: "binary_comparison_operator";
      column: ComparisonTarget;
      operator: string;
      value: ComparisonValue;
    }
  | {
      type: "exists";
      in_collection: ExistsInCollection;
      predicate?: Expression | null;
    };
export type ComparisonTarget =
  | {
      type: "column";
      /**
       * The name of the column
       */
      name: string;
      /**
       * Path to a nested field within an object column
       */
      field_path?: string[] | null;
      /**
       * Any relationships to traverse to reach this column
       */
      path: PathElement[];
    }
  | {
      type: "root_collection_column";
      /**
       * The name of the column
       */
      name: string;
      /**
       * Path to a nested field within an object column
       */
      field_path?: string[] | null;
    };
export type UnaryComparisonOperator = "is_null";
export type ComparisonValue =
  | {
      type: "column";
      column: ComparisonTarget;
    }
  | {
      type: "scalar";
      value: unknown;
    }
  | {
      type: "variable";
      name: string;
    };
export type ExistsInCollection =
  | {
      type: "related";
      relationship: string;
      /**
       * Values to be provided to any collection arguments
       */
      arguments: {
        [k: string]: RelationshipArgument;
      };
    }
  | {
      type: "unrelated";
      /**
       * The name of a collection
       */
      collection: string;
      /**
       * Values to be provided to any collection arguments
       */
      arguments: {
        [k: string]: RelationshipArgument;
      };
    };
export type RelationshipType = "object" | "array";
/**
 * Query responses may return multiple RowSets when using queries with variables. Else, there should always be exactly one RowSet
 */
export type QueryResponse = RowSet[];
export type MutationOperation = {
  type: "procedure";
  /**
   * The name of a procedure
   */
  name: string;
  /**
   * Any named procedure arguments
   */
  arguments: {
    [k: string]: unknown;
  };
  /**
   * The fields to return from the result, or null to return everything
   */
  fields?: NestedField | null;
};
export type MutationOperationResults = {
  type: "procedure";
  result: unknown;
};

export interface SchemaRoot {
  capabilities_response: CapabilitiesResponse;
  schema_response: SchemaResponse;
  query_request: QueryRequest;
  query_response: QueryResponse;
  mutation_request: MutationRequest;
  mutation_response: MutationResponse;
  explain_response: ExplainResponse;
  error_response: ErrorResponse;
  validate_response: ValidateResponse;
}
export interface CapabilitiesResponse {
  version: string;
  capabilities: Capabilities;
}
/**
 * Describes the features of the specification which a data connector implements.
 */
export interface Capabilities {
  query: QueryCapabilities;
  mutation: MutationCapabilities;
  relationships?: RelationshipCapabilities | null;
}
export interface QueryCapabilities {
  /**
   * Does the connector support aggregate queries
   */
  aggregates?: LeafCapability | null;
  /**
   * Does the connector support queries which use variables
   */
  variables?: LeafCapability | null;
  /**
   * Does the connector support explaining queries
   */
  explain?: LeafCapability | null;
  /**
   * Does the connector support nested fields
   */
  nested_fields: NestedFieldCapabilities;
}
/**
 * A unit value to indicate a particular leaf capability is supported. This is an empty struct to allow for future sub-capabilities.
 */
export interface LeafCapability {}
export interface NestedFieldCapabilities {
  /**
   * Does the connector support filtering by values of nested fields
   */
  filter_by?: LeafCapability | null;
  /**
   * Does the connector support ordering by values of nested fields
   */
  order_by?: LeafCapability | null;
}
export interface MutationCapabilities {
  /**
   * Does the connector support executing multiple mutations in a transaction.
   */
  transactional?: LeafCapability | null;
  /**
   * Does the connector support explaining mutations
   */
  explain?: LeafCapability | null;
}
export interface RelationshipCapabilities {
  /**
   * Does the connector support comparisons that involve related collections (ie. joins)?
   */
  relation_comparisons?: LeafCapability | null;
  /**
   * Does the connector support ordering by an aggregated array relationship?
   */
  order_by_aggregate?: LeafCapability | null;
}
export interface SchemaResponse {
  /**
   * A list of scalar types which will be used as the types of collection columns
   */
  scalar_types: {
    [k: string]: ScalarType;
  };
  /**
   * A list of object types which can be used as the types of arguments, or return types of procedures. Names should not overlap with scalar type names.
   */
  object_types: {
    [k: string]: ObjectType;
  };
  /**
   * Collections which are available for queries
   */
  collections: CollectionInfo[];
  /**
   * Functions (i.e. collections which return a single column and row)
   */
  functions: FunctionInfo[];
  /**
   * Procedures which are available for execution as part of mutations
   */
  procedures: ProcedureInfo[];
}
/**
 * The definition of a scalar type, i.e. types that can be used as the types of columns.
 */
export interface ScalarType {
  /**
   * A description of valid values for this scalar type. Defaults to `TypeRepresentation::JSON` if omitted
   */
  representation?: TypeRepresentation | null;
  /**
   * A map from aggregate function names to their definitions. Result type names must be defined scalar types declared in ScalarTypesCapabilities.
   */
  aggregate_functions: {
    [k: string]: AggregateFunctionDefinition;
  };
  /**
   * A map from comparison operator names to their definitions. Argument type names must be defined scalar types declared in ScalarTypesCapabilities.
   */
  comparison_operators: {
    [k: string]: ComparisonOperatorDefinition;
  };
}
/**
 * The definition of an aggregation function on a scalar type
 */
export interface AggregateFunctionDefinition {
  /**
   * The scalar or object type of the result of this function
   */
  result_type: Type;
}
/**
 * The definition of an object type
 */
export interface ObjectType {
  /**
   * Description of this type
   */
  description?: string | null;
  /**
   * Fields defined on this object type
   */
  fields: {
    [k: string]: ObjectField;
  };
}
/**
 * The definition of an object field
 */
export interface ObjectField {
  /**
   * Description of this field
   */
  description?: string | null;
  /**
   * The type of this field
   */
  type: Type;
  /**
   * The arguments available to the field - Matches implementation from CollectionInfo
   */
  arguments?: {
    [k: string]: ArgumentInfo;
  };
}
export interface ArgumentInfo {
  /**
   * Argument description
   */
  description?: string | null;
  /**
   * The name of the type of this argument
   */
  type: Type;
}
export interface CollectionInfo {
  /**
   * The name of the collection
   *
   * Note: these names are abstract - there is no requirement that this name correspond to the name of an actual collection in the database.
   */
  name: string;
  /**
   * Description of the collection
   */
  description?: string | null;
  /**
   * Any arguments that this collection requires
   */
  arguments: {
    [k: string]: ArgumentInfo;
  };
  /**
   * The name of the collection's object type
   */
  type: string;
  /**
   * Any uniqueness constraints enforced on this collection
   */
  uniqueness_constraints: {
    [k: string]: UniquenessConstraint;
  };
  /**
   * Any foreign key constraints enforced on this collection
   */
  foreign_keys: {
    [k: string]: ForeignKeyConstraint;
  };
}
export interface UniquenessConstraint {
  /**
   * A list of columns which this constraint requires to be unique
   */
  unique_columns: string[];
}
export interface ForeignKeyConstraint {
  /**
   * The columns on which you want want to define the foreign key.
   */
  column_mapping: {
    [k: string]: string;
  };
  /**
   * The name of a collection
   */
  foreign_collection: string;
}
export interface FunctionInfo {
  /**
   * The name of the function
   */
  name: string;
  /**
   * Description of the function
   */
  description?: string | null;
  /**
   * Any arguments that this collection requires
   */
  arguments: {
    [k: string]: ArgumentInfo;
  };
  /**
   * The name of the function's result type
   */
  result_type: Type;
}
export interface ProcedureInfo {
  /**
   * The name of the procedure
   */
  name: string;
  /**
   * Column description
   */
  description?: string | null;
  /**
   * Any arguments that this collection requires
   */
  arguments: {
    [k: string]: ArgumentInfo;
  };
  /**
   * The name of the result type
   */
  result_type: Type;
}
/**
 * This is the request body of the query POST endpoint
 */
export interface QueryRequest {
  /**
   * The name of a collection
   */
  collection: string;
  /**
   * The query syntax tree
   */
  query: Query;
  /**
   * Values to be provided to any collection arguments
   */
  arguments: {
    [k: string]: Argument;
  };
  /**
   * Any relationships between collections involved in the query request
   */
  collection_relationships: {
    [k: string]: Relationship;
  };
  /**
   * One set of named variables for each rowset to fetch. Each variable set should be subtituted in turn, and a fresh set of rows returned.
   */
  variables?:
    | {
        [k: string]: unknown;
      }[]
    | null;
}
export interface Query {
  /**
   * Aggregate fields of the query
   */
  aggregates?: {
    [k: string]: Aggregate;
  } | null;
  /**
   * Fields of the query
   */
  fields?: {
    [k: string]: Field;
  } | null;
  /**
   * Optionally limit to N results
   */
  limit?: number | null;
  /**
   * Optionally offset from the Nth result
   */
  offset?: number | null;
  order_by?: OrderBy | null;
  predicate?: Expression | null;
}
export interface NestedObject {
  type: "object";
  fields: {
    [k: string]: Field;
  };
}
export interface NestedArray {
  type: "array";
  fields: NestedField;
}
export interface OrderBy {
  /**
   * The elements to order by, in priority order
   */
  elements: OrderByElement[];
}
export interface OrderByElement {
  order_direction: OrderDirection;
  target: OrderByTarget;
}
export interface PathElement {
  /**
   * The name of the relationship to follow
   */
  relationship: string;
  /**
   * Values to be provided to any collection arguments
   */
  arguments: {
    [k: string]: RelationshipArgument;
  };
  /**
   * A predicate expression to apply to the target collection
   */
  predicate?: Expression | null;
}
export interface Relationship {
  /**
   * A mapping between columns on the source collection to columns on the target collection
   */
  column_mapping: {
    [k: string]: string;
  };
  relationship_type: RelationshipType;
  /**
   * The name of a collection
   */
  target_collection: string;
  /**
   * Values to be provided to any collection arguments
   */
  arguments: {
    [k: string]: RelationshipArgument;
  };
}
export interface RowSet {
  /**
   * The results of the aggregates returned by the query
   */
  aggregates?: {
    [k: string]: unknown;
  } | null;
  /**
   * The rows returned by the query, corresponding to the query's fields
   */
  rows?:
    | {
        [k: string]: RowFieldValue;
      }[]
    | null;
}
export type RowFieldValue = unknown; // Manually corrected :(
export interface MutationRequest {
  /**
   * The mutation operations to perform
   */
  operations: MutationOperation[];
  /**
   * The relationships between collections involved in the entire mutation request
   */
  collection_relationships: {
    [k: string]: Relationship;
  };
}
export interface MutationResponse {
  /**
   * The results of each mutation operation, in the same order as they were received
   */
  operation_results: MutationOperationResults[];
}
export interface ExplainResponse {
  /**
   * A list of human-readable key-value pairs describing a query execution plan. For example, a connector for a relational database might return the generated SQL and/or the output of the `EXPLAIN` command. An API-based connector might encode a list of statically-known API calls which would be made.
   */
  details: {
    [k: string]: string;
  };
}
export interface ErrorResponse {
  /**
   * A human-readable summary of the error
   */
  message: string;
  /**
   * Any additional structured information about the error
   */
  details: {
    [k: string]: unknown;
  };
}
export interface ValidateResponse {
  schema: SchemaResponse;
  capabilities: CapabilitiesResponse;
  resolved_configuration: string;
}
