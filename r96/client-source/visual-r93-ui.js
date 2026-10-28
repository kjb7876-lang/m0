/* R93 HUD and sound dressing. Presentation only: processed copies of the R92
 * UI candidates (skill slot frames, nine-slice panel, health/resonance orbs)
 * and the R92 procedural audio candidates (footsteps by floor family, torch and
 * water ambience). Values are read from the native HUD and player; nothing is
 * written back. Sound follows the native sound switch and volume and plays
 * through the native WebAudio graph. Canonical source; copied by apply-r93.cjs. */
(()=>{'use strict';
 if(window.__STORYWORLD_VISUAL_R93_UI__||!document.querySelector('footer'))return;
 const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r93.ui';
 const DEFAULTS=Object.freeze({dockUi:true,slotFrames:true,panelFrames:true,orbs:true,footsteps:true,ambience:true});
 const LABELS={dockUi:'떠 있는 창을 위·아래 창으로 정리',slotFrames:'스킬 칸 테두리',panelFrames:'패널 장식 틀',orbs:'체력·공명 구슬',footsteps:'발소리',ambience:'횃불·물방울 환경음'};
 const UI='./assets/r93/ui/',AUDIO='assets/r93/audio/';
 let prefs={...DEFAULTS},lastError=null;const stats={steps:0,ambientStarts:0,orbUpdates:0,errors:0};
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(DEFAULTS))if(typeof saved?.[k]==='boolean')prefs[k]=saved[k];}catch(_){}
 const fail=e=>{stats.errors++;lastError=String(e?.stack||e);};
 function set(patch={}){for(const k of Object.keys(DEFAULTS))if(typeof patch[k]==='boolean')prefs[k]=patch[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}apply();return{...prefs};}

 // ---- HUD ----------------------------------------------------------------
 // Orb fill rectangle inside the 256 shell canvas (batch notes: 61,63,390,380 of 512).
 const FILL={l:61/512*100,t:63/512*100,w:390/512*100,h:380/512*100};
 const css=document.createElement('style');css.id='r93-ui-style';css.textContent=`
body.r93-slots .skill{border-color:transparent!important;position:relative}
body.r93-slots .skill::after{content:'';position:absolute;inset:-4px;background:url(${UI}slot-neutral.png) center/100% 100% no-repeat;pointer-events:none;z-index:1}
body.r93-slots .skill>.label{position:relative}
body.r93-slots .skill>kbd,body.r93-slots .skill>.label,body.r93-slots .skill>.cd{z-index:2;text-shadow:0 0 3px #000,0 1px 2px #000}
body.r93-slots .skill:hover::after,body.r93-slots .skill:focus-visible::after{background-image:url(${UI}slot-focus.png)}
body.r93-slots .skill.r93-on::after{background-image:url(${UI}slot-active.png)}
body.r93-slots .skill.r93-cd::after,body.r93-slots .skill:disabled::after{background-image:url(${UI}slot-disabled.png)}
body.r93-panels footer::before,body.r93-panels #quest::before{content:'';position:absolute;inset:-11px -6px -6px;border:16px solid transparent;border-image:url(${UI}panel.png) 112 stretch;pointer-events:none;z-index:4;filter:brightness(.85)}
body.r93-panels #quest::before{inset:-4px;border-width:14px}
body.r93-orbs #heroStats>#hpText,body.r93-orbs #heroStats>#resText,body.r93-orbs #heroStats>.bar:not(.xp){display:none!important}
#heroStats>.r93-orbs{display:flex;gap:6px;align-items:center;margin:2px 0 3px}
.r93-orb{position:relative;width:64px;height:64px;flex:0 0 64px}
.r93-orb .fill{position:absolute;left:${FILL.l}%;top:${FILL.t}%;width:${FILL.w}%;height:${FILL.h}%;border-radius:50%;overflow:hidden;background:#0b0908}
.r93-orb .fill i{position:absolute;inset:0;background-position:center;background-size:${100*100/FILL.w}% ${100*100/FILL.h}%;transition:clip-path .18s linear}
.r93-orb .shell{position:absolute;inset:0;background:url(${UI}orb-shell.png) center/100% 100% no-repeat;pointer-events:none}
.r93-orb b{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);text-align:center;font:600 10px/1.1 "Malgun Gothic",sans-serif;color:#f1e6d6;text-shadow:0 0 3px #000,0 1px 2px #000;pointer-events:none}
.r93-orb.low .fill i{animation:r93pulse .9s ease-in-out infinite alternate}
@keyframes r93pulse{from{filter:brightness(.8)}to{filter:brightness(1.35)}}
body.r93-dock header{z-index:6}
body.r93-dock header .region{position:relative;display:flex;flex-wrap:wrap;align-items:baseline;column-gap:6px;row-gap:1px;min-width:0}
body.r93-dock header .region #regionSub{flex-basis:100%;font-size:10px;opacity:.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#quest.r93-dock{overflow:visible!important;max-height:none!important;position:relative!important;left:auto!important;top:auto!important;right:auto!important;bottom:auto!important;width:auto!important;max-width:100%;flex-basis:100%;margin:0!important;padding:0!important;background:none!important;border:0!important;box-shadow:none!important;z-index:30}
#quest.r93-dock::before{display:none!important}
#quest.r93-dock #questHeader{display:block;padding:0;margin:0}
#quest.r93-dock .eyebrow,#quest.r93-dock #questTitle,#quest.r93-dock #questToggle{display:none!important}
#quest.r93-dock #questInlineSummary{display:block!important;font-size:11px;color:#e3c993;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:help}
#quest.r93-dock #questDetails{display:none!important;position:absolute;left:0;top:100%;width:320px;padding:8px 10px;margin-top:6px;background:linear-gradient(135deg,rgba(39,33,27,.97),rgba(17,17,16,.96));border:1px solid #786a57;box-shadow:0 6px 18px rgba(0,0,0,.6)}
#quest.r93-dock:hover #questDetails,#quest.r93-dock:focus-within #questDetails{display:block!important}
#goldHudR72.r93-dock,#story-code-button.r93-dock{position:static!important;right:auto!important;top:auto!important;bottom:auto!important;left:auto!important;z-index:auto!important;margin-right:4px}
#goldHudR72.r93-dock button,#story-code-button.r93-dock{font-size:11px;padding:4px 7px}
#story-wer-controls.r93-dock{position:static!important;right:auto!important;bottom:auto!important;left:auto!important;top:auto!important;display:flex!important;gap:4px;justify-content:center;margin:0 0 3px}
#story-wer-controls.r93-dock .skill{width:40px!important;height:32px!important;min-width:0!important;padding:0!important;flex:0 0 40px}
#story-wer-controls.r93-dock .skill img{width:20px;height:20px;margin-top:5px}
#story-wer-controls.r93-dock .skill .label{display:none}
#story-wer-controls.r93-dock .skill kbd{font-size:9px}
body.r93-dock .footRight{display:flex;flex-direction:column;align-items:stretch;justify-content:center;gap:1px;max-width:190px;max-height:104px;overflow:hidden}
body.r93-dock .footRight #upgradeBtn{padding:2px 6px;font-size:11px}
body.r93-dock .footRight #awakeText,body.r93-dock .footRight #buildText{font-size:10px;line-height:1.2}
body.r93-dock #minipanel{top:0!important;right:0!important;transform:scale(.72);transform-origin:top right;opacity:.88}`;
 document.head.appendChild(css);
 let orbs=null;
 function buildOrbs(){const host=document.getElementById('heroStats');if(!host||orbs?.isConnected)return;orbs=document.createElement('div');orbs.className='r93-orbs';
  const one=(kind,fill)=>`<div class="r93-orb r93-${kind}"><div class="fill"><i style="background-image:url(${UI}${fill})"></i></div><div class="shell"></div><b></b></div>`;
  orbs.innerHTML=one('hp','orb-health-fill.png')+one('res','orb-resonance-fill.png');const name=document.getElementById('heroName');host.insertBefore(orbs,name?name.nextSibling:host.firstChild);}
 const pct=id=>{const w=document.getElementById(id)?.style.width||'';const v=parseFloat(w);return Number.isFinite(v)?Math.max(0,Math.min(100,v)):100;};
 const numbers=id=>(document.getElementById(id)?.textContent||'').replace(/[^0-9/ ]/g,'').trim().replace(/\s+/g,'');
 function updateOrbs(){if(!prefs.orbs)return;buildOrbs();if(!orbs)return;
  for(const[kind,fill,text]of[['hp','hpFill','hpText'],['res','resFill','resText']]){const el=orbs.querySelector('.r93-'+kind),p=pct(fill);
   el.querySelector('.fill i').style.clipPath=`inset(${(100-p).toFixed(1)}% 0 0 0)`;el.querySelector('b').textContent=numbers(text);el.classList.toggle('low',kind==='hp'&&p<30);}stats.orbUpdates++;}
 function updateSlots(){if(!prefs.slotFrames)return;for(const b of document.querySelectorAll('.skill')){const cd=b.querySelector('.cd'),busy=!!(cd&&(cd.textContent.trim()||parseFloat(cd.style.height)>0||parseFloat(cd.style.width)>0));
  b.classList.toggle('r93-cd',busy||b.disabled);b.classList.toggle('r93-on',!busy&&(b.classList.contains('active')||b.classList.contains('on')||b.getAttribute('aria-pressed')==='true'));}}
 // Floating map windows move into the header and footer; each element keeps its
 // id and listeners, and returns to its original parent when the option is off.
 const homes=new Map();
 const DOCK=[['quest',()=>document.querySelector('header .region'),'append'],['goldHudR72',()=>document.querySelector('header .topnav'),'prepend'],
  ['story-code-button',()=>document.querySelector('header .topnav'),'prepend'],['story-wer-controls',()=>document.querySelector('footer .footRight'),'prepend']];
 function dock(){const enabled=prefs.dockUi&&!document.body.classList.contains('mobile-live-r63');document.body.classList.toggle('r93-dock',enabled);for(const[id,target,how]of DOCK){const el=document.getElementById(id),host=target();if(!el||!host)continue;
   // The native full-screen mobile layout hides header/footer entirely.
   // Keep its floating controls in their native, reachable parents.
   if(enabled){if(el.parentElement===host)continue;if(!homes.has(id)){const marker=document.createElement('span');marker.hidden=true;marker.style.display='none';const parent=el.parentElement,next=el.nextSibling;parent.insertBefore(marker,el);homes.set(id,{parent,next,marker});}host[how](el);el.classList.add('r93-dock');stats.docked=(stats.docked||0)+1;}
   else if(homes.has(id)&&el.parentElement===host){const h=homes.get(id);el.classList.remove('r93-dock');if(h.marker.parentNode)h.marker.parentNode.insertBefore(el,h.marker);else h.parent?.insertBefore(el,h.next&&h.next.parentNode===h.parent?h.next:null);h.marker.remove();homes.delete(id);}}}
 setInterval(()=>{try{dock();}catch(e){fail(e);}},500);
 function apply(){document.body.classList.toggle('r93-dock',prefs.dockUi);try{dock();}catch(e){fail(e);}document.body.classList.toggle('r93-slots',prefs.slotFrames);document.body.classList.toggle('r93-panels',prefs.panelFrames);document.body.classList.toggle('r93-orbs',prefs.orbs);
  if(!prefs.orbs&&orbs){orbs.remove();orbs=null;}if(!prefs.ambience)ambienceOff();}
 setInterval(()=>{try{updateOrbs();updateSlots();}catch(e){fail(e);}},120);

 // ---- sound --------------------------------------------------------------
 const SURFACE={clinical:'stone_tile',stone:'stone_tile',forge:'stone_tile',ash:'stone_tile',swamp:'wet_mud',garden:'wet_mud',cave:'gravel',regional:'gravel',snow:'gravel',coast:'gravel',domestic:'wood',memory:'wood',neural:'wood'};
 function family(){const L=typeof room!=='undefined'?room?.exploration:null;return L?.surface?.art?.r81Environment||L?.worldWardR81?.environment?.family||(typeof zone!=='undefined'&&zone==='ep1a08'?'clinical':null)||window.__STORYWORLD_ENVIRONMENT_R81__?.specs?.[zone]?.family||'regional';}
 const audible=()=>typeof settings!=='undefined'&&settings.sound&&settings.volume>0&&typeof audioUnlocked!=='undefined'&&audioUnlocked&&typeof audioContext!=='undefined'&&audioContext&&typeof masterGain!=='undefined'&&masterGain&&!document.hidden&&!(typeof modal!=='undefined'&&modal);
 const FOOTSTEP_GAIN=.065;
 let lastStep={x:NaN,y:NaN,travel:0,variant:0};
 async function step(){const surface=SURFACE[family()]||'stone_tile',context=audioContext,actor=player,scene=room,at=typeof time==='number'?time:null;let v=1+Math.floor(Math.random()*4);if(v===lastStep.variant)v=v%4+1;lastStep.variant=v;
  const buffer=await audioBuffer(AUDIO+'footstep_'+surface+'_0'+v+'.ogg');if(!buffer||!prefs.footsteps||!audible()||audioContext!==context||player!==actor||room!==scene||at!==null&&time-at>.6)return;
  const src=audioContext.createBufferSource(),g=audioContext.createGain();src.buffer=buffer;src.playbackRate.value=.97+Math.random()*.06;
  // R98: footsteps sat above most combat sounds (.16); they are now a quiet bed under them.
  g.gain.value=settings.volume*FOOTSTEP_GAIN*Math.pow(10,(Math.random()*2-1)/20);src.connect(g);g.connect(masterGain);src.onended=()=>{src.disconnect();g.disconnect();};src.start();stats.steps++;}
 function footsteps(){if(!prefs.footsteps||typeof player==='undefined'||!player||player.hp<=0){lastStep.x=NaN;return;}
  const d=Number.isFinite(lastStep.x)?Math.hypot(player.x-lastStep.x,player.y-lastStep.y):0;lastStep.x=player.x;lastStep.y=player.y;
  // Teleports and region changes are not walking.
  if(d>1.2){lastStep.travel=0;return;}lastStep.travel+=d;if(lastStep.travel>=.78&&audible()){lastStep.travel=0;step().catch(fail);}}
 const loops={};
 function stopLoop(name){const rec=loops[name];if(!rec)return;delete loops[name];if(rec.src){try{rec.src.stop();}catch(_){}rec.src.disconnect();}rec.gain?.disconnect();}
 async function loop(name){if(loops[name]?.context!==audioContext)stopLoop(name);if(loops[name])return loops[name];const rec=loops[name]={gain:null,src:null,context:audioContext};const buffer=await audioBuffer(AUDIO+'ambient_'+name+'_loop12s.ogg');
  // A decode may finish after sound was disabled, the page was hidden, the
  // region changed or the native AudioContext was replaced. Never resurrect
  // an obsolete loop, or attach an old buffer to the replacement context.
  if(loops[name]!==rec)return null;
  if(!buffer||audioContext!==rec.context||ambientVolume(name)<=0){stopLoop(name);return null;}
  rec.gain=audioContext.createGain();rec.gain.gain.value=0;rec.src=audioContext.createBufferSource();rec.src.buffer=buffer;rec.src.loop=true;rec.src.connect(rec.gain);rec.gain.connect(masterGain);rec.src.start();stats.ambientStarts++;return rec;}
 function level(name,v){const rec=loops[name];if(rec?.gain&&audioContext)rec.gain.gain.setTargetAtTime(v,audioContext.currentTime,.4);}
 function ambienceOff(){for(const k of Object.keys(loops))stopLoop(k);}
 function nearestLight(){if(typeof player==='undefined'||!player)return Infinity;const pts=[...(window.__STORYWORLD_VISUAL_R92__?.lightPoints?.()||[]),...(window.__STORYWORLD_VISUAL_R91__?.lightPoints?.()||[])];let d=Infinity;for(const p of pts)d=Math.min(d,Math.hypot(p.x-player.x,p.y-player.y));return d;}
 function ambientVolume(name){if(!prefs.ambience||!audible())return 0;return settings.volume*(name==='torch_fire'?.11*Math.max(0,1-nearestLight()/7):['swamp','cave','garden','coast'].includes(family())?.06:0);}
 function ambience(){if(!prefs.ambience||!audible()){ambienceOff();return;}
  for(const name of ['torch_fire','water_drips'])if(ambientVolume(name)>0||loops[name])loop(name).then(rec=>{if(rec&&loops[name]===rec)level(name,ambientVolume(name));}).catch(fail);}
 if(typeof tickEnemies==='function'){const base=tickEnemies;tickEnemies=function(...args){const result=base.apply(this,args);try{footsteps();}catch(e){fail(e);}return result;};}
 setInterval(()=>{try{ambience();}catch(e){fail(e);}},250);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)ambienceOff();});

 // ---- settings -----------------------------------------------------------
 // R108: the HUD switches and the two sound switches are separate sections, so the
 // settings UI can file them under different headings. Control ids (r93-*) are unchanged.
 const SOUND_KEYS=['footsteps','ambience'];
 function settingsSection(){const host=document.getElementById('retroSettingsR92Boss')||document.getElementById('retroSettingsR92Mobs')||document.getElementById('retroSettingsR92');if(!host||document.getElementById('retroSettingsR93'))return;
  const make=(id,title,note,keys)=>{const s=document.createElement('section');s.id=id;s.innerHTML='<h3>'+title+'</h3><p class="small muted">'+note+'</p>'+keys.map(k=>'<label><input type="checkbox" id="r93-'+k+'"> '+LABELS[k]+'</label> ').join('');return s;};
  const hud=make('retroSettingsR93','HUD','표시만 바뀌며 저장 슬롯과 별도로 보관됩니다.',Object.keys(DEFAULTS).filter(k=>!SOUND_KEYS.includes(k))),snd=make('retroSettingsR93Sound','발소리·환경음','소리만 바뀌며 저장 슬롯과 별도로 보관됩니다.',SOUND_KEYS);
  host.parentNode.insertBefore(hud,host.nextSibling);hud.parentNode.insertBefore(snd,hud.nextSibling);
  for(const s of[hud,snd])for(const k of Object.keys(DEFAULTS)){const el=s.querySelector('#r93-'+k);if(!el)continue;el.checked=prefs[k];el.onchange=()=>set({[k]:el.checked});}}
 if(typeof showSettings==='function'){const sb=showSettings;showSettings=function(...args){const result=sb.apply(this,args);try{settingsSection();}catch(e){fail(e);}return result;};}
 apply();
 window.__STORYWORLD_VISUAL_R93_UI__=Object.freeze({prefs:()=>({...prefs}),set,storageKey:KEY,family,
  inspect:()=>({revision:'R93-ui-audio',prefs:{...prefs},stats:{...stats},loops:Object.keys(loops),footstepGain:FOOTSTEP_GAIN,lastError,presentationOnly:true,listeningVerified:false})});
})();
