// R1263 — 7대죄 보스 스킬을 서사 문장대로 연출(프레임 애니메이션 시트만, 코드 도형·바닥 예고 장판 없음).
//  사용자 2026-11-20 03:27Z "이거 텍스트에맞게 7대죄 보스들 스킬 연출해줘 프레임애니메이션이펙트로" (정본 r448 제2부 문장, 문장은 바꾸지 않음)
//  · 탐식 베엘제붑(b04-boss) '탐식의 만찬': "식칼과 프라이팬을 마구 던졌다 … 역한 독가스" → 돌아가는 식칼 5자루를 부채꼴로 던지고, 떨어진 자리마다 독가스가 남는다.
//  · 색욕 붉은 하이힐(b05-boss) '매혹의 빛': "첫 공격은 피했으나, 뒤따른 매혹의 빛이 내 손목에 닿았다 … 칼끝이 오히려 내 목을" →
//     빠른 첫 빛(미끼) 뒤 매혹의 빛. 맞으면 1.6초 매혹: 보스 쪽으로 끌려가고(벽은 못 뚫음) 칼끝이 목을 겨누는 동안 작은 피해.
//  · 분노 청소부(b07-boss) '분노의 변신': "곰의 모습으로 달려들었다가 늑대 무리로 흩어졌고, 다시 엉겨 붙어 용의 형상" → 불곰 돌진 → 늑대 5마리 흩어짐 → 보스 곁에 용이 솟아 불길을 뿜는다.
//  · 생체 부트로더 회장(b09-boss) '현세·몽세 합치기': "설원 아래에서 검은 전선들이 솟아올랐다 … 죽은 동료들의 형상" → 검은 전선 7마디가 영웅 쪽으로 이어 솟고, 그 끝 둘레에 죽은 동료 환영 3이 솟아 덮친다.
//  · 맘몬(b06·b06b)은 사용자 결정 전이라 넣지 않음. 나태(b02)는 R1258 스레드 몫.
//  · 피해: 영웅이 받는 피해, 보스 근접 피해 배수, 한 시전 합 ≤ 1.4대. 예고는 보스·이펙트 자체의 솟음·시전 동작으로(바닥 장판 없음).
//  · 그림(임시, 최종 아님 — Dots 전용 시트 오면 같은 이름으로 교체): assets/r1263/*.webp, scripts/r1263-sin-skill-sheets.py, index.json.
//  끄기: localStorage['storyworld.r1263.sinSkills']='{"on":false}'. 점검: window.__STORYWORLD_SIN_SKILLS_R1263__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_SIN_SKILLS_R1263__)return;
const REV='R1263-sin-skills-1',KEY='storyworld.r1263.sinSkills';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={casts:0,hits:0,dealt:0,errors:0,drawn:0,byBoss:{}};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const G=n=>{try{return Function('return typeof '+n+"!=='undefined'?"+n+':undefined')();}catch(_){return undefined;}};
const T=()=>{const t=G('time');return typeof t==='number'?t:0;};
const TUNE=Object.freeze({first:4,cd:13,cap:1.4,engage:13});
const SH=Object.freeze({utensils:'assets/r1263/utensils8.webp',gas:'assets/r1263/gas24.webp',orb:'assets/r1263/charm-orb8.webp',mark:'assets/r1263/charm-mark12.webp',bear:'assets/r1263/bear8.webp',wolf:'assets/r1263/wolf8.webp',dragon:'assets/r1263/dragon8.webp',fire:'assets/r1263/fire24.webp',wire:'assets/r1263/wire9.webp',phantom:'assets/r1263/phantom12.webp'});
const IDS={'b04-boss':'gluttony','b05-boss':'lust','b07-boss':'wrath','b09-boss':'boot'};
const NAMES=[[/베엘제붑|탐식의 귀/,'gluttony'],[/분노의 귀|불을 지른 청소부/,'wrath'],[/생체 부트로더|사이보그 회장/,'boot']];
function which(e){if(!e||e.r61Clone)return null;const id=String(e.nativeId||'');if(IDS[id])return IDS[id];if(id&&/^(b0|mb-)/.test(id))return null;const n=String(e.name||'');for(const [r,k] of NAMES)if(r.test(n))return k;return null;}
const P=()=>G('player');
function paused(){return !G('started')||G('loading')||G('modal')||G('storyScene')||!P()||!(P().hp>0)||!G('room');}
function free(x,y,r=.27){try{const b=G('blocked');return typeof b!=='function'||!b(x,y,r);}catch(_){return false;}}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
let cast=null,seenAt=null,next=0,lastT=-1,charm=null,warmed=-9;
function boss(){for(const e of G('room')?.enemies||[]){const k=which(e);if(k&&e.hp>0&&e.spawnState==='active'&&!e.disabled)return e;}return null;}
function hit(e,mult,x,y,tag){if(!cast)return false;const base=Number(e.damage)||0,dmg=base*mult;if(!(dmg>0)||cast.dealt+dmg>base*TUNE.cap+1e-9)return false;
 cast.dealt+=dmg;stats.hits++;stats.dealt+=dmg;try{const h=G('hurt');if(typeof h==='function')h(dmg,{x,y,owner:e.id,kind:'r1263-'+cast.k,r1263:cast.k,r1263part:tag});}catch(err){fail(err);}return true;}
