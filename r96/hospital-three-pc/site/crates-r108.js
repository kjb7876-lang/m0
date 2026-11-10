/* R108 crates: box-like props (crates, barrels, cabinets, the crate-shaped record markers) hold
 * 1-7 passive points. Press E next to one, or swing / cast while standing next to it: the box
 * breaks (burst, gone) and drops a point orb with "+N" over it; walking over the orb collects the
 * points. Points go through the native R62 progression (awardPointDrop: one claim per id, saved
 * with the hero), so a box can never pay twice, also after reload (an unbroken or uncollected box
 * simply comes back with the room). The amount is fixed per box from its id. Native treasure
 * chests, doors, NPCs and the R64 point orbs are left alone.
 * R116: ported onto R115; 사몽 clue/statement/record/hide props (crate- or cabinet-shaped) are never crates.
 * Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_CRATES_R108__||typeof interact!=='function'||typeof drawProp!=='function'||typeof tick!=='function')return;
 const RANGE=1.7,ATTACK_RANGE=2.1,PICKUP=1.35,ORB_ART='assets/vfx/v31315/spirit-orb.webp',KIND=/crate|barrel|cabinet|box|coffer|trunk/i;
 const stats={broken:0,collected:0,points:0,refused:0,interactBreaks:0,attackBreaks:0};let lastError=null;const fail=e=>{lastError=String(e?.stack||e).slice(0,300);};
 const P=()=>window.__STORYWORLD_PROGRESSION_R62__;
 function eligible(p){if(!p||p.visible===false||p.destroyed||p.r108Orb||p.passivePointDropR64||p.terrainWall||p.r74Door||p.r75NPC||p.r75NarrativeNPC||p.r75FortPerson)return false;
  if(p.samongR103||p.chest||p.r103Chest||p.growthChestR103||p.r105Record||p.r115Clue!=null||p.r115Stmt!=null||p.r115Book||p.r115Hide)return false;// R116: 사몽 단서·진술·기록·숨는 장은 상자로 치지 않는다
  return KIND.test(String(p.r74Prop||''))||KIND.test(String(p.r105Prop||''))||KIND.test(String(p.kind||''))||/crate|barrel|box/i.test(String(p.path||'').split('/').pop());}
 function hashOf(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
 function idOf(p){const r=(typeof room!=='undefined'&&room)||{},raw=(r.id||'room')+':'+(r.layer||(typeof layer!=='undefined'?layer:''))+':'+(p.id||(Math.round(p.x*10)+'_'+Math.round(p.y*10)));return'r64:r108crate:'+raw.replace(/[^A-Za-z0-9._:-]/g,'_').slice(0,200);}
 function claimed(id){try{return !!P()?.state?.(player)?.pointDropClaimsR64?.[id];}catch(_){return false;}}
 const amountOf=p=>1+hashOf(idOf(p))%7;
 function boxes(){return(typeof room!=='undefined'&&room?.props||[]).filter(eligible);}
 // a box whose points were already collected is not put back when the room is rebuilt
 function prune(){if(typeof room==='undefined'||!room?.props||room.r108CratesPruned===room.props)return;const next=room.props.filter(p=>!(eligible(p)&&claimed(idOf(p))));if(next.length!==room.props.length)room.props=next;room.r108CratesPruned=room.props;}
 function near(range){if(!player)return null;let best=null,bd=range;for(const p of boxes()){const d=Math.hypot(p.x-player.x,p.y-player.y);if(d<=bd){bd=d;best=p;}}return best;}
 function breakBox(p,how){try{const id=idOf(p),amount=amountOf(p);
   room.props=room.props.filter(q=>q!==p);
   if(!claimed(id))room.props.push({id:'r108orb:'+id,x:p.x,y:p.y,path:ORB_ART,height:30,solid:false,visible:true,autoTargetEligible6:false,r108Orb:{id,amount,at:typeof time==='number'?time:0}});
   room.r108CratesPruned=room.props;stats.broken++;if(how==='attack')stats.attackBreaks++;else stats.interactBreaks++;
   try{if(typeof fx==='function'&&typeof VFX!=='undefined'&&VFX.burst)fx('burst',p.x,p.y,{asset:VFX.burst,size:1,life:.45});}catch(_){}
   try{if(typeof sound==='function')sound('attack');}catch(_){}
   return true;}catch(err){fail(err);return false;}}
 function collect(){if(typeof room==='undefined'||!room?.props||!player||!(player.hp>0))return;
  for(const o of room.props){if(!o?.r108Orb||(typeof time==="number"?time:0)-o.r108Orb.at<.55||Math.hypot(o.x-player.x,o.y-player.y)>PICKUP)continue;const{id,amount}=o.r108Orb;
   const ok=claimed(id)?false:!!P()?.awardPointDrop?.(amount,id,player);room.props=room.props.filter(q=>q!==o);room.r108CratesPruned=room.props;
   if(ok){stats.collected++;stats.points+=amount;try{toast('패시브 포인트 '+amount+'점을 획득했습니다.',2);}catch(_){}try{if(typeof sound==='function')sound('upgrade');}catch(_){}try{if(typeof updateHUD==='function')updateHUD();if(typeof saveGame==='function')saveGame(false);}catch(_){}}
   else stats.refused++;break;}}
 const live=()=>typeof started!=='undefined'&&started&&!modal&&!loading&&player?.hp>0;
 const interactBase=interact;
 interact=function(...args){try{if(live()){prune();const p=near(RANGE);if(p&&breakBox(p,'interact'))return;}}catch(err){fail(err);}return interactBase.apply(this,args);};
 for(const name of['basicAttack','special']){if(typeof window[name]!=='function')continue;const base=window[name];
  window[name]=function(...args){const r=base.apply(this,args);try{if(live()){prune();const p=near(ATTACK_RANGE);if(p)breakBox(p,'attack');}}catch(err){fail(err);}return r;};}
 const tickBase=tick;tick=function(...args){const r=tickBase.apply(this,args);try{prune();if(live())collect();}catch(err){fail(err);}return r;};
 const drawBase=drawProp;
 drawProp=function(p,...rest){const result=drawBase.call(this,p,...rest);
  try{if(!p)return result;const q=project(p.x,p.y),t=typeof time==='number'?time:0,z=typeof zoom==='number'?zoom:1;
   if(p.r108Orb){const u=Math.min(1,(t-p.r108Orb.at)/.35);ctx.save();try{ctx.globalAlpha=u;ctx.font='bold '+Math.max(11,12*z)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='rgba(8,14,22,.95)';ctx.shadowBlur=Math.max(2,3*z);ctx.fillStyle='#ffe3a0';ctx.fillText('+'+p.r108Orb.amount,q.x,q.y-(24+4*Math.sin(t*3))*z);}finally{ctx.restore();}}
   else if(eligible(p)){const ph=((t*.45+(hashOf(String(p.id))%100)/100)%1);if(ph<.22){const a=Math.sin(Math.PI*ph/.22);ctx.save();try{ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.5*a;const g=ctx.createRadialGradient(q.x,q.y-26*z,0,q.x,q.y-26*z,9*z);g.addColorStop(0,'rgba(255,232,170,1)');g.addColorStop(1,'rgba(255,190,90,0)');ctx.fillStyle=g;ctx.fillRect(q.x-10*z,q.y-36*z,20*z,20*z);}finally{ctx.restore();}}}}catch(err){fail(err);}
  return result;};
 window.__STORYWORLD_CRATES_R108__=Object.freeze({revision:'R108-crates-2',range:RANGE,attackRange:ATTACK_RANGE,pickup:PICKUP,eligible,amountOf,idOf,
  inspect:()=>({stats:{...stats},lastError,boxes:boxes().map(p=>({id:p.id,kind:p.r74Prop||p.r105Prop||null,amount:amountOf(p)})),orbs:(typeof room!=='undefined'&&room?.props||[]).filter(p=>p?.r108Orb).map(p=>({x:p.x,y:p.y,amount:p.r108Orb.amount}))})});
})();
