// R1235 헤드리스 검사(Playwright, 소프트웨어 렌더). 미카엘라 기본공격 적중 때 생기는 효과 기록·검사: 기본공격 3초 동안 fx() 호출을 종류·수명·시각·위치로, hitEnemy 호출을 시각·출처로 적는다.
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out/r1235';fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch({headless:true});const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{try{}catch(_){}});
const p=await ctx.newPage();await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.go('dist01','STORY');const P=window.__STORYWORLD_PROGRESSION_R71__;if(P?.difficultyState?.().open){P.selectDifficulty('normal');await P.confirmDifficulty();}});
await p.waitForFunction(()=>room?.id==='dist01'&&!loading,null,{timeout:180000});await skip();
const r=await p.evaluate(async()=>{guide=false;auto=false;settings.autoSkill=false;loading=true;try{await ensureImages(heroPaths('michaela'));player.hero='michaela';}finally{loading=false;}
 const L={fx:[],hits:[]};let on=false;const f0=fx;fx=function(type,x,y,o,...r){const e=f0.apply(this,arguments);try{if(on&&!e?.r1235Dropped)L.fx.push({t:+time.toFixed(3),type,life:o?.life??e?.life,x:+(+x).toFixed(2),y:+(+y).toFixed(2),asset:String(o?.asset||e?.asset||'').split('/').pop(),st:String(new Error().stack).split('\n').slice(2,5).map(l=>(/\/([\w.-]+\.js)/.exec(l)||[])[1]).filter(Boolean).join('<')});}catch(_){}return e;};
 const h0=hitEnemy;hitEnemy=function(e,v,s,...r){const o=h0.apply(this,arguments);try{if(on)L.hits.push({t:+time.toFixed(3),v:+(+v).toFixed(1),src:s?.asset?String(s.asset).split('/').pop():(s?.kind||s?.type||typeof s),st:String(new Error().stack).split('\n').slice(2,5).map(l=>(/\/([\w.-]+\.js)/.exec(l)||[])[1]).filter(Boolean).join('<')});}catch(_){}return o;};
 for(const v of room.enemies)if(v.hp>0){v.x=player.x-60;v.y=player.y-60;v.speed=0;}
 const e=room.enemies.find(v=>v.hp>0&&!v.boss);e.x=player.x+3;e.y=player.y-1;e.hp=1e7;e.maxHp=1e7;e.speed=0;e.attack=null;room.engaged=true;player.invincible=999;
 await new Promise(r=>setTimeout(r,500));on=true;const t0=time;const iv=setInterval(()=>{try{basicAttack(false);}catch(_){}},80);
 while(time<t0+4)await new Promise(r=>setTimeout(r,100));clearInterval(iv);
 const t1=time;while(time<t1+3)await new Promise(r=>setTimeout(r,100));on=false;return L;});
// 적 주변 연속 장면(약 0.05초 간격 16장)
await p.evaluate(()=>{window.__iv=setInterval(()=>{try{basicAttack(false);}catch(_){}},80);});
const q=await p.evaluate(()=>{const e=room.enemies.find(v=>v.hp>1e6);return project(e.x,e.y);});
for(let i=0;i<16;i++){await p.screenshot({path:`${OUT}/s${String(i).padStart(2,'0')}.png`,clip:{x:Math.max(0,q.x-90),y:Math.max(0,q.y-120),width:180,height:160}});}
await p.evaluate(()=>clearInterval(window.__iv));
fs.writeFileSync(`${OUT}/hitlog.json`,JSON.stringify(r,null,1));
const by={};for(const f of r.fx){const k=f.type+'|'+f.asset+'|'+f.st;(by[k]=by[k]||[]).push(f.t);}
for(const [k,ts] of Object.entries(by).sort((a,b)=>b[1].length-a[1].length)){const gaps=ts.slice(1).map((t,i)=>+(t-ts[i]).toFixed(2));console.log(ts.length,k.slice(0,160),'gaps',JSON.stringify(gaps.slice(0,12)));}
const hb={};for(const h of r.hits){const k=h.src+'|'+h.st;(hb[k]=hb[k]||[]).push(h.t);}for(const [k,ts] of Object.entries(hb))console.log('HIT',ts.length,k,JSON.stringify(ts.slice(0,14)));
let fails=0;const check=(n,ok,info)=>{if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+n+(info===undefined?'':' '+JSON.stringify(info).slice(0,600)));};
const basicHits=r.hits.filter(h=>h.src==='michaela-a.webp').length,single=r.fx.filter(f=>f.type==='burst'||f.type==='e568HeroImpact').length,heart=r.fx.filter(f=>f.type==='r912hit').length;
const st=await p.evaluate(()=>window.__STORYWORLD_MICHAELA_HITFX_R1235__?.inspect());
check('(1) 기본탄 적중 7번 이상(4초 연사)',basicHits>=7,{basicHits});
check('(2) 적중 때 한 장짜리 번쩍임(burst·e568HeroImpact) 0 — 기본탄·하트 패시브 적중 모두',single===0,{single});
check('(3) 하트 적중 프레임 시트는 적중마다 하나',heart===basicHits,{heart,basicHits});
check('(4) 모듈 오류 없음·뺀 수 = 적중 × 2',st&&st.stats.errors===0&&st.stats.dropped>=basicHits*2,st);
console.log(JSON.stringify({fails}));await b.close();process.exit(fails?1:0);