function clear(){cast=null;charm=null;}
function hold(e,now){e.moving=false;e.nav=[];e.r230At=now;if(cast){e.x=cast.bx;e.y=cast.by;}}
function start(e,k,now){const p=P();stats.casts++;stats.byBoss[k]=(stats.byBoss[k]||0)+1;
 cast={k,t0:now,room:G('room'),boss:e,bx:e.x,by:e.y,dealt:0,shots:[],clouds:[],wolves:[],fires:[],wires:[],phantoms:[],phase:null,done:false,flags:{}};}
// ---- 탐식 ----
const GL={chant:.7,n:5,spread:.7,speed:7,range:10,r:.55,dmg:.3,gasLife:2.6,gasR:.9,gasDmg:.08,gasTick:.5};
function stepGluttony(e,age,now,p,dt){const c=cast;if(age<GL.chant){hold(e,now);return;}
 if(!c.flags.thrown){c.flags.thrown=true;const a0=Math.atan2(p.y-e.y,p.x-e.x);for(let i=0;i<GL.n;i++){const a=a0+(i-(GL.n-1)/2)*GL.spread/((GL.n-1)/2)*.5;c.shots.push({x:e.x,y:e.y,vx:Math.cos(a)*GL.speed,vy:Math.sin(a)*GL.speed,trav:0,t0:now,live:true,kind:'blade'});}}
 for(const s of c.shots){if(!s.live)continue;const nx=s.x+s.vx*dt,ny=s.y+s.vy*dt;s.trav+=GL.speed*dt;let land=false;
  if(!free(nx,ny,.12)||s.trav>=GL.range)land=true;else{s.x=nx;s.y=ny;}
  if(!land&&dist(s,p)<=GL.r){if(hit(e,GL.dmg,s.x,s.y,'blade'))land=true;}
  if(land){s.live=false;c.clouds.push({x:s.x,y:s.y,t0:now});}}
 if(!c.flags.gasT||now-c.flags.gasT>=GL.gasTick){const inGas=c.clouds.some(g=>now-g.t0<GL.gasLife&&dist(g,p)<=GL.gasR);if(inGas){c.flags.gasT=now;hit(e,GL.gasDmg,p.x,p.y,'gas');}}
 c.clouds=c.clouds.filter(g=>now-g.t0<GL.gasLife);if(c.flags.thrown&&!c.shots.some(s=>s.live)&&!c.clouds.length)c.done=true;}
