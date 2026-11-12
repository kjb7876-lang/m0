/* R930 카이로노미콘 사이버펑크×마법공학 — 사용자 2026-11-12 08:52Z "카이로노미콘 맵타일 등을 닷츠한테 제작하라고 해서 사이버펑크에 마법공학 섞은 느낌으로 벽, 맵타일, 조형물 등 만들어서 적용해줘".
 * 5부 카이로노미콘(STORY kair01~kair10, 윤서하의 기억)의 그림만 바꾼다. 방 구조·벽 위치·충돌·길찾기·문·가구 배치·서사는 그대로.
 *  1) 바닥·벽 타일: R118 지역 타일 표(world-tiles-r118)에 카이로 룩을 넣는다. 흑철 판재 + 황동 리벳 + 판 틈 시안 룬 회로(검은 공방은 호박·자홍).
 *     · kair01 최초명령의 세계 · kair02 봉인 회랑 · kair04 수문장 광장 · kair06 수로 · kair08 뉴런 게이트 = kc-deck(바닥+벽), kair07 검은 공방 = kc-forge(바닥+벽).
 *     · kair01·kair04 의 실외 유기 지형(R204)은 바닥 UV 를 비틀어 직선 회로가 소용돌이로 보이므로 바닥은 돌 그대로, 절벽면만 kc-deck 벽(cave-r204 의 __STORYWORLD_R204_TEX__ 훅).
 *     · 서사가 바닥을 정한 곳(kair03 세이렌 모르·kair10 붕괴 의식장의 검은 모래, kair09 망각의 묘지 흙길, kair05 시간의 숲)은 바닥을 두고 벽만 kc-deck 벽으로.
 *     · 쉼터(restKairo, 풀려난 시간의 금빛 모래)는 그대로.
 *  2) 조형물: 기계 테마 방(위 kc-deck·kc-forge 지역)의 이끼 바위·나무 대문 장식(solid 아님)을 이미 게임에 있는 하이테크 그림
 *     (산업 바리케이드·감시 콘솔·신호기, 룬 포탈)으로 바꾼다. R272/R830 정본 규칙상 카이로는 하이테크 허용 지역이다. 숲·묘지·모래 지역은 그대로.
 *  타일은 scripts/r930-kairo-tiles.py 가 코드로 그린 임시본이다. Dots 요청 CX-0081KC 결과가 오면 같은 이름(assets/r930/tiles/*.webp)으로 바꿔 끼운다.
 *  끄기: localStorage['storyworld.r930.kairo']='0'. Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
if(window.__STORYWORLD_KAIRO_TECH_R930__)return;
const REV='R930-kairo-tech-1',KEY='storyworld.r930.kairo',DIR='assets/r930/tiles/';
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
const stats={registered:0,walls:0,swapped:0,rooms:0,waits:0,errors:0};let lastError=null,last=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const FULL=Object.freeze({kair01:'kc-deck',kair02:'kc-deck',kair04:'kc-deck',kair06:'kc-deck',kair08:'kc-deck',kair07:'kc-forge'});
const WALL_ONLY=Object.freeze({kair03:'kc-deck',kair05:'kc-deck',kair09:'kc-deck',kair10:'kc-deck'});
// 순수(QA): 지역 id → {floor,wall} 룩 이름, 해당 없으면 null
function plan(id){id=String(id||'');if(FULL[id])return{floor:FULL[id],wall:FULL[id]};if(WALL_ONLY[id])return{floor:null,wall:WALL_ONLY[id]};return null;}
// ---------- 1) R118 표 채우기 ----------
let registered=false;
function register(){const T=window.__STORYWORLD_TILES_R118__;if(registered||!T||!T.regions)return registered;const RG=T.regions;
 for(const[id,file]of Object.entries(FULL)){RG[id]={file,dir:DIR,floor:0xf4f2f0,wall:0xf0eeec,r930:true};stats.registered++;}
 // 묘지 흙길은 바닥만 남기고 벽은 R930 이 칠한다(같은 그림 한 장에서 바닥·벽을 함께 고르는 R118 표의 한계).
 for(const id of Object.keys(WALL_ONLY))if(RG[id]&&RG[id].wall!=null){RG[id]={...RG[id]};delete RG[id].wall;RG[id].r930WallOnly=true;}
 return registered=true;}
if(on){let tries=0;const poll=setInterval(()=>{try{if(register()||++tries>400){clearInterval(poll);tryWrap();}else stats.waits++;}catch(e){fail(e);clearInterval(poll);}},50);try{register();}catch(e){fail(e);}}
// ---------- 1b) 벽만 바꾸는 지역의 벽 칠하기 ----------
function paintWall(r,id,image){const p=plan(id);if(!on||!p||p.floor||!r||!r.wallMaterial||!r.T)return false;const T=r.T;
 const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.imageSmoothingEnabled=true;if('imageSmoothingQuality'in g)g.imageSmoothingQuality='high';g.drawImage(image,1024,0,1024,1024,0,0,512,512);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.wrapS=t.wrapT=T.RepeatWrapping;
 t.anisotropy=Math.min(8,r.renderer?.capabilities?.getMaxAnisotropy?.()||1);t.userData={r930Tile:true};r.spatialResources?.add?.(t);
 r.wallMaterial.map=t;r.wallMaterial.color?.setHex?.(0xf0eeec);r.wallMaterial.needsUpdate=true;r.r930Wall=p.wall;stats.walls++;return true;}
const images=new Map();
function look(file,cb){let row=images.get(file);if(!row){row={image:new Image(),ready:false,waiters:[]};row.image.decoding='async';row.image.onload=()=>{row.ready=true;for(const f of row.waiters.splice(0))try{f(row.image);}catch(e){fail(e);}};
 row.image.onerror=()=>fail(Error('R930 tile failed: '+file));row.image.src=DIR+file+'.webp';images.set(file,row);}row.ready?cb(row.image):row.waiters.push(cb);}
const storyId=r=>r&&r.layer==='STORY'&&!r.samongR103&&!r.samongR115&&!r.exploration?.samongR115&&!r.exploration?.samongR103?String(r.id||''):'';
let wrapped=false,R3=null;
function tryWrap(){if(wrapped)return;const C=window.StoryPhase1?.ThreeRenderer?.prototype;if(!C||!C.createSpatial)return;const base=C.createSpatial;wrapped=true;
 C.createSpatial=function(...a){const out=base.apply(this,a);R3=this;try{const r=typeof room==='object'?room:null,id=storyId(r),p=plan(id);
  if(on&&p&&!p.floor){const self=this,mat=this.stoneMaterial;look(p.wall,img=>{if(self.disposed||self.stoneMaterial!==mat)return;paintWall(self,id,img);});}}catch(e){fail(e);}return out;};}
try{tryWrap();}catch(e){fail(e);}
// ---------- 1c) R204 실외 유기 지형(kair01·kair04 의 절벽면): cave-r204 가 텍스처를 고를 때 묻는 훅 ----------
const R204=Object.freeze({kair01:'kc-deck',kair04:'kc-deck'});
window.__STORYWORLD_R204_TEX__=function(zone){if(!on)return null;const f=R204[String(zone||'')];if(!f)return null;const p=DIR+f+'.webp';return{face:[p,1]};/* 바닥은 R204 가 UV 를 비틀어 직선 회로가 소용돌이로 보여 그대로 둔다(헤드리스 비교) */};
// ---------- 2) 조형물 ----------
const V='assets/props/v290/',ROT=['industrial_barricade','surveillance_console','rail_signal'];
const SWAP_ZONES=new Set(Object.keys(FULL));
const nameOf=s=>{const m=/(?:^|\/)([^\/]+)\.(?:webp|png)$/.exec(String(s||''));return m?m[1]:'';};
function apply(r){if(!on||!r||!Array.isArray(r.props))return 0;const id=storyId(r);if(!SWAP_ZONES.has(id))return 0;if(r.__r930props===r.props.length)return 0;let k=0,sw=0;
 for(const p of r.props){if(!p||typeof p!=='object'||p===r.objective||p.solid||p.interactive||p.interact||/objective/i.test(String(p.id||''))||p.r930From)continue;
  const skin=p.r81NativeSkin,sp=typeof skin?.path==='string'?skin.path:'',own=typeof p.path==='string'?p.path:'';const n=nameOf(sp||own);let to=null;
  if(n==='moss_boulders')to=ROT[k++%ROT.length];else if(n==='broken_gate')to='ruined_portal';if(!to)continue;
  p.r930From=sp||own;if(sp)p.r81NativeSkin={...skin,path:V+to+'.webp'};if(own&&nameOf(own)===n)p.path=V+to+'.webp';sw++;}
 r.__r930props=r.props.length;if(sw){stats.swapped+=sw;stats.rooms++;last={zone:id,swapped:sw};}return sw;}
setInterval(()=>{try{if(typeof room!=='undefined'&&room&&!(typeof loading!=='undefined'&&loading))apply(room);}catch(e){fail(e);}},300);
window.__STORYWORLD_KAIRO_TECH_R930__=Object.freeze({revision:REV,plan,apply,paintWall,renderer:()=>R3,FULL,WALL_ONLY,
 inspect:()=>({revision:REV,on,registered,wrapped,stats:{...stats},last,lastError,collisionChanged:false,layoutChanged:false,temporaryArt:true,dots:'CX-0081KC',browserVerified:false,GPUVerified:false})});
})();
