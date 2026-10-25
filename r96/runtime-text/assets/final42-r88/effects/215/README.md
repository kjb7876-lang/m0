# StoryWorld hospital scalpel slash / impact

User-approved early-game gameplay restoration for ep1a08 hospital (scene08) and ep1a09 injection room (scene09-1). This does not assert exact canonical lore. This is an effect phase, not a complete weapon attack or replacement for the original blade-and-handle projectile.

## Runtime integration
- Load `atlas.png` plus `animation.json`, or use the 16 separate PNGs in `frames/`.
- Atlas: 1280 × 1280, 4 × 4 grid, row-major. Frame: 320 × 320. True RGBA, straight alpha, sRGB.
- Play once at 25 fps, 40 ms per frame, 640 ms total. Impact starts at frame 6 (zero-based), 240 ms.
- Fixed pivot: (160,160) pixels / (0.5,0.5) normalized. Never trim or independently recenter frames. Art intentionally travels around the pivot.
- Forward direction: screen +X, clockwise crescent sweeping upper-left across right to lower-right; screen Y points downward. Rotate the entire effect to aim. Rotation is not a substitute for the supplied changing frames.
- Default blend: normal straight-alpha. An optional additive accent can brighten it on dark maps, but additive-only rendering loses definition on pale hospital floors.
- Linear filtering, mipmaps off. Transparent cell padding separates neighboring frames. If enabling mipmaps, repack with extruded gutters using the game's atlas tool.
- Remove or hide the effect on completion. The last frame intentionally retains a tiny fading spark, so do not hold it indefinitely. Do not loop the runtime effect.
- Set damage/hitbox separately. The impact timestamp is an art cue, not a verified gameplay damage timing.
- Tune attachment/pivot position and display scale for each actor, target and camera. This package has not been integrated or GPU-tested in the production game. No game source, deployment, main branch or original asset was changed.

## Memory and scope
RGBA8 atlas uncompressed: 6,553,600 bytes (6.25 MiB), excluding engine overhead. Loading all separate frames costs the same pixel memory; do not load both representations unnecessarily. PNG size is compressed storage, not VRAM usage.

## Art production and QA
Generated using the built-in image generator as a genuinely changing 16-frame painted sprite sheet, not primitive geometry or a rotating single still. The local original scalpel-projectile-trail reference was visually inspected for silver/cool-blue styling; the newly drawn effect omits the physical weapon. Keep the existing projectile asset if a visible blade AND handle are needed.

Source version 1 was rejected for insufficient padding; version 2 is accepted. ImageMagick only performed grid resize/crop/assembly, removal of alpha <= 2/255 background residue, and controlled alpha taper on the final four painted frames. No Python raster painting was used. Final frames have zero alpha at every outer border and 16 unique RGBA hashes. Early growth, peak/impact and disintegration stages are distinct. Light and dark contact sheets demonstrate floor readability. Tail alpha taper removes a brightness rebound; the terminal spark is removed by the runtime on-complete action.

`qa/alpha-temporal-report.json` records each frame's alpha bounds, border maximum, transparency and hash. `qa/light-dark-contact.png`, GIF and MP4 are inspection assets, not runtime textures. GIF loops only for QA.

## Package layout
Runtime ZIP: atlas, timing/integration JSON, this README.
Frames-and-QA ZIP: 16 PNGs and verification previews/report.
Source ZIP: original generated source sheets, prompts and reproducible metadata builder. Source PNGs are unmodified originals; use runtime atlas rather than source sheets in game.
