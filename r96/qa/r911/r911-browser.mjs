// R911 브라우저(헤드리스) 검사: 빌드된 사이트에서 서하·기억사수로 기본 공격을 하며, 그려진 모든 투사체의
//  (확대 전 몸통 크기 × R911 배율) 이 영웅 화면 키 절반 이상인지, 페이지 오류·R911 측정 오류가 없는지 본다. 2D·3D(scene3d) 둘 다.
//  실행: SW_URL=http://127.0.0.1:4411/m0/ node r96/qa/r911/r911-browser.mjs
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));const {chromium}=createRequire(import.meta.url)('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4411/m0/';const HELPER=fs.readFileSync(path.join(HERE,'../r795/page-helper.js'),'utf8');
let fail=0,pass=0;const ok=(c,m,d)=>{if(c){pass++;console.log('  ✓ '+m);}else{fail++;console.log('  ✗ '+m+(d!==undefined?' — '+JSON.stringify(d).slice(0,400):''));}};
const b=await chromium.launch();
for(const [hero,s3d] of [['seoha',false],['gunner',true]]){
 const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
 await ctx.addInitScript(on=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on}));},s3d);
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.goto(URL,{timeout:240000});await p.locator('#campaignNew54').click({timeout:180000});await p.locator(`.heroRowR101 button[data-hero="${hero}"]`).click({timeout:20000});await p.locator('#slotConfirmR73').click();
 const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(600);await skip();
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
 await p.evaluate(async z=>{if(zone!==z)await enterRegion(z,null,{layer:'STORY',restore:true});},'dist00');await p.waitForFunction(()=>!loading&&zone==='dist00',null,{timeout:150000});await skip();
 await p.addScriptTag({content:HELPER});
 const tag=`${hero}${s3d?'·3D':'·2D'}`;
 const has=await p.evaluate(()=>!!window.__STORYWORLD_PROJ_SIZE_R911__&&window.__STORYWORLD_PROJ_SIZE_R911__.enabled);ok(has,`${tag}: R911 이 켜진 채 올라왔다`);
 if(has)await p.evaluate(()=>{const R=window.__STORYWORLD_PROJ_SIZE_R911__;window.__chk={rows:[]};const outer=drawProjectile;drawProjectile=function(b,...a){if(!ctx?.__r911probe&&b&&!window.__chk.busy&&window.__chk.rows.length<400){window.__chk.busy=1;try{const m=R.measure(b);if(m)window.__chk.rows.push({f:!!b.friendly,size:m.size,k:R.scaleFor(m.size),half:R.minPx()});}finally{window.__chk.busy=0;}}return outer.call(this,b,...a);};});
 for(let i=0;i<14;i++){await p.evaluate(()=>{player.hp=maxHP();__HQ795.engage(false);});await p.keyboard.down('a');await p.evaluate(()=>__HQ795.step(.4,2));await p.keyboard.up('a');}
 const r=await p.evaluate(()=>({rows:window.__chk?.rows||[],stats:window.__STORYWORLD_PROJ_SIZE_R911__?.stats,errors:window.__STORYWORLD_PROJ_SIZE_R911__?.errors?.()||[],redirect:window.__STORYWORLD_PROJ_SIZE_R911__?.stats?.redirected||0,replaced:window.__STORYWORLD_PROJ_SIZE_R911__?.stats?.replaced||0,top:drawProjectile.__r911===true||String(drawProjectile).length>0}));
 const hero_=r.rows.filter(x=>x.f);ok(hero_.length>=5,`${tag}: 영웅 투사체 ${hero_.length}개를 그렸다`);
 const small=r.rows.filter(x=>x.size*x.k<x.half-.5&&x.k<5.99);ok(!small.length,`${tag}: 그려진 투사체 ${r.rows.length}개 모두 (몸통×배율) ≥ 영웅 키 절반(6배 상한에 걸린 것 제외)`,small.slice(0,5));
 ok((r.stats?.scaled||0)>0,`${tag}: 실제로 키운 그리기가 있다(scaled=${r.stats?.scaled})`);
 ok(!r.errors.length,`${tag}: R911 측정 중 오류 없음`,r.errors);
 ok(!errs.length,`${tag}: 페이지 오류 없음`,errs);
await p.evaluate(()=>{try{readyImage('assets/vfx/heroes/gunner-laser-bullet.webp');readyImage('assets/vfx/generated/v300/time-ring.webp');}catch(_){}});await p.waitForTimeout(2500);
 if(hero==='gunner'){const src=await p.evaluate(()=>{const row=readyImage('assets/vfx/heroes/gunner-laser-bullet.webp');return row?.image?.src||row?.image?.currentSrc||null;});ok(/r911\/derived\/gunner-laser-bullet/.test(String(src)),`${tag}: 기억사수 기본탄이 실제로 대체 사본을 읽었다`,src);}
 const csrc=await p.evaluate(()=>{const row=readyImage('assets/vfx/generated/v300/time-ring.webp');return row?.image?.src||null;});ok(/r911\/clean\//.test(String(csrc)),`${tag}: 잔선 정리 사본(time-ring)을 실제로 읽었다`,csrc);
 await ctx.close();}
await b.close();console.log(`\nR911 browser ${pass} 통과 / ${fail} 실패`);process.exit(fail?1:0);
