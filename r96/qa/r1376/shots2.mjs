// R1375·R1376 심사용 장면(헤드리스 소프트웨어 렌더, 그래픽 검증 아님). 960×540·DSF 2, 찍기 직전 tick 배율 1e-4 로 고정, 탄·장판 비움.
//  node shots2.mjs <on|off> <outdir>   on: R1376 켬 / off: R1376 끔(고치기 전)
import {createRequire} from 'node:module';const {chromium}=createRequire(import.meta.url)('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const MODE=process.argv[2]||'on',OUT=process.argv[3]||'.';const fs=await import('node:fs');fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:2});
await ctx.addInitScript(([off])=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r790.npc','{"on":false}');if(off)localStorage.setItem('storyworld.r1376.cultConsist','0');},[MODE==='off']);
const p=await ctx.newPage();await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
await p.evaluate(()=>{if(room?.id!=='cult04')enterRegion('cult04',null,{layer:'STORY',restore:true});});await p.waitForFunction(()=>!loading&&room?.id==='cult04',null,{timeout:150000});await skip();
await p.evaluate(()=>{window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};
 window.__clean=()=>{try{projectiles=projectiles.filter(b=>b.friendly&&false);}catch(_){}try{hazards=[];}catch(_){}try{delayed=[];}catch(_){}};
 window.__st=n=>{for(let i=0;i<n;i++){for(let j=0;j<60&&storyScene;j++)advanceScene();if(modal&&!storyScene)try{closePanel(true)}catch(_){}tick(.05);}};
 for(let k=0;k<200&&storyScene;k++)advanceScene();if(modal)closePanel(true);
 room.enemies=room.enemies.filter(e=>!Number.isInteger(e.fieldWaveIndex6)&&e.boss&&!e.midboss);room.minionKills=3;room.encounterStage='bossReady';room.engaged=false;
 player.invincible=1e9;player.hp=9e8;auto=false;guide=false;player.x=room.objective.x+.6;player.y=room.objective.y+.6;interact();window.__st(60);});
const shot=async(name,q,w=420,h=360)=>{await p.evaluate(()=>{window.__clean();window.__SLOW=1e-4;});await p.waitForTimeout(500);
 await p.screenshot({path:`${OUT}/${name}.png`,clip:{x:Math.max(0,Math.min(960-w,q.x-w/2)),y:Math.max(0,Math.min(540-h,q.y-h*.62)),width:w,height:h}});await p.evaluate(()=>{window.__SLOW=1;});};
let i=0;
for(const r of [.9,.65,.4,.2])for(const side of ['L','R'])for(const ph of ['idle','atk']){
 const q=await p.evaluate(([r,side,ph])=>{const e=room.enemies.find(e=>e.nativeId==='c104-boss'&&e.hp>0);if(!e)return null;
  const put=()=>{const d=side==='R'?1:-1;player.x=e.x+1.5*d;player.y=e.y-1.5*d;player.hp=9e8;};
  e.hp=e.maxHp*r;e.attack=null;e.rangedWindup=0;e.r61Action=null;e.cd=99;put();window.__clean();window.__st(12);e.hp=e.maxHp*r;
  if(ph==='atk'){let ok=false;for(let k=0;k<400;k++){e.hp=e.maxHp*r;put();if(!e.attack&&!(e.rangedWindup>0))e.cd=0;window.__st(1);window.__clean();const a=e.attack,c=e.r61Action;if(a&&Number.isFinite(a.elapsed)){const sh=a.shape154||e.combatProfile?.attackShape,w=a.castWindup150??sh?.windup??.4;if(a.elapsed>=w+.02){ok=true;break;}}else if(c&&!c.cancelled&&time>=c.releaseAt&&time<c.releaseAt+.25){ok=true;break;}else if(e.storyAttackState5&&time>=e.storyAttackStart5&&time<e.storyAttackUntil5){ok=true;break;}else if(e.rangedWindup>0&&k>60){ok=true;break;}}if(!ok)return {miss:true};}
  else{e.cd=99;put();window.__st(4);}
  try{draw();}catch(_){}const s=project(e.x,e.y);return {x:s.x,y:s.y,atk:!!e.attack};},[r,side,ph]);
 if(!q||q.miss){console.log('miss',r,side,ph);continue;}
 await shot(`${MODE}-c104-${String(i++).padStart(2,'0')}-${Math.round(r*100)}-hero${side}-${ph}`,q);}
// R1375: 지배 연결 대수문장 6마리 동시(on 에서만 의미)
if(MODE==='on'){const q=await p.evaluate(()=>{room.enemies=room.enemies.filter(e=>!e.boss&&!e.midboss&&!e.cosmic&&!Number.isInteger(e.fieldWaveIndex6));room.finalStage=2;player.finalAwakening=true;room.cosmicIndex=0;room.engaged=false;room.finalizing=false;room.encounterStage='cosmicReady';
  player.x=room.objective.x+.6;player.y=room.objective.y+.6;interact();window.__st(40);for(const e of room.enemies)if(e.cosmic){e.cd=99;e.attack=null;}window.__st(6);player.x=room.objective.x+.4;player.y=room.objective.y+1.4;window.__st(2);
  const o=room.objective,s=project(o.x,o.y);return {x:s.x,y:s.y+60,n:room.enemies.filter(e=>e.cosmic&&e.hp>0).length};});
 console.log('cosmic',q.n);await shot('on-r1375-cosmic-six',q,960,540);}
await b.close();
