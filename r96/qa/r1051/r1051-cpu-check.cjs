// R1051 영웅 날개 없애고 머리 위 천사링(후광)만 — 사용자 2026-11-15 "영웅들 날개 달리는거 … 없애고 그냥 위에 천사링만 달리게해", "천사링은 이미 구현되어잇음".
//  ① R106 그림 라이브러리: wing* 그림(wing·wingback·wingfront·wingside·접힌 -f)은 받아져 있어도 그리지 않는다(그린 척 true → 호출 쪽 도형 대체도 안 탄다).
//     후광·깃털·빛은 그대로. 그림이 아직 없을 때의 false(R106 약속)·NaN 건너뛰기는 그대로.
//  ② R101 오라: 어느 영웅·단계·EGO·사몽·스킬 자세에서도 날개(뒤·앞)를 부르지 않고, 후광은 전과 같은 조건으로 부른다.
//  ③ R102 성광 적중(wingFlash): 날개 한 쌍·도형 날개를 그리지 않는다(깃털은 남김).
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let n=0,failed=0;const ok=(name,pass,detail)=>{n++;if(!pass)failed++;console.log((pass?'PASS ':'FAIL ')+name+(pass||detail===undefined?'':' :: '+JSON.stringify(detail)));};
const FILES=['fx-sprites-r106.js','polish-r101.js','hero-fx-r102.js'];
ok('runtime copies match',FILES.every(f=>RT(f)===C(f)));
for(const f of FILES)try{new vm.Script(C(f));ok('syntax '+f,true);}catch(e){ok('syntax '+f,false,String(e));}
const flag=src=>{const m=/const HERO_WINGS=(true|false)\b/.exec(src);return m?m[1]==='true':true;};// 상수가 없으면 옛 동작(날개 켬)

// ---- ① fx-sprites-r106 ---------------------------------------------------------------------------
{const lib=C('fx-sprites-r106.js');
 const mk=have=>{const calls=[];const ctx2d={save(){},restore(){},translate(){},scale(){},rotate(){},drawImage(...a){calls.push(a);},set globalAlpha(v){},get globalAlpha(){return 1;},globalCompositeOperation:'source-over'};
  const img={naturalWidth:4,naturalHeight:4,width:4,height:4};const doc={createElement(){const px=new Uint8ClampedArray(64).fill(128);return{width:0,height:0,getContext(){return{drawImage(){},getImageData(){return{data:px};},putImageData(){}};}};}};
  const w={};const sb=vm.createContext({window:w,document:doc,localStorage:{getItem(){return null;},setItem(){}},ctx:ctx2d,time:0,settings:{},readyImage:p=>have(p)?{image:img}:null,imageCache:new Map(),addImage(){},Math,Number,Object,Map,Set,Uint8ClampedArray,String,Array});
  vm.runInContext(lib,sb);const S0=w.__STORYWORLD_FX_SPRITES_R106__;/* 색 입힌 사본은 게임 시간 한 순간에 3장까지만 만든다 → 호출마다 시간을 흘려 그 제한이 결과에 섞이지 않게 */const step=f=>(...a)=>{sb.time+=1;return f(...a);};
  return {S:{...S0,draw:step(S0.draw),along:step(S0.along)},calls};};
 const F={a:[255,0,0],b:[0,0,255]},WINGS=['wing','wingback','wingfront','wingside','wingback-f','wingfront-f','wingside-f'];
 const A=mk(()=>true);
 ok('wing names are all in the texture table (the test covers real names)',WINGS.every(k=>A.S.meta[k]),WINGS.filter(k=>!A.S.meta[k]));
 const res=WINGS.map(k=>[k,A.S.draw(k,F,10,10,40,40,{blend:'source-over'}),A.S.draw(k,F,10,10,40,40,{}),A.S.draw(k,F,10,10,40,40,{overHero:true,flip:true,angle:.3})]);
 ok('every wing sprite is skipped (no drawImage) in every blend, even when its texture is ready',A.calls.length===0,{draws:A.calls.length});
 ok('a skipped wing reports "handled" (true) so callers do not fall back to code-drawn wings',res.every(r=>r[1]===true&&r[2]===true&&r[3]===true),res.filter(r=>!(r[1]===true&&r[2]===true&&r[3]===true)));
 ok('wing strips laid along a line are skipped too',A.S.along('wingside',F,0,0,50,0,10,{})===true&&A.calls.length===0);
 const keep=['halo','feather','glow','cross','pillar','flare','ring'].filter(k=>A.S.meta[k]);const before=A.calls.length;const kr=keep.map(k=>A.S.draw(k,F,10,10,40,40,{overHero:true}));
 ok('halo, feather, glow, cross, pillar still draw',keep.length>=5&&kr.every(v=>v===true)&&A.calls.length-before===keep.length,{keep,kr,draws:A.calls.length-before});
 ok('halo keeps its own texture path',A.calls.some(c=>/^r106fx:halo:/.test(c[0].__storyworldStaticTint?.path||'')));
 const B=mk(p=>p.endsWith('glow.webp'));
 ok('regression(R106): a texture that is not loaded still answers false',B.S.draw('wing',F,0,0,10,10)===false&&B.S.draw('halo',F,0,0,10,10)===false);
 ok('regression: NaN / Infinity / zero size are skipped without drawing',A.S.draw('halo',F,NaN,0,10,10)===true&&A.S.draw('halo',F,0,Infinity,10,10)===true&&A.S.draw('wing',F,NaN,NaN,NaN,NaN)===true&&A.S.draw('halo',F,0,0,0,0)===true&&A.calls.length-before===keep.length);
 ok('the switch is readable from outside',A.S.heroWings===false,A.S.heroWings);}

