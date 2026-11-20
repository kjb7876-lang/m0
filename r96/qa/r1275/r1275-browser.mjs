// R1275 브라우저 검사(헤드리스, 소프트웨어 렌더 — 그래픽·실기기·자연 플레이 검증 아님): 스킬·확률 패시브 레벨 해금과 패시브 1·2·3 개별 강화를 실제 게임에서 확인.
//  ① 스토리 새 게임 Lv1: Q 잠김(단추 숨김). Lv2 + 점수 → 자동 스킬레벨업이 Q 를 배우고 열림.
//  ② Lv2: W 는 점수가 있어도 잠김(자동 레벨업이 W 때문에 점수를 묶지 않음), W 키는 'Lv.3 에 해금' 안내. Lv3 → W 배움.
//  ③ P 창(스킬창): 패시브 1·2·3 카드 세 장, 예전 통합 카드 없음. Lv5 엔 세 장 모두 🔒, Lv7 엔 패시브1 만 살 수 있음 → 클릭 구매 → 갈래 단계 [1,0,0].
//  ④ 예전 통합 카드 3단계 저장 → P 창 열면 세 장 3단계로 옮김.
//  ⑤ 무한생존: 생존 Lv1 Q 잠김, 생존 Lv5 → 점수 없이 Q·W·E·R 모두 열림, Lv6~8 패시브 1·2·3 차례로.
// 쓰기: SW_URL=http://127.0.0.1:4410/m0/ [SHOT=경로접두어] node r96/qa/r1275/r1275-browser.mjs
import {chromium,URL,skip} from '../r444/lib.mjs';
const shot=process.env.SHOT||'';let fail=0;const ok=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,x!==undefined?JSON.stringify(x).slice(0,300):'');if(!c)fail++;};
const b=await chromium.launch();
const L='window.__STORYWORLD_SKILL_UNLOCK_R1275__',S='window.__STORYWORLD_SKILL_GROWTH_R663__',A='window.__STORYWORLD_AUTOLEVEL_R237__',P='window.__STORYWORLD_PROGRESSION_R62__',G='window.__STORYWORLD_PASSIVE_GROWTH_R971__';
const T=['heroPassiveT1R1275','heroPassiveT2R1275','heroPassiveT3R1275'];
{const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:shot?2:1});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);
 await p.evaluate(()=>{player.hp=player.maxHp=99999;});
 let r=await p.evaluate(([L,S])=>{const s=eval(S);return {lv:player.level,q:s.locked('q'),hid:document.getElementById('specialBtn')?.classList.contains('r663hide'),mode:eval(L).mode()};},[L,S]);
 ok('① 새 게임 Lv1: Q 잠김·단추 숨김',r.lv===1&&r.q===true&&r.mode==='story',r);
 await p.evaluate(()=>{player.level=2;player.points=Math.max(player.points,3);});
 await p.waitForFunction(S+'.locked("q")===false',null,{timeout:30000}).catch(()=>{});
 r=await p.evaluate(([S,P])=>({q:eval(S).locked('q'),w:eval(S).locked('w'),qr:eval(P).ranks('skillQR663',player),wr:eval(P).ranks('skillWR663',player),pts:player.points}),[S,P]);
 ok('① Lv2: Q 배우고 열림',r.q===false&&r.qr>=1,r);
 ok('② Lv2: W 는 점수가 있어도 잠김(배우지 않음)',r.w===true&&r.wr===0,r);
 r=await p.evaluate(A+'.candidates().map(c=>c.id)');ok('② 자동 레벨업 후보에 W 배우기 없음',!r.includes('skillWR663'),r);
 await p.evaluate(()=>{window.__t=[];const t0=toast;window.__t0=t0;toast=function(m,...a){window.__t.push(String(m));return t0.call(this,m,...a);};});
 await p.keyboard.press('w');await p.waitForTimeout(300);
 r=await p.evaluate(()=>window.__t.slice());ok('② W 키: Lv.3 해금 안내',r.some(m=>/Lv\.3/.test(m)),r);
 await p.evaluate(()=>{player.level=3;player.points=Math.max(player.points,4);});
 await p.waitForFunction(S+'.locked("w")===false',null,{timeout:30000}).catch(()=>{});
 r=await p.evaluate(([S,P])=>({w:eval(S).locked('w'),wr:eval(P).ranks('skillWR663',player)}),[S,P]);ok('② Lv3: W 배우고 열림',r.w===false&&r.wr>=1,r);
 r=await p.evaluate(()=>window.__t.slice());ok('② W 해금 알림',r.some(m=>/W 스킬 해금 \(Lv\.3\)/.test(m)),r);
 // ③ P 창
 await p.evaluate(()=>{player.level=5;player.points=0;});await p.waitForTimeout(1500);
 const card=()=>p.evaluate(([T])=>{const o={};for(const id of [...T,'heroPassiveR971']){const el=document.querySelector('[data-r62-passive="'+id+'"]');o[id]=el?{dis:el.disabled,lock:!!el.querySelector('.r1275lv'),txt:el.textContent.slice(0,80)}:null;}return o;},[T]);
 await p.evaluate(()=>{player.points=40;showUpgrades();});await p.waitForTimeout(400);
 r=await card();ok('③ P 창: 패시브 1·2·3 카드 세 장, 예전 통합 카드 없음',T.every(id=>r[id])&&r.heroPassiveR971===null,r);
 ok('③ Lv5: 세 장 모두 🔒 막힘',T.every(id=>r[id].dis&&r[id].lock),r);
 {const bk=await p.evaluate(()=>{const s=[...document.querySelectorAll('#r115Book section')].find(x=>/특수 패시브/.test(x.querySelector('h4')?.textContent||''));return s?[...s.querySelectorAll('.r115row')].map(r=>({nm:r.querySelector('.nm')?.textContent,ln:r.textContent,dis:r.querySelector('button')?.disabled})):null;});
  ok('③ 스킬 강화 모음(R115) 특수 패시브 묶음 = 패시브 1·2·3 세 줄, 모두 🔒 Lv 안내·+1 막힘',Array.isArray(bk)&&bk.length===3&&bk.every(r=>/^특수 패시브 [123] · /.test(r.nm)&&/🔒 레벨 (7|15|30) 해금/.test(r.ln)&&r.dis===true),bk);}
 ok('③ 카드 이름 = 환도 갈래(묵월·칠묵영·삼협묵희)',/묵월/.test(r[T[0]].txt)&&/칠묵영/.test(r[T[1]].txt)&&/삼협묵희/.test(r[T[2]].txt),r);
 await p.evaluate(()=>closePanel(true));await p.evaluate(()=>{player.level=7;player.points=0;});await p.waitForTimeout(1500);
 await p.evaluate(A+'.set(false)');await p.evaluate(()=>{player.points=40;showUpgrades();});await p.waitForTimeout(400);
 {const bk=await p.evaluate(()=>{const s=[...document.querySelectorAll('#r115Book section')].find(x=>/특수 패시브/.test(x.querySelector('h4')?.textContent||''));return s?[...s.querySelectorAll('.r115row button')].map(b=>b.disabled):null;});ok('③ 모음 Lv7: +1 은 패시브1 만',JSON.stringify(bk)==='[false,true,true]',bk);}
 r=await card();ok('③ Lv7: 패시브1 살 수 있음, 2·3 🔒',!r[T[0]].dis&&!r[T[0]].lock&&r[T[1]].dis&&r[T[2]].dis,r);
 if(shot){await p.evaluate(()=>{[...document.querySelectorAll('#r115Book section')].find(x=>/특수 패시브/.test(x.querySelector('h4')?.textContent||''))?.scrollIntoView({block:'center'});});await p.waitForTimeout(300);await p.screenshot({path:shot+'-pwindow.jpg',quality:88});}
 await p.evaluate(([T])=>document.querySelector('[data-r62-passive="'+T[0]+'"]').click(),[T]);await p.waitForTimeout(300);
 r=await p.evaluate(G+'.tierRanks()');ok('③ 패시브1 카드 클릭 구매 → 갈래 단계 [1,0,0]',JSON.stringify(r)==='[1,0,0]',r);
 r=await p.evaluate(([G])=>{const g=eval(G);return {a:g.chances('hwando',[.18,.06,.03]),k:g.tierMult('hwando','moon'),k3:g.tierMult('hwando','trio')};},[G]);
 ok('③ 묵월만 확률이 오름(칠묵영·삼협묵희 그대로)',r.k>1&&r.k3===1&&Math.abs(r.a[1]-.06)<1e-12&&Math.abs(r.a[2]-.03)<1e-12,r);
 await p.evaluate(()=>closePanel(true));
 // ④ 예전 카드 옮기기
 await p.evaluate(([P,T])=>{const st=eval(P).state(player);st.ranks.heroPassiveR971=3;for(const id of T)st.ranks[id]=0;showUpgrades();},[P,T]);await p.waitForTimeout(300);
 r=await p.evaluate(([P,T])=>{const st=eval(P).state(player);return [st.ranks.heroPassiveR971||0,...T.map(id=>st.ranks[id])];},[P,T]);ok('④ 예전 통합 카드 3단계 → 세 장 3단계, 예전 칸 0',JSON.stringify(r)==='[0,3,3,3]',r);
 await p.evaluate(()=>closePanel(true));
 const ins=await p.evaluate(L+'.inspect()');ok('스토리 오류 없음',ins.stats.errors===0&&errs.length===0,{ins,errs});
 await ctx.close();}
