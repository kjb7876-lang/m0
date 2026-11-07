# R104 existing-asset direction support — read-only follow-up

2026-11-06, `/workspace/m0-r375`, base latest main 54bbdf1. Parent reports contract issue270 approved/created; root remains sole implementer. This child made no repository edits or public writes. Earlier preflight issue blocker no longer applies.

## Recommendation

Do not claim that a generic flip or native-profile fallback solves every boss direction. R104 contains 45 sets of four front/down keyposes without direction metadata. There are useful existing alternatives for specific bosses/states, but no verified universal front/back fallback. Preserve already directional hospital/persona frames and fix only the measured final-frame orientation bugs in the current task. Any boss reposition behavior needs per-boss movement authorization and collision/telegraph tests; globally repositioning bosses is unsafe.

### Existing assets that are useful

- `dist00-boss` and `mb-ep1a07`: `portable.majorNativePresentation150` includes oct11-seven poses with explicit `bakedFacing:'right'` for idle, anticipation, strike and recover. Actual extracted sheets were visually inspected at `site/assets/boss-actions-20261011/{id}-poses.png`. Their strike extends to screen right and can be mirrored left. These are partial side-sector fallback candidates, not eight-direction assets. Existing R104 versions strike toward screen bottom. Seamless transition/body scale/phase correspondence must still be tested.
- `mb-ep1a08` in actual hospital context: HTML 8844–8854 chooses separate front/back groups from `assets/visual-test/hospital-boss-motion-r53.png`, 16 cells for melee and poison, with `bakedFacing:'eight-way'`, r53HospitalPose and a locked-angle flip. HTML 8886–8888 forwards this result into bossFrame/bossFlip. Preserve this fully authored branch. The boss appearing in the R104 inventory does not mean R104 owns its effective frame in every context.
- `drive-r281.js:23`–35 supplies right-authored six-frame movement only for `dist00-boss`, `mb-ep1a07`, `mb-dist02`; `walking()` explicitly excludes attack, ranged windup, hit and death. It cannot fix attack direction by itself.
- Native `mb-dist02` RC135 and `mb-ep1a11` RC140 sheets were visually inspected. Both show front/oblique poses, with no back-facing row. They do not close the missing backward-strike gap.
- R104 `dist00-boss-p2.webp` and `c104-boss-p2.webp` were visually inspected and are front/down compositions. Mirroring alone cannot create side/back body poses.

### Code-level facts and preservation boundaries

- `bosses-r104.js:1`–7 explicitly describes screen-bottom strike keyposes. Line 18 freezes new frames with crop/pivot/height but no bakedFacing. This is an asset limitation, not a reason to invent metadata.
- Line 12 limits nine boss sets to selected phase indices. Other sets have no phase filter. Do not pick a fallback of the wrong transformed form.
- Lines 28–40 patch getters on existing native/profile frame objects. Lines 44–45 can also replace images through readyImage for actor-normalized/actors-v3 paths or the current body path. A frameFor-only fallback can therefore still resolve to an R104 image; test the actual final image.
- `setEnabled` (line 52) persists localStorage. Do not toggle it during rendering as a supposedly temporary bypass.
- Native rows exist for 33 of the 45 IDs; only the two oct11-seven rows explicitly carry left/right orientation metadata. Missing rows are not proof no art exists: Balrog, main-boss phases and cult forms have separate native routes.
- Balrog's native state-specific metadata differs (idle right, strike left), so one monster-level orientation default is insufficient. Persona/eight-way, R53, R54 and R61 owners must keep effective frame precedence.

### If a partial native fallback is desired

A small explicit, optional per-draw predicate in R104.allowed(e), defaulting to existing behavior, is safer than spoofing nativeId, replacing global readyImage, changing player coordinates, or persisting enabled state. Its scope should be a reviewed whitelist of correct phase/state/asset pairs, initially only the two side-frame candidates. Select the fallback from the committed attack angle and keep the selection stable through recovery. Otherwise player crossing the vertical threshold causes body artwork to switch midattack. Preserve original asset shape/pivot/scale and require the chosen image to be loaded before enabling fallback. This requires a source hook in R104 and explicit allowed_paths ownership; it is not proposed as an unapproved edit.

This partial fallback does not satisfy all directions and may introduce art transitions from six-frame R281 walking to older native attack sheets. Do not add it solely to make an automated flip check pass.

### If future boss positioning is considered

- Whitelist mobile melee bosses only after checking their authored behavior. Exclude stationary/turret/tower/objective actors and root/column/throne arena actors where moving changes encounter semantics. R230 line 19 currently excludes bosses, midbosses, personas and stationary actors deliberately.
- Operate before a fresh attack plan and before any origin/target snapshot or telegraph creation. Block movement while attack, rangedWindup, tell/windup, casting/cast, R54.clock, active owner hazards or phase-transition actions exist. Never reposition in draw code or after commitment.
- The native `canPrepare` entry is also called by strike validation and ranged release. It is not inherently a once-only preparation callback.
- If a pre-admission reposition moves the actor, return false for that admission and let the next native tick recompute distance and clearLine at the new location. At HTML 1128–1129 distance/clearLine are evaluated before canPrepare. Returning true immediately after moving can use stale admission checks.
- Choose positions where the player's projected vector falls within the authored front/down or side sector. Verify full actor radius, connected path and swept movement, closed doors, bounds and destination crowding; point-clear destination alone is inadequate. Keep maximum distance/cooldown and a visible existing movement cue.
- If no valid position exists, do not loop indefinitely or forcibly move through a door. Preserve the existing readable telegraph and report the unsupported body pose; otherwise a visual fix can softlock the fight.
- Boss fans, beams, radial volleys and fixed arena hazards have intentional direction/origin semantics. Do not rotate every projectile toward the player or retarget an already committed warning.

