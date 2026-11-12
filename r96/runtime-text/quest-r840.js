// R840 서사별 NPC 퀘스트 — 사용자 2026-11-12 "적당한 npc들 2-3정도는 각 서사마다 등장하게 해줘 (맵말고 짧은서사) 서사에 따라서 서사는 바꾸지는 말고
//  간단한 몹처치 퀘스트나 특정장소가서 악에 물든 조형물 처치하면 단서템을 떨구는 이런 시스템, 길잡이는 이러한 퀘스트도 항상 올바르게 수행하도록, 영화모드랑도 잘해결해야해 버그없게끔".
//  · 서사(짧은 이야기 한 편)마다 인물 2~3명: R790 핵심 NPC(앳된 남자·고블린 두목 …)에 더해, 그 서사의 지역 들머리에 부탁하는 인물이 한 명씩 선다.
//  · 두 가지 부탁 — purge: 가는 길 곁에 드러나는 악에 물든 조형물을 세 번 쳐서 부수면 단서가 떨어진다 / kill: 정해진 몹을 정해진 수만큼 잡으면 단서가 떨어진다.
//    단서를 주우면 쪽지 모음(R169)에 정본 문장 그대로 한 장이 들어가고 패시브 포인트 2점(R62, 한 번만)을 받는다.
//  · 서사는 바꾸지 않는다: 곁일이라 R78 진행(문·보스·제단)과 R790 관문을 막지 않고, 단서 글·창의 인용은 정본(hapil-canon-r106-improved) 문장 그대로다. 대사는 짓지 않고 장면 묘사만 쓴다.
//    정본 34·35장은 주민 처치를 목표로 삼지 않으므로 불면귀 편은 조형물 부수기만 쓴다.
//  · 길잡이·영화 모드: 창 없이 스스로 한다(창이 뜨면 자동 진행이 멈춘다). 들머리에서 NPC → 조형물 → 단서 순서로 가고, 적이 8칸 안이면 원래 길잡이(전투)에 넘긴다.
//    처치 부탁은 받기만 하고 싸움은 원래 길잡이가 몬다(집결실에서 남은 몹이 다 모인다). 몹이 모자라면 필요한 수가 줄어든다.
//    길이 안 나오거나 6초 동안 가까워지지 못하면 그 자리에서 대신 마친다(막히지 않게). 서사 창·모달·불러오는 중·보스전에는 쉰다.
//  · 조형물·단서·NPC 는 모두 solid:false 라 길찾기와 충돌이 그대로다. 자리는 들머리→집결실 길에서 계산한다(맵 구조가 바뀌어도 따라간다).
//  · 그림: 불면귀 편은 Dots 주민 숨쉬기 시트(R763)·부적 말뚝·꺼진 등롱대(R810), 고블린 편은 R75 피난민 그림·v290 오염된 사당. 조형물의 검은 기운은 코드로 얹은 임시 표시다
//    (Dots 전용 NPC·기운 시트가 오면 바꾼다 — 최종 아트로 보고하지 않는다).
//  · 세이브 raw.questR840={version:1,rooms:{'STORY:last302':{s:'on'|'drop'|'done',k:처치 수}}}. 무한 생존·협동·EGO 재방문·사몽 층·R78 밖 지역은 건드리지 않는다.
//  끄기: localStorage['storyworld.r840.quest']='{"on":false}'. 점검: window.__STORYWORLD_QUEST_R840__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_QUEST_R840__)return;
const REV='R840-story-quest-1',KEY='storyworld.r840.quest';
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object'&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={placed:0,offers:0,taken:0,auto:0,hits:0,broken:0,kills:0,drops:0,done:0,walks:0,fallback:0,draws:0,errors:0};let lastError=null;const events=[];
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const T=()=>typeof time==='number'&&Number.isFinite(time)?time:0;
const note=(kind,d={})=>{events.push({kind,at:+T().toFixed(2),...d});if(events.length>40)events.shift();};
const REACH=2.4,GUIDE_REACH=2.2,HIT_REACH=1.9,PICKUP=1.35,ORB_DELAY=.55,HIT_GAP=.2,GUIDE_HIT=.35,STALL=6,POINTS=2,ORB_ART='assets/vfx/v31315/spirit-orb.webp';
const VIL='assets/r763/villagers/',N75='assets/r75/npcs.png';
const sheet=(path,vis)=>Object.freeze({path,w:256,h:256,px:128,py:234.67,vis,scale:1.3,frames:6,fps:5,faces:'right',sheetW:1536,sheetH:256});
const still=(x,y,w,h,px,py,vis)=>Object.freeze({path:N75,x,y,w,h,px,py,vis,scale:1.1,frames:1,sheetW:1536,sheetH:1024});
// 지역마다 부탁하는 인물 하나. episode = 서사 묶음(짧은 이야기 한 편). lore·clue.text 는 정본 문장 그대로(검사가 정본과 대조한다).
const DEFS=Object.freeze({
 last302:Object.freeze({episode:'한약과 불면귀',npc:Object.freeze({kind:'fisher',name:'잠들지 못한 어부',label:'잠들지 못한 어부 · 가리키는 곳',sub:'포구 · 그물을 멘 어부',sprite:sheet(VIL+'fisher-idle.webp',208),
   body:'그물을 멘 어부가 충혈된 눈으로 길 가의 붉은 부적 말뚝을 가리킨다. 얼굴의 표정과 몸의 움직임이 어긋나 있다.',lore:'포구 마을에서는 사람들이 살아가는 소리가 들리지 않았다. 주민들은 젖은 한지처럼 납작했고, 눈은 충혈되어 있었다.'}),
  quest:Object.freeze({type:'purge',hits:3,take:'말뚝을 찾아 부순다',hud:'어부가 가리킨 붉은 부적 말뚝 부수기',prop:Object.freeze({path:'assets/r810/talisman-post.webp',height:96,name:'악에 물든 부적 말뚝'})}),
  clue:Object.freeze({title:'실 끊긴 붉은 부적',text:'그런 주민들이 보이지 않는 실에 끌리듯 나를 향해 달려왔다. 얼굴의 표정과 몸의 움직임이 어긋나 있었다. 지친 몸이 바라는 것과 그 몸을 움직이는 힘은 달랐다.'})}),
 last303:Object.freeze({episode:'한약과 불면귀',npc:Object.freeze({kind:'herbwife',name:'약방 아낙',label:'약방 아낙 · 돌아보는 곳',sub:'안개 마을 · 약사발을 든 아낙',sprite:sheet(VIL+'herbwife-idle.webp',211),
   body:'약사발을 든 아낙이 길 가의 꺼진 등롱대 쪽으로 고개를 돌린다. 찢긴 등롱에 검은 안개가 서려 있다.',lore:'그들은 오랫동안 잠을 잃은 채 버티고 있었다.'}),
  quest:Object.freeze({type:'purge',hits:3,take:'등롱대를 찾아 부순다',hud:'아낙이 돌아본 꺼진 등롱대 부수기',prop:Object.freeze({path:'assets/r810/lantern-post-off.webp',height:104,name:'검은 안개가 서린 등롱대'})}),
  clue:Object.freeze({title:'안개 묻은 등롱 조각',text:'그들이 잠들지 못해 느끼는 두려움과 불면귀의 명령은 구분해야 했다.'})}),
 last304:Object.freeze({episode:'고블린 두목과 장미 인장',npc:Object.freeze({kind:'refugee-elder',name:'피난민 노인',label:'피난민 노인 · 바라보는 곳',sub:'중립 지역 · 길 가의 노인',sprite:still(252,15,201,490,82.04,486,482),
   body:'해진 숄을 두른 노인이 숲 쪽을 바라본다. 늑대 울음이 가까이에서 들린다.',lore:'숲에는 슬라임과 늑대, 고블린이 들끓었다.'}),
  quest:Object.freeze({type:'kill',count:5,take:'늑대를 쫓는다',hud:'길 가의 늑대 쫓기',match:e=>/^l304-e2(\b|-|$)/.test(String(e?.nativeId||''))||/늑대/.test(String(e?.name||''))}),
  clue:Object.freeze({title:'충돌의 흔적',text:'서로 어울리지 않는 풍경들이 맞붙은 그곳은, 둘째와 셋째의 세계가 충돌하는 중립 지역이었다.'})}),
 last305:Object.freeze({episode:'고블린 두목과 장미 인장',npc:Object.freeze({kind:'refugee-woman',name:'피난민 여인',label:'피난민 여인 · 가리키는 곳',sub:'늑대·고블린 숲 · 길 가의 여인',sprite:still(690,21,183,481,88.34,477,473),
   body:'머릿수건을 쓴 여인이 길 가의 검게 물든 사당을 가리킨다. 피리 소리가 그쪽에서 새어 나온다.',lore:'숲 깊은 곳에서 피리로 늑대를 조종하는 고블린 두목이 길을 막았다.'}),
  quest:Object.freeze({type:'purge',hits:3,take:'사당을 찾아 부순다',hud:'여인이 가리킨 악에 물든 사당 부수기',prop:Object.freeze({path:'assets/props/v290/corrupted_shrine.webp',height:104,name:'악에 물든 사당'})}),
  clue:Object.freeze({title:'갈라진 하늘의 날',text:'하늘이 갈라지던 날 무너진 성에 방향을 알 수 없는 문이 열렸고, 그때부터 서쪽과 동쪽, 산 자와 죽은 자가 뒤섞였다는 것이었다.'})})});
