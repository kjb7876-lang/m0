// R1348 환도·EGO 칼 쥐기·손목 꺾기 — 정적·순수 함수 검사(브라우저 없음).
//  사용자 11-26 14:13Z "환도 손에 잘 쥐어서 모션 동작 자연스러워야한다".
//  실측 원인: 원래 베기 모션에서 칼날~아래팔 각 3~29°(팔 끝에 막대를 붙인 모양), 대기↔공격 섞는 순간 주먹이 칼자루에서 9cm 떨어짐.
//  ① cock: 칼날이 아래팔 축과 min 보다 가까우면 정확히 min 으로 벌림(같은 쪽), 일직선이면 ref 쪽, 이미 벌어졌으면 그대로.
//     경계: 경계값 바로 안팎에서 이어짐(뛰지 않음)·반대 방향·ref 가 축과 나란함·길이 0·NaN.
//  ② 표: 환도·EGO 만 wrist 를 갖고 값은 25~45°. ③ 섞는 동안 칼자루를 주먹 자리(p0)에 두는 줄, 렌더 뒤 되돌림·끄기 키 유지.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const F='hero-stance-3d-r1320.js',src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
ok(src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8'),'오버레이 원본 = runtime-text 사본');
const win={};const sb={window:win,localStorage:{getItem:()=>null,setItem(){}},setInterval(){},Number,Math,Object,String,Array,JSON,RegExp,console,isFinite};
vm.createContext(sb);vm.runInContext(src,sb,{filename:F});const api=win.__STORYWORLD_HERO_STANCE_R1320__,P=api?.pure;
ok(!!P?.cock&&/^R13(4[89]|5[0-9])/.test(api.inspect().revision),'cock 순수 함수·R1348 판 ('+api?.inspect().revision+')');
const len=a=>Math.hypot(...a),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),un=a=>a.map(x=>x/len(a)),fin=a=>a.every(Number.isFinite),deg=(a,b)=>Math.acos(Math.max(-1,Math.min(1,dot(un(a),un(b)))))*180/Math.PI;
const D=Math.PI/180,ax=[0,1,0],ref=[0,0,1],MIN=32*D;
{const d=[0,Math.cos(10*D),Math.sin(10*D)*0].map((x,i)=>i===0?Math.sin(10*D):x),r=P.cock(d,ax,ref,MIN);
 ok(Math.abs(deg(r,ax)-32)<1e-6&&r[0]>.15&&r[2]>0,`① 10° 칼날 → 32° 로, 이미 벗어난 쪽(+X)을 남기고 ref 쪽을 섞음 (${deg(r,ax).toFixed(2)}°, ${r.map(x=>x.toFixed(3))})`);
 const d40=un([Math.sin(30*D),Math.cos(30*D),0]),r40=P.cock(d40,ax,ref,MIN);ok(Math.abs(deg(r40,ax)-32)<1e-6&&r40[0]>.5,`① 30° 칼날 → 32°, 거의 같은 쪽 (${r40.map(x=>x.toFixed(3))})`);}
{const r=P.cock([0,1,0],ax,ref,MIN);ok(Math.abs(deg(r,ax)-32)<1e-6&&r[2]>.5,`① 정확히 일직선 → ref 쪽으로 32° (${r.map(x=>x.toFixed(3))})`);}
{const d=un([Math.sin(50*D),Math.cos(50*D),0]);const r=P.cock(d,ax,ref,MIN);ok(len(r.map((x,i)=>x-d[i]))<1e-12,'① 이미 50° → 그대로(원래 모션)');}
{const d=un([0,-1,.1]);const r=P.cock(d,ax,ref,MIN);ok(len(r.map((x,i)=>x-d[i]))<1e-12,'① 반대 방향(칼끝이 팔꿈치 쪽) → 이미 벌어짐, 그대로');}
// 이어짐: 31.9°·32.1° 사이, 0.01° 근처에서 값이 크게 뛰지 않음
{const at=a=>P.cock(un([Math.sin(a*D),Math.cos(a*D),0]),ax,ref,MIN);const j1=deg(at(31.99),at(32.01)),j2=deg(at(.01),at(.02)),j3=deg(at(.01),at(0));
 ok(j1<.05&&j2<1&&j3<1,`① 경계에서 이어짐 (32° 안팎 ${j1.toFixed(3)}°, 0° 근처 ${j2.toFixed(3)}°·${j3.toFixed(3)}°)`);
 let worst=0,prev=at(0);for(let a=.05;a<=40;a+=.05){const c=at(a);worst=Math.max(worst,deg(prev,c));prev=c;}ok(worst<1,`① 0→40° 훑을 때 한 걸음(0.05°)의 최대 변화 ${worst.toFixed(3)}° (뛰지 않음)`);}
{const r=P.cock([0,1,0],ax,[0,1,0],MIN),r2=P.cock([0,0,0],ax,ref,MIN),r3=P.cock([NaN,1,0],[0,0,0],null,NaN);
 ok(fin(r)&&Math.abs(deg(r,ax)-32)<1e-6&&fin(r2)&&fin(r3),'① 경계: ref 가 축과 나란함·길이 0·NaN → 유한한 값');}
// ② 표
{const h=api.stance('hwando'),e=api.stance('ego'),o=['gunner','michaela'].map(id=>api.stance(id));
 ok(h.wrist?.[0]>=25&&h.wrist[0]<=45&&e.wrist?.[0]===h.wrist[0]&&o.every(s=>!s.wrist),`② 환도·EGO 만 손목 꺾기 (${h.wrist?.[0]}°)`);}
// ③ 줄
ok(/s\.mount\.position\.copy\(w<\.999\?p0:lp\)/.test(src),'③ 섞는 동안 칼자루 = 주먹 자리(p0)');
ok(/scene\.onAfterRender=function/.test(src)&&/storyworld\.r1320\.stance/.test(src)&&/let wr=wrist\(s\),v=clearView\(s\)/.test(src)&&/const \[wr,view\]=fit\(s\)/.test(src),'③ 렌더 뒤 되돌림·끄기 키·손목 다음 clearView(칼날이 화면에서 사라지지 않음이 마지막)');
console.log(fail?`\nR1348 CPU FAIL ${fail}`:'\nR1348 CPU PASS');process.exit(fail?1:0);
