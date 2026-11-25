// R1306 2D 영웅 대기 vs 공격 모션 일관성 캡처(헤드리스, 소프트웨어 렌더, 3D 끔).
//  영웅마다: 오른쪽(e) 기본공격 → 서기 → 왼쪽(w) 기본공격 → 서기 를 게임 시간으로 돌리며,
//  drawHero 가 남긴 영웅 몫 이미지 명령(경로·sourceRect·points·alpha)과 영웅 발 화면 위치(project)를 프레임마다 적는다.
//  STORYWORLD_URL=http://127.0.0.1:4410/m0/ OUT=out/r1306 [HEROES=lauren,neon] node r96/qa/r1306/capture.mjs
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4410/m0/',OUT=process.env.OUT||'out/r1306';fs.mkdirSync(OUT,{recursive:true});
const SEC=+(process.env.SEC||1.4);
const b=await chromium.launch({headless:true});const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r663.skillgrowth','{"on":false}');}catch(_){}});
const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.go('dist01','STORY');const P=window.__STORYWORLD_PROGRESSION_R71__;if(P?.difficultyState?.().open){P.selectDifficulty('normal');await P.confirmDifficulty();}});
await p.waitForFunction(()=>room?.id==='dist01'&&!loading,null,{timeout:180000});await skip();
const heroes=await p.evaluate(()=>Object.keys(HEROES));console.log('heroes',heroes.join(','));
const want=(process.env.HEROES||'').split(',').filter(Boolean);const ALLH=[...heroes,'ego','persona'];const LIST=want.length?ALLH.filter(h=>want.includes(h)):ALLH;
await p.evaluate(()=>{guide=false;auto=false;try{settings.autoSkill=false;}catch(_){}
 const W=window.__r1306={rows:[],on:false,tag:null,pin:null,main:player,seen:new Set()};
 const dh=drawHero;drawHero=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=dh.apply(this,a);
  try{if(st>=0&&W.on&&player===W.main&&!W.seen.has(time)){W.seen.add(time);const q=project(player.x,player.y),imgs=[];
   for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||!c.points)continue;if(c.owner&&c.owner.kind!=='hero')continue;
    const src=String(c.sourcePath||c.image?.src||'').replace(/^.*?(assets\/)/,'$1').split('?')[0];
    imgs.push({tag271:c.r271||null,src,sr:c.sourceRect?c.sourceRect.map(v=>+(+v).toFixed(1)):null,pts:c.points.map(p=>[+p[0].toFixed(1),+p[1].toFixed(1)]),a:+(c.style?.globalAlpha??c.alpha??1),comp:c.style?.globalCompositeOperation||null,filter:c.style?.filter||null});}
   const P=player,act=P.ultimateAnim>0?'ult':P.skillAnim>0?'skill':P.dashAnim>0?'dash':P.hurtAnim>0?'hurt':P.attackAnim>0?'attack':P.moving?'move':'idle';
   let L=null;try{L=window.__STORYWORLD_HWANDO_R271__?.inspect?.().stats.last;}catch(_){}W.rows.push({r271:L,tag:W.tag,hero:P.hero,x:+P.x.toFixed(3),y:+P.y.toFixed(3),act,dir:P.direction,t:+time.toFixed(3),q:[+q.x.toFixed(1),+q.y.toFixed(1)],zoom,imgs});}}catch(e){W.err=String(e);}return r;};drawHero[Symbol.for('storyworld.r1306.drawHero')]=window.__STORYWORLD_HERO_ATTACK_TONE_R1306__?.inspect?.().installed===true;
 {const ok=(x,y)=>{if(typeof blocked==='function'&&blocked(x,y,.5))return false;for(let s=0;s<8;s++){const S=s*Math.PI/4;for(const r of [1.6,3.4])if(blocked(x+Math.cos(S)*r,y+Math.sin(S)*r,.6))return false;}return true;};
  let best=null;for(let r=0;r<30&&!best;r+=.5)for(let a=0;a<6.283&&!best;a+=.3){const x=player.x+Math.cos(a)*r,y=player.y+Math.sin(a)*r;if(ok(x,y))best={x,y};}if(best){player.x=best.x;player.y=best.y;}W.spot=best;}
 (function pin(){const P=W.pin;for(const v of room.enemies){if(P&&v===P.e)continue;if(v.hp>0){v.x=player.x-80;v.y=player.y-80;v.homeX=v.x;v.homeY=v.y;v.speed=0;v.visible=false;}}
  if(P){const e=P.e;e.x=player.x+P.dx;e.y=player.y+P.dy;e.spawnState="active";e.visible=true;e.hp=1e9;e.maxHp=Math.max(e.maxHp||0,1e9);e.speed=0;e.attack=null;}requestAnimationFrame(pin);})();
});
async function step(tag,deg,mode,sec){
 const t0=await p.evaluate(([tag,deg,mode])=>{const W=window.__r1306,P=player;P.hp=maxHP();P.invincible=999;P.attackCD=0;P.moving=false;
  for(let i=0;i<60&&storyScene;i++)advanceScene();if(modal)closePanel(true);
  if(mode==='A'){const S=deg*Math.PI/180,dx=(Math.cos(S)+2*Math.sin(S))/2,dy=(2*Math.sin(S)-Math.cos(S))/2,L=Math.hypot(dx,dy);room.engaged=true;
   const e=room.enemies.find(v=>v.hp>0&&!v.boss)||room.enemies[0];const H0=HEROES[P.hero]||{},mel=H0.melee||H0.type==='blade'||H0.type==='heavy',R0=mel?1.0:3.2;W.pin={e,dx:dx/L*R0,dy:dy/L*R0};
   W.iv=setInterval(()=>{try{basicAttack(false);}catch(_){}},50);}
  else{W.pin=null;room.engaged=false;}
  W.main=player;W.seen=new Set();W.tag=tag;W.on=true;return time;},[tag,deg,mode]);
 await p.waitForFunction((t)=>time>=t,t0+sec,{timeout:300000});
 await p.evaluate(()=>{const W=window.__r1306;clearInterval(W.iv);W.on=false;W.tag=null;});
}
if(process.env.SHOT){const hero=process.env.SHOT;await p.evaluate(r=>{window.__RR=r;},+(process.env.RR||1.6));
 await p.evaluate(async(id0)=>{const form={ego:['hwando','egoSovereignR1046'],persona:['lauren','personaHeroR1113']}[id0],id=form?form[0]:id0;loading=true;try{await ensureImages(heroPaths(id));player.hero=id;player.egoSovereignR1046=id0==='ego';player.personaHeroR1113=id0==='persona';}finally{loading=false;}try{closePanel(true);}catch(_){}},hero);
 for(const [lab,deg,mode] of [['e',0,'A'],['ie',0,'I'],['w',180,'A'],['iw',0,'I']]){
  const t0=await p.evaluate(([deg,mode])=>{const W=window.__r1306,P=player;P.invincible=999;if(mode==='A'){const S=deg*Math.PI/180,dx=(Math.cos(S)+2*Math.sin(S))/2,dy=(2*Math.sin(S)-Math.cos(S))/2,L=Math.hypot(dx,dy);room.engaged=true;const e=room.enemies.find(v=>v.hp>0&&!v.boss);const RR=+(window.__RR||1.6);W.pin={e,dx:dx/L*RR,dy:dy/L*RR};W.iv=setInterval(()=>{try{const a0=player.attackAnim,x0=player.x,y0=player.y;basicAttack(false);if(player.attackAnim>a0+1e-6){const q=project(player.x,player.y);let best=null,bd=4;for(const v of room.enemies){if(!(v.hp>0)||v.visible===false||v.spawnState==='hidden')continue;const d=Math.hypot(v.x-player.x,v.y-player.y);if(d<bd){bd=d;best=v;}}const b=best?project(best.x,best.y):null;(W.dbg=W.dbg||[]).push([+time.toFixed(2),best===W.pin.e,b?Math.round(b.x-q.x):null,+(player.x-x0).toFixed(2),+(player.y-y0).toFixed(2)]);}}catch(_){}},50);}else{W.pin=null;}return time;},[deg,mode]);
  for(let k=0;k<4;k++){await p.waitForFunction((t)=>time>=t,t0+0.25+k*0.22,{timeout:300000});const q=await p.evaluate(()=>{const q=project(player.x,player.y),c=document.querySelector('canvas'),r=c.getBoundingClientRect(),k=r.width/(typeof W==='number'?W:c.width),k2=r.height/(typeof H==='number'?H:c.height);return {x:r.left+q.x*k,y:r.top+(q.y-30)*k2};});
   if(process.env.DBG)console.log(lab,k,await p.evaluate(()=>{const e=window.__r1306.pin?.e,q=project(player.x,player.y),b=e?project(e.x,e.y):null;let I=null;try{I=window.__STORYWORLD_HWANDO_R271__?.inspect?.();}catch(x){I=String(x);}let PI=null;try{PI=window.__STORYWORLD_PERSONA_HERO_R1113__?.inspect?.();}catch(x){}return JSON.stringify({pf:player.personaHeroR1113,pform:PI&&{form:PI.form,unlocked:PI.unlocked,stats:PI.stats},dir:player.direction,ev:b?[b.x-q.x,b.y-q.y]:null,last:I?.last||I?.stats?.last,near:room.enemies.filter(v=>v.hp>0&&Math.hypot(v.x-player.x,v.y-player.y)<4).length,P277:window.__STORYWORLD_HWANDO_R277__?.inspect?.()?.lastH});}));await p.screenshot({path:`${OUT}/shot-${hero}-${lab}-${k}.png`,clip:{x:Math.max(0,q.x-70),y:Math.max(0,q.y-45),width:140,height:90}});}
  await p.evaluate(()=>{clearInterval(window.__r1306.iv);});if(process.env.DBG)console.log('swings',lab,await p.evaluate(()=>{const d=JSON.stringify(window.__r1306.dbg);window.__r1306.dbg=[];return d;}));}
 await b.close();process.exit(0);}
