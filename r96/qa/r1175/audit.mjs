// R1175 페르소나 라우렌 흔적 전수 조사(헤드리스): 렌더 직전(처리 뒤) 명령 중 라우렌 경로·보라 픽셀·보라 벡터가 남은 것을 모은다.
// node audit.mjs <out> [zone]
import {chromium,boot,go,skip} from '../r444/lib.mjs';
import fs from 'node:fs';
const OUT=process.argv[2]||'.';const ZONE=process.argv[3]||'murder01';const HERO=process.argv[4]||'persona';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
const A='__STORYWORLD_PERSONA_HERO_R1113__';
await p.evaluate(async([A,H])=>{const h=H==='persona'?'lauren':H;await ensureImages(heroPaths(h));player.hero=h;window[A].unlock('silent');window[A].setForm(H==='persona');},[A,HERO]);
await go(p,ZONE);
await p.evaluate(()=>{const st=window.__STORYWORLD_PROGRESSION_R62__.state(player);for(const s of 'QWER')st.ranks['skill'+s+'R663']=1;player.maxHp=player.hp=99999;});
await p.evaluate(()=>{
 const SKIP=new Set(['enemy','tile','prop','floor','wall','ground','objective','shadow','contact','npc','item','door','portal','altar']);
 const T=__STORYWORLD_PHASE1__.controller.state.three;const O=T.render;window.__leaks=new Map();
 const cv=document.createElement('canvas');cv.width=cv.height=24;const g=cv.getContext('2d',{willReadFrequently:true});const cache=new Map();
 const violet=(r,gg,bb)=>bb>r&&bb>gg&&bb-Math.min(r,gg)>=30;
 function pix(c){const im=c.image;if(!im)return null;const sr=Array.isArray(c.sourceRect)?c.sourceRect:[0,0,im.naturalWidth||im.width,im.naturalHeight||im.height];
  const key=(c.sourcePath||im.src||'')+'|'+sr.join(',');if(cache.has(key))return cache.get(key);let r=null;
  try{g.clearRect(0,0,24,24);g.drawImage(im,sr[0],sr[1],sr[2],sr[3],0,0,24,24);const d=g.getImageData(0,0,24,24).data;let n=0,v=0;for(let i=0;i<d.length;i+=4){if(d[i+3]<40)continue;n++;if(violet(d[i],d[i+1],d[i+2]))v++;}r=n>8?v/n:0;}catch(_){r=null;}
  if(cache.size<5000)cache.set(key,r);return r;}
 window.__samples=window.__samples||{};const add=(k,c)=>{window.__leaks.set(k,(window.__leaks.get(k)||0)+1);if(c&&!window.__samples[k]){const o=c.owner||{};window.__samples[k]={owner:JSON.stringify(o).slice(0,300),sp:String(c.sourcePath||c.image?.src||'').slice(0,200),filter:c.style?.filter,gco:c.style?.globalCompositeOperation,r302:c.image?.__r302Path,static:JSON.stringify(c.image?.__storyworldStaticSource||c.image?.__storyworldStaticTint||null).slice(0,200),fill:JSON.stringify([c.style?.fillStyle,c.style?.strokeStyle]).slice(0,200),order:c.order,key:String(c.key||'').slice(0,80)};}};
 T.render=function(f){const R=O.apply(this,arguments);try{for(const c of f.commands){if(!c)continue;const o=c.owner||{};if(SKIP.has(o.kind))continue;if(o.pxfSide==='enemy'||o.side==='enemy'||o.enemy===true)continue;
   const id=String(o.id||'').replace(/\d+/g,'#').slice(0,48);const raw=String(c.sourcePath||c.image?.src||'').replace(/^https?:\/\/[^/]+\//,'');const sp=raw.replace(/\d+/g,'#').slice(0,96);
   const filt=String(c.style?.filter||'');const hued=/hue-rotate|grayscale/.test(filt);
   if(c.kind==='image'){
    if(/lauren/i.test(raw.replace(/:hero:lauren$|hero:lauren/g,''))&&!/^r11\d\d:/.test(raw))add('PATH|'+o.kind+'|'+id+'|'+sp+(hued?'|filter':''),c);
    else if(!c.r1113tint&&!c.r1113&&!hued){const v=pix(c);if(v!=null&&v>.25)add('VIOLETPX|'+o.kind+'|'+id+'|'+sp+'|'+v.toFixed(2),c);}
   }else if(c.kind==='fill'||c.kind==='stroke'){const s=c.style||{};const str=JSON.stringify([s.fillStyle,s.strokeStyle]);let bad=null;String(str).replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.eE+-]+))?/g,(m,r,gg,bb,a)=>{if(violet(+r,+gg,+bb)&&(a==null||+a>.04))bad=r+','+gg+','+bb;});if(bad)add('VEC|'+o.kind+'|'+id+'|'+bad,c);}
   else if(c.kind==='text'){const t=String(c.text||'');if(/라우렌|lauren|잔향 결계|거짓 분리|심문자의 전이|진명 심판/i.test(t))add('TEXT|'+t.slice(0,40));}
 }}catch(e){}return R;};});