// ---- 색욕 ----
const LU={chant:.6,gap:.35,speed:6.5,range:11,r:.55,decoy:.25,dmg:.3,charm:1.6,pull:1.5,stop:1.3,tick:.4,tickDmg:.1};
function stepLust(e,age,now,p,dt){const c=cast;if(age<LU.chant+LU.gap){hold(e,now);}
 const fire=(kind)=>{const a=Math.atan2(p.y-e.y,p.x-e.x);c.shots.push({x:e.x,y:e.y,vx:Math.cos(a)*LU.speed*(kind==='decoy'?1.3:1),vy:Math.sin(a)*LU.speed*(kind==='decoy'?1.3:1),trav:0,t0:now,live:true,kind});};
 if(age>=LU.chant&&!c.flags.decoy){c.flags.decoy=true;fire('decoy');}
 if(age>=LU.chant+LU.gap&&!c.flags.orb){c.flags.orb=true;fire('charm');}
 for(const s of c.shots){if(!s.live)continue;const sp=Math.hypot(s.vx,s.vy);s.x+=s.vx*dt;s.y+=s.vy*dt;s.trav+=sp*dt;if(s.trav>=LU.range){s.live=false;continue;}
  if(dist(s,p)<=LU.r){s.live=false;if(s.kind==='decoy')hit(e,LU.decoy,s.x,s.y,'heel');else if(hit(e,LU.dmg,s.x,s.y,'charm'))charm={t0:now,until:now+LU.charm,boss:e,tick:now};}}
 if(charm){if(now>=charm.until||!(e.hp>0))charm=null;else{const d=dist(p,e);if(d>LU.stop){const ux=(e.x-p.x)/d,uy=(e.y-p.y)/d,st=Math.min(LU.pull*dt,d-LU.stop);const nx=p.x+ux*st,ny=p.y+uy*st;
   if(free(nx,ny))p.x=nx,p.y=ny;else if(free(nx,p.y))p.x=nx;else if(free(p.x,ny))p.y=ny;}
  if(now-charm.tick>=LU.tick){charm.tick=now;hit(e,LU.tickDmg,p.x,p.y,'blade-throat');}}}
 if(c.flags.orb&&!c.shots.some(s=>s.live)&&!charm)c.done=true;}
// ---- 분노 ----
const WR={rise:.6,speed:9,charge:8,r:.9,dmg:.4,wolves:5,wSpread:1.75,wSpeed:8,wTrav:4.5,wR:.5,wDmg:.2,wMax:2,dRise:.7,patches:5,pGap:1.2,pStag:.08,pLife:1.4,pR:.7,pDmg:.3};
function stepWrath(e,age,now,p,dt){const c=cast,f=c.flags;
 if(!f.bear){f.bear={x:e.x,y:e.y,t0:now,charging:false,trav:0};c.phase='bear';}
 const b=f.bear;
 if(c.phase==='bear'){hold(e,now);if(now-b.t0<WR.rise)return;
  if(!b.charging){b.charging=true;const a=Math.atan2(p.y-b.y,p.x-b.x);b.vx=Math.cos(a);b.vy=Math.sin(a);}
  const st=WR.speed*dt,nx=b.x+b.vx*st,ny=b.y+b.vy*st;let end=b.trav>=WR.charge||!free(nx,ny,.35);if(!end){b.x=nx;b.y=ny;b.trav+=st;}
  if(!f.bearHit&&dist(b,p)<=WR.r){f.bearHit=true;hit(e,WR.dmg,b.x,b.y,'bear');}
  if(end){c.phase='wolves';f.w0=now;const a0=Math.atan2(b.vy,b.vx);for(let i=0;i<WR.wolves;i++){const a=a0+(i-(WR.wolves-1)/2)*WR.wSpread/(WR.wolves-1);c.wolves.push({x:b.x,y:b.y,vx:Math.cos(a),vy:Math.sin(a),trav:0,live:true});}}return;}
 if(c.phase==='wolves'){let any=false;for(const w of c.wolves){if(!w.live)continue;any=true;const st=WR.wSpeed*dt,nx=w.x+w.vx*st,ny=w.y+w.vy*st;
   if(w.trav>=WR.wTrav||!free(nx,ny,.2)){w.live=false;continue;}w.x=nx;w.y=ny;w.trav+=st;
   if(!w.hit&&(f.wHits||0)<WR.wMax&&dist(w,p)<=WR.wR){w.hit=true;if(hit(e,WR.wDmg,w.x,w.y,'wolf'))f.wHits=(f.wHits||0)+1;}}
  if(!any){c.phase='dragon';f.d0=now;}return;}
 if(c.phase==='dragon'){hold(e,now);const da=now-f.d0;
  if(da>=WR.dRise&&!f.breath){f.breath=true;const a=Math.atan2(p.y-e.y,p.x-e.x);for(let i=1;i<=WR.patches;i++){const x=e.x+Math.cos(a)*WR.pGap*i,y=e.y+Math.sin(a)*WR.pGap*i;if(!free(x,y,.2))break;c.fires.push({x,y,t0:now+i*WR.pStag});}}
  if(f.breath&&!f.fireHit)for(const q of c.fires){if(now>=q.t0+.15&&now<q.t0+WR.pLife&&dist(q,p)<=WR.pR){f.fireHit=true;hit(e,WR.pDmg,q.x,q.y,'dragon-fire');break;}}
  if(f.breath&&c.fires.every(q=>now>=q.t0+WR.pLife))c.done=true;}}
