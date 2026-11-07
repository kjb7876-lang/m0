#!/usr/bin/env python3
"""Capture the real game via system ChromeDriver. No install or sandbox override.
Example: python3 browser-check.py --before http://127.0.0.1:4300/ --after http://127.0.0.1:4301/ --out /tmp/mammon-shots
Each site/view uses a disposable new profile. 777 travel/scene skipping and marker
placement are explicit fixtures. This is NOT an end-to-end campaign or a phone test.
"""
import argparse, base64, hashlib, json, math, os, pathlib, shutil, socket, struct, subprocess, sys, tempfile, time
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

ELEMENT = "element-6066-11e4-a52e-4f735466cecf"
VIEWS = {"pc": (1920, 1080, 1), "mobile": (390, 844, 3)}
MARKERS = ("entry", "branch", "records", "gather", "boss-door", "exit", "combat")
SKIP = "for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);return !storyScene;"
STATE = """
const phase=window.__STORYWORLD_PHASE1__, status=phase?.inspect(), engine=phase?.controller?.state?.three;
const gl=engine?.renderer?.getContext?.();const ext=gl?.getExtension('WEBGL_debug_renderer_info');
const overlay=window.__STORYWORLD_MAMMON_MINIATURE_PILOT__?.inspect();
return {zone:room?.id,layer,active:status?.active,failed:status?.failed,reason:status?.reason,
 glRenderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl?gl.getParameter(gl.RENDERER):null,
 glLost:gl?.isContextLost(),drawCalls:engine?.renderer?.info?.render?.calls,
 zoneWide:room?.exploration?.storyMapR171?.wideR379,overlay:overlay||null,
 group:!!engine?.spatialRoot?.getObjectByName('mammon-miniature-pilot'),
 started,loading,modal,story:!!storyScene,player:{x:player.x,y:player.y,hp:player.hp},
 blocked:blocked(player.x,player.y,.34,room), viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,
 doors:room?.exploration?.worldR74?.doors?.map(d=>({id:d.id,closed:d.closed})),
 living:room?.enemies?.filter(e=>e.hp>0).length??0,
 warnings:(typeof hazards==='undefined'?[]:hazards).length,
 attack:{animation:player.attackAnim,cooldown:player.attackCD},
 r224RoomBounds:room?.exploration?.r224Rooms?.length};
"""
MARKER = """
const name=arguments[0],L=room.exploration,ds=L.worldR74.doors;
const n=(id)=>L.nodes.find(n=>n.id===id);
let p=({entry:L.entry,branch:L.nodes.find(n=>n.name==='금고 전실'),records:L.nodes.find(n=>n.name==='기록실'),
 gather:n(2),'boss-door':ds.find(d=>d.id==='door-0'),exit:ds.find(d=>d.id==='door-2')})[name];
if(name==='combat'){
 const live=room.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));
 if(!live.length)return null;p={x:live[0].x+1.5,y:live[0].y,name:'near live enemy'};}
if(!p)return null;
if(name==='exit'||name==='boss-door')p={...p,y:p.y+1.5};
const cells=L.floorCells.map(([x,y])=>({x:x+.5,y:y+.5}))
 .filter(v=>Math.hypot(v.x-p.x,v.y-p.y)<5)
 .sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
const spot=cells.find(v=>!blocked(v.x,v.y,.34,room));
if(!spot)return null;player.x=spot.x;player.y=spot.y;route=[];command=null;
return {marker:name,nativeLabel:p.name||p.id,fixturePosition:spot};
"""

def api(url, method="GET", data=None, timeout=200):
    req = Request(url, data=None if data is None else json.dumps(data).encode(), method=method,
                  headers={"Content-Type": "application/json;charset=utf-8"})
    try:
        with urlopen(req, timeout=timeout) as res:
            value = json.load(res).get("value")
    except HTTPError as exc:
        try: message=json.load(exc)["value"]["message"]
        except Exception: message=str(exc)
        raise RuntimeError(f"{method} {urlsplit(url).path}: {message}") from exc
    if isinstance(value,dict) and value.get("error"):
        raise RuntimeError(f"{method} {urlsplit(url).path}: {value}")
    return value

def local_url(s):
    p=urlsplit(s)
    if p.scheme!="http" or p.hostname not in ("localhost","127.0.0.1","::1") or p.username or p.password:
        raise argparse.ArgumentTypeError("Serve the isolated build via loopback HTTP")
    return s

