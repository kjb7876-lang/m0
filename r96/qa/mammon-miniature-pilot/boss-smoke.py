#!/usr/bin/env python3
"""Targeted native-door/encounter/exit smoke. Every write to the disposable game is listed."""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import shutil
import signal
import sys
import time

here = Path(__file__).parent
spec = importlib.util.spec_from_file_location("mammon_webdriver", here / "browser-check.py")
web = importlib.util.module_from_spec(spec)
spec.loader.exec_module(web)

OBS = """
const r=room,s=window.__STORYWORLD_WORLD_COMBAT_R78__?.state?.(r),routes=window.__STORYWORLD_ROUTES_R72__,
 w=window.__STORYWORLD_WORLD_R74__, alive=e=>e.hp>0&&!e.deadRecorded&&e.spawnState!=='dead',
 major=e=>(e.boss||e.midboss)&&!e.wardChampionR81,
 field=e=>!major(e)&&!e.persona&&!e.trial&&!e.cosmic&&!e.r61Summoned&&!e.r61Clone;
return {zone:r?.id,layer,phase:s?.phase||null,hp:player.hp,pos:[player.x,player.y],gameTime:time,
 story:!!storyScene,loading,modal,active:window.__STORYWORLD_PHASE1__?.inspect?.().active,
 cleared:r?.cleared===true,progress:completed(r.id),doorStory:s?.doorStoryDone,exitStory:s?.exitStoryDone,
 fields:(r.enemies||[]).filter(e=>alive(e)&&field(e)).length,
 bosses:(r.enemies||[]).filter(e=>alive(e)&&major(e)).map(e=>({id:e.id,x:e.x,y:e.y,hp:e.hp,state:e.spawnState})),
 doors:(r.exploration?.worldR74?.doors||[]).map(d=>({id:d.id,x:d.x,y:d.y,open:w.isOpen(r,d)})),
 next:r.id==='ep1b06'?routes.destination('next'):null,
 portals:r.id==='ep1b06'?routes.visibleDirections().map(d=>({direction:d,...routes.status(d)})):[]};
"""
WARP = """
const p=arguments[0],L=room.exploration,spots=[p,...L.floorCells.map(([a,b])=>[a+.5,b+.5])
.filter(q=>Math.hypot(q[0]-p[0],q[1]-p[1])<=2).sort((a,b)=>Math.hypot(a[0]-p[0],a[1]-p[1])-Math.hypot(b[0]-p[0],b[1]-p[1]))];
const q=spots.find(v=>!blocked(v[0],v[1],undefined,room));if(!q)throw Error('no native walkable fixture position');
player.x=q[0];player.y=q[1];route=[];command=null;return q;
"""
def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url",required=True)
    parser.add_argument("--out",required=True,type=Path)
    args=parser.parse_args()
    url=web.local_url(args.url)
    args.out.mkdir(parents=True,exist_ok=False)
    result={"status":"INCOMPLETE","naturalProgression":False,
            "method":"777 assisted, player position, field HP=0 and native boss HP=1 fixtures. Doors, phases, region and story results never set.",
            "hardware":False,"steps":[],"injections":[],"inputs":[]}
    started=time.monotonic()
    def logkey(session,key,ms=85):
        result["inputs"].append({"key":key,"wall":round(time.monotonic()-started,2)})
        session.key(key,ms)
    def note(session,label,photo=False):
        row=session.js(OBS)
        result["steps"].append({"label":label,"wall":round(time.monotonic()-started,2),"state":row})
        print(label,row["zone"],row["phase"],row["fields"],len(row["bosses"]),flush=True)
        if photo:session.screenshot(args.out/(label+".png"))
        return row
    def warp(session,label,pt):
        q=session.js(WARP,pt)
        result["injections"].append({"kind":"player-position and clear path command","label":label,"requested":pt,"actual":q})
    def wait(session,pred,limit=25,story_keys=False,attack=False):
        end=time.monotonic()+limit
        while time.monotonic()<end:
            m=session.js(OBS)
            if pred(m):return m
            if story_keys and m["story"]:logkey(session,"\ue007")
            if attack and not m["modal"] and not m["story"] and not m["loading"]:
                for key in ("a","1","w"):logkey(session,key,150)
            time.sleep(.18)
        raise RuntimeError("native transition not observed: "+str([m["zone"],m["phase"],m["fields"],m["bosses"]]))
    def check(condition,msg):
        if not condition:raise RuntimeError(msg)
    def expire(*unused):raise TimeoutError("targeted fixture time budget expired")
    signal.signal(signal.SIGALRM,expire)
    signal.setitimer(signal.ITIMER_REAL,300)
    try:
        driver=shutil.which("chromedriver");chrome=shutil.which("google-chrome") or shutil.which("chromium")
        if os.geteuid()==0 or not driver or not chrome:raise RuntimeError("non-root sandboxed Chrome+ChromeDriver required")
        with web.Session(driver,chrome,args.out/"driver.log") as session:
            session.cdp("Emulation.setDeviceMetricsOverride",{"width":960,"height":600,"deviceScaleFactor":1,"mobile":False})
            session.call("/url",{"url":url})
            session.click("#campaignNew54");session.click("#slotConfirmR73")
            session.until("typeof started!=='undefined'&&started&&!loading");session.js(web.SKIP)
            session.js("return __STORYWORLD_CHEAT777__.activate('777')")
            session.await_js("await __STORYWORLD_CHEAT777__.go('ep1b06','STORY');")
            session.await_js("const p=__STORYWORLD_PROGRESSION_R71__;if(p.difficultyState().open){p.selectDifficulty('normal');await p.confirmDifficulty();}")
            session.until("!loading&&room?.id==='ep1b06'");session.js(web.SKIP)
            result["injections"].append({"kind":"777 travel, difficulty and arrival story skip"})
            a=note(session,"arrival")
            check(a["zone"]=="ep1b06" and a["active"]=="three" and a["phase"]=="route","unexpected arrival")
            expected=a["next"];result["expectedDestination"]=expected
            check(bool(expected),"native next destination missing")
            if session.js("return guide"):session.click("#menuBtn");session.click("#menuGuide")
            geometry=session.js("const g=room.exploration.worldWardR81;return {gather:[g.gatherAnchor.x,g.gatherAnchor.y],boss:[g.bossAnchor.x,g.bossAnchor.y]}")
            warp(session,"native gather anchor",geometry["gather"])
            wait(session,lambda m:m["phase"]=="rally")
            a=note(session,"rally")
            check(a["fields"]>0 and not next(d for d in a["doors"] if d["id"]=="door-0")["open"],"locked gate prerequisite absent")
            removed=session.js("""
            const selected=room.enemies.filter(e=>e.hp>0&&!e.deadRecorded&&e.spawnState!=='dead'&&(!(e.boss||e.midboss)||e.wardChampionR81)&&!e.persona&&!e.trial&&!e.cosmic&&!e.r61Summoned&&!e.r61Clone);
            const rows=selected.map(e=>({id:e.id,previous:e.hp}));for(const e of selected)e.hp=0;return rows;
            """)
            result["injections"].append({"kind":"skip field combat by setting remaining field HP=0","enemies":removed})
            wait(session,lambda m:m["phase"]=="door");a=note(session,"field-fixture-door-ready")
            door=next(d for d in a["doors"] if d["id"]=="door-0")
            warp(session,"boss door approach",[door["x"]+.4,door["y"]+1.1])
            key=session.js("return KR291.i.toLowerCase()");logkey(session,key)
            wait(session,lambda m:m["phase"]=="boss",story_keys=True)
            a=note(session,"boss-door-open",True)
            check(a["doorStory"] and next(d for d in a["doors"] if d["id"]=="door-0")["open"],"native gate not open")
            warp(session,"native boss room",geometry["boss"])
            a=wait(session,lambda m:any(e["state"]=="active" for e in m["bosses"]),limit=42)
            note(session,"native-boss-active",True)
            weakened=session.js("""
            const b=room.enemies.filter(e=>(e.boss||e.midboss)&&!e.wardChampionR81&&e.hp>0&&!e.deadRecorded);
            const log=b.map(e=>({id:e.id,previous:e.hp}));for(const e of b)e.hp=Math.min(e.hp,1);return log;
            """)
            check(bool(weakened),"no live native boss to test")
            result["injections"].append({"kind":"native living boss HP capped at 1 for targeted hit; no kill or state injected","enemies":weakened})
            for _ in range(len(weakened)+2):
                a=session.js(OBS)
                if a["phase"]=="exit":break
                target=next((e for e in a["bosses"] if e["state"]=="active"),None)
                if not target:
                    time.sleep(.4);continue
                oldlen=len(a["bosses"])
                warp(session,"adjacent to native boss "+target["id"],[target["x"]+.8,target["y"]+.6])
                wait(session,lambda m:len(m["bosses"])<oldlen or m["phase"]=="exit",limit=35,attack=True)
            a=note(session,"after-boss-inputs")
            check(a["phase"]=="exit" and not a["bosses"],"native boss death/exit phase not confirmed")
            door=next(d for d in a["doors"] if d["id"]=="door-2")
            warp(session,"exit door approach",[door["x"]+.4,door["y"]+1.15]);logkey(session,key)
            wait(session,lambda m:m["phase"]=="done",limit=45,story_keys=True)
            a=note(session,"native-exit-story-complete",True)
            check(a["exitStory"] and a["progress"] and a["cleared"],"native completion flags missing")
            forward=next((p for p in a["portals"] if p["role"]=="next" and p["open"] and p["destination"]==expected),None)
            check(forward,"native onward portal not available")
            pt=forward["point"];warp(session,"open onward portal",[pt["x"],pt["y"]])
            last_interaction=0
            deadline=time.monotonic()+42
            while time.monotonic()<deadline:
                m=session.js(OBS)
                if m["zone"]==expected and not m["loading"]:break
                dialog=session.js("return !!document.querySelector('#r71DifficultyConfirm')?.getClientRects().length")
                if dialog:
                    session.click("[data-r71-tier='normal']")
                    session.click("#r71DifficultyConfirm")
                    result["inputs"].append({"action":"choose normal and confirm next-region difficulty dialog","wall":round(time.monotonic()-started,2)})
                elif m["zone"]=="ep1b06" and not (m["loading"] or m["modal"] or m["story"]) and time.monotonic()-last_interaction>2:
                    logkey(session,key);last_interaction=time.monotonic()
                elif m["story"] and not m["loading"]:
                    logkey(session,"\ue007")
                time.sleep(.3)
            end=note(session,"onward-region",True)
            check(end["zone"]==expected and not end["loading"],"next region not entered")
            result["status"]="PASSED_FIXTURE_ONLY"
    except Exception as exc:
        result["error"]=str(exc)
    finally:
        signal.setitimer(signal.ITIMER_REAL,0)
        result["wallSeconds"]=round(time.monotonic()-started,2)
        (args.out/"boss-result.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n")
        print(result["status"],result.get("error",""),flush=True)
    return 0 if result["status"]=="PASSED_FIXTURE_ONLY" else 2
if __name__=="__main__":sys.exit(main())
