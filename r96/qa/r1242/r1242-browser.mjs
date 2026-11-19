// R1242 헤드리스 검사(Playwright, 소프트웨어 렌더): 윤서하 기본탄 8방향 연사 — 탄을 만든 직후 그려질 중심(탄 자리 − 18·zoom)이
//  다음에 그려진 R143 공격 칸의 구슬(그 칸 그림의 구슬 픽셀을 그려진 네 꼭짓점으로 옮긴 자리)과 가까운지, 머리 높이가 아닌지.
//   STORYWORLD_URL=http://127.0.0.1:4396/m0/ OUT=out/r1242 node r96/qa/r1242/r1242-browser.mjs   (GPU·실기기·자연 플레이 미검증)
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out/r1242';fs.mkdirSync(OUT,{recursive:true});
let fails=0;const check=(n,ok,info)=>{if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+n+(info===undefined?'':' '+JSON.stringify(info).slice(0,1500)));};
const b=await chromium.launch({headless:true});const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r663.skillgrowth','{"on":false}');}catch(_){}});
const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.go('dist01','STORY');const P=window.__STORYWORLD_PROGRESSION_R71__;if(P?.difficultyState?.().open){P.selectDifficulty('normal');await P.confirmDifficulty();}});
await p.waitForFunction(()=>room?.id==='dist01'&&!loading,null,{timeout:180000});await skip();
await p.evaluate(async()=>{guide=false;auto=false;settings.autoSkill=false;loading=true;try{await ensureImages(heroPaths('seoha'));player.hero='seoha';player.combo=0;}finally{loading=false;}updateHUD();
 const O=window.__STORYWORLD_SEOHA_ORB_R1242__.ORB;
 const W=window.__r1242={shots:[],frames:[],on:false,pin:null};
 const ms=makeShot;makeShot=function(...a){const s=ms.apply(this,a);try{if(W.on&&s?.friendly&&s.owner==='hero'&&/seoha-a\.webp/.test(String(s.asset))){const q=project(player.x,player.y),o=project(s.x,s.y);W.shots.push({t:time,x:o.x-q.x,y:o.y-18*zoom-q.y,H:actorHeight(),moved:!!s.r1242Orb});}}catch(e){W.err=String(e);}return s;};
 const dh=drawHero;drawHero=function(...a){const rec=ctx,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=dh.apply(this,a);
  try{if(W.on&&st>=0){let best=null,bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||!c.points)continue;if(!/seoha/.test(String(c.sourcePath||c.image?.src||'')))continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;best=c;}}
   const m=best&&/r143\/attack\/seoha\/attack-([a-z]+)\.webp/.exec(String(best.sourcePath||best.image?.src||''));
   if(m&&O[m[1]]){const P=best.points,q=project(player.x,player.y),sr=best.sourceRect||[0,0,192,256],u=O[m[1]][0]/sr[2],v=O[m[1]][1]/sr[3];
    W.frames.push({t:time,sheet:m[1],mir:P[1][0]<P[0][0],x:P[0][0]+(P[1][0]-P[0][0])*u+(P[3][0]-P[0][0])*v-q.x,y:P[0][1]+(P[1][1]-P[0][1])*u+(P[3][1]-P[0][1])*v-q.y});}}}catch(e){W.err=String(e);}return r;};
 {const ok=(x,y)=>{if(blocked(x,y,.5))return false;for(let s=0;s<16;s++){const S=s*Math.PI/8;for(const r of [1.6,3.2,4])if(blocked(x+Math.cos(S)*r,y+Math.sin(S)*r,.6))return false;}return true;};let best=null;for(let r=0;r<30&&!best;r+=.5)for(let a=0;a<6.283&&!best;a+=.3){const x=player.x+Math.cos(a)*r,y=player.y+Math.sin(a)*r;if(ok(x,y))best={x,y};}if(best){player.x=best.x;player.y=best.y;}}
 (function pin(){const P=W.pin;if(P){const e=P.e;e.x=player.x+P.dx;e.y=player.y+P.dy;e.spawnState='active';e.visible=true;e.hp=1e7;e.speed=0;e.attack=null;for(const v of room.enemies)if(v!==e&&v.hp>0){v.x=player.x-60;v.y=player.y-60;v.speed=0;}}requestAnimationFrame(pin);})();
});
const ALL=[];
for(let i=0;i<8;i++){const deg=-180+i*45;
 const t0=await p.evaluate(async(deg)=>{const W=window.__r1242,S=deg*Math.PI/180,dx=(Math.cos(S)+2*Math.sin(S))/2,dy=(2*Math.sin(S)-Math.cos(S))/2,L=Math.hypot(dx,dy);room.engaged=true;
  const e=room.enemies.find(v=>v.hp>0&&!v.boss);W.pin={e,dx:dx/L*3.5,dy:dy/L*3.5};player.hp=maxHP();player.invincible=999;await new Promise(r=>setTimeout(r,300));W.shots=[];W.frames=[];W.on=true;const t0=time;W.iv=setInterval(()=>{try{basicAttack(false);}catch(_){}},60);return t0;},deg);
 await p.waitForFunction((t)=>time>=t+1.6,t0,{timeout:240000});
 const q=await p.evaluate(()=>project(player.x,player.y));await p.screenshot({path:`${OUT}/d${i}.png`,clip:{x:Math.max(0,q.x-70),y:Math.max(0,q.y-100),width:140,height:120}});
 const log=await p.evaluate(()=>{const W=window.__r1242;clearInterval(W.iv);W.on=false;return{shots:W.shots,frames:W.frames,err:W.err};});
 const rows=[];for(const s of log.shots){const f=log.frames.find(f=>f.t>=s.t-1e-6);if(!f)continue;rows.push({d:+Math.hypot(s.x-f.x,s.y-f.y).toFixed(1),h:+(-s.y/s.H).toFixed(2),H:s.H,sheet:f.sheet+(f.mir?'M':''),moved:s.moved});}
 ALL.push({deg,rows,err:log.err});console.log(deg,JSON.stringify(rows.slice(0,3)));}
fs.writeFileSync(`${OUT}/r1242.json`,JSON.stringify(ALL));
const R=ALL.flatMap(a=>a.rows.map(r=>({deg:a.deg,...r})));
check('(1) 8방향 기본탄 모두 옮겨짐(16발 이상)',R.length>=16&&R.every(r=>r.moved),R.filter(r=>!r.moved).slice(0,6));
check('(2) 그려질 탄 중심이 같은 순간 그려진 공격 칸 구슬에서 영웅 키 0.12배 안',R.every(r=>r.d<=r.H*.12),R.filter(r=>r.d>r.H*.12).slice(0,8));
check('(3) 높이 영웅 키 0.55~0.75배(머리 아님)',R.every(r=>r.h>=.55&&r.h<=.75),R.filter(r=>!(r.h>=.55&&r.h<=.75)).slice(0,8));
check('페이지 오류 없음',errors.length===0&&ALL.every(a=>!a.err),errors.concat(ALL.map(a=>a.err).filter(Boolean)));
console.log(JSON.stringify({fails}));await b.close();process.exit(fails?1:0);
