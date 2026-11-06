# R375 map geometry integration audit

Read-only investigation of `/workspace/m0-r375`; no repository source edits by this reviewer. Kernel review used `r96/client-source/world-scale-r375.js` revision `R375-geometry-1` and the four actual layouts in `layout-samples.json`. This is an integration design and kernel review, not evidence of a working game-wide enlargement.

## Required hook order

1. After `dist/phase1.js`, before `story-maps-r171.js` and the inline `phase1-original-adapter`: define scaling helpers and replace `window.StoryPhase1` with a new frozen object containing wrapped exports. The exported object is frozen; assigning its properties does not work. The adapter captures the API in `const api` and later calls `api.explorationLayout` from a private cached `get`. Replacing only the public EX.layout afterward misses that closure.
2. At this same early boundary, wrap the then-current native `makeRoom` to convert its actors, home coordinates, authored props and objective before phase1 collision validation. Native producers still use a 30-unit field. Later producers reading scaled layout anchors must not have their output multiplied again.
3. Chain the final `__STORYWORLD_LAYOUT_HOOK_R204__` after existing R204/R219/R317 installations. R171 rebuilds geometry after the base factory, so the final R171 result requires its own conversion. Use WeakMap/WeakSet identity for idempotence: R171 spreads `...base`, which would copy an enumerable scaled flag onto newly authored canonical geometry.
4. After R355, preserve canonical copies of every Samong zone definition, then update spatial fields of the existing CH/ALL zone objects (do not replace only chapter arrays). Replace the frozen zone API with a copy whose layout method calls the original builder using the preserved canonical zone. Its dress/tick/navGoal consumers must receive the enlarged live zone definition.
5. Add a scale hook immediately before cache insertion in `samong-r103.js:144-148` for both current-zone and legacy paths. This catches R115, R105 and fallback survival/maze/ascent. Generating canonical cells first and duplicating each cell into four avoids carve's `max(w+1,4)`, nine-unit padding and round-room rasterization differences.
6. Install save conversion and runtime safety adapters only together with all geometry hooks. Keep automatic runtime installation disabled until all producers/consumers share the same coordinates.

The existing EX API and R115/R103 APIs are frozen; replacing their window binding is possible, but exported function replacement does not alter internal lexical calls. R103's internal layoutFor/buildRoom remain private.

## Minimal geometry schema

```js
{
  bounds: [minX, minY, maxX, maxY],
  floorCells: [[integerX, integerY]], // four output cells per original cell
  floorRects: [{x, y, width, depth, polygon: [[x,y], ...]}], // origin, not centre
  walls: [{x, y, width, depth, height, angle, endpoints: [[x,y],[x,y]], analyticBounds12: [x0,y0,x1,y1]}],
  nodes: [{id, x, y, width, depth, radius}],
  edges: [[nodeIdA, nodeIdB, corridorWidth]], // IDs stay fixed; width doubles
  branches: [[x, y]],
  entry: {x, y, node, dx, dy}, // dx/dy and node are not spatial positions
  sourceExits: {direction: {x, y, sourceFoot, sourceRect, kind, cue, direction, to}},
  worldR74: {rooms, corridors, doors: [{id,x,y,width,depth,axis,reach,closed,edge}]},
  worldWardR81: {bossBounds,gatherBounds,bossAnchor,gatherAnchor,arrivalAnchor,portalNext,portalPrevious,routeSplit,fieldAnchors,bossPoints,rallySpots,rallyTriggers,routeSpawns},
  worldR78: {routeBranches: [[nodeId, ...]], routeNodeIds, bossRoomNodeId},
  refugeR82: {portalNext: {x,y}},
  samongR103: {rooms,doors,exit,centre,save,chests,dais,core,top,landings,patrol,path},
  hospitalCoreB2: {rects: [[id,x0,y0,x1,y1]], starts,objective,combatAnchors,bays,doors,mazeBarriers,wallDepth},
  hospitalDoorsB3: [...], hospitalWalkPolygons12: [[[x,y],...]],
  hospitalBoundary12: walls, hospitalVisualWalls12: walls
}
```

Geometry positions/dimensions double. Actor size, art dimensions, height, combat range, interaction reach, directional vectors, node IDs, route IDs, source-image pixel rectangles and story state remain unchanged. sourceExits.x/y are world coordinates; sourceFoot/sourceRect retain original image pixels. Edges and routeBranches must not share a blanket numeric-array transform.

Hospital walls use `width = segment length`, `depth = thickness`, plus angle, unlike generic axis-aligned width/depth walls. Preserve that representation for new vertical hospital shoulders. Existing hospitalBoundary12/hospitalVisualWalls12 aliases must refer to the same transformed wall set.

## Door requirements

