// R1244 덧붙임 CPU 검사: 사몽 각성 showAwakening 감싸기 겹침(헤드리스에서 찾은 기존 버그).
//  고치기 전: R1217(16ms 마다 '__r1217 표식이 맨 위에 없으면 다시 감쌈')과 R1046(500ms 마다 '__r1112 표식이 없으면 다시 감쌈')이
//  서로의 표식을 옮겨 달지 않아 1초에 약 2겹씩 끝없이 쌓였다(헤드리스 실측: 각성 1번에 R1217 감싸기 14→35→55번 실행, 10초 간격).
//  오래 플레이하면 각성 한 번에 수천 겹 → 렉, 결국 호출 깊이 초과로 각성 연출이 깨질 수 있다.
//  완료 조건: 실제 R1217 파일과 실제 R1046 wrapAwake 함수를 함께 60초(16ms·500ms 주기) 돌려도 감싸기가 고정(각 1겹), 각성 1번에 엔진 1번·R1217 1번.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const CS=path.resolve(__dirname,'..','..','client-source');
const results=[];const check=(name,ok,detail='')=>{results.push(!!ok);console.log((ok?'PASS ':'FAIL ')+name+(ok||detail===''?'':' :: '+String(detail).slice(0,300)));};
const s1217=fs.readFileSync(path.join(CS,'samong-stagger-r1217.js'),'utf8'),s1046=fs.readFileSync(path.join(CS,'ego-sovereign-r1046.js'),'utf8'),s1244=fs.readFileSync(path.join(CS,'cinema-cutin-r1244.js'),'utf8');
const m=/function wrapAwake\(\)\{if\(typeof showAwakening!=='function'\|\|showAwakening\.__r1112\)return;[\s\S]*?showAwakening=w;\}/.exec(s1046);
check('R1046 wrapAwake 함수를 찾음',!!m);
function run(with1244){const intervals=[];let engine=0;
 const sb={console,Math,JSON,Object,Array,Number,String,Date,Error,RegExp,performance:{now:()=>0},localStorage:{getItem:()=>null,setItem(){}},
  setInterval:(f,ms)=>{intervals.push({f,ms,next:ms});return intervals.length;},clearInterval(){},setTimeout:()=>0,clearTimeout(){},
  fx:function(){},player:{hero:'neon'},heroArt:{neon:{awakening:'a'}},time:0};
 sb.window=sb;sb.showAwakening=function(){engine++;sb.fx('sigil');};
 vm.createContext(sb);vm.runInContext(s1217,sb);
 vm.runInContext('(()=>{const formActive=()=>false,rc=()=>null,P={base:"hwando",cutin:{image:"x"}},hasDoc=()=>false,stats={},url=x=>x,fail=()=>{},AWAKE_NAME="EGO";'+m[0]+';setInterval(wrapAwake,500);wrapAwake();})()',sb);
 if(with1244){sb.addEventListener=()=>{};vm.runInContext(s1244,sb);}
 for(let t=0;t<60000;t+=16)for(const iv of intervals)if(t>=iv.next){iv.next+=iv.ms;try{iv.f();}catch(_){}}
 const S=sb.__STORYWORLD_SAMONG_STAGGER_R1217__;const s0=S.inspect().stats.shows;sb.showAwakening('play');
 return {engine,r1217:S.inspect().stats.shows-s0};}
const a=run(false);check('60초 뒤 각성 1번: 엔진 1번·R1217 감싸기 1번(겹침 없음)',a.engine===1&&a.r1217===1,JSON.stringify(a));
const b=run(true);check('R1244 까지 함께여도 겹침 없음',b.engine===1&&b.r1217===1,JSON.stringify(b));
const failed=results.filter(x=>!x).length;console.log(JSON.stringify({total:results.length,failed}));process.exit(failed?1:0);
