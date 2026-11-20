// R1272 헤드리스 실측: 실제 클릭 뒤(자동재생 허용 플래그 없이) 중독의 도시 입장 영상을 틀고, 낭독 녹음 재생·영상 음량(vv)·말줄임 원문 연결(full)을 1초마다 기록.
//  실행: 빌드한 site 를 http://127.0.0.1:4410/m0/ 로 올린 뒤 node r96/qa/r1272/r1272-entry-repro.mjs
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const ZONE=process.env.ZONE||'ep1a10';const URL='http://127.0.0.1:4410/m0/?cdn=off';
const b=await chromium.launch({args:(process.env.FLAG?['--autoplay-policy=no-user-gesture-required']:[])});
const ctx=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
await ctx.addInitScript(()=>{Object.defineProperty(Navigator.prototype,'webdriver',{get:()=>false});localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));window.__log=[];const L=(...a)=>window.__log.push([Math.round(performance.now()),...a].join(' '));
 const P=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){const s=String(this.currentSrc||this.src||'').split('/').pop();const tag=this.tagName;L('play',tag,s,'muted='+this.muted,'vol='+this.volume);
  if(!this.__w){this.__w=1;for(const ev of['playing','ended','error','pause'])this.addEventListener(ev,()=>L('ev',ev,tag,String(this.currentSrc||this.src).split('/').pop(),'t='+(+this.currentTime).toFixed(2),'muted='+this.muted));}
  const p=P.call(this);p&&p.catch&&p.catch(e=>L('REJECT',tag,s,e.name));return p;};});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await p.goto(URL,{timeout:180000,waitUntil:'domcontentloaded'});
await p.waitForFunction(()=>typeof booted!=='undefined'&&booted&&document.getElementById('campaignNew54'),null,{timeout:240000});
await p.click('#campaignNew54');await p.locator('button',{hasText:'새 게임 시작'}).first().click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
await p.evaluate(()=>{while(storyScene)advanceScene();closePanel(true);});
await p.waitForFunction(()=>!!document.getElementById('r309v'),null,{timeout:60000}).catch(()=>console.log('no opening'));
for(let k=0;k<20;k++){const busy=await p.evaluate(()=>{window.__STORYWORLD_INTRO_VIDEO_R309__?.skip?.();while(storyScene)advanceScene();closePanel(true);return !!document.querySelector('#r309v,#r309,#r617v,#r880')||loading;});if(!busy)break;await p.waitForTimeout(1000);}
await p.mouse.click(640,360);await p.waitForTimeout(1500);
await p.evaluate(z=>{localStorage.removeItem('storyworld.r369.poison');window.__STORYWORLD_POISON_CITY_VIDEO_R369__.setPrefs({seen:false});window.__log.length=0;window.__log.push('enter');window.__er=enterRegion(z,null,{restore:true});},ZONE);
await p.waitForTimeout(500);console.log('er',await p.evaluate(()=>window.__er));
for(let i=0;i<40;i++){await p.waitForTimeout(1000);const s=await p.evaluate(()=>({v:!!document.getElementById('r369v'),vt:document.querySelector('#r369v video')?.currentTime,vv:document.querySelector('#r369v video')?.volume,cap:document.querySelector('#r369v .cap.on')?.textContent||'',scene:!!storyScene,loading,m:window.__STORYWORLD_MEMORY_VOICE_R1223__.inspect().stats}));
 console.log(i,await p.evaluate(()=>[room?.id,zone,JSON.stringify(window.__STORYWORLD_ENTRY_VIDEO_R1036__.inspect().waiting)].join(' ')),JSON.stringify({v:s.v,vt:s.vt,vv:s.vv,full:s.m.fullLines,duck:s.m.ducked,cap:s.cap.slice(0,12),scene:s.scene,loading:s.loading,played:s.m.played,ended:s.m.ended,err:s.m.errors,vl:s.m.videoLines}));if(i>8&&!s.v&&!s.loading)break;}
console.log((await p.evaluate(()=>window.__log)).join('\n'));console.log('pageerrors',errs);
console.log(JSON.stringify(await p.evaluate(()=>({e:window.__STORYWORLD_ENTRY_VIDEO_R1036__.inspect(),v:window.__STORYWORLD_VOICE_R381__.inspect()}))));
await b.close();
