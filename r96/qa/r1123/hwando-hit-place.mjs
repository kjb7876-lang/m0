// R1123 환도 기본 공격 적중 이펙트 자리 — 실제 엔진(헤드리스 소프트웨어 렌더링) 재현 검사.
//  사용자 2026-11-17 09:51Z "환도영웅 이펙트 적중 이상한곳에서 나오는 버그 특히 기본공격".
//  엔진 basicAttack 은 조준 대상(target = 적 id)이 사거리 안이면 그 적을, 아니면 가장 가까운 적을 벤다(벽 너머 제외).
//  환도 기본 공격에 붙은 그림(R1034 먹 검흔·R945 묵월·R590 발도 베기)은 실제로 벤 적 쪽에 나와야 한다.
//  장면: 영웅 뒤 1.4칸에 가까운 적 N, 앞 2.6칸에 조준한 적 T(target=T.id). 엔진은 T 쪽을 베고 N 은 안 맞는다.
//  실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1123/hwando-hit-place.mjs
import {chromium,boot,go} from '../r444/lib.mjs';
let n=0,bad=0;const ok=(c,m)=>{if(c){n++;console.log('PASS',m);}else{bad++;console.log('FAIL',m);}};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360},init:{'storyworld.r663.skillgrowth':JSON.stringify({on:false})}});
await go(p,process.env.ZONE||'ep1a08');
const setup=await p.evaluate(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));if(player.hero!=='hwando'){await switchHero('hwando');await wait(800);}modal=null;player.hp=player.maxHp=99999;
 const okp=(x,y)=>!blocked(x,y,.45,room);let spot=null;
 for(let k=0;k<6000&&!spot;k++){const x=4+Math.random()*(room.w||60),y=4+Math.random()*(room.h||60);if(!okp(x,y))continue;let g=true;for(let i=0;i<14&&g;i++){const a=i/14*Math.PI*2;for(const r of [1.4,2.6,3.5])if(!okp(x+Math.cos(a)*r,y+Math.sin(a)*r)||!clearLine({x,y},{x:x+Math.cos(a)*r,y:y+Math.sin(a)*r},room))g=false;}if(g)spot={x,y};}
 player.x=spot.x;player.y=spot.y;const live=room.enemies.filter(e=>e.hp>0);live.forEach((e,i)=>{e.speed=0;e.moveSpeed=0;e.x=-100-i;e.y=-100;});
 const use=live.filter(e=>!e.boss&&!e.midboss).slice(0,2);if(use.length<2)return {err:'적 부족'};
 const [N,T]=use;for(const e of use){e.spawnState='active';e.hp=e.maxHp=9999999;}
 N.x=player.x-1.4;N.y=player.y;T.x=player.x+2.6;T.y=player.y;window.__N=N;window.__T=T;return {ok:true};});
ok(setup.ok,'장면 준비 '+JSON.stringify(setup));
// ① R1034 먹 검흔 + 맞은 적
const r1=await p.evaluate(async()=>{const N=window.__N,T=window.__T,A=window.__STORYWORLD_HWANDO_INK_TRACE_R1034__;A.set(true);
 window.__STORYWORLD_HWANDO_INK_R945__.set(false);const k0=A.inspect().stats.attack,h0={N:N.hp,T:T.hp};player.attackCD=0;target=T.id;basicAttack();window.__c0=time;
 return {hitN:N.hp<h0.N,hitT:T.hp<h0.T,marks:A.inspect().stats.attack-k0};});
ok(r1.hitT&&!r1.hitN,'엔진: 조준한 T 를 베고 뒤의 N 은 안 맞음 '+JSON.stringify(r1));
const r2=await p.evaluate(()=>{const m=window.__STORYWORLD_HWANDO_INK_TRACE_R1034__.inspect().marks.filter(m=>m.k==='atk').slice(-1)[0];if(!m)return {marks:0};
 const d=e=>Math.hypot(e.x-m.x,e.y-m.y);return {dT:+d(window.__T).toFixed(2),dN:+d(window.__N).toFixed(2)};});
ok(r2.dT!=null&&r2.dT<.35&&r2.dN>3,'R1034 먹 검흔 자리 = 맞은 적 T(맞은 뒤 밀림 0.35칸 안) '+JSON.stringify(r2));
// ② R945 묵월: 방금 벤 적 쪽으로 날아감
await p.waitForFunction(()=>time-window.__c0>=1,null,{timeout:120000,polling:20});
const r3=await p.evaluate(()=>{const N=window.__N,T=window.__T,I=window.__STORYWORLD_HWANDO_INK_R945__;I.set(true);I.force('moon');for(const e of [N,T]){e.hp=e.maxHp;e.x=e===N?player.x-1.4:player.x+2.6;e.y=player.y;}
 player.attackCD=0;target=T.id;basicAttack();const b=I.inspect().blades.slice(-1)[0];return b?{dx:+(b.x-player.x).toFixed(2)}:{none:true};});
ok(r3.dx>0,'R945 묵월이 벤 적 T 쪽(오른쪽)으로 출발 '+JSON.stringify(r3));
// ③ R590 발도 베기 방향(2초 쉰 첫 베기): 그림 각도
await p.waitForFunction(()=>time-window.__c0>=3.6,null,{timeout:180000,polling:20});
const r4=await p.evaluate(()=>{const N=window.__N,T=window.__T,C=window.__STORYWORLD_HWANDO_CHAIN_R590__;window.__STORYWORLD_HWANDO_INK_R945__.set(false);for(const e of [N,T]){e.hp=e.maxHp;e.x=e===N?player.x-1.4:player.x+2.6;e.y=player.y;}
 const s0=C.inspect().stats.draws;player.attackCD=0;target=T.id;basicAttack();const I=C.inspect();return {draws:I.stats.draws-s0,a:I.lastDraw?I.lastDraw.a:null,sheathed:I.sheathed};});
ok(r4.draws===1&&r4.a!=null&&Math.cos(r4.a)>.9,'R590 발도 베기가 벤 적 T 쪽(각 0) '+JSON.stringify(r4));
console.log(`결과 ${n} 통과 / ${bad} 실패`);await b.close();process.exit(bad?1:0);
