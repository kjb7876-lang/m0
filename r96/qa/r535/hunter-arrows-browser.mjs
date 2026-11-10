// R535 브라우저 검사(헤드리스): 헌터로 바꾸고 몹 무리 앞에서 Q·Z·C 를 되풀이해 연계가 실제로 나는지, 오류·투사체 상한·프레임 시간을 잰다.
// SW_OFF=1 이면 끈 채 같은 순서(전후 비교). SHOT=경로 면 C 폭발 직후 한 장.
import {chromium,boot,go} from '../r444/lib.mjs';
const off=!!process.env.SW_OFF,shot=process.env.SHOT||'',zone=process.env.ZONE||'dist01',secs=+(process.env.SECS||25);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:off?{'storyworld.r535.hunter':'{"on":false}'}:null});
await go(p,zone);
// 영웅 바꾸기: 영웅 창에서 헌터 카드
await p.evaluate(()=>{showHeroes();});await p.waitForTimeout(500);
await p.evaluate(()=>{const c=document.querySelector('[data-hero="hunter"]');c?.click();});await p.waitForTimeout(400);
await p.evaluate(()=>{const btn=[...document.querySelectorAll('#panel button')].find(x=>/선택|확인|시작|변경|출전/.test(x.textContent));btn?.click();});
await p.waitForFunction(()=>!loading,null,{timeout:90000});await p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const hero=await p.evaluate(()=>player.hero);console.log('hero',hero);
await p.evaluate(()=>{player.hp=99999;const L=room.enemies.filter(e=>e.hp>0&&!e.boss).slice(0,10);for(const e of room.enemies)if(!L.includes(e)){e.hp=0;e.dead=true;}
 L.forEach((e,i)=>{e.x=player.x+4+(i%4)*.7;e.y=player.y+(Math.floor(i/4)-1)*.9;e.homeX=e.x;e.homeY=e.y;e.speed=0;e.moveSpeed=0;e.damage=0;e.hp=e.maxHp=1e7;e.spawnState='active';});
 window.__fr=[];let last=performance.now();(function f(){const n=performance.now();window.__fr.push(n-last);last=n;requestAnimationFrame(f);})();
 window.__cast=s=>{const el=document.getElementById('story-wer-'+s);el?.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));};});
let fail=0;const ok=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)fail++;};const errs=[];p.on('pageerror',e=>errs.push(String(e)));
const t0=Date.now();let maxLive=0,shotDone=false;
while(Date.now()-t0<secs*1000){await p.evaluate(()=>{player.specialCD=0;if(player.storyWER)player.storyWER.ready={};special();__cast('w');__cast('r');});
 for(let k=0;k<6;k++){await p.waitForTimeout(150);const m=await p.evaluate(()=>projectiles.filter(x=>x.r535&&!x.dead).length);maxLive=Math.max(maxLive,m);
  if(shot&&!shotDone&&!off){const fx=await p.evaluate(()=>window.__STORYWORLD_HUNTER_ARROWS_R535__?.inspect().fx||0);if(fx){await p.evaluate(()=>{const tb=tick;window.__tb=tb;tick=function(dt,...a){return tb.call(this,dt*1e-4,...a);};});await p.waitForTimeout(500);await p.screenshot({path:shot});await p.evaluate(()=>{tick=window.__tb;});shotDone=true;}}}}
const r=await p.evaluate(()=>{const f=__fr.slice(30).sort((a,b)=>a-b),avg=f.reduce((s,x)=>s+x,0)/f.length;return {frames:f.length,avg,p95:f[Math.floor(f.length*.95)],gameTime:time,i:window.__STORYWORLD_HUNTER_ARROWS_R535__?.inspect()};});
console.log(JSON.stringify({off,hero,maxLive,avgMs:+r.avg.toFixed(1),p95Ms:+r.p95.toFixed(1),frames:r.frames,stats:r.i?.stats}));
ok('hero is hunter',hero==='hunter');ok('no page errors '+errs.slice(0,2).join(' | '),errs.length===0);
if(!off){const s=r.i.stats;ok('storm shots tagged',s.stormShots>0);ok('lance blasts',s.blasts>0&&s.petals>0);ok('shards from Z',s.shards>0);ok('enemies burned',s.burnTicks>0);ok('R535 live ≤ 24 ('+maxLive+')',maxLive<=24&&s.maxLive<=24);ok('lance drawn',s.lanceDraws>0);ok('no internal errors '+(s.lastError||''),s.errors===0);}
await b.close();process.exit(fail?1:0);
