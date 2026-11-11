// R790 서사 핵심 NPC 상호작용 — 사용자 2026-11-11 "서사마다 중요엔피시를 넣어서 상호작용해서 진행하는방식 너무많이는말고 중요포인트만,
//  특히 불면귀쪽은 귀비탕을 얻어야 불면귀 퇴치가 가능하도록유도".
//  첫 묶음 = 불면귀(last303 한약과 불면귀). 정본 35장 "안개 속에서 앳된 남자가 한약 한 잔을 내밀었다. 냄새를 맡자 귀비탕 계열의 안신 처방이 떠올랐다 …
//  약을 마시자 흐트러지던 정신이 가라앉았다. 달려들던 주민들도 멈춰 섰다." + 교단 약방의 기록 영상 "귀비탕을 달여 마신 수련생 · 악몽저항 · 그 안쪽의 어두운 핵이 드러난다고 하지요".
//  · 들판의 주민을 멈춰 세우면(R78 phase 'door') 보스 구역 문 앞 안개 속에서 앳된 남자가 약사발을 들고 나타난다.
//  · 그에게 말을 걸어(문 앞에서 눌러도 그가 먼저 사발을 내민다) 귀비탕을 받아 마셔야 보스 문의 기억(R78 doorStory = 정본 35장 앞부분)이 시작되고 불면귀가 나온다.
//  · 귀비탕 없이는 불면귀의 핵이 드러나지 않는다: 어떤 길로든 귀비탕 전에 불면귀를 쓰러뜨리려 하면 체력이 남고 이유를 알린다(핵 봉인).
//  · 대사·서사 글은 새로 짓지 않는다(본편 재집필 중지). 창 글은 장면 묘사와 영상의 기록 한 줄뿐이고, 이어지는 서사는 기존 doorStory 그대로.
//  · 길잡이·영화 모드는 창 없이 바로 받아 마신다(창이 뜨면 자동 진행이 멈춘다 — R272 MODAL-LOOP 와 같은 까닭).
//  · 옛 세이브: 이미 보스 단계·완료면 마신 것으로 본다. 무한 생존·협동·EGO 재방문·사몽 층·다른 지역은 건드리지 않는다.
//  · 그림: 그림 스레드가 ElevenLabs(seedream-5.5)로 만든 CX-0072NP 손질본(assets/r790/npc, 384칸·발 (192,352)·키 286). 한 장이라 숨쉬기만 코드로 얹는다.
//    Dots idle6·offer6 시트가 오면 그것으로 바꾼다(지금 것은 최종 시트가 아님).
//  판정·피해·보스 체력·생성 지점·R760 그림은 그대로. 다른 서사의 NPC 는 DEFS 에 한 줄씩 더한다(배치표 docs/story-npc-r790.md).
//  · R791 둘째 묶음 = 고블린 두목과 장미 인장(last305, 정본 32장 "싸움이 끝난 뒤, 패배한 두목을 통해 … 그가 남긴 장미 인장을 칼 가까이 가져가자 공명이 일었다").
//    보스(고블린 추장)를 쓰러뜨리면 쓰러진 자리(기억 제단 곁)에 패배한 두목이 서고, 장미 인장을 받아야 뒷이야기(제단의 서사·출구 문의 기억 = 정본 32장 뒷부분)가 시작된다. 그림은 이미 있는 보스 그림 그대로.
//    헤드리스 실측: 출구 단계에서는 길잡이(R101 wardStep)가 출구 문보다 먼저 제단(room.objective)에서 뒷이야기를 읽는다 → 출구 문만 막으면 인장 없이 서사가 먼저 나온다. 그래서 제단과 출구 문을 함께 건다.
//  끄기: localStorage['storyworld.r790.npc']='{"on":false}'. 점검: window.__STORYWORLD_NPC_R790__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_NPC_R790__)return;
const REV='R791-story-npc-3',KEY='storyworld.r790.npc';
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object'&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={placed:0,offers:0,taken:0,auto:0,sealed:0,draws:0,errors:0};let lastError=null;const events=[];
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const T=()=>typeof time==='number'&&Number.isFinite(time)?time:0;
const note=(kind,d={})=>{events.push({kind,at:+T().toFixed(2),...d});if(events.length>40)events.shift();};
// 지역마다 핵심 인물 하나. flag = 세이브에 남는 낱말, phase = 나타나고 관문이 걸리는 R78 단계('door' 보스 문 앞 · 'exit' 보스를 쓰러뜨린 뒤 출구 문 앞).
//  sprite = 한 칸 그림(칸 크기·발 기준점·보이는 키·영웅 키 대비 배율), bust = 창에 넣을 그림(없으면 sprite), seal = 받기 전에는 보스가 쓰러지지 않게.
const DEFS=Object.freeze({last303:Object.freeze({kind:'youth',flag:'gwibitang',phase:'door',
 sprite:Object.freeze({path:'assets/r790/npc/youth.webp',w:384,h:384,px:192,py:352,vis:286,scale:1.06}),bust:'assets/r790/npc/youth-bust.webp',bustPos:'50% 18%',bustFit:'cover',name:'앳된 남자',label:'앳된 남자 · 한약 한 잔',sub:'안개 속 · 한약 한 잔',
 body:'김이 오르는 약사발을 두 손으로 내밀고 있다. 귀비탕 계열 안신 처방의 냄새가 난다.',lore:'교단 약방의 기록 — 귀비탕을 달여 마신 이에게는 악몽저항이 깃들고, 불면귀 안쪽의 어두운 핵이 드러난다.',
 take:'받아 마신다',wait:'아직',done:'귀비탕 · 악몽저항 — 흐트러지던 정신이 가라앉고, 불면귀의 핵이 드러날 수 있습니다.',toDoor:'보스 구역 문 앞에서 기억을 확인하세요.',
 hud:'안개 속 앳된 남자 · 한약 한 잔(귀비탕) 받기',seal:'핵이 드러나지 않습니다 · 귀비탕 없이는 불면귀를 쓰러뜨릴 수 없습니다.',
 boss:e=>String(e?.nativeId||'')==='l303-boss'||(!!e?.boss&&/^불면귀/.test(String(e?.name||'')))}),
 last305:Object.freeze({kind:'chief',flag:'roseSeal',phase:'exit',
 sprite:Object.freeze({path:'assets/r99/clean/assets/generated-v31224/actors-normalized/a43f2c5d3855_Monster_GoblinFluteKing.webp',w:672,h:384,px:300,py:361,vis:338,scale:1.45}),bust:'assets/r790/npc/chief-bust.webp',bustPos:'50% 50%',bustFit:'cover',labelBelow:true,
 name:'고블린 두목',label:'고블린 두목 · 장미 인장',sub:'패배한 두목 · 장미 인장',
 body:'싸움에서 진 두목이 장미 인장을 남긴다. 그는 환도가 무너진 성과 이어져 있음을 알고 있다.',lore:'장미 인장 — 칼 가까이 가져가면 공명이 일고, 무너진 성으로 가는 균열이 열린다.',
 take:'인장을 받는다',wait:'아직',done:'장미 인장 — 환도와 공명합니다.',toDoor:'출구 문 앞에서 기억을 확인하세요.',first:'패배한 두목에게서 장미 인장을 먼저 받으세요.',hud:'패배한 고블린 두목 · 장미 인장 받기',seal:null,boss:null})});
