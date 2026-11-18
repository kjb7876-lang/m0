// R140 — 새 게임 오프닝 영상(드라이브 2026-10-30 'StoryWorld-Opening-Intro-8Heroes.mp4', assets/r140/intro).
//  · 새 게임을 시작하면 한 번, 게임 위에 20초 오프닝(여덟 영웅 소개 → 'StoryWorld : 합일몽세')을 띄운다.
//  · 건너뛰기 단추·Esc·Enter·Space·화면 누르기로 바로 닫힌다. 끝나면 저절로 닫힌다. 영상을 못 틀면(코덱·자동재생 막힘) 바로 닫는다.
//  · 세이브 불러오기·지역 이동에는 띄우지 않는다. 자동 검사(navigator.webdriver)에서도 띄우지 않는다.
//  · 게임 진행·세이브·서사 순서는 그대로다(영상이 떠 있는 동안 첫 서사 장면이 뒤에서 기다린다). 설정 storyworld.r140.intro {on:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_INTRO_R140__)return;
const KEY='storyworld.r140.intro',SRC='assets/r140/intro/opening-8heroes.mp4',POSTER='assets/r140/intro/poster.jpg';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={shown:0,skipped:0,ended:0,errors:0};let lastError=null,open=null;
const url=p=>{try{return typeof urlFor==='function'?urlFor(p):p;}catch(_){return p;}};
function close(reason){if(!open)return;const o=open;open=null;try{o.video.pause();}catch(_){}document.removeEventListener('keydown',o.key,true);o.root.style.opacity='0';setTimeout(()=>o.root.remove(),380);if(reason==='skip')stats.skipped++;else if(reason==='ended')stats.ended++;}
function show(){if(open||!prefs.on||navigator.webdriver||typeof document==='undefined')return false;
 const root=document.createElement('div');root.id='introR140';root.setAttribute('role','dialog');root.setAttribute('aria-label','오프닝 영상');
 root.style.cssText='position:fixed;inset:0;z-index:2147483000;background:#000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .35s';
 const video=document.createElement('video');video.src=url(SRC);video.poster=url(POSTER);video.playsInline=true;video.autoplay=true;video.preload='auto';
 video.style.cssText='max-width:100%;max-height:100%;width:100%;height:100%;object-fit:contain;background:#000';
 const skip=document.createElement('button');skip.type='button';skip.textContent='건너뛰기 ▸';
 skip.style.cssText='position:absolute;right:max(16px,3vw);bottom:max(16px,4vh);padding:8px 16px;font:14px "Malgun Gothic",sans-serif;color:#efe6da;background:rgba(20,16,14,.72);border:1px solid #7b6a55;border-radius:6px;cursor:pointer';
 root.append(video,skip);document.body.appendChild(root);requestAnimationFrame(()=>{root.style.opacity='1';});
 const key=e=>{if(['Escape','Enter',' ','Spacebar'].includes(e.key)){e.preventDefault();e.stopPropagation();close('skip');}};
 open={root,video,key};stats.shown++;document.addEventListener('keydown',key,true);
 skip.addEventListener('click',e=>{e.stopPropagation();close('skip');});root.addEventListener('click',()=>close('skip'));
 video.addEventListener('ended',()=>close('ended'));video.addEventListener('error',()=>{stats.errors++;lastError='video error';close('error');});
 const p=video.play?.();if(p&&typeof p.catch==='function')p.catch(()=>{video.muted=true;video.play().catch(e=>{stats.errors++;lastError=String(e?.message||e);close('error');});});
 return true;}
if(typeof newGame==='function'){const base=newGame;newGame=async function(...a){const r=await base.apply(this,a);try{show();}catch(e){stats.errors++;lastError=String(e?.message||e);}return r;};}
function set(k,v){prefs[k]=!!v;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_INTRO_R140__=Object.freeze({show,close,set,inspect:()=>({revision:'R140-intro-1',prefs:{...prefs},stats:{...stats},open:!!open,lastError})});
})();
