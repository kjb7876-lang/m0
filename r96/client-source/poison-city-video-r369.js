// R369 — 환자와 중독의 도시(ep1a10) 서사 영상.
// 사용자 2026-11-06: "이건 중독된도시 서사영상으로 넣어줘 환각약물검출자막은 빼고 개선해서 적용해줘"
//  · 영상(assets/r369/poison-city.mp4, 10초 1280×720): 사용자 영상에서 3.6~6.5초 오른쪽 위 가짜 HUD 글자('위험: 환각성 약물 검출')와
//    틀, 오른쪽 아래 워터마크를 지웠다(ffmpeg delogo). 원본 파일은 저장소에 넣지 않는다.
//  · 자막은 영상 속 글자 대신 정본 개선본 ep1a10 문장을 그대로 장면에 맞춰 띄운다(새 문장을 짓지 않음).
//  · 처음 이 지역(STORY 층)에 들어왔을 때 한 번. 입장 서사창(storyScene)이 열려 있으면 닫힌 뒤 0.7초 있다가 나온다.
//  · 재생 중 게임 멈춤, BGM 0(bgm-map-r308 배수). 건너뛰기: 단추·화면 누르기·Esc/Enter/Space. 6초 진행이 없으면 닫는다.
//  · 끄기: localStorage storyworld.r369.poison {on:false}. 다시 보기: API play().
(()=>{'use strict';
if(window.__STORYWORLD_POISON_CITY_VIDEO_R369__)return;
const REV='R369-poison-city-video-1',KEY='storyworld.r369.poison',SRC='assets/r369/poison-city.mp4',POSTER='assets/r369/poison-city-poster.jpg',ZONE='ep1a10',
 STALL_MS=6000,HOLD_MS=900,DELAY_MS=700;
// [시작초, 끝초, 문장] — 후드 쓴 사내가 주사기를 든다 / 주사기가 깨져 보랏빛이 번진다 / 연기 속을 걸어 나간다. 정본 ep1a10 문장 그대로.
const CUES=Object.freeze([
 [0.6,3.5,'그의 목소리가 들릴 때마다 나는 항상 약을 갈망했다.'],
 [3.7,6.6,'바닥에 흩어진 주사기들이 달빛을 반사했고…'],
 [6.8,11,'하지만 약에 손을 댄 데에는 내 호기심과 오만이 결정적이었다.']]);
let prefs={on:true,seen:false};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={plays:0,skips:0,ended:0,errors:0,muted:0,stalled:0,waitedStory:0,preloads:0};let lastError=null,open=null,pre=null,pending=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}};
const url=p=>{try{return typeof urlFor==='function'?urlFor(p):p;}catch(_){return p;}};
const solo=()=>{const s=window.__STORYWORLD_COOP_SIM_R62__;return !s?.mode||s.mode()==='off';};
const here=()=>typeof room!=='undefined'?room:null;
const now=()=>typeof performance!=='undefined'&&performance.now?performance.now():Date.now();
const eligible=r=>!!(r&&r.id===ZONE&&r.layer==='STORY'&&!r.samongR103&&!r.samongR115&&!r.exploration?.samongR103&&solo());
const busy=()=>{try{return (typeof storyScene!=='undefined'&&!!storyScene)||(typeof loading!=='undefined'&&!!loading)||(typeof started!=='undefined'&&!started)
 ||!!document.getElementById('r317Cinema')||!!document.getElementById('r368v')||!!window.__STORYWORLD_BETRAYAL_VIDEO_R368__?.inspect?.().open;}catch(_){return false;}};

// 게임 소리 설정을 따른다(소리·음악·내레이션이 모두 꺼졌거나 음량 0이면 음소거, 아니면 켜진 것 중 가장 큰 음량).
const audioLevel=()=>{try{const s=typeof settings!=='undefined'?settings:null;if(!s)return 1;const c=x=>Math.max(0,Math.min(1,Number(x)||0));
 return Math.max(s.sound?c(s.volume):0,s.music?c(s.bgm??s.volume):0,s.narration?c(s.voice??s.volume):0);}catch(_){return 1;}};
function preload(){if(pre||!prefs.on||typeof document==='undefined')return pre;try{const v=document.createElement('video');v.preload='auto';v.playsInline=true;v.setAttribute('playsinline','');v.src=url(SRC);v.load?.();pre=v;stats.preloads++;}catch(e){fail(e);}return pre;}
if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(id,...a){const out=await base.call(this,id,...a);
 try{const r=here();if(prefs.on&&!prefs.seen&&eligible(r)){preload();pending={room:r,at:now(),story:false};}else pending=null;}catch(e){fail(e);}return out;};}