const ORDER=['route','rally','door','doorStory','boss','exit','exitStory','done'],REACH=2.4,DOOR_REACH=3.2,OBJ_REACH=2.7,FADE=1.6;
const after=(d,ph)=>ORDER.indexOf(ph)>ORDER.indexOf(d.phase),shown=(d,ph)=>ORDER.indexOf(ph)>=ORDER.indexOf(d.phase)&&ORDER.includes(ph);
let ledger={};
const keyOf=r=>r.layer+':'+r.id,defOf=r=>r&&typeof r.id==='string'&&Object.prototype.hasOwnProperty.call(DEFS,r.id)?DEFS[r.id]:null;
const R78=()=>window.__STORYWORLD_WORLD_COMBAT_R78__;
const here=()=>{try{return typeof room!=='undefined'?room:null;}catch(_){return null;}};
function clean(v){/* 순수: 깨진 값은 던지지 않고 버린다(이 기록이 없어도 단계로 다시 판단할 수 있다) */const out={};if(!v||typeof v!=='object'||v.version!==1||!v.rooms||typeof v.rooms!=='object'||Array.isArray(v.rooms))return out;
 for(const k of Object.keys(v.rooms).slice(0,64)){const m=/^STORY:([\w-]+)$/.exec(k);if(!m||!Object.prototype.hasOwnProperty.call(DEFS,m[1]))continue;const d=DEFS[m[1]],s=v.rooms[k];if(s&&typeof s==='object'&&s[d.flag]===true)out[k]={[d.flag]:true};}return out;}