class Session:
    def __init__(self, driver, chrome, log):
        self.driver,self.chrome,self.log=driver,chrome,log
        self.session=None;self.process=None

    def __enter__(self):
        self.tmp=tempfile.TemporaryDirectory(prefix="mammon-browser-"); self.fp=self.log.open("w")
        try:
            with socket.socket() as s:
                s.bind(("127.0.0.1",0));port=s.getsockname()[1]
            self.base=f"http://127.0.0.1:{port}"
            self.process=subprocess.Popen([self.driver, f"--port={port}"],stdout=self.fp,stderr=self.fp)
            for _ in range(100):
                if self.process.poll() is not None:raise RuntimeError("ChromeDriver exited before session")
                try:
                    if api(self.base+"/status",timeout=1)["ready"]:break
                except (OSError,URLError):time.sleep(.1)
            chrome_options={"args":["--headless=new",f"--user-data-dir={self.tmp.name}","--window-size=1280,800"],
                            "binary":self.chrome}
            session=api(self.base+"/session","POST",{"capabilities":{"alwaysMatch":{
                "browserName":"chrome","goog:chromeOptions":chrome_options,"goog:loggingPrefs":{"browser":"ALL"}
            }}})
            self.session=self.base+"/session/"+session["sessionId"]
            self.capabilities=session["capabilities"]
            args=self.cdp("Browser.getBrowserCommandLine",{})["arguments"]
            if any(a.split("=")[0] in {"--no-sandbox","--disable-setuid-sandbox","--disable-seccomp-filter-sandbox","--disable-namespace-sandbox","--disable-gpu-sandbox","--disable-web-security","--single-process","--enable-unsafe-swiftshader"} for a in args):
                raise RuntimeError("System browser was launched with unsupported security options")
            self.call("/timeouts",{"script":180000,"pageLoad":180000})
            return self
        except BaseException:
            self.close();raise

    def close(self):
        if self.session:
            try:api(self.session,"DELETE",timeout=8)
            except Exception:pass
        if self.process and self.process.poll() is None:
            self.process.terminate()
            try:self.process.wait(5)
            except subprocess.TimeoutExpired:self.process.kill();self.process.wait()
        self.fp.close();self.tmp.cleanup()

    def __exit__(self,*unused):self.close()
    def call(self,path,data):return api(self.session+path,"POST",data)
    def js(self,script,*args):return self.call("/execute/sync",{"script":script,"args":list(args)})
    def cdp(self,cmd,params):return self.call("/goog/cdp/execute",{"cmd":cmd,"params":params})
    def until(self,expr,seconds=120):
        limit=time.monotonic()+seconds
        while time.monotonic()<limit:
            result=self.js("const notice=document.getElementById('webglNoticeR221');return notice?.getClientRects().length?{notice:notice.textContent?.slice(-300)}:{ready:!!("+expr+")};")
            if result.get("notice"):raise RuntimeError("R221 WebGL notice: "+result["notice"])
            if result["ready"]:return
            time.sleep(.25)
        raise RuntimeError("Timed out: "+expr)
    def click(self,selector):
        self.until("document.querySelector("+json.dumps(selector)+")?.getClientRects().length")
        e=self.call("/element",{"using":"css selector","value":selector})
        element_id=e.get(ELEMENT) if isinstance(e,dict) else None
        if not isinstance(element_id,str) or not element_id:
            raise RuntimeError(f"W3C element reference missing for {selector}. Received properties: {list(e) if isinstance(e,dict) else type(e).__name__}")
        self.call("/element/"+element_id+"/click",{})
    def await_js(self,expr):
        # W3C callback is always called, including promise rejection.
        r=self.call("/execute/async",{"script":"const cb=arguments[arguments.length-1];Promise.resolve().then(async()=>{"+expr+"}).then(v=>cb({ok:true}),e=>cb({ok:false,error:String(e)}));","args":[]})
        if not r["ok"]:raise RuntimeError(r["error"])
    def key(self,value,milliseconds):
        self.call("/actions",{"actions":[{"type":"key","id":"keyboard","actions":[
            {"type":"keyDown","value":value},{"type":"pause","duration":milliseconds},{"type":"keyUp","value":value}]}]})
    def screenshot(self,path):
        raw=base64.b64decode(api(self.session+"/screenshot"),validate=True)
        if raw[:8]!=b"\x89PNG\r\n\x1a\n":raise RuntimeError("WebDriver screenshot not a PNG")
        path.write_bytes(raw);return list(struct.unpack(">II",raw[16:24]))

