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
function tierOf(p){try{const t=R102()?.tier?.(p);return Number.isFinite(t)?clamp(Math.round(t),0,7):2;}catch(e){fail(e);return 2;}}

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
// R111: 7단계(0=성장 전, 1~7)마다 한 칸씩 진해진다.
const HEAT_BASE=[.05,.08,.12,.16,.2,.24,.28,.32];
function heat(p,t=tierOf(p)){let k=HEAT_BASE[t]??.16;if(p.skillAnim>0)k+=.12+.035*t;if(p.ego>0)k+=.38;if(p.samong>0)k+=.5;if(finite(p.resonance)>=30)k+=.06;return clamp(k,0,1.3);}

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
// R111: 7단계 — 2 희미하게 일부, 3·4·5·6 조금씩 더 보이고, 7(과 EGO/사몽) 전부.
const FORM7=[null,null,{alpha:.4,cut:3},{alpha:.55,cut:2},{alpha:.7,cut:2},{alpha:.8,cut:1},{alpha:.9,cut:1},{alpha:1,cut:0}];
function formLevel(p,t){if(p.ego>0||p.samong>0)return{on:true,alpha:1,cut:0};const f=FORM7[clamp(t,0,7)];return f?{on:true,...f}:{on:false,alpha:0,cut:9};}
function auraBack(p){const F=heroOf(p),t=tierOf(p),k=heat(p,t),L=formLevel(p,t),q=project(p.x,p.y),h=actorHeight(),lift=clamp(finite(p.visualLiftPx),0,h*.65),fy=q.y-lift,seed=hash(p.hero||'hwando')%628/100,awake=p.ego>0||p.samong>0;
 scope({id:'r101:aura-back:'+String(p.coopIdR62||p.id||'hero'),kind:'effect',x:p.x,y:p.y,groundAligned:false,r101:true},()=>{ctx.save();try{
  groundGlow(q,h,F,k);if(t>=1||awake)field(q.x,fy,h,F,k);
  if(L.on){ctx.globalAlpha*=L.alpha;
   if(F.form==='runes'&&(t>=4||awake))runeRing(q,h,F,Math.max(k,.5+.08*Math.max(0,t-3)));
   if(F.form==='flame'||F.form==='dark'||awake)flames(q.x,fy,h,F,F.form==='dark'?'dark':'bright',k*(F.form==='flame'||F.form==='dark'?1:.8),seed);
   if(F.form==='angel'&&(t>=5||awake)||p.samong>0)wings(q.x,fy,h,F,k,seed,p);
   // R107: no idle orbiting crescent blades for 환도 (looked odd); the iai cast carries the sword light now.
   if(F.form==='blade'&&BLADE_ORBIT)blades(q.x,fy,h,F,k,seed,'back',4-L.cut);
   if(F.form==='arcs'){const S4=SPR();if(S4)S4.draw('circuit',F,q.x,q.y,h*(1+.06*t),h*(1+.06*t),{squash:.5,angle:time*.5,alpha:.18+.08*t+(awake?.2:0)});}
   orbs(p,q.x,fy,h,F,k,seed,'back',L.cut);}
 }finally{ctx.restore();}});stats.auraDraws++;}
