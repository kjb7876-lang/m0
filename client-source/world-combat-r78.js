/* Story-authored enemy placement over the R78 maze rooms. Native enemy IDs,
 * health, damage, phases and rewards are never rewritten. */
(()=>{'use strict';
 const A=window.StoryPhase1,coreRadius=e=>Math.max(.2,Number(e?.combatProfile?.bodyBlock?.r)||Number(e?.radius)||.3),placed=new WeakSet();
 const metrics={rooms:0,ordinaryMoved:0,midbossMoved:0,bossMoved:0,unplaced:0};
 const mode=()=>window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off';
 const alive=e=>!!e&&e.hp>0&&!e.deadRecorded&&e.spawnState!=='dead';
 function pathTo(edges,start,goal){const adj=new Map();for(const[a,b]of edges){if(!adj.has(a))adj.set(a,[]);if(!adj.has(b))adj.set(b,[]);adj.get(a).push(b);adj.get(b).push(a);}const prev=new Map([[start,null]]),todo=[start];for(let i=0;i<todo.length;i++){const at=todo[i];if(at===goal)break;for(const n of adj.get(at)||[])if(!prev.has(n)){prev.set(n,at);todo.push(n);}}if(!prev.has(goal))return[];const out=[];for(let n=goal;n!==null;n=prev.get(n))out.push(n);return out.reverse();}
 function safe(r,e,p,used){const radius=coreRadius(e),blocked=A.explorationBlocked(r.exploration,p.x,p.y,radius+.08);return !blocked&&used.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>radius+(q.radius||.35)+.18);}
 function choose(r,e,center,index,used){const radius=coreRadius(e),candidates=[center];for(let ring=1;ring<=7;ring++)for(let step=0;step<12;step++){const angle=(index*2.39996+step*Math.PI/6),distance=ring*.48;candidates.push({x:center.x+Math.cos(angle)*distance,y:center.y+Math.sin(angle)*distance});}return candidates.find(p=>safe(r,e,p,used))||null;}
 function pointForNode(r,id){const n=r.exploration.nodes.find(q=>q.id===id);return n?{x:n.x,y:n.y}:null;}
 function setPosition(e,p){e.x=e.homeX=p.x;e.y=e.homeY=p.y;e.nav=[];e.navAt=typeof time==='number'?time-.6:0;e.stuck=0;e.attack=null;e.rangedWindup=0;e.aim=null;e.state='idle';e.cd=Math.max(.8,Number(e.cd)||0);}
 function placeRoom(r){if(!r||placed.has(r)||mode()!=='off'||r.layer!=='STORY'||!r.exploration?.worldR78)return r;placed.add(r);
  const spec=r.exploration.worldR78,route=pathTo(r.exploration.edges||[],r.exploration.entry?.node??11,spec.midbossRoomNodeId??5),mid=route.length>1?route[route.length-1]:spec.midbossRoomNodeId??5;
  spec.routeNodeIds=route;
  const majors=(r.enemies||[]).filter(e=>alive(e)&&(e.boss||e.midboss)&&!e.mazeEliteR2),midbosses=majors.filter(e=>e.midboss&&!e.boss),bosses=majors.filter(e=>e.boss);
  const used=[];
  midbosses.forEach((e,i)=>{const center=pointForNode(r,mid),p=center&&choose(r,e,center,i,used);if(!p){metrics.unplaced++;return;}setPosition(e,p);used.push({...p,radius:coreRadius(e)});metrics.midbossMoved++;});
  const bossPoints=[{x:15.5,y:12.5},{x:19.2,y:15.2},{x:12.4,y:17.3},{x:21.4,y:12.2},{x:18.2,y:19.1}];
  bosses.forEach((e,i)=>{const p=choose(r,e,bossPoints[i%bossPoints.length],i,used);if(!p){metrics.unplaced++;return;}setPosition(e,p);used.push({...p,radius:coreRadius(e)});metrics.bossMoved++;});
  const ordinary=(r.enemies||[]).filter(e=>alive(e)&&!e.boss&&!e.midboss&&!e.persona&&!e.trial&&!e.cosmic&&!e.r61Summoned&&!e.r61Clone&&Number.isInteger(e.r75Pack));
  const combat=(spec.combatRoomNodeIds||[]).filter(id=>id!==mid),nearBoss=route.length>2?route[route.length-2]:route[0],
   centers=[route[1]??route[0],route[Math.max(1,Math.floor((route.length-1)*.55))]??nearBoss,nearBoss].map(id=>pointForNode(r,id)).filter(Boolean);
  ordinary.forEach((e,i)=>{const pack=Math.max(0,Math.min(2,e.r75Pack)),base=centers[pack]||pointForNode(r,combat[i%Math.max(1,combat.length)]??route[0]);if(!base){metrics.unplaced++;return;}
   const group=ordinary.filter(q=>q.r75Pack===e.r75Pack),slot=group.indexOf(e),p=choose(r,e,base,slot,used);if(!p){metrics.unplaced++;return;}setPosition(e,p);used.push({...p,radius:coreRadius(e)});metrics.ordinaryMoved++;
  });
  metrics.rooms++;r.worldCombatR78={version:1,zoneId:r.id,routeNodeIds:[...route],bossRoomNodeId:spec.bossRoomNodeId,ordinaryMoved:ordinary.length,midbossCount:midbosses.length,bossCount:bosses.length};return r;
 }
 if(typeof makeRoom==='function'){const makeBase=makeRoom;makeRoom=function(...args){return placeRoom(makeBase.apply(this,args));};}
 if(typeof enterRegion==='function'){const enterBase=enterRegion;enterRegion=async function(...args){const result=await enterBase.apply(this,args);if(result!==false)placeRoom(room);return result;};}
 if(typeof restoreSave==='function'){const restoreBase=restoreSave;restoreSave=async function(...args){const result=await restoreBase.apply(this,args);if(result!==false){for(const r of new Set([...Object.values(world||{}),room]))placeRoom(r);}return result;};}
 for(const r of new Set([...Object.values(world||{}),room]))placeRoom(r);
 window.__STORYWORLD_WORLD_COMBAT_R78__=Object.freeze({placeRoom,inspect:()=>({version:1,metrics:{...metrics},scope:'solo story combat maps; source enemy combat data preserved',browser:false,GPU:false})});
})();
