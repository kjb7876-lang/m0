// R314 / CX-0014: R241's existing meteor admissions become alternating prop rain / eruptions.
// Damage, effective radius, six-second admission guard and 8→6s cadence stay owned by R241/R205.
// Only pictures recorded from visible room props are copied. Props, layout, walls and assets are never edited.
(()=>{'use strict';
if(window.__STORYWORLD_BOSS_PROP_CONTROL_R314__)return;
const REV='R314-boss-prop-control-1',CAP=6,CHARGE=1.2,THROW=.4,OPEN=.6,RAIN_WARN=1,ERUPT_WARN=.9;
const CIRCLE='assets/r251/circle.webp',BLOOD={a:[104,7,20],b:[240,62,78]};
const stats={installs:0,casts:0,rain:0,eruption:0,draws:0,sized:0,converted:0,errors:0};
let lastError=null,lastSize=null,installed=false;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,180);};
const T=()=>typeof time==='number'?time:0,AH=()=>typeof actorHeight==='function'?actorHeight():66;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),mix=(a,b,u)=>a+(b-a)*u;
const major=e=>!!e&&!e.r61Summoned&&!e.r251Circle&&!!(e.boss||e.persona||e.cosmic||e.trial);
const solo=()=>{const c=window.__STORYWORLD_COOP_SIM_R62__;return !c?.mode||c.mode()==='off';};
const live=e=>!!e&&e.hp>0&&!e.deadRecorded&&e.visible!==false&&!e.disabled&&!['dead','hidden','inactive','disabled','despawned'].includes(e.spawnState);
const mobile=()=>{try{return !!(window.__STORYWORLD_MOBILE_PERF_R298__?.inspect?.().mobile??window.__STORYWORLD_MOBILE_R63__?.isMobile?.());}catch(_){return false;}};
const scope=(o,f)=>typeof ctx?.scope==='function'?ctx.scope(o,f):f();
const captures=new WeakMap(),sizes=new WeakMap(),fractions=new WeakMap(),turns=new WeakMap(),active=new Set();
const SENT={type:'r314-fx',x:0,y:0,age:0,life:Infinity};
function arm(){if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}
function bodyFrac(c){let m=fractions.get(c.image);if(!m){m=new Map();fractions.set(c.image,m);}const key=c.sourceRect.join(',');if(m.has(key))return m.get(key);
 let f=1;try{const [x,y,w,h]=c.sourceRect,cv=document.createElement('canvas');cv.width=64;cv.height=64;const g=cv.getContext('2d',{willReadFrequently:true});g.drawImage(c.image,x,y,w,h,0,0,64,64);
  const d=g.getImageData(0,0,64,64).data,rows=[];for(let y=0;y<64;y++){let n=0;for(let x=0;x<64;x++)if(d[(y*64+x)*4+3]>100)n++;rows.push(n);}const peak=Math.max(...rows),ids=rows.map((n,i)=>n>=peak*.12&&n>0?i:-1).filter(i=>i>=0);if(ids.length)f=(ids.at(-1)-ids[0]+1)/64;cv.width=cv.height=1;
 }catch(_){}m.set(key,f);return f;}
const height=c=>Math.hypot(c.points[3][0]-c.points[0][0],c.points[3][1]-c.points[0][1]);
function collision(e,k){if(!solo())return;let s=sizes.get(e);if(!s){s={radius:Number(e.radius)||.3,profile:e.combatProfile,k:1};sizes.set(e,s);
  // Body profiles can be shared templates. Give this actor its own collision records.
  if(e.combatProfile)e.combatProfile={...e.combatProfile,bodyBlock:e.combatProfile.bodyBlock?{...e.combatProfile.bodyBlock}:undefined,hurtbox:e.combatProfile.hurtbox?{...e.combatProfile.hurtbox}:undefined};}
 s.k=k;e.radius=s.radius*k;for(const name of ['bodyBlock','hurtbox']){const r=s.profile?.[name]?.r;if(Number.isFinite(r))e.combatProfile[name].r=r*k;}}
