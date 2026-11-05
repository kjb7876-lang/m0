// R360 병원(ep1a08) '못 가는 제단' 길 찾기 기억 — 가짜 전역으로 돌린다(GPU·실기기 아님).
const fs=require('fs'),path=require('path'),assert=require('assert');const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const RT=f=>fs.readFileSync(path.join(root,'runtime-text',f),'utf8');const src=RT('perf-r360.js');
assert.strictEqual(src,fs.readFileSync(path.join(root,'client-source/perf-r360.js'),'utf8'));ok('client-source and runtime copies agree');
const idx=RT('index.html');assert(idx.split('"./perf-r360.js"').length===2&&idx.indexOf('"./perf-r272.js"')<idx.indexOf('"./perf-r360.js"')&&idx.indexOf('"./polish-r101.js"')<idx.indexOf('"./perf-r360.js"')&&idx.indexOf('"./perf-r360.js"')<idx.indexOf('"./combat-r118.js"'));ok('script tag once, after polish-r101/perf-r272 (outer findPath wrapper), before combat-r118');
assert(fs.readFileSync(path.join(root,'..','scripts','verify-r96-public.py'),'utf8').includes("'perf-r360.js'"));assert(fs.readFileSync(path.join(root,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r360/perf-r360-cpu-check.cjs'));assert(fs.readFileSync(path.join(root,'runtime-manifest.json'),'utf8').includes('perf-r360.js'));ok('in verify list, CI and runtime manifest');
// 엔진 findPath 를 흉내: 제단(15,13)은 단계가 'boss' 일 때만 닿는다. 호출 수를 센다.
function world(withOverlay,o={}){const S={phase:'route',gen:0,clock:0,calls:0,fromBlocked:false};
 const room={id:o.zone||'ep1a08'};const alt={x:15,y:13};
 const W={__STORYWORLD_WORLD_R74__:{generation:()=>S.gen},__STORYWORLD_HOSPITAL_MAZE_PROGRESSION__:{inspect:()=>({state:{phase:S.phase}})}};
 const f=new Function('window','localStorage','performance','room','S','alt',
  'let findPath=function(from,to){S.calls++;if(to.x===alt.x&&to.y===alt.y&&S.phase!=="boss")return [];if(to.x===alt.x&&to.y===alt.y)return [{x:15,y:13}];return [{x:to.x,y:to.y}];};'+
  'let blocked=function(x,y){return S.fromBlocked&&x===1&&y===1;};'+(withOverlay?src:'')+';return {fp:(a,b,r,rad)=>findPath(a,b,r,rad)};');
 const G=f(W,{getItem:()=>null,setItem(){}},{now:()=>S.clock},room,S,alt);return {S,G,room,alt,W};}
const hero={x:30,y:90};
// 옛 코드(오버레이 없음): 1.5초 간격 5번 → 매번 미로 전체 탐색
{const {S,G,alt}=world(false);for(let i=0;i<5;i++){S.clock+=1500;G.fp(hero,alt,undefined,.31);}assert.strictEqual(S.calls,5);ok('baseline (old code): every 1.5 s retry re-runs the full failing search (5/5)');}
{const {S,G,alt}=world(true);for(let i=0;i<5;i++){S.clock+=1500;assert.deepStrictEqual(G.fp(hero,alt,undefined,.31),[]);}assert.strictEqual(S.calls,1);ok('ep1a08: a genuine miss is held for 20 s (1/5 full searches), result still []');
 S.clock+=20001;G.fp(hero,alt,undefined,.31);assert.strictEqual(S.calls,2);ok('after 20 s the search runs again');}
{const {S,G,alt}=world(true);G.fp(hero,alt,undefined,.31);S.phase='boss';const p=G.fp(hero,alt,undefined,.31);assert.strictEqual(S.calls,2);assert.strictEqual(p.length,1);ok('hospital phase change re-searches at once and finds the altar');}
{const {S,G,alt}=world(true);G.fp(hero,alt,undefined,.31);S.gen=1;G.fp(hero,alt,undefined,.31);assert.strictEqual(S.calls,2);ok('R74 door generation change re-searches at once');}
{const {S,G,alt}=world(true);G.fp(hero,alt,undefined,.31);G.fp(hero,alt,undefined,.29);assert.strictEqual(S.calls,2);ok('radius is part of the key');}
{const {S,G,alt}=world(true);S.fromBlocked=true;G.fp({x:1,y:1},alt,undefined,.31);G.fp(hero,alt,undefined,.31);assert.strictEqual(S.calls,2);ok('a cheap miss from a blocked start cell is not remembered');}
{const {S,G}=world(true);const t={x:40,y:40};G.fp(hero,t);G.fp(hero,t);assert.strictEqual(S.calls,2);ok('found paths are never cached');}
{const {S,G,alt}=world(true,{zone:'ep1a09'});G.fp(hero,alt);G.fp(hero,alt);assert.strictEqual(S.calls,2);ok('other regions untouched');}
{const {S,G,alt,W}=world(true);G.fp(hero,alt);const I=W.__STORYWORLD_PERF_R360__.inspect();assert.strictEqual(I.stats.stored,1);W.__STORYWORLD_PERF_R360__.set(false);G.fp(hero,alt);assert.strictEqual(S.calls,2);ok('inspect() stats and off switch');}
console.log(JSON.stringify({ok:true,checks:n,method:'CPU fake globals; headless separately'}));
