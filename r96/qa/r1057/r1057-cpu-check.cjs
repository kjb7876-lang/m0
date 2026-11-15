'use strict';
// R1057 영웅 선택창 비밀 입력 777 → 모든 영웅 칸이 사라지고 히든 영웅 EGO 칸만 남아 고를 수 있음(사용자 2026-11-15 11:57Z).
//  ① 빌드 연결(사본·태그 위치·verify 목록·pages.yml·manifest)
//  ② 키 판정: 숫자열 7(Digit7)·텐키 7(Numpad7, NumLock 꺼짐 포함)·R291 이 key 를 바꿔도 code 로 인정, Shift/Ctrl/Alt 낀 7·자동 반복·입력칸은 무시
//  ③ 순서: 7·7·7 연속(간격 1.5초 이하)만 발동, 1.5초 초과·다른 키 끼면 처음부터, 수정 키 단독은 초기화 안 함, NaN 시각에도 던지지 않음
//  ④ 영웅창 밖(창 닫힘·다른 창)에서는 세지 않음(전투 중 E 스킬 7 과 안 겹침)
//  ⑤ 발동: S-07 해금 여부와 상관없이 EGO 해금 + #panel 에 비밀 class(다른 영웅 칸 숨김 CSS) + EGO 칸 자동 선택 1회, 창이 닫히면 원래대로
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d).slice(0,240):'');}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const N='ego-secret-r1057.js';
// ① 빌드 연결
const html=rd(path.join(R,'runtime-text/index.html')),man=rd(path.join(R,'runtime-manifest.json')),inp=rd(path.join(R,'runtime-inputs.json'));
const src=rd(path.join(R,'client-source',N));
ok(src.length>0,N+' 존재');ok(src.length>0&&rd(path.join(R,'runtime-text',N))===src,N+' runtime-text 사본 = client-source');
ok(rd(path.join(ROOT,'scripts/verify-r96-public.py')).includes("'"+N+"'"),N+' verify-r96-public.py 기대 목록');ok(man.includes(N)&&inp.includes(N),N+' runtime-manifest·inputs');
const t=x=>html.indexOf('<script src="./'+x+'"></script>');
ok(t(N)>t('ego-sovereign-r1046.js')&&t('ego-sovereign-r1046.js')>0&&t(N)<t('boot-lean-r1038.js'),'index.html: ego-sovereign-r1046 뒤, boot-lean-r1038 앞');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1057/r1057-cpu-check.cjs'),'pages.yml CPU 검사 줄');
if(!src){console.log(`\nR1057 CPU: ${n-bad}/${n} 통과`);process.exit(1);}

