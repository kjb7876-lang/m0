// R1394 사몽 구역 몹 목록(헤드리스 탐색용): node probe.mjs <zone>
import {chromium,boot,skip} from '../r444/lib.mjs';
const [z]=process.argv.slice(2);const b=await chromium.launch();
const {p}=await boot(b,{init:{'storyworld.r619.videopause':'{"on":false}','storyworld.r1036.entryvideo':'{"on":false}','storyworld.r309.opening':'{"on":false}','storyworld.r372.rootgate':'{"on":false}'}});
await p.evaluate(async z=>{await window.__STORYWORLD_SAMONG_R103__.goZone(z);},z);
await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip(p);
for(let i=0;i<3;i++){await p.waitForTimeout(3000);await skip(p);
console.log(JSON.stringify(await p.evaluate(()=>({room:room.id,time:+time.toFixed(1),en:room.enemies.map(e=>[e.id,e.nativeId,e.name,Math.round(e.hp)]),r1377:__STORYWORLD_MOB_DIR_ART_R1377__.inspect(),r1394:window.__STORYWORLD_SAMONG_ART_R1394__}))));}
await b.close();
