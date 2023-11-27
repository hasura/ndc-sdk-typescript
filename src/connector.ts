import { Observable } from "rxjs";
import {
  CapabilitiesResponse,
  QueryRequest,
  QueryResponse,
  SchemaResponse,
  ExplainResponse,
  MutationRequest,
  MutationResponse,
} from "./schema";

import { JSONSchemaObject } from "@json-schema-tools/meta-schema";

export interface Connector<RawConfiguration, Configuration, State> {
  /**
   * Return jsonschema for the raw configuration for this connector
   */
  get_raw_configuration_schema(): JSONSchemaObject;

  /**
   * Return an empty raw configuration, to be manually filled in by the user to allow connection to the data source.
   *
   * The exact shape depends on your connector's configuration. Example:
   *
   * ```json
   * {
   *   "connection_string": "",
   *   "tables": []
   * }
   * ```
   */
  make_empty_configuration(): RawConfiguration;
  /**
   * Take a raw configuration, update it where appropriate by connecting to the underlying data source, and otherwise return it as-is
   * For example, if our configuration includes a list of tables, we may want to fetch an updated list from the data source.
   * This is also used to "hidrate" an "empty" configuration where a user has provided connection details and little else.
   * @param rawConfiguration a base raw configuration
   */
  update_configuration(
    rawConfiguration: RawConfiguration
  ): Promise<RawConfiguration>;
  /**
   * Validate the raw configuration provided by the user,
   * returning a configuration error or a validated [`Connector::Configuration`].
   * @param configuration
   */
  validate_raw_configuration(
    rawConfiguration: RawConfiguration
  ): Promise<Configuration>;

  /**
   * Initialize the connector's in-memory state.
   *
   * For example, any connection pools, prepared queries,
   * or other managed resources would be allocated here.
   *
   * In addition, this function should register any
   * connector-specific metrics with the metrics registry.
   * @param configuration
   * @param metrics
   */
  try_init_state(
    configuration: Configuration,
    metrics: unknown
  ): Promise<State>;

  /**
   * Returns an Observable stream that watches any mutable resources referred to by the Configuration,
   * and if something changes, emits the new State that matches the changed resource.
   * 
   * This is only used when the connector server is used in watch mode during development. The server
   * will subscribe to the Observable returned by this function and swap the current State for new
   * States emitted by the Observable. If the Configuration changes during watch mode, the Observable
   * returned by this function is unsubscribed from, and this function is invoked with the new 
   * Configuration and the new Observable is subscribed to.
   * 
   * This function is optional to implement. If it is not implemented, watch mode on the server
   * only reloads the State when the Configuration changes.
   */
  watch_for_state_change?(
    configuration: Configuration
  ): Observable<State>

  /**
   *
   * Update any metrics from the state
   *
   * Note: some metrics can be updated directly, and do not
   * need to be updated here. This function can be useful to
   * query metrics which cannot be updated directly, e.g.
   * the number of idle connections in a connection pool
   * can be polled but not updated directly.
   * @param configuration
   * @param state
   */
  fetch_metrics(configuration: Configuration, state: State): Promise<undefined>;
  /**
   * Check the health of the connector.
   *
   * For example, this function should check that the connector
   * is able to reach its data source over the network.
   *
   * Should throw if the check fails, else resolve
   * @param configuration
   * @param state
   */
  health_check(configuration: Configuration, state: State): Promise<undefined>;

  /**
   * Get the connector's capabilities.
   *
   * This function implements the [capabilities endpoint](https://hasura.github.io/ndc-spec/specification/capabilities.html)
   * from the NDC specification.
   *
   * This function should be syncronous
   * @param configuration
   */
  get_capabilities(configuration: Configuration): CapabilitiesResponse;

  /**
   * Get the connector's schema.
   *
   * This function implements the [schema endpoint](https://hasura.github.io/ndc-spec/specification/schema/index.html)
   * from the NDC specification.
   * @param configuration
   */
  get_schema(configuration: Configuration): Promise<SchemaResponse>;

  /**
   * Explain a query by creating an execution plan
   *
   * This function implements the [explain endpoint](https://hasura.github.io/ndc-spec/specification/explain.html)
   * from the NDC specification.
   * @param configuration
   * @param state
   * @param request
   */
  explain(
    configuration: Configuration,
    state: State,
    request: QueryRequest
  ): Promise<ExplainResponse>;

  /**
   * Execute a mutation
   *
   * This function implements the [mutation endpoint](https://hasura.github.io/ndc-spec/specification/mutations/index.html)
   * from the NDC specification.
   * @param configuration
   * @param state
   * @param request
   */
  mutation(
    configuration: Configuration,
    state: State,
    request: MutationRequest
  ): Promise<MutationResponse>;

  /**
   * Execute a query
   *
   * This function implements the [query endpoint](https://hasura.github.io/ndc-spec/specification/queries/index.html)
   * from the NDC specification.
   * @param configuration
   * @param state
   * @param request
   */
  query(
    configuration: Configuration,
    state: State,
    request: QueryRequest
  ): Promise<QueryResponse>;
}
