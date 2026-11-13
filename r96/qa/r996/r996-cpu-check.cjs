// R996 CPU 검사: 일반몹을 모두 잡은 뒤(방에 보스만 남음) 불면귀 보스전에서도 R990 안개 소환이 나오는지.
//  실측(코디네이터 중계, main 162c03a 자연 진행): waves 0·units 0·refused 7 — profileFor 가 방 안 l302-e1 또는 last303 roster(빈 배열)에서만 프로필을 찾았다.
//  앞선 R990 측정(64초 6물결)은 보스 9칸 안 몹만 치우고 먼 순찰을 살려 둔 조건이라 이 경우를 못 봤다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const F=path.join(R,'client-source','bulmyeongwi-fog-r990.js');const src=fs.readFileSync(F,'utf8');
const ORIG=[{name:'불면의 십자시선',shape:'cross',damage:27,windup:1.18},{name:'검은 영혼 부채살',shape:'cone',damage:22,windup:1.05},{name:'잠들 수 없는 안전지대',shape:'safe',damage:32,windup:1.48},{name:'악몽 잔상 폭우',shape:'circle',damage:27,windup:1.4}];
const X=[{name:'독수렁 · 조준 연격',shape:'cone',damage:27,windup:1.02,r58Variant:true,r58Status:'poison'},{name:'독수렁 · 교차 파열',shape:'cross',damage:27,windup:1.18,r58Variant:true},{name:'독수렁 · 잔류 맥동',shape:'donut',damage:27,windup:1.25,r58Variant:true}];
function world({store={},roomId='last303',coarse=false,lowFx=false,names=null,ready=true,r58=false}={}){
 const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,WeakSet,Set,Symbol,isFinite,RegExp,performance:{now:()=>0},innerWidth:1280,
  matchMedia:()=>({matches:coarse}),setTimeout:()=>0,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};ctx.window=ctx;vm.createContext(ctx);
 const orig=JSON.stringify(names?names.map(n=>({name:n})):r58?[ORIG[0],X[0],ORIG[1],X[1],ORIG[2],X[2],ORIG[3]]:ORIG);
 vm.runInContext(`var projectiles=[],time=0,settings={lowFx:${lowFx}},modal=null,loading=false,player={x:6,y:3,hp:100},effects=[],hazards=[],__snd=[],__motions=[],__made=0,__draw=[];
  var portable={assetMap:{zones:[{id:'last303',actors:[{id:'l303-boss',patterns:${orig}},{id:'other',patterns:${orig}}]}]}};
  var regionById={last303:{id:'last303',roster:[]},last302:{id:'last302'}};
  var room={id:${JSON.stringify(roomId)},layer:'STORY',engaged:true,cleared:false,finalizing:false,enemies:[]};
  var ctx={commands:[],save(){},restore(){},scope(o,f){f();}};
  function readyImage(p){return ${ready}?{ready:true,image:{naturalWidth:6144,naturalHeight:256}}:null;}function addImage(){}
  function project(x,y){return {x:x*32-y*32,y:(x+y)*16};}function actorHeight(){return 110;}
  function drawAssetFrame3(p,fr,x,y,h,o){__draw.push({p,fr,x,y,h,o});return true;}
  function fx(type,x,y,opt={}){effects.push({type,x,y,age:0,life:.45,...opt});}
  var soundProfiles={};function sound(k){__snd.push(k);}
  function actor3(prof,id,x,y){__made++;return {id,nativeId:prof.id,profile:prof,name:prof.name,x,y,hp:50,maxHp:50,damage:5};}
  function tickEnemies(dt){return 'base';}function drawEffect(f){__draw.push({base:f.type,frame:f.r61Frame});return 'base';}
  var __r61={owner:{nextAt:0},positions:0};
  window.__STORYWORLD_SUMMONS_R61__={state:e=>__r61.owner,position:(u,o,i,res)=>{__r61.positions++;return {x:o.x+2+i*.3,y:o.y+1};},safePoint:()=>true};
  window.__STORYWORLD_FIELDS_R61__={activeAction:()=>null,beginMotion:(e,kind,o)=>{const a={kind,releaseAt:time+o.windup,o};__motions.push(a);return a;}};
  window.__STORYWORLD_SCALE_MELEE_R61__={normalize:e=>{e.normalized=true;}};`,ctx);
 vm.runInContext(src,ctx);return ctx;}
