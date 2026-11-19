// R1192 헤드리스 확인: 보스 운석(R241, 발록 dist06) 이 켬/끔에서 실제 렌더러 명령 알파와 화면 화소로 더 잘 보이는지, 영웅 스킬 이펙트는 그대로인지.
// 실행: node r1192-browser.mjs <out dir>  (SW_URL 기본 http://127.0.0.1:4410/m0/). 헤드리스 소프트웨어 렌더링이라 GPU·실기기 확인이 아니다.
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const out=process.argv[2]||'.';fs.mkdirSync(out,{recursive:true});let n=0,bad=0;
const ok=(m,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(d!==undefined?' '+JSON.stringify(d):''));};
const b=await chromium.launch();const errs=[];
const {p}=await boot(b,{vp:{width:960,height:540}});p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await p.evaluate(()=>{window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});
const has=await p.evaluate(()=>!!window.__STORYWORLD_BOSS_FX_VIS_R1192__);ok('module loaded',has);
const setOn=v=>p.evaluate(v=>{try{window.__STORYWORLD_BOSS_FX_VIS_R1192__.set(v);}catch(_){}},v);
const census=(prefix)=>p.evaluate(async(prefix)=>{const three=window.__STORYWORLD_PHASE1__.controller.state.three,base=three.render;let refs=null;
 three.render=function(f){if(!refs&&f&&Array.isArray(f.commands)&&f.commands.length)refs=f.commands.slice();return base.apply(this,arguments);};
 for(let i=0;i<80&&!refs;i++)await new Promise(r=>setTimeout(r,100));three.render=base;if(!refs)return null;
 const sel=refs.filter(c=>prefix.some(x=>String(c.owner?.id||'').startsWith(x))&&c.kind!=='text');const al=sel.map(c=>+c.style.globalAlpha||0),lit=sel.filter(c=>c.style.globalCompositeOperation==='lighter').map(c=>+c.style.globalAlpha||0);
 const fx=refs.filter(c=>c.owner?.kind==='effect'&&!prefix.some(x=>String(c.owner?.id||'').startsWith(x)));
 const om=fx.filter(c=>c.r1192).map(c=>String(c.owner?.id)).slice(0,5);return {om,n:sel.length,mean:al.length?al.reduce((a,b)=>a+b,0)/al.length:0,litMax:lit.length?Math.max(...lit):0,marked:sel.filter(c=>c.r1192).length,otherMarked:fx.filter(c=>c.r1192).length,other:fx.length};},prefix);
const vis=(a,c)=>p.evaluate(async([A,C])=>{const load=async s=>{const im=new Image();im.src='data:image/png;base64,'+s;await im.decode();const k=document.createElement('canvas');k.width=im.width;k.height=im.height;const g=k.getContext('2d');g.drawImage(im,0,0);return g.getImageData(0,0,k.width,k.height).data;};
 const x=await load(A),y=await load(C);let ch=0,sum=0;for(let i=0;i<x.length;i+=4){const d=Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2]);if(d>=60){ch++;sum+=d;}}return {changed:ch,mean:ch?Math.round(sum/ch):0};},[a.toString('base64'),c.toString('base64')]);
await go(p,'dist06');
await p.evaluate(()=>{const e=(room.enemies||[]).find(e=>e.boss);player.x=e.x+3;player.y=e.y+1;room.engaged=true;e.spawnState='active';e.visible=true;e.disabled=false;window.__B=e;
 /* 자체 순환이 또 던지지 않게(같은 장면 비교) */const M=window.__STORYWORLD_BOSS_METEOR_R241__;M.cast(e);});
const frames=[];
for(const age of [.7,1.15]){
 await p.evaluate(()=>{window.__SLOW=1;});await p.waitForFunction(t=>{const h=hazards.find(h=>h.r241Meteor);return !h||h.age>=t;},age,{timeout:180000});
 await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(600);
 const live=await p.evaluate(()=>hazards.filter(h=>h.r241Meteor).length);ok(`age ${age}: meteors on screen`,live>=4,live);
 await setOn(true);await p.waitForTimeout(500);const cOn=await census(['r241','r1192']);const sOn=await p.locator('#game').screenshot();await p.screenshot({path:`${out}/meteor-${age}-on.png`});
 await setOn(false);await p.waitForTimeout(500);const cOff=await census(['r241','r1192']);const sOff=await p.locator('#game').screenshot();await p.screenshot({path:`${out}/meteor-${age}-off.png`});
 // 운석을 잠깐 빼고 바탕만 찍는다(같은 순간) → 되돌린다
 await p.evaluate(()=>{window.__HID=hazards.filter(h=>h.r241Meteor);for(const h of __HID)hazards.splice(hazards.indexOf(h),1);});await p.waitForTimeout(500);
 const sBase=await p.locator('#game').screenshot();await p.evaluate(()=>{for(const h of __HID)hazards.push(h);});await setOn(true);
 const vOn=await vis(sOn,sBase),vOff=await vis(sOff,sBase);
 console.log('age',age,JSON.stringify({cOn,cOff,vOn,vOff}));frames.push({age,cOn,cOff,vOn,vOff});
 ok(`age ${age}: meteor commands are marked boosted when on`,!!cOn&&cOn.marked>=Math.max(4,cOn.n*.8),cOn);
 ok(`age ${age}: no meteor command is boosted when off`,!!cOff&&cOff.marked===0,cOff);
 ok(`age ${age}: mean meteor alpha up by ≥ 30%`,!!cOn&&!!cOff&&cOn.mean>=cOff.mean*1.3,{on:cOn?.mean,off:cOff?.mean});
 ok(`age ${age}: brightest additive meteor piece reaches ≥ .8 (R181 옅게 빼기 해제)`,!!cOn&&cOn.litMax>=.8,{on:cOn?.litMax,off:cOff?.litMax});
 ok(`age ${age}: visibly changed pixels vs. bare floor up by ≥ 30%`,vOn.changed>=vOff.changed*1.3,{on:vOn,off:vOff});
 ok(`age ${age}: mean colour difference on those pixels not lower`,vOn.mean>=vOff.mean*.95,{on:vOn.mean,off:vOff.mean});
 ok(`age ${age}: non-boss effects are not touched`,!!cOn&&cOn.otherMarked===0,{other:cOn?.other,marked:cOn?.otherMarked});}
