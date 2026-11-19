// R1210 헤드리스 브라우저 검사(그래픽·GPU 검증 아님) — S-06 디스토피아 몹 미래형 원거리 공격
//  실행: SW_URL=http://127.0.0.1:4396/m0/ [SHOT=/tmp/dir] [SECS=20] node r96/qa/r1210/r1210-browser.mjs
//  ① 근접형 구역(sz115-S06-1): 디스토피아 몹이 겨누고 쏨, 오류 0  ② 원거리형 구역(sz115-S06-5): 엔진 기본 탄 차례가 미래형 공격으로(ranged3 감싸기 동작)
//  ③ 끄기 대비 받은 피해 비율(같은 배치·같은 게임 시간) — 난이도 튐 점검  ④ 페이지 오류 0
import {createRequire} from 'node:module';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4396/m0/',SHOT=process.env.SHOT||'',SECS=+(process.env.SECS||20);
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,600):''));};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r790.npc','{"on":false}');});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:240000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
const go=async zone=>{await p.evaluate(async zone=>{const SM=__STORYWORLD_SAMONG_R103__,i=SM.episodes.findIndex(e=>e.key==='S-06');await SM.go(i,null,{zone});},zone);await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip();};
const waitGame=s=>p.evaluate(s=>new Promise(r=>{const t0=time;const f=()=>time>t0+s?r():setTimeout(f,40);f();}),s);
const api=await p.evaluate(()=>!!window.__STORYWORLD_DYS_RANGED_R1210__&&typeof ranged3==='function'&&/r1210|prefs/.test(String(ranged3)));ok(api,'API 있음, 엔진 ranged3 감싸짐');
// 받은 피해 재기: 영웅은 제자리(자동 끔), 체력은 깎인 만큼 기록하고 되채움
async function run(zone,on){await p.evaluate(on=>window.__STORYWORLD_DYS_RANGED_R1210__.set({on}),on);await go(zone);
 return p.evaluate(async([secs])=>{auto=false;guide=false;command=null;route=[];const A=window.__STORYWORLD_DYS_RANGED_R1210__;
  const ds=room.enemies.filter(e=>e.hp>0&&!e.boss&&!e.midboss&&A.kindFor(e.name));
  // 몹을 영웅 둘레 4~5.5칸에 고르게(같은 배치 비교용) — 판정·AI 는 엔진
  ds.forEach((e,i)=>{const a=i/Math.max(1,ds.length)*Math.PI*2,r=4+(i%3)*.7;e.x=player.x+Math.cos(a)*r;e.y=player.y+Math.sin(a)*r;e.homeX=e.x;e.homeY=e.y;});
  room.enemies.filter(e=>!ds.includes(e)).forEach(e=>{e.hp=0;e.spawnState='dead';});
  let took=0,byKind={};const H=hurt;hurt=function(d,src,...a){const before=player.hp;const r=H.call(this,d,src,...a);const lost=Math.max(0,before-player.hp);took+=lost;const k=src?.r1210||'other';byKind[k]=(byKind[k]||0)+lost;player.hp=maxHP();return r;};
  const t0=time;await new Promise(r=>{const f=()=>{player.x=player.x;if(time>t0+secs)r();else setTimeout(f,40);};f();});hurt=H;
  return {log:A.inspect().log,zone:room.samongR103?.zone,mobs:ds.map(e=>[e.name,e.ai,A.kindFor(e.name)]),took:Math.round(took),byKind,stats:A.inspect().stats,game:+(time-t0).toFixed(1)};},[SECS]);}
const r1=await run('sz115-S06-1',true);console.log(JSON.stringify(r1));
ok(r1.stats.errors===0,'근접형 구역: R1210 오류 0',r1.stats);
ok(r1.stats.aims>=1&&Object.values(r1.stats.fires).reduce((a,b)=>a+b,0)>=1,'근접형 구역: 디스토피아 몹이 겨누고 쏨',r1.stats);
if(SHOT){// 예고·발사 장면(헤드리스 소프트웨어 렌더)
 await p.evaluate(()=>{const A=window.__STORYWORLD_DYS_RANGED_R1210__;for(const e of room.enemies)if(e.r1210)e.r1210.next=0;});
 for(let i=0;i<6;i++){await waitGame(.35);await p.screenshot({path:`${SHOT}/r1210-s06-1-${i}.png`});}}
const r0=await run('sz115-S06-1',false);console.log(JSON.stringify(r0));
const h1=await run('sz115-S06-5',true);console.log(JSON.stringify(h1));
ok(h1.stats.engine>=1,'원거리형 구역: 엔진 기본 탄 차례가 미래형 공격으로',h1.stats);ok(h1.stats.errors===0,'원거리형 구역: 오류 0');
if(SHOT){for(let i=0;i<6;i++){await waitGame(.35);await p.screenshot({path:`${SHOT}/r1210-s06-5-${i}.png`});}}
const h0=await run('sz115-S06-5',false);console.log(JSON.stringify(h0));
const ratio=(a,b)=>b>0?+(a/b).toFixed(2):null;
console.log('받은 피해 켬/끔: 근접형',r1.took,'/',r0.took,ratio(r1.took,r0.took),' 원거리형',h1.took,'/',h0.took,ratio(h1.took,h0.took));
ok(r0.took===0||r1.took<=r0.took*1.6+40,'근접형 구역: 켬 피해가 끔의 1.6배 이하',{on:r1.took,off:r0.took});
ok(h0.took===0||h1.took<=h0.took*1.35+40,'원거리형 구역: 켬 피해가 끔의 1.35배 이하(탄 횟수 그대로)',{on:h1.took,off:h0.took});
ok(errs.length===0,'페이지 오류 0',errs.slice(0,4));
console.log(`\n${n-bad}/${n} 통과`);await b.close();process.exit(bad?1:0);
