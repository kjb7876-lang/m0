// R1064 브라우저 검사(헤드리스): ep1b05 의 공격 그림 없는 몹(붉은 하이힐 칼날 b05-a1 · 립스틱 탄환 b05-p2)이 'lunge' 로 판정되고 공격 중 몸 그림이 자리를 옮기는지,
//  공격 그림이 있는 몹(얼굴 없는 남자의 박수 b05-p1)은 'art' 로 남는지, 오류 0 인지 본다. 몹은 불사(hp getter)로 묶고 집(home)을 영웅 곁으로 옮겨 실제로 공격하게 한다.
// 사용: URL=http://127.0.0.1:4411/m0/ node r96/qa/r1064/r1064-browser.mjs [shot.png]
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.URL||'http://127.0.0.1:4396/';const SHOT=process.argv[2]||null;
const skip=p=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(typeof modal!=='undefined'&&modal)closePanel(true);});
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
ok(await p.evaluate(()=>!!window.__STORYWORLD_MOB_LUNGE_R1064__&&drawEnemy.toString().length>0),'overlay installed');
await p.evaluate(()=>enterRegion('ep1b05',null,{layer:'STORY',restore:true}));await p.waitForFunction(()=>!loading&&room?.id==='ep1b05',null,{timeout:150000});await skip(p);
// 몸 그림 자리 기록: 공격 중 몸 명령 가운데가 같은 순간 몹 자리 투영과 얼마나 떨어졌나(픽셀)
await p.evaluate(()=>{window.__R1064={shift:{},grp:[]};const r=window.__STORYWORLD_PHASE1__.controller.state.three;const f=r.render;r.render=function(fr){try{for(const e of room.enemies){if(!window.__R1064.grp.includes(e.id)||!e.attack)continue;
   const B=fr.commands.filter(c=>c.kind==='image'&&c.owner?.kind==='enemy'&&String(c.owner.id||'').replace(/^(enemy:|r\d+:mob:)/,'')===e.id&&c.points);if(!B.length)continue;
   const c=B.sort((a,b)=>Math.abs(b.points[3][1]-b.points[0][1])-Math.abs(a.points[3][1]-a.points[0][1]))[0];const P=c.points;const mx=(P[2][0]+P[3][0])/2,my=(P[2][1]+P[3][1])/2;
   const k=e.nativeId;const S=window.__R1064.shift[k]||(window.__R1064.shift[k]={n:0,xs:[]});S.n++;if(S.xs.length<400)S.xs.push([Math.round(mx),Math.round(my),e.attack.id]);}}catch(_){}return f.apply(this,arguments);};});
const pick=['b05-a1','b05-p2','b05-p1'];// b05-p2 립스틱 탄환은 원거리(조준)라 근접 내딛기 대상 아님 — 오류만 본다
const ids=await p.evaluate(pick=>{const out=[];for(const k of pick){const e=room.enemies.find(x=>x.nativeId===k&&x.hp>0&&!x.boss&&!x.midboss);if(e)out.push(e.id);}let k=0;
 for(const e of room.enemies){if(!out.includes(e.id)){if(e.hp>0&&Math.hypot(e.x-player.x,e.y-player.y)<9){e.x=player.x+14;e.y=player.y+3;e.homeX=e.x;e.homeY=e.y;}continue;}
  const a=k++*2.1;e.x=player.x+Math.cos(a)*1.3;e.y=player.y+Math.sin(a);e.homeX=player.x;e.homeY=player.y;e.cd=0;e.graceUntil=0;const mh=e.maxHp;Object.defineProperty(e,'hp',{configurable:true,enumerable:true,get(){return mh;},set(v){}});}
 window.__R1064.grp=out;return out;},pick);
