// R1379 헤드리스 장면(SwiftShader — 그래픽 검증 아님): 슬레이어 W 발밑 노바(D11)·사몽 적중 문양(D12).
// 사용: SW_URL=http://127.0.0.1:4410/m0/ [R1379_OFF=1] node r96/qa/r1379/r1379-browser.mjs /tmp/r1379 [zone]
import {chromium,boot,go} from '../r444/lib.mjs';
const out=process.argv[2]||'/tmp/r1379',zone=process.argv[3]||'dist01',off=process.env.R1379_OFF==='1';let fail=0;const ok=(c,m,d)=>{console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?' '+JSON.stringify(d):''));if(!c)fail++;};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:off?{'storyworld.r1379':'{"on":false}'}:null});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await go(p,zone);
const r=await p.evaluate(()=>{player.hero='slayer';const live=room.enemies.filter(e=>!e.boss&&!e.midboss&&e.hp>0).slice(0,3);if(!live.length)return null;
 for(const e of room.enemies)e.speed=0;room.enemies=room.enemies.filter(e=>live.includes(e));player.hp=player.maxHp=1e7;player.invincible=99;
 live.forEach((e,i)=>{e.x=player.x+1.8*Math.cos(i*2.1);e.y=player.y+1.8*Math.sin(i*2.1);e.maxHp=e.hp=1e7;});window.__L=live;
 return {n:live.length,ready:[!!readyImage('assets/r1379/slayer-w-nova-24.webp')?.image]};});
ok(!!r,'몹 고름',r);
await p.evaluate(()=>ensureImages(['assets/r1379/slayer-w-nova-24.webp','assets/r1379/slayer-samong-impact-18.webp']));await p.waitForTimeout(1500);
// D11 노바: 경과 .25·.6 두 순간
const t0=await p.evaluate(()=>{window.__STORYWORLD_D2S_R106__.launch('slayer','w',0);return time;});
await p.waitForFunction(t=>time>=t+.25,t0,{timeout:60000});await p.screenshot({path:`${out}-nova1.png`});
await p.waitForFunction(t=>time>=t+.6,t0,{timeout:60000});await p.screenshot({path:`${out}-nova2.png`});
const s1=await p.evaluate(()=>window.__STORYWORLD_SLAYER_DOTS_R1379__.inspect());
ok(off?s1.nova===0:s1.nova>0&&s1.errors===0,'D11 노바 그림 수',s1);
await p.waitForFunction(t=>time>=t+1.2,t0,{timeout:60000});
// D12 사몽 적중 문양
const t1=await p.evaluate(()=>{player.samong=8;for(const e of window.__L)hitEnemy(e,1,{storyWER:true,sourceHero:'slayer',friendly:true});return {t:time,act:window.__STORYWORLD_SAMONG_THEME_R572__.inspect()};});
await p.waitForFunction(t=>time>=t+.06,t1.t,{timeout:60000});await p.screenshot({path:`${out}-mark1.png`});
await p.waitForFunction(t=>time>=t+.2,t1.t,{timeout:60000});await p.screenshot({path:`${out}-mark2.png`});
const s2=await p.evaluate(()=>({d:window.__STORYWORLD_SLAYER_DOTS_R1379__.inspect(),t:window.__STORYWORLD_SAMONG_THEME_R572__.inspect()}));
ok(off?s2.d.mark===0:s2.d.mark>0&&s2.d.errors===0,'D12 문양 그림 수',{t1,s2});
ok(errs.length===0,'페이지 오류 0',errs.slice(0,3));
await b.close();console.log(fail?`R1379 browser FAIL ${fail}`:'R1379 browser OK');process.exit(fail?1:0);
