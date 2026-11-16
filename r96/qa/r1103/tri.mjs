// R1103b 몹 근처 작은 삼각형 찾기: 기록된 명령 중 꼭짓점 3~4개·크기 30px 이하 도형을 owner·색·호출 경로별로 모은다.
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const hero=process.argv[2]||'hwando',ZONES=process.argv.slice(3).length?process.argv.slice(3):['ep1b03','dist03'];
const skip=p=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});const p=await ctx.newPage();
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator(`.heroRowR101 button[data-hero="${hero}"]`).click({timeout:20000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading&&(!modal||!!storyScene),null,{timeout:240000});await p.waitForTimeout(600);await skip(p);
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
await p.evaluate(()=>{const P=StoryPhase1.DrawCommands.prototype,base=P.push;const out={};window.__TRI=out;
 P.push=function(kind,data){const n0=this.commands.length;const r=base.apply(this,arguments);if(this.commands.length>n0&&(kind==='fill'||kind==='stroke')){const c=this.commands[this.commands.length-1];for(const pa of c.paths||[]){const pts=pa.points||[];if(pts.length<3||pts.length>5)continue;const xs=pts.map(q=>q[0]),ys=pts.map(q=>q[1]),w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys);if(w>40||h>40||w<2)continue;
  const st=String(new Error().stack).split('\n').slice(2,9).map(l=>{const m=l.match(/at (?:(\S+) \()?.*\/([^/:()]*):(\d+):\d+\)?$/);return m?(m[1]||'anon')+'@'+m[2]+':'+m[3]:'';}).filter(x=>!/^(scope|w|push|P\.push)@/.test(x)).slice(0,5).join('<');
  const o=this.owner||{};const k=kind+'|'+(o.kind||'-')+'|'+String(o.id||'').replace(/[\d.]+/g,'#').slice(0,30)+'|'+(kind==='fill'?this.fillStyle:this.strokeStyle)+'|'+pts.length+'|'+st;out[k]=(out[k]||0)+1;}}return r;};});
for(const z of ZONES){await p.evaluate(async z=>{if(zone!==z)await enterRegion(z,null,{layer:'STORY',restore:true});},z);await p.waitForFunction(z=>!loading&&zone===z,z,{timeout:150000});await skip(p);
 await p.evaluate(()=>{const es=(room.enemies||[]).filter(e=>e.hp>0);es.sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));player.x=es[0].x+1.4;player.y=es[0].y+.2;});
 for(let i=0;i<25;i++){await p.evaluate(()=>{for(let j=0;j<12;j++){try{tick(1/60);}catch(_){}}player.hp=Math.max(player.hp,maxHP()*.9);try{draw();}catch(_){}});}
 if(z===ZONES[0])await p.screenshot({path:path.join(HERE,'_tri.png')});}
const r=await p.evaluate(()=>__TRI);for(const [k,v] of Object.entries(r).sort((a,b)=>b[1]-a[1]).slice(0,30))console.log(v,k);
await b.close();
