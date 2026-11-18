// R1177 — 사몽 에피소드 전 구역에 남은 도트(픽셀) 그림을 칠한 그림으로(사용자 2026-11-18 "사몽에피소드쪽에 픽셀몹 및 픽셀자산 남아있던데 디스토피아 … 이미지 잘 적용").
//  헤드리스 순회(16장 45구역, 그리는 그림 경로 기록)에서 남은 도트:
//   ① S-06 디스토피아 R184 임시 픽셀 몹 시트 3종 → samong-r161.js 의 S06 표를 assets/r1177 칠한 시트(Dots 디스토피아 dys-* 를 같은 칸 규격으로 옮긴 것)로 바꿈
//   ② R163 pixelfx 도트 시트: 세뇌당한 기억의 조각이 깨질 때(pvfx-void-implosion, 28구역), 중간보스 등장 손(hands-blood),
//      피의 육망성 균열 문(pvfx-rift-portal), 기억 조각 줍기 나방(pvfx-choir-moths), 그리고 R976 이 P 에서만 바꾸던 6종(열린 끝의 문 portal-teal 등)
//  → 사몽 에피소드 구역(room.samongR103.zone = sz<번호>-…)에 있는 동안만 pixelfx 표(meta)의 그 칸을 칠한 시트로 바꿔 끼우고, 나가면 원래 칸으로 되돌린다.
//    P 구역의 R976 6종은 R976 이 맡는다(이 파일은 그 6종을 P 에서 건드리지 않는다). 부르는 쪽 코드·판정·피해·저장·서사는 그대로.
//    바꾼 시트는 한 번 재생하는 칸이면 원래와 같은 재생 길이(장수/fps), 반복 칸은 반복 그대로.
//  자산: assets/r1177(scripts/r1177-samong-pixel-art.py — R411 core24 소용돌이·촉수, Dots 잿빛 나방을 핏빛으로).
//  끄기 storyworld.r1177.samongPixel {"on":false}. API window.__STORYWORLD_SAMONG_PIXEL_ART_R1177__.
(()=>{'use strict';
if(window.__STORYWORLD_SAMONG_PIXEL_ART_R1177__)return;
const REV='R1177-samong-pixel-art-1',KEY='storyworld.r1177.samongPixel';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={swaps:0,restores:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
// 엔진 자산 경로는 '..' 를 막는다 → pixelfx 표에는 별칭 r1177/<칸>.webp 를 적고 readyImage·addImage 에서 실제 경로로(R976 과 같은 방식)
const UP='assets/',ALIAS_DIR='assets/r163/pixelfx/r1177/',ALIAS=new Map();
// 원래 칸: hands-blood 42/15, pvfx-void-implosion 14/20, pvfx-rift-portal 16/20 반복, pvfx-choir-moths 60/20 반복
const OWN=Object.freeze({
 'pvfx-void-implosion':{file:UP+'r1177/void-implosion-blood.webp',frame:[256,256],pivot:[128,150],columns:13,frames:13,fps:13/(14/20),loop:false,src:'R411 gravity-well 11-23 → 핏빛'},
 'pvfx-rift-portal':{file:UP+'r1177/rift-blood.webp',frame:[256,256],pivot:[128,150],columns:7,frames:7,fps:10,loop:true,src:'R411 gravity-well 6-12 → 핏빛'},
 'pvfx-choir-moths':{file:UP+'r1177/choir-moths-blood.webp',frame:[256,256],pivot:[128,150],columns:20,frames:20,fps:12,loop:true,src:'Dots ash-moth-v2 → 흩어지는 나방'},
 'hands-blood':{file:UP+'r1177/hands-blood.webp',frame:[256,256],pivot:[128,200],columns:6,frames:18,fps:18/(42/15),loop:false,src:'R411 tentacle-bind 0-17 → 짙은 핏빛'}});
for(const [k,v] of Object.entries(OWN))ALIAS.set(ALIAS_DIR+k+'.webp',v.file);
const real=p=>typeof p==='string'&&p.startsWith(ALIAS_DIR)?ALIAS.get(p)||null:null;
try{if(typeof readyImage==='function'){const base=readyImage;readyImage=function(p,...a){const r=real(p);return base.call(this,r||p,...a);};}
 if(typeof addImage==='function'){const base=addImage;addImage=function(p,...a){const r=real(p);return base.call(this,r||p,...a);};}}catch(e){fail(e);}
const PX=()=>window.__STORYWORLD_PIXELFX_R163__;
const P976=()=>window.__STORYWORLD_SAMONG_P_ART_R976__;
const roomNow=()=>{try{return typeof room!=='undefined'?room:null;}catch(_){return null;}};
const zoneOf=r=>{try{const z=r&&r.samongR103&&r.samongR103.zone;return typeof z==='string'?z:'';}catch(_){return '';}};
const isEpisode=z=>/^sz\d+-/.test(z),isP=z=>/^sz\d+-P-/.test(z);
// 원래 칸(처음 본 그대로, R976·이 파일이 바꾸기 전). R976 이 이미 바꿔 둔 칸(r976Path)은 원래 칸이 아니므로 그 칸은 R976 이 되돌린 뒤에 잡는다.
const pristine={};const mine=new Map(),ours=new WeakSet();// key → 이 파일이 넣은 행(같은 객체면 다시 쓰지 않음)
function remember(meta){for(const k of [...Object.keys(OWN),...Object.keys(P976()?.swap||{})]){if(pristine[k]||!meta[k])continue;const v=meta[k];if(v.r976Path||ours.has(v))continue;pristine[k]=v;}}
// 다른 덧씌우기가 이미 칠한 시트로 바꾼 칸(예: R1028 촉수 'r1028/…')은 건드리지 않는다 — 원래 도트 칸(하위 폴더 없는 파일)만 바꾼다.
const isPixelRow=v=>!!v&&typeof v.file==='string'&&!v.file.includes('/');
function rowFor(k,base){if(!isPixelRow(base))return null;if(OWN[k]){const {src,file,...row}=OWN[k];return {...base,...row,file:'r1177/'+k+'.webp',pivot:row.pivot.slice(),frame:row.frame.slice(),r1177:src,r1177Path:file};}
 const s=P976()?.swap?.[k];if(!s)return null;const {src,file,...row}=s;return {...base,...row,file:'r976/'+k+'.webp',pivot:row.pivot.slice(),frame:row.frame.slice(),r976:src,r976Path:file};}/* R976 칸에는 r1177 표시를 달지 않는다 — R976 이 P 에서 이 행을 펼쳐 쓰므로 표시가 새어 나가면 R976 행을 이 파일 것으로 오인 */
function step(){const X=PX(),meta=X&&typeof X.meta==='function'?X.meta():null;if(!meta)return;remember(meta);
 const z=zoneOf(roomNow()),ep=prefs.on&&isEpisode(z),inP=isP(z);let sw=0,rs=0;
 for(const k of Object.keys(pristine)){const own=!!OWN[k];
  if(!own&&inP&&prefs.on)continue;// P 의 R976 6종은 R976 몫
  if(ep){let row=mine.get(k);if(!row){row=rowFor(k,pristine[k]);if(!row)continue;mine.set(k,row);ours.add(row);}if(meta[k]!==row){meta[k]=row;sw++;}}
  else if(meta[k]!==pristine[k]&&ours.has(meta[k])){meta[k]=pristine[k];rs++;}}
 if(sw)stats.swaps++;if(rs)stats.restores++;}
try{if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{step();}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}try{step();}catch(e){fail(e);}}
window.__STORYWORLD_SAMONG_PIXEL_ART_R1177__=Object.freeze({revision:REV,set,swap:OWN,resolve:p=>real(p),
 inspect:()=>({revision:REV,prefs:{...prefs},zone:zoneOf(roomNow()),stats:{...stats},swapped:[...mine.keys()].filter(k=>PX()?.meta?.()?.[k]===mine.get(k)),lastError})});
})();
