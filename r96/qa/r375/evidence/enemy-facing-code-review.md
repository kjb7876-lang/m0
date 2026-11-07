# R375 direction candidate independent review

Reviewed initial candidate `r96/client-source/enemy-facing-r375.js` (52 lines) and the optional hook inserted in `mob-unique-r248.js`. Read-only child review; no repository edits. Findings refer to the initial candidate before any root fixes.

## Findings

1. **P2 — Ignore the engine synthetic attack pose before selecting attack.angle.** Candidate line 10 accepts every finite attack.angle/elapsed. Runtime HTML line 2606 temporarily inserts `{elapsed:0,angle:0,committed:true,storyWorldPose5:true}` while rendering source action recovery. Native R54.clock explicitly ignores it (HTML line 9301). The new public angleFor returns 0 instead of a valid ranged clock angle PI in the equivalent VM fixture. Use the real-melee test `!attack.storyWorldPose5` and let native clock resolve the action. This does not require changing attack state.

2. **P2 — Save the initial deadband side.** Candidate line 23 returns fallback prior without inserting a WeakMap entry. When the first observed actor angle lies in the vertical band, the legacy base's live-player flip remains the fallback every frame. With an exactly vertical locked attack, calling flipFor with base fallbacks true then false produces `[true,false]`. Save the initially resolved prior even when the ray is inside the band (and define stable behavior when no angle exists). This makes the intended hysteresis independent of the old live-target calculation.

3. **Coverage gap, pre-existing — R109 legacy attack-strip path still retargets visually.** `mobs-r109.js:140`–142 overrides final R51.flip for STRIP_FACE entries using the current player's projected side, even if the frame has r54StoryPose. The new wrapper only recognizes r208Mob/r200Shade and the separate R248 direct-body hook. A legacy strip visible while R248/R208 is missing, disabled, not mapped, or loading retains the old mismatch. This is not a regression caused by R375, but an all-mob-complete claim would be inaccurate. Either add an explicitly reviewed legacy orientation hook or include this path in remaining work. R104 front/back asset limits are a separate remaining issue.

## Checks executed on actual candidate source via Node VM

- Real melee angle PI stays left while the current player is right: pass.
- R54 ranged clock angle 0 stays right while current player is left: pass.
- R208 indexed left-authored row reverses flip parity correctly: pass.
- Unmarked R53HospitalPose, R54StoryPose, R61ActionFrame and R74Monster frames delegate to the original flip: pass.
- Repeated install() keeps the same function; spread preserves other API methods and __r208 marker: pass.
- Synthetic attack placeholder test: failed as described above.
- Fresh vertical deadband stability test: failed as described above.

No candidate code mutates attack targets, origin/footprint, projectiles, action clocks, timers or persistent save fields. The R248 hook runs before its body-only ctx.scale and does not mirror UI. The source-level probes do not establish browser visuals or GPU/device performance.

## Installation consideration

The wrapper is idempotent when it is outermost. It installs immediately and at DOMContentLoaded only. Register it after R208/R109 and other synchronous R51 wrappers. If loaded before a later wrapper which short-circuits without calling its base, R375 will not own the final flip until explicitly reinstalled. Its own marker is function-level, so copying the API preserves native markers without falsely declaring an unrelated outer wrapper to be R375. Normal final registration order should resolve this; verify the built HTML and final installed status.

## Follow-up review after root fixes

The first two P2 findings are resolved: synthetic storyWorldPose5 is excluded from the real-melee angle branch, and side() stores the initial fallback before the no-angle/deadband returns. R109 now exposes its existing STRIP_FACE classification through authoredFacing; R375 applies the same committed-angle correction to those known strips while retaining major, hospital and eight-way exclusions. R248 remains a body-only hook. No additional blocking defect was found within this narrow source scope.

Re-ran `node r96/qa/r375/enemy-facing-cpu-check.cjs`: 16/16 PASS. Independently evaluated the actual R109 STRIP_FACE, stripKey and new authoredFacing function from source: all **82 table keys** resolved correctly (L -> right, R -> left), and an unknown path returned null. The earlier 133 reference describes the cells visually audited in the historical comment, not the number of current table keys. R61 extends the R54 clock with its own action clock before native fallback (runtime HTML 10654), so the resolver follows that same active action angle.

The previous R109 coverage-gap finding is addressed for known table entries. Unknown art orientations and R104 front/back limitations remain unverified rather than being assigned an invented direction. Actual gameplay, startup registration order, PC/mobile visuals and seven-field review still require separate evidence.

Reviewed facing source SHA256: `278ba1fa6791a2b500ea698e71c204374760fe6b32db2948b19d0307726a754e`.
