#!/usr/bin/env python3
"""One disposable PC session. Enter Mammon through 777 UI, then drive native game inputs."""
import argparse, importlib.util, json, math, os, pathlib, shutil, signal, sys, time

OBSERVE="""
const r=typeof room==='undefined'?null:room,p=typeof player==='undefined'?null:player,
 w=window.__STORYWORLD_WORLD_COMBAT_R78__,s=r?w?.state?.(r):null, renderer=window.__STORYWORLD_PHASE1__?.inspect?.();
const controls=window.__STORYWORLD_KEYS_R291__,gl=window.__STORYWORLD_PHASE1__?.controller?.state?.three?.renderer?.getContext?.(),ext=gl?.getExtension('WEBGL_debug_renderer_info');
const slots=p?(controls?.liveSlots?.(p.hero)||[]).map(k=>controls.table['skill'+k.toUpperCase()]?.[0]).filter(Boolean):[];
const alive=e=>e.hp>0&&!e.deadRecorded&&e.spawnState!=='dead';
const field=e=>alive(e)&&(!(e.boss||e.midboss)||e.wardChampionR81)&&!e.persona&&!e.trial&&!e.cosmic&&!e.r61Summoned&&!e.r61Clone;
const foes=(r?.enemies||[]).filter(e=>alive(e)&&visible3(e)&&renderable3(e));
let nextPortal=null;
if(r?.id==='ep1b06'){
 const api=window.__STORYWORLD_ROUTES_R72__,to=api?.destination('next'),exits=regionById[r.id].exits||{};
 const dir=Object.keys(exits).find(d=>exits[d]===to),status=dir?api.status(dir):null,points=api?.points();
 nextPortal={destination:to??null,direction:dir??null,statusDestination:status?.destination??null,
  next:points?.next||null,statusPoint:status?.point||null,authored:points?.authored||null,
  sourceTo:dir?r.exploration?.sourceExits?.[dir]?.to??null:null,open:status?.open===true};
}
const nearest=p?foes.slice().sort((a,b)=>distance(p,a)-distance(p,b))[0]:null;
const art=window.__STORYWORLD_MAMMON_MINIATURE_PILOT__?.inspect();
return {hero:p?.hero,slots,nextPortal,mammonRegistered:art?.registered===true,artRevision:art?.revision||null,
 viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null},
 nearest:nearest?{id:nearest.id,x:nearest.x,y:nearest.y,hp:nearest.hp,maxHp:nearest.maxHp,distance:distance(p,nearest)}:null,
 started:typeof started!=='undefined'&&started,loading:typeof loading!=='undefined'&&loading,
 modal:typeof modal!=='undefined'&&!!modal, story:typeof storyScene!=='undefined'&&!!storyScene,zone:r?.id||null,
 layer:typeof layer==='undefined'?null:layer,phase:s?.phase||null,route:s?.route,rallied:s?.rallied?.length,
 field:(r?.enemies||[]).filter(field).length,
 majors:(r?.enemies||[]).filter(e=>e.hp>0&&(e.boss||e.midboss)&&!e.wardChampionR81&&!e.deadRecorded).length,
 pos:p?[p.x,p.y]:null,hp:p?.hp||0,guide:typeof guide!=='undefined'&&guide,auto:typeof auto!=='undefined'&&auto,
 gameTime:typeof time==='undefined'?null:time, active:renderer?.active, failed:renderer?.failed,reason:renderer?.reason,
 notice:document.getElementById('webglNoticeR221')?.innerText||null,
 doors:r?.exploration?.worldR74?.doors?.filter(d=>d.id!=='door-1').map(d=>({id:d.id,x:d.x,y:d.y,
 open:window.__STORYWORLD_WORLD_R74__?.isOpen?.(r,d)??null}))||[],
 interactKey:typeof KR291==='undefined'?'c':KR291.i.toLowerCase(),
 difficulty:!!document.querySelector('#r71DifficultyConfirm')?.getClientRects().length,
 completed:r?.id==='ep1b06'&&r?.cleared===true};
"""
# Read the game path/projection to select a real unobstructed canvas coordinate.
# No route, player, door, health, enemy, storage or phase is assigned by this code.
POINT="""
const g=arguments[0],path=findPath(player,{x:g[0],y:g[1]},room)||[],rect=canvas.getBoundingClientRect();
for(const p of path.slice().reverse()){
 const pos=project(p.x,p.y),x=Math.round(rect.left+pos.x),y=Math.round(rect.top+pos.y);
 if(x<5||y<5||x>=innerWidth-5||y>=innerHeight-5||document.elementFromPoint(x,y)!==canvas)continue;
 if(Math.hypot(p.x-player.x,p.y-player.y)<.5)continue;
 return {x,y,world:[p.x,p.y]};}return null;
"""
def visible(s,sel):
    return bool(s.js("return !!document.querySelector(arguments[0])?.getClientRects().length",sel))

