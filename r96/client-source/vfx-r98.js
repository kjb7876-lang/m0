/* R98 enemy skill presentation. The geometric range previews (footprint
 * outlines, direction ticks, the faint pre-hit slash decal) are hidden by
 * default and replaced by procedural effects drawn in code: a charge aura on
 * the caster while it winds up, an impact burst over the real attack footprint
 * when the hit lands, a cast glow and release flash for ranged casts, and a
 * gather/eruption pair for boss patterns and hazards. Colours follow the
 * region family; bosses, midbosses and the persona carry their own palette.
 * Presentation only: attack timing, footprints, hit tests, damage and saves
 * are read, never written. Canonical source; copied by scripts/apply-r98.cjs. */
(()=>{'use strict';
 if(window.__STORYWORLD_VFX_R98__||typeof drawEffect!=='function'||typeof fx!=='function'||typeof tick!=='function'||typeof project!=='function'||typeof groundImage!=='function')return;
 const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r98.vfx';
 const DEFAULTS=Object.freeze({telegraph:false,effects:true}),LABELS={telegraph:'적 공격 범위 미리보기(선)',effects:'적 스킬 이펙트 (R98)'};
 let prefs={...DEFAULTS},lastError=null,serial=0;
 const stats={charges:0,impacts:0,casts:0,releases:0,gathers:0,bursts:0,sparks:0,groundDraws:0,airDraws:0,suppressed:0,dropped:0,errors:0};
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
 function themeFor(e){if(e?.persona)return THEMES.persona;if(e?.boss||e?.midboss)return THEMES.boss;return THEMES[family()]||THEMES.regional;}

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
 // Sizes are deliberately generous: the floor glyphs read from the default
 // camera and the air flashes cover the actor, in the Dark Eden / Lineage way.
 function ringAt(x,y,r,color,width){ctx.strokeStyle=color;ctx.lineWidth=Math.max(1,width*zoom);ctx.beginPath();ellipse(x,y,r);ctx.stroke();}
 function star(x,y,r,n,step,rot,color,width){ctx.strokeStyle=color;ctx.lineWidth=Math.max(1,width*zoom);ctx.beginPath();for(let i=0;i<=n;i++){const a=rot+((i*step)%n)*TAU/n,q=P(x+Math.cos(a)*r,y+Math.sin(a)*r);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);}ctx.stroke();}
 function rays(x,y,r0,r1,n,rot,color,width,seed){ctx.strokeStyle=color;ctx.lineWidth=Math.max(1,width*zoom);for(let i=0;i<n;i++){const a=rot+i*TAU/n,len=r1*(.7+.3*rnd(seed,i)),p0=P(x+Math.cos(a)*r0,y+Math.sin(a)*r0),p1=P(x+Math.cos(a)*len,y+Math.sin(a)*len);ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);ctx.stroke();}}
 function drawCharge(e,t){const th=e.th,k=clamp(t,0,1),x=e.x,y=e.y,r=e.radius*1.7*(.7+.3*k),M=e.major;
  ctx.globalCompositeOperation='lighter';
  // pool that brightens as the swing is about to land
  ctx.fillStyle=rgba(th.c,.16+.34*k*k);ctx.beginPath();ellipse(x,y,r*1.25);ctx.fill();
  ctx.fillStyle=rgba(th.a,.06+.22*k*k);ctx.beginPath();ellipse(x,y,r*.7);ctx.fill();
  // double rune ring turning against each other, a star glyph between them
  const spin=time*(M?1.1:1.8)+e.seed;
  ringAt(x,y,r,rgba(th.a,.45+.5*k),1.8+2.2*k);ringAt(x,y,r*.78,rgba(th.b,.3+.4*k),1.1);
  star(x,y,r*.78,M?7:5,M?3:2,-spin*1.3,rgba(th.b,.28+.5*k),1.1+.9*k);
  const n=M?12:8;ctx.strokeStyle=rgba(th.b,.4+.5*k);ctx.lineWidth=Math.max(1,1.5*zoom);
  for(let i=0;i<n;i++){const a=spin+i*TAU/n,p0=P(x+Math.cos(a)*r*.9,y+Math.sin(a)*r*.9),p1=P(x+Math.cos(a)*r*1.18,y+Math.sin(a)*r*1.18);ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);ctx.stroke();}
  if(M){ringAt(x,y,r*1.6*(1-.3*k),rgba(th.a,.22+.4*k),1.2);rays(x,y,r*1.05,r*1.5,6,-spin*.7,rgba(th.a,.2+.3*k),1,e.id);}
 }
 function drawImpact(e,t){const th=e.th,g=e.g,k=clamp(t,0,1),fade=1-k,c=centre(g),E=extent(g);
  ctx.globalCompositeOperation='lighter';
  // the real footprint flashes once, then shockwaves run out past it
  ctx.fillStyle=rgba(th.b,.6*fade*fade);ctx.beginPath();footprint(g,1);ctx.fill();
  ctx.fillStyle=rgba(th.a,.34*fade);ctx.beginPath();footprint(g,1+.3*k);ctx.fill();
  for(const[m,w,d]of[[1,3.2,0],[.7,1.8,.12],[.45,1.2,.26]]){const kk=clamp((k-d)/(1-d),0,1);if(k<d)continue;ringAt(c.x,c.y,E*(.5+2.2*kk),rgba(th.a,.7*m*(1-kk)),w*(1-kk*.5));}
  rays(c.x,c.y,E*.2,E*(1.2+1.4*Math.min(1,k*2.5)),e.heavy?11:7,e.seed,rgba(e.heavy?th.c:th.b,(e.heavy?.6:.4)*fade),e.heavy?1.6:1.1,e.id);
  if(e.major){star(c.x,c.y,E*(.9+1.4*k),7,3,e.seed+k*2,rgba(th.b,.5*fade),1.4);}
  // lingering scorch / frost / slime stain, in the family's dark tone
  ctx.globalCompositeOperation='source-over';ctx.fillStyle=rgba(th.c,.22*fade);ctx.beginPath();footprint(g,.95);ctx.fill();
 }
 function drawGather(e,t){const th=e.th,g=e.g,k=clamp(t,0,1),c=centre(g),R=extent(g),M=e.major;
  ctx.globalCompositeOperation='lighter';
  // gathering glow: breathes and tightens, a spiral drawing inward, no hard outline
  const pulse=.5+.5*Math.sin(time*7+e.seed);
  ctx.fillStyle=rgba(th.c,.08+.12*k+.05*pulse);ctx.beginPath();footprint(g,1.06);ctx.fill();
  ctx.fillStyle=rgba(th.a,.06+.22*k*k);ctx.beginPath();footprint(g,.55+.45*k);ctx.fill();
  ctx.strokeStyle=rgba(th.b,.25+.45*k);ctx.lineWidth=Math.max(1,(1+1.4*k)*zoom);const arms=M?3:2;
  for(let j=0;j<arms;j++){ctx.beginPath();for(let i=0;i<=22;i++){const u=i/22,a=e.seed+j*TAU/arms-time*2.2+u*TAU*1.1,d=R*(1.6-1.4*u)*(1-.5*k),q=P(c.x+Math.cos(a)*d,c.y+Math.sin(a)*d);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);}ctx.stroke();}
  const n=M?14:8;ctx.fillStyle=rgba(th.b,.65);
  for(let i=0;i<n;i++){const a=rnd(e.id,i)*TAU+time*.6,d=R*(1.5-k*1.2)*(.5+.5*rnd(e.id,i+40)),q=P(c.x+Math.cos(a)*d,c.y+Math.sin(a)*d),s=Math.max(1,(1.2+1.4*rnd(e.id,i+80))*zoom);ctx.beginPath();ctx.moveTo(q.x+s,q.y);ctx.arc(q.x,q.y,s,0,TAU);ctx.fill();}
 }
 function drawBurst(e,t){const th=e.th,g=e.g,k=clamp(t,0,1),fade=1-k,c=centre(g),R=extent(g);
  ctx.globalCompositeOperation='lighter';
  ctx.fillStyle=rgba(th.b,.75*fade*fade);ctx.beginPath();footprint(g,1);ctx.fill();
  ctx.fillStyle=rgba(th.a,.4*fade);ctx.beginPath();footprint(g,1+.35*k);ctx.fill();
  for(const[m,w,d]of[[1,3.6,0],[.75,2.2,.1],[.5,1.4,.22]]){if(k<d)continue;const kk=(k-d)/(1-d);ringAt(c.x,c.y,R*(.4+2.6*kk*m),rgba(th.a,.75*m*(1-kk)),w*(1-kk*.5));}
  rays(c.x,c.y,R*.25,R*(1.4+1.8*Math.min(1,k*2)),e.major?14:9,e.seed+k*.6,rgba(th.b,.65*fade),e.major?2:1.4,e.id);
  if(e.major)star(c.x,c.y,R*(1+1.6*k),8,3,e.seed-k*1.5,rgba(th.a,.55*fade),1.6);
  ctx.globalCompositeOperation='source-over';ctx.fillStyle=rgba(th.c,.3*fade);ctx.beginPath();footprint(g,.95);ctx.fill();
 }

 // ---- drawing: air layer (billboards over the actors) ----------------------
 function disc(q,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(q.x+r,q.y-h);ctx.arc(q.x,q.y-h,r,0,TAU);ctx.fill();}
 // A column of light rising from the ground: stacked flat ellipses fading up (no gradients in the recorder).
 function pillar(x,y,width,height,color,alpha){const q=P(x,y),n=lowFx()?6:11;for(let i=0;i<n;i++){const u=i/(n-1),w=width*(1-.35*u),a=alpha*(1-u)*(1-u);ctx.fillStyle=rgba(color,a);ctx.beginPath();ctx.ellipse(q.x,q.y-height*u,w,Math.max(1,w*.42),0,0,TAU);ctx.fill();}}
 function motes(x,y,th,n,k,seed,up=true){ctx.fillStyle=rgba(th.b,.85);for(let i=0;i<n;i++){const a=rnd(seed,i)*TAU,d=.5+.8*rnd(seed,i+20),ph=(k*1.6+rnd(seed,i+60))%1,q=P(x+Math.cos(a)*d*(1-ph*.7),y+Math.sin(a)*d*(1-ph*.7)),h=actorHeight()*(up?ph*.95:(1-ph)*.95),s=Math.max(1,(1+1.6*(1-ph))*zoom);ctx.beginPath();ctx.moveTo(q.x+s,q.y-h);ctx.arc(q.x,q.y-h,s,0,TAU);ctx.fill();}}
 function drawChargeAir(e,t){const k=clamp(t,0,1),M=e.major;ctx.globalCompositeOperation='lighter';motes(e.x,e.y,e.th,Math.round((M?16:9)*budget()),k,e.id,true);
  // a glow at chest height that saturates just before release
  const q=P(e.x,e.y),h=actorHeight()*.55,r=(14+22*k)*zoom*(M?1.6:1);disc(q,h,r,rgba(e.th.a,.14+.34*k*k));disc(q,h,r*.4,rgba(e.th.b,.1+.4*k*k));
  if(M&&k>.5)pillar(e.x,e.y,r*1.1,actorHeight()*1.5,e.th.a,.22*(k-.5)*2);}
 function sparks(x,y,th,n,k,seed,speed,lift,grav){ctx.strokeStyle=rgba(th.b,.95*(1-k));ctx.lineWidth=Math.max(1,1.8*zoom);ctx.lineCap='round';
  for(let i=0;i<n;i++){const a=rnd(seed,i)*TAU,sp=speed*(.5+rnd(seed,i+30)),vy=lift*(.4+rnd(seed,i+70)),t0=Math.max(0,k-.1),f=tt=>({x:x+Math.cos(a)*sp*tt,y:y+Math.sin(a)*sp*tt,h:actorHeight()*(vy*tt-grav*tt*tt)}),p0=f(t0),p1=f(k),a0=P(p0.x,p0.y),a1=P(p1.x,p1.y);ctx.beginPath();ctx.moveTo(a0.x,a0.y-p0.h);ctx.lineTo(a1.x,a1.y-p1.h);ctx.stroke();}}
 function drawImpactAir(e,t){const k=clamp(t,0,1),c=centre(e.g),M=e.major;ctx.globalCompositeOperation='lighter';
  sparks(c.x,c.y,e.th,Math.round((e.heavy?22:15)*budget()),k,e.id,e.heavy?3.2:2.6,e.heavy?1.3:1,1.3);
  const q=P(c.x,c.y),r=(24+56*k)*zoom*(M?1.5:1);disc(q,actorHeight()*.25,r,rgba(e.th.b,.5*(1-k)*(1-k)));disc(q,actorHeight()*.25,r*.45,rgba(e.th.a,.4*(1-k)));
  if(e.heavy||M)pillar(c.x,c.y,r*.5,actorHeight()*(M?2.2:1.4),e.th.b,.45*(1-k));}
 function drawCastAir(e,t){const k=clamp(t,0,1),q=P(e.x,e.y),h=actorHeight()*.62,pulse=.5+.5*Math.sin(time*11+e.seed),M=e.major;ctx.globalCompositeOperation='lighter';
  const r=(11+14*k+4*pulse)*zoom*(M?1.7:1.15);disc(q,h,r,rgba(e.th.a,.3+.4*k));disc(q,h,r*.4,rgba(e.th.b,.6+.4*k));
  ctx.strokeStyle=rgba(e.th.a,.5);ctx.lineWidth=Math.max(1,1.4*zoom);const n=M?4:3;for(let i=0;i<n;i++){const ph=(k*2+i/n)%1,rr=r*(3-2.1*ph);ctx.globalAlpha*=1-ph;ctx.beginPath();ctx.ellipse(q.x,q.y-h,rr,rr*.55,0,0,TAU);ctx.stroke();ctx.globalAlpha/=1-ph||1;}
  // orbiting embers around the caster's hands
  ctx.fillStyle=rgba(e.th.b,.9);const m=M?6:4;for(let i=0;i<m;i++){const a=time*5+i*TAU/m+e.seed,rr=r*1.6,s=Math.max(1,(1.6+1.2*k)*zoom);ctx.beginPath();ctx.moveTo(q.x+Math.cos(a)*rr+s,q.y-h+Math.sin(a)*rr*.45);ctx.arc(q.x+Math.cos(a)*rr,q.y-h+Math.sin(a)*rr*.45,s,0,TAU);ctx.fill();}
  motes(e.x,e.y,e.th,Math.round((M?9:6)*budget()),k,e.id,false);}
 function drawReleaseAir(e,t){const k=clamp(t,0,1),q=P(e.x,e.y),h=actorHeight()*.62,M=e.major;ctx.globalCompositeOperation='lighter';
  const r=(16+56*k)*zoom*(M?1.5:1);ctx.strokeStyle=rgba(e.th.a,.8*(1-k));ctx.lineWidth=Math.max(1,(3.4-2.4*k)*zoom);ctx.beginPath();ctx.ellipse(q.x,q.y-h,r,r*.6,0,0,TAU);ctx.stroke();
  ctx.strokeStyle=rgba(e.th.b,.5*(1-k));ctx.lineWidth=Math.max(1,1.4*zoom);ctx.beginPath();ctx.ellipse(q.x,q.y-h,r*.65,r*.4,0,0,TAU);ctx.stroke();
  disc(q,h,r*.5,rgba(e.th.b,.6*(1-k)*(1-k)));}
 function drawBurstAir(e,t){const k=clamp(t,0,1),c=centre(e.g),M=e.major;ctx.globalCompositeOperation='lighter';
  sparks(c.x,c.y,e.th,Math.round((M?34:24)*budget()),k,e.id,3.6,1.8,1.4);
  // debris: slower, darker chunks that fall back down
  ctx.fillStyle=rgba(e.th.c,.85*(1-k));const n=Math.round(14*budget());for(let i=0;i<n;i++){const a=rnd(e.id,i+200)*TAU,sp=1.7*(.4+rnd(e.id,i+230)),vy=1*(.5+rnd(e.id,i+260)),q=P(c.x+Math.cos(a)*sp*k,c.y+Math.sin(a)*sp*k),h=actorHeight()*Math.max(0,vy*k-1.6*k*k),s=Math.max(1,(1.4+1.8*rnd(e.id,i+290))*zoom);ctx.beginPath();ctx.moveTo(q.x+s,q.y-h);ctx.arc(q.x,q.y-h,s,0,TAU);ctx.fill();}
  const q=P(c.x,c.y),r=(30+80*k)*zoom*(M?1.3:1);disc(q,actorHeight()*.3,r,rgba(e.th.b,.6*(1-k)*(1-k)));disc(q,actorHeight()*.3,r*.4,rgba(e.th.a,.5*(1-k)));
  pillar(c.x,c.y,r*.45,actorHeight()*(M?2.6:1.8),e.th.b,.55*(1-k));}
 function drawSparkAir(e,t){const k=clamp(t,0,1);ctx.globalCompositeOperation='lighter';sparks(e.x,e.y,e.th,Math.round(e.n*budget()),k,e.id,2,1,1.5);}

 const GROUND={charge:drawCharge,impact:drawImpact,gather:drawGather,burst:drawBurst};
 const AIR={charge:drawChargeAir,impact:drawImpactAir,cast:drawCastAir,release:drawReleaseAir,burst:drawBurstAir,spark:drawSparkAir};
 function progress(e){return e.until!=null?clamp((time-e.at)/Math.max(.05,e.until-e.at),0,1):age(e)/e.life;}
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
 const seenAttack=new WeakSet(),struck=new WeakSet(),casting=new WeakMap(),seenHazard=new WeakSet();
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
  // follow casters; fire the eruption when a gathering hazard releases
  for(let i=list.length-1;i>=0;i--){const e=list[i];
   if(e.follow){e.x=e.follow.x;e.y=e.follow.y;if(e.kind==='charge'&&e.follow.attack!==e.attack)e.until=Math.min(e.until,time);if(e.kind==='cast'&&!(e.follow.rangedWindup>0))e.until=Math.min(e.until,time);}
   if(e.kind==='gather'){const h=e.h,alive=hazards.includes(h),released=h.row150?time>=h.row150.releaseAt||h.row150.stage==='cancel':h.age>=h.warning;
    if(!alive||released){list.splice(i,1);if(alive&&!(h.row150?.stage==='cancel'))add({kind:'burst',g:e.g,x:e.g.x,y:e.g.y,life:e.major?.9:.7,th:e.th,major:e.major,seed:e.seed}),stats.bursts++;continue;}}
   const done=e.until!=null?time>e.until+.02:age(e)>e.life;if(done)list.splice(i,1);
  }
  if(!effects.includes(SENTINEL)){SENTINEL.age=0;effects.push(SENTINEL);}
 }
 const tickBase=tick;tick=function(dt){const result=tickBase.call(this,dt);try{if(typeof started!=='undefined'&&started&&!modal&&!loading)observe(dt);}catch(err){fail(err);}return result;};
 // Region changes clear native effects; drop ours too so nothing is drawn in the next room.
 if(typeof enterRegion==='function'){const eb=enterRegion;enterRegion=async function(...args){const r=await eb.apply(this,args);list.length=0;return r;};}
 if(typeof stopEffects==='function'){const sb=stopEffects;stopEffects=function(...args){list.length=0;return sb.apply(this,args);};}
 // Player hits: a small spark burst in the hero's tone on the struck enemy.
 if(typeof hitEnemy==='function'){const hb=hitEnemy;hitEnemy=function(e,value,source,...rest){const before=e?.hp,result=hb.call(this,e,value,source,...rest);try{if(prefs.effects&&solo()&&e&&Number.isFinite(before)&&e.hp<before&&typeof time==='number'&&!list.some(q=>q.kind==='spark'&&q.target===e&&age(q)<.09)){add({kind:'spark',x:e.x,y:e.y,target:e,life:.34,th:THEMES.hero,n:9});stats.sparks++;}}catch(err){fail(err);}return result;};}

 function settingsSection(){const host=document.getElementById('retroSettingsR98Combat')||document.getElementById('retroSettingsR93')||document.getElementById('retroSettingsR89');if(!host||document.getElementById('retroSettingsR98Vfx'))return;
  const s=document.createElement('section');s.id='retroSettingsR98Vfx';s.innerHTML='<h3>적 스킬 연출 (R98)</h3><p class="small muted">공격 시점·범위·피해는 그대로이고 보이는 연출만 바뀝니다. 설정은 저장 슬롯과 별도로 보관됩니다.</p>'+Object.keys(DEFAULTS).map(k=>'<label><input type="checkbox" id="r98v-'+k+'"> '+LABELS[k]+'</label> ').join('');
  host.parentNode.insertBefore(s,host.nextSibling);for(const k of Object.keys(DEFAULTS)){const el=s.querySelector('#r98v-'+k);el.checked=prefs[k];el.onchange=()=>set({[k]:el.checked});}}
 if(typeof showSettings==='function'){const sb=showSettings;showSettings=function(...args){const result=sb.apply(this,args);try{settingsSection();}catch(e){fail(e);}return result;};}

 window.__STORYWORLD_VFX_R98__=Object.freeze({prefs:()=>({...prefs}),set,themes:THEMES,active:()=>list.map(e=>({kind:e.kind,x:e.x,y:e.y,t:progress(e)})),inspect:()=>({revision:'R98-enemy-skill-presentation',prefs:{...prefs},stats:{...stats},active:list.length,lastError,attackTimingChanged:false,footprintsChanged:false,damageChanged:false,savesTouched:false})});
})();
