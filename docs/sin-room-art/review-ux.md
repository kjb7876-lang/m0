# Dedicated furniture — independent UX / level review

**Score: 8.0 / 10, provisional headless assessment.** Reviewed candidate 3 on 2026-11-07; runtime manifest `78ab31f9eb61309bd30e03e3e28e1e658ed9dbb29d2101e40d3e0825b29247a9`. Candidate 2 is not scored as passing. This report is solely UX/level review under `storyworld-art-style` section 8; it is not an aggregate seven-field verdict or final graphics/device approval.

## Scope and evidence

Independently opened seven final PC images, seven central portrait-mobile images, and ep1b03/06 mobile-detail images at the paths and SHA-256 hashes below. Read the theme specification in `implementation.md`, `sin-room-art.js`, and CPU evidence. The six changed rooms have four dedicated generated furniture items each; ep1b08 is the preserved control room. The standard mobile views matter more to this score than the detail views. No source, asset, network or gameplay mutation was performed by this reviewer.

The bright central hero remains identifiable in all seven standard views, and the new furniture sits outside the main central combat floor. Actual door faces remain distinguishable from furniture, with visible approach floor. The kitchen, domestic rooms, bar, office and burned dining room now have useful distinct landmarks. Visible furniture bases in these final views provide substantially clearer obstacle silhouettes than a cropped object would. The score concerns the final images, without re-diagnosing the archived candidates.

## Room observations

| Room | UX/level observation | Remaining concern |
| --- | --- | --- |
| ep1b02, sloth | Sofa, CRT, fridge and bed form a clear domestic perimeter; hero has open floor in front. | Sofa is large relative to the hero and dominates the mobile upper half. Original candle table in front makes its near edge busier. Side bed/fridge require camera movement. |
| ep1b03, envy | Pale settee, mirror and photo console contrast well with the dark floor; hero remains visible in both mobile cameras. | Bright furniture competes for attention with the hero. Portraits and mirror invite examination although they are decorative. The under-console gap should not imply a traversable opening. |
| ep1b04, gluttony | Preparation counter, range and food refrigerator communicate a professional kitchen. Their feet and front faces make solid obstacles readable. | Food and storage doors can imply pickups/use. Existing lamps and debris still interrupt the center visually; this review does not claim comfortable combat from an empty-floor reading alone. |
| ep1b05, lust | Rounded bar and separate liquor cabinet read as furniture rather than extra doorways; central hero and approach floor remain visible. | Existing square braziers remain visually prominent around the hero, and the small portrait viewport cannot show the left booth and right cabinet together. |
| ep1b06, Mammon | Executive desk, leather chair, filing unit and cash trolley add an office identity while retaining the brass doors and open center. Detail view shows hero clearly in front of safe/chair. | Papers, money and safe strongly suggest interaction. The retained safe has a simpler visual treatment but still reads as an obstacle; no new gameplay promise should be inferred from its appearance. |
| ep1b07, arsonist | Dining table and damaged seating now distinguish the room much more clearly than generic brown benches. Hero remains visible against the dark floor. | Static painted flame on furniture resembles a small hazard signal. It must remain differentiated from actual moving attack cues; this cannot be settled in paused captures. Fallen chairs may imply smaller passable gaps than the solid collision envelope allows. |
| ep1b08, pride control | Existing console/couch/pillars remain readable with the hero in open floor. | Existing pillars partially interrupt door approach visibility, particularly in portrait. This is not a regression attributed to the new six-room art. |

## Priority follow-up and limits

1. **Moving-player boundary check:** walk around the sofa ends, fallen chairs, bed and console legs, and approach the wall-side props from both sides. Solid collision envelopes need to agree with the perceived furniture footprint. The source has hero-overlap fading, but central/detail captures do not exercise every behind-furniture position, fade transition or draw-order crossing.
2. **Interaction expectations:** generated documents, plated food, photos, drinks and cash remain explicitly noninteractive in source. There is no new interaction marker in the reviewed images. A natural player may still inspect them; preserve scope rather than inventing rewards or narrative interactions to justify the decoration.
3. **Mobile route discovery:** central portrait crops keep the hero readable, but left-edge doors are partial and many side props are offscreen. The detail cameras reveal selected side furniture, not an actual camera-travel test. DPR3 screenshots are not proof of readability at physical phone size, thumb occlusion, touch targeting or landscape layout.
4. **Combat signals:** the dark, restrained room palette leaves a useful bright hero silhouette. Warm lamps and bar lighting support environmental reading; static orange fire in ep1b07 is the main potential ambiguity between decoration and danger. Apply silhouette priority and restrained threat color while checking an actual attack sequence. Existing candles/braziers are outside this furniture revision.

