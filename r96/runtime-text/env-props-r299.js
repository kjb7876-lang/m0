// R299 — 드라이브 '14 환경 조형물·서사 자산' 1차 묶음(dots, assets/r299, scripts/r299-env-props.py) 중 검수 통과분을 지역 장식으로 덧붙인다.
//  · 바닥 데칼(핏자국 번짐·끌린 핏자국·금 간 석판·흩어진 쪽지·희미한 붉은 육망성): 바닥 그림(groundImage) 바로 뒤에 낮은 불투명도로 깐다.
//  · 서사 소품(병원 침대·수술 수레·깨진 거울·꺼진 촛대·사슬 기둥·가방·일기장·인형)·큰 조형물(성당 아치·오벨리스크·고목·석상):
//    지역 테마(병원풍/성당풍/숲풍/사몽풍 — 지도 양식 worldR74.style·backgroundTheme·layer 로만 판별, 지역 이름·서사는 만들지 않음)에 맞는 것만 맵당 소수.
//    사용자 지적("조형물 남발 줄이고 맵·서사 맞는 것만")에 따라 맵당 데칼 ≤3·소품 ≤2·큰 조형물 ≤1, 테마를 못 정한 지도에는 아무것도 놓지 않는다.
//  · 모두 비충돌·그리기 전용(solid:false, 상호작용·자동 조준 없음). floorCells·walls·exploration 은 건드리지 않는다.
//  · 자리: 넓은 바닥 칸(5×5 안 바닥 칸 ≥ 21 — 통로 제외)만, 문(worldR74.doors)·입구·관문·목표·제단·이동 지점에서 멀리, 기존 소품·서로 간격.
//    큰 조형물은 벽보다 키가 커서 뒷벽에 붙이면 실내 지붕 덮개·벽 윗면에 윗부분이 잘린다(R299 헤드리스) → 5×5 가 모두 바닥인 트인 칸에만 홀로 세운다.
//    거울은 뒷벽(-x 또는 -y)에 붙인다. 원본 그림은 -x 벽(화면 '/' 방향 벽)에 나란하게 그려져 있어 -y 벽에 붙을 때만 좌우를 뒤집는다(헤드리스 화면 확인). 배치는 지역 id 시드로 결정적이다.
//  · R299 v2(dots 재작업 5종 중 통과 3종): 진한 그을음 원 데칼, 쓰러진 기도대, 바닥에 눕힌 부적 문짝 조각(진행 문 6칸 안 금지).
//  · 빛 쿠키 3종은 투사할 렌더 단계가 없어 보류(assets/r299/index.json held). ctx.filter 에는 brightness·saturate 만 쓴다.
//  끄기: localStorage['storyworld.r299.envprops']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_ENV_PROPS_R299__)return;
const REV='R299-env-props-1',KEY='storyworld.r299.envprops',D='assets/r299/';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={rooms:0,decals:0,props:0,big:0,skipped:0,draws:0,decalDraws:0,errors:0};let lastError=null,last=null;const drawn={};const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
// 데칼: 화면 폭(칸) · 불투명도
const DECAL={'blood-dried':{tiles:1.7,alpha:.52},'blood-dragged':{tiles:2.0,alpha:.5},'stone-cracked':{tiles:1.9,alpha:.36},papers:{tiles:1.5,alpha:.46},soot:{tiles:1.8,alpha:.45},hexagram:{tiles:2.4,alpha:.2}};
// 소품·큰 조형물: 키(px, zoom 1 · 영웅 66) · wall=뒷벽에 붙임. 헤드리스 화면 확인(R299)에서 바닥 소품이 어두운 바닥에 묻혀 작은 것은 키를 올렸다.
// 부적 문짝 조각은 파일 이름을 seal-plank 로 둔다(R189 doors 가 경로의 'door' 낱말을 문으로 보고 벽에 붙이므로).
const PROP={bed:{h:46},cart:{h:44},mirror:{h:56,wall:1},candles:{h:40},'chained-pillar':{h:62},suitcase:{h:30},diary:{h:22},doll:{h:24},'prayer-stand':{h:34},'seal-plank':{h:30,doorGap:6},
 arch:{h:140,big:1},obelisk:{h:136,big:1},// R414: 건축물(성당 아치·오벨리스크)은 영웅(66px)의 2배 이상 — 사용자 2026-11-08
 tree:{h:170,big:1},statue:{h:92,big:1}};
