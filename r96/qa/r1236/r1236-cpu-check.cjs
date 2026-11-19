// R1236 CPU check: 블링크(한 순간에 여러 칸 옮김) 때 카메라가 늦게 따라가던 문제(사용자 2026-11-19 "미카엘라등 영웅들 블링크쓸때 카메라가 늦게 따라가는거 개선").
//  실제 모듈(client-source/blink-camera-r1236.js)을 vm 에서 가짜 엔진 카메라 두 가지와 돌린다:
//   (가) PC 이야기 지역의 R81 안정 추적(gain 1-exp(-9dt), dt 상한 .1, 화면 34% 넘게 튀면 바로 맞춤)
//   (나) 엔진 기본 카메라(가운데 32~68%·34~67% 여유 칸 + gain 1-exp(-8dt)) — 모바일·그 밖 지역.
//  브라우저·GPU·실기기 검증 아님.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const F='blink-camera-r1236.js';let src='';try{src=C(F);}catch(_){}
ok('module exists',src.length>0);
{let rt='',idx='',ver='',ci='',inp='';try{rt=RT(F);idx=RT('index.html');ver=fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8');ci=fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8');inp=fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8');}catch(_){}
 ok('runtime copy matches; one tag right after story-half-dmg-r1225 (after R81·R114 camera owners, so it wraps them); in verify list, runtime inputs and CI',
  !!src&&rt===src&&idx.split('"./'+F+'"').length===2&&idx.includes('<script src="./story-half-dmg-r1225.js"></script>\n<script src="./'+F+'"></script>')&&idx.indexOf('"./'+F+'"')>idx.indexOf('"./world-presentation-r81.js"')&&idx.indexOf('"./'+F+'"')>idx.indexOf('"./combat-r114.js"')&&ver.includes("'"+F+"'")&&inp.includes('"'+F+'"')&&ci.includes('qa/r1236/r1236-cpu-check.cjs'));}
if(!src){for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name);console.log(JSON.stringify({status:'R1236_FAILED',passed:checks.filter(c=>c.pass).length,total:checks.length}));process.exit(1);}
const near=(a,b,e=1e-9)=>Math.abs(a-b)<=e;
const TILE=64,W=1280,H=720;
function mk(kind,withOverlay=true){
 const sb={console,Math,JSON,Object,Array,Set,Map,WeakMap,Number,String,Error,isFinite,TILE,W,H,zoom:1,
  player:{x:10,y:10,hero:'michaela',hp:100},room:{id:'murder01'},cam:{x:10,y:10},modal:false,loading:false,started:true,calls:[]};
 sb.window={addEventListener(){} };sb.globalThis=sb;
 sb.clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 sb.project=function(x,y){const dx=x-sb.cam.x,dy=y-sb.cam.y;return{x:W/2+(dx-dy)*TILE*sb.zoom,y:H/2+(dx+dy)*TILE*.5*sb.zoom};};
 vm.createContext(sb);
 if(kind==='r81')vm.runInContext(`function cameraTick(dt){calls.push(dt);if(!player||modal||loading)return;const step=Math.max(0,Math.min(.1,Number(dt)||0)),gain=1-Math.exp(-9*step);
  let x=cam.x+(player.x-cam.x)*gain,y=cam.y+(player.y-cam.y)*gain;const du=(player.x-player.y-x+y)*TILE*zoom,dv=(player.x+player.y-x-y)*TILE*.5*zoom;
  if(Math.abs(du)>W*.34||Math.abs(dv)>H*.34){x=player.x;y=player.y;}cam.x=x;cam.y=y;}`,sb);
 else vm.runInContext(`function cameraTick(dt){calls.push(dt);if(!player||modal||loading)return;const q=project(player.x,player.y),dx=q.x-clamp(q.x,W*.32,W*.68),dy=q.y-clamp(q.y,H*.34,H*.67),gain=1-Math.exp(-8*dt);cam.x+=(dx/(TILE*zoom)+dy/(TILE*.5*zoom))*.5*gain;cam.y+=(dy/(TILE*.5*zoom)-dx/(TILE*zoom))*.5*gain}`,sb);
 if(withOverlay&&src)vm.runInContext(src,sb,{filename:F});
 return sb;}
