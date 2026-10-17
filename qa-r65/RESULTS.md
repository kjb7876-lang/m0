# StoryWorld R65 mobile flashlight verification

Date: 2026-10-17
Repository: `kjb7876-lang/m0`
Base: `origin/main` at `55ef8ec68cbd83ffec268bdda6b8e90f407d9593`
Candidate web HTML SHA-256: `5e6b401ce2ff867d14019661144ed655e9f2a17a3758f8bd8a201b7cb3a855e6`
Candidate revision: R65

## Flashlight

Chromium 151, iPhone user-agent/touch emulation, 390×844 CSS pixels at DPR 2, STORY `dist00`, player at (15,19), Three renderer requested and active. This is browser emulation, not a physical phone or verified GPU.

| Check | Result |
|---|---|
| Mobile default | ON; one shared sight mask enabled |
| Explicit ON | `flashlight58=true`; status reads “켜짐 · 주변 시야”; 46 rays; radius 9.406 world units |
| Explicit OFF | `flashlight58=false`; status reads “꺼짐 · 전체 시야”; mask disabled |
| Touch toggle | Pointer/touch/click/input/change sequence observed once; game canvas received 0 pointer-downs |
| Rapid taps | Three taps produced OFF → ON → OFF with matching saved state and status |
| Save/load | Explicit OFF survived round trip; restored ON synchronized the checkbox and status |
| Visual difference | 887,883 of 1,316,640 pixels differ (67.44%) in the 780×1688 captured image; mean RGB 20.04 ON, 45.04 OFF |
| Other lifecycle | Map transition, death/return, orientation, visibility/blur, and local co-op snapshot kept the saved setting aligned |

The ON/OFF captures use the same candidate build and scene. The ON capture confines the view to the player-centered light area; OFF shows the full map. No combat or player stat buffs were introduced.

## Regression and co-op

- `candidate-regression.mjs`: Chromium 151 headless browser regression passed, `pageErrors: []`; includes campaign, save/load, map change, death/return, mobile layout/touch, diagnostics and a two-page co-op simulation.
- `coop-regression.mjs`: local two-page host/guest simulation passed, `errors: []`. Six replicas retained normal-tier HP 6,421.5 / 285; guest accepted host snapshot; aura stayed scoped to `qa-host`; guest-side pickup was rejected; host awarded +4 once and reload did not duplicate it. Snapshot protocol remained version 1 / build R62.
- `node --test scripts/campaign-balance-r64.cpu.test.mjs`: 6/6 passed.
- `unpack-runtime-r62.py`: 1,906 runtime files reconstructed and hash-verified; 87 archives remain build-only.
- `verify-pages-r62.mjs`: 1,906 file hash and HEAD checks plus 276 audio range checks passed under `/m0/`.
- `node --check` for all three R65 browser scripts and `git diff --check` passed.

The co-op test did not connect to Render or a public relay and did not test players on separate networks. Actual mobile hardware and GPU checks were not run.

## Assets and delivery

Only `docs/index.html`, its runtime hash manifest, and the Pages build-input manifest changed for this candidate. Runtime media bytes, authored story, save data, hospital walls/doors/floors/structures and the private `projection33` backup were not edited. Render and relay configuration were not changed. Existing difficulty, health, damage and reward behavior was left as-is.

Four matching screenshots are retained beside this report: `flashlight-on-mobile-portrait.png`, `flashlight-off-mobile-portrait.png`, `flashlight-settings-mobile.png`, and `flashlight-off-mobile-landscape.png`.

The ChatGPT Library multi-image upload helper failed its initial hosted-tools listing with a network error before any file upload began. The four image files remain in this repository's QA directory; they were not saved to Library.

This report records local candidate verification. Public publication status and the exact Git candidate SHA are reported separately after the Pages workflow completes.
