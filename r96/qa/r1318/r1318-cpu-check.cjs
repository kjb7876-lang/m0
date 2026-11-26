// R1318 3D 영웅 무기 쥐기 고침 — 정적 회귀. 무기 손잡이는 손 뼈 원점, 방향은 영웅별 고정 회전(자세 따라 바뀌지 않음).
const fs=require('fs'),path=require('path');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p));}catch(_){return null;}};
const F='hero-weapons-3d-r1313.js',src=rd('client-source/'+F),s=String(src||'');
ok(!!src&&src.equals(rd('runtime-text/'+F)||Buffer.alloc(0)),'오버레이 원본 = runtime-text 사본');
const T=new Function('const DIR="";return '+s.slice(s.indexOf('{',s.indexOf('const WEAPONS=')),s.indexOf('\n};',s.indexOf('const WEAPONS='))+2))();
const SOCK={hwando:'Weapon_Socket',ego:'Weapon_Socket_R',michaela:'Weapon_Socket_R',hunter:'Weapon_Socket_L',gunner:'Weapon_Socket_R'};
for(const [id,so] of Object.entries(SOCK)){const W=T[id];ok(W&&W.socket===so,id+': 쥐는 손 뼈 '+so);
 const n=W?Math.hypot(...W.q):0;ok(W&&W.q.length===4&&Math.abs(n-1)<.002&&W.scale>0&&W.size===1&&W.roll===0&&W.flip===false,id+': 고정 회전(단위 쿼터니언 '+n.toFixed(4)+')·크기, 덧조정 없음');}
// 기억사수: 손 뼈 좌표에서 총 위쪽(무기 -X)·총구(무기 +Y). 대기 자세 기준 값이 바뀌면 브라우저 검사로 다시 확인.
const g=T.gunner;ok(g&&g.q.join()==='0.0416,0.5399,0.0645,0.8382','기억사수 회전 = 대기에서 총 위쪽 위·총구 앞으로 잰 값');
ok(/s\.mount\.position\.set\(0,0,0\)/.test(s)&&/sock\.add\(mount\)/.test(s),'무기 손잡이 = 손 뼈 원점');
ok(!/function orient|oriented|axisOf/.test(s),'자세에 따라 방향을 뒤집는 규칙 없음(걷기·공격 중 붙어도 같음)');
console.log(fail?'R1318 FAIL '+fail:'R1318 ALL OK');process.exit(fail?1:0);