const run=(c,s)=>vm.runInContext(s,c);
function step(c,t1,dt=.1){run(c,`while(time<${t1}-1e-9){time+=${dt};tickEnemies(${dt});for(const a of __motions)if(!a.done&&time>=a.releaseAt){a.done=true;a.released=true;a.o.onRelease();}}`);}

const BOSS=(hp=1)=>`room.enemies.push({id:'last303:l303-boss',nativeId:'l303-boss',boss:true,hp:${hp}*1000,maxHp:1000,x:10,y:10,spawnState:'active'});`;
const ROSTER="regionById.last302.roster=[{id:'l302-e0',name:'다른 몹'},{id:'l302-e1',name:'포구 검은 안개',kind:'specter'}];";
const fog=c=>run(c,"room.enemies.filter(e=>e.r990Fog&&e.hp>0)");
// ① 방에 보스만 있고 last303 roster 는 비어 있어도, 불면귀 맵(last302) 명단의 l302-e1 로 소환한다
{const c=world();run(c,ROSTER+BOSS(1));step(c,12);const st=run(c,"window.__STORYWORLD_BMG_FOG_R990__.inspect().stats");
 ok(st.waves>=1,'일반몹 0마리 보스 단계: 소환 물결 1회 이상 '+JSON.stringify(st));ok(fog(c).length===4,'첫 물결 4명 '+fog(c).length);
 ok(fog(c).every(e=>e.nativeId==='l302-e1'&&/^잠식된 /.test(e.name)),'불면귀 맵 일반몹(l302-e1)만');
 ok(fog(c).every(e=>[e.x,e.y].every(Number.isFinite)),'위치 유한');}
// ② 같은 조건, 모바일 동시 상한 6 유지
{const c=world({coarse:true});run(c,ROSTER+BOSS(1));step(c,80);ok(fog(c).length===6,'모바일 동시 상한 6 '+fog(c).length);
 ok(run(c,"window.__STORYWORLD_BMG_FOG_R990__.inspect().stats.waves")>=2,'모바일도 여러 물결');}
// ③ 지역 진입 때 본 l302-e1 의 실제 프로필을 기억해 두었다가, 몹이 다 사라진 뒤 보스가 처음 깨어나도 그 프로필을 쓴다
{const c=world();run(c,"room.enemies.push({id:'last303:p9',nativeId:'l302-e1',profile:{id:'l302-e1',name:'포구 검은 안개',tag:'live'},hp:30,spawnState:'active',x:3,y:3});tickEnemies(.1);room.enemies.length=0;"+BOSS(1));
 step(c,12);const u=fog(c);ok(u.length===4&&u.every(e=>e.profile?.tag==='live'),'진입 때 본 프로필 사용 '+u.map(e=>e.profile?.tag));}
// ④ 어디에도 프로필이 없으면 소환을 거절할 뿐 멈추거나 NaN 을 만들지 않는다
{const c=world();run(c,"regionById.last302={id:'last302'};"+BOSS(1));step(c,12);const st=run(c,"window.__STORYWORLD_BMG_FOG_R990__.inspect().stats");
 ok(st.waves===0&&st.refused>=1&&st.errors===0,'출처 없음: 거절만 '+JSON.stringify(st));ok(fog(c).length===0,'소환 0');}
// ⑤ 다른 지역 이름의 몹·보스·소환된 몹 프로필은 기억하지 않는다
{const c=world();run(c,"room.enemies.push({id:'x',nativeId:'l302-e1',boss:true,profile:{id:'l302-e1',tag:'boss'},hp:1,x:1,y:1},{id:'y',nativeId:'l302-e1',r990Fog:true,profile:{id:'l302-e1',tag:'mine'},hp:1,x:1,y:1});tickEnemies(.1);room.enemies.length=0;"+ROSTER+BOSS(1));
 step(c,12);ok(fog(c).length===4&&fog(c).every(e=>!e.profile?.tag),'보스·소환 몹 프로필은 안 씀');}
console.log('R996 CPU 검사 통과 '+n);
