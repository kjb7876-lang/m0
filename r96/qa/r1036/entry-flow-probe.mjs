// R1036 실제 입장 흐름 측정(헤드리스): last301 → last302 첫 입장. 영상(R617 해안)이 언제 뜨는지, 로딩이 언제 끝나는지, 영상이 닫힌 뒤 첫 draw 시간.
// 입장 서사창은 뜨면 1초 뒤 넘긴다(사람이 읽는 시간 대신). SW_URL 에 ?vid617=1 을 붙여 띄운다(webdriver 에서도 영상).
// node entry-flow-probe.mjs [out.json]
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
// SW_URL 에 ?vid617=1 을 붙여 실행할 것(lib.mjs 가 import 때 읽음): SW_URL='http://127.0.0.1:4410/m0/?vid617=1'
const outFile=process.argv[2]||'';const VP=(process.env.VP||'1280x720').split('x').map(Number);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:VP[0],height:VP[1]},init:{'storyworld.r617.hwandofall':JSON.stringify({on:true,seen:['knight','fall']})}});
await go(p,'last301');await p.waitForTimeout(2000);
const res=await p.evaluate(async()=>{const T=()=>performance.now();const ev={},rows=[];let phase='pre';const t0=T();
 const base=draw;draw=function(...a){const s=T();const r=base.apply(this,a);rows.push({phase,ms:T()-s,t:s-t0,cov:!!document.getElementById('r617v'),here:room?.id==='last302'&&!loading});return r;};
 const pr=enterRegion('last302',null,{layer:'STORY',restore:true});let storySeen=0;
 let vq=null;while(T()-t0<60000){const v=!!document.getElementById('r617v');try{const ve=document.querySelector('#r617v video');if(ve){const q=ve.getVideoPlaybackQuality();vq={total:q.totalVideoFrames,dropped:q.droppedVideoFrames,t:+ve.currentTime.toFixed(2)};}}catch(_){}
  if(v&&ev.videoOpen==null){ev.videoOpen=T()-t0;phase='video';}
  if(!loading&&ev.loaded==null&&room?.id==='last302')ev.loaded=T()-t0;
  if(storyScene){if(ev.story==null)ev.story=T()-t0;if(++storySeen>20){advanceScene();storySeen=0;}}
  if(ev.videoOpen!=null&&!v&&ev.videoClosed==null){ev.videoClosed=T()-t0;phase='after';}
  if(ev.videoClosed!=null&&T()-t0>ev.videoClosed+3000&&!storyScene)break;
  await new Promise(r=>setTimeout(r,50));}
 const after=rows.filter(r=>r.phase==='after'),video=rows.filter(r=>r.phase==='video'&&r.ms>1);
 return {vq,ev:Object.fromEntries(Object.entries(ev).map(([k,v])=>[k,Math.round(v)])),warmDraws:video.map(r=>({t:Math.round(r.t),ms:+r.ms.toFixed(0)})),
  afterFirst5:after.slice(0,5).map(r=>+r.ms.toFixed(0)),
  seenFirst5:rows.filter(r=>r.here&&!r.cov&&r.ms>1).slice(0,5).map(r=>({t:Math.round(r.t),ms:+r.ms.toFixed(0)})),coveredHeavy:rows.filter(r=>r.here&&r.cov&&r.ms>1).map(r=>({t:Math.round(r.t),ms:+r.ms.toFixed(0)})),r617:window.__STORYWORLD_HWANDO_FALL_VIDEO_R617__?.inspect?.().stats,r1036:window.__STORYWORLD_ENTRY_VIDEO_R1036__?.inspect?.(),r619:window.__STORYWORLD_VIDEO_RENDER_PAUSE_R619__?.inspect?.().stats};});
console.log(JSON.stringify(res));if(outFile)fs.writeFileSync(outFile,JSON.stringify(res,null,1));await b.close();
