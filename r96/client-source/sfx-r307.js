// R307 — CC0 효과음(사용자 2026-11-04 "무료이면서 상업적 용도로 쓸 수 있는 효과음·에셋 자산을 찾아 적절하게 적용").
//  자산: OpenGameArt 의 CC0 묶음(Kenney 50 RPG sound effects·Interface Sounds, artisticdude RPG Sound Pack)에서 고른 18개.
//  출처·라이선스·원본 sha256 은 assets/r307/sfx/index.json, 크레딧은 SFX_CREDITS.md 와 설정 창 '효과음 크레딧'.
//  · 기존 파일 효과음(공격·피격·스킬·보스 등 sound())은 그대로 두고, 소리가 없던 이벤트만 채운다:
//    문 열림, 쪽지 얻음(종이 넘김)·쪽지 창 닫기, 버튼 클릭·닫기, 줍기(pickup 프로필이 비었을 때만), 제단(지역 완료), 몹 사망, 주인공 사망.
//  · 음량은 기존 효과음 스위치·음량(settings.sound·settings.volume), 기존 오디오 문맥(audioContext→masterGain)을 쓴다.
//    오디오가 아직 풀리지 않았으면(모바일 첫 터치 전) 아무것도 틀지 않는다. BGM(HTMLAudio)·내레이션은 건드리지 않는다.
//  · 동시 재생 3개, 이벤트별 최소 간격. 설정 창 'CC0 효과음' 켜기/끄기('storyworld.r307.sfx' {on}).
//  · 런타임 외부 API 호출 없음 — 저장소 안 파일만 읽는다.
(()=>{'use strict';
if(window.__STORYWORLD_SFX_R307__)return;
const REV='R307-cc0-sfx',DIR='assets/r307/sfx/',KEY='storyworld.r307.sfx',MAX=3;
const EVENTS=Object.freeze({
 door:{files:['door-open-1','door-open-2'],gain:.55,gap:.6},
 page:{files:['page-flip-1','page-flip-2','page-flip-3'],gain:.5,gap:.25,modal:true},
 pageClose:{files:['book-close-1'],gain:.45,gap:.3,modal:true},
 ui:{files:['ui-click-1','ui-click-2'],gain:.3,gap:.07,modal:true},
 uiBack:{files:['ui-back-1'],gain:.3,gap:.07,modal:true},
 pickup:{files:['pickup-1','pickup-2'],gain:.45,gap:.2},
 altar:{files:['altar-1'],gain:.55,gap:2,modal:true},
 enemyDeath:{files:['enemy-death-shade-1','enemy-death-shade-2','enemy-death-beast-1','enemy-death-beast-2'],gain:.36,gap:.18},
 playerDeath:{files:['player-death-1','player-death-2'],gain:.6,gap:2,modal:true,all:true}
});
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
/* 엔진 전역(let·function)은 window 에 안 붙으므로 이름표로 읽는다 */
const V={audioContext:()=>audioContext,masterGain:()=>masterGain,audioUnlocked:()=>audioUnlocked,settings:()=>settings,modal:()=>modal,room:()=>room,soundProfiles:()=>soundProfiles};
const G=(n,d)=>{try{const v=V[n]();return v===undefined?d:v;}catch(_){return d;}};
const stats={requested:0,played:0,muted:0,throttled:0,capped:0,decodeErrors:0,byEvent:{}},audit=[],live=[],buffers=new Map(),loading=new Map(),next={},serial={};let lastError=null,bus=null,busCtx=null;
const log=r=>{audit.push({...r,at:performance.now()|0});if(audit.length>64)audit.shift();};
function ctx(){return G('audioContext',null);}
function audible(ev){const s=G('settings',null),c=ctx();if(!prefs.on)return 'off';if(!s?.sound||!(s.volume>0))return 'sound-off';if(!G('audioUnlocked',false)||!c||c.state!=='running')return 'locked';if(document.hidden)return 'hidden';if(G('modal',false)&&!EVENTS[ev].modal)return 'modal';return '';}
function load(id){if(buffers.has(id))return Promise.resolve(buffers.get(id));if(loading.has(id))return loading.get(id);const c=ctx();
 const p=fetch(DIR+id+'.ogg').then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.arrayBuffer();}).then(a=>new Promise((ok,no)=>c.decodeAudioData(a,ok,no))).then(b=>{buffers.set(id,b);loading.delete(id);return b;}).catch(e=>{stats.decodeErrors++;lastError=String(e?.message||e).slice(0,160);loading.delete(id);return null;});
 loading.set(id,p);return p;}
