/* R106: 영웅 스킬 연출을 D2 Survivors(디아블로2풍 뱀서류) 스킬 방식으로 다시 짰습니다.
 * 그 게임의 그림·소리·코드는 쓰지 않고, 형태와 타이밍만 따라 우리 텍스처(assets/r106/fx)로 그립니다.
 *   환도   — 축복받은 망치처럼 바깥으로 소용돌이치는 칼날 + 회전 베기
 *   서하   — 프로즌 오브: 날아가며 사방으로 얼음 조각을 뿌리고 끝에서 터지는 구슬
 *   네온   — 체인 라이트닝: 적에서 적으로 튀는 번개 + 차지드 볼트
 *   미카엘라 — 천국의 주먹: 하늘에서 내리꽂는 빛 기둥 + 사방으로 퍼지는 성광 + 날개
 *   라우렌 — 메테오: 표적 마법진 → 떨어지는 운석 → 폭발과 타오르는 바닥
 *   헌터   — 멀티샷: 부채꼴 화살 + 성장하면 이멀레이션(폭발) 화살
 *   슬레이어 — 피셔: 겨눈 방향으로 차례로 터지는 땅 균열과 불기둥
 *   거너   — 노바: 퍼지는 고리 + 사방으로 튀는 차지드 볼트
 * 성장 단계(R102 0~7)에 따라 수(튀는 횟수·조각·화살·분출)가 늘어납니다. 보이는 것만 바뀌며
 * 피해·판정·저장은 그대로입니다. 기본공격은 건드리지 않습니다. */
