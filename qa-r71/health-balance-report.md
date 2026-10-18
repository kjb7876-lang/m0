# R71 Health and Bleeding Balance

This report describes the frozen R71 health helper (`R71-HEALTH-BLEED`) relative to the R70 runtime. The current candidate HTML (`de6536bca2f3860c7195b39e4f7d1397ff8db7acb1558015f14a95c1b4e16646`) differs from the earlier `cc7aa6` candidate only in the beacon renderer; the health helper is unchanged. The R71 player cap is exactly 777 HP. Boss suffixes are applied to actual `maxHp` values. Existing difficulty scaling, ward and other combat modifiers, progression, EGO/thread mechanics, and existing wound effects remain in place; R71 does not add a damage or healing tuning coefficient beyond health-unit normalization.

## Player health conversion

R71 captures the final R70 `maxHP()` function before replacing the public function with one that returns 777. For the active player, and for an actor in cooperative mode when `withPlayer` can scope that actor, the captured function supplies that actor's exact legacy maximum. A matching fallback formula is `260 + 35 × nativeVitalRank + 5 × (level − 1) + 18 × endlessVitalRank`. If the captured value differs from that fallback, R71 records a diagnostic and keeps the captured value.

For an unmarked R70 actor or save with legacy maximum `L` and current HP `h`, migration is:

```text
R71 HP = clamp(h, 0, L) / L × 777
incoming damage = legacy incoming damage × 777 / L
fixed legacy-unit healing = legacy heal × 777 / L
```

The actor/save marker prevents a second conversion; marked R71 health is only clamped to `[0, 777]`. New-game and fresh-player paths start at 777/777. Percentage heals that already use the public `maxHP()` see 777 and do not pass through the fixed-heal conversion. Fixed heals and the legacy map-clear heal retain their old health fraction after conversion and remain capped at 777.

| Representative state | R70 legacy max | R71 max | R71 multiplier | Example incoming hit | Fixed heal of 35 legacy HP at listed L* |
|---|---:|---:|---:|---:|---:|
| Fresh / no vitality, level 1 | 260 | 777 | 2.988462 | 10 → 29.8846 R71 HP | 104.5962 R71 HP |
| Native vitality rank 1, level 1 | 295 | 777 | 2.633898 | 10 → 26.3390 R71 HP | 92.1864 R71 HP |
| CPU fixture: native vitality 2, level 5, endless vitality 2 | 386 | 777 | 2.012953 | 10 → 20.1295 R71 HP | 70.4534 R71 HP |

* The table's fixed-heal values use each row's current `L`. A heal attached to a vitality purchase uses the post-purchase maximum, because the rank is raised before the heal is applied.

The incoming-hit column is the health-unit conversion applied to a positive hit before any preserved combat modifier; it does not replace existing ward, difficulty, or other mitigation. At native vitality rank 1, the hit consumes `10/295 = 3.3898%` of the legacy maximum, matching `26.3390/777`. Relative to rank 0, vitality rank 1 therefore lowers the fraction removed by `1 − 260/295 = 11.8644%`. The displayed next-upgrade estimate uses this same equivalent protection formula, `gain / (L + gain)`; it does not change an existing mitigation coefficient.

The rank-1 vitality upgrade's 35-point fixed heal becomes `35 × 777/295 = 92.1864` R71 HP after the rank raises the legacy maximum to 295, then is capped at 777. The upgrade-card preview now uses the post-purchase legacy maximum (`L+35` for native vitality, `L+18` for endless vitality), matching the actual purchase conversion. At a fresh L=260, the previews are 92.2 HP for native vitality and 50.3 HP for endless vitality. The CPU test also checks a player with one rank in each upgrade (L=313): 78.1 and 42.3 HP for their next steps. For the CPU migration fixture (legacy max 386), an old HP value of 193 migrates to `193/386 × 777 = 388.5`, preserving its 50% health fraction. Reapplying migration leaves 388.5 unchanged. The same 50% conversion applies to unmarked legacy saves; marked saves remain in R71 units.

Map-clear healing preserves its R70 amount rule, `min(35, 0.12 × L)`, then converts that fixed amount by `777/L`. For example, at L=260, `31.2` legacy HP becomes `93.24` R71 HP (12% of the new cap); at L=295, `35` legacy HP becomes `92.1864` R71 HP. Healing at full HP remains capped.

## Boss maximum HP suffixes

For actual boss types (`boss`, `midboss`, `persona`, `cosmic`, `trial`, and `cosmicGuardianR63`), R71 takes the unrounded canonical maximum after difficulty scaling and sets the actual `maxHp` to the nearest nonnegative value of `1000 × N + 666`, with a minimum of 666:

