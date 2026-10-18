#!/usr/bin/env python3
"""R71 player health and landed-hit bleeding overlay for the pinned R70 HTML."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT_OPEN = '<script id="campaign-combat-r63r1">'
SCRIPT_CLOSE = '</script>'
FREEZE_MARKER = "  window.__STORYWORLD_CAMPAIGN_R63R1__=Object.freeze({revision:'R64-candidate'"
HEALTH_MARKER = 'R71-HEALTH-BLEED'


def _replace_once(html: str, old: str, new: str, count: int = 1) -> str:
    actual = html.count(old)
    if actual != count:
        raise RuntimeError(f'R71 health source drift: expected {count} occurrences, found {actual}: {old[:100]}')
    return html.replace(old, new)


def _patch_native_surfaces(html: str) -> str:
    # Fixed native heals are expressed in old HP units so their effective
    # fraction remains unchanged after migrating the player's pool to 777.
    fixed = [
        ("player.hp=Math.min(maxHP(),player.hp+30)",
         "player.hp=Math.min(maxHP(),player.hp+(window.__STORYWORLD_HEALTH_R71__?.scaleLegacyHeal(30,player)??30))", 1),
        ("player.hp=Math.min(maxHP(),player.hp+35)",
         "player.hp=Math.min(maxHP(),player.hp+(window.__STORYWORLD_HEALTH_R71__?.scaleLegacyHeal(35,player)??35))", 2),
        ("player.hp=Math.min(maxHP(),player.hp+2+m)",
         "player.hp=Math.min(maxHP(),player.hp+(window.__STORYWORLD_HEALTH_R71__?.scaleLegacyHeal(2+m,player)??(2+m)))", 2),
        ("player.hp=Math.min(maxHP(),player.hp+dt*25)",
         "player.hp=Math.min(maxHP(),player.hp+(window.__STORYWORLD_HEALTH_R71__?.scaleLegacyHeal(dt*25,player)??(dt*25)))", 1),
        ("p.hp=Math.min(maxHP(),p.hp+dt*25)",
         "p.hp=Math.min(maxHP(),p.hp+(window.__STORYWORLD_HEALTH_R71__?.scaleLegacyHeal(dt*25,p)??(dt*25)))", 1),
        ("p.hp=Math.min(MAX,p.hp+18)",
         "p.hp=Math.min(window.__STORYWORLD_HEALTH_R71__?.maxHP||MAX,p.hp+(window.__STORYWORLD_HEALTH_R71__?.scaleLegacyHeal(18,p)??18))", 1),
        ("player.hp=Math.min(maxHP(),player.hp+Math.min(35,maxHP()*.12))",
         "player.hp=Math.min(maxHP(),player.hp+(window.__STORYWORLD_HEALTH_R71__?.mapClearHeal(player,35,.12)??Math.min(35,maxHP()*.12)))", 1),
        ("const healed=admittedLifesteal9(rawHeal,efficiency);",
         "const healed=admittedLifesteal9(window.__STORYWORLD_HEALTH_R71__?.scaleLegacyHeal(rawHeal,player)??rawHeal,efficiency);", 1),
    ]
    for old, new, count in fixed:
        html = _replace_once(html, old, new, count)

    # The existing R53 status may already include its wound/DOT bleed entry;
    # retain that row and add R71's hit-duration row only when absent.
    status_old = "  rows.push(...(window.__STORYWORLD_HOSPITAL_WOUNDS_R53__?.statusRows()||[]));"
    status_new = ("  rows.push(...(window.__STORYWORLD_HOSPITAL_WOUNDS_R53__?.statusRows()||[]));"
                  "const hasBleed=rows.some(row=>row.label==='출혈');"
                  "if(!hasBleed)rows.push(...(window.__STORYWORLD_HEALTH_R71__?.statusRows(player)||[]));")
    html = _replace_once(html, status_old, status_new)

    # Carry owner health/bleeding fields through host snapshots and saved
    # participant rows. The migration marker prevents repeated conversion.
    html = _replace_once(
        html,
        "const actorPublicKeys=['hero',",
        "const actorPublicKeys=['healthR71Applied','healthBleedR71','hero',",
    )
    html = _replace_once(
        html,
        "for(const k of actorPublicKeys)if(old[k]!==undefined)m.actor[k]=decode(old[k]);m.actor.coopIdR62=keepId;",
        "for(const k of actorPublicKeys)if(old[k]!==undefined)m.actor[k]=decode(old[k]);"
        "const healthR71=window.__STORYWORLD_HEALTH_R71__;"
        "if(healthR71){m.actor.healthR71Applied=old.healthR71Applied===true;healthR71.ensureActor(m.actor,{source:'coop-participant-restore'});}"
        "m.actor.coopIdR62=keepId;",
    )

    # Coop captures the pre-R71 global hurt function before the R71 overlay is
    # loaded, so normalize and observe its single authoritative hurtOne route.
    hurt_old = "const before=p.hp,fxBefore=effects.length;damageScope++;let result;try{result=base.hurt(value,source);}finally{damageScope--;}for(let i=fxBefore;i<effects.length;i++)effects[i].coopPlayerR62=p.coopIdR62;"
    hurt_new = ("const healthR71=window.__STORYWORLD_HEALTH_R71__,before=p.hp,fxBefore=effects.length,"
                "difficulty=window.__STORYWORLD_CAMPAIGN_R63R1__?.incomingDamageFactor?.(source)??1,"
                "adjusted=(healthR71?.normalizeIncoming(value,p,source)??value)*difficulty;"
                "damageScope++;let result;try{result=base.hurt(adjusted,source);}finally{damageScope--;}"
                "for(let i=fxBefore;i<effects.length;i++)effects[i].coopPlayerR62=p.coopIdR62;"
                )
    html = _replace_once(html, hurt_old, hurt_new)
    html = _replace_once(
        html,
        "if(before>0&&p.hp<=0)markDead(p);return result;});}",
        "if(before>0&&p.hp<=0)markDead(p);healthR71?.onAdmittedHit(p,source,before,p.hp,result);return result;});}",
    )

    # Participant restoration and session start have private R62 function
    # references that bypass the later solo lifecycle wrappers.
    html = _replace_once(
        html,
        "  initial.hero=HEROES[row.character]?row.character:initial.hero;",
        "  const healthR71=window.__STORYWORLD_HEALTH_R71__;if(healthR71){initial.healthR71Applied=player.healthR71Applied===true;healthR71.ensureActor(initial,{source:'coop-session-start'});healthR71.normalizeRoom(room,'coop-session-start');}"
        "  initial.hero=HEROES[row.character]?row.character:initial.hero;",
    )
    html = _replace_once(
        html,
        "function markDead(p){const l=lane(p);if(l.deadAt)return;p.hp=0;",
        "function markDead(p){const l=lane(p);if(l.deadAt)return;p.hp=0;window.__STORYWORLD_HEALTH_R71__?.clearBleeding(p,'death');",
    )
    html = _replace_once(
        html,
        "withPlayer(p,()=>{p.hp=maxHP()*.5;p.invincible=2;",
        "withPlayer(p,()=>{window.__STORYWORLD_HEALTH_R71__?.clearBleeding(p,'revive');p.hp=maxHP()*.5;p.invincible=2;",
    )

    # A co-op save restores its native room first, then recreates replica
    # enemies from saved maxima. Old replica maxima can overwrite a freshly
    # suffixed boss, so normalize each room only after all copies are inserted.
    replica_old = "r.enemies.push(copy);}}}finally{transitionBypass--;}"
    replica_new = ("r.enemies.push(copy);}"
                   "window.__STORYWORLD_HEALTH_R71__?.normalizeRoom(r,'coop-save-replicas');"
                   "}}finally{transitionBypass--;}")
    html = _replace_once(html, replica_old, replica_new)
    return html


def transform_html(html: str) -> str:
    """Inject the helper at its exact campaign anchor and patch R70 native hooks."""
    if not isinstance(html, str):
        raise TypeError('R71 health transform expects HTML text')
    if HEALTH_MARKER in html or '__STORYWORLD_HEALTH_R71__' in html:
        raise RuntimeError('R71 health helper is already present')
    if html.count(SCRIPT_OPEN) != 1:
        raise RuntimeError('R71 campaign script anchor mismatch: expected one opening tag')
    start = html.index(SCRIPT_OPEN) + len(SCRIPT_OPEN)
    end = html.find(SCRIPT_CLOSE, start)
    if end < 0:
        raise RuntimeError('R71 campaign script anchor mismatch: missing closing tag')
    if html.count(FREEZE_MARKER) != 1:
        raise RuntimeError('R71 campaign freeze anchor mismatch: expected one exact marker')
    insertion = html.index(FREEZE_MARKER)
    if not start < insertion < end:
        raise RuntimeError('R71 campaign freeze marker is outside its script')

    patched = _patch_native_surfaces(html)
    # Earlier source patches preserve this exact single lexical campaign anchor.
    insertion = patched.index(FREEZE_MARKER)
    helper = (ROOT / 'client-source/health-r71.js').read_text(encoding='utf-8')
    if '</script' in helper.lower():
        raise RuntimeError('Unsafe script terminator in R71 health helper')
    return patched[:insertion] + helper + '\n' + patched[insertion:]
