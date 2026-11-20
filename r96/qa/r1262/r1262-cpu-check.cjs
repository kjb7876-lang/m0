// R1262 CPU 검사: 7대죄 보스 그림 전수에서 찾은 결함 — 보스·몹이 조형물 던지기 차례에 방의 보물상자(R103·R712 그림)·미카엘라 NPC 를 집어 던지고,
//  보스(R114 adoptThrow)는 던진 조형물을 숨겨 보물상자가 그 방을 나갈 때까지 사라졌다(헤드리스 재현 qa/r1262/throw-reward.mjs ep1b05:b05-boss).
//  기대: 보상·NPC 조형물 대신 같은 방의 다른 조형물(없으면 지역 꾸밈 그림)을 던지고, 보물상자는 숨기지 않는다. 다른 던지기·정본 물건(R471)은 그대로.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'..','..'),ROOT=path.resolve(R,'..');const F='reward-throw-r1262.js';
let n=0,bad=0;const ok=(m,c,x)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(!c&&x!==undefined?' '+JSON.stringify(x).slice(0,300):''));};
let src='';try{src=fs.readFileSync(path.join(R,'client-source',F),'utf8');}catch(_){}
ok('client-source/'+F+' 있음',!!src);
const CHEST='assets/r712/chest-closed.png',MICH='assets/hero_direction337/michaela/s.webp';
function boot(o={}){const store=new Map(Object.entries(o.store||{}));const ready=new Set(o.ready||[CHEST,MICH,'assets/a.webp','assets/b.webp','assets/scn.webp']);
 const sb={console,Math,JSON,Number,String,Object,Array,Map,Set,WeakMap,WeakSet,Error,isFinite,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},time:0,ticks:0,
  readyImage:p=>ready.has(p)?{image:{width:10,height:10},ready:true}:null,
  room:o.room,player:{x:0,y:0,hp:10}};
 sb.window=sb;sb.tickEnemies=function(dt){sb.ticks++;return 'base';};
 sb.__STORYWORLD_CANON_THROW_R471__=Object.freeze({revision:'R471',pick:(e,a)=>o.canon?o.canon(e,a):null,inspect:()=>({})});
 sb.__STORYWORLD_SCENERY_R59__={assetFor:(id,step)=>o.scenery===false?null:'assets/scn.webp'};
 vm.createContext(sb);try{vm.runInContext(src,sb);}catch(e){console.log('load error',e.message);}return {sb,store,A:sb.__STORYWORLD_REWARD_THROW_R1262__};}
const mk=()=>{const chest={id:'r103chest:ep1b05:0',x:1,y:1,path:CHEST,height:54,label:'보물상자',growthR103:'chest',visible:true,solid:false};
 const mich={id:'r103michaela:1',x:1.2,y:1,path:MICH,height:64,label:'미카엘라',growthR103:'michaela',visible:true};
 const a1={id:'p1',x:2,y:1,path:'assets/a.webp',height:70,visible:true},b1={id:'p2',x:6,y:1,path:'assets/b.webp',height:60,visible:true},door={id:'d',x:1.5,y:1,path:'assets/b.webp',kind:'door',visualHospitalFrame:'door',visible:true};
 const boss={nativeId:'b05-boss',boss:true,x:0,y:0,hp:10},mob={nativeId:'b05-p1',x:0,y:0,hp:5};
 return {chest,mich,a1,b1,door,boss,mob,room:{id:'ep1b05',props:[chest,mich,door,a1,b1],enemies:[boss,mob],exploration:{scenery59:{props:[]}}}};};
{const M=mk();const {sb,A}=boot({room:M.room});
 ok('전역 API __STORYWORLD_REWARD_THROW_R1262__ (isReward·replacement·inspect·set)',!!A&&['isReward','replacement','inspect','set'].every(k=>typeof A[k]==='function'));
 if(A){
  ok('보물상자·미카엘라(R103 growthR103)·보물상자 그림 경로는 보상 조형물',A.isReward(M.chest)&&A.isReward(M.mich)&&A.isReward({path:'assets/r712/chest-open.png'})&&A.isReward({path:'assets/r103/chest-closed.svg'}));
  ok('보통 조형물은 보상 아님',!A.isReward(M.a1)&&!A.isReward(M.b1)&&!A.isReward(null));
  // 보스(R114 adoptThrow 가 R471 pick 을 먼저 묻는다): 보물상자를 집으면 다른 조형물로 바꿔 돌려준다 → R114 는 a.prop=null 로 숨기지 않음
  const a={kind:'prop',path:CHEST,prop:{path:CHEST,x:1,y:1,id:M.chest.id},frame:null};
  const P=sb.__STORYWORLD_CANON_THROW_R471__.pick(M.boss,a);
  ok('보스가 보물상자를 고르면 R471 pick 이 가장 가까운 다른 보통 조형물(문·보상 빼고)을 준다',P&&P.path==='assets/a.webp'&&P.height===70&&/r1262/.test(String(P.key)),P);
  const a2={kind:'prop',path:'assets/b.webp',prop:{path:'assets/b.webp',x:6,y:1,id:'p2'}};
  ok('보통 조형물을 고른 던지기는 그대로(pick null → R114 원래 길)',sb.__STORYWORLD_CANON_THROW_R471__.pick(M.boss,a2)===null);
  // 몹(R114 가 맡지 않음): 틱 뒤 준비 중인 던지기의 그림을 바꾼다
  M.mob.r61Action={kind:'prop',path:MICH,prop:{path:MICH,x:1.2,y:1,id:M.mich.id},frame:null,released:false,room:M.room};
  const r=sb.tickEnemies(.016);
  ok('엔진 tickEnemies 는 그대로 불리고 결과도 그대로',r==='base'&&sb.ticks===1);
  ok('몹이 미카엘라를 집은 던지기는 다른 조형물 그림으로 바뀜',M.mob.r61Action.path==='assets/a.webp'&&M.mob.r61Action.prop?.path==='assets/a.webp',M.mob.r61Action);
  M.mob.r61Action={kind:'echo',path:CHEST,prop:null,released:false,room:M.room};sb.tickEnemies(.016);
  ok('던지기 아닌 동작(echo)은 건드리지 않음',M.mob.r61Action.path===CHEST);
  M.mob.r61Action={kind:'prop',path:CHEST,prop:{path:CHEST,x:1,y:1,id:M.chest.id},released:true,room:M.room};sb.tickEnemies(.016);
  ok('이미 날아간 던지기는 건드리지 않음',M.mob.r61Action.path===CHEST);
  ok('보물상자는 숨겨지지 않음(visible 그대로)',M.chest.visible===true&&!M.chest.r114Hidden);
 }}
