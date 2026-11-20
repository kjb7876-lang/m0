// R1254 브라우저 검사(헤드리스 Chromium 소프트웨어 렌더링 — 실기기 GPU·자연 플레이 아님). 외부 리뷰(공개판 e3b5ae02) 재현 항목.
//  ① 발록을 실제 사망 처리(killEnemy — 명단에서 바로 빠짐)로 처치해도 1.8초 안에 '발록의 소환진'이 생긴다
//  ② 발록·소환진 검은기둥이 함께 싸울 때 상단 체력바는 방금 맞은 발록을 보인다(이름·수치) / 경계: 기둥을 때리면 기둥으로
//  ③ 검을 들어 올리는 준비 자세(windup)의 R104 몸 그림은 준비 칸 p1 이고 회복 칸 p4 가 아니다, 몸 그림은 한 장(칼 층이 몸 통째로 겹치지 않음)
//  ④ 시야 밖에서 처음 그린 몹 탄도 화면에 들어오면 R912 시트로 그린다(회색 projectile-core 아님)
//  ⑤ 적 탄 drawProjectile 안에서 코드 선(stroke) 0 — 시트가 안 붙는 탄도 / 경계: 영웅 탄은 손대지 않음
//  ⑥ 사몽 방 육망성 바닥 공격(R170·R1206c 먹 번짐)이 터진 순간 R1229 본편 핏빛 고리 시트(r1229:hex)로 바뀌지 않는다 / 경계: 본편은 그대로 바뀐다
//  ⑦ 페이지 오류 0
// 실행: node r96/qa/r1254/r1254-browser.mjs  (SW_URL 기본 http://127.0.0.1:4410/m0/)
import {chromium,boot,go,skip} from '../r444/lib.mjs';
let n=0,bad=0;const ok=(m,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(d!==undefined?' '+JSON.stringify(d).slice(0,600):''));};
const b=await chromium.launch();const errs=[];
const {p}=await boot(b,{vp:{width:960,height:540}});p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const waitGame=s=>p.evaluate(async s=>{const t0=time;await new Promise(r=>{const g=()=>{if(time-t0>=s)return r();setTimeout(g,60);};g();});},s);
await p.evaluate(()=>{window.__grab=(fn,secs)=>new Promise(res=>{const three=window.__STORYWORLD_PHASE1__.controller.state.three,base=three.render;const out=[];const t0=time;
 three.render=function(f){const r=base.apply(this,arguments);try{out.push(fn(f.commands||[]));}catch(e){out.push({err:String(e)});}return r;};
 const g=()=>{if(time-t0>=secs){three.render=base;return res(out);}setTimeout(g,60);};g();});
 window.__keep=setInterval(()=>{try{player.hp=maxHP();player.invincible=99;if(modal&&!storyScene)closePanel(true);if(storyScene)advanceScene();}catch(_){}},250);});
// ---------- ③ 준비 자세 ----------
await go(p,'dist06');
await p.evaluate(()=>{for(const e of room.enemies)if(!e.boss&&!e.midboss)e.hp=0;const B=room.enemies.find(e=>e.boss&&/발록/.test(e.name)),M=room.enemies.find(e=>e.midboss);window.__B=B;window.__M=M;
 player.x=B.x+3;player.y=B.y+1.5;room.engaged=true;for(const e of [B,M]){e.spawnState='active';e.visible=true;e.disabled=false;e.hp=e.maxHp=1e6;}
 window.__pose=setInterval(()=>{try{__B.attack=null;__B.cd=99;__B.hitTimer=0;__B.storyAttackStart5=time+100;__B.storyAttackUntil5=time+200;}catch(_){}},30);});
await waitGame(.6);
const pose=await p.evaluate(async()=>{const own='enemy:'+__B.id;const act=window.__STORYWORLD_REGIONAL_DETAIL__.balrogAction(__B);
 const G=await __grab(cs=>cs.filter(c=>c.kind==='image'&&c.owner?.id===own).map(c=>String(c.sourcePath||c.image?.src||'').split('/').pop()),1.2);clearInterval(__pose);return {act,G};});
