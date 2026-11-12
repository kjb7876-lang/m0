// R960 무한 생존 보스 체력 하한(사용자 11-12 14:05Z "무한생존모드 보스몹 체력 최소 그맵의 일반몹66배"):
//  보스·중간보스 체력 >= 66 × 같은 지역·회차·난이도·공격력 기준 일반몹 체력. 스토리 모드는 건드리지 않는다.
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const sv=fs.readFileSync(path.join(root,'client-source','survival-r600.js'),'utf8');
assert.strictEqual(sv,fs.readFileSync(path.join(root,'runtime-text','survival-r600.js'),'utf8'));ok('client-source and runtime copies agree');
const win={};const doc={getElementById:()=>null,createElement:()=>({}),addEventListener:()=>{},head:{appendChild(){}},body:{appendChild(){}},querySelectorAll:()=>[]};
new Function('window','document','localStorage',sv)(win,doc,{getItem:()=>null,setItem(){}});const P=win.__STORYWORLD_SURVIVAL_R600__.pure;
assert.strictEqual(typeof P.mobHp,'function','pure.mobHp exposed');assert.strictEqual(P.BOSS_MIN_MULT,66);
const diffs=['easy','normal','hard','nightmare'].filter(d=>P.diffOf(d)&&P.DIFFS[d]);assert(diffs.length>=3);
// 하한: 모든 지역·회차·난이도·공격력에서 보스·중간보스 모두 일반몹의 66배 이상
{let cnt=0;for(const i of [0,1,7,20,30,55])for(const l of [0,1,3])for(const d of diffs)for(const atk of [1,8,40,95,214,900]){
  const mob=P.mobHp(i,l,d,atk,false);assert(mob>=1);
  for(const major of [true,false]){const b=P.bossStats(i,l,d,atk,major,8).hp;assert(b>=66*mob-1e-6,`i${i} l${l} ${d} atk${atk} major${major}: boss ${b} < 66×${mob}`);cnt++;}}
 ok('boss and mid-boss hp >= 66 x normal mob hp over '+cnt+' stage/loop/difficulty/attack combos (incl. atk 1 -> clamped to 8)');}
// 회귀: 이미 66배를 넘는 보스(×100)는 그대로, 중간보스는 하한으로 올라간다(예전 ×50 은 일반몹의 40배였다)
{const m=P.mobHp(0,0,'normal',95,false),old=95*100*P.hpMul(0,0,'normal');assert.strictEqual(P.bossStats(0,0,'normal',95,true,8).hp,Math.round(old));
 assert(P.bossStats(0,0,'normal',95,false,8).hp>=66*m&&P.bossStats(0,0,'normal',95,false,8).hp>Math.round(95*50*P.hpMul(0,0,'normal')));
 assert(P.bossStats(0,0,'normal',95,true,8).hp>=P.bossStats(0,0,'normal',95,false,8).hp,'boss never weaker than mid-boss');ok('boss keeps its x100 hp; mid-boss is raised to the floor; boss >= mid');}
// 경계: 일반몹은 정예(짙은 형상)가 아닌 기본 몹 기준, 몹 체력은 지금 swarm 식(공격력×1.25×지역·회차·난이도 배율)과 같다
{assert.strictEqual(P.mobHp(3,1,'hard',100,false),Math.max(1,Math.round(100*1.25*P.hpMul(3,1,'hard'))));assert(P.mobHp(3,1,'hard',100,true)>P.mobHp(3,1,'hard',100,false));
 assert(/e\.maxHp=e\.hp=mobHp\(S\.i,S\.loop,S\.diff,atk,elite\);/.test(sv),'swarm uses mobHp');ok('mobHp matches the swarm formula and swarm uses it');}
// 보스가 나오는 순간 몹 공격력이 순간 강화로 더 높아도 하한이 지켜진다(mobAtk 인자)
{const smooth=60,instant=150;const b=P.bossStats(5,0,'normal',smooth,true,8,instant).hp;assert(b>=66*P.mobHp(5,0,'normal',instant,false));
 assert(P.bossStats(5,0,'normal',smooth,false,8,instant).hp>=66*P.mobHp(5,0,'normal',instant,false));
 assert.strictEqual(P.bossStats(5,0,'normal',smooth,true,8).hp,P.bossStats(5,0,'normal',smooth,true,8,0).hp);
 assert(/bossStats\(S\.i,S\.loop,S\.diff,S\.atkAvg>0\?S\.atkAvg:baseAtk\(\),!!R\.boss,e\.damage,baseAtk\(\)\)/.test(sv),'bossIn passes live mob attack');ok('floor uses the larger of smoothed and live attack, so it holds when a buff is on');}
