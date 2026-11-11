// R763 헤드리스: last302·last303 일반몹이 잠식된 주민 그림·이름으로 그려지는지, 크기(영웅 대비), 죽음, 페이지 오류. 화면은 소프트웨어 렌더링 캡처.
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r760/villagers-scene.mjs <outdir>
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();const {p}=await boot(b);const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const res={};
for(const z of ['last302','last303']){await go(p,z);
 await p.evaluate(()=>{player.hp=player.maxHp=1e9;player.invincible=1e9;window.__S={};const de=drawEnemy;drawEnemy=function(e,...a){const c=ctx,s0=c.commands?.length??-1;const r=de.call(this,e,...a);
   if(s0>=0&&!e.boss){let best=null,bh=0;for(let i=s0;i<c.commands.length;i++){const k=c.commands[i];if(k.kind!=='image'||k.owner?.kind!=='enemy'||!k.points)continue;const h=Math.abs(k.points[3][1]-k.points[0][1]);if(h>bh){bh=h;best=k;}}
    if(best){const s=String(best.sourcePath||'').replace(/^.*\/m0\//,'');const key=s.replace(/^assets\//,'');(window.__S[key]||(window.__S[key]={n:0,h:[]})).n++;if(window.__S[key].h.length<200)window.__S[key].h.push(+bh.toFixed(1));}}return r;};});
 // 영웅 가까이로 몇 마리 불러 화면에 담는다
 await p.evaluate(()=>{const L=room.enemies.filter(e=>!e.boss&&!e.midboss&&e.hp>0&&e.spawnState!=='hidden');L.slice(0,6).forEach((e,i)=>{e.x=e.homeX=player.x+2+(i%3)*1.4;e.y=e.homeY=player.y-1.5+Math.floor(i/3)*2.2;e.explorationLeash=null;});});
 const shots=[];for(let i=0;i<4;i++){const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+0.8,t0,{timeout:120000}).catch(()=>{});
  const q=await p.evaluate(()=>{const q=project(player.x+3,player.y);return [q.x,q.y];});const f=`${OUT}/${z}-${i}.png`;await p.screenshot({path:f,clip:{x:Math.max(0,q[0]-360),y:Math.max(0,q[1]-300),width:720,height:440}});shots.push(f);}
 // 죽음: 가까운 주민 둘을 쓰러뜨리고 0.4초·1.2초 뒤 찍기
 await p.evaluate(()=>{const L=room.enemies.filter(e=>!e.boss&&!e.midboss&&e.hp>0&&e.r763);L.slice(0,2).forEach(e=>{try{e.hp=1;hitEnemy?.(e,999);}catch(_){}if(e.hp>0){e.hp=0;killEnemy(e);}});});
 for(const d of [.4,1.2]){const t0=await p.evaluate(()=>time);await p.waitForFunction(([t,d])=>time>t+d,[t0,d],{timeout:120000}).catch(()=>{});const q=await p.evaluate(()=>{const q=project(player.x+3,player.y);return [q.x,q.y];});
  const f=`${OUT}/${z}-death-${d}.png`;await p.screenshot({path:f,clip:{x:Math.max(0,q[0]-360),y:Math.max(0,q[1]-300),width:720,height:440}});shots.push(f);}
 res[z]=await p.evaluate(()=>({names:[...new Set(room.enemies.filter(e=>!e.boss).map(e=>String(e.name).replace(/ \d+$/,'')))],
  bodies:Object.fromEntries(Object.entries(window.__S).map(([k,v])=>[k,{n:v.n,min:Math.min(...v.h),max:Math.max(...v.h)}])),
  heroH:(()=>{try{return +(actorHeight()).toFixed(1);}catch(_){return null;}})(),inspect:window.__STORYWORLD_VILLAGERS_R763__.inspect(),
  deathFx:effects.filter(f=>f.r763).map(f=>({k:f.r763.k,life:f.life,age:+f.age.toFixed(2)}))}));res[z].shots=shots;}
res.pageErrors=errs;fs.writeFileSync(`${OUT}/villagers.json`,JSON.stringify(res,null,1));console.log(JSON.stringify(res,null,1));await b.close();
