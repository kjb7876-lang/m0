// R1364 3D 헌터 활시위 순환(놓기 반동 → 화살 걸기 → 당기기 → 조준 정지)·시위 휨·3D 시위 기준점 발사 — CPU 검사
//  ① 연결: 원본 = runtime-text 사본, 스크립트 태그 한 번(R1336 바로 뒤, combat-r118 앞), sync 목록·공개 검사 목록·CI 줄
//  ② phase(): 단계 경계·가중치 합 1·시위 쥠(놓기~되돌림 0, 걸기~정지 1)·반동은 놓은 직후 1 → 30% 에 0, 주기 경계(0.15~0.9)·NaN → 조준 정지
//  ③ launch3d(): 꼬리(탄 자리 − 반 길이) = 3D 기준점, 그리기 높이 보정, 같은 표적·분산 각 유지, 수명 보정, 잘못된 입력 → null
//  ④ R1336 연동: 순환 자리 표(follow 뒤·nock 시위 쪽·recoil 앞), 스킬 가중치, 시위 휨 되돌림, anchor() 공개, 기존 POSE 그대로
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..'),rd=f=>{try{return fs.readFileSync(path.join(R,f),'utf8');}catch(_){return null;}};
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const F='hunter-cycle-3d-r1364.js',src=rd('client-source/'+F),html=rd('runtime-text/index.html')||'';
ok(!!src&&src===rd('runtime-text/'+F),'① 원본 = runtime-text 사본');
const tags=html.split('\n').filter(l=>l.includes('./'+F));ok(tags.length===1&&tags[0].trim()==='<script src="./'+F+'"></script>','① 스크립트 태그 한 번, 따로 한 줄');
const at=n=>html.indexOf('./'+n+'"');ok(at('hunter-draw-3d-r1336.js')>0&&at(F)>at('hunter-draw-3d-r1336.js')&&at(F)<at('combat-r118.js')&&at('hunter-aim-r1102.js')<at(F),'① 태그 순서: R1102·R1336 뒤, combat-r118 앞');
ok((rd('runtime-inputs.json')||'').includes(F)&&(rd('runtime-manifest.json')||'').includes(F),'① sync 목록(runtime-inputs·manifest)');
ok((rd('../scripts/verify-r96-public.py')||'').includes(F),'① 공개 검사 목록');ok((rd('../.github/workflows/pages.yml')||'').includes('r96/qa/r1364/r1364-cpu-check.cjs'),'① CI 검사 줄');
const win={};const sb={window:win,localStorage:{getItem:()=>null,setItem(){}},document:{readyState:'loading'},performance:{now:()=>0},Number,Math,Object,String,Array,JSON,console};win.addEventListener=()=>{};
vm.createContext(sb);let err=null;try{vm.runInContext(src||'',sb);}catch(e){err=e;}const A=win.__STORYWORLD_HUNTER_CYCLE_R1364__;ok(!err&&!!A&&A.on()===true,'② 불러옴, 기본 켜짐'+(err?' '+err:''));
if(A){const P=.5,ph=t=>A.phase(t,P),sum=o=>o.wa+o.wf+o.wn,near=(a,b,e=1e-6)=>Math.abs(a-b)<=e;
 let bad=0;for(let t=0;t<=1.2;t+=.0025){const o=ph(t);if(!near(sum(o),1)||[o.wa,o.wf,o.wn,o.str,o.recoil].some(v=>!(v>=0&&v<=1)))bad++;}ok(bad===0,'② 가중치 합 1, 모두 0~1 ('+bad+')');
 const C=A.CUT;ok(C.snap<C.follow&&C.follow<C.back&&C.back<C.nock&&C.nock<C.draw&&C.draw<1,'② 단계 순서 놓기<반동<되돌림<걸기<당기기<정지');
 ok(near(ph(0).wa,1)&&ph(0).str===0&&near(ph(0).recoil,1),'② 놓는 순간: 손은 기준점에서 출발, 시위 놓음, 반동 최대');
 ok(near(ph(P*.14).wf,1)&&ph(P*.14).stage==='follow','② 반동 유지: 손이 뒤로 빠진 자리');
 ok(near(ph(P*.39).wn,1)&&ph(P*.39).str===1&&ph(P*.39).stage==='nock','② 화살 걸기: 활 곁에서 시위를 잡음');
 ok(ph(P*.6).stage==='draw'&&ph(P*.6).wa>0&&ph(P*.6).wn>0&&ph(P*.6).str===1,'② 당기기: 활 곁 → 기준점 사이');
 ok(near(ph(P*.8).wa,1)&&near(ph(P*3).wa,1)&&ph(P*3).stage==='hold','② 조준 정지: 다음 발사까지 기준점 유지');
 ok(near(ph(P*.3).recoil,0)&&ph(P*.1).recoil>0&&ph(P*.1).recoil<1,'② 반동은 놓은 뒤 30% 안에 줄어 0');
 let mono=true,prev=-1;for(let t=P*.42;t<=P*.78;t+=P/200){const w=ph(t).wa;if(w<prev-1e-9)mono=false;prev=w;}ok(mono,'② 당기기 동안 기준점 가중치 단조 증가(되감기 없음)');
 ok(A.phase(NaN,.5).stage==='hold'&&A.phase(-1,.5).stage==='hold'&&A.phase(.02,NaN).stage==='release','② 경계: NaN·음수 경과 → 정지, 주기 NaN → 기본값');
 ok(A.phase(.1,.01).stage===A.phase(.1,.15).stage&&A.phase(.5,9).stage===A.phase(.5,.9).stage,'② 경계: 주기는 0.15~0.9초로 묶음');
 // ③ launch3d
 const TILE=34,zoom=.8,foot={x:10,y:10},a0=Math.atan2(1,4),s={x:10,y:10,vx:6*Math.cos(a0),vy:6*Math.sin(a0),life:1.4},target={x:14,y:11},off={dx:-1.4,dy:-40},half=13.4;
 const L=A.launch3d(foot,off,{zoom,TILE,half},s,target);const pj=q=>({x:(q.x-q.y)*TILE*zoom,y:(q.x+q.y)*TILE*.5*zoom});
 ok(!!L,'③ 결과 있음');if(L){const f=pj(foot),g=pj(L),t=pj(target),sx=t.x-f.x,sy=t.y-f.y,sl=Math.hypot(sx,sy),tail={x:g.x-sx/sl*half-f.x,y:g.y-18*zoom-sy/sl*half-f.y};
  ok(Math.hypot(tail.x-off.dx,tail.y-off.dy)<1e-6,'③ 화살 꼬리 = 3D 기준점 화면 자리 ('+tail.x.toFixed(3)+','+tail.y.toFixed(3)+')');
  ok(near(Math.hypot(L.vx,L.vy),6,1e-9)&&near(Math.atan2(L.vy,L.vx),Math.atan2(target.y-L.y,target.x-L.x),1e-9),'③ 탄속 그대로, 표적을 향함');
  ok(near(L.life,1.4+(Math.hypot(target.x-L.x,target.y-L.y)-Math.hypot(target.x-s.x,target.y-s.y))/6,1e-9),'③ 수명은 늘거나 준 거리만큼');
  const s2={...s,vx:6*Math.cos(a0+.14),vy:6*Math.sin(a0+.14)},L2=A.launch3d(foot,off,{zoom,TILE,half},s2,target);
  ok(L2&&near(Math.atan2(L2.vy,L2.vx)-Math.atan2(target.y-L2.y,target.x-L2.x),.14,1e-9),'③ 분산 각 유지');}
 ok(A.launch3d(foot,{dx:NaN,dy:0},{zoom,TILE,half},s,target)===null&&A.launch3d(foot,off,{zoom,TILE,half},{...s,vx:0,vy:0},target)===null&&A.launch3d(null,off,{},s,target)===null,'③ 잘못된 입력 → null(엔진 출발점 유지)');}
