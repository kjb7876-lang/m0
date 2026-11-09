import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL='http://127.0.0.1:4410/m0/';const ZONE=process.argv[2]||'sz115-S02-5',S3D=process.argv[3]!=='2d';
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
await ctx.addInitScript(([s3d])=>{localStorage.setItem('storyworld.r237.autolevel','{"on":false}');if(!s3d)localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));},[S3D]);
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
await p.evaluate(z=>window.__STORYWORLD_SAMONG_R103__.goZone(z),ZONE);await p.waitForFunction(z=>!loading&&room?.samongR103?.zone===z,ZONE,{timeout:150000});
const waitT=async d=>{const t0=await p.evaluate(()=>time);await p.waitForFunction(([t0,d])=>{for(let i=0;i<40&&storyScene;i++)advanceScene();if(modal)closePanel(true);return time>t0+d;},[t0,d],{timeout:240000,polling:200});};
await waitT(1.6);
const A=()=>p.evaluate(()=>({st:window.__STORYWORLD_SAMONG_ROOMS_R511__.state(),ins:window.__STORYWORLD_SAMONG_ROOMS_R511__.inspect(),pts:player.points,hp:player.hp,zone:room.samongR103.zone}));
let a=await A();console.log('planned',JSON.stringify(a));
const n=a.st.nests[0];if(!n){console.log('no nests',errs);await b.close();process.exit(1);}
// 조각 6칸 떨어진 곳(방 밖/문 쪽)에서 한 장
await p.evaluate(n=>{let best=null;for(let k=0;k<16;k++){const a=k*Math.PI/8,x=n.x+Math.cos(a)*6,y=n.y+Math.sin(a)*6;if(!blocked(x,y,.4,room)){best={x,y};break;}}if(best){player.x=best.x;player.y=best.y;cam={x:best.x,y:best.y};}player.invincible=999;},n);
await waitT(.5);await p.screenshot({path:'./'+ZONE+'-1-sealed.png'});
await p.evaluate(n=>{player.x=n.x+2.5;player.y=n.y+.2;if(blocked(player.x,player.y,.4,room)){player.x=n.x;player.y=n.y+1.2;}cam={x:player.x,y:player.y};},n);
await waitT(.6);a=await A();console.log('woke',JSON.stringify(a.st.nests[0]),'enemies',await p.evaluate(()=>room.enemies.filter(e=>e.r511Nest&&e.hp>0).map(e=>e.name+':'+e.hp+'/'+e.maxHp)));
await waitT(.8);await p.screenshot({path:'./'+ZONE+'-2-awake.png'});
await p.evaluate(()=>{for(const e of room.enemies)if(e.r511Nest&&e.hp>0){e.hp=1;hitEnemy(e,9e9);}});
await waitT(.6);a=await A();console.log('freed',JSON.stringify(a.st.nests[0]),'pts',a.pts);
await p.evaluate(n=>{player.x=n.x+1.6;player.y=n.y;cam={x:player.x,y:player.y};},n);await waitT(.3);
await p.screenshot({path:'./'+ZONE+'-3-free.png'});
const before=a.pts;await p.evaluate(n=>{player.x=n.x+.3;player.y=n.y;},n);await waitT(.5);a=await A();
console.log('picked',a.pts-before,'done',a.st.done,'left',a.st.nests.length,'ins',JSON.stringify(a.ins));
const sv=await p.evaluate(()=>serializeSave().samongRoomsR511);console.log('save',JSON.stringify(sv));
console.log('errors',errs.length,errs.slice(0,3));await b.close();
