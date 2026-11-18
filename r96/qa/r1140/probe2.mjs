import {chromium,boot,go,skip} from '../r444/lib.mjs';
import fs from 'node:fs';
const OUT=process.argv[2]||'.';const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
const A='__STORYWORLD_PERSONA_HERO_R1113__';const out={};
// 1) 영웅 선택창
out.before=await p.evaluate(A=>({ins:window[A].inspect(),ls:localStorage.getItem('storyworld.r1113.personaHero')}),A);
await p.evaluate(async A=>{await ensureImages(heroPaths('lauren'));player.hero='lauren';window[A].unlock('silent');window[A].setForm(true);},A);
await go(p,'murder01');
await p.evaluate(()=>{const A=window.__STORYWORLD_PROGRESSION_R62__,st=A.state(player);for(const s of 'QWER')st.ranks['skill'+s+'R663']=1;player.maxHp=player.hp=99999;});
await p.evaluate(()=>{const T=__STORYWORLD_PHASE1__.controller.state.three;const O=T.render;window.__det=[];window.__cap=false;
 T.render=function(f){const R=O.apply(this,arguments);try{if(window.__cap)for(const c of f.commands){if(!c||c.kind!=='image')continue;const o=c.owner||{};const id=String(o.id||''),sp=String(c.sourcePath||'');
  if(!( /^r102:/.test(id)&&!sp || (/^fx:/.test(id)) || /pvfx|explosion|guard|blink|barrier/.test(id+sp)))continue;const P=c.points||[];const w=P.length===4?Math.round(Math.hypot(P[1][0]-P[0][0],P[1][1]-P[0][1])):0,h=P.length===4?Math.round(Math.hypot(P[3][0]-P[0][0],P[3][1]-P[0][1])):0;
  const k=id.replace(/\d+/g,'#')+'|'+sp.replace(/^http:\/\/[^/]+\/m0\//,'').slice(0,60)+'|'+w+'x'+h+'|sr'+JSON.stringify(c.sourceRect)+'|is'+JSON.stringify(c.imageSize)+'|'+JSON.stringify(c.style||{}).slice(0,140)+'|tint:'+JSON.stringify(c.immutableTint||c.image?.__storyworldStaticTint||null).slice(0,80)+(c.r1113tint?'|T':'');
  if(window.__det.length<400&&!window.__det.includes(k))window.__det.push(k);}}catch(e){}return R;};});
for(const key of ['KeyQ','KeyS','KeyD','KeyF']){await p.evaluate(()=>{window.__det=[];window.__cap=true;});await p.keyboard.down(key);await p.waitForTimeout(150);await p.keyboard.up(key);await p.waitForTimeout(2500);out[key]=await p.evaluate(()=>{window.__cap=false;return window.__det;});}
// HUD dock
out.dock=await p.evaluate(()=>[...document.querySelectorAll('#story-wer-controls .skill,#specialBtn,#attackBtn,#blinkBtn,#guardBtn,#egoBtn,footer .hotbar button')].map(b=>({id:b.id,title:b.title,aria:b.getAttribute('aria-label'),src:(b.querySelector('img')?.getAttribute('src')||'').slice(0,60),txt:(b.textContent||'').trim().slice(0,40)})));
// P 창
await p.keyboard.press('KeyP');await p.waitForTimeout(1200);await p.screenshot({path:OUT+'/p-panel.png'});
out.panelP=await p.evaluate(()=>{const t=document.getElementById('panel')?.innerText||'';return t.split('\n').filter(l=>/라우렌|잔향|거짓 분리|심문자|진명|결계|마력/.test(l)).slice(0,30);});
await p.evaluate(()=>{if(modal)closePanel(true);});
// 영웅 창
await p.evaluate(()=>{try{showHeroes();}catch(e){window.__e=String(e);}});await p.waitForTimeout(1500);await p.screenshot({path:OUT+'/heroes.png'});
out.heroes=await p.evaluate(()=>({cards:[...document.querySelectorAll('#panel [data-hero],#panel [data-persona-r1113],#panel [data-ego-r1046]')].map(c=>(c.dataset.hero||(c.dataset.personaR1113?'PERSONA':'EGO'))+(c.classList.contains('selected')?'*':'')+(c.classList.contains('r1113under')?'u':'')),stage:document.getElementById('r263Stage')?.innerText?.slice(0,300),err:window.__e||null}));
await p.evaluate(()=>{document.querySelector('#panel [data-persona-r1113]')?.click();});await p.waitForTimeout(1200);await p.screenshot({path:OUT+'/heroes2.png'});
out.heroes2=await p.evaluate(()=>({stage:document.getElementById('r263Stage')?.innerText?.slice(0,600),imgs:[...document.querySelectorAll('#r263Stage img')].map(i=>i.getAttribute('src').slice(0,70)),panelLauren:(document.getElementById('panel')?.innerText||'').split('\n').filter(l=>/라우렌|잔향|거짓 분리|심문자|진명|마력/.test(l)).slice(0,20)}));
await p.evaluate(()=>{if(modal)closePanel(true);});
// 피격·쓰러짐
await p.evaluate(()=>{player.maxHp=player.hp=50;try{damagePlayer?.(10,{kind:'test'});}catch(e){window.__e2=String(e);}});await p.waitForTimeout(300);await p.screenshot({path:OUT+'/hit.png'});
await p.evaluate(()=>{player.hp=0;try{damagePlayer?.(999,{kind:'test'});}catch(e){}});
for(let i=0;i<5;i++){await p.waitForTimeout(500);await p.screenshot({path:OUT+'/death'+i+'.png'});}
out.death=await p.evaluate(()=>({hp:player.hp,e2:window.__e2||null,d:window.__STORYWORLD_DEATH_R151__?.inspect?.()||null,modal:!!modal,panel:(document.getElementById('panel')?.innerText||'').slice(0,200)}));
out.inspect=await p.evaluate(A=>window[A].inspect(),A);
fs.writeFileSync(OUT+'/probe2.json',JSON.stringify(out,null,1));console.log('done');await b.close();
