// R372 — 뿌리의 문지기(dist00) 보스 입장 영상.
// 사용자 2026-11-06: "맨처음 나오는 영상 책나오는 영상은 그대로 맨처음 나오게 하고 그다음에 나오는 실사풍 도망쳐영상은
//  뿌리나무보스 문이랑 상호작용할때 나오게 해줘 보스입장시네마틱영상느낌으로다가"
//  · R327 오프닝(opening-hapil.mp4 = 책 0~10초 + 실사 9.5~19.55초)을 둘로 나눴다. 책 부분(assets/r372/opening-book.mp4, 9.45초)은
//    새 게임 오프닝(intro-video-r309)이 그대로 맨 처음 틀고, 실사 부분(assets/r372/root-gate.mp4, 9.52초)은 여기서 튼다.
//    원래 이은 파일(opening-hapil.mp4)은 지우지 않고 남겨 둔다(원본 보존).
//  · 언제: STORY 층 dist00 에서 들판 적을 다 잡아 보스 문(R81 bossDoorId)이 열 수 있는 상태('door')일 때, 그 문과 상호작용(E·문 누르기)하면 한 번.
//    영상이 끝나거나 건너뛰면 원래 처리(보스 앞 서사 → 문 열림 → 보스)를 그대로 잇는다. 진행·세이브·서사 순서는 바꾸지 않는다.
//  · 보스 입장 연출: 위아래 검은 띠(시네마 비율), 끝 무렵 보스 이름 카드(데이터의 보스 이름 그대로 — 새 설정을 짓지 않음), 자막 없음.
//  · 재생 중 게임 멈춤·BGM 0(bgm-map-r308 배수)·게임 키 막기(R309 가드 등록). 건너뛰기: 단추·화면 누르기·Esc/Enter/Space. 6초 진행이 없으면 닫고 진행.
//  · 끄기: localStorage storyworld.r372.rootgate {on:false}. 다시 보기: API play().
(()=>{'use strict';
if(window.__STORYWORLD_ROOT_GATE_VIDEO_R372__)return;
const REV='R372-root-gate-video-1',KEY='storyworld.r372.rootgate',SRC='assets/r372/root-gate.mp4',POSTER='assets/r372/root-gate-poster.jpg',ZONE='dist00',
 STALL_MS=6000,HOLD_MS=700,NAME_AT=6.4,REACH=3.2,FALLBACK_NAME='뿌리의 문지기';
let prefs={on:true,seen:false};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={plays:0,skips:0,ended:0,errors:0,muted:0,stalled:0,triggers:0,continued:0,preloads:0};let lastError=null,open=null,pre=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}};
const url=p=>{try{return typeof urlFor==='function'?urlFor(p):p;}catch(_){return p;}};
const solo=()=>{const s=window.__STORYWORLD_COOP_SIM_R62__;return !s?.mode||s.mode()==='off';};
const here=()=>typeof room!=='undefined'?room:null;
const eligible=r=>!!(r&&r.id===ZONE&&r.layer==='STORY'&&!r.samongR103&&!r.samongR115&&!r.exploration?.samongR103&&solo());
const ward=r=>{try{return window.__STORYWORLD_WORLD_COMBAT_R78__?.state?.(r)||null;}catch(_){return null;}};
const bossDoor=r=>{const id=r?.exploration?.bossDoorId;return id?(r.exploration.worldR74?.doors||[]).find(d=>d.id===id)||null:null;};
const ready=()=>{try{return typeof started!=='undefined'&&started&&!(typeof modal!=='undefined'&&modal)&&!(typeof loading!=='undefined'&&loading)
 &&!(typeof storyScene!=='undefined'&&storyScene)&&typeof player!=='undefined'&&player&&player.hp>0;}catch(_){return false;}};
// 지금 E 를 누르면 보스 문이 열릴 차례인가(R81 'door' 단계, 문 가까이)
function atGate(r=here()){if(!prefs.on||prefs.seen||open||!eligible(r)||!ready())return false;const s=ward(r);if(!s||s.phase!=='door')return false;
 const d=bossDoor(r);return !!d&&Math.hypot(player.x-d.x,player.y-d.y)<REACH;}
const bossName=r=>{try{const e=(r?.enemies||[]).find(e=>e&&e.boss);if(e?.name)return String(e.name).replace(/\s*\(.*\)\s*$/,'');}catch(_){}return FALLBACK_NAME;};

const audioLevel=()=>{try{const s=typeof settings!=='undefined'?settings:null;if(!s)return 1;const c=x=>Math.max(0,Math.min(1,Number(x)||0));
 return Math.max(s.sound?c(s.volume):0,s.music?c(s.bgm??s.volume):0,s.narration?c(s.voice??s.volume):0);}catch(_){return 1;}};
function preload(){if(pre||!prefs.on||typeof document==='undefined')return pre;try{const v=document.createElement('video');v.preload='auto';v.playsInline=true;v.setAttribute('playsinline','');v.src=url(SRC);v.load?.();pre=v;stats.preloads++;}catch(e){fail(e);}return pre;}

