// R1095 헤드리스 확인: 히든 영웅 EGO 형상(777)의 이펙트 수묵 색이 실제 렌더러 명령과 화면 색에 닿는지, 보통 영웅은 그대로인지, 끄면 원래 색으로 돌아오는지, 예고 표시·적 표식은 그대로인지.
// 실행: node r1095-browser.mjs <out dir>  (SW_URL 기본 http://127.0.0.1:4410/m0/, SW_ZONES 기본 dist02, SW_HERO 로 무한 생존 영웅 지정 가능). 헤드리스 소프트웨어 렌더링이라 GPU·실기기 확인이 아니다.
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const out=process.argv[2]||'.';fs.mkdirSync(out,{recursive:true});let n=0,bad=0;
const ok=(m,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(d!==undefined?' '+JSON.stringify(d):''));};
const b=await chromium.launch();const errs=[];
const {p}=await boot(b,{vp:{width:960,height:540}});p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const I=()=>p.evaluate(()=>window.__STORYWORLD_INK_FX_R1095__.inspect());
// 한 프레임의 명령을 바깥에서 붙잡는다(우리 모듈보다 바깥 → 그린 뒤의 style 을 읽는다)
const census=()=>p.evaluate(async()=>{const three=window.__STORYWORLD_PHASE1__.controller.state.three,base=three.render;let refs=null;
 three.render=function(f){if(!refs&&f&&Array.isArray(f.commands)&&f.commands.length)refs=f.commands.slice();return base.apply(this,arguments);};
 for(let i=0;i<80&&!refs;i++)await new Promise(r=>setTimeout(r,100));three.render=base;if(!refs)return null;
 const o={fx:0,fxT:0,hazard:0,hazardT:0,projT:0,bodyT:0,textT:0,signalT:0,egoT:0,shadowT:0,filters:{},bad:[]};
 const known=/^(?:(?:brightness|contrast|saturate|grayscale|hue-rotate)\([^)]+\)\s*)+$/;
 for(const c of refs){const k=c.owner?.kind,t=c.r1095===true,id=String(c.owner?.id||'');
  if(k==='hazard'){o.hazard++;if(t)o.hazardT++;continue;}
  if(k==='projectile'){if(t)o.projT++;continue;}
  if(k==='hero'||k==='enemy'||k==='prop'||k==='contact'){if(t)o.bodyT++;continue;}
  if(k!=='effect')continue;
  if(c.kind==='text'){if(t)o.textT++;continue;}
  if(c.owner.r329Shadow){if(t)o.shadowT++;continue;}
  if(c.owner.enemy===true||c.owner.r434||/(?:^|[^a-z])(?:boss|hex|rank|nav)(?:[^a-z]|$)/i.test(id)){if(t)o.signalT++;continue;}
  o.fx++;if(t){o.fxT++;if(c.kind==='image'){const f=String(c.style.filter);o.filters[f]=(o.filters[f]||0)+1;if(!known.test(f)&&o.bad.length<4)o.bad.push(f);}}}
 return o;});
// 화면 화소: 두 장면에서 달라진 화소만 모아 켬 쪽의 색상을 잰다
const diff=(a,b2)=>p.evaluate(async([A,B])=>{const load=async s=>{const im=new Image();im.src='data:image/png;base64,'+s;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);return g.getImageData(0,0,c.width,c.height).data;};
 const x=await load(A),y=await load(B);let changed=0,col=0,red=0,offRed=0,offCol=0;
 const hue=(r,g,b)=>{const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0;if(d>0){if(mx===r)h=((g-b)/d)%6;else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;if(h<0)h+=360;}return [h,mx?d/mx:0];};
 const near=h=>{const d=Math.abs(h-8)%360;return (d>180?360-d:d)<=32;};
 for(let i=0;i<x.length;i+=4){if(Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2])<36)continue;changed++;
  const [h,c]=hue(x[i],x[i+1],x[i+2]);if(c>.3){col++;if(near(h))red++;}
  const [h2,c2]=hue(y[i],y[i+1],y[i+2]);if(c2>.3){offCol++;if(near(h2))offRed++;}}
 return {changed,col,red,share:col?+(red/col).toFixed(3):null,offShare:offCol?+(offRed/offCol).toFixed(3):null};},[a.toString('base64'),b2.toString('base64')]);
