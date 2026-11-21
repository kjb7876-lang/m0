// R1295b 실패 먼저 검사(헤드리스) — 서하 '평행세계 소집'(R949)에 환도가 안 나옴(사용자 2026-11-21 12:01Z).
//  원인 가설: R1025 summonList 가 열린 영웅을 늘 서사 순(헌터→슬레이어→미카엘라→기억사수→환도…) 앞에서부터 소환 수만큼 골라,
//  소환 수 1~4 에선 5번째인 환도가 절대 안 뽑힘. 모든 영웅 서사를 연 뒤 소환 수 1(레벨=문턱)에서 소집을 24번 강제해 누가 나오는지 센다.
//  기대: 환도 포함 열린 영웅이 고루 나옴(환도 ≥1번, 서로 다른 영웅 ≥4명). 경계: 서사 안 연 영웅(네온·라우렌)은 안 나옴, 조종 영웅(서하) 안 나옴.
import {chromium,boot,go} from '../r444/lib.mjs';
const N=+(process.env.N||24);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:480,height:270},init:process.env.OFF?{'storyworld.r1295.summonMix':'{"on":false}'}:null});await go(p,process.env.ZONE||'dist00');
const info=await p.evaluate(async()=>{await ensureImages(heroPaths('seoha'));player.hero='seoha';player.hp=99999;
 for(const z of ['dreamRest','restEp1b','u201','restU2','kair01'])visited.add('STORY:'+z);/* 쌍둥이몽세(hando01)는 안 엶 → 네온·라우렌은 나오면 안 됨 */
 const lv=window.__STORYWORLD_SKILL_UNLOCK_R1275__?.passiveLevels?.('story')||[5,15,30];player.level=lv[1];/* 소집 갈래 문턱 = 소환 1명 */
 const live=room.enemies.filter(e=>!e.boss&&!e.midboss).slice(0,4);for(const e of live){e.x=player.x+2.6;e.y=player.y+.3;e.hp=e.maxHp=9e6;e.damage=0;e.speed=0;e.spawnState='active';}window.__ids=live.map(e=>e.id);
 for(const h of ['hunter','slayer','michaela','gunner','hwando','neon','lauren'])try{await ensureImages(heroPaths(h));}catch(_){}
 return {lv:player.level,list:window.__STORYWORLD_PASSIVE_UNLOCK_R1025__.summonList('seoha',['seoha'])};});
await p.waitForTimeout(2500);
const seen={};let none=0;
for(let i=0;i<N;i++){const r=await p.evaluate(()=>{const api=window.__STORYWORLD_SEOHA_EPOCH_R949__;api.qaReset();api.qaForce('heroes');hitEnemy(room.enemies.find(v=>v.id===window.__ids[0]),1,{kind:'basic',sourceHero:'seoha'});
  const hs=['hunter','slayer','michaela','gunner','hwando','neon','lauren','seoha'].filter(h=>api.has(h));api.qaReset();return hs;});
 if(!r.length)none++;for(const h of r)seen[h]=(seen[h]||0)+1;await p.waitForTimeout(80);}
await b.close();console.log(JSON.stringify({info,seen,none}));
let fail=0;const F=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)fail++;};
F(none<=N*.2,`소집이 거의 매번 영웅을 부름 (빈 소집 ${none}/${N})`);
F((seen.hwando||0)>=1,`환도가 소집에 나옴 (${seen.hwando||0}/${N})`);
F(Object.keys(seen).filter(h=>['hunter','slayer','michaela','gunner','hwando'].includes(h)).length>=4,`열린 영웅 여럿이 고루 나옴 (${Object.keys(seen).join(',')})`);
F(!seen.neon&&!seen.lauren,'서사 안 연 네온·라우렌은 안 나옴');F(!seen.seoha,'조종 영웅(서하)은 안 나옴');
console.log(fail?`RESULT FAIL ${fail}`:'RESULT PASS');process.exit(fail?1:0);
