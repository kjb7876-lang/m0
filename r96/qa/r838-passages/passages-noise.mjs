// R838 대조 실험 — 가구 배치 자체가 들어갈 때마다 얼마나 흔들리는지(측정 잡음)와, 켠 지도가 그 범위를 벗어나는지 본다.
//  실행: Z=ep1b07 N=4 SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r838-passages/passages-noise.mjs   (헤드리스 소프트웨어 렌더)
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch(),{p}=await boot(b,{vp:{width:640,height:360}}),N=Number(process.env.N||4);
const enter=async(z,mode)=>{await go(p,'hub');await p.evaluate(([z,mode])=>{window.__STORYWORLD_PASSAGES_R838__.qa(mode==='off'?{}:null);delete world[layerKey(z,'STORY')];let s=12345;Math.random=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};},[z,mode]);await go(p,z);
 let last=-1,since=await p.evaluate(()=>time);for(let i=0;i<400;i++){await p.waitForTimeout(250);const[n,t]=await p.evaluate(()=>[(room.props||[]).length,time]);if(n!==last){last=n;since=t;}else if(t-since>2.5)break;}
 return p.evaluate(()=>({shaped:!!room.exploration.passagesR838,props:(room.props||[]).filter(a=>!a.terrainWall&&Number.isFinite(a.x+a.y)).map(a=>[a.id||a.type||a.name||a.path||'?',+a.x.toFixed(2),+a.y.toFixed(2)].join('@')).filter(k=>!/^r103chest[:@]/.test(k)).sort().join('|')}));};
for(const z of (process.env.Z||'ep1b07').split(',')){const sets={off:new Map(),on:new Map()};
 for(let i=0;i<N;i++)for(const mode of['off','on']){const r=await enter(z,mode);if(r.shaped!==(mode==='on'))console.log('WARN',z,mode,'shaped',r.shaped);sets[mode].set(r.props,(sets[mode].get(r.props)||0)+1);}
 const offK=[...sets.off.keys()],onK=[...sets.on.keys()],onlyOn=onK.filter(k=>!sets.off.has(k)),onlyOff=offK.filter(k=>!sets.on.has(k));
 console.log(z,JSON.stringify({runs:N,offVariants:offK.length,onVariants:onK.length,offCounts:[...sets.off.values()],onCounts:[...sets.on.values()],onOnly:onlyOn.length,offOnly:onlyOff.length}));}
await b.close();
