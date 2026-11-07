#!/usr/bin/env python3
"""Capture the real game via system ChromeDriver. No install or sandbox override.
Example: python3 browser-check.py --before http://127.0.0.1:4300/ --after http://127.0.0.1:4301/ --out /tmp/mammon-shots
Each site/view uses a disposable new profile. 777 travel/scene skipping and marker
placement are explicit fixtures. This is NOT an end-to-end campaign or a phone test.
"""
import argparse, base64, hashlib, json, math, os, pathlib, shutil, socket, struct, subprocess, sys, tempfile, time
from contextlib import contextmanager
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

ELEMENT = "element-6066-11e4-a52e-4f735466cecf"
VIEWS = {"pc": (1920, 1080, 1), "mobile": (390, 844, 3)}
REQUIRED = ("entry", "branch", "records", "gather", "boss-door", "exit", "combat")
SUPPLEMENTAL = ("security", "vault")
MARKERS = REQUIRED + SUPPLEMENTAL
# Sample native combat while the field is still in its route phase, before a gather fixture starts a rally.
CAPTURE_ORDER = ('entry','branch','records','combat','gather','boss-door','exit') + SUPPLEMENTAL
SKIP = "for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);return !storyScene;"
STATE = """
const phase=window.__STORYWORLD_PHASE1__, status=phase?.inspect(), engine=phase?.controller?.state?.three;
const gl=engine?.renderer?.getContext?.();const ext=gl?.getExtension('WEBGL_debug_renderer_info');
const overlay=window.__STORYWORLD_MAMMON_MINIATURE_PILOT__?.inspect();
return {serial:engine?.serial,gameTime:time,zone:room?.id,layer,active:status?.active,failed:status?.failed,reason:status?.reason,
 glRenderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl?gl.getParameter(gl.RENDERER):null,
 glLost:gl?.isContextLost(),drawCalls:engine?.renderer?.info?.render?.calls,
 zoneWide:room?.exploration?.storyMapR171?.wideR379,overlay:overlay||null,
 group:!!engine?.spatialRoot?.getObjectByName('mammon-miniature-pilot'),
 started,loading,modal,story:!!storyScene,player:{x:player.x,y:player.y,hp:player.hp},
 blocked:blocked(player.x,player.y,undefined,room),clearanceProbe34:blocked(player.x,player.y,.34,room), viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,
 doors:room?.exploration?.worldR74?.doors?.map(d=>({id:d.id,closed:d.closed})),
 living:room?.enemies?.filter(e=>e.hp>0).length??0,
 warnings:(typeof hazards==='undefined'?[]:hazards).length,
 attack:{animation:player.attackAnim,cooldown:player.attackCD},
 r224RoomBounds:room?.exploration?.r224Rooms?.length};
"""
MARKER = """
const name=arguments[0],ref=arguments[1],L=room.exploration,ds=L.worldR74.doors;
const n=(id)=>L.nodes.find(n=>n.id===id);
let p=({entry:L.entry,branch:L.nodes.find(n=>n.name==='금고 전실'),records:L.nodes.find(n=>n.name==='기록실'),security:L.nodes.find(n=>n.name==='보안 회랑'),vault:L.nodes.find(n=>n.name==='금고 구획'),
 gather:n(2),'boss-door':ds.find(d=>d.id==='door-0'),exit:ds.find(d=>d.id==='door-2')})[name];
let focus=p,enemyId=null,roomId=null,doorId=null;
if(['records','security','vault'].includes(name)){
 const use={records:['기록실','O01'],security:['보안 회랑','O02'],vault:['금고 구획','O02']}[name];
 const rooms=L.r224Rooms.filter(q=>L.nodes.find(n=>n.id===q.id)?.name===use[0]);
 let desk=null,chosen=null;
 __STORYWORLD_PHASE1__.controller.state.three.spatialRoot.getObjectByName('mammon-miniature-pilot')?.traverse(o=>{
  if(desk||o.userData?.assetId!==use[1])return;
  const q=rooms.find(q=>o.position.x>=q.x0&&o.position.x<=q.x1&&o.position.z>=q.y0&&o.position.z<=q.y1);
  if(q){desk={x:o.position.x,y:o.position.z};chosen=q;}
 });
 roomId=ref?.roomId??chosen?.id??p?.id??null;
 focus=ref?.focus||desk||p;if(!focus)return null;
 p={x:focus.x+2.9,y:focus.y+2.9,name:use[0]};
}
if(!p)return null;
if(name==='exit'||name==='boss-door'){
 doorId=p.id;focus={x:p.x,y:p.y};p={...p,x:p.x+1.7,y:p.y+3.3};
}
const preferred=ref?.fixturePosition||p;
const cells=L.floorCells.map(([x,y])=>({x:x+.5,y:y+.5}))
 .filter(v=>Math.hypot(v.x-preferred.x,v.y-preferred.y)<5)
 .sort((a,b)=>Math.hypot(a.x-preferred.x,a.y-preferred.y)-Math.hypot(b.x-preferred.x,b.y-preferred.y));
const spot=cells.find(v=>!blocked(v.x,v.y,.34,room));
if(!spot)return null;player.x=spot.x;player.y=spot.y;route=[];command=null;
return {marker:name,nativeLabel:p.name||p.id,roomId,doorId,enemyId,focus:{x:focus.x,y:focus.y},fixturePosition:spot};
"""