const off=sb=>{const q=sb.project(sb.player.x,sb.player.y);return Math.hypot(q.x-W/2,q.y-H/2);};
const run=(sb,n,dt=1/60,move)=>{for(let i=0;i<n;i++){if(move)move(sb,i);sb.cameraTick(dt);}};
const api=sb=>sb.window.__STORYWORLD_BLINK_CAMERA_R1236__;
ok('exposes window.__STORYWORLD_BLINK_CAMERA_R1236__ with inspect()',(()=>{const s=mk('r81');return typeof api(s)?.inspect==='function'&&api(s).inspect().revision?.startsWith('R1236');})());

// ① PC R81: 3.8칸 블링크 뒤 0.1초(6프레임) 안에 화면 차이 10% 아래(전에는 exp(-.9)=41%), 0.2초 안에 2% 아래.
{const a=mk('r81'),b=mk('r81',false);for(const s of [a,b]){run(s,30);s.player.x+=3.8*Math.SQRT1_2;s.player.y+=3.8*Math.SQRT1_2*0+0;}
 const e0a=off(a),e0b=off(b);run(a,6);run(b,6);const ra=off(a)/e0a,rb=off(b)/e0b;run(a,6);const ra2=off(a)/e0a;
 ok('① R81: after a 2.7-tile blink, camera error < 10% within 0.1s (baseline ~41%) and < 2% within 0.2s',ra<.10&&ra2<.02&&rb>.35,{withOverlay:+ra.toFixed(3),at02:+ra2.toFixed(4),baseline:+rb.toFixed(3)});
 ok('① catch-up is not a one-frame hard cut (first frame keeps 15~70% of the gap → short smooth whip)',(()=>{const s=mk('r81');run(s,30);s.player.x+=3.8;const e0=off(s);run(s,1);const r=off(s)/e0;return r>.15&&r<.7;})());}
// ② 엔진 카메라(모바일): 블링크로 여유 칸 밖으로 나간 만큼을 0.1초 안에 90% 넘게 따라잡는다(전에는 exp(-.8)=45% 남음).
{const mkOut=s=>{run(s,30);s.player.x+=3.8;s.player.y-=3.8;};const a=mk('engine'),b=mk('engine',false);mkOut(a);mkOut(b);
 const ex=s=>{const q=s.project(s.player.x,s.player.y);return Math.hypot(q.x-s.clamp(q.x,W*.32,W*.68),q.y-s.clamp(q.y,H*.34,H*.67));};
 const e0=ex(a);run(a,6);run(b,6);ok('② engine camera: outside-deadzone error < 10% within 0.1s (baseline ~45%)',e0>20&&ex(a)/e0<.10&&ex(b)/e0>.35,{e0,with:+(ex(a)/e0).toFixed(3),base:+(ex(b)/e0).toFixed(3)});}
// ③ 걷기(프레임당 0.1칸)·달리기 6칸/초 저프레임(0.1초 프레임에 0.6칸)은 카메라 값이 그대로(같은 dt 를 넘김).
{for(const [label,dt,step] of [['walk 60fps',1/60,.1],['run 10fps',.1,.6],['haste 60fps',1/60,.2]]){const a=mk('r81'),b=mk('r81',false);const mv=(s)=>{s.player.x+=step;};run(a,120,dt,mv);run(b,120,dt,mv);
  ok('③ normal follow unchanged: '+label,near(a.cam.x,b.cam.x)&&near(a.cam.y,b.cam.y)&&a.calls.every((d,i)=>d===b.calls[i])&&api(a).inspect().stats.boosts===0,{a:a.cam.x,b:b.cam.x});}}
// ④ 경계: 한 번에 1.0칸은 그대로, 1.3칸은 빠르게.
//  (1.0칸을 60fps 한 프레임에 = 60칸/초 는 돌진 규칙으로 켜지는 게 맞다 → 저프레임(0.1초 프레임) 1.0칸 = 10칸/초 로 경계를 본다.)
{const a=mk('r81');run(a,30);a.player.x+=1.0;run(a,1,.1);const b=mk('r81');run(b,30);b.player.x+=1.3;run(b,1,.1);const c=mk('r81');run(c,30);c.player.x+=.4;run(c,1);
 ok('④ boundary: 1.0-tile step in a 0.1s frame and 0.4-tile step at 60fps not boosted, 1.3-tile jump boosted',api(a).inspect().stats.boosts===0&&api(c).inspect().stats.boosts===0&&api(b).inspect().stats.boosts===1,{a:api(a).inspect().stats,b:api(b).inspect().stats,c:api(c).inspect().stats});}
