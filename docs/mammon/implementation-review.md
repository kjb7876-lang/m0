# Mammon boss room implementation candidate

Implemented on isolated worktree `/workspace/m0-mammon`, branch `claude/mammon-bossroom`, from locally available `b2c7b14253cdc6055368a4db7e3554e87ede929e` (R388). Latest remote main and PR #284 were not fetched. Earlier GitHub PR/contract reads returned network `403 Forbidden`; no repeat or alternative transport was attempted. User subsequently authorized isolated continuation, stating Claude would leave Mammon files alone. No merge, deployment or remote write was made.

## Behavior and scope

`r96/client-source/mammon-bossroom.js` owns the entire change. It affects solo STORY `ep1b06` only, preserving native door IDs/coordinates, world-combat metadata, roster, health/balance and save schema. It adds iron inner cladding aligned to existing isometric wall axes, brass trim around native door leaves, and wall-aligned desk/drawers with collision matching their footprints. It reclaims the original four pillar footprints if present; the current R219-expanded runtime already has those floor cells. Other rooms and paths are preserved. Only explicitly decorative central props may be suppressed from drawing; original data remains intact.

Native architecture height normalization initially inflated furniture collision boxes into wall silhouettes. Collision boxes now remain at floor height with the native normalization marker; dedicated furniture meshes supply visible height. A lightweight Legacy painter preserves visible collision footprints. Same-scene layout changes release owned groups/resources. Textures load from explicit existing atlas halves, avoiding a race with regional wall-material replacement.

Shared integration files are limited to runtime HTML, generated input/manifest lists, public verifier asset expectations, CI test registration, and the existing R176 exact script-order expectation. These shared files still require comparison against latest main at integration; no conflict-free remote claim is made. Keep the Mammon overlay/tests intact and regenerate manifests with the then-current extra-file list.

## Validation

- `node r96/qa/mammon/bossroom-cpu-check.cjs`: PASS. Source immutability, scope/idempotence, progress metadata identity, central walkable floor, closed/open-door BFS, furniture clearance, protected props, matching runtime copy, renderer resource cleanup, Legacy painter.
- `node r96/qa/mammon/bossroom-runtime-check.cjs`: PASS on the actual compiled game in the CPU VM. Native furniture collisions, all five boss placement anchors clear, assisted 777 entry, native save/restore preserves door state, phase and boss HP. This is not natural progression completion.
- `node r96/qa/r171/story-maps-cpu-check.cjs`: PASS, 22 checks, no failures, native error ledger clear.
- `node r96/qa/r176/r176-cpu-check.cjs`: PASS, 22 checks after registering the new script in its exact load-order expectation.
- `node r96/qa/r104/bosses-cpu-check.cjs`: PASS, 10 checks.
- `python3 -I scripts/collab/test_validate.py`: PASS, 25 tests (existing ResourceWarning messages).
- `python3 -I scripts/collab/validate.py all`: PASS for repository's local example contracts; does not certify a new remote task contract.
- Browser: system Chromium via Playwright, headless software rendering, actual local game. Assisted 777 warp and explicit camera/player positioning. PC 1280×900; mobile viewport 390×844 at DPR3. Native game and overlay reported no page errors. Final captures pause simulation for consistent camera comparisons. Mobile emulation is not a physical device test.
- Final build/regression receipts are listed in `validation.json` after the last checks complete.

## Independent visual review (provisional)

Seven independent reviewers inspected actual headless captures. First-round mean was 7.73/10 (needs improvement). After painted wood reuse, iron-rib contrast improvement and matched mobile camera captures, the mean is 7.91/10, above the required 7.77 threshold. This is provisional visual review, not final graphics/GPU acceptance.

| Field | Score | Remaining concern |
|---|---:|---|
| Art | 7.6 | Furniture surface still simpler than native doors; contact shading/micro-wear could improve. |
| Staging/narrative | 8.0 | Winter-memory transition and uninterrupted boss scene unverified. |
| Camera/composition | 8.0 | Large boss/telegraph occlusion and wall-adjacent movement require live play. |
| Space/interior | 8.0 | Existing candles overlap furniture fronts in some views. |
| Light/color | 7.8 | Iron faces remain dark; no physical-display or numeric luminance acceptance. |
| Animation/VFX | 8.0 | Static change only; opening doors, flicker and frame-time behavior unverified. |
| UX/level | 8.0 | Real touch interactions, drawer-side visibility and combat dodging remain unverified. |

An independent follow-up code review found no remaining blocking issue after the resource/Legacy/atlas fixes. The final deterministic atlas loading and resource/Legacy fixes followed the visual reviews; final screenshots are preserved separately. Those fixes do not constitute a new seven-field final acceptance.

## Remaining limits / handoff

- Both Library candidate ZIP transfers failed with `download failed`. Their contents were never executed, imported or claimed validated. This implementation follows the described layout using existing repository assets; exact equality to the user's v3 mockup is unverified.
- Native boss phase/HP preservation and door topology were checked; natural battle completion, all door animations, next-region progression and full cold-reload save-slot UI paths remain unverified.
- Full ~25-minute regression suite, physical GPU/mobile and sustained frame-time tests were not run.
- Existing candles and a grey character silhouette visible in the test game were preserved; their origins are outside this change's scope.
- No remote task ID, PR, remote CI result, latest-main conflict check or deployment URL exists for this candidate. Claude integration review remains pending.
- Reused assets and hashes are recorded in `assets.json`; originals are unchanged. No Library upload or sharing change was made.

To continue, review this branch/diff and evidence; then compare against latest main, register the official task/allowed paths and draft PR, run CI plus real-play/device validation. Do not merge or deploy without a separate user instruction.

Capture reproduction: serve the built `r96/hospital-three-pc/site` on 127.0.0.1:4396; run `node scripts/mammon-bossroom.browser.cjs before`, `node scripts/mammon-bossroom.browser.cjs final`, and repeat with `--mobile`. Requires system Chromium at `/usr/bin/chromium` and Playwright. Override URL/output using `MAMMON_TEST_URL` and `MAMMON_EVIDENCE_DIR`.
