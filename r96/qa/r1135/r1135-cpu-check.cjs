// R1135 무한생존 난이도별 동시 보스 수(쉬움 1·보통 2·어려움 3·악몽 6)와 마릿수 밸런스 — CPU 검사.
// 사용자 2026-11-18 01:24Z "생존모드 이지 노멀 하드 헬 고르는거 보스들 1,2,3,6마리 나오게 해줘" + "그에 맞게 밸런스도 조절해주고".
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const file=path.join(__dirname,'../../client-source/survival-r600.js'),src=fs.readFileSync(file,'utf8');
const g={document:{getElementById:()=>null,createElement:()=>({}),querySelectorAll:()=>[],addEventListener(){},head:{appendChild(){}},body:{appendChild(){}}},localStorage:{getItem:()=>null}};g.window=g;
vm.runInNewContext(src,g);const P=g.__STORYWORLD_SURVIVAL_R600__.pure;let n=0;const ok=m=>{n++;console.log('ok',n,m);};
// 1. 마릿수
assert.equal(typeof P.bossPlan,'function','pure.bossPlan 있음');
assert.deepEqual(['easy','normal','hard','nightmare'].map(d=>P.bossPlan(d).n),[1,2,3,6]);ok('쉬움1·보통2·어려움3·악몽6');
assert.equal(P.bossPlan('없는값').n,2);assert.equal(P.bossPlan(undefined).n,2);assert.equal(P.bossPlan('__proto__').n,2);ok('모르는 난이도는 보통(2)');
// 2. 쉬움(1마리)은 예전 값 그대로(회귀)
for(const [i,l,atk] of [[0,0,40],[12,0,95],[40,1,300],[71,3,1200]])for(const major of [true,false]){
 const B=P.bossStats(i,l,'easy',atk,major,20,atk),fl=66*P.mobHp(i,l,'easy',atk,false),s=P.bossShare(B,'easy',fl);
 assert.equal(s.hp,B.hp);assert.equal(s.dmg,B.dmg);}
ok('쉬움 1마리: 체력·피해 예전과 같음');
// 3. 밸런스: 한 마리 체력·피해는 줄지만 66배 하한(사용자 R960 규칙)은 지킨다. 합계는 난이도 따라 늘어남.
let cnt=0;for(const d of Object.keys(P.DIFFS))for(const i of [0,5,20,55,71])for(const l of [0,1,4])for(const atk of [8,40,95,300,2000])for(const major of [true,false]){
 const B=P.bossStats(i,l,d,atk,major,30,atk),fl=66*P.mobHp(i,l,d,atk,false),s=P.bossShare(B,d,fl),p=P.bossPlan(d);
 assert.ok(Number.isFinite(s.hp)&&Number.isFinite(s.dmg)&&s.hp>0&&s.dmg>0,`${d} i${i} 유한`);
 /* 사용자 11-18 02:12Z '일반몹의 66배 이상 이거 깨도 됨': 여러 마리일 때 한 마리 체력 = 1마리 체력 × 배율(하한 없음). 1마리는 그대로 */
 assert.equal(s.hp,Math.max(1,Math.round(B.hp*p.hp)),`${d} i${i}: 한 마리 체력 = 1마리 × ${p.hp}`);
 assert.ok(s.hp<=B.hp,`${d}: 한 마리 체력이 1마리일 때보다 크면 안 됨`);
 assert.ok(s.dmg<=B.dmg+1e-9&&s.dmg>=B.dmg*.4-1e-9,`${d}: 한 마리 피해 ${s.dmg} 범위`);
 assert.equal(Math.round(s.hp),s.hp,'체력 정수');cnt++;}
ok('한 마리 체력 = 1마리×배율·정수·유한 '+cnt+'조합');
// 합계(보스 몸 체력 합·초당 피해 합)는 쉬움<보통<어려움<악몽, 악몽 합계 피해가 1마리의 3.5배를 넘지 않음
{const order=['easy','normal','hard','nightmare'];for(const major of [true,false]){let prevHp=0,prevDmg=0;for(const d of order){
 const atk=95,B=P.bossStats(20,0,d,atk,major,30,atk),s=P.bossShare(B,d,66*P.mobHp(20,0,d,atk,false)),N=P.bossPlan(d).n;
 const one=P.bossStats(20,0,'normal',atk,major,30,atk);const th=N*s.hp/one.hp,td=N*s.dmg/one.dmg;
 assert.ok(th>prevHp&&td>prevDmg,`${d} 합계가 앞 난이도보다 큼 (${th.toFixed(2)},${td.toFixed(2)})`);assert.ok(td<=3.5*1.6+1e-9,`${d} 합계 피해 ${td}`);prevHp=th;prevDmg=td;}}
 ok('합계 체력·피해 단조 증가, 악몽 합계 피해 ≤ 1마리 보통의 5.6배');}