(()=>{'use strict';
if(window.__STORYWORLD_D2S_R106__)return;
if(typeof drawEffect!=='function'||typeof special!=='function'||typeof tick!=='function'||typeof project!=='function'||typeof fx!=='function')return;
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),lerp=(a,b,t)=>a+(b-a)*t,smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const rnd=(seed,i)=>{const x=Math.sin(seed*12.9898+i*78.233)*43758.5453;return x-Math.floor(x);};
const stats={casts:0,werCasts:0,spawned:0,draws:0,skipped:0,errors:0};let lastError=null;
function fail(e){stats.errors++;lastError=String(e?.message||e);}
const live=()=>typeof started!=='undefined'&&started&&typeof player!=='undefined'&&!!player&&typeof room!=='undefined'&&!!room;
const lowFx=()=>!!(typeof settings!=='undefined'&&settings?.lowFx);
const SP=()=>window.__STORYWORLD_FX_SPRITES_R106__;
const R102=()=>window.__STORYWORLD_HERO_FX_R102__;
const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r106.d2s';
let enabled=true;try{if(localStorage.getItem(KEY)==='0')enabled=false;}catch(_){}
const on=()=>enabled&&!!SP()?.on?.();
function setEnabled(v){enabled=!!v;try{localStorage.setItem(KEY,enabled?'1':'0');}catch(_){}return enabled;}
const ARCH=Object.freeze({hwando:'iai',seoha:'orb',neon:'chain',michaela:'fist',lauren:'meteor',hunter:'multishot',slayer:'fissure',gunner:'nova'});
const NAMES=Object.freeze({hammer:'소용돌이 칼날',iai:'발도 연참',orb:'프로즌 오브',chain:'체인 라이트닝',fist:'천국의 주먹',meteor:'메테오',multishot:'멀티샷',fissure:'피셔',nova:'노바'});
const H=()=>typeof actorHeight==='function'?actorHeight():60;
function enemies(){try{return typeof liveEnemies==='function'?liveEnemies():[];}catch(_){return[];}}
function nearestTo(x,y,max,skip){let best=null,bd=max;for(const e of enemies()){if(skip&&skip.has(e))continue;const d=Math.hypot(e.x-x,e.y-y);if(d<bd){bd=d;best=e;}}return best;}

// ---- effect store (world coordinates; drawn in the effect pass through a sentinel) -----------
const list=[],MAX=40;let serial=0;
const SENTINEL={type:'r106-d2s',x:0,y:0,age:0,life:Infinity,r106Sentinel:true};
function add(e){if(list.length>=MAX)list.shift();e.id='r106d2s:'+(++serial);e.t=0;list.push(e);stats.spawned++;return e;}

// ---- launching -----------------------------------------------------------------------------------
function launch(hero,slot,angle,target){if(!on()||!live())return;const F=R102()?.PALETTE?.[hero];const kind=ARCH[hero];if(!F||!kind)return;
 const t=clamp(R102()?.tier?.(player)??0,0,7),lo=lowFx(),k=lo?.5:1,p={x:player.x,y:player.y},a=Number.isFinite(angle)?angle:0,seed=Math.random()*100;
 let tx=target?.x,ty=target?.y;if(!Number.isFinite(tx)||!Number.isFinite(ty)){tx=p.x+Math.cos(a)*4;ty=p.y+Math.sin(a)*4;}
 const base={kind,hero,F,tier:t,slot,x:p.x,y:p.y,tx,ty,a:Math.atan2(ty-p.y,tx-p.x),seed,k};
 if(kind==='iai'){
  // R111 (사용자 2026-10-28 "*# 검술 이펙트는 초반엔 안 나오고 스킬 레벨업하면, 적 쪽에서 한 번에 여러 번 광역으로. 초반엔 단순 일자만"):
  // R111 (00:24 "모든 이펙트 단계화는 7단계"): 성장 단계 t마다 한 칸씩 달라진다. 0 일자 한 줄 · 1 일자 두 적 · 2 * 한 적 · 3 * 세 적
  // · 4 *# 세 적 · 5 *# 다섯 적 · 6 *#+세로 다섯 적 두 번 · 7 *#+세로 일곱 적 두 번. 베기와 섬광은 모두 적 자리에서 나온다(적이 없으면 겨눈 방향 앞).
  const near=enemies().filter(e=>Math.hypot(e.x-p.x,e.y-p.y)<6.5).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)),cuts=[],marks=[];
  const PAT=[[0,0],[Math.PI/3,0],[2*Math.PI/3,0],[Math.PI/4,.38],[Math.PI/4,-.38],[3*Math.PI/4,.38],[3*Math.PI/4,-.38],[Math.PI/2,0]];
  const stage=t<=1?0:t<=3?1:t<=5?2:3,per=[1,1,3,3,7,7,8,8][t],targets=[1,2,1,3,3,5,5,7][t],waves=t>=6?2:1,cap=lo?14:40;
  const spots=near.length?near.slice(0,targets).map(e=>({x:e.x,y:e.y})):[{x:p.x+Math.cos(a)*1.6,y:p.y+Math.sin(a)*1.6}];
  for(let w=0;w<waves;w++)spots.forEach((sp,si)=>{for(let i=0;i<per&&cuts.length<cap;i++){const [ang0,off]=PAT[i],ang=(per===1?a:ang0+a)+w*.35,len=(per===1?1.25:1.45)+.08*t;
   cuts.push({cx:sp.x-Math.sin(ang)*off,cy:sp.y+Math.cos(ang)*off,ang,len,t0:.09+w*.42+si*.05+i*.055,first:i===0});}
   if(per>=3)marks.push({x:sp.x,y:sp.y,star:.09+w*.42+si*.05+2*.055+.05,hash:per>=7?.09+w*.42+si*.05+(per-1)*.055+.08:null});});
  add({...base,life:.75+.055*per+(waves-1)*.42+.05*spots.length,cuts,marks,stage,fx:spots[0]});}
 else if(kind==='hammer')add({...base,life:1.25+.05*t,n:Math.round((3+t)*Math.max(.67,k))});
 else if(kind==='orb')add({...base,life:1.35,speed:5.2,shards:[],emitAt:0,burst:false});
 else if(kind==='chain'){const hops=[],seen=new Set();let from={x:p.x,y:p.y};for(let i=0;i<3+t;i++){const e=nearestTo(from.x,from.y,i?5.5:9,seen);if(!e)break;seen.add(e);hops.push({x:e.x,y:e.y,e});from=e;}
  if(!hops.length)hops.push({x:tx,y:ty});add({...base,life:.32+.07*hops.length,hops,bolts:Math.round((2+t)*k)});}
 else if(kind==='fist')add({...base,life:1.15,rays:Math.round((8+2*t)*k)});
 else if(kind==='meteor'){const e=nearestTo(p.x,p.y,10);add({...base,tx:e?e.x:tx,ty:e?e.y:ty,life:2.1+.15*t,fall:.55});}
 else if(kind==='multishot')add({...base,life:1.0,n:[3,4,5,6,7,9,11,13][t],range:7.5+.3*t});
 else if(kind==='fissure')add({...base,life:1.5,n:Math.round((5+t)*Math.max(.6,k)),step:.075});
 else if(kind==='nova')add({...base,life:.9,bolts:Math.round((8+2*t)*k)});
 stats.casts++;}

