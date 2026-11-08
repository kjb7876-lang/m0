# Release integration — targeted UX / level recheck

**Provisional score: 8.0 / 10. No new visual navigation blocker observed in this bounded headless review.** This is not natural-play, physical-device, complete asset-load or public-release approval.

Scope: Mammon ep1b06 only, latest-main integration supplied by parent as `5b1b04c` plus V16, manifest `3bc723bdbadc3113a3d58f3a512878532baf560cf4bc6693d15f2b838a3f9849`. Historical seven-room reviews are unchanged. Reviewed three fresh screenshots (PC, standard portrait mobile, right-side mobile detail), their JSON metadata and the relevant architecture-yield code in `mammon-bossroom.js`. No additional room sample is claimed.

## Observations

- The PC view retains a broad, visible central fighting floor. The white hero remains immediately distinguishable from the brown floor, furniture and nearby enemy silhouette. Office desk/chair/filing unit/trolley remain perimeter landmarks, with the safe and cash visible.
- Both visible door groups remain recognisable as doors, and their approach floor is not covered by the office props. The change in wall finish does not create a visible false doorway or close the central route in these frames. This is visual evidence, not a fresh collision/pathfinding test.
- Standard mobile shows the hero clearly below the desk, with the upper doorway and a partial lower doorway along the left edge. Side safe/trolley are outside that crop, as expected at this camera. The right-side detail view shows the hero clearly in front of the safe/chair; no new furniture occlusion crosses the hero in these tested positions.
- The lower-detail safe still reads as a solid object beside the painted office furniture. The green desk lamp and warm candles give local contrast without hiding the hero. The retained cash, documents and safe still plausibly suggest interaction despite being scenery; this is a continuing expectation risk, not a new release blocker.

## Integration evidence and limits

The capture metadata records `mammonFinish.inherited=true`, `ownArchitecture=0`, `safe=1`, `cash=5`, with the inherited V16 overlay registered/on. The inspected source gates its cladding and brass-frame loops on `inheritedFinish`, consistent with that handoff. This reviewer did not independently compare all V16 asset bytes against main and does not claim ownership or asset preservation is proven by screenshots.

The supplied capture JSON reports no page errors or failed resources, but the inherited overlay also lists pending asset entries (including W01–W05; some mobile paint statuses are pending). Therefore the inspected pixels support this narrow visibility verdict, not a declaration that every inherited material has finished loading or all future frames are identical. Any later visual change after asset completion warrants a fresh comparison.

Remaining checks: moving behind desk/chair/safe, door opening and passage, collision-to-visible-footprint agreement, camera travel, natural boss attacks/dodging, thumb occlusion/touch controls, physical phone readability/performance and physical GPU rendering. Gray placeholder-like figures remain in the fixture and limit full encounter presentation judgments. The captures use assisted 777 STORY entry and a paused camera; no natural boss completion or save restore was executed by this reviewer.

Only this release review document was written. No source, historical review, asset, network or gameplay changes were made.

## Exact inspected evidence

Paths prefixed `after-` are under `/workspace/sin-room-release-evidence/`; source paths are under `/workspace/m0-release/`.

| File | SHA-256 |
| --- | --- |
| `r96/client-source/mammon-bossroom.js` | `c670125fb5a59964c0d987445743eb7ec3815e872aced96f34c7221b5b312a01` |
| `after-ep1b06-pc.png` | `69581def8ddfb06abc709af52fa35407b136ec23a04fbfb4f6b42a473735341b` |
| `after-ep1b06-pc.json` | `8090d6eff72db7c22264204676c29e920882b8a0adb7c763bf6635cb109f05d1` |
| `after-ep1b06-mobile.png` | `925292f259f933a79640359506854d2aea8f21f4d3a8fb11ce364542abe6c9b2` |
| `after-ep1b06-mobile.json` | `31476891e1561818e73480862dbda59664a58797c0d10ad2ab2f1fd6b056e61e` |
| `after-ep1b06-mobile-detail.png` | `d01cf82e75553e748b4260105e6afd6285b44b87175c3e4cc7ba88e49bce56a8` |
| `after-ep1b06-mobile-detail.json` | `3e228794b8697a1219f4369fdd5d60058bb95e97dd65c3f67e2793624005cac1` |