// 적을 근처로(맞고 맞기)
await p.evaluate(()=>{const live=room.enemies.filter(e=>e.hp>0);live.forEach((e,i)=>{e.maxHp=e.hp=1e9;if(i<4){e.x=player.x+1.5+i*.4;e.y=player.y+(i-1.5)*.6;}});});
await p.waitForTimeout(1500);
const out={};const grab=async()=>p.evaluate(()=>{const r=[...window.__leaks].map(([k,v])=>k+' x'+v).sort();window.__leaks.clear();return r;});
await grab();
const act=async(name,fn,wait=2500)=>{await fn();await p.waitForTimeout(wait);out[name]=await grab();await p.screenshot({path:OUT+'/s-'+name+'.jpg',quality:60});};
for(const key of ['KeyA','KeyS','KeyD','KeyW','KeyQ','KeyE','KeyR','KeyF','Space','ShiftLeft']){await act(key,async()=>{await p.keyboard.down(key);await p.waitForTimeout(160);await p.keyboard.up(key);},3000);}
for(const d of ['ArrowRight','ArrowUp']){await act(d,async()=>{await p.keyboard.down(d);await p.waitForTimeout(1200);await p.keyboard.up(d);},300);}
// 피격
await act('hit',async()=>{await p.evaluate(()=>{for(let i=0;i<5;i++){try{damagePlayer?.(5,{x:player.x+1,y:player.y});}catch(_){}}});},1500);
out.dom=await p.evaluate(()=>{const bad=[];for(const e of document.querySelectorAll('body *')){if(e.children.length&&e.tagName!=='IMG')continue;const t=(e.textContent||'')+' '+(e.title||'')+' '+(e.getAttribute('src')||'')+' '+(e.getAttribute('alt')||'')+' '+(getComputedStyle(e).backgroundImage||'');if(/라우렌|lauren|잔향 결계|거짓 분리|심문자의 전이|진명 심판|잔향의 마법사/i.test(t)&&!e.closest("[data-hero]")){const r=e.getBoundingClientRect();if(r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none')bad.push({tag:e.tagName,id:e.id,cls:String(e.className).slice(0,30),t:t.trim().replace(/data:[^ ]{40,}/g,'data:…').slice(0,120)});}}return bad;});
// 쓰러짐
await act('death',async()=>{await p.evaluate(()=>{player.hp=0;try{showDeath?.();}catch(_){}});},2500);
out.inspect=await p.evaluate(A=>window[A].inspect(),A);out.samples=await p.evaluate(()=>window.__samples);
fs.writeFileSync(OUT+'/audit.json',JSON.stringify(out,null,1));console.log(JSON.stringify(out,null,1).slice(0,6000));await b.close();
