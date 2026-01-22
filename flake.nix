{
  description = "v3-console development dependencies";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    systems.url = "github:nix-systems/default";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      self,
      nixpkgs,
      systems,
      rust-overlay,
    }:
    let
      overlays = [
        (import rust-overlay)
      ];

      # Our default package set is configured to build for the same platform the flake is evaluated
      # on. So we leave `crossSystem` set to the default, which is `crossSystem = localSystem`. With
      # this package set if we're building on Linux we get Linux binaries, if we're building on Mac
      # we get Mac binaries, etc.
      mkPkgs =
        localSystem:
        import nixpkgs {
          system = localSystem;
          inherit overlays;
        };

      # Helper to define system-specific flake outputs.
      perSystem =
        callback:
        nixpkgs.lib.genAttrs (import systems) (
          system:
          callback {
            inherit system;
            pkgs = mkPkgs system;
          }
        );

      rust-toolchain = pkgs: pkgs.rust-bin.fromRustupToolchainFile ./rust-toolchain.toml;
    in
    {
      devShells = perSystem (
        { pkgs, system }:
        {
          default = pkgs.mkShell {
            packages = [
              pkgs.nixfmt
              pkgs.nodejs_20
              (rust-toolchain pkgs)
            ];
          };
        }
      );
    };
}