function applies(r){try{if(!prefs.on||!r||r.layer!=='STORY'||r.egoVisitId151||!defOf(r))return false;if(window.__STORYWORLD_SURVIVAL_R600__?.active?.())return false;return !!R78()?.controlled?.(r);}catch(e){fail(e);return false;}}
function phaseOf(r){try{return R78()?.state?.(r)?.phase||null;}catch(e){fail(e);return null;}}
function taken(r=here()){const d=defOf(r);if(!d)return false;if(ledger[keyOf(r)]?.[d.flag]===true)return true;if(after(d,phaseOf(r)))return true;try{return typeof completed==='function'&&completed(r.id,'STORY')===true;}catch(_){return false;}}
const gate=(r=here())=>applies(r)&&phaseOf(r)===defOf(r).phase&&!taken(r);
// 관문이 걸리는 문: 문 단계 인물은 보스 구역 문, 출구 단계 인물은 출구 문(door-2).
const gateDoor=r=>{const d=defOf(r),id=d?.phase==='exit'?'door-2':r?.exploration?.bossDoorId;return r?.exploration?.worldR74?.doors?.find(x=>x.id===id)||null;};
const npc=(r=here())=>r?.props?.find(p=>p&&p.r790NPC)||null;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
// 순수: 한 점(제단) 둘레 1.9칸에서 빈 자리. 오른쪽 아래부터 돌며 찾는다.
function around(c,isBlocked,avoid=[]){if(!c||!Number.isFinite(c.x+c.y))return null;for(const rad of [1.9,2.2,1.6])for(let i=0;i<12;i++){const a=.35+i*Math.PI/6,q={x:c.x+Math.cos(a)*rad,y:c.y+Math.sin(a)*rad};
  if(isBlocked(q.x,q.y,.34))continue;if(avoid.some(v=>Math.hypot(v.x-q.x,v.y-q.y)<1.5))continue;return q;}return null;}
// 순수: 문에서 영웅이 다가오는 쪽으로 2.3칸, 옆으로 1.9칸(통로 가운데 줄은 비움). 막혔으면 가까운 빈 자리, 끝내 없으면 null.
//  inward=false 보스 문(영웅은 보스 구역 바깥에서 옴) · true 출구 문(영웅은 보스 구역 안에서 옴).
function spot(door,bounds,isBlocked,avoid=[],inward=false){if(!door||!Number.isFinite(door.x+door.y))return null;const b=Array.isArray(bounds)&&bounds.length===4?bounds:[door.x-1,door.y-1,door.x+1,door.y-1],cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2;
 const ny=door.axis==='y',sg=inward?-1:1,n=ny?{x:0,y:(door.y>=cy?1:-1)*sg}:{x:(door.x>=cx?1:-1)*sg,y:0},t={x:n.y?1:0,y:n.x?1:0};
 for(const out of [2.3,2.7,1.9,2.9])for(const side of [1.9,-1.9,1.6,-1.6,1.3,-1.3]){const q={x:door.x+n.x*out+t.x*side,y:door.y+n.y*out+t.y*side};
  if(Math.hypot(q.x-door.x,q.y-door.y)>=DOOR_REACH-.05)continue;if(isBlocked(q.x,q.y,.34))continue;if(avoid.some(a=>Math.hypot(a.x-q.x,a.y-q.y)<1.5))continue;return q;}return null;}
