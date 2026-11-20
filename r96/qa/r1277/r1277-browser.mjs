// R1277 브라우저 검사(헤드리스): 777+페르소나로 7대죄 '붉은 하이힐'(ep1b05) 보스 문 서사에서
//  (가) 새 판은 녹음이 재생되고, (나) 저장된 '음성 앞으로 끄기' 꺼짐이면 무음(재현), (다) 설정 창에서 '서사 음성 자동 재생'을 다시 켜면 녹음이 나온다.
//  실행: 빌드한 site 를 http://127.0.0.1:4410/m0/ 로 올린 뒤 node r96/qa/r1277/r1277-browser.mjs
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const res=[];const check=(n,ok,d='')=>{res.push({n,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+n+(d!==''?' :: '+d:''));};
const b=await chromium.launch();
async function run(off){const ctx=await b.newContext({viewport:{width:1280,height:720}});
 await ctx.addInitScript(off=>{localStorage.setItem('storyworld.r1113.personaHero',JSON.stringify({on:true}));localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r309.opening',JSON.stringify({on:false,seen:true}));
  if(off&&!sessionStorage.getItem('r1277'))localStorage.setItem('storyworld.r1223.memvoice',JSON.stringify({on:false}));sessionStorage.setItem('r1277','1');
  window.__plays=[];const P=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){const s=String(this.currentSrc||this.src||'');const r=P.call(this);if(/r381\/voice/.test(s)){const e={src:s.split('/').pop()};window.__plays.push(e);this.addEventListener('ended',()=>e.ended=true,{once:true});}return r;};},off);
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.goto('http://127.0.0.1:4410/m0/?cdn=off',{timeout:180000,waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>typeof booted!=='undefined'&&booted&&document.getElementById('campaignNew54'),null,{timeout:240000});
 await p.click('#campaignNew54');await p.waitForTimeout(800);await p.locator('[data-persona-r1113]').first().click();
 await p.locator('button',{hasText:'새 게임 시작'}).first().click();await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(1500);
 await p.evaluate(()=>{while(storyScene)advanceScene();closePanel(true);});await p.mouse.click(640,360);
 await p.evaluate(()=>window.__STORYWORLD_CHEAT777__.activate('777'));await p.waitForTimeout(800);await p.evaluate(()=>closePanel(true));
 await p.evaluate(()=>window.__STORYWORLD_CHEAT777__.go('ep1b05'));await p.waitForTimeout(600);if(await p.locator('#r71DifficultyConfirm').count())await p.click('#r71DifficultyConfirm');
 await p.waitForTimeout(1500);await p.waitForFunction(()=>!loading&&zone==='ep1b05',null,{timeout:120000});await p.waitForTimeout(1500);
 const door=async()=>{await p.evaluate(()=>{window.__plays.length=0;readScenes.clear?.();playScenes(nextScenes(regionById[zone],'pre'),()=>{});});await p.waitForFunction(()=>window.__plays.some(x=>x.ended),null,{timeout:20000}).catch(()=>{});await p.waitForTimeout(300);
  const r=await p.evaluate(()=>({hero:player.hero,form:window.__STORYWORLD_PERSONA_HERO_R1113__.inspect().form,cheat:window.__STORYWORLD_CHEAT777__.active(),scene:storyScene?.key,plays:window.__plays.slice(),btn:[...document.querySelectorAll('#panel .r1223btn')].map(e=>e.textContent)[0]||''}));
  await p.evaluate(()=>{while(storyScene)advanceScene();closePanel(true);});return r;};
 return {p,ctx,door,errs};}
{const R=await run(false);const d=await R.door();
 check('(가) 777+페르소나+붉은 하이힐 새 판: 보스 문 서사 녹음 재생·한 문장 끝까지',d.hero==='lauren'&&d.form&&d.cheat&&d.plays.length>=1&&d.plays.some(x=>x.ended),JSON.stringify(d));check('(가) 페이지 오류 0',R.errs.length===0,JSON.stringify(R.errs));await R.ctx.close();}
{const R=await run(true);const d=await R.door();
 check('(나) 저장된 음성 끄기면 무음·서사 창에 음성 켜기 단추(재현)',d.plays.length===0&&/켜기/.test(d.btn),JSON.stringify(d));
 await R.p.evaluate(()=>showSettings());const sel='#panel input[data-setting="narration"]';
 const vis=await R.p.evaluate(s=>{const e=document.querySelector(s),r=e?.getBoundingClientRect();return !!r&&r.width>0;},sel);console.log('narration checkbox visible:',vis);
 // 칸이 화면 밖(설정 창 스크롤)일 수 있어 사용자가 누른 것과 같은 change 이벤트를 보낸다
 for(const v of [false,true]){await R.p.evaluate(([s,v])=>{const e=document.querySelector(s);e.checked=v;e.dispatchEvent(new Event('change',{bubbles:true}));},[sel,v]);await R.p.waitForTimeout(200);}
 const st=await R.p.evaluate(s=>({narr:document.querySelector(s)?.checked,settings:settings.narration,on:window.__STORYWORLD_MEMORY_VOICE_R1223__.prefs().on,chk:document.getElementById('r1223Chk')?.checked}),sel);
 check('(다) 설정에서 서사 음성 자동 재생을 끄고 다시 켜면 음성 끄기도 켜짐',st.narr&&st.settings&&st.on&&st.chk,JSON.stringify(st));
 await R.p.evaluate(()=>closePanel(true));const d2=await R.door();
 check('(다) 그 뒤 보스 문 서사 녹음 재생',d2.plays.length>=1&&d2.plays.some(x=>x.ended),JSON.stringify(d2));check('(다) 페이지 오류 0',R.errs.length===0,JSON.stringify(R.errs));await R.ctx.close();}
await b.close();const failed=res.filter(r=>!r.ok).length;console.log(JSON.stringify({total:res.length,failed,method:'playwright headless chromium (no GPU, no real speaker)'}));process.exit(failed?1:0);
