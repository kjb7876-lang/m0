// R1335 CPU 검사 — 카이로 밖 야외 스토리 지역의 맵 가장자리(바깥 벽 너머 바닥 타일·검은 띠). R1332 바깥 고리를 다른 지역에 넓힌다.
//  사용자 2026-11-26 "같은 문제가 다른 야외 지역에도 있을 확률이 약 70%인데, 이것도 고칠까요 /응고쳐".
//  실측(헤드리스): 둔덕 뚜껑(R100)이 있는 야외·혼합 30지역 모두 땅 판(R98)이 경계 밖 20칸(x 100→120 또는 세로형 -16)까지 뻗는다.
//  카이로 밖 지역은 길 밖 덩어리가 어두운 벽 덩어리라 맵 밖을 R188 빈 색(0x08070b) 판으로 덮는다(1차안 이끼 뚜껑 고리는 헤드리스 비교에서 이끼 평원처럼 떠 보여 버림).
//  R204 유기 지형 지역(바위 판이 R100 뚜껑을 대신, 뚜껑 layers 0)은 덮지 않는다 — 실제 덮개 여부는 브라우저 검사(r1335-browser.mjs)가 본다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),rd=f=>fs.readFileSync(path.join(R,f),'utf8');let bad=0,n=0;
const ok=(m,c,x)=>{n++;if(!c){bad++;console.log('FAIL',m,x!==undefined?JSON.stringify(x).slice(0,500):'');}else console.log('ok  ',m);};
const F='outdoor-edges-r1335.js';let src='',ksrc='';
try{ksrc=rd('client-source/kairo-edges-r1332.js');}catch(e){ok('R1332 source exists',false);}
try{src=rd('client-source/'+F);}catch(e){ok('client-source/'+F+' exists',false);}
if(src){ok('runtime copy identical to client-source',(()=>{try{return rd('runtime-text/'+F)===src;}catch(_){return false;}})());
 const html=rd('runtime-text/index.html');ok('index.html: 자기 줄 한 번, kairo-edges-r1332 바로 뒤(ring 함수를 씀)·boot-lean-r1038 앞',html.split('"./'+F+'"').length===2&&html.includes('<script src="./kairo-edges-r1332.js"></script>\n<script src="./outdoor-edges-r1335.js"></script>\n')&&html.indexOf('"./'+F+'"')<html.indexOf('"./boot-lean-r1038.js"'));
 ok('runtime-inputs·manifest 목록에 있음',(()=>{try{return JSON.parse(rd('runtime-inputs.json')).textPaths.includes(F)&&JSON.parse(rd('runtime-manifest.json')).files.some(f=>f.path===F);}catch(_){return false;}})());
 ok('verify-r96-public.py 기대 목록·CI(pages.yml) 검사 줄',/'outdoor-edges-r1335\.js'/.test(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8'))&&/node r96\/qa\/r1335\/r1335-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
 const code=src.replace(/\/\/[^\n]*\n/g,'\n').replace(/\/\*[\s\S]*?\*\//g,'');
 ok('그림만: 충돌·바닥·벽 목록·전투·저장을 건드리지 않고 무작위 없음',!/floorCells\s*=|\.walls\s*=|floorRects\s*=|\.hp\s*=[^=]|serializeSave|Math\.random|Date\.now|blocked\s*=/.test(code));}
let O=null;
function sandbox(withK,store={}){const sb={console,Math,JSON,Object,Array,Number,String,Set,Map,WeakMap,localStorage:{getItem:k=>store[k]??null,setItem(){}},Image:class{}};sb.window=sb;vm.createContext(sb);if(withK)vm.runInContext(ksrc,sb);vm.runInContext(src,sb);return sb;}
if(src&&ksrc){try{O=sandbox(true).__STORYWORLD_OUTDOOR_EDGES_R1335__;}catch(e){ok('overlay loads in a bare sandbox: '+e.message,false);}}
if(O){const r=(id,layer='STORY',x={})=>({id,layer,...x});const area=rs=>rs.reduce((s,q)=>s+q.width*q.depth,0),inside=(rs,x,y)=>rs.some(q=>x>=q.x&&x<q.x+q.width&&y>=q.y&&y<q.y+q.depth);
 ok('대상: 카이로 밖 스토리 지역(야외 대표 dist03·u201·cult01·murder01·hando03·last302)',['dist03','u201','cult01','murder01','hando03','last302','ep1a10'].every(id=>O.ringZone(r(id))));
 ok('회귀: 카이로 10지역은 R1332 몫(겹쳐 깔지 않음)',['kair01','kair03','kair08','kair10'].every(id=>!O.ringZone(r(id))));
 ok('사몽 층·사몽 표시 지역·null·id 없음은 아님',!O.ringZone(r('dist03','DREAM'))&&!O.ringZone(r('dist03','STORY',{samongR103:true}))&&!O.ringZone(r('dist03','STORY',{exploration:{samongR115:true}}))&&!O.ringZone(null)&&!O.ringZone({layer:'STORY'}));
 const g=O.rects([0,0,100,104]);
 ok('고리 = R1332 와 같은 경계 고리(넓이 180×184−100×104), 경계 안 0, 동쪽 땅 판 끝(x 119.9)·서북 모서리 덮음',g.length===4&&Math.abs(area(g)-(180*184-100*104))<1e-9&&!inside(g,50,50)&&!inside(g,99.9,103.9)&&inside(g,119.9,50)&&inside(g,-16,-16));
 ok('덮개 색 = R188 가장자리 판 빈 색 0x08070b(맵 밖은 어둠, 바닥·이끼 그림 아님)',O.VOID===0x08070b);
 ok('경계: 깨진 경계(NaN·Infinity·크기 0·뒤집힘·null)는 빈 목록',[[NaN,0,1,1],[0,0,Infinity,1],[0,0,0,10],[5,5,1,1],null].every(b=>O.rects(b).length===0));
 ok('세로형 지도(0,0,87,113, 땅 판 -16..87)도 서·북 넘침을 덮음',(()=>{const q=O.rects([0,0,87,113]);return inside(q,-16,50)&&inside(q,50,-16)&&!inside(q,0,0)&&!inside(q,86.9,112.9);})());
 ok('경계: R1332 가 없으면 아무것도 깔지 않음(오류 없음)',(()=>{const o=sandbox(false).__STORYWORLD_OUTDOOR_EDGES_R1335__;return !o.ringZone(r('dist03'))&&o.rects([0,0,100,104]).length===0&&o.inspect().linked===false;})());
 ok('끄기 키 storyworld.r1335.outdoorEdges=0',!sandbox(true,{'storyworld.r1335.outdoorEdges':'0'}).__STORYWORLD_OUTDOOR_EDGES_R1335__.ringZone(r('dist03')));}
(async()=>{let h=null;try{const{createHarness}=require(path.join(R,'qa','harness.cjs'));h=createHarness({timeoutMs:300000});await h.boot();}catch(e){ok('built site boots in the CPU harness: '+String(e).slice(0,200),false);}
 if(h){const s=h.run(`(()=>{const O=window.__STORYWORLD_OUTDOOR_EDGES_R1335__;if(!O)return null;return{i:O.inspect(),n:['dist03','u201','cult01','last302'].map(id=>O.rects(__STORYWORLD_EXPLORATION__.layout(id,'STORY').bounds).length)};})()`);
  ok('실제 사이트: R1335 오버레이가 R1332 에 이어 붙고 오류 0, 야외 지역 경계로 고리 4개씩',!!s&&s.i.linked&&s.i.stats.errors===0&&s.n.every(v=>v===4),s);}
 console.log(`\nR1335 CPU: ${n-bad}/${n} passed`);process.exit(bad?1:0);})();
