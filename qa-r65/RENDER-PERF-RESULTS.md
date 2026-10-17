# R65 render and flashlight performance candidate

Date: 2026-10-17
Repository: `kjb7876-lang/m0`
Base: `origin/main` at `ba027bb188732159526613c0db161979f445a9e0`
Candidate: `a24542dca9c3b9868e429fee887de73c8a18fcc6` plus this validation record
Branch: `work/storyworld-r65-perf`
Status: validated candidate; publication result is recorded separately.

## What caused the stutter

Camera-follow caused the retained Three.js command renderer to rebuild screen-derived geometry even when an object's world geometry had not changed. The camera position was part of the comparison key, so moving the camera retriangulated paths, allocated vertex and UV arrays and a new `BufferGeometry`, then copied arrays back into existing meshes. In a 200-command fixture, 160 camera-follow steps caused 27,700 geometry comparisons and 27,700 updates.

Flashlight visibility also tested every obstacle for every ray, including obstacles outside the light's reach. A deterministic scene with 333 obstacle boxes and 168 rays performed 55,944 box-ray checks for one rebuild. The render path also allocated draw-sort rows, temporary sets and flattened viewport points repeatedly.

These are serial JavaScript main-thread costs. A stronger GPU does not remove geometry-building and collision-check work that runs before drawing, which is why a PC can still hitch. This analysis does not identify the user's computer-specific bottleneck without a profile from that computer.

## Changes

- Reuse retained world geometry when all command geometry changed only by the exact camera translation. Moving owners, zoom, viewport size, render height and real geometry changes still use the original update path.
- Update gradient screen-coordinate buffers in place while retaining static world geometry.
- Restrict flashlight ray and corner candidates to the light-radius bounds before intersection tests, preserving the existing corner margin and seeded edge rays.
- Reuse draw-order rows, the seen-key set and per-owner visibility results; scan viewport bounds directly instead of allocating flattened point lists.
- Keep authored art, effects, resolution, damage, combat and co-op protocol unchanged. No relay or Render configuration changed.

## Controlled CPU measurements

Chromium 151 headless, 1365×850 CSS pixels, DPR 1. These are CPU-only synthetic fixtures with real Three.js scene objects, not full-game FPS or GPU measurements. Command-scene results are the mean of three 160-frame runs per build; flashlight results are the mean of three 40-build runs per build.

| Same workload | Public base | Candidate | Change |
|---|---:|---:|---:|
| 200 static fill commands during 160 camera-follow steps, mean render update | 1.604 ms | 0.220 ms | −86.3% |
| Command update p50 / p95 (three-run mean) | 1.300 / 2.567 ms | 0.200 / 0.467 ms | lower |
| Geometry comparisons / updates across 160 steps | 27,700 / 27,700 | 0 / 0 | camera-only rebuilds skipped |
| Candidate camera-translation skips | — | 27,700 | — |
| 333-box flashlight fixture, mean geometry build | 2.448 ms | 1.085 ms | −55.7% |
| Flashlight box-ray checks per build | 55,944 | 27,216 | −51.4% |
| Flashlight polygon / 360 sampled ray distances | reference | identical / max delta 0 | preserved |
| Sampled JS allocation estimate per 160-step pass, three captures | 541,123 bytes | 427,609 bytes | −21.0% |

The allocation estimate uses Chrome HeapProfiler sampling at a 1 KiB interval. It estimates observed allocations, not retained heap, peak process memory or physical-device memory.

A separate 83-command differential fixture covered static fills, clipping, a gradient, an image and a moving hero. After two camera-follow steps, static position and UV buffers matched exactly; gradient screen coordinates differed by at most 0.000061 px from Float32 accumulation. The moving hero and a viewport resize used the ordinary geometry-update path.

## Full browser and runtime checks

Runtime media is stored in 87 checked-in archives, not in the working `docs/assets` tree. Reconstructed the clean `origin/main` site and verified all 1,906 runtime files (1,908 site files including the launcher/manifest), 464,851,417 runtime bytes, archive hashes, file hashes and audio range responses. The previously absent map image was present in this reconstructed site. Candidate and base were served with those same runtime assets in Chromium 151; the active renderer was Three.js and there were no page errors.

- On the actual `dist00` runtime map, base and candidate both started with 15 props and 223 draw commands. Static world props remained identical. Eight matched static draw-command points had zero screen-coordinate delta at the initial and moved-camera samples.
- After player movement and camera follow, then resizing to 1200×800, canvas dimensions matched between builds. The same-scene screenshot difference with the flashlight on was 218 of 960,000 pixels (0.0227%).
- The mobile-emulated flashlight test covered on/off, settings touch input, save/restore, portrait-to-landscape change and state/status synchronization. On/off screenshots differed in 67.437% of pixels. A separate movement capture verified the light remained enabled and its inspected origin followed the player from (15,19) to (17,19); no page errors occurred.
- Candidate regression covered save/restore, passive aura ownership, settings/diagnostics layout, viewport changes, touch, death/return and map transitions. Its delayed multi-hit assertion needed a longer settle window under software Chromium: the original 1.2 s ended at 17/18; with a 3.5 s test-only wait it passed all 18 hits and the full suite. No gameplay code changed for this timing adjustment.
- Local two-page host/guest co-op simulation passed with the existing protocol version 1/R62. The host snapshot was accepted; the host-only pickup awarded once and did not duplicate after reload. This was not a real network/relay test.
- `campaign-balance-r64.cpu.test.mjs`: 6/6 passed. `campaign-balance-r63r2.cpu.test.mjs`: 1/4 passed because three assertions expect obsolete 0.4/0.5/0.8 health ratios while current R64 behavior is 0.2/0.25/0.4. The performance change does not modify balance code.
- JavaScript syntax checks, 75 inline HTML script checks and `git diff --check` passed.

## What the measurements do not show

A short full-scene software-browser profile produced about 5.5 frames/s on both builds, with only three short runs per build and mixed pairwise results. Its camera was static, timing was noisy and it is not a valid end-to-end improvement measurement. No whole-game FPS or memory gain is claimed. No physical PC, physical GPU, real-device capture or real-network co-op test was available. The public site returned HTTP 403 from this execution environment before deployment; the GitHub Pages workflow must be checked after publication.

## Candidate screenshots

All five screenshots below were captured from this candidate build, using the reconstructed original runtime assets. Mobile is Chromium iPhone/touch emulation, not a physical phone.

- `flashlight-following-movement.png`
- `flashlight-on-mobile-portrait.png`
- `flashlight-off-mobile-portrait.png`
- `flashlight-settings-mobile.png`
- `flashlight-off-mobile-landscape.png`
