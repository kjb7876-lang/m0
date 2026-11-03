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
const REV='R272-guide-1',stats={merge:0,door:0,interact:0,noPath:0,forward:0,travel:0,errors:0};let lastError=null,timer=0;
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
function forward(dt){if(!guide||modal||loading||!(player?.hp>0)||storyScene||nearestEnemy(40)||room?.engaged)return false;if(window.__STORYWORLD_EGO151__?.inspect?.()?.isVisit===true)return false;
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
function step(dt){if(forward(dt))return true;const ph=phase();if(!ph)return false;
 const act=decide(ph,{guide,modal,loading,hp:player?.hp,enemyNear:!!nearestEnemy(40),px:player.x,py:player.y,merge:L()?.merge});if(!act)return false;
 timer-=dt;if(timer>0)return true;timer=.5;
 if(act==='merge'){const m=L().merge,p=findPath(player,{x:m.x,y:m.y},room,.31);if(!p.length){stats.noPath++;return false;}route=p;command=null;stats.merge++;return true;}
 const g=doorGoal();if(!g){stats.noPath++;return false;}
 if(Math.hypot(player.x-g.door.x,player.y-g.door.y)<3){stats.interact++;interact();return true;}
 route=findPath(player,g,room,.31);command=null;stats.door++;return true;}
try{const base=guideStep;guideStep=function(dt){try{if(step(dt))return;}catch(e){fail(e);}return base.apply(this,arguments);};}catch(e){fail(e);}
window.__STORYWORLD_GUIDE_R272__=Object.freeze({revision:REV,decide,forwardRole,inspect:()=>({revision:REV,phase:phase(),stats:{...stats},lastError,browserVerified:false,GPUVerified:false})});
})();
