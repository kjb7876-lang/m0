// R1234 — 몹이 무언가에 가로막혀 앞뒤로 밀릴 때 그림이 흔들리는 것 줄이기(그리는 위치만)
//  (사용자 2026-11-19 "몹들이 무언가에 가로막혔을때 이미지가 흔들리는 버그 개선해줘", "주사실 감시환각우두머리 이미지가 뭔가 흔들리고 지지직거리는 느낌").
//  헤드리스 실측(ep1a09, 몹 무리 속 감시환각 우두머리): 다른 몹·벽에 막힌 몹은 엔진 밀어내기로 실제 위치(e.y)가 0.1~0.2초마다 0.15~0.5칸씩
//  앞뒤로 오갔다(60.38→60.88→60.67→60.85). 그림·체력바·안개가 그 위치를 그대로 따라 화면에서 떨렸다.
//  · 고친 것: 그릴 때만 몹 위치를 다듬는다. 지난 0.8초 걸음의 '실제 진행(처음→끝 거리) ÷ 걸은 길이'가 작으면(제자리에서 오감)
//    그 동안의 평균 자리 쪽으로 그린다(0.1초에 걸쳐 부드럽게 들어가고 빠짐, 최대 0.3칸). 똑바로 걷기·돌진·순간이동(0.6칸 넘는 튐)·맞아서 밀리는 동안(hitTimer)은 그대로 따라간다(타격감 유지).
//  · 판정·AI·이동·피해·저장은 그대로(drawEnemy 동안만 e.x·e.y 를 바꿨다가 되돌린다. 그 사이 다른 코드가 위치를 새로 쓰면 그 값을 둔다).
//  · 맡지 않음: 죽은 몹, 움직이지 않는 구조물(R170 탑·R446 기둥·R75 탑·R251 원·stationary), 페르소나, 맘몬 구역(사용자 지시로 손대지 않음).
//  · 끄기: localStorage storyworld.r1234.steady = '0'. 검사 qa/r1234/jitter-fog-cpu-check.cjs.
(()=>{'use strict';
if(window.__STORYWORLD_POS_STEADY_R1234__)return;
const REV='R1234-pos-steady-1',WIN=.8,JUMP=.6,MAXOFF=.3,EASE=.1;
const stats={wraps:0,draws:0,steadied:0,resets:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e&&e.stack||e).slice(0,240);};
const on=()=>{try{return localStorage.getItem('storyworld.r1234.steady')!=='0';}catch(_){return true;}};
const T=()=>{try{return typeof time==='number'&&Number.isFinite(time)?time:0;}catch(_){return 0;}};
const fin=Number.isFinite;
function mammon(e){try{const id=String(typeof room==='object'&&room?room.id||'':'');return /mammon/i.test(id)||id==='ep1b06'||!!e.mammon||!!e.mammonR||/mammon/i.test(String(e.nativeId||''));}catch(_){return false;}}
function skip(e){return !e||!(e.hp>0)||e.spawnState==='dead'||e.hidden||e.persona||e.r170Tower||e.r446Pillar||e.r75Tower||e.r251Circle||e.r193Tower||e.towerR193||e.stationary||e.prop||e.object||mammon(e);}
const S=new WeakMap();
// 순수 계산: 몹 상태 s 에 (t,x,y) 를 넣고 그릴 자리 [x,y] 를 돌려준다.
function steady(s,t,x,y,hit){
 if(s.lt===t&&s.ax===x&&s.ay===y)return[s.rx,s.ry];
 const B=s.buf,L0=B.length?B[B.length-1]:null;
 if(L0&&(Math.hypot(x-L0[1],y-L0[2])>JUMP||t<L0[0])){B.length=0;s.w=0;stats.resets++;}
 const dt=s.lt>=0&&t>s.lt?Math.min(.25,t-s.lt):0;
 if(!B.length||t>B[B.length-1][0])B.push([t,x,y]);else{B[B.length-1][1]=x;B[B.length-1][2]=y;}
 while(B.length>2&&B[0][0]<t-WIN)B.shift();
 // 목표 자리 = 창 안 걸음의 직선 맞춤(시간에 대한 최소제곱)을 지금 시각에서 읽은 값: 제자리 오감 → 평균 자리, 계단·곧은 걸음 → 진행 선 위(늦지 않음).
 let len=0,st=0,sx=0,sy=0,stt=0,stx=0,sty=0;const n=B.length,t0=B[0][0];
 for(let i=0;i<n;i++){const u=B[i][0]-t0;st+=u;sx+=B[i][1];sy+=B[i][2];stt+=u*u;stx+=u*B[i][1];sty+=u*B[i][2];if(i)len+=Math.hypot(B[i][1]-B[i-1][1],B[i][2]-B[i-1][2]);}
 const den=n*stt-st*st,bx=den>1e-9?(n*stx-st*sx)/den:0,by=den>1e-9?(n*sty-st*sy)/den:0,u=t-t0;
 const span=B[n-1][0]-t0,net=Math.hypot(B[n-1][1]-B[0][1],B[n-1][2]-B[0][2]),r=len>1e-9?Math.min(1,net/len):1,q=r*r*r;
 // 평균 자리(제자리 오감에 맞음)와 직선 맞춤(진행 중일 때 늦지 않음)을 '진행 비율³'으로 섞는다 — 끝점 직선 외삽은 오감에선 튀므로 진행할 때만.
 let lx=Infinity,hx=-Infinity,ly=Infinity,hy=-Infinity;for(const b of B){if(b[1]<lx)lx=b[1];if(b[1]>hx)hx=b[1];if(b[2]<ly)ly=b[2];if(b[2]>hy)hy=b[2];}
 const cl=(v,a,b)=>v<a?a:v>b?b:v;// 창 안 실제 자리 범위 밖으로는 그리지 않는다(외삽 튐 방지)
 const ax=sx/n,ay=sy/n,mx=cl(ax+q*((ax-bx*st/n+bx*u)-ax),lx,hx),my=cl(ay+q*((ay-by*st/n+by*u)-ay),ly,hy);
 const osc=hit?0:len>.08&&span>=.15?Math.max(0,Math.min(1,(.9-net/len)/.4)):0;
 if(hit){s.w=0;}
 s.w=dt>0?s.w+(osc-s.w)*(1-Math.exp(-dt/EASE)):(s.lt<0?osc*0:s.w);
 let ox=(mx-x)*s.w,oy=(my-y)*s.w;const m=Math.hypot(ox,oy);if(m>MAXOFF){ox*=MAXOFF/m;oy*=MAXOFF/m;}
 let rx=x,ry=y;if(m>1e-6&&fin(ox)&&fin(oy)){rx=x+ox;ry=y+oy;}
 s.lt=t;s.ax=x;s.ay=y;s.rx=rx;s.ry=ry;return[rx,ry];}
function stateOf(e){let s=S.get(e);if(!s){s={buf:[],w:0,lt:-1,ax:NaN,ay:NaN,rx:0,ry:0};S.set(e,s);}return s;}
function wrap(base){const w=function(e,...a){
  if(!on()||skip(e)||!fin(e.x)||!fin(e.y))return base.call(this,e,...a);
  let rx=e.x,ry=e.y;const x0=e.x,y0=e.y;
  try{[rx,ry]=steady(stateOf(e),T(),x0,y0,e.hitTimer>0||e.knockTimer>0);}catch(err){fail(err);rx=x0;ry=y0;}
  if(rx===x0&&ry===y0)return base.call(this,e,...a);
  stats.steadied++;e.x=rx;e.y=ry;
  try{return base.call(this,e,...a);}finally{if(e.x===rx)e.x=x0;if(e.y===ry)e.y=y0;}};
 // 다른 오버레이의 '이미 감쌌음' 표시(__rNNN)를 옮겨 서로 번갈아 다시 감싸지 않게(R1196 핑퐁 교훈)
 try{for(const k of Object.keys(base))if(/^__/.test(k)&&!(k in w))w[k]=base[k];}catch(_){}
 w.__r1234=true;w.__r1234Base=base;return w;}
function install(){try{if(typeof drawEnemy!=='function')return false;if(drawEnemy.__r1234)return true;drawEnemy=wrap(drawEnemy);stats.wraps++;return true;}catch(e){fail(e);return false;}}
// 뒤에 실린 오버레이가 감싸도 맨 바깥에 오도록 처음 몇 프레임만 다시 확인(최대 4번 — 상한 없는 재감싸기 금지)
let checks=0;function pump(){checks++;if(drawEnemy&&!drawEnemy.__r1234&&stats.wraps<4)install();if(checks<120&&typeof requestAnimationFrame==='function')requestAnimationFrame(pump);}
install();if(typeof requestAnimationFrame==='function')requestAnimationFrame(pump);
window.__STORYWORLD_POS_STEADY_R1234__=Object.freeze({revision:REV,install,steady,
 inspect:()=>({revision:REV,on:on(),installed:typeof drawEnemy==='function'&&!!drawEnemy.__r1234,stats:{...stats},lastError})});
})();
