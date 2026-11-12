// R962 브라우저 검사(헤드리스·소프트웨어 렌더링 — 그래픽/실기기/자연 플레이 검증 아님): 무한 생존에서 영웅 확률 특수 패시브.
//  사용자 2026-11-12 14:35Z: "생존모드도 특수패시브스킬 적용해야해".
//  ① 조종 영웅은 다른 영웅(윤서하, 패시브 없음)으로 두고 꼼짝 못 하게 묶은 채, 배치 영웅(R720 몸)만 싸우게 한다.
//     → 배치된 환도·라우렌·슬레이어·미카엘라·네온·헌터·기억사수의 패시브가 각자 발동해 피해를 주는가(조종 영웅 것으로 잘못 굴리지 않는가).
//  ② 같은 영웅이 조종 영웅이자 배치 영웅일 때 상태(대기 시간)가 몸마다 따로인가, 조종 영웅 패시브도 생존에서 도는가.
//  ③ 최종보스 연출 R950 은 스토리 전용: 생존 cult04 무대에서는 꺼져 있어야 한다(생존 방이 id·layer 가 같아 스토리 방으로 착각하던 함정).
//  주사위는 각 모듈의 검사 훅으로 '항상 발동'(qaRandom: 발동 판정 0, 갈래 고르기 .6 → 라우렌 심연 왜성·미카엘라·네온 피해 갈래 / force)으로 고정한다 — 발동 길(누가 굴리는가)은 그대로 탄다.
//  SW_URL 기본 http://127.0.0.1:4410/m0/ , ONLY=1|2|3|4 로 한 묶음만.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',ONLY=process.env.ONLY||'';let fail=0;
const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,400):'');if(!c)fail++;};
const b=await chromium.launch();

