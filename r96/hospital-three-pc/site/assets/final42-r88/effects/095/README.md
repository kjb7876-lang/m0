# StoryWorld 95-frost-shards illustrated contact animation

16 runtime frames = 15 separately painted nonempty frames + 1 fully transparent end. One-shot 960ms (60ms/frame); never claim a validated seamless loop. Native illustration source is about 313px per cell, exported at 256px, not artificially claimed high-resolution detail.

Use atlas.png (1024² RGBA) with animation.json row-major rectangles. Keep fixed (0.5,0.5) pivot at confirmed contact location; tune to actual target in engine, not guaranteed all-target alignment. Normal straight-alpha blending, sRGB, linear sampling, clamp, no mipmaps. Pool the instance and remove at end. No damage/status logic changes.

Material and motif follow source new_assets/vfx-batch01/06-frost-contact-shards.png. Catalog scene mappings are retained in manifest, not assertions that this newly authored animation belongs to a specific hero/boss or is canonical. Mechanic/source asset exists; no specific hero or boss attribution unless separately evidenced.

Performance proposal: shared 4MiB RGBA8 atlas, one quad per effect, 128–256px display. Start with maximum 8 concurrent effects on mobile, profile overdraw; no measured FPS guarantee. Use atlas rather than decoding separate PNGs during playback.

Review: light/dark contacts and full-alpha APNG plus low-fidelity GIF. Transparent inset prevents atlas-neighbor bleed. Continuous silhouettes were inspected as birth/contact/release/dissipation; exact gameplay runtime is not tested. Original source files are unchanged; both generation sheets preserved in source/. Last cell cleared during assembly to guarantee zero residue. No target, floor, UI text or gore baked in.
