// 묶음 M 세 패시브 동시 발동 검사(헤드리스): R945 환도 수묵 + R946 라우렌 천체 공명 + R947 슬레이어 혈 패시브가 같은 판에서 함께 돌 때
//  오류 0 · 그리기 표지(effects 센티널)가 프레임마다 하나씩만 그려짐(이중 그리기 없음) · 두 모듈 피해가 모두 들어감.
//  조종 영웅 = 라우렌, 생존 배치 영웅(R720 r720Ally 몸)으로 환도 몸·슬레이어 몸을 하나씩 두고 각 몸의 패시브 셋을 차례로 터뜨린다.
//  실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r945/combo-m-browser.mjs
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';let pass=0,fail=0;const ok=(c,m)=>{if(c){pass++;console.log('PASS',m);}else{fail++;console.log('FAIL',m);}};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const pageErrors=[];p.on('pageerror',e=>pageErrors.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
await p.evaluate(()=>{if(room?.id!=='dist00')enterRegion('dist00',null,{layer:'STORY',restore:true});});await p.waitForFunction(()=>!loading&&room?.id==='dist00',null,{timeout:150000});await skip();
await p.waitForTimeout(1500);
const setup=await p.evaluate(()=>{const L=liveEnemies().slice(0,8);for(const e of L){e.spawnState='active';e.hp=e.maxHp=5e6;e.speed=0;}const e0=L[0];
 player.hero='lauren';player.hp=player.maxHp=99999;player.x=e0.x-1.8;player.y=e0.y;
 const ally={...player,hero:'hwando',r720Ally:true,x:e0.x-1.6,y:e0.y+.9,attackCD:0,specialCD:0,hp:99999,maxHp:99999};window.__ally=ally;
 const sl={...player,hero:'slayer',r720Ally:true,x:e0.x-1.6,y:e0.y-.9,attackCD:0,specialCD:0,hp:99999,maxHp:99999};window.__sl=sl;
 // 프레임마다 각 센티널을 몇 번 그렸는지 센다
 window.__fr={frames:0,maxA:0,maxB:0,maxC:0};let a=0,c=0,d=0;const de=drawEffect;drawEffect=function(e,...r){if(e?.r945Sentinel)a++;if(e?.r946Sentinel)c++;if(e?.r947Sentinel)d++;return de.call(this,e,...r);};
 const dr=draw;draw=function(...r){a=0;c=0;d=0;const out=dr.apply(this,r);const F=window.__fr;F.frames++;F.maxA=Math.max(F.maxA,a);F.maxB=Math.max(F.maxB,c);F.maxC=Math.max(F.maxC,d);if(a&&c&&d)F.all3=(F.all3||0)+1;if(a)F.withA=(F.withA||0)+1;if(c)F.withB=(F.withB||0)+1;if(a&&c)F.both=(F.both||0)+1;return out;};
 window.__hits={r945:0,r946:0,r947:0};const he=hitEnemy;hitEnemy=function(e,v,s,...r){const o=he.call(this,e,v,s,...r);if(s?.r945)window.__hits.r945++;if(s?.r946||s?.kind?.includes?.('r946')||s?.kind?.includes?.('celestial'))window.__hits.r946++;if(s?.r947)window.__hits.r947++;return o;};
 return {n:L.length,room:room.id};});
console.log(JSON.stringify(setup));ok(setup.n>=1,'적 준비');
// 환도 몸으로 패시브 셋, 그 사이 라우렌 패시브 여럿
const asAlly=k=>p.evaluate(k=>{const real=player;player=window.__ally;try{window.__ally.attackCD=0;window.__STORYWORLD_HWANDO_INK_R945__.force(k);basicAttack(true);}finally{player=real;}},k);
// R946 자체 브라우저 검사와 같은 방식: 라우렌 타격 한 번(hitEnemy, sourceHero lauren)을 넣어 강제 발동
const asSl=k=>p.evaluate(k=>{const real=player;player=window.__sl;try{window.__sl.attackCD=0;window.__STORYWORLD_SLAYER_BLOOD_PASSIVE_R947__.force(k,window.__sl);basicAttack(true);}finally{player=real;}},k);
const lauren=k=>p.evaluate(k=>{const L=window.__STORYWORLD_LAUREN_CELESTIAL_R946__;L.qaReset();L.qaForce(k);const e=liveEnemies()[0];hitEnemy(e,1,{kind:'basic',sourceHero:'lauren'});},k);
const wait=s=>p.evaluate(s=>new Promise(r=>{const t0=time;const f=()=>time>=t0+s?r():setTimeout(f,50);f();}),s);
await asAlly('trio');await asSl('lattice');await lauren('repulse');await wait(.4);await asAlly('moon');await asSl('needle');await lauren('red');await wait(.5);await asAlly('clones');await asSl('swords');await lauren('blue');await wait(.6);await lauren('meteor');await wait(2.5);
const r=await p.evaluate(()=>{const A=window.__STORYWORLD_HWANDO_INK_R945__.inspect(window.__ally),B=window.__STORYWORLD_LAUREN_CELESTIAL_R946__.inspect(),C=window.__STORYWORLD_SLAYER_BLOOD_PASSIVE_R947__.inspect(window.__sl);
 return {fr:window.__fr,hits:window.__hits,aErr:A.errors,aLast:A.lastError,aStats:A.stats,bErr:B.stats?.errors??B.errors,bLast:B.stats?.lastError??B.lastError,bProcs:B.stats?.procs,bTotal:B.stats?.procTotal,cErr:C.errors,cLast:C.lastError,cStats:C.stats};});
console.log(JSON.stringify(r));
ok(r.fr.both>0,'두 패시브 그림이 같은 프레임에 함께 그려짐('+r.fr.both+'프레임)');
ok(r.fr.all3>0,'세 패시브 그림이 같은 프레임에 함께 그려짐('+r.fr.all3+'프레임)');
ok(r.fr.maxA===1&&r.fr.maxB===1&&r.fr.maxC===1,'센티널마다 프레임당 한 번만 그림(이중 그리기 없음)');
ok(r.aErr===0&&!r.aLast,'R945 오류 0');ok((r.bErr||0)===0&&!r.bLast,'R946 오류 0');
ok(r.aStats.trios===1&&r.aStats.moons===1&&r.aStats.cloneCasts===1,'환도 세 패시브 모두 발동');ok((r.bTotal||0)>=3,'라우렌 패시브 여러 번 발동');
ok(r.hits.r945>0,'환도 패시브 피해 들어감');ok(r.cErr===0&&!r.cLast,'R947 오류 0');ok(r.cStats.needles===1&&r.cStats.swordCasts===1&&r.cStats.lattices===1,'슬레이어 세 패시브 모두 발동');ok(r.hits.r947>0,'슬레이어 패시브 피해 들어감');ok(pageErrors.length===0,'페이지 오류 없음 '+pageErrors.join(' | '));
await b.close();console.log(`\n묶음 M 세 패시브 동시 발동: ${pass} 통과 / ${fail} 실패`);process.exit(fail?1:0);
