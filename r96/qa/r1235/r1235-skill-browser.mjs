// R1235b 헤드리스 검사(Playwright, 소프트웨어 렌더·3D 기록기): 미카엘라 Q·W·E·R 을 쓰고 1.6초(게임 시간) 동안 기록기에 들어간 그림 명령을 센다.
//  (1) 후광·빛기둥·고리·큰 십자 R106 코드 그림이 남지 않음  (2) M1·M7·C4·M4 시트 칸이 그려짐  (3) 오류 없음.  OFF=1 이면 끈 상태(전 장면).
//   STORYWORLD_URL=http://127.0.0.1:4396/m0/ OUT=out/r1235s node r96/qa/r1235/r1235-skill-browser.mjs   (GPU·실기기·자연 플레이 미검증)
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out/r1235s',OFF=!!process.env.OFF;fs.mkdirSync(OUT,{recursive:true});
let fails=0;const check=(n,ok,info)=>{if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+n+(info===undefined?'':' '+JSON.stringify(info).slice(0,900)));};
const b=await chromium.launch({headless:true});const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript((off)=>{try{localStorage.setItem('storyworld.r663.skillgrowth','{"on":false}');localStorage.setItem('storyworld.r948.heart','off');if(off)localStorage.setItem('storyworld.r1235.skillSheets','off');}catch(_){}},OFF);
const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.go('dist01','STORY');const P=window.__STORYWORLD_PROGRESSION_R71__;if(P?.difficultyState?.().open){P.selectDifficulty('normal');await P.confirmDifficulty();}});
await p.waitForFunction(()=>room?.id==='dist01'&&!loading,null,{timeout:180000});await skip();
await p.evaluate(async()=>{guide=false;auto=false;settings.autoSkill=false;loading=true;try{await ensureImages(heroPaths('michaela'));player.hero='michaela';}finally{loading=false;}updateHUD();
 const W=window.__rs={on:false,img:{}};
 const dh=drawHero;drawHero=function(...a){try{const C=ctx?.commands;if(Array.isArray(C)&&!C.rs){C.rs=true;const pb=C.push;C.push=function(...items){try{if(W.on)for(const c of items){if(c?.kind!=='image'||!c.owner?.r106)continue;const s=String(c.sourcePath||'');const m=/^r106fx:([a-z-]+):/.exec(s);let k=m?'r106:'+m[1]:s.replace(/^.*?(assets\/)/,'$1');
   if(m&&m[1]==='cross'){const h=Math.abs(c.points[3][1]-c.points[0][1]);k+=h>=actorHeight()*.5?':big':':small';}W.img[k]=(W.img[k]||0)+1;}}catch(e){W.err=String(e);}return pb.apply(this,items);};}}catch(e){W.err=String(e);}return dh.apply(this,a);};
 {const ok=(x,y)=>{if(blocked(x,y,.5))return false;for(let s=0;s<16;s++){const S=s*Math.PI/8;for(const r of [1.6,3.2,4])if(blocked(x+Math.cos(S)*r,y+Math.sin(S)*r,.6))return false;}return true;};let best=null;for(let r=0;r<30&&!best;r+=.5)for(let a=0;a<6.283&&!best;a+=.3){const x=player.x+Math.cos(a)*r,y=player.y+Math.sin(a)*r;if(ok(x,y))best={x,y};}if(best){player.x=best.x;player.y=best.y;}}
 const es=room.enemies.filter(v=>v.hp>0&&!v.boss).slice(0,3);for(const v of room.enemies)if(v.hp>0&&!es.includes(v)){v.x=player.x-60;v.y=player.y-60;v.speed=0;}
 es.forEach((e,i)=>{e.x=player.x+2.2+i*.6;e.y=player.y-1+i*.8;e.hp=1e7;e.maxHp=1e7;e.speed=0;e.attack=null;});room.engaged=true;player.invincible=999;});
const casts=[['Q',()=>p.evaluate(()=>{player.specialCD=0;special();})],['W',()=>p.evaluate(()=>window.__STORYWORLD_WER__.cast('w'))],['E',()=>p.evaluate(()=>window.__STORYWORLD_WER__.cast('e',true))],['R',()=>p.evaluate(()=>window.__STORYWORLD_WER__.cast('r'))]];
const RES={};
for(const [k,fn] of casts){
 const t0=await p.evaluate(async()=>{const W=window.__rs;player.hp=maxHP();await new Promise(r=>setTimeout(r,900));W.img={};W.on=true;return time;});
 await fn();await p.waitForFunction(t=>time>=t+.45,t0,{timeout:240000});
 const q=await p.evaluate(()=>project(player.x+1,player.y-.3));await p.screenshot({path:`${OUT}/${k}${OFF?'-off':''}.png`,clip:{x:Math.max(0,q.x-200),y:Math.max(0,q.y-230),width:400,height:290}});
 await p.waitForFunction(t=>time>=t+1.6,t0,{timeout:240000});
 RES[k]=await p.evaluate(()=>{const W=window.__rs;W.on=false;return{img:W.img,err:W.err};});console.log(k,JSON.stringify(RES[k]).slice(0,500));}
fs.writeFileSync(`${OUT}/skill${OFF?'-off':''}.json`,JSON.stringify(RES,null,1));
const sum=k=>Object.values(RES).reduce((n,r)=>n+(r.img[k]||0),0);
if(!OFF){
 check('(1) 후광·빛기둥·고리·큰 십자 R106 코드 그림 0',['r106:halo','r106:pillar','r106:ring','r106:cross:big'].every(k=>sum(k)===0),Object.fromEntries(['r106:halo','r106:pillar','r106:ring','r106:cross:big','r106:flare'].map(k=>[k,sum(k)])));
 check('(2) M1·M7·C4·M4 시트 칸이 그려짐',['assets/r1041/fx-m1-michaela-halo.webp','assets/r1041/fx-m7-michaela-sky-pillar.webp','assets/r1041/fx-c4-ground-ring.webp','assets/r1041/fx-m4-michaela-hit.webp'].every(k=>sum(k)>0),Object.fromEntries(Object.keys(Object.assign({},...Object.values(RES).map(r=>r.img))).map(k=>[k,sum(k)])));}
else check('(끔) 예전 코드 그림이 그려짐',sum('r106:ring')>0&&sum('r106:halo')>0,{ring:sum('r106:ring'),halo:sum('r106:halo')});
check('페이지 오류 없음',errors.length===0&&Object.values(RES).every(r=>!r.err),errors);
console.log(JSON.stringify({fails}));await b.close();process.exit(fails?1:0);
