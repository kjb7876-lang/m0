// R762 헤드리스: 불면귀 보스가 싸우는 동안 효과음 신호(sound 종류)와 음원 해독 확인. 귀로 듣는 확인은 아님.
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r760/sfx-scene.mjs
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b);const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await go(p,'last303');
await p.evaluate(()=>{const B=room.enemies.find(e=>e.boss&&!e.midboss);for(const e of room.enemies)if(e!==B)e.hp=0;B.spawnState='active';player.x+=3;player.y+=1;B.x=B.homeX=player.x-2.6;B.y=B.homeY=player.y-2.6;B.explorationLeash=null;
 player.hp=player.maxHp=1e9;player.invincible=1e9;window.__B=B;window.__K=[];const s=sound;sound=function(k,...a){if(/^r761/.test(k))window.__K.push([+time.toFixed(2),k]);return s.call(this,k,...a);};});
const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+8,t0,{timeout:600000}).catch(()=>{});
await p.evaluate(()=>{__B.hp=__B.maxHp*.45;});
const res=await p.evaluate(async()=>{const P=soundProfiles,paths=Object.keys(P).filter(k=>/^r761/.test(k)).flatMap(k=>P[k].map(r=>r.path));const dec={};
 for(const q of paths){try{const buf=await audioBuffer(q);dec[q]=buf?+buf.duration.toFixed(3):null;}catch(e){dec[q]='ERR '+String(e).slice(0,80);}}
 return {cues:__K,inspect:__STORYWORLD_BULMYEONGWI_R760__.inspect().stats,decoded:dec,gameTime:+time.toFixed(1)};});
res.pageErrors=errs;console.log(JSON.stringify(res,null,1));await b.close();
