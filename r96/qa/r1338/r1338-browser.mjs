// R1338 발록 3D v4 선택 적용 — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 품질 검증 아님).
//  ① 기본(설정 없음) = 2D 발록: 오버레이 꺼짐·3D 0·2D 몸 그림 그대로
//  ② 설정 화면에 '3D 발록(v4)' 체크가 생기고, 켜면 v4 모델을 읽어 발록을 3D 로(2D 몸 그림 빠짐, 3D 키가 2D 보이는 키의 .75~1.3배)
//  ③ 다시 끄면 3D 0·2D 몸 그림 돌아옴  ④ 주소 ?balrog3d38=1 이면 켜진 채 시작  ⑤ 페이지 오류 0·오버레이 오류 0
// 실행: 정적 서버(http://127.0.0.1:4410/m0/) 뒤 `node r96/qa/r1338/r1338-browser.mjs`
//  · 배포 전 확인용: R1338_INJECT=<r96/runtime-text 경로> 와 SW_URL=<공개 주소> 를 주면 index.html 에 이 태그를 끼우고
//    오버레이·모델 파일을 그 경로에서 내어 준다(나머지는 그 주소의 게임 그대로).
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {chromium,skip,URL as BASE} from '../r444/lib.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url));const INJ=process.env.R1338_INJECT||'';
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errs=[];
async function context(){const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 if(INJ){
  await ctx.route(u=>{const s=String(u);return s.startsWith(BASE)&&/\/m0\/(index\.html)?(\?.*)?$/.test(s.split('#')[0]);},async r=>{const res=await r.fetch();let t=await res.text();
   if(!t.includes('mob-3d-r1338.js'))t=t.replace('<script src="./mob-3d-r1315.js"></script>','<script src="./mob-3d-r1315.js"></script>\n<script src="./mob-3d-r1338.js"></script>');
   await r.fulfill({response:res,body:t,headers:{...res.headers(),'content-type':'text/html; charset=utf-8'}});});
  await ctx.route(/\/mob-3d-r1338\.js(\?.*)?$/,r=>r.fulfill({path:path.join(INJ,'mob-3d-r1338.js'),contentType:'text/javascript'}));
  await ctx.route(/\/assets\/r1338\/SW-R1338_balrog_v4\.glb(\?.*)?$/,r=>r.fulfill({path:path.join(INJ,'assets/r1338/SW-R1338_balrog_v4.glb'),contentType:'model/gltf-binary'}));
 }
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e).slice(0,300)));return {ctx,p};}
const API=p=>p.evaluate(()=>window.__STORYWORLD_BALROG3D_R1338__.inspect());

// ④ 주소 강제
{const {ctx,p}=await context();await p.goto(BASE+'?balrog3d38=1');await p.waitForFunction(()=>!!window.__STORYWORLD_BALROG3D_R1338__,null,{timeout:180000});
 ok(await p.evaluate(()=>window.__STORYWORLD_BALROG3D_R1338__.on())===true,'?balrog3d38=1 → 켜진 채 시작');await ctx.close();}

const {ctx,p}=await context();
await p.goto(BASE);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
ok(await p.evaluate(()=>window.__STORYWORLD_BALROG3D_R1338__.on())===false,'기본값 꺼짐(2D 발록)');
await p.evaluate(()=>{if(room?.id!=='dist06')enterRegion('dist06',null,{layer:'STORY',restore:true});});
await p.waitForFunction(()=>!loading&&room?.id==='dist06',null,{timeout:150000});await skip(p);
const place=()=>p.evaluate(()=>{player.hp=player.maxHp=1e6;for(const e of room.enemies)e.damage=0;
 const s=room.enemies.find(e=>e.hp>0&&String(e.name).startsWith('발록'));if(!s)return null;
 s.hp=s.maxHp=1e7;s.speed=0;if('spawnState'in s)s.spawnState='active';s.visible=true;s.x=player.x-1.6;s.y=player.y-1.2;s.homeX=s.x;s.homeY=s.y;s.nav=[];
 for(const o of room.enemies)if(o!==s&&Math.hypot(o.x-player.x,o.y-player.y)<7){o.x+=25;o.homeX=o.x;}return String(s.id);});