// 생존 전용: 스토리 모드 전투 코드는 이 변경에서 건드리지 않았다(survival 파일 밖에서 BOSS_MIN_MULT 를 안 쓴다)
{const other=fs.readdirSync(path.join(root,'client-source')).filter(f=>f.endsWith('.js')&&f!=='survival-r600.js');
 const hit=other.filter(f=>fs.readFileSync(path.join(root,'client-source',f),'utf8').includes('BOSS_MIN_MULT'));assert.deepStrictEqual(hit,[]);ok('story mode untouched: BOSS_MIN_MULT only in survival-r600.js');}
// ⑥ 보스 초당 피해 상한(사용자 11-12 14:10Z '보스는 무한생존모드에서 1초에 최대 체력의 6프로 이상 데미지가 입지 않음'):
//  hitEnemy 감싸기 순서(패시브 #497~#501·연쇄 번개 등)에 기대지 않도록 보스 몸의 hp 를 접근자로 잠가 모든 감소가 1초 창 예산(6%)을 거친다.
{assert.strictEqual(P.BOSS_DPS_CAP,.06);assert.strictEqual(typeof P.guardBossHp,'function');
 let now=0;const mk=()=>{const e={hp:1000,maxHp:1000};P.guardBossHp(e,()=>now);return e;};
 // 한 프레임에 패시브 폭발이 한꺼번에(2% × 20번 = 40%) 들어와도 6% 만 깎인다 — hitEnemy 를 거치지 않는 직접 감소도 같다
 {now=0;const e=mk();for(let k=0;k<20;k++)e.hp-=20;assert(Math.abs(e.hp-940)<1e-6,'burst limited to 6%: '+e.hp);e.hp-=500;assert(Math.abs(e.hp-940)<1e-6);e.hp=Math.min(e.hp,e.maxHp);}
 // 1초가 지나면 예산이 다시 열린다(경계: 정확히 1초 뒤)
 {now=0;const e=mk();e.hp-=1000;assert(Math.abs(e.hp-940)<1e-6);now=.999;e.hp-=10;assert(Math.abs(e.hp-940)<1e-6,'still inside the window');now=1;e.hp-=1000;assert(Math.abs(e.hp-880)<1e-6,'window slid: '+e.hp);}
 // 어느 1초 창에서도 합계가 6% 를 넘지 않는다(0.05초마다 5%씩 — 초당 100%) · 치유는 막지 않는다
 {now=0;const e=mk();const log=[];let last=e.hp;for(let k=0;k<200;k++){now=k*.05;const b=e.hp;e.hp-=50;log.push({t:now,d:b-e.hp});}
  for(const x of log){const sum=log.filter(y=>y.t>x.t-1+1e-9&&y.t<=x.t+1e-9).reduce((a,y)=>a+y.d,0);assert(sum<=60+1e-6,'window sum '+sum+' at '+x.t);}
  assert(e.hp>0&&e.hp<1000);const h=e.hp;e.hp=h+100;assert.strictEqual(e.hp,h+100,'heal passes');}
 // 마지막 체력이 예산보다 작으면 죽을 수 있다 · 0 이하 정리 · 비유한 값은 무시
 {now=0;const e={hp:30,maxHp:1000};P.guardBossHp(e,()=>now);e.hp-=30;assert.strictEqual(e.hp,0);const f=mk();f.hp=NaN;assert(Number.isFinite(f.hp));}
 // 작은 맞음은 그대로, 읽은 값을 복사해도 숫자로 남는다(열거 가능)
 {now=5;const e=mk();e.hp-=10;assert.strictEqual(e.hp,990);assert.strictEqual({...e}.hp,990);assert(Object.keys(e).includes('hp'));}
 assert(/e\.r600Boss=true;P?[\s\S]{0,40}guardBossHp\(e,/.test(sv)||/guardBossHp\(e,\(\)=>G\(\(\)=>time,0\)\)/.test(sv),'bossIn locks boss hp');
 ok('boss hp locked to 6% per second sliding window: burst, direct writes, boundary, sustained fire, heals, last hit, survival bosses only');}
console.log('R960 CPU check passed '+n);
