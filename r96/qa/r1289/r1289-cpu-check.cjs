// R1289 CPU check: 짧은 블링크(벽·장애물에 막혀 1.2칸이 못 되게 옮긴 블링크)도 카메라가 그 프레임에 붙는다
//  (사용자 2026-11-21 "블링크쓰고 카메라가 늦게 따라가는오류 개선수정 관련문제 조사해서").
//  헤드리스 전수(qa/r1289/census.mjs): 블링크 76회 중 4회가 1.04~1.17칸만 옮겨 R1266 거리 기준(1.2칸)·돌진 기준(14칸/초)에 안 걸려
//  12~20px 가 2~3프레임 끌려왔다(네온 터치·헌터 걸으며·페르소나 걸으며·네온 걸으며). → blink() 호출 자체를 신호로 쓴다.
//  실제 모듈(client-source/blink-camera-r1236.js)을 vm 에서 가짜 엔진 blink·카메라와 돌린다. 브라우저·GPU·실기기 검증 아님.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const F='blink-camera-r1236.js';let src='';try{src=fs.readFileSync(path.join(R,'client-source',F),'utf8');}catch(_){}
let ci='';try{ci=fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8');}catch(_){}
ok('module exists, runtime copy matches, CI runs this check',src.length>0&&fs.readFileSync(path.join(R,'runtime-text',F),'utf8')===src&&ci.includes('qa/r1289/r1289-cpu-check.cjs'));
const TILE=64,W=1280,H=720;
function mk(o={}){
 const sb={console,Math,JSON,Object,Array,Set,Map,WeakMap,Number,String,Error,isFinite,TILE,W,H,zoom:.8,wallAt:o.wallAt??null,
  player:{x:10,y:10,hero:'neon',hp:100,blinkCD:0,invincible:0},room:{id:'murder01'},cam:{x:10,y:10},modal:false,loading:false,started:true,calls:[]};
 sb.window={addEventListener(){}};sb.globalThis=sb;
 sb.project=function(x,y){const dx=x-sb.cam.x,dy=y-sb.cam.y;return{x:W/2+(dx-dy)*TILE*sb.zoom,y:H/2+(dx+dy)*TILE*.5*sb.zoom};};
 vm.createContext(sb);
 vm.runInContext(`let current=null;function cameraTick(dt){calls.push(dt);if(!player||modal||loading)return;const changed=!current||current.room!==room,step=Math.max(0,Math.min(.1,Number(dt)||0)),gain=changed?1:1-Math.exp(-9*step);
  const x=changed?player.x:current.x+(player.x-current.x)*gain,y=changed?player.y:current.y+(player.y-current.y)*gain;cam.x=x;cam.y=y;current={room,x,y};}
  function blink(){if(!started||modal||loading||player.hp<=0||player.blinkCD>0)return;let nx=player.x+3.8;if(wallAt!==null)nx=Math.min(nx,wallAt);player.x=nx;player.invincible=.38;player.blinkCD=4;}`,sb);
 if(o.innerWrap)vm.runInContext(`{const b=blink;blink=function(...a){return b.apply(this,a);};}`,sb);
 if(src)vm.runInContext(src,sb,{filename:F});
 if(o.outerWrap)vm.runInContext(`{const b=blink;blink=function(...a){const r=b.apply(this,a);return r;};}`,sb);
 return sb;}
const off=s=>{const q=s.project(s.player.x,s.player.y);return Math.hypot(q.x-W/2,q.y-H/2);};
const run=(s,n,dt=1/60)=>{for(let i=0;i<n;i++)s.cameraTick(dt);};
if(!src){for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name);console.log(JSON.stringify({status:'R1289_FAILED',passed:0,total:checks.length}));process.exit(1);}
// ① 벽에 막힌 짧은 블링크(1.0칸·0.6칸) — 저프레임(0.1초)·60fps 모두 그 프레임에 맞춤
for(const [w,dt] of [[11,.1],[10.6,.1],[11,1/60],[10.6,1/30]]){const s=mk({wallAt:w});run(s,30,dt);s.blink();const e0=off(s);s.cameraTick(dt);
 ok(`① short blink ${(w-10).toFixed(1)} tile @dt ${dt.toFixed(3)} → same-frame error < 1% (was lagging)`,e0>10&&off(s)<=e0*.01,{e0:+e0.toFixed(1),after:+off(s).toFixed(2)});}
// ② 블링크 래퍼가 이 파일 안쪽(먼저)·바깥쪽(나중)에 있어도 같음
for(const o of [{innerWrap:true},{outerWrap:true}]){const s=mk({wallAt:11,...o});run(s,30,.1);s.blink();const e0=off(s);s.cameraTick(.1);ok('② works with '+Object.keys(o)[0],off(s)<=e0*.01,{after:off(s)});}
// ③ 옮기지 못한 블링크(이미 벽에 붙음)·쿨다운 중 블링크는 맞춤 없음(카메라 한 번)
{const s=mk({wallAt:10});run(s,30,.1);s.blink();s.calls.length=0;s.cameraTick(.1);const t=mk();run(t,30,.1);t.player.blinkCD=2;t.blink();t.calls.length=0;t.cameraTick(.1);
 ok('③ blink that did not move / on cooldown → single camera call',s.calls.length===1&&t.calls.length===1,{a:s.calls.length,b:t.calls.length});}
// ④ 블링크 아닌 1.0칸 걸음(저프레임)은 그대로(R1266 ④와 같음)
{const s=mk();run(s,30,.1);s.player.x+=1.0;s.calls.length=0;s.cameraTick(.1);ok('④ non-blink 1.0-tile step at 0.1s frame keeps one camera call',s.calls.length===1);}
// ⑤ 블링크 표시는 한 번만 쓰인다(다음 프레임은 다시 한 번 호출)
{const s=mk({wallAt:11});run(s,30,.1);s.blink();s.cameraTick(.1);s.calls.length=0;run(s,3,.1);ok('⑤ blink flag consumed once',s.calls.length===3,s.calls);}
// ⑥ 창 열림·로딩 중 블링크 표시는 버려진다(닫힌 뒤 맞춤 없음)
{const s=mk({wallAt:11});run(s,30,.1);s.blink();s.modal=true;s.cameraTick(.1);s.modal=false;s.calls.length=0;s.cameraTick(.1);ok('⑥ flag dropped while modal',s.calls.length===1,s.calls.length);}
// ⑦ 영웅 객체가 바뀐 뒤(다른 플레이어)는 맞춤 없음
{const s=mk({wallAt:11});run(s,30,.1);s.blink();s.player={x:40,y:40,hero:'neon',hp:100,blinkCD:0};s.calls.length=0;s.cameraTick(.1);ok('⑦ flag ignored after player swap',s.calls.length===1);}
// ⑧ inspect 에 blinkSnaps
{const s=mk({wallAt:11});run(s,30,.1);s.blink();s.cameraTick(.1);const i=s.window.__STORYWORLD_BLINK_CAMERA_R1236__.inspect();ok('⑧ inspect().stats.blinkSnaps counts blink-triggered settles and revision mentions R1289',i.stats.blinkSnaps===1&&/R1289/.test(i.revision),i);}
for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass||c.detail===undefined?'':' '+JSON.stringify(c.detail)));
const passed=checks.filter(c=>c.pass).length;console.log(JSON.stringify({status:passed===checks.length?'R1289_PASSED':'R1289_FAILED',passed,total:checks.length}));process.exit(passed===checks.length?0:1);
