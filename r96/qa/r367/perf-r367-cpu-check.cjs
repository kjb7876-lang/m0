// R367 길 찾기 한 탐색 전용 막힘 기억 — 실제 엔진 explorationPath 원문 + 가짜 지도로 돌린다(GPU·실기기 아님).
const fs=require('fs'),path=require('path'),assert=require('assert');const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const RT=f=>fs.readFileSync(path.join(root,'runtime-text',f),'utf8');const src=RT('perf-r367.js');
assert.strictEqual(src,fs.readFileSync(path.join(root,'client-source/perf-r367.js'),'utf8'));ok('client-source and runtime copies agree');
const idx=RT('index.html');assert(idx.split('"./perf-r367.js"').length===2&&idx.indexOf('"./perf-r360.js"')<idx.indexOf('"./perf-r367.js"')&&idx.indexOf('"./perf-r367.js"')<idx.indexOf('"./combat-r118.js"'));ok('script tag once, after perf-r360, before combat-r118');
assert(fs.readFileSync(path.join(root,'..','scripts','verify-r96-public.py'),'utf8').includes("'perf-r367.js'"));assert(fs.readFileSync(path.join(root,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r367/perf-r367-cpu-check.cjs'));assert(fs.readFileSync(path.join(root,'runtime-manifest.json'),'utf8').includes('perf-r367.js'));ok('in verify list, CI and runtime manifest');
// 엔진 explorationPath 원문(phase1.js 마지막 정의)을 그대로 꺼낸다.
const ph=RT('dist/phase1.js');const at=ph.lastIndexOf('function explorationPath(');const end=ph.indexOf('\n}\n',at);assert(at>0&&end>at);
const explorationPath=new Function(ph.slice(at,end+2)+';return explorationPath;')();ok('engine explorationPath extracted');
// 오버레이 적재(가짜 window)
const win={StoryPhase1:Object.freeze({explorationPath,other:1})};const store={};
new Function('window','localStorage',src)(win,{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}});
const API=win.__STORYWORLD_PERF_R367__;assert(API&&win.StoryPhase1.explorationPath!==explorationPath&&win.StoryPhase1.other===1&&Object.isFrozen(win.StoryPhase1));ok('StoryPhase1.explorationPath wrapped, other members kept');
assert.strictEqual(API.cellKey(3.5,4.5),3*4096+4);for(const [x,y] of [[3.4,4.5],[3.5,4.50001],[-.5,2.5],[4096.5,1.5],[NaN,1.5]])assert.strictEqual(API.cellKey(x,y),null);ok('cellKey only for exact cell centres');
// 가짜 지도: 칸 막힘 + 문(열림/닫힘) + 소품 원. 상태는 탐색 사이에만 바뀐다.
let seed=367;const rnd=()=>(seed=(seed*1103515245+12345)%2147483648)/2147483648;
function makeRoom(W,H){const solid=new Set();for(let i=0;i<W*H*.22;i++)solid.add(Math.floor(rnd()*W)+','+Math.floor(rnd()*H));
 const doors=[];for(let i=0;i<4;i++)doors.push({x:2+Math.floor(rnd()*(W-4))+.5,y:2+Math.floor(rnd()*(H-4))+.5,open:rnd()<.5});
 const props=[];for(let i=0;i<5;i++)props.push({x:rnd()*W,y:rnd()*H,radius:.3+rnd()*.4,solid:true});
 return {layout:{bounds:[0,0,W,H]},solid,doors,props,calls:0};}
function blockedFn(R){const raw=(x,y,v)=>{if(x-v<0||y-v<0||x+v>R.layout.bounds[2]||y+v>R.layout.bounds[3])return true;
 for(let a=Math.floor(x-v);a<=Math.floor(x+v);a++)for(let b=Math.floor(y-v);b<=Math.floor(y+v);b++)if(R.solid.has(a+','+b)){const dx=Math.max(a-x,0,x-a-1),dy=Math.max(b-y,0,y-b-1);if(Math.hypot(dx,dy)<v)return true;}
 for(const d of R.doors)if(!d.open&&Math.abs(x-d.x)<.5+v&&Math.abs(y-d.y)<.5+v)return true;
 for(const p of R.props)if(p.solid&&Math.hypot(p.x-x,p.y-y)<p.radius+v)return true;return false;};
 const f=(x,y,v)=>{R.calls++;return raw(x,y,v);};f.raw=raw;return f;}// R.calls = 탐색이 직접 묻는 막힘 질의 수
function clearFn(b0){const bl=b0.raw;return (a,b,v)=>{const k=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/.18));for(let i=1;i<=k;i++)if(bl(a.x+(b.x-a.x)*i/k,a.y+(b.y-a.y)*i/k,v))return false;return true;};}
const rooms=[makeRoom(24,20),makeRoom(40,30),makeRoom(18,32)];
API.set({unstick:false}); // R370 의 벽 옆 시작점 풀기는 일부러 결과를 바꾸므로, 기억(memo) 동일성은 끈 채로 본다(r370 검사가 따로 봄)
let baseCalls=0,memoCalls=0,queries=0,found=0,changes=0;
for(let q=0;q<900;q++){const R=rooms[q%3];// 방 바꾸기(3개 번갈아)
 if(rnd()<.3){const d=R.doors[Math.floor(rnd()*R.doors.length)];d.open=!d.open;changes++;}// 문 상태 바꾸기
 if(rnd()<.1){const p=R.props[Math.floor(rnd()*R.props.length)];p.solid=!p.solid;changes++;}
 const W=R.layout.bounds[2],H=R.layout.bounds[3];const from={x:.5+rnd()*(W-1),y:.5+rnd()*(H-1)},to=rnd()<.5?{x:Math.floor(rnd()*W)+.5,y:Math.floor(rnd()*H)+.5}:{x:.5+rnd()*(W-1),y:.5+rnd()*(H-1)};
 const rad=[.29,.28,.31,.2][q%4];const bl=blockedFn(R),cl=clearFn(bl);
 R.calls=0;const a=explorationPath(R.layout,from,to,rad,bl,cl);baseCalls+=R.calls;
 R.calls=0;const b=win.StoryPhase1.explorationPath(R.layout,from,to,rad,bl,cl);memoCalls+=R.calls;
 assert.deepStrictEqual(b,a,'query '+q);queries++;if(a.length)found++;}