async function survival(hero){
 const ctx=await b.newContext({viewport:{width:640,height:360}});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r663.skillgrowth',JSON.stringify({on:false}));});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:180000});
 await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator(`[data-r600hero="${hero}"]`).click();await p.locator('#r600Go').click();
 await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
 await p.evaluate(()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration());
 return {p,ctx,errs};
}
const A=(p,f,a)=>p.evaluate(f,a);
const waitGame=async(p,secs)=>{const t0=await A(p,()=>time);await p.waitForFunction(a=>time>=a,t0+secs,{timeout:600000});};
// 조종 영웅 묶기(스스로 공격·스킬 못 함, 맞아도 안 쓰러짐)
const lockMain=p=>A(p,()=>{window.__r962Lock=setInterval(()=>{try{if(player.r720Ally)return;player.invincible=9999;player.hp=maxHP();player.attackCD=900;player.specialCD=900;player.blinkCD=900;player.egoCD=900;}catch(_){}},50);auto=false;});
const unlockMain=p=>A(p,()=>{clearInterval(window.__r962Lock);player.attackCD=0;player.specialCD=0;auto=true;player.invincible=9999;});
// 패시브 피해(hitEnemy 출처 표식)를 몸별로 센다. 표식: r945·r946-·r947·r948-·r951-·r952(헌터 분대 몸)·r953
const tap=p=>A(p,()=>{const W=window.__r962={hits:{},byAlly:{},rolls:[]};const tag=s=>{if(!s||typeof s!=='object')return null;const k=String(s.kind||'');
  if(s.r945||/hwando-ink-r945/.test(k))return 'hwando';if(s.r946||/^r946-/.test(k))return 'lauren';if(s.r947||/slayer-blood-r947/.test(k))return 'slayer';
  if(s.r948||/^r948-/.test(k))return 'michaela';if(s.r951||/^r951-/.test(k))return 'neon';if(s.r949||/^r949-/.test(k))return 'seoha';if(s.r953||/gunner-veil-r953/.test(k))return 'gunner';return null;};
 const base=hitEnemy;hitEnemy=function(e,d,s,...r){const h=tag(s);if(h){W.hits[h]=(W.hits[h]||0)+1;if(player.r720Ally)W.byAlly[h]=(W.byAlly[h]||0)+1;}return base.call(this,e,d,s,...r);};
 // 라우렌·미카엘라·네온: 주사위를 '항상'으로 두고, 누가 굴렸는지(그때의 player) 적는다
 for(const [h,k] of [['lauren','LAUREN_CELESTIAL_R946'],['michaela','MICHAELA_HEART_R948'],['neon','NEON_STORM_R951'],['seoha','SEOHA_EPOCH_R949']]){const M=window['__STORYWORLD_'+k+'__'];let n=0;M?.qaRandom?.(()=>{const first=(n++%2)===0;if(first)W.rolls.push({h,ally:player.r720Ally===true,hero:player.hero,body:player,stack:player.r720Ally?'':(Error.stackTraceLimit=60,String(new Error().stack)).split('\n').slice(9,40).map(s=>s.trim().replace(/https?:\/\/[^/]+\/m0\//,'')).join(' | ')});return first?0:.6;});}
 // 배치 영웅이 쏜 투사체가 맞는 순간(그때의 player 가 누구인가)
 W.shotOf=new WeakMap();W.proj={};const ms=makeShot;makeShot=function(...a){const r=ms.apply(this,a);if(r&&player.r720Ally)W.shotOf.set(r,player);return r;};
 const he=hitEnemy;hitEnemy=function(e,d,s,...r){const by=s&&typeof s==='object'?W.shotOf.get(s):null;if(by){const k=by.hero+(player===by?':same':':other');W.proj[k]=(W.proj[k]||0)+1;
  /* 바깥(이 검사)에서는 아직 조종 영웅 차례다 → 안쪽에서 쏜 몸으로 끼워 주는가(R962) */if(player!==by&&window.__STORYWORLD_SURVIVAL_PASSIVES_R962__?.bodyOf?.(s)!==by)W.unrouted=(W.unrouted||0)+1;}return he.call(this,e,d,s,...r);};
});
const place=(p,list)=>A(p,list=>{const d=window.__STORYWORLD_HERO_DEFENSE_R720__,z=room.survivalR600.centre,out=[];d.qaGive(5000);
 const spots=[[2.2,1.2],[-2.2,1.2],[2.2,-1.4],[-2.2,-1.4]];list.forEach((h,i)=>{player.x=z.x+spots[i][0];player.y=z.y+spots[i][1];out.push(d.buy(h));});
 player.x=z.x;player.y=z.y+4.5;return {out,slots:d.state().slots.map(s=>s.hero)};},list);
const forceAll=p=>A(p,()=>{const d=window.__STORYWORLD_HERO_DEFENSE_R720__;let n=0;for(const body of d.bodies()){if(!body)continue;
 const M={hwando:['HWANDO_INK_R945','moon'],slayer:['SLAYER_BLOOD_PASSIVE_R947','needle'],gunner:['GUNNER_VEIL_R953','barrage'],hunter:['HUNTER_SQUAD_R952','call']}[body.hero];
 if(M){const m=window['__STORYWORLD_'+M[0]+'__'];if(m?.force?.(M[1],body))n++;}}return n;});
const errsOf=p=>A(p,()=>{const o={};for(const k of ['HWANDO_INK_R945','LAUREN_CELESTIAL_R946','SLAYER_BLOOD_PASSIVE_R947','MICHAELA_HEART_R948','NEON_STORM_R951','HUNTER_SQUAD_R952','GUNNER_VEIL_R953','SEOHA_EPOCH_R949','HERO_DEFENSE_R720','SURVIVAL_R600']){const m=window['__STORYWORLD_'+k+'__'];if(!m){o[k]='missing';continue;}const i=m.inspect?.();o[k]=i?(i.errors??i.stats?.errors??0):0;if(o[k])o[k+':last']=String(i.lastError||i.stats?.lastError||'').slice(0,200);}return o;});

// ---- 1: 배치된 라우렌·미카엘라·네온·헌터(조종 영웅 윤서하는 묶임) -----------------------------------------------------
if(!ONLY||ONLY==='1'){const {p,ctx,errs}=await survival('seoha');
 const pl=await place(p,['lauren','michaela','neon','hunter']);ok('1: four heroes placed',pl.slots.join()==='lauren,michaela,neon,hunter',pl);
 await lockMain(p);await tap(p);await waitGame(p,1);ok('1: hunter force set on its body',await forceAll(p)===1);
 const sq0=await A(p,()=>{const H=window.__STORYWORLD_HUNTER_SQUAD_R952__,d=window.__STORYWORLD_HERO_DEFENSE_R720__;const b=d.bodies().find(b=>b&&b.hero==='hunter');return H.inspect(b).stats.procs;});
 for(let k=0;k<6;k++){await waitGame(p,k?5:14);const h=await A(p,()=>window.__r962.hits);if(['lauren','michaela','neon'].every(x=>(h[x]||0)>0))break;}
 const r=await A(p,()=>{const W=window.__r962,H=window.__STORYWORLD_HUNTER_SQUAD_R952__,d=window.__STORYWORLD_HERO_DEFENSE_R720__,hb=d.bodies().find(b=>b&&b.hero==='hunter');
  const rolls={};for(const x of W.rolls){const k=x.h+(x.ally?':ally':':main('+x.hero+')');rolls[k]=(rolls[k]||0)+1;}
  return {hits:W.hits,rolls,proj:W.proj,unrouted:W.unrouted||0,routed:window.__STORYWORLD_SURVIVAL_PASSIVES_R962__?.inspect().stats,hunter:H.inspect(hb).stats,main:player.hero,allyStats:d.inspect().stats};});
 console.log('diag 1',JSON.stringify({rolls:r.rolls,hits:r.hits,proj:r.proj}));
 for(const h of ['lauren','michaela','neon']){ok(`1: placed ${h} rolls its passive as itself (ally body)`,(r.rolls[h+':ally']||0)>0,r.rolls);
  ok(`1: placed ${h} passive never rolls as the controlled hero`,!Object.keys(r.rolls).some(k=>k.startsWith(h+':main')),r.rolls);
  ok(`1: placed ${h} passive deals damage`,(r.hits[h]||0)>0,r.hits);}
 ok('1: every placed-hero shot that lands later is credited to the body that fired it',r.unrouted===0&&Object.keys(r.proj).length>0&&(r.routed?.routed+r.routed?.routedAsHero)>0,{proj:r.proj,unrouted:r.unrouted,routed:r.routed});
 ok('1: placed hunter squad fires (per-body state)',r.hunter.procs.call+r.hunter.procs.shade+r.hunter.procs.squad>sq0.call+sq0.shade+sq0.squad,{before:sq0,after:r.hunter});
 const e=await errsOf(p);ok('1: no passive module errors',Object.values(e).every(v=>v===0||(typeof v==='string'&&v!=='missing')),e);ok('1: no page errors',errs.length===0,errs);
 await ctx.close();}

// ---- 2: 조종 라우렌(묶임) + 배치 환도·슬레이어·기억사수·헌터 ---------------------------------------------------------
//  조종 라우렌이 아무것도 안 하는 동안 라우렌 패시브가 굴러서는 안 된다(코어 빛줄기·배치 영웅 투사체 타격을 조종 영웅 것으로 착각 금지).
//  (R720 은 조종 영웅과 같은 영웅을 배치하지 못한다 — 같은 영웅 두 몸은 생기지 않는다.)
if(!ONLY||ONLY==='2'){const {p,ctx,errs}=await survival('lauren');
 const pl=await place(p,['hwando','slayer','gunner','hunter']);ok('2: four heroes placed',pl.slots.join()==='hwando,slayer,gunner,hunter',pl);
 await lockMain(p);await tap(p);
 const per=async()=>A(p,()=>{const d=window.__STORYWORLD_HERO_DEFENSE_R720__,o={};for(const body of d.bodies()){if(!body)continue;const M={hwando:'HWANDO_INK_R945',slayer:'SLAYER_BLOOD_PASSIVE_R947',gunner:'GUNNER_VEIL_R953'}[body.hero];
  if(M)o[body.hero]=window['__STORYWORLD_'+M+'__'].inspect(body).stats;}return o;});
 const s0=await per(),c0=await A(p,()=>window.__STORYWORLD_SURVIVAL_R600__.inspect().stats.coreShots);
 const sum=o=>Object.entries(o||{}).reduce((a,[k,v])=>a+(typeof v==='number'&&/^(moons|cloneCasts|trios|needles|swordCasts|lattices|cloaks|barrages|summons)$/.test(k)?v:0),0);
 // 근접 영웅 발동은 벤 적이 있어야 한다 → 적 위치에 따라 늦을 수 있으니 5초씩 최대 8번(게임 40초) 다시 걸며 셋 다 발동·피해할 때까지 기다린다
 let s1=null;for(let k=0;k<8;k++){await forceAll(p);await waitGame(p,5);s1=await per();const h=await A(p,()=>window.__r962.hits);
  if(['hwando','slayer','gunner'].every(x=>sum(s1[x])>sum(s0[x])&&(h[x]||0)>0))break;}
 const c1=await A(p,()=>window.__STORYWORLD_SURVIVAL_R600__.inspect().stats.coreShots);
 for(const h of ['hwando','slayer','gunner'])ok(`2: placed ${h} passive procs on its own body`,sum(s1[h])>sum(s0[h]),{before:s0[h],after:s1[h]});
 let r=await A(p,()=>{const W=window.__r962,rolls={};for(const x of W.rolls){const k=x.h+(x.ally?':ally':':main');rolls[k]=(rolls[k]||0)+1;}return {hits:W.hits,rolls,proj:W.proj};});
 console.log('diag 2',JSON.stringify(r),'coreShots',c1-c0);console.log('main-roll stacks',JSON.stringify(await A(p,()=>window.__r962.rolls.filter(x=>!x.ally).map(x=>x.stack))));
 for(const h of ['hwando','slayer','gunner'])ok(`2: placed ${h} passive deals damage`,(r.hits[h]||0)>0,r.hits);
 ok('2: the core really fired during the locked window',c1>c0,{c0,c1});
 ok('2: locked controlled lauren never rolls (core beams / ally shots are not hers)',!(r.rolls['lauren:main']>0)&&!(r.hits.lauren>0),r);
 // 풀어 주면 조종 라우렌이 자기 타격으로 패시브를 굴린다(생존에서 조종 영웅 패시브)
 await unlockMain(p);await waitGame(p,8);
 r=await A(p,()=>{const W=window.__r962,rolls={};for(const x of W.rolls){const k=x.h+(x.ally?':ally':':main');rolls[k]=(rolls[k]||0)+1;}return {rolls,hits:W.hits};});
 ok('2: controlled lauren passive rolls and hits in survival',(r.rolls['lauren:main']||0)>0&&(r.hits.lauren||0)>0,r);
 const e=await errsOf(p);ok('2: no passive module errors',Object.values(e).every(v=>v===0||(typeof v==='string'&&v!=='missing')),e);ok('2: no page errors',errs.length===0,errs);
 await ctx.close();}

// ---- 3: 최종보스 연출 R950 은 생존 cult04 무대에서 꺼짐 ----------------------------------------------------------------
if(!ONLY||ONLY==='3'){const {p,ctx,errs}=await survival('hwando');
 const i=await A(p,()=>window.__STORYWORLD_SURVIVAL_R600__.stageIds().indexOf('cult04'));ok('3: survival visits cult04',i>=0,i);
 await A(p,i=>window.__STORYWORLD_SURVIVAL_R600__.qaGo(i),i);
 await p.waitForFunction(()=>room&&room.id==='cult04'&&room.survivalR600&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
 await A(p,()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration());await waitGame(p,2);
 const f=await A(p,()=>window.__STORYWORLD_FINALE_R950__.inspect());
 ok('3: R950 finale stays off on the survival cult04 stage',f.active===false&&f.links===0&&f.stats.beatsShown===0&&f.stats.hpFixed===0,f);
 ok('3: no page errors',errs.length===0,errs);await ctx.close();}

// ---- 4: 배치 서하(R949) — 조종 네온은 묶임 ----------------------------------------------------------------------------
//  배치 서하가 자기 타격(탄 명중 포함)으로 '겹친 시간'을 굴리고 피해를 주는가, 묶인 조종 네온 패시브는 남의 타격으로 안 굴러가는가.
if(!ONLY||ONLY==='4'){const {p,ctx,errs}=await survival('neon');
 const pl=await place(p,['seoha']);ok('4: seoha placed',pl.slots.join()==='seoha',pl);
 await lockMain(p);await tap(p);
 for(let k=0;k<8;k++){await waitGame(p,k?5:10);const h=await A(p,()=>window.__r962.hits);if((h.seoha||0)>0)break;}
 const r=await A(p,()=>{const W=window.__r962,rolls={};for(const x of W.rolls){const k=x.h+(x.ally?':ally':':main');rolls[k]=(rolls[k]||0)+1;}return {rolls,hits:W.hits,proj:W.proj,unrouted:W.unrouted||0};});
 console.log('diag 4',JSON.stringify(r));
 ok('4: placed seoha rolls its passive as itself',(r.rolls['seoha:ally']||0)>0&&!(r.rolls['seoha:main']>0),r.rolls);
 ok('4: placed seoha passive deals damage',(r.hits.seoha||0)>0,r.hits);
 ok('4: locked controlled neon never rolls',!(r.rolls['neon:main']>0)&&!(r.hits.neon>0),r);
 ok('4: placed seoha shots credited to her body',r.unrouted===0,r);
 const e=await errsOf(p);ok('4: no passive module errors',Object.values(e).every(v=>v===0||(typeof v==='string'&&v!=='missing')),e);ok('4: no page errors',errs.length===0,errs);
 await ctx.close();}

await b.close();console.log(fail?`FAILED ${fail}`:'ALL PASS');process.exit(fail?1:0);
