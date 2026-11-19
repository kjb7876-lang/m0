// R1223 브라우저 검사(헤드리스): 기억 조각 종이·사몽 종이·입장 영상에서 녹음 음성이 기본으로 실제 재생 호출되는지, '음성 앞으로 끄기'가 보이고 저장되는지.
//  실행: 빌드한 site 를 정적 서버로 올린 뒤 SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1223/r1223-browser.mjs
//  ?cdn=off 로 음성을 같은 서버에서 받는다. 헤드리스라 귀로 듣는 확인·실기기·GPU 는 아니다(미검증으로 따로 적음).
import {createRequire} from 'node:module';import fs from 'node:fs';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const BASE=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const URL=BASE+(BASE.includes('?')?'&':'?')+'cdn=off';const SHOTS=process.env.SHOTS||'';
const res=[];const check=(n,ok,d='')=>{res.push({n,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+n+(d!==''?' :: '+d:''));};
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const errors=[];
const init=()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));window.__plays=[];const P=HTMLMediaElement.prototype.play;
 HTMLMediaElement.prototype.play=function(){const s=String(this.currentSrc||this.src||'');if(/r381\/voice/.test(s))window.__plays.push({src:s.split('/').pop(),vol:+this.volume.toFixed(2),t:performance.now()});return P.call(this);};};