const STATES=['on','drop','done'];let ledger={};
const keyOf=r=>r.layer+':'+r.id,defOf=r=>r&&typeof r.id==='string'&&Object.prototype.hasOwnProperty.call(DEFS,r.id)?DEFS[r.id]:null;
const here=()=>{try{return typeof room!=='undefined'?room:null;}catch(_){return null;}};
const R78=()=>window.__STORYWORLD_WORLD_COMBAT_R78__;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const solo=()=>{try{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off';}catch(_){return true;}};
function clean(v){/* 순수: 깨진 값은 던지지 않고 버린다 */const out={};if(!v||typeof v!=='object'||v.version!==1||!v.rooms||typeof v.rooms!=='object'||Array.isArray(v.rooms))return out;
 for(const k of Object.keys(v.rooms).slice(0,64)){const m=/^STORY:([\w-]+)$/.exec(k);if(!m||!Object.prototype.hasOwnProperty.call(DEFS,m[1]))continue;const s=v.rooms[k];if(!s||typeof s!=='object'||!STATES.includes(s.s))continue;
  const n=Number(s.k);out[k]={s:s.s,k:Number.isFinite(n)?Math.max(0,Math.min(99,Math.floor(n))):0};}return out;}
function applies(r){try{if(!prefs.on||!r||r.layer!=='STORY'||r.egoVisitId151||!defOf(r))return false;if(window.__STORYWORLD_SURVIVAL_R600__?.active?.())return false;if(!solo())return false;return !!R78()?.controlled?.(r);}catch(e){fail(e);return false;}}
const stOf=(r=here())=>r&&ledger[keyOf(r)]?.s||'new';
const killsOf=r=>r&&ledger[keyOf(r)]?.k||0;
function zoneDone(r){try{return typeof completed==='function'&&completed(r.id,'STORY')===true;}catch(_){return false;}}
// 보이는 조건: 받지 않은 채 이미 끝낸 지역에는 다시 세우지 않는다(옛 세이브·재방문에 새 일을 만들지 않음).
const visible=(r=here())=>applies(r)&&(stOf(r)!=='new'||!zoneDone(r));
function phaseOf(r){try{return R78()?.state?.(r)?.phase||null;}catch(e){fail(e);return null;}}
const npc=(r=here())=>r?.props?.find(p=>p&&p.r840NPC)||null,propOf=(r=here())=>r?.props?.find(p=>p&&p.r840Prop)||null,orbOf=(r=here())=>r?.props?.find(p=>p&&p.r840Clue)||null;
// ── 자리(순수) ──
const unit=(a,b)=>{const d=Math.hypot(b.x-a.x,b.y-a.y)||1;return {x:(b.x-a.x)/d,y:(b.y-a.y)/d};};
// 길(점 목록)에서 처음부터 want 칸 간 곳과 그곳의 진행 방향.
function along(pts,want){if(!Array.isArray(pts)||pts.length<2)return null;let acc=0;for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],d=Math.hypot(b.x-a.x,b.y-a.y);if(!(d>0))continue;
  if(acc+d>=want){const u=(want-acc)/d;return {x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,dir:unit(a,b)};}acc+=d;}return null;}
