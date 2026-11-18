// R1145 장면: 형상(페르소나) vs 라우렌 본인 — 기본 공격 적중 그림(R411 hit-teleport)·엔진 탄/착탄(R302 사본). 헤드리스, 그래픽 검증 아님.
import {chromium,boot,go} from '../r444/lib.mjs';
const OUT=process.argv[2]||'.';const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});const A='__STORYWORLD_PERSONA_HERO_R1113__';
await p.evaluate(async A=>{await ensureImages(heroPaths('lauren'));player.hero='lauren';window[A].setForm(true);},A);
await go(p,'murder01');await p.waitForTimeout(2000);
await p.evaluate(()=>{player.maxHp=player.hp=99999;room.enemies.forEach(e=>{e.maxHp=e.hp=1e9;e.cd=1e6;e.attack=null;e.speed=0;e.x=player.x+30;e.y=player.y+30;});const e=room.enemies.find(e=>e.hp>0);e.x=player.x+2;e.y=player.y;});
const waitT=async dt=>{const t0=await p.evaluate(()=>time);for(let i=0;i<900;i++){if(await p.evaluate(t0=>time-t0,t0)>=dt)return;await p.waitForTimeout(40);}};
for(const [tag,form] of [['persona',true],['lauren',false]]){await p.evaluate(([A,f])=>window[A].setForm(f),[A,form]);await waitT(.3);
 for(let k=0;k<4;k++){await p.evaluate(()=>{const e=room.enemies.find(e=>e.hp>0&&Math.hypot(e.x-player.x,e.y-player.y)<4);player.direction='right';window.__STORYWORLD_SKILL_SHEETS_R411__.play('hit-teleport',e.x,e.y-.1);basicAttack();});await waitT(.18+k*.04);
  await p.screenshot({path:`${OUT}/hit-${tag}-${k}.png`,clip:{x:400,y:150,width:260,height:200}});await waitT(.5);}}
await b.close();
