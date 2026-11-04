// R291 headless browser check (Playwright, real keyboard events = isTrusted) on a built site.
//   STORYWORLD_URL=http://127.0.0.1:4396/m0/ OUT=out/r291 node r96/qa/r291/r291-browser.mjs
// Headless Chromium: proves input → action wiring and HUD text, NOT GPU/graphics or real mobile devices.
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;
for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out/r291';fs.mkdirSync(OUT,{recursive:true});
const results=[];let fails=0;const check=(name,ok,info)=>{results.push({name,ok:!!ok,info});if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+name+(ok||info===undefined?'':' '+JSON.stringify(info).slice(0,600)));};
const errors=[];
async function boot(opts={}){
 const b=await chromium.launch({headless:true});const ctx=await b.newContext(opts.ctx||{viewport:{width:1280,height:720}});
 // R183 3D 체험 장면은 처음 들어설 때 15초 동안 모든 게임 키를 막는다(의도된 동작) — 키 검사를 위해 그 설정으로 끈다
 await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));}catch(_){}});
 if(opts.legacy)await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r291.keys','legacy');}catch(_){}});
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:120000});await p.waitForTimeout(1200);await skip(p);
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip(p);
 await p.evaluate(()=>{guide=false;auto=false;settings.autoSkill=false;
  const T=window.__R291T={calls:{},bubble:[]};
  for(const n of ['basicAttack','blink','guardStart','guardEnd','special','ego','interact','showWorld','showUpgrades','showMenu']){const o=window[n];if(typeof o!=='function')continue;
   window[n]=function(...a){T.calls[n]=(T.calls[n]||0)+1;const c=window.__STORYWORLD_PHASE1__?.controller;T.gate={n,modal:!!modal,loading,started,hp:player?.hp,three:!!c?.state.three,failed:c?.state.failed,cd:[player?.blinkCD,player?.specialCD,player?.egoCD,player?.ego],hidden:document.hidden,ego151:window.__STORYWORLD_EGO151__?.inspect?.().state.active,story:!!storyScene};return o.apply(this,a);};}
  // what the engine/bubble handlers see (after every capture listener), and whether someone consumed it
  window.addEventListener('keydown',e=>{T.bubble.push({key:e.key,code:e.code,trusted:e.isTrusted});if(T.bubble.length>60)T.bubble.shift();});
  document.addEventListener('keydown',e=>{T.lastCapture={key:e.key,code:e.code};setTimeout(()=>{T.lastPrevented={code:e.code,prevented:e.defaultPrevented};},0);},true);});
 return {b,p};
}
const skip=p=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const calls=p=>p.evaluate(()=>({...window.__R291T.calls}));
const delta=(a,b)=>{const d={};for(const k of new Set([...Object.keys(a),...Object.keys(b)])){const v=(b[k]||0)-(a[k]||0);if(v)d[k]=v;}return d;};
async function press(p,key,opts={}){const before=await calls(p);const casts0=await p.evaluate(()=>window.__STORYWORLD_WER__.inspect().casts.length);
 if(opts.hold){await p.keyboard.down(key);await p.waitForTimeout(opts.hold);}else await p.keyboard.press(key);
 await p.waitForTimeout(opts.wait??160);const after=await calls(p);const casts=await p.evaluate(()=>window.__STORYWORLD_WER__.inspect().casts.length);
 return{d:delta(before,after),casts:casts-casts0};}
// hospital-pc-test 는 렌더러가 준비되기 전(지역 이동 직후·부하) 게임 키·동작을 모두 막는다(기존 동작) — 그 조건을 기다린다
const rendererReady=p=>p.waitForFunction(()=>{const c=window.__STORYWORLD_PHASE1__?.controller;return !!(c?.state.three&&!c.state.failed)&&!loading&&!modal&&!storyScene;},null,{timeout:180000}).catch(()=>{});
async function reset(p){await p.evaluate(()=>{if(modal)closePanel(true);});await rendererReady(p);await p.evaluate(()=>{if(modal)closePanel(true);player.hp=player.maxHp;player.attackCD=0;player.blinkCD=0;player.specialCD=0;player.egoCD=0;player.ego=0;player.samong=0;player.resonance=100;guardEnd();
 const s=player.storyWER||(player.storyWER={ready:{},buffs:{}});for(const sl of ['w','r'])s.ready[player.hero+':'+sl]=0;keys.clear();});}
