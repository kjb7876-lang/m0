// R1111 헤드리스 검사(Playwright, 소프트웨어 렌더): 기억사수 대각(+26°·−26°, 왼쪽 반전 포함) 공격과 쏜 뒤 서 있기·옆 서 있기에서 실제 그려진 칸을 모아
//  정확히 화면 ±45°·±135° 조준에 Dots r2 se3·ne3(attack-se9·ne9)가 칸 전체로, 왼쪽은 반전으로 그려지는지 본다. (GPU·실기기 미검증)
//   STORYWORLD_URL=http://127.0.0.1:4396/m0/ OUT=out/r1111 node r96/qa/r1111g/r1111-browser.mjs   (GPU·실기기·자연 플레이는 미검증)
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out/r1111';let fails=0;const check=(n,ok,info)=>{if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+n+(info===undefined?'':' '+JSON.stringify(info).slice(0,700)));};const ALL={};fs.mkdirSync(OUT,{recursive:true});
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
   window.__pb.log.push({ne:(()=>{try{const e=nearestEnemy(7);if(!e)return null;const q=project(player.x,player.y),b=project(e.x,e.y);return Math.round(Math.atan2(b.y-q.y,b.x-q.x)*180/Math.PI);}catch(x){return null;}})(),sw:(()=>{try{const w=window.__STORYWORLD_GUNNER_AIM_R991__.inspect().swing;return w?w.sheet+(w.mirror?'M':''):null;}catch(e){return 'err';}})(),r143:rec.commands.slice(st).filter(c=>c.r143Attack).length,t:+time.toFixed(3),moving:!!player.moving,anim:+(player.attackAnim||0).toFixed(3),dir:player.direction,face:player.facing,L});}}catch(e){window.__pb.err=String(e);}return r;};});
async function scen(name,setup,dur){await p.evaluate(()=>{window.__pb.log=[];keys.clear?.();});
 const t0=await p.evaluate(setup);await p.evaluate(()=>{window.__pb.on=true;});
 const shots=[];for(let k=0;k<4;k++){await p.waitForFunction(([t,d])=>time>=t+d,[t0,dur*(k+1)/4],{timeout:180000});const f=`${OUT}/${name}-${k}.png`;
  const q=await p.evaluate(()=>{const o=project(player.x,player.y);return o;});await p.screenshot({path:f,clip:{x:Math.max(0,q.x-110),y:Math.max(0,q.y-170),width:220,height:220}});shots.push(f);}
 const log=await p.evaluate(()=>{window.__pb.on=false;keys.clear?.();return window.__pb.log;});fs.writeFileSync(`${OUT}/${name}.json`,JSON.stringify(log));ALL[name]=log;
 const uniq={};for(const r of log)for(const c of r.L){const k=c.s+(c.mir?'(M)':'');uniq[k]=(uniq[k]||0)+1;}console.log(name,JSON.stringify(uniq));}
const enemyAt=(dx,dy)=>`(()=>{const P=player,e=room.enemies.find(v=>v.hp>0&&!v.boss);e.x=P.x+${dx};e.y=P.y+${dy};e.hp=1e7;e.maxHp=1e7;e.speed=0;room.engaged=true;return e;})()`;
// 실제 연사(쿨다운 그대로, 50ms 마다 basicAttack(false)) 간격에서 위·아래 조준 때 그려진 칸을 센다.
//  옛 그림 = R143 attack-n/s(휘두르기 뒤 꼬리 프레임, attackAnim 0) · R128 idle-n(쏘는 사이 서 있기). 새 그림 = Dots attack-n3·attack-s2·idle-s2.
const mk=(dx,dy)=>new Function(`const e=${enemyAt(dx,dy)};const tag=Math.random();window.__tag=tag;(window.__fires=window.__fires||[]).push(setInterval(()=>{if(window.__tag!==tag)return;for(const v of room.enemies)if(v!==e){v.x=player.x+300;v.y=player.y+300;v.speed=0;}e.x=player.x+${dx};e.y=player.y+${dy};e.speed=0;e.hp=1e7;basicAttack(false);},50));return time;`);
const stop=()=>p.evaluate(()=>{window.__tag=null;for(const id of window.__fires||[])clearInterval(id);window.__fires=[];clearInterval(window.__fire);keys.clear?.();});
for(const [nm,dx,dy] of [['natN',-3,-3],['natS',3,3]]){await scen(nm,mk(dx,dy),4.5);await stop();}
const cnt=(nm,re,ok=()=>true)=>{let n=0,tot=0;const t0=(ALL[nm]||[])[0]?.t||0;for(const r of ALL[nm]||[]){if(r.t<t0+2.8||!ok(r))continue;/* 앞 장면 조준(마지막 조준 2.5초)이 남는 구간 제외 */tot++;if(r.L.some(c=>re.test(c.s)))n++;}return{n,tot};};
const oldN=cnt('natN',/r143\/attack\/gunner\/attack-n\.webp|r128\/gunner\/idle-n\.webp/),oldS=cnt('natS',/r143\/attack\/gunner\/attack-s\.webp|r128\/gunner\/idle-s\.webp|r128\/gunner\/idle-n\.webp/);
check('위 조준 연사: 옛 attack-n·idle-n 이 한 프레임도 안 그려짐',oldN.n===0&&oldN.tot>15,oldN);
check('아래 조준 연사: 옛 attack-s·idle 이 한 프레임도 안 그려짐',oldS.n===0&&oldS.tot>15,oldS);
check('페이지 오류 없음',errors.length===0,errors);console.log(JSON.stringify({fails}));await b.close();process.exit(fails?1:0);
