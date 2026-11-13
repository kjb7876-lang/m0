// R1011 영웅 만렙 777 · 777 코드로 777 레벨까지 — CPU 검사(정적 + 실제 코드 조각 실행).
//  node r96/qa/r1011/r1011-cpu-check.cjs
//  사용자 2026-11-13 08:55Z "영웅만렙 777로 올리고 코드사용시 777레벨까지도 될수 있도록 개선및 디버깅".
//  상한 한 곳(index.html HERO_LEVEL_CAP=777)을 일반·사몽·무한생존·777 코드가 함께 쓴다.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..');let n=0;
const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d).slice(0,400));assert(c,m);n++;console.log('PASS',m);};
const rd=(d,f)=>{try{return fs.readFileSync(path.join(R,d,f),'utf8');}catch(_){return '';}};
const html=rd('runtime-text','index.html'),R970=rd('client-source','cheat-level-r970.js'),SV=rd('client-source','survival-r600.js');
// ---- 정적: 상한이 한 곳(777)이고 모든 길이 그것을 쓴다 ----
ok(/const HERO_LEVEL_CAP=777;/.test(html),'index.html 에 공유 상한 HERO_LEVEL_CAP=777');
ok(/function gainXP\(value\)\{player\.xp\+=value;let n=0;while\(player\.level<HERO_LEVEL_CAP&&/.test(html),'기본 gainXP 상한 = HERO_LEVEL_CAP');
ok(/out\.level=clamp\(Math\.floor\(finite\(p\.level,1\)\),1,HERO_LEVEL_CAP\);/.test(html),'validateSave 레벨 자르기 = HERO_LEVEL_CAP(예전 99)');
ok(!/out\.level=clamp\(Math\.floor\(finite\(p\.level,1\)\),1,99\)/.test(html)&&!/player\.level<99&&/.test(html),'엔진에 레벨 99 상한이 남지 않음');
ok(/const SLOT=SAVE\+'\.cheat777',LEVEL_CAP=99;/.test(html),'레벨 없이 부르는 예전 777 API(검사 도구) 채우기 레벨은 99 그대로(CI 고정 검사 r81 계약)');
ok(/p\.level=Math\.min\(HERO_LEVEL_CAP,Math\.max\(1,integer\(p\.level,1\)\)\+1\);/.test(html),'R62 지역 완료 레벨업도 상한에서 멈춤');
ok(/p\.level=Math\.min\(HERO_LEVEL_CAP,Math\.max\(1,integer\(data\.level,1\)\)\);/.test(html),'R62 저장 불러오기 레벨도 상한으로 자름');
ok(/p\.level=Math\.min\(HERO_LEVEL_CAP,Math\.max\(1,integer\(p\.level,1\)\)\);p\.points=integer\(p\.points\);return p;/.test(html),'R62 normalizePlayer 도 상한으로 자름');
ok(/player\.level=Math\.min\(CAP\(\),Math\.max\(player\.level,S\.lv\)\)/.test(SV)&&!/Math\.min\(99,Math\.max\(player\.level,S\.lv\)\)/.test(SV)&&SV===rd('runtime-text','survival-r600.js'),'무한생존 영웅 레벨 상한 = 공유 상한(사본 일치)');
ok(/MAX=\(typeof HERO_LEVEL_CAP!=='undefined'&&HERO_LEVEL_CAP>0\)\?HERO_LEVEL_CAP:777/.test(R970)&&R970===rd('runtime-text','cheat-level-r970.js'),'R970 레벨 칸 최대 = 공유 상한(사본 일치)');
ok(!/레벨99/.test(html),'777 창 글에 "레벨99" 가 남지 않음');
// ---- 777 코드 실행: 실제 777 블록 + R970 ----
const a=html.indexOf('/* User-approved 777'),b=html.indexOf('})();',a)+5,native=html.slice(a,b);
function boot(){const store=new Map(),els=new Map();
 const el=id=>{if(!els.has(id))els.set(id,{id,style:{},setAttribute(){},addEventListener(){}});return els.get(id);};
 const ctx={console,JSON,Math,Number,String,Object,Array,Error,Promise,setTimeout,localStorage:{getItem:()=>null,setItem(){}},
  document:{getElementById:id=>els.has(id)?els.get(id):null,createElement:()=>el('story-code-button'),body:{appendChild(){}}},__store:store};ctx.window=ctx;vm.createContext(ctx);
 vm.runInContext(`var HERO_LEVEL_CAP=${/const HERO_LEVEL_CAP=(\d+);/.exec(html)?.[1]||99};var SAVE='save.test';
  var UPGRADES=[{id:'vital',max:4},{id:'power',max:5}],HEROES={hwando:{power:10}};
  var regions=[{id:'hub',title:'쉼터'}],regionById={hub:regions[0]};
  var started=true,loading=false,storyScene=null,room={id:'hub'},zone='hub',layer='STORY';
  var player={hero:'hwando',hp:200,level:1,xp:0,points:1,upgrades:{},samong:0,ego:0};
  function maxHP(){return 260+35*(player.upgrades.vital||0)+(player.level-1)*5;}
  function toast(){} function warn(){} function canTravel(){return true;} function closePanel(){} function openPanel(){} function $(id){return document.getElementById(id);} function button(){} function escapeHTML(s){return String(s);}
  function download(){} function normalSaveKeyR73(){return SAVE;} function chapterOpen(){return false;}
  window.__STORYWORLD_TEST_STORAGE_B1__={store:{getItem:k=>__store.get(k)??null,setItem:(k,v)=>__store.set(k,v)}};
  function serializeSave(){return {version:4,zone,layer,player:JSON.parse(JSON.stringify(player))};}
  function saveGame(){__store.set(SAVE,JSON.stringify(serializeSave()));return true;}
  async function restoreSave(raw){player=JSON.parse(JSON.stringify(raw.player));return true;}
  async function loadLocal(){return restoreSave(JSON.parse(__store.get(SAVE)));} function exportSave(){} async function enterRegion(id){zone=id;return true;} async function newGame(){return true;}`,ctx);
 vm.runInContext(native,ctx);vm.runInContext(R970,ctx);return {run:c=>vm.runInContext(c,ctx)};}
(async()=>{
 {const t=boot();const r=await t.run(`__STORYWORLD_CHEAT777__.activate('777')`);ok(r.ok&&t.run('player.level')===99,'레벨 없이 부르는 예전 API 는 그대로 Lv.99(플레이어 창은 늘 레벨 칸을 거침)',t.run('player'));}
 {const t=boot(),L='window.__STORYWORLD_CHEAT_LEVEL_R970__';
  let r=await t.run(`${L}.activate('777',777)`);ok(r.ok&&t.run('player.level')===777&&t.run('player.points')===777,'레벨 칸에 777 → Lv.777 · 포인트 1+776=777',t.run('player'));
  ok(JSON.stringify(t.run(`${L}.range`))==='[1,777]','레벨 칸 범위 1~777');
  r=t.run(`${L}.setLevel(1000)`);ok(r.ok&&t.run('player.level')===777&&t.run('player.points')===777,'1000 은 777 로 잘림',t.run('player'));
  r=t.run(`${L}.setLevel(500)`);ok(r.ok&&t.run('player.level')===500&&t.run('player.points')===500,'500 으로 내리면 -277',t.run('player'));
  r=t.run(`${L}.setLevel(778)`);ok(r.ok&&t.run('player.level')===777,'778(경계) → 777');
  r=t.run(`${L}.setLevel(99)`);ok(r.ok&&t.run('player.level')===99,'예전 상한 99 도 그대로 고를 수 있음');
  r=t.run(`${L}.setLevel(100)`);ok(r.ok&&t.run('player.level')===100,'100(예전 상한 바로 위)도 이제 됨');
  // 실플레이 재현(헤드리스, 사몽 0번 진입): R970 감싸기를 거치지 않는 길에서 777 블록 applyCaps 가 불리면 고른 레벨이 만렙으로 덮였다.
  r=t.run(`${L}.setLevel(5)`);t.run('__STORYWORLD_CHEAT777__.applyCaps()');
  ok(t.run('player.level')===5&&t.run('player.upgrades.vital')===undefined,'레벨 칸으로 고른 레벨은 applyCaps 를 바로 불러도 덮이지 않음',t.run('player'));}
 {const t=boot();await t.run(`__STORYWORLD_CHEAT777__.activate('777')`);t.run('player.level=3');t.run('__STORYWORLD_CHEAT777__.applyCaps()');
  ok(t.run('player.level')===99,'레벨 없이 켠 예전 777 은 applyCaps 가 그대로 99 로 채움');}
 // ---- 777 레벨에서 수치가 유한한지: 실제 maxHP·attackPower·levelCost·R62 factors 를 떼어 실행 ----
 const grab=re=>{const m=re.exec(html);ok(!!m,'코드 조각 찾음 '+re.source.slice(0,40));return m[0];};
 const fMax=grab(/function maxHP\(\)\{[^}]*\}/),fAtk=grab(/function attackPower\(\)\{[^}]*\}/),fCost=grab(/function levelCost\(level\)\{[^}]*\}/);
 const fFac=grab(/function factors\(p=player\)\{.*?return\{[^}]*\};\}/);
 const c={Math};vm.createContext(c);vm.runInContext(`var HEROES={hwando:{power:10}},player={hero:'hwando',level:777,samong:0,ego:0,upgrades:{}};function rank(){return 7;}
  function integer(v,d=0){return Number.isFinite(v)?Math.max(0,Math.floor(v)):d;} function ranks(id,p){return p.R[id]||0;}
  ${fMax}${fAtk}${fCost}${fFac}`,c);
 for(const [lv,s,e] of [[777,0,0],[777,3,0],[777,0,2],[1,0,0],[99,0,0]]){const v=vm.runInContext(`player.level=${lv};player.samong=${s};player.ego=${e};[maxHP(),attackPower(),levelCost(player.level)]`,c);
  ok(v.every(Number.isFinite)&&v.every(x=>x>0),'Lv.'+lv+(s?' 사몽':'')+(e?' EGO':'')+' 최대체력·공격력·경험치 표 유한·양수',v);}
 const f=vm.runInContext(`factors({R:{endlessPower:776,endlessVital:776,endlessHaste:776,endlessCooldown:776,egoAura:776,dreamAura:776,endlessWard:776,endlessResonance:776}})`,c);
 ok(Object.values(f).every(Number.isFinite)&&f.tempo>=.28&&f.cooldown>=.25&&f.ward>0,'포인트 776점을 한 패시브에 몰아도 R62 배수 유한·하한 유지',f);
 console.log('R1011 CPU 검사 '+n+'개 통과');
})().catch(e=>{console.error(e);process.exit(1);});
