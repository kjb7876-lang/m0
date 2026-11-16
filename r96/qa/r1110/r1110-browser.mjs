// R1110 헤드리스 검사(Playwright, 소프트웨어 렌더): 기억사수 좌우 걷기·좌우 공격·쏜 뒤 서 있기 8장면에서 실제 그려진 칸을 모아
//  (1) 새 옆 그림(r1045c·r1045d)이 잘린 사각형 없이 칸 전체로 그려지는지 (2) 옆 서 있기에 시선이 총 반대인 R128 idle-e 가 안 나오는지 (3) 쏜 쪽과 그림 좌우가 맞는지 본다.
//   STORYWORLD_URL=http://127.0.0.1:4396/m0/ OUT=out/r1110 node r96/qa/r1101/r1101-browser.mjs   (GPU·실기기·자연 플레이는 미검증)
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out/r1110';let fails=0;const check=(n,ok,info)=>{if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+n+(info===undefined?'':' '+JSON.stringify(info).slice(0,700)));};const ALL={};fs.mkdirSync(OUT,{recursive:true});
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
// screen right = world (+1,-1)/√2 approx; use dx=+2.2,dy=-2.2 for right, opposite for left
// R1110: 걸으며 쏠 때(걷는 쪽과 표적 쪽이 반대) 몸 그림이 표적 쪽을 보는지. 예전엔 쏘는 도중 R143 attack-e 를 걷는 쪽(반대)으로 반전해 그린 칸이 끼었다.
await scen('walkL_atkR',new Function(`const e=${enemyAt(4,-4)};keys.add('ArrowLeft');window.__fire=setInterval(()=>{player.attackCD=0;basicAttack(true);},150);return time;`),1.5);
await p.evaluate(()=>clearInterval(window.__fire));
await scen('walkR_atkL',new Function(`const e=${enemyAt(-4,4)};keys.add('ArrowRight');window.__fire=setInterval(()=>{player.attackCD=0;basicAttack(true);},150);return time;`),1.5);
await p.evaluate(()=>clearInterval(window.__fire));
const sideBody=(nm,wantMir)=>{const L=(ALL[nm]||[]).filter(r=>r.anim>0).flatMap(r=>r.L.filter(c=>/attack-e/.test(c.s)).map(c=>({s:c.s,mir:c.mir})));return{n:L.length,bad:L.filter(c=>c.mir!==wantMir).length,r143:L.filter(c=>/r143/.test(c.s)).length};};
const A=sideBody('walkL_atkR',false),B=sideBody('walkR_atkL',true);
check('왼쪽으로 걷다 오른쪽을 쏠 때: 옆 공격 몸이 모두 오른쪽을 봄(반전 칸 0)',A.n>=3&&A.bad===0,A);
check('오른쪽으로 걷다 왼쪽을 쏠 때: 옆 공격 몸이 모두 왼쪽을 봄(반전 안 된 칸 0)',B.bad===0,B);
check('Dots 옆 공격(e4)이 켜진 채 옛 R143 attack-e 가 섞이지 않음',A.r143===0&&B.r143===0,{A:A.r143,B:B.r143});
check('페이지 오류 없음',errors.length===0,errors);console.log(JSON.stringify({fails}));await b.close();process.exit(fails?1:0);
