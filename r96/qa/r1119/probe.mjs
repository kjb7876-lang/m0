// R1119 헤드리스: 결전 중 페르소나 피격·시전·각성 걷기·탄 6종·사망 빛 소멸 명령을 렌더러에서 잡아 확인하고 장면을 찍는다. 소프트웨어 렌더 — 그래픽 검증 아님.
import {chromium,boot,skip} from '../r444/lib.mjs';import fs from 'fs';
const OUT='r96/qa/r1119/';const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await p.evaluate(()=>enterRegion('cult04',null,{layer:'DREAM',restore:true}));
await p.waitForFunction(()=>!loading&&room?.id==='cult04',null,{timeout:150000});await skip(p);
await p.evaluate(()=>{room.enemies=[];preparePersona3();});await p.waitForTimeout(500);await skip(p);
await p.evaluate(()=>{const e=room.enemies.find(e=>e.persona);summon3([e],'persona');});
await p.waitForFunction(()=>room.encounterStage==='active',null,{timeout:120000});await skip(p);
await p.evaluate(()=>{const e=room.enemies.find(e=>e.persona);window.__e=e;e.speed=0;window.__hold=true;
 const T=window.tick;window.tick=function(...a){const r=T.apply(this,a);try{player.hp=maxHP();if(window.__hold){e.cd=9;e.rest=1;}if(window.__walk){const w=window.__walk,dt=Math.max(0,time-w.last);e.x+=w.d[0]*2.4*dt;e.y+=w.d[1]*2.4*dt;w.last=time;}}catch(_){}return r;};
 const R=__STORYWORLD_PHASE1__.controller.state.three,O=R.render;R.render=function(f){const r=O.apply(this,arguments);try{window.__cmds=f.commands.filter(c=>/r1119|r1104b|rc133|r1097|rc134/.test(String(c.sourcePath))).map(c=>({path:String(c.sourcePath),gco:c.style?.globalCompositeOperation||'',a:c.style?.globalAlpha,pts:c.points}));}catch(_){}return r;};});
const g=()=>new Promise(r=>setTimeout(r,0));const wait=s=>p.evaluate(s=>new Promise(r=>{const t=time;const f=()=>time-t>=s?r():requestAnimationFrame(f);f();}),s);
const grab=()=>p.evaluate(()=>window.__cmds||[]);const shot=async n=>{const q=await p.evaluate(()=>{const q=project(__e.x,__e.y);return [q.x,q.y];});await p.screenshot({path:OUT+n+'.png',clip:{x:Math.max(0,q[0]-160),y:Math.max(0,q[1]-130),width:320,height:200}});};
await p.waitForFunction(()=>{const s=__STORYWORLD_PERSONA_STRIDE_R1104__.sheets();return Object.values(s).every(v=>v.state==='ready');},null,{timeout:90000});
await wait(1);const res={};
// 피격
const hit=[];await p.evaluate(()=>{__e.hp-=10;});for(let i=0;i<12;i++){const c=await grab();hit.push(c.map(x=>x.path).filter(x=>/r1119:hit|rc133|r1097/.test(x))[0]);if(i===3)await shot('hit');await p.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));}
res.hit=hit;
// 시전
await p.evaluate(()=>{__e.rangedWindup=1.5;});await wait(.2);res.cast=(await grab()).filter(x=>/glow/.test(x.path)).map(x=>[x.path,x.gco]);await shot('cast');await p.evaluate(()=>{__e.rangedWindup=0;});
// 탄 6종
await p.evaluate(()=>{__e.rangedWindup=0;});const fx={};
for(const [i,k] of [[2,'diamond'],[3,'clock'],[4,'star'],[6,'lance'],[7,'shield'],[8,'vortex']]){await p.evaluate(i=>{__e.beat=i;ranged3(__e);},i);await wait(.35);
 const c=await grab();fx[k]=[...new Set(c.map(x=>x.path).filter(x=>/r1119:fx|rc134/.test(x)).map(x=>x.replace(/:\d+$/,'')))];await shot('fx-'+k);await wait(1.2);}
res.fx=fx;res.fxInspect=await p.evaluate(()=>__STORYWORLD_PERSONA_SKILL_FX_R1119__.inspect());
// 각성 걷기
await p.evaluate(()=>{__e.awakeUntil=time+40;window.__walk={d:[-Math.SQRT1_2,Math.SQRT1_2],last:time};});await wait(.8);
res.awakeWalk=(await grab()).map(x=>[x.path.replace(/:\d+:(raw|ink)$/,':N:$1'),x.gco]);await shot('awake-walk');
await p.evaluate(()=>{window.__walk=null;});await wait(.3);
// 사망
await p.evaluate(()=>{window.__hold=false;__e.hp=0;});const death=[];for(let i=0;i<40;i++){const c=await grab();death.push(c.map(x=>x.path).filter(x=>/r1119:death/.test(x))[0]||'-');if(i===8)await p.screenshot({path:OUT+'death.png'});await p.waitForTimeout(80);}
res.death=[...new Set(death)];res.stride=await p.evaluate(()=>__STORYWORLD_PERSONA_STRIDE_R1104__.inspect().stats);res.personaCompleted=await p.evaluate(()=>room?.persona?.completed);
fs.writeFileSync(OUT+'probe.json',JSON.stringify(res,null,1));console.log(JSON.stringify(res).slice(0,3000));await b.close();
