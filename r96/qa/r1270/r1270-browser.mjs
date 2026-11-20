// R1270 헤드리스 검사(Playwright, 소프트웨어 렌더, 모바일 가로 844×390). 그래픽 검증 아님 — 그리기 명령·효과·피해 기록으로 본다.
//  ① 서하 평타: 실검무 0단계·1단계 피해 같음, 1단계에서 환도 발도 시트(fx-h6-hwando-iai)·자동 은색실(threadSlashR63)이 생기지 않음.
//  ② 미카엘라 기본탄: 하트 적중 그림(r912hit) 자리 = 엔진 충돌점(impactPoint152).
//  ③ T 실검무(직접 사용): 베기 그림은 은빛 iai-cut(환도 시트 아님), 중심이 맞은 몹 몸통에서 가깝고 몹이 움직이면 따라감.
//  STORYWORLD_URL=http://127.0.0.1:4396/m0/ node r96/qa/r1270/r1270-browser.mjs
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out/r1270';fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch({headless:true});const ctx=await b.newContext({viewport:{width:844,height:390},deviceScaleFactor:1});
const p=await ctx.newPage();p.on('pageerror',e=>console.log('pageerror',String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.go('dist02','STORY');const P=window.__STORYWORLD_PROGRESSION_R71__;if(P?.difficultyState?.().open){P.selectDifficulty('normal');await P.confirmDifficulty();}});
await p.waitForFunction(()=>room?.id==='dist02'&&!loading,null,{timeout:180000});await skip();
// 기록 장치: 그리기 명령(이미지 경로·점), fx, hitEnemy
await p.evaluate(()=>{const W=window.__r1270={on:false,imgs:[],fx:[],hits:[],cuts:[]};
 const pathOf=c=>String(c?.sourcePath||c?.data?.sourcePath||c?.image?.src||'');
 const ptsOf=c=>c?.points||c?.data?.points;
 const watch=()=>{const C=ctx?.commands;if(Array.isArray(C)&&!C.r1270){C.r1270=true;const pb=C.push;C.push=function(...items){try{if(W.on)for(const c of items){const s=pathOf(c);if(/iai|r1041\/fx-h6/.test(s)){const P=ptsOf(c);let cx=NaN,cy=NaN;if(Array.isArray(P)&&P.length===4){cx=(P[0][0]+P[2][0])/2;cy=(P[0][1]+P[2][1])/2;}W.imgs.push({t:time,s:s.split('/').pop().slice(0,60),cx,cy,owner:String(W.owner||'')});}}}catch(_){}return pb.apply(this,items);};}};
 const de=drawEffect;drawEffect=function(e,...a){watch();if(e?.type==='threadSlashR63'){W.owner='thread';const n0=W.imgs.length;try{return de.apply(this,[e,...a]);}finally{W.owner='';
   if(W.on){const mine=W.imgs.slice(n0);const foe=W.foe;let body=null;try{const v=window.__STORYWORLD_PLAY_R115__?.centreOf?.(foe);if(v)body={x:v.cx,y:v.cy};}catch(_){}
    if(mine.length)W.cuts.push({age:e.age,life:e.life,n:mine.length,files:[...new Set(mine.map(m=>m.s))],cx:mine.reduce((s,m)=>s+m.cx,0)/mine.length,cy:mine.reduce((s,m)=>s+m.cy,0)/mine.length,body,foe:foe?{x:foe.x,y:foe.y}:null});}}}
  return de.apply(this,[e,...a]);};
 const dh=drawHero;drawHero=function(...a){watch();return dh.apply(this,a);};
 const f0=fx;fx=function(type,x,y,o,...r){const e=f0.apply(this,arguments);try{if(W.on)W.fx.push({t:time,type,x,y});}catch(_){}return e;};
 const h0=hitEnemy;hitEnemy=function(e,v,s,...r){const ip=s&&s.impactPoint152?{...s.impactPoint152}:null;const n0=W.fx.length;const o=h0.apply(this,arguments);
  try{if(W.on){const hit=W.fx.slice(n0).find(f=>f.type==='r912hit');W.hits.push({t:time,v,basic:!!s?.r160Basic,asset:String(s?.asset||s?.kind||'').split('/').pop(),ip,end:s&&Number.isFinite(s.x)?{x:s.x,y:s.y}:null,heart:hit?{x:hit.x,y:hit.y}:null,ex:e.x,ey:e.y});}}catch(_){}return o;};});
async function setup(hero,rank){return p.evaluate(async([hero,rank])=>{guide=false;auto=false;settings.autoSkill=false;loading=true;try{await ensureImages(heroPaths(hero));player.hero=hero;}finally{loading=false;}
 const st=window.__STORYWORLD_PROGRESSION_R62__.state(player);st.ranks.threadDanceR63=rank;for(const k of ['threadCrossR64'])st.ranks[k]=rank>0?1:0;
 for(const v of room.enemies)if(v.hp>0){v.x=player.x-60;v.y=player.y-60;v.speed=0;}
 const list=room.enemies.filter(v=>v.hp>0&&!v.boss&&!v.midboss);const e=list.find(v=>/늪 뿌리 추적자/.test(String(v.name||v.label||v.title||'')))||list[0];
 e.x=player.x+3;e.y=player.y-1;e.hp=1e7;e.maxHp=1e7;e.speed=0;e.attack=null;room.engaged=true;player.invincible=999;window.__r1270.foe=e;effects.length=0;
 return {rank:window.__STORYWORLD_PROGRESSION_R62__.ranks('threadDanceR63',player),foe:String(e.name||e.label||e.kind||e.id)};},[hero,rank]);}
