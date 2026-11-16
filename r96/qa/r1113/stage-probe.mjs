import {chromium,boot,skip} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:1280,height:720}});
const A='__STORYWORLD_PERSONA_HERO_R1113__';
await p.evaluate(()=>{showHeroes();});await p.waitForTimeout(800);
const snap=()=>p.evaluate(A=>({sel:[...document.querySelectorAll('#panel .selected')].map(e=>e.dataset.hero||e.dataset.personaR1113||e.className),stage:document.getElementById('r263Stage')?.dataset.hero,nm:document.getElementById('r263Stage')?.querySelector('.nm')?.textContent,cls:document.getElementById('r263Stage')?.className,want:window[A].inspect().want,cards:window[A].inspect().stats.cards,player:player.hero}),A);
console.log('open',JSON.stringify(await snap()));
await p.locator('#panel [data-persona-r1113]').first().click();
for(const t of [0,100,300,600]){await p.waitForTimeout(t);console.log('t'+t,JSON.stringify(await snap()));}
await b.close();
