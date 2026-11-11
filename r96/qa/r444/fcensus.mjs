// 최종 그림 뒤집기 전수: drawEnemy 가 끝난 뒤 그리기 기록기(ctx.commands)에 남은 몸 그림 명령의 points 로 좌우 뒤집힘을 읽어 R444 좌우와 비교
//  (drawImage 변환 행렬은 R425 공격 방향 바로잡기 같은 뒤처리를 못 본다 — 명령이 없을 때만 행렬 값을 쓴다)
import {chromium,boot,go,skip} from './lib.mjs';
const zones=(process.argv[2]||'ep1a01,dist01,ep1a08,ep1b03,u202').split(',');const secs=+process.argv[3]||14;const init=process.argv[4]&&process.argv[4]!=='-'?JSON.parse(process.argv[4]):null;const outFile=process.argv[5]||'fc.json';const dwell=+(process.argv[6]||700);// 'real' 방식: 영웅이 한 자리에 머무는 실제 시간(ms)
// mode 'game'(권장): secs 를 '게임 시간'으로 잰다. 앞 절반은 영웅이 1.25초(게임 시간)마다 가장 가까운 몹 둘레 2.2칸의 새 자리에 서고(몹이 다가와 준비·공격·옆걸음),
//  뒤 절반은 무리 둘레 2.6칸을 걷는 속도(초당 1.8칸)로 돈다(몹이 쫓아 걷는다). 영웅은 스스로 움직이거나 공격하지 않는다(auto·guide 끔, 무적).
//  헤드리스 소프트웨어 렌더링은 화면이 클수록 느리다(1280×720 은 실제 1초에 게임 0.14초) → VP=640x360 으로 돌리면 약 5배 빠르고, 몹은 모두 그려진다.
const mode=process.argv[7]||'real';const VP=(process.env.VP||'1280x720').split('x').map(Number);
const b=await chromium.launch();const {p}=await boot(b,{init,vp:{width:VP[0],height:VP[1]}});
await p.evaluate(()=>{const P=window.__fp={rows:[],miss:0,st:new Map()};
 // 최종 그리기 명령에서 몸 그림 좌우를 읽는다: drawEnemy 안의 뒤처리(R425 공격 방향 바로잡기 등)가 점(points)을 거울처럼 바꾼 뒤의 값. 좌상→우상 x 가 줄면 뒤집힘.
 window.finalBody=(c,st)=>{if(!(st>=0)||!Array.isArray(c.commands))return null;let fin=null;for(let i=st;i<c.commands.length;i++){const k=c.commands[i];if(k?.kind!=='image'||!Array.isArray(k.points)||k.points.length<4)continue;if(k.owner&&k.owner.kind&&k.owner.kind!=='enemy')continue;
  const src=String(k.sourcePath||k.image?.src||'').replace(/^.*\/m0\//,'');if(/r251\/atlas|pixelfx|\/fx|effect|vfx|ring|circle|sigil/i.test(src))continue;const P=k.points,area=Math.abs((P[1][0]-P[0][0])*(P[3][1]-P[0][1])-(P[1][1]-P[0][1])*(P[3][0]-P[0][0]));if(!fin||area>fin.area)fin={area,src,flip:(P[1][0]-P[0][0])<0,cell:String(k.sourceRect?.slice(0,2)||'')};}return fin;};
 const F=()=>window.__STORYWORLD_ENEMY_FACE_R444__;
 const base=drawEnemy;drawEnemy=function(e,...a){if(!e||!(e.hp>0)||!ctx||typeof ctx.drawImage!=='function')return base.call(this,e,...a);
  const c=ctx,orig=Object.prototype.hasOwnProperty.call(c,'drawImage')?c.drawImage:null,f=c.drawImage,st0=Array.isArray(c.commands)?c.commands.length:-1;let best=null;
  c.drawImage=function(img,...q){try{let sx=0,sy=0,dw,dh;if(q.length>=8){sx=q[0];sy=q[1];dw=q[6];dh=q[7];}else if(q.length>=4){dw=q[2];dh=q[3];}else{dw=img?.width||0;dh=img?.height||0;}
    const m=c.matrix||[1,0,0,1,0,0],area=Math.abs(dw*dh*m[0]*m[3]);const src=String(img?.currentSrc||img?.src||img?.__path||img?.dataset?.path||(img?.width+'x'+img?.height)).replace(/^.*\/m0\//,'');if(!/r251\/atlas|pixelfx|\/fx|effect|vfx|ring|circle|sigil/i.test(src)&&(!best||area>best.area)){best={area,src,cell:sx+','+sy,flip:(m[0]*Math.sign(dw||1))<0};}}catch(_){}return f.apply(this,arguments);};
  try{return base.call(this,e,...a);}finally{if(orig)c.drawImage=orig;else delete c.drawImage;
   const s=P.st.get(e)||{};const sx=(e.x-e.y)-(s.x??(e.x-e.y)),sy=((e.x+e.y)/2)-(s.y??((e.x+e.y)/2));P.st.set(e,{x:e.x-e.y,y:(e.x+e.y)/2});
   const fin=finalBody(c,st0);if(fin){const cv=!fin.src||fin.src==='original-actor-canvas';best={...(best||{}),src:cv?(best?.src||'canvas')+'#'+String(e.name||'').replace(/ \d+$/,''):fin.src,flip:fin.flip,area:fin.area,cell:best?.cell||fin.cell};}
   if(!best){P.miss++;return;}
   const atk=e.attack&&Number.isFinite(e.attack.angle)?e.attack.angle:(e.rangedWindup>0?e.rangedAim:(e.r61Action&&time<e.r61Action.endAt?e.r61Action.angle:null));
   const sd=a=>{if(a==null||!Number.isFinite(a))return null;const X=Math.cos(a)-Math.sin(a);return Math.abs(X)<.15?null:X>0?'right':'left';};
   const st=F()?.state?.(e);const ps=(player.x-player.y)-(e.x-e.y);
   P.rows.push({id:e.id,n:e.name,t:time,side:st?.side||null,own:st?.owner||null,dir:e.direction,src:best.src,cell:best.cell,flip:best.flip,sx,sy,atk:sd(atk),ph:e.attack?'m':e.rangedWindup>0?'r':(e.r61Action&&time<e.r61Action.endAt?'61':null),hero:Math.abs(ps)<.3?null:ps>0?'right':'left',boss:!!(e.boss||e.midboss),persona:!!e.persona,mv:!!e.moving,
    // 두 실행에 같은 기준을 쓰려고 위치·공격 거리·피격을 남긴다(fcmp 가 영웅 곁 옆·뒷걸음·밀림을 R444 와 상관없이 기하로 뺀다)
    ex:+e.x.toFixed(3),ey:+e.y.toFixed(3),px:+player.x.toFixed(3),py:+player.y.toFixed(3),rng:+(Number(e.combatProfile?.attackShape?.range)||1.2),hit:e.hitTimer>0});}};});
const out={};
for(const z of zones){try{await go(p,z);await p.evaluate(()=>{window.__fp.rows=[];window.__fp.miss=0;player.hp=1e9;window.__fp.st=new Map();});
 if(mode==='game'){await p.evaluate(G=>{auto=false;guide=false;player.hp=9e8;player.invincible=999;window.__hero={t0:time,G,k:0,next:time,c:null};
   if(!window.__heroWrap){window.__heroWrap=true;const tb=tick;tick=function(dt,...a){const r=tb.call(this,dt,...a);try{window.__heroStep?.(dt);}catch(err){window.__heroErr=String(err).slice(0,200);}return r;};}
   const near=L=>L.slice().sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];
   window.__heroStep=dt=>{const H=window.__hero;if(!H)return;const el=time-H.t0;player.hp=Math.max(player.hp,9e8);player.invincible=999;
    const L=room.enemies.filter(e=>e.hp>0&&e.spawnState==='active'&&!e.persona);if(!L.length)return;
    if(el<H.G/2){if(time>=H.next){const e=near(L);for(let j=0;j<8;j++){const a=(H.k++)*Math.PI*3/4;const tx=e.x+Math.cos(a)*2.2,ty=e.y+Math.sin(a)*2.2;if(!blocked(tx,ty,.3)){player.x=tx;player.y=ty;break;}}H.next=time+1.25;}return;}
    if(!H.c){const e=near(L);H.c={x:e.x,y:e.y,a:Math.atan2(player.y-e.y,player.x-e.x),dir:1};}
    const c=H.c,R=2.6,w=1.8/R;for(let tr=0;tr<2;tr++){const a=c.a+c.dir*w*dt,tx=c.x+Math.cos(a)*R,ty=c.y+Math.sin(a)*R;if(!blocked(tx,ty,.3)){c.a=a;player.x=tx;player.y=ty;return;}c.dir*=-1;}};},secs);
  await p.waitForFunction(()=>time-window.__hero.t0>=window.__hero.G,null,{timeout:900000,polling:500});await p.evaluate(()=>{window.__hero=null;});
  out[z]={rows:await p.evaluate(()=>window.__fp.rows),miss:await p.evaluate(()=>window.__fp.miss),err:await p.evaluate(()=>window.__heroErr||null)};continue;}
 const t0=Date.now();let k=0;while(Date.now()-t0<secs*1000){await p.evaluate(k=>{const L=room.enemies.filter(e=>e.hp>0&&e.spawnState!=='hidden');if(!L.length)return;player.hp=Math.max(player.hp,9e8);player.invincible=1;
  const e=L.sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];const a=k*Math.PI/4;const tx=e.x+Math.cos(a)*1.6,ty=e.y+Math.sin(a)*1.6;if(!blocked(tx,ty,.3)){player.x=tx;player.y=ty;}},k++);await p.waitForTimeout(dwell);}
 out[z]={rows:await p.evaluate(()=>window.__fp.rows),miss:await p.evaluate(()=>window.__fp.miss)};}catch(err){out[z]={err:String(err).slice(0,200)};}}
const fs=await import('node:fs');fs.writeFileSync(outFile,JSON.stringify(out));
await b.close();
