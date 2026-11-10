// R450 서사 박자 전투 연출 — 사용자 2026-11-09 09:28Z "서사디테일맞게 전투가이뤄지는 연출강구"
//  보스·중간보스 싸움에서 정본이 그 장면을 말하는 순간(마주침·체력 절반·광폭화·쓰러짐)에 정본 문장 한 줄을 화면 아래에 조용히 띄운다.
//  · 문장은 새로 쓰지 않는다: 아래 BEATS 는 정본(story-canon-r106-data) 지역 문단에서 찾을 '낱말 조각'만 갖고,
//    실제로 보여 주는 글은 그 조각이 들어 있는 정본 문장 전체를 그대로 가져온다(못 찾으면 그 박자는 건너뛴다).
//  · 판정·체력·AI 는 바꾸지 않는다. 싸움 한 번에 박자마다 한 번, 한 줄씩(겹치면 차례대로).
//  · 영화 모드(R370, 음성으로 서사를 읽는 중)·협동·서사 장면·창이 열린 동안에는 띄우지 않는다.
//  · 맘몬의 금고(ep1b06)·눈보라 속의 소년(ep1b06b)은 다른 작업 몫이라 넣지 않는다.
//  · 끄기: localStorage['storyworld.r450.beats']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_BATTLE_BEATS_R450__)return;
const REV='R450-beats-1',KEY='storyworld.r450.beats',HOLD=4.2,FADE=.45;
// [지역, 적 nativeId, 박자, 정본 낱말 조각]  박자: engage(마주침) · half(체력 50% 이하) · enrage(광폭화 또는 30% 이하) · dead(쓰러짐)
const BEATS=Object.freeze([
 ['dist00','dist00-boss','engage','뿌리에 묶인 천사들의 날개만이'],
 ['dist00','dist00-boss','dead','가장 굵은 뿌리를 베자'],
 ['dist01','mb-dist01','engage','여덟 개의 거미 다리'],
 ['dist02','mb-dist02','engage','뿔 끝마다 둥근 것이'],
 ['dist02','mb-dist02','half','베어진 얼굴이 잠깐 사람으로'],
 ['dist06','dist06-boss','engage','발록이 검을 휘두르자'],
 ['dist06','dist06-boss','enrage','발록의 가슴에 공격을 적중'],
 ['ep1a11','a11-boss','engage','흰 날개가 검게 물들고'],
 ['ep1a11','a11-boss','enrage','루시퍼의 가면이 갈라지자'],
 ['ep1b01','mb-ep1b01','engage','갈라진 수면 아래에서 악마의 형상이'],
 ['ep1b02','b02-boss','engage','등줄기에 달라붙은 쓰레기 산이'],
 ['ep1b02','b02-boss','half','소파와 썩은 침대가 연달아'],
 ['ep1b03','b03-boss','engage','유리 조각과 서늘한 칼날이'],
 ['ep1b03','b03-boss','half','코앞까지 파고든 칼날에서'],
 ['ep1b04','b04-boss','engage','식칼과 프라이팬을 마구 던졌다'],
 ['ep1b04','b04-boss','half','거대한 위장처럼 꿈틀거리는'],
 ['ep1b04','b04-boss','dead','베엘제붑이 무너져 내렸다'],
 ['ep1b05','b05-boss','engage','날카로운 칼날을 날렸다'],
 ['ep1b05','b05-boss','half','매혹의 빛이 내 손목에'],
 ['ep1b05','b05-boss','enrage','칼끝이 오히려 내 목을'],
 ['ep1b05','b05-boss','dead','서윤의 등에서 이어진 실을'],
 ['ep1b07','b07-boss','engage','거대한 곰의 모습으로 달려들었다가'],
 ['ep1b07','b07-boss','half','차가운 말이 반복되는 대목마다'],
 ['ep1b07','b07-boss','dead','분노의 귀가 봉인되었다'],
 ['ep1b08','b08-boss','enrage','눈까지 봉인되자'],
 ['ep1b08','b08-boss','dead','기괴한 웃음소리는 멎지 않고'],
 ['ep1b09','b09-boss','engage','죽은 동료들의 형상이 나타났다'],
 ['ep1b09','b09-boss','half','붉은 경고문이 시야에'],
 ['ep1b09','mb-ep1b09','dead','연산핵이 무너지자']]);
