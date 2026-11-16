// R1111 죽음 시트 브라우저 검사(헤드리스, R1065d 에서 복사): 새 5벌(MD-05·27·29·44·72): Dots CX-0115MD 죽음 시트가 있는 몹을 쓰러뜨리면 R462 15세 재 소멸 동안 그 시트 칸이 실제로 그려지는지(3칸 이상), 오류 0 인지 본다.
// 사용: URL=http://127.0.0.1:4412/m0/ node r96/qa/r1065/r1065d-death-browser.mjs [shotdir]
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.URL||'http://127.0.0.1:4396/';const SHOT=process.argv[2]||null;
const skip=p=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(typeof modal!=='undefined'&&modal)closePanel(true);});
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
await p.evaluate(()=>{window.__D={on:false,cells:{},n:0,other:0,wraps:0};setInterval(()=>{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(!r||r.render.__d1065)return;const W=window.__D;if(W.last&&performance.now()-W.last<1000)return;W.wraps++;const f=r.render;
 r.render=function(fr){W.last=performance.now();if(W.inside)return f.apply(this,arguments);W.inside=true;try{if(W.on&&fr&&fr.commands)for(const c of fr.commands){if(c.kind!=='image')continue;const s=String(c.sourcePath||c.path||'');if(W.on&&W.all&&Object.keys(W.all).length<40)W.all[s.replace(/^.*assets\//,'')]=(W.all[s.replace(/^.*assets\//,'')]||0)+1;if(/r1111\/mobs\/md-/.test(s)){W.n++;W.cells[s.replace(/^.*mobs\//,'')+'#'+Math.round(c.sourceRect?.[0]||0)]=1;}}}catch(_){}try{return f.apply(this,arguments);}finally{W.inside=false;}};r.render.__d1065=true;},300);});
const ONLY=process.env.ONLY?process.env.ONLY.split(','):null;
for(const [z,name,md] of [['ep1a08','소독등 타락천사','MD-05'],['ep1b09','강철 턱의 사이보그 개','MD-27'],['ep1b09','중간보스 · 강철 턱의 사이보그 개','MD-29'],['kair03','시간핵의 명령 파동','MD-44'],['dist01','재 나방','MD-72']].filter(x=>!ONLY||ONLY.includes(x[2]))){
 await p.evaluate(z=>{if(room?.id!==z)enterRegion(z,null,{layer:'STORY',restore:true});},z);await p.waitForFunction(z=>!loading&&room?.id===z,z,{timeout:150000});await skip(p);
 const id=await p.evaluate(n=>{const e=room.enemies.find(x=>x.name.startsWith(n)&&x.hp>0&&(n.startsWith('중간보스')||(!x.boss&&!x.midboss)));if(!e)return null;for(const o of room.enemies){if(o!==e&&o.hp>0&&Math.hypot(o.x-player.x,o.y-player.y)<9){o.x=player.x+14;o.y=player.y+3;o.homeX=o.x;o.homeY=o.y;}}
  e.x=player.x+1.6;e.y=player.y+.4;e.homeX=e.x;e.homeY=e.y;e.awake=true;window.__PL=[[1.6,.4],[-1.6,.4],[0,2],[0,-2],[2.6,0],[-2.6,0],[1.2,1.2],[-1.2,-1.2]];if(e.spawnState)e.spawnState='active';window.__D.target=e.id;window.__D.name=e.name;return e.id;},name);
 if(!id){ok(false,md+' '+name+' found in '+z);continue;}
 let t=await p.evaluate(()=>time);await p.waitForFunction(a=>{try{player.hp=player.maxHp;if(storyScene)advanceScene();}catch(_){}return time>=a;},t+1.5,{timeout:300000,polling:300});
 const L=()=>p.evaluate(()=>window.__STORYWORLD_MOB_DEATH_R462__.inspect().stats.looks);
 for(let tries=0;tries<8;tries++){const l0=await L();const t2=await p.evaluate(()=>time);await p.waitForFunction(a=>{try{player.hp=player.maxHp;}catch(_){}return time>=a;},t2+.3,{timeout:300000,polling:100});if(await L()>l0||tries===0&&false)break;
  await p.evaluate(k=>{const e=room.enemies.find(x=>x.id===window.__D.target);const o=window.__PL[k%window.__PL.length];e.x=player.x+o[0];e.y=player.y+o[1];e.homeX=e.x;e.homeY=e.y;},tries);}
 const has=await p.evaluate(()=>{const e=room.enemies.find(x=>x.id===window.__D.target);return !!window.__STORYWORLD_MOB_ATTACK_DOTS_R1065__.deathWant({path:'',name:e.name});});
 await p.evaluate(()=>{const W=window.__D;W.on=true;W.n=0;W.cells={};W.all={};const e=room.enemies.find(x=>x.id===W.target);hitEnemy(e,e.hp+1);});
 t=await p.evaluate(()=>time);if(process.env.FRAMES&&SHOT){for(let k=0;k<10;k++){await p.waitForFunction(a=>{try{player.hp=player.maxHp;}catch(_){}return time>=a;},t+k*.14,{timeout:300000,polling:20});await p.screenshot({path:`${SHOT}/${md}-${String(k).padStart(2,'0')}.png`,clip:{x:160,y:70,width:320,height:220}});}}else t=await p.evaluate(()=>time);await p.waitForFunction(a=>{try{player.hp=player.maxHp;}catch(_){}return time>=a;},t+(SHOT?.5:1.3),{timeout:300000,polling:50});
 if(SHOT)await p.screenshot({path:`${SHOT}/death-${z}.png`});
 const r=await p.evaluate(()=>{const W=window.__D;W.on=false;return {all:W.all,r462:window.__STORYWORLD_MOB_DEATH_R462__.inspect().stats,n:W.n,cells:Object.keys(W.cells),name:W.name,st:window.__STORYWORLD_MOB_ATTACK_DOTS_R1065__.inspect().stats};});
 if(process.env.DBG)console.log(JSON.stringify({all:r.all,r462:r.r462}));console.log(md,z,r.name,JSON.stringify({has,n:r.n,cells:r.cells,deathFrames:r.st.deathFrames}));
 ok(has,md+' '+r.name+': 바탕 그림에 죽음 시트가 있음');ok(r.n>0&&r.cells.length>=(SHOT?1:3),md+': 죽을 때 Dots 죽음 칸이 그려짐 ('+r.n+'회, 칸 '+r.cells.length+')');}
const W=await p.evaluate(()=>window.__D.wraps);ok(W<=8,'검사 render 감싸기 겹침 없음 ('+W+')');
const I=await p.evaluate(()=>window.__STORYWORLD_MOB_ATTACK_DOTS_R1065__.inspect());ok(I.stats.errors===0,'overlay errors 0 '+(I.lastError||''));ok(errs.length===0,'page errors 0 '+JSON.stringify(errs.slice(0,3)));
await b.close();console.log(fails?'R1111 death browser FAILED '+fails:'R1111 death browser passed');process.exit(fails?1:0);