const THEME={
 hospital:{decal:['blood-dried','blood-dragged','papers'],prop:['bed','cart','mirror','doll','suitcase'],big:[]},
 cathedral:{decal:['stone-cracked','papers','blood-dried','soot'],prop:['candles','chained-pillar','diary','prayer-stand','seal-plank'],big:['arch','statue']},
 forest:{decal:['blood-dragged','stone-cracked','soot'],prop:['suitcase','doll'],big:['tree']},
 samong:{decal:['hexagram','blood-dried','blood-dragged'],prop:['chained-pillar','doll','diary','mirror','seal-plank'],big:['obelisk']}};
const CAP={decal:3,prop:2,big:1};
// 순수(QA): 지도 → 테마. 지역 이름·서사가 아니라 지도 양식 문자열과 층만 본다.
// 지도 양식 조사(R299, 63개 지역): 병원풍 clinic·clinic-memory·consultation, 성당풍 chapel·cathedral, 숲풍(실외) *-forest·*-garden·*-meadow·*-swamp.
//  그 밖(기계·현대·도시·성·제단 의식 등)은 판별하지 않고 비워 둔다. patient-addiction-city(도시)는 병원풍이 아니므로 patient 는 쓰지 않는다.
const RX={hospital:/(^|[^a-z])(clinic|consultation|hospital|ward)([^a-z]|$)/i,cathedral:/(^|[^a-z])(chapel|cathedral|church)([^a-z]|$)/i,forest:/(^|[^a-z])(forest|garden|meadow|swamp)([^a-z]|$)/i};
function themeOf(r){if(!r)return null;const L=r.exploration;if(!L||!Array.isArray(L.floorCells)||!L.floorCells.length)return null;
 if(r.layer==='DREAM'||/^sz/.test(String(r.id||''))||r.samongZone||L.samongR105)return'samong';
 const s=String(L.worldR74?.style||'');if(!s)return null;
 if(RX.hospital.test(s))return'hospital';if(RX.cathedral.test(s))return'cathedral';if(RX.forest.test(s)&&L.worldR74?.mode==='outdoor')return'forest';return null;}
// 결정적 난수(지역 id 시드)
function rng(seed){let h=2166136261>>>0;for(const c of String(seed))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return()=>{h=Math.imul(h^h>>>15,2246822507)>>>0;h=Math.imul(h^h>>>13,3266489909)>>>0;h^=h>>>16;return(h>>>0)/4294967296;};}
function avoidPoints(r){const L=r.exploration,out=[];for(const d of L.worldR74?.doors||[])if(Number.isFinite(d.x+d.y))out.push([d.x,d.y,(+d.width||0)/2+3]);
 for(const q of[L.entry,L.gate,r.objective,r.altar,L.altar])if(q&&Number.isFinite(q.x+q.y))out.push([q.x,q.y,3.5]);
 try{const P=window.__STORYWORLD_ROUTES_R72__?.points?.(r);for(const k of['next','previous'])if(P?.[k]&&Number.isFinite(P[k].x+P[k].y))out.push([P[k].x,P[k].y,3.5]);}catch(_){}
 try{for(const d of Object.keys((typeof regionById!=='undefined'&&regionById?.[r.id]?.exits)||{})){const q=exitPoint(d);if(q&&q.x>0&&q.y>0)out.push([q.x,q.y,3.5]);}}catch(_){}
 for(const p of r.props||[])if(p&&!p.r299&&Number.isFinite(p.x+p.y))out.push([p.x,p.y,p.interactive||p.r75NPC||p.r75NarrativeNPC||p.r74Door||p.r81WardDoor?3:2]);
 return out;}
// 순수(QA): 레이아웃·피할 점 → 후보 칸(바닥·넓은 곳·뒷벽 방향)
function candidates(L,avoid){const F=new Set(L.floorCells.map(c=>c[0]+','+c[1])),has=(x,y)=>F.has(x+','+y),open=[],wall=[];
 for(const[x,y]of L.floorCells){let n=0;for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++)if(has(x+i,y+j))n++;
  const cx=x+.5,cy=y+.5,ok=(px,py)=>!avoid.some(([ax,ay,rr])=>Math.hypot(ax-px,ay-py)<rr);
  if(n>=21&&has(x-1,y)&&has(x,y-1)&&has(x+1,y)&&has(x,y+1)){if(ok(cx,cy))open.push({x:cx,y:cy,n});}
  // 뒷벽: 바로 뒤(-x 또는 -y)가 바닥 밖이고 앞·양옆은 넓은 바닥. 벽 쪽으로 당기면 3D 벽 면 깊이에 묻혀 가려지므로(R299 헤드리스) 칸 가운데에서 살짝 앞으로 둔다.
  else if(n>=15)for(const[dx,dy]of[[-1,0],[0,-1]])if(!has(x+dx,y+dy)&&has(x-dx,y-dy)&&has(x-2*dx,y-2*dy)&&has(x+dy,y+dx)&&has(x-dy,y-dx)){const px=cx-dx*.15,py=cy-dy*.15;if(ok(px,py))wall.push({x:px,y:py,dx,dy});};}
 return{open,wall};}
