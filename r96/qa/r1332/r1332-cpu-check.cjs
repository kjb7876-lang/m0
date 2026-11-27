// R1332 CPU 검사 — 카이로노미콘(STORY kair01~kair10) 전수조사에서 찾은 '벽 자리에 바닥 타일' 류 그리기 오류.
//  사용자 2026-11-26 "카이로노미콘맵 전수조사해서 타일이 벽에나오는 버그같은거 개선디버깅".
//  ① 맵 가장자리: 야외형 카이로 지역(세이렌 모르·수로·뉴런 게이트·망각의 묘지·붕괴 의식장)은 길 밖 둔덕 뚜껑(R100 hedge-top)이 지도 경계(bounds) 안에만 깔리고,
//     그 아래 바닥 판(R98 annex ground — 바닥 타일 그림)은 경계 밖 28칸(x 100→128 등)까지 뻗는다 → 바깥 벽 너머에 검은 띠(R188 가장자리 판) + 회로 바닥 타일이 그대로 보였다.
//     고침: 경계 둘레에 같은 뚜껑 재질·같은 높이의 바깥 고리 뚜껑을 덧깐다(그림만, 충돌·길·바닥 판정 그대로).
//  ② 문틀: R930 이 벽만 kc-deck/kc-forge 로 바꾼 카이로 실내형 지역의 문틀 띠가 옛 병동 벽 그림(밝은 회색)으로 남아 흰 기둥처럼 떴다 → 그 지역 벽 그림으로.
//     망각의 묘지(kair09)는 R1298 문틀 훅이 그대로 맡고, R204 유기 지형 지역(kair01·04·05)은 R264 어두운 바위 문틀 그대로.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),rd=f=>fs.readFileSync(path.join(R,f),'utf8');let bad=0,n=0;
const ok=(m,c,x)=>{n++;if(!c){bad++;console.log('FAIL',m,x!==undefined?JSON.stringify(x).slice(0,500):'');}else console.log('ok  ',m);};
const F='kairo-edges-r1332.js';let src='';
try{src=rd('client-source/'+F);}catch(e){ok('client-source/'+F+' exists',false);}
// ---------- 빌드 연결 ----------
if(src){ok('runtime copy identical to client-source',(()=>{try{return rd('runtime-text/'+F)===src;}catch(_){return false;}})());
 const html=rd('runtime-text/index.html');ok('index.html: 자기 줄 한 번, cemetery-r1298 뒤(문틀 훅을 감쌈)·boot-lean-r1038 앞, polish-r100·world-doors-r83 뒤',html.split('"./'+F+'"').length===2&&/\n<script src="\.\/kairo-edges-r1332\.js"><\/script>\n/.test(html)&&['polish-r100.js','world-doors-r83.js','world-r98.js','cemetery-r1298.js'].every(f=>html.indexOf('"./'+f+'"')>=0&&html.indexOf('"./'+f+'"')<html.indexOf('"./'+F+'"'))&&html.indexOf('"./'+F+'"')<html.indexOf('"./boot-lean-r1038.js"'));
 ok('runtime-inputs·manifest 목록에 있음',JSON.parse(rd('runtime-inputs.json')).textPaths.includes(F)&&JSON.parse(rd('runtime-manifest.json')).files.some(f=>f.path===F));
 ok('verify-r96-public.py 기대 목록·CI(pages.yml) 검사 줄',/'kairo-edges-r1332\.js'/.test(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8'))&&/node r96\/qa\/r1332\/r1332-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
 const code=src.replace(/\/\/[^\n]*\n/g,'\n').replace(/\/\*[\s\S]*?\*\//g,'');
 ok('그림만: 충돌·바닥·벽 목록·전투·저장을 건드리지 않고 무작위 없음',!/floorCells\s*=|\.walls\s*=|floorRects\s*=|\.hp\s*=[^=]|serializeSave|Math\.random|Date\.now|explorationBlocked\s*=|blocked\s*=/.test(code));}
// ---------- 순수 함수 ----------
let K=null,hook=null,loads=[];
function sandbox(base){const store={};const sb={console,Math,JSON,Object,Array,Number,String,Set,Map,WeakMap,Float32Array,Uint16Array,Uint32Array,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},
 Image:class{constructor(){loads.push(this);}set src(v){this._src=v;}get src(){return this._src;}}};sb.window=sb;if(base)sb.__STORYWORLD_DOOR_FRAME_R1298__=base;vm.createContext(sb);vm.runInContext(src,sb,{filename:F});return sb;}
if(src){try{const base=Object.freeze({art:r=>r&&r.id==='kair09'?{path:'BASE',rect:[1,2,3,4],tint:7,image:'B'}:null});const sb=sandbox(base);K=sb.__STORYWORLD_KAIRO_EDGES_R1332__;hook=sb.__STORYWORLD_DOOR_FRAME_R1298__;}catch(e){ok('overlay loads in a bare sandbox (no renderer): '+e.message,false);}}
if(K){const area=rs=>rs.reduce((s,q)=>s+q.width*q.depth,0),inside=(rs,x,y)=>rs.some(q=>x>=q.x&&x<q.x+q.width&&y>=q.y&&y<q.y+q.depth);
 const b=[0,0,100,104],g=K.ring(b,40);
 ok('바깥 고리: 사각형 4개, 넓이 = (경계+여백)² − 경계, 서로 겹치지 않음',g.length===4&&Math.abs(area(g)-(180*184-100*104))<1e-9,g);
 ok('경계 안(바닥·둔덕 자리)은 하나도 덮지 않는다 — 원래 뚜껑·바닥 그대로',[[0,0],[50,50],[99.99,103.99],[0,103.9],[99.9,0]].every(([x,y])=>!inside(g,x,y)));
 ok('경계 밖 사방(동 x100~128 바닥 판 끝까지 포함)과 모서리를 덮는다',[[100,50],[127.9,50],[139.9,143.9],[-1,50],[-40,-40],[50,104],[50,-.1],[100,104]].every(([x,y])=>inside(g,x,y)));
 ok('모든 값이 유한하고 너비·깊이 > 0',g.every(q=>[q.x,q.y,q.width,q.depth].every(Number.isFinite)&&q.width>0&&q.depth>0));
 ok('경계: 정수 아닌 경계·다른 원점(세이렌 모르 0,0,87,113)도 같은 규칙',(()=>{const h=K.ring([.5,-2.25,87,113],10);return h.length===4&&Math.abs(area(h)-((86.5+20)*(115.25+20)-86.5*115.25))<1e-9&&!inside(h,1,0)&&inside(h,87,0);})());
 ok('경계: 깨진 경계(NaN·Infinity·크기 0·뒤집힘·짧은 배열·null)·여백 0/음수/NaN 은 빈 목록',[[NaN,0,1,1],[0,0,Infinity,1],[0,0,0,10],[5,5,1,1],[0,0,1],null,'x'].every(v=>K.ring(v,40).length===0)&&[0,-3,NaN].every(m=>K.ring(b,m).length===0));
 ok('기본 여백은 R98 바닥 판 넘침(28칸)보다 넓다',K.MARGIN>28&&K.ring(b).length===4);
 const r=(id,layer='STORY')=>({id,layer});
 ok('고리 대상 = 카이로 10지역(STORY)만, 다른 지역·사몽 층은 아님',['kair01','kair03','kair06','kair08','kair09','kair10'].every(id=>K.ringZone(r(id)))&&!['dist03','ep1a08','hub','kair11','last302'].some(id=>K.ringZone(r(id)))&&!K.ringZone(r('kair08','DREAM'))&&!K.ringZone(null)&&!K.ringZone({id:'kair08',layer:'STORY',samongR103:true}));
 const fa=id=>K.frameArt(r(id));
 ok('문틀 그림: 실내·벽만 바뀐 카이로 지역 = 그 지역 벽(kc-deck, 검은 공방 kc-forge)의 벽 칸(1024,0,1024,1024)',['kair02','kair03','kair06','kair08','kair10'].every(id=>fa(id)?.path==='assets/r930/tiles/kc-deck.webp'&&JSON.stringify(fa(id).rect)==='[1024,0,1024,1024]'&&Number.isInteger(fa(id).tint))&&fa('kair07')?.path==='assets/r930/tiles/kc-forge.webp',['kair02','kair07'].map(fa));
 ok('회귀: 망각의 묘지(R1298 훅 몫)·유기 지형 kair01·04·05(R264 어두운 문틀)·다른 지역·사몽 층·null 은 null',['kair09','kair01','kair04','kair05','dist03','hub','ep1a08'].every(id=>fa(id)===null)&&K.frameArt(r('kair08','DREAM'))===null&&K.frameArt(null)===null);}
if(hook&&K){ok('문틀 훅 사슬: 망각의 묘지는 R1298 훅이 준 그림 그대로(먼저 묻는다)',hook.art({id:'kair09',layer:'STORY'})?.path==='BASE');
 const first=hook.art({id:'kair08',layer:'STORY'});ok('문틀 훅: 그림이 아직 안 불러와졌으면 null(원래 문틀 그대로, 빈 틀 없음)하고 kc-deck 를 불러오기 시작',first===null&&loads.some(i=>/kc-deck\.webp$/.test(i.src)),loads.map(i=>i.src));
 for(const i of loads)i.onload?.();const a=hook.art({id:'kair08',layer:'STORY'});
 ok('문틀 훅: 불러온 뒤엔 image·rect·tint 를 준다(R83 affinePatch 가 쓰는 꼴)',!!a&&!!a.image&&JSON.stringify(a.rect)==='[1024,0,1024,1024]'&&Number.isInteger(a.tint),a&&{...a,image:!!a.image});
 ok('문틀 훅: 다른 지역은 null(원래대로)',hook.art({id:'dist03',layer:'STORY'})===null&&hook.art(null)===null);
 const sb2=sandbox(null);ok('경계: R1298 훅이 없어도 오류 없이 카이로 문틀을 맡는다',typeof sb2.__STORYWORLD_DOOR_FRAME_R1298__?.art==='function'&&sb2.__STORYWORLD_DOOR_FRAME_R1298__.art({id:'kair09',layer:'STORY'})===null);
 ok('끄기 키 storyworld.r1332.kairoEdges=0 이면 고리·문틀 모두 끈다',(()=>{const store={'storyworld.r1332.kairoEdges':'0'};const sb={console,Math,JSON,Object,Array,Number,String,Set,Map,WeakMap,localStorage:{getItem:k=>store[k]??null,setItem(){}},Image:class{}};sb.window=sb;vm.createContext(sb);vm.runInContext(src,sb);const k=sb.__STORYWORLD_KAIRO_EDGES_R1332__;return k.frameArt({id:'kair08',layer:'STORY'})===null&&!k.ringZone({id:'kair08',layer:'STORY'});})());}
// ---------- 실제 사이트(CPU 하네스) ----------
(async()=>{let h=null;try{const{createHarness}=require(path.join(R,'qa','harness.cjs'));h=createHarness({timeoutMs:300000});await h.boot();}catch(e){ok('built site boots in the CPU harness: '+String(e).slice(0,200),false);}
 if(h){const s=h.run(`(()=>{const K=window.__STORYWORLD_KAIRO_EDGES_R1332__;if(!K)return null;const X=__STORYWORLD_EXPLORATION__,out={};for(const id of ['kair03','kair06','kair08','kair09','kair10']){const L=X.layout(id,'STORY');out[id]=L?K.ring(L.bounds).length:-1;}return{out,err:K.inspect().stats.errors,hook:typeof window.__STORYWORLD_DOOR_FRAME_R1298__?.art,rev:K.revision};})()`);
  ok('실제 사이트: R1332 오버레이가 올라오고 오류 0, 문틀 훅 살아 있음',!!s&&s.err===0&&s.hook==='function',s);
  ok('실제 야외형 카이로 5지역 경계로 고리 사각형 4개씩',!!s&&Object.values(s.out).every(v=>v===4),s&&s.out);}
 console.log(`\nR1332 CPU: ${n-bad}/${n} passed`);process.exit(bad?1:0);})();
