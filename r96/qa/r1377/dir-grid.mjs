// R1377 방향 격자: 보스 하나를 세워 두고 영웅을 위·아래·왼·오른쪽에 두며 대기·걷기·공격(준비·치기) 모습을 찍는다(헤드리스, 그래픽 검증 아님).
// 사용: SPOOF=1 node dir-grid.mjs <out.png> <zone> <nativeId>
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const [out,z,id]=process.argv.slice(2);const b=await chromium.launch();
{const nc=b.newContext.bind(b);b.newContext=async o=>{const c=await nc(o);c.setDefaultNavigationTimeout(240000);if(process.env.SPOOF)await c.addInitScript(()=>{Object.defineProperty(Navigator.prototype,'webdriver',{get:()=>false});});return c;};}
const {p}=await boot(b,{vp:{width:960,height:540},init:{'storyworld.r619.videopause':'{"on":false}','storyworld.r1036.entryvideo':'{"on":false}','storyworld.r309.opening':'{"on":false}','storyworld.r372.rootgate':'{"on":false}'}});
await go(p,z);await skip(p);
await p.evaluate(id=>{const e=room.enemies.find(q=>q.nativeId===id);for(const q of room.enemies)if(q!==e)q.hp=0;player.hp=player.maxHp=1e9;player.invincible=1e9;e.hp=e.maxHp=1e8;e.engaged=true;e.spawnState='active';
 const hx=player.x,hy=player.y;window.__G={e,hx,hy,mode:'idle',dir:'left',t0:time};
 // 화면 기준 방향 → 월드 오프셋(투영이 기울어 있으므로 야코비안으로 푼다), 화면 길이 = 월드 2.4 만큼
 const OFFOF=d=>{const P0=project(hx,hy),PX=project(hx+1,hy),PY=project(hx,hy+1),ax=PX.x-P0.x,ay=PX.y-P0.y,bx=PY.x-P0.x,by=PY.y-P0.y,det=ax*by-ay*bx,L=2.4*Math.hypot(ax,ay);
  const [sx,sy]={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[d];const wx=(by*sx-bx*sy)/det,wy=(-ay*sx+ax*sy)/det,m=Math.hypot(wx,wy)||1;return [wx/m*2.4,wy/m*2.4];};
 const ctl=()=>{const G=window.__G,o=OFFOF(G.dir);e.speed=0;e.attackCooldown=99;e.cooldown=99;e.hitTimer=0;
  player.x=hx;player.y=hy;let ex=hx-o[0],ey=hy-o[1];
  if(G.mode==='walk'){const w=(time-G.t0)*1.2%1.6-.8,m=Math.hypot(o[0],o[1]);ex+=o[0]/m*w;ey+=o[1]/m*w;}
  e.x=ex;e.y=ey;if(G.mode==='atk'){if(!G.att||e.attack!==G.att)G.att=e.attack={elapsed:0,shape154:{windup:.6,active:.25,recovery:.4},angle:Math.atan2(o[1],o[0])};e.attack.elapsed=G.el;}else e.attack=null;
  requestAnimationFrame(ctl);};ctl();},id);
const wait=async s=>{const t0=await p.evaluate(()=>time);for(let i=0;i<300;i++){await skip(p);if(await p.evaluate(([t,s])=>time>t+s,[t0,s]))return;await p.waitForTimeout(60);}};
await wait(1.5);const shots=[];
for(const [mode,el] of [['idle',0],['walk',0],['atk',.3],['atk',.7]]){for(const dir of ['up','down','left','right']){
 await p.evaluate(([m,d,el])=>{__G.mode=m;__G.dir=d;__G.el=el;__G.t0=time;__G.e.attack=null;__G.att=null;},[mode,dir,el]);await wait(mode==='walk'?.5:.3);
 const box=await p.evaluate(()=>{const q=project(__G.e.x,__G.e.y);const r=document.querySelector('canvas').getBoundingClientRect();const s=r.width/innerWidth;return {x:r.left+q.x*r.width/(document.querySelector('canvas').width||r.width)-110,y:r.top+q.y*r.height/(document.querySelector('canvas').height||r.height)-200,width:220,height:240};});
 const st=await p.evaluate(()=>{const a=project(__G.e.x,__G.e.y),b=project(player.x,player.y);const I=window.__STORYWORLD_MOB_DIR_ART_R1377__.inspect();return {...I.last,S:I.stats,rdy:(()=>{try{const r=readyImage("assets/r1377/k103-boss-kair03/atk_up6.webp");return r?(r.ready+":"+!!r.image):"none";}catch(e){return "err"}})(),dx:Math.round(b.x-a.x),dy:Math.round(b.y-a.y),ex:+__G.e.x.toFixed(2),ey:+__G.e.y.toFixed(2),px:+player.x.toFixed(2),py:+player.y.toFixed(2),att:!!__G.e.attack};});
 shots.push({mode,el,dir,buf:await p.screenshot({clip:{x:Math.max(0,box.x),y:Math.max(0,box.y),width:220,height:240}}),st});}}
const fs=await import('node:fs');fs.mkdirSync(out+'.d',{recursive:true});shots.forEach((s,i)=>fs.writeFileSync(`${out}.d/${String(i).padStart(2,'0')}-${s.mode}${s.el||''}-${s.dir}.png`,s.buf));
fs.writeFileSync(out+'.json',JSON.stringify(shots.map(s=>({mode:s.mode,el:s.el,dir:s.dir,st:s.st}))));await b.close();
