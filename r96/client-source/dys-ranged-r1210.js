// R1210 — 사몽 S-06 디스토피아 일반 몹의 미래형 원거리 공격(레이저·방사능·음파).
//  사용자 2026-11-19 07:25Z "디스토피아 적들이 레어지공격이나 방사능공격 음파공격등 미래기술에 맞는 원거리 공격들을 사용하도록 이펙트없으면 닷츠에게 요청협업"
//  07:31Z 범위 확장(기계·귀신·마법 계열) — 이 파일은 그 1단계(기계 계열 중 디스토피아). 종류 표(KINDS)·이름 표(NAMES)에 줄을 더해 넓힌다.
//  · 종류: 레이저 = 겨누기(조준선 예고) 뒤 고정된 방향으로 곧은 빛줄기 / 방사능 = 영웅 발밑으로 포낭 투척 → 독빛 웅덩이(0.5초마다) / 음파 = 앞 부채꼴로 퍼지는 파동 고리.
//  · 근접형(ai melee) 몹: 3~7칸이면 겨누기(제자리) → 발사. 쿨다운 6초대·동시 3마리까지·방에 들어선 뒤 0.8~2.4초 지연.
//  · 원거리형(ai hybrid·ranged) 몹: 엔진 ranged3(기본 탄) 차례를 같은 종류의 미래형 공격으로 바꾼다(추가 사격 없음, 횟수 그대로).
//  · 피해: 한 번 ≤ 근접 피해 e.damage×0.8, 방사능은 0.25×최대 4번. 근접형에 붙는 원거리 압박은 엔진 원거리 몹의 절반 이하(qa/r1210).
//  · 그림(임시, Dots 시트 오기 전): 레이저 = R600 빛줄기 시트(sw0011 쪽 나눔)·시작·명중 섬광, 방사능 = R562 독안개·독웅덩이 시트, 음파 = R438 충격파 시트 + 먹선 부채꼴.
//    예고는 먹선 + 차가운 계열 색(주황 예고 도형 금지 #712). 보스·중간보스는 건드리지 않는다.
//  끄기: localStorage['storyworld.r1210.dys']='{"on":false}'. 점검: window.__STORYWORLD_DYS_RANGED_R1210__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_DYS_RANGED_R1210__)return;
const REV='R1210-dys-ranged-1',KEY='storyworld.r1210.dys';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={aims:0,fires:{laser:0,radiation:0,sonic:0},engine:0,hits:{laser:0,radiation:0,sonic:0},cancels:0,drawn:{},errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const G=n=>{try{return Function('return typeof '+n+"!=='undefined'?"+n+':undefined')();}catch(_){return undefined;}};
const T=()=>{const t=G('time');return typeof t==='number'?t:0;};
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)/4294967296;};
// ---- 표 ----
const TUNE=Object.freeze({
 laser:Object.freeze({min:3,max:7,windup:.7,dmg:.8,cd:6.2,width:.42,len:7.5,life:.32}),
 radiation:Object.freeze({min:3,max:6.5,windup:.6,dmg:.25,ticks:4,cd:6.8,radius:1.15,flight:.55,pool:2.2,gap:.5}),
 sonic:Object.freeze({min:2.6,max:5.5,windup:.55,dmg:.7,cd:6.0,speed:6,band:.45,half:.62,reach:6})});
const NAMES=Object.freeze({
 '프리즘 저격병':'laser','중장 광선포병':'laser','외계 침공군':'laser','전선 절단자 · 짙은 형상':'laser','낫팔 잠복체':'laser',
 '두족류 생체기계 침공병':'radiation','변이된 사냥개 괴수':'radiation','포낭 곡사체':'radiation','배양 공병':'radiation',
 '폐선로 태엽 군단병':'sonic','펄스 척후병':'sonic','막익 급습체':'sonic','방벽 돌진체':'sonic','원반 포획체':'sonic','심해 연산거수 · 짙은 형상':'sonic'});
