// R1037 브라우저 검사(헤드리스): 서사 텍스트 항상 끄기 — 이야기 모드 PC 1280×720 과 폰 375×812.
//  ① 보스 입장 서사 창: '텍스트 항상 끄기' 단추, 녹음 없는 음성 단추 숨김, 누르면 바로 진행·다음 보스 입장은 창·이름 카드 없이 바로.
//  ② 설정 '전투 화면' 묶음에서 다시 켜면 다시 뜸, 새로고침 뒤에도 유지.
//  ③ 기억 조각·쪽지 창: '항상 끄기', 1쪽 창 쓸모없는 단추 숨김, 끄면 안 펼침·다시 켜면 펼침.
//  ④ 서사 자막(R1021): 영화 모드 자막(#r370Subs)·선화 컷신 글(#r880 .cap) 끄고 켜기.
//  실행: 빌드한 site 를 정적 서버로 올린 뒤 SW_URL=http://127.0.0.1:4410/m0/ SW_SHOT=/mnt/project-files/r1037/ node r96/qa/r1037/r1037-browser.mjs
//  헤드리스라 실기기·GPU·터치 감각 확인은 아니다.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const SHOT=process.env.SW_SHOT||'';
const res=[];const check=(n,ok,d='')=>{res.push({n,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+n+(d!==''?' :: '+d:''));};
const b=await chromium.launch();const errors=[];
const VIS='(e=>{if(!e)return false;if(e.checkVisibility&&!e.checkVisibility({visibilityProperty:true,opacityProperty:true}))return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0;})';
const vis=(p,sel)=>p.evaluate(([s,f])=>eval(f)(document.querySelector(s)),[sel,VIS]);
async function story(vp,touch){const ctx=await b.newContext({viewport:vp,deviceScaleFactor:1,hasTouch:!!touch,isMobile:!!touch});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e).slice(0,200)));await p.goto(URL,{timeout:180000,waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>typeof booted!=='undefined'&&booted&&document.getElementById('campaignNew54'),null,{timeout:240000});
 await p.click('#campaignNew54');await p.locator('button',{hasText:'새 게임 시작'}).first().click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.evaluate(()=>{while(storyScene)advanceScene();closePanel(true);});return {ctx,p};}
