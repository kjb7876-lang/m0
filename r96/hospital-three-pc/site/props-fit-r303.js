// R303 조형물 배치 맞춤(사용자 2026-11-04 "사몽 '불 꺼진 보건실' 등 학교 쪽 안에 왜 가로등과 조각상이 있는지, 캐비넷이나 창문은 각도에 맞게 배치해야지. 다른 맵들도").
//  원인 조사(헤드리스 R303 덤프):
//   ① 사몽 구역은 STORY 지역을 '기증자'로 빌려(room.id=ep1a09 병원 등) 만든다. R191 시대 규칙이 기증자의 지도 양식(clinic → 현대)을 보고
//      사몽 학교 구역의 책상(workbench 격자)·저장 등불·출구 표식까지 캐비닛·빈 침대·조각상으로 돌려 바꿨다(S02-7 에서 20개). → 사몽 구역에서는 되돌린다.
//   ② R81 이 R74 일반 가구에 지역 자료의 소품 그림을 입히는데, 병원·집 같은 실내 지역 자료에 가로등(broken_street_lamp)·빈 기념비·무너진 기둥·이끼 바위가 들어 있었다.
//      → 실내에서는 실외·석조 그림을 그 방의 실내 소품 그림(R80 지역 장면 소품)으로 바꾸고, 없으면 원래 R74 가구 그림으로 그린다.
//   ③ R191 의 현대 실내 가구 목록에 조각상이 들어 있었다 → 실내에서는 테마 가구(병원 빈 침대·캐비닛, 학교 책상·캐비닛)로 바꾼다.
//   ④ R74 캐비닛은 방 한가운데 아무 방향으로 섰다 → 가장 가까운 뒷벽(-x·-y, 화면 위쪽 벽)에 붙이고 벽 방향에 맞게 좌우를 고른다
//      (그림 정면이 +y 쪽이라 -y 벽은 그대로, -x 벽은 좌우 뒤집기). 앞벽(+x·+y)뿐이면 정면이 벽을 보게 되므로 그리지 않는다.
//   ⑤ 바닥 장식(R74 일반 가구·지역 장면 소품·지역 자료 소품)이 문·입구·출구·제단·목표·상자·저장 곁(1.4칸)이나 다른 장식과 겹치면(0.8칸) 그리지 않는다.
//  지역 판별은 기존 자료만 쓴다: 사몽 구역 = R123 분위기 테마(themeOf: S-02 → school), 본편 = worldR74.style·mode. 새 지역·서사 없음.
//  그리기 전용: 소품 자료 위치는 비충돌(solid 가 아닌) 장식만 옮기고, 충돌·길찾기·레이아웃·세이브·상호작용은 그대로. 시드 없는 결정적 규칙(같은 방 = 같은 결과).
//  끄기: localStorage['storyworld.r303.props']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_PROPS_FIT_R303__)return;
const REV='R303-props-fit-1',KEY='storyworld.r303.props';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={rooms:0,restored:0,reskinned:0,replaced:0,hidden:0,snapped:0,flipped:0,wallHidden:0,floorHidden:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const h32=s=>{let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};

// ---- 분류표 ----------------------------------------------------------------------------------
// 실외·석조(실내 금지): 가로등·나무·그루터기·고사리·이끼 바위·우물·기념비·무너진 기둥·부서진 성문·조각상·석상·오벨리스크·묘석.
const OUTDOOR=/street_lamp|dead_tree|tree-dead|tree-living|ash-tree|(^|[^a-z])pine([^a-z]|$)|stump|ferns|moss_boulders|village_well|(^|[^a-z])well([^a-z]|$)|blank_memorial|grave_marker|collapsed_pillar|broken_gate|(^|[^a-z])statue([^a-z]|$)|archivist_statue|(^|[^a-z])obelisk([^a-z]|$)|time_obelisk/;
// 그중 성당·교단·성 실내에는 어울리는 석조(조각상·기둥·성문·오벨리스크)
const STONE_OK=/collapsed_pillar|broken_gate|(^|[^a-z])statue([^a-z]|$)|archivist_statue|(^|[^a-z])obelisk([^a-z]|$)|time_obelisk/;
// 벽에 붙어야 하는 R80 그림(카탈로그 원본 이름: 약장·협탁 사물함·거울·금고문·방화문·액자·문틀) — 바닥 한가운데 대체 그림으로 쓰지 않는다.
const WALL_ART=/r80-(026|029|031|057|068|078|144|148)\.webp|cabinet|locker|shelf|mirror|window|door|frame|board/;
const R74_OUT=new Set(['statue','well','obelisk','ash-tree','pine','stump','ferns']);
const FURN={school:['workbench','cabinet'],hospital:['empty-bed','cabinet'],domestic:['cabinet','empty-bed'],other:['cabinet','crate']};
const artOf=p=>String(p?.r81NativeSkin?.path||p?.path||p?.key||p?.r74Prop||'');
// R80 already renders these preserved hospital source objects with indoor furniture skins.
const nativeHospital=p=>!!p&&(!!p.hospitalDoorFrameB3||/^ep1a08-prop-[1-8]$/.test(String(p.id||'')));
// 손대지 않는 것: 문·벽·NPC·목표·단서·진술·기록·상자·사몽 기능(저장 등불·출구·단상)·상호작용·충돌 소품.
function locked(p){return !p||typeof p!=='object'||nativeHospital(p)||p.interactive||p.r74Door||p.r81WardDoor||p.terrainWall||p.r75NPC||p.r75NarrativeNPC||p.r75FortPerson||p.r115Clue||p.r115Stmt!=null||p.r105Record||p.samongR103||p.objective||p.solid===true||/objective|chest/i.test(String(p.id||''));}
// 바닥 장식으로 다루는 묶음(다른 모듈이 자리를 따로 정한 R123·R117·R138·R161·R105 는 맡기지 않는다)
const isScenery=p=>!!p&&(/:scenery:/.test(String(p.id||''))||!!p.r80Dressing||/^[a-z0-9]+-prop-\d+$/i.test(String(p.id||'')));

// ---- 지역 판별 ---------------------------------------------------------------------------------
function themeOf(r){const L=r?.exploration||{},zid=L.samongR115?.zone||null;
 if(zid){let k=null;try{k=window.__STORYWORLD_MOOD_R123__?.themeOf?.(zid)?.key||null;}catch(_){}
  return{samong:true,zone:zid,theme:k==='school'?'school':'dream:'+(k||'?'),indoor:k==='school'};}
 if(L.samongR103)return{samong:true,zone:null,theme:'dream',indoor:false};
 const s=String(L.worldR74?.style||L.backgroundTheme||''),mode=L.worldR74?.mode;
 const theme=/clinic|ward|consult|hospital|injection/.test(s)?'hospital':/school|class|academy/.test(s)?'school':/chapel|cathedral|cult|church|sanct/.test(s)?'chapel'
  :/castle|palace|fortress|throne|keep/.test(s)?'castle':/forest|tree|garden|swamp|grove/.test(s)?'forest':/hotel|house|villa|kitchen|mirror|vault|stage/.test(s)?'domestic':'other';
 return{samong:false,zone:null,theme,style:s,indoor:mode==='indoor'};}
const badInside=(t,art)=>OUTDOOR.test(art)&&!((t.theme==='chapel'||t.theme==='castle')&&STONE_OK.test(art));

// ---- 기하 --------------------------------------------------------------------------------------
const A=()=>window.StoryPhase1;
function freeAt(L,x,y,s=.3){const a=A();if(typeof a?.explorationBlocked!=='function')return null;try{return !a.explorationBlocked(L,x,y,s);}catch(_){return null;}}
// 소품 칸에서 축 방향으로 걸어 벽까지의 칸 수(최대 lim). 벽을 못 찾으면 Infinity.
function wallDist(L,x,y,dx,dy,lim=16){const cx=Math.floor(x)+.5,cy=Math.floor(y)+.5;for(let k=1;k<=lim;k++){const f=freeAt(L,cx+dx*k,cy+dy*k,.2);if(f===null)return Infinity;if(!f)return k;}return Infinity;}
function avoidPoints(r){const L=r.exploration||{},out=[];const add=(q,rad)=>{if(q&&Number.isFinite(q.x+q.y))out.push({x:q.x,y:q.y,r:rad});};
 add(L.entry,1.6);add(L.samongR103?.exit,1.6);add(L.samongR103?.dais,2.4);add(r.objective,1.4);add(r.altar,1.6);
 for(const d of L.worldR74?.doors||[])add(d,1.6);
 for(const p of r.props||[])if(p&&(p.r74Door||p.r81WardDoor||p.samongR103||p.interactive||/chest/i.test(String(p.id||''))))add(p,1.4);
 return out;}
const near=(pts,x,y)=>pts.some(q=>Math.hypot(q.x-x,q.y-y)<q.r);

// ---- 한 방 적용 --------------------------------------------------------------------------------
const done=new WeakMap();
// 다른 모듈이 나중에 바꾸는 것(소품 수·R191 바꿔치기·R81 그림 입히기)이 생기면 다시 본다
const sigOf=r=>{let a=0,b=0;for(const p of r.props){if(p?.r191From)a++;const k=p?.r81NativeSkin?.path;if(k)b+=k.length;}return r.props.length+':'+a+':'+b;};
function apply(r){if(!on||!r||!Array.isArray(r.props))return null;const L=r.exploration;if(!L)return null;
 const sig=sigOf(r);const prev=done.get(r);if(prev&&prev.sig===sig&&prev.L===L)return prev.report;
 const t=themeOf(r),rep=prev&&prev.L===L?{...prev.report}:{room:r.id,zone:t.zone,theme:t.theme,indoor:t.indoor,restored:0,reskinned:0,replaced:0,hidden:0,snapped:0,flipped:0,wallHidden:0,floorHidden:0},base0={...rep};/* 다시 적용해도 방 합계는 누적 */
 try{
  // ① 사몽 구역: 기증 지역 양식으로 바뀐 R191 가구를 원래대로.
  if(t.samong)for(const p of r.props)if(p&&p.r191From&&p.r303From==null){p.r303From=p.r74Prop;p.r74Prop=p.r191From;delete p.r191From;rep.restored++;}
  if(t.indoor&&['school','hospital','domestic','chapel'].includes(t.theme)){const furn=FURN[t.theme]||FURN.other,indoorArt=r.props.filter(p=>p&&p.r80Dressing&&!locked(p)&&!badInside(t,artOf(p))&&p.path&&!WALL_ART.test(p.path));
   for(const p of r.props){if(locked(p)||p.r303Hide)continue;
    // ② R81 가 입힌 실외 그림 → 방의 실내 장면 소품 그림(없으면 R74 가구 그림)
    if(p.r81NativeSkin&&badInside(t,String(p.r81NativeSkin.path||''))){const d=indoorArt.length?indoorArt[h32(p.id)%indoorArt.length]:null;
     p.r303Skin=p.r81NativeSkin;p.r81NativeSkin=d?{path:d.path,height:Math.min(86,Number(d.height)||68)}:null;if(!d)delete p.r81NativeSkin;rep.reskinned++;}
    // ③ R74 가구가 실외·석조면 테마 가구로(같은 자리 교체)
    if(p.r74Prop&&!p.r81NativeSkin&&R74_OUT.has(p.r74Prop)&&badInside(t,p.r74Prop)){p.r303From=p.r303From??p.r74Prop;p.r74Prop=furn[h32(p.id)%furn.length];rep.replaced++;}
    // 같은 자리에 둘 실내 소품이 없는 실외 그림(지역 자료 소품·장면 소품) → 그리지 않는다
    else if(!p.r74Prop&&!p.r81NativeSkin&&badInside(t,artOf(p))){p.r303Hide='theme';rep.hidden++;}}}
  // ④ 벽붙이(R74 캐비닛): 뒷벽에 붙이고 방향 맞추기
  const avoid=avoidPoints(r);
  for(const p of r.props){if(locked(p)||p.r303Hide||p.r74Prop!=='cabinet'||p.r81NativeSkin||!Number.isFinite(p.x+p.y))continue;if(p.r303Wall||/:g\d+:/.test(String(p.id||'')))continue;/* 사몽 격자(신발장 줄 등)는 설계된 배치 */
   const dw=wallDist(L,p.x,p.y,-1,0),dn=wallDist(L,p.x,p.y,0,-1);if(dw===Infinity&&dn===Infinity&&freeAt(L,p.x,p.y)===null)continue;
   const cand=[];if(dn<=16)cand.push({side:'n',d:dn});if(dw<=16)cand.push({side:'w',d:dw});cand.sort((a,b)=>a.d-b.d||(a.side<b.side?-1:1));
   // R81 placements retain their original radius + wall margin when snapped.
   const clearance=p.r81RoomNode!==undefined?Math.max(.55,Number(p.radius)||0)+.12:.3,inset=Math.max(.42,clearance+.05);
   let placed=false;for(const c of cand){const cx=Math.floor(p.x)+.5,cy=Math.floor(p.y)+.5;
    for(const s of [0,1,-1,2,-2]){let x,y;if(c.side==='n'){x=cx+s;y=Math.floor(p.y)-c.d+1+inset;}else{x=Math.floor(p.x)-c.d+1+inset;y=cy+s;}
     if(freeAt(L,x,y,clearance)!==true||near(avoid,x,y))continue;
     if(c.side==='n'&&wallDist(L,x,y,0,-1,1)!==1)continue;if(c.side==='w'&&wallDist(L,x,y,-1,0,1)!==1)continue;
     if(r.props.some(q=>q!==p&&q&&!q.r303Hide&&Number.isFinite(q.x+q.y)&&Math.hypot(q.x-x,q.y-y)<.9))continue;
     if(Math.hypot(p.x-x,p.y-y)>.05){p.r303Moved={x:p.x,y:p.y};p.x=x;p.y=y;rep.snapped++;}
     p.r303Wall=c.side;if(c.side==='w'){p.r303Flip=true;rep.flipped++;}placed=true;break;}
    if(placed)break;}
   if(!placed){p.r303Hide='wall';rep.wallHidden++;}}
  // ⑤ 바닥 장식: 문·입구·제단·목표 곁, 서로 겹침
  const kept=[];
  const order=r.props.filter(p=>!locked(p)&&!p.r303Hide&&isScenery(p)&&!p.r303Wall&&Number.isFinite(p.x+p.y)).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  for(const p of order){if(near(avoid,p.x,p.y)||kept.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<.8)||freeAt(L,p.x,p.y,.05)===false){p.r303Hide='floor';rep.floorHidden++;continue;}kept.push(p);}
 }catch(e){fail(e);}
 for(const k of ['restored','reskinned','replaced','hidden','snapped','flipped','wallHidden','floorHidden'])stats[k]+=rep[k]-base0[k];if(!prev)stats.rooms++;
 done.set(r,{sig:sigOf(r),L,report:rep});return rep;}