const lengthOf=pts=>{let n=0;for(let i=1;i<(pts?.length||0);i++)n+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);return n;};
// 한 점에서 길 옆으로 비켜 선 빈 자리. avoid = [{x,y,min}] 에서 min 칸 안이면 건너뛴다.
function beside(c,isBlocked,avoid,sides){if(!c||!Number.isFinite(c.x+c.y))return null;const t={x:-c.dir.y,y:c.dir.x};
 /* 길 양옆이 다 되면 더 트인 쪽(둘레 16점 가운데 빈 곳이 많은 쪽)에 선다 — 장면 실측: last302 어부가 들머리 문짝 뒤에 서서 반쯤 가렸다. 같으면 앞 후보 그대로. */
 const open=q=>{let n=0;for(let i=0;i<8;i++){const a=i*Math.PI/4;for(const d of [1.2,2.4])if(!isBlocked(q.x+Math.cos(a)*d,q.y+Math.sin(a)*d,.34))n++;}return n;};
 const ok=s=>{const q={x:c.x+t.x*s,y:c.y+t.y*s};if(isBlocked(q.x,q.y,.34))return null;if(avoid.some(a=>Math.hypot(a.x-q.x,a.y-q.y)<a.min))return null;return q;};
 for(let i=0;i<sides.length;i+=2){const a=ok(sides[i]),b=i+1<sides.length?ok(sides[i+1]):null;if(a&&b)return open(b)>open(a)?b:a;if(a||b)return a||b;}return null;}
// NPC: 들머리에서 가는 길로 6칸쯤 들어가 길 옆 1.7칸. 길이 없으면 집결실 쪽 직선으로 같은 계산.
//  (헤드리스 장면 실측: 이 캠페인 맵은 들머리 3칸 안쪽에 방 목록에 없는 화로·촛대가 서 있어 3칸 자리는 그림이 겹쳤다 → 여섯 후보를 찍어 보고 6칸·+1.7 로 정함.)
function npcSpot(entry,goal,pts,isBlocked,avoid=[]){if(!entry||!Number.isFinite(entry.x+entry.y))return null;const line=[entry,goal&&Number.isFinite(goal.x+goal.y)?goal:{x:entry.x-1,y:entry.y-1}];
 for(const path of [pts,line])for(const want of [6,5.2,4.4,3.4]){const c=along(path,want);if(!c)continue;const q=beside(c,isBlocked,avoid,[1.7,-1.7,2.2,-2.2,1.3,-1.3]);if(q&&Math.hypot(q.x-entry.x,q.y-entry.y)<=8)return q;}return null;}
// 조형물: 길의 35%쯤(12~34칸) 간 곳, 길 옆 1.8칸. NPC 에서 8칸 넘게 떨어지고 문턱·다른 조형물과 겹치지 않게.
function propSpot(entry,goal,pts,isBlocked,avoid=[],from=null){if(!entry||!Number.isFinite(entry.x+entry.y))return null;const g=goal&&Number.isFinite(goal.x+goal.y)?goal:{x:entry.x-30,y:entry.y-30},line=[entry,g];
 for(const path of [pts,line]){const L=lengthOf(path);if(!(L>10))continue;for(const f of [.35,.45,.27,.55,.2]){const want=Math.max(12,Math.min(34,L*f));if(want>L-4)continue;const c=along(path,want);if(!c)continue;
   const q=beside(c,isBlocked,avoid,[1.8,-1.8,2.3,-2.3,1.4,-1.4]);if(q&&(!from||Math.hypot(q.x-from.x,q.y-from.y)>=8))return q;}}return null;}
