/* R92 boss dissolution. Presentation only: processed copies of the R92 boss
 * death derived sheets (assets/r92/boss). When a listed boss is killed its
 * native fading body and burn row are replaced by the dissolution strip at the
 * spot where it fell. Kill handling, rewards, encounter flow and saves run
 * unchanged. Canonical source; copied by apply-r92-boss.cjs. */
(()=>{'use strict';
 const A=window.StoryPhase1;
 if(!A||window.__STORYWORLD_VISUAL_R92_BOSS__||typeof killEnemy!=='function'||typeof drawEnemy!=='function')return;
 const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r92.boss';
 const INDEX='./assets/r92/boss/index.json',STEP=.2,HOLD=.45,FADE=.35;
 let prefs={bossDeath:true,narrativeUnconfirmed:false},index=null,state='idle',lastError=null,preloadAt=0;
 const stats={started:0,frames:0,suppressedBodies:0,suppressedBurns:0,missingImage:0,preloads:0,errors:0},plays=new Map(),flips=new Map(),cache=new Map();
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(prefs))if(typeof saved?.[k]==='boolean')prefs[k]=saved[k];}catch(_){}
 const fail=e=>{stats.errors++;lastError=String(e?.stack||e);};
 function set(patch={}){for(const k of Object.keys(prefs))if(typeof patch[k]==='boolean')prefs[k]=patch[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
 function load(){if(state!=='idle')return;state='loading';
  fetch(INDEX,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('R92 boss index '+r.status);return r.json();}).then(j=>{index=j;state='ready';}).catch(e=>{state='failed';fail(e);});}
 // Hanrian / Baekion need the second switch: the source QA does not confirm their narrative death.
 const art=e=>{const b=index?.bosses?.[e?.nativeId];return b&&prefs.bossDeath&&(b.defaultOn||prefs.narrativeUnconfirmed)?b:null;};
 const duration=b=>b.sequence.length*STEP+HOLD+FADE;
 function frame(id,b,i){const k=id+':'+i;let f=cache.get(k);if(f)return f;const[cw,ch]=b.cell;
  f=Object.freeze({path:b.path,r92BossDeath:true,assetFrame:Object.freeze({sourceRect:[i*cw,0,cw,ch],pivot:[...b.pivot],visibleHeight:b.visibleHeight})});cache.set(k,f);return f;}
 function preload(){const now=performance.now();if(!index||now-preloadAt<2000||typeof addImage!=='function'||typeof readyImage!=='function')return;preloadAt=now;
  for(const e of room?.enemies||[]){const b=art(e);if(b&&!readyImage(b.path)){addImage(b.path,'R92 generated boss dissolution');stats.preloads++;}}}
 const unit=e=>(Number(e?.combatProfile?.spriteRect?.height)||1)*(Number(e?.defScale)||1);
 const kb=killEnemy;
 killEnemy=function(e,...args){const first=!!e&&!e.deadRecorded,result=kb.apply(this,[e,...args]);
  // Guards in the kill chain can refuse a kill (phases, scenes); only a recorded death plays.
  try{const b=first&&e.deadRecorded===true&&e.hp<=0&&art(e);if(b&&typeof readyImage==='function'&&readyImage(b.path)){plays.set(e.id,{id:e.nativeId,actor:e,x:e.x,y:e.y,t0:time,unit:unit(e),flip:flips.get(e.id)??e.rc146BodyOptions?.flip??false,zone,room});stats.started++;}
   else if(b)stats.missingImage++;}catch(err){fail(err);}return result;};
 // Remember the body's mirror state each frame so the strip falls the same way.
 const de=drawEnemy;
 drawEnemy=function(e,...args){
  try{load();if(index&&(e?.boss||e?.midboss)){preload();if(plays.has(e.id)&&e.hp<=0){stats.suppressedBodies++;return;}}}catch(err){fail(err);}
  if(!(e?.boss||e?.midboss)||typeof drawAssetFrame3!=='function')return de.call(this,e,...args);
  const base=drawAssetFrame3;drawAssetFrame3=function(path,f,x,y,h,opt={}){if(e.hp>0)flips.set(e.id,opt.flip===true);return base.call(this,path,f,x,y,h,opt);};
  try{return de.call(this,e,...args);}finally{drawAssetFrame3=base;}};
 // The native boss death row (body + flames) is drawn by drawBurnDeath3 from the depth stack.
 if(typeof drawBurnDeath3==='function'){const burn=drawBurnDeath3;drawBurnDeath3=function(f,...args){if(f&&(plays.has(f.sourceId)||plays.has(f.sourceActorIdRC145))){stats.suppressedBurns++;return;}return burn.apply(this,[f,...args]);};}
 function drawPlays(){if(!plays.size||typeof project!=='function'||typeof drawAssetFrame3!=='function')return;const h0=typeof actorHeight==='function'?actorHeight():66;
  for(const[key,p]of plays){const b=index?.bosses?.[p.id],age=time-p.t0;if(!b||p.zone!==zone||p.room!==room||age<0||age>duration(b)){plays.delete(key);continue;}
   const step=Math.min(b.sequence.length-1,Math.floor(age/STEP)),i=b.sequence[step],tail=age-(b.sequence.length*STEP+HOLD),alpha=tail>0?Math.max(0,1-tail/FADE):1;
   const q=project(p.x,p.y),f=frame(p.id,b,i),paint=()=>{if(drawAssetFrame3(b.path,f,q.x,q.y,h0*p.unit,{alpha,flip:p.flip}))stats.frames++;};
   if(typeof ctx.scope==='function')ctx.scope({id:'r92:boss-death:'+key,kind:'prop',x:p.x,y:p.y,bodyPath:b.path,alive:true,presentationOnly:true,r92BossDeath:true},paint);else paint();}}
 if(typeof drawHero==='function'){const dh=drawHero;drawHero=function(...args){const result=dh.apply(this,args);try{drawPlays();}catch(e){fail(e);}return result;};}
 function settingsSection(){const host=document.getElementById('retroSettingsR92Mobs')||document.getElementById('retroSettingsR92');if(!host||document.getElementById('retroSettingsR92Boss'))return;
  const s=document.createElement('section');s.id='retroSettingsR92Boss';s.innerHTML='<h3>보스 소멸 (R92)</h3><p class="small muted">처치 판정·보상·진행은 그대로이며 그림만 바뀝니다.</p><label><input type="checkbox" id="r92-bossDeath"> 보스 소멸 연출</label> <label><input type="checkbox" id="r92-narrativeUnconfirmed"> 한리안·백이온 포함(서사 미확정)</label>';
  host.parentNode.insertBefore(s,host.nextSibling);for(const k of Object.keys(prefs)){const el=s.querySelector('#r92-'+k);el.checked=prefs[k];el.onchange=()=>set({[k]:el.checked});}}
 if(typeof showSettings==='function'){const sb=showSettings;showSettings=function(...args){const result=sb.apply(this,args);try{settingsSection();}catch(e){fail(e);}return result;};}
 window.__STORYWORLD_VISUAL_R92_BOSS__=Object.freeze({prefs:()=>({...prefs}),set,storageKey:KEY,
  active:()=>[...plays.values()].map(p=>({id:p.id,age:+(time-p.t0).toFixed(2),flip:p.flip})),
  inspect:()=>({revision:'R92-boss-death',prefs:{...prefs},index:state,bosses:index?Object.keys(index.bosses):[],stats:{...stats},lastError,presentationOnly:true,gameplayChanged:false,saveSlotsChanged:false})});
})();
