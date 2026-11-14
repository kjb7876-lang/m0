// R1027 영웅 '도트' 이펙트 전수(사건 기록 방식) — 영웅마다 40초(게임 시간) 동안 몹 옆에서 기본공격·스킬 8키를 돌려 쓰며
//  ① 엔진 PXF(픽셀 아틀라스) 중 영웅 쪽(side≠enemy) 방출, ② R163 pixelfx(픽셀 시트) 재생 이름(색 지정 없음=영웅 쪽),
//  ③ 엔진 'sigil'(정지 그림 한 장) 중 영웅 자리 것을 센다. 실행: SW_URL=… node r96/qa/r1027/census2.mjs [영웅…]  결과 SW_OUT(기본 qa/r1027/census2)/<영웅>.json
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';
const ALL=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner'];
const LIST=process.argv.slice(2).filter(a=>!a.startsWith('--'));const HEROES=LIST.length?LIST:ALL;
const OUT=process.env.SW_OUT||path.join(HERE,'census2');fs.mkdirSync(OUT,{recursive:true});const SEC=+(process.env.SW_SEC||40);
const HELPER=fs.readFileSync(path.join(HERE,'../r795/page-helper.js'),'utf8');
const MELEE=new Set(['hwando','neon','lauren','slayer']);
const PROBE=`(()=>{if(window.__CEN1027B)return;const out={pxf:{},r163:{},sigil:{},draws:{}};
const P=window.__STORYWORLD_PIXELFX_R163__;if(P&&P.play&&!P.__c){const b=P.play;try{P.play=function(name,x,y,o){const k=name+(o&&o.tint?'|tint':'|hero');out.r163[k]=(out.r163[k]||0)+1;return b.apply(this,arguments);};}catch(_){}}
const f0=window.fx;window.fx=function(type,x,y,o){try{if(type==='sigil'&&o&&player&&Math.hypot(x-player.x,y-player.y)<.6){const k=String(o.asset||'').replace(/^.*\\//,'');out.sigil[k]=(out.sigil[k]||0)+1;}}catch(_){}return f0.apply(this,arguments);};
let seenAt=-1;window.__CEN1027B={poll(){try{const a=window.__STORYWORLD_PXF__.inspect().audit||[];for(const r of a){if(r.at<=seenAt)continue;if(r.kind==='emit'&&r.side!=='enemy'){const k=r.key+'|'+r.stage;out.pxf[k]=(out.pxf[k]||0)+1;}if(r.kind==='draw'&&r.side!=='enemy'){const k=r.key+'|'+r.stage;out.draws[k]=(out.draws[k]||0)+1;}}if(a.length)seenAt=Math.max(seenAt,a[a.length-1].at);}catch(_){}},dump(){return out;}};})();`;
const skip=p=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
async function boot(b,hero){const ctx=await b.newContext({viewport:{width:640,height:360},deviceScaleFactor:1});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator(`.heroRowR101 button[data-hero="${hero}"]`).click({timeout:20000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading&&(!modal||!!storyScene),null,{timeout:240000});await p.waitForTimeout(600);await skip(p);
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
 const z=process.env.SW_ZONE||'dist00';await p.evaluate(async z=>{if(zone!==z)await enterRegion(z,null,{layer:'STORY',restore:true});},z);await p.waitForFunction(z=>!loading&&zone===z,z,{timeout:150000});await skip(p);
 await p.addScriptTag({content:HELPER});await p.addScriptTag({content:PROBE});return {ctx,p,errs};}
const b=await chromium.launch();
for(const hero of HEROES){const t0=Date.now();let s,res={hero};
 try{s=await boot(b,hero);const {p}=s;const keys=['a','s','d','f','q','w','e','r'];let i=0;
  for(let t=0;t<SEC;t+=.5){if(t%4===0){await skip(p);await p.evaluate(m=>{if(!__HQ795.still||true){const e=__HQ795.engage(m,[]);if(!e){const q=__HQ795.findOpen(4);if(q)__HQ795.tp(q);}}},MELEE.has(hero));}
   await p.evaluate(()=>{for(const k of Object.keys(player))if(/cd$/i.test(k)&&typeof player[k]==='number'&&player[k]>0)player[k]=0;if(typeof player.resonance==='number')player.resonance=Math.max(player.resonance,100);player.hp=Math.max(player.hp,maxHP()*.9);});
   const k=keys[i++%keys.length];await p.keyboard.down(k);await p.evaluate(()=>{for(let j=0;j<15;j++){if(modal||loading)break;try{tick(1/60);}catch(_){}if(j%5===0)try{draw();}catch(_){}}__CEN1027B.poll();});await p.keyboard.up(k);
   await p.keyboard.down('j').catch(()=>{});await p.evaluate(()=>{for(let j=0;j<15;j++){if(modal||loading)break;try{tick(1/60);}catch(_){}if(j%5===0)try{draw();}catch(_){}}__CEN1027B.poll();});await p.keyboard.up('j').catch(()=>{});}
  res={hero,...await p.evaluate(()=>__CEN1027B.dump()),errs:s.errs.slice(0,8)};
 }catch(e){res.fail=String(e).slice(0,400);}
 fs.writeFileSync(path.join(OUT,hero+'.json'),JSON.stringify(res,null,1));console.log(hero,((Date.now()-t0)/1000|0)+'s',res.fail||'');try{await s?.ctx.close();}catch(_){}}
await b.close();
