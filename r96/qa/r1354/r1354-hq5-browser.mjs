// R1354 Dots 리깅 hq5 — 다시 넣은 호텔 그룹 회장·검은 소화액 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님, GPU·실기기 미검증).
//  R1339 브라우저 검사(qa/r1339/r1339-browser.mjs)와 같은 방법·기준: ① hq 켜짐에서 새 GLB 로 3D, 키 2D 보이는 키의 .75~1.3배 ② ?hq39=0 옛 GLB ③ 오류 0.
//  나머지 8종은 R1339 검사가 그대로 본다(표가 hq5 를 가리킴).
// 실행: 정적 서버 뒤 `SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1354/r1354-hq5-browser.mjs`
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {chromium,URL as BASE} from '../r444/lib.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const ALL=[['ep1b08','백색 정장의 호텔 그룹 회장','__STORYWORLD_BOSS3D_R1322C__','hotelChairman'],
 ['ep1b04','끓어오르는 검은 소화액','__STORYWORLD_MOB3D_R1330__','digestiveFluid']];
const want=process.argv.slice(2);const CASES=want.length?ALL.filter(c=>want.includes(c[3])):ALL;
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
for(const mode of ['hq','old']){
 const errs=[];const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(BASE+'?boss3d22c=1&mob3d22=1&sin7mob30=1&hq39='+(mode==='hq'?1:0));await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
 const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
 for(const [zone,name,api,kind] of CASES){
  await p.evaluate(z=>{if(room?.id!==z)enterRegion(z,null,{layer:'STORY',restore:true});},zone);await p.waitForFunction(z=>!loading&&room?.id===z,zone,{timeout:150000});await skip();
  const id=await p.evaluate(name=>{player.hp=player.maxHp=1e6;for(const e of room.enemies)e.damage=0;
   const s=room.enemies.find(e=>e.hp>0&&String(e.name).replace(/^중간보스 · /,'')===name);if(!s)return null;
   s.hp=s.maxHp=1e7;s.speed=0;if('spawnState'in s)s.spawnState='active';s.visible=true;s.x=player.x-1.4;s.y=player.y-1.0;s.homeX=s.x;s.homeY=s.y;s.nav=[];
   for(const o of room.enemies)if(o!==s&&Math.hypot(o.x-player.x,o.y-player.y)<5){o.x+=25;o.homeX=o.x;}return String(s.id);},name);
  if(!id){ok(false,mode+' '+zone+' '+name+' 찾기');continue;}
  await p.waitForFunction(([api,id])=>window[api].inspect().instances.some(x=>x.id===id&&x.visible&&x.target>8),[api,id],{timeout:240000}).catch(()=>{});
  await p.waitForTimeout(2500);
  const it=await p.evaluate(([api,id])=>window[api].inspect().instances.find(x=>x.id===id),[api,id]);
  ok(it&&it.visible&&it.kind===kind,mode+' '+zone+' '+name+' → '+kind+' 3D ('+(it&&it.kind)+')');
  const m=await p.evaluate(([api,id])=>window[api].measure(id),[api,id]);
  ok(m&&m.target>8&&m.h>=m.target*.75&&m.h<=m.target*1.3,mode+' '+name+' 3D 키 '+Math.round(m?.h)+'px / 2D 보이는 키 '+Math.round(m?.target)+'px');
  await p.screenshot({path:path.join(HERE,'r1354-'+kind+'-'+mode+'.png')});
 }
 const H=await p.evaluate(()=>window.__STORYWORLD_MOB3D_HQ_R1339__.inspect());
 if(mode==='hq')ok(H.on&&H.stats.swapped>=1,'hq 바꿔치기 '+H.stats.swapped+'회 '+JSON.stringify(H.seen.slice(-3)));
 else ok(!H.on&&H.stats.swapped===0,'?hq39=0 → 바꿔치기 0 ('+H.stats.swapped+')');
 for(const api of ['__STORYWORLD_MOB3D_R1322__','__STORYWORLD_BOSS3D_R1322C__','__STORYWORLD_MOB3D_R1330__']){const I=await p.evaluate(a=>window[a].inspect(),api);ok(!I.failed?.length&&!(I.stats?.errors>0),mode+' '+api+' 실패·오류 0 '+JSON.stringify(I.failed||[])+' '+(I.lastError||''));}
 ok(!errs.length,mode+' 페이지 오류 0 '+errs.slice(0,2).join(' | '));await ctx.close();
}
console.log(fail?'R1354 HQ5 BROWSER FAIL '+fail:'R1354 HQ5 BROWSER ALL OK');await b.close();process.exit(fail?1:0);
