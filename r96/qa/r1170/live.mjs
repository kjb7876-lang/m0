// R1170 헤드리스 확인: u204·u206 에서 기계 몹이 맞은 순간 R1156 피격 4칸(r1170 시트)이 엔진 그림 사슬에서 나오는지 본다.
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1170/live.mjs <out>
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2];fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});const all={};
for(const z of ['u204','u206']){await go(p,z);await skip(p);
 await p.evaluate(()=>{const S=window.__STORYWORLD_STORY_COMBAT_R54__;for(const e of room.enemies){e.hitTimer=.2;S.frameFor(e,null);e.hitTimer=0;S.frameFor(e,null);}});await p.waitForTimeout(2500);
 const res=await p.evaluate(()=>{player.hp=player.maxHp=1e9;const S=window.__STORYWORLD_STORY_COMBAT_R54__;const out={};
  for(const e of room.enemies.filter(e=>e.hp>0)){e.attack=null;e.hitTimer=0;const f0=S.frameFor(e,null);e.hitTimer=.2;const f1=S.frameFor(e,null);e.hitTimer=0;const k=f0&&f0.path;if(!k||out[k])continue;out[k]=[e.name,f1&&f1.path,f1&&f1.assetFrame&&f1.assetFrame.sourceRect];}
  const d=window.__STORYWORLD_MOB_ATTACK_DOTS_R1065__;out.deathMM=d&&d.inspect?Object.keys(d.inspect().sheets).filter(k=>/^MM-/.test(k)):null;out.hitStats=window.__STORYWORLD_MOB_HIT_R1156__.inspect().stats;return out;});
 all[z]=res;console.log(z,JSON.stringify(res));
 await p.evaluate(()=>{const e=room.enemies.find(e=>e.hp>0&&/기계화/.test(e.name||''));if(e){e.x=player.x+1.2;e.y=player.y;e.hitTimer=.3;}});await p.waitForTimeout(300);await p.screenshot({path:OUT+'/hit-'+z+'.png'});}
fs.writeFileSync(OUT+'/live.json',JSON.stringify(all,null,1));await b.close();
