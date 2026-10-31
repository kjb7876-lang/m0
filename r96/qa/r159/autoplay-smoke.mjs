// R159 자동 플레이 점검(Anthropic 공식 스킬 anthropics/skills 의 webapp-testing 방식 — Apache-2.0: 서버를 띄우고,
//  화면이 다 뜰 때까지 기다린 뒤, 콘솔 오류·응답 404·화면을 모은다). 사람 대신 지역을 차례로 들어가 길잡이·반자동으로 몇 초씩 플레이하며
//  페이지 오류, 404, 콘솔 오류, 멈춤(거의 움직이지 않음)을 기록하고 지역마다 스크린샷을 남긴다. 게임 코드·저장은 바꾸지 않는다.
// 사용: (로컬) python3 -m http.server 4396 를 site 의 상위 폴더에서 띄운 뒤
//   node r96/qa/r159/autoplay-smoke.mjs --url http://127.0.0.1:4396/m0/ --hero lauren --zones dist00,ep1a08 --sec 8 --out /tmp/smoke
//   (공개 사이트) --url https://kjb7876-lang.github.io/m0/   ·  --zones all 이면 모든 지역.
// 끝나면 <out>/report.json 과 <out>/<지역>.png. 오류가 하나라도 있으면 종료 코드 1.
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';
const req=createRequire(import.meta.url);let pw;try{pw=req('playwright');}catch(_){pw=req('/opt/node22/lib/node_modules/playwright');}
const arg=(k,d)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:d;};
const URL=arg('url','http://127.0.0.1:4396/m0/'),HERO=arg('hero','lauren'),SEC=+arg('sec','8'),OUT=arg('out','autoplay-smoke'),ZONES=arg('zones','dist00,ep1a08,cult03');
fs.mkdirSync(OUT,{recursive:true});
const b=await pw.chromium.launch({headless:true});const p=await b.newPage({viewport:{width:960,height:600}});
const log=[];let cur='boot';
p.on('pageerror',e=>log.push({zone:cur,kind:'pageerror',msg:e.message}));
p.on('response',r=>{if(r.status()>=400)log.push({zone:cur,kind:'http'+r.status(),msg:r.url().replace(/.*\/m0\//,'')});});
p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))log.push({zone:cur,kind:'console',msg:m.text().slice(0,240)});});
await p.goto(URL);await p.waitForLoadState('networkidle').catch(()=>{});
await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:120000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<80&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async h=>{window.__STORYWORLD_CHEAT777__?.activate?.('777');player.hero=h;await ensureImages(heroPaths(h));},HERO);
const zones=ZONES==='all'?await p.evaluate(()=>Object.keys(regionById).filter(z=>z!=='hub')):ZONES.split(',');
const rows=[];
for(const z of zones){cur=z;const t0=Date.now();const r={zone:z};
 try{await p.evaluate(async z=>{await enterRegion(z,null,{layer:'STORY',restore:true});const e=room?.exploration?.entry;if(e){player.x=e.x;player.y=e.y;}},z);
  await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();await p.evaluate(()=>{guide=true;auto=true;guideTimer=0;player.hp=player.maxHp||player.hp;});
  const x0=await p.evaluate(()=>[player.x,player.y]);await p.waitForTimeout(SEC*1000);await skip();
  Object.assign(r,await p.evaluate(x0=>({enemies:(room?.enemies||[]).filter(e=>e.hp>0).length,moved:+Math.hypot(player.x-x0[0],player.y-x0[1]).toFixed(2),hp:Math.round(player.hp)}),x0));
  r.stuck=r.enemies>0&&r.moved<0.5;await p.screenshot({path:path.join(OUT,z+'.png')});
 }catch(e){r.fail=String(e.message).slice(0,200);}
 r.ms=Date.now()-t0;rows.push(r);console.log(JSON.stringify(r));}
await b.close();
const problems=log;
const report={url:URL,hero:HERO,sec:SEC,zones:rows,log,problems:problems.length,stuck:rows.filter(r=>r.stuck||r.fail).map(r=>r.zone)};
fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,1));
console.log(`problems ${report.problems} · stuck/fail ${report.stuck.length ? report.stuck.join(',') : 0}`);process.exit(report.problems||report.stuck.length?1:0);
