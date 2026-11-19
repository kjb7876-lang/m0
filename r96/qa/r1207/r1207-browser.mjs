// R1207 브라우저 검사(헤드리스): 실제 엔진 굴림 문턱(라우렌, 주사위 고정)이 11.1%→77.7% 곡선을 따르는지, 확률 발동 피해가 예전÷새 확률만큼 줄었는지.
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});await go(p,process.env.ZONE||'dist00');
let fail=0;const ok=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)fail++;};
const errs=[];p.on('pageerror',e=>errs.push(String(e)));
const rev=await p.evaluate(()=>window.__STORYWORLD_PASSIVE_GROWTH_R971__?.revision);ok('R971 판 '+rev,/R1207/.test(rev||''));
await p.evaluate(async()=>{await ensureImages(heroPaths('lauren'));player.hero='lauren';player.hp=99999;player.points=40;try{window.__STORYWORLD_AUTOLEVEL_R237__?.set?.(false);}catch(_){}
 for(const e of room.enemies)if(e.hp>0&&!e.boss){e.x=player.x+30;e.y=player.y+30;}});
const roll=v=>p.evaluate(async v=>{const L=window.__STORYWORLD_LAUREN_CELESTIAL_R946__;L.qaRandom(()=>v);L.qaReset();
 const e=room.enemies.find(x=>x.hp>0&&!x.boss);e.x=player.x+1;e.y=player.y;e.hp=e.maxHp=99999;const s0=L.inspect().stats.procTotal;hitEnemy(e,1,{kind:'basic',sourceHero:'lauren'});
 await new Promise(r=>setTimeout(r,50));const n=L.inspect().stats.procTotal-s0;L.qaRandom(null);e.x=player.x+30;return n;},v);
ok('0단계: 주사위 .105 → 발동(11.1%, 예전 10%면 꽝)',await roll(.105)===1);
ok('0단계: 주사위 .115 → 꽝',await roll(.115)===0);
const card=await p.evaluate(()=>window.__STORYWORLD_PROGRESSION_R62__.defs.find(d=>d.id==='heroPassiveR971').text);ok('카드 설명: '+card.slice(0,60),/11\.1%/.test(card)&&/20\.6%/.test(card));
const bought=await p.evaluate(()=>{const A=window.__STORYWORLD_PROGRESSION_R62__,r=[];for(let i=0;i<7;i++)r.push(A.purchase('heroPassiveR971'));return A.ranks('heroPassiveR971');});
ok('7단계 구매',bought===7);
ok('7단계: 주사위 .70 → 발동(77.7%)',await roll(.70)===1);
ok('7단계: 주사위 .78 → 꽝',await roll(.78)===0);
// 피해: 항성 반발(repulse, 즉시 피해)을 강제해 공격력 대비 피해를 잼 — 꺼짐(예전 ×1) vs 7단계(×0.149/0.777)
const dmg=on=>p.evaluate(async on=>{const G=window.__STORYWORLD_PASSIVE_GROWTH_R971__,L=window.__STORYWORLD_LAUREN_CELESTIAL_R946__;G.set(on);L.qaReset();L.qaForce('repulse');
 const e=room.enemies.find(x=>x.hp>0&&!x.boss);e.x=player.x+.6;e.y=player.y;e.hp=e.maxHp=1e7;e.armor=0;const rec=[];const base=window.hitEnemy;
 window.hitEnemy=function(t,v,s,...a){if(s&&String(s.kind||'').startsWith('r946-'))rec.push(v);return base.call(this,t,v,s,...a);};
 try{base.call(window,e,1,{kind:'basic',sourceHero:'lauren'});}finally{}
 const t0=performance.now();while(!rec.length&&performance.now()-t0<20000)await new Promise(r=>setTimeout(r,100));window.hitEnemy=base;G.set(true);e.x=player.x+30;return {v:rec[0],ap:attackPower()};},on);
const off=await dmg(false),on7=await dmg(true);console.log(JSON.stringify({off,on7}));
const ratio=on7.v/off.v;ok('7단계 고정 피해 비 '+(ratio||0).toFixed(4)+' ≈ 14.9/77.7='+(0.149/0.777).toFixed(4),Number.isFinite(ratio)&&Math.abs(ratio-.149/.777)<.01);
const ins=await p.evaluate(()=>window.__STORYWORLD_PASSIVE_GROWTH_R971__.inspect());console.log(JSON.stringify(ins));ok('R971 오류 0',ins.stats.errors===0);
ok('페이지 오류 없음 '+errs.slice(0,2).join(' | '),errs.length===0);
await b.close();console.log(fail?'FAIL':'OK');process.exit(fail?1:0);
