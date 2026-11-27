/* R1379 슬레이어 Dots 시트 두 장 — SW-R1352 D11 'W 피의 희생 발밑 노바' 24칸 + D12 '사몽 피의 갑주 적중 문양' 18칸 (코디네이터 배정 2026-11-27).
 *  D11: R108 eden PRE.nova 가 슬레이어 W 때 발밑에 그리던 코드 십자가 두 장(R343 '아군=십자가', 화면 혼합)을 이 시트로 바꾼다.
 *   · 시트 1536×1024 = 6×4 칸(256), 24칸, 기준점 칸 가운데(128,128). 이미 바닥 원근(가로:세로 ≈ 2:1)으로 그려져 있어 더 누르거나 돌리지 않는다(R343 십자 똑바로).
 *   · 칸 = floor(T/life×24), life .9(R106 nova). 그린 칸 너비 = h×k×8 → 가장 넓은 칸(19번, 보이는 폭 206/256)이 예전 십자가 최대 폭(sz×.8 ≈ h×k×6.45)과 같다.
 *   · 적중 금빛 섬광·불꽃·볼트는 R108 그대로. 시트가 아직 안 받아졌으면 false → 예전 십자가.
 *   · 알파 .5(R1369 '기타 ≤.5'), source-over(먹빛 진홍이 바닥에서 바래지 않게).
 *  D12: R572 사몽 테마 적중 문양(markDraw) 슬레이어 칸의 코드 사선 세 줄+점을 이 시트로 바꾼다.
 *   · 시트 1536×768 = 6×3 칸(256), 18칸, 30fps ≈ .6초 = R572 MARK_LIFE(.6) → 칸 = floor(age×18).
 *   · 그린 칸 너비 = 문양 키 h × 2.2(보이는 폭 145/256 → 약 h×1.25 ≈ 몹 몸 폭. 헤드리스에서 1.4 는 폭 약 32px 로 적중 불꽃에 묻혀 안 읽혔음). 기준점은 R572 와 같은 몸 가운데.
 *   · 알파: R1369 몸 위 겹침 규칙 — 첫 .1초 .6, .16초까지 .3 으로 내려가고 그 뒤 .3×(시트 자체 사라짐).
 *  끄기: localStorage['storyworld.r1379']='{"on":false}' (예전 십자가·사선으로 돌아감). 점검: window.__STORYWORLD_SLAYER_DOTS_R1379__.inspect()
 * Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
if(window.__STORYWORLD_SLAYER_DOTS_R1379__)return;
const REV='R1379-slayer-dots-2',KEY='storyworld.r1379';
const NOVA=Object.freeze({p:'assets/r1379/slayer-w-nova-24.webp',cols:6,frames:24,cell:256,k:8,alpha:.5,life:.9});
const MARK=Object.freeze({p:'assets/r1379/slayer-samong-impact-18.webp',cols:6,frames:18,cell:256,k:2.2,life:.6,a0:.6,a1:.3,t0:.1,t1:.16});
const prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof s?.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={nova:0,mark:0,notReady:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const asked=new Map();
function img(p){try{const r=typeof readyImage==='function'?readyImage(p):null;const im=r?.image;if(im&&(im.naturalWidth||im.width)>0)return im;
 const t=Date.now();if(t-(asked.get(p)||0)>1500&&typeof ensureImages==='function'){asked.set(p,t);Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(e){fail(e);}return null;}
const fin=v=>typeof v==='number'&&Number.isFinite(v);
function cellOf(S,i){const f=Math.max(0,Math.min(S.frames-1,i|0));return [(f%S.cols)*S.cell,Math.floor(f/S.cols)*S.cell,S.cell,S.cell];}
/* 기록기(3D)에서는 owner 를 따로 둔다: 노바는 바닥 붙음(groundAligned — 영웅 몸이 깊이로 가리고 R350 가림 옅게 대상 아님, 헤드리스에서 .5→.13 으로 깎이던 것), 문양은 몸 위 이펙트 */
function draw(S,im,f,x,y,w,al,own){const C=typeof ctx==='object'&&ctx?ctx:null;if(!C||typeof C.drawImage!=='function')return false;const [sx,sy,sw,sh]=cellOf(S,f);
 const paint=()=>{C.save();try{C.globalAlpha=al;C.globalCompositeOperation='source-over';C.drawImage(im,sx,sy,sw,sh,x-w/2,y-w/2,w,w);}finally{C.restore();}};
 if(own&&typeof C.scope==='function')C.scope({kind:'effect',sourcePath:S.p,...own},paint);else paint();return true;}
let seq=0;
/* D11: R108 PRE.nova 가 슬레이어일 때 묻는다 — (x,y)=발밑 기준점(화면), (wx,wy)=월드 자리(기록기 owner), T=경과, life, hk=h×k. 그렸으면 true(십자가 건너뜀) */
function nova(x,y,T,life,hk,wx,wy){if(!prefs.on)return false;try{if(![x,y,T,hk].every(fin)||hk<=0)return false;const im=img(NOVA.p);if(!im){stats.notReady++;return false;}
 const L=fin(life)&&life>0?life:NOVA.life,f=Math.floor(Math.max(0,T)/L*NOVA.frames);if(f>=NOVA.frames)return true;
 if(!draw(NOVA,im,f,x,y,hk*NOVA.k,NOVA.alpha,{id:'r1379:nova:'+(seq++%64),x:wx,y:wy,groundAligned:true}))return false;stats.nova++;return true;}catch(err){fail(err);return false;}}
function markAlpha(t){const S=MARK;if(t<=S.t0)return S.a0;if(t>=S.t1)return S.a1;return S.a0+(S.a1-S.a0)*(t-S.t0)/(S.t1-S.t0);}
/* D12: R572 markDraw 슬레이어 칸이 묻는다 — (x,y)=문양 가운데, h=문양 키, age 0..1(MARK_LIFE 기준). 그렸으면 true */
function mark(x,y,h,age,wx,wy){if(!prefs.on)return false;try{if(![x,y,h,age].every(fin)||h<=0||age<0||age>1)return false;const im=img(MARK.p);if(!im){stats.notReady++;return false;}
 const f=Math.floor(age*MARK.frames);if(f>=MARK.frames)return true;
 if(!draw(MARK,im,f,x,y,h*MARK.k,markAlpha(age*MARK.life),{id:'r1379:mark:'+(seq++%64),x:wx,y:wy,groundAligned:false}))return false;stats.mark++;return true;}catch(err){fail(err);return false;}}
/* 첫 사용 때 그림이 아직 없어 십자가로 떨어지지 않게 지역마다 한 번 미리 받는다 */
let warmed='';function warm(){try{if(!prefs.on)return;const id=typeof room==='object'&&room?room.id:'';if(!id||id===warmed||typeof ensureImages!=='function')return;warmed=id;Promise.resolve(ensureImages([NOVA.p,MARK.p])).catch(()=>{});}catch(_){}}
try{if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{warm();}catch(err){fail(err);}return r;};}}catch(err){fail(err);}
function set(p={}){if(typeof p.on==='boolean')prefs.on=p.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
window.__STORYWORLD_SLAYER_DOTS_R1379__=Object.freeze({revision:REV,NOVA,MARK,nova,mark,markAlpha,set,inspect:()=>({revision:REV,prefs:{...prefs},...stats,lastError})});
})();
