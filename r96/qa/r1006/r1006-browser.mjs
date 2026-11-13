// R1006 브라우저 검사(헤드리스 — 그래픽·실기기 검증 아님): 무한생존 56지역 뒤 사몽 16장.
//  56번째 단계 다음이 사몽 첫 장인지, 16장이 정본 순서·장 정의(host 그림·기증 몹·보스·원문 자막)대로 나오는지, M 은 R1010 으로 넘기는지(없으면 2회차로),
//  서사 건너뛰기에서도 진행되는지, 모바일 동시 적 상한·R992 지면 캐시 정리가 그대로인지, 기존 56지역 순서가 그대로인지 본다.
//  SW_URL(기본 http://127.0.0.1:4410/m0/) · HERO(기본 hwando) · ONLY(쉼표로 고른 장 키, 기본 전부)
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const E=process.env,URL=E.SW_URL||'http://127.0.0.1:4410/m0/',HERO=E.HERO||'hwando',ONLY=E.ONLY?E.ONLY.split(','):null;
let fail=0;const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,600):'');if(!c)fail++;};
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
const init=()=>{const W=window.__R1006QA={nan:0,nanAt:[]};for(const k of ['drawImage','fillRect','arc','moveTo','lineTo','translate','ellipse','setTransform']){const f=CanvasRenderingContext2D.prototype[k];CanvasRenderingContext2D.prototype[k]=function(...a){for(const v of a)if(typeof v==='number'&&!Number.isFinite(v)){W.nan++;if(W.nanAt.length<5)W.nanAt.push(k+' '+String(new Error().stack).split('\n')[2]);break;}return f.apply(this,a);};}};
async function boot(ctx){await ctx.addInitScript(init);const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e.stack||e).slice(0,300)));p.on('crash',()=>errs.push('PAGE CRASH'));
 await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').waitFor({timeout:180000});
 await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator(`[data-r600hero="${HERO}"]`).click();await p.locator('#r600Go').click();
 await ready(p);return {p,errs};}
const ready=p=>p.waitForFunction(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;return Z.here()&&!loading&&Z.state().ready;},null,{timeout:240000,polling:200});
// 빠른 감기: 영웅·코어 체력 유지, 강화 창 첫 카드, 보호 시간 지난 적 즉시 처치. stop: 'boss'(보스 등장) | 'clear'(정화 완료) | 'leave'(다른 단계로) | 'secs:n'
async function run(p,stop,wallMs=90000){const W0=Date.now();let last=null;const acc={nar:[],boss:null,maxAlive:0};const merge=s=>{if(!s)return;for(const x of s.nar)if(!acc.nar.includes(x))acc.nar.push(x);acc.boss=acc.boss||s.boss;acc.maxAlive=Math.max(acc.maxAlive,s.maxAlive);};const T0=await p.evaluate(()=>time);while(Date.now()-W0<wallMs){
 last=await p.evaluate(({stop,T0})=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;const T=performance.now(),i0=stop.startsWith('leave:')?+stop.slice(6):Z.state().i,t0=time;const seen={nar:[],boss:null,maxAlive:0};
  while(performance.now()-T<400){if(modal){const b=document.getElementById('r600Pick0');if(b){b.click();continue;}return {r:'modal',seen};}if(loading)return {r:'loading',seen};
   player.hp=maxHP();const st=Z.state();if(st.core&&st.core.hp<st.core.stats.max*.6)Z.qaCoreHp(st.core.stats.max*.8);
   const cur=Z.narr().cur;if(cur&&!seen.nar.includes(cur))seen.nar.push(cur);if(Z.narr().playing&&!stop.startsWith('secs'))Z.skipNarration();
   const live=room.enemies.filter(e=>e.hp>0&&!e.deadRecorded&&e.spawnState!=='dead');seen.maxAlive=Math.max(seen.maxAlive,live.length);
   for(const e of live){if(e.r600Boss&&!seen.boss)seen.boss={name:e.name,nativeId:e.nativeId};}
   if(stop==='boss'&&seen.boss)return {r:'boss',seen,st:Z.state()};if(stop==='clear'&&st.phase==='clear')return {r:'clear',seen,st};
   if(stop.startsWith('leave')&&st.i!==i0)return {r:'leave',seen,st};if(stop.startsWith('secs')&&time-T0>=+stop.slice(5))return {r:'secs',seen,st};
   if(!stop.startsWith('secs'))for(const e of live)if(time>(e.graceUntil||0)+.05)try{killEnemy(e);}catch(_){}
   tick(1/30);}
  return {r:'more',seen,st:Z.state()};},{stop,T0});
 merge(last.seen);last.seen=acc;if(last.r!=='more'&&last.r!=='modal'&&last.r!=='loading')return last;
 if(last.r==='loading')await ready(p).catch(()=>{});await p.waitForTimeout(30);}
 return {...last,r:'timeout'};}
