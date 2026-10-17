# StoryWorld R65 Stage 2 performance verification

Date: 2026-10-17
Stage 1 deployment baseline: `b7890eaee8a13a624cf07e278116731da07938d5` (Pages workflow succeeded)
Stage 2 candidate HTML SHA-256: `5e6b401ce2ff867d14019661144ed655e9f2a17a3758f8bd8a201b7cb3a855e6` (unchanged)
Stage 2 candidate `dist/phase1.js` SHA-256: `c7b7a55b0615d92eb4dd2fb0a3d3e08b6d4173249f337af9bbc1a0ed16916e1e`

## Change

The profiled `RenderBridge.capture()` reused its viewport/settings objects and seen-key set, avoided building an empty event array on every frame, and updated retained render rows without deleting and recreating every property. This removes recurring allocation and property-shape churn from the render snapshot path. It does not change draw commands, effects, image assets, or resolution.

## Controlled profile

Three paired baseline/candidate runs in order `B,C,C,B,B,C`; fresh Chromium contexts, 2.5 second warmup and 15 second sample each, 1365×850 CSS pixels at DPR 1. Both pages used the same deployed R65 HTML and same exact scene: STORY `dist00`, player (15,19), six static enemies, six fixed burst effects and 216 visual commands. The modal paused simulation while drawing continued, so this measures the render path rather than live combat simulation.

Chromium 151 ran in the execution container's software/emulated renderer. No physical device or GPU timing was available.

| Metric | Deployed Stage 1 | Stage 2 candidate | Difference |
|---|---:|---:|---:|
| Mean requestAnimationFrame interval | 174.42 ms | 175.58 ms | +1.16 ms (+0.67%, slower) |
| Mean p50 interval | 172.27 ms | 177.77 ms | +5.50 ms (slower) |
| Mean p95 interval | 200.03 ms | 199.97 ms | −0.07 ms (effectively unchanged) |
| Mean FPS derived from intervals | 5.735 | 5.698 | −0.037 |
| ScriptDuration across each 15 s sample | 1,228.05 ms | 1,188.96 ms | −39.09 ms (−3.18%) |
| TaskDuration across each 15 s sample | 15,815.59 ms | 15,821.11 ms | +5.52 ms |
| Mean layout/style-recalc counts | 88.00 / 88.00 | 87.67 / 87.67 | effectively unchanged |
| Mean JS heap delta | +14.96 MiB | +19.10 MiB | noisy and not improved |

Frame interval pair deltas were −6.04 ms, +0.78 ms and +8.74 ms; two pairs were slower or near-flat. ScriptDuration pair deltas were +22.74 ms, −15.86 ms and −124.15 ms. This is a modest average reduction in measured JS execution, not a repeatable end-to-end frame-rate gain. Heap deltas were highly variable; they do not establish a memory reduction.

The software profile's largest repeatable named self-time entries were in the Three renderer (`getParameters`, `getProgram`, `needsUpdate`) rather than this small bridge adapter. Much of the measured frame interval is outside JavaScript execution in this software-renderer environment. The data does not establish a hardware-GPU result.

## Regression and delivery state

- Stage 2 browser regression passed with `pageErrors: []`.
- Mobile flashlight regression passed: ON/OFF visual difference remained about 67.43% of the same 780×1688 image; setting, mask, state label, save/load and touch stayed aligned.
- Local two-page host/guest simulation passed with no errors; six enemy replicas, authority rules and R62 protocol were unchanged. It did not connect to Render or separate external networks.
- CPU balance suite passed 6/6.
- Runtime reconstruction and static Pages path checks passed for 1,906 files; 276 audio range checks passed.
- Four same-candidate screenshots remain in this directory. Physical device, physical GPU and public relay gameplay were not tested.

The results support retaining the allocation cleanup as a small CPU-side optimization. They do not support claiming that overall lag or frame rate improved in this environment. Stage 2 publication is recorded separately after its Pages workflow completes.
