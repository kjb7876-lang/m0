// R1212 브라우저 검사(헤드리스 소프트웨어 렌더링·소리 장치 없음 — 귀로 들은 검증 아님). 실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1212/r1212-browser.mjs
//  실제 빌드에서 ① 오버레이가 게임 audioContext 에 31개 파일을 미리 받아 해독하는지(실패 0) ② 표의 28종이 모두 준비되는지
//  ③ 오프라인 렌더로 종류마다 실제 소리가 나고(무음 아님) 피크가 깨지지 않는지 ④ 사몽 구역(기계)에서 R125 가 파일로 깔리는 소리·가끔 소리를 내는지 ⑤ 페이지 오류 0.
import {chromium,boot,go} from '../r444/lib.mjs';
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const {p}=await boot(b,{vp:{width:960,height:540}});
const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
const A='__STORYWORLD_SYNTH_SFX_R1212__';
await p.evaluate(()=>{try{if(typeof unlockAudio==='function')unlockAudio();}catch(_){}});
await p.waitForFunction(A=>{const H=window[A];if(!H||typeof audioContext==='undefined'||!audioContext)return false;return Object.keys(H.table).every(k=>H.ready(k,audioContext))||H.inspect().failed.length>0;},A,{timeout:120000}).catch(()=>{});
const st=await p.evaluate(A=>{const H=window[A],T=H.table;return {i:H.inspect(),names:Object.keys(T).length,notReady:Object.keys(T).filter(k=>!H.ready(k,audioContext)),ctx:audioContext&&audioContext.state};},A);
ok(st.i.failed.length===0&&st.i.stats.loads>=31,'① 파일 받기·해독 실패 0 (받은 수 '+st.i.stats.loads+', 컨텍스트 '+st.ctx+')');
ok(st.names>=27&&st.notReady.length===0,'② 표 '+st.names+'종(가끔 17·깔리는 5·카이로 3·보스 1·딸깍 1) 모두 준비 '+(st.notReady.length?JSON.stringify(st.notReady):''));
const r=await p.evaluate(async A=>{const H=window[A],out={};for(const k of Object.keys(H.table)){const oc=new OfflineAudioContext(1,44100*6,44100);await H.preload(oc);
  const s=H.table[k].loop?H.bed(k,oc,oc.destination):H.play(k,oc,oc.destination,0,{});if(!s){out[k]={miss:true};continue;}const buf=await oc.startRendering(),d=buf.getChannelData(0);let pk=0,ss=0;for(const v of d){const a=Math.abs(v);if(a>pk)pk=a;ss+=v*v;}
  out[k]={pk:+pk.toFixed(4),rmsDb:+(10*Math.log10(ss/d.length+1e-20)).toFixed(1)};}return out;},A);
const silent=Object.entries(r).filter(([k,v])=>v.miss||!(v.pk>.0005)),hot=Object.entries(r).filter(([k,v])=>v.pk>.95);
ok(!silent.length,'③ 종류마다 실제 소리가 남 '+(silent.length?JSON.stringify(silent):''));ok(!hot.length,'③ 피크 .95 미만(깨짐 없음) '+(hot.length?JSON.stringify(hot):''));
console.log('   렌더 피크·RMS',JSON.stringify(r));
// ④ 사몽 기계 구역
const before=await p.evaluate(A=>window[A].inspect().stats,A);// 구역에 들어가기 전(들어가자마자 R125 가 0.25초 안에 깖)
let zoneOk=true;try{await p.evaluate(async()=>{const SM=__STORYWORLD_SAMONG_R103__;await SM.go(SM.episodes.findIndex(e=>e.key==='S-06'),null,{zone:'sz115-S06-1'});});
 await p.waitForFunction(()=>!loading,null,{timeout:150000});await p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);player.invincible=1e9;});}catch(e){zoneOk=false;console.log('   구역 이동 실패',String(e).slice(0,120));}
if(zoneOk){
 for(let i=0;i<60;i++){const s=await p.evaluate(()=>({amb:window.__STORYWORLD_AMBIENCE_R125__.inspect()}));if(s.amb.stats.events>=1&&s.amb.bed)break;await p.waitForTimeout(1000);}
 const after=await p.evaluate(A=>({h:window[A].inspect().stats,amb:window.__STORYWORLD_AMBIENCE_R125__.inspect(),mood:window.__STORYWORLD_MOOD_R123__?.inspect?.()?.theme}),A);
 console.log('   R125',JSON.stringify({mood:after.mood,bed:after.amb.bed,ev:after.amb.stats.events,h:after.h}));
 ok(after.amb.bed==='hum'&&after.h.beds>before.beds,'④ 사몽 기계 구역: 깔리는 소리(hum)를 파일로 깜');
 ok(after.amb.stats.events===0||after.h.plays>before.plays,'④ 가끔 소리도 파일로(이벤트 '+after.amb.stats.events+', 파일 재생 '+(after.h.plays-before.plays)+')');}
else ok(false,'④ 사몽 구역 이동');
ok(errs.length===0,'⑤ 페이지 오류 0 '+(errs.length?JSON.stringify(errs.slice(0,3)):''));
await b.close();console.log(fails?`\nFAIL ${fails}`:'\n모두 통과');process.exit(fails?1:0);