function pick(list,used,gap,rand){const order=list.map((p,i)=>[rand(),i]).sort((a,b)=>a[0]-b[0]);for(const[,i]of order){const p=list[i];if(used.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>=gap))return p;}return null;}
// 순수(QA): 방 → 놓을 목록(결정적). 원래 room 은 바꾸지 않는다.
// R830(사용자 2026-11-12): 피의 육망성 바닥 그림과 붉은 천 고목은 1부(에피소드 1a) 본편에만 — 규칙은 props-r272 fit. 사몽 묶음에서는 빠지고, 1부 지역 묶음에는 육망성이 후보로 들어간다.
function canonTheme(r,t){const base=THEME[t];let P=null;try{P=window.__STORYWORLD_PROPS_R272__;}catch(_){}if(!P||typeof P.fitPath!=='function')return base;
 const ok=n=>P.fitPath(D+n+'.webp',r)===true,decal=base.decal.filter(ok);if(!decal.includes('hexagram')&&ok('hexagram'))decal.push('hexagram');
 return{decal,prop:base.prop.filter(ok),big:base.big.filter(ok)};}
function plan(r){const t=themeOf(r);if(!t)return{theme:null,items:[]};const L=r.exploration,T=canonTheme(r,t),rand=rng('r299:'+r.id+':'+t),{open,wall}=candidates(L,avoidPoints(r)),used=[],items=[];
 const take=(kind,names,n)=>{const pool=names.slice();for(let i=0;i<n&&pool.length;i++){const name=pool.splice(Math.floor(rand()*pool.length),1)[0],a=PROP[name];
  const far=a?.doorGap?q=>(L.worldR74?.doors||[]).every(d=>Math.hypot(d.x-q.x,d.y-q.y)>=a.doorGap):()=>true;
  const p=kind==='decal'?pick(open,used,4,rand):a?.wall?pick(wall.filter(far),used,kind==='big'?7:4,rand):pick(open.filter(q=>far(q)&&(kind!=='big'||q.n>=25)),used,kind==='big'?7:4,rand);if(!p)continue;used.push(p);
  items.push({kind,name,x:+p.x.toFixed(2),y:+p.y.toFixed(2),flip:p.dy===-1,rot:kind==='decal'?+(rand()*.5-.25).toFixed(3):0});}};
 const size=L.floorCells.length;
 take('big',T.big,size>=260?CAP.big:0);take('prop',T.prop,Math.min(CAP.prop,size>=120?2:1));take('decal',T.decal,Math.min(CAP.decal,size>=160?3:2));
 return{theme:t,items};}
const done=new WeakMap();
function apply(r){if(!on||!r||!r.exploration||!Array.isArray(r.props))return;if(done.get(r)===r.exploration)return;done.set(r,r.exploration);
 try{r.props=r.props.filter(p=>!p.r299);r.r299Decals=[];const P=plan(r);if(!P.theme){stats.skipped++;return;}
  for(const it of P.items){const path=D+it.name+'.webp';try{if(typeof addImage==='function')addImage(path,'R299 env '+it.kind);}catch(_){}
   if(it.kind==='decal'){r.r299Decals.push({...it,path});stats.decals++;continue;}
   r.props.push({id:'r299:'+r.id+':'+it.name,x:it.x,y:it.y,path,height:PROP[it.name].h,solid:false,visible:true,enabled:true,interactive:false,autoTargetEligible6:false,r80PresentationOnly:true,r299:it.kind,r299Flip:it.flip});
   if(it.kind==='big')stats.big++;else stats.props++;}
  stats.rooms++;last={zone:r.id,theme:P.theme,items:P.items.map(i=>i.kind+':'+i.name)};}catch(e){fail(e);}}
