// R1032 브라우저 검사(헤드리스, 소프트웨어 렌더 — 실기기·GPU 확인 아님): 고유 장비·꿈의 조각·K/I/B 창을 실제 게임에서.
//  ① 스토리: K → 패시브 창, I → 장비+기억 조각 창(인장 그림·무기 그림), 스토리 본편 처치 → 조각 0
//  ② 사몽 층(DREAM): 처치 → 조각, 무기 강화 → 실제 hitEnemy 피해 증가, 장미 인장 치명 → 재발동, J의 인장 → 받는 피해 감소·EGO 지속
//  ③ 무한생존: I → 장비 창(영웅 배치 창 아님), B → 영웅 배치 창, 설정 창에 K·I 단추
// 쓰기: SW_URL=http://127.0.0.1:4410/m0/ [SHOT=경로접두어] node r96/qa/r1032/r1032-browser.mjs
import {chromium,URL,skip,go} from '../r444/lib.mjs';
const shot=process.env.SHOT||'';let fail=0;const ok=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,x!==undefined?JSON.stringify(x).slice(0,300):'');if(!c)fail++;};
const b=await chromium.launch();const A='window.__STORYWORLD_GEAR_R1032__';
const waitGame=(p,s)=>p.evaluate(s=>new Promise(r=>{const t=time;const w=()=>time>=t+s?r():setTimeout(w,50);w();}),s);
{const ctx=await b.newContext({viewport:{width:1280,height:720}});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);await go(p,'dist00');await p.waitForTimeout(800);await skip(p);
 ok('모듈 실림·설치',await p.evaluate(A+'.inspect().revision')==='R1032');
 await p.keyboard.press('k');await p.waitForTimeout(400);let h=await p.evaluate(()=>modal&&document.getElementById('panel')?.textContent||'');
 ok('K → 패시브 스킬 창',/패시브 스킬/.test(h)&&/영웅 패시브/.test(h)&&/특수 패시브/.test(h),h.slice(0,160));if(shot)await p.screenshot({path:shot+'-k.png'});
 await p.keyboard.press('k');await p.waitForTimeout(300);ok('K 다시 → 닫힘',!(await p.evaluate(()=>modal)));
 await p.keyboard.press('i');await p.waitForTimeout(1500);h=await p.evaluate(()=>modal&&document.getElementById('panel')?.textContent||'');
 ok('I → 고유 장비 + 기억 조각',/고유 장비/.test(h)&&/기억 조각/.test(h)&&/J의 인장/.test(h)&&/장미 인장/.test(h)&&/환도/.test(h),h.slice(0,200));
 const art=await p.evaluate(()=>{const c=document.querySelector('canvas[data-r1032w]');let lit=0;if(c){const d=c.getContext('2d').getImageData(0,0,72,72).data;for(let i=3;i<d.length;i+=4)if(d[i]>20)lit++;}return {seal:!!document.querySelector('#panel svg.r1032seal'),lit};});
 ok('창에 J의 인장 그림·환도 무기 그림(영웅 그림에서 잘라 그림)',art.seal&&art.lit>300,art);if(shot)await p.screenshot({path:shot+'-i.png'});
 await p.keyboard.press('i');await p.waitForTimeout(300);
 // 스토리 본편 처치 → 조각 없음
 const f0=await p.evaluate(()=>{const e=room.enemies.find(e=>e.hp>0&&!e.boss);if(e)killEnemy(e);return window.__STORYWORLD_GEAR_R1032__.frags();});ok('스토리 본편 처치 → 꿈의 조각 0',f0===0,f0);
 // 사몽 층
 await p.evaluate(()=>enterRegion('dist00',null,{layer:'DREAM',restore:true,noStory:true}));await p.waitForFunction(()=>!loading&&layer==='DREAM',null,{timeout:150000}).catch(()=>{});await skip(p);
 const dr=await p.evaluate(()=>({layer,zone,n:room.enemies.filter(e=>e.hp>0).length}));ok('사몽 층(DREAM) 들어감',dr.layer==='DREAM',dr);
 const f1=await p.evaluate(()=>{const e=room.enemies.find(e=>e.hp>0&&!e.boss);if(e){e.spawnGuard=0;e.hp=1;hitEnemy(e,1e9);if(e.hp>0)killEnemy(e);}return window.__STORYWORLD_GEAR_R1032__.inspect().frags;});ok('사몽 층 처치 → 꿈의 조각',f1>0,f1);
 // 무기 강화 → 실제 피해
 const dmg=await p.evaluate(()=>{const G=window.__STORYWORLD_GEAR_R1032__;G.qaRoll(()=>.999);const e=room.enemies.find(e=>e.hp>0&&!e.boss);if(!e)return null;e.hp=e.maxHp=1e6;const a=e.hp;hitEnemy(e,100);const d0=a-e.hp;
  G.qaGive(2000);const u=[G.upgrade('weapon'),G.upgrade('weapon'),G.upgrade('weapon')];const b=e.hp;hitEnemy(e,100);return {d0,d1:b-e.hp,u:u.map(x=>x.ok),lv:G.levels().weapon.hwando,ef:G.effects()};});
 ok('고유무기 3단계 → 실제 피해 증가(엔진 다른 배수와 합친 실측)',dmg&&dmg.u.every(Boolean)&&dmg.d1>dmg.d0*1.15,dmg);
 // 장미 인장(스토리 last305 완료 처리) 치명 → 재발동
 const ec=await p.evaluate(async()=>{progress.STORY=progress.STORY||{};progress.STORY.last305=true;progress.STORY.ep1a11=true;const G=window.__STORYWORLD_GEAR_R1032__;G.qaRoll(()=>0);
  const e=room.enemies.find(e=>e.hp>0&&!e.boss);e.hp=e.maxHp=1e6;const s0=G.inspect().stats.echoes;hitEnemy(e,50);const t=time;await new Promise(r=>{const w=()=>time>t+.4?r():setTimeout(w,50);w();});G.qaRoll(()=>.999);return {owned:G.inspect().owned,s0,s1:G.inspect().stats.echoes,crits:G.inspect().stats.crits};});
 ok('장미 인장 치명 → 같은 타격 한 번 더(재발동)',ec.owned.rose&&ec.s1===ec.s0+1,ec);
 const def=await p.evaluate(()=>{const G=window.__STORYWORLD_GEAR_R1032__;player.invincible=0;player.guard=false;player.shield=0;player.hp=maxHP();const a=player.hp;hurt(40,{kind:'test'});const d=a-player.hp;
  player.ego=0;player.egoCD=0;player.resonance=60;ego();return {d,ego:player.ego,ef:G.effects()};});
 ok('J의 인장 → EGO 지속 늘어남(3초 → ×1.05 이상)',def.ego>3.1,def);ok('J의 인장 상태에서 피격 처리 정상(유한값)',Number.isFinite(def.d)&&def.d>=0,def);
 ok('페이지 오류 0',errs.length===0,errs);await ctx.close();}