const A=(p,f,a)=>p.evaluate(f,a);
// ── 데스크톱 ──
const ctx=await b.newContext({viewport:{width:960,height:540}});const {p,errs}=await boot(ctx);
const base=await A(p,()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;return {ids:Z.stageIds(),story:Z.pure.stageIds(regions),EP:window.__STORYWORLD_SAMONG_R103__.episodes.map(e=>({key:e.key,host:e.host,title:e.title,mobName:e.mobName||null,mobs:e.mobs||[],boss:e.boss}))};});
const EP=base.EP;
ok('72 stages: the 56 story regions unchanged, then 16 samong chapters in canon order',base.ids.length===72&&base.story.length===56&&JSON.stringify(base.ids.slice(0,56))===JSON.stringify(base.story)&&JSON.stringify(base.ids.slice(56))===JSON.stringify(EP.map(e=>'sm1006:'+e.key)),{n:base.ids.length,tail:base.ids.slice(54,58)});
const canon=await A(p,()=>{const out=[];for(const s of Object.values(window.__STORYWORLD_SAMONG_TEXT_R103__.sections))for(const b of s.blocks||[])for(const t of b.paras||[])out.push(t);return out;});
const inCanon=t=>canon.some(c=>c.includes(t));
// 56번째(마지막 스토리) 단계를 깨면 사몽 첫 장
{await A(p,()=>window.__STORYWORLD_SURVIVAL_R600__.qaGo(55));await ready(p);const r=await run(p,'leave:55',180000);await ready(p);
 const st=await A(p,()=>({i:window.__STORYWORLD_SURVIVAL_R600__.state().i,id:window.__STORYWORLD_SURVIVAL_R600__.state().id,room:room.id,loop:window.__STORYWORLD_SURVIVAL_R600__.state().loop}));
 ok('clearing stage 56 (last story region) starts samong P on the same loop',r.r==='leave'&&st.i===56&&st.id==='sm1006:P'&&st.room===EP[0].host&&st.loop===0,{r:r.r,st});}
// 16장 하나하나
const rows=[];
for(let k=0;k<16;k++){const e=EP[k];if(ONLY&&!ONLY.includes(e.key))continue;
 const cur=await A(p,()=>window.__STORYWORLD_SURVIVAL_R600__.state().i);if(cur!==56+k){await A(p,i=>window.__STORYWORLD_SURVIVAL_R600__.qaGo(i),56+k);await p.waitForTimeout(300);await ready(p);}
 const info=await A(p,()=>{const R=room.survivalR600.roster;const hud=document.querySelector('#r600Hud .s')?.textContent||'';return {room:room.id,key:R.samongKey,normal:R.normal.map(x=>({n:x.nativeId,name:x.name})),boss:R.boss?{n:R.boss.nativeId,name:R.boss.name}:null,fb:R.finaleBoss?{n:R.finaleBoss.nativeId,name:R.finaleBoss.name}:null,fallback:R.fallback,hud,cur:window.__STORYWORLD_SURVIVAL_R600__.narr().cur};});
 const mobsOk=e.mobs.length?(info.normal.length>0&&info.normal.every(x=>x.name===e.mobName)&&info.normal.every(x=>e.mobs.some(m=>m[1]===x.n))):info.normal.length===0;
 ok(`${e.key}: host art ${e.host}, EP donor mobs named '${e.mobName}', HUD title`,info.room===e.host&&info.key===e.key&&mobsOk&&info.fallback===0&&info.hud.includes(e.title),info);
 if(e.key!=='M'){ok(`${e.key}: boss slot = EP donor ${e.boss.donor[1]} named '${e.boss.name}'`,!!info.boss&&info.boss.n===e.boss.donor[1]&&info.boss.name===e.boss.name,info.boss);
  const r=await run(p,'boss',150000);const sub=[info.cur,...r.seen.nar].filter(Boolean);
  ok(`${e.key}: canon subtitles shown and boss '${e.boss.name}' appears (narration skipped)`,r.r==='boss'&&r.seen.boss?.name===e.boss.name&&sub.length>0&&sub.every(inCanon),{r:r.r,boss:r.seen.boss,sub:sub.map(s=>s.slice(0,30))});
  const c=await run(p,'clear',150000);ok(`${e.key}: stage clears`,c.r==='clear',{r:c.r});rows.push({key:e.key,maxAlive:Math.max(r.seen.maxAlive,c.seen.maxAlive)});}
 else{ok('M: no killable 미카엘라 in the boss slot; finale template kept for R1010',info.boss===null&&info.fb?.name==='미카엘라'&&info.fb?.n===e.boss.donor[1],{boss:info.boss,fb:info.fb});
  // R1010 이 있으면 넘김: 몹 물결 뒤 begin 이 불리고 그 뒤로 진행하지 않는다
  await A(p,()=>{window.__R1006Calls=[];window.__STORYWORLD_SURVIVAL_FINALE_R1010__={begin:x=>{window.__R1006Calls.push(x);return true;}};});
  const sub=[info.cur];const r=await run(p,'secs:0',1000);void r;
  let h=null;for(let t=0;t<40;t++){const x=await run(p,'secs:2',60000);if(x.seen)sub.push(...x.seen.nar);await A(p,()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;Z.skipNarration();for(const e of room.enemies)if(e.hp>0&&!e.deadRecorded&&time>(e.graceUntil||0))try{killEnemy(e);}catch(_){}});
   h=await A(p,()=>({st:window.__STORYWORLD_SURVIVAL_R600__.state(),calls:window.__R1006Calls}));if(h.calls.length)break;}
  ok('M: canon subtitles (R-17 closing) shown before the handoff',sub.filter(Boolean).length>0&&sub.filter(Boolean).every(inCanon),sub.filter(Boolean).map(s=>s.slice(0,30)));
  const later=await run(p,'secs:8',60000);const h2=await A(p,()=>({st:window.__STORYWORLD_SURVIVAL_R600__.state(),calls:window.__R1006Calls.length,boss:room.enemies.filter(e=>e.r600Boss).length}));
  ok('M: after the waves R1010 begin({stageId:"sm1006:M",key:"M"}) is called once, phase handoff, no boss, no advance',h.calls.length===1&&h.calls[0].stageId==='sm1006:M'&&h.calls[0].key==='M'&&h2.calls===1&&h2.st.phase==='handoff'&&h2.st.i===71&&h2.boss===0&&later.r==='secs',{calls:h.calls,phase:h2.st.phase,i:h2.st.i,boss:h2.boss});
  // R1010 이 없으면: 미카엘라 없이 정화 → 2회차 첫 지역
  await A(p,()=>{delete window.__STORYWORLD_SURVIVAL_FINALE_R1010__;});await A(p,()=>window.__STORYWORLD_SURVIVAL_R600__.qaGo(71));await p.waitForTimeout(300);await ready(p);
  const l=await run(p,'leave:71',180000);await ready(p);const s3=await A(p,()=>window.__STORYWORLD_SURVIVAL_R600__.state());
  ok('M without R1010: clears with no 미카엘라 boss and the run continues to round 2 stage 1',l.r==='leave'&&!l.seen.boss&&s3.i===0&&s3.loop===1&&s3.id===base.story[0],{r:l.r,boss:l.seen.boss,i:s3.i,loop:s3.loop,id:s3.id});}}