// ── 무한생존 ──
{const ctx=await b.newContext({viewport:{width:640,height:360}});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:180000});
 await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="hwando"]').click();await p.locator('#r600Go').click();
 await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
 await p.evaluate(()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration());
 let r=await p.evaluate(([L,S])=>({m:eval(L).mode(),lv:eval(L).level(),q:eval(S).locked('q'),pts:player.points}),[L,S]);ok('⑤ 생존 Lv1: Q 잠김',r.m==='survival'&&r.lv===1&&r.q===true,r);
 const credit=async lv=>{await p.evaluate(lv=>{const s=window.__STORYWORLD_SURVIVAL_R600__;const need=l=>30+22*l;let x=0;for(let l=s.state().lv;l<lv;l++)x+=need(l);if(x>0)s.qaCredit(x/ (s.pure?.diffOf?.(s.state().diff)?.xp||1));},lv);
  await p.waitForFunction(([L,lv])=>eval(L).level()>=lv,[L,lv],{timeout:60000}).catch(()=>{});await p.waitForTimeout(600);};
 await credit(5);
 r=await p.evaluate(([L,S])=>({lv:eval(L).level(),l:['q','w','e','r'].map(s=>eval(S).locked(s)),pts:player.points,hid:['specialBtn','story-wer-w','story-wer-e','story-wer-r'].map(id=>document.getElementById(id)?.classList.contains('r663hide'))}),[L,S]);
 ok('⑤ 생존 Lv5: 점수 없이 Q·W·E·R 모두 열림·단추 보임',r.lv>=5&&r.l.every(x=>x===false)&&r.hid.every(x=>x!==true),r);
 const U='window.__STORYWORLD_PASSIVE_UNLOCK_R1025__';
 r=await p.evaluate(([U])=>eval(U).table().hwando.map(t=>t.open),[U]);ok('⑤ 생존 Lv5: 패시브 셋 다 잠김',r.every(x=>!x),r);
 await credit(6);r=await p.evaluate(([U])=>eval(U).table().hwando.map(t=>t.open),[U]);ok('⑤ 생존 Lv6: 패시브1',JSON.stringify(r)==='[true,false,false]',r);
 await credit(8);r=await p.evaluate(([U])=>eval(U).table().hwando.map(t=>t.open),[U]);ok('⑤ 생존 Lv8: 패시브 1·2·3 모두',JSON.stringify(r)==='[true,true,true]',r);
 const ins=await p.evaluate(L+'.inspect()');ok('생존 오류 없음',ins.stats.errors===0&&errs.length===0,{ins,errs});
 await ctx.close();}
await b.close();console.log(fail?'R1275 browser: FAIL '+fail:'R1275 browser: all pass');process.exit(fail?1:0);
