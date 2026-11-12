// R850 무한 생존 실플레이 수정 CPU 검사: ① 생존 무대 지형 잠금(지역 스크립트가 room.exploration 을 바꿔 끼우지 못함)
//  ② 병원 미로 진행이 생존 방(ep1a08 같은 id)을 건너뜀 ③ 정화 완료 때 다음 지역 그림 미리 읽기 ④ 전환 중 HUD '다음 지역으로 이동'.
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const CS=f=>fs.readFileSync(path.join(root,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(root,'runtime-text',f),'utf8');
const sv=CS('survival-r600.js'),hm=CS('hospital-maze-progression.js');
assert.strictEqual(sv,RT('survival-r600.js'));assert.strictEqual(hm,RT('hospital-maze-progression.js'));ok('client-source and runtime copies agree');
// ① 지형 잠금: 함수를 떼어 실제로 돌려 본다
{const m=sv.match(/function guardTerrain\(r,L\)\{[\s\S]*?\}\}\);\}catch\(e\)\{fail\(e\);\}\}/);assert(m,'guardTerrain present');
 const stats={},fail=e=>{throw e;};const guardTerrain=new Function('stats','fail',m[0]+';return guardTerrain;')(stats,fail);
 const L={walls:[1,2,3,4],survivalR600:{}},other={walls:new Array(193)},r={id:'ep1a08',exploration:{old:1}};guardTerrain(r,L);
 assert.strictEqual(r.exploration,L);r.exploration=other;assert.strictEqual(r.exploration,L);assert.strictEqual(stats.terrainGuard,1);
 r.exploration=L;assert.strictEqual(stats.terrainGuard,1);/* 같은 지형을 다시 넣는 것은 세지 않음 */
 r.exploration.walls.push(5);assert.strictEqual(r.exploration.walls.length,5);/* 같은 객체 안 손질은 막지 않음 */
 assert(Object.keys(r).includes('exploration'));assert.strictEqual(JSON.parse(JSON.stringify({e:r.exploration})).e.walls.length,5);
 assert(/survivalR600:\{roster:R,centre:c,arena:L\.survivalR600\.arena\}\};\n guardTerrain\(r,L\);return r;\}/.test(sv));ok('survival room terrain is locked: foreign layouts are ignored and counted, same-object edits allowed, still enumerable');}
// ② 병원 미로 진행 술어
{const m=hm.match(/const hospital=r=>[^;]*;/);assert(m);const solo=()=>true;const hospital=new Function('solo','return ('+m[0].slice('const hospital='.length,-1)+');')(solo);
 assert.strictEqual(hospital({id:'ep1a08',layer:'STORY'}),true);assert.strictEqual(hospital({id:'ep1a08',layer:'STORY',survivalR600:{}}),false);
 assert.strictEqual(hospital({id:'ep1a08',layer:'DREAM'}),false);assert.strictEqual(hospital({id:'ep1a08',layer:'STORY',egoVisitId151:'x'}),false);assert.strictEqual(hospital({id:'dist00',layer:'STORY'}),false);assert.strictEqual(hospital(null),false);
 ok('hospital maze progression keeps story ep1a08 and skips the survival arena (and DREAM/EGO visits)');}
