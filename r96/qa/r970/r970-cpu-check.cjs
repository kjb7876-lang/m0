// R970 777 개발자 시험 모드 · 레벨 입력 → 레벨 규칙대로 스킬 포인트 — CPU 검사(정적 + 실제 777 블록 + 가짜 엔진).
//  node r96/qa/r970/r970-cpu-check.cjs
//  사용자 2026-11-13 "777코드사용하면 이제 레벨을 적는칸이 나오고 레벨에따라 스킬포인트가 지급되는구조로 바꿔줘 777은 개발자테스트모드라서".
//  규칙(일반 진행과 같게): R62 — 새 영웅 Lv.1·포인트 1, 레벨이 1 오를 때마다 포인트 +1. 레벨 범위 1~99(777 상한 LEVEL_CAP 99).
//  index.html 의 실제 777 블록을 그대로 떼어 가짜 엔진에서 돌리고 그 위에 R970 을 얹는다.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;
const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d).slice(0,400));assert(c,m);n++;console.log('PASS',m);};
const rd=(d,f)=>{try{return fs.readFileSync(path.join(R,d,f),'utf8');}catch(_){return '';}};
const F='cheat-level-r970.js',src=rd('client-source',F),html=rd('runtime-text','index.html');
// ---- 정적 ----
ok(src.length>0&&src===rd('runtime-text',F),'R970 모듈이 있고 runtime-text 사본과 같음');
ok(html.split('"./'+F+'"').length===2,'index.html 스크립트 태그 한 번');
{const at=f=>html.indexOf('"./'+f+'"');ok(at(F)>0&&at(F)<at('combat-r118.js')&&at(F)<at('hud-menu-r339.js'),'combat-r118 앞(끝 두 줄 규칙 유지)');}
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"),'verify-r96-public.py 기대 목록');
ok(/node r96\/qa\/r970\/r970-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
ok(JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8'))).includes(F),'runtime-manifest 에 들어 있음');
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
ok(!/ctx\.|drawImage|\.filter\s*=|(?:window|document)\.addEventListener\(\s*['"]key/.test(strip(src)),'그림·필터·전역 키 처리 없음(키는 레벨 칸 안에서만)');
// 일반 진행 규칙이 그대로인지(바뀌면 이 검사가 알려 준다)
ok(/freshPlayer=function\(\.\.\.args\)\{const p=freshBase\.apply\(this,args\);p\.points=1;/.test(html),'R62: 새 영웅 포인트 1');
ok(/p\.level=Math\.min\(MAX,Math\.max\(1,integer\(p\.level,1\)\)\+1\);p\.points=Math\.min\(MAX,integer\(p\.points\)\+1\);/.test(html),'R62: 레벨 +1 마다 포인트 +1');
ok(/const SLOT=SAVE\+'\.cheat777',LEVEL_CAP=99;/.test(html),'777 레벨 상한 99');
// ---- 실제 777 블록 떼기 ----
const a=html.indexOf('/* User-approved 777'),b=html.indexOf('})();',a)+5;ok(a>0&&b>a,'777 블록 찾음');
const native=html.slice(a,b);ok(native.includes('window.__STORYWORLD_CHEAT777__=Object.freeze'),'777 블록 끝까지');
function boot(){
 const store=new Map(),els=new Map();
 const el=id=>{if(!els.has(id))els.set(id,{id,style:{},hidden:false,value:'',textContent:'',onclick:null,setAttribute(){},addEventListener(){},querySelector:()=>null,insertAdjacentHTML(){}});return els.get(id);};
 const ctx={console,JSON,Math,Number,String,Object,Array,Error,Promise,setTimeout,queueMicrotask,
  localStorage:{getItem:()=>null,setItem(){}},
  document:{getElementById:id=>els.has(id)?els.get(id):null,createElement:()=>el('story-code-button'),body:{appendChild(){}}},
 };ctx.window=ctx;vm.createContext(ctx);
 vm.runInContext(`var SAVE='save.test',toasts=[];
  var UPGRADES=[{id:'vital',max:4},{id:'power',max:5},{id:'heroMechanic',max:3,hero:true}];
  var HEROES={hwando:{},lauren:{}};
  var regions=[{id:'hub',title:'쉼터'},{id:'dist01',title:'병원'}],regionById={hub:regions[0],dist01:regions[1]};
  var started=true,loading=false,storyScene=null,room={id:'hub'},zone='hub',layer='STORY',modal=false;
  var player={hero:'hwando',hp:200,level:5,xp:12,points:2,upgrades:{vital:1}};
  function maxHP(){return 260+35*(player.upgrades.vital||0);}
  function toast(m){toasts.push(m);} function warn(){} function canTravel(){return true;} function closePanel(){} var lastPanel='';
  function openPanel(h){lastPanel=h;} function $(id){return document.getElementById(id);} function button(){} function escapeHTML(s){return String(s);}
  function download(){} function normalSaveKeyR73(){return SAVE;} function chapterOpen(){return false;}
  window.__STORYWORLD_TEST_STORAGE_B1__={store:{getItem:k=>__store.get(k)??null,setItem:(k,v)=>__store.set(k,v)}};
  function serializeSave(){return {version:4,zone,layer,player:JSON.parse(JSON.stringify(player))};}
  function saveGame(){__store.set(SAVE,JSON.stringify(serializeSave()));return true;}
  async function restoreSave(raw){player=JSON.parse(JSON.stringify(raw.player));zone=raw.zone;return true;}
  async function loadLocal(){return restoreSave(JSON.parse(__store.get(SAVE)));}
  function exportSave(){} async function enterRegion(id){zone=id;return true;} async function newGame(){return true;}`,Object.assign(ctx,{__store:store}));
 vm.runInContext(native,ctx);vm.runInContext(src,ctx);
 return {ctx,run:c=>vm.runInContext(c,ctx),store,el};
}
(async()=>{
 // ① 예전 API(레벨 없이) 그대로: 레벨 99·기술 상한(기존 검사 r81 runtime-contracts 와 같은 계약)
 {const t=boot();const r=await t.run(`__STORYWORLD_CHEAT777__.activate('777')`);
  ok(r.ok&&t.run('player.level')===99&&t.run('player.upgrades.vital')===4&&t.run("player.upgrades['hwando:heroMechanic']")===3,'레벨 없이 부른 예전 API 는 그대로 Lv.99·상한',t.run('player'));
  ok(t.run('window.__STORYWORLD_CHEAT_LEVEL_R970__.inspect().chosen')===null,'예전 API 는 R970 레벨 모드가 아님');}
 // ② 레벨 입력으로 켜기: Lv.5 포인트 2 → Lv.30 = 포인트 2+25
 const t=boot(),L=()=>t.run('window.__STORYWORLD_CHEAT_LEVEL_R970__');
 ok(typeof L()?.activate==='function'&&typeof L().setLevel==='function','R970 API');
 ok(L().pointsFor(1)===1&&L().pointsFor(30)===30&&L().pointsFor(99)===99,'레벨 L 까지 일반 진행 누적 포인트 = L');
 let r=await L().activate('777',30);
 ok(r.ok&&t.run('__STORYWORLD_CHEAT777__.active()')===true,'777 + 레벨 30 으로 켜짐',r);
 ok(t.run('player.level')===30&&t.run('player.points')===27,'Lv.30 · 포인트 2+25=27',t.run('player'));
 ok(t.run('player.upgrades.vital')===1&&t.run("player.upgrades.power")===undefined,'기술을 상한까지 채우지 않음(포인트로 직접 성장)',t.run('player.upgrades'));
 ok(t.run('player.xp')===0,'경험치 0 에서 시작');
 // ③ 지역 이동(native enterRegion 이 applyCaps 를 부름) 뒤에도 유지
 await t.run(`enterRegion('dist01')`);
 ok(t.run('player.level')===30&&t.run('player.upgrades.vital')===1&&t.run('player.points')===27,'지역 이동 뒤에도 Lv.30·기술 그대로',t.run('player'));
 // ④ 777 저장(native saveGame 도 applyCaps 를 부름) → 플레이어 그대로, 저장본에 레벨 기록
 t.run('player.upgrades.power=2;player.points=25');
 ok(t.run('saveGame(false)')===true,'777 저장');
 ok(t.run('player.level')===30&&t.run('player.upgrades.power')===2,'저장 뒤에도 Lv.30·기술 그대로',t.run('player'));
 const saved=JSON.parse(t.store.get('save.test.cheat777'));
 ok(saved.cheat777?.levelR970?.level===30&&saved.cheat777.levelR970.upgrades.power===2,'저장본에 R970 레벨·기술 기록',saved.cheat777);
 // ⑤ 불러오기(native restoreSave 도 applyCaps) → 저장한 레벨·기술로
 t.run('player.level=1;player.upgrades={};player.points=0');
 await t.run('__STORYWORLD_CHEAT777__.load()');
 ok(t.run('player.level')===30&&t.run('player.upgrades.power')===2&&t.run('player.upgrades.vital')===1&&t.run('player.points')===25,'불러오기 뒤 Lv.30·기술·포인트 복원',t.run('player'));
 ok(L().inspect().chosen===30,'불러오기 뒤 레벨 모드 유지');
 ok(t.run('player.hp')<=t.run('maxHP()'),'체력이 최대 체력을 넘지 않음');
 // ⑥ 켜진 상태에서 레벨 바꾸기: 올리면 +차이, 상한·하한·이상값
 r=L().setLevel(99);ok(r.ok&&t.run('player.level')===99&&t.run('player.points')===25+69,'Lv.99 로 올리면 +69',t.run('player'));
 r=L().setLevel(150);ok(r.ok&&t.run('player.level')===99&&t.run('player.points')===94,'150 은 99 로 잘림(포인트 그대로)',t.run('player'));
 r=L().setLevel('abc');ok(!r.ok&&t.run('player.level')===99&&t.run('player.points')===94,'숫자가 아니면 거절',r);
 r=L().setLevel('');ok(!r.ok&&t.run('player.level')===99,'빈칸 거절',r);
 r=L().setLevel(Infinity);ok(!r.ok&&t.run('player.level')===99,'Infinity 거절',r);
 r=L().setLevel('12.7');ok(r.ok&&t.run('player.level')===12&&t.run('player.points')===94-87,'소수는 내림(12), 내리면 남은 포인트에서 차이만큼 뺌',t.run('player'));
 r=L().setLevel(-5);ok(r.ok&&t.run('player.level')===1&&t.run('player.points')===0,'음수는 1, 남은 포인트는 0 아래로 안 내려감',t.run('player'));
 r=L().setLevel(0);ok(r.ok&&t.run('player.level')===1,'0 은 1');
 r=L().setLevel(' 20 ');ok(r.ok&&t.run('player.level')===20&&t.run('player.points')===19,'앞뒤 빈칸 허용, 1→20 은 +19',t.run('player'));
 // ⑦ 일반 진행 복귀 → 레벨 모드 해제, 그 뒤 setLevel 거절, 예전 API 다시 Lv.99
 ok(await t.run('__STORYWORLD_CHEAT777__.leave()')===true,'일반 진행 복귀');
 ok(L().inspect().chosen===null&&t.run('player.level')===5&&t.run('player.points')===2,'복귀하면 원래 진행(Lv.5·포인트 2) 그대로',t.run('player'));
 r=L().setLevel(40);ok(!r.ok&&t.run('player.level')===5,'777 이 꺼져 있으면 레벨 바꾸기 거절',r);
 // ⑧ 잘못된 코드·레벨로는 켜지지 않음
 r=await L().activate('778',30);ok(!r.ok&&t.run('__STORYWORLD_CHEAT777__.active()')===false,'코드가 틀리면 안 켜짐',r);
 r=await L().activate('777','x');ok(!r.ok&&t.run('__STORYWORLD_CHEAT777__.active()')===false&&t.run('player.level')===5,'레벨이 숫자가 아니면 안 켜짐',r);
 // ⑨ 예전 777 저장(R970 기록 없음)을 불러오면 예전 방식(Lv.99·상한)
 {const u=boot();u.store.set('save.test.cheat777',JSON.stringify({version:4,zone:'hub',layer:'STORY',player:{hero:'hwando',hp:100,level:99,xp:0,points:3,upgrades:{vital:4,power:5}},cheat777:{active:true,version:1,levelCap:99,normalReturn:null}}));
  await u.run('restoreSave(JSON.parse(__store.get("save.test.cheat777")))');
  ok(u.run('player.level')===99&&u.run('player.upgrades.vital')===4&&u.run('window.__STORYWORLD_CHEAT_LEVEL_R970__.inspect().chosen')===null,'R970 기록 없는 예전 777 저장은 예전 방식 그대로');}
 // ⑩ 깨진 R970 기록은 무시(예전 방식) — 저장 조작으로 NaN·상한 초과가 들어가지 않음
 {const u=boot();u.store.set('k',JSON.stringify({version:4,zone:'hub',layer:'STORY',player:{hero:'hwando',hp:100,level:3,xp:0,points:3,upgrades:{}},cheat777:{active:true,version:1,levelCap:99,normalReturn:null,levelR970:{version:1,level:'NaN',xp:0,upgrades:{vital:1e9}}}}));
  await u.run('restoreSave(JSON.parse(__store.get("k")))');
  ok(u.run('window.__STORYWORLD_CHEAT_LEVEL_R970__.inspect().chosen')===null&&u.run('player.level')===99&&u.run('player.upgrades.vital')===4,'깨진 R970 기록은 버리고 예전 방식',u.run('player'));
  u.store.set('k2',JSON.stringify({version:4,zone:'hub',layer:'STORY',player:{hero:'hwando',hp:100,level:3,xp:0,points:3,upgrades:{}},cheat777:{active:true,version:1,levelCap:99,normalReturn:null,levelR970:{version:1,level:40,xp:-3,upgrades:{vital:1e9,power:2.5,junk:'x'}}}}));
  await u.run('restoreSave(JSON.parse(__store.get("k2")))');
  ok(u.run('player.level')===40&&u.run('player.upgrades.vital')===4&&u.run('player.upgrades.power')===2&&u.run('player.upgrades.junk')===undefined&&u.run('player.xp')===0,'R970 기록의 기술 단계는 정수·상한으로 자름',u.run('player'));}
 // ⑪ 함께하기 손님은 켤 수 없음(기존 규칙)
 {const u=boot();u.run("window.__STORYWORLD_COOP_SIM_R62__={mode:()=>'guest'}");const q=await u.run("window.__STORYWORLD_CHEAT_LEVEL_R970__.activate('777',30)");ok(!q.ok&&u.run('player.level')===5,'함께하기 손님은 거절',q);}
 console.log('R970 CPU 검사 '+n+'개 통과');
})().catch(e=>{console.error(e);process.exit(1);});