function css(){if(document.getElementById('r369Css'))return;const s=document.createElement('style');s.id='r369Css';
 s.textContent='#r369v{position:fixed;inset:0;z-index:2147482000;background:#040305;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .35s;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none}'
 +'#r369v video{width:100%;max-height:100%;aspect-ratio:16/9;object-fit:contain;background:#000}'
 +'#r369v .chap{position:absolute;left:max(16px,3vw);top:max(14px,3vh);color:#c7bcd6;font:600 13px/1.4 "Gowun Batang","Noto Serif KR",serif;letter-spacing:.18em;opacity:.85;text-shadow:0 1px 4px #000;pointer-events:none}'
 +'#r369v .cap{position:absolute;left:0;right:0;margin:0 auto;width:fit-content;box-sizing:border-box;top:min(calc(50% + min(50vh,28.125vw) + 8px),calc(100% - 120px));max-width:min(88vw,760px);padding:8px 18px;text-align:center;color:#eee6f4;'
 +'font:500 clamp(16px,2.3vw,24px)/1.5 "Gowun Batang","Noto Serif KR",serif;letter-spacing:.04em;text-shadow:0 0 10px #000,0 2px 6px #000;background:linear-gradient(90deg,transparent,rgba(10,6,14,.66) 18%,rgba(10,6,14,.66) 82%,transparent);'
 +'border-top:1px solid rgba(150,90,190,.45);border-bottom:1px solid rgba(150,90,190,.45);opacity:0;transition:opacity .4s;pointer-events:none;word-break:keep-all}#r369v .cap.on{opacity:1}'
 +'#r369v .skip{position:absolute;right:max(16px,3vw);bottom:max(16px,3vh);padding:8px 16px;font:14px "Malgun Gothic",sans-serif;color:#efe6f2;background:rgba(16,10,20,.66);border:1px solid #6d5a7b;border-radius:6px;cursor:pointer}'
 +'#r369v .fade{position:absolute;inset:0;background:#000;opacity:0;transition:opacity .45s;pointer-events:none}#r369v .fade.on{opacity:1}';document.head.appendChild(s);}
const current=o=>open===o&&!o.closed;
function close(o,reason){if(!current(o))return;o.closed=true;clearTimeout(o.stall);clearTimeout(o.hold);
 for(const [type,fn]of o.events)o.video.removeEventListener(type,fn);o.events.length=0;try{o.video.pause();}catch(_){}
 if(reason==='skip')stats.skips++;else if(reason==='ended')stats.ended++;else if(reason==='stall')stats.stalled++;
 if((reason==='skip'||reason==='ended')&&!prefs.seen){prefs.seen=true;save();}
 if((reason==='error'||reason==='stall')&&o.lastTime<1){prefs.seen=false;save();} // 거의 못 봤으면 다음 입장 때 다시
 o.fade.classList.add('on');setTimeout(()=>{try{o.video.removeAttribute('src');o.video.load();}catch(_){}o.root.remove();if(open===o)open=null;
  try{if(typeof keys!=='undefined'&&keys?.clear)keys.clear();o.focus?.focus?.({preventScroll:true});}catch(_){}},reason==='error'?0:460);}
function key(e){if(!open)return false;e.preventDefault();e.stopImmediatePropagation();if(e.type==='keydown'&&!e.repeat&&(e.key==='Escape'||e.key==='Enter'||e.key===' '||e.code==='Space'))close(open,'skip');return true;}
// 스킬 키(michaela-r247 등 capture)보다 먼저 막도록 먼저 실린 R309 의 capture 처리기에 맡긴다(Codex P2). R309 가 없을 때를 위해 자기 처리기도 둔다.
try{(window.__STORYWORLD_CINEMA_GUARDS__=window.__STORYWORLD_CINEMA_GUARDS__||[]).push(key);}catch(_){}
if(typeof addEventListener==='function'){addEventListener('keydown',key,true);addEventListener('keyup',key,true);}
function cue(o){const t=Number(o.video.currentTime)||0,c=CUES.find(([a,b])=>t>=a&&t<b),text=c?c[2]:'';
 if(text!==o.text){o.text=text;if(text)o.cap.textContent=text;o.cap.classList.toggle('on',!!text);}}
