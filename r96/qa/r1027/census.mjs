// R1027 영웅 스킬·버프 그림 전수 — 영웅마다 스킬 키를 하나씩 눌러 그 뒤 1.6초(게임 시간) 동안 그려진 것을
//  캔버스 호출 단위로 모아(누가 그렸나 = 호출 스택의 오버레이 파일, 무엇을 = 그림 경로·잘라 쓴 칸) 정지 그림·도트(fillRect)·코드 선/원·프레임 시트를 가른다.
//  가만히 선 3초(버프·오라 같은 주기 그림)도 같은 방식으로 잰다. 실행: SW_URL=http://127.0.0.1:4410/m0/ SW_CHEAT=1 node r96/qa/r1027/census.mjs [영웅…]
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';
const ALL=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner'];
const heroes=process.argv.slice(2).filter(a=>!a.startsWith('--'));const LIST=heroes.length?heroes:ALL;
const OUT=process.env.SW_OUT||path.join(HERE,'census');fs.mkdirSync(OUT,{recursive:true});
const HELPER=fs.readFileSync(path.join(HERE,'../r795/page-helper.js'),'utf8');
const MELEE=new Set(['hwando','neon','lauren','slayer']);
const KEYS=['a','s','d','f','q','w','e','r'];
const PROBE=`(()=>{if(window.__CEN1027)return;const P=window.StoryPhase1.DrawCommands.prototype;let on=false,frame=0,rows=new Map();
const fileOf=st=>{const ls=String(st).split('\\n').slice(2);const fs=[];for(const l of ls){const m=l.match(/\\/m0\\/([\\w.-]*\\.js)?(?:\\?[^:]*)?:\\d+:\\d+/);if(!m)continue;const f=m[1]||'index.html';if(/census|phase1/.test(f))continue;fs.push(f);}const ov=fs.find(f=>f!=='index.html');return {direct:fs[0]||'?',ov:ov||'index.html'};};
let curFx=null;const fxTag=e=>{if(!e)return '';const bits=[e.type];for(const k of ['kind','style','skill','name','tag','fx','id'])if(typeof e[k]==='string'&&e[k].length<40)bits.push(k+'='+e[k]);if(e.asset)bits.push('a='+String(e.asset).replace(/^.*\\//,'').slice(0,40));return bits.join(' ');};
const dE=window.drawEffect;window.drawEffect=function(e,...a){const prev=curFx;curFx=e;try{return dE.call(this,e,...a);}finally{curFx=prev;}};
const push=P.push;P.push=function(kind,...a){const n0=this.commands.length;const out=push.call(this,kind,...a);if(on&&this.commands.length>n0){Error.stackTraceLimit=40;const c=this.commands[this.commands.length-1];try{c.__w=fileOf(new Error().stack);c.__fx=curFx?fxTag(curFx):'';}catch(_){}}return out;};
window.__CEN1027={start(){rows=new Map();frame=0;},frame(){on=true;let cs=[];try{cs=window.__STORYWORLD_PHASE1__.captureVisual();}finally{on=false;}
  for(const c of cs){const w=c.__w||{ov:'?',direct:'?'};const ok=c.owner&&c.owner.kind||'?';const sp=c.kind==='image'?String(c.sourcePath||'').replace(/^.*\\/m0\\//,'').slice(0,90):'';const fxk=c.__fx||'';const k=ok+'|'+w.ov+'|'+w.direct+'|'+c.kind+'|'+sp+'|'+fxk;let r=rows.get(k);if(!r){r={owner:ok,fx:fxk,ov:w.ov,direct:w.direct,kind:c.kind,extra:sp,n:0,frames:new Set(),rects:new Set()};rows.set(k,r);}r.n++;r.frames.add(frame);if(c.sourceRect)r.rects.add(c.sourceRect.map(v=>Math.round(v)).join(','));}
  frame++;return cs.length;},
 dump(){return [...rows.values()].map(r=>({owner:r.owner,fx:r.fx,ov:r.ov,direct:r.direct,kind:r.kind,extra:r.extra,n:r.n,frames:r.frames.size,rects:r.rects.size}));}};})();`;
const skip=p=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
async function boot(b,hero){const ctx=await b.newContext({viewport:{width:640,height:360},deviceScaleFactor:1});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator(`.heroRowR101 button[data-hero="${hero}"]`).click({timeout:20000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading&&(!modal||!!storyScene),null,{timeout:240000});await p.waitForTimeout(600);await skip(p);
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
 const z=process.env.SW_ZONE||'dist00';await p.evaluate(async z=>{if(zone!==z)await enterRegion(z,null,{layer:'STORY',restore:true});},z);await p.waitForFunction(z=>!loading&&zone===z,z,{timeout:150000});await skip(p);
 await p.addScriptTag({content:HELPER});await p.addScriptTag({content:PROBE});return {ctx,p,errs};}
async function sample(p,sec,every=6){await p.evaluate(()=>__CEN1027.start());const n=Math.round(sec*60/every);for(let i=0;i<n;i++){await p.evaluate(e=>{for(let k=0;k<e;k++){if(modal||loading)break;try{tick(1/60);}catch(_){}}if(player)player.hp=Math.max(player.hp,maxHP()*.9);},every);await p.evaluate(()=>__CEN1027.frame());}return p.evaluate(()=>__CEN1027.dump());}
const b=await chromium.launch();
for(const hero of LIST){const t0=Date.now();const res={hero,windows:{}};let s;
 try{s=await boot(b,hero);const {p}=s;
  const engage=async()=>{await p.evaluate(m=>{const q=__HQ795.findOpen(4);if(q)__HQ795.tp(q);return __HQ795.engage(m,[]);},MELEE.has(hero));};
  await engage();res.windows.idle=await sample(p,3);
  for(const k of KEYS){await skip(p);await engage();await p.evaluate(()=>{for(const k of ['attackCD','blinkCD','specialCD','egoCD','samongCD'])if(typeof player[k]==='number')player[k]=0;try{for(const k of Object.keys(player))if(/cd$/i.test(k)&&typeof player[k]==='number')player[k]=0;}catch(_){}});
   await p.keyboard.down(k);await p.evaluate(()=>{try{tick(1/60);}catch(_){}});await p.keyboard.up(k);res.windows['key-'+k]=await sample(p,1.6,3);}
  res.errs=s.errs.slice(0,10);
 }catch(e){res.fail=String(e).slice(0,400);}
 fs.writeFileSync(path.join(OUT,hero+'.json'),JSON.stringify(res));console.log(hero,((Date.now()-t0)/1000|0)+'s',res.fail||'',Object.keys(res.windows).length);
 try{await s?.ctx.close();}catch(_){}}
await b.close();
