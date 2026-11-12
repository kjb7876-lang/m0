// R840 무한 생존 전 지역 순회 검사(헤드리스·그리기 생략 빠른 감기 — 그래픽·실기기·자연 플레이 검증 아님).
//  각 전투 지역에서 몹이 영웅을 쫓아오고(묶임·제자리 멈춤 없음), 영웅(반자동)+코어가 섬멸해 '정화 완료' → 다음 지역으로 넘어가는지 본다.
//  영웅·코어 체력은 채워 두고(지역 순회가 목적), 서사는 건너뛴다. 영웅은 가장 가까운 적 쪽으로 초당 4.5칸 걷는다.
//  SW_URL(기본 http://127.0.0.1:4410/m0/) · FROM·TO(지역 번호, 기본 0~끝) · LIMIT(지역당 게임 초, 기본 240) · OUT(json 결과 파일)
import {createRequire} from 'node:module';import fs from 'node:fs';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const E=process.env,URL=E.SW_URL||'http://127.0.0.1:4410/m0/',LIMIT=+E.LIMIT||240,HERO=E.HERO||'hwando';
let fail=0;const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,400):'');if(!c)fail++;};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:480,height:270}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e.stack||e).slice(0,300)));
const A=(f,a)=>p.evaluate(f,a);
await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').waitFor({timeout:180000});
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator(`[data-r600hero="${HERO}"]`).click();await p.locator('#r600Go').click();
const ready=()=>p.waitForFunction(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;return Z.here()&&!loading&&Z.state().ready;},null,{timeout:240000,polling:200});
await ready();
const N=await A(()=>window.__STORYWORLD_SURVIVAL_R600__.state().ids),FROM=+(E.FROM||0),TO=Math.min(N-1,E.TO!==undefined?+E.TO:N-1);
const rows=[];
// 한 지역을 빠른 감기로 돈다: 정화 완료 뒤 다음 지역으로 넘어가면 끝.
for(let i=FROM;i<=TO;i++){
 await ready();const st0=await A(()=>window.__STORYWORLD_SURVIVAL_R600__.state());
 if(st0.i!==i){await A(i=>window.__STORYWORLD_SURVIVAL_R600__.qaGo(i),i);await ready();}
 const id=await A(()=>room.id);let row={i,id,cleared:false,advanced:false,kills0:(await A(()=>window.__STORYWORLD_SURVIVAL_R600__.state().kills))};
 const tStart=await A(()=>time);const foreign=new Set();let leashed=0,stuckIdle=0,lastT=tStart,lastWall=Date.now();
 for(;;){
  const r=await A(({LIMIT,tStart,i})=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;const T0=performance.now();let out=null;
   const tb=time;while(performance.now()-T0<350){if(modal){const b=document.getElementById('r600Pick0');if(b){b.click();continue;}return {wait:'modal'};}if(loading)return {wait:'loading'};
    const st=Z.state();if(st.i!==i)return {done:'advanced',st,t:time};if(time-tStart>LIMIT)return {done:'limit',st,t:time,left:room.enemies.filter(e=>e.hp>0&&!e.deadRecorded).slice(0,4).map(e=>({id:e.id,n:e.name,x:+e.x.toFixed(2),y:+e.y.toFixed(2),hp:Math.round(e.hp),max:Math.round(e.maxHp),ss:e.spawnState,s:e.state,bl:blocked(e.x,e.y,.3,room),grace:+((e.graceUntil||0)-time).toFixed(1),boss:!!e.boss,r600Boss:!!e.r600Boss,hide:e.hidden||e.r75Hidden||null,keys:Object.keys(e).filter(k=>/maze|hosp|leash|group|ward|squad|pin|lock/i.test(k)).map(k=>k+'='+String(e[k]).slice(0,30))})),hero:{x:+player.x.toFixed(2),y:+player.y.toFixed(2)},bounds:room.exploration.bounds};
    player.hp=maxHP();if(st.core.hp<st.core.stats.max*.5)Z.qaCoreHp(st.core.stats.max*.6);if(Z.narr().playing)Z.skipNarration();
    const en=room.enemies.filter(e=>e.hp>0&&!e.deadRecorded);let best=null,bd=1e9;for(const e of en){const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<bd){bd=d;best=e;}}
    if(best&&bd>1.3){const s=Math.min(bd-1.2,4.5/30),nx=player.x+(best.x-player.x)/bd*s,ny=player.y+(best.y-player.y)/bd*s;if(!blocked(nx,ny,.3,room)){player.x=nx;player.y=ny;}}
    tick(1/30);}
   if(time===tb)return {wait:'frozen'};/* 지역 서사 영상(R369 등)이 tick 을 멈춘 동안은 벽시계로 기다린다 */
   const st=Z.state(),en=room.enemies.filter(e=>e.hp>0&&!e.deadRecorded);
   return {st,t:time,terrain:{own:!!room.exploration?.survivalR600,walls:room.exploration?.walls?.length,type:room.exploration?.type},alive:en.length,foreign:[...new Set(en.filter(e=>!e.survivalR600).map(e=>String(e.id||'').replace(/[:\-_]?\d+$/,'')))],leashed:en.filter(e=>e.survivalR600&&e.explorationLeash!=null).length,
    far:en.filter(e=>e.survivalR600&&!e.r600Boss&&Math.hypot(e.x-player.x,e.y-player.y)>6).map(e=>({x:+e.x.toFixed(1),y:+e.y.toFixed(1),s:e.state}))};},{LIMIT,tStart,i});
  if(r.wait){if(Date.now()-lastWall>240000){row.wallTimeout=r.wait;break;}await p.waitForTimeout(200);continue;}lastWall=Date.now();
  if(r.done){row.cleared=r.done==='advanced'||r.st.phase==='clear';row.advanced=r.done==='advanced';row.phase=r.st.phase;row.kills=r.st.kills-row.kills0;row.secs=Math.round(r.t-tStart);if(r.left)row.left={left:r.left,hero:r.hero,bounds:r.bounds};break;}
  leashed=Math.max(leashed,r.leashed);for(const f of r.foreign)foreign.add(f);if(!r.terrain.own||r.terrain.walls!==4)row.terrain=r.terrain;row.phase=r.st.phase;row.alive=r.alive;
 }
 row.leashed=leashed;row.foreign=[...foreign];rows.push(row);console.log(JSON.stringify(row));
 if(!row.advanced&&i<TO){await A(()=>{room.enemies.length=0;});}
}
const ins=await A(()=>window.__STORYWORLD_SURVIVAL_R600__.inspect());
if(E.OUT)fs.writeFileSync(E.OUT,JSON.stringify({rows,ins,errs},null,1));
const bad=rows.filter(r=>!r.cleared);ok('every stage clears within '+LIMIT+' game seconds',bad.length===0,bad);
const ter=rows.filter(r=>r.terrain);ok('survival arena terrain stays the open rectangle (4 border walls) in every stage',ter.length===0,ter.map(r=>({i:r.i,id:r.id,terrain:r.terrain})));
const lea=rows.filter(r=>r.leashed>0);ok('survival mobs are never leashed by story-region scripts',lea.length===0,lea);
const fo=rows.filter(r=>r.foreign.some(f=>!/summon|r383|r170|r193|clone/i.test(f)));ok('no enemies injected into survival rooms by story-region scripts (mob summons allowed)',fo.length===0,fo.map(r=>({i:r.i,id:r.id,foreign:r.foreign})));
ok('no survival script errors',ins.stats.errors===0,ins.lastError);ok('no page errors',errs.length===0,errs.slice(0,5));
await b.close();console.log(fail?('FAILED '+fail):'ALL PASS');process.exit(fail?1:0);
