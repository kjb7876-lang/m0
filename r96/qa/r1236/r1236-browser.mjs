// R1236 브라우저(헤드리스 소프트웨어 렌더링) 검사: 실제 게임에서 영웅마다 손 블링크를 쓰고, 블링크 뒤 게임 시간에 따라
//  영웅이 화면 가운데에서 떨어진 거리(px)를 잰다. R1236 켬/끔을 같은 자리에서 비교. PC(R81 카메라)와 모바일 흉내(엔진 카메라). GPU·실기기 아님.
import {chromium,boot,skip,go} from '../r444/lib.mjs';
import fs from 'node:fs';
const b=await chromium.launch();const res={errors:[]};
const kinds=(process.env.KINDS||'pc,mobile').split(',');
for(const kind of kinds){
 const vp=kind==='mobile'?{width:844,height:390}:{width:640,height:360};
 const {ctx,p}=await boot(b,{vp,init:{'storyworld.r663.skillgrowth':JSON.stringify({on:false})}});
 p.on('pageerror',e=>res.errors.push(kind+': '+String(e).slice(0,200)));
 if(kind==='mobile')await p.evaluate(()=>{try{window.__STORYWORLD_WORLD_PRESENTATION_R81__&&0}catch(_){}});
 await go(p,process.env.ZONE||'murder01');res[kind]={};
 for(const h of (process.env.HEROES||'michaela,neon,gunner,seoha').split(',')){res[kind][h]={};
  for(const mode of ['off','on']){
   res[kind][h][mode]=await p.evaluate(async([h,mode])=>{const A=window.__STORYWORLD_BLINK_CAMERA_R1236__;A.set(mode==='on');
    await ensureImages(heroPaths(h));player.hero=h;auto=false;try{guide=false}catch(_){}
    for(const e of liveEnemies()){e.x=player.x+40;e.y=player.y+40;e.speed=0;}player.hp=Math.max(player.hp,200);player.invincible=5;
    const wait=s=>new Promise(res=>{const t0=time,st=performance.now();const f=()=>{if(time-t0>=s||performance.now()-st>40000)res();else requestAnimationFrame(f)};requestAnimationFrame(f)});
    await wait(1);const off=()=>{const q=project(player.x,player.y);return Math.hypot(q.x-W/2,q.y-H/2)};
    const before=off(),x0=player.x,y0=player.y;player.blinkCD=0;const s0=A.inspect().stats.boosts;
    // 헤드리스는 한 프레임이 실제로 0.1~0.4초라 R81 이 이미 상한(.1초)으로 돈다 → 실기기 60fps 를 흉내: 블링크 뒤 실제 카메라 사슬
    //  (R81·R114·R217·R1124·R1236 모두 감싼 cameraTick)을 1/60초씩 동기로 36번(0.6초) 불러 잰다(그동안 게임 tick·그리기는 끼어들지 않음).
    const pre0=0;blink();var pre=off();const moved=Math.hypot(player.x-x0,player.y-y0);const tr=[];
    for(let i=1;i<=36;i++){cameraTick(1/60);tr.push([+(i/60).toFixed(3),+off().toFixed(1)]);}
    // 첫 칸은 블링크 직후(카메라 갱신 전) 거리
    {const q=project(player.x,player.y);}
    const peak=Math.max(before,...tr.map(q=>q[1]),pre);const at=s=>{let v=null;for(const q of tr)if(q[0]<=s+1e-9)v=q[1];return v};
    const settled=tr.find(q=>q[1]<=before+(peak-before)*.1);
    const r={moved:+moved.toFixed(2),ownsR81:!!window.__STORYWORLD_WORLD_PRESENTATION_R81__?.ownsCamera?.(),before:+before.toFixed(1),peak:+peak.toFixed(1),at01:at(.1),at02:at(.2),t90:settled?settled[0]:null,boosts:A.inspect().stats.boosts-s0,errors:A.inspect().stats.errors,frames:tr.length,trace:tr.filter((_,i)=>i%3==2).map(q=>q[1])};
    player.x=x0;player.y=y0;A.set(true);await wait(.6);return r;},[h,mode]);}
  console.log(kind,h,JSON.stringify(res[kind][h]));}
 // 걷기: 2초 걸을 때 R1236 따라잡기가 한 번도 켜지지 않는지
 res[kind].walk=await p.evaluate(async()=>{const A=window.__STORYWORLD_BLINK_CAMERA_R1236__;A.set(true);const s0=A.inspect().stats.boosts;keys.add('ArrowRight');
  await new Promise(res=>{const t0=time,st=performance.now();const f=()=>{if(time-t0>=2||performance.now()-st>60000)res();else requestAnimationFrame(f)};requestAnimationFrame(f)});keys.delete('ArrowRight');
  return {boosts:A.inspect().stats.boosts-s0,errors:A.inspect().stats.errors};});
 console.log(kind,'walk',JSON.stringify(res[kind].walk));
 // 전후 스크린샷: 같은 자리에서 미카엘라 블링크 0.1초(60fps 6번) 뒤 화면. off = 원래 카메라, on = R1236.
 fs.mkdirSync(new URL('./screens/',import.meta.url),{recursive:true});
 for(const mode of ['off','on']){await p.evaluate(async mode=>{const A=window.__STORYWORLD_BLINK_CAMERA_R1236__;await ensureImages(heroPaths('michaela'));player.hero='michaela';keys.clear?.();
   if(!window.__r1236home)window.__r1236home={x:player.x,y:player.y};player.x=window.__r1236home.x;player.y=window.__r1236home.y;A.set(true);for(let i=0;i<90;i++)cameraTick(1/60);
   A.set(mode==='on');player.blinkCD=0;blink();for(let i=0;i<6;i++)cameraTick(1/60);window.__r1236freeze=true;},mode);
  await p.evaluate(()=>{draw();});await p.screenshot({path:new URL(`./screens/${kind}-${mode}-blink-0.1s.png`,import.meta.url).pathname});}
 await ctx.close();}
fs.writeFileSync(new URL('./r1236-browser-result.json',import.meta.url),JSON.stringify(res,null,1));
console.log('pageerrors',res.errors.length,res.errors.slice(0,3));await b.close();
