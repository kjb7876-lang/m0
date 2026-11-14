// R1031 후속: 불면귀(last303) 그리기 명령 중 옛 그림(bulmyeongwi_attack 등)이 남는 프레임을 기록하고, 처음 몇 번은 그 순간 화면을 찍는다.
// node oldart-probe.mjs <게임초> <out.json> [shotDir]
import {chromium,boot,go} from '../r444/lib.mjs';
const secs=+process.argv[2]||30,outFile=process.argv[3]||'oa.json',shotDir=process.argv[4]||null;const VP=(process.env.VP||'640x360').split('x').map(Number);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:VP[0],height:VP[1]}});
for(const z of (process.env.SEQ||'last303').split(',')){await go(p,z);await p.waitForTimeout(3000);}
await p.evaluate(()=>{const P=window.__oa={rows:[],freeze:0};const OLD=/bulmyeongwi_(idle|attack|rain|transition)\.webp/i;
 const base=drawEnemy;drawEnemy=function(e,...a){if(!e||!(e.hp>0)||!e.boss||!ctx)return base.call(this,e,...a);const c=ctx,st0=Array.isArray(c.commands)?c.commands.length:-1;
  try{return base.call(this,e,...a);}finally{try{const L=[];let old=false;for(let i=st0;i<c.commands.length;i++){const k=c.commands[i];if(k?.kind!=='image'||!Array.isArray(k.points)||k.points.length<4)continue;
     const src=String(k.sourcePath||k.image?.src||'').replace(/^.*\/m0\//,'');const Q=k.points;const o=OLD.test(src);old=old||o;
     L.push({src:src.replace(/^.*\//,''),old:o,g620:!!k.r620Ghost,g760:!!k.r760Ghost,a:+(k.style?.globalAlpha??1).toFixed(2),flip:(Q[1][0]-Q[0][0])<0,h:+Math.abs(Q[3][1]-Q[0][1]).toFixed(0),w:+Math.abs(Q[1][0]-Q[0][0]).toFixed(0),keys:Object.keys(k).filter(x=>/^r\d|ghost|Ghost/.test(x)).join(',')});}
    const s=window.__STORYWORLD_ENEMY_FACE_R444__?.state?.(e);
    if(old)P.rows.push({t:+time.toFixed(3),side:s?.side,att:e.attack?{el:+(e.attack.elapsed||0).toFixed(2),fake:!!e.attack.storyWorldPose5}:null,r61:e.r61Action?.kind||null,sa5:+(e.storyAttackUntil5-time||0).toFixed(2),L});}catch(err){window.__oaerr=String(err);}}};
 player.invincible=999;player.hp=9e8;auto=true;guide=false;
 const B=room.enemies.find(e=>e.hp>0&&e.boss);window.__bid=B?.id;if(B){B.hp=B.maxHp=Math.max(B.maxHp||1,1e7);B.spawnState='active';room.engaged=true;for(const e of room.enemies)if(e!==B&&!e.boss)e.hp=0;for(let j=0;j<16;j++){const a=j*Math.PI/8;const tx=B.x+Math.cos(a)*3.5,ty=B.y+Math.sin(a)*3.5;if(!blocked(tx,ty,.3)){player.x=tx;player.y=ty;break;}}}
 window.__t0=time;const tb=tick;tick=function(dt,...a){player.hp=Math.max(player.hp,9e8);return tb.call(this,dt,...a);};});
let shots=0;const t0=Date.now();
while(true){const st=await p.evaluate(()=>({t:time-window.__t0,n:window.__oa.rows.length}));if(st.t>=secs)break;
 if(shotDir&&shots<4&&st.n>0){const last=await p.evaluate(()=>window.__oa.rows[window.__oa.rows.length-1]);if(last&&!last.__shot){await p.screenshot({path:`${shotDir}/oa-${shots}-${last.t}.png`});await p.evaluate(()=>{window.__oa.rows[window.__oa.rows.length-1].__shot=1;});shots++;}}
 await p.waitForTimeout(150);if(Date.now()-t0>1.8e6)break;}
(await import('node:fs')).writeFileSync(outFile,JSON.stringify({rows:await p.evaluate(()=>window.__oa.rows),err:await p.evaluate(()=>window.__oaerr||null)}));await b.close();
