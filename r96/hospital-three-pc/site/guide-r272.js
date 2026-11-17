// R272 — 병원(ep1a08) 길잡이 멈춤 고침(사용자 2026-11-03 "777코드입력후 병원맵부터 렉및 맵구조개선 … 실플레이검증 이지모드로").
//  증거: 777 → 병원 이지 · 길잡이 실플레이에서 미로 1·2번 경로의 적을 다 잡으면(또는 40칸 안에 적이 없으면) 길잡이가
//   room.objective(보스방 피 제단 15,13)로만 길을 찾는다. 보스방 문(door-0)은 'route' 단계에서 잠겨 있어 길이 0칸 → 제자리(31.5,49.5)에 멈춤.
//   'route' 단계는 중앙 준비실(LAYOUT.merge) 반경에 들어가야 'rally'(집결)로 넘어가는데 그쪽으로 데려가는 길잡이가 없었다.
//  고침: 길잡이가 켜져 있고, 단계가 'route' 이며, 40칸 안에 싸울 적이 없을 때만 중앙 준비실로 길을 준다.
//   'door' 단계(집결 섬멸 뒤 '전투실 문 앞 E')에서도 같은 상황이면 보스방 문 앞까지 데려가 E(interact)를 누른다.
//  진행 규칙·문 잠금·적 배치·난이도는 그대로 둔다(길잡이 목표만 보탬).
//  (2) 777 로 병원부터 시작하면 앞 장(dist00 등)이 '미완료'로 남아 R75 길잡이가 다 깬 쉼터(dreamRest)에서 '앞선 서사 맵으로'(이전 포탈)를 목표로 삼아
//   이전 포탈 위에 멈춘다(실플레이: ep1a11 → dreamRest 15.2,18.4 에서 40분 넘게 제자리, 다음 포탈 ep1b01 은 열려 있음).
//   777 이 켜져 있고, 지금 지역을 깼고, 미완료 첫 지역이 캠페인 순서상 뒤쪽이 아니며, '다음' 포탈이 열려 있을 때만 다음 포탈로 데려간다
//   (포탈 위에서는 원래 travel → 777 난이도 창 그대로). 다음 포탈이 닫힌 R81 문 너머면(last301: 다음 포탈 5,3.5 앞 door-2) 그 문을 열러 간다.
(()=>{'use strict';
if(window.__STORYWORLD_GUIDE_R272__)return;
const REV='R272-guide-4+R702',stats={merge:0,door:0,interact:0,noPath:0,forward:0,travel:0,errors:0};let lastError=null,timer=0;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const P=()=>window.__STORYWORLD_HOSPITAL_MAZE_PROGRESSION__,L=()=>window.__STORYWORLD_HOSPITAL_MAZE_LAYOUT__;
function phase(){try{if(typeof room==='undefined'||room?.id!=='ep1a08'||room.layer!=='STORY'||room.egoVisitId151)return null;return P()?.inspect?.()?.state?.phase||null;}catch(e){fail(e);return null;}}
function doorGoal(){const d=room?.exploration?.hospitalDoorsB3?.find(v=>v.id==='door-0');if(!d)return null;let best=null,bd=Infinity;
 for(const r of [1.3,1.8,2.4])for(let k=0;k<16;k++){const a=k/16*Math.PI*2,x=d.x+Math.cos(a)*r,y=d.y+Math.sin(a)*r;if(blocked(x,y,.3,room))continue;const dd=Math.hypot(x-player.x,y-player.y);if(dd<bd&&(dd<1||findPath(player,{x,y},room,.31).length)){best={x,y,door:d};bd=dd;}}
 return best;}
// 순수 판단(QA 가 CPU 에서 부른다): 이번 길잡이 차례에 무엇을 할지.
function decide(ph,ctx){if(!ctx.guide||ctx.modal||ctx.loading||!(ctx.hp>0)||ctx.enemyNear)return null;
 if(ph==='route'&&ctx.merge&&Math.hypot(ctx.px-ctx.merge.x,ctx.py-ctx.merge.y)>ctx.merge.radius*.6)return'merge';
 if(ph==='door')return'door';return null;}
function forwardRole(o){/* 순수: 777 앞질러 가기에서 이전 대신 다음으로 갈지 */return !!(o.cheat&&o.completed&&o.pendingIdx>=0&&o.zoneIdx>=0&&o.pendingIdx<o.zoneIdx&&o.nextOpen);}
let fTimer=0;
function forward(dt){/* R280: 깬 맵에 남은 먼 무리 몹(kair02 26칸) 때문에 이전 포탈에 멈췄다 → 8칸 안 적만 먼저 상대 */if(!guide||modal||loading||!(player?.hp>0)||storyScene||nearestEnemy(8)||room?.engaged)return false;if(window.__STORYWORLD_EGO151__?.inspect?.()?.isVisit===true)return false;
 const api=window.__STORYWORLD_ROUTES_R72__,order=window.__STORYWORLD_STORY_PROFILE_R54__?.campaignOrder;if(!api||!order)return false;
 const d=api.visibleDirections().find(v=>api.status(v).role==='next'),st=d&&api.status(d),pend=firstPending();
 if(!forwardRole({cheat:window.__STORYWORLD_CHEAT777__?.active?.()===true,completed:completed(zone),pendingIdx:pend?order.indexOf(pend.id):-1,zoneIdx:order.indexOf(zone),nextOpen:!!st?.open&&!!st.point}))return false;
 fTimer-=dt;if(fTimer>0)return true;fTimer=.5;
 if(Math.hypot(player.x-st.point.x,player.y-st.point.y)<=.75){stats.travel++;travel(d);return true;}
 const p=findPath(player,st.point,room,.31);if(!p.length){stats.noPath++;return doorToward(st.point);}route=p;command=null;stats.forward++;return true;}
// 다음 포탈이 닫힌 R81 문 너머(last301 실플레이: 다음 포탈 5,3.5 길 0칸 → R75 가 이전 포탈로 되돌아감)면 가장 가까운 닫힌 문을 열거나 그 문턱으로 걸어간다(polish-r101 guideDoorStep 과 같은 방식, 앞방 문 제외).
function doorToward(goal){try{const W=window.__STORYWORLD_WORLD_R74__,ds=room?.exploration?.worldR74?.doors||[];if(!W?.isOpen)return false;
 const shut=ds.filter(d=>d.id!=='door-1'&&!W.isOpen(room,d)).sort((a,b)=>Math.hypot(a.x-goal.x,a.y-goal.y)-Math.hypot(b.x-goal.x,b.y-goal.y));
 for(const d of shut.slice(0,2)){const t={id:d.id,kind:'door'};try{if(W.canUse(t)&&W.use(t)){stats.doors=(stats.doors||0)+1;route=[];return true;}}catch(_){}
  let best=null;for(const sg of [-1,1]){const q={x:d.axis==='x'?d.x+sg*.9:d.x,y:d.axis==='y'?d.y+sg*.9:d.y};if(blocked(q.x,q.y,.29,room))continue;const pp=findPath(player,q,room,.29);if(pp.length&&(!best||pp.length<best.length))best=pp;}
  if(best){route=best;command=null;stats.doorWalk=(stats.doorWalk||0)+1;return true;}}
 return false;}catch(e){fail(e);return false;}}
// (3) R75 목표(제단·시작 표식)가 닫힌 R81 문 너머일 때(실플레이 hando02: '성문 수비 시작' 15,13 앞 중심 전투실 문 door-2 20,20 —
//  polish-r101 이 목표에서 먼 서쪽 성문(17,105)으로 걸어가 y 70↔100 을 25분 왕복) 목표에 가장 가까운 닫힌 문을 열러 간다.
let oTimer=0,oHold=false,oKey='',oAt=-9,oTime=0;
function objectiveDoor(dt){if(!guide||modal||loading||!(player?.hp>0)||storyScene||nearestEnemy(40)||room?.engaged)return false;if(phase())return false;
 /* R285: R78 경로·집결 단계의 보스방 문은 봉인(집결 적을 다 잡아야 열림) — 문 앞에서 E 를 되풀이하며 멈추지 않는다(dist04 20,20.9 에서 363번) */if(['route','rally'].includes(window.__STORYWORLD_WORLD_COMBAT_R78__?.state?.(room)?.phase))return false;
 const g=window.__STORYWORLD_GUIDE_R75__?.currentGoal?.();if(!g||!['objective','interaction'].includes(g.kind)||!g.point||!Number.isFinite(g.point.x+g.point.y))return false;
 oTimer-=dt;if(oTimer>0)return oHold;oTimer=.6;
 /* R702 렉: 목표·문 상태가 지난번과 같으면 3초(문으로 걷는 중이면 8초)에 한 번만 다시 묻는다 — 닫힌 문 너머 목표로 가는 실패 길찾기(지도 전체를 뒤짐)가 0.6초마다 프레임을 끊었다(헤드리스 한 번 400ms).
    문이 열리거나 목표가 바뀌면 열쇠가 달라져 바로 다시 묻는다. 그 사이엔 지난 판단(문으로 걷기)을 그대로 둔다. */
 const key=objKey(g.point);oTime+=.6;if(key===oKey&&oTime-oAt<(oHold?8:3)&&!(oHold&&!(route?.length>0))){/* 문 앞에 닿아 길이 끝났으면 바로 다시(문 열기) */stats.objectiveKeep=(stats.objectiveKeep||0)+1;return oHold;}oKey=key;oAt=oTime;
 oHold=false;if(findPath(player,g.point,room,.31).length)return false;
 const ok=doorToward(g.point);if(ok)stats.objectiveDoor=(stats.objectiveDoor||0)+1;oHold=ok;return ok;}
function objKey(pt){let k=(room?.id||'')+'|'+pt.x+','+pt.y;try{const W=window.__STORYWORLD_WORLD_R74__;for(const d of room?.exploration?.worldR74?.doors||[])k+='|'+d.id+':'+(W?.isOpen?.(room,d)?1:0);}catch(_){}return k;}
// (5) R285: R81 '두 갈래 길' 맵(dist00~05 등 R78 이 다루는 지역) — 경로(route) 단계에서는 중앙 전투실(worldWardR81.gatherAnchor) 반경 5.5 에 들어가야
//   집결(rally)이 시작되는데, R75 길잡이는 잠긴 보스방 너머 제단(objective)을 목표로 잡아 보스방 문 앞에서 멈췄다
//   (밸런스 실플레이 dist04 Lv5: 문 앞 20.5,20.5 에서 12분, 남은 적 없이 단계가 route 그대로). 병원(ep1a08)은 (1)이 따로 맡는다.
//   길잡이가 켜져 있고 R78 단계가 route 이고 R75 목표가 적이 아니라 objective 일 때만 중앙 전투실로 길을 준다(적이 목표면 원래 길잡이가 싸운다).
function wardRole(o){/* 순수 */return !!(o.guide&&!o.modal&&!o.loading&&o.hp>0&&o.phase==='route'&&o.goal==='objective'&&o.anchor&&Math.hypot(o.px-o.anchor.x,o.py-o.anchor.y)>4.5);}
let wTimer=0,wPlan=null,wTime=0;
function wardRoute(dt){try{if(typeof room==='undefined'||!room||room.id==='ep1a08'||storyScene)return false;const C=window.__STORYWORLD_WORLD_COMBAT_R78__,st=C?.state?.(room),g=room.exploration?.worldWardR81;
 const goal=window.__STORYWORLD_GUIDE_R75__?.currentGoal?.()?.kind;
 if(!wardRole({guide,modal,loading,hp:player?.hp,phase:st?.phase,goal,anchor:g?.gatherAnchor,px:player.x,py:player.y}))return false;
 wTimer-=dt;if(wTimer>0)return true;wTimer=.5;const a=g.gatherAnchor;
 /* R702 렉: 같은 목표로 가는 내 길을 따라가는 중이면(길이 남고·다음 길목에 가까워지는 중·3초 안) 다시 찾지 않는다 — 큰 지도에서 0.5초마다 전체 길찾기가 프레임을 끊었다.
    길목(길의 꺾이는 점)은 멀리 있을 수 있으니 거리 자체가 아니라 '지난번보다 1칸 넘게 멀어졌나'(밀림·순간이동)로 본다. */
 if(wPlan&&route===wPlan.route&&route.length>0&&wPlan.x===a.x&&wPlan.y===a.y&&wTime-wPlan.at<3){const d=Math.hypot(route[0].x-player.x,route[0].y-player.y);if(route.length!==wPlan.n){wPlan.n=route.length;wPlan.d=Math.hypot(route[0].x-wPlan.p0.x,route[0].y-wPlan.p0.y);}/* 길목을 지났으면 기준 = 지난 길목→다음 길목 거리 */
  if(d<=wPlan.d+1){wPlan.d=Math.min(wPlan.d,d);wPlan.p0={x:route[0].x,y:route[0].y};wTime+=.5;stats.wardKeep=(stats.wardKeep||0)+1;return true;}}
 const p=findPath(player,{x:a.x,y:a.y},room,.31);if(!p.length){stats.noPath++;wPlan=null;return false;}route=p;command=null;wPlan={route:p,x:a.x,y:a.y,at:wTime,n:p.length,d:Math.hypot(p[0].x-player.x,p[0].y-player.y),p0:{x:p[0].x,y:p[0].y}};wTime+=.5;stats.ward=(stats.ward||0)+1;return true;}catch(e){fail(e);return false;}}
function step(dt){if(forward(dt))return true;if(wardRoute(dt))return true;if(objectiveDoor(dt))return true;const ph=phase();if(!ph)return false;
 const act=decide(ph,{guide,modal,loading,hp:player?.hp,enemyNear:!!nearestEnemy(40),px:player.x,py:player.y,merge:L()?.merge});if(!act)return false;
 timer-=dt;if(timer>0)return true;timer=.5;
 if(act==='merge'){const m=L().merge,p=findPath(player,{x:m.x,y:m.y},room,.31);if(!p.length){stats.noPath++;return false;}route=p;command=null;stats.merge++;return true;}
 const g=doorGoal();if(!g){stats.noPath++;return false;}
 if(Math.hypot(player.x-g.door.x,player.y-g.door.y)<3){stats.interact++;interact();return true;}
 route=findPath(player,g,room,.31);command=null;stats.door++;return true;}
try{const base=guideStep;guideStep=function(dt){try{if(step(dt))return;}catch(e){fail(e);}return base.apply(this,arguments);};}catch(e){fail(e);}
// (3) last303 실플레이(1/4 확률): 길잡이·상자 줍기(R261)·R101 이 interact() 를 누를 때 목표 2.5칸 밖이면 R75 가 가장 가까운 동료/주민을 먼저 쓴다.
//   주민(villager)은 '목표 안내' 정보 창만 여는데, 길잡이가 그 옆에서 E 를 되풀이해 '주민 · 보호 대상' 창이 수십 번 다시 열렸다(MODAL-LOOP).
//   길잡이가 켜져 있을 때만, 버튼이 '돌아가기' 하나뿐인 R75 정보 창(narrativeNPCBackR75)은 창 대신 토스트로 한 번만 알리고 열지 않는다.
//   손으로 E 를 누르는 플레이(길잡이 끔)·성문 권한·다른 창은 그대로.
const npcSeen=new Set();
function npcInfoOnly(h){/* 순수 */h=String(h||'');return h.includes('narrativeNPCBackR75')&&(h.match(/<button/g)||[]).length===1;}
if(typeof openPanel==='function')try{const op=openPanel;openPanel=function(h,...a){try{if(typeof guide!=='undefined'&&guide&&npcInfoOnly(h)){const t=String(h).match(/<h2>([^<]*)<\/h2>/)?.[1]||'';const k=(typeof zone!=='undefined'?zone:'')+'|'+t;
 stats.npcPanel=(stats.npcPanel||0)+1;if(!npcSeen.has(k)){npcSeen.add(k);try{toast(t.replace(/&[^;]+;/g,' ')+' · 길잡이 진행 중');}catch(_){}}return;}}catch(e){fail(e);}return op.apply(this,[h,...a]);};}catch(e){fail(e);}
window.__STORYWORLD_GUIDE_R272__=Object.freeze({revision:REV,decide,forwardRole,npcInfoOnly,wardRole,inspect:()=>({revision:REV,phase:phase(),stats:{...stats},lastError,browserVerified:false,GPUVerified:false})});
})();
