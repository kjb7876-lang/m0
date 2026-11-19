// R1232 미카엘라 기본탄 출발 높이·크기 CPU 검사 (사용자 2026-11-19 11:30Z "미카엘라의 기본공격탄환이 너무 머리쪽에서나가 적당히 중간살짝위에서 나오게해줘 그리고 탄환크기 조금 줄여줘")
//  node r96/qa/r1232/r1232-cpu-check.cjs   — 실제 화면 측정은 r1232-browser.mjs(헤드리스)
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS',m);};
const rd=f=>fs.readFileSync(path.join(R,f),'utf8');
for(const f of ['michaela-shot-r1232.js','projectile-size-r911.js','projectile-sheets-r912.js'])ok(rd('client-source/'+f)===rd('runtime-text/'+f),f+' runtime-text 사본과 같음');
ok(/node r96\/qa\/r1232\/r1232-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
ok(/<script src="\.\/hunter-aim-r1102\.js"><\/script>\n<script src="\.\/michaela-shot-r1232\.js"><\/script>/.test(rd('runtime-text/index.html')),'index.html 태그(헌터 R1102 바로 뒤)');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'michaela-shot-r1232.js'"),'공개 확인 목록');
const src=rd('client-source/michaela-shot-r1232.js');
const T=64,Z=.8,H=53.68,LIFT=18*Z;const project=(x,y)=>({x:(x-y)*T*Z,y:(x+y)*T*.5*Z});
// 엔진 muzzle 이 지팡이 끝으로 옮긴 탄: 발 기준 화면 (+34.7, -41.2) — 헤드리스 실측(오른쪽 사격, H 53.68, zoom .8133)
function g(rx,ry,o){const a=rx/(T*Z),b=ry/(T*Z*.5);return{x:o.x+(a+b)/2,y:o.y+(b-a)/2};}
function load(pref,{hero='michaela',blockedAt=null,muzzle=[34.7,-41.2],samong=0}={}){const win={};const foot={x:10,y:10};
 const sb={window:win,localStorage:{getItem:k=>k==='storyworld.r1232.michaelaShot'&&pref?JSON.stringify(pref):null,setItem(){}},Math,Number,JSON,Object,Array,Set,Map,WeakMap,String,isFinite,console,setTimeout:()=>0,
  document:{readyState:'complete'},addEventListener(){},player:{hero,x:foot.x,y:foot.y,combo:0,samong},time:0,TILE:T,zoom:Z,project,actorHeight:()=>H,blocked:(x,y)=>blockedAt?blockedAt(x,y):false,
  HEROES:{michaela:{range:7}},nearestEnemy:()=>sb.enemy,enemy:null,shots:[]};
 sb.makeShot=function(x,y,a,sp,dmg,opt){const m=g(muzzle[0],muzzle[1],{x,y});const tg=sb.enemy||{x:x+5,y};const ang=Math.atan2(tg.y-m.y,tg.x-m.x);const s={x:m.x,y:m.y,px:m.x,py:m.y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,life:.6,friendly:true,owner:'hero',asset:'assets/vfx/heroes/'+(opt?.asset||'michaela-a.webp'),radius:.14,r160Basic:opt?.basic!==false,attackKind9:opt?.kind};sb.shots.push(s);return s;};
 sb.basicAttack=function(o){sb.player.combo++;return sb.makeShot(sb.player.x,sb.player.y,0,12,1,o||{});};
 vm.createContext(sb);vm.runInContext(src,sb);return{A:win.__STORYWORLD_MICHAELA_SHOT_R1232__,sb,foot};}
const RATIO=.58;
const drawH=(sb,s,foot)=>{const q=project(foot.x,foot.y),o=project(s.x,s.y);return{x:o.x-q.x,y:-(o.y-LIFT-q.y)};};/* 엔진·R912 는 탄 자리 18px×zoom 위에 그린다 */
for(const [name,mz,en] of [['오른쪽',[34.7,-41.2],{x:13,y:7}],['왼쪽',[-35.5,-42.7],{x:7,y:13}],['위',[.6,-76.5],{x:7,y:7}],['아래',[.3,-6.9],{x:13,y:13}],['오른쪽 아래',[30.2,-15.1],{x:14,y:10}]]){
 const {A,sb,foot}=load(null,{muzzle:mz});sb.enemy=en;const s=sb.basicAttack(),d=drawH(sb,s,foot);
 ok(Math.abs(d.y-RATIO*H)<.5,`${name}: 그려지는 탄 중심 높이 = 영웅 키 ${RATIO}배(중간 살짝 위)`,{d,want:RATIO*H});
 ok(Math.abs(d.x-mz[0])<.5,`${name}: 가로 자리(지팡이 쪽)는 그대로`,{d,mz});
 const a=Math.atan2(en.y-s.y,en.x-s.x),b=Math.atan2(s.vy,s.vx);ok(Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)))<1e-6,`${name}: 같은 표적을 겨눔`);
 ok(Math.abs(Math.hypot(s.vx,s.vy)-12)<1e-9,`${name}: 탄속 그대로`);
 ok(s.r1232Michaela===true,`${name}: 표시(R911 최소 크기 예외)`);}