function ensure(r=here()){if(!r||!Array.isArray(r.props))return null;const d=defOf(r),want=!!d&&applies(r)&&shown(d,phaseOf(r)),cur=npc(r);
 if(!want){if(cur)r.props=r.props.filter(p=>!p.r790NPC);return null;}if(cur)return cur;const door=gateDoor(r);if(!door)return null;
 const isB=(x,y,rad)=>blocked(x,y,rad,r),solids=r.props.filter(p=>p&&p.solid!==false&&Number.isFinite(p.x+p.y));
 // 문 단계 인물은 보스 문 옆, 출구 단계 인물(쓰러뜨린 보스)은 쓰러진 자리 = 기억 제단 곁.
 const q=d.phase==='exit'?around(r.objective,isB,solids):spot(door,r.exploration?.worldWardR81?.bossBounds,isB,solids);if(!q)return null;
 // 문 단계에 막 들어와 나타날 때만 안개 속에서 서서히(이미 지난 단계의 세이브는 바로 또렷하게)
 const p={id:'r790:npc:'+r.id+':'+d.kind,x:q.x,y:q.y,home:{...q},r790NPC:d.kind,solid:false,visible:true,autoTargetEligible6:false,appearAt:phaseOf(r)===d.phase&&!taken(r)?T():-99,side:Math.sign(q.x-(d.phase==='exit'?r.objective.x:door.x))||1};
 r.props.push(p);stats.placed++;note('placed',{zone:r.id,x:+q.x.toFixed(2),y:+q.y.toFixed(2)});return p;}
const target=(p,d)=>({id:p.id,kind:'npc',label:d.label,point:{x:p.x,y:p.y},reach:REACH});
function canUse(t,pl){const r=here(),p=npc(r);pl=pl||player;return !!p&&t?.id===p.id&&gate(r)&&!loading&&pl?.hp>0&&dist(pl,p)<=REACH;}
const autoRun=()=>{try{return typeof guide!=='undefined'&&!!guide;}catch(_){return false;}};
function take(r,args){const d=defOf(r);(ledger[keyOf(r)]??={})[d.flag]=true;stats.taken++;note('taken',{zone:r.id,flag:d.flag});try{if(modal)closePanel(true);}catch(e){fail(e);}
 try{saveGame(false);}catch(e){fail(e);}const door=gateDoor(r),near=(!!door&&dist(player,door)<DOOR_REACH)||(d.phase==='exit'&&!!r.objective&&dist(player,r.objective)<OBJ_REACH);try{toast(near?d.done:d.done+' '+d.toDoor,4.5);}catch(e){fail(e);}
 if(near)try{interact.apply(null,args||[]);}catch(e){fail(e);}return true;}
