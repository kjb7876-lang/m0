// R601 헤드리스 실측: 실제 게임에서 몹 하나에 엔진과 같은 꼴의 근접 공격(e.attack)을 걸고, 게임 시간을 거의 멈춘 채
// 실제 경과 t 를 바꿔 가며 drawEnemy 가 그린 몸 그림(가장 큰 그림의 경로·잘라 낸 칸)을 R601 켬/끔으로 모은다.
// 기대: 켬(t) 의 칸 = 끔(visual(t)) 의 칸, 판정 순간 t=W 의 칸 = 끔(W) 의 칸, 예고 함수는 실제 시간(telegraphReal 증가).
// 실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r601/tempo-frames.mjs <zone> [maxMobs] [outJson]
import fs from 'node:fs';import {chromium,boot,go} from '../r444/lib.mjs';
const [,,zone='ep1a08',maxMobs='6',out='/tmp/r601-frames.json']=process.argv;
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});await go(p,zone);await p.waitForTimeout(2000);
const res=await p.evaluate(async(maxMobs)=>{
 const FX=/r251\/atlas|pixelfx|\/fx|effect|vfx|ring|circle|sigil|shadow|glow|mark|hexagram|aura/i;
 const tb=tick;window.__SLOW=1e-4;tick=function(dt,...a){return tb.call(this,dt*window.__SLOW,...a);};
 let rec=null;const de=drawEnemy;drawEnemy=function(e,...a){if(!e||e!==window.__tgt||!ctx)return de.call(this,e,...a);
  const c=ctx,own=Object.prototype.hasOwnProperty.call(c,'drawImage')?c.drawImage:null,f=c.drawImage;let best=null;
  c.drawImage=function(img,...q){try{let dw,dh,sx=0,sy=0;if(q.length>=8){sx=q[0];sy=q[1];dw=q[6];dh=q[7];}else if(q.length>=4){dw=q[2];dh=q[3];}else{dw=img?.width||0;dh=img?.height||0;}
   const src=String(img?.currentSrc||img?.src||img?.__path||(img?.width+'x'+img?.height)).replace(/^.*\/m0\//,'');const area=Math.abs(dw*dh);
   if(!FX.test(src)&&(!best||area>best.area))best={area,key:src.slice(-60)+'@'+Math.round(sx)+','+Math.round(sy)};}catch(_){}return f.apply(this,arguments);};
  try{return de.call(this,e,...a);}finally{if(own)c.drawImage=own;else delete c.drawImage;rec=best?best.key:null;}};
 const api=window.__STORYWORLD_ATTACK_TEMPO_R601__;const frame=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 const mobs=room.enemies.filter(e=>e.hp>0&&!e.boss&&e.combatProfile?.attackShape).slice(0,+maxMobs);const rows=[];
 for(const e of mobs){const sh=e.combatProfile.attackShape,W=sh.windup,A=sh.active,R=sh.recovery,tot=W+A+R;
  // 몹을 영웅 곁(화면 안)으로 옮기고 AI 가 공격을 지우지 못하게 매 그리기 전에 다시 건다
  e.x=player.x+1.2;e.y=player.y+.4;window.__tgt=e;
  const atk={elapsed:0,angle:Math.atan2(player.y-.15-e.y,player.x-e.x),committed:true,id:999000+rows.length,origin154:{x:e.x,y:e.y},shape154:Object.freeze({...sh})};try{atk.footprint154=meleeFootprint154(atk);}catch(_){}
  const at=async(t,on)=>{api.set('on',on);e.attack=atk;atk.elapsed=t;e.hitTimer=0;e.flash=0;await frame();e.attack=atk;atk.elapsed=t;await frame();return rec;};
  const ts=[];for(let i=0;i<=16;i++)ts.push(+(tot*i/16).toFixed(4));ts.push(W);ts.push(+(W-.01).toFixed(4));
  const r={id:e.id,nativeId:e.nativeId,name:e.name,W,A,R,samples:[]};const tr0=api.inspect().stats.telegraphReal;
  for(const t of ts){const v=api.visual(t,W,A,R);const onK=await at(t,true),offV=await at(v,false),offT=await at(t,false);r.samples.push({t,v,on:onK,offAtV:offV,offAtT:offT});}
  r.telegraphReal=api.inspect().stats.telegraphReal-tr0;api.set('on',true);delete e.attack;rows.push(r);}
 return {zone:room.id,rows,inspect:api.inspect()};},maxMobs);
fs.writeFileSync(out,JSON.stringify(res,null,1));
let match=0,total=0,strike=0,strikeN=0,changed=0;
for(const r of res.rows){for(const s of r.samples){if(!s.on)continue;total++;if(s.on===s.offAtV)match++;if(s.on!==s.offAtT)changed++;if(Math.abs(s.t-r.W)<1e-6){strikeN++;if(s.on===s.offAtT)strike++;}}}
console.log(JSON.stringify({zone:res.zone,mobs:res.rows.map(r=>r.nativeId||r.name),samples:total,onEqualsOffAtVisual:match,differsFromOldAtSameT:changed,strikeFrameSameAsOld:strike+'/'+strikeN,telegraphReal:res.rows.map(r=>r.telegraphReal),errors:res.inspect.stats.errors,lastError:res.inspect.lastError}));
await b.close();
