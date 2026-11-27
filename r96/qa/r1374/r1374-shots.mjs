// R1374 심사용 장면(960×540, DSF2, 영웅 둘레 잘라 찍기, 찍기 직전 tick 배율 1e-4 로 순간 고정 — qa/r444/scene4.mjs 방식).
//  SHOT=side : 2D 조종 영웅(3D 끔)이 왼쪽·오른쪽 적을 치는 순간 2장
//  SHOT=summon : 서하 평행세계 소집 소환 몸 — 블링크 순간 1장(잔상·문양) + 4명 함께 1장
import {createRequire} from 'node:module';import {skip,go,URL} from '../r444/lib.mjs';const {chromium}=createRequire(import.meta.url)('playwright');
const SHOT=process.env.SHOT||'side',OUT=new globalThis.URL('./',import.meta.url).pathname;
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:2});
await ctx.addInitScript(([s])=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));if(s==='side')localStorage.setItem('storyworld.r1302.hwando3d','off');},[SHOT]);
const p=await ctx.newPage();await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
await go(p,'dist00');
await p.evaluate(()=>{window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});
const clipAt=async(w=420,h=300)=>{const q=await p.evaluate(()=>{const c=document.querySelector('canvas');const r=c.getBoundingClientRect();const pts=window.__focus||[player];let x=0,y=0;for(const o of pts){const s=project(o.x,o.y);x+=s.x;y+=s.y;}x/=pts.length;y/=pts.length;const k=(typeof window.__clipK==='number')?window.__clipK:1;return {x:r.left+x*k,y:r.top+y*k,dbg:[c.width,c.height,r.width,r.height,x,y]};});console.log('clip',JSON.stringify(q));
 return {x:Math.max(0,Math.min(960-w,q.x-w/2)),y:Math.max(0,Math.min(540-h,q.y-h*.62)),width:w,height:h};};
const freeze=async()=>{await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(500);};
const thaw=()=>p.evaluate(()=>{window.__SLOW=1;});
if(SHOT==='side'){
 await p.evaluate(async()=>{player.hero='slayer';await ensureImages(heroPaths('slayer'));player.hp=player.maxHp=99999;window.__mob=room.enemies.filter(e=>!e.boss&&!e.midboss).slice(0,1);for(const e of room.enemies)if(!window.__mob.includes(e)){e.x=player.x+40;e.y=player.y+40;}for(const e of window.__mob){e.hp=e.maxHp=9e6;e.damage=0;e.speed=0;e.spawnState='active';}});
 for(const side of ['left','right']){
  await p.evaluate(side=>{const k=side==='left'?-1.3:1.3;for(const e of window.__mob){e.x=player.x+k;e.y=player.y-k;}target=window.__mob[0];},side);
  await p.waitForTimeout(600);await p.evaluate(()=>{player.attackCD=0;player.attackAnim=0;basicAttack();});
  await p.waitForFunction(()=>player.attackAnim>0.06||(player.attackCD<=0&&(basicAttack(),false)),null,{timeout:120000,polling:40});await freeze();
  const info=await p.evaluate(()=>({dir:player.direction,insp:window.__STORYWORLD_HERO2D_RULES_R1374__.inspect().stats}));
  await p.screenshot({path:OUT+`shot-side-${side}.png`,clip:await clipAt()});console.log(side,JSON.stringify(info));await thaw();await p.waitForTimeout(800);}
}else{
 await p.evaluate(async()=>{player.hp=player.maxHp=99999;await ensureImages(heroPaths('seoha'));player.hero='seoha';for(const z of ['dreamRest','restEp1b','u201','restU2','kair01'])visited.add('STORY:'+z);
  const lv=window.__STORYWORLD_SKILL_UNLOCK_R1275__?.passiveLevels?.('story')||[5,15,30];player.level=lv[1]+30;for(const h of ['hunter','slayer','michaela','gunner','hwando'])try{await ensureImages(heroPaths(h));}catch(_){}
  const live=room.enemies.filter(e=>!e.boss&&!e.midboss).slice(0,4);for(const e of room.enemies)if(!live.includes(e)){e.x=player.x+40;e.y=player.y+40;}for(const e of live){e.x=player.x+3;e.y=player.y-1;e.hp=e.maxHp=9e6;e.damage=0;e.speed=0;e.spawnState='active';}window.__live=live;
  const api=window.__STORYWORLD_SEOHA_EPOCH_R949__;api.qaReset();api.qaForce('heroes');hitEnemy(live[0],1,{kind:'basic',sourceHero:'seoha'});
  const o={x:player.x,y:player.y},t0=time;const tb=tick;tick=function(...a){const r=tb.apply(this,a);try{if(window.__SLOW>.5){const u=time-t0,k=Math.sin(u*1.1)*2.4;moveActor(player,o.x+k-player.x,o.y-k*.5-player.y,.27);}}catch(_){}return r;};});
 // ② 블링크 순간: 연출이 막 생긴 때(0.12초 안)
 await p.waitForFunction(()=>{const s=window.__STORYWORLD_HERO2D_RULES_R1374__.snaps().filter(x=>x.kind==='blink');const l=s[s.length-1];const fx=(effects||[]).some(e=>e.r1374&&e.type==='sigil'&&e.age<.12);if(l&&fx){window.__focus=[l];return true;}return false;},null,{timeout:300000,polling:30});
 await freeze();await p.screenshot({path:OUT+'shot-summon-blink.png',clip:await clipAt()});console.log('blink',JSON.stringify(await p.evaluate(()=>({fx:effects.filter(e=>e.r1374).map(e=>[e.type,+e.age.toFixed(2)]),snap:window.__focus[0]}))));await thaw();
 // ③ 4명 함께(주인 포함 영역)
 await p.waitForTimeout(1500);await freeze();
 await p.evaluate(()=>{const api=window.__STORYWORLD_SEOHA_EPOCH_R949__;window.__focus=[player];});
 await p.screenshot({path:OUT+'shot-summon-four.png',clip:await clipAt(560,340)});
 console.log('four',JSON.stringify(await p.evaluate(()=>({has:['hunter','slayer','michaela','gunner','hwando'].filter(h=>window.__STORYWORLD_SEOHA_EPOCH_R949__.has(h)),st:window.__STORYWORLD_HERO2D_RULES_R1374__.inspect().stats}))));
}
await b.close();
