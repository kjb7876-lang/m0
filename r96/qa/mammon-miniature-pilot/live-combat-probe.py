#!/usr/bin/env python3
"""Record a real manual basic attack in a disposable Mammon session, without repositioning actors."""
import argparse
import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path
import shutil
import signal
import sys
import time

QA = Path.cwd() / "r96/qa/mammon-miniature-pilot"
VIEWS = {"pc": (1920, 1080, 1), "mobile": (390, 844, 3)}
SEED = 77


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


# Queried state, native sight and screen coordinates only. No scene/actor mutation.
OBSERVATION = """
const targetId=arguments[0],r=typeof room==='undefined'?null:room,p=typeof player==='undefined'?null:player;
const renderer=window.__STORYWORLD_PHASE1__,engine=renderer?.controller?.state?.three,visual=renderer?.inspect?.();
const gl=engine?.renderer?.getContext?.(),ext=gl?.getExtension('WEBGL_debug_renderer_info');
const inZone=r?.id==='ep1b06',g=inZone?window.__STORYWORLD_ENEMY_STATUS24__?.snapshot():null;
const bounds=(document.getElementById('phase1-webgl')||canvas)?.getBoundingClientRect();
const actual=r?.enemies||[],range=p?HEROES[p.hero]?.range:null;
const candidates=(g?.enemies||[]).filter(e=>e.active&&e.renderEligible&&e.sightVisible&&e.image.ready&&e.hp>0&&e.combatLineClear&&(e.footOnScreen||e.bodyIntersects))
 .map(e=>{const foot=e.screen||project(e.x,e.y);const x=bounds.left+foot.x,y=bounds.top+foot.y;
    const bodyY=y-Math.max(5,actorHeight()*.28);
    const margin=Math.min(x-bounds.left,bounds.right-x,y-bounds.top,bounds.bottom-y);
    const canvasHit=(document.elementFromPoint(x,y)===canvas||document.elementFromPoint(x,bodyY)===canvas);
    return {id:e.id,nativeId:e.nativeId,hp:e.hp,maxHp:e.maxHp,distance:e.distance,x:e.x,y:e.y,
      centerMargin:margin,canvasHit,imageReady:e.image.ready,clearLine:e.combatLineClear,
      central:margin>=Math.min(bounds.width,bounds.height)*.06,screen:[x,y]};
 }).filter(e=>e.canvasHit&&e.central);
const listed=targetId==null?null:actual.find(e=>e.id===targetId);
if(arguments[1]===true){
 // The reference belongs to the QA page only. The game actor and its array are untouched.
 window.__mammonLiveProbeTarget=listed?{room:r,id:targetId,actor:listed}:null;
}
const kept=window.__mammonLiveProbeTarget;
const held=!!(targetId!=null&&kept?.room===r&&kept.id===targetId);
const focus=held?kept.actor:listed;

const nearest=inZone?actual.filter(e=>visible3(e)&&renderable3(e)&&e.hp>0&&!e.disabled&&e.visible!==false)
 .map(e=>({id:e.id,x:e.x,y:e.y,hp:e.hp,major:e.boss||e.midboss,champion:!!e.wardChampionR81,
          distance:distance(p,e)})).sort((a,b)=>a.distance-b.distance||String(a.id).localeCompare(String(b.id))).slice(0,5):[];
return {zone:r?.id||null,layer:typeof layer==='undefined'?null:layer,started:typeof started!=='undefined'&&started,
 loading:typeof loading!=='undefined'&&loading,modal:typeof modal!=='undefined'&&!!modal,story:typeof storyScene!=='undefined'&&!!storyScene,
 phase:inZone?window.__STORYWORLD_WORLD_COMBAT_R78__?.state(r)?.phase:null,fieldCleared:inZone&&!!r.cleared,
 gameTime:typeof time==='undefined'?null:time,serial:engine?.serial,renderer:visual?.active,
 rendererFailed:visual?.failed,rendererReason:visual?.reason,glLost:gl?.isContextLost(),
 gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null,notice:document.getElementById('webglNoticeR221')?.textContent||null,
 viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,guide:typeof guide!=='undefined'&&guide,auto:typeof auto!=='undefined'&&auto,
 player:p?{x:p.x,y:p.y,hp:p.hp,attackCD:p.attackCD,attackAnim:p.attackAnim,hero:p.hero,combo:p.combo}:null,
 selectedTarget:typeof target==='undefined'?null:target,range,candidates,nearest,
 sightTarget:focus?{id:focus.id,x:focus.x,y:focus.y,hp:focus.hp,spawnState:focus.spawnState,deadRecorded:!!focus.deadRecorded,referenceSource:held?'exact-preinput-actor':'native-list',
   originalObjectInArray:actual.includes(focus),currentListIdIsSameObject:listed===focus}:null,
 difficulty:!!document.querySelector('#r71DifficultyConfirm')?.getClientRects().length};
"""

