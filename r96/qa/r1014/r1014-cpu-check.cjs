// R1014 무한생존 중간보스가 체력 70% 에서 안 죽던 멈춤(2026-11-13 실플레이 검증, 공개본 13단계 ep1b01 '교만의 잔향 · 제72문', 이어 온 판 5번 중 4번).
//  원인: 엔진 중간보스 단계 문턱(index.html sourceMidbossDamageLimit5)은 한 번의 타격이 문턱(floor(maxHp×0.7))을 넘지 못하게 문턱까지만 깎는다.
//   생존 보스 초당 피해 상한(R960 guardBossHp, 1초에 최대 체력 6%)과 겹치면 6% 다섯 번이 정확히 70% 에 닿는데, 소수 오차로 체력이 문턱보다 7e-12 높게 남는다.
//   → 문턱 계산은 '아직 문턱 위'라 피해를 7e-12 로 줄이고, 상한 쪽은 1e-9 아래 피해를 버린다 → 어떤 공격으로도 체력이 안 줄고 단계도 안 넘어간다.
//  고침(survival-r600.js guardBossHp 안): 예산이 요청보다 1e-6 미만 모자라면 요청값 그대로, 1e-6 이하의 아주 작은 감소는 예산과 상관없이 그대로 적용.
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const file=process.env.SRC||path.join(root,'client-source','survival-r600.js');const sv=fs.readFileSync(file,'utf8');
if(!process.env.SRC){assert.strictEqual(sv,fs.readFileSync(path.join(root,'runtime-text','survival-r600.js'),'utf8'));ok('client-source and runtime copies agree');}
const win={};const doc={getElementById:()=>null,createElement:()=>({}),addEventListener:()=>{},head:{appendChild(){}},body:{appendChild(){}},querySelectorAll:()=>[]};
new Function('window','document','localStorage',sv)(win,doc,{getItem:()=>null,setItem(){}});const P=win.__STORYWORLD_SURVIVAL_R600__.pure;
assert.strictEqual(typeof P.guardBossHp,'function');assert.strictEqual(P.BOSS_DPS_CAP,.06);
// 엔진 문턱 식이 그대로인지(이 검사의 흉내가 실제 엔진과 같은지)
const html=fs.readFileSync(path.join(root,'runtime-text','index.html'),'utf8');
assert(html.includes('gateHp = Math.max(1, Math.floor(finite(enemy.maxHp, 1) * threshold));'),'engine gate formula');
assert(html.includes('return hp > gateHp && hp - damage <= gateHp ? hp - gateHp : damage;'),'engine gate truncation');
assert(html.includes('while (phase < thresholds.length && ratio <= finite(thresholds[phase], -1)) phase++;'),'engine phase rule');ok('engine mid-boss phase gate is the one this check imitates');
// 엔진 흉내: 중간보스(사람 단계 0, 문턱 [.7,.36]) 한 대
const TH=[.7,.36];
function phaseOf(e){const r=e.hp/Math.max(1,e.maxHp);let p=0;while(p<TH.length&&r<=TH[p])p++;return Math.min(2,p);}
function hit(e,value){e.phase=Math.max(e.phase,phaseOf(e));const thr=TH[e.phase]||0;let dmg=value;
 if(thr>0){const gate=Math.max(1,Math.floor(e.maxHp*thr));if(e.hp>gate&&e.hp-dmg<=gate)dmg=e.hp-gate;}
 if(!(dmg>0))return false;const applied=Math.min(e.hp,dmg);e.hp-=applied;e.phase=Math.max(e.phase,phaseOf(e));return true;}
function fight(maxHp,dmg,step,sec){let now=0;const e={hp:maxHp,maxHp,phase:0};P.guardBossHp(e,()=>now);const trace=[[0,e.hp]];
 for(;now<=sec&&e.hp>0;now=+(now+step).toFixed(6)){hit(e,dmg);trace.push([now,e.hp]);}return{e,now,trace};}
// ① 실제로 멈췄던 값: 최대 체력 27060·30360, 한 대가 6% 를 넘는 영웅(777 코드·후반 영웅)
for(const mh of [27060,30360]){const r=fight(mh,1e7,.25,40);assert(r.e.hp<=0,`maxHp ${mh}: boss must die, stuck at ${r.e.hp} (${(r.e.hp/mh*100).toFixed(4)}%) phase ${r.e.phase}`);
 assert(r.now>=1/0.06-1.5,'cap still holds (>= ~16s)');}ok('mid-boss with maxHp 27060 / 30360 dies under 6%-capped hits (was stuck at exactly 70%)');
// ② 넓게: 최대 체력·타격 크기·타격 간격을 바꿔도 멈춤 없음
{let cnt=0;for(let mh=1000;mh<=60000;mh+=10)for(const [dmg,step] of [[1e7,.25],[mh*.06,1],[mh*.061,.5],[mh*.03,.5],[mh*.02,1/3]]){const r=fight(mh,dmg,step,120);
  assert(r.e.hp<=0,`maxHp ${mh} dmg ${dmg} step ${step}: stuck at ${r.e.hp} phase ${r.e.phase}`);cnt++;}ok('no stall over '+cnt+' maxHp / hit size / hit rate combinations');}
// ③ 상한은 그대로: 어느 1초 창에서도 체력 감소가 6% 를 넘지 않는다(오차 1e-5)
for(const mh of [27060,30360,9174,12345]){const r=fight(mh,1e7,.1,40);const t=r.trace;for(let i=0;i<t.length;i++)for(let j=i+1;j<t.length&&t[j][0]-t[i][0]<1-1e-9;j++){
  assert(t[i][1]-t[j][1]<=mh*.06+1e-5,`maxHp ${mh}: lost ${t[i][1]-t[j][1]} within 1s`);}}ok('6% per second cap is unchanged');
// ④ 기존 동작: 치유는 안 막고, 예산보다 작은 마지막 체력은 그대로 죽는다, NaN 무시
{let now=0;const e={hp:1000,maxHp:1000};P.guardBossHp(e,()=>now);e.hp-=500;assert.strictEqual(e.hp,940);e.hp+=30;assert.strictEqual(e.hp,970);e.hp=NaN;assert.strictEqual(e.hp,970);
 const f={hp:30,maxHp:1000};P.guardBossHp(f,()=>now);f.hp-=30;assert.strictEqual(f.hp,0);ok('heal passes, small last hp dies, NaN ignored');}
console.log('ALL PASS '+n);
