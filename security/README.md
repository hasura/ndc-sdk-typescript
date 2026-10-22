# TLS trust requirements

Use patched Node.js 22.23.4+, 24.22.1+, or 26.12.1+ on their respective release
lines. `.nvmrc` selects 24.22.1 for local development and the existing build and
publish workflows. The package engines field records those patched lines for
SDK consumers; npm normally warns rather than enforcing it unless engine-strict
is enabled. Rebuild/deploy connector images with a patched Node binary.

No JavaScript dependency update can replace the Node TLS verifier or bundled
roots. OS CA updates are still needed for OS trust consumers, especially when
using --use-openssl-ca, --use-system-ca, or additional/custom CAs.

Incident and patched-version reference: https://emudhra.we-have-a-problem.com/

Release validation must show certificate-verification rejection of all 12
published TLS chains (including cross-signs), plus acceptance of an unrelated
valid chain. Timeouts and connection failures are not evidence of distrust.
Rebuild consumers and update immutable deployed image references; an SDK source
change does not modify existing binaries, images, or hibernated instances.
Custom truststores, CA overrides, or custom verification require separate review.
