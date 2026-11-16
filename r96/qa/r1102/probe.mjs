// R1102 재현·측정(헤드리스): 헌터 생존 판 반자동 SECS 게임 초 → 기본 화살 크기·출발점(활 손잡이와의 거리)·공격/스킬 중 몸 그림
import {createRequire} from 'node:module';import fs from 'node:fs';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',OUT=process.env.OUT||'',SECS=+process.env.SECS||20,MOVE=process.env.MOVE==='1';
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));const A=(f,a)=>p.evaluate(f,a);
await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:180000});
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="hunter"]').click();await p.locator('#r600Go').click();
await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
await A(()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration());
await A(()=>{const R=window.__R1102={frames:[],shots:[],arrows:[]};const GRIP={r:[145,79],l:[46,79]};
 const BODY=/hero_direction|hero-authored|heroes\/|r91\/walk\/|r93\/idle\/|r119\/heroes\/|r121\/(?:heroes|walk)\/|r130\/[a-z]+\/|r143\/|r164\/|r425\/hunter\/|r437\/|r710\/|r1102\/|^blob:/;let lx=null,ly=null;
 const sp=c=>String(c.sourcePath||c.image?.src||'').replace(/^.*assets\//,'').split('?')[0];
 let lastGrip=null;
 const mk=makeShot;makeShot=function(...a){const s=mk.apply(this,a);try{if(s&&s.friendly&&s.owner==='hero'&&player.hero==='hunter'&&!player.r720Ally){const q=project(s.x,s.y),z=typeof zoom==='number'?zoom:1;R.shots.push({t:time,id:s.id,basic:!!s.r160Basic,r535:!!(s.r535V||s.r535G||s.r535),kind:s.attackKind9||'',asset:String(s.asset).split('/').pop(),ox:q.x,oy:q.y-18*z,pq:project(player.x,player.y),aa:+player.attackAnim||0,sk:+player.skillAnim||0});}}catch(e){}return s;};
 const dp=drawProjectile;drawProjectile=function(pr,...a){if(!pr||!pr.friendly||!Array.isArray(ctx.commands)||!(pr.age<.5))return dp.call(this,pr,...a);const st=ctx.commands.length;const r=dp.call(this,pr,...a);
  try{let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9,src=[];for(let i=st;i<ctx.commands.length;i++){const c=ctx.commands[i];if(c.kind!=='image'||!c.points)continue;src.push(sp(c));for(const [x,y] of c.points){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}}
   const c0=ctx.commands.slice(st).find(c=>c.kind==='image'&&c.points);const side=c0?Math.hypot(c0.points[1][0]-c0.points[0][0],c0.points[1][1]-c0.points[0][1]):0,cr=c0&&c0.sourceRect?c0.sourceRect[2]:0;
   if(src.length&&R.arrows.length<4000)R.arrows.push({t:time,id:pr.id,age:pr.age,basic:!!pr.r160Basic,src:[...new Set(src)].slice(0,4),w:x1-x0,h:y1-y0,cx:(x0+x1)/2,cy:(y0+y1)/2,ah:actorHeight(),side,cr,grip:lastGrip});}catch(e){}return r;};
 let allyN=0,allyH='';const dh=drawHero;drawHero=function(...a){const P=player;if(P&&P.r720Ally){allyN++;allyH=P.hero;}if(!P||P.r720Ally||!Array.isArray(ctx.commands))return dh.apply(this,a);
  const pre={aa:+P.attackAnim||0,sk:+P.skillAnim||0,ul:+P.ultimateAnim||0,hu:+P.hurtAnim||0,da:+P.dashAnim||0,mv:!!P.moving,gd:!!P.guard,sam:+P.samong>0};const st=ctx.commands.length;const r=dh.apply(this,a);
  let best=null;for(let i=st;i<ctx.commands.length;i++){const c=ctx.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points)continue;if(!BODY.test(sp(c)))continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(!best||hh>best.hh)best={hh,c};}
  const row={t:time,...pre,all:ctx.commands.slice(st).filter(c=>c.kind==='image'&&c.owner?.kind==='hero'&&c.points).map(c=>sp(c).split('/').slice(-2).join('/')+':'+Math.abs(c.points[3][1]-c.points[0][1]).toFixed(0)),allyN,allyH,rl:!!readyImage('assets/r425/hunter/attack-l.webp'),rr:!!readyImage('assets/r425/hunter/attack-r.webp'),hf:window.__STORYWORLD_COMBAT_FLOW_R425__?.inspect?.()?.stats?.hunterFrames,d:lx==null?0:Math.hypot(P.x-lx,P.y-ly)};lx=P.x;ly=P.y;if(best){const c=best.c;row.src=sp(c);row.walk=!!c.r121Walk;row.f425=c.r425Hunter;
   const m=/r425\/hunter\/attack-([lr])/.exec(row.src);if(m&&c.sourceRect){const [gx,gy]=GRIP[m[1]],P0=c.points[0],P1=c.points[1],P3=c.points[3],cw=c.sourceRect[2],ch=c.sourceRect[3];lastGrip={t:time,side:m[1],f:c.r425Hunter,x:P0[0]+(P1[0]-P0[0])*gx/cw,y:P0[1]+(P3[1]-P0[1])*gy/ch};row.grip=lastGrip;}}
  R.frames.push(row);allyN=0;return r;};});
const t0=await A(()=>time);
if(MOVE){/* 걸으며 싸우기: 좌우로 번갈아 */for(let i=0;i<SECS/2;i++){const k=i%2?'ArrowLeft':'ArrowRight';const w0=await A(()=>time);await p.keyboard.down(k);await p.waitForFunction(a=>time>=a,w0+2,{timeout:900000});await p.keyboard.up(k);}}
else await p.waitForFunction(a=>time>=a,t0+SECS,{timeout:1800000});
const R=await A(()=>({...window.__R1102,dbg:window.__R425DBG}));console.log('frames',R.frames.length,'shots',R.shots.length,'arrows',R.arrows.length,'errors',errs.length,errs.slice(0,3));
if(OUT)fs.writeFileSync(OUT,JSON.stringify(R));await b.close();
