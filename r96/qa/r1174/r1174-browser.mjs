// R1174 브라우저 검사(헤드리스 소프트웨어 렌더링 — 그래픽·GPU·실기기 검증 아님). 실행: node r1174-browser.mjs <출력 폴더>  (서버 SW_URL, 기본 127.0.0.1:4410/m0/)
//  ① 페르소나 형상 실제 기본공격(basicAttack)으로 (진) 천체 공명 굴림·발동이 도는지(확률·갈래·피해·오류) — 검토
//  ② 3단((진) 쌍성 소멸·유성 궤도) 발동 → 페르소나 전용 컷인, 라우렌 컷인 안 뜸  ③ 사몽 각성 → 페르소나 그림·이름·가운데 컷인·각성 막
//  ④ 라우렌 본인은 원래 컷인·각성 그대로(회귀)  ⑤ 페이지 오류 0
import {chromium,boot,go} from '../r444/lib.mjs';
const OUT=process.argv[2]||'.';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
await p.evaluate(async()=>{await ensureImages(heroPaths('lauren'));player.hero='lauren';__STORYWORLD_PERSONA_HERO_R1113__.setForm(true);});
await go(p,'murder01');await p.waitForTimeout(1500);
const calm=()=>p.evaluate(()=>{player.maxHp=player.hp=99999;const live=room.enemies.filter(e=>e.hp>0);live.forEach((e,i)=>{e.maxHp=e.hp=1e9;e.cd=1e6;e.attack=null;e.speed=0;e.x=player.x+1.2+.35*(i%3);e.y=player.y-.7+.3*(i%5);});return live.length;});
// 헤드리스 캡처: 컷인 타이머(실제 시간)가 지난 뒤 class on 을 다시 붙이고 애니메이션을 멈춘 채 게임 시간도 거의 멈춰 찍는다(R1033 freeze 와 같은 방식)
async function freeze(id,ms){await p.evaluate(([id,ms])=>{const el=document.getElementById(id);el.classList.remove('on');void el.offsetWidth;el.classList.add('on');
 for(const a of document.getAnimations()){const t=a.effect&&a.effect.target;if(t&&(t.id===id||t.closest?.('#'+id))){a.pause();const d=parseFloat(getComputedStyle(t).animationDelay)||0;a.currentTime=Math.max(0,ms-d*1000);}}
 const tb=tick;window.__tb=tb;tick=function(dt,...a){return tb.call(this,dt*1e-4,...a);};},[id,ms]);}
async function thaw(){await p.evaluate(()=>{if(window.__tb){tick=window.__tb;window.__tb=null;}for(const a of document.getAnimations())if(a.playState==='paused')a.play();for(const id of ['r1174Cutin','r1174Awake'])document.getElementById(id)?.classList.remove('on');});}
// ① 자연 굴림: 실제 기본공격 30 게임초
await calm();
const nat=await p.evaluate(async()=>{const Z=__STORYWORLD_LAUREN_CELESTIAL_R946__;const s0=JSON.parse(JSON.stringify(Z.inspect().stats));const hp0=room.enemies.filter(e=>e.hp>0).reduce((n,e)=>n+e.hp,0);
 __STORYWORLD_PASSIVE_CUTIN_R1033__.qaReset();const t0=time;let n=0;while(time-t0<30&&n<5000){try{basicAttack(true);}catch(e){}n++;await new Promise(r=>setTimeout(r,16));}
 const s1=Z.inspect().stats;const k={};for(const x in s1.procs)k[x]=s1.procs[x]-s0.procs[x];
 return {gt:+(time-t0).toFixed(1),rolls:s1.rolls-s0.rolls,procs:s1.procTotal-s0.procTotal,kinds:k,hits:s1.hits-s0.hits,errors:s1.errors,last:s1.lastError,persona:player.personaHeroR1113===true,
  pc:__STORYWORLD_PERSONA_CUTIN_R1174__.inspect(),c33:__STORYWORLD_PASSIVE_CUTIN_R1033__.inspect()};});
console.log('자연 굴림',JSON.stringify(nat));
ok(nat.persona&&nat.rolls>=5&&nat.procs>=1&&nat.hits>0,`① 페르소나 실제 기본공격으로 (진) 천체 공명 굴림 ${nat.rolls}번 · 발동 ${nat.procs}번 · 패시브 피해 ${nat.hits}번 (게임 ${nat.gt}초)`);
ok(nat.errors===0,'① R946 오류 0');
ok(nat.c33.last==null||nat.c33.last.hero==='persona','① 3단이 자연 발동했다면 컷인은 페르소나 것('+JSON.stringify(nat.c33.last)+')');
// ② 강제 3단
const force=async k=>{await calm();return p.evaluate(k=>{__STORYWORLD_PASSIVE_CUTIN_R1033__.qaReset();const Z=__STORYWORLD_LAUREN_CELESTIAL_R946__;Z.qaReset();Z.qaForce(k);
 const e=room.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];hitEnemy(e,1,{kind:'basic',sourceHero:'lauren'});
 const c=document.getElementById('r1174Cutin'),o=document.getElementById('r1033Cutin');
 return {on:!!c&&c.classList.contains('on'),kind:c&&c.getAttribute('data-kind'),imgs:c?[...c.querySelectorAll('img')].map(i=>i.getAttribute('src')):[],name:c&&c.querySelector('.r1174name')?.textContent,
  lauren:!!o&&o.classList.contains('on'),laurenSrc:c?c.innerHTML.includes('lauren'):null};},k);};
