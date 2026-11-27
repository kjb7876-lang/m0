// R1329d 장면 캡처 save/restore 짝 보호(사용자 2026-11-27 08:48Z 거미동굴 보라검천사 앞 검은 화면).
// 증상: "Three.js 실행 실패 · PC 테스트를 중단합니다. (이유: Unbalanced original draw state)".
//  dist/phase1.js DrawCommands.finish 는 캡처가 끝날 때 save 가 하나라도 남아 있으면 던진다. 그리기 하나가 save 뒤 예외·이른 return 으로
//  restore 를 건너뛰면, 매 프레임 같은 일이 되풀이되어 R1228 다시 시작(1분 3번)도 넘기고 3D 가 멈춘다.
// 고침: finish 직전에 남은 save 를 모두 풀고(그 프레임의 명령은 이미 기록된 좌표 그대로) 정상으로 끝낸다.
//  어느 그리기가 짝을 깼는지 남기려고 save 마다 그때의 주인(scope owner id)을 함께 쌓고, 짝이 깨지면 주인 id 를
//  R1288 오류 기록(종류 three)에 남긴다. 같은 주인은 한 번만 남긴다. 처음 깨진 뒤 120 프레임 동안은 save 호출 위치(스택 6줄)도 함께 남긴다.
// 끄기: localStorage['storyworld.r1329d.drawBalance']='{"on":false}'. 점검: window.__STORYWORLD_DRAW_BALANCE_R1329D__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_DRAW_BALANCE_R1329D__)return;
const REV='R1329d-draw-balance-1',KEY='storyworld.r1329d.drawBalance',TRACE_FRAMES=120;
let on=true;try{const p=JSON.parse(window.localStorage?.getItem(KEY)||'{}');if(p&&p.on===false)on=false;}catch(_){}
const stats={wrapped:false,frames:0,leaks:0,unwound:0,logged:0};let last=null,traceLeft=0;const seen=new Set();
const D=window.StoryPhase1&&window.StoryPhase1.DrawCommands;
if(D&&D.prototype&&typeof D.prototype.finish==='function'&&!D.prototype.__r1329d){
 const P=D.prototype,save=P.save,restore=P.restore,finish=P.finish,reset=P.reset;
 P.reset=function(){this.__r1329dOwners=[];return reset.apply(this,arguments);};
 P.save=function(){const r=save.apply(this,arguments);try{const o=this.owner;(this.__r1329dOwners||(this.__r1329dOwners=[])).push({id:o&&o.id!=null?String(o.id):'?',
   at:traceLeft>0?String(new Error().stack||'').split('\n').slice(2,8).map(s=>s.trim()).join(' | '):null});}catch(_){}return r;};
 P.restore=function(){try{if(this.stack&&this.stack.length)this.__r1329dOwners?.pop();}catch(_){}return restore.apply(this,arguments);};
 P.finish=function(){stats.frames++;if(traceLeft>0)traceLeft--;
  if(on&&this.stack&&this.stack.length){const n=this.stack.length,owners=(this.__r1329dOwners||[]).slice(-n);stats.leaks++;
   last={depth:n,owners:owners.map(o=>o.id),at:owners.map(o=>o.at).filter(Boolean)};
   while(this.stack.length){restore.call(this);stats.unwound++;}this.__r1329dOwners=[];
   const k=last.owners.join(',')+(last.at.length?'#t':'');
   if(!seen.has(k)&&seen.size<40){seen.add(k);try{const E=window.__STORYWORLD_ERROR_LOG_R1288__;
    if(E&&typeof E.record==='function'){E.record('three',{message:'[R1329d] Unbalanced original draw state 풀어 줌 · 남은 save '+n+'개 · 주인 '+last.owners.join(', ').slice(0,300),stack:last.at.join('\n').slice(0,1500)});stats.logged++;}}catch(_){}}
   if(!last.at.length)traceLeft=TRACE_FRAMES;}
  return finish.apply(this,arguments);};
 Object.defineProperty(P,'__r1329d',{value:true});stats.wrapped=true;}
window.__STORYWORLD_DRAW_BALANCE_R1329D__=Object.freeze({revision:REV,
 set(v){on=!!v;try{window.localStorage?.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;},
 inspect:()=>({revision:REV,on,wrapped:stats.wrapped,frames:stats.frames,leaks:stats.leaks,unwound:stats.unwound,logged:stats.logged,tracing:traceLeft,last})});
})();
