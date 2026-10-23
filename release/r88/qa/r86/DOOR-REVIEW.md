# R86 door review

The old hospital B3 draw path drew only the three wall-material jamb/header strips. Its closed door was an opaque collision wall, with no visible clinical door leaf. Regional R83 leaves were registered to door centre planes; that registration did not account for a closed wall's thickness.

The revised presentation keeps each native door object, interaction, saved open state, collision wall and progression rule. It registers the visual surface to the camera-facing wall surface plus 0.015 world units. The hospital uses the already packaged r80-057 teal fire-door artwork for two leaf panels, retaining the original wall texture for its frame. Original source images are unchanged. Image polygons use a small polygon offset and a fixed overlay order to avoid coplanar paint competition while retaining depth testing.

Hospital art is registered in native region preloads and warmed after region entry and restore. This placement matters: the existing R80 region cleanup would otherwise evict this image because it is not one of the hospital's eight prop skins.

Validation: qa/r86/door-check.cjs has 12 passing checks, including real source-image alpha inspection, all three hospital closed doors, native opening, full-frame body classification, and actual Three raycasting. The ray test reproduces the old centre-plane occlusion for all six hospital leaf panels and proves positive clearance for the revised planes. The R83 regional door suite retains 18 checks across 55 maps and 165 physical apertures, with its plane expectation updated from centre to the visible front surface.

This is Node VM and Three CPU geometry validation. Browser rasterization, GPU output, Windows execution and natural play remain unverified.
