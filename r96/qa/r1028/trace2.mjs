import {chromium,boot,go} from '../r444/lib.mjs';
const z=process.argv[2]||'dist01',secs=+process.argv[3]||12,out=process.argv[4];
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});await go(p,z);
await p.evaluate(G=>{const B=room.enemies.filter(e=>e.hp>0&&(e.boss||e.midboss));const tgt=B.find(e=>e.midboss)||B[0];window.__tgt=tgt;
 for(const e of room.enemies)if(e!==tgt&&!(e.boss||e.midboss))e.hp=0;tgt.hp=tgt.maxHp=1e7;tgt.spawnState='active';
 for(let j=0;j<16;j++){const a=j*Math.PI/8;const tx=tgt.x+Math.cos(a)*3.5,ty=tgt.y+Math.sin(a)*3.5;if(!blocked(tx,ty,.3)){player.x=tx;player.y=ty;break;}}room.engaged=true;auto=true;guide=false;
 window.__rows=[];window.__t0=time;window.__G=G;const tb=tick;tick=function(...a){player.invincible=999;player.hp=9e8;return tb.apply(this,a);};
 let cur=null;const M=window.__STORYWORLD_MEDICAL_R49__,R51=window.__STORYWORLD_ENEMY_MOTION_R51__;
 // 엔진 drawEnemy 는 전역 객체를 그때그때 읽으므로 바꿔 끼워 기록
 window.__STORYWORLD_MEDICAL_R49__=Object.freeze({...M,bossFlip(e,f){const r=M.bossFlip(e,f);if(e===cur)cur.__log.push('bossFlip('+f+')='+r);return r;}});
 window.__STORYWORLD_ENEMY_MOTION_R51__=Object.freeze({...R51,flip(e,fr,fb){const r=R51.flip(e,fr,fb);if(e===cur)cur.__log.push('r51('+fb+',flags='+Object.keys(fr||{}).filter(k=>/^r\d|flip|Pose|Frame/.test(k)).join('+')+',fflip='+fr?.flip+',pf='+window.__STORYWORLD_ENEMY_FACE_R444__.poseFlip(e,fr)?.flip+',baked='+fr?.assetFrame?.bakedFacing+',ang='+(fr?.r54Angle??0).toFixed(2)+',dir='+e.direction+',atk='+(e.attack?(e.attack.r442?'fake':'real')+e.attack.angle?.toFixed(2):'-')+',sk='+window.__STORYWORLD_ENEMY_SKILL_POSE_R442__.angle(e)?.toFixed?.(2)+',r61='+(e.r61Action&&time<e.r61Action.endAt?e.r61Action.angle?.toFixed(2):'-')+')='+r);return r;}});
 const da=drawAssetFrame3;drawAssetFrame3=function(path,fr,x,y,h,opt){if(cur)cur.__log.push('daf3 flip='+opt?.flip+' '+String(path).slice(-22));return da.apply(this,arguments);};
 const sp=sprite;sprite=function(path,x,y,h,opt){if(cur)cur.__log.push('sprite flip='+opt?.flip+' '+String(path).slice(-22));return sp.apply(this,arguments);};
 const base=drawEnemy;drawEnemy=function(e,...a){if(e!==window.__tgt)return base.call(this,e,...a);cur=e;e.__log=[];const st0=ctx.commands.length;
  try{return base.call(this,e,...a);}finally{cur=null;let fin=null;for(let i=st0;i<ctx.commands.length;i++){const k=ctx.commands[i];if(k?.kind==='image'&&/r104\/bosses/.test(String(k.sourcePath||k.image?.src||''))&&k.points){fin=(k.points[1][0]-k.points[0][0])<0;}}
   const s=window.__STORYWORLD_ENEMY_FACE_R444__.state(e);window.__rows.push({t:+time.toFixed(2),fin,side:s?.side,own:s?.owner,rw:e.rangedWindup>0,aim:e.rangedAim,log:e.__log.join(' / ')});}};},secs);
await p.waitForFunction(()=>time-window.__t0>=window.__G,null,{timeout:900000,polling:500});
(await import('node:fs')).writeFileSync(out,JSON.stringify(await p.evaluate(()=>window.__rows)));await b.close();