// R330 보스 재해(화산): 떨어질 자리 육망성·불덩이도 같은 보강을 받는다
{await p.evaluate(()=>{window.__SLOW=1;hurt=function(){return 0;};for(let i=hazards.length-1;i>=0;i--)if(hazards[i].r241Meteor)hazards.splice(i,1);window.__STORYWORLD_DISASTER_R330__.cast(__B,'volcano');});
 const t0=await p.evaluate(()=>time);await p.waitForFunction(t0=>time>=t0+1.9,t0,{timeout:300000});await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(500);
 const all=()=>p.evaluate(async()=>{const three=window.__STORYWORLD_PHASE1__.controller.state.three,base=three.render;let refs=null;three.render=function(f){if(!refs&&f&&Array.isArray(f.commands)&&f.commands.length)refs=f.commands.slice();return base.apply(this,arguments);};
  for(let i=0;i<80&&!refs;i++)await new Promise(r=>setTimeout(r,100));three.render=base;return refs?refs.filter(c=>c.r1192).length:-1;});
 await setOn(true);await p.waitForTimeout(400);const mOn=await all();await p.screenshot({path:`${out}/volcano-on.png`});
 await setOn(false);await p.waitForTimeout(400);const mOff=await all();await p.screenshot({path:`${out}/volcano-off.png`});await setOn(true);
 ok('R330 volcano: disaster commands boosted when on, none when off',mOn>=10&&mOff===0,{mOn,mOff});}
// 영웅 스킬만 있는 장면: 표시 0
await p.evaluate(()=>{window.__SLOW=1;for(let i=hazards.length-1;i>=0;i--)if(hazards[i].r241Meteor||hazards[i].r330)hazards.splice(i,1);const e=__B;e.spawnState='hidden';room.engaged=false;});
{const t1=await p.evaluate(()=>time);await p.waitForFunction(t1=>time>=t1+6&&window.__STORYWORLD_DISASTER_R330__.inspect().fx===0,t1,{timeout:400000}).catch(()=>{});}/* 재해 그림이 다 사라질 때까지(게임 시간) */
for(const k of ['q','w','e','a','s']){await p.keyboard.down(k);await p.waitForTimeout(140);await p.keyboard.up(k);}
await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(500);
const h=await census(['r241','r1192']);ok('hero skills only: no effect command boosted',!!h&&h.otherMarked===0,h);
// 기억 지역 먹 번짐 타격(R1177f): pixelfx 'mob-memory' 를 영웅 옆에 틀어 그 그림 명령만 밝아지는지
{const played=await p.evaluate(()=>{window.__SLOW=1;const X=window.__STORYWORLD_PIXELFX_R163__;if(!X?.has?.('mob-memory'))return false;for(let i=0;i<3;i++)X.play('mob-memory',player.x+1+i*.6,player.y+.5,{k:1.3,rate:.0001,key:'r1192-ink-'+i});return true;});
 ok('mob-memory ink hit sheet exists',played===true);
 await p.waitForTimeout(1500);await p.evaluate(()=>{window.__SLOW=1e-4;});
 const inkc=()=>p.evaluate(async()=>{const three=window.__STORYWORLD_PHASE1__.controller.state.three,base=three.render;let refs=null;three.render=function(f){if(!refs&&f&&Array.isArray(f.commands)&&f.commands.length)refs=f.commands.slice();return base.apply(this,arguments);};
  for(let i=0;i<80&&!refs;i++)await new Promise(r=>setTimeout(r,100));three.render=base;const s=(refs||[]).filter(c=>/^r163:mob-memory:/.test(String(c.owner?.id||''))&&c.kind==='image');return {n:s.length,ink:s.filter(c=>c.r1192ink).length,f:s[0]?.style?.filter||null};});
 await setOn(true);await p.waitForTimeout(400);const iOn=await inkc();await p.screenshot({path:`${out}/ink-on.png`});
 await setOn(false);await p.waitForTimeout(400);const iOff=await inkc();await p.screenshot({path:`${out}/ink-off.png`});await setOn(true);
 ok('ink hit commands brightened when on, untouched when off',iOn.n>=1&&iOn.ink===iOn.n&&/brightness/.test(String(iOn.f))&&iOff.n>=1&&iOff.ink===0,{iOn,iOff});}
ok('no page errors',errs.length===0,errs.slice(0,3));
const I=await p.evaluate(()=>window.__STORYWORLD_BOSS_FX_VIS_R1192__?.inspect?.());console.log('inspect',JSON.stringify(I));ok('module reports no internal errors',!!I&&I.stats.errors===0,I&&I.lastError);
fs.writeFileSync(out+'/r1192-browser.json',JSON.stringify({frames,inspect:I},null,1));
console.log(`${n-bad}/${n} passed`);await b.close();process.exit(bad?1:0);
