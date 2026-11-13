// R963 브라우저 검사(헤드리스·소프트웨어 렌더링 — 그래픽/실기기 검증 아님): 무한 생존에서 곡 소개 쪽지와 생존 안내 줄이 겹치지 않는가.
//  쪽지는 곡이 바뀔 때 R313 이 스스로 띄운다(검사는 띄우지 않고 기다린다). 자리는 불투명도와 무관하므로 요소가 생긴 뒤 사각형을 잰다.
//  화면 크기 여러 개, 안내 줄이 보스 막대 아래로 내려간 상태(.low)까지. SW_URL 기본 http://127.0.0.1:4410/m0/
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';let fail=0;
const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,400):'');if(!c)fail++;};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540}});const p=await ctx.newPage();
await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:240000});
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="hwando"]').click();await p.locator('#r600Go').click();
await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:300000});
const got=await p.waitForFunction(()=>!!document.getElementById('r331BgmNote')&&document.getElementById('r600Hud')?.classList.contains('on'),null,{timeout:420000}).then(()=>true).catch(()=>false);
ok('the BGM note appeared by itself during survival',got);
const measure=low=>p.evaluate(low=>{const n=document.getElementById('r331BgmNote'),h=document.getElementById('r600Hud');if(!n||!h)return null;const had=h.classList.contains('low');h.classList.toggle('low',low);
 const a=n.getBoundingClientRect(),c=h.getBoundingClientRect();h.classList.toggle('low',had);const ix=Math.max(0,Math.min(a.right,c.right)-Math.max(a.left,c.left)),iy=Math.max(0,Math.min(a.bottom,c.bottom)-Math.max(a.top,c.top));
 return{note:[Math.round(a.top),Math.round(a.bottom)],hud:[Math.round(c.top),Math.round(c.bottom)],overlap:Math.round(ix*iy),on:document.body.classList.contains('r600On'),text:n.textContent.slice(0,40)};},low);
if(got)for(const [w,h] of [[1280,720],[960,540],[640,360],[844,390],[390,844]]){await p.setViewportSize({width:w,height:h});await p.waitForTimeout(400);
 for(const low of [false,true]){const m=await measure(low);ok(`${w}x${h}${low?' (HUD under boss bar)':''}: note and survival HUD do not overlap`,!!m&&m.on&&m.overlap===0,m);}}
await p.screenshot({path:process.env.OUT||'/dev/null'}).catch(()=>{});
await b.close();console.log(fail?`R963 browser: ${fail} FAILED`:'R963 browser: all passed');process.exit(fail?1:0);
