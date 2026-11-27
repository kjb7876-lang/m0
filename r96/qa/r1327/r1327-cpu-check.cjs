// R1327 영웅 3D 기본 켜짐 — CPU 검사(브라우저 없음). 사용자 11-26 "영웅은 3d를 기본으로하고".
//  ① 연결: 원본 = runtime-text 사본, 스크립트 태그 한 번·hwando-3d-r1302.js 보다 먼저, 공개 검증 목록·매니페스트·CI 줄.
//  ② 정하기(decide): 정한 적 없음(null·undefined) → 'on'. 이미 'off'·'on'·그 밖의 글자·빈 글자 → 손대지 않음. 끄기 값 off → 손대지 않음.
//  ③ 실제 저장: 새 사용자 → 3D 키 'on', 끈 사람('off') 그대로, 켠 사람 그대로, 되돌리기 키면 안 적음, 두 번 불러도 한 번만.
//     경계: 저장소가 예외를 던져도(읽기·쓰기) 스크립트가 죽지 않고 오류만 셈, localStorage 없음.
//  ④ R1302 와 이어짐: 이 스크립트 뒤에 R1302 의 읽는 줄(localStorage.getItem(KEY)==='on')이 켜짐으로 읽는다. hwando-3d-r1302.js 는 고치지 않음(같은 키 이름).
//  ⑤ 설정 창 글: 줄이 생기면 "(시험)·기본은 끔" 을 "기본은 켬" 으로 한 번만 바꾸고 체크 상자는 건드리지 않음. 줄이 없으면 아무 일 없음.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p),'utf8');}catch(_){return null;}};
const F='hero-3d-default-r1327.js',src=rd('client-source/'+F)||'',KEY='storyworld.r1302.hwando3d';
ok(src.length>0&&src===rd('runtime-text/'+F),'① 오버레이 원본 = runtime-text 사본');
const html=rd('runtime-text/index.html')||'',at=n=>html.indexOf('<script src="./'+n+'"></script>');
ok(at(F)>0&&at(F)<at('hwando-3d-r1302.js')&&html.split(F).length===2,'① 스크립트 태그 한 번, hwando-3d-r1302.js 보다 먼저');
ok(fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'"+F+"'"),'① 공개 검증 목록');
ok((rd('runtime-manifest.json')||'').includes(F)&&(rd('runtime-inputs.json')||'').includes(F),'① 매니페스트·입력 목록');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1327/r1327-cpu-check.cjs'),'① CI 줄');
function run(store,opts={}){const writes=[];const ls=opts.noLs?undefined:{getItem:k=>{if(opts.throwGet)throw Error('denied');return k in store?store[k]:null;},setItem:(k,v)=>{if(opts.throwSet)throw Error('quota');writes.push(k);store[k]=String(v);}};
 const win={localStorage:ls,setInterval(){},document:opts.doc};let err=null;const sb={window:win,Object,String,Array,JSON,console};vm.createContext(sb);
 try{vm.runInContext(src,sb,{filename:F});if(opts.twice)vm.runInContext(src,sb,{filename:F});}catch(e){err=e;}return {win,api:win.__STORYWORLD_HERO3D_DEFAULT_R1327__,err,writes,store};}
// ②
{const d=run({}).api?.pure?.decide;ok(typeof d==='function','② decide 있음');
 if(d){ok(d(null,null)==='on'&&d(undefined,null)==='on','② 정한 적 없음 → on');
  ok(d('off',null)===null&&d('on',null)===null&&d('',null)===null&&d('OFF',null)===null&&d('1',null)===null,'② 이미 값이 있으면(off·on·빈 글자·그 밖) 손대지 않음');
  ok(d(null,'off')===null&&d('off','off')===null,'② 되돌리기 값 off → 손대지 않음');ok(d(null,'on')==='on'&&d(null,'')==='on','② 되돌리기 값이 off 가 아니면 적용');}}
// ③
{const a=run({});ok(!a.err&&a.store[KEY]==='on'&&a.api.inspect().applied===true&&a.api.inspect().before===null,'③ 새 사용자 → 3D 키 on');
 const b=run({[KEY]:'off'});ok(!b.err&&b.store[KEY]==='off'&&b.writes.length===0&&b.api.inspect().applied===false,'③ 끈 사람은 꺼진 채(쓰기 0)');
 const c=run({[KEY]:'on'});ok(c.store[KEY]==='on'&&c.writes.length===0,'③ 켠 사람은 그대로(쓰기 0)');
 const d=run({'storyworld.r1327.default3d':'off'});ok(!(KEY in d.store)&&d.writes.length===0,'③ 되돌리기 키면 안 적음');
 const e=run({},{twice:true});ok(!e.err&&e.writes.length===1,'③ 두 번 불러도 한 번만 적음');
 const f=run({},{throwGet:true});ok(!f.err&&f.api&&f.api.inspect().errors===1&&f.api.inspect().applied===false,'③ 읽기 예외: 죽지 않고 오류 1');
 const g=run({},{throwSet:true});ok(!g.err&&g.api&&g.api.inspect().errors===1&&g.api.inspect().applied===false&&!(KEY in g.store),'③ 쓰기 예외: 죽지 않고 오류 1, 적용 안 됨');
 const h=run({},{noLs:true});ok(!h.err&&h.api&&h.api.inspect().applied===false,'③ localStorage 없음: 죽지 않음');}
// ④
{const r1302=rd('client-source/hwando-3d-r1302.js')||'';ok(r1302.includes("KEY='storyworld.r1302.hwando3d'")&&r1302.includes("let on=false;try{on=localStorage.getItem(KEY)==='on';}catch(_){}"),'④ R1302 가 같은 키를 on 일 때만 켜짐으로 읽음(고치지 않음)');
 const a=run({});ok((a.store[KEY]==='on')===true,'④ 새 사용자: R1302 읽는 값 = 켜짐');const b=run({[KEY]:'off'});ok((b.store[KEY]==='on')===false,'④ 끈 사람: R1302 읽는 값 = 꺼짐');}
// ⑤
{const mk=()=>{const text={nodeType:3,textContent:' 3D 영웅(시험)'},input={nodeType:1,checked:false},label={childNodes:[input,text]},p={textContent:'… 기본은 끔입니다.'},row={dataset:{},querySelector:s=>s==='label'?label:s==='p'?p:null};return {text,input,label,p,row};};
 const m=mk(),a=run({},{doc:{getElementById:id=>id==='hwando3dR1302Row'?m.row:null}});
 ok(a.api.relabel()===true&&m.text.textContent===' 3D 영웅'&&/기본은 켬/.test(m.p.textContent)&&!/시험|기본은 끔/.test(m.text.textContent+m.p.textContent)&&m.input.checked===false,'⑤ 설정 창 글을 "기본은 켬" 으로, 체크 상자는 그대로');
 m.p.textContent='x';ok(a.api.relabel()===false&&m.p.textContent==='x','⑤ 한 번만 바꿈');
 const b=run({},{doc:{getElementById:()=>null}});ok(b.api.relabel()===false&&b.api.inspect().errors===0,'⑤ 줄이 없으면 아무 일 없음');
 const c=run({});ok(c.api.relabel()===false,'⑤ document 없음: 죽지 않음');}
console.log(fail?'\nR1327 CPU FAIL '+fail:'\nR1327 CPU PASS');process.exit(fail?1:0);
