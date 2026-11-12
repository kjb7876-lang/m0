// R962 화면 멈춤 검사(헤드리스·소프트웨어 렌더링): 생존에서 패시브 8종이 그리는 동안 Three.js 기록기가
//  "Nonfinite original draw command"(그리기 명령 속 NaN/Infinity) 로 멈추지 않는가. 원인은 __STORYWORLD_PHASE1__.controller.state.reason.
//  조종 영웅 + 배치 4명 두 판으로 8명을 덮고, 확률은 각 모듈 검사 훅으로 '항상 발동'(qaRandom / force)으로 둔다.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',SECS=+(process.env.SECS||30);let fail=0;
const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,600):'');if(!c)fail++;};
const b=await chromium.launch();
for(const [main,allies] of [['lauren',['hwando','slayer','michaela','neon']],['seoha',['gunner','hunter','lauren','michaela']]]){
 const ctx=await b.newContext({viewport:{width:640,height:360}});await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r663.skillgrowth',JSON.stringify({on:false}));});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:240000});
 await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator(`[data-r600hero="${main}"]`).click();await p.locator('#r600Go').click();
 await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:300000});
 await p.evaluate(()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration());
 const st0=await p.evaluate(()=>{const c=window.__STORYWORLD_PHASE1__?.controller;return c?{mode:c.state?.mode??null,reason:c.state?.reason??null}:null;});
 await p.evaluate(list=>{const d=window.__STORYWORLD_HERO_DEFENSE_R720__,z=room.survivalR600.centre;d.qaGive(5000);const sp=[[2.2,1.2],[-2.2,1.2],[2.2,-1.4],[-2.2,-1.4]];
  list.forEach((h,i)=>{player.x=z.x+sp[i][0];player.y=z.y+sp[i][1];d.buy(h);});player.x=z.x;player.y=z.y+2;player.invincible=9999;
  for(const k of ['LAUREN_CELESTIAL_R946','MICHAELA_HEART_R948','NEON_STORM_R951','SEOHA_EPOCH_R949']){let n=0;window['__STORYWORLD_'+k+'__']?.qaRandom?.(()=>(n++%2)?Math.random():0);}
  window.__r962Force=setInterval(()=>{try{player.invincible=9999;player.hp=maxHP();const F={hwando:['HWANDO_INK_R945',['moon','clones','trio']],slayer:['SLAYER_BLOOD_PASSIVE_R947',['needle','swords','lattice']],gunner:['GUNNER_VEIL_R953',['cloak','barrage','summon']],hunter:['HUNTER_SQUAD_R952',['call','shade','squad']]};
   for(const body of [player,...d.bodies()]){if(!body)continue;const f=F[body.hero];if(f){const m=window['__STORYWORLD_'+f[0]+'__'];m?.force?.(f[1][Math.floor(Math.random()*3)],body);}}}catch(_){}},1500);},allies);
 const t0=await p.evaluate(()=>time);const watch=[];
 while(true){await p.waitForTimeout(3000);const s=await p.evaluate(()=>{const c=window.__STORYWORLD_PHASE1__?.controller;return {t:time,mode:c?.state?.mode??null,reason:c?.state?.reason??null,halted:!!(c?.state?.reason&&/nonfinite/i.test(String(c.state.reason)))};});
  watch.push(s);if(s.halted||s.t>=t0+SECS)break;}
 const last=watch[watch.length-1];
 const procs=await p.evaluate(()=>{const o={};for(const [h,k] of [['hwando','HWANDO_INK_R945'],['lauren','LAUREN_CELESTIAL_R946'],['slayer','SLAYER_BLOOD_PASSIVE_R947'],['michaela','MICHAELA_HEART_R948'],['seoha','SEOHA_EPOCH_R949'],['neon','NEON_STORM_R951'],['hunter','HUNTER_SQUAD_R952'],['gunner','GUNNER_VEIL_R953']]){const m=window['__STORYWORLD_'+k+'__'];const i=m?.inspect?.();o[h]=i?(i.stats?.procTotal??i.stats?.moons??i.stats?.rolls??'?'):'missing';}return o;});
 console.log('run',main,'+',allies.join(','),'state0',JSON.stringify(st0),'last',JSON.stringify(last),'procs',JSON.stringify(procs));
 ok(`${main}+${allies.join(',')}: no nonfinite draw-command halt over ${SECS}s game time`,!last.halted&&!watch.some(w=>w.halted),{st0,last});
 ok(`${main}+${allies.join(',')}: no page errors`,errs.length===0,errs);
 await ctx.close();}
await b.close();console.log(fail?`FAILED ${fail}`:'ALL PASS');process.exit(fail?1:0);