// ---- 생체 부트로더 ----
const BO={chant:.6,segs:7,step:1.1,stag:.1,rise:.25,life:1.3,r:.6,dmg:.3,ring:2.2,pRise:.5,pHold:.5,lunge:.3,pReach:2.8,pR:.6,pDmg:.3,pSink:.5};
function stepBoot(e,age,now,p,dt){const c=cast,f=c.flags;if(age<BO.chant){hold(e,now);return;}
 if(!f.wired){f.wired=true;const a=Math.atan2(p.y-e.y,p.x-e.x),d=Math.min(BO.segs*BO.step,Math.max(dist(p,e),2));let tip={x:e.x,y:e.y};
  for(let i=1;i<=BO.segs;i++){const x=e.x+Math.cos(a)*BO.step*i,y=e.y+Math.sin(a)*BO.step*i;if(!free(x,y,.2))break;c.wires.push({x,y,t0:now+i*BO.stag});if(BO.step*i<=d+1e-6)tip={x,y};}
  f.tip=tip;f.p0=now+BO.segs*BO.stag+.2;}
 if(!f.wireHit)for(const w of c.wires){if(now>=w.t0+BO.rise&&now<w.t0+BO.life&&dist(w,p)<=BO.r){f.wireHit=true;hit(e,BO.dmg,w.x,w.y,'wire');break;}}
 if(!f.ph&&now>=f.p0){f.ph=true;const a0=Math.atan2(f.tip.y-e.y,f.tip.x-e.x);for(let i=0;i<3;i++){const a=a0+Math.PI/3+i*2*Math.PI/3;let q={x:f.tip.x+Math.cos(a)*BO.ring,y:f.tip.y+Math.sin(a)*BO.ring};
   if(!free(q.x,q.y,.25))q={x:f.tip.x+Math.cos(a)*BO.ring*.5,y:f.tip.y+Math.sin(a)*BO.ring*.5};if(!free(q.x,q.y,.25))q={...f.tip};c.phantoms.push({x:q.x,y:q.y,sx:q.x,sy:q.y,t0:now,hit:false});}}
 for(const h of c.phantoms){const a=now-h.t0;if(a<BO.pRise+BO.pHold)continue;
  if(!h.tx){const d=dist(p,h),k=Math.min(1,BO.pReach/Math.max(d,1e-6));h.tx=h.sx+(p.x-h.sx)*k;h.ty=h.sy+(p.y-h.sy)*k;}
  const u=Math.min(1,(a-BO.pRise-BO.pHold)/BO.lunge);h.x=h.sx+(h.tx-h.sx)*u;h.y=h.sy+(h.ty-h.sy)*u;
  if(u>=1&&!h.hit){h.hit=true;if(dist(h,p)<=BO.pR)hit(e,BO.pDmg,h.x,h.y,'phantom');}}
 const pEnd=BO.pRise+BO.pHold+BO.lunge+BO.pSink;
 if(f.ph&&c.phantoms.every(h=>now-h.t0>=pEnd)&&c.wires.every(w=>now>=w.t0+BO.life))c.done=true;}
