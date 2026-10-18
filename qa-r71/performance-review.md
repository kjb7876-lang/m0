# R71 renderer performance review

## Status

The paired R70/R71 ABBA benchmark has not run yet. Pages run [39101458143](https://github.com/kjb7876-lang/m0/actions/runs/39101458143) completed with a browser entry-check failure before the performance step; it predates the performance-step reorder. Its artifact contains baseline profiling and browser evidence only, with no paired ABBA result. The measured comparison below remains pending the next CI run after the QA and preview fixes.

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

## Paired R70 vs R71 results

Pending the next paired benchmark run and review of its `out/r71/performance.json` artifact. Record the artifact's baseline and candidate hashes, actual browser/device string, per-trial data, and comparison fields here. Keep movement and EGO stress results separate and include draw calls, buffer uploads, and memory/counter deltas where available.

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