// 소품 그리기: 붙은 벽에 맞게 좌우 뒤집기, 영웅이 뒤에 서면 옅게.
function drawOwn(p){const sight=window.__STORYWORLD_SIGHT24__;if(sight?.enabled&&!sight.pointVisible(p.x,p.y))return;const row=readyImage(p.path);if(!row){if(typeof addImage==='function')addImage(p.path);return;}const z=typeof zoom==='number'?zoom:1,q=project(p.x,p.y),h=p.height*z,b=row.crop||{w:row.image.naturalWidth,h:row.image.naturalHeight},w=h*b.w/b.h,hero=project(player.x,player.y),
  behind=q.y>hero.y-3&&q.y-h<hero.y-15&&Math.abs(q.x-hero.x)<w*.45;
 const paint=()=>{if(typeof shadow==='function')shadow(q.x,q.y,Math.max(10*z,Math.min(w*.34,h*.5)));sprite(p.path,q.x,q.y,h,{alpha:behind?.36:1,flip:!!p.r299Flip,filter:typeof layer!=='undefined'&&layer==='DREAM'?'saturate(.6) brightness(.86)':'brightness(.92)'});};
 if(typeof ctx?.scope==='function')ctx.scope({id:'prop:'+p.id,kind:'prop',x:p.x,y:p.y,bodyPath:p.path,alive:true},paint);else paint();stats.draws++;drawn[p.id]=(drawn[p.id]||0)+1;}
function paintProp(p){if(!p?.r299)return false;if(on&&p.visible!==false)try{drawOwn(p);}catch(e){fail(e);}return true;}
// R266 owns the early pass and duplicate suppression; register inside that guard.
try{const perf=window.__STORYWORLD_PERF_GROUPS_R266__;
 if(typeof perf?.registerPropRenderer==='function')perf.registerPropRenderer(paintProp);
 else if(typeof drawProp==='function'){const b=drawProp;drawProp=function(p,...a){if(paintProp(p))return;return b.call(this,p,...a);};}
}catch(e){fail(e);}
// 바닥 데칼: 바닥 그림 바로 뒤, 시야 안만.
function drawDecals(){if(!on||typeof room==='undefined'||!room?.r299Decals?.length||typeof project!='function')return;const z=typeof zoom==='number'?zoom:1,tile=typeof TILE==='number'?TILE:32,sight=window.__STORYWORLD_SIGHT24__,vw=typeof W==='number'?W:innerWidth,vh=typeof H==='number'?H:innerHeight;
 for(const d of room.r299Decals){const row=readyImage(d.path);if(!row){if(typeof addImage==='function')addImage(d.path);continue;}if(sight?.enabled&&!sight.pointVisible(d.x,d.y))continue;
  const q=project(d.x,d.y),A=DECAL[d.name];if(!A||q.x<-300||q.y<-300||q.x>vw+300||q.y>vh+300)continue;const im=row.image,iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height,w=A.tiles*2*tile*z,h=w*ih/iw;
  const paint=()=>{ctx.save();try{ctx.globalAlpha*=A.alpha;ctx.filter='brightness(.8) saturate(.85)';ctx.translate(q.x,q.y);if(d.rot)ctx.rotate(d.rot*.35);ctx.drawImage(im,0,0,iw,ih,-w/2,-h/2,w,h);stats.decalDraws++;}finally{ctx.restore();}};
  if(typeof ctx.scope==='function')ctx.scope({id:'r299:decal:'+d.name+':'+d.x+':'+d.y,kind:'ground',x:d.x,y:d.y,groundAligned:true,presentationOnly:true,alive:false,sourcePath:d.path},paint);else paint();}}
try{if(typeof groundImage==='function'){const b=groundImage;groundImage=function(...a){const out=b.apply(this,a);try{drawDecals();}catch(e){fail(e);}return out;};}}catch(e){fail(e);}
setInterval(()=>{try{if(typeof room!=='undefined'&&room&&!(typeof loading!=='undefined'&&loading))apply(room);}catch(e){fail(e);}},400);
function set(o){if(o&&typeof o.on==='boolean'){on=o.on;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}}}
window.__STORYWORLD_ENV_PROPS_R299__=Object.freeze({revision:REV,DECAL,PROP,THEME,CAP,themeOf,candidates,plan,apply,set,inspect:()=>({revision:REV,on,stats:{...stats},drawn:{...drawn},last,lastError,browserVerified:false,GPUVerified:false})});
})();