function watch(o){clearTimeout(o.stall);o.stall=setTimeout(()=>{if(!current(o)||o.ending)return;const t=Number(o.video.currentTime)||0;if(t>o.lastTime+.01){o.lastTime=t;watch(o);return;}close(o,'stall');},STALL_MS);}
function atEnd(o){if(!current(o)||o.ending)return;o.ending=true;clearTimeout(o.stall);o.hold=setTimeout(()=>close(o,'ended'),HOLD_MS);}
function play(r,opt={}){if(open||typeof document==='undefined')return false;if(!opt.force&&(!prefs.on||!eligible(r)))return false;pending=null;
 css();const v=pre||preload()||document.createElement('video');pre=null;if(!v.src)v.src=url(SRC);
 v.poster=url(POSTER);v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';{const lv=audioLevel();v.volume=Math.max(0,Math.min(1,lv));v.muted=!!opt.muted||lv<=0;}try{v.currentTime=Number(opt.at)||0;}catch(_){}
 const root=document.createElement('div');root.id='r369v';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','환자와 중독의 도시 기억');root.tabIndex=-1;
 const title=(typeof regionById!=='undefined'&&regionById?.[ZONE]?.title)||'환자와 중독의 도시';
 root.innerHTML='<div class="chap"></div><div class="cap" aria-live="polite"></div><button type="button" class="skip">건너뛰기 ▸</button><div class="fade"></div>';
 root.querySelector('.chap').textContent=title+' · 기억';root.insertBefore(v,root.firstChild);document.body.appendChild(root);requestAnimationFrame(()=>{root.style.opacity='1';});
 const o=open={root,video:v,cap:root.querySelector('.cap'),fade:root.querySelector('.fade'),stall:0,hold:0,events:[],closed:false,ending:false,lastTime:-1,text:'',focus:document.activeElement,room:r};
 const skip=root.querySelector('.skip');stats.plays++;
 const on=(type,fn)=>{const own=e=>{if(current(o))fn(e);};o.events.push([type,own]);v.addEventListener(type,own);};
 try{if(typeof keys!=='undefined'&&keys?.clear)keys.clear();}catch(_){}
 root.addEventListener('pointerdown',e=>{if(e.target===skip)return;e.preventDefault();close(o,'skip');});skip.addEventListener('click',e=>{e.stopPropagation();close(o,'skip');});
 watch(o);on('timeupdate',()=>{cue(o);const t=Number(v.currentTime)||0;if(t>o.lastTime+.01){o.lastTime=t;watch(o);}});on('playing',()=>{cue(o);if(!prefs.seen){prefs.seen=true;save();}});
 on('ended',()=>atEnd(o));on('error',()=>{fail('video error '+(v.error?.code||''));close(o,'error');});
 if(opt.paused){cue(o);return true;}
 const p=v.play?.();if(p&&typeof p.catch==='function')p.catch(()=>{if(!current(o))return;v.muted=true;stats.muted++;v.play().catch(e=>{if(!current(o))return;fail(e);close(o,'error');});});
 return true;}
// 도착 뒤 서사창·로딩·다른 장면이 끝나면 한 번 튼다. 재생 중에는 게임을 멈춘다.
function poll(){if(!pending||open)return;const r=here();if(r!==pending.room||!eligible(r)||!prefs.on||prefs.seen){pending=null;return;}
 if(busy()){if(!pending.story){pending.story=true;stats.waitedStory++;}pending.at=now();return;}
 if(now()-pending.at>=DELAY_MS)play(r);}
if(typeof tick==='function'){const base=tick;tick=function(...a){if(open){if(here()&&open.room&&here()!==open.room)close(open,'skip');return;}
 const out=base.apply(this,a);try{poll();}catch(e){fail(e);}return out;};}
window.__STORYWORLD_POISON_CITY_VIDEO_R369__=Object.freeze({revision:REV,KEY,SRC,POSTER,ZONE,CUES,
 bgmGain:()=>open?0:1,play:(o={})=>play(here(),{force:true,...o}),skip:()=>{if(open)close(open,'skip');},preload,poll,
 setPrefs(p){prefs={...prefs,...p};save();},
 inspect:()=>({revision:REV,prefs:{...prefs},open:!!open,pending:!!pending,caption:open?.text||'',time:open?Number(open.video.currentTime)||0:null,preloaded:pre?{ready:pre.readyState,error:!!pre.error}:null,stats:{...stats},lastError})});
})();