function fit(e,start){const rows=ctx.commands.slice(start).filter(c=>c.kind==='image'&&c.points?.length===4&&c.owner?.kind==='enemy');let best=null,h=0;
 for(const c of rows)if(height(c)>h){h=height(c);best=c;}if(!best||h<2)return;
 const f=bodyFrac(best),body=h*f,rage=e.r205Enraged?2:1,want=AH()*.98*2*rage;
 // Existing larger drawings are retained unless the viewport cap is reached.
 const cap=(typeof H==='number'?H:800)*.7,k=Math.min(Math.max(1,want/body),cap/h),p=project(e.x,e.y);
 const sc=([x,y])=>[p.x+(x-p.x)*k,p.y+(y-p.y)*k];
 for(const c of rows){c.points=c.points.map(sc);
  // Authored body clips (clipPolygonPx) are screen-space paths recorded with this draw; scale copies so the enlarged art is not cut.
  if(Array.isArray(c.clips)&&c.clips.length)c.clips=c.clips.map(cl=>({...cl,paths:(cl.paths||[]).map(q=>({...q,points:(q.points||[]).map(sc)}))}));}
 // R259 measured the body inside drawEnemy before this resize; keep its hit centre on the drawn boss.
 try{window.__STORYWORLD_HIT_CENTER_R259__?.rescale?.(e,p.x,p.y,k);}catch(_){}
 // Native drawEnemy's unmodified height is actorHeight × spriteRect.height × defScale.
 // Include R205's minimum-fit and rage multiplication once, so radius/body stay proportional.
 const raw=AH()*(Number(e.combatProfile?.spriteRect?.height)||1)*(Number(e.defScale)||1),ck=h*k/Math.max(.01,raw);
 collision(e,ck);stats.sized++;lastSize={id:e.id,body:body*k,hero:AH()*.98,ratio:body*k/(AH()*.98),scale:k,collisionScale:ck,cap};}
function scenery(p){return p&&Number.isFinite(p.x+p.y)&&p.visible!==false&&p.enabled!==false&&!p.disabled&&!p.destroyed&&!p.r303Hide&&!p.interactive&&!p.terrainWall&&!p.r74Door&&!p.r81WardDoor&&!p.samongR103&&!p.r75NPC&&!p.r75NarrativeNPC&&!p.r115Clue&&!p.objective&&!/chest|objective|door|portal|clue|record/i.test(String(p.id||''));}
function remember(p,start){if(!scenery(p))return;const rows=ctx.commands.slice(start).filter(c=>c.kind==='image'&&c.points?.length===4);let best=null;
 for(const c of rows)if(!best||height(c)>height(best))best=c;if(!best)return;
 const q=project(p.x,p.y),xs=best.points.map(v=>v[0]),ys=best.points.map(v=>v[1]);if(Math.max(...xs)<0||Math.min(...xs)>(typeof W==='number'?W:1280)||Math.max(...ys)<0||Math.min(...ys)>(typeof H==='number'?H:800))return;
 let m=captures.get(room);if(!m){m=new Map();captures.set(room,m);}m.set(p,{p,at:T(),x:p.x,y:p.y,image:best.image,rect:best.sourceRect.slice(),points:best.points.map(([x,y])=>[x-q.x,y-q.y]),h:height(best),style:{...best.style}});
}
function ghost(p,start){if(![...active].some(c=>c.room===room&&c.sources.some(s=>s.p===p)))return;
 for(let i=start;i<ctx.commands.length;i++){const c=ctx.commands[i];if(c.style)c.style={...c.style,globalAlpha:c.style.globalAlpha*.24};}}
