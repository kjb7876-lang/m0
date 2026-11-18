// R1138 지역 전환 가림막 — 브라우저 검사·측정(아이폰 13 미니 가로 흉내, #763 mobile-browser.cjs 와 같은 조건).
//  SW_URL=http://127.0.0.1:4410/ node r96/qa/r1138/transition-browser.cjs            (검사 + 측정, 가림막 켬)
//  CURTAIN=off OUT=off.json … 처럼 돌리면 가림막을 끈 채 같은 값을 적는다(전후 비교·회귀 대조용, 검사는 건너뜀).
//  헤드리스 소프트웨어 렌더링이라 시간 값은 실기기와 다르다(비율·순서만 본다).
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,devices}=require('playwright');
const timeout=240000,OFF=process.env.CURTAIN==='off',FROM=process.env.FROM||'dist02',TO=process.env.TO||'dist01';
let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d).slice(0,600));assert.ok(c,m);n++;console.log('PASS',m);};
async function dismiss(page){await page.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});}
(async()=>{
 const browser=await chromium.launch();const out={curtain:OFF?'off':'on',from:FROM,to:TO};
 try{
  const context=await browser.newContext({...devices['iPhone 13 Mini landscape'],viewport:{width:812,height:375},screen:{width:812,height:375},deviceScaleFactor:3});
  await context.addInitScript(off=>{Object.defineProperty(navigator,'deviceMemory',{get:()=>undefined,configurable:true});
   let seed=1807711;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);window.__reseed=s=>{seed=s;};
   try{if(off)localStorage.setItem('storyworld.r1138.curtain','{"on":false}');else localStorage.removeItem('storyworld.r1138.curtain');}catch(_){}} ,OFF);
  const page=await context.newPage(),errors=[];page.setDefaultTimeout(timeout);page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.SW_URL||'http://127.0.0.1:4410/',{waitUntil:'domcontentloaded',timeout});
  await page.locator('#campaignNew54').tap({timeout});await page.locator('#slotConfirmR73').tap();
  await page.waitForFunction(()=>started&&!loading,null,{timeout});await dismiss(page);
  ok(await page.evaluate(async()=>{const save=serializeSave();for(const r of Object.values(regionById))save.progress.STORY[r.id]=true;return await restoreSave(save);})!==false,'(준비) 진행된 저장 불러오기');
  await dismiss(page);
  ok(await page.evaluate(async id=>await enterRegion(id,null,{layer:'STORY',restore:true,noStory:true}),FROM),'(준비) '+FROM+' 진입');
  await page.waitForFunction(id=>!loading&&room.id===id&&__STORYWORLD_PHASE1__.controller.state.active==='three',FROM,{timeout});await dismiss(page);
  await page.evaluate(()=>{auto=false;guide=false;});
  // 첫 지역이 자리 잡을 때까지(가림막이 있다면 걷힐 때까지 + 여유)
  await page.waitForFunction(()=>!document.getElementById('r1138Curtain')&&!(__STORYWORLD_PHASE1__.controller.state.three?.__r204?.pending),null,{timeout});
  await page.evaluate(()=>new Promise(r=>{let k=0;const f=()=>++k<12?requestAnimationFrame(f):r();requestAnimationFrame(f);}));
  // ---- 전환 한 번을 장면마다 기록 ----
  const rec=await page.evaluate(async([from,to])=>{
   const dir=Object.entries(regionById[from].exits).find(([,id])=>id===to)?.[0],opp={north:'south',south:'north',east:'west',west:'east'};
   const fromDir=dir?(typeof opposite!=='undefined'?opposite[dir]:opp[dir]):null;
   const cur=()=>!!document.getElementById('r1138Curtain');
   const state=()=>({loading,modal,story:!!storyScene,curtain:cur(),modalHidden:document.getElementById('modal').classList.contains('hidden'),room:room?.id,t:time});
   const frames=[];let last,done=false,resolvedAt=-1;
   const sample=stamp=>{const f={dt:last===undefined?0:stamp-last,at:state()};last=stamp;frames.push(f);if(!done)requestAnimationFrame(sample);};
   requestAnimationFrame(sample);
   await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   const grid=(rad)=>{const b=room.exploration?.bounds||[0,0,40,40];let h=2166136261,c=0;for(let y=b[1];y<=b[3];y+=.5)for(let x=b[0];x<=b[2];x+=.5){h=Math.imul(h^(blocked(x,y,rad)?1:0),16777619);c++;}return (h>>>0).toString(36)+':'+c;};
   const snap=()=>({room:room.id,zone,layer,player:[player.x,player.y,player.hp,player.direction],cam:[cam.x,cam.y],
    enemies:room.enemies.map(e=>[e.id,e.name,+e.x.toFixed(4),+e.y.toFixed(4),e.hp,!!e.boss]),props:(room.props||[]).length,
    objective:room.objective?[room.objective.x,room.objective.y]:null,altar:room.altar?[room.altar.x,room.altar.y]:null,
    goal:(()=>{try{const g=__STORYWORLD_POLISH_R100__?.goal?.();return g?[+g.x.toFixed(3),+g.y.toFixed(3),g.kind||g.label||null]:null;}catch(_){return'err';}})(),
    block27:grid(.27),block29:grid(.29),blockShot:grid(.08),transitionCD,invincible:player.invincible,route:route.length,
    doors:(window.__STORYWORLD_WORLD_R74__?.doors||[]).map(d=>[d.id,+d.x.toFixed(2),+d.y.toFixed(2),!!d.open])});
   window.__reseed(424242);
   // 회귀 대조용: 엔진이 로딩 창을 닫는 바로 그 순간(같은 동기 흐름, 어떤 장면도 그리기 전)의 판정 값
   let atClose=null;{const base=closePanel;closePanel=function(force){const had=!!document.querySelector('#modal:not(.hidden) #loadFill');const r=base.apply(this,arguments);
     if(force===true&&had&&!loading&&!atClose&&room?.id===to){closePanel=base;atClose={snap:snap(),curtain:cur(),frames:frames.length};}return r;};}
   const t0=performance.now(),tick0=time;
   const result=await enterRegion(to,fromDir,{restore:true,noStory:true});
   // 약속이 풀린 바로 그 흐름(그리기 전)
   const atResolve={result,ms:performance.now()-t0,state:state(),snap:snap(),pointer:cur()?getComputedStyle(document.getElementById('r1138Curtain')).pointerEvents:null,
    ids:['modal','panel','loadFill','loadStatus'].map(id=>document.querySelectorAll('#'+id).length)};
   resolvedAt=frames.length;
   // 가림막이 걷히고(또는 60장면) 20장면 더
   await new Promise(r=>{let k=0,after=0;const f=()=>{k++;if(!cur())after++;if(after>=20||k>=90)r();else requestAnimationFrame(f);};requestAnimationFrame(f);});
   done=true;await new Promise(r=>setTimeout(r,30));
   const three=__STORYWORLD_PHASE1__.controller.state.three,st=three?.__r204;
   const settled={snap:snap(),cave:st?{zone:st.zone,pending:!!st.pending,failed:!!st.failed,visible:!!st.group?.visible,size:st.F?[st.F.W,st.F.H]:null}:null,edge:!!three?.r188Edge,gameSeconds:time-tick0,
    curtain:window.__STORYWORLD_TRANSITION_CURTAIN_R1138__?.inspect?.()||null};
   return{fromDir,atClose,atResolve,resolvedAt,frames,settled};},[FROM,TO]);
  out.rec=rec;out.errors=errors;
  // ---- 장면 분석 ----
  //  간격 i(= 장면 i-1 의 계산 시간) 동안 화면에는 그 앞 장면이 그려 둔 모습이 멈춰 보인다. 장면 i-1 을 시작할 때 읽은 상태(at)가 곧 그 모습이다
  //  (엔진 그리기 → 이 기록 → 가림막 판단 순으로 돌므로). 단 로딩이 끝난 뒤 첫 장면만은, 로딩 창 닫기가 아직 화면에 그려지기 전이라 로딩 창이 보인다.
  //  (setTimeout 으로 '그려진 뒤' 상태를 읽는 방식은 무거운 장면에서 타이머가 밀려 틀린다 — 쓰지 않는다.)
  const fr=rec.frames;let L=-1;for(let i=1;i<fr.length;i++)if(fr[i-1].at.loading&&!fr[i].at.loading)L=i;
  const iv=[];for(let i=1;i<fr.length;i++){const p=fr[i-1].at;iv.push({i,dt:fr[i].dt,seen:i-1===L||p.loading||(!p.modalHidden&&p.modal)?'loading':p.curtain?'curtain':'game'});}
  const post=L<0?[]:iv.filter(v=>v.i>=L+1);
  const mx=a=>a.reduce((m,v)=>Math.max(m,v.dt),0);
  out.summary={resolveMs:Math.round(rec.atResolve.ms),framesAfter:post.length,rawLongestMs:Math.round(mx(post)),visibleLongestMs:Math.round(mx(post.filter(v=>v.seen==='game'))),
   hiddenLongestMs:Math.round(mx(post.filter(v=>v.seen!=='game'))),hiddenTotalMs:Math.round(post.filter(v=>v.seen!=='game').reduce((s,v)=>s+v.dt,0)),
   postSeq:post.slice(0,14).map(v=>v.seen[0]+Math.round(v.dt)).join(' '),curtainLog:rec.settled.curtain?.log||null,cave:rec.settled.cave,gameSecondsToSettle:+rec.settled.gameSeconds.toFixed(2)};
  console.log(JSON.stringify(out.summary));
  // 다른 실행(가림막 끔·고치기 전 빌드)과 전환 직후 판정 대조: COMPARE=파일[,파일…]
  if(process.env.COMPARE)for(const f of process.env.COMPARE.split(',')){const other=JSON.parse(fs.readFileSync(f,'utf8')).rec.atClose?.snap,mine=rec.atClose?.snap;
   const diff=other&&mine?Object.keys(mine).filter(k=>JSON.stringify(mine[k])!==JSON.stringify(other[k])):['(기록 없음)'];
   ok(diff.length===0,'전환 직후 판정이 같다 — 시작 위치·몹 배치('+(mine?.enemies.length)+'마리)·목표·길잡이 목표·충돌 격자 3종·문·진입 보호: '+f.split('/').pop(),diff);}
  if(process.env.OUT)fs.writeFileSync(process.env.OUT,JSON.stringify(out));
  if(process.env.SHOT)await page.screenshot({path:process.env.SHOT});
  if(!OFF){
   const a=rec.atResolve,c=rec.settled.curtain;
   ok(a.result===true&&a.state.room===TO,'전환 성공 '+FROM+' → '+TO);
   ok(c&&c.revision,'R1138 모듈이 실려 있다');
   ok(a.state.curtain&&a.state.loading===false&&a.state.modal===false&&a.state.modalHidden,'진입이 끝난 바로 그 흐름(그리기 전)에 가림막이 올라와 있고 loading·modal 은 false',a.state);
   ok(a.pointer==='none','가림막은 터치를 막지 않는다');
   ok(a.ids.join()==='1,1,1,1','id 중복 없음',a.ids);
   const firstGame=post.findIndex(v=>v.seen==='game'),lift=c.log[c.log.length-1];
   ok(post[0]&&post[0].seen!=='game'&&post[1]&&post[1].seen==='curtain','로딩 창 다음에 보이는 첫 화면이 가림막이다(게임 화면이 먼저 비치지 않음)',post.slice(0,4));
   ok(lift&&/^(ready|plain|cap)$/.test(lift.reason)&&!c.active,'가림막이 걷혔다: '+(lift&&lift.reason+' · '+lift.frames+'장면 · '+lift.ms+'ms'),c);
   ok(lift.ms<=5200,'상한(4초+여유) 안에 걷힘');
   if(lift.reason==='ready')ok(rec.settled.cave&&!rec.settled.cave.pending&&rec.settled.cave.zone===TO,'걷힐 때 동굴 지형이 붙어 있다',rec.settled.cave);
   ok(firstGame>=0&&post.slice(firstGame).every(v=>v.seen==='game'),'한 번 걷힌 뒤 다시 덮지 않는다');
   ok(out.summary.visibleLongestMs<out.summary.rawLongestMs,'보이는 가장 긴 끊김('+out.summary.visibleLongestMs+'ms)이 전체 가장 긴 장면('+out.summary.rawLongestMs+'ms)보다 짧다 — 가장 무거운 장면은 가림막 뒤');
   ok(rec.atClose&&rec.atClose.curtain===true,'엔진이 로딩 창을 닫는 그 순간에 가림막이 이미 있다(장면 사이 틈 없음)');
   ok(errors.length===0,'페이지 오류 없음',errors);
   // 가림막 중에도 게임은 그대로 흐른다(판정을 멈추지 않는다는 뜻) — 단 진입 보호 시간 안
   ok(rec.settled.snap.room===TO&&rec.settled.gameSeconds>0,'가림막 동안 게임 시간은 엔진대로 흐른다('+out.summary.gameSecondsToSettle+'초)');
  }
  console.log('\nR1138 transition browser: '+n+' passed ('+out.curtain+')');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
