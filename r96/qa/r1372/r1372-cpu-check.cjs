// R1372 기계화 복종 봉인구(R1317 ORB 3D)만 기본 3D, 나머지 R1317 8종은 기본 2D(사용자 2026-11-27 "봉인구만켜") — 정적·실행 검사.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const F='mob-3d-r1317.js',src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
let rt='';try{rt=fs.readFileSync(path.join(R,'runtime-text',F),'utf8');}catch(_){}
ok(rt===src,'runtime-text 사본이 원본과 같음');
// 오버레이를 가짜 창에서 실행해 종류별 켜짐을 묻는다.
function load({webdriver=true,stored=null,search='',zonePick=null}={}){
 const store=new Map(stored?[['storyworld.r1317.mob3d',stored]]:[]);
 const win={};const ctx={window:win,navigator:{webdriver},location:{search},performance:{now:()=>0},
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},
  requestAnimationFrame:()=>0,console};
 ctx.window=win;Object.assign(win,ctx);win.window=win;
 if(zonePick)win.__STORYWORLD_MOB3D_ZONE_R1326__={pick:zonePick};
 vm.createContext(ctx);vm.runInContext(src,ctx,{filename:F});return win.__STORYWORLD_MOB3D_R1317__;}
const OTHERS=['rose','delicacy','twinned','crystal','guard','herbwife','signal','warhound'];
for(const [label,opt] of [['자동 검사(webdriver)',{webdriver:true}],['사람(저장값 없음)',{webdriver:false}],['사람(9종 설정 꺼 둠)',{webdriver:false,stored:'off'}]]){
 const api=load(opt);
 ok(typeof api?.kindOn==='function','['+label+'] kindOn 있음');
 if(typeof api?.kindOn!=='function')continue;
 ok(api.kindOn('orb')===true,'['+label+'] 기계화 복종 봉인구(orb) 기본 3D');
 ok(OTHERS.every(k=>api.kindOn(k)===false),'['+label+'] 나머지 8종은 기본 2D');}
{const api=load({webdriver:false,stored:'on'});ok(api?.kindOn&&['orb',...OTHERS].every(k=>api.kindOn(k)),'9종 설정을 켜면 9종 모두 3D');}
{const api=load({webdriver:true,search:'?mob3d17=1'});ok(api?.kindOn&&['orb',...OTHERS].every(k=>api.kindOn(k)),'?mob3d17=1 이면 9종 모두 3D');}
{const api=load({webdriver:true,zonePick:()=>false});ok(api?.kindOn&&api.kindOn('orb')===false,'불면귀 마을(R1326 2D 강제)에서는 봉인구도 2D');}
{const api=load({webdriver:true,search:'?orb3d=0'});ok(api?.kindOn&&api.kindOn('orb')===false,'?orb3d=0 이면 봉인구도 2D(비교용)');}
ok(/'기계화 복종 봉인구'/.test(src)&&/R1372/.test(src),'봉인구 표·R1372 설명');
console.log(fail?'R1372 cpu-check FAIL '+fail:'R1372 cpu-check PASS');process.exit(fail?1:0);
