/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export type Argument =
  | {
      name: string;
      type: "variable";
    }
  | {
      type: "literal";
      value: unknown;
    };
export type RelationshipArgument =
  | {
      name: string;
      type: "variable";
    }
  | {
      type: "literal";
      value: unknown;
    }
  | {
      name: string;
      type: "column";
    };
export type RelationshipType = "object" | "array";
export type Aggregate =
  | {
      /**
       * The column to apply the count aggregate function to
       */
      column: string;
      /**
       * Whether or not only distinct items should be counted
       */
      distinct: boolean;
      type: "column_count";
    }
  | {
      /**
       * The column to apply the aggregation function to
       */
      column: string;
      /**
       * Single column aggregate function name.
       */
      function: string;
      type: "single_column";
    }
  | {
      type: "star_count";
    };
export type Field =
  | {
      column: string;
      type: "column";
    }
  | {
      /**
       * Values to be provided to any collection arguments
       */
      arguments: {
        [k: string]: RelationshipArgument;
      };
      query: Query;
      /**
       * The name of the relationship to follow for the subquery
       */
      relationship: string;
      type: "relationship";
    };
export type OrderDirection = "asc" | "desc";
export type OrderByTarget =
  | {
      /**
       * The name of the column
       */
      name: string;
      /**
       * Any relationships to traverse to reach this column
       */
      path: PathElement[];
      type: "column";
    }
  | {
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
      type: "single_column_aggregate";
    }
  | {
      /**
       * Non-empty collection of relationships to traverse
       */
      path: PathElement[];
      type: "star_count_aggregate";
    };
export type Expression =
  | {
      expressions: Expression[];
      type: "and";
    }
  | {
      expressions: Expression[];
      type: "or";
    }
  | {
      expression: Expression;
      type: "not";
    }
  | {
      column: ComparisonTarget;
      operator: UnaryComparisonOperator;
      type: "unary_comparison_operator";
    }
  | {
      column: ComparisonTarget;
      operator: BinaryComparisonOperator;
      type: "binary_comparison_operator";
      value: ComparisonValue;
    }
  | {
      column: ComparisonTarget;
      operator: BinaryArrayComparisonOperator;
      type: "binary_array_comparison_operator";
      values: ComparisonValue[];
    }
  | {
      in_collection: ExistsInCollection;
      type: "exists";
      where: Expression;
    };
export type ComparisonTarget =
  | {
      /**
       * The name of the column
       */
      name: string;
      /**
       * Any relationships to traverse to reach this column
       */
      path: PathElement[];
      type: "column";
    }
  | {
      /**
       * The name of the column
       */
      name: string;
      type: "root_collection_column";
    };
export type UnaryComparisonOperator = "is_null";
export type BinaryComparisonOperator =
  | {
      type: "equal";
    }
  | {
      name: string;
      type: "other";
    };
export type ComparisonValue =
  | {
      column: ComparisonTarget;
      type: "column";
    }
  | {
      type: "scalar";
      value: unknown;
    }
  | {
      name: string;
      type: "variable";
    };
export type BinaryArrayComparisonOperator = "in";
export type ExistsInCollection =
  | {
      /**
       * Values to be provided to any collection arguments
       */
      arguments: {
        [k: string]: RelationshipArgument;
      };
      relationship: string;
      type: "related";
    }
  | {
      /**
       * Values to be provided to any collection arguments
       */
      arguments: {
        [k: string]: RelationshipArgument;
      };
      /**
       * The name of a collection
       */
      collection: string;
      type: "unrelated";
    };

/**
 * This is the request body of the query POST endpoint
 */
export interface QueryRequest {
  /**
   * Values to be provided to any collection arguments
   */
  arguments: {
    [k: string]: Argument;
  };
  /**
   * The name of a collection
   */
  collection: string;
  /**
   * Any relationships between collections involved in the query request
   */
  collection_relationships: {
    [k: string]: Relationship;
  };
  /**
   * The query syntax tree
   */
  query: Query;
  /**
   * One set of named variables for each rowset to fetch. Each variable set should be subtituted in turn, and a fresh set of rows returned.
   */
  variables?:
    | {
        [k: string]: unknown;
      }[]
    | null;
}
export interface Relationship {
  /**
   * Values to be provided to any collection arguments
   */
  arguments: {
    [k: string]: RelationshipArgument;
  };
  /**
   * A mapping between columns on the source collection to columns on the target collection
   */
  column_mapping: {
    [k: string]: string;
  };
  relationship_type: RelationshipType;
  /**
   * The name of the collection or object type which is the source of this relationship
   */
  source_collection_or_type: string;
  /**
   * The name of a collection
   */
  target_collection: string;
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
  where?: Expression | null;
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
   * Values to be provided to any collection arguments
   */
  arguments: {
    [k: string]: RelationshipArgument;
  };
  /**
   * A predicate expression to apply to the target collection
   */
  predicate: Expression;
  /**
   * The name of the relationship to follow
   */
  relationship: string;
}