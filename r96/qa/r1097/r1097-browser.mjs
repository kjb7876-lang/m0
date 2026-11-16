// R1097 헤드리스 확인: 페르소나 보스 수묵 그림이 실제 결전 화면의 렌더러 명령과 화소에 닿는지.
// 실행: node r1097-browser.mjs <out dir>  (SW_URL 기본 http://127.0.0.1:4410/m0/). 헤드리스 소프트웨어 렌더링이라 GPU·실기기 확인이 아니다.
import {chromium,boot,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const out=process.argv[2]||'.';fs.mkdirSync(out,{recursive:true});let n=0,bad=0;
const ok=(m,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(d!==undefined?' '+JSON.stringify(d):''));};
const b=await chromium.launch();const errs=[];
const {p}=await boot(b,{vp:{width:1280,height:720}});p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const I=()=>p.evaluate(()=>window.__STORYWORLD_PERSONA_INK_R1097__.inspect());
await p.evaluate(()=>enterRegion('cult04',null,{layer:'DREAM',restore:true}));
await p.waitForFunction(()=>!loading&&room?.id==='cult04',null,{timeout:150000});await skip(p);
await p.evaluate(()=>{room.enemies=[];preparePersona3();});await p.waitForTimeout(500);await skip(p);
await p.evaluate(()=>{const e=room.enemies.find(e=>e.persona);summon3([e],'persona');});
await p.waitForFunction(()=>room.encounterStage==='active',null,{timeout:120000});await skip(p);
// 보스를 영웅 옆에 세워 두고 시간을 거의 멈춘다(같은 순간을 켬·끔으로 비교)
await p.evaluate(()=>{window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});
// 찍는 순간 고정: 보스를 영웅 바로 위(화면 뒤쪽) 3칸에 세워 늘 정면 그림(base-0·awake-0 — 영웅을 바라보는 방향)이 나오게 한다.
//  방향마다 붉은 면적이 달라(뒷모습은 원본부터 붉은색이 적다) 방향이 그때그때 다르면 화소 비율이 흔들린다(공개본 QA 3회 1.24~2.08%).
const hold=()=>p.evaluate(()=>{const e=room.enemies.find(e=>e.persona);e.speed=0;e.cd=1e6;e.hp=e.maxHp;e.x=player.x;e.y=player.y-3;e.homeX=e.x;e.homeY=e.y;e.vx=0;e.vy=0;player.hp=maxHP();player.invincible=1e6;projectiles.length=0;});
// 수묵 그림이 실제로 그려질 때까지(굽기·받기가 느린 공개본에서도) 기다린다: 원하는 그림 묶음(base|awake)의 정면이 수묵 캔버스로 나오는 프레임
const settle=async(kind,want=true)=>{for(let i=0;i<90;i++){await hold();const c=await census();if(c?.body&&!!c.body.ink===want&&(!want||new RegExp('^r1097:ink:'+kind+'-0').test(c.body.path)))return c;await p.waitForTimeout(1500);}return census();};
// 한 프레임의 명령을 바깥에서 붙잡아 그린 뒤의 상태를 읽는다
const census=()=>p.evaluate(async()=>{const three=window.__STORYWORLD_PHASE1__.controller.state.three,base=three.render;let refs=null;
 three.render=function(f){if(!refs&&f&&Array.isArray(f.commands)&&f.commands.length)refs=f.commands.slice();return base.apply(this,arguments);};
 for(let i=0;i<80&&!refs;i++)await new Promise(r=>setTimeout(r,100));three.render=base;if(!refs)return null;
 const e=room.enemies.find(e=>e.persona),o={body:null,others:0,othersInk:0,heroInk:0};
 for(const c of refs){if(c.kind!=='image')continue;const mine=/^r1097:ink:/.test(String(c.sourcePath));
  if(c.owner?.kind==='enemy'&&c.owner.id==='enemy:'+e.id&&c.spatialRole==='body'){const xs=c.points.map(q=>q[0]),ys=c.points.map(q=>q[1]);
   o.body={ink:mine,r1097:!!c.r1097,path:String(c.sourcePath).slice(0,60),canvas:c.image?.tagName==='CANVAS',size:[c.image?.width,c.image?.height],box:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)],filter:c.style?.filter,op:c.style?.globalCompositeOperation,finite:c.points.flat().every(Number.isFinite)};}
  else{o.others++;if(mine){o.othersInk++;if(c.owner?.kind==='hero')o.heroInk++;}}}
 return o;});
