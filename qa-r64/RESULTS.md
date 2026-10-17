# StoryWorld R64 candidate verification

Date: 2026-10-17
Base: `origin/main` `03675216dc8deae223e7e9f1ba798942d197f048`
Branch: `work/storyworld-r64-reward-aura-ui`
Live deployment reference: `3407b7a53c921b8677cf59c8d2fbfa4493149418`

## Difficulty values

Measured R63 starting HP was 25,686 for the `dist00` boss and 1,140 for a common patrol. The live R63 retention factors in code were 0.4 / 0.5 / 0.8. R64 keeps the later requested half-retention targets 0.2 / 0.25 / 0.4. Switching tiers and applying them repeatedly does not compound the values; save restoration returns to the saved tier.

| Tier | R63 factor | R63 boss / common HP | R64 factor | R64 boss / common HP | Incoming enemy damage | First-clear points |
|---|---:|---:|---:|---:|---:|---:|
| Easy | 0.40 | 10,274.4 / 456 | 0.20 | 5,137.2 / 228 | 0.40× | 1 |
| Normal | 0.50 | 12,843 / 570 | 0.25 | 6,421.5 / 285 | 1.00× | 3 |
| Hard | 0.80 | 20,548.8 / 912 | 0.40 | 10,274.4 / 456 | 1.20× | 7 |

The older 0.9 / 1.4 / 2.1 values remain identified as legacy configuration, not the measured live factors. The 1/3/7 first-clear point rewards and duplicate-clear guard remain intact. No new enemy kill-drop reward system was added.

## Aura and co-op client behavior

The Thread Dance aura emits no draw commands at rank 0 and six silver/white commands at rank 1. It is hidden when the owner is dead or visual effects are disabled. Existing hit, target, damage, and semi-automatic rules remain unchanged; the existing rank damage formula is still used. Save/load, passive reset, region change, death/revival, and a local host/guest simulation were checked.

The local two-page simulation created six scaled enemy replicas. It verified 6,421.5 / 285 normal HP on replicas before and after co-op save/load, preserved host/guest ranks, and showed the aura only on the owning host. The R62 snapshot protocol stayed `version: 1, build: R62`. This did not connect to a relay or external network.

## UI verification

Chromium 151 browser regression completed with no page errors. At 1365×888 desktop, the playfield ended at y=736, the notice shelf occupied y=736–774, and the footer began at y=774. At 1280×720, the shelf occupied y=568–606. Mobile portrait 390×844 used y=806–844; landscape 844×390 used y=352–390. The 44×44 settings control and a canvas touch event were checked, alongside settings, resize, orientation change, map change, save/load, and death/revival.

## Performance profile

Same scripted scene: fresh browser profile, `dist00` STORY, player at (15,19), six enemies, `room.engaged=true`, 2.5 s warmup, 60 s measurement. Chromium ran with a software/emulated renderer in the execution container; these are not physical-device or GPU results.

| Metric | Base main | R64 final candidate |
|---|---:|---:|
| Mean frame interval | 178.99 ms | 198.12 ms |
| Median | 183.30 ms | 200.00 ms |
| P95 | 216.60 ms | 249.90 ms |
| Approx. FPS | 5.59 | 5.05 |
| Script duration | 5,010 ms | 4,677 ms |
| End JS heap | 53.07 MB | 50.05 MB |
| Layout count | 335 | 305 |

The renderer no longer builds a JSON string signature for every captured draw command; style and geometry comparisons use compact value snapshots and update image filters only when their values change. The signature sample (173 ms in the baseline profile) disappeared, script duration fell by about 6.7%, and end heap was about 3.0 MB lower. Frame interval metrics were worse in this software-renderer run, so this is not a demonstrated end-to-end frame-rate improvement. No effects were removed and resolution was not reduced.

Profile details: `profile-baseline.json`, `profile-final.json`; browser regression: `candidate-regression.json`; local co-op simulation: `coop-regression.json`.

## Runtime package and remaining verification

`unpack-runtime-r62.py` rebuilt and hash-verified all 1,906 runtime files (1,908 total site files); media assets, hospital geometry, doors, floors, and projection backup files were not edited. Render settings and relay deployment were not changed.

Not tested: physical mobile devices, physical GPU, or external relay/network behavior. The supplied reference image was not available as a local file in this execution environment, so the aura follows the written silver-thread description. Previously reported story voice assignments (54 missing) and dialogue mismatches (35) are unchanged and are not claimed as fixed.

The candidate is local to this branch. It has not been pushed to GitHub, merged into `main`, or publicly redeployed.
