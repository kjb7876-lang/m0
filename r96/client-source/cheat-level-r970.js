// R970 — 777 개발자 시험 모드: 레벨 입력 → 레벨 규칙대로 스킬 포인트(사용자 2026-11-13
//  "777코드사용하면 이제 레벨을 적는칸이 나오고 레벨에따라 스킬포인트가 지급되는구조로 바꿔줘 777은 개발자테스트모드라서").
//  ① 코드 창에 777 을 적으면 '레벨(1~99)' 칸이 나온다. 적용하면 그 레벨이 되고, 일반 진행과 같은 규칙
//     (R62: 새 영웅 Lv.1·포인트 1, 레벨이 1 오를 때마다 포인트 +1)으로 지금 레벨과의 차이만큼 포인트를 받는다.
//     레벨을 낮추면 남은 포인트에서 차이만큼 빼되 0 아래로는 안 내려간다(이미 배운 기술은 그대로).
//  ② 이 모드에서는 예전 777 처럼 레벨 99·기술 상한을 강제로 채우지 않는다. 포인트로 직접(자동 스킬레벨업 포함) 성장한다.
//     index.html 777 블록은 지역 이동·저장·불러오기 때마다 applyCaps(레벨 99·상한)를 부르므로, 그 세 길을 바깥에서 감싸
//     부르기 전 레벨·경험치·기술 단계를 기억했다가 되돌린다. 777 저장본에는 cheat777.levelR970 으로 남긴다.
//  ③ 레벨 없이 부르는 예전 API(__STORYWORLD_CHEAT777__.activate('777'))와 R970 기록이 없는 예전 777 저장은 예전 방식 그대로.
//  레벨 범위 1~99 = 777 블록 LEVEL_CAP 과 일반 gainXP 상한. 새 키·자산·서사 변화 없음. 일반 저장은 건드리지 않는다(777 은 별도 슬롯).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_CHEAT_LEVEL_R970__)return;
const REV='R970-cheat-level-1',MIN=1,MAX=99,PER_LEVEL=1,START_POINTS=1;
const C=()=>window.__STORYWORLD_CHEAT777__,on=()=>{try{return C()?.active?.()===true;}catch(_){return false;}};
const P=()=>typeof player==='object'&&player?player:null;
const copy=v=>JSON.parse(JSON.stringify(v));
const stats={set:0,kept:0,rejected:0,restored:0,errors:0};let chosen=null,lastError=null,pendingSnap=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
const pointsFor=l=>START_POINTS+PER_LEVEL*(l-1);
function parseLevel(v){const s=typeof v==='number'?v:String(v??'').trim();if(s===''||s===null)return null;const x=Number(s);if(!Number.isFinite(x))return null;return Math.max(MIN,Math.min(MAX,Math.floor(x)));}
const capOf=k=>{try{const id=String(k).includes(':')?String(k).split(':').pop():String(k);const u=(typeof UPGRADES!=='undefined'?UPGRADES:[]).find(u=>u.id===id);return u&&Number.isSafeInteger(u.max)?u.max:null;}catch(_){return null;}};
function cleanUpgrades(raw){const out={};if(!raw||typeof raw!=='object')return out;for(const [k,v]of Object.entries(raw)){if(!/^[A-Za-z0-9_:.-]{1,80}$/.test(k))continue;const n=Number(v);if(typeof v!=='number'||!Number.isFinite(n)||n<0)continue;const cap=capOf(k);out[k]=Math.floor(cap==null?n:Math.min(cap,n));}return out;}
const take=()=>{const p=P();return p?{level:p.level,xp:p.xp,upgrades:copy(p.upgrades||{})}:null;};
function put(s){const p=P();if(!p||!s)return;p.level=s.level;p.xp=s.xp;if(!p.upgrades||typeof p.upgrades!=='object')p.upgrades={};for(const k of Object.keys(p.upgrades))delete p.upgrades[k];Object.assign(p.upgrades,copy(s.upgrades||{}));try{if(typeof maxHP==='function'&&Number.isFinite(p.hp))p.hp=Math.min(p.hp,maxHP());}catch(_){}}
const keep=()=>chosen!=null&&on();
// ---- 레벨 바꾸기 ----------------------------------------------------------------------------------------
function setLevel(v){const p=P();if(!on()||!p){stats.rejected++;return{ok:false,message:'777 시험 모드가 켜져 있을 때만 레벨을 바꿀 수 있습니다.'};}
 const l=parseLevel(v);if(l==null){stats.rejected++;return{ok:false,message:'레벨은 '+MIN+'~'+MAX+' 사이 숫자로 적어 주세요.'};}
 const from=Math.max(MIN,Math.floor(Number(p.level)||MIN)),delta=pointsFor(l)-pointsFor(from);
 p.level=l;p.xp=0;p.points=Math.max(0,Math.floor(Number(p.points)||0)+delta);chosen=l;stats.set++;
 try{saveGame(false);}catch(e){fail(e);}try{if(typeof updateHUD==='function')updateHUD();}catch(_){}
 return{ok:true,level:l,points:p.points,delta};}
async function activate(code,level){if(String(code??'').trim()!=='777')return{ok:false,message:'코드가 일치하지 않습니다.'};
 if(parseLevel(level)==null){stats.rejected++;return{ok:false,message:'레벨은 '+MIN+'~'+MAX+' 사이 숫자로 적어 주세요.'};}
 if(on())return setLevel(level);
 const snap=take();const r=await C().activate(code);if(!r||!r.ok)return r||{ok:false,message:'777 을 켜지 못했습니다.'};
 put(snap);return setLevel(level);}
