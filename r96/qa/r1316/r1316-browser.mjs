// R1316 Dots 새 3D 일반 몹 21종 — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  ① 자동 검사 기본 꺼짐·감싸기 안 쌓임 ② ?mob3d16=1 로 21종 GLB 모두 읽힘(실패 0)
//  ③ 분노의 사냥개(ep1b07): 3D 로 보이고 같은 몹의 2D 몸 그림은 빠짐, 3D 상자가 발 위치를 감싸고 키가 2D 몸의 보이는 키와 .75~1.3배
//  ④ 동작 idle→attack→hit→death→사라짐 ⑤ 표에 없는 몹(불길 속의 늑대)·보스는 2D 그대로
//  ⑥ 설원 잠복 보행기·걸어다니는 소형 로봇(ep1b09): 방향 이동 시트(r1018/move)까지 2D 몸이 모두 빠짐
//  ⑦ 꿈 층(DREAM)이면 3D 0 ⑧ 끄기 → 3D 0·2D 몸 복귀 ⑨ 페이지 오류 0·오버레이 오류 0
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1316/r1316-browser.mjs`
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {chromium,boot,go,URL as BASE} from '../r444/lib.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errs=[];const A='window.__STORYWORLD_MOB3D_R1316__';
// ① 기본값
{const {p,ctx}=await boot(b,{vp:{width:960,height:540}});p.on('pageerror',e=>errs.push(String(e)));await go(p,'ep1b07');
 ok(await p.evaluate(()=>!!window.__STORYWORLD_MOB3D_R1316__),'공개 API 있음');
 ok(await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1316__?.on?.())===false,'자동 검사 기본값 꺼짐');
 const rate=()=>p.evaluate(()=>new Promise(res=>{const a=window.__STORYWORLD_MOB3D_R1316__.inspect().stats.frames;let n=0;const f=()=>{n++;if(n<40)requestAnimationFrame(f);else res((window.__STORYWORLD_MOB3D_R1316__.inspect().stats.frames-a)/n);};requestAnimationFrame(f);}));
 await p.waitForTimeout(1500);const r1=await rate();await p.waitForTimeout(3000);const r2=await rate();
 ok(r1<=1.5&&r2<=1.5&&r2<=r1+.25,'명령 장면 감싸기 쌓이지 않음(프레임당 consume '+r1.toFixed(2)+' → '+r2.toFixed(2)+')');
 const shown=await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1316__.inspect().shown);ok(shown===0,'꺼져 있으면 3D 0 ('+shown+')');await ctx.close();}
const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));
await p.goto(BASE+'?mob3d16=1');await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
await go(p,'ep1b07');
const API=()=>p.evaluate(()=>window.__STORYWORLD_MOB3D_R1316__?.inspect?.()||null);
ok(await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1316__?.on?.()===true),'?mob3d16=1 로 켜짐');
// ② 21종 모두 읽기
await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1316__.preload());
await p.waitForFunction(()=>{const I=window.__STORYWORLD_MOB3D_R1316__.inspect();return I.loaded.length+I.failed.length>=21;},null,{timeout:300000}).catch(()=>{});
let I=await API();ok(I.loaded.length===21&&I.failed.length===0,'21종 GLB 읽음 '+I.loaded.length+'/21, 실패 '+JSON.stringify(I.failed)+' '+(I.lastError||''));
// ③ 사냥개
await p.evaluate(()=>{player.hp=player.maxHp=1e6;for(const e of room.enemies)e.damage=0;const h=room.enemies.find(e=>/^분노의 사냥개$/.test(e.name));const w=room.enemies.find(e=>/^불길 속의 늑대$/.test(e.name));
 window.__t={h:h.id,w:w.id,boss:room.enemies.find(e=>e.boss)?.id};player.x=h.x+1.4;player.y=h.y+1.2;w.x=h.x-1.2;w.y=h.y+.8;w.homeX=w.x;w.homeY=w.y;});
await p.waitForFunction(()=>window.__STORYWORLD_MOB3D_R1316__.inspect().instances.some(x=>x.id===String(__t.h)&&x.visible),null,{timeout:120000}).catch(()=>{});
await p.waitForTimeout(2500);
const T0=await p.evaluate(()=>({h:String(__t.h),boss:String(__t.boss)}));I=await API();const hi=I.instances.find(x=>x.id===T0.h);ok(hi&&hi.visible&&hi.kind==='hound','사냥개 → hound 3D 보임 '+JSON.stringify(hi));
const grab=()=>p.evaluate(()=>{const h=window.__STORYWORLD_PHASE1__.controller.state.three;return new Promise(res=>{const base=h.commands.render;h.commands.render=function(cmds){const out=base.apply(this,arguments);h.commands.render=base;
 const by=id=>cmds.filter(c=>c?.owner?.id==='enemy:'+id&&!c.owner.r350);const img=id=>by(id).filter(c=>c.kind==='image').map(c=>String(c.sourcePath||''));
 res({hBody:img(__t.h).filter(s=>/wrath-hound|^r409/.test(s)).length,hAll:by(__t.h).length,wBody:img(__t.w).length,boss:__t.boss!=null?by(__t.boss).length:-1});return out;};});});
let G=await grab();ok(G.hBody===0,'사냥개 2D 몸 그림 빠짐('+G.hBody+')');ok(G.wBody>0,'표에 없는 불길 속의 늑대는 2D 그대로('+G.wBody+')');
ok(!I.instances.some(x=>x.id===T0.boss),'보스는 3D 대상 아님');
const box=await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1316__.measure(__t.h));
ok(box&&box.count>0&&box.left<=box.anchor.x&&box.anchor.x<=box.right&&box.top<box.anchor.y&&box.anchor.y<=box.bottom+box.h*.2,'사냥개 3D 상자가 발 위치를 감쌈 '+JSON.stringify(box&&{l:Math.round(box.left),r:Math.round(box.right),t:Math.round(box.top),b:Math.round(box.bottom),a:[Math.round(box.anchor.x),Math.round(box.anchor.y)]}));
ok(box&&box.target>8&&box.h>=box.target*.75&&box.h<=box.target*1.3,'사냥개 3D 키 '+Math.round(box?.h)+'px / 2D 보이는 키 '+Math.round(box?.target)+'px');
// ④ 동작
const id0=await p.evaluate(()=>String(__t.h));const pose=()=>p.evaluate(id=>window.__STORYWORLD_MOB3D_R1316__.inspect().instances.find(x=>x.id===id)?.pose,id0);
await p.evaluate(()=>{const e=room.enemies.find(e=>e.id===__t.h);e.speed=0;e.state='idle';e.moving=false;e.moveDX=e.moveDY=0;});await p.waitForTimeout(800);
ok((await pose())==='idle','멈춤 → idle ('+(await pose())+')');
await p.evaluate(()=>{const e=room.enemies.find(e=>e.id===__t.h);player.x=e.x+.45;player.y=e.y+.45;});
await p.waitForFunction(()=>room.enemies.find(e=>e.id===__t.h)?.state==='attack',null,{timeout:30000}).catch(()=>{});await p.waitForTimeout(300);
ok((await pose())==='attack','엔진 공격 상태 → attack ('+(await pose())+')');
await p.screenshot({path:path.join(HERE,'r1316-hound.png')});
await p.evaluate(()=>{const e=room.enemies.find(e=>e.id===__t.h);player.x=e.x+1.4;player.y=e.y+1.2;e.state='idle';e.flash=.2;});await p.waitForTimeout(120);
ok((await pose())==='hit','피격 섬광 → hit ('+(await pose())+')');
await p.evaluate(()=>{const e=room.enemies.find(e=>e.id===__t.h);e.flash=0;e.hp=0;e.deadAt=time;});await p.waitForTimeout(300);
ok((await pose())==='death','사망 → death ('+(await pose())+')');
await p.waitForFunction(id=>!window.__STORYWORLD_MOB3D_R1316__.inspect().instances.some(x=>x.id===id&&x.visible),id0,{timeout:60000}).then(()=>ok(true,'사망 뒤 사라짐')).catch(()=>ok(false,'사망 뒤 사라짐'));
G=await grab();ok(G.hBody===0,'죽은 사냥개 2D 몸이 다시 나타나지 않음('+G.hBody+')');
// ⑦ 꿈 층
await p.evaluate(()=>{window.__L=room.layer;room.layer='DREAM';});await p.waitForTimeout(600);I=await API();ok(I.shown===0&&!I.active,'꿈 층이면 3D 0 ('+I.shown+')');
await p.evaluate(()=>{room.layer=window.__L;});
// ⑥ ep1b09 설원 잠복 보행기·소형 로봇
await go(p,'ep1b09');
await p.evaluate(()=>{player.hp=player.maxHp=1e6;for(const e of room.enemies)e.damage=0;const s=room.enemies.find(e=>/^설원 잠복 보행기$/.test(e.name)),r=room.enemies.find(e=>/^걸어다니는 소형 로봇$/.test(e.name));
 window.__t={s:s.id,r:r.id};player.x=s.x+1.6;player.y=s.y+1.2;r.x=s.x-1.1;r.y=s.y+.9;r.homeX=r.x;r.homeY=r.y;
 // 방향 이동 시트(r1018/move/…-down)가 나오게 화면 아래로 걷게 한다
 s.moving=true;s.moveDX=0;s.moveDY=1;});
await p.waitForFunction(()=>{const I=window.__STORYWORLD_MOB3D_R1316__.inspect();return ['s','r'].every(k=>I.instances.some(x=>x.id===String(__t[k])&&x.visible));},null,{timeout:120000}).catch(()=>{});
await p.waitForTimeout(2000);I=await API();const T1=await p.evaluate(()=>({s:String(__t.s),r:String(__t.r)}));
ok(I.instances.some(x=>x.id===T1.s&&x.kind==='snow'&&x.visible),'설원 잠복 보행기 → snow 3D');
ok(I.instances.some(x=>x.id===T1.r&&x.kind==='robot'&&x.visible),'걸어다니는 소형 로봇 → robot 3D');
const left=await p.evaluate(()=>{const h=window.__STORYWORLD_PHASE1__.controller.state.three;return new Promise(res=>{let n=0,bad=[];const base=h.commands.render;h.commands.render=function(cmds){const out=base.apply(this,arguments);
 for(const c of cmds)if(c?.kind==='image'&&!c.owner?.r350&&(c.owner?.id==='enemy:'+__t.s||c.owner?.id==='enemy:'+__t.r))bad.push(String(c.sourcePath||'').slice(-60));
 if(++n>=30){h.commands.render=base;res(bad);}return out;};});});
ok(left.length===0,'두 몹의 2D 몸(방향 이동 시트 포함) 30프레임 동안 0 '+JSON.stringify(left.slice(0,4)));
const bs=await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1316__.measure(__t.s));
ok(bs&&bs.target>8&&bs.h>=bs.target*.75&&bs.h<=bs.target*1.3,'보행기 3D 키 '+Math.round(bs?.h)+'px / 2D 보이는 키 '+Math.round(bs?.target)+'px');
await p.screenshot({path:path.join(HERE,'r1316-ep1b09.png')});
// ⑧ 끄기
await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1316__.set(false));await p.waitForTimeout(600);
I=await API();ok(I.shown===0,'끄면 3D 0 ('+I.shown+')');
const back=await p.evaluate(()=>{const h=window.__STORYWORLD_PHASE1__.controller.state.three;return new Promise(res=>{const base=h.commands.render;h.commands.render=function(cmds){const out=base.apply(this,arguments);h.commands.render=base;res(cmds.filter(c=>c?.kind==='image'&&c.owner?.id==='enemy:'+__t.s&&!c.owner.r350).length);return out;};});});
ok(back>0,'끄면 2D 몸 복귀('+back+')');
I=await API();ok(!errs.length,'페이지 오류 0 '+errs.slice(0,3).join(' | '));ok(I.stats.errors===0,'오버레이 오류 0 '+(I.lastError||''));
console.log(fail?'R1316 BROWSER FAIL '+fail:'R1316 BROWSER ALL OK');await b.close();process.exit(fail?1:0);
