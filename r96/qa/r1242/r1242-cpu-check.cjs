// R1242 윤서하 기본탄을 구슬에서 CPU 검사 (사용자 2026-11-19 12:13Z "윤서하 투사체 구슬이아니라 머리쪽에서 나가는 버그 수정")
//  헤드리스 실측(qa/r1242/origin-probe.mjs): 그려지는 탄 중심이 발 위 영웅 키 1.10배(옆)·1.44배(위) = 머리 위.
//  node r96/qa/r1242/r1242-cpu-check.cjs   — 실제 화면 측정은 r1242-browser.mjs(헤드리스)
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS',m);};
const rd=f=>fs.readFileSync(path.join(R,f),'utf8');
ok(rd('client-source/seoha-orb-r1242.js')===rd('runtime-text/seoha-orb-r1242.js'),'runtime-text 사본과 같음');
ok(/node r96\/qa\/r1242\/r1242-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
ok(/<script src="\.\/hunter-aim-r1102\.js"><\/script>\n(?:<script src="\.\/michaela-[a-z]+-r12\d\d\.js"><\/script>\n)*<script src="\.\/seoha-orb-r1242\.js"><\/script>/.test(rd('runtime-text/index.html')),'index.html 태그(헌터 R1102 뒤)');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'seoha-orb-r1242.js'"),'공개 확인 목록');
const src=rd('client-source/seoha-orb-r1242.js');
const T=64,Z=.8,H=53.68,SR=.98,LIFT=18*Z;const project=(x,y)=>({x:(x-y)*T*Z,y:(x+y)*T*.5*Z});
function g(rx,ry,o){const a=rx/(T*Z),b=ry/(T*Z*.5);return{x:o.x+(a+b)/2,y:o.y+(b-a)/2};}
// R143 공격 시트(192×256 칸)에서 잰 구슬 중심(타격 칸)·발 기준점·몸 키
const ORB={e:[117,110,226],se:[124,109,225],s:[129,108,226],ne:[117,108,224],n:[63,108,225]},BODY=179;
function load(pref,{hero='seoha',blockedAt=null,muzzle=[24.5,-44.5],lift=0}={}){const win={};const foot={x:10,y:10};
 const sb={window:win,localStorage:{getItem:k=>k==='storyworld.r1242.seohaOrb'&&pref?JSON.stringify(pref):null,setItem(){}},Math,Number,JSON,Object,Array,Set,Map,WeakMap,String,isFinite,console,setTimeout:()=>0,
  document:{readyState:'complete'},addEventListener(){},player:{hero,x:foot.x,y:foot.y,combo:0,samong:0,visualLiftPx:lift,direction:'right'},time:0,TILE:T,zoom:Z,project,actorHeight:()=>H,blocked:(x,y)=>blockedAt?blockedAt(x,y):false,
  HEROES:{seoha:{range:7}},nearestEnemy:()=>sb.enemy,enemy:null,shots:[]};
 win.__STORYWORLD_VISUAL_R119__={inspect:()=>({stats:{standRatio:SR}})};
 sb.makeShot=function(x,y,a,sp,dmg,opt){const m=g(muzzle[0],muzzle[1],{x,y});const tg=sb.enemy||{x:x+5,y};const ang=Math.atan2(tg.y-m.y,tg.x-m.x);const s={x:m.x,y:m.y,px:m.x,py:m.y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,life:.6,friendly:true,owner:'hero',asset:'assets/vfx/heroes/'+(opt?.asset||'seoha-a.webp'),radius:.14,r160Basic:opt?.basic!==false,attackKind9:opt?.kind===undefined?'basic':opt.kind};sb.shots.push(s);return s;};
 sb.basicAttack=function(o){sb.player.combo++;return sb.makeShot(sb.player.x,sb.player.y,0,12,1,o||{});};
 vm.createContext(sb);vm.runInContext(src,sb);return{A:win.__STORYWORLD_SEOHA_ORB_R1242__,sb,foot};}
const k=H*SR/BODY;
const drawAt=(s,foot)=>{const q=project(foot.x,foot.y),o=project(s.x,s.y);return{x:o.x-q.x,y:o.y-LIFT-q.y};};/* 엔진·R912 는 탄 자리 18px×zoom 위에 그린다 */
// 표적 방향(화면 각) → R143 칸(DIR8, w·sw·nw 는 e·se·ne 반전)
for(const [name,en,sheet,mir] of [['오른쪽',{x:13,y:7},'e',0],['왼쪽',{x:7,y:13},'e',1],['아래',{x:13,y:13},'s',0],['위',{x:7,y:7},'n',0],['오른쪽 아래',{x:14,y:11},'se',0],['왼쪽 위',{x:7,y:9},'nw',1]]){
 const {A,sb,foot}=load(null);sb.enemy=en;const s=sb.basicAttack(),d=drawAt(s,foot);const sh=sheet==='nw'?'ne':sheet,o=ORB[sh],f=mir?-1:1,want={x:(o[0]-96)*k*f,y:(o[1]-o[2])*k};
 ok(Math.abs(d.x-want.x)<.6&&Math.abs(d.y-want.y)<.6,`${name}: 그려지는 탄 중심 = 그 방향 공격 칸의 구슬(${sh}${mir?' 반전':''})`,{d,want});
 ok(-d.y/H>.55&&-d.y/H<.72,`${name}: 높이 영웅 키 0.55~0.72배(머리 아님)`,{h:-d.y/H});
 const a=Math.atan2(en.y-s.y,en.x-s.x),b=Math.atan2(s.vy,s.vx);ok(Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)))<1e-6,`${name}: 같은 표적을 겨눔`);
 ok(Math.abs(Math.hypot(s.vx,s.vy)-12)<1e-9&&s.r1242Orb===true,`${name}: 탄속 그대로·표시`);}
{const {sb,foot}=load(null,{lift:10});sb.enemy={x:13,y:7};const s=sb.basicAttack(),d=drawAt(s,foot),o=ORB.e;ok(Math.abs(d.y-((o[1]-o[2])*k-10))<.6,'영웅이 들려 그려지면(visualLiftPx) 구슬도 같이 들림',{d});}
{const {sb,foot}=load(null);sb.enemy={x:13,y:7};const s0=g(24.5,-44.5,foot),s=sb.basicAttack(),d0=Math.hypot(13-s0.x,7-s0.y),d1=Math.hypot(13-s.x,7-s.y);ok(Math.abs(s.life-(.6+(d1-d0)/12))<1e-9,'수명 = 원래 + 늘어난 거리/탄속(사거리 유지)');}
// 경계·회귀
{const {sb}=load(null,{hero:'michaela'});sb.enemy={x:13,y:7};const s=sb.basicAttack({asset:'michaela-a.webp'});ok(!s.r1242Orb,'다른 영웅 탄은 그대로');}
{const {sb}=load(null);sb.enemy={x:13,y:7};const s=sb.basicAttack({basic:false,kind:'skill'});ok(!s.r1242Orb,'스킬 탄은 그대로');}
{const {sb}=load(null);sb.enemy={x:13,y:7};const s=sb.basicAttack({asset:'seoha-q.webp'});ok(!s.r1242Orb,'다른 그림 탄(Q 얼음창 등)은 그대로');}
{const {sb}=load(null,{blockedAt:()=>true});sb.enemy={x:13,y:7};const s=sb.basicAttack(),m=g(24.5,-44.5,{x:10,y:10});ok(Math.abs(s.x-m.x)<1e-12&&!s.r1242Orb,'옮길 자리가 벽 안이면 엔진 출발점 유지');}
{const {sb}=load({on:false});sb.enemy={x:13,y:7};const s=sb.basicAttack();ok(!s.r1242Orb,'끄면(storyworld.r1242.seohaOrb on:false) 예전 그대로');}
{const {sb}=load(null);sb.player.samong=1;sb.enemy={x:13,y:7};const s=sb.basicAttack();ok(!s.r1242Orb,'사몽 변신 중에는 그대로');}
{const {sb,foot}=load(null);sb.enemy=null;const s=sb.basicAttack(),d=drawAt(s,foot);ok(s.r1242Orb&&[s.x,s.y,s.vx,s.vy,s.life].every(Number.isFinite)&&-d.y/H>.55&&-d.y/H<.72,'표적이 없으면 보는 방향 칸으로, 값 모두 유한',{d});}
{const {sb}=load(null);sb.enemy={x:13,y:7};const s=sb.makeShot(10,10,0,12,1,{});ok(!s.r1242Orb,'기본공격 밖에서 만든 탄은 그대로');}
console.log(JSON.stringify({passed:n}));
