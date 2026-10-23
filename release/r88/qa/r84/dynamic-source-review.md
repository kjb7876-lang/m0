# Supplied Dynamic80 source review

2026-10-23 · Independent source/CPU review before native event integration.

The supplied material is 64 unchanged PNG components plus 16 new procedural motifs. The 16 animated SVGs are alternate expressions of those same motifs; the bundle contains 80 effects, not 96. Its README and proposed durations do not authorize changes to combat, story, damage, status admission, cooldowns, saves, security or deployment.

`dynamic-source-audit.py` independently verifies 94 original input files: 30 unmodified non-PNG evidence files and 64 byte-identical PNGs already present under the R83 runtime asset directory. The original source tree is recorded in `dynamic-source-baseline.json`; a separate user-facing archive copy need not duplicate the PNG bytes.

The supplied `runtime.js` has no DOM, networking, storage, timers or dynamic-code calls. Its public API is deterministic `sample(effect, elapsed, seed)` plus `render(ctx, frame, image)`. The standalone `preview.js` uses RAF, clears a preview canvas and creates its own UI; it must remain preview/source evidence and must not be added to the game page.

## Integration constraints

| Source behavior | Native-game implication |
| --- | --- |
| `render` centers `ctx.canvas` and scales by its short side ×0.35 | Use a local coordinate adapter and bounded effect size; do not draw it directly onto the entire game canvas. |
| Projectile sampling adds an authored flight translation and arc | Rebase sampled primitive positions and line endpoints when anchoring to an already moving native projectile. Preserve its actual hit coordinate. |
| Catalog duration/color are design defaults | Sample them over the existing admitted animation/flight/impact interval. They are not new gameplay timings. |
| `10_knight_parry_counter` is an impact | Do not infer projectile semantics from its position as the second asset in a four-file group. |
| Golden order wall uses `panel-rise-hold` | Keep the panel stationary/vertical as a small decoration; it is not a new moving ground collision wall. |
| Cult04 stitching uses `stitch-inward` | Emit only after the real acknowledged-story/guardian/revival sequence, never on a speculative lethal hit. |
| Procedural motifs have null canonical scene/boss fields | Bind only to real existing skill/status/medical/portal events. Add no new damage or status effects. |
| SVGs use SMIL and can loop indefinitely in a standalone viewer | Preserve their original files as alternatives. A texture load does not prove SVG animation in Three or browser Canvas. |
| Sample limit96 and observed maximum67 primitives | These are per-effect CPU bounds, not frame/GPU performance evidence. Apply separate per-frame, per-actor and reduced-effect budgets. |

The runtime uses supported DrawCommands paths, arcs, Beziers, fills, strokes, images and transforms. The independent checker replays 240 frames covering all80 supplied recipes through actual pinned Three CPU materials and geometry. It also samples 4,880 frames for finite values, alpha/width bounds, deterministic seeds, input immutability and clean time termination. This confirms converter compatibility in the checked CPU cases, not actual pixels or small-screen readability. Three's stroke tessellation may still differ from Canvas cap/join rasterization.

All16 SVGs parse, match their exact source hashes, contain252 declared animation nodes, have distinct actual geometric signatures and contain no scripts, event attributes, foreign objects, embedded rasters, external entities or external references. Those source checks do not establish browser SMIL playback or in-game visual quality.

## Final source audit

`python3 qa/r84/dynamic-source-audit.py` → **25/25** on the preserved portable source paths and actual reused PNG bytes. Details are in `dynamic-source-results.json` and `dynamic-source-runtime-results.json`.

Browser/GPU rendering, raster pixels, measured GPU memory, measured frame performance, mobile and natural play remain unverified. Native integration tests are a separate responsibility; this source audit never loads the preview loop into the game or changes production files.
