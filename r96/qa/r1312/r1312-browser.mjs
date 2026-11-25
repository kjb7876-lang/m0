// R1312 첫 맵 몹 3D — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  ① 강제 켜기(?mob3d=1): dist00 근처 침식 근위·뿌리 추적자가 3D 로 보이고 같은 몹의 2D 몸 그림은 빠짐, 체력바 등 나머지는 남음.
//  ② 3D 몸의 화면 상자가 몹 발 위치를 감싸고 키가 2D 몸 크기(actorHeight)의 .6~1.7배.
//  ③ 동작: 걷기→walk, 공격 상태→attack, 피격 섬광→hit, 사망→death 뒤 사라짐.
//  ④ 보스 뿌리의 문지기 → 문지기 모델. ⑤ 끄기 → 3D 0·2D 몸 복귀. ⑥ 다른 맵(dist01) 영향 없음.
//  ⑦ 강제 없이 자동 검사(webdriver)는 기본 꺼짐. ⑧ 페이지 오류 0.
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1312/r1312-browser.mjs`
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {chromium,boot,go,URL as BASE} from '../r444/lib.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errs=[];
// ⑦ 기본값(강제 없음)
{const {p,ctx}=await boot(b,{vp:{width:960,height:540}});p.on('pageerror',e=>errs.push(String(e)));await go(p,'dist00');
 const api=await p.evaluate(()=>!!window.__STORYWORLD_MOB3D_R1312__);ok(api,'공개 API 있음');
 const on=await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1312__?.on?.());ok(on===false,'자동 검사 기본값 꺼짐');await ctx.close();}
process.env.SW_URL=BASE;
const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));
await p.goto(BASE+'?mob3d=1');await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
await go(p,'dist00');
const API=()=>p.evaluate(()=>window.__STORYWORLD_MOB3D_R1312__?.inspect?.()||null);
ok(await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1312__?.on?.()===true),'?mob3d=1 로 켜짐');
await p.evaluate(()=>{player.hp=player.maxHp=99999;const g=room.enemies.find(e=>/침식 근위/.test(e.name)&&!e.boss&&!e.midboss),s=room.enemies.find(e=>/뿌리 추적자/.test(e.name)&&!e.boss);
 for(const e of room.enemies){e.damage=0;}window.__t={g:g.id,s:s.id};player.x=g.x+1.2;player.y=g.y+1.2;s.x=g.x+.9;s.y=g.y-1.1;s.homeX=s.x;s.homeY=s.y;});
await p.waitForFunction(()=>(window.__STORYWORLD_MOB3D_R1312__?.inspect?.().shown||0)>=2,null,{timeout:120000}).catch(()=>{});
await p.waitForTimeout(1500);
let I=await API();ok(I&&I.loaded.includes('guard')&&I.loaded.includes('stalker'),'근위·추적자 모델 읽음 '+JSON.stringify(I?.loaded));
ok(I&&I.shown>=2,'3D 몹 2마리 이상 보임('+I?.shown+')');
const cmd=await p.evaluate(()=>{const h=window.__STORYWORLD_PHASE1__.controller.state.three;return new Promise(res=>{const base=h.commands.render;h.commands.render=function(cmds){const out=base.apply(this,arguments);h.commands.render=base;
 const mine=new Set(['enemy:'+__t.g,'enemy:'+__t.s]);const rows=cmds.filter(c=>mine.has(c?.owner?.id));
 res({body:rows.filter(c=>c.kind==='image'&&(/root-bound-ghoul|\/root-stalker-r74/.test(String(c.sourcePath||''))||c.r409Outlined==='enemy'||/^r409/.test(String(c.sourcePath||'')))).length,other:rows.length});return out;};});});
ok(cmd.body===0,'두 몹의 2D 몸 그림 빠짐('+cmd.body+')');ok(cmd.other>0,'몸 아닌 명령(그림자·체력바 등)은 남음('+cmd.other+')');
const box=await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1312__.measure(__t.g));
ok(box&&box.count>0&&box.left<=box.anchor.x&&box.anchor.x<=box.right&&box.top<box.anchor.y&&box.anchor.y<=box.bottom+box.h*.15,'근위 3D 상자가 발 위치를 감쌈 '+JSON.stringify(box&&{l:Math.round(box.left),r:Math.round(box.right),t:Math.round(box.top),b:Math.round(box.bottom),a:box.anchor&&[Math.round(box.anchor.x),Math.round(box.anchor.y)]}));
ok(box&&box.h>=box.ah*.6&&box.h<=box.ah*1.7,'근위 키 '+Math.round(box?.h)+'px / 2D 기준 '+Math.round(box?.ah)+'px');
// ③ 동작
const pose=id=>p.evaluate(id=>window.__STORYWORLD_MOB3D_R1312__.inspect().instances.find(x=>x.id===id)?.pose,id);
await p.evaluate(()=>{const e=room.enemies.find(e=>e.id===__t.g);e.speed=0;e.state='idle';e.moving=false;e.moveDX=e.moveDY=0;});await p.waitForTimeout(800);
const id0=await p.evaluate(()=>__t.g);
ok((await pose(id0))==='idle','멈춤 → idle ('+(await pose(id0))+')');
// 실제 AI 공격: 영웅을 몹 옆에 두면 엔진이 e.state='attack' 을 유지한다(사거리 안 동안 계속).
await p.evaluate(()=>{const e=room.enemies.find(e=>e.id===__t.g);player.x=e.x+.45;player.y=e.y+.45;});
await p.waitForFunction(()=>room.enemies.find(e=>e.id===__t.g)?.state==='attack',null,{timeout:30000}).catch(()=>{});await p.waitForTimeout(300);
ok((await pose(id0))==='attack','엔진 공격 상태 → attack ('+(await pose(id0))+')');
await p.evaluate(()=>{const e=room.enemies.find(e=>e.id===__t.g);player.x=e.x+1.2;player.y=e.y+1.2;});
await p.evaluate(()=>{const e=room.enemies.find(e=>e.id===__t.g);e.state='idle';e.flash=.2;});await p.waitForTimeout(120);
ok((await pose(id0))==='hit','피격 섬광 → hit ('+(await pose(id0))+')');
await p.evaluate(()=>{const e=room.enemies.find(e=>e.id===__t.g);e.flash=0;e.hp=0;e.deadAt=time;});await p.waitForTimeout(300);
ok((await pose(id0))==='death','사망 → death ('+(await pose(id0))+')');
await p.screenshot({path:path.join(HERE,'r1312-dist00.png')});
await p.waitForFunction(id=>!window.__STORYWORLD_MOB3D_R1312__.inspect().instances.some(x=>x.id===id&&x.visible),id0,{timeout:60000}).then(()=>ok(true,'사망 뒤 사라짐')).catch(()=>ok(false,'사망 뒤 사라짐'));
// ④ 보스
// 보스는 보스 문을 열기 전엔 숨김(spawnState hidden) → 검사에서는 보스를 꺼내 영웅 옆에 둔다(엔진 순간이동은 막힌 칸이면 되돌아감).
await p.evaluate(()=>{const e=room.enemies.find(e=>e.boss);window.__t.b=e.id;e.spawnState='active';e.visible=true;e.speed=0;e.damage=0;e.x=player.x+2.2;e.y=player.y+1.4;});
await p.waitForFunction(()=>window.__STORYWORLD_MOB3D_R1312__.inspect().instances.some(x=>x.id===__t.b&&x.kind==='boss'&&x.visible),null,{timeout:120000}).then(()=>ok(true,'보스 → 문지기 3D')).catch(()=>ok(false,'보스 → 문지기 3D'));
await p.waitForTimeout(1500);await p.screenshot({path:path.join(HERE,'r1312-boss.png')});
// ⑤ 끄기
await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1312__.set(false));await p.waitForTimeout(600);
I=await API();ok(I.shown===0,'끄면 3D 0 ('+I.shown+')');
await p.evaluate(()=>{const e=room.enemies.find(e=>e.id===__t.b);e.spawnState='active';e.visible=true;});
const back=await p.evaluate(()=>{const h=window.__STORYWORLD_PHASE1__.controller.state.three;return new Promise(res=>{const base=h.commands.render;h.commands.render=function(cmds){const out=base.apply(this,arguments);h.commands.render=base;res(cmds.filter(c=>c?.owner?.kind==='enemy'&&c.kind==='image'&&/dist00-boss|demon_tree_root_seraph|\/bosses\/dist00-/.test(String(c.sourcePath||''))||c.owner.id==='enemy:'+__t.b&&c.r409Outlined==='enemy').length);return out;};});});
ok(back>0,'끄면 2D 보스 몸 복귀('+back+')');
await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1312__.set(true));
// ⑥ 다른 맵
await go(p,'dist01');await p.evaluate(()=>{const e=room.enemies[0];player.x=e.x+1;player.y=e.y+1;});await p.waitForTimeout(2500);
I=await API();ok(I.shown===0,'dist01 에서는 3D 몹 없음 ('+I.shown+')');
ok(!errs.length,'페이지 오류 0 '+errs.slice(0,3).join(' | '));
console.log(fail?'R1312 BROWSER FAIL '+fail:'R1312 BROWSER ALL OK');await b.close();process.exit(fail?1:0);
