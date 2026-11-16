// R1113b 헤드리스: 페르소나 형상 공격·스킬 때 걷기 칸 + 구슬 빛·오라 (소프트웨어 렌더링, 그래픽 검증 아님)
import {chromium,boot} from '../r444/lib.mjs';
const OUT=process.argv[2]||'/tmp';const b=await chromium.launch();
const {p}=await boot(b,{vp:{width:1280,height:720},init:{'storyworld.r1055.inkWash':JSON.stringify({mode:process.env.INK||'off'})}});
const A='__STORYWORLD_PERSONA_HERO_R1113__',R={};
await p.evaluate(async A=>{await ensureImages(heroPaths('lauren'));player.hero='lauren';window[A].setForm(true);},A);
await p.evaluate(()=>{const T=__STORYWORLD_PHASE1__.controller.state.three;const O=T.render;T.render=function(f){const r=O.apply(this,arguments);try{window.__fx=f.commands.filter(c=>/^r1113:(orb|aura)$/.test(c.owner?.id||'')).map(c=>c.owner.id+':'+c.style.globalCompositeOperation+':'+(+c.style.globalAlpha).toFixed(2));}catch(e){}return r;};});
await p.waitForTimeout(1500);
for(const [k,d] of [['ArrowDown','front'],['ArrowLeft','left'],['ArrowRight','right'],['ArrowUp','back']]){await p.keyboard.down(k);await p.waitForTimeout(500);await p.keyboard.up(k);await p.waitForTimeout(300);
 await p.evaluate(d=>{player.direction=d;player.attackAnim=.35;},d);await p.waitForTimeout(250);
 R[d]={fx:await p.evaluate(()=>window.__fx),last:await p.evaluate(A=>window[A].inspect().stats.last,A)};
 const g=await p.evaluate(()=>{const q=project(player.x,player.y);return q;});await p.screenshot({path:OUT+'/r1113b-act-'+d+'.png'});}
await p.keyboard.press('KeyQ');await p.waitForTimeout(250);R.skill={fx:await p.evaluate(()=>window.__fx),last:await p.evaluate(A=>window[A].inspect().stats.last,A)};await p.screenshot({path:OUT+'/r1113b-skill.png'});
R.stats=await p.evaluate(A=>window[A].inspect(),A);console.log(JSON.stringify(R,null,1));await b.close();
