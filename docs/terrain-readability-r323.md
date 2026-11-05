# Terrain value separation (R323)

Walkable floors and surrounding walls can merge into the same dark value range
on small screens. The existing renderer limits coarse-pointer input canvases to
DPR 1.25 (1.0 with lowFx); the Three renderer then applies its own 1.5/1.0 cap.
R97 may reduce this further. Raising only the latter cap cannot recover pixels
already discarded by the input canvas.

`terrain-readability-r323.js` separates the displayed floor, wall and cap
materials with a small output-space color multiplication. Floors retain a warm
neutral tint, wall faces are cooler and darker, and existing wall tops retain
their upper value step. Source textures and their painted detail remain intact.

The overlay includes the R204 baked ground, cliffs, plateau and structural wall
meshes. Those meshes replace hidden native terrain in caves and outdoor scenes;
grading only `stoneMaterial` would leave the visible terrain unchanged. Decals,
actors, props, effects and UI are excluded. Bridge aprons retain their existing
geometry; this overlay does not define new walkable paths.

The rose-house checkerboard already separates dark floor tiles from pale walls.
That existing inverse contrast is preserved without applying the shared grade.

The grade composes the existing sight, cutaway and dream shader callbacks. A
single vector multiplication preserves exact black outside the sight mask, and
leaves alpha unchanged. It adds no mesh, texture, texture sample, render pass or
draw call. Existing DPR, R97 adaptive scale, R150 light mode, R287 visibility/cache
and R298 offscreen-image budgets remain in effect. Terrain geometry, collision,
progression, saves and source art are unchanged.

The overlay polls only for renderer replacement; WeakSets and WeakMaps prevent
repeated wrapper or material installation. Disabling it compiles the original
shader without grade instructions. Occlusion clones can inherit compile hooks;
the GLSL guard ensures that they receive exactly one grade operation.

For comparison or rollback, use
`window.__STORYWORLD_TERRAIN_READABILITY_R323__.set(false)`; pass `true` to enable
it again. The preference is stored separately at
`storyworld.r323.terrainReadability`. `inspect()` reports installation counters
and errors, and makes no physical-GPU verification claim.

## Validation

`node r96/qa/r323/terrain-readability-cpu-check.cjs` covers shader composition,
hidden black pixels, original-shader restoration, actual R204 materials,
occlusion clones, asynchronous material/renderer replacement, bounded wrapping,
non-terrain exclusions and build registration. Existing order checks remain in
place with the new tag registered before the final combat/tile overlays.

Visual acceptance requires fixed hospital, spider cave, outdoor garden, first
dream, palace and city-alley scenes on desktop and mobile, including lowFx and
grayscale comparisons. CPU fixtures do not establish visual acceptance or a
physical-device frame budget. The renderer's existing low-resolution baked
terrain and input-canvas DPR remain limits on fine-detail sharpness.

## Wide desktop follow-up

The current-main R323 grade remains enabled during follow-up comparisons. Only
the additional desktop correction is toggled with `setDesktopContrast(false)`
and `setDesktopContrast(true)`; disabling the whole overlay would compare the
wrong baseline. This diagnostic switch is in memory and does not alter saves.

Fine-pointer views at least 960 CSS pixels wide receive a terrain-role
uniform adjustment in `STORY:dist01` and `STORY:dist00`, and in
`STORY:ep1a10` with lowFx enabled. The renderer's current world key and viewport
select the profile. Mobile detection follows the existing R63 helper with a
coarse-pointer fallback; unavailable or throwing detection leaves the base
grade unchanged. Other regions, dream layers, normal-quality city, mobile
views keep their existing values. Cave and garden profiles pair a restrained
floor/path lift with structural darkening to retain the pale hero silhouette;
wall/cap gains keep their original ratio and cloned-material role mapping.
The city lowFx profile changes only floor/path values. The rosehouse exclusion
also applies to these profiles.

The original mask/viewport ROI and L* 6 target are retained. Latest-main
`2b9dc2364b916e9ff1679621a7536961e6f99e38` reproduced cave/garden shortfalls; city
lowFx measured 6.0007 and 5.9600 in a planned repeat, so its borderline result
is not treated as a robust pass. These are scene-median diagnostics including
possible UI/prop occlusion, not independent art scores. Validation distinguishes
targeted PC improvement from unchanged mobile and checkerboard controls.

Profile changes update the existing uniform values without adding GLSL
instructions, recompiling a shader, or allocating another rendering pass.
Callback markers and cloned cap classifications from the earlier R323 fixes
remain in place. Physical GPU frame budgets remain a separate validation.