// 보스 상자 화소: 밝은 종이빛(여백)·붉은빛·푸른빛 비율
const pixels=async(box,ref)=>{const buf=await p.locator('#game').screenshot();return p.evaluate(async([b64,box,ref])=>{const im=new Image();im.src='data:image/png;base64,'+b64;await im.decode();const r=document.getElementById('game').getBoundingClientRect(),sx=im.width/r.width,sy=im.height/r.height;
  const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);
  const x=Math.max(0,Math.floor(box[0]*sx)),y=Math.max(0,Math.floor(box[1]*sy)),w=Math.min(im.width-x,Math.ceil((box[2]-box[0])*sx)),h=Math.min(im.height-y,Math.ceil((box[3]-box[1])*sy));
  const d=g.getImageData(x,y,w,h).data;let pale=0,red=0,blue=0,l=0,N=d.length/4;for(let i=0;i<d.length;i+=4){const R=d[i],G=d[i+1],B=d[i+2],L=.299*R+.587*G+.114*B;l+=L;if(L>(ref||120)&&Math.max(R,G,B)-Math.min(R,G,B)<70)pale++;if(R-Math.max(G,B)>60)red++;if(B-R>40&&B>90)blue++;}
  return {pale:pale/N,red:red/N,blue:blue/N,lum:l/N,N};},[buf.toString('base64'),box,ref]);};
