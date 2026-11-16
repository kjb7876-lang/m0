// R1090 헤드리스 확인: 캐릭터 담묵 필터가 실제 렌더러 명령과 화면 색에 닿는지.
// 실행: node r1090-browser.mjs <out dir>  (SW_URL 기본 http://127.0.0.1:4410/m0/, SW_ZONES 기본 last302,dist02). 헤드리스 소프트웨어 렌더링이라 GPU·실기기 확인이 아니다.
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const out=process.argv[2]||'.';fs.mkdirSync(out,{recursive:true});let n=0,bad=0;
const ok=(m,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(d!==undefined?' '+JSON.stringify(d):''));};
const b=await chromium.launch();const errs=[];
const {p}=await boot(b,{vp:{width:1280,height:720}});p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const I=()=>p.evaluate(()=>window.__STORYWORLD_INK_CHARS_R1090__.inspect());
// 한 프레임의 명령을 바깥에서 붙잡아(우리 모듈보다 바깥) 그린 뒤의 style.filter 를 읽는다
const census=()=>p.evaluate(async()=>{const three=window.__STORYWORLD_PHASE1__.controller.state.three,base=three.render;let refs=null;
 three.render=function(f){if(!refs&&f&&Array.isArray(f.commands)&&f.commands.length)refs=f.commands.slice();return base.apply(this,arguments);};
 for(let i=0;i<80&&!refs;i++)await new Promise(r=>setTimeout(r,100));three.render=base;if(!refs)return null;
 const F=window.__STORYWORLD_INK_CHARS_R1090__.FILTER,o={hero:0,heroT:0,enemy:0,enemyT:0,other:0,otherT:0,otherKinds:{},ghostT:0,fxSkipped:0,sample:[],box:null};
 for(const c of refs){const k=c.owner?.kind,t=typeof c.style?.filter==='string'&&c.style.filter.endsWith(F),img=c.kind==='image',ghost=/^r(350|448):ghost:/.test(String(c.key));
  if(ghost){if(t)o.ghostT++;continue;}
  if(img&&(k==='hero'||k==='enemy')&&!c.owner.r350&&c.owner.groundAligned!==true&&(c.style?.globalCompositeOperation||'source-over')==='source-over'){
   if(/(?:^|[^a-z])(?:vfx|fx|pixelfx)(?:[^a-z]|$)/i.test(String(c.sourcePath||''))){o.fxSkipped+=t?0:1;if(t)o.otherT++;continue;}
   o[k]++;if(t)o[k+'T']++;if(o.sample.length<4)o.sample.push([k,String(c.sourcePath||'').slice(-40),c.style.filter]);
   if(Array.isArray(c.points)){const xs=c.points.map(q=>q[0]),ys=c.points.map(q=>q[1]),bx=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];if(bx[0]>=0&&bx[1]>=0&&bx[2]-bx[0]>18&&bx[3]-bx[1]>18)(o.boxes=o.boxes||[]).push(bx);}}
  else{o.other++;if(t){o.otherT++;o.otherKinds[k+':'+c.kind]=(o.otherKinds[k+':'+c.kind]||0)+1;}}}
 return o;});
// 캐릭터 상자마다 색 있는 화소(채도 상위 25%)의 평균 채도와 상자 평균 밝기(캔버스 화소)
const chroma=async(boxes)=>{const buf=await p.locator('#game').screenshot();return p.evaluate(async([b64,boxes,W,H])=>{const im=new Image();im.src='data:image/png;base64,'+b64;await im.decode();const sx=im.width/W,sy=im.height/H;
  const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);const out=[];
  for(const box of boxes){const x=Math.max(0,Math.floor(box[0]*sx)),y=Math.max(0,Math.floor(box[1]*sy)),w=Math.min(im.width-x,Math.ceil((box[2]-box[0])*sx)),h=Math.min(im.height-y,Math.ceil((box[3]-box[1])*sy));if(w<8||h<8)continue;
   const d=g.getImageData(x,y,w,h).data,cs=[];let l=0;for(let i=0;i<d.length;i+=4){cs.push(Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2]));l+=.213*d[i]+.715*d[i+1]+.072*d[i+2];}cs.sort((a,b)=>b-a);const top=cs.slice(0,Math.max(1,cs.length>>2));
   out.push({chroma:top.reduce((a,b)=>a+b,0)/top.length,lum:l/(d.length/4)});}return out;},[buf.toString('base64'),boxes,(await p.viewportSize()).width,(await p.evaluate(()=>{const r=document.getElementById('game').getBoundingClientRect();return [r.width,r.height,r.left,r.top];}))[1]]);};
