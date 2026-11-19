// R1196 둘째: HUD 갱신(updateHUD)도 R420(접근성, 1초마다)과 R1046(EGO 선택창 형상, 0.5초마다)이 "맨 바깥이 아니면 다시 감싸기"를 번갈아 해
//  브라우저 실측 1시간에 사슬 약 7,200겹(스택 7,234줄)·updateHUD 한 번 0.68→1.13ms. 두 파일의 실제 감싸기 함수 줄을 잘라 vm 에서 가상 시계로 돌린다.
// 검사: ① 1·3시간 뒤 updateHUD 가 스택 넘침 없이 돎 ② 감싸기 겹 수 상한 ③ 두 덧씌우기가 계속 동작(fixHint·이름 바꾸기 1번 이상, 겹 수만큼 넘지 않음) ④ 0초 동작 그대로
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'../..');let fails=0,n=0;const ok=(c,m)=>{n++;if(!c){fails++;console.log('FAIL '+m);}};
const rd=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const line=(src,re,name)=>{const m=src.split('\n').find(l=>re.test(l));if(!m)throw new Error('no '+name);return m;};
const A=line(rd('client-source/access-r420.js'),/^function wrapHud\(\)/,'R420 wrapHud'),E=line(rd('client-source/ego-sovereign-r1046.js'),/^function wrapHUD\(\)/,'R1046 wrapHUD');
function world(){const cnt={fix:0,name:0,base:0};const el={textContent:''};
 const C={Math,String,Number,Object,Error,console,stats:{},fail(){},cnt,
  fixHint(){cnt.fix++;},formActive:()=>true,rcActive:()=>false,hasDoc:()=>true,P:{title:'EGO',portrait:'x.webp'},G:(f,d)=>{try{return f();}catch(_){return d;}},
  document:{getElementById(id){if(id==='heroName')cnt.name++;return el;},querySelector(){return null;}}};
 C.updateHUD=function(){cnt.base++;};C.window=C;vm.createContext(C);
 vm.runInContext('(()=>{'+A+'\nglobalThis.__a=wrapHud;})();(()=>{'+E+'\nglobalThis.__e=wrapHUD;})();',C);
 const ivs=[{f:C.__a,ms:1000,next:1000},{f:C.__e,ms:500,next:500}];C.__a();C.__e();let now=0;
 const run=sec=>{const end=now+sec*1000;for(;;){let nx=null;for(const it of ivs)if(it.next<=end&&(!nx||it.next<nx.next))nx=it;if(!nx)break;now=nx.next;try{nx.f();}catch(_){}nx.next+=nx.ms;}now=end;};
 const call=()=>{for(const k in cnt)cnt[k]=0;let err=null,d=0;const g=C.document.getElementById;Error.stackTraceLimit=Infinity;
  C.document.getElementById=function(id){if(!d)d=new Error().stack.split('\n').length;return g.call(this,id);};try{C.updateHUD();}catch(x){err=x;}C.document.getElementById=g;Error.stackTraceLimit=10;return {err,d,...cnt};};
 return {C,run,call};}
{const w=world();const r=w.call();ok(!r.err&&r.base===1&&r.fix===1&&r.name>=1,'④ 0초 원래 HUD 1번·fixHint 1번·이름 바꾸기 ('+JSON.stringify(r)+')');}
const w=world();w.run(60);const m1=w.call();w.run(3540);const h1=w.call();
ok(!h1.err,'① 1시간 뒤 updateHUD 돎 ('+(h1.err&&h1.err.message)+')');ok(h1.base===1,'③ 1시간 뒤 원래 HUD 1번 ('+h1.base+')');
ok(h1.fix>=1&&h1.fix<=m1.fix+1&&h1.fix<=6,'② 1시간 뒤 R420 겹 수 상한 (1분 '+m1.fix+' → 1시간 '+h1.fix+')');
ok(h1.name>=1&&h1.name<=m1.name+2&&h1.name<=12,'② 1시간 뒤 R1046 겹 수 상한 (1분 '+m1.name+' → 1시간 '+h1.name+')');
ok(h1.d>0&&h1.d<=m1.d+20,'② 1시간 뒤 사슬 깊이 그대로 (1분 '+m1.d+' → 1시간 '+h1.d+')');
w.run(7200);const h3=w.call();ok(!h3.err&&h3.base===1&&h3.fix===h1.fix&&h3.name===h1.name,'① 3시간 뒤 그대로 ('+(h3.err?h3.err.message:JSON.stringify({fix:h3.fix,name:h3.name}))+')');
// 늦게 감싼 다른 HUD 덧씌우기가 와도 두 덧씌우기는 계속 동작
{const o=w.C.updateHUD;w.C.updateHUD=function(){return o.apply(this,arguments);};w.run(600);const r=w.call();ok(!r.err&&r.base===1&&r.fix>=1&&r.name>=1,'③ 늦은 덧씌우기 뒤에도 동작 ('+JSON.stringify({fix:r.fix,name:r.name})+')');}
ok(rd('../.github/workflows/pages.yml').includes('node r96/qa/r1196/hud-wrap-check.cjs'),'pages.yml 연결');
console.log(fails?'FAILED '+fails+'/'+n:'ALL PASS '+n);process.exit(fails?1:0);
