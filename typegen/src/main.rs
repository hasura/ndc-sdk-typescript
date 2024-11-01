use ndc_models::{
    CapabilitiesResponse, ErrorResponse, ExplainResponse, MutationRequest, MutationResponse,
    QueryRequest, QueryResponse, SchemaResponse, VERSION, VERSION_HEADER_NAME,
};
use schemars::{schema_for, JsonSchema};
use serde_derive::{Deserialize, Serialize};
use std::{env, error::Error, fs, path::PathBuf};

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
    let (schema_json_path, version_path) = if args.len() >= 2 {
        let schema_json_path = [args[1].as_str(), "schema.generated.json"]
            .iter()
            .collect::<PathBuf>();
        let version_path = [args[1].as_str(), "version.generated.ts"]
            .iter()
            .collect::<PathBuf>();
        Ok((schema_json_path, version_path))
    } else {
        Err("Schema directory not passed on command line")
    }?;

    print!(
        "Generating schema JSON to {}...",
        schema_json_path.to_str().unwrap()
    );
    let schema_json = serde_json::to_string_pretty(&schema_for!(SchemaRoot))?;
    fs::write(schema_json_path, schema_json + "\n")?;
    println!("done!");

    print!(
        "Generating schema version to {}...",
        version_path.to_str().unwrap()
    );
    fs::write(
        version_path,
        format!("export const VERSION = \"{VERSION}\";\nexport const VERSION_HEADER_NAME=\"{VERSION_HEADER_NAME}\"\n"),
    )?;
    println!("done!");

    Ok(())
}
