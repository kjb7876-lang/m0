// R1036 첫 입장 렉 측정: 영상 루트(#r617v)가 화면을 덮은 채 지역에 처음 들어가고(영상 중 로딩), 영상이 닫힌 뒤 처음 그리는 프레임들의 draw() 시간을 잰다.
// node entry-lag-probe.mjs <from> <to> <영상 유지 ms> [out.json]
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const [from='last301',to='last302',holdMs='9000',outFile='']=process.argv.slice(2);const VP=(process.env.VP||'1280x720').split('x').map(Number);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:VP[0],height:VP[1]}});await go(p,from);await p.waitForTimeout(2000);
const res=await p.evaluate(async([to,hold])=>{const T=()=>performance.now();const rows=[];let phase='before';
 // 가장 바깥에서 draw 를 재기(R619 보다 바깥)
 const base=draw;draw=function(...a){const t0=T();const r=base.apply(this,a);rows.push({phase,ms:T()-t0,room:room?.id,loading:!!loading});return r;};
 const v=document.createElement('div');v.id='r617v';v.style.cssText='position:fixed;inset:0;z-index:2147482000;background:#000';
 const tStart=T();document.body.appendChild(v);phase='video';const ok=enterRegion(to,null,{layer:'STORY',restore:true,noStory:true});
 await ok;const tLoaded=T();while(T()-tStart<hold)await new Promise(r=>setTimeout(r,50));
 const tClose=T();v.remove();phase='after';await new Promise(r=>setTimeout(r,3000));
 const after=rows.filter(r=>r.phase==='after'),video=rows.filter(r=>r.phase==='video');
 const ms=a=>a.map(r=>+r.ms.toFixed(1));
 return {loadMs:+(tLoaded-tStart).toFixed(0),videoDraws:video.length,videoDrawMs:ms(video).slice(0,40),videoDrawMax:Math.max(0,...video.map(r=>r.ms)),
  afterFirst10:ms(after).slice(0,10),afterMax:+Math.max(0,...after.map(r=>r.ms)).toFixed(1),afterFirstMs:+(after[0]?.ms||0).toFixed(1),afterCount:after.length,
  r619:window.__STORYWORLD_VIDEO_RENDER_PAUSE_R619__?.inspect?.()};},[to,+holdMs]);
console.log(JSON.stringify(res));if(outFile)fs.writeFileSync(outFile,JSON.stringify(res,null,1));await b.close();
