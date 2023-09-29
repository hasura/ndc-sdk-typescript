/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * Types track the valid representations of values as JSON
 */
export type Type =
  | {
      /**
       * The name can refer to a primitive type or a scalar type
       */
      name: string;
      type: "named";
    }
  | {
      type: "nullable";
      /**
       * The type of the non-null inhabitants of this type
       */
      underlying_type: Type;
    }
  | {
      /**
       * The type of the elements of the array
       */
      element_type: Type;
      type: "array";
    };

export interface SchemaResponse {
  /**
   * Collections which are available for queries and/or mutations
   */
  collections: CollectionInfo[];
  /**
   * Functions (i.e. collections which return a single column and row)
   */
  functions: FunctionInfo[];
  /**
   * A list of object types which can be used as the types of arguments, or return types of procedures. Names should not overlap with scalar type names.
   */
  object_types: {
    [k: string]: ObjectType;
  };
  /**
   * Procedures which are available for execution as part of mutations
   */
  procedures: ProcedureInfo[];
  /**
   * A list of scalar types which will be used as the types of collection columns
   */
  scalar_types: {
    [k: string]: ScalarType;
  };
}
export interface CollectionInfo {
  /**
   * Any arguments that this collection requires
   */
  arguments: {
    [k: string]: ArgumentInfo;
  };
  /**
   * Whether or not existing rows can be deleted from the collection
   */
  deletable: boolean;
  /**
   * Description of the collection
   */
  description?: string | null;
  /**
   * Any foreign key constraints enforced on this collection
   */
  foreign_keys: {
    [k: string]: ForeignKeyConstraint;
  };
  /**
   * The set of names of insertable columns, or null if inserts are not supported
   */
  insertable_columns?: string[] | null;
  /**
   * The name of the collection
   *
   * Note: these names are abstract - there is no requirement that this name correspond to the name of an actual collection in the database.
   */
  name: string;
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
   * The set of names of updateable columns, or null if updates are not supported
   */
  updatable_columns?: string[] | null;
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
export interface UniquenessConstraint {
  /**
   * A list of columns which this constraint requires to be unique
   */
  unique_columns: string[];
}
export interface FunctionInfo {
  /**
   * Any arguments that this collection requires
   */
  arguments: {
    [k: string]: ArgumentInfo;
  };
  /**
   * Description of the function
   */
  description?: string | null;
  /**
   * The name of the function
   */
  name: string;
  /**
   * The name of the function's result type
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
}
export interface ProcedureInfo {
  /**
   * Any arguments that this collection requires
   */
  arguments: {
    [k: string]: ArgumentInfo;
  };
  /**
   * Column description
   */
  description?: string | null;
  /**
   * The name of the procedure
   */
  name: string;
  /**
   * The name of the result type
   */
  result_type: Type;
}
/**
 * The definition of a scalar type, i.e. types that can be used as the types of columns.
 */
export interface ScalarType {
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
  /**
   * A map from update operator names to their definitions.
   */
  update_operators: {
    [k: string]: UpdateOperatorDefinition;
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
 * The definition of a comparison operator on a scalar type
 */
export interface ComparisonOperatorDefinition {
  /**
   * The type of the argument to this operator
   */
  argument_type: Type;
}
/**
 * The definition of an update operator on a scalar type
 */
export interface UpdateOperatorDefinition {
  /**
   * The type of the argument to this operator
   */
  argument_type: Type;
}
