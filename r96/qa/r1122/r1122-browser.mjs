// R1122 교주의 사몽(cult04) DREAM 지도 — 헤드리스 브라우저 검사(그래픽·GPU 검증 아님).
//  사용자 2026-11-16 14:05Z "교주의사몽 DREAM은 여전한데", 11-17 09:23Z "교주의사몽dream맵도이상한데?".
//  원인: R1098b 가 DREAM 층을 R171 서사 지도로 바꿀 때 cult04 는 NATIVE(특별 흐름) 라서 빠져, 예전 V4 틀(45도 돌린 대각 복도 3,684칸·
//   영웅 시작 (15,19) 이 몹 무리 한가운데)이 그대로 남았다.
//  실행: SW_URL=http://127.0.0.1:4396/m0/ node r96/qa/r1122/r1122-browser.mjs
//  ① cult04 DREAM: 그리는 지도 = 충돌 지도 = R171 서사 지도(예전 V4 r78-story-combat-maze 아님) · 영웅이 벽 속 아님 · NaN 없음
//  ② 영웅 자리에서 기억의 표식(room.objective)까지 걸어서 닿음(칸 BFS, blocked 반지름 .29 · 가는 길의 문은 영웅처럼 다가가 C 로 연다)
//  ③ 시련 보스 6마리(R1114 동시 소환) 자리·페르소나 자리까지 걸어서 닿음, 벽 속 아님
//  ④ cult04 STORY 는 그대로 병동 미로(r81-story-ward-maze) · 다른 교주 DREAM(cult01·cult03)은 그대로 R171(그림=충돌)
//  ⑤ 사몽 에피소드 구역은 예전 에피소드 지도 그대로(R1117 #740) · ⑥ 페이지 오류 0
import {createRequire} from 'node:module';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4396/m0/';
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,700):''));};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r790.npc','{"on":false}');});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
const go=async(id,L)=>{await p.evaluate(async([id,L])=>{await enterRegion(id,null,{layer:L,restore:true});},[id,L]);await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip();await p.waitForTimeout(800);await skip();};
// 칸 BFS: 영웅 칸에서 목표 칸(반경 1.5 안 아무 칸)까지 blocked(.29) 아닌 칸·칸 경계 중점으로 이어지는지
const REACH=()=>{window.__R1122_reach=(targets)=>{const X=room.exploration,[x0,y0,x1,y1]=X.bounds,W=x1-x0+1,H=y1-y0+1,ix=(x,y)=>(y-y0)*W+(x-x0);
  const free=(x,y)=>x>=x0&&x<=x1&&y>=y0&&y<=y1&&!blocked(x+.5,y+.5,.29,room),seen=new Uint8Array(W*H),q=[];const sx=Math.floor(player.x),sy=Math.floor(player.y);
  if(!free(sx,sy))return targets.map(()=>false);seen[ix(sx,sy)]=1;q.push([sx,sy]);
  for(let h=0;h<q.length;h++){const[x,y]=q[h];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,c=y+dy;if(!free(a,c)||seen[ix(a,c)])continue;if(blocked(x+.5+dx*.5,y+.5+dy*.5,.29,room))continue;seen[ix(a,c)]=1;q.push([a,c]);}}
  if(targets==='seen')return {seen,W,x0,y0,x1,y1,ix};
  return targets.map(t=>{for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const a=Math.floor(t.x)+dx,c=Math.floor(t.y)+dy;if(a>=x0&&a<=x1&&c>=y0&&c<=y1&&seen[ix(a,c)])return true;}return false;});};
 // 영웅이 걸어서 닿는 문(R81 door-0·1·2)은 영웅처럼 다가가 C(WORLD_R74.use)로 연다 — 잠금(R78 단계 잠금 등)이 있으면 canUse/use 가 거절한다.
 window.__R1122_openDoors=()=>{const W74=window.__STORYWORLD_WORLD_R74__,home={x:player.x,y:player.y},done=[];
  for(let pass=0;pass<4;pass++){let any=false;const S=window.__R1122_reach('seen');
   for(const d of room.exploration.worldR74?.doors||[]){if(W74.isOpen(room,d))continue;let hit=null;
    for(let y=S.y0;y<=S.y1&&!hit;y++)for(let x=S.x0;x<=S.x1;x++){if(!S.seen[S.ix(x,y)])continue;const q={x:x+.5,y:y+.5};if(Math.hypot(q.x-d.x,q.y-d.y)>d.reach-.2)continue;player.x=q.x;player.y=q.y;if(W74.canUse({id:d.id})){hit=q;break;}}
    if(hit&&W74.use({id:d.id})){done.push(d.id);any=true;}player.x=home.x;player.y=home.y;}
   if(!any)break;}
  player.x=home.x;player.y=home.y;return done;};};
