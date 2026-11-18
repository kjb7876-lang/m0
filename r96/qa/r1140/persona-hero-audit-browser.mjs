// R1140 브라우저 검사(헤드리스 소프트웨어 렌더링 — 그래픽 검증 아님). 실행: node persona-hero-audit-browser.mjs <출력 폴더>
import {chromium,boot,go} from '../r444/lib.mjs';
import fs from 'node:fs';
const OUT=process.argv[2]||'.';let fails=0;const lines=[];const ok=(c,m)=>{const l=(c?'PASS ':'FAIL ')+m;lines.push(l);console.log(l);if(!c)fails++;};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
const A='__STORYWORLD_PERSONA_HERO_R1113__';
// ⓐ 해금 경로: 순수악의 격파(room.persona.completed)
const un=await p.evaluate(A=>{const a=window[A];a.lock();const before=a.inspect().saved.on;const keep=room.persona;room.persona={completed:true};a.watch();const after=a.inspect();room.persona=keep;return {before,on:after.saved.on,reason:after.stats.unlockReason,ls:localStorage.getItem('storyworld.r1113.personaHero')};},A);
ok(un.before===false&&un.on===true&&un.reason==='persona-defeated'&&/"on":true/.test(un.ls||''),'ⓐ 순수악의 격파 → 해금·저장 ('+JSON.stringify(un)+')');
await p.evaluate(async A=>{await ensureImages(heroPaths('lauren'));player.hero='lauren';window[A].setForm(true);},A);
await go(p,'murder01');
await p.evaluate(()=>{const P=window.__STORYWORLD_PROGRESSION_R62__,st=P.state(player);for(const s of 'QWER')st.ranks['skill'+s+'R663']=1;player.maxHp=player.hp=99999;});
await p.waitForTimeout(2500);
// ⓑ W·E·R 칸: 20번 표본(깜빡임 없음)
const dock=await p.evaluate(async()=>{const bad=[];for(let i=0;i<20;i++){for(const s of ['w','e','r']){const b=document.getElementById('story-wer-'+s),im=b?.querySelector('img');if(!b||!/^data:image\/png/.test(im?.getAttribute('src')||'')||/거짓 분리|심문자의 전이|진명 심판/.test(b.title+b.getAttribute('aria-label')))bad.push(i+s+':'+(b?.title)+':'+(im?.getAttribute('src')||'').slice(0,30));}await new Promise(r=>requestAnimationFrame(()=>setTimeout(r,45)));}
 return {bad,t:['w','e','r'].map(s=>document.getElementById('story-wer-'+s).title+' | '+document.getElementById('story-wer-'+s).getAttribute('aria-label')),uniq:new Set(['w','e','r'].map(s=>document.querySelector('#story-wer-'+s+' img').getAttribute('src'))).size};});
ok(dock.bad.length===0,'ⓑ 본편 W·E·R 칸 20번 표본 모두 페르소나 아이콘·이름 (어긋남 '+dock.bad.length+': '+dock.bad.slice(0,3).join(' ')+')');
ok(dock.t.join(';')==='순수악의의 분기 | 순수악의의 분기 · W;욕망의 일식 | 욕망의 일식 · E;악의의 관통 | 악의의 관통 · R'&&dock.uniq===3,'ⓑ 제목 '+dock.t.join(' ; ')+' · 아이콘 '+dock.uniq+'종');
// ⓒ 스킬·막기·블링크: 영웅 이펙트 색
await p.evaluate(()=>{const T=__STORYWORLD_PHASE1__.controller.state.three;const O=T.render;window.__c={hue:new Map(),baked:new Map(),raw:new Map()};
 T.render=function(f){const R=O.apply(this,arguments);try{for(const c of f.commands){if(!c||c.kind!=='image')continue;const o=c.owner||{},sp=String(c.sourcePath||''),k=String(o.id||'').replace(/\d+/g,'#')+'|'+sp.replace(/\d+/g,'#').slice(0,70);
  if(/hue-rotate/.test(c.style?.filter||''))window.__c.hue.set(k,(window.__c.hue.get(k)||0)+1);else if(/^r1140:eonju:/.test(sp))window.__c.baked.set(k,(window.__c.baked.get(k)||0)+1);
  else if(/barrier\.webp|blink-afterimage|guard-(back|front)|\/fx\/lauren\/|sig-(gather|aura)-violet/.test(k))window.__c.raw.set(k,(window.__c.raw.get(k)||0)+1);}}catch(e){}return R;};});
