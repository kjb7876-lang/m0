// R1249 CPU 검사: tick·draw·drawEnemy·updateHUD·restoreSave 감싸기 계측(켤 때만).   node r96/qa/r1249/wrap-census-cpu-check.cjs
//  리뷰(사용자 2026-11-20 첨부 4번): "네 함수에 등록된 기능 이름·호출 횟수·소요 시간을 확인할 수 있게" · 구조 8점 기준 "반복해도 호출 깊이가 늘지 않고,
//  한 번의 저장·복원에 각 기능이 정확히 한 번만 실행". 이 검사는 계측 도구 자체를 확인한다(동작 변경 없음).
//  · 연결: 소스=런타임 사본, 스크립트 태그(본 인라인 스크립트 바로 뒤, 첫 오버레이 앞), verify 목록, pages.yml, 매니페스트
//  · 꺼짐(기본): 전역 함수를 하나도 바꾸지 않고 관찰자도 안 붙임(성능 0)
//  · 켜짐: 스크립트마다 바꾼 감싸기를 그 스크립트 이름으로 기록, 층마다 호출 횟수·포함/자기 시간·최대 시간
//    / load 처리기에서 다시 감싼 것은 'load' 로 / 그 뒤 바뀐 것은 감싸지 않고 늦은 변경으로만 기록(핑퐁 방지)
//    / 한 번의 바깥 호출에서 층별 실행 횟수(lastOuter) — 저장 복원에서 두 번 도는 층 찾기 / 같은 이름 측정층 깊이(maxDepth)
//    / 감싼 함수의 반환값·this·인자·예외는 그대로
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
let pass=0,fail=0;const ok=(n,c,x)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x));}};
const C=f=>{try{return fs.readFileSync(path.join(R,'client-source',f),'utf8');}catch(_){return '';}},RT=f=>{try{return fs.readFileSync(path.join(R,'runtime-text',f),'utf8');}catch(_){return '';}};
const F='wrap-census-r1249.js',src=C(F);
ok(F+' exists',!!src);ok(F+' runtime copy matches source',!!src&&src===RT(F));
try{new vm.Script(src);ok('syntax',!!src);}catch(e){ok('syntax '+e.message,false);}
const html=RT('index.html'),tag='<script src="./'+F+'"></script>';
{const i=html.indexOf(tag),main=html.indexOf('function restoreSave('),first=html.indexOf('<script src="./hero-presentation-r83.js"');
 ok('script tag once, after the main inline script (restoreSave defined) and before the first overlay script',html.split(tag).length===2&&i>main&&main>0&&i<first&&html.slice(html.lastIndexOf('</script>',i),i).trim()==='</script>');}