const bossIds=p=>p.evaluate(()=>regions.filter(r=>r.bosses?.length&&r.records?.length&&nextScenes(r,'pre').length).map(r=>r.id));
const play=(p,id)=>p.evaluate(id=>{window.__r1037done=(window.__r1037done||0);playScenes(nextScenes(regionById[id],'pre'),()=>{window.__r1037done++;});return nextScenes(regionById[id],'pre').length;},id);
const cinemaCanvas=p=>p.evaluate(()=>!!document.getElementById('r255Cinema'));
// ---------------- PC ----------------
{const {ctx,p}=await story({width:1280,height:720});const T='PC';const ids=await bossIds(p);
 check(`${T}: 보스 구역 '전투 전' 서사가 있는 지역 3곳 이상`,ids.length>=3,ids.slice(0,5).join(','));
 const n=await play(p,ids[0]);await p.waitForTimeout(400);
 await p.evaluate(()=>document.getElementById('r255Cinema')?.click());await p.waitForTimeout(300);
 if(SHOT)await p.screenshot({path:SHOT+'pc-boss-story-on.png'});
 check(`${T} 서사 창이 뜸(${n}장)`,await vis(p,'#panel .storyText'));
 check(`${T} 서사 창에 '텍스트 항상 끄기' 단추가 보임`,await vis(p,'#r1037Off'));
 check(`${T} 계속 단추는 그대로 보임`,await vis(p,'#storyNext'));
 const hid=await p.evaluate(f=>['storyAudio','storyAudioStop','voiceStatus','storyTTS'].map(id=>({id,v:eval(f)(document.getElementById(id))})),VIS);
 check(`${T} 안 쓰는 UI(녹음 없는 음성 재생·정지·상태 글·선택 음성 합성) 안 보임`,hid.every(h=>!h.v),JSON.stringify(hid));
 const foot=await p.evaluate(f=>[...document.querySelectorAll('#panel .storyFoot > *')].filter(eval(f)).map(e=>e.textContent.trim()),VIS);
 check(`${T} 단추 줄 = 계속·건너뛰기·텍스트 항상 끄기`,JSON.stringify(foot)===JSON.stringify(['계속 · Enter','건너뛰기','텍스트 항상 끄기']),JSON.stringify(foot));
 const d0=await p.evaluate(()=>window.__r1037done);await p.click('#r1037Off');await p.waitForTimeout(300);
 const after=await p.evaluate(()=>({scene:!!storyScene,modal,done:window.__r1037done,skip:window.__STORYWORLD_GUIDE_FRAGMENT_R365__.prefs().skipStory,ls:JSON.parse(localStorage.getItem('storyworld.r365.guideFragment')||'{}').skipStory}));
 check(`${T} 누르면 창이 닫히고 진행(done) 1번`,!after.scene&&!after.modal&&after.done===d0+1,JSON.stringify(after));
 check(`${T} 누르면 꺼짐이 저장됨(R365 skipStory)`,after.skip===true&&after.ls===true,JSON.stringify(after));
 if(SHOT)await p.screenshot({path:SHOT+'pc-after-off.png'});
 // 다음 보스 입장: 바로
 const d1=await p.evaluate(()=>window.__r1037done);await play(p,ids[1]);await p.waitForTimeout(150);
 const nx=await p.evaluate(()=>({scene:!!storyScene,modal,done:window.__r1037done}));
 check(`${T} 끈 뒤 다음 보스 입장: 서사 창 없이 바로 진행`,!nx.scene&&!nx.modal&&nx.done===d1+1,JSON.stringify(nx));
 check(`${T} 끈 뒤 다음 보스 입장: 보스 이름 카드(3.4초)도 안 뜸`,!(await cinemaCanvas(p)));
 // 설정에서 다시 켜기
 await p.evaluate(()=>showSettings());await p.waitForTimeout(900);
 const rows=await p.evaluate(f=>[...document.querySelectorAll('#combatScreenR1021 input[data-r1037]')].map(i=>({k:i.dataset.r1037,c:i.checked,v:eval(f)(i.closest('label'))})),VIS);
 check(`${T} 설정 '전투 화면' 묶음에 서사 창·기억 조각 창 줄이 보임`,rows.length===2&&rows.every(r=>r.v),JSON.stringify(rows));
 check(`${T} 설정 서사 창 줄은 꺼짐으로 보임`,rows.find(r=>r.k==='story')?.c===false);
 check(`${T} 아래 옛 줄(서사 창 자동 넘기기)도 켜짐으로 맞음`,await p.evaluate(()=>document.getElementById('r365SkipStory')?.checked===true));
 if(SHOT)await p.screenshot({path:SHOT+'pc-settings.png'});
 await p.evaluate(()=>{const i=document.querySelector('#combatScreenR1021 input[data-r1037="story"]');i.click();});await p.waitForTimeout(200);
 check(`${T} 설정 줄로 다시 켜면 저장됨`,await p.evaluate(()=>JSON.parse(localStorage.getItem('storyworld.r365.guideFragment')||'{}').skipStory===false));
 check(`${T} 옛 줄도 함께 꺼짐으로 맞음`,await p.evaluate(()=>document.getElementById('r365SkipStory')?.checked===false));
 await p.evaluate(()=>closePanel(true));await play(p,ids[2]);await p.waitForTimeout(400);await p.evaluate(()=>document.getElementById('r255Cinema')?.click());
 check(`${T} 다시 켠 뒤 보스 입장: 서사 창이 다시 뜸`,await vis(p,'#panel .storyText')&&await vis(p,'#r1037Off'));
 await p.evaluate(()=>{while(storyScene)advanceScene();});
 // ---- 기억 조각 창 ----
 await p.evaluate(()=>window.__STORYWORLD_STORY_COLLECT_R177__.show({form:'shard',title:'시험 조각',narr:'환도',text:'첫 문단입니다.\n\n둘째 문단입니다.'},{}));await p.waitForTimeout(700);
 if(SHOT)await p.screenshot({path:SHOT+'pc-fragment-on.png'});
 check(`${T} 기억 조각 창이 뜨고 '항상 끄기' 단추가 보임`,await vis(p,'#r177Doc')&&await vis(p,'#r1037FragOff'));
 const fb=await p.evaluate(f=>({prev:eval(f)(document.querySelector('#r177Doc [data-r182="prev"]')),x:eval(f)(document.querySelector('#r177Doc [data-r182="close"]')),close:eval(f)(document.querySelector('#r177Doc [data-r182="next"]')),txt:document.querySelector('#r177Doc .foot').textContent}),VIS);
 check(`${T} 1쪽 창: ◀·'1 / 1'·중복 ✕ 숨김, 닫기는 남음`,!fb.prev&&!fb.x&&fb.close&&!/1 \/ 1/.test(fb.txt),JSON.stringify(fb));
 await p.click('#r1037FragOff');await p.waitForTimeout(300);
 check(`${T} 항상 끄기 누르면 창이 닫힘`,!(await vis(p,'#r177Doc')));
 check(`${T} 꺼짐이 저장됨(R177 autoShow=false)`,await p.evaluate(()=>window.__STORYWORLD_STORY_COLLECT_R177__.prefs().autoShow===false));
 await p.evaluate(()=>window.__STORYWORLD_STORY_COLLECT_R177__.show({form:'note',title:'둘째 쪽지',text:'글'},{}));await p.waitForTimeout(500);
 check(`${T} 끈 뒤 주운 조각은 창으로 안 펼침`,!(await vis(p,'#r177Doc')));
 // 새로고침 뒤에도 유지 + 다시 켜기
 await p.evaluate(()=>window.__STORYWORLD_NARRATION_R1037__.set('story',false));
 await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>typeof booted!=='undefined'&&booted&&!!window.__STORYWORLD_NARRATION_R1037__,null,{timeout:240000});
 const kept=await p.evaluate(()=>window.__STORYWORLD_NARRATION_R1037__.inspect());
 check(`${T} 새로고침 뒤에도 서사 창·기억 조각 창 꺼짐 유지`,kept.story===false&&kept.fragment===false,JSON.stringify(kept));
 await p.evaluate(()=>{window.__STORYWORLD_NARRATION_R1037__.set('story',true);window.__STORYWORLD_NARRATION_R1037__.set('fragment',true);});
 await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>typeof booted!=='undefined'&&booted&&!!window.__STORYWORLD_NARRATION_R1037__,null,{timeout:240000});
 const back=await p.evaluate(()=>window.__STORYWORLD_NARRATION_R1037__.inspect());
 check(`${T} 다시 켜면 새로고침 뒤에도 켜짐`,back.story===true&&back.fragment===true,JSON.stringify(back));
 check(`${T} 모듈 오류 0`,back.stats.errors===0,back.lastError||'');
 await ctx.close();}