function spots(r){/* 방마다 한 번 계산해 둔다(같은 구조면 같은 자리) */if(r.r840Spots&&r.r840Spots.props===r.exploration)return r.r840Spots;const d=defOf(r),ex=r.exploration||{},entry=ex.entry,goal=ex.worldWardR81?.gatherAnchor||r.objective;
 const isB=(x,y,rad)=>{try{return !!blocked(x,y,rad,r);}catch(_){return true;}};let pts=null;
 try{if(entry&&goal&&typeof findPath==='function'){const p=findPath(entry,goal,r,.31);if(Array.isArray(p)&&p.length)pts=[{x:entry.x,y:entry.y},...p];}}catch(e){fail(e);}
 const doors=(ex.worldR74?.doors||[]).filter(v=>v&&Number.isFinite(v.x+v.y)).map(v=>({x:v.x,y:v.y,min:3.2})),solids=(r.props||[]).filter(p=>p&&!p.r840NPC&&!p.r840Prop&&!p.r840Clue&&Number.isFinite(p.x+p.y)).map(p=>({x:p.x,y:p.y,min:1.3}));
 /* 길 가 세움 등(R92)·벽 등(R91)은 방 소품 목록에 없다 → 그 자리 목록을 받아 4.5칸 안에는 놓지 않는다(장면 실측: last303 조형물이 석등 바로 옆에 섰다). */
 let lamps=[];try{lamps=[...(window.__STORYWORLD_VISUAL_R92__?.lightPoints?.()||[]),...(window.__STORYWORLD_VISUAL_R91__?.lightPoints?.()||[])].filter(v=>v&&Number.isFinite(v.x+v.y)).map(v=>({x:v.x,y:v.y,min:4.5}));}catch(e){fail(e);}
 const n=npcSpot(entry,goal,pts,isB,[...doors.map(v=>({...v,min:5.5})),...solids,...lamps.map(v=>({...v,min:1.6}))])/* NPC 는 등 곁에 서도 된다(겹치지만 않게). 들머리 문짝(door-1)에서는 5.5칸 — 문짝 그림이 길어 가까우면 몸이 가린다(last302 실측 4.3칸에서 가림). */,q=d.quest.type==='purge'?propSpot(entry,goal,pts,isB,[...doors,...solids,...lamps],n):null;
 return r.r840Spots={props:r.exploration,npc:n,prop:q,pathed:!!pts,lamps:lamps.length};}
/* 조형물 자리는 퀘스트를 받는 순간(방 소품·등이 다 놓인 뒤)에 다시 잰다 — 방에 막 들어온 때는 다른 오버레이가 가구를 아직 덜 놓았을 수 있다. NPC 자리는 그대로 둔다. */
function respot(r){const keep=r.r840Spots?.npc||null;r.r840Spots=null;const sp=spots(r);if(keep)sp.npc=keep;return sp;}
function img(p){try{const r=typeof readyImage==='function'?readyImage(p):null;if(r&&r.ready!==false&&r.image)return r.image;}catch(_){}try{if(typeof addImage==='function')addImage(p,'R840 서사 퀘스트');}catch(_){}return null;}
// ── 방에 놓기: 상태에 맞게 NPC·조형물·단서를 맞춘다(여러 번 불러도 같음) ──
function dropAt(r,pt){const cur=orbOf(r);if(cur)return cur;const o={id:'r840:clue:'+r.id,x:pt.x,y:pt.y,path:ORB_ART,height:30,solid:false,visible:true,autoTargetEligible6:false,r840Clue:{at:T()}};r.props.push(o);stats.drops++;note('drop',{zone:r.id,x:+pt.x.toFixed(2),y:+pt.y.toFixed(2)});return o;}
function freeNear(r,pt){try{if(pt&&Number.isFinite(pt.x+pt.y)&&!blocked(pt.x,pt.y,.3,r))return {x:pt.x,y:pt.y};}catch(_){}return {x:player.x,y:player.y};}
function ensure(r=here()){if(!r||!Array.isArray(r.props))return null;const want=visible(r),st=stOf(r),d=defOf(r);
 if(!want){if(npc(r)||propOf(r)||orbOf(r))r.props=r.props.filter(p=>!p.r840NPC&&!p.r840Prop&&!p.r840Clue);return null;}
 let sp=spots(r);if(st==='on'&&d.quest.type==='purge'&&!propOf(r)&&!sp.fresh){sp=respot(r);sp.fresh=true;}let n=npc(r);
 if(!n&&sp.npc){n={id:'r840:npc:'+r.id+':'+d.npc.kind,x:sp.npc.x,y:sp.npc.y,home:{...sp.npc},r840NPC:d.npc.kind,solid:false,visible:true,autoTargetEligible6:false};try{img(d.npc.sprite.path);}catch(e){fail(e);}r.props.push(n);stats.placed++;note('placed',{zone:r.id,x:+n.x.toFixed(2),y:+n.y.toFixed(2)});}
 const wantProp=st==='on'&&d.quest.type==='purge'&&!!sp.prop,q=propOf(r);
 if(wantProp&&!q){try{img(d.quest.prop.path);}catch(e){fail(e);}r.props.push({id:'r840:prop:'+r.id,x:sp.prop.x,y:sp.prop.y,r840Art:d.quest.prop.path,height:d.quest.prop.height,solid:false,visible:true,autoTargetEligible6:false,r840Prop:{hits:0,at:T(),lastHit:-99}});}
 else if(!wantProp&&q)r.props=r.props.filter(p=>!p.r840Prop);
 if(st==='on'&&d.quest.type==='purge'&&!sp.prop){/* 놓을 자리를 못 찾은 맵: 막히지 않게 바로 단서를 떨어뜨린다 */stats.fallback++;setState(r,'drop');dropAt(r,freeNear(r,n||player));return n;}
 if(st==='drop'){if(!orbOf(r))dropAt(r,sp.prop||freeNear(r,player));}else if(orbOf(r))r.props=r.props.filter(p=>!p.r840Clue);
 return n;}
