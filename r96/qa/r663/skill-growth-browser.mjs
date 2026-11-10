// R663 브라우저 검사(헤드리스, 소프트웨어 렌더링, 3D 끔): 실제 빌드에서 새 게임을 시작해 Q·W·E·R 이 잠겨 있는지, 점수로 배우면 나가는지,
// 단계가 오르면 Q 가 맞히는 최대 거리가 늘어나는지, P 창 카드가 보이는지 잰다. GPU·실기기·자연 플레이는 아님.
import {chromium,skip} from '../r444/lib.mjs';
import fs from 'node:fs';
const OUT=process.env.SW_OUT||'/tmp/r663';fs.mkdirSync(OUT,{recursive:true});
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);
const out={};const G=()=>p.evaluate(()=>window.__STORYWORLD_SKILL_GROWTH_R663__.inspect());
await p.waitForTimeout(3500);
out.start=await p.evaluate(()=>({hero:player.hero,level:player.level,points:player.points,ranks:window.__STORYWORLD_SKILL_GROWTH_R663__.inspect().ranks,locked:['q','w','e','r'].map(s=>window.__STORYWORLD_SKILL_GROWTH_R663__.locked(s)),
 wready:Object.entries(player.storyWER?.ready||{}).filter(([k,v])=>v>time+1e5).map(([k])=>k),marker:window.__STORYWORLD_PROGRESSION_R62__.state(player).pointDropClaimsR64['r64:skillgrowth-r663']===true}));
await p.screenshot({path:OUT+'/start-hud.png'});
// 잠긴 키: 진짜 키 입력
await p.evaluate(()=>{player.specialCD=0;});
for(const k of ['q','w','e','r'])await p.keyboard.press(k);
await p.waitForTimeout(300);
out.afterLockedKeys=await p.evaluate(()=>({specialCD:player.specialCD,werCasts:window.__STORYWORLD_WER__.inspect().casts.length,stats:window.__STORYWORLD_SKILL_GROWTH_R663__.inspect().stats}));
out.hudLocked=await p.evaluate(()=>['specialBtn','story-wer-w','story-wer-e','story-wer-r'].map(id=>{const e=document.getElementById(id);return e?{id,cls:e.className,cd:e.querySelector('.cd')?.textContent}:null;}));
// 배우기: 점수 주고 R62 구매
out.buy=await p.evaluate(()=>{player.points=200;const A=window.__STORYWORLD_PROGRESSION_R62__;const r=[];for(const id of ['skillQR663','skillWR663'])r.push([id,A.purchase(id)]);return{r,points:player.points,ranks:window.__STORYWORLD_SKILL_GROWTH_R663__.inspect().ranks};});
await p.waitForTimeout(300);
await p.evaluate(()=>{player.specialCD=0;});await p.keyboard.press('q');await p.waitForTimeout(300);
out.afterQ=await p.evaluate(()=>({specialCD:player.specialCD,locked:window.__STORYWORLD_SKILL_GROWTH_R663__.locked('q')}));
await p.keyboard.press('w');await p.waitForTimeout(300);
out.afterW=await p.evaluate(()=>({casts:window.__STORYWORLD_WER__.inspect().casts.map(c=>c.slot),lockedE:window.__STORYWORLD_SKILL_GROWTH_R663__.locked('e')}));
// P 창
await p.evaluate(()=>showUpgrades());await p.waitForTimeout(500);
out.panel=await p.evaluate(()=>({cards:[...document.querySelectorAll('#panel [data-r62-passive^="skill"]')].map(b=>b.querySelector('strong')?.textContent),book:[...document.querySelectorAll('#r115Book section h4')].map(h=>h.textContent.trim()).slice(0,8)}));
await p.locator('#panel').screenshot({path:OUT+'/panel.png'}).catch(e=>out.shotErr=String(e).slice(0,100));
await p.evaluate(()=>closePanel(true));
// 범위: Q 가 맞힌 몹의 최대 거리(1단계 vs 7단계)
const reach=r=>p.evaluate(async r=>{window.__STORYWORLD_PROGRESSION_R62__.state(player).ranks.skillQR663=r;auto=false;guide=false;player.hp=player.maxHp=99999;
 const hits=[];const base=hitEnemy;hitEnemy=function(e,...a){if(e&&player)hits.push(Math.hypot(e.x-player.x,e.y-player.y));return base.apply(this,[e,...a]);};
 const live=room.enemies.filter(e=>e.hp>0).slice(0,24);live.forEach((e,i)=>{const a=i/live.length*Math.PI*2,d=2+i*.4;e.x=player.x+Math.cos(a)*d;e.y=player.y+Math.sin(a)*d;e.hp=e.maxHp=99999;e.damage=0;e.spawnState='active';});
 room.engaged=true;player.specialCD=0;special();
 await new Promise(res=>{const t0=time;const f=()=>time>=t0+2?res():setTimeout(f,30);f();});hitEnemy=base;return{n:live.length,hits:hits.length,max:+Math.max(0,...hits).toFixed(2)};},r);
out.reach1=await reach(1);out.reach7=await reach(7);
out.errors=errs.slice(0,8);console.log(JSON.stringify(out,null,1));await b.close();
