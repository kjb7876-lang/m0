// R1092 브라우저 검사(헤드리스): 서사 창 장면 그림. 이야기 모드 PC 1280×720 과 폰 375×812.
//  보스 입장 서사 창을 띄워 img.bg 가 장면 그림(assets/r1092)으로 바뀌고 실제로 읽혔는지(naturalWidth), 초상은 그대로인지,
//  맘몬 지역은 원래 지도 그림인지, 수묵화풍이 켜진 지역은 먹빛 필터인지 본다.
//  실행: SW_URL=http://127.0.0.1:4410/m0/ SW_SHOT=<폴더/> node r96/qa/r1092/r1092-browser.mjs
//  헤드리스라 실기기·GPU 확인은 아니다.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const SHOT=process.env.SW_SHOT||'';
const res=[];const check=(n,ok,d='')=>{res.push({n,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+n+(d!==''?' :: '+d:''));};
const b=await chromium.launch();const errors=[];
async function story(vp,touch){const ctx=await b.newContext({viewport:vp,deviceScaleFactor:1,hasTouch:!!touch,isMobile:!!touch});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e).slice(0,200)));await p.goto(URL,{timeout:180000,waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>typeof booted!=='undefined'&&booted&&document.getElementById('campaignNew54'),null,{timeout:240000});
 await p.click('#campaignNew54');await p.locator('button',{hasText:'새 게임 시작'}).first().click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.evaluate(()=>{while(storyScene)advanceScene();closePanel(true);});return {ctx,p};}
async function open(p,id){await p.evaluate(()=>{while(storyScene)advanceScene();closePanel(true);});
 const n=await p.evaluate(id=>{const r=regionById[id];const s=nextScenes(r,'pre');const all=s.length?s:(r.records||[]);if(!s.length)return 0;playScenes(s,()=>{});return s.length;},id);
 await p.waitForTimeout(500);await p.evaluate(()=>document.getElementById('r255Cinema')?.click());await p.waitForTimeout(300);
 await p.waitForFunction(()=>{const i=document.querySelector('#panel .storyArt img.bg');return !i||i.complete;},null,{timeout:30000}).catch(()=>{});
 return {n,info:await p.evaluate(()=>{const bg=document.querySelector('#panel .storyArt img.bg'),a=document.querySelector('#panel .storyArt img.actor');
  const pin=document.querySelector('#panel .r1092Pin'),pi=pin?.querySelector('img'),pr=pin?.getBoundingClientRect(),pn=document.getElementById('panel').getBoundingClientRect();
  return {pinVis:!!pr&&pr.width>40&&pr.height>40,pinNw:pi?.naturalWidth||0,pinSrc:pi?.getAttribute('src')||'',pinFilter:pi?.style.filter||'',panelFits:pn.top>=-1&&pn.bottom<=innerHeight+1,panel:[Math.round(pn.top),Math.round(pn.bottom),innerHeight],scene:storyScene?.id||null,bg:bg?.getAttribute('src')||bg?.src||'',nw:bg?.naturalWidth||0,filter:bg?.style.filter||'',actor:a?.src||'',stats:window.__STORYWORLD_SCENE_ART_R1092__?.stats()};})};}
for(const [T,vp,touch] of [['PC',{width:1280,height:720},false],['폰',{width:375,height:812},true]]){
 const {ctx,p}=await story(vp,touch);
 const ids=await p.evaluate(()=>regions.filter(r=>nextScenes(r,'pre').length).map(r=>r.id));
 check(`${T}: 전투 전 서사가 있는 지역 3곳 이상`,ids.length>=3,ids.slice(0,8).join(','));
 const pick=ids.find(i=>i!=='ep1b06')||ids[0];
 const a=await open(p,pick);
 check(`${T} ${pick} 쪽지 창에 장면 그림이 실제로 보이고 읽힘`,a.info.pinVis&&/assets\/r1092\/scene-/.test(a.info.pinSrc)&&a.info.pinNw>=500,JSON.stringify(a.info));
 check(`${T} ${pick} 쪽지 창이 화면 안에 들어감`,a.info.panelFits,JSON.stringify(a.info.panel));
 check(`${T} 초상(actor)은 r1092 그림이 아님`,!/r1092/.test(a.info.actor),a.info.actor);
 if(SHOT)await p.screenshot({path:SHOT+(T==='PC'?'pc':'phone')+'-'+pick+'.png'});
 if(ids.includes('last302')){const c=await open(p,'last302');const inkOn=await p.evaluate(()=>{try{return !!window.__STORYWORLD_INK_WASH_R1055__?.wants('last302');}catch(_){return false;}});
  check(`${T} last302 수묵 켜짐이면 먹빛 필터, 아니면 원래 색`,c.info.pinVis&&(inkOn?/grayscale/.test(c.info.pinFilter):!/grayscale/.test(c.info.pinFilter)),JSON.stringify({inkOn,f:c.info.pinFilter}));
  if(SHOT)await p.screenshot({path:SHOT+(T==='PC'?'pc':'phone')+'-last302.png'});}
 if(ids.includes('ep1b06')){const m=await open(p,'ep1b06');check(`${T} 맘몬 지역은 r1092 그림 아님(쪽지 칸 없음)`,!/r1092/.test(m.info.bg)&&!m.info.pinVis&&!m.info.pinSrc,m.info.bg);}
 const st=await p.evaluate(()=>window.__STORYWORLD_SCENE_ART_R1092__?.stats());
 check(`${T} 모듈 오류 0·읽기 실패 0`,st&&!st.lastError&&st.fallback===0,JSON.stringify(st));
 await ctx.close();}
check('페이지 오류 0',errors.length===0,errors.slice(0,3).join(' | '));
await b.close();const f=res.filter(r=>!r.ok).length;console.log(JSON.stringify({revision:'R1092',checks:res.length,failed:f}));process.exit(f?1:0);
