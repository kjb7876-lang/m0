// R370 — 영화 모드(사용자 2026-11-06 "길잡이처럼 알아서 플레이하고 서사를 영화보듯이 자막+오디오음성으로 계속 나오게하여
//  플레이타임과 얼추 맞춰서 서사가 끝나게" → 결정 카드 "1단계 요약본").
//  · 켜면 길잡이가 플레이하고, '계속'을 눌러야 넘어가던 서사 창을 띄우지 않는다. 그 장면 글은 화면 아래 자막과
//    브라우저 음성(SpeechSynthesis, 한국어 음성)으로 흐르고, 플레이는 멈추지 않는다.
//  · 요약본: 문장을 새로 쓰지 않고 원문 문장을 골라 읽는다(발췌 요약). 장면 첫 문장·끝 문장·문단 첫 문장·대사를 먼저 고르고,
//    그 지역에서 길잡이가 머물 것으로 보는 시간 안에 들어가는 만큼만 읽는다. 장면 원문 전체는 쪽지 모음(R169)에 그대로 기록한다.
//  · 지역마다 맞추기: 서사가 남으면 말 속도를 올리고(최대 1.3배) 문장 사이 쉼을 줄인다. 새 장면이 오면 아직 못 읽은 옛 문장 중
//    덜 중요한 것을 덜어 낸다. 서사가 먼저 끝나면 쉼을 늘리고 배경음악만 흐른다. 지역을 떠날 때 고른 문장이 25초(1.3배속 기준) 넘게 남았으면
//    길잡이가 출구에서 최대 40초 머문다. 마지막 장(최종장·엔딩)은 시간 제한 없이 끝까지 읽는다.
//  · 지역마다 실제로 머문 시간을 이 기기에 배워 다음 관람의 맞추기에 쓴다(localStorage storyworld.r370.zoneTimes).
//  · 음성이 없는 브라우저는 자막만 글 길이에 맞춰 흐른다. 진행 규칙·전투·저장·읽음 기록은 엔진 그대로(advanceScene 을 거듭 불러 넘김).
//  · R376 말 속도: 맞추기 범위를 0.84~1.12배로 낮추고(전보다 천천히), 시간 제한 없는 마지막 장은 0.9배. 문장 결(tone)로 높낮이·빠르기·쉼을 바꿔 회상 내레이션처럼.
//  · R376 실화 난이도: 실화 지역은 전투가 길어지므로 지역 시간 예측을 실화 배율(timeMul, 1.8배)로 늘리고, 머문 시간은 'real:' 열쇠로 따로 배운다.
//    덜어 낸 문장은 버리지 않고 예비로 두었다가, 대기열이 비었는데 그 지역에 살아 있는 적이 남아 있으면 (남은 예상 시간, 적어도 45초 분량만큼) 원래 순서대로 다시 채워
//    전투 중에도 자막·음성이 끊기지 않게 한다(지역을 옮기면 예비는 비운다).
//  · R381 녹음 음성: 문장마다 녹음(voice-r381, Qwen3-TTS Sohee)이 있으면 그걸 틀고(말 속도는 재생 속도 0.85~1.2배로), 없거나 못 받으면 브라우저 음성.
//  · R384 말 빠르기 일정: 문장마다 빠르기를 바꾸지 않고 늘 설정 배율×0.95. 남은 서사 시간(remainingSecs)을 밖에 알려 전투가 그 시간에 맞춘다(cinema-sync-r384).
//  · 설정 '영화 모드' 줄(목소리 고르기·시험 듣기). localStorage storyworld.r370.cinema {on, voice, subs, rate}.
(()=>{'use strict';
if(window.__STORYWORLD_CINEMA_MODE_R370__)return;
const REV='R370-cinema-4',KEY='storyworld.r370.cinema',TKEY='storyworld.r370.zoneTimes';
const DEF={on:false,voice:'',subs:true,rate:1};
let prefs={...DEF};try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');if(s&&typeof s==='object'){if(typeof s.on==='boolean')prefs.on=s.on;if(typeof s.voice==='string')prefs.voice=s.voice;if(typeof s.subs==='boolean')prefs.subs=s.subs;if(Number.isFinite(+s.rate))prefs.rate=Math.max(.8,Math.min(1.3,+s.rate));}}catch(_){}
let learned={};try{const t=JSON.parse(localStorage.getItem(TKEY)||'{}');if(t&&typeof t==='object')for(const[k,v]of Object.entries(t))if(Number.isFinite(+v)&&+v>5&&+v<7200)learned[k]=+v;}catch(_){}
const stats={recorded:0,recordFail:0,batches:0,scenes:0,sentences:0,kept:0,dropped:0,spoken:0,silent:0,lingers:0,guideResumed:0,fragments:0,refilled:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const now=()=>performance.now()/1000;
// 엔진 전역(let)은 모든 고전 스크립트가 함께 보므로 이름으로 바로 읽는다(아직 없으면 기본값).
const ENV={room:()=>room,regionById:()=>regionById,loading:()=>loading,started:()=>started,modal:()=>modal,guide:()=>guide,storyScene:()=>storyScene,settings:()=>settings};
const G=(n,d)=>{try{const v=ENV[n]();return v===undefined?d:v;}catch(_){return d;}};
function guideOn(){try{guide=true;auto=true;guideTimer=0;}catch(e){fail(e);}}
const journal=s=>/^journal:/.test(String(s?.key||''));
const REFILL_MIN=45,CPS0=6.8,MIN_H=50,LINGER_MAX=40;
const DEFAULT_SEC={rest:45,combat:120,samong:180};// 첫 관람 기본값(헤드리스 길잡이 dist00 ≈ 게임 60초). 실제 머문 시간을 배우면 그 값을 쓴다
// ── 순수 함수(QA 가 CPU 에서 부른다) ──
// 문장 나누기: 문단(빈 줄) → 문장 끝(. ? ! … 。 뒤, 닫는 따옴표 포함)에서 자른다.
function sentences(text){const out=[];String(text||'').split(/\n\s*\n/).forEach((para,pi)=>{const p=para.replace(/\s+/g,' ').trim();if(!p)return;
 const parts=p.match(/[^.?!…。]+(?:[.?!…。]+["”’」』)]*|$)/g)||[p];let si=0;for(const raw of parts){const t=raw.trim();if(!t)continue;out.push({text:t,para:pi,first:si===0});si++;}});
 return out;}
// 문장 점수: 장면 첫·끝 문장은 꼭(must), 문단 첫 문장·대사·이름이 든 문장은 높게.
const NAMES=/미카엘라|윤서하|환도|에고|EGO|이드|ID|장민재|한이경|교주|사몽|합일/;
function score(s,i,n){let v=1;if(s.first)v+=1.2;if(/["“”「」『』]/.test(s.text))v+=.8;if(NAMES.test(s.text))v+=.5;if(i===n-1)v+=1;const L=s.text.length;if(L<12)v-=.6;else if(L>140)v-=.4;v-=i/Math.max(1,n)*.3;return v;}
// 고르기: must 는 늘 넣고, 나머지는 점수 높은 순으로 cap(글자 수)까지. 순서는 원래대로.
function select(items,cap){const keep=new Set();let used=0;for(const it of items)if(it.must){keep.add(it);used+=it.len;}
 const rest=items.filter(it=>!it.must).sort((a,b)=>b.score-a.score||a.order-b.order);
 for(const it of rest){if(used+it.len<=cap){keep.add(it);used+=it.len;}}
 return {kept:items.filter(it=>keep.has(it)),used};}
// 말 속도(R384, 사용자 2026-11-07 "음성속도를 조금더 일정하게"): 남은 시간에 맞춰 문장마다 빠르기를 바꾸던 것(R370 rateFor)을 없애고
//  늘 같은 빠르기(설정 배율 × 0.95)로 읽는다. 시간 맞추기는 이제 전투 쪽(cinema-sync-r384 이 적 방어력을 올리고 내림)이 한다.
const STEADY=.95;
const steadyRate=(user=1)=>clamp(clamp(+user||1,.8,1.3)*STEADY,.8,1.2);
// 회상 내레이션 결(R376): 서술은 낮게, 따옴표 대사는 조금 높게, 물음·느낌표는 살짝 올린다(브라우저 음성의 높낮이). 말줄임 뒤·장면 끝에는 쉼을 더 둔다.
//  R384: 빠르기는 문장마다 바꾸지 않는다(일정하게) — tone 은 높낮이·쉼만 준다.
const GAP=.55,GAP_END=1.35;
function tone(text,sceneEnd){const t=String(text||'');let pitch=.94;const quote=/^["“「『]/.test(t)||/["”」』]$/.test(t);
 if(quote)pitch=1.04;if(/…\s*["”」』]?$|\.\.\.\s*$/.test(t))pitch-=.03;else if(/[?？!！]\s*["”」』]?$/.test(t))pitch+=.03;
 return {pitch:clamp(pitch,.85,1.1),pause:(sceneEnd?GAP_END:GAP)+(/…\s*["”」』]?$/.test(t)?.35:0)};}
// 자막 조각: 두 줄(약 84자)을 넘으면 쉼표·띄어쓰기에서 나눈다.
function chunks(t,max=84){const out=[];let s=String(t);while(s.length>max){let cut=s.lastIndexOf(', ',max);if(cut<max*.45)cut=s.lastIndexOf(' ',max);if(cut<max*.45)cut=max;out.push(s.slice(0,cut+1).trim());s=s.slice(cut+1).trim();}if(s)out.push(s);return out;}
function isFinal(scenes){return scenes.some(s=>/finale|ending|epilog|엔딩/i.test(String(s?.key||''))||/엔딩|최종장/.test(String(s?.title||s?.chapter||'')));}
// ── 지역 시간 ──
const realMul=()=>{try{const m=Number(window.__STORYWORLD_REAL_MODE_R376__?.timeMul?.());return Number.isFinite(m)&&m>=1?Math.min(3,m):1;}catch(_){return 1;}};
const zoneKey=()=>{try{const r=G('room',null);if(!r)return'';const k=r.samongR115?.zone?('samong:'+r.samongR115.zone):(r.id||'');return k&&realMul()>1?'real:'+k:k;}catch(_){return'';}};
function estimate(k){if(learned[k])return learned[k];const real=/^real:/.test(k),b=String(k).replace(/^real:/,''),m=real?realMul():1;
 try{if(real&&learned[b])return learned[b]*m;const r=G('room',null),def=G('regionById',{})?.[r?.id];if(/^samong:/.test(b))return DEFAULT_SEC.samong*m;if(def?.safe)return DEFAULT_SEC.rest;}catch(_){}return DEFAULT_SEC.combat*m;}
let zone={key:'',t0:now(),active:0,last:now()};
function tickZone(){const k=zoneKey(),t=now(),dt=Math.min(1,t-zone.last);zone.last=t;
 const paused=document.hidden||G('loading',false)||!G('started',false);if(!paused)zone.active+=dt;
 if(k&&k!==zone.key){if(zone.key&&prefs.on&&zone.active>8){const o=learned[zone.key];learned[zone.key]=o?o*.5+zone.active*.5:zone.active;try{localStorage.setItem(TKEY,JSON.stringify(learned));}catch(_){}}
  zone={key:k,t0:t,active:0,last:t};reserve.length=0;}}
const remainingInZone=()=>Math.max(0,estimate(zone.key)-zone.active);
// ── 대기열·음성 ──
const Q=[],reserve=[];let cur=null,deadline=null,cps=CPS0,order=0,timer=null,gen=0;
const pendingChars=()=>Q.reduce((s,q)=>s+q.len,0)+(cur?cur.len*.5:0);
const backlogSecs=()=>pendingChars()/(cps*steadyRate(prefs.rate));
// 남은 서사 시간(초): 남은 글자 ÷ 말 빠르기 + 문장 사이 쉼. R384 전투 맞추기가 읽는다.
const remainingSecs=()=>backlogSecs()+Q.length*GAP+(Q.length||cur?GAP_END:0);
function voices(){try{return (speechSynthesis.getVoices()||[]).filter(v=>/^ko/i.test(v.lang));}catch(_){return[];}}
function pickVoice(){const vs=voices();if(prefs.voice==='none')return null;return vs.find(v=>v.name===prefs.voice)||vs.find(v=>/natural|online|neural/i.test(v.name))||vs[0]||null;}
function vol(){try{const s=G('settings',{});return clamp(Number.isFinite(+s.voice)?+s.voice:.8,0,1);}catch(_){return .8;}}
function enqueue(scenes){const final=isFinal(scenes);stats.batches++;
 // 옛 문장은 '지난 것'으로 점수를 깎는다(must 는 그대로).
 for(const q of Q)q.score-=.8;
 const fresh=[];for(const s of scenes){stats.scenes++;const ss=sentences(s.text);const narr=String(s.narrator||'').replace(/[〈〉<>]/g,'').trim();
  ss.forEach((x,i)=>{fresh.push({text:x.text,len:x.text.length,narr,title:s.title||'',must:i===0||(final),score:score(x,i,ss.length),order:order++,sceneEnd:i===ss.length-1,final});});}
 stats.sentences+=fresh.length;
 const all=Q.concat(fresh);const horizon=final?Infinity:Math.max(MIN_H,remainingInZone());
 const cap=final?Infinity:horizon*cps*clamp(prefs.rate,.8,1.3)*1.12;
 const {kept}=select(all,cap);stats.dropped+=all.length-kept.length;stats.kept+=fresh.filter(f=>kept.includes(f)).length;
 const keptSet=new Set(kept);for(const it of all)if(!keptSet.has(it)&&!it.final)reserve.push(it);reserve.sort((a,b)=>a.order-b.order);if(reserve.length>400)reserve.splice(0,reserve.length-400);
 Q.length=0;Q.push(...kept);deadline=final?null:now()+horizon;
 if(!cur&&!timer)next();}
function show(q,part){const el=box();if(!el)return;if(!prefs.subs||!q){el.classList.remove('on');return;}
 el.querySelector('.n').textContent=q.narr||'';el.querySelector('.t').textContent=part;el.classList.add('on');}
// 예비 다시 채우기: 대기열이 비었고 지금 지역에 살아 있는 적이 있을 때. 예상 시간이 지났어도 싸움이 이어지면 45초 분량씩 더 읽는다.
function fighting(){try{const r=G('room',null);return !!(r&&(r.enemies||[]).some(e=>e&&e.hp>0&&!e.deadRecorded&&!['hidden','inactive','disabled','despawned'].includes(e.spawnState)));}catch(_){return false;}}
function refill(){if(Q.length||!reserve.length||!fighting())return 0;const left=Math.max(REFILL_MIN,remainingInZone());
 const cap=left*cps*clamp(prefs.rate,.8,1.3)*.9;const pick=select(reserve.slice(),cap).kept;if(!pick.length)return 0;
 const ps=new Set(pick);for(let i=reserve.length-1;i>=0;i--)if(ps.has(reserve[i]))reserve.splice(i,1);
 Q.push(...pick);deadline=now()+left;stats.refilled+=pick.length;return pick.length;}
function next(){timer=null;if(!prefs.on){cur=null;show(null);return;}
 if(!Q.length)refill();
 cur=Q.shift()||null;if(!cur){show(null);return;}
const my=++gen,tn=tone(cur.text,cur.sceneEnd),rate=steadyRate(prefs.rate);
 const parts=chunks(cur.text),t0=now();let pi=0;show(cur,parts[0]);
 const est=cur.len/(cps*rate);
 // 자막 조각은 글자 비율로 넘긴다(음성 경계 이벤트가 오면 그쪽을 따른다).
 const bounds=[];{let acc=0;for(const p of parts){acc+=p.length+1;bounds.push(acc);}}
 let partTimer=null;const schedule=()=>{if(pi>=parts.length-1)return;const at=bounds[pi]/cur.len*est;partTimer=setTimeout(()=>{if(my!==gen)return;pi++;show(cur,parts[pi]);schedule();},Math.max(300,(at-(now()-t0))*1000));};schedule();
 const done=(spoke)=>{if(my!==gen)return;gen++;clearTimeout(partTimer);const d=now()-t0;
  if(spoke&&d>.6&&cur){const m=cur.len/(d*rate);if(m>2&&m<20)cps=cps*.85+m*.15;}
  const q=cur;cur=null;
  const gap=tn.pause;if(q?.sceneEnd)show(null);timer=setTimeout(next,gap*1000);};
 const synth=()=>{const v=pickVoice();
 if(v&&window.speechSynthesis){try{const u=new SpeechSynthesisUtterance(cur.text);u.lang=v.lang||'ko-KR';u.voice=v;u.rate=rate;u.pitch=tn.pitch;u.volume=vol();
   u.onend=()=>{stats.spoken++;done(true);};u.onerror=()=>done(false);
   u.onboundary=ev=>{try{if(my!==gen)return;const ci=ev.charIndex||0;let k=0;while(k<parts.length-1&&ci>=bounds[k])k++;if(k>pi){pi=k;clearTimeout(partTimer);show(cur,parts[pi]);schedule();}}catch(_){}};
   speaking=true;speechSynthesis.speak(u);
   // 지킴이: 끝 알림이 오지 않으면(크롬 긴 문장 멈춤 등) 예상 시간의 두 배 + 3초 뒤 넘긴다.
   setTimeout(()=>{if(my===gen){try{speechSynthesis.cancel();}catch(_){}done(false);}},(est*2+3)*1000);}catch(e){fail(e);stats.silent++;setTimeout(()=>done(false),est*1000);}}
 else{stats.silent++;setTimeout(()=>{if(my===gen)done(false);},est*1000);}};
 // R381: 녹음이 있으면 먼저 튼다. 못 받거나 오류면 같은 문장을 브라우저 음성으로(자막·시간 맞추기는 그대로).
 const R=window.__STORYWORLD_VOICE_R381__;let rec=null;
 if(prefs.voice!=='none'&&R){try{if(R.has(cur.text)){rec=R.play(cur.text,{rate,volume:vol(),onend:()=>{stats.spoken++;stats.recorded++;done(true);},onerror:()=>{if(my===gen&&rec){rec=null;stats.recordFail++;synth();}}});
   if(rec){if(Q[0])R.preload(Q[0].text);setTimeout(()=>{if(my===gen&&rec){rec.stop();rec=null;done(false);}},(est*2+3)*1000);}}}catch(e){fail(e);rec=null;}}
 if(!rec)synth();}
let speaking=false;
function stopAll(){gen++;Q.length=0;reserve.length=0;cur=null;deadline=null;clearTimeout(timer);timer=null;try{speechSynthesis.cancel();}catch(_){}try{window.__STORYWORLD_VOICE_R381__?.stop?.();}catch(_){}show(null);}
// ── 자막 상자 ──
let boxEl=null;
function box(){if(boxEl&&boxEl.isConnected)return boxEl;try{if(!document.getElementById('r370Style')){const st=document.createElement('style');st.id='r370Style';
  st.textContent='#r370Subs{position:fixed;left:50%;bottom:calc(max(24vh,236px) + env(safe-area-inset-bottom,0px));transform:translate(-50%,6px);width:min(860px,calc(100vw - 32px));z-index:9000;pointer-events:none;opacity:0;transition:opacity .45s ease,transform .45s ease;text-align:center}'+
  '#r370Subs.on{opacity:1;transform:translate(-50%,0)}#r370Subs .w{display:inline-block;max-width:100%;padding:8px 18px 10px;border-radius:6px;background:linear-gradient(180deg,rgba(10,7,9,.50),rgba(10,7,9,.72));box-shadow:0 0 0 1px rgba(196,160,98,.18) inset}'+
  '#r370Subs .n{display:block;font-size:12px;letter-spacing:.08em;color:#c9a865;opacity:.85;margin-bottom:2px;min-height:1px}#r370Subs .n:empty{display:none}'+
  '#r370Subs .t{display:block;font-size:19px;line-height:1.5;color:#efe6d6;text-shadow:0 1px 2px #000,0 0 8px rgba(0,0,0,.8);word-break:keep-all;overflow-wrap:anywhere}'+
  '#r370Subs.away{opacity:0!important}@media (max-width:640px){#r370Subs{bottom:calc(25vh + env(safe-area-inset-bottom,0px))}#r370Subs .t{font-size:15px}}'+
  '@media (prefers-reduced-motion:reduce){#r370Subs{transition:opacity .2s linear;transform:translate(-50%,0)}}';document.head.appendChild(st);}
 boxEl=document.createElement('div');boxEl.id='r370Subs';boxEl.setAttribute('aria-live','polite');boxEl.innerHTML='<div class="w"><span class="n"></span><span class="t"></span></div>';document.body.appendChild(boxEl);}catch(e){fail(e);}return boxEl;}
// ── 엔진 연결 ──
let skipping=false;
function record(s){try{if(!s||!s.key||typeof s.text!=='string'||!s.text.trim())return;let place='';try{place=G('regionById',{})?.[s.id]?.title||'';}catch(_){}
 window.__STORYWORLD_PLAY_R169__?.collect?.({key:'story:'+s.key,title:'서사 · '+(s.title||'기억'),narr:s.narrator||'',text:s.text,place});}catch(e){fail(e);}}
try{if(typeof playScenes==='function'){const base=playScenes;playScenes=function(scenes,done){
  try{if(prefs.on&&!skipping&&Array.isArray(scenes)&&scenes.length&&!scenes.some(journal)){const list=scenes.filter(s=>s&&typeof s.text==='string'&&s.text.trim());
    if(list.length){tickZone();list.forEach(record);enqueue(list);skipping=true;let r;try{r=base.call(this,scenes,done);let n=0;while(G('storyScene',null)&&n<300){n++;advanceScene();}}finally{skipping=false;}return r;}}}catch(e){fail(e);skipping=false;}
  return base.call(this,scenes,done);};}}catch(e){fail(e);}
// 엔진 stopVoice 는 장면을 넘길 때마다 음성 합성을 끊는다 → 영화 모드에서는 우리 음성을 끊지 않게 cancel 을 잠시 막는다.
try{if(typeof stopVoice==='function'){const base=stopVoice;stopVoice=function(...a){if(!prefs.on||!window.speechSynthesis)return base.apply(this,a);
  const ss=window.speechSynthesis,c=ss.cancel;let swapped=false;try{ss.cancel=function(){};swapped=true;}catch(_){}
  try{return base.apply(this,a);}finally{if(swapped)try{delete ss.cancel;if(ss.cancel!==c)ss.cancel=c;}catch(_){}}};}}catch(e){fail(e);}
// 쪽지·기억 조각: 영화 모드에서는 창을 펼치지 않고, 글을 덜 중요한 문장으로 대기열 끝에 보탠다(R177 은 이 전역을 매번 읽는다).
try{const R=window.__STORYWORLD_GUIDE_FRAGMENT_R365__;if(R&&typeof R.hold==='function'){window.__STORYWORLD_GUIDE_FRAGMENT_R365__=Object.freeze({...R,hold(doc){
  if(prefs.on&&doc){try{const txt=String(doc.text||doc.body||'').trim();if(txt){stats.fragments++;const ss=sentences(txt).slice(0,3);const narr=String(doc.title||'쪽지');
    for(const x of ss){Q.push({text:x.text,len:x.text.length,narr,title:narr,must:false,score:.2,order:order++,sceneEnd:false,final:false});}if(!cur&&!timer)next();}
   if(typeof toast==='function')toast('쪽지를 쪽지 모음에 넣었습니다 · 영화 모드',1.6);}catch(e){fail(e);}return true;}
  return R.hold(doc);}});}}catch(e){fail(e);}
// 출구에서 머물기: 고른 문장이 1.3배속으로도 25초 넘게 남았으면 길잡이의 지역 이동을 최대 40초 늦춘다(직접 조작·복원·사망 귀환은 그대로).
let lingerP=null;
try{if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=function(id,from,opt){
  try{if(prefs.on&&G('guide',false)&&!opt?.restore&&backlogSecs()>25){if(lingerP)return lingerP;stats.lingers++;const self=this,args=arguments,t0=now();
    try{if(typeof toast==='function')toast('서사를 마저 듣는 중…',2);}catch(_){}
    lingerP=new Promise(res=>{const w=()=>{if(!prefs.on||!G('guide',false)||backlogSecs()<8||now()-t0>LINGER_MAX){lingerP=null;res(base.apply(self,args));}else setTimeout(w,500);};setTimeout(w,500);});return lingerP;}}catch(e){fail(e);}
  return base.apply(this,arguments);};}}catch(e){fail(e);}
// 길잡이 이어 켜기: 엔진이 사망·귀환에서 길잡이를 끄면, 손을 대지 않은 채 6초가 지나면 다시 켠다.
let lastInput=0;for(const ev of['keydown','pointerdown','touchstart'])addEventListener(ev,e=>{if(e.target?.closest?.('#modal,#r370Subs'))return;lastInput=now();},{passive:true,capture:true});
setInterval(()=>{try{tickZone();if(boxEl)boxEl.classList.toggle('away',!!G('modal',false));if(!prefs.on)return;if(!cur&&!timer&&!Q.length&&refill())next();if(G('started',false)&&!G('loading',false)&&!G('modal',false)&&!G('guide',true)&&now()-lastInput>6){guideOn();stats.guideResumed++;}}catch(e){fail(e);}},1000);
// ── 켜고 끄기·설정 ──
function save(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
function set(p={}){const was=prefs.on;if(typeof p.on==='boolean')prefs.on=p.on;if(typeof p.voice==='string')prefs.voice=p.voice;if(typeof p.subs==='boolean')prefs.subs=p.subs;if(Number.isFinite(+p.rate))prefs.rate=clamp(+p.rate,.8,1.3);save();
 if(prefs.on&&!was){try{if(G('started',false))guideOn();}catch(e){fail(e);}box();}
 if(!prefs.on&&was)stopAll();return {...prefs};}
function preview(){const R=window.__STORYWORLD_VOICE_R381__;
 if(prefs.voice!=='none'&&R&&R.sample){try{speechSynthesis.cancel();}catch(_){}show({narr:'시험 듣기 · 녹음 음성'},R.sample);const off=()=>{if(!cur)show(null);};
  if(R.play(R.sample,{rate:prefs.rate,volume:vol(),onend:off,onerror:off}))return '녹음 음성(Sohee)';}
 const v=pickVoice();try{speechSynthesis.cancel();}catch(_){}const t='나는 언제나 깊은 꿈을 꾼다.';show({narr:'시험 듣기'},t);setTimeout(()=>{if(!cur)show(null);},2600);
 if(v){try{const u=new SpeechSynthesisUtterance(t);u.voice=v;u.lang=v.lang;u.rate=prefs.rate;u.volume=vol();speechSynthesis.speak(u);}catch(e){fail(e);}}return v?.name||null;}
try{if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{const grid=document.querySelector('#panel .settings');if(grid&&!document.getElementById('r370Cinema')){
  const l=document.createElement('label');l.id='r370CinemaRow';const c=document.createElement('input');c.type='checkbox';c.id='r370Cinema';c.checked=prefs.on;
  l.title='켜면 길잡이가 플레이하고, 서사 창 대신 원문에서 고른 문장을 자막과 음성으로 들려줍니다. 원문 전체는 쪽지 모음에 남습니다';
  c.onchange=()=>set({on:c.checked});l.appendChild(c);l.appendChild(document.createTextNode(' 영화 모드(자동 플레이 + 서사 자막·음성)'));
  const row=document.createElement('div');row.id='r370VoiceRow';row.style.cssText='display:flex;gap:8px;align-items:center;flex-wrap:wrap';
  const sel=document.createElement('select');sel.id='r370Voice';const fill=()=>{const vs=voices();sel.innerHTML='';const add=(v,t)=>{const o=document.createElement('option');o.value=v;o.textContent=t;sel.appendChild(o);};
   add('','자동(녹음 음성 → 한국어 음성)');for(const v of vs)add(v.name,v.name);add('none','목소리 없이 자막만');sel.value=prefs.voice;if(sel.value!==prefs.voice)sel.value='';};fill();
  try{speechSynthesis.addEventListener?.('voiceschanged',fill,{once:true});}catch(_){}
  sel.onchange=()=>set({voice:sel.value});const b=document.createElement('button');b.type='button';b.id='r370Preview';b.textContent='시험 듣기';
  b.onclick=()=>{const n=preview();if(!n&&typeof toast==='function')toast('이 브라우저에 한국어 음성이 없습니다 · 자막만 나옵니다',2.4);};
  const sp=document.createElement('span');sp.textContent='영화 모드 목소리';row.append(sp,sel,b);
  // 간이설정의 '서사 음성 자동 재생' 바로 아래(없으면 R365 줄 아래, 그것도 없으면 끝)에 둔다.
  const quick=document.getElementById('quickSettingsR114');let after=null;
  for(const i of [...(quick||document).querySelectorAll?.('input[data-setting="narration"]')||[]]){const lb=i.closest?.('label');if(lb&&lb.offsetParent!==null){after=lb;break;}}
  if(!after&&!quick){const a=document.getElementById('r365SkipStoryRow');if(a&&a.parentNode===grid)after=a;}
  const host=after?.parentNode||quick||grid;if(after&&after.nextSibling){host.insertBefore(l,after.nextSibling);host.insertBefore(row,l.nextSibling);}else{host.appendChild(l);host.appendChild(row);}}}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
addEventListener('visibilitychange',()=>{try{if(!window.speechSynthesis)return;if(document.hidden)speechSynthesis.pause();else speechSynthesis.resume();}catch(_){}});
window.__STORYWORLD_CINEMA_MODE_R370__=Object.freeze({revision:REV,set,preview,stop:stopAll,prefs:()=>({...prefs}),
 pure:Object.freeze({sentences,score,select,steadyRate,STEADY,tone,chunks,isFinal,DEFAULT_SEC,CPS0,MIN_H,GAP,GAP_END}),
 remainingSecs:()=>+remainingSecs().toFixed(1),
 inspect:()=>({revision:REV,prefs:{...prefs},zone:{key:zone.key,active:+zone.active.toFixed(1),estimate:estimate(zone.key)},queue:Q.length,reserve:reserve.length,realMul:realMul(),queuedChars:Math.round(pendingChars()),backlogSecs:+backlogSecs().toFixed(1),
  current:cur?.text||null,deadlineIn:deadline?+(deadline-now()).toFixed(1):null,cps:+cps.toFixed(2),voices:voices().map(v=>v.name),learned:{...learned},stats:{...stats},lastError})});
})();
