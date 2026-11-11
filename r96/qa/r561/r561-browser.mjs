// R561 headless browser check (Playwright, real key events) on a built site — 기억사수 Q·W·E·R 총기 스킬.
//   STORYWORLD_URL=http://127.0.0.1:4396/m0/ OUT=out/r561 node r96/qa/r561/r561-browser.mjs
// 헤드리스(소프트웨어 렌더): 입력→판정→그리기 호출과 화면 캡처만 본다. GPU·실기기·자연 플레이 체감은 미검증.
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out/r561';fs.mkdirSync(OUT,{recursive:true});
let fails=0;const check=(n,ok,info)=>{if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+n+(info===undefined?'':' '+JSON.stringify(info).slice(0,700)));};
const b=await chromium.launch({headless:true});const ctx=await b.newContext({viewport:{width:960,height:540}});
await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));}catch(_){}});
const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.go('dist01','STORY');const P=window.__STORYWORLD_PROGRESSION_R71__;if(P?.difficultyState?.().open){P.selectDifficulty('normal');await P.confirmDifficulty();}});await p.waitForFunction(()=>room?.id==='dist01'&&!loading,null,{timeout:180000});await p.waitForTimeout(800);await skip();
await p.evaluate(async()=>{window.__STORYWORLD_GUNNER_ARMS_R561__.set({chain:false});guide=false;auto=false;settings.autoSkill=false;loading=true;try{await ensureImages(heroPaths('gunner'));player.hero='gunner';player.combo=0;player.ego=0;}finally{loading=false;}updateHUD();
 window.__r561hits=[];const hb=hitEnemy;hitEnemy=function(e,v,s){const r=hb.apply(this,arguments);try{window.__r561hits.push({id:e?.id,v:+(+v).toFixed(1),ab:s?.ability||s?.kind||'basic',slot:s?.sourceSlot||null});}catch(_){}return r;};});
const info=await p.evaluate(()=>({room:room.id,hero:player.hero,on:window.__STORYWORLD_GUNNER_ARMS_R561__?.on(),qName:HEROES.gunner.special,qLabel:document.getElementById('specialLabel')?.textContent,
 btn:['w','e','r'].map(s=>{const el=document.getElementById('story-wer-'+s);return el?{hidden:el.hidden||el.style.display==='none',label:el.querySelector('.label')?.textContent,title:el.title}:null;})}));
check('R561 on for gunner; Q name and W/E/R buttons renamed and visible',info.on&&info.qName==='회상 광선포'&&info.btn.every(x=>x&&!x.hidden)&&info.btn.map(x=>x.label).join()==='저격,연사,폭격',info);
// 적 배치: 영웅 오른쪽 줄 3마리 + 무리 3마리
async function stage(){return p.evaluate(()=>{const P=player,rows=room.enemies.filter(e=>e.hp>0&&!e.boss).slice(0,6);room.engaged=true;
 const spots=[[2.2,0],[3.6,.2],[5,-.2],[4.5,2.4],[5.2,2.9],[5.6,2.1]];rows.forEach((e,i)=>{const s=spots[i];e.x=P.x+s[0];e.y=P.y+s[1];e.spawnState='active';e.visible=true;e.hp=Math.max(e.hp,1e6);e.speed0561??=e.speed;e.speed=0;e.cd=99;});
 for(const e of room.enemies)if(!rows.includes(e)&&e.hp>0){e.x=P.x-30;e.y=P.y-30;}player.hp=maxHP();player.invincible=999;return rows.length;});}
const n=await stage();check('staged enemies near the hero',n>=4,n);
const gameWait=async s=>{const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>=t,t0+s,{timeout:180000});};
async function shot(name,key,delays){await stage();await p.evaluate(()=>{window.__r561hits.length=0;player.specialCD=0;});await p.keyboard.press(key);
 for(const [d,tag] of delays){await gameWait(d);await p.screenshot({path:`${OUT}/${name}-${tag}.jpg`,quality:78});}
 await gameWait(1.2);return p.evaluate(()=>window.__r561hits.slice());}