function out(c){if(bus&&busCtx===c)return bus;const m=G('masterGain',null);bus=c.createGain();bus.gain.value=.8;bus.connect(m||c.destination);busCtx=c;return bus;}
async function play(ev){const def=EVENTS[ev];if(!def)return false;stats.requested++;const row=stats.byEvent[ev]||(stats.byEvent[ev]={requested:0,played:0});row.requested++;
 const why=audible(ev);if(why){stats.muted++;log({ev,result:'muted:'+why});return false;}
 const now=performance.now()/1000;if(now<(next[ev]||0)){stats.throttled++;return false;}next[ev]=now+def.gap;
 const ids=def.all?def.files:[def.files[(serial[ev]=(serial[ev]||0)+1)%def.files.length]];
 for(const id of ids){const b=await load(id),c=ctx();if(!b||!c||audible(ev))continue;
  while(live.length>=MAX){const v=live.shift();stats.capped++;try{v.stop();}catch(_){}}
  const s=c.createBufferSource(),g=c.createGain(),vol=Math.max(0,Math.min(1,G('settings',{}).volume??1))*def.gain;g.gain.value=vol;s.buffer=b;s.connect(g);g.connect(out(c));
  live.push(s);s.onended=()=>{const i=live.indexOf(s);if(i>=0)live.splice(i,1);try{s.disconnect();g.disconnect();}catch(_){}};s.start();stats.played++;row.played++;log({ev,id,result:'played',vol:+vol.toFixed(3)});}
 return true;}
function stopAll(){for(const v of live.splice(0)){try{v.stop();}catch(_){}}}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAll();});

// ---- 이벤트 연결: 엔진 전역 함수 감싸기 + 매 tick 상태 비교 ----
const hooked={};const fail=e=>{lastError=String(e?.message||e).slice(0,160);};
try{if(typeof showDeath==='function'){const base=showDeath;showDeath=function(...a){play('playerDeath');return base.apply(this,a);};hooked.showDeath=true;}}catch(e){fail(e);}
try{if(typeof completeRegion==='function'){const base=completeRegion;completeRegion=function(...a){play('altar');return base.apply(this,a);};hooked.completeRegion=true;}}catch(e){fail(e);}
try{if(typeof sound==='function'){const base=sound;sound=function(kind,...a){try{if(kind==='pickup'&&!(G('soundProfiles',{}).pickup||[]).length)play('pickup');}catch(_){}return base.call(this,kind,...a);};hooked.sound=true;}}catch(e){fail(e);}
try{if(typeof closePanel==='function'){const base=closePanel;closePanel=function(...a){if(noteOpen){noteOpen=false;play('pageClose');}return base.apply(this,a);};hooked.closePanel=true;}}catch(e){fail(e);}
try{if(typeof tick==='function'){const base=tick;tick=function(dt){let before=[];try{before=(room?.enemies||[]).slice();}catch(_){}const r=base.apply(this,arguments);try{watch(before);}catch(e){fail(e);}return r;};hooked.tick=true;}}catch(e){fail(e);}
let noteOpen=false,seenRoom=null,doorCount=0,bookCount=-1;const hpSeen=new WeakMap();
function watch(before){/* before: tick 전 몹 목록 — 엔진이 죽은 몹을 tick 안에서 목록에서 빼므로 그 전 사본으로 본다 */const room=G('room',null);if(!room)return;const W=window.__STORYWORLD_WORLD_R74__,P=window.__STORYWORLD_PLAY_R169__;
 const doors=(()=>{try{return W?.openedFor?.(room.id,room.layer)?.length||0;}catch(_){return 0;}})(),book=(()=>{try{return P?.book?.()?.length??0;}catch(_){return 0;}})();
 if(room!==seenRoom){seenRoom=room;doorCount=doors;for(const e of room.enemies||[])hpSeen.set(e,e.hp);}
 else{if(doors>doorCount)play('door');doorCount=doors;let died=false;for(const e of new Set([...(before||[]),...(room.enemies||[])])){const was=hpSeen.get(e);if(was>0&&!(e.hp>0)&&!died){died=true;play('enemyDeath');}hpSeen.set(e,e.hp);}}
 if(bookCount>=0&&book>bookCount){noteOpen=true;play('page');}bookCount=book;}
