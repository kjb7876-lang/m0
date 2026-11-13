// R971 브라우저 검사(헤드리스): 실제 R62 P 창에 카드가 뜨고 사지는지, 실제 엔진 굴림에서 단계가 확률 문턱을 바꾸는지(라우렌, 주사위 값 고정).
//  주사위 0.105: 0단계(10%)면 꽝, 7단계(14.9%)면 발동. 주사위 0.155: 7단계여도 꽝(상한). SHOT=파일 이면 P 창 사진.
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:1280,height:720}});await go(p,process.env.ZONE||'dist00');
let fail=0;const ok=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)fail++;};
const errs=[];p.on('pageerror',e=>errs.push(String(e)));
ok('R971 올라옴',await p.evaluate(()=>!!window.__STORYWORLD_PASSIVE_GROWTH_R971__?.revision));
await p.evaluate(async()=>{await ensureImages(heroPaths('lauren'));player.hero='lauren';player.hp=99999;player.points=30;
 try{window.__STORYWORLD_AUTOLEVEL_R237__?.set?.(false);}catch(_){}});
// P 창
const card=await p.evaluate(()=>{showUpgrades();const b=document.querySelector('[data-r62-passive="heroPassiveR971"]');return b?{t:b.textContent,dis:b.disabled}:null;});
ok('P 창에 카드: '+(card&&card.t.slice(0,60)),!!card&&/천체 공명/.test(card.t)&&!card.dis);
if(process.env.SHOT){await p.evaluate(()=>document.querySelector('[data-r62-passive="heroPassiveR971"]')?.scrollIntoView({block:'center'}));await p.waitForTimeout(400);await p.screenshot({path:process.env.SHOT,quality:85});}
const roll=v=>p.evaluate(async v=>{const L=window.__STORYWORLD_LAUREN_CELESTIAL_R946__;L.qaRandom(()=>v);L.qaReset();
 const e=room.enemies.find(x=>x.hp>0&&!x.boss);e.x=player.x+1;e.y=player.y;e.hp=e.maxHp=99999;const s0=L.inspect().stats.procTotal;hitEnemy(e,1,{kind:'basic',sourceHero:'lauren'});
 await new Promise(r=>setTimeout(r,50));const n=L.inspect().stats.procTotal-s0;L.qaRandom(null);return n;},v);
await p.evaluate(()=>{if(typeof closePanel==='function')closePanel(true);});
ok('0단계: 주사위 .105 → 꽝(10%)',await roll(.105)===0);
ok('0단계: 주사위 .095 → 발동',await roll(.095)===1);
// 실제 구매 경로(R62 purchase) 5번
const bought=await p.evaluate(()=>{const A=window.__STORYWORLD_PROGRESSION_R62__,r=[];for(let i=0;i<8;i++)r.push(A.purchase('heroPassiveR971'));return {r,rank:A.ranks('heroPassiveR971'),pts:player.points};});
ok('구매 7번 성공·8번째 거절, 28점 사용: '+JSON.stringify(bought),JSON.stringify(bought.r)==='[true,true,true,true,true,true,true,false]'&&bought.rank===7&&bought.pts===2);
ok('7단계: 주사위 .105 → 발동(14.9%)',await roll(.105)===1);
ok('7단계: 주사위 .145 → 발동',await roll(.145)===1);
ok('7단계: 주사위 .155 → 꽝(14.9% 위)',await roll(.155)===0);
const ins=await p.evaluate(()=>window.__STORYWORLD_PASSIVE_GROWTH_R971__.inspect());console.log(JSON.stringify(ins));
ok('대기 ×0.79',Math.abs(ins.cooldownMult-.79)<1e-9);
const st=await p.evaluate(()=>window.__STORYWORLD_PHASE1__?.controller?.state?.reason||null);ok('게임 멈춤 없음 ('+st+')',!st||!/nonfinite/i.test(st));
ok('페이지 오류 없음 '+errs.slice(0,2).join(' | '),errs.length===0);
await b.close();process.exit(fail?1:0);
