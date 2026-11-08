// R406 조형물 자리·방향·실내 조명 + 보스 구역 서사 소품(사용자 2026-11-08 "조형물들 의자같이 조금 안쪽에 있는게 자연스러운건 안쪽,
//  벽에 기대는게 자연스러운건 벽에 각도맞게, 그리고 실내에는 불이없게 있어도 전구등 … 인테리어전문가와 미술감독이 배치,
//  구글드라이브 어제오늘 보류나 검토후보들도 다 체크해서 너가 개선해서 적절히 배치 특히 보스구역").
//  실측(헤드리스, STORY 36개 지역 덤프): 의자·탁자·휠체어 116개 중 91개가 벽에서 0.5칸 안(벽에 박힘), 거울·서랍장·조리대 29개가 벽에서 1칸 넘게 떨어져
//  방 가운데 떠 있었고, 실내 지역에 R80 화로(r80-022)·석탄로(r80-039)·R92 촛대/화로 등불·R74 화로가 있었다.
//  ① 앉는 가구(의자·휠체어·탁자)는 가장 가까운 벽에서 1.1~1.55칸 안쪽으로, 소파는 0.85칸으로 뗀다(벽 반대쪽으로만, 빈 바닥·문·입구·다른 소품 피해).
//  ② 벽 가구(거울·서랍장·협탁·조리대)는 가장 가까운 뒷벽(-x·-y, 화면 위쪽 벽)에 0.5칸으로 붙이고 그 벽 방향에 맞게 좌우를 고른다
//     (그림 정면이 +y 쪽 → -y 벽은 그대로, -x 벽은 뒤집기; R303 캐비닛과 같은 규칙, 그리기는 R303 의 r303Flip 을 그대로 쓴다).
//     R303 이 이미 붙인 것(r303Wall)·사몽 격자 배치(:gN:)는 건드리지 않는다.
//  ③ 실내(R303 themeOf indoor·worldR74.mode indoor·사몽 실내 구역)에는 불꽃을 두지 않는다: R80 화로 → 전구 등(assets/r406/lights, R92 유리 등롱을
//     전구빛으로 다시 칠한 파생본), 석탄로 → 같은 묶음의 무쇠 조리대(r80-027), R74 화로·횃불·초·등불 → 전구 등, R92 바닥 등불은 전구 두 종만.
//     R303 실내 저장 등불의 촛대 그림도 그릴 때 전구 등으로 바뀐다(readyImage 에서 R92 불꽃 등불 경로만 바꿔 준다).
//  ④ 사몽 보스 구역(confront)과 '교주의 빈 제단'(RG-5)에 드라이브 SW-StoryProps 후보(보류·검토 후보, scripts/r406-boss-props.py 로 헤일로·색 테두리 제거)
//     24종을 서사 장면에 맞춰 놓는다: 벽 소품은 제단(dais)에서 가장 가까운 뒷벽(18칸 안)에 벽 방향대로, 바닥 소품은 제단에서 2.6~8칸 트인 바닥에 제단을 바라보게.
//  모두 그리기 전용(solid:false, 상호작용·자동 조준 없음). 충돌·길찾기·문·몹·저장·진행·서사는 그대로. 옮긴 것은 원래 자리를 r406Moved 에 남긴다.
//  끄기: localStorage['storyworld.r406.props']='{"on":false}' (부분: place/bulbs/boss 각각 false)
(()=>{'use strict';
if(window.__STORYWORLD_PROPS_PLACE_R406__)return;
const REV='R406-props-place-1',KEY='storyworld.r406.props',IDX='./assets/r406/props/index.json',IDXS=[IDX,'./assets/r408/props/index.json','./assets/r414/props/index.json'];// R414: 드라이브 재개 소품 7종(관사 가로등·정문·가방, 승강장 스피커, 승강기 문, 서까래, 꽃무늬 벽)도 같은 규칙으로// R408: 붉은 하이힐(ep1b05) 라운지 소품 — STORY 지역도 zone=지역 id 로 받는다

const prefs={on:true,place:true,bulbs:true,boss:true};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(prefs))if(typeof s?.[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={rooms:0,seatsMoved:0,seatsKept:0,wallSnapped:0,wallFlipped:0,wallKept:0,bulbs:0,furnaces:0,r92Swaps:0,bossProps:0,bossSkipped:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const h32=s=>{let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
const SA=()=>window.StoryPhase1;
const blocked=(L,x,y,r)=>{const a=SA();return typeof a?.explorationBlocked==='function'?!!a.explorationBlocked(L,x,y,r):true;};

// ---- 분류 ------------------------------------------------------------------------------------------
const artOf=p=>String(p?.r81NativeSkin?.path||p?.path||p?.r74Prop||'');
const SEAT=/world-r80\/(r80-145|refined-r85-r80-149|r80-146)\.webp$/;   // 의자·휠체어·탁자
const SOFA=/world-r80\/r80-024\.webp$/;
const WALL_ART=/world-r80\/(r80-026|r80-148|r80-144|r80-027)\.webp$/;  // 거울·서랍장·협탁·무쇠 조리대
const FIRE_SKIN=/world-r80\/r80-022\.webp$/,FURNACE=/world-r80\/r80-039\.webp$/;
const FIRE_R74=new Set(['brazier','torch','candle','lantern']);
const R92_FIRE=/(^|\/)assets\/r92\/lights\/(lights_[a-z]+_0\d)\.png$/;
const BULB={post:'assets/r406/lights/lantern-bulb-post.png',hang:'assets/r406/lights/lantern-bulb-hang.png'};
const BULB_ITEMS=['lights_hospital_03','lights_stone_03'];   // R92 등불 중 전구 파생본이 있는 두 종(크기·발 위치 그대로)
const bulbFor=id=>id==='lights_stone_03'?BULB.hang:BULB.post;
const movable=p=>{if(!p||typeof p!=='object'||p.solid===true||p.interactive||p.samongR103||p.r303Hide||p.r406Boss)return false;
 try{if(window.__STORYWORLD_PROPS_FIT_R303__?.locked?.(p))return false;}catch(_){}
 return /^r(74|80|224):(furn|scene):/.test(String(p.id||''))||/:scenery:/.test(String(p.id||''));};
// 사몽 구역: 지도 양식이 집·병원·기계 시설이고 제목이 바깥 장소가 아니면 실내
const OUT_TITLE=/거리|골목|눈밭|설원|고가도로|정원|늪|다리|교각|전장|공터|플랫폼|철로|빗속|무인도|성벽|성문|광장|대련장|시험장|관람석|숲|들판|해변|바다|옥상|하늘|상가|방어선|승강장|풍경|도시|발판|집들|잔해/;
function zoneRow(z){const d=window.__STORYWORLD_SAMONG_ZONES_R115_DATA__;for(const zs of Object.values(d?.chapters||{}))for(const q of zs||[])if(q?.id===z)return q;return null;}
function indoorZone(q){return !!q&&['domestic','clinical','forge'].includes(q.style)&&!OUT_TITLE.test(String(q.title||''));}
function indoorOf(r){const L=r?.exploration;if(!L)return false;let t=null;try{t=window.__STORYWORLD_PROPS_FIT_R303__?.themeOf?.(r)||null;}catch(_){}
 const z=L.samongR115?.zone;if(z)return !!t?.indoor||indoorZone(zoneRow(z));
 if(L.samongR103)return false;return !!t?.indoor||L.worldR74?.mode==='indoor';}

// ---- 벽까지 거리(네 방향, 0.1칸 간격, 5칸까지) ----------------------------------------------------------
const DIRS=[[-1,0,'-x'],[1,0,'+x'],[0,-1,'-y'],[0,1,'+y']];
function walls(L,x,y){const out=[];for(const[dx,dy,side]of DIRS){for(let s=.1;s<=5.001;s+=.1)if(blocked(L,x+dx*s,y+dy*s,.05)){out.push({dx,dy,side,d:+s.toFixed(2)});break;}}return out.sort((a,b)=>a.d-b.d);}
function avoidPoints(r){const L=r.exploration,out=[];for(const d of L.worldR74?.doors||[])if(Number.isFinite(d.x+d.y))out.push([d.x,d.y,(+d.width||0)/2+1.6]);
 for(const q of[L.entry,L.gate,r.objective,r.altar,L.altar,L.samongR103?.exit,L.samongR103?.dais])if(q&&Number.isFinite(q.x+q.y))out.push([q.x,q.y,1.6]);
 for(const p of r.props||[])if(p&&(p.interactive||p.r75NPC||p.r75NarrativeNPC||p.samongR103||p.r115Clue)&&Number.isFinite(p.x+p.y))out.push([p.x,p.y,1.4]);return out;}
const nearAny=(pts,x,y)=>pts.some(([ax,ay,rr])=>Math.hypot(ax-x,ay-y)<rr);
// R169 은 입구→목표·제단·출구 최단 경로 1.15칸 안의 장식을 숨긴다 → 그 경로 둘레(1.45칸)에는 놓지도 옮기지도 않는다
const pathMemo=new WeakMap();
function pathOf(r){const L=r.exploration;const m=pathMemo.get(r);if(m&&m.L===L)return m.s;let s=null;try{s=window.__STORYWORLD_PLAY_R169__?.pathCells?.(r)||null;}catch(e){fail(e);}pathMemo.set(r,{L,s});return s;}
const onPath=(r,x,y)=>{const s=pathOf(r);if(!s)return false;const cx=Math.floor(x),cy=Math.floor(y);for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++)if(s.has((cx+dx)+','+(cy+dy))&&Math.hypot(cx+dx+.5-x,cy+dy+.5-y)<1.45)return true;return false;};
const crowded=(r,p,x,y,gap)=>(r.props||[]).some(q=>q!==p&&q&&!q.r303Hide&&q.visible!==false&&Number.isFinite(q.x+q.y)&&Math.hypot(q.x-x,q.y-y)<gap);

// ① 앉는 가구 ② 벽 가구
function place(r,rep){const L=r.exploration,avoid=avoidPoints(r);
 for(const p of r.props){if(!p||p.r406Seen||!movable(p)||!Number.isFinite(p.x+p.y))continue;p.r406Seen=1;const art=artOf(p);
  if(SEAT.test(art)||SOFA.test(art)){const W=walls(L,p.x,p.y),n=W[0],wants=SOFA.test(art)?[.85,.75]:[1.3,1.1,1.55];if(!n||n.d>=Math.min(...wants)-.05){stats.seatsKept++;continue;}
   let ok=false;for(const want of wants){const s=want-n.d;if(s<=.02)continue;const x=p.x-n.dx*s,y=p.y-n.dy*s;
    if(blocked(L,x,y,.36)||nearAny(avoid,x,y)||crowded(r,p,x,y,.85)||onPath(r,x,y))continue;const W2=walls(L,x,y);if(W2[0]&&W2[0].d<Math.min(.8,want-.2))continue;
    p.r406Moved={x:p.x,y:p.y};p.x=+x.toFixed(3);p.y=+y.toFixed(3);stats.seatsMoved++;rep.seats++;ok=true;break;}
   if(!ok)stats.seatsKept++;continue;}
  if(WALL_ART.test(art)){if(p.r303Wall||/:g\d+:/.test(String(p.id||'')))continue;const W=walls(L,p.x,p.y),n=W[0];if(!n){stats.wallKept++;continue;}
   const back=W.filter(q=>q.dx<0||q.dy<0)[0];if(!back||back.d>4.5||(n!==back&&n.d<=.8)){stats.wallKept++;continue;}// 앞벽(+x·+y)에 붙은 것은 그대로
   let x=p.x,y=p.y;if(back.d>.8){const s=back.d-.5;x=p.x+back.dx*s;y=p.y+back.dy*s;
    if(blocked(L,x,y,.3)||nearAny(avoid,x,y)||crowded(r,p,x,y,.8)||onPath(r,x,y)){stats.wallKept++;continue;}
    p.r406Moved={x:p.x,y:p.y};p.x=+x.toFixed(3);p.y=+y.toFixed(3);stats.wallSnapped++;rep.walls++;}
   const flip=back.side==='-x';if(!!p.r303Flip!==flip){if(flip)p.r303Flip=true;else delete p.r303Flip;stats.wallFlipped++;rep.flipped++;}
   p.r406Wall=back.side;}}}

// ③ 실내 불꽃 → 전구 등
function bulbs(r,rep){for(const p of r.props){if(!p||p.r406Lit||p.samongR103||p.r406Boss)continue;p.r406Lit=1;const s=p.r81NativeSkin;
 if(s&&FIRE_SKIN.test(String(s.path||''))){p.r406From=s.path;p.r81NativeSkin={path:BULB.post,height:86};stats.bulbs++;rep.bulbs++;continue;}
 if(s&&FURNACE.test(String(s.path||''))){p.r406From=s.path;p.r81NativeSkin={path:String(s.path).replace('r80-039','r80-027'),height:Math.min(86,+s.height||68)};stats.furnaces++;rep.bulbs++;continue;}
 if(!s&&FIRE_R74.has(p.r74Prop)){p.r406FromR74=p.r74Prop;delete p.r74Prop;p.path=BULB.post;p.height=88;stats.bulbs++;rep.bulbs++;}}
 for(const q of Object.values(BULB))try{if(typeof readyImage==='function'&&!readyImage(q)&&typeof addImage==='function')addImage(q,'R406 indoor bulb');}catch(_){}}

// ④ 보스 구역 서사 소품
let PROPS=null,idxState='idle';
async function loadIndex(){if(idxState!=='idle')return;idxState='loading';try{const all={};for(const u of IDXS){const res=await fetch(u,{cache:'force-cache'});if(!res.ok)throw new Error('index '+res.status+' '+u);Object.assign(all,(await res.json()).props||{});}PROPS=all;idxState='ready';}catch(e){idxState='failed';fail(e);}}
function bossCells(r,anchor){const L=r.exploration,F=new Set((L.floorCells||[]).map(c=>c[0]+','+c[1])),has=(x,y)=>F.has(x+','+y),open=[],wall=[];
 for(const[x,y]of L.floorCells||[]){const cx=x+.5,cy=y+.5,d=Math.hypot(cx-anchor.x,cy-anchor.y);if(d<2.4||d>18)continue;let n=0;for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++)if(has(x+i,y+j))n++;
  if(n>=24&&!blocked(L,cx,cy,.9)&&d<=8)open.push({x:cx,y:cy,d});
  else if(n>=15)for(const[dx,dy,side]of[[-1,0,'-x'],[0,-1,'-y']])if(!has(x+dx,y+dy)&&has(x-dx,y-dy)&&has(x-2*dx,y-2*dy)&&has(x+dy,y+dx)&&has(x-dy,y-dx)){const px=cx-dx*.15,py=cy-dy*.15;if(!blocked(L,px,py,.3))wall.push({x:px,y:py,d,side});}}
 return{open,wall};}
function boss(r,rep){if(!PROPS)return;const L=r.exploration,z=L?.samongR115?.zone||(L&&!L.samongR103&&r.layer==='STORY'?r.id:null);if(!z)return;const rows=Object.entries(PROPS).filter(([,v])=>v?.zone===z);if(!rows.length)return;
 const anchor=L.samongR103?.dais||r.objective||L.samongR103?.centre;if(!anchor||!Number.isFinite(anchor.x+anchor.y))return;
 const avoid=[...avoidPoints(r).filter(([x,y])=>!(Math.abs(x-anchor.x)<.01&&Math.abs(y-anchor.y)<.01)),[anchor.x,anchor.y,2.6],...(L.entry?[[L.entry.x,L.entry.y,3.5]]:[])],{open,wall}=bossCells(r,anchor),used=[];
 const rand=(()=>{let s=h32('r406:'+z)||1;return()=>((s=Math.imul(s^s>>>15,2246822507)+0x6d2b79f5>>>0)%10000)/10000;})();
 for(const[name,v]of rows.sort((a,b)=>(a[1].mode==='wall'?0:1)-(b[1].mode==='wall'?0:1)||a[0].localeCompare(b[0]))){const id='r406:'+z+':'+name;if(r.props.some(q=>q?.id===id))continue;
  const pool=(v.mode==='wall'?wall:open).filter(c=>!nearAny(avoid,c.x,c.y)&&used.every(u=>Math.hypot(u.x-c.x,u.y-c.y)>=(v.mode==='wall'?2.4:2.2))&&!crowded(r,null,c.x,c.y,1.5)&&!onPath(r,c.x,c.y))
   .map(c=>({...c,k:(v.mode==='wall'?c.d*.5:Math.abs(c.d-3.8))+rand()*.8})).sort((a,b)=>a.k-b.k);
  const c=pool[0];if(!c){stats.bossSkipped++;rep.bossSkipped++;continue;}used.push(c);
  // 벽 소품: 그림이 나란한 벽(axis)과 붙은 벽이 다르면 뒤집기 / 바닥 소품: 제단을 바라보게(기본 그림은 화면 왼쪽 아래를 본다)
  const flip=v.mode==='wall'?(c.side==='-x')!==(v.axis==='x'):(c.x-c.y)<(anchor.x-anchor.y);
  const q={id,x:+c.x.toFixed(3),y:+c.y.toFixed(3),path:v.path,height:v.height,solid:false,visible:true,enabled:true,interactive:false,autoTargetEligible6:false,r80PresentationOnly:true,r406Boss:name,r406Wall:v.mode==='wall'?c.side:null};
  if(flip)q.r303Flip=true;r.props.push(q);try{if(typeof addImage==='function')addImage(v.path,'R406 boss prop');}catch(_){}stats.bossProps++;rep.boss.push(name);}}

const done=new WeakMap(),reports=new WeakMap();
// 방에 처음 들어올 때 한 번, 그 뒤에는 늦게 붙은 소품(R224 방 가구 등)만 본다(r406Seen·r406Lit 표시, 소품 수가 바뀔 때만)
function apply(r){if(!prefs.on||!r?.exploration||!Array.isArray(r.props))return;const first=done.get(r)!==r.exploration;
 if(!first&&reports.get(r)?.n===r.props.length&&(!prefs.boss||!PROPS||reports.get(r)?.bossTried))return;
 const rep=first?{room:r.id,zone:r.exploration.samongR115?.zone||null,indoor:indoorOf(r),seats:0,walls:0,flipped:0,bulbs:0,boss:[],bossSkipped:0,bossTried:false,n:0}:reports.get(r);
 try{if(first)stats.rooms++;if(prefs.place)place(r,rep);if(prefs.bulbs&&rep.indoor)bulbs(r,rep);
  if(prefs.boss&&PROPS&&!rep.bossTried){rep.bossTried=true;boss(r,rep);}}catch(e){fail(e);}
 rep.n=r.props.length;done.set(r,r.exploration);reports.set(r,rep);}

// R92 바닥 등불: 실내는 전구 파생본이 있는 두 종만
try{const P=window.__STORYWORLD_PROPS_R102__,inner=P?.lamps;
 window.__STORYWORLD_PROPS_R102__=Object.freeze({...(P||{}),lamps:(z,reg,items,list,fam)=>{try{if(prefs.on&&prefs.bulbs&&typeof room!=='undefined'&&room&&indoorOf(room)&&Array.isArray(items)){const out=BULB_ITEMS.map(id=>items.find(i=>i.id===id&&i.kind==='light')).filter(Boolean);if(out.length)return out;}}catch(e){fail(e);}
  return typeof inner==='function'?inner(z,reg,items,list,fam):null;}});}catch(e){fail(e);}
// 실내에서 R92 불꽃 등불 그림(R303 저장 등불의 촛대 포함)을 찾으면 전구 등 그림을 준다
let inCache={r:null,L:null,v:false};const indoorNow=()=>{const r=typeof room!=='undefined'?room:null;if(!r)return false;if(inCache.r!==r||inCache.L!==r.exploration)inCache={r,L:r.exploration,v:indoorOf(r)};return inCache.v;};
try{if(typeof readyImage==='function'){const base=readyImage;readyImage=function(path,...a){
 if(prefs.on&&prefs.bulbs&&typeof path==='string'&&path.includes('r92/lights/')){const m=R92_FIRE.exec(path);if(m)try{if(indoorNow()){const b=bulbFor(m[2]),row=base.call(this,b,...a);if(row){stats.r92Swaps++;return row;}if(typeof addImage==='function')addImage(b,'R406 indoor bulb');return null;}}catch(e){fail(e);}}
 return base.call(this,path,...a);};}}catch(e){fail(e);}

(function poll(){try{if(typeof room!=='undefined'&&room)apply(room);}catch(e){fail(e);}setTimeout(poll,700);})();
loadIndex();
function set(o={}){for(const k of Object.keys(prefs))if(typeof o[k]==='boolean')prefs[k]=o[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_PROPS_PLACE_R406__=Object.freeze({revision:REV,set,apply,bossCells,indoorOf,indoorZone,zoneRow,walls,OUT_TITLE,SEAT,SOFA,WALL_ART,FIRE_SKIN,FURNACE,R92_FIRE,BULB,
 props:()=>PROPS,inspect:()=>({revision:REV,prefs:{...prefs},index:idxState,stats:{...stats},room:typeof room!=='undefined'&&room?(reports.get(room)||null):null,lastError,collisionChanged:false,savesTouched:false})});
})();