// ---------------- 영화 모드 자막 ----------------
{const ctx=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});const T='영화';
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e).slice(0,200)));await p.goto(URL,{timeout:180000,waitUntil:'domcontentloaded'});
 // 영화 모드는 처음 화면의 따로 입구(R461)로 시작한다
 await p.locator('#cinemaStartR461').waitFor({timeout:240000});await p.waitForTimeout(500);await p.click('#cinemaStartR461');await p.waitForTimeout(1200);
 const ng=p.locator('button',{hasText:'새 게임 시작'});if(await ng.count())await ng.first().click();
 await p.waitForFunction(()=>started&&!loading&&!!window.__STORYWORLD_CINEMA_MODE_R370__?.prefs?.()?.on,null,{timeout:240000});
 // 첫 지역 서사가 자막으로 흐를 때까지(게임 시간 기준이 아니라 자막 글 기준)
 await p.waitForFunction(()=>(document.querySelector('#r370Subs .t')?.textContent||'').length>0,null,{timeout:180000}).catch(()=>{});
 const s0=await p.evaluate(()=>({cine:!!window.__STORYWORLD_CINEMA_MODE_R370__.prefs().on,txt:document.querySelector('#r370Subs .t')?.textContent||'',on:document.getElementById('r370Subs')?.classList.contains('on'),scene:!!storyScene}));
 check(`${T}: 서사 창 대신 아래 자막으로 흐름`,s0.txt.length>0&&!s0.scene,JSON.stringify(s0));
 const subsVis=()=>p.evaluate(()=>{const e=document.getElementById('r370Subs');return e?getComputedStyle(e).display!=='none':false;});
 check(`${T}: 자막 켜짐이면 자막 상자가 보임`,await subsVis());
 if(SHOT)await p.screenshot({path:SHOT+'cinema-subs-on.png'});
 await p.evaluate(()=>window.__STORYWORLD_NARRATION_R1037__.set('subs',false));await p.waitForTimeout(200);
 check(`${T}: 서사 자막 끄면 영화 자막 숨김`,!(await subsVis()));
 // 선화 컷신 글(#r880 .cap): 같은 CSS 를 쓰는 시험 요소로 잰다
 const cap=await p.evaluate(()=>{let r=document.getElementById('r880');let made=false;if(!r){r=document.createElement('div');r.id='r880';r.innerHTML='<div class="cap on">시험</div>';document.body.appendChild(r);made=true;}const d=getComputedStyle(r.querySelector('.cap')).display;if(made)r.remove();return d;});
 check(`${T}: 서사 자막 끄면 선화 컷신 글(#r880 .cap)도 숨김`,cap==='none',cap);
 if(SHOT)await p.screenshot({path:SHOT+'cinema-subs-off.png'});
 await p.evaluate(()=>window.__STORYWORLD_NARRATION_R1037__.set('subs',true));await p.waitForTimeout(200);
 check(`${T}: 다시 켜면 영화 자막 다시 보임`,await subsVis());
 check(`${T}: 설정 저장(R1021 subs)`,await p.evaluate(()=>JSON.parse(localStorage.getItem('storyworld.r1021.combat')||'{}').subs===true));
 await ctx.close();}