// 무한생존
{const ctx=await b.newContext({viewport:{width:1280,height:720}});await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:180000});await p.waitForTimeout(800);await p.locator('#survivalStartR600').click();await p.waitForTimeout(800);
 await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="hwando"]').click();await p.locator('#r600Go').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();});await waitGame(p,1);
 await p.keyboard.press('i');await p.waitForTimeout(800);let s=await p.evaluate(()=>({modal,t:document.getElementById('panel')?.textContent||'',r720:!!document.getElementById('r720Panel'),place:!!document.getElementById('r1032Place')}));
 ok('생존 I → 장비 창(영웅 배치 창 아님) + 안에 배치 단추',s.modal&&/고유 장비/.test(s.t)&&!s.r720&&s.place,s);if(shot)await p.screenshot({path:shot+'-sv-i.png'});
 await p.keyboard.press('i');await p.waitForTimeout(300);
 await p.keyboard.press('b');await p.waitForFunction(()=>!!document.getElementById('r720Panel'),null,{timeout:20000}).catch(()=>{});s=await p.evaluate(()=>({r720:!!document.getElementById('r720Panel'),modal}));ok('생존 B → 영웅 배치 창',s.r720&&s.modal,s);
 await p.keyboard.press('b');await p.waitForTimeout(300);ok('B 다시 → 닫힘',!(await p.evaluate(()=>modal)));
 await p.waitForFunction(()=>room.enemies.some(e=>e.hp>0&&!e.deadRecorded&&!e.r600Boss),null,{timeout:300000}).catch(()=>{});
 const k0=await p.evaluate(()=>window.__STORYWORLD_GEAR_R1032__.inspect().frags);await waitGame(p,1.5);/* 몹 등장 직후 보호 시간에는 처치 안 됨(R720 검사 함정) */const kd=await p.evaluate(()=>{const e=room.enemies.find(e=>e.hp>0&&!e.deadRecorded&&!e.r600Boss);if(e){for(let i=0;i<5&&!e.deadRecorded;i++)hitEnemy(e,1e9);}return {n:room.enemies.length,dead:!!e?.deadRecorded};});console.log('kill',JSON.stringify(kd));
 ok('생존 처치 → 꿈의 조각',(await p.evaluate(()=>window.__STORYWORLD_GEAR_R1032__.inspect().frags))>k0);
 await p.evaluate(()=>showSettings());await p.waitForTimeout(500);const st=await p.evaluate(()=>({k:!!document.getElementById('r1032OpenK'),i:!!document.getElementById('r1032OpenI')}));ok('설정 창에 K·I 창 단추(모바일용)',st.k&&st.i,st);
 await p.evaluate(()=>document.getElementById('r1032OpenI').click());await p.waitForTimeout(500);ok('설정 단추 → 장비 창',/고유 장비/.test(await p.evaluate(()=>document.getElementById('panel')?.textContent||'')));
 ok('페이지 오류 0',errs.length===0,errs);await ctx.close();}
// 폰 세로: 장비 창이 화면 안
{const ctx=await b.newContext({viewport:{width:375,height:812},hasTouch:true,isMobile:true});await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);await p.evaluate(()=>window.__STORYWORLD_GEAR_R1032__.openGear());await p.waitForTimeout(1200);
 const w=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,cards:[...document.querySelectorAll('.r1032card')].map(c=>Math.round(c.getBoundingClientRect().right))}));
 ok('폰 375 폭: 장비 카드가 화면 밖으로 안 나감',w.cards.length===3&&w.cards.every(r=>r<=375),w);if(shot)await p.screenshot({path:shot+'-phone-i.png'});await ctx.close();}
await b.close();console.log(fail?'FAIL '+fail:'ALL PASS');process.exit(fail?1:0);