EVIDENCE = """
const label=arguments[0],target=arguments[1],eng=__STORYWORLD_PHASE1__.controller.state.three,
 T=eng.T,view=document.getElementById('phase1-webgl'),rect=view.getBoundingClientRect(),
 cam3=eng.camera,group=eng.spatialRoot?.getObjectByName('mammon-miniature-pilot');
function screenPoint(x,y,z){
 const a=new T.Vector3(x,y,z).project(cam3);
 return {x:rect.left+(a.x+1)*rect.width/2,y:rect.top+(1-a.y)*rect.height/2,depth:a.z};
}
function pointStatus(p){
 const inView=p.x>=Math.max(0,rect.left)&&p.x<Math.min(innerWidth,rect.right)&&
  p.y>=Math.max(0,rect.top)&&p.y<Math.min(innerHeight,rect.bottom)&&p.depth>=-1&&p.depth<=1;
 const top=inView?document.elementFromPoint(p.x,p.y):null;
 return {...p,inView,canvasHit:!!top&&(top===canvas||top===view),
  hitId:top?.id||top?.tagName||null};
}
const focus=target.focus||target.fixturePosition,ground=pointStatus(screenPoint(focus.x,0,focus.y)),
 head=pointStatus(screenPoint(focus.x,1,focus.y));
let passage=null,desk=null,foes=[];
function plate(o){
 const pos=o.geometry?.attributes?.position;if(!pos)return null;
 const xy=[];
 for(let i=0;i<pos.count;i++){
  const a=new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);
  xy.push(screenPoint(a.x,a.y,a.z));
 }
 const bounds={left:Math.min(...xy.map(p=>p.x)),right:Math.max(...xy.map(p=>p.x)),
  top:Math.min(...xy.map(p=>p.y)),bottom:Math.max(...xy.map(p=>p.y))};
 const center=pointStatus({x:(bounds.left+bounds.right)/2,y:(bounds.top+bounds.bottom)/2,
  depth:xy.reduce((s,p)=>s+p.depth,0)/xy.length});
 let enabled=!!o.layers.mask && o.material?.visible!==false && o.material?.opacity!==0;
 for(let a=o;a;a=a.parent)enabled=enabled&&a.visible;
 return {asset:o.userData.assetId,enabled,bounds,center,
  imageReady:!!o.material?.map?.image?.naturalWidth,likelyVisible:enabled&&center.inView&&center.canvasHit};
}
if(['records','security','vault'].includes(label)){
 const expected=label==='records'?'O01':'O02',q=room.exploration.r224Rooms.find(q=>q.id===target.roomId),items=[];
 group?.traverse(o=>{if(o.userData?.assetId===expected&&q&&o.position.x>=q.x0&&o.position.x<=q.x1&&o.position.z>=q.y0&&o.position.z<=q.y1)items.push(plate(o));});
 desk={roomId:target.roomId,roomRole:label,expected,items:items.filter(Boolean)};
}
if(label==='boss-door'||label==='exit'){
 const d=room.exploration.worldR74.doors.find(d=>d.id===target.doorId),ends=[],jambs=[];
 if(d){
  for(const sign of [-1,1]){
   const h=d.width>=d.depth;
   ends.push(pointStatus(screenPoint(d.x+(h?sign*d.width/2:0),.6,d.y+(h?0:sign*d.depth/2))));
  }
  group?.traverse(o=>{const a=o.userData?.nativeAnchor;if(o.userData?.assetId==='D01'&&a&&Math.hypot(a[0]-d.x,a[2]-d.y)<Math.max(d.width,d.depth)/2+.25)jambs.push(plate(o));});
  passage={id:d.id,center:pointStatus(screenPoint(d.x,.6,d.y)),ends,
   open:__STORYWORLD_WORLD_R74__.isOpen(room,d),jambs:jambs.filter(Boolean)};
 }
}
let nativeCombat=null;
if(label==='combat'){
 const diag=window.__STORYWORLD_ENEMY_STATUS24__?.snapshot?.();
 for(const e of diag?.enemies||[]){
  if(!(e.active&&e.hp>0&&e.renderEligible&&e.sightVisible&&e.image?.ready&&(e.footOnScreen||e.bodyIntersects)))continue;
  const foot=pointStatus(screenPoint(e.x,0,e.y)),body=pointStatus(screenPoint(e.x,.75,e.y));
  if(!(foot.canvasHit||body.canvasHit))continue;
  const raw=room.enemies.find(row=>row.id===e.id),casting=raw?.cast||raw?.casting;
  const central=body.canvasHit&&foot.canvasHit&&body.x>rect.left+.11*rect.width&&body.x<rect.right-.11*rect.width&&
    body.y>rect.top+.12*rect.height&&body.y<rect.bottom-.18*rect.height;
  foes.push({id:e.id,nativeId:e.nativeId||null,name:e.name,hp:e.hp,x:e.x,y:e.y,spawnState:e.spawnState,foot,body,
    distance:e.distance,central,ordinary:!raw?.wardChampionR81&&!raw?.boss&&!raw?.midboss&&!raw?.r61Summoned&&!raw?.r61Clone,

    bodyIntersects:e.bodyIntersects,artReady:e.image.ready,combatLineClear:e.combatLineClear,
    cast:typeof casting==='string'?casting:casting?.kind||null,attackAnim:raw?.attackAnim||0});
 }
 nativeCombat={engaged:!!room.engaged,stage:room.encounterStage,
  heroAttackAnimation:player.attackAnim,heroAttackCD:player.attackCD,
  hazards:typeof hazards==='undefined'?0:hazards.length,
  missiles:typeof shots==='undefined'?0:shots.length,
  targeted:room.enemies.find(e=>e.id===target.enemyId)?.hp??null,
  targetPresent:room.enemies.some(e=>e.id===target.enemyId),
  targetDeadRecorded:room.enemies.some(e=>e.id===target.enemyId&&(e.deadRecorded||e.spawnState==='dead'))};
}
return {serial:eng.serial,gameTime:time,player:{x:player.x,y:player.y,hp:player.hp},
 fixtureDisplacement:Math.hypot(player.x-target.fixturePosition.x,player.y-target.fixturePosition.y),
 canvas:{x:rect.x,y:rect.y,width:rect.width,height:rect.height,drawingWidth:view.width,drawingHeight:view.height},
 anchorGround:ground,anchorHead:head,desk,passage,foes,nativeCombat,
 qualification:'Projected geometry and DOM hit tests. Occlusion, raster visibility and quality require screenshot review.'};
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

def frame_sample(s):
    # In-page elapsed time between rendering opportunities in the active headless tab.
    r=s.call("/execute/async",{"script":"""
    const done=arguments[arguments.length-1],ds=[],start=performance.now(),eng=__STORYWORLD_PHASE1__.controller.state.three;
    const first=eng.serial;let last=null,lastSerial=null,noNewGameFrame=0;
    const sample=t=>{if(last!==null){ds.push(t-last);if(lastSerial===eng.serial)noNewGameFrame++;}
      last=t;lastSerial=eng.serial;
      if(t-start<2200||ds.length<3){requestAnimationFrame(sample);return;}
      ds.sort((a,b)=>a-b);
      const pct=p=>ds[Math.min(ds.length-1,Math.ceil(ds.length*p)-1)];
      done({rafIntervals:ds.length,elapsedMs:t-start,medianMs:pct(.5),p95Ms:pct(.95),
       worstMs:ds.at(-1),over50ms:ds.filter(ms=>ms>50).length,over100ms:ds.filter(ms=>ms>100).length,
       renderedGameFrameAdvance:eng.serial-first,rafWithoutNewGameFrame:noNewGameFrame,
       qualification:'Headless rAF intervals and renderer serial; hardware presentation/drop counters unmeasured.'});};
    requestAnimationFrame(sample);""","args":[]})
    return r

def check_closed_boss_door(s):
    # Position injection only. The collision/door states and actual movement are native.
    placement=s.js("""
    const door=room.exploration.worldR74.doors.find(d=>d.id==='door-0');
    if(!door||__STORYWORLD_WORLD_R74__.isOpen(room,door)||loading||modal||storyScene||player.hp<=0)return null;
    for(const dy of [.90,1.1,1.3]){
      const x=door.x+.7,y=door.y+dy;
      if(blocked(x,y,undefined,room)||!blocked(door.x,door.y,undefined,room))continue;
      player.x=x;player.y=y;route=[];command=null;
      return {x,y,doorX:door.x,doorY:door.y,halfWidth:door.width/2,halfDepth:door.depth/2};
    }return null;""")
    if not placement:return {"result":"UNTESTED","detail":"native boss door is open or no walkable approach"}
    # Under slow software rendering the first pulse may move only one native step.
    # Reach the face first, then collect a separate press while already at the face.
    samples=[]
    contact=placement["halfDepth"]+.27
    for attempt in range(5):
        s.key("\ue013",500 if attempt else 650)
        row=s.js("""
        const d=room.exploration.worldR74.doors.find(d=>d.id==='door-0');
        return {player:{x:player.x,y:player.y,hp:player.hp},gameTime:time,
          open:__STORYWORLD_WORLD_R74__.isOpen(room,d),blocked:blocked(player.x,player.y,undefined,room),
          margin34:blocked(player.x,player.y,.34,room),forwardBlocked:blocked(player.x,player.y-.17,undefined,room)};
        """)
        x,y=row["player"]["x"],row["player"]["y"]
        row["atClosedFace"]=(contact-1e-5<=y-placement["doorY"]<=contact+.17 and
                             abs(x-placement["doorX"])<placement["halfWidth"]-.27 and
                             not row["open"] and not row["blocked"] and row["forwardBlocked"])
        samples.append(row)
        if row["open"] or row["blocked"] or abs(x-placement["doorX"])>=placement["halfWidth"]-.27:break
        if len(samples)<2 or not (samples[-2]["atClosedFace"] and row["atClosedFace"]):continue
        last=samples[-2];dx=abs(x-last["player"]["x"]);dy=abs(y-last["player"]["y"])
        if dx>.02 and dy<.015 and row["gameTime"]>last["gameTime"]:
            return {"result":"STOP_AT_CLOSED_FACE_OBSERVED","fixtureStart":placement,
                    "nativeContactDistance":contact,"samples":samples,"repeatedPressMovedAlongFace":dx,
                    "repeatedPressNormalDelta":dy,"qualification":"Player fixture start; native keyboard default .27 collision and repeated actual input"}
    return {"result":"INCONCLUSIVE","fixtureStart":placement,"nativeContactDistance":contact,"samples":samples,
            "qualification":"No two consecutive actual inputs verified the stop at the closed face"}

READ_SAVE="""
const key=__STORYWORLD_CHEAT777__.inspect().saveSlot;
const text=window.__STORYWORLD_TEST_STORAGE_B1__.store.getItem(key);
if(!text)return null;const r=JSON.parse(text);
return {key,zone:r.zone,layer:r.layer,cheat:r.cheat777?.active===true,hero:r.hero,
 time:r.time,x:r.player?.x,y:r.player?.y,version:r.version};