async function fire(sec){return p.evaluate(async(sec)=>{const W=window.__r1270;W.imgs.length=0;W.fx.length=0;W.hits.length=0;W.cuts.length=0;await new Promise(r=>setTimeout(r,300));W.on=true;const t0=time;
 const iv=setInterval(()=>{try{basicAttack(false);}catch(_){}},80);while(time<t0+sec)await new Promise(r=>setTimeout(r,60));clearInterval(iv);const t1=time;while(time<t1+.6)await new Promise(r=>setTimeout(r,60));W.on=false;
 return {hits:W.hits.slice(),imgs:W.imgs.slice(),fx:W.fx.map(f=>f.type)};},sec);}
let fails=0;const check=(n,ok,info)=>{if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+n+(info===undefined?'':' '+JSON.stringify(info).slice(0,500)));};
const res={};
for(const rank of [0,1]){const s=await setup('seoha',rank);const r=await fire(2.5);res['seoha'+rank]={setup:s,r};
 const basic=r.hits.filter(h=>h.basic);console.log('seoha rank',rank,s,'basic hits',basic.length,'dmg',[...new Set(basic.map(h=>+h.v.toFixed(2)))],'iai imgs',r.imgs.length,'thread fx',r.fx.filter(t=>t==='threadSlashR63').length);}
{const a=res.seoha0.r.hits.filter(h=>h.basic),c=res.seoha1.r.hits.filter(h=>h.basic);const da=[...new Set(a.map(h=>+h.v.toFixed(2)))].sort((x,y)=>x-y),dc=[...new Set(c.map(h=>+h.v.toFixed(2)))].sort((x,y)=>x-y);/* 치명타가 섞여 피해 값이 두 가지 — 값의 모음이 같아야 한다 */
 check('(1) 서하 평타 적중 0단계·1단계 모두 3번 이상',a.length>=3&&c.length>=3,{a:a.length,c:c.length});
 check('(2) 실검무 0단계·1단계 평타 피해 같음(일반·치명 값 모음)',da.length>=1&&JSON.stringify(da)===JSON.stringify(dc),{da,dc});
 check('(3) 1단계 평타에 자동 은색실(threadSlashR63) 없음',res.seoha1.r.fx.filter(t=>t==='threadSlashR63').length===0,{n:res.seoha1.r.fx.filter(t=>t==='threadSlashR63').length});
 check('(4) 1단계 평타에 환도 발도 시트·iai 베기 그림 없음',res.seoha1.r.imgs.length===0,{n:res.seoha1.r.imgs.length,files:[...new Set(res.seoha1.r.imgs.map(i=>i.s))]});}
{const s=await setup('michaela',1);const r=await fire(2.5);const hs=r.hits.filter(h=>h.basic&&h.ip&&h.heart);res.michaela={s,hs};
 const d=hs.map(h=>Math.hypot(h.heart.x-h.ip.x,h.heart.y-h.ip.y)),de=hs.map(h=>Math.hypot(h.heart.x-h.ex,h.heart.y-h.ey));
 check('(5) 미카엘라 기본탄 하트 적중 3번 이상(충돌점 기록)',hs.length>=3,{n:hs.length});
 check('(6) 하트 적중 그림 = 엔진 충돌점(오차 0.001칸 이하)',d.length>0&&Math.max(...d)<=1e-3,{max:d.length?Math.max(...d):null,endGap:hs.map(h=>+Math.hypot(h.end.x-h.ip.x,h.end.y-h.ip.y).toFixed(3)).slice(0,6)});
 check('(7) 하트가 몹 판정 반지름+탄 반지름 안(몹을 지나치지 않음, 1칸 이하)',de.length>0&&Math.max(...de)<=1,{max:de.length?+Math.max(...de).toFixed(3):null});}
// ③ T 실검무 직접 사용: 서하 1단계
{await setup('seoha',1);await p.evaluate(()=>{const W=window.__r1270;W.imgs.length=0;W.cuts.length=0;W.on=true;});await p.keyboard.press('t');/* T: 기본 실검무(장착한 은색실 없음) */
 const r=await p.evaluate(async()=>{const W=window.__r1270;const out='KeyT';
  const t0=time;let moved=false;while(time<t0+1.6){await new Promise(r=>setTimeout(r,40));if(!moved&&W.cuts.length){moved=true;const e=W.foe;W.movedAt=time;e.vxR1270=1;}if(moved&&W.foe){W.foe.x+=.02;}}
  W.on=false;return {out:String(out),cuts:W.cuts.slice()};});
 res.dance=r;console.log('dance',r.out,'cuts',r.cuts.length,JSON.stringify(r.cuts.slice(0,3)));
 const cuts=r.cuts.filter(c=>c.body&&Number.isFinite(c.cx));
 check('(8) T 실검무 베기 그림 생김',cuts.length>0,{n:r.cuts.length,out:r.out});
 check('(9) T 실검무 베기는 환도 발도 시트 아님(은빛 iai-cut)',r.cuts.length>0&&r.cuts.every(c=>c.files.every(f=>!/fx-h6/.test(f))),{files:[...new Set(r.cuts.flatMap(c=>c.files))]});
 const dist=cuts.map(c=>({age:+c.age.toFixed(2),d:+Math.hypot(c.cx-c.body.x,c.cy-c.body.y).toFixed(1)}));const H=await p.evaluate(()=>actorHeight());
 check('(10) 베기 중심과 맞은 몹 몸통 중심 거리 ≤ 영웅 키 0.15(모든 나이)',dist.length>0&&dist.every(x=>x.d<=H*.15),{H:+H.toFixed(1),dist:dist.slice(0,12)});}
fs.writeFileSync(`${OUT}/r1270.json`,JSON.stringify(res,null,1));
console.log(JSON.stringify({fails}));await b.close();process.exit(fails?1:0);
