// R1044 브라우저 검사(헤드리스): 세 모드 서사 음성이 실제로 재생 호출·파일 받기까지 가는지, 끄기·음량이 먹는지, 안 쓰는 단추가 지워졌는지.
//  실행: 빌드한 site 를 정적 서버로 올린 뒤 SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1044/r1044-browser.mjs
//  ?cdn=off 로 음성을 같은 서버에서 받는다(외부 음성 서버 대신). 헤드리스라 귀로 듣는 확인·실기기는 아니다.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const BASE=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const URL=BASE+(BASE.includes('?')?'&':'?')+'cdn=off';
const res=[];const check=(n,ok,d='')=>{res.push({n,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+n+(d!==''?' :: '+d:''));};
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const errors=[];
// 재생 호출 기록 + 받은 파일(네트워크) 기록
const init=()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));window.__plays=[];const P=HTMLMediaElement.prototype.play;
 HTMLMediaElement.prototype.play=function(){const s=String(this.currentSrc||this.src||'');if(/r381\/voice/.test(s))window.__plays.push({src:s.split('/').pop(),vol:+this.volume.toFixed(2)});return P.call(this);};
 window.__tts=0;try{const S=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{window.__tts++;return S(u);};}catch(_){}};
async function page(){const ctx=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});await ctx.addInitScript(init);const p=await ctx.newPage();
 const got=[];p.on('response',r=>{if(/r381\/voice\/.*\.mp3/.test(r.url()))got.push(r.status());});p.on('pageerror',e=>errors.push(String(e).slice(0,200)));return {ctx,p,got};}