const shot=async n=>p.screenshot({path:OUT+'/b-'+n+'.png'});
for(const [key,ms] of [['KeyA',300],['KeyS',350],['KeyD',500],['KeyQ',650],['KeyW',600],['KeyE',600],['KeyR',600],['KeyF',700]]){await p.keyboard.down(key);await p.waitForTimeout(150);await p.keyboard.up(key);await p.waitForTimeout(ms);await shot(key);await p.waitForTimeout(1600);}
// 두 번째 바퀴(구운 뒤)
await p.evaluate(()=>{window.__c.hue.clear();window.__c.baked.clear();window.__c.raw.clear();});
for(const key of ['KeyS','KeyD','KeyQ','KeyE','KeyF']){await p.keyboard.down(key);await p.waitForTimeout(150);await p.keyboard.up(key);await p.waitForTimeout(700);await shot(key+'-2');await p.waitForTimeout(1500);}
const col=await p.evaluate(A=>({hue:[...window.__c.hue],baked:[...window.__c.baked],raw:[...window.__c.raw],ins:window[A].inspect()}),A);
fs.writeFileSync(OUT+'/b-colors.json',JSON.stringify(col,null,1));
const hueN=col.hue.reduce((a,x)=>a+x[1],0),bakedN=col.baked.reduce((a,x)=>a+x[1],0);
ok(bakedN>200&&(col.ins.stats.baked||0)>=5,'ⓒ 영웅 이펙트가 구운 언주 그림으로 그려짐 (그리기 '+bakedN+'번, 구운 그림 '+col.ins.stats.baked+'장)');
ok(hueN<=bakedN*.1,'ⓒ 예전 색 돌리기로 남은 그리기는 1/10 이하 ('+hueN+' / '+bakedN+') '+col.hue.slice(0,4).map(x=>x[0].slice(0,50)+'×'+x[1]).join(' , '));
ok(col.raw.length===0,'ⓒ 방벽·막기 빛·블링크 잔광·보라 시트가 색 그대로 남지 않음 ('+col.raw.map(x=>x[0].slice(0,60)).join(' , ')+')');
ok(col.baked.some(x=>/barrier/.test(x[0])),'ⓒ 방벽이 구운 언주 그림');
ok(col.ins.stats.errors===0,'ⓒ 오버레이 오류 0 ('+col.ins.lastError+')');
// ⓓ P 창
await p.keyboard.press('KeyP');await p.waitForTimeout(900);await shot('panelP');
const pp=await p.evaluate(()=>{const t=document.getElementById('panel')?.innerText||'';return {open:!!modal,bad:t.split('\n').filter(l=>/라우렌|잔향 결계|거짓 분리|심문자의 전이|진명 심판/.test(l)).slice(0,8),good:t.split('\n').filter(l=>/내면의 소용돌이|순수악의의 분기|욕망의 일식|악의의 관통|페르소나/.test(l)).slice(0,8)};});
ok(pp.open&&pp.bad.length===0&&pp.good.length>=4,'ⓓ P 창에 라우렌 이름·기술 이름 없음 (남음 '+JSON.stringify(pp.bad)+' / 바뀜 '+pp.good.length+'줄: '+pp.good.slice(0,4).join(' , ')+')');
await p.evaluate(()=>{if(modal)closePanel(true);});
// ⓔ 영웅 선택창
await p.evaluate(()=>showHeroes());await p.waitForTimeout(1200);await p.evaluate(()=>document.querySelector('#panel [data-persona-r1113]')?.click());await p.waitForTimeout(900);await shot('heroes');
const hs=await p.evaluate(()=>({stage:document.getElementById('r263Stage')?.innerText||'',lauren:document.querySelector('#panel button[data-hero="lauren"]')?.innerText||'',n:document.querySelectorAll('#panel [data-persona-r1113]').length,sel:!!document.querySelector('#panel [data-persona-r1113].selected')}));
ok(hs.n>=1&&hs.sel&&/페르소나/.test(hs.stage)&&!/라우렌|잔향/.test(hs.stage)&&/내면의 소용돌이/.test(hs.stage),'ⓔ 영웅 선택 무대: 페르소나 글만 ('+hs.stage.replace(/\n+/g,' / ').slice(0,140)+')');
ok(/라우렌/.test(hs.lauren),'ⓔ 라우렌 칸은 라우렌 그대로 ('+hs.lauren.replace(/\n+/g,' ').slice(0,30)+')');
await p.evaluate(()=>document.querySelector('#panel button[data-hero="hwando"]')?.click());await p.waitForTimeout(600);
const hs2=await p.evaluate(()=>document.getElementById('r263Stage')?.innerText||'');ok(!/페르소나|내면의 소용돌이/.test(hs2),'ⓔ 다른 영웅을 고르면 무대 글이 그 영웅 것 ('+hs2.replace(/\n+/g,' / ').slice(0,60)+')');
await p.evaluate(()=>{if(modal)closePanel(true);});
// ⓕ 저장
const sv=await p.evaluate(A=>{const d=serializeSave();return {f:d?.player?.personaHeroR1113,form:window[A].formActive()};},A);ok(sv.f===true&&sv.form===true,'ⓕ 저장 자료에 형상 켜짐 기록 ('+JSON.stringify(sv)+')');
// ⓖ 쓰러짐
await p.waitForFunction(()=>{try{return !!readyImage('assets/r151/death/persona/death-e.webp')?.image;}catch(_){return false;}},null,{timeout:60000}).catch(()=>{});
await p.evaluate(()=>{const T=__STORYWORLD_PHASE1__.controller.state.three;const O=T.render;window.__dead=[];T.render=function(f){const R=O.apply(this,arguments);try{if(player.hp<=0)for(const c of f.commands)if(c&&c.kind==='image'&&c.owner?.kind==='hero')window.__dead.push(String(c.sourcePath||'').replace(/^.*\/assets\//,'assets/'));}catch(e){}return R;};});
await p.evaluate(()=>{player.hp=0;showDeath();});const dshots=[];for(let i=0;i<4;i++){await p.waitForTimeout(330);await shot('death'+i);
 dshots.push(await p.evaluate(()=>window.__STORYWORLD_DEATH_R151__.inspect()));}
const D=dshots[dshots.length-1];ok(D.stats.plays===1&&D.stats.frames>0&&D.stats.errors===0,'ⓖ 쓰러짐 연출 재생 (재생 '+D.stats.plays+', 칸 '+D.stats.frames+', 마지막 칸 '+D.stats.lastFrame+')');
// 몸 그림 경로는 R409 테두리판('r409:outline:hero:u:<쓰러짐 시트>:<칸 x,y,w,h>:…')이라 칸 번호는 경로 안 사각형에서 읽는다
const dead=await p.evaluate(()=>window.__dead);const cells=new Set(dead.map(x=>(/death-e\.webp:(\d+),/.exec(x)||[])[1]).filter(Boolean));
ok(dead.length>0&&dead.every(x=>/r151\/death\/persona\/death-e\.webp/.test(x)&&!/persona-idle|persona-walk/.test(x)),'ⓖ 쓰러지는 동안 몸 그림 = 페르소나 쓰러짐 시트(대기 그림으로 덮이지 않음) — '+dead.length+'번, 예 '+(dead[0]||'없음')+' / 어긋남 '+dead.filter(x=>!/death\/persona/.test(x)).slice(0,2).join(' , '));
ok(cells.size>=2,'ⓖ 쓰러짐 칸이 넘어감 (본 칸 x '+[...cells].join(',')+')');
ok(errs.length===0,'ⓗ 페이지 오류 0 ('+errs.slice(0,2).join(' | ')+')');
lines.push(fails?('FAILED '+fails):'ALL PASS');console.log(lines[lines.length-1]);fs.writeFileSync(OUT+'/b-result.txt',lines.join('\n')+'\n');await b.close();process.exit(fails?1:0);