// ---- 맵 이동 표식·저장 등불 그림(R303b, 사용자 2026-11-04 "맵 넘나들 때 오벨리스크 그만, 계단이나 문·워프 위주로") ------------------
//  사몽 출구(samongR103 'portal')·뒷문('back')은 R103 이 R74 오벨리스크로, 저장 등불('save'·'lamp')은 화로로 그렸다. 기능·위치·상호작용·충돌은 그대로 두고
//  그릴 때만 테마에 맞는 기존 그림으로: 학교·병원·집 실내 = R74 나무 문(열림/닫힘), 성당·성 = R74 청동 문, 그 밖(야외·사몽 꿈) = 무너진 포탈(v290)·무너진 계단(v290).
//  저장 등불은 실내(학교·병원·집)에서 R92 실내 조명(병원 등롱대·촛대)으로. R92 바닥 광원도 실내에서는 실내 조명 묶음만 쓴다(가로등 lights_regional_01 금지).
const INDOOR_LIGHTS=['lights_hospital_03','lights_domestic_01','lights_hospital_01','lights_domestic_04'];
const indoorHome=t=>!!t&&t.indoor&&['school','hospital','domestic'].includes(t.theme);
function markerArt(p,t){const k=p?.samongR103;if(!k||!t)return null;
 if(k==='portal'||k==='back'){const open=k==='portal';
  if(indoorHome(t))return{r74Prop:open?'oak-open':'oak-closed'};
  if(t.indoor&&(t.theme==='chapel'||t.theme==='castle'))return{r74Prop:open?'bronze-open':'bronze-closed'};
  return{path:open?'assets/props/v290/ruined_portal.webp':'assets/props/v290/collapsed_stairs.webp',height:open?104:96};}
 if((k==='save'||k==='lamp')&&indoorHome(t))return{path:'assets/r92/lights/'+INDOOR_LIGHTS[h32(p.id)%2]+'.png',height:96};
 return null;}
