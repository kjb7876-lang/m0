import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out/r1232';fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch({headless:true});const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r663.skillgrowth','{"on":false}');}catch(_){}});
const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.go('dist01','STORY');const P=window.__STORYWORLD_PROGRESSION_R71__;if(P?.difficultyState?.().open){P.selectDifficulty('normal');await P.confirmDifficulty();}});
await p.waitForFunction(()=>room?.id==='dist01'&&!loading,null,{timeout:180000});await skip();
await p.evaluate(async()=>{guide=false;auto=false;settings.autoSkill=false;loading=true;try{await ensureImages(heroPaths('michaela'));player.hero='michaela';player.combo=0;}finally{loading=false;}updateHUD();
 const W=window.__r1232={shots:[],draws:[],hero:[],on:false,pin:null};
 const ms=makeShot;makeShot=function(...a){const s=ms.apply(this,a);try{if(W.on&&s?.friendly&&s.owner==='hero'){const q=project(player.x,player.y),o=project(s.x,s.y);W.shots.push({t:time,basic:!!s.r160Basic,asset:String(s.asset||'').split('/').pop(),dx:o.x-q.x,dy:o.y-q.y,H:actorHeight(),z:zoom,args:a.slice(0,2)});s.__r1232=1;W.last=s;}}catch(e){W.err=String(e);}return s;};
 const dp=drawProjectile;drawProjectile=function(pp,...r){try{if(W.on&&pp?.__r1232&&!pp.__seen){pp.__seen=1;const q=project(player.x,player.y),o=project(pp.x,pp.y);W.draws.push({h:(q.y-(o.y-18*zoom))/actorHeight(),x:o.x-q.x,moved:!!pp.r1232Michaela});}}catch(e){W.err=String(e);}return dp.apply(this,[pp,...r]);};
 const dh=drawHero;drawHero=function(...a){const r=dh.apply(this,a);return r;};
 {const ok=(x,y)=>{if(blocked(x,y,.5))return false;for(let s=0;s<16;s++){const S=s*Math.PI/8;for(const r of [1.6,3.2,4])if(blocked(x+Math.cos(S)*r,y+Math.sin(S)*r,.6))return false;}return true;};let best=null;for(let r=0;r<30&&!best;r+=.5)for(let a=0;a<6.283&&!best;a+=.3){const x=player.x+Math.cos(a)*r,y=player.y+Math.sin(a)*r;if(ok(x,y))best={x,y};}if(best){player.x=best.x;player.y=best.y;}}
 (function pin(){const P=W.pin;if(P){const e=P.e;e.x=player.x+P.dx;e.y=player.y+P.dy;e.spawnState='active';e.visible=true;e.hp=1e7;e.speed=0;e.attack=null;for(const v of room.enemies)if(v!==e&&v.hp>0){v.x=player.x-60;v.y=player.y-60;v.speed=0;}}requestAnimationFrame(pin);})();
});
const ALL=[];
for(const deg of [0,90,180,-90,45]){
 const t0=await p.evaluate(async(deg)=>{const W=window.__r1232,S=deg*Math.PI/180,dx=(Math.cos(S)+2*Math.sin(S))/2,dy=(2*Math.sin(S)-Math.cos(S))/2,L=Math.hypot(dx,dy);room.engaged=true;
  const e=room.enemies.find(v=>v.hp>0&&!v.boss);W.pin={e,dx:dx/L*4,dy:dy/L*4};player.hp=maxHP();player.invincible=999;await new Promise(r=>setTimeout(r,300));W.shots=[];W.draws=[];W.on=true;const t0=time;W.iv=setInterval(()=>{try{basicAttack(false);}catch(_){}},60);return t0;},deg);
 await p.waitForFunction((t)=>time>=t+1.2,t0,{timeout:240000});
 const q=await p.evaluate(()=>{window.tickScaleR1232=1;return project(player.x,player.y);});
 await p.screenshot({path:`${OUT}/d${deg}.png`,clip:{x:Math.max(0,q.x-160),y:Math.max(0,q.y-200),width:320,height:260}});
 const log=await p.evaluate(()=>{const W=window.__r1232;clearInterval(W.iv);W.on=false;return{shots:W.shots,draws:W.draws,err:W.err};});
 ALL.push({deg,...log});console.log(deg,JSON.stringify(log.draws.slice(0,2)),log.err||'');}
let fails=0;const check=(n,ok,info)=>{if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+n+(info===undefined?'':' '+JSON.stringify(info).slice(0,800)));};
const D=ALL.flatMap(a=>a.draws.map(d=>({deg:a.deg,...d})));
check('(1) 5방향 기본탄 모두 그려짐·옮겨짐',D.length>=10&&D.every(d=>d.moved),D.filter(d=>!d.moved).slice(0,5));
const S=ALL.flatMap(a=>a.shots.filter(s=>s.basic).map(s=>({deg:a.deg,h:(-s.dy+18*s.z)/s.H,x:s.dx})));/* 출발 순간(탄을 만든 직후) 그려질 중심 = 탄 자리 − 18·zoom */
check('(2) 출발 순간 그려지는 탄 중심 높이 = 영웅 키 0.55~0.61배(가운데 살짝 위), 5방향 모든 기본탄',S.length>=10&&S.every(d=>d.h>=.55&&d.h<=.61),S.map(d=>({deg:d.deg,h:+d.h.toFixed(3),x:+d.x.toFixed(1)})).filter((d,i,a)=>a.findIndex(e=>e.deg===d.deg)===i));
console.log('INSPECT',JSON.stringify(await p.evaluate(()=>({i:window.__STORYWORLD_MICHAELA_SHOT_R1232__?.inspect(),ba:!!basicAttack.r1232,ms:!!makeShot.r1232,last:(({owner,attackKind9,asset,r160Basic,friendly})=>({owner,attackKind9,asset,r160Basic,friendly}))(window.__r1232.last||{})}))));
const sz=await p.evaluate(()=>{const R=window.__STORYWORLD_PROJ_SHEETS_R912__,k=R.kinds.pj03;return{size:k.size,H:actorHeight(),px:k.size*actorHeight(),r911:window.__STORYWORLD_PROJ_SIZE_R911__?.stats||null};});
check('(3) 탄 몸통 = 영웅 키 .46(예전 .60)',Math.abs(sz.size-.46)<1e-9,sz);
check('페이지 오류 없음',errors.length===0&&ALL.every(a=>!a.err),errors);
console.log(JSON.stringify({fails}));await b.close();process.exit(fails?1:0);
