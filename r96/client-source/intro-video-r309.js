// R309 — 새 게임 오프닝 영상(사용자 2026-11-04 직접 만든 opening.mp4, "이거 오프닝으로 7초까지만 적용해줘 그이후는 잘라버려서 안나오게하고 그리고 게임제목은 합일(合一) 이거야").
//  · 영상 파일 자체를 7초 직전 장면 전환(6.958초)에서 잘랐다(assets/r309/intro/opening-7s.mp4, 1.8MB). 원본의 타락 천사 클로즈업·옛 제목 화면·게임 화면은 파일에 없다.
//  · 마지막 장면(5.5초~, 검은 날개가 나무를 에워싸는 궁전) 위에 제목 '합일(合一)'을 띄운다. 영상이 끝나면 마지막 프레임에 멈춘 채 제목을 1초 더 보여 주고 어둡게 닫는다(7초 뒤 영상 내용은 없음).
//  · 새 게임을 시작할 때 한 번(첫 장면 hub 진입 뒤 그 위에). 세이브 불러오기·지역 이동에는 띄우지 않는다.
//  · 건너뛰기: 오른쪽 아래 단추 · 화면 누르기 · Esc/Enter/Space. 재생 중 게임 키는 막는다.
//  · 재생하는 동안 게임 BGM 음량만 0으로 내렸다가 닫을 때 그대로 되돌린다(설정값을 저장하지 않음).
//  · 소리 있는 자동재생이 막히면 소리 없이 다시 튼다. 영상을 아예 못 틀면(코덱·파일 오류) 코드 애니메이션(intro-tree-r309)을 대신 튼다.
//    6초 안에 영상이 시작되지 않으면(느린 망) 그냥 닫고 게임으로 간다.
//  · 자동 검사(navigator.webdriver)에서는 띄우지 않는다(?intro309=1 또는 play({force:true}) 로 강제). 설정 '오프닝 영상(새 게임)' / storyworld.r309.opening {on:false}.
(()=>{'use strict';
if(window.__STORYWORLD_INTRO_VIDEO_R309__)return;
const REV='R309-intro-video-1',KEY='storyworld.r309.opening',SRC='assets/r309/intro/opening-7s.mp4',POSTER='assets/r309/intro/poster.jpg',TITLE='합일(合一)',CUT=6.958,TITLE_AT=5.5,HOLD_MS=1000,STALL_MS=6000;
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={plays:0,skips:0,ended:0,errors:0,muted:0,stalled:0,fallback:0};let lastError=null,open=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
function save(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
const url=p=>{try{return typeof urlFor==='function'?urlFor(p):p;}catch(_){return p;}};
const forced=()=>{try{return /[?&]intro309=1\b/.test(location.search);}catch(_){return false;}};
// BGM 잠깐 내리기: 설정 객체 값만 바꾸고, 닫을 때 우리가 바꾼 값 그대로면 되돌린다
function duck(){try{if(typeof settings==='object'&&settings&&typeof settings.bgm==='number'){const was=settings.bgm;settings.bgm=0;return()=>{try{if(settings.bgm===0)settings.bgm=was;}catch(_){}};}}catch(_){}return()=>{};}
function css(){if(document.getElementById('r309vCss'))return;const s=document.createElement('style');s.id='r309vCss';
 s.textContent='#r309v{position:fixed;inset:0;z-index:2147483000;background:#000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .35s;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none}'
 +'#r309v video{width:100%;height:100%;object-fit:contain;background:#000}'
 +'#r309v .ttl{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);color:#f3e2c4;font:700 clamp(40px,8vw,96px)/1.1 "Gowun Batang","Noto Serif KR",serif;letter-spacing:.12em;text-shadow:0 0 22px #5a0a08,0 0 6px #000,0 4px 16px #000;opacity:0;transition:opacity .6s;pointer-events:none;white-space:nowrap}#r309v .ttl.on{opacity:1}'
 +'#r309v .skip{position:absolute;right:max(16px,3vw);bottom:max(16px,4vh);padding:8px 16px;font:14px "Malgun Gothic",sans-serif;color:#efe6da;background:rgba(20,12,12,.66);border:1px solid #7b5a55;border-radius:6px;cursor:pointer}'
 +'#r309v .fade{position:absolute;inset:0;background:#000;opacity:0;transition:opacity .45s;pointer-events:none}#r309v .fade.on{opacity:1}';document.head.appendChild(s);}
function fallback(){try{const t=window.__STORYWORLD_INTRO_TREE_R309__;if(t&&typeof t.play==='function'){stats.fallback++;t.play({force:true});return true;}}catch(e){fail(e);}return false;}
function close(reason){if(!open)return;const o=open;open=null;clearTimeout(o.stall);clearTimeout(o.hold);try{o.video.pause();}catch(_){}o.restore();
 removeEventListener('keydown',o.key,true);removeEventListener('keyup',o.keyUp,true);
 if(reason==='skip')stats.skips++;else if(reason==='ended')stats.ended++;else if(reason==='stall')stats.stalled++;
 const quick=reason==='error';o.fade.classList.add('on');setTimeout(()=>{try{o.video.removeAttribute('src');o.video.load();}catch(_){}o.root.remove();if(reason==='error')fallback();},quick?0:460);}
function play(opt={}){if(open)return false;if(typeof document==='undefined')return false;if(!opt.force&&(!prefs.on||(navigator.webdriver&&!forced())))return false;
 css();const root=document.createElement('div');root.id='r309v';root.setAttribute('role','dialog');root.setAttribute('aria-label','오프닝 영상');
 const video=document.createElement('video');video.src=url(SRC);video.poster=url(POSTER);video.playsInline=true;video.setAttribute('playsinline','');video.preload='auto';video.autoplay=true;
 if(opt.muted)video.muted=true;
 root.innerHTML='<div class="ttl">'+TITLE+'</div><button type="button" class="skip">건너뛰기 ▸</button><div class="fade"></div>';root.insertBefore(video,root.firstChild);
 document.body.appendChild(root);requestAnimationFrame(()=>{root.style.opacity='1';});
 const ttl=root.querySelector('.ttl'),fade=root.querySelector('.fade'),skip=root.querySelector('.skip');
 const key=e=>{e.preventDefault();e.stopImmediatePropagation();if(e.type==='keydown'&&(e.key==='Escape'||e.key==='Enter'||e.key===' '||e.code==='Space'))close('skip');};const keyUp=e=>{e.stopImmediatePropagation();};
 open={root,video,fade,key,keyUp,restore:duck(),stall:0,hold:0};const o=open;
 // 끝(잘린 지점)에 닿으면 멈추고 제목을 잠깐 더 보여 준 뒤 닫는다
 const atEnd=()=>{if(open!==o||o.hold)return;try{video.pause();}catch(_){}ttl.classList.add('on');o.hold=setTimeout(()=>close('ended'),HOLD_MS);};stats.plays++;
 addEventListener('keydown',key,true);addEventListener('keyup',keyUp,true);try{if(typeof keys!=='undefined'&&keys?.clear)keys.clear();}catch(_){}
 root.addEventListener('pointerdown',e=>{if(e.target===skip)return;e.preventDefault();close('skip');});skip.addEventListener('click',e=>{e.stopPropagation();close('skip');});
 let started=false;open.stall=setTimeout(()=>{if(!started)close('stall');},STALL_MS);
 video.addEventListener('playing',()=>{started=true;clearTimeout(open?.stall);});
 video.addEventListener('timeupdate',()=>{const t=video.currentTime;if(t>=TITLE_AT)ttl.classList.add('on');if(t>=CUT)atEnd();});
 video.addEventListener('ended',atEnd);
 video.addEventListener('error',()=>{fail('video error '+(video.error?.code||''));close('error');});
 const p=video.play?.();if(p&&typeof p.catch==='function')p.catch(()=>{if(!open||open.video!==video)return;video.muted=true;stats.muted++;video.play().catch(e=>{fail(e);close('error');});});
 return true;}
// 새 게임 시작 때 한 번(첫 장면 진입 뒤 그 위에)
if(typeof newGame==='function'){const base=newGame;newGame=async function(...a){const r=await base.apply(this,a);try{if(r!==false)play();}catch(e){fail(e);}return r;};}
try{if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{const grid=document.querySelector('#panel .settings');if(grid&&!document.getElementById('r309On')){const l=document.createElement('label'),c=document.createElement('input');c.type='checkbox';c.id='r309On';c.checked=prefs.on!==false;c.onchange=()=>{prefs.on=c.checked;save();};l.appendChild(c);l.appendChild(document.createTextNode(' 오프닝 영상(새 게임)'));grid.appendChild(l);}}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
function set(p){if(typeof p?.on==='boolean'){prefs.on=p.on;save();}return{on:prefs.on};}
window.__STORYWORLD_INTRO_VIDEO_R309__=Object.freeze({revision:REV,src:SRC,title:TITLE,cut:CUT,play,skip:()=>{if(open){close('skip');return true;}return false;},set,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},open:!!open,time:open?open.video.currentTime:null,muted:open?open.video.muted:null,lastError})});
})();
