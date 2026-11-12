// R860 맞은 대상 자리 검사(헤드리스, 소프트웨어 렌더링 — 그래픽·실기기·자연 플레이 검증 아님).
//  적 공격이 영웅에게 맞을 때 생기는 적중 그림·피해 숫자가 영웅 자리에 그려져야 한다.
//  회귀 원인: R259 hit-center 가 엔진 fx() 로 생긴 burst·slash·text 를 '그 좌표 .15칸 안에 선 적'에게 붙여 그 적 그림 가운데로 옮겨 그린다.
//  무한 생존처럼 몹이 영웅에게 겹쳐 몰리면 영웅이 맞는 그림이 그 몹(적 자신)에게 그려졌다.
//  ① 몹이 영웅 자리에 겹친 채 영웅을 때림 → 영웅 피격 그림·숫자에 몹 부착(r259E)이 없어야 함
//  ② 회귀: 영웅이 몹을 때리면(영웅 → 몹) 그 몹 그림 가운데로 옮겨 그리는 R259 기능은 그대로
//  SW_URL 로 주소를 바꾼다(기본 http://127.0.0.1:4410/m0/). 실행: node r860-hit-target.mjs
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';
let fail=0;const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,400):'');if(!c)fail++;};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();p.on('pageerror',e=>console.error('PAGEERR',String(e).slice(0,200)));const A=(f,a)=>p.evaluate(f,a);
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
await A(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
await A(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});
await A(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
await A(()=>{enterRegion('dist02',null,{layer:'STORY',restore:true});});await p.waitForFunction(()=>!loading&&room?.id==='dist02',null,{timeout:150000});
await A(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
await p.waitForTimeout(1500);
const R=await A(()=>{const e=room.enemies.find(e=>e.hp>0&&e.spawnState==='active'&&!e.boss&&!e.persona);if(!e)return null;
 for(const o of room.enemies)if(o!==e){o.spawnState='hidden';o.cd=99;}
 e.cd=99;e.speed=0;e.hp=e.maxHp=1e9;auto=false;guide=false;player.hp=9e8;player.invincible=0;player.guard=false;
 player.x=e.x+.04;player.y=e.y+.03;effects.length=0;window.__E=e;
 const tick0=effects.length;const r=hurt(7,e);
 const fxs=effects.filter(f=>f.type!=='text'||/^-?\d+$/.test(String(f.text||'').replace('-','')));
 return {res:r,hits:fxs.filter(f=>Math.hypot(f.x-player.x,f.y-player.y)<.3).map(f=>({type:f.type,tag:f.r259E?f.r259E.id:null}))};});
if(!R){console.log('FAIL no enemy');process.exit(1);}
ok('enemy overlapping the hero hurts the hero (setup)',R.res==='hit',R.res);
ok('hero-side hit pictures/number exist at the hero',R.hits.length>=2,R.hits);
ok('none of them is pinned to the enemy (R259 must not move a hero-hit onto the enemy)',R.hits.length>0&&R.hits.every(h=>!h.tag),R.hits.filter(h=>h.tag));
// 회귀 ②: 영웅이 몹을 때리는 그림은 그 몹에 붙는다(R259 본래 기능)
const R2=await A(()=>{const e=window.__E;e.hp=e.maxHp=1e9;player.x=e.x+1.0;player.y=e.y;effects.length=0;fx('text',e.x,e.y,{text:'-5',color:'#ffffff'});const f=effects.find(f=>f.r259E)||effects[effects.length-1];return {tag:f&&f.r259E?f.r259E.id:null,id:e.id,n:effects.length,types:effects.map(f=>f.type)};});
ok('regression: a damage number spawned on an enemy is still pinned to that enemy',R2.tag===R2.id,R2);
await b.close();console.log(fail?'FAILED '+fail:'ALL PASS');process.exit(fail?1:0);
