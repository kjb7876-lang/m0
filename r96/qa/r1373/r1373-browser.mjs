// R1373 브라우저 검사(헤드리스, 소프트웨어 렌더) — 윤서하 '평행세계 소집' 실제 엔진 동작.
//  ① 비중: 모든 서사 연 뒤 소환 1명 레벨에서 소집 N번 강제 → 환도·기억사수·미카엘라가 다른 영웅보다 자주.
//  ② 7초 실전: 소환 3명 레벨에서 한 번 발동 → 부른 영웅 각자가 평타를 치고, 스킬(Q/W/E/R)도 쓰고, 맞히고, 7초 뒤 사라짐.
//  ③ 서사 문: 아무 서사도 안 연 새 판 → 영웅 소집 대신 다른 갈래(시간 붕괴)로 감, 영웅 안 나옴.
import {chromium,boot,go} from '../r444/lib.mjs';
const N=+(process.env.N||30),ZONE=process.env.ZONE||'dist00';
const ALL=['dreamRest','restEp1b','u201','restU2','kair01','hando01'],FAV=['hwando','gunner','michaela'],HS=['hunter','slayer','michaela','gunner','hwando','lauren','neon'];
let fail=0;const F=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)fail++;};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:480,height:270}});await go(p,ZONE);
const A='window.__STORYWORLD_SEOHA_EPOCH_R949__';
await p.evaluate(async([HS])=>{await ensureImages(heroPaths('seoha'));player.hero='seoha';player.hp=99999;auto=false;guide=false;
 for(const h of HS)try{await ensureImages(heroPaths(h));}catch(_){}
 // 몹 8마리를 영웅 앞에 세워 두기(안 움직이고 안 때림, 체력 넉넉)
 const live=room.enemies.filter(e=>!e.boss&&!e.midboss).slice(0,8);room.enemies.filter(e=>!live.includes(e)&&!e.boss).forEach(e=>{e.hp=0;e.dead=true;});
 live.forEach((e,i)=>{const a=i*2*Math.PI/live.length,r=i?1.2+(i%3)*.5:0;e.x=player.x+2.6+Math.cos(a)*r;e.y=player.y+.3+Math.sin(a)*r;e.dead=false;e.spawnState='active';e.hp=e.maxHp=9e6;e.damage=0;e.speed=0;e.moveSpeed=0;e.cd=1e6;e.tell=0;});
 window.__ids=live.map(e=>e.id);
 // 누가 평타·스킬을 썼는지 영웅별로 센다(엔진 전역 basicAttack, R49 autoSpecial, WER cast 를 감쌈 — 감쌀 수 없으면 null)
 const by=window.__by={basic:{},skill:{}};const bump=(k)=>{if(window.__STORYWORLD_SEOHA_EPOCH_R949__.inspect().active?.kind==='heroes'&&player.hero!=='seoha'){by[k][player.hero]=(by[k][player.hero]||0)+1;}};
 window.__wrap={basic:false,q:false,wer:false};
 try{const ba=window.basicAttack;if(typeof ba==='function'){window.basicAttack=function(...a){const cd=player.attackCD;const r=ba.apply(this,a);if(player.attackCD>cd)bump('basic');return r;};window.__wrap.basic=window.basicAttack!==ba;}}catch(_){}
 try{const R=window.__STORYWORLD_HANDO_FINAL_R49__,q=R.autoSpecial;R.autoSpecial=function(...a){const cd=player.specialCD;const r=q.apply(this,a);if(player.specialCD>cd)bump('skill');return r;};window.__wrap.q=R.autoSpecial!==q;}catch(_){}
 try{const W=window.__STORYWORLD_WER__,c=W.cast;W.cast=function(...a){const r=c.apply(this,a);if(r===true)bump('skill');return r;};window.__wrap.wer=W.cast!==c;}catch(_){}
},[HS]);
const lv=await p.evaluate(()=>window.__STORYWORLD_SKILL_UNLOCK_R1275__?.passiveLevels?.('story')||[5,15,30]);
const hit=()=>p.evaluate(()=>{hitEnemy(room.enemies.find(v=>v.id===window.__ids[0]),1,{kind:'basic',sourceHero:'seoha'});return time;});
// ③ 먼저(아무 서사도 안 연 상태 = 새 판). 777 은 영웅을 풀지만 서사 문(visited)은 그대로다.
{const r=await p.evaluate(async([A,ALL,lv])=>{for(const z of ALL)visited.delete('STORY:'+z);player.level=lv[1]+20;const api=eval(A);api.qaReset();api.qaForce('heroes');
  hitEnemy(room.enemies.find(v=>v.id===window.__ids[0]),1,{kind:'basic',sourceHero:'seoha'});const i=api.inspect();const o={kind:i.active?.kind||null,summons:(i.summons||[]).map(s=>s.hero),list:window.__STORYWORLD_PASSIVE_UNLOCK_R1025__.summonList('seoha',['seoha'])};api.qaReset();return o;},[A,ALL,lv]);
 F(!r.summons.length&&!r.list.length&&r.kind!=='heroes',`③ 서사 안 열면 영웅 소집 없음 → ${JSON.stringify(r)}`);}