const q=await shot('q-beam','q',[[.35,'a'],[.3,'b']]);
check('Q key: 회상 광선포 beam ticks hit several enemies on the line',q.filter(h=>h.ab==='gunnerBeamR561').length>=5&&new Set(q.filter(h=>h.ab==='gunnerBeamR561').map(h=>h.id)).size>=2,q.slice(0,12));
const w=await shot('w-snipe','w',[[.2,'aim'],[.2,'fire']]);
check('W key: 망각 저격 lands (and the engine 상태 정화 slot does not fire)',w.some(h=>h.ab==='gunnerSnipeR561')&&!w.some(h=>h.slot==='w'),w);
const e=await shot('e-rifle','e',[[.25,'a'],[.3,'b']]);
check('E key: 잔향 연사 fires 8 rounds',e.filter(h=>h.ab==='gunnerRifleR561').length===8&&!e.some(h=>h.slot==='e'),e.length);
const r=await shot('r-strike','r',[[.8,'mark'],[.9,'boom'],[.4,'smoke']]);
check('R key: 기억 소거 폭격 hits the group after the warning; engine 시간 지연포 does not fire',r.filter(h=>h.ab==='gunnerStrikeR561').length>=2&&!r.some(h=>h.slot==='r'),r);
// 연계 + 프레임 시간(헤드리스 소프트웨어 렌더 기준 상대 비교)
const frames=s=>p.evaluate(s=>new Promise(res=>{const d=[];let last=performance.now();const t0=last;(function f(){const n=performance.now();d.push(n-last);last=n;if(n-t0<s*1000)requestAnimationFrame(f);else{d.sort((a,b)=>a-b);res({n:d.length,avg:+(d.reduce((a,b)=>a+b,0)/d.length).toFixed(1),p95:+d[Math.floor(d.length*.95)].toFixed(1)});}})();}),s);
await stage();await p.evaluate(()=>{for(const e of room.enemies)e.hp=Math.max(e.hp,99999);});const idle=await frames(4);
await p.evaluate(()=>{window.__STORYWORLD_GUNNER_ARMS_R561__.set({chain:true});player.specialCD=0;window.__r561hits.length=0;});
await new Promise(r=>setTimeout(r,200));
// readyAt 초기화를 위해 시간 진행 후 누름
await gameWait(17);await stage();await p.evaluate(()=>{player.specialCD=0;window.__r561hits.length=0;for(const e of room.enemies)e.hp=Math.max(e.hp,99999);});
const busyP=frames(4);await p.keyboard.press('r');await gameWait(.4);await p.screenshot({path:`${OUT}/chain-r-a.jpg`,quality:78});const busyF=await busyP;
await gameWait(2.5);await p.screenshot({path:`${OUT}/chain-r-b.jpg`,quality:78});
const ch=await p.evaluate(()=>({I:window.__STORYWORLD_GUNNER_ARMS_R561__.inspect(),abs:[...new Set(window.__r561hits.map(h=>h.ab))]}));
check('chain: one R press → 폭격 + 연사 + 저격 follow by themselves, no overlap, effect cap kept',ch.I.chain.links>=2&&ch.I.chain.overlap===0&&ch.I.peakFx<=ch.I.cap&&['gunnerStrikeR561','gunnerRifleR561','gunnerSnipeR561'].every(a=>ch.abs.includes(a)),ch);
check('frame time during a chain stays within 1.5× idle (headless software render)',busyF.avg<=idle.avg*1.5,{idle,busy:busyF});
console.log('FRAMES '+JSON.stringify({idle,busy:busyF}));
const st=await p.evaluate(()=>window.__STORYWORLD_GUNNER_ARMS_R561__.inspect());
check('R561 drew effects and had no errors',st.stats.drawn>0&&st.stats.errors===0,st);
const sv=await p.evaluate(()=>{const d=serializeSave();return d?.storyWER?.remaining||{};});
check('save has no far cooldowns for gunner slots',!Object.entries(sv).some(([k,v])=>k.startsWith('gunner:')&&v>1e5),sv);
check('no page errors',errors.length===0,errors);
console.log(JSON.stringify({fails}));await b.close();process.exitCode=fails?1:0;
