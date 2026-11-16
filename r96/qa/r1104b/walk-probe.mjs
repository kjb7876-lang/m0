// R1104b 헤드리스: 결전 중 페르소나를 정해진 화면 방향으로 걷게 하고(AI 걸음 멈춤, tick 뒤 위치 지정, 게임 시간 기준),
//  몸 그림 명령이 시트 칸으로 바뀌는지·칸 순서·발 기준점 화면 좌표·발 미끄러짐을 잰다. 소프트웨어 렌더 — 그래픽 검증 아님.
import {chromium,boot,skip} from '../r444/lib.mjs';import fs from 'fs';
const OUT='r96/qa/r1104b/';const INK=process.env.INK==='1';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:INK?{}:{'storyworld.r1055.inkWash':JSON.stringify({mode:'off'})}});
await p.evaluate(()=>enterRegion('cult04',null,{layer:'DREAM',restore:true}));
await p.waitForFunction(()=>!loading&&room?.id==='cult04',null,{timeout:150000});await skip(p);
await p.evaluate(()=>{room.enemies=[];preparePersona3();});await p.waitForTimeout(500);await skip(p);
await p.evaluate(()=>{const e=room.enemies.find(e=>e.persona);summon3([e],'persona');});
await p.waitForFunction(()=>room.encounterStage==='active',null,{timeout:120000});await skip(p);
// 걷기 몰기: tick 뒤에 위치를 정한다
await p.evaluate(()=>{const e=room.enemies.find(e=>e.persona);window.__walk={e,dir:null,v:2.4,x0:e.x,y0:e.y,last:time};e.speed=0;e.r1104bHold=true;
 const T=window.tick;window.tick=function(...a){const r=T.apply(this,a);try{const w=window.__walk;player.hp=maxHP();if(w.dir){const dt=Math.max(0,time-w.last);w.e.x+=w.dir[0]*w.v*dt;w.e.y+=w.dir[1]*w.v*dt;w.e.cooldown=9;w.e.attackCd=9;}w.last=time;}catch(_){}return r;};
 const R=__STORYWORLD_PHASE1__.controller.state.three,O=R.render;R.render=function(f){const r=O.apply(this,arguments);try{const c=f.commands.find(c=>c.r1104b||/rc133\/art|r1097:ink/.test(String(c.sourcePath))&&c.owner?.persona!==false);
   window.__cap=c?{path:String(c.sourcePath),pts:c.points.map(p=>[...p]),sr:[...c.sourceRect],pad:c.r1104bPad||0,n:f.commands.filter(c=>c.r1104b||c.r1104||/rc133\/art|r1097:ink/.test(String(c.sourcePath))).length}:null;}catch(_){}return r;};});
const api='__STORYWORLD_PERSONA_STRIDE_R1104__';
await p.waitForFunction(api=>{const s=window[api].sheets();return Object.values(s).every(v=>v.state==='ready');},api,{timeout:60000});
const dirs={left:[-Math.SQRT1_2,Math.SQRT1_2],right:[Math.SQRT1_2,-Math.SQRT1_2],down:[Math.SQRT1_2,Math.SQRT1_2],up:[-Math.SQRT1_2,-Math.SQRT1_2]};
const res={ink:INK,dirs:{}};
for(const [name,d] of Object.entries(dirs)){
 await p.evaluate(d=>{const w=window.__walk;w.e.x=w.x0;w.e.y=w.y0;w.dir=null;},d);await p.evaluate(()=>new Promise(r=>{const t=time;const f=()=>time-t>.6?r():requestAnimationFrame(f);f();}));
 await p.evaluate(d=>{window.__walk.dir=d;window.__walk.last=time;},d);
 const log=[];const t0=await p.evaluate(()=>time);
 while(true){const s=await p.evaluate(api=>{const e=window.__walk.e,q=project(e.x,e.y),c=window.__cap,i=window[api].inspect();
   let foot=null,scale=null;if(c&&/r1104b/.test(c.path)){const m=/r1104b:walk:(\w+):(\d):(\w+)/.exec(c.path),W=window[api].walkSheets[m[1]],P=c.pts,sw=c.sr[2],sh=c.sr[3],u=(W.ax+c.pad)/sw,v=(W.ground+c.pad)/sh;
    const L=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k];foot=L(L(P[0],P[1],u),L(P[3],P[2],u),v);scale=Math.hypot(P[1][0]-P[0][0],P[1][1]-P[0][1])/sw;}
   return {t:time,q:[q.x,q.y],path:c&&c.path,n:c&&c.n,foot,scale,walk:i.walk,phase:i.phase,err:i.stats.errors};},api);
  log.push(s);if(s.t-t0>2.2)break;await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>r())));}
 const sheetLog=log.filter(l=>/r1104b/.test(l.path||''));const frames=sheetLog.map(l=>+/:(\d):/.exec(l.path)[1]);
 let fw=0,bw=0;for(let i=1;i<frames.length;i++){const dd=(frames[i]-frames[i-1]+8)%8;if(dd>0&&dd<4)fw++;else if(dd>4)bw++;}
 // 발 기준점이 몸 위치(project)와 같은 자리에 붙어 따라가는가
 const off=sheetLog.map(l=>[l.foot[0]-l.q[0],l.foot[1]-l.q[1]]);
 const tilePx=await p.evaluate(d=>{const a=project(10,10),b=project(10+d[0],10+d[1]);return Math.hypot(b.x-a.x,b.y-a.y);},d);
 res.dirs[name]={samples:log.length,sheet:sheetLog.length,paths:[...new Set(sheetLog.map(l=>l.path.replace(/:\d:/,':N:')))],distinctFrames:new Set(frames).size,fw,bw,
  footOffMinMax:off.length?[Math.min(...off.map(o=>o[0])),Math.max(...off.map(o=>o[0])),Math.min(...off.map(o=>o[1])),Math.max(...off.map(o=>o[1]))].map(v=>+v.toFixed(2)):null,
  scalePxPerCell:sheetLog[0]?.scale,tilePx,errors:log.at(-1).err,cmdCount:[...new Set(log.map(l=>l.n))]};
 // 한 장 찍기(가운데 장면)
 const q=log.at(-1).q;await p.screenshot({path:OUT+'walk-'+name+(INK?'-ink':'')+'.png',clip:{x:Math.max(0,q[0]-80),y:Math.max(0,q[1]-120),width:160,height:150}});
}
fs.writeFileSync(OUT+'walk-probe'+(INK?'-ink':'')+'.json',JSON.stringify(res,null,1));console.log(JSON.stringify(res));await b.close();
