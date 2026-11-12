// R940 브라우저(헤드리스 소프트웨어 렌더링 — 그래픽·실기기 검증 아님). 사용: node r96/qa/r940/r940-browser.mjs
//  정적 서버(SW_URL, 기본 http://127.0.0.1:4410/m0/)에 빌드 결과가 올라와 있어야 한다.
import {chromium,boot,go,skip} from '../r444/lib.mjs';
let bad=0,n=0;const ok=(m,c,x)=>{n++;if(c!==true){bad++;console.log('FAIL '+m,x!==undefined?JSON.stringify(x):'');}else console.log('  ok '+m);};
const b=await chromium.launch(),errs=[];const {ctx,p}=await boot(b,{vp:{width:640,height:360}});p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const A=()=>p.evaluate(()=>window.__STORYWORLD_SNAPSHOT_R940__.snapshot()),E=()=>p.evaluate(()=>window.__STORYWORLD_SNAPSHOT_R940__.events());
const waitT=dt=>p.evaluate(()=>time).then(t0=>p.waitForFunction(([t,d])=>time>t+d||time<t,[t0,dt],{timeout:300000}));
const settle=()=>p.waitForTimeout(700);
await go(p,'dist01');await settle();
const direct=await p.evaluate(()=>({zone:room.id,hp:player.hp,maxHp:maxHP(),alive:room.enemies.filter(e=>e.hp>0&&!e.deadRecorded&&e.spawnState!=='dead').length,total:room.enemies.length}));
let s=await A();console.log('INFO snapshot',JSON.stringify(s));
ok('실제 게임에서 준비됨, 오류 0',s.ready===true&&s.errors===0,s);
ok(`지역·영웅 체력·적 수가 엔진 값과 같다 (${direct.zone}, 적 ${direct.alive}/${direct.total})`,s.zone===direct.zone&&s.hero.maxHp===direct.maxHp&&direct.maxHp>0&&s.enemies.alive===direct.alive&&s.enemies.total===direct.total&&direct.alive>0,{s:s.enemies,direct});
ok('입장 사건이 적혔다',(await E()).some(e=>e.type==='enter'&&e.zone==='dist01')&&s.entry.zone==='dist01');
// 피격: 체력을 15 깎는다(검사에서만) → heroHit
const before=s.counters.heroHits;await p.evaluate(()=>{player.hp=Math.max(player.hp,200);});await settle();const h0=(await A()).counters.heroHits;
await p.evaluate(()=>{player.hp-=15;});await settle();s=await A();
ok('영웅 피격이 적히고 입장 뒤 첫 피격 시간이 생긴다',s.counters.heroHits>=h0+1&&typeof s.entry.firstHitAfter==='number'&&(await E()).some(e=>e.type==='heroHit'&&e.dmg>=15),{h0,c:s.counters,e:s.entry});
// 처치: 엔진 killEnemy 로 한 마리
const k0=s.counters.kills;await p.evaluate(()=>{player.hp=1e9;const e=room.enemies.find(e=>e.hp>0&&e.spawnState==='active'&&!e.boss)||room.enemies.find(e=>e.hp>0&&!e.boss);e.hp=0;killEnemy(e);});await settle();s=await A();
ok('처치 한 번이 한 번으로 적힌다',s.counters.kills===k0+1,{k0,c:s.counters});
// 평소 플레이 중에는 지역 객체가 바뀌지 않는다 → 가짜 reload 가 없어야 한다
await waitT(1);ok('평소 플레이 중(dist01)에는 reload 사건이 없다(시작할 때 hub 를 다시 여는 것은 제외)',!(await E()).some(e=>e.type==='reload'&&e.zone==='dist01'),(await E()).filter(e=>e.type==='reload'));
// 다른 지역으로: 입장 기록이 새로
await go(p,'dist02');await settle();s=await A();ok('지역 이동 뒤 입장 기록이 새로 잡힌다',s.zone==='dist02'&&s.entry.zone==='dist02'&&s.entry.firstHitAfter===null,s.entry);
// 저장·불러오기 뒤에도 오류 없이 읽는다
await p.evaluate(()=>{player.hp=400;});await settle();const hb=(await A()).counters;
await p.evaluate(async()=>{const raw=JSON.parse(JSON.stringify(serializeSave()));raw.player&&(raw.player.hp=100);await restoreSave(raw);});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip(p);await settle();s=await A();console.log('INFO after restore',JSON.stringify({hb,c:s.counters,hp:s.hero.hp,ev:(await E()).slice(-3)}));
ok('같은 지역 저장을 불러오면 reload 가 적히고 피격·처치는 늘지 않는다',s.counters.heroHits===hb.heroHits&&s.counters.kills===hb.kills&&(await E()).some(e=>e.type==='reload'&&e.zone==='dist02'),{hb,c:s.counters});
ok('불러온 뒤에도 준비됨·오류 0',s.ready===true&&s.errors===0,s);
// 멈춤·다시 시작
await p.evaluate(()=>window.__STORYWORLD_SNAPSHOT_R940__.stop());const c1=(await A()).counters.heroHits;await p.evaluate(()=>{player.hp=500;});await p.waitForTimeout(400);await p.evaluate(()=>{player.hp-=20;});await settle();
ok('stop() 뒤에는 적지 않는다',(await A()).counters.heroHits===c1);await p.evaluate(()=>window.__STORYWORLD_SNAPSHOT_R940__.start());
// 게임 시간이 계속 흐른다(모듈이 게임을 멈추지 않는다)
const t0=await p.evaluate(()=>time);await waitT(.5);ok('게임 시간이 계속 흐른다',(await p.evaluate(()=>time))>t0);
ok('페이지 오류 0',errs.length===0,errs);
console.log(`\nR940 browser: ${n-bad}/${n} passed`);await b.close();process.exit(bad?1:0);
