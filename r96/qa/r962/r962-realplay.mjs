// R962 무한 생존 실플레이 운전기 — 화면 있는 Chromium(xvfb 가상 화면, 소프트웨어 GL) + 실제 키보드·마우스 입력.
//  GPU·실기기 플레이가 아니다. 사람이 하듯 타이틀에서 '무한 생존' → 난이도·영웅 선택 → 방향키 이동·A 공격·S/D/Q/W/E/R·I 배치 창을 눌러 가며 논다.
//  검사 훅으로 결과를 바꾸지 않는다(관찰만: 상태 읽기·스크린샷). 서사는 Space 대신 기다리거나 화면 단추로 넘긴다.
//  xvfb-run -a -s "-screen 0 1280x720x24" node r96/qa/r962/r962-realplay.mjs   (SW_URL, HERO, MINUTES, OUT)
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',HERO=process.env.HERO||'lauren',MIN=+(process.env.MINUTES||8),OUT=process.env.OUT||'';
const W=+(process.env.W||960),H=+(process.env.H||540);const b=await chromium.launch({headless:false,args:['--window-size='+W+','+(H+40)]});const ctx=await b.newContext({viewport:{width:W,height:H}});
const p=await ctx.newPage();const errs=[],cons=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));p.on('console',m=>{if(m.type()==='error')cons.push(m.text().slice(0,160));});
const log=(...a)=>console.log(new Date().toISOString().slice(11,19),...a);
const S=()=>p.evaluate(()=>{const s=window.__STORYWORLD_SURVIVAL_R600__,d=window.__STORYWORLD_HERO_DEFENSE_R720__,x=s?.state?.()||{};
 const pv=k=>{const m=window['__STORYWORLD_'+k+'__'];if(!m)return null;const i=m.inspect?.();return i?{errors:i.errors??i.stats?.errors??0,procs:i.stats?.procTotal??i.stats?.procs??null}:null;};
 return {t:+time.toFixed(1),zone:room?.id,hp:Math.round(player.hp),max:Math.round(maxHP()),hero:player.hero,lv:player.level,stage:x.i,stageId:x.id,loop:x.loop,phase:x.phase,kills:x.kills,core:x.core?Math.round(x.core.hp):null,over:!!document.getElementById('r600Again'),
  enemies:(room?.enemies||[]).filter(e=>e.hp>0).length,modal:!!modal,loading:!!loading,crystals:d?.state?.().crystals,slots:d?.state?.().slots?.map(s=>s.hero),
  passives:{r945:pv('HWANDO_INK_R945'),r946:pv('LAUREN_CELESTIAL_R946'),r947:pv('SLAYER_BLOOD_PASSIVE_R947'),r948:pv('MICHAELA_HEART_R948'),r951:pv('NEON_STORM_R951'),r952:pv('HUNTER_SQUAD_R952'),r953:pv('GUNNER_VEIL_R953'),r962:pv('SURVIVAL_PASSIVES_R962')},
  r600:s?.inspect?.().stats,r962:window.__STORYWORLD_SURVIVAL_PASSIVES_R962__?.inspect().stats};});
let shotN=0;const shot=async n=>{if(OUT)await p.screenshot({path:`${OUT}/rp-${String(++shotN).padStart(2,'0')}-${n}.png`});};
await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:240000});await shot('title');
await p.locator('#survivalStartR600').click();await p.waitForTimeout(600);await shot('setup');
await p.locator('[data-r600diff="normal"]').click();await p.locator(`[data-r600hero="${HERO}"]`).click();await p.locator('#r600Go').click();
await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__?.here()&&!loading,null,{timeout:300000});log('in survival',JSON.stringify(await S()));await shot('start');
const t0=Date.now(),dirs=['ArrowLeft','ArrowUp','ArrowRight','ArrowDown'];let k=0,lastShot=0,placed=0,cards=0;
const hold=async(key,ms)=>{await p.keyboard.down(key);await p.waitForTimeout(ms);await p.keyboard.up(key);};
while(Date.now()-t0<MIN*60e3){
 const s=await S();
 if(s.over){log('RUN OVER',JSON.stringify(s));await shot('over');break;}
 // 강화 카드 창이면 첫 카드를 마우스로 고른다(사람처럼)
 const card=await p.$('.r600Card');if(card){await card.click().catch(()=>{});cards++;await p.waitForTimeout(300);continue;}
 if(s.modal){const btn=await p.$('#modal:not(.hidden) button');if(btn)await btn.click().catch(()=>{});await p.waitForTimeout(400);continue;}
 // 결정이 모이면 I → 배치 창에서 가장 싼 영웅부터 사서 지금 자리에 둔다
 if(s.crystals>=55&&placed<4&&!s.loading){
  // 사람처럼 화면의 코어 쪽으로 걸어간다(방향키, 화면 좌표로 방향만 본다)
  for(let g=0;g<12;g++){const v=await p.evaluate(()=>{const c=room.survivalR600.centre,a=project(player.x,player.y),b=project(c.x,c.y);return {dx:b.x-a.x,dy:b.y-a.y,d:Math.hypot(c.x-player.x,c.y-player.y)};});
   if(v.d<2.6)break;const key=Math.abs(v.dx)>Math.abs(v.dy)?(v.dx>0?'ArrowRight':'ArrowLeft'):(v.dy>0?'ArrowDown':'ArrowUp');await hold(key,280);}
  await p.keyboard.press('i');await p.waitForTimeout(500);
  const btns=[...await p.$$('[data-r720place]:not([disabled])'),...await p.$$('[data-r720buy]:not([disabled])')];let got=false;for(const bt of btns){if(got)break;const ok=await bt.isEnabled().catch(()=>false);if(ok){await bt.click().catch(()=>{});got=true;placed++;}}
  await p.waitForTimeout(300);await shot('placement');await p.keyboard.press('i');await p.waitForTimeout(300);}
 // 움직이며 싸우기: 방향키 0.5~0.9초, 사이사이 A·스킬
 await hold(dirs[k%4],500+(k%3)*200);k++;
 for(const key of ['a','a','q','s','w','e','d','r','f'].slice(0,3+(k%7)))await p.keyboard.press(key);
 if(Date.now()-lastShot>45e3){lastShot=Date.now();await shot('play');log(JSON.stringify(s).slice(0,900));}
}
const end=await S();log('END',JSON.stringify(end));await shot('end');
console.log(JSON.stringify({wallMin:+((Date.now()-t0)/60e3).toFixed(1),cardsPicked:cards,placedByPlay:placed,pageErrors:errs,consoleErrors:cons.slice(0,10),end},null,1));
await b.close();
