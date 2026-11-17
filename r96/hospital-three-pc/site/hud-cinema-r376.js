// R376 — 영화 모드 화면 정리 + 영웅 초상화(사용자 2026-11-06 "왼쪽아래 영웅초상화도 영웅선택처럼 멋있는걸로 나오게해주고, 영화모드길잡이에서는 맨위 맨아래 ui들 다없애고
//  길잡이표시도 없애 오직 전투화면과 자막정도만나오게 esc누르면 설정메뉴 나오면서 영화모드 자동종료하도록").
//  ① 영화 모드(R370)가 켜져 있는 동안: 위 줄(header)·아래 줄(footer)·알림 줄·BGM 쪽지·미니맵·나침반·지면 길잡이 화살표·지역 글씨·모바일 단추를 모두 숨기고,
//     게임 화면을 창 전체로 넓힌다. 남는 것은 전투 화면(캔버스·조명·효과)과 R370 자막, 그리고 영상 장면(R309·R368·R369·R372)뿐이다.
//     지면 화살표는 R100 설정 nav 를 잠깐 끄고(원래 값을 storyworld.r376.navRestore 에 기억) 영화 모드가 끝나면 되돌린다.
//  ② Esc(모바일은 화면 누르기): 영화 모드를 끄고 설정 창을 연다. 창·서사·로딩·영상 중에는 원래 키 처리 그대로.
//  ③ 왼쪽 아래 초상화: 엔진의 작은 서 있는 그림 대신 영웅 선택창과 같은 R108 초상화(assets/r108/heroes/<영웅>.webp)를
//     영웅 색 기운·금테·안쪽 그늘·느린 숨쉬기로 보여 준다(EGO 컷인은 엔진 그대로). 그림을 못 읽으면 원래 그림으로 돌아간다.
//  끄기: localStorage storyworld.r376.hud {"portrait":false} / {"cinemaHide":false}.
(()=>{'use strict';
if(window.__STORYWORLD_HUD_CINEMA_R376__)return;
const REV='R376-hud-cinema-1',KEY='storyworld.r376.hud',NAV_KEY='storyworld.r376.navRestore';
let prefs={portrait:true,cinemaHide:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');for(const k of Object.keys(prefs))if(typeof s?.[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={hides:0,shows:0,escExits:0,tapExits:0,portraits:0,portraitErrors:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const cinema=()=>window.__STORYWORLD_CINEMA_MODE_R370__;
const cinemaOn=()=>{try{return cinema()?.prefs?.().on===true;}catch(_){return false;}};
const solo=()=>{const c=window.__STORYWORLD_COOP_SIM_R62__;try{return !c?.mode||c.mode()==='off';}catch(_){return true;}};
// 영상 장면이 열려 있으면 키·누르기는 영상 쪽이 처리한다.
const videoOpen=()=>!!document.querySelector('#r309v,#r309,#r368v,#r369v,#r372v');
// ── ① 화면 정리 ──
const KEEP_BODY=['stage','modal','r370Subs','r309v','r309','r368v','r369v','r372v','fatal','r376CineHint'];
const HIDE_STAGE=['minipanel','banner','navCompassR100','phase1-labels','combat-hud-r51','touchUse','mobileSettingsR63','goldHudR72','mobileMapR74','touchActionsR100','heroCard','joystick','joystickR63'];
function css(){if(document.getElementById('r376HudCss'))return;const s=document.createElement('style');s.id='r376HudCss';
 s.textContent='body.r376cine>:not('+KEEP_BODY.map(i=>'#'+i).join('):not(')+'):not(script):not(style){display:none!important}'
 +HIDE_STAGE.map(i=>'body.r376cine #'+i).join(',')+'{display:none!important}'
 +'body.r376cine #stage{inset:0!important;top:0!important;bottom:0!important;left:0!important;right:0!important;width:100vw!important;height:100vh!important;height:100dvh!important}'
 +'body.r376cine #r370Subs{bottom:calc(7vh + env(safe-area-inset-bottom,0px))!important}'
 +'#r376CineHint{position:fixed;left:50%;top:calc(18px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:9001;pointer-events:none;padding:6px 14px;border-radius:5px;background:rgba(8,6,8,.55);color:#d9cbb2;font:13px "Malgun Gothic",sans-serif;letter-spacing:.04em;opacity:0;transition:opacity .8s ease}'
 +'#r376CineHint.on{opacity:.92}'
 // ③ 초상화 틀
 +'#r376Pf{position:relative;display:inline-block;flex:none;line-height:0;border-radius:3px;overflow:hidden;--hc:#d2b77e;'
 +'background:radial-gradient(ellipse 80% 70% at 50% 34%,color-mix(in srgb,var(--hc) 46%,transparent),transparent 72%),linear-gradient(180deg,#1d1517,#08080b);'
 +'box-shadow:0 0 0 1px #000,0 0 0 2px #9a7b45,0 0 0 3px #1a1208,0 0 16px -3px var(--hc),0 4px 10px #000c}'
 +'#r376Pf #portrait{object-fit:cover!important;object-position:50% 14%!important;border:0!important;background:none!important;display:block;transform-origin:50% 30%;animation:r376Breath 7s ease-in-out infinite}'
 +'#r376Pf:before{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(180deg,rgba(255,236,200,.16),transparent 22%,transparent 62%,rgba(6,4,6,.82)),radial-gradient(ellipse 120% 90% at 50% 40%,transparent 55%,rgba(0,0,0,.7))}'
 +'#r376Pf:after{content:"";position:absolute;inset:2px;z-index:2;pointer-events:none;border:1px solid rgba(214,182,120,.38);border-radius:2px;'
 +'background:linear-gradient(#e2c27d,#e2c27d) 0 0/7px 1px no-repeat,linear-gradient(#e2c27d,#e2c27d) 0 0/1px 7px no-repeat,linear-gradient(#e2c27d,#e2c27d) 100% 0/7px 1px no-repeat,linear-gradient(#e2c27d,#e2c27d) 100% 0/1px 7px no-repeat,'
 +'linear-gradient(#e2c27d,#e2c27d) 0 100%/7px 1px no-repeat,linear-gradient(#e2c27d,#e2c27d) 0 100%/1px 7px no-repeat,linear-gradient(#e2c27d,#e2c27d) 100% 100%/7px 1px no-repeat,linear-gradient(#e2c27d,#e2c27d) 100% 100%/1px 7px no-repeat}'
 +'#r376Pf .glow{position:absolute;left:-20%;right:-20%;bottom:-30%;height:60%;z-index:1;pointer-events:none;background:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--hc) 55%,transparent),transparent 70%);mix-blend-mode:screen;opacity:.55;animation:r376Glow 5s ease-in-out infinite}'
 +'@keyframes r376Breath{0%,100%{transform:scale(1)}50%{transform:scale(1.035)}}@keyframes r376Glow{0%,100%{opacity:.4}50%{opacity:.7}}'
 +'#heroCard.mobile-hud-r63 #r376Pf{display:none!important}'
 +'@media (prefers-reduced-motion:reduce){#r376Pf #portrait,#r376Pf .glow{animation:none}}';
 document.head.appendChild(s);}
let hidden=false,hintEl=null,hintTimer=0;
function polish(){return window.__STORYWORLD_POLISH_R100__;}
function navOff(){try{const P=polish();if(!P?.set||!P?.prefs)return;const cur=P.prefs();if(cur?.nav===false)return;
  try{localStorage.setItem(NAV_KEY,'1');}catch(_){}P.set({nav:false});}catch(e){fail(e);}}
function navBack(){try{let had=null;try{had=localStorage.getItem(NAV_KEY);}catch(_){}if(had!=='1')return;const P=polish();if(P?.set)P.set({nav:true});try{localStorage.removeItem(NAV_KEY);}catch(_){}}catch(e){fail(e);}}
function relayout(){try{dispatchEvent(new Event('resize'));}catch(_){}try{if(typeof resize==='function')resize();}catch(_){}}
const coarse=()=>{try{return matchMedia('(pointer:coarse)').matches;}catch(_){return false;}};
function hint(){try{if(!hintEl||!hintEl.isConnected){hintEl=document.createElement('div');hintEl.id='r376CineHint';document.body.appendChild(hintEl);}
 hintEl.textContent=coarse()?'영화 모드 · 화면을 누르면 끝내고 설정으로':'영화 모드 · Esc 를 누르면 끝내고 설정으로';hintEl.classList.add('on');clearTimeout(hintTimer);hintTimer=setTimeout(()=>hintEl&&hintEl.classList.remove('on'),3800);}catch(e){fail(e);}}
function want(){return prefs.cinemaHide&&cinemaOn()&&solo()&&G(()=>started,false);}
function sync(){try{const w=want();if(w===hidden)return;hidden=w;css();document.body.classList.toggle('r376cine',w);
 if(w){stats.hides++;navOff();hint();}else{stats.shows++;navBack();if(hintEl)hintEl.classList.remove('on');}
 relayout();setTimeout(relayout,60);}catch(e){fail(e);}}
// ── ② Esc / 화면 누르기 → 영화 모드 끄고 설정 ──
function busy(){return G(()=>modal,false)||G(()=>loading,false)||G(()=>storyScene,null)||!G(()=>started,false)||videoOpen();}
function exitToSettings(){try{cinema()?.set?.({on:false});}catch(e){fail(e);}sync();try{if(typeof showSettings==='function')showSettings();}catch(e){fail(e);}}
addEventListener('keydown',e=>{try{if(e.key!=='Escape'||e.repeat||!hidden||busy())return;e.preventDefault();e.stopImmediatePropagation();stats.escExits++;exitToSettings();}catch(err){fail(err);}},true);
addEventListener('pointerdown',e=>{try{if(!hidden||busy()||e.pointerType==='mouse')return;if(!e.target?.closest?.('#stage'))return;e.preventDefault();e.stopImmediatePropagation();stats.tapExits++;exitToSettings();}catch(err){fail(err);}},true);
// ── ③ 초상화 ──
const heroArtUrl=id=>{try{return urlFor(heroArt[id].idle.front);}catch(_){return null;}};
const r108=id=>{try{return urlFor(window.__STORYWORLD_HEROES_R108__?.portraitPath?.(id)||('assets/r108/heroes/'+id+'.webp'));}catch(_){return 'assets/r108/heroes/'+id+'.webp';}};
const bad=new Set();
function frame(img){let f=img.parentElement;if(f?.id==='r376Pf')return f;f=document.createElement('span');f.id='r376Pf';img.parentNode.insertBefore(f,img);f.appendChild(img);const g=document.createElement('i');g.className='glow';f.appendChild(g);
 img.addEventListener('error',()=>{try{const id=G(()=>player?.hero,null);if(id&&img.src.includes('/r108/heroes/')){bad.add(id);stats.portraitErrors++;const u=heroArtUrl(id);if(u)img.src=u;}}catch(err){fail(err);}});return f;}
function portrait(){try{if(!prefs.portrait)return;const img=document.getElementById('portrait'),id=G(()=>player?.hero,null);if(!img||!id||bad.has(id))return;css();const f=frame(img);
 let col='#d2b77e';try{col=HEROES?.[id]?.color||col;}catch(_){}if(f.style.getPropertyValue('--hc')!==col)f.style.setProperty('--hc',col);
 // 엔진이 기본 그림(서 있는 앞모습)을 넣었을 때만 바꾼다 — EGO 컷인 등 다른 그림은 그대로.
 const src=img.getAttribute('src')||'',base=heroArtUrl(id);if(base&&(src===base||img.src===new URL(base,location.href).href)){img.src=r108(id);stats.portraits++;}}catch(e){fail(e);}}
try{if(typeof refreshIcons==='function'){const base=refreshIcons;refreshIcons=function(...a){const r=base.apply(this,a);portrait();return r;};}}catch(e){fail(e);}
setInterval(()=>{sync();portrait();},250);
// 처음 실릴 때 영화 모드가 꺼져 있는데 기억해 둔 nav 되돌리기가 남았으면(영화 모드 중 창을 닫은 경우) 되돌린다.
setTimeout(()=>{if(!want())navBack();},1500);
function set(p={}){for(const k of Object.keys(prefs))if(typeof p[k]==='boolean')prefs[k]=p[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}sync();return{...prefs};}
window.__STORYWORLD_HUD_CINEMA_R376__=Object.freeze({revision:REV,KEEP_BODY,HIDE_STAGE,set,sync,portrait,exitToSettings,
 inspect:()=>({revision:REV,prefs:{...prefs},hidden,cinema:cinemaOn(),bodyClass:document.body.classList.contains('r376cine'),portraitSrc:document.getElementById('portrait')?.getAttribute('src')||null,framed:!!document.getElementById('r376Pf'),stats:{...stats},lastError})});
})();
