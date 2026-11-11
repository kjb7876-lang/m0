// R700 보스 그림 실측(헤드리스): 지역마다 보스를 불러 세우고 싸우게 둔 채, 게임 시간으로 일정 간격마다 보스 몸 그림 명령(최종 points)을 모은다.
// 기록: 그린 그림 경로, 화면 키(px), 그림 아래 끝과 발 기준점(project(e.x,e.y).y)의 차, 영웅 키. 그림마다 첫 장면을 잘라 저장(땅선 빨강).
// 실행: SW_URL=http://127.0.0.1:4410/m0/ node census.mjs <outDir> [zone,...]
import {chromium,boot,go} from '../r444/lib.mjs';
import fs from 'node:fs';
const [,,out='shots',zl='ep1b02,ep1b03,ep1b04,ep1b05,ep1b07,ep1b08']=process.argv;fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch();const {p}=await boot(b,{init:JSON.parse(process.env.INIT||'null')});const res={};
for(const z of zl.split(',')){
 await go(p,z);await p.waitForTimeout(1500);
 const info=await p.evaluate(()=>{const bs=room.enemies.filter(e=>e.boss&&!e.midboss);if(!bs.length)return null;
  try{room.activeEncounter='trial';summon3(bs,'boss');}catch(err){}
  const e=bs[0];e.spawnState='active';player.hp=9e8;player.maxHp=9e8;player.invincible=1e9;for(const o of room.enemies)if(o!==e&&o.hp>0)o.hp=0;
  e.x=player.x+2.2;e.y=player.y-2.2;window.__E=e;
  // 몸 그림 명령 기록
  if(!window.__hook){window.__hook=1;const FX=/r251\/atlas|pixelfx|\/fx|effect|vfx|ring|circle|sigil|shadow|aura|hexagram|blood|flame|r572|r571|r92\/boss|dissol|burn|r620\/bosses\/.*hit/i;
   const de=drawEnemy;drawEnemy=function(e,...a){const c=ctx,st0=Array.isArray(c?.commands)?c.commands.length:-1;const r=de.call(this,e,...a);
    if(e===window.__E&&st0>=0){let fin=null;for(let i=st0;i<c.commands.length;i++){const k=c.commands[i];if(k?.kind!=='image'||!Array.isArray(k.points)||k.points.length<4)continue;const s=String(k.sourcePath||k.image?.src||'');if(FX.test(s))continue;
      const P=k.points,ar=Math.abs((P[1][0]-P[0][0])*(P[3][1]-P[0][1])-(P[1][1]-P[0][1])*(P[3][0]-P[0][0]));if(!fin||ar>fin.ar)fin={ar,P:P.map(q=>[+q[0].toFixed(1),+q[1].toFixed(1)]),src:s.replace(/^.*\/m0\//,''),sr:k.sourceRect||null};}
     const q=project(e.x,e.y);window.__last={fin,gy:q.y,gx:q.x,phase:e.phase,att:!!e.attack,hp:e.hp};}
    return r;};}
  return {name:e.name,id:e.nativeId,phase:e.phase};});
 if(!info){res[z]=null;continue;}
 const seen={};const samples=[];
 for(let i=0;i<70;i++){
  const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+0.35,t0,{timeout:60000}).catch(()=>{});
  const s=await p.evaluate(()=>{const L=window.__last;const e=window.__E;if(e){e.hp=Math.max(e.hp,e.maxHp*.6);}return L&&L.fin?{...L,heroH:(()=>{try{return window.__STORYWORLD_COMBAT_FLOW_R425__?.inspect?.()?.heroH||null}catch(_){return null}})()}:null;});
  if(!s)continue;const P=s.fin.P,ys=P.map(q=>q[1]),xs=P.map(q=>q[0]);const top=Math.min(...ys),bot=Math.max(...ys);
  const key=s.fin.src+'#'+(s.fin.sr||[]).join(',');samples.push({src:key,h:+(bot-top).toFixed(1),bot:+bot.toFixed(1),gy:+s.gy.toFixed(1),phase:s.phase,att:s.att});
  if(!seen[key]){seen[key]=1;const pad=40,cl={x:Math.max(0,Math.min(...xs)-pad),y:Math.max(0,top-pad),w:Math.max(...xs)-Math.min(...xs)+pad*2,h:bot-top+pad*2};
   await p.evaluate(gy=>{const d=document.createElement('div');d.id='__gl';d.style.cssText=`position:fixed;left:0;right:0;top:${gy}px;height:2px;background:red;z-index:99999;pointer-events:none`;document.body.appendChild(d);},s.gy);
   await p.screenshot({path:`${out}/${z}-${Object.keys(seen).length}.png`,clip:{x:cl.x,y:cl.y,width:Math.min(1280-cl.x,cl.w),height:Math.min(720-cl.y,cl.h)}}).catch(err=>console.error(String(err).slice(0,120)));
   await p.evaluate(()=>document.getElementById('__gl')?.remove());}
 }
 res[z]={info,samples};console.log(z,info.name,Object.keys(seen).length,'arts');
}
fs.writeFileSync(`${out}/census.json`,JSON.stringify(res,null,1));await b.close();
