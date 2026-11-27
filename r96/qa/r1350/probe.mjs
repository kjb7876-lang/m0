// R1350 탐색: Q 회상 광선포 시작점 vs 실제 총구(3D 소총 EmissionFX / 2D 그림 총구)
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4410/m0/',OUT=process.env.OUT||'/tmp/claude-0/r1350';fs.mkdirSync(OUT,{recursive:true});
const MODE=process.env.MODE||'3d';
const b=await chromium.launch({headless:true});const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript((mode)=>{try{localStorage.setItem('storyworld.r953.gunnerVeil','{"on":false}');localStorage.setItem('storyworld.r663.skillgrowth','{"on":false}');localStorage.setItem('storyworld.r1302.hwando3d',mode==='3d'?'on':'off');}catch(_){}},MODE);
const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.go('dist01','STORY');const P=window.__STORYWORLD_PROGRESSION_R71__;if(P?.difficultyState?.().open){P.selectDifficulty('normal');await P.confirmDifficulty();}});
await p.waitForFunction(()=>room?.id==='dist01'&&!loading,null,{timeout:180000});await skip();
await p.evaluate(async()=>{try{window.__STORYWORLD_GUNNER_ARMS_R561__.set({chain:false});}catch(_){}guide=false;auto=false;settings.autoSkill=false;loading=true;try{await ensureImages(heroPaths('gunner'));player.hero='gunner';}finally{loading=false;}
 const W=window.__p={log:[],tips:[],pin:null};
 {const ok=(x,y)=>{if(blocked(x,y,.5))return false;for(let s=0;s<16;s++){const S=s*Math.PI/8;for(const r of [1.6,3.2,4.5])if(blocked(x+Math.cos(S)*r,y+Math.sin(S)*r,.5))return false;}return true;};
  let best=null;for(let r=0;r<30&&!best;r+=.5)for(let a=0;a<6.283&&!best;a+=.3){const x=player.x+Math.cos(a)*r,y=player.y+Math.sin(a)*r;if(ok(x,y))best={x,y};}if(best){player.x=best.x;player.y=best.y;}W.spot=best;}
 (function pin(){const P=W.pin;if(P){const e=P.e;e.x=player.x+P.dx;e.y=player.y+P.dy;e.spawnState='active';e.visible=true;e.hp=1e7;e.speed=0;e.attack=null;for(const v of room.enemies)if(v!==e&&v.hp>0){v.x=player.x-60;v.y=player.y-60;v.speed=0;}}requestAnimationFrame(pin);})();
 // 매 렌더: 3D 소총 끝(자세 걸린 뒤) 화면 자리
 (function hook(){const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(!r?.scene||r.scene.__p1350){setTimeout(hook,300);return;}r.scene.__p1350=true;
  setTimeout(()=>{const pb=r.scene.onBeforeRender;r.scene.onBeforeRender=function(...a){const out=pb?.apply(this,a);try{const g=r.scene.children.find(c=>/^r1305-gunner-3d-shared$/.test(c.name||'')&&c.visible);if(g){let tip=null,butt=null;g.traverse(o=>{if(/^EmissionFX/.test(o.name||''))tip=o;});
   if(tip){const T=r.T,v=tip.getWorldPosition(new T.Vector3()),pr=v.clone().project(r.camera),w=r.projection.width,h=r.projection.height;const q=project(player.x,player.y),gs=r.projection.worldToScreen(g.position.x,g.position.z,g.position.y);
    W.tips.push({t:time,x:(pr.x+1)*w/2-q.x,y:(1-pr.y)*h/2-q.y,world:[v.x,v.y,v.z],gs:[gs.x-q.x,gs.y-q.y],rotY:g.rotation.y});}}}catch(e){W.err=String(e);}return out;};},1500);})();
 const hookC=(c)=>{if(c&&!c.__p1350){c.__p1350=true;const di=c.drawImage;c.drawImage=function(im,...a){try{if(W.dbg&&W.dbgl.length<400)W.dbgl.push([im?.width,im?.height,String(im?.src||'').slice(-40),...a.map(v=>+(+v).toFixed(1))]);if(a.length>=8&&a[3]===128&&a[5]===-64&&a[4]===0&&(im?.width===3072||/gunner-q-beam/.test(String(im?.src||'')))){const m=c.getTransform?.();if(m){const q=project(player.x,player.y);const lx=a[4]+(a[4]<=-1?-a[4]:0),ly=0;/* 첫 조각(o=0)만: dest x = -piv0 */if(Math.abs(a[4]+0)<1e-6||a[4]<0){W.log.push({pl:[+player.x.toFixed(2),+player.y.toFixed(2)],t:time,x:m.e-q.x,y:m.f-q.y,ang:Math.atan2(m.b,m.a)*180/Math.PI});}}}}catch(e){W.err=String(e);}return di.call(this,im,...a);};}};const de=drawEffect;drawEffect=function(...a){try{hookC(ctx);}catch(_){}return de.apply(this,a);};
});
await p.waitForTimeout(2500);
const res=[];
for(const deg of (process.env.DEGS||'0,45,90,135,180,-135,-90,-45,22.5,-112.5').split(',').map(Number)){
 const r=await p.evaluate(async(deg)=>{const W=window.__p,S=deg*Math.PI/180,P=player;/* deg = 화면 각 → 땅 벡터 */const dx=(Math.cos(S)+2*Math.sin(S))/2,dy=(2*Math.sin(S)-Math.cos(S))/2,L=Math.hypot(dx,dy);room.engaged=true;
  const e=room.enemies.find(v=>v.hp>0&&!v.boss);W.pin={e,dx:dx/L*3.4,dy:dy/L*3.4};P.hp=maxHP();P.invincible=999;keys.clear?.();P.specialCD=0;
  await new Promise(r=>setTimeout(r,1200));W.log=[];W.tips=[];W.dbgl=[];W.dbg=true;const t0=time;special();return t0;},deg);
 if(process.env.MOVE){await p.waitForFunction((t)=>time>=t+.3,r,{timeout:240000});await p.keyboard.down(process.env.MOVE);await p.waitForFunction((t)=>time>=t+.7,r,{timeout:240000});await p.keyboard.up(process.env.MOVE);}
 await p.waitForFunction((t)=>time>=t+1.0,r,{timeout:240000});
 const q=await p.evaluate(()=>project(player.x,player.y));await p.screenshot({path:`${OUT}/${MODE}-${deg}.png`,clip:{x:Math.max(0,q.x-160),y:Math.max(0,q.y-200),width:320,height:300}}).catch(()=>{});
 const log=await p.evaluate(()=>{const W=window.__p;return {log:W.log,tips:W.tips,err:W.err,fx:window.__STORYWORLD_GUNNER_ARMS_R561__.inspect().effects};});
 0&&console.log('dl',JSON.stringify(await p.evaluate(()=>{const W=window.__p;W.dbg=false;const u={};for(const r of W.dbgl){const k=r.slice(0,3).join('|');u[k]=(u[k]||0)+1;}return [u,W.dbgl.filter(r=>r[0]>2000).slice(0,5)];})));console.log('m3',JSON.stringify(await p.evaluate(()=>window.__STORYWORLD_GUNNER_ARMS_R561__.inspect().muzzle3d)));console.log("dbg",JSON.stringify(await p.evaluate(()=>({st:window.__STORYWORLD_GUNNER_ARMS_R561__.inspect().stats,cd:player.specialCD,hero:player.hero,ego:!!window.__STORYWORLD_EGO151__?.inspect?.().state?.active,busy:typeof storyScene!=="undefined"&&!!storyScene}))));const pairs=[];for(const l of log.log){let tp=null,bd=9;for(const t of log.tips){const d=Math.abs(t.t-l.t);if(d<bd){bd=d;tp=t;}}if(bd>.05)tp=null;pairs.push({t:+(l.t-r).toFixed(3),beam:[+l.x.toFixed(1),+l.y.toFixed(1)],ang:+l.ang.toFixed(1),tip:tp?[+tp.x.toFixed(1),+tp.y.toFixed(1)]:null,d:tp?+Math.hypot(l.x-tp.x,l.y-tp.y).toFixed(1):null,rotY:tp?+tp.rotY.toFixed(2):null,pl:l.pl,gs:tp?tp.gs.map(v=>+v.toFixed(1)):null});}
 console.log(deg, JSON.stringify(pairs.filter((_,i)=>i%2==0)), log.err||'', 'tips',log.tips.length);
 res.push({deg,pairs});
}
fs.writeFileSync(`${OUT}/${MODE}.json`,JSON.stringify({res,errors},null,1));console.log('errors',errors.slice(0,5));await b.close();
