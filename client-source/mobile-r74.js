/* R74-MOBILE-WORLD: one interaction path for keyboard, touch, and current authority. */
(()=>{'use strict';
 const C=StoryInteractionCoreR74,coarse=()=>matchMedia('(pointer:coarse)').matches;
 const live=()=>started&&!loading&&!modal&&room&&player?.hp>0;
 let pending=null,press=null,elapsed=0,lastLabel='',gestureEpoch=0;const events=[];
 const note=(kind,data={})=>{events.push({kind,zone,layer,at:time,...data});if(events.length>64)events.shift();};
 function rows(){const api=window.__STORYWORLD_ROUTES_R72__,portals=api?.visibleDirections().map(direction=>({direction,...api.status(direction)}))||[];return C.targets(room?.objective,portals,window.__STORYWORLD_WORLD_R74__?.interactions?.()||[]);}
 function clear(p,t){return t.kind==='door'?window.__STORYWORLD_WORLD_R74__?.canUse?.(t,p)===true:clearPath3(p,t.point,.2,room);}
 function nearby(){return live()?C.nearest(rows(),player,clear):null;}
 function cancel(reason){gestureEpoch++;if(pending)note('cancel',{reason,id:pending.id});pending=null;press=null;}
 function use(t){
  if(!live()||!t||C.distance(player,t.point)>t.reach||!clear(player,t))return false;
  pending=null;route=[];command=null;guide=false;window.__STORYWORLD_MOBILE_R63__?.clearGesture();
  note('use',{id:t.id,kind:t.kind});
  if(['door','npc','object'].includes(t.kind))return window.__STORYWORLD_WORLD_R74__?.use?.(t)??false;
  return interact();
 }
 function select(t){
  if(!live())return false;
  const plan=C.approach(player,t,q=>blocked(q.x,q.y,.31,room),(p,q)=>findPath(p,q,room,.31),clear);
  if(!plan){toast('벽과 닫힌 문을 피해 입구로 접근하세요.',2);note('blocked',{id:t.id});return false;}
  if(plan.arrived)return use(t);
  pending={id:t.id,room,layer,age:0};route=plan.path;command=null;guide=false;note('approach',{id:t.id,points:route.length});return true;
 }
 // The original UI captured an early interact function. Resolve the complete,
 // current lifecycle/guest-authority chain when the player actually taps.
 button('touchUse',()=>{const t=nearby();return t?use(t):interact();});
 const badge=document.createElement('div');badge.id='mobileMapR74';badge.setAttribute('role','status');badge.setAttribute('aria-live','polite');$('stage').appendChild(badge);
 const style=document.createElement('style');style.textContent='#mobileMapR74{display:none;pointer-events:none}@media(pointer:coarse){body.mobile-live-r63 #mobileMapR74{display:block;position:absolute;left:max(8px,env(safe-area-inset-left));top:max(8px,env(safe-area-inset-top));max-width:calc(100% - 72px);padding:5px 8px;border:1px solid #8ba1a0;border-radius:5px;background:#09151fe8;color:#edf1df;font:600 11px/1.35 sans-serif;z-index:16;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}body.mobile-boss-r63 #mobileMapR74{top:calc(env(safe-area-inset-top,0px) + 51px);max-width:calc(100% - 24px)}body.mobile-modal-r63 #mobileMapR74{display:none}body.mobile-live-r63 #touchUse{min-height:44px;min-width:68px;touch-action:manipulation}}';document.head.appendChild(style);
 const hudBase=updateHUD;updateHUD=function(...a){const result=hudBase.apply(this,a);if(coarse()&&started&&room){const label=regionById[zone].title+' · '+(layer==='DREAM'?'몽세':'서사')+' · '+(settings.flashlight58===false?'전체 시야':'주변 시야');if(label!==lastLabel){lastLabel=label;badge.textContent=label;badge.title=label;}const boss=$('bossbar');badge.style.top=document.body.classList.contains('mobile-boss-r63')&&boss?.getBoundingClientRect().height?Math.max(8,boss.getBoundingClientRect().bottom-$('stage').getBoundingClientRect().top+6)+'px':'';const t=nearby();document.body.classList.toggle('mobile-use-r63',!!t);$('touchUse').textContent=t?.label||'상호작용';}return result;};
 canvas.addEventListener('pointerdown',e=>{
  if(!coarse()||e.pointerType==='mouse'||!live())return;
  cancel('new-input');const p=C.screenPoint(e.clientX,e.clientY,canvas.getBoundingClientRect(),W,H);if(!p)return;
  if(liveEnemies().some(v=>{const q=project(v.x,v.y),h=actorHeight()*(v.boss?2.05:1);return Math.abs(p.x-q.x)<h*.48&&p.y>q.y-h&&p.y<q.y+9;}))return;
  const hits=rows().filter(t=>C.hit(t,p,project,zoom)).sort((a,b)=>C.distance(p,project(a.point.x,a.point.y))-C.distance(p,project(b.point.x,b.point.y)));
  if(hits.length){press={id:e.pointerId,x:e.clientX,y:e.clientY,target:hits[0]};e.preventDefault();e.stopPropagation();}
 },true);
 canvas.addEventListener('pointerup',e=>{const p=press;press=null;if(!p||p.id!==e.pointerId)return;if(Math.hypot(e.clientX-p.x,e.clientY-p.y)<14&&live()){e.preventDefault();e.stopImmediatePropagation();window.__STORYWORLD_MOBILE_R63__?.clearGesture();try{if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);}catch{}const epoch=++gestureEpoch;requestAnimationFrame(()=>{if(epoch===gestureEpoch&&live())select(p.target);});}},true);
 for(const name of ['pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>{press=null;});
 window.addEventListener('pointerdown',e=>{if(coarse()&&(!e.isPrimary||e.target!==canvas&&!e.target?.closest?.('#touchUse')))cancel('manual-control');},true);
 window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Escape'].includes(e.code))cancel('manual-key');},true);
 for(const name of ['blur','pagehide','orientationchange'])window.addEventListener(name,()=>cancel(name));
 const panelBase=openPanel;openPanel=function(...a){cancel('panel');return panelBase.apply(this,a);};
 const tickBase=tick;tick=function(dt,...a){const before=time,result=tickBase.call(this,dt,...a);if(pending){if(!live()||pending.room!==room||pending.layer!==layer)cancel('lifecycle');else if(time>before){pending.age+=time-before;elapsed+=dt;if(pending.age>20)cancel('timeout');else if(elapsed>=.1){elapsed=0;const t=rows().find(t=>t.id===pending.id);if(!t)cancel('target-missing');else if(C.distance(player,t.point)<=t.reach&&clear(player,t))use(t);else if(!route.length)cancel('movement-ended');}}}return result;};
 for(const key of ['enterRegion','restoreSave','newGame']){const base=key==='enterRegion'?enterRegion:key==='restoreSave'?restoreSave:newGame,wrap=async function(...a){cancel(key);return base.apply(this,a);};if(key==='enterRegion')enterRegion=wrap;else if(key==='restoreSave')restoreSave=wrap;else newGame=wrap;}
 const deathBase=showDeath;showDeath=function(...a){cancel('death');return deathBase.apply(this,a);};
 window.__STORYWORLD_MOBILE_R74__=Object.freeze({revision:'R74-MOBILE-WORLD',targets:rows,nearby,select,cancel,inspect:()=>({pending:pending?{id:pending.id,age:pending.age}:null,events:[...events],mapLabel:badge.textContent})});
})();
