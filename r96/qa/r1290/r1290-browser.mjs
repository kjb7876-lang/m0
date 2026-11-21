// R1290 브라우저 검사: 3D EGO 로 넘어온 뒤 시간이 갈수록 push 감싸기가 쌓이지 않는지(헤드리스 소프트웨어 렌더, GPU·실기기 미검증).
//  기억사수 → 777 → 3D EGO 전환 → dist02 자동 전투 → WAIT 초 동안 두고 push 1회 비용·R1286 감싸기 횟수를 처음과 비교.
//  URL=http://127.0.0.1:4396/m0/ WAIT=240 node r96/qa/r1290/r1290-browser.mjs
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.URL||'http://127.0.0.1:4396/m0/',WAIT=+(process.env.WAIT||240);let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log(c?'ok  ':'FAIL',m,d===undefined?'':JSON.stringify(d).slice(0,300));};
const b=await chromium.launch({headless:true});const p=await (await b.newContext({viewport:{width:640,height:360}})).newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.go('dist02','STORY');}).catch(()=>{});
await p.evaluate(async()=>{const P=window.__STORYWORLD_PROGRESSION_R71__;if(P?.difficultyState?.().open){P.selectDifficulty('normal');await P.confirmDifficulty();}});
await p.waitForFunction(()=>!loading,null,{timeout:180000});await skip();
// 기억사수로 잠깐 → EGO(3D)로 전환(실제 영웅창 길)
async function pick(id0,lk){return p.evaluate(async([id0,lk])=>{showHeroes(false);await new Promise(r=>setTimeout(r,60));
 const q=()=>(id0==='ego'?document.querySelector(lk==='3d'?'#panel [data-r1176="3d"]':'#panel [data-ego-r1046]'):null)||document.querySelector(`#panel [data-hero="${id0}"]:not(#r263Stage)`);
 let el=q();for(let k=0;k<100&&!el;k++){await new Promise(r=>setTimeout(r,50));el=q();}if(!el)return{err:'no card'};/* 실제 길: 영웅창의 '3D EGO' 칸을 누른다(모습 3d + 원래 EGO 칸 누르기) */el.click();await new Promise(r=>setTimeout(r,120));document.getElementById('chooseHero')?.click();for(let k=0;k<400&&(loading||modal);k++)await new Promise(r=>setTimeout(r,25));
 return{hero:player.hero,ego:!!player.egoSovereignR1046,look:window.__STORYWORLD_EGO_FORM_R1176__.look()};},[id0,lk]);}
await p.evaluate(()=>{player.invincible=1e9;try{window.__STORYWORLD_EGO_SOVEREIGN_R1046__.unlock('secret-777')}catch(_){}});
console.log('gunner',JSON.stringify(await pick('gunner')));await p.waitForTimeout(3000);
const e=await pick('ego','3d');console.log('ego',JSON.stringify(e));ok(e.ego&&e.look==='3d','3D EGO 로 넘어옴',e);
await p.evaluate(()=>{auto=true;guide=true;});
// push 1회 비용: 실제 그리기 명령 묶음과 같은 프로토타입의 빈 묶음에 이펙트 명령을 2만 번 넣는다
const bench=()=>p.evaluate(()=>{const P=window.StoryPhase1.DrawCommands.prototype;const o=Object.create(P);o.commands=[];o.owner={kind:'effect',id:'r1290'};o.globalAlpha=1;
 const d={key:'r1290',points:[[0,0],[1,0],[1,1],[0,1]],sourcePath:'x.webp'};let err=0;const t=performance.now();for(let i=0;i<20000;i++){try{P.push.call(o,'image',d);}catch(_){err++;}if(o.commands.length>500)o.commands.length=0;}
 return{usPerPush:+((performance.now()-t)*1000/20000).toFixed(2),err,wraps:window.__STORYWORLD_EGO_CLOUD_R1286__?.inspect?.().stats.wraps,marks:[!!P.push.__r1041,!!P.push.__r1286]};});
await p.waitForTimeout(5000);const a=await bench();console.log('start',JSON.stringify(a));
await p.waitForTimeout(WAIT*1000);const z=await bench();console.log('after',WAIT,'s',JSON.stringify(z));
ok(z.wraps-a.wraps<=2,'R1286 이 push·ego·hurt 를 다시 감싸지 않음(감싸기 횟수 그대로)',{start:a.wraps,after:z.wraps});
ok(z.usPerPush<=a.usPerPush*1.6+0.3,'push 1회 비용이 시간이 지나도 늘지 않음',{start:a.usPerPush,after:z.usPerPush});
ok(z.marks.every(Boolean),'R1041·R1286 감싸기 둘 다 살아 있음',z.marks);
ok(errors.length===0,'페이지 오류 없음',errors.slice(0,3));
console.log(`\n${n-bad}/${n} 통과`);await b.close();process.exit(bad?1:0);
