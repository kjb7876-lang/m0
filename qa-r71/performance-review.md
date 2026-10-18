# R71 renderer performance review

## Status

The current measured candidate is commit `dff330b89a8e10ee98b610191061e0840394b989`, HTML SHA-256 `de6536bca2f3860c7195b39e4f7d1397ff8db7acb1558015f14a95c1b4e16646`, and unchanged renderer SHA-256 `54dfe20af282d237511ef6f4bb6be3fe54880ad61d82928b0114d15f58df725c`. Six independent paired ABBA runs measured these exact hashes: preflight [39108393150](https://github.com/kjb7876-lang/m0/actions/runs/39108393150), job `117619084414`; Pages [39108395884](https://github.com/kjb7876-lang/m0/actions/runs/39108395884), job `117619093194`; test-only harness commit 83386e7 preflight [39109696339](https://github.com/kjb7876-lang/m0/actions/runs/39109696339), job `117622971282`; test-only harness commit 0cd0167 preflight [39111040632](https://github.com/kjb7876-lang/m0/actions/runs/39111040632), job `117627051629`; d58ffc8 preflight [39112456285](https://github.com/kjb7876-lang/m0/actions/runs/39112456285), job `117631278108`; and 0cd0167 Pages [39111045136](https://github.com/kjb7876-lang/m0/actions/runs/39111045136), job `117627064878`. Results are mixed: the first preflight means were about 0.2% lower, with EGO p95 2.263% higher; initial Pages movement mean/p95 were 8.392%/2.669% higher; 83386e7 movement was effectively flat while EGO was 2.105%/3.494% slower; 0cd0167 preflight was 0.845%/0.010% slower on movement and 1.622%/1.728% slower on EGO; d58ffc8 was 1.116%/0.017% slower on movement and 0.596%/0.018% slower on EGO; and the separate 0cd0167 Pages pair was 0.711% slower on movement but 1.531%/4.540% lower on EGO mean/p95. Separate hosted-runner baselines vary substantially. Keep all runs separate; they do not support an overall speedup claim. All used SwiftShader, not a physical GPU. Behavior approval remains pending.

The superseded `cc7aa…` runtime is commit `f657557ebeaa536fe668df5d013b198b832b0ba1`, HTML SHA-256 `cc7aa60090dc3b309242be00e2f473dcb5a3f03ea33920a281b5efd6436a14ad`, with the same renderer SHA. Four independent paired-profile runs measured those hashes. Subsequent QA found a production rendering defect: the beacon calls `strokeRect`, but `DrawCommands` implements `rect`/`stroke` only. Therefore every `cc7aa…` performance sample below is pre-fix diagnostic evidence, not final acceptance. The replacement `de6536…` runtime has its own paired run above; do not reuse these measurements to judge it.

The initial native browser validation for `f657557` failed its attack-hit fixture (`hit.observed=null`). A test-only adjustment in `c315ca78717726c5199e4d0f61380b1b6d6c655a` made the native hit assertion pass (`player HP 700→694.904`), then the browser test timed out waiting for `dist00` after the first save/restore at `scripts/r71.browser.test.mjs:734`. The c315ca Pages run [39105887369](https://github.com/kjb7876-lang/m0/actions/runs/39105887369), job `117611514518`, completed with that validation failure. A later `58c979b` preflight run [39106756667](https://github.com/kjb7876-lang/m0/actions/runs/39106756667), job `117614157150`, reported 6/8 browser checks passing; QA classified the missing `strokeRect` method as a real production defect, with a separate legacy-replica fixture lookup failure. Behavior approval remains pending. The older Pages run [39104861979](https://github.com/kjb7876-lang/m0/actions/runs/39104861979) failed on the pre-adjustment attack-hit assertion.

Earlier candidate history is retained below for diagnostics. The `146b85…` HTML candidate has a real 4× canonical boss-HP scaling regression (25,686 vs R70 6,421.5) and is pre-fix, not approved. Intermediate commit `12ce0b885af82c0a58a1c3c358afa06964301162` used HTML SHA-256 `b6241524ba119ed98d954452ea5d9bcfef734dd5a7825067b58a027f3faaf527`; its corrected `dist00` boss HP was 6,666 vs R70 6,421.5. It is not the final runtime. Older failed attempts [39102585613](https://github.com/kjb7876-lang/m0/actions/runs/39102585613), [39103014083](https://github.com/kjb7876-lang/m0/actions/runs/39103014083), [39103016351](https://github.com/kjb7876-lang/m0/actions/runs/39103016351), [39102301547](https://github.com/kjb7876-lang/m0/actions/runs/39102301547), [39101458143](https://github.com/kjb7876-lang/m0/actions/runs/39101458143), and [39102582785](https://github.com/kjb7876-lang/m0/actions/runs/39102582785) did not produce measurements for the final hashes and are excluded.

No structural renderer optimization is claimed for R71. The renderer/map work in scope changes Three.js map material treatment for zone readability. It does not change map geometry, renderer fallback, resolution, or effects as a performance shortcut.

## Pinned input and measurement setup

The benchmark pins R70 game commit `34338945dc47f5bcb8c2ce05b2d7de62d72c7ad5`. Its expected `index.html` SHA-256 is `76791c87cf6b3f70d99f35aafc7dacaf3adb389f4be10081c024f8802a9aa5f5`; its `dist/phase1.js` SHA-256 is `b87e0feb34c321d19e557b7d08e63b9f0744f1e28b9e7d6e2ee7ea9ca0a6ebf4`. The harness checks both hashes before it starts.

The recorded baseline-only run is CI run `39098329927`, harness commit `0b6ea08a9113bf4af5bf110747a3f48b63bb91fc`. It ran on GitHub Actions Ubuntu 22.04 with Playwright 1.56 managed Chromium, headless and sandboxed, using SwiftShader. The renderer string was `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)`. These results are from a software renderer, not a physical GPU or a mobile device.

The current full-run harness compares `_r70/docs` with `_pages/docs` in ABBA order (`baseline`, `candidate`, `candidate`, `baseline`) for each of two live scenarios. Both builds use viewport 1365×850, DPR 1, seeded random input (70018), the same `dist00` map, active Three.js renderer, enabled flashlight, and real effects. Movement is keyboard-driven; EGO stress casts the six-motif thread ability and checks hits and observed motifs. Each timing trial samples for 30 seconds after a 2-second warm-up. A harness-only survival fixture (`hp=maxHP()`, `invincible=1000000`) is applied equally to both builds. It is not a game change.

The harness records RAF frame intervals, JavaScript `draw` and `tick` durations, long tasks, renderer counters, GL draw/texture/buffer calls, objects/effects, and JS heap before and after. ABBA order helps balance run-order effects, but there are only two trials per build per scenario; the simulation is live rather than a deterministic replay. These data do not establish performance on a user's hardware.

## Current paired profile: de6536 candidate

The paired-profile job [39108393150, job 117619084414](https://github.com/kjb7876-lang/m0/actions/runs/39108393150) compared pinned R70 with the exact `de6536…6646` HTML and `54dfe…725c` renderer hashes. It used Ubuntu 22.04.5, Playwright 1.56.0, headless sandboxed Chromium, viewport 1365×850, DPR 1, seed 70018, and SwiftShader. The exact Chromium version was not included in this paired-job log. The eight full `R71_PERF_RUN` rows, counters, heap values, source hashes, full result, and provenance are archived in [`performance-de6536-final.json`](performance-de6536-final.json). Artifact 12129366904 SHA-256 `c38f78dae692287260891fa627b948b60f19054c0cbf04916cae0565249108f0`.

| Scenario | Measure | R70 baseline | R71 candidate | Candidate vs baseline |
| --- | --- | ---: | ---: | ---: |
| Movement | RAF frame interval mean | 356.698 ms | 356.007 ms | −0.194% |
| Movement | RAF frame p95 (mean of 2 trial p95s) | 391.700 ms | 391.700 ms | unchanged |
| Movement | JavaScript draw p95 | 40.100 ms | 40.700 ms | +0.600 ms |
| Movement | GL draw calls / frame | 327.941 | 326.020 | −0.586% |
| Movement | GL buffer uploads / frame | 204.190 | 203.059 | −0.554% |
| Movement | Material replacements / frame | 0.763 | 0.765 | +0.179% |
| EGO stress | RAF frame interval mean | 332.588 ms | 331.802 ms | −0.236% |
| EGO stress | RAF frame p95 (mean of 2 trial p95s) | 366.700 ms | 375.000 ms | +2.263% |
| EGO stress | JavaScript draw p95 | 41.650 ms | 38.550 ms | −3.100 ms |
| EGO stress | GL draw calls / frame | 437.654 | 466.167 | +6.515% |
| EGO stress | GL buffer uploads / frame | 261.165 | 249.226 | −4.572% |
| EGO stress | Material replacements / frame | 4.412 | 3.419 | −22.502% |

Both harness `regressionFlag` values were false under its 10% mean/p95 threshold. Means were 0.194% and 0.236% lower, movement p95 was unchanged, and EGO p95 was 2.263% higher. Draw p95 and renderer counters were mixed. Used-JS-heap and total-JS-heap deltas were 0 bytes in all eight trials; absolute heap sizes differed by context. These browser API readings do not establish the absence of memory leaks or measure GPU memory. Each EGO trial used all six motifs and registered hits (272/261 baseline, 267/267 candidate). No JS errors were reported. The paired job captured no new CPU profiles (`profiles: []`). These results do not demonstrate a general speedup. The device was SwiftShader software rendering; its times are not physical-GPU measurements.

## Independent Pages pair for de6536

Pages run [39108395884, job 117619093194](https://github.com/kjb7876-lang/m0/actions/runs/39108395884) measured the same de6536 HTML and renderer hashes in a separate hosted runner. The job checked out merge commit `06f6b73459814f246e88cf395ddfa472d957b400`, merging runtime commit `dff330b89a8e10ee98b610191061e0840394b989` into pinned R70. It used Ubuntu 22.04.5, Node 22, Playwright 1.56.0, headless sandboxed Chromium `141.0.7390.37`, viewport 1365×850, DPR 1, seed 70018, and SwiftShader. The paired result, all eight ABBA trial rows, per-trial counters and heap values, same-job R70 CPU-profile samples, browser validation, and provenance are archived in [`performance-de6536-pages.json`](performance-de6536-pages.json). The paired performance rows do not print a Chromium version; the same job’s browser-validation step reported Chromium `141.0.7390.37`. Artifact 12130535458 (26,147,588 bytes) SHA-256 `9d14874f3763e164f32d17cc2bcdc7b71e938642dcc8f5cb80215853da7f64`.

| Scenario | Measure | R70 baseline | R71 candidate | Candidate vs baseline |
| --- | --- | ---: | ---: | ---: |
| Movement | RAF frame interval mean | 266.730 ms | 289.115 ms | +8.392% |
| Movement | RAF frame p95 (mean of 2 trial p95s) | 316.600 ms | 325.050 ms | +2.669% |
| Movement | JavaScript draw p95 | 34.100 ms | 31.850 ms | −2.250 ms |
| Movement | GL draw calls / frame | 332.186 | 328.206 | −1.198% |
| Movement | GL buffer uploads / frame | 196.314 | 207.162 | +5.526% |
| Movement | Material replacements / frame | 0.655 | 0.797 | +21.761% |
| EGO stress | RAF frame interval mean | 247.964 ms | 244.291 ms | −1.481% |
| EGO stress | RAF frame p95 (mean of 2 trial p95s) | 266.750 ms | 266.700 ms | −0.019% |
| EGO stress | JavaScript draw p95 | 29.400 ms | 29.450 ms | +0.050 ms |
| EGO stress | GL draw calls / frame | 449.516 | 474.842 | +5.634% |
| EGO stress | GL buffer uploads / frame | 263.390 | 245.852 | −6.658% |
| EGO stress | Material replacements / frame | 3.279 | 3.139 | −4.276% |

The harness `regressionFlag` was false for both scenarios under its 10% threshold. Movement was slower in this Pages pair: mean frame interval increased 8.392% and p95 increased 2.669%. EGO mean improved 1.481% while p95 was effectively unchanged. Do not treat the lower EGO mean as an overall win.

The Pages-run baseline means (movement 266.730 ms, EGO 247.964 ms) were roughly 25% lower than the preflight-run baselines (356.698 ms, 332.588 ms), despite the same reported scenario, viewport, seed, software renderer, OS image, and harness timings. This large across-run shift is evidence of hosted-runner or workload variability. Keep each pair separate and do not pool or generalize them. The Pages paired rows also showed zero used-heap and total-heap delta within each trial, and no page errors.

The Pages browser suite passed 6/8 checks; `native-expanded-point-drop-pickup-and-flashlight` and `two-page-local-coop-health-rewards-expanded-drops` failed after profiling. The measured hashes match the runtime under review, but the browser result remains a blocker for approval. This job did not deploy Pages.

## Independent preflight rerun: de6536 runtime, test-only 83386e7 harness

Paired-profile job [39109696339, job 117622971282](https://github.com/kjb7876-lang/m0/actions/runs/39109696339) ran harness commit `83386e7873e9c395c4da5cbebc69160e8b865b52` and measured the same candidate HTML `de6536…6646` and renderer `54dfe…725c` hashes. The job used the pinned R70 baseline, Ubuntu 22.04.5, Node 22.23.3, Playwright 1.56.0, headless sandboxed Chromium, viewport 1365×850 at DPR 1, seed 70018, and SwiftShader. The exact Chromium version was not present in this paired-profile job's log. All eight trial rows, counters, heap readings, result, and provenance are archived in [`performance-83386-independent.json`](performance-83386-independent.json); artifact 12130575542 SHA-256 `44339bca4c7d10d1ad2646d4d9626d6cee9511ae796b924cc772371e157f69a9`.

| Scenario | Measure | R70 baseline | R71 candidate | Candidate vs baseline |
| --- | --- | ---: | ---: | ---: |
| Movement | RAF frame interval mean | 479.742 ms | 479.610 ms | −0.0275% |
| Movement | RAF frame p95 (mean of 2 trial p95s) | 516.700 ms | 516.700 ms | unchanged |
| Movement | JavaScript draw p95 | 50.100 ms | 49.600 ms | −0.500 ms |
| Movement | GL draw calls / frame | 331.849 | 332.333 | +0.146% |
| Movement | GL buffer uploads / frame | 203.024 | 193.476 | −4.702% |
| Movement | Material replacements / frame | 0.762 | 0.770 | +1.042% |
| EGO stress | RAF frame interval mean | 439.716 ms | 448.972 ms | +2.105% |
| EGO stress | RAF frame p95 (mean of 2 trial p95s) | 475.100 ms | 491.700 ms | +3.494% |
| EGO stress | JavaScript draw p95 | 50.050 ms | 49.000 ms | −1.050 ms |
| EGO stress | GL draw calls / frame | 472.942 | 460.055 | −2.724% |
| EGO stress | GL buffer uploads / frame | 220.261 | 235.741 | +7.028% |
| EGO stress | Material replacements / frame | 2.928 | 3.121 | +6.625% |

Both `regressionFlag` values were false under the harness's 10% threshold. Used and total JS heap deltas were 0 bytes in all eight trials; no JS errors were reported, and the EGO samples retained the six expected motifs with real hits. The result is mixed: movement was effectively flat and EGO was slower. The baseline means (479.742 ms movement, 439.716 ms EGO) differ sharply from both Pages (266.730/247.964 ms) and the earlier preflight pair (356.698/332.588 ms). Keep this independent VM result separate; do not pool it or infer an overall speedup. SwiftShader timings are not physical-GPU performance.

## Independent preflight pair: de6536 runtime, test-only 0cd0167 harness

Paired-profile job [39111040632, job 117627051629](https://github.com/kjb7876-lang/m0/actions/runs/39111040632) ran harness commit `0cd016713f79b3f2818198363fd65acea0734ab1` and measured the same candidate HTML `de6536…6646` and renderer `54dfe…725c` hashes. It used the pinned R70 baseline, Ubuntu 22.04.5, Node 22.23.3, Playwright 1.56.0, headless sandboxed Chromium, viewport 1365×850 at DPR 1, seed 70018, and SwiftShader. The exact Chromium version was not printed in this paired-profile job's log. Its eight timing/counter/heap rows and provenance are archived in [`performance-0cd0167-independent.json`](performance-0cd0167-independent.json); artifact 12130632729 was 4,829,908 bytes, SHA-256 `fb7368006ca2b7a83ca010180be467beae23ed9a4ef90c428e7aa28c1e8ba88e`.

| Scenario | Measure | R70 baseline | R71 candidate | Candidate vs baseline |
| --- | --- | ---: | ---: | ---: |
| Movement | RAF frame interval mean | 476.510 ms | 480.538 ms | +0.845% |
| Movement | RAF frame p95 (mean of 2 trial p95s) | 516.700 ms | 516.750 ms | +0.010% |
| Movement | JavaScript draw p95 | 49.350 ms | 51.100 ms | +1.750 ms |
| Movement | GL draw calls / frame | 331.796 | 331.857 | +0.018% |
| Movement | GL buffer uploads / frame | 203.500 | 203.016 | −0.238% |
| Movement | Material replacements / frame | 0.764 | 0.762 | −0.244% |
| EGO stress | RAF frame interval mean | 440.518 ms | 447.662 ms | +1.622% |
| EGO stress | RAF frame p95 (mean of 2 trial p95s) | 483.350 ms | 491.700 ms | +1.728% |
| EGO stress | JavaScript draw p95 | 46.850 ms | 47.200 ms | +0.350 ms |
| EGO stress | GL draw calls / frame | 450.615 | 429.576 | −4.670% |
| EGO stress | GL buffer uploads / frame | 215.789 | 227.821 | +5.576% |
| EGO stress | Material replacements / frame | 2.956 | 3.023 | +2.251% |

Both `regressionFlag` values were false under the harness's 10% threshold. Used and total JS heap deltas were 0 bytes in all eight trials; no JS errors were reported, and EGO stress retained all six expected motifs with real hits. This is a mixed pair, not evidence of a speedup. Its baseline means (476.510 ms movement, 440.518 ms EGO) are close to the separate 83386e7 preflight pair but far above the Pages pair (266.730/247.964 ms) and earlier preflight pair (356.698/332.588 ms). Keep it unpooled. The job returned `profiles: []`, so it did not capture a new CDP CPU profile. The browser was SwiftShader software rendering, not a physical GPU.

## Independent preflight pair: de6536 runtime, test-only d58ffc8 harness

Paired-profile job [39112456285, job 117631278108](https://github.com/kjb7876-lang/m0/actions/runs/39112456285) ran harness commit `d58ffc8691822cfc5bbec9913fb99c32d38a626b` and measured the same candidate HTML `de6536…6646` and renderer `54dfe…725c` hashes. It used pinned R70 inputs, Ubuntu 22.04.5, Node 22.23.3, Playwright 1.56.0, headless sandboxed Chromium, viewport 1365×850 at DPR 1, seed 70018, and SwiftShader. The exact Chromium version was not logged by this job. Eight paired rows, counters, heap data, result, hashes, and artifact provenance are in [`performance-d58ffc8-independent.json`](performance-d58ffc8-independent.json); artifact 12130099660 was 4,802,941 bytes, SHA-256 `b47b50400cf1da09da1ffb84fcd6366ec4e60e795ec13e408583200b8aba9eb3`.

| Scenario | Measure | R70 baseline | R71 candidate | Candidate vs baseline |
| --- | --- | ---: | ---: | ---: |
| Movement | RAF frame interval mean | 264.097 ms | 267.044 ms | +1.116% |
| Movement | RAF frame p95 (mean of 2 trial p95s) | 300.050 ms | 300.100 ms | +0.017% |
| Movement | JavaScript draw p95 | 31.200 ms | 32.500 ms | +1.300 ms |
| Movement | GL draw calls / frame | 330.860 | 330.280 | −0.175% |
| Movement | GL buffer uploads / frame | 203.965 | 203.034 | −0.456% |
| Movement | Material replacements / frame | 0.741 | 0.699 | −5.687% |
| EGO stress | RAF frame interval mean | 252.009 ms | 253.510 ms | +0.596% |
| EGO stress | RAF frame p95 (mean of 2 trial p95s) | 275.000 ms | 275.050 ms | +0.018% |
| EGO stress | JavaScript draw p95 | 29.700 ms | 31.250 ms | +1.550 ms |
| EGO stress | GL draw calls / frame | 470.382 | 473.778 | +0.722% |
| EGO stress | GL buffer uploads / frame | 247.019 | 251.945 | +1.994% |
| EGO stress | Material replacements / frame | 3.179 | 3.135 | −1.379% |

Both `regressionFlag` values were false under the harness's 10% threshold, but mean frame times increased in both scenarios. Heap deltas were 0 bytes in all eight trials; no JS errors were reported and the EGO samples retained the six expected motifs with hits. This is a separate low-latency software-renderer VM from the other pairs; do not pool it. The result does not support an overall speedup claim. The result contained `profiles:[]`; no new CDP CPU profile was collected.

## Independent Pages pair: de6536 runtime, test-only 0cd0167 harness

Pages run [39111045136, job 117627064878](https://github.com/kjb7876-lang/m0/actions/runs/39111045136) ran harness commit `0cd016713f79b3f2818198363fd65acea0734ab1` and measured the same de6536 HTML / 54dfe renderer hashes on a separate hosted runner. It used Ubuntu 22.04.5, Node 22.23.3, Playwright 1.56.0, headless sandboxed Chromium, viewport 1365×850 at DPR 1, seed 70018, and SwiftShader. The paired performance rows do not log the exact Chromium version. Eight timing/counter/heap rows, same-job R70 profile summaries, result, hashes, and artifact provenance are archived in [`performance-0cd0167-pages.json`](performance-0cd0167-pages.json); artifact 12131490200 was 29,352,649 bytes, SHA-256 `a6a4858d7a52dc0d8229274b6b9decefe0b9dcf7264f2709c52d7a5e43f130e3`.

| Scenario | Measure | R70 baseline | R71 candidate | Candidate vs baseline |
| --- | --- | ---: | ---: | ---: |
| Movement | RAF frame interval mean | 359.510 ms | 362.067 ms | +0.711% |
| Movement | RAF frame p95 (mean of 2 trial p95s) | 400.000 ms | 400.000 ms | unchanged |
| Movement | JavaScript draw p95 | 39.750 ms | 40.500 ms | +0.750 ms |
| Movement | GL draw calls / frame | 327.976 | 328.042 | +0.020% |
| Movement | GL buffer uploads / frame | 205.274 | 204.890 | −0.187% |
| Movement | Material replacements / frame | 0.762 | 0.766 | +0.602% |
| EGO stress | RAF frame interval mean | 333.795 ms | 328.685 ms | −1.531% |
| EGO stress | RAF frame p95 (mean of 2 trial p95s) | 366.700 ms | 350.050 ms | −4.540% |
| EGO stress | JavaScript draw p95 | 39.400 ms | 36.550 ms | −2.850 ms |
| EGO stress | GL draw calls / frame | 436.815 | 458.033 | +4.857% |
| EGO stress | GL buffer uploads / frame | 255.922 | 246.678 | −3.612% |
| EGO stress | Material replacements / frame | 3.586 | 4.333 | +20.823% |

Both harness `regressionFlag` values were false. Movement mean increased 0.711% with p95 unchanged; EGO mean and p95 were lower by 1.531% and 4.540%, while draw calls and material replacements rose. The result is mixed; do not claim a speedup. Used and total JS heap deltas were 0 bytes in all eight trials. This Pages pair is independent of the other five VM pairs. No browser-case results are included in this performance archive. All measurements use SwiftShader, not physical-GPU timing.

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

## Initial paired R70 vs R71 results for cc7aa (pre-beacon-fix)

The initially intended `cc7aa…` runtime, commit `f657557ebeaa536fe668df5d013b198b832b0ba1`, was measured in paired-profile run [39104858004, job 117608395199](https://github.com/kjb7876-lang/m0/actions/runs/39104858004). The tested HTML and renderer SHA-256 values match `cc7aa60090dc3b309242be00e2f473dcb5a3f03ea33920a281b5efd6436a14ad` and `54dfe20af282d237511ef6f4bb6be3fe54880ad61d82928b0114d15f58df725c`. Full rows, raw timestamped log lines, RESULT, source hashes, and artifact provenance are in [`performance-final-cc7aa-preflight.json`](performance-final-cc7aa-preflight.json). Artifact 12128615198 is 4,840,502 bytes, SHA-256 `63a7efb7ad6046b96bc096cbf4370e3512921d29f993aedfaa1fec942c470939`. It used Ubuntu 22.04.5, Node 22.23.3, Playwright 1.56.0, headless sandboxed Chromium, viewport 1365×850 at DPR 1, seed 70018, and SwiftShader. The paired job did not log the exact Chromium version. The parallel native browser validation failed at the attack-hit fixture (`hit.observed=null`); QA is reviewing that result separately. Pages run [39104861979](https://github.com/kjb7876-lang/m0/actions/runs/39104861979) independently measured the same pre-fix hashes and failed on the pre-adjustment attack-hit assertion.

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

## Independent paired rerun: same pre-fix runtime, test-only commit

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

The harness `regressionFlag` was false in both scenarios under its 10% threshold. The movement mean was 0.773% higher with unchanged p95; EGO mean and p95 were lower by 1.272% and 3.386%. JavaScript draw p95 was higher for both scenarios, and EGO draw calls per frame were 12.616% higher. Used-heap and total-heap deltas were 0 bytes for each of the eight trials; absolute heap size differed between contexts. All trials stayed on Three.js without errors, and both candidate EGO trials produced six motifs and real hits. No CDP profiles were collected (`profiles: []`).

These outcomes differ from the earlier `f657557` paired run: movement mean shifts from 0.083% lower to 0.773% higher, while EGO changes from 2.209% higher to 1.272% lower. Preserve the two runs separately; their differences do not establish a speedup. Both use software rendering, two trials per build, and live simulation.

## More independent runs for cc7aa (diagnostic only)

The paired-profile job [39106756667, job 117614156950](https://github.com/kjb7876-lang/m0/actions/runs/39106756667) ran test-only harness commit `58c979b1e3605ebb61964d1dd65934a96168ddcf` against the exact same `cc7aa…14ad` / `54dfe…725c` runtime hashes. It used the same baseline pins and 1365×850, DPR 1, seed 70018, headless sandboxed Playwright 1.56 Chromium under Ubuntu 22.04.5 with SwiftShader. The exact browser version is not available in the paired-job log. Eight compact trial rows and the full aggregate result are in [`performance-58c979b-independent.json`](performance-58c979b-independent.json); artifact 12128469746 SHA-256 `483bc006aa3971445ae2d67f6d10e3a87c52df10b8cd69914a36e18077fdd08e`.

| Scenario | Measure | R70 baseline | R71 candidate | Candidate vs baseline |
| --- | --- | ---: | ---: | ---: |
| Movement | RAF frame interval mean | 478.817 ms | 478.022 ms | −0.166% |
| Movement | RAF frame p95 (mean of 2 trial p95s) | 516.700 ms | 516.700 ms | unchanged |
| Movement | JavaScript draw p95 | 52.900 ms | 49.800 ms | −3.100 ms |
| Movement | GL draw calls / frame | 331.921 | 331.857 | −0.019% |
| Movement | GL buffer uploads / frame | 202.984 | 203.016 | +0.016% |
| Movement | Material replacements / frame | 0.762 | 0.762 | unchanged |
| EGO stress | RAF frame interval mean | 437.180 ms | 451.972 ms | +3.383% |
| EGO stress | RAF frame p95 (mean of 2 trial p95s) | 483.300 ms | 525.000 ms | +8.628% |
| EGO stress | JavaScript draw p95 | 43.850 ms | 52.150 ms | +8.300 ms |
| EGO stress | GL draw calls / frame | 474.674 | 434.537 | −8.458% |
| EGO stress | GL buffer uploads / frame | 218.362 | 242.194 | +10.911% |
| EGO stress | Material replacements / frame | 2.935 | 3.149 | +7.314% |

Both harness `regressionFlag` values were false under its 10% threshold; EGO candidate mean and p95 were both higher. The result remains mixed and does not support a speedup claim.

The Pages job [39105887369, job 117611514518](https://github.com/kjb7876-lang/m0/actions/runs/39105887369) ran the same cc7aa production hashes using test-only harness commit `c315ca78717726c5199e4d0f61380b1b6d6c655a`. It used Ubuntu 22.04.5, Playwright 1.56.0, sandboxed headless Chromium `141.0.7390.37`, viewport 1365×850 at DPR 1, seed 70018, and SwiftShader. The 8 paired trial summaries, R70 profile top functions, browser result, and provenance are archived in [`performance-c315ca-pages-independent.json`](performance-c315ca-pages-independent.json); artifact 12128028924 SHA-256 `f713391970fa5aa45cd52ca9c8696334d04c6b5789e6805003e1068e04d777d4`.

| Scenario | Measure | R70 baseline | R71 candidate | Candidate vs baseline |
| --- | --- | ---: | ---: | ---: |
| Movement | RAF frame interval mean | 273.562 ms | 274.650 ms | +0.398% |
| Movement | RAF frame p95 (mean of 2 trial p95s) | 333.300 ms | 333.300 ms | unchanged |
| Movement | JavaScript draw p95 | 38.250 ms | 38.950 ms | +0.700 ms |
| Movement | GL draw calls / frame | 331.066 | 329.401 | −0.503% |
| Movement | GL buffer uploads / frame | 201.013 | 194.386 | −3.297% |
| Movement | Material replacements / frame | 0.615 | 0.639 | +3.878% |
| EGO stress | RAF frame interval mean | 259.125 ms | 248.181 ms | −4.223% |
| EGO stress | RAF frame p95 (mean of 2 trial p95s) | 308.250 ms | 275.050 ms | −10.771% |
| EGO stress | JavaScript draw p95 | 35.850 ms | 32.150 ms | −3.700 ms |
| EGO stress | GL draw calls / frame | 471.659 | 482.522 | +2.303% |
| EGO stress | GL buffer uploads / frame | 241.352 | 249.678 | +3.449% |
| EGO stress | Material replacements / frame | 2.940 | 3.231 | +9.895% |

Both `regressionFlag` values were false. This Pages job's baseline movement and EGO means (273.562 ms, 259.125 ms) were much lower than the 58c preflight run's corresponding baselines (478.817 ms, 437.180 ms). Since they are separate hosted software-renderer runners with live simulations, keep all run pairs isolated and avoid pooling their changes. The spread reinforces the timing limits rather than supporting a new speedup claim. Used-heap and total-heap deltas were 0 bytes in all eight paired Pages timing trials; the same-run R70 profile's top sample was unattributed `(program)` at 92.59% of retained top-35 movement self samples and 93.57% for EGO stress.

The c315ca Pages browser step did not pass: after `R71_NATIVE_HIT` confirmed a real hit, it timed out after the first save/restore waiting for `dist00` (`scripts/r71.browser.test.mjs:734`). A subsequent 58c979b browser aggregate reported 6/8 checks; QA found the unsupported `strokeRect` call is a production defect in this measured runtime, so all these profiles and paired timings are pre-fix diagnostics. Retest the changed HTML hash with a fresh full ABBA pair after the rendering fix.

## Evidence files

- Baseline measurements and CDP summaries: [`baseline-profile-ci.json`](baseline-profile-ci.json)
- Harness and current trial/counter definitions: [`../scripts/r71.perf.mjs`](../scripts/r71.perf.mjs)
- Initial cc7aa paired-profile data and provenance: [`performance-final-cc7aa-preflight.json`](performance-final-cc7aa-preflight.json)
- Independent same-runtime paired rerun with compact exact trial rows: [`performance-c315ca-independent.json`](performance-c315ca-independent.json)
- Independent `58c979b` paired-profile rows and result: [`performance-58c979b-independent.json`](performance-58c979b-independent.json)
- c315ca Pages paired result and same-run baseline profile/browser evidence: [`performance-c315ca-pages-independent.json`](performance-c315ca-pages-independent.json)
- Current de6536 paired result with all eight raw trial rows, counters, heaps, and provenance: [`performance-de6536-final.json`](performance-de6536-final.json)
- Independent de6536 Pages pair, browser result, same-job R70 profile summary, and provenance: [`performance-de6536-pages.json`](performance-de6536-pages.json)
- Independent 83386e7 preflight pair with eight trial rows, counters, heaps, and provenance: [`performance-83386-independent.json`](performance-83386-independent.json)
- Independent 0cd0167 preflight pair with eight trial rows, counters, heaps, and provenance: [`performance-0cd0167-independent.json`](performance-0cd0167-independent.json)
- Independent d58ffc8 preflight pair with eight trial rows, counters, heaps, and provenance: [`performance-d58ffc8-independent.json`](performance-d58ffc8-independent.json)
- Independent 0cd0167 Pages pair with eight trial rows, counters, heaps, and provenance: [`performance-0cd0167-pages.json`](performance-0cd0167-pages.json)
