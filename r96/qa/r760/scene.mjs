// R760 헤드리스 실측: 불면귀 보스(last303)·중간보스(last302)의 실제 그리기 명령(몸 그림·키·잔상)과 화면 캡처.
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r760/scene.mjs <outdir>
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();const {p}=await boot(b);const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const res={};
for(const [z,sel] of [['last303',"e=>e.boss&&!e.midboss"],['last302',"e=>e.midboss"]]){await go(p,z);
 await p.evaluate(sel=>{const f=eval(sel);const B=room.enemies.find(f);for(const e of room.enemies)if(e!==B)e.hp=0;B.spawnState='active';player.x+=3;player.y+=1;B.x=B.homeX=player.x-2.6;B.y=B.homeY=player.y-2.6;B.explorationLeash=null;
  player.hp=player.maxHp=1e9;player.invincible=1e9;window.__B=B;window.__S=[];
  const de=drawEnemy;drawEnemy=function(e,...a){const c=ctx,s0=c.commands?.length??-1;const r=de.call(this,e,...a);if(e===window.__B&&s0>=0&&window.__S.length<4000){const im=[];for(let i=s0;i<c.commands.length;i++){const k=c.commands[i];if(k.kind!=='image'||k.owner?.kind!=='enemy')continue;const P=k.points||[];im.push({s:String(k.sourcePath||'').replace(/^.*\/m0\//,''),h:P.length>3?+Math.abs(P[3][1]-P[0][1]).toFixed(1):0,g:!!k.r760Ghost,a:+(k.style?.globalAlpha??1).toFixed(2)});}
   const q0=project(e.x,e.y),q1=project(e.x+1,e.y+1);window.__S.push({t:+time.toFixed(2),att:!!e.attack,hp:e.hp/e.maxHp,u:+Math.hypot(q1.x-q0.x,q1.y-q0.y).toFixed(2),im});}return r;};},sel);
 const shots=[];for(let i=0;i<8;i++){const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+0.6,t0,{timeout:90000}).catch(()=>{});
  const st=await p.evaluate(()=>({att:!!__B.attack,st:__B.state}));const q=await p.evaluate(()=>{const q=project(__B.x,__B.y);return [q.x,q.y]});
  const f=`${OUT}/${z}-${i}${st.att?'-atk':''}.png`;await p.screenshot({path:f,clip:{x:Math.max(0,q[0]-300),y:Math.max(0,q[1]-420),width:600,height:520}});shots.push(f);}
 if(z==='last303'){await p.evaluate(()=>{__B.hp=__B.maxHp*.45;});const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+0.6,t0,{timeout:90000}).catch(()=>{});}
 const S=await p.evaluate(()=>window.__S);
 const bodies=S.map(f=>{const x=f.im.filter(x=>!x.g&&!/r106fx|ring/.test(x.s)).sort((a,b)=>b.h-a.h)[0];return x&&{...x,r:+(x.h/f.u).toFixed(2)};}).filter(Boolean);
 const by={};for(const x of bodies){const k=x.s.replace(/^assets\//,'');(by[k]||(by[k]=[])).push(x.r);}
 const ghosts=S.map(f=>f.im.filter(x=>x.g).length);
 res[z]={frames:S.length,bodyHeights:Object.fromEntries(Object.entries(by).map(([k,v])=>[k,{n:v.length,minPerTile:Math.min(...v),maxPerTile:Math.max(...v)}])),
  ghostCounts:[...new Set(ghosts)],ghostsAtLowHp:[...new Set(S.filter(f=>f.hp<=.5).map(f=>f.im.filter(x=>x.g).length))],attackFrames:S.filter(f=>f.att).length,
  inspect:await p.evaluate(()=>window.__STORYWORLD_BULMYEONGWI_R760__?.inspect()),shots};}
res.pageErrors=errs;fs.writeFileSync(`${OUT}/scene.json`,JSON.stringify(res,null,1));console.log(JSON.stringify(res,null,1));await b.close();