await hold();await p.waitForFunction(()=>window.__STORYWORLD_PERSONA_INK_R1097__.inspect().ready>=8,null,{timeout:180000}).catch(()=>{});await settle('base');
await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(600);await hold();
const i0=await I();ok('module on, map ink live, baked without errors',i0.on&&i0.inkLive&&i0.active&&i0.errors===0&&i0.failed===0&&i0.ready>=1,i0);
const a=await census();
ok('persona body command is drawn from the ink canvas (finite corners, source-over)',!!a?.body&&a.body.ink&&a.body.r1097&&a.body.canvas&&a.body.finite&&(a.body.op||'source-over')==='source-over',a?.body);
ok('R1090 character tint is not stacked on the ink painting',!!a?.body&&!/saturate\(\.5\)/.test(String(a.body.filter)),a?.body?.filter);
ok('nothing else uses the ink canvas (hero, other images: 0 of '+a?.others+')',!!a&&a.othersInk===0&&a.heroInk===0);
const box=a.body.box;let on=await pixels(box);await p.screenshot({path:`${out}/persona-on.png`});
await p.evaluate(()=>window.__STORYWORLD_PERSONA_INK_R1097__.set(false));await p.waitForTimeout(900);
const o=await census();ok('switched off → original body art again',!!o?.body&&!o.body.ink&&!o.body.r1097,o?.body);
let off=await pixels(box);await p.screenshot({path:`${out}/persona-off.png`});
// 종이빛 기준은 이 장면 조명에 맞춘다: 결전장은 어둠 막이 덮여 종이 흰색도 밝기 120 을 못 넘으므로, 원본 상자 평균 밝기의 두 배를 넘는 무채색에 가까운 화소를 센다
const ref=off.lum*2;off=await pixels(box,ref);await p.evaluate(()=>window.__STORYWORLD_PERSONA_INK_R1097__.set(true));await p.waitForTimeout(900);on=await pixels(box,ref);await p.evaluate(()=>window.__STORYWORLD_PERSONA_INK_R1097__.set(false));await p.waitForTimeout(900);
console.log('PIXELS',JSON.stringify({on,off}));
ok('on screen (same frozen moment): paper-white area appears around/in the figure (≥ 6% of the box, at least 3× the original)',on.pale>=.06&&on.pale>=off.pale*3,{on:on.pale,off:off.pale});
ok('on screen: the figure keeps its yeonji red (red share ≥ 60% of the original and ≥ 2% of the box)',on.red>=off.red*.6&&on.red>=.02,{on:on.red,off:off.red});
ok('on screen: the box gets brighter, i.e. the dark figure no longer sinks into the dark floor (mean luminance +15% or more)',on.lum>=off.lum*1.15,{on:on.lum,off:off.lum});
ok('the ink box is about the same place and size as the original (grown only by the paper margin: width within +5%..+45%)',(()=>{const w0=o.body.box[2]-o.body.box[0],w1=box[2]-box[0],cx0=(o.body.box[0]+o.body.box[2])/2,cx1=(box[0]+box[2])/2;return w1>=w0*1.05&&w1<=w0*1.45&&Math.abs(cx0-cx1)<=3;})(),{ink:box,orig:o.body.box});
await p.evaluate(()=>window.__STORYWORLD_PERSONA_INK_R1097__.set(true));await p.waitForTimeout(700);
// 각성 그림
await p.evaluate(()=>{window.__SLOW=1;const e=room.enemies.find(e=>e.persona);e.awakeUntil=time+1e5;});
await p.waitForFunction(()=>window.__STORYWORLD_PERSONA_INK_R1097__.inspect().ready>=16,null,{timeout:180000}).catch(()=>{});await settle('awake');
await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(600);await hold();
const aw=await census();ok('awakened body is also the ink painting (awake art)',!!aw?.body&&aw.body.ink&&/awake/.test(aw.body.path),aw?.body);
await p.screenshot({path:`${out}/persona-awake-on.png`});
await p.evaluate(()=>window.__STORYWORLD_PERSONA_INK_R1097__.set(false));await p.waitForTimeout(900);await p.screenshot({path:`${out}/persona-awake-off.png`});
await p.evaluate(()=>window.__STORYWORLD_PERSONA_INK_R1097__.set(true));await p.waitForTimeout(700);
// 피격 번쩍임이 남는지(필터가 앞에 그대로)
// 맵 수묵화풍을 끄면 같이 쉼
await p.evaluate(()=>{window.__SLOW=1;});
await p.evaluate(()=>window.__STORYWORLD_INK_WASH_R1055__.set({mode:'off'}));await p.waitForFunction(()=>!window.__STORYWORLD_PERSONA_INK_R1097__.inspect().active,null,{timeout:60000}).catch(()=>{});const c0=await settle('',false),m0=await I();
ok('map ink switched off → persona ink rests too (original art)',m0.on&&!m0.active&&!!c0?.body&&!c0.body.ink,{active:m0.active});
await p.evaluate(()=>window.__STORYWORLD_INK_WASH_R1055__.set({mode:'all'}));await p.waitForFunction(()=>window.__STORYWORLD_PERSONA_INK_R1097__.inspect().active,null,{timeout:60000}).catch(()=>{});const c1=await settle('(base|awake)'),m1=await I();
ok('map ink back on → ink painting returns',m1.active&&!!c1?.body&&c1.body.ink,{active:m1.active});
await p.evaluate(()=>window.__STORYWORLD_PERF7_R1043__.setStep(2));await p.waitForFunction(()=>!window.__STORYWORLD_PERSONA_INK_R1097__.inspect().active,null,{timeout:60000}).catch(()=>{});const c2=await settle('',false),s2=await I();ok('perf step 2 (map ink rests) → rests',!s2.active&&!!c2?.body&&!c2.body.ink,{active:s2.active});
await p.evaluate(()=>window.__STORYWORLD_PERF7_R1043__.setStep(5));await p.waitForFunction(()=>window.__STORYWORLD_PERSONA_INK_R1097__.inspect().active,null,{timeout:60000}).catch(()=>{});const c5=await settle('(base|awake)');ok('perf step 5 → ink painting again',(await I()).active&&!!c5?.body&&c5.body.ink,c5?.body);
// 설정 줄
await p.evaluate(()=>showSettings());await p.waitForTimeout(1200);
const row=await p.evaluate(()=>{const r=document.getElementById('personaInkRowR1097'),b=document.getElementById('personaInkOnR1097'),ch=document.getElementById('inkCharsRowR1090');return r&&{parent:r.parentNode?.id,checked:b.checked,vis:!!r.offsetParent,afterChars:ch?!!(ch.compareDocumentPosition(r)&4):null,count:document.querySelectorAll('#personaInkRowR1097').length,text:r.textContent.slice(0,30)};});
ok("settings: '페르소나 수묵 그림' row in the combat screen section after the character tint row, visible, checked, single",!!row&&row.parent==='combatScreenR1021'&&row.checked&&row.vis&&row.afterChars===true&&row.count===1,row);
await p.evaluate(()=>document.getElementById('personaInkRowR1097').scrollIntoView({block:'center'}));await p.waitForTimeout(300);await p.screenshot({path:`${out}/settings.png`});
await p.evaluate(()=>document.getElementById('personaInkOnR1097').click());await p.waitForTimeout(300);
ok('settings: unchecking saves "0" and turns it off',(await I()).on===false&&await p.evaluate(()=>localStorage.getItem('storyworld.r1097.personaInk'))==='0');
await p.evaluate(()=>document.getElementById('personaInkOnR1097').click());await p.waitForTimeout(300);ok('settings: checking again turns it on and clears the stored value',(await I()).on===true&&await p.evaluate(()=>localStorage.getItem('storyworld.r1097.personaInk'))===null);
await p.evaluate(()=>{if(modal)closePanel(true);});
const fin=await I();ok('no module errors, no page errors',fin.errors===0&&errs.length===0,{errors:fin.errors,lastError:fin.lastError,page:errs.slice(0,3)});
console.log('INSPECT',JSON.stringify(fin));
console.log(JSON.stringify({total:n,failed:bad,method:'headless chromium (software rendering)'}));await b.close();process.exit(bad?1:0);