const fin=await A(p,()=>({ins:window.__STORYWORLD_SURVIVAL_R600__.inspect(),ext:window.__STORYWORLD_SURVIVAL_SAMONG_R1006__?.inspect?.(),nan:window.__R1006QA.nan,nanAt:window.__R1006QA.nanAt}));
ok('no survival errors, no NaN/Infinity draw values, no page errors',fin.ins.stats.errors===0&&(fin.ext?.stats?.errors||0)===0&&fin.nan===0&&errs.length===0,{err:fin.ins.lastError,ext:fin.ext?.lastError,nan:fin.nanAt,errs:errs.slice(0,3)});
console.log(JSON.stringify(rows));await ctx.close();
// ── 모바일: 동시 적 상한 30·R992 지면 캐시 정리 ──
if(!E.NO_MOBILE){const mc=await b.newContext({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true});const {p:q,errs:e2}=await boot(mc);
 let maxAlive=0;for(const i of [64,65,66,67]){await A(q,i=>window.__STORYWORLD_SURVIVAL_R600__.qaGo(i),i);await q.waitForTimeout(300);await ready(q);const r=await run(q,'secs:25',120000);maxAlive=Math.max(maxAlive,r.seen.maxAlive);}
 await q.waitForTimeout(2500);const m=await A(q,()=>({ground:typeof groundCache3!=='undefined'?groundCache3.size:null,id:window.__STORYWORLD_SURVIVAL_R600__.state().id,heroMissing:heroPaths(player.hero).filter(Boolean).filter(x=>!readyImage(x)).length,errors:window.__STORYWORLD_SURVIVAL_R600__.inspect().stats.errors,nan:window.__R1006QA.nan}));
 ok('mobile: samong stages keep the 30-enemy cap, R992 ground cache ≤ 2, hero sprites kept, no errors',maxAlive<=30&&maxAlive>0&&m.ground!==null&&m.ground<=2&&m.heroMissing===0&&m.errors===0&&m.nan===0&&m.id==='sm1006:RD'&&e2.length===0,{maxAlive,...m,errs:e2.slice(0,3)});
 await mc.close();}
await b.close();console.log(fail?('FAILED '+fail):'ALL PASS');process.exit(fail?1:0);
