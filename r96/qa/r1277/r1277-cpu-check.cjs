// R1277 CPU 검사: 설정 '서사 음성 자동 재생'을 켜면 '음성 앞으로 끄기'(R1223, 따로 저장된 꺼짐)도 같이 켜져 서사 음성이 실제로 나온다.
//  사용자 2026-11-20 "페르소나 영웅으로 777코드로 플레이하는데 서사음성 다켰는데 서사음성안들리는 버그"(PC, 7대죄 맵).
//  헤드리스 실측: 새 판(777+페르소나+7대죄 붉은 하이힐)은 녹음 정상 → 저장된 R1223 꺼짐이 설정 칸 켜기와 따로 남아 모든 장면 음성을 막는 경로.
//  실행: node r96/qa/r1277/r1277-cpu-check.cjs
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const SRC=fs.readFileSync(path.join(__dirname,'../../client-source/memory-voice-r1223.js'),'utf8');
const res=[];const check=(n,ok,d='')=>{res.push({n,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+n+(d!==''?' :: '+d:''));};
function make(store){const LS={...store};
 const mk=(o={})=>({setAttribute(){},appendChild(){},addEventListener(t,f){(this.L=this.L||{})[t]=(this.L[t]||[]).concat(f);},fire(t){for(const f of (this.L?.[t]||[]))f({target:this});},...o});
 const narr=mk({checked:true,type:'checkbox'}),sound=mk({checked:true}),grid=mk();let panelOpen=false;
 const document={getElementById:id=>null,querySelectorAll:()=>[],head:null,createElement:()=>mk(),
  querySelector:s=>!panelOpen?null:s==='#panel .settings'?grid:s==='#panel input[data-setting="narration"]'?narr:s==='#panel input[data-setting="sound"]'?sound:null};
 const plays=[];const R381={has:()=>true,play:(t,o)=>{plays.push(t);return {id:'x',stop(){}};},stop(){},preload(){},inspect:()=>({playing:null})};
 const ctx={console,Math,JSON,Object,Array,String,Number,Error,Set,Map,RegExp,Event:function(t){this.type=t;},performance:{now:()=>0},
  localStorage:{getItem:k=>k in LS?LS[k]:null,setItem:(k,v)=>{LS[k]=String(v);}},setInterval(){},document,settings:{narration:true,voice:.8},storyScene:{key:'STORY:ep1b05:pre:r75',text:'붉은 문장이다.'},
  __STORYWORLD_VOICE_R381__:R381};
 ctx.window=ctx;ctx.showSettings=function(){panelOpen=true;};vm.createContext(ctx);
 vm.runInContext(SRC,ctx,{filename:'memory-voice-r1223.js'});const M=ctx.__STORYWORLD_MEMORY_VOICE_R1223__;
 return {M,ctx,LS,narr,sound,plays,open:()=>ctx.showSettings(),R:()=>ctx.__STORYWORLD_VOICE_R381__};}
// ① 저장된 꺼짐 + 설정 칸에서 '서사 음성 자동 재생'을 켬(체크) → 음성 켜짐·저장·장면 음성 나옴
{const T=make({'storyworld.r1223.memvoice':JSON.stringify({on:false})});T.M.step();
 check('① 전제: 저장된 꺼짐이면 장면 중 녹음이 막힘',T.R().play('a',{})===null);
 T.open();T.narr.checked=true;T.narr.fire('change');
 check('① 설정에서 서사 음성 자동 재생을 켜면 음성 앞으로 끄기도 켜짐',T.M.prefs().on===true);
 check('① 켜짐 저장',JSON.parse(T.LS['storyworld.r1223.memvoice']).on===true);
 check('① 이제 장면 녹음이 나옴',T.R().play('a',{})!==null);}
// ② 경계: 서사 음성 자동 재생을 끄면(체크 해제) R1223 은 건드리지 않음(그 자체로 이미 무음)
{const T=make({});T.M.step();T.open();T.narr.checked=false;T.narr.fire('change');check('② 끄기(체크 해제)는 음성 앞으로 끄기 저장을 바꾸지 않음',T.M.prefs().on===true&&!('storyworld.r1223.memvoice' in T.LS));}
// ③ 회귀: 다른 칸(효과음)을 바꾸면 R1223 그대로
{const T=make({'storyworld.r1223.memvoice':JSON.stringify({on:false})});T.M.step();T.open();T.sound.fire('change');check('③ 다른 설정 칸 변경은 음성 끄기를 안 바꿈',T.M.prefs().on===false);}
// ③ 회귀: 설정 창을 열기만 하면 그대로(사용자가 끈 상태 존중)
{const T=make({'storyworld.r1223.memvoice':JSON.stringify({on:false})});T.M.step();T.open();check('③ 설정 창 열기만으로는 꺼짐 유지',T.M.prefs().on===false);}
// ③ 회귀: 같은 설정 창을 두 번 열어도 감시가 두 번 붙지 않음
{const T=make({});T.M.step();T.open();T.open();check('③ 감시는 한 번만',(T.narr.L?.change||[]).length===1,String((T.narr.L?.change||[]).length));}
const failed=res.filter(r=>!r.ok).length;console.log(JSON.stringify({total:res.length,failed}));process.exit(failed?1:0);
