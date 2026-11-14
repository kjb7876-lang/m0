// R1036 CPU 검사: 불면귀가 영웅 곁에서 거의 제자리로 비틀거릴 때 걷기 방향 시트(move ↔ moveUp·moveDown)가 프레임마다 번갈아 바뀌지 않는가.
//  실플레이 검증 공개본 재점검(r1031-recheck/r619-pub2.json last303 43.05~43.25초): 0.05초마다 세로 ±0.02칸·가로 −0.01칸씩 흔들리며
//  move → moveUp → move → moveUp 으로 1프레임씩 바뀜(같은 구간 41.5초에도 move → moveDown → idle). R973 방향 고르기는 화면 속도를 고르게 한 뒤
//  문턱 둘(들어갈 때 세로>가로×1.25, 나올 때 <×.8)로 거르지만, 거의 서 있는 속도에서는 고른 속도 자체가 부호를 오가 문턱을 넘나든다.
//  기대: 아주 느린 비틀거림(세로 ±0.02칸)은 방향을 바꾸지 않는다. 진짜로 방향을 틀면(위로 걷다 옆으로) 0.5초 안에 바뀐다. 기존 R760 검사 그대로.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'../..');let n=0,bad=0;const ok=(c,m)=>{n++;if(c)console.log('ok  ',m);else{bad++;console.log('FAIL',m);}};
const src=fs.readFileSync(path.join(R,'client-source','bulmyeongwi-r760.js'),'utf8'),src620=fs.readFileSync(path.join(R,'client-source','boss-motion-r620.js'),'utf8');
ok(fs.readFileSync(path.join(R,'runtime-text','bulmyeongwi-r760.js'),'utf8')===src,'R760 runtime copy matches client source');
ok(/r96\/qa\/r1036\/r1036-dirflip-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')),'pages.yml runs this check');
// R760 검사의 가짜 엔진(world·frames·boss)을 그대로 빌려 쓴다
const h=fs.readFileSync(path.join(R,'qa','r760','r760-cpu-check.cjs'),'utf8');const a=h.indexOf('const IDLE='),b=h.indexOf('const VIS=');
const K=new Function('vm','src','src620',h.slice(a,b)+';return {world,frames,boss,run};')(vm,src,src620);
const SH=k=>(/sheet-(\w+)\.webp$/.exec(k?.sourcePath||'')||[])[1]||'?';
const switches=F=>F.filter((x,i,arr)=>i&&SH(x.b)!==SH(arr[i-1].b)).length;
// 1) 회귀 재현: 영웅 곁 비틀거림 — 세로 ±0.012칸을 2프레임마다 오가고 가로로 천천히 −0.006칸씩(공개본 기록과 같은 크기)
{const c=K.world({sheets:true}),e=K.boss();K.frames(c,e,1,{step:(e)=>{e.x-=.03;}}); // 먼저 옆으로 걷는 중
 const J=K.frames(c,e,1.5,{step:(e,t)=>{e.x-=.006;e.y+=(Math.floor(t*15)%2?.012:-.012);}});
 const sw=switches(J),kinds=[...new Set(J.map(x=>SH(x.b)))];
 ok(sw<=1,`near-standing wobble: sheet switches ≤1 over 1.5s (${sw}; ${kinds.join(',')})`);
 ok(!kinds.includes('moveUp')&&!kinds.includes('moveDown')||sw<=1,'near-standing wobble: does not flash up/down sheets');}
// 1b) 공개본 기록 그대로의 걸음(0.05초 간격 그리기 — 헤드리스·저사양처럼 프레임이 성길 때): 가로 −0.01·0·0·−0.02, 세로 −0.02·+0.02·−0.02·+0.03칸
//     (검사 화면은 세로 배율이 가로의 절반이라 세로를 두 배로 넣어 화면 기울기를 같게 한다)
{const c=K.world({sheets:true}),e=K.boss();K.frames(c,e,1,{dt:.05,step:(e)=>{e.x-=.05;}});const P=[[-.01,-.04],[0,.04],[0,-.04],[-.02,.06]];let i=0;
 const J=K.frames(c,e,1.5,{dt:.05,step:(e)=>{const [dx,dy]=P[i++%4];e.x+=dx;e.y+=dy;}});const sw=switches(J);
 ok(sw<=1,`recorded wobble at 20fps draws: switches ≤1 over 1.5s (${sw}; ${J.map(x=>SH(x.b)).join(' ')})`);}
// 1c) 게임과 같은 아이소 화면(x=(x−y)·32, y=(x+y)·16)에서 공개본 기록 위치를 그대로 0.05초마다
const ISO="project=function(x,y){return {x:100+(x-y)*32,y:200+(x+y)*16};};";
const REC=[[85.04,59.73],[85.03,59.71],[85.03,59.73],[85.03,59.71],[85.01,59.74],[84.99,59.76],[84.96,59.75],[84.95,59.74]];
for(const dt of [.05,1/60]){const c=K.world({sheets:true,pre:ISO}),e=K.boss({x:85.3,y:59.73});K.frames(c,e,.6,{dt:.05,step:(e)=>{e.x-=.02;}});
 let i=0;const sub=Math.round(.05/dt);const J=K.frames(c,e,1.6,{dt,step:(e)=>{const k=Math.floor(i/sub)%REC.length,f=(i%sub)/sub,a=REC[k],b=REC[(k+1)%REC.length];i++;
   // 기록 사이를 고르게 잇는다(끝에서 처음으로 돌아갈 땐 같은 거리만큼 옆으로 밀어 되돌아가는 걸음을 만들지 않음)
   const off=Math.floor(i/sub/REC.length)*-.09;e.x=a[0]+(b[0]-a[0])*f+off;e.y=a[1]+(b[1]-a[1])*f;}});
 const sw=switches(J);ok(sw<=1,`recorded positions on iso screen, draws every ${(dt*1000).toFixed(0)}ms: switches ≤1 (${sw}; ${[...new Set(J.map(x=>SH(x.b)))].join(',')})`);}
// 같은 비틀거림이 위로 걷던 중에 오면 위 시트를 유지(옆으로 튀지 않음)
{const c=K.world({sheets:true}),e=K.boss();K.frames(c,e,1,{step:(e)=>{e.y-=.06;}});
 const J=K.frames(c,e,1.5,{step:(e,t)=>{e.x-=.006;e.y+=(Math.floor(t*15)%2?.012:-.012);}});ok(switches(J)<=1,`wobble after walking up: switches ≤1 (${switches(J)})`);}
// 2) 정상: 진짜로 방향을 틀면 따라간다
{const c=K.world({sheets:true}),e=K.boss();K.frames(c,e,1,{step:(e)=>{e.y-=.06;}});
 const S=K.frames(c,e,1,{step:(e)=>{e.x+=.06;}});const at=S.findIndex(x=>SH(x.b)==='move');ok(at>=0&&at*(1/30)<=.5,`turn up → side: side walk within 0.5s (${(at/30).toFixed(2)}s)`);
 ok(SH(S[S.length-1].b)==='move','turn up → side: stays side');
 const D=K.frames(c,e,1,{step:(e)=>{e.y+=.06;}});const ad=D.findIndex(x=>SH(x.b)==='moveDown');ok(ad>=0&&ad*(1/30)<=.5,`turn side → down: down walk within 0.5s (${(ad/30).toFixed(2)}s)`);}
// 경계: 느리지만 꾸준히 위로(초당 0.6칸)는 위 시트
{const c=K.world({sheets:true}),e=K.boss();const U=K.frames(c,e,1.5,{step:(e)=>{e.y-=.02;}});ok(SH(U[U.length-1].b)==='moveUp',`slow steady walk up (0.6 tile/s) → moveUp (${SH(U[U.length-1].b)})`);}
console.log(`\nR1036 boss direction wobble CPU check: ${n-bad}/${n} passed`);process.exit(bad?1:0);