async function nearEnemy(p){return p.evaluate(()=>{const e=room.enemies.filter(e=>e.hp>0&&e.spawnState!=='dormant').sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];
 if(!e)return null;for(const [dx,dy] of [[1.6,0],[-1.6,0],[0,1.6],[0,-1.6],[1.2,1.2],[-1.2,-1.2]]){const x=e.x+dx,y=e.y+dy;if(!blocked(x,y,.34,room)){player.x=x;player.y=y;route=[];command=null;return{x,y,e:e.id};}}return null;});}

// ===================== A. new layout =====================
{const {b,p}=await boot();
 const k=await p.evaluate(()=>({api:window.__STORYWORLD_KEYS_R291__?.inspect(),KR291,zone}));
 check('keys-r291 loaded in the built page, new layout, KR291 C/W/E/R',k.api?.rev==='R291-keys-1'&&k.api.legacy===false&&k.KR291.i==='C'&&k.KR291.w==='W',k);
 // ---- hub: Space / M / P / Esc / C / old E ----
 let r=await press(p,' ');check('Space toggles semi-auto on',await p.evaluate(()=>auto===true));r=await press(p,' ');check('Space toggles semi-auto off',await p.evaluate(()=>auto===false));
 r=await press(p,'m');check('M opens the world map',r.d.showWorld===1&&await p.evaluate(()=>!!modal),r);await p.screenshot({path:OUT+'/map-m.png'});
 await press(p,'Escape');check('Esc closes the panel',await p.evaluate(()=>!modal));
 r=await press(p,'p');check('P opens passive upgrades',r.d.showUpgrades===1&&await p.evaluate(()=>!!modal),r);await p.screenshot({path:OUT+'/upgrades-p.png'});
 await press(p,'Escape');r=await press(p,'Escape');check('Esc opens the menu',r.d.showMenu===1,r);await p.evaluate(()=>showHelp());await p.waitForTimeout(200);
 const help=await p.evaluate(()=>document.querySelector('#panel .keygrid')?.innerText||'');check('help panel lists W / E / R and C (no Z / X / C, no lone E row)',/W \/ E \/ R/.test(help)&&/\nC\n|^C\n|\tC\n|C\s*\n\s*기억 표식/.test(help)&&!/Z \/ X \/ C/.test(help),help.slice(0,500));
 await p.screenshot({path:OUT+'/help-panel.png'});await p.evaluate(()=>closePanel(true));
 await p.evaluate(()=>{player.x=room.objective.x+1.4;player.y=room.objective.y;route=[];command=null;});await p.waitForTimeout(400);
 const hint=await p.evaluate(()=>document.getElementById('hint')?.textContent||'');check('hint near the hub altar has no old E prompt',!/(^|[^A-Za-z])E( ·|를|로)/.test(hint),hint);
 // 제단(경계의 제단) C 검사는 C 부분에서 한다 — 제단 창을 연 뒤에는 같은 허브 포탈이 E/C 모두 이동하지 않는 기존 동작이 있어(legacy 에서도 같음) 포탈 검사를 먼저 한다
 // ---- portal with C (native next portal → difficulty admission) ----
 await p.evaluate(()=>{const pt=__STORYWORLD_ROUTES_R72__.points().next;player.x=pt.x;player.y=pt.y;transitionCD=0;route=[];command=null;});await p.waitForTimeout(500);
 const mini=await p.evaluate(()=>({hint:document.getElementById('hint')?.textContent,mini:document.getElementById('miniLabel')?.textContent}));
 check('portal hint / minimap label say C',/C를 눌러 이동|C · 이동/.test(mini.hint||'')&&/C · 이동/.test(mini.mini||''),mini);
 r=await press(p,'c',{wait:300});const opened=await p.waitForFunction(()=>__STORYWORLD_PROGRESSION_R71__.difficultyState().open||zone!=='hub',null,{timeout:60000}).then(()=>true,()=>false);check('C at the portal opens difficulty admission (real portal interaction)',r.d.interact===1&&opened,r);
 await p.evaluate(async()=>{if(__STORYWORLD_PROGRESSION_R71__.difficultyState().open){__STORYWORLD_PROGRESSION_R71__.selectDifficulty('normal');await __STORYWORLD_PROGRESSION_R71__.confirmDifficulty();}});
 await p.waitForFunction(()=>zone!=='hub'&&!loading,null,{timeout:90000});await skip(p);await p.waitForTimeout(2500);await skip(p);
 check('R183 scene off for the key test (no 3D scene blocking keys)',await p.evaluate(()=>!document.querySelector('[id^=r183], .r183Scene')),await p.evaluate(()=>window.__STORYWORLD_SCENE3D_R183__?.inspect?.()));
 check('arrived in a combat map',await p.evaluate(()=>zone==='dist00'&&room.enemies.some(e=>e.hp>0)),await p.evaluate(()=>zone));
 await p.evaluate(()=>{guide=false;auto=false;});
 // ---- combat keys in a real map ----
 await reset(p);await nearEnemy(p);
 r=await press(p,'a',{hold:350});const held=await p.evaluate(()=>({attack:keys.has('attack'),cd:player.attackCD}));await p.keyboard.up('a');await p.waitForTimeout(120);
 const rel=await p.evaluate(()=>keys.has('attack'));check('A (hold): swings (basicAttack, attack cooldown) and holds attack; keyup releases',r.d.basicAttack>=1&&held.attack&&!rel,{r,held,rel});
 await reset(p);r=await press(p,'1');check('1 still attacks',r.d.basicAttack>=1,r);
 await reset(p);await p.keyboard.down('ArrowRight');const pos0=await p.evaluate(()=>({x:player.x,y:player.y}));r=await press(p,'s');await p.keyboard.up('ArrowRight');
 const pos1=await p.evaluate(()=>({x:player.x,y:player.y,cd:player.blinkCD}));check('S blinks (moved, blink cooldown)',r.d.blink===1&&pos1.cd>0&&Math.hypot(pos1.x-pos0.x,pos1.y-pos0.y)>.8,{r,pos0,pos1,gate:await p.evaluate(()=>window.__R291T.gate)});
 await reset(p);await p.keyboard.down('d');await p.waitForTimeout(250);const g1=await p.evaluate(()=>player.guard);await p.keyboard.up('d');await p.waitForTimeout(120);const g2=await p.evaluate(()=>player.guard);
 check('D holds 공명방어 (guard on) and keyup releases it (guard off)',g1===true&&g2===false,{g1,g2});
 await reset(p);r=await press(p,'q');check('Q special fires (special cooldown)',r.d.special===1&&await p.evaluate(()=>player.specialCD>0),r);
 await reset(p);r=await press(p,'f');check('F EGO fires (EGO active)',r.d.ego===1&&await p.evaluate(()=>player.ego>0),r);await p.screenshot({path:OUT+'/ego-f.png'});
 await p.evaluate(()=>{player.ego=0;});
 const hero=await p.evaluate(()=>player.hero);
 const ready=sl=>p.evaluate(sl=>(player.storyWER?.ready?.[player.hero+':'+sl]||0)-time,sl);
 await reset(p);await nearEnemy(p);r=await press(p,'w');check('W casts story W ('+hero+') with a cooldown',r.casts===1&&await ready('w')>0,{r,cd:await ready('w')});
 await reset(p);await nearEnemy(p);r=await press(p,'r');check('R casts story R with a cooldown',r.casts===1&&await ready('r')>0,{r,cd:await ready('r')});
 await reset(p);await nearEnemy(p);r=await press(p,'e');check('E = story E slot: removed by R209 for '+hero+' → no cast, and it is NOT interact',r.casts===0&&!r.d.interact,r);
 await reset(p);await nearEnemy(p);r=await press(p,'6');check('6 = W',r.casts===1,r);await reset(p);await nearEnemy(p);r=await press(p,'8');check('8 = R',r.casts===1,r);
 await reset(p);await nearEnemy(p);r=await press(p,'7');check('7 = E slot (removed) → nothing',r.casts===0&&!Object.keys(r.d).length,r);
 await reset(p);await nearEnemy(p);r=await press(p,'z');check('old Z does nothing in combat',r.casts===0&&!Object.keys(r.d).length,r);
 await reset(p);await nearEnemy(p);r=await press(p,'x');check('old X does nothing in combat',r.casts===0&&!Object.keys(r.d).length,r);
 await reset(p);r=await press(p,'c');check('C away from anything: interact is called (and nothing else)',r.d.interact===1&&Object.keys(r.d).length===1&&r.casts===0,r);
 // W held (auto-repeat) casts once
 await reset(p);await nearEnemy(p);const c0=await p.evaluate(()=>window.__STORYWORLD_WER__.inspect().casts.length);await p.keyboard.down('w');await p.waitForTimeout(700);await p.keyboard.up('w');
 const c1=await p.evaluate(()=>window.__STORYWORLD_WER__.inspect().casts.length);check('holding W casts once (no repeat spam)',c1-c0===1,{c0,c1});
 // golden thread G (code-based handler) still receives the key
 await reset(p);await p.keyboard.press('g');await p.waitForTimeout(150);const gp=await p.evaluate(()=>window.__R291T.lastPrevented);
 check('G still reaches the golden-thread handler (consumed: preventDefault)',gp?.code==='KeyG'&&gp.prevented===true,gp);await p.evaluate(()=>{window.__STORYWORLD_GOLDEN_R72__?.cancelAll?.();if(modal)closePanel(true);});
 const bub=await p.evaluate(()=>window.__R291T.bubble.slice(-40));check('events stay trusted after relabelling',bub.length>0&&bub.every(e=>e.trusted),bub.slice(-3));
 // ---- R81/R74 door with C ----
 await reset(p);
 const door=await p.evaluate(()=>{const W=window.__STORYWORLD_WORLD_R74__;for(const t of W.interactions()){for(let a=0;a<16;a++)for(const rr of [1.2,1.8,2.4]){const x=t.point.x+Math.cos(a/16*6.283)*rr,y=t.point.y+Math.sin(a/16*6.283)*rr;if(blocked(x,y,.34,room))continue;const ox=player.x,oy=player.y;player.x=x;player.y=y;if(W.canUse(t)){route=[];command=null;return{id:t.id,x,y,open:W.inspect().doors.find(d=>d.id===t.id).open};}player.x=ox;player.y=oy;}}return null;});
 if(door){await p.waitForTimeout(250);r=await press(p,'c',{wait:400});const open2=await p.evaluate(id=>window.__STORYWORLD_WORLD_R74__.inspect().doors.find(d=>d.id===id).open,door.id);
  check('C next to an R74/R81 door toggles it ('+door.id+' '+door.open+'→'+open2+')',r.d.interact===1&&open2!==door.open,{door,r,open2});await p.screenshot({path:OUT+'/door-c.png'});
  r=await press(p,'e',{wait:300});const open3=await p.evaluate(id=>window.__STORYWORLD_WORLD_R74__.inspect().doors.find(d=>d.id===id).open,door.id);check('old E next to the door does nothing',open3===open2&&!r.d.interact,{open3,r});}
 else check('found a usable R74 door in dist00',false);
 // ---- HUD screenshot + labels ----
 await reset(p);await p.waitForTimeout(400);
 const hud=await p.evaluate(()=>({wer:['w','e','r'].map(s=>{const b=document.getElementById('story-wer-'+s);return b&&{kbd:b.querySelector('kbd')?.textContent,aria:b.getAttribute('aria-label'),shown:!b.hidden&&getComputedStyle(b).display!=='none'};}),
  caps:[...document.querySelectorAll('#attackBtn kbd,#blinkBtn kbd,#guardBtn kbd,#specialBtn kbd,#egoBtn kbd,#autoBtn kbd')].map(k=>k.textContent),touchUse:document.getElementById('touchUse')?.textContent}));
 check('story skill buttons show W / E / R keycaps and aria-labels',hud.wer[0]?.kbd==='W'&&hud.wer[1]?.kbd==='E'&&hud.wer[2]?.kbd==='R'&&/ · W$/.test(hud.wer[0].aria)&&/ · R$/.test(hud.wer[2].aria),hud);
 check('A/S/D/Q/F/Space keycaps unchanged',JSON.stringify(hud.caps)===JSON.stringify(['A / J / 1','S / 2','D / 3','Q / 4','F / 5','SPACE']),hud.caps);
 await p.screenshot({path:OUT+'/hud-combat.png'});
 const st=await p.evaluate(()=>window.__STORYWORLD_KEYS_R291__.inspect());check('keys-r291 no errors; translated W/E/R/C and swallowed Z/X',st.stats.errors===0&&st.stats.translated>=8&&st.stats.swallowed>=2,st.stats);
 await b.close();}

