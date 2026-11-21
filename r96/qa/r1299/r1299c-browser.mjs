// R1299c 브라우저(헤드리스·소프트웨어 렌더) — 발록의 소환진 공격 육망성이 시트로 그려지는지. GPU·실기기·자연 플레이 확인 아님.
//  SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1299/r1299c-browser.mjs
//  ① dist06 발록을 엔진 killEnemy 로 쓰러뜨리면 소환진이 섬 ② 공격 예고 동안 육망성 시트 0~5칸, 손이 솟는 동안 6~7칸, 원·선 그리기 0
//  ③ 빨간 손·진 그림 그대로, 페이지 오류 0. 사진 qa/r1299/shots/r1299c-hex-*.jpg
import {chromium,boot,go} from '../r444/lib.mjs';
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,400):''));};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await go(p,'dist06');
// 사진 찍는 동안 게임 시간을 멈춘다(헤드리스는 실제 시간과 게임 시간이 크게 어긋남)
await p.evaluate(()=>{const tb=tick;window.__SLOW=1;tick=function(dt,...a){return tb.call(this,dt*window.__SLOW,...a);};});
const r=await p.evaluate(async()=>{const waitG=async s=>{const t0=time;for(let i=0;i<40000&&time-t0<s;i++)await new Promise(r=>setTimeout(r,15));};
 room.engaged=true;player.hp=player.maxHp=9e8;player.invincible=1e9;const B=room.enemies.find(e=>e.boss&&/발록 ·/.test(e.name));
 player.x+=3;player.y+=2;for(const m of room.enemies)if(m!==B)m.hp=0;B.x=player.x+3;B.y=player.y-1;B.spawnState='active';B.hidden=false;await waitG(.3);
 B.hp=0;B.deadRecorded=false;killEnemy(B);await waitG(1);const c=room.enemies.find(e=>e.r251Circle);if(!c)return {fail:'no circle'};
 c.hp=c.maxHp=1e9;c.x=player.x+3.5;c.y=player.y-1;await ensureImages(['assets/r1299/hexagram-sheet.webp']);await waitG(.5);
 const rows=window.__H=[];const de=drawEffect;drawEffect=function(e,...a){if(!e||e.type!=='r251-fx')return de.call(this,e,...a);const C=ctx,keep={};const row={t:time,shapes:0,sheet:[],hands:0};
  for(const k of ['arc','ellipse','lineTo','stroke','fill']){keep[k]=C[k];C[k]=function(){row.shapes++;return keep[k].apply(C,arguments);};}
  keep.drawImage=C.drawImage;C.drawImage=function(im,...q){const s=String(im&&im.src||'');if(/r1299\/hexagram-sheet/.test(s))row.sheet.push(Math.round(q[0]/256)+4*Math.round(q[1]/256));if(/r251\/hands/.test(s))row.hands++;return keep.drawImage.apply(C,arguments);};
  try{return de.call(this,e,...a);}finally{for(const k in keep)C[k]=keep[k];rows.push(row);}};
 c.r251Circle.next=time;const t0=time;await waitG(.7);window.__SLOW=1e-4;return {t0,ready:true,rows:rows.length};});
ok(!r.fail,'① 발록 처치 → 소환진',r);
await p.screenshot({path:new URL('./shots/r1299c-hex-warn.jpg',import.meta.url).pathname,quality:85});
const r2=await p.evaluate(async()=>{window.__SLOW=1;const waitG=async s=>{const t0=time;for(let i=0;i<40000&&time-t0<s;i++)await new Promise(r=>setTimeout(r,15));};await waitG(.75);window.__SLOW=1e-4;return 1;});
await p.screenshot({path:new URL('./shots/r1299c-hex-hands.jpg',import.meta.url).pathname,quality:85});
const m=await p.evaluate(async()=>{window.__SLOW=1;const waitG=async s=>{const t0=time;for(let i=0;i<40000&&time-t0<s;i++)await new Promise(r=>setTimeout(r,15));};await waitG(1.2);
 const R=window.__H,warn=R.filter(x=>x.hands===0&&x.sheet.length),hands=R.filter(x=>x.hands>0);
 return {n:R.length,warnN:warn.length,handsN:hands.length,shapes:R.reduce((a,x)=>a+x.shapes,0),warnFr:[...new Set(warn.flatMap(x=>x.sheet))].sort(),handFr:[...new Set(hands.flatMap(x=>x.sheet))].sort(),
  noSheet:R.filter(x=>!x.sheet.length).length,errors:window.__STORYWORLD_SUMMONING_R251__.inspect().stats.errors};});
ok(m.warnN>3&&m.warnFr.every(v=>v>=0&&v<=5)&&m.warnFr.length>=3,'② 예고 동안 육망성 시트 0~5칸이 차례로',m);
ok(m.handsN>3&&m.handFr.every(v=>v===6||v===7),'② 손이 솟는 동안 6~7칸',m);
ok(m.shapes===0,'② 원·선 코드 그리기 0',m);
ok(m.errors===0&&errs.length===0,'③ 오류 0',errs.slice(0,3));
console.log(`\nR1299c 브라우저(헤드리스): ${n-bad}/${n} 통과`);await b.close();process.exit(bad?1:0);
