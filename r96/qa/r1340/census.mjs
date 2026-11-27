// R1340 몹 공격 유형 전수(헤드리스): 지역마다 방을 만들어 근접 몹의 이름·무기·공격 모양을 모은다.
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:480,height:270}});
const zones=await p.evaluate(()=>Object.keys(regionById).filter(k=>k!=='hub'));console.log('zones',zones.length);
const out={};const hurtWrapped=await p.evaluate(()=>{try{const o=hurt;window.__hurtN=0;hurt=function(...a){window.__hurtN++;return o.apply(this,a);};return true;}catch(e){return String(e);}});console.log('hurt wrap',hurtWrapped);
for(const z of (process.env.ZONES?process.env.ZONES.split(','):zones)){try{await go(p,z);}catch(e){console.log('fail',z);continue;}
 out[z]=await p.evaluate(()=>({fam:room?.exploration?.surface?.art?.r81Environment||null,title:regionById[room.id]?.title,mobs:room.enemies.map(e=>({n:String(e.name||'').replace(/\s+(\d+|증원|추격대)$/,''),w:e.weapon,ai:e.ai,b:!!e.boss,m:!!(e.midboss||/중간보스/.test(e.name||'')),sh:e.combatProfile?.attackShape?.shape||null,rg:e.combatProfile?.attackShape?.range,sk:Object.keys(e.combatProfile?.attackShape||{}).join('|').slice(0,80),d3:!!(e.mob3dR1312||e.r1312||e.three3d||e.mesh3d),src:String(e.sprite||e.asset||e.image||e.art||'').slice(-60)}))}));
}
fs.writeFileSync('census.json.gz',require('zlib').gzipSync(JSON.stringify(out)));console.log('done',Object.keys(out).length, await p.evaluate(()=>window.__hurtN));await b.close();