// ===================== B. legacy toggle =====================
{const {b,p}=await boot({legacy:true});
 const k=await p.evaluate(()=>({api:window.__STORYWORLD_KEYS_R291__.inspect(),KR291}));check("legacy: localStorage 'storyworld.r291.keys'='legacy' → old layout + old letters",k.api.legacy===true&&k.KR291.i==='E'&&k.KR291.w==='Z',k);
 await p.evaluate(()=>{player.x=room.objective.x+1.4;player.y=room.objective.y;route=[];command=null;});await p.waitForTimeout(400);
 const hint=await p.evaluate(()=>document.getElementById('hint')?.textContent||'');check('legacy: altar hint has no new C prompt',!/(^|[^A-Za-z])C( ·|를|로)/.test(hint),hint);
 let r=await press(p,'c');check('legacy: C does not interact',!r.d.interact,r);
 r=await press(p,'e');check('legacy: E interacts',r.d.interact===1,r);await skip(p);
 await p.keyboard.press('z');await p.waitForTimeout(100);const seen=await p.evaluate(()=>window.__R291T.bubble.slice(-1)[0]);check('legacy: Z reaches the engine as z (no remap)',seen?.key==='z',seen);
 const hud=await p.evaluate(()=>['w','e','r'].map(s=>document.querySelector('#story-wer-'+s+' kbd')?.textContent));check('legacy: skill keycaps Z / X / C',JSON.stringify(hud)==='["Z","X","C"]',hud);
 await p.screenshot({path:OUT+'/legacy-hud.png'});await b.close();}

