// R1120 헤드리스 장면(소프트웨어 렌더링 — 그래픽 검증 아님): 형상 켜고 Q·E 스킬, 걷기
import {chromium,boot} from '../r444/lib.mjs';
const OUT=process.argv[2]||'/tmp';const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
const A='__STORYWORLD_PERSONA_HERO_R1113__';
await p.evaluate(async A=>{await ensureImages(heroPaths('lauren'));player.hero='lauren';window[A].unlock('silent');window[A].setForm(true);},A);
await p.waitForTimeout(2500);
for(const [k,ms] of [['KeyQ',700],['KeyE',900]]){await p.keyboard.press(k);await p.waitForTimeout(ms);await p.screenshot({path:OUT+'/r1120-'+k+'.png'});await p.waitForTimeout(3000);}
await p.keyboard.down('ArrowRight');await p.waitForTimeout(1500);await p.screenshot({path:OUT+'/r1120-walk.png'});await p.keyboard.up('ArrowRight');
console.log(JSON.stringify(await p.evaluate(A=>window[A].inspect().stats,A)));await b.close();