const stats={shown:0,missing:0,skipped:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const T=()=>typeof time==='number'?time:performance.now()/1e3;
// 정본 문장 찾기(문장 경계 . ? ! 뒤 공백, 줄바꿈은 띄어쓰기로)
const cache=new Map();
function sentence(zone,needle){const k=zone+'|'+needle;if(cache.has(k))return cache.get(k);let out=null;
 try{const z=window.__STORYWORLD_STORY_CANON_R106__?.zones?.[zone];if(z)for(const b of z.blocks||[])for(const p of b.paras||[]){const flat=String(p).replace(/\s*\n\s*/g,' ');if(!flat.includes(needle))continue;
  for(const s of flat.split(/(?<=[.?!…])\s+/))if(s.includes(needle)){out=s.trim();break;}if(out)break;}}catch(e){fail(e);}
 if(!out)stats.missing++;cache.set(k,out);return out;}
const byKey=new Map();for(const b of BEATS){const k=b[0]+'|'+b[1];if(!byKey.has(k))byKey.set(k,[]);byKey.get(k).push(b);}
// 화면 한 줄
let el=null;function box(){if(el&&el.isConnected)return el;el=document.createElement('div');el.id='r450Beat';el.setAttribute('aria-live','polite');
 el.style.cssText='position:fixed;left:50%;bottom:25vh;transform:translateX(-50%);max-width:min(62vw,760px);padding:6px 18px;pointer-events:none;z-index:40;'+
  'font:500 15px/1.55 "Noto Serif KR","Nanum Myeongjo",serif;color:rgba(232,226,214,.92);text-align:center;word-break:keep-all;text-wrap:balance;letter-spacing:.01em;'+
  'text-shadow:0 1px 2px rgba(0,0,0,.95),0 0 12px rgba(0,0,0,.85);background:radial-gradient(ellipse at center,rgba(6,4,6,.55) 0%,rgba(6,4,6,0) 72%);opacity:0;transition:opacity .45s ease';
 if(matchMedia?.('(max-width:720px)')?.matches){el.style.fontSize='13px';el.style.maxWidth='86vw';el.style.bottom='30vh';}
 document.body.appendChild(el);return el;}
const queue=[];let cur=null;const QMAX=6;// 줄 대기는 6초까지만(쓰러짐 뒤 서사 장면이 같은 문장을 이미 보여 주면 다시 띄우지 않게)
function blockedNow(){try{if(typeof storyScene!=='undefined'&&storyScene)return true;if(typeof modal!=='undefined'&&modal)return true;
 if(window.__STORYWORLD_CINEMA_MODE_R370__?.prefs?.()?.on)return true;if(window.__STORYWORLD_SURVIVAL_R600__?.here?.())return true;/* R600 무한 생존: 자기 서사 자막이 흐르므로 겹치지 않게 */const co=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();if(co&&co!=='off')return true;
 if(typeof layer!=='undefined'&&layer!=='STORY')return true;}catch(_){}return false;}
function show(text){const b=box();b.textContent=text;b.style.opacity='1';cur={until:T()+HOLD+Math.min(2.4,text.length*.03)};stats.shown++;}
function pump(){const t=T();if(cur&&t>=cur.until){if(el)el.style.opacity='0';cur=null;return;}
 while(queue.length&&t-queue[0].at>QMAX)queue.shift();if(!cur&&queue.length&&!blockedNow())show(queue.shift().text);}
const seen=new WeakMap();
function fire(e,beat){let s=seen.get(e);if(!s){s=new Set();seen.set(e,s);}if(s.has(beat[2]))return;s.add(beat[2]);
 if(blockedNow()){stats.skipped++;return;}const text=sentence(beat[0],beat[3]);if(!text)return;if(queue.length<2)queue.push({text,at:T()});}
const live=e=>e&&e.hp>0&&!e.deadRecorded&&e.spawnState==='active';
function scan(){if(!on||typeof room==='undefined'||!room||typeof player==='undefined'||!player)return;const rows=[];
 for(const e of room.enemies||[]){if(!e||!(e.boss||e.midboss)||e.r61Clone||e.r61Summoned)continue;const list=byKey.get(room.id+'|'+e.nativeId);if(!list)continue;
  const f=Math.max(0,Number(e.hp)||0)/Math.max(1,Number(e.maxHp)||1),near=Math.hypot(player.x-e.x,player.y-e.y)<9,fight=!!room.engaged||f<.999;// 싸움 시작 = 제단으로 보스전을 열었거나(room.engaged) 이미 맞기 시작함

  for(const b of list){const ph=b[2];
   if(ph==='dead')continue;
   if(!live(e))continue;
   if(ph==='engage'&&near&&fight)fire(e,b);
   else if(ph==='half'&&f<=.5)fire(e,b);
   else if(ph==='enrage'&&(e.r205Enraged||f<=.3))fire(e,b);}
  // 쓰러짐 박자는 싸움을 실제로 한 적에게만(이미 죽은 채 들어온 지역에서 띄우지 않게)
  if(live(e)&&fight&&near&&!fought.includes(e)&&list.some(b=>b[2]==='dead'))fought.push(e);}
 for(let i=fought.length-1;i>=0;i--){const e=fought[i];if(live(e))continue;fought.splice(i,1);if(e.hp<=0||e.deadRecorded)for(const b of byKey.get(room.id+'|'+e.nativeId)||[])if(b[2]==='dead')fire(e,b);}}
const fought=[];
let lastRoom=null;
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);
 try{if(typeof started!=='undefined'&&started&&!(typeof loading!=='undefined'&&loading)){if(typeof room!=='undefined'&&room!==lastRoom){lastRoom=room;queue.length=0;fought.length=0;cur=null;if(el)el.style.opacity='0';}scan();pump();}}catch(e){fail(e);}return r;};}
function set(o){if(o&&typeof o.on==='boolean'){on=o.on;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}if(!on){queue.length=0;cur=null;if(el)el.style.opacity='0';}}return{on};}
window.__STORYWORLD_BATTLE_BEATS_R450__=Object.freeze({revision:REV,BEATS,sentence,set,
 resolveAll:()=>BEATS.map(b=>({zone:b[0],enemy:b[1],beat:b[2],text:sentence(b[0],b[3])})),
 inspect:()=>({revision:REV,on,queue:queue.length,showing:!!cur,stats:{...stats},lastError})});
})();
