# Seven-sin boss rooms — animation/VFX review

Date: 2026-11-07. Role: independent animation/VFX director. Scope: static integration only.

**Provisional score: 8.0/10 for observed static integration.** This is not an animation-quality or physical-GPU performance score. No new animations or dynamic VFX were found in the reviewed six-theme overlay. Seven rooms were inspected in the final PC and mobile-detail screenshots, including the separately implemented Mammon room.

## Evidence and method

Visually inspected all 14 final images listed below, rather than the rejected initial capture folder. Read `r96/client-source/seven-sins-bossrooms.js` and performed a read-only in-memory count of its generated detail plans. No implementation was edited and no independent interactive runtime test was performed by this reviewer.

The inspected ep1b02 mobile metadata describes headless Chromium, 777-assisted normal STORY entry, a paused camera fixture at (21,10), viewport 390 × 844 and device scale factor 3. Its reported page/game/resource errors are empty. These are capture conditions, not physical-device evidence. The final PC image is 1920 × 1080. Single paused views cannot establish attack readability throughout a fight.

## Observed integration

| Room | Observed PC/mobile result | VFX implication / remaining concern |
| --- | --- | --- |
| ep1b02 | Sofa, fridge and paperwork remain peripheral; central hero remains visible. | Existing candle console visually crowds the fridge; moving particles behind tall furniture remain untested. |
| ep1b03 | Photo console, mirror and cabinet frame an open center. | Mirror is static geometry, not a new dynamic reflection effect. Existing foreground candles remain visual clutter. |
| ep1b04 | Plate counter, stove and waste counter sit outside the main central area. | Plate cylinders add detail without luminous effects; foreground lamps could overlap action from some positions. |
| ep1b05 | Curtain stage and red seats stay at room edges. | Static dull red surfaces do not dominate the shown hero; red attack telegraphs against them require live combat review. Existing braziers add overlapping accents. |
| ep1b06 | Mammon desk/cash, safe and cabinet are visible in final captures; center is open. | Tall safe can hide actors or effects moving behind it. This separate overlay was not included in the six-theme geometry counts below. |
| ep1b07 | Burnt bench, trolley and cabinet leave room for the central hero. | Static nonemissive props do not visibly overwhelm existing fire. Existing flaming statue/candles still clutter the perimeter. |
| ep1b08 | Consoles, couch and cabinet are peripheral; PC center is readable. | Mobile hero overlaps an existing gray figure beside the couch; attribution to the new overlay is not established. Console monitors are static, with no additional blinking VFX. |

No new furniture visibly covers the central hero in the sampled PC views. This does not prove correct occlusion at every camera angle or during attacks. Existing foreground objects and entities remain the larger observed readability concern; furniture close to them deserves a moving combat pass.

## Static render budget and lifecycle

The six-theme source creates individual meshes while sharing matching geometries within the active room. Counts below cover overlay detail meshes only; they are not whole-scene draw-call or frame-time measurements.

| Room | Detail meshes | Cylinders | Unique geometry keys | Used material names |
| --- | ---: | ---: | ---: | ---: |
| ep1b02 | 51 | 12 | 24 | 10 |
| ep1b03 | 43 | 0 | 17 | 8 |
| ep1b04 | 62 | 36 | 20 | 7 |
| ep1b05 | 58 | 0 | 13 | 4 |
| ep1b07 | 46 | 6 | 20 | 6 |
| ep1b08 | 78 | 0 | 24 | 8 |

Geometry sharing limits duplicate buffers, but meshes are not instanced or merged; the monitor room and kitchen are the strongest candidates for additional submission overhead. The source allocates a 14-material palette per active room even when fewer names are used. These are bounded costs, not evidence of a measured performance failure.

The overlay builds on scene/layout changes, rather than rebuilding detail geometry every frame. There is no added per-frame VFX simulation; the 500 ms interval installs the renderer wrapper. Materials, geometries and the canvas texture are tracked for disposal. Same-generation release removes the group and disposes registered resources. Across scene-generation changes, cleanup relies on the engine's scene lifecycle. Asynchronous texture completion checks the generation, disposed state and current group before applying its result. These are sensible source-level safeguards; repeated entry/exit memory stability has not been independently measured here.

The 2D fallback uses simple footprint rendering, not the same detailed models. This review does not certify fallback visual parity.

## Unverified scope and next checks

Animation timing, anticipation, hit response, door motion, moving camera depth behavior, attack-particle occlusion and telegraph contrast during an unpaused boss fight remain unverified. Screenshots do not establish sustained FPS, physical mobile GPU behavior, shader compilation cost or memory recovery over repeated transitions. Live PC and actual-device combat checks are needed before claiming those results. No blocking static VFX integration defect is established by the viewed captures; the score remains provisional pending those checks.

## SHA-256 of reviewed files

Screenshots are under `/workspace/seven-sins-evidence/`; source is relative to `/workspace/m0-mammon/`.

| File | SHA-256 |
| --- | --- |
| `r96/client-source/seven-sins-bossrooms.js` | `08dbc150eac4b0b32be79f26728776eacd95e136c77717391bb9e60f93fcb9aa` |
| `after-ep1b02-pc.png` | `9f385aaf28ac22cf2bd7975a650ceebf98b7acf0d57c64b6f0cc58e81c80c169` |
| `after-ep1b02-mobile-detail.png` | `d918700dbf17232a90588e8e7b4563a37f70f733faa0f63c3e19db427c91dc9a` |
| `after-ep1b03-pc.png` | `3eb45ac3ced418d107d56a7138cc294c0802d50afc62374de6fff09c056c651b` |
| `after-ep1b03-mobile-detail.png` | `157405a29f8abc41a8e1738230092544043e45cfa0ea673cd59307d72f90d641` |
| `after-ep1b04-pc.png` | `0fb38959bf61752402da4d2d759ba46ffa8f51e56f79e536b37327b375887248` |
| `after-ep1b04-mobile-detail.png` | `650a3e53b59ada1bbe50d829777cfb9d23654f1bfe9f90ad7bd8500d42240a4f` |
| `after-ep1b05-pc.png` | `f88ed825f8fe64c9052497174ba25fc0deca69766268a5302cab1af6cc7a99c9` |
| `after-ep1b05-mobile-detail.png` | `9036703fdb3a918410f5725e8f95dae425df11961b28f6060be268d23a493a04` |
| `after-ep1b06-pc.png` | `e8d7fc511c4afd45185fafef9895b8557ca26ebd452c44a9a0375da6b3581413` |
| `after-ep1b06-mobile-detail.png` | `2ab45f0c315f3104677d9c8a76c8b06d81fa13a952950a516782650469d2362e` |
| `after-ep1b07-pc.png` | `9e4119f1026e5347b5eb5f74f90ae711181bfa014f78a4490f5ad5aa7c816608` |
| `after-ep1b07-mobile-detail.png` | `89f2b57edb62db4af29596c943d0a70812bbccd0377c55090cde840dea224d81` |
| `after-ep1b08-pc.png` | `de02b50bc98ef024d44ecd384c1af36094486e77ba1df9f4fc76cac0c7a317e0` |
| `after-ep1b08-mobile-detail.png` | `4183147f6aa9188ef61652591499286e8382041a24261fefb7e325bee0d77e30` |
