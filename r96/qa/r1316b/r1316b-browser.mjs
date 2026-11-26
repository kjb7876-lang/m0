// R1316b — 브라우저 검사(헤드리스, 그래픽 검증 아님). ③ 불면귀 마을 3D 0. ① 무한생존 방 표식(room.survivalR600)이면 R1316·R1317 3D 0
// ② R217 시야 배율 1 → .7 로 바꾸면 3D 몹의 2D 목표 키가 약 1/.7 배로 따라가고, 3D 키도 그 .75~1.3 배 안
// 실행: 정적 서버(http://127.0.0.1:4410/m0/) 뒤 `node r96/qa/r1316b/r1316b-browser.mjs`
import {chromium,go,URL as BASE} from '../r444/lib.mjs';
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto(BASE+'?mob3d16=1&mob3d17=1');await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
await p.evaluate(()=>{window.__STORYWORLD_MOB3D_R1316__.preload();window.__STORYWORLD_MOB3D_R1317__.preload();});
await p.waitForFunction(()=>window.__STORYWORLD_MOB3D_R1316__.inspect().loaded.length>=21&&window.__STORYWORLD_MOB3D_R1317__.inspect().loaded.length>=9,null,{timeout:400000}).catch(()=>{});
const API=k=>p.evaluate(k=>window['__STORYWORLD_MOB3D_'+k+'__'].inspect(),k);
for(const [zone,name,K] of [['ep1b07','분노의 사냥개','R1316'],['ep1a11','거짓천국 근위천사','R1317']]){
 await go(p,zone);
 const id=await p.evaluate(name=>{player.hp=player.maxHp=1e6;for(const e of room.enemies)e.damage=0;const strip=n=>String(n).replace(/^중간보스 · /,'').replace(/ (후속 증원|우두머리|증원|추격대)$/,'');
  const s=room.enemies.find(e=>!e.boss&&e.hp>0&&strip(e.name)===name);s.hp=s.maxHp=1e6;s.speed=0;s.x=player.x-1.4;s.y=player.y-1.0;s.homeX=s.x;s.homeY=s.y;s.nav=[];window.__s=s;return String(s.id);},name);
 await p.waitForFunction(([k,id])=>window['__STORYWORLD_MOB3D_'+k+'__'].inspect().instances.some(x=>x.id===id&&x.visible&&x.target>8),[K,id],{timeout:120000}).catch(()=>{});
 await p.waitForTimeout(2500);
 const m1=await p.evaluate(([k,id])=>window['__STORYWORLD_MOB3D_'+k+'__'].measure(id),[K,id]);
 ok(m1&&m1.target>8,name+' 배율 1: 2D 목표 '+Math.round(m1?.target)+'px, 3D '+Math.round(m1?.h)+'px');
 await p.evaluate(()=>window.__STORYWORLD_VIEW_R217__.set(.7));await p.waitForTimeout(4000);
 await p.evaluate(()=>{const s=window.__s;s.x=player.x-1.0;s.y=player.y-.7;s.homeX=s.x;s.homeY=s.y;});await p.waitForTimeout(2500);
 const m2=await p.evaluate(([k,id])=>window['__STORYWORLD_MOB3D_'+k+'__'].measure(id),[K,id]);
 const f=await p.evaluate(()=>window.__STORYWORLD_VIEW_R217__.factor());
 const want=m1?.target/f;ok(m2&&Math.abs(m2.target/want-1)<.12,name+' 배율 '+f+': 2D 목표 '+Math.round(m2?.target)+'px(기대 약 '+Math.round(want)+')');
 ok(m2&&m2.h>=m2.target*.75&&m2.h<=m2.target*1.3,name+' 배율 '+f+': 3D 키 '+Math.round(m2?.h)+'px / 목표 '+Math.round(m2?.target)+'px');
 await p.evaluate(()=>window.__STORYWORLD_VIEW_R217__.set(1));await p.waitForTimeout(1500);
 // ① 무한생존 방 표식
 await p.evaluate(()=>{room.survivalR600={centre:{x:player.x,y:player.y}};});await p.waitForTimeout(800);
 const I=await API(K);ok(I.shown===0&&!I.active,K+' 무한생존 방이면 3D 0 ('+I.shown+')');
 await p.evaluate(()=>{delete room.survivalR600;});
}
// ③ 불면귀 마을(last302·last303): 2D 그림 퀄이 좋아 3D 몹 제외(사용자 11-26)
for(const zone of ['last302','last303']){
 await go(p,zone);await p.waitForTimeout(2500);
 const n=await p.evaluate(()=>room.enemies.filter(e=>!e.boss&&e.hp>0).length);
 for(const K of ['R1316','R1317']){const I=await API(K);ok(I.shown===0&&!I.active,zone+' '+K+' 3D 0 (2D 몹 '+n+'마리, 3D '+I.shown+')');}
}
const a=await API('R1316'),c=await API('R1317');ok(!errs.length,'페이지 오류 0 '+errs.slice(0,2).join(' | '));ok(a.stats.errors===0&&c.stats.errors===0,'오버레이 오류 0 '+(a.lastError||'')+(c.lastError||''));
console.log(fail?'R1316b BROWSER FAIL '+fail:'R1316b BROWSER ALL OK');await b.close();process.exit(fail?1:0);
