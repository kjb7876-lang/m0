// R1149 스토리 협동 적 체력 배수 헤드리스 검사: 방장·친구 두 브라우저가 스토리 '함께 시작' 뒤 전투 지역에 들어가면
//  인원수 복제 몹이 없고 몹 체력이 혼자 값의 2배인지, 친구가 나가면 혼자 값으로 돌아오는지 본다(옛 R62 서버 고정본).
// 실행: 빌드한 site 를 http://127.0.0.1:4396/ 에 올린 뒤  node r96/qa/r1149/r1149-story-browser.mjs
// 헤드리스 소프트웨어 렌더링 검사다. 실기기·사람 여럿의 자연 플레이·실제 Render 서버는 미검증.
import {createRequire} from 'node:module';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url);const {chromium}=require('playwright');
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');const BASE=process.env.BASE||'http://127.0.0.1:4396/';
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(c)console.log('ok  ',m);else{bad++;console.log('FAIL',m,d===undefined?'':JSON.stringify(d).slice(0,700));}};
const mod=await import(pathToFileURL(path.join(ROOT,'relay/test/fixtures/server-r62.mjs')).href);
const browser=await chromium.launch({args:['--disable-dev-shm-usage']});
async function page(){const ctx=await browser.newContext({viewport:{width:640,height:400}});const p=await ctx.newPage();p.errors=[];p.on('pageerror',e=>p.errors.push(e.message));
 await p.goto(BASE,{timeout:90000});await p.waitForFunction(()=>typeof booted!=='undefined'&&booted&&!!document.getElementById('coopCreate62'),null,{timeout:120000});
 await p.evaluate(()=>{window.__err=[];window.__STORYWORLD_COOP_CLIENT_R62__.on('error',e=>window.__err.push(e.code));try{settings.sound=false;settings.music=false;settings.narration=false;}catch(_){}});return p;}
