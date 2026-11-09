// R444 걷기 좌우 결정 오프라인 모의: 평활 τ·유지 시간 H 를 바꿔, 걷는 프레임(own=move)의 좌우를 다시 계산하고
//  ① 창(±0.15초) 걷는 쪽과 어긋남 ② 0.3초 넘게 계속 어긋남 ③ 뒤집힘/100프레임 ④ 0.25초 안 되뒤집힘 을 센다. 다른 owner 프레임은 실제 R444 좌우를 그대로 쓴다.
// 실행: node hsim.cjs on.json[,on2.json] '[[0.07,0.05,0.3],[0.07,0.05,0.3,0.12]]'  (τ초, 지속초, 가로 비율 문턱, 최근 0.6초 안 꺾였을 때 더할 지속초)
//  2026-11-09 결과: 지속을 늘리면 뒤집힘은 줄지만 0.3초 넘는 어긋남이 늘고, 최근 꺾임 가산(+0.12초)도 자료 3벌 중 2벌에서 어긋남이 늘어 지금 값(0.07·0.05)을 유지했다.
const path=require('path');const files=process.argv[2].split(',');const sets=JSON.parse(process.argv[3]||'[[0.07,0.05]]');
const data=files.map(f=>require(path.resolve(f)));
function run(tau,H,ratio=.3,adapt=0){const res={};for(const D of data)for(const [z,v] of Object.entries(D)){if(!v.rows)continue;const by={};for(const r of v.rows)if(!r.persona&&r.side)(by[r.id]??=[]).push(r);
 const o=res[z]??={walk:0,bad:0,long:0,turns:0,quick:0,frames:0};
 for(const L of Object.values(by)){let vx=0,vy=0,side=null,pend=null,since=0,prevT=null,lastTurn=-9,prevVis=null,lastW=null,wsince=0;
  for(const r of L){const dt=prevT==null?.05:Math.max(1e-3,r.t-prevT);prevT=r.t;const dx=r.sy+r.sx/2,dy=r.sy-r.sx/2,dist=Math.hypot(dx,dy);
   if(dist>.6){vx=vy=0;}else{const k=1-Math.exp(-dt/tau);vx+=(dx/dt-vx)*k;vy+=(dy/dt-vy)*k;}
   if(side===null)side=r.side;
   if(r.own!=='move'){side=r.side;pend=null;}
   else{const X=vx-vy,Y=(vx+vy)/2,m=Math.hypot(X,Y)||1;if(Math.abs(X)/m>ratio){const want=X>0?'right':'left';if(want!==side){if(pend!==want){pend=want;since=r.t;}const h=H+(adapt&&r.t-lastTurn<.6?adapt:0);if(r.t-since>=h){side=want;pend=null;}}else pend=null;}}
   o.frames++;if(prevVis&&prevVis!==side){o.turns++;if(r.t-lastTurn<.25)o.quick++;lastTurn=r.t;}prevVis=side;
   if(r.ph||r.atk){lastW=null;continue;}
   let sx=0,sy=0;for(const q of L)if(Math.abs(q.t-r.t)<=.15&&!q.ph){sx+=q.sx;sy+=q.sy;}
   if(Math.abs(sx)>.06&&Math.abs(sx)>Math.abs(sy)*.8){const w=sx>0?'right':'left';if(w!==lastW){lastW=w;wsince=r.t;}if(r.own==='face')continue;o.walk++;if(w!==side){o.bad++;if(r.t-wsince>=.3)o.long++;}}}}}
 return res;}
for(const [tau,H,ratio,adapt] of sets){const r=run(tau,H,ratio,adapt);let line=`τ=${tau} H=${H}${ratio?' ratio='+ratio:''}${adapt?' adapt+'+adapt:''} :: `;let T={walk:0,bad:0,long:0,turns:0,quick:0,frames:0};
 for(const [z,o] of Object.entries(r)){line+=`${z} ${(100*o.bad/Math.max(1,o.walk)).toFixed(1)}%/${o.long}/${(100*o.turns/Math.max(1,o.frames)).toFixed(1)}/${o.quick}  `;for(const k in T)T[k]+=o[k];}
 console.log(line+` | ALL ${(100*T.bad/T.walk).toFixed(1)}% long ${T.long} flips ${(100*T.turns/T.frames).toFixed(2)} quick ${T.quick}`);}
