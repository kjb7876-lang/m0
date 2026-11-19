// R1235 미카엘라 이펙트 그리기 전수조사: 각 기술을 쓰고 2.5초(게임 시간) 동안 그려지는 명령을 이미지(시트 경로)·코드 도형으로 나눠 센다.
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out/r1235';fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch({headless:true});const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r663.skillgrowth','{"on":false}');}catch(_){}});
const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.go('dist01','STORY');const P=window.__STORYWORLD_PROGRESSION_R71__;if(P?.difficultyState?.().open){P.selectDifficulty('normal');await P.confirmDifficulty();}});
await p.waitForFunction(()=>room?.id==='dist01'&&!loading,null,{timeout:180000});await skip();
await p.evaluate(async()=>{guide=false;auto=false;settings.autoSkill=false;loading=true;try{await ensureImages(heroPaths('michaela'));player.hero='michaela';}finally{loading=false;}updateHUD();
 const W=window.__r1235={on:false,img:{},kinds:{},samples:[]};
 const fileOf=()=>{const st=String(new Error().stack).split('\n').slice(2);const fs=[];for(const l of st){const m=/\/([\w.-]+\.js)(?:\?[^:]*)?:\d+:\d+/.exec(l);if(m&&!/^(?:index|perf-r97|projectile-size-r911|phase1|play-r111|visual-r119|polish-r101)\b/.test(m[1])&&!fs.includes(m[1]))fs.push(m[1]);if(fs.length>=3)break;}return fs.join('<')||'engine';};
 const rec=(c)=>{try{if(!W.on)return;const f=fileOf(),k=c?.kind||'?';if(k==='image'){const s=String(c.sourcePath||c.image?.src||(c.image?.getContext?'CANVAS':'?')).replace(/^.*?(assets\/)/,'$1').split('?')[0];const key=f+' :: '+s;W.img[key]=(W.img[key]||0)+1;}else{const key=f+' :: '+k;W.kinds[key]=(W.kinds[key]||0)+1;}}catch(e){W.err=String(e);}};
 const dh=drawHero;drawHero=function(...a){try{const C=ctx?.commands;if(Array.isArray(C)&&!C.r1235){C.r1235=true;const pb=C.push;C.push=function(...items){for(const c of items)rec(c);return pb.apply(this,items);};}}catch(e){W.err=String(e);}return dh.apply(this,a);};
 for(const e of room.enemies){if(e.hp>0){e.hp=1e7;e.speed=0;}}
});
const kinds=[['base',async()=>{}],['A',()=>p.evaluate(()=>{window.__r1235.iv=setInterval(()=>{try{basicAttack(false);}catch(_){}},80);})],
 ['Q',()=>p.evaluate(()=>{player.specialCD=0;special();})],['W',()=>p.evaluate(()=>window.__STORYWORLD_WER__.cast('w'))],['E',()=>p.evaluate(()=>window.__STORYWORLD_WER__.cast('e',true))],['R',()=>p.evaluate(()=>window.__STORYWORLD_WER__.cast('r'))],
 ['P-volley',()=>p.evaluate(()=>{const H=window.__STORYWORLD_MICHAELA_HEART_R948__;H.qaForce('volley');window.__r1235.iv=setInterval(()=>{try{basicAttack(false);}catch(_){}},80);})],
 ['P-tower',()=>p.evaluate(()=>{const H=window.__STORYWORLD_MICHAELA_HEART_R948__;H.qaForce('tower');window.__r1235.iv=setInterval(()=>{try{basicAttack(false);}catch(_){}},80);})],
 ['P-bloom',()=>p.evaluate(()=>{const H=window.__STORYWORLD_MICHAELA_HEART_R948__;H.qaForce('bloom');window.__r1235.iv=setInterval(()=>{try{basicAttack(false);}catch(_){}},80);})]];
const RES={};
for(const [name,fn] of kinds){
 const t0=await p.evaluate(async()=>{const W=window.__r1235;clearInterval(W.iv);player.hp=maxHP();player.invincible=999;room.engaged=true;
   const e=room.enemies.find(v=>v.hp>0);if(e){e.x=player.x+2.5;e.y=player.y-1;}await new Promise(r=>setTimeout(r,800));W.img={};W.kinds={};W.on=true;return time;});
 try{await fn();}catch(e){console.log(name,'cast err',String(e).slice(0,200));}
 await p.waitForFunction(t=>time>=t+1.0,t0,{timeout:240000});const q=await p.evaluate(()=>project(player.x,player.y));
 await p.screenshot({path:`${OUT}/${name}.png`,clip:{x:Math.max(0,q.x-240),y:Math.max(0,q.y-260),width:480,height:340}});
 await p.waitForFunction(t=>time>=t+2.5,t0,{timeout:240000});
 RES[name]=await p.evaluate(()=>{const W=window.__r1235;W.on=false;clearInterval(W.iv);return{img:W.img,kinds:W.kinds,err:W.err,samples:W.samples};});
 console.log(name,JSON.stringify(RES[name]).slice(0,300));}
fs.writeFileSync(`${OUT}/census.json`,JSON.stringify(RES,null,1));console.log('errors',errors);await b.close();