// ---- ② polish-r101 auraBack / auraFront ---------------------------------------------------------
{const P=C('polish-r101.js'),a=P.indexOf('function auraBack(p){'),b=P.indexOf('const heroBase=drawHero');
 ok('auraBack/auraFront found',a>0&&b>a);
 // Include the native actor-orb boundary called by the detached aura routines.
 const orbStart=P.indexOf("const orbPaintActor="), orbEnd=P.indexOf('function blades(',orbStart);
 if(orbStart<0||orbEnd<=orbStart||orbEnd>=a)throw Error('R101 actor-orb scope not found');
 const body=P.slice(orbStart,orbEnd)+P.slice(a,b);
 const run=(p,{form,tier,pose})=>{const log=[];const rec=k=>(...x)=>{log.push(k);return k==='wingsView'?true:undefined;};
  const names=['heroOf','tierOf','heat','formLevel','project','actorHeight','clamp','finite','hash','scope','ctx','stats','time','SPR','BLADE_ORBIT','skillPose','HERO_WINGS',
   'groundGlow','field','runeRing','flames','wings','wingsView','halo','blades','orbs','petals'];
  const FORM7=[null,null,{alpha:.4,cut:3},{alpha:.55,cut:2},{alpha:.7,cut:2},{alpha:.8,cut:1},{alpha:.9,cut:1},{alpha:1,cut:0}];
  const skillPose=()=>pose?{kind:pose,open:true,scale:1,flap:0,tilt:0}:null;
  const env={heroOf:()=>({a:[1,2,3],b:[4,5,6],form}),tierOf:()=>tier,heat:()=>.6,formLevel:(q,t)=>{if(q.ego>0||q.samong>0||skillPose())return{on:true,alpha:1,cut:0};const f=FORM7[t];return f?{on:true,...f}:{on:false,alpha:0,cut:9};},
   project:(x,y)=>({x:100+x,y:100+y}),actorHeight:()=>60,clamp:(v,lo,hi)=>Math.max(lo,Math.min(hi,v)),finite:v=>Number.isFinite(+v)?+v:0,hash:()=>7,scope:(o,fn)=>fn(),ctx:{save(){},restore(){},globalAlpha:1},stats:{auraDraws:0},time:3,
   SPR:()=>({draw:()=>{log.push('S.draw');return true;}}),BLADE_ORBIT:false,skillPose,HERO_WINGS:flag(P),
   groundGlow:rec('groundGlow'),field:rec('field'),runeRing:rec('runeRing'),flames:rec('flames'),wings:rec('wings'),wingsView:rec('wingsView'),halo:rec('halo'),blades:rec('blades'),orbs:rec('orbs'),petals:rec('petals')};
  const f=new Function(...names,body+';return {auraBack,auraFront};')(...names.map(k=>env[k]));f.auraBack(p);f.auraFront(p);return log;};
 const H=(o={})=>({x:1,y:2,hero:'michaela',ego:0,samong:0,skillAnim:0,visualLiftPx:0,...o});
 const cases=[
  ['미카엘라 5단계(날개가 처음 나오던 경계)',H(),{form:'angel',tier:5},true],
  ['미카엘라 7단계',H(),{form:'angel',tier:7},true],
  ['미카엘라 4단계(경계 바로 아래)',H(),{form:'angel',tier:4},true],
  ['미카엘라 2단계(후광이 처음 보이는 단계)',H(),{form:'angel',tier:2},true],
  ['미카엘라 1단계(오라 형태 없음)',H(),{form:'angel',tier:1},false],
  ['미카엘라 EGO, 1단계',H({ego:5}),{form:'angel',tier:1},true],
  ['미카엘라 스킬 자세 Q, 0단계',H({skillAnim:.3}),{form:'angel',tier:0,pose:'q'},true],
  ['미카엘라 세라핌(R) 자세',H({skillAnim:.3}),{form:'angel',tier:7,pose:'r'},true],
  ['환도 사몽 각성(모든 영웅에 날개가 달리던 길)',H({hero:'hwando',samong:9}),{form:'blade',tier:3},true],
  ['슬레이어 사몽 각성',H({hero:'slayer',samong:9}),{form:'dark',tier:7},true],
  ['네온 EGO(천사 형태 아님) — 후광도 원래 없음',H({hero:'neon',ego:5}),{form:'arcs',tier:7},false],
  ['헌터 7단계 — 후광도 원래 없음',H({hero:'hunter'}),{form:'petals',tier:7},false]];
 const bad=[],haloBad=[];
 for(const [name,p,o,wantHalo] of cases){const log=run(p,o);if(log.includes('wings')||log.includes('wingsView'))bad.push(name);const nh=log.filter(k=>k==='halo').length;if(nh!==(wantHalo?1:0))haloBad.push([name,nh]);}
 ok('no hero, tier, EGO, 사몽 or skill pose calls the wings (back or front)',!bad.length,bad);
 ok('the halo is called exactly as before: angel form or 사몽, once, only when the aura form is shown',!haloBad.length,haloBad);
 const other=run(H({hero:'hunter'}),{form:'petals',tier:7});ok('regression: other aura parts untouched (ground glow, field, petals, orbs)',['groundGlow','field','petals','orbs'].every(k=>other.includes(k)),other);
 ok('regression: 사몽 flames still drawn',run(H({hero:'hwando',samong:9}),{form:'blade',tier:3}).includes('flames'));
 ok('R269 pose wiring text is still in place (its check reads it)',/t>=5\|\|awake\|\|skillPose\(p\)/.test(P)&&/const pose=skillPose\(p\)/.test(P));
 ok('wing functions keep their texture-first/fallback pair (R106 check reads it)',P.includes('function wings0(')&&/function wings\(/.test(P)&&P.includes('function halo0(')&&/function halo\(/.test(P));}

// ---- ③ hero-fx-r102 wingFlash --------------------------------------------------------------------
{const X=C('hero-fx-r102.js'),a=X.indexOf('function wingFlash('),b=X.indexOf('function runeCircle(');ok('wingFlash found',a>0&&b>a);
 const body=X.slice(a,b);
 const run=(sprites,texture)=>{const log=[];const s=sprites?{draw:(name)=>{log.push(name);return texture;}}:null;
  const names=['SPR','clamp','smooth','rnd','time','wingFlash0','HERO_WINGS'];
  const env={SPR:()=>s,clamp:(v,lo,hi)=>Math.max(lo,Math.min(hi,v)),smooth:v=>Math.max(0,Math.min(1,v)),rnd:()=>.5,time:1,wingFlash0:()=>log.push('wingFlash0'),HERO_WINGS:flag(X)};
  new Function(...names,body+';return wingFlash;')(...names.map(k=>env[k]))(100,100,60,{a:[1,1,1],b:[2,2,2]},.4,1);return log;};
 const l1=run(true,true),l2=run(true,false),l3=run(false,false);
 ok('holy hit flash draws no wing pair when textures are ready',!l1.includes('wing')&&!l1.includes('wingFlash0'),l1);
 ok('holy hit flash keeps its feathers',l1.filter(k=>k==='feather').length===4,l1);
 ok('no code-drawn wing fallback when the texture is missing',!l2.includes('wingFlash0')&&!l2.includes('wing'),l2);
 ok('no code-drawn wing fallback when sprites are off',!l3.includes('wingFlash0'),l3);
 ok('wingFlash keeps its texture-first/fallback pair (R106 check reads it)',X.includes('function wingFlash0(')&&/function wingFlash\(/.test(X));}

// ---- ④ 연결 -------------------------------------------------------------------------------------
{const wf=fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8');ok('CI runs this check',wf.includes('node r96/qa/r1051/r1051-cpu-check.cjs'));}
console.log(`R1051 ${n-failed}/${n}`);if(failed)process.exit(1);
