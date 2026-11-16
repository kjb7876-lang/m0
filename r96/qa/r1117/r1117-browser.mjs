// R1117 사몽 에피소드 방(입문 시험장 등) 벽 통과·뒤죽박죽 — 헤드리스 브라우저 검사(그래픽·GPU 검증 아님).
//  사용자 2026-11-16 14:14Z "사몽에피소드 입문시험장같은곳 왜 벽을 통과하고 맵이 뒤죽박죽인거 같지".
//  원인: 에피소드 방은 지역 id(dist04 등)·DREAM 층을 쓰는데, R1098b 가 DREAM 도 R171 서사 지도로 바꾸면서 엔진이 그리는 지도(EXPLORATION.layout)는 R171 지도,
//   충돌(room.exploration)은 에피소드 지도(r103-samong)로 어긋났다.
//  실행: SW_URL=http://127.0.0.1:4396/m0/ node r96/qa/r1117/r1117-browser.mjs
//  ① 에피소드 전 구역(P·S-01~07·RA~RG·M)에서 그리는 지도와 충돌 지도가 같은 객체 · 영웅이 벽 속이 아님 · NaN 없음
//  ② 에피소드 밖 일반 DREAM 지역은 여전히 STORY 와 같은 R171 지도(R1098b 유지)  ③ 페이지 오류 0
import {createRequire} from 'node:module';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4396/m0/';
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,600):''));};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r790.npc','{"on":false}');});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
const zones=await p.evaluate(()=>{const C=window.__STORYWORLD_SAMONG_ZONES_R115_DATA__.chapters,o=[];for(const k of Object.keys(C))for(const z of C[k])o.push([k,z.id]);return o;});
ok(zones.length>=40,'에피소드 구역 목록',zones.length);
const badZ=[];let tested=0;
for(const [key,zid] of zones){
 try{await p.evaluate(async([key,zid])=>{const SM=__STORYWORLD_SAMONG_R103__,i=SM.episodes.findIndex(e=>e.key===key);await SM.go(i,null,{zone:zid});},[key,zid]);await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip();
  const r=await p.evaluate(()=>{const X=room.exploration,D=window.__STORYWORLD_EXPLORATION__.layout(zone,layer);return {zone,layer,same:X===D,cells:(X?.floorCells||[]).length,stuck:blocked(player.x,player.y,.29,room),fin:Number.isFinite(player.x+player.y),t:X?.type,r171:!!X?.storyMapR171};});
  tested++;if(!(r.same&&!r.stuck&&r.fin&&r.cells>0&&r.t==='r103-samong'&&!r.r171))badZ.push([zid,r]);}catch(e){badZ.push([zid,String(e).slice(0,100)]);}}
ok(tested>=40&&badZ.length===0,'에피소드 전 구역: 그리는 지도 = 충돌 지도 = 예전 에피소드 지도(r103-samong, R171 아님) · 벽 속 아님',{tested,bad:badZ.slice(0,5)});
const dr=await p.evaluate(async()=>{await enterRegion('dist01',null,{layer:'DREAM',restore:true});return 0;});await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip();
const g=await p.evaluate(()=>{const X=room.exploration,D=window.__STORYWORLD_EXPLORATION__.layout(zone,layer);return {same:X===D,r171:!!X?.storyMapR171,z:zone,l:layer};});
ok(g.same&&g.r171&&g.z==='dist01'&&g.l==='DREAM','에피소드 밖 일반 DREAM 지역(dist01)은 여전히 R171 지도(그림=충돌)',g);
ok(errs.length===0,'페이지 오류 0',errs.slice(0,4));
console.log(`\n${n-bad}/${n} 통과`);await b.close();process.exit(bad?1:0);
