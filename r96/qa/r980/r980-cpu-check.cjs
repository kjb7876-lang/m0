// R980 모바일 메모리 예산 CPU/정적 검사 — 브라우저 없이 오버레이를 가짜 전역에서 돌려 예산 계산과 효과음 캐시 정리 규칙을 본다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..');let fail=0,n=0;const ok=(m,c,x)=>{n++;console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,300):'');if(!c)fail++;};
const src=fs.readFileSync(path.join(R,'client-source','mobile-memory-r980.js'),'utf8');
function boot({mobile}){const intervals=[];
 const buffers=new Map();let decoded=[];
 const g={window:{},localStorage:{getItem:()=>null,setItem(){}},document:{readyState:'complete'},setInterval:(f)=>{intervals.push(f);return 1;},matchMedia:()=>({matches:false}),
  buffers,cleanPath:p=>p,Infinity,Math,Number,JSON,Object,Set,Map,WeakMap,String,Array,Promise};
 // 엔진 audioBuffer 흉내: 처음이면 디코딩 약속을 만들어 buffers 에 넣는다(1초 = 44100×2×4 바이트).
 g.audioBuffer=function(path){if(buffers.has(path))return buffers.get(path);const secs=+(path.split(':')[1]||1);let res;const pr=new Promise(r=>res=r);decoded.push(()=>res({length:44100*secs,numberOfChannels:2}));buffers.set(path,pr);return pr;};
 g.window.__STORYWORLD_MOBILE_R63__={isMobile:()=>mobile};g.window.addEventListener=()=>{};
 vm.createContext(g);vm.runInContext(src,g);
 const flush=async()=>{for(const f of decoded.splice(0))f();await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));};
 return {g,M:g.window.__STORYWORLD_MOBILE_MEMORY_R980__,buffers,flush};}
(async()=>{
// 데스크톱: 통과값 그대로, 소리 캐시 정리 안 함
{const {g,M,buffers,flush}=boot({mobile:false});
 ok('desktop: px passes desktop value through',M.px('r163-tint',Infinity)===Infinity&&M.px('r106-tint',77)===77);
 ok('desktop: audio budget infinite',M.audioBudgetMB()===Infinity);
 for(let i=0;i<20;i++)g.audioBuffer('d'+i+':3');await flush();M.check();await flush();M.check();ok('desktop: never trims sound cache (20×1MB)',buffers.size===20);}
// 모바일 예산
{const {M}=boot({mobile:true});
 ok('mobile: r163 tint budget 12M px',M.px('r163-tint',Infinity)===12e6);ok('mobile: r106 tint budget 6M px',M.px('r106-tint',Infinity)===6e6);
 ok('mobile: budget never above desktop value (boundary)',M.px('r163-tint',5)===5);ok('mobile: unknown cache passes through',M.px('other',9)===9);ok('mobile: audio budget 24MB',M.audioBudgetMB()===24);}
// 모바일: 예산 아래면 그대로(경계: 1초 소리 ≈ 0.35MB × 60 = 21MB)
{const {g,M,buffers,flush}=boot({mobile:true});for(let i=0;i<60;i++)g.audioBuffer('u'+i+':1');await flush();M.check();await flush();M.check();ok('mobile: under 24MB → nothing evicted',buffers.size===60,M.inspect().stats);}
// 모바일: 넘으면 오래 안 쓴 것부터, 방금 쓴 것은 남김
{const {g,M,buffers,flush}=boot({mobile:true});M.check();/* 감싸기 */
 for(let i=0;i<40;i++)g.audioBuffer('s'+i+':2');/* 40 × 0.7MB = 28MB */await flush();g.audioBuffer('s0:2');/* s0 을 다시 씀 → 맨 뒤로 */M.check();await flush();M.check();
 const st=M.inspect().stats;
 ok('mobile: over budget → trimmed to ≤ 80% of 24MB',st.audioPeakMB>24&&st.audioLastMB<=19.3&&[...buffers.keys()].length*0.7056<=19.3,{left:buffers.size,st});
 ok('mobile: recently used sound kept (LRU)',buffers.has('s0:2'),[...buffers.keys()].slice(0,5));
 ok('mobile: oldest unused sounds evicted first',!buffers.has('s1:2')&&buffers.has('s39:2'),[...buffers.keys()].slice(0,5));
 ok('mobile: stats count evictions',st.audioEvicted>=13&&st.errors===0,st);}
// 디코딩 중인 소리는 빼지 않음
{const {g,M,buffers,flush}=boot({mobile:true});M.check();for(let i=0;i<40;i++)g.audioBuffer('p'+i+':2');await flush();g.audioBuffer('pending:30');/* 아직 안 풀림 */M.check();await new Promise(r=>setImmediate(r));M.check();ok('mobile: pending (still decoding) sound never evicted',buffers.has('pending:30'));}
// 끄기 스위치
{const {g,M,buffers,flush}=boot({mobile:true});M.set(false);for(let i=0;i<40;i++)g.audioBuffer('o'+i+':2');await flush();M.check();await flush();M.check();ok('switch off → inactive, no trim',buffers.size===40&&M.px('r163-tint',Infinity)===Infinity);}
// 연결: 태그·공개 검증 목록·CI·R163/R106 이 예산을 묻는지
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok('index.html loads mobile-memory-r980.js once, before combat-r118',(html.match(/mobile-memory-r980\.js/g)||[]).length===1&&html.indexOf('mobile-memory-r980.js')<html.indexOf('./combat-r118.js'));
ok('verify-r96-public expects the overlay',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'mobile-memory-r980.js'"));
ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r980/r980-cpu-check.cjs'));
const p163=fs.readFileSync(path.join(R,'client-source','pixelfx-r163.js'),'utf8'),p106=fs.readFileSync(path.join(R,'client-source','fx-sprites-r106.js'),'utf8');
ok('R163 tinted sheets keep 40 cap and add R980 pixel cap with LRU refresh',/tinted\.size>40\|\|\(tinted\.size>1&&tintedPx>cap\)/.test(p163)&&/if\(c\)\{tinted\.delete\(key\);tinted\.set\(key,c\);return c;\}/.test(p163)&&p163.includes("px('r163-tint',Infinity)"));
ok('R106 tints keep MAXT and add R980 pixel cap',/tints\.size>MAXT\|\|\(tints\.size>1&&tintsPx>cap\)/.test(p106)&&p106.includes("px('r106-tint',Infinity)"));
console.log(fail?`FAILED ${fail}/${n}`:`ALL PASS ${n}`);process.exit(fail?1:0);
})();
