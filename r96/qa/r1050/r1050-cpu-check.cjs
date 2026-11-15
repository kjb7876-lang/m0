'use strict';
// R1050 CPU 검사 — 무한 생존 배치 영웅 공격 모션(사용자 2026-11-15 09:56Z "무한생존모드에서 영웅배치시 배치된영웅 공격모션이 안나가는 문제 개선").
//  원인: 배치 영웅 AI(think)가 공격 중에도 매 장면 표적을 쫓아 조금씩 움직여, 영웅 그리기 사슬(R119 걷기·R895 규칙)이 '걷는 중'으로 보고 공격 그림 대신 걷기 그림을 그렸다.
//  고침: 몸이 공격·스킬 동작 중(planted)이면 그 동작 동안 제자리에 선다(표적·사거리 판정은 그대로).
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,x)=>{n++;if(!c){bad++;console.log('FAIL',m,x===undefined?'':JSON.stringify(x));}else console.log('ok  ',m);};
const NAME='hero-defense-r720.js',src=fs.readFileSync(path.join(R,'client-source',NAME),'utf8');
const sb={console,Math,JSON,Number,Object,Array,String,Set,Map,WeakMap,Proxy,structuredClone:globalThis.structuredClone,
 localStorage:{getItem:()=>null,setItem(){}},document:{querySelector:()=>null,getElementById:()=>null,createElement:()=>({style:{}})},addEventListener(){},setInterval:()=>({unref(){}})};
sb.window=sb;vm.createContext(sb);vm.runInContext(src,sb,{filename:NAME});
const D=sb.__STORYWORLD_HERO_DEFENSE_R720__,P=D&&D.pure;
ok(!!P&&typeof P.think==='function','pure.think 공개');
ok(!!P&&typeof P.planted==='function','pure.planted 공개(공격·스킬 동작 중 제자리 판정)');
const planted=P&&P.planted||(()=>undefined);
// 경계값
ok(planted({attackAnim:.25})===true,'기본 공격 동작 중 → 제자리');
ok(planted({attackAnim:1e-6})===true,'동작 끝 직전(아주 작은 값)도 제자리');
ok(planted({skillAnim:.4})===true,'스킬 동작 중 → 제자리');
ok(planted({ultimateAnim:.6})===true,'궁극기 동작 중 → 제자리');
ok(planted({attackAnim:0,skillAnim:0})===false,'동작 없음 → 움직일 수 있음');
ok(planted({attackAnim:-.1})===false,'음수 → 움직일 수 있음');
ok(planted({attackAnim:NaN})===false&&planted({attackAnim:Infinity})===false&&planted({attackAnim:'x'})===false,'NaN·Infinity·문자 → 움직일 수 있음(값 오염에 묶이지 않음)');
ok(planted(null)===false&&planted(undefined)===false,'몸 없음 → false');
// think: 제자리(hold)
const st={range:3.15,radius:2.4,melee:true,interval:.6,targets:1};
const mk=()=>({x:10,y:10,cd:0});const anchor={x:10,y:10};
{const a=mk(),e={x:12.5,y:10.2,hp:10};const o=P.think(a,[e],.05,st,anchor,{engaged:true,hold:true});
 ok(a.x===10&&a.y===10&&o.moved===false,'공격 동작 중(hold): 움직이는 적을 쫓지 않고 제자리',{a,o:{moved:o.moved}});
 ok(o.target===e,'제자리여도 표적은 그대로(다음 공격·방향 판정용)');}
