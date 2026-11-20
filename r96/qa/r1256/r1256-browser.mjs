// R1256 브라우저 검사(헤드리스): 서사 영상 장면(입장 영상 4종 + 선화 컷신 r880)에서 '음성 앞으로 끄기'(R1223)와 '건너뛰기' 단추가
// 겹치지 않고, 둘 다 화면 안에서 눌리는 자리에 있는지. PC(1280×720·1920×1080·1366×768)와 모바일 가로(812×375·667×375)·세로(375×812).
//  실행: 빌드한 site 를 정적 서버로 올린 뒤 SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1256/r1256-browser.mjs
//  헤드리스 소프트웨어 렌더링이라 실기기·GPU·실제 손가락 터치 확인은 아니다(미검증으로 따로 적음).
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const BASE=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const URL=BASE+(BASE.includes('?')?'&':'?')+'cdn=off';const SHOTS=process.env.SHOTS||'';
const res=[];const check=(n,ok,d='')=>{res.push({n,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+n+(d!==''?' :: '+d:''));};
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const errors=[];
const ctx=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
await p.goto(URL,{timeout:180000,waitUntil:'domcontentloaded'});
await p.waitForFunction(()=>typeof booted!=='undefined'&&booted&&document.getElementById('campaignNew54'),null,{timeout:240000});
await p.click('#campaignNew54');await p.locator('button',{hasText:'새 게임 시작'}).first().click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.evaluate(()=>{while(storyScene)advanceScene();closePanel(true);});
const VIEWS=[[1280,720],[1920,1080],[1366,768],[812,375],[667,375],[375,812]];
const SCENES=[
 {id:'r369v',open:'window.__STORYWORLD_POISON_CITY_VIDEO_R369__.play()',close:'window.__STORYWORLD_POISON_CITY_VIDEO_R369__.skip()'},
 {id:'r368v',open:'window.__STORYWORLD_BETRAYAL_VIDEO_R368__.play()',close:'window.__STORYWORLD_BETRAYAL_VIDEO_R368__.skip()'},
 {id:'r372v',open:'window.__STORYWORLD_ROOT_GATE_VIDEO_R372__.play()',close:'window.__STORYWORLD_ROOT_GATE_VIDEO_R372__.skip()'},
 {id:'r617v',open:"window.__STORYWORLD_HWANDO_FALL_VIDEO_R617__.play('knight')",close:'window.__STORYWORLD_HWANDO_FALL_VIDEO_R617__.skip()'},
 {id:'r880',open:"window.__STORYWORLD_LINEART_R880__.play({zone:'dist01'})",close:'window.__STORYWORLD_LINEART_R880__.skip()'},
];
// 루트 안의 눌리는 단추(보이는 것)를 모두 재고, 서로 겹침·화면 밖·가림을 본다.
const measure=id=>p.evaluate(id=>{const r=document.getElementById(id);if(!r)return null;const vw=innerWidth,vh=innerHeight;
 const els=[...r.querySelectorAll('button,[role=button]')].filter(e=>{const s=getComputedStyle(e),q=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&+s.opacity>0.05&&q.width>0&&q.height>0;});
 const box=e=>{const q=e.getBoundingClientRect();return {cls:e.className,txt:String(e.textContent||'').trim().slice(0,14),l:Math.round(q.left),t:Math.round(q.top),r:Math.round(q.right),b:Math.round(q.bottom),
  hit:(()=>{const h=document.elementFromPoint(q.left+q.width/2,q.top+q.height/2);return h===e||e.contains(h);})(),inView:q.left>=0&&q.top>=0&&q.right<=vw&&q.bottom<=vh};};
 const B=els.map(box);const pairs=[];for(let i=0;i<B.length;i++)for(let j=i+1;j<B.length;j++){const a=B[i],c=B[j];if(a.l<c.r&&c.l<a.r&&a.t<c.b&&c.t<a.b)pairs.push(a.txt+' × '+c.txt);}
 const cap=r.querySelector('.cap');let capHit=[];if(cap&&cap.textContent.trim()){const q=cap.getBoundingClientRect();for(const x of B)if(x.l<q.right&&q.left<x.r&&x.t<q.bottom&&q.top<x.b)capHit.push(x.txt);}
 return {vw,vh,btns:B,overlap:pairs,capHit,voice:B.find(x=>/r1223btn/.test(x.cls))||null,skip:B.find(x=>/\bskip\b/.test(x.cls))||null};},id);
for(const S of SCENES){await p.setViewportSize({width:1280,height:720});
 await p.evaluate(S.open);
 const opened=await p.waitForFunction(id=>!!document.querySelector('#'+id+' .r1223btn')&&!!document.querySelector('#'+id+' .skip'),S.id,{timeout:15000}).then(()=>true,()=>false);
 check(`${S.id} 장면이 열리고 음성 끄기·건너뛰기 단추가 둘 다 있음`,opened);if(!opened)continue;
 for(const [w,h] of VIEWS){await p.setViewportSize({width:w,height:h});await p.waitForTimeout(700);const m=await measure(S.id);
  const tag=`${S.id} ${w}×${h}`;
  check(`${tag} 음성 끄기 ↔ 건너뛰기 겹치지 않음`,m&&m.voice&&m.skip&&!(m.voice.l<m.skip.r&&m.skip.l<m.voice.r&&m.voice.t<m.skip.b&&m.skip.t<m.voice.b),JSON.stringify({v:m?.voice,s:m?.skip}));
  check(`${tag} 장면 안 단추끼리 겹침 0`,m&&m.overlap.length===0,JSON.stringify(m?.overlap));
  check(`${tag} 두 단추 모두 화면 안`,m&&m.voice?.inView&&m.skip?.inView);
  check(`${tag} 두 단추 모두 가운데를 누르면 그 단추가 눌림`,m&&m.voice?.hit&&m.skip?.hit);
  check(`${tag} 음성 끄기와 건너뛰기 사이 간격 4px 이상`,m&&m.voice&&m.skip&&Math.max(m.skip.l-m.voice.r,m.voice.l-m.skip.r,m.skip.t-m.voice.b,m.voice.t-m.skip.b)>=4);
  if(m?.capHit?.length)console.log('  (참고) 자막과 겹치는 단추: '+m.capHit.join(','));
  if(SHOTS&&(w===812||w===1280))await p.screenshot({path:`${SHOTS}/r1256-${S.id}-${w}x${h}.png`});}
 await p.setViewportSize({width:1280,height:720});
 // 누르기: 음성 끄기를 눌러도 장면이 닫히지 않고(건너뛰기로 번지지 않음), 다시 켬
 const before=await p.evaluate(id=>!!document.getElementById(id),S.id);await p.click(`#${S.id} .r1223btn`);await p.waitForTimeout(300);
 const after=await p.evaluate(id=>({open:!!document.getElementById(id),on:window.__STORYWORLD_MEMORY_VOICE_R1223__.inspect().on}),S.id);
 check(`${S.id} 음성 끄기를 눌러도 장면이 계속됨·끔으로 바뀜`,before&&after.open&&after.on===false,JSON.stringify(after));
 await p.click(`#${S.id} .r1223btn`);await p.waitForTimeout(200);
 await p.evaluate(S.close);await p.waitForFunction(id=>!document.getElementById(id)||getComputedStyle(document.getElementById(id)).display==='none',S.id,{timeout:8000}).catch(()=>{});
 await p.waitForTimeout(600);}
const mi=await p.evaluate(()=>window.__STORYWORLD_MEMORY_VOICE_R1223__.inspect());check('모듈 오류 0',mi.stats.moduleErrors===0,JSON.stringify(mi.lastError||''));
check('페이지 오류 0',errors.length===0,JSON.stringify(errors.slice(0,3)));
await b.close();const failed=res.filter(r=>!r.ok).length;console.log(JSON.stringify({total:res.length,failed,method:'playwright headless chromium (no GPU, no real touch)'}));process.exit(failed?1:0);