const loaded=new Set();function ensure(path){try{if(typeof readyImage==='function'&&readyImage(path))return true;if(!loaded.has(path)&&typeof addImage==='function'){loaded.add(path);addImage(path,'R303 props fit');}}catch(_){}return false;}
// 지역 공통 세부 장식(regionalDecoration, room.props 밖의 목록)도 실내에서 실외 그림이면 그리지 않는다(사몽 학교 구역의 가로등 regional-detail:ep1a09:*).
let themeCache=null;function roomTheme(){const r=typeof room!=='undefined'?room:null;if(!r)return null;if(themeCache?.r!==r||themeCache.L!==r.exploration)themeCache={r,L:r.exploration,t:themeOf(r)};return themeCache.t;}
function hideDetail(p){const t=roomTheme();return !!t&&t.indoor&&['school','hospital','domestic','chapel'].includes(t.theme)&&!locked(p)&&badInside(t,artOf(p));}
// Keep the room prop identity for R266's WeakSet; only drawing fields are temporary.
function drawMarker(p,draw){let t=null;try{t=roomTheme();}catch(_){return draw();}const m=markerArt(p,t);
 if(!m||(m.path&&!ensure(m.path)))return draw();
 const keys=m.path?['path','height','r74Prop','r81NativeSkin']:['r74Prop'];
 const saved=keys.map(k=>Object.getOwnPropertyDescriptor(p,k));
 try{
  if(m.path){p.path=m.path;p.height=m.height;delete p.r74Prop;delete p.r81NativeSkin;}
  else p.r74Prop=m.r74Prop;
  return draw();
 }finally{for(let i=0;i<keys.length;i++){if(saved[i])Object.defineProperty(p,keys[i],saved[i]);else delete p[keys[i]];}}
}
try{const P=window.__STORYWORLD_PROPS_R102__;const inner=P?.lamps;
 window.__STORYWORLD_PROPS_R102__=Object.freeze({...(P||{}),lamps:(z,reg,items,list,fam)=>{try{if(on&&typeof room!=='undefined'&&indoorHome(themeOf(room))&&Array.isArray(items)){const out=INDOOR_LIGHTS.map(id=>items.find(i=>i.id===id&&i.kind==='light')).filter(Boolean);if(out.length)return out;}}catch(e){fail(e);}
  return typeof inner==='function'?inner(z,reg,items,list,fam):null;}});}catch(e){fail(e);}

