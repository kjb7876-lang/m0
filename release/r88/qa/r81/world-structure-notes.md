# V5 world structure and combat implementation

The original V4 world adapter did not use the hospital map currently shown by the hospital launcher. It reused the retired `hospitalMazeLayout5` diagonal layout (-28..81 bounds), while the hospital launcher uses `hospitalCoreLayoutB2` (0..87 × 0..113). It also put a bright regional backdrop over the whole bounding rectangle. These are the primary code-level causes of the divergent cave/swamp structure and excessive background.

The V5 adapter now derives its floor cells, floor rectangles, exterior boundary and interior baffles from the current hospital layout with the hospital's three moving door leaves removed. Each world map gets its original regional surface and its own three generic narrative doors. Generic wall width/depth matches the hospital segment endpoints exactly. Hospital-only gameplay and texture flags are absent; `worldWardR81` identifies the new common geometry.

## Normal story maps

Native ordinary packs occupy both branches. Each distinct ordinary native type has one explicitly tagged additive champion with double visual/body size and six times its donor's health. Native enemy identity, attacks, damage, original major count, story text and destination graph stay canonical. The original midbosses and bosses wait in the boss room.

Reaching the gathering room brings the surviving branch enemies together without replacing or healing them. Clearing this field group permits the boss-door interaction and canonical pre-story text. The original majors awaken upon entering the boss room. Their defeat permits the exit-door interaction and canonical post-story text; only then does native region completion expose next-map travel. Native previous-map travel remains available at the new entry.

Each chamber uses the same physical floor/wall topology as the hospital. Castle side gates use the two true lower entry connectors instead of cosmetic door leaves in broad open rooms.

## Native progression exceptions

`hando01`, `hando02`, `hando03`, `kair02`, `kair03`, `last301`, and `cult04` retain their native progression owner. These include castle defense/owner permissions, the protected guardian, the one-time ally event, the forced-fall encounter and the multi-phase cosmic/final-boss finale. Exceptional encounter types (`trial`, `cosmic`, `persona`, `finalBoss`) are never intercepted by the ordinary ward controller.

DREAM and EGO visits retain the preserved V4 geometry and placement compatibility. The new story controller never claims those visits. Completed/imported legacy visits do not gain new field champions.

## Save boundaries

The existing native save schema remains authoritative. A separately validated `worldMazeR81` ledger stores phase, rally membership and a bounded champion snapshot. This is necessary because the native enemy loader caps its rows at 40 and the swamp has 37 native rows plus four champions. Living champion health and safe coordinates survive both warm and cold restore without multiplying again; defeated champions stay defeated through the native defeated-ID ledger.

An imported V4 save has no R81 ledger and uses a different topology. Its surviving actors retain their native identities, health and death records but migrate to validated deterministic ward positions; a V5 checkpoint retains exact safe coordinates.

The integrated native actor restore retains expanded-map coordinates and validates against actual floor/collision, instead of clamping valid ward positions to the old 2..28 arena and searching from a sealed boss objective. Native projectiles now sweep the same runtime door state and generic walls for both friendly and hostile shots.

## Verification limits

Automated checks use Node VM execution with renderer readiness, DOM and media stubs. Geometry/render calculations may use real Three classes. This is not a browser, GPU or natural-play verification. See the separately generated result JSON files for actual passing checks; this design note is not a test result.
