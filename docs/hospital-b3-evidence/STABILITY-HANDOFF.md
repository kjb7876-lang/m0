# B3 focused stabilization — local, not deployed

Original B3 candidate and original evidence remain at ../hospital-b3-candidate. No original/B1/B2/B3 save imported or overwritten; CPU uses fresh memory and synthetic restore copies. Existing B3 namespace retained. No changes to map plan, doors schema, actor IDs/HP/damage/waves or public files.

## Consumer trace and correction
- Compiled index.html exploration adapter `distribute` uses combatRoomNodeIds to prioritize initial ordinary actor placements. This was not dead metadata. Generated core now derives IDs from the unchanged four bay coordinates: [36,39,17,19], south-ward-a/south-ward-d/consult-a/consult-c; node centers equal the actual bay positions.
- Compiled entry wrapper consumes entry.x/y/dx/dy; no direct entry.node read found in compiled HTML/renderer. Corrected node from preparation 6 to entry-hall 44 for coherent metadata. Coordinates remain (43,109); all three starts unchanged.
- Source: source/hospital-core-b3.js, generated reproducibly by build.py. Late R53 bay plan remains unchanged in source/hospital-runtime-b3.js.

## Frame correction
- Removed actorHeight-scaled hospital door picture from active frame draw hook; asset preserved on disk. Reuses existing hospital quiet wall atlas [680,20,500,260], already used by renderer material.
- source/frame-helper.js is inserted into hospital-runtime-b3.js. Jamb inner edges derive from door width 6 minus wall depth .24: opening 5.76; height 2.7, lintel .24. Native projection and affine DrawCommands/Canvas operations are shared. Frame adds no collision. Native closed wall leaf and native R74 state continue to own opening/closing.
- Physical floor, walls, collision and camera envelope equal previous B3 under all eight door configurations. No room or route added/removed.

## Focused execution
- CPU_HTML=out/hospital-b3-stability/site/index.html node out/hospital-b3-stability/evidence/doors.mjs: exit 0, 10/10. Actual 105-script production install, actual door use/interaction/close body guard, complete production restore and serialization, STORY/DREAM, warm transitions, node references. Production validator not replaced.
- node out/hospital-b3-stability/evidence/geometry-focus.mjs: exit 0, 8 door configurations passed; exact compiled old/new floor/wall equality, bay centers, aperture collision edges.
- Frame assertions capture actual drawProp through DrawCommands at zoom .5/1/1.75, visual options false/true, with/without scope; repeated after full save restore. Image dimensions supplied for frame-only recording. This is not Canvas raster output, GPU render/compile, or real-screen inspection.
- DOM/canvas/audio/image/time remain original CPU harness stubs; input/progress/player positions are synthetic/direct and scenes acknowledged manually. No user save or natural play, no network coop delivery.

## Remaining limits
- EGO first-tick HP change from prior B2/B3 synthetic control remains unresolved; no new EGO test or claim of correction.
- Existing B3 west-route bypass and optional room/door traversal remain; no compulsory room visits introduced.
- User performs actual screen/play evaluation. Full prior 35/1 suite was not rerun; focused pass does not replace that recorded failure.
- No commit/push/PR/CI/main/Pages/security changes. No C phase.
