'use strict';
// R979 — 영웅 길잡이 '길 없음' 재탐색 끊김(사용자 2026-11-13 "렉개선 및 디버깅등은 수시로해주고").
//  측정(헤드리스, main 9ebd9de): ep1b01 에서 10.7초 동안 영웅 자리에서 떠나는 '길 없음' 길 찾기 6번이 423ms(한 번 최대 160ms),
//  앞선 측정에서 ep1a11 1,102ms/15초·u206 912ms/20초. 부르는 곳은 R101 guideDoorStep·objectiveBlocked(닫힌 보스방 제단).
//  R272 가 '못 찾음'을 1.5초만 기억해 1.5초마다 미로 전체를 다시 뒤진다. R360 은 같은 문제를 ep1a08 에서만 20초 기억으로 고쳤다.
//  고침(새 오버레이 perf-r979.js): 모든 지역에서, 영웅 자리에서 떠나고 출발·도착 칸이 막히지 않았는데 길이 없으면 6초 기억한다.
//   열쇠 = 방 · 도착 칸(0.5) · 반지름 · R74 문 세대 · R78 단계 · 병원 단계 · room.engaged · 탐색 레이아웃 객체. 영웅이 기억한 자리에서 8칸 넘게 벗어나면(순간이동) 버린다.
//   길이 있는 결과·몹 길 찾기·막힌 칸에서 떠난 결과는 기억하지 않는다. 판정·충돌·진행·그림은 그대로.
const fs=require('fs'),path=require('path'),assert=require('assert');const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const RT=f=>fs.readFileSync(path.join(root,'runtime-text',f),'utf8');const src=RT('perf-r979.js');
assert.strictEqual(src,fs.readFileSync(path.join(root,'client-source/perf-r979.js'),'utf8'));ok('client-source 와 runtime 사본이 같음');
const idx=RT('index.html');assert(idx.split('"./perf-r979.js"').length===2&&idx.indexOf('"./perf-r979.js"')<idx.indexOf('"./combat-r118.js"'));ok('index.html: combat-r118 앞에 한 번(감싸는 순서는 상관없음: 부를 때의 전역 findPath 를 감쌈)');
assert(fs.readFileSync(path.join(root,'..','scripts','verify-r96-public.py'),'utf8').includes("'perf-r979.js'"));assert(fs.readFileSync(path.join(root,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r979/r979-cpu-check.cjs'));ok('공개 검증 목록·CI 줄에 있음');
const HERO={x:30,y:90};
function world(withOverlay,o={}){const S={open:false,gen:0,phase:'route',clock:0,calls:0,fromBlocked:false};
 const room={id:o.zone||'ep1b01',engaged:false,exploration:{}};const alt={x:15,y:13};const player=o.player||{...HERO};
 const W={__STORYWORLD_HOSPITAL_MAZE_PROGRESSION__:{inspect:()=>({state:{phase:S.hosp||''}})},__STORYWORLD_WORLD_R74__:{generation:()=>S.gen},__STORYWORLD_WORLD_COMBAT_R78__:{state:()=>({phase:S.phase})}};
 const f=new Function('window','localStorage','performance','room','S','alt','player',
  'let time=undefined;let findPath=function(from,to){S.calls++;if(to.x===alt.x&&to.y===alt.y)return S.open?[{x:15,y:13}]:[];return [{x:to.x,y:to.y}];};'+
  'let blocked=function(x,y){return S.fromBlocked&&x===1&&y===1;};'+(withOverlay?src:'')+';return {fp:(a,b,r,rad)=>findPath(a,b,r,rad),st:v=>{time=v;}};');
 const G=f(W,{getItem:()=>null,setItem(){}},{now:()=>S.clock},room,S,alt,player);return {S,G,room,alt,W,player};}
{const {S,G,alt,player}=world(false);for(let i=0;i<8;i++){S.clock+=1500;G.fp(player,alt,undefined,.31);}assert.strictEqual(S.calls,8);ok('옛 코드: 1.5초마다 다시 물으면 매번 전체 탐색(8/8)');}
{const {S,G,alt,player}=world(true);for(let i=0;i<8;i++){assert.deepStrictEqual(G.fp(player,alt,undefined,.31),[]);S.clock+=1500;}assert.strictEqual(S.calls,2);ok('ep1b01: 진짜 길 없음은 6초 기억(12초 동안 8번 묻고 탐색 2번)');}
for(const z of ['ep1a11','u206','dist02','kair04']){const {S,G,alt,player}=world(true,{zone:z});G.fp(player,alt);S.clock+=1500;G.fp(player,alt);assert.strictEqual(S.calls,1);}ok('다른 지역(ep1a11·u206·dist02·kair04)도 같게 기억');
{const {S,G,alt,player}=world(true);G.fp(player,alt);S.clock+=6001;G.fp(player,alt);assert.strictEqual(S.calls,2);ok('6초가 지나면 다시 탐색');}
{const {S,G,alt,player}=world(true);G.fp(player,alt);S.phase='door';S.open=true;const p=G.fp(player,alt);assert.strictEqual(S.calls,2);assert.strictEqual(p.length,1);ok('R78 단계가 바뀌면 곧바로 다시 찾고 길을 돌려줌');}
{const {S,G,alt,player}=world(true);G.fp(player,alt);S.gen=1;G.fp(player,alt);assert.strictEqual(S.calls,2);ok('R74 문 세대가 바뀌면 곧바로 다시 탐색');}
{const {S,G,alt,player}=world(true,{zone:'ep1a08'});G.fp(player,alt);S.hosp='boss';G.fp(player,alt);assert.strictEqual(S.calls,2);ok('병원 단계가 바뀌면 곧바로 다시 탐색');}
{const {S,G,alt,player,room}=world(true);G.fp(player,alt);room.engaged=true;G.fp(player,alt);assert.strictEqual(S.calls,2);ok('room.engaged 가 바뀌면 곧바로 다시 탐색');}
{const {S,G,alt,player,room}=world(true);G.fp(player,alt);room.exploration={};G.fp(player,alt);assert.strictEqual(S.calls,2);ok('탐색 레이아웃 객체가 바뀌면(R204) 곧바로 다시 탐색');}
{const {S,G,alt,player}=world(true);G.fp(player,alt);player.x+=5;G.fp(player,alt);assert.strictEqual(S.calls,1);player.x+=4;G.fp(player,alt);assert.strictEqual(S.calls,2);ok('영웅이 걸어서 5칸: 그대로, 기억한 자리에서 8칸 넘게 벗어나면(순간이동) 다시 탐색');}
{const {S,G,alt,player}=world(true);G.fp(player,alt,undefined,.31);G.fp(player,alt,undefined,.29);assert.strictEqual(S.calls,2);ok('반지름이 열쇠에 들어감');}
{const {S,G,alt,player}=world(true);G.fp(player,alt);G.fp(player,{x:16,y:13});assert.strictEqual(S.calls,2);ok('다른 도착 칸은 따로');}
{const {S,G,alt,player}=world(true);S.fromBlocked=true;player.x=1;player.y=1;G.fp(player,alt);G.fp(player,alt);assert.strictEqual(S.calls,2);ok('막힌 칸에서 떠난 값싼 실패는 기억하지 않음');}
{const {S,G,player}=world(true);const t={x:40,y:40};G.fp(player,t);G.fp(player,t);assert.strictEqual(S.calls,2);ok('길이 있는 결과는 기억하지 않음');}
{const {S,G,alt}=world(true);const mob={x:22,y:40};G.fp(mob,alt);G.fp(mob,alt);G.fp({x:23,y:41},alt);assert.strictEqual(S.calls,3);ok('몹 자리에서 떠나는 길 찾기는 기억하지 않음(R74 예산 미룸을 길 없음으로 굳히지 않음)');}
{const {S,G,alt,player,room}=world(true);const other={id:'x',engaged:false,exploration:{}};G.fp(player,alt,room);G.fp(player,alt,other);assert.strictEqual(S.calls,2);ok('방마다 따로 기억');}
{const {S,G,alt,player,W}=world(true);G.fp(player,alt);const A=W.__STORYWORLD_PERF_R979__,I=A.inspect();assert.strictEqual(I.stats.stored,1);assert.strictEqual(I.lastError,null);A.set(false);G.fp(player,alt);assert.strictEqual(S.calls,2);A.set(true);ok('inspect·끄기 스위치');}
{const {S,G,alt,player}=world(true);assert.deepStrictEqual(G.fp(player,{x:NaN,y:1}),[{x:NaN,y:1}]);assert.deepStrictEqual(G.fp(null,alt),[]);ok('이상한 인자는 엔진으로 그대로 넘김');}
{const {S,G,alt,player}=world(true);G.st(100);G.fp(player,alt);S.clock+=60000;G.st(105.9);G.fp(player,alt);assert.strictEqual(S.calls,1);G.st(106.1);G.fp(player,alt);assert.strictEqual(S.calls,2);ok('게임 시간이 있으면 게임 시간 6초로 잼(실제 시간 60초가 지나도 게임 5.9초면 기억)');
 G.st(3);G.fp(player,alt);assert.strictEqual(S.calls,3);ok('게임 시간이 되감기면(새 판) 다시 탐색');}
console.log(`\nR979 CPU: ${n} passed`);
