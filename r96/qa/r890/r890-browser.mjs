// R890 무한 생존 서사 트랙 브라우저 검사(헤드리스 — 실제 소리·GPU·실기기 미검증).
//  SW_URL(기본 http://127.0.0.1:4410/m0/) · SHOTS=폴더(스크린샷)
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=(process.env.SW_URL||'http://127.0.0.1:4410/m0/')+'?cine880=1',SHOTS=process.env.SHOTS||'';let n=0,bad=0;
const ok=(c,m,x)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m,x===undefined?'':JSON.stringify(x));};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:720}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e.stack||e).slice(0,300)));const A=(f,a)=>p.evaluate(f,a);
await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').waitFor({timeout:180000});
ok(await A(()=>{const b=document.getElementById('r890TrackBtn');return !b||b.style.display==='none';}),'no story button on the title screen');
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="hwando"]').click();await p.locator('#r600Go').click();
const ready=()=>p.waitForFunction(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;return Z.here()&&!loading&&Z.state().ready;},null,{timeout:240000,polling:200});
await ready();await p.waitForFunction(()=>{const b=document.getElementById('r890TrackBtn');return b&&b.style.display!=='none';},null,{timeout:5000});
const btn=()=>A(()=>{const b=document.getElementById('r890TrackBtn'),r=b.getBoundingClientRect();return {text:b.textContent,shown:b.style.display!=='none'&&r.width>0&&r.height>0,inNav:!!b.closest('nav.topnav'),track:window.__STORYWORLD_SURVIVAL_R600__.track()};});
let s=await btn();ok(s.shown&&s.inNav&&s.text==='서사 · 음미'&&s.track==='story','button visible in the top bar, default story track',s);
// 음성 호출 세기: 전투 집중 동안 R381·브라우저 음성이 한 번도 불리지 않아야 한다
await A(()=>{window.__r890={r381:0,tts:0};const R=window.__STORYWORLD_VOICE_R381__;if(R&&R.play){const o=R.play;try{Object.defineProperty(R,'play',{value:(...a)=>{window.__r890.r381++;return o.apply(R,a);}});}catch(_){}}
 try{const o=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{window.__r890.tts++;return o(u);};}catch(_){}});
await p.locator('#r890TrackBtn').click();s=await btn();ok(s.text==='서사 · 전투'&&s.track==='combat','click switches to combat focus',s);
ok(await A(()=>JSON.parse(localStorage.getItem('storyworld.r600.survival')||'{}').track==='combat'),'choice saved');
await A(()=>{window.__r890.r381=0;window.__r890.tts=0;});
// 다음 서사 문장들이 음성 없이 자막으로 흐르는지(빠른 감기)
const sub=await A(async()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;const seen=new Set();const T0=performance.now();
 while(performance.now()-T0<9000){const el=document.getElementById('r600Subs');if(el&&el.classList.contains('on'))seen.add(el.querySelector('.t').textContent+'|'+el.classList.contains('compact'));await new Promise(r=>setTimeout(r,120));}
 return {seen:[...seen].slice(0,6),voice:{...window.__r890},narr:Z.narr()};});
ok(sub.seen.length>0&&sub.seen.every(x=>x.endsWith('|true')),'subtitles keep flowing, compact, in combat focus',sub.seen.length);
ok(sub.voice.r381===0&&sub.voice.tts===0,'no voice calls in combat focus',sub.voice);
if(SHOTS){await p.screenshot({path:SHOTS+'/r890-combat.jpg',quality:82});}
await p.locator('#r890TrackBtn').click();s=await btn();ok(s.text==='서사 · 음미'&&s.track==='story','click switches back to story',s);
ok(await A(()=>!document.getElementById('r600Subs')?.classList.contains('compact')),'story subtitles are full size');
if(SHOTS){await p.screenshot({path:SHOTS+'/r890-story.jpg',quality:82});}
// R880 선화 컷씬: 생존 방에서는 자격 없음, 재생도 안 됨(?cine880=1 로 자동 검사 차단을 풀었는데도)
const cine=await A(async()=>{const L=window.__STORYWORLD_LINEART_R880__,Z=window.__STORYWORLD_SURVIVAL_R600__;const out=[];
 for(const i of [1,2,3,4]){Z.qaGo(i);const T0=performance.now();while(!(Z.here()&&!loading&&Z.state().ready)&&performance.now()-T0<60000)await new Promise(r=>setTimeout(r,200));
  await new Promise(r=>setTimeout(r,1800));out.push({id:room.id,hasScene:L.zones().includes(room.id),eligible:L.eligible(room),overlay:!!document.getElementById('r880')&&getComputedStyle(document.getElementById('r880')).display!=='none'});}
 return {out,seen:L.inspect().prefs.seen};});
ok(cine.out.some(x=>x.hasScene),'at least one visited survival stage has a line-art scene registered',cine.out);
ok(cine.out.every(x=>!x.eligible&&!x.overlay),'line-art cutscene never plays in survival rooms',cine.out);
ok(cine.seen.length===0,'story first-viewing records untouched',cine.seen);
ok(errs.length===0,'no page errors',errs.slice(0,3));
console.log(`R890 browser ${n-bad}/${n}`);await b.close();process.exit(bad?1:0);