// ⑤ 빠른 돌진(프레임마다 0.5칸 = 30칸/초)도 따라잡기를 켠다.
{const a=mk('r81'),b=mk('r81',false);const mv=(s,i)=>{if(i<8)s.player.x+=.5;};run(a,30);run(b,30);run(a,8,1/60,mv);run(b,8,1/60,mv);
 ok('⑤ fast dash (0.5 tile/frame) is boosted and ends closer than baseline',api(a).inspect().stats.boosts>=1&&off(a)<off(b)*.6,{a:off(a),b:off(b)});}
// ⑥ 지역·영웅·플레이어 객체가 바뀐 순간과 로딩 중에는 따라잡기를 켜지 않는다(엔진이 맞춤).
{const a=mk('r81');run(a,10);a.room={id:'dist00'};a.player.x+=20;run(a,1);
 const b=mk('r81');run(b,10);b.player={x:40,y:40,hero:'neon',hp:100};run(b,1);
 const c=mk('r81');run(c,10);c.loading=true;c.player.x+=5;run(c,1);c.loading=false;run(c,1);
 const d=mk('r81');run(d,10);d.player.hero='gunner';d.player.x+=3;run(d,1);
 ok('⑥ room change / player swap / loading / hero swap do not boost',[a,b,c,d].every(s=>api(s).inspect().stats.boosts===0),[a,b,c,d].map(s=>api(s).inspect().stats));}
// ⑦ 따라잡기 창이 끝나면 dt 를 그대로 넘긴다(0.25초 뒤).
{const a=mk('r81');run(a,10);a.player.x+=3.8;run(a,15);a.calls.length=0;run(a,5);ok('⑦ boost window ends: dt passed unchanged afterwards',a.calls.length===5&&a.calls.every(d=>d===1/60),a.calls);}
// ⑧ NaN/Infinity 위치·dt 에도 던지지 않고, 엔진에 NaN dt 를 넘기지 않는다.
{const a=mk('r81');run(a,10);let threw=false;try{a.player.x=NaN;a.cameraTick(1/60);a.player.x=10;a.cameraTick(NaN);a.cameraTick(Infinity);a.player.x=Infinity;a.cameraTick(1/60);a.player.x=10;run(a,3);}catch(e){threw=e;}
 ok('⑧ NaN/Infinity safe: no throw, boost count 0, engine never gets NaN from the overlay',!threw&&api(a).inspect().stats.boosts===0&&a.calls.every(d=>d===1/60||Number.isNaN(d)||d===Infinity),{threw:String(threw),calls:a.calls.slice(-6)});}
// ⑨ 큰 dt(멈춤 뒤 1초 프레임) 에서도 빠르게 넘기는 dt 는 .25 를 넘지 않는다.
{const a=mk('engine');run(a,10);a.player.x+=3.8;a.player.y-=3.8;a.cameraTick(1);ok('⑨ boosted dt capped at .25',a.calls.at(-1)<=.25+1e-12&&a.calls.at(-1)>0,a.calls.at(-1));}
// ⑩ 이어진 블링크(0.1초 간격 3번)마다 다시 켠다.
{const a=mk('r81');run(a,10);for(let k=0;k<3;k++){a.player.x+=3.8;run(a,6);}ok('⑩ chained blinks each re-arm the catch-up',api(a).inspect().stats.boosts===3&&off(a)<20,{s:api(a).inspect().stats,off:off(a)});}
// ⑪ 껐을 때(set(false))는 원래 카메라 그대로.
{const a=mk('r81'),b=mk('r81',false);api(a).set(false);run(a,10);run(b,10);a.player.x+=3.8;b.player.x+=3.8;run(a,6);run(b,6);ok('⑪ disabled → identical to original camera',near(a.cam.x,b.cam.x)&&api(a).inspect().stats.boosts===0);}
// ⑫ 같은 파일을 두 번 읽어도 한 번만 감싼다.
{const a=mk('r81');vm.runInContext(src||'',a);run(a,10);a.player.x+=3.8;a.calls.length=0;run(a,1);ok('⑫ loading twice wraps once (one engine call per frame)',a.calls.length===1);}

for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass||c.detail===undefined?'':' '+JSON.stringify(c.detail)));
const passed=checks.filter(c=>c.pass).length;console.log(JSON.stringify({status:passed===checks.length?'R1236_PASSED':'R1236_FAILED',passed,total:checks.length}));process.exit(passed===checks.length?0:1);