```text
N = max(0, round((canonicalMaxHp − 666) / 1000))
R71 boss maxHp = 1000 × N + 666
```

If difficulty metadata is consistent, canonical maximum is `difficultyBaseHpR63 × difficultyFactorR63`. If the current maximum differs from that product, R71 treats it as a native phase/health override and rebases the canonical value to the current maximum instead of using stale metadata. Current HP fraction is preserved as `oldHp / oldVisibleMaxHp × newVisibleMaxHp`. Canonical, difficulty, and visible values are tracked so repeated room normalization is idempotent and later difficulty application does not compound the suffix.

| CPU fixture | Canonical max before suffix | Difficulty tier | Actual R71 `maxHp` | HP example (50% before → after) |
|---|---:|---:|---:|---:|
| Standard boss | 12,345 | ×1.0 | 12,666 | 6,172.5 → 6,333 |
| Same base boss | 12,345 | ×0.4 = 4,938 | 4,666 | 2,469 → 2,333 |
| Fresh `dist00` boss, R61 then R63 | 6,421.5 (R61 pressure 25,686 × normal .25) | normal ×.25 | 6,666 | 3,210.75 → 3,333 |
| Persona native phase override | Metadata says 2,000; current max is 1,000 | ×1.0, rebased to 1,000 | 666 | full → full (666) |

The `dist00` row is the corrected fresh-room order. R61's `makeRoom` wrapper first replaces the region-builder health with its campaign-pressure value (25,686 in the deterministic fixture); R63 applies the selected map tier after `enterRegion` returns, producing the 6,421.5 canonical max. R71 now waits for that R63 `scaleEnemy` call before applying the suffix. It no longer normalizes the pre-tier room object, which previously produced a four-times-too-large displayed maximum. The cases above are asserted in `r71-health.cpu.test.mjs`, including repeat normalization and unapply/reapply behavior. R61 summoned clones are excluded from boss suffixes because their boss flags are false. Their independent exact `clone.maxHp = owner.maxHp × 0.06` rule is repaired after saved-health restoration and live difficulty re-selection as described below.


### R61 clone save and restore

R61's native save restores a clone with `makeUnit(owner, 'clone', ...)`, which starts from the restored owner's current `maxHp` and sets the clone to exactly 6%. The clone is pushed into the room before R63 runs `restoreLoadedHealth(raw)`. R63 then reapplies older `campaignHpR63` base/factor metadata to every room enemy, which can replace the derived clone maximum and leave the clone's R63 metadata unrelated to its owner.

R71 wraps the lexical R63 `restoreLoadedHealth` function. After the native function has restored and scaled every room and owner, R71 repairs only actors marked both `r61Clone === true` and `r61Summoned.kind === 'clone'`. It uses the live owner's post-scale maximum, sets clone max to `owner.maxHp × 0.06`, preserves the clone's current HP fraction, and aligns its existing difficulty base/factor to the restored tier. A dead clone stays at zero HP. The repair skips ordinary minions, clones whose owner is absent or dead, and actors without the native clone markers. Repeating the native restore remains stable; no new save sidecar or gameplay bonus is added.

The same clone repair also wraps native lexical R63 `applyRoom`. After that function scales the complete room to the selected tier, R71 repairs clones in that room so an owner later in the enemy array is already normalized. The helper accepts an optional room list for this path; full restore still performs its all-world final repair after R63 finishes. Room repair is not run from per-frame code.

| Native same-map difficulty change | Owner canonical / visible max | Clone max / HP before | Clone max / HP after | Ordinary minion |
|---|---:|---:|---:|---:|
| Normal → hard | 6,421.5 / 6,666 → 10,274.4 / 10,666 | 399.96 / 199.98 (50%) | 639.96 / 319.98 (50%) | 250 / 125 → 400 / 200 |
| Hard → normal | 10,274.4 / 10,666 → 6,421.5 / 6,666 | 639.96 / 319.98 (50%) | 399.96 / 199.98 (50%) | 400 / 200 → 250 / 125 |

The CPU regression invokes the extracted native R63 `applyRoom`, with the clone listed before its owner. It verifies exact 6% clone max, stable HP fraction, dead-clone HP remaining zero, ordinary-minion tier scaling, and idempotence on repeated hard and normal selection. The browser QA also exercises the actual R71 confirmation UI from a restored co-op room through hard and back to normal.