// ③ 미리 읽기: 정화 완료로 바뀌는 그 자리에서 한 번
{assert(/if\(S\.phase==='clear'\)\{S\.clearAt=t\+CLEAR_WAIT;stats\.clears\+\+;prefetchNext\(\);/.test(sv));
 const m=sv.match(/function prefetchNext\(\)\{[\s\S]*?catch\(e\)\{fail\(e\);\}\}/);assert(m);
 const calls=[];const stats={};const S={i:3,loop:0,ids:['a','b','c','d','e']};const regionById={e:{paths:['m1','m2']}};
 const W={__STORYWORLD_WORLD_R74__:{assetPaths:(id,l)=>id==='e'&&l==='STORY'?['w1']:[]}};const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
 const advance=(i,loop,n)=>i+1>=n?{i:0,loop:loop+1}:{i:i+1,loop};
 const run=(S2,ens)=>new Function('S','stats','regionById','window','G','advance','ensureImages','fail',m[0]+';prefetchNext();')(S2,stats,regionById,W,G,advance,ens,e=>{throw e;});
 run(S,l=>{calls.push(l);return Promise.resolve(l.length);});assert.deepStrictEqual(calls[0],['m1','m2','w1']);assert.strictEqual(stats.prefetch,1);
 // 마지막 지역이면 처음 지역(회차 넘김)을 미리 읽는다
 regionById.a={paths:['a1']};run({i:4,loop:2,ids:S.ids},l=>{calls.push(l);return Promise.resolve();});assert.deepStrictEqual(calls[1],['a1']);
 // 실패는 삼키고 센다(엔진이 넘어갈 때 다시 읽는다)
 run(S,()=>Promise.reject(new Error('404')));ok('next stage art is prefetched once on clear (wraps to the first stage at the end); failures are swallowed');}
// ④ 전환 HUD
{assert(/S\.moving=String\(def\.title\|\|''\);hud\(true\);/.test(sv)&&/S\.moving='';if\(!ok\|\|/.test(sv));
 assert(/if\(on&&S\?\.active&&S\.moving&&!S\.over\)\{hudEl\.querySelector\('\.s'\)\.textContent='무한 생존 · 다음 지역으로 이동 · '\+S\.moving;/.test(sv));ok('HUD shows "moving to next stage" from go() until the stage is entered (cleared on success and failure)');}
// ⑤ 밸런스(사용자 11-12 02:07Z '밸런스도 맞춰줘 특히 보스들'): 실측 — 보스 체력이 원래 체력(약 1,100)에 묶여 대부분 1~2초에 죽고,
//  원래 체력이 큰 보스(ep1a08 집도의)만 13초 걸렸다. 보스·중간보스 체력은 영웅 공격력 기준으로 같게, 피해는 지역·회차로 오르게.
{const win={};const doc={getElementById:()=>null,createElement:()=>({}),addEventListener:()=>{},head:{appendChild(){}},body:{appendChild(){}},querySelectorAll:()=>[]};
 new Function('window','document','localStorage',sv)(win,doc,{getItem:()=>null,setItem(){}});const P=win.__STORYWORLD_SURVIVAL_R600__.pure;
 assert.strictEqual(typeof P.bossStats,'function');assert.strictEqual(typeof P.mobDamage,'function');
 const per=(i,l,d,atk,major)=>P.bossStats(i,l,d,atk,major,8).hp/(atk*P.hpMul(i,l,d));
 for(const i of [0,7,30,55])for(const atk of [40,95,214]){const b=per(i,0,'normal',atk,true),m=per(i,0,'normal',atk,false);
  assert(b>=100&&b<=130,'boss hp per atk '+b);assert(m>=45&&m<=65,'mid hp per atk '+m);assert(b>=1.8*m);}
 assert(P.bossStats(0,0,'normal',95,true,8).hp>=9500,'first boss no longer capped near its native ~1,100 hp');
 assert(P.bossStats(0,0,'hard',95,true,8).hp>P.bossStats(0,0,'normal',95,true,8).hp);assert(P.bossStats(0,1,'normal',95,true,8).hp>P.bossStats(0,0,'normal',95,true,8).hp*1.5);
 const D=(i,l,d)=>P.bossStats(i,l,d,95,true,10).dmg;assert(Math.abs(D(0,0,'normal')-10)<1e-9);assert(D(55,0,'normal')>=D(0,0,'normal')*1.7);assert(D(0,1,'normal')>=D(0,0,'normal')*1.2);
 assert(D(0,0,'nightmare')>D(0,0,'normal')&&D(0,0,'easy')<D(0,0,'normal'));assert(P.bossStats(0,0,'normal',95,true,0).dmg>0);
 const M=(i,e,l)=>P.mobDamage(8,e,i,l,'normal');assert(M(0,false,0)>8*.55&&M(0,false,0)<=8*.8);assert(M(0,true,0)>M(0,false,0));assert(M(55,false,0)>=M(0,false,0)*1.7);assert(M(0,false,1)>=M(0,false,0)*1.2);
 assert(!/Math\.min\(e\.maxHp/.test(sv),'boss hp not capped by native hp');assert(/const B=bossStats\(S\.i,S\.loop,S\.diff,S\.atkAvg>0\?S\.atkAvg:baseAtk\(\),!!R\.boss,e\.damage\);/.test(sv));assert(/S\.atkAvg=smoothAtk\(S\.atkAvg,baseAtk\(\),dt\);/.test(sv));
 {let v=P.smoothAtk(undefined,100,1/30);assert.strictEqual(v,100);for(let k=0;k<30*3;k++)v=P.smoothAtk(v,150,1/30);assert(v>100&&v<120,'3s buff moves the average only a little '+v);for(let k=0;k<30*60;k++)v=P.smoothAtk(v,150,1/30);assert(v>145);assert.strictEqual(P.smoothAtk(120,NaN,1/30),120);}assert(/e\.damage=mobDamage\(e\.damage,elite,S\.i,S\.loop,S\.diff\);/.test(sv));
 ok('boss/mid hp follow hero attack (not native hp), boss and mob damage rise with stage, loop and difficulty');}
assert(fs.readFileSync(path.join(root,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r850/r850-cpu-check.cjs'));ok('Pages CPU step');
console.log('R850 CPU check passed '+n);