for(const hero of LIST){
 const sw=await p.evaluate(async(id0)=>{const form={ego:['hwando','egoSovereignR1046'],persona:['lauren','personaHeroR1113']}[id0],id=form?form[0]:id0;loading=true;try{await ensureImages(heroPaths(id));player.hero=id;player.egoSovereignR1046=id0==='ego';player.personaHeroR1113=id0==='persona';player.combo=0;player.ego=0;player.samong=0;player.shield=0;player.direction='front';}finally{loading=false;}try{closePanel(true);refreshIcons();}catch(_){}return player.hero;},hero);
 console.log('switch',hero,sw);
 // 따뜻하게: 한 번 돌리고 버림
 await step(`${hero}|warm|A:e`,0,'A',0.8);await step(`${hero}|warm|A:w`,180,'A',0.8);
 await p.evaluate(()=>{window.__r1306.rows=[];});
 await step(`${hero}|idle0`,0,'I',0.8);
 await step(`${hero}|A:e`,0,'A',SEC);
 await step(`${hero}|idleE`,0,'I',1.2);
 await step(`${hero}|A:w`,180,'A',SEC);
 await step(`${hero}|idleW`,0,'I',1.2);
 const rows=await p.evaluate(()=>{const W=window.__r1306,r=W.rows;W.rows=[];return r;});
 fs.writeFileSync(`${OUT}/rows-${hero}.json`,JSON.stringify(rows));
 const acts={};for(const r of rows){const k=r.tag.split('|')[1]+'|'+r.act;acts[k]=(acts[k]||0)+1;}
 console.log('HERO',hero,rows.length,JSON.stringify(acts));
}
console.log('errors',JSON.stringify(errors.slice(0,5)));
await b.close();
