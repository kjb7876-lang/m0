// R1269 해금 전 챕터 제목 묵색 가림 — 헤드리스 브라우저 검사(그래픽·GPU·실기기 검증 아님).
//  사용자 2026-11-20 "해금전에 챕터 제목 묵색으로 가려서 스포방지 시작메뉴".
//  실행: SW_URL=http://127.0.0.1:4396/m0/ [SW_SHOT=폴더] node r96/qa/r1269/r1269-browser.mjs
//  PC(1280×720)·폰(390×844 터치) 각각: 새 게임 → 지도 창
//  ① 잠긴 부 제목(h3)은 "제N부 — " 만 보이고 이름은 먹으로 가림 · 열린 1부는 그대로
//  ② 잠긴 지역 칸: 자기 이름·이웃 잠긴 이름이 글자로 남지 않음(DOM 에도 없음) · 그림 alt 비움 · 열린 칸 이름은 그대로
//  ③ 지도 창 글 전체에 잠긴 이름이 하나도 없음  ④ 먹 덩어리가 실제로 보임(배경 그림·크기·화면 안)
//  ⑤ 잠긴 지역 정보 창: 제목·부 이름·보스 이름 가림 / 열린 지역 정보는 그대로
//  ⑥ 777 해금 뒤 지도: 가림 0, 모든 이름 보임  ⑦ 끄기 스위치('0') → 가림 0  ⑧ 지도 창 가로 넘침 없음·먹이 자기 칸 안(폰은 문서 전체도)  ⑨ 페이지 오류 0
import {createRequire} from 'node:module';import fs from 'node:fs';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4396/m0/',SHOT=process.env.SW_SHOT||'';if(SHOT)fs.mkdirSync(SHOT,{recursive:true});
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined&&!c?': '+JSON.stringify(d).slice(0,700):''));};
const b=await chromium.launch();
async function run(tag,opt){
 const ctx=await b.newContext(opt);
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r790.npc','{"on":false}');});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
 const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
 // 시작 직후 첫 showWorld 는 창을 채우기만 하고 모달을 띄우지 않을 때가 있어(기존 동작) 보일 때까지 다시 연다
 const openMap=async()=>{for(let k=0;k<4;k++){await p.evaluate(()=>{if(modal)closePanel(true);showWorld();});await p.waitForTimeout(400);if(await p.evaluate(()=>document.getElementById('panel').checkVisibility()))return;}};
 const readMap=()=>p.evaluate(()=>{
  const W=window.__STORYWORLD4__,open=id=>W.isUnlocked(id,layer);
  const panel=document.getElementById('panel'),txt=panel.textContent;
  const lockedR=regions.filter(r=>!open(r.id)&&!visited.has(layerKey(r.id))&&!completed(r.id));
  const openR=regions.filter(r=>!lockedR.includes(r));
  const openTitles=openR.map(r=>r.title);
  const leak=lockedR.map(r=>r.title).filter(t=>!openTitles.some(o=>o.includes(t))&&txt.includes(t));
  const chOpen=chapters.map((c,i)=>openR.some(r=>r.chapterIndex===i));
  const h3=[...panel.querySelectorAll('section.chapter')].filter(s=>s.querySelector('.worldgrid')).map(s=>s.querySelector('h3')).map(h=>h.textContent);
  const name=c=>c.split(/\s[—–-]\s/).slice(1).join(' — ');
  const chLeak=chapters.filter((c,i)=>!chOpen[i]&&txt.includes(name(c)));
  const h3Bad=chapters.map((c,i)=>chOpen[i]?(h3[i]===c?null:['open',i,h3[i]]):(h3[i]&&h3[i].startsWith(c.split(/\s[—–-]\s/)[0])&&!h3[i].includes(name(c))?null:['locked',i,h3[i]])).filter(Boolean);
  const nodes=[...panel.querySelectorAll('.worldnode[data-zone]')];
  const lockedNodes=nodes.filter(nd=>lockedR.some(r=>r.id===nd.dataset.zone));
  const nodeBad=lockedNodes.filter(nd=>{const r=regionById[nd.dataset.zone];return nd.textContent.includes(r.title)||(nd.querySelector('img')?.alt||'')!=='';}).map(nd=>nd.dataset.zone);
  const openShown=nodes.filter(nd=>openR.some(r=>r.id===nd.dataset.zone)).every(nd=>nd.querySelector('strong').textContent===regionById[nd.dataset.zone].title);
  const veils=[...panel.querySelectorAll('.r1269Veil')];
  const vw=innerWidth;
  const shown=veils.filter(v=>v.checkVisibility());const vis=shown.slice(0,40).map(v=>{const cs=getComputedStyle(v),rc=v.getBoundingClientRect(),box=(v.closest('.worldnode')||v.closest('h3')||panel).getBoundingClientRect();return {bg:cs.backgroundImage!=='none',tr:cs.color==='rgba(0, 0, 0, 0)',w:rc.width,h:rc.height,in:rc.right<=Math.min(vw,box.right)+1&&rc.left>=box.left-1};});
  return {shown:shown.length,locked:lockedR.length,open:openR.length,leak,chLeak,h3Bad,nodeBad,lockedNodes:lockedNodes.length,openShown,veils:veils.length,visBad:vis.filter(v=>!(v.bg&&v.tr&&v.w>=14&&v.h>=8&&v.in)),overflow:panel.scrollWidth>panel.clientWidth+1,docOver:document.documentElement.scrollWidth>vw+1};
 });
 await openMap();const m=await readMap();
 if(SHOT){await p.screenshot({path:`${SHOT}/${tag}-map.png`});await p.evaluate(()=>{const s=[...document.querySelectorAll('#panel section.chapter')][1];s&&s.scrollIntoView();});await p.waitForTimeout(150);await p.screenshot({path:`${SHOT}/${tag}-map-ch2.png`});}
 ok(m.locked>10&&m.open>=1,`[${tag}] 새 게임: 잠긴 지역이 있음`,{locked:m.locked,open:m.open});
 ok(m.h3Bad.length===0,`[${tag}] ① 잠긴 부 제목은 "제N부 — "만, 열린 부는 그대로`,m.h3Bad.slice(0,4));
 ok(m.lockedNodes>10&&m.nodeBad.length===0,`[${tag}] ② 잠긴 지역 칸에 자기 이름·그림 설명이 남지 않음`,{n:m.lockedNodes,bad:m.nodeBad.slice(0,6)});
 ok(m.openShown,`[${tag}] ② 열린 지역 칸 이름은 그대로`);
 ok(m.leak.length===0&&m.chLeak.length===0,`[${tag}] ③ 지도 창 글 전체에 잠긴 지역·부 이름 없음`,{leak:m.leak.slice(0,6),ch:m.chLeak});
 ok(m.shown>=m.lockedNodes&&m.visBad.length===0,`[${tag}] ④ 먹 덩어리가 보임(그림 배경·투명 글자·크기·화면 안)`,{veils:m.veils,shown:m.shown,bad:m.visBad.slice(0,3)});
 ok(!m.overflow&&(tag!=='phone'||!m.docOver),`[${tag}] ⑧ 지도 창 가로 넘침 없음(폰은 문서 전체도)`,{overflow:m.overflow,doc:m.docOver});
 // ⑤ 지역 정보 창
 const info=await p.evaluate(async()=>{const W=window.__STORYWORLD4__;const lk=regions.find(r=>!W.isUnlocked(r.id,layer)&&r.bosses.length&&!visited.has(layerKey(r.id)));const op=regions.find(r=>W.isUnlocked(r.id,layer)&&r.id!=='hub')||regionById.hub;
  showRegionInfo(lk.id);await new Promise(r=>setTimeout(r,300));const t1=document.getElementById('panel').textContent,h=document.querySelector('#panel h2')?.textContent||'';
  const bossLeak=lk.bosses.map(b=>b.name).filter(nm=>nm&&t1.includes(nm));const name=lk.chapter.split(/\s[—–-]\s/).slice(1).join(' — ');
  const img=document.querySelector('#panel .storyArt img');const imgF=img?getComputedStyle(img).filter:'none';
  showRegionInfo(op.id);await new Promise(r=>setTimeout(r,300));const t2=document.getElementById('panel').textContent;
  return {id:lk.id,titleLeak:t1.includes(lk.title),h,bossLeak,chLeak:!!name&&t1.includes(name)&&!regions.some(r=>W.isUnlocked(r.id,layer)&&r.chapter===lk.chapter),imgF,openOk:t2.includes(op.title)};});
 if(SHOT){await p.evaluate(()=>{const W=window.__STORYWORLD4__;const lk=regions.find(r=>!W.isUnlocked(r.id,layer)&&r.bosses.length);showRegionInfo(lk.id);});await p.waitForTimeout(300);await p.screenshot({path:`${SHOT}/${tag}-info.png`});}
 ok(!info.titleLeak&&info.bossLeak.length===0&&!info.chLeak&&/blur|brightness/.test(info.imgF),`[${tag}] ⑤ 잠긴 지역 정보 창: 이름·보스·부 이름 가림, 그림 흐림`,info);
 ok(info.openOk,`[${tag}] ⑤ 열린 지역 정보 창 이름은 그대로`,info);
 // ⑦ 끄기
 await p.evaluate(()=>localStorage.setItem('storyworld.r1269.veil','0'));await openMap();
 const off=await p.evaluate(()=>document.querySelectorAll('#panel .r1269Veil').length);ok(off===0,`[${tag}] ⑦ 끄기 스위치 → 가림 0`,off);
 await p.evaluate(()=>localStorage.removeItem('storyworld.r1269.veil'));
 // ⑥ 777
 await p.evaluate(async()=>{if(modal)closePanel(true);await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
 await openMap();const m7=await readMap();
 const allShown=await p.evaluate(()=>{const t=document.getElementById('panel').textContent;return regions.filter(r=>!t.includes(r.title)).map(r=>r.id);});
 ok(m7.locked===0&&m7.veils===0&&allShown.length===0,`[${tag}] ⑥ 777 해금 뒤: 가림 0, 모든 지역 이름 보임`,{locked:m7.locked,veils:m7.veils,missing:allShown.slice(0,5)});
 if(SHOT)await p.screenshot({path:`${SHOT}/${tag}-map-777.png`});
 ok(errs.length===0,`[${tag}] ⑨ 페이지 오류 0`,errs.slice(0,4));
 await ctx.close();
}
await run('pc',{viewport:{width:1280,height:720},deviceScaleFactor:1});
await run('phone',{viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
console.log(`\n${n-bad}/${n} 통과`);await b.close();process.exit(bad?1:0);
