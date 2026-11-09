// R461 — 영화 모드를 별도 입구로(사용자 2026-11-09 "영화모드를 픽셀모드처럼 아예따로빼서 진행가능하게" → 중간안 승인 "응 너추천대로 진행해",
//  이어서 "영화모드에는 영웅의 기억 적힌대로 그영웅으로만 플레이하도록").
//  ① 입구: 처음 화면에 '영화 모드로 시작' 단추(R306 '픽셀 모드로 시작'과 같은 방식). 영화 모드는 이제 '기록(세이브)의 성격'이다.
//     · 영화 모드로 시작한 기록은 저장에 playModeR461:'cinema' 가 남고, 이어하기로 불러오면 영화 모드가 다시 켜진다.
//     · 일반 기록에서는 영화 모드(R370)가 켜지지 않는다. 예전처럼 설정에서 켜 둔 값(localStorage)이 남아 있어도 처음 실릴 때 끈다.
//       → 일반 플레이에 영화 모드 전용 동작(R384 전투 맞추기·리젠·보스 체력 바닥·지역 이동 잠금, R376 화면 정리, R450 박자 자막 끄기)이 섞이지 않는다.
//     · 설정의 '영화 모드' 칸은 영화 기록에서만 쓸 수 있다(끄면 잠시 멈춤, 다시 켜면 이어 봄). 일반 기록에서는 잠겨 있고 처음 화면 입구를 알려 준다.
//     · Esc(R376)로 영화 모드를 끄면 이 기록 안에서 잠시 멈춘 것이다(기록 성격은 그대로, 설정에서 다시 켜거나 이어하기로 불러오면 다시 켜짐).
//  ② 영웅 고정(영화 기록에서만): 지역 서사의 '〈○○의 기억〉' 화자가 영웅 이름(환도·윤서하·네온·미카엘라·라우렌·헌터·슬레이어·기억사수)이면
//     그 지역에 들어설 때 그 영웅으로 바꾼다. 한 지역(사몽 구역은 구역마다)에서는 처음 맞은 영웅 화자로 한 번만 정한다(지역 안에서 왔다갔다 하지 않음).
//     · 사용자 2026-11-09 12:31Z "의목사 a =슬레이어 혹은 헌터중에 택1 ,의목사b -통제자쪽은 기억사수 그다음 에피소드는 환도 사몽부터는 의목사b는 기억사수 환도중에 택1":
//       의목사 A → 슬레이어·헌터 중 하나, 의목사 B(통제자 3부) → 기억사수, 그다음(환도의 기억) → 환도,
//       사몽(DREAM 사몽 구역)부터는 환도·기억사수 중 하나(기억사수의 기억은 기억사수). '중 하나'는 지금 영웅이 그 안에 있으면 그대로, 없으면 앞의 것.
//     · 그 밖에 영웅 이름이 아닌 화자(EGO·윤하람·도겸 등)는 바꾸지 않고 지금 영웅을 그대로 둔다(처음엔 시작할 때 고른 영웅).
//     · 거점의 '영웅 변경'은 영화 기록에서 막는다(서사가 정한 영웅으로만).
//  ③ 서사 문장·밸런스·맵 순서는 바꾸지 않는다. 판정·전투 값은 그대로이고, 영화 모드 전용 동작은 원래 파일(R370/R376/R384)이 켜짐 여부로 스스로 가린다.
//  끄기: localStorage storyworld.r461.run {"lock":false}(영웅 고정만 끔).
(()=>{'use strict';
if(window.__STORYWORLD_CINEMA_RUN_R461__)return;
const REV='R461-run-1',KEY='storyworld.r461.run',FIELD='playModeR461';
const stats={titleButtons:0,cinemaStarts:0,normalStarts:0,restoresCinema:0,restoresNormal:0,legacyOff:0,refusedOn:0,paused:0,resumed:0,heroLocks:0,heroSame:0,heroUnmapped:0,heroBlocked:0,carried:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
let prefs={lock:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');if(typeof s?.lock==='boolean')prefs.lock=s.lock;}catch(_){}
const ALIAS=Object.freeze({'의목사 A':['slayer','hunter'],'의목사 B':['gunner']});
const SAMONG=Object.freeze(['hwando','gunner']);// 사몽 구역: 환도의 기억·이름 없는 화자는 이 둘 중 하나
let run='normal',pending=null;
// ── 순수 함수(QA 가 CPU 에서 부른다) ──
// '〈환도의 기억〉' → '환도', '도겸의 기억 — 고흐라 불리던 자리' → '도겸', '한이경' → '한이경'
function speaker(n){const t=String(n||'').replace(/[〈〉<>]/g,'').trim();const m=t.match(/^(.+?)의 기억/);return (m?m[1]:t).trim();}
// 화자 → 영웅 id(영웅 이름과 정확히 같을 때만). heroes = {id:{name}}
const pick=(list,cur)=>list.includes(cur)?cur:list[0];
// mode: 'story'(본편) · 'dream'(DREAM 층 본편 지역: 의목사 B → 기억사수·환도 중 하나) · 'samong'(사몽 구역: 환도의 기억·이름 없는 화자도 환도·기억사수 중 하나)
function heroFor(n,heroes,alias=ALIAS,cur=null,mode='story'){const s=speaker(n);if(!s)return null;let id=null;
 if(mode!=='story'&&s==='의목사 B')return pick(SAMONG,cur);
 if(alias&&alias[s])id=pick([].concat(alias[s]),cur);else for(const[k,h]of Object.entries(heroes||{}))if(h&&h.name===s){id=k;break;}
 if(mode==='samong'&&(id===null||id==='hwando'))return pick(SAMONG,cur);return id;}
// 장면들 중 처음으로 영웅에 닿는 화자
function firstHero(narrs,heroes,alias=ALIAS,cur=null,mode='story'){for(const n of narrs||[]){const h=heroFor(n,heroes,alias,cur,mode);if(h)return h;}return null;}
// ── R370 연결 ──
const C0=window.__STORYWORLD_CINEMA_MODE_R370__;
const rawSet=C0&&typeof C0.set==='function'?C0.set:null;
const cinemaOn=()=>{try{return C0?.prefs?.().on===true;}catch(_){return false;}};
function turn(on){try{if(rawSet&&cinemaOn()!==on)rawSet({on});}catch(e){fail(e);}}
// 바깥(R376 Esc 등)이 부르는 set: 일반 기록에서는 켜기를 거절하고, 영화 기록에서 끄면 '잠시 멈춤'.
if(C0&&rawSet){try{window.__STORYWORLD_CINEMA_MODE_R370__=Object.freeze({...C0,set(p={}){
  try{if(p&&p.on===true&&run!=='cinema'){stats.refusedOn++;p={...p};delete p.on;try{if(typeof toast==='function')toast('영화 모드는 처음 화면의 \'영화 모드로 시작\'으로 시작합니다',2.6);}catch(_){}}
   else if(p&&p.on===false&&run==='cinema'&&cinemaOn())stats.paused++;
   else if(p&&p.on===true&&run==='cinema'&&!cinemaOn())stats.resumed++;}catch(e){fail(e);}
  return rawSet(p);}});}catch(e){fail(e);}}
// 처음 실릴 때: 예전 설정으로 켜져 있던 영화 모드를 끈다(기록을 불러오면 그 기록의 성격대로 다시 정해진다).
if(cinemaOn()){stats.legacyOff++;turn(false);}
// ── 영웅 고정 ──
const lockOn=()=>prefs.lock&&run==='cinema';
const decided=new Map();// 지역 열쇠 → 정한 영웅(null = 영웅 화자 없음)
const zoneKey=()=>{try{const r=G(()=>room,null);if(!r)return'';return r.samongR115?.zone?('samong:'+r.samongR115.zone):(r.id||G(()=>zone,''));}catch(_){return'';}};
let switching=null;
let target=null;// 마지막으로 바라는 영웅(앞선 요청이 그림을 받는 사이 새 요청이 오면 새 것이 이긴다)
async function become(id,why,early){if(!id||!G(()=>player,null))return false;target=id;
 while(switching)try{await switching;}catch(_){}
 if(target!==id)return false;const p=G(()=>player,null);if(!p)return false;if(p.hero===id){stats.heroSame++;return false;}
 switching=(async()=>{try{if(typeof ensureImages==='function'&&typeof heroPaths==='function')await ensureImages(heroPaths(id));
   const q=G(()=>player,null);if(!q||q.hero===id||target!==id)return false;const want=early?null:decided.get(zoneKey());if(want&&want!==id)return false;/* 그림을 받는 사이 다른 영웅 지역으로 옮겼으면 버린다 */
   try{stats.carried+=carry(q,q.hero,id,G(()=>UPGRADES,[]));}catch(e){fail(e);}
   q.hero=id;q.combo=0;q.ego=0;q.samong=0;q.shield=0;q.direction=q.direction||'front';
   stats.heroLocks++;try{if(typeof refreshIcons==='function')refreshIcons();}catch(e){fail(e);}
   try{if(typeof toast==='function')toast('영화 모드 · '+(G(()=>HEROES[id].name,id))+'의 기억',2.2);}catch(_){}
   if(!early)try{if(typeof saveGame==='function')saveGame(false);}catch(_){}return true;}catch(e){fail(e);return false;}finally{switching=null;}})();
 return switching;}
// 영웅별 강화 이어받기(사용자 2026-11-09 12:32Z "레벨은 공유함 영웅이 달라져도", "그전에 모은 패시브 포인트도 공유 영웅바뀌면 그전 영웅 누적 패시브 포인트 따라 자동 스킬업"):
//  레벨·경험치·포인트·공통 강화·오라(R62)는 원래 영웅이 바뀌어도 그대로다. 영웅별로 따로 쌓이는 강화(player.upgrades 의 '영웅:강화' 칸,
//  예: 고유 패시브 진화·고유 잔향)만, 새 영웅의 단계를 앞 영웅 단계까지 올려 준다(낮추지는 않음, 최대 단계 안). 포인트를 새로 쓰지 않는다.
function carry(p,from,to,defs){if(!p||!from||!to||from===to||!p.upgrades||typeof p.upgrades!=='object')return 0;let n=0;
 const maxOf=suffix=>{const d=(defs||[]).find(u=>u&&u.id===suffix);return d&&Number.isFinite(+d.max)?+d.max:Infinity;};
 for(const[k,v]of Object.entries({...p.upgrades})){if(!k.startsWith(from+':'))continue;const suffix=k.slice(from.length+1),nk=to+':'+suffix,want=Math.min(maxOf(suffix),Math.max(0,Math.floor(+v||0)));
  if(want>(Math.floor(+p.upgrades[nk]||0))){p.upgrades[nk]=want;n++;}}
 return n;}
function regionNarrators(id){try{const def=G(()=>regionById[id],null);return (def?.records||[]).map(r=>r?.narrator).filter(Boolean);}catch(_){return[];}}
// 영화 기록이 시작되면 서사에 나오는 영웅들의 그림을 미리 받아 둔다(지역에 들어선 뒤 바뀌기까지 기다리지 않게).
let warmed=false;function warm(){if(warmed||!lockOn())return;warmed=true;setTimeout(async()=>{try{const H=G(()=>HEROES,{}),ids=new Set();for(const r of G(()=>regions,[])||[])for(const rec of r?.records||[]){const h=heroFor(rec?.narrator,H);if(h)ids.add(h);}ids.add('gunner');ids.add('hwando');
  for(const id of ids){if(typeof ensureImages==='function'&&typeof heroPaths==='function')await ensureImages(heroPaths(id)).catch(()=>{});}}catch(e){fail(e);}},3000);}
const modeFor=(key,l)=>/^samong:/.test(String(key))?'samong':((l||G(()=>layer,'STORY'))==='DREAM'?'dream':'story');
function decide(key,narrs){if(!lockOn()||!key||decided.has(key))return;const h=firstHero(narrs,G(()=>HEROES,{}),ALIAS,G(()=>player?.hero,null),modeFor(key));if(!h){if((narrs||[]).length){decided.set(key,null);stats.heroUnmapped++;}return;}
 decided.set(key,h);become(h,key);}
// ── 엔진 연결 ── (잠긴 지역이면 엔진이 쉼터로 돌려보내므로 들어선 뒤 실제 방의 서사를 본다)
try{if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(id,...a){
  // 들어서기 전에 그 지역 영웅으로 미리 바꾸기 시작한다(지도 불러오는 동안 그림을 받음). 못 들어가면 원래 영웅으로 되돌린다.
  let prev=null,pre=null;try{if(lockOn()&&G(()=>regionById[id],null)){pre=firstHero(regionNarrators(id),G(()=>HEROES,{}),ALIAS,G(()=>player?.hero,null),modeFor(id,(a[1]&&a[1].layer)||G(()=>layer,'STORY')));if(pre){prev=G(()=>player?.hero,null);if(prev!==pre)become(pre,id,true);else pre=null;}}}catch(e){fail(e);}
  let r;try{r=await base.call(this,id,...a);}catch(e){if(pre&&prev)become(prev,id,true);throw e;}
  if(r===false&&pre&&prev){try{become(prev,id,true);}catch(e){fail(e);}}
  try{if(r!==false&&lockOn()){const rid=G(()=>room?.id,null)||id,key=zoneKey()||rid;decided.delete(key);decide(key,regionNarrators(rid));}}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
try{if(typeof playScenes==='function'){const base=playScenes;playScenes=function(scenes,...a){
  try{if(lockOn()&&Array.isArray(scenes)&&!scenes.some(s=>/^journal:/.test(String(s?.key||''))))decide(zoneKey(),scenes.map(s=>s?.narrator).filter(Boolean));}catch(e){fail(e);}
  return base.call(this,scenes,...a);};}}catch(e){fail(e);}
try{if(typeof showHeroes==='function'){const base=showHeroes;showHeroes=function(isNew,...a){
  if(!isNew&&run==='cinema'&&prefs.lock){stats.heroBlocked++;try{if(typeof toast==='function')toast('영화 모드에서는 서사에 적힌 기억의 영웅으로만 진행합니다',2.6);}catch(_){}return;}
  return base.call(this,isNew,...a);};}}catch(e){fail(e);}
// 기록 성격: 새 게임은 입구로, 불러오기는 저장값으로.
try{if(typeof newGame==='function'){const base=newGame;newGame=async function(...a){const old=run;run=pending==='cinema'?'cinema':'normal';pending=null;decided.clear();
  turn(false);let result;try{result=await base.apply(this,a);}catch(e){run=old;throw e;}
  if(result===false){run=old;return result;}
  if(run==='cinema'){stats.cinemaStarts++;turn(true);warm();}else stats.normalStarts++;return result;};}}catch(e){fail(e);}
try{if(typeof restoreSave==='function'){const base=restoreSave;restoreSave=async function(raw,...a){const old=run;run=raw?.[FIELD]==='cinema'?'cinema':'normal';pending=null;decided.clear();
  turn(false);let result;try{result=await base.call(this,raw,...a);}catch(e){run=old;throw e;}
  if(result===false){run=old;return result;}
  if(run==='cinema'){stats.restoresCinema++;turn(true);warm();}else stats.restoresNormal++;return result;};}}catch(e){fail(e);}
try{if(typeof serializeSave==='function'){const base=serializeSave;serializeSave=function(...a){const raw=base.apply(this,a);try{if(run==='cinema'&&raw&&typeof raw==='object')raw[FIELD]='cinema';}catch(e){fail(e);}return raw;};}}catch(e){fail(e);}
// ── 처음 화면 입구 ──
function titleChoice(){try{const panel=document.getElementById('panel'),normal=document.getElementById('campaignNew54')||document.getElementById('newBtn');if(!panel||!normal||document.getElementById('cinemaStartR461'))return;
 const action=normal.onclick;if(typeof action!=='function')return;normal.onclick=function(...a){pending=null;return action.apply(this,a);};
 const b=document.createElement('button');b.id='cinemaStartR461';b.type='button';b.textContent='영화 모드로 시작';
 b.title='길잡이가 플레이하고 서사를 자막·음성으로 들려줍니다. 지역마다 서사에 적힌 기억의 영웅으로 진행합니다';
 b.onclick=function(...a){const r=action.apply(normal,a);pending='cinema';return r;};
 const px=document.getElementById('pixelStartR306');if(px&&px.parentNode)px.parentNode.insertBefore(b,px.nextSibling);else (normal.parentNode||panel).appendChild(b);stats.titleButtons++;}catch(e){fail(e);}}
try{if(typeof showTitle==='function'){const base=showTitle;showTitle=function(...a){pending=null;const result=base.apply(this,a);titleChoice();return result;};}}catch(e){fail(e);}
try{if(typeof showMenu==='function'){const base=showMenu;showMenu=function(...a){pending=null;return base.apply(this,a);};}}catch(e){fail(e);}
document.addEventListener?.('click',event=>{if(['slotCancelR73','heroBack','campaignContinue54','continueBtn','campaignImport54','importBtn','slotsBackR73'].includes(event.target?.id))pending=null;},true);
titleChoice();
// ── 설정 칸 ──
try{if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{const c=document.getElementById('r370Cinema');if(c&&!c.dataset.r461){c.dataset.r461='1';
  const label=c.closest('label')||c.parentNode;const note=document.createElement('small');note.id='r461CinemaNote';note.style.cssText='display:block;opacity:.75;margin-left:22px';
  if(run!=='cinema'){c.checked=false;c.disabled=true;note.textContent='영화 모드는 처음 화면의 \'영화 모드로 시작\'으로 따로 진행합니다';}
  else{c.checked=cinemaOn();const own=c.onchange;c.onchange=function(...x){if(c.checked)stats.resumed++;else stats.paused++;return own?.apply(this,x);};note.textContent='영화 모드 기록 · 끄면 잠시 멈추고, 다시 켜면 이어 봅니다';}
  label?.parentNode?.insertBefore(note,label.nextSibling);}}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
function set(p={}){if(typeof p.lock==='boolean')prefs.lock=p.lock;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
window.__STORYWORLD_CINEMA_RUN_R461__=Object.freeze({revision:REV,FIELD,set,
 run:()=>run,active:()=>run==='cinema',
 pure:Object.freeze({speaker,heroFor,firstHero,carry}),
 inspect:()=>({revision:REV,run,pending,prefs:{...prefs},cinemaOn:cinemaOn(),hero:G(()=>player?.hero,null),zone:zoneKey(),decided:Object.fromEntries(decided),stats:{...stats},lastError})});
})();
