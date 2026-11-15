// R1043 설정 창 전수 목록(헤드리스): 설정 창의 모든 조작(입력·고르기·단추)을 구역 제목·보이는지·글과 함께 JSON 으로 적는다.
// 실행: SW_URL=http://127.0.0.1:4410/m0/ SW_MOBILE=1 node r96/qa/r1043/r1043-inventory.mjs > out.json
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium,devices}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const MOB=process.env.SW_MOBILE==='1';
const b=await chromium.launch();const ctx=MOB?await b.newContext({...devices['iPhone 13 Mini']}):await b.newContext({viewport:{width:1280,height:720}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await p.goto(URL,{timeout:180000,waitUntil:'domcontentloaded'});
await p.waitForFunction(()=>typeof booted!=='undefined'&&booted&&document.getElementById('campaignNew54'),null,{timeout:240000});
await p.evaluate(()=>document.getElementById('campaignNew54').click());await p.waitForTimeout(300);
await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/새 게임 시작/.test(x.textContent));b?.click();});
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.evaluate(()=>{while(storyScene)advanceScene();closePanel(true);});
await p.waitForTimeout(300);await p.evaluate(()=>showSettings());await p.waitForTimeout(1200);
const list=await p.evaluate(()=>{const out=[];
 const head=e=>{let n=e;const hs=[];while(n&&n.id!=='panel'){if(n.matches?.('section,details,fieldset,div[id]')){const h=n.querySelector(':scope>h3,:scope>h2,:scope>summary,:scope>legend,:scope>h4');hs.unshift((n.id?'#'+n.id:n.tagName.toLowerCase())+(h?'「'+h.textContent.trim().replace(/\s+/g,' ').slice(0,30)+'」':''));}n=n.parentElement;}return hs.join(' > ');};
 for(const e of document.querySelectorAll('#panel input,#panel select,#panel button')){const l=e.closest('label');
  out.push({id:e.id||'',checked:e.type==='checkbox'?e.checked:(e.getAttribute('aria-pressed')==='true'||e.classList.contains('active')?true:undefined),data:Object.entries(e.dataset).map(([k,v])=>k+'='+v).join('&'),tag:e.tagName,type:e.type||'',vis:e.checkVisibility?e.checkVisibility():!!e.offsetParent,
   label:((l?l.textContent:e.textContent)||e.title||e.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ').slice(0,70),row:(e.closest('.r114-row,div[id],label')?.textContent||'').trim().replace(/\s+/g,' ').slice(0,90),path:head(e)});}
 return out;});
console.log(JSON.stringify({mobile:MOB,errors:errs,count:list.length,list},null,1));await b.close();
