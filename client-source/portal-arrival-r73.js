/* Spawn into the playable route, away from the doorway just used. Choosing
 * an arbitrary east offset could send the first ordinary walk across the
 * previous portal and immediately return to the map the player just left. */
(()=>{'use strict';
 function point(portal,r=room){
  const goal=r?.objective;if(!portal||!goal)return null;
  const path=findPath(portal,goal,r,.31);let from=portal,left=2.5;
  for(const to of path){const length=Math.hypot(to.x-from.x,to.y-from.y);if(length>=left){const q={x:from.x+(to.x-from.x)*left/length,y:from.y+(to.y-from.y)*left/length};if(Math.hypot(q.x-portal.x,q.y-portal.y)>=1.9&&!blocked(q.x,q.y,.34,r))return q;break;}left-=length;from=to;}
  const candidates=[];for(let i=0;i<16;i++){const a=i*Math.PI/8,q={x:portal.x+Math.cos(a)*2.5,y:portal.y+Math.sin(a)*2.5};if(blocked(q.x,q.y,.34,r)||!clearPath3(portal,q,.31,r))continue;const tail=findPath(q,goal,r,.31);if(!tail.length)continue;let cost=0,p=q;for(const n of tail){cost+=Math.hypot(n.x-p.x,n.y-p.y);p=n;}candidates.push({q,cost});}
  candidates.sort((a,b)=>a.cost-b.cost);return candidates[0]?.q||null;
 }
 window.__STORYWORLD_PORTAL_ARRIVAL_R73__=Object.freeze({point});
})();
