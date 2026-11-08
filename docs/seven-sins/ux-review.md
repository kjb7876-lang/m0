# Seven sins independent UX / level review

Reviewed 2026-11-07. Scope: readability, navigation, combat-floor composition, door visibility, and decorative/interactable distinction. **Provisional score: 7.9 / 10.** This is a review of supplied headless browser captures and source, not natural boss completion, physical-device validation, or release approval.

## Evidence and result

I inspected all seven final PC captures and all seven central mobile captures listed below, plus `r96/client-source/seven-sins-bossrooms.js` and `docs/seven-sins/implementation.md`. PC captures show the overall room; portrait mobile captures expose cropping and central readability. The assisted, paused fixture and fixed camera do not establish combat pacing, touch ergonomics, or visibility while moving. Enlarged DPR images also do not establish physical-size readability.

The perimeter furniture leaves the central fighting area visually open in all seven rooms. Furniture does not visibly cover the door faces in these captures. Distinct north-wall silhouettes give useful room landmarks without adding new screen UI. The final ep1b05 curtain stage and ep1b08 monitor console are visible; the previously described geometry occlusion is not visible in this evidence. Existing candles, braziers, and ep1b08 pillars still contribute local clutter and occlusion; they are not new defects introduced by the furniture overlay.

| Room | Score / 10 | Observed UX result and limitation |
| --- | ---: | --- |
| ep1b02 — sloth | 8.0 | Sofa is a clear landmark, with unobstructed central floor. Refrigerator and side cabinet fall outside the central portrait crop; papers and bottles are secondary detail. |
| ep1b03 — envy | 7.9 | Repeated portraits give the north console a distinct identity. Mirror and side cabinet require camera movement on mobile. Portraits remain decorative, but could invite examination. |
| ep1b04 — gluttony | 8.1 | Plate counter reads clearly against the orange floor; hero remains easy to locate. Counter legs imply an under-table gap although the implementation blocks the furniture envelope. |
| ep1b05 — lust | 7.8 | Curtain stage and chairs establish a theater boundary while preserving the center. Dark curtains can initially resemble another passage; existing braziers compete with the stage in the narrow viewport. Raised base and wall placement help distinguish it from the actual door. |
| ep1b06 — Mammon | 8.0 | Brass doors and desk remain readable, with open central floor. Cash adds theme but can imply collectible loot; safe and side cabinet are outside the central mobile crop. |
| ep1b07 — wrath | 7.7 | Perimeter workbench maintains movement space. Burned details and small props have weak contrast and read as generic brown furniture at overview scale, reducing room identity. |
| ep1b08 — pride | 8.0 | Three monitor silhouettes are clear and no longer hidden by cave geometry. Original pillars interrupt the view near door approaches; monitors/keys can imply usable controls despite being scenery. |

## Remaining UX risks

1. **Interaction expectation:** cash bundles, documents, portraits, safe, and monitor controls plausibly invite pickup/examination. No new prompt or highlight is present, so they do not explicitly promise interaction, but a short unprompted player observation remains useful. Do not add rewards or new mechanics merely to resolve this review note.
2. **Collision expectation:** some tables visually have leg gaps while the source uses a solid rectangular collision envelope. This is normal furniture treatment at character scale, but corner sliding and attempted under-table movement need a moving-player check; screenshots cannot settle the perceived boundary.
3. **Mobile field of view:** doors are partly cropped at the left edge, side furniture is often offscreen, and existing light stands compete with small details. The central character and north-wall landmarks remain legible. These captures do not prove door discovery from every approach or touch controls under combat pressure.
4. **Natural combat and rendering:** no independent live dodge/projectile/boss completion, door transition, camera sweep, actual save restoration, physical-device frame rate, or legacy-renderer inspection was performed for this UX review. The gray figure visible in some captures is part of the fixture evidence and limits judgments about the finished encounter presentation.

The parent reports native collision checks, seven-room save restoration, and door BFS passing. Those are supporting engineering results supplied by the parent, not tests independently executed by this reviewer. BFS reachability does not establish comfortable dodging or naturally discoverable routes. No new blocking layout issue is visible in the supplied static views; provisional acceptance is limited to this evidence. Source and assets were not edited by this reviewer.

## SHA-256 evidence snapshot

Screenshot paths are relative to `/workspace/seven-sins-evidence/`; source/document paths are relative to `/workspace/m0-mammon/`. Only actually inspected screenshot variants are listed.

| File | SHA-256 |
| --- | --- |
| `r96/client-source/seven-sins-bossrooms.js` | `08dbc150eac4b0b32be79f26728776eacd95e136c77717391bb9e60f93fcb9aa` |
| `docs/seven-sins/implementation.md` | `2fc975e637ef9de0349ce35a3d21b87cdc40fc3017abcac637fcbef34c54ab05` |
| `after-ep1b02-pc.png` | `9f385aaf28ac22cf2bd7975a650ceebf98b7acf0d57c64b6f0cc58e81c80c169` |
| `after-ep1b02-mobile.png` | `a0b8b8fc78f2aa0a513431759aad0881c55d5344703924637679e3cf2b64c32a` |
| `after-ep1b03-pc.png` | `3eb45ac3ced418d107d56a7138cc294c0802d50afc62374de6fff09c056c651b` |
| `after-ep1b03-mobile.png` | `c2110b7739d57f01d364dc9744bb15f17d098dddbc2cd4a68af4cfbb149067ad` |
| `after-ep1b04-pc.png` | `0fb38959bf61752402da4d2d759ba46ffa8f51e56f79e536b37327b375887248` |
| `after-ep1b04-mobile.png` | `669dae45cff27ee3ba7c5e672c363d178f2669bc683ac11a435257d57b9815f2` |
| `after-ep1b05-pc.png` | `f88ed825f8fe64c9052497174ba25fc0deca69766268a5302cab1af6cc7a99c9` |
| `after-ep1b05-mobile.png` | `5dd663deab5473b659dcbcb7a2b014ac9f0d177069efa92cce2a807de925986c` |
| `after-ep1b06-pc.png` | `e8d7fc511c4afd45185fafef9895b8557ca26ebd452c44a9a0375da6b3581413` |
| `after-ep1b06-mobile.png` | `21db70de6101fc73cdc8087f2fcec3d028d514816b79c9a1d845e1169405e69b` |
| `after-ep1b07-pc.png` | `9e4119f1026e5347b5eb5f74f90ae711181bfa014f78a4490f5ad5aa7c816608` |
| `after-ep1b07-mobile.png` | `d984196f532eed6670e84daced3f570bb54492ecb6c7268f7d8f86df79ab24fe` |
| `after-ep1b08-pc.png` | `de02b50bc98ef024d44ecd384c1af36094486e77ba1df9f4fc76cac0c7a317e0` |
| `after-ep1b08-mobile.png` | `2de95e93ed6d37207d1b696ed5ff50bef8b03f8f4db952f2bea5a99cbd3fabc1` |