function setState(r,s){const cur=ledger[keyOf(r)]||{s:'new',k:0};ledger[keyOf(r)]={s,k:cur.k||0};}
// ── 진행 ──
const autoRun=()=>{try{return typeof guide!=='undefined'&&!!guide;}catch(_){return false;}};
function matching(r){const d=defOf(r);return (r.enemies||[]).filter(e=>{try{return e&&d.quest.match(e);}catch(_){return false;}});}
const aliveOf=e=>e.hp>0&&e.spawnState!=='dead'&&!e.deadRecorded;
function need(r=here()){const d=defOf(r);if(!d||d.quest.type!=='kill')return 0;const k=killsOf(r);if(stOf(r)!=='on')return Math.max(k,stOf(r)==='new'?d.quest.count:k);return Math.min(d.quest.count,k+matching(r).filter(aliveOf).length);}
function take(r){const d=defOf(r);if(stOf(r)!=='new')return false;ledger[keyOf(r)]={s:'on',k:0};stats.taken++;note('taken',{zone:r.id,type:d.quest.type});try{if(modal)closePanel(true);}catch(e){fail(e);}
 if(d.quest.type==='kill')for(const e of matching(r))if(!aliveOf(e))e.r840Seen=true;/* 받기 전에 쓰러진 몹은 세지 않는다 */
 ensure(r);try{toast(d.quest.hud,3.5);}catch(e){fail(e);}try{saveGame(false);}catch(e){fail(e);}try{if(typeof updateHUD==='function')updateHUD();}catch(e){fail(e);}return true;}
function offer(r){const d=defOf(r);stats.offers++;if(autoRun()){stats.auto++;return take(r);}
 const esc=typeof escapeHTML==='function'?escapeHTML:s=>String(s),s=d.npc.sprite,k=148/(s.frames>1?s.h:s.h),bw=Math.round((s.frames>1?s.w:s.w)*k);
 const bg='background-image:url(./'+s.path+');background-repeat:no-repeat;background-size:'+Math.round(s.sheetW*k)+'px '+Math.round(s.sheetH*k)+'px;background-position:'+(-Math.round((s.x||0)*k))+'px '+(-Math.round((s.y||0)*k))+'px';
 openPanel('<h2>'+esc(d.npc.name)+'</h2><p>'+esc(d.npc.sub)+'</p><div class="questR840" style="display:flex;gap:16px;align-items:center;justify-content:flex-start;flex-wrap:wrap;margin:10px 0 14px">'
  +'<div style="width:148px;height:148px;display:flex;justify-content:center;border-radius:10px;border:1px solid rgba(255,190,110,.35);background:#0d1018;overflow:hidden"><div style="width:'+bw+'px;height:148px;'+bg+'"></div></div>'
  +'<div style="max-width:360px;text-align:left"><p style="margin:0 0 8px">'+esc(d.npc.body)+'</p><p style="margin:0 0 8px;opacity:.72;font-size:.92em">'+esc(d.npc.lore)+'</p><p style="margin:0;color:#f1cf9a;font-size:.92em">곁일 · '+esc(d.quest.hud)+' → 단서</p></div></div>'
  +'<div class="actions"><button id="questTakeR840">'+esc(d.quest.take)+'</button><button id="questWaitR840">나중에</button></div>');
 button('questTakeR840',()=>{const now=here();if(now===r&&visible(r)&&stOf(r)==='new')take(r);else closePanel(true);});button('questWaitR840',()=>closePanel(true));return true;}
function hit(r,all){const q=propOf(r),d=defOf(r);if(!q||stOf(r)!=='on')return false;const s=q.r840Prop;if(!all&&T()-s.lastHit<HIT_GAP)return true;s.lastHit=T();s.hits=all?d.quest.hits:s.hits+1;stats.hits++;
 try{if(typeof fx==='function'&&typeof VFX!=='undefined'&&VFX.burst)fx('burst',q.x,q.y,{asset:VFX.burst,size:.7,life:.3});}catch(_){}try{if(typeof sound==='function')sound('attack');}catch(_){}
 if(s.hits>=d.quest.hits){const pt={x:q.x,y:q.y};r.props=r.props.filter(p=>p!==q);setState(r,'drop');stats.broken++;note('broken',{zone:r.id});dropAt(r,pt);
  try{if(typeof sound==='function')sound(typeof soundProfiles!=='undefined'&&soundProfiles.r542Crush?.length?'r542Crush':'attack');}catch(_){}try{toast(d.quest.prop.name+'이(가) 부서졌습니다 · 떨어진 단서를 주우세요.',3);}catch(e){fail(e);}try{saveGame(false);}catch(e){fail(e);}}return true;}
