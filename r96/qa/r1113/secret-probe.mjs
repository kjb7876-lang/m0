// R1113c 헤드리스: 시작 영웅창에서 777 → EGO 와 페르소나 칸이 함께 보이고, 창을 다시 열면 10칸
import {chromium,URL} from '../r444/lib.mjs';
const OUT=process.argv[2]||'/tmp';const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:720}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();p.on('pageerror',e=>console.error('PAGEERR',String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.waitForSelector('#panel [data-hero]',{timeout:60000});await p.waitForTimeout(800);
const cnt=()=>p.evaluate(()=>({persona:[...document.querySelectorAll('#panel [data-persona-r1113]')].filter(e=>e.offsetParent).length,ego:[...document.querySelectorAll('#panel [data-ego-r1046]')].filter(e=>e.offsetParent).length,heroes:[...document.querySelectorAll('#panel [data-hero]')].filter(e=>e.offsetParent).length,secret:document.getElementById('panel').classList.contains('r1057secret'),unlocked:window.__STORYWORLD_PERSONA_HERO_R1113__.unlocked()}));
const R={before:await cnt()};await p.screenshot({path:OUT+'/r1113c-before.png'});
for(let i=0;i<3;i++){await p.keyboard.press('Digit7');await p.waitForTimeout(150);}await p.waitForTimeout(900);
R.after777=await cnt();await p.screenshot({path:OUT+'/r1113c-after777.png'});
console.log(JSON.stringify(R,null,1));await b.close();
