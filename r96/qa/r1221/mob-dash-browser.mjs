// R1221 헤드리스(그래픽·GPU 검증 아님): 실제 게임에서 일반 근접 몹 돌진 횟수를 R1221 켬/끔으로 잰다.
//  지역마다 살아 있는 일반 근접 몹 6마리를 영웅 4~5칸 둘레에 두고(영웅 무적·제자리) 게임 시간 SECS 초 동안 R52 돌진·R286 돌진을 센다.
//  사용: SW_URL=http://127.0.0.1:4411/m0/ [SECS=60] [ZONES=ep1b05,cult03] node r96/qa/r1221/mob-dash-browser.mjs
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const SECS=+(process.env.SECS||60),ZONES=(process.env.ZONES||'ep1b05,cult03,kair04').split(',');
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,400):''));};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
async function run(zone,on){await p.evaluate(on=>window.__STORYWORLD_MOB_DASH_R1221__.set({on}),on);await p.evaluate(()=>{if(room?.id!=='hub')enterRegion('hub',null,{layer:'STORY',restore:true});});await p.waitForFunction(()=>!loading&&room?.id==='hub',null,{timeout:150000});await go(p,zone);await skip(p);// 켬/끔마다 새 몹(앞 측정의 몹 상태가 남지 않게)
 return p.evaluate(async([secs])=>{auto=false;guide=false;command=null;route=[];
  const ms=room.enemies.filter(e=>e.hp>0&&!e.boss&&!e.midboss&&!e.persona&&e.ai==='melee').slice(0,6);
  ms.forEach((e,i)=>{const a=i/Math.max(1,ms.length)*Math.PI*2,r=4+(i%2)*.8;e.x=player.x+Math.cos(a)*r;e.y=player.y+Math.sin(a)*r;e.homeX=e.x;e.homeY=e.y;e.spawnState='active';e.hidden=false;e.hp=e.maxHp=1e8;});
  room.enemies.filter(e=>!ms.includes(e)).forEach(e=>{e.hp=0;e.spawnState='dead';});room.engaged=true;
  const R52=()=>window.__STORYWORLD_HOSPITAL_CHARGE_R52__.inspect().metrics.charges,R286=()=>window.__STORYWORLD_MOB_MOTION_R286__.inspect().stats.dashes;
  const c0=R52(),d0=R286(),px=player.x,py=player.y;const t0=time;
  await new Promise(r=>{const f=()=>{player.hp=player.maxHp=1e9;player.invincible=99;player.x=px;player.y=py;if(time>t0+secs)r();else setTimeout(f,40);};f();});
  return {zone:room.id,mobs:ms.length,names:[...new Set(ms.map(e=>e.name.replace(/\s+\d+$/,'')))].slice(0,6),r52:R52()-c0,r286:R286()-d0,game:+(time-t0).toFixed(1),stats:window.__STORYWORLD_MOB_DASH_R1221__.inspect().stats};},[SECS]);}
let onSum=0,offSum=0;
for(const z of ZONES){const off=await run(z,false);console.log(JSON.stringify(off));const on=await run(z,true);console.log(JSON.stringify(on));
 onSum+=on.r52+on.r286;offSum+=off.r52+off.r286;ok(on.stats.errors===0,z+': 오류 0',on.stats);}
ok(offSum>0,'끔: 돌진이 실제로 일어남(측정이 의미 있음)',offSum);ok(onSum*3<=offSum,'켬: 돌진 1/3 이하',{onSum,offSum});
ok(errs.length===0,'페이지 오류 0',errs.slice(0,3));console.log(`R1221 browser: ${n-bad}/${n}`);await b.close();process.exit(bad?1:0);
