/* R101 polish — hero signature auras, skill hit feel, mob motion,
   guide continuity and co-op start.
   Presentation only for combat: damage, timing, collision and saves are
   untouched. The guide additions only act while the guide is already on.
   R102: colours come from the R102 hero palette (primary + secondary), basic
   attacks stay plain (no hit burst, no tint, no chain heat), and the aura grows
   with the R102 growth tier (learned skills and passives). Skill art recolouring
   moved to hero-fx-r102.js. */
(() => {
'use strict';
if(window.__STORYWORLD_POLISH_R101__)return;
if(typeof drawHero!=='function'||typeof drawEnemy!=='function'||typeof project!=='function'||typeof draw!=='function'||typeof fx!=='function'||typeof drawEffect!=='function')return;
const finite=(v,d=0)=>Number.isFinite(v)?v:d,clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),TAU=Math.PI*2;
const lerp=(a,b,t)=>a+(b-a)*t,smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
function hash(s){let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
const rnd=(seed,i)=>{const x=Math.sin(seed*12.9898+i*78.233)*43758.5453;return x-Math.floor(x);};
let lastError=null;
const stats={auraDraws:0,hits:0,hurts:0,poses:0,dust:0,guideNav:0,guideActs:0,revives:0,relayRetries:0,picks:0,errors:0};
function fail(err){stats.errors++;lastError=String(err?.message||err);}

// ---- preferences -----------------------------------------------------------------
const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r101.polish';
const DEFAULTS=Object.freeze({aura:true,hitfx:true,motion:true,guide:true});
const LABELS={aura:'영웅 고유색 오라 (스킬·패시브를 배울수록 커지고, 각성 때 불꽃·날개)',hitfx:'스킬 타격감 (스킬 적중 불꽃·피격 경직 · 기본공격은 담백하게)',motion:'잡몹 걷기·비행·피격 움직임 (접힘 제거)',guide:'길잡이 자동 진행 (큰 맵 경로·사망 후 복귀·나침반 탭)'};
const prefs={...DEFAULTS};
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(DEFAULTS))if(typeof saved?.[k]==='boolean')prefs[k]=saved[k];}catch(_){}
function set(patch={}){for(const k of Object.keys(DEFAULTS))if(typeof patch[k]==='boolean')prefs[k]=patch[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
const lowFx=()=>!!(typeof settings!=='undefined'&&settings?.lowFx),reduced=()=>!!(typeof settings!=='undefined'&&settings?.reducedMotion);
const live=()=>typeof started!=='undefined'&&started&&typeof player!=='undefined'&&!!player&&typeof room!=='undefined'&&!!room;
const POL=()=>window.__STORYWORLD_POLISH_R100__;
const SIGDATA=()=>window.__STORYWORLD_POLISH_R100_DATA__;
function scope(owner,fn){if(typeof ctx?.scope==='function')return ctx.scope(owner,fn);return fn();}
const rgba=(c,a)=>'rgba('+c[0]+','+c[1]+','+c[2]+','+clamp(a,0,1).toFixed(3)+')';
const Z=()=>typeof zoom==='number'?zoom:1;
// screen angle of a world direction
function screenAngle(a){const o=project(0,0),d=project(Math.cos(a),Math.sin(a));return Math.atan2(d.y-o.y,d.x-o.x);}

// ---- hero palettes ---------------------------------------------------------------
// a: primary, b: secondary, sig: R100 signature strip colour, form: aura shape.
// The R102 table (hero-fx-r102.js) is the source; this copy is its fallback.
const SILVER=[226,232,242],GOLD=[255,198,72];
const HERO_FX={
 hwando:{a:[214,222,234],b:GOLD,sig:'pale',sig2:'gold',form:'blade'},
 seoha:{a:[120,206,255],b:SILVER,sig:'cyan',sig2:'pale',form:'orbs'},
 neon:{a:[52,236,176],b:SILVER,sig:'teal',sig2:'pale',form:'arcs'},
 michaela:{a:[255,122,178],b:SILVER,sig:'pink',sig2:'pale',form:'angel'},
 lauren:{a:[164,98,255],b:SILVER,sig:'violet',sig2:'pale',form:'runes'},
 hunter:{a:[255,96,40],b:SILVER,sig:'orange',sig2:'pale',form:'petals'},
 slayer:{a:[222,22,52],b:SILVER,sig:'red',sig2:'pale',form:'dark'},
 gunner:{a:[70,124,255],b:SILVER,sig:'blue',sig2:'pale',form:'shards'}
};
const R102=()=>window.__STORYWORLD_HERO_FX_R102__;
const fxOf=id=>R102()?.PALETTE?.[id]||HERO_FX[id]||R102()?.PALETTE?.hwando||HERO_FX.hwando;
const heroOf=p=>fxOf(p?.hero);
// Growth tier 0–4 from R102 (learned skills and passives; EGO +1, 사몽 4).
function tierOf(p){try{const t=R102()?.tier?.(p);return Number.isFinite(t)?clamp(Math.round(t),0,4):2;}catch(e){fail(e);return 2;}}

// ---- signature strips (R100 recoloured painted effects, 12 frames) ------------------
const sigPath=(kind,colour)=>'assets/r100/sig-'+kind+'-'+colour+'.webp';
function sig(kind,colour,x,y,t,size,{alpha=1,angle=0,glow=0,ay=.5,loop=false,seed=0,flat=false}={}){
 const spec=SIGDATA()?.sig?.[kind];if(!spec||!colour||!(size>0)||!(alpha>0)||typeof readyImage!=='function')return false;
 const path=sigPath(kind,colour),row=readyImage(path);if(!row?.image){if(typeof addImage==='function')try{addImage(path,'R101 hero effect');}catch(_){}return false;}
 const n=spec.frames,S=spec.size,i=loop?Math.floor(((time*14+seed*3)%n+n)%n):Math.min(n-1,Math.floor(clamp(t,0,.999)*n));
 ctx.save();try{ctx.translate(x,y);if(flat)ctx.scale(1,.56);if(angle)ctx.rotate(angle);if(colour==='pale')ctx.filter='grayscale(1) brightness(1.12)';ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=alpha;ctx.drawImage(row.image,i*S,0,S,S,-size/2,-size*ay,size,size);
  if(glow>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=glow;ctx.drawImage(row.image,i*S,0,S,S,-size/2,-size*ay,size,size);}}finally{ctx.restore();}
 return true;}
function preloadHero(id){if(typeof addImage!=='function')return;const F=fxOf(id);for(const[k,c]of[['hit',F.sig],['slash',F.sig],['aura',F.sig],['gather',F.sig],['slash',F.sig2]])if(c)try{addImage(sigPath(k,c),'R101 hero effect');}catch(_){}}

// ---- hero heat: how charged the aura looks ------------------------------------------
// Grows with the growth tier and while a skill plays; basic attacks add nothing.
const heroState=new WeakMap();
function stateOf(p){let s=heroState.get(p);if(!s){s={egoWas:false,samongWas:false,petals:[],hurtAt:-9,hurtDx:0};heroState.set(p,s);}return s;}
const HEAT_BASE=[.05,.1,.16,.22,.28];
function heat(p,t=tierOf(p)){let k=HEAT_BASE[t]??.16;if(p.skillAnim>0)k+=.12+.06*t;if(p.ego>0)k+=.38;if(p.samong>0)k+=.5;if(finite(p.resonance)>=30)k+=.06;return clamp(k,0,1.3);}

// ---- own effect store, drawn in the effect pass through a sentinel -----------------
const list=[],MAX=48;let serial=0;
function add(e){if(list.length>=MAX)list.shift();e.id='r101:'+(++serial);e.at=time;list.push(e);return e;}
const age=e=>time-e.at;
const SENTINEL={type:'r101-air',x:0,y:0,age:0,life:Infinity,r101Sentinel:true};
const fadeOut=(t,from=.62)=>t<from?1:Math.max(0,1-(t-from)/(1-from));

// ---- aura primitives -----------------------------------------------------------------
function disc(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();}
function groundGlow0(q,h,F,k){const r=h*(.4+.22*k);ctx.globalCompositeOperation='lighter';ctx.save();ctx.translate(q.x,q.y);ctx.scale(1,.5);
 disc(0,0,r,rgba(F.a,.05+.06*k));disc(0,0,r*.66,rgba(F.a,.06+.07*k));disc(0,0,r*.3,rgba(F.b,.07+.08*k));ctx.restore();}
// Flame silhouette behind the body: n tongues whose tips flicker. 'dark' (슬레이어)
// keeps a black-red outer sheet under a blood-red inner flame.
function flames0(x,fy,h,F,mode,k,seed){if(k<=0)return;const n=lowFx()?6:9,w=h*(.42+.22*k),H=h*(.8+.9*k),t=time,vis=.4+.6*clamp(k,0,1);
 for(let layer=0;layer<2;layer++){const s=layer?.6:1,inner=layer===1;
  ctx.globalCompositeOperation=mode==='dark'&&!inner?'source-over':'lighter';
  const col=mode==='dark'?(inner?F.a:[28,4,10]):(inner?F.b:F.a),alpha=(inner?.62:.5)*vis*(mode==='dark'&&!inner?.9:1);
  ctx.fillStyle=rgba(col,alpha);ctx.beginPath();ctx.moveTo(x-w*s,fy);
  for(let i=0;i<n;i++){const u=(i+.5)/n,ang=Math.PI*u,bx=x-Math.cos(ang)*w*s;
   const flick=.55+.45*Math.sin(t*(9+3*rnd(seed,i))+i*2.3+seed*9)*Math.sin(t*5.7+i*1.1);
   const tip=H*s*(.45+.55*Math.sin(ang))*(.62+.38*flick),cx=bx+Math.sin(t*7+i)*w*.1;
   const nx=x-Math.cos(Math.PI*(i+1)/n)*w*s,ny=fy-tip*.28*(i<n-1?1:0);
   ctx.quadraticCurveTo(cx,fy-tip,nx,ny);}
  ctx.closePath();ctx.fill();}}
// Two feathered wings behind the shoulders; span grows with heat, flap slowly.
function wings0(x,fy,h,F,k,seed){const L=h*(.66+.5*clamp(k,0,1)),flap=Math.sin(time*2.4+seed)*.09,sy=fy-h*.62;
 for(const s of[-1,1]){ctx.save();ctx.translate(x+s*h*.1,sy);ctx.rotate(s*flap);
  for(let i=0;i<3;i++){const l=L*(1-.18*i),lift=.72-.24*i,drop=.08+.2*i;
   ctx.globalCompositeOperation='source-over';ctx.fillStyle=rgba(F.b,.55-.1*i);ctx.beginPath();ctx.moveTo(0,0);
   ctx.quadraticCurveTo(s*l*.45,-l*lift,s*l,-l*(lift-.42));ctx.quadraticCurveTo(s*l*.62,-l*(lift-.42)+l*drop*.6,s*l*.14,l*drop);ctx.closePath();ctx.fill();
   ctx.globalCompositeOperation='lighter';ctx.strokeStyle=rgba(F.a,.35);ctx.lineWidth=Math.max(1,1.2*Z());ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(s*l*.45,-l*lift,s*l,-l*(lift-.42));ctx.stroke();}
  ctx.restore();}}
function halo0(x,fy,h,F,k){const y=fy-h*1.08+Math.sin(time*2)*1.5*Z(),rx=h*(.19+.03*k),ry=rx*.34;ctx.globalCompositeOperation='lighter';
 ctx.lineWidth=Math.max(1.5,3.5*Z());ctx.strokeStyle=rgba(F.a,.28);ctx.beginPath();ctx.ellipse(x,y,rx*1.12,ry*1.3,0,0,TAU);ctx.stroke();
 ctx.lineWidth=Math.max(1,2*Z());ctx.strokeStyle=rgba(F.b,.85);ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.stroke();}
// Orbs on a tilted orbit about the chest; sin(a)>0 is in front of the body.
function orbs0(p,x,fy,h,F,k,seed,layer,cut=0){const n=Math.max(0,(F.form==='orbs'?4:F.form==='runes'?3:F.form==='shards'?5:p.ego>0?3:0)-cut);if(!n)return;
 const rx=h*(.4+.08*k),ry=h*.13,cy=fy-h*.52,spin=time*(1.4+.8*k)+seed;
 for(let i=0;i<n;i++){const a=spin+i*TAU/n,depth=Math.sin(a);if((layer==='front')!==(depth>0))continue;
  const ox=x+Math.cos(a)*rx,oy=cy+depth*ry+Math.sin(time*3+i)*h*.03,sc=.8+.25*depth,col=i%2?F.b:F.a;
  ctx.globalCompositeOperation='lighter';
  if(F.form==='runes'){ctx.save();ctx.translate(ox,oy);ctx.rotate(time*1.7+i);const s=4.5*Z()*sc;ctx.fillStyle=rgba(col,.75);ctx.fillRect(-s,-s,2*s,2*s);ctx.strokeStyle=rgba(F.b,.5);ctx.lineWidth=1;ctx.beginPath();ctx.rect(-s*1.7,-s*1.7,3.4*s,3.4*s);ctx.stroke();ctx.restore();disc(ox,oy,8*Z()*sc,rgba(col,.14));}
  else if(F.form==='shards'){ctx.save();ctx.translate(ox,oy);ctx.rotate(time*.9+i*1.3);const s=6.5*Z()*sc,blink=.55+.45*Math.sin(time*6+i*2);disc(0,0,12*Z()*sc,rgba(F.a,.16*blink));ctx.fillStyle=rgba(F.a,.85*blink);ctx.beginPath();ctx.moveTo(0,-s*1.4);ctx.lineTo(s,.4*s);ctx.lineTo(-s,.4*s);ctx.closePath();ctx.fill();ctx.strokeStyle=rgba(F.b,.8*blink);ctx.lineWidth=1;ctx.stroke();ctx.restore();}
  else{for(let j=1;j<=3;j++){const b=a-j*.2,tx=x+Math.cos(b)*rx,ty=cy+Math.sin(b)*ry;disc(tx,ty,(5-j)*Z()*sc,rgba(col,.3/j));}
   disc(ox,oy,13*Z()*sc,rgba(F.a,.14));disc(ox,oy,7*Z()*sc,rgba(F.a,.45));disc(ox,oy,3.4*Z()*sc,rgba(F.b,1));}}}
// Orbiting sword-light for 환도: silver crescent blades with a gold edge on a tilted
// orbit; each blade lies along the orbit and leaves two glints behind it.
const BLADE_ORBIT=false;
function blades0(x,fy,h,F,k,seed,layer,n){const rx=h*(.42+.06*k),ry=h*.14,cy=fy-h*.5,spin=time*(1.1+.6*k)+seed;ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
 for(let i=0;i<n;i++){const a=spin+i*TAU/n,depth=Math.sin(a);if((layer==='front')!==(depth>0))continue;
  const ox=x+Math.cos(a)*rx,oy=cy+depth*ry,sc=.8+.25*depth,L=h*.2*sc;
  for(let j=1;j<=2;j++){const b=a-j*.24;disc(x+Math.cos(b)*rx,cy+Math.sin(b)*ry,(3.2-j)*Z()*sc,rgba(F.a,.28/j));}
  ctx.save();ctx.translate(ox,oy);ctx.rotate(Math.atan2(Math.cos(a)*ry,-Math.sin(a)*rx));
  disc(0,0,L*.55,rgba(F.a,.1));
  ctx.fillStyle=rgba(F.a,.62);ctx.beginPath();ctx.moveTo(-L,0);ctx.quadraticCurveTo(0,-L*.34,L,0);ctx.quadraticCurveTo(0,-L*.1,-L,0);ctx.closePath();ctx.fill();
  ctx.strokeStyle=rgba(F.b,.9);ctx.lineWidth=Math.max(1,1.3*Z());ctx.beginPath();ctx.moveTo(-L*.9,-L*.02);ctx.quadraticCurveTo(0,-L*.36,L,0);ctx.stroke();
  ctx.restore();}}
// Circuit arcs for 네온: jittered polylines around the body, re-rolled 18×/s.
function arcs0(x,fy,h,F,k,seed){const n=lowFx()?2:3,frame=Math.floor(time*18),cy=fy-h*.5;ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
 for(let i=0;i<n;i++){if(rnd(seed+frame,i*3)>.55+.45*k)continue;const a0=rnd(seed+frame,i*7)*TAU,a1=a0+1.2+rnd(seed+frame,i*7+1)*2.2,r=h*(.32+.2*rnd(seed+frame,i*7+2));
  const pts=[];for(let j=0;j<=5;j++){const u=j/5,a=lerp(a0,a1,u),jit=(rnd(seed+frame,i*11+j)-.5)*h*.1;pts.push([x+Math.cos(a)*(r+jit),cy+Math.sin(a)*r*.45+jit*.6]);}
  for(const[w,col,al]of[[5,F.b,.28],[1.8,F.a,.95]]){ctx.strokeStyle=rgba(col,al);ctx.lineWidth=Math.max(1,w*Z());ctx.beginPath();pts.forEach(([px,py],j)=>j?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.stroke();}}}
// Magic circle under 라우렌's feet when charged.
function runeRing0(q,h,F,k){if(k<.5)return;const r=h*.42,a=(k-.5)*2;ctx.save();ctx.translate(q.x,q.y);ctx.scale(1,.5);ctx.rotate(time*.6);ctx.globalCompositeOperation='lighter';
 ctx.strokeStyle=rgba(F.a,.45*a);ctx.lineWidth=Math.max(1,1.5*Z());ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();ctx.strokeStyle=rgba(F.b,.5*a);for(let i=0;i<8;i++){ctx.beginPath();ctx.arc(0,0,r*.8,i*TAU/8,i*TAU/8+TAU/14);ctx.stroke();}
 for(let i=0;i<6;i++){const t=i*TAU/6;ctx.fillStyle=rgba(F.b,.6*a);ctx.beginPath();ctx.arc(Math.cos(t)*r,Math.sin(t)*r,2.2*Z(),0,TAU);ctx.fill();}ctx.restore();}
// Falling petals for 헌터: a small per-hero particle list.
function petals(p,x,fy,h,F,k,seed){const s=stateOf(p),max=lowFx()?6:12,dt=clamp(time-(s.petalAt||time),0,.1);s.petalAt=time;
 if(s.petals.length<max&&Math.random()<dt*(4+6*k))s.petals.push({ox:(Math.random()-.5)*h*.9,y:-h*(1+Math.random()*.4),vy:h*(.25+.3*Math.random()),ph:Math.random()*TAU,rot:Math.random()*TAU,life:0,max:1.6+Math.random()*.8,col:Math.random()<.5?F.a:F.b});
 for(let i=s.petals.length-1;i>=0;i--){const q=s.petals[i];q.life+=dt;q.y+=q.vy*dt;q.ph+=dt*3;q.rot+=dt*2;if(q.life>q.max||q.y>0){s.petals.splice(i,1);continue;}
  const alpha=Math.sin(Math.PI*q.life/q.max)*.85,px=x+q.ox+Math.sin(q.ph)*h*.08,py=fy+q.y;ctx.save();ctx.translate(px,py);ctx.rotate(q.rot);ctx.globalCompositeOperation='source-over';ctx.fillStyle=rgba(q.col,alpha);ctx.beginPath();ctx.ellipse(0,0,5.5*Z(),3*Z(),0,0,TAU);ctx.fill();ctx.globalCompositeOperation='lighter';ctx.fillStyle=rgba(F.b,alpha*.35);ctx.beginPath();ctx.ellipse(0,0,8*Z(),5*Z(),0,0,TAU);ctx.fill();ctx.restore();}}
// Vertical light pillar for EGO/사몽 power-ups, drawn behind the body.
function pillar0(x,fy,h,F,t){const k=1-t,w=h*(.22+.1*t),H=h*(1.6+.6*t);ctx.globalCompositeOperation='lighter';
 for(const[s,col,al]of[[1,F.a,.18],[.5,F.b,.3]]){ctx.fillStyle=rgba(col,al*k);ctx.beginPath();ctx.moveTo(x-w*s,fy);ctx.lineTo(x-w*s*.45,fy-H);ctx.lineTo(x+w*s*.45,fy-H);ctx.lineTo(x+w*s,fy);ctx.closePath();ctx.fill();}}

function field0(x,fy,h,F,k){const cy=fy-h*.5,pulse=1+.04*Math.sin(time*3.1);ctx.globalCompositeOperation='lighter';ctx.save();ctx.translate(x,cy);ctx.scale(pulse,pulse*1.35);disc(0,0,h*.46,rgba(F.a,.05+.08*k));disc(0,0,h*.34,rgba(F.a,.07+.1*k));disc(0,0,h*.2,rgba(F.b,.05+.08*k));ctx.restore();}
// ---- R106: 날개·후광·오라를 그림 텍스처로 (fx-sprites-r106.js). 텍스처가 없을 때만 위 도형(…0)으로 그립니다.
const SPR=()=>{const s=window.__STORYWORLD_FX_SPRITES_R106__;return s&&s.on()?s:null;};
const DARK=Object.freeze({a:Object.freeze([60,8,16]),b:Object.freeze([110,30,42])});
function groundGlow(q,h,F,k){const s=SPR(),r=h*(.4+.22*k);if(s&&s.draw('glow',F,q.x,q.y,r*2.3,r*1.15,{alpha:.22+.25*k}))return;groundGlow0(q,h,F,k);}
function field(x,fy,h,F,k){const s=SPR(),pulse=1+.04*Math.sin(time*3.1);if(s&&s.draw('glow',F,x,fy-h*.5,h*1.05*pulse,h*1.4*pulse,{alpha:.18+.3*k}))return;field0(x,fy,h,F,k);}
function flames(x,fy,h,F,mode,k,seed){if(k<=0)return;const s=SPR(),w=h*(1.05+.4*k),H=h*(1.1+1*k),fr=Math.floor(time*12+seed*7);
 if(s&&s.draw('flame',mode==='dark'?DARK:F,x,fy,w,H,{frame:fr,alpha:.75*(.4+.6*clamp(k,0,1)),blend:mode==='dark'?'source-over':'lighter'})){s.draw('flame',mode==='dark'?F:s.pal(F.b),x,fy,w*.62,H*.72,{frame:fr+2,alpha:.7*(.4+.6*clamp(k,0,1))});return;}
 flames0(x,fy,h,F,mode,k,seed);}
// Two feathered wings from the shoulders, folded a little at rest and spread with heat; slow flap.
// R107: wings follow the hero's facing. Facing the camera (s) → front view behind the body; facing away (n) →
// back view drawn over the body; east/west → side view (art faces west, mirrored for east). Folded while idle.
const WING_FOUR={front:'s',back:'n',left:'w',right:'e'};
function wingSector(p){let d=null;try{d=window.__STORYWORLD_PHASE1_ART__?.hero?.()?.direction;}catch(_){}if(WING_FOUR[d])d=WING_FOUR[d];if(!d||d.length>2)d=p.currentVisualSector||WING_FOUR[p.direction]||'s';return d;}
const wingHold=new WeakMap();
function wingView(p){const d=wingSector(p),v=d[0]==='n'?'back':d==='e'||d==='w'?'side':'front',st=wingHold.get(p);
 if(st&&st.v!==v&&time-st.at<.12)return st;const ns=st&&st.v===v?{...st,flip:d==='e'}:{v,flip:d==='e',at:time};wingHold.set(p,ns);return ns;}
function wingsView(p,layer,x,fy,h,F,k,seed){const s=SPR(),wv=wingView(p);if(!s)return false;if((wv.v==='back')!==(layer==='front'))return true;
 const name='wing'+wv.v+(p.moving||p.attackAnim>0||p.skillAnim>0||p.ego>0||p.samong>0?'':'-f');if(!s.ready(name,F))return false;
 const W=h*(wv.v==='side'?1.15:1.35)*(1+.35*clamp(k,0,1)),flap=Math.sin(time*(p.moving?4:2.4)+seed)*(wv.v==='side'?.08:.05),sy=fy-h*.64+Math.sin(time*2.4+seed)*h*.015;
 const asp=name.startsWith('wingside')?.78:.74,o={angle:flap*(wv.flip?-1:1),alpha:wv.v==='back'?.82:.9,blend:'source-over',flip:wv.flip};
 const dx=wv.v==='side'?(wv.flip?-1:1)*h*.06:0;s.draw(name,F,x+dx,sy,W,W*asp,o);
 if(k>.3)for(let i=0;i<2;i++){const ph=(time*.35+i/2+seed)%1,side=wv.v==='side'?(wv.flip?-1:1):i%2?1:-1;s.draw('feather',F,x+side*h*(.3+.45*ph),sy+h*(.2+.9*ph),h*.07,h*.21,{alpha:.6*Math.sin(Math.PI*ph),angle:Math.sin(time*2+i)*.7});}
 return true;}
function wings(x,fy,h,F,k,seed,p){if(p&&wingsView(p,'back',x,fy,h,F,k,seed))return;const s=SPR();if(!s)return wings0(x,fy,h,F,k,seed);const W=h*(1.25+.55*clamp(k,0,1)),flap=Math.sin(time*2.4+seed)*.1,sy=fy-h*.66;
 if(!s.draw('wing',F,x+h*.08,sy,W,W,{angle:-.12-flap,alpha:.92,blend:'source-over'}))return wings0(x,fy,h,F,k,seed);
 s.draw('wing',F,x-h*.08,sy,W,W,{angle:.12+flap,alpha:.92,blend:'source-over',flip:true});
 s.draw('wing',s.pal(F.b),x+h*.08,sy,W,W,{angle:-.12-flap,alpha:.25+.25*clamp(k,0,1)});s.draw('wing',s.pal(F.b),x-h*.08,sy,W,W,{angle:.12+flap,alpha:.25+.25*clamp(k,0,1),flip:true});
 if(k>.3)for(let i=0;i<3;i++){const ph=(time*.35+i/3+seed)%1,side=i%2?1:-1;s.draw('feather',F,x+side*h*(.35+.5*ph),sy+h*(.2+.9*ph),h*.07,h*.21,{alpha:.7*Math.sin(Math.PI*ph),angle:Math.sin(time*2+i)*.7});}}
function halo(x,fy,h,F,k){const s=SPR(),y=fy-h*1.08+Math.sin(time*2)*1.5*Z(),rx=h*(.19+.03*k);if(s&&s.draw('halo',F,x,y,rx*2.35,rx*2.35*96/256,{alpha:.95}))return;halo0(x,fy,h,F,k);}
function orbs(p,x,fy,h,F,k,seed,layer,cut=0){const s=SPR();if(!s||!s.ready('orb',F)||F.form==='runes'&&!s.ready('rune',F)||F.form==='shards'&&!s.ready('shard',F))return orbs0(p,x,fy,h,F,k,seed,layer,cut);
 const n=Math.max(0,(F.form==='orbs'?4:F.form==='runes'?3:F.form==='shards'?5:p.ego>0?3:0)-cut);if(!n)return;const rx=h*(.4+.08*k),ry=h*.13,cy=fy-h*.52,spin=time*(1.4+.8*k)+seed;
 for(let i=0;i<n;i++){const a=spin+i*TAU/n,depth=Math.sin(a);if((layer==='front')!==(depth>0))continue;const ox=x+Math.cos(a)*rx,oy=cy+depth*ry+Math.sin(time*3+i)*h*.03,sc=.8+.25*depth,P=i%2?s.pal(F.b):F;
  if(F.form==='runes'){s.draw('rune',P,ox,oy,h*.2*sc,h*.2*sc,{angle:time*1.7+i,alpha:.95});s.draw('glow',F,ox,oy,h*.22*sc,h*.22*sc,{alpha:.5});}
  else if(F.form==='shards'){const blink=.55+.45*Math.sin(time*6+i*2);s.draw('shard',P,ox,oy,h*.075*sc,h*.15*sc,{angle:Math.sin(time*.9+i*1.3)*.4,alpha:.95*blink,pivot:[.5,.5]});s.draw('glow',F,ox,oy,h*.2*sc,h*.2*sc,{alpha:.45*blink});}
  else{for(let j=1;j<=3;j++){const b=a-j*.2;s.draw('glow',F,x+Math.cos(b)*rx,cy+Math.sin(b)*ry,(10-2*j)*Z()*sc*2,(10-2*j)*Z()*sc*2,{alpha:.5/j});}s.draw('orb',P,ox,oy,22*Z()*sc,22*Z()*sc,{alpha:1});}}}
function blades(x,fy,h,F,k,seed,layer,n){const s=SPR();if(!s||!s.ready('blade',F))return blades0(x,fy,h,F,k,seed,layer,n);const rx=h*(.42+.06*k),ry=h*.14,cy=fy-h*.5,spin=time*(1.1+.6*k)+seed;
 for(let i=0;i<n;i++){const a=spin+i*TAU/n,depth=Math.sin(a);if((layer==='front')!==(depth>0))continue;const ox=x+Math.cos(a)*rx,oy=cy+depth*ry,sc=.8+.25*depth,L=h*.46*sc;
  for(let j=1;j<=2;j++){const b=a-j*.24;s.draw('glow',F,x+Math.cos(b)*rx,cy+Math.sin(b)*ry,(7-2*j)*Z()*sc*2,(7-2*j)*Z()*sc*2,{alpha:.45/j});}
  s.draw('blade',F,ox,oy,L,L*72/256,{angle:Math.atan2(Math.cos(a)*ry,-Math.sin(a)*rx),alpha:.95});}}
function arcs(x,fy,h,F,k,seed){const s=SPR();if(!s||!s.ready('bolt',F))return arcs0(x,fy,h,F,k,seed);const n=lowFx()?2:3,frame=Math.floor(time*18),cy=fy-h*.5;
 for(let i=0;i<n;i++){if(rnd(seed+frame,i*3)>.55+.45*k)continue;const a0=rnd(seed+frame,i*7)*TAU,a1=a0+1.2+rnd(seed+frame,i*7+1)*2.2,r=h*(.32+.2*rnd(seed+frame,i*7+2));
  s.along('bolt',F,x+Math.cos(a0)*r,cy+Math.sin(a0)*r*.45,x+Math.cos(a1)*r,cy+Math.sin(a1)*r*.45,h*.16,{frame:frame+i,alpha:.95});}}
function runeRing(q,h,F,k){if(k<.5)return;const s=SPR(),a=(k-.5)*2,r=h*.42;if(s&&s.draw('rune',F,q.x,q.y,2*r/.95,2*r/.95,{squash:.5,angle:time*.6,alpha:.7*a}))return;runeRing0(q,h,F,k);}
function pillar(x,fy,h,F,t){const s=SPR(),k=1-t;if(s&&s.draw('pillar',F,x,fy,h*(.75+.3*t),h*(1.9+.7*t),{alpha:.8*k}))return;pillar0(x,fy,h,F,t);}

// Growth gating: tier 0 a faint ground glow, 1 adds the body field, 2 shows the hero's
// form faintly with fewer pieces, 3 most of it, 4 (and EGO/사몽) all of it.
function formLevel(p,t){if(p.ego>0||p.samong>0||t>=4)return{on:true,alpha:1,cut:0};if(t>=3)return{on:true,alpha:.85,cut:1};if(t>=2)return{on:true,alpha:.55,cut:2};return{on:false,alpha:0,cut:9};}
function auraBack(p){const F=heroOf(p),t=tierOf(p),k=heat(p,t),L=formLevel(p,t),q=project(p.x,p.y),h=actorHeight(),lift=clamp(finite(p.visualLiftPx),0,h*.65),fy=q.y-lift,seed=hash(p.hero||'hwando')%628/100,awake=p.ego>0||p.samong>0;
 scope({id:'r101:aura-back:'+String(p.coopIdR62||p.id||'hero'),kind:'effect',x:p.x,y:p.y,groundAligned:false,r101:true},()=>{ctx.save();try{
  groundGlow(q,h,F,k);if(t>=1||awake)field(q.x,fy,h,F,k);
  if(L.on){ctx.globalAlpha*=L.alpha;
   if(F.form==='runes'&&(t>=3||awake))runeRing(q,h,F,Math.max(k,.5+.15*Math.max(0,t-2)));
   if(F.form==='flame'||F.form==='dark'||awake)flames(q.x,fy,h,F,F.form==='dark'?'dark':'bright',k*(F.form==='flame'||F.form==='dark'?1:.8),seed);
   if(F.form==='angel'&&(t>=3||awake)||p.samong>0)wings(q.x,fy,h,F,k,seed,p);
   // R107: no idle orbiting crescent blades for 환도 (looked odd); the iai cast carries the sword light now.
   if(F.form==='blade'&&BLADE_ORBIT)blades(q.x,fy,h,F,k,seed,'back',4-L.cut);
   orbs(p,q.x,fy,h,F,k,seed,'back',L.cut);}
 }finally{ctx.restore();}});stats.auraDraws++;}
function auraFront(p){const F=heroOf(p),t=tierOf(p),k=heat(p,t),L=formLevel(p,t),q=project(p.x,p.y),h=actorHeight(),lift=clamp(finite(p.visualLiftPx),0,h*.65),fy=q.y-lift,seed=hash(p.hero||'hwando')%628/100;
 if(!L.on)return;
 scope({id:'r101:aura-front:'+String(p.coopIdR62||p.id||'hero'),kind:'effect',x:p.x,y:p.y,groundAligned:false,r101:true},()=>{ctx.save();try{ctx.globalAlpha*=L.alpha;
  if(F.form==='angel'&&(t>=3||p.ego>0||p.samong>0)||p.samong>0)wingsView(p,'front',q.x,fy,h,F,k,seed);
  if(F.form==='angel'||p.samong>0)halo(q.x,fy,h,F,k);
  if(F.form==='arcs')arcs(q.x,fy,h,F,k,seed);
  if(F.form==='petals')petals(p,q.x,fy,h,F,k,seed);
  if(F.form==='blade'&&BLADE_ORBIT)blades(q.x,fy,h,F,k,seed,'front',4-L.cut);
  orbs(p,q.x,fy,h,F,k,seed,'front',L.cut);
 }finally{ctx.restore();}});}
const heroBase=drawHero;drawHero=function(...a){const p=live()?player:null,on=!!(p&&prefs.aura&&p.hp>0&&p.visible!==false&&p.disabled!==true&&finite(p.x+p.y,NaN)===p.x+p.y);
 if(on)try{auraBack(p);}catch(e){fail(e);}const r=heroBase.apply(this,a);if(on)try{auraFront(p);}catch(e){fail(e);}return r;};

// ---- hit feel: hero skill → enemy -------------------------------------------------------
// Only skill hits (Q, Z/X/C, skill shots, the EGO shock) get the hero-colour burst; a
// basic attack keeps the plain native spark. The burst grows with the growth tier.
const flinch=new WeakMap(),lastHitFx=new WeakMap();
function bodyLift(e){const h=actorHeight(),bodyH=h*finite(e.combatProfile?.spriteRect?.height,1)*finite(e.defScale,1);return bodyH*.45+clamp(finite(e.visualLiftPx),0,h);}
// A source that says what it is decides; the action in progress only speaks for sources
// that carry nothing (melee calls made inside special()).
function skillHit(source,action){
 if(source&&typeof source==='object'){
  if(source.storyWER)return String(source.sourceHero||player.hero);
  const sc=source.e568HeroActionContext;if(sc&&typeof sc==='object')return sc.kind==='skill'?String(sc.heroId||player.hero):null;
  if(typeof source.attackKind9==='string')return source.friendly!==false&&source.attackKind9==='skill'?String(source.sourceHero||player.hero):null;
  if(source.kind==='awakening-shock'&&source.side==='hero')return String(player.hero);
  if(source.friendly===false)return null;}
 return action?.kind==='skill'?String(action.heroId||player.hero):null;}
function onHeroHit(e,heroId){const last=lastHitFx.get(e);if(last!==undefined&&time>=last&&time-last<.08)return;lastHitFx.set(e,time);
 const F=fxOf(heroId),t=tierOf(player),boss=!!(e.boss||e.midboss),h=actorHeight();
 let x=e.x,y=e.y;const imp=effects.findLast?.(f=>f.type==='e568HeroImpact'&&f.age===0&&f.targetIdE568===String(e.id));if(imp){x=imp.x;y=imp.y;}
 const ang=Math.atan2(e.y-player.y,e.x-player.x),sa=screenAngle(ang),strength=(1.12+.1*t)*(boss?1.2:1);
 add({kind:'heroHit',x,y,lift:bodyLift(e),F,sa,size:h*(boss?1.45:1.05)*strength,life:.34+.12*(strength-1),seed:Math.random()*6,heavy:t>=1,tier:t});
 // the recoil itself (any hit, not only skills) is registered by noteHit in the hit wrapper below
 if(!reduced()&&typeof shake==='number'){const want=.3+.06*t;if(want>shake)shake=want;}
 stats.hits++;}
const hitBase=hitEnemy;hitEnemy=function(e,value,source,...rest){const before=e?.hp;let heroId=null;
 try{if(prefs.hitfx&&live())heroId=skillHit(source,typeof e568HeroActionContext!=='undefined'?e568HeroActionContext:null);}catch(err){fail(err);}
 const r=hitBase.call(this,e,value,source,...rest);
 try{if(e&&Number.isFinite(before)&&e.hp<before){
   // R108: every hero hit shoves the mob back along the blow (skill hits a little harder)
   if(e.hp>0&&prefs.motion&&live())noteHit(e,before-e.hp,!!heroId);
   if(heroId&&(R102()?.PALETTE?.[heroId]||HERO_FX[heroId]))onHeroHit(e,heroId);}}catch(err){fail(err);}return r;};

// ---- hit feel: enemy → hero -----------------------------------------------------------
let hurtFlash=0,flashEl=null;
function ownerOf(source){if(!source||!room?.enemies)return null;return room.enemies.find(e=>e===source||e.id===source.owner||e.id===source.ownerId||e===source.owner)||null;}
function onHeroHurt(source){const owner=ownerOf(source),colour=POL()?.colourOf?.(owner)||'red',rgb=SIGDATA()?.sigColours?.[colour]||[235,52,52],h=actorHeight();
 const from=owner||(Number.isFinite(source?.x)?source:null),ang=from?Math.atan2(player.y-from.y,player.x-from.x):Math.random()*TAU,sa=screenAngle(ang);
 add({kind:'heroHurt',x:player.x,y:player.y,lift:h*.5,colour,rgb,sa,life:.42,seed:Math.random()*6});
 const s=stateOf(player);s.hurtAt=time;s.hurtDx=Math.cos(sa);hurtFlash=1;stats.hurts++;}
const hurtBase=hurt;hurt=function(damage,source,...rest){const before=player?.hp;const r=hurtBase.call(this,damage,source,...rest);try{if(prefs.hitfx&&live()&&Number.isFinite(before)&&player.hp<before)onHeroHurt(source);}catch(err){fail(err);}return r;};
// Hero flinch: the native R48 pose hook runs inside the body draw, after translate(feet).
const R48=window.__STORYWORLD_COMBAT_SYNC_R48__;
if(R48&&typeof R48.applyBodyPose==='function'){const poseBase=R48.applyBodyPose;window.__STORYWORLD_COMBAT_SYNC_R48__=Object.freeze({...R48,applyBodyPose(c,hero=false){const r=poseBase(c,hero);
 try{if(hero&&prefs.hitfx&&!reduced()&&live()&&c){const s=heroState.get(player);if(s){const u=(time-s.hurtAt)/.26;if(u>=0&&u<1){const g=Math.sin(Math.PI*u)*(1-u*.5);c.translate(s.hurtDx*5*Z()*g,0);c.rotate(s.hurtDx*.07*g);c.scale(1+.05*g,1-.06*g);}}}}catch(e){fail(e);}return r;}});}

// ---- drawing of own effects ---------------------------------------------------------
function drawHeroHit(e,t){const q=project(e.x,e.y),y=q.y-e.lift,F=e.F,k=1-t,ease=k*k,s=e.size*(.8+.35*(1-ease)),T=e.tier??2;
 sig('hit',F.sig,q.x,y,t,s*1.15,{alpha:.95*fadeOut(t),glow:.45*ease});
 if(T>=3&&F.sig2)sig('hit',F.sig2,q.x,y,Math.min(.999,t*1.1),s*.8,{alpha:.7*fadeOut(t),glow:.2*ease});
 if(e.heavy)sig('slash',F.sig,q.x,y,Math.min(.999,t*1.15),s*1.35,{angle:e.sa+Math.PI,alpha:.85*fadeOut(t,.5),glow:.3*ease});
 ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
 disc(q.x,y,s*.22*(1-ease*.5),rgba(F.b,.55*ease*ease));
 ctx.lineWidth=Math.max(1.5,3*Z()*k);ctx.strokeStyle=rgba(F.b,.9*ease);ctx.beginPath();ctx.ellipse(q.x,y,s*.4*(.35+.65*(1-ease)),s*.24*(.35+.65*(1-ease)),0,0,TAU);ctx.stroke();
 const n=lowFx()?4:5+T,reach=e.size/actorHeight();for(let i=0;i<n;i++){const a=e.sa+(rnd(e.seed,i)-.5)*1.9,len=(14+30*rnd(e.seed,i+9))*Z()*reach,d=len*(.3+1.1*(1-ease));
  const x0=q.x+Math.cos(a)*d*.5,y0=y+Math.sin(a)*d*.5*.7,x1=q.x+Math.cos(a)*d,y1=y+Math.sin(a)*d*.7;ctx.strokeStyle=rgba(i%2?F.b:F.a,.95*ease);ctx.lineWidth=Math.max(1.2,(3.2-2*t)*Z());ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();}
 if(T>=2){ctx.lineWidth=Math.max(1,1.5*Z());ctx.strokeStyle=rgba(F.a,.55*ease);ctx.beginPath();ctx.ellipse(q.x,q.y,s*.7*(1-ease*.5),s*.35*(1-ease*.5),0,0,TAU);ctx.stroke();}}
function drawHeroHurt(e,t){const q=project(e.x,e.y),y=q.y-e.lift,k=1-t,ease=k*k,h=actorHeight(),s=h*1.1;
 sig('hit',e.colour,q.x,y,t,s,{alpha:.85*fadeOut(t),glow:.3*ease});
 ctx.globalCompositeOperation='lighter';ctx.lineCap='round';const n=lowFx()?3:5;
 for(let i=0;i<n;i++){const a=e.sa+(rnd(e.seed,i)-.5)*1.4,d=(8+18*rnd(e.seed,i+5))*Z()*(.3+1.1*(1-ease));ctx.strokeStyle=rgba(i%2?[255,120,120]:e.rgb,.85*ease);ctx.lineWidth=Math.max(1,2*Z()*k);ctx.beginPath();ctx.moveTo(q.x+Math.cos(a)*d*.5,y+Math.sin(a)*d*.35);ctx.lineTo(q.x+Math.cos(a)*d,y+Math.sin(a)*d*.7);ctx.stroke();}}
function drawPowerUp(e,t){const q=project(e.x,e.y),h=actorHeight(),lift=clamp(finite(player?.visualLiftPx),0,h*.65);pillar(q.x,q.y-lift,h,e.F,t);
 const k=1-t;ctx.globalCompositeOperation='lighter';ctx.lineWidth=Math.max(1,2.5*Z()*k);ctx.strokeStyle=rgba(e.F.b,.75*k);ctx.beginPath();ctx.ellipse(q.x,q.y,h*(.25+1.3*smooth(t)),h*(.12+.65*smooth(t)),0,0,TAU);ctx.stroke();}
function drawDust(e,t){const q=project(e.x,e.y),k=1-t,h=actorHeight();ctx.globalCompositeOperation='source-over';for(let i=0;i<3;i++){const a=e.seed+i*2.1,d=(3+9*t)*Z()*e.scale,r=(2.2+3.5*t)*Z()*e.scale;ctx.fillStyle=rgba([205,192,168],.3*k*k);ctx.beginPath();ctx.ellipse(q.x+Math.cos(a)*d,q.y+Math.sin(a)*d*.45-t*4*Z(),r,r*.6,0,0,TAU);ctx.fill();}void h;}
const DRAW={heroHit:drawHeroHit,heroHurt:drawHeroHurt,powerUp:drawPowerUp,dust:drawDust};
function drawOwn(){if(!list.length||typeof ctx==='undefined'||!ctx)return;for(const e of list){const fn=DRAW[e.kind];if(!fn)continue;const t=age(e)/e.life;if(t<0||t>1)continue;
 ctx.save();try{scope({id:e.id,kind:'effect',x:e.x,y:e.y,r101:true},()=>fn(e,t));}catch(err){fail(err);}finally{ctx.restore();}}}
const effectBase=drawEffect;drawEffect=function(e){if(e&&e.type==='r101-air'){try{drawOwn();}catch(err){fail(err);}return;}return effectBase.apply(this,arguments);};

// ---- mob motion (R108): solid sprites, Diablo-2 style ------------------------------------
// Draw-only. The native body painter translates to the feet, then asks the pose chain for a
// transform; R52 (the chain's head) is swapped for a copy whose pose is ours. The pose is worked
// out once per drawEnemy (scopePose) so the R108 shadow can follow it. hp, timers, AI, hit tests
// and positions are only read. mobs-r108.js supplies the level (strength) and the swarm LOD.
// Rules (owner feedback "꿀렁" on painted sprites): the picture is never stretched or squashed at
// rest; idle is at most a 1% vertical bob, flyers one slow hover, walking a stride-locked bob with a
// small lean; only the attack thrust and the hit recoil may scale the body, by 4% at most and for
// less than 0.2 s (half of that for bosses / midbosses). Life comes from movement, facing, attacks and
// recoil, not from deforming the picture.
const mobState=new WeakMap();
let scopeEnemy=null,scopePose=null;
const R108=()=>window.__STORYWORLD_MOBS_R108__;
// 0 off, .55 light, 1 default (R108 settings section); 1 while R108 is absent.
function mobStrength(){try{const m=R108(),v=m&&typeof m.strength==='function'?m.strength():1;return Number.isFinite(v)?clamp(v,0,1):1;}catch(_){return 1;}}
// 0 skip (off screen), 1 cheap (far mob inside a swarm), 2 full.
function mobLod(e){try{const m=R108(),v=m&&typeof m.lodOf==='function'?m.lodOf(e):2;return v===0||v===1?v:2;}catch(_){return 2;}}
function mobOf(e){let s=mobState.get(e);if(!s){const h=hash(e.id);
 s={x:e.x,y:e.y,t:time,vx:0,vy:0,spd:0,dist:0,phase:0,step:0,walk:0,jx:0,jy:0,dustAt:-9,seed:(h%628)/100,r1:((h>>>8)%1000)/1000,r2:((h>>>18)%1000)/1000,pose:{dx:0,dy:0,bob:0,lean:0,sx:1,sy:1,pivot:0}};mobState.set(e,s);}return s;}
function isFlyer(e){try{return !!POL()?.artOf?.(e)?.fly||finite(e.visualLiftPx)>0;}catch(_){return finite(e.visualLiftPx)>0;}}
function bodyPx(e){return actorHeight()*finite(e.combatProfile?.spriteRect?.height,1)*finite(e.defScale,1);}
function onScreen(e){const q=project(e.x,e.y);return q.x>-80&&q.x<W+80&&q.y>-120&&q.y<H+80;}
// world direction -> unit vector on screen (iso: screen x grows with x-y, screen y with (x+y)/2)
function screenVec(ax,ay){const sx=ax-ay,sy=(ax+ay)*.5,L=Math.hypot(sx,sy)||1;return[sx/L,sy/L];}
const easeOut3=t=>{t=clamp(t,0,1);return 1-(1-t)*(1-t)*(1-t);};
// Motion caps (fractions of body height / radians / scale). Exported through inspect for the CPU check.
const MOTION_CAPS=Object.freeze({idleBob:.01,idleHz:.5,idleLean:.01,hoverAmp:.015,hoverHz:1,walkBob:.03,walkLean:.05,actScale:.04,actScaleMajor:.02,hitSeconds:.18});
// Any hero hit makes the mob recoil away from the hero; the push grows with the share of its
// health the blow took, skill hits add a little. Bosses barely move (a silly shove otherwise).
function noteHit(e,dmg,skill){if(!e||!player||!(dmg>0))return;const major=!!(e.boss||e.midboss||e.persona);if(major&&!skill)return;
 const prev=flinch.get(e);if(prev&&time-prev.at<.07)return;
 const frac=dmg/Math.max(1,finite(e.maxHp,1)),k=clamp(.55+Math.sqrt(Math.max(0,frac))*2.1+(skill?.25:0),.55,1.7)*(major?.3:1);
 const v=screenVec(e.x-player.x,e.y-player.y);flinch.set(e,{at:time,dx:v[0],dy:v[1],k});stats.recoils=(stats.recoils||0)+1;}
function motion(e){const s=mobOf(e),P=s.pose;P.dx=0;P.dy=0;P.bob=0;P.lean=0;P.sx=1;P.sy=1;P.pivot=0;
 const str=mobStrength(),lod=mobLod(e);if(!(str>0)||lod===0)return P;
 const major=!!(e.boss||e.midboss||e.persona),amp=str*(major?.5:1)*(lowFx()?.8:1),h=bodyPx(e),C=MOTION_CAPS;
 // the world velocity is measured from real movement; a one-frame jump (push-back, separation,
 // teleport) slides the picture to the new spot instead of popping or faking a sprint.
 let el=time-s.t;if(!(el>=0)||el>.35){s.x=e.x;s.y=e.y;s.t=time;s.vx=s.vy=s.spd=s.dist=0;s.jx=s.jy=0;el=0;}
 const dt=clamp(el,0,.1);
 if(dt>0){const ddx=e.x-s.x,ddy=e.y-s.y,dist=Math.hypot(ddx,ddy),vmax=(finite(e.speed,2.2)+2.2)*dt*1.7+.02;
  if(dist>vmax){if(dist<1.4){const a=project(s.x,s.y),b=project(e.x,e.y);s.jx=clamp(s.jx+a.x-b.x,-44,44);s.jy=clamp(s.jy+a.y-b.y,-30,30);}s.dist=0;}
  else{s.vx=lerp(s.vx,ddx/dt,.45);s.vy=lerp(s.vy,ddy/dt,.45);s.spd=lerp(s.spd,Math.hypot(s.vx,s.vy),.45);s.dist=dist;}
  s.x=e.x;s.y=e.y;s.t=time;const k=Math.exp(-dt*11);s.jx*=k;s.jy*=k;}
 const fly=isFlyer(e),seed=s.seed;
 const sdir=clamp((s.vx-s.vy)/2.4,-1,1),target=clamp((s.spd-.25)/1.1,0,1);
 if(dt>0)s.walk=lerp(s.walk,target,1-Math.exp(-dt*(target>s.walk?14:8)));
 const w=s.walk;
 // walk cycle: one footfall per stride of real travel (bigger bodies take longer strides); the
 // feet settle on the nearest footfall when the mob stops.
 if(dt>0&&!fly){
  if(s.dist>0&&s.spd>.25){const stride=.56*clamp(h/Math.max(1,actorHeight()),.7,1.9)*(.88+.24*s.r1);s.phase+=Math.min(s.dist*Math.PI/stride,dt*5.4*Math.PI);}
  else s.phase+=(Math.round(s.phase/Math.PI)*Math.PI-s.phase)*Math.min(1,dt*9);
  const step=Math.floor(s.phase/Math.PI+1e-4);
  if(step!==s.step){s.step=step;
   if(w>.6&&s.spd>1.1&&time-s.dustAt>.26&&lod===2&&!lowFx()&&list.length<MAX-6&&onScreen(e)){s.dustAt=time;add({kind:'dust',x:e.x,y:e.y,life:.38,seed:Math.random()*6,scale:clamp(h/actorHeight(),.6,1.6)});stats.dust++;}}}
 if(fly){
  // one slow hover: a single vertical sine, ~1 Hz, <=1.5% of the body; nothing else at rest
  P.bob=Math.sin(time*TAU*C.hoverHz*(.9+.2*s.r1)+seed)*h*C.hoverAmp*amp;
  P.lean+=sdir*C.walkLean*amp*w;}
 else{
  if(w>.02){const g=Math.sin(s.phase);
   // stride bob (<=3% h) and a small lean into the travel (<=0.05 rad); the picture is never stretched
   P.bob+=Math.abs(g)*h*C.walkBob*w*amp;P.lean+=clamp(sdir*.035+g*.012,-C.walkLean,C.walkLean)*w*amp;}
  // idle: at most a 1% vertical bob at ~0.5 Hz (own phase per mob) and a barely visible lean
  const iw=1-w;
  if(iw>.02&&lod===2){const rate=C.idleHz*(.9+.2*s.r2);
   P.bob+=(.5+.5*Math.sin(time*TAU*rate+seed*3.1))*h*C.idleBob*amp*iw;
   P.lean+=Math.sin(time*.6*(.8+.4*s.r1)+seed*7)*C.idleLean*amp*iw;}}
 // attack: gather through the windup (lean back, slight crouch), thrust toward the target through
 // the active window, settle through the recovery (offset in drawing only; the foot stays put).
 // Scale is capped at 4% (2% for bosses) and only during the short thrust.
 const a=e.attack,smax=major?C.actScaleMajor:C.actScale;
 if(a&&Number.isFinite(a.elapsed)){
  const shape=a.shape154||e.combatProfile?.attackShape||{},windup=Math.max(.05,a.castWindup150??shape.windup??.3),active=Math.max(.05,shape.active??.15),rec=Math.max(.12,shape.recovery??.3),
   ang=Number.isFinite(a.angle)?a.angle:Math.atan2((player?.y??e.y)-e.y,(player?.x??e.x)-e.x),v=screenVec(Math.cos(ang),Math.sin(ang)),ux=v[0],uy=v[1],
   heavy=e.weapon==='heavy',caster=e.weapon==='caster',reach=(caster?0:heavy?.15:.24)*h*amp;
  if(a.elapsed<windup){const g=smooth(a.elapsed/windup);
   P.sy*=1-smax*g*amp;P.lean-=ux*.12*g*amp;P.dx-=ux*h*.05*g*amp;P.dy-=uy*h*.025*g*amp;if(caster)P.bob+=h*.03*g*amp;}
  else{const t=a.elapsed-windup,thrust=easeOut3(t/(active*.7+.03)),back=smooth((t-active*.6)/(rec*.8+.1)),d=thrust*(1-back),sq=t<C.hitSeconds?d*(1-t/C.hitSeconds):0;
   P.dx+=ux*reach*d;P.dy+=uy*reach*d;P.lean+=ux*.16*d*amp;P.sx*=1+smax*sq*amp;P.sy*=1-smax*sq*amp;}}
 else if(e.rangedWindup>0){const av=Number.isFinite(e.rangedAim)?screenVec(Math.cos(e.rangedAim),Math.sin(e.rangedAim)):[sdir||1,0];
  P.lean-=av[0]*.06*amp;P.dx-=av[0]*h*.03*amp;}
 // hit: shoved away from the hero along the blow with a short (<0.2 s) 4% squash, then settles
 // (the native hit timer alone only nudges, for hits that never reached the wrapper below)
 const f=flinch.get(e);let fu=f?(time-f.at)/C.hitSeconds:2,fk=f?.k??1,fx=f?.dx??0,fy=f?.dy??0;
 if(!(fu>=0&&fu<1)&&e.hitTimer>0){fu=1-clamp(e.hitTimer/.14,0,1);fk=major?.12:.35;if(player){const v=screenVec(e.x-player.x,e.y-player.y);fx=v[0];fy=v[1];}else{fx=sdir||1;fy=0;}}
 if(fu>=0&&fu<1){const g=Math.sin(Math.PI*Math.pow(fu,.6))*(1-fu*.35)*amp,mag=h*(.06+.07*Math.min(1.7,fk)),sq=smax*Math.min(1,fk)*Math.sin(Math.PI*fu)*amp;
  P.dx+=fx*mag*g;P.dy+=fy*mag*g*.8;P.sx*=1+sq;P.sy*=1-sq;P.lean+=fx*.08*g;}
 P.dx=clamp(P.dx+s.jx,-h*.7,h*.7);P.dy=clamp(P.dy+s.jy,-h*.5,h*.5);P.lean=clamp(P.lean,-.3,.3);P.sx=clamp(P.sx,1-smax,1+smax);P.sy=clamp(P.sy,1-smax,1+smax);
 return P;}
const R52=window.__STORYWORLD_HOSPITAL_CHARGE_R52__;
if(R52&&typeof R52.applyBodyPose==='function'){
 window.__STORYWORLD_HOSPITAL_CHARGE_R52__=Object.freeze({...R52,
  applyBodyPose(c,hero=false){const e=scopeEnemy;if(hero||!e||!prefs.motion||reduced()||!c||!(e.hp>0)||e.spawnState==='dead')return R52.applyBodyPose(c,hero);
   try{const m=scopePose||motion(e);stats.poses++;c.translate(m.dx,m.dy-m.bob);if(m.pivot){c.translate(0,-m.pivot);}if(m.lean)c.rotate(m.lean);if(m.sx!==1||m.sy!==1)c.scale(m.sx,m.sy);if(m.pivot){c.translate(0,m.pivot);}return{shear:0,scaleY:m.sy,phase:'r101',angle:0};}
   catch(err){fail(err);return R52.applyBodyPose(c,hero);}},
  hasMotion(e){try{if(prefs.motion&&!reduced()&&e&&e.hp>0&&e.spawnState==='active'&&mobStrength()>0&&mobLod(e)>0)return true;}catch(err){fail(err);}return typeof R52.hasMotion==='function'?R52.hasMotion(e):false;}});}
const enemyBase=drawEnemy;drawEnemy=function(e,...a){const prev=scopeEnemy,prevPose=scopePose;scopeEnemy=e;scopePose=null;
 try{if(prefs.motion&&!reduced()&&e&&e.hp>0&&e.spawnState==='active'&&live())scopePose=motion(e);}catch(err){fail(err);scopePose=null;}
 try{return enemyBase.call(this,e,...a);}finally{scopeEnemy=prev;scopePose=prevPose;}};

// ---- guide continuity ------------------------------------------------------------------
// 1) big maps: when the native planner finds nothing while the guide is on, the R100 grid A*
//    (which covers world wards) supplies the route.
if(typeof findPath==='function'){const fpBase=findPath;findPath=function(from,to){const out=fpBase.apply(this,arguments);
 try{if(prefs.guide&&typeof guide!=='undefined'&&guide&&(!out||!out.length)&&live()&&(arguments[2]===undefined||arguments[2]===room)&&from&&to){const p=POL()?.navPath?.(from,to);if(p?.length>1){stats.guideNav++;return p.slice(1).map(q=>({x:q.x,y:q.y}));}}}catch(e){fail(e);}return out;};}
// 2) stage goals the R75 guide has no view of (world-ward phases, sealed exits): when the
//    guide left the hero idle, walk to the compass goal and use what is there.
let idleSince=0,lastAct=0;
function extendGuide(){if(player.moving||(typeof route!=='undefined'&&route?.length)||(typeof command!=='undefined'&&command)){idleSince=time;return;}
 if(time-idleSince<1||time-lastAct<.6)return;lastAct=time;const g=POL()?.goal?.();if(!g)return;const d=Math.hypot(g.x-player.x,g.y-player.y);
 if(g.kind==='enemy'||g.kind==='boss'){const e=(room.enemies||[]).find(v=>v.hp>0&&Math.abs(v.x-g.x)<.01&&Math.abs(v.y-g.y)<.01);if(e&&d<8&&typeof clearLine==='function'&&clearLine(player,e)){command=e.id;target=e.id;stats.guideActs++;return;}}
 if(d<=1.1){if(g.kind==='objective'&&typeof interact==='function')interact();else if(g.kind==='exit'&&typeof travel==='function'){const dir=window.__STORYWORLD_REGION_ROUTES__?.activeDirection?.();if(dir)travel(dir);}stats.guideActs++;return;}
 const p=POL()?.navPath?.(player,g);if(p?.length>1){route=p.slice(1).map(q=>({x:q.x,y:q.y}));command=null;stats.guideNav++;}}
// World-ward rooms (R78 phases: route → rally → door → boss → exit) are outside the R75
// guide's view, so there the compass goal drives the step instead.
let wardPlan=0,wardKey='',wardStuckAt=0,wardPos=null;
function wardStep(){if(time<wardPlan)return;wardPlan=time+.6;const g=POL()?.goal?.();if(!g)return;const d=Math.hypot(g.x-player.x,g.y-player.y);
 if(g.kind==='enemy'||g.kind==='boss'){const e=(room.enemies||[]).filter(v=>v.hp>0&&v.spawnState==='active').sort((p,q)=>Math.hypot(p.x-g.x,p.y-g.y)-Math.hypot(q.x-g.x,q.y-g.y))[0];
  if(e&&Math.hypot(e.x-player.x,e.y-player.y)<8&&typeof clearLine==='function'&&clearLine(player,e)){command=e.id;target=e.id;route=[];stats.guideActs++;return;}}
 if(d<=1.6){const world=window.__STORYWORLD_WORLD_R74__,near=(world?.interactions?.()||[]).filter(t=>t?.point&&Math.hypot(t.point.x-player.x,t.point.y-player.y)<2.4).sort((p,q)=>Math.hypot(p.point.x-player.x,p.point.y-player.y)-Math.hypot(q.point.x-player.x,q.point.y-player.y));
  for(const t of near){try{if(world.canUse(t)){world.use(t);stats.guideActs++;route=[];return;}}catch(e){fail(e);}}
  if(g.kind==='exit'&&typeof travel==='function'){const dir=window.__STORYWORLD_REGION_ROUTES__?.activeDirection?.();if(dir){travel(dir);stats.guideActs++;return;}}
  if(typeof interact==='function')interact();stats.guideActs++;if(d<=.9){route=[];return;}}
 const key=Math.floor(g.x)+':'+Math.floor(g.y)+':'+g.kind,moved=!wardPos||Math.hypot(player.x-wardPos.x,player.y-wardPos.y)>.15;if(moved){wardPos={x:player.x,y:player.y};wardStuckAt=time;}
 if(key===wardKey&&route?.length&&time-wardStuckAt<1.2)return;wardKey=key;
 const p=POL()?.navPath?.(player,g);if(p?.length>1){route=p.slice(1).map(q=>({x:q.x,y:q.y}));command=null;stats.guideNav++;}}
if(typeof guideStep==='function'){const gsBase=guideStep;guideStep=function(...a){
 try{if(prefs.guide&&typeof guide!=='undefined'&&guide&&live()&&!modal&&!loading&&player.hp>0&&!storyScene&&window.__STORYWORLD_COOP_CLIENT_R62__?.active?.()!==true&&window.__STORYWORLD_WORLD_COMBAT_R78__?.controlled?.(room)===true){wardStep();return;}}catch(e){fail(e);}
 const r=gsBase.apply(this,a);try{if(prefs.guide&&typeof guide!=='undefined'&&guide&&live()&&!modal&&!loading&&player.hp>0&&!storyScene&&window.__STORYWORLD_COOP_CLIENT_R62__?.active?.()!==true)extendGuide();}catch(e){fail(e);}return r;};}
// 3) death: with the guide on, the hero returns to the sanctuary after a short pause and
//    the guide stays on, so a run keeps going without a tap.
let reviveTimer=null,guideAfterHome=false;
if(typeof showDeath==='function'){const sdBase=showDeath;showDeath=function(...a){const was=typeof guide!=='undefined'&&guide;const r=sdBase.apply(this,a);
 try{if(was&&prefs.guide){guideAfterHome=true;clearTimeout(reviveTimer);reviveTimer=setTimeout(()=>{reviveTimer=null;try{const b=document.getElementById('reviveHome');if(guideAfterHome&&b&&typeof modal!=='undefined'&&modal){stats.revives++;b.click();}}catch(e){fail(e);}},4000);if(typeof toast==='function')toast('길잡이 · 4초 뒤 쉼터로 돌아가 여정을 이어갑니다',4);}}catch(e){fail(e);}return r;};}
if(typeof returnHome==='function'){const rhBase=returnHome;returnHome=async function(...a){const keep=guideAfterHome||(typeof guide!=='undefined'&&guide);guideAfterHome=false;const r=await rhBase.apply(this,a);
 try{if(keep&&prefs.guide&&live()){restoreGuide=time+.4;stats.homes=(stats.homes||0)+1;}}catch(e){fail(e);}return r;};}
let restoreGuide=-1;
if(typeof newGame==='function'){const ngBase=newGame;newGame=async function(id,...a){guideAfterHome=false;restoreGuide=-1;clearTimeout(reviveTimer);reviveTimer=null;if(pickedHero&&HEROES?.[pickedHero]){id=pickedHero;stats.picks++;}pickedHero=null;return ngBase.call(this,id,...a);};}
// 4) the compass is a guide toggle
function toggleGuide(){try{guide=!guide;auto=guide;guideTimer=0;window.__STORYWORLD_GUIDE_R77__?.syncGuide?.();if(typeof toast==='function')toast('길잡이 '+(guide?'ON':'OFF'),2);}catch(e){fail(e);}}

// ---- co-op start: a hero row on the new-game slot panel ---------------------------------
let pickedHero=null;
function heroRow(){const panel=document.getElementById('panel'),actions=panel?.querySelector?.('.actions');if(!panel||!actions||document.getElementById('heroRowR101')||typeof HEROES==='undefined')return;
 const wrap=document.createElement('div');wrap.id='heroRowR101';const title=document.createElement('p');title.className='small';wrap.appendChild(title);const row=document.createElement('div');row.className='heroRowR101';wrap.appendChild(row);
 let selected=pickedHero&&HEROES[pickedHero]?pickedHero:'hwando';pickedHero=selected;
 const paint=()=>{const h=HEROES[selected];title.textContent='시작 영웅 · '+h.name+' — '+h.passive;for(const b of row.children)b.classList.toggle('selected',b.dataset.hero===selected);};
 for(const[id,h]of Object.entries(HEROES)){const b=document.createElement('button');b.type='button';b.dataset.hero=id;b.title=h.name+' · '+h.special;b.style.setProperty('--c',rgba(fxOf(id).a,1));
  try{const img=document.createElement('img');img.src=urlFor(heroArt[id].idle.front);img.alt=h.name;b.appendChild(img);}catch(_){}
  const s=document.createElement('span');s.textContent=h.name;b.appendChild(s);b.onclick=ev=>{ev?.preventDefault?.();selected=id;pickedHero=id;paint();};row.appendChild(b);}
 paint();actions.parentNode.insertBefore(wrap,actions);}
if(typeof openPanel==='function'){const opBase=openPanel;openPanel=function(html,...a){const r=opBase.call(this,html,...a);try{if(typeof html==='string'&&html.includes('slotConfirmR73')&&html.includes('처음부터 시작'))heroRow();}catch(e){fail(e);}return r;};}

// ---- co-op relay compatibility ---------------------------------------------------------
// The public relay still runs the R62 build and refuses the R63R1 handshake. The room
// protocol is otherwise the same, so on VERSION_MISMATCH the socket is reopened once and
// the handshake repeated with the relay's build. Redeploying the relay removes the need.
const RELAY_BUILDS=['R62'];
if(typeof WebSocket==='function'&&!WebSocket.__r101){
 const Native=WebSocket;
 class RelaySocket{
  constructor(url,protocols){this._url=String(url);this._protocols=protocols;this._handshake=null;this._retried=false;this._closedByUs=false;this.onopen=null;this.onmessage=null;this.onclose=null;this.onerror=null;this._listeners={};this._open(false);}
  get url(){return this._url;}
  _open(retry){const ws=this._ws=new Native(this._url,this._protocols);const me=this;
   ws.onopen=ev=>{if(ws!==me._ws)return;if(retry){const m={...me._handshake,build:RELAY_BUILDS[me._retried-1]};try{ws.send(JSON.stringify(m));}catch(e){fail(e);}return;}me._emit('open',ev);};
   ws.onmessage=ev=>{if(ws!==me._ws)return;try{const m=JSON.parse(ev.data);if(m?.type==='error'&&m.code==='VERSION_MISMATCH'&&me._handshake&&me._retried<RELAY_BUILDS.length&&!me._closedByUs){me._retried++;stats.relayRetries++;ws.onclose=null;ws.onerror=null;try{ws.close();}catch(_){}me._open(true);if(typeof toast==='function')toast('중계 서버가 옛 빌드(R62)로 동작 중 · 호환 모드로 다시 접속합니다',4);return;}}catch(_){}me._emit('message',ev);};
   ws.onclose=ev=>{if(ws!==me._ws)return;me._emit('close',ev);};
   ws.onerror=ev=>{if(ws!==me._ws)return;me._emit('error',ev);};}
  _emit(type,ev){const fn=this['on'+type];if(typeof fn==='function')try{fn.call(this,ev);}catch(e){fail(e);}for(const l of this._listeners[type]||[])try{l.call(this,ev);}catch(e){fail(e);}}
  addEventListener(type,fn){(this._listeners[type]=this._listeners[type]||[]).push(fn);}
  removeEventListener(type,fn){const l=this._listeners[type];if(l){const i=l.indexOf(fn);if(i>=0)l.splice(i,1);}}
  send(data){try{if(typeof data==='string'&&!this._handshake){const m=JSON.parse(data);if(m&&['create','join','reconnect'].includes(m.type)&&m.gameId&&m.build)this._handshake=m;}}catch(_){}return this._ws.send(data);}
  close(code,reason){this._closedByUs=true;return this._ws.close(code,reason);}
  get readyState(){return this._ws.readyState;}get protocol(){return this._ws.protocol;}get extensions(){return this._ws.extensions;}get bufferedAmount(){return this._ws.bufferedAmount;}
  get binaryType(){return this._ws.binaryType;}set binaryType(v){this._ws.binaryType=v;}
 }
 for(const k of['CONNECTING','OPEN','CLOSING','CLOSED'])RelaySocket[k]=Native[k];
 RelaySocket.__r101=true;RelaySocket.native=Native;
 // Only relay sockets (…/ws) are wrapped; anything else gets the native class.
 const Pick=function(url,protocols){if(!new.target)throw TypeError('WebSocket constructor requires new');return /\/ws(\?|$)/.test(String(url))?new RelaySocket(url,protocols):new Native(url,protocols);};
 Pick.prototype=Native.prototype;for(const k of['CONNECTING','OPEN','CLOSING','CLOSED'])Pick[k]=Native[k];Pick.__r101=true;Pick.native=Native;Pick.RelaySocket=RelaySocket;
 try{window.WebSocket=Pick;}catch(e){fail(e);}
}

// ---- HUD: compass toggle, hurt vignette, settings -------------------------------------------
const style=document.createElement('style');style.id='polishStyleR101';style.textContent=`
#navCompassR100{pointer-events:auto!important;cursor:pointer;-webkit-tap-highlight-color:transparent}
#navCompassR100.guideOn .ring{border-color:#7fe0a8;box-shadow:0 0 0 1px #000a,0 0 12px #7fe0a888,inset 0 0 8px #000}
#navCompassR100 .guideR101{font-size:9px;line-height:1.15;color:#9be5b8;text-align:center;white-space:normal;max-width:92px}
#navCompassR100.guideOn .guideR101{color:#c9f3d8}
#hurtFlashR101{position:absolute;inset:0;pointer-events:none;z-index:3;opacity:0;background:radial-gradient(ellipse at 50% 50%,transparent 46%,rgba(190,24,34,.6) 100%);transition:opacity .08s linear}
#heroRowR101{margin:6px 0 2px}#heroRowR101 p{margin:0 0 6px;color:#e8dcc0}
.heroRowR101{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:4px 0 8px}
.heroRowR101 button{width:72px;padding:4px 2px;border-radius:8px;border:2px solid #4a4336;background:#141a20;color:#e8dcc0;font:11px 'Malgun Gothic',sans-serif;cursor:pointer}
.heroRowR101 button img{width:44px;height:52px;object-fit:contain;display:block;margin:0 auto 2px}
.heroRowR101 button.selected{border-color:var(--c);box-shadow:0 0 10px var(--c);background:#1d2a2f;color:#fff}
@media (pointer:coarse){.heroRowR101 button{width:64px}.heroRowR101 button img{width:40px;height:46px}}`;
document.head.appendChild(style);
let compassTag=null,hudAt=0,lastFrame=0;
function hud(){const now=performance.now(),dt=lastFrame?Math.min(.1,(now-lastFrame)/1000):0;lastFrame=now;
 if(hurtFlash>0){hurtFlash=Math.max(0,hurtFlash-dt*3.2);if(!flashEl){const stage=document.getElementById('stage');if(stage){flashEl=document.createElement('div');flashEl.id='hurtFlashR101';flashEl.setAttribute('aria-hidden','true');stage.appendChild(flashEl);}}
  if(flashEl)flashEl.style.opacity=(hurtFlash*hurtFlash*.9).toFixed(3);}
 else if(flashEl&&flashEl.style.opacity!=='0')flashEl.style.opacity='0';
 if(now-hudAt<120)return;hudAt=now;
 const c=document.getElementById('navCompassR100');if(c){if(!c.__r101){c.__r101=true;c.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();toggleGuide();});c.addEventListener('touchend',ev=>{ev.preventDefault();ev.stopPropagation();toggleGuide();},{passive:false});compassTag=document.createElement('span');compassTag.className='guideR101';c.appendChild(compassTag);}
  const on=typeof guide!=='undefined'&&!!guide;c.classList.toggle('guideOn',on);const text=on?'길잡이 ON · 탭: 끄기':'탭: 길잡이 ON';if(compassTag&&compassTag.textContent!==text)compassTag.textContent=text;}}
const drawBase=draw;draw=function(...a){const r=drawBase.apply(this,a);try{hud();}catch(e){fail(e);}return r;};

// ---- lifecycle --------------------------------------------------------------------------------
let heroSeen=null;
const tickBase=tick;tick=function(dt){const r=tickBase.call(this,dt);try{if(live()&&!modal&&!loading){
 const s=stateOf(player);const egoOn=player.ego>0,samOn=player.samong>0;
 if(prefs.aura&&(egoOn&&!s.egoWas||samOn&&!s.samongWas))add({kind:'powerUp',x:player.x,y:player.y,F:heroOf(player),life:.75});
 s.egoWas=egoOn;s.samongWas=samOn;
 if(restoreGuide>=0&&time>=restoreGuide&&!loading){restoreGuide=-1;if(prefs.guide&&player.hp>0){guide=true;auto=true;guideTimer=0;window.__STORYWORLD_GUIDE_R77__?.syncGuide?.();if(typeof toast==='function')toast('길잡이 · 여정을 이어갑니다',2.5);}}
 if(heroSeen!==player.hero){heroSeen=player.hero;preloadHero(player.hero);}
 for(let i=list.length-1;i>=0;i--)if(age(list[i])>list[i].life)list.splice(i,1);
 if(list.length&&!effects.includes(SENTINEL)){SENTINEL.age=0;effects.push(SENTINEL);}}}catch(e){fail(e);}return r;};
if(typeof enterRegion==='function'){const eb=enterRegion;enterRegion=async function(...a){const r=await eb.apply(this,a);list.length=0;try{if(player)preloadHero(player.hero);}catch(e){fail(e);}return r;};}
if(typeof stopEffects==='function'){const sb=stopEffects;stopEffects=function(...a){list.length=0;return sb.apply(this,a);};}
function settingsSection(){const host=document.getElementById('retroSettingsR100')||document.getElementById('retroSettingsR98World')||document.getElementById('retroSettingsR98Vfx')||document.getElementById('retroSettingsR93');if(!host||document.getElementById('retroSettingsR101'))return;
 const s=document.createElement('section');s.id='retroSettingsR101';s.innerHTML='<h3>R101 전투 연출</h3><p class="small muted">영웅 고유색 연출·타격감·잡몹 움직임은 보이는 것만 바꾸며 피해·판정·저장은 그대로입니다. 길잡이 자동 진행은 길잡이가 켜져 있을 때만 동작합니다.</p>'+Object.keys(DEFAULTS).map(k=>'<label><input type="checkbox" id="r101-'+k+'"> '+LABELS[k]+'</label> ').join('');
 host.parentNode.insertBefore(s,host.nextSibling);for(const k of Object.keys(DEFAULTS)){const el=s.querySelector('#r101-'+k);el.checked=prefs[k];el.onchange=()=>set({[k]:el.checked});}}
if(typeof showSettings==='function'){const sb=showSettings;showSettings=function(...a){const r=sb.apply(this,a);try{settingsSection();}catch(e){fail(e);}return r;};}

window.__STORYWORLD_POLISH_R101__=Object.freeze({revision:'R101-polish',prefs:()=>({...prefs}),set,palette:id=>({...fxOf(id)}),heat:()=>live()?heat(player):0,motion:e=>e?{...motion(e)}:null,
 // R108: the pose worked out for the mob being drawn right now (null outside a mob draw) and a hit note for tests
 poseNow:()=>scopePose,noteHit:(e,dmg,skill=false)=>{noteHit(e,dmg,skill);return !!flinch.get(e);},
 effects:()=>list.map(e=>({kind:e.kind,age:age(e),life:e.life})),pickedHero:()=>pickedHero,toggleGuide,
 inspect:()=>({revision:'R101-polish',prefs:{...prefs},stats:{...stats},effects:list.length,tier:live()?tierOf(player):null,lastError,relayBuilds:[...RELAY_BUILDS],presentationOnly:true,gameplayChanged:false,savesTouched:false})});
})();
