// R1098b 사몽 세계(DREAM 층) 지도 — 헤드리스 브라우저 검사(그래픽 검증 아님).
//  사용자 2026-11-16 07:55Z "사몽세계 맵은 완전 뒤죽박죽 … 모든맵이 구조랑 길이 엉망진창 (사몽에피소드는 잘됨)".
//  원인: R171 지역별 서사 지도는 STORY 층만 받고, DREAM 층은 R78 이 모든 지역에 같은 예전 V4 틀(바닥 3,684칸, 회전·뒤집기만 다름)을 줬다.
//  실행: SW_URL=http://127.0.0.1:4396/m0/ node r96/qa/r1098/r1098b-dream-maps.mjs
//  ① R171 서사 지도를 받는 지역은 DREAM 층에서도 STORY 와 같은 지도(바닥 칸 수·벽 수)
//  ② 실제로 DREAM 지역에 들어가면 방 지도가 STORY 와 같은 R171 지도·같은 입구이고, 영웅이 벽 속이 아니며 적이 있음
//  ③ cult04(페르소나 결전장)는 바꾸지 않음  ④ 페이지 오류 0
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

// ①
const cmp=await p.evaluate(()=>{const EX=window.__STORYWORLD_EXPLORATION__,R=window.__STORYWORLD_STORY_MAPS_R171__;
 const sig=L=>L?{n:(L.floorCells||[]).length,w:(L.walls||[]).length,r171:!!L.storyMapR171}:null;const bad=[],good=[];
 for(const id of Object.keys(regionById)){if(regionById[id].safe||!R.eligible(id,'STORY'))continue;const S=sig(EX.layout(id,'STORY')),D=sig(EX.layout(id,'DREAM'));
  if(!D||D.n!==S.n||D.w!==S.w||!D.r171)bad.push({id,S,D});else good.push(id);}
 return {bad,good:good.length};});
ok(cmp.good>=40&&cmp.bad.length===0,'DREAM 층 지도 = 같은 지역 STORY 서사 지도(R171)',cmp.bad.length?cmp.bad.slice(0,6):{regions:cmp.good});

// ② (같은 지역을 STORY 로 먼저 들어가 기준을 잡고 DREAM 과 비교 — findPath(목표)는 STORY 에서도 0 이라 기준으로 쓰지 않는다)
const enter=async(id,L)=>{await p.evaluate(async([id,L])=>{await enterRegion(id,null,{layer:L,restore:true});},[id,L]);await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip();
 return p.evaluate(()=>{const L=room.exploration;return {zone,layer,r171:!!L?.storyMapR171,n:(L?.floorCells||[]).length,stuck:typeof blocked==='function'&&blocked(player.x,player.y,.29,room),en:room.enemies.length,x:+player.x.toFixed(1),y:+player.y.toFixed(1)};});};
for(const id of ['dist01','ep1b03','u202','kair06','cult05']){const S=await enter(id,'STORY'),D=await enter(id,'DREAM');
 ok(D.zone===id&&D.layer==='DREAM'&&D.r171&&!D.stuck&&D.n===S.n&&D.x===S.x&&D.y===S.y&&D.en>0,'DREAM '+id+' 입장: STORY 와 같은 R171 지도·같은 입구·벽 속 아님·적 있음',{S,D});}

// ③
const c4=await p.evaluate(()=>{const L=window.__STORYWORLD_EXPLORATION__.layout('cult04','DREAM');return {r171:!!L?.storyMapR171,n:(L?.floorCells||[]).length};});
ok(!c4.r171,'cult04 DREAM(페르소나 결전장) 지도는 그대로',c4);
ok(errs.length===0,'페이지 오류 0',errs.slice(0,5));
console.log(`\n${n-bad}/${n} 통과`);await b.close();process.exit(bad?1:0);