// ===================== C. mobile touch (unchanged behaviour) =====================
{const {b,p}=await boot({ctx:{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}});
 await p.evaluate(()=>{player.x=room.objective.x+1.4;player.y=room.objective.y;route=[];command=null;});await p.waitForTimeout(500);
 const vis=await p.evaluate(()=>{const t=document.getElementById('touchUse');const r=t?.getBoundingClientRect();return{text:t?.textContent,w:r?.width,h:r?.height,disp:t&&getComputedStyle(t).display};});
 let r=await press(p,'e');check('old E at the altar does NOT interact',!r.d.interact&&await p.evaluate(()=>!modal),r);
 r=await press(p,'c');check('C at the altar interacts (경계의 제단 opens)',r.d.interact===1&&await p.evaluate(()=>!!(modal||storyScene)),r);await p.screenshot({path:OUT+'/altar-c.png'});await skip(p);
 const before=await calls(p);if(vis.w>0)await p.locator('#touchUse').tap();else await p.evaluate(()=>document.getElementById('touchUse').click());await p.waitForTimeout(300);const d=delta(before,await calls(p));
 check('mobile: interact touch button still calls interact (context label, no key letter)',!/(^|[^A-Za-z])[A-Z]([^A-Za-z]|$)/.test(vis.text||'')&&d.interact===1,{vis,d});await skip(p);
 await p.screenshot({path:OUT+'/mobile-hub.png'});await b.close();}

console.log('page errors:',errors.length?errors:'none');
check('no page errors',errors.filter(e=>!/favicon/.test(e)).length===0,errors);
fs.writeFileSync(OUT+'/r291-browser.json',JSON.stringify({url:URL,results,errors,note:'headless Chromium; not GPU/graphics or real-device verification'},null,1));
console.log(fails?fails+' failed':'all passed');process.exit(fails?1:0);