function offer(r,args){const d=defOf(r);stats.offers++;if(autoRun()){stats.auto++;return take(r,args);}
 const esc=typeof escapeHTML==='function'?escapeHTML:s=>String(s);
 openPanel('<h2>'+esc(d.name)+'</h2><p>'+esc(d.sub)+'</p><div class="npcR790" style="display:flex;gap:16px;align-items:center;justify-content:flex-start;flex-wrap:wrap;margin:10px 0 14px">'
  +'<img src="./'+(d.bust||d.sprite.path)+'" alt="" width="148" height="148" style="width:148px;height:148px;object-fit:'+d.bustFit+';object-position:'+d.bustPos+';border-radius:10px;border:1px solid rgba(255,190,110,.35);background:#0d1018">'
  +'<div style="max-width:360px;text-align:left"><p style="margin:0 0 8px">'+esc(d.body)+'</p><p style="margin:0;opacity:.72;font-size:.92em">'+esc(d.lore)+'</p></div></div>'
  +'<div class="actions"><button id="npcTakeR790">'+esc(d.take)+'</button><button id="npcWaitR790">'+esc(d.wait)+'</button></div>');
 button('npcTakeR790',()=>{const now=here();if(now===r&&gate(r))take(r,args);else closePanel(true);});button('npcWaitR790',()=>closePanel(true));return true;}
function tryUse(args){const r=here();if(!gate(r))return false;const d=defOf(r),p=ensure(r),door=gateDoor(r),nearDoor=!!door&&dist(player,door)<DOOR_REACH;
 if((p&&dist(player,p)<=REACH)||(d.phase==='exit'?!!r.objective&&dist(player,r.objective)<OBJ_REACH:nearDoor)){offer(r,args);return true;}
 // 출구 단계: 인물은 제단 곁에 있다. 출구 문에서 누르면 먼저 받으라고 알린다(길잡이는 멈추지 않게 바로 받는다).
 if(nearDoor){if(autoRun()){stats.auto++;return take(r,args);}try{toast(d.first,3);}catch(e){fail(e);}stats.first=(stats.first||0)+1;return true;}return false;}
// ── 엔진에 얹기 ──
if(typeof interact==='function'){const base=interact;interact=function(...a){try{if(started&&!modal&&!loading&&player?.hp>0&&tryUse(a))return true;}catch(e){fail(e);}return base.apply(this,a);};}
if(typeof tick==='function'){const base=tick;let seen=null,seenPhase=null;tick=function(...a){const r0=base.apply(this,a);try{const r=here();if(r&&defOf(r)){const ph=phaseOf(r);if(r!==seen||ph!==seenPhase||(shown(defOf(r),ph)&&!npc(r))){seen=r;seenPhase=ph;ensure(r);}}}catch(e){fail(e);}return r0;};}
if(typeof killEnemy==='function'){const base=killEnemy;let toldAt=-99;killEnemy=function(e,...a){try{const r=here(),d=defOf(r);if(d&&d.seal&&e&&d.boss(e)&&applies(r)&&!taken(r)){e.hp=Math.max(1,(Number(e.maxHp)||1)*.1);stats.sealed++;
   if(T()-toldAt>=4){toldAt=T();note('sealed',{zone:r.id});try{toast(d.seal,3.5);}catch(_){}}return false;}}catch(err){fail(err);}return base.apply(this,[e,...a]);};}
