# 246-silver-thread-slash

Sixteen genuinely different illustrated frames, 640 ms per clip; no reused or inserted blank frames. Built-in image generation, with reference motif. Not a rotating still or procedural shape. Source art and generated source remain preserved.

Import atlas.png + animation.json. Row-major 4x4, 320-pixel cells. Fixed pivot [0.5, 0.5]; normal straight alpha, linear filtering, no mipmaps. 6.25 MiB RGBA8 atlas memory. Do not load separate frames and atlas simultaneously unnecessarily. Timing is a design proposal. Play once, hide on complete; no seamless runtime loop is claimed. GIF loops for review only.

Animation: layered crescents grow, sweep and break into distinct filaments and glints.

Original asset exists but no specific hero or boss ownership is asserted. Fictional game art only. No game, main branch or deployment changed. Must tune attachment, scaling, timing, and collision separately and test in the actual game. Not production GPU tested.

Technical processing: ImageMagick square-grid resampling, crop, uniform80%scale and transparent padding. Alpha<=2/255 residue removed (teleport<=8/255); teleport ground ring additionally registered to y224 using visible lower ring alpha bounds. No Python raster painting, no per-frame rotation or opacity-only animation substituted for art. Glow threshold may remove very faint source pixels. Unmodified generated source included for reference.

QA: dark/light contact, looping preview, raw source-cut edge measurements and final transparency/hash report in qa/. 16 unique hashes alone does not prove perfect temporal quality; art also requires visual/runtime review. Metadata lists endpoint removal explicitly because last-frame specks/base rings remain.
