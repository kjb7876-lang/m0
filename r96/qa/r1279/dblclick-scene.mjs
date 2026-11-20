// R1279 헤드리스 실측: 실제 엔진에서 사람(NPC)·문을 더블클릭하면 걸어가 interact() 가 한 번 불리는지, 바닥 더블클릭은 아무 일 없는지.
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1279/dblclick-scene.mjs [zone]
import {chromium,boot,go} from '../r444/lib.mjs';
const ZONE=process.argv[2]||'last303';const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await go(p,ZONE);
const wait=async s=>{const t0=await p.evaluate(()=>time);await p.waitForFunction(([t,s])=>time>t+s,[t0,s],{timeout:180000}).catch(()=>{});};
const top=await p.evaluate(()=>document.getElementById('game').getBoundingClientRect().top);
await p.evaluate(()=>{player.hp=player.maxHp=1e9;player.invincible=1e9;for(const e of room.enemies)e.hp=0;window.__n=0;const base=interact;interact=function(...a){window.__n++;window.__nAt=[player.x,player.y];return base.apply(this,a);};});
const res={zone:ZONE};
const info=await p.evaluate(()=>{const P=(room.props||[]).find(p=>p.visible!==false&&(p.r75NPC||p.r75NarrativeNPC||p.r75FortPerson||p.r790NPC))||(room.props||[]).find(p=>p.r74Door&&p.visible!==false);if(!P)return null;window.__P=P;
 for(const [dx,dy] of [[0,4],[4,0],[-4,0],[0,-4],[3,3],[-3,3],[3,-3],[-3,-3],[0,3],[3,0]]){if(!blocked(P.x+dx,P.y+dy,.3)){player.x=cam.x=P.x+dx;player.y=cam.y=P.y+dy;const o=project(P.x,P.y);if(o.x>60&&o.x<W-60&&o.y>70&&o.y<H-30)break;}}route=[];command=null;target=null;return {id:P.id,x:P.x,y:P.y,player:[player.x,player.y],kind:P.r74Door?'door':'npc'};});
res.info=info;if(!info){console.log('no target in zone');await b.close();process.exit(2);}
await p.waitForTimeout(3000);for(let i=0;i<40;i++){await wait(.4);const on=await p.evaluate(()=>{const q=project(__P.x,__P.y);return q.x>40&&q.x<W-40&&q.y>60&&q.y<H-20;});if(on)break;}
const q=await p.evaluate(()=>{const q=project(__P.x,__P.y),r=document.getElementById('game').getBoundingClientRect();return {x:q.x*r.width/W,y:(q.y-25)*r.height/H};});
await p.mouse.move(q.x,q.y+top);await wait(.2);
res.hover=await p.evaluate(()=>window.__STORYWORLD_CURSOR_R780__.inspect().hover?.kind);
res.q=q;res.proj=await p.evaluate(()=>{const o=project(__P.x,__P.y);return {x:o.x,y:o.y,W,H,player:[player.x,player.y],cam:typeof cam!=='undefined'?[cam.x,cam.y]:null,cls:window.__STORYWORLD_CURSOR_R780__.classify(o.x,o.y-25,0).kind};});res.distBefore=await p.evaluate(()=>Math.hypot(player.x-__P.x,player.y-__P.y));
await p.mouse.click(q.x,q.y+top,{clickCount:2});
res.armed=await p.evaluate(()=>window.__STORYWORLD_DBLCLICK_USE_R1279__.state().pending);
let i=0;for(;i<60;i++){await wait(.5);const n=await p.evaluate(()=>window.__n);if(n>0)break;}
res.interactCalls=await p.evaluate(()=>window.__n);res.distAtInteract=await p.evaluate(()=>window.__nAt?Math.hypot(window.__nAt[0]-__P.x,window.__nAt[1]-__P.y):null);
res.modalOpen=await p.evaluate(()=>!!modal||!!storyScene);res.state=await p.evaluate(()=>window.__STORYWORLD_DBLCLICK_USE_R1279__.state());
await p.screenshot({path:process.env.OUT||'/tmp/dbl.png'});
res.pageErrors=errs;console.log(JSON.stringify(res,null,1));await b.close();