// 회귀: hold 없으면 예전처럼 쫓아간다
{const a=mk(),e={x:14,y:10,hp:10};const o=P.think(a,[e],.05,st,anchor,{engaged:true});
 ok(a.x>10&&o.moved===true,'동작 없을 땐 예전처럼 표적 쪽으로 걷는다',{a,moved:o.moved});}
{const a=mk(),e={x:14,y:10,hp:10};const o=P.think(a,[e],.05,st,anchor,{engaged:true,hold:false});
 ok(a.x>10&&o.moved===true,'hold:false 도 예전 그대로');}
{const a=mk();const o=P.think(a,[],.05,st,anchor,{engaged:true,hold:true});ok(a.x===10&&o.moved===false&&o.target===null,'적 없음 + hold: 그대로');}
// 경계: hold 중에도 이동 반경 밖이면 반경 안으로 묶는다, NaN 위치는 자리로
{const a={x:20,y:10,cd:0};P.think(a,[],.05,st,anchor,{engaged:true,hold:true});ok(Math.abs(Math.hypot(a.x-10,a.y-10)-st.radius)<1e-9,'hold 중에도 이동 반경 안으로 묶음',a);}
{const a={x:NaN,y:NaN,cd:0};P.think(a,[],.05,st,anchor,{hold:true});ok(a.x===10&&a.y===10,'NaN 위치는 자리로(그리기 NaN 방지)',a);}
// 엔진 연결: step 이 몸의 동작 상태를 think 에 넘긴다
ok(/think\(a,[^)]*hold:\s*planted\(b\)/.test(src),'step 이 think 에 hold:planted(b) 를 넘김');
ok(/wasPlanted=planted\(b\)/.test(src)&&/o\.moved&&!wasPlanted&&planted\(b\)/.test(src),'공격을 막 시작한 장면의 걸음은 무른다(걷기 꼬리 방지)');

// ── 갈팡질팡 방지(사용자 2026-11-15 11:12Z "영웅들도" — R1053 적 규칙과 같은 원칙) ──
// ② 표적 고정: 지금 표적이 살아 있고 닿는 거리면, 새 적이 조금 더 가깝다고 바꾸지 않는다
{const a=mk(),e1={x:12,y:10,hp:10},e2={x:10,y:11.9,hp:10};P.think(a,[e1],.05,st,anchor,{engaged:true});a.x=10;a.y=10;
 const o=P.think(a,[e1,e2],.05,st,anchor,{engaged:true});ok(o.target===e1,'표적 고정: 새 적이 0.1칸 가까워도 그대로',{t:o.target===e2?'e2':'e1'});}
{const a=mk(),e1={x:12.6,y:10,hp:10},e2={x:10.6,y:10,hp:10};P.think(a,[e1],.05,st,anchor,{engaged:true});a.x=10;a.y=10;
 const o=P.think(a,[e1,e2],.05,st,anchor,{engaged:true});ok(o.target===e2,'표적 고정 경계: 새 적이 훨씬 가까우면(1.4칸 넘게) 바꾼다',{t:o.target===e2?'e2':'e1'});}
{const a=mk(),e1={x:12,y:10,hp:10},e2={x:12.1,y:10,hp:10};P.think(a,[e1],.05,st,anchor,{engaged:true});e1.hp=0;
 const o=P.think(a,[e1,e2],.05,st,anchor,{engaged:true});ok(o.target===e2,'회귀: 표적이 죽으면 다음 적으로');}
// ② 거리 히스테리시스: 멈춘 자리에서 표적이 조금(0.5칸) 멀어져도 다시 걷지 않는다, 많이(1칸) 멀어지면 다시 붙는다
{const stM={...st,radius:4};const a=mk(),e={x:11.2,y:10,hp:10};P.think(a,[e],.05,stM,anchor,{engaged:true});const x0=a.x;
 e.x=11.2+.5;const o=P.think(a,[e],.05,stM,anchor,{engaged:true});ok(a.x===x0&&o.moved===false,'히스테리시스: 0.5칸 멀어져도 제자리',{x0,x:a.x});
 e.x=11.2+1.2;const o2=P.think(a,[e],.05,stM,anchor,{engaged:true});ok(a.x>x0&&o2.moved===true,'히스테리시스 경계: 1.2칸 멀어지면 다시 붙음',{x0,x:a.x});}
{const a=mk(),e={x:16,y:10,hp:10};const o=P.think(a,[e],.05,{...st,radius:6},anchor,{engaged:true});ok(o.moved===true,'회귀: 처음 먼 표적엔 걸어간다');}
// ① 대상 쪽 보기(좌우 무감대)
const F=P.faceToward;ok(typeof F==='function','pure.faceToward 공개');
if(typeof F==='function'){
 ok(F('right',-3,3)==='left','적이 확실히 왼쪽이면 왼쪽을 본다');
 ok(F('right',-.1,.1)==='right','무감대 안(화면 가로 0.4칸 미만)에선 지금 좌우 유지');
 ok(F('left',.1,-.1)==='left','무감대 안 반대쪽도 유지');
 ok(F('front',2,2)==='front'&&F('back',-2,-2)==='back','위·아래는 그대로 고른다');
 ok(F('right',NaN,1)==='right'&&F('left',Infinity,0)==='left'&&F(undefined,NaN,NaN)==='front','NaN·Infinity 는 지금 방향(없으면 front)');}
