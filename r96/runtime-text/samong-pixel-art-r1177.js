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
let prefs={on:true,mobHit:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={swaps:0,restores:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
// 엔진 자산 경로는 '..' 를 막는다 → pixelfx 표에는 별칭 r1177/<칸>.webp 를 적고 readyImage·addImage 에서 실제 경로로(R976 과 같은 방식)
const UP='assets/',ALIAS_DIR='assets/r163/pixelfx/r1177/',ALIAS=new Map();
// 원래 칸: hands-blood 42/15, pvfx-void-implosion 14/20, pvfx-rift-portal 16/20 반복, pvfx-choir-moths 60/20 반복
const OWN=Object.freeze({
 'pvfx-void-implosion':{file:UP+'r1177/void-implosion-blood.webp',frame:[256,256],pivot:[128,150],columns:13,frames:13,fps:13/(14/20),loop:false,src:'R411 gravity-well 11-23 → 핏빛'},
 // R1177c: 균열 문·나방·손은 Dots CX-0156SP C2·C3·C4(ROUGH r1, scripts/r1177c-samong-fx-sheets.py) — 전에 쓰던 R411 물들인 시트(rift-blood·choir-moths-blood·hands-blood)는 보존
 'pvfx-rift-portal':{file:UP+'r1177/crimson-fissure-12.webp',frame:[256,256],pivot:[128,160],columns:4,frames:12,fps:10,loop:true,dots:true,src:'Dots CX-0156SP C2 핏빛 땅 균열(육망성 무늬 없이)'},
 'pvfx-choir-moths':{file:UP+'r1177/ash-crimson-moths-16.webp',frame:[256,256],pivot:[128,128],columns:4,frames:16,fps:12,loop:true,dots:true,src:'Dots CX-0156SP C3 잿빛·핏빛 나방'},
 'hands-blood':{file:UP+'r1177/spectral-hands-20.webp',frame:[256,256],pivot:[128,224],columns:5,frames:20,fps:20/(42/15),loop:false,dots:true,src:'Dots CX-0156SP C4 바닥에서 솟는 핏빛 손'}});
// R1177c: 세뇌당한 기억의 조각 탑이 깨질 때(R178 이 탑 자리에서 pvfx-void-implosion 을 부름)만 Dots C1 무너지는 탑으로 — 몹 예고 같은 다른 부름은 위 핏빛 소용돌이 그대로
// R1177d: R169 지역 몹 타격 칸(mob-*, 원래 흑백 도트를 몹 색으로 물들여 씀) 9종 → Dots CX-0156SP D 칠한 시트(ROUGH r1, scripts/r1177d-mob-hit-sheets.py).
//  사몽 에피소드만이 아니라 모든 모드(스토리·생존·사몽)에서 바꾼다. 칸 크기·기준점은 원래 칸과 화면 크기가 같게 맞췄고 재생 길이는 원래 이하. Dots 색 그대로(물들이지 않음).
//  기억(mob-memory)은 R1177f 에서 Dots CX-0160MF(육망성 없음)로. 끄기 storyworld.r1177.samongPixel {"mobHit":false}.
const MOBD=Object.freeze({
 'mob-domestic':{file:UP+'r1177/mob-domestic-dots-12.webp',frame:[272,179],pivot:[73,152],columns:4,frames:12,fps:18,src:'Dots D house-double-claw12 집 — 두 번 할퀴기'},
 'mob-forge':{file:UP+'r1177/mob-forge-dots-12.webp',frame:[242,131],pivot:[93,107],columns:4,frames:12,fps:12,src:'Dots D forge-hammer-sparks12 대장간 — 망치 불티'},
 'mob-neural':{file:UP+'r1177/mob-neural-dots-12.webp',frame:[264,206],pivot:[140,103],columns:4,frames:12,fps:12.86,src:'Dots D nerve-branch-current12 신경 — 갈라지는 전류'},
 'mob-clinical':{file:UP+'r1177/mob-clinical-dots-8.webp',frame:[173,68],pivot:[31,55],columns:4,frames:8,fps:15,src:'Dots D hospital-silver-hit8 병원 — 은빛 찌르기'},
 'mob-garden':{file:UP+'r1177/mob-garden-dots-12.webp',frame:[291,173],pivot:[81,154],columns:4,frames:12,fps:12,src:'Dots D garden-foliage-arc12 정원 — 잎사귀 휘두르기'},
 'mob-stone':{file:UP+'r1177/mob-stone-dots-12.webp',frame:[212,120],pivot:[106,103],columns:4,frames:12,fps:12,src:'Dots D stone-rising-spines12 석조·동굴 — 솟는 돌가시'},
 'mob-snow':{file:UP+'r1177/mob-snow-dots-12.webp',frame:[322,162],pivot:[98,129],columns:4,frames:12,fps:12,src:'Dots D snow-ice-break12 눈 — 얼음 깨짐'},
 'mob-coast':{file:UP+'r1177/mob-coast-dots-12.webp',frame:[175,105],pivot:[87,83],columns:4,frames:12,fps:12,src:'Dots D coast-water-splash12 해안·늪 — 물 튐'},
 'mob-regional':{file:UP+'r1177/mob-regional-dots-8.webp',frame:[168,131],pivot:[55,116],columns:4,frames:8,fps:13.33,src:'Dots D common-crescent-slash8 그 밖 — 초승달 베기'},
 'mob-memory':{file:UP+'r1177/mob-memory-dots-12.webp',frame:[215,219],pivot:[108,144],columns:4,frames:12,fps:12,src:'Dots CX-0160MF 기억 — 육망성 없이 먹 번짐·깨지는 조각(R1177f)'}});
const TOWER_KEY='r1177-memory-tower',TOWER={file:'r1177/'+TOWER_KEY+'.webp',frame:[256,256],pivot:[128,240],columns:7,frames:14,fps:20,loop:false,r1177:'Dots CX-0156SP C1 기억 조각 탑 무너짐',r1177Path:UP+'r1177/memory-tower-implode-14.webp'};
for(const [k,v] of [...Object.entries(OWN),...Object.entries(MOBD)])ALIAS.set(ALIAS_DIR+k+'.webp',v.file);ALIAS.set(ALIAS_DIR+TOWER_KEY+'.webp',TOWER.r1177Path);
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
function remember(meta){for(const k of [...Object.keys(OWN),...Object.keys(MOBD),...Object.keys(P976()?.swap||{})]){if(pristine[k]||!meta[k])continue;const v=meta[k];if(v.r976Path||ours.has(v))continue;pristine[k]=v;}}
// 다른 덧씌우기가 이미 칠한 시트로 바꾼 칸(예: R1028 촉수 'r1028/…')은 건드리지 않는다 — 원래 도트 칸(하위 폴더 없는 파일)만 바꾼다.
const isPixelRow=v=>!!v&&typeof v.file==='string'&&!v.file.includes('/');
function rowFor(k,base){if(!isPixelRow(base))return null;if(MOBD[k]){const {src,file,...row}=MOBD[k];return {...base,...row,loop:false,file:'r1177/'+k+'.webp',pivot:row.pivot.slice(),frame:row.frame.slice(),r1177d:src,r1177Path:file};}if(OWN[k]){const {src,file,...row}=OWN[k];return {...base,...row,file:'r1177/'+k+'.webp',pivot:row.pivot.slice(),frame:row.frame.slice(),r1177:src,r1177Path:file};}
 const s=P976()?.swap?.[k];if(!s)return null;const {src,file,...row}=s;return {...base,...row,file:'r976/'+k+'.webp',pivot:row.pivot.slice(),frame:row.frame.slice(),r976:src,r976Path:file};}/* R976 칸에는 r1177 표시를 달지 않는다 — R976 이 P 에서 이 행을 펼쳐 쓰므로 표시가 새어 나가면 R976 행을 이 파일 것으로 오인 */
// 깨진 탑은 엔진이 적 목록에서 먼저 빼므로(killEnemy 뒤에 R178 이 부름) 이 구역의 탑을 따로 기억해 둔다
let towers=[];function seeTowers(){const r=roomNow(),L=r&&Array.isArray(r.enemies)?r.enemies.filter(e=>e&&e.r170Tower):[];for(const e of L)if(!towers.includes(e))towers.push(e);if(towers.length>24)towers=towers.slice(-24);}
function step(){try{seeTowers();}catch(_){}const X=PX(),meta=X&&typeof X.meta==='function'?X.meta():null;if(!meta)return;remember(meta);if(!meta[TOWER_KEY])meta[TOWER_KEY]=TOWER;
 const z=zoneOf(roomNow()),ep=prefs.on&&(isEpisode(z)||prefs.everywhere!==false),inP=isP(z);/* R1193(사용자 2026-11-19): 칠한 칸 9줄을 스토리·꿈 층·생존 등 모든 모드로 — 끄기 {"everywhere":false} */let sw=0,rs=0;
 for(const k of Object.keys(pristine)){const own=!!OWN[k],mob=!!MOBD[k];
  if(!own&&!mob&&inP&&prefs.on)continue;// P 의 R976 6종은 R976 몫
  if(mob?prefs.on&&prefs.mobHit!==false:ep){let row=mine.get(k);if(!row){row=rowFor(k,pristine[k]);if(!row)continue;mine.set(k,row);ours.add(row);}if(meta[k]!==row){meta[k]=row;sw++;}}
  else if(meta[k]!==pristine[k]&&ours.has(meta[k])){meta[k]=pristine[k];rs++;}}
 if(sw)stats.swaps++;if(rs)stats.restores++;}
try{if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{step();}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
// R1177c: pixelfx play 가 먼저 묻는다 — 사몽 에피소드 안에서만. ① 깨지는 탑 자리의 무너짐 → C1 탑(바닥에 세움, 물들임 없이) ② Dots 칸은 물들이지 않고 Dots 색 그대로
function route(name,x,y,o){if(!prefs.on)return null;o=o||{};
 if(MOBD[name]){const row=PX()?.meta?.()?.[name];return row&&row===mine.get(name)&&o.tint?{name,o:{...o,tint:null}}:null;}// R1177d: 몹 타격 Dots 칸은 모든 모드에서 Dots 색 그대로
 const r=roomNow();if(!isEpisode(zoneOf(r))&&prefs.everywhere===false)return null;/* R1193: 모든 모드 */
 if(name==='pvfx-void-implosion'&&[...(Array.isArray(r.enemies)?r.enemies:[]),...towers].some(e=>e&&e.r170Tower&&!(e.hp>0)&&Math.abs(e.x-x)<.01&&Math.abs(e.y-y)<.01)){stats.towers=(stats.towers||0)+1;return{name:TOWER_KEY,o:{...o,z:0,k:1.35,tint:null}};}
 const X=PX(),row=X?.meta?.()?.[name];if(row&&row===mine.get(name)&&row.dots&&o.tint)return{name,o:{...o,tint:null}};return null;}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}try{step();}catch(e){fail(e);}}
window.__STORYWORLD_SAMONG_PIXEL_ART_R1177__=Object.freeze({revision:REV,set,swap:OWN,mobHit:MOBD,route,TOWER_KEY,resolve:p=>real(p),
 inspect:()=>({revision:REV,prefs:{...prefs},zone:zoneOf(roomNow()),stats:{...stats},swapped:[...mine.keys()].filter(k=>PX()?.meta?.()?.[k]===mine.get(k)),lastError})});
})();
