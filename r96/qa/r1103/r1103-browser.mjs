// R1103 헤드리스 검사: 몹 무리 옆에서 실제 게임 시간을 흘리며(같은 영웅·지역, 끔/켬 두 번) 3D 기록기에 들어간 명령을 센다.
//  끔(storyworld.r1103.shapes=off)일 때는 FINAL42 공격 예고(251·260)·R98 바닥 도형이 실제로 그려져야 하고(검사가 의미 있도록),
//  켬일 때는 0 이어야 한다. 몹 공격 판정(영웅 피해)은 두 경우 모두 일어나야 한다. 화면도 찍어 둔다.
// 실행: SW_URL=… node r96/qa/r1103/r1103-browser.mjs [영웅] [지역…]
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const [hero='hwando',...Z]=process.argv.slice(2);const ZONES=Z.length?Z:['ep1b03','dist03'];
const OUT=path.join(HERE,'browser');fs.mkdirSync(OUT,{recursive:true});
const skip=p=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const b=await chromium.launch();let fail=0,pass=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL',m);}};
for(const mode of ['off','on']){
 const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});await ctx.addInitScript(m=>{localStorage.setItem('storyworld.r1103.shapes',m);},mode);
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator(`.heroRowR101 button[data-hero="${hero}"]`).click({timeout:20000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading&&(!modal||!!storyScene),null,{timeout:240000});await p.waitForTimeout(600);await skip(p);
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
 // R1103c: 기록은 남고 3D 렌더러에 넘길 때 빠지므로, 렌더러(인스턴스 render 맨 바깥)가 실제로 받은 뒤 남은 명령을 센다.
 await p.waitForFunction(()=>!!window.__STORYWORLD_PHASE1__?.controller?.state?.three,null,{timeout:60000});
 await p.evaluate(()=>{const c={f42warn:0,r98ground:0,nav:0,all:0,recF42:0};window.__R1103B=c;const r=window.__STORYWORLD_PHASE1__.controller.state.three,inner=r.render;
  r.render=function(frame){const out=inner.apply(this,arguments);try{for(const x of frame?.commands||[]){const o=x.owner||{};const i=+o.r88SourceIndex;c.all++;if(o.r88Final42&&(i===251||i===260))c.f42warn++;if(o.r98&&o.kind==='hazard'&&(x.kind==='fill'||x.kind==='stroke'))c.r98ground++;if(o.id==='r100:nav')c.nav++;}}catch(_){}return out;};
  const P=StoryPhase1.DrawCommands.prototype,base=P.push;P.push=function(){const n0=this.commands?.length??0;const out=base.apply(this,arguments);const o=this.owner||{};if((this.commands?.length??0)>n0&&o.r88Final42&&+o.r88SourceIndex===251)c.recF42++;return out;};});
 for(const z of ZONES){await p.evaluate(async z=>{if(zone!==z)await enterRegion(z,null,{layer:'STORY',restore:true});},z);await p.waitForFunction(z=>!loading&&zone===z,z,{timeout:150000});await skip(p);
  await p.evaluate(()=>{for(const k in __R1103B)__R1103B[k]=0;window.__R1103hurt=0;const es=(room.enemies||[]).filter(e=>e.hp>0);es.sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));player.x=es[0].x+1.4;player.y=es[0].y+.2;});
  for(let i=0;i<40;i++){await p.evaluate(()=>{const h0=player.hp;for(let j=0;j<12;j++){if(modal||loading)break;try{tick(1/60);}catch(_){}}if(player.hp<h0)window.__R1103hurt++;player.hp=Math.max(player.hp,maxHP()*.9);try{draw();}catch(_){}});
   if(i%10===5)await p.screenshot({path:path.join(OUT,`${mode}-${z}-${i}.png`)});}
  const r=await p.evaluate(()=>({c:{...__R1103B},hurt:__R1103hurt,api:window.__STORYWORLD_WARNING_SHAPES_R1103__?.inspect()}));console.log(mode,z,JSON.stringify(r));
  ok(r.c.all>1000,`${mode} ${z}: frames recorded`);ok(r.hurt>0,`${mode} ${z}: enemy attacks still hurt the hero`);
  if(mode==='on'){ok(r.api?.installed&&r.api.on,'on: installed');ok(r.c.f42warn===0,`on ${z}: no FINAL42 warning-ring/charge commands recorded`);ok(r.c.r98ground===0,`on ${z}: no R98 ground shape commands`);ok(r.c.nav===0,`on ${z}: no ground nav chevrons`);if(z==='ep1b03')ok(r.c.recF42>0,`on ${z}: FINAL42 251 still recorded for native hooks`);ok(r.api.stats.dropped>0,`on ${z}: overlay actually dropped something`);}
  else{ok(r.c.f42warn+r.c.r98ground>0,`off ${z}: originals present (test meaningful)`);ok(r.c.nav>0,`off ${z}: nav chevrons present (test meaningful)`);}}
 ok(!errs.some(e=>/r1103|warning-shapes/i.test(e)),mode+': no page errors from R1103');if(errs.length)console.log('pageerrors',errs.slice(0,3));
 await ctx.close();}
await b.close();console.log(`R1103 browser: pass ${pass}, fail ${fail}`);process.exit(fail?1:0);
