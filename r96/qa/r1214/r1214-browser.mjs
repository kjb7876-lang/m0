// R1214 헤드리스 브라우저 검사(그래픽·GPU 검증 아님) — 귀신 계열 지역 몹·보스 원거리
//  실행: SW_URL=http://127.0.0.1:4396/m0/ [SHOT=/tmp/dir] [SECS=20] node r96/qa/r1213/r1214-browser.mjs
//  ① cult05(근접형 기계 몹 섞임)·u202(hybrid 위주) 켬/끔 받은 피해 비율  ② u202 보스가 맵 몹 네 종류를 동시에  ③ 오류 0
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const SHOT=process.env.SHOT||'',SECS=+(process.env.SECS||20);
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,600):''));};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
const waitGame=s=>p.evaluate(s=>new Promise(r=>{const t0=time;const f=()=>time>t0+s?r():setTimeout(f,40);f();}),s);
async function run(zone,on){await p.evaluate(on=>window.__STORYWORLD_DYS_RANGED_R1210__.set({on}),on);await go(p,zone);await skip(p);
 return p.evaluate(async([secs])=>{auto=false;guide=false;command=null;route=[];const A=window.__STORYWORLD_DYS_RANGED_R1210__;
  const ds=room.enemies.filter(e=>e.hp>0&&!e.boss&&!e.midboss&&A.kindFor(e.name)).slice(0,10);
  ds.forEach((e,i)=>{const a=i/Math.max(1,ds.length)*Math.PI*2,r=4+(i%3)*.7;e.x=player.x+Math.cos(a)*r;e.y=player.y+Math.sin(a)*r;e.homeX=e.x;e.homeY=e.y;e.spawnState='active';});
  room.enemies.filter(e=>!ds.includes(e)).forEach(e=>{e.hp=0;e.spawnState='dead';});room.engaged=true;
  let took=0,byKind={};const H=hurt;hurt=function(d,src,...a){const before=player.hp;const r=H.call(this,d,src,...a);const lost=Math.max(0,before-player.hp);took+=lost;const k=src?.r1210||'other';byKind[k]=(byKind[k]||0)+lost;player.hp=maxHP();return r;};
  const t0=time;await new Promise(r=>{const f=()=>{if(time>t0+secs)r();else setTimeout(f,40);};f();});hurt=H;
  /* 끔 측정 뒤엔 옮겨 둔 몹을 지운다 — 같은 지역에 다시 들어올 때 도착점 옆에 몹이 서 있으면 엔진이 'No native safe hospital arrival' 을 던진다(검사 배치 탓) */if(A.inspect().prefs.on)ds.forEach(e=>{e.hp=0;e.spawnState='dead';});
  return {zone:room.id,mobs:[...new Set(ds.map(e=>e.name.replace(/\s+(\d+|우두머리|증원|추격대|후속 증원)$/,'')+'/'+e.ai+'/'+A.kindFor(e.name)))],took:Math.round(took),byKind,stats:A.inspect().stats,game:+(time-t0).toFixed(1)};},[SECS]);}
const ratio=(a,b)=>b>0?+(a/b).toFixed(2):null;
/* 끔을 먼저 잰다 — 켬 측정 뒤 같은 몹으로 끔을 재면 몹이 이미 흩어져 기준값이 0 가까이로 흔들린다 */
for(const z of ['ep1a08','ep1b03']){const off=await run(z,false);console.log(JSON.stringify(off));const on=await run(z,true);console.log(JSON.stringify(on));
 ok(on.stats.errors===0,z+': 오류 0',on.stats);ok(Object.values(on.stats.fires).reduce((a,b)=>a+b,0)>=1,z+': 귀신 몹이 원거리 공격',on.stats.fires);
 const r=ratio(on.took,off.took);console.log(z+' 받은 피해 켬/끔',on.took,off.took,r);ok(r===null||r<=2.2,z+': 받은 피해 끔 대비 2.2배 이하',r);}
// 보스(u202 제8단계 자비 교정관): 맵 몹 네 종류 동시, 1.66배 — 앞 측정이 몹을 지웠으니 다른 지역을 거쳐 새로 들어간다
await p.evaluate(()=>window.__STORYWORLD_DYS_RANGED_R1210__.set({on:true}));await go(p,'ep1b01');await skip(p);await go(p,'ep1a08');await skip(p);
const bs=await p.evaluate(async()=>{auto=false;guide=false;command=null;route=[];const A=window.__STORYWORLD_DYS_RANGED_R1210__;const B=room.enemies.find(e=>e.boss||e.midboss);if(!B)return {none:true};/* 앞 측정이 지운 상태가 남았을 수 있음 */B.hp=Math.max(B.hp,(B.maxHp||1000)*.8);
 for(const e of room.enemies)if(e!==B){if(!e.boss&&!e.midboss){e.hp=0;e.spawnState='dead';}}B.spawnState='active';B.graceUntil=0;room.engaged=true;player.maxHp=player.hp=1e9;
 player.x=B.x+5;player.y=B.y+.5;const kinds=A.mapKinds(room);if(B.r1210)B.r1210.next=0;
 const t0=time;await new Promise(r=>{const f=()=>{player.x=B.x+5;player.y=B.y+.5;if(B.r1210?.mode==='windup'||time>t0+25)r();else setTimeout(f,30);};f();});window.__B=B;return {name:B.name,kinds,mode:B.r1210?.mode,bossKinds:B.r1210?.kinds};});
console.log(JSON.stringify(bs));ok(bs.kinds?.length===4&&bs.mode==='windup','ep1a08 보스가 네 종류로 겨눔',bs);
if(SHOT){await p.evaluate(()=>{window.__TS=globalThis.timeScale;});await p.screenshot({path:`${SHOT}/r1214-boss-windup.png`});
 await p.waitForFunction(()=>window.__B?.r1210?.mode==='fire',null,{timeout:60000}).catch(()=>{});await waitGame(.05);await p.screenshot({path:`${SHOT}/r1214-boss-fire.png`});
 await waitGame(.7);await p.screenshot({path:`${SHOT}/r1214-boss-blast.png`});}
/* 겨누기 시작만 봤으므로 실제로 쏠 때까지 기다린다 */await p.waitForFunction(()=>window.__B?.r1210?.count>=1,null,{timeout:120000,polling:50}).catch(()=>{});
const lv=await p.evaluate(()=>window.__STORYWORLD_DYS_RANGED_R1210__.inspect());ok(lv.stats.errors===0,'보스 오류 0',lv.lastError);ok(lv.log.some(l=>/fear/.test(l[1])&&l[1].split('+').length===4),'보스 로그: 네 종류 동시',lv.log.slice(-4));
// (장면은 따로)
if(false){await go(p,'ep1b09');await skip(p);await p.evaluate(()=>{auto=false;guide=false;const A=window.__STORYWORLD_DYS_RANGED_R1210__;const m=room.enemies.find(e=>e.hp>0&&A.kindFor(e.name)==='bomb'&&!e.boss);for(const e of room.enemies)if(e!==m){e.hp=0;e.spawnState='dead';}m.spawnState='active';m.x=player.x+4;m.y=player.y+.3;room.engaged=true;player.maxHp=player.hp=1e9;window.__M=m;});
 for(let i=0;i<8;i++){await waitGame(.45);await p.screenshot({path:`${SHOT}/r1213-bomb-${i}.png`});}}
ok(errs.length===0,'페이지 오류 0',errs);
console.log(`R1214 browser ${n-bad}/${n}`);await b.close();process.exit(bad?1:0);