assert(found>100&&changes>200,`found ${found} changes ${changes}`);ok(`wrapped == engine over ${queries} random queries (${found} found paths, ${changes} door/prop changes, 3 rooms, 4 radii)`);
API.set({unstick:true});
assert(memoCalls<baseCalls*.5,`calls ${memoCalls} vs ${baseCalls}`);ok(`blocked calls reduced ${baseCalls} -> ${memoCalls} (${(100-memoCalls/baseCalls*100).toFixed(0)}% fewer)`);
// 기억은 탐색 사이에 이어지지 않는다: 같은 질의, 문만 바꾸면 결과가 엔진과 같이 바뀐다.
{const R=makeRoom(12,3);R.solid.clear();R.solid.add("6,0");R.solid.add("6,2");R.props.length=0;R.doors=[{x:6.5,y:1.5,open:true}];R.layout.bounds=[0,0,12,3];const bl=blockedFn(R),cl=clearFn(bl),f={x:1.5,y:1.5},t={x:10.5,y:1.5};
 const p1=win.StoryPhase1.explorationPath(R.layout,f,t,.29,bl,cl);R.doors[0].open=false;const p2=win.StoryPhase1.explorationPath(R.layout,f,t,.29,bl,cl);
 assert(p1.length>0&&p2.length===0);assert.deepStrictEqual(p2,explorationPath(R.layout,f,t,.29,bl,cl));ok('door closes between searches -> wrapped sees it at once (no cross-search memo)');}
// 다른 반지름·칸 중심 아닌 질의는 그대로 넘긴다
{const seen=[];const mb=API.memoBlocked((x,y,v)=>{seen.push([x,y,v]);return false;},.29,null);mb(1.5,1.5,.29);mb(1.5,1.5,.29);mb(1.5,1.5,.31);mb(1.4,1.5,.29);mb(1.4,1.5,.29);assert.strictEqual(seen.length,4);ok('non-centre / other-radius queries always recomputed');}
// 끄기
API.set({memo:false});{const R=rooms[0];const bl=blockedFn(R),cl=clearFn(bl);R.calls=0;explorationPath(R.layout,{x:1.5,y:1.5},{x:20.5,y:17.5},.29,bl,cl);const c0=R.calls;R.calls=0;win.StoryPhase1.explorationPath(R.layout,{x:1.5,y:1.5},{x:20.5,y:17.5},.29,bl,cl);assert.strictEqual(R.calls,c0);}API.set({memo:true});ok('memo:false -> identical call count to engine');
assert(/browserVerified:false/.test(src)&&/GPUVerified:false/.test(src));ok('honest verification flags');
console.log(JSON.stringify({status:'R367_PERF_CPU_PASSED',checks:n}));
