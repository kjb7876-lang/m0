# R84 dynamic VFX native event bindings

Read-only source review of the shipped V8 candidate. No simulation changes and no browser/GPU validation.

| Event | Existing authority | Safe visual attachment |
| --- | --- | --- |
| Basic/default silver dance movement | `drawEffect(e)` with `e.type==='threadSlashR63'` and `e.threadR63` | Already admitted movement/strike trail. `from`, `to`, `angle`, `hitIndex`, `motif`, `seed`; interpret as a trail, not proof of damage. |
| Custom gold dance | `drawEffect(e)` with `e.type==='goldenThreadR72'` and `e.goldenR72` | `a`, `b`, `stroke`, `cast`, `slot`, `actor`. Use its native age/life and endpoints. Pool slots are reused; avoid retaining by effect identity forever. |
| Confirmed dance hit | `hitEnemy` returns success and target HP decreases | Source `ability` is `threadDanceR63`, `silverThreadR74` or `goldenThreadR72`; `kind` is `hero-thread-dance-r63`, `hero-silver-r74` or `hero-golden-r72`. Store an impact point after admitted damage, including lethal hits. |
| Friendly projectile travel | `drawProjectile(p)`, `p.friendly===true`, not dead | `x/y`, `px/py`, `vx/vy`, native owner. A trail does not claim contact. |
| Enemy cast | hazard `row150` and `cast150` | Rows have `warningAt`, `releaseAt`, `impactAt`, `originX/Y`, `targetX/Y`, `lifecycle154`, `hit`; warning progress uses `(time-warningAt)/(releaseAt-warningAt)`. Keep native footprints. |
| Player hurt | Final `hurt(value,source)` result | Actual outcomes include `parried`, `hit`, `blocked`, `invulnerable`, `ignored`, `revived`. Confirm impact with `result==='hit'` and HP decrease. |
| Parry | Final hurt returns `parried` | Native function already owns resonance/counter and its cue; add at most a bounded supplemental spark. |
| Blink | Final `blink()` changes `blinkCD` and/or actor position | Native emits `ghost` and `sigil` with `VFX.blink`. No new teleport or invulnerability logic. |
| Active field status | `__STORYWORLD_FIELDS_R61__.statusRows()` | Real current-room/player rows `{key,owner,start,until}`. Keys: `dark`, `shock`, `frost`, `fire`, `charm`, `weakness`, `corruption`, `bind`, `harvest`, `pollution`, `disease`, `bleed`. |
| Legacy/wound aliases | `r58Affliction`, hospital wound HUD API | `curse`→dark/corruption, `chill`→frost, `burn`→fire, `poison`→pollution/disease. Do not create a status because a PNG name suggests it. |
| Cast-specific temporary status | `player.storyStatus150` | `key`, `label`, `until`; keys `slow`, `drain`, `delay`, `echo`. Exact status semantics differ from field keys. |
| HP restoration | Actual before/after HP of same living actor/room | Tick comparison covers healing zone and sanctuary; avoid effects on restore/new-game identity changes. Native `sigil` with `VFX.heal` already exists for some explicit heals. |
| Shield | `player.shield>0` | Existing shield quantity is authoritative; never add protection from visual state. |

## Medical exclusions

Every new generic wrapper should delegate `source.medical20`, `hazard.medical20`, or `projectile.medical20` unchanged. Medical kinds include `tool/tools`, `poison`, `shock`, `blunt`; frames include `scalpel`, `syringe`, `paddles`, `baton`. These paths own explicit needle-tip/body-surface registration, poisoning, budgets, art readiness and cancellation. R83 excludes the hospital from its new64 regional decoration pool.

## Useful existing fixtures

- `qa/r83/vfx-runtime-check.cjs`: actual hurt admission, explicit skill invulnerability, all16 regional bosses and cast rows, native cult04 six-guardian/story revival, image late completion/cancel/fallback.
- `qa/r83/effect-check.cjs`: actual basic attack, original44-atlas frames/teams/motion modes and real Three CommandScene replay.
- `qa/r83/audit-frame-replay.cjs`: real image dimensions, actual full-frame capture and Three geometry, including admitted player HP loss and door shake regression.
- `qa/r81/projectile-contracts.cjs`: swept native projectile/closed-door collision.
- `qa/r81/world-combat-check.cjs`: native route/rally/boss/story/exit controller.

Explicit invulnerability test must set a skill reason such as `invReason='기술 회피'`. Native R54 intentionally bypasses automatic `피격 보호` between distinct attacks, so merely setting `invincible` after a prior normal hit is not a valid skill-invulnerability fixture.