const body2D=id=>p.evaluate(id=>{const h=window.__STORYWORLD_PHASE1__.controller.state.three;return new Promise(res=>{const base=h.commands.render;h.commands.render=function(cmds){const out=base.apply(this,arguments);h.commands.render=base;
 res(cmds.filter(c=>c?.owner&&!c.owner.r350&&(c.owner.id==='enemy:'+id||c.owner.id==='r248:mob:'+id)&&c.kind==='image'&&/\/bosses\/dist06-/.test(String(c.sourcePath||''))).length);return out;};});},id);
const id=await place();ok(!!id,'지옥문에 발록 있음');
await p.waitForTimeout(3000);
let I=await API(p);ok(I.shown===0,'꺼져 있으면 3D 0');const n2a=await body2D(id);ok(n2a>0,'2D 발록 몸 그림 그대로('+n2a+')');
await p.screenshot({path:path.join(HERE,'r1338-2d.png')});
// ② 설정 화면 체크
const row=await p.evaluate(()=>{try{showSettings();}catch(_){}const el=document.getElementById('balrog3dR1338Toggle');return el?{checked:el.checked,text:document.getElementById('balrog3dR1338Row')?.textContent||''}:null;});
ok(!!row&&row.checked===false&&/3D 발록/.test(row.text),'설정 화면에 3D 발록(v4) 체크(꺼짐) '+JSON.stringify(row&&row.text.slice(0,30)));
await p.evaluate(()=>{const el=document.getElementById('balrog3dR1338Toggle');if(el){el.checked=true;el.dispatchEvent(new Event('change'));}});
ok(await p.evaluate(()=>window.__STORYWORLD_BALROG3D_R1338__.on()&&localStorage.getItem('storyworld.r1338.balrog3d')==='on'),'체크하면 켜짐·저장');
await p.evaluate(()=>{try{closePanel(true);}catch(_){}});
await p.waitForFunction(id=>window.__STORYWORLD_BALROG3D_R1338__.inspect().instances.some(x=>x.id===id&&x.visible&&x.target>8),id,{timeout:240000}).catch(()=>{});
await p.waitForTimeout(2500);
I=await API(p);const it=I.instances.find(x=>x.id===id);ok(I.loaded.includes('balrog')&&!I.failed.length,'v4 모델 읽음 '+JSON.stringify(I.failed)+' '+(I.lastError||''));
ok(!!it&&it.visible&&it.kind==='balrog','발록 → 3D');
const n3=await body2D(id);ok(n3===0,'2D 몸 그림 빠짐('+n3+')');
const m=await p.evaluate(id=>window.__STORYWORLD_BALROG3D_R1338__.measure(id),id);
ok(!!m&&m.target>8&&m.h>=m.target*.75&&m.h<=m.target*1.3,'3D 키 '+Math.round(m?.h)+'px / 2D 보이는 키 '+Math.round(m?.target)+'px');
await p.screenshot({path:path.join(HERE,'r1338-3d.png')});
// ③ 끄기
await p.evaluate(()=>window.__STORYWORLD_BALROG3D_R1338__.set(false));await p.waitForTimeout(1500);
I=await API(p);ok(I.shown===0,'끄기 → 3D 0');const n2b=await body2D(id);ok(n2b>0,'끄면 2D 몸 그림 돌아옴('+n2b+')');
ok(!errs.length,'페이지 오류 0 '+errs.slice(0,2).join(' | '));ok(I.stats.errors===0,'오버레이 오류 0 '+(I.lastError||''));
console.log(fail?'R1338 BROWSER FAIL '+fail:'R1338 BROWSER ALL OK');await b.close();process.exit(fail?1:0);
