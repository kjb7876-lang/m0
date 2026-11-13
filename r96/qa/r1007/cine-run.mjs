// R1007 영화 모드 끝까지 관찰(헤드리스). 처음 화면 '영화 모드로 시작' → (선택) 777 로 시작 지역까지 건너뜀 → 그 뒤로는 영화 모드가 알아서 진행.
//  사용: node r96/qa/r1007/cine-run.mjs <시작지역|-> <끝지역> <분> [폭x높이]   예) node cine-run.mjs - ep1a11 90 640x360
//  환경: SW_URL(기본 http://127.0.0.1:4410/m0/), OUT(jsonl 기록 파일), NO777=1(777 안 씀: 처음부터 자연 진행)
//  기록(5초마다): 지역·게임시간·서사 창·자막 수·대기열·영상 재생/끝·페이지 오류·비유한 좌표·힙. 멈춤 = 게임시간 90초 동안 지역·위치·처치·자막 변화 없음.
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';
const [START='-',END='village',MIN='60',VP='640x360']=process.argv.slice(2);const [W,H]=VP.split('x').map(Number);
const OUT=process.env.OUT||`/tmp/cine-${START}-${END}.jsonl`;const out=fs.createWriteStream(OUT);
const log=o=>{out.write(JSON.stringify(o)+'\n');};
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required','--enable-precise-memory-info']});
const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:1,...(W<H||W<900&&process.env.MOBILE?{isMobile:true,hasTouch:true}:{})});
// RAFMS=n: 화면 그리기(rAF)를 n ms 에 한 번으로 줄여 CPU 를 게임 진행(FAST)에 돌린다. 그리기는 계속 일어나므로 NaN·오류 검사는 표본으로 남는다.
const RAF=ms=>{if(window.__QA_RAF)return;window.__QA_RAF=1;const raf=window.requestAnimationFrame.bind(window);let last=0;window.requestAnimationFrame=cb=>raf(function loop(ts){if(loading||ts-last>=ms){last=ts;cb(ts);}else raf(loop);});};
if(process.env.LS)await ctx.addInitScript(o=>{for(const[k,v]of Object.entries(o))localStorage.setItem(k,v);},JSON.parse(process.env.LS));
await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r790.npc','{"on":false}');}catch(_){}
 const V=window.__QA_VIDEO={plays:[],ends:[],errors:[]};
 for(const [ev,arr] of [['play','plays'],['ended','ends'],['error','errors']])document.addEventListener(ev,e=>{const t=e.target;if(t&&t.tagName==='VIDEO')V[arr].push({src:String(t.currentSrc||t.src||'').split('/').slice(-2).join('/'),t:typeof time==='number'?+time.toFixed(1):null,at:Date.now()});},true);
 const NF=window.__QA_NF={n:0,last:null};const P=CanvasRenderingContext2D.prototype;
 for(const m of ['drawImage','fillRect','strokeRect','arc','moveTo','lineTo','ellipse','translate','scale','setTransform','fillText','createRadialGradient','createLinearGradient']){const f=P[m];if(!f)continue;P[m]=function(...a){for(const v of a)if(typeof v==='number'&&!Number.isFinite(v)){NF.n++;NF.last=m;break;}return f.apply(this,a);};}
});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>{errs.push(String(e).slice(0,240));log({kind:'pageerror',e:String(e).slice(0,400)});});
p.on('crash',()=>log({kind:'crash'}));
const STORY=process.env.MODE==='story';
await p.goto(URL);await p.locator(STORY?'#campaignNew54':'#cinemaStartR461').click({timeout:180000});const sc=p.locator('#slotConfirmR73');if(await sc.isVisible().catch(()=>false))await sc.click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const cin=await p.evaluate(()=>window.__STORYWORLD_CINEMA_RUN_R461__?.active?.());log({kind:'start',cin,START,END,VP});
if(START!=='-'){await p.evaluate(async()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});
 if(START.startsWith('S:')){await p.evaluate(z=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);window.__STORYWORLD_SAMONG_R103__.goZone(z);},START.slice(2));await p.waitForFunction(z=>!loading&&room?.samongR103?.zone===z,START.slice(2),{timeout:180000});}
 else{await p.evaluate(z=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);if(room?.id!==z)enterRegion(z,null,{layer:'STORY',restore:true});},START);await p.waitForFunction(z=>!loading&&room?.id===z,START,{timeout:180000});}}