function sources(){const m=captures.get(room);if(!m)return[];return [...m.values()].filter(s=>scenery(s.p)&&room.props?.includes(s.p)&&T()-s.at<1&&s.x===s.p.x&&s.y===s.p.y).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));}
function palette(e){if(typeof layer!=='undefined'&&layer==='DREAM'||e.samongBossR170)return BLOOD;try{const p=window.__STORYWORLD_COMBAT_R114__?.palette?.(e);if(p?.p)return{a:p.p,b:p.gp||p.p};}catch(_){}return BLOOD;}
function adopt(){if(!solo()||typeof hazards==='undefined'||!Array.isArray(hazards)||!room)return;
 const discard=new Set(),groups=new Map();for(const h of hazards)if(h?.r241Meteor){const e=room.enemies?.find(e=>e.id===h.owner);if(!major(e)||!live(e))continue;const key=h.r241Meteor.cast;if(!groups.has(key))groups.set(key,{e,hs:[]});groups.get(key).hs.push(h);}
 for(const {e,hs} of groups.values()){
  const src=sources(),available=Math.max(0,CAP-[...active].reduce((n,c)=>n+c.hs.length,0));
  // Rooms without a visible prop picture keep their existing R241 meteor pattern.
  if(!src.length)continue;
  const n=Math.min(available,mobile()?Math.max(1,Math.floor(Math.min(CAP,src.length,hs.length)/2)):Math.min(CAP,src.length,hs.length));
  if(!n){for(const h of hs)discard.add(h);continue;}
  const step=turns.get(e)||0,mode=step%2?'eruption':'rain';turns.set(e,step+1);
  const c={id:++stats.casts,e,room,mode,sources:src.slice(0,n),hs:[],pal:palette(e),low:mobile()};active.add(c);stats[mode]++;
  hs.forEach((h,i)=>{if(i>=n){discard.add(h);return;}const original={warning:h.warning,damage:h.damage,radius:h.radius},gateAt=CHARGE+(mode==='eruption'?i*.12:0),ready=gateAt+Math.max(THROW,mode==='rain'?OPEN:THROW),warning=ready+(mode==='rain'?RAIN_WARN+i*.12:ERUPT_WARN);
   delete h.r241Meteor;h.type='prop-r314';h.age=0;h.warning=warning;h.life=warning+.45;h.r314Prop={cast:c.id,mode,index:i,source:c.sources[i],gateAt,ready,original};c.hs.push(h);stats.converted++;});
  try{if(typeof addImage==='function')addImage(CIRCLE,'R314 existing summoning circle');}catch(_){}arm();
 }
 if(discard.size)hazards=hazards.filter(h=>!discard.has(h));
}
function phase(h){const m=h.r314Prop,t=h.age;return{stage:t<m.gateAt?'charge':t<m.gateAt+THROW?'throw':t<m.ready?'open':t<h.warning-.35?'warning':t<h.warning?(m.mode==='rain'?'fall':'rise'):'impact',age:t,gate:clamp((t-m.gateAt)/(m.mode==='rain'?OPEN:THROW),0,1)};}
function clean(){for(const c of active)if(c.room!==room||!live(c.e)||!solo()||!c.hs.some(h=>hazards.includes(h)&&h.age<h.life)){for(const h of c.hs){h.damage=0;h.life=h.age;}active.delete(c);}if(active.size)arm();}
function copy(s,x,y,k=1,alpha=1,angle=0){const p=s.points;
 ctx.save();try{ctx.globalAlpha*=alpha;ctx.filter='brightness(.95) saturate(.85)';ctx.translate(x,y);ctx.rotate(angle);ctx.scale(k,k);ctx.transform(p[1][0]-p[0][0],p[1][1]-p[0][1],p[3][0]-p[0][0],p[3][1]-p[0][1],p[0][0],p[0][1]);ctx.drawImage(s.image,...s.rect,0,0,1,1);}finally{ctx.restore();}}
function sprite(n,p,x,y,w,h,a){window.__STORYWORLD_FX_SPRITES_R106__?.draw?.(n,p,x,y,w,h,{alpha:a,overHero:true,blend:n==='smoke'||n==='crack'?'source-over':'lighter'});}
function gate(q,r,u,air){const im=typeof readyImage==='function'?readyImage(CIRCLE)?.image:null;if(!im||u<=0)return;const fr=Math.min(3,Math.floor(u*4)),w=r*2;
 ctx.save();try{ctx.globalAlpha*=.45+.5*u;ctx.filter='brightness(1.1) saturate(.85)';ctx.translate(q.x,q.y);if(air)ctx.rotate(-.12);ctx.drawImage(im,fr*384,0,384,256,-w*.5*u,-w*.25*u,w*u,w*(air?.42:.65)*u);
  // R170/R251's two-triangle blood hexagram, on the same opening ellipse.
  ctx.scale(u,u*(air?.42:.65));ctx.strokeStyle='rgba(215,26,48,.95)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();ctx.beginPath();for(let j=0;j<2;j++)for(let i=0;i<=3;i++){const a=-Math.PI/2+j*Math.PI/3+i*Math.PI*2/3;const x=Math.cos(a)*r*.86,y=Math.sin(a)*r*.86;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.stroke();
 }finally{ctx.restore();}}
function warning(h,q){const r=h.radius,dx=project(h.x+r,h.y),dy=project(h.x,h.y+r),rx=Math.abs(dx.x-q.x)+Math.abs(dy.x-q.x),ry=Math.abs(dx.y-q.y)+Math.abs(dy.y-q.y);
 // Project the actual world circle, rather than stretching a fixed screen ellipse.
 ctx.save();try{ctx.fillStyle='rgba(62,3,12,.38)';ctx.strokeStyle='rgba(195,26,45,.9)';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<=48;i++){const a=i/48*Math.PI*2,p=project(h.x+Math.cos(a)*r,h.y+Math.sin(a)*r);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);}ctx.closePath();ctx.fill();ctx.stroke();}finally{ctx.restore();}return Math.max(12,Math.min(rx,ry*2));}