if(typeof updateHUD==='function'){const base=updateHUD;updateHUD=function(...a){const r0=base.apply(this,a);try{const r=here();if(started&&gate(r)){const el=$('questText');if(el)el.textContent=defOf(r).hud;}}catch(e){fail(e);}return r0;};}
function img(p){try{const r=typeof readyImage==='function'?readyImage(p):null;if(r&&r.ready!==false&&r.image)return r.image;}catch(_){}try{if(typeof addImage==='function')addImage(p,'R790 서사 NPC');}catch(_){}return null;}
function draw(p){const SPRITE=DEFS[String(p.id).split(':')[2]]?.sprite;if(!SPRITE||!img(SPRITE.path))return false;const t=T(),q=project(p.x,p.y),a=Math.max(.12,Math.min(1,(t-(Number(p.appearAt)||-99))/FADE));
 const fr={path:SPRITE.path,assetFrame:{sourceRect:[0,0,SPRITE.w,SPRITE.h],pivot:[SPRITE.px,SPRITE.py],visibleHeight:SPRITE.vis},sourceAlphaCore:[0,0,SPRITE.w,SPRITE.h],metricThreshold:16,sourcePixelsEdited:false};
 const h=actorHeight()*SPRITE.scale*(1+.008*Math.sin(t*1.7)),paint=()=>drawAssetFrame3(SPRITE.path,fr,q.x,q.y,h,{angle:0,alpha:a,flip:p.side>0});stats.draws++;
 const res=ctx?.scope?ctx.scope({id:'prop:'+p.id,kind:'prop',x:p.x,y:p.y,bodyPath:SPRITE.path,alive:true},paint):paint();
 // 관문이 걸려 있는 동안만 머리 위 이름(보스 이름표와 같은 글씨) — 어두운 통로에서 누구에게 가야 하는지 보이게.
 try{if(a>.6&&typeof ctx?.fillText==='function'&&gate(here())){ctx.save?.();ctx.font='11px "Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.fillStyle='#f1cf9a';ctx.shadowColor='#000';ctx.shadowBlur=4;ctx.fillText(DEFS[here().id].name,q.x,DEFS[here().id].labelBelow?q.y+16:q.y-h-8);ctx.shadowBlur=0;ctx.restore?.();stats.labels=(stats.labels||0)+1;}}catch(e){fail(e);}
 return res;}
if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){if(!p||!p.r790NPC)return base.apply(this,[p,...a]);try{return draw(p);}catch(e){fail(e);}};}
(function world(){const w=window.__STORYWORLD_WORLD_R74__;if(!w||typeof w.interactions!=='function')return;const mine=t=>{const p=npc();return !!p&&t?.id===p.id;};
 window.__STORYWORLD_WORLD_R74__=Object.freeze({...w,interactions(){const rows=w.interactions();try{const r=here(),p=gate(r)?npc(r):null;if(p)return rows.concat(target(p,defOf(r)));}catch(e){fail(e);}return rows;},
  canUse(t,pl,...a){return mine(t)?canUse(t,pl):w.canUse(t,pl,...a);},use(t,...a){if(!mine(t))return w.use(t,...a);try{if(!canUse(t))return false;offer(here(),[]);return true;}catch(e){fail(e);return false;}}});})();
if(typeof serializeSave==='function'){const base=serializeSave;serializeSave=function(...a){const raw=base.apply(this,a);try{if(raw&&typeof raw==='object')raw.npcR790={version:1,rooms:JSON.parse(JSON.stringify(ledger))};}catch(e){fail(e);}return raw;};}
if(typeof restoreSave==='function'){const base=restoreSave;restoreSave=async function(raw,...a){const prior=ledger;let next={};try{next=clean(raw?.npcR790);}catch(e){fail(e);}ledger=next;
  try{const r=await base.call(this,raw,...a);if(r===false)ledger=prior;else try{ensure();}catch(e){fail(e);}return r;}catch(e){ledger=prior;throw e;}};}
if(typeof newGame==='function'){const base=newGame;newGame=async function(...a){const prior=ledger,before=typeof player!=='undefined'?player:null;ledger={};
  try{const r=await base.apply(this,a);if(r===false||(before&&player===before&&r!==true))ledger=prior;return r;}catch(e){ledger=prior;throw e;}};}
try{img(DEFS.last303.sprite.path);}catch(_){}
window.__STORYWORLD_NPC_R790__=Object.freeze({rev:REV,taken,ensure,pure:Object.freeze({spot,around,clean}),zones:()=>Object.keys(DEFS),
 inspect:()=>{const r=here(),p=npc(r);return {rev:REV,prefs:{...prefs},zone:r?.id||null,applies:applies(r),phase:phaseOf(r),taken:taken(r),gate:gate(r),npc:p?{id:p.id,x:p.x,y:p.y}:null,ledger:JSON.parse(JSON.stringify(ledger)),stats:{...stats},events:[...events],lastError,browserVerified:false};}});
})();
