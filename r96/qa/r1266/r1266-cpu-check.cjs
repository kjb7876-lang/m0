// R1266 CPU check: S 블링크 순간 카메라 지연 0(사용자 2026-11-20 "모든영웅 s블링크 하면 카메라 뒤늦게 따라오는거 짜증난데 개선해줘").
//  R1236 은 0.22초 동안 카메라 시간을 6배로 줬지만 카메라들(R81·R1245·R63)이 한 번에 dt .1 까지만 받아 블링크 뒤 첫 화면에
//  차이 41%가 남았다(헤드리스 1280×720: 41px→25→18→15, 3~4프레임). 이 검사는 블링크가 일어난 그 카메라 갱신 안에서
//  화면 차이가 1% 아래로 맞춰지기를 요구한다. 실제 모듈(client-source/blink-camera-r1236.js)을 vm 에서 가짜 카메라와 돌린다.
//  가짜 카메라: (가) R81·R1245 처럼 cam 이 아닌 자기 상태(current)로 추적, (나) R63 처럼 cam 을 읽어 추적, (다) R114 처럼 원거리
//  실검무 기준점(anchor)을 따라가는 안쪽 감싸기, (라) R1124 무한생존 중앙 고정. 브라우저·GPU·실기기 검증 아님.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const F='blink-camera-r1236.js';let src='';try{src=fs.readFileSync(path.join(R,'client-source',F),'utf8');}catch(_){}
let ci='';try{ci=fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8');}catch(_){}
ok('module exists, runtime copy matches, CI runs this check',src.length>0&&fs.readFileSync(path.join(R,'runtime-text',F),'utf8')===src&&ci.includes('qa/r1266/r1266-cpu-check.cjs'));
const TILE=64,W=1280,H=720;
function mk(kind,o={}){
 const sb={console,Math,JSON,Object,Array,Set,Map,WeakMap,Number,String,Error,isFinite,TILE,W,H,zoom:.8,
  player:{x:10,y:10,hero:o.hero||'michaela',hp:100},room:{id:'murder01'},cam:{x:10,y:10},modal:false,loading:false,started:true,calls:[],anchor:null,pinAt:null};
 sb.window={addEventListener(){}};sb.globalThis=sb;
 sb.project=function(x,y){const dx=x-sb.cam.x,dy=y-sb.cam.y;return{x:W/2+(dx-dy)*TILE*sb.zoom,y:H/2+(dx+dy)*TILE*.5*sb.zoom};};
 vm.createContext(sb);
 if(kind==='own')vm.runInContext(`let current=null;function cameraTick(dt){calls.push(dt);if(!player||modal||loading)return;const changed=!current||current.room!==room,step=Math.max(0,Math.min(.1,Number(dt)||0)),gain=changed?1:1-Math.exp(-9*step);
  let x=changed?player.x:current.x+(player.x-current.x)*gain,y=changed?player.y:current.y+(player.y-current.y)*gain;const du=(player.x-player.y-x+y)*TILE*zoom,dv=(player.x+player.y-x-y)*TILE*.5*zoom;
  if(Math.abs(du)>W*.34||Math.abs(dv)>H*.34){x=player.x;y=player.y;}cam.x=x;cam.y=y;current={room,x,y};}`,sb);
 else vm.runInContext(`function cameraTick(dt){calls.push(dt);if(!player||modal||loading)return;const gain=1-Math.exp(-9*Math.min(.1,Math.max(0,Number(dt)||0)));cam.x+=(player.x-cam.x)*gain;cam.y+=(player.y-cam.y)*gain;}`,sb);
 if(o.anchor)vm.runInContext(`{const b=cameraTick;cameraTick=function(dt,...a){if(!anchor)return b.call(this,dt,...a);const ox=player.x,oy=player.y;player.x=anchor.x;player.y=anchor.y;try{return b.call(this,dt,...a);}finally{player.x=ox;player.y=oy;}};}`,sb);
 if(src)vm.runInContext(src,sb,{filename:F});
 if(o.pin)vm.runInContext(`{const b=cameraTick;cameraTick=function(...a){const r=b.apply(this,a);if(pinAt){cam.x=pinAt.x;cam.y=pinAt.y;}return r;};}`,sb);
 return sb;}
const off=s=>{const q=s.project(s.player.x,s.player.y);return Math.hypot(q.x-W/2,q.y-H/2);};
const run=(s,n,dt=1/60,mv)=>{for(let i=0;i<n;i++){if(mv)mv(s,i);s.cameraTick(dt);}};
const api=s=>s.window.__STORYWORLD_BLINK_CAMERA_R1236__;
if(!src){for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name);console.log(JSON.stringify({status:'R1266_FAILED',passed:0,total:checks.length}));process.exit(1);}
// ① 블링크 3.8칸(대각선·가로·세로) → 그 프레임 안에 화면 차이 < 1% (두 카메라 모두)
for(const kind of ['own','cam'])for(const [dx,dy] of [[3.8,0],[0,-3.8],[2.69,2.69],[-1.3,0]]){const s=mk(kind);run(s,60);const e0=(()=>{s.player.x+=dx;s.player.y+=dy;return off(s);})();s.cameraTick(1/60);
 ok(`① ${kind}: blink (${dx},${dy}) → same-frame screen error < 1% (was ~41%)`,off(s)<=Math.max(.5,e0*.01),{e0:+e0.toFixed(1),after:+off(s).toFixed(3),calls:s.calls.length});}