| Native restore fixture | R63 stale clone metadata result | R71 post-restore result | HP fraction |
|---|---:|---:|---:|
| Restored `dist00` boss owner | Canonical 6,421.5 → visible 6,666 | 6,666 | 50% |
| Clone, stale metadata base 48,000 × .25 | 12,000 max / 6,000 HP | 399.96 max / 199.98 HP | 50% |
| Dead clone of same owner | Stale max is discarded | 399.96 max / 0 HP | 0% |

The stale base in this table is the explicit CPU regression fixture, not a claimed production save value. It demonstrates that R63's exact native restore runs first and R71 then restores the existing R61 6% contract without reviving or healing a clone. Boss suffix markers still need no new save sidecar: R63's `campaignHpR63` metadata stores canonical difficulty base/factor for actual bosses, and the existing R71 scale wrapper derives the visible suffix after R63 scaling. The base R70 enemy row only stores HP and position. R62 snapshots encode enemy properties, including R71's scalar canonical/visible boss markers; co-op import's R63 restore path also receives the same post-restore clone repair.

## Bleeding behavior

An admitted enemy hit that removes player HP creates or refreshes a three-second `healthBleedR71` status. The HUD adds an `출혈` row unless an existing R53 wound row already supplies that label, avoiding duplicates. R71 does not add damage-over-time; existing R53 wound behavior, when independently triggered, is unchanged. Dodge/invulnerability and zero-HP-loss `hit` results, friendly/self-cost/DOT sources, and guest-side application are rejected. A lethal admitted hit gets the short impact visual while death cleanup leaves no active three-second status.

The blood effect reuses the cached R52 medical-impact atlas. Each impact decal lasts 0.48 seconds; effects are bounded to three active decals per actor and 24 globally. A later hit refreshes the status expiry to three seconds. No new image load occurs per frame.

In co-op, the host remains authoritative for health and admitted-hit status. R71 effects carry the actor's stable `coopIdR62` string and resolve it against `coop.players()` when drawing; they do not trust a decoded generic player facade as the owner. If the actor cannot be resolved, the effect is hidden with `owner-unresolved` rather than drawn at another player's position. The CPU fixture covers this facade/peer lookup and world-position case. Preflight run `39112456285` passed the local co-op browser case: a native peer hit reduced peer HP from 777 to 772.00028 while host HP stayed unchanged; a lethal hit took 2 HP to 0, then one native host tick revived the peer at 388.5/777. Bleeding survived save and guest transfer. Hospital epoch 5 / `ep1a08` expanded item state survived save and guest transfer, and the item was picked up once. The full repeated-import health comparison had zero failures; boss and clone health remained stable and the input save was unchanged. The earlier 0cd run stopped at the fixture-only `c.tick` error; the d58 test harness corrected it. These are local simulation results, not live relay or mixed-version validation.

## Verification evidence

The current candidate's CPU suite passed **26/26 tests**: thirteen health tests, nine progression tests, and four renderer tests. The HTML SHA-256 is `de6536bca2f3860c7195b39e4f7d1397ff8db7acb1558015f14a95c1b4e16646`; the renderer SHA-256 is `54dfe20af282d237511ef6f4bb6be3fe54880ad61d82928b0114d15f58df725c`. Preflight run [39112456285](https://github.com/kjb7876-lang/m0/actions/runs/39112456285), using test harness `d58ffc8691822cfc5bbec9913fb99c32d38a626b`, passed browser **8/8**, four executed native check groups, CPU **26/26**, 1,906 audit checks, and integrity validation. The separate legacy-exclusion notice is not counted as a native check group. Solo health coverage passed across 28 boss maps / 44 actors, including max HP 777, upgrades, save/restore, and death/respawn. Co-op peer hit, lethal revive, bleed save/guest transfer, hospital item save/guest transfer and exactly-once pickup passed; repeated imports had zero health comparison failures and left the input save unchanged. Run `39111040632` is historical intermediate evidence (7/8) from before the fixture correction; its `c.tick` failure is fixed by the test-only d58 harness. This validates the candidate but does not claim deployment. No physical-device co-op, live relay, or mixed-version co-op test has been verified; browser co-op coverage is local simulation only.

Relevant source, tests, and evidence: [health helper](../client-source/health-r71.js), [health CPU tests](../scripts/r71-health.cpu.test.mjs), [progression CPU tests](../scripts/r71-progression.cpu.test.mjs), [renderer CPU tests](../scripts/r71-render.cpu.test.mjs), [0cd browser/native artifact](intermediate-0cd0167-browser-native.json), and [historical 58c browser artifact](intermediate-58c979b-browser.json).
