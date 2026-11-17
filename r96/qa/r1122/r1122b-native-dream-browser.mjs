// R1122b 특별 지역 6곳(한도성 hando01~03·kair02·kair03·last301) DREAM 지도 — 헤드리스 브라우저 검사(그래픽·GPU 검증 아님).
//  사용자 2026-11-17 10:12Z "문제 다 고쳐"(R1122 보고에 남긴 '6지역 DREAM 도 예전 틀' 포함). 원인은 R1122 와 같음: R1098b 가 NATIVE 를 빼 V4 틀이 남음.
//  ① 6지역 DREAM: 그림=충돌=R171 지도·영웅 벽 속 아님·(문은 영웅처럼 C 로 열고) 기억의 표식·보스·중간보스 모두 걸어서 닿음·몹 95% 이상 닿음
//  ② 그 STORY 층은 그대로 병동 미로  ③ cult04 DREAM R171 유지  ④ 페이지 오류 0
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
const IDS=['hando01','hando02','hando03','kair02','kair03','last301'];const badR=[];
for(const id of IDS){
 await go(id,'DREAM');await p.evaluate(REACH);
 const r=await p.evaluate(()=>{const X=room.exploration,D=window.__STORYWORLD_EXPLORATION__.layout(zone,layer);const opened=window.__R1122_openDoors();
  const majors=room.enemies.filter(e=>(e.boss||e.midboss)&&e.hp>0);const all=room.enemies.filter(e=>e.hp>0);
  const rb=window.__R1122_reach(majors),ra=window.__R1122_reach(all),ro=window.__R1122_reach([room.objective]);
  return {zone,layer,same:X===D,r171:!!X?.storyMapR171,t:X?.type,cells:(X?.floorCells||[]).length,stuck:blocked(player.x,player.y,.29,room),fin:Number.isFinite(player.x+player.y),
   opened,obj:ro[0],majors:majors.length,majorsReach:rb.filter(Boolean).length,all:all.length,allReach:ra.filter(Boolean).length,majorsWall:majors.filter(e=>blocked(e.x,e.y,.27,room)).length};});
 const good=r.zone===id&&r.layer==='DREAM'&&r.same&&r.r171&&r.cells>3684&&!r.stuck&&r.fin&&r.obj&&r.majorsReach===r.majors&&r.majorsWall===0&&r.allReach>=r.all*0.95;
 ok(good,`① ${id} DREAM: 그림=충돌=R171 지도·영웅 벽 속 아님·표식/보스 걸어서 닿음·몹 95% 이상 닿음`,r);if(!good)badR.push(id);
 await go(id,'STORY');const s=await p.evaluate(()=>({t:room.exploration?.type,r171:!!room.exploration?.storyMapR171}));
 ok(s.t==='r81-story-ward-maze'&&!s.r171,`② ${id} STORY 는 그대로 병동 미로`,s);}
await go('cult04','DREAM');const c=await p.evaluate(()=>({r171:!!room.exploration?.storyMapR171}));ok(c.r171,'③ cult04 DREAM R171 유지(R1122)',c);
ok(errs.length===0,'④ 페이지 오류 0',errs.slice(0,4));
console.log(`\n${n-bad}/${n} 통과`);await b.close();process.exit(bad?1:0);
