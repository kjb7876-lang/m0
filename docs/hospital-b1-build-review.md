# ep1a08 B candidate: build and isolated test saves

This is a local test candidate review, not a public release or C acceptance.
Baseline is `f415dfbf783c6290ab99125193d800429799c9f9`. The six spatial/presentation
sources in `c893f1f5172a33387c01241b4935d42d798ecbd8` remain byte-identical.

## Build

After a complete, approved R77 `_pages/docs` exists, run:

```sh
python3 scripts/build-hospital-b1.py
```

Output is a fresh `out/hospital-b1/build-connected/site`. It applies all three
reviewed hospital transforms in memory after exact R77 bytes, then adds a
renderer cache reference and a test-only storage adapter. It refuses a wrong
baseline, changed reviewed renderer, unexpected storage call forms or existing
output. Original assets are copied unchanged. It does not deploy.

`scripts/build-hospital-b1-release.sh` documents the full manual R75 -> R76 ->
R77 -> hospital build entry, preserving every original release gate. It has not
been run end-to-end and is not yet connected to Pages. The existing R77 gate's
source pin remains PR 21 / `02d1cd636c671eae712f1a45648fed0c29b8602a`; its source
review check refuses new runtime-producing files after that pin. A reviewed
release integration/source pin is required before a new Pages release. The gate,
approval JSON, workflow permissions and deployment policy have not been changed.

## Exact final runtime

| File | SHA256 |
| --- | --- |
| index.html | d2b0ac231ffab8463feb9675c06f21b18f63f1372dc5f1723ef99e8a65643d4f |
| dist/phase1.js | a09c0d264510286b397682d51df7d964543794b3d8b058b534a1cd8f5f7cee1d |
| web-manifest-r62.json | 4c3be326be637d47727f33b6cc728541ea5068bac51f66f12a96edc79f030248 |

Cache reference: `./dist/phase1.js?hospital-b1=a09c0d264510286b`.
The renderer is byte-identical to the prior mask-fix candidate. Reversing only
the cache reference, adapter insertion and 51 call-site substitutions restores
the exact previously reviewed HTML. No combat, enemy, story, map ID, portal,
door or save schema changes are introduced by this build wiring.

## Save protection

All 51 existing game `localStorage` get/set/remove calls are routed through
`window.__STORYWORLD_TEST_STORAGE_B1__.store`. The adapter prefixes keys with
`storyworld.hospital-b1.test.v1:` and does not read/import/delete original keys.
Save values and version6 payloads are unchanged. Normal slots, backups, active
pointer, co-op/777 storage and preferences use this same isolated domain.

This is necessary even at `/test/`: paths on one origin share localStorage.
A test build starts with separate progress. Returning to the original code
returns to original keys; test progress remains separate. Code rollback does
not restore overwritten browser data. No real user save has been obtained or
tested, and this CPU adapter check is not browser-origin or migration acceptance.

## New CPU evidence, separate from previous runs

- Whole runtime regression: **29/29** on final HTML and renderer, one run.
  The real storage adapter executes in the VM. Initial save data is a namespaced
  disposable fixture. Normal campaign prerequisites, room actors, direct kills,
  DOM/input/time and the outer version6 validator retain disclosed substitutions.
- Mask/resource audit: **10/10**, separate execution of the same renderer.
  Generic non-opt-in forced-state control still reproduces its old duplication.
- Build chain: **7/7**, including actual R75/R76/R77 overlay functions from a
  preserved R74 runtime input, exact runtime hashes, deterministic final build,
  wrong order refusal, full 1,914-file manifest integrity and shell entry order.
  This is not a fresh R62-through-R74 rebuild or full release-gate execution.
- Storage/syntax: **6/6**, original key preservation, slots/backup/coop/777 and
  preference mapping, reload/rollback key domains, lazy quota/access failures,
  exact 51-call rewrite and classic inline JavaScript syntax compilation.

Results and final source/harness hashes are preserved under
`out/hospital-b1/build-connected/FINAL-RECEIPT.json`. Existing prior 29/29 and
10/10 records were not overwritten. Do not sum separate runs into one suite.
The new test scripts require the preserved baseline/previous candidate fixtures
described in the earlier handoff, not an empty checkout.

## Deployment blockers and rollback

Current public baseline remains f415... . A 1,914-file matching local recovery
ZIP exists, with CI-stamped manifest and SHA256
`4fb3f999ca638195dfed31779d38be91fe478b219c04f7a0a75495673950b379`.
It is a reconstructed file-level recovery archive, not the downloaded Actions
ZIP. The original Actions artifact has SHA256
`477ccdecf6a50e12aec3b5c8f43b578402842a85ef99a58c6002dca3d19d6715`.
Its local transfer previously failed with an unspecified download error.
External persistence of the full recovery ZIP is still unconfirmed: the official
Library upload helper failed at tools/call with `network`, no success ID was
returned, and a read-only title lookup found no final item. No retry/alternate
transfer was attempted. The smaller private handoff package remains preserved.

Before deployment: establish external recovery availability, review the new
source/CI integration, pin the final artifact and verify the intended test-save
domain. Rollback target is the same m0 github-pages environment restored to the
f415 release files. Do not wipe browser storage as a cache-reset step.

No browser denial retry, sandbox/security change, new credential/cost, image
generation, other-region expansion or HAPIL/ZIP/TTS modification was performed.
Actual frame/GPU/mobile/flashlight/touch, natural campaign, real co-op transport
and original user-save compatibility remain unverified. B review -> test deploy
-> user play/feedback -> C; no C work has started.

## Reviewable evidence in this branch

`docs/hospital-b1-evidence` contains exact copies of the executed whole-runtime
and mask-audit harnesses, their results, build/storage results and final receipt.
The harnesses preserve their original artifact-relative imports. To rerun them
after preparing the preserved fixtures, copy `hospital-sim.mjs` to
`out/hospital-b1/build-connected/hospital-sim.mjs` and `audit.mjs` to
`out/hospital-b1/build-connected/audit/audit.mjs` without changing their bytes.
Keep original result copies before running; these scripts write fixed result
paths. This evidence does not configure or trigger GitHub Actions.