ok('listed in verify-r96-public.py',fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"));
ok('pages.yml runs this check',/node r96\/qa\/r1249\/wrap-census-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
let man='';try{man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');}catch(_){}
ok('runtime-manifest has census',man.includes('"'+F+'"'));
if(!src){console.log(`\n${pass} pass, ${fail} fail`);process.exit(1);}
ok('no setInterval re-wrapping',!/setInterval\s*\(/.test(src));
// ---- 가짜 브라우저: 스크립트 삽입을 MutationObserver 콜백으로 흉내 ----
function env(o={}){const store=new Map(Object.entries(o.store||{}));const obs=[];const g={__now:0,__load:[],__timers:[],console};
 Object.assign(g,{localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},performance:{now:()=>g.__now},
  location:{search:o.search||''},Error,
  MutationObserver:class{constructor(cb){this.cb=cb;obs.push(this);}observe(){}disconnect(){const i=obs.indexOf(this);if(i>=0)obs.splice(i,1);}},
  document:{readyState:'loading',addEventListener:(t,f)=>{if(t==='DOMContentLoaded')(g.__dcl=g.__dcl||[]).push(f);},documentElement:{}},
  __micro:[],queueMicrotask:f=>g.__micro.push(f),addEventListener:(t,f)=>{if(t==='load')g.__load.push(f);},setTimeout:(f,ms)=>{g.__timers.push({f,at:g.__now+(ms||0)});return g.__timers.length;}});
 g.window=g;g.__obs=obs;vm.createContext(g);
 vm.runInContext('var log=[];function tick(dt){log.push("tick");return "T"+dt;}function draw(){log.push("draw");drawEnemy({});drawEnemy({});}function drawEnemy(e){log.push("de");}'+
  'function updateHUD(){log.push("hud");}function restoreSave(raw){log.push("rs:"+raw);if(raw==="bad")throw new Error("boom");return this&&this.k;}',g);
 vm.runInContext(src,g);return g;}
const run=(g,js)=>vm.runInContext(js,g);
// 스크립트 하나 실행(본문) 뒤 다음 스크립트 요소가 삽입되는 순간을 흉내
const script=(g,name,body)=>{for(const o of g.__obs)o.cb([{addedNodes:[{tagName:'SCRIPT',src:'https://x/m0/'+name,id:'',getAttribute:k=>k==='src'?'./'+name:null}]}]);if(body)run(g,body);};
const flush=g=>{let n=0;while(g.__timers.length&&n++<50){g.__timers.sort((a,b)=>a.at-b.at);const t=g.__timers.shift();if(t.at>g.__now)g.__now=t.at;t.f();}};
const api=g=>g.__STORYWORLD_WRAP_CENSUS_R1249__;
const micro=g=>{while(g.__micro.length)g.__micro.shift()();};// 한 번의 동기 실행(사용자 동작 하나) 끝
// 1. 꺼짐: 아무것도 안 바꿈
{const g=env();const t0=run(g,'tick'),d0=run(g,'drawEnemy');ok('off by default: API says disabled',api(g)&&api(g).enabled===false&&typeof api(g).enable==='function');
 ok('off: globals untouched, no observer',run(g,'tick')===t0&&run(g,'drawEnemy')===d0&&g.__obs.length===0);
 api(g).enable(true);ok('enable(true) stores the switch for next load',JSON.parse(g.localStorage.getItem('storyworld.r1249.wrapcensus')||'{}').on===true);}
// 2. 켜짐(저장 스위치·주소 둘 다)
for(const how of ['store','search']){const g=env(how==='store'?{store:{'storyworld.r1249.wrapcensus':'{"on":true}'}}:{search:'?a=1&wrapcensus=1'});
 ok(how+': enabled',api(g).enabled===true&&g.__obs.length===1);}
{const g=env({store:{'storyworld.r1249.wrapcensus':'{"on":true}'}});
 // 오버레이 A: tick 감쌈, B: drawEnemy 두 번 감쌈(한 파일에서), C: 아무것도 안 함, D: restoreSave 감쌈
 script(g,'a-r1.js','(()=>{const b=tick;tick=function(dt){log.push("A");g0=1;return b.call(this,dt);};})();var g0;');
 script(g,'b-r2.js','(()=>{for(let i=0;i<2;i++){const b=drawEnemy;drawEnemy=function(e){log.push("B"+i);return b.call(this,e);};}})();');
 script(g,'c-r3.js','');
 script(g,'d-r4.js','(()=>{const b=restoreSave;restoreSave=function(raw){log.push("D");return b.call(this,raw);};})();');
 script(g,'e-r5.js','(()=>{const b=updateHUD;updateHUD=function(){log.push("E");__now+=3;return b.call(this);};})();');
 script(g,'f-r6.js','');// e-r5 이 끝났음을 알리는 다음 삽입
 const ins=api(g).inspect();
 const labels=n=>ins.names[n].layers.map(l=>l.label);
 ok('tick layers: base + a-r1.js',JSON.stringify(labels('tick'))===JSON.stringify(['index.html','a-r1.js']),labels('tick'));
 ok('drawEnemy: two wraps inside one file show as one layer of b-r2.js',JSON.stringify(labels('drawEnemy'))===JSON.stringify(['index.html','b-r2.js']),ins.names.drawEnemy.layers);
 ok('c-r3.js (no wrap) not listed',!JSON.stringify(ins).includes('c-r3.js'));
 ok('restoreSave layers: base + d-r4.js',JSON.stringify(labels('restoreSave'))===JSON.stringify(['index.html','d-r4.js']));
 // 호출: 결과·this·인자·예외 그대로
 run(g,'log=[]');ok('tick returns same value through measurers',run(g,'tick(0.5)')==='T0.5'&&run(g,'log.join()')==='A,tick');
 ok('restoreSave keeps this and args',run(g,'restoreSave.call({k:7},"ok")')===7);micro(g);
 let threw=false;try{run(g,'restoreSave("bad")');}catch(e){threw=/boom/.test(e.message);}micro(g);ok('restoreSave exception passes through',threw);
 run(g,'draw();draw();updateHUD();restoreSave("y")');micro(g);
 const i2=api(g).inspect();const de=i2.names.drawEnemy.layers;
 ok('drawEnemy calls counted per layer (4 = 2 draws x 2 mobs)',de[0].calls===4&&de[1].calls===4,de);
 const hud=i2.names.updateHUD.layers;ok('updateHUD self time: e-r5 3ms, base 0ms',Math.abs(hud[1].selfMs-3)<1e-9&&hud[0].selfMs===0&&Math.abs(hud[1].inclMs-3)<1e-9,hud);
 ok('restoreSave lastOuter: each layer ran exactly once in the last user action',Object.keys(i2.names.restoreSave.lastOuter).length===2&&i2.names.restoreSave.lastOuter['index.html']===1&&i2.names.restoreSave.lastOuter['d-r4.js']===1,i2.names.restoreSave.lastOuter);
 ok('restoreSave exception counted',i2.names.restoreSave.layers[0].errors>=1);
 ok('maxDepth = measured layers of the same name on the stack',i2.names.tick.maxDepth===2&&i2.names.drawEnemy.maxDepth===2,{t:i2.names.tick.maxDepth,d:i2.names.drawEnemy.maxDepth});
 // load 처리기에서 다시 감싼 것 → 'load'
 // 마지막 스크립트(f-r6)가 바꾼 것 → DOMContentLoaded 에서 f-r6.js 로, 다른 DOMContentLoaded 처리기가 바꾼 것 → 'before-load'(이름이 겹쳐 두 층이 한 칸에 합쳐지지 않게)
 run(g,'(()=>{const b=draw;draw=function(){return b.call(this);};})()');for(const f of (g.__dcl||[]))f();
 run(g,'(()=>{const b=draw;draw=function(){return b.call(this);};})()');
 g.__load.push(()=>run(g,'(()=>{const b=tick;tick=function(dt){return b.call(this,dt);};})()'));for(const f of g.__load)f();flush(g);// 우리 load 처리기 뒤에 도는 다른 load 처리기
 {const dl=api(g).inspect().names.draw.layers.map(l=>l.label);ok('last script change seen at DOMContentLoaded keeps its file name, later DCL-handler change is before-load',JSON.stringify(dl)===JSON.stringify(['index.html','f-r6.js','before-load']),dl);}
 ok('wrap made by a load handler is labeled load',api(g).inspect().names.tick.layers.map(l=>l.label).includes('load'));
 // 그 뒤 늦은 변경 → 감싸지 않고 기록만
 const before=run(g,'tick');run(g,'(()=>{const b=tick;tick=function(dt){return b.call(this,dt);};})()');const mine=run(g,'tick');g.__now+=1500;flush(g);
 const i3=api(g).inspect().names.tick;ok('late change recorded but not wrapped (no ping-pong)',i3.lateChanges>=1&&run(g,'tick')===mine&&mine!==before,i3);
 // 같은 이름표가 두 번 생기면 #2 를 붙여 따로 센다
 for(let k=0;k<2;k++){run(g,'(()=>{const b=tick;tick=function(dt){return b.call(this,dt);};})()');g.__load[0]();}const tl=api(g).inspect().names.tick.layers.map(l=>l.label);ok('duplicate label in one name gets #2',new Set(tl).size===tl.length&&tl.includes('before-load#2'),tl);
 // 한 번의 restoreSave 안에서 같은 층이 두 번 돌면 잡힘(구조 8점 기준 회귀)
 run(g,'(()=>{const b=restoreSave;let again=0;restoreSave=function(raw){if(!again){again=1;try{b.call(this,raw);}finally{again=0;}}return b.call(this,raw);};})()');
 // 늦은 변경은 측정 밖이지만, 한 번의 동기 실행 안에서 측정층들이 2회 돌면 보인다
 run(g,'restoreSave("x")');micro(g);const lo=api(g).inspect().names.restoreSave.lastOuter;ok('double run inside one restore is visible in lastOuter',lo['d-r4.js']===2&&lo['index.html']===2,lo);
 // reset
 api(g).reset();ok('reset clears counters',api(g).inspect().names.drawEnemy.layers.every(l=>l.calls===0));
 ok('table() gives readable rows',Array.isArray(api(g).table('drawEnemy'))&&api(g).table('drawEnemy')[0].label==='index.html');}
console.log(`\n${pass} pass, ${fail} fail`);process.exit(fail?1:0);
