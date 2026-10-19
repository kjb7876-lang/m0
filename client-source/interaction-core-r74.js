/* Shared world/screen math. Never owns progress, resources, or multiplayer authority. */
(()=>{'use strict';
 const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<=192&&Math.abs(p.y)<=192;
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 function targets(objective,portals=[],extra=[]){
  const rows=[];
  for(const p of portals)if(p.visible&&finite(p.point))rows.push({id:'portal:'+p.direction,kind:'portal',point:p.point,reach:2.05,label:p.open?(p.role==='previous'?'이전 시작점':'다음 기억'):'잠긴 문',data:p});
  for(const t of extra.slice(0,64))if(t&&finite(t.point)&&['door','npc','object'].includes(t.kind))rows.push({...t,reach:Math.max(.7,Math.min(2.6,Number(t.reach)||1.7))});
  if(finite(objective))rows.push({id:'objective',kind:'objective',point:objective,reach:2.6,label:'기억·제단'});
  return rows;
 }
 function nearest(rows,p,clear){
  if(!finite(p))return null;
  const admitted=rows.filter(t=>distance(p,t.point)<=t.reach&&clear(p,t));
  return admitted.filter(t=>t.kind==='portal').sort((a,b)=>distance(p,a.point)-distance(p,b.point))[0]||admitted.sort((a,b)=>distance(p,a.point)-distance(p,b.point))[0]||null;
 }
 function approach(p,t,blocked,path,clear){
  if(!finite(p)||!finite(t?.point))return null;
  if(distance(p,t.point)<=t.reach&&clear(p,t))return{arrived:true,path:[]};
  const angle=Math.atan2(p.y-t.point.y,p.x-t.point.x),radius=Math.min(1.5,t.reach*.75);
  for(let i=0;i<12;i++){
   const offset=i===0?0:(i%2?1:-1)*Math.ceil(i/2)*Math.PI/6,a=angle+offset,q={x:t.point.x+Math.cos(a)*radius,y:t.point.y+Math.sin(a)*radius};
   if(blocked(q)||!clear(q,t))continue;
   const route=path(p,q);if(Array.isArray(route)&&route.length&&route.length<=2048&&route.every((v,n)=>finite(v)&&!blocked(v)&&clear(n?route[n-1]:p,{kind:'path',point:v})))return{arrived:false,path:route,goal:q};
  }
  return null;
 }
 function screenPoint(x,y,rect,width,height){return rect?.width>0&&rect?.height>0&&width>0&&height>0?{x:(x-rect.left)*width/rect.width,y:(y-rect.top)*height/rect.height}:null;}
 function hit(t,p,project,zoom=1){if(!p||!finite(t?.point))return false;const q=project(t.point.x,t.point.y),half=Math.max(22,26*zoom),height=Math.max(44,65*zoom);return Number.isFinite(q.x+q.y)&&Math.abs(p.x-q.x)<=half&&p.y>=q.y-height&&p.y<=q.y+16;}
 globalThis.StoryInteractionCoreR74=Object.freeze({finite,distance,targets,nearest,approach,screenPoint,hit});
})();
