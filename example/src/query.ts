import {
  Aggregate,
  BadRequest,
  ConnectorError,
  Query,
  QueryRequest,
  QueryResponse,
  Relationship,
  RowSet,
} from "ndc-sdk-typescript";
import * as db from "./db";

export async function handleQuery(
  request: QueryRequest
): Promise<QueryResponse> {
  if (request.variables && request.variables.length > 0) {
    return request.variables.map((varset) => {
      return resolveQuery(
        request.query,
        request.collection,
        undefined,
        varset,
        request
      );
    });
  } else {
    return [
      resolveQuery(request.query, request.collection, undefined, {}, request),
    ];
  }
}

function resolveQuery(
  query: Query,
  collection: string,
  relationshipFilter: ((row: unknown) => boolean) | undefined,
  varset: { [k: string]: unknown },
  request: QueryRequest
): RowSet {
  if (!(collection in db)) {
    throw new BadRequest(`Collection ${collection} not found in db`);
  }

  const baseRows = db[collection].filter((row) => {
    // apply relationship filter, if any
    if (relationshipFilter !== undefined && !relationshipFilter(row)) {
      return false;
    }
    // todo: filtering based on where clause
    return true;
  });

  const aggregates = query.aggregates ? {} : undefined;
  if (aggregates) {
    for (const alias in query.aggregates) {
      aggregates[alias] = resolveAggregate(baseRows, query.aggregates[alias]);
    }
  }

  const rows = query.fields
    ? baseRows.map((row) => {
        const rowObj = {};

        for (const alias in query.fields) {
          const field = query.fields[alias];

          switch (field.type) {
            case "column":
              rowObj[alias] = row[field.column];
              break;
            case "relationship":
              const relationship =
                request.collection_relationships[field.relationship];

              const relationshipFilter = (childRow) => {
                for (const left in relationship.column_mapping) {
                  const right = relationship.column_mapping[left];

                  if (row[left] !== childRow[right]) {
                    return false;
                  }
                }

                return true;
              };

              rowObj[alias] = resolveQuery(
                field.query,
                relationship.target_collection,
                relationshipFilter,
                varset,
                request
              );
              break;
          }
        }

        return rowObj;
      })
    : undefined;

  return {
    aggregates,
    rows,
  };
}

function resolveAggregate(baseRows: any[], aggregate: Aggregate) {
  const aggregate_type = aggregate.type;
  switch (aggregate_type) {
    case "star_count":
      return baseRows.length;
    case "column_count":
      if (aggregate.distinct) {
        const nonNullValues = baseRows
          .map((row) => row[aggregate.column])
          .filter((column) => column !== null);
        return new Set(nonNullValues).size;
      } else {
        return baseRows.filter((row) => row[aggregate.column] !== null).length;
      }
    case "single_column":
      switch (aggregate.function) {
        case "max": {
          const values = baseRows.map((row) => row[aggregate.column]);
          return Math.max(...values);
        }
        case "min": {
          const values = baseRows.map((row) => row[aggregate.column]);
          return Math.min(...values);
        }
        default:
          throw new BadRequest(
            `Unknown single column aggregate function ${aggregate.function}`
          );
      }
    default:
      throw new BadRequest(`Unknown aggregate type ${aggregate_type}`);
  }
}
