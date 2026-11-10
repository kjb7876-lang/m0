// R600 안전 검사(헤드리스): 무한 생존이 스토리 세이브를 덮지 않는지, 생존 뒤 스토리 죽음 화면이 막히지 않는지.
//  1) 스토리 새 게임 → 저장(슬롯 기록) → 타이틀 → 무한 생존 시작 → 메뉴 '쉼터로'(returnHome) → 타이틀로 가고 슬롯 그대로
//  2) 다시 생존 → 생존 중 죽음 = 생존 결과 창(스토리 죽음 화면 아님) → 타이틀 → 슬롯 그대로
//  3) 스토리 이어하기(restoreSave) → 죽음 = 스토리 'MEMORY REMAINS' 복구 화면
//  SW_URL 로 주소를 바꾼다(기본 http://127.0.0.1:4410/m0/).
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';
let fail=0,n=0;const ok=(m,c,x)=>{n++;console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,300):'');if(!c)fail++;};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));const A=f=>p.evaluate(f);
const slots=()=>A(()=>{const st=window.__STORYWORLD_TEST_STORAGE_B1__.store,k=normalSaveKeyR73();return{[k]:st.getItem(k)};});
const skip=()=>A(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const panel=()=>A(()=>document.getElementById('panel')?.textContent||'');
const SV=()=>A(()=>({active:window.__STORYWORLD_SURVIVAL_R600__.active(),st:window.__STORYWORLD_SURVIVAL_R600__.state()}));
const startSurvival=async()=>{await p.locator('#survivalStartR600').click({timeout:120000});await p.locator('[data-r600hero="hwando"]').click();
 try{await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});}catch(e){console.log('DBG',JSON.stringify(await A(()=>({room:room?.id,loading,modal,started,st:window.__STORYWORLD_SURVIVAL_R600__.state(),ins:window.__STORYWORLD_SURVIVAL_R600__.inspect().lastError,panel:(document.getElementById('panel')?.textContent||'').slice(0,120)}))).slice(0,800));throw e;}};
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip();
await A(()=>{saveGame(true);});await p.waitForTimeout(500);const s0=await slots();
ok('story save exists before survival',Object.values(s0).every(v=>typeof v==='string'&&v.length>100),Object.keys(s0));
// 1) 생존 중 메뉴 '쉼터로'
await A(()=>{if(modal)closePanel(true);showTitle();});await startSurvival();
await A(()=>{if(modal)closePanel(true);returnHome();});await p.waitForTimeout(2500);
const r1=await A(()=>({title:!!document.getElementById('survivalStartR600')&&document.getElementById('survivalStartR600').offsetParent!==null,saved:saveGame(false)}));
ok('menu retreat from survival lands on the title',r1.title,r1);
ok('menu retreat never writes the story save (slot unchanged, saves still blocked)',r1.saved===false&&JSON.stringify(await slots())===JSON.stringify(s0),r1);
// 2) 생존 중 죽음
await startSurvival();await A(()=>{if(modal)closePanel(true);showDeath();});await p.waitForTimeout(500);
const t2=await panel();ok('death during survival shows the survival result (not the story recovery panel)',/무한 생존 · 기록/.test(t2)&&!!(await A(()=>document.getElementById('r600Title'))),t2.slice(0,80));
await p.locator('#r600Title').click();await p.waitForTimeout(800);
ok('story save still unchanged after a lost survival run',JSON.stringify(await slots())===JSON.stringify(s0));
// 3) 스토리 이어하기 → 죽음 화면
const loaded=await A(async()=>{const st=window.__STORYWORLD_TEST_STORAGE_B1__.store;let raw=null;try{raw=JSON.parse(st.getItem(normalSaveKeyR73()));}catch(_){}return raw?await restoreSave(raw):false;});
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000}).catch(()=>{});await skip();await p.waitForTimeout(600);await A(()=>{if(modal)closePanel(true);});
const d=await A(()=>{showDeath();return{survival:window.__STORYWORLD_SURVIVAL_R600__.active(),tx:(document.getElementById('panel')?.textContent||'').slice(0,80)};});
ok('story death after a survival run shows the normal recovery panel',/MEMORY REMAINS/.test(d.tx)&&!d.survival,{loaded:loaded!==false,...d});
ok('no page errors',errs.length===0,errs);
console.log('R600 safety',n-fail+'/'+n);await b.close();process.exit(fail?1:0);
