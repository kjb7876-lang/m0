// R1393b 3D 몹 크기 비율·걷기 방향·공격 방향 실측(헤드리스).
//  크기: 같은 장면 2D 몸 그림 화면 키(명령 사각형 높이) vs 3D 화면 키(measure h) vs 영웅 키.  방향: 걷는 중 yaw 와 실제 이동 방향 차, 공격 중 yaw 와 영웅 쪽 차.
// 사용: SW_URL=... node motion.mjs <out.json> zone ...
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2],ZONES=process.argv.slice(3),WALK=process.env.R93_WALK==='1';const res={};
const b=await chromium.launch();const nc=b.newContext.bind(b);b.newContext=async o=>{const c=await nc(o);await c.addInitScript(()=>{Object.defineProperty(Navigator.prototype,'webdriver',{get:()=>false});});return c;};
const {p}=await boot(b,{vp:{width:640,height:360},init:{'storyworld.r619.videopause':'{"on":false}','storyworld.r1036.entryvideo':'{"on":false}','storyworld.r309.opening':'{"on":false}','storyworld.r372.rootgate':'{"on":false}'}});
await p.evaluate(()=>{window.__H2D=new Map();window.__VF=new Map();const r=window.__STORYWORLD_PHASE1__.controller.state.three;const base=r.render;
 r.render=function(frame){try{for(const c of frame?.commands||[]){if(c?.kind!=='image'||c.owner?.kind!=='enemy'||c.owner.r350||!Array.isArray(c.points)||c.points.length!==4)continue;const id=String(c.owner.id||'');const h=(Math.hypot(c.points[3][0]-c.points[0][0],c.points[3][1]-c.points[0][1]));if(h>10){let f=1;try{const im=c.image,sr=c.sourceRect;if(im&&Array.isArray(sr)){const key=(im.src||im.__storyworldStaticSource?.path||'')+sr.join(',');let v=window.__VF.get(key);if(v===undefined){const [sx,sy,sw,sh]=sr.map(Math.round);const cv=document.createElement('canvas');cv.width=sw;cv.height=sh;const g=cv.getContext('2d',{willReadFrequently:true});g.drawImage(im,sx,sy,sw,sh,0,0,sw,sh);const d=g.getImageData(0,0,sw,sh).data;let t=-1,bt=-1;for(let y=0;y<sh&&t<0;y++)for(let x=0;x<sw;x++)if(d[(y*sw+x)*4+3]>115){t=y;break;}for(let y=sh-1;y>=0&&bt<0;y--)for(let x=0;x<sw;x++)if(d[(y*sw+x)*4+3]>115){bt=y;break;}v=t>=0?(bt-t+1)/sh:null;window.__VF.set(key,v);}if(v)f=v;}}catch(_){}window.__H2D.set(id,h*f);}}}catch(_){}return base.apply(this,arguments);};
 for(const k of Object.keys(base))try{r.render[k]=base[k];}catch(_){}});
