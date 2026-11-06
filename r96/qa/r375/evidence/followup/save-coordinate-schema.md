# R375 save-coordinate schema and restore boundaries (read-only)

Scope: `/workspace/m0-r375`, PR271 follow-up, native V6 save pipeline, R81 ward progress and R103/R115 dream checkpoint. No source or other agent files were changed. This report supports pure helper implementation; it does not establish that runtime geometry and the async restore chain are integrated.

## Main conclusion

Keep the persistent V6 save's world coordinates in the existing canonical coordinate space. A serialize wrapper may divide only explicitly known live, expanded coordinates by 2 in a fresh snapshot. A post-validation restore helper may multiply canonical positions by 2 for the exact generated room to which each belongs, after progression/door ownership has been restored. Never infer scale from coordinate magnitude or recursively transform every x/y object.

A pure `canonicalizeSave` / `restorePositions` helper can be written and CPU-tested without changing index.html. Full runtime integration is a separate requirement: the original validator is captured in a closure, several inner restore wrappers clamp/reposition units or save while restoration is still in progress, and R103 starts its async stage resume without awaiting it. Merely wrapping the final restore promise and scaling the current room does not cover those boundaries.

## Minimal exact coordinate schema

All listed x/y values are world-space points. Preserve IDs, HP, cooldowns, phases, counts, seeds, choice arrays and strings byte-for-byte apart from a deliberately cloned representation.

| Saved location | Coordinates | Coordinate-space owner | Source evidence |
|---|---|---|---|
| `player` | `x`, `y` | Active normal room, **or active R103 dream stage**, **or active EGO visit**. Same host zone ID does not imply same geometry. | runtime HTML 368, 372, 1189, 1203 |
| `rooms[roomKey].enemies[]` | `x`, `y` | `roomKey = layer + ':' + regionId`; match actual world room and enemy `id` | HTML 1183, 1191–1199 |
| `explorationHomes[roomKey][]` | `x`, `y` | Same room; match both enemy `id` and `group` before applying to `homeX`, `homeY` | HTML 5515, 5518 |
| `worldMazeR81.rooms[roomKey].champions[]` | `x`, `y` | R81 STORY ward room; separate snapshot for champions beyond native 40-row cap | world-combat-r78.js 18–19, 115, 126–129 |
| `samongR103.checkpoint` | `x`, `y` or null | R103 `ep`, `stage`, `zone`, seeded layout. Do not use DREAM host region's normal layout. | samong-r103.js 79–85, 342, 442, 477–479 |

`rooms[].enemies[].homeX/homeY` are accepted as optional compatibility fields by R81 at line 121, but the native serializer does not emit them. If helper support includes these imported fields, treat them as an explicit optional pair and do not synthesize missing values. The normal emitted homes live in `explorationHomes`.

### Other actual persisted coordinates needed for an all-map save claim

| Saved location | Coordinates | Evidence and caveat |
|---|---|---|
| `ego151.routeRoom.enemies[]` | `x`, `y` | HTML 5253–5255 exports a temporary EGO room under a separate snapshot, then removes its temporary world key. Hydrator HTML 5240 clamps to 2..28. Use visitMap/visitLayer/visitId and dedicated room identity; do not conflate with rooms[hostKey]. |
| `hospitalBossR53.rooms[roomKey].units[]` | `x`, `y` | HTML 8997–8999. Recreated units have dedicated ownership/cap checks and hospital navigation clamps. |
| `summonsR61.rooms[saveKey].units[]` | `x`, `y` | HTML 10969–10981. Resolve saveKey using its owner API; may include visit identity. The loader can discard/reposition unsafe saved units before an outer postpass. |
| `campaignPointDropsR64.rooms[roomKey].drops[]` | `x`, `y` | HTML 11781–11783. Drops have independent epochs/claims/IDs; transform point only, not count or epoch. |

These should be either explicitly supported/tested or explicitly excluded from runtime activation. Do not silently treat the five-row minimum above as full save compatibility.

### Fields that do NOT need coordinate scaling

- R81 state: version, phase, route, rallied IDs, doorStoryDone, exitStoryDone; `worldR74.entries/opened` are generation/door identity ledgers.
- `hospitalMazeR1` progression state is a ledger, not a saved geometry plan.
- `hospitalMaze5.rooms[]` contains seed, startId, layoutVersion; no saved point.
- `samongR103.returnTo` has only zone/layer. `zoneDone`, `zoneRead`, `zoneSolve` puzzle counters, counts and seed are unchanged. `samongMapsR105` contains version/read strings only.
- Camera, paths, targets, active projectiles and attack footprints are not serialized by this native coordinate schema; do not attempt to preserve transient cast geometry through the helper.
- `cheat777.normalReturn` and other embedded full save snapshots require independent coordinate-space ownership. They can already have passed through the canonical serializer when captured. Do not recursively halve them a second time.

## Native validation and closure constraints