// ② 30fps·10fps 기기에서도 같은 프레임에 맞춤
for(const dt of [1/30,.1]){const s=mk('own');run(s,30,dt);s.player.x+=3.8;const e0=off(s);s.cameraTick(dt);ok('② low fps dt='+dt.toFixed(3)+': same-frame error < 1%',off(s)<=e0*.01,{after:off(s)});}
// ③ 걷기·달리기·저프레임은 원래 카메라와 똑같다(dt·호출 수·위치)
for(const [label,dt,step] of [['walk 60fps',1/60,.1],['run 10fps',.1,.6],['haste 60fps',1/60,.2]]){const a=mk('own');const b=(()=>{const sb={...{}};return null})();
 const ref=mk('own');api(ref).set(false);const mv=s=>{s.player.x+=step;};run(a,120,dt,mv);run(ref,120,dt,mv);
 ok('③ normal follow unchanged: '+label,Math.abs(a.cam.x-ref.cam.x)<1e-9&&a.calls.length===ref.calls.length&&a.calls.every((d,i)=>d===ref.calls[i]),{a:a.cam.x,b:ref.cam.x,ca:a.calls.length,cb:ref.calls.length});}
// ④ 경계: 0.4칸(60fps)·1.0칸(0.1초 프레임)은 맞춤 없음, 1.3칸은 맞춤
{const a=mk('own');run(a,30);a.player.x+=.4;a.calls.length=0;a.cameraTick(1/60);const b=mk('own');run(b,30,.1);b.player.x+=1.0;b.calls.length=0;b.cameraTick(.1);const c=mk('own');run(c,30);c.player.x+=1.3;c.cameraTick(1/60);
 ok('④ boundary: small steps keep one camera call, 1.3-tile jump snaps',a.calls.length===1&&b.calls.length===1&&off(c)<1,{a:a.calls.length,b:b.calls.length,c:off(c)});}
// ⑤ 맞춘 뒤 다음 프레임부터는 원래대로(한 프레임에 카메라 1번, dt 그대로)
{const s=mk('own');run(s,30);s.player.x+=3.8;s.cameraTick(1/60);s.calls.length=0;run(s,20);ok('⑤ after the snap: one call per frame with the real dt',s.calls.length===20&&s.calls.every(d=>d===1/60),s.calls.slice(0,4));}
// ⑥ 원거리 실검무 기준점(R114 anchor) 이 잡고 있으면 카메라는 기준점에 머문다(영웅을 따라가지 않음)
{const s=mk('own',{anchor:true});run(s,30);s.anchor={x:10,y:10};s.player.x+=3.8;run(s,5);ok('⑥ R114 anchor hold respected: camera stays on the anchor',Math.hypot(s.cam.x-10,s.cam.y-10)<1e-6,{cam:s.cam});}
// ⑦ 무한생존 중앙 고정(R1124) 은 그대로
{const s=mk('own',{pin:true});s.pinAt={x:50,y:50};run(s,10);s.player.x+=3.8;s.cameraTick(1/60);ok('⑦ R1124 survival pin unchanged',s.cam.x===50&&s.cam.y===50);}
// ⑧ 지역 바뀜·영웅 바뀜·로딩·창 열림에서는 추가 호출 없음
{const out=[];for(const f of [s=>{s.room={id:'dist00'};s.player.x+=20;},s=>{s.player.hero='neon';s.player.x+=3.8;},s=>{s.loading=true;s.player.x+=3.8;},s=>{s.modal=true;s.player.x+=3.8;}]){const s=mk('own');run(s,30);f(s);s.calls.length=0;s.cameraTick(1/60);out.push(s.calls.length);}
 ok('⑧ room/hero change, loading, modal → single camera call',out.every(n=>n===1),out);}
// ⑨ 추가 호출은 블링크 한 번에 30번 이하, NaN/Infinity 에도 던지지 않음
{const s=mk('own');run(s,30);s.player.x+=60;s.calls.length=0;s.cameraTick(1/60);const n=s.calls.length;let threw=false;try{s.player.x=NaN;s.cameraTick(1/60);s.player.x=10;s.cameraTick(NaN);s.cameraTick(Infinity);}catch(e){threw=e;}
 ok('⑨ bounded work (≤ 30 camera calls per blink) and NaN safe',n>=1&&n<=30&&!threw,{n,threw:String(threw)});}
// ⑩ 이어진 블링크 3번(0.1초 간격) 모두 그 프레임에 맞춤, 빠른 돌진(프레임마다 0.5칸)도 프레임마다 맞춤
{const s=mk('own');run(s,30);const errs=[];for(let k=0;k<3;k++){s.player.x+=3.8;s.cameraTick(1/60);errs.push(off(s));run(s,5);}
 const d=mk('own');run(d,30);const de=[];for(let i=0;i<8;i++){d.player.x+=.5;d.cameraTick(1/60);de.push(off(d));}
 ok('⑩ chained blinks and fast dash each settle in-frame',errs.every(e=>e<1)&&de.every(e=>e<1),{errs,de});}
// ⑪ 껐을 때(set(false)) 는 원래 카메라와 같다
{const a=mk('own'),b=mk('own');api(a).set(false);api(b).set(false);run(a,10);run(b,10);a.player.x+=3.8;a.cameraTick(1/60);ok('⑪ disabled → one call, original lag kept',a.calls.length===11&&off(a)>20);}
// ⑫ inspect 에 snaps 수
{const s=mk('own');run(s,10);s.player.x+=3.8;s.cameraTick(1/60);ok('⑫ inspect().stats.snaps counts in-frame settles',api(s).inspect().stats.snaps===1&&/R1266/.test(api(s).inspect().revision),api(s).inspect());}
for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass||c.detail===undefined?'':' '+JSON.stringify(c.detail)));
const passed=checks.filter(c=>c.pass).length;console.log(JSON.stringify({status:passed===checks.length?'R1266_PASSED':'R1266_FAILED',passed,total:checks.length}));process.exit(passed===checks.length?0:1);