async function openCoop(p,id){await p.evaluate(()=>{const d=document.querySelector('details.r1015TitleMore');if(d)d.open=true;});await p.click(id);}
async function until(p,fn,arg,ms,label){try{await p.waitForFunction(fn,arg,{timeout:ms,polling:250});return true;}catch(_){console.log('  (기다림 끝)',label);return false;}}
const playing=()=>window.__STORYWORLD_COOP_CLIENT_R62__.inspect().phase==='playing';
const mobs=p=>p.evaluate(()=>({zone,rows:room.enemies.filter(e=>e.hp>0).map(e=>({id:e.id,native:e.nativeId,hp:e.hp,max:e.maxHp,k:e.r1149K||1,rep:!!e.coopReplicaR62})),size:room.coopSizeR62}));
const relay=mod.createRelay({production:false});const addr=await relay.listen(0,'127.0.0.1');const endpoint=`ws://127.0.0.1:${addr.port}/ws`;
const host=await page(),guest=await page();
try{
 await openCoop(host,'#coopCreate62');await host.waitForSelector('#coopRelay62');await host.fill('#coopRelay62',endpoint);await host.fill('#coopNick62','방장');await host.click('#coopConnect62');
 ok(await until(host,()=>{const c=window.__STORYWORLD_COOP_CLIENT_R62__.inspect();return c.status==='connected'&&!!c.code;},null,30000,'host'),'방장 방 만들기');
 // 혼자(방장만)일 때: 전투 지역의 혼자 값 기록
 const id=await host.evaluate(()=>window.__STORYWORLD_SURVIVAL_R600__.pure.stageIds(regions)[0]);
 await host.click('#coopStart62');ok(await until(host,playing,null,180000,'solo start'),'방장 혼자 함께 시작');
 await host.evaluate(()=>{try{closePanel(true);}catch(_){}});
 /* 새 판에서는 첫 전투 지역이 아직 잠겨 있다 → 생존 본체가 쓰는 것과 같은 길(권한 있는 지역 불러오기 질문에 이 지역만 예)로 들어간다 */
 const went=await host.evaluate(async id=>{const CO=window.__STORYWORLD_COOP_SIM_R62__;window.__STORYWORLD_COOP_SIM_R62__={...CO,authoritativeRegionLoad:(r,l)=>r===id||!!CO.authoritativeRegionLoad?.(r,l)};try{return await enterRegion(id,null,{layer:'STORY',restore:true,noStory:true});}catch(e){return String(e);}finally{window.__STORYWORLD_COOP_SIM_R62__=CO;}},id);
 ok(await until(host,id=>zone===id&&window.__STORYWORLD_COOP_CLIENT_R62__.inspect().phase==='playing'&&!loading,id,180000,'solo region'),`방장 혼자 전투 지역(${id}) 진입`,went);
 await host.waitForTimeout(1500);const solo=await mobs(host);
 ok(solo.rows.length>0&&solo.rows.every(e=>e.k===1&&!e.rep),'혼자일 때는 배수 1·복제 없음(예전 그대로)',solo.rows.slice(0,3));
 // 친구 참가(늦은 참가) → 2배
 const code=await host.evaluate(()=>window.__STORYWORLD_COOP_CLIENT_R62__.inspect().code);
 await openCoop(guest,'#coopJoin62');await guest.waitForSelector('#coopCode62');await guest.fill('#coopCode62',code);await guest.fill('#coopRelay62',endpoint);await guest.fill('#coopNick62','친구');await guest.selectOption('#coopHero62','seoha');await guest.click('#coopConnect62');
 ok(await until(guest,()=>window.__STORYWORLD_COOP_CLIENT_R62__.inspect().status==='connected',null,30000,'guest'),'친구 참가');
 ok(await until(host,()=>window.__STORYWORLD_COOP_SIM_R62__.players().length===2&&room.enemies.filter(e=>e.hp>0).every(e=>e.r1149K===2),null,120000,'scale 2'),'2명이 되면 살아 있는 몹 모두 배수 2',(await mobs(host)).rows.slice(0,3));
 const duo=await mobs(host),by=new Map(solo.rows.map(e=>[e.id,e]));
 ok(duo.rows.every(e=>!e.rep)&&duo.rows.length===solo.rows.length,'인원수 복제 몹 없음(마릿수 그대로)',[solo.rows.length,duo.rows.length]);
 const cmp=duo.rows.filter(e=>by.has(e.id)).map(e=>({id:e.id,solo:by.get(e.id).max,duo:e.max}));
 ok(cmp.length>0&&cmp.every(c=>Math.abs(c.duo-2*c.solo)<=1),'몹 최대 체력 = 혼자 값 × 2',cmp.slice(0,5));
 ok(await until(guest,()=>typeof room!=='undefined'&&!!room&&room.enemies.filter(e=>e.hp>0).length>0&&room.enemies.every(e=>!e.coopReplicaR62)&&room.enemies.filter(e=>e.hp>0).every(e=>e.r1149K===2),null,240000,'guest view'),'친구 화면에도 복제 없이 2배 체력 몹');
 await host.waitForTimeout(3000);const later=await mobs(host);
 ok(later.rows.every(e=>!e.rep)&&later.rows.filter(e=>by.has(e.id)).every(e=>Math.abs(e.max-2*by.get(e.id).max)<=1),'시간이 지나도 복제가 다시 생기지 않고 배수 유지',later.rows.slice(0,3));
 // 친구가 나가면 혼자 값으로
 await guest.evaluate(()=>window.__STORYWORLD_COOP_CLIENT_R62__.disconnect());
 ok(await until(host,()=>window.__STORYWORLD_COOP_SIM_R62__.players().filter(p=>p.connectedR62!==false).length===1&&room.enemies.filter(e=>e.hp>0).every(e=>(e.r1149K||1)===1),null,120000,'scale back'),'친구가 나가면 배수 1로 돌아옴');
 const back=await mobs(host);ok(back.rows.filter(e=>by.has(e.id)).every(e=>Math.abs(e.max-by.get(e.id).max)<=1),'최대 체력이 혼자 값으로 돌아옴',back.rows.slice(0,3));
 const errs=await host.evaluate(()=>({err:window.__err,mp:window.__STORYWORLD_SURVIVAL_COOP_R1149__.inspect()}));
 ok(!errs.err.some(c=>['STATE_INVALID','TRANSITION_INVALID','STALE_SEQUENCE'].includes(c))&&errs.mp.errors===0&&!host.errors.length,'서버 거절·오류 없음',[errs.err,errs.mp.lastError,host.errors.slice(0,2)]);
}finally{await host.context().close();await guest.context().close();await relay.close();await browser.close();}
console.log(`\nR1149 스토리 브라우저: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