const FIRST=Object.freeze([.8,2.4]),MAXLIVE=3,FIRE_HOLD=.25;
const norm=n=>String(n??'').replace(/\s+\d+$/,'').trim();
function kindFor(name){const k=NAMES[norm(name)];return k||null;}
const major=e=>!!(e&&(e.boss||e.midboss||e.persona||e.cosmic||e.trial||e.samongBoss||e.combatProfile?.major));
function eligible(e){return !!(e&&e.hp>0&&e.spawnState==='active'&&!e.disabled&&!major(e)&&kindFor(e.name));}
// ---- 판정(순수) ----
function laserHits(ox,oy,a,len,px,py,w){const dx=px-ox,dy=py-oy,c=Math.cos(a),s=Math.sin(a),t=dx*c+dy*s;if(t<0||t>len)return false;return Math.abs(-dx*s+dy*c)<=w;}
const angDiff=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
function waveHits(ox,oy,a,r,px,py,band,half){const d=Math.hypot(px-ox,py-oy);if(Math.abs(d-r)>band)return false;if(d<1e-6)return true;return angDiff(Math.atan2(py-oy,px-ox),a)<=half;}
function poolHits(cx,cy,r,px,py){return Math.hypot(px-cx,py-cy)<=r;}
// ---- 상태 ----
let live=[];const log=[];// 날아가는·남아 있는 공격: {kind,owner,dmg,...}
/* R200·R380 은 나온 뒤 이름을 바꾼다 → 이름이 바뀌면 종류를 다시 정한다(겨누는 중이면 그 공격은 그대로) */
const S=e=>{const s=e.r1210;if(s){if(s.name!==e.name&&!s.mode){s.name=e.name;s.kind=kindFor(e.name);}return s;}return (e.r1210={name:e.name,kind:kindFor(e.name),mode:null,t0:0,count:0,next:T()+FIRST[0]+hash(e.id||e.name)*(FIRST[1]-FIRST[0]),windup:0});};
const P=()=>G('player');
function solo(){let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';}
function paused(){return !G('started')||G('loading')||G('modal')||G('storyScene')||!P()||!(P().hp>0)||!G('room');}
function sees(e){try{const cl=G('clearLine');return typeof cl!=='function'||!!cl(e,P());}catch(_){return false;}}
function hurtP(d,src){try{const h=G('hurt');if(typeof h==='function'&&d>0)h(d,src);}catch(err){fail(err);}}
function face(e){try{const f=G('facing'),p=P();if(typeof f==='function'){const d=f(p.x-e.x,p.y-e.y);e.direction=d==='front'||d==='back'?((p.x-p.y)<(e.x-e.y)?'left':'right'):d;}}catch(_){}}
function busy(){let n=0;for(const e of G('room')?.enemies||[]){const m=e?.r1210?.mode;if(m==='windup'||m==='fire')n++;}return n;}
function startWindup(e,s,now){const p=P(),u=TUNE[s.kind];s.mode='windup';s.t0=now;s.windup=u.windup;s.hx=e.x;s.hy=e.y;
 const a=Math.atan2(p.y-e.y,p.x-e.x);s.aim={x:p.x,y:p.y,a};face(e);e.r230At=now;e.nav=[];stats.aims++;}
// 발사: aim 은 겨누기 시작 때(근접형) 또는 엔진 겨눔 각(원거리형)으로 고정 — 예고를 보고 옆으로 비키면 피한다.
function fire(e,s,now){const u=TUNE[s.kind],p=P(),dmg=(Number(e.damage)||0)*u.dmg,a=s.aim.a,src={x:e.x,y:e.y,owner:e.id,r1210:s.kind};
 s.mode='fire';s.t0=now;s.count++;log.push([String(e.name||''),s.kind,+now.toFixed(2),s.count]);if(log.length>60)log.shift();s.next=now+u.cd+hash((e.id||'')+':'+s.count)*.8;stats.fires[s.kind]++;
 if(s.kind==='laser'){live.push({kind:'laser',owner:e.id,ox:e.x,oy:e.y,a,len:u.len,t0:now,life:u.life});
  if(laserHits(e.x,e.y,a,u.len,p.x,p.y,u.width)){hurtP(dmg,src);stats.hits.laser++;}}
 else if(s.kind==='sonic')live.push({kind:'sonic',owner:e.id,ox:e.x,oy:e.y,a,t0:now,life:u.reach/u.speed,dmg,src,hit:false});
 else{const d=Math.min(Math.hypot(s.aim.x-e.x,s.aim.y-e.y),u.max),tx=e.x+Math.cos(a)*d,ty=e.y+Math.sin(a)*d;
  live.push({kind:'radiation',owner:e.id,ox:e.x,oy:e.y,tx,ty,t0:now,life:u.flight+u.pool,dmg,src,ticks:0,lastTick:-9});}}
function advanceLive(now){const p=P();live=live.filter(x=>{const age=now-x.t0;if(age>x.life)return false;
 if(x.kind==='sonic'&&!x.hit){const u=TUNE.sonic,r=age*u.speed;if(waveHits(x.ox,x.oy,x.a,r,p.x,p.y,u.band,u.half)){x.hit=true;hurtP(x.dmg,x.src);stats.hits.sonic++;}}
 else if(x.kind==='radiation'){const u=TUNE.radiation;if(age>=u.flight&&x.ticks<u.ticks&&now-x.lastTick>=u.gap-1e-6&&poolHits(x.tx,x.ty,u.radius,p.x,p.y)){x.ticks++;x.lastTick=now;hurtP(x.dmg,x.src);stats.hits.radiation++;}}
 return true;});}
let lastT=-1;
function step(){if(!prefs.on||paused())return;const now=T();if(!(now>lastT)){lastT=now;return;}lastT=now;
 advanceLive(now);const p=P(),room=G('room');let n=busy();
 for(const e of room.enemies||[]){if(!e)continue;const s=e.r1210;
  if(s?.mode){if(!eligible(e)||e.attack){s.mode=null;stats.cancels++;continue;}
   const age=now-s.t0;
   if(s.mode==='windup'){e.x=s.hx;e.y=s.hy;e.moving=false;e.nav=[];e.r230At=now;e.cd=Math.max(Number(e.cd)||0,s.windup-age+.3);face(e);if(age>=s.windup)fire(e,s,now);}
   else if(s.mode==='fire'){if(age>=FIRE_HOLD)s.mode=null;else{e.moving=false;e.r230At=now;}}
   continue;}
  if(!solo()||!eligible(e)||e.ai==='hybrid'||e.ai==='ranged'||e.attack||e.rangedWindup>0||e.r286?.mode||e.rest>0)continue;
  const st=S(e);if(!st.kind)continue;warm();if(now<st.next||n>=MAXLIVE)continue;const u=TUNE[st.kind],d=Math.hypot(p.x-e.x,p.y-e.y);
  if(d<u.min||d>u.max||!sees(e))continue;startWindup(e,st,now);n++;}}
// 엔진 원거리 차례(hybrid·ranged): 기본 탄 대신 같은 종류 미래형 공격(겨눔 각은 엔진 rangedAim).
const R3=G('ranged3');
if(typeof R3==='function'){const base=R3;const wrapped=function(e,...a){try{if(prefs.on&&eligible(e)){const s=S(e),p=P(),ang=Number.isFinite(e.rangedAim)?e.rangedAim:Math.atan2(p.y-e.y,p.x-e.x),d=Math.hypot(p.x-e.x,p.y-e.y);
   s.aim={x:e.x+Math.cos(ang)*d,y:e.y+Math.sin(ang)*d,a:ang};stats.engine++;warm();fire(e,s,T());arm();return;}}catch(err){fail(err);}return base.apply(this,[e,...a]);};
 try{Function('f','ranged3=f')(wrapped);}catch(err){fail(err);}}
// ---- 그리기 ----
const SH=Object.freeze({beamPages:['assets/sw0011/beam-0.webp','assets/sw0011/beam-1.webp'],bstart:'assets/r600/dots/sv-beam-start.webp',bhit:'assets/r600/dots/sv-beam-hit.webp',
 ring:'assets/r438/fx/enemy-shockwave.webp',mist:'assets/r562/neon-toxic-mist.webp',pool:'assets/r562/dots/neon-toxic-pool.webp'});
const COL=Object.freeze({ink:'rgba(12,14,20,.62)',laser:'#a8f4ff',rad:'#9be37a',sonic:'#c9d6f2'});
function img(path){try{const r=G('readyImage')?.(path),im=r?.image;if(!r)want(path);return im&&(im.naturalWidth||im.width)>0?im:null;}catch(_){return null;}}
/* 엔진은 지역을 옮길 때 그 지역에 안 쓰는 그림을 imageCache 에서 내린다(R912) → 없으면 다시 부른다(부팅 중엔 부르지 않음). 디스토피아 몹을 처음 보면 미리 부른다. */
function want(path){try{if(G('loading')||!G('started'))return;const ad=G('addImage');if(typeof ad==='function')ad(path);}catch(err){fail(err);}}
let warmAt=-9;function warm(){const now=T();if(now-warmAt<2&&now>=warmAt)return;warmAt=now;for(const q of [...SH.beamPages,SH.bstart,SH.bhit,SH.ring,SH.mist,SH.pool])if(!G('readyImage')?.(q))want(q);}
function grid(path,f,x,y,w,h,alpha){const im=img(path);if(!im)return false;const c=G('ctx'),cw=(im.naturalWidth||im.width)/6,ch=(im.height||im.naturalHeight)/4,i=((f%24)+24)%24;
 c.save();c.globalAlpha=alpha;c.drawImage(im,(i%6)*cw,Math.floor(i/6)*ch,cw,ch,x-w/2,y-h/2,w,h);c.restore();return true;}
function strip(path,n,cell,f,x,y,size,alpha){const im=img(path);if(!im)return false;const c=G('ctx');c.save();c.globalAlpha=alpha;c.drawImage(im,(Math.max(0,Math.min(n-1,f)))*cell,0,cell,cell,x-size/2,y-size/2,size,size);c.restore();return true;}
const unit=()=>(Number(G('TILE'))||32)*(Number(G('zoom'))||1);
const AH=()=>{try{return G('actorHeight')?.()||60;}catch(_){return 60;}};
function line(c,a,b,w,col,alpha){c.save();c.globalAlpha=alpha;c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();c.restore();}
function ell(c,q,rx,ry,col,alpha,fill,lw){c.save();c.globalAlpha=alpha;c.beginPath();c.ellipse?.(q.x,q.y,Math.max(1,rx),Math.max(1,ry),0,0,Math.PI*2);if(fill){c.fillStyle=col;c.fill();}else{c.strokeStyle=col;c.lineWidth=lw||2;c.stroke();}c.restore();}
function arcs(c,o,a,r,half,col,alpha,w){/* 아이소 화면에서 부채꼴 고리: 월드 점을 이어 그린다 */const pr=G('project');c.save();c.globalAlpha=alpha;c.strokeStyle=col;c.lineWidth=w;c.beginPath();
 for(let i=0;i<=12;i++){const t=a-half+2*half*i/12,q=pr(o.x+Math.cos(t)*r,o.y+Math.sin(t)*r);if(i)c.lineTo(q.x,q.y-AH()*.35);else c.moveTo(q.x,q.y-AH()*.35);}c.stroke();c.restore();}
function drawTele(c,e,kind,u01,aim){const pr=G('project'),ah=AH(),q=pr(e.x,e.y),chest={x:q.x,y:q.y-ah*.45},g=Math.max(0,Math.min(1,u01));
 if(kind==='laser'){const L=TUNE.laser.len,end=pr(e.x+Math.cos(aim.a)*L,e.y+Math.sin(aim.a)*L),to={x:end.x,y:end.y-ah*.35};
  line(c,chest,to,3+3*g,COL.ink,.25+.35*g);line(c,chest,to,1+1.2*g,COL.laser,.25+.6*g);strip(SH.bstart,8,64,Math.floor(g*7.99),chest.x,chest.y,ah*(.35+.35*g),.6+.4*g);}
 else if(kind==='sonic'){for(let k=0;k<3;k++){const r=.5+k*.45+g*.3;arcs(c,e,aim.a,r,TUNE.sonic.half,COL.ink,.3*(1-k*.25),4);arcs(c,e,aim.a,r,TUNE.sonic.half,COL.sonic,(.25+.5*g)*(1-k*.25),1.5);}grid(SH.ring,Math.floor(g*9.99),chest.x,chest.y,ah*.7,ah*.45,.35+.4*g);}
 else{const t=pr(aim.x,aim.y),R=TUNE.radiation.radius*unit();ell(c,t,R,R*.5,COL.ink,.55,false,4);ell(c,t,R,R*.5,COL.rad,.45+.4*g,false,1.5);ell(c,t,R*g,R*.5*g,COL.rad,.12+.18*g,true);grid(SH.mist,Math.floor(g*23.99),chest.x,chest.y,ah*(.4+.3*g),ah*(.4+.3*g),.5+.5*g);}}
function drawLive(c,now){const pr=G('project'),ah=AH(),U=unit();
 for(const x of live){const age=now-x.t0;stats.drawn[x.kind]=(stats.drawn[x.kind]||0)+1;
  if(x.kind==='laser'){const k=Math.max(0,1-age/x.life),o=pr(x.ox,x.oy),e=pr(x.ox+Math.cos(x.a)*x.len,x.oy+Math.sin(x.a)*x.len),from={x:o.x,y:o.y-ah*.45},to={x:e.x,y:e.y-ah*.35},len=Math.hypot(to.x-from.x,to.y-from.y),an=Math.atan2(to.y-from.y,to.x-from.x),bh=Math.max(20,ah*.75);
   const f=Math.floor(age*25)%24,pg=img(SH.beamPages[Math.floor(f/12)]),cell=f%12;
   line(c,from,to,bh*.9,COL.ink,.35*k);
   if(pg){c.save();c.translate(from.x,from.y);c.rotate(an);/* 시트 빛줄기가 칸 높이에 비해 가늘어 두 겹(넓게 옅게 + 좁게 진하게) */c.globalAlpha=.55*k+.2;c.drawImage(pg,(cell%4)*512,Math.floor(cell/4)*48,512,48,0,-bh/2,len,bh);c.globalAlpha=.5+.5*k;c.drawImage(pg,(cell%4)*512,Math.floor(cell/4)*48,512,48,0,-bh/4,len,bh/2);c.restore();}else line(c,from,to,3,COL.laser,k);
   const fs=bh*1.2,fr=Math.min(7,Math.floor(age/x.life*8)),si=img(SH.bstart),hi=img(SH.bhit);
   if(si){c.save();c.globalAlpha=k;c.drawImage(si,fr*64,0,64,64,from.x-fs/2,from.y-fs/2,fs,fs);c.restore();}
   if(hi){c.save();c.globalAlpha=k;c.drawImage(hi,fr*64,0,64,64,to.x-fs/2,to.y-fs/2,fs,fs);c.restore();}}
  else if(x.kind==='sonic'){const u=TUNE.sonic,r=age*u.speed,k=Math.max(0,1-age/x.life);
   for(let j=0;j<3;j++){const rr=Math.max(.2,r-j*.35);arcs(c,{x:x.ox,y:x.oy},x.a,rr,u.half,COL.ink,.55*k*(1-j*.3),8);arcs(c,{x:x.ox,y:x.oy},x.a,rr,u.half,COL.sonic,.9*k*(1-j*.3),3);}
   if(age<.4){const o=pr(x.ox,x.oy);grid(SH.ring,Math.floor(age*30),o.x,o.y-ah*.2,U*2.2,U*1.4,.8*(1-age/.4));}}
  else{const u=TUNE.radiation;
   if(age<u.flight){const v=age/u.flight,wx=x.ox+(x.tx-x.ox)*v,wy=x.oy+(x.ty-x.oy)*v,q=pr(wx,wy),lift=ah*(.45+1.1*v*(1-v)*2);ell(c,{x:q.x,y:q.y-lift},U*.22,U*.22,COL.ink,.55,true);grid(SH.mist,Math.floor(age*20),q.x,q.y-lift,U*1.4,U*1.4,1);ell(c,{x:q.x,y:q.y-lift},U*.1,U*.1,COL.rad,.9,true);ell(c,q,5,2.5,COL.ink,.3,true);}
   else{const pa=age-u.flight,k=Math.min(1,pa/.2)*Math.min(1,(u.pool-pa)/.4),q=pr(x.tx,x.ty),R=u.radius*U;
    grid(SH.pool,Math.floor(pa*12.5),q.x,q.y,R*2.3,R*1.25,.85*k);grid(SH.mist,Math.floor(pa*12.5)+7,q.x,q.y-R*.35,R*1.4,R*1.2,.55*k);}}}}
function drawFx(){const c=G('ctx'),room=G('room');if(!c||!room||typeof G('project')!=='function')return;const now=T();
 for(const e of room.enemies||[]){if(!e||!(e.hp>0))continue;const s=e.r1210;
  if(s?.mode==='windup'&&s.aim)drawTele(c,e,s.kind,(now-s.t0)/s.windup,s.aim);
  else if(e.rangedWindup>0&&prefs.on&&eligible(e)){const k=kindFor(e.name),p=P(),a=Number.isFinite(e.rangedAim)?e.rangedAim:Math.atan2(p.y-e.y,p.x-e.x),d=Math.hypot(p.x-e.x,p.y-e.y);drawTele(c,e,k,1-e.rangedWindup/.55,{a,x:e.x+Math.cos(a)*d,y:e.y+Math.sin(a)*d});}}
 drawLive(c,now);}
const SENT={type:'r1210-fx',x:0,y:0,age:0,life:Infinity};
function arm(){try{const fx=G('effects');if(Array.isArray(fx)&&!fx.includes(SENT)){SENT.age=0;fx.push(SENT);}}catch(_){}}
const DE=G('drawEffect');if(typeof DE==='function'){const base=DE;try{Function('f','drawEffect=f')(function(fx,...a){if(fx&&fx.type==='r1210-fx'){try{if(prefs.on)drawFx();}catch(err){fail(err);}return;}return base.apply(this,[fx,...a]);});}catch(err){fail(err);}}
const TK=G('tick');if(typeof TK==='function'){const base=TK;try{Function('f','tick=f')(function(...a){const r=base.apply(this,a);try{step();const room=G('room');if(prefs.on&&(live.length||room?.enemies?.some(e=>e?.r1210?.mode||(e?.rangedWindup>0&&kindFor(e.name)))))arm();}catch(err){fail(err);}return r;});}catch(err){fail(err);}}
// 겨누기·쏘기 동안 몸 그림은 공격 자세(R286 과 같은 방식: 그릴 때만 가짜 attack, 판정은 그대로)
const DEN=G('drawEnemy');if(typeof DEN==='function'){const base=DEN;try{Function('f','drawEnemy=f')(function(e,...a){let saved=null;
 try{const s=e?.r1210;if(prefs.on&&s&&(s.mode==='windup'||s.mode==='fire')&&!e.attack&&e.hp>0){const sh=e.combatProfile?.attackShape||{},w=Math.max(.05,Number(sh.windup)||.3),act=Math.max(.05,Number(sh.active)||.12),age=Math.max(0,T()-s.t0);
  const el=s.mode==='windup'?Math.min(.98,age/Math.max(.05,s.windup))*w:w+Math.min(.98,age/FIRE_HOLD)*act;saved={attack:e.attack,moving:e.moving};
  e.attack={elapsed:el,angle:s.aim?.a??0,committed:s.mode==='fire',struckQuality:true,id:-1210,shape154:sh,origin154:{x:e.x,y:e.y},r1210Fake:true};e.moving=false;}}catch(err){fail(err);saved=null;}
 try{return base.apply(this,[e,...a]);}finally{if(saved){e.attack=saved.attack;e.moving=saved.moving;}}});}catch(err){fail(err);}}
// 방을 옮기면 남은 공격을 지운다
let lastRoom=null;if(typeof setInterval==="function")setInterval(()=>{try{const r=G('room');if(r!==lastRoom){lastRoom=r;live=[];}}catch(_){}},500);
function set(v){prefs={...prefs,...(v&&typeof v==='object'?v:{on:v!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}if(!prefs.on){live=[];for(const e of G('room')?.enemies||[])if(e?.r1210)e.r1210.mode=null;}return {...prefs};}
window.__STORYWORLD_DYS_RANGED_R1210__=Object.freeze({revision:REV,set,kindFor,eligible,laserHits,waveHits,poolHits,tune:TUNE,names:NAMES,maxLive:MAXLIVE,firstDelay:FIRST,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:JSON.parse(JSON.stringify(stats)),live:live.length,log:log.slice(-30),lastError})});
})();
