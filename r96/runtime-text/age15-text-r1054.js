// R1054 — 15세 이용가 서사 순화(사용자 2026-11-15 11:18Z "4곳 모두 순화 암시정도로" — 서사 불변 규칙의 이번 예외, 사용자 허락).
//  원본 정본 파일(story-canon-r106-data.js · samong-text-r103.js · story-source/*.txt)은 그대로 두고, 게임이 읽기 전에(story-canon-r106.js 가
//  문단을 다른 데이터로 옮기기 전) 그 4문단만 같은 뜻의 암시 문장으로 바꿔 끼운다. 세 모드·숨겨진 챕터(사몽)가 같은 데이터를 쓰므로 모두 같이 바뀐다.
//  ① 1부 늪(dist02): '죽은 수호자들의 머리' → '쓰러진 수호자들이 남긴 흔적'
//  ② 1부 주사실(ep1a09): 약 이름·주사 행위·쾌감 서술 → 작은 약병, 유혹을 이기지 못함, 흐릿한 기억
//  ③ 사몽 R-09: 뼈 꺾기·피 나도록 뜯기·'자기 절단의 광경' → 몸을 구겨 넣고 이름 글자를 지움, '처참한 광경'
//  ④ 사몽 R-00: '손목 동맥을 가로지른 … 자해의 흉터' → '손목 안쪽에 오래된 흉터'
//  바뀐 문장은 녹음이 없어 서사 음성은 그 문장만 건너뛴다(녹음 없는 곳은 보류 규칙). 원문이 바뀌어 못 찾으면 건드리지 않고 missed 로 센다.
(()=>{'use strict';
if(window.__STORYWORLD_AGE15_TEXT_R1054__)return;
const REV='R1054-text-1',stats={applied:0,missed:0,errors:0},log=[];
const EDITS=[
 {at:['canon','dist02'],from:'하지만 물을 헤치며 조금 더 다가가고 나니 그제야 그 얼굴들을 알아볼 수 있었다. 그것들은 죽은 수호자들의 머리였다.',
  to:'하지만 물을 헤치며 조금 더 다가가고 나니 그제야 그것이 열매가 아니라는 것을 알 수 있었다. 그것들은 먼저 쓰러진 수호자들이 남긴 흔적이었다.'},
 {at:['canon','ep1a09'],multi:[
  ['서랍 깊은 곳에서 펜타닐이라고 적힌 약병을 찾았다. 나는 약의 이름을 보고도 그것이 무엇인지 제대로 생각하지 않았다.','서랍 깊은 곳에서 작은 약병을 찾았다. 나는 그것이 무엇인지 제대로 생각하지 않았다.'],
  ['나는 문을 잠근 채 끝내 주사기에 손을 대 버렸다. 이내 고통이 줄어들었다. 따뜻한 빛이 퍼지고, 천사가 나를 끌어안는 것 같은 감각이 들었다.','나는 문을 잠근 채 끝내 그 유혹을 이기지 못했다. 그 뒤의 일은 흐릿하다. 따뜻한 빛이 퍼지고, 천사가 나를 끌어안는 것 같은 감각만 남았다.']]},
 {at:['samong','R-09'],from:'원고지의 좁은 칸에 육신이 걸려 들어가지 않으면 스스로의 뼈를 꺾어 몸을 기형적으로 줄였고, 부모가 물려준 본명이 너무 길어 칸을 넘어가면 제 손으로 이름의 글자를 피가 나도록 뜯어 냈다. 내 앞의 한 사람은 자기 이름의 마지막 글자를 살점처럼 떼어 내다가, 차마 버리지 못하고 다시 가슴에 움켜쥐며 오열했다. 나는 그 참혹한 자기 절단의 광경을',
  to:'원고지의 좁은 칸에 육신이 걸려 들어가지 않으면 억지로 몸을 웅크려 구겨 넣었고, 부모가 물려준 본명이 너무 길어 칸을 넘어가면 제 손으로 이름의 글자를 지워 냈다. 내 앞의 한 사람은 자기 이름의 마지막 글자를 지우다가, 차마 버리지 못하고 다시 가슴에 움켜쥐며 오열했다. 나는 그 처참한 광경을'},
 {at:['samong','R-00'],from:'손목 동맥을 가로지른 깊고 오래된 자해의 흉터가 드러났다.',to:'손목 안쪽에 남은 오래된 흉터가 드러났다.'}];
function blocksOf(at){try{if(at[0]==='canon')return window.__STORYWORLD_STORY_CANON_R106__?.zones?.[at[1]]?.blocks||[];
 return window.__STORYWORLD_SAMONG_TEXT_R103__?.sections?.[at[1]]?.blocks||[];}catch(_){return[];}}
function apply(E){try{const pairs=E.multi||[[E.from,E.to]];let done=0;
 for(const b of blocksOf(E.at)){const P=b&&b.paras;if(!Array.isArray(P)||Object.isFrozen(P))continue;
  for(let i=0;i<P.length;i++){let t=P[i];if(typeof t!=='string')continue;for(const [a,z] of pairs)if(t.includes(a)){t=t.split(a).join(z);done++;}if(t!==P[i])P[i]=t;}}
 if(done>=pairs.length){stats.applied++;log.push(E.at.join(':'));}else{stats.missed++;log.push('missed '+E.at.join(':'));}}catch(e){stats.errors++;}}
// 정본(1부)은 지금 바로(story-canon-r106.js 가 옮기기 전). 사몽 원문은 이 파일 뒤에 실리므로 그 전역이 놓이는 순간 바꾼다(놓인 값은 그대로 돌려줌).
for(const E of EDITS)if(E.at[0]==='canon')apply(E);
const SK='__STORYWORLD_SAMONG_TEXT_R103__',samongEdits=EDITS.filter(E=>E.at[0]==='samong');
if(window[SK]){for(const E of samongEdits)apply(E);}
else{try{let v;Object.defineProperty(window,SK,{configurable:true,enumerable:true,get:()=>v,set:x=>{v=x;try{Object.defineProperty(window,SK,{value:x,writable:true,configurable:true,enumerable:true});}catch(_){}for(const E of samongEdits)apply(E);}});}
 catch(e){stats.errors++;}}
window.__STORYWORLD_AGE15_TEXT_R1054__=Object.freeze({revision:REV,inspect:()=>({revision:REV,...stats,log:[...log]})});
})();
