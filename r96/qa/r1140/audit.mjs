// R1140 페르소나 영웅 전수 조사(헤드리스): 행동별로 그려진 그림 명령·DOM 을 모아 라우렌/보라 잔재를 찾는다
import {chromium,boot,go,skip} from '../r444/lib.mjs';
import fs from 'node:fs';
const OUT=process.argv[2]||'.';const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
const A='__STORYWORLD_PERSONA_HERO_R1113__';
await p.evaluate(async A=>{await ensureImages(heroPaths('lauren'));player.hero='lauren';window[A].unlock('silent');window[A].setForm(true);},A);
const zone=process.env.ZONE;if(zone)await go(p,zone);
await p.evaluate(()=>{const A=window.__STORYWORLD_PROGRESSION_R62__,st=A.state(player);for(const s of 'QWER')st.ranks['skill'+s+'R663']=1;player.maxHp=player.hp=99999;});
await p.evaluate(()=>{const T=__STORYWORLD_PHASE1__.controller.state.three;const O=T.render;window.__seen=new Map();
 const col=s=>{const out=[];String(s||'').replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g,(m,r,g,b)=>{r=+r;g=+g;b=+b;if(b>r&&b>g&&b-Math.min(r,g)>=30)out.push(r+','+g+','+b);});return out.join('/');};
 T.render=function(f){const R=O.apply(this,arguments);try{for(const c of f.commands){if(!c)continue;const o=c.owner||{};if(o.kind==='enemy'||o.kind==='tile'||o.kind==='prop'||o.kind==='floor'||o.kind==='wall')continue;
  let k;if(c.kind==='image'){const sp=String(c.sourcePath||'').replace(/\d+/g,'#').slice(0,90);k='I|'+(o.kind||'?')+'|'+String(o.id||'').replace(/\d+/g,'#').slice(0,40)+'|'+sp+'|'+(c.r1113?'R':'')+(c.r1113tint?'T':'');}
  else if(c.kind==='fill'||c.kind==='stroke'){const s=c.style||{};const v=col(typeof s.fillStyle==='string'?s.fillStyle:JSON.stringify(s.fillStyle||''))+col(typeof s.strokeStyle==='string'?s.strokeStyle:JSON.stringify(s.strokeStyle||''));if(!v)continue;k='V|'+(o.kind||'?')+'|'+String(o.id||'').replace(/\d+/g,'#').slice(0,40)+'|violet '+v;}
  else continue;window.__seen.set(k,(window.__seen.get(k)||0)+1);}}catch(e){}return R;};});
await p.waitForTimeout(2000);
const out={};const shot=async n=>{const g=await p.evaluate(()=>{const q=project(player.x,player.y),c=document.querySelector('canvas').getBoundingClientRect();return [q.x,q.y,c.width,c.height,typeof W!=='undefined'?W:0,typeof H!=='undefined'?H:0];});await p.screenshot({path:OUT+'/a-'+n+'.png'});shots[n]=g;};const shots={};out.shots=shots;
const grab=async()=>p.evaluate(()=>[...window.__seen].map(([k,v])=>k+' x'+v).sort());
out.idle=await grab();await shot('idle');
for(const key of ['KeyA','KeyS','KeyD','KeyW','KeyQ','KeyE','KeyR','KeyF','Space','ShiftLeft']){await p.evaluate(()=>window.__seen.clear());await p.keyboard.down(key);await p.waitForTimeout(150);await p.keyboard.up(key);await p.waitForTimeout(250);await shot(key+'-1');await p.waitForTimeout(400);await shot(key+'-2');await p.waitForTimeout(500);await shot(key+'-3');await p.waitForTimeout(1500);out[key]=await grab();
 out[key+'_state']=await p.evaluate(()=>({hp:player.hp,ult:player.ultimateAnim,ego:player.egoActive??player.ego,hero:player.hero}));}
for(const d of ['ArrowRight','ArrowLeft','ArrowUp','ArrowDown']){await p.evaluate(()=>window.__seen.clear());await p.keyboard.down(d);await p.waitForTimeout(1500);await shot(d);await p.keyboard.up(d);out[d]=await grab();}
out.inspect=await p.evaluate(A=>window[A].inspect(),A);
out.dom=await p.evaluate(()=>{const q=s=>[...document.querySelectorAll(s)].map(e=>({id:e.id,cls:String(e.className).slice(0,40),txt:(e.textContent||'').trim().slice(0,60),src:(e.getAttribute&&e.getAttribute('src')||'').slice(0,80),title:e.title||''}));
 const bad=[];for(const e of document.querySelectorAll('body *')){if(e.children.length)continue;const t=(e.textContent||'')+' '+(e.title||'')+' '+(e.getAttribute('aria-label')||'')+' '+(e.getAttribute('src')||'')+' '+(e.getAttribute('alt')||'');if(/라우렌|lauren/i.test(t)&&!/data:/.test(t.slice(0,5))){const r=e.getBoundingClientRect();bad.push({tag:e.tagName,id:e.id,cls:String(e.className).slice(0,30),t:t.trim().slice(0,110),vis:r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'});}}
 return {bad,portrait:q('#portrait'),heroName:q('#heroName')};});
fs.writeFileSync(OUT+'/audit.json',JSON.stringify(out,null,1));console.log('done');await b.close();
