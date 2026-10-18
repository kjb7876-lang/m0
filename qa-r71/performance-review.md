# R71 renderer performance review

## Status

No final-candidate paired ABBA result is available yet. The `146b85…` HTML candidate has a real 4× canonical boss-HP scaling regression (25,686 vs R70 6,421.5) and is pre-fix, not approved. The intermediate correction is commit `12ce0b885af82c0a58a1c3c358afa06964301162`, HTML SHA-256 `b6241524ba119ed98d954452ea5d9bcfef734dd5a7825067b58a027f3faaf527`, renderer SHA-256 `54dfe20af282d237511ef6f4bb6be3fe54880ad61d82928b0114d15f58df725c`; its corrected `dist00` boss HP is 6,666 vs R70 6,421.5. This hash completed paired profiling in preflight [39103707954](https://github.com/kjb7876-lang/m0/actions/runs/39103707954) (job `117605021160`) and is documented below. It is still not final: review found legacy R62 boss-replica import and R61 clone-save 6% contract holes, and the parallel native browser validation failed an attack-hit assertion. The fix is underway. Pages run [39103709960](https://github.com/kjb7876-lang/m0/actions/runs/39103709960) is an independent measurement of the same intermediate hash; keep it separate if it completes. A fresh pair is required for the final runtime. Older failed attempts [39102585613](https://github.com/kjb7876-lang/m0/actions/runs/39102585613), [39103014083](https://github.com/kjb7876-lang/m0/actions/runs/39103014083), [39103016351](https://github.com/kjb7876-lang/m0/actions/runs/39103016351), [39102301547](https://github.com/kjb7876-lang/m0/actions/runs/39102301547), [39101458143](https://github.com/kjb7876-lang/m0/actions/runs/39101458143), and [39102582785](https://github.com/kjb7876-lang/m0/actions/runs/39102582785) did not produce final-candidate measurements and are excluded.

No structural renderer optimization is claimed for R71. The renderer/map work in scope changes Three.js map material treatment for zone readability. It does not change map geometry, renderer fallback, resolution, or effects as a performance shortcut.

## Pinned input and measurement setup

The benchmark pins R70 game commit `34338945dc47f5bcb8c2ce05b2d7de62d72c7ad5`. Its expected `index.html` SHA-256 is `76791c87cf6b3f70d99f35aafc7dacaf3adb389f4be10081c024f8802a9aa5f5`; its `dist/phase1.js` SHA-256 is `b87e0feb34c321d19e557b7d08e63b9f0744f1e28b9e7d6e2ee7ea9ca0a6ebf4`. The harness checks both hashes before it starts.

The recorded baseline-only run is CI run `39098329927`, harness commit `0b6ea08a9113bf4af5bf110747a3f48b63bb91fc`. It ran on GitHub Actions Ubuntu 22.04 with Playwright 1.56 managed Chromium, headless and sandboxed, using SwiftShader. The renderer string was `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)`. These results are from a software renderer, not a physical GPU or a mobile device.

The current full-run harness compares `_r70/docs` with `_pages/docs` in ABBA order (`baseline`, `candidate`, `candidate`, `baseline`) for each of two live scenarios. Both builds use viewport 1365×850, DPR 1, seeded random input (70018), the same `dist00` map, active Three.js renderer, enabled flashlight, and real effects. Movement is keyboard-driven; EGO stress casts the six-motif thread ability and checks hits and observed motifs. Each timing trial samples for 30 seconds after a 2-second warm-up. A harness-only survival fixture (`hp=maxHP()`, `invincible=1000000`) is applied equally to both builds. It is not a game change.

The harness records RAF frame intervals, JavaScript `draw` and `tick` durations, long tasks, renderer counters, GL draw/texture/buffer calls, objects/effects, and JS heap before and after. ABBA order helps balance run-order effects, but there are only two trials per build per scenario; the simulation is live rather than a deterministic replay. These data do not establish performance on a user's hardware.

## R70 baseline profile evidence

The earlier baseline-only harness captured a requested 15-second CDP CPU profile after timing trials. The profiler-reported durations were 16,209.6 ms for movement and 15,414.8 ms for EGO stress. Profiles are diagnostic samples and were not included in timing results. In that harness version, the shared survival fixture had not yet been added; the profile evidence below is for hotspot triage, not a directly paired candidate profile.

The profile summarizer retains the top 35 call-frame rows and reports each row's share of those retained rows' self-sample durations. The largest row was Chromium's unattributed `(program)` frame:

| Scenario | `(program)` self-sample duration | Share of retained top-35 self samples | Other leading named rows |
| --- | ---: | ---: | --- |
| Movement | 14,942.4 ms | 93.84% | `texSubImage2D` 619.8 ms (3.89%); `geometry` 29.2 ms; `explorationBlocked` 24.3 ms; `intersectConvex` 23.9 ms; GC 23.6 ms |
| EGO stress | 14,224.1 ms | 95.68% | `explorationBlocked` 68.5 ms; `geometry` 61.0 ms; `texSubImage2D` 56.2 ms; GC 48.3 ms |

`(program)` is unattributed CPU-profile sampling; it is not a GPU timer and does not measure shader time or physical-GPU time. The dominant unattributed samples, software-renderer environment, and relatively small named JavaScript hotspots do not provide evidence for a safe structural optimization. Accordingly, R71 makes no performance-improvement claim based on the profile.

## Pre-fix diagnostic: paired R70 vs R71

The successful push-only paired-profile job [117602971044 in run 39103014083](https://github.com/kjb7876-lang/m0/actions/runs/39103014083) ran commit `1143fb53291b7686bc52b94fc3a644e968ac1ac2` with baseline hashes `76791c…aa5f5` / `b87e0f…a6ebf4` and pre-fix candidate hashes `146b85…7cad` / `54dfe2…25c`. It used Playwright 1.56.0 and Chromium 141.0.7390.37 under Ubuntu 22.04.5 with sandboxing enabled. The detected renderer was SwiftShader software rendering. The artifact contains eight full `R71_PERF_RUN` rows, `R71_PERF_RESULT`, hash and browser metadata, and the raw result lines in [`performance-prefixed-146b85.json`](performance-prefixed-146b85.json); artifact ZIP SHA-256 is `61dd9916f9bd227de9cf96778dc0717af962326add6f5f8e25f40e095125b5b6`.

| Scenario | Measure | R70 baseline | Pre-fix R71 | Relative change |
| --- | --- | ---: | ---: | ---: |
| Movement | RAF frame interval mean | 424.630 ms | 424.514 ms | −0.027% |
| Movement | RAF frame p95 (mean of 2 trial p95s) | 466.700 ms | 466.700 ms | unchanged |
| Movement | JavaScript draw p95 | 47.100 ms | 47.600 ms | +0.500 ms |
| Movement | GL draw calls / frame | 329.958 | 329.937 | −0.006% |
| Movement | GL buffer uploads / frame | 205.521 | 205.535 | +0.007% |
| EGO stress | RAF frame interval mean | 388.100 ms | 392.461 ms | +1.124% |
| EGO stress | RAF frame p95 (mean of 2 trial p95s) | 458.300 ms | 450.000 ms | −1.811% |
| EGO stress | JavaScript draw p95 | 44.200 ms | 46.250 ms | +2.050 ms |
| EGO stress | GL draw calls / frame | 467.180 | 440.902 | −5.625% |
| EGO stress | GL buffer uploads / frame | 248.537 | 244.656 | −1.563% |

The harness's `regressionFlag` was false for both scenarios because neither mean nor p95 frame interval regressed by more than its 10% threshold. This is not evidence of a general speedup: movement mean/p95 were effectively unchanged, EGO mean was 1.12% slower, and EGO p95 was 1.81% lower. JavaScript draw p95 rose slightly in both scenarios. The candidate is independently not approved because of the HP scaling regression. These measurements describe only the pre-fix hash in this SwiftShader workload and must not be used to approve a later runtime.

## Intermediate diagnostic: paired R70 vs R71 (`b6241524…`)

Preflight paired-profile run [39103707954, job 117605021160](https://github.com/kjb7876-lang/m0/actions/runs/39103707954) completed with eight runs, all using Three.js and no page errors. Candidate hashes were HTML `b6241524…af527` and renderer `54dfe20a…725c`. The job used Playwright 1.56.0, headless sandboxed Chromium, and SwiftShader. The paired job log does not print the exact Chromium version; it is left unknown rather than inferred. Full rows, raw timestamped log lines, result JSON, hashes, and artifact provenance are in [`performance-b624-intermediate.json`](performance-b624-intermediate.json). Artifact ZIP SHA-256: `3dbbaf9e30698f3d7e992ac8ed2929b24cb6eeeabe1de736dcf354b214a1066a`.

| Scenario | Measure | R70 baseline | Intermediate R71 | Relative change |
| --- | --- | ---: | ---: | ---: |
| Movement | RAF frame interval mean | 368.863 ms | 372.515 ms | +0.990% |
| Movement | RAF frame p95 (mean of 2 trial p95s) | 408.350 ms | 416.650 ms | +2.033% |
| Movement | JavaScript draw p95 | 42.150 ms | 42.300 ms | +0.150 ms |
| Movement | GL draw calls / frame | 328.326 | 328.568 | +0.074% |
| Movement | GL buffer uploads / frame | 203.938 | 203.364 | −0.281% |
| EGO stress | RAF frame interval mean | 343.610 ms | 344.186 ms | +0.167% |
| EGO stress | RAF frame p95 (mean of 2 trial p95s) | 383.350 ms | 375.000 ms | −2.178% |
| EGO stress | JavaScript draw p95 | 42.800 ms | 37.400 ms | −5.400 ms |
| EGO stress | GL draw calls / frame | 463.498 | 466.746 | +0.701% |
| EGO stress | GL buffer uploads / frame | 253.288 | 247.857 | −2.145% |

The `regressionFlag` was false for both scenarios, with its 10% threshold. Frame means were slightly slower in both scenarios; movement p95 increased 2.03%, while EGO p95 fell 2.18%. These are small two-trial software-renderer differences and do not establish an overall performance gain. This is an intermediate, not-final runtime; do not pool it with the pre-fix diagnostic or the independent Pages run.

## Final paired R70 vs R71 results

Pending a paired benchmark for the final runtime after the R62 replica-import and R61 clone-save fixes, and review of its `out/r71/performance.json` artifact. Record the final artifact's baseline and candidate hashes, actual browser/device string, per-trial data, and comparison fields here. Keep movement and EGO stress results separate and include draw calls, buffer uploads, and memory/counter deltas where available.

| Scenario | Measure | R70 baseline mean | R71 candidate mean | Relative change | Notes |
| --- | --- | ---: | ---: | ---: | --- |
| Movement | RAF frame interval mean / p95 | pending | pending | pending | two trials per build |
| Movement | JavaScript draw p95 | pending | pending | pending | not GPU time |
| Movement | draw calls / buffer uploads per frame | pending | pending | pending | GL call counters |
| EGO stress | RAF frame interval mean / p95 | pending | pending | pending | six motifs and hit assertion |
| EGO stress | JavaScript draw p95 | pending | pending | pending | not GPU time |
| EGO stress | draw calls / buffer uploads per frame | pending | pending | pending | GL call counters |

### Interpretation

Pending the paired CI artifact. Any change in these headless SwiftShader measurements is limited to this environment and workload. It is not evidence of physical-GPU timing, mobile performance, or a deterministic per-device improvement.

## Evidence files

- Baseline measurements and CDP summaries: [`baseline-profile-ci.json`](baseline-profile-ci.json)
- Harness and current trial/counter definitions: [`../scripts/r71.perf.mjs`](../scripts/r71.perf.mjs)
- Full ABBA artifact: pending next paired benchmark CI run