const STEP={gluttony:stepGluttony,lust:stepLust,wrath:stepWrath,boot:stepBoot};
function step(){if(!prefs.on){if(cast||charm)clear();return;}if(paused())return;const now=T();if(!(now>lastT)){lastT=now;return;}const dt=Math.min(.1,now-lastT);lastT=now;
 const room=G('room'),p=P();
 if(cast&&(cast.room!==room||!(cast.boss.hp>0)||cast.boss.spawnState!=='active')){clear();next=now+TUNE.cd;}
 const e=cast?cast.boss:boss();if(!e){seenAt=null;return;}
 if(!cast){const near=dist(p,e)<=TUNE.engage;if(!near)return;if(seenAt===null||seenAt>now){seenAt=now;next=Math.max(next,now+TUNE.first);}if(now>=next&&!e.attack)start(e,which(e),now);else return;}
 try{STEP[cast.k](e,now-cast.t0,now,p,dt);}catch(err){fail(err);cast.done=true;}
 if(cast&&(cast.done||now-cast.t0>9)){cast=null;charm=null;next=now+TUNE.cd;}}
// ---- 그리기(시트만) ----
function want(path){try{if(G('loading')||!G('started'))return;const ad=G('addImage');if(typeof ad==='function')ad(path);}catch(_){}}
function img(path){try{const r=G('readyImage')?.(path),im=r?.image;if(!r)want(path);return im&&(im.naturalWidth||im.width)>0?im:null;}catch(_){return null;}}
const N={utensils:8,gas:24,orb:8,mark:12,bear:8,wolf:8,dragon:8,fire:24,wire:9,phantom:12};
function strip(key,f,x,y,w,h,alpha,flip){const im=img(SH[key]);if(!im||!(alpha>0))return;const c=G('ctx'),n=N[key],cw=(im.naturalWidth||im.width)/n,ch=im.naturalHeight||im.height,i=Math.max(0,Math.min(n-1,f|0));
 c.save();c.globalAlpha=Math.min(1,alpha);if(flip){c.translate?.(x+w,y);c.scale?.(-1,1);c.drawImage(im,i*cw,0,cw,ch,0,0,w,h);}else c.drawImage(im,i*cw,0,cw,ch,x,y,w,h);c.restore();stats.drawn++;}
const unit=()=>(Number(G('TILE'))||32)*(Number(G('zoom'))||1);
const AH=()=>{try{return G('actorHeight')?.()||60;}catch(_){return 60;}};
function sc(c,id,x,y,fn){if(typeof c.scope==='function')c.scope({id:'r1263:'+id,kind:'effect',enemy:true,ownerType:'enemy',x,y,groundAligned:false,lightShadowApproved:true},fn);else fn();}
/* 바닥 피벗(아래 가운데)으로 세워 그린다 */
function at(key,f,x,y,w,h,piv,alpha,flip){const c=G('ctx'),pr=G('project');sc(c,key+(x*97+y|0),x,y,()=>{const q=pr(x,y);strip(key,f,q.x-w/2,q.y-h*piv,w,h,alpha,flip);});}
function draw(){const c=G('ctx'),pr=G('project');if(!c||typeof pr!=='function'||!cast)return;const now=T(),U=unit(),ah=AH(),k=cast.k,e=cast.boss,age=now-cast.t0;
 if(k==='gluttony'){for(const g of cast.clouds){const a=now-g.t0,u=a/GL.gasLife,fr=a<.5?a/.5*6:6+((a-.5)/(GL.gasLife-.5))*17.99;at('gas',fr,g.x,g.y,U*3,U*3,.62,Math.min(1,(1-u)*2.5));}
  if(age<GL.chant)at('gas',Math.floor(age/GL.chant*5.99),e.x,e.y,U*1.6,U*1.6,.8,.7);
  for(const s of cast.shots)if(s.live)at('utensils',Math.floor((now-s.t0)*18)%8,s.x,s.y,U*1.4,U*1.4,1.35,1);}
 if(k==='lust'){for(const s of cast.shots)if(s.live){const w=U*(s.kind==='decoy'?1.2:1.7);at('orb',Math.floor((now-s.t0)*14)%8,s.x,s.y,w,w*.75,1.2,1,s.vx<0);}
  if(charm){const p=P(),u=(now-charm.t0)/LU.charm;at('mark',Math.min(11,Math.floor(u*12)),p.x,p.y,U*1.3,U*1.3,(ah*.78+U*.65)/(U*1.3),1);}}
 if(k==='wrath'){const f=cast.flags,b=f.bear;
  if(cast.phase==='bear'&&b){const a=now-b.t0,fr=a<WR.rise?a/WR.rise*4.99:5+Math.floor(a*10)%3;at('bear',fr,b.x,b.y,U*4.2,U*4.2,.92,1,(b.vx||0)<0);}
  for(const w of cast.wolves)if(w.live)at('wolf',4+Math.floor((now-f.w0)*12+w.vx*3)%4,w.x,w.y,U*2.6,U*2.6,.92,1,w.vx<0);
  if(cast.phase==='dragon'){const da=now-f.d0;at('dragon',da<WR.dRise?da/WR.dRise*4.99:5+Math.floor(da*8)%3,e.x,e.y-.2,U*4.6,U*4.6,.92,Math.min(1,(WR.dRise+WR.pLife+.6-da)*2));
   for(const q of cast.fires){const a=now-q.t0;if(a<0||a>=WR.pLife)continue;at('fire',a/WR.pLife*23.99,q.x,q.y,U*2.4,U*2.4,.82,1);}}}
 if(k==='boot'){for(const w of cast.wires){const a=now-w.t0;if(a<0||a>=BO.life)continue;const fr=a<BO.rise?a/BO.rise*4:4+((a-BO.rise)/(BO.life-BO.rise))*4.99;at('wire',fr,w.x,w.y,U*2.4,U*2.4,.78,Math.min(1,(BO.life-a)*4));}
  const pEnd=BO.pRise+BO.pHold+BO.lunge+BO.pSink;for(const h of cast.phantoms){const a=now-h.t0;if(a<0||a>=pEnd)continue;
   const fr=a<BO.pRise?a/BO.pRise*5.99:a<BO.pRise+BO.pHold+BO.lunge?5:6+(a-BO.pRise-BO.pHold-BO.lunge)/BO.pSink*5.99;const H=ah*1.25,W=H*192/256;at('phantom',fr,h.x,h.y,W,H,246/256,.9,(h.tx??h.x)<h.x);}}}
