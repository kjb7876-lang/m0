# 91-corruption-contact-thorns

Sixteen distinct illustrated frames, 640 ms one-shot. Zero reused/blank frames. Jagged corrupted spikes erupt OUTWARD at a point, black-violet sap fractures and thorn tips crumble. NOT binding cage; no encircling constraint motion.

## Import
Use atlas.png + animation.json: 4x4 row-major, 320px cells, 1280px atlas. Fixed center pivot (160,160), normal straight alpha, sRGB, linear filter, mipmaps disabled. Uncompressed RGBA8 memory6.25MiB. Do not load both separate frames and atlas unnecessarily. Position/contact attachment and scale must be tuned for the target actor/map. Playback uses elapsed time, never frame rate dependent. Hide/remove on complete because last fragments remain. No seamless-loop guarantee; looping GIF is inspection only.

## Source and interpretation
Source asset 91 preserved with SHA256 in provenance.json. Catalog mappings retained for reference; no new exact animation, timing, named hero ownership, narrative claim, damage or status behavior is established by this package. This is a new visual interpretation, one unique animation for one source, not a claim of multiple animations for every mapped scene. No memory/core destruction or new canon implied.

## Art and QA
Built-in image generation produced real changing painted structures. ImageMagick only resampled the square sheet, cropped the grid, removed alpha<=2/255 background residue, uniformly reduced each cell artwork80% and added transparent padding. No Python raster painting, no single-still rotation/translation used as animation. Original reference and generated source preserved. All sixteen frames have unique RGBA hashes and transparent runtime borders; raw source-cut maxima recorded separately in qa/raw-edges.json. Contact sheets checked on dark/light backgrounds. Hash uniqueness alone is not perfect temporal validation; independent review and game testing remain separate.

## Runtime limits
No game source/main branch/deployment touched. Not game-integrated or GPU-tested. Collision, status duration and gameplay timing are not supplied. Dark ink material intentionally has lower contrast on near-black maps; normal alpha keeps black cores visible on pale maps. Tune lighting/accessibility after in-game testing, not by changing canonical meaning.
