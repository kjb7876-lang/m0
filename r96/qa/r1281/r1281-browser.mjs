// R1281 777·영웅 전환 렉 헤드리스 검사(소프트웨어 렌더 — GPU·실기기·자연 플레이 미검증)
//  실제 영웅 창 길(영웅 창 열기 → 칸 누르기 → '이 영웅으로 변경')로 777 뒤 8영웅+EGO+페르소나를 바꾸며 그림 기억(디코드 크기)·확정 기다림을 잰다.
//  STORYWORLD_URL=http://127.0.0.1:4396/m0/ [LOWQ=1] [OFF=1] node r96/qa/r1281/r1281-browser.mjs
import {createRequire} from 'node:module';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',LOWQ=process.env.LOWQ==='1',OFF=process.env.OFF==='1';
const b=await chromium.launch({headless:true});const ctx=await b.newContext({viewport:{width:960,height:540}});
await ctx.addInitScript((off)=>{if(off)try{localStorage.setItem('storyworld.r1281.heroMem','0');}catch(_){}},OFF);
const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
if(LOWQ)await p.evaluate(()=>{try{settings.lowFx=true;}catch(_){}try{window.__STORYWORLD_MOBILE_TIER_R1023__.setPref('low');}catch(_){}});
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.go('dist01','STORY');const P=window.__STORYWORLD_PROGRESSION_R71__;if(P?.difficultyState?.().open){P.selectDifficulty('normal');await P.confirmDifficulty();}});
await p.waitForFunction(()=>room?.id==='dist01'&&!loading,null,{timeout:180000});await skip();
await p.evaluate(()=>{guide=false;auto=false;player.invincible=1e9;try{window.__STORYWORLD_EGO_SOVEREIGN_R1046__.unlock('secret-777')}catch(_){}
 window.__mb=()=>{let m=0;for(const r of imageCache.values()){const im=r.image;if(r.ready&&im&&im.naturalWidth)m+=im.naturalWidth*im.naturalHeight*4;}return Math.round(m/1e6);};
 window.__notReady=id=>heroPaths(id).filter(x=>!imageCache.get(cleanPath(x))?.ready).length;});
const base=await p.evaluate(()=>__mb());console.log('base decoded MB',base,'lowq',LOWQ,'off',OFF);
// 한 번 전환: 영웅 창 → 칸 → (wait ms) → 확정. 확정 순간 그 영웅 heroPaths 미준비 수와 확정~닫힘 시간
async function sw(id0,waitMs){return p.evaluate(async([id0,waitMs])=>{showHeroes(false);await new Promise(r=>setTimeout(r,60));
 const pick=()=>(id0==='ego'?document.querySelector('#panel [data-ego-r1046]'):id0==='persona'?document.querySelector('#panel [data-persona-r1113]'):null)||document.querySelector(`#panel button[data-hero="${id0}"]`);
 let el=pick();for(let k=0;k<100&&!el;k++){await new Promise(r=>setTimeout(r,50));el=pick();}if(!el)return{err:'no card '+id0};
 el.click();await new Promise(r=>setTimeout(r,waitMs));const base=id0==='ego'?'hwando':id0==='persona'?'lauren':id0;const nr=__notReady(base);
 const c=document.getElementById('chooseHero');if(!c)return{err:'no choose'};const t=performance.now();c.click();
 for(let k=0;k<600&&(loading||modal);k++)await new Promise(r=>setTimeout(r,25));
 return{id:id0,hero:player.hero,notReadyAtConfirm:nr,ms:Math.round(performance.now()-t)};},[id0,waitMs]);}
