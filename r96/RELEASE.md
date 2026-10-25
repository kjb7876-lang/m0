# R96 native status release

This release moves the Pages artifact from the earlier hospital B2 candidate to the preserved R95 game plus R96 native poison/burn sustain and split-root presentation. Native damage, progress and the existing v11 save namespace remain unchanged. Unmapped hero readability candidates are excluded.

The former R75/B1/B2 workflow is retained byte-for-byte in release-history/r75/pages.yml as historical release provenance. Its approval pins refer to that earlier artifact and are not presented as approvals of R96. The active workflow builds the exact R96 manifest and runs the full inherited 58-group, 740-check suite afresh, plus all 24 status lifecycle checks, sandboxed Chromium start/save/portal/effect checks, and a complete post-test artifact hash check. Deployment depends on every stage succeeding. No assertion in the inherited full suite is disabled; exact archived QA inputs and Windows launcher are reconstructed solely as CI fixtures and are not published to Pages.

A matching local 740/740 and 24/24 result preceded this change; remote browser validation is required before release. The browser uses a software GPU, with explicit position and status fixtures for the portal/effect checks; this is not physical-device or natural battle proof. Published URLs and actual commit identities come from the deployment job.
