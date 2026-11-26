import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const Z=process.env.ZONE||'ep1b04',H=process.env.HERO||'gunner',S3=process.env.S3||'';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:960,height:540}});
if(S3)await ctx.addInitScript(s=>localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:s==='on'})),S3);
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e.stack||e).slice(0,600)));
p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text().slice(0,300));});
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
await p.evaluate(h=>{player.hero=h;},H);
await p.evaluate(z=>enterRegion(z,null,{layer:'STORY',restore:true}),Z);await p.waitForFunction(z=>!loading&&room?.id===z,Z,{timeout:150000});await skip();
const st=()=>p.evaluate(()=>({t:time,zone:room?.id,hero:player.hero,rec:window.__STORYWORLD_THREE_RECOVER_R1228__?.inspect(),status:document.getElementById('phase1-status')?.textContent||'',
 log:(()=>{try{const E=window.__STORYWORLD_ERROR_LOG_R1288__;return E?.list?.()||E?.inspect?.()||null;}catch(e){return String(e);}})()}));
if(process.env.BOSS){console.log('boss',await p.evaluate(()=>{player.hp=player.maxHp=1e6;for(const e of room.enemies)e.damage=0;const e=room.enemies.find(e=>e.boss);if(!e)return 'none';e.spawnState='active';e.visible=true;e.speed=0;player.x=e.x-2;player.y=e.y;window.__B=e;return e.name+' '+e.hp;}));
 await p.waitForTimeout(6000);console.log(JSON.stringify(await st()).slice(0,300));
 console.log('g3d',JSON.stringify(await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1315__?.inspect?.().instances?.map(x=>[x.id,x.kind,x.visible,x.pose]))));console.log('kill',await p.evaluate(()=>{try{const e=window.__B;hitEnemy(e,e.hp+10);return 'hp '+e.hp+' dead '+(e.hp<=0);}catch(err){return 'ERR '+(err.stack||err).toString().slice(0,1500);}}));}
for(let i=0;i<Number(process.env.N||12);i++){await p.waitForTimeout(2500);if(!process.env.NOSKIP)await skip();const s=await st();console.log(JSON.stringify({t:s.t,zone:s.zone,hero:s.hero,fail:s.rec?.failures,rec:s.rec?.recovered,gave:s.rec?.gaveUp,last:s.rec?.last,status:s.status}));if(s.rec?.failures){console.log(JSON.stringify(s.log).slice(0,4000));break;}
 if(process.env.EGO&&i===1)await p.keyboard.press('f');}
await p.screenshot({path:'/tmp/claude-0/r1344/probe-'+Z+'.png'});
console.log('ERRS',errs.length,errs.slice(0,5).join('\n---\n'));await b.close();
