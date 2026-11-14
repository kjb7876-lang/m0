// R1036: 불면귀 지역(last302·last303) 보스 구역 이름 카드(R255 cinema)의 실루엣이 어떤 그림에서 오는지 재고 화면을 찍는다.
// node silhouette-probe.mjs <outDir>
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const out=process.argv[2]||'.';fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:1280,height:720}});const res={};
for(const z of (process.env.ZONES||'last303').split(',')){await go(p,z);await p.waitForTimeout(2500);
 res[z]=await p.evaluate(()=>{const r=regionById[room.id];const live=(room.enemies||[]).filter(e=>e&&(e.boss||e.midboss)).map(e=>({id:e.nativeId,name:e.name,boss:!!e.boss,mid:!!e.midboss,path:e.path,hp:e.hp}));
  let used=null;const base=readyImage;window.__r1036used=[];readyImage=function(p,...a){window.__r1036used.push(String(p));return base.call(this,p,...a);};
  return {bosses:(r.bosses||[]).map(x=>({name:x.name,path:x.path||x.sprite||null})),live};});
 await p.evaluate(()=>{for(const e of room.enemies)if(e.boss||e.midboss){e.spawnState='active';}window.__STORYWORLD_STORY_FRAGMENTS_R255__.preview();});
 // 실루엣이 떠오르는 구간(0.42~0.8) 근처를 실제 시간으로 기다린다
 await p.waitForTimeout(1800);await p.screenshot({path:`${out}/${z}-namecard.png`});
 res[z].used=await p.evaluate(()=>[...new Set(window.__r1036used)].filter(x=>/bulmyeongwi|r760|mb-last30/.test(x)));
 res[z].hasArt=await p.evaluate(()=>!!document.getElementById('r255Cinema'));
 await p.evaluate(()=>{document.getElementById('r255Cinema')?.click();});}
fs.writeFileSync(`${out}/probe.json`,JSON.stringify(res,null,1));console.log(JSON.stringify(res,null,1));await b.close();
