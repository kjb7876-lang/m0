// R368 headless check (Playwright) on a built site — 결전의 날 발록 보스·색, 쓰러뜨리면 배신 영상(자막 시점), 끄면 R317 장면.
//   STORYWORLD_URL=http://127.0.0.1:4436/m0/ OUT=out/r368 node r96/qa/r368/r368-browser.mjs
// Headless Chromium: 판정·호출·화면 구성만 본다. GPU 그래픽·실기기 모바일·소리 품질은 검증하지 않는다(임시).
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;
for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4436/m0/',OUT=process.env.OUT||'out/r368';fs.mkdirSync(OUT,{recursive:true});
let fails=0;const results=[];const check=(name,ok,info)=>{results.push({name,ok:!!ok,info});if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+name+(info===undefined?'':' '+JSON.stringify(info).slice(0,400)));};
const skip=p=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
async function boot(viewport,init){const b=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 const mobile=viewport.width<500;const ctx=await b.newContext({viewport,deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
 await ctx.addInitScript(o=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));for(const [k,v] of Object.entries(o||{}))localStorage.setItem(k,v);}catch(_){}},init||{});
 const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await p.waitForTimeout(800);await skip(p);
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip(p);
 await p.evaluate(async()=>{await enterRegion('ep1a09b',null,{layer:'STORY',restore:true});});await p.waitForFunction(()=>!loading&&room?.id==='ep1a09b',null,{timeout:120000});await skip(p);
 await p.evaluate(()=>{guide=false;auto=false;player.invincible=99999;});await p.waitForTimeout(800);return {b,p,errors};}
const near=p=>p.evaluate(async()=>{const e=room.enemies.find(x=>window.__STORYWORLD_BETRAYAL_VIDEO_R368__.isBalrog(x));if(!e)return null;
 // 자연 진행에선 R78 마지막 단계(beginBoss)가 숨은 보스를 소환한다. 검사에선 소환이 끝난 상태만 만든다(자연 진행은 미검증).
 if(e.spawnState==='hidden'){e.spawnState='active';room.engaged=true;}
 try{settings.autoSkill=false;}catch(_){}if(!e.r368TestHp){e.r368TestHp=true;e.maxHp=e.hp=1e9;} // 스크린샷 동안 영웅 자동 공격에 쓰러지지 않게
 for(const o of room.enemies){o.cd=999;o.rest=999;}player.x=e.x-2.4;player.y=e.y+.6;player.vx=player.vy=0;try{cam.x=e.x-1.2;cam.y=e.y;}catch(_){}return {x:e.x,y:e.y,hp:e.hp,name:e.name,engaged:!!room.engaged,state:e.spawnState};});