function finish(r){const d=defOf(r);if(stOf(r)!=='drop')return false;setState(r,'done');r.props=r.props.filter(p=>!p.r840Clue);stats.done++;note('done',{zone:r.id});
 try{window.__STORYWORLD_PLAY_R169__?.collect?.({key:'quest:r840:'+r.id,title:'단서 · '+d.clue.title,narr:d.npc.name,place:d.episode,text:d.clue.text});}catch(e){fail(e);}
 let pts=false;try{pts=!!window.__STORYWORLD_PROGRESSION_R62__?.awardPointDrop?.(POINTS,'r64:r840quest:'+r.layer+':'+r.id,player);}catch(e){fail(e);}
 try{toast('단서 · '+d.clue.title+' — 쪽지 모음에 넣었습니다.'+(pts?' 패시브 포인트 '+POINTS+'점.':''),4);}catch(e){fail(e);}try{if(typeof sound==='function')sound('upgrade');}catch(_){}
 try{if(typeof updateHUD==='function')updateHUD();}catch(e){fail(e);}try{saveGame(false);}catch(e){fail(e);}return true;}
function counted(r,e){const d=defOf(r);if(!d||d.quest.type!=='kill'||stOf(r)!=='on'||!e||e.r840Seen||e.hp>0)return;let m=false;try{m=!!d.quest.match(e);}catch(_){}if(!m)return;e.r840Seen=true;ledger[keyOf(r)].k=Math.min(99,killsOf(r)+1);stats.kills++;
 if(killsOf(r)>=need(r)){setState(r,'drop');dropAt(r,freeNear(r,e));try{toast('떨어진 단서를 주우세요.',3);}catch(_){}try{saveGame(false);}catch(er){fail(er);}}try{if(typeof updateHUD==='function')updateHUD();}catch(er){fail(er);}}
let nextCheck=0;
function upkeep(r){/* tick 뒤: 놓기 맞추기, 처치 수 줄이기, 단서 줍기 */if(!r||!defOf(r))return;ensure(r);if(!visible(r))return;const st=stOf(r);
 if(st==='on'&&defOf(r).quest.type==='kill'&&T()>=nextCheck){nextCheck=T()+.5;if(killsOf(r)>=need(r)){setState(r,'drop');dropAt(r,freeNear(r,player));try{saveGame(false);}catch(e){fail(e);}}}
 if(st==='drop'&&player?.hp>0&&!loading){const o=orbOf(r);if(o&&T()-o.r840Clue.at>=ORB_DELAY&&dist(player,o)<=PICKUP)finish(r);}}
function tryUse(){const r=here();if(!visible(r))return false;const st=stOf(r),d=defOf(r),p=npc(r);
 if(p&&dist(player,p)<=REACH){if(st==='new'){offer(r);return true;}if(st==='on'){try{toast(d.quest.hud+(d.quest.type==='kill'?' '+killsOf(r)+'/'+need(r):''),3);}catch(e){fail(e);}return true;}if(st==='drop'){try{toast('떨어진 단서를 주우세요.',3);}catch(e){fail(e);}return true;}return false;}
 const q=propOf(r);if(st==='on'&&q&&dist(player,q)<=HIT_REACH)return hit(r,false);return false;}
// ── 길잡이 ──
let walk=null,nextNav=0,nextHit=0;
function guideLive(){try{return autoRun()&&started&&!modal&&!loading&&!(typeof storyScene!=='undefined'&&storyScene)&&player&&player.hp>0;}catch(_){return false;}}
function enemyNear(){try{return typeof nearestEnemy==='function'&&!!nearestEnemy(9);}catch(_){return false;}}
function pathTo(pt){try{const r=window.__STORYWORLD_POLISH_R100__?.navPath?.(player,pt);return Array.isArray(r)&&r.length>1?r:null;}catch(e){fail(e);return null;}}
function guideStepR840(){const r=here();if(!visible(r))return false;const st=stOf(r),d=defOf(r);if(st==='done')return false;if(st==='on'&&d.quest.type==='kill')return false;
 const ph=phaseOf(r);if(ph==='boss'||ph==='doorStory'||r.engaged)return false;if(st==='new'&&ph!=='route')return false;/* 뒤늦게 켠 길잡이는 들머리로 되돌아가지 않는다 */
 if(enemyNear()){walk=null;return false;}ensure(r);
 const tgt=st==='new'?npc(r):st==='on'?propOf(r):orbOf(r),reach=st==='new'?GUIDE_REACH:st==='on'?HIT_REACH-.2:.6;
 const act=fb=>{if(fb){stats.fallback++;note('fallback',{zone:r.id,st});}walk=null;if(st==='new'){stats.offers++;stats.auto++;return take(r);}if(st==='on'){if(fb)return hit(r,true);if(T()>=nextHit){nextHit=T()+GUIDE_HIT;hit(r,false);}return true;}return finishNow(r);};
 if(!tgt)return act(true),true;const dd=dist(player,tgt);
 if(dd<=reach){if(st==='drop'){/* 줍기는 upkeep 이 한다(떨어진 직후 잠깐 기다림) */if(T()-tgt.r840Clue.at>=ORB_DELAY+2)finishNow(r);return true;}act(false);return true;}
 if(!walk||walk.id!==tgt.id)walk={id:tgt.id,best:dd,bestAt:T(),tries:0};if(dd<walk.best-.3){walk.best=dd;walk.bestAt=T();}
 if(T()-walk.bestAt>STALL){act(true);return true;}
 let moving=false;try{moving=typeof route!=='undefined'&&Array.isArray(route)&&route.length>0;}catch(_){}
 if(!moving&&T()>=nextNav){nextNav=T()+.5;const p=pathTo({x:tgt.x,y:tgt.y});if(p){route=p.slice(1).map(v=>({x:v.x,y:v.y}));command=null;stats.walks++;}else if(++walk.tries>=3){act(true);return true;}}
 return true;}