1. HTML 372 validates player.x/y with a fixed clamp to 1.2..28.8. HTML 1566 captures it as `const validateSaveBase4=validateSave`; later changing global validateSave does not change that captured function. HTML 3275–3280 similarly wraps a captured normalize function to return V6 raw plus legacy-normalized valid.player.
2. HTML 1189's native restore calls the current global normalizeSave3. An outer normalization adapter can inspect `valid.player`, but later spatial wrappers independently read raw.player and overwrite it. Updating the normalized player alone is insufficient.
3. HTML 1197 clamps normal enemy positions to 2..28 unless `r.exploration.worldWardR81` exists, then clamps to layout bounds. It calls placeActor3 afterward. A final spatial restore must match by ID and preserve the resulting HP/death/encounter decisions.
4. Existing expanded restore HTML 5514–5517 is a useful pattern: after native validation it reapplies valid raw enemy positions and exploration homes, then player position, without replacing progression. However later hospital repairs, door recovery and portal safety can move things again.
5. R81 `clean()` validates champion `abs(x),abs(y) <= 200` (world-combat-r78.js 18), before invoking inner native restoration. A valid expanded location such as canonical y=109 -> runtime y=218 fails if scaled raw is passed directly into that validator. Canonical on-disk coordinates avoid this schema incompatibility.
6. R81 `pending`, `states`, `placed`, `restorePositions` are closure-owned. Exported state() returns a copy. Monkey-patching the exported clean() or placeRoom() does not replace lexical calls inside its restore wrapper. A correct integration must respect those closure boundaries rather than assume the public object rebinds internals.
7. R81 restores ordinary positions from raw.rooms, then champion positions from its dedicated snapshot (lines 120–129), while enforcing hidden major actors in route/rally/door phases. A postpass must not resurrect excluded dead rows or move intentionally hidden bosses out of their staging positions indiscriminately.
8. Native restore and several wrappers call saveGame(false) mid-chain (e.g. HTML 1203, 5517, 6302, 10495, 10982, R81 132). Pure helpers are safe to test without activation, but an installed wrapper needs a transaction boundary to prevent half-scaled snapshots and premature simulation. R73/R320 guards exist but do not automatically cover a new outer async stage operation.
9. Hospital later uses repair() and analytic nearest-safe logic (HTML 6308–6311 and 9807–9816), and R73 safePosition/safePortalPosition (12597–12598, 12614). Reapplying a rejected raw point afterward would undo those safety protections. Return a validation report or decline unsafe points instead.

## Dream resume: special async boundary

- `samong-r103.js:479` sets `S=clean(raw.samongR103)`, records prior active state, sets S.active=false, clears stageRoom/layout cache, awaits native restore, then invokes `resumeStage()` **without await**. The global restore promise can resolve while the normal host map is still active or stage entry is in flight.
- `resumeStage` (350–351) waits for loading/entering, then calls lexical go(). `go` (341–345) builds a separate stageRoom, picks `position` or checkpoint by floor-cell membership, and awaits enterRegion(host, ..., position). It saves after stage entry.
- Public `state()` at line 515 returns the actual S object, unlike R81's copied state(). A narrowly scoped checkpoint adjustment is technically possible; a preferred integration applies the correct point before go() chooses its start. Replacing public go()/layoutFor() alone does not replace lexical calls to them.
- Stage checkpoints may remain stored when S.active is false. They still belong to the dream stage referenced by S.zone/ep/stage, not the current normal player room. A serializer must use that separate context.
- Do not restore normal raw.player onto the dream stage after resume: by design a saved dream run restarts at the stage entry or last lamp, not necessarily at the arbitrary saved player position. Preserve this behavior.
- Bounds/floor-only onFloor at line 342 checks Math.floor coordinates, not actor radius, wall or locked-door clearance. Any helper promise of safe reentry requires an additional actual collision check after the stage geometry exists.

## Pure helper contract that can be implemented now

`canonicalizeSave(snapshot, context)`:

- Accept an already generated detached native snapshot plus an explicit per-owner coordinate-space context. Return a cloned snapshot; never change live rooms/player/state or caller input.
- Convert runtime -> canonical only for each whitelisted coordinate pair whose owner context declares scale=2. Leave scale=1/unexpanded owners unchanged. Reject missing/ambiguous ownership for positions that are claimed to be scaled; report unsupported optional collections.
- The current geometry candidate scales around world origin (0,0): canonical = runtime / 2; runtime = canonical * 2. Do not subtract layout minimum or recenter about the room; that changes positions on negative and nonzero-origin maps.
- If a future affine origin is supported, make it explicit in context and use `origin + (point-origin)/scale`; do not invent it from bounds. The current source's xy() uses pure multiplication.
- Use Number.isFinite on x and y separately; reject partial, string, NaN/Infinity, cyclic or unexpected container inputs according to the helper's documented policy. Do not coerce malformed coordinates to 0, as that could produce a misleading successful roundtrip.
- Canonical persistence means old and new saves share the same coordinate convention without adding a guessed version marker. The helper is called once at serialization with explicit runtime-space input. Calling it on its own canonical output with the same runtime context would halve twice; do not advertise unconditional helper idempotence. Test repeated live-save/load cycles instead, or make input/output-space arguments explicit.

