// R1351 칼날 화면 보정(deflect) 연속성 — 정적·순수 함수 검사. Codex #1039 P2: 손목 보정 뒤 clearView 가 칼을 원뿔 반대편으로 넘겨 46° 튐.
//  ① 재현: ref 없이(예전 방식) 축에서 0.2° 옆을 스치는 휘두름 → 0.25° 걸음에 30° 넘게 튐.
//  ② 고침: follow(앞 프레임 결과 prev, 한 걸음 6°)로 같은 휘두름(축을 정확히 지나는 것 포함)에서 걸음당 변화 ≤ 6.5°, 결과는 늘 축에서 34° 이상(칼이 화면에서 사라지지 않음),
//     휘두름이 끝나 칼이 원뿔 밖으로 나가면 늦어진 결과가 다시 원래 칼날을 따라잡는다(끝 오차 < 1°).
//  ③ 경계: 이미 34° 넘게 벌어진 칼날은 그대로, prev 가 축과 나란함·NaN → 유한한 값. ④ 줄: 앞 프레임 결과를 몸 좌표로 기억(s.vPrev), 손목 → 화면(손목 조건도 함께, 이어짐). ⑤ 아래팔 조건을 함께 넣은 follow.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const F='hero-stance-3d-r1320.js',src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
ok(src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8'),'오버레이 원본 = runtime-text 사본');
const win={};const sb={window:win,localStorage:{getItem:()=>null,setItem(){}},setInterval(){},Number,Math,Object,String,Array,JSON,RegExp,console,isFinite};
vm.createContext(sb);vm.runInContext(src,sb,{filename:F});const api=win.__STORYWORLD_HERO_STANCE_R1320__,P=api.pure;
ok(/^R1351/.test(api.inspect().revision),'R1351 판 ('+api.inspect().revision+')');
const D=Math.PI/180,cam=[0,-Math.SQRT1_2,-Math.SQRT1_2],up=[0,Math.SQRT1_2,-Math.SQRT1_2];
const ang=(a,b)=>Math.acos(Math.max(-1,Math.min(1,a[0]*b[0]+a[1]*b[1]+a[2]*b[2])))/D,fin=a=>a.every(Number.isFinite);
const sweep=(miss,useRef)=>{let prev=null,ref,worst=0,minAx=180,d;for(let t=-40;t<=60;t+=.25){d=[Math.sin(t*D),cam[1]*Math.cos(t*D),cam[2]*Math.cos(t*D)].map((x,i)=>x+up[i]*Math.sin(miss*D));const n=Math.hypot(...d);d=d.map(x=>x/n);
 const r=useRef?P.follow(d,cam,34*D,ref,6*D):P.deflect(d,cam,34*D);ref=r;minAx=Math.min(minAx,ang(r,cam));if(prev)worst=Math.max(worst,ang(prev,r));prev=r;}return {worst,minAx,end:ang(prev,d)};};
{const a=sweep(.2,false);ok(a.worst>20,`① 재현(ref 없음): 축 0.2° 옆을 스칠 때 0.25° 걸음에 ${a.worst.toFixed(1)}° 튐`);}
for(const miss of [.2,2,-1,0]){const b=sweep(miss,true);ok(b.worst<=6.5&&b.minAx>=34-1e-6&&b.end<1,`② follow 이어짐: 축 ${miss}° 옆 휘두름 — 걸음당 최대 ${b.worst.toFixed(2)}°, 축과 최소 ${b.minAx.toFixed(1)}°, 끝 오차 ${b.end.toFixed(2)}°`);}
{const d=[Math.sin(50*D),cam[1]*Math.cos(50*D),cam[2]*Math.cos(50*D)],r=P.follow(d,cam,34*D,d,6*D);ok(ang(r,d)<1e-9,'③ 이미 벌어진 칼날은 그대로');
 const r2=P.follow(cam,cam,34*D,cam,6*D),r3=P.follow([0,0,1],cam,34*D,[NaN,1,0],6*D);ok(fin(r2)&&Math.abs(ang(r2,cam)-34)<1e-6&&fin(r3),'③ prev 가 축과 나란함·NaN → 유한한 값, 34°');}
ok(/follow\(arr\(d\),arr\(c\),deg\*DEG,prev,s\.vB\|\|Math\.PI,armOf\(s\)\)/.test(src)&&/s\.vPrev=arr\(/.test(src)&&/s\.group\.getWorldQuaternion/.test(src),'④ 앞 프레임 결과를 몸 좌표로 기억해 넘김');
ok(/function fit\(s\)\{const wr=wrist\(s\);return \[wr,clearView\(s\)\];\}/.test(src)&&/if\(gap>1e-6\)\{s\.vA=gap<\.25\?s\.vPrev:null;s\.vB=VIEW_RATE/.test(src),'④ 손목 → 화면(손목 조건도 함께, 이어짐) 한 번씩, 게임 시간이 멈춘 프레임은 기억 없이');
// ⑤ 손목 조건 함께(R1347 검술과 합친 뒤): 카메라 축과 아래팔 축이 가까운 채 칼이 둘 사이를 지나가도 걸음당 ≤ 6.5°, 결과는 카메라 34°·아래팔 31° 이상
{const arm={ax:[Math.sin(40*D),cam[1]*Math.cos(40*D),cam[2]*Math.cos(40*D)],ref:[1,0,0],min:32*D};let prev=null,worst=0,mc=180,ma=180;for(let t=-60;t<=90;t+=.25){let d=[Math.sin(t*D),cam[1]*Math.cos(t*D),cam[2]*Math.cos(t*D)].map((x,i)=>x+up[i]*Math.sin(.3*D));const n=Math.hypot(...d);d=d.map(x=>x/n);
 const r=P.follow(d,cam,34*D,prev,6*D,arm);mc=Math.min(mc,ang(r,cam));ma=Math.min(ma,ang(r,arm.ax));if(prev)worst=Math.max(worst,ang(prev,r));prev=r;}
 ok(worst<=6.5&&mc>=34-1e-6&&ma>=31,`⑤ 손목 조건 함께: 걸음당 최대 ${worst.toFixed(2)}°, 카메라 축과 ${mc.toFixed(1)}°, 아래팔과 ${ma.toFixed(1)}°`);}
console.log(fail?`\nR1351 CPU FAIL ${fail}`:'\nR1351 CPU PASS');process.exit(fail?1:0);