function finishNow(r){const o=orbOf(r);if(o)o.r840Clue.at=-99;return finish(r);}
// ── 엔진에 얹기 ──
// 이 파일은 순서가 고정된 긴 스크립트 줄보다 앞에 실린다(순서 검사 r176 등을 건드리지 않게). 길잡이·상호작용·처치·목표 글은 다른 오버레이(R261·R426·R272 …)보다
//  바깥에서 먼저 봐야 하므로 첫 tick(모든 스크립트가 실린 뒤)에 한 번 얹는다.
let installed=false;function install(){if(installed)return;installed=true;
if(typeof interact==='function'){const base=interact;interact=function(...a){try{if(started&&!modal&&!loading&&player?.hp>0&&tryUse())return true;}catch(e){fail(e);}return base.apply(this,a);};}
for(const name of ['basicAttack','special']){if(typeof window[name]!=='function')continue;const base=window[name];
 window[name]=function(...a){const r0=base.apply(this,a);try{const r=here();if(started&&!modal&&!loading&&player?.hp>0&&visible(r)&&stOf(r)==='on'){const q=propOf(r);if(q&&dist(player,q)<=HIT_REACH+.3)hit(r,false);}}catch(e){fail(e);}return r0;};}
if(typeof killEnemy==='function'){const base=killEnemy;killEnemy=function(e,...a){const r0=base.apply(this,[e,...a]);try{const r=here();if(e&&visible(r))counted(r,e);}catch(err){fail(err);}return r0;};}
if(typeof guideStep==='function'){const base=guideStep;guideStep=function(...a){try{if(guideLive()&&guideStepR840())return;}catch(e){fail(e);}return base.apply(this,a);};}
if(typeof updateHUD==='function'){const base=updateHUD;updateHUD=function(...a){const r0=base.apply(this,a);try{const r=here();if(started&&visible(r)){const st=stOf(r),d=defOf(r),el=$('questText');
   if(el&&(st==='on'||st==='drop')){const add=st==='drop'?'떨어진 단서 줍기':d.quest.hud+(d.quest.type==='kill'?' '+killsOf(r)+'/'+need(r):'');if(!String(el.textContent).includes(add))el.textContent=String(el.textContent)+' · 곁일: '+add;}}}catch(e){fail(e);}return r0;};}
}
if(typeof tick==='function'){const base=tick;tick=function(...a){const r0=base.apply(this,a);try{install();upkeep(here());}catch(e){fail(e);}return r0;};}
// ── 그리기 ──
function label(text,x,y,color){try{if(typeof ctx?.fillText!=='function')return;ctx.save?.();ctx.font='11px "Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.fillStyle=color||'#f1cf9a';ctx.shadowColor='#000';ctx.shadowBlur=4;ctx.fillText(text,x,y);ctx.shadowBlur=0;ctx.restore?.();}catch(e){fail(e);}}
function drawNPC(p){const r=here(),d=defOf(r);if(!d)return false;const s=d.npc.sprite;if(!img(s.path))return false;const t=T(),q=project(p.x,p.y);
 const f=s.frames>1?((Math.floor(t*s.fps)%s.frames)+s.frames)%s.frames:0,rect=[(s.x||0)+f*(s.frames>1?s.w:0),s.y||0,s.w,s.h],fr={path:s.path,assetFrame:{sourceRect:rect,pivot:[s.px,s.py],visibleHeight:s.vis},sourceAlphaCore:rect,metricThreshold:16,sourcePixelsEdited:false};
 let flip=false;try{if(s.faces==='right'&&player)flip=project(player.x,player.y).x<q.x-4;}catch(_){}
 const h=actorHeight()*s.scale*(s.frames>1?1:1+.008*Math.sin(t*1.7)),paint=()=>drawAssetFrame3(s.path,fr,q.x,q.y,h,{angle:0,alpha:1,flip});stats.draws++;
 let res;const f0=ctx&&typeof ctx.filter==='string'?ctx.filter:null;try{if(f0!==null)ctx.filter='brightness(1.3)';res=ctx?.scope?ctx.scope({id:'prop:'+p.id,kind:'prop',x:p.x,y:p.y,bodyPath:s.path,alive:true},paint):paint();}finally{if(f0!==null)ctx.filter=f0;}
 if(stOf(r)==='new')label(d.npc.name,q.x,q.y-h-8);return res;}
function aura(p,strength){/* 임시 표시(코드): 발치의 검붉은 기운. Dots 기운 시트가 오면 바꾼다 */try{if(typeof ctx?.createRadialGradient!=='function')return;const q=project(p.x,p.y),z=typeof zoom==='number'?zoom:1,t=T(),a=(.5+.16*Math.sin(t*2.3))*strength,rad=40*z;
  ctx.save();ctx.globalAlpha=a;const g=ctx.createRadialGradient(q.x,q.y-6*z,0,q.x,q.y-6*z,rad);g.addColorStop(0,'rgba(200,24,40,.95)');g.addColorStop(.5,'rgba(96,10,30,.6)');g.addColorStop(1,'rgba(10,4,10,0)');ctx.fillStyle=g;ctx.fillRect(q.x-rad,q.y-6*z-rad*.55,rad*2,rad*1.1);ctx.restore();}catch(e){fail(e);}}
if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){if(!p||(!p.r840NPC&&!p.r840Prop&&!p.r840Clue))return base.apply(this,[p,...a]);
  try{if(p.r840NPC)return drawNPC(p);const r=here(),d=defOf(r),z=typeof zoom==='number'?zoom:1;
   if(p.r840Prop){aura(p,1);/* 그림 경로는 그리는 동안만 준다: 평소 path 가 없어야 불빛 계통(R123 isLight·R300·R451 — 경로의 lantern·shrine 낱말로 고름)이 '악에 물든' 조형물을 등불로 보지 않는다. */
    let r0;const f0=ctx&&typeof ctx.filter==='string'?ctx.filter:null;p.path=p.r840Art;try{if(f0!==null)ctx.filter='brightness(1.35)';r0=base.apply(this,[p,...a]);}finally{delete p.path;if(f0!==null)ctx.filter=f0;}const q=project(p.x,p.y);if(d)label(d.quest.prop.name+' '+p.r840Prop.hits+'/'+d.quest.hits,q.x,q.y-(p.height||90)*z*.78-8,'#ff9c8a');return r0;}
   const r0=base.apply(this,[p,...a]);const q=project(p.x,p.y);label('단서',q.x,q.y-(24+4*Math.sin(T()*3))*z,'#ffe3a0');return r0;}catch(e){fail(e);}};}