const fr=pose.G.flat();const r104=pose.G.map(a=>a.filter(s=>/dist06-boss-p\d/.test(s)));
ok('③ precondition: Balrog is in the windup (raised sword) action',pose.act==='windup',{act:pose.act});
ok('③ windup R104 body is the anticipation key p1, never recovery p4',fr.some(s=>/dist06-boss-p1/.test(s))&&!fr.some(s=>/dist06-boss-p4/.test(s)),{srcs:[...new Set(fr)]});
ok('③ one Balrog body per frame (the sword layer is not a second whole body)',r104.length>0&&r104.every(a=>a.length<=1),{max:Math.max(...r104.map(a=>a.length))});
// ---------- ② 체력바 ----------
const hud=await p.evaluate(async()=>{const read=()=>({title:document.getElementById('bossTitle')?.textContent||'',num:document.getElementById('bossHPNumbersR66')?.textContent||'',w:document.getElementById('bossHP')?.style.width});
 const fmt=v=>new Intl.NumberFormat('ko-KR',{maximumFractionDigits:0}).format(Math.ceil(v));const wait=s=>new Promise(r=>{const t0=time;const g=()=>{if(time-t0>=s)return r();setTimeout(g,50);};g();});
 hitEnemy(__B,52000,{kind:'test'});await wait(.5);const a={...read(),bhp:fmt(__B.hp),mhp:fmt(__M.hp),order:room.enemies.filter(e=>e.boss||e.midboss).map(e=>e.name)};
 hitEnemy(__M,1000,{kind:'test'});await wait(.5);const c={...read(),mhp:fmt(__M.hp)};return {a,c};});
ok('② after Balrog is hit the top bar names Balrog and shows its HP',/발록/.test(hud.a.title)&&!/소환진/.test(hud.a.title)&&hud.a.num.startsWith(hud.a.bhp+' '),hud.a);
ok('② boundary: hitting the pillar then shows the pillar',/소환진 검은기둥/.test(hud.c.title)&&hud.c.num.startsWith(hud.c.mhp+' '),hud.c);
// ---------- ① 소환진 ----------
const sum=await p.evaluate(async()=>{const S=window.__STORYWORLD_SUMMONING_R251__;const s0=S.inspect().stats.spawned;__B.hp=0;killEnemy(__B);/* 엔진 사망 처리: hitEnemy 가 체력 0 뒤 부르는 길 */const gone=!room.enemies.includes(__B);
 await new Promise(r=>{const t0=time;const g=()=>{if(time-t0>=1.8)return r();setTimeout(g,50);};g();});return {gone,s0,s1:S.inspect().stats.spawned,circles:S.circles(),err:S.inspect().lastError};});
ok('① precondition: real killEnemy drops Balrog from the enemy list',sum.gone,sum);
ok('① a breakable "발록의 소환진" appears within 1.8 s of the real death path',sum.s1-sum.s0===1&&sum.circles.length===1&&sum.circles[0].hp>0,sum);
// ---------- ⑥ 사몽 먹 번짐 ----------
const hex=await p.evaluate(async()=>{const C=window.__STORYWORLD_COMBAT_R170__;const IP='assets/r1206/fx/ink-bloom-warn8.webp';for(let i=0;i<60&&!readyImage(IP);i++){try{addImage(IP);}catch(_){}await new Promise(r=>setTimeout(r,250));}const one=async samong=>{const prev=room.samongR103;if(samong)room.samongR103={};
  const h={id:'t1254'+(samong?'s':'b'),type:'field',owner:'x',x:player.x+1,y:player.y,radius:1.7,age:1.4,warning:1.3,life:99,damage:0,lastHit:1e9,samongPattern:'r170-hex',r170:{tower:'x',pal:{main:{a:[90,12,20],b:[255,120,110]},sub:{a:[40,6,10],b:[200,60,60]}},seed:1,burst:true}};hazards.push(h);
  const G=await __grab(cs=>({hex:cs.filter(c=>String(c.key||'').startsWith('r1229:hex:'+h.id)).length,ink:cs.filter(c=>String(c.owner?.id||'')==='r170:hex:'+h.id&&c.kind==='image'&&/ink-bloom-warn8/.test(String(c.sourcePath||c.image?.src||''))).length,shape:cs.filter(c=>String(c.owner?.id||'')==='r170:hex:'+h.id&&c.kind!=='image'&&c.kind!=='text').length}),.6);
  hazards.splice(hazards.indexOf(h),1);if(samong){if(prev===undefined)delete room.samongR103;else room.samongR103=prev;}return {hex:G.reduce((a,x)=>a+x.hex,0),ink:G.reduce((a,x)=>a+x.ink,0),shape:G.reduce((a,x)=>a+x.shape,0),frames:G.length};};
 return {samong:await one(true),story:await one(false)};});
