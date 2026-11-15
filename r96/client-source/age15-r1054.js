// R1054 — 15세 이용가 기본 연출 정책(사용자 2026-11-15 11:00Z "이거 15세용으로 받아야해서 조정어떻게 하면좋을까" + 표·체크리스트).
//  · 설정 토글이 아니라 기본값: 이 파일이 실리면 정책이 켜진다(저장값·설정 창으로 끌 수 없음). 스토리·무한생존·영화 모드가 같은 코드를 쓰므로
//    세 모드·숨겨진 챕터(사몽)·DLC·EGO 에 똑같이 걸린다.
//  · 정책을 읽는 쪽(정책 전역이 없으면 예전 그대로 — 단독 검사 환경 보존):
//    - mob-death-r462.js: 일반 몹 죽음 = 찢김·피 터짐·피 웅덩이·몸 사체 없이 검은 실루엣 → 어두운 연기·재로 소멸, 옅은 재 자국만 잠깐.
//    - fx-blood-r190.js: 피격 피 튐 작게·어둡게·드물게, 쓰러질 때 큰 피 터짐 없음.
//  · 판정·피해·보상·저장·AI·서사 문장은 바꾸지 않는다(그림만). 서사 문장 확인 목록은 docs/age15-audit.md.
//  · 검사 qa/r1054/age15-cpu-check.cjs.
(()=>{'use strict';
if(window.__STORYWORLD_AGE15_R1054__)return;
const REV='R1054-age15-1';
window.__STORYWORLD_AGE15_R1054__=Object.freeze({revision:REV,on:true,rating:'15',
 policy:Object.freeze({mobDeath:'ash',corpse:'ash-mark',hitBlood:'small-dark-sparse',deathBlood:false}),
 inspect(){const M=window.__STORYWORLD_MOB_DEATH_R462__,B=window.__STORYWORLD_BLOOD_R190__;
  let m=null,b=null;try{m=M&&M.inspect();}catch(_){}try{b=B&&B.inspect();}catch(_){}
  return{revision:REV,on:true,mobDeathStyle:m?m.style:null,mobDeathAge15:m?m.age15:null,blood:b?b.age15:null};}});
})();