def pointer(s,x,y):
    s.call("/actions",{"actions":[{"type":"pointer","id":"mouse","parameters":{"pointerType":"mouse"},
        "actions":[{"type":"pointerMove","duration":0,"origin":"viewport","x":x,"y":y},
                   {"type":"pointerDown","button":2},{"type":"pointerUp","button":2}]}]})

def position(s,goal):
    p=s.js(POINT,goal)
    if p:pointer(s,p["x"],p["y"])
    return p

def guide_on(s):
    if s.js("return guide"):return
    s.click("#menuBtn");s.click("#menuGuide")

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--runner",type=pathlib.Path,default=pathlib.Path(__file__).with_name("browser-check.py"))
    p.add_argument("--url",required=True);p.add_argument("--out",required=True,type=pathlib.Path)
    p.add_argument("--max-seconds",default=600,type=int)
    a=p.parse_args()
    if not 1<=a.max_seconds<=600:p.error("choose a wall time from 1 to 600 seconds")
    mod=importlib.util.spec_from_file_location("mammon_capture",a.runner);wb=importlib.util.module_from_spec(mod);mod.loader.exec_module(wb)
    url=wb.local_url(a.url);a.out.mkdir(parents=True,exist_ok=False)
    result={"status":"BLOCKED","scope":"777 UI assisted entry; native guide + input only after entry",
            "maxWallSeconds":a.max_seconds,"phaseTransitions":[],"samples":[],"inputLog":[],"naturalCampaign":False,
            "hpPositionPhaseOrSaveInjection":False,"freshProfile":True}
    t0=time.monotonic()
    def record(action):result["inputLog"].append({"wallSeconds":round(time.monotonic()-t0,2),"action":action})
    def phase_photo(session, name):
        if name not in ("route","rally","door","doorStory","boss","exit","exitStory","done"):return
        dst=a.out/("phase-"+name+".png")
        if not dst.exists():
            try:session.screenshot(dst);result.setdefault("phasePhotos",[]).append(dst.name)
            except Exception as e:result.setdefault("photoIssues",[]).append(str(e))
    def expire(*unused):raise TimeoutError("route wall time budget exhausted")
    signal.signal(signal.SIGALRM,expire);signal.setitimer(signal.ITIMER_REAL,a.max_seconds)
    try:
        driver,chrome=shutil.which("chromedriver"),shutil.which("google-chrome") or shutil.which("chromium")
        if os.geteuid()==0 or not driver or not chrome:raise RuntimeError("non-root sandboxed system Chrome + ChromeDriver required")
        with wb.Session(driver,chrome,a.out/"driver.log") as s:
            s.cdp("Emulation.setDeviceMetricsOverride",{"width":960,"height":600,"deviceScaleFactor":1,"mobile":False})
            try:
                s.call("/url",{"url":url});s.click("#campaignNew54");s.click("#slotConfirmR73")
                s.until("typeof started!=='undefined'&&started&&!loading")
                while s.js("return !!storyScene"):s.key("\ue007",65);time.sleep(.15)
                s.click("#menuBtn");s.click("[data-r339-proxy='story-code-button']")
                el=s.call("/element",{"using":"css selector","value":"#story-code-input"})
                s.call("/element/"+el[wb.ELEMENT]+"/value",{"text":"777","value":list("777")})
                s.click("#codeApply")
                option="#codeMap option[value='ep1b06']"
                s.until("document.querySelector("+json.dumps(option)+")")
                item=s.call("/element",{"using":"css selector","value":option})
                s.call("/element/"+item[wb.ELEMENT]+"/click",{})
                if not s.js("return document.getElementById('codeMap').value==='ep1b06'"):raise RuntimeError("region selection failed")
                s.click("#codeGo");record("777 UI enter ep1b06");last=None;entered=False;interacted=set()
                last_move=0;last_action=0;last_sample=0;last_guide=0;skill_index=0
                while True:
                    m=s.js(OBSERVE);result["lastObserved"]=m;now=time.monotonic()-t0;phase=m["phase"]
                    if m["notice"] or m["failed"]:raise RuntimeError("game renderer unavailable: "+str(m["notice"] or m["reason"]))
                    if entered and m["hp"]<=0:result["status"]="DEAD";break
                    if m["difficulty"]:
                        s.click("[data-r71-tier='normal']");s.click("#r71DifficultyConfirm");record("native normal difficulty UI");continue
                    if m["story"]:
                        s.key("\ue007",60);record("Enter while story active");time.sleep(.15);continue
                    if m["loading"]:time.sleep(.3);continue
                    if m["zone"]=="ep1b06":
                        portal=m["nextPortal"]
                        if not entered:
                            if not portal or not portal["destination"] or portal["destination"]!=portal["statusDestination"]:
                                raise RuntimeError("R72 campaign destination and portal status did not agree")
                            result["originPortal"]=portal
                        entered=True;result["lastOriginPortal"]=portal
                    elif entered:
                        result["destination"]=m["zone"]
                        expected=result["originPortal"]
                        result["arrivedAtBothNativeDestinations"]=(m["zone"]==expected["destination"]==expected["statusDestination"])
                        result["status"]="TRAVERSED" if last=="done" and result["arrivedAtBothNativeDestinations"] else "UNEXPECTED_ZONE"
                        break
                    else:time.sleep(.3);continue
                    if m["active"]!="three":raise RuntimeError("Mammon Three renderer not active")
                    if not m["mammonRegistered"]:raise RuntimeError("Mammon production script is not registered")
                    if phase!=last:
                        result["phaseTransitions"].append({"wallSeconds":round(now,2),"gameTime":m["gameTime"],"from":last,"to":phase})
                        last=phase;phase_photo(s,phase)
                    if now-last_sample>4 or not result["samples"]:
                        result["samples"].append(m);last_sample=now
                        print("route",round(now),m["zone"],phase,m["hp"],m["field"],m["majors"],flush=True)
                    if m["modal"]:time.sleep(.4);continue
                    if not phase:raise RuntimeError("native R78 state absent")
                    if phase in ("route","rally") or phase=="boss" and (m["pos"][1]<19 and m["pos"][0]>6.5 and m["pos"][0]<25.5):
                        if not m["guide"] and now-last_guide>2:guide_on(s);record("native menu guide on");last_guide=now
                        # Preserve the native guide's movement/target. Send genuine skill
                        # and basic inputs when the existing target is close enough.
                        near=m["nearest"]
                        if near and near["distance"]<=8 and now-last_action>1.5:
                            seq=["1"]
                            if m["slots"]:
                                seq.append(m["slots"][skill_index%len(m["slots"])])
                                skill_index+=1
                            actions=[]
                            for key in seq:actions.extend([{"type":"keyDown","value":key},{"type":"pause","duration":80},{"type":"keyUp","value":key}])
                            s.call("/actions",{"actions":[{"type":"key","id":"keyboard","actions":actions}]})
                            record("keys "+"/".join(seq)+" near "+str(near["id"]));last_action=now
                    if phase in ("door","boss","exit","done"):
                        door=next((d for d in m["doors"] if d["id"]==("door-0" if phase=="door" else "door-2")),None)
                        if phase=="boss":goal=[16,13]
                        elif phase=="done":
                            p=m["nextPortal"];point=p["next"];action_point=p["statusPoint"]
                            if p["destination"]!=result["originPortal"]["destination"] or p["statusDestination"]!=p["destination"]:
                                raise RuntimeError("R72 destination changed before exit")
                            if not (p["open"] and point and action_point):
                                time.sleep(.3);continue
                            if math.dist([point["x"],point["y"]],[action_point["x"],action_point["y"]])>.01:
                                raise RuntimeError("R72.points().next and portal interaction point disagree")
                            goal=[point["x"],point["y"]]
                        elif phase=="door":goal=[20,21.2]
                        else:goal=[5,7.2]
                        dist=math.dist(m["pos"],([door["x"],door["y"]] if phase in ("door","exit") and door else goal))
                        reach=2.05 if phase=="done" else 3.1
                        if phase in ("door","exit","done") and dist<reach and now-last_action>.85:
                            s.key(m["interactKey"],85);record(m["interactKey"].upper()+" "+phase);last_action=now;interacted.add(phase)
                        elif (phase!="boss" or m["pos"][1]>=19.5) and now-last_move>1.25:
                            pt=position(s,goal)
                            if pt:record("canvas move toward "+phase+" "+str(pt["world"]))
                            last_move=now
                    time.sleep(.3)
                result["last"]=m;result["interacted"]=sorted(interacted)
            finally:
                if time.monotonic()-t0 < a.max_seconds:
                    try:result["lastObserved"]=s.js(OBSERVE);result["console"]=s.call("/log",{"type":"browser"})
                    except Exception:pass
    except TimeoutError as e:result.update(status="TIMED_OUT",detail=str(e))
    except Exception as e:result.update(status="BLOCKED",detail=str(e))
    finally:
        signal.setitimer(signal.ITIMER_REAL,0)
        result["elapsedSeconds"]=round(time.monotonic()-t0,2)
        samples=result["samples"]
        result["gameElapsedFromFirstMammonSample"]=round(samples[-1]["gameTime"]-samples[0]["gameTime"],4) if samples else None
        result["wallTimeIsSeparateFromGameTime"]=True
        result["qualification"]="Actual menu and key input; skill press does not itself prove damage. 777-assisted entry, no full natural campaign."

        (a.out/"route-result.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n")
        print("route result",result["status"],result.get("detail",""),flush=True)
    return 0 if result["status"]=="TRAVERSED" else 2

if __name__=="__main__":raise SystemExit(main())
