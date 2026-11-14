// R1033 브라우저 검사(헤드리스, 소프트웨어 렌더): 실제 게임에서 7영웅의 세 번째 특수 패시브를 터뜨려 컷인을 확인하고 장면을 찍는다.
//  ① 영웅마다 그 패시브 모듈의 실제 발동 길(기본 공격/타격 → 주사위 고정)로 세 번째 패시브가 나가면 컷인이 뜨고(data-hero), 그림이 모두 읽힘(상반신·시트·보스 그림)
//  ② 헌터 분대 = 실제 소환 영웅(슬레이어 포함), 기억사수 = 실제로 불려 온 기계 보스 그림, 서하 = 아르벨리아 그림
//  ③ 1단 패시브는 컷인 없음 ④ 끄면 7영웅·환도 모두 컷인 없음 ⑤ 페이지 오류·모듈 오류 0
// 쓰기: SW_URL=http://127.0.0.1:4410/m0/ [SHOT=경로접두어] node r96/qa/r1033/r1033-browser.mjs
import {chromium,boot,go} from '../r444/lib.mjs';
const shot=process.env.SHOT||'';let fail=0;const ok=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,x!==undefined?JSON.stringify(x).slice(0,400):'');if(!c)fail++;};
const b=await chromium.launch();const {ctx,p}=await boot(b,{vp:{width:1280,height:720}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await go(p,'dist00');
await p.evaluate(async()=>{for(const z of ['dreamRest','restEp1b','u201','restU2','kair01','hando01'])visited.add('STORY:'+z);
 for(const h of ['seoha','hunter','slayer','michaela','gunner','lauren','neon','hwando'])await ensureImages(heroPaths(h));player.hp=player.maxHp=999999;auto=false;guide=false;
 const live=room.enemies.filter(e=>!e.boss&&!e.midboss).slice(0,8);room.enemies.filter(e=>!live.includes(e)&&!e.boss).forEach(e=>{e.hp=0;e.dead=true;});
 live.forEach((e,i)=>{const a=i*2*Math.PI/live.length,r=i===0?0:1.5;e.x=player.x+2.2+Math.cos(a)*r;e.y=player.y+.3+Math.sin(a)*r;e.dead=false;e.spawnState='active';e.hp=e.maxHp=9999999;e.damage=0;e.speed=0;e.moveSpeed=0;e.cd=1e6;});
 window.__ids=live.map(e=>e.id);});
const C='window.__STORYWORLD_PASSIVE_CUTIN_R1033__';
const MOD={lauren:'LAUREN_CELESTIAL_R946',michaela:'MICHAELA_HEART_R948',seoha:'SEOHA_EPOCH_R949',neon:'NEON_STORM_R951',slayer:'SLAYER_BLOOD_PASSIVE_R947',hunter:'HUNTER_SQUAD_R952',gunner:'GUNNER_VEIL_R953'};
// 헌터 모듈은 R720 공개 객체에 붙어 있으므로 따로 찾는다
async function trigger(h,kind){return p.evaluate(async([h,kind,MOD])=>{player.hero=h;player.level=777;player.attackCD=0;const e=room.enemies.find(v=>v.id===window.__ids[0]);target=e;
 const qa=window['__STORYWORLD_'+MOD[h]+'__'];
 if(['lauren','michaela','seoha','neon'].includes(h)){qa.qaReset();qa.qaForce(kind);hitEnemy(e,1,{kind:'basic',sourceHero:h});}
 else if(h==='hunter'){const a=window.__STORYWORLD_HUNTER_SQUAD_R952__||qa;a.qaReset?.();a.force(kind);basicAttack(true);}
 else{qa.force(kind);basicAttack(true);}
 const el=document.getElementById('r1033Cutin');const c=window.__STORYWORLD_PASSIVE_CUTIN_R1033__.inspect();c.onNow=!!(el&&el.classList.contains('on'));c.heroNow=el&&el.getAttribute('data-hero');return c;},[h,kind,MOD]);}
async function figs(){return p.evaluate(async()=>{const el=document.getElementById('r1033Cutin');if(!el)return null;const out=[];
 for(const n of el.querySelectorAll('[data-fig]')){const src=n.getAttribute('src')||n.getAttribute('data-src');let loaded=false;
  if(n.tagName==='IMG'){if(!n.complete)await new Promise(r=>{n.onload=n.onerror=r;setTimeout(r,8000);});loaded=n.naturalWidth>0;}
  else{const im=new Image();im.src=src;await new Promise(r=>{im.onload=im.onerror=r;setTimeout(r,8000);});loaded=im.naturalWidth>0;}
  const r=n.getBoundingClientRect();out.push({fig:n.getAttribute('data-fig'),src,loaded,w:Math.round(r.width),h:Math.round(r.height)});}
 return {hero:el.getAttribute('data-hero'),on:el.classList.contains('on'),out};});}
async function freeze(ms){await p.evaluate(ms=>{const el=document.getElementById('r1033Cutin');el.classList.remove('on');void el.offsetWidth;el.classList.add('on');for(const a of document.getAnimations()){const t=a.effect&&a.effect.target;if(t&&(t.id==='r1033Cutin'||t.closest?.('#r1033Cutin'))){a.pause();const d=parseFloat(getComputedStyle(t).animationDelay)||0;a.currentTime=Math.max(0,ms-d*1000);}}
 const tb=tick;window.__tb=tb;tick=function(dt,...a){return tb.call(this,dt*1e-4,...a);};},ms);}
async function thaw(){await p.evaluate(()=>{if(window.__tb){tick=window.__tb;window.__tb=null;}for(const a of document.getAnimations())if(a.playState==='paused')a.play();});}
const CASES=[['slayer','lattice'],['michaela','bloom'],['lauren','violet'],['neon','storm'],['seoha','arbelia'],['hunter','squad'],['gunner','summon']];
for(const [h,k] of CASES){let c=null;
 // 서하 아르벨리아는 보스 그림이 아직 안 읽혔으면 모듈이 시간 붕괴로 바꾼다(원래 동작) → 그림이 읽힐 때까지 몇 번 다시
 for(let n=0;n<4;n++){await p.evaluate(C+'.qaReset()');c=await trigger(h,k);if(c.last&&c.last.hero===h&&c.last.kind===k)break;await p.waitForTimeout(2500);}
 const f=await figs();
 ok(`① ${h} ${k}: 컷인 뜸(발동 순간 on·data-hero)`,c.last&&c.last.hero===h&&c.last.kind===k&&c.onNow&&c.heroNow===h&&f&&f.hero===h,{c,f});
 ok(`① ${h}: 그림 모두 읽힘·크기 있음`,f&&f.out.length>=2&&f.out.every(v=>v.loaded&&v.w>0&&v.h>0),f&&f.out);
 if(h==='hunter')ok('② 헌터: 실제 분대에 슬레이어 → 슬레이어 그림, 헌터 분신 둘',f.out.some(v=>v.fig==='ally'&&v.src.includes('slayer-bust'))&&f.out.filter(v=>v.fig==='shade').length===2,f.out);
 if(h==='gunner'){const al=await p.evaluate(()=>window.__STORYWORLD_GUNNER_VEIL_R953__.allies().map(a=>a.path));ok('② 기억사수: 컷인 보스 그림 = 실제로 불려 온 기계 보스',f.out.filter(v=>v.fig==='boss').map(v=>v.src).every(s=>al.includes(s))&&f.out.some(v=>v.fig==='boss'),{al,f:f.out});}
 if(h==='seoha')ok('② 서하: 아르벨리아 그림',f.out.some(v=>v.fig==='boss'&&/arvelia/.test(v.src)),f.out);
 if(shot){await p.waitForFunction(()=>!document.getElementById('r1033Cutin').classList.contains('on'),null,{timeout:20000});await freeze(450);await p.waitForTimeout(400);await p.screenshot({path:`${shot}-${h}.jpg`,quality:86});await thaw();}
 await p.waitForTimeout(1400);}
// ③ 1단은 안 띄움
{await p.evaluate(C+'.qaReset()');const s0=(await p.evaluate(C+'.inspect()')).shown;await trigger('neon','lance');const s1=await p.evaluate(C+'.inspect()');ok('③ 네온 1단 뇌창: 컷인 없음',s1.shown===s0&&s1.skipped.tier>=1,s1);}
// ④ 끄기
{await p.evaluate(C+'.set(false)');await p.evaluate(C+'.qaReset()');const s0=(await p.evaluate(C+'.inspect()')).shown;await p.waitForTimeout(1500);await trigger('slayer','lattice');
 const hw0=await p.evaluate(()=>window.__STORYWORLD_HWANDO_INK_R945__.inspect().cutin);
 await p.evaluate(()=>{player.hero='hwando';player.attackCD=0;const a=window.__STORYWORLD_HWANDO_INK_R945__;a.force('trio');target=room.enemies.find(v=>v.id===window.__ids[0]);basicAttack(true);});await p.waitForTimeout(100);
 const hw1=await p.evaluate(()=>window.__STORYWORLD_HWANDO_INK_R945__.inspect().cutin);const s1=await p.evaluate(C+'.inspect()');
 ok('④ 끄면 슬레이어 컷인 없음',s1.shown===s0&&s1.skipped.off>=1,s1);ok('④ 끄면 환도 삼협묵희 컷인도 없음',hw1.shown===hw0.shown&&hw1.skipped>hw0.skipped,{hw0,hw1});
 await p.evaluate(C+'.set(true)');await p.waitForTimeout(21000);
 const hw2=await p.evaluate(()=>{player.attackCD=0;const a=window.__STORYWORLD_HWANDO_INK_R945__;a.force('trio');basicAttack(true);return a.inspect().cutin;});ok('④ 다시 켜면 환도 컷인 그대로(회귀)',hw2.shown===hw1.shown+1,{hw1,hw2});}
const I=await p.evaluate(C+'.inspect()');ok('⑤ 오류 0(모듈·페이지)',I.errors===0&&errs.length===0,{I,errs});
await ctx.close();await b.close();console.log(JSON.stringify({fail}));process.exit(fail?1:0);