function css(){if(document.getElementById('r372Css'))return;const s=document.createElement('style');s.id='r372Css';
 s.textContent='#r372v{position:fixed;inset:0;z-index:2147482000;background:#030203;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .35s;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none;overflow:hidden}'
 +'#r372v video{width:100%;max-height:100%;aspect-ratio:16/9;object-fit:contain;background:#000}'
 +'#r372v .bar{position:absolute;left:0;right:0;height:0;background:#000;transition:height .7s cubic-bezier(.2,.7,.2,1);pointer-events:none}#r372v .bar.t{top:0}#r372v .bar.b{bottom:0}'
 +'#r372v.cine .bar{height:max(9vh,calc((100vh - min(100vw*9/16,100vh))/2 + min(100vw*9/16,100vh)*.12))}'
 +'#r372v .chap{position:absolute;left:max(16px,3vw);top:max(14px,2.4vh);z-index:2;color:#d9c9b0;font:600 13px/1.4 "Gowun Batang","Noto Serif KR",serif;letter-spacing:.18em;opacity:.85;text-shadow:0 1px 4px #000;pointer-events:none}'
 +'#r372v .name{position:absolute;left:0;right:0;bottom:max(12vh,calc((100vh - min(100vw*9/16,100vh))/2 + min(100vw*9/16,100vh)*.16));z-index:2;margin:0 auto;width:fit-content;max-width:88vw;text-align:center;pointer-events:none;opacity:0;transform:translateY(8px);transition:opacity .6s,transform .6s}'
 +'#r372v .name.on{opacity:1;transform:none}#r372v .name small{display:block;color:#c9a46a;font:600 clamp(11px,1.4vw,14px)/1.6 "Gowun Batang","Noto Serif KR",serif;letter-spacing:.5em;text-shadow:0 1px 4px #000}'
 +'#r372v .name b{display:block;padding:4px 22px 6px;color:#f3e7da;font:700 clamp(22px,3.6vw,40px)/1.3 "Gowun Batang","Noto Serif KR",serif;letter-spacing:.14em;text-shadow:0 0 14px #000,0 2px 6px #000;'
 +'border-top:1px solid rgba(190,40,30,.7);border-bottom:1px solid rgba(190,40,30,.7);background:linear-gradient(90deg,transparent,rgba(20,4,4,.62) 16%,rgba(20,4,4,.62) 84%,transparent);word-break:keep-all}'
 +'@media (orientation:portrait){#r372v .name{bottom:auto;top:calc(50% + 100vw*9/32 + 14px)}}'
 +'#r372v .skip{position:absolute;z-index:3;right:max(16px,3vw);bottom:max(16px,3vh);padding:8px 16px;font:14px "Malgun Gothic",sans-serif;color:#f2e8dc;background:rgba(20,10,8,.66);border:1px solid #7b5a45;border-radius:6px;cursor:pointer}'
 +'#r372v .fade{position:absolute;inset:0;z-index:4;background:#000;opacity:0;transition:opacity .45s;pointer-events:none}#r372v .fade.on{opacity:1}';document.head.appendChild(s);}
const current=o=>open===o&&!o.closed;
function close(o,reason){if(!current(o))return;o.closed=true;clearTimeout(o.stall);clearTimeout(o.hold);
 for(const [type,fn]of o.events)o.video.removeEventListener(type,fn);o.events.length=0;try{o.video.pause();}catch(_){}
 if(reason==='skip')stats.skips++;else if(reason==='ended')stats.ended++;else if(reason==='stall')stats.stalled++;
 if((reason==='skip'||reason==='ended')&&!prefs.seen){prefs.seen=true;save();}
 if((reason==='error'||reason==='stall')&&o.lastTime<1){prefs.seen=false;save();} // 거의 못 봤으면 다음에 문을 열 때 다시
 o.fade.classList.add('on');setTimeout(()=>{try{o.video.removeAttribute('src');o.video.load();}catch(_){}o.root.remove();if(open===o)open=null;
  try{if(typeof keys!=='undefined'&&keys?.clear)keys.clear();o.focus?.focus?.({preventScroll:true});}catch(_){}
  // 원래 문 처리(보스 앞 서사 → 문 열림)를 잇는다. 영상이 실패해도 진행은 막지 않는다.
  if(o.after&&here()===o.room){stats.continued++;try{o.after();}catch(e){fail(e);}}},reason==='error'?0:460);}