await go('cult04','DREAM');await p.evaluate(REACH);
const a=await p.evaluate(()=>{const X=room.exploration,D=window.__STORYWORLD_EXPLORATION__.layout(zone,layer);return {zone,layer,same:X===D,t:X?.type,r171:!!X?.storyMapR171,cells:(X?.floorCells||[]).length,stuck:blocked(player.x,player.y,.29,room),fin:Number.isFinite(player.x+player.y),p:[player.x,player.y],obj:room.objective&&{x:room.objective.x,y:room.objective.y}};});
ok(a.zone==='cult04'&&a.layer==='DREAM'&&a.same&&a.r171&&a.t!=='r78-story-combat-maze'&&a.cells>3684&&!a.stuck&&a.fin,'① cult04 DREAM: 그리는 지도 = 충돌 지도 = R171 서사 지도, 영웅 벽 속 아님',a);
const o=await p.evaluate(()=>{const opened=window.__R1122_openDoors();return {opened,reach:window.__R1122_reach([room.objective])};});
ok(!!a.obj&&o.reach[0],'② 영웅 자리 → (걸어서 닿는 문은 열고) 기억의 표식까지 걸어서 닿음',{obj:a.obj,...o});
const t=await p.evaluate(()=>{room.enemies=[];room.trialIndex=0;spawnTrial3();const tr=room.enemies.filter(e=>String(e.id).startsWith('cult04:trial:')).map(e=>({id:e.id,x:+e.x.toFixed(2),y:+e.y.toFixed(2),wall:blocked(e.x,e.y,.29,room)}));
  const r=window.__R1122_reach(tr);room.enemies=[];room.trialIndex=6;preparePersona3();for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);
  const pe=room.enemies.find(e=>e.persona),pr=pe?{x:+pe.x.toFixed(2),y:+pe.y.toFixed(2),wall:blocked(pe.x,pe.y,.29,room),reach:window.__R1122_reach([pe])[0]}:null;return {tr,r,pr,stage:room.encounterStage};});
ok(t.tr.length===6&&t.r.every(Boolean)&&t.tr.every(e=>!e.wall),'③ 시련 보스 6마리 자리 걸어서 닿음·벽 속 아님',t.tr.map((e,i)=>[e.id.slice(-1),e.x,e.y,e.wall,t.r[i]]));
ok(!!t.pr&&t.pr.reach&&!t.pr.wall&&t.stage==='personaReady','③ 페르소나 자리 걸어서 닿음·벽 속 아님',t);
await go('cult04','STORY');
const s=await p.evaluate(()=>({t:room.exploration?.type,r171:!!room.exploration?.storyMapR171}));
ok(s.t==='r81-story-ward-maze'&&!s.r171,'④ cult04 STORY 는 그대로 병동 미로',s);
for(const id of ['cult01','cult03']){await go(id,'DREAM');const g=await p.evaluate(()=>{const X=room.exploration,D=window.__STORYWORLD_EXPLORATION__.layout(zone,layer);return {z:zone,same:X===D,r171:!!X?.storyMapR171,stuck:blocked(player.x,player.y,.29,room)};});
 ok(g.z===id&&g.same&&g.r171&&!g.stuck,`④ ${id} DREAM 그대로 R171(그림=충돌)`,g);}
const ep=await p.evaluate(async()=>{const SM=__STORYWORLD_SAMONG_R103__,C=window.__STORYWORLD_SAMONG_ZONES_R115_DATA__.chapters,k=Object.keys(C)[0];await SM.go(SM.episodes.findIndex(e=>e.key===k),null,{zone:C[k][0].id});return 0;});
await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip();
const e=await p.evaluate(()=>{const X=room.exploration,D=window.__STORYWORLD_EXPLORATION__.layout(zone,layer);return {same:X===D,t:X?.type,r171:!!X?.storyMapR171};});
ok(e.same&&e.t==='r103-samong'&&!e.r171,'⑤ 사몽 에피소드 구역은 예전 에피소드 지도 그대로',e);
ok(errs.length===0,'⑥ 페이지 오류 0',errs.slice(0,4));
console.log(`\n${n-bad}/${n} 통과`);await b.close();process.exit(bad?1:0);