## Required validation before an all-direction claim

For each actual frame owner and each active phase: player in all eight projected sectors, idle/move/windup/contact/recovery/ranged-release states, crossing during windup, room edges and closed doors. Record actual image path, source crop, bakedFacing, final flip, R53/R54 markers, locked angle and geometry origin. Test both STORY and DREAM effective encounters; do not infer dream support from the R104 inventory alone. Capture PC/mobile gameplay, ensure body-only transforms, and run the repository's seven-field visual review. Static source/metadata checks and this small sample of sheet inspections cannot establish all-boss graphics correctness.

## Direction-limited replacement inventory

The following is the complete R104 replacement inventory, not a claim that every runtime encounter uses R104 exclusively. “Unspecified” means the native row lacks bakedFacing metadata; it does not prove a particular visual direction. All R104 replacement frames lack direction metadata. The JSON sibling also records exact strike paths/frame metadata. Phase values come from R104.PHASES; “all” means no R104 phase filter.

| ID | R104 active phases | Native pose metadata | Known alternative / limit |
|---|---|---|---|
| dist06-boss | all | separate native route | No verified back/up source in R104; native direction not certified |
| mb-dist02 | all | RC135 / unspecified | Native sheet visually inspected: front/oblique poses, no back view |
| a11-boss | 0 | separate native route | No verified back/up source in R104; native direction not certified |
| mb-ep1a11 | all | RC140 / unspecified | Native sheet visually inspected: front/oblique poses, no back view |
| mb-dist01 | all | RC135 / unspecified | No verified back/up source in R104; native direction not certified |
| dist00-boss | all | oct11-seven / right | Visually inspected native right-side strike; left via mirror; no back view |
| mb-dist03 | all | RC135 / unspecified | No verified back/up source in R104; native direction not certified |
| mb-dist04 | all | RC135 / unspecified | No verified back/up source in R104; native direction not certified |
| mb-dist05 | all | RC135 / unspecified | No verified back/up source in R104; native direction not certified |
| mb-dist06 | all | RC135 / unspecified | No verified back/up source in R104; native direction not certified |
| mb-ep1a07 | all | oct11-seven / right | Visually inspected native right-side strike; left via mirror; no back view |
| mb-ep1a08 | all | RC140 / unspecified | Hospital R53 front/back + mirror supported, preserve effective R53 frame; R104 fallback remains limited |
| mb-ep1a10 | all | RC140 / unspecified | No verified back/up source in R104; native direction not certified |
| b02-boss | 0,1 | separate native route | No verified back/up source in R104; native direction not certified |
| b06b-boss | 0 | separate native route | No verified back/up source in R104; native direction not certified |
| b07-boss | 0 | separate native route | No verified back/up source in R104; native direction not certified |
| b08-boss | 0,1 | separate native route | No verified back/up source in R104; native direction not certified |
| mb-ep1b01 | all | RC140 / unspecified | No verified back/up source in R104; native direction not certified |
| mb-ep1b02 | all | RC140 / unspecified | No verified back/up source in R104; native direction not certified |
| mb-ep1b04 | all | RC140 / unspecified | No verified back/up source in R104; native direction not certified |
| mb-ep1b05 | all | RC140 / unspecified | No verified back/up source in R104; native direction not certified |
| mb-ep1b06 | all | RC140 / unspecified | No verified back/up source in R104; native direction not certified |
| mb-ep1b06b | all | RC140 / unspecified | No verified back/up source in R104; native direction not certified |
| mb-ep1b07 | all | RC140 / unspecified | No verified back/up source in R104; native direction not certified |
| b04-boss | 2 | separate native route | No verified back/up source in R104; native direction not certified |
| b06-boss | 0,1 | separate native route | No verified back/up source in R104; native direction not certified |
| b09-boss | 1,2 | separate native route | No verified back/up source in R104; native direction not certified |
| l301-boss | all | separate native route | No verified back/up source in R104; native direction not certified |
| mb-ep1b03 | all | RC140 / unspecified | No verified back/up source in R104; native direction not certified |
| mb-ep1b08 | all | RC140 / unspecified | No verified back/up source in R104; native direction not certified |
| mb-ep1b09 | all | RC140 / unspecified | No verified back/up source in R104; native direction not certified |
| mb-last302-v31231 | all | RC140 / unspecified | No verified back/up source in R104; native direction not certified |
| u201-mid | all | RC140 / unspecified | No verified back/up source in R104; native direction not certified |
| u202-mid | all | RC140 / unspecified | No verified back/up source in R104; native direction not certified |
| u204-mid | all | RC140 / unspecified | No verified back/up source in R104; native direction not certified |
| u205-mid | all | RC140 / unspecified | No verified back/up source in R104; native direction not certified |
| mb-hando01 | all | RC140 / unspecified | No verified back/up source in R104; native direction not certified |
| mb-hando02 | all | RC140 / unspecified | No verified back/up source in R104; native direction not certified |
| h103-boss | all | separate native route | No verified back/up source in R104; native direction not certified |
| mb-hando03 | all | RC140 / unspecified | No verified back/up source in R104; native direction not certified |
| mb-murder01 | all | RC140 / unspecified | No verified back/up source in R104; native direction not certified |
| mb-murder02 | all | RC140 / unspecified | No verified back/up source in R104; native direction not certified |
| murder04-mid | all | RC140 / unspecified | No verified back/up source in R104; native direction not certified |
| mb-murder03 | all | RC140 / unspecified | No verified back/up source in R104; native direction not certified |
| c104-boss | 0,1,2,3 | separate native route | R104 strike visually inspected: front/down; phases 0-3 overridden |
