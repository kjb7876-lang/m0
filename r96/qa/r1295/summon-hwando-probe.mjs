// R1295b 실패 먼저 검사 — 서하 '평행세계 소집'(R949)으로 환도를 부르면 환도가 안 보임(사용자 2026-11-21 12:01Z).
//  서하로 R949 heroes 를 강제(qaForce·qaTrio) → 소환된 영웅 몸마다 drawHero 가 그린 몸 그림(이미지 명령) 수·경로를 센다.
//  기대: 소환된 영웅 모두(환도 포함) 소환 시간 동안 몸 그림이 그려짐. 비교로 다른 두 영웅도.
import {chromium,boot,go} from '../r444/lib.mjs';
const TRIO=(process.env.TRIO||'hwando,neon,michaela').split(',');
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});await go(p,process.env.ZONE||'dist00');
await p.evaluate(async()=>{await ensureImages(heroPaths('seoha'));player.hero='seoha';player.hp=99999;
 const live=room.enemies.filter(e=>!e.boss&&!e.midboss).slice(0,5);for(const e of live){e.x=player.x+2.6+Math.random();e.y=player.y+.3+Math.random();e.hp=e.maxHp=9e6;e.damage=0;e.speed=0;e.spawnState='active';}window.__ids=live.map(e=>e.id);
 const W=window.__R1295b={log:{},calls:{}};const base=drawHero;drawHero=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:0;const P=player;const r=base.apply(this,a);
  try{if(P&&P.r949Summon){const k=P.hero;W.calls[k]=(W.calls[k]||0)+1;if(rec&&Array.isArray(rec.commands)){const L=W.log[k]??={img:0,paths:{}};for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c?.kind!=='image')continue;L.img++;const pth=String(c.sourcePath||c.image?.src||'?').replace(/^.*assets\//,'').slice(0,50);L.paths[pth]=(L.paths[pth]||0)+1;}}}}catch(e){W.err=String(e)}return r};});
// 서사 문(R1025): 모든 영웅 서사 지역을 지난 것으로(소환 후보가 열리게). GATE=0 이면 그대로 둠
if(process.env.GATE!=='0')await p.evaluate(()=>{for(const z of ['dreamRest','restEp1b','u201','restU2','kair01','hando01'])try{visited.add('STORY:'+z)}catch(_){};player.level=Math.max(+player.level||0,60);});
if(process.env.LIST)await p.evaluate(L=>{const u=window.__STORYWORLD_PASSIVE_UNLOCK_R1025__;window.__STORYWORLD_PASSIVE_UNLOCK_R1025__=Object.freeze({...u,summonList:()=>L.split(',')});},process.env.LIST);
// 영웅 그림 미리 읽기(소환은 heroReady 인 영웅만 부름)
await p.evaluate(async T=>{for(const h of T)try{await ensureImages(heroPaths(h));}catch(_){}},TRIO);await p.waitForTimeout(3000);
const t0=await p.evaluate(T=>{const api=window.__STORYWORLD_SEOHA_EPOCH_R949__;api.qaReset();api.qaTrio(T);api.qaForce('heroes');hitEnemy(room.enemies.find(v=>v.id===window.__ids[0]),1,{kind:'basic',sourceHero:'seoha'});return time},TRIO);
await p.waitForFunction(t0=>time-t0>=3,t0,{timeout:600000,polling:200});
const r=await p.evaluate(()=>{const api=window.__STORYWORLD_SEOHA_EPOCH_R949__;const i=api.inspect();return {open:Object.fromEntries(['hwando','neon','michaela','lauren','hunter','slayer','gunner'].map(h=>[h,window.__STORYWORLD_PASSIVE_UNLOCK_R1025__?.summonOpen?.(h)])),list:window.__STORYWORLD_PASSIVE_UNLOCK_R1025__?.summonList?.('seoha',['seoha']),act:i.active,summons:i.heroes||i.summons||null,has:Object.fromEntries(['hwando','neon','michaela','lauren','hunter','slayer','gunner','ego','persona'].map(h=>[h,api.has(h)])),log:window.__R1295b.log,calls:window.__R1295b.calls,err:window.__R1295b.err}});
await b.close();console.log(JSON.stringify(r,null,1));
let fail=0;for(const h of TRIO){const L=r.log[h];const body=L?Object.entries(L.paths).filter(([k])=>!/fx|effect|shadow|ring|aura|barrier/i.test(k)).reduce((n,[,v])=>n+v,0):0;
 if(!r.has[h]){fail++;console.log('FAIL',h,'소환되지 않음');}else if(!(body>10)){fail++;console.log('FAIL',h,'소환됐지만 몸 그림 없음 (그리기 호출',r.calls[h]||0,', 몸 이미지',body,')');}else console.log('ok  ',h,'몸 그림',body);}
console.log(fail?`RESULT FAIL ${fail}`:'RESULT PASS');process.exit(fail?1:0);