// ---- drawing helpers ----------------------------------------------------------------------------------
function S(name,F,x,y,w,h,o){const s=SP();if(!s)return false;const ok=s.draw(name,F,x,y,w,h,o);if(ok)stats.draws++;else stats.skipped++;return ok;}
function A(name,F,x0,y0,x1,y1,th,o){const s=SP();return!!s&&s.along(name,F,x0,y0,x1,y1,th,o);}
const P=(x,y,z=0)=>{if(z>0){const v=window.__STORYWORLD_PLAY_R115__?.place?.(x,y,z);if(v)return v;}const q=project(x,y);return{x:q.x,y:q.y-z};};// R115: 적 발밑을 겨눈 점은 그 적 그림의 실제 높이에 맞춘다
const pb=F=>SP()?.pal?.(F.b)||F;

const DRAW={
 // 축복받은 망치처럼: 칼날이 소용돌이 모양으로 바깥으로 돈다.
 // R107 발도 연참(츠바메가에시): 칼을 뽑는 짧은 예비 동작 → 주변을 * 와 # 모양으로 빠르게 연달아 벰 → 잔상이 남았다가 납도 섬광.
 iai(e,u,h){const F=e.F,G=pb(F),T=e.t,o=e.fx||e,c=P(o.x,o.y,h*.45),cs=e.cuts;const hc=P(e.x,e.y,h*.45);
  if(T<.1)S('glow',G,hc.x+h*.18,hc.y+h*.05,h*(.35+2.4*T),h*(.2+1.2*T),{alpha:.25+.7*(1-T/.1)});
  for(const cut of cs){const v=(T-cut.t0)/.5;if(v<0||v>1)continue;const grow=smooth(v/.1),dx=Math.cos(cut.ang)*cut.len,dy=Math.sin(cut.ang)*cut.len,
    a0=P(cut.cx-dx*grow,cut.cy-dy*grow,h*.42),a1=P(cut.cx+dx*grow,cut.cy+dy*grow,h*.42),fade=v<.3?1:Math.pow(1-(v-.3)/.7,1.3);
   A('iai-cut',G,a0.x,a0.y,a1.x,a1.y,h*((e.stage??3)?.75-.3*v:.42-.18*v),{alpha:fade,overHero:v<.12});A('slashline',F,a0.x,a0.y,a1.x,a1.y,h*(.16-.06*v),{alpha:.8*fade,overHero:v<.12});
   const g0=P(cut.cx-dx*.85,cut.cy-dy*.85),g1=P(cut.cx+dx*.85,cut.cy+dy*.85);A('line',F,g0.x,g0.y,g1.x,g1.y,h*.05,{alpha:.4*fade});
   if(v<.3&&(e.stage??3)>=1&&cut.first!==false){const m=P(cut.cx,cut.cy,h*.42),k=1-v/.3;S('iai-burst',G,m.x,m.y,h*1.15*(1-.4*v),h*.9*(1-.4*v),{angle:cut.ang,alpha:k});}}
  // * 와 # 섬광은 베인 적 자리마다(R111: 성장 단계가 오른 뒤에만). 납도 섬광은 마지막 베기 뒤 한 번.
  for(const m of e.marks||[]){const mc=P(m.x,m.y,h*.45),ws=(T-m.star)/.4;if(ws>0&&ws<1)S('iai-star',G,mc.x,mc.y,h*1.6,h*1.75,{alpha:.75*(1-ws)*(1-ws),angle:e.a*.2});
   if(m.hash!=null){const wh=(T-m.hash)/.45,gq=P(m.x,m.y,h*.1);if(wh>0&&wh<1)S('iai-hash',G,gq.x,gq.y,h*2.1,h*1.95,{squash:.62,angle:.785,alpha:.8*(1-wh*wh)});}}
  const last=cs.length?cs[cs.length-1].t0+.08:.4,ws2=(T-last-.14)/.35;if((e.stage??3)>=2&&ws2>0&&ws2<1)S('iai-sheath',G,c.x,c.y,h*(2.4+1.6*ws2),h*.72,{alpha:1-ws2,overHero:true});},
 hammer(e,u,h){const F=e.F,fade=1-smooth((u-.75)/.25),c=P(e.x,e.y,h*.35);
  if(u<.35)S('slashwide',F,c.x,c.y+h*.25,h*3.2,h*1.8,{squash:.55,angle:e.seed+u*14,alpha:(1-u/.35)*.9});
  for(let i=0;i<e.n;i++){const ph=i*TAU/e.n+e.seed,ang=ph+u*9.5,r=.5+3.1*smooth(u)*(.9+.1*Math.sin(i)),q=P(e.x+Math.cos(ang)*r,e.y+Math.sin(ang)*r,h*.45);
   for(let j=1;j<=3;j++){const b=ang-j*.22,rr=r-j*.06,qq=P(e.x+Math.cos(b)*rr,e.y+Math.sin(b)*rr,h*.45);S('glow',F,qq.x,qq.y,h*.42/j,h*.42/j,{alpha:.5*fade/j});}
   S('blade',F,q.x,q.y,h*1.4,h*.4,{angle:ang*1.0+Math.PI/2+u*20,alpha:fade});S('flare',pb(F),q.x,q.y,h*.6,h*.6,{angle:u*12+i,alpha:.75*fade});}},
 // 프로즌 오브: 구슬이 날아가며 회전하는 방향으로 얼음 조각을 쏟고, 끝에서 조각 노바.
 orb(e,u,h,dt){const F=e.F,T=1.1,tt=Math.min(e.t,T),ox=e.x+Math.cos(e.a)*e.speed*tt,oy=e.y+Math.sin(e.a)*e.speed*tt;
  if(e.t<T){e.emitAt-=dt;while(e.emitAt<=0){e.emitAt+=.045;const base=e.t*13+e.seed;for(let k=0;k<3;k++){const ang=base+k*TAU/3;e.shards.push({x:ox,y:oy,vx:Math.cos(ang)*6.5,vy:Math.sin(ang)*6.5,t:0,life:.45});}}}
  else if(!e.burst){e.burst=true;const n=Math.round(18*(e.k||1)+e.tier*2);for(let k=0;k<n;k++){const ang=k*TAU/n;e.shards.push({x:ox,y:oy,vx:Math.cos(ang)*7.5,vy:Math.sin(ang)*7.5,t:0,life:.5});}e.bx=ox;e.by=oy;}
  for(const s of e.shards){s.t+=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;}e.shards=e.shards.filter(s=>s.t<s.life);
  for(const s of e.shards){const q=P(s.x,s.y,h*.4),q0=P(s.x-s.vx*.09,s.y-s.vy*.09,h*.4),a=1-s.t/s.life,ang=Math.atan2(q.y-q0.y,q.x-q0.x);A('spark',F,q0.x,q0.y,q.x,q.y,h*.22,{alpha:.9*a});S('glow',F,q.x,q.y,h*.45,h*.45,{alpha:.6*a});S('shard',pb(F),q.x,q.y,h*.16,h*.32,{angle:ang+Math.PI/2,alpha:a,pivot:[.5,.5]});}
  if(e.t<T){const q=P(ox,oy,h*.45);S('glow',F,q.x,q.y,h*1.9,h*1.9,{alpha:.9});S('flare',pb(F),q.x,q.y,h*1.7,h*1.7,{angle:e.t*9,alpha:.95});S('orb',pb(F),q.x,q.y,h*1.05,h*1.05,{alpha:1});}
  if(e.burst){const k=clamp((e.t-T)/.25,0,1),q=P(e.bx,e.by);S('ring',F,q.x,q.y,h*(1+4*k),h*(.5+2*k),{alpha:1-k});}},
 // 체인 라이트닝: 시전자 → 적 → 적 … 한 번씩 차례로 튄다.
 chain(e,u,h){const F=e.F,step=.07,fr=Math.floor(time*24);let from=P(e.x,e.y,h*.55);
  e.hops.forEach((hp,i)=>{const t0=i*step,v=e.t-t0;const to=P(hp.e&&hp.e.hp>0?hp.e.x:hp.x,hp.e&&hp.e.hp>0?hp.e.y:hp.y,h*.45);
   if(v>0&&v<.32){const a=1-v/.32;A('bolt',F,from.x,from.y,to.x,to.y,h*.85,{frame:fr+i,alpha:a});A('bolt',pb(F),from.x,from.y,to.x,to.y,h*.45,{frame:fr+i+2,alpha:.7*a});S('flare',pb(F),to.x,to.y,h*1.1,h*1.1,{angle:fr*.4,alpha:a});S('glow',F,to.x,to.y,h*1.2,h*1.2,{alpha:.7*a});}
   from=to;});
  // 차지드 볼트: 시전자 둘레로 지글거리며 흩어지는 작은 번개 구슬
  for(let i=0;i<e.bolts;i++){const v=e.t-.02*i;if(v<0||v>.6)continue;const ang=e.a+(rnd(e.seed,i)-.5)*1.8,d=v*5,j=Math.sin(time*40+i*3)*.25,q=P(e.x+Math.cos(ang)*d-Math.sin(ang)*j,e.y+Math.sin(ang)*d+Math.cos(ang)*j,h*.3),a=1-v/.6;
   S('orb',pb(F),q.x,q.y,h*.32,h*.32,{alpha:a});S('flare',F,q.x,q.y,h*.5,h*.5,{angle:time*20+i,alpha:.8*a});}},
 // 천국의 주먹: 하늘에서 빛 번개가 표적에 내리꽂히고, 성광이 사방으로 퍼진다.
 fist(e,u,h){const F=e.F,q=P(e.tx,e.ty),top={x:q.x+h*.4,y:q.y-h*7},fr=Math.floor(time*24),a=1-smooth((u-.55)/.45),hit=e.t>.12;
  if(e.t<.5){const k=1-e.t/.5;A('bolt',pb(F),top.x,top.y,q.x,q.y-h*.2,h*1.1,{frame:fr,alpha:k});A('bolt',F,top.x,top.y,q.x,q.y-h*.2,h*.6,{frame:fr+1,alpha:k});S('pillar',F,q.x,q.y,h*1.4,h*4.5,{alpha:.9*k});}
  if(hit){const v=clamp((e.t-.12)/.6,0,1);S('cross',F,q.x,q.y-h*1.3,h*1.1,h*1.65,{alpha:a*.9});S('flare',pb(F),q.x,q.y-h*.4,h*3*(.6+v),h*3*(.6+v),{angle:v*2,alpha:a});S('ring',F,q.x,q.y,h*(1+5*v),h*(.5+2.5*v),{alpha:1-v});
   for(let i=0;i<e.rays;i++){const ang=i*TAU/e.rays+e.seed,d=.3+5.5*smooth(v),qq=P(e.tx+Math.cos(ang)*d,e.ty+Math.sin(ang)*d,h*.4),q0=P(e.tx+Math.cos(ang)*(d-.7),e.ty+Math.sin(ang)*(d-.7),h*.4);A('spark',F,q0.x,q0.y,qq.x,qq.y,h*.22,{alpha:(1-v)});S('cross',pb(F),qq.x,qq.y,h*.22,h*.33,{alpha:(1-v)*.9});}}
  const c=P(e.x,e.y,h*.66),w=h*2.1*(.6+.4*smooth(e.t/.25));if(u<.8){S('wing',F,c.x+h*.08,c.y,w,w,{alpha:.8*(1-u/.8),blend:'lighter'});S('wing',F,c.x-h*.08,c.y,w,w,{alpha:.8*(1-u/.8),flip:true,blend:'lighter'});}},
 // 메테오: 표적 마법진 → 하늘에서 떨어지는 불덩이 → 폭발 → 타오르는 바닥
 meteor(e,u,h){const F=e.F,q=P(e.tx,e.ty),fall=e.fall,v=e.t/fall,fr=Math.floor(time*12);
  if(e.t<fall+.1)S('rune',F,q.x,q.y,h*2.6,h*2.6,{squash:.5,angle:time*1.5,alpha:.85*smooth(e.t/.15)});
  if(e.t<fall){const s={x:q.x+h*4.5,y:q.y-h*8},m={x:lerp(s.x,q.x,v*v),y:lerp(s.y,q.y,v*v)};A('slashline',F,s.x+(m.x-s.x)*.55,s.y+(m.y-s.y)*.55,m.x,m.y,h*.9,{alpha:.9});
   S('flame',F,m.x,m.y,h*1.3,h*2.2,{frame:fr,angle:Math.atan2(m.y-s.y,m.x-s.x)-Math.PI/2+Math.PI,alpha:.9,pivot:[.5,.25]});S('glow',F,m.x,m.y,h*1.8,h*1.8,{alpha:.9});S('orb',pb(F),m.x,m.y,h*.9,h*.9,{alpha:1});return;}
  const w=e.t-fall,k=clamp(w/.35,0,1),burn=1-smooth((w-.9)/(e.life-fall-.9));
  if(k<1){S('flare',pb(F),q.x,q.y-h*.3,h*5*(.4+k),h*5*(.4+k),{angle:k,alpha:1-k});S('ring',F,q.x,q.y,h*(1.5+5*k),h*(.75+2.5*k),{alpha:1-k});S('smoke',{a:[50,14,18],b:[90,40,40]},q.x,q.y-h*.6*k,h*3*(.5+k),h*2*(.5+k),{blend:'source-over',alpha:.55*(1-k)});}
  S('crack',F,q.x,q.y,h*3.4,h*3.4,{squash:.5,angle:e.seed,alpha:.9*burn});
  for(let i=0;i<7;i++){const ang=rnd(e.seed,i)*TAU,d=rnd(e.seed,i+9)*1.3,qq=P(e.tx+Math.cos(ang)*d,e.ty+Math.sin(ang)*d);S('flame',F,qq.x,qq.y,h*.9,h*(1.1+.5*rnd(e.seed,i+3)),{frame:fr+i,alpha:.85*burn});}},
 // 멀티샷: 부채꼴로 퍼지는 화살, 성장하면 표적에서 이멀레이션 폭발
 multishot(e,u,h){const F=e.F,sp=12;for(let i=0;i<e.n;i++){const ang=e.a+(i-(e.n-1)/2)*.12,d=Math.min(e.range,sp*e.t),q=P(e.x+Math.cos(ang)*d,e.y+Math.sin(ang)*d,h*.5),q0=P(e.x+Math.cos(ang)*Math.max(0,d-1.6),e.y+Math.sin(ang)*Math.max(0,d-1.6),h*.5),a=d>=e.range?Math.max(0,1-(e.t-e.range/sp)/.15):1;
   if(a<=0)continue;A('slashline',F,q0.x,q0.y,q.x,q.y,h*.3,{alpha:.85*a});A('spark',pb(F),q0.x,q0.y,q.x,q.y,h*.14,{alpha:a});S('glow',F,q.x,q.y,h*.4,h*.4,{alpha:a});}
  if(e.tier>=3){const ti=Math.min(e.range,Math.hypot(e.tx-e.x,e.ty-e.y))/sp,v=(e.t-ti)/.5;if(v>0&&v<1){const q=P(e.tx,e.ty);S('flare',pb(F),q.x,q.y-h*.3,h*3,h*3,{alpha:1-v});S('ring',F,q.x,q.y,h*(1+3.5*v),h*(.5+1.75*v),{alpha:1-v});for(let i=0;i<5;i++){const ang=i*TAU/5+e.seed,qq=P(e.tx+Math.cos(ang)*.8*v,e.ty+Math.sin(ang)*.8*v);S('flame',F,qq.x,qq.y,h*.8,h*1.2,{frame:Math.floor(time*12)+i,alpha:.9*(1-v)});}}}},
 // 피셔: 겨눈 방향으로 땅이 차례로 갈라지며 불기둥이 솟는다.
 fissure(e,u,h){const F=e.F,fr=Math.floor(time*12);for(let i=0;i<e.n;i++){const t0=i*e.step,v=(e.t-t0)/.9;if(v<0||v>1)continue;const d=1+i*.95,j=(rnd(e.seed,i)-.5)*.9,x=e.x+Math.cos(e.a)*d-Math.sin(e.a)*j,y=e.y+Math.sin(e.a)*d+Math.cos(e.a)*j,q=P(x,y),a=1-smooth((v-.4)/.6),rise=Math.sin(Math.PI*clamp(v*1.6,0,1));
   S('crack',{a:[40,6,12],b:[90,20,30]},q.x,q.y,h*2.3,h*2.3,{squash:.5,angle:e.seed+i,alpha:.75*a,blend:'source-over'});S('crack',F,q.x,q.y,h*2.1,h*2.1,{squash:.5,angle:e.seed+i,alpha:a});
   S('flame',F,q.x,q.y,h*1.1,h*(1.6+1.4*rise),{frame:fr+i,alpha:.95*a});S('spike',pb(F),q.x+h*.25,q.y,h*.35,h*1.4*rise,{alpha:.9*a});if(v<.3)S('ring',F,q.x,q.y,h*2.2*(.4+v*2),h*1.1*(.4+v*2),{alpha:1-v/.3});
   if(v>.2)S('smoke',{a:[46,10,16],b:[90,36,40]},q.x,q.y-h*(.6+v),h*1.6,h*1.1,{blend:'source-over',alpha:.4*a});}},
 // 노바: 시전자에서 고리가 퍼지고 사방으로 차지드 볼트가 튄다.
 nova(e,u,h){const F=e.F,c=P(e.x,e.y),v=smooth(clamp(e.t/.45,0,1)),a=1-v,R=h*(.6+5.4*v);
  S('ring',F,c.x,c.y,R*2,R,{alpha:a});S('ring',pb(F),c.x,c.y,R*1.7,R*.85,{alpha:.7*a});
  for(let i=0;i<24;i++){const ang=i*TAU/24,qq={x:c.x+Math.cos(ang)*R*.82,y:c.y+Math.sin(ang)*R*.41};S('spark',F,qq.x,qq.y,h*.7,h*.16,{angle:Math.atan2(Math.sin(ang)*.5,Math.cos(ang)),alpha:.8*a});}
  for(let i=0;i<e.bolts;i++){const ang=i*TAU/e.bolts+rnd(e.seed,i)*.4,d=e.t*(5+rnd(e.seed,i+5)*2),j=Math.sin(time*36+i*2)*.3,q=P(e.x+Math.cos(ang)*d-Math.sin(ang)*j,e.y+Math.sin(ang)*d+Math.cos(ang)*j,h*.3),b=1-e.t/e.life;
   S('pixel',pb(F),q.x,q.y,h*.28,h*.28,{alpha:b});S('flare',F,q.x,q.y,h*.55,h*.55,{angle:time*14+i,alpha:.8*b});}
  S('flare',pb(F),c.x,c.y-h*.5,h*2.4*(1-v*.5),h*2.4*(1-v*.5),{alpha:a});}
};

