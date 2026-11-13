// R970 헤드리스 실측: 불면귀(last303 보스)·검은 안개 심장(last302 중간보스)을 위·아래·왼쪽·오른쪽(화면 기준)으로 걷게 하고 몸 그리기 명령과 화면을 남긴다.
// 사용: [VP=640x360] [ZONE=last303] SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r970/move-scene.mjs <outdir>
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();const VP=(process.env.VP||'640x360').split('x').map(Number);const {p}=await boot(b,{vp:{width:VP[0],height:VP[1]}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const wait=async s=>{const t0=await p.evaluate(()=>time);for(let i=0;i<400;i++){await skip(p);if(await p.evaluate(([t,s])=>time>t+s,[t0,s]))return;await p.waitForTimeout(250);}}; // 도착 서사 창이 뜨면 게임 시간이 멈춘다 → 넘기며 기다린다
const res={};
const ZONES=[['last303',"e=>e.boss&&!e.midboss"],['last302',"e=>e.midboss"]].filter(z=>!process.env.ZONE||process.env.ZONE===z[0]);
for(const [z,sel] of ZONES){await go(p,z);
 await p.evaluate(sel=>{const f=eval(sel);const B=room.enemies.find(f);for(const e of room.enemies)if(e!==B)e.hp=0;B.spawnState='active';B.explorationLeash=null;player.hp=player.maxHp=1e9;player.invincible=1e9;window.__B=B;window.__S=[];window.__V=null;
  B.speed=0;B.moveSpeed=0;window.__HX=B.x;window.__HY=B.y;
  // 화면 단위 방향 → 세계 방향(project 로 잰 두 축)
  const o=project(B.x,B.y),ax=project(B.x+1,B.y),ay=project(B.x,B.y+1);const a=ax.x-o.x,bb=ay.x-o.x,c=ax.y-o.y,d=ay.y-o.y,det=a*d-bb*c;window.__INV=(sx,sy)=>[(d*sx-bb*sy)/det,(-c*sx+a*sy)/det];
  const de=drawEnemy;drawEnemy=function(e,...a){const cx=ctx,s0=cx.commands?.length??-1;const r=de.call(this,e,...a);if(e===window.__B&&s0>=0){let best=null,bh=0;for(let i=s0;i<cx.commands.length;i++){const k=cx.commands[i];if(k.kind!=='image'||k.owner?.kind!=='enemy'||k.r760Ghost||k.r620Ghost)continue;const h=Math.abs(k.points[3][1]-k.points[0][1]);if(h>bh){bh=h;best=k;}}
    if(best&&window.__S.length<8000){const q=project(e.x,e.y);window.__S.push({t:+time.toFixed(3),v:window.__V,s:String(best.sourcePath||'').split('/').slice(-2).join('/'),f:Math.round(best.sourceRect[0]/best.sourceRect[2]),cell:best.sourceRect[2],h:+bh.toFixed(1),flip:best.points[1][0]<best.points[0][0],
      bot:+(Math.max(...best.points.map(q=>q[1]))-q.y).toFixed(1),att:!!e.attack});}}return r;};
  // 엔진 걸음을 멈추고 tick 뒤에 정해진 속도로 옮긴다(게임 시간 기준)
  let lt=time;const loop=()=>{const dt=Math.max(0,Math.min(.1,time-lt));lt=time;const B=window.__B;if(B&&B.hp>0){if(window.__V){const[wx,wy]=window.__INV(window.__V[0],window.__V[1]);const n=Math.hypot(wx,wy)||1;B.x+=wx/n*1.6*dt;B.y+=wy/n*1.6*dt;B.attack=null;B.state='chase';B.attackCooldown=9;}}requestAnimationFrame(loop);};requestAnimationFrame(loop);
 },sel);
 const shots={};
 for(const [name,v] of [['down',[0,1]],['up',[0,-1]],['right',[1,0]],['left',[-1,0]],['idle',null]]){
  await p.evaluate(v=>{const B=window.__B;B.x=window.__HX;B.y=window.__HY;player.x=B.x+ (v&&v[0]<0?-4:4);player.y=B.y+4;window.__V=v;},v);await wait(.9);
  const q=await p.evaluate(()=>{const B=window.__B,q=project(B.x,B.y),cv=[...document.querySelectorAll('canvas')].sort((a,b)=>b.clientWidth*b.clientHeight-a.clientWidth*a.clientHeight)[0],r=cv.getBoundingClientRect(),lw=(typeof ctx!=='undefined'&&ctx.canvas?.width)||cv.width,lh=(typeof ctx!=='undefined'&&ctx.canvas?.height)||cv.height;return [r.left+q.x*r.width/lw,r.top+q.y*r.height/lh,r.width/lw];});const f=`${OUT}/r970-${z}-${name}.png`;await p.screenshot({path:f,clip:{x:Math.max(0,Math.min(VP[0]-240,q[0]-120)),y:Math.max(0,Math.min(VP[1]-240,q[1]-190)),width:240,height:240}});shots[name]=f;await wait(.5);}
 const S=await p.evaluate(()=>window.__S);const by={};for(const r of S){const k=r.v?(r.v[1]>0?'down':r.v[1]<0?'up':r.v[0]>0?'right':'left'):'idle';(by[k]=by[k]||[]).push(r);}
 const sum={};for(const[k,L] of Object.entries(by)){const T=L.slice(Math.floor(L.length*.5));const sh={};for(const r of T)sh[r.s]=(sh[r.s]||0)+1;sum[k]={n:L.length,settled:sh,frames:[...new Set(T.map(r=>r.f))].sort().join(''),cell:[...new Set(T.map(r=>r.cell))],h:[Math.min(...T.map(r=>r.h)),Math.max(...T.map(r=>r.h))],flip:[...new Set(T.map(r=>r.flip))],bot:[Math.min(...T.map(r=>r.bot)),Math.max(...T.map(r=>r.bot))],switches:L.filter((r,i)=>i&&r.s!==L[i-1].s).length};}
 res[z]={sum,inspect:await p.evaluate(()=>window.__STORYWORLD_BULMYEONGWI_R760__?.inspect()),shots};}
res.pageErrors=errs;fs.writeFileSync(`${OUT}/r970-move-scene${process.env.ZONE?'-'+process.env.ZONE:''}.json`,JSON.stringify(res,null,1));console.log(JSON.stringify(res,null,1));await b.close();
