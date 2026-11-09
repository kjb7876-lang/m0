// 같은 카메라 전후 비교(최종 그림, 같은 자리): 한 몹만 남기고 정해진 장면을 만든 뒤 게임 시간을 멈추고 찍는다.
//  windup: 영웅이 화면 오른쪽에 있을 때 공격 준비(근접 e.attack / 원거리 rangedWindup·rangedAim, 엔진과 같은 꼴) → 영웅이 왼쪽 뒤로 돎
//  walk:   영웅을 한쪽에 세워 두고 몹이 반대쪽 빈 바닥으로 걷는다(엔진 tick 뒤에 위치를 정해 R444 가 '실제 걸음'으로 읽게 함)
// 표시: 빨간 선 = 판정(근접 각·원거리 조준), 노란 글 = 판정/걷는 쪽, 하늘색 글 = 영웅 쪽. 로그에 화면에 그려진 몸 그림의 뒤집힘(flip)을 남긴다.
// 실행: SW_URL=… node scene4.mjs <tag> <zone> <nameRe> <scene> <initJson|-> <caption> [outDir]
//  환경 변수: MOBILE=1(844×390 전체 화면) · NOLABEL=1(이 스크립트의 글·선을 빼고 R444 디버그 표시만) · NOFREEZE=1(멈추지 않고 찍음) · SLOWSHOT=0.05(멈추는 대신 1/20 속도로 걷는 채로 찍음)
import {chromium,boot,go} from './lib.mjs';
const [,,tag,zone,nameRe,scene,initJson,caption,outDir='../shots']=process.argv;const init=initJson&&initJson!=='-'?JSON.parse(initJson):null;
const VP=process.env.MOBILE?{width:844,height:390}:{width:1280,height:720};const b=await chromium.launch();const {p}=await boot(b,{init,vp:VP});await go(p,zone);await p.waitForTimeout(2500);
await p.evaluate(()=>{window.__SLOW=1;const tb=tick;tick=function(dt,...a){const d=dt*(window.__SLOW??1);const r=tb.call(this,d,...a);try{window.__ctl?.(d);}catch(err){window.__ctlErr=String(err).slice(0,200);}return r;};
 const FX=/r251\/atlas|pixelfx|\/fx|effect|vfx|ring|circle|sigil/i;
 const de=drawEnemy;drawEnemy=function(e,...a){if(!e||!e.__mark||!(e.hp>0)||!ctx)return de.call(this,e,...a);
  const c=ctx,own=Object.prototype.hasOwnProperty.call(c,'drawImage')?c.drawImage:null,f=c.drawImage,st0=Array.isArray(c.commands)?c.commands.length:-1;let best=null;
  c.drawImage=function(img,...q){try{let dw,dh;if(q.length>=8){dw=q[6];dh=q[7];}else if(q.length>=4){dw=q[2];dh=q[3];}else{dw=img?.width||0;dh=img?.height||0;}
   const m=c.matrix||[1,0,0,1,0,0],area=Math.abs(dw*dh*m[0]*m[3]);const src=String(img?.currentSrc||img?.src||img?.__path||img?.dataset?.path||(img?.width+'x'+img?.height)).replace(/^.*\/m0\//,'');
   if(!FX.test(src)&&(!best||area>best.area))best={area,src,flip:(m[0]*Math.sign(dw||1))<0};}catch(_){}return f.apply(this,arguments);};
  let r;try{r=de.call(this,e,...a);}finally{if(own)c.drawImage=own;else delete c.drawImage;}
  // 최종 그리기 명령(drawEnemy 안 뒤처리 R425 등 반영)의 몸 그림 좌우: 좌상→우상 x 가 줄면 뒤집힘
  try{let fin=null;if(st0>=0)for(let i=st0;i<c.commands.length;i++){const k=c.commands[i];if(k?.kind!=='image'||!Array.isArray(k.points)||k.points.length<4)continue;if(k.owner&&k.owner.kind&&k.owner.kind!=='enemy')continue;const s2=String(k.sourcePath||k.image?.src||'');if(FX.test(s2))continue;const P=k.points,ar=Math.abs((P[1][0]-P[0][0])*(P[3][1]-P[0][1])-(P[1][1]-P[0][1])*(P[3][0]-P[0][0]));if(!fin||ar>fin.ar)fin={ar,flip:(P[1][0]-P[0][0])<0};}
   if(best&&fin){best.drawnFlip=best.flip;best.flip=fin.flip;}}catch(_){}
  window.__body=best;
  if(window.__noLabel)return r;// 디버그 화면: R444 디버그 글만 보이게
  try{const q=project(e.x,e.y);c.save();const g=e.attack&&Number.isFinite(e.attack.angle)?e.attack.angle:(e.rangedWindup>0&&Number.isFinite(e.rangedAim)?e.rangedAim:null);
   if(g!=null){c.lineWidth=3;c.strokeStyle='#ff3030';const t=project(e.x+Math.cos(g)*1.5,e.y+Math.sin(g)*1.5);c.beginPath();c.moveTo(q.x,q.y-4);c.lineTo(t.x,t.y-4);c.stroke();}
   c.textAlign='center';c.font='bold 15px sans-serif';const lab=g!=null?'판정 '+(Math.cos(g)-Math.sin(g)>0?'▶':'◀'):(window.__walkLabel||'');
   const hs=(player.x-player.y)-(e.x-e.y),hl=Math.abs(hs)<.3?'':'영웅 '+(hs>0?'▶':'◀');
   c.fillStyle='rgba(0,0,0,.55)';c.fillRect(q.x-70,q.y+10,140,hl?42:22);c.fillStyle='#ffe14d';if(lab)c.fillText(lab,q.x,q.y+26);if(hl){c.fillStyle='#8fe3ff';c.fillText(hl,q.x,q.y+46);}
   if(window.__tag){c.font='bold 16px sans-serif';c.fillStyle='rgba(0,0,0,.65)';c.fillRect(q.x-95,q.y-178,190,26);c.fillStyle='#ffffff';c.fillText(window.__tag,q.x,q.y-159);}
   c.restore();}catch(_){try{c.restore();}catch(__){}}
  return r;};});
await p.evaluate(([t,nl])=>{window.__tag=t;window.__noLabel=nl;},[caption||'',!!process.env.NOLABEL]);
// 같은 자리: 지역 입장 위치 둘레에서 사방 3.2칸이 빈 칸을 정해진 순서로 찾는다(두 실행 모두 같은 자리).
const info=await p.evaluate(src=>{const re=new RegExp(src);const L=room.enemies.filter(e=>e.hp>0&&re.test(e.name)&&e.spawnState==='active'&&!e.r75Tower&&!e.persona);const e=L[0];if(!e)return null;
 window.__E=e;e.__mark=true;player.hp=9e8;player.invincible=999;window.__others=[];for(const o of room.enemies)if(o!==e&&o.spawnState!=='hidden'){o.cd=99;window.__others.push([o,o.spawnState]);o.spawnState='hidden';}
 const free=(x,y)=>{for(let a=0;a<16;a++)for(const r of [.8,1.6,2.4,3.2]){if(blocked(x+Math.cos(a*Math.PI/8)*r,y+Math.sin(a*Math.PI/8)*r,.3))return false;}return !blocked(x,y,.3);};
 const sx=Math.round(player.x)+.5,sy=Math.round(player.y)+.5;let at=null;for(let R=0;R<=14&&!at;R++)for(let dx=-R;dx<=R&&!at;dx++)for(let dy=-R;dy<=R&&!at;dy++){if(Math.max(Math.abs(dx),Math.abs(dy))!==R)continue;if(free(sx+dx,sy+dy))at=[sx+dx,sy+dy];}
 if(!at)at=[Math.round(e.x)+.5,Math.round(e.y)+.5];e.x=at[0];e.y=at[1];e.homeX=e.x;e.homeY=e.y;player.x=e.x+1.6;player.y=e.y-1.6;
 return {name:e.name,ai:e.ai,range:e.combatProfile?.attackShape?.range,x:e.x,y:e.y,src:e.profile?.frames?.idle?.path};},nameRe);
console.log(tag,zone,scene,JSON.stringify(info));if(!info){await b.close();process.exit(2);}
await p.waitForTimeout(1500);
if(scene==='windup'){
 await p.evaluate(()=>{const e=window.__E;const ang=Math.atan2(player.y-.15-e.y,player.x-e.x);const ranged=e.ai==='ranged';window.__ranged=ranged;
  if(ranged){e.attack=null;e.rangedWindup=9;e.rangedAim=ang;}else{const shape=e.combatProfile.attackShape;e.attack={elapsed:0,angle:ang,committed:true,id:999999,origin154:Object.freeze({x:e.x,y:e.y}),shape154:Object.freeze({...shape,windup:9,active:.2,recovery:.3})};try{e.attack.footprint154=meleeFootprint154(e.attack);}catch(_){}e.state='attack';e.meleeStageQuality='windup';}
  const x0=e.x,y0=e.y,A=e.attack,aim=e.rangedAim;window.__ctl=()=>{e.x=x0;e.y=y0;e.cd=9;e.hitTimer=0;for(const [o] of window.__others)o.spawnState='hidden';if(ranged){e.rangedWindup=Math.max(e.rangedWindup,5);e.rangedAim=aim;}else if(e.attack!==A){e.attack=A;}cam={x:e.x,y:e.y};};
  player.x=e.x-1.6;player.y=e.y+1.6;window.__t0=time;});
 await p.waitForFunction(()=>time-window.__t0>=.9,null,{timeout:120000});
}else{
 const walk=await p.evaluate(()=>{const e=window.__E;e.attack=null;e.rangedWindup=0;e.state='idle';const x0=e.x,y0=e.y;
  const dirs=[[1,-1],[-1,1],[1,0],[0,-1],[-1,0],[0,1]].map(([a,b])=>{const n=Math.hypot(a,b);return[a/n,b/n];});let d=null;
  for(const [a,b] of dirs){let ok=true;for(let k=.3;k<=2.6;k+=.3)if(blocked(x0+a*k,y0+b*k,.3)){ok=false;break;}if(ok){d=[a,b];break;}}if(!d)d=dirs[0];
  const rg=+(e.combatProfile?.attackShape?.range)||1.2,D=Math.max(3.2,Math.min(7.4,rg+1.8));// R444 '영웅 곁 뒷걸음'(사거리+1.2칸 안) 밖, 옛 R93 '영웅 8칸 안이면 영웅 쪽' 안
  const right=(d[0]-d[1])>0;window.__walkLabel='걷는 쪽 '+(right?'▶':'◀');let k=0;
  window.__spd=e.speed;e.speed=0;// AI 걸음을 멈추고 정해진 길만 걷게 한다(엔진 걸음과 덧쓴 위치가 섞이지 않게)
  window.__ctl=dt=>{e.speed=0;e.attack=null;e.rangedWindup=0;e.cd=9;e.hitTimer=0;for(const [o] of window.__others)o.spawnState='hidden';k=Math.min(2.4,k+dt*1.1);e.x=x0+d[0]*k;e.y=y0+d[1]*k;player.x=x0-d[0]*D;player.y=y0-d[1]*D;cam={x:e.x,y:e.y};};
  window.__t0=time;return {dir:d,right,heroDist:D};});
 console.log(tag,'walkdir',JSON.stringify(walk));
 await p.evaluate(()=>{const e=window.__E;window.__tl=[];window.__tli=setInterval(()=>{const F=window.__STORYWORLD_ENEMY_FACE_R444__;const s=F?.state?.(e);window.__tl.push([+time.toFixed(2),+e.x.toFixed(2),+e.y.toFixed(2),s?s.side[0]+':'+s.owner+':'+(s.vx-s.vy).toFixed(2):'-',e.direction]);},100);});
 await p.waitForFunction(()=>time-window.__t0>=1.1,null,{timeout:120000});
 console.log(tag,'timeline',JSON.stringify(await p.evaluate(()=>{clearInterval(window.__tli);return window.__tl;})));
}
// 게임 시간을 멈추고(그리기는 계속) 같은 순간의 화면·몸 그림 뒤집힘·R444 상태를 남긴다.
if(!process.env.NOFREEZE){await p.evaluate(v=>{window.__SLOW=v;},+(process.env.SLOWSHOT||1e-4));await p.waitForTimeout(400);}// NOFREEZE: 멈추지 않음 · SLOWSHOT=0.05: 아주 느리게 걷는 채로 찍음(디버그 이동 화살표가 보이게)
const c=await p.evaluate(()=>{const e=window.__E,q=project(e.x,e.y);const cv=document.querySelector('canvas');const r=cv.getBoundingClientRect();
 return {x:r.left+q.x*r.width/cv.width,y:r.top+q.y*r.height/cv.height,body:window.__body,face:window.__STORYWORLD_ENEMY_FACE_R444__?.state?.(e)||null,ctlErr:window.__ctlErr||null,hero:(player.x-player.y)-(e.x-e.y)>0?'right':'left',
  aim:e.attack?.angle??(e.rangedWindup>0?e.rangedAim:null)};});
if(process.env.MOBILE)await p.screenshot({path:`${outDir}/s4m-${zone}-${scene}-${tag}.png`});else await p.screenshot({path:`${outDir}/s4-${zone}-${scene}-${tag}.png`,clip:{x:Math.max(0,Math.min(VP.width-480,c.x-240)),y:Math.max(0,Math.min(VP.height-300,c.y-215)),width:480,height:300}});
console.log(tag,'shot',JSON.stringify({...c,face:c.face&&{side:c.face.side,owner:c.face.owner}}));
await b.close();
