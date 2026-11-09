// R445 화면: 슬레이어 위로 걷기(북향 뒷모습) 연속 프레임·위 대각선(좌우 유지)·아래(남향)·멈춤. 헤드리스(임시, GPU 아님).
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium,devices}=req('playwright');
const [OUT,URL,TAG]=process.argv.slice(2);const b=await chromium.launch();const log={};
for(const [vp,opt] of [['pc',{viewport:{width:1280,height:720}}],['mobile',{...devices['iPhone 13']}]]){
 const ctx=await b.newContext({...opt,...(vp==='pc'?{deviceScaleFactor:1}:{})});await ctx.addInitScript(()=>localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false})));
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
 const clipAt=async()=>{const q=await p.evaluate(()=>{const c=document.querySelector('canvas');const r=c.getBoundingClientRect();const v=project(player.x,player.y);return {x:r.left+v.x*(r.width/(c.clientWidth||r.width)),y:r.top+v.y*(r.height/(c.clientHeight||r.height))};});return {x:Math.max(0,q.x-110),y:Math.max(0,q.y-200),width:220,height:240};};
 const shot=async n=>{await p.screenshot({path:`${OUT}/${n}-${vp}-${TAG}.jpg`,type:'jpeg',quality:85});};
 await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await skip();await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();
 await p.evaluate(async()=>{await ensureImages(heroPaths('slayer'));player.hero='slayer';player.direction='front';});
 await p.evaluate(()=>enterRegion('dist01',null,{layer:'STORY',restore:true}));await p.waitForFunction(()=>!loading&&room?.id==='dist01',null,{timeout:120000});await skip();await p.waitForTimeout(2500);
 await p.evaluate(()=>{for(const e of room.enemies){e.hp=0;e.spawnState='dead';}});
 const walk=async(dx,dy,n)=>{for(let i=0;i<n;i++){await p.evaluate(([dx,dy])=>{if(!blocked(player.x+dx,player.y+dy)){player.x+=dx;player.y+=dy;}player.moveVX150=dx*10;player.moveVY150=dy*10;},[dx,dy]);await p.waitForTimeout(60);}};
 const last=()=>p.evaluate(()=>({last:window.__STORYWORLD_SLAYER_R351__?.inspect?.()?.stats?.last,north:window.__STORYWORLD_SLAYER_R351__?.inspect?.()?.south?.northReady}));
 await walk(.04,.04,12);await walk(-.04,-.04,14);await shot('walk-n');log[vp+'-walk-n']=await last();
 const seq=[];for(let i=0;i<8;i++){await walk(-.03,-.03,1);const c=await clipAt();await p.screenshot({path:`${OUT}/seq${i}-${vp}-${TAG}.png`,clip:c});seq.push((await last()).last);}log[vp+'-seq']=seq;
 await walk(-.04,-.012,12);await shot('walk-nw-diag');log[vp+'-diag']=await last();
 await walk(.04,.04,12);await shot('walk-s');log[vp+'-walk-s']=await last();
 await walk(-.04,-.04,10);await p.evaluate(()=>{player.moveVX150=0;player.moveVY150=0;});await p.waitForTimeout(500);await shot('idle-n');log[vp+'-idle-n']=await last();
 log[vp+'-errs']=errs.slice(0,5);await ctx.close();}
console.log(JSON.stringify(log));await b.close();