const kill=p=>p.evaluate(()=>{const e=room.enemies.find(x=>window.__STORYWORLD_BETRAYAL_VIDEO_R368__.isBalrog(x)&&x.hp>0);if(!e)return false;e.hp=0;killEnemy(e);return true;});
const api=p=>p.evaluate(()=>window.__STORYWORLD_BETRAYAL_VIDEO_R368__.inspect());
const waitT=(p,t)=>p.waitForFunction(t=>{const a=window.__STORYWORLD_BETRAYAL_VIDEO_R368__.inspect();return !a.open||a.time>=t;},t,{timeout:30000});
for(const [label,viewport] of [['pc',{width:1280,height:720}],['mobile',{width:390,height:844}]]){
 const {b,p,errors}=await boot(viewport);
 const s0=await p.evaluate(()=>({bosses:regionById.ep1a09b.bosses.map(b=>b.name),d6:regionById.dist06.bosses.map(b=>b.name),inRoom:room.enemies.filter(e=>window.__STORYWORLD_BETRAYAL_VIDEO_R368__.isBalrog(e)).length,api:window.__STORYWORLD_BETRAYAL_VIDEO_R368__.inspect()}));
 check(label+': 결전의 날에 발록 보스 1체(dist06 발록은 그대로)',s0.bosses.length===1&&/발록/.test(s0.bosses[0])&&s0.inRoom===1&&s0.d6.some(n=>/발록/.test(n)),s0);
 check(label+': 영상 미리 불러오기',!!s0.api.preloaded&&!s0.api.preloaded.error,s0.api.preloaded);
 const pos=await near(p);
 await p.evaluate(()=>window.__STORYWORLD_BETRAYAL_VIDEO_R368__.setPrefs({tint:false}));await p.waitForTimeout(700);await near(p);
 const a0=(await api(p)).stats.tinted;await p.waitForTimeout(500);
 await p.screenshot({path:`${OUT}/boss-before-${label}.jpg`,type:'jpeg',quality:82});
 const t0=(await api(p)).stats.tinted-a0;
 await p.evaluate(()=>window.__STORYWORLD_BETRAYAL_VIDEO_R368__.setPrefs({tint:true}));await p.waitForTimeout(700);await near(p);
 const a1t=(await api(p)).stats.tinted;await p.waitForTimeout(500);
 await p.screenshot({path:`${OUT}/boss-after-${label}.jpg`,type:'jpeg',quality:82});
 const t1=(await api(p)).stats.tinted-a1t;
 check(label+': 결전의 날 발록만 색 필터(끄면 0)',t0===0&&t1>0,{t0,t1,pos});
 await p.evaluate(()=>{const v=document.querySelector('video');});
 await p.waitForFunction(()=>{const a=window.__STORYWORLD_BETRAYAL_VIDEO_R368__.inspect();return a.preloaded&&a.preloaded.ready>=2;},null,{timeout:30000}).catch(()=>{});
 check(label+': 발록 처치',await kill(p));
 await p.waitForTimeout(300);
 const a1=await p.evaluate(()=>({a:window.__STORYWORLD_BETRAYAL_VIDEO_R368__.inspect(),r317:!!document.getElementById('r317Cinema'),r317s:window.__STORYWORLD_MAPS_PALACE_SLUM_R317__?.inspect?.()?.stats}));
 check(label+': 처치 순간 영상이 열리고 R317 장면은 닫힘',a1.a.open&&!a1.r317&&a1.a.stats.plays===1,a1);
 const C=await p.evaluate(()=>window.__STORYWORLD_MAPS_PALACE_SLUM_R317__.CAPTIONS);
 const frozen=await p.evaluate(async()=>{const x=player.x;const e=room.enemies.find(o=>o.hp>0);const ex=e?.x;await new Promise(r=>setTimeout(r,600));return {same:player.x===x&&(!e||e.x===ex)};});
 check(label+': 재생 중 게임 멈춤',frozen.same,frozen);
 for(const [t,i,shot] of [[4.6,0,'cap1'],[7.0,1,'cap2'],[9.0,2,'cap3']]){await waitT(p,t);const a=await api(p);
  check(label+`: ${t}초 자막 = 정본 ${i+1}번째`,a.open&&a.caption===C[i],{time:a.time,caption:a.caption});
  await p.screenshot({path:`${OUT}/video-${shot}-${label}.jpg`,type:'jpeg',quality:82});}
 const bg=await p.evaluate(()=>window.__STORYWORLD_BETRAYAL_VIDEO_R368__.bgmGain());check(label+': 재생 중 BGM 0',bg===0,bg);
 await p.waitForFunction(()=>!window.__STORYWORLD_BETRAYAL_VIDEO_R368__.inspect().open,null,{timeout:20000});await p.waitForTimeout(600);
 const end=await p.evaluate(()=>({a:window.__STORYWORLD_BETRAYAL_VIDEO_R368__.inspect(),dom:!!document.getElementById('r368v'),bgm:window.__STORYWORLD_BETRAYAL_VIDEO_R368__.bgmGain()}));
 check(label+': 끝나면 닫히고 게임 복귀',!end.dom&&end.a.stats.ended===1&&end.bgm===1&&end.a.stats.errors===0,end);
 const moving=await p.evaluate(async()=>{player.invincible=50;await new Promise(r=>setTimeout(r,800));return {inv:player.invincible};});
 check(label+': 닫힌 뒤 게임 시간이 다시 흐름',moving.inv<50,moving);
 check(label+': 페이지 오류 없음',errors.length===0,errors);
 await b.close();}
// 끄기: 기존 R317 장면이 그대로 나온다
{const {b,p,errors}=await boot({width:1280,height:720},{'storyworld.r368.betrayal':JSON.stringify({on:false})});
 await near(p);check('off: 발록 처치',await kill(p));await p.waitForTimeout(400);
 const s=await p.evaluate(()=>({r317:!!document.getElementById('r317Cinema'),r368:!!document.getElementById('r368v')}));
 check('off: R317 장면이 열리고 영상은 안 나옴',s.r317&&!s.r368,s);
 await p.screenshot({path:`${OUT}/off-r317.jpg`,type:'jpeg',quality:80});check('off: 페이지 오류 없음',errors.length===0,errors);await b.close();}
// 기존 R317 을 이미 본 저장에서도 새 영상은 한 번 나온다
{const {b,p,errors}=await boot({width:1280,height:720},{'storyworld.r317.betrayal':JSON.stringify({seen:true})});
 await near(p);await p.waitForFunction(()=>{const a=window.__STORYWORLD_BETRAYAL_VIDEO_R368__.inspect();return a.preloaded&&a.preloaded.ready>=2;},null,{timeout:30000}).catch(()=>{});
 await kill(p);await p.waitForTimeout(300);const a=await api(p);check('r317 seen: 새 영상 재생',a.open,a);
 await p.evaluate(()=>window.__STORYWORLD_BETRAYAL_VIDEO_R368__.skip());await p.waitForFunction(()=>!window.__STORYWORLD_BETRAYAL_VIDEO_R368__.inspect().open,null,{timeout:10000}).catch(()=>{});const z=await api(p);check('r317 seen: 건너뛰기',!z.open&&z.stats.skips===1,z.stats);
 check('r317 seen: 페이지 오류 없음',errors.length===0,errors);await b.close();}
fs.writeFileSync(`${OUT}/results.json`,JSON.stringify({fails,results},null,1));
console.log(JSON.stringify({ok:fails===0,fails,checks:results.length,method:'headless Chromium (임시) — GPU·실기기·소리 품질 미검증'}));
process.exit(fails?1:0);
