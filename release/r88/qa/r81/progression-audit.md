# R81 narrative progression contracts

This is a source audit, not a browser or natural-play result. The authority is the existing native `index.html` runtime; asset documents do not authorize changing its story outcomes.

## Geometry-sensitive contracts

| Region | Native contract | Required layout support |
|---|---|---|
| `hando01` | R75 two-gate defense; the castle falls as authored, without a boss-kill reward. | At least two `worldR74.doors`, two distinct safe gate approach/assault positions, preserved civilian props and ordinary-enemy pool. |
| `hando02` | Two owners authorize their gates, then two assault rounds; three garrison allies join after the first round. | `doors[0]` and `doors[1]` must exist and have distinct IDs. Both owners must be reachable before their gate opens and within both NPC and door interaction ranges. |
| `hando03` | Native core boss, owners retained; completed `hando02` grants `gateMask=3`. | Two gate bindings must remain meaningful; the native boss and source progression stay intact. |
| `last301` | Boss-only duel, followed by the authored fall at 12 seconds or below 66% boss HP; not a conventional kill. | Keep empty ordinary roster, native boss identity, reachable objective and post-story portal. |
| `last303` | Three residents are protected narrative props, not enemies. | Resident positions must remain on floor and accessible around the objective. |
| `kair02` | The `kair-great-03` boss represents a command barrier; the time guardian is a separate protected NPC. | Preserve `r75CommandBarrier`, native boss identity and protected NPC placement. |
| `kair03` | After `kair02`, the time guardian assists once when the player is below 35% HP in the boss fight. | Preserve the native ledger and actor; do not synthesize a replacement boss or support rule. |
| `restHando`, `cult01/02/05/06/03/04` | The two owners accompany the player after `hando03`. Their damage cannot finish enemies and has a per-enemy budget. | Preserve actor types, native companion hooks and enemy identities. The safe rest map stays outside the new combat-layout scope. |
| `cult04` | Native multi-stage finale and conditional Dream/Persona/EGO logic. | Keep finalStage, trials, cosmic/Persona actors and narrative parts; geometry must not replace the finale with generic completion. |

## Shared requirements

- Native R74 saved door IDs are exactly `door-0` through `door-2`; at most three open IDs can be stored per region. Add no incompatible identifiers or schema.
- R75 defense reads `door.edge` as **array indices** into `layout.nodes`, then chooses the endpoint farthest from `room.objective` as the assault position. Node IDs must match their indices, and both resulting positions must be distinct and walkable.
- Owner NPCs are initially placed 1.25 world units on the positive normal of their door. Their interaction radius is 0.85, while the door independently checks its own reach and a safe point 0.9 units from its plane. A visually nearby owner is insufficient; test both predicates together.
- The R74 collision hook reads live saved door state. Do not leave a permanent closed-door leaf in the authoritative wall array after native opening, or visuals may open while physics remains blocked.
- Gate leaves must meet their adjoining walls. A six-unit door in an 84-unit cross corridor is bypassable unless the remainder is partitioned. Existing B2 return connectors at `(17,105)` and `(70,105)` are each six units wide; `(29,90)` is also a six-unit throat. Positions such as `(17,89)` are in a wide floor band and cannot serve as sealed throats by themselves.
- R72 source portal points are read from `REGION_ROUTES.source(id).landmarks[0]` or source exits, not simply `layout.sourceExits`. Its closure caches points using entry/clear/engaged/final-stage fields. It does not include ordinary door generation. Establish the new map's physical source landmark before portal caching, and retain canonical destination/permission logic.
- Normal checkpoint tests must seed canonical preceding progress and derive unlocks before calling native restore. Directly setting `zone` and `room` does not constitute a valid restore test.
- Castle defense actors may deliberately be hidden until their assault round. A placement hook must not activate them or erase their phase-owned state.

## V4 issues caught by this audit

- One R78 door per map silently disabled the native defense controller in `hando01` and `hando02` because its admission condition requires at least two doors.
- The second owner in `hando02/03` could have no door binding. Incrementing its gate bit without a real door is not valid evidence that the two-gate story works.
- Prior tests checked generic boss/midboss positions and counts, but did not exercise these special native flows.

## R81 implementation review finding

The first draft of the common route controller excluded castle, guardian and
fallen-court scenes, but still intercepted `finishEncounter` in `cult04`.
That would have bypassed `firstPost` and `awakenPre`, `finalStage=2`, all six
Cosmic guardians, the final boss and the preserved-core epilogue. The route
controller must defer any record with both native transition parts, as well as
trial/Cosmic/Persona/final-boss stages, to its native progression owner. The
new `finale-contracts.cjs` regression exercises the actual native transitions
through final completion using explicit assisted combat fixtures.

The first R81 portal adaptation also exposed a performance defect: native
`nearest()` searched roughly 1,500 positions for the next-map portal while
its exit door was closed. Every candidate required an unreachable path
search, stalling map entry for minutes. A locked/uncompleted R81 map must
return no next portal before that search, then recalculate after native
completion. The first castle QA run was interrupted at this
defect and is not counted as a completed test result.

The restored castle geometry exposed an older hospital integration bug:
`hospital-maze-progression.js` wrapped native door `canUse` and `use` but
omitted their owner-ID argument for every non-hospital map. Both castle
owners were on valid, reachable floor, within NPC/door range, but the native
defense permission check rejected them. The wrapper now forwards remaining
arguments unchanged; it does not synthesize owner permissions or open gates
remotely. The native owner/door regression must pass before acceptance.

Castle arrival also needs a reachable local entry-side anchor while both gates
are closed. Searching for an arrival position with a path to the upper gather
room incorrectly rejects a valid save at the entrance. The new castle anchor
is in the entry hall; assault gates keep their native ownership. After native
castle completion, the next-portal goal must remain available even if the
separate boss-room door is still physically closed, so native navigation can
approach and operate that door normally.

## Completed V5 CPU regression

- `node qa/r81/progression-contracts.cjs`: 12/12, exit 0.
  Native entry restore for all three castle maps; distinct gates and defense
  admission; owner interaction and permission persistence; both hando02
  assault rounds and garrison arrival; post-completion portal/guide goal;
  actual last301 required fall; protected residents/guardians/companions;
  native kair02 command-barrier identity.
- `node qa/r81/finale-contracts.cjs`: 6/6, exit 0.
  Native first-boss scenes, awakening, all six Cosmic guardian identities and
  stage transitions, final boss, preserved-core epilogue and completion.

The tests use canonical unlocked save fixtures, assisted positioning,
invulnerability and direct native lethal hits. They do not prove browser/GPU
rendering or natural play. Hando01's controller admission and gate geometry
are checked, but its entire two-round collapse is not replayed here. Kair03's
protected guardian placement is checked; its low-health assistance is not
replayed here. JSON reports record each assertion and its data.
