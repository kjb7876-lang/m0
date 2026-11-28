// R1386 심사용 장면 — 2D 기억사수 소환 몸이 위·대각·아래·옆 표적을 쏘는 순간(640×360 헤드리스, 소프트웨어 렌더링)
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});await go(p,process.env.ZONE||'dist00');
await p.evaluate(async()=>{player.hp=player.maxHp=99999;await ensureImages(heroPaths('seoha'));player.hero='seoha';for(const z of ['dreamRest','restEp1b','u201','restU2','kair01'])visited.add('STORY:'+z);
 const lv=window.__STORYWORLD_SKILL_UNLOCK_R1275__?.passiveLevels?.('story')||[5,15,30];player.level=lv[1]+30;await ensureImages(heroPaths('gunner'));
 const A=window.__STORYWORLD_HERO2D_RULES_R1374__;A.qaProbe({pre(q){if(q.r720Ally&&q.hero==='gunner')window.__g={x:q.x,y:q.y};}});
 const live=room.enemies.filter(e=>!e.boss&&!e.midboss);window.__foe=live[0];for(const e of room.enemies){e.speed=0;e.damage=0;e.hp=e.maxHp=9e6;e.x=player.x+60;e.y=player.y+60;}window.__foe.x=player.x+3;window.__foe.y=player.y;window.__foe.spawnState='active';});
await p.waitForTimeout(1500);
await p.evaluate(()=>{const api=window.__STORYWORLD_SEOHA_EPOCH_R949__;for(let i=0;i<80;i++){api.qaReset();api.qaForce('heroes');hitEnemy(window.__foe,1,{kind:'basic',sourceHero:'seoha'});if(api.has('gunner')&&!['hunter','slayer','michaela','hwando'].some(h=>api.has(h)))break;}
 window.__ang=0;const tk=tick;tick=function(...a){const r=tk.apply(this,a);try{const g=window.__g||player,an=window.__ang,sx=Math.cos(an)*3,sy=Math.sin(an)*3,e=window.__foe;e.x=g.x+(sx/2+sy);e.y=g.y+(sy-sx/2);e.hp=e.maxHp;}catch(_){}return r;};});
for(const [name,deg] of [['up',-90],['upright',-45],['right',0],['downright',45],['down',90],['upleft',-135]]){
 const t=await p.evaluate(d=>{window.__ang=d*Math.PI/180;return time;},deg);await p.waitForFunction(t=>time-t>1.3,t,{timeout:600000,polling:300});
 await p.screenshot({path:new URL(`./shot-${name}.png`,import.meta.url).pathname});console.log('shot',name);}
await b.close();
