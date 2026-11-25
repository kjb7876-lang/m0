// R1311 헤드리스 브라우저 확인(그래픽·실플레이 아님): 실제 빌드에서 새 게임 → 거점(hub)에서 오프닝이 안 나오는지,
// 첫 몹 맵(dist00)에 들어갈 때 opening-book.mp4 가 나오는지, 닫은 뒤 입장 서사창이 열리는지, 다시 들어가면 안 나오는지.
// webdriver 를 false 로 덮어 실제 사용자 조건과 같게 한다. SW_URL 기본 http://127.0.0.1:4410/m0/ , 첫 인자 = 스크린샷 폴더(선택).
import {createRequire} from 'node:module';const {chromium}=createRequire(import.meta.url)('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',shots=process.argv[2]||null;let pass=0,fail=0;const ok=(n,c)=>{c?pass++:fail++;console.log(c?'PASS':'FAIL',n);};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{Object.defineProperty(Navigator.prototype,'webdriver',{get:()=>false});localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const vid=()=>p.evaluate(()=>{const v=document.querySelector('#r309v video');return v?(v.currentSrc||v.src).split('/').slice(-2).join('/'):null;});
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(3000);
let s=await p.evaluate(()=>({z:room.id,mobs:room.enemies.filter(e=>e.hp>0).length,i:window.__STORYWORLD_INTRO_VIDEO_R309__.inspect()}));
ok(`새 게임 뒤 거점(${s.z}, 몹 ${s.mobs})에서 영상 없음`,s.z==='hub'&&s.mobs===0&&s.i.stats.plays===0&&!(await vid()));
ok('대기 상태 걸림',s.i.pending===true);
if(shots)await p.screenshot({path:shots+'/1-hub.jpg',quality:80});
await p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
// 입장 서사 호출을 기록(R78 이 dist00 입장 서사를 문 앞으로 미루므로 storyScene 이 아니라 엔진 enterNarrative 호출 자체를 본다)
await p.evaluate(()=>{window.__r1311calls=[];const base=enterNarrative;enterNarrative=function(def,...a){window.__r1311calls.push({id:def?.id,video:!!document.getElementById('r309v')});return base.call(this,def,...a);};});
await p.evaluate(()=>enterRegion('dist00','hub',{layer:'STORY',restore:true}));
await p.waitForFunction(()=>!loading&&room?.id==='dist00',null,{timeout:150000});await p.waitForTimeout(1500);
s=await p.evaluate(()=>({z:room.id,mobs:room.enemies.filter(e=>e.hp>0).length,i:window.__STORYWORLD_INTRO_VIDEO_R309__.inspect(),story:window.__r1311calls.length}));
const src=await vid();
ok(`첫 몹 맵(${s.z}, 몹 ${s.mobs}) 입장 때 오프닝 영상 재생(${src})`,s.z==='dist00'&&s.mobs>0&&s.i.stats.plays===1&&src==='r372/opening-book.mp4');
ok('영상이 열린 동안 입장 서사(enterNarrative) 호출 없음',s.story===0);
if(shots)await p.screenshot({path:shots+'/2-dist00-video.jpg',quality:80});
await p.evaluate(()=>window.__STORYWORLD_INTRO_VIDEO_R309__.skip());await p.waitForTimeout(1500);
s=await p.evaluate(()=>({calls:window.__r1311calls,open:!!document.getElementById('r309v')}));
ok('영상을 닫은 뒤 dist00 입장 서사를 한 번 부름(영상 닫힌 뒤)',!s.open&&s.calls.length===1&&s.calls[0].id==='dist00'&&!s.calls[0].video);
if(shots)await p.screenshot({path:shots+'/3-dist00-story.jpg',quality:80});
await p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
await p.evaluate(()=>enterRegion('hub','dist00',{layer:'STORY',restore:true}));await p.waitForFunction(()=>!loading&&room?.id==='hub',null,{timeout:150000});
await p.evaluate(()=>enterRegion('dist00','hub',{layer:'STORY',restore:true}));await p.waitForFunction(()=>!loading&&room?.id==='dist00',null,{timeout:150000});await p.waitForTimeout(1200);
s=await p.evaluate(()=>window.__STORYWORLD_INTRO_VIDEO_R309__.inspect());
ok('다시 들어가도 안 나옴(한 번만)',s.stats.plays===1&&!(await vid()));
ok('페이지 오류 없음',errs.length===0);if(errs.length)console.log(errs);
console.log(`\nR1311 browser ${pass}/${pass+fail} (headless, webdriver=false 덮음, 그래픽·실플레이 미검증)`);await b.close();process.exit(fail?1:0);
