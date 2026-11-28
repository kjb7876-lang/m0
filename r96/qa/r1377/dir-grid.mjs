// R1377 방향 격자(QA 2차 요청 형식): 보스 하나를 빈 바닥 한가운데 세우고, 화면 기준 위·아래·왼·오른쪽에 영웅을 둔 채
//  대기·걷기(2칸)·공격(0.3/0.7초)·피격을 찍는다. 자르기는 실제 그려진 몸 그림 상자 중심·같은 축척, 이름표·HUD 는 숨긴다.
//  표(json): 칸마다 그림 경로·칸·몸 키·폭(대기 대비 %)·발 y(지면 기준)·좌우 뒤집힘. 헤드리스라 그래픽 검증 아님.
// (3D 몹 오버레이가 켜진 보스는 2D 몸이 가려진다 — NO3D=1 이면 R1330·R1322c 3D 를 끄고 2D 를 찍는다)
// 사용: SPOOF=1 node dir-grid.mjs <out 접두어> <zone> <nativeId>   → <out>.png(격자) <out>.json(표)
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const [out,z,id]=process.argv.slice(2);const b=await chromium.launch();
{const nc=b.newContext.bind(b);b.newContext=async o=>{const c=await nc(o);c.setDefaultNavigationTimeout(240000);if(process.env.SPOOF)await c.addInitScript(()=>{Object.defineProperty(Navigator.prototype,'webdriver',{get:()=>false});});return c;};}
const {p}=await boot(b,{vp:{width:1280,height:720},init:{'storyworld.r619.videopause':'{"on":false}','storyworld.r1036.entryvideo':'{"on":false}','storyworld.r309.opening':'{"on":false}','storyworld.r372.rootgate':'{"on":false}',...(process.env.NO3D?{'storyworld.r1330.sin7':'off','storyworld.r1322c.boss3d':'off'}:{})}});
await go(p,z);await skip(p);
await p.addStyleTag({content:'body>*:not(canvas):not(#game):not(.game){visibility:hidden!important} canvas{visibility:visible!important}'}).catch(()=>{});
const ok=await p.evaluate(id=>{const e=room.enemies.find(q=>q.nativeId===id);if(!e)return 'no enemy';for(const q of room.enemies)if(q!==e)q.hp=0;
 player.hp=player.maxHp=1e9;player.invincible=1e9;player.visible=false;e.hp=e.maxHp=1e8;e.engaged=true;e.spawnState='active';try{e.hideName=true;e.nameplate=false;}catch(_){}
 const OFFOF=(hx,hy,d)=>{const P0=project(hx,hy),PX=project(hx+1,hy),PY=project(hx,hy+1),ax=PX.x-P0.x,ay=PX.y-P0.y,bx=PY.x-P0.x,by=PY.y-P0.y,det=ax*by-ay*bx;
  const [sx,sy]={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[d];const wx=(by*sx-bx*sy)/det,wy=(-ay*sx+ax*sy)/det,m=Math.hypot(wx,wy)||1;return [wx/m*2.6,wy/m*2.6];};
 // 영웅·보스 자리 모두 막힘 없는 바닥 고르기(벽에 밀려 옆으로 새지 않게)
 let best=null;const R=room.exploration?.floorCells||[];const cands=[];for(let x=1;x<(room.width||40);x+=.5)for(let y=1;y<(room.height||40);y+=.5)cands.push([x,y]);
 const free=(x,y)=>{try{return !blocked(x,y,.9);}catch(_){return false;}};
 for(const [x,y] of cands){if(!free(x,y))continue;let okk=true;for(const d of ['up','down','left','right']){const o=OFFOF(x,y,d);for(const k of [-1.1,0,1.1]){if(!free(x-o[0]*(1+k*.0)-o[0]*k*.4,y-o[1]-o[1]*k*.4)){okk=false;break;}}if(!okk)break;}if(okk){best=[x,y];break;}}
 if(!best)best=[player.x,player.y];const [hx,hy]=best;
 window.__G={e,hx,hy,mode:'idle',dir:'left',t0:time,el:0,att:null,OFFOF};
 const ctl=()=>{const G=window.__G,o=OFFOF(hx,hy,G.dir);e.speed=0;e.attackCooldown=99;e.cooldown=99;e.cd=99;if(G.mode!=='hit')e.hitTimer=0;else e.hitTimer=.08;
  player.x=hx;player.y=hy;player.vx=player.vy=0;player.visible=false;let ex=hx-o[0],ey=hy-o[1];
  if(G.mode==='walk'){const m=Math.hypot(o[0],o[1]),w=((time-G.t0)*1.4)%2-1;ex+=o[0]/m*w;ey+=o[1]/m*w;}
  e.x=ex;e.y=ey;if(G.mode==='atk'){if(!G.att||e.attack!==G.att)G.att=e.attack={elapsed:0,shape154:{windup:.6,active:.25,recovery:.4},angle:Math.atan2(o[1],o[0])};e.attack.elapsed=G.el;}else e.attack=null;
  requestAnimationFrame(ctl);};ctl();
 // 그린 몸 그림 잡기(census 와 같은 길)
 const seen=new WeakSet();window.__B=null;
 const wr=o=>{if(!o||typeof o.ensureHospitalVisual!=='function'||o.ensureHospitalVisual.__g)return;const base=o.ensureHospitalVisual;const w=function(frame){try{const c=frame?.commands;if(Array.isArray(c)&&!seen.has(c)){seen.add(c);let bb=null,bh=0;
  for(const k of c){if(k?.kind!=='image'||String(k.owner?.id||'')!=='enemy:'+e.id||!Array.isArray(k.points)||k.points.length<4)continue;const h=Math.abs(k.points[3][1]-k.points[0][1]);if(h>bh){bh=h;bb=k;}}
  if(bb){const P=project(e.x,e.y);window.__B={src:String(bb.sourcePath||'').replace(/^.*?assets\//,'assets/'),rect:(bb.sourceRect||[]).map(Math.round),pts:bb.points.map(q=>q.map(v=>+v.toFixed(1))),gx:P.x,gy:P.y,mir:bb.points[1][0]<bb.points[0][0],all:c.filter(k=>k?.kind==='image'&&String(k.owner?.id||'')==='enemy:'+e.id&&Array.isArray(k.points)).map(k=>[String(k.sourcePath||'').replace(/^.*?assets\//,''),Math.round(Math.abs(k.points[3][1]-k.points[0][1])),!!k.r1377,c.indexOf(k),String(k.image?.src||k.image?.__path||'').split('/').slice(-2).join('/'),k.image?.naturalWidth||k.image?.width||0,k.image?.constructor?.name,k.image?.height,Object.keys(k.image||{}).slice(0,10).join(','),Object.keys(k).join(',')])};}}}catch(_){}return base.apply(this,arguments);};w.__g=1;o.ensureHospitalVisual=w;};
 const hook=()=>{try{const h=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(h){wr(Object.getPrototypeOf(h));if(Object.prototype.hasOwnProperty.call(h,'ensureHospitalVisual'))wr(h);}}catch(_){}requestAnimationFrame(hook);};hook();
 return 'ok '+best.join(',');},id);
console.log(z,id,ok);
const wait=async s=>{const t0=await p.evaluate(()=>time);for(let i=0;i<400;i++){await skip(p);if(await p.evaluate(([t,s])=>time>t+s,[t0,s]))return;await p.waitForTimeout(50);}};
await wait(2);
const ROWS=[['idle',0],['walk',0],['walk',1],['atk',.3],['atk',.7],['hit',0]],COLS=['up','down','left','right'];const cells=[];
for(const [mode,el] of ROWS)for(const dir of COLS){
 await p.evaluate(([m,d,el])=>{const G=__G;if(G.mode!==m||G.dir!==d){G.t0=time;G.att=null;G.e.attack=null;G.e.storyAttackState5=null;G.e.storyAttackUntil5=0;}G.mode=m;G.dir=d;G.el=el;},[mode,dir,el]);
 await wait(mode==='walk'?(el?0.9:0.55):0.45);
 const info=await p.evaluate(()=>{const B=window.__B,cv=document.querySelector('canvas'),r=cv.getBoundingClientRect(),sx=r.width/cv.width,sy=r.height/cv.height;const a=project(__G.e.x,__G.e.y),h=project(player.x,player.y);
  const I=window.__STORYWORLD_MOB_DIR_ART_R1377__?.inspect?.().last;const E=__G.e,st={atk:!!E.attack,sa:E.storyAttackState5?String(E.storyAttackState5).slice(0,20):null,su:+(E.storyAttackUntil5||0).toFixed(2),t:+time.toFixed(2),rw:E.rangedWindup||0,ht:E.hitTimer||0};let s3=[];for(const k of Object.keys(window))if(/3D/.test(k)&&/MOB|BOSS/.test(k)){try{const q=window[k]?.inspect?.();if(q&&q.shown>0)s3.push(k.replace(/^__STORYWORLD_|__$/g,'')+':'+q.shown);}catch(_){}}
  return {B,sx,sy,left:r.left,top:r.top,hd:[Math.round(h.x-a.x),Math.round(h.y-a.y)],last:I,s3,st};});
 // 대기·피격 칸인데 보스 패턴 시전(엔진이 시전 그림을 그려 R1377 이 공격으로 읽은 순간)이 찍히면 시전이 끝난 뒤 다시 찍는다 — 몇 번 미뤘는지 표에 남긴다
 let retry=0;while((mode==='idle'||mode==='hit')&&/^atk/.test(info.last?.k||'')&&retry<5){retry++;await wait(0.5);Object.assign(info,await p.evaluate(()=>({B:window.__B,last:window.__STORYWORLD_MOB_DIR_ART_R1377__?.inspect?.().last})));}
 const B=info.B;if(!B){cells.push({mode,el,dir,miss:true});continue;}
 const xs=B.pts.map(q=>q[0]),ys=B.pts.map(q=>q[1]);const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
 const S=Math.max(y1-y0,x1-x0)*1.15,cx=(x0+x1)/2,cy=(y0+y1)/2;
 const clip={x:info.left+(cx-S/2)*info.sx,y:info.top+(cy-S/2)*info.sy,width:S*info.sx,height:S*info.sy};
 const buf=await p.screenshot({clip:{x:Math.max(0,clip.x),y:Math.max(0,clip.y),width:Math.max(8,clip.width),height:Math.max(8,clip.height)}});
 cells.push({mode,el,dir,src:B.src,rect:B.rect,mir:B.mir,drawH:+(y1-y0).toFixed(1),drawW:+(x1-x0).toFixed(1),footFromGround:+(y1-B.gy).toFixed(1),hero:info.hd,last:info.last,retry,shown3d:info.s3,st:info.st,all:B.all,png:buf.toString('base64')});}
fs.writeFileSync(out+'.json',JSON.stringify({zone:z,id,cells:cells.map(({png,...c})=>c)},null,1));fs.mkdirSync(out+'.d',{recursive:true});cells.forEach((c,i)=>{if(c.png)fs.writeFileSync(`${out}.d/${String(i).padStart(2,'0')}.png`,Buffer.from(c.png,'base64'));});
await b.close();