// ④ R1336 연동
{const d=rd('client-source/hunter-draw-3d-r1336.js')||'';ok(d===rd('runtime-text/hunter-draw-3d-r1336.js'),'④ R1336 원본 = 사본');
 const m=d.match(/const CYCLE=\{follow:\[([^\]]+)\],nock:\[([^\]]+)\],recoil:\[([^\]]+)\]\}/);ok(!!m,'④ 순환 자리 표');
 if(m){const [f,n,r]=[m[1],m[2],m[3]].map(x=>x.split(',').map(Number));ok(f[2]<-.08&&n[2]<0&&Math.hypot(...n)<=.15&&r[2]>0&&Math.hypot(...r)<=.08,'④ follow 는 뒤로, nock 은 활 주먹에서 시위 쪽 가까이, recoil 은 앞으로 작게');}
 ok(/skillW/.test(d)&&/function bend\(/.test(d)&&/function unbend\(/.test(d)&&/unbend\(s\);if\(!s\?\.applied\)return;/.test(d),'④ 스킬 가중치·시위 휨·그린 뒤 시위 되돌림');
 ok(/anchor:\(\)=>/.test(d),'④ anchor() 공개(화살 출발점)');
 const win2={};const sb2={window:win2,localStorage:{getItem:()=>null,setItem(){}},setInterval(){},Number,Math,Object,String,Array,JSON,RegExp,console};vm.createContext(sb2);vm.runInContext(d,sb2);const P=win2.__STORYWORLD_HUNTER_DRAW_R1336__.pose();
 ok(JSON.stringify(P)===JSON.stringify({bow:[-.05,.02,.58],bowDir:[-.08,1,.02],stringSide:[0,0,-1],draw:[-.07,-.11,.03],poleL:[.45,-.55,-.15],poleR:[-.7,.55,-.6],twist:-34,head:28}),'④ R1336 다 당긴 자세 표(POSE) 그대로');}
console.log(fail?`\nR1364 CPU 실패 ${fail}`:'\nR1364 CPU 통과');process.exit(fail?1:0);
