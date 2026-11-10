// R381 headless check (Playwright): 녹음 서사 음성이 실제 브라우저에서 받아지고 재생되는지, 영화 모드가 녹음을 먼저 트는지.
//   STORYWORLD_URL=http://127.0.0.1:4396/m0/ OUT=out/r381 node r96/qa/r381/r381-browser.mjs
// 헤드리스: 오디오 장치 없이 디코딩·재생 진행(currentTime)·끝 알림만 본다. 실제 소리 품질·실기기 모바일·자연 플레이는 미검증.
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out/r381';fs.mkdirSync(OUT,{recursive:true});
let fails=0;const results=[];const check=(name,ok,info)=>{results.push({name,ok:!!ok,info});if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+name+(info===undefined?'':' '+JSON.stringify(info).slice(0,300)));};
const b=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({viewport:{width:1280,height:720}});
await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));}catch(_){}});
const p=await ctx.newPage();const errors=[],mp3=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
p.on('response',r=>{if(/assets\/r381\/voice\/[0-9a-f]{16}\.mp3$/.test(r.url()))mp3.push(r.status());});
// R461 뒤로 영화 모드는 처음 화면의 '영화 모드로 시작' 입구로만 켜진다(일반 기록에서는 set({on:true}) 를 거절) — R454 에서 이 검사도 그 입구로 시작하게 고침.
await p.goto(URL);await p.locator('#cinemaStartR461').click({timeout:120000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await p.waitForTimeout(800);
await p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const i0=await p.evaluate(()=>window.__STORYWORLD_VOICE_R381__.inspect());
check('모듈·목록 실림(615개 이상)',i0.count>=615&&i0.speaker==='Sohee',i0);
// 1) 단독 재생: 받아서 디코딩하고 끝까지 감
const r1=await p.evaluate(()=>new Promise(res=>{const V=window.__STORYWORLD_VOICE_R381__;let started=0;const t0=performance.now();
 const h=V.play(V.sample,{rate:1.15,volume:.5,onstart:()=>{started=performance.now()-t0;},onend:()=>res({ok:true,started,ms:Math.round(performance.now()-t0),dur:h.duration()}),onerror:()=>res({ok:false,i:V.inspect()})});
 setTimeout(()=>res({ok:false,timeout:true,i:V.inspect()}),20000);}));
check('녹음 한 문장이 실제로 재생되어 끝까지 감(1.15배속)',r1.ok&&r1.dur>1&&r1.ms>r1.dur*1000/1.15*.8,r1);
// 2) 영화 모드: 장면 문장이 녹음으로 흐름
const r2=await p.evaluate(async()=>{const C=window.__STORYWORLD_CINEMA_MODE_R370__,V=window.__STORYWORLD_VOICE_R381__;C.set({on:true,voice:''});
 const C0=window.__STORYWORLD_STORY_CANON_R106__;const text=C0.zones.dist00.blocks[0].paras[1];
 playScenes([{key:'r381:test',id:room.id,title:'r381',narrator:'〈EGO의 기억〉',text}],null);
 const t0=performance.now();while(performance.now()-t0<25000){const s=C.inspect().stats;if(s.recorded>=2)break;await new Promise(r=>setTimeout(r,250));}
 const sub=document.querySelector('#r370Subs .t')?.textContent||'';return {stats:C.inspect().stats,voice:V.inspect().stats,sub};});
check('영화 모드가 장면 문장을 녹음으로 연달아 재생(브라우저 음성 대신)',r2.stats.recorded>=2&&r2.stats.recordFail===0&&r2.voice.ended>=2,r2);
await p.screenshot({path:`${OUT}/cinema-recorded.jpg`,quality:70});
check('녹음 파일 응답 모두 200',mp3.length>=3&&mp3.every(s=>s===200||s===206),mp3.slice(0,8));
check('페이지 오류 없음',errors.length===0,errors.slice(0,3));
fs.writeFileSync(`${OUT}/browser-results.json`,JSON.stringify({results},null,1));
await b.close();console.log(JSON.stringify({total:results.length,failed:fails}));process.exit(fails?1:0);
