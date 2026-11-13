// R1002 — 최종보스 '교주의 사몽'(cult04) 연출을 Dots 프레임 시트로 바꾼다(CX-0088FB r1 FB-01~06, 사용자 상시 규칙: 이펙트 최종본은 프레임 시트).
//  R950 이 코드 선·원으로 그리던 임시 연출 여섯 가지를 시트로 그린다. 언제·어디에 나오는지(단계·시간·좌표)는 R950 그대로이고, 여기는 그림만 맡는다.
//  · FB-01 지배 연결 신경선(24장 반복): 합일 코어 → 연결 끝. 길이에 맞춰 가로로만 늘린다(굵기는 고정). 왼쪽으로 뻗는 가닥은 위아래를 뒤집어
//    그림의 윗면(빛 받는 쪽)이 늘 화면 위를 보게 한다. 가닥마다 맥동 박자를 4장씩 어긋나게 한다.
//  · FB-02 연결 끊김(12장 한 번, 마지막 장은 빈 칸): 대수문장을 쓰러뜨릴 때 그 가닥 자리에서. 시트의 다발 길이(311px)가 FB-01(489px)과 달라
//    다발 양 끝을 가닥 양 끝에 맞추고 굵기는 FB-01 과 같게 맞춘다.
//  · FB-03 꿰매기(16장 한 번): 최종 형태가 설 때 발밑에서 몸 높이까지. 코어에서 발밑까지는 FB-01 한 가닥이 뻗어 온다.
//  · FB-04 꿰매기 실패(16장 한 번, 마지막 장은 빈 칸): 최종 처치 뒤 쓰러진 자리에서. 코어 쪽 가닥은 65% 에서 멈칫한 뒤 FB-02 로 끊어진다.
//  · FB-05 합일 코어 맥동(16장 반복): 제단 위에 떠 있는 검붉은 결정 심장(정본: 코어 안에 아직 수많은 사람이 남아 있다).
//  · FB-06 사몽 권한의 고리(영웅 발밑): 시트 24장은 빛점이 78.8° 돌고 처음으로 18.9° 되돌아간다(Dots 표기 HOLD 사유). 빛점 여섯 개가 60° 간격이라
//    1~19번 장(57.3°)만 쓰면 다음 장이 2.7° 차이로 1번과 이어진다 → 19장을 각도 표로 골라 일정한 빠르기로 돌린다.
//    R950 이 바닥에 붙은 그림(groundAligned)으로 그려 영웅 발밑에 깔린다.
//  헤드리스 실측으로 함께 고친 것(R950 쪽): ① 비스듬한 가닥이 영웅 근처에서 통째로 사라짐(R350 가림 옅게 → 교주 쪽 그림은 소유자 이름 'r950:boss:…')
//  ② 최종 처치 직후 마지막 서사 창이 열려 게임 시간이 멈추면 '꿰매기 실패'가 첫 장에서 멈춤 → 창이 열린 동안은 실제 시간으로 흐르는 연출 시계.
//  시트가 아직 안 읽혔거나 꺼져 있으면 false 를 돌려 R950 이 원래 코드 그림을 그린다. 판정·체력·서사·순서는 건드리지 않는다.
//  끄기: localStorage['storyworld.r1002.finaleFx']='{"on":false}'
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_FINALE_FX_R1002__)return;
const REV='R1002-finale-fx-1',KEY='storyworld.r1002.finaleFx',DIR='assets/r1002/',FPS=12.5;
// 게임 화면 실측(헤드리스): 가는 반투명 선(꿰맴 가닥·고리)은 방 안개 아래서 흐려 두 번 겹쳐 그려 또렷하게 한다. 코어는 안개에 바래 채도·밝기를 조금 올린다
// (기록기가 받는 필터는 brightness·contrast·saturate·grayscale·hue-rotate 뿐).
const PASSES=2,CORE_FILTER='saturate(1.3) brightness(1.15)';
const S=Object.freeze({
 link:    Object.freeze({path:DIR+'fb-nerve-link-loop.webp',w:2048,h:768,cw:512,ch:128,cols:4,n:24,x0:12,x1:500,cy:64.9,band:72}),
 snap:    Object.freeze({path:DIR+'fb-nerve-link-snap.webp',w:2048,h:384,cw:512,ch:128,cols:4,n:12,x0:102,x1:412,cy:50.5,band:56}),
 stitch:  Object.freeze({path:DIR+'fb-nerve-stitch.webp',w:1024,h:2048,cw:256,ch:512,cols:4,n:16,px:128,py:496,rise:317,fps:10}),
 unstitch:Object.freeze({path:DIR+'fb-nerve-unstitch-fail.webp',w:1024,h:2048,cw:256,ch:512,cols:4,n:16,px:128,py:495,rise:317,fps:10}),
 core:    Object.freeze({path:DIR+'fb-core-pulse.webp',w:1024,h:1024,cw:256,ch:256,cols:4,n:16,px:128,py:240,body:199}),
 ring:    Object.freeze({path:DIR+'fb-samong-ring.webp',w:1024,h:768,cw:256,ch:128,cols:4,n:19,px:128,py:64,rx:100,speed:36,
  // 1~19번 장 빛점 각도(도, 실측 누적). 60° 가 한 바퀴(빛점 간격).
  ang:Object.freeze([0,0,.6,.6,3.1,4.5,6.3,8.6,12.7,16.2,19.1,23,28.3,34,38.3,41.4,47.2,52.6,57.3])})});
