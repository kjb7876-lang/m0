// R1321 뿌리의 문지기 R3 — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  ① ?mob3d=1&boss00r3=1: dist00 보스가 R3 GLB 로 읽히고 3D 로 보임, 키가 2D 기준(actorHeight×2.05)의 .6~1.7배, 2D 보스 몸 그림 빠짐.
//  ② ?mob3d=1(R1321 없음, 기본): 보스는 R2 GLB 그대로. ③ 페이지·오버레이 오류 0. 전후 화면을 r1321-r2.png·r1321-r3.png 로 남김.
// 실행: 정적 서버(http://127.0.0.1:4410/m0/) 뒤 `node r96/qa/r1321/r1321-browser.mjs`
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {chromium,go,URL as BASE} from '../r444/lib.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errs=[];
async function run(q,tag){
 const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(BASE+q);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
 const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
 await go(p,'dist00');
 await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies)e.damage=0;const e=room.enemies.find(e=>e.boss);window.__b=e.id;e.hp=e.maxHp=1e7;e.spawnState='active';e.visible=true;e.speed=0;e.x=player.x+2.2;e.y=player.y+1.4;e.homeX=e.x;e.homeY=e.y;
  for(const o of room.enemies)if(o!==e&&Math.hypot(o.x-player.x,o.y-player.y)<6){o.x+=30;o.homeX=o.x;}});
 const seen=await p.waitForFunction(()=>window.__STORYWORLD_MOB3D_R1312__.inspect().instances.some(x=>x.id===__b&&x.kind==='boss'&&x.visible),null,{timeout:180000}).then(()=>true).catch(()=>false);
 ok(seen,tag+' 보스 → 문지기 3D 보임');
 await p.waitForTimeout(2500);
 const I=await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1312__.inspect());
 const box=await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1312__.measure(__b));
 const body=await p.evaluate(()=>{const h=window.__STORYWORLD_PHASE1__.controller.state.three;return new Promise(res=>{const base=h.commands.render;h.commands.render=function(cmds){const out=base.apply(this,arguments);h.commands.render=base;
  res(cmds.filter(c=>c?.owner?.id==='enemy:'+__b&&c.kind==='image'&&(/dist00-boss|demon_tree_root_seraph|\/bosses\/dist00-/.test(String(c.sourcePath||''))||c.r409Outlined==='enemy')).length);return out;};});});
 await p.screenshot({path:path.join(HERE,'r1321-'+tag+'.png')});
 const R=await p.evaluate(()=>window.__STORYWORLD_BOSS00_R1321__?.on?.());
 await ctx.close();return {I,box,body,R};
}
const a=await run('?mob3d=1&boss00r3=1','r3');
ok(a.R===true,'r3 ?boss00r3=1 로 켜짐');
ok(a.I.bossGlb==='assets/r1321/boss-dist00-root-gatekeeper-3d-r3.glb'&&a.I.loaded.includes('boss'),'r3 보스 GLB = R3 ('+a.I.bossGlb+', loaded '+a.I.loaded.join(',')+')');
ok(a.box&&a.box.h>=a.box.ah*.6&&a.box.h<=a.box.ah*1.7,'r3 키 '+Math.round(a.box?.h)+'px / 2D 기준 '+Math.round(a.box?.ah)+'px');
ok(a.body===0,'r3 2D 보스 몸 그림 빠짐('+a.body+')');
const c=await run('?mob3d=1','r2');
ok(c.R===false,'r2 기본은 꺼짐');ok(c.I.bossGlb==='assets/r1312/boss-dist00-root-gatekeeper-3d.glb','r2 보스 GLB = 이전 R2 ('+c.I.bossGlb+')');
ok(!errs.length,'페이지 오류 0 '+errs.slice(0,2).join(' | '));ok(a.I.stats.errors===0&&c.I.stats.errors===0,'오버레이 오류 0 '+(a.I.lastError||'')+(c.I.lastError||''));
console.log(fail?'R1321 BROWSER FAIL '+fail:'R1321 BROWSER ALL OK');await b.close();process.exit(fail?1:0);
