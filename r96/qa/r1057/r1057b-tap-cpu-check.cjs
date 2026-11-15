'use strict';
// R1057b 모바일 대안: 영웅 선택창 제목을 1.5초 간격 안에 7번 연속 탭 → 777 과 같은 효과(사용자 2026-11-15 13:18Z 승인 "응").
//  정상: 제목(#panel h2) 7연타 발동. 경계: 6번은 안 됨, 간격 1.5초는 인정·1.501초는 처음부터. 회귀: 다른 곳 탭 끼면 처음부터,
//  영웅창 밖(창 닫힘·다른 창 제목)은 무시, 이미 비밀 상태면 해금 1번, NaN 시각에도 안 던짐, 키보드 777 은 그대로.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d).slice(0,240):'');}else console.log('ok  ',m);};
const src=fs.readFileSync(path.join(R,'client-source','ego-secret-r1057.js'),'utf8');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1057/r1057b-tap-cpu-check.cjs'),'pages.yml CPU 검사 줄');
function cls(){const s=new Set();return{add:(...a)=>a.forEach(x=>s.add(x)),remove:(...a)=>a.forEach(x=>s.delete(x)),contains:x=>s.has(x)};}
function stage(opt={}){
 const D={modalHidden:false,kind:'start',clicks:0,unlocks:[],head:[]};Object.assign(D,opt);
 const egoCard={classList:cls(),click(){D.clicks++;this.classList.add('selected');}};
 const panel={classList:cls(),querySelector(sel){if(sel.includes('[data-ego-r1046]'))return egoCard;if(D.kind==='start'&&/#heroRowR101 \[data-hero\]/.test(sel))return{};if(D.kind==='change'&&/#chooseHero/.test(sel))return{};return null;},querySelectorAll(){return[];}};
 const modal={classList:cls()};if(D.modalHidden)modal.classList.add('hidden');
 const doc={getElementById:id=>id==='r1057Css'?(D.head.find(e=>e.id==='r1057Css')||null):({panel,modal}[id]||null),createElement:tag=>({tagName:tag}),head:{appendChild:e=>D.head.push(e)}};
 const L=[];const sb={console,JSON,Date,Set,Map,WeakMap,Object,Array,Number,String,Boolean,Symbol,Error,Math,Promise,isFinite,setTimeout:()=>0,setInterval:()=>0,document:doc,performance:{now:()=>D.now??0},addEventListener:(type,fn,cap)=>L.push({type,fn,cap})};
 sb.window=sb;sb.__STORYWORLD_EGO_SOVEREIGN_R1046__={unlocked:()=>D.unlocks.length>0,unlock:r=>{D.unlocks.push(r);return true;},refresh(){}};
 vm.createContext(sb);vm.runInContext(src,sb);const A=sb.__STORYWORLD_EGO_SECRET_R1057__;
 const title={tagName:'H2',closest:s=>/#panel h2/.test(s)&&D.titleInPanel!==false?title:null};
 const other={tagName:'BUTTON',closest:()=>null};
 const fireT=(type,ev,tm)=>{D.now=tm;for(const l of L.filter(l=>l.type===type))l.fn(ev);};
 const tap=(tm,target=title)=>fireT('click',{type:'click',target},tm);
 const key=(tm)=>fireT('keydown',{type:'keydown',key:'7',code:'Digit7',repeat:false,target:{tagName:'BODY'}},tm);
 return{D,A,tap,key,other,L};}
{const {L}=stage();ok(L.some(l=>l.type==='click'&&l.cap===true),'click 캡처 단계 듣기(터치 탭도 click 으로 옴)');}
{const {D,A,tap}=stage();for(let i=0;i<6;i++)tap(i*300);ok(D.unlocks.length===0,'경계: 6번 탭은 발동 안 함');tap(1800);ok(D.unlocks.length===1&&A.inspect().active,'정상: 제목 7연타 발동',A.inspect());A.poll();ok(D.clicks===1,'EGO 칸 자동 선택');}
{const {D,tap}=stage();for(let i=0;i<7;i++)tap(i*1500);ok(D.unlocks.length===1,'경계: 간격 정확히 1.5초는 인정');}
{const {D,tap}=stage();for(let i=0;i<6;i++)tap(i*100);tap(500+1501);ok(D.unlocks.length===0,'경계: 1.501초 끊기면 처음부터');for(let i=1;i<7;i++)tap(2001+i*100);ok(D.unlocks.length===1,'끊긴 탭이 새 첫 칸 → 6번 더 탭하면 발동');}
{const {D,tap,other}=stage();for(let i=0;i<4;i++)tap(i*100);tap(450,other);for(let i=0;i<3;i++)tap(500+i*100);ok(D.unlocks.length===0,'회귀: 다른 곳 탭이 끼면 처음부터');}
{const {D,tap}=stage({modalHidden:true});for(let i=0;i<7;i++)tap(i*100);ok(D.unlocks.length===0,'회귀: 창 닫힘이면 무시');}
{const {D,tap}=stage({kind:'none'});for(let i=0;i<7;i++)tap(i*100);ok(D.unlocks.length===0,'회귀: 영웅창이 아닌 창 제목은 무시');}
{const {D,tap}=stage({kind:'change'});for(let i=0;i<7;i++)tap(i*100);ok(D.unlocks.length===1,'거점 영웅 변경 창 제목도 발동');}
{const {D,tap}=stage();for(let i=0;i<14;i++)tap(i*100);ok(D.unlocks.length===1,'14연타: 해금 호출 1번');}
{const {D,tap}=stage();let threw=false;try{for(let i=0;i<7;i++)tap(NaN);}catch(_){threw=true;}ok(!threw&&D.unlocks.length===0,'NaN 시각: 안 던지고 발동 안 함');}
{const {D,key}=stage();key(0);key(100);key(200);ok(D.unlocks.length===1,'회귀: 키보드 777 은 그대로 발동');}
console.log(`\nR1057b tap CPU: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
