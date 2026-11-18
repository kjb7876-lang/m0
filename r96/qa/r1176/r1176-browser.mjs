// R1176 헤드리스 확인: 히든 영웅 EGO '2D EGO'·'3D EGO' 두 모습 — 영웅창 두 칸·전환·저장, 3D 모습 몸 일관, 공격 잔상·분신 궤적 겹침 0, 이펙트 두 모습 동일
//  (헤드리스 소프트웨어 렌더링 — GPU·실기기·자연 플레이 확인 아님). 실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1176/r1176-browser.mjs [스크린샷 폴더]
import {createRequire} from 'node:module';import fs from 'node:fs';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',SH=process.argv[2]||'';if(SH)fs.mkdirSync(SH,{recursive:true});
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,500):''));};
const W=960,H=540;
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:1});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:300000});await p.locator('.heroRowR101 button[data-hero="hwando"]').waitFor({timeout:30000});await p.waitForTimeout(800);
const API=()=>p.evaluate(()=>!!window.__STORYWORLD_EGO_FORM_R1176__);
ok(await API(),'R1176 모듈 실림');
if(!(await API())){await b.close();console.log(`\nR1176 browser: ${n-bad}/${n} 통과`);process.exit(1);}
ok(await p.evaluate(()=>document.querySelectorAll('#panel [data-r1176]').length)===0,'해금 전: EGO 칸 없음(두 칸도 없음)');
await p.evaluate(()=>{const E=window.__STORYWORLD_EGO_SOVEREIGN_R1046__;E.unlock?.('qa');E.refresh?.();});await p.waitForTimeout(900);
const cells=await p.evaluate(()=>[...document.querySelectorAll('#panel .heroRowR101 [data-r1176]')].map(c=>({look:c.dataset.r1176,text:c.textContent.replace(/HIDDEN/,'').trim(),ego:c.hasAttribute('data-ego-r1046'),w:c.getBoundingClientRect().width|0})));
ok(cells.length===2&&cells[0].look==='2d'&&cells[1].look==='3d'&&cells[0].text==='2D EGO'&&cells[1].text==='3D EGO','영웅 선택창: 2D EGO · 3D EGO 두 칸이 나란히',cells);
ok(cells.length===2&&cells[0].ego&&!cells[1].ego&&cells[0].w>20&&cells[1].w>20,'원래 EGO 칸 하나 + 모습 칸 하나(선택 처리는 한 영웅)',cells);
if(SH)await p.screenshot({path:SH+'/select.png'});
await p.locator('#panel .heroRowR101 [data-r1176="3d"]').click();await p.waitForTimeout(400);
let st=await p.evaluate(()=>({look:__STORYWORLD_EGO_FORM_R1176__.look(),saved:localStorage.getItem('storyworld.r1176.egoLook'),sel:!!document.querySelector('#panel [data-ego-r1046].selected'),on3:document.querySelector('#panel .heroRowR101 [data-r1176="3d"]').classList.contains('r1176on'),on2:document.querySelector('#panel .heroRowR101 [data-r1176="2d"]').classList.contains('r1176on')}));
ok(st.look==='3d'&&st.saved==='3d'&&st.sel&&st.on3&&!st.on2,'3D EGO 칸 누름 → EGO 선택 + 모습 3d 저장 + 3D 칸만 켜짐 표시',st);
await p.locator('#panel .heroRowR101 [data-r1176="2d"]').click();await p.waitForTimeout(400);
st=await p.evaluate(()=>({look:__STORYWORLD_EGO_FORM_R1176__.look(),sel:!!document.querySelector('#panel [data-ego-r1046].selected'),on2:document.querySelector('#panel .heroRowR101 [data-r1176="2d"]').classList.contains('r1176on')}));
ok(st.look==='2d'&&st.sel&&st.on2,'2D EGO 칸 누름 → 같은 EGO 선택 + 모습 2d',st);
await p.locator('#panel .heroRowR101 button[data-hero="lauren"]').click();await p.waitForTimeout(300);
ok(await p.evaluate(()=>!document.querySelector('#panel [data-r1176].r1176on')&&__STORYWORLD_EGO_FORM_R1176__.look()==='2d'),'다른 영웅을 고르면 두 칸 모두 선택 표시 꺼짐(모습 값은 그대로)');
await p.locator('#panel .heroRowR101 [data-r1176="3d"]').click();await p.waitForTimeout(300);
await p.locator('#slotConfirmR73').click();await p.waitForFunction(()=>started&&!loading,null,{timeout:300000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
const waitG=s=>p.evaluate(async s=>{const t0=time;for(let i=0;i<4000&&time-t0<s;i++)await new Promise(r=>setTimeout(r,15));},s);
const reset=()=>p.evaluate(()=>{for(const k in player)if(/CD$/.test(k))player[k]=0;player.resonance=100;player.invincible=1e6;});
/* R1046 은 시작 뒤 주기 점검에서 형상을 켠다 — 그 한 박자를 기다린다(최대 8초) */await p.waitForFunction(()=>window.__STORYWORLD_EGO_SOVEREIGN_R1046__.formActive(),null,{timeout:8000}).catch(()=>{});
ok(await p.evaluate(()=>window.__STORYWORLD_EGO_SOVEREIGN_R1046__.formActive()),'3D EGO 칸으로 시작 → EGO 형상(같은 영웅)');
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
await p.evaluate(()=>{enterRegion('dist02',null,{restore:true});});await p.waitForFunction(()=>!loading&&zone==='dist02',null,{timeout:200000});await skip();await waitG(1.5);
// 렌더러가 실제로 받은 명령을 render 뒤에 기록
await p.evaluate(()=>{window.__q={on:false,rows:[]};const tag=()=>{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(!r||r.__q1176)return;r.__q1176=true;const base=r.render;
 r.render=function(f){const out=base.apply(this,arguments);try{if(__q.on){const row={body:[],ghost:0,trail:0,slashOld:0,halo:0,impact:0,fx:{}};for(const c of f?.commands||[]){if(!c||c.kind!=='image')continue;const sp=String(c.sourcePath||''),a=+(c.style?.globalAlpha??1),k=String(c.key||'');if(!(a>0))continue;
   if(/:r1048g\d+/.test(k))row.ghost++;
   /* 본체 몸: 분신(R945 삼협묵희) 몫은 뺀다. 수묵 굽기 = r1099:ink:… / ego-ink, Dots 가로 베기 = r1139 slash, 3D 렌더 = r1048/ego(R409 테 두른 열쇠 포함) */
   if(c.owner?.kind==='hero'&&!c.owner?.r1048fx&&!c.owner?.r945Clone&&/r1048\/ego\/|ego-ink\/|^r1099:ink:|r1139\/ego\/slash-|r1176\/ego2d\//.test(sp))row.body.push(/r1139\/ego\/slash-|r1176\/ego2d\//.test(sp)?'dots':/ego-ink\/|^r1099:ink:/.test(sp)?'ink':'3d');
   if(/r1139\/ego\/(trail-horizontal|impact)/.test(sp)&&Array.isArray(c.points)){const kk=/trail/.test(sp)?'trail':'impact',wpx=Math.round(Math.abs(c.points[1][0]-c.points[0][0]));(row.size=row.size||{})[kk]=[wpx,+a.toFixed(2),String(c.style?.globalCompositeOperation||'')].join('/');}
   if(/r1139\/ego\/trail-horizontal/.test(sp))row.trail++;if(/r1048\/fx\/ego_slash/.test(sp))row.slashOld++;if(/r1048\/fx\/ego_halo/.test(sp))row.halo++;if(/r1139\/ego\/impact/.test(sp))row.impact++;
   const m=/(r1139\/ego\/(?:trail-horizontal|impact|shield)|r1048\/fx\/ego_[a-z]+|persona-skills\/[a-z-]+|r1119:fx:[a-z-]+)/.exec(sp);if(m&&!/halo/.test(m[1]))row.fx[m[1]]=1;}
  __q.rows.push(row);}}catch(e){__q.err=String(e);}return out;};};tag();setInterval(tag,50);});
const pull=()=>p.evaluate(()=>{const es=room.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));es.slice(0,3).forEach((e,i)=>{e.x=player.x+1.3+i*.5;e.y=player.y+(i-1)*.7;e.hp=e.maxHp=Math.max(e.maxHp||1,1e7);e.speed=0;});});
async function round(look,shot){await p.evaluate(l=>{__STORYWORLD_EGO_FORM_R1176__.set(l);},look);await waitG(.6);await pull();await reset();
 await p.evaluate(()=>{__q.rows=[];__q.on=true;});await waitG(.5);/* 대기 */
 if(SH&&shot){const q=await p.evaluate(()=>project(player.x,player.y));await p.screenshot({path:SH+'/'+shot+'-idle.png',clip:{x:Math.max(0,Math.min(W-360,q.x-180)),y:Math.max(0,Math.min(H-300,q.y-210)),width:360,height:300}});}
 const idleN=await p.evaluate(()=>__q.rows.length);
 await p.keyboard.down('KeyA');await waitG(1.6);
 if(SH&&shot){const q=await p.evaluate(()=>project(player.x,player.y));await p.screenshot({path:SH+'/'+shot+'-attack.png',clip:{x:Math.max(0,Math.min(W-360,q.x-180)),y:Math.max(0,Math.min(H-300,q.y-210)),width:360,height:300}});}
 await waitG(1.2);await p.keyboard.up('KeyA');await waitG(.4);await reset();await p.keyboard.press('KeyQ');await waitG(.7);
 return p.evaluate(idleN=>{__q.on=false;const R=__q.rows,idle=R.slice(0,idleN),atk=R.slice(idleN);const kinds=rows=>{const s={};for(const r of rows)for(const b of r.body)s[b]=(s[b]||0)+1;return s;};const fx={};for(const r of R)Object.assign(fx,r.fx);
  return{frames:R.length,idleKinds:kinds(idle),atkKinds:kinds(atk),ghost:R.reduce((a,r)=>a+r.ghost,0),maxTrail:Math.max(0,...R.map(r=>r.trail+r.slashOld)),trailFrames:R.filter(r=>r.trail>0).length,slashOld:R.reduce((a,r)=>a+r.slashOld,0),maxHalo:Math.max(0,...R.map(r=>r.halo)),impact:R.filter(r=>r.impact>0).length,maxBody:Math.max(0,...R.map(r=>r.body.length)),noBody:R.filter(r=>!r.body.length).length,fx:Object.keys(fx).sort(),sizes:(()=>{const s={};for(const r of R)for(const k in r.size||{})s[k+':'+r.size[k]]=1;return Object.keys(s).sort();})(),err:__q.err};},idleN);}
const r3=await round('3d','3d');await waitG(1.2);const r2=await round('2d','2d');
console.log('3d',JSON.stringify(r3));console.log('2d',JSON.stringify(r2));
ok(r3.frames>20&&r2.frames>20&&!r3.err&&!r2.err,'기록된 프레임 충분',[r3.frames,r2.frames]);
ok(Object.keys(r3.idleKinds).join()==='3d'&&Object.keys(r3.atkKinds).join()==='3d','3D EGO: 대기·공격·스킬 몸이 전부 3D 렌더 시트(수묵·Dots 인물 섞임 0)',[r3.idleKinds,r3.atkKinds]);
ok(!r2.idleKinds['3d']&&!r2.idleKinds.ink&&r2.idleKinds.dots>0&&!r2.atkKinds['3d']&&!r2.atkKinds.ink&&r2.atkKinds.dots>0,'2D EGO: 대기·기본 공격 몸이 모두 Dots 붓 그림 한 인물(수묵 굽기 몸·3D 몸 0)',[r2.idleKinds,r2.atkKinds]);
ok(r3.ghost===0&&r2.ghost===0,'두 모습: 공격 잔상 몸 0',[r3.ghost,r2.ghost]);
ok(r3.maxTrail<=1&&r2.maxTrail<=1,'두 모습: 한 화면 검 궤적 1장 이하(분신 몫 겹침 0)',[r3.maxTrail,r2.maxTrail]);
ok(r3.maxHalo<=1&&r2.maxHalo<=1,'두 모습: 광륜 1장 이하',[r3.maxHalo,r2.maxHalo]);
ok(r3.trailFrames>0&&r2.trailFrames>0&&r3.slashOld===0&&r2.slashOld===0,'두 모습: 기본 공격 궤적은 같은 가로 붓 궤적 시트',[r3.trailFrames,r2.trailFrames,r3.slashOld,r2.slashOld]);
ok(r3.impact>0&&r2.impact>0,'두 모습: 적중 먹 튐이 나옴',[r3.impact,r2.impact]);
// 확률 패시브·Q 순환 협주탄은 판마다 나오는 종류가 달라(무작위) 목록 전체가 아니라 ① 늘 나오는 기본 공격 궤적·적중 ② 두 모습에 함께 나온 이펙트로 견준다
{const det=l=>l.filter(k=>/r1139\/ego\//.test(k));ok(JSON.stringify(det(r3.fx))===JSON.stringify(det(r2.fx))&&det(r3.fx).length>=2,'기본 공격 궤적·적중 이펙트 그림이 두 모습에서 같다',{d3:det(r3.fx),d2:det(r2.fx)});
 ok(JSON.stringify(r3.sizes)===JSON.stringify(r2.sizes)&&r3.sizes.length>=2,'궤적·적중 이펙트의 화면 크기·알파·합성 방식이 두 모습에서 같다',{d3:r3.sizes,d2:r2.sizes});
 ok(r3.fx.some(k=>/r1119:fx:|persona-skills/.test(k))&&r2.fx.some(k=>/r1119:fx:|persona-skills/.test(k))&&!r3.fx.some(k=>/r1048\/fx\/ego_slash/.test(k)),'스킬 협주탄 이펙트가 두 모습 모두 나오고 옛 궤적은 어느 쪽에도 없음',{d3:r3.fx,d2:r2.fx});}
ok(r3.noBody===0&&r2.noBody===0,'투명 영웅 없음(몸 없는 프레임 0)',[r3.noBody,r2.noBody]);
ok(r3.maxBody<=2&&r2.maxBody<=2,'본체 겹침: 한 프레임 몸 그림 최대 2장(본체+섞는 칸)',[r3.maxBody,r2.maxBody]);
// 판정·수치는 한 영웅: 모습을 바꿔도 형상·영웅·체력·대기 값이 그대로
const same=await p.evaluate(()=>{const snap=()=>JSON.stringify([player.hero,player.egoSovereignR1046,maxHP(),attackPower(),Object.keys(player.progressionR62?.ranks||{}).length]);const a=snap();__STORYWORLD_EGO_FORM_R1176__.set('3d');const b=snap();__STORYWORLD_EGO_FORM_R1176__.set('2d');return a===b&&a===snap();});
ok(same,'모습 전환은 영웅·형상·최대 체력·공격력·강화 기록을 바꾸지 않음');
// 게임 도중 전환: 설정 창 '전투 화면' 구역의 모습 단추(모든 모드)
await p.evaluate(()=>{__STORYWORLD_EGO_FORM_R1176__.set('2d');showSettings();});await p.waitForTimeout(900);
const hasSet=await p.evaluate(()=>!!document.querySelector('#r1176Set [data-r1176look="3d"]'));ok(hasSet,'설정 창: EGO 모습 단추 줄');
if(hasSet){await p.locator('#r1176Set [data-r1176look="3d"]').click();await p.waitForTimeout(400);
 ok(await p.evaluate(()=>__STORYWORLD_EGO_FORM_R1176__.look()==='3d'&&document.querySelector('#r1176Set [data-r1176look="3d"]').classList.contains('on')&&!document.querySelector('#r1176Set [data-r1176look="2d"]').classList.contains('on')),'설정 창 단추로 3D 전환(창은 그대로, 켜진 단추 표시)');
 await p.locator('#r1176Set [data-r1176look="2d"]').click();await p.waitForTimeout(400);ok(await p.evaluate(()=>__STORYWORLD_EGO_FORM_R1176__.look()==='2d'),'다시 2D 로(계속 오감)');
 const box=await p.evaluate(()=>{const r=document.querySelector('#r1176Set [data-r1176look="3d"]').getBoundingClientRect();return[r.width|0,r.height|0];});ok(box[0]>=80&&box[1]>=40,'단추 크기 손가락으로 누를 만함(80×40 이상)',box);if(SH)await p.screenshot({path:SH+'/settings.png'});}
await p.evaluate(()=>{if(modal)closePanel(true);});
// 저장: 새로 열어도 모습이 남음
await p.evaluate(()=>{__STORYWORLD_EGO_FORM_R1176__.set('3d');});await p.reload();await p.waitForFunction(()=>!!window.__STORYWORLD_EGO_FORM_R1176__,null,{timeout:300000});
ok(await p.evaluate(()=>__STORYWORLD_EGO_FORM_R1176__.look())==='3d','새로 열어도 모습 3d 유지(형태 선택만 저장)');
const I=await p.evaluate(()=>__STORYWORLD_EGO_FORM_R1176__.inspect());ok(I.stats.errors===0,'R1176 오류 0',I);
ok(errs.length===0,'페이지 오류 0',errs);
await b.close();console.log(`\nR1176 browser: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