const settle=ms=>p.evaluate(ms=>new Promise(r=>setTimeout(r,ms)),ms);
const rows=[];const ORDER=['lauren','neon','slayer','hunter','seoha','gunner','michaela','ego','persona','hwando'];
for(const h of ORDER){const r=await sw(h,1500);await settle(2500);r.mb=await p.evaluate(()=>__mb());rows.push(r);console.log('sw',JSON.stringify(r));}
// 되돌리기: 바로 앞 영웅(페르소나=라우렌 몸)으로 칸 누르고 바로 확정
const back=await sw('lauren',30);await settle(2500);back.mb=await p.evaluate(()=>__mb());console.log('back',JSON.stringify(back));
const end=await p.evaluate(()=>({mb:__mb(),cur:player.hero,curNotReady:__notReady(player.hero),inspect:window.__STORYWORLD_HERO_SWITCH_MEM_R1281__?.inspect?.()||null,
 texMissing:(()=>{const T=window.__STORYWORLD_PHASE1__?.controller?.state?.three?.commands?.textures;if(!T)return -1;let n=0;for(const im of T.keys()){const s=String(im?.src||'');const m=s.match(/assets\/[^?]+/);if(!m)continue;const row=imageCache.get(m[0]);if(row===undefined&&im instanceof HTMLImageElement&&window.__STORYWORLD_HERO_SWITCH_MEM_R1281__?.inspect?.().releasedPaths?.includes(m[0]))n++;}return n;})()}));
console.log('end',JSON.stringify({...end,inspect:end.inspect&&{stats:end.inspect.stats,prefs:end.inspect.prefs}}));
let fails=0;const check=(name,okv,info)=>{if(!okv)fails++;console.log((okv?'PASS ':'FAIL ')+name+(info===undefined?'':' '+JSON.stringify(info).slice(0,800)));};
check('(0) 10번 전환 모두 됨(오류 없음)',rows.every(r=>!r.err),rows.filter(r=>r.err));
const maxMb=Math.max(...rows.map(r=>r.mb)),cap=LOWQ?base+200:base+400;
if(OFF)check('(끄기) 정리 없음 — 예전처럼 쌓임(기준+500MB 넘음)',maxMb>base+500&&!(end.inspect?.stats?.released>0),{base,maxMb});
else{
 check(`(1) 영웅 10번 전환 동안 디코드 그림 기억이 기준+${cap-base}MB 이하(기준 ${base}MB, 예전 +1,000MB 안팎)`,maxMb<=cap,{base,maxMb,rows:rows.map(r=>r.mb)});
 check('(2) 마지막 전환 2.5초 뒤 지금 영웅 heroPaths 그림 모두 준비됨(지금 영웅 그림은 놓지 않음)',end.curNotReady===0,{cur:end.cur,n:end.curNotReady});
 { const first=rows.slice(0,7),sumNR=first.reduce((a,r)=>a+(r.notReadyAtConfirm||0),0),avg=Math.round(first.reduce((a,r)=>a+(r.ms||0),0)/first.length);
  // 고치기 전(qa/r1281/fail-first-browser.txt): 처음 바꾸는 7영웅 확정 순간 미준비 합 284장, 확정~창 닫힘 평균 2,182ms
  check('(3) 영웅 칸을 누르고 1.5초 뒤 확정: 처음 바꾸는 7영웅 확정 순간 미준비 그림 합이 예전(284장)의 30% 이하, 확정 기다림 평균 1,000ms 이하',sumNR<=85&&avg<=1000,{sumNR,avg,rows:first.map(r=>[r.id,r.notReadyAtConfirm,r.ms])}); }
 check('(4) 지금 그려지는(Three 텍스처) 그림을 놓은 일 0',end.texMissing<=0,end.texMissing);
 if(!LOWQ)check('(5) PC 단계: 바로 앞 영웅으로 칸 누르고 바로 확정해도 미준비 0장·0.5초 안',back.notReadyAtConfirm===0&&back.ms<=500,back);
 else check('(5) 낮은 단계: 바로 앞 영웅 몫도 놓아 기억이 더 작음(기준+200MB 이하)',maxMb<=base+200,{maxMb,base});
}
check('(6) 페이지 오류 없음',errors.length===0,errors.slice(0,5));
console.log(JSON.stringify({fails,base,maxMb}));await b.close();process.exit(fails?1:0);
