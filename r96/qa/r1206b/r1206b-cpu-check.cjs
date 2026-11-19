// R1206b CPU 검사 — 사몽 분위기 소품(R123 코드 그림) 중 Dots CX-0166SM-A 가 온 5종(lantern·inkpost·shard·canvas·stone)을 그림으로(samong-props-r1206b.js).
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'../..'),SRC=path.join(R,'client-source/samong-props-r1206b.js');
const checks=[];const ok=(n,p,d)=>checks.push({n,p:!!p,d});
ok('오버레이 파일 있음',fs.existsSync(SRC));
const code=fs.existsSync(SRC)?fs.readFileSync(SRC,'utf8'):'';
const html=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8');
ok('index.html 스크립트 태그(R1195 뒤 자기 줄, 매 tick 확인이라 R123 앞이어도 됨)',/<script src="\.\/mob-feet-ink-r1195\.js"><\/script>\n<script src="\.\/samong-props-r1206b\.js"><\/script>\n/.test(html));
ok('공개 확인 기대 목록',fs.readFileSync(path.join(R,'../scripts/verify-r96-public.py'),'utf8').includes('samong-props-r1206b.js'));
ok('runtime-text 사본·runtime-inputs 등록',fs.existsSync(path.join(R,'runtime-text/samong-props-r1206b.js'))&&fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8').includes('samong-props-r1206b.js'));
const idx=JSON.parse(fs.readFileSync(path.join(R,'runtime-text/assets/r1206/props/index.json'),'utf8'));
const KINDS=['lantern','inkpost','shard','canvas','stone'];
ok('그림 5종 있음·바이트 일치',KINDS.every(k=>{const m=idx.props[k];return m&&fs.existsSync(path.join(R,'runtime-text',m.path))&&fs.statSync(path.join(R,'runtime-text',m.path)).size===m.bytes;}));
ok('색인에 드라이브 파일 id 없음(공개 저장소)',!/driveId|[0-9A-Za-z_-]{28,}/.test(JSON.stringify(idx).replace(/"sha256":"[0-9a-f]{64}"/g,'').replace(/"file":"CX-[^"]*\.png"/g,'')));
ok('runtime-inputs 에 그림 5장 등록',KINDS.every(k=>fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8').includes('assets/r1206/props/'+k+'.webp')));
// ---- 동작 ----
function mk(room,stored){const added=[];const sb={window:{},console,Math,JSON,Object,Array,Set,Map,WeakMap,Number,String,Promise,Date,localStorage:{getItem:()=>stored??null,setItem(){}},
  room,tick(){return 't';},addImage:p=>added.push(p),readyImage:()=>null,setTimeout:()=>0};sb.window=sb;vm.createContext(sb);if(code)vm.runInContext(code,sb);return {sb,added};}
const deco=(kind,id,extra={})=>({id,x:1,y:1,height:60,r123Deco:{id,kind,seed:1},...extra});
{const room={id:'last302',samongR103:{zone:'sz115-S05-1'},props:[deco('lantern','a'),deco('inkpost','b'),deco('shard','c'),deco('canvas','d'),deco('stone','e'),deco('tendril','f'),deco('tree','g',{path:'assets/r129/props/tree.webp',height:230}),{id:'h',x:2,y:2,path:'assets/props/x.webp'}]};
 const {sb,added}=mk(room);const r=sb.tick();const P=Object.fromEntries(room.props.map(p=>[p.id,p]));
 ok('tick 결과 그대로 돌려줌',r==='t');
 ok('5종은 그림 경로·높이를 얻음',KINDS.every((k,i)=>P['abcde'[i]].path===idx.props[k].path&&P['abcde'[i]].height>40),room.props.map(p=>[p.id,p.path,p.height]));
 ok('그림 요청(addImage) 5장',KINDS.every(k=>added.includes(idx.props[k].path)),added);
 ok('stone 은 원래처럼 떠 있음(visualLiftPx)',P.e.visualLiftPx>0);
 ok('회귀: 아직 그림이 없는 종류(tendril)는 코드 그림 그대로',!P.f.path);
 ok('회귀: 이미 원화가 있던 소품(tree)·일반 소품은 안 건드림',P.g.path==='assets/r129/props/tree.webp'&&P.g.height===230&&P.h.path==='assets/props/x.webp');
 sb.tick();ok('경계: 같은 방은 한 번만(다시 tick 해도 요청 늘지 않음)',added.length===5,added.length);}
{const room={id:'ep1a09',props:[deco('lantern','a')]};const {sb,added}=mk(room);sb.tick();ok('경계: 사몽 밖 방은 손대지 않음',!room.props[0].path&&added.length===0);}
{const room={id:'last302',samongR103:{zone:'sz115-S05-1'},props:[deco('lantern','a')]};const {sb}=mk(room,'{"on":false}');sb.tick();ok('끄기 storyworld.r1206b.props {"on":false} 면 코드 그림 그대로',!room.props[0].path);}
const pass=checks.filter(c=>c.p).length;for(const c of checks)console.log((c.p?'PASS ':'FAIL ')+c.n+(c.p?'':' '+String(JSON.stringify(c.d)??'').slice(0,400)));
console.log(`R1206b ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
