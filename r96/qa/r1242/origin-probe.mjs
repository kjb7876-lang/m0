// 영웅별 기본탄 출발 높이 측정: 4방향 연사, 만든 직후 탄이 그려질 중심(탄 자리 − 18·zoom)의 발 위 높이(영웅 키 배수)와 그 순간 그려진 영웅 몸 그림(경로·칸)을 적는다.
//  HEROES=seoha,lauren OUT=out/r1242 node r96/qa/r1242/origin-probe.mjs
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out/r1242';fs.mkdirSync(OUT,{recursive:true});
const HEROES=(process.env.HEROES||'seoha').split(',');
const b=await chromium.launch({headless:true});const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r663.skillgrowth','{"on":false}');}catch(_){}});
const p=await ctx.newPage();await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.go('dist01','STORY');const P=window.__STORYWORLD_PROGRESSION_R71__;if(P?.difficultyState?.().open){P.selectDifficulty('normal');await P.confirmDifficulty();}});
await p.waitForFunction(()=>room?.id==='dist01'&&!loading,null,{timeout:180000});await skip();
await p.evaluate(()=>{guide=false;auto=false;settings.autoSkill=false;
 const W=window.__rp={shots:[],hero:null,on:false,pin:null};
 const ms=makeShot;makeShot=function(...a){const s=ms.apply(this,a);try{if(W.on&&s?.friendly&&s.owner==='hero'){const q=project(player.x,player.y),o=project(s.x,s.y);W.shots.push({t:time,basic:!!s.r160Basic,kind:s.attackKind9||null,asset:String(s.asset||'').split('/').pop(),dx:o.x-q.x,dy:o.y-q.y,H:actorHeight(),z:zoom,hero:W.hero});}}catch(e){W.err=String(e);}return s;};
 const dh=drawHero;drawHero=function(...a){const rec=ctx,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=dh.apply(this,a);
  try{if(W.on&&st>=0){let best=null,bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||!c.points)continue;if(!String(c.sourcePath||c.image?.src||'').includes(player.hero))continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;best=c;}}
   if(best){const q=project(player.x,player.y);W.hero={src:String(best.sourcePath||best.image?.src||'').replace(/^.*?(assets\/)/,'$1'),sr:best.sourceRect,pts:best.points.map(v=>[+(v[0]-q.x).toFixed(1),+(v[1]-q.y).toFixed(1)])};}}}catch(e){W.err=String(e);}return r;};
 {const ok=(x,y)=>{if(blocked(x,y,.5))return false;for(let s=0;s<16;s++){const S=s*Math.PI/8;for(const r of [1.6,3.2,4])if(blocked(x+Math.cos(S)*r,y+Math.sin(S)*r,.6))return false;}return true;};let best=null;for(let r=0;r<30&&!best;r+=.5)for(let a=0;a<6.283&&!best;a+=.3){const x=player.x+Math.cos(a)*r,y=player.y+Math.sin(a)*r;if(ok(x,y))best={x,y};}if(best){player.x=best.x;player.y=best.y;}}
 (function pin(){const P=W.pin;if(P){const e=P.e;e.x=player.x+P.dx;e.y=player.y+P.dy;e.spawnState='active';e.visible=true;e.hp=1e7;e.speed=0;e.attack=null;for(const v of room.enemies)if(v!==e&&v.hp>0){v.x=player.x-60;v.y=player.y-60;v.speed=0;}}requestAnimationFrame(pin);})();
});
const ALL={};
for(const hero of HEROES){await p.evaluate(async(h)=>{loading=true;try{await ensureImages(heroPaths(h));player.hero=h;player.combo=0;}finally{loading=false;}updateHUD();},hero);ALL[hero]=[];
for(const deg of [0,180,90,-90]){
 const t0=await p.evaluate(async(deg)=>{const W=window.__rp,S=deg*Math.PI/180,dx=(Math.cos(S)+2*Math.sin(S))/2,dy=(2*Math.sin(S)-Math.cos(S))/2,L=Math.hypot(dx,dy);room.engaged=true;
  const e=room.enemies.find(v=>v.hp>0&&!v.boss);W.pin={e,dx:dx/L*4,dy:dy/L*4};player.hp=maxHP();player.invincible=999;await new Promise(r=>setTimeout(r,300));W.shots=[];W.on=true;const t0=time;W.iv=setInterval(()=>{try{basicAttack(false);}catch(_){}},60);return t0;},deg);
 // 첫 탄이 만들어진 순간 화면
 try{await p.waitForFunction(()=>window.__rp.shots.length>0,null,{timeout:40000});}catch(_){await p.evaluate(()=>{clearInterval(window.__rp.iv);window.__rp.on=false;});ALL[hero].push({deg,n:0});console.log(hero,deg,'탄 없음');continue;}
 const q=await p.evaluate(()=>{const W=window.__rp,s=W.shots[0];return{...project(player.x,player.y),s,hero:W.hero};});
 await p.screenshot({path:`${OUT}/${hero}-${deg}.png`,clip:{x:Math.max(0,q.x-70),y:Math.max(0,q.y-100),width:140,height:120}});
 await p.waitForFunction((t)=>time>=t+1.0,t0,{timeout:240000});
 const log=await p.evaluate(()=>{const W=window.__rp;clearInterval(W.iv);W.on=false;return{shots:W.shots.slice(0,3),hero:W.hero,err:W.err};});
 const s=log.shots.find(s=>s.basic)||log.shots[0];const row={deg,n:log.shots.length,asset:s?.asset,h:s?+((-s.dy+18*s.z)/s.H).toFixed(2):null,dx:s?+s.dx.toFixed(1):null,H:s?.H,hero:log.hero,firstHero:q.hero,err:log.err};
 ALL[hero].push(row);console.log(hero,deg,JSON.stringify(row).slice(0,500));}}
fs.writeFileSync(`${OUT}/origins.json`,JSON.stringify(ALL,null,1));await b.close();
