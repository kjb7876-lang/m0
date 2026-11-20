// R1266 브라우저(헤드리스 소프트웨어 렌더링) 검사: 실제 S 키 블링크 뒤 rAF 마다 영웅이 화면 가운데에서 떨어진 거리(px)를 잰다.
//  경우: 스토리(R81 카메라)·꿈 층 DREAM(R1245 카메라)·모바일 흉내(R63 카메라)·EGO 형태(F). 끔(R1236/R1266 set(false))과 켬 비교. GPU·실기기 아님.
import {chromium,boot,skip,go} from '../r444/lib.mjs';
import fs from 'node:fs';
const b=await chromium.launch();const res={errors:[]};
async function measure(p,h,mode,pre){
 return p.evaluate(async([h,mode,pre])=>{const A=window.__STORYWORLD_BLINK_CAMERA_R1236__;A.set(mode==='on');
  if(h){await ensureImages(heroPaths(h));player.hero=h;}auto=false;try{guide=false}catch(_){}
  for(const e of liveEnemies()){e.x=player.x+40;e.y=player.y+40;e.speed=0;}player.hp=Math.max(player.hp,300);player.invincible=9;player.blinkCD=0;
  const off=()=>{const q=project(player.x,player.y);return Math.round(Math.hypot(q.x-W/2,q.y-H/2))};
  await new Promise(r=>{const t0=time;const w=()=>{if(time-t0>.8)r();else requestAnimationFrame(w)};requestAnimationFrame(w)});
  window.__r=[];window.__x0={x:player.x,y:player.y,off:off(),ego:!!window.__STORYWORLD_EGO_KIT_R1094__?.active?.()};const f=()=>{window.__r.push(off());if(window.__r.length<10)requestAnimationFrame(f)};requestAnimationFrame(f);},[h,mode,pre]).then(async()=>{
  await p.keyboard.press('s');await p.waitForFunction(()=>window.__r.length>=10,null,{timeout:120000});
  return p.evaluate(()=>{const r={before:window.__x0.off,ego:window.__x0.ego,moved:+Math.hypot(player.x-window.__x0.x,player.y-window.__x0.y).toFixed(2),offsets:window.__r,layer,owner:window.__STORYWORLD_WORLD_PRESENTATION_R81__?.ownsCamera?.()?'R81':(window.__STORYWORLD_DREAM_CAMERA_R1245__?.inspect?.().stats.updates?'R1245?':'R63'),snaps:window.__STORYWORLD_BLINK_CAMERA_R1236__.inspect().stats.snaps};
   window.__STORYWORLD_BLINK_CAMERA_R1236__.set(true);return r;});});}
const cases=[];
for(const kind of ['pc','mobile']){
 const vp=kind==='mobile'?{width:844,height:390}:{width:1280,height:720};
 const ctxOpt=kind==='mobile'?{isMobile:true,hasTouch:true}:{};
 const {ctx,p}=await boot(b,{vp,init:{'storyworld.r663.skillgrowth':JSON.stringify({on:false})}});
 p.on('pageerror',e=>res.errors.push(kind+': '+String(e).slice(0,200)));
 await go(p,'murder01');
 for(const h of ['michaela','neon','gunner'])for(const mode of ['off','on']){const r=await measure(p,h,mode);cases.push({kind,where:'story',h,mode,...r});console.log(kind,'story',h,mode,JSON.stringify(r));}
 if(kind==='pc'){
  // EGO 형태(환도 + F)
  await p.evaluate(async()=>{await ensureImages(heroPaths('hwando'));player.hero='hwando';});await p.keyboard.press('f');await p.waitForTimeout(1500);
  for(const mode of ['off','on']){const r=await measure(p,null,mode);cases.push({kind,where:'story-ego-F',h:'hwando',mode,...r});console.log(kind,'ego',mode,JSON.stringify(r));}
  // 꿈 층
  await p.evaluate(()=>enterRegion('murder01',null,{layer:'DREAM',restore:true}));await p.waitForFunction(()=>!loading&&layer==='DREAM',null,{timeout:150000});await skip(p);
  for(const h of ['michaela','seoha'])for(const mode of ['off','on']){const r=await measure(p,h,mode);cases.push({kind,where:'dream',h,mode,...r});console.log(kind,'dream',h,mode,JSON.stringify(r));}}
 await ctx.close();}
res.cases=cases;fs.writeFileSync(new URL('./r1266-browser-result.json',import.meta.url),JSON.stringify(res,null,1));
console.log('pageerrors',res.errors.length,res.errors.slice(0,3));await b.close();