const ctx=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});await ctx.addInitScript(init);const p=await ctx.newPage();
p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
const waitPlays=(n,ms=20000)=>p.waitForFunction(n=>window.__plays.length>=n,n,{timeout:ms}).then(()=>true,()=>false);
async function boot(){await p.goto(URL,{timeout:180000,waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>typeof booted!=='undefined'&&booted&&document.getElementById('campaignNew54'),null,{timeout:240000});
 await p.click('#campaignNew54');await p.locator('button',{hasText:'새 게임 시작'}).first().click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.evaluate(()=>{while(storyScene)advanceScene();closePanel(true);window.__plays.length=0;});}
await boot();
// 녹음 범위(정본 서사 문장 중 녹음 있는 비율) — 스토리·사몽
const cov=await p.evaluate(()=>{const R=window.__STORYWORLD_VOICE_R381__,M=window.__STORYWORLD_MEMORY_VOICE_R1223__;const out={story:[0,0],dream:[0,0],texts:{}};
 for(const r of regions){for(const part of ['pre','post','intro','enter']){let sc=[];try{sc=nextScenes(r,part)||[];}catch(_){}for(const s of sc){const k=String(s.key||'').startsWith('DREAM:')?'dream':'story';
  const ss=M.split(s.text||'');for(const t of ss){out[k][1]++;if(R.has(t))out[k][0]++;}if(!out.texts[k]&&ss.some(t=>R.has(t)))out.texts[k]=s.text;}}}return out;});
check('녹음 범위: 스토리 서사 문장 대부분에 녹음이 있음',cov.story[1]>0&&cov.story[0]/cov.story[1]>.5,JSON.stringify([cov.story,cov.dream]));
// ① 기억 조각 종이 — 기본 재생
const text=cov.texts.story;
const showDoc=(form,t,title)=>p.evaluate(([form,t,title])=>window.__STORYWORLD_STORY_COLLECT_R177__.show({key:'r1223:test:'+Math.random(),form,title,narr:'',text:t,place:''},{force:true}),[form,t,title]);
await showDoc('shard',text,'검사 기억');
const ok1=await waitPlays(1);const s1=await p.evaluate(()=>({plays:window.__plays.slice(),vol:settings.voice,insp:window.__STORYWORLD_MEMORY_VOICE_R1223__.inspect()}));
check('① 기억 조각이 펼쳐지면 녹음 음성 재생 호출(기본 켜짐)',ok1,JSON.stringify(s1).slice(0,300));
check('① 음량 = 설정 음성 음량',s1.plays[0]?.vol===+(+s1.vol).toFixed(2));
const btn=await p.evaluate(()=>{const e=document.querySelector('#r177Doc .r1223btn');if(!e)return null;const r=e.getBoundingClientRect(),d=document.getElementById('r177Doc').getBoundingClientRect();return {txt:e.textContent,w:r.width,h:r.height,inDoc:r.left>=d.left-1&&r.right<=d.right+1&&r.top>=d.top-1&&r.bottom<=d.bottom+1,vis:getComputedStyle(e).visibility,top:document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)===e};});
check('③ 종이에 음성 앞으로 끄기 단추가 바로 보임(눌리는 자리)',btn&&btn.w>20&&btn.h>10&&btn.inDoc&&btn.top&&/앞으로 끄기/.test(btn.txt),JSON.stringify(btn));
if(SHOTS)await p.screenshot({path:SHOTS+'/r1223-doc-on.png'});
await p.waitForTimeout(1500);check('② 음성 중에는 종이가 붙잡혀 있음',await p.evaluate(()=>window.__STORYWORLD_MEMORY_VOICE_R1223__.inspect().held&&!document.getElementById('r177Doc').hidden));
// 단추 누르기 → 바로 멈춤·저장·종이는 그대로
const pg0=await p.evaluate(()=>document.querySelector('#r177Doc .foot')?.textContent);
await p.click('#r177Doc .r1223btn');await p.waitForTimeout(400);
const s2=await p.evaluate(()=>({playing:window.__STORYWORLD_VOICE_R381__.inspect().playing,store:localStorage.getItem('storyworld.r1223.memvoice'),txt:document.querySelector('#r177Doc .r1223btn')?.textContent,hidden:document.getElementById('r177Doc').hidden,foot:document.querySelector('#r177Doc .foot')?.textContent}));
check('③ 누르면 음성이 바로 멈춤',!s2.playing,JSON.stringify(s2));
check('③ 꺼짐 저장',JSON.parse(s2.store||'{}').on===false);
check('③ 누름이 종이 넘김·닫기로 번지지 않음',!s2.hidden&&s2.foot===pg0,JSON.stringify([pg0,s2.foot]));
check('③ 단추가 음성 켜기로 바뀜',/켜기/.test(s2.txt||''));
if(SHOTS)await p.screenshot({path:SHOTS+'/r1223-doc-off.png'});
await p.evaluate(()=>{document.getElementById('r177Doc')?.click();for(let i=0;i<20;i++){const d=document.getElementById('r177Doc');if(!d||d.hidden)break;d.click();}window.__plays.length=0;});
await showDoc('note',text,'검사 쪽지 2');check('③ 끈 뒤 새 종이는 음성 없음',!(await waitPlays(1,4000)));
// 다시 불러와도 꺼짐 유지
await boot();await showDoc('shard',text,'검사 기억 3');
check('③ 새로 불러와도(새 판) 꺼짐 유지',!(await waitPlays(1,4000))&&/켜기/.test(await p.evaluate(()=>document.querySelector('#r177Doc .r1223btn')?.textContent||'')));
await p.click('#r177Doc .r1223btn');check('③ 켜기를 누르면 지금 쪽부터 다시 틈',await waitPlays(1));
await p.evaluate(()=>{for(let i=0;i<20;i++){const d=document.getElementById('r177Doc');if(!d||d.hidden)break;d.click();}});
// 설정 창 칸
await p.evaluate(()=>showSettings());const chk=await p.evaluate(()=>{const c=document.getElementById('r1223Chk');return c?{checked:c.checked,vis:c.getBoundingClientRect().width>0||!!c.closest('label')?.getBoundingClientRect().width}:null;});
check('③ 설정 창에 같은 칸(켜짐으로 보임)',chk&&chk.checked===true,JSON.stringify(chk));
await p.evaluate(()=>closePanel(true));
// ① 사몽(스토리 사몽 세계·사몽 에피소드가 같이 쓰는 원문) 기억 조각 — S-01 은 녹음 있음, R-00(사몽 역행 쪽)은 녹음 없음
const dream=await p.evaluate(()=>{const S=window.__STORYWORLD_SAMONG_TEXT_R103__.sections,j=k=>(S[k]?.blocks||[]).flatMap(b=>b.paras||[]).slice(0,2).join('\n\n');return {s01:j('S-01'),r00:j('R-00')};});
await p.evaluate(()=>window.__plays.length=0);await showDoc('shard',dream.s01,'사몽 검사');
check('① 사몽 기억 조각(S-01)도 녹음 재생 호출',await waitPlays(1));
const closeDoc=()=>p.evaluate(()=>{for(let i=0;i<20;i++){const d=document.getElementById('r177Doc');if(!d||d.hidden)break;d.click();}});
await closeDoc();await p.evaluate(()=>window.__plays.length=0);await showDoc('shard',dream.r00,'사몽 역행 검사');
check('② 녹음이 없는 조각(R-00)은 조용히 넘어감·단추는 보임',!(await waitPlays(1,4000))&&await p.evaluate(()=>!!document.querySelector('#r177Doc .r1223btn')&&!window.__STORYWORLD_MEMORY_VOICE_R1223__.inspect().held));
await closeDoc();
// ⑥ 입장 영상(R369 중독의 도시) — 자막 음성
await p.evaluate(()=>{window.__plays.length=0;window.__STORYWORLD_POISON_CITY_VIDEO_R369__.play();});
const vOpen=await p.waitForFunction(()=>!!document.getElementById('r369v'),null,{timeout:10000}).then(()=>true,()=>false);
check('⑥ 입장 영상이 열림',vOpen);
const vb=await p.evaluate(()=>{const e=document.querySelector('#r369v .r1223btn');if(!e)return null;const r=e.getBoundingClientRect();return {txt:e.textContent,w:r.width,top:document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)===e};});
check('⑥ 영상에도 음성 끄기 단추가 바로 보임',vb&&vb.w>20&&vb.top,JSON.stringify(vb));
const vok=await waitPlays(1,30000);const vs=await p.evaluate(()=>({plays:window.__plays.slice(),cap:document.querySelector('#r369v .cap')?.textContent,rate:document.querySelector('#r369v video')?.playbackRate,err:window.__STORYWORLD_POISON_CITY_VIDEO_R369__.inspect?.()}));
check('⑥ 영상 자막이 뜨면 녹음 음성 재생 호출',vok,JSON.stringify(vs).slice(0,400));
if(SHOTS)await p.screenshot({path:SHOTS+'/r1223-video.png'});
if(vok){check('⑥ 말하는 동안 영상이 늦춰짐(1 미만)',vs.rate<1,String(vs.rate));
 await p.click('#r369v .r1223btn');await p.waitForTimeout(400);const vo=await p.evaluate(()=>({open:!!document.getElementById('r369v'),playing:window.__STORYWORLD_VOICE_R381__.inspect().playing,rate:document.querySelector('#r369v video')?.playbackRate}));
 check('⑥ 영상에서 끄기 → 말 멈춤·영상은 계속(건너뛰기로 번지지 않음)·속도 1',vo.open&&!vo.playing&&vo.rate===1,JSON.stringify(vo));
 await p.click('#r369v .r1223btn');}
await p.evaluate(()=>window.__STORYWORLD_POISON_CITY_VIDEO_R369__.skip());
const mi=await p.evaluate(()=>window.__STORYWORLD_MEMORY_VOICE_R1223__.inspect());check('모듈 오류 0',mi.stats.moduleErrors===0,JSON.stringify(mi));
check('페이지 오류 0',errors.length===0,JSON.stringify(errors.slice(0,3)));
await b.close();const failed=res.filter(r=>!r.ok).length;console.log(JSON.stringify({total:res.length,failed,method:'playwright headless chromium (no GPU, no real speaker)'}));process.exit(failed?1:0);