const waitGot=async(got,ms=30000)=>{const t0=Date.now();while(Date.now()-t0<ms){if(got.some(x=>x===200||x===206))return true;await new Promise(r=>setTimeout(r,500));}return false;};
const waitPlays=(p,n,ms=20000)=>p.waitForFunction(n=>window.__plays.length>=n,n,{timeout:ms}).then(()=>true,()=>false);
// ---------------- 스토리 모드 ----------------
{const {ctx,p,got}=await page();const T='스토리';
 await p.goto(URL,{timeout:180000,waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>typeof booted!=='undefined'&&booted&&document.getElementById('campaignNew54'),null,{timeout:240000});
 await p.click('#campaignNew54');await p.locator('button',{hasText:'새 게임 시작'}).first().click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.evaluate(()=>{while(storyScene)advanceScene();closePanel(true);window.__plays.length=0;});
 const ids=await p.evaluate(()=>regions.filter(r=>r.bosses?.length&&r.records?.length&&nextScenes(r,'pre').length).map(r=>r.id));
 const play=id=>p.evaluate(id=>{playScenes(nextScenes(regionById[id],'pre'),()=>{});},id);
 await play(ids[0]);await p.evaluate(()=>document.getElementById('r255Cinema')?.click());
 const ok=await waitPlays(p,1);const s1=await p.evaluate(()=>({plays:window.__plays.slice(),set:settings.voice,tts:window.__tts,insp:window.__STORYWORLD_NARRATION_VOICE_R1044__?.inspect()}));
 check(`${T}: 보스 입장 서사 창이 뜨면 녹음 음성 재생 호출`,ok&&s1.plays.length>=1,JSON.stringify(s1).slice(0,300));
 check(`${T}: 음량 = 설정 음성 음량`,s1.plays[0]?.vol===+(+s1.set).toFixed(2),JSON.stringify(s1.plays[0]));
 await waitGot(got);check(`${T}: 음성 파일을 실제로 받음(200/206)`,got.some(s=>s===200||s===206),JSON.stringify(got));
 check(`${T}: 브라우저 음성(TTS)으로 대신하지 않음`,s1.tts===0);
 const dead=await p.evaluate(()=>['storyAudio','storyAudioStop','voiceStatus','storyTTS'].filter(id=>document.getElementById(id)));
 check(`${T}: 안 쓰는 음성 단추 4개가 DOM 에 없음`,dead.length===0,JSON.stringify(dead));
 const foot=await p.evaluate(()=>[...document.querySelectorAll('#panel .storyFoot > *')].filter(e=>e.getBoundingClientRect().width>0).map(e=>e.textContent.trim()));
 check(`${T}: 단추 줄 = 계속·건너뛰기·텍스트 항상 끄기`,JSON.stringify(foot)===JSON.stringify(['계속 · Enter','건너뛰기','텍스트 항상 끄기']),JSON.stringify(foot));
 // 다음 장면·닫기 → 멈춤
 await p.evaluate(()=>{while(storyScene)advanceScene();});await p.waitForTimeout(300);
 const st=await p.evaluate(()=>({paused:[...document.querySelectorAll('audio')].length,r381:window.__STORYWORLD_VOICE_R381__.inspect().playing,me:window.__STORYWORLD_NARRATION_VOICE_R1044__.inspect().playing}));
 check(`${T}: 창을 닫으면 음성이 멈춤`,!st.r381&&!st.me,JSON.stringify(st));
 // 설정: 서사 음성 자동 재생 끔
 await p.evaluate(()=>{settings.narration=false;window.__plays.length=0;});await play(ids[1]);await p.evaluate(()=>document.getElementById('r255Cinema')?.click());
 check(`${T}: '서사 음성 자동 재생' 끄면 안 틀음`,!(await waitPlays(p,1,4000)));
 await p.evaluate(()=>{while(storyScene)advanceScene();settings.narration=true;settings.voice=0;window.__plays.length=0;});await play(ids[1]);await p.evaluate(()=>document.getElementById('r255Cinema')?.click());
 check(`${T}: 음성 음량 0 이면 안 틀음`,!(await waitPlays(p,1,4000)));
 await p.evaluate(()=>{while(storyScene)advanceScene();settings.voice=.35;window.__plays.length=0;});await play(ids[1]);await p.evaluate(()=>document.getElementById('r255Cinema')?.click());
 const okv=await waitPlays(p,1);check(`${T}: 음량 0.35 로 바꾸면 0.35 로 틀음`,okv&&(await p.evaluate(()=>window.__plays[0]?.vol))===.35);
 // 텍스트 항상 끄기 → 바로 넘김·음성 없음
 await p.evaluate(()=>{while(storyScene)advanceScene();settings.voice=.8;window.__STORYWORLD_NARRATION_R1037__.set('story',false);window.__plays.length=0;});
 await play(ids[2]);check(`${T}: 서사 텍스트 항상 끄기면 창도 음성도 없음(바로 진행)`,!(await waitPlays(p,1,4000))&&!(await p.evaluate(()=>!!storyScene)));
 await p.evaluate(()=>window.__STORYWORLD_NARRATION_R1037__.set('story',true));
 check(`${T}: 모듈 오류 0`,await p.evaluate(()=>window.__STORYWORLD_NARRATION_VOICE_R1044__.inspect().stats.moduleErrors===0));
 await ctx.close();}
// ---------------- 영화 모드 ----------------
{const {ctx,p,got}=await page();const T='영화';
 await p.goto(URL,{timeout:180000,waitUntil:'domcontentloaded'});await p.locator('#cinemaStartR461').waitFor({timeout:240000});await p.waitForTimeout(500);await p.click('#cinemaStartR461');await p.waitForTimeout(1200);
 const ng=p.locator('button',{hasText:'새 게임 시작'});if(await ng.count())await ng.first().click();
 await p.waitForFunction(()=>started&&!loading&&!!window.__STORYWORLD_CINEMA_MODE_R370__?.prefs?.()?.on,null,{timeout:240000});
 const ok=await waitPlays(p,1,240000);await waitGot(got);
 const s=await p.evaluate(()=>({plays:window.__plays.slice(0,3),set:settings.voice,me:window.__STORYWORLD_NARRATION_VOICE_R1044__.inspect().stats.played}));
 check(`${T}: 서사 자막과 함께 녹음 음성 재생 호출`,ok,JSON.stringify(s));
 check(`${T}: 음성 파일을 실제로 받음`,got.some(x=>x===200||x===206),JSON.stringify(got));
 check(`${T}: R1044 는 영화 모드에서 따로 틀지 않음(겹침 없음)`,s.me===0,String(s.me));
 // 서사 자막 끄기 → 음성은 계속(자막만 숨김)
 await p.evaluate(()=>{window.__STORYWORLD_NARRATION_R1037__.set('subs',false);});
 const n0=await p.evaluate(()=>window.__plays.length);const more=await waitPlays(p,n0+1,240000);
 check(`${T}: 서사 자막을 꺼도 음성은 계속 나옴`,more);
 await p.evaluate(()=>{window.__STORYWORLD_NARRATION_R1037__.set('subs',true);window.__STORYWORLD_CINEMA_MODE_R370__.set({voice:'none'});});await p.waitForTimeout(500);
 const n1=await p.evaluate(()=>window.__plays.length);
 check(`${T}: 목소리 '자막만'이면 녹음 안 틀음`,!(await waitPlays(p,n1+1,30000)));
 await p.evaluate(()=>window.__STORYWORLD_CINEMA_MODE_R370__.set({voice:''}));
 await ctx.close();}
// ---------------- 무한생존 ----------------
{const {ctx,p,got}=await page();const T='무한생존';
 await p.goto(URL,{timeout:180000,waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>typeof booted!=='undefined'&&booted&&!!window.__STORYWORLD_SURVIVAL_R600__,null,{timeout:240000});
 // 처음 화면 → 난이도 → 영웅 → 시작(r1006 과 같은 절차)
 await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="slayer"]').click();await p.locator('#r600Go').click();
 await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.active(),null,{timeout:240000}).catch(()=>{});
 const act=await p.evaluate(()=>window.__STORYWORLD_SURVIVAL_R600__.active());check(`${T}: 시작됨`,act);
 const ok=act&&await waitPlays(p,1,240000);await waitGot(got);
 check(`${T}: 보스 전 서사 녹음 음성 재생 호출`,ok,JSON.stringify(await p.evaluate(()=>window.__plays.slice(0,3))));
 check(`${T}: 음성 파일을 실제로 받음`,got.some(x=>x===200||x===206),JSON.stringify(got));
 await p.evaluate(()=>window.__STORYWORLD_SURVIVAL_R600__.setTrack('combat'));await p.waitForTimeout(300);
 const n0=await p.evaluate(()=>window.__plays.length);
 check(`${T}: 서사 트랙 '전투 집중'(음성 끔)이면 녹음 안 틀음`,!(await waitPlays(p,n0+1,30000)));
 await ctx.close();}
check('페이지 오류 0',errors.length===0,JSON.stringify(errors.slice(0,3)));
await b.close();const failed=res.filter(r=>!r.ok).length;console.log(JSON.stringify({total:res.length,failed,method:'headless chromium — play() calls + network; not listened by ear, not real device'}));process.exit(failed?1:0);
