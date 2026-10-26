/* R98/R99 enemy skill presentation. The geometric range previews (footprint
 * outlines, direction ticks, the faint pre-hit slash decal) are hidden by
 * default. R99 draws the enemy side with the painted FINAL42 frame atlases: a
 * wind-up aura on the caster, a painted contact burst over the real attack
 * footprint when the hit lands, a cast aura and release burst for ranged
 * casts, and a gathering motif plus eruption for boss patterns and hazards.
 * The motif follows the region family; bosses, midbosses and the persona carry
 * their own. Only a soft ground pool remains in code. R100: when the enemy's
 * art has a measured signature colour (R100 polish), the effects use that
 * colour's recoloured strips and tinted pools instead of the family motif.
 * Presentation only: attack timing, footprints, hit tests, damage and saves
 * are read, never written. Canonical source. */
(()=>{'use strict';
 if(window.__STORYWORLD_VFX_R98__||typeof drawEffect!=='function'||typeof fx!=='function'||typeof tick!=='function'||typeof project!=='function'||typeof groundImage!=='function')return;
 const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r98.vfx';
 const DEFAULTS=Object.freeze({telegraph:false,effects:true}),LABELS={telegraph:'적 공격 범위 미리보기(선)',effects:'적 스킬 이펙트 (R99 원화)'};
 let prefs={...DEFAULTS},lastError=null,serial=0;
 const stats={roots:0,charges:0,impacts:0,casts:0,releases:0,gathers:0,bursts:0,sparks:0,contacts:0,groundDraws:0,airDraws:0,suppressed:0,dropped:0,errors:0};
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(DEFAULTS))if(typeof saved?.[k]==='boolean')prefs[k]=saved[k];}catch(_){}
 const fail=e=>{stats.errors++;lastError=String(e?.stack||e);};
 function set(patch={}){for(const k of Object.keys(DEFAULTS))if(typeof patch[k]==='boolean')prefs[k]=patch[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
 const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
 const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
 const rnd=(seed,i)=>{const h=hash(seed+':'+i);return(h&0xffffff)/0x1000000;};
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const lowFx=()=>!!(typeof settings!=='undefined'&&settings.lowFx);
 const TAU=Math.PI*2;

 // ---- palette -------------------------------------------------------------
 const THEMES={
  clinical:{a:[143,227,255],b:[216,251,255],c:[63,183,168]},garden:{a:[159,224,138],b:[242,255,176],c:[224,184,74]},
  cave:{a:[183,198,255],b:[244,246,255],c:[140,150,184]},swamp:{a:[141,211,106],b:[217,255,154],c:[79,138,58]},
  ash:{a:[255,154,60],b:[255,227,168],c:[194,58,30]},domestic:{a:[255,196,107],b:[255,241,201],c:[176,107,58]},
  stone:{a:[217,210,192],b:[255,246,220],c:[155,142,108]},forge:{a:[255,179,71],b:[255,242,204],c:[255,90,31]},
  snow:{a:[169,228,255],b:[255,255,255],c:[90,166,214]},coast:{a:[111,211,216],b:[223,252,255],c:[47,127,156]},
  memory:{a:[200,156,255],b:[241,228,255],c:[122,75,191]},neural:{a:[95,240,255],b:[229,255,255],c:[47,120,255]},
  regional:{a:[230,199,122],b:[255,243,207],c:[176,133,64]},
  boss:{a:[255,96,86],b:[255,214,201],c:[122,15,31]},persona:{a:[255,59,122],b:[255,209,224],c:[58,11,30]},hero:{a:[255,226,160],b:[255,250,230],c:[200,150,70]}
 };
 const rgba=(c,a)=>'rgba('+c[0]+','+c[1]+','+c[2]+','+clamp(a,0,1).toFixed(3)+')';
 function family(){const L=typeof room!=='undefined'?room?.exploration:null;return L?.surface?.art?.r81Environment||L?.worldWardR81?.environment?.family||(typeof zone!=='undefined'&&zone==='ep1a08'?'clinical':null)||window.__STORYWORLD_ENVIRONMENT_R81__?.specs?.[zone]?.family||'regional';}
 const POL=()=>window.__STORYWORLD_POLISH_R100__,SIGT={};
 function sigTheme(name){if(SIGT[name])return SIGT[name];const c=POL()?.sigColours?.[name];if(!c)return null;
  return SIGT[name]={a:c,b:c.map(v=>Math.round(v+(255-v)*.55)),c:c.map(v=>Math.round(v*.5)),sig:name};}
 function themeFor(e){const sig=e&&POL()?.colourOf?.(e),st=sig&&sigTheme(sig);if(st)return st;if(e?.persona)return THEMES.persona;if(e?.boss||e?.midboss)return THEMES.boss;return THEMES[family()]||THEMES.regional;}

 // ---- R99 painted layer -------------------------------------------------------
 // The FINAL42 painted atlases (hand-painted frame animations already shipped
 // with the game) carry the look; the procedural rings, stars and rays are gone.
 // Each region family picks a contact burst, a wind-up aura and a gathering
 // motif. While an atlas is still decoding a soft glow stands in for it.
 const F42=()=>window.__STORYWORLD_FINAL42_R88__,F42D=()=>window.__STORYWORLD_FINAL42_DATA_R88__?.effects||{};
 const PAINT={
  clinical:{hit:'F215',aura:'F243',gather:'F213'},garden:{hit:'F091',aura:'F249',gather:'F110'},cave:{hit:'F098',aura:'F250',gather:'F114'},
  swamp:{hit:'F261',aura:'F249',gather:'F111'},ash:{hit:'F094',aura:'F247',gather:'F112'},domestic:{hit:'F101',aura:'F247',gather:'F112'},
  stone:{hit:'F098',aura:'F250',gather:'F112'},forge:{hit:'F094',aura:'F247',gather:'F112'},snow:{hit:'F095',aura:'F244',gather:'F244'},
  coast:{hit:'F261',aura:'F244',gather:'F111'},memory:{hit:'F097',aura:'F248',gather:'F130'},neural:{hit:'F096',aura:'F243',gather:'F116'},
  regional:{hit:'F090',aura:'F250',gather:'F114'},boss:{hit:'F090',aura:'F250',gather:'F114',burst:'F117'},persona:{hit:'F217',aura:'F248',gather:'F130',burst:'F115'},
  hero:{hit:'F246'}
 };
 function paintFor(e){const th=e.th;if(th?.sig)return e.major?PAINT.boss:PAINT[family()]||PAINT.regional;for(const[k,v]of Object.entries(THEMES))if(v===th)return PAINT[k]||PAINT.regional;return PAINT.regional;}
 const paintStats={drawn:0,fallback:0};
 // Draw one painted frame. loop=true wraps the clip (auras, gathering); otherwise
 // the clip is stretched over the effect's own life so it ends with it.
 function paint(id,x,y,{t=0,life=1,loop=false,scale=1,alpha=1,height,key,lift=0}={}){
  const api=F42(),spec=F42D()[id];if(!api||!spec||!(alpha>0))return false;const d=spec.duration||1;
  const age=loop?((time-(key?.at??0))%d+d)%d:clamp(t,0,.999)*d;
  const ok=api.render(id,{x,y,age,scale,alpha,height,key:'r99:'+(key?.id||id)+(lift?':'+lift:''),sourceId:'r99:'+(key?.id||id)+(lift?':'+lift:'')});
  ok?paintStats.drawn++:paintStats.fallback++;return ok;}
 function preload(){const api=F42();if(!api?.ensure)return;const f=family(),set=new Set();for(const k of[f,'boss','hero'])for(const id of Object.values(PAINT[k]||{}))set.add(id);for(const id of set)try{api.ensure(id);}catch(_){}const ck=CONTACT_BY[f];if(ck&&typeof addImage==='function')try{addImage(CONTACT[ck].path);}catch(_){}preloadSig();}
 // R100: the signature strips of the colours present in the room (plain
 // images; the FINAL42 atlas pool is left to region entry).
 function preloadSig(){if(typeof addImage!=='function'||typeof room==='undefined'||!room)return;const seen=new Set();for(const e of room.enemies||[]){const c=POL()?.colourOf?.(e);if(c&&!seen.has(c)){seen.add(c);for(const k of Object.keys(POL()?.sig||{}))try{addImage(sigPath(k,c),'R100 signature effect');}catch(_){}}}}

 // ---- geometry ------------------------------------------------------------
 const unit=()=>TILE*zoom;
 const P=(x,y)=>project(x,y);
 function ellipse(x,y,r){const q=P(x,y),rx=r*unit()*Math.SQRT2;ctx.moveTo(q.x+rx,q.y);ctx.ellipse(q.x,q.y,rx,rx*.5,0,0,TAU);}
 function poly(points){points.forEach(([x,y],i)=>{const q=P(x,y);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.closePath();}
 // World-space outline of a footprint, optionally scaled about its anchor.
 function footprint(g,scale=1){if(!g)return;const s=g.shape,ox=Number.isFinite(g.originX)?g.originX:g.x,oy=Number.isFinite(g.originY)?g.originY:g.y,r=(g.radius||.5)*scale,a=g.angle||0;
  if(s==='circle'||s==='donut'||s==='safe'||!s){ellipse(g.x,g.y,r);return;}
  if(s==='arc'||s==='cone'){const w=clamp(g.width||.8,.05,Math.PI),pts=[[ox,oy]];for(let i=0;i<=14;i++){const t=a-w+2*w*i/14;pts.push([ox+Math.cos(t)*r,oy+Math.sin(t)*r]);}poly(pts);return;}
  if(s==='capsule'||s==='line'){const w=Math.max(.08,(g.width||.3)*(s==='capsule'?1:1)*scale),nx=-Math.sin(a)*w,ny=Math.cos(a)*w,ex=ox+Math.cos(a)*r,ey=oy+Math.sin(a)*r,pts=[];
   for(let i=0;i<=6;i++){const t=a+Math.PI/2+Math.PI*i/6;pts.push([ox+Math.cos(t)*w,oy+Math.sin(t)*w]);}
   for(let i=0;i<=6;i++){const t=a-Math.PI/2+Math.PI*i/6;pts.push([ex+Math.cos(t)*w,ey+Math.sin(t)*w]);}
   poly(pts);void nx;void ny;return;}
  if(s==='cross'){const w=Math.max(.1,(g.width||.4)*scale);for(const t of[a,a+Math.PI/2]){const dx=Math.cos(t)*r,dy=Math.sin(t)*r,nx=-Math.sin(t)*w,ny=Math.cos(t)*w;poly([[g.x-dx+nx,g.y-dy+ny],[g.x+dx+nx,g.y+dy+ny],[g.x+dx-nx,g.y+dy-ny],[g.x-dx-nx,g.y-dy-ny]]);}return;}
  ellipse(g.x,g.y,r);}
 function centre(g){if(!g)return null;const s=g.shape;if(s==='arc'||s==='cone'||s==='capsule'||s==='line'){const ox=Number.isFinite(g.originX)?g.originX:g.x,oy=Number.isFinite(g.originY)?g.originY:g.y,r=(g.radius||.5)*.55,a=g.angle||0;return{x:ox+Math.cos(a)*r,y:oy+Math.sin(a)*r};}return{x:g.x,y:g.y};}
 function extent(g){if(!g)return .6;return Math.max(.3,(g.radius||.5)*(g.shape==='circle'?1:.7));}

 // ---- effect store --------------------------------------------------------
 const list=[],MAX=56;
 function add(e){if(list.length>=MAX)list.shift();e.id='r98:'+(++serial);e.at=time;list.push(e);return e;}
 const age=e=>time-e.at;
 function scope(owner,fn){if(typeof ctx?.scope==='function')return ctx.scope(owner,fn);return fn();}
 const groundOwner=(e,x,y)=>({id:e.id+':g',kind:'hazard',x,y,groundAligned:true,r98:true});
 const airOwner=(e,x,y)=>({id:e.id+':a',kind:'effect',x,y,r98:true});
 const budget=()=>lowFx()?.45:1;

 // ---- drawing: ground layer -------------------------------------------------
 function drawCharge(e,t){const th=e.th,k=clamp(t,0,1),r=e.radius*1.7*(.7+.3*k);
  // a dim pool that deepens under the caster as the swing is about to land
  ctx.globalCompositeOperation='lighter';ctx.fillStyle=rgba(th.c,.05+.16*k*k);ctx.beginPath();ellipse(e.x,e.y,r*1.2);ctx.fill();
  ctx.fillStyle=rgba(th.a,.03+.1*k*k);ctx.beginPath();ellipse(e.x,e.y,r*.6);ctx.fill();}
 function drawImpact(e,t){const th=e.th,g=e.g,fade=1-clamp(t,0,1);
  // the struck ground darkens and fades: scorch, frost or slime in the family's tone
  ctx.globalCompositeOperation='lighter';ctx.fillStyle=rgba(th.a,.14*fade*fade);ctx.beginPath();footprint(g,1);ctx.fill();
  ctx.globalCompositeOperation='source-over';ctx.fillStyle=rgba(th.c,.2*fade);ctx.beginPath();footprint(g,.95);ctx.fill();}
 function drawGather(e,t){const th=e.th,g=e.g,k=clamp(t,0,1),pulse=.5+.5*Math.sin(time*5+e.seed);
  ctx.globalCompositeOperation='lighter';ctx.fillStyle=rgba(th.c,.05+.1*k+.03*pulse);ctx.beginPath();footprint(g,1.04);ctx.fill();
  ctx.fillStyle=rgba(th.a,.03+.12*k*k);ctx.beginPath();footprint(g,.5+.5*k);ctx.fill();}
 function drawBurst(e,t){const th=e.th,g=e.g,fade=1-clamp(t,0,1);
  ctx.globalCompositeOperation='lighter';ctx.fillStyle=rgba(th.b,.22*fade*fade);ctx.beginPath();footprint(g,1);ctx.fill();
  ctx.globalCompositeOperation='source-over';ctx.fillStyle=rgba(th.c,.26*fade);ctx.beginPath();footprint(g,.95);ctx.fill();}

 // Root bind: the soil under the hero darkens and cracks while the thorns hold.
 function drawRootStain(e,t){const k=e.releasedAt!=null?1-clamp((time-e.releasedAt)/.5,0,1):clamp(age(e)/.25,0,1);if(k<=0)return;
  const x=player.x,y=player.y;ctx.globalCompositeOperation='source-over';
  ctx.fillStyle='rgba(34,22,12,'+(.42*k).toFixed(3)+')';ctx.beginPath();ellipse(x,y,.95);ctx.fill();
  ctx.fillStyle='rgba(18,10,6,'+(.38*k).toFixed(3)+')';ctx.beginPath();ellipse(x,y,.55);ctx.fill();}

 // ---- drawing: air layer (billboards over the actors) ----------------------
 function disc(q,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(q.x+r,q.y-h);ctx.arc(q.x,q.y-h,r,0,TAU);ctx.fill();}
 // R8 P6 contact clips (fire, shock, splash): the 9 drawn phases in a 256 px
 // strip, played once over the impact and anchored at the contact point.
 const CONTACT={fire:{path:'assets/r99/fx/contact-fire.webp',ay:.56,blend:'lighter'},shock:{path:'assets/r99/fx/contact-shock.webp',ay:.56,blend:'lighter'},splash:{path:'assets/r99/fx/contact-splash.webp',ay:.84,blend:'source-over'}};
 const CONTACT_BY={ash:'fire',forge:'fire',domestic:'fire',neural:'shock',memory:'shock',clinical:'shock',swamp:'splash',coast:'splash'};
 const CONTACT_BY_SIG={red:'fire',orange:'fire',gold:'fire',cyan:'shock',blue:'shock',violet:'shock',teal:'splash',green:'splash',lime:'splash'};
 function contactFor(e){if(e.th?.sig)return CONTACT_BY_SIG[e.th.sig]||null;for(const[k,v]of Object.entries(THEMES))if(v===e.th)return CONTACT_BY[k]||null;return null;}
 // R100 signature strips: 12 frames of a recoloured painted effect in one row.
 // ay is the anchor height share; flat lays the frame on the ground.
 const sigPath=(kind,colour)=>'assets/r100/sig-'+kind+'-'+colour+'.webp';
 function sigStrip(kind,e,x,y,t,size,{alpha=1,ay=.5,lift=0,loop=false,angle=0,flat=false,blend='source-over',glow=0}={}){const th=e.th,spec=POL()?.sig?.[kind];if(!th?.sig||!spec||!(size>0)||!(alpha>0))return false;
  const path=sigPath(kind,th.sig),row=typeof readyImage==='function'?readyImage(path):null;if(!row?.image){if(typeof addImage==='function')try{addImage(path,'R100 signature effect');}catch(_){}return false;}
  const n=spec.frames,S=spec.size,i=loop?Math.floor(((time-e.at)*14+(e.seed||0)*3)%n+n)%n:Math.min(n-1,Math.floor(clamp(t,0,.999)*n)),q=P(x,y);
  ctx.save();try{ctx.translate(q.x,q.y-lift);if(flat)ctx.scale(1,.56);if(angle)ctx.rotate(angle);ctx.globalCompositeOperation=blend;ctx.globalAlpha*=alpha;ctx.drawImage(row.image,i*S,0,S,S,-size/2,-size*ay,size,size);
   if(glow>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=glow;ctx.drawImage(row.image,i*S,0,S,S,-size/2,-size*ay,size,size);}}finally{ctx.restore();}stats.signature=(stats.signature||0)+1;return true;}
 // screen angle of a world direction, for the slash crescent
 function screenAngle(a){const o=P(0,0),d=P(Math.cos(a),Math.sin(a));return Math.atan2(d.y-o.y,d.x-o.x);}
 function contact(kind,x,y,t,size,alpha=1){const c=CONTACT[kind];if(!c||!(size>0))return false;const row=typeof readyImage==='function'?readyImage(c.path):null;
  if(!row?.image){if(typeof addImage==='function')try{addImage(c.path);}catch(_){}return false;}
  const i=Math.min(8,Math.floor(clamp(t,0,.999)*9)),q=P(x,y);ctx.save();try{ctx.globalCompositeOperation=c.blend;ctx.globalAlpha*=alpha;ctx.drawImage(row.image,i*256,0,256,256,q.x-size/2,q.y-size*c.ay,size,size);}finally{ctx.restore();}stats.contacts++;return true;}
 function glow(x,y,h,r,th,a){const q=P(x,y);disc(q,h,r,rgba(th.a,.18*a));disc(q,h,r*.45,rgba(th.b,.22*a));}
 function drawChargeAir(e,t){const k=clamp(t,0,1),M=e.major,p=paintFor(e);
  if(sigStrip('aura',e,e.x,e.y,k,actorHeight()*(M?2.3:1.55),{loop:true,alpha:.3+.65*k,ay:.66,glow:.35*k}))return;
  if(!paint(p.aura,e.x,e.y,{loop:true,key:e,scale:M?1.8:1.15,alpha:.25+.7*k}))glow(e.x,e.y,actorHeight()*.5,(14+16*k)*zoom*(M?1.5:1),e.th,.4+.6*k);}
 function drawImpactAir(e,t){const c=centre(e.g),E=extent(e.g),M=e.major,p=paintFor(e),k=clamp(t,0,1);
  const scale=clamp(1.3+E*.6,1.4,M?3.2:2.2)*(e.heavy?1.15:1),s=e.g?.shape,slash=s==='arc'||s==='cone'||s==='capsule'||s==='line';
  const sig=slash?sigStrip('slash',e,c.x,c.y,k,actorHeight()*scale*.95,{lift:actorHeight()*.38,angle:screenAngle(e.g.angle||0)+Math.PI,glow:.4*(1-k)}):sigStrip('hit',e,c.x,c.y,k,actorHeight()*scale*.9,{lift:actorHeight()*.3,glow:.45*(1-k)});
  if(!sig&&!paint(p.hit,c.x,c.y,{t:k,key:e,scale,alpha:1}))glow(c.x,c.y,actorHeight()*.3,(24+40*k)*zoom,e.th,1-k);
  const ck=contactFor(e);if(ck)contact(ck,c.x,c.y,k,actorHeight()*scale*.85,.9);}
 function drawCastAir(e,t){const k=clamp(t,0,1),M=e.major,p=paintFor(e);
  if(sigStrip('aura',e,e.x,e.y,k,actorHeight()*(M?2.1:1.4),{loop:true,alpha:.4+.55*k,ay:.66,glow:.4*k}))return;
  if(!paint(p.aura,e.x,e.y,{loop:true,key:e,scale:M?1.6:1,alpha:.35+.6*k}))glow(e.x,e.y,actorHeight()*.62,(11+12*k)*zoom*(M?1.6:1.1),e.th,.5+.5*k);}
 function drawReleaseAir(e,t){const k=clamp(t,0,1),p=paintFor(e);
  if(sigStrip('hit',e,e.x,e.y,k,actorHeight()*(e.major?1.6:1.1),{lift:actorHeight()*.55,alpha:.95,glow:.5*(1-k)}))return;
  if(!paint(p.hit,e.x,e.y,{t:k,key:e,scale:e.major?1.5:1,alpha:.9}))glow(e.x,e.y,actorHeight()*.62,(16+30*k)*zoom,e.th,1-k);}
 function drawGatherAir(e,t){const c=centre(e.g),R=extent(e.g),k=clamp(t,0,1),p=paintFor(e);
  if(sigStrip('gather',e,c.x,c.y,k,actorHeight()*clamp(1+R*.6,1.2,e.major?3.4:2.4)*1.1,{loop:true,flat:true,alpha:.35+.6*k,glow:.3*k}))return;
  paint(p.gather,c.x,c.y,{loop:true,key:e,scale:clamp(1+R*.6,1.2,e.major?3.4:2.4),alpha:.3+.6*k});}
 function drawBurstAir(e,t){const c=centre(e.g),R=extent(e.g),M=e.major,p=paintFor(e),k=clamp(t,0,1);
  const scale=clamp(1.6+R*.7,1.8,M?3.6:2.6);
  const a=sigStrip('hit',e,c.x,c.y,k,actorHeight()*scale,{lift:actorHeight()*.25,glow:.55*(1-k)})||paint(p.hit,c.x,c.y,{t:k,key:e,scale,alpha:1});
  if(M&&p.burst)paint(p.burst,c.x,c.y,{t:k,key:e,scale:scale*.9,alpha:.85,lift:1});
  if(!a)glow(c.x,c.y,actorHeight()*.3,(30+60*k)*zoom,e.th,1-k);
  const ck=contactFor(e);if(ck)contact(ck,c.x,c.y,k,actorHeight()*scale,1);}
 function drawSparkAir(e,t){const k=clamp(t,0,1);if(!paint(PAINT.hero.hit,e.x,e.y,{t:k,key:e,scale:.95,alpha:.95}))glow(e.x,e.y,actorHeight()*.5,(10+16*k)*zoom,e.th,1-k);}

 function drawRootInAir(e,t){paint('F091',player.x,player.y,{t:clamp(t,0,1),key:e,scale:1.25,alpha:.9});}
 function drawRootOutAir(e,t){paint('F110',e.x,e.y,{t:clamp(t,0,1),key:e,scale:1.35,alpha:1});}

 const GROUND={charge:drawCharge,impact:drawImpact,gather:drawGather,burst:drawBurst,rootStain:drawRootStain};
 const AIR={charge:drawChargeAir,impact:drawImpactAir,cast:drawCastAir,release:drawReleaseAir,gather:drawGatherAir,burst:drawBurstAir,spark:drawSparkAir,rootIn:drawRootInAir,rootOut:drawRootOutAir};
 function progress(e){if(e.until===Infinity)return 0;return e.until!=null?clamp((time-e.at)/Math.max(.05,e.until-e.at),0,1):age(e)/e.life;}
 function drawLayer(table,counter){if(!prefs.effects||!list.length||typeof ctx==='undefined'||!ctx)return;
  for(const e of list){const fn=table[e.kind];if(!fn)continue;const t=progress(e);if(t<0||t>1)continue;const o=table===GROUND?groundOwner(e,e.x,e.y):airOwner(e,e.x,e.y);
   ctx.save();try{scope(o,()=>fn(e,t));stats[counter]++;}catch(err){fail(err);}finally{ctx.restore();}}}

 // ---- hooks: drawing ----------------------------------------------------------
 const SENTINEL={type:'r98-air',x:0,y:0,age:0,life:Infinity,r98Sentinel:true};
 const groundBase=groundImage;groundImage=function(...args){const result=groundBase.apply(this,args);try{drawLayer(GROUND,'groundDraws');}catch(err){fail(err);}return result;};
 const effectBase=drawEffect;drawEffect=function(e){if(e&&e.type==='r98-air'){try{drawLayer(AIR,'airDraws');}catch(err){fail(err);}return;}return effectBase.apply(this,arguments);};

 // Range previews: footprint outlines (plus the R39 ticks and R88 decals they
 // call) and the warning-stage melee decal. They are still drawn and recorded
 // exactly as before, under an owner tagged r98Telegraph, and the Three
 // renderer drops tagged commands before they reach the screen. Recording them
 // keeps every native hook (R39/R88/boss colours) and its regression checks
 // running; only the pixels go. The legacy 2D path has no filter, so there the
 // call is skipped instead.
 const hide=()=>!prefs.telegraph&&solo();
 function tagged(fn){if(typeof ctx?.scope!=='function')return;stats.suppressed++;return ctx.scope({...(ctx.owner||{id:'scene',kind:'scene'}),r98Telegraph:true},fn);}
 if(typeof strokeFootprint154==='function'){const sb=strokeFootprint154;strokeFootprint154=function(g,stage,color){if(hide()&&!ctx?.owner?.r98Telegraph)return tagged(()=>sb.apply(this,arguments));return sb.apply(this,arguments);};}
 if(typeof drawMeleeWarning154==='function'){const wb=drawMeleeWarning154;drawMeleeWarning154=function(e){if(hide()&&e?.attack?.footprint154){const a=e.attack,warning=(a.castWindup150??a.shape154?.windup??0);if(a.elapsed<warning)return tagged(()=>wb.apply(this,arguments));}return wb.apply(this,arguments);};}
 const R=window.StoryPhase1?.ThreeRenderer?.prototype;
 if(R&&typeof R.render==='function'&&!R.__r98TelegraphFilter){const rb=R.render;R.render=function(frame){try{if(hide()&&Array.isArray(frame?.commands)){let w=0;const cs=frame.commands;for(let i=0;i<cs.length;i++){const c=cs[i];if(c?.owner?.r98Telegraph){stats.dropped++;continue;}cs[w++]=c;}cs.length=w;}}catch(err){fail(err);}return rb.call(this,frame);};R.__r98TelegraphFilter=true;}

 // ---- hooks: lifecycle ----------------------------------------------------------
 let rootStain=null;const seenAttack=new WeakSet(),struck=new WeakSet(),casting=new WeakMap(),seenHazard=new WeakSet();
 const major=e=>!!(e?.boss||e?.midboss||e?.persona);
 function hazardGeometry(h){try{if(h.storyPattern5)return window.__STORYWORLD_FOOTPRINT154__?.lock?.(h)||null;if(h.type==='beam')return{shape:'capsule',x:h.x,y:h.y,originX:h.x,originY:h.y,angle:h.angle||0,radius:Math.min(12,h.reach||6),width:Math.max(.25,h.width||.35)};if(h.type==='field')return{shape:'circle',x:h.x,y:h.y,radius:h.radius||1};}catch(_){}return null;}
 function observe(dt){
  if(!prefs.effects||!solo()||typeof room==='undefined'||!room||typeof player==='undefined'||!player)return;
  for(const e of room.enemies||[]){if(!(e.hp>0)||e.spawnState!=='active')continue;const th=themeFor(e),M=major(e);
   const a=e.attack;
   if(a&&a.footprint154){if(!seenAttack.has(a)){seenAttack.add(a);const windup=Math.max(.12,a.castWindup150??a.shape154?.windup??.5);add({kind:'charge',x:e.x,y:e.y,follow:e,attack:a,until:time+windup,th,radius:(M?1.0:.55)*(e.defScale||1),major:M,seed:hash(e.id)%628/100});stats.charges++;}
    if(a.committed&&!struck.has(a)){struck.add(a);const s=a.shape154||e.combatProfile?.attackShape||{};add({kind:'impact',g:a.footprint154,x:a.footprint154.x,y:a.footprint154.y,life:.62,th,heavy:s.shape==='circle'||e.weapon==='heavy'||e.weapon==='caster',major:M,seed:hash(a.id||e.id)%628/100});stats.impacts++;}}
   if(e.rangedWindup>0){if(!casting.has(e)){casting.set(e,add({kind:'cast',x:e.x,y:e.y,follow:e,until:time+e.rangedWindup,th,major:M,seed:hash(e.id)%628/100}));stats.casts++;}}
   else if(casting.has(e)){casting.delete(e);add({kind:'release',x:e.x,y:e.y,life:.4,th,major:M});stats.releases++;}
  }
  for(const h of(typeof hazards!=='undefined'?hazards:[])||[]){if(!h||seenHazard.has(h))continue;seenHazard.add(h);
   const g=hazardGeometry(h);if(!g)continue;const owner=room.enemies.find(e=>e.id===h.owner),th=themeFor(owner),M=!owner||major(owner);
   const until=h.row150?.releaseAt??(time+Math.max(.1,(h.warning||0)-(h.age||0)));
   add({kind:'gather',g,h,x:g.x,y:g.y,until,th,major:M,seed:hash(h.id||serial)%628/100});stats.gathers++;
  }
  // root bind (R96 split thorn overlay): thorns burst out of the ground on
  // admission, the soil stays stained, and the roots snap apart on release.
  const rooted=!!window.__STORYWORLD_STATUS_R96__?.inspect().active.some(r=>r.kind==='root'&&r.releaseAt==null)||!!POL()?.rooted?.();
  if(rooted&&!rootStain){rootStain=add({kind:'rootStain',x:player.x,y:player.y,until:Infinity});add({kind:'rootIn',x:player.x,y:player.y,life:.55});stats.roots++;}
  else if(!rooted&&rootStain){if(rootStain.releasedAt==null){rootStain.releasedAt=time;rootStain.until=time+.5;add({kind:'rootOut',x:player.x,y:player.y,life:.9});}if(time>rootStain.until)rootStain=null;}
  // follow casters; fire the eruption when a gathering hazard releases
  for(let i=list.length-1;i>=0;i--){const e=list[i];
   if(e.follow){e.x=e.follow.x;e.y=e.follow.y;if(e.kind==='charge'&&e.follow.attack!==e.attack)e.until=Math.min(e.until,time);if(e.kind==='cast'&&!(e.follow.rangedWindup>0))e.until=Math.min(e.until,time);}
   if(e.kind==='gather'){const h=e.h,alive=hazards.includes(h),released=h.row150?time>=h.row150.releaseAt||h.row150.stage==='cancel':h.age>=h.warning;
    if(!alive||released){list.splice(i,1);if(alive&&!(h.row150?.stage==='cancel'))add({kind:'burst',g:e.g,x:e.g.x,y:e.g.y,life:e.major?.9:.7,th:e.th,major:e.major,seed:e.seed}),stats.bursts++;continue;}}
   const done=e.until!=null?time>e.until+.02:age(e)>e.life;if(done)list.splice(i,1);
  }
  if(!effects.includes(SENTINEL)){SENTINEL.age=0;effects.push(SENTINEL);}
 }
 let preloadRoom=null;
 const tickBase=tick;tick=function(dt){const result=tickBase.call(this,dt);try{if(typeof started!=='undefined'&&started&&!modal&&!loading){if(preloadRoom!==room&&room?.enemies?.length){preloadRoom=room;preloadSig();}observe(dt);}}catch(err){fail(err);}return result;};
 // Region changes clear native effects; drop ours too so nothing is drawn in the next room.
 if(typeof enterRegion==='function'){const eb=enterRegion;enterRegion=async function(...args){const r=await eb.apply(this,args);list.length=0;rootStain=null;try{preload();}catch(err){fail(err);}return r;};}
 if(typeof stopEffects==='function'){const sb=stopEffects;stopEffects=function(...args){list.length=0;rootStain=null;return sb.apply(this,args);};}
 // Player hits: a small spark burst in the hero's tone on the struck enemy.
 if(typeof hitEnemy==='function'){const hb=hitEnemy;hitEnemy=function(e,value,source,...rest){const before=e?.hp,result=hb.call(this,e,value,source,...rest);try{if(prefs.effects&&solo()&&e&&Number.isFinite(before)&&e.hp<before&&typeof time==='number'&&!list.some(q=>q.kind==='spark'&&q.target===e&&age(q)<.09)){add({kind:'spark',x:e.x,y:e.y,target:e,life:.34,th:THEMES.hero,n:9});stats.sparks++;}}catch(err){fail(err);}return result;};}

 function settingsSection(){const host=document.getElementById('retroSettingsR98Combat')||document.getElementById('retroSettingsR93')||document.getElementById('retroSettingsR89');if(!host||document.getElementById('retroSettingsR98Vfx'))return;
  const s=document.createElement('section');s.id='retroSettingsR98Vfx';s.innerHTML='<h3>적 스킬 연출 (R98)</h3><p class="small muted">공격 시점·범위·피해는 그대로이고 보이는 연출만 바뀝니다. 설정은 저장 슬롯과 별도로 보관됩니다.</p>'+Object.keys(DEFAULTS).map(k=>'<label><input type="checkbox" id="r98v-'+k+'"> '+LABELS[k]+'</label> ').join('');
  host.parentNode.insertBefore(s,host.nextSibling);for(const k of Object.keys(DEFAULTS)){const el=s.querySelector('#r98v-'+k);el.checked=prefs[k];el.onchange=()=>set({[k]:el.checked});}}
 if(typeof showSettings==='function'){const sb=showSettings;showSettings=function(...args){const result=sb.apply(this,args);try{settingsSection();}catch(e){fail(e);}return result;};}

 window.__STORYWORLD_VFX_R98__=Object.freeze({prefs:()=>({...prefs}),set,themes:THEMES,active:()=>list.map(e=>({kind:e.kind,x:e.x,y:e.y,t:progress(e)})),inspect:()=>({revision:'R99-painted-enemy-skill-presentation',prefs:{...prefs},stats:{...stats},painted:{...paintStats},active:list.length,lastError,attackTimingChanged:false,footprintsChanged:false,damageChanged:false,savesTouched:false})});
})();
