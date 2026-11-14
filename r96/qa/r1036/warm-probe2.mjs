// 영상 뒤에서 phase1 controller 상태와 bridge.capture() 준비 여부를 본다
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:1280,height:720},init:{'storyworld.r617.hwandofall':JSON.stringify({on:true,seen:['knight','fall']})}});
await go(p,'last301');await p.waitForTimeout(2000);
const r=await p.evaluate(async()=>{const T=()=>performance.now(),P=window.__STORYWORLD_PHASE1__,c=P?.controller,out=[];
 const t0=T();enterRegion('last302',null,{layer:'STORY',restore:true});
 while(T()-t0<6000){await new Promise(r=>setTimeout(r,700));let snap=null;try{snap=c.bridge.capture();}catch(e){snap={err:String(e)};}
  const s0=T();window.__STORYWORLD_VIDEO_RENDER_PAUSE_R619__.setPrefs({on:false});let rc=0;const t3=c.state.three,br=t3?.render;if(t3){t3.render=function(...a){rc++;return br.apply(this,a);};}try{draw();}catch(e){}const dAll=T()-s0;if(t3)t3.render=br;window.__STORYWORLD_VIDEO_RENDER_PAUSE_R619__.setPrefs({on:true});const s=T();try{c.draw();}catch(e){}const d=T()-s;out.push({t:Math.round(T()-t0),ready:snap?.ready,err:snap?.err,active:c.state.active,ms:+d.toFixed(1),drawAll:+dAll.toFixed(1),rc,loading});}
 window.__STORYWORLD_HWANDO_FALL_VIDEO_R617__.skip();return out;});
console.log(JSON.stringify(r,null,0));await b.close();
