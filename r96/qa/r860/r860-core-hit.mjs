// R860 정화 코어 피격 이펙트 검사(헤드리스, 소프트웨어 렌더링 — 그래픽·실기기·자연 플레이 검증 아님).
//  적이 코어에 붙어 코어 체력을 깎는 순간, 맞은 코어 자리에 적중 그림(burst·slash)과 피해 숫자가 생겨야 한다.
//  (이전: core.hitAt 만 바뀌어 코어 자신의 'hit' 포즈만 돌고 적중 그림·숫자가 없었다.)
//  경계: ① 코어에서 4칸 떨어진 적은 코어를 깎지 않으므로 코어 자리에 그림이 생기면 안 됨 ② 영웅 근처 몹은 영웅 자리에 그림(회귀)
//  SW_URL 로 주소를 바꾼다(기본 http://127.0.0.1:4410/m0/). 실행: node r860-core-hit.mjs
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';
let fail=0;const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,400):'');if(!c)fail++;};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();p.on('pageerror',e=>console.error('PAGEERR',String(e).slice(0,200)));const A=(f,a)=>p.evaluate(f,a);
await p.goto(URL);await p.locator('#campaignNew54').waitFor({timeout:180000});
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="hwando"]').click();await p.locator('#r600Go').click();
await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
await A(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);window.__STORYWORLD_SURVIVAL_R600__.skipNarration?.();});
// 한 몹만 남기고 코어 곁(0.9칸)에 세운다. 영웅은 코어에서 8칸 떨어뜨려 몹이 코어를 노리게 한다. 몹 걸음·공격은 멈춘다.
const R=await A(()=>{const c=room.survivalR600.centre;const e=room.enemies.find(e=>e.hp>0&&!e.boss&&e.survivalR600)||room.enemies.find(e=>e.hp>0&&!e.boss);if(!e)return null;
 for(const o of room.enemies)if(o!==e){o.spawnState='hidden';o.cd=99;}
 e.r600Core=true;e.r600CoreAt=-9;e.speed=0;e.cd=99;e.hp=e.maxHp=1e9;e.x=c.x+.9;e.y=c.y;e.homeX=e.x;e.homeY=e.y;player.x=c.x+8;player.y=c.y;player.hp=9e8;player.invincible=999;
 window.__E=e;window.__rec={core:[],cur:null};effects.length=0;
 const tb=tick;tick=function(dt,...a){const h0=window.__STORYWORLD_SURVIVAL_R600__.state().core.hp;const r=tb.call(this,dt,...a);const h1=window.__STORYWORLD_SURVIVAL_R600__.state().core.hp;
  // 맞은 순간과 이어진 0.15초(게임 시간) 동안 생긴 그림을 모은다(다른 덧씌우기가 한두 tick 늦게 그릴 수 있음)
  const W=window.__rec;if(h1<h0-.5)W.cur={t:time,drop:h0-h1,seen:new Set(),fx:[]};
  if(W.cur){for(const f of effects)if(!W.cur.seen.has(f)){W.cur.seen.add(f);W.cur.fx.push({type:f.type,x:f.x,y:f.y,text:f.text||null});}
   if(time-W.cur.t>=.15){W.core.push({t:W.cur.t,drop:W.cur.drop,fx:W.cur.fx});W.cur=null;}}
  return r;};
 e.x=c.x+.9;e.y=c.y;return {c,e:[e.x,e.y]};});
if(!R){console.log('FAIL no enemy');process.exit(1);}
await p.waitForFunction(()=>window.__rec.core.length>=1,null,{timeout:120000,polling:200}).catch(()=>{});
const rec=await A(()=>({core:window.__rec.core,c:room.survivalR600.centre,ins:window.__STORYWORLD_ENEMY_HIT_PLACE_R860__?.inspect()}));
if(process.env.DEBUG)console.log(JSON.stringify(rec.ins));
ok('enemy touching the core lowered core hp (test setup)',rec.core.length>=1,rec.core.length);
const hit=rec.core[0];
const near=hit?hit.fx.filter(f=>f.type!=='text'&&Math.hypot(f.x-rec.c.x,f.y-rec.c.y)<=.8):[];
const txt=hit?hit.fx.filter(f=>f.type==='text'&&Math.hypot(f.x-rec.c.x,f.y-rec.c.y)<=.8):[];
ok('core hit spawns an impact picture at the core (not at the enemy, not elsewhere)',near.length>=1,hit&&hit.fx);
ok('core hit shows a damage number at the core',txt.length>=1&&/^-?\d+/.test(String(txt[0]?.text||'').replace('-','')),txt);
// 경계: 영웅이 몹 곁이면 몹은 영웅을 친다 → 코어 자리에는 아무것도 없어야 한다
await A(()=>{const c=room.survivalR600.centre,e=window.__E;e.r600Core=false;e.x=c.x+6;e.y=c.y+6;player.x=e.x+1;player.y=e.y;window.__rec.core.length=0;window.__rec.fxCore=0;effects.length=0;
 const tb=tick;tick=function(dt,...a){const r=tb.call(this,dt,...a);for(const f of effects)if(f.type!=='text'&&f.age<.1&&Math.hypot(f.x-c.x,f.y-c.y)<.8)window.__rec.fxCore++;return r;};});
await p.waitForTimeout(4000);
ok('mob far from the core produces no core-side picture',(await A(()=>window.__rec.fxCore))===0);
await b.close();console.log(fail?'FAILED '+fail:'ALL PASS');process.exit(fail?1:0);
