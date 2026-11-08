# Release animation / VFX recheck — V16 integration

**Independent discipline score: 8.2 / 10, provisional. No blocking VFX defect found in the three static release frames reviewed.**

Release baseline: `5b1b04cd3bffc39a47cfca3aed051bbc2a05f73f`. Runtime manifest: `3bc723bdbadc3113a3d58f3a512878532baf560cf4bc6693d15f2b838a3f9849`, recorded by `r96/build-result.json`. This is a targeted recheck of Mammon's V16 architectural handoff and a burning-restaurant sample. It does not replace the historical six-room review of manifest `78ab31f9eb61309bd30e03e3e28e1e658ed9dbb29d2101e40d3e0825b29247a9`, and does not claim a fresh visual review of every room.

The reviewer read the unchanged Art Bible and art-style rules, inspected the integration source, and directly opened the three release PNGs listed below. The reviewer changed no game source or assets and performed no network, merge or deployment operation.

## Visual findings

- **Mammon architecture:** The PC frame shows a single coherent wall finish and native door silhouettes. No duplicate inner iron cladding, extra brass header, broad black furniture plate or conspicuous wall slice is visible in this sample. A still frame cannot establish freedom from temporal z-fighting.
- **Contact and pivots:** The office desk, chair, filing cabinet and trolley remain readable against the floor. The mobile detail shows complete chair feet and armrests, the desk's lower edge, the safe base and cash on top. No white cutout rectangle or broad opaque alpha border is evident. Painted contact shading remains soft. Some native candle stands overlap furniture in projection; central actor visibility remains adequate in these fixtures.
- **Mammon material consistency:** The preserved safe and five cash bundles remain visually simpler and more geometric than the painted office furniture. This is a visible polish limitation, not a new V16 handoff defect or evidence of an animation failure.
- **Restaurant effect separation:** The table, buffet, scattered chairs and booth remain around the room edge, leaving the center readable. Small painted flames stay attached to the damaged furniture. Existing larger fiery creatures and candle props remain separately visible. The added furniture flames are **static painted décor**, not new animated environmental fire, combat skills or damage effects.
- **Occlusion:** No regression is visible in the sampled stationary positions. These frames do not exercise walking behind furniture or moving the camera through fade thresholds.

## Source and captured-state checks

`mammon-bossroom.js` checks the existing miniature pilot's `registered && on` state. When active, its own cladding and native-door brass-frame loops receive empty lists; the safe and cash loops remain active. Both Mammon JSON files report `mammonFinish = { inherited: true, ownArchitecture: 0, safe: 1, cash: 5 }`, with the existing V16 pilot registered/on. This supports the architectural handoff visible in the frames. This targeted review did not independently audit every V16 source/asset byte against main.

The art renderer retains measured ground-edge offsets, explicit atlas crops/pivots, native vertical prop planes and restoration of authored recording commands. It still submits static image props through the native recorder, without new particle emitters or combat callbacks. The source applies an immediate alpha of `0.36` when furniture overlaps the projected hero; transition quality remains unobserved. Collision-only presentation masks retain their source restoration path, but this review is not a collision or save test.

Each accompanying JSON lists exactly four current room-art props, zero art/game/page errors and no failed resources. Whole-scene draw-call snapshots are 73 for Mammon PC, 34 for Mammon mobile detail and 67 for restaurant PC. These are paused snapshots, not a frame-time benchmark. Cumulative application counters are larger than live counts because props are reapplied after native array replacement; the three samples do not establish a leak or long-session allocation stability.

## Score and remaining limits

| Art Bible component | Score / 10 | Basis |
| --- | ---: | --- |
| Painted visual consistency | 8.2 | Room-specific furniture and restrained fire; geometric safe remains simpler |
| Shape / contact / pivots | 8.6 | Lower silhouettes retained; no sampled return of pads or slicing |
| Effect / actor readability | 8.2 | Center remains readable; native candle overlap persists locally |
| Runtime application | 8.3 | Four current art records and explicit V16 handoff; no new animated system |
| Reproducibility / evidence | 7.2 | Exact release evidence; only paused headless samples |

Weighted score `(8.2×3 + 8.6×2 + 8.2×2 + 8.3×2 + 7.2)/10 = 8.2`. The score is retained rather than increased by the handoff fix. Physical GPU/device output, low-end frame timing, temporal alpha stability, animation timing and sustained natural combat remain unverified. This report offers no door/progression/save, full seven-room, deployment or natural-play approval.

## Exact release evidence

All files are in `/workspace/sin-room-release-evidence/`. Method recorded in JSON: Chromium headless, 777-assisted normal STORY entry, paused camera fixture. PC: 1920×1080, DPR 1, camera `(16,11)`. Mobile detail: CSS 390×844, DPR 3, camera `(21,10)`; this is viewport emulation, not a physical phone.

| Directly viewed PNG | SHA-256 |
| --- | --- |
| `after-ep1b06-pc.png` | `69581def8ddfb06abc709af52fa35407b136ec23a04fbfb4f6b42a473735341b` |
| `after-ep1b06-mobile-detail.png` | `d01cf82e75553e748b4260105e6afd6285b44b87175c3e4cc7ba88e49bce56a8` |
| `after-ep1b07-pc.png` | `547c1733c5eee7bf4aff58f63d6026c0eeebb0cc7a86f2731adb5f24bf46b22c` |

| Companion JSON | SHA-256 |
| --- | --- |
| `after-ep1b06-pc.json` | `8090d6eff72db7c22264204676c29e920882b8a0adb7c763bf6635cb109f05d1` |
| `after-ep1b06-mobile-detail.json` | `3e228794b8697a1219f4369fdd5d60058bb95e97dd65c3f67e2793624005cac1` |
| `after-ep1b07-pc.json` | `a3035c63b31011a23e6fe840524d2b4fb8d0e04c955ac8eaf859403c42a3a00d` |

Inspected source SHA-256:

- `r96/client-source/mammon-bossroom.js`: `c670125fb5a59964c0d987445743eb7ec3815e872aced96f34c7221b5b312a01`
- `r96/client-source/sin-room-art.js`: `70d190184818ff8118c8c5232038ea8a7c23a249c706971c09a3f65044305a67`
