// R1245 CPU check: 스토리 사몽 세계·사몽 에피소드(꿈 층 DREAM)의 카메라 기본 시야를 스토리(PC R81 안정 추적) 기준으로 맞춘다
//  (사용자 2026-11-19 "스토리쪽이랑 사몽쪽 사몽에피소드까지 카메라 기본시야 맞춰줘 스토리기준으로").
//  헤드리스 실측(qa/r1245/probe.mjs, 1280×720 PC): 스토리 zoom .8133(R63 목표 .6667 × R81 1.22, 영웅 가운데 고정),
//  꿈 층·사몽 에피소드 zoom .6667(R63 그대로 → 가로·세로 22% 더 넓게 보임, 맵 가장자리에서 영웅이 가운데를 벗어남).
//  실제 모듈을 vm 에서 가짜 R63 카메라(목표 zoom 으로 지수 수렴 + 맵 경계 clamp)와 돌린다. 브라우저·GPU·실기기 검증 아님.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const F='dream-camera-r1245.js';let src='';try{src=C(F);}catch(_){}
ok('module exists',src.length>0);
{let rt='',idx='',ver='',ci='',inp='';try{rt=RT(F);idx=RT('index.html');ver=fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8');ci=fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8');inp=fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8');}catch(_){}
 ok('runtime copy matches; one tag right after world-presentation-r81 (same place in the cameraTick chain as R81: inside R114·R217·R1236·R1124); in verify list, runtime inputs and CI',
  !!src&&rt===src&&idx.split('"./'+F+'"').length===2&&idx.includes('<script src="./world-presentation-r81.js"></script>\n<script src="./'+F+'"></script>')&&ver.includes("'"+F+"'")&&inp.includes(F)&&ci.includes('node r96/qa/r1245/r1245-cpu-check.cjs'));}
if(!src){for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name);console.log(JSON.stringify({status:'R1245_FAILED',passed:checks.filter(c=>c.pass).length,total:checks.length}));process.exit(1);}
const near=(a,b,e=1e-6)=>Math.abs(a-b)<=e;
const TILE=64;
// 가짜 R63: 목표 zoom = base/actual(.6667), 지수 수렴, 맵 경계(u·v 0~40) clamp. R81 은 STORY 층만 잡는다.
function mk({layer='DREAM',mobile=false,coop='off',survival=false,W=1280,H=676,ls=null}={}){
 const store=new Map();if(ls)for(const [k,v] of Object.entries(ls))store.set(k,v);
 const sb={console,Math,JSON,Object,Array,Set,Map,WeakMap,Number,String,Error,isFinite,TILE,W,H,zoom:1,layer,
  player:{x:20,y:20,hp:100},room:{id:'sz115-S06-1',survivalR600:survival?{centre:{x:5,y:5}}:undefined},cam:{x:20,y:20},modal:false,loading:false,started:true,calls:0};
 sb.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))};
 sb.matchMedia=()=>({matches:mobile});sb.mobile=()=>mobile;
 sb.window={addEventListener(){},__STORYWORLD_COOP_SIM_R62__:{mode:()=>coop},__STORYWORLD_WORLD_PRESENTATION_R81__:{ownsCamera:()=>sb.layer==='STORY'&&!mobile,inspect:()=>({pcZoomFactor:1.22})}};sb.globalThis=sb;
 const plan=()=>({targetZoom:1/1.5,envelope:{u0:-20,u1:20,v0:0,v1:80}});
 sb.window.__STORYWORLD_CAMERA_R63__={plan,ownsCamera:true};
 vm.createContext(sb);
 vm.runInContext(`function cameraTick(dt){calls++;if(!player||modal||loading)return;const p=window.__STORYWORLD_CAMERA_R63__.plan(),a=dt<=0?1:1-Math.exp(-10*Math.min(.1,dt));zoom+=(p.targetZoom-zoom)*a;
  const g=1-Math.exp(-9*Math.min(.1,Math.max(0,dt)));cam.x+=(player.x-cam.x)*g;cam.y+=(player.y-cam.y)*g;
  const e=p.envelope,halfU=W/(2*TILE*zoom),up=H*.52/(TILE*.5*zoom),down=H*.48/(TILE*.5*zoom),u=cam.x-cam.y,v=cam.x+cam.y,cu=Math.max(e.u0+halfU,Math.min(e.u1-halfU,u)),cv=Math.max(e.v0+up,Math.min(e.v1-down,v));cam.x=(cv+cu)/2;cam.y=(cv-cu)/2;}`,sb);
 vm.runInContext(src,sb,{filename:F});return sb;}
const run=(sb,n=60,dt=1/60)=>{for(let i=0;i<n;i++)sb.cameraTick(dt);};
const story=.8133333333; // R63 .6667 × R81 1.22
// 1) 정상: PC 꿈 층 기본 zoom = 스토리 기준(R63 목표 × 1.22), 영웅이 가운데
{const sb=mk();run(sb,120);ok('PC dream: base zoom equals story (R63 target × 1.22)',near(sb.zoom,story,1e-4),sb.zoom);
 ok('PC dream: camera centred on hero like story (no envelope offset)',near(sb.cam.x,sb.player.x,1e-6)&&near(sb.cam.y,sb.player.y,1e-6),sb.cam);
 ok('PC dream: engine/R63 tracker not double-run (one owner per tick)',sb.calls===0,sb.calls);}
