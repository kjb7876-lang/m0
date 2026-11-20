// R1261 CPU 검사 — 초저(성능 1단계)에서 R409 테두리 끄기(low-step-r1261.js).
//  가짜 R1043 단계·R409 set(localStorage 에 씀)으로: 1단계면 테두리를 끄고 원래 값을 따로 두는지, 단계를 떠나면 되돌리는지,
//  사람이 이미 꺼 둔 테두리는 건드리지 않는지, 1단계에서 사람이 다시 켜면 덮어쓰지 않는지, 끄기·새로 고침 뒤에도 맞는지, 빌드 연결을 본다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),F='low-step-r1261.js',API='__STORYWORLD_LOW_STEP_R1261__',K409='storyworld.r409.combatRead';
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m);};
let src='';try{src=fs.readFileSync(path.join(R,'client-source',F),'utf8');}catch(_){}
ok(!!src,'① 오버레이 파일 있음');
function mk(store={},st=1){const timers=[];let step=st;const ctx={Math,Number,Object,String,JSON,console,
  localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}},setInterval:f=>{timers.push(f);return 1;}};
 ctx.window=ctx;ctx.__STORYWORLD_PERF7_R1043__={step:()=>step};
 const prefs={outline:true,enemyVeil:true};try{Object.assign(prefs,JSON.parse(store[K409]||'{}'));}catch(_){}
 ctx.__STORYWORLD_COMBAT_READ_R409__={set:p=>{for(const k of Object.keys(p))prefs[k]=p[k];store[K409]=JSON.stringify(prefs);return {...prefs};},prefs};
 vm.createContext(ctx);try{vm.runInContext(src,ctx);}catch(e){console.log('load error',e.message);}
 return {ctx,store,prefs,setStep:v=>{step=v;},tick:k=>{for(let i=0;i<(k||1);i++)for(const f of timers)f();},api:ctx[API]};}
if(src){
 {const m=mk({},1);ok(!!m.api,'① API '+API);ok(m.prefs.outline===false,'② 1단계면 테두리 끔');ok(m.prefs.enemyVeil===true,'② 몹 위 가림 옅게는 그대로');
  ok(JSON.parse(m.store['storyworld.r1261.saved409']).outline===true,'② 원래 값(켬)을 따로 둠');
  m.setStep(5);m.tick();ok(m.prefs.outline===true&&!('storyworld.r1261.saved409' in m.store),'② 1단계를 떠나면 되돌리고 따로 둔 값을 지움');
  m.setStep(1);m.tick();ok(m.prefs.outline===false,'② 다시 1단계면 다시 끔');}
 {const m=mk({[K409]:'{"outline":false}'},1);ok(m.prefs.outline===false&&!('storyworld.r1261.saved409' in m.store),'③ 사람이 이미 꺼 둔 테두리는 건드리지 않음');m.setStep(5);m.tick();ok(m.prefs.outline===false,'③ 단계를 떠나도 사람 값(끔) 그대로');}
 {const m=mk({},1);m.ctx.__STORYWORLD_COMBAT_READ_R409__.set({outline:true});m.tick(3);ok(m.prefs.outline===true,'③ 1단계에서 사람이 다시 켜면 덮어쓰지 않음');}
 {const store={};const a=mk(store,1);const b=mk(store,1);ok(b.prefs.outline===false&&JSON.parse(store['storyworld.r1261.saved409']).outline===true,'④ 새로 고침 뒤에도 원래 값(켬)을 잃지 않음');b.setStep(4);b.tick();ok(b.prefs.outline===true,'④ 새로 고침 뒤 단계를 올리면 켬으로 되돌림');}
 {const m=mk({'storyworld.r1261.lowStep':'0'},1);ok(m.prefs.outline===true,'④ 끄기(storyworld.r1261.lowStep=0)면 그대로');}
 {const m=mk({},5);ok(m.prefs.outline===true&&!('storyworld.r1261.saved409' in m.store),'④ 1단계가 아니면 아무것도 안 함');const i=m.api.inspect();ok(i.errors===0&&i.gameplayChanged===false,'④ inspect');}}
const RT=f=>{try{return fs.readFileSync(path.join(R,'runtime-text',f),'utf8');}catch(_){return '';}};const html=RT('index.html');
ok(html.split('"./'+F+'"').length===2&&html.includes('<script src="./draw-reuse-r1200.js"></script>\n<script src="./'+F+'"></script>'),'⑤ index.html 태그 한 번(draw-reuse-r1200 바로 뒤)');
ok(!!src&&RT(F)===src,'⑤ runtime-text 사본 = client-source');
let man='';try{man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');}catch(_){}ok(man.includes('"'+F+'"'),'⑤ runtime-manifest 에 실림');
let ver='';try{ver=fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8');}catch(_){}ok(ver.includes("'"+F+"'"),'⑤ 공개 확인 목록');
let ci='';try{ci=fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8');}catch(_){}ok(ci.includes('r96/qa/r1261/r1261-cpu-check.cjs'),'⑤ CI 검사 줄');
console.log(JSON.stringify({total:n,failed:bad,method:'node vm + fake R1043/R409; real game run by low-prof.mjs (headless)'}));process.exit(bad?1:0);