await p.evaluate(()=>{window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});
const hero=process.env.SW_HERO||'';
for(const z of (process.env.SW_ZONES||'dist02').split(',')){
 if(hero){await p.evaluate(h=>window.__STORYWORLD_SURVIVAL_R600__.start(h),hero);await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip(p);}else await go(p,z);
 const tag=hero?hero:z;
 ok(tag+': module active (맵 수묵화풍 켜짐을 따라감)',(await I()).active===true,await I());
 // 히든 영웅 EGO 형상으로 바꾼다(777 은 환도 99레벨일 뿐 EGO 형상이 아니다). 그 전에는 환도라서 아무것도 안 바뀌어야 한다.
 // EGO 형상 전에는 환도다 → 먹·백(sumi)으로 바뀌고 붉은 색상 돌리기는 없어야 한다
 {let pre=null;for(let t=0;t<8;t++){for(const k of ['a','s','d','q','f']){await p.keyboard.down(k);await p.waitForTimeout(140);await p.keyboard.up(k);}pre=await census();if(pre&&pre.fxT>=10)break;}
  const fs=Object.keys(pre?.filters||{});
  ok(tag+': 환도 (EGO 형상 전) effects are recoloured to 먹·백, no hue-rotate',!!pre&&pre.fxT>=10&&fs.length>0&&fs.every(f=>!/hue-rotate/.test(f))&&(await I()).hwando===true&&(await I()).ego===false,pre&&{fx:pre.fx,fxT:pre.fxT,filters:pre.filters});
  ok(tag+': 환도: hazards·bodies·text·shadows·enemy signals untouched',!!pre&&pre.hazardT+pre.projT+pre.bodyT+pre.textT+pre.shadowT+pre.signalT===0);
  if(process.env.SW_SHOT){await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(500);await p.screenshot({path:`${out}/hwando-on.png`});await p.evaluate(()=>window.__STORYWORLD_INK_FX_R1095__.set(false));await p.waitForTimeout(900);await p.screenshot({path:`${out}/hwando-off.png`});await p.evaluate(()=>{window.__STORYWORLD_INK_FX_R1095__.set(true);window.__SLOW=1;});await p.waitForTimeout(700);}}
 const formed=await p.evaluate(()=>{const E=window.__STORYWORLD_EGO_SOVEREIGN_R1046__;try{E.unlock();}catch(_){}return {set:E.setForm(true),active:E.active()};});await p.waitForTimeout(1200);
 ok(tag+': hidden hero EGO form is on → EGO scope on',formed.active===true&&(await I()).ego===true,formed);
 // 스킬을 눌러 이펙트가 여럿 떠 있는 순간을 잡는다
 let a=null;const keys=['q','w','e','r','a','s','d','f','Space'];
 for(let t=0;t<14;t++){await p.evaluate(()=>{window.__SLOW=1;});
  for(const k of keys.slice(0,3+(t%6))){await p.keyboard.down(k==='Space'?'Space':k);await p.waitForTimeout(140);await p.keyboard.up(k==='Space'?'Space':k);}
  await p.waitForTimeout(350+t*120);await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(500);
  a=await census();const rot=Object.entries(a?.filters||{}).filter(([f])=>/hue-rotate/.test(f)).reduce((n,[,v])=>n+v,0);if(a&&a.fxT>=10&&rot>=45)break;}/* 붉게 도는 이펙트가 넉넉히 떠 있는 순간을 잡는다(화소 비율이 장면에 덜 흔들리게) */
 ok(tag+': effect commands found and tinted',!!a&&a.fx>=10&&a.fxT>=10,a&&{fx:a.fx,fxT:a.fxT});
 ok(tag+': nearly every eligible effect command is tinted (재기 예산으로 한두 장 늦을 수 있음)',!!a&&a.fxT/Math.max(1,a.fx)>=.7,a&&{fx:a.fx,fxT:a.fxT});
 ok(tag+': only filter kinds the Three recorder knows',!!a&&a.bad.length===0,a&&a.bad);
 ok(tag+': hazards·projectiles·bodies·text·shadows·enemy signals untouched',!!a&&a.hazardT+a.projT+a.bodyT+a.textT+a.shadowT+a.signalT===0,a&&{hazard:a.hazard,hazardT:a.hazardT,projT:a.projT,bodyT:a.bodyT,textT:a.textT,shadowT:a.shadowT,signalT:a.signalT,egoT:a.egoT});
 console.log(tag,'filters',JSON.stringify(a&&a.filters));
 const on=await p.locator('#game').screenshot();await p.screenshot({path:`${out}/${tag}-on.png`});
 await p.evaluate(()=>window.__STORYWORLD_INK_FX_R1095__.set(false));await p.waitForTimeout(900);
 const a2=await census();ok(tag+': set(false) → no effect command is tinted (원래 색)',!!a2&&a2.fxT===0,a2&&{fx:a2.fx,fxT:a2.fxT});
 const off=await p.locator('#game').screenshot();await p.screenshot({path:`${out}/${tag}-off.png`});
 const d=await diff(on,off);console.log(tag,'pixels',JSON.stringify(d));
 ok(tag+': the picture really changes (달라진 화소 300개 이상)',d.changed>=300,d.changed);
 // EGO 형상은 끈 화면에서도 몸 둘레 빛이 붉어 '끈 화면보다 더 붉다'는 비교는 뜻이 없다(1차 구현의 환도 기준 조건이었음) → 켠 화면의 비율만 본다
 ok(tag+': changed coloured pixels are mostly vermilion when on (60% 이상)',d.share!==null&&d.share>=.6,d);
 await p.evaluate(()=>window.__STORYWORLD_INK_FX_R1095__.set(true));await p.waitForTimeout(900);
 const a3=await census();ok(tag+': set(true) → tinted again without reload',!!a3&&a3.fxT>=Math.min(10,a.fxT),a3&&{fx:a3.fx,fxT:a3.fxT});
 // 맵 수묵화풍을 끄면 같이 쉰다
 await p.evaluate(()=>window.__STORYWORLD_INK_WASH_R1055__.set({mode:'off'}));await p.waitForTimeout(1300);
 const a4=await census(),i4=await I();ok(tag+': map ink wash off → rests (끄면 원래 색)',i4.active===false&&!!a4&&a4.fxT===0,{active:i4.active,fxT:a4&&a4.fxT});
 await p.evaluate(()=>window.__STORYWORLD_INK_WASH_R1055__.set({mode:'all'}));await p.waitForTimeout(1300);
 ok(tag+': map ink wash back on → active again',(await I()).active===true);
 await p.evaluate(()=>{window.__SLOW=1;});}
