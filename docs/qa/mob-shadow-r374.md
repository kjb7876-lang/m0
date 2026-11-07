# SW-0004 R374 movement review

Task: [#268](https://github.com/kjb7876-lang/m0/issues/268), contract revision 2.
Base: `b03cb4ee7710f7ae71b5a742e259136d9e925804`.
Branch: `claude/r374-mob-shadow`.

This is a source candidate for integration, **not a deployed game change**. The
common registration files are being edited in PR #267; the task contract excludes
those files. The browser fixture injects this source into the verified baseline
locally. No merge, deployment, paid API, new asset or save-schema change occurred.

## Behavior

The first shadow prototype compressed the body into a dark floor shape. Seven
independent visual roles scored it 5.1/10 on average; it was rejected for poor
readability. That prototype is not the shipped candidate. The user also allowed
dash/blink/charge, so this implementation uses the existing artwork at full size:
0.18 seconds gathering followed by a 0.18-second movement burst. Attack-only
actors reuse only the preparation cells of their authored attack strip for the pose; idle/static actors retain
their original artwork. The pose is render-only and restored in `finally`.
The second review identified a false-hit signal from the strike pose. Version 3
keeps locomotion strictly before that pose, reserving the strike cell for real
attacks. Existing special attacks are not changed.

An uninterrupted movement cycle forwards exactly the original sum of movement
time to the engine. Speed and damage stats remain unchanged. Interruptions cancel
banked movement time, so this is not a claim that combat timing is identical.
There are no added hitboxes, damage, invulnerability, effects or network requests.
Movement state lives in a WeakMap, never on serialized enemies.

Classification follows effective renderer precedence, including lazily assigned
R363 sheets. Normal walking sheets, pixel walkers, hospital-specific sprites,
major actors, stationary towers and rooted/immobile actors are excluded. Existing
special movements and real attacks retain their original animation ownership.

R230 flank, R268 relocation/private RAF and R286 dash call an optional admission
hook before mutating coordinates. For targeted actors the hook sweeps the full
body radius through the existing collision function, checks player/actor overlap
at arrival and rejects excessive distances. The fallback movement step is also
swept to stop accelerated corner cutting. No hook preserves previous behavior.

## Reproduction

```sh
node r96/qa/r374/mob-shadow-cpu-check.cjs
python3 -I scripts/collab/test_validate.py
python3 -I scripts/collab/validate.py all
python3 -I scripts/collab/validate.py task r96/qa/r374/evidence/task-contract.json
```

The browser check requires an already-built baseline served locally, Playwright
and Chromium. It does not register the new source in production:

```sh
STORYWORLD_URL=http://127.0.0.1:4396/ OUT=/tmp/r374-proof \
  node r96/qa/r374/mob-shadow-browser.cjs
MOBILE=1 STORYWORLD_URL=http://127.0.0.1:4396/ OUT=/tmp/r374-proof \
  node r96/qa/r374/mob-shadow-browser.cjs
OUT=/tmp/r374-proof node r96/qa/r374/mob-shadow-pose-check.cjs
```

Both runs use an isolated browser profile, an existing cheat/test entry path and
a placed actor advanced through the actual `moveAI3` at fixed 1/60-second steps.
RAF is frozen to make paired screenshots reproducible. This does **not** prove
natural campaign behavior, combat interruption feel or physical-device rendering.
The fixture records source SHA-256, movement phase, frame path and source rectangle.

## Validation and limitations

- R374 CPU: 32 checks pass, including actual R230/R268/R286 code, the private
  R268 RAF path, clear-path controls, walls, corners, closing doors, body radius,
  arrival overlap, attack restoration, reset/pause/room transitions and exclusions.
- Bounded collision work: at most 129 collision queries for a special relocation;
  ordinary movement does not scan the actor population at each sample. The
  overlay adds no particle emission or separate rendering loop. Physical-device
  frame timing and the cost of existing renderer wrappers are unverified.
- Contract validator: 25 unit tests pass; repository fixture validation passes.
  The latter validates checked-in samples and is not independent review of #268.
- Four changed JavaScript sources pass `node --check`.
- PC (1920×1080, DPR 1) and emulated mobile (390×844, DPR 3) each pass 10
  browser assertions: effective art precedence, both movement phases, no gameplay
  attack from the pose, bounded progress, paired position/time/projection, actual
  closed-door rejection, save schema/control/identity and zero page errors.
- Captured-pose check: both sets of source hashes match final sources, all browser
  assertions pass, and every burst uses preparation cell `[127,0,127,163]`.
- Generated-room audit: 4,045 placements; 3,605 preserved, 404 attack-only
  placements (33 native families), 14 idle-only (2 families), 22 static (2 families).
  This is classification in generated STORY/DREAM rooms, not campaign traversal.
- R286 regression suite currently fails at `runtime copies match`. This is an
  expected, unresolved integration failure, **not a green CI result**. The source
  edits and stale runtime copies must be reconciled by the integrator.
- Baseline build (before candidate edits) passed: 4,900 files, 944,722,919 bytes,
  manifest SHA-256 `a9c2706520dec9bb7e230fc2702a431acd64c87b1fc3e4ab8fda7eca21b31805`.
  No final integrated build or full regression suite has passed yet.
- The initial mobile save check found restoration to the map entry rather than
  the saved player coordinates. Restoring the exact same save with the feature
  disabled produced the exact same entry coordinates. Candidate and disabled
  results match, hero/region/HP are preserved, and no R374 fields are serialized.
  Existing positional restoration remains an observed limitation, not fixed here.

## Integration handoff

After resolving ownership of PR #267's common files, register the overlay once
after the existing mob overlays and before `combat-r118.js` as used by the fixture.
Synchronize the three modified source/runtime copies, add the overlay and QA to
the runtime input/manifest/build verification and ordered-script checks, then run
the full build and regression suite. Recheck the actual load order at integration.
PR #267 remained open at handoff inspection. Its new squad leaders temporarily
restore `r373Name` while drawing and preserve `r248Key`; integration must also
check lazy R363 classification before first draw and leader/clone behavior.
This candidate was not tested with that unmerged branch.

Claude independent code review, natural combat/campaign traversal, all target art
families on screen, physical PC/mobile/GPU checks and final graphics approval are
still required. Headless role scores below are provisional, never a release gate
substitute. Preserve the existing source assets and lore.

## Existing artwork used

The observed attack-only actor is `dist02-h1` (늪의 염소머리 악마), using the
existing `assets/r92/mobs/M005-attack.png` with a 127×163 cell. Captured gathering
uses source rectangle `[0,0,127,163]`; burst uses the preparation cell
`[127,0,127,163]`, leaving strike cell `[254,0,127,163]` for real attacks. Existing
sprite drawing and pivots are preserved, without squash, recoloring or scaling.
The other fallback families are `h102-t1` (무명 검흔), `murder04-e3`
(은폐기록 연결체), `h102-s2` (코어 운반 집행자), and `u202-e1`
(가짜 자비 수집가). These retain their original idle/static art and receive the
movement cadence only. All source artwork is reused unchanged; no asset was
generated, downloaded from a paid service or replaced.

Machine-readable results and logs are in `r96/qa/r374/evidence/`. Browser results
bind the four runtime source SHA-256 values to captured motion and save checks.
The earlier mobile position failure is preserved alongside the disabled control
result. Screenshot files are evidence only and never added to runtime inputs.
The tracked WebP containers are lossless, same dimensions, with decoded RGBA
bytes checked equal to the original PNG captures. Their manifest records both
file hashes; no crop, resize, color correction or image generation was performed.

## Seven-role visual review

Each role independently opened actual PC/mobile captures and result JSON. The
animation reviewer viewed all 16 motion captures plus four before/after images;
the other roles viewed the four before/after images and six captures at frames
5, 16 and 38. Scores are **provisional headless fixture scores only**.

| Role | Shadow prototype | Visible dash v2 | Preparation-only v3 |
|---|---:|---:|---:|
| Art direction | 5.5 | 8.0 | 8.2 |
| Dramatic direction | 5.5 | 7.6 | 8.0 |
| Camera/composition | 4.0 | 8.0 | 8.0 |
| Space/environment | 6.2 | 8.1 | 8.1 |
| Lighting/color | 5.5 | 8.2 | 8.2 |
| Animation/VFX | 4.5 | 7.4 | 7.6 |
| UX/UI/level | 4.5 | 7.6 | 8.0 |

The final provisional mean is **8.014/10**, above the >7.77 fixture threshold.
The initial shadow failed (mean 5.10). V2 improved readability (mean 7.843) but
reused the strike pose during harmless movement. V3 removes that strike pose.
The animation score remains below 7.77: the held preparation cell returns abruptly
to the first cell at cycle boundaries, so recovery/deceleration and foot stability
still require normal-speed observation. No additional particles or palette change
were requested by the art/color reviewers.

The final fixture uses greater PC spacing than V2; apparent reduction of overlap
must not be attributed solely to the pose change. Close combat, multiple actors,
doorways and real movement-to-attack transitions still need natural-play review.
No role granted final graphics/device approval, and role review does not replace
the independent code review required by the task contract.

PC evidence: [before](../../r96/qa/r374/evidence/screenshots/pc-before.webp),
[after](../../r96/qa/r374/evidence/screenshots/pc-after.webp),
[gather](../../r96/qa/r374/evidence/screenshots/pc-motion-5.webp),
[burst](../../r96/qa/r374/evidence/screenshots/pc-motion-16.webp).
Mobile evidence: [before](../../r96/qa/r374/evidence/screenshots/mobile-before.webp),
[after](../../r96/qa/r374/evidence/screenshots/mobile-after.webp),
[gather](../../r96/qa/r374/evidence/screenshots/mobile-motion-5.webp),
[burst](../../r96/qa/r374/evidence/screenshots/mobile-motion-16.webp).

Applied repository skills: `storyworld-art-style` (art and seven-role review),
`ecc-e2e-testing` (browser evidence) and `game-ai` (movement/collision reasoning).
Tools used: shell/Node/VM tests, Python build/contract checks, Playwright Chromium,
Pillow for pixel-identical evidence encoding, Git and the connected GitHub tools.
