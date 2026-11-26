// R1317 Dots 새 3D 일반 몹 9종 — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님). R1316 검사와 같은 틀.
//  ① 기본 꺼짐·감싸기 안 쌓임 ② ?mob3d17=1 로 9종 GLB 모두 읽힘(실패 0)
//  ③ 거짓천국 근위천사(ep1a11): 3D 로 보이고 같은 몹의 2D 몸 그림은 빠짐, 3D 상자가 발 위치를 감싸고 키가 2D 보이는 키의 .75~1.3배,
//     표에 없는 몹(치료거부의 가면 — R1316 몫, R1316 꺼짐)·보스는 2D 그대로
//  ④ 동작 idle→attack→hit→death→사라짐
//  ⑤ 버려진 최고급 식재료(ep1b04, 경로 줄기 없이 이름으로만 찾는 몹): 3D, 2D 몸 30프레임 0, 키 맞음
//  ⑥ 잠식된 약방 아낙(last302)·피로 꿰맨 전령(dist04) 3D
//  ⑦ 꿈 층이면 3D 0 ⑧ 끄기 → 3D 0·2D 몸 복귀 ⑨ 페이지 오류 0·오버레이 오류 0
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1317/r1317-browser.mjs`
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {chromium,boot,go,URL as BASE} from '../r444/lib.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errs=[];
// ① 기본값
{const {p,ctx}=await boot(b,{vp:{width:960,height:540}});p.on('pageerror',e=>errs.push(String(e)));await go(p,'ep1a11');
 ok(await p.evaluate(()=>!!window.__STORYWORLD_MOB3D_R1317__),'공개 API 있음');
 ok(await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1317__?.on?.())===false,'기본값 꺼짐');
 const rate=()=>p.evaluate(()=>new Promise(res=>{const a=window.__STORYWORLD_MOB3D_R1317__.inspect().stats.frames;let n=0;const f=()=>{n++;if(n<40)requestAnimationFrame(f);else res((window.__STORYWORLD_MOB3D_R1317__.inspect().stats.frames-a)/n);};requestAnimationFrame(f);}));
 await p.waitForTimeout(1500);const r1=await rate();await p.waitForTimeout(3000);const r2=await rate();
 ok(r1<=1.5&&r2<=1.5&&r2<=r1+.25,'명령 장면 감싸기 쌓이지 않음(프레임당 consume '+r1.toFixed(2)+' → '+r2.toFixed(2)+')');
 const shown=await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1317__.inspect().shown);ok(shown===0,'꺼져 있으면 3D 0 ('+shown+')');await ctx.close();}
const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));
await p.goto(BASE+'?mob3d17=1');await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
await go(p,'ep1a11');
const API=()=>p.evaluate(()=>window.__STORYWORLD_MOB3D_R1317__?.inspect?.()||null);
ok(await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1317__?.on?.()===true),'?mob3d17=1 로 켜짐');
// ② 9종 모두 읽기
await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1317__.preload());
await p.waitForFunction(()=>{const I=window.__STORYWORLD_MOB3D_R1317__.inspect();return I.loaded.length+I.failed.length>=9;},null,{timeout:300000}).catch(()=>{});
let I=await API();ok(I.loaded.length===9&&I.failed.length===0,'9종 GLB 읽음 '+I.loaded.length+'/9, 실패 '+JSON.stringify(I.failed)+' '+(I.lastError||''));
// ③ 근위천사
const near=(a,o,dx,dy)=>{o.x=a.x+dx;o.y=a.y+dy;o.homeX=o.x;o.homeY=o.y;};
await p.evaluate(()=>{player.hp=player.maxHp=1e6;for(const e of room.enemies)e.damage=0;const strip=n=>String(n).replace(/^중간보스 · /,'').replace(/ (후속 증원|우두머리|증원|추격대)$/,'');
 const h=room.enemies.find(e=>!e.boss&&e.hp>0&&strip(e.name)==='거짓천국 근위천사');const w=room.enemies.find(e=>!e.boss&&e.hp>0&&strip(e.name)==='치료거부의 가면');
 window.__t={h:h.id,w:w.id,boss:room.enemies.find(e=>e.boss)?.id};player.x=h.x+1.4;player.y=h.y+1.2;w.x=h.x-1.2;w.y=h.y+.8;w.homeX=w.x;w.homeY=w.y;});
await p.waitForFunction(()=>window.__STORYWORLD_MOB3D_R1317__.inspect().instances.some(x=>x.id===String(__t.h)&&x.visible),null,{timeout:120000}).catch(()=>{});
await p.waitForTimeout(2500);
const T0=await p.evaluate(()=>({h:String(__t.h),boss:String(__t.boss)}));I=await API();const hi=I.instances.find(x=>x.id===T0.h);ok(hi&&hi.visible&&hi.kind==='guard','근위천사 → guard 3D 보임 '+JSON.stringify(hi));
const grab=()=>p.evaluate(()=>{const h=window.__STORYWORLD_PHASE1__.controller.state.three;return new Promise(res=>{const base=h.commands.render;h.commands.render=function(cmds){const out=base.apply(this,arguments);h.commands.render=base;
 const mine=(c,id)=>c?.owner&&!c.owner.r350&&(c.owner.id==='enemy:'+id||c.owner.id==='r248:mob:'+id);const img=id=>cmds.filter(c=>mine(c,id)&&c.kind==='image'&&!/(^|[\/_.-])(fx|sigil|smoke|shadow|bar)([\/_.-]|$)/i.test(String(c.sourcePath||'')));
 res({hBody:img(__t.h).length,wBody:img(__t.w).length,boss:__t.boss!=null?cmds.filter(c=>mine(c,__t.boss)).length:-1});return out;};});});
let G=await grab();ok(G.hBody===0,'근위천사 2D 몸 그림 빠짐('+G.hBody+')');ok(G.wBody>0,'표에 없는 치료거부의 가면은 2D 그대로('+G.wBody+')');
ok(!I.instances.some(x=>x.id===T0.boss),'보스는 3D 대상 아님');
const box=await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1317__.measure(__t.h));
ok(box&&box.count>0&&box.left<=box.anchor.x&&box.anchor.x<=box.right&&box.top<box.anchor.y&&box.anchor.y<=box.bottom+box.h*.2,'근위천사 3D 상자가 발 위치를 감쌈 '+JSON.stringify(box&&{l:Math.round(box.left),r:Math.round(box.right),t:Math.round(box.top),b:Math.round(box.bottom),a:[Math.round(box.anchor.x),Math.round(box.anchor.y)]}));
ok(box&&box.target>8&&box.h>=box.target*.75&&box.h<=box.target*1.3,'근위천사 3D 키 '+Math.round(box?.h)+'px / 2D 보이는 키 '+Math.round(box?.target)+'px');
// ④ 동작
const id0=T0.h;const pose=()=>p.evaluate(id=>window.__STORYWORLD_MOB3D_R1317__.inspect().instances.find(x=>x.id===id)?.pose,id0);
await p.evaluate(()=>{const e=room.enemies.find(e=>e.id===__t.h);e.speed=0;e.state='idle';e.moving=false;e.moveDX=e.moveDY=0;});await p.waitForTimeout(800);
ok((await pose())==='idle','멈춤 → idle ('+(await pose())+')');
await p.evaluate(()=>{const e=room.enemies.find(e=>e.id===__t.h);player.x=e.x+.45;player.y=e.y+.45;});
await p.waitForFunction(()=>room.enemies.find(e=>e.id===__t.h)?.state==='attack',null,{timeout:30000}).catch(()=>{});await p.waitForTimeout(300);
ok((await pose())==='attack','엔진 공격 상태 → attack ('+(await pose())+')');
await p.screenshot({path:path.join(HERE,'r1317-guard.png')});
await p.evaluate(()=>{const e=room.enemies.find(e=>e.id===__t.h);player.x=e.x+1.4;player.y=e.y+1.2;e.state='idle';e.flash=.2;});await p.waitForTimeout(120);
ok((await pose())==='hit','피격 섬광 → hit ('+(await pose())+')');
await p.evaluate(()=>{const e=room.enemies.find(e=>e.id===__t.h);e.flash=0;e.hp=0;e.deadAt=time;});await p.waitForTimeout(300);
ok((await pose())==='death','사망 → death ('+(await pose())+')');
await p.waitForFunction(id=>!window.__STORYWORLD_MOB3D_R1317__.inspect().instances.some(x=>x.id===id&&x.visible),id0,{timeout:60000}).then(()=>ok(true,'사망 뒤 사라짐')).catch(()=>ok(false,'사망 뒤 사라짐'));
G=await grab();ok(G.hBody===0,'죽은 근위천사 2D 몸이 다시 나타나지 않음('+G.hBody+')');
// ⑦ 꿈 층
await p.evaluate(()=>{window.__L=room.layer;room.layer='DREAM';});await p.waitForTimeout(600);I=await API();ok(I.shown===0&&!I.active,'꿈 층이면 3D 0 ('+I.shown+')');
await p.evaluate(()=>{room.layer=window.__L;});
// ⑤⑥ 이름으로만 찾는 몹들
const one=async(zone,name,kind,shot)=>{await go(p,zone);
 const id=await p.evaluate(name=>{player.hp=player.maxHp=1e6;for(const e of room.enemies)e.damage=0;const strip=n=>String(n).replace(/^중간보스 · /,'').replace(/ (후속 증원|우두머리|증원|추격대)$/,'');
  const s=room.enemies.find(e=>!e.boss&&e.hp>0&&strip(e.name)===name);if(!s)return null;s.hp=s.maxHp=1e6;window.__t={s:s.id};
  // 순간이동이 벽에 막혀 되돌려지는 지역(dist04)이 있어, 영웅 대신 몹을 영웅 곁으로 옮긴다.
  s.x=player.x-1.4;s.y=player.y-1.0;s.homeX=s.x;s.homeY=s.y;s.nav=[];return String(s.id);},name);
 if(!id){ok(false,name+' 몹을 '+zone+' 에서 찾음');return;}
 await p.waitForFunction(id=>window.__STORYWORLD_MOB3D_R1317__.inspect().instances.some(x=>x.id===id&&x.visible),id,{timeout:120000}).catch(()=>{});
 await p.waitForTimeout(2000);I=await API();ok(I.instances.some(x=>x.id===id&&x.kind===kind&&x.visible),name+' → '+kind+' 3D');
 const left=await p.evaluate(()=>{const h=window.__STORYWORLD_PHASE1__.controller.state.three;return new Promise(res=>{let n=0,bad=[];const base=h.commands.render;h.commands.render=function(cmds){const out=base.apply(this,arguments);
  for(const c of cmds)if(c?.kind==='image'&&!c.owner?.r350&&(c.owner?.id==='enemy:'+__t.s||c.owner?.id==='r248:mob:'+__t.s)&&!/(^|[\/_.-])(fx|sigil|smoke|shadow|bar)([\/_.-]|$)/i.test(String(c.sourcePath||'')))bad.push(String(c.sourcePath||'').slice(-60));
  if(++n>=30){h.commands.render=base;res(bad);}return out;};});});
 ok(left.length===0,name+' 2D 몸 30프레임 동안 0 '+JSON.stringify(left.slice(0,3)));
 const bs=await p.evaluate(id=>window.__STORYWORLD_MOB3D_R1317__.measure(id),id);
 ok(bs&&bs.target>8&&bs.h>=bs.target*.75&&bs.h<=bs.target*1.3,name+' 3D 키 '+Math.round(bs?.h)+'px / 2D 보이는 키 '+Math.round(bs?.target)+'px');
 if(shot)await p.screenshot({path:path.join(HERE,shot)});};
await one('ep1b04','버려진 최고급 식재료','delicacy','r1317-ep1b04.png');
await one('last302','잠식된 약방 아낙','herbwife',null);
await one('dist04','피로 꿰맨 전령','twinned',null);
// ⑧ 끄기
await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1317__.set(false));await p.waitForTimeout(600);
I=await API();ok(I.shown===0,'끄면 3D 0 ('+I.shown+')');
const back=await p.evaluate(()=>{const h=window.__STORYWORLD_PHASE1__.controller.state.three;return new Promise(res=>{const base=h.commands.render;h.commands.render=function(cmds){const out=base.apply(this,arguments);h.commands.render=base;res(cmds.filter(c=>c?.kind==='image'&&(c.owner?.id==='enemy:'+__t.s||c.owner?.id==='r248:mob:'+__t.s)&&!c.owner.r350).length);return out;};});});
ok(back>0,'끄면 2D 몸 복귀('+back+')');
I=await API();ok(!errs.length,'페이지 오류 0 '+errs.slice(0,3).join(' | '));ok(I.stats.errors===0,'오버레이 오류 0 '+(I.lastError||''));
console.log(fail?'R1317 BROWSER FAIL '+fail:'R1317 BROWSER ALL OK');await b.close();process.exit(fail?1:0);
