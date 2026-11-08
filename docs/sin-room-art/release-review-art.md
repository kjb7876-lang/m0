# Mammon release integration — independent art addendum

Status: **PROVISIONAL (임시), 8.23/10 — no blocking art issue observed in the two examined release frames.** This is a targeted recheck of Mammon after integration with the latest main and its existing V16 presentation. It does not replace the historical six-room review in `review-art.md` or certify deployment.

## Scope and reviewed build

- Task: SW-0009, revision 1; independent art direction reviewer, separate from implementation.
- Workspace: `/workspace/m0-release`.
- Checked base HEAD: `5b1b04cd3bffc39a47cfca3aed051bbc2a05f73f`.
- Runtime manifest SHA-256, measured from `r96/runtime-manifest.json`: `3bc723bdbadc3113a3d58f3a512878532baf560cf4bc6693d15f2b838a3f9849`.
- The integration brief states that the new overlay yields its wall cladding/brass jamb treatment to the existing V16 implementation while retaining the dedicated office furniture, safe and cash. This addendum evaluates the resulting visible scene; it does not independently certify all V16 source preservation or merge-conflict resolution.
- Criteria: `.claude/skills/storyworld-art-style/SKILL.md`, `docs/art/art-bible.md`, and the user's hotel-owner office plus vault theme. Historical reviews and source files were not edited.

## Pixel observations

Both fresh PNGs below were opened individually. The PC overview shows the wall perimeter and vault doors as coherent single forms, with no visible duplicate cladding or doubled brass frame. The four dedicated office props remain identifiable: executive desk, leather chair, secure drawer cabinet and cash trolley. The desk continues the wall diagonal; chair feet, desk base and trolley contact remain intact. There is no recurrence of the earlier straight floor crop, north-wall slicing or dark footprint pads.

The portrait detail shows the desk's ledger, phone and green lamp, the chair's leather form, the safe and bundled money. Office and treasury functions remain distinct and readable. Furniture stays around the room edge, leaving the central hero and arena visually open. The existing wall treatment is quieter than the earlier candidate but does not erase the room's office/vault identity.

The retained safe and cash blocks still use comparatively plain geometric surfaces next to painted furniture. Existing candle fixtures overlap small portions of the desk/chair region. Both are inherited, nonblocking polish limitations; neither hides the main furniture silhouette or hero in these views. No new art correction is required before the other release gates proceed.

## Targeted score

This score applies only to the examined Mammon release integration, not all seven rooms.

| Component | Weight | Score / 10 | Basis |
|---|---:|---:|---|
| Style | 3 | 8.3 | The dark painted office materials fit the room; the preserved safe/cash geometry remains less detailed. |
| Form | 2 | 8.4 | Distinct office and vault silhouettes, complete furniture bases and clear diagonal arrangement. |
| Readability | 2 | 8.4 | Hero and open arena remain legible in PC and portrait detail; small candle overlaps persist. |
| Integration | 2 | 7.8 | No visible doubled wall/frame, clipping or grounding regression; plain safe materials and legacy light overlaps remain. |
| Reproducibility | 1 | 8.2 | Exact fresh-frame/build hashes and fixed-camera sidecars identify the evidence; this reviewer did not rerun capture or inspect physical devices. |

Weighted result: `(8.3×3 + 8.4×2 + 8.4×2 + 7.8×2 + 8.2)/10 = 8.23`.

The numerical result is above the skill's recorded 7.77 threshold. Evidence is still incomplete for full graphical verification, so the result remains **provisional**, not “verified.”

## Exact evidence

Capture directory: `/workspace/sin-room-release-evidence/`.

| File | SHA-256 |
|---|---|
| `after-ep1b06-pc.png` | `69581def8ddfb06abc709af52fa35407b136ec23a04fbfb4f6b42a473735341b` |
| `after-ep1b06-mobile-detail.png` | `d01cf82e75553e748b4260105e6afd6285b44b87175c3e4cc7ba88e49bce56a8` |
| `r96/runtime-text/assets/sin-rooms/mammon-office.png` | `e750d4c70e8f60dc8c6d63e1c298007001a77fb64e9576d4e846d2276cf462c0` |

The atlas hash matches the previously reviewed Mammon artwork. PC sidecar: Chromium headless, 777-assisted normal STORY entry, paused camera `(16,11)`, viewport 1920×1080, device scale 1. Mobile detail sidecar: the same method at camera `(21,10)`, viewport 390×844, device scale 3. Both sidecars report empty game-error, page-error and failed-resource arrays; their renderer description explicitly marks GPU verification incomplete.

## Remaining limits

Headless browser stills support this limited visual judgment. They do not establish physical GPU/mobile rendering, natural play, active combat readability, moving-camera sorting, animation, collision, doors/progression, save restoration, latest-main preservation, CI success or published Pages success. Those require their respective independent release evidence. No game source, atlas, historical report, merge or deployment was changed by this reviewer; only this addendum was added.
