// R1143 브라우저 검사(헤드리스 소프트웨어 렌더링 — 그래픽 검증 아님). 실행: node persona-celestial-browser.mjs <출력 폴더>
import {chromium,boot,go} from '../r444/lib.mjs';
const OUT=process.argv[2]||'.';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
const A='__STORYWORLD_PERSONA_HERO_R1113__';
await p.evaluate(async A=>{await ensureImages(heroPaths('lauren'));player.hero='lauren';window[A].setForm(true);},A);
await go(p,'murder01');await p.waitForTimeout(2000);
await p.evaluate(()=>{player.maxHp=player.hp=99999;const T=__STORYWORLD_PHASE1__.controller.state.three,O=T.render;window.__cel=[];
 T.render=function(f){const R=O.apply(this,arguments);try{for(const c of f.commands){const id=String(c?.owner?.id||'');if(!/^r946:/.test(id))continue;const k=id.split(':')[1];
   if(c.kind==='image')window.__cel.push({k,id,img:String(c.sourcePath||'').replace(/^https?:\/\/[^/]+\//,'').slice(0,80),f:c.style?.filter||'none'});else if(c.kind==='fill'||c.kind==='stroke')window.__cel.push({k,id,col:String(typeof c.style?.fillStyle==='string'?c.style.fillStyle:'')+'|'+String(typeof c.style?.strokeStyle==='string'?c.style.strokeStyle:'')});}}catch(e){}return R;};});
const waitT=async dt=>{const t0=await p.evaluate(()=>time);for(let i=0;i<600;i++){if(await p.evaluate(t0=>time-t0,t0)>=dt)return;await p.waitForTimeout(50);}};
const calm=()=>p.evaluate(()=>{const live=room.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));
 live.forEach((e,i)=>{e.maxHp=e.hp=1e9;e.cd=1e6;e.attack=null;e.speed=0;if(i<4){e.x=player.x+2.6+.6*(i%2);e.y=player.y-1+.7*i;}else{e.x=player.x+30;e.y=player.y+30;}});return live.length;});
async function run(tag,kinds){const out={};for(const [k,dt] of kinds){await calm();await p.evaluate(k=>{window.__cel.length=0;const Z=window.__STORYWORLD_LAUREN_CELESTIAL_R946__;Z.qaReset();Z.qaForce(k);const e=room.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];hitEnemy(e,1,{kind:'basic',sourceHero:'lauren'});},k);
  await waitT(dt);await p.screenshot({path:`${OUT}/${tag}-${k}.png`,clip:{x:230,y:90,width:520,height:330}});await waitT(1.6);out[k]=await p.evaluate(()=>window.__cel.slice());await waitT(1.2);}return out;}
const KINDS=[['repulse',.3],['red',.4],['blue',.9],['violet',.72],['meteor',.85]];
const P=await run('persona',KINDS);
const imgs=(k,rx)=>P[k].filter(c=>c.img&&rx.test(c.img)),sheet=k=>P[k].filter(c=>c.img&&/r946/.test(c.img));
const tone=(k,t)=>{const s=sheet(k),good=s.filter(c=>new RegExp('^r1140:'+t+':').test(c.img));return {n:s.length,good:good.length,bad:s.filter(c=>!good.includes(c)).slice(0,2)};};
for(const [k,t] of [['red','eonju'],['blue','black'],['violet','darkred'],['meteor','darkred']]){const r=tone(k,t);ok(r.n>0&&r.good/r.n>=.9,`ⓐ ${k} 시트 그림 → ${t} 굽기 (${r.good}/${r.n}${r.bad.length?' 예외 '+JSON.stringify(r.bad):''})`);}
const rgb=s=>[...String(s).matchAll(/rgba?\((\d+),(\d+),(\d+)/g)].map(m=>m.slice(1,4).map(Number));
{const cols=P.repulse.filter(c=>c.col).flatMap(c=>rgb(c.col));ok(cols.length>0&&cols.every(c=>c[0]>=c[2]),'ⓑ 항성 반발 선·고리 색 = 언주 계열 ('+cols.length+'개, 예 '+cols[0]+')');}
{const cols=P.meteor.filter(c=>c.col&&/boom/.test(c.id)).flatMap(c=>rgb(c.col));ok(cols.length>0&&cols.every(c=>c[0]>=c[1]&&c[0]>=c[2]&&c[0]<=210),'ⓑ 유성 궤도 폭발 고리 색 = 검빨 ('+cols.length+'개, 예 '+cols[0]+')');}
{const props=P.meteor.filter(c=>c.img&&!/r946/.test(c.img));ok(props.every(c=>!/^r1140:/.test(c.img)&&c.f==='none'),'ⓒ 던지는 조형물 그림은 물들이지 않음 ('+props.length+'개'+(props[0]?' 예 '+props[0].img:'')+')');}
const st=await p.evaluate(A=>{const i=window[A].inspect();return {cel:i.stats.celTints||0,baked:i.stats.baked,px:i.stats.bakedPx,last:i.lastError||null,r946:window.__STORYWORLD_LAUREN_CELESTIAL_R946__.inspect().stats.errors};},A);
ok(st.cel>0&&!st.last&&st.r946===0,'ⓓ 색 얹기 횟수 '+st.cel+', 오류 없음 (굽기 '+st.baked+'장 '+Math.round(st.px/1e6*10)/10+'M 화소)');
// P 창 이름
await p.keyboard.press('KeyP');await p.waitForTimeout(1200);await p.screenshot({path:`${OUT}/persona-panel.png`});
const pp=await p.evaluate(()=>{const t=document.getElementById('panel')?.innerText||'';const L=t.split('\n').filter(l=>/천체 공명|항성 반발|은빛 거성|심연 왜성|쌍성 소멸|유성 궤도/.test(l));return {open:!!modal,lines:L.slice(0,6),bare:L.filter(l=>/(?<!\(진\) )(천체 공명|항성 반발|은빛 거성|심연 왜성|쌍성 소멸|유성 궤도)/.test(l)).length,dbl:L.filter(l=>/\(진\) \(진\)/.test(l)).length};});
ok(pp.open&&pp.lines.length>0&&pp.bare===0&&pp.dbl===0,'ⓔ P 창: 천체 공명 이름에 (진) 한 번씩 ('+JSON.stringify(pp.lines.map(l=>l.slice(0,40)))+', 안 붙음 '+pp.bare+', 겹침 '+pp.dbl+')');
await p.keyboard.press('Escape');await p.waitForTimeout(600);await p.evaluate(()=>{try{if(modal)closePanel(true);}catch(e){}});
// 라우렌 본인
await p.evaluate(A=>{window[A].setForm(false);},A);await p.waitForTimeout(500);
const L=await run('lauren',[['blue',.9],['violet',.72]]);
{const s=[...L.blue,...L.violet].filter(c=>c.img&&/r946/.test(c.img));ok(s.length>0&&s.every(c=>/^m0\/assets\/r946\//.test(c.img)&&c.f==='none'),'ⓕ 라우렌 본인은 원래 그림 그대로 ('+s.length+'개'+(s[0]?' 예 '+s[0].img:'')+')');}
await p.keyboard.press('KeyP');await p.waitForTimeout(1000);const lp=await p.evaluate(()=>{const t=document.getElementById('panel')?.innerText||'';return {has:/천체 공명/.test(t),jin:/\(진\)/.test(t)};});ok(!lp.jin,'ⓕ 라우렌 P 창에는 (진) 없음 ('+JSON.stringify(lp)+')');
ok(errs.length===0,'ⓖ 페이지 오류 0 ('+errs.slice(0,2).join(' | ')+')');
console.log(fails?('FAILED '+fails):'ALL PASS (헤드리스)');await b.close();process.exit(fails?1:0);