for(const [k,name] of [['violet','(진) 쌍성 소멸'],['meteor','(진) 유성 궤도']]){const r=await force(k);
 ok(r.on&&r.kind===k&&r.name===name&&r.imgs.some(s=>/rc133\/art|r1174/.test(s))&&!r.lauren&&!r.laurenSrc,`② ${k}: 페르소나 컷인(${r.name}, ${r.imgs[0]}), 라우렌 컷인 ${r.lauren?'뜸':'안 뜸'}`);
 await p.waitForFunction(()=>!document.getElementById('r1174Cutin').classList.contains('on'),null,{timeout:20000});await freeze('r1174Cutin',480);await p.waitForTimeout(400);
 await p.screenshot({path:`${OUT}/cutin-${k}.png`});await thaw();}
// ③ 사몽 각성
const aw=await p.evaluate(()=>{showAwakening('samong');const im=document.getElementById('awakeImage'),sw=document.querySelector('#sw8Awakening img'),ov=document.getElementById('r1174Awake');
 return {img:im?.getAttribute('src'),name:document.getElementById('awakeHero')?.textContent,sw:sw?.getAttribute('src'),ov:!!ov&&ov.classList.contains('on'),art:heroArt.lauren.awakening};});
console.log('각성',JSON.stringify(aw));
ok(/rc133\/art|r1174/.test(aw.img||'')&&!/lauren/.test(aw.img||''),'③ 왼쪽 위 각성 그림 = 페르소나 ('+aw.img+')');
ok(/^페르소나/.test(aw.name||''),'③ 이름 줄 = '+aw.name);
ok(/rc133\/art|r1174/.test(aw.sw||''),'③ 가운데 큰 컷인 = 페르소나 ('+aw.sw+')');
ok(aw.ov&&!/rc133/.test(aw.art),'③ 각성 막 on, heroArt 되돌림('+aw.art+')');
await p.waitForFunction(()=>!document.getElementById('r1174Awake').classList.contains('on'),null,{timeout:20000});
await p.evaluate(()=>{showAwakening('samong');});await freeze('r1174Awake',420);await p.evaluate(()=>{for(const a of document.getAnimations()){const t=a.effect&&a.effect.target;if(t&&t.closest?.('#sw8Awakening,#cutin')){a.pause();a.currentTime=300;}}});
await p.waitForTimeout(400);await p.screenshot({path:`${OUT}/awake-persona.png`});await thaw();await p.waitForTimeout(2500);
// ④ 라우렌 본인
await p.evaluate(()=>__STORYWORLD_PERSONA_HERO_R1113__.setForm(false));await p.waitForTimeout(400);
{const r=await force('violet');const L=await p.evaluate(()=>{const o=document.getElementById('r1033Cutin');return {on:!!o&&o.classList.contains('on'),hero:o?.getAttribute('data-hero'),main:o?.querySelector('.r1033main')?.getAttribute('src')};});
 ok(L.on&&L.hero==='lauren'&&/lauren/.test(L.main||'')&&!r.on,'④ 라우렌 본인: 원래 라우렌 컷인 그대로 ('+L.main+'), 페르소나 컷인 안 뜸');}
await p.waitForTimeout(2000);
{const a=await p.evaluate(()=>{showAwakening('samong');return {img:document.getElementById('awakeImage')?.getAttribute('src'),name:document.getElementById('awakeHero')?.textContent,ov:document.getElementById('r1174Awake')?.classList.contains('on')};});
 ok(/lauren/.test(a.img||'')&&/^라우렌/.test(a.name||'')&&!a.ov,'④ 라우렌 본인 사몽 그대로 ('+a.img+', '+a.name+')');}
const pc=await p.evaluate(()=>__STORYWORLD_PERSONA_CUTIN_R1174__.inspect());ok(pc.errors===0,'⑤ R1174 오류 0 ('+JSON.stringify(pc)+')');
ok(errs.length===0,'⑤ 페이지 오류 0 ('+errs.slice(0,2).join(' | ')+')');
console.log(fails?('FAILED '+fails):'ALL PASS (헤드리스)');await b.close();process.exit(fails?1:0);