function auraFront(p){const F=heroOf(p),t=tierOf(p),k=heat(p,t),L=formLevel(p,t),q=project(p.x,p.y),h=actorHeight(),lift=clamp(finite(p.visualLiftPx),0,h*.65),fy=q.y-lift,seed=hash(p.hero||'hwando')%628/100;
 if(!L.on)return;
 scope({id:'r101:aura-front:'+String(p.coopIdR62||p.id||'hero'),kind:'effect',x:p.x,y:p.y,groundAligned:false,r101:true},()=>{ctx.save();try{ctx.globalAlpha*=L.alpha;
  if(F.form==='angel'&&(t>=5||p.ego>0||p.samong>0)||p.samong>0)wingsView(p,'front',q.x,fy,h,F,k,seed);
  if(F.form==='angel'||p.samong>0)halo(q.x,fy,h,F,k);
  // R111: 네온의 가는 번개 실선(실오라)은 뺐다. 대신 발밑 회로 문양이 단계에 따라 진해진다(뒤쪽 그리기).
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
 const ang=Math.atan2(e.y-player.y,e.x-player.x),sa=screenAngle(ang),strength=(1.12+.06*t)*(boss?1.2:1);
 add({kind:'heroHit',x,y,lift:bodyLift(e),tgt:e,F,sa,size:h*(boss?1.45:1.05)*strength,life:.34+.12*(strength-1),seed:Math.random()*6,heavy:t>=1,tier:t});
 flinch.set(e,{at:time,dx:Math.cos(sa),dy:Math.sin(sa),k:boss?.35:1});
 if(!reduced()&&typeof shake==='number'){const want=.3+.035*t;if(want>shake)shake=want;}
 stats.hits++;}
const hitBase=hitEnemy;hitEnemy=function(e,value,source,...rest){const before=e?.hp;let heroId=null;
 try{if(prefs.hitfx&&live())heroId=skillHit(source,typeof e568HeroActionContext!=='undefined'?e568HeroActionContext:null);}catch(err){fail(err);}
 const r=hitBase.call(this,e,value,source,...rest);
 try{if(heroId&&e&&Number.isFinite(before)&&e.hp<before&&(R102()?.PALETTE?.[heroId]||HERO_FX[heroId]))onHeroHit(e,heroId);}catch(err){fail(err);}return r;};

// ---- hit feel: enemy → hero -----------------------------------------------------------
let hurtFlash=0,flashEl=null;
function ownerOf(source){if(!source||!room?.enemies)return null;return room.enemies.find(e=>e===source||e.id===source.owner||e.id===source.ownerId||e===source.owner)||null;}
function onHeroHurt(source){const owner=ownerOf(source);let colour=POL()?.colourOf?.(owner)||'red',rgb=SIGDATA()?.sigColours?.[colour]||[235,52,52];const h=actorHeight();
 // R120: 옅은·흰 고유색(pale 등, 채도 낮음)은 더하기 합성에서 흰 빛으로 타 버려 맞은 느낌이 안 났다 -> 붉은 피 색으로 바꾼다.
 if(Math.max(...rgb)-Math.min(...rgb)<70||Math.min(...rgb)>150){colour='red';rgb=SIGDATA()?.sigColours?.red||[235,52,52];}
 const from=owner||(Number.isFinite(source?.x)?source:null),ang=from?Math.atan2(player.y-from.y,player.x-from.x):Math.random()*TAU,sa=screenAngle(ang);
 add({kind:'heroHurt',x:player.x,y:player.y,lift:h*.5,colour,rgb,sa,life:.42,seed:Math.random()*6});
 const s=stateOf(player);s.hurtAt=time;s.hurtDx=Math.cos(sa);hurtFlash=1;stats.hurts++;}
const hurtBase=hurt;hurt=function(damage,source,...rest){const before=player?.hp;const r=hurtBase.call(this,damage,source,...rest);try{if(prefs.hitfx&&live()&&Number.isFinite(before)&&player.hp<before)onHeroHurt(source);}catch(err){fail(err);}return r;};
// Hero flinch: the native R48 pose hook runs inside the body draw, after translate(feet).
const R48=window.__STORYWORLD_COMBAT_SYNC_R48__;
if(R48&&typeof R48.applyBodyPose==='function'){const poseBase=R48.applyBodyPose;window.__STORYWORLD_COMBAT_SYNC_R48__=Object.freeze({...R48,applyBodyPose(c,hero=false){const r=poseBase(c,hero);
 try{if(hero&&prefs.hitfx&&!reduced()&&live()&&c){const s=heroState.get(player);if(s){const u=(time-s.hurtAt)/.26;if(u>=0&&u<1){const g=Math.sin(Math.PI*u)*(1-u*.5);c.translate(s.hurtDx*5*Z()*g,0);c.rotate(s.hurtDx*.07*g);c.scale(1+.05*g,1-.06*g);}}}}catch(e){fail(e);}return r;}});}

// ---- drawing of own effects ---------------------------------------------------------
// R111: 적중 섬광도 7단계 — 성장 전(0단계)엔 작은 불티만, 단계가 오를수록 커지고 진해진다(흰 섬광이 화면을 덮지 않게).
function drawHeroHit(e,t){let q=project(e.x,e.y),y=q.y-e.lift;const vc115=e.tgt&&window.__STORYWORLD_PLAY_R115__?.centreOf?.(e.tgt);if(vc115){q={x:vc115.cx,y:q.y};y=vc115.cy;}// R115: 그림의 실제 중심
 const F=e.F,k=1-t,ease=k*k,T=e.tier??2,s=e.size*(.8+.35*(1-ease))*(.42+.083*clamp(T,0,7)),round=player?.hero==='gunner'; // R121: 기억사수는 사선(/) 표시 없이 원형만(사용자)
 if(T>=1&&!round)sig('hit',F.sig,q.x,y,t,s*1.15,{alpha:(.35+.05*clamp(T,0,7))*fadeOut(t),glow:(.08+.03*clamp(T,0,7))*ease});

 if(T>=4&&F.sig2&&!round)sig('hit',F.sig2,q.x,y,Math.min(.999,t*1.1),s*.8,{alpha:.7*fadeOut(t),glow:.2*ease});
 if(e.heavy&&player?.hero!=='gunner')sig('slash',F.sig,q.x,y,Math.min(.999,t*1.15),s*1.35,{angle:e.sa+Math.PI,alpha:.85*fadeOut(t,.5),glow:.3*ease});
 ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
 disc(q.x,y,s*.22*(1-ease*.5),rgba(F.b,.55*ease*ease));
 // R111: 가는 실선 고리(실오라)는 뺐다 — 그림 텍스처 고리로 대신.
 {const S1=SPR();if(S1)S1.draw('ring',F,q.x,y,s*.9*(.35+.65*(1-ease)),s*.54*(.35+.65*(1-ease)),{alpha:.7*ease});}
 const n=round?0:lowFx()?4:5+T,reach=e.size/actorHeight();for(let i=0;i<n;i++){const a=e.sa+(rnd(e.seed,i)-.5)*1.9,len=(14+30*rnd(e.seed,i+9))*Z()*reach,d=len*(.3+1.1*(1-ease));
  const x0=q.x+Math.cos(a)*d*.5,y0=y+Math.sin(a)*d*.5*.7,x1=q.x+Math.cos(a)*d,y1=y+Math.sin(a)*d*.7;ctx.strokeStyle=rgba(i%2?F.b:F.a,.95*ease);ctx.lineWidth=Math.max(1.2,(3.2-2*t)*Z());ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();}
 if(T>=2){const S2=SPR();if(S2)S2.draw('ring',F,q.x,q.y,s*1.5*(1-ease*.5),s*.75*(1-ease*.5),{alpha:.5*ease});}}
function drawHeroHurt(e,t){const q=project(e.x,e.y),y=q.y-e.lift,k=1-t,ease=k*k,h=actorHeight(),s=h*1.1;
 sig('hit',e.colour,q.x,y,t,s,{alpha:.85*fadeOut(t),glow:.3*ease});
 ctx.globalCompositeOperation='lighter';ctx.lineCap='round';const n=lowFx()?3:5;
 for(let i=0;i<n;i++){const a=e.sa+(rnd(e.seed,i)-.5)*1.4,d=(8+18*rnd(e.seed,i+5))*Z()*(.3+1.1*(1-ease));ctx.strokeStyle=rgba(i%2?[255,120,120]:e.rgb,.85*ease);ctx.lineWidth=Math.max(1,2*Z()*k);ctx.beginPath();ctx.moveTo(q.x+Math.cos(a)*d*.5,y+Math.sin(a)*d*.35);ctx.lineTo(q.x+Math.cos(a)*d,y+Math.sin(a)*d*.7);ctx.stroke();}}
function drawPowerUp(e,t){const q=project(e.x,e.y),h=actorHeight(),lift=clamp(finite(player?.visualLiftPx),0,h*.65);pillar(q.x,q.y-lift,h,e.F,t);
 const k=1-t,S3=SPR();if(S3)S3.draw('ring',e.F,q.x,q.y,h*(.6+2.8*smooth(t)),h*(.3+1.4*smooth(t)),{alpha:.8*k});}
function drawDust(e,t){const q=project(e.x,e.y),k=1-t,h=actorHeight();ctx.globalCompositeOperation='source-over';for(let i=0;i<3;i++){const a=e.seed+i*2.1,d=(3+9*t)*Z()*e.scale,r=(2.2+3.5*t)*Z()*e.scale;ctx.fillStyle=rgba([205,192,168],.3*k*k);ctx.beginPath();ctx.ellipse(q.x+Math.cos(a)*d,q.y+Math.sin(a)*d*.45-t*4*Z(),r,r*.6,0,0,TAU);ctx.fill();}void h;}
const DRAW={heroHit:drawHeroHit,heroHurt:drawHeroHurt,powerUp:drawPowerUp,dust:drawDust};
function drawOwn(){if(!list.length||typeof ctx==='undefined'||!ctx)return;for(const e of list){const fn=DRAW[e.kind];if(!fn)continue;const t=age(e)/e.life;if(t<0||t>1)continue;
 ctx.save();try{scope({id:e.id,kind:'effect',x:e.x,y:e.y,r101:true},()=>fn(e,t));}catch(err){fail(err);}finally{ctx.restore();}}}
const effectBase=drawEffect;drawEffect=function(e){if(e&&e.type==='r101-air'){try{drawOwn();}catch(err){fail(err);}return;}return effectBase.apply(this,arguments);};

// ---- mob motion: bob, lean, squash and wing beats instead of shear -------------------
// The native body painter translates to the feet, then asks the pose chain for a
// transform. R52 (the chain's head) is swapped for a copy whose pose is ours.
const mobState=new WeakMap();
let scopeEnemy=null;
function mobOf(e){let s=mobState.get(e);if(!s){s={x:e.x,y:e.y,t:time,phase:0,spd:0,vx:0,vy:0,gait:0,dustAt:-9,land:false};mobState.set(e,s);}return s;}
function isFlyer(e){try{return !!POL()?.artOf?.(e)?.fly||finite(e.visualLiftPx)>0;}catch(_){return finite(e.visualLiftPx)>0;}}
function bodyPx(e){return actorHeight()*finite(e.combatProfile?.spriteRect?.height,1)*finite(e.defScale,1);}
function onScreen(e){const q=project(e.x,e.y);return q.x>-80&&q.x<W+80&&q.y>-120&&q.y<H+80;}
function motion(e){const s=mobOf(e),dt=clamp(time-s.t,0,.1),major=!!(e.boss||e.midboss||e.persona),amp=(major?.45:1)*(lowFx()?.7:1),h=bodyPx(e);
 if(dt>0){const vx=(e.x-s.x)/dt,vy=(e.y-s.y)/dt;s.vx=lerp(s.vx,vx,.4);s.vy=lerp(s.vy,vy,.4);s.spd=lerp(s.spd,Math.hypot(vx,vy),.35);s.x=e.x;s.y=e.y;s.t=time;}
 const moving=!!e.moving||s.spd>.35,fly=isFlyer(e),seed=hash(e.id)%628/100;
 let dx=0,bob=0,lean=0,sx=1,sy=1,pivot=0;
 // screen-horizontal travel direction (iso: screen x grows with x-y)
 const sdir=clamp((s.vx-s.vy)/2.5,-1,1);
 if(fly){bob=Math.sin(time*2.6+seed)*h*.025*amp;const beat=Math.sin(time*(moving?12:7.5)+seed);sy=1+.045*beat*amp;sx=1-.018*beat*amp;lean=sdir*.1*amp;pivot=h*.55;}
 else if(moving){if(dt>0)s.phase+=dt*(6.5+s.spd*4.2)*(major?.75:1);const g=Math.sin(s.phase);bob=Math.abs(g)*h*.05*amp;lean=sdir*.055*amp+g*.028*amp;sy=1+.035*Math.cos(2*s.phase)*amp;sx=1-(sy-1)*.6;
  const landing=Math.abs(s.gait)>.3&&Math.abs(g)<=.3;s.gait=g;if(landing&&s.spd>1&&time-s.dustAt>.25&&!lowFx()&&list.length<MAX-6&&onScreen(e)){s.dustAt=time;add({kind:'dust',x:e.x,y:e.y,life:.38,seed:Math.random()*6,scale:clamp(h/actorHeight(),.6,1.6)});stats.dust++;}}
 else{if(dt>0)s.phase+=(Math.round(s.phase/Math.PI)*Math.PI-s.phase)*Math.min(1,dt*10);s.gait=0;sy=1+.012*Math.sin(time*2.2+seed)*amp;}
 // attack: rear back through the windup, lunge through the active window (rotation, not shear)
 const a=e.attack;if(a&&Number.isFinite(a.elapsed)){const shape=a.shape154||e.combatProfile?.attackShape||{},windup=Math.max(.05,a.castWindup150??shape.windup??.3),active=Math.max(.05,shape.active??.15),u=a.elapsed/windup;
  const ang=Number.isFinite(a.angle)?a.angle:Math.atan2((player?.y??e.y)-e.y,(player?.x??e.x)-e.x),sign=Math.cos(screenAngle(ang));
  if(u<1){const g=smooth(u);lean-=sign*.07*g*amp;sy*=1+.03*g*amp;dx-=sign*2*Z()*g*amp;}else{const g=1-smooth((a.elapsed-windup)/(active+.18));lean+=sign*.14*g*amp;sx*=1+.06*g*amp;sy*=1-.05*g*amp;dx+=sign*5*Z()*g*amp;}}
 else if(e.rangedWindup>0){lean-=sdir*.02;sy*=1+.025*amp;}
 // hit flinch: pushed along the blow, squashed, then settles
 // (a plain hit only nudges: the native hit timer drives a small push away from the hero)
 const f=flinch.get(e);let fu=f?(time-f.at)/.22:2,fk=f?.k??1,fdx=f?.dx;
 if(!(fu>=0&&fu<1)&&e.hitTimer>0){fu=1-clamp(e.hitTimer/.14,0,1);fk=major?.15:.4;fdx=player?Math.cos(screenAngle(Math.atan2(e.y-player.y,e.x-player.x))):null;}
 if(fu>=0&&fu<1){const g=Math.sin(Math.PI*fu)*(1-fu*.4)*fk*amp,ddx=fdx??(sdir||1);dx+=ddx*7*Z()*g;sx*=1+.12*g;sy*=1-.1*g;lean+=ddx*.06*g;}
 return{dx,bob,lean,sx,sy,pivot};}
const R52=window.__STORYWORLD_HOSPITAL_CHARGE_R52__;
if(R52&&typeof R52.applyBodyPose==='function'){
 window.__STORYWORLD_HOSPITAL_CHARGE_R52__=Object.freeze({...R52,
  applyBodyPose(c,hero=false){const e=scopeEnemy;if(hero||!e||!prefs.motion||reduced()||!c||!(e.hp>0)||e.spawnState==='dead')return R52.applyBodyPose(c,hero);
   try{const m=motion(e);stats.poses++;c.translate(m.dx,-m.bob);if(m.pivot){c.translate(0,-m.pivot);}if(m.lean)c.rotate(m.lean);if(m.sx!==1||m.sy!==1)c.scale(m.sx,m.sy);if(m.pivot){c.translate(0,m.pivot);}return{shear:0,scaleY:m.sy,phase:'r101',angle:0};}
   catch(err){fail(err);return R52.applyBodyPose(c,hero);}},
  hasMotion(e){try{if(prefs.motion&&!reduced()&&e&&e.hp>0){if(e.moving||e.attack||e.rangedWindup>0||e.hitTimer>0||isFlyer(e))return true;const f=flinch.get(e);if(f&&time-f.at<.3)return true;const s=mobState.get(e);if(s&&s.spd>.35)return true;}}catch(err){fail(err);}return typeof R52.hasMotion==='function'?R52.hasMotion(e):false;}});}
const enemyBase=drawEnemy;drawEnemy=function(e,...a){const prev=scopeEnemy;scopeEnemy=e;try{return enemyBase.call(this,e,...a);}finally{scopeEnemy=prev;}};

// ---- guide continuity ------------------------------------------------------------------
// 1) big maps: when the native planner finds nothing while the guide is on, the R100 grid A*
//    (which covers world wards) supplies the route.
if(typeof findPath==='function'){const fpBase=findPath;findPath=function(from,to){const out=fpBase.apply(this,arguments);
 try{if(prefs.guide&&typeof guide!=='undefined'&&guide&&(!out||!out.length)&&live()&&(arguments[2]===undefined||arguments[2]===room)&&from&&to){const p=POL()?.navPath?.(from,to);if(p?.length>1){stats.guideNav++;return p.slice(1).map(q=>({x:q.x,y:q.y}));}}}catch(e){fail(e);}return out;};}
// 2) stage goals the R75 guide has no view of (world-ward phases, sealed exits): when the
//    guide left the hero idle, walk to the compass goal and use what is there.
let idleSince=0,lastAct=0;
// R134 길잡이 전수조사(사용자 2026-10-30):
//  ① 저장을 불러오거나 이어하기로 시작하면 저장해 둔 길잡이 켜짐이 그대로 살아나 '처음부터 길잡이가 켜져' 있었다 — 불러온 뒤에는 끈다(켜는 건 사람).
//  ② 새 지역에 들어갈 때 도착 위치 맞추기가 불러오기 뒤(약 1~2초 늦게) 영웅을 포탈 도착점으로 옮겨, 그 사이 이미 걷기 시작한 길잡이가
//     순간이동한 뒤 옛 경로 쪽으로 되돌아 걸었다(되돌아감·방향 뒤집힘) — 들어가는 중에는 길잡이를 쉬고, 다 들어가면 경로를 새로 짠다.
//  ③ 길 찾기 경로 점이 0.25칸마다 있어, 점에 닿는 장면마다 영웅이 그 점에 멈춰 한 장면 쉬었다(걸음이 뚝뚝 끊김) — 한 걸음 안의 점은 미리 건너뛴다.
let entering=0,enterAt=0;const enteringNow=()=>entering>0&&Date.now()-enterAt<4000;// 들어가기가 끝나지 않아도 4초 뒤에는 길잡이를 다시 움직인다
for(const fn of ['restoreSave','normalizeSave3']){try{const f=globalThis[fn];if(typeof f!=='function')continue;globalThis[fn]=function(...a){const r=f.apply(this,a);try{if(window.__STORYWORLD_COOP_SIM_R62__?.mode?.()==='off'||!window.__STORYWORLD_COOP_SIM_R62__){guide=false;stats.guideLoadOff=(stats.guideLoadOff||0)+1;}}catch(e){fail(e);}return r;};}catch(e){fail(e);}}
if(typeof enterRegion==='function'){const erBase=enterRegion;enterRegion=async function(...a){entering++;enterAt=Date.now();try{return await erBase.apply(this,a);}finally{entering=Math.max(0,entering-1);
 try{if(!entering&&typeof guide!=='undefined'&&guide){route=[];command=null;guideTimer=0;stats.guideReplans=(stats.guideReplans||0)+1;}}catch(e){fail(e);}}};}
if(typeof tick==='function'){const tkBase=tick;tick=function(dt,...a){
 try{if(enteringNow()&&typeof guide!=='undefined'&&guide&&route?.length){route=[];}
  else if(started&&!modal&&!loading&&player&&route?.length>1&&keys.size===0&&Math.hypot(joystickVector.x,joystickVector.y)<.08&&Number.isFinite(dt)&&dt>0){
   const step=SPEED*dt+.04;let n=0;while(route.length>1&&n<4&&Math.hypot(route[0].x-player.x,route[0].y-player.y)<step){route.shift();n++;}if(n)stats.routeSkips=(stats.routeSkips||0)+n;}}catch(e){fail(e);}
 return tkBase.call(this,dt,...a);};}
//  ④ 나침반 목표는 출구인데 그 출구가 몹 무리를 처치해야 열리는 경우(dist00 '침식된 명령의 봉인 해제'), 길잡이가 닫힌 문 앞에서
//     0.6초마다 이동만 시도하며('안전한 문 접근점을 찾지 못했습니다') 몹이 살아 있는 채로 멈췄다 — R75 길잡이 목표가 몹이면 그 몹부터 친다.
function chasePackGoal(g){try{if(!g||(g.kind!=='exit'&&g.kind!=='portal'))return false;const g75=window.__STORYWORLD_GUIDE_R75__?.currentGoal?.();
 if(g75?.kind!=='enemy'||!g75.point)return false;const pt=g75.point,live=(room.enemies||[]).filter(v=>v.hp>0&&v.spawnState!=='dead');
 const e=live.find(v=>v.id===pt.id)||live.filter(v=>Math.hypot(v.x-pt.x,v.y-pt.y)<4).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];if(!e)return false;
 const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<8&&typeof clearLine==='function'&&clearLine(player,e)){command=e.id;target=e.id;route=[];}
 else{const p=POL()?.navPath?.(player,e)||(typeof findPath==='function'?findPath(player,e):null);if(p?.length>1){route=p.slice(1).map(q=>({x:q.x,y:q.y}));command=null;}else return false;}
 stats.guidePack=(stats.guidePack||0)+1;return true;}catch(e){fail(e);return false;}}
// R134 (사용자 2026-10-30 "길잡이 버그"): 길잡이가 출구에서 travel 을 바로 불러 R77 '다음 서사 맵은 노말' 표시를 건너뛰었다 —
//  난이도 선택 창이 열린 채 길잡이가 멈췄다(쉼터 → 첫 기억에서 재현). 원래 길잡이처럼 노말 표시를 먼저 걸고 이동한다.
function guideTravel(dir){const G=window.__STORYWORLD_GUIDE_R77__;let id=false;try{id=G?.armNextNormal?.({kind:'portal',direction:dir,source:'guide-goal'},zone,layer);}catch(e){fail(e);}
 const res=travel(dir);if(id&&res&&typeof res.then==='function')res.then(ok=>{if(!ok)G.cancelNextNormal(id);},()=>G.cancelNextNormal(id));stats.guideTravels=(stats.guideTravels||0)+1;return res;}
// 그래도 다른 길(E 대신 누르기 등)로 난이도 창이 열려 길잡이가 멈추면: 길잡이 ON 이고 창이 열린 뒤 사람이 아무것도 누르지 않은 채 3초가 지나면
//  지금 골라진 난이도로 확인을 누른다(R118 '난이도 선택을 지금 값으로 확정'과 같은 규칙). 사람이 누르거나 고르면 손대지 않는다.
const diffWatch={openAt:0,input:0};
try{for(const ev of ['pointerdown','keydown','touchstart'])document.addEventListener(ev,e=>{if(e.isTrusted)diffWatch.input=Date.now();},true);}catch(_){}
setInterval(()=>{try{const btn=document.getElementById('r71DifficultyConfirm'),on=typeof guide!=='undefined'&&!!guide&&prefs.guide;
 if(!btn||!btn.offsetParent){diffWatch.openAt=0;return;}if(!diffWatch.openAt){diffWatch.openAt=Date.now();return;}
 if(on&&diffWatch.input<diffWatch.openAt&&Date.now()-diffWatch.openAt>3000){diffWatch.openAt=Date.now()+60000;stats.guideDifficulty=(stats.guideDifficulty||0)+1;btn.click();}}catch(e){fail(e);}},300);
function extendGuide(){if(player.moving||(typeof route!=='undefined'&&route?.length)||(typeof command!=='undefined'&&command)){idleSince=time;return;}
 if(time-idleSince<1||time-lastAct<.6)return;lastAct=time;const g=POL()?.goal?.();if(!g)return;const d=Math.hypot(g.x-player.x,g.y-player.y);
 if(g.kind==='enemy'||g.kind==='boss'){const e=(room.enemies||[]).find(v=>v.hp>0&&Math.abs(v.x-g.x)<.01&&Math.abs(v.y-g.y)<.01);if(e&&d<8&&typeof clearLine==='function'&&clearLine(player,e)){command=e.id;target=e.id;stats.guideActs++;return;}}
 if(chasePackGoal(g))return;
 if(d<=1.1){if(g.kind==='objective'&&typeof interact==='function')interact();else if(g.kind==='exit'&&typeof travel==='function'){const dir=window.__STORYWORLD_REGION_ROUTES__?.activeDirection?.();if(dir)guideTravel(dir);}stats.guideActs++;return;}
 const p=POL()?.navPath?.(player,g);if(p?.length>1){route=p.slice(1).map(q=>({x:q.x,y:q.y}));command=null;stats.guideNav++;}}
// World-ward rooms (R78 phases: route → rally → door → boss → exit) are outside the R75
// guide's view, so there the compass goal drives the step instead.
let wardPlan=0,wardKey='',wardStuckAt=0,wardPos=null;
function wardStep(){if(time<wardPlan)return;wardPlan=time+.6;const g=POL()?.goal?.();if(!g)return;const d=Math.hypot(g.x-player.x,g.y-player.y);
 if(g.kind==='enemy'||g.kind==='boss'){const e=(room.enemies||[]).filter(v=>v.hp>0&&v.spawnState==='active').sort((p,q)=>Math.hypot(p.x-g.x,p.y-g.y)-Math.hypot(q.x-g.x,q.y-g.y))[0];
  if(e&&Math.hypot(e.x-player.x,e.y-player.y)<8&&typeof clearLine==='function'&&clearLine(player,e)){command=e.id;target=e.id;route=[];stats.guideActs++;return;}}
 if(chasePackGoal(g))return;
 if(d<=1.6){const world=window.__STORYWORLD_WORLD_R74__,near=(world?.interactions?.()||[]).filter(t=>t?.point&&Math.hypot(t.point.x-player.x,t.point.y-player.y)<2.4).sort((p,q)=>Math.hypot(p.point.x-player.x,p.point.y-player.y)-Math.hypot(q.point.x-player.x,q.point.y-player.y));
  for(const t of near){try{if(world.canUse(t)){world.use(t);stats.guideActs++;route=[];return;}}catch(e){fail(e);}}
  if(g.kind==='exit'&&typeof travel==='function'){const dir=window.__STORYWORLD_REGION_ROUTES__?.activeDirection?.();if(dir){guideTravel(dir);stats.guideActs++;return;}}
  if(typeof interact==='function')interact();stats.guideActs++;if(d<=.9){route=[];return;}}
 const key=Math.floor(g.x)+':'+Math.floor(g.y)+':'+g.kind,moved=!wardPos||Math.hypot(player.x-wardPos.x,player.y-wardPos.y)>.15;if(moved){wardPos={x:player.x,y:player.y};wardStuckAt=time;}
 if(key===wardKey&&route?.length&&time-wardStuckAt<1.2)return;wardKey=key;
 const p=POL()?.navPath?.(player,g);if(p?.length>1){route=p.slice(1).map(q=>({x:q.x,y:q.y}));command=null;stats.guideNav++;}}
if(typeof guideStep==='function'){const gsBase=guideStep;guideStep=function(...a){
 try{if(enteringNow())return;}catch(_){}
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
 effects:()=>list.map(e=>({kind:e.kind,age:age(e),life:e.life})),pickedHero:()=>pickedHero,toggleGuide,
 inspect:()=>({revision:'R101-polish',prefs:{...prefs},stats:{...stats},effects:list.length,tier:live()?tierOf(player):null,lastError,relayBuilds:[...RELAY_BUILDS],presentationOnly:true,gameplayChanged:false,savesTouched:false})});
})();
