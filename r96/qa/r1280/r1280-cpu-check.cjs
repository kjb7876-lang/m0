// R1280 CPU 검사: PC 설정창 겹치는 칸 합치기(settings-merge-r1280.js) — 연결·순수 계산·화면만 바꾸는지.
//  사용자 2026-11-20 "pc 설정에서 겹치는 기능 하나로 모아줘 설정ui 간편화". 브라우저 확인은 r1280-browser.mjs(헤드리스).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'..','..'),ROOT=path.resolve(R,'..');
let n=0,bad=0;const ok=(m,c,x)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(!c&&x!==undefined?' '+JSON.stringify(x).slice(0,400):''));};
const F='settings-merge-r1280.js',P=path.join(R,'client-source',F);ok(F+' 있음',fs.existsSync(P));
const src=fs.existsSync(P)?fs.readFileSync(P,'utf8'):'';
const rt=(()=>{try{return fs.readFileSync(path.join(R,'runtime-text',F),'utf8');}catch(_){return null;}})();
ok('runtime-text 사본이 같음',rt===src&&src.length>0);
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok('index.html: 자기 줄, sloth-throw-r1258 바로 뒤·sin-boss-sheet-vis-r1243-data 앞, 한 번만',/\n<script src="\.\/sloth-throw-r1258\.js"><\/script>\n<script src="\.\/settings-merge-r1280\.js"><\/script>\n<script src="\.\/sin-boss-sheet-vis-r1243-data\.js"><\/script>\n/.test(html)&&html.split(F).length===2);
ok('verify-r96-public.py 기대 목록에 있음',fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"));
ok('runtime-inputs·manifest 목록에 있음',['runtime-inputs.json','runtime-manifest.json'].every(f=>fs.readFileSync(path.join(R,f),'utf8').includes('"'+F+'"')));
ok('CI 워크플로에 이 검사 줄',/qa\/r1280\/r1280-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
ok('화면만: 피해·체력·세이브를 건드리지 않음',src.length>0&&!/hitEnemy|\.hp\s*=|saveGame\(|player\.\w+\s*=/.test(src));
ok('옛 칸은 지우지 않고 숨기기만(remove() 없음)',src.length>0&&!/\.remove\(\)/.test(src));
ok('사용자 기본값 칸은 숨기는 목록에 없음(제목 줄 서사 단추·서사 창·적중 투명도·수묵화풍)',src.length>0&&!/r1141NarrBtn'|hitAlphaR1271|inkOnR1055|data-r1037="story"/.test((src.match(/HIDE_SEL=\[[^\]]*\]/)||[''])[0]));
// ---- 순수 계산 ----
let A=null;if(src){const sb={console,Math,JSON,Number,String,Object,Array,Map,Set,WeakMap,Error,isFinite,localStorage:{getItem:()=>null,setItem(){}},
 document:{readyState:'complete',getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],head:{appendChild(){}},createElement:()=>({style:{},classList:{add(){},toggle(){}},setAttribute(){},appendChild(){}})},
 addEventListener(){},setTimeout:()=>0,requestAnimationFrame:()=>0,queueMicrotask:f=>f(),MutationObserver:function(){this.observe=()=>{};this.disconnect=()=>{};},showSettings(){}};sb.window=sb;
 try{vm.createContext(sb);vm.runInContext(src,sb);A=sb.__STORYWORLD_SETTINGS_MERGE_R1280__;}catch(e){ok('샌드박스에서 읽힘',false,String(e));}}
ok('API(splitView·joinView·state·inspect)',!!A&&['splitView','joinView','state','inspect'].every(k=>typeof A[k]==='function'));
if(A){const s=v=>JSON.stringify(A.splitView(v));
 ok('splitView 0.7 → 표시 1·배율 0.7',s(.7)==='{"cam":1,"view":0.7}',s(.7));
 ok('splitView 0.85 → 표시 1·배율 0.85',s(.85)==='{"cam":1,"view":0.85}',s(.85));
 ok('splitView 1 → 표시 1·배율 1',s(1)==='{"cam":1,"view":1}',s(1));
 ok('splitView 1.5 → 표시 1.5·배율 1',s(1.5)==='{"cam":1.5,"view":1}',s(1.5));
 ok('splitView 경계 밖 0.2 → 0.7, 9 → 2, NaN → 1',s(.2)==='{"cam":1,"view":0.7}'&&s(9)==='{"cam":2,"view":1}'&&s(NaN)==='{"cam":1,"view":1}',[s(.2),s(9),s(NaN)]);
 ok('joinView = 표시 × 배율(1.5×0.8=1.2), 범위 0.7~2',Math.abs(A.joinView(1.5,.8)-1.2)<1e-9&&A.joinView(1,.5)===.7&&A.joinView(3,1)===2);
 ok('state: 모두 켜짐 on, 모두 꺼짐 off, 엇갈림 mixed, 빈 목록 null',A.state([true,true])==='on'&&A.state([false,false])==='off'&&A.state([true,false])==='mixed'&&A.state([])===null);
 ok('state: 단계 값 같으면 그 값, 다르면 mixed',A.state(['mid','mid'])==='mid'&&A.state(['mid','low'])==='mixed');}
console.log((bad?'R1280 CPU FAILED ':'R1280 CPU PASSED ')+(n-bad)+'/'+n);process.exit(bad?1:0);
