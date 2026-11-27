// R1381 공개판 실플레이 치명 버그 — 기록기 ctx.scope 감싸기 핑퐁(visual-r93 patchScope ↔ R1353 wrapScope)으로
//  프레임마다 감싸기가 두 겹씩 쌓여 몇 분 뒤 'Maximum call stack size exceeded' → Three.js 정지(화면 멈춤).
//  헤드리스(그래픽 검증 아님): 환도로 dist00 에서 자동전투를 돌리며, 그리기 중 project() 호출 스택 깊이가 시간이 지나도 늘지 않는지 본다.
//  SW_URL(기본 http://127.0.0.1:4410/m0/)
import {chromium,boot,go} from '../r444/lib.mjs';
let fail=0;const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,400):'');if(!c)fail++;};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:480,height:270}});
await go(p,'dist00');
const depthAfter=sec=>p.evaluate(async sec=>{if(!window.__r1381){window.__r1381={max:0,rep:0,who:''};Error.stackTraceLimit=Infinity;const pb=project;let n=0;
  project=function(...a){if(++n%50===0){const st=new Error().stack.split('\n'),c={};let rep=0,who='';for(const l of st){const m=/\/([\w.-]+\.js):(\d+)/.exec(l);if(!m)continue;const k=m[1]+':'+m[2];c[k]=(c[k]|0)+1;if(c[k]>rep){rep=c[k];who=k;}}
   if(st.length>window.__r1381.max)window.__r1381.max=st.length;if(rep>window.__r1381.rep){window.__r1381.rep=rep;window.__r1381.who=who;}}return pb.apply(this,a);};}
 player.hero='hwando';auto=true;guide=true;const iv=setInterval(()=>{try{player.hp=maxHP();player.invincible=99;if(modal&&!storyScene)closePanel(true);if(storyScene)advanceScene();}catch(_){}},200);
 window.__r1381.max=0;window.__r1381.rep=0;const t0=time,w0=Date.now();await new Promise(r=>{const g=()=>{if(time-t0>sec||Date.now()-w0>180000)return r();setTimeout(g,150);};g();});clearInterval(iv);
 let chain=0;try{for(let f=ctx.scope,k=0;f&&k<1;k++)chain=Object.keys(f).filter(s=>/^__r\d/.test(s)).length;}catch(_){}
 return {max:window.__r1381.max,rep:window.__r1381.rep,who:window.__r1381.who,gt:+(time-t0).toFixed(1),marks:chain};},sec);
const a=await depthAfter(4),c=await depthAfter(12);
// 감싸기 핑퐁의 표지: 한 스택 안에 같은 감싸기 줄이 수백~수천 번 되풀이(수정 전 공개판 2460번). 정상은 지역마다 몇십 번 이하.
ok('같은 감싸기 줄 되풀이가 적음(<100)',a.rep<100&&c.rep<100,{early:a,late:c});
ok('되풀이가 시간 따라 늘지 않음',c.rep<=Math.max(a.rep*1.5,a.rep+10),{early:a.rep,late:c.rep,who:c.who});
ok('그리기 호출 스택이 얕음(<800)',c.max<800,c);
const e=await p.evaluate(()=>(window.__STORYWORLD_ERROR_LOG_R1288__?.list?.()||[]).filter(r=>/call stack/i.test(String(r.message||''))).length);
ok('스택 넘침 오류 기록 없음',e===0,e);
console.log(fail?`FAIL ${fail}`:'ALL PASS');await b.close();process.exit(fail?1:0);