// 2) 경계: 맵 가장자리(u=19, 경계 20)에서도 스토리처럼 영웅 가운데(엔진 clamp 가 밀어내지 않음)
{const sb=mk();sb.player.x=40;sb.player.y=21;sb.cam.x=40;sb.cam.y=21;run(sb,120);ok('PC dream at map edge: hero stays centred (story follow offset)',near(sb.cam.x,40,1e-6)&&near(sb.cam.y,21,1e-6),sb.cam);}
// 3) 회귀: 반복 tick 에도 zoom 이 쌓이지 않음(1000번)
{const sb=mk();run(sb,1000);ok('repeated ticks do not accumulate zoom',near(sb.zoom,story,1e-4),sb.zoom);}
// 4) 회귀: 바깥 R217 처럼 tick 사이에 전역 zoom 을 바꿔도(시야 배율 .8 → zoom/.8) 다음 tick 목표는 그대로
{const sb=mk();run(sb,60);for(let i=0;i<50;i++){sb.cameraTick(1/60);sb.zoom=sb.zoom/.8;}const z=sb.zoom*.8;ok('outer view factor (R217 style) does not compound',near(z,story,1e-4),z);}
// 5) 걷기: 지수 추적(스토리와 같은 gain 1-exp(-9dt), dt 상한 .1)
{const sb=mk();run(sb,60);sb.player.x+=.5;sb.cameraTick(1/60);const g=1-Math.exp(-9/60);ok('walking follow uses story gain 1-exp(-9dt)',near(sb.cam.x,20+.5*g,1e-9),sb.cam.x);
 sb.player.x=sb.cam.x+.3;const cx=sb.cam.x;sb.cameraTick(5);ok('dt capped at .1 like story',near(sb.cam.x,cx+.3*(1-Math.exp(-.9)),1e-9),sb.cam.x);}
// 6) 순간이동(화면 34% 넘음): 스토리처럼 한 번에 맞춤
{const sb=mk();run(sb,60);sb.player.x+=30;sb.cameraTick(1/60);ok('teleport snaps camera like story',near(sb.cam.x,sb.player.x,1e-9),sb.cam);}
// 7) 방 바뀜: 첫 tick 에 바로 맞춤(목표 zoom·위치)
{const sb=mk();run(sb,60);sb.room={id:'sz115-S06-2'};sb.player.x=5;sb.player.y=6;sb.cameraTick(1/60);ok('room change snaps zoom and position',near(sb.zoom,story,1e-6)&&near(sb.cam.x,5)&&near(sb.cam.y,6),[sb.zoom,sb.cam]);}
// 8) 건드리지 않는 경우: 스토리 층·모바일·멀티·무한생존 → 원래 카메라 그대로
for(const [n,o] of [['story layer',{layer:'STORY'}],['mobile',{mobile:true}],['coop',{coop:'host'}],['survival',{survival:true}]]){const a=mk(o);run(a,120);
 ok(n+': untouched (original camera runs, zoom = R63 target)',a.calls===120&&near(a.zoom,1/1.5,1e-4),{calls:a.calls,zoom:a.zoom});}
// 9) 끄기 스위치
{const sb=mk({ls:{'storyworld.r1245.dreamCamera':'{"on":false}'}});run(sb,120);ok('switch off restores original camera',sb.calls===120&&near(sb.zoom,1/1.5,1e-4),sb.zoom);}
// 10) 잘못된 값: 영웅 좌표 NaN 이면 원래 카메라로 넘기고 zoom·cam 유한
{const sb=mk();run(sb,30);sb.player.x=NaN;sb.cameraTick(1/60);sb.player.x=20;run(sb,30);ok('NaN hero falls back without poisoning camera',Number.isFinite(sb.zoom+sb.cam.x+sb.cam.y),[sb.zoom,sb.cam]);}
// 11) 모달·로딩 중엔 움직이지 않음(스토리 R81 은 cameraEnabled 여도 엔진 조건과 같게 멈추지 않음 → 원래 카메라에 넘김)
{const sb=mk();run(sb,60);sb.loading=true;const c0=sb.calls;sb.cameraTick(1/60);ok('loading: delegates to original',sb.calls===c0+1,sb.calls-c0);}
// 12) API
{const sb=mk();ok('API exposes revision, factor 1.22 from R81, inspect',sb.window.__STORYWORLD_DREAM_CAMERA_R1245__?.factor?.()===1.22&&typeof sb.window.__STORYWORLD_DREAM_CAMERA_R1245__.inspect==='function');}
for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
const passed=checks.filter(c=>c.pass).length;console.log(JSON.stringify({status:passed===checks.length?'R1245_PASSED':'R1245_FAILED',passed,total:checks.length}));process.exit(passed===checks.length?0:1);