No newly blocking door/floor issue is visible in the supplied static views. That observation is narrower than collision or natural-play approval. Natural boss completion, live dodge/projectile visibility, open-door transition animation, camera movement, physical GPU/mobile performance, and legacy renderer behavior remain unverified by this reviewer. Gray placeholder-like figures in some screenshots further limit judgments about complete encounter presentation.

## CPU evidence boundary

Read `r96/qa/sin-room-art/asset-results.json`, `r96/qa/sin-room-art/runtime-results.json` and `r96/qa/seven-sins/runtime-results.json`. The two final runtime files identify the same `78ab31f9…` manifest. They record assisted native-VM state/restore, authored props, physics and recording checks; the room-art scope explicitly describes mocked image/GPU handling and an explicitly called pre-render correction. These are supplied engineering evidence, not checks executed independently by this UX reviewer. Their result does not establish natural navigation or GPU pixels; the actual final screenshots are the visual evidence for this report.

## Inspected files and SHA-256

Screenshot names below are under `/workspace/sin-room-art-evidence/`; repository paths are under `/workspace/m0-mammon/`. Hashes identify the exact evidence snapshot, not future regeneration.

| File | SHA-256 |
| --- | --- |
| `r96/client-source/sin-room-art.js` | `70d190184818ff8118c8c5232038ea8a7c23a249c706971c09a3f65044305a67` |
| `docs/sin-room-art/implementation.md` | `234357f1265d0cc230075182a0cfb6b3e8364dba546a73afd6511d4ccf9694de` |
| `r96/qa/sin-room-art/asset-results.json` | `32e65deb76a0504c4c64f8fa476f90e62c292ed3504ec92ef2ccc38e1b219d28` |
| `r96/qa/sin-room-art/runtime-results.json` | `fbd0c308ed9a73debbacf5081c7c0e7fa7edcc0328d5b7a6edd34e8e73c3a2b9` |
| `r96/qa/seven-sins/runtime-results.json` | `7e0e8bf0fd3fe2e5d8e4c944bf57de11ba8d6490fb4df2d484c656cf2dbd7026` |
| `after-ep1b02-pc.png` | `04f3951152272915d1bc4e602c465326caf2013065b0e1567174afb56cac3f64` |
| `after-ep1b02-mobile.png` | `09de5c14d9ff7a54f21e5cb5ab8a0af5afea0d460d7aead86edb1239f9fe0c52` |
| `after-ep1b03-pc.png` | `6b6ad8532773930962493c8856d475944284319ed3f384f5db605775c7c61ca2` |
| `after-ep1b03-mobile.png` | `9411eb1e4079ced8a4c504ea153ca813ee05eb51feebb775241a2f1dd9851f4f` |
| `after-ep1b04-pc.png` | `f91665a5feb4985f8da6d8e80017a561e6bea4c10a5d68dfa8e8efa00b184550` |
| `after-ep1b04-mobile.png` | `8a041fef1a5c5dce09642352d83c01b13e2646329fdeb7ced53ab3927c8779e2` |
| `after-ep1b05-pc.png` | `fa6e4eb5ab868fbd2169af67328ee0ab5e72f62f2f7eb82d17d6fbe868a29930` |
| `after-ep1b05-mobile.png` | `38ca756c0d1caa56f1427d2dfef21af9c167b9d661aeacb0eca55026e8860fdd` |
| `after-ep1b06-pc.png` | `4145ebd89cf24aa63b7283447534a8b7ca6a4438bfc5d69e6555c9f36d9c3f17` |
| `after-ep1b06-mobile.png` | `6d72b113fca4b23d4363de81e497365930d2bea8320e30b7459aa608b4449fd0` |
| `after-ep1b07-pc.png` | `3ff794fb094f9f161397d711aae8a81a96c7bf9b2cb8d91c89870fdb196b122f` |
| `after-ep1b07-mobile.png` | `3b6ae03144b8e090ad1d9bec7b15cf2cd3f4531d33ae6cbc7dd8cc5267086cca` |
| `after-ep1b08-pc.png` | `98d26640115767796d636d70247e24ac760a8e308fbdb34f6af6f8999f5b2d40` |
| `after-ep1b08-mobile.png` | `1a2b2bb4d938f0216e8142f7e73f7bae7c9f56580a87ad35e131c4770c62b531` |
| `after-ep1b03-mobile-detail.png` | `6e997f64cb81627395c96044528eefd71deb9d79ebcf9558910e23a1d3a26913` |
| `after-ep1b06-mobile-detail.png` | `b708c92108da06881c878e3f97d1bb52c6114981afe15fb5e3974dd087818088` |
