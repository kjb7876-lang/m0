// 영상 뒤 미리 그리기(R619 warm) 동안 draw 안에서 Three render 가 실제로 불리는지·얼마나 걸리는지
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:1280,height:720},init:{'storyworld.r617.hwandofall':JSON.stringify({on:true,seen:['knight','fall']})}});
await go(p,'last301');await p.waitForTimeout(2000);
const r=await p.evaluate(async()=>{const T=()=>performance.now();const log=[];let inDraw=null;
 const st=()=>window.__STORYWORLD_PHASE1__?.controller?.state;
 const wrapR=()=>{const t=st()?.three;if(t&&!t.__w){t.__w=1;const b=t.render;t.render=function(...a){const s=T();const x=b.apply(this,a);if(inDraw)inDraw.r.push(+(T()-s).toFixed(1));return x;};}};
 const bd=draw;draw=function(...a){wrapR();const rec={t:0,ms:0,r:[],cov:!!document.getElementById('r617v'),room:room?.id,loading,started,modal:!!modal,story:!!storyScene};inDraw=rec;const s=T();const x=bd.apply(this,a);rec.ms=+(T()-s).toFixed(1);rec.t=Math.round(s);inDraw=null;if(rec.ms>.5)log.push(rec);return x;};
 const t0=T();enterRegion('last302',null,{layer:'STORY',restore:true});
 while(T()-t0<9000)await new Promise(r=>setTimeout(r,100));window.__STORYWORLD_HWANDO_FALL_VIDEO_R617__.skip();await new Promise(r=>setTimeout(r,2500));
 return log.map(x=>({...x,t:x.t-Math.round(t0)}));});
console.log(JSON.stringify(r));await b.close();
