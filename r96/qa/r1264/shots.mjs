// R1264 전후 그림(헤드리스): 기억사수로 바꾸고 그림 기억을 비운 뒤 스킬 W(오른쪽 적)·Q(위쪽 적)를 쓴 순간 영웅 둘레를 찍는다.
//  STORYWORLD_URL=... OUT=dir TAG=before node r96/qa/r1264/shots.mjs
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out/r1264',TAG=process.env.TAG||'x';fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:2});
await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r663.skillgrowth','{"on":false}');}catch(_){}});
const p=await ctx.newPage();
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.go('dist01','STORY');const P=window.__STORYWORLD_PROGRESSION_R71__;if(P?.difficultyState?.().open){P.selectDifficulty('normal');await P.confirmDifficulty();}});
await p.waitForFunction(()=>room?.id==='dist01'&&!loading,null,{timeout:180000});await skip();
await p.evaluate(async()=>{guide=false;auto=false;try{settings.autoSkill=false;}catch(_){}loading=true;try{await ensureImages(heroPaths('gunner'));player.hero='gunner';}finally{loading=false;}
 const ok=(x,y)=>{for(let s=0;s<8;s++){const S=s*Math.PI/4;for(const r of [0,1.6,3.4])if(blocked(x+Math.cos(S)*r,y+Math.sin(S)*r,.6))return false;}return true;};
 let best=null;for(let r=0;r<30&&!best;r+=.5)for(let a=0;a<6.283&&!best;a+=.3){const x=player.x+Math.cos(a)*r,y=player.y+Math.sin(a)*r;if(ok(x,y))best={x,y};}if(best){player.x=best.x;player.y=best.y;}
 window.__pin=null;(function pin(){const P=window.__pin;if(P){const e=P.e;e.x=player.x+P.dx;e.y=player.y+P.dy;e.spawnState='active';e.visible=true;e.hp=1e7;e.speed=0;e.attack=null;for(const v of room.enemies)if(v!==e&&v.hp>0){v.x=player.x-60;v.y=player.y-60;v.speed=0;}}requestAnimationFrame(pin);})();
 releaseImageMemory();});
for(const [k,deg] of [['w',0],['q',-90],['e',180]]){
 const t0=await p.evaluate(([deg])=>{const S=deg*Math.PI/180,dx=(Math.cos(S)+2*Math.sin(S))/2,dy=(2*Math.sin(S)-Math.cos(S))/2,L=Math.hypot(dx,dy),e=room.enemies.find(v=>v.hp>0&&!v.boss);window.__pin={e,dx:dx/L*3.2,dy:dy/L*3.2};
  player.hp=maxHP();player.invincible=999;player.specialCD=0;room.engaged=true;try{for(const s of ['w','e','r'])window.__STORYWORLD_GUNNER_ARMS_R561__?.scaleRemain?.(s,1e-6);}catch(_){}return time;},[deg]);
 await p.waitForFunction(t=>time>=t+.4,t0);await p.keyboard.press(k);const t1=await p.evaluate(()=>time);await p.waitForFunction(t=>time>=t+.12,t1);
 const q=await p.evaluate(()=>{const o=project(player.x,player.y);return{x:o.x,y:o.y,src:(()=>{let best=null,bh=0;for(const c of ctx.commands||[]){if(c.kind!=='image'||!c.points||c.owner?.kind!=='hero')continue;const h=Math.abs(c.points[3][1]-c.points[0][1]);if(h>bh){bh=h;best=c;}}return best?String(best.sourcePath):null;})()};});
 await p.screenshot({path:`${OUT}/${TAG}-${k}.png`,clip:{x:330,y:130,width:300,height:240}});console.log(TAG,k,q.src);
 await p.waitForFunction(t=>time>=t+1.2,t1);}
await b.close();
