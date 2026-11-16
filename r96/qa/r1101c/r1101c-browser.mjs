// R1101c 헤드리스 검사(Playwright, 소프트웨어 렌더): 기억사수 대각(+26°·−26°, 왼쪽 반전 포함) 공격과 쏜 뒤 서 있기·옆 서 있기에서 실제 그려진 칸을 모아
//  정확히 화면 ±45°·±135° 조준에 Dots r2 se3·ne3(attack-se9·ne9)가 칸 전체로, 왼쪽은 반전으로 그려지는지 본다. (GPU·실기기 미검증)
//   STORYWORLD_URL=http://127.0.0.1:4396/m0/ OUT=out/r1101c node r96/qa/r1101c/r1101c-browser.mjs   (GPU·실기기·자연 플레이는 미검증)
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out/r1101c';let fails=0;const check=(n,ok,info)=>{if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+n+(info===undefined?'':' '+JSON.stringify(info).slice(0,700)));};const ALL={};fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch({headless:true});const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:2});
await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));}catch(_){}});
const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.go('dist01','STORY');const P=window.__STORYWORLD_PROGRESSION_R71__;if(P?.difficultyState?.().open){P.selectDifficulty('normal');await P.confirmDifficulty();}});
await p.waitForFunction(()=>room?.id==='dist01'&&!loading,null,{timeout:180000});await skip();
await p.evaluate(async()=>{guide=false;auto=false;settings.autoSkill=false;loading=true;try{await ensureImages(heroPaths('gunner'));player.hero='gunner';}finally{loading=false;}updateHUD();
 for(const v of room.enemies){v.x=player.x+80;v.y=player.y+80;v.speed=0;}room.engaged=false;player.invincible=999;
 window.__pb={log:[],on:false};const dh=drawHero;drawHero=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=dh.apply(this,a);
  try{if(st>=0&&window.__pb.on){const L=[];for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||!c.points)continue;const s=String(c.sourcePath||c.image?.src||'').replace(/^.*?(assets\/)/,'$1');if(!/gunner|hero/.test(s)&&c.owner?.kind!=='hero')continue;
   const P=c.points;L.push({s,sr:c.sourceRect,mir:P[1][0]<P[0][0],w:Math.abs(P[1][0]-P[0][0]),h:Math.abs(P[3][1]-P[0][1]),x:P[0][0],y:P[0][1],own:c.owner?.kind,alpha:c.alpha});}
   window.__pb.log.push({t:+time.toFixed(3),moving:!!player.moving,anim:+(player.attackAnim||0).toFixed(3),dir:player.direction,face:player.facing,L});}}catch(e){window.__pb.err=String(e);}return r;};});
async function scen(name,setup,dur){await p.evaluate(()=>{window.__pb.log=[];keys.clear?.();});
 const t0=await p.evaluate(setup);await p.evaluate(()=>{window.__pb.on=true;});
 const shots=[];for(let k=0;k<4;k++){await p.waitForFunction(([t,d])=>time>=t+d,[t0,dur*(k+1)/4],{timeout:180000});const f=`${OUT}/${name}-${k}.png`;
  const q=await p.evaluate(()=>{const o=project(player.x,player.y);return o;});await p.screenshot({path:f,clip:{x:Math.max(0,q.x-110),y:Math.max(0,q.y-170),width:220,height:220}});shots.push(f);}
 const log=await p.evaluate(()=>{window.__pb.on=false;keys.clear?.();return window.__pb.log;});fs.writeFileSync(`${OUT}/${name}.json`,JSON.stringify(log));ALL[name]=log;
 const uniq={};for(const r of log)for(const c of r.L){const k=c.s+(c.mir?'(M)':'');uniq[k]=(uniq[k]||0)+1;}console.log(name,JSON.stringify(uniq));}
const enemyAt=(dx,dy)=>`(()=>{const P=player,e=room.enemies.find(v=>v.hp>0&&!v.boss);e.x=P.x+${dx};e.y=P.y+${dy};e.hp=1e7;e.maxHp=1e7;e.speed=0;room.engaged=true;return e;})()`;
// 세계 (x,y) → 화면 45°: SE (3,1), NE (-1,-3), SW (1,3), NW (-3,-1)
const fire=(dx,dy)=>new Function(`const e=${enemyAt(dx,dy)};player.attackCD=0;window.__fire=setInterval(()=>{e.x=player.x+${dx};e.y=player.y+${dy};e.speed=0;player.attackCD=0;basicAttack(true);},120);return time;`); // 적을 매번 같은 상대 자리에 다시 놓아 조준 각을 고정
const stop=()=>p.evaluate(()=>clearInterval(window.__fire));
const want={SE:['attack-se9',false,3,1],NE:['attack-ne9',false,-1,-3],SW:['attack-se9',true,1,3],NW:['attack-ne9',true,-3,-1]};
for(const [k,[f,mir,dx,dy]] of Object.entries(want)){await scen('atk'+k,fire(dx,dy),1.0);await stop();}
for(const [k,[f,mir]] of Object.entries(want)){const A0=(ALL['atk'+k]||[]),t0=A0.length?A0[0].t:0;/* 장면 첫 .4초는 앞 장면의 조준이 남아 있어 제외 */const L=A0.filter(r=>r.anim>0&&r.t>t0+.4).flatMap(r=>r.L.filter(c=>/r1101[bc]\/gunner\/attack-/.test(c.s)));
 check('정 대각 '+k+' 조준: '+f+(mir?'(반전)':'')+' 칸 전체로',L.length>0&&L.every(c=>c.s.endsWith(f+'.webp')&&c.mir===mir&&c.sr&&c.sr[0]%192===0&&c.sr[2]===192&&c.sr[3]===256),{n:L.length,s:[...new Set(L.map(c=>c.s.split('/').pop()+(c.mir?'M':'')))]});}
check('페이지 오류 없음',errors.length===0,errors);console.log(JSON.stringify({fails}));await b.close();process.exit(fails?1:0);