const stats={link:0,snap:0,stitch:0,unstitch:0,core:0,ring:0,fallbacks:0,errors:0,lastError:null};
const last={};// 종류별 마지막으로 그린 장(검사·실측용)
const asked={};let prefAt=-1e9,prefOn=true;
const num=v=>typeof v==='number'&&Number.isFinite(v);
const c01=v=>num(v)?Math.max(0,Math.min(1,v)):0;
function fail(err){stats.errors++;stats.lastError=String(err&&err.message||err).slice(0,200);}
function readOn(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return !(v&&v.on===false);}catch(_){return true;}}
function on(){const n=Date.now();if(n-prefAt>=1000||n<prefAt){prefAt=n;prefOn=readOn();}return prefOn;}
function set(v){try{localStorage.setItem(KEY,JSON.stringify({on:!!(v&&typeof v==='object'?v.on:v)}));}catch(_){}prefAt=-1e9;return on();}
function img(sh){try{const g=typeof readyImage==='function'?readyImage(sh.path):null;if(g&&g.image)return g.image;const n=Date.now();
  if(n-(asked[sh.path]||-1e9)>=1500){asked[sh.path]=n;if(typeof ensureImages==='function')Promise.resolve(ensureImages([sh.path])).catch(()=>{});}}catch(err){fail(err);}return null;}
function get(sh){if(!on())return null;const im=img(sh);if(!im){stats.fallbacks++;return null;}return im;}
function warm(){if(!on())return;for(const k in S)img(S[k]);}
const cell=(sh,f)=>[(f%sh.cols)*sh.cw,Math.floor(f/sh.cols)*sh.ch];
const mod=(a,n)=>((a%n)+n)%n;
// 코어→끝으로 뻗는 한 가닥(FB-01 반복 / FB-02 끊김). a,b 화면 좌표, thick 화면 굵기(px), reach 0..1(코어 쪽부터 드러나는 만큼)
function strand(sh,im,f,a,b,thick,alpha,reach){const dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy);last.strand=[a.x,a.y,b.x,b.y,thick,alpha,reach].map(v=>Math.round(v*100)/100);if(!(L>2)||!(thick>0))return true;
 const [sx,sy]=cell(sh,f),kx=L/(sh.x1-sh.x0),ky=thick/sh.band,r=c01(reach),sw=r>=1?sh.cw:Math.max(1,Math.round(sh.x0+(sh.x1-sh.x0)*r));
 ctx.save();try{ctx.globalAlpha*=c01(alpha);ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(dy,dx));if(dx<0)ctx.scale(1,-1);
  ctx.drawImage(im,sx,sy,sw,sh.ch,-sh.x0*kx,-sh.cy*ky,sw*kx,sh.ch*ky);}finally{ctx.restore();}return true;}
function link(a,b,t,k,thick,alpha,reach){try{if(!a||!b||!num(a.x+a.y+b.x+b.y+t))return false;const im=get(S.link);if(!im)return false;
  const f=mod(Math.floor(t*FPS)+(k|0)*4,S.link.n);strand(S.link,im,f,a,b,thick,alpha??1,reach??1);stats.link++;last.link=f;return true;}catch(err){fail(err);return false;}}