// 방에 보통 조형물이 없을 때: 지역 꾸밈 그림, 그것도 없으면 그 몹 자신의 던지기 자세 그림(R61 echo 와 같은 그림) — 보상은 절대 안 던짐
{const M=mk();M.room.props=[M.chest,M.mich];const {sb,A}=boot({room:M.room});
 if(A){const P=sb.__STORYWORLD_CANON_THROW_R471__.pick(M.boss,{kind:'prop',path:CHEST,prop:{path:CHEST,x:1,y:1,id:M.chest.id}});
  ok('보통 조형물이 없으면 지역 꾸밈 그림(R59 assetFor)',P&&P.path==='assets/scn.webp',P);}}
{const M=mk();M.room.props=[M.chest];const {sb,A}=boot({room:M.room,scenery:false,ready:[CHEST,'assets/boss-echo.webp']});
 if(A){const a={kind:'prop',path:CHEST,prop:{path:CHEST,x:1,y:1,id:M.chest.id},frames:[null,null,{path:'assets/boss-echo.webp'}]};const P=sb.__STORYWORLD_CANON_THROW_R471__.pick(M.boss,a);
  ok('조형물·꾸밈 그림이 없으면 그 몹의 던지기 자세 그림(잔상)으로',P&&P.path==='assets/boss-echo.webp',P);}}
// R471 정본 물건이 먼저
{const M=mk();const {sb,A}=boot({room:M.room,canon:()=>({key:'mirror',path:'assets/world-r80/r80-026.webp',height:64})});
 if(A){const P=sb.__STORYWORLD_CANON_THROW_R471__.pick(M.boss,{kind:'prop',path:CHEST,prop:{path:CHEST,x:1,y:1,id:M.chest.id}});ok('R471 정본 물건이 있으면 그것이 먼저(바꾸지 않음)',P&&P.key==='mirror',P);}}
// 끄기
{const M=mk();const {sb,A}=boot({room:M.room,store:{'storyworld.r1262.rewardThrow':'{"on":false}'}});
 if(A){const P=sb.__STORYWORLD_CANON_THROW_R471__.pick(M.boss,{kind:'prop',path:CHEST,prop:{path:CHEST,x:1,y:1,id:M.chest.id}});ok('끄기(storyworld.r1262.rewardThrow on:false)면 원래대로',P===null,P);}}
// 빌드 연결
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');const tags=[...html.matchAll(/<script src="\.\/([^"]+)"/g)].map(m=>m[1]);
const i=tags.indexOf(F),j=tags.indexOf('canon-throw-r471.js'),k=tags.indexOf('combat-r114.js'),t=tags.indexOf('combat-r118.js');
ok('index.html 스크립트 태그: canon-throw-r471·combat-r114 뒤, combat-r118 앞',i>j&&i>k&&j>=0&&k>=0&&i<t,{i,j,k,t});
const inputs=fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8');ok('runtime-inputs.json 에 들어감(sync-r99)',inputs.includes('"'+F+'"'));
ok('verify-r96-public.py 기대 목록',fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"));
ok('pages.yml CPU 검사 줄',fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8').includes('r96/qa/r1262/r1262-cpu-check.cjs'));
console.log(`${n-bad}/${n} PASS`);process.exit(bad?1:0);