document.addEventListener('click',e=>{const b=e.target?.closest?.('button');if(!b)return;play(/닫기|돌아가|취소|close|back/i.test((b.id||'')+' '+(b.textContent||''))?'uiBack':'ui');},true);

// ---- 설정 창: 켜기/끄기 + 효과음 크레딧 ----
function set(on){prefs.on=!!on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}if(!prefs.on)stopAll();}
function credits(){fetch(DIR+'index.json').then(r=>r.json()).then(j=>{const box=document.createElement('div');box.id='r307Credits';box.style.cssText='position:fixed;inset:6% 8%;z-index:9999;overflow:auto;background:rgba(14,10,12,.96);color:#e8dcc8;border:1px solid #6b3a3a;border-radius:8px;padding:18px 20px;font:14px/1.6 serif';
 const by=new Map();for(const f of j.files){const k=f.source;if(!by.has(k))by.set(k,{author:f.author,license:f.license,n:0});by.get(k).n++;}
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 box.innerHTML='<h3 style="margin:0 0 8px">효과음 크레딧</h3><p style="opacity:.8;margin:0 0 10px">모두 CC0(퍼블릭 도메인) 녹음입니다. 표시 의무는 없지만 고마움을 적습니다.</p><ul style="padding-left:20px">'+[...by].map(([u,r])=>'<li>'+esc(r.author)+' · '+esc(r.license)+' · '+r.n+'개 · '+esc(u)+'</li>').join('')+'</ul><button id="r307CreditsClose">닫기</button>';
 document.body.appendChild(box);document.getElementById('r307CreditsClose').onclick=()=>box.remove();}).catch(e=>{lastError=String(e);});}
try{if(typeof showSettings==='function'){const base=showSettings;hooked.showSettings=true;showSettings=function(...a){const r=base.apply(this,a);try{const grid=document.querySelector('#panel .settings')||document.querySelector('.settings')||document.getElementById('panel');if(grid&&!document.getElementById('r307On')){
 const l=document.createElement('label');l.innerHTML='<input type="checkbox" id="r307On"> CC0 효과음(문·쪽지·클릭·사망)';grid.appendChild(l);const c=l.querySelector('input');c.checked=prefs.on;c.onchange=()=>set(c.checked);
 const b=document.createElement('button');b.id='r307CreditsBtn';b.textContent='효과음 크레딧';b.onclick=credits;grid.appendChild(b);}}catch(e){fail(e);}return r;};}}catch(e){fail(e);}

window.__STORYWORLD_SFX_R307__=Object.freeze({revision:REV,EVENTS,MAX,set,play,credits,inspect:()=>({revision:REV,prefs:{...prefs},hooked:{...hooked},stats:{...stats,byEvent:JSON.parse(JSON.stringify(stats.byEvent))},active:live.length,cached:buffers.size,audit:[...audit],lastError,runtimeApiCalls:false,listeningVerified:false})});
})();