function snap(a,b,el,thick,alpha){try{if(!a||!b||!num(a.x+a.y+b.x+b.y+el))return false;const im=get(S.snap);if(!im)return false;
  const f=Math.floor(Math.max(0,el)*FPS);if(f>=S.snap.n-1)return true;/* 마지막 장은 빈 칸 — 그릴 것이 없다 */
  strand(S.snap,im,f,a,b,thick,alpha??1,1);stats.snap++;last.snap=f;return true;}catch(err){fail(err);return false;}}
// 발밑에서 솟는 다섯 가닥(FB-03 꿰매기 / FB-04 꿰매기 실패). x,y 발 화면 좌표, bodyH 몸 화면 키(px)
function rise(kind,x,y,el,bodyH,alpha){try{const sh=S[kind];if(!num(x+y+el+bodyH)||!(bodyH>0))return false;const im=get(sh);if(!im)return false;
  let f=Math.floor(Math.max(0,el)*sh.fps);if(kind==='unstitch'){if(f>=sh.n-1)return true;}else f=Math.min(sh.n-1,f);
  const [sx,sy]=cell(sh,f),k=bodyH/sh.rise;ctx.save();try{ctx.globalAlpha*=c01(alpha??1);for(let i=0;i<PASSES;i++)ctx.drawImage(im,sx,sy,sh.cw,sh.ch,x-sh.px*k,y-sh.py*k,sh.cw*k,sh.ch*k);}finally{ctx.restore();}
  stats[kind]++;last[kind]=f;return true;}catch(err){fail(err);return false;}}
const stitch=(x,y,el,bodyH,alpha)=>rise('stitch',x,y,el,bodyH,alpha);
const unstitch=(x,y,el,bodyH,alpha)=>rise('unstitch',x,y,el,bodyH,alpha);
// 합일 코어: x,y = 결정 아래 끝 화면 좌표, bodyH = 결정 화면 키(px)
function core(x,y,t,bodyH,alpha){try{const sh=S.core;if(!num(x+y+t+bodyH)||!(bodyH>0))return false;const im=get(sh);if(!im)return false;
  const f=mod(Math.floor(t*FPS),sh.n),[sx,sy]=cell(sh,f),k=bodyH/sh.body;ctx.save();try{ctx.globalAlpha*=c01(alpha??1);ctx.filter=CORE_FILTER;ctx.drawImage(im,sx,sy,sh.cw,sh.ch,x-sh.px*k,y-sh.py*k,sh.cw*k,sh.ch*k);}finally{ctx.restore();}
  stats.core++;last.core=f;return true;}catch(err){fail(err);return false;}}
// 사몽 고리: 각도 표에서 지금 각도에 가장 가까운 장
function ringFrame(t){const sh=S.ring,th=mod(t*sh.speed,60);let best=0,bd=1e9;for(let i=0;i<sh.n;i++){let d=Math.abs(sh.ang[i]-th);d=Math.min(d,60-d);if(d<bd-1e-9){bd=d;best=i;}}return best;}
function ring(x,y,t,rx,alpha){try{const sh=S.ring;if(!num(x+y+t+rx)||!(rx>0))return false;const im=get(sh);if(!im)return false;
  const f=ringFrame(t),[sx,sy]=cell(sh,f),k=rx/sh.rx;
  ctx.save();try{ctx.globalAlpha*=c01(alpha??1);for(let i=0;i<PASSES;i++)ctx.drawImage(im,sx,sy,sh.cw,sh.ch,x-sh.px*k,y-sh.py*k,sh.cw*k,sh.ch*k);}finally{ctx.restore();}
  stats.ring++;last.ring=f;return true;}catch(err){fail(err);return false;}}
window.__STORYWORLD_FINALE_FX_R1002__=Object.freeze({revision:REV,SHEETS:S,on,set,warm,link,snap,stitch,unstitch,core,ring,ringFrame,
 ready:k=>{try{return !!(S[k]&&on()&&typeof readyImage==='function'&&readyImage(S[k].path)?.image);}catch(_){return false;}},
 inspect:()=>({revision:REV,on:on(),ready:Object.fromEntries(Object.keys(S).map(k=>[k,!!(typeof readyImage==='function'&&readyImage(S[k].path)?.image)])),stats:{...stats},last:{...last},browserVerified:false,GPUVerified:false})});
})();
