# R71 renderer performance review

## Status

The final intended runtime is commit `f657557ebeaa536fe668df5d013b198b832b0ba1`, HTML SHA-256 `cc7aa60090dc3b309242be00e2f473dcb5a3f03ea33920a281b5efd6436a14ad`, and renderer SHA-256 `54dfe20af282d237511ef6f4bb6be3fe54880ad61d82928b0114d15f58df725c`. Two independent paired-profile runs measured these exact hashes: preflight [39104858004](https://github.com/kjb7876-lang/m0/actions/runs/39104858004), job `117608395199`, and test-only rerun [39105884683](https://github.com/kjb7876-lang/m0/actions/runs/39105884683), job `117611505842`. Keep their results separate; the independent rerun differs in sign for movement and EGO results, which reinforces the limits of two-trial software-renderer measurements.

The initial native browser validation for `f657557` failed its attack-hit fixture (`hit.observed=null`). A test-only adjustment in `c315ca78717726c5199e4d0f61380b1b6d6c655a` made the native hit assertion pass (`player HP 700→694.904`), then the browser test timed out waiting for `dist00` after the first save/restore at `scripts/r71.browser.test.mjs:734`. The production HTML and renderer hashes remain unchanged; behavior approval is still pending. The c315ca Pages run [39105887369](https://github.com/kjb7876-lang/m0/actions/runs/39105887369), job `117611514518`, remains in its combined profiling/build step with no result yet. The older Pages run [39104861979](https://github.com/kjb7876-lang/m0/actions/runs/39104861979) failed on the pre-adjustment attack-hit assertion.

Earlier candidate history is retained below for diagnostics. The `146b85…` HTML candidate has a real 4× canonical boss-HP scaling regression (25,686 vs R70 6,421.5) and is pre-fix, not approved. Intermediate commit `12ce0b885af82c0a58a1c3c358afa06964301162` used HTML SHA-256 `b6241524ba119ed98d954452ea5d9bcfef734dd5a7825067b58a027f3faaf527`; its corrected `dist00` boss HP was 6,666 vs R70 6,421.5. It is not the final runtime. Older failed attempts [39102585613](https://github.com/kjb7876-lang/m0/actions/runs/39102585613), [39103014083](https://github.com/kjb7876-lang/m0/actions/runs/39103014083), [39103016351](https://github.com/kjb7876-lang/m0/actions/runs/39103016351), [39102301547](https://github.com/kjb7876-lang/m0/actions/runs/39102301547), [39101458143](https://github.com/kjb7876-lang/m0/actions/runs/39101458143), and [39102582785](https://github.com/kjb7876-lang/m0/actions/runs/39102582785) did not produce measurements for the final hashes and are excluded.

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

The final intended runtime, commit `f657557ebeaa536fe668df5d013b198b832b0ba1`, was measured in paired-profile run [39104858004, job 117608395199](https://github.com/kjb7876-lang/m0/actions/runs/39104858004). The tested HTML and renderer SHA-256 values match `cc7aa60090dc3b309242be00e2f473dcb5a3f03ea33920a281b5efd6436a14ad` and `54dfe20af282d237511ef6f4bb6be3fe54880ad61d82928b0114d15f58df725c`. Full rows, raw timestamped log lines, RESULT, source hashes, and artifact provenance are in [`performance-final-cc7aa-preflight.json`](performance-final-cc7aa-preflight.json). Artifact 12128615198 is 4,840,502 bytes, SHA-256 `63a7efb7ad6046b96bc096cbf4370e3512921d29f993aedfaa1fec942c470939`. It used Ubuntu 22.04.5, Node 22.23.3, Playwright 1.56.0, headless sandboxed Chromium, viewport 1365×850 at DPR 1, seed 70018, and SwiftShader. The paired job did not log the exact Chromium version. The parallel native browser validation failed at the attack-hit fixture (`hit.observed=null`); QA is reviewing that result separately. Pages run [39104861979](https://github.com/kjb7876-lang/m0/actions/runs/39104861979) is an independent measurement of the same hashes and remains pending; do not pool it with this run.

Positive percentages below indicate a higher candidate value; a negative percentage indicates a lower value. Each build has two trials per scenario. These are measurements of the tested runtime, not user hardware performance.

| Scenario | Measure | R70 baseline | R71 candidate | Candidate vs baseline |
| --- | --- | ---: | ---: | ---: |
| Movement | RAF frame interval mean | 479.213 ms | 478.817 ms | −0.083% |
| Movement | RAF frame p95 (mean of 2 trial p95s) | 516.700 ms | 524.950 ms | +1.597% |
| Movement | JavaScript draw p95 | 49.900 ms | 50.100 ms | +0.200 ms |
| Movement | GL draw calls / frame | 331.849 | 331.849 | 0.000% |
| Movement | GL buffer uploads / frame | 203.024 | 203.024 | 0.000% |
| Movement | Material replacements / frame | 0.762 | 0.762 | 0.000% |
| EGO stress | RAF frame interval mean | 445.937 ms | 455.789 ms | +2.209% |
| EGO stress | RAF frame p95 (mean of 2 trial p95s) | 491.700 ms | 508.350 ms | +3.386% |
| EGO stress | JavaScript draw p95 | 50.750 ms | 58.600 ms | +7.850 ms |
| EGO stress | GL draw calls / frame | 460.760 | 455.424 | −1.158% |
| EGO stress | GL buffer uploads / frame | 232.722 | 250.273 | +7.540% |
| EGO stress | Material replacements / frame | 3.060 | 3.189 | +4.239% |

`regressionFlag` was false for both scenarios under the harness's 10% mean/p95 threshold. Movement frame mean was 0.083% lower while p95 was 1.597% higher; EGO frame mean and p95 were 2.209% and 3.386% higher. JavaScript draw p95 was higher in both. The measured result is mixed and does not support a general speedup claim.

The used-JS-heap delta from before to after each 30-second sample was 0 bytes for both builds and scenarios; total JS heap size delta was also 0 bytes. Absolute heap sizes differed between independently created trial contexts, so only within-trial deltas are reported. Each EGO trial retained the six expected motifs and registered real hits. The paired job produced no new CDP profile (`profiles: []`). The earlier R70 profile still dominates the source-level assessment: 93.84% and 95.68% of retained top-35 self-sample duration is unattributed `(program)`, while the named JavaScript rows are individually small. No safe structural renderer optimization is evidenced, and this R71 change remains map-material-only.

## Independent paired rerun: same final runtime, test-only commit

The independent paired-profile job [39105884683, job 117611505842](https://github.com/kjb7876-lang/m0/actions/runs/39105884683) ran harness commit `c315ca78717726c5199e4d0f61380b1b6d6c655a` while measuring the same production HTML `cc7aa600…14ad` and renderer `54dfe20a…725c`. This commit contains test-fixture changes only. The job used the same baseline pins, Ubuntu 22.04.5, Playwright 1.56.0, headless sandboxed Chromium, 1365×850 viewport, DPR 1, seed 70018, and SwiftShader device as the paired test above. The paired job log does not expose the exact Chromium version. Exact aggregate result, eight compact trial rows, and provenance are archived in [`performance-c315ca-independent.json`](performance-c315ca-independent.json); artifact 12128931101 has SHA-256 `c60e84cf4e8a25f2cd441a903d07f0bbd8a1405f99e6064d10c06d5b4e154dc7`.

| Scenario | Measure | R70 baseline | R71 candidate | Candidate vs baseline |
| --- | --- | ---: | ---: | ---: |
| Movement | RAF frame interval mean | 478.817 ms | 482.520 ms | +0.773% |
| Movement | RAF frame p95 (mean of 2 trial p95s) | 525.000 ms | 525.000 ms | unchanged |
| Movement | JavaScript draw p95 | 50.300 ms | 51.400 ms | +1.100 ms |
| Movement | GL draw calls / frame | 331.849 | 332.500 | +0.196% |
| Movement | GL buffer uploads / frame | 203.024 | 202.071 | −0.469% |
| Movement | Material replacements / frame | 0.762 | 0.794 | +4.167% |
| EGO stress | RAF frame interval mean | 445.938 ms | 440.265 ms | −1.272% |
| EGO stress | RAF frame p95 (mean of 2 trial p95s) | 491.650 ms | 475.000 ms | −3.386% |
| EGO stress | JavaScript draw p95 | 44.800 ms | 47.500 ms | +2.700 ms |
| EGO stress | GL draw calls / frame | 427.529 | 481.461 | +12.616% |
| EGO stress | GL buffer uploads / frame | 221.625 | 221.858 | +0.105% |
| EGO stress | Material replacements / frame | 2.993 | 2.897 | −3.188% |

The harness `regressionFlag` was false in both scenarios under its 10% threshold. The movement mean was 0.773% higher with unchanged p95; EGO mean and p95 were lower by 1.272% and 3.386%. JavaScript draw p95 was higher for both scenarios, and EGO draw calls per frame were 12.616% higher. Used-heap and total-heap deltas were 0 bytes for each of the four trials; absolute heap size differed between contexts. All trials stayed on Three.js without errors, and both EGO trials produced six motifs and real hits. No CDP profiles were collected (`profiles: []`).

These outcomes differ from the earlier `f657557` paired run: movement mean shifts from 0.083% lower to 0.773% higher, while EGO changes from 2.209% higher to 1.272% lower. Preserve the two runs separately; their differences do not establish a speedup. Both use software rendering, two trials per build, and live simulation.

## Evidence files

- Baseline measurements and CDP summaries: [`baseline-profile-ci.json`](baseline-profile-ci.json)
- Harness and current trial/counter definitions: [`../scripts/r71.perf.mjs`](../scripts/r71.perf.mjs)
- Final paired-profile data and provenance: [`performance-final-cc7aa-preflight.json`](performance-final-cc7aa-preflight.json)
- Independent same-runtime paired rerun with compact exact trial rows: [`performance-c315ca-independent.json`](performance-c315ca-independent.json)