for(const z of ZONES){try{await go(p,z);
 await p.evaluate(()=>{player.hp=player.maxHp=1e9;player.invincible=1e9;let i=0;for(const e of room.enemies){if(!(e.hp>0))continue;if(i<8){e.spawnState='active';e.hidden=false;e.engaged=true;e.hp=e.maxHp=1e8;const a=i/8*Math.PI*2;e.x=player.x+Math.cos(a)*4;e.y=player.y+Math.sin(a)*4;e.__home={x:e.x,y:e.y};}else{e.x=player.x+300;e.y=player.y+300;e.speed=0;}i++;}window.__H2D.clear();window.__PV=new Map();});
 const t0=Date.now();const S={};
 while(Date.now()-t0<(WALK?40000:60000)){await p.waitForTimeout(400);await skip(p);
  if(WALK)await p.evaluate(()=>{for(const e of room.enemies){if(!(e.hp>0)||!e.__home)continue;if(Math.hypot(e.x-player.x,e.y-player.y)<1.4){e.x=e.__home.x;e.y=e.__home.y;window.__PV.delete(String(e.id));window.__PV.delete('enemy:'+e.id);}}});
  if(!WALK&&Date.now()-t0>20000)await p.evaluate(()=>{for(const e of room.enemies){if(!(e.hp>0)||Math.hypot(e.x-player.x,e.y-player.y)>8)continue;if(!e.__r93){e.__r93=1;const a=Math.random()*6.28;e.x=player.x+Math.cos(a)*1.1;e.y=player.y+Math.sin(a)*1.1;}if(e.attackCooldown>0.3)e.attackCooldown=0.3;if(e.cooldown>0.3)e.cooldown=0.3;}});
  const snap=await p.evaluate(()=>{const M=Object.keys(window).filter(k=>/^__STORYWORLD_(MOB3D|BOSS3D|BALROG3D)_R1/.test(k));const out=[];const hero=typeof actorHeight==='function'?actorHeight():null;const tm=typeof time==='number'?time:0;
   const ids3=new Set();
   for(const k of M){let I;try{I=window[k].inspect?.();}catch(_){continue;}for(const i of I?.instances||[]){if(!i.visible)continue;ids3.add(String(i.id));
    const e=room.enemies.find(e=>String(e.id)===String(i.id)||('enemy:'+e.id)===String(i.id));if(!e)continue;let m=null;try{m=window[k].measure?.(i.id);}catch(_){}
    const pv=window.__PV.get(i.id);window.__PV.set(i.id,{x:e.x,y:e.y,t:tm});let mv=null;if(pv&&tm>pv.t){const dx=e.x-pv.x,dy=e.y-pv.y;if(Math.hypot(dx,dy)>.04)mv=Math.atan2(dx,dy);}
    out.push({d:3,kind:i.kind,name:e.name,pose:i.pose,yaw:i.yaw,hero:Math.atan2(player.x-e.x,player.y-e.y),mv,h3:m?.h??null,h2:window.__H2D.get('enemy:'+e.id)??window.__H2D.get(String(e.id))??null,heroH:hero,boss:!!e.boss});}}
   for(const e of room.enemies){if(!(e.hp>0)||ids3.has(String(e.id))||ids3.has('enemy:'+e.id))continue;const h=window.__H2D.get('enemy:'+e.id)??window.__H2D.get(String(e.id));if(h&&Math.hypot(e.x-player.x,e.y-player.y)<12)out.push({d:2,name:e.name,h2:h,heroH:hero,boss:!!e.boss});}
   return out;});
  const ang=(a,b)=>{let d=Math.abs(a-b)%(2*Math.PI);if(d>Math.PI)d=2*Math.PI-d;return d*180/Math.PI;};
  for(const s of snap){const key=s.d+'|'+(s.kind||s.name.replace(/\s*\d+$/,''));const r=S[key]=S[key]||{d:s.d,kind:s.kind,name:s.name,boss:s.boss,h2:[],h3:[],rel:[],walkDev:[],atkDev:[],poses:{}};
   if(s.h2)r.h2.push(s.h2);if(s.h3>4)r.h3.push(s.h3);const hv=s.d===3?(s.h3>4?s.h3:null):s.h2;if(hv&&s.heroH)r.rel.push(hv/s.heroH);
   if(s.d===3){r.poses[s.pose]=(r.poses[s.pose]||0)+1;if(Number.isFinite(s.yaw)){if(s.pose==='walk'&&s.mv!=null)r.walkDev.push(ang(s.yaw,s.mv));if(s.pose==='attack')r.atkDev.push(ang(s.yaw,s.hero));}}}
 }
 const med=a=>{if(!a.length)return null;const s=[...a].sort((x,y)=>x-y);return +s[s.length>>1].toFixed(2);};const p90=a=>{if(!a.length)return null;const s=[...a].sort((x,y)=>x-y);return +s[Math.floor(s.length*.9)].toFixed(1);};
 res[z]=Object.values(S).map(r=>({d:r.d,kind:r.kind,name:r.name,boss:r.boss,h2:med(r.h2),h3:med(r.h3),relHero:med(r.rel),walkN:r.walkDev.length,walkDevMed:med(r.walkDev),walkDevP90:p90(r.walkDev),atkN:r.atkDev.length,atkDevMed:med(r.atkDev),atkDevP90:p90(r.atkDev),poses:r.poses}));
 console.log(z,JSON.stringify(res[z]));fs.writeFileSync(OUT,JSON.stringify(res,null,1));
}catch(e){console.log('ERR',z,String(e).slice(0,200));}}
await b.close();