# Read-only query for a screen waypoint. The subsequent pointer event drives the real game.
WAYPOINT = """
const id=arguments[0],e=room.enemies.find(a=>a.id===id&&a.hp>0),rect=canvas.getBoundingClientRect();
if(!e)return null;
let path=findPath(player,{x:e.x,y:e.y},room)||[];
const options=[...path].reverse();
for(const p of options){
 const d=Math.hypot(p.x-player.x,p.y-player.y);if(d<.45)continue;
 const q=project(p.x,p.y),x=Math.round(rect.left+q.x),y=Math.round(rect.top+q.y);
 if(x<rect.left+8||y<rect.top+8||x>=rect.right-8||y>=rect.bottom-8||document.elementFromPoint(x,y)!==canvas)continue;
 return {x,y,world:[p.x,p.y]};
}return null;
"""


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--url", required=True)
    ap.add_argument("--view", required=True, choices=VIEWS)
    ap.add_argument("--variant", required=True, choices=("before", "after"))
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--max-seconds", type=int, default=180)
    args = ap.parse_args()
    if not 1 <= args.max_seconds <= 180:
        ap.error("The probe wall-time limit is 1 to 180 seconds")
    args.out.mkdir(parents=True, exist_ok=True)
    if any(args.out.iterdir()):
        ap.error("Use a new or empty artifact directory")
    wb = load_module("mammon_preview_driver", QA / "browser-check.py")
    url = wb.local_url(args.url)
    w,h,dpr=VIEWS[args.view]
    start=time.monotonic()
    deadline=start+args.max_seconds
    report={"status":"INCOMPLETE","variant":args.variant,"view":args.view,"url":url,"seed":SEED,
            "requestedCSS":[w,h],"requestedDPR":dpr,"budgetSeconds":args.max_seconds,
            "method":"Fresh profile, real 777 UI travel, seeded RNG, native movement/guide and manual key 1. No actor or camera relocation, HP/phase/door/save injection.",
            "naturalCampaign":False,"hardware":False,"inputs":[],"progress":[],"shots":[],"issues":[]}
    def elapsed():
        return round(time.monotonic()-start,3)
    def save():
        temp=args.out/"live-result.tmp"
        temp.write_text(json.dumps(report,ensure_ascii=False,indent=2,allow_nan=False)+"\n")
        temp.replace(args.out/"live-result.json")
    def note(action,**data):
        report["inputs"].append({"wallSeconds":elapsed(),"action":action,**data})
    def observe(s,id=None,*,keep_target=False):
        return s.js(OBSERVATION,id,keep_target)
    def screenshot(s,name):
        path=args.out/(name+".png")
        t=elapsed()
        size=s.screenshot(path)
        shot={"name":path.name,"requestedAt":t,"returnedAt":elapsed(),"size":size,
              "sha256":hashlib.sha256(path.read_bytes()).hexdigest()}
        report["shots"]=[old for old in report["shots"] if old["name"]!=shot["name"]]
        report["shots"].append(shot)
        if size!=[w*dpr,h*dpr]:
            report["issues"].append("Unexpected screenshot dimensions: "+path.name)
        return shot
    def menu(s):
        if s.js("return !!document.querySelector('#menuBtn')?.getClientRects().length"):
            s.click("#menuBtn")
            return "menu button"
        s.key("\ue00c",65)
        s.until("document.querySelector('#menuClose')?.getClientRects().length",8)
        return "Escape (keyboard on mobile viewport)"
    def pointer(s,point):
        s.call("/actions",{"actions":[{"type":"pointer","id":"route-mouse","parameters":{"pointerType":"mouse"},
            "actions":[{"type":"pointerMove","duration":0,"origin":"viewport","x":point["x"],"y":point["y"]},
                       {"type":"pointerDown","button":2},{"type":"pointerUp","button":2}]}]})
        note("native canvas right-click move",point=point)
    def armed(m):
        return [e for e in m["candidates"] if e["distance"]<=m["range"]]
    def alive(m,id):
        return next((e for e in armed(m) if e["id"]==id),None)
    def interrupt(*_):
        raise TimeoutError("probe wall-time budget exhausted")
    signal.signal(signal.SIGALRM,interrupt)
    signal.setitimer(signal.ITIMER_REAL,args.max_seconds)
    try:
        driver=shutil.which("chromedriver")
        chrome=shutil.which("google-chrome") or shutil.which("chromium")
        if os.geteuid()==0 or not driver or not chrome:
            raise RuntimeError("Non-root sandboxed Chrome and ChromeDriver are required")
        with wb.Session(driver,chrome,args.out/"driver.log") as s:
            s.cdp("Emulation.setDeviceMetricsOverride",{"width":w,"height":h,"deviceScaleFactor":dpr,"mobile":args.view=="mobile"})
            if args.view=="mobile":s.cdp("Emulation.setTouchEmulationEnabled",{"enabled":True})
            try:
                s.call("/url",{"url":url})
                s.click("#campaignNew54");s.click("#slotConfirmR73")
                s.until("typeof started!=='undefined'&&started&&!loading")
                while s.js("return !!storyScene"):
                    s.key("\ue007",65);note("Enter while actual initial story is active");time.sleep(.12)
                # This is the only non-read-only evaluation; it sets fixture RNG, not game state.
                s.js("let n=arguments[0]>>>0;Math.random=()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);",SEED)
                method=menu(s);s.click("[data-r339-proxy='story-code-button']")
                el=s.call("/element",{"using":"css selector","value":"#story-code-input"})
                s.call("/element/"+el[wb.ELEMENT]+"/value",{"text":"777","value":list("777")})
                s.click("#codeApply")
                option="#codeMap option[value='ep1b06']";s.until("document.querySelector("+json.dumps(option)+")")
                selected=s.call("/element",{"using":"css selector","value":option})
                s.call("/element/"+selected[wb.ELEMENT]+"/click",{})
                if not s.js("return document.getElementById('codeMap').value==='ep1b06'"):
                    raise RuntimeError("777 selected a different region")
                s.click("#codeGo");note("actual 777 region UI",menu=method)
                entered=False;last_progress=-9;last_move=-9;guide_enabled_once=False;target_id=None;initial_pre=None
                seek_id=None;last_seek_distance=None
                while time.monotonic()<deadline-6:
                    m=observe(s,target_id);report["lastObserved"]=m;now=time.monotonic()-start
                    if m["notice"] or m["rendererFailed"]:
                        raise RuntimeError("Renderer failed: "+str(m["notice"] or m["rendererReason"]))
                    if m["difficulty"]:
                        s.click("[data-r71-tier='normal']");s.click("#r71DifficultyConfirm");note("actual normal difficulty UI");continue
                    if m["story"]:
                        s.key("\ue007",65);note("Enter while actual story is active");time.sleep(.12);continue
                    if m["loading"] or m["zone"]!="ep1b06":
                        if entered and not m["loading"]:raise RuntimeError("Left Mammon before the encounter")
                        time.sleep(.2);continue
                    if not entered:
                        entered=True
                        if m["renderer"]!="three" or m["glLost"] is not False:raise RuntimeError("No active Three/WebGL scene")
                        if m["viewport"]!=[w,h] or m["dpr"]!=dpr:raise RuntimeError("Requested viewport or DPR was not applied")
                        report["arrival"]=m
                        L=s.js("const l=room.exploration;return {cells:l.floorCells,walls:l.walls.map(w=>[w.x,w.y,w.width,w.depth,w.height,w.angle||0]),doors:l.worldR74.doors.map(d=>[d.id,d.x,d.y,d.width]),entry:l.entry};")
                        report["layoutSha256"]=hashlib.sha256(json.dumps(L,ensure_ascii=False,sort_keys=True,separators=(",",":")).encode()).hexdigest()
                    if m["player"]["hp"]<=0:raise RuntimeError("Player died before combat evidence")
                    if now-last_progress>=6:
                        report["progress"].append({"wallSeconds":elapsed(),"gameTime":m["gameTime"],"phase":m["phase"],
                            "pos":[m["player"]["x"],m["player"]["y"]],"guide":m["guide"],"auto":m["auto"],"nearest":m["nearest"][:1],
                            "visibleAttackable":[e["id"] for e in armed(m)]});last_progress=now;save()
                    if m["modal"]:
                        time.sleep(.25);continue
                    choices=armed(m)
                    if choices:
                        # Choose the same actor the carried target / nearest-melee rule would select.
                        choices.sort(key=lambda e:(e["id"]!=m["selectedTarget"], e["distance"],str(e["id"])))
                        target_id=choices[0]["id"]
                        if m["guide"]:
                            method=menu(s);s.click("#menuGuide");note("turned native guide off via UI",menu=method);continue
                        if m["auto"]:
                            s.key(" ",80);note("Space to disable native auto attack");continue
                        if m["player"]["attackCD"]>.02:
                            time.sleep(.12);continue
                        initial_pre=observe(s,target_id)
                        if not alive(initial_pre,target_id):continue
                        report["beforeShotState"]=initial_pre
                        screenshot(s,"before-attack")
                        pre=observe(s,target_id,keep_target=True);report["atManualInput"]=pre
                        if (not alive(pre,target_id) or pre["phase"]!=initial_pre["phase"] or pre["player"]["attackCD"]>.02
                            or pre["guide"] or pre["auto"]):
                            note("Skipped input because target or readiness changed during screenshot",target=target_id);continue
                        note("manual physical 1 basic attack request",target=target_id,phase=pre["phase"],hp=pre["sightTarget"]["hp"])
                        s.key("1",80);note("manual physical 1 acknowledged",target=target_id)
                        # Take actual screen pixels FIRST, before requesting post-input diagnostics.
                        screenshot(s,"after-attack");post=observe(s,target_id)
                        report["afterShotState"]=post;report["targetId"]=target_id
                        time.sleep(.12);screenshot(s,"after-attack-followup");later=observe(s,target_id);report["followupState"]=later
                        old=pre["sightTarget"]["hp"];pstates=[post,later]
                        reduced=any(z["sightTarget"] and z["sightTarget"]["hp"]<old for z in pstates)
                        death=any(z["sightTarget"] and z["sightTarget"]["referenceSource"]=="exact-preinput-actor" and
                                  (z["sightTarget"]["hp"]<=0 or z["sightTarget"]["deadRecorded"]) for z in pstates)
                        animated=any(z["player"]["combo"]!=pre["player"]["combo"] or z["player"]["attackCD"]>pre["player"]["attackCD"]+.01 or z["player"]["attackAnim"]>0 for z in pstates)
                        seen_after=any(any(e["id"]==target_id for e in z["candidates"]) for z in pstates)
                        report["witness"]={"sameTargetHpReduced":bool(reduced),"sameTargetDeath":bool(death),"nativeAttackResponse":bool(animated),
                         "targetVisibleAfter":seen_after,"otherNativeCombatMayContribute":True,
                         "playerDisplacement":math.hypot(post["player"]["x"]-pre["player"]["x"],post["player"]["y"]-pre["player"]["y"]),
                         "gameTimeFromInputToPostObservation":post["gameTime"]-pre["gameTime"]}
                        if ((reduced and seen_after) or death) and not report["issues"]:
                            report["status"]="CAPTURED_NATIVE_HIT"
                        else:report["issues"].append("Manual input issued; same-target visible damage/death was not established")
                        break
                    # Use the real guide once and take over with actual canvas clicks toward
                    # an ordinary field enemy only if the native route points away from it.
                    if not guide_enabled_once:
                        if not m["guide"]:
                            method=menu(s);s.click("#menuGuide");note("turned native guide on via UI",menu=method)
                        guide_enabled_once=True;continue
                    candidates=sorted(m["nearest"],key=lambda e:(bool(e.get("major")), bool(e.get("champion")),e["distance"],str(e["id"])))
                    chase=next((e for e in candidates if e["id"]==seek_id and e["distance"]<30),None) or (candidates[0] if candidates else None)
                    if chase and now-last_move>1.7:
                        seek_id=chase["id"]
                        if (not m["guide"] or chase["distance"]<18 or last_seek_distance is not None and chase["distance"]>=last_seek_distance-.15):
                            pt=s.js(WAYPOINT,seek_id)
                            if pt:
                                pointer(s,pt)
                                # Native canvas input cancels guide. Disable residual auto so an
                                # unobserved auto hit does not consume the selected encounter.
                                if s.js("return !!auto&&!guide"):
                                    s.key(" ",80);note("Space after native canvas steering")
                        last_seek_distance=chase["distance"];last_move=now
                    time.sleep(.16)
                if report["status"]=="INCOMPLETE" and not report["issues"]:
                    report["issues"].append("No eligible live native encounter before wall-time limit")
                if report["status"]!="CAPTURED_NATIVE_HIT" and time.monotonic()<deadline-2:
                    screenshot(s,"diagnostic-actual-view")
            finally:
                if time.monotonic()<deadline-1:
                    try:s.js("delete window.__mammonLiveProbeTarget;")
                    except Exception:pass
                    try:report["console"]=s.call("/log",{"type":"browser"})
                    except Exception as exc:report["issues"].append("Console: "+str(exc))
    except Exception as exc:
        report["issues"].append(str(exc))
    finally:
        signal.setitimer(signal.ITIMER_REAL,0)
        report["elapsedSeconds"]=elapsed()
        report["comparisonQualification"]="No claim of a matched cross-build encounter until the two actual target IDs, phases, layout and observed input coordinates are compared."
        save()
    print(args.variant,args.view,report["status"],"s",report["elapsedSeconds"],report["issues"],flush=True)
    return 0 if report["status"]=="CAPTURED_NATIVE_HIT" else 2

if __name__=="__main__":
    raise SystemExit(main())