const zones=(process.env.SW_ZONES||'last302,dist02').split(',');
await p.evaluate(()=>{window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});
for(const z of zones){
 await go(p,z);for(let i=0;i<4;i++){await skip(p);await p.waitForTimeout(900);}await p.waitForTimeout(3000);
 const i0=await I();ok(`${z}: module on, map ink live, no errors`,i0.on&&i0.inkLive&&i0.active&&i0.errors===0,i0);
 await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(500);
 const a=await census();ok(`${z}: every hero and mob body image carries the tint (hero ${a?.heroT}/${a?.hero}, mob ${a?.enemyT}/${a?.enemy})`,!!a&&a.hero>0&&a.heroT===a.hero&&a.enemyT===a.enemy,a?.sample);
 ok(`${z}: nothing else is tinted (props, ground, effects, text, bars: 0 of ${a?.other})`,!!a&&a.otherT===0,a?.otherKinds);
 const boxes=a?.boxes||[];const on=boxes.length?await chroma(boxes):[];await p.screenshot({path:`${out}/${z}-on.png`});
 await p.evaluate(()=>window.__STORYWORLD_INK_CHARS_R1090__.set(false));await p.waitForTimeout(900);
 const o=await census();ok(`${z}: switched off → no command tinted`,!!o&&o.heroT===0&&o.enemyT===0&&o.otherT===0&&o.ghostT===0);
 const off=boxes.length?await chroma(boxes):[];await p.screenshot({path:`${out}/${z}-off.png`});
 const pairs=on.map((v,i)=>({on:+v.chroma.toFixed(1),off:+off[i].chroma.toFixed(1),lumOn:+v.lum.toFixed(1),lumOff:+off[i].lum.toFixed(1)})).sort((x,y)=>y.off-x.off);
 console.log('CHROMA',z,JSON.stringify(pairs));
 const sum=k=>pairs.reduce((t,q)=>t+q[k],0),top=pairs[0];
 ok(`${z}: character boxes on screen lose colour with the tint (same frozen moment): total and the most colourful one both drop, brightness within 12%`,pairs.length>0&&sum('on')<sum('off')*.97&&top.on<top.off*.9&&Math.abs(sum('lumOn')-sum('lumOff'))<=sum('lumOff')*.12,{boxes:pairs.length,total:[+sum('on').toFixed(1),+sum('off').toFixed(1)],top});
 await p.evaluate(()=>window.__STORYWORLD_INK_CHARS_R1090__.set(true));await p.evaluate(()=>{window.__SLOW=1;});await p.waitForTimeout(600);}
// 맵 수묵화풍을 끄면 같이 쉼, 다시 켜면 돌아옴
await p.evaluate(()=>window.__STORYWORLD_INK_WASH_R1055__.set({mode:'off'}));await p.waitForTimeout(3500);const m0=await I(),c0=await census();
ok('map ink switched off → character tint rests too',m0.on&&!m0.active&&!!c0&&c0.heroT===0&&c0.enemyT===0,{active:m0.active});
await p.evaluate(()=>window.__STORYWORLD_INK_WASH_R1055__.set({mode:'all'}));await p.waitForTimeout(4500);const m1=await I(),c1=await census();
ok('map ink back on → tint returns',m1.active&&!!c1&&c1.heroT===c1.hero&&c1.hero>0,{active:m1.active});
// 성능 2단계(맵 수묵이 쉬는 단계)
await p.evaluate(()=>window.__STORYWORLD_PERF7_R1043__.setStep(2));await p.waitForTimeout(4500);const s2=await I();ok('perf step 2 (map ink rests) → tint rests',!s2.active,{active:s2.active});
await p.evaluate(()=>window.__STORYWORLD_PERF7_R1043__.setStep(5));await p.waitForTimeout(4500);ok('perf step 5 → tint active again',(await I()).active);
// 설정 줄
await p.evaluate(()=>showSettings());await p.waitForTimeout(1200);
const row=await p.evaluate(()=>{const r=document.getElementById('inkCharsRowR1090'),b=document.getElementById('inkCharsOnR1090'),ink=document.getElementById('inkRowR1055');return r&&{parent:r.parentNode?.id,checked:b.checked,vis:!!r.offsetParent,afterInk:ink?ink.nextElementSibling===r:null,count:document.querySelectorAll('#inkCharsRowR1090').length,text:r.textContent.slice(0,30)};});
ok("settings: '캐릭터 담묵' row right after the map ink row, visible, checked, single",!!row&&row.parent==='combatScreenR1021'&&row.checked&&row.vis&&row.afterInk===true&&row.count===1,row);
await p.evaluate(()=>document.getElementById('inkCharsRowR1090').scrollIntoView({block:'center'}));await p.waitForTimeout(300);await p.screenshot({path:`${out}/settings.png`});
await p.evaluate(()=>document.getElementById('inkCharsOnR1090').click());await p.waitForTimeout(300);
ok('settings: unchecking saves "0" and turns it off',(await I()).on===false&&await p.evaluate(()=>localStorage.getItem('storyworld.r1090.inkChars'))==='0');
await p.evaluate(()=>document.getElementById('inkCharsOnR1090').click());await p.waitForTimeout(300);ok('settings: checking again turns it on and clears the stored value',(await I()).on===true&&await p.evaluate(()=>localStorage.getItem('storyworld.r1090.inkChars'))===null);
await p.evaluate(()=>{if(modal)closePanel(true);});
const fin=await I();ok('no module errors, no page errors',fin.errors===0&&errs.length===0,{errors:fin.errors,lastError:fin.lastError,page:errs.slice(0,3)});
console.log(JSON.stringify({total:n,failed:bad,method:'headless chromium (software rendering)'}));await b.close();process.exit(bad?1:0);
