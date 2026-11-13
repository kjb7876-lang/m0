// R912 브라우저(헤드리스) 검사: 빌드된 사이트에서 영웅 넷으로 공격·스킬을 쓰며 시트가 실제로 그려지는지,
//  적중 효과가 뜨는지, R911 기준(영웅 키 절반)을 지키는지, 페이지·Three.js 오류가 없는지 본다. 2D 셋 + 3D 하나. 장면도 찍는다.
//  실행: SW_URL=http://127.0.0.1:4411/m0/ node r96/qa/r912/r912-browser.mjs [영웅,영웅…]
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));const {chromium}=createRequire(import.meta.url)('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4411/m0/';const HELPER=fs.readFileSync(path.join(HERE,'../r795/page-helper.js'),'utf8');
const SHOTS=path.join(HERE,'review');fs.mkdirSync(SHOTS,{recursive:true});
let fail=0,pass=0;const ok=(c,m,d)=>{if(c){pass++;console.log('  ✓ '+m);}else{fail++;console.log('  ✗ '+m+(d!==undefined?' — '+JSON.stringify(d).slice(0,500):''));}};
const WANT={seoha:['pj01','pj05','pj06'],hunter:['pj02','pj07'],michaela:['pj03'],gunner:['pj04']};
const list=(process.argv[2]||'seoha,hunter,michaela,gunner').split(',');
const b=await chromium.launch();
for(const hero of list){const s3d=hero==='gunner';
 const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
 await ctx.addInitScript(on=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on}));localStorage.setItem('storyworld.r663.skillgrowth',JSON.stringify({on:false}));},s3d);
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.goto(URL,{timeout:240000});await p.locator('#campaignNew54').click({timeout:180000});await p.locator(`.heroRowR101 button[data-hero="${hero}"]`).click({timeout:20000});await p.locator('#slotConfirmR73').click();
 const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(600);await skip();
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
 await p.evaluate(async z=>{if(zone!==z)await enterRegion(z,null,{layer:'STORY',restore:true});},'dist00');await p.waitForFunction(()=>!loading&&zone==='dist00',null,{timeout:150000});await skip();
 await p.addScriptTag({content:HELPER});const tag=`${hero}${s3d?'·3D':'·2D'}`;
 const has=await p.evaluate(()=>!!window.__STORYWORLD_PROJ_SHEETS_R912__?.enabled&&!!window.__STORYWORLD_PROJ_SIZE_R911__?.enabled&&drawProjectile.__r911===true);ok(has,`${tag}: R912 가 켜져 있고 R911 이 맨 바깥이다`);
 await p.evaluate(()=>{const A=window.__STORYWORLD_PROJ_SHEETS_R912__,R=window.__STORYWORLD_PROJ_SIZE_R911__;window.__k={seen:{},rows:[],fresh:{}};window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};
  const outer=drawProjectile;drawProjectile=function(b,...a){if(!ctx?.__r911probe&&b&&!window.__k.busy){window.__k.busy=1;try{const k=A.kindOf(b)||'-';window.__k.seen[k]=(window.__k.seen[k]||0)+1;if(k!=='-'&&!window.__k.fresh[k]&&b.age>.08)window.__k.fresh[k]=b;if(window.__k.rows.length<500){const m=R.measure(b);if(m)window.__k.rows.push({k:A.applied(b)?k:'-',size:m.size,s:R.scaleFor(m.size),half:R.minPx()});}}finally{window.__k.busy=0;}}return outer.call(this,b,...a);};});
 const KEYS=['a','a','q','a','a','s','a','q','a','a'];const shot={};
 for(let i=0;i<24;i++){await p.evaluate(()=>{player.hp=maxHP();__HQ795.engage(false);});const k=KEYS[i%KEYS.length];await p.keyboard.down(k);await p.evaluate(()=>__HQ795.step(.4,2));await p.keyboard.up(k);await skip();
  const fr=await p.evaluate(()=>{const out=[];for(const [k,b] of Object.entries(window.__k.fresh)){if(b===true)continue;if(!b.dead&&projectiles.includes(b)){window.__SLOW=1e-4;const r=document.getElementById('game').getBoundingClientRect(),q=project(b.x,b.y);out.push({k,x:q.x+r.left,y:q.y+r.top-18*zoom,w:r.width,h:r.height});window.__k.fresh[k]=true;break;}else delete window.__k.fresh[k];}return out;});
  for(const f of fr){const S=200,clip={x:Math.round(f.x-S/2),y:Math.round(f.y-S/2),width:S,height:S};if(clip.x>=0&&clip.y>=0&&clip.x+S<=f.w&&clip.y+S<=f.h&&!shot[f.k]){await p.evaluate(()=>{draw();draw();});await p.screenshot({path:path.join(SHOTS,`fly-${hero}-${f.k}.png`),clip});shot[f.k]=1;}else await p.evaluate(k=>{delete window.__k.fresh[k];},f.k);}
  await p.evaluate(()=>{window.__SLOW=1;});}
 // 적중 장면: 적중 효과가 떠 있는 순간을 멈춰 찍는다
 for(let i=0;i<10&&!shot.hit;i++){await p.keyboard.down('a');await p.evaluate(()=>__HQ795.step(.25,2));await p.keyboard.up('a');
  const f=await p.evaluate(()=>{const e=effects.find(e=>e.type==='r912hit'&&e.age>.05&&e.age<.2);if(!e)return null;window.__SLOW=1e-4;const r=document.getElementById('game').getBoundingClientRect(),q=project(e.x,e.y);return{x:q.x+r.left,y:q.y+r.top-18*zoom,w:r.width,h:r.height};});
  if(f){const S=220,clip={x:Math.round(f.x-S/2),y:Math.round(f.y-S/2),width:S,height:S};if(clip.x>=0&&clip.y>=0&&clip.x+S<=f.w&&clip.y+S<=f.h){await p.evaluate(()=>{draw();draw();});await p.screenshot({path:path.join(SHOTS,`hit-${hero}.png`),clip});shot.hit=1;}}await p.evaluate(()=>{window.__SLOW=1;});}
 const r=await p.evaluate(()=>({seen:window.__k.seen,rows:window.__k.rows,st:window.__STORYWORLD_PROJ_SHEETS_R912__.stats,er:window.__STORYWORLD_PROJ_SHEETS_R912__.errors(),e911:window.__STORYWORLD_PROJ_SIZE_R911__.errors(),ph:window.__STORYWORLD_PHASE1__?.controller?.state?.reason||null,modal:!!modal}));
 for(const k of WANT[hero]||[])ok((r.seen[k]||0)>0,`${tag}: ${k} 탄을 그렸다(${r.seen[k]||0}번)`,r.seen);
 ok(r.st.swapped+r.st.direct>0&&r.st.missed<=r.st.draws*.05,`${tag}: 시트로 바꿔 그림 ${r.st.swapped}+${r.st.direct}번, 못 바꾼 그리기 ${r.st.missed}/${r.st.draws}`,r.st);
 ok(r.st.hits>0&&r.st.hitDraws>0,`${tag}: 적중 효과 ${r.st.hits}번 생기고 ${r.st.hitDraws}번 그려졌다`,r.st);
 const mine=r.rows.filter(x=>x.k!=='-');const small=mine.filter(x=>x.size<x.half-.5);ok(mine.length>0&&!small.length,`${tag}: 시트로 그린 탄 ${mine.length}개 모두 R911 확대 없이도 몸통 ≥ 영웅 키 절반`,small.slice(0,4));
 const any=r.rows.filter(x=>x.size*x.s<x.half-.5&&x.s<5.99);ok(!any.length,`${tag}: 그려진 투사체 ${r.rows.length}개 모두 기준 이상`,any.slice(0,4));
 ok(!r.er.length&&!r.e911.length&&!errs.length,`${tag}: 모듈·페이지 오류 없음`,{er:r.er,e911:r.e911,errs});
 ok(!r.ph||!/Nonfinite|fail/i.test(String(r.ph)),`${tag}: Three.js 그리기 명령 실패 없음`,r.ph);
 console.log('   kinds',JSON.stringify(r.seen),'shots',Object.keys(shot).join(','));
 await ctx.close();}
await b.close();console.log(`\nR912 browser ${pass} 통과 / ${fail} 실패`);process.exit(fail?1:0);
