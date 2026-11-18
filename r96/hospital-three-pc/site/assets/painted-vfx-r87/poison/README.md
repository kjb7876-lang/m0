# StoryWorld hospital poison impact · animated raster asset

Production candidate for independent review. Suggested early-story use: ep1a08 / scene08 hospital and ep1a09 / scene09-1 injectionroom. This is a user-approved gameplay interpretation, not a claim of an exact canonical lore skill.

## Runtime files
- `poison-impact-atlas-256.png`: 1024 × 1024 RGBA PNG, 4 × 4 cells; row-major order.
- `frames/poison-impact-00.png` through `15.png`: 16 fixed 256 × 256 RGBA frames.
- `poison-impact.animation.json`: frame rectangles, phases, pivot and timing.
- 15 independently painted, morphologically changing nonempty frames plus an entirely transparent termination frame. This is not a single picture animated by scaling or rotation.

## Playback
Spawn at the existing syringe projectile's confirmed impact location, with fixed normalized pivot (0.5, 0.5). Use 70 ms per frame, total 1120 ms, play once and release. The contact position stays fixed; vapor naturally rises within the canvas. Do not re-center frames by their visible bounding boxes. The initial rupture is small, the liquid splash peaks in frames 4–6, then vapor curls and dissolves. Frame 15 is entirely transparent so no residue remains.

Use ordinary straight-alpha blending (source alpha / one minus source alpha), sRGB color, linear texture filtering, clamp-to-edge and no mipmaps. Do not use additive blending as the default: it loses the darker emerald liquid. Read rectangles directly; all frames have uniform transparent inset padding. At most scale the full playback instance for its intended on-screen size, not individual frames as a substitute for animation.

Recommended visual size: 128–256 screen pixels. Keep original syringe projectile separate. No floor, target, character, weapon, or gameplay changes are included. No deployment was performed.

## Performance budget
One 1024² RGBA8 atlas consumes 4 MiB GPU texture memory without mipmaps. One quad per active impact; shared atlas permits engine batching. Suggested starting mobile budget: at most 8 concurrent 128–192px impacts, measure overdraw on target hardware. This is a proposed budget, not a measured FPS guarantee. Avoid uploading 16 separate frame textures when using the atlas. Reuse pooled effect instances; no per-frame image decoding. Download size is recorded in `qa-report.json`.

## Provenance and QA
Original single-frame poison-splash-decal art was visually inspected for green liquid material vocabulary. Built-in image generation produced a new 4×4 changing-frame sheet; a second generation pass improved spacing and transparent emerald vapor. No paid external API or installed software was used. `source/` preserves both outputs untouched. Frame assembly used installed ImageMagick and ffmpeg: crop, uniform resize and transparent inset, atlas packing, preview encoding. The near-empty final generated cell was replaced with a truly transparent terminal frame during assembly.

Light/dark contact sheets and APNG/GIF are in `review/`. APNG preserves full alpha; GIF is only a low-fidelity convenience preview. Source resolution is 1254px square, approximately 313px per original cell; runtime is honestly 256px, not falsely claimed native 512px detail. Light and dark inspection showed isolated droplets, no backing rectangle, no clipped liquid edges, and visibly distinct splash/vapor shapes. Shader-level bilinear edges and actual gameplay performance still need verification in the target engine.

## Generation prompts
Pass 1: production 4×4 transparent painted spritesheet, sixteen continuous stages of emerald viscous toxic impact: tension blob, rupture, radial branching splash, detached droplets, curling vapor, thin dissipating wisps, blank terminal cell; fixed camera/origin; no target, ground, text, or geometry stand-ins.
Pass 2: preserve sequence; improve padding in every cell, prevent neighboring-cell overlap, change opaque lime smoke to translucent dark-emerald mist, progressively thin final vapor.

Projectile compatibility: reuse the existing `prior_assets/medical_vfx_singleframe/poison-syringe-projectile.png` from the StoryWorld source asset pack for the flying-syringe phase; it is intentionally not duplicated or altered here. Fixed pivot is an integration default that requires target-specific tuning in the engine, not an automatic all-target fit.
