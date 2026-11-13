// R1016 headless browser check (Playwright) on a built site: STORYWORLD_URL=http://127.0.0.1:4396/m0/ node r96/qa/r1016/r1016-browser.mjs
// 헤드리스 Chromium: 입력→안내·관리 창 문구·무한생존 막기 연결만 확인한다. GPU·실기기 모바일·귀 검증 아님.
import {boot,startStory,skip,gameWait,goZone} from './lib.mjs';import {setup} from './setup.mjs';
const out=[];const ok=(n,p,d)=>{out.push(p);console.log((p?'PASS ':'FAIL ')+n+(p?'':' '+JSON.stringify(d)));};
const {b,p}=await boot();await startStory(p,true);
await p.evaluate(()=>{window.__T=[];const tb=toast;window.toast=toast=function(m,...a){window.__T.push(String(m));return tb.call(this,m,...a);};});
const T=async()=>p.evaluate(()=>{const t=[...window.__T];window.__T.length=0;return t;});
ok('installed',await p.evaluate(()=>window.__STORYWORLD_THREAD_CUSTOM_R1016__.inspect().installed===true&&window.__STORYWORLD_DANCES_R74__.__r243===true&&window.__STORYWORLD_DANCES_R74__.__r1016===true));
await p.keyboard.press('KeyG');await p.waitForTimeout(300);let t=await T();ok('G before learning (hub) → 습득 안내',t.some(s=>/습득/.test(s)),t);
await p.evaluate(()=>{player.points=500;window.__STORYWORLD_PROGRESSION_R62__.purchase('threadDanceR63');});
await p.evaluate(()=>window.__STORYWORLD_GOLDEN_R72__.manage());await p.locator('#goldNew').click();
const box=await p.locator('#goldCanvas').boundingBox();const L=(x,y)=>[box.x+box.width*(.5+x*.4),box.y+box.height*(.5+y*.4)];
for(const s of [[[-1,-1],[1,1]],[[1,-1],[-1,1]]]){await p.mouse.move(...L(...s[0]));await p.mouse.down();await p.mouse.move(...L(...s[1]),{steps:8});await p.mouse.up();}
await p.locator('#goldSave').click();await p.locator('#goldLearn').click();await p.waitForTimeout(100);
let m=await p.locator('#goldMessage').textContent();ok('learn → 습득했습니다',/습득했습니다/.test(m),m);
await p.locator('[data-gold-op="equip"]').first().click();m=await p.locator('#goldMessage').textContent();ok('equip → 장착했습니다',/장착했습니다/.test(m),m);
await p.locator('[data-gold-upgrade="cooldown"]').click();m=await p.locator('#goldMessage').textContent();ok('upgrade → 쿨타임 1단계로 강화',/쿨타임 1단계/.test(m),m);
await p.locator('#goldAuto').click();m=await p.locator('#goldMessage').textContent();ok('auto → 켰습니다',/켰습니다/.test(m),m);
await p.evaluate(()=>closePanel(true));
await goZone(p,'dist01');await T();
await p.evaluate(()=>{const es=liveEnemies();let best=null;for(let x=2;x<98;x+=2)for(let y=2;y<100;y+=2){if(blocked(x,y,.31,room))continue;const d=Math.min(...es.map(e=>Math.hypot(e.x-x,e.y-y)));if(d>16&&(!best||d<best.d))best={x,y,d};}if(best){player.x=best.x;player.y=best.y;}target=null;});
await p.keyboard.press('KeyG');await p.waitForTimeout(300);t=await T();ok('G with no enemy in 12m → 12m 안내',t.some(s=>/12m/.test(s)),t);
await p.evaluate(()=>{const e=liveEnemies()[0];let q=null;for(let rr=4;rr>=1.5&&!q;rr-=.5)for(let j=0;j<16;j++){const a=j*Math.PI/8,v={x:e.x+Math.cos(a)*rr,y:e.y+Math.sin(a)*rr};if(!blocked(v.x,v.y,.31,room)&&clearPath3(v,e,.31,room)){q=v;break;}}player.x=q.x;player.y=q.y;target=e.id;});
await p.keyboard.press('KeyG');await p.waitForTimeout(200);const c1=await p.evaluate(()=>window.__STORYWORLD_DANCES_R74__.inspect('gold').events.filter(e=>e.kind==='cast').length);
await gameWait(p,3);await T();await p.keyboard.press('KeyG');await p.waitForTimeout(300);t=await T();
ok('G near enemy casts (or engine explains space)',c1>=1||t.some(s=>/안전한/.test(s)),{c1,t});
ok('G again while on cooldown → 재사용 대기 N초',t.some(s=>/재사용 대기 · \d+초/.test(s))||c1===0,t);
await p.evaluate(()=>{for(const id in player.goldenCooldownsR74||{})player.goldenCooldownsR74[id]=0;settings.autoSkill=true;auto=true;});await T();await gameWait(p,3);t=await T();ok('auto use failures stay silent (no hint toasts during auto)',!t.some(s=>/12m|습득|장착한|재사용 대기 ·/.test(s)),t);
await p.evaluate(()=>{auto=false;settings.autoSkill=false;});
ok('page errors 0 (story)',p.errors.length===0,p.errors);
const T2=async()=>p2.evaluate(()=>{const t=[...(window.__T||[])];if(window.__T)window.__T.length=0;return t;});
// survival
await b.close();const B2=await boot();const p2=B2.p;await p2.waitForTimeout(2500);await p2.evaluate(async()=>{await window.__STORYWORLD_SURVIVAL_R600__.start('hwando');});await p2.waitForFunction(()=>started&&!loading,null,{timeout:90000});await p2.evaluate(()=>{window.__T=[];const tb=toast;window.toast=toast=function(m,...a){window.__T.push(String(m));return tb.call(this,m,...a);};});await p2.waitForTimeout(800);await skip(p2);await T2();

await p2.evaluate(()=>window.__STORYWORLD_GOLDEN_R72__.manage());await p2.waitForTimeout(200);const mod2=await p2.evaluate(()=>!!modal&&/황금실|은색실/.test(document.querySelector('#panel h2')?.textContent||''));ok('survival manage() via other paths closes',!mod2,mod2);
await p2.waitForTimeout(900);await T2();await p2.keyboard.press('KeyG');await p2.waitForTimeout(300);t=await T2();ok('survival G → 무한생존 안내',t.some(s=>/무한생존/.test(s)),t);
ok('page errors 0 (survival)',p2.errors.length===0,p2.errors);
console.log(JSON.stringify(await p2.evaluate(()=>window.__STORYWORLD_THREAD_CUSTOM_R1016__.inspect())));
console.log(JSON.stringify({pass:out.filter(Boolean).length,fail:out.filter(v=>!v).length}));await B2.b.close();process.exit(out.every(Boolean)?0:1);