// ---------------- 폰 ----------------
{const {ctx,p}=await story({width:375,height:812},true);const T='폰';const ids=await bossIds(p);
 await play(p,ids[0]);await p.waitForTimeout(400);await p.evaluate(()=>document.getElementById('r255Cinema')?.click());await p.waitForTimeout(300);
 if(SHOT)await p.screenshot({path:SHOT+'phone-boss-story.png'});
 const r=await p.evaluate(()=>{const e=document.getElementById('r1037Off');if(!e)return null;const a=e.getBoundingClientRect();return {l:a.left|0,r:a.right|0,w:innerWidth};});
 check(`${T} '텍스트 항상 끄기' 단추가 화면 안에 보임`,r&&r.l>=0&&r.r<=r.w&&await vis(p,'#r1037Off'),JSON.stringify(r));
 await p.evaluate(()=>{while(storyScene)advanceScene();});
 await p.evaluate(()=>window.__STORYWORLD_STORY_COLLECT_R177__.show({form:'shard',title:'시험 조각',text:'첫 문단입니다.'},{}));await p.waitForTimeout(700);
 if(SHOT)await p.screenshot({path:SHOT+'phone-fragment.png'});
 const f=await p.evaluate(()=>{const e=document.getElementById('r1037FragOff');if(!e)return null;const a=e.getBoundingClientRect();return {l:a.left|0,r:a.right|0,w:innerWidth};});
 check(`${T} 기억 조각 창 '항상 끄기'가 화면 안에 보임`,f&&f.l>=0&&f.r<=f.w&&await vis(p,'#r1037FragOff'),JSON.stringify(f));
 await ctx.close();}
check('페이지 오류 0',errors.length===0,JSON.stringify(errors.slice(0,3)));
await b.close();const failed=res.filter(r=>!r.ok).length;console.log(JSON.stringify({total:res.length,failed,method:'headless chromium (software render) — not GPU/real device'}));process.exit(failed?1:0);