function paint(c,h){const m=h.r314Prop,t=h.age,a=AH(),q=project(h.x,h.y),b=project(c.e.x,c.e.y),hand={x:b.x+a*.2,y:b.y-a*1.5},s=m.source,src=project(s.x,s.y),exit={x:q.x,y:q.y-(m.mode==='rain'?a*3.5:0)},st=phase(h),k=Math.min(1,a*.9/s.h),r=Math.max(20,h.radius*(typeof TILE==='number'?TILE:32)*1.35);
 if(t<m.gateAt){const u=clamp(t/CHARGE,0,1),v=u*u;copy(s,mix(src.x,hand.x,v)+Math.sin(t*28+m.index)*3*(1-u),mix(src.y,hand.y,v)-Math.sin(u*Math.PI)*a*.5,k,1-u*.25,u*.5);sprite('smoke',BLOOD,b.x,b.y-a*.6,a*(1+u),a*(.6+u),.35);}
 else{
  gate(exit,r,st.gate,m.mode==='rain');
  if(t<m.gateAt+THROW){const u=(t-m.gateAt)/THROW;for(let j=2;j>=0;j--){const v=clamp(u-j*.1,0,1);copy(s,mix(hand.x,exit.x,v),mix(hand.y,exit.y,v)-Math.sin(v*Math.PI)*a,k*(1-v*.6),j?.16:.9,u*.8);}}
 }
 if(t<h.warning)warning(h,q);
 if(st.stage==='fall'||st.stage==='rise'){const u=clamp((t-(h.warning-.35))/.35,0,1);copy(s,q.x,m.mode==='rain'?mix(exit.y,q.y,u*u):q.y-Math.sin(u*Math.PI*.5)*a*1.6,k,1,u*.9);}
 if(st.stage==='impact'){const u=clamp((t-h.warning)/.45,0,1),n=c.low?3:6;gate(exit,r,1-u,m.mode==='rain');sprite('crack',c.pal,q.x,q.y,r*2,r,1-u);sprite('smoke',c.pal,q.x,q.y-a*u,r*(1+u),r*(1+u),.75*(1-u));
  for(let i=0;i<n;i++){const ang=i/n*Math.PI*2; sprite('spark',c.pal,q.x+Math.cos(ang)*r*u,q.y-a*.3+Math.sin(ang)*r*u*.5,a*.45,a*.45,1-u);}}
 stats.draws++;
}
function drawFx(){for(const c of active)for(const h of c.hs)if(h.age<h.life)scope({id:'r314:'+h.id,kind:'effect',x:h.x,y:h.y,alive:false,presentationOnly:true},()=>paint(c,h));}
function install(){if(installed)return true;if(typeof tick!=='function'||typeof drawEnemy!=='function'||typeof drawProp!=='function'||typeof drawEffect!=='function'||typeof drawHazard!=='function'||typeof tickHazards!=='function')return false;
 installed=true;stats.installs++;
 const tp=drawProp;drawProp=function(p,...a){const start=Array.isArray(ctx?.commands)?ctx.commands.length:-1;const out=tp.call(this,p,...a);try{if(start>=0&&typeof room==='object'){remember(p,start);ghost(p,start);}}catch(e){fail(e);}return out;};
 const de=drawEnemy;drawEnemy=function(e,...a){const start=Array.isArray(ctx?.commands)?ctx.commands.length:-1;const out=de.call(this,e,...a);try{if(start>=0&&major(e)&&live(e))fit(e,start);}catch(err){fail(err);}return out;};
 const dh=drawHazard;drawHazard=function(h,...a){if(h?.r314Prop)return;return dh.call(this,h,...a);};
 const ef=drawEffect;drawEffect=function(e,...a){if(e?.type==='r314-fx'){try{drawFx();}catch(err){fail(err);}return;}return ef.call(this,e,...a);};
 const hz=tickHazards;tickHazards=function(...a){clean();const out=hz.apply(this,a);for(const h of hazards)if(h?.r314Prop&&h.lastHit>-99)h.damage=0;return out;};
 const tk=tick;tick=function(...a){try{clean();}catch(e){fail(e);}const out=tk.apply(this,a);try{adopt();clean();}catch(e){fail(e);}return out;};
 const b=window.__STORYWORLD_BOSS_FIELDS_R62__;if(b?.prepare)window.__STORYWORLD_BOSS_FIELDS_R62__=Object.freeze({...b,prepare(...a){const out=b.prepare.apply(this,a);try{adopt();}catch(e){fail(e);}return out;}});
 return true;
}
window.__STORYWORLD_BOSS_PROP_CONTROL_R314__=Object.freeze({revision:REV,install,phase,inspect:()=>({revision:REV,stats:{...stats},active:active.size,props:[...active].reduce((n,c)=>n+c.hs.length,0),lastSize,lastError,installed,GPUVerified:false})});
function start(n=0){try{if(!install()&&n<40)setTimeout(()=>start(n+1),250);}catch(e){fail(e);}}start();
})();