"""

def open_menu(s):
    if s.js("return !!document.querySelector('#menuBtn')?.getClientRects().length"):
        s.click("#menuBtn")
        return "menuBtn click"
    s.key("\ue00c",65) # Native Escape opens the menu on the mobile keyboard path.
    s.until("document.querySelector('#menuClose')?.getClientRects().length",8)
    return "Escape real keyboard input with mobile touch emulation"

def save_and_reopen_tab(s,url,view):
    result={"status":"UNTESTED","scope":"777 test save only, fresh tab in same ephemeral Chrome process",
            "pagehideMayAutosave":True}
    # Only a new temporary profile is supplied to this runner. Original saves stay outside it.
    try:
        if not s.js(MARKER,"entry",None):raise RuntimeError("Could not position at native entry")
        if view=="mobile" and s.js("return !!document.querySelector('#mobileSettingsR63')?.getClientRects().length"):
            s.click("#mobileSettingsR63");s.click("#mobileSaveR142")
            result["saveUI"]=["mobile settings gear","mobileSaveR142"]
        else:
            open_menu(s);s.click("#menuSave")
            result["saveUI"]=["menu","menuSave"]
        saved=s.js(READ_SAVE);current=s.js(STATE)
        result["atMenuSave"]=saved
        if not saved or not saved["cheat"] or saved["zone"]!="ep1b06" or saved["layer"]!="STORY":raise RuntimeError("Menu save did not yield the Mammon 777 slot")
        if math.hypot(current["player"]["x"]-saved["x"], current["player"]["y"]-saved["y"])>.1:
            raise RuntimeError("777 slot did not contain the position at the menu save")
        old=api(s.session+"/window");new=s.call("/window/new",{"type":"tab"})["handle"]
        s.call("/window",{"handle":old});api(s.session+"/window","DELETE")
        s.call("/window",{"handle":new})
        w,h,dpr=VIEWS[view]
        s.cdp("Emulation.setDeviceMetricsOverride",{"width":w,"height":h,"deviceScaleFactor":dpr,"mobile":view=="mobile"})
        if view=="mobile":s.cdp("Emulation.setTouchEmulationEnabled",{"enabled":True})
        s.call("/url",{"url":url});s.until("typeof booted!=='undefined'&&booted&&!loading",180)
        persisted=s.js(READ_SAVE);result["afterTabReopen"]=persisted
        if not persisted or not persisted["cheat"] or persisted["zone"]!="ep1b06":
            raise RuntimeError("No persisted Mammon test slot after reopening")
        s.click("#campaignContinue54");s.until("started&&!loading",90);s.js(SKIP)
        result["resumeMenuInput"]=open_menu(s)
        s.click("[data-r339-proxy='story-code-button']");s.click("#codeResumeR75")
        s.until("started&&!loading&&room?.id==='ep1b06'&&__STORYWORLD_CHEAT777__.active()",90)
        restored=s.js(STATE);result["restored"]=restored
        delta=math.hypot(restored["player"]["x"]-persisted["x"],restored["player"]["y"]-persisted["y"])
        result["positionDelta"]=delta
        if delta>1 or restored["blocked"] or restored["layer"]!=persisted["layer"] or restored["active"]!="three":
            raise RuntimeError("Restored scene/position mismatch")
        result["status"]="RESTORED_777_TEST_SLOT"
    except Exception as exc:
        result.update(status="INCOMPLETE",detail=str(exc))
    return result


@contextmanager
def held_vantage(s,marker,target):
    """Only static fixture views hold the actor at its declared vantage during capture."""
    if marker=="combat":
        yield
        return
    try:
        s.js("""
        if(window.__mammonQaAnchor)throw Error('previous capture anchor still active');
        const p=arguments[0],anchor={position:p,frames:0,start:performance.now(),request:0};
        const apply=()=>{
          if(window.__mammonQaAnchor!==anchor||performance.now()-anchor.start>60000||
             room?.id!=='ep1b06'||player.hp<=0)return;
          player.x=p.x;player.y=p.y;route=[];command=null;anchor.frames++;
          anchor.request=requestAnimationFrame(apply);
        };
        window.__mammonQaAnchor=anchor;apply();""",target["fixturePosition"])
        yield
    finally:
        s.js("""const a=window.__mammonQaAnchor;if(a){cancelAnimationFrame(a.request);delete window.__mammonQaAnchor;}""")

def settle_view(s,marker,target):
    """Leave the normal renderer/camera running; retry up to three settling windows."""
    first=s.js(STATE);history=[]
    for _ in range(3):
        s.await_js("await new Promise(r=>{const t=performance.now();let n=0;function tick(){if(++n>=3&&performance.now()-t>=450)r();else requestAnimationFrame(tick)}requestAnimationFrame(tick)});")
        evidence=s.js(EVIDENCE,marker,target);advance=evidence["serial"]-first["serial"]
        history.append({"advance":advance,"displacement":evidence["fixtureDisplacement"],
                       "anchorGround":evidence["anchorGround"],"anchorHead":evidence["anchorHead"]})
        if advance>=2 and (marker=="combat" or evidence["fixtureDisplacement"]<.1) and (evidence["anchorGround"]["canvasHit"] or evidence["anchorHead"]["canvasHit"]):break
    return evidence,history


# Ordered by gameplay eligibility, not max HP. This is a player-position fixture only.
COMBAT_APPROACH="""
const ref=arguments[0],tried=arguments[1],L=room.exploration,hero=HEROES[player.hero];
const range=Math.min(hero.range,2.6),excluded=new Set(tried);
const diag=window.__STORYWORLD_ENEMY_STATUS24__.snapshot().enemies;
const dom=document.getElementById('phase1-webgl').getBoundingClientRect();
function centered(x,y){const point=project(x,y),px=dom.left+point.x,py=dom.top+point.y;
 return px>dom.left+.11*dom.width&&px<dom.right-.11*dom.width&&py>dom.top+.12*dom.height&&py<dom.bottom-.18*dom.height&&document.elementFromPoint(px,py)===canvas;}
