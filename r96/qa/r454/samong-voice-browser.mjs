// R454 headless check (Playwright): 사몽 구역에 들어가면 영화 모드가 사몽 ② 서사를 녹음(assets/r381/voice/<id>.mp3)으로 트는지.
//   STORYWORLD_URL=http://127.0.0.1:4396/m0/ OUT=out/r454 node r96/qa/r454/samong-voice-browser.mjs
// 헤드리스: 오디오 장치 없이 받기·디코딩·재생 진행·끝 알림만 본다. 실제 소리 품질·실기기 모바일·자연 플레이는 미검증.
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out/r454',Z=process.env.Z||'sz115-S01-1';fs.mkdirSync(OUT,{recursive:true});
let fails=0;const results=[];const check=(name,ok,info)=>{results.push({name,ok:!!ok,info});if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+name+(info===undefined?'':' '+JSON.stringify(info).slice(0,400)));};
const b=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({viewport:{width:1280,height:720}});
await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));}catch(_){}});
const p=await ctx.newPage();const errors=[],mp3=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
p.on('response',r=>{const m=r.url().match(/assets\/r381\/voice\/([0-9a-f]{16})\.mp3$/);if(m)mp3.push({id:m[1],s:r.status()});});
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
// R461: 영화 모드는 처음 화면의 '영화 모드로 시작' 입구로만 켜진다(일반 기록에서는 set({on:true}) 를 거절).
await p.goto(URL);await p.locator('#cinemaStartR461').click({timeout:120000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await p.waitForTimeout(800);await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();
// 사몽 ② 문장 id 목록(게임과 같은 sentences() + 동기 SHA-1)
const meta=await p.evaluate(()=>{const T=window.__STORYWORLD_SAMONG_TEXT_R103__,C=window.__STORYWORLD_CINEMA_MODE_R370__,V=window.__STORYWORLD_VOICE_R381__;
 const ks=Object.keys(T.sections),last=ks.indexOf('S-07'),ids=[];for(const k of ks.slice(0,last+1))for(const bl of T.sections[k].blocks)for(const pa of bl.paras)for(const x of C.pure.sentences(pa))if(/[가-힣]/.test(x.text))ids.push(V.idOf(x.text));
 window.__R454IDS=new Set(ids);C.set({on:true,voice:''});return {run:window.__STORYWORLD_CINEMA_RUN_R461__?.run?.(),on:C.prefs().on===true,n:ids.length,recorded:ids.filter(i=>V.inspect&&window.__STORYWORLD_VOICE_R381_DATA__.ids.includes(i)).length,count:V.count};});
check('사몽 ② 문장 목록·영화 모드 기록으로 켜짐',meta.n>=1660&&meta.on===true&&meta.run==='cinema',meta);
await p.evaluate(z=>window.__STORYWORLD_SAMONG_R103__.goZone(z),Z);
await p.waitForFunction(z=>!loading&&room?.exploration?.samongR115?.zone===z,Z,{timeout:180000});
const r=await p.evaluate(async()=>{const C=window.__STORYWORLD_CINEMA_MODE_R370__,V=window.__STORYWORLD_VOICE_R381__;const t0=performance.now();let seen=new Set(),subs=[];
 while(performance.now()-t0<60000){const s=C.inspect().stats,pl=V.inspect().playing;if(pl)seen.add(pl);const t=document.querySelector('#r370Subs .t')?.textContent||'';if(t&&!subs.includes(t))subs.push(t);if(s.recorded>=2&&seen.size>=2)break;await new Promise(r=>setTimeout(r,200));}
 const ids=[...seen];return {stats:C.inspect().stats,voice:V.inspect().stats,ids,samong:ids.filter(i=>window.__R454IDS.has(i)).length,subs:subs.slice(0,3),zone:room?.exploration?.samongR115?.zone};});
check('사몽 구역 서사를 영화 모드가 녹음으로 연달아 재생',r.stats.recorded>=2&&r.samong>=2&&r.stats.recordFail===0&&r.voice.ended>=2,r);
await p.screenshot({path:`${OUT}/samong-cinema-recorded.jpg`,quality:70});
check('사몽 녹음 파일 응답 모두 200',mp3.length>=2&&mp3.every(x=>x.s===200||x.s===206),mp3.slice(0,6));
check('페이지 오류 없음',errors.length===0,errors.slice(0,3));
fs.writeFileSync(`${OUT}/browser-results.json`,JSON.stringify({results},null,1));
await b.close();console.log(JSON.stringify({total:results.length,failed:fails}));process.exit(fails?1:0);