// 작은 가짜 DOM
function cls(){const s=new Set();return{add:(...a)=>a.forEach(x=>s.add(x)),remove:(...a)=>a.forEach(x=>s.delete(x)),contains:x=>s.has(x),toggle:(x,v)=>{const on=v===undefined?!s.has(x):!!v;on?s.add(x):s.delete(x);return on;},_s:s};}
function stage(opt={}){
 const D={modalHidden:false,kind:'start',ego:true,egoSelected:false,clicks:0,unlocks:[],head:[]};Object.assign(D,opt);
 const egoCard={classList:cls(),click(){D.clicks++;this.classList.add('selected');D.egoSelected=true;}};
 const panel={classList:cls(),querySelector(sel){
   if(sel.includes('[data-ego-r1046]'))return D.ego&&D.kind!=='none'?egoCard:null;
   if(D.kind==='start'&&/#heroRowR101 \[data-hero\]/.test(sel))return{};
   if(D.kind==='change'&&/#chooseHero/.test(sel))return{};
   return null;},querySelectorAll(){return[];}};
 const modal={classList:cls()};if(D.modalHidden)modal.classList.add('hidden');
 const els={panel,modal};
 const doc={getElementById:id=>id==='r1057Css'?(D.head.find(e=>e.id==='r1057Css')||null):(els[id]||null),createElement:tag=>({tagName:tag,id:'',textContent:''}),head:{appendChild:e=>D.head.push(e)},
  querySelector:()=>null,addEventListener(){},readyState:'complete'};
 const L=[];const win={addEventListener:(type,fn,cap)=>L.push({type,fn,cap})};
 const sb={console,JSON,Date,Set,Map,WeakMap,Object,Array,Number,String,Boolean,Symbol,Error,Math,Promise,isFinite,setTimeout:()=>0,setInterval:()=>0,clearTimeout(){},document:doc,performance:{now:()=>D.now??0}};
 Object.assign(sb,win);sb.window=sb;
 sb.__STORYWORLD_EGO_SOVEREIGN_R1046__={unlocked:()=>D.unlocks.length>0||!!D.pre,unlock:r=>{D.unlocks.push(r);return true;},refresh:()=>{D.refreshed=(D.refreshed||0)+1;}};
 vm.createContext(sb);vm.runInContext(src,sb,{filename:N});
 const A=sb.__STORYWORLD_EGO_SECRET_R1057__;
 const key=(o,tm)=>{D.now=tm;const ev=Object.assign({type:'keydown',key:'7',code:'Digit7',repeat:false,shiftKey:false,ctrlKey:false,altKey:false,metaKey:false,target:{tagName:'BODY'}},o);for(const l of L.filter(l=>l.type==='keydown'))l.fn(ev);};
 return{D,A,key,panel,egoCard,modal,L};}

{const {A,L}=stage();ok(!!A&&typeof A.inspect==='function','API __STORYWORLD_EGO_SECRET_R1057__');ok(L.some(l=>l.type==='keydown'&&l.cap===true),'keydown 캡처 단계 듣기(R291 키 바꾸기와 무관하게 code 로 읽음)');}
// ② 키 판정
{const {A}=stage();const k=A.isSeven;
 ok(k({key:'7',code:'Digit7'}),'숫자열 7');ok(k({key:'7',code:'Numpad7'}),'텐키 7');ok(k({key:'Home',code:'Numpad7'}),'텐키 7(NumLock 꺼짐)');
 ok(k({key:'x',code:'Digit7'}),'R291 이 key 를 x 로 바꿔도 code Digit7 이면 7');ok(k({key:'7',code:''}),'code 없는 환경에서 key 7');
 ok(!k({key:'&',code:'Digit7',shiftKey:true}),'Shift+7(&) 은 아님');ok(!k({key:'7',code:'Digit7',ctrlKey:true}),'Ctrl+7 은 아님');ok(!k({key:'6',code:'Digit6'}),'6 은 아님');ok(!k({key:'x',code:'KeyX'}),'X 키는 아님');ok(!k(null),'null 안전');}
// ③ 순서
{const {D,A,key}=stage();key({},0);key({},400);ok(D.unlocks.length===0,'7·7 두 번은 발동 안 함');key({},800);ok(D.unlocks.length===1&&A.inspect().active===true,'7·7·7 (0.4초 간격) 발동',A.inspect());}
{const {D,key}=stage();key({},0);key({},1500);key({},3000);ok(D.unlocks.length===1,'경계: 간격 정확히 1.5초는 인정');}
{const {D,key}=stage();key({},0);key({},1000);key({},2501);ok(D.unlocks.length===0,'경계: 1.501초 끊기면 처음부터(발동 안 함)');key({},2900);key({},3300);ok(D.unlocks.length===1,'끊긴 뒤 다시 7·7·7 이면 발동(끊긴 7 이 새 첫 칸)');}
{const {D,key}=stage();key({},0);key({},200);key({key:'8',code:'Digit8'},300);key({},400);ok(D.unlocks.length===0,'다른 키(8) 끼면 처음부터');key({},600);key({},800);ok(D.unlocks.length===1,'초기화 뒤 7·7·7 발동');}
{const {D,key}=stage();key({},0);key({key:'Shift',code:'ShiftLeft'},100);key({},200);key({},300);ok(D.unlocks.length===1,'Shift 단독은 초기화 안 함');}
{const {D,key}=stage();key({},0);key({repeat:true},50);key({repeat:true},90);ok(D.unlocks.length===0,'7 길게 눌러 자동 반복은 세지 않음');}
{const {D,key}=stage();key({target:{tagName:'INPUT'}},0);key({target:{tagName:'INPUT'}},100);key({target:{tagName:'INPUT'}},200);ok(D.unlocks.length===0,'입력칸 안 7 은 무시(777 코드창과 안 겹침)');}
{const {D,key}=stage();let threw=false;try{key({},NaN);key({},NaN);key({},NaN);}catch(_){threw=true;}ok(!threw,'NaN 시각에도 던지지 않음');}
// ④ 영웅창 밖
{const {D,key}=stage({modalHidden:true});key({},0);key({},100);key({},200);ok(D.unlocks.length===0,'창 닫힘(전투 중): 7·7·7 무시 — E 스킬과 안 겹침');}
{const {D,key}=stage({kind:'none'});key({},0);key({},100);key({},200);ok(D.unlocks.length===0,'영웅창이 아닌 창: 무시');}
{const {D,A,key}=stage({kind:'change'});key({},0);key({},100);key({},200);ok(D.unlocks.length===1&&A.inspect().active,'거점 영웅 변경 창(#chooseHero)에서도 발동');}
// ⑤ 발동 결과
{const {D,A,key,panel}=stage();key({},0);key({},100);key({},200);A.poll();
 ok(D.unlocks[0]==='secret-777','S-07 해금 없이도 unlock("secret-777")',D.unlocks);
 ok(panel.classList.contains('r1057secret'),'#panel 에 r1057secret class');
 const css=D.head.find(e=>e.id==='r1057Css');ok(!!css&&/#panel\.r1057secret[^{]*\[data-hero\][^{]*\{[^}]*display:\s*none/.test(css.textContent),'CSS: 비밀 상태에서 [data-hero] 칸 숨김',css&&css.textContent);
 ok(!!css&&/#panel\.r1057secret button\[data-hero\]/.test(css.textContent)&&!/#panel\.r1057secret \[data-hero\]/.test(css.textContent),'CSS: 영웅 칸(button)만 숨김 — R263 무대(#r263Stage 의 data-hero 속성)는 남김(회귀)');
 ok(!!css&&!/\[data-ego-r1046\][^{]*\{[^}]*display:\s*none/.test(css.textContent),'CSS: EGO 칸은 숨기지 않음');
 ok(D.clicks===1&&D.egoSelected,'EGO 칸 자동 선택 1회');A.poll();A.poll();ok(D.clicks===1,'이미 고른 뒤엔 다시 누르지 않음');
 ok(D.refreshed>0,'R1046 칸 즉시 다시 그리기 요청(refresh)');
 D.modalHidden=true;D.ego=false;}
{const {D,A,key,panel,modal}=stage();key({},0);key({},100);key({},200);A.poll();modal.classList.add('hidden');A.poll();ok(!panel.classList.contains('r1057secret')&&!A.inspect().active,'창이 닫히면 비밀 상태·class 해제(다른 창에서 칸 안 숨김)');}
{const {D,A,key}=stage({ego:false});key({},0);key({},100);key({},200);A.poll();ok(D.clicks===0&&A.inspect().active,'EGO 칸이 아직 없으면 기다림(던지지 않음)');D.ego=true;A.poll();ok(D.clicks===1,'칸이 생기면 그때 선택');}
{const {D,A,key}=stage();for(let i=0;i<6;i++)key({},i*100);ok(D.unlocks.length===1,'777777: 이미 비밀 상태면 한 번만 해금 호출');}
console.log(`\nR1057 CPU: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
