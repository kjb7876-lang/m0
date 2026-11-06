# Read-only hospitalPhysics review

Reviewer: map_scale_audit. Repository source was not edited. Reviewed `R375-geometry-2` in `r96/client-source/world-scale-r375.js` and `r96/qa/r375/hospital-save-cpu-check.cjs` before the root's pending collar-thickness/query-cache fixes.

## Reproduced correctness issue

The physics capsule radius is correctly computed from each wall's own depth. However, the enlargement kernel doubles newly added doorway shoulders to .48 depth, whereas the original doorway boundary uses .24. A capsule extends by half its depth beyond its endpoint. Consequently, the supposedly unchanged open door loses .12 clearance on each side, .24 total.

All three actual hospital doors reproduce this with radius .29 and all doors open:

| Door | Relative x offset | Original test point | Enlarged test point | Original crossing | Enlarged crossing |
| --- | ---: | --- | --- | --- | --- |
| door-0 | +2.58 | (22.58,20) | (42.58,40) | clear | blocked |
| door-1 | +2.58 | (31.58,90) | (60.58,180) | clear | blocked |
| door-2 | +3.58 | (8.58,6) | (13.58,12) | clear | blocked |

Each crossing is from y−1 to y+1 at the stated x. This compares the same offset from the relocated door centre, not a doubled offset: the door aperture is the user's explicit scaling exception.

The root is preserving collar/shoulder thickness at the original `a.thickness`, adding complete aperture sweeps and closed leaf/collar seam tests. The existing tests cover only doorway centres and outside shoulders, so they could not detect this narrowing.

## Physics assessment

- Layout-owned half-open rectangle containment correctly avoids the old fixed B2 closure.
- Per-wall capsule clearance correctly distinguishes doubled body walls from unchanged door leaves.
- Sweeps cover segment interiors plus endpoint circles; zero-length positive-depth walls are supported.
- Geometry caches are keyed by layout identity and the tests correctly build a fresh object for each door configuration. This is safe under an immutable-layout contract. Mutating endpoints/depth in a cached layout would invalidate bucket ownership; callers must rebuild instead.
- Current actual B2 geometry supplies exterior boundaries and baffles. `boundaryContact` itself does not verify coverage of arbitrary missing floor intervals; callers must supply complete boundary geometry. `clear` checks both endpoint domains.
- The API is intentionally independent of gameplay props/door-phase ledgers. Runtime integration still has to combine physical geometry with solid props, phase-forced closed doors and matching rendered door state.

## Additional edge-case test gaps

1. Half-open containment: exact rectangle minimum, maximum, overlap seams, and a hole/outside point. For positive-depth exterior walls, contained boundary centres should still be blocked.
2. Wall endpoint tangency and reverse sweep, stationary inside/outside/tangent states, first-contact t followed by t±epsilon blocked checks.
3. Diagonal and vertical synthetic walls, verifying capsule collision independent of angle/width metadata.
4. A point radius larger than a doorway, plus radius-zero projectiles against the new collars.
5. Assert constructing/querying physics does not mutate the supplied layout.
6. Either reject zero-depth walls or document/test consistent zero-radius semantics. Currently a zero-depth segment [[5,2],[5,8]] accepts `blocked(5,5,0) === false`, but reports a hit for the radius-zero crossing (4,5)→(6,5) at t=.499999995 because sweep R is clamped to 1e-8. This is not an actual B2 blocker because its walls have positive depth.

The save tests verify helper selection and detached coordinate plans, not execution of the native restore chain. Their existing summary accurately states that limitation. Restored points in newly added doorway collars must be collision-checked and repaired with progression-aware ownership; mathematical coordinate roundtrips alone do not establish safe resume locations.

## Compact optimizations

The root's proposed bounded bucket-range candidate memo and direct single-bucket return are safe: queries sharing the same bucket bounds use the same conservative wall superset. Keep the memo per immutable layout and cap its entries; do not quantize radius or positions to create logical collision results.

Other safe options if profiling still requires them: precompute per-wall dx/dy/length² and unit axes; use squared distance comparisons for blocked; bucket the rect list used by contains while preserving exact half-open comparisons. These reduce repeated calculation without caching gameplay state. Grid-edge/connected-component caches can reject impossible paths faster, but introduce more ownership/memory complexity and are unnecessary until simpler changes are measured.

Review status: pending inspection and rerun of the root's collar-thickness and candidate-query cache fixes. No full runtime activation, save integration or player/browser acceptance was reviewed here.

## Final focused re-review after root fixes

The root preserved original collar depth, added bounded bucket-range candidate memoization plus the direct-bucket fast path, and rejected zero-depth walls. Read-only inspection found no remaining correctness blocker for the tested positive-depth B2 geometry.

Reran the repository hospital/save helper suite: **40/40 PASS**, including **40,110** original-vs-native collision points and **6,615** open-aperture comparisons. All eight door states retained the expected boss-room reachability. Measured Node VM route times in this rerun were 345.03–1582.90 ms; this remains unsuitable as evidence of real-time/mobile performance acceptance.

Additionally constructed an independent vertical-door fixture without changing repository files. Compared original vs enlarged point/swept collision for 441 y offsets, five actor radii (0, .1, .29, .5, .9), and both open/closed states: **4,410 comparisons PASS**. Vertical collars retain width=3 (segment length), depth=.24 and angle=π/2; endpoints are [(20,14),(20,17)] and [(20,23),(20,26)]. The closed leaf retains endpoints [(20,17),(20,23)] with conservative bounds [19.88,16.88,20.12,23.12]. No aperture narrowing or leaf/collar seam leak was reproduced after the fix.

The query cache stores only conservative wall candidate sets keyed by bucket range under each layout identity. It does not quantize coordinates/radii or cache gameplay decisions; the direct array/Set return variants are both safely iterated. Immutable-layout ownership and fresh objects for door-state changes remain required.

Final status: **approve the independently callable positive-depth B2 collision helper within its tested scope**. This is not approval to activate it in the game yet. Captured native API closures, runtime solid props/door-phase state, save application/rollback, actor placement and repeated path-query latency remain integration/acceptance work. No repository edits were made by this reviewer.