// ---- 777 블록의 applyCaps 를 부르는 세 길 감싸기 ------------------------------------------------------------
if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){const s=keep()?take():null;try{return await base.apply(this,a);}finally{if(s&&keep()){put(s);stats.kept++;}}};}
if(typeof saveGame==='function'){const base=saveGame;saveGame=function(...a){if(!keep())return base.apply(this,a);const s=take();pendingSnap=s;try{return base.apply(this,a);}finally{pendingSnap=null;put(s);}};}
if(typeof serializeSave==='function'){const base=serializeSave;serializeSave=function(...a){const d=base.apply(this,a);try{if(keep()&&d&&d.cheat777&&d.cheat777.active===true){const s=pendingSnap||take();d.cheat777.levelR970={version:1,level:s.level,xp:Math.max(0,Math.floor(Number(s.xp)||0)),upgrades:copy(s.upgrades)};}}catch(e){fail(e);}return d;};}
function readSaved(raw){const q=raw&&raw.cheat777&&raw.cheat777.active===true&&raw.cheat777.levelR970;if(!q||q.version!==1||typeof q.level!=='number')return null;const l=parseLevel(q.level);if(l==null)return null;return{level:l,xp:Math.max(0,Math.floor(Number(q.xp)||0)),upgrades:cleanUpgrades(q.upgrades)};}
if(typeof restoreSave==='function'){const base=restoreSave;restoreSave=async function(raw,...a){const s=readSaved(raw),before=chosen;const r=await base.call(this,raw,...a);
 try{if(r!==false){if(s&&on()){chosen=s.level;put(s);stats.restored++;}else chosen=null;}else chosen=before;}catch(e){fail(e);}return r;};}
// 일반 진행 복귀(leave)는 restoreSave(일반 저장)를 거치므로 위에서 chosen=null 이 된다.
// ---- 코드 창 ------------------------------------------------------------------------------------------
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function status(){const p=P();return chosen!=null&&p?'777 사용 중 · Lv.'+p.level+' · 남은 스킬 포인트 '+(Math.floor(Number(p.points)||0))+'점':null;}
function augment(){const input=document.getElementById('story-code-input');if(!input||document.getElementById('r970Level'))return;
 const p=P(),intro=input.parentNode&&[...input.parentNode.querySelectorAll('p')].find(x=>/777은/.test(x.textContent||''));
 if(intro)intro.textContent='777은 개발자 시험 모드입니다. 레벨을 적으면 일반 진행과 같은 규칙(레벨이 1 오를 때마다 스킬 포인트 1점)으로 포인트를 받습니다. 일반 저장과 분리됩니다.';
 const apply=document.getElementById('codeApply');if(!apply)return;
 apply.insertAdjacentHTML('afterend','<div id="r970LevelRow" class="r970-level"'+(on()?'':' hidden')+'><label for="r970Level">레벨 ('+MIN+'~'+MAX+')</label><input id="r970Level" type="number" inputmode="numeric" min="'+MIN+'" max="'+MAX+'" step="1" autocomplete="off" value="'+esc(p?Math.max(MIN,Math.min(MAX,Math.floor(Number(p.level)||1))):1)+'" style="font-size:18px;width:90px;margin:8px"/>'+(on()?'<button id="r970LevelApply">레벨 적용</button>':'')+'<p class="small">레벨 '+MIN+' = 포인트 '+pointsFor(MIN)+'점, 레벨이 1 오를 때마다 +'+PER_LEVEL+'점(일반 진행과 같음). 낮추면 남은 포인트에서 뺍니다.</p></div>');
 const row=document.getElementById('r970LevelRow'),lv=document.getElementById('r970Level'),msg=()=>document.getElementById('codeMessage');
 const st=status();if(st&&msg())msg().textContent=st;
 const sync=()=>{if(row)row.hidden=!(on()||String(input.value).trim()==='777');};input.addEventListener('input',sync);sync();
 const run=async()=>{try{const r=on()?setLevel(lv.value):await activate(input.value,lv.value);if(r&&r.ok){if(on()&&C()?.panel)C().panel();const m=msg();if(m)m.textContent=status()||m.textContent;}else{const m=msg();if(m)m.textContent=(r&&r.message)||'적용하지 못했습니다.';}}catch(e){fail(e);const m=msg();if(m)m.textContent='적용 실패: '+(e&&e.message||e);}};
 lv.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();run();}});lv.addEventListener('keyup',e=>e.stopPropagation());
 // 777 을 적은 뒤 적용(코드 칸 Enter 포함)은 레벨과 함께 켠다. 다른 코드는 예전 처리(메시지)를 그대로 탄다.
 const old=apply.onclick;apply.onclick=e=>{if(String(input.value).trim()==='777'||on())return run();return old&&old.call(apply,e);};
 const la=document.getElementById('r970LevelApply');if(la)la.onclick=()=>run();}
if(typeof openPanel==='function'){const base=openPanel;openPanel=function(...a){const r=base.apply(this,a);try{if(typeof a[0]==='string'&&a[0].includes('story-code-input'))Promise.resolve().then(()=>{try{augment();}catch(e){fail(e);}});}catch(e){fail(e);}return r;};}
window.__STORYWORLD_CHEAT_LEVEL_R970__=Object.freeze({rev:REV,activate,setLevel,pointsFor,parseLevel,range:[MIN,MAX],inspect:()=>({rev:REV,chosen,active:on(),stats:{...stats},lastError})});
})();