// 합계 체력 = 같은 난이도 1마리의 1·1.7·2.1·3배(66배 하한 해제, 사용자 11-18 02:12Z)
for(const [d,want] of [['easy',1],['normal',1.7],['hard',2.1],['nightmare',3]])for(const major of [true,false]){const B=P.bossStats(20,0,d,95,major,30,95),s=P.bossShare(B,d,B.floor),N=P.bossPlan(d).n;assert.ok(Math.abs(N*s.hp/B.hp-want)<.01,`${d} 합계 ${N*s.hp/B.hp}`);}
ok('합계 체력 1마리의 1·1.7·2.1·3배');
// 코어 회복(보스 처치 보상)은 마릿수로 나눠 합계를 유지
for(const d of Object.keys(P.DIFFS)){const p=P.bossPlan(d);assert.ok(Math.abs(p.heal*p.n-15)<1e-9,`${d} 코어 회복 합 15`);}ok('보스 처치 코어 회복 합계 15배 유지');
// 4. 자리: n 개 서로 2.5칸 이상 떨어지고 경기장 안·막힌 칸 아님. 막힌 곳이 많아도 n 개를 돌려 줌.
assert.equal(typeof P.bossSpots,'function');
const A={x0:2,y0:2,x1:40,y1:30},C={x:20,y:16};let seed=7;const rng=()=>((seed=(seed*16807)%2147483647)/2147483647);
for(const N of [1,2,3,6])for(const [cx,cy] of [[20,16],[3,3],[39,29],[20,3]]){const c={x:cx,y:cy};const pts=P.bossSpots(c,N,A,7,9,()=>true,rng);
 assert.equal(pts.length,N);for(const q of pts){assert.ok(q.x>=A.x0+.8&&q.x<=A.x1-.8&&q.y>=A.y0+.8&&q.y<=A.y1-.8,'경기장 안');}
 for(let a=0;a<N;a++)for(let b=a+1;b<N;b++)assert.ok(Math.hypot(pts[a].x-pts[b].x,pts[a].y-pts[b].y)>=2.5-1e-9,`N${N} (${cx},${cy}) 겹침 ${a},${b}`);}
ok('보스 자리 서로 2.5칸 이상·경기장 안(가운데·구석)');
{const pts=P.bossSpots(C,6,A,7,9,q=>q.x<20,rng);assert.equal(pts.length,6);assert.ok(pts.every(q=>q.x<20),'막힌 칸 피함');ok('절반이 막혀도 6자리 모두 열린 칸');}
{const pts=P.bossSpots(C,6,A,7,9,()=>false,rng);assert.equal(pts.length,6);assert.ok(pts.every(q=>Number.isFinite(q.x)&&Number.isFinite(q.y)));ok('모두 막혀도 6자리(가운데 근처 대체)');}
// 5. bossIn 이 마릿수만큼 소환하고, R960 체력 잠금·기존 bossStats 호출은 그대로
assert.ok(/bossStats\(S\.i,S\.loop,S\.diff,S\.atkAvg>0\?S\.atkAvg:baseAtk\(\),!!R\.boss,e\.damage,baseAtk\(\)\)/.test(src),'R960 호출 문자열 유지');
assert.ok(/function bossIn\(\)[\s\S]{0,900}bossPlan\(S\.diff\)/.test(src),'bossIn 이 bossPlan 사용');
assert.ok(/function bossIn\(\)[\s\S]{0,1600}guardBossHp\(/.test(src),'보스마다 6% 잠금');
ok('bossIn 연결');
// 6. 난이도 고르기 화면에 보스 수 표시
assert.ok(/보스 '\+bossPlan\(id\)\.n\+'마리/.test(src),'난이도 카드에 보스 N마리');ok('난이도 카드 표시');
console.log('R1135 CPU 검사 통과',n);
