// R1095 헤드리스 확인: 이펙트 수묵 색이 실제 렌더러 명령과 화면 색에 닿는지, 끄면 원래 색으로 돌아오는지, 예고 표시·적 표식은 그대로인지.
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
  if(/(?:^|[^a-z])ego(?:[^a-z]|$)/i.test(id+' '+String(c.sourcePath||''))){if(t)o.egoT++;continue;}
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
 // 스킬을 눌러 이펙트가 여럿 떠 있는 순간을 잡는다
 let a=null;const keys=['q','w','e','r','a','s','d','f','Space'];
 for(let t=0;t<14;t++){await p.evaluate(()=>{window.__SLOW=1;});
  for(const k of keys.slice(0,3+(t%6))){await p.keyboard.down(k==='Space'?'Space':k);await p.waitForTimeout(140);await p.keyboard.up(k==='Space'?'Space':k);}
  await p.waitForTimeout(350+t*120);await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(500);
  a=await census();if(a&&a.fxT>=10)break;}
 ok(tag+': effect commands found and tinted',!!a&&a.fx>=10&&a.fxT>=10,a&&{fx:a.fx,fxT:a.fxT});
 ok(tag+': nearly every eligible effect command is tinted (재기 예산으로 한두 장 늦을 수 있음)',!!a&&a.fxT/Math.max(1,a.fx)>=.7,a&&{fx:a.fx,fxT:a.fxT});
 ok(tag+': only filter kinds the Three recorder knows',!!a&&a.bad.length===0,a&&a.bad);
 ok(tag+': hazards·projectiles·bodies·text·shadows·enemy signals·EGO untouched',!!a&&a.hazardT+a.projT+a.bodyT+a.textT+a.shadowT+a.signalT+a.egoT===0,a&&{hazard:a.hazard,hazardT:a.hazardT,projT:a.projT,bodyT:a.bodyT,textT:a.textT,shadowT:a.shadowT,signalT:a.signalT,egoT:a.egoT});
 console.log(tag,'filters',JSON.stringify(a&&a.filters));
 const on=await p.locator('#game').screenshot();await p.screenshot({path:`${out}/${tag}-on.png`});
 await p.evaluate(()=>window.__STORYWORLD_INK_FX_R1095__.set(false));await p.waitForTimeout(900);
 const a2=await census();ok(tag+': set(false) → no effect command is tinted (원래 색)',!!a2&&a2.fxT===0,a2&&{fx:a2.fx,fxT:a2.fxT});
 const off=await p.locator('#game').screenshot();await p.screenshot({path:`${out}/${tag}-off.png`});
 const d=await diff(on,off);console.log(tag,'pixels',JSON.stringify(d));
 ok(tag+': the picture really changes (달라진 화소 300개 이상)',d.changed>=300,d.changed);
 ok(tag+': changed coloured pixels are mostly vermilion when on (60% 이상), and more than when off',d.share!==null&&d.share>=.6&&(d.offShare===null||d.share>d.offShare),d);
 await p.evaluate(()=>window.__STORYWORLD_INK_FX_R1095__.set(true));await p.waitForTimeout(900);
 const a3=await census();ok(tag+': set(true) → tinted again without reload',!!a3&&a3.fxT>=Math.min(10,a.fxT),a3&&{fx:a3.fx,fxT:a3.fxT});
 // 맵 수묵화풍을 끄면 같이 쉰다
 await p.evaluate(()=>window.__STORYWORLD_INK_WASH_R1055__.set({mode:'off'}));await p.waitForTimeout(1300);
 const a4=await census(),i4=await I();ok(tag+': map ink wash off → rests (끄면 원래 색)',i4.active===false&&!!a4&&a4.fxT===0,{active:i4.active,fxT:a4&&a4.fxT});
 await p.evaluate(()=>window.__STORYWORLD_INK_WASH_R1055__.set({mode:'all'}));await p.waitForTimeout(1300);
 ok(tag+': map ink wash back on → active again',(await I()).active===true);
 await p.evaluate(()=>{window.__SLOW=1;});}
const fin=await I();ok('no module errors',fin.errors===0,fin);ok('no page errors',errs.length===0,errs.slice(0,3));
console.log(JSON.stringify({total:n,failed:bad,method:'headless chromium, software rendering'}));await b.close();process.exit(bad?1:0);
