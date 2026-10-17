# R65 render and flashlight performance candidate

Date: 2026-10-17  
Repository: `kjb7876-lang/m0`  
Base: `origin/main` at `ba027bb188732159526613c0db161979f445a9e0`  
Branch: `work/storyworld-r65-perf`  
Status: local candidate only; not pushed, merged, or deployed.

## Findings

Camera-follow made the renderer rebuild screen-derived geometry for every retained command on every frame. The comparison includes camera position, so a camera-only move forced `CommandScene.geometry()` to retriangulate paths, allocate vertex/UV arrays and a new `BufferGeometry`, then copy those arrays back into the retained mesh. In a 200-command fixture this caused 27,700 geometry comparisons and 27,700 updates over 160 camera steps.

The flashlight ray function also tested every map obstacle against each ray. A deterministic 333-box scene with 168 rays therefore ran 55,944 box-intersection checks per rebuild, including boxes well outside the light's reach. The 2D draw path additionally allocated sort rows on each frame, and the 3D command path recreated temporary sets and flattened screen points for viewport checks.

These are JavaScript main-thread costs. A discrete GPU cannot make the browser skip that JavaScript work; running on a PC does not remove CPU-bound frame stalls. The measurements below are CPU-side browser emulation and do not identify the user's PC bottleneck or its GPU performance.

## Changes

- Reuse retained world geometry when the renderer confirms that all command points, paths and clips changed only by the exact camera translation. Owner motion, camera zoom, viewport size, render height and geometry changes still use the existing geometry update path.
- Update gradient screen-coordinate buffers in place while reusing their static world geometry.
- Cull flashlight ray and corner candidates by the existing light-radius bounds before per-ray tests. This preserves the corner margin used to seed edge rays.
- Reuse draw-order rows, the seen-key set and per-owner flashlight visibility results; replace temporary flatten/map/spread viewport bounds work with direct bounds scans.
- Preserve art, effects, resolution, damage, and simulation behavior. No relay or Render settings were changed.

## Controlled browser CPU measurements

Chromium 151 headless, 1365×850 CSS pixels, DPR 1. Each result is a CPU-only fixture with real Three.js scene objects, not a loaded game map and not GPU raster timing. Command-scene results are the mean of three 160-frame runs on each build. Flashlight results are the mean of three 40-build runs on each build.

| Same workload | Public base | Candidate | Change |
|---|---:|---:|---:|
| 200 static fill commands during 160 smooth camera-follow steps, mean render update | 1.604 ms | 0.220 ms | −86.3% |
| Command update p50 / p95 (three-run mean) | 1.300 / 2.567 ms | 0.200 / 0.467 ms | lower |
| Geometry comparisons / updates over 160 steps | 27,700 / 27,700 | 0 / 0 | all camera-only rebuilds skipped |
| Candidate camera-translation skips | — | 27,700 | — |
| 333-box flashlight fixture, mean geometry build | 2.448 ms | 1.085 ms | −55.7% |
| Flashlight box-ray checks per build | 55,944 | 27,216 | −51.4% |
| Flashlight polygon / 360 sampled ray distances | reference | identical / max delta 0 | preserved |
| Sampled JS allocation estimate per 160-step pass, three captures | 541,123 bytes | 427,609 bytes | −21.0% |

The allocation estimate is Chrome HeapProfiler sampling at a 1 KiB interval. It estimates allocations observed during the workload; it is not retained heap, peak process memory, or physical-device memory usage.

An additional 83-command differential check covered static fills, a clipped fill, a gradient, an image and a moving hero. After two camera-follow steps, static position and UV buffers matched exactly; gradient screen coordinates differed by at most 0.000061 px from Float32 accumulation. The moving hero took the ordinary geometry update path. A viewport resize triggered the ordinary update path for all 82 retained meshes on both builds. The browser reported no page errors in this fixture.

## Checks and limits

- `node --check docs/dist/phase1.js`: passed.
- Inline HTML JavaScript syntax: 75 blocks checked, passed.
- `git diff --check`: passed.
- `campaign-balance-r64.cpu.test.mjs`: 6/6 passed.
- `campaign-balance-r63r2.cpu.test.mjs`: 1/4 passed; its three health assertions expect obsolete 0.4/0.5/0.8 ratios while current R64 behavior returns 0.2/0.25/0.4. This performance patch does not edit those scripts or balance code.
- Full gameplay/browser-map validation is blocked in this checkout because runtime art/map files such as `docs/assets/maps/generated-v31217/ep1a_demon_tree_palace_ruin.webp` are absent. The public Pages GET also returns HTTP 403 from this execution environment.
- Physical PC, real GPU, display capture, co-op session and real-map flashlight profiling were not performed. The existing R65 screenshots in this directory predate this performance candidate and are not presented as screenshots of this build.

The evidence supports lower CPU work in the isolated camera-follow and flashlight functions. It does not establish a whole-game FPS or hardware-GPU gain. No changes have been published.