// ---- 그리기 -----------------------------------------------------------------------------------
try{if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){
 if(!on||!p)return base.call(this,p,...a);if(p.r303Hide)return;if(!p.samongR103&&p.regionalDecoration&&hideDetail(p))return;
 const draw=()=>{
 if(p.r303Flip&&typeof ctx?.scale==='function'&&typeof project==='function'){let q;try{q=project(p.x,p.y);}catch(e){return base.call(this,p,...a);}
  ctx.save();try{ctx.translate(q.x,0);ctx.scale(-1,1);ctx.translate(-q.x,0);return base.call(this,p,...a);}finally{ctx.restore();}}
 return base.call(this,p,...a);};
 return p.samongR103?drawMarker(p,draw):draw();};}}catch(e){fail(e);}
try{if(typeof makeRoom==='function'){const base=makeRoom;makeRoom=function(...a){const r=base.apply(this,a);try{apply(r);}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
(function poll(){try{if(typeof room!=='undefined'&&room)apply(room);}catch(e){fail(e);}setTimeout(poll,700);})();
function set(o){if(o&&typeof o.on==='boolean')on=o.on;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}}
window.__STORYWORLD_PROPS_FIT_R303__=Object.freeze({revision:REV,set,apply,themeOf,markerArt,INDOOR_LIGHTS,badInside,locked,isScenery,OUTDOOR,
 inspect:()=>({revision:REV,on,stats:{...stats},room:typeof room!=='undefined'&&room?(done.get(room)?.report||null):null,lastError})});
})();
