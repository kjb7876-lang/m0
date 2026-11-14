// 실제 입장 흐름에서 영상이 닫힌 뒤 첫 무거운 draw 를 CPU 프로파일로 잡아 함수별 자체 시간 상위를 뽑는다.
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:1280,height:720},init:{'storyworld.r617.hwandofall':JSON.stringify({on:true,seen:['knight','fall']})}});
await go(p,'last301');await p.waitForTimeout(2000);const cdp=await p.context().newCDPSession(p);await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:200});
await p.evaluate(()=>{window.__pr=enterRegion('last302',null,{layer:'STORY',restore:true});});
await p.waitForFunction(()=>!!document.getElementById('r617v'));await p.waitForFunction(()=>!loading&&room?.id==='last302');
const mode=process.env.MODE||'close';
if(mode==='close'){await p.waitForTimeout(2500);await cdp.send('Profiler.start');await p.evaluate(()=>window.__STORYWORLD_HWANDO_FALL_VIDEO_R617__.skip());await p.waitForTimeout(3000);}
const {profile}=await cdp.send('Profiler.stop');const self=new Map();const byId=new Map(profile.nodes.map(n=>[n.id,n]));const dt=profile.timeDeltas;
profile.samples.forEach((id,i)=>{const n=byId.get(id);const k=n.callFrame.functionName+' '+(n.callFrame.url||'').split('/').pop()+':'+n.callFrame.lineNumber;self.set(k,(self.get(k)||0)+(dt[i]||0));});
console.log([...self.entries()].sort((a,b)=>b[1]-a[1]).slice(0,30).map(([k,v])=>(v/1000).toFixed(0)+'ms '+k).join('\n'));await b.close();
