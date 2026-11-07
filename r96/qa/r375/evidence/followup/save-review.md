# Independent review: R375 pure save-coordinate helpers

Reviewed `cloneSave`, `visitSaveCoordinates`, `encodeSaveCoordinates`, `restoreCoordinatePlan` and `r96/qa/r375/hospital-save-cpu-check.cjs` in `/workspace/m0-r375`. Read-only; root remains sole implementer. No runtime installation or full native restore compatibility is inferred.

## Results

Executed the repository test: **33/33 PASS**, including 40,110 native collision comparisons, all eight hospital door states, canonical-coordinate collections, invalid coordinates, EGO selection, immutable player point data and two encode/plan cycles. The explicit owner/context design matches the preceding schema audit. Normal HP, progress, seeds, door IDs, unknown detached tree fields and nested normalReturn are preserved by the tested transformations. Overflowed decoded coordinates are marked invalid. R81 champion snapshots remain in canonical bounds on disk.

## Findings on the reviewed candidate

### P2: checkpointOwner metadata is not detached

At line 199, `ep`, `stage`, `zone`, `seed` are copied by reference into the plan. The same function uses cloneSave for invalid x/y and IDs, but not these metadata values. A malformed but JSON-representable checkpoint owner, e.g. `samongR103.ep={bad:1}`, stays shared: mutating `plan.checkpointOwner.ep.bad=2` changes input `raw.samongR103.ep.bad` to 2. This violates the documented detached-plan property even though downstream native validation may reject the malformed metadata. Clone each owner value or clone the complete owner record. Use `context.checkpoint===true` consistently for both the visited point and metadata output.

### P2: missing EGO visit identity can compare equal to missing identity

The EGO predicate currently accepts a context key `DREAM:dist00:EGO:undefined` when both `ego151.visitId` and `ego151.routeRoom.egoVisitId151` are absent. String concatenation builds the same key and `undefined===undefined` passes. A restore plan with a valid coordinate row is then produced for an unidentified visit. Native validation is still required and is not bypassed by this helper, but the helper's own explicit identity promise is weaker than advertised. When EGO is explicitly selected, require a real nonempty/string visit ID and matching own snapshot identity before matching the full key. Do not replicate the whole native gameplay validator.

Native EGO visit IDs are strings shaped `ego:<visitSeq>` (HTML 5179), not numeric 7. The positive test should use `visitId:'ego:7'`, `routeRoom.egoVisitId151:'ego:7'`, full key `DREAM:dist00:EGO:ego:7`. This exercises the extra colon in a real key. The generic snapshot's `version:6,scope:'hapil-storyworld03'` is also not the native V6 scope (`hapil.storyworld.depth-full.20261008`); using the real envelope would make the schema fixture more representative without adding native restore claims.

## Non-JSON graph edge limitations (not normal JSON save regression)

- cloneSave preserves shared references. If one point object is shared between selected and unselected room entries or an unknown field, changing the selected point changes all those references in the cloned result. This contradicts selection preservation for arbitrary JS graphs. If the same object is visited first as player and then as enemy, encode's WeakSet also skips the later enemy homeX/homeY conversion. The original input remains unchanged, but the output's unselected data is changed and the selected home is missed.
- Sparse unknown arrays lose trailing holes/length because cloning starts with `[]` and only copies enumerable keys: `Array(3)` becomes length 0. `new Array(value.length)` preserves length.
- Native JSON parsing cannot produce shared references or sparse arrays. These findings can be addressed by restricting/documenting the helper input as a detached JSON-shaped tree (with invalid scalar preservation), rejecting graph aliases/cycles, or copying each visited path independently. They do not require expanding the runtime feature scope. The current clone's cycle support should not imply complete support for every JS object graph.

## Independent reproductions

```
checkpoint_owner_shares_invalid_nested_metadata: true
missing_ego_identity_accepted: 1 planned position
aliased_snapshot_results:
  selectedX=10, unselectedX=10, unrelatedX=10,
  enemy.homeX=10 (expected 5 under selected enemy conversion)
unknown_array_lengths: before=3, after=0
```

## Boundaries retained

This is a pure encoding/planning review. plan.valid means finite decoded coordinates, not safe collision/room bounds, authorized enemy identity or successful native hydration. Per-room async readiness, radius/door collision, R103's non-awaited resume, save transaction suppression, source-generation integration and full gameplay restore remain separate work. No autoscale installer is present.

Reviewed world-scale source SHA256: `037de2a54c416a35fbda3aaa21d5be268621666c473da9e29269b8329a4df75e`.


## Follow-up review: fixes verified

Read-only re-review and direct re-run of `node r96/qa/r375/hospital-save-cpu-check.cjs`: **40/40 PASS**, including 40,110 native point comparisons and 6,615 aperture comparisons. The initial findings above describe the superseded candidate.

Resolved:

- `checkpointOwner` now clones its complete owner record, so malformed nested metadata is detached from the input.
- Explicit EGO selection now requires native-shaped positive string IDs matching `^ego:[1-9][0-9]*$`, STORY/DREAM ownership, the full selected key and matching `routeRoom.egoVisitId151`. Positive coverage uses `ego:7` and `DREAM:dist00:EGO:ego:7`; missing, numeric and malformed identities are rejected.
- `cloneSave` now copies each path independently, uses an ancestor WeakSet to reject cycles, and preserves sparse array length with `new Array(value.length)`. Selected/unselected/unknown aliases no longer share cloned point objects, and a player/enemy alias no longer suppresses selected enemy home-coordinate conversion.
- Nonfinite values continue to be preserved for validation instead of being normalized to null. Original snapshot objects remain unchanged in the regression tests.

No additional blocking defect found within the reviewed pure encoding/planning scope. Native runtime save/restore integration, asynchronous room readiness, checkpoint ownership at hydration time, final placement collision checks and full round-trip gameplay remain unverified by this helper suite.

Nonblocking fixture representativeness note sent to root: `snapshot()` used the obsolete scope `hapil-storyworld03`; the actual V6 scope is `hapil.storyworld.depth-full.20261008`, guarded at `r96/runtime-text/index.html:3277` and emitted at line 3285. Using the current scope improves the fixture but does not establish native restore acceptance.

Follow-up reviewed world-scale source SHA256: `8641e553076740a5646d6807931016e58c0d48a7ebbeb40e7cf887b2469488cd`.

Root follow-up: fixture scope updated to the native V6 value and the 40/40 suite passed again; no native restore acceptance is claimed.
