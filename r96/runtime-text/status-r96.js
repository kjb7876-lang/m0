/* Native-state-only R6 sustain and split root presentation. No damage writes,
 * wall clock animation, independent RAF, save fields or expanded pool budgets. */
(()=>{'use strict';
 const api=window.__STORYWORLD_FINAL42_R88__,data=window.__STORYWORLD_ASSETS_R96__;
 if(!api?.register||!data||window.__STORYWORLD_STATUS_R96__)return;
 for(const spec of Object.values(data))api.register(spec);
 const rows=new Map(),observed=new Map(),metrics={created:0,reapplied:0,cleared:0,painted:0,ghosted:0},GHOST=.46,VEIL=.8;
 let scene=null,actor=null,last=-Infinity,rebuild=true;
 const enabled=()=>started&&player?.hp>0&&room&&layer==='STORY'&&!settings.lowFx&&
  !(typeof mobile==='function'&&mobile())&&!window.matchMedia?.('(pointer:coarse)').matches&&
  (!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off');
 function clear(){for(const row of rows.values())api.remove(row.handle);rows.clear();observed.clear();metrics.cleared++;rebuild=true;}
 function native(){
  const active=new Map(),alias={poison:'poison',pollution:'poison',burn:'burn',fire:'burn',bind:'root','중독':'poison','화상':'burn','속박':'root'};
  const list=[...(window.__STORYWORLD_FIELDS_R61__?.statusRows()||[]),...(window.__STORYWORLD_REGIONAL_COMBAT_R58__?.statusRows()||[]),...(window.__STORYWORLD_HOSPITAL_WOUNDS_R53__?.statusRows()||[])];
  const binding=window.__STORYWORLD_PAINTED_VFX_R87__?.inspect().binding;
  if(binding)list.push({key:'bind',until:binding.until});
  for(const row of list){const kind=alias[row.key]||alias[row.label],until=Number.isFinite(row.until)?row.until:time+row.remaining;if(kind&&Number.isFinite(until)&&until>time)active.set(kind,Math.max(active.get(kind)||0,until));}
  return active;
 }
 const holdAge=kind=>kind==='root'?.96:.24;
 function sync(){
  if(scene!==room||actor!==player||time<last){clear();scene=room;actor=player;}
  if(!enabled()){clear();last=time;return;}
  if(time-last>.5){clear();}
  const active=native(),restore=rebuild;rebuild=false;last=time;
  for(const k of observed.keys())if(!active.has(k))observed.delete(k);
  for(const k of active.keys())if(!observed.has(k))observed.set(k,time-(restore?holdAge(k):0));
  for(const[k,row]of rows){
   if(!active.has(k)&&row.releaseAt==null){row.frozen=api.sample(data[k].id,Math.max(0,time-row.start));row.releaseAt=time;row.releaseSeconds=k==='root'?(time-row.start<.96?.16:.64):.24;row.canonical=k==='root'&&time-row.start>=.96;}
   if(row.releaseAt!=null&&time-row.releaseAt>=row.releaseSeconds){api.remove(row.handle);rows.delete(k);}
  }
  for(const[k,until]of active){
   let row=rows.get(k);
   if(row){row.until=until;if(row.releaseAt!=null){row.releaseAt=null;row.frozen=null;row.canonical=false;row.start=time-(k==='root'?0:holdAge(k));metrics.reapplied++;}continue;}
   if(!api.isReady(data[k].id)){void api.ensure(data[k].id);continue;}
   const age=Math.max(0,time-observed.get(k)),handle=api.attach(data[k].id,{entity:player,layer:'r96Manual',sourceKey:'r96-status:'+k,age});
   if(handle){rows.set(k,{handle,start:time-age,until,releaseAt:null,frozen:null});metrics.created++;}
  }
 }
 function paint(side){
  if(!enabled())return;
  const handles=new Set(api.inspect().active.map(r=>r.handle));
  for(const[k,row]of rows){
   if(!handles.has(row.handle)){rows.delete(k);continue;}
   if(k!=='root'&&side!=='back')continue;
   const alpha=row.releaseAt==null?1:Math.max(0,1-(time-row.releaseAt)/row.releaseSeconds),base=row.canonical?1:alpha;
   // Root's full canvas is 2x actor height; sustain's crop preserves its
   // 256-canvas scale and foot pivot. Both halves share one age and handle.
   const opt={entity:player,sourceKey:row.handle,age:row.canonical&&row.releaseAt!=null?time-row.releaseAt:Math.max(0,time-row.start),clip:row.canonical&&row.releaseAt!=null?'release':undefined,frozenFrame:row.frozen&&!row.canonical?{...row.frozen}:null,
    alpha:base*(k==='root'?VEIL:1),height:actorHeight()*(k==='root'?2:96/256*2),part:k==='root'?side:undefined,layer:side==='back'?'beforeActor':'afterActor',anchor:'feet'};
   if(api.render(data[k].id,opt))metrics.painted++;
   // R100: both halves are a little translucent so the hero shows through the
   // cage, and the thorns that grow behind the hero are drawn again over the
   // body, fainter, so the whole bind reads instead of a half hidden by the hero.
   if(k==='root'&&side==='front'&&api.render(data[k].id,{...opt,frozenFrame:opt.frozenFrame&&{...row.frozen},part:'back',alpha:base*GHOST}))metrics.ghosted++;
  }
 }
 const hero=drawHero;drawHero=function(...args){sync();paint('back');const result=hero.apply(this,args);paint('front');return result;};
 const baseTick=tick;tick=function(...args){const result=baseTick.apply(this,args);sync();return result;};
 for(const name of ['restoreSave','enterRegion','newGame']){const base=name==='restoreSave'?restoreSave:name==='enterRegion'?enterRegion:newGame;const wrapped=async function(...args){clear();try{return await base.apply(this,args);}finally{clear();}};if(name==='restoreSave')restoreSave=wrapped;else if(name==='enterRegion')enterRegion=wrapped;else newGame=wrapped;}
 const death=showDeath;showDeath=function(...args){clear();return death.apply(this,args);};
 document.addEventListener('visibilitychange',()=>{clear();});
 window.__STORYWORLD_STATUS_R96__=Object.freeze({ownsBinding:()=>rows.has('root')&&api.isReady(data.root.id),ready:()=>Promise.all(Object.values(data).map(s=>api.ensure(s.id))),
  inspect:()=>({revision:'R96-r6-native-status',active:[...rows].map(([kind,r])=>({kind,until:r.until,start:r.start,releaseAt:r.releaseAt,handle:r.handle})),metrics:{...metrics},nativeDamageChanged:false,saveFieldsAdded:false})});
})();
