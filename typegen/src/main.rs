use ndc_client::models::{
    CapabilitiesResponse, ErrorResponse, ExplainResponse, MutationRequest, MutationResponse,
    QueryRequest, QueryResponse, SchemaResponse,
};
use schemars::{schema_for, JsonSchema};
use serde_derive::{Deserialize, Serialize};
use std::{error::Error, fs, env};

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize, JsonSchema)]
#[schemars(title = "SchemaRoot")]
struct SchemaRoot {
    capabilities_response: CapabilitiesResponse,
    schema_response: SchemaResponse,
    query_request: QueryRequest,
    query_response: QueryResponse,
    mutation_request: MutationRequest,
    mutation_response: MutationResponse,
    explain_response: ExplainResponse,
    error_response: ErrorResponse,
    validate_response: ValidateResponse,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize, JsonSchema)]
#[schemars(title = "ValidateResponse")]
struct ValidateResponse {
    schema: SchemaResponse,
    capabilities: CapabilitiesResponse,
    resolved_configuration: String,
}

fn main() -> Result<(), Box<dyn Error>> {
    let args = env::args().collect::<Vec<_>>();
    let path = if args.len() >= 2 {
        Ok(&args[1])
    } else {
        Err("Schema file path not passed on command line")
    }?;
    print!("Generating Schema to {path}...");

    fs::write(
        path,
        serde_json::to_string_pretty(&schema_for!(SchemaRoot))?,
    )?;

    println!("done!");

    Ok(())
}
