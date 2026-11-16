// R1103 주황 도형 전수 — 영웅마다 몹 옆에서 기본공격·스킬을 돌려 쓰고 몹에게 맞으며, 그림 시트가 아닌
//  '도형'(fill·stroke·fillRect·strokeRect)이 주황 계열 색으로 그려질 때 누가(호출 사슬) 그렸는지 센다.
//  실행: SW_URL=… node r96/qa/r1103/census.mjs [영웅…]  (기본 8명, 지역 SW_ZONES=dist00,ep1a08 …)  결과 SW_OUT/<영웅>-<지역>.json
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';
const ALL=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner'];
const LIST=process.argv.slice(2).filter(a=>!a.startsWith('--'));const HEROES=LIST.length?LIST:ALL;
const ZONES=(process.env.SW_ZONES||'dist00').split(',');
const OUT=process.env.SW_OUT||path.join(HERE,'census');fs.mkdirSync(OUT,{recursive:true});const SEC=+(process.env.SW_SEC||24);
const HELPER=fs.readFileSync(path.join(HERE,'../r795/page-helper.js'),'utf8');
const PROBE=fs.readFileSync(path.join(HERE,'orange-probe.js'),'utf8');
const MELEE=new Set(['hwando','neon','lauren','slayer']);
const skip=p=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
async function boot(b,hero){const ctx=await b.newContext({viewport:{width:640,height:360},deviceScaleFactor:1});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator(`.heroRowR101 button[data-hero="${hero}"]`).click({timeout:20000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading&&(!modal||!!storyScene),null,{timeout:240000});await p.waitForTimeout(600);await skip(p);
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
 await p.addScriptTag({content:HELPER});await p.addScriptTag({content:PROBE});return {ctx,p,errs};}
const b=await chromium.launch();
for(const hero of HEROES){let s;
 try{s=await boot(b,hero);const {p}=s;
  for(const z of ZONES){const t0=Date.now();let res={hero,zone:z};
   try{await p.evaluate(async z=>{if(zone!==z)await enterRegion(z,null,{layer:'STORY',restore:true});},z);await p.waitForFunction(z=>!loading&&zone===z,z,{timeout:150000});await skip(p);
    await p.evaluate(()=>__R1103P.reset());const keys=['a','s','d','f','q','w','e','r'];let i=0;
    for(let t=0;t<SEC;t+=.5){if(t%4===0){await skip(p);await p.evaluate(m=>{const e=__HQ795.engage(m,[]);if(!e){const q=__HQ795.findOpen(4);if(q)__HQ795.tp(q);}},MELEE.has(hero));}
     await p.evaluate(()=>{for(const k of Object.keys(player))if(/cd$/i.test(k)&&typeof player[k]==='number'&&player[k]>0)player[k]=0;if(typeof player.resonance==='number')player.resonance=Math.max(player.resonance,100);player.hp=Math.max(player.hp,maxHP()*.9);});
     if(process.env.SW_SHOTS&&(t*2)%2===0){fs.mkdirSync(path.join(OUT,'shots'),{recursive:true});await p.screenshot({path:path.join(OUT,'shots',`${hero}-${z}-${String(t).padStart(4,'0')}.png`)});}
     const k=keys[i++%keys.length];await p.keyboard.down(k);await p.evaluate(()=>{for(let j=0;j<15;j++){if(modal||loading)break;try{tick(1/60);}catch(_){}if(j%3===0)try{draw();}catch(_){}}});await p.keyboard.up(k);
     await p.keyboard.down('j').catch(()=>{});await p.evaluate(()=>{for(let j=0;j<15;j++){if(modal||loading)break;try{tick(1/60);}catch(_){}if(j%3===0)try{draw();}catch(_){}}});await p.keyboard.up('j').catch(()=>{});}
    res={hero,zone:z,...await p.evaluate(()=>__R1103P.dump()),errs:s.errs.slice(0,8)};
   }catch(e){res.fail=String(e).slice(0,400);}
   fs.writeFileSync(path.join(OUT,hero+'-'+z+'.json'),JSON.stringify(res,null,1));console.log(hero,z,((Date.now()-t0)/1000|0)+'s',res.fail||'',Object.keys(res.hits||{}).length);}
 }catch(e){console.log(hero,'boot fail',String(e).slice(0,300));}
 try{await s?.ctx.close();}catch(_){}}
await b.close();