`restorePositions(canonicalSnapshot, targetContext)`:

- Prefer a pure planner returning `{updates,rejected,unsupported}` until generation/transaction hooks are integrated. Include exact owner and enemy ID for every update; handle homes by group and avoid array-index matching.
- A runtime application layer may write only x/y and the specifically restored homeX/homeY pairs after native restore success. Player/camera/control resets should be explicit and occur once in a matching, completed room.
- Validate each transformed point against that owner's **runtime bounds**, floor membership and actual collision callback with unchanged actor radius. Door dimensions are intentionally not scaled, so a mathematically transformed point may intersect a jamb even though its original point was legal.
- Do not automatically clamp an out-of-bounds point into the map and report success. Use an explicit nearest-safe policy with bounded search, correct connected room/door side, or decline it while preserving the native safe position.
- Do not update encounters whose ID/layer/visit/stage changed during async restoration. Do not spawn missing actors to satisfy a saved coordinate row.

## Origin and bounds tests

1. Nonzero bounds `[10,6,28,18]` -> `[20,12,56,36]`; point `(20,12)` -> `(40,24)` -> `(20,12)` exactly. This catches accidental scaling about the minimum.
2. Negative bounds `[-24,-16,12,10]` -> `[-48,-32,24,20]`; negative and zero points roundtrip exactly. Zero is valid, not a missing-value sentinel.
3. Mixed normal/STORY ward/DREAM stage/EGO owners: same region ID but distinct coordinate contexts, with only selected owners scaled.
4. Boundary-center and actor-radius checks at all four edges; point in AABB but outside floorCells; point inside preserved-size closed door/jamb must reject.
5. R81 champion canonical y=109 persists as 109 and restores to runtime 218 without running the old abs<=200 validation against runtime coordinates.
6. Duplicate enemy ID across different room keys must not cross-apply; mismatched exploration group does not overwrite home.
7. Actor with separate champion and native snapshots resolves in native ownership order; HP/death/door phase unchanged.
8. Cold R103 restore: global restore settles before resume; checkpoint transformed for its stage once, and late host-room player updates do not overwrite stage start.
9. Legacy save with no checkpoint/homes/optional collections remains valid; inactive dream checkpoint is retained; malformed point does not become `(0,0)`.
10. Repeat serialize -> JSON -> native restore -> apply positions -> serialize at least twice; canonical points remain stable, no 2x/4x drift, no progress/HP/count/schema change.
11. Optional summons, hospital units, EGO, point drops and embedded normalReturn either roundtrip with explicit contexts or are reported as unsupported prior to activation.

## Remaining integration limits

This audit identifies fields and safe helper tests. It does not validate all existing save extensions, cloud sync/co-op packet coordinates, runtime generation hooks, live storage transactions or actual cold-load gameplay. Those require separate integration evidence before activating the map scale globally. No common index edit is needed to implement and test pure helpers; the current lexical restore/generation ownership prevents claiming full runtime compatibility from those helpers alone.

## Exact optional-collection keys and agreed pure-helper scope

Root will implement explicit `roomKeys`, `activeRoomKey`, `samongActive`, and `checkpointScale` contexts for pure encode/decode helpers, without passing expanded raw data directly into native restore. Unknown fields and nonfinite values remain intact so existing validators retain ownership. This is a valid narrower alternative to the explicit reject/report policy described above. Use a clone that preserves nonfinite numeric values: the geometry candidate's JSON stringify/parse copy would turn NaN/Infinity into null and remove undefined fields. Transform a point only when both coordinates are finite; preserve invalid pairs as supplied.

- Hospital summons key: `layerKey(r.id,r.layer)`, e.g. `STORY:ep1a08` (HTML 8997).
- Generic summons key: `layerKey(r.id,r.layer) + (r.egoVisitId151 ? ':EGO:' + r.egoVisitId151 : '')` (10865), e.g. `DREAM:dist00:EGO:<visitId>`.
- Point-drop key: `String(layer)+':'+String(id)` (11723). pointRooms() starts with world entries then sets the current room under this ordinary key (11779); an active EGO room can therefore use `DREAM:dist00` **without an EGO suffix**, replacing the ordinary-key room's point-drop entry. This is collection-specific ownership, not proof it belongs to the normal room.
- EGO routeRoom has no own region/layer fields. Its parent carries `ego151.visitMap`, `visitLayer`, `visitId`, `active`; the snapshot carries `egoVisitId151` which must match. Serializer temporarily stores it as world[`EGO:<visitId>`], captures the snapshot, deletes that rooms key, and exports it as ego151.routeRoom (5253–5255). Explicit EGO opt-in or preservation is safer than deriving it from ordinary roomKeys.
