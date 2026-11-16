// R1099 헤드리스 확인: 히든 영웅 EGO 수묵 그림이 실제 게임 화면의 렌더러 명령과 화소에 닿는지, 환도 몸이 겹쳐 그려지지 않는지.
// 실행: node r1099-browser.mjs <out dir> [지역]  (SW_URL 기본 http://127.0.0.1:4410/m0/). 헤드리스 소프트웨어 렌더링이라 GPU·실기기 확인이 아니다.
import {chromium,boot,skip,go} from '../r444/lib.mjs';import fs from 'node:fs';
const out=process.argv[2]||'.',zone=process.argv[3]||'dist02';fs.mkdirSync(out,{recursive:true});let n=0,bad=0;
const ok=(m,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(d!==undefined?' '+JSON.stringify(d):''));};
const b=await chromium.launch();const errs=[];
const {p}=await boot(b,{vp:{width:1280,height:720}});p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const API='__STORYWORLD_EGO_INK_R1099__',I=()=>p.evaluate(a=>window[a].inspect(),API);
await go(p,zone);
// 히든 EGO 형상 켜기(777 은 환도 99레벨일 뿐 EGO 형상이 아니다)
const form=await p.evaluate(()=>{const E=window.__STORYWORLD_EGO_SOVEREIGN_R1046__;E.unlock('qa');return E.setForm(true);});
ok('hidden EGO form on',form===true,form);
await p.evaluate(()=>{window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});
const hold=()=>p.evaluate(()=>{room.enemies.length=0;projectiles.length=0;player.hp=maxHP();player.invincible=1e6;});
await hold();
await p.waitForFunction(a=>window[a].inspect().ready>=6,API,{timeout:240000}).catch(()=>{});
const census=()=>p.evaluate(async()=>{const three=window.__STORYWORLD_PHASE1__.controller.state.three,base=three.render;let refs=null;
 three.render=function(f){if(!refs&&f&&Array.isArray(f.commands)&&f.commands.length)refs=f.commands.slice();return base.apply(this,arguments);};
 for(let i=0;i<80&&!refs;i++)await new Promise(r=>setTimeout(r,100));three.render=base;if(!refs)return null;
 const o={bodies:[],hwando:0,others:0,othersInk:0};
 for(const c of refs){if(c.kind!=='image')continue;const sp=String(c.sourcePath||''),mine=/^r1099:ink:/.test(sp);
  if(c.owner?.kind==='hero'&&!c.owner?.r1048fx&&(mine||/assets\/r1048\/ego\//.test(sp))){const xs=c.points.map(q=>q[0]),ys=c.points.map(q=>q[1]);
   o.bodies.push({ink:mine,path:sp.slice(0,70),canvas:c.image?.tagName==='CANVAS',box:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)],filter:c.style?.filter,op:c.style?.globalCompositeOperation||'source-over',a:c.style?.globalAlpha,finite:c.points.flat().every(Number.isFinite)});}
  else if(c.owner?.kind==='hero'&&!c.owner?.r1048fx&&(()=>{const u=(/^r409:outline:hero:u:(.+?):\d+,/.exec(sp)||[])[1]||sp;return !/r1048\//.test(u)&&window.__STORYWORLD_EGO_MOTION_R1048__.bodyArt(u);})())o.hwando++;
  else{o.others++;if(mine)o.othersInk++;}}
 return o;});
const pixels=async(box,ref)=>{const buf=await p.locator('#game').screenshot();return p.evaluate(async([b64,box,ref])=>{const im=new Image();im.src='data:image/png;base64,'+b64;await im.decode();const r=document.getElementById('game').getBoundingClientRect(),sx=im.width/r.width,sy=im.height/r.height;
  const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);
  const x=Math.max(0,Math.floor(box[0]*sx)),y=Math.max(0,Math.floor(box[1]*sy)),w=Math.min(im.width-x,Math.ceil((box[2]-box[0])*sx)),h=Math.min(im.height-y,Math.ceil((box[3]-box[1])*sy));
  const d=g.getImageData(x,y,w,h).data;let pale=0,red=0,gold=0,l=0,ed=0,N=d.length/4;for(let i=0;i<d.length;i+=4){const R=d[i],G=d[i+1],B=d[i+2],L=.299*R+.587*G+.114*B;l+=L;if(L>(ref||120)&&Math.max(R,G,B)-Math.min(R,G,B)<70)pale++;if(R-Math.max(G,B)>60)red++;if(R>G&&G>B+40&&G>90)gold++;}
  // 윤곽 또렷함: 가로 이웃 밝기 차 평균
  for(let yy=0;yy<h;yy++)for(let xx=1;xx<w;xx++){const i=(yy*w+xx)*4,j=i-4;ed+=Math.abs((.299*d[i]+.587*d[i+1]+.114*d[i+2])-(.299*d[j]+.587*d[j+1]+.114*d[j+2]));}
  return {pale:pale/N,red:red/N,gold:gold/N,lum:l/N,edge:ed/Math.max(1,h*(w-1)),N};},[buf.toString('base64'),box,ref]);};
const crop=async(box,name)=>{const pad=40;await p.screenshot({path:`${out}/${name}.png`,clip:{x:Math.max(0,box[0]-pad),y:Math.max(0,box[1]-pad),width:box[2]-box[0]+2*pad,height:box[3]-box[1]+2*pad}});};
await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(800);
const i0=await I();ok('module on, map ink live, baked without errors',i0.on&&i0.inkLive&&i0.active&&i0.errors===0&&i0.failed===0&&i0.ready>=1,i0);
const a=await census();const main=a?.bodies?.find(x=>x.op==='source-over'&&(x.a??1)>.9);
ok('EGO body command is drawn from the ink canvas (finite corners)',!!main&&main.ink&&main.canvas&&main.finite,a?.bodies);
ok('R1090 character tint is not stacked on the ink painting',!!main&&!/saturate\(\.5\)/.test(String(main.filter)),main?.filter);
ok('no hwando body drawn together with EGO (overlap bug stays fixed)',!!a&&a.hwando===0,a&&a.hwando);
ok('nothing else uses the EGO ink canvas',!!a&&a.othersInk===0,a&&a.othersInk);
const box=main.box;await p.screenshot({path:`${out}/ego-on-full.png`});await crop(box,'ego-on');
await p.evaluate(a=>window[a].set(false),API);await p.waitForTimeout(900);
const o=await census();const omain=o?.bodies?.find(x=>x.op==='source-over'&&(x.a??1)>.9);ok('switched off → original EGO 3D art again',!!omain&&!omain.ink,omain);
await p.screenshot({path:`${out}/ego-off-full.png`});await crop(box,'ego-off');
const ref=130;let off=await pixels(box,ref);
await p.evaluate(a=>window[a].set(true),API);await p.waitForTimeout(900);const on=await pixels(box,ref);
console.log('PIXELS',JSON.stringify({on,off,ref}));
ok('on screen: paper-white (lum>130, near-neutral) appears around/in the figure (≥4% of box, ≥2× original)',on.pale>=.04&&on.pale>=off.pale*2,{on:on.pale,off:off.pale});
ok('on screen: yeonji red kept (≥1% of box)',on.red>=.01,{on:on.red,off:off.red});
ok('on screen: gold trim gone (EGO = rouge + ink + white only; ≤ 40% of original gold)',on.gold<=off.gold*.4+.001,{on:on.gold,off:off.gold});
ok('on screen: crisper figure — mean neighbour contrast +15% or more',on.edge>=off.edge*1.15,{on:on.edge,off:off.edge});
ok('ink box sits on the original cell (centre within 3px)',(()=>{const cx0=(omain.box[0]+omain.box[2])/2,cy0=omain.box[3],cx1=(box[0]+box[2])/2;return Math.abs(cx0-cx1)<=Math.max(3,(omain.box[2]-omain.box[0])*.5)&&box[3]<=cy0+1;})(),{ink:box,orig:omain.box});
// 움직이며: 걷기·공격 그림도 수묵으로
await p.evaluate(()=>{window.__SLOW=1;});
await p.waitForFunction(a=>window[a].inspect().ready>=12,API,{timeout:300000}).catch(()=>{});
await p.evaluate(()=>{window.__SLOW=1;window.__mvT=setInterval(()=>{player.x+=.05;player.y+=.05;},30);});await p.waitForTimeout(1500);
const mv=await census();await p.evaluate(()=>{clearInterval(window.__mvT);window.__SLOW=1e-4;});
const mm=mv?.bodies?.find(x=>x.op==='source-over'&&(x.a??1)>.9);await p.screenshot({path:`${out}/ego-move.png`});
ok('while moving the body is the ink painting of a walk/run sheet',!!mm&&mm.ink&&/ink:(walk|run)-/.test(mm.path),mv?.bodies);
// 맵 수묵화풍을 끄면 같이 쉼
await p.evaluate(()=>{window.__SLOW=1;});
await p.evaluate(()=>window.__STORYWORLD_INK_WASH_R1055__.set({mode:'off'}));await p.waitForTimeout(3500);const m0=await I(),c0=await census();
ok('map ink off → EGO ink rests too',m0.on&&!m0.active&&!!c0&&c0.bodies.every(x=>!x.ink),{active:m0.active});
await p.evaluate(()=>window.__STORYWORLD_INK_WASH_R1055__.set({mode:'all'}));await p.waitForTimeout(4500);const m1=await I(),c1=await census();
ok('map ink back on → ink painting returns',m1.active&&!!c1&&c1.bodies.some(x=>x.ink),{active:m1.active});
// EGO 형상을 끄면 환도로(수묵 EGO 그림이 남지 않는다)
await p.evaluate(()=>window.__STORYWORLD_EGO_SOVEREIGN_R1046__.setForm(false));await p.waitForTimeout(1500);const h=await census();
ok('EGO form off → no EGO ink body left (plain hwando)',!!h&&h.bodies.length===0,h&&h.bodies.length);
await p.evaluate(()=>window.__STORYWORLD_EGO_SOVEREIGN_R1046__.setForm(true));await p.waitForTimeout(800);
// 설정 줄
await p.evaluate(()=>showSettings());await p.waitForTimeout(1200);
const row=await p.evaluate(()=>{const r=document.getElementById('egoInkRowR1099'),b=document.getElementById('egoInkOnR1099'),ch=document.getElementById('inkCharsRowR1090');return r&&{parent:r.parentNode?.id,checked:b.checked,vis:!!r.offsetParent,afterChars:ch?!!(ch.compareDocumentPosition(r)&4):null,count:document.querySelectorAll('#egoInkRowR1099').length,text:r.textContent.slice(0,30)};});
ok("settings: 'EGO 수묵 그림' row in the combat screen section after the character tint row, visible, checked, single",!!row&&row.parent==='combatScreenR1021'&&row.checked&&row.vis&&row.afterChars===true&&row.count===1,row);
await p.evaluate(()=>document.getElementById('egoInkRowR1099').scrollIntoView({block:'center'}));await p.waitForTimeout(300);await p.screenshot({path:`${out}/settings.png`});
await p.evaluate(()=>document.getElementById('egoInkOnR1099').click());await p.waitForTimeout(300);
ok('settings: unchecking saves "0" and turns it off',(await I()).on===false&&await p.evaluate(()=>localStorage.getItem('storyworld.r1099.egoInk'))==='0');
await p.evaluate(()=>document.getElementById('egoInkOnR1099').click());await p.waitForTimeout(300);ok('settings: checking again turns it on',(await I()).on===true&&await p.evaluate(()=>localStorage.getItem('storyworld.r1099.egoInk'))===null);
await p.evaluate(()=>{if(modal)closePanel(true);});
const fin=await I();ok('no module errors, no page errors',fin.errors===0&&errs.length===0,{errors:fin.errors,lastError:fin.lastError,page:errs.slice(0,3)});
console.log('INSPECT',JSON.stringify(fin));
console.log(JSON.stringify({total:n,failed:bad,method:'headless chromium (software rendering)'}));await b.close();process.exit(bad?1:0);
