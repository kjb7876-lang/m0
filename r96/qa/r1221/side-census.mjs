// R1221 옆 이동 모션 전수(헤드리스): 지역마다 살아 있는 몹·보스를 12마리씩 영웅 둘레에 세우고 AI 걸음을 멈춘 채
//  화면 가로(왼쪽↔오른쪽)로만 게임 시간에 맞춰 왕복시킨다. 그동안 그린 몸 그림(원본 경로+칸)을 방향(왼/오)별로 모아
//  서로 다른 그림이 2장 이상이면 '옆 이동 모션 있음'. 1장이면 한 장이 미끄러지는 것(옆 이동 모션 없음).
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1221/side-census.mjs out.json [zone,zone…]
import {chromium,boot,go,skip} from '../r613/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2]||'side-census.json';const res=fs.existsSync(OUT)?JSON.parse(fs.readFileSync(OUT,'utf8')):{};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
let zones=process.argv[3]?process.argv[3].split(','):await p.evaluate(()=>window.__STORYWORLD_STORY_PROFILE_R54__.campaignOrder.slice());
await p.evaluate(()=>{const P=window.__sc={rows:new Map()};
 const FX=/r251\/atlas|pixelfx|\/fx\/|effect|vfx|ring|circle|sigil|shadow|aura|hexagram|blood|flame-fx|death|dissol|burn/i;
 let wraps=0,mineSC=null,dSC=0;function wrapSC(){if(drawEnemy===mineSC||wraps>=40)return;wraps++;const base=drawEnemy;const w=function(e,...a){const C=(typeof ctx!=='undefined'&&Array.isArray(ctx?.commands))?ctx.commands:null,st=C?C.length:-1;
  dSC++;try{return base.call(this,e,...a);}finally{dSC--;try{const W=window.__walk;if(dSC===0&&W&&e&&e.__sc&&e.hp>0&&C){let fin=null;
   for(let i=st;i<C.length;i++){const k=C[i];if(k?.kind!=='image'||!Array.isArray(k.points)||k.points.length<4)continue;const src=String(k.sourcePath||k.image?.src||'').replace(/^.*\/m0\//,'');if(!src||FX.test(src))continue;
    const Q=k.points,ar=Math.abs((Q[1][0]-Q[0][0])*(Q[3][1]-Q[0][1])-(Q[1][1]-Q[0][1])*(Q[3][0]-Q[0][0]));if(!fin||ar>fin.ar)fin={ar,src,rect:Array.isArray(k.sourceRect)?k.sourceRect.map(v=>Math.round(+v||0)).join(','):'',flip:(Q[1][0]-Q[0][0])<0};}
   if(!fin)return;const dir=e.__scDir;if(!dir)return;let r=P.rows.get(e.__sc);
   if(!r)P.rows.set(e.__sc,r={name:String(e.name||'').replace(/\s*\d+$/,''),nativeId:String(e.nativeId||''),zone:room.id,boss:!!(e.boss||e.midboss||e.persona),left:{},right:{},flipL:0,flipR:0,n:0});
   const key=fin.src+'|'+fin.rect;r[dir][key]=(r[dir][key]||0)+1;if(fin.flip)r[dir==='left'?'flipL':'flipR']++;r.n++;}}catch(err){window.__scErr=String(err).slice(0,200);}}};for(const k of Object.keys(base))try{w[k]=base[k];}catch(_){}w.__sc=true;drawEnemy=w;mineSC=w;window.__scMine=w;}wrapSC();
 // R974(move-dir)·R1029(float) 바꿔치기는 drawEnemy 맨 바깥에서 일어나고 스스로 다시 감싼다(최대 6번) → 이 기록기가 그보다 바깥에 오도록 매 틱 다시 감싼다
 const tb=tick;tick=function(dt,...a){const res=tb.call(this,dt,...a);try{wrapSC();}catch(_){}try{const W=window.__walk;if(W){player.hp=Math.max(player.hp,9e8);player.invincible=999;
   const L=room.enemies.filter(e=>e.hp>0);if(!W.list){W.list=L.slice();W.i=0;W.bt=time;}
   if(time-W.bt>=W.per){for(const e of W.list.slice(W.i,W.i+12))e.__sc=null;W.i+=12;W.bt=time;}W.done=W.i>=W.list.length;
   const p0=project(0,0),px=project(1,0),py=project(0,1);let hx=-(py.y-p0.y),hy=(px.y-p0.y);const s=(project(hx,hy).x-p0.x)>=0?1:-1;const m=Math.hypot(hx,hy)||1;hx*=s/m;hy*=s/m;// 화면 오른쪽 = 월드 (hx,hy)
   const B=W.list.slice(W.i,W.i+12);for(const e of room.enemies){if(!(e.hp>0))continue;e.speed=0;e.attack=null;e.rangedWindup=0;e.hitTimer=0;if(!B.includes(e)){e.x=player.x+30;e.y=player.y+30;}}
   B.forEach((e,j)=>{e.__sc=room.id+'#'+e.id;const gx=(j%4)-1.5,gy=Math.floor(j/4)-1;const cx=player.x+hx*gx*1.8+(-hy)*gy*1.6,cy=player.y+hy*gx*1.8+hx*gy*1.6;
    const u=(time-W.bt)/W.per,ph=Math.sin(u*Math.PI*4);const v=Math.cos(u*Math.PI*4);e.x=cx+hx*ph*.7;e.y=cy+hy*ph*.7;e.moving=true;e.vx=hx*v*2;e.vy=hy*v*2;e.moveDX=e.vx*dt;e.moveDY=e.vy*dt;e.__scDir=v>.25?'right':v<-.25?'left':null;
    e.direction=v>0?'right':'left';e.hidden=false;if(e.spawnState==='hidden'||e.spawnState==='dormant')e.spawnState='active';});}}catch(err){window.__scErr=String(err).slice(0,200);}return res;};});
for(const z of zones){if(res[z]?.rows)continue;try{await go(p,z);await p.evaluate(()=>{try{auto=false;guide=false;}catch(_){}window.__walk={per:2.4};});
 await p.waitForFunction(()=>window.__walk.done,null,{timeout:900000,polling:400});
 res[z]={rows:await p.evaluate(z=>[...window.__sc.rows.values()].filter(r=>r.zone===z),z),err:await p.evaluate(()=>window.__scErr||null),outer:await p.evaluate(()=>({sc:drawEnemy===window.__scMine,r974:window.__STORYWORLD_MOVE_DIR_R974__?.inspect?.()?.float})),n:await p.evaluate(()=>room.enemies.length)};
 await p.evaluate(()=>{window.__walk=null;});console.error(z,res[z].rows.length,res[z].n);}catch(err){res[z]={err:String(err).slice(0,200)};console.error(z,'ERR',res[z].err);}
 fs.writeFileSync(OUT,JSON.stringify(res));}
await b.close();
