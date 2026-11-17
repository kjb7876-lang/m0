// R1124: delayed friendly hits keep their caster's identity, even when another
// hero is being controlled. No damage, cooldown, progression or save changes.
(()=>{'use strict';
if(window.__STORYWORLD_COMBAT_OWNERSHIP_R1124__)return;
const stats={shots:0,hits:0,effects:0},ids=new WeakMap();let serial=0,active=null;
const context=()=>typeof e568HeroActionContext!=='undefined'?e568HeroActionContext:null;
function known(id){return typeof id==='string'&&id.length>0&&typeof HEROES==='object'&&Object.prototype.hasOwnProperty.call(HEROES,id)?id:null;}
function heroOf(source){if(!source||typeof source!=='object'||source.friendly===false)return null;
 return known(source.sourceHero)||known(source.e568HeroActionContext?.heroId)||known(source.pxfSourceHero)||known(source.hero);}
function capture(source,hero){const stored=source.e568HeroActionContext,cur=context(),same=stored?.heroId===hero?stored:cur?.heroId===hero?cur:null;
 let id=source.attackId9??source.eventId??source.id??same?.id;
 if(id==null){id=ids.get(source);if(!id){id='r1124:'+ ++serial;ids.set(source,id);}}
 const kind=source.attackKind9==='basic'?'attack':source.attackKind9==='skill'||source.storyWER?'skill':same?.kind||'skill';
 return {...(same||{}),id,heroId:hero,kind,at:same?.at??(typeof time==='number'?time:0)};}
function withContext(c,fn){if(!c||typeof e568HeroActionContext==='undefined')return fn();const prev=e568HeroActionContext,prior=active;
 e568HeroActionContext=c;active=c;try{return fn();}finally{active=prior;e568HeroActionContext=prev;}}
if(typeof makeShot==='function'){const base=makeShot;makeShot=function(x,y,angle,speed,damage,opt,...rest){
 const friendly=opt?.friendly===true&&opt?.owner==='hero';
 const hero=friendly?(heroOf(opt)||known(context()?.heroId)||known(typeof player==='object'?player?.hero:null)):null;
 if(!hero)return base.apply(this,arguments);
 const options={...opt,sourceHero:hero},c=capture(options,hero);
 const shot=withContext(c,()=>base.call(this,x,y,angle,speed,damage,options,...rest));
 if(shot&&typeof shot==='object'){shot.sourceHero=hero;shot.e568HeroActionContext={...c};stats.shots++;}return shot;};}
if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(enemy,damage,source,...rest){const hero=heroOf(source);
 if(!hero)return base.apply(this,arguments);const c=capture(source,hero);stats.hits++;
 return withContext(c,()=>base.call(this,enemy,damage,source,...rest));};}
// R40's legacy Hwando wrapper also consults its own action scope. Supplying the
// hit's explicit caster prevents that older scope from recolouring a generic hit.
if(typeof fx==='function'){const base=fx;fx=function(type,x,y,opt,...rest){let o=opt;
 if(active&&!(opt?.friendly===false)&&!opt?.sourceHero&&!opt?.heroIdE568){o={...(opt||{}),sourceHero:active.heroId};stats.effects++;}
 return base.call(this,type,x,y,o,...rest);};}
window.__STORYWORLD_COMBAT_OWNERSHIP_R1124__=Object.freeze({revision:'R1124-combat-ownership-1',heroOf,inspect:()=>({...stats,active:active?.heroId||null})});
})();
