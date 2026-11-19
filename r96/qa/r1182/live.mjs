// R1182 헤드리스 확인: u206 기계 몹을 약하게 때려 피격 4칸이 실제로 그려진 뒤 380ms 안에 처치 → R462 가 Dots 사망 시트(MM)를 썼는지(stats.dotsDeath) 본다.
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1182/live.mjs <out>
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2];fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
await go(p,'u206');await skip(p);
await p.evaluate(()=>{const S=window.__STORYWORLD_STORY_COMBAT_R54__;for(const e of room.enemies){e.hitTimer=.2;S.frameFor(e,null);e.hitTimer=0;S.frameFor(e,null);}});await p.waitForTimeout(3000);
const res=await p.evaluate(async()=>{player.hp=player.maxHp=1e9;const D=window.__STORYWORLD_MOB_DEATH_R462__;const s0={...D.inspect().stats};
 const ms=room.enemies.filter(e=>e.hp>0&&/기계화/.test(e.name||'')).slice(0,4);const out={n:ms.length,picked:[]};
 for(const e of ms){e.x=player.x+1.0+Math.random()*.3;e.y=player.y+(Math.random()-.5);e.speed=0;}
 for(const e of ms){hitEnemy(e,1,'r1182');}
 const t0=time;for(const e of ms)e.hitTimer=.36;while(time-t0<.1)await new Promise(r=>setTimeout(r,30));
 const S=window.__STORYWORLD_STORY_COMBAT_R54__;for(const e of ms){const f=S.frameFor(e,null);out.picked.push(f&&f.path);}
 for(const e of ms){hitEnemy(e,1e9,'r1182');}
 const t1=time;while(time-t1<.7)await new Promise(r=>setTimeout(r,50));
 const s1=D.inspect().stats;out.dotsDeath=(s1.dotsDeath||0)-(s0.dotsDeath||0);out.ash=(s1.ash||0)-(s0.ash||0);out.lastError=D.inspect().lastError;return out;});
console.log(JSON.stringify(res));fs.writeFileSync(OUT+'/live.json',JSON.stringify(res,null,1));await p.screenshot({path:OUT+'/death.png'});await b.close();
