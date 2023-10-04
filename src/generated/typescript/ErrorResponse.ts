/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface ErrorResponse {
  /**
   * Any additional structured information about the error
   */
  details: {
    [k: string]: unknown;
  };
  /**
   * A human-readable summary of the error
   */
  message: string;
}