const SENT={type:'r1263-fx',x:0,y:0,age:0,life:Infinity};
function arm(){try{const fx=G('effects');if(Array.isArray(fx)&&!fx.includes(SENT)){SENT.age=0;fx.push(SENT);}}catch(_){}}
function warm(){const now=T();if(now-warmed<3&&now>=warmed)return;warmed=now;const e=boss(),k=which(e),use={gluttony:['utensils','gas'],lust:['orb','mark'],wrath:['bear','wolf','dragon','fire'],boot:['wire','phantom']}[k]||[];for(const q of use)if(!G('readyImage')?.(SH[q]))want(SH[q]);}
const DE=G('drawEffect');if(typeof DE==='function'){const base=DE;try{Function('f','drawEffect=f')(function(fx,...a){if(fx&&fx.type==='r1263-fx'){try{if(prefs.on)draw();}catch(err){fail(err);}return;}return base.apply(this,[fx,...a]);});}catch(err){fail(err);}}
const TK=G('tick');if(typeof TK==='function'){const base=TK;try{Function('f','tick=f')(function(...a){const r=base.apply(this,a);try{step();if(prefs.on&&boss())warm();if(cast)arm();}catch(err){fail(err);}return r;});}catch(err){fail(err);}}
function set(v){prefs={...prefs,...(v&&typeof v==='object'?v:{on:v!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}if(!prefs.on)clear();return {...prefs};}
window.__STORYWORLD_SIN_SKILLS_R1263__=Object.freeze({revision:REV,set,which,tune:TUNE,sheets:SH,
 cast:(force)=>{const e=boss();if(!e)return false;if(force||!cast){clear();start(e,which(e),T());}return true;},
 inspect:()=>({revision:REV,prefs:{...prefs},...JSON.parse(JSON.stringify(stats)),casting:!!cast,boss:cast?.k||null,phase:cast?.phase||null,
  charm:charm?Math.max(0,charm.until-charm.t0):0,wires:cast?.wires.length||0,phantoms:cast?.phantoms.length||0,next,lastError})});
})();
