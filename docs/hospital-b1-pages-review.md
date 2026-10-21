# Hospital B1 Pages preparation: review still required

## Scope

Same m0 environment and branch. Original six files from c893f1f remain unchanged.
The final HTML stays `d2b0ac231ffab8463feb9675c06f21b18f63f1372dc5f1723ef99e8a65643d4f`
and renderer stays `a09c0d264510286b397682d51df7d964543794b3d8b058b534a1cd8f5f7cee1d`.
No new artwork, actors, combat values, story order, save schema or other region.
The test starts separate progress and NEVER automatically imports original saves.

## One final artifact path

The prepared Pages release job still runs every original R75/R76/R77 gate and
requires all existing jobs. After those gates it composes B, generates fixtures,
executes fresh CPU checks, runs the separate B source/artifact gate and verifies
the stamped static files under `/m0/`. Upload path is exclusively:

`out/hospital-b1/build-connected/site`

All four release outputs come from `steps.hospital`: HTML, renderer, unchanged
image hashes and the ACTUAL stamped manifest hash. Public verification consumes
those outputs. No stale R77 outputs or `_pages/docs` upload remain in that path.
The preserved R77 baseline and its verification are retained as historical input.
Permissions, required jobs, event triggers and all three main-only restrictions
are unchanged. Existing public R75/R77 browser smoke steps are preserved; they
have NOT been run here. No PR, workflow dispatch or deployment is implied.

## Clean CPU replay

`prepare-hospital-b1-cpu.py` generates the old mode-cache control HTML and mode-fix
layout fixtures from exact R77 using real reviewed transforms. It restores the
versioned harness sources at their original relative paths, verifies the exact
six-file patch and creates an OUTSIDE-artifact alias for the existing static
validator. It reads no old result JSON or personal save. It refuses overwriting
different existing fixtures.

`run-hospital-b1-cpu.py` refuses existing result files, actually executes each
command, checks fresh result timestamps/digests and records the actual checkout
HEAD/tree, source-file hashes and final runtime hashes. Commands cover the 29
runtime cases, mask audit, build chain, test-storage isolation, separate source
gate and workflow wiring. This is CPU/VM/static HTTP, not browser/GPU acceptance.

For a clean same-machine replay, create isolated checkouts; preserve the original
working tree. Build the pinned f415 baseline with the original CPU build chain
and original R75/R76/R77 gates, then explicitly supply that newly built approved
R77 `_pages/docs` and R74 runtime/manifest inputs to the clean candidate checkout.
No historic out/results files are required. Run:

```sh
python3 scripts/build-hospital-b1.py
python3 scripts/prepare-hospital-b1-cpu.py
python3 scripts/run-hospital-b1-cpu.py
node verify-pages-r62.mjs out/hospital-b1-static
```

The actual release entry additionally requires source review. It does not skip
an old gate and cannot publish a `review-required` B record.

## Source ownership and manifest stamps

`hospitalB1Test.reviewedSpatialSourceCommit` is c893f1f and identifies only the
six original candidate sources. `buildSourceCommit` is the real checkout HEAD;
`ciSourceCommit`, when present, must equal that HEAD. A dirty source flag is
recorded and refused by the release gate. The old ambiguous `sourceCommit`
field is removed. The preflight also binds all current build/adapter/test/workflow
files by SHA256. This distinguishes actual execution source from old geometry.

Manifest hash is not a constant across source stamps. B gate writes a separate
`releaseHospitalB1` with reviewed full HEAD/PR and actual build HEAD. It then hashes
the ON-DISK final manifest and exports that digest. Static validation and Pages
upload read that same path; public comparison uses that exported digest. Original
R75/R76/R77 runtime metadata/contracts are preserved without claiming B is R77.

## Exact approval sequence; no fabricated pin

R77 remains `approved` for its exact unchanged runtime, with the old PR21 source
record. Its original source gate is unchanged. New B approval is deliberately
`review-required`, with no fabricated PR/HEAD/evidence digest. No broad allowlist
is added and no release is approved by authoring a test fixture.

After independent review of the complete new code diff and fresh CPU evidence:

1. Freeze source/evidence commit **A** in a real reviewed PR **N**. The evidence
   file is `docs/hospital-b1-evidence/clean-checkout-results.json`; bind its exact
   digest and checked source-path hashes. No executable code may change afterward.
2. Commit **B** changes ONLY `scripts/hospital-b1-approved-runtime.json`: approved
   status, actual PR N, reviewed HEAD A, actual evidence SHA256. Review this record.
3. Commit **C** changes ONLY `scripts/r77-approved-runtime.json.candidateSource`
   to actual PR N and HEAD B. Keep R77 status/runtime hashes/contract unchanged.

This ordering matters: the original R77 gate does not permit B approval JSON
changes AFTER its pin, so pinning R77 to A before B would correctly fail. R77's
pin B includes that exact B approval record; B's source pin A permits only the
two exact approval-record edits after review. No gate is disabled or widened.
The gates require an actual reviewed PR/source association but encode no separate
administrator identity or permission grant. The parent coordinates independent
review. These instructions are a proposed procedure, not completed approvals.

Until A/N and evidence are reviewed, Pages release is intentionally blocked.
Do not create a placeholder PR number, set R77 pending, change security/permissions,
force main or merge just to get a green gate.

## Recovery and user saves

Backup target is the user-authorized private Google Drive. The reconstructed
local recovery ZIP has 1,914 matched files and SHA256
`4fb3f999ca638195dfed31779d38be91fe478b219c04f7a0a75495673950b379`.
It is not the Actions container ZIP, whose SHA256 is
`477ccdecf6a50e12aec3b5c8f43b578402842a85ef99a58c6002dca3d19d6715`.
The tool rejects a single 465,592,754-byte upload before invocation at its
104,857,600-byte limit. Same-environment, same-Drive normal-sized volumes preserve
the unchanged ZIP; all parts and reconstruction instructions are required.
Record actual returned file IDs/private status/sizes and checksum availability.
Do not infer Drive success from the failed/unknown Library attempt.

Rollback target is the original m0 github-pages site and pinned f415 files.
Code rollback does not undo browser storage. The test prefixes all game keys
with `storyworld.hospital-b1.test.v1:`; original keys stay separate. Real user-save
compatibility, actual frames/GPU/mobile/touch/flashlight/natural campaign and
actual co-op transport remain unverified. No C before user play/feedback.
