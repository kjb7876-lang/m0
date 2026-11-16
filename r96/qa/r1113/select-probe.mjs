// R1113 헤드리스 확인: 보스 처치 해금 → 영웅 창 9번째 칸 → 선택 확정 → 게임 안 몸 그림·걷기 시트·언주색
import {chromium,boot,skip} from '../r444/lib.mjs';
const OUT=process.argv[2]||'/tmp';const b=await chromium.launch();
const {p}=await boot(b,{vp:{width:1280,height:720},init:{'storyworld.r1055.inkWash':JSON.stringify({mode:process.env.INK||'off'})}});
const A='__STORYWORLD_PERSONA_HERO_R1113__',R={};
R.lockSaved=await p.evaluate(A=>{const X=window[A];X.lock();const s0=X.inspect().saved.on;room.persona=room.persona||{};const old={...room.persona};room.persona.completed=true;room.persona.phase='complete';X.watch();const s1=X.inspect().saved.on;Object.assign(room.persona,old);delete room.persona.completed;return {before:s0,after:s1};},A);
await p.evaluate(()=>{showHeroes();});await p.waitForTimeout(800);
R.cards=await p.evaluate(()=>{const cs=[...document.querySelectorAll('#panel .cards > *')];return cs.map(c=>c.dataset.hero||(c.dataset.personaR1113?'PERSONA':(c.dataset.egoR1046?'EGO':c.className)));});
await p.screenshot({path:OUT+'/r1113-select-before.png'});
await p.locator('#panel [data-persona-r1113]').first().click();await p.waitForTimeout(400);
R.afterClick=await p.evaluate(A=>({sel:!!document.querySelector('#panel [data-persona-r1113].selected'),stage:document.getElementById('r263Stage')?.querySelector('.nm')?.textContent,want:window[A].inspect().want}),A);
await p.screenshot({path:OUT+'/r1113-select-persona.png'});
await p.locator('#chooseHero').click();await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip(p);await p.waitForTimeout(1500);
R.afterCommit=await p.evaluate(A=>({hero:player.hero,form:window[A].formActive(),name:document.getElementById('heroName')?.textContent,imgs:window[A].images()}),A);
await p.evaluate(()=>{const R=__STORYWORLD_PHASE1__.controller.state.three;const O=R.render;R.render=function(f){try{window.__hb=f.commands.filter(c=>c.kind==='image'&&c.owner?.kind==='hero').map(c=>({path:String(c.sourcePath).slice(-60),h:+Math.abs(c.points[3][1]-c.points[0][1]).toFixed(1),r:!!c.r1113}));window.__tn=f.commands.filter(c=>c.r1113tint).length;}catch(e){}return O.apply(this,arguments);};});
await p.waitForTimeout(1200);R.idle={hb:await p.evaluate(()=>window.__hb),insp:await p.evaluate(A=>window[A].inspect(),A)};
await p.screenshot({path:OUT+'/r1113-idle.png'});
for(const k of ['ArrowRight','ArrowDown','ArrowUp','ArrowLeft']){await p.keyboard.down(k);await p.waitForTimeout(2500);R['walk_'+k]=await p.evaluate(A=>window[A].inspect().stats.last,A);await p.screenshot({path:OUT+'/r1113-walk-'+k+'.png'});await p.keyboard.up(k);}
await p.keyboard.press('KeyQ');await p.waitForTimeout(500);R.tintN=await p.evaluate(()=>window.__tn);await p.screenshot({path:OUT+'/r1113-skill.png'});
R.final=await p.evaluate(A=>window[A].inspect(),A);
R.save=await p.evaluate(A=>{const d=serializeSave();return d?.player?.[window[A].field];},A);
console.log(JSON.stringify(R,null,1));await b.close();