// 수명은 표적까지 거리 변화만큼 보정(사거리 유지)
{const {sb,foot}=load(null);sb.enemy={x:13,y:7};const s0=g(34.7,-41.2,foot),s=sb.basicAttack(),d0=Math.hypot(13-s0.x,7-s0.y),d1=Math.hypot(13-s.x,7-s.y);ok(Math.abs(s.life-(.6+(d1-d0)/12))<1e-9,'수명 = 원래 + 늘어난 거리/탄속',{life:s.life});}
// 경계·회귀
{const {sb,foot}=load(null);sb.enemy={x:13,y:7};const s=sb.basicAttack({kind:'basic'}),d=drawH(sb,s,foot);ok(s.r1232Michaela===true&&Math.abs(d.y-RATIO*H)<.5,'게임 실제 표시(attackKind9:\'basic\') 기본탄도 옮김(헤드리스에서 찾은 회귀)',{d});}
{const {sb}=load(null,{hero:'hunter'});sb.enemy={x:13,y:7};const s=sb.basicAttack({asset:'hunter-a.webp'}),m=g(34.7,-41.2,{x:10,y:10});ok(Math.abs(s.x-m.x)<1e-12&&!s.r1232Michaela,'다른 영웅 탄은 그대로');}
{const {sb}=load(null);sb.enemy={x:13,y:7};const s=sb.basicAttack({basic:false,kind:'skill'}),m=g(34.7,-41.2,{x:10,y:10});ok(Math.abs(s.x-m.x)<1e-12&&!s.r1232Michaela,'스킬 탄(기본공격 아님)은 그대로');}
{const {sb}=load(null);sb.enemy={x:13,y:7};const s=sb.basicAttack({asset:'michaela-heart.webp'});ok(!s.r1232Michaela,'다른 그림 탄(하트 세례 등)은 그대로');}
{const {sb}=load(null,{blockedAt:()=>true});sb.enemy={x:13,y:7};const s=sb.basicAttack(),m=g(34.7,-41.2,{x:10,y:10});ok(Math.abs(s.x-m.x)<1e-12&&!s.r1232Michaela,'옮길 자리가 벽 안이면 엔진 출발점 유지');}
{const {sb}=load({on:false});sb.enemy={x:13,y:7};const s=sb.basicAttack(),m=g(34.7,-41.2,{x:10,y:10});ok(Math.abs(s.x-m.x)<1e-12&&!s.r1232Michaela,'끄면(storyworld.r1232.michaelaShot on:false) 예전 그대로');}
{const {sb}=load(null,{samong:1});sb.enemy={x:13,y:7};const s=sb.basicAttack();ok(!s.r1232Michaela,'사몽 변신 중에는 그대로');}
{const {sb,foot}=load(null);sb.enemy=null;const s=sb.basicAttack(),d=drawH(sb,s,foot);ok(Math.abs(d.y-RATIO*H)<.5&&[s.x,s.y,s.vx,s.vy,s.life].every(Number.isFinite),'표적이 없어도 높이만 낮추고 값이 모두 유한',{d});}
{const {sb}=load(null);sb.enemy={x:13,y:7};const s=sb.makeShot(10,10,0,12,1,{});ok(!s.r1232Michaela,'기본공격 밖에서 만든 탄은 그대로');}
// 크기: R912 pj03(하트)·pj03x(십자가) .60 → .46, R911 최소 크기(영웅 키 절반)로 다시 키우지 않음
const sh=rd('client-source/projectile-sheets-r912.js');
ok(/pj03:\{src:\[HV\+'michaela-a\.webp'\],size:\.46,/.test(sh)&&/pj03x:\{src:\[HV\+'michaela-a\.webp'\],size:\.46,/.test(sh),'미카엘라 기본탄 몸통 .60 → .46(약 23% 작게)');
ok(/\|\|p\.r1232Michaela\)return base\.apply/.test(rd('client-source/projectile-size-r911.js')),'R911 최소 크기가 미카엘라 기본탄은 건너뜀');
ok(/size:\.46,hit:1\.10/.test(sh),'적중 칸 크기(hit 1.10)는 그대로');
console.log(JSON.stringify({passed:n}));
