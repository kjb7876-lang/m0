// R1239 헤드리스 실측 — ep1a11 루시퍼(a11-boss)·초천사의 웃는 가면(mb-ep1a11) 몸 그림·크기 일관성과 '수천 개의 얼굴' 스킬 화면.
//  쓰는 법: (정적 서버 http://127.0.0.1:4410/m0/ = 빌드 사이트) node r96/qa/r1239/lucifer-census.mjs <출력폴더>
//  헤드리스 소프트웨어 렌더링 결과다(GPU·실기기 아님). 시간은 게임 time 기준으로 기다린다.
import {chromium,boot,go} from './lib.mjs';import fs from 'node:fs';
const out=process.argv[2]||'r1239-out';fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:{'storyworld.r790.npc':'{"on":false}',/* 크기 비교는 R620 숨쉬기·웅크림(의도한 움직임)을 끄고 그림 칸 배율만 잰다 */'storyworld.r620.bossmotion':'{"on":false}'}});
const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await go(p,'ep1a11');await p.waitForTimeout(800);
const wait=async s=>{const t0=await p.evaluate(()=>time);await p.waitForFunction(([t,s])=>time>t+s,[t0,s],{timeout:60000}).catch(()=>{});};
const list=await p.evaluate(()=>room.enemies.filter(e=>e.nativeId==='a11-boss'||e.nativeId==='mb-ep1a11').map(e=>({i:room.enemies.indexOf(e),id:e.nativeId})));
const res={},fails=[];const ok=(c,m,d)=>{console.log((c?'PASS ':'FAIL ')+m+(c?'':' '+JSON.stringify(d).slice(0,300)));if(!c)fails.push(m);};
async function setup(ix,ph,skill){await p.evaluate(([ix,ph,skill])=>{const e=room.enemies[ix];try{room.activeEncounter='trial';summon3([e],e.boss?'boss':'midboss');}catch(err){}
 e.spawnState='active';e.hidden=false;player.hp=9e8;player.maxHp=9e8;player.invincible=1e9;
 for(const o of room.enemies)if(o!==e&&o.hp>0){o.x=-999;o.y=-999;o.speed=0;if(o.r1239)o.r1239.next=1e9;}
 e.x=player.x+2.2;e.y=player.y-1.6;window.__E=e;window.__PH=ph;window.__last=[];if(e.r1239){e.r1239.mode=null;e.r1239.next=skill?time:1e9;}else e.r1239={mode:null,t0:0,next:skill?time:1e9,count:0,aim:null,seed:.3};
 if(!window.__hook){window.__hook=1;const FX=/r251\/atlas|pixelfx|\/fx\/|effect|vfx|ring|circle|sigil|shadow|aura|hexagram|blood|flame|r572|r571|dissol|burn|r106fx/i;
  const de=drawEnemy;drawEnemy=function(e,...a){const c=ctx,st0=Array.isArray(c?.commands)?c.commands.length:-1;const r=de.call(this,e,...a);
   if(e===window.__E&&st0>=0){let fin=null;for(let i=st0;i<c.commands.length;i++){const k=c.commands[i];if(k?.kind!=='image'||!Array.isArray(k.points)||k.points.length<4||k.r620Ghost)continue;const s=String(k.sourcePath||k.image?.src||'').replace(/^.*\/m0\//,'');if(FX.test(s))continue;
     const P=k.points,ar=Math.abs((P[1][0]-P[0][0])*(P[3][1]-P[0][1])-(P[1][1]-P[0][1])*(P[3][0]-P[0][0]));if(!fin||ar>fin.ar)fin={ar,P,src:s,sr:k.sourceRect||null,fl:k.r1029||null};}
    if(fin){const P=fin.P,qh=Math.hypot(P[3][0]-P[0][0],P[3][1]-P[0][1]),qw=Math.hypot(P[1][0]-P[0][0],P[1][1]-P[0][1]);let px=fin.sr?qh/fin.sr[3]:null,pw=fin.sr?qw/fin.sr[2]:null;
     if(fin.fl==='float'){const pad=window.__STORYWORLD_MOVE_FLOAT_R1029_DATA__?.arts?.['r104/bosses/a11-boss-p4.webp|0,0,466,432']?.pad||[0,0,0,0];px=qh/(1+pad[1]+pad[3])/432;pw=qw/(1+pad[0]+pad[2])/466;}
     /* R620 의 숨쉬기·웅크림·젖힘은 세로·가로를 반대로 늘이고 줄인다 → 넓이 배율(√가로×세로)로 잰다 */const area=px&&pw?Math.sqrt(px*pw):px;
     const q0=e.x-player.x,q1=e.y-player.y;window.__last.push({home:Math.abs(q0-2.2)<.35&&Math.abs(q1+1.6)<.35,src:fin.src,sr:fin.sr,fl:fin.fl,qh:+qh.toFixed(1),px:area&&+area.toFixed(4),py:px&&+px.toFixed(4),ph:e.phase,st:e.state,att:!!e.attack,hit:+(e.hitTimer||0).toFixed(2),mv:!!e.moving,H:e.rc146BodyHeight});}}
   return r;};
  const df=drawEffect;drawEffect=function(fx,...a){if(fx?.type!=='r1239-fx')return df.call(this,fx,...a);const c=ctx,st0=Array.isArray(c?.commands)?c.commands.length:-1;const r=df.call(this,fx,...a);
   if(st0>=0){const got=[];for(let i=st0;i<c.commands.length;i++){const k=c.commands[i];if(k?.kind==='image')got.push(String(k.sourcePath||k.image?.src||''));}window.__fx=got;}return r;};}},[ix,ph,skill]);}
for(const it of (process.env.SKILL_ONLY?[]:list)){for(const ph of (it.id==='a11-boss'?[0,1,2]:[null])){
 await setup(it.i,ph,false);
 for(let k=0;k<44;k++){await wait(.22);await p.evaluate(k=>{const e=window.__E;e.hp=Math.max(e.hp,e.maxHp*.7);if(window.__PH!=null)e.phase=window.__PH;if(k%9===4)e.hitTimer=.2;
   /* 걷기도 섞는다: 몇 번은 영웅에게서 멀리 두어 다가오게 */ if(k%11<5){e.x=player.x+2.2;e.y=player.y-1.6;}else if(k%11===5){e.x=player.x+6;e.y=player.y+3;}},k);}
 const L=await p.evaluate(()=>window.__last);const key=it.id+(ph==null?'':'@'+ph);res[key]=L;
 await p.screenshot({path:`${out}/${key}.png`});
 if(it.id==='a11-boss'){
  ok(L.length>=30,key+': 표본 30개 이상',L.length);
  ok(!L.some(s=>/actors-normalized/.test(s.src)),key+': 옛 actors-normalized 저화질 그림 안 그림',[...new Set(L.map(s=>s.src))]);
  if(ph>=1)ok(L.filter(s=>/r1239\/lucifer\//.test(s.src)).length>=L.length*.9,key+': 90% 이상 검게 물든 판(r1239/lucifer)',[...new Set(L.map(s=>s.src))]);
  else ok(!L.some(s=>/r1239\/lucifer\//.test(s.src)),key+': 0단계는 원래 상아·금빛 그대로');
  const body=L.filter(s=>s.px>0&&!(s.hit>0)&&s.home);/* 같은 자리(원근 배율 같음)에서만 비교 */const pxs=body.map(s=>s.px),mn=Math.min(...pxs),mx=Math.max(...pxs);
  ok(body.length>=20&&mx/mn<=1.06,key+': 몸 픽셀 배율 흔들림 ≤ 6% (대기·걷기·공격, 피격 제외, R620 끔 — 타격 자세는 다른 덧씌우기가 3%쯤 앞으로 키움; 고치기 전 최대 78%)',{n:body.length,mn,mx,ratio:+(mx/mn).toFixed(3),by:Object.fromEntries([...new Set(body.map(s=>s.src+'|'+s.fl))].map(k=>[k,body.filter(s=>s.src+'|'+s.fl===k).map(s=>s.px)]))});
 }else{const pxs=L.filter(s=>s.px>0&&!(s.hit>0)&&s.home).map(s=>s.px);ok(pxs.length>=20&&Math.max(...pxs)/Math.min(...pxs)<=1.12,key+': 가면 중간보스 크기 흔들림 ≤ 12%(R620 끔, 이번에 손대지 않음 — 타격 p2 가 준비 p1 보다 약 10% 크게 그려지는 것은 기록만)',[Math.min(...pxs),Math.max(...pxs)]);}
}}
// 스킬: 둘 다 시전 → 예고(갈라짐·고리·군중)·모임·깨짐을 실제로 그리고, 영웅은 한 번만 맞는다
for(const it of list){await setup(it.i,it.id==='a11-boss'?1:null,true);
 const shots=[];const seen=new Set();let maxMasks=0;
 await p.evaluate(()=>{window.__hurts=[];if(!window.__hh){window.__hh=1;const h=hurt;hurt=function(d,s){if(s?.r1239)window.__hurts.push(d);return h.apply(this,arguments);};}});
 for(let k=0;k<40;k++){await wait(.08);const r=await p.evaluate(()=>{const e=window.__E;if(window.__PH!=null)e.phase=window.__PH;const fx=(window.__fx||[]).filter(s=>/r1239\/fx\//.test(s)).map(s=>s.replace(/^.*\/r1239\/fx\//,''));window.__fx=[];return {mode:e.r1239?.mode,fx};});
  for(const s of r.fx)seen.add(s);maxMasks=Math.max(maxMasks,r.fx.filter(s=>/swarm/.test(s)).length);
  if(r.mode&&!shots.includes(r.mode)){shots.push(r.mode);await p.screenshot({path:`${out}/skill-${it.id}-${r.mode}.png`});}
  if(r.mode==='windup'&&!shots.includes('mid')&&k>=shots.length+6){shots.push('mid');await p.screenshot({path:`${out}/skill-${it.id}-windup-late.png`});}
  if(shots.includes('burst')&&!r.mode)break;}
 const hurts=await p.evaluate(()=>window.__hurts);
 const tone=it.id==='a11-boss'?'-crimson':'';
 ok(['windup','converge','burst'].every(m=>shots.includes(m)),it.id+': 예고→모임→깨짐 단계를 거침',shots);
 ok(seen.has('mask-crack8'+tone+'.webp')&&seen.has('mask-swarm12'+tone+'.webp')&&seen.has('mask-burst10'+tone+'.webp'),it.id+': 세 시트를 화면에 그림('+(tone||'상아')+')',[...seen]);
 ok(maxMasks*72>=1000,it.id+': 한 화면 가면 수(무리 시트 수×72) ≥ 1,000',maxMasks*72);
 ok(hurts.length===1,it.id+': 제자리에 있으면 한 번 맞음',hurts);
}
fs.writeFileSync(out+'/census.json',JSON.stringify({res,errs:[...new Set(errs)].slice(0,10),fails},null,1));
ok(errs.length===0,'페이지 오류 없음',errs.slice(0,3));
console.log(fails.length?'R1239 browser FAIL '+fails.length:'R1239 browser PASS');await b.close();process.exit(fails.length?1:0);
