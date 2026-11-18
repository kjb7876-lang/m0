// R1126 777 개발자 시험 모드 · 패시브 포인트 입력칸 — CPU 검사(정적 + 실제 777 블록 + R970 + 가짜 엔진).
//  node r96/qa/r1126/cheat-points-cpu-check.cjs
//  사용자 2026-11-17 22:36Z "777치트사용시 패시브포인트칸도만들어서 지정한만큼패시브포인트적용되게해줘".
//  패시브 포인트 = player.points(P 창 특수 패시브·스킬 강화에 쓰는 포인트). 적은 수가 그대로 남은 포인트가 된다.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;
const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d).slice(0,400));assert(c,m);n++;console.log('PASS',m);};
const rd=(d,f)=>{try{return fs.readFileSync(path.join(R,d,f),'utf8');}catch(_){return '';}};
const F='cheat-points-r1126.js',src=rd('client-source','cheat-level-r970.js'),src2=rd('client-source',F),html=rd('runtime-text','index.html');
// ---- 정적 ----
ok(src2.length>0&&src2===rd('runtime-text',F),'R1126 모듈이 있고 runtime-text 사본과 같음');
ok(html.split('"./'+F+'"').length===2,'index.html 스크립트 태그 한 번');
{const at=f=>html.indexOf('"./'+f+'"');ok(at(F)>at('cheat-level-r970.js')&&at(F)<at('skill-style-r972.js'),'cheat-level-r970 바로 뒤');}
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"),'verify-r96-public.py 기대 목록');
ok(/node r96\/qa\/r1126\/cheat-points-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
ok(JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8'))).includes(F),'runtime-manifest 에 들어 있음');
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
ok(!/ctx\.|drawImage|\.filter\s*=|(?:window|document)\.addEventListener\(\s*['"]key/.test(strip(src2)),'그림·필터·전역 키 처리 없음');
const a=html.indexOf('/* User-approved 777'),b=html.indexOf('})();',a)+5;ok(a>0&&b>a,'777 블록 찾음');
const native=html.slice(a,b);
function boot(){
 const store=new Map(),els=new Map();
 const el=id=>{if(!els.has(id))els.set(id,{id,style:{},hidden:false,value:'',textContent:'',onclick:null,setAttribute(){},addEventListener(){},querySelector:()=>null,insertAdjacentHTML(){}});return els.get(id);};
 const ctx={console,JSON,Math,Number,String,Object,Array,Error,Promise,setTimeout,queueMicrotask,
  localStorage:{getItem:()=>null,setItem(){}},
  document:{getElementById:id=>els.has(id)?els.get(id):null,createElement:()=>el('story-code-button'),body:{appendChild(){}}},
 };ctx.window=ctx;vm.createContext(ctx);
 vm.runInContext(`var HERO_LEVEL_CAP=${/const HERO_LEVEL_CAP=(\d+);/.exec(html)[1]};var SAVE='save.test',toasts=[];
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
 vm.runInContext(native,ctx);vm.runInContext(src,ctx);vm.runInContext(src2,ctx);
 return {ctx,run:c=>vm.runInContext(c,ctx),store,el};
}
(async()=>{
 const t=boot(),Q=()=>t.run('window.__STORYWORLD_CHEAT_POINTS_R1126__');
 ok(typeof Q()?.setPoints==='function'&&typeof Q().parsePoints==='function','R1126 API');
 // ① 777 이 꺼져 있으면 거절(일반 진행 보호)
 let r=Q().setPoints(50);ok(!r.ok&&t.run('player.points')===2,'777 꺼져 있으면 거절, 포인트 그대로',r);
 // ② 켠 뒤 지정한 만큼 그대로 남은 포인트가 됨
 await t.run("window.__STORYWORLD_CHEAT_LEVEL_R970__.activate('777',30)");ok(t.run('player.points')===27,'R970 Lv.30 으로 켬(포인트 27)',t.run('player'));
 r=Q().setPoints(50);ok(r.ok&&t.run('player.points')===50&&r.points===50,'50 → 남은 포인트 50(더하기가 아니라 지정)',r);
 r=Q().setPoints('120');ok(r.ok&&t.run('player.points')===120,'문자열 120 → 120');
 // ③ 경계값
 r=Q().setPoints(0);ok(r.ok&&t.run('player.points')===0,'0 → 0',r);
 r=Q().setPoints(-5);ok(r.ok&&t.run('player.points')===0,'음수 → 0(0 아래로 안 내려감)',r);
 r=Q().setPoints(1e12);ok(r.ok&&t.run('player.points')===Q().range[1]&&Q().range[1]===999999,'큰 수 → 상한 999999',r);
 r=Q().setPoints(Number.MAX_VALUE);ok(r.ok&&t.run('player.points')===999999,'아주 큰 수도 상한');
 r=Q().setPoints('');ok(!r.ok&&t.run('player.points')===999999,'빈칸 거절, 포인트 그대로',r);
 r=Q().setPoints('   ');ok(!r.ok,'공백만 거절');
 r=Q().setPoints(null);ok(!r.ok,'null 거절');
 r=Q().setPoints('abc');ok(!r.ok&&t.run('player.points')===999999,'숫자 아님 거절',r);
 r=Q().setPoints(NaN);ok(!r.ok,'NaN 거절');
 r=Q().setPoints(Infinity);ok(!r.ok,'Infinity 거절');
 r=Q().setPoints('12.9');ok(r.ok&&t.run('player.points')===12,'소수는 내림(12)');
 r=Q().setPoints(' 7 ');ok(r.ok&&t.run('player.points')===7,'앞뒤 빈칸 허용');
 ok(Number.isSafeInteger(t.run('player.points')),'포인트는 늘 안전한 정수');
 // ④ 레벨·기술은 건드리지 않음
 ok(t.run('player.level')===30&&t.run('player.upgrades.vital')===1,'레벨·기술 그대로',t.run('player'));
 // ⑤ 지역 이동·777 저장·불러오기 뒤에도 유지
 Q().setPoints(77);await t.run("enterRegion('dist01')");ok(t.run('player.points')===77,'지역 이동 뒤 77 유지');
 ok(t.run('saveGame(false)')===true&&JSON.parse(t.store.get('save.test.cheat777')).player.points===77,'777 저장본에 77');
 t.run('player.points=3');await t.run('__STORYWORLD_CHEAT777__.load()');ok(t.run('player.points')===77,'불러오기 뒤 77');
 // ⑥ 레벨 입력 없이 예전 API 로 켠 777(만렙 모드)에서도 적용
 {const u=boot();await u.run("__STORYWORLD_CHEAT777__.activate('777')");const q=u.run('window.__STORYWORLD_CHEAT_POINTS_R1126__.setPoints(40)');ok(q.ok&&u.run('player.points')===40,'예전 만렙 777 에서도 40',q);
  await u.run("enterRegion('dist01')");ok(u.run('player.points')===40,'만렙 777 지역 이동 뒤 유지');}
 // ⑦ 일반 진행 복귀 → 원래 포인트, 이후 거절
 ok(await t.run('__STORYWORLD_CHEAT777__.leave()')===true&&t.run('player.points')===2,'일반 진행 복귀하면 원래 포인트 2',t.run('player'));
 r=Q().setPoints(9);ok(!r.ok&&t.run('player.points')===2,'복귀 뒤 거절');
 // ⑧ 함께하기 손님은 777 자체가 안 켜지므로 거절
 {const u=boot();u.run("window.__STORYWORLD_COOP_SIM_R62__={mode:()=>'guest'}");await u.run("window.__STORYWORLD_CHEAT_LEVEL_R970__.activate('777',30)");const q=u.run('window.__STORYWORLD_CHEAT_POINTS_R1126__.setPoints(9)');ok(!q.ok&&u.run('player.points')===2,'함께하기 손님 거절',q);}
 console.log('R1126 CPU 검사 '+n+'개 통과');
})().catch(e=>{console.error(e);process.exit(1);});
