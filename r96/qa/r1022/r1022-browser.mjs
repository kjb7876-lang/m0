// R1022 브라우저(헤드리스 소프트웨어 렌더링) 검사: 실제 게임에서 영웅 8명의 본편 E(돌진·회피)를 자동 시전으로 쏘아
//  자동 순간이동 켬/끔의 본체 이동·적 피해·분신을 잰다. 모바일 흉내(터치·좁은 화면)에서 기본값이 끔인지도 본다. GPU·실기기 아님.
import {chromium,boot,skip,go} from '../r444/lib.mjs';
import fs from 'node:fs';
const OUT=process.env.OUT||'screens';fs.mkdirSync(OUT,{recursive:true});
const init={'storyworld.r663.skillgrowth':JSON.stringify({on:false})};
const b=await chromium.launch();const res={pc:{},mobile:{},errors:[]};
async function session(kind){
 const vp=kind==='mobile'?{width:844,height:390}:{width:640,height:360};
 const ctx=await b.newContext(kind==='mobile'?{viewport:vp,isMobile:true,hasTouch:true,deviceScaleFactor:1,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'}:{viewport:vp,deviceScaleFactor:1});
 await ctx.addInitScript(([init])=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));for(const [k,v] of Object.entries(init))localStorage.setItem(k,v);},[init]);
 const p=await ctx.newPage();p.on('pageerror',e=>res.errors.push(kind+': '+String(e).slice(0,200)));
 await p.goto(process.env.SW_URL||'http://127.0.0.1:4410/m0/');await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
 await go(p,'murder01');return {ctx,p};}
const waitGame=(p,s)=>p.evaluate(s=>new Promise(res=>{const t0=time,st=performance.now();const f=()=>{for(let i=0;i<30&&storyScene;i++)advanceScene();if(modal)closePanel(true);if(time-t0>=s||performance.now()-st>60000)res();else requestAnimationFrame(f)};requestAnimationFrame(f)}),s);
async function dash(p,h,mode,shot){
 return p.evaluate(async([h,mode])=>{await ensureImages(heroPaths(h));player.hero=h;const A=window.__STORYWORLD_AUTO_MOVE_R1022__;A.set(mode==='on');auto=false;try{guide=false}catch(_){}
  player.hp=Math.max(player.hp,200);player.invincible=3;const L=liveEnemies();const e=L[0];for(const f of L.slice(1)){f.x=player.x+30;f.y=player.y+30;f.speed=0;}
  e.x=player.x+2.4;e.y=player.y;e.speed=0;e.hp=e.maxHp=Math.max(e.maxHp||0,4000);e.hp=4000;
  const s=player.storyWER;if(s)s.ready={};const x0=player.x,y0=player.y,hp0=e.hp,st0=A.stats(),c0=window.__STORYWORLD_CLONE_R767__.list().length;
  let maxD=0,ok;window.__r1022mx=0;
  ok=window.__STORYWORLD_WER__.cast('e',true);
  await new Promise(res=>{const t0=time,st=performance.now();const f=()=>{maxD=Math.max(maxD,Math.hypot(player.x-x0,player.y-y0));if(time-t0>=.9||performance.now()-st>60000)res();else requestAnimationFrame(f)};requestAnimationFrame(f)});
  const st1=A.stats();const r={cast:ok,on:A.on(),end:+Math.hypot(player.x-x0,player.y-y0).toFixed(2),maxSeenAtFrames:+maxD.toFixed(2),dmg:+(hp0-e.hp).toFixed(1),restores:st1.restores-st0.restores,clones:st1.clones-st0.clones,errors:st1.errors};
  player.x=x0;player.y=y0;return r;},[h,mode]);}
for(const kind of ['pc','mobile']){
 const {ctx,p}=await session(kind);
 res[kind].defaults=await p.evaluate(()=>({mobile:!!window.__STORYWORLD_MOBILE_R63__?.isMobile?.(),autoMove:window.__STORYWORLD_AUTO_MOVE_R1022__.on(),stored:localStorage.getItem('storyworld.r1022.autoMove')}));
 const heroes=await p.evaluate(()=>Object.keys(HEROES));
 for(const h of (kind==='pc'?heroes:['neon','slayer','gunner'])){res[kind][h]={};for(const mode of ['on','off'])res[kind][h][mode]=await dash(p,h,mode);console.log(kind,h,JSON.stringify(res[kind][h]));}
 // 손으로 누른 블링크(끔이어도 옮김)
 res[kind].manualBlink=await p.evaluate(async()=>{const A=window.__STORYWORLD_AUTO_MOVE_R1022__;A.set(false);player.blinkCD=0;const x0=player.x,y0=player.y;blink();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const d=Math.hypot(player.x-x0,player.y-y0);player.x=x0;player.y=y0;return {moved:+d.toFixed(2)};});
 // 길잡이 자동 블링크(끔이면 막힘): 체력 30%·블링크 준비·길잡이 켬
 res[kind].guideBlink=await p.evaluate(async()=>{const A=window.__STORYWORLD_AUTO_MOVE_R1022__;A.set(false);const s0=A.stats().autoBlinksBlocked;const L=liveEnemies();L[0].x=player.x+1.2;L[0].y=player.y;
  const x0=player.x,y0=player.y;let big=0,px=player.x,py=player.y;guide=true;
  await new Promise(res=>{const t0=time,st=performance.now();const f=()=>{player.hp=Math.min(player.hp,(typeof maxHP==='function'?maxHP():100)*.3);player.blinkCD=0;player.invincible=1;const d=Math.hypot(player.x-px,player.y-py);big=Math.max(big,d);px=player.x;py=player.y;if(time-t0>=2||performance.now()-st>60000)res();else requestAnimationFrame(f)};requestAnimationFrame(f)});
  guide=false;player.hp=200;const r={blocked:A.stats().autoBlinksBlocked-s0,biggestFrameJump:+big.toFixed(2)};player.x=x0;player.y=y0;return r;});
 console.log(kind,'manualBlink',JSON.stringify(res[kind].manualBlink),'guideBlink',JSON.stringify(res[kind].guideBlink),'defaults',JSON.stringify(res[kind].defaults));
 // 스크린샷: 끔 상태에서 네온 E 직후(분신이 끝점에)
 await p.evaluate(async()=>{await ensureImages(heroPaths('neon'));player.hero='neon';window.__STORYWORLD_AUTO_MOVE_R1022__.set(false);const e=liveEnemies()[0];e.x=player.x+2.4;e.y=player.y;e.speed=0;e.hp=4000;if(player.storyWER)player.storyWER.ready={};window.__STORYWORLD_WER__.cast('e',true);});
 await p.evaluate(()=>new Promise(res=>{const t0=time;const f=()=>{if(time-t0>=.2)res();else requestAnimationFrame(f)};requestAnimationFrame(f)}));
 await p.screenshot({path:`${OUT}/${kind}-off-neon-e.png`});
 await ctx.close();}
fs.writeFileSync(`${OUT}/../r1022-browser-result.json`,JSON.stringify(res,null,1));
console.log('pageerrors',res.errors.length,res.errors.slice(0,5));await b.close();
