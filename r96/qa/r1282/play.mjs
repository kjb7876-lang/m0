// R1282 헤드리스 확인: 나태의 집(ep1b02)·사몽 S-01 에 상자가 놓이고, 가서 E(interact) → 구슬 → 주우면 포인트. 스크린샷 shots/.
import fs from 'node:fs';import {chromium,boot,go,skip} from '../r444/lib.mjs';
fs.mkdirSync('shots',{recursive:true});
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});const res={};
await go(p,'ep1b02');await p.waitForFunction(()=>time>0,null,{timeout:60000});
res.story=await p.evaluate(()=>window.__STORYWORLD_CORNER_CHESTS_R1282__.inspect());
const c=res.story.chests[0];
await p.evaluate(c=>{for(const e of room.enemies||[]){e.x=-999;e.y=-999;e.speed=0;}player.invincible=1e9;player.x=c.x+1.2;player.y=c.y+1.2;route=[];target=null;},c);
const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+.6,t0,{timeout:120000});
await p.screenshot({path:'shots/1-closed.png'});
res.cursor=await p.evaluate(c=>{const q=project(c.x,c.y);const r=window.__STORYWORLD_CURSOR_R780__?.classify?.(q.x,q.y-15,0);return r?{kind:r.kind,id:r.target?.id}:null;},c);
res.before=await p.evaluate(()=>player.points);
res.at=await p.evaluate(c=>{player.x=c.x+1.2;player.y=c.y+1.2;route=[];target=null;const d=Math.hypot(player.x-c.x,player.y-c.y);interact();return {d,modal:!!modal,open:room.props.find(q=>q.cornerChestR1282?.id===c.id)?.cornerChestR1282.open};},c);
const t1=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+.8,t1,{timeout:120000});
await p.screenshot({path:'shots/2-open-orbs.png'});
res.orbs=await p.evaluate(()=>room.props.filter(o=>o.r108Orb&&String(o.r108Orb.box).startsWith('r1282chest:')).map(o=>({x:o.x,y:o.y,landed:!!o.r108Orb.landed})));
for(const o of res.orbs){await p.evaluate(o=>{player.x=o.x;player.y=o.y;route=[];},o);const t=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+.6,t,{timeout:60000});}
res.left=await p.evaluate(()=>room.props.filter(o=>o.r108Orb&&String(o.r108Orb.box).startsWith("r1282chest:")).length);
res.after=await p.evaluate(()=>player.points);res.claimed=await p.evaluate(id=>{const A=window.__STORYWORLD_CORNER_CHESTS_R1282__,S=window.__STORYWORLD_PROGRESSION_R62__.state(player).pointDropClaimsR64;return A.claimIds(id).filter(k=>S[k]).length;},c.id);res.r237=await p.evaluate(()=>window.__STORYWORLD_AUTO_LEVELUP_R237__?.inspect?.()||Object.keys(window).filter(k=>/R237/.test(k)));res.opened=await p.evaluate(()=>window.__STORYWORLD_CORNER_CHESTS_R1282__.inspect());
await p.evaluate(()=>interact());res.afterAgain=await p.evaluate(()=>player.points);
// 사몽
await p.evaluate(()=>window.__STORYWORLD_CHEAT777__.goSection('S-01'));await p.waitForFunction(()=>!loading&&room?.samongR103,null,{timeout:120000});await skip(p);
const t2=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+.3,t2,{timeout:120000});
res.samong=await p.evaluate(()=>({zone:room.samongR103?.zone,...window.__STORYWORLD_CORNER_CHESTS_R1282__.inspect()}));
const s=res.samong.chests[0];if(s){await p.evaluate(c=>{player.x=c.x+1.2;player.y=c.y+1.2;route=[];target=null;for(const e of room.enemies||[]){e.x=-999;e.y=-999;}},s);const t=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+.6,t,{timeout:120000});await p.screenshot({path:'shots/3-samong.png'});}
console.log(JSON.stringify(res,null,1));
const checks=[['스토리 ep1b02 상자 7개',res.story.chests.length===7],['커서가 닫힌 상자를 사용(use)으로',res.cursor?.kind==='use'&&/r1282chest/.test(res.cursor?.id||'')],['열면 구슬 3~5',res.orbs.length>=3&&res.orbs.length<=5],
 ['다 주우면 구슬 claim 이 구슬 수만큼(포인트는 R237 자동 레벨업이 바로 쓸 수 있어 claim 으로 잼)',res.claimed===res.orbs.length&&res.left===0],['다시 눌러도 더 안 줌',res.afterAgain===res.after],['사몽 S-01 상자 1개 이상',res.samong.chests.length>=1],['오류 없음',!res.story.lastError&&!res.samong.lastError]];
let f=0;for(const[n,v]of checks){console.log((v?'PASS ':'FAIL ')+n);if(!v)f++;}await b.close();process.exit(f?1:0);
