// R1038 첫 화면 전 자가 진단 미루기 — 사용자 2026-11-14 "병원테스트같이 지금 안쓰는 기능 정리해서 보다 효율적이게 작동하도록".
//  엔진 boot() 끝의 selfTests() 는 플레이어에게 보이지 않는 개발용 자가검사(53항목)로, 지역을 여러 번 새로 만들어 부팅을 오래 붙잡는다
//  (헤드리스 실측: 첫 화면까지 26.1초 중 9.8초). 결과(browserChecks)는 진단 창·진단 JSON 에서만 쓴다.
//  하는 일: 부팅 때의 첫 호출 한 번만 건너뛰고, 진단 보고서(diagnostics)·진단 창(showDiagnostics)을 처음 열 때 그 자리에서 전부 돌린다.
//  하지 않는 일: 검사 항목 삭제·변경, 직접 호출(진단 창 '자가검사 다시 실행' 등) 건너뛰기, 게임 상태·저장·화면 변경.
//  되돌리기: localStorage 'storyworld.r1038.bootSelfTests'='1' 이면 예전처럼 부팅 때 돌린다.
(()=>{'use strict';
if(window.__STORYWORLD_BOOT_LEAN_R1038__)return;
if(typeof selfTests!=='function'||typeof diagnostics!=='function')return;
let eager=false;try{eager=localStorage.getItem('storyworld.r1038.bootSelfTests')==='1';}catch(_){}
const st={deferred:0,ran:0,pending:false};
const full=selfTests;
const runFull=function(...a){st.pending=false;st.ran++;return full.apply(this,a);};
let first=true;
selfTests=function(...a){
 // 부팅 때 첫 호출: 아직 게임을 시작하지 않았고(started=false) 부팅이 막 끝난 순간(booted=true)
 if(first&&!eager&&typeof started!=='undefined'&&!started&&typeof booted!=='undefined'&&booted){
  first=false;st.deferred++;st.pending=true;try{browserChecks=[];}catch(_){}return [];
 }
 first=false;return runFull.apply(this,a);
};
const ensure=()=>{if(st.pending){try{runFull();}catch(_){st.pending=false;}}};
const diag=diagnostics;
diagnostics=function(...a){ensure();return diag.apply(this,a);};
if(typeof showDiagnostics==='function'){const show=showDiagnostics;showDiagnostics=function(...a){ensure();return show.apply(this,a);};}
window.__STORYWORLD_BOOT_LEAN_R1038__=Object.freeze({rev:'R1038-1',state:()=>({...st,eager}),ensure});
})();
