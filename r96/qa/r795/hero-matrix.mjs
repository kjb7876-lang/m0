// R795 영웅 전수 점검 — 브라우저(헤드리스 Chromium) 행렬 검사. 8영웅 × 상황별.
//  실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r795/hero-matrix.mjs [영웅…] [--only=sc1,sc2] [--out=폴더]
//  실제 키 입력(page.keyboard) + 게임 시간은 tick(1/60) 직접 구동(page-helper.js). 결과: results.json · results.md
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';
const ALL=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner'];
const args=process.argv.slice(2),heroes=args.filter(a=>!a.startsWith('--'));const only=(args.find(a=>a.startsWith('--only='))||'').slice(7).split(',').filter(Boolean);
const OUT=(args.find(a=>a.startsWith('--out='))||'').slice(6)||HERE;const ZONE=process.env.SW_ZONE||'dist00';/* 앞쪽 상황(sc01~09)이 몹을 거의 다 잡으므로 뒤쪽 상황(sc10~)은 다른 전투 지역에서 한다 */const ZONE2=process.env.SW_ZONE2||ZONE;
const HELPER=fs.readFileSync(path.join(HERE,'page-helper.js'),'utf8');
const MELEE=new Set(['hwando','neon','lauren','slayer']);
const DIRKEYS=[['ArrowRight'],['ArrowRight','ArrowDown'],['ArrowDown'],['ArrowDown','ArrowLeft'],['ArrowLeft'],['ArrowLeft','ArrowUp'],['ArrowUp'],['ArrowUp','ArrowRight']];
const ALLKEYS=['ArrowRight','ArrowLeft','ArrowUp','ArrowDown','a','d','q','w','e','r','s','f'];

async function boot(b,hero){const ctx=await b.newContext({viewport:{width:640,height:360},deviceScaleFactor:1});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+String(e.stack||e).slice(0,500)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|net::ERR/.test(m.text()))errs.push('CONSOLE '+m.text().slice(0,300));});
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator(`.heroRowR101 button[data-hero="${hero}"]`).click({timeout:20000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading&&(!modal||!!storyScene),null,{timeout:240000});await p.waitForTimeout(600);await skip(p);await p.waitForFunction(()=>started&&!loading&&!modal&&!storyScene,null,{timeout:60000});/* SW_CHEAT=1 — 777 코드로 모든 지역을 연다(새 여정에서는 첫 전투 지역만 열려 있다). 레벨·스킬이 바뀌므로 잠금·배우기 상황(sc05·sc06)은 이 방식으로 돌리지 않는다 */if(process.env.SW_CHEAT){await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);}/* 새 여정 준비(begin)가 끝나기 전에 지역을 옮기면 '첫 거점을 열지 못했습니다'로 되돌아간다 */return {ctx,p,errs};}
const skip=p=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
async function go(p,z){
 /* SW_ZONE=samong:<i>,<stage> — 777 코드로 사몽(DREAM) 구역에 들어간다 */
 if(z.startsWith('samong:')){const [i,st]=z.slice(7).split(',').map(Number);const there=await p.evaluate(()=>layer==='DREAM'&&!loading);if(!there){await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);const ok=await p.evaluate(([i,st])=>window.__STORYWORLD_CHEAT777__.goSamong(i,st,{force:true}),[i,st]);if(ok===false)throw new Error('goSamong refused');await p.waitForFunction(()=>!loading&&layer==='DREAM',null,{timeout:150000});await skip(p);}return;}
await p.evaluate(async z=>{if(zone!==z)await enterRegion(z,null,{layer:'STORY',restore:true});},z);await p.waitForFunction(z=>!loading&&zone===z,z,{timeout:150000});await skip(p);}

