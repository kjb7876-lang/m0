// R1383 탐색: 뿌리의 문지기(dist00) 보스전에서 실제로 그려지는 이펙트 그림 경로를 모은다(헤드리스).
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.env.OUT||'/tmp/r1383';fs.mkdirSync(OUT,{recursive:true});const SECS=+(process.env.SECS||20);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await p.addInitScript(()=>{});
await go(p,'dist00');
await p.evaluate(()=>{const P=Object.getPrototypeOf(ctx),base=P.drawImage;window.__ctxinfo=[ctx.constructor&&ctx.constructor.name,typeof P.scope];window.__scopes=new Map();if(typeof P.scope==='function'){const sb=P.scope;P.scope=function(m,fn,...r){try{const k=String(m&&m.id||'').replace(/[:][\d.\-]+.*$/,'');if(k)window.__scopes.set(k,(window.__scopes.get(k)||0)+1);}catch(_){}return sb.call(this,m,fn,...r);};}window.__srcs=new Map();
 P.drawImage=function(im,...a){try{const s=im&&(im.currentSrc||im.src||im.__src||(im.width+'x'+im.height+':'+(im.constructor&&im.constructor.name)));if(s&&!/^data:/.test(s)){const k=String(s).replace(/^.*\/m0\//,'');window.__srcs.set(k,(window.__srcs.get(k)||0)+1);}}catch(_){}return base.call(this,im,...a);};});
const info=await p.evaluate(()=>{const e=room.enemies.find(x=>x.nativeId==='dist00-boss');if(!e)return room.enemies.map(x=>x.nativeId);
 room.engaged=true;e.spawnState='active';e.hidden=false;e.x=player.x+3;e.y=player.y-1;for(const m of room.enemies)if(m!==e)m.hp=0;window.__boss=e;window.__srcs.clear();window.__scopes.clear();return [e.name,e.hp,e.damage];});
console.log('boss',JSON.stringify(info));
const t0=await p.evaluate(()=>time);let shot=0;
for(let k=1;k<=SECS;k++){await p.waitForFunction(a=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);player.hp=Math.max(player.hp,maxHP()*.9);const e=window.__boss;if(e){e.hp=Math.max(e.hp,e.maxHp*.8);}return time>=a[0]+a[1];},[t0,k],{timeout:300000});
 if(k%2===0)await p.screenshot({path:`${OUT}/fight-${String(k).padStart(2,'0')}.png`});}
const res=await p.evaluate(()=>({ctxinfo:window.__ctxinfo,r411:window.__STORYWORLD_SKILL_SHEETS_R411__?.inspect?.(),r1040:window.__STORYWORLD_BOSS_PATTERN_FX_R1040__?.inspect?.(),r1028:window.__STORYWORLD_TENTACLE_STRIKE_R1028__?.inspect?.(),r1346:window.__STORYWORLD_BOSS_IDENTITY_R1346__?.inspect?.(),scopes:[...window.__scopes].sort((a,b)=>b[1]-a[1]).slice(0,60),srcs:[...window.__srcs].filter(([k])=>!/^assets\/(r104|tiles)/.test(k)).sort((a,b)=>b[1]-a[1]).slice(0,80),r87:window.__STORYWORLD_PAINTED_VFX_R87__?.inspect?.().metrics,r411:window.__STORYWORLD_R411_SKILL_SHEETS__?.inspect?.()}));
console.log(JSON.stringify(res,null,1));await b.close();