ok('⑥ samong ink bloom (burst, R1206c) is kept, not swapped for the story blood ring sheet',hex.samong.hex===0&&hex.samong.shape>0,hex.samong);
ok('⑥ boundary: story blood hexagram still uses the R1229 ring sheet',hex.story.hex>0,hex.story);
// ---------- ④ ⑤ 몹 탄 ----------
await go(p,'dist02');
await p.evaluate(()=>{for(const e of room.enemies)e.hp=0;});
const ready=await p.evaluate(async()=>{const path='assets/r912/pj09b-fly.webp';for(let i=0;i<60&&!readyImage(path);i++){try{addImage(path);}catch(_){}await new Promise(r=>setTimeout(r,250));}return !!readyImage(path);});
const shot=await p.evaluate(async()=>{const P='assets/vfx/generated/v300/projectile-core.webp';const mk=(id,x,extra)=>({id,friendly:false,owner:'t1254',x,y:player.y,vx:.001,vy:0,asset:P,age:0,life:999,radius:.3,damage:0,...extra});
 let spot=null;for(let r=13;r<30&&!spot;r+=.5)for(let k=0;k<24;k++){const a=k/24*Math.PI*2,x=player.x+Math.cos(a)*r,y=player.y+Math.sin(a)*r,q=project(x,y);if(!blocked(x,y,.4,room)&&(q.x<-80||q.x>W+80||q.y<-80||q.y>H+80)){spot={x,y};break;}}
 const far=mk(912541,spot.x,{y:spot.y});projectiles.push(far);let offCalls=0,onNow=false;
 // 몹 탄 그리기 안에서 생긴 명령 종류를 센다(가장 바깥 감싸기)
 const kinds={hostile:{},hero:{}};const base=drawProjectile;drawProjectile=function(b,...a){if(b===far&&!onNow)offCalls++;const C=ctx,n0=Array.isArray(C?.commands)?C.commands.length:-1;const r=base.apply(this,[b,...a]);if(n0>=0){const t=kinds[b?.friendly?'hero':'hostile'];for(const c of C.commands.slice(n0))t[c.kind]=(t[c.kind]||0)+1;}return r;};
 await new Promise(r=>{const t0=time;const g=()=>{if(time-t0>=.8)return r();setTimeout(g,50);};g();});
 onNow=true;far.x=player.x+2;far.y=player.y-1;
 const odd=mk(912542,player.x-2,{asset:'assets/vfx/generated/v300/other-shot.webp'});projectiles.push(odd);
 const G=await __grab(cs=>({sheet:cs.filter(c=>c.kind==='image'&&/r912\/pj09/.test(String(c.sourcePath||c.image?.src||''))).length,core:cs.filter(c=>c.kind==='image'&&/projectile-core/.test(String(c.sourcePath||c.image?.src||''))).length,live:projectiles.includes(far)}),1.2);
 drawProjectile=base;projectiles=projectiles.filter(x=>x!==far&&x!==odd);return {offCalls,spot:!!spot,G:G.filter(x=>x.live),kinds,R912:window.__STORYWORLD_PROJECTILE_SHEETS_R912__?.inspect?.().stats};});
ok('④ precondition: R912 rot sheet ready in dist02',ready);
ok('④ precondition: the engine drew the shot while it was off screen',shot.offCalls>0,{offCalls:shot.offCalls,spot:shot.spot});
const sh=shot.G.reduce((a,x)=>a+x.sheet,0),co=shot.G.reduce((a,x)=>a+x.core,0);
ok('④ a mob shot first drawn off screen uses the R912 sheet once on screen (no grey core)',shot.G.length>5&&sh>0&&co===0,{frames:shot.G.length,sheet:sh,core:co,stats:shot.R912});
ok('⑤ no code-drawn line (stroke) inside enemy shot drawing',!shot.kinds.hostile.stroke,shot.kinds);
ok('⑦ no page errors',errs.length===0,errs.slice(0,3));
console.log(`R1254 browser ${n-bad}/${n}`);await b.close();if(bad)process.exit(1);
