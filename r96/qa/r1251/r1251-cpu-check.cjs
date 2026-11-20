// R1251 CPU 검사: 2차 리뷰 ③(사용자 11-20 00:34Z 첨부) "전투 중 긴 기억 쪽지는 한 줄로 접되 다시 열어 읽을 수 있게, 쪽지를 닫은 탭이 영웅 이동으로 이어지지 않게".
//  헤드리스(812×375 터치) 재현: 쪽지(R177 #r177Doc)를 탭해 닫았을 때 영웅 이동 0 — 새는 탭은 재현 안 됨. 그래도 접힌 쪽지를 펼치는 탭은 게임으로 안 넘기는 것을 고정.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'..','..'),ROOT=path.resolve(R,'..');const F='note-fold-r1251.js';
let n=0,bad=0;const ok=(m,c,x)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(!c&&x!==undefined?' '+JSON.stringify(x).slice(0,300):''));};
let src='';try{src=fs.readFileSync(path.join(R,'client-source',F),'utf8');}catch(_){}
ok('client-source/'+F+' 있음',!!src);
function mkEl(title){const cls=new Set();return {id:'r177Doc',hidden:false,cls,classList:{add:c=>cls.add(c),remove:c=>cls.delete(c),contains:c=>cls.has(c),toggle:(c,v)=>{if(v)cls.add(c);else cls.delete(c);}},querySelector:q=>q==='.h'?{textContent:title}:null};}
function boot(o={}){const listeners=[];let el=o.el===undefined?mkEl('기억 조각 · 첫 기억'):o.el;
 const sb={console,Math,JSON,Number,String,Object,Array,Map,Set,Error,isFinite,localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>0},
  document:{getElementById:id=>id==='r177Doc'?el:null,head:{appendChild(){}},createElement:()=>({}),addEventListener:(t,f,c)=>listeners.push([t,f,c])},
  setInterval:()=>0,started:true,modal:null,player:{x:5,y:5,hp:10},room:{enemies:o.enemies||[]}};
 sb.window=sb;vm.createContext(sb);try{vm.runInContext(src,sb);}catch(e){console.log('load',e.message);}return {sb,listeners,get el(){return el;},setEl:v=>{el=v;},A:sb.__STORYWORLD_NOTE_FOLD_R1251__};}
const near=[{x:7,y:5,hp:10}];
const t=boot({enemies:near});const A=t.A;
ok('API __STORYWORLD_NOTE_FOLD_R1251__ (tick·inspect·set)',!!A&&['tick','inspect','set'].every(k=>typeof A[k]==='function'));
if(A){A.tick();ok('전투 중(적 9칸 안) 펼친 쪽지 → 한 줄로 접힘',t.el.classList.contains('r1251Fold'));
 const cap=t.listeners.filter(l=>/^(pointerdown|click|touchstart|mousedown|pointerup|touchend)$/.test(l[0])&&(l[2]===true||l[2]?.capture));
 ok('문서 캡처 단계 탭 처리기 등록(게임·R177 처리기보다 먼저)',cap.some(l=>l[0]==='click')&&cap.some(l=>l[0]==='pointerdown'),t.listeners.map(l=>l[0]));
 let stopped=0,prevented=0;const ev=(type)=>({type,target:{closest:q=>q==='#r177Doc'?t.el:null},stopPropagation(){stopped++;},stopImmediatePropagation(){stopped++;},preventDefault(){prevented++;}});
 for(const [ty,f] of cap)if(ty==='pointerdown')f(ev('pointerdown'));
 ok('접힌 쪽지 탭(pointerdown): 게임으로 안 넘김',stopped>=1,stopped);
 for(const [ty,f] of cap)if(ty==='click')f(ev('click'));
 ok('접힌 쪽지 탭(click): 펼침 + R177 의 넘기기·닫기로 안 넘김',!t.el.classList.contains('r1251Fold')&&stopped>=2,{stopped,fold:t.el.classList.contains('r1251Fold')});
 A.tick();ok('사람이 펼친 같은 쪽지는 전투 중에도 다시 접지 않음',!t.el.classList.contains('r1251Fold'));
 t.setEl(mkEl('쪽지 · 다른 쪽지'));A.tick();ok('새 쪽지가 뜨면 전투 중 다시 접힘',t.el.classList.contains('r1251Fold'));
 t.sb.room.enemies=[];A.tick();ok('전투가 끝나면 저절로 펼침',!t.el.classList.contains('r1251Fold'));
 // 펼친 쪽지 탭은 그대로 R177(넘기기·닫기)에 맡김
 let s2=0;const e2={type:'click',target:{closest:q=>q==='#r177Doc'?t.el:null},stopPropagation(){s2++;},stopImmediatePropagation(){s2++;},preventDefault(){}};for(const [ty,f] of cap)if(ty==='click')f(e2);
 ok('펼친 쪽지 탭은 건드리지 않음(R177 넘기기·닫기 그대로)',s2===0);
 let s3=0;const e3={type:'pointerdown',target:{closest:()=>null},stopPropagation(){s3++;},stopImmediatePropagation(){s3++;},preventDefault(){}};t.sb.room.enemies=near;A.tick();for(const [ty,f] of cap)f(e3);ok('쪽지 밖 탭은 게임으로 그대로',s3===0);
 t.el.hidden=true;let thrown=false;try{A.tick();}catch(_){thrown=true;}ok('쪽지가 닫혀 있으면 아무것도 안 함',!thrown);
 t.setEl(null);try{A.tick();}catch(_){thrown=true;}ok('쪽지 요소가 없어도 멈추지 않음',!thrown);
 const u=boot({enemies:near});u.A.set({on:false});u.A.tick();ok('끄기(on:false)면 접지 않음',!u.el.classList.contains('r1251Fold'));
 const d=boot({enemies:[{x:6,y:5,hp:0},{x:6,y:5,hp:9,ally:true}]});d.A.tick();ok('죽은 적·아군은 전투로 안 셈',!d.el.classList.contains('r1251Fold'));
 ok('접힘 표시는 CSS 로만(모양 그림 없음, R177 쪽지 글은 그대로)',/r1251Fold/.test(src)&&!/innerHTML\s*=/.test(src));
}
const idx=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok('index.html 태그(실행 때 #r177Doc 를 찾으므로 순서 무관)',idx.includes('src="./'+F+'"'));
ok('runtime-text 사본 같음',(()=>{try{return fs.readFileSync(path.join(R,'runtime-text',F),'utf8')===src;}catch(_){return false;}})());
ok('verify-r96-public 목록',fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes(F));
ok('pages.yml 검사 줄',fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8').includes('r96/qa/r1251/r1251-cpu-check.cjs'));
console.log(`R1251 CPU ${bad?'FAILED':'PASSED'} ${n-bad}/${n}`);process.exit(bad?1:0);
