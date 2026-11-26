// R1333 헤드리스(그래픽·GPU 검증 아님): 실제 게임에서 일반 근접 몹 돌진을 R1333 끔(R1221 만)/켬으로 잰다.
//  지역마다 일반 근접 몹 6마리를 영웅 4~5칸 둘레에 두고(영웅 무적·제자리) 게임 시간 SECS 초 동안 R52 돌진·R286 돌진·근접 공격을 센다.
//  실제 상황 재현: 방에 들어와 PRE(기본 46)초 동안 몹을 멀리(14칸 넘게) 붙잡아 두었다가 4~5칸에 풀어 '늦게 발견'하게 한다(R1221 첫 돌진 22~45초 조건).
//  사용: SW_URL=http://127.0.0.1:4411/m0/ [SECS=60] [ZONES=ep1b05,cult03] node r96/qa/r1333/nodash-browser.mjs
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const SECS=+(process.env.SECS||30),PRE=+(process.env.PRE||46),ZONES=(process.env.ZONES||'ep1b05,cult03,kair04').split(',');
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,400):''));};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
async function run(zone,on){await p.evaluate(on=>window.__STORYWORLD_MOB_NODASH_R1333__.set({on}),on);await p.evaluate(()=>{if(room?.id!=='hub')enterRegion('hub',null,{layer:'STORY',restore:true});});await p.waitForFunction(()=>!loading&&room?.id==='hub',null,{timeout:150000});await go(p,zone);await skip(p);
 return p.evaluate(async([secs,pre])=>{auto=false;guide=false;command=null;route=[];
  const ms=room.enemies.filter(e=>e.hp>0&&!e.boss&&!e.midboss&&!e.persona&&e.ai==='melee'&&!/중간보스/.test(e.name||'')).slice(0,6);
  room.enemies.filter(e=>!ms.includes(e)).forEach(e=>{e.hp=0;e.spawnState='dead';});
  const far=ms.map(e=>({x:e.x,y:e.y}));const pxx=player.x,pyy=player.y,tp=time;ms.forEach(e=>{e.hp=e.maxHp=1e8;});
  // 늦게 발견: 영웅에게서 먼 원래 자리에 PRE 초 붙잡아 둔다(영웅은 무적·제자리)
  await new Promise(r=>{const f=()=>{player.hp=player.maxHp=1e9;player.invincible=99;player.x=pxx;player.y=pyy;ms.forEach((e,i)=>{if(Math.hypot(far[i].x-pxx,far[i].y-pyy)<14){far[i].x=pxx+14+i;far[i].y=pyy+14;}e.x=far[i].x;e.y=far[i].y;e.attack=null;});if(time>tp+pre)r();else setTimeout(f,40);};f();});
  ms.forEach((e,i)=>{const a=i/Math.max(1,ms.length)*Math.PI*2,r=4+(i%2)*.8;e.x=player.x+Math.cos(a)*r;e.y=player.y+Math.sin(a)*r;e.homeX=e.x;e.homeY=e.y;e.spawnState='active';e.hidden=false;});room.engaged=true;
  const R52=()=>window.__STORYWORLD_HOSPITAL_CHARGE_R52__.inspect().metrics.charges,R286=()=>window.__STORYWORLD_MOB_MOTION_R286__.inspect().stats.dashes;
  const c0=R52(),d0=R286(),px=player.x,py=player.y;const t0=time;const atk=new Set();let firstDash=null;
  await new Promise(r=>{const f=()=>{player.hp=player.maxHp=1e9;player.invincible=99;player.x=px;player.y=py;
   for(const e of ms){const A=e.attack;if(A){if(A.r52Charge===true){if(firstDash==null)firstDash=+(time-t0).toFixed(1);}else atk.add(A.id??A);}if(e.r286?.mode&&firstDash==null)firstDash=+(time-t0).toFixed(1);}
   if(time>t0+secs)r();else setTimeout(f,40);};f();});
  return {zone:room.id,mobs:ms.length,names:[...new Set(ms.map(e=>e.name.replace(/\s+\d+$/,'')))].slice(0,6),r52:R52()-c0,r286:R286()-d0,melee:atk.size,firstDash,game:+(time-t0).toFixed(1),
   s1221:window.__STORYWORLD_MOB_DASH_R1221__.inspect().stats.errors,s1333:window.__STORYWORLD_MOB_NODASH_R1333__.inspect().stats};},[SECS,PRE]);}
let onSum=0,offSum=0,melee=0;
for(const z of ZONES){const off=await run(z,false);console.log('R1333 끔',JSON.stringify(off));const on=await run(z,true);console.log('R1333 켬',JSON.stringify(on));
 onSum+=on.r52+on.r286;offSum+=off.r52+off.r286;melee+=on.melee;ok(on.s1221===0&&on.s1333.errors===0,z+': 오류 0');ok(on.r52+on.r286===0,z+': 켬 일반 근접 몹 돌진 0',{r52:on.r52,r286:on.r286});}
ok(offSum>0,'끔(R1221 만): 첫 돌진이 실제로 일어남(측정이 의미 있음)',offSum);ok(onSum===0,'켬: 돌진 0',{onSum,offSum});ok(melee>0,'켬: 근접 공격은 그대로 함',melee);
ok(errs.length===0,'페이지 오류 0',errs.slice(0,3));console.log(`R1333 browser: ${n-bad}/${n}`);await b.close();process.exit(bad?1:0);