function key(e){if(!open)return false;e.preventDefault();e.stopImmediatePropagation();if(e.type==='keydown'&&!e.repeat&&(e.key==='Escape'||e.key==='Enter'||e.key===' '||e.code==='Space'))close(open,'skip');return true;}
try{(window.__STORYWORLD_CINEMA_GUARDS__=window.__STORYWORLD_CINEMA_GUARDS__||[]).push(key);}catch(_){}
if(typeof addEventListener==='function'){addEventListener('keydown',key,true);addEventListener('keyup',key,true);}
function watch(o){clearTimeout(o.stall);o.stall=setTimeout(()=>{if(!current(o)||o.ending)return;const t=Number(o.video.currentTime)||0;if(t>o.lastTime+.01){o.lastTime=t;watch(o);return;}close(o,'stall');},STALL_MS);}
function atEnd(o){if(!current(o)||o.ending)return;o.ending=true;clearTimeout(o.stall);o.nm.classList.add('on');o.hold=setTimeout(()=>close(o,'ended'),HOLD_MS);}
function play(r,opt={}){if(open||typeof document==='undefined')return false;if(!opt.force&&(!prefs.on||!eligible(r)))return false;
 css();const v=pre||preload()||document.createElement('video');pre=null;if(!v.src)v.src=url(SRC);
 v.poster=url(POSTER);v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';{const lv=audioLevel();v.volume=Math.max(0,Math.min(1,lv));v.muted=!!opt.muted||lv<=0;}try{v.currentTime=Number(opt.at)||0;}catch(_){}
 const root=document.createElement('div');root.id='r372v';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','보스 입장 영상');root.tabIndex=-1;
 const title=(typeof regionById!=='undefined'&&regionById?.[ZONE]?.title)||'';
 root.innerHTML='<div class="bar t"></div><div class="bar b"></div><div class="chap"></div><div class="name"><small>BOSS</small><b></b></div><button type="button" class="skip">건너뛰기 ▸</button><div class="fade"></div>';
 root.querySelector('.chap').textContent=(title?title+' · ':'')+'문 너머';root.querySelector('.name b').textContent=bossName(r);
 root.insertBefore(v,root.firstChild);document.body.appendChild(root);requestAnimationFrame(()=>{root.style.opacity='1';requestAnimationFrame(()=>root.classList.add('cine'));});
 const o=open={root,video:v,nm:root.querySelector('.name'),fade:root.querySelector('.fade'),stall:0,hold:0,events:[],closed:false,ending:false,lastTime:-1,focus:document.activeElement,room:r,after:typeof opt.after==='function'?opt.after:null};
 const skip=root.querySelector('.skip');stats.plays++;
 const on=(type,fn)=>{const own=e=>{if(current(o))fn(e);};o.events.push([type,own]);v.addEventListener(type,own);};
 try{if(typeof keys!=='undefined'&&keys?.clear)keys.clear();}catch(_){}
 root.addEventListener('pointerdown',e=>{if(e.target===skip)return;e.preventDefault();close(o,'skip');});skip.addEventListener('click',e=>{e.stopPropagation();close(o,'skip');});
 const name=()=>{if((Number(v.currentTime)||0)>=NAME_AT)o.nm.classList.add('on');};
 watch(o);on('timeupdate',()=>{name();const t=Number(v.currentTime)||0;if(t>o.lastTime+.01){o.lastTime=t;watch(o);}});on('playing',()=>{name();if(!prefs.seen){prefs.seen=true;save();}});
 on('ended',()=>atEnd(o));on('error',()=>{fail('video error '+(v.error?.code||''));close(o,'error');});
 if(opt.paused){name();return true;}
 const p=v.play?.();if(p&&typeof p.catch==='function')p.catch(()=>{if(!current(o))return;v.muted=true;stats.muted++;v.play().catch(e=>{if(!current(o))return;fail(e);close(o,'error');});});
 return true;}
// 보스 문 상호작용을 가로채 영상 먼저, 끝나면 원래 처리. (world-combat-r78 이 감싼 interact 를 다시 감싼다)
if(typeof interact==='function'){const base=interact;interact=function(...a){
 try{if(atGate()){const r=here(),self=this;stats.triggers++;if(play(r,{after:()=>base.apply(self,a)}))return true;}}catch(e){fail(e);}
 return base.apply(this,a);};}
// 문 가까이 가면 미리 받아 둔다(누르는 순간 바로 나오게).
let near=0;function poll(){const r=here();if(pre||!prefs.on||prefs.seen||!eligible(r))return;const s=ward(r);if(!s||!['door','route','rally'].includes(s.phase))return;
 if(s.phase!=='door'||typeof player==='undefined'||!player)return;const d=bossDoor(r);if(d&&Math.hypot(player.x-d.x,player.y-d.y)<12&&++near>3)preload();}
if(typeof tick==='function'){const base=tick;tick=function(...a){if(open){if(here()&&open.room&&here()!==open.room){open.after=null;close(open,'skip');}return;}
 const out=base.apply(this,a);try{poll();}catch(e){fail(e);}return out;};}
window.__STORYWORLD_ROOT_GATE_VIDEO_R372__=Object.freeze({revision:REV,KEY,SRC,POSTER,ZONE,NAME_AT,
 bgmGain:()=>open?0:1,play:(o={})=>play(here(),{force:true,...o}),skip:()=>{if(open)close(open,'skip');},preload,atGate:()=>atGate(),
 setPrefs(p){prefs={...prefs,...p};save();},
 inspect:()=>({revision:REV,prefs:{...prefs},open:!!open,name:open?.nm?.textContent||'',time:open?Number(open.video.currentTime)||0:null,preloaded:pre?{ready:pre.readyState,error:!!pre.error}:null,stats:{...stats},lastError})});
})();
