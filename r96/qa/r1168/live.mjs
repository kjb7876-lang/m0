// R1168 헤드리스 확인: cult05 에서 '설원 아래의 기계 다리'를 약하게 때려 R1156 피격 4칸(r1168 시트)이 엔진 그림 사슬에서 나오는지 본다.
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1168/live.mjs <out>
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2];fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
await go(p,'cult05');await skip(p);
await p.evaluate(()=>{const S=window.__STORYWORLD_STORY_COMBAT_R54__;for(const e of room.enemies)if(/^설원 아래의 기계 다리/.test(e.name||'')){e.hitTimer=.2;S.frameFor(e,null);e.hitTimer=0;S.frameFor(e,null);}});await p.waitForTimeout(2500);/* 시트 읽기 요청 뒤 기다림 */
const res=await p.evaluate(()=>{player.hp=player.maxHp=1e9;const ms=room.enemies.filter(e=>/^설원 아래의 기계 다리/.test(e.name||'')&&e.hp>0);const S=window.__STORYWORLD_STORY_COMBAT_R54__;
 const out={count:ms.length,before:[],after:[]};for(const e of ms.slice(0,3)){e.attack=null;const f0=S.frameFor(e,null);out.before.push(f0&&f0.path);e.hitTimer=0;S.frameFor(e,null);e.hitTimer=.2;const f1=S.frameFor(e,null);out.after.push(f1&&[f1.path,f1.assetFrame&&f1.assetFrame.sourceRect,f1.r1156Hit]);}
 out.stats=window.__STORYWORLD_MOB_HIT_R1156__.inspect();return out;});
console.log(JSON.stringify(res));fs.writeFileSync(OUT+'/live.json',JSON.stringify(res,null,1));
await p.evaluate(()=>{const e=room.enemies.find(e=>/^설원 아래의 기계 다리/.test(e.name||'')&&e.hp>0);if(e){e.x=player.x+1.2;e.y=player.y;e.hitTimer=.3;}});
await p.waitForTimeout(400);await p.screenshot({path:OUT+'/hit.png'});await b.close();