def capture(driver,chrome,url,variant,view,out,seed):
    w,h,dpr=VIEWS[view]; label=f"{variant}-{view}"
    row={"label":label,"url":url,"cssViewport":[w,h],"deviceScaleFactor":dpr,"physicalScreenshotSize":[w*dpr,h*dpr],"seed":seed,"touchEmulation":view=="mobile","movementInput":"WebDriver keyboard arrows (also on emulated mobile)","fixture":["new temporary profile","seeded Math.random before 777 (active through capture)","777 activate/go","story skip","marker position injection"],"naturalProgression":False,
         "physicalMobile":False,"realGpuValidation":False,"markers":[],"notes":[],"issues":[]}
    try:
        with Session(driver,chrome,out/(label+"-driver.log")) as s:
            try:
                row["browserVersion"]=s.capabilities.get("browserVersion")
                s.cdp("Emulation.setDeviceMetricsOverride",{"width":w,"height":h,"deviceScaleFactor":dpr,"mobile":view=="mobile"})
                if view=="mobile":s.cdp("Emulation.setTouchEmulationEnabled",{"enabled":True})
                s.call("/url",{"url":url})
                if s.js("return location.origin")!=("http://"+urlsplit(url).netloc):raise RuntimeError("Unexpected redirected origin")
                s.click("#campaignNew54");s.click("#slotConfirmR73")
                s.until("typeof started!=='undefined'&&started&&!loading",180);s.js(SKIP)
                s.js("let n=arguments[0]>>>0;Math.random=()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);",seed)
                s.js("return __STORYWORLD_CHEAT777__.activate('777')")
                s.await_js("await __STORYWORLD_CHEAT777__.go('ep1b06','STORY');")
                s.await_js("const p=__STORYWORLD_PROGRESSION_R71__;if(p.difficultyState().open){p.selectDifficulty('normal');await p.confirmDifficulty();}")
                s.until("!loading&&room?.id==='ep1b06'",180);s.js(SKIP)
                # Capture only after several frames from the actual renderer.
                s.await_js("await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r))));")
                info=s.js(STATE);row["arrival"]=info
                layout=s.js("""const L=room.exploration;return {cells:L.floorCells,walls:L.walls.map(w=>[w.x,w.y,w.width,w.depth,w.height,w.angle||0]),nodes:L.nodes.map(n=>[n.id,n.x,n.y]),edges:L.edges,doors:L.worldR74.doors.map(d=>[d.id,d.x,d.y,d.width]),entry:L.entry};""")
                row["layout"]={"sha256":hashlib.sha256(json.dumps(layout,ensure_ascii=False,sort_keys=True,separators=(",",":")).encode()).hexdigest(),"cells":len(layout["cells"]),"walls":len(layout["walls"]),"entry":layout["entry"],"doors":layout["doors"]}

                if info["active"]!="three" or info["failed"] or info["glLost"] is not False or info["zone"]!="ep1b06":
                    raise RuntimeError("No live Three/WebGL Mammon scene; see arrival")
                if variant=="before" and info["overlay"] is not None:raise RuntimeError("Baseline unexpectedly contains candidate")
                if variant=="after":
                    s.until("window.__STORYWORLD_MAMMON_MINIATURE_PILOT__?.inspect()?.last?.loaded",20)
                    if not s.js(STATE)["group"]:raise RuntimeError("Candidate Three group absent")
                # Direct W3C key action: movement, not a complete playthrough. At least one
                # direction must change position and leave the player on walkable ground.
                deltas=[]
                for key in ("\ue014","\ue015","\ue012","\ue013"):
                    a=s.js(STATE);s.key(key,500);b=s.js(STATE)
                    d=math.hypot(a["player"]["x"]-b["player"]["x"],a["player"]["y"]-b["player"]["y"])
                    deltas.append({"key":key,"delta":d,"blockedAfter":b["blocked"]})
                    if d>.03 and not b["blocked"]:break
                row["input"]=deltas
                if not any(x["delta"]>.03 and not x["blockedAfter"] for x in deltas):row["issues"].append("No measured movement after arrow input")
                for marker in MARKERS:
                    target=s.js(MARKER,marker)
                    if target is None:
                        row["issues"].append("Marker unavailable: "+marker);continue
                    # Camera/game are allowed to advance; no camera override, no synthetic image.
                    s.await_js("await new Promise(r=>{const t=performance.now();function tick(){if(performance.now()-t>=700)r();else requestAnimationFrame(tick)}requestAnimationFrame(tick)});")
                    if marker=="combat":s.key("a",100)
                    snap=s.js(STATE)
                    path=out/(label+"-"+marker+".png");size=s.screenshot(path)
                    row["markers"].append({"target":target,"state":snap,"file":path.name,"size":size,
                      "qualification":"combat nearby + attack input, visibility not reviewed" if marker=="combat" else "fixture vantage, visibility not reviewed"})
                    if snap["active"]!="three" or snap["failed"] or snap["glLost"] is not False or (variant=="after" and (not snap["group"] or snap["overlay"] is None or snap["overlay"].get("lastError"))):
                        row["issues"].append("Lost renderer/overlay: "+marker)
                    if size!=[w*dpr,h*dpr] or snap["viewport"]!=[w,h] or snap["dpr"]!=dpr:row["issues"].append("Viewport/DPR differs: "+marker)
                    if snap["player"]["hp"]<=0 or snap["modal"] or snap["story"] or snap["loading"]:row["issues"].append("Not an active gameplay view: "+marker)
                row["notes"].append("No natural campaign, boss unlock/kill, exit completion, save/reload or physical GPU/device claim.")
            except Exception:
                # Error/notice screenshots are diagnostic only, never marker evidence.
                try:
                    path=out/(label+"-diagnostic-not-gameplay.png")
                    row["diagnosticOnly"]={"file":path.name,"size":s.screenshot(path),"webglNotice":s.js("return document.getElementById('webglNoticeR221')?.textContent||null")}
                except Exception:pass
                raise
            finally:
                try:row["console"]=s.call("/log",{"type":"browser"})
                except Exception as e:row["issues"].append("Console unavailable: "+str(e))
                bad=[]
                favicon_url="http://"+urlsplit(url).netloc+"/favicon.ico"
                for e in row.get("console",[]):
                    if e.get("level")!="SEVERE":continue
                    msg=e.get("message","")
                    if e.get("source")=="network" and msg.split(" ",1)[0]==favicon_url and "404" in msg:
                        continue
                    bad.append(e)
                if bad:row["issues"].append("Severe browser console entries require triage")
    except Exception as exc:
        row["issues"].append(str(exc));row["status"]="BLOCKED" if not row["markers"] else "INCOMPLETE"
    else:row["status"]="INCOMPLETE" if row["issues"] else "CAPTURED"
    (out/(label+".json")).write_text(json.dumps(row,ensure_ascii=False,indent=2)+"\n")
    print(f'{label}: {row["status"]}; {len(row["markers"])} markers; {row["issues"]}',flush=True)
    return row

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument("--before",type=local_url);p.add_argument("--after",type=local_url)
    p.add_argument("--seed",type=int,default=77,help="identical deterministic fixture seed for both builds")
    p.add_argument("--view",choices=VIEWS,action="append");p.add_argument("--out",type=pathlib.Path,required=True)
    p.add_argument("--driver",default=shutil.which("chromedriver"));p.add_argument("--chrome",default=shutil.which("google-chrome") or shutil.which("chromium"))
    o=p.parse_args();urls=[(n,getattr(o,n)) for n in ("before","after") if getattr(o,n)]
    if not urls:p.error("Pass --before and/or --after localhost build URL")
    if o.before and o.after and o.before.rstrip("/")==o.after.rstrip("/"):p.error("Use distinct baseline and candidate URLs")
    if o.out.exists() and any(o.out.iterdir()):p.error("Use a new or empty results directory")
    o.out.mkdir(parents=True,exist_ok=True);missing=[]
    if hasattr(os,"geteuid") and os.geteuid()==0:missing.append("Requires a non-root runner with the Chrome sandbox enabled")
    for name,path in [("ChromeDriver",o.driver),("Chrome",o.chrome)]:
        if not path or not pathlib.Path(path).is_file() or not os.access(path,os.X_OK):missing.append(name+" system binary missing or not executable")
    if missing:
        (o.out/"preflight.json").write_text(json.dumps({"status":"BLOCKED","reasons":missing},indent=2)+"\n");print("; ".join(missing),file=sys.stderr);return 2
    rows=[capture(o.driver,o.chrome,url,n,v,o.out,o.seed) for n,url in urls for v in (o.view or VIEWS)]
    comparisons=[]
    if o.before and o.after:
        for view in o.view or VIEWS:
            a,b=[next(r for r in rows if r["label"]==n+"-"+view) for n in ("before","after")]
            matches=bool(a.get("layout") and b.get("layout") and a["layout"]["sha256"]==b["layout"]["sha256"])
            marker=lambda r:{m["target"]["marker"]:m["target"]["fixturePosition"] for m in r["markers"]}
            pa,pb=marker(a),marker(b)
            sameMarkers={m:m in pa and m in pb and pa[m]==pb[m] for m in MARKERS}
            comparisons.append({"view":view,"layoutMatches":matches,"fixturePositionMatches":sameMarkers,
                                "note":"Only matched layout/positions are usable for direct comparison; live combat may differ."})
    status="CAPTURED" if all(r["status"]=="CAPTURED" for r in rows) and all(c["layoutMatches"] and all(c["fixturePositionMatches"].values()) for c in comparisons) else "INCOMPLETE"
    (o.out/"summary.json").write_text(json.dumps({"status":status,"comparisons":comparisons,"rows":[{k:r[k] for k in ("label","status","issues")} for r in rows],"qualityScore":None,"naturalProgression":False},indent=2)+"\n")
    return 0 if status=="CAPTURED" else 1

if __name__=="__main__":raise SystemExit(main())
