import { SchemaResponse } from "ndc-sdk-typescript";

export const connectorSchema: SchemaResponse = {
  scalar_types: {
    String: {
      aggregate_functions: {},
      comparison_operators: {
        like: {
          argument_type: {
            type: "named",
            name: "String",
          },
        },
      },
      update_operators: {},
    },
    Int: {
      aggregate_functions: {
        max: {
          result_type: {
            type: "nullable",
            underlying_type: {
              type: "named",
              name: "int",
            },
          },
        },
        min: {
          result_type: {
            type: "nullable",
            underlying_type: {
              type: "named",
              name: "int",
            },
          },
        },
      },
      comparison_operators: {},
      update_operators: {},
    },
  },
  object_types: {
    article: {
      description: "An article",
      fields: {
        id: {
          description: "The article's primary key",
          type: {
            type: "named",
            name: "Int",
          },
        },
        title: {
          description: "The article's title",
          type: {
            type: "named",
            name: "String",
          },
        },
        author_id: {
          description: "The article's author ID",
          type: {
            type: "named",
            name: "Int",
          },
        },
      },
    },
    author: {
      description: "An author",
      fields: {
        id: {
          description: "The author's primary key",
          type: {
            type: "named",
            name: "Int",
          },
        },
        first_name: {
          description: "The author's first name",
          type: {
            type: "named",
            name: "String",
          },
        },
        last_name: {
          description: "The author's last name",
          type: {
            type: "named",
            name: "String",
          },
        },
      },
    },
  },
  collections: [
    {
      name: "articles",
      type: "article",
      description: "A collection of articles",
      deletable: false,
      arguments: {},
      foreign_keys: {},
      uniqueness_constraints: {
        ArticleByID: {
          unique_columns: ["id"],
        },
      },
    },
    {
      name: "authors",
      type: "author",
      description: "A collection of authors",
      deletable: false,
      arguments: {},
      foreign_keys: {},
      uniqueness_constraints: {
        AuthorByID: {
          unique_columns: ["id"],
        },
      },
    },
    {
      name: "articles_by_author",
      description: "Articles parameterized by author",
      type: "article",
      arguments: {
        author_id: {
          type: { type: "named", name: "Int" },
        },
      },
      deletable: false,
      foreign_keys: {},
      uniqueness_constraints: {},
    },
  ],
  procedures: [
    {
      name: "upsert_article",
      description: "Insert or update an article",
      arguments: {
        article: {
          description: "The article to insert or update",
          type: {
            type: "named",
            name: "article",
          },
        },
      },
      result_type: {
        type: "nullable",
        underlying_type: {
          type: "named",
          name: "article",
        },
      },
    },
  ],
  functions: [
    {
      name: "latest_article_id",
      description: "Get the ID of the most recent article",
      result_type: {
        type: "nullable",
        underlying_type: {
          type: "named",
          name: "Int",
        },
      },
      arguments: {},
    },
  ],
};
