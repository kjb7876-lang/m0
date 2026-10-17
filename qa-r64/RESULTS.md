# StoryWorld R64 candidate verification

Date: 2026-10-17
Repository: `kjb7876-lang/m0`
Base: latest checked `origin/main` `03675216dc8deae223e7e9f1ba798942d197f048`
Live deployment reference: `3407b7a53c921b8677cf59c8d2fbfa4493149418`
Work branch: `work/storyworld-r64-reward-aura-ui` (local only)

## Difficulty and rewards

The measured live R63 factors were 0.40 / 0.50 / 0.80. R64 uses half of those retained-health factors (0.20 / 0.25 / 0.40), as confirmed in the later steering for this task. Values are derived from each actor's stored base HP; repeated tier changes, save restoration, summons, and co-op replicas do not compound scaling.

| Tier | R63 factor | R63 boss / common HP | R64 factor | R64 boss / common HP | Incoming damage | First-clear points |
|---|---:|---:|---:|---:|---:|---:|
| Easy | 0.40 | 10,274.4 / 456 | 0.20 | 5,137.2 / 228 | 0.40× | 1 |
| Normal | 0.50 | 12,843 / 570 | 0.25 | 6,421.5 / 285 | 1.00× | 3 |
| Hard | 0.80 | 20,548.8 / 912 | 0.40 | 10,274.4 / 456 | 1.20× | 7 |

The legacy 0.90 / 1.40 / 2.10 setup values are not the measured live R63 factors. The first-clear 1/3/7 reward and duplicate-clear guard remain unchanged. Enemy point drops are also implemented: deterministic per-kill rolls, one-tenth minion chance versus the tier boss chance (10% / 50% / 77%), 1–7 points per successful drop, host-authoritative co-op collection, and persisted claim IDs to prevent repeat awards.

## Thread Dance aura and motifs

The existing white/silver-thread aura is drawn only for the owning player who has the passive. Regression checks found zero draw commands while unowned and six while owned; it hides on death or when effects are disabled. Save/load, passive reset, region change, death/revival, EGO/resonance display, and owner scoping were checked. No unrelated stat buff was added.

The six separately purchased motifs remain distinct. A rank-one test cast retained three base hits over two targets, split the Tsubame strikes into 18 sub-hits without changing total damage, produced one 35% Fractal chain, and measured the Ichidan final-hit ratio at 1.35. Existing semi-automatic use remains.

## Co-op checks

Chromium ran a local two-page host/guest simulation only; it did not connect to the external relay or network. The R62 snapshot protocol stayed `version: 1, build: R62`. Six enemy replicas retained 6,421.5 boss HP and 285 common HP at Normal. The guest accepted the host's drop snapshot and drew the drop, while direct guest collection/award was rejected. Host authority awarded the nearby guest +4 once; a repeat collection awarded zero. Save/import preserved an unclaimed drop and its claim; reload after collection did not award it again. Aura ownership remained scoped to the player who bought it.

## UI and browser regression

Chromium 151 headless browser regression passed with `pageErrors: []`. Error and compatibility notices occupy `#noticeShelfR63R2` between the game stage and footer, with details available in Settings → Status/Diagnostics.

| View | Viewport | Notice shelf |
|---|---:|---:|
| Desktop | 1365×888 | y=736–774; stage ends at 736, footer starts at 774 |
| Desktop | 1280×720 | y=568–606 |
| Mobile portrait | 390×844 | y=806–844 |
| Mobile landscape | 844×390 | y=352–390 |

Settings open/close, size changes, portrait/landscape rotation, safe-area layout, touch settings control, and canvas pointer input were checked. A test stub forced renderer startup failure to exercise the compatibility fallback; this was not a real device incompatibility test.

## Performance profile

Same scripted `dist00` STORY scene for baseline and candidate: fresh browser contexts, 1365×850 viewport, player at (15,19), six enemies, engaged room, 2.5 s warmup, then three 20 s samples per version in alternating order. Chromium used the container's software/emulated renderer (SwiftShader), not physical hardware or a verified GPU.

| Metric | Base `origin/main` | R64 candidate | Candidate change |
|---|---:|---:|---:|
| Mean frame interval | 175.59 ms | 177.11 ms | +1.51 ms (+0.86%, slower) |
| Mean p50 frame interval | 177.73 ms | 177.77 ms | +0.03 ms |
| Mean p95 frame interval | 205.53 ms | 211.07 ms | +5.53 ms (slower) |
| Mean FPS | 5.70 | 5.65 | -0.05 |
| Script duration per 20 s run | 1,736.3 ms | 1,803.6 ms | +67.3 ms |
| Layout count per run | 117 | 117 | unchanged |
| Mean JS heap delta | +6.10 MB | -3.36 MB | noisy; paired deltas ranged -20.74 to +2.57 MB |

The targeted collision lookup removed per-call coordinate-string and temporary-array allocations. Sampled self time for `explorationBlocked` fell from 55.96 ms to 47.75 ms across the three sampled runs, but the end-to-end frame result did not improve: paired frame deltas were -3.29, +9.41, and -1.59 ms. Renderer work such as `getParameters`, `getProgram`, and `needsUpdate` remained prominent. This profile does **not** establish a repeatable end-to-end performance gain, so the performance acceptance gate is not met. No effects were removed and render resolution was not reduced.

## Test separation and deliverables

- CPU unit checks: `node --test scripts/campaign-balance-r64.cpu.test.mjs` — 6/6 passed.
- Browser run: Chromium 151 headless, emulated software renderer; candidate regression passed with no page errors.
- Co-op run: two local browser pages only; no relay/server/network connection.
- Physical device and physical GPU checks: not run.
- Runtime package reconstruction: 1,906 runtime files / 1,908 site files hash-verified; candidate `webHTMLSha256` is `67f5ed153d9a84ed17780e965fff2ec01af919979e0722e440df7f7c6ddeda2e`.
- No original image/audio assets, story data, hospital geometry, doors, floors, structures, or `projection33` backup were changed. Render configuration and relay deployment were not changed.

Five same-candidate screenshots are stored with the regression files: `candidate-point-drop.png`, `candidate-desktop-aura.png`, `candidate-desktop-diagnostics.png`, `candidate-mobile-portrait-flashlight.png`, and `candidate-mobile-landscape-flashlight.png`.

The reference aura image was not accessible as an attachment in this execution environment; the aura follows the written white/silver-thread description. The earlier 54 missing story voice assignments and 35 dialogue mismatches were not addressed and are not claimed as fixed.

## Publication status

Changes and test artifacts are on the local work branch only. Nothing has been pushed to GitHub, merged into `main`, or redeployed publicly. Because the performance profile failed to show a stable frame-time improvement, publication remains on hold. Local branch SHA and checkpoint are recorded in the handoff.
