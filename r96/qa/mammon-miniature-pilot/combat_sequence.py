"""Sample the candidate's live combat view through an existing disposable Chrome session."""

import base64
import hashlib
import json
import struct
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen


WATCH = """
const [id,slot]=arguments,subject=room.enemies.find(e=>e.id===id);
if(!subject)return false;
// Keep only a read reference so an actual deadRecorded/HP change survives removal from room.enemies.
window[slot]={owner:room,subject};return true;
"""
SNAPSHOT = """
const [targetId,slot]=arguments, phase=window.__STORYWORLD_PHASE1__;
const engine=phase?.controller?.state?.three, diag=window.__STORYWORLD_ENEMY_STATUS24__?.snapshot?.();
const actors=typeof room==='object'&&room?room.enemies||[]:[];
const visible=(diag?.enemies||[]).filter(e=>e.active&&e.hp>0&&e.renderEligible&&e.sightVisible&&
  e.image?.ready&&(e.footOnScreen||e.bodyIntersects));
const byId=new Map(actors.map(e=>[e.id,e]));
const watched=window[slot],target=watched?.owner===room?watched.subject:null;
const sameActor=!!target&&byId.get(targetId)===target, targetDiag=visible.find(e=>e.id===targetId);
const view=document.getElementById('phase1-webgl');
function exposed(x,y,z){
 if(!view||!engine?.T||!engine.camera)return false;
 const p=new engine.T.Vector3(x,y,z).project(engine.camera),r=view.getBoundingClientRect();
 const sx=r.left+(p.x+1)*r.width/2,sy=r.top+(1-p.y)*r.height/2;
 if(p.z<-1||p.z>1||sx<r.left||sx>=r.right||sy<r.top||sy>=r.bottom)return false;
 const node=document.elementFromPoint(sx,sy);
 return !!node&&(node===view||node===document.getElementById('game'));
}
function actor(e){return e?{id:e.id,x:e.x,y:e.y,hp:e.hp,maxHp:e.maxHp,attackAnim:e.attackAnim||0,
  attackCooldown:e.attackCD??null,deadRecorded:e.deadRecorded===true,
  combo:e.combo??null,casting:!!(e.cast||e.casting||e.attack),spawnState:e.spawnState??null}:null;}
const activeHazards=(typeof hazards==='undefined'?[]:hazards).filter(h=>h&&(!Number.isFinite(h.life)||h.age<h.life));
const world={zone:typeof room==='object'?room?.id:null,layer:typeof layer==='undefined'?null:layer,
  stage:typeof room==='object'?room?.encounterStage??null:null};
return {...world,gameTime:typeof time==='number'?time:null,rendererSerial:engine?.serial??null,
  renderer:phase?.inspect()?.active??null,browserMs:performance.now(),browserEpochMs:Date.now(),
  viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,loading:!!loading,modal:!!modal,story:!!storyScene,
  hero:typeof player==='object'?actor(player):null,living:actors.filter(e=>e.hp>0).length,
  activeLiving:diag?.enemies?.filter(e=>e.active&&e.hp>0).length??null,
  visibleLiving:visible.length,visibleActors:visible.slice(0,24).map(e=>actor(byId.get(e.id))).filter(Boolean),
  target:actor(target),targetInRoom:sameActor,targetReportedVisible:sameActor&&!!targetDiag&&
    (exposed(target.x,0,target.y)||exposed(target.x,.75,target.y)),
  targetLineClear:sameActor&&targetDiag?.combatLineClear===true,
  targetDistance:target&&player?Math.hypot(player.x-target.x,player.y-target.y):null,
  hazardCount:activeHazards.length,hazards:activeHazards.slice(0,16).map(h=>({id:h.id??null,
    kind:h.type??h.kind??null,x:h.x??null,y:h.y??null,age:h.age??null,life:h.life??null,
    warning:h.warning??null,radius:h.radius??null})),effects:typeof effects==='undefined'?null:effects.length,
  projectiles:typeof projectiles==='undefined'?null:projectiles.length};
"""


def _jpeg_size(raw):
    if not (raw.startswith(b"\xff\xd8") and raw.endswith(b"\xff\xd9")):
        raise ValueError("Chrome did not return a complete JPEG")
    at = 2
    while at + 4 <= len(raw) and raw[at] == 255:
        while at + 1 < len(raw) and raw[at + 1] == 255:
            at += 1
        marker = raw[at + 1]
        length = int.from_bytes(raw[at + 2:at + 4], "big")
        if length < 2 or at + 2 + length > len(raw):
            break
        if marker in (0xC0, 0xC1, 0xC2) and length >= 8:
            height, width = struct.unpack(">HH", raw[at + 5:at + 9])
            if width and height:
                return [width, height]
        if marker == 0xDA:
            break
        at += 2 + length
    raise ValueError("JPEG dimensions unavailable")


def _utc():
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


def _actions(s, actions):
    return s.call("/actions", {"actions": [{"type": "key", "id": "keyboard", "actions": actions}]})