// FAST=k: 페이지 안에서 50ms 마다 tick(.05) 를 k 번 더 불러 게임 시간을 빨리 감는다(자막·음성 타이머는 실제 시간 그대로라 서사 길이는 줄지 않는다).
if(+process.env.FAST>0)await p.evaluate(k=>{setInterval(()=>{try{if(started&&!loading&&!modal&&player.hp>0)for(let i=0;i<k;i++)tick(.05);}catch(e){window.__QA_FASTERR=(window.__QA_FASTERR||0)+1;window.__QA_FASTLAST=String(e).slice(0,200);}},50);},+process.env.FAST);
// 받은 피해 기록(죽음 원인): 최근 40번의 피해와 죽음 때의 묶음
await p.evaluate(()=>{window.__H={recent:[],deaths:[]};const h=hurt;hurt=function(d,s){const hp0=player.hp;const r=h.apply(this,arguments);const lost=hp0-player.hp;if(lost>0){__H.recent.push({t:+time.toFixed(2),lost:+lost.toFixed(1),src:String(s?.name||s?.kind||s?.type||typeof s).slice(0,40),keys:s&&typeof s==='object'?Object.keys(s).slice(0,14).join(','):null,owner:(()=>{const o=s?.owner;const e=o&&typeof o==='object'?o:(room?.enemies||[]).find(q=>q.id===o);return String(e?(e.name+'|'+(e.boss?'B':e.midboss?'M':'')+'|'+(e.kind||e.type||'')):(o??'')).slice(0,60);})(),asset:String(s?.asset?.path||s?.asset?.src||s?.asset||'').split('/').slice(-2).join('/').slice(0,50),dmgArg:+(+d).toFixed(1),inv:+(player.invincible||0).toFixed(2),guard:!!player.guard,type:s?.type||null,boss:!!(s?.boss||s?.midboss),hero:player.hero});if(__H.recent.length>40)__H.recent.shift();if(player.hp<=0)__H.deaths.push({room:room.id,t:+time.toFixed(1),hero:player.hero,lv:player.level,max:Math.round(maxHP()),stage:room.encounterStage,last:__H.recent.slice(-15)});}return r;};});
if(process.env.HERO)await p.evaluate(async h=>{if(typeof ensureImages==='function'&&typeof heroPaths==='function')await ensureImages(heroPaths(h));player.hero=h;try{refreshIcons()}catch(_){}},process.env.HERO);
if(STORY)await p.evaluate(()=>{guide=true;auto=true;guideTimer=0;window.__STORYWORLD_GUIDE_R77__?.syncGuide?.();});
if(+process.env.RAFMS>0)await p.evaluate(RAF,+process.env.RAFMS);// 시작 뒤에만(불러오기는 제 속도)
const t0=Date.now();let last=null,stillSince=null,stalls=[],visited=[];
const snap=()=>p.evaluate(()=>{const C=window.__STORYWORLD_CINEMA_MODE_R370__,ci=C?.inspect?.()||{},S=ci.stats||{};
 const bad=[player,...(room?.enemies||[])].filter(e=>e&&!(Number.isFinite(e.x)&&Number.isFinite(e.y))).length;
 return{t:+time.toFixed(1),room:room?.id,layer:room?.layer||null,sm:room?.samongR103?.zone||null,loading:!!loading,modal:!!modal,scene:!!storyScene,px:+player.x.toFixed(2),py:+player.y.toFixed(2),hp:Math.round(player.hp),lv:player.level,
  kills:room?.kills||0,alive:(room?.enemies||[]).filter(e=>e.hp>0&&!e.deadRecorded).length,stage:room?.encounterStage||null,done:typeof completed==='function'&&room?completed(room.id):null,
  on:C?.prefs?.().on,cinRun:window.__STORYWORLD_CINEMA_RUN_R461__?.active?.(),said:S.said??S.spoken??null,shown:S.shown??null,q:ci.queue??ci.q??null,silent:S.silent??null,cstats:S,
  heap:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null,nf:window.__QA_NF.n,fastErr:window.__QA_FASTERR||0,fastLast:window.__QA_FASTLAST||null,nfLast:window.__QA_NF.last,badPos:bad,
  vid:{p:window.__QA_VIDEO.plays.length,e:window.__QA_VIDEO.ends.length,err:window.__QA_VIDEO.errors.length,list:window.__QA_VIDEO.plays.slice(-3)},
  vEl:[...document.querySelectorAll('video')].filter(v=>!v.paused).map(v=>String(v.currentSrc).split('/').pop()),
  deaths:window.__H?.deaths?.length||0,lastDeath:window.__H?.deaths?.length?window.__H.deaths[window.__H.deaths.length-1]:null,hero:player.hero,smDone:!!window.__STORYWORLD_SAMONG_R103__?.state?.()?.done,smEp:window.__STORYWORLD_SAMONG_R103__?.state?.()?.ep??null,smStage:room?.samongR103?.stage||null,ending:!!document.querySelector('#endingR54,.ending-r54')||null};});
