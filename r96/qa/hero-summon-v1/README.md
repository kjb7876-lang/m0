# SW-0027 official browser gate (private candidate, not run)

New QA-only directory for independently replayed phases 01–10 on pinned StoryWorld main. The game-facing gate asserts the built/served R1302 bytes against phase 10 SHA-256. If reviewed bytes change, explicitly pass the newly reviewed exact SHA as SW0027_R1302_SHA.

## CI review integration (proposal only)

Use the existing Pages browser job's verified runtime restore, Playwright 1.56.0 pinned Chromium, sandbox, and its loopback static server serving /m0/. Once custody and repository scope clear, append this command to the existing fail-closed browser matrix and retain raw report and PNGs even for a failing case:

    SW_URL="$STORYWORLD_URL" SW0027_OUTPUT="$RUNNER_TEMP/sw0027-browser" \
      timeout 720 node r96/qa/hero-summon-v1/browser.mjs

No workflow, asset or default game source was modified by this QA artifact. Independent visual review and exact public Pages hash verification would remain separate mandatory gates.

## Observations and the limits of fixtures

- Actual r444 boot (including its scripted 777 setup), disposable isolated profile, actual dist00 hostile, actual A-key attack, native 3D opt-in and 2D fallback via existing setting, real Three mesh/texture/opacity and separate same-frame native nonblank WebGL PNG. Environment/hostile movement and ambient enemy damage may be neutralized in the disposable fixture; it does not generate enemies or write target HP to fabricate a strike.
- Desktop 960x540 at 64px and compact 390x844 at 96px request native actor-height fixture zoom. Must observe requested size. Software GPU and controlled zoom are not physical mobile or natural camera behavior; camera control is an integration risk until the first actual run.
- 3D checks one visible matching primary tint, actual six-index/two-triangle idle geometry, no held weapon, and movement no greater than 0.15 tile before the controlled walking trial. Geometry/known tint are not the perceived count, which must be reviewed from the screenshot.
- Ranged needs an actual caster-side stamped native projectile launch and separate actual target hit in the clear-floor fixture. Melee links the actual selected enemy positive damage to a native anchor 0.38 tile toward the caster. In the explicit negative, one otherwise ordinary A-key temporarily uses a substituted no-shot factory to reproduce an attack pose without projectile receipt; this is a branch-entry check, not an estimate of natural occurrence.
- Movement-assisted return invokes actual game moveActor collision on native elapsed time at the nominal walking speed, not a fake summon state. Verify fixed anchor prior to 2.4/4.7 threshold, then one walkable return with the same action receipt, no duplicate damage and no reset of the combat input. A short real return animation is allowed before cleanup.
- Save and load are on a fresh disposable slot only. Observe native save/load and actual scene change, and do not confuse a healthy new idle shoulder orb in a new room with a stale old echo or old-event serial. Existing 2D mode keeps a real textured actor row and has no 3D orb or echo.
- Focused cases use Seoha and Hwando, not all-ten visual certification. Keep the inherited ten-hero R1305/browser regressions, clone coverage, official CI and an independent visual review. No images or browser result yet exist.

## Screenshot annotation checklist (pending)

Keep raw official screenshots unchanged. Annotate separate metadata: actor/viewport/observed height, exact served SHA, one clearly dominant matching shoulder orb, no visible weapon geometry, clean caster/creature separation, target/shot alignment, original fixed position and same-action one-return recovery, clean 2D fallback. Use actual 64/96 frames; compare report timing and visible receipt geometry. A score may be issued only after seeing real screenshots. PNGs alone do not prove natural pathing.

Verified only node --check browser.mjs and node browser.mjs --list locally; --list exits before importing Playwright. Earlier permitted stock Chromium health failed at singleton POSIX socket. This phase did not relaunch, bypass or reroute.
