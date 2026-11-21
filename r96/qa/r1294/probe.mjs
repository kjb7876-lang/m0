// R1294 네온 스킬(Q·W·E·R·평타) 때 새로 생긴 효과와 실제 그리기 호출의 그림 경로를 모아 '도트'(PXF 픽셀 아틀라스·R163 pixelfx·r106fx 코드 스프라이트) 가 남는지 본다.
// 실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1294/probe.mjs [out.json] (SHOTS=1 이면 키마다 스크린샷)
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const OUT=process.argv[2]||path.join(HERE,'probe.json');const HERO=process.env.HERO||'neon';
const HELPER=fs.readFileSync(path.join(HERE,'../r795/page-helper.js'),'utf8');
const PROBE=`(()=>{if(window.__P1294)return;let on=false,rows=new Map(),fxs=new Map();
let cur=null;const dE=window.drawEffect;window.drawEffect=function(e,...a){const p=cur;cur=e;try{return dE.call(this,e,...a);}finally{cur=p;}};
const tag=e=>{if(!e)return '';const b=[e.type];for(const k of ['kind','style','skill','name','pxfKey','pxfStage','pxfSide','fx'])if(typeof e[k]==='string'&&e[k].length<40)b.push(k+'='+e[k]);if(e.asset)b.push('a='+String(e.asset).replace(/^.*\\//,'').slice(0,50));return b.join(' ');};
const P=window.StoryPhase1.DrawCommands.prototype;const push=P.push;P.push=function(kind,...a){const n0=this.commands.length;const r=push.call(this,kind,...a);if(on&&this.commands.length>n0){const c=this.commands[this.commands.length-1];c.__fx=cur?tag(cur):'';}return r;};
window.__P1294={start(){rows=new Map();fxs=new Map();this.seen=new Set(effects);},
 frame(){for(const e of effects){if(this.seen.has(e))continue;this.seen.add(e);const k=tag(e);fxs.set(k,(fxs.get(k)||0)+1);}
  on=true;let cs=[];try{cs=window.__STORYWORLD_PHASE1__.captureVisual();}finally{on=false;}
  for(const c of cs){const ok=c.owner&&c.owner.kind||'?';if(ok!=='effect'&&ok!=='hero')continue;if(c.kind!=='image')continue;const sp=String(c.sourcePath||'').replace(/^.*\\/m0\\//,'').slice(0,90);const k=ok+'|'+sp+'|'+(c.__fx||'');rows.set(k,(rows.get(k)||0)+1);}},
 dump(){return {spawned:[...fxs].sort((a,b)=>b[1]-a[1]),drawn:[...rows].sort((a,b)=>b[1]-a[1])};}};})();`;
const skip=p=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:+(process.env.VW||640),height:+(process.env.VH||360)},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r663.skillgrowth','{"on":false}');});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator(`.heroRowR101 button[data-hero="${HERO}"]`).click({timeout:20000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading&&(!modal||!!storyScene),null,{timeout:240000});await p.waitForTimeout(600);await skip(p);
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
const z=process.env.SW_ZONE||'dist00';await p.evaluate(async z=>{if(zone!==z)await enterRegion(z,null,{layer:'STORY',restore:true});},z);await p.waitForFunction(z=>!loading&&zone===z,z,{timeout:150000});await skip(p);
await p.addScriptTag({content:HELPER});await p.addScriptTag({content:PROBE});
const res={hero:HERO,keys:{}};
for(const k of (process.env.KEYS||'q,w,e,r,a').split(',')){await skip(p);
 await p.evaluate(()=>{const q=__HQ795.findOpen(4);if(q)__HQ795.tp(q);__HQ795.engage(true,[]);for(const k of Object.keys(player))if(/cd$/i.test(k)&&typeof player[k]==='number')player[k]=0;if(typeof player.mana==='number')player.mana=999;});
 await p.evaluate(()=>__P1294.start());
 await p.keyboard.down(k);await p.evaluate(()=>{try{tick(1/60);}catch(_){}});await p.keyboard.up(k);
 for(let i=0;i<32;i++){await p.evaluate(()=>{for(let j=0;j<3;j++){if(modal||loading)break;try{tick(1/60);}catch(_){}}if(player)player.hp=Math.max(player.hp,maxHP()*.9);});await p.evaluate(()=>__P1294.frame());
  if(process.env.SHOTS&&(process.env.SHOTS.split('/').map(Number).includes(i)))await p.screenshot({path:path.join(path.dirname(OUT),`${path.basename(OUT,'.json')}-${k}-${i}.png`)});}
 res.keys[k]=await p.evaluate(()=>__P1294.dump());}
res.errs=errs.slice(0,10);fs.writeFileSync(OUT,JSON.stringify(res,null,1));await b.close();console.log('done',OUT);
