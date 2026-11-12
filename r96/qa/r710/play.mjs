// R710 헤드리스 연속 재생 확인(소프트웨어 렌더링, GPU·실기기 아님): 영웅마다 남쪽 대기 3초·피격 1회 동안 실제 그리기 명령(몸 그림)의 경로·칸·화면 키·발 위치를 모은다.
// 실행: SW_URL=http://127.0.0.1:4410/m0/ node play.mjs <outDir>
import {chromium,boot} from '../r444/lib.mjs';
import fs from 'node:fs';
const [,,out='shots']=process.argv;fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await p.evaluate(()=>{player.hp=9e8;player.maxHp=9e8;player.invincible=1e9;
 const base=drawHero;drawHero=function(...a){const c=ctx,st=Array.isArray(c?.commands)?c.commands.length:-1;const r=base.apply(this,a);
  if(st>=0){let best=null,bh=0;for(let i=st;i<c.commands.length;i++){const k=c.commands[i];if(k?.kind!=='image'||k.owner?.kind!=='hero'||!k.points)continue;const hh=Math.abs(k.points[3][1]-k.points[0][1]);if(hh>bh){bh=hh;best=k;}}
   if(best){const q=project(player.x,player.y),P=best.points,ys=P.map(v=>v[1]);window.__body={src:String(best.sourcePath||best.image?.src||'').replace(/^.*?(assets\/)/,'$1'),sr:best.sourceRect||null,h:+(Math.max(...ys)-Math.min(...ys)).toFixed(1),bot:+Math.max(...ys).toFixed(1),fy:+q.y.toFixed(1),hurt:+(+player.hurtAnim||0).toFixed(3),t:+time.toFixed(2)};}}
  return r;};});
const switchHero=h=>p.evaluate(async h=>{loading=true;try{await ensureImages(heroPaths(h));player.hero=h;player.combo=0;player.ego=0;}finally{loading=false;}updateHUD();},h);
const clear=()=>p.evaluate(()=>{for(const e of room.enemies||[])e.hp=0;player.moving=false;player.moveVX150=0;player.moveVY150=0;player.direction='front';player.attackAnim=0;player.skillAnim=0;player.hurtAnim=0;});
const res={};
for(const h of ['hunter','lauren','michaela','seoha','gunner','neon']){
 await switchHero(h);await clear();
 // 그림이 들어올 때까지(게임 시간 1.5초)
 let t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+1.5,t0,{timeout:120000});
 const idle=[];t0=await p.evaluate(()=>time);
 for(let i=0;i<40;i++){await p.waitForFunction(t=>time>t,await p.evaluate(()=>time),{timeout:60000});const s=await p.evaluate(()=>window.__body);if(s)idle.push(s);await clear();if((await p.evaluate(()=>time))>t0+3.2)break;}
 const q=await p.evaluate(()=>{const q=project(player.x,player.y);return q;});
 await p.screenshot({path:`${out}/${h}-idle.png`,clip:{x:Math.max(0,q.x-60),y:Math.max(0,q.y+5),width:120,height:110}});
 // 피격: 엔진 기본 피격 시간으로 맞은 것처럼
 await p.evaluate(()=>{player.hurtAnim=.34;});const hit=[];let shot=0;
 for(let i=0;i<60;i++){await p.waitForFunction(t=>time>t,await p.evaluate(()=>time),{timeout:60000});const s=await p.evaluate(()=>window.__body);if(!s||s.hurt<=0)break;hit.push(s);
}
 // 피격 칸마다 장면: 맞은 순간(.34)을 시작으로 남은 시간을 칸 가운데로 맞춰 두고 찍는다
 for(let fr=0;fr<4;fr++){await p.evaluate(()=>{player.hurtAnim=.34;});await p.waitForFunction(t=>time>t,await p.evaluate(()=>time),{timeout:60000});await p.evaluate(fr=>{player.hurtAnim=.34*(1-(fr+.5)/4);},fr);await p.waitForFunction(t=>time>t,await p.evaluate(()=>time),{timeout:60000});
  const s=await p.evaluate(()=>window.__body);await p.screenshot({path:`${out}/${h}-hit${fr}.png`,clip:{x:Math.max(0,q.x-60),y:Math.max(0,q.y+5),width:120,height:110}});hit.push({...s,shot:fr});}
 await clear();
 res[h]={idle,hit,inspect:await p.evaluate(()=>window.__STORYWORLD_IDLE_HIT_R710__?.inspect?.())};
 const fi=[...new Set(idle.filter(s=>/r710/.test(s.src)).map(s=>s.sr&&Math.round(s.sr[0]/192)))];
 console.log(h,'idle samples',idle.length,'r710',idle.filter(s=>/r710/.test(s.src)).length,'frames',fi.sort().join(''),'h',[...new Set(idle.map(s=>s.h))].slice(0,4),'foot-bot',[...new Set(idle.map(s=>+(s.bot-s.fy).toFixed(1)))].slice(0,4),
  '| hit samples',hit.length,'srcs',[...new Set(hit.map(s=>s.src.split('/').slice(-3).join('/')))].join(','),'frames',hit.map(s=>s.sr?Math.round(s.sr[0]/192):'-').join(''),'hit h',[...new Set(hit.map(s=>s.h))].slice(0,5));
}
fs.writeFileSync(`${out}/play.json`,JSON.stringify({res,errs},null,1));console.log('pageerrors',errs.length,errs.slice(0,3));await b.close();
