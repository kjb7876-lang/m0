// R1103 (사용자 2026-11-16 "공격할 때 직사각형 주황 계열 도형 느낌 투사체·공격 예고 없애 달라, 삭제"):
//  실측(헤드리스, 유리 망령 지역 ep1b03 등) — 몹이 공격할 때 바닥에 깔리던 주황 줄무늬 띠·직사각형·부채꼴은
//  ① FINAL42 '251-attack-warning-ring'(주황 고리 그림)을 엔진 공격 발자국(직선·부채꼴) 모양으로 잘라 바닥에 눕힌 것이다.
//     FINAL42 훅이 strokeFootprint154 의 'warning' 단계에서 그리는데, R98 이 범위 예고를 숨기려고 붙인 표시(r98Telegraph)를
//     FINAL42 가 자기 owner 로 바꿔 그리므로 숨김이 새어 화면에 남았다. 고리 테두리가 잘려 평행한 주황 띠로 보인다.
//  ② FINAL42 '260 charge-warning'(돌진 예고), ③ R98 바닥 발자국 도형(charge·impact·gather·burst 의 채우기·선 = 코드로 그린 직사각형·부채꼴).
//  → 3D 기록기(StoryPhase1.DrawCommands.push)에서 이 명령들만 기록하지 않는다. 판정·피해·시간·소리·몹 몸 그림·스킬 시트는 그대로.
//  R1103b(사용자 07:08 "지워"): 몹 근처에 보이던 작은 주황 삼각형 = R100 길잡이 바닥 화살표(쉐브론, rgba(255,214,140)) → 함께 지운다.
//     길잡이 나침반(HUD)·길찾기 계산은 그대로.
//  끄기(원래대로): localStorage storyworld.r1103.shapes = 'off' 또는 __STORYWORLD_WARNING_SHAPES_R1103__.set(false).
(function(){'use strict';
const KEY='storyworld.r1103.shapes',FALLBACK=[251,260];
let on=true;try{on=window.localStorage?.getItem(KEY)!=='off';}catch(_){}
const stats={dropped:0,final42:0,r98Ground:0,r98Tagged:0,navTrail:0};
function warningSet(){const out=new Set();try{const fx=window.__STORYWORLD_FINAL42_DATA_R88__?.effects;if(fx)for(const k of Object.keys(fx)){const s=fx[k];if(s&&s.kind==='warning'&&Number.isFinite(+s.sourceIndex))out.add(+s.sourceIndex);}}catch(_){}
 if(!out.size)for(const i of FALLBACK)out.add(i);return out;}
let WARN=null;const warn=()=>WARN||(WARN=warningSet());
function why(owner,kind){if(!owner)return null;
 if(owner.r98Telegraph===true)return 'r98Tagged';
 if(owner.r88Final42===true){const i=+owner.r88SourceIndex;if(Number.isFinite(i)&&warn().has(i))return 'final42';}
 if(owner.r98===true&&owner.kind==='hazard'&&(kind==='fill'||kind==='stroke'))return 'r98Ground';
 if(owner.id==='r100:nav'&&owner.kind==='hazard')return 'navTrail';
 return null;}
const P=window.StoryPhase1?.DrawCommands?.prototype;
if(P&&typeof P.push==='function'&&!P.__r1103Shapes){const base=P.push;
 P.push=function(kind,data){if(on){let w=null;try{w=why(this.owner,kind);}catch(_){}if(w){stats.dropped++;stats[w]++;return;}}return base.apply(this,arguments);};
 P.__r1103Shapes=true;}
function set(v){on=!!v;try{window.localStorage?.setItem(KEY,on?'on':'off');}catch(_){}return on;}
window.__STORYWORLD_WARNING_SHAPES_R1103__=Object.freeze({revision:'R1103',set,inspect:()=>({on,installed:!!P?.__r1103Shapes,warningIndices:[...warn()].sort((a,b)=>a-b),stats:{...stats}}),presentationOnly:true,gameplayChanged:false});
})();