def capture_combat_sequence(s, out, view, target, *, variant="after", on_frame=None, before_input=None, after_input=None):
    """Sample one native basic attack, with released input before any post-input capture."""
    if view not in ("pc", "mobile") or variant not in ("before", "after") or target.get("marker") != "combat":
        raise ValueError("Expected native before/after PC or mobile combat marker")
    attack_key=target.get("attackKey","a")
    touch=target.get("attackControl")=="touch"
    if attack_key not in ("a","1"):
        raise ValueError("Expected physical A or 1")
    max_range=float(target.get("comparisonRange",2.6))
    if not 0 < max_range <= 3.5:
        raise ValueError("Invalid melee sampling distance")
    prefix = f"{variant}-{view}-combat-sequence"
    folder = Path(out) / prefix
    folder.mkdir(parents=True, exist_ok=True)
    report = {"status": "INCOMPLETE", "view": view, "variant": variant, "targetEnemyId": target.get("enemyId"),
              "fixturePosition": target.get("fixturePosition"), "fixture": "Existing 777 combat marker",
              "attackKey":None if touch else attack_key,"attackControl":"mobile native basic attack button" if touch else "keyboard",
              "maxTargetDistance":max_range,"sampleBudgetSeconds":120,
              "input": [], "inputReleased": False, "frames": [], "issues": [],
              "qualification": "Sequential native-resolution Chrome surface JPEGs, not a video or FPS measurement. "
                               "Read-only telemetry brackets each capture; the sampled pixels may be from any serial in that interval. "
                               "VFX appearance and timing require visual review."}
    start = time.monotonic()
    hashes = {}
    serials = []
    key_may_be_down = False
    observer_slot="__mammonQaCombatSubject"+uuid.uuid4().hex
    manifest = folder / "sequence.json"

    def checkpoint():
        temporary = manifest.with_suffix(".tmp")
        temporary.write_text(json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False) + "\n",
                             encoding="utf-8")
        temporary.replace(manifest)

    def snapshot():
        return s.js(SNAPSHOT, target.get("enemyId"), observer_slot)

    def validate_pre_input(state):
        actor=state.get("target") or {}
        if not (state["targetInRoom"] and state["targetReportedVisible"] and state["targetLineClear"] and
                actor.get("id")==target.get("enemyId") and (actor.get("hp") or 0)>0 and not actor.get("deadRecorded") and
                state["targetDistance"] is not None and state["targetDistance"]<=max_range):
            raise RuntimeError("Same living target was not on screen, in range and in a clear attack line immediately before input")

    def terminal_target(state):
        actor = state.get("target") or {}
        return (report["inputReleased"] and actor.get("id") == target.get("enemyId")
                and (actor.get("deadRecorded") is True or actor.get("hp", 1) <= 0))

    try:
        if not s.js(WATCH,target.get("enemyId"),observer_slot):
            raise RuntimeError("Requested native target ID absent at sequence start")
        for i in range(8):
            if time.monotonic() - start > 120:
                raise TimeoutError("120-second sampling budget exhausted")
            if i == 2:
                if before_input and before_input() is False:
                    raise RuntimeError("Native comparison target not eligible immediately before trusted input")
                pre=report["preInput"]=snapshot()
                validate_pre_input(pre)
                if (pre["zone"],pre["layer"],pre["renderer"],pre["stage"])!=("ep1b06","STORY","three",report["initialStage"]) or pre["modal"] or pre["loading"] or pre["story"]:
                    raise RuntimeError("Combat scene changed before input")
                pulse={"event":"pointerDown,pause,pointerUp" if touch else "keyDown,pause,keyUp",
                       "key":None if touch else attack_key,"requestedPauseMs":80,"acknowledged":False,
                       "requestUtc":_utc(),"requestMs":round((time.monotonic()-start)*1000,1)}
                report["input"].append(pulse)
                key_may_be_down = True
                if touch:
                    pulse["point"]=s.touch_basic_attack()
                else:
                    _actions(s,[{"type":"keyDown","value":attack_key},{"type":"pause","duration":80},
                                {"type":"keyUp","value":attack_key}])
                key_may_be_down = False
                report["inputReleased"] = True
                pulse.update(acknowledged=True,responseUtc=_utc(),responseMs=round((time.monotonic()-start)*1000,1))
            if i == 2 and after_input:
                after_input()
            before = snapshot()
            if (before["zone"], before["layer"], before["renderer"]) != ("ep1b06", "STORY", "three"):
                raise RuntimeError("Active STORY ep1b06 Three scene unavailable")
            if before["loading"] or before["modal"] or before["story"] or not before["hero"]:
                raise RuntimeError("Combat view interrupted")
            row = {"index": i, "inputPhase": "before" if i < 2 else "released",
                   "before": before, "captureStartUtc": _utc(),
                   "captureStartMs": round((time.monotonic() - start) * 1000, 1)}
            if not report["frames"]:
                report["initialStage"] = before["stage"]
            if before["stage"] != report["initialStage"] and not terminal_target(before):
                raise RuntimeError("Encounter stage changed during sampling")
            response = s.cdp("Page.captureScreenshot", {"format": "jpeg", "quality": 70, "fromSurface": True,
                                                       "captureBeyondViewport": False})
            raw = base64.b64decode(response["data"], validate=True)
            size = _jpeg_size(raw)
            if size != [round(n * before["dpr"]) for n in before["viewport"]]:
                raise ValueError(f"JPEG dimensions differ from the native viewport: {size}")
            digest = hashlib.sha256(raw).hexdigest()
            name = f"frame-{i:02d}.jpg"
            (folder / name).write_bytes(raw)
            row.update(file=f"{prefix}/{name}", sha256=digest, size=size,
                       duplicateOf=hashes.get(digest), captureEndUtc=_utc(),
                       captureEndMs=round((time.monotonic() - start) * 1000, 1))
            hashes.setdefault(digest, i)
            report["frames"].append(row)
            after = row["after"] = snapshot()
            row["serialChangedDuringCapture"] = before["rendererSerial"] != after["rendererSerial"]
            serials.extend(n for n in (before["rendererSerial"], after["rendererSerial"]) if isinstance(n, int))
            checkpoint()
            if on_frame:
                on_frame(i)
            if ((after["zone"], after["layer"]) != (before["zone"], before["layer"])
                    or (after["stage"] != before["stage"] and not terminal_target(after))):
                raise RuntimeError("Scene or encounter stage changed across the capture")
            if i != 7:
                time.sleep(.08)
    except Exception as exc:
        report["issues"].append(f"{type(exc).__name__}: {exc}")
    finally:
        if key_may_be_down:
            try:
                if touch:
                    with urlopen(Request(s.session+"/actions",method="DELETE"),timeout=6):
                        pass
                else:
                    _actions(s,[{"type":"keyUp","value":attack_key}])
                report["inputReleased"] = True
                report["input"].append({"event":"releaseActions" if touch else "recoveryKeyUp",
                                        "key":None if touch else attack_key,"acknowledged":True,"utc":_utc()})
            except Exception as exc:
                # A partially delivered action request may have left the source locked.
                # W3C release actions clears input state in this disposable session.
                try:
                    with urlopen(Request(s.session + "/actions", method="DELETE"), timeout=6):
                        pass
                    report["inputReleased"] = True
                    report["input"].append({"event":"releaseActions","acknowledged":True,"utc":_utc()})
                except Exception as cleanup:
                    report["issues"].append(f"Key release failed: {exc}; release actions failed: {cleanup}")
        try:
            s.js("return delete window[arguments[0]];",observer_slot)
        except Exception as exc:
            report["issues"].append(f"Could not discard QA observer: {exc}")

    advances = sum(b > a for a, b in zip(serials, serials[1:]))
    if len(report["frames"]) != 8 or len(hashes) < 2 or advances == 0:
        report["issues"].append("Eight samples with distinct pixels and advancing game serials were not established")
    states = [row[k] for row in report["frames"] for k in ("before", "after") if row.get(k)]
    if not any(state["targetReportedVisible"] for state in states):
        report["issues"].append("Selected living enemy not reported on screen during the sequence")
    post = [row[k] for row in report["frames"] if row["inputPhase"] != "before"
            for k in ("before", "after") if row.get(k)]
    pre=report.get("preInput") or {}
    accepted=report["inputReleased"] and bool(report["input"]) and report["input"][0].get("acknowledged") is True
    pre_hp=(pre.get("target") or {}).get("hp")
    targets=[s["target"] for s in post if s.get("target") and s["target"]["id"]==target.get("enemyId")]
    death=accepted and pre_hp is not None and pre_hp>0 and any(a.get("deadRecorded") or a.get("hp",1)<=0 for a in targets)
    damage=accepted and pre_hp is not None and any(a.get("hp",pre_hp)<pre_hp for a in targets)
    post_seen=any(s["targetReportedVisible"] for s in post)
    report["witness"] = {
        "nativeHeroAttackAnimationSeenAfterInput": any(state["hero"]["attackAnim"] > 0 for state in post if state.get("hero")),
        "targetHpDecreaseObserved": damage,"confirmedTargetDeathAfterInput":death,
        "targetSeenAfterInput":post_seen,"sameTargetStartQualified":accepted,
        "hazardSeenAfterInput": any(state["hazardCount"] for state in post),
        "observedStages": list(dict.fromkeys(state["stage"] for state in states)),
    }
    if not accepted or not(post_seen or death):
        report["issues"].append("Same target needs a qualified input start and post-input visibility or a recorded death")
    if not (damage or death or report["witness"]["nativeHeroAttackAnimationSeenAfterInput"]):
        report["issues"].append("No native attack animation, target damage or recorded death after the input")
    report["uniqueFrames"] = len(hashes)
    report["rendererAdvances"] = advances
    report["elapsedMs"] = round((time.monotonic()-start)*1000,1)
    report["vfxReviewed"] = False
    report["status"] = "CAPTURED" if not report["issues"] and report["inputReleased"] else "INCOMPLETE"
    checkpoint()
    return {key: report[key] for key in ("status", "uniqueFrames", "rendererAdvances", "inputReleased",
                                        "initialStage","attackKey","attackControl","preInput","witness","qualification","issues") if key in report} | {
        "manifest": f"{prefix}/sequence.json", "files": [row["file"] for row in report["frames"]]}
