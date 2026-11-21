// R1284 브라우저 검사(헤드리스, 실제 클릭): 저장된 '음성 앞으로 끄기'(storyworld.r1223.memvoice {on:false}) 상태에서
//  (A) 보스 문 서사 창은 무음이고 단추가 '🔊 음성 켜기' (재현) → (B) 그 단추를 누르면 '지금 이 장면'부터 바로 녹음이 나온다(예전: 다음 장면까지 무음)
//  (C) 다음 장면도 나온다 → (D) 맵 입장 영상(중독의 도시 ep1a10)에서도 '음성 켜기'를 누르면 지금 자막부터 나온다 (E) 페이지 오류 0.
//  실행: 빌드한 site 를 http://127.0.0.1:4410/m0/ 로 올린 뒤 node r96/qa/r1284/r1284-browser.mjs
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const res=[];const check=(n,ok,d='')=>{res.push({n,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+n+(d!==''?' :: '+d:''));};
const b=await chromium.launch();
async function boot(){const ctx=await b.newContext({viewport:{width:1280,height:720}});
 await ctx.addInitScript(()=>{Object.defineProperty(Navigator.prototype,'webdriver',{get:()=>false});localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r309.opening',JSON.stringify({on:false,seen:true}));
  if(!sessionStorage.getItem('r1284')){localStorage.setItem('storyworld.r1223.memvoice',JSON.stringify({on:false}));sessionStorage.setItem('r1284','1');}
  window.__plays=[];const P=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){const s=String(this.currentSrc||this.src||'');const r=P.call(this);if(/r381\/voice/.test(s)){const e={src:s.split('/').pop().slice(0,8)};window.__plays.push(e);this.addEventListener('playing',()=>e.playing=true,{once:true});this.addEventListener('ended',()=>e.ended=true,{once:true});}return r;};});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.goto('http://127.0.0.1:4410/m0/?cdn=off',{timeout:180000,waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>typeof booted!=='undefined'&&booted&&document.getElementById('campaignNew54'),null,{timeout:240000});
 await p.click('#campaignNew54');await p.waitForTimeout(800);await p.locator('button',{hasText:'새 게임 시작'}).first().click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(1500);
 for(let k=0;k<20;k++){const busy=await p.evaluate(()=>{window.__STORYWORLD_INTRO_VIDEO_R309__?.skip?.();while(storyScene)advanceScene();closePanel(true);return !!document.querySelector('#r309v,#r309,#r617v,#r880')||loading;});if(!busy)break;await p.waitForTimeout(1000);}
 await p.mouse.click(640,360);return {ctx,p,errs};}
const S=p=>p.evaluate(()=>({plays:window.__plays.slice(),btn:[...document.querySelectorAll('.r1223btn')].map(e=>e.textContent)[0]||'',on:window.__STORYWORLD_MEMORY_VOICE_R1223__.prefs().on,scene:storyScene?.key||null}));
{const {ctx,p,errs}=await boot();
 await p.evaluate(()=>window.__STORYWORLD_CHEAT777__.activate('777'));await p.waitForTimeout(800);await p.evaluate(()=>closePanel(true));
 await p.evaluate(()=>window.__STORYWORLD_CHEAT777__.go('dist00'));await p.waitForTimeout(600);if(await p.locator('#r71DifficultyConfirm').count())await p.click('#r71DifficultyConfirm');
 await p.waitForFunction(()=>!loading&&zone==='dist00',null,{timeout:120000});await p.waitForTimeout(1500);
 await p.evaluate(()=>{window.__plays.length=0;readScenes.clear?.();playScenes(nextScenes(regionById[zone],'pre'),()=>{});});await p.waitForTimeout(2500);
 const a=await S(p);check('(A) 저장된 음성 끄기 → 보스 문 서사 무음·단추 "음성 켜기"(재현)',a.scene&&a.plays.length===0&&/켜기/.test(a.btn),JSON.stringify(a));
 await p.locator('#panel .r1223btn').click();await p.waitForFunction(()=>window.__plays.some(x=>x.playing),null,{timeout:6000}).catch(()=>{});
 const b1=await S(p);check('(B) "음성 켜기"를 누르면 같은 장면에서 6초 안에 녹음이 나옴',b1.on&&b1.scene===a.scene&&b1.plays.some(x=>x.playing),JSON.stringify(b1));
 await p.evaluate(()=>{window.__plays.length=0;readScenes.clear?.();while(storyScene)advanceScene();playScenes(nextScenes(regionById[zone],'pre'),()=>{});});
 await p.waitForFunction(()=>window.__plays.some(x=>x.playing),null,{timeout:8000}).catch(()=>{});
 const c=await S(p);check('(C) 다음 장면도 녹음이 나옴',c.plays.some(x=>x.playing),JSON.stringify(c));
 const re=await p.evaluate(()=>localStorage.getItem('storyworld.r1223.memvoice'));check('(C) 켜짐이 저장됨',/"on":true/.test(re),re);
 check('(E) 페이지 오류 0 (보스 문)',errs.length===0,JSON.stringify(errs));await ctx.close();}
{const {ctx,p,errs}=await boot();
 await p.evaluate(()=>{localStorage.removeItem('storyworld.r369.poison');window.__STORYWORLD_POISON_CITY_VIDEO_R369__.setPrefs({seen:false});window.__plays.length=0;enterRegion('ep1a10',null,{restore:true});});
 const cap=await p.waitForFunction(()=>!!document.querySelector('#r369v .cap.on')?.textContent?.trim(),null,{timeout:90000}).then(()=>true).catch(()=>false);
 await p.waitForTimeout(800);const d0=await S(p);check('(D) 입장 영상 자막이 뜸·저장된 끄기로 무음·단추 "음성 켜기"',cap&&d0.plays.length===0&&/켜기/.test(d0.btn),JSON.stringify(d0));
 await p.locator('#r369v .r1223btn').click();await p.waitForFunction(()=>window.__plays.some(x=>x.playing),null,{timeout:6000}).catch(()=>{});
 const d1=await S(p);const still=await p.evaluate(()=>!!document.getElementById('r369v'));
 check('(D) 영상에서 "음성 켜기"를 누르면 지금 자막부터 6초 안에 녹음이 나옴',d1.on&&d1.plays.some(x=>x.playing),JSON.stringify({d1,still}));
 check('(E) 페이지 오류 0 (영상)',errs.length===0,JSON.stringify(errs));await ctx.close();}
await b.close();const failed=res.filter(r=>!r.ok).length;console.log(JSON.stringify({total:res.length,failed,method:'playwright headless chromium (no GPU, no real speaker)'}));process.exit(failed?1:0);
