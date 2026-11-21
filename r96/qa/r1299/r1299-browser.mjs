// R1299 브라우저(헤드리스·소프트웨어 렌더, 2D 기본 설정) — 소환물 크기 실측. GPU·실기기·자연 플레이 확인 아님.
//  SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1299/r1299-browser.mjs [OFF=1 이면 고치기 끈 상태로 같은 검사(실패해야 정상)]
//  ① 카이르 세이렌 모르(kair03) R61 분신: 그려진 몸(idle) 키가 본체의 0.9~1.1배.
//  ② 기억사수 귀환 전우로 온 '컨트롤러 · 기억의 문'(본래 보스): 몸 키가 조종 영웅의 1.3배 이상(제 지역 약 1.8배), 원래 중간보스 아군은 그대로.
//  ③ 회귀: EGO R 소환 영웅 몸이 매 프레임 그려짐, 페이지 오류 0.
import {chromium,boot,go} from '../r444/lib.mjs';
const OFF=process.env.OFF==='1';let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,500):''));};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:OFF?{'storyworld.r1299.summonSize':'0'}:null});
const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await p.evaluate(()=>{const M=window.__M1299={rows:[]};const real=()=>window.__REAL||player;
 function spy(who,fn,self,args){const c=ctx;if(!c)return fn.apply(self,args);const o=c.drawImage,rec=[];
  c.drawImage=function(im,...a){try{const T=c.getTransform?c.getTransform():null,k=a.length,dh=k>=8?a[7]:k>=4?a[3]:im.height;rec.push({src:String(im&&(im.currentSrc||im.src)||'canvas').replace(/^.*\/m0\//,''),dh:Math.abs(dh*(T?Math.hypot(T.c,T.d):1))});}catch(_){}return o.apply(c,arguments);};
  try{return fn.apply(self,args);}finally{c.drawImage=o;M.rows.push({t:time,who,img:rec});if(M.rows.length>6000)M.rows.splice(0,2000);}}
 const de=drawEnemy;drawEnemy=function(e,...a){if(!e||!window.__WATCH||!window.__WATCH.has(e))return de.call(this,e,...a);return spy('e:'+window.__WATCH.get(e),de,this,[e,...a]);};
 const dh=drawHero;drawHero=function(...a){if(player===real())return window.__HEROH?spy('hero',dh,this,a):dh.apply(this,a);return spy('s:'+player.hero,dh,this,a);};
 window.__waitG=async s=>{const t0=time;for(let i=0;i<40000&&time-t0<s;i++)await new Promise(r=>setTimeout(r,15));};
 window.__med=(who,re)=>{const a=M.rows.filter(r=>r.who===who).map(r=>{const im=r.img.filter(m=>(!re||re.test(m.src))&&!/lights|aura|petal|fx|effect|r953\//.test(m.src));return im.length?Math.max(...im.map(m=>m.dh)):0;}).filter(Boolean).sort((x,y)=>x-y);return a.length?a[a.length>>1]:0;};});
// ① R61 분신
await go(p,'kair03');
const c1=await p.evaluate(async()=>{const S=window.__STORYWORLD_SUMMONS_R61__;const bs=room.enemies.filter(e=>(e.boss||e.midboss)&&e.hp>0&&!e.r61Summoned);
 room.engaged=true;player.hp=player.maxHp=9e8;player.invincible=1e9;room.enemies=room.enemies.filter(o=>bs.includes(o)||!(o.hp>0));
 bs.forEach((e,i)=>{e.spawnState='active';e.hidden=false;e.x=player.x+3+i*2;e.y=player.y-1;e.damage=0;});
 for(let k=0;k<12&&!room.enemies.some(e=>e.r61Clone&&e.hp>0);k++){for(const e of bs){e.hp=Math.max(e.hp,e.maxHp*.5);S.state(e).nextAt=0;S.request(e);}await __waitG(1.3);}
 const cl=room.enemies.find(e=>e.r61Clone&&e.hp>0);if(!cl)return {fail:'no clone'};const own=room.enemies.find(e=>e.id===cl.r61Summoned.owner);
 for(const e of [cl,own]){e.speed=0;e.damage=0;e.hp=e.maxHp=1e9;}cl.x=player.x+2;cl.y=player.y-1.2;own.x=player.x+2.6;own.y=player.y+1.4;
 window.__WATCH=new Map([[cl,'clone'],[own,'owner']]);window.__M1299.rows.length=0;await __waitG(1.2);
 return {own:own.nativeId,ownH:__med('e:owner',/idle/),cloneH:__med('e:clone',/idle/),name:cl.name};});
ok(!c1.fail,'① R61 분신 생김',c1);
if(!c1.fail)ok(c1.ownH>0&&c1.cloneH/c1.ownH>=.9&&c1.cloneH/c1.ownH<=1.1,'① 보스 분신 몸 키 = 본체의 0.9~1.1배',c1);
// ② 귀환 전우 본래 보스
const c2=await p.evaluate(async()=>{await ensureImages(heroPaths('gunner'));window.__REAL=player;player.hero='gunner';
 const live=room.enemies.filter(e=>e.hp>0&&!e.boss).slice(0,6);live.forEach((e,i)=>{e.x=player.x+4+(i%3)*.8;e.y=player.y+(i/3|0)*.8;e.spawnState='active';e.hidden=false;e.hp=e.maxHp=1e9;e.speed=0;e.damage=0;});
 const G=window.__STORYWORLD_GUNNER_VEIL_R953__,mr=Math.random;Math.random=()=>0;try{G.force('summon');player.attackCD=0;basicAttack(true);}finally{Math.random=mr;}
 await __waitG(1);const al=(G.inspect().allies||[]).map(a=>a.nativeId);
 // 아군 몸은 R953 이 room.enemies 밖에서 drawEnemy 로 그린다 → 그리기 호출의 e 로 잡는다
 const W=new Map();const de=drawEnemy;window.__WATCH={has:e=>!!(e&&e.r953Ally),get:e=>'ally:'+e.nativeId};
 window.__HEROH=true;window.__M1299.rows.length=0;await __waitG(1.5);window.__HEROH=false;
 const hero=__med('hero',/gunner/);return {al,hero,boss:__med('e:ally:u203-boss'),mid:__med('e:ally:u202-mid')};});
ok(c2.al.includes('u203-boss'),'② 귀환 전우에 컨트롤러(본래 보스) 포함',c2.al);
ok(c2.hero>0&&c2.boss>=c2.hero*1.3,'② 아군이 된 본래 보스 몸 키 ≥ 영웅 1.3배',c2);
ok(c2.mid>0&&c2.mid<c2.hero*1.2,'② 원래 중간보스 아군은 예전 크기(영웅 1.2배 미만) 그대로',c2);
// ③ 회귀: EGO R 소환 영웅 몸
const c3=await p.evaluate(async()=>{player.hero='hwando';await ensureImages(heroPaths('hwando'));const E=window.__STORYWORLD_EGO_SOVEREIGN_R1046__;E.unlock?.('qa');E.setForm(true);
 const P=window.__STORYWORLD_PROGRESSION_R62__,st=P.state(player);for(const s of 'QWER')st.ranks['skill'+s+'R663']=Math.max(1,st.ranks['skill'+s+'R663']||0);
 for(const id of Object.keys(HEROES))await ensureImages(heroPaths(id));const A=window.__STORYWORLD_EGO_SUMMON_R1157__;window.__M1299.rows.length=0;const got=A.qaSummon();await __waitG(1.5);
 const R=window.__M1299.rows.filter(r=>r.who.startsWith('s:'));return {got,frames:R.length,withBody:R.filter(r=>r.img.length>0).length,hero:A.bodies().map(b=>b.hero)};});
ok(c3.got&&c3.frames>5&&c3.withBody===c3.frames,'③ EGO R 소환 영웅 몸이 매 프레임 그려짐',c3);
const ins=await p.evaluate(()=>window.__STORYWORLD_SUMMON_SIZE_R1299__?.inspect());ok(OFF||ins&&ins.wrapped&&ins.stats.errors===0,'R1299 감쌈·오류 0',ins);
ok(errs.length===0,'페이지 오류 없음',errs.slice(0,3));
console.log(`\nR1299 브라우저(헤드리스${OFF?' · 고치기 끔':''}): ${n-bad}/${n} 통과`);await b.close();process.exit(bad?1:0);