(function world(){const w=window.__STORYWORLD_WORLD_R74__;if(!w||typeof w.interactions!=='function')return;
 const mine=t=>{const id=String(t?.id||'');return id.startsWith('r840:npc:')||id.startsWith('r840:prop:');};
 const canUse=(t,pl)=>{const r=here();pl=pl||player;if(!visible(r)||loading||!(pl?.hp>0))return false;const st=stOf(r),p=npc(r),q=propOf(r);if(p&&t.id===p.id)return st==='new'&&dist(pl,p)<=REACH;if(q&&t.id===q.id)return st==='on'&&dist(pl,q)<=HIT_REACH;return false;};
 window.__STORYWORLD_WORLD_R74__=Object.freeze({...w,interactions(){const rows=w.interactions();try{const r=here();if(visible(r)){const st=stOf(r),d=defOf(r),p=npc(r),q=propOf(r);
    if(st==='new'&&p)return rows.concat({id:p.id,kind:'npc',label:d.npc.label,point:{x:p.x,y:p.y},reach:REACH});if(st==='on'&&q)return rows.concat({id:q.id,kind:'npc',label:d.quest.prop.name+' 부수기',point:{x:q.x,y:q.y},reach:HIT_REACH});}}catch(e){fail(e);}return rows;},
  canUse(t,pl,...a){return mine(t)?canUse(t,pl):w.canUse(t,pl,...a);},use(t,...a){if(!mine(t))return w.use(t,...a);try{if(!canUse(t))return false;const r=here();if(String(t.id).startsWith('r840:npc:'))return offer(r);return hit(r,false);}catch(e){fail(e);return false;}}});})();
if(typeof serializeSave==='function'){const base=serializeSave;serializeSave=function(...a){const raw=base.apply(this,a);try{if(raw&&typeof raw==='object'){const rooms={};for(const [k,v] of Object.entries(ledger))if(STATES.includes(v.s))rooms[k]={s:v.s,k:v.k||0};raw.questR840={version:1,rooms};}}catch(e){fail(e);}return raw;};}
if(typeof restoreSave==='function'){const base=restoreSave;restoreSave=async function(raw,...a){const prior=ledger;let next={};try{next=clean(raw?.questR840);}catch(e){fail(e);}ledger=next;walk=null;
  try{const r=await base.call(this,raw,...a);if(r===false)ledger=prior;else try{ensure();}catch(e){fail(e);}return r;}catch(e){ledger=prior;throw e;}};}
if(typeof newGame==='function'){const base=newGame;newGame=async function(...a){const prior=ledger,before=typeof player!=='undefined'?player:null;ledger={};walk=null;
  try{const r=await base.apply(this,a);if(r===false||(before&&player===before&&r!==true&&r!==undefined))ledger=prior;return r;}catch(e){ledger=prior;throw e;}};}
function set(p){if(p&&typeof p.on==='boolean')prefs.on=p.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}try{ensure();}catch(e){fail(e);}return {...prefs};}
window.__STORYWORLD_QUEST_R840__=Object.freeze({rev:REV,set,ensure,zones:()=>Object.keys(DEFS),def:z=>Object.prototype.hasOwnProperty.call(DEFS,z)?DEFS[z]:null,pure:Object.freeze({clean,along,npcSpot,propSpot}),
 inspect:()=>{const r=here(),p=npc(r),q=propOf(r),o=orbOf(r);return {rev:REV,prefs:{...prefs},zone:r?.id||null,applies:applies(r),visible:visible(r),phase:phaseOf(r),state:stOf(r),hits:q?q.r840Prop.hits:0,kills:killsOf(r),need:need(r),
  npc:p?{id:p.id,x:p.x,y:p.y}:null,prop:q?{id:q.id,x:q.x,y:q.y}:null,orb:o?{x:o.x,y:o.y}:null,pathed:r?.r840Spots?.pathed??null,ledger:JSON.parse(JSON.stringify(ledger)),stats:{...stats},events:[...events],lastError,browserVerified:false};}});
})();
