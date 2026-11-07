"""Sample the candidate's live combat view through an existing disposable Chrome session."""

import base64
import hashlib
import json
import struct
import time
from datetime import datetime, timezone
from pathlib import Path


SNAPSHOT = """
const targetId=arguments[0], phase=window.__STORYWORLD_PHASE1__;
const engine=phase?.controller?.state?.three, diag=window.__STORYWORLD_ENEMY_STATUS24__?.snapshot?.();
const actors=typeof room==='object'&&room?room.enemies||[]:[];
const visible=(diag?.enemies||[]).filter(e=>e.active&&e.hp>0&&e.renderEligible&&e.sightVisible&&
  e.image?.ready&&(e.footOnScreen||e.bodyIntersects));
const byId=new Map(actors.map(e=>[e.id,e])), target=byId.get(targetId);
function actor(e){return e?{id:e.id,x:e.x,y:e.y,hp:e.hp,maxHp:e.maxHp,attackAnim:e.attackAnim||0,
  attackCooldown:e.attackCD??null,casting:!!(e.cast||e.casting||e.attack),spawnState:e.spawnState??null}:null;}
const activeHazards=(typeof hazards==='undefined'?[]:hazards).filter(h=>h&&(!Number.isFinite(h.life)||h.age<h.life));
const world={zone:typeof room==='object'?room?.id:null,layer:typeof layer==='undefined'?null:layer,
  stage:typeof room==='object'?room?.encounterStage??null:null};
return {...world,gameTime:typeof time==='number'?time:null,rendererSerial:engine?.serial??null,
  renderer:phase?.inspect()?.active??null,browserMs:performance.now(),browserEpochMs:Date.now(),
  viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,loading:!!loading,modal:!!modal,story:!!storyScene,
  hero:typeof player==='object'?actor(player):null,living:actors.filter(e=>e.hp>0).length,
  activeLiving:diag?.enemies?.filter(e=>e.active&&e.hp>0).length??null,
  visibleLiving:visible.length,visibleActors:visible.slice(0,24).map(e=>actor(byId.get(e.id))).filter(Boolean),
  target:actor(target),targetReportedVisible:visible.some(e=>e.id===targetId),
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


def _key(s, event):
    return s.call("/actions", {"actions": [{"type": "key", "id": "keyboard",
                                           "actions": [{"type": event, "value": "a"}]}]})


def capture_combat_sequence(s, out, view, target):
    """Call once for the after/combat marker while its camera and actors are free."""
    if view not in ("pc", "mobile") or target.get("marker") != "combat":
        raise ValueError("Expected candidate PC or mobile combat marker")
    prefix = f"after-{view}-combat-sequence"
    folder = Path(out) / prefix
    folder.mkdir(parents=True, exist_ok=True)
    report = {"status": "INCOMPLETE", "view": view, "targetEnemyId": target.get("enemyId"),
              "fixturePosition": target.get("fixturePosition"), "fixture": "Existing 777 combat marker",
              "input": [], "inputReleased": False, "frames": [], "issues": [],
              "qualification": "Sequential native-resolution Chrome surface JPEGs, not a video or FPS measurement. "
                               "Read-only telemetry brackets each capture; pixels may belong to either serial. "
                               "VFX appearance and timing require visual review."}
    start = time.monotonic()
    hashes = {}
    serials = []
    key_may_be_down = False
    manifest = folder / "sequence.json"

    def checkpoint():
        temporary = manifest.with_suffix(".tmp")
        temporary.write_text(json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False) + "\n",
                             encoding="utf-8")
        temporary.replace(manifest)

    def key(event):
        row = {"event": event, "utc": _utc(), "acknowledged": False}
        report["input"].append(row)
        _key(s, event)
        row["acknowledged"] = True
        row["elapsedMs"] = round((time.monotonic() - start) * 1000, 1)

    def snapshot():
        return s.js(SNAPSHOT, target.get("enemyId"))

    try:
        for i in range(8):
            if time.monotonic() - start > 25:
                raise TimeoutError("25-second sampling budget exhausted")
            if i == 2:
                key_may_be_down = True
                key("keyDown")
            elif i == 4:
                key("keyUp")
                key_may_be_down = False
                report["inputReleased"] = True
            before = snapshot()
            if (before["zone"], before["layer"], before["renderer"]) != ("ep1b06", "STORY", "three"):
                raise RuntimeError("Active STORY ep1b06 Three scene unavailable")
            if before["loading"] or before["modal"] or before["story"] or not before["hero"]:
                raise RuntimeError("Combat view interrupted")
            row = {"index": i, "inputPhase": "before" if i < 2 else "held" if i < 4 else "released",
                   "before": before, "captureStartUtc": _utc(),
                   "captureStartMs": round((time.monotonic() - start) * 1000, 1)}
            if not report["frames"]:
                report["initialStage"] = before["stage"]
            if before["stage"] != report["initialStage"]:
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
            if (after["zone"], after["layer"], after["stage"]) != (before["zone"], before["layer"], before["stage"]):
                raise RuntimeError("Scene or encounter stage changed across the capture")
            if i != 7:
                time.sleep(.08)
    except Exception as exc:
        report["issues"].append(f"{type(exc).__name__}: {exc}")
    finally:
        if key_may_be_down:
            try:
                key("keyUp")
                report["inputReleased"] = True
            except Exception as exc:
                report["issues"].append(f"Key release failed: {exc}")

    advances = sum(b > a for a, b in zip(serials, serials[1:]))
    if len(report["frames"]) != 8 or len(hashes) < 2 or advances == 0:
        report["issues"].append("Eight samples with distinct pixels and advancing game serials were not established")
    states = [row[k] for row in report["frames"] for k in ("before", "after") if row.get(k)]
    if not any(state["targetReportedVisible"] for state in states):
        report["issues"].append("Selected living enemy not reported on screen during the sequence")
    post = [row[k] for row in report["frames"] if row["inputPhase"] != "before"
            for k in ("before", "after") if row.get(k)]
    health = [state["target"]["hp"] for state in states if state.get("target")]
    report["witness"] = {
        "nativeHeroAttackAnimationSeenAfterInput": any(state["hero"]["attackAnim"] > 0 for state in post if state.get("hero")),
        "targetHpDecreaseObserved": any(b < a for a, b in zip(health, health[1:])),
        "hazardSeenAfterInput": any(state["hazardCount"] for state in post),
        "observedStages": list(dict.fromkeys(state["stage"] for state in states)),
    }
    report["uniqueFrames"] = len(hashes)
    report["rendererAdvances"] = advances
    report["vfxReviewed"] = False
    report["status"] = "CAPTURED" if not report["issues"] and report["inputReleased"] else "INCOMPLETE"
    checkpoint()
    return {key: report[key] for key in ("status", "uniqueFrames", "rendererAdvances", "inputReleased",
                                        "initialStage", "witness", "qualification", "issues") if key in report} | {
        "manifest": f"{prefix}/sequence.json", "files": [row["file"] for row in report["frames"]]}
