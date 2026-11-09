// R448 — 사용자 2026-11-09 "234번 우선적용"(레퍼런스 등각 맵의 규칙 4: 나무·지붕이 캐릭터 앞을 가리고 물체가 높이별로 겹친다).
//  원인(헤드리스 실측): Three 기록기에서 영웅 그림(R283 서기·걷기, R350 이 올린 공격 자세)은 3번 패스(깊이 없음)라 늘 맨 위에 그려진다.
//   그래서 영웅이 나무·건물 뒤로 가도 앞 조형물이 영웅을 가리지 못했고, 엔진은 대신 앞 조형물을 통째로 .36 으로 옅게 해
//   어두운 지역에서는 나무가 거의 사라졌다(악마화 나무의 정원 실측).
//  고침(그림만, 판정·이동·배치·깊이 정렬 값은 그대로):
//   1) 매 프레임 기록된 명령에서 영웅 몸 그림 상자를 구하고, 영웅보다 앞(엔진 그리기 순서와 같은 x+y 기준)에 있으면서
//      그 상자와 겹치는 조형물 몸 그림(바닥에 눕는 깔개·핏자국·벽 덩어리 제외)을 영웅 바로 뒤 순서로 3번 패스에 한 번 더 그린다
//      → 조형물이 실제로 영웅 앞을 가린다. 엔진이 .36 으로 옅게 한 원본과 합쳐 조형물은 약 .86 으로 보인다.
//   2) 가려진 영웅은 그 위에 반투명(.58) 실루엣으로 한 번 더 그려 위치·방향이 늘 읽히게 한다(전투 가독성).
//   3) 스킬·이펙트(R350 이후 순서)는 그대로 그 위에 그린다. R350 가림 옅게·유령과 겹치지 않게 owner.r350 표시를 단다.
//  몹은 이미 몸 패스(깊이 있음)라 건드리지 않는다. 조형물 옅게(R443 coverAlpha)·배치는 조형물 배치 스레드 몫이라 건드리지 않는다.
//  끄기: localStorage['storyworld.r448.depthOverlap']='0'.
(()=>{'use strict';
if(window.__STORYWORLD_DEPTH_OVERLAP_R448__)return;
const REV='R448-depth-overlap-1',KEY='storyworld.r448.depthOverlap';
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
const stats={frames:0,heroFound:0,covered:0,ghosts:0,skippedFlat:0,errors:0};let lastError=null;const last=[];const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
// 앞 조형물 덮개 진하기: 원본 알파 a0 와 합쳐 TARGET 이 되게(원본이 이미 1 이면 OVER 로)
const TARGET=.86,OVER=.8,GHOST=.58,MIN_FRAC=.04,DEPTH_GAP=.05;
// 바닥에 눕는 것(깔개·핏자국·웅덩이·금)은 서 있는 물체가 아니라 영웅을 가리면 안 된다
const FLAT=/(?:^|[^a-z])(?:rugs?|carpets?|mats?|decals?|stains?|puddles?|blood|cracks?|floor|tiles?|shadow|ground|grass-patch|leaves|petals?)(?=[^a-z]|$)/i;
// 벽에 붙는 것·벽 덩어리(문·문틀·창·액자·현판 등)는 엔진 벽 가림(R188)이 따로 다루고, 문 앞에 선 영웅을 문이 덮으면 안 된다
const WALLISH=/(?:^|[^a-z])(?:walls?|doors?|gates?|portals?|windows?|frames?|paintings?|banners?|signs?|sconces?|curtains?|posters?|clocks?|mirrors?|vents?|reliefs?|torch(?:es)?|exits?)(?=[^a-z]|$)/i;
function bbox(c){let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;const pts=c.kind==='image'&&Array.isArray(c.points)?c.points:null;if(!pts)return null;
 for(const p of pts){if(p[0]<x0)x0=p[0];if(p[0]>x1)x1=p[0];if(p[1]<y0)y0=p[1];if(p[1]>y1)y1=p[1];}return x1>x0&&y1>y0?{x0,y0,x1,y1}:null;}
const overlap=(a,b)=>Math.max(0,Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0))*Math.max(0,Math.min(a.y1,b.y1)-Math.max(a.y0,b.y0));
const propMemo={props:null,map:null,n:-1};
function propOf(id){try{const P=typeof room!=='undefined'&&room?room.props:null;if(!Array.isArray(P))return null;
 if(propMemo.props!==P||propMemo.n!==P.length){const m=new Map();for(const q of P)if(q&&q.id!=null)m.set('prop:'+q.id,q);propMemo.props=P;propMemo.map=m;propMemo.n=P.length;}return propMemo.map.get(String(id))||null;}catch(e){fail(e);return null;}}
function heroCommands(commands){const out=[];for(const c of commands)if(c&&c.kind==='image'&&c.owner?.kind==='hero'&&!c.owner.r350&&!c.owner.r448)out.push(c);
 if(out.length>1&&out.some(c=>c.owner.id!==out[0].owner.id)){let best=null,bd=Infinity;try{for(const c of out){const d=Math.hypot((c.owner.x??0)-player.x,(c.owner.y??0)-player.y);if(d<bd){bd=d;best=c.owner.id;}}}catch(_){}return out.filter(c=>c.owner.id===best);}
 return out;}
function process(commands){
 if(!on||!Array.isArray(commands)||!commands.length)return;stats.frames++;
 const heroes=heroCommands(commands);if(!heroes.length)return;
 try{if(typeof player!=='undefined'&&(!player||player.visible===false))return;}catch(_){return;}
 let box=null,hMax=-Infinity;for(const c of heroes){const q=bbox(c);if(!q)continue;box=box?{x0:Math.min(box.x0,q.x0),y0:Math.min(box.y0,q.y0),x1:Math.max(box.x1,q.x1),y1:Math.max(box.y1,q.y1)}:q;if(c.order>hMax)hMax=c.order;}
 if(!box)return;stats.heroFound++;
 // 영웅 그림 상자의 투명 여백을 덜어 낸 몸통 상자(R350 과 같은 비율)
 const w=box.x1-box.x0,hh=box.y1-box.y0,core={x0:box.x0+w*.18,x1:box.x1-w*.18,y0:box.y0+hh*.1,y1:box.y1-hh*.02};const coreA=(core.x1-core.x0)*(core.y1-core.y0);if(!(coreA>4))return;
 const hd=(heroes[0].owner.x??player.x)+(heroes[0].owner.y??player.y);
 const over=[];
 for(const c of commands){if(!c||c.kind!=='image'||c.spatialRole!=='body'||c.owner?.kind!=='prop'||c.owner.r448)continue;
  const o=c.owner;if(!Number.isFinite(o.x+o.y)||o.x+o.y<=hd+DEPTH_GAP)continue;
  const q=bbox(c);if(!q)continue;const f=overlap(q,core)/coreA;if(!(f>MIN_FRAC))continue;
  const p=propOf(o.id);if(p&&(p.terrainWall||p.visible===false||p.r303Hide))continue;
  const name=String(c.sourcePath||'')+' '+String(o.id||'')+' '+String(p?.path||'')+' '+String(p?.r80Art||'');if(FLAT.test(name)||WALLISH.test(name)||p?.wallMounted){stats.skippedFlat++;continue;}
  over.push(c);}
 if(!over.length)return;
 over.sort((a,b)=>a.order-b.order);let i=0;last.length=0;
 for(const c of over){const a0=Math.max(0,Math.min(1,c.style?.globalAlpha??1)),a=a0>=.98?OVER:Math.max(0,Math.min(1,(TARGET-a0)/(1-a0)));if(a<=.01)continue;
  last.push(String(c.owner.id).slice(0,48));commands.push({...c,key:'r448:over:'+c.key,owner:{...c.owner,kind:'effect',id:'r448:over:'+c.owner.id,r350:true,r448:true,groundAligned:false,bodyPath:null},spatialRole:null,order:hMax+.2+(i++)*.001,style:{...c.style,globalAlpha:a}});stats.covered++;}
 // 가려진 영웅 실루엣(반투명) — 덮개 바로 위
 let j=0;for(const c of heroes){commands.push({...c,key:'r448:ghost:'+c.key,owner:{...c.owner,kind:'effect',id:'r448:ghost:'+c.owner.id,r350:true,r448:true,groundAligned:false,bodyPath:null},spatialRole:null,order:hMax+.5+(j++)*.001,style:{...c.style,globalAlpha:Math.max(0,Math.min(1,(c.style?.globalAlpha??1)*GHOST))}});stats.ghosts++;}
}
// ---- 렌더러 감싸기(perf-r97 이 인스턴스에 render 를 복사해 두므로 프로토타입·인스턴스 둘 다, 한 render 에 한 번만) ----
let depth=0;
const wrapFn=fn=>{if(fn.__r448)return fn;const w=function(frame){if(depth===0){try{if(frame&&Array.isArray(frame.commands))process(frame.commands);}catch(e){fail(e);}}depth++;try{return fn.apply(this,arguments);}finally{depth--;}};w.__r448=true;return w;};
try{const C=window.StoryPhase1?.ThreeRenderer?.prototype;if(C&&typeof C.render==='function')C.render=wrapFn(C.render);}catch(e){fail(e);}
const wrapped=new WeakSet();
function wrapInst(){try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(r&&Object.prototype.hasOwnProperty.call(r,'render')&&!wrapped.has(r)){wrapped.add(r);r.render=wrapFn(r.render);}}catch(e){fail(e);}}
setInterval(wrapInst,500);wrapInst();
window.__STORYWORLD_DEPTH_OVERLAP_R448__=Object.freeze({revision:REV,process,
 inspect:()=>({revision:REV,on,stats:{...stats},lastCovered:last.slice(),lastError}),
 set:v=>{on=!!v;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}return on;}});
})();
