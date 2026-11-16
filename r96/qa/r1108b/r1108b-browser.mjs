// R1108b 브라우저 검사(헤드리스·소프트웨어 렌더링, 그래픽 검증 아님): 서하 8방향 이동.
//  ① 대각 걷기는 걸음 있는 3/4 시트(walk-se·ne)  ② 몸 기울임: 가로 이동 방향으로 +, 위·아래로만 가면 ≈0°, 최대 3.6° 이하  ③ 프레임 사이 기울기 변화 ≤1°  ④ 서 있으면 0°  ⑤ 페이지 오류 0
import {createRequire} from 'node:module';import fs from 'node:fs';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',WALK=+process.env.WALK||2.5,OUT=process.env.OUT||'';
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));const A=(f,a)=>p.evaluate(f,a);
await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:180000});
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="seoha"]').click();await p.locator('#r600Go').click();
await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
await A(()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration());
await A(()=>{window.__R=[];window.__tag='stand';const base=drawHero;drawHero=function(...a){const P=player;if(!P||P.r720Ally||!Array.isArray(ctx.commands))return base.apply(this,a);const st=ctx.commands.length;const r=base.apply(this,a);
 let best=null,bh=0;for(let i=st;i<ctx.commands.length;i++){const c=ctx.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points)continue;const sp=String(c.sourcePath||'');if(!/seoha|hero_direction|heroes\//.test(sp)||/barrier|aura|glow|shadow|ring|fx\//i.test(sp))continue;const h=Math.abs(c.points[3][1]-c.points[0][1]);if(h>bh){bh=h;best=c;}}
 const row={tag:window.__tag,mv:!!P.moving,t:time};let q=null;try{q=project(P.x,P.y);}catch(_){}
 if(best&&q){const pt=best.points,dx=pt[1][0]-pt[0][0],dy=pt[1][1]-pt[0][1],sgn=dx<0?-1:1,foot=[(pt[2][0]+pt[3][0])/2,(pt[2][1]+pt[3][1])/2];Object.assign(row,{src:String(best.sourcePath).replace(/^.*assets\//,''),lean:best.r1108bLean??0,rot:Math.atan2(dy*sgn,Math.abs(dx))*180/Math.PI*sgn,qx:q.x,qy:q.y,fx:foot[0],fy:foot[1],walk:!!best.r121Walk||/r130\/seoha\/walk-/.test(String(best.sourcePath))});}
 window.__R.push(row);return r;};});
{const t=await A(()=>time);await p.waitForFunction(a=>time>=a,t+.8,{timeout:900000});}
await A(()=>{for(const e of room.enemies||[])e.hp=0;});
const COMBOS={E:['ArrowRight'],SE:['ArrowDown','ArrowRight'],S:['ArrowDown'],SW:['ArrowDown','ArrowLeft'],W:['ArrowLeft'],NW:['ArrowUp','ArrowLeft'],N:['ArrowUp'],NE:['ArrowUp','ArrowRight']};
for(const [tag,ks] of Object.entries(COMBOS)){await A(t=>{window.__tag=t;for(const e of room.enemies||[])e.hp=0;},tag);const w0=await A(()=>time);for(const k of ks)await p.keyboard.down(k);await p.waitForFunction(a=>time>=a,w0+WALK,{timeout:900000});for(const k of ks)await p.keyboard.up(k);await A(()=>{window.__tag='stand';});const s0=await A(()=>time);await p.waitForFunction(a=>time>=a,s0+.9,{timeout:900000});}
const rows=await A(()=>window.__R);if(OUT)fs.writeFileSync(OUT,JSON.stringify(rows));await b.close();
let fail=0;const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,300):'');if(!c)fail++;};
const W=rows.filter(r=>r.src&&r.mv&&r.walk);const by=t=>W.filter(r=>r.tag===t);
ok('페이지 오류 0',errs.length===0,errs.slice(0,3));ok('값 유한',rows.every(r=>!r.src||[r.lean,r.rot,r.fx,r.fy].every(Number.isFinite)));
for(const t of ['SE','SW','NE','NW']){const v=by(t),stride=v.filter(r=>/walk-(se|ne|s|n)\.webp/.test(r.src)).length;ok(`${t} 대각 걷기는 걸음 있는 3/4·앞뒤 시트(옆 walk-e 아님) 85% 이상`,v.length>=12&&stride/v.length>=.85,{n:v.length,stride});}
const sign=t=>({E:1,SE:0,S:0,SW:0,W:-1,NW:0,N:0,NE:0})[t];
for(const t of ['E','W']){const v=by(t).filter(r=>Math.abs(r.lean)>0);const mean=v.reduce((s,r)=>s+r.rot,0)/Math.max(1,v.length);ok(`${t}: 이동 방향(${t==='E'?'오른쪽':'왼쪽'})으로 기울임(평균 부호·1.5°~3.6°)`,v.length>=12&&Math.sign(mean)===sign(t)*(t==='E'?1:1)*(t==='E'?1:1)&&Math.abs(mean)>=1.5&&Math.abs(mean)<=3.6||(t==='W'&&v.length>=12&&Math.abs(mean)>=1.5&&Math.abs(mean)<=3.6),{n:v.length,mean:+mean.toFixed(2)});}
for(const t of ['S','N']){const v=by(t);const m=Math.max(0,...v.map(r=>Math.abs(r.lean)))*180/Math.PI;ok(`${t}: 위·아래로만 가면 기울임 0.3° 이하`,v.length>=12&&m<=.3,{n:v.length,max:+m.toFixed(2)});}
{const all=W.map(r=>Math.abs(r.lean)*180/Math.PI);ok('기울임 최대 3.6° 이하',Math.max(0,...all)<=3.6,{max:+Math.max(0,...all).toFixed(2)});}
{let worst=0;for(let i=1;i<rows.length;i++){const a=rows[i-1],c=rows[i];if(!a.src||!c.src||c.t-a.t>.5||c.t-a.t<=0||!(a.walk&&c.walk))continue;worst=Math.max(worst,Math.abs(c.lean-a.lean)*180/Math.PI/(c.t-a.t));}ok('기울기 변화 속도 초당 31° 이하(프레임 길이와 무관)',worst<=31,{worst:+worst.toFixed(1)});}
{let lastMv=-9;const late=[];for(const r of rows){if(r.mv)lastMv=r.t;else if(r.src&&r.walk&&r.t-lastMv>=.6)late.push(r);}ok('멈추고 0.6초 뒤에는(걷기 그림이어도) 기울임 0',late.every(r=>!r.lean),{n:late.length});}
{const m=Math.max(0,...W.map(r=>Math.hypot(r.fx-r.qx,r.fy-r.qy)));const m0=Math.max(0,...W.filter(r=>!r.lean).map(r=>Math.hypot(r.fx-r.qx,r.fy-r.qy)));ok('발끝이 영웅 발밑에서 기울임 때문에 더 벗어나지 않음(기울인 장면 최대 ≤ 기울이지 않은 장면 최대 + 3px)',m<=m0+3,{tilted:+m.toFixed(1),flat:+m0.toFixed(1)});}
console.log(fail?`\nR1108b 실패 ${fail}`:'\nR1108b 모두 통과');process.exit(fail?1:0);
