// R1374d 조종 영웅은 언제나 3D — CPU 검사. 사용자 2026-11-27 08:30Z "이제부터는 3d영웅을 기본으로 사용해 모든경우, 스킬이펙트용이나 소환용으로만 2d영웅사용",
//  08:31Z "무한생존도 플레이어는 3d임", "배치영웅만 2d".
//  ① 연결: 원본 = runtime-text 사본, 태그 한 번·R1327 뒤·R1302 앞, 공개 검증 목록·매니페스트·CI 줄.
//  ② 저장 값: 정한 적 없음·'off'·그 밖 → 'on' 으로 적는다(설정에서 껐던 사람도 3D). 개발 검사용 2D 키(storyworld.r1374d.qa2d=on)일 때만 손대지 않음.
//     경계: 저장소 읽기·쓰기 예외·저장소 없음 → 죽지 않음.
//  ③ 지킴: R1302 가 꺼져 있으면(on()===false) set(true) 로 다시 켠다. 개발 검사 키면 건드리지 않는다.
//  ④ 설정 창: 3D 체크 상자는 켜진 채 잠기고(disabled) 글은 "항상 켬". 눌러도 꺼지지 않는다. 줄이 없으면 아무 일 없음.
//  ⑤ 배치·소환 영웅은 그대로 2D: R1302 active() 가 r720Ally·r949Summon 을 3D 에서 뺀다(고치지 않음).
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p),'utf8');}catch(_){return null;}};
const F='hero3d-always-r1374d.js',src=rd('client-source/'+F)||'',KEY='storyworld.r1302.hwando3d',QA='storyworld.r1374d.qa2d';
ok(src.length>0&&src===rd('runtime-text/'+F),'① 오버레이 원본 = runtime-text 사본');
const html=rd('runtime-text/index.html')||'',at=n=>html.indexOf('<script src="./'+n+'"></script>');
ok(at(F)>0&&at('hero-3d-default-r1327.js')<at(F)&&at(F)<at('hwando-3d-r1302.js')&&html.split(F).length===2,'① 태그 한 번, R1327 뒤·R1302 앞');
ok(fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'"+F+"'"),'① 공개 검증 목록');
ok((rd('runtime-manifest.json')||'').includes(F)&&(rd('runtime-inputs.json')||'').includes(F),'① 매니페스트·입력 목록');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1374/r1374d-cpu-check.cjs'),'① CI 줄');
function run(store,opts={}){const writes=[],timers=[];const ls=opts.noLs?undefined:{getItem:k=>{if(opts.throwGet)throw Error('denied');return k in store?store[k]:null;},setItem:(k,v)=>{if(opts.throwSet)throw Error('quota');writes.push(k);store[k]=String(v);}};
 const win={localStorage:ls,setInterval(f){timers.push(f);return timers.length;},document:opts.doc,location:{search:opts.search||''}};let err=null;const sb={window:win,Object,String,Array,JSON,console};vm.createContext(sb);
 try{vm.runInContext(src,sb,{filename:F});}catch(e){err=e;}const tick=()=>{for(const f of timers)f();};return {win,api:win.__STORYWORLD_HERO3D_ALWAYS_R1374D__,err,writes,store,tick};}
// ②
{const a=run({});ok(!a.err&&a.api&&a.store[KEY]==='on','② 정한 적 없음 → on');
 const b=run({[KEY]:'off'});ok(!b.err&&b.store[KEY]==='on'&&b.api?.inspect().before==='off','② 설정에서 껐던 사람(off) → on');
 const c=run({[KEY]:'on'});ok(!c.err&&c.store[KEY]==='on'&&c.writes.length===0,'② 이미 on → 쓰기 0');
 const d=run({[KEY]:'xyz'});ok(d.store[KEY]==='on','② 그 밖 글자 → on');
 const e=run({[KEY]:'off',[QA]:'on'});ok(!e.err&&e.store[KEY]==='off'&&e.writes.length===0&&e.api?.inspect().qa2d===true,'② 개발 검사 키면 손대지 않음');
 const e2=run({[KEY]:'off','storyworld.r1327.default3d':'off'});ok(e2.store[KEY]==='on','② R1327 되돌리기 키가 있어도 3D(사용자 새 규칙)');
 const f=run({},{throwGet:true});ok(!f.err&&f.api&&f.api.inspect().errors>=1,'② 읽기 예외: 죽지 않음');
 const g=run({},{throwSet:true});ok(!g.err&&g.api,'② 쓰기 예외: 죽지 않음');
 const h=run({},{noLs:true});ok(!h.err&&h.api,'② 저장소 없음: 죽지 않음');}
// ③
{const mkApi=v=>{const s={on:v,sets:[]};return {s,api:{on:()=>s.on,set:x=>{s.sets.push(x);s.on=!!x;return s.on;}}};};
 const a=run({[KEY]:'off'});const m=mkApi(false);a.win.__STORYWORLD_HWANDO3D_R1302__=m.api;a.tick();ok(m.s.sets.length===1&&m.s.sets[0]===true&&m.s.on===true,'③ R1302 꺼져 있으면 set(true)');
 a.tick();ok(m.s.sets.length===1,'③ 켜진 뒤 다시 부르지 않음');
 m.s.on=false;a.tick();ok(m.s.sets.length===2,'③ 누가 다시 꺼도 다시 켬');
 const b=run({[KEY]:'off',[QA]:'on'});const n=mkApi(false);b.win.__STORYWORLD_HWANDO3D_R1302__=n.api;b.tick();ok(n.s.sets.length===0,'③ 개발 검사 키면 안 켬');
 const c=run({});c.tick();ok(!c.err,'③ R1302 없을 때도 죽지 않음');}
// ④
{const mk=()=>{const text={nodeType:3,textContent:' 3D 영웅(시험)'},input={nodeType:1,checked:false,disabled:false,listeners:[],addEventListener(t,f){this.listeners.push([t,f]);}},label={childNodes:[input,text]},p={textContent:'… 끄면 2D 그림으로 돌아갑니다.'},row={dataset:{},querySelector:s=>s==='label'?label:s==='p'?p:s==='input'?input:null};return {text,input,label,p,row};};
 const u=mk();const doc={getElementById:id=>id==='hwando3dR1302Row'?u.row:id==='hwando3dR1302Toggle'?u.input:null};
 const a=run({},{doc});const m={on:true,sets:[]};a.win.__STORYWORLD_HWANDO3D_R1302__={on:()=>m.on,set:x=>{m.sets.push(x);m.on=!!x;return m.on;}};a.tick();
 ok(u.input.checked===true&&u.input.disabled===true,'④ 체크 상자 켜진 채 잠김');
 ok(/항상 켬/.test(u.text.textContent)&&!/시험/.test(u.text.textContent),'④ 이름 "항상 켬" '+JSON.stringify(u.text.textContent));
 ok(!/끄면 2D/.test(u.p.textContent)&&/소환|배치/.test(u.p.textContent),'④ 설명: 2D 는 소환·배치 영웅만 '+JSON.stringify(u.p.textContent));
 m.on=false;u.input.checked=false;if(typeof u.input.onchange==='function')u.input.onchange();for(const [t,f] of u.input.listeners)if(t==='change'||t==='click')f({preventDefault(){},target:u.input});a.tick();ok(m.on===true&&u.input.checked===true,'④ 눌러 꺼도 다시 켬');
 const b=run({},{doc:{getElementById:()=>null}});b.tick();ok(!b.err,'④ 줄 없으면 아무 일 없음');}
// ⑤
{const r1302=rd('client-source/hwando-3d-r1302.js')||'';ok(/function active\(\)\{return on&&[^}]*!player\.r720Ally&&!player\.r949Summon;\}/.test(r1302),'⑤ R1302 active(): 배치(r720Ally)·소환(r949Summon) 몸은 3D 에서 빠짐(그대로 2D)');}
console.log(fail?'\nR1374d CPU FAIL '+fail:'\nR1374d CPU PASS');process.exit(fail?1:0);