// ---- loop ------------------------------------------------------------------------------------------
let frozen=false;
function drawAll(){if(!list.length||typeof ctx==='undefined'||!ctx)return;const h=H();
 for(const e of list){const u=e.t/e.life;if(u<0||u>1)continue;ctx.save();try{const run=()=>DRAW[e.kind]?.(e,u,h,e.dt||0);if(typeof ctx.scope==='function')ctx.scope({id:e.id,kind:'effect',x:e.x,y:e.y,r106:true},run);else run();}catch(err){fail(err);}finally{ctx.restore();}e.dt=0;}}
const effectBase=drawEffect;drawEffect=function(e){if(e&&e.type==='r106-d2s'){try{drawAll();}catch(err){fail(err);}return;}return effectBase.apply(this,arguments);};
const tickBase=tick;tick=function(dt){const r=tickBase.call(this,dt);try{if(live()&&!(typeof loading!=='undefined'&&loading)){const d=frozen?0:Number.isFinite(dt)?clamp(dt,0,.1):0;for(const e of list){e.t+=d;e.dt=(e.dt||0)+d;}
 for(let i=list.length-1;i>=0;i--)if(list[i].t>list[i].life)list.splice(i,1);
 if(list.length&&typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENTINEL)){SENTINEL.age=0;effects.push(SENTINEL);}}}catch(e){fail(e);}return r;};
