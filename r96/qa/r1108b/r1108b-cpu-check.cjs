// R1108b 서하 이동 휘청임(사용자 2026-11-16 11:04Z, R1108 병합 뒤에도) — CPU 검사.  node r96/qa/r1108b/r1108b-cpu-check.cjs
//  ① R1108 서하 대각→옆 걷기 대체는 기본 꺼짐(걸음 없는 시트라 종이처럼 흔들림)
//  ② 이동 방향 기울임: 발끝 기준 최대 3.5°, 속도 비례, 부드럽게, 서면 0°, 서하 걷기 그림만, 발끝·크기 그대로.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS',m);};
const F='hero-sway-r1108b.js',src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
ok(src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8'),'runtime-text 사본과 같음');
ok(fs.readFileSync(path.join(R,'client-source','hero-consist-r1108.js'),'utf8')===fs.readFileSync(path.join(R,'runtime-text','hero-consist-r1108.js'),'utf8'),'R1108 runtime-text 사본과 같음');
ok(/node r96\/qa\/r1108b\/r1108b-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"),'공개 검증 목록');
{const h=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');ok(h.split('"./'+F+'"').length===2&&h.includes('<script src="./hero-consist-r1108.js"></script>\n<script src="./'+F+'"></script>'),'스크립트 태그 한 번, hero-consist-r1108 바로 뒤');}
for(const k of ['runtime-inputs.json','runtime-manifest.json'])ok(fs.readFileSync(path.join(R,k),'utf8').includes(F),k+' 에 등록');
const near=(a,b,e=1e-9)=>Math.abs(a-b)<e,deg=r=>r*180/Math.PI;
ok(/let prefs=\{on:true,attack:true,seoha:false\}/.test(fs.readFileSync(path.join(R,'client-source','hero-consist-r1108.js'),'utf8')),'R1108 서하 옆 걷기 대체 기본 꺼짐');
function load(pref,pl){const win={};const sb={window:win,localStorage:{getItem:()=>pref?JSON.stringify(pref):null,setItem(){}},Math,Number,JSON,Object,Array,Set,Map,String,isFinite,console,
  player:pl||{hero:'seoha',moving:true,moveVX150:1,moveVY150:0,x:0,y:0},ctx:{commands:[]},project:(x,y)=>({x:400+x,y:306+y}),time:0,drawHero(){}};
 win.addEventListener=(e,f)=>{if(e==='load')win.__load=f;};vm.createContext(sb);vm.runInContext(src,sb);win.__load&&win.__load();return {api:win.__STORYWORLD_HERO_SWAY_R1108B__,sb,win};}
// 목표 기울기
{const {api}=load(null);const T=api.test.target,M=api.max;ok(near(deg(M),3.5),'최대 3.5°');
 ok(T({moving:false,moveVX150:1,moveVY150:0})===0,'서 있으면 0°');
 const e=T({moving:true,moveVX150:1,moveVY150:0}),w=T({moving:true,moveVX150:-1,moveVY150:0});ok(e>0&&w<0&&near(e,-w),'오른쪽 +, 왼쪽 −, 대칭',{e:deg(e),w:deg(w)});
 const se=T({moving:true,moveVX150:1,moveVY150:1}),ne=T({moving:true,moveVX150:1,moveVY150:-1});ok(Math.abs(se)<1e-9,'월드 (1,1)=화면 아래쪽 → 0°',deg(se));ok(ne>0&&near(deg(ne),3.5*Math.min(1,Math.SQRT2)*1,1e-6)||ne>0,'월드 (1,-1)=화면 오른쪽 → 기울임',deg(ne));
 const half=T({moving:true,moveVX150:.5,moveVY150:0});ok(half>0&&half<e,'느리면 덜 기울임');
 ok(T({moving:true,moveVX150:0,moveVY150:0})===0&&T({moving:true,moveVX150:NaN,moveVY150:NaN})===0&&T(null)===0,'속도 0·NaN·null 은 0°');}
// 회전: 발끝 고정, 크기 유지
{const {api}=load(null);const P=[[100,50],[200,50],[200,250],[100,250]],pv=[150,250],a=3.5*Math.PI/180,Q=api.test.rotate(P,pv,a);
 const d=(A,B)=>Math.hypot(A[0]-B[0],A[1]-B[1]);ok(near(d(Q[0],Q[1]),100,1e-9)&&near(d(Q[0],Q[3]),200,1e-9),'변 길이 그대로(크기 안 변함)');
 ok(Q[0][0]>P[0][0]&&Q[1][0]>P[1][0],'위쪽이 오른쪽으로(앞으로 기울임)');
 ok(d(pv,[(Q[2][0]+Q[3][0])/2,(Q[2][1]+Q[3][1])/2])<1e-9,'발끝 가운데 제자리');ok(Q.flat().every(Number.isFinite),'유한');}
// 부드러움
{const {api}=load(null);api.test.reset();let th=api.test.smooth(0,0),steps=[];for(let i=1;i<=30;i++){const nt=api.test.smooth(api.max,i*.016);steps.push(Math.abs(nt-th));th=nt;}
 ok(Math.max(...steps.slice(1))*180/Math.PI<=1.0,'프레임당 기울기 변화 ≤1°(60fps)',Math.max(...steps.slice(1))*180/Math.PI);
 api.test.reset();let x=api.test.smooth(0,0);for(let i=1;i<=6;i++)x=api.test.smooth(api.max,i*.0167);ok(x/api.max>.5&&x/api.max<.8,'0.1초에 약 63%',x/api.max);
 for(let i=0;i<120;i++)th=api.test.smooth(0,1+i*.016);ok(Math.abs(th)<.002,'멈추면 0°로 돌아옴',th);
 api.test.reset();api.test.smooth(api.max,10);ok(api.test.smooth(0,11)===0,'0.5초 넘게 끊기면 바로 목표(초기화)');}
// 감싼 drawHero
function wrapTest(pref,pl,srcPath){const win={},c={kind:'image',owner:{kind:'hero'},sourcePath:srcPath||'assets/r130/seoha/walk-e.webp',image:{},points:[[380,250],[420,250],[420,306],[380,306]]},old={kind:'image',owner:{kind:'hero'},sourcePath:'assets/r130/seoha/walk-e.webp',points:[[0,0],[1,0],[1,1],[0,1]]};
 const sb={window:win,localStorage:{getItem:()=>pref?JSON.stringify(pref):null,setItem(){}},Math,Number,JSON,Object,Array,Set,Map,String,isFinite,console,player:pl||{hero:'seoha',moving:true,moveVX150:1,moveVY150:-1,x:0,y:0},ctx:{commands:[old]},project:(x,y)=>({x:400+x,y:306+y}),time:5};
 sb.drawHero=function(){sb.ctx.commands.push(c);return 'R';};win.addEventListener=(e,f)=>{if(e==='load')win.__load=f;};vm.createContext(sb);vm.runInContext(src,sb);win.__load();
 const before=JSON.stringify(c.points),oldBefore=JSON.stringify(old.points),r=sb.drawHero();return {r,c,moved:JSON.stringify(c.points)!==before,oldMoved:JSON.stringify(old.points)!==oldBefore};}
{const x=wrapTest(null);ok(x.r==='R'&&x.moved&&x.c.r1108bLean>0,'서하 걷기 그림이 기울어짐, 반환값 그대로',x.c.r1108bLean);ok(!x.oldMoved,'감싸기 전에 있던 명령은 손대지 않음');
 const p=x.c.points,foot=[(p[2][0]+p[3][0])/2,(p[2][1]+p[3][1])/2];ok(Math.abs(foot[0]-400)<2&&Math.abs(foot[1]-306)<.2,'발끝은 영웅 발밑 점(400,306) 그대로',foot);}
ok(!wrapTest(null,{hero:'neon',moving:true,moveVX150:1,moveVY150:-1,x:0,y:0}).moved,'서하 아니면 그대로');
ok(!wrapTest({on:false}).moved,'끄면 그대로');
ok(!wrapTest(null,{hero:'seoha',moving:false,moveVX150:1,moveVY150:-1,x:0,y:0}).moved,'서 있으면 그대로(0°)');
ok(!wrapTest(null,undefined,'assets/r143/attack/seoha/attack-e.webp').moved,'공격·서기 그림은 그대로(걷기만)');
ok(!wrapTest(null,{hero:'seoha',moving:true,moveVX150:1,moveVY150:1,x:0,y:0}).moved,'화면 아래로만 가면 그대로');
ok(!wrapTest(null,{hero:'seoha',moving:true,moveVX150:1,moveVY150:-1,x:NaN,y:0}).moved,'NaN 발밑 점이면 손대지 않음');
{const s=JSON.stringify(load(null).api.inspect());ok(/presentationOnly":true/.test(s)&&/gameplayChanged":false/.test(s),'판정·세이브 안 바꿈');}
{const {api}=load(null);api.test.reset();let th=api.test.smooth(0,0);let worst=0;for(let i=1;i<=20;i++){const dt=.05,nt=api.test.smooth(api.max,i*dt);worst=Math.max(worst,Math.abs(nt-th)/dt*180/Math.PI);th=nt;}ok(worst<=30.0001,'긴 프레임(0.05초)에서도 변화 속도 초당 30° 이하',worst);ok(Math.abs(th-api.max)<.2*api.max,'결국 목표에 도달',th/api.max);}
console.log(JSON.stringify({passed:n}));
