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
console.log(`\nR1050 CPU ${n-bad}/${n}`);process.exit(bad?1:0);
