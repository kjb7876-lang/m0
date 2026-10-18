# R71 Health and Bleeding Balance

This report describes the frozen R71 health helper (`R71-HEALTH-BLEED`) relative to the R70 runtime. The R71 player cap is exactly 777 HP. Boss suffixes are applied to actual `maxHp` values. Existing difficulty scaling, ward and other combat modifiers, progression, EGO/thread mechanics, and existing wound effects remain in place; R71 does not add a damage or healing tuning coefficient beyond health-unit normalization.

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
| Persona native phase override | Metadata says 2,000; current max is 1,000 | ×1.0, rebased to 1,000 | 666 | full → full (666) |

The cases above are asserted in `r71-health.cpu.test.mjs`, including repeat normalization and unapply/reapply behavior. R61 summoned clones are excluded: their boss flags are false, and R71 leaves their existing exact `clone.maxHp = owner.maxHp × 0.06` rule intact when a room is normalized.

## Bleeding behavior

An admitted enemy hit that removes player HP creates or refreshes a three-second `healthBleedR71` status. The HUD adds an `출혈` row unless an existing R53 wound row already supplies that label, avoiding duplicates. R71 does not add damage-over-time; existing R53 wound behavior, when independently triggered, is unchanged. Dodge/invulnerability and zero-HP-loss `hit` results, friendly/self-cost/DOT sources, and guest-side application are rejected. A lethal admitted hit gets the short impact visual while death cleanup leaves no active three-second status.

The blood effect reuses the cached R52 medical-impact atlas. Each impact decal lasts 0.48 seconds; effects are bounded to three active decals per actor and 24 globally. A later hit refreshes the status expiry to three seconds. No new image load occurs per frame.

In co-op, the host remains authoritative for health and admitted-hit status. R71 effects carry the actor's stable `coopIdR62` string and resolve it against `coop.players()` when drawing; they do not trust a decoded generic player facade as the owner. If the actor cannot be resolved, the effect is hidden with `owner-unresolved` rather than drawn at another player's position. The CPU fixture covers this facade/peer lookup and world-position case. End-to-end browser confirmation of peer hit, snapshot transfer, death/revive cleanup, and displayed position is still pending CI; this report does not claim that browser gate has passed.

## Verification evidence

The refreshed candidate built from `_r70/docs` passed **21/21 CPU tests**: nine health tests, eight progression tests, and four renderer tests. Static package audit passed, and the composed HTML passed **76/76** inline-script syntax checks. Its HTML SHA-256 is `146b85c339a687bb563d716a0a9956118d12894387e573f1b8e8905998f87cad`; the renderer SHA-256 remains `54dfe20af282d237511ef6f4bb6be3fe54880ad61d82928b0114d15f58df725c`, unchanged from the previously frozen R71 candidate. The browser regression is a separate pending CI check.

Relevant source and test fixtures: [health helper](../client-source/health-r71.js), [health CPU tests](../scripts/r71-health.cpu.test.mjs), [progression CPU tests](../scripts/r71-progression.cpu.test.mjs), and [renderer CPU tests](../scripts/r71-render.cpu.test.mjs).
