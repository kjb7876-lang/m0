# Dedicated boss-room interiors

This revision follows the user's corrected room settings. It replaces the repeated primitive furnishing in five rooms with separate generated furniture atlases, and adds an executive office to Mammon's existing vault. Pride keeps its previous presentation.

| Room | Dedicated art |
| --- | --- |
| Sloth, ep1b02 | Sagging sofa, worn domestic refrigerator, CRT television stand, untidy bed |
| Envy, ep1b03 | Ordered blue settee, cracked silver mirror, household photo console, porcelain display cabinet |
| Gluttony, ep1b04 | Professional hotel preparation counter, range, ingredient refrigerator, dirty dish trolley |
| Lust, ep1b05 | Marble bar, mirrored liquor cabinet, wine-red velvet booth, drinks trolley |
| Mammon, ep1b06 | Executive desk, leather chair, locked filing sideboard, banknote trolley; existing exclusive safe, cash, iron walls and brass door frames remain |
| Arsonist, ep1b07 | Scorched restaurant table, damaged buffet, burned dining chairs, ruined dining booth |

`sin-room-art.js` paints the 24 assets through the game's native prop recorder. Each room uses a different PNG; no Mammon prop is assigned to another room. PNG files are copied unchanged from generation output. The asset manifest records dimensions, hashes and source rectangles. Near-transparent fringe is excluded through rectangle metadata without rewriting image bytes. Earlier rejected generation attempts remain outside the shipped asset set.

The overlay owns named `sin-art:` props and solid collision envelopes. It preserves native doors, world/progression metadata, combat and save format. Existing noninteractive decoration is suppressed only where it overlaps authored furniture. Original source assets are preserved. The five revised rooms retain their original floor topology and pillars. Mammon retains the previously approved central arena expansion; its desk is moved slightly inward to align its visible surface with the wall, while the boss and door approaches remain open.

Native collision meshes are hidden by their render layers, with exact layer masks restored on scope exit, chunk eviction and scene changes. Collision records remain active. The native generic prop grounding pass otherwise moved the new art away from its authored bounds and cropped its feet; the overlay retains only its own original recorder quads/source rectangles through that pass. Other props keep their native grounding behavior. Dedicated art uses the existing vertical world-plane projection, with the north furniture parallel to the north wall and west furniture parallel to the west wall. Contact offsets are measured from each original PNG's visible alpha pixels, keeping the visible foot above the floor and the plane inside its solid footprint. No global depth-test or grounding setting is disabled.

The flame imagery on the burned restaurant furniture is static painted detail. This revision does not add a damage region or a new combat effect. Existing effects remain native.

Work is isolated in `claude/sin-room-dedicated-art` in `/workspace/m0-mammon`, based on local commit `a625cc91a187966ba91b22f0b2f541c349300a90`. The other checkout and main are not modified. Previous remote access returned HTTP 403; the denied operation was not retried or bypassed. Latest main and live Claude changes therefore remain unverified. No push, merge or public deployment is performed in this revision.

## Reproduction

Run `python3 scripts/sync-r99.py sin-room-art.js assets/sin-rooms/index.json assets/sin-rooms/sloth-home.png assets/sin-rooms/envy-home.png assets/sin-rooms/glutton-kitchen.png assets/sin-rooms/lust-bar.png assets/sin-rooms/mammon-office.png assets/sin-rooms/wrath-restaurant.png`, preserve any existing site directory, then run `TMPDIR=/workspace python3 scripts/build-r96.py`. This session uses the workspace for build staging because the separate `/tmp` volume has limited capacity.

From `r96/hospital-three-pc/site`, serve with `python3 -m http.server 4404 --bind 127.0.0.1`. From the repository root, run `SINS_TEST_URL=http://127.0.0.1:4404/ node scripts/sin-room-art.browser.cjs after`, then the same command with `--detail` for the right-side mobile camera. The script uses normal STORY entry through the existing 777 helper, pauses the game and fixes the camera. Its captures are assisted headless evidence, not natural play or physical-device validation.

The before PNGs are byte-identical copies of the preserved v1 evidence at the same camera/viewport. The rejected art-integration captures are retained separately under `/workspace/sin-room-art-first-candidate` and `/workspace/sin-room-art-second-candidate`; grounding diagnosis and source-override probes are under `/workspace/sin-room-art-grounding-probe`. Final full-build evidence is under `/workspace/sin-room-art-evidence`. Final browser checks inspect actual rendered command rows as well as screenshots, asserting full source rectangles, authored pixel positions and upright plane metadata.

## Limits

Physical GPU rendering, physical mobile devices, natural boss fights and the full approximately 25-minute regression suite remain unverified. Targeted CPU/native-VM checks and browser evidence are listed separately in the final verification record. Local build success does not establish remote CI, latest-main compatibility or deployment success.