while(Date.now()-t0<+MIN*60000){let s;try{s=await snap();}catch(e){log({kind:'snapfail',e:String(e).slice(0,200)});await new Promise(r=>setTimeout(r,5000));continue;}
 s.wall=Math.round((Date.now()-t0)/1000);log(s);
 if(!visited.length||visited[visited.length-1].room!==s.room||visited[visited.length-1].sm!==s.sm){visited.push({room:s.room,sm:s.sm,wall:s.wall,t:s.t});console.log(`[${s.wall}s] → ${s.room}${s.sm?' '+s.sm:''} t=${s.t} lv=${s.lv} heap=${s.heap}MB`);}
 const sig=[s.room,s.sm,Math.round(s.px*2),Math.round(s.py*2),s.kills,JSON.stringify(s.cstats).length+':'+JSON.stringify(s.cstats),s.scene,s.vid.p,s.vid.e].join('|');
 if(last&&sig===last.sig&&!s.loading){if(stillSince==null)stillSince=last.s;if(s.t-stillSince.t>90&&!stalls.some(x=>x.room===s.room&&x.since===stillSince.t)){stalls.push({room:s.room,sm:s.sm,since:stillSince.t,wall:s.wall});const dg=await p.evaluate(()=>{const o=room.objective,G=window.__STORYWORLD_GUIDE_R77__;let ph=null;try{ph=window.__STORYWORLD_WORLD_COMBAT_R78__?.phase?.()??null}catch(_){}
   return{obj:o?{x:+o.x.toFixed(2),y:+o.y.toFixed(2),d:+Math.hypot(o.x-player.x,o.y-player.y).toFixed(2)}:null,guide:typeof guide!=='undefined'?guide:null,auto:typeof auto!=='undefined'?auto:null,route:typeof route!=='undefined'?route.length:null,routeNext:typeof route!=='undefined'&&route[0]?{x:+route[0].x.toFixed(2),y:+route[0].y.toFixed(2)}:null,
    engaged:room.engaged,ph,bosses:(regionById?.[room.id]?.bosses||[]).length,enemies:(room.enemies||[]).map(e=>({n:String(e.name).slice(0,20),hp:Math.round(e.hp),st:e.spawnState,boss:!!e.boss,mid:!!e.midboss,dead:!!e.deadRecorded})).slice(0,12),
    panel:modal?(document.getElementById('panel')?.innerText||'').slice(0,300):null,quest:document.getElementById('questText')?.textContent,dest:document.getElementById('questDestination')?.textContent,toast:document.getElementById('toast')?.textContent,
    guideInfo:G?.inspect?.()?JSON.stringify(G.inspect()).slice(0,600):null,blockedHere:typeof blocked==='function'?blocked(player.x,player.y,.29,room):null,
    pathToObj:o&&typeof findPath==='function'?findPath({x:player.x,y:player.y},o).length:null};}).catch(e=>({err:String(e)}));
  log({kind:'stalldiag',room:s.room,dg});console.log('STALLDIAG',JSON.stringify(dg).slice(0,1500));
  console.log('STALL',JSON.stringify(stalls[stalls.length-1]),JSON.stringify({modal:s.modal,scene:s.scene,stage:s.stage,alive:s.alive,done:s.done}));}}else stillSince=null;
 last={sig,s};
 if(END.startsWith('Z:')?s.sm===END.slice(2)&&!s.loading:END==='samong'?s.smDone&&!s.sm&&!s.loading:s.room===END&&(END!=='village'||s.done)&&!s.loading){if(!process.env.LINGER||s.wall>+process.env.LINGER)break;}
 if(STORY){const rd=await p.evaluate(()=>{let n=0;for(;n<300&&storyScene;n++)advanceScene();let closed=null;if(modal&&!loading){closed=(document.getElementById('panel')?.innerText||'').slice(0,60);try{closePanel(true)}catch(_){}}if(!guide){guide=true;auto=true;window.__STORYWORLD_GUIDE_R77__?.syncGuide?.();}return{n,closed};}).catch(()=>null);if(rd&&(rd.n||rd.closed))log({kind:'read',...rd,wall:s.wall,room:s.room});}
 await new Promise(r=>setTimeout(r,5000));}
const fin=await snap().catch(()=>null);
const vids=await p.evaluate(()=>window.__QA_VIDEO).catch(()=>null);const deaths=await p.evaluate(()=>window.__H.deaths).catch(()=>null);
const sum={kind:'summary',START,END,reached:fin?.room,wallMin:+((Date.now()-t0)/60000).toFixed(1),gameT:fin?.t,visited,stalls,pageErrors:errs.length,errs:errs.slice(0,8),nf:fin?.nf,nfLast:fin?.nfLast,badPos:fin?.badPos,heap:fin?.heap,videos:vids,deaths};
log(sum);console.log(JSON.stringify(sum));out.end();await b.close();
