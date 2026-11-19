// R1243 서 있는 보스 몸 사각형 높이: 덧씌우기 끄기 조합별 비교. node hidle.mjs 지역:id '{"localStorageKey":"json"}'
import {chromium,boot,go} from '../r444/lib.mjs';
const [z,id]=process.argv[2].split(':');const init=JSON.parse(process.argv[3]||'{}');init['storyworld.r790.npc']='{"on":false}';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:1280,height:720},init});await go(p,z);
await p.evaluate(id=>{const e=room.enemies.find(x=>x.nativeId===id);room.engaged=true;e.spawnState='active';e.hidden=false;player.invincible=1e9;player.hp=9e8;player.maxHp=9e8;
 for(const o of room.enemies)if(o!==e&&o.hp>0){o.x=-999;o.y=-999;o.speed=0;}e.x=player.x+3;e.y=player.y-2;e.speed=0;window.__W={e};
 const de=drawEnemy;drawEnemy=function(x,...a){const c=ctx,s0=c.commands.length;const r=de.call(this,x,...a);if(x===window.__W.e){x.attack=null;x.cd=99;let best=null,bh=0;for(const k of c.commands.slice(s0)){if(k?.kind!=='image'||!k.points)continue;const h=Math.abs(k.points[3][1]-k.points[0][1]);if(h>bh){bh=h;best=k;}}
  if(best)window.__W.last={h:Math.round(bh),src:String(best.sourcePath||'').split('/').pop().slice(0,60),sr:(best.sourceRect||[]).map(Math.round).join(','),def:x.defScale,fit:window.__STORYWORLD_BOSS_R205__?.stats?.lastFitK};}return r;};},id);
const out=[];for(let i=0;i<20;i++){const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+.1,t0,{timeout:15000}).catch(()=>{});out.push(await p.evaluate(()=>window.__W.last));}
const g={};for(const r of out){if(!r)continue;const k=r.src.replace(/:\d+,\d+,\d+,\d+/,'')+' '+r.sr;(g[k]??=[]).push(r.h);}console.log(JSON.stringify(init),g,out[0]?.def,JSON.stringify(await p.evaluate(()=>(window.__R620H||[]).slice(-6))));await b.close();
