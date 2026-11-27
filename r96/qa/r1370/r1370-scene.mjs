// R1370 헤드리스 장면(그래픽·GPU 검증 아님): ep1a08 '안정화 집행체' 암흑 구체를 4방향으로 쏘게 하고 비행 중 장면을 찍는다.
//  실행: SW_URL=http://127.0.0.1:4396/m0/ SHOT=/tmp/dir TAG=after node r96/qa/r1370/r1370-scene.mjs
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const SHOT=process.env.SHOT||'/tmp',TAG=process.env.TAG||'x';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:800,height:450}});console.log('booted');const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
await go(p,'ep1a08');for(let i=0;i<10;i++){await skip(p);await p.waitForTimeout(800);}console.log('in ep1a08');
const DIRS=[['right',3.2,-3.2],['left',-3.2,3.2],['up',-3.6,-3.6],['down',3.6,3.6]];
const out=[];
for(const [nm,dx,dy] of DIRS){
 const r=await p.evaluate(async([dx,dy])=>{auto=false;guide=false;command=null;route=[];const A=window.__STORYWORLD_DYS_RANGED_R1210__;
  let m=room.enemies.find(e=>/안정화 집행체/.test(e.name)&&!e.boss&&!e.midboss);if(!m)return {none:room.enemies.map(e=>e.name)};
  for(const e of room.enemies)if(e!==m){e.hp=0;e.spawnState='dead';}
  m.hp=m.maxHp||100;m.spawnState='active';m.x=player.x-dx;m.y=player.y-dy;m.homeX=m.x;m.homeY=m.y;m.speed=0;room.engaged=true;player.maxHp=player.hp=1e9;
  if(m.r1210){m.r1210.next=0;m.r1210.mode=null;}const c0=m.r1210?.count||0;const t0=time;
  await new Promise(res=>{const f=()=>{/* 첫 몹 지역 진입 장면·창이 뒤늦게 뜨면 넘긴다 */for(let i=0;i<40&&storyScene;i++)advanceScene();if(modal)closePanel(true);m.x=player.x-dx;m.y=player.y-dy;if((m.r1210?.count||0)>c0||time>t0+30)res();else setTimeout(f,20);};f();});
  const t1=time;await new Promise(res=>{const f=()=>{if(time>t1+.15)res();else setTimeout(f,10);};f();});
  const a=project(m.x,m.y),q=project(player.x,player.y);const cv=[...document.querySelectorAll('canvas')].sort((x,y)=>y.width*y.height-x.width*x.height)[0],bb=cv.getBoundingClientRect();return {cv:{l:bb.left,t:bb.top,sx:bb.width/cv.width,sy:bb.height/cv.height,W:typeof W!=='undefined'?W:null},fired:(m.r1210?.count||0)>c0,a,q,live:A.inspect().liveDetail};},[dx,dy]);
 if(r.none){console.log('no mob',r.none);break;}
 const cx=(r.a.x+r.q.x)/2,cy=(r.a.y+r.q.y)/2-30,w=240,h=160;
 await p.screenshot({path:`${SHOT}/r1370-${TAG}-${nm}.png`});
console.log('shot',nm,r.fired);
 out.push({nm,a:r.a,q:r.q,cv:r.cv,fired:r.fired,live:r.live});}
(await import('node:fs')).writeFileSync(`${SHOT}/r1370-${TAG}.json`,JSON.stringify(out));console.log(JSON.stringify(out),'errors',errs.length,errs.slice(0,3));await b.close();