// ① 비중
await p.evaluate(([ALL,lv])=>{for(const z of ALL)visited.add('STORY:'+z);player.level=lv[1];},[ALL,lv]);
const seen={};let none=0,multi=0;
for(let i=0;i<N;i++){const r=await p.evaluate(A=>{const api=eval(A);api.qaReset();api.qaForce('heroes');hitEnemy(room.enemies.find(v=>v.id===window.__ids[0]),1,{kind:'basic',sourceHero:'seoha'});const hs=(api.inspect().summons||[]).map(s=>s.hero);api.qaReset();return hs;},A);
 if(!r.length)none++;if(r.length>1)multi++;for(const h of r)seen[h]=(seen[h]||0)+1;}
const fav=FAV.reduce((n,h)=>n+(seen[h]||0),0),tot=Object.values(seen).reduce((a,c)=>a+c,0);
console.log('① seen',JSON.stringify(seen),'none',none,'level',lv[1]);
F(none===0&&multi===0,`① 문턱 레벨에선 매번 1명 소환 (빈 ${none}, 여럿 ${multi})`);
// 기대 비중 4:1 → 세 영웅 합 12/16=75%. N=30 에서 50% 아래로 떨어질 확률 약 0.3%.
F(tot>0&&fav/tot>=.5,`① 환도·기억사수·미카엘라 합 ${fav}/${tot} ≥ 50% (기대 75%, 균등이면 43%)`);
F(!seen.seoha,'① 서하 자신은 안 나옴');
// ② 7초 실전(3명)
await p.evaluate(lv=>{player.level=lv[1]+20;window.__by.basic={};window.__by.skill={};},lv);
const s0=await p.evaluate(A=>{const i=eval(A).inspect();return {...i.stats.heroCasts,hits:i.stats.heroHits,hp:window.__ids.reduce((n,id)=>n+(9e6-room.enemies.find(v=>v.id===id).hp),0)};},A);
const t0=await p.evaluate(A=>{const api=eval(A);api.qaReset();api.qaForce('heroes');hitEnemy(room.enemies.find(v=>v.id===window.__ids[0]),1,{kind:'basic',sourceHero:'seoha'});return time;},A);
const in0=await p.evaluate(A=>{const i=eval(A).inspect();return {kind:i.active?.kind,summons:(i.summons||[]).map(s=>s.hero)};},A);
F(in0.kind==='heroes'&&in0.summons.length===3&&new Set(in0.summons).size===3,`② 3명 소환 ${in0.summons.join(',')}`);
await p.waitForFunction(t0=>time-t0>=6.6,t0,{timeout:900000,polling:250});
const mid=await p.evaluate(A=>{const i=eval(A).inspect();return {kind:i.active?.kind,cast:i.stats.heroCasts,hits:i.stats.heroHits,draws:i.stats.bodyDraws,fallbacks:i.stats.fallbacks,errors:i.stats.errors,hero:player.hero,by:window.__by,wrap:window.__wrap,hp:window.__ids.reduce((n,id)=>n+(9e6-room.enemies.find(v=>v.id===id).hp),0)};},A);
const d=k=>(mid.cast[k]||0)-(s0[k]||0),skills=d('q')+d('w')+d('e')+d('r');
console.log('② mid',JSON.stringify({...mid,delta:{basic:d('basic'),q:d('q'),w:d('w'),e:d('e'),r:d('r'),hits:mid.hits-s0.hits,dmg:Math.round(mid.hp-s0.hp)}}));
F(mid.kind==='heroes'&&mid.hero==='seoha','② 6.6초까지 소집 유지, 조종 영웅은 서하 그대로');
F(d('basic')>=6&&mid.hits-s0.hits>=6&&mid.hp-s0.hp>50,`② 평타 ${d('basic')}번·적중 ${mid.hits-s0.hits}번·피해 ${Math.round(mid.hp-s0.hp)}`);
F(skills>=in0.summons.length,`② 스킬(소환 수 이상) ${skills}번 (Q${d('q')} W${d('w')} E${d('e')} R${d('r')})`);
if(mid.wrap.basic)F(in0.summons.every(h=>(mid.by.basic[h]||0)>=1),`② 영웅마다 평타 ${JSON.stringify(mid.by.basic)}`);else console.log('note 영웅별 평타 집계 못 함(전역 basicAttack 감싸기 불가)');
if(mid.wrap.q||mid.wrap.wer)F(in0.summons.every(h=>(mid.by.skill[h]||0)>=1),`② 영웅마다 스킬 ${JSON.stringify(mid.by.skill)}`);else console.log('note 영웅별 스킬 집계 못 함');
F(mid.draws>0,`② 소환 영웅 몸 그림 ${mid.draws}`);
await p.waitForFunction(t0=>time-t0>=7.4,t0,{timeout:300000,polling:250});
const end=await p.evaluate(A=>{const i=eval(A).inspect();return {active:i.active,summons:(i.summons||[]).length,props:(room.props||[]).filter(a=>a&&a.r949Prop).length,errors:i.stats.errors,lastError:i.stats.lastError};},A);
F(!end.active&&!end.summons&&!end.props,`② 7초 뒤 사라짐 ${JSON.stringify(end)}`);
F(!end.errors,`② 오류 없음 ${end.lastError||''}`);
await b.close();console.log(fail?`RESULT FAIL ${fail}`:'RESULT PASS');process.exit(fail?1:0);
