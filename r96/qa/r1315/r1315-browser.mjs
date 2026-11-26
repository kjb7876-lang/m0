// R1315 새 3D 보스·몹 시범 적용 — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  ① 강제 켜기(?mob3d15=1): ep1b08 전극기계수호기사가 3D 로 보이고 같은 몹의 2D 몸 그림은 빠짐, 체력바 등 나머지는 남음.
//  ② 3D 몸 화면 상자가 발 위치를 감싸고 키가 2D 기준(actorHeight)의 .6~1.7배.
//  ③ 동작: 멈춤→idle, 공격 상태→attack, 피격 섬광→hit, 사망→death 뒤 사라짐.
//  ④ ep1b04 탐식 보스 → 3D 악마(glutton), 2D 보스 몸 빠짐, 키는 영웅 2.1배 기준 .6~1.7배. 패턴 단계 바뀜 → special.
//  ⑤ 밝기: 3D 몸 화면 영역의 평균 밝기가 검게 뭉개지지 않음(바닥보다 너무 어둡지 않음).
//  ⑥ 끄기 → 3D 0·2D 몸 복귀. ⑦ 다른 맵(dist00·ep1b03) 영향 없음, R1312 와 감싸기 쌓임 없음. ⑧ 자동 검사 기본 꺼짐. ⑨ 페이지 오류 0.
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1315/r1315-browser.mjs`
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {chromium,boot,go,skip,URL as BASE} from '../r444/lib.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errs=[];
const A='window.__STORYWORLD_MOB3D_R1315__';
// ⑧ 기본값 + 감싸기 쌓임
{const {p,ctx}=await boot(b,{vp:{width:960,height:540}});p.on('pageerror',e=>errs.push(String(e)));await go(p,'ep1b08');
 ok(await p.evaluate(()=>!!window.__STORYWORLD_MOB3D_R1315__),'공개 API 있음');
 ok(await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1315__?.on?.())===false,'자동 검사 기본값 꺼짐');
 const rate=()=>p.evaluate(()=>new Promise(res=>{const a=window.__STORYWORLD_MOB3D_R1315__.inspect().stats.frames;let n=0;const f=()=>{n++;if(n<40)requestAnimationFrame(f);else res((window.__STORYWORLD_MOB3D_R1315__.inspect().stats.frames-a)/n);};requestAnimationFrame(f);}));
 await p.waitForTimeout(1500);const r1=await rate();await p.waitForTimeout(3000);const r2=await rate();
 ok(r1<=1.5&&r2<=1.5&&r2<=r1+.25,'명령 장면 감싸기 쌓이지 않음(프레임당 consume '+r1.toFixed(2)+' → '+r2.toFixed(2)+')');await ctx.close();}
const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));
await p.goto(BASE+'?mob3d15=1');await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
const API=()=>p.evaluate(()=>window.__STORYWORLD_MOB3D_R1315__?.inspect?.()||null);
ok(await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1315__?.on?.()===true),'?mob3d15=1 로 켜짐');
// 다른 맵(dist00)에서는 이쪽 3D 없음
await go(p,'dist00');await p.evaluate(()=>{const e=room.enemies.find(e=>!e.boss);player.x=e.x+1;player.y=e.y+1;});await p.waitForTimeout(2000);
ok((await API()).shown===0,'dist00 에서 R1315 3D 없음');
// ① 기사
await go(p,'ep1b08');
const kn=await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies)e.damage=0;const ks=room.enemies.filter(e=>/^(전극기계수호기사|전극을 두른 좀비 수호기사)/.test(e.name)&&!e.boss);
 if(!ks.length)return 0;const k=ks[0];window.__t={k:k.id};player.x=k.x+1.3;player.y=k.y+1.3;return ks.length;});
ok(kn>0,'ep1b08 에 전극기계수호기사 '+kn+'마리');
await p.waitForFunction(()=>(window.__STORYWORLD_MOB3D_R1315__?.inspect?.().shown||0)>=1,null,{timeout:120000}).catch(()=>{});await p.waitForTimeout(1500);
let I=await API();ok(I&&I.loaded.includes('knight'),'기사 모델 읽음 '+JSON.stringify(I?.loaded)+' '+(I?.lastError||''));ok(I&&I.shown>=1,'3D 기사 보임('+I?.shown+')');
const cmdOf=ids=>p.evaluate(ids=>{const h=window.__STORYWORLD_PHASE1__.controller.state.three;return new Promise(res=>{const base=h.commands.render;h.commands.render=function(cmds){const out=base.apply(this,arguments);h.commands.render=base;
 const mine=new Set(ids.map(i=>'enemy:'+i));const rows=cmds.filter(c=>mine.has(c?.owner?.id));
 res({body:rows.filter(c=>c.kind==='image'&&(/electrode-machine-knight|\/mm-knight-|glutton|\/b04[-_]|b04-boss/.test(String(c.sourcePath||''))||c.r409Outlined==='enemy'||/^r409/.test(String(c.sourcePath||'')))).length,other:rows.length});return out;};});},ids);
let cmd=await cmdOf([await p.evaluate(()=>__t.k)]);
ok(cmd.body===0,'기사 2D 몸 그림 빠짐('+cmd.body+')');ok(cmd.other>0,'몸 아닌 명령은 남음('+cmd.other+')');
const kid=await p.evaluate(()=>__t.k);
let box=await p.evaluate(id=>window.__STORYWORLD_MOB3D_R1315__.measure(id),kid);
ok(box&&box.count>0&&box.left<=box.anchor.x&&box.anchor.x<=box.right&&box.top<box.anchor.y&&box.anchor.y<=box.bottom+box.h*.15,'기사 3D 상자가 발 위치를 감쌈');
ok(box&&box.h>=box.ah*.6&&box.h<=box.ah*1.7,'기사 키 '+Math.round(box?.h)+'px / 2D 기준 '+Math.round(box?.ah)+'px');
// ⑤ 밝기
const lum=async id=>{const bx=await p.evaluate(id=>window.__STORYWORLD_MOB3D_R1315__.measure(id),id);if(!bx)return null;const buf=await p.screenshot();
 return {bx,buf};};
{const r=await lum(kid);if(r){const sharp=null;fs.writeFileSync(path.join(HERE,'_k.png'),r.buf);}
 const L=await p.evaluate(async id=>{const bx=window.__STORYWORLD_MOB3D_R1315__.measure(id);const cv=document.querySelector('canvas');const img=new Image();img.src=cv.toDataURL();await img.decode().catch(()=>{});
  const c=document.createElement('canvas');c.width=cv.width;c.height=cv.height;const g=c.getContext('2d');g.drawImage(img,0,0);const sx=cv.width/window.innerWidth;
  const avg=(x0,y0,x1,y1)=>{x0=Math.max(0,x0*sx|0);y0=Math.max(0,y0*sx|0);x1=Math.min(c.width,x1*sx|0);y1=Math.min(c.height,y1*sx|0);if(x1<=x0||y1<=y0)return null;const d=g.getImageData(x0,y0,x1-x0,y1-y0).data;let s=0,n=0;for(let i=0;i<d.length;i+=4){s+=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];n++;}return s/n;};
  const w=bx.right-bx.left,h=bx.bottom-bx.top;return {body:avg(bx.left+w*.25,bx.top+h*.2,bx.right-w*.25,bx.bottom-h*.2),floor:avg(bx.left-w,bx.bottom,bx.right+w,bx.bottom+h*.5)};},kid).catch(e=>({err:String(e)}));
 ok(L&&L.body!=null&&L.body>=40,'기사 3D 몸 밝기 '+JSON.stringify(L)+' (평균 휘도 40 이상)');}
// ③ 동작
const pose=id=>p.evaluate(id=>window.__STORYWORLD_MOB3D_R1315__.inspect().instances.find(x=>x.id===id)?.pose,id);
await p.evaluate(()=>{const e=room.enemies.find(e=>e.id===__t.k);e.speed=0;e.state='idle';e.moving=false;e.moveDX=e.moveDY=0;});await p.waitForTimeout(800);
ok((await pose(kid))==='idle','멈춤 → idle ('+(await pose(kid))+')');
await p.evaluate(()=>{const e=room.enemies.find(e=>e.id===__t.k);player.x=e.x+.45;player.y=e.y+.45;});
await p.waitForFunction(()=>{const e=room.enemies.find(e=>e.id===__t.k);return e?.state==='attack'||Number.isFinite(e?.attack?.elapsed);},null,{timeout:30000}).catch(()=>{});await p.waitForTimeout(300);
ok((await pose(kid))==='attack','엔진 공격 → attack ('+(await pose(kid))+')');
await p.evaluate(()=>{const e=room.enemies.find(e=>e.id===__t.k);player.x=e.x+1.3;player.y=e.y+1.3;e.state='idle';e.attack=null;e.flash=.2;});await p.waitForTimeout(120);
ok((await pose(kid))==='hit','피격 섬광 → hit ('+(await pose(kid))+')');
await p.screenshot({path:path.join(HERE,'r1315-knight.png')});
await p.evaluate(()=>{const e=room.enemies.find(e=>e.id===__t.k);e.flash=0;e.hp=0;e.deadAt=time;});await p.waitForTimeout(300);
ok((await pose(kid))==='death','사망 → death ('+(await pose(kid))+')');
await p.waitForFunction(id=>!window.__STORYWORLD_MOB3D_R1315__.inspect().instances.some(x=>x.id===id&&x.visible),kid,{timeout:60000}).then(()=>ok(true,'사망 뒤 사라짐')).catch(()=>ok(false,'사망 뒤 사라짐'));
// ④ 탐식 보스
await go(p,'ep1b04');
await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies)e.damage=0;const e=room.enemies.find(e=>e.boss);window.__t.b=e.id;e.spawnState='active';e.visible=true;e.speed=0;e.x=player.x+2.4;e.y=player.y+1.2;});
await p.waitForFunction(()=>window.__STORYWORLD_MOB3D_R1315__.inspect().instances.some(x=>x.id===__t.b&&x.kind==='glutton'&&x.visible),null,{timeout:120000}).then(()=>ok(true,'탐식 보스 → 3D 악마')).catch(async()=>ok(false,'탐식 보스 → 3D 악마 '+JSON.stringify(await API())));
await p.waitForTimeout(1500);
const bid=await p.evaluate(()=>__t.b);
cmd=await cmdOf([bid]);ok(cmd.body===0,'보스 2D 몸 그림 빠짐('+cmd.body+')');
box=await p.evaluate(id=>window.__STORYWORLD_MOB3D_R1315__.measure(id),bid);
ok(box&&box.h>=box.ah*.6&&box.h<=box.ah*1.7,'보스 키 '+Math.round(box?.h)+'px / 2D 기준 '+Math.round(box?.ah)+'px');
await p.screenshot({path:path.join(HERE,'r1315-boss.png')});
await p.evaluate(()=>{const e=room.enemies.find(e=>e.id===__t.b);e.phase=((Number(e.phase)||0)+1)%3;});await p.waitForTimeout(250);
ok((await pose(bid))==='special','패턴 단계 바뀜 → special ('+(await pose(bid))+')');
// ⑥ 끄기
await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1315__.set(false));await p.waitForTimeout(600);
I=await API();ok(I.shown===0,'끄면 3D 0 ('+I.shown+')');
cmd=await cmdOf([bid]);ok(cmd.body>0,'끄면 2D 보스 몸 복귀('+cmd.body+')');
await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1315__.set(true));
// ⑦ 다른 보스 맵
await go(p,'ep1b03');await p.evaluate(()=>{const e=room.enemies.find(e=>e.boss)||room.enemies[0];e.spawnState='active';e.visible=true;player.x=e.x+1.5;player.y=e.y+1.5;});await p.waitForTimeout(2500);
I=await API();ok(I.shown===0,'ep1b03(질투 보스 맵)에서는 3D 없음 ('+I.shown+')');
ok(!errs.length,'페이지 오류 0 '+errs.slice(0,3).join(' | '));
try{fs.unlinkSync(path.join(HERE,'_k.png'));}catch(_){}
console.log(fail?'R1315 BROWSER FAIL '+fail:'R1315 BROWSER ALL OK');await b.close();process.exit(fail?1:0);