- Keep centre relocation, door ID, leaf width/depth, interaction reach and opening state.
- Add shoulders to fill the extra opening width; otherwise a closed unscaled leaf is bypassable through the enlarged gap.
- R115 public layout drops aperture spans. Supply original `Z.carve(z).doors` entries `{x,y,axis:'v'|'h',lo,hi,room}` to the kernel. These are open thresholds rather than native closed leaves.
- Hospital closed leaves occur in the wall list as `hospitalDoorB3: 'door-0'`; opening creates another layout. Test both states and each gate progression combination.
- The current hospital collision function uses a global wallDepth, while body walls enlarge and leaves stay narrow. Integration must use each wall's actual depth for collision and a layout-owned containment domain.

## Known closure and producer blockers

- `r96/runtime-text/dist/phase1.js:541,596`: hospitalCoreContainsB2 reads lexical HOSPITAL_CORE_B2.rects; hospitalCoreBlockedB2 invokes it. Scaling layout metadata alone does not enlarge the collision domain. Export replacement cannot affect the lexical call. Use layout-owned core rects and update all internal callers.
- `r96/runtime-text/index.html:5477`: EX.attach calls closed-over get and repairs actors on hospital door-layout changes.
- `r96/runtime-text/index.html:5510` vicinity: phase1 makeRoom validates spawns before outer wrappers can fix them.
- `world-combat-r78.js:28-68,105-110`: placements read worldWard metadata, but missing route/boss/rally fields fall back to canonical fixed points. Supply scaled fallbacks.
- `world-combat-v4-compat.js:19`: the boss point array is hardcoded independently of layout nodes.
- `hospital-maze-progression.js:213`: `player.y < 104` remains even if routeFor is replaced; make the threshold geometry-owned.
- `r96/runtime-text/index.html:318`: bossVolley fields near the player clamp to 3..27.
- `story-maps-r171.js:277-280`: rescue uses canonical CORE coordinates. It must recognize transformed bounds instead.
- Top-level `client-source/hospital-core-b2.js` is historical B2 source, not the current R96 input. `scripts/build-r96.py` copies the current `r96/runtime-text/dist/phase1.js` from textPaths.

## Save boundary

Existing saved spatial fields include player.x/y; rooms.*.enemies x/y/homeX/homeY; explorationHomes; EGO routeRoom; worldMazeR81 room champions; Samong checkpoint. Preserve progression, IDs, HP and unlocks.

Passing fully doubled save coordinates to existing restore wrappers triggers canonical 30-unit clamps and `world-combat-r78.clean` absolute coordinate limit 200. A canonical-coordinate serializer and post-restore reapplication from the validated original snapshot avoids a new schema, but intermediate restore/rescue code must not commit a wrong position. Samong checkpoint is copied by R103.clean and checked against stage floor membership; convert it before that boundary. R103 restore invokes resumeStage asynchronously, so the outer restore return is not sufficient evidence that stage positioning has finished. Autosave suppression and failed-restore rollback need direct tests.

## Kernel review observations on the four fixtures

Confirmed initial kernel omissions (reported to implementer; recheck after fixes):

| Fixture | Untransformed x/y paths | Pair-array schema |
| --- | --- | --- |
| STORY | sourceExits.s=(8.114754,6.904161), sourceExits.w=(9.098361,24.684741) | branches=[[84,59]]; edges=[node,node,width]; worldR78.routeBranches contains only node IDs |
| Hospital | sourceExits.e=(5.221292,5.221292), .n=(8.899522,24.509569), .w=(24.509569,8.899522) | branches=[] |
| Safe hub | refugeR82.portalNext=(30,22), expected (60,44) | branches=[[4.4,4.4],[25.5,4.4],[4.4,25.5],[25.5,25.5]]; edges=[node,node,width] |
| Samong | none beyond the above handled fields | branches=[]; edges=[node,node,width] |

Actual fixtures have no polygon-bearing floor rectangles. A synthetic polygon rectangle reproduces the omission: bbox {x:1,y:1,width:1,depth:1} becomes {2,2,2,2}, while polygon [[1,1],[2,1],[2,2],[1,2]] remains unchanged. Renderer terrain generation explicitly uses polygon over bbox (`dist/phase1.js:269`).

Confirmed doubled cell counts: STORY 2443→9772, hospital 8022→32088, safe hub 864→3456. These verify geometry arithmetic, not movement or gameplay. Hospital wall depth .24→.48 while hospitalCoreB2.wallDepth stays .24 demonstrates the known integration mismatch.

Samong metadata-only scan supplied `doors: []` to avoid inventing absent span metadata; it is not a Samong door test. Parent is running the separate 163-zone collision suite with real carve descriptors.

## Acceptance required before activation

All STORY/DREAM/native/safe/hospital/EGO layouts plus 163 actual Samong zones; exact bounds and corridor scale; cell coverage and polygon agreement; unchanged door opening widths; closed-door no-bypass and open-door connectivity; scaled clue/portal/rally/spawn points; boss attacks above old coordinate limits; prior/new save roundtrip including Samong checkpoint and EGO; failed restore rollback; PC/mobile geometry/collision alignment and pathfinding performance. Four fixture transformations alone cannot establish whole-game readiness.