ok(/faceToward\(/.test(src.slice(src.indexOf('function step'))),'step 이 표적 쪽으로 몸 방향을 돌린다');

// ② 꼼지락 방지: 표적이 이동 반경 밖이라 가장자리에 붙었으면 0.05칸 미만으로는 걷지 않는다
{const stR={...st,radius:1};const a={x:11,y:10,cd:0},e={x:13.5,y:10.3,hp:10};const o=P.think(a,[e],.05,stR,anchor,{engaged:true});
 ok(o.moved===false&&a.x===11&&a.y===10,'반경 가장자리에서 반경 밖 표적 쪽으로 꼼지락대지 않음',{a,moved:o.moved});}
{const stR={...st,radius:1};const a={x:10,y:10,cd:0},e={x:13.5,y:10,hp:10};const o=P.think(a,[e],.05,stR,anchor,{engaged:true});ok(o.moved===true&&a.x>10,'회귀: 가장자리 전이면 표적 쪽으로 걷는다');}
// 화면 좌우 판정(최종 그림 기준): 시트 방향 + 뒤집힘
const S=P.sideOf;ok(typeof S==='function','pure.sideOf 공개');
if(typeof S==='function'){ok(S('r143/attack/neon/attack-e.webp',false)==='right'&&S('r143/attack/neon/attack-e.webp',true)==='left','e 시트: 그대로 오른쪽, 뒤집으면 왼쪽');
 ok(S('r351/slayer/attack-w.webp',false)==='left'&&S('r130/neon/walk-ne.webp',true)==='left'&&S('r425/hunter/attack-r.webp',false)==='right'&&S('r1045/gunner/attack-e3.webp',false)==='right','w·ne·r·e3 방향 읽기');
 ok(S('r143/attack/neon/attack-s.webp',false)===null&&S('r130/neon/walk-n.webp',true)===null&&S('',false)===null&&S(null,false)===null,'위·아래·모름은 null(좌우 잠금에 안 씀)');}
const H=P.sideHold;ok(typeof H==='function','pure.sideHold 공개');
if(typeof H==='function'){const s0={side:null,at:-9};
 ok(H(s0,'right',1)===false&&s0.side==='right','처음 좌우는 받아들임');
 ok(H(s0,'left',1.1)===true&&s0.side==='right','0.5초 안 반대쪽은 되돌림(뒤집지 않음)');
 ok(H({side:'right',at:1},'left',1.55)===true,'0.55초 뒤 반대쪽도 아직 되돌림');ok(H(s0,'left',1.6)===false&&s0.side==='left','0.6초 지나면 바꿈');
 ok(H(s0,null,1.65)===false&&s0.side==='left','null 은 그대로');
 ok(H(s0,'left',NaN)===false,'시간 NaN 이면 되돌리지 않음');}
ok(/sideHold\(/.test(src.slice(src.indexOf('function drawAlly'))),'배치 영웅 그리기가 좌우 잠금을 쓴다');
console.log(`\nR1050 CPU ${n-bad}/${n}`);process.exit(bad?1:0);