async function runHero(b,hero,rows,part){const {ctx,p,errs}=await boot(b,hero);
 const rec=(sc,check,pass,detail='')=>{rows.push({hero,sc,check,pass:pass===null?null:!!pass,detail:typeof detail==='string'?detail:JSON.stringify(detail)});if(pass===false)console.log(`  ✗ ${hero} ${sc} ${check} ${typeof detail==='string'?detail:JSON.stringify(detail)}`.slice(0,400));};
 const E=(fn,arg)=>p.evaluate(fn,arg);const step=async s=>{let r=await E(s=>__HQ795.step(s),s);if(r.dt<s*.5&&await E(()=>!!storyScene||(modal&&!document.getElementById('reviveHome')&&player.hp>0&&!document.getElementById('menuClose')))){await skip(p);const r2=await E(s=>__HQ795.step(s),s-r.dt);r={dt:+(r.dt+r2.dt).toFixed(3),stoppedBy:r2.stoppedBy,scene:true};}return r;};const snap=()=>E(()=>__HQ795.snap());
 const down=async(...ks)=>{for(const k of ks)await p.keyboard.down(k);},up=async(...ks)=>{for(const k of ks)await p.keyboard.up(k);};
 const press=async k=>{await p.keyboard.down(k);await step(.05);await p.keyboard.up(k);};
 const releaseAll=()=>up(...ALLKEYS);
 let sweep0={};
 const T0=Date.now();const begin=async sc=>{if(process.env.SW_VERBOSE)console.log('   ·',sc,((Date.now()-T0)/1000).toFixed(0)+'s');await skip(p);await E(t=>__HQ795.setTag(t),sc);};
 const end=async sc=>{await releaseAll();const d=await E(()=>__HQ795.drain());const pe=errs.splice(0);
  rec(sc,'불변식(NaN·범위·벽 속·엔진 오류)',d.viol.length===0,d.viol.slice(0,4));
  const bad=d.locks.filter(l=>!l.bound);rec(sc,'이동 잠금 없음(속박 아닌데 못 걷는 구간)',bad.length===0,bad.slice(0,3));
  if(d.locks.some(l=>l.bound))rec(sc,'속박 중 걷기 막힘(R137 규칙)',null,d.locks.filter(l=>l.bound).slice(0,2));
  rec(sc,'페이지 오류 없음',pe.length===0,pe.slice(0,3));
  const sw=await E(()=>__HQ795.sweep());const diff={};for(const [k,v] of Object.entries(sw)){const o=sweep0[k];if(!o||o.e!==v.e||o.le!==v.le)diff[k]=v;}sweep0=sw;
  rec(sc,'오버레이 내부 오류 집계 증가 없음',Object.keys(diff).length===0,diff);};
 /* 앞쪽 상황(sc01~09)이 첫 전투 지역 몹을 거의 다 잡고, 새 여정에서는 그 지역만 열려 있다 → 뒤쪽 상황(sc10~)은 새 여정을 다시 시작해서 한다 */const want=sc=>(!only.length||only.includes(sc))&&((+sc.slice(2,4)<10)===(part==='A'));
 const toOpen=async(minEnemy=13)=>E(m=>{const q=__HQ795.findOpen(m)||__HQ795.findOpen(8)||__HQ795.findOpen(4);if(q)__HQ795.tp(q);return q;},minEnemy);
 const toEnemy=async()=>{const skipIds=[];for(let i=0;i<5;i++){const e=await E(([m,sk])=>__HQ795.engage(m,sk),[MELEE.has(hero),skipIds]);if(!e)return null;await E(()=>__HQ795.step(.1));if(await E(id=>__HQ795.still(id),e.id))return e;skipIds.push(e.id);}return null;};
 const waitCD=async(pred,max=40)=>{await toOpen();for(let t=0;t<max;t+=1){if(await E(pred))return true;await step(1);}return E(pred);};
 const safeHp=()=>E(()=>{player.hp=maxHP();});
 try{
 await go(p,ZONE);await p.addScriptTag({content:HELPER});await step(.5);sweep0=await E(()=>__HQ795.sweep());errs.splice(0);

 // ---- SC01 시작·그림 ----
 if(want('sc01')){await begin('sc01');const s=await snap();rec('sc01','고른 영웅으로 시작',s.hero===hero,s.hero);
  const drawn=await E(()=>__HQ795.heroDrawn());
  rec('sc01','영웅 몸 그림이 그려짐(그리기 호출에 영웅 자산)',drawn.hero.length>0,drawn);rec('sc01','다른 영웅 그림이 섞여 그려지지 않음',drawn.others.length===0,drawn.others);
  rec('sc01','체력·공명 시작값 정상',s.hp>0&&s.hp<=s.maxHp&&s.res>=0,{hp:s.hp,max:s.maxHp,res:s.res});await end('sc01');}

 // ---- SC02 이동 8방향 ----
 if(want('sc02')){await begin('sc02');const o=await toOpen();rec('sc02','열린 자리 찾음',!!o,o);const speed=await E(()=>SPEED);let ok=0;const bad=[];
  for(const ks of DIRKEYS){await E(o=>__HQ795.tp(o),o);await step(.05);const exp=await E(ks=>{const sx=(ks.includes('ArrowRight')?1:0)-(ks.includes('ArrowLeft')?1:0),sy=(ks.includes('ArrowDown')?1:0)-(ks.includes('ArrowUp')?1:0),v=norm(sx+2*sy,2*sy-sx);return {v,f:facing(v.x,v.y)};},ks);
   await down(...ks);const st=await step(.4);const s=await snap();await up(...ks);await step(.25);const s2=await snap();await step(.2);const s3=await snap();
   const dx=s.x-o.x,dy=s.y-o.y,dist=Math.hypot(dx,dy),along=(dx*exp.v.x+dy*exp.v.y);
   const good=along>=speed*st.dt*.8&&dist<=speed*st.dt*2&&s.moving&&s.dir===exp.f&&!s3.moving&&Math.hypot(s3.x-s2.x,s3.y-s2.y)<.02&&s3.keys.length===0;
   if(good)ok++;else bad.push({st,why:await E(()=>({modal,loading,scene:!!storyScene,hp:player.hp,hidden:document.hidden,panel:document.getElementById('modal')?.className+'|'+document.getElementById('modal')?.innerText.slice(0,80)})),ks:ks.join('+'),dist:+dist.toFixed(2),along:+along.toFixed(2),need:+(speed*st.dt*.8).toFixed(2),dir:s.dir,exp:exp.f,moving:s.moving,after:s3.moving,drift:+Math.hypot(s3.x-s2.x,s3.y-s2.y).toFixed(3),keys:s3.keys});}
  rec('sc02','8방향 걷기(거리·방향·멈춤)',ok===8,ok===8?'8/8':bad);await end('sc02');}

 // ---- SC03 허공 기본공격 ----
 if(want('sc03')){await begin('sc03');await toOpen();const s0=await snap();await down('a');await step(1.2);const s=await snap();await up('a');await step(.8);const s2=await snap();
  rec('sc03','적 없을 때 A 누르기: 멈춤·오류 없음',s.keys.includes('attack')&&!s2.keys.includes('attack'),{keys:s.keys,after:s2.keys});
  rec('sc03','공격 뒤 동작값 0 으로 복귀',s2.attackAnim===0&&s2.skillAnim===0,{aa:s2.attackAnim,sa:s2.skillAnim});
  await down('ArrowRight');await step(.4);const s3=await snap();await up('ArrowRight');rec('sc03','공격 뒤 바로 걷기',Math.hypot(s3.x-s2.x,s3.y-s2.y)>1,{d:+Math.hypot(s3.x-s2.x,s3.y-s2.y).toFixed(2)});await end('sc03');}

 // ---- SC04 기본공격 적중 ----
 if(want('sc04')){await begin('sc04');await safeHp();const e=await toEnemy();rec('sc04','적 옆 자리 잡음',!!e,e);
  if(e){const f0=await E(id=>__HQ795.hitFacts(id),e.id);const hp0=await E(()=>__HQ795.enemyHpSum());let anim=false,shots=0,dealt=0,combo0=(await snap()).combo,t=0;await E(()=>__HQ795.resetSeen());await down('a');
   for(;t<5;t+=.25){await step(.25);const s=await snap();anim=await E(()=>__HQ795.seenF.aa);shots=Math.max(shots,s.shots);dealt=hp0-await E(()=>__HQ795.enemyHpSum());if(dealt>0&&anim&&t>1)break;}
   const s=await snap();await up('a');rec('sc04','A 로 적에게 피해',dealt>0,dealt>0?{dealt:+dealt.toFixed(1),sec:t}:{dealt:+dealt.toFixed(1),sec:t,target:e.id,combo:[combo0,s.combo],before:f0,after:await E(id=>__HQ795.hitFacts(id),e.id)});rec('sc04','공격 동작(attackAnim) 켜짐',anim,'');rec('sc04','콤보 증가',s.combo>combo0,{from:combo0,to:s.combo});
   if(!MELEE.has(hero))rec('sc04','원거리: 아군 탄 생성',shots>0||dealt>0,{shots});
   await toOpen();await step(1.2);const s2=await snap();rec('sc04','공격 끝난 뒤 동작값 복귀',s2.attackAnim===0,{aa:s2.attackAnim});}
  await end('sc04');}

 // ---- SC05 새 게임 잠금 ----
 if(want('sc05')){await begin('sc05');await toOpen();const s0=await snap();rec('sc05','새 게임 W·E·R 잠김(0단계)',s0.ranks&&s0.ranks.w===0&&s0.ranks.e===0&&s0.ranks.r===0,s0.ranks);rec('sc05','새 게임 Q 단계(참고)',null,{q:s0.ranks?.q});
  for(const k of ['w','e','r']){const b=await snap();await press(k);await step(.3);const a=await snap();rec('sc05',`잠긴 ${k.toUpperCase()} 키: 시전 안 됨`,a.skillAnim===0&&Math.hypot(a.x-b.x,a.y-b.y)<.05&&a.shots===b.shots,{wer:a.wer[k],sa:a.skillAnim,shots:[b.shots,a.shots]});
   const vis=await E(k=>{const el=document.getElementById('story-wer-'+k);if(!el)return 'none';const cs=getComputedStyle(el);return (cs.display==='none'||cs.visibility==='hidden'||el.hidden)?'hidden':'shown';},k);rec('sc05',`잠긴 ${k.toUpperCase()} 단추 숨김`,vis!=='shown',vis);}
  if(s0.ranks?.q===0){await press('q');await step(.2);const a=await snap();rec('sc05','잠긴 Q 키: 시전 안 됨',a.specialCD===0,{cd:a.specialCD});}
  await end('sc05');}

 // ---- SC06 성장: 포인트로 배우기 ----
 if(want('sc06')){await begin('sc06');await toOpen();
  for(const k of ['q','w','e','r']){let r=(await snap()).ranks[k];if(r>=1){rec('sc06',`${k.toUpperCase()} 이미 배움`,null,'');continue;}
   const cost=await E(k=>window.__STORYWORLD_SKILL_GROWTH_R663__.cost(k,0),k);await E(c=>{player.points=(Number(player.points)||0)+c;},cost);let s=await snap();for(let i=0;i<10&&!(s.ranks[k]>=1);i++){await p.waitForTimeout(500);await step(.3);s=await snap();}/* 자동 스킬레벨업(R237)은 실제 시간 1.2초 박자 */const autoL=s.ranks[k]>=1;
   rec('sc06',`${k.toUpperCase()} 점수 ${cost}점 모이면 저절로 배움`,autoL,{ranks:s.ranks,points:s.points});
   if(!autoL){await E(k=>{try{window.__STORYWORLD_PROGRESSION_R62__.purchase('skill'+k.toUpperCase()+'R663');}catch(e){}},k);await step(.5);s=await snap();rec('sc06',`${k.toUpperCase()} 직접 구매로 배움`,s.ranks[k]>=1,s.ranks);}
   if(k!=='q'){const vis=await E(k=>{const el=document.getElementById('story-wer-'+k);if(!el)return 'none';const cs=getComputedStyle(el);return (cs.display==='none'||cs.visibility==='hidden'||el.hidden)?'hidden':'shown';},k);rec('sc06',`${k.toUpperCase()} 배운 뒤 단추 보임`,vis==='shown'||null,vis);
    const hc=await E(k=>__HQ795.hudCd(k),k);rec('sc06',`${k.toUpperCase()} 배운 뒤 화면 재사용 숫자 정상(200 미만)`,hc<200,{hud:hc,wer:s.wer[k]});}}
  await end('sc06');}

 // ---- SC07 Q·W·E·R 시전·재사용·시전 뒤 이동 ----
 if(want('sc07')){const cdOf=k=>E(k=>__HQ795.hudCd(k),k);const waitReady=async(k,max)=>{await toOpen();for(let t=0;t<max;t+=1){if(await cdOf(k)===0)return true;await step(1);}return (await cdOf(k))===0;};
  for(const k of ['q','w','e','r']){const sc='sc07'+k;await begin(sc);await safeHp();const s00=await snap();if(!(s00.ranks?.[k]>=1)){rec(sc,`${k.toUpperCase()} 못 배워 건너뜀`,false,s00.ranks);await end(sc);continue;}
   const ready=await waitReady(k,60);rec(sc,'재사용 대기가 끝남',ready,{cd:await cdOf(k)});
   await safeHp();const e=await toEnemy();const hp0=await E(()=>__HQ795.enemyHpSum());const b=await snap();await E(()=>__HQ795.resetSeen());await press(k);await step(.1);const a=await snap();const cd1=await cdOf(k);
   rec(sc,`${k.toUpperCase()} 시전됨(재사용 시작)`,cd1>0,{cd:cd1,sa:a.skillAnim,near:e,keys:a.keys,modal:a.modal});rec(sc,'재사용 대기 값 정상(0~120초)',cd1>0&&cd1<=120,{cd:cd1});
   // 재사용 중 다시 눌러도 다시 나가지 않음
   await step(.6);const c0=await cdOf(k);await press(k);await step(.05);const c1=await cdOf(k);rec(sc,'재사용 중 다시 눌러도 재시전 안 됨',c1<=c0+.01,{before:c0,after:c1});
   // 시전 뒤 걷기: 0.5초 뒤부터 1초 동안 눌러 1.5칸 이상
   const w0=await snap();const dir=await E(()=>{for(const [n,[dx,dy]] of [['ArrowRight',[1,-1]],['ArrowLeft',[-1,1]],['ArrowUp',[-1,-1]],['ArrowDown',[1,1]]]){const m=Math.hypot(dx,dy);if(__HQ795.dummyMove(dx/m*3,dy/m*3)>2.6)return n;}return 'ArrowRight';});
   await down(dir);const wst=await step(1);const w1=await snap();await up(dir);rec(sc,'시전 뒤 걸을 수 있음',Math.hypot(w1.x-w0.x,w1.y-w0.y)>1.5,{d:+Math.hypot(w1.x-w0.x,w1.y-w0.y).toFixed(2),dir,sa:w1.skillAnim,keys:w1.keys,st:wst,modal:w1.modal,hp:w1.hp});
   await step(2.5);const dealt=hp0-await E(()=>__HQ795.enemyHpSum());rec(sc,'적 피해(참고: 버프·방어형이면 0)',null,{dealt:+dealt.toFixed(1)});
   const z=await snap();rec(sc,'시전 4초 뒤 동작값 복귀',z.skillAnim===0,{sa:z.skillAnim});
   // 다시 시전
   const ready2=await waitReady(k,130);await safeHp();await toEnemy();await press(k);await step(.1);const cd2=await cdOf(k);
   rec(sc,'재사용 뒤 다시 시전됨',ready2&&cd2>0,{ready2,cd:cd2});await toOpen();await step(1.5);await end(sc);}}

 // ---- SC08 블링크·공명방어·EGO ----
 if(want('sc08')){await begin('sc08');const o=await toOpen();await waitCD(()=>player.blinkCD<=0,10);let ok=0;const bad=[];
  for(const ks of [['ArrowRight'],['ArrowLeft'],['ArrowUp'],['ArrowDown']]){await E(o=>__HQ795.tp(o),o);await waitCD(()=>player.blinkCD<=0,10);await E(o=>__HQ795.tp(o),o);await step(.05);await down(...ks);await step(.05);const b=await snap();await press('s');const a=await snap();await up(...ks);
   const d=Math.hypot(a.x-b.x,a.y-b.y);if(d>1.5&&a.blinkCD>0&&a.inv>0)ok++;else bad.push({ks:ks[0],d:+d.toFixed(2),cd:a.blinkCD,inv:a.inv});await step(.3);}
  rec('sc08','S 블링크 4방향(이동·재사용·무적)',ok===4,ok===4?'4/4':bad);
  await E(o=>__HQ795.tp(o),o);await step(.2);await down('d');await step(.3);const g=await snap();await down('ArrowRight');await step(.4);const g2=await snap();await up('ArrowRight');await up('d');await step(.2);const g3=await snap();
  rec('sc08','D 공명방어: 누르는 동안 켜짐·떼면 꺼짐',g.guard&&!g3.guard,{on:g.guard,off:g3.guard});rec('sc08','방어 중 걷기(참고)',null,{d:+Math.hypot(g2.x-g.x,g2.y-g.y).toFixed(2)});
  await E(()=>{player.resonance=100;player.egoCD=0;player.ego=0;});await press('f');const f=await snap();rec('sc08','F EGO: 공명 30 소모·발동',f.ego>0&&f.res<=70.5,{ego:f.ego,res:f.res});
  await step(3.4);const f2=await snap();rec('sc08','EGO 끝남',f2.ego===0,{ego:f2.ego});
  await E(()=>{player.resonance=10;player.egoCD=0;});await press('f');const f3=await snap();rec('sc08','공명 모자라면 EGO 안 나감',f3.ego===0,{ego:f3.ego});await end('sc08');}

 // ---- SC09 전환 난타(무작위 입력) ----
 if(want('sc09')){await begin('sc09');await safeHp();await toEnemy();let seed=ALL.indexOf(hero)*7919+13;const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;};const held=new Set();let deaths=0;
  for(let i=0;i<150;i++){const r=rnd();
   if(r<.3){const k=['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'][Math.floor(rnd()*4)];if(held.has(k)){await p.keyboard.up(k);held.delete(k);}else{await p.keyboard.down(k);held.add(k);}}
   else if(r<.45){if(held.has('a')){await p.keyboard.up('a');held.delete('a');}else{await p.keyboard.down('a');held.add('a');}}
   else if(r<.75){await press(['q','w','e','r','s','f'][Math.floor(rnd()*6)]);}
   else if(r<.83){if(held.has('d')){await p.keyboard.up('d');held.delete('d');}else{await p.keyboard.down('d');held.add('d');}}
   else if(r<.9){await E(()=>{const e=__HQ795.pickEnemy();if(e)hurt(12,e);});}
   else if(r<.95){await E(()=>{player.resonance=100;});}
   const st=await step(.08+rnd()*.3);if(st.stoppedBy==='dead'||st.stoppedBy==='modal'){deaths++;for(const k of held)await p.keyboard.up(k);held.clear();const dead=await E(()=>player.hp<=0);if(dead)await p.waitForFunction(()=>modal&&!!document.getElementById('reviveHome')&&!document.getElementById('modal').classList.contains('hidden'),null,{timeout:8000}).catch(()=>{});const m=await E(()=>({hp:player.hp,modal,death:player.hp<=0&&!!document.getElementById('reviveHome')}));if(m.death){await p.locator('#reviveHome').click();await p.waitForFunction(()=>!loading&&!modal,null,{timeout:120000}).catch(()=>{});await skip(p);await go(p,ZONE);await safeHp();await toEnemy();}else{await skip(p);}}
   if(i%25===24){await safeHp();if(await E(()=>__HQ795.nearestLive(player.x,player.y)>9))await toEnemy();}}
  for(const k of held)await p.keyboard.up(k);await safeHp();await toOpen();await step(2.5);const s=await snap();
  rec('sc09','난타 뒤 키 상태 비워짐',s.keys.length===0,s.keys);rec('sc09','난타 뒤 방어 꺼짐',!s.guard,'');rec('sc09','난타 뒤 동작값 복귀',s.attackAnim===0&&s.skillAnim===0,{aa:s.attackAnim,sa:s.skillAnim});rec('sc09','난타 뒤 가만히 서 있음',!s.moving,'');rec('sc09','난타 중 사망 횟수(참고)',null,{deaths});
  await down('ArrowLeft');await step(.5);const s2=await snap();await up('ArrowLeft');rec('sc09','난타 뒤 걷기 정상',Math.hypot(s2.x-s.x,s2.y-s.y)>1.5,{d:+Math.hypot(s2.x-s.x,s2.y-s.y).toFixed(2)});await end('sc09');}

 // ---- SC10 사망·쉼터 복귀 ----
 if(want('sc10')){await begin('sc10');await toOpen();await down('ArrowRight','a');await step(.3);const res=await E(()=>{player.invincible=0;player.shield=0;player.guard=false;player.hp=1;const r=hurt(99999,{forcedStory:true});return {r,hp:player.hp,keys:[...keys]};});await p.waitForFunction(()=>modal&&!!document.getElementById('reviveHome')&&!document.getElementById('modal').classList.contains('hidden'),null,{timeout:8000}).catch(()=>{});Object.assign(res,await E(()=>({modal,btn:!!document.getElementById('reviveHome')&&!document.getElementById('modal').classList.contains('hidden')})));
  rec('sc10','체력 0 → (쓰러짐 연출 뒤) 사망 창',res.hp===0&&res.modal&&res.btn,res);rec('sc10','사망 순간 눌린 키 비움',res.keys.length===0,res.keys);await up('ArrowRight','a');
  if(res.btn){await p.locator('#reviveHome').click();await p.waitForFunction(()=>!loading&&!modal&&player.hp>0,null,{timeout:120000}).catch(()=>{});await skip(p);const s=await snap();
   rec('sc10','쉼터에서 되살아남',s.hp>0&&!s.modal&&!s.loading,{hp:s.hp,zone:s.zone,modal:s.modal});await step(.5);const s1=await snap();rec('sc10','되살아난 뒤 혼자 걷지 않음',!s1.moving&&s1.keys.length===0,{moving:s1.moving,keys:s1.keys});
   await down('ArrowLeft');await step(.5);const s2=await snap();await up('ArrowLeft');rec('sc10','되살아난 뒤 걷기',Math.hypot(s2.x-s1.x,s2.y-s1.y)>1||null,{d:+Math.hypot(s2.x-s1.x,s2.y-s1.y).toFixed(2),zone:s2.zone});
   await go(p,ZONE2);await safeHp();const e=await toEnemy();const hp0=await E(()=>__HQ795.enemyHpSum());await down('a');await step(3);await up('a');const dealt=hp0-await E(()=>__HQ795.enemyHpSum());rec('sc10','되살아난 뒤 전투 지역에서 공격',dealt>0,{dealt:+dealt.toFixed(1),e});}
  await end('sc10');}

 // ---- SC11 지역 전환(키 누른 채·시전 중) ----
 if(want('sc11')){await begin('sc11');await go(p,ZONE2);await safeHp();await toEnemy();await down('ArrowLeft','a');await step(.3);await press('q');await step(.1);
  const pr=E(async()=>{await enterRegion('hub',null,{layer:'STORY',restore:true});return true;});await p.waitForTimeout(150);await up('ArrowLeft','a');await pr;await p.waitForFunction(()=>!loading&&zone==='hub',null,{timeout:150000});await skip(p);
  const s=await snap();rec('sc11','전환 중 뗀 키가 남지 않음',s.keys.length===0,s.keys);await step(1);const s1=await snap();rec('sc11','전환 뒤 혼자 걷지 않음',!s1.moving&&Math.hypot(s1.x-s.x,s1.y-s.y)<.05,{moving:s1.moving,d:+Math.hypot(s1.x-s.x,s1.y-s.y).toFixed(2)});
  rec('sc11','전환 뒤 아군 탄·방어 남지 않음',s1.shots===0&&!s1.guard,{shots:s1.shots,guard:s1.guard});
  await down('ArrowRight');await step(.5);const s2=await snap();await up('ArrowRight');rec('sc11','쉼터에서 걷기(참고)',null,{d:+Math.hypot(s2.x-s1.x,s2.y-s1.y).toFixed(2)});
  await go(p,ZONE2);await step(.3);const s3=await snap();const inside=await E(()=>blocked(player.x,player.y,.2));rec('sc11','전투 지역 재진입: 벽 속 아님·동작값 정상',!inside&&s3.hp>0,{inside,pos:[s3.x,s3.y]});
  await safeHp();const e=await toEnemy();const hp0=await E(()=>__HQ795.enemyHpSum());await down('a');await step(3);await up('a');const dealt=hp0-await E(()=>__HQ795.enemyHpSum());rec('sc11','재진입 뒤 공격',dealt>0,{dealt:+dealt.toFixed(1)});await end('sc11');}

 // ---- SC12 모드: 반자동·A 오토·길잡이 ----
 if(want('sc12')){await begin('sc12');await safeHp();await E(()=>{if(auto)setTimeout(()=>{},0);});let s=await snap();if(s.auto){await press(' ');s=await snap();}
  await toEnemy();const hp0=await E(()=>__HQ795.enemyHpSum());await press(' ');const a0=await snap();rec('sc12','Space 로 반자동 켜짐',a0.auto,'');let dealt=0;for(let t=0;t<5&&dealt<=0;t+=.5){await step(.5);dealt=hp0-await E(()=>__HQ795.enemyHpSum());}
  rec('sc12','반자동: 손 떼도 공격',dealt>0,{dealt:+dealt.toFixed(1)});const b=await snap();const dir=await E(()=>{for(const [n,[dx,dy]] of [['ArrowRight',[1,-1]],['ArrowLeft',[-1,1]],['ArrowUp',[-1,-1]],['ArrowDown',[1,1]]]){const m=Math.hypot(dx,dy);if(__HQ795.dummyMove(dx/m*3,dy/m*3)>2.6)return n;}return 'ArrowRight';});
  await down(dir);await step(.6);const c=await snap();await up(dir);rec('sc12','반자동 중 방향키로 걷기',Math.hypot(c.x-b.x,c.y-b.y)>1.5,{d:+Math.hypot(c.x-b.x,c.y-b.y).toFixed(2)});
  await press(' ');const a1=await snap();rec('sc12','Space 로 반자동 꺼짐',!a1.auto,'');
  // A 오토(R597): A 만 누르고 있어도 배운 스킬이 나감
  await waitCD(()=>player.specialCD<=0,40);await safeHp();await toEnemy();await down('a');let cast=false;for(let t=0;t<8&&!cast;t+=.5){await toEnemy();/* 빠른 영웅은 붙은 몹을 바로 잡아 사거리 안이 비므로 박자마다 다시 붙는다 */await step(.5);const q=await snap();cast=q.specialCD>0||Object.values(q.wer).some(v=>v>0&&v<1e5);}await up('a');rec('sc12','A 오토: A 만 눌러도 스킬 자동 시전',cast,await E(()=>window.__STORYWORLD_AUTO_A_R597__?.stats||null));
  // 길잡이
  await safeHp();await toOpen(10);const g0=await snap();await E(()=>{guide=true;auto=true;guideTimer=0;window.__STORYWORLD_GUIDE_R77__?.syncGuide?.();});await step(3);const g1=await snap();rec('sc12','길잡이: 스스로 움직이거나 싸움',Math.hypot(g1.x-g0.x,g1.y-g0.y)>1||g1.attackCD>0||g1.command!=null,{d:+Math.hypot(g1.x-g0.x,g1.y-g0.y).toFixed(2),cmd:g1.command});
  await down('ArrowDown');await step(.5);const g2=await snap();await up('ArrowDown');rec('sc12','길잡이 중 방향키 누르면 길잡이 꺼지고 걷기',!g2.guide,{guide:g2.guide});await E(()=>{guide=false;auto=false;window.__STORYWORLD_GUIDE_R77__?.syncGuide?.();route=[];command=null;});await step(.5);await end('sc12');}

 // ---- SC13 창 열림·초점 잃음 ----
 if(want('sc13')){await begin('sc13');await safeHp();await toOpen();await down('ArrowRight','a');await step(.3);await p.keyboard.press('Escape');const m=await snap();
  if(m.modal){await up('ArrowRight','a');await E(()=>closePanel(true));await step(.5);const s=await snap();rec('sc13','메뉴 연 동안 뗀 키: 닫은 뒤 혼자 걷지 않음',!s.moving&&s.keys.length===0,{moving:s.moving,keys:s.keys});}else{await up('ArrowRight','a');rec('sc13','Esc 로 메뉴 열림(참고)',null,{modal:m.modal});}
  await toOpen();await down('ArrowRight');await step(.3);await E(()=>{window.dispatchEvent(new Event('blur'));});await step(.6);const b1=await snap();await step(.4);const b2=await snap();
  rec('sc13','창 초점 잃으면 걷기 멈춤(키 뗌을 못 받아도)',!b2.moving&&Math.hypot(b2.x-b1.x,b2.y-b1.y)<.05,{moving:b2.moving,keys:b2.keys,d:+Math.hypot(b2.x-b1.x,b2.y-b1.y).toFixed(2)});await up('ArrowRight');await step(.2);
  await toOpen();await down('d');await step(.2);await E(()=>{window.dispatchEvent(new Event('blur'));});await step(.3);const b3=await snap();rec('sc13','창 초점 잃으면 공명방어 풀림',!b3.guard,{guard:b3.guard});await up('d');await step(.2);await end('sc13');}

 // ---- SC14 게임 중 영웅 바꾸기(영웅 단추) ----
 if(want('sc14')){await begin('sc14');await go(p,ZONE2);await safeHp();await toOpen();const next=ALL[(ALL.indexOf(hero)+1)%ALL.length];
  const sw=async to=>{await releaseAll();await E(()=>document.getElementById('r263HeroBtn').click());/* 좁은 화면(640)에서는 위쪽 단추 줄이 접혀 있어 DOM 으로 누른다 */await p.locator(`#panel [data-hero="${to}"]`).first().click({timeout:8000});await p.locator('#chooseHero').click({timeout:8000});await p.waitForFunction(to=>!loading&&!modal&&player.hero===to,to,{timeout:120000});await step(.4);};
  let okSw=true;try{await sw(next);}catch(e){okSw=false;rec('sc14','영웅 단추로 바꾸기',false,String(e).slice(0,300));await E(()=>{if(modal)closePanel(true);});}
  if(okSw){const s=await snap();rec('sc14',`영웅 단추로 ${next} 로 바꿈`,s.hero===next,s.hero);const d=await E(()=>__HQ795.heroDrawn());rec('sc14','바꾼 영웅 몸 그림이 그려짐',d.hero.length>0,d);rec('sc14','이전 영웅 그림이 남지 않음',d.others.length===0,d.others);
   rec('sc14','바꾼 뒤 상태값 정상(콤보·EGO·보호막 0)',s.combo===0&&s.ego===0&&s.shield===0,{combo:s.combo,ego:s.ego,shield:s.shield});
   await safeHp();const e=(await toEnemy())?.id||null;
   const hp0=await E(()=>__HQ795.enemyHpSum());await E(()=>__HQ795.resetSeen());await down('a');await step(3);await up('a');const dealt=hp0-await E(()=>__HQ795.enemyHpSum());rec('sc14','바꾼 영웅으로 기본공격 피해',dealt>0,{dealt:+dealt.toFixed(1),e,why:e?null:await E(()=>__HQ795.engageWhy(HEROES[player.hero].melee||['blade','heavy'].includes(HEROES[player.hero].type)))});rec('sc14','바꾼 영웅 공격 동작',await E(()=>__HQ795.seenF.aa),'');
   for(const k of ['q','w','e','r']){/* 아직 안 배운 칸(단계 0)은 잠겨 있는 것이 맞다 — 배운 칸만 시전해 본다 */if(k!=='q'&&!((await snap()).ranks[k]>=1)){rec('sc14',`바꾼 영웅 ${k.toUpperCase()} 잠김(안 배움)`,null,'');continue;}await toOpen();let rdy=false;for(let t=0;t<60&&!rdy;t++){rdy=(await E(k=>__HQ795.hudCd(k),k))===0;if(!rdy)await step(1);}await safeHp();await toEnemy();await press(k);await step(.1);const cd=await E(k=>__HQ795.hudCd(k),k);rec('sc14',`바꾼 영웅 ${k.toUpperCase()} 시전`,rdy&&cd>0&&cd<=120,{rdy,cd});await step(1.5);}
   await toOpen();const w0=await snap();await down('ArrowLeft');await step(.5);const w1=await snap();await up('ArrowLeft');rec('sc14','바꾼 영웅 걷기',Math.hypot(w1.x-w0.x,w1.y-w0.y)>1.5,{d:+Math.hypot(w1.x-w0.x,w1.y-w0.y).toFixed(2)});
   try{await sw(hero);const b2=await snap();rec('sc14','원래 영웅으로 되돌림',b2.hero===hero,b2.hero);const d2=await E(()=>__HQ795.heroDrawn());rec('sc14','되돌린 영웅 몸 그림',d2.hero.length>0&&d2.others.length===0,d2);
    await safeHp();const eB=await toEnemy();const whyB=eB?null:await E(m=>__HQ795.engageWhy(m),MELEE.has(hero));const near0=await E(()=>{const d=__HQ795.nearestLive(player.x,player.y);return Number.isFinite(d)?+d.toFixed(2):null;});const fB0=eB?await E(id=>__HQ795.hitFacts(id),eB.id):null;const comboB0=(await snap()).combo;const h1=await E(()=>__HQ795.enemyHpSum());await E(()=>__HQ795.resetSeen());await down('a');const stB=await step(3);await up('a');const dB=h1-await E(()=>__HQ795.enemyHpSum());const sB=await snap();
    /* 실패했을 때 '붙을 몹이 없었다'와 '붙었는데 안 맞았다'를 가를 수 있게 본 것을 그대로 적는다 */
    rec('sc14','되돌린 뒤 기본공격 피해',dB>0,{dealt:+dB.toFixed(1),engaged:eB?.id||null,why:whyB,combo:[comboB0,sB.combo],before:fB0,after:eB?await E(id=>__HQ795.hitFacts(id),eB.id):null,nearBefore:near0,attackAnimSeen:await E(()=>__HQ795.seenF.aa),stoppedBy:stB?.stoppedBy||null,hp:sB.hp,live:await E(()=>room.enemies.filter(e=>e.hp>0&&!e.boss).length),modal:await E(()=>!!modal)});}catch(e){rec('sc14','원래 영웅으로 되돌림',false,String(e).slice(0,300));await E(()=>{if(modal)closePanel(true);});}}
  await toOpen();await step(1);await end('sc14');}

 // ---- SC15 속박(이동 잠금) 수명 ----
 if(want('sc15')){await begin('sc15');await go(p,ZONE2);await safeHp();await toOpen(9);
  const info=await E(()=>{const R=window.__STORYWORLD_COMBAT_R137__,r58=window.__STORYWORLD_REGIONAL_COMBAT_R58__;const mob=__HQ795.pickEnemy();const boss=room.enemies.find(e=>e.hp>0&&R?.rootBoss?.(e));return {mob:mob?.id||null,boss:boss?.id||null,bind58:!!r58?.defs?.bind};});rec('sc15','속박 시험 준비(참고)',null,info);
  const inflict=id=>E(id=>{const r58=window.__STORYWORLD_REGIONAL_COMBAT_R58__,e=room.enemies.find(v=>v.id===id);if(!e||!r58?.defs?.bind)return 'no';player.invincible=0;player.shield=0;player.guard=false;const hp=player.hp;const r=hurt(4,{owner:e.id,x:e.x,y:e.y,r58Affliction:{...r58.defs.bind,key:'bind'}});return {r,lost:+(hp-player.hp).toFixed(1),bound:!!window.__STORYWORLD_COMBAT_R137__?.bound?.(),st:__HQ795.statusLabels()};},id);
  const walk=async(sec=.6)=>{const dir=await E(()=>{for(const [n,[dx,dy]] of [['ArrowRight',[1,-1]],['ArrowLeft',[-1,1]],['ArrowUp',[-1,-1]],['ArrowDown',[1,1]]]){const m=Math.hypot(dx,dy);if(__HQ795.dummyMove(dx/m*3,dy/m*3)>2.6)return n;}return 'ArrowRight';});const a=await snap();await down(dir);await step(sec);const b=await snap();await up(dir);return +Math.hypot(b.x-a.x,b.y-a.y).toFixed(2);};
  if(info.mob&&info.bind58){const r=await inflict(info.mob);const d=await walk();rec('sc15','일반 몹의 속박은 걷기를 막지 않음(R137: 뿌리 보스만)',r!=='no'&&!r.bound&&d>1.5,{r,d});await step(2.6);}
  if(info.boss&&info.bind58){await toOpen(9);const r=await inflict(info.boss);const d=await walk(.5);rec('sc15','뿌리 보스 속박(참고: 걸리면 걷기 막힘)',null,{r,d});
   if(r!=='no'&&r.bound){await E(()=>{player.blinkCD=0;});const a=await snap();await down('ArrowRight');await press('s');await up('ArrowRight');const b=await snap();rec('sc15','속박 중 블링크로 빠져나감',Math.hypot(b.x-a.x,b.y-a.y)>1.5,{d:+Math.hypot(b.x-a.x,b.y-a.y).toFixed(2)});
    let freeAt=null;for(let t=0;t<5;t+=.25){if(!await E(()=>!!window.__STORYWORLD_COMBAT_R137__?.bound?.())){freeAt=t;break;}await step(.25);}rec('sc15','속박이 2.5초 안에 풀림',freeAt!==null&&freeAt<=2.5,{freeAt});const d2=await walk();rec('sc15','속박 풀린 뒤 걷기',d2>1.5,{d:d2});
    await toOpen(9);await safeHp();const r2=await inflict(info.boss);await down('d');await step(.15);await up('d');await step(.1);const b2=await E(()=>!!window.__STORYWORLD_COMBAT_R137__?.bound?.());const d3=await walk();rec('sc15','공명방어(D)로 속박 해제 뒤 걷기',!b2&&d3>1.5,{bound:b2,d:d3,r2});
    await toOpen(9);await safeHp();await inflict(info.boss);await E(async()=>{await enterRegion('hub',null,{layer:'STORY',restore:true});});await p.waitForFunction(()=>!loading&&zone==='hub',null,{timeout:150000});await skip(p);const b3=await E(()=>!!window.__STORYWORLD_COMBAT_R137__?.bound?.());const d4=await walk();rec('sc15','속박된 채 지역 이동: 속박 안 남음',!b3&&d4>1,{bound:b3,d:d4});await go(p,ZONE2);}}
  await toOpen();await step(.5);await end('sc15');}

 // ---- SC16 저장 → 새로 열기 → 이어하기 ----
 if(want('sc16')){await begin('sc16');await go(p,ZONE2);await safeHp();await toOpen();await step(.5);const before=await snap();const saved=await E(()=>saveGame(false));rec('sc16','저장됨',saved===true,saved);await end('sc16');
  await p.reload();let cont=true;try{await p.locator('#campaignContinue54').click({timeout:180000});await p.waitForFunction(()=>started&&!loading&&(!modal||!!storyScene),null,{timeout:240000});await p.waitForTimeout(600);await skip(p);await p.waitForFunction(()=>started&&!loading&&!modal&&!storyScene,null,{timeout:60000});}catch(e){cont=false;rec('sc16','이어하기로 불러오기',false,String(e).slice(0,300));}
  if(cont){await p.addScriptTag({content:HELPER});sweep0=await E(()=>__HQ795.sweep());await begin('sc16');await step(.5);const s=await snap();
   rec('sc16','불러온 영웅·지역 같음',s.hero===before.hero&&s.zone===before.zone,{hero:s.hero,zone:s.zone,was:[before.hero,before.zone]});rec('sc16','불러온 스킬 단계 같음',JSON.stringify(s.ranks)===JSON.stringify(before.ranks),{now:s.ranks,was:before.ranks});rec('sc16','불러온 레벨·점수 같음',s.level===before.level&&s.points===before.points,{now:[s.level,s.points],was:[before.level,before.points]});
   const d=await E(()=>__HQ795.heroDrawn());rec('sc16','불러온 뒤 영웅 몸 그림',d.hero.length>0&&d.others.length===0,d);
   for(const k of ['w','e','r']){const vis=await E(k=>{updateHUD();const el=document.getElementById('story-wer-'+k);if(!el)return 'none';const cs=getComputedStyle(el);return (cs.display==='none'||cs.visibility==='hidden'||el.hidden)?'hidden':'shown';},k);const hc=await E(k=>__HQ795.hudCd(k),k);rec('sc16',`불러온 뒤 ${k.toUpperCase()} 단추·재사용 숫자`,(s.ranks[k]>=1?(vis==='shown'&&hc<200):vis!=='shown'),{vis,hud:hc,rank:s.ranks[k]});}
   await toOpen();const w0=await snap();await down('ArrowRight');await step(.5);const w1=await snap();await up('ArrowRight');rec('sc16','불러온 뒤 걷기',Math.hypot(w1.x-w0.x,w1.y-w0.y)>1.5,{d:+Math.hypot(w1.x-w0.x,w1.y-w0.y).toFixed(2)});
   await safeHp();const e16=await toEnemy();const why16=e16?null:await E(m=>__HQ795.engageWhy(m),MELEE.has(hero));const hp0=await E(()=>__HQ795.enemyHpSum());await E(()=>__HQ795.resetSeen());await down('a');await step(3);await up('a');const d16=hp0-await E(()=>__HQ795.enemyHpSum());rec('sc16','불러온 뒤 기본공격 피해',d16>0,{dealt:+d16.toFixed(1),engaged:e16?.id||null,attackAnimSeen:await E(()=>__HQ795.seenF.aa),why:why16});
   for(const k of ['q','w']){if(!(s.ranks[k]>=1))continue;await toOpen();let rdy=false;for(let t=0;t<60&&!rdy;t++){rdy=(await E(k=>__HQ795.hudCd(k),k))===0;if(!rdy)await step(1);}await safeHp();await toEnemy();await press(k);await step(.1);const cd=await E(k=>__HQ795.hudCd(k),k);rec('sc16',`불러온 뒤 ${k.toUpperCase()} 시전`,rdy&&cd>0&&cd<=120,{rdy,cd});}
   await toOpen();await step(1);await end('sc16');}}
 }catch(e){rec('fatal','검사 실행 중 예외',false,String(e.stack||e).slice(0,600));}
 await ctx.close().catch(()=>{});}