const rows=diag.map(d=>({d,e:room.enemies.find(e=>e.id===d.id)}))
 .filter(({d,e})=>e&&d.active&&d.renderEligible&&d.hp>0&&!e.deadRecorded&&(ref||!excluded.has(e.id))&&(!ref||e.id===ref.enemyId))
 .map(({d,e})=>({d,e,readyHere:d.image.ready&&d.sightVisible&&d.combatLineClear&&
       d.distance<=range&&(d.bodyIntersects||d.footOnScreen)&&centered(e.x,e.y),
       ordinary:!(e.wardChampionR81||e.boss||e.midboss||e.r61Summoned||e.r61Clone)}))
 .sort((a,b)=>Number(b.readyHere)-Number(a.readyHere)||Number(b.ordinary)-Number(a.ordinary)||
       a.d.distance-b.d.distance||String(a.e.id).localeCompare(String(b.e.id)));
for(const {e,d,readyHere} of rows){
 let spot;
 if(ref){spot=ref.fixturePosition;if(!spot||blocked(spot.x,spot.y,undefined,room))return null;}
 else if(readyHere){spot={x:player.x,y:player.y};}
 else{
  // Choose a walkable point within actual hero reach with an unobstructed attack line.
  const near=L.floorCells.map(([x,y])=>({x:x+.5,y:y+.5})).filter(p=>{
   const gap=Math.hypot(p.x-e.x,p.y-e.y);
   return gap>=.75&&gap<=range*.94&&!blocked(p.x,p.y,undefined,room)&&clearLine(p,e);});
  near.sort((a,b)=>Math.hypot(a.x-e.x-1,a.y-e.y-.65)-Math.hypot(b.x-e.x-1,b.y-e.y-.65));
  if(!near.length)continue;spot=near[0];
 }
 player.x=spot.x;player.y=spot.y;route=[];command=null;
 return {marker:'combat',nativeLabel:'live combat approach',enemyId:e.id,approachId:e.id,
         nativeId:e.nativeId||null,focus:{x:e.x,y:e.y},fixturePosition:spot,comparisonRange:range,attackKey:'1'};
}
return null;
"""

def qualifying_foes(evidence,limit):
    return sorted((f for f in evidence["foes"] if f["central"] and f["combatLineClear"] and f["distance"]<=limit),
                  key=lambda f:(not f["ordinary"],f["distance"],str(f["id"])))

def target_hit(before,end,target_id):
    """An absent actor alone is neither a hit nor a kill."""
    pre=before["nativeCombat"];post=end["nativeCombat"]
    actor_pre=any(f["id"]==target_id for f in before["foes"])
    actor_post=any(f["id"]==target_id for f in end["foes"])
    old,new=pre["targeted"],post["targeted"]
    changed=old is not None and new is not None and new<old
    death=bool(old and old>0 and post["targetPresent"] and (post["targetDeadRecorded"] or new is not None and new<=0))
    attack=post["heroAttackCD"]>pre["heroAttackCD"]+.01 or post["heroAttackAnimation"]>0
    return {"nativeActorInBeforeFrame":actor_pre,"nativeActorInAfterFrame":actor_post,
            "targetHpBefore":old,"targetHpAfter":new,"targetHpChanged":changed,
            "targetDeathConfirmed":death,"nativeInputAnimation":attack,
            "nativeActionObserved":bool(actor_pre and (actor_post and (changed or attack) or death and changed))}

def release_capture_hold(s):
    s.js("""const a=window.__mammonQaAnchor;if(a){cancelAnimationFrame(a.request);delete window.__mammonQaAnchor;}""")

def capture_combat_marker(s,row,out,view,variant,reference):
    from combat_sequence import capture_combat_sequence
    label=row["label"];ref=(reference or {}).get("combat");attempts=[];tried=[]
    row["combatAcquisition"]={"attempts":attempts,"expectedNativeId":ref and ref["enemyId"]}
    limit=3
    for attempt in range(limit):
        target=s.js(COMBAT_APPROACH,ref,tried)
        if not target:break
        tried.append(target["approachId"])
        with held_vantage(s,"combat-start",target):
            evidence,settling=settle_view(s,"combat",target)
            viable=qualifying_foes(evidence,target["comparisonRange"])
            attempts.append({"approach":target["approachId"],"eligible":[f["id"] for f in viable],
                             "position":target["fixturePosition"],"settling":settling})
            chosen=next((f for f in viable if not ref or f["id"]==ref["enemyId"]),None)
            if not chosen:continue
            target.update(enemyId=chosen["id"],nativeId=chosen["nativeId"],focus={"x":chosen["x"],"y":chosen["y"]})
            before=s.js(EVIDENCE,"combat",target)
            startfile=out/(label+"-combat-aligned-start.png");startsize=s.screenshot(startfile)
            start_end=s.js(EVIDENCE,"combat",target)
            if not any(f["id"]==target["enemyId"] for f in qualifying_foes(start_end,target["comparisonRange"])):continue
            target["matchingCombatStart"]={"pos":[before["player"]["x"],before["player"]["y"]],
                "end":[start_end["player"]["x"],start_end["player"]["y"]],"file":startfile.name,"size":startsize,"enemyId":target["enemyId"]}
            primary={};path=out/(label+"-combat.png");gate={"attempted":False}
            def before_input():
                # The first two burst samples share the reference position. Actual attack
                # and every subsequent frame run without a QA player-position hold.
                release_capture_hold(s)
                gate["attempted"]=True;gate["before"]=s.js(EVIDENCE,"combat",target)
                return any(f["id"]==target["enemyId"] for f in qualifying_foes(gate["before"],target["comparisonRange"]))
            def on_frame(i):
                if i<2 or primary or "before" not in gate:return
                state=s.js(EVIDENCE,"combat",target);witness=target_hit(gate["before"],state,target["enemyId"])
                if not witness["nativeActionObserved"]:return
                main_state=s.js(STATE);size=s.screenshot(path)
                end=s.js(EVIDENCE,"combat",target);final=target_hit(gate["before"],end,target["enemyId"])
                if final["nativeActionObserved"]:
                    primary.update(file=path.name,size=size,state=main_state,end=end,witness=final,frameIndex=i)
            seq=capture_combat_sequence(s,out,view,target,variant=variant,on_frame=on_frame,before_input=before_input)
            row["combatSequence" if variant=="after" else "baselineCombatSequence"]=seq
            if not primary:
                # Preserve a diagnostic from this actual attempt; do not score it as a hit.
                state=s.js(STATE);size=s.screenshot(path);end=s.js(EVIDENCE,"combat",target)
                primary.update(file=path.name,size=size,state=state,end=end,
                    witness=target_hit(gate.get("before",start_end),end,target["enemyId"]),frameIndex=None)
                row["issues"].append("No primary PNG with a verified native attack on the selected actor")
            row["markers"].append({"coverage":"required","target":target,"state":primary["state"],
                "before":gate.get("before",start_end),"after":primary["end"],"file":primary["file"],"size":primary["size"],
                "combatWitness":primary["witness"],"burstFrameIndex":primary["frameIndex"],"settling":settling,
                "fixturePositionHeld":False,"combatOnlyAlignedStartPinned":True,"pngSha256":hashlib.sha256(path.read_bytes()).hexdigest(),
                "combatBeforeInput":{"file":startfile.name,"size":startsize,"evidence":start_end,
                "qualification":"Only starting player placement assisted; enemies and damage are native"}})
            snap=primary["state"];w,h,dpr=VIEWS[view]
            if primary["size"]!=[w*dpr,h*dpr] or snap["viewport"]!=[w,h] or snap["dpr"]!=dpr:
                row["issues"].append("Combat viewport/DPR differs")
            if snap["active"]!="three" or snap["failed"] or snap["glLost"] is not False or snap["modal"] or snap["loading"] or snap["story"]:
                row["issues"].append("Combat frame not an active Three scene")
            if seq.get("status")!="CAPTURED":row["issues"].append("Native combat sampling incomplete; see sequence evidence")
            return
    row["issues"].append("No same native target visible, unobstructed and within attack range for combat input")
    row["combatDiagnosticOnly"]={"file":label+"-combat-target-unavailable.png"}
    s.screenshot(out/row["combatDiagnosticOnly"]["file"])


def capture(driver,chrome,url,variant,view,out,seed,reference=None):
    w,h,dpr=VIEWS[view]; label=f"{variant}-{view}"
    row={"label":label,"url":url,"cssViewport":[w,h],"deviceScaleFactor":dpr,"physicalScreenshotSize":[w*dpr,h*dpr],"seed":seed,"touchEmulation":view=="mobile","movementInput":"WebDriver keyboard arrows (also on emulated mobile)","fixture":["new temporary profile","seeded Math.random before 777 (active through capture)","777 activate/go","story skip","marker position injection; static markers and a separate initial combat reference pin the player only, actual combat shots remain unpinned","guide and auto disabled using UI for capture"],"naturalProgression":False,
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
                if s.js("return !!guide"):
                    open_menu(s);s.click("#menuGuide")
                if s.js("return !!auto"):s.key(" ",70)
                if s.js("return !!guide||!!auto"):raise RuntimeError("Native guide/auto could not be disabled for matched fixture captures")
                for marker in CAPTURE_ORDER:
                    if marker=="combat":
                        capture_combat_marker(s,row,out,view,variant,(reference or {}))
                        continue
                    target=s.js(MARKER,marker,(reference or {}).get(marker))
                    if target is None:
                        row["issues"].append("Marker unavailable: "+marker)
                        continue
                    with held_vantage(s,marker,target):
                        evidence,settling=settle_view(s,marker,target)
                        path=out/(label+"-"+marker+".png")
                        attempts=[]
                        for attempt in range(1,4):
                            snap=s.js(STATE)
                            size=s.screenshot(path)
                            end=s.js(EVIDENCE,marker,target)
                            attempts.append({"attempt":attempt,"serialBefore":evidence["serial"],"serialAfter":end["serial"],
                                             "displacementAfter":end["fixtureDisplacement"],"positionAfter":[end["player"]["x"],end["player"]["y"]]})
                            if (max(evidence["fixtureDisplacement"],end["fixtureDisplacement"])<.1 and
                                                    end["serial"]>=evidence["serial"] and (end["anchorGround"]["canvasHit"] or end["anchorHead"]["canvasHit"])):
                                break
                            if attempt<3:
                                evidence,next_settle=settle_view(s,marker,target)
                                settling.extend(next_settle)
                        record={"coverage":"required" if marker in REQUIRED else "supplemental","screenshotAttempts":attempts,"settling":settling,"fixturePositionHeld":True,"target":target,"state":snap,"before":evidence,"after":end,"file":path.name,"size":size}
                        row["markers"].append(record)
                        if settling[-1]["advance"]<2 or end["serial"]<evidence["serial"] or max(evidence["fixtureDisplacement"],end["fixtureDisplacement"])>.1:
                            row["issues"].append("Camera target / frame continuity uncertain: "+marker)
                        if not (end["anchorGround"]["canvasHit"] or end["anchorHead"]["canvasHit"]):
                            row["issues"].append("Native anchor offscreen or under UI: "+marker)
                        if marker=="records" and variant=="after" and not any(m["likelyVisible"] and m["imageReady"] for m in (end["desk"] or {}).get("items",[])):
                            row["issues"].append("No visible projected O01 for this records-room capture")
                        if marker in ("exit","boss-door"):
                            d=end["passage"]
                            if not d or not d["center"]["canvasHit"] or not all(e["inView"] for e in d["ends"]):
                                row["issues"].append("Native door aperture is not fully on screen: "+marker)
                        if size==[w*dpr,h*dpr]:
                            record["pngSha256"]=hashlib.sha256(path.read_bytes()).hexdigest()
                            if any(m is not record and m.get("pngSha256")==record["pngSha256"] for m in row["markers"]):
                                row["issues"].append("Identical PNG at two different markers: "+marker)
                        if snap["active"]!="three" or snap["failed"] or snap["glLost"] is not False or (variant=="after" and (not snap["group"] or snap["overlay"] is None or snap["overlay"].get("lastError"))):
                            row["issues"].append("Lost renderer/overlay: "+marker)
                        if size!=[w*dpr,h*dpr] or snap["viewport"]!=[w,h] or snap["dpr"]!=dpr:row["issues"].append("Viewport/DPR differs: "+marker)
                        if snap["player"]["hp"]<=0 or snap["modal"] or snap["story"] or snap["loading"]:row["issues"].append("Not an active gameplay view: "+marker)
                row["frameIntervalSample"]=frame_sample(s)
                if row["frameIntervalSample"]["renderedGameFrameAdvance"]<2:row["issues"].append("No sustained Three game-frame advance during sample")
                row["collision"]=check_closed_boss_door(s)
                row["testSave"]=save_and_reopen_tab(s,url,view)
                if row["collision"].get("result")!="STOP_AT_CLOSED_FACE_OBSERVED":row["issues"].append("Boss door input evidence incomplete")
                if row["testSave"]["status"]!="RESTORED_777_TEST_SLOT":row["issues"].append("777 save/reopen evidence incomplete")
                row["notes"].append("777 fixtures and actual keys; natural campaign, boss unlock/kill, exit completion and physical GPU/device remain untested.")
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
    rows=[]
    for v in (o.view or VIEWS):
        reference={}
        # Baseline uses the same native vantage as the real desk/door in the candidate.
        for n,url in sorted(urls,key=lambda pair:pair[0]!="after"):
            row=capture(o.driver,o.chrome,url,n,v,o.out,o.seed,reference)
            rows.append(row)
            if n=="after":reference={m["target"]["marker"]:m["target"] for m in row["markers"]}

    comparisons=[]
    if o.before and o.after:
        for view in o.view or VIEWS:
            a,b=[next(r for r in rows if r["label"]==n+"-"+view) for n in ("before","after")]
            matches=bool(a.get("layout") and b.get("layout") and a["layout"]["sha256"]==b["layout"]["sha256"])
            marker=lambda r:{m["target"]["marker"]:m["target"]["fixturePosition"] for m in r["markers"]}
            pa,pb=marker(a),marker(b)
            sameMarkers={m:m in pa and m in pb and pa[m]==pb[m] for m in MARKERS}
            actual=lambda r:{m["target"]["marker"]:[m["after"]["player"]["x"],m["after"]["player"]["y"]] for m in r["markers"]}
            finalA,finalB=actual(a),actual(b)
            finalMatches={m:m in finalA and m in finalB and math.dist(finalA[m],finalB[m])<=.1 for m in MARKERS}
            combat_start=lambda r:next((m["target"].get("matchingCombatStart") for m in r["markers"] if m["target"]["marker"]=="combat"),None)
            sa,sb=combat_start(a),combat_start(b)
            id_matches=bool(sa and sb and sa["enemyId"]==sb["enemyId"])
            starts_match=bool(id_matches and math.dist(sa["pos"],sb["pos"])<.1 and math.dist(sa["end"],sb["end"])<.1)
            input_hero=lambda r,key:((r.get(key) or {}).get("preInput") or {}).get("hero") or {}
            ah=input_hero(a,"baselineCombatSequence");bh=input_hero(b,"combatSequence")
            input_positions=[[h["x"],h["y"]] if "x" in h and "y" in h else None for h in (ah,bh)]
            comparable_input=bool(all(input_positions) and math.dist(*input_positions)<.1)

            comparisons.append({"view":view,"alignedCombatStart":{"before":sa,"after":sb,"sameTargetId":id_matches,"matches":starts_match,
                                "positionsAtBurstInput":input_positions,"inputPositionMatches":comparable_input},"layoutMatches":matches,"fixturePositionMatches":sameMarkers,
                                "actualFinalPositions":{"before":finalA,"after":finalB},"actualPositionMatches":finalMatches,
                                "requiredMarkers":list(REQUIRED),"supplementalMarkers":list(SUPPLEMENTAL),
                                "note":"Only matched layout/positions are usable for direct comparison; live combat may differ."})
    status="CAPTURED" if all(r["status"]=="CAPTURED" for r in rows) and all(c["layoutMatches"] and c["alignedCombatStart"]["matches"] and c["alignedCombatStart"]["inputPositionMatches"] and all(c["fixturePositionMatches"].values()) and all(c["actualPositionMatches"].values()) for c in comparisons) else "INCOMPLETE"
    (o.out/"summary.json").write_text(json.dumps({"status":status,"comparisons":comparisons,"rows":[{k:r[k] for k in ("label","status","issues")} for r in rows],"qualityScore":None,"naturalProgression":False},indent=2)+"\n")
    return 0 if status=="CAPTURED" else 1

if __name__=="__main__":raise SystemExit(main())
