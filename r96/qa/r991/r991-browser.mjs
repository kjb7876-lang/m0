// R991 헤드리스 검사(Playwright, 소프트웨어 렌더): 기억사수 기본 공격을 8방향으로 쏘아
//  (1) 그려진 몸 그림(R143 공격 시트)의 총 각도가 쏜 방향에 가장 가까운 그림인지
//  (2) 탄이 그려진 총구 끝(그 칸·그 크기·발 위치에서 계산)에서 나오는지
//  (3) 탄이 표적을 향해 날아가는지 를 잰다. 이동 사격(MOVE=1)도 같은 기준.
//   STORYWORLD_URL=http://127.0.0.1:4396/m0/ OUT=out/r991 node r96/qa/r991/r991-browser.mjs
//   OFF=1: R991 을 끈 채(예전 동작, 전후 비교용 — 실패가 정상)
// GPU·실기기·자연 플레이 체감은 미검증(헤드리스).
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out/r991',MOVE=process.env.MOVE==='1',TAG=process.env.TAG||'';fs.mkdirSync(OUT,{recursive:true});
let fails=0;const check=(n,ok,info)=>{if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+n+(info===undefined?'':' '+JSON.stringify(info).slice(0,900)));};
// R143 기억사수 공격 시트(192×256 칸) — 총 각도(화면, 개머리→총구)와 칸마다 총구 끝(그림을 열어 잰 값, qa/r991/tips.png)
const GUN={e:-3,se:35,s:50,ne:-52,n:-57};
const WTIP={e:[[165,81],[166,76],[166,76],[166,80],[165,80],[164,76],[163,76],[164,81]],se:[[162,136],[161,140],[160,139],[159,135],[158,136],[159,140],[160,139],[161,136]],s:[[127,149],[125,149],[124,149],[124,149],[123,149],[122,149],[124,149],[126,149]],ne:[[164,39],[163,42],[162,41],[161,38],[160,39],[161,43],[162,41],[163,38]],n:[[142,45],[141,48],[140,47],[139,44],[138,45],[138,48],[140,47],[141,44]]};
const TIP={e:[[159,75],[154,72],[172,83],[151,71],[159,75],[163,77]],se:[[158,133],[155,130],[163,143],[152,126],[158,133],[159,137]],s:[[128,126],[128,126],[132,131],[125,119],[135,169],[135,169]],ne:[[156,38],[150,36],[170,43],[146,35],[156,38],[160,39]],n:[[134,44],[130,44],[145,47],[128,44],[135,45],[138,45]]};
const b=await chromium.launch({headless:true});const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:2});
await ctx.addInitScript((OFF)=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r953.gunnerVeil','{"on":false}');if(OFF)localStorage.setItem('storyworld.r991.gunnerAim','{"on":false}');}catch(_){}},process.env.OFF==='1');
const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.go('dist01','STORY');const P=window.__STORYWORLD_PROGRESSION_R71__;if(P?.difficultyState?.().open){P.selectDifficulty('normal');await P.confirmDifficulty();}});
await p.waitForFunction(()=>room?.id==='dist01'&&!loading,null,{timeout:180000});await skip();
await p.evaluate(async()=>{try{window.__STORYWORLD_GUNNER_ARMS_R561__.set({chain:false});}catch(_){}guide=false;auto=false;settings.autoSkill=false;loading=true;try{await ensureImages(heroPaths('gunner'));player.hero='gunner';player.combo=0;player.ego=0;}finally{loading=false;}updateHUD();
 window.__r991={body:null,shots:[],pin:null,nan:0};window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};/* 찍는 순간만 게임 시간을 거의 멈춤(qa/r444/scene4 방식) */
 const dh=drawHero;drawHero=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=dh.apply(this,a);
  try{if(st>=0&&player.hero==='gunner'){let bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind==='image'&&c.owner?.kind==='hero'&&c.points){const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;window.__r991.last={src:String(c.sourcePath||c.image?.src||'').split('/').slice(-2).join('/'),mir:c.points[1][0]<c.points[0][0],sx:c.sourceRect?.[0]};}}}}if(st>=0&&player.hero==='gunner'&&player.attackAnim>0&&!window.__r991.wbody)for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];const m=/gunner\/walk-([a-z]+)\.webp/.exec(String(c.sourcePath||c.image?.src||''));if(c.kind==='image'&&c.r121Walk&&m&&c.points)window.__r991.wbody={sheet:m[1],rect:c.sourceRect.slice(),points:c.points.map(q=>[q[0],q[1]]),t:time};}
  if(st>=0&&player.hero==='gunner'&&player.attackAnim>0)for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];const s=String(c.sourcePath||c.image?.src||'');const m=/r143\/attack\/gunner\/attack-([a-z]+)\.webp/.exec(s);
    if(c.kind==='image'&&m&&c.points){if(c.points.flat().some(v=>!Number.isFinite(v)))window.__r991.nan++;window.__r991.body={sheet:m[1],sx:c.sourceRect[0],points:c.points.map(q=>[q[0],q[1]]),t:time};}}}catch(_){}return r;};
 const ms=makeShot;makeShot=function(...args){const s=ms.apply(this,args);try{if(s?.friendly&&player.hero==='gunner'){const o=project(s.x,s.y);window.__r991.shots.push({x:s.x,y:s.y,vx:s.vx,vy:s.vy,sx:o.x,sy:o.y,t:time,damage:s.damage,radius:s.radius,speed:Math.hypot(s.vx,s.vy),life:s.life,mz:!!s.currentPublicMuzzle?.applied});}}catch(_){}return s;};
 /* 8방향 표적 자리가 모두 빈 바닥인 곳에 영웅을 세운다(벽에 걸린 몹은 엔진이 제자리로 되밀어 조준이 틀어진다) */
 {const ok=(x,y)=>{if(typeof blocked==='function'&&blocked(x,y,.5))return false;for(let s=0;s<8;s++){const S=s*Math.PI/4,dx=(Math.cos(S)+2*Math.sin(S))/2,dy=(2*Math.sin(S)-Math.cos(S))/2,L=Math.hypot(dx,dy);for(const r of [1.6,3.2,4])if(blocked(x+dx/L*r,y+dy/L*r,.6))return false;}return true;};
  let best=null;for(let r=0;r<30&&!best;r+=.5)for(let a=0;a<6.283&&!best;a+=.3){const x=player.x+Math.cos(a)*r,y=player.y+Math.sin(a)*r;if(ok(x,y))best={x,y};}
  if(best){player.x=best.x;player.y=best.y;}window.__r991.spot=best;}
 (function pin(){const P=window.__r991.pin;if(P){const e=P.e;e.x=player.x+P.dx;e.y=player.y+P.dy;e.spawnState='active';e.visible=true;e.hp=1e7;e.speed=0;e.attack=null;}requestAnimationFrame(pin);})();
});
const SEC={e:0,se:45,s:90,sw:135,w:180,nw:-135,n:-90,ne:-45},D=Math.PI/180,ad=(a,c)=>Math.abs(Math.atan2(Math.sin(a-c),Math.cos(a-c)))/D;
const gunAngle=(s,m)=>m?Math.PI-GUN[s]*D:GUN[s]*D;
const best=a=>{let v=1e9;for(const s in GUN)for(const m of [false,true])v=Math.min(v,ad(a,gunAngle(s,m)));return v;};
const rows=[];
const ONLY=(process.env.ONLY||'').split(',').filter(Boolean);
for(const [name,deg] of Object.entries(SEC)){if(ONLY.length&&!ONLY.includes(name))continue;
 const r=await p.evaluate(async([deg,MOVE])=>{const S=deg*Math.PI/180,dx=(Math.cos(S)+2*Math.sin(S))/2,dy=(2*Math.sin(S)-Math.cos(S))/2,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,P=player;room.engaged=true;
  const e=room.enemies.find(v=>v.hp>0&&!v.boss);for(const v of room.enemies){if(v!==e&&v.hp>0){v.x=P.x-60;v.y=P.y-60;v.speed=0;}}
  window.__r991.pin={e,dx:ux*3.2,dy:uy*3.2};e.x=P.x+ux*3.2;e.y=P.y+uy*3.2;e.hp=1e7;e.maxHp=Math.max(e.maxHp||1,1e7);
  P.hp=maxHP();P.invincible=999;P.attackCD=0;window.__r991.shots.length=0;window.__r991.body=null;window.__r991.wbody=null;
  if(MOVE){/* 표적과 직각으로 걸으며 쏨 */keys.add(Math.abs(Math.cos(S))>.5?'ArrowUp':'ArrowRight');}
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));basicAttack(true);const t0=time;
  const q=project(P.x,P.y),qe=project(e.x,e.y);return{t0,aim:Math.atan2(qe.y-q.y,qe.x-q.x),ex:qe.x,ey:qe.y};},[deg,MOVE]);
 await p.waitForFunction(([t,M])=>time>=t+.07&&(M||window.__r991.body),[r.t0,MOVE],{timeout:60000});
 await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(500);
 await p.screenshot({path:`${OUT}/${TAG}${MOVE?'move':'still'}-${name}.png`,clip:{x:330,y:110,width:300,height:220}});
 const m=await p.evaluate(()=>({wbody:window.__r991.wbody,drawn:window.__r991.last,moving:!!player.moving,body:window.__r991.body,shot:window.__r991.shots[0]||null,nan:window.__r991.nan,api:!!window.__STORYWORLD_GUNNER_AIM_R991__}));
 await p.evaluate(()=>{keys.clear();window.__SLOW=1;});
 const B=m.body,sh=m.shot;let row={name,aimDeg:+(r.aim/D).toFixed(1),drawn:m.drawn,moving:m.moving};
 if(B&&sh){const mir=B.points[1][0]<B.points[0][0],k=Math.abs(B.points[1][0]-B.points[0][0])/192,ky=(B.points[3][1]-B.points[0][1])/256,f=mir?-1:1,fx=B.points[0][0]+f*96*k,fy=B.points[0][1]+227*ky,t=TIP[B.sheet][0];
  const mx=fx+f*(t[0]-96)*k,my=fy+(t[1]-227)*ky,err=ad(r.aim,gunAngle(B.sheet,mir));
  const ba=Math.atan2(r.ey-sh.sy,r.ex-sh.sx),sa=(()=>{return Math.atan2((sh.vx+sh.vy)*.5,sh.vx-sh.vy);})();
  row={...row,sheet:B.sheet+(mir?'(반전)':''),gunErr:+err.toFixed(1),bestErr:+best(r.aim).toFixed(1),muzzle:[+mx.toFixed(1),+my.toFixed(1)],spawn:[+sh.sx.toFixed(1),+sh.sy.toFixed(1)],spawnOff:+Math.hypot(sh.sx-mx,sh.sy-my).toFixed(1),shotToTarget:+ad(sa,ba).toFixed(1),damage:sh.damage,radius:sh.radius,speed:+sh.speed.toFixed(3)};}
 if(MOVE&&m.wbody&&sh){const B=m.wbody,P=B.points,b=B.rect,mir=P[1][0]<P[0][0],f=mir?-1:1,k=Math.abs(P[1][0]-P[0][0])/b[2],idx=Math.floor(b[0]/192),fx=P[0][0]+f*(idx*192+96-b[0])*k,fy=P[0][1]+(226-b[1])*k,tp=WTIP[B.sheet]?.[idx];
  if(tp){const mx=fx+f*(tp[0]-96)*k,my=fy+(tp[1]-226)*k;row={...row,walkSheet:B.sheet+(mir?'(반전)':''),walkGunErr:+ad(r.aim,gunAngle(B.sheet,mir)).toFixed(1),walkSpawnOff:+Math.hypot(sh.sx-mx,sh.sy-my).toFixed(1),bestErr:+best(r.aim).toFixed(1)};}}
 rows.push(row);console.log('ROW '+JSON.stringify(row));
 await p.waitForFunction(t=>time>=t+.6,r.t0,{timeout:60000});await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(400);
 await p.screenshot({path:`${OUT}/${TAG}${MOVE?'move':'still'}-idle-${name}.png`,clip:{x:330,y:110,width:300,height:220}});row.idle=await p.evaluate(()=>{window.__r991dbg=[];const n=nearestEnemy(HEROES.gunner.range||7),q=project(player.x,player.y),b=n?project(n.x,n.y):null;return{...window.__r991.last,dir:player.direction,anim:player.attackAnim,near:n?.id===window.__r991.pin?.e?.id,nearDeg:b?+(Math.atan2(b.y-q.y,b.x-q.x)*180/Math.PI).toFixed(1):null};});console.log('IDLE '+JSON.stringify(row.idle));
 await p.evaluate(()=>{window.__SLOW=1;});await p.waitForFunction(t=>time>=t+.75,r.t0,{timeout:60000});
}
fs.writeFileSync(`${OUT}/${TAG}${MOVE?'move':'still'}.json`,JSON.stringify(rows,null,1));
const tbl=rows.filter(r=>r.sheet);
if(MOVE){/* 이동 사격: 걷기 그림(R119)이 그려지고 R991 은 손대지 않음 — 기록만(review.md) */console.log('MOVE '+JSON.stringify(rows.map(r=>[r.name,r.drawn?.src,r.moving,r.sheet||null])));const mv=rows.filter(r=>r.walkSheet);check('이동 사격 8방향 기록',mv.length===8,rows.map(r=>[r.name,r.walkSheet]));check('이동 사격: 걷기 그림도 조준 쪽(옆·대각 ≤13°, 위·아래 최선+3°)',mv.every(r=>['n','s'].includes(r.name)?r.walkGunErr<=r.bestErr+3:r.walkGunErr<=13),mv.map(r=>[r.name,r.walkSheet,r.walkGunErr]));check('이동 사격: 탄이 걷기 그림 총구 끝 근처에서 나옴(≤8px, 걸음 1칸 차이 허용)',mv.every(r=>r.walkSpawnOff<=8),mv.map(r=>[r.name,r.walkSpawnOff]));check('이동 사격: 페이지 오류 없음',errors.length===0,errors);console.log(JSON.stringify({fails}));await b.close();process.exit(fails?1:0);}
check('8방향 모두 몸 그림·탄이 기록됨',tbl.length===8,rows.map(r=>r.name+':'+!!r.sheet));
check('몸 그림의 총 각도가 쏜 방향에 맞음(옆·대각 ≤13°, 정 위·아래는 있는 그림 중 최선+3°)',tbl.every(r=>['n','s'].includes(r.name)?r.gunErr<=r.bestErr+3:r.gunErr<=13),tbl.map(r=>[r.name,r.sheet,r.gunErr,r.bestErr]));
check('탄이 그려진 총구 끝에서 나옴(≤6px, 화면 2배 아닌 CSS px)',tbl.every(r=>r.spawnOff<=6),tbl.map(r=>[r.name,r.spawnOff]));
check('탄이 표적을 향함(≤4°)',tbl.every(r=>r.shotToTarget<=4),tbl.map(r=>[r.name,r.shotToTarget]));
const OPP={e:'w',w:'e',se:'sw',sw:'se',ne:'nw',nw:'ne'},shown=i=>{const m=/idle-([a-z]+)\.webp/.exec(i?.src||'');return m?(i.mir?OPP[m[1]]||m[1]:m[1]):null;};
check('쏜 뒤 서 있기도 표적 쪽 8방향 그림(총이 표적 쪽)',rows.every(r=>shown(r.idle)===r.name),rows.map(r=>[r.name,r.idle?.src,r.idle?.mir]));
check('피해·반경·탄속은 방향과 무관하게 같음(판정 불변)',new Set(tbl.map(r=>r.damage+'|'+r.radius+'|'+r.speed)).size===1,tbl.map(r=>[r.damage,r.radius,r.speed]));
const fin=await p.evaluate(()=>({nan:window.__r991.nan,st:window.__STORYWORLD_GUNNER_AIM_R991__?.inspect?.()}));
check('그리기 좌표 NaN/Infinity 없음',fin.nan===0,fin);
check('R991 모듈 오류 없음',!fin.st||fin.st.stats.errors===0,fin.st);
check('페이지 오류 없음',errors.length===0,errors);
console.log(JSON.stringify({fails}));await b.close();process.exitCode=fails?1:0;