if(typeof enterRegion==='function'){const eb=enterRegion;enterRegion=async function(...a){const r=await eb.apply(this,a);if(r!==false)list.length=0;return r;};}

// ---- casts: Q (special) and the Z/X/C source skills ---------------------------------------------------
const specialBase=special;special=function(...a){let before=null,ang=null,tgt=null;
 try{if(live()){before=player.specialCD;if(!(before>0)){const e=typeof nearestEnemy==='function'?nearestEnemy(12):null;tgt=e?{x:e.x,y:e.y}:null;ang=e?Math.atan2(e.y-player.y,e.x-player.x):typeof storyAim22==='function'?storyAim22():0;}}}catch(err){fail(err);}
 const r=specialBase.apply(this,a);try{if(live()&&player.specialCD>0&&!(before>0))launch(player.hero,'q',ang,tgt);}catch(err){fail(err);}return r;};
const fxBase=fx;fx=function(type,x,y,opt){const r=fxBase.apply(this,arguments);
 try{const o=opt||{};if(type==='storySourceSkill'&&o.storyWER&&o.stage==='warning'&&live()&&o.sourceHero===player.hero){stats.werCasts++;const e=typeof nearestEnemy==='function'?nearestEnemy(12):null;launch(player.hero,String(o.sourceSlot||'w'),Number.isFinite(o.visualWorldAngle35)?o.visualWorldAngle35:e?Math.atan2(e.y-y,e.x-x):0,e?{x:e.x,y:e.y}:null);}}catch(err){fail(err);}return r;};

window.__STORYWORLD_D2S_R106__=Object.freeze({revision:'R106-d2s-1',archetypes:ARCH,names:NAMES,on,setEnabled,launch,
 // 검사용: 시간을 멈추고 특정 시점의 장면을 그려 보기
 test:Object.freeze({freeze:v=>{frozen=!!v;return frozen;},seek:t=>{for(const e of list){const d=Math.max(0,t-e.t);e.t=t;e.dt=(e.dt||0)+d;}return list.length;},clear:()=>{list.length=0;}}),
 effects:()=>list.map(e=>({kind:e.kind,hero:e.hero,tier:e.tier,t:e.t,life:e.life})),
 inspect:()=>({revision:'R106-d2s-1',enabled,on:on(),effects:list.length,...stats,lastError,presentationOnly:true,gameplayChanged:false,savesTouched:false})});
})();
