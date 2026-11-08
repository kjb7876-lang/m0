# Animation / VFX independent review — dedicated room art

**Discipline score: 8.2 / 10. Status: provisional headless review of the final local build.**

Reviewed revision `sin-room-art-v1`, final build manifest `78ab31f9eb61309bd30e03e3e28e1e658ed9dbb29d2101e40d3e0825b29247a9`. This reviewer did not generate the art or implement the overlay. Scope is 24 static props in six revised rooms; Pride receives no new art in this revision.

This report supersedes the earlier review of manifest `3c403406b5a3d874f07ae3aa59a08f4e77266390c344b3928c2d3fd30ed3b9ae`. The earlier CRT contact patch, broad black pads, shortened furniture feet and wall slicing are prior-candidate findings. They are not carried forward as unresolved defects after the final re-review. The evidence table below contains only final-build images actually reopened for this update: six PC frames and three mobile-detail frames, emphasizing Sloth, Mammon and the burning restaurant.

The final sprites show more complete feet, lower furniture edges and contact shadows. In the inspected captures, no broad black collision plate, wall cut through the authored furniture, white atlas rectangle, neighboring-cell fragment or conspicuous bright cutout halo was seen. The décor stays at room edges and does not add a large central effect layer.

## Final observed results

- **Sloth:** the sofa and bed retain their full lower silhouettes. The CRT stand's feet and ground contact are now visible in the mobile detail, and the earlier hard patch behind it no longer reads as a floating plate. The refrigerator reaches the floor cleanly. Native candle furniture still overlaps small parts of the arrangement, but the new furniture itself is readable.
- **Envy:** the settee, console, cabinet and standing mirror now show complete lower supports in the final PC frame. Their pale edges remain distinct from the central hero and native cyan enemy. No animated reflection or new glow is claimed. The final mobile Envy frame was not reopened in this update.
- **Gluttony:** the final PC frame shows the preparation island's legs and lower trays, the range body and refrigerator without floor slicing. Pot highlights stay local, with no new blanket of steam or bloom. Burner/steam motion is not supplied by this static atlas. The final mobile Gluttony frame was not reopened in this update.
- **Lust:** the booth's cocktail table and bar furniture have complete lower outlines in the final PC frame. Glass highlights remain restrained. Existing braziers remain in front of parts of the bar area, but do not create a new alpha or particle defect. The final mobile Lust frame was not reopened in this update.
- **Mammon:** the desk, swivel-chair feet and filing cabinet now sit convincingly against the wall without being sliced by it. The chair's high back, arms and base are much clearer in the final mobile detail. Native candelabra remain nearby, but the earlier heavy silhouette overlap is reduced. The safe and cash stay exclusive to Mammon, and the central hero is clear.
- **Burning restaurant:** the tablecloth, table feet, charred chairs and buffet base are more complete and grounded in the final PC/mobile detail. Small painted flames stay at table/chair/buffet edges and do not cover the central hero or combat area. **These flames are static painted décor, not a frame animation or a newly implemented damage effect.** Existing enemy/fire visuals stay separate.

## Source and captured-state checks

The final `sin-room-art.js` still uses four native prop records per revised room, with explicit source rectangles and pixel pivots. It now defines `GROUND_EDGE` from visible-alpha contact coordinates and uses a native vertical world plane for the authored art. `restoreAuthoredCommands` preserves the authored quad and source rectangle against generic prop postprocessing that previously displaced/cropped the furniture. This supports the visible grounding improvement; it is not a temporal stability test.

Rendering uses the native recorder and one cropped atlas command per visible prop. It adds no new particle emitter, animated material, per-frame image generation or combat callback. Collision-mesh suppression stores/restores render-layer masks while preserving collision records.

All nine final capture JSON files examined here list exactly four current art props, zero overlay/page/game errors and no failed resources. Whole-scene draw-call snapshots range from 65 to 99 for the six PC frames and 30 to 34 for the three mobile-detail frames. These are paused snapshots of different rooms, **not** a before/after benchmark or FPS guarantee.

Cumulative `rooms` / `props` counters still rise faster than zone transitions because the native room-prop array is replaced and the overlay reapplies its four records. Live count remains four. If profiling later identifies allocation pressure, preserving record objects across unchanged array replacement is an optimization candidate. This review does not diagnose a measured leak or performance regression.

The source retains an immediate alpha change to 0.36 when projected furniture overlaps the hero. It provides a visibility path, but no behind-furniture movement sequence was recorded for this review. Fade transitions, camera-motion shimmer, foot/pivot stability over motion and combat-time visibility remain unverified.

## Score basis and limits

| Component | Score / 10 | Basis |
| --- | ---: | --- |
| Painted visual consistency | 8.2 | Detailed surfaces, no new primitive combat effects or broad glow |
| Shape / contact / pivots | 8.6 | Complete lower silhouettes and improved grounding in final captures |
| Effect and actor readability | 8.2 | Restrained flames and clear central hero; native clutter remains localized |
| Runtime application | 8.3 | Four live props, measured contact planes, preserved authored recording; temporal behavior not observed |
| Reproducibility / evidence | 7.2 | Final hashes and states verified; no moving/combat sequence or device timing |

Art Bible weighted result `(8.2×3 + 8.6×2 + 8.2×2 + 8.3×2 + 7.2)/10 = 8.2`; discipline score **8.2**. This is a provisional score for static room-art integration, not approval of animated fire or final GPU quality.

No blocking VFX defect was found in the final static scope reviewed. Physical GPU, physical mobile devices, sustained natural combat, temporal opacity transitions, animation timing and low-end frame time are unverified. If animated environmental fire is later requested, it needs a painted frame sequence and a separate temporal review; the current single-frame flame must not be described as completed animation.

## Actually viewed final evidence

PC: 1920×1080, camera `(16,11)`. Mobile detail: CSS 390×844, DPR 3, camera `(21,10)`. Both use Chromium headless, existing 777-assisted normal STORY entry and a paused state. Each image below was reopened directly for this final-build review, not assessed from a contact sheet. Earlier-candidate images were not used to establish the final score.

| PNG | SHA-256 |
| --- | --- |
| `after-ep1b02-pc.png` | `04f3951152272915d1bc4e602c465326caf2013065b0e1567174afb56cac3f64` |
| `after-ep1b03-pc.png` | `6b6ad8532773930962493c8856d475944284319ed3f384f5db605775c7c61ca2` |
| `after-ep1b04-pc.png` | `f91665a5feb4985f8da6d8e80017a561e6bea4c10a5d68dfa8e8efa00b184550` |
| `after-ep1b05-pc.png` | `fa6e4eb5ab868fbd2169af67328ee0ab5e72f62f2f7eb82d17d6fbe868a29930` |
| `after-ep1b06-pc.png` | `4145ebd89cf24aa63b7283447534a8b7ca6a4438bfc5d69e6555c9f36d9c3f17` |
| `after-ep1b07-pc.png` | `3ff794fb094f9f161397d711aae8a81a96c7bf9b2cb8d91c89870fdb196b122f` |
| `after-ep1b02-mobile-detail.png` | `8c424befc6c2fba72994dc996f5be948d6b198fc863ca6c52408f82ebd6ec6e6` |
| `after-ep1b06-mobile-detail.png` | `b708c92108da06881c878e3f97d1bb52c6114981afe15fb5e3974dd087818088` |
| `after-ep1b07-mobile-detail.png` | `496fbf5780615cacbf0ff1839b76c7d1d3d86675279ad499a56659f754ecb7cd` |
