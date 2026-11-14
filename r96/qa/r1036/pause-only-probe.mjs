// 지역을 바꾸지 않고 영상 루트만 N ms 덮었다 걷었을 때 첫 draw 시간(맵 새로 만들기와 '오래 쉰 뒤 첫 그리기'를 가르기)
import {chromium,boot,go} from '../r444/lib.mjs';
const [zone='last302',hold='9000']=process.argv.slice(2);const b=await chromium.launch();const {p}=await boot(b,{vp:{width:1280,height:720}});await go(p,zone);await p.waitForTimeout(3000);
const r=await p.evaluate(async hold=>{const T=()=>performance.now();const rows=[];let ph='pre';const base=draw;draw=function(...a){const s=T();const x=base.apply(this,a);rows.push({ph,ms:T()-s});return x;};
 await new Promise(r=>setTimeout(r,1500));const v=document.createElement('div');v.id='r617v';document.body.appendChild(v);ph='video';await new Promise(r=>setTimeout(r,hold));v.remove();ph='after';await new Promise(r=>setTimeout(r,2500));
 const f=x=>rows.filter(r=>r.ph===x).map(r=>+r.ms.toFixed(0));return {pre:f('pre').slice(-6),after:f('after').slice(0,6)};},+hold);
console.log(JSON.stringify(r));await b.close();