// 보통 영웅(777 없이 새 창): 이펙트가 하나도 바뀌지 않아야 한다(사용자 2026-11-16 정정)
{const ctx2=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});await ctx2.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const q=await ctx2.newPage();q.on('pageerror',e=>errs.push(String(e).slice(0,200)));await q.goto(process.env.SW_URL||'http://127.0.0.1:4410/m0/');await q.locator('#campaignNew54').click({timeout:180000});await q.locator('#slotConfirmR73').click();
 await q.waitForFunction(()=>started&&!loading,null,{timeout:240000});await q.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
 for(const h of (process.env.SW_PLAIN||'neon').split(',')){
  /* 무한 생존 시작은 느린 헤드리스에서 가끔 false 로 끝난다(영웅이 안 바뀜) → 세 번까지 다시 */let sw=false;for(let i=0;i<3&&!sw;i++){const r=await q.evaluate(h=>window.__STORYWORLD_SURVIVAL_R600__.start(h),h);await q.waitForTimeout(3000);sw=await q.waitForFunction(h=>!loading&&player.hero===h,h,{timeout:60000}).then(()=>true,()=>false);if(!sw)console.log('retry start',h,r);}ok(h+' (보통 영웅): hero switched',sw,{});if(!sw)continue;await q.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await q.waitForFunction(()=>window.__STORYWORLD_INK_FX_R1095__.inspect().hwando===false,null,{timeout:30000});
  let seen=0,tint=0;const why={};const st=await q.evaluate(()=>window.__STORYWORLD_INK_FX_R1095__.inspect());
  for(let t=0;t<8;t++){for(const k of ['a','s','d','q','f']){await q.keyboard.down(k);await q.waitForTimeout(140);await q.keyboard.up(k);}
   const r=await q.evaluate(async()=>{const three=window.__STORYWORLD_PHASE1__.controller.state.three,base=three.render;let refs=null;three.render=function(f){if(!refs&&f?.commands?.length)refs=f.commands.slice();return base.apply(this,arguments);};for(let i=0;i<80&&!refs;i++)await new Promise(r=>setTimeout(r,100));three.render=base;let fx=0,t=0;const w={};for(const c of refs||[]){if(c.owner?.kind==='effect'&&c.kind==='image'&&!c.owner.r329Shadow)fx++;if(c.r1095){t++;const k=(c.sourcePath||c.kind)+'|'+(c.owner?.kind||'')+'|'+(c.owner?.id||'');w[k]=(w[k]||0)+1;}}return {fx,t,w,hero:player.hero};});
   seen=Math.max(seen,r.fx);tint+=r.t;Object.assign(why,r.w,{hero:r.hero});if(seen>=12&&t>=3)break;}
  ok(h+' (보통 영웅): module is live but the EGO scope is off',st.active===true&&st.ego===false,{active:st.active,ego:st.ego});
  ok(h+' (보통 영웅): effects are on screen and none is recoloured',seen>=8&&tint===0,{seen,tint,why});
  if(process.env.SW_SHOT)await q.screenshot({path:`${out}/${h}-plain.png`});}
 await ctx2.close();}
const fin=await I();ok('no module errors',fin.errors===0,fin);ok('no page errors',errs.length===0,errs.slice(0,3));
console.log(JSON.stringify({total:n,failed:bad,method:'headless chromium, software rendering'}));await b.close();process.exit(bad?1:0);
