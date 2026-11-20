// R1220 기억사수 공격 모션·총구 탄 CPU 검사 (사용자 2026-11-19 "기억사수 공격모션에 버그가 많아 … 총탄도 총구에서 나오게 총탄 총구크기에 맞추고")
//  node r96/qa/r1220/r1220-cpu-check.cjs   — 실제 화면 측정은 r1220-browser.mjs(헤드리스)
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS',m);};
const rd=f=>fs.readFileSync(path.join(R,f),'utf8');
for(const f of ['gunner-aim-r991.js','gunner-arms-r561.js','projectile-size-r911.js','projectile-sheets-r912.js'])ok(rd('client-source/'+f)===rd('runtime-text/'+f),f+' runtime-text 사본과 같음');
ok(/node r96\/qa\/r1220\/r1220-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
const src=rd('client-source/gunner-aim-r991.js');
function load(pref,enemy,t=0,extra={}){const win={};const sb={window:win,localStorage:{getItem:()=>pref?JSON.stringify(pref):null,setItem(){}},Math,Number,JSON,Object,Array,Set,Map,WeakMap,String,isFinite,console,setTimeout:()=>0,document:{readyState:'complete'},addEventListener(){},
 readyImage:q=>({image:{naturalWidth:1152,naturalHeight:256,src:q}}),player:{hero:'gunner',x:0,y:0,combo:0},time:t,TILE:64,zoom:1,HEROES:{gunner:{range:9}},nearestEnemy:()=>enemy||null,project:(x,y)=>({x:(x-y)*64,y:(x+y)*32}),actorHeight:()=>66,blocked:()=>false,ctx:{commands:[]},...extra};
 sb.basicAttack=function(){sb.player.combo++;sb.makeShot(0,0,0,16,1,{});};sb.shots=[];sb.makeShot=function(x,y,a,sp){const s={x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,friendly:true,asset:'assets/vfx/heroes/gunner-laser-bullet.webp',radius:.14};sb.shots.push(s);return s;};sb.drawHero=function(){};
 win.addEventListener=()=>{};win.__STORYWORLD_PROJ_SHEETS_R912__={enabled:true,kinds:{pj04:{size:.12}}};win.__STORYWORLD_VISUAL_R119__={inspect:()=>({stats:{standRatio:1}})};vm.createContext(sb);vm.runInContext(src,sb);return{A:win.__STORYWORLD_GUNNER_AIM_R991__,sb};}
const D=Math.PI/180;
// ① A one-degree nudge across a sheet boundary should keep the preceding shot pose.
{
 const enemy={x:0,y:0},{A,sb}=load(null,enemy);
 const angle=Array.from({length:88},(_,i)=>i+1).find(d=>A.pick((d-1)*D).sheet!==A.pick(d*D).sheet);
 const aim=d=>{const a=d*D;enemy.x=2*Math.sin(a)+Math.cos(a);enemy.y=2*Math.sin(a)-Math.cos(a);};
 aim(angle-1);sb.basicAttack();const first=A.inspect().swing;
 aim(angle);sb.time=.5;sb.basicAttack();const second=A.inspect().swing;
 ok(first.sheet===second.sheet&&A.pick(angle*D).sheet!==second.sheet,'쏠 때 각도 경계 1° 흔들림에 앞 조준을 유지함',{first,second});
}
// ③ R143 attack-s 5·6번(총 내린 칸) → 0번
{const {A}=load(null,{x:2,y:3});ok(/s:\{gun:50,face:90,body:182,aimFrames:4,/.test(src),'attack-s 는 0~3번만 겨눈 칸');}
// ④ 탄 출발점: 꼬리가 총구 끝(18px 들림·몸통 절반 포함), 메아리 탄도
{const {A,sb}=load(null,{x:3,y:-3});/* 화면 오른쪽(e) 표적: x-y=6 → 화면 x+, x+y=0 */sb.basicAttack();const s=sb.shots[0],q=sb.project(s.x,s.y);
 const pk=A.pick(0),k=66/A.inspect().sheets&&66/181,t=A.tip(pk.sheet,0);
 ok(pk.sheet==='e'&&!pk.mirror,'정 오른쪽 → e 칸',pk);
 const mx=(t[0]-96)*66/181,my=(t[1]-227)*66/181,L=66*.12,drawX=q.x,drawY=q.y-18;/* 엔진·R912 는 탄 자리 18px 위에 몸통 가운데를 그림 */
 const T=sb.project(3,-3),ex=T.x-mx,ey=T.y-my,dd=Math.hypot(ex,ey),ux=ex/dd,uy=ey/dd;/* 나는 쪽 = 총구 → 표적 화면 방향 */
 ok(Math.abs(drawX-ux*L/2-mx)<.5&&Math.abs(drawY-uy*L/2-my)<.5,'그려지는 탄 몸통 꼬리 = 총구 끝(오른쪽 사격)',{drawX,drawY,mx,my,L});
 ok(s.r1220Muzzle===true&&s.currentPublicMuzzle?.r991?.sheet==='e','총구 크기 탄 표시(R911 최소 크기 예외)·옮김 기록');
 sb.time=.15;const s2=sb.makeShot(0,0,0,16,1,{});ok(s2.currentPublicMuzzle?.r991?.echo===true&&Math.abs(sb.project(s2.x,s2.y).x-q.x)<.5,'.15초 뒤 기억 메아리 탄(basicAttack 밖)도 같은 총구에서');
 sb.time=.6;const s3=sb.makeShot(0,0,0,16,1,{});ok(!s3.currentPublicMuzzle?.r991,'.35초 지나면 메아리로 보지 않음(다른 탄은 그대로)');}
{const {A,sb}=load({lift:false,tail:false},{x:3,y:-3});sb.basicAttack();const s=sb.shots[0],q=sb.project(s.x,s.y),t=A.tip('e',0);ok(Math.abs(q.x-(t[0]-96)*66/181)<.5,'lift·tail 끄면 예전(총구 = 탄 자리)');}
// ⑤ R911: r1220Muzzle 은 키우지 않음, R912 pj04 크기 .12
ok(/skipZone\(\)\|\|p\.r1220Muzzle\)/.test(rd('client-source/projectile-size-r911.js')),'R911 최소 크기가 총구 크기 탄은 건너뜀');
ok(/pj04:\{src:\[HV\+'gunner-laser-bullet\.webp'\],size:\.12,/.test(rd('client-source/projectile-sheets-r912.js')),'기억사수 기본탄 몸통 = 영웅 키 .12(굵기 ≈ 총구 지름 .039)');
// ⑥ R561 W·E: 총구 오프셋
const a5=rd('client-source/gunner-arms-r561.js');
ok(/f\.o=o;f\.mo=mzOff\(f\.a\);/.test(a5)&&/hit:!!first,mo:mzOff\(a\)\}/.test(a5),'W 저격·E 연사 쏠 때 그려진 총구 자리를 적음');
ok(/const ox=MX\(o,f\.mo\),oy=MY\(o,f\.mo,M\)/.test(a5)&&/const o=r\.mo\?\{x:o0\.x\+r\.mo\.x,y:o0\.y\+r\.mo\.y\+M\}:o0/.test(a5),'W·E 탄 그리기가 총구에서 시작(없으면 예전 높이)');
ok(/TW=f\.mo\?\.09:\.2/.test(a5),'W 탄 굵기 영웅 키 .2 → .09(심 굵기 ≈ 총구)');
console.log(JSON.stringify({passed:n}));