const b=await chromium.launch();const rows=[];const list=heroes.length?heroes:ALL;
for(const h of list){const t0=Date.now();console.log('▶',h);for(const part of ['A','B']){if(only.length&&!only.some(sc=>(+sc.slice(2,4)<10)===(part==='A')))continue;await runHero(b,h,rows,part);}console.log('  done',h,((Date.now()-t0)/1000).toFixed(0)+'s','fail',rows.filter(r=>r.hero===h&&r.pass===false).length);}
await b.close();
const fails=rows.filter(r=>r.pass===false);const tagN=list.length===ALL.length&&!only.length?'':'-'+list.join('_')+(only.length?'-'+only.join('_'):'');
fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,`results${tagN}.json`),JSON.stringify({url:URL,zone:ZONE,heroes:list,total:rows.length,passed:rows.filter(r=>r.pass===true).length,failed:fails.length,info:rows.filter(r=>r.pass===null).length,rows},null,1));
// 영웅 × 상황 표
const scs=[...new Set(rows.map(r=>r.sc))];let md='| 상황 | '+list.join(' | ')+' |\n|---|'+list.map(()=>'---').join('|')+'|\n';
for(const sc of scs){md+='| '+sc+' | '+list.map(h=>{const rs=rows.filter(r=>r.hero===h&&r.sc===sc&&r.pass!==null);const f=rs.filter(r=>!r.pass).length;return rs.length?(f?`✗ ${f}/${rs.length}`:`✓ ${rs.length}`):'–';}).join(' | ')+' |\n';}
md+='\n실패 목록\n';for(const f of fails)md+=`- ${f.hero} ${f.sc} · ${f.check} · ${f.detail.slice(0,300)}\n`;
fs.writeFileSync(path.join(OUT,`results${tagN}.md`),md);console.log(md);console.log(`TOTAL ${rows.length} pass ${rows.length-fails.length-rows.filter(r=>r.pass===null).length} fail ${fails.length} info ${rows.filter(r=>r.pass===null).length}`);
process.exit(fails.length?1:0);
