// R850 무한 생존 밸런스 측정(헤드리스·빠른 감기 — 실제 손맛·GPU 미검증).
//  봇: 반자동 켬, 가장 가까운 적 쪽으로 초당 4.5칸 걷기, 강화 카드는 무작위(SEED 고정). 영웅·코어는 죽지 않게 매 틱 채우되,
//  채우기 전에 깎인 양을 '받은 피해'로 센다(그 판에서 쓰러졌을지 가늠). 지역마다: 웨이브 시간, 보스 체력·처치 시간·보스전 받은 피해, 생존 레벨.
//  SW_URL · FROM·TO · HERO · DIFF · OUT(json) · LIMIT(지역당 게임 초) · ALLIES=n(R720 배치 영웅 n명을 첫 지역에 사서 코어 둘레에 둠) · ALLYLV=k(각 레벨 강화 k번)
import {createRequire} from 'node:module';import fs from 'node:fs';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const E=process.env,URL=E.SW_URL||'http://127.0.0.1:4410/m0/',LIMIT=+E.LIMIT||400,HERO=E.HERO||'hwando',DIFF=E.DIFF||'normal';
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:480,height:270}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e.stack||e).slice(0,300)));const A=(f,a)=>p.evaluate(f,a);
await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').waitFor({timeout:180000});
await p.locator('#survivalStartR600').click();await p.locator(`[data-r600diff="${DIFF}"]`).click();await p.locator(`[data-r600hero="${HERO}"]`).click();await p.locator('#r600Go').click();
const ready=()=>p.waitForFunction(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;return Z.here()&&!loading&&Z.state().ready;},null,{timeout:240000,polling:200});
await ready();
if(+E.ALLIES>0){const r=await A(({n,k})=>{const D=window.__STORYWORLD_HERO_DEFENSE_R720__,Z=window.__STORYWORLD_SURVIVAL_R600__;if(!D)return {none:1};D.qaGive(99999);
  const c=room.survivalR600.centre,ids=Object.keys(HEROES).filter(h=>h!==player.hero).slice(0,n),out=[];const sx=player.x,sy=player.y;
  ids.forEach((id,j)=>{const a=j/ids.length*Math.PI*2;player.x=c.x+Math.cos(a)*2.4;player.y=c.y+Math.sin(a)*2.4;const b=D.buy(id);out.push({id,ok:b.ok,placed:b.placed,why:b.why||b.placeWhy});for(let q=0;q<k;q++)D.upgrade(j,'level');});
  player.x=sx;player.y=sy;return out;},{n:+E.ALLIES,k:+E.ALLYLV||0});console.log('allies',JSON.stringify(r));}
await A(()=>{let s=12345;Math.random=()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648;};});
const N=await A(()=>window.__STORYWORLD_SURVIVAL_R600__.state().ids),FROM=+(E.FROM||0),TO=Math.min(N-1,E.TO!==undefined?+E.TO:N-1);const rows=[];
if(FROM>0){await A(i=>window.__STORYWORLD_SURVIVAL_R600__.qaGo(i),FROM);await ready();}
for(let i=FROM;i<=TO;i++){
 await ready();const st0=await A(()=>window.__STORYWORLD_SURVIVAL_R600__.state());if(st0.i!==i){await A(i=>window.__STORYWORLD_SURVIVAL_R600__.qaGo(i),i);await ready();}
 await A(()=>{window.__B={t0:time,dmgWave:0,dmgBoss:0,coreWave:0,coreBoss:0,boss:null,bossT0:0,bossT1:0,bossMax:0,bossDmgStat:0,bossName:'',hits:0,bossHitsTaken:0,maxHit:0,waveEnd:0};});
 let row=null,lastWall=Date.now();
 for(;;){const r=await A(({LIMIT,i})=>{const Z=window.__STORYWORLD_SURVIVAL_R600__,B=window.__B;const T0=performance.now(),tb=time;
   while(performance.now()-T0<350){if(modal){const bt=document.getElementById('r600Pick'+Math.floor(Math.random()*3))||document.getElementById('r600Pick0');if(bt){bt.click();continue;}return {wait:1};}if(loading)return {wait:1};
    let st=Z.state();if(st.i!==i||time-B.t0>LIMIT)return {done:st.i!==i?'advanced':'limit',B,st,lv:st&&window.__STORYWORLD_SURVIVAL_R600__.inspect(),plv:player.level,atk:Math.round(attackPower()),mhp:Math.round(maxHP())};
    if(Z.narr().playing)Z.skipNarration();
    const en=room.enemies.filter(e=>e.hp>0&&!e.deadRecorded);let best=null,bd=1e9;for(const e of en){const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<bd){bd=d;best=e;}}
    if(best&&bd>1.3){const s=Math.min(bd-1.2,4.5/30),nx=player.x+(best.x-player.x)/bd*s,ny=player.y+(best.y-player.y)/bd*s;if(!blocked(nx,ny,.3,room)){player.x=nx;player.y=ny;}}
    const h0=player.hp,c0=st.core.hp;tick(1/30);st=Z.state();
    const boss=room.enemies.find(e=>e.r600Boss);if(boss&&!B.boss){B.boss=boss.id;B.bossT0=time;B.bossMax=Math.round(boss.maxHp);B.bossName=boss.name;B.bossDmgStat=+(boss.damage||0).toFixed(1);B.boss_mid=!boss.boss;}
    const bossAlive=!!(boss&&boss.hp>0&&!boss.deadRecorded);if(B.boss&&!bossAlive&&!B.bossT1)B.bossT1=time;
    const lost=Math.max(0,h0-player.hp),cl=Math.max(0,c0-st.core.hp);if(lost>0){B.maxHit=Math.max(B.maxHit,lost);if(bossAlive){B.dmgBoss+=lost;B.bossHitsTaken++;}else B.dmgWave+=lost;}
    if(cl>0){if(bossAlive)B.coreBoss+=cl;else B.coreWave+=cl;}
    if(!B.waveEnd&&st.phase!=='pre')B.waveEnd=time;
    player.hp=maxHP();if(st.core.hp<st.core.stats.max)Z.qaCoreHp(st.core.stats.max);}
   if(time===tb)return {wait:1};return {t:time};},{LIMIT,i});
  if(r.wait){if(Date.now()-lastWall>240000)break;await p.waitForTimeout(150);continue;}lastWall=Date.now();
  if(r.done){const B=r.B;row={i,id:(await A(i=>window.__STORYWORLD_SURVIVAL_R600__.stageIds()[i],i)),done:r.done,lv:r.st.core?undefined:undefined,survLv:null,plv:r.plv,atk:r.atk,mhp:r.mhp,
    wave:Math.round((B.waveEnd||0)-B.t0),boss:B.bossName,mid:!!B.boss_mid,bossHp:B.bossMax,bossDmg:B.bossDmgStat,bossKill:B.bossT1?+(B.bossT1-B.bossT0).toFixed(1):null,
    dmgWave:Math.round(B.dmgWave),dmgBoss:Math.round(B.dmgBoss),maxHit:Math.round(B.maxHit),coreWave:Math.round(B.coreWave),coreBoss:Math.round(B.coreBoss)};
   row.survLv=await A(()=>window.__STORYWORLD_SURVIVAL_R600__.state()?.core?0:0);break;}
 }
 if(row){row.survLv=await A(()=>{try{return document.querySelector('#r600Hud .s')?.textContent||'';}catch(_){return '';}});rows.push(row);console.log(JSON.stringify(row));}
}
if(E.OUT)fs.writeFileSync(E.OUT,JSON.stringify({rows,errs},null,1));await b.close();
