// R667 — 타이틀 화면(메인 메뉴) 뒤에 천천히 움직이는 10초 이음매 없는 배경 루프 영상.
// 사용자 2026-11-11: "타이틀 화면 배경 영상: 메인 메뉴 뒤에 천천히 움직이는 10초 루프예요. 첫인상이 좋아져요."
//  · 그림: 사용자 오프닝 영상(assets/r309/intro/opening-hapil.mp4) 18.50초의 악마화된 나무·무너진 회랑 한 장면에
//    10초마다 처음으로 돌아오는 움직임(느린 숨쉬기 카메라·붉은 핏줄 맥동·불꽃 깜빡임·떠오르는 불티·흐르는 안개·먼 하늘 번쩍임 1회)만 얹었다.
//    만드는 법은 scripts/build-title-loop-r667.py(960×540 24fps, 소리 없음, 약 0.46MB). 생성 도구 표시는 delogo 로 지움.
//  · 영상은 Cloudflare(R615 asset-cdn, assets/r667/title-video/)에서 받고, 실패하면 GitHub Pages 를 한 번 더 묻고, 그래도 안 되면 정지 이미지(포스터, Pages)로 남는다.
//    자동 재생이 막히거나(play 거부) 움직임 줄이기·데이터 절약 설정이면 처음부터 정지 이미지만.
//  · 자리: 타이틀 창(#panel 안 #newBtn 또는 #campaignNew54)이 열려 있을 때만 #modal 안 #panel 뒤에 깔린다. 그동안 #modal 의 어두운 막·흐림(blur)은 걷고
//    #panel 은 원래 색 그대로 반투명하게(0.97→0.80) 해 영상이 비치게 한다(흐림을 끄니 그리기 비용도 준다). 다른 창으로 바뀌거나 창이 닫히면 바로 치우고 영상 디코더를 풀어 준다.
//    탭이 숨으면 멈춘다. 게임 tick·draw·진행·세이브는 건드리지 않는다.
//  · 자동 검사(navigator.webdriver)에서는 ?title667=1 일 때만(CI 타이틀 기준 화면 유지).
//  · 끄기: localStorage storyworld.r667.titlebg {on:false} 또는 API set({on:false}).
(()=>{'use strict';
if(window.__STORYWORLD_TITLE_BG_R667__)return;
const REV='R667-title-bg-video-2',KEY='storyworld.r667.titlebg',ID='r667t',SRC='assets/r667/title-video/loop.mp4',POSTER='assets/r667/title-poster.jpg';
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');if(s&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={shown:0,hidden:0,plays:0,errors:0,rejects:0};let root=null,video=null,mode='idle',cdnFailed=false,localFailed=false,dead=false,lastError=null,want=false;
const q=(()=>{try{return new URLSearchParams(window.location?.search||'').get('title667');}catch(_){return null;}})();
function allowed(){if(!prefs.on)return false;try{if(navigator.webdriver&&q!=='1')return false;}catch(_){}return true;}
function stillOnly(){if(q==='still')return true;try{if(navigator.connection?.saveData)return true;}catch(_){}
 try{if(typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches)return true;}catch(_){}return false;}
const $=id=>document.getElementById(id);
function isTitle(){const m=$('modal'),p=$('panel');if(!m||!p||m.classList.contains('hidden'))return false;return !!(p.querySelector('#newBtn')||p.querySelector('#campaignNew54'));}
function style(){if($('r667style'))return;const s=document.createElement('style');s.id='r667style';
 s.textContent='#'+ID+'{position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:#080c11 center/cover no-repeat}'
 +'#'+ID+' video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .9s ease}'
 +'#'+ID+'.playing video{opacity:1}'
 +'#'+ID+'::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,#03070b30 0%,#03070b26 45%,#03070bb0 100%)}'
 +'#modal.r667on{background:#03070b2e;backdrop-filter:none;-webkit-backdrop-filter:none}'
 // 타이틀 창의 원래 따뜻한 갈색 그라데이션(135deg, rgb 39,33,27 → 17,17,16)은 그대로, 투명도만 낮춘다.
 +'#modal.r667on>#panel{z-index:1;background:linear-gradient(135deg,rgba(39,33,27,.80),rgba(17,17,16,.74));box-shadow:0 25px 90px #000d}'
 +'@media (max-width:720px){#modal.r667on>#panel{background:linear-gradient(135deg,rgba(39,33,27,.88),rgba(17,17,16,.84))}}';
 (document.head||document.body).appendChild(s);}
function releaseVideo(){if(!video)return;const v=video;video=null;try{v.pause();}catch(_){}try{v.removeAttribute('src');v.load();}catch(_){}try{v.remove();}catch(_){}}
function cdnApi(){return window.__STORYWORLD_ASSET_CDN__||null;}
function startVideo(url){if(!root||dead)return;releaseVideo();const v=document.createElement('video');video=v;
 v.muted=true;v.defaultMuted=true;v.loop=true;v.playsInline=true;v.controls=false;v.preload='auto';v.disablePictureInPicture=true;
 try{v.setAttribute('muted','');v.setAttribute('playsinline','');v.setAttribute('aria-hidden','true');}catch(_){}
 v.addEventListener('playing',()=>{if(video===v&&root){root.classList.add('playing');mode='video';try{cdnApi()?.isCdn?.(v.src)&&cdnApi()?.ok?.();}catch(_){}}});
 v.addEventListener('error',()=>{if(video!==v)return;stats.errors++;lastError='media error '+String(v.src).slice(0,120);onFail(v.src);});
 v.src=url;root.appendChild(v);play();}
// 실패만 기록한다(R667b, Codex P2): 성공한 출처는 다음에 타이틀로 돌아왔을 때 다시 고른다. Cloudflare 실패 → GitHub 한 번 → 둘 다 실패면 정지 이미지.
function onFail(url){const A=cdnApi();let isCdn=false;try{isCdn=!!A?.isCdn?.(url);}catch(_){}
 if(isCdn){cdnFailed=true;try{A.fail(url,'title video');}catch(_){}if(!localFailed){startVideo(SRC);return;}}
 else localFailed=true;
 dead=true;mode='poster';releaseVideo();if(root)root.classList.remove('playing');}
function play(){const v=video;if(!v||document.hidden)return;stats.plays++;let p;try{p=v.play();}catch(e){p=Promise.reject(e);}
 if(p&&typeof p.then==='function')p.catch(e=>{if(video!==v)return;
  // 탭 숨김 등으로 우리가 pause() 해서 끊긴 재생(AbortError)은 실패가 아니다 — 보이면 visibilitychange 가 다시 튼다(R667b, Codex P2).
  if(e?.name==='AbortError'||document.hidden){lastError='play aborted';return;}
  stats.rejects++;lastError=String(e?.message||e).slice(0,160);dead=true;mode='poster';releaseVideo();root?.classList.remove('playing');});}
let deferred=false;
// R615 태그가 이 스크립트보다 뒤에 붙어 있어도 쓰도록 API 가 아직 없으면 한 번만 다음 차례로 미룬다.
function chooseAndStart(){if(!root||dead||video)return;const A=cdnApi();if(!A&&!deferred){deferred=true;setTimeout(chooseAndStart,0);return;}
 const go=()=>{if(!root||dead||video||!want)return;let u=SRC;try{if(A&&!cdnFailed){u=A.url(SRC)||SRC;}}catch(_){u=SRC;}
  if(u===SRC&&localFailed){dead=true;mode='poster';return;}startVideo(u);};
 if(A&&A.ready&&typeof A.ready.then==='function')A.ready.then(go,go);else go();}
function show(){style();const m=$('modal'),p=$('panel');if(!m||!p)return;
 if(!root||!root.isConnected||root.parentNode!==m){if(root)try{root.remove();}catch(_){}root=document.createElement('div');root.id=ID;root.setAttribute('aria-hidden','true');
  root.style.backgroundImage='url("'+POSTER+'")';m.insertBefore(root,p);stats.shown++;}
 if(!m.classList.contains('r667on'))m.classList.add('r667on');
 if(stillOnly()||dead){mode='poster';return;}
 if(video){if(video.paused)play();return;}mode='loading';chooseAndStart();}
function hide(){const m=$('modal');if(m&&m.classList.contains('r667on'))m.classList.remove('r667on');if(!root)return;releaseVideo();try{root.remove();}catch(_){}root=null;stats.hidden++;if(!dead)mode='idle';}
let busy=false;
function sync(){if(busy)return;busy=true;try{want=allowed()&&isTitle();if(want)show();else hide();}catch(e){lastError=String(e?.message||e).slice(0,200);}finally{busy=false;}}
try{if(typeof showTitle==='function'){const base=showTitle;showTitle=function(...a){const r=base.apply(this,a);sync();return r;};}}catch(_){}
try{if(typeof MutationObserver==='function'){const mo=new MutationObserver(()=>sync());const hook=()=>{const m=$('modal'),p=$('panel');if(m)mo.observe(m,{attributes:true,attributeFilter:['class']});if(p)mo.observe(p,{childList:true});return !!(m&&p);};
 if(!hook()&&typeof addEventListener==='function')addEventListener('DOMContentLoaded',()=>{hook();sync();});}}catch(_){}
try{document.addEventListener('visibilitychange',()=>{if(!video)return;if(document.hidden){try{video.pause();}catch(_){}}else if(want)play();});}catch(_){}
style();sync();
window.__STORYWORLD_TITLE_BG_R667__=Object.freeze({revision:REV,KEY,src:SRC,poster:POSTER,sync,
 set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}sync();},
 inspect:()=>({revision:REV,prefs:{...prefs},mode,title:isTitle(),shown:!!root,video:video?String(video.src):null,errors:stats.errors+stats.rejects,stats:{...stats},lastError})});
})();