ok(ids.length===3,'three test mobs present ('+ids.length+')');
const t0=await p.evaluate(()=>time);let shot=false;
await p.waitForFunction(a=>{try{player.hp=player.maxHp;if(storyScene)advanceScene();}catch(_){}return time>=a;},t0+14,{timeout:600000,polling:400});
const I=await p.evaluate(()=>window.__STORYWORLD_MOB_LUNGE_R1064__.inspect());const SH=await p.evaluate(()=>window.__R1064.shift);
const V=await p.evaluate(ids=>Object.fromEntries(room.enemies.filter(e=>ids.includes(e.id)).map(e=>[e.nativeId,window.__STORYWORLD_MOB_LUNGE_R1064__.verdict(e)])),ids);
console.log('verdicts',JSON.stringify(V),'stats',JSON.stringify(I.stats));
const K=await p.evaluate(ids=>Object.fromEntries(room.enemies.filter(e=>ids.includes(e.id)).map(e=>[e.nativeId,window.__STORYWORLD_MOB_MOTION_R286__?.kindOf?.(e)])),ids);console.log('r286 kinds',JSON.stringify(K));
// 붉은 하이힐 칼날: R380 시트 공격 1칸뿐 → R286 move-only 내딛기(R1064 수정 뒤) 또는 R1064 lunge 중 하나가 맡아야 한다(둘 다는 안 됨)
ok((K['b05-a1']==='move-only')!==(V['b05-a1']==='lunge'),'b05-a1 lunge handled by exactly one of R286/R1064 ('+K['b05-a1']+'/'+V['b05-a1']+')');
ok(V['b05-p1']!=='lunge','b05-p1 (attack art) not lunge: '+V['b05-p1']);
ok(I.stats.errors===0,'overlay errors 0 '+(I.lastError||''));
ok(errs.length===0,'page errors 0 '+JSON.stringify(errs.slice(0,3)));
// ② R286 이 R380 공격 칸 있는 몹을 move-only 로 봐 공격 그림을 가리던 것: 보랏빛 알집지기(dist01) 공격 중 시트 4~7칸(x>=1024)이 그려져야 한다.
async function atkCells(zone,nid,secs=12){await p.evaluate(z=>enterRegion(z,null,{layer:'STORY',restore:true}),zone);await p.waitForFunction(z=>!loading&&room?.id===z,zone,{timeout:150000});await skip(p);
 const id=await p.evaluate(nid=>{const e=room.enemies.find(x=>x.nativeId===nid&&x.hp>0&&!x.boss&&!x.midboss&&!/우두머리|중간보스/.test(x.name));if(!e)return null;
  for(const o of room.enemies){if(o!==e&&o.hp>0&&Math.hypot(o.x-player.x,o.y-player.y)<9){o.x=player.x+14;o.y=player.y+3;o.homeX=o.x;o.homeY=o.y;}}
  e.x=player.x+1.2;e.y=player.y;e.homeX=player.x;e.homeY=player.y;e.cd=0;e.graceUntil=0;const mh=e.maxHp;Object.defineProperty(e,'hp',{configurable:true,enumerable:true,get(){return mh;},set(v){}});
  window.__R1064.cells={};window.__R1064.watch=e.id;window.__R1064.kind=window.__STORYWORLD_MOB_MOTION_R286__?.kindOf?.(e);
  const r=window.__STORYWORLD_PHASE1__.controller.state.three;if(!r.render.__r1064c){const f=r.render;r.render=function(fr){try{const w=room.enemies.find(x=>x.id===window.__R1064.watch);if(w&&w.attack){for(const c of fr.commands){if(c.kind==='image'&&c.owner?.kind==='enemy'&&String(c.owner.id||'').endsWith(w.id)&&c.sourceRect){const k=String(c.sourcePath||'').replace(/^.*assets\//,'')+'#'+Math.round(c.sourceRect[0])+','+Math.round(c.sourceRect[1]);window.__R1064.cells[k]=(window.__R1064.cells[k]||0)+1;}}}}catch(_){}return f.apply(this,arguments);};r.render.__r1064c=true;}
  return e.id;},nid);
 if(!id)return null;const S0=await p.evaluate(()=>({a:{...window.__STORYWORLD_MOB_MOTION_R286__.inspect().stats},b:{...window.__STORYWORLD_MOB_LUNGE_R1064__.inspect().stats}}));const t=await p.evaluate(()=>time);await p.waitForFunction(a=>{try{player.hp=player.maxHp;if(storyScene)advanceScene();}catch(_){}return time>=a;},t+secs,{timeout:600000,polling:400});
 const S1=await p.evaluate(()=>({a:{...window.__STORYWORLD_MOB_MOTION_R286__.inspect().stats},b:{...window.__STORYWORLD_MOB_LUNGE_R1064__.inspect().stats}}));
 const d=(o,n,k)=>(+n[k]||0)-(+o[k]||0);
 return await p.evaluate(x=>({kind:window.__R1064.kind,cells:window.__R1064.cells,...x}),{r286Lunges:d(S0.a,S1.a,'lunges'),r286Static:d(S0.a,S1.a,'staticLunges'),r1064Lunges:d(S0.b,S1.b,'lunges'),r1064Draws:d(S0.b,S1.b,'lungeDraws')});}
const dragon=await atkCells('ep1b07','b07-s1',14);const DV=await p.evaluate(()=>{const e=room.enemies.find(x=>x.id===window.__R1064.watch);return {v:window.__STORYWORLD_MOB_LUNGE_R1064__.verdict(e),st:window.__STORYWORLD_MOB_LUNGE_R1064__.inspect().stats};});
console.log('dragon',JSON.stringify(dragon),JSON.stringify(DV));
// R1064b(QA 지적): '둘 중 하나가 맡는다'만 보면 둘 다 안 내딛어도 통과할 수 있었다 → 실제 발동 수를 센다.
ok(dragon&&dragon.kind==='static'&&dragon.r286Static>=1&&DV.v!=='lunge','불길 속의 용: R286 static 내딛기가 실제로 발동 (staticLunges +'+dragon?.r286Static+', R1064 '+DV.v+')');
// R1064 자체 경로: R286 이 full 로 보지만 공격 중에도 걷기 그림만 그리는 몹(u205 관리자 추적견) → R1064 lunge 가 실제로 발동해야 한다
const hound=await atkCells('u205','u205-e2',14);const HV=await p.evaluate(()=>{const e=room.enemies.find(x=>x.id===window.__R1064.watch);return window.__STORYWORLD_MOB_LUNGE_R1064__.verdict(e);});
console.log('hound',JSON.stringify({kind:hound?.kind,r1064Lunges:hound?.r1064Lunges,r1064Draws:hound?.r1064Draws,v:HV}));
ok(hound&&hound.kind==='full'&&HV==='lunge'&&hound.r1064Lunges>=1&&hound.r1064Draws>=20,'관리자 추적견: R1064 lunge 실제 발동 (lunges +'+hound?.r1064Lunges+', draws +'+hound?.r1064Draws+', verdict '+HV+')');
const egg=await atkCells('dist01','dist01-sp2');console.log('eggkeeper',JSON.stringify(egg));
ok(egg&&egg.kind==='full','R286 sees eggkeeper as full ('+egg?.kind+')');
ok(egg&&egg.r1064Lunges===0,'eggkeeper (real attack art): R1064 does not lunge on top ('+egg?.r1064Lunges+')');
ok(egg&&Object.keys(egg.cells).some(k=>/purple-eggkeeper/.test(k)&&+k.split('#')[1].split(',')[0]>=1024),'eggkeeper attack draws sheet cells 4-7');
if(SHOT){await p.waitForFunction(()=>room.enemies.some(e=>window.__R1064.grp.includes(e.id)&&e.attack&&e.attack.r1064&&e.attack.elapsed>.3),null,{timeout:300000,polling:50}).catch(()=>{});await p.screenshot({path:SHOT});}
await b.close();console.log(fails?'R1064 browser FAILED '+fails:'R1064 browser passed');process.exit(fails?1:0);
