// 모든 지역 보스·중간보스 실측: 그린 그림 경로·화면 키·자르기 저장
import {chromium,boot,go} from '../r444/lib.mjs';
import fs from 'node:fs';
const out=process.argv[2]||'cen';fs.mkdirSync(out,{recursive:true});
const only=process.argv[3]?process.argv[3].split(','):null;
const VW=+(process.env.VW||1280),VH=Math.round(VW*9/16);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:VW,height:VH},init:{'storyworld.r790.npc':'{"on":false}'}});
const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200))});
const zones=only||await p.evaluate(()=>Object.values(regions).map(r=>r.id));
const res=fs.existsSync(out+'/census.json')?JSON.parse(fs.readFileSync(out+'/census.json')):{};
for(const z of zones){ if(res[z]&&!only)continue;
 errs.length=0;
 try{await go(p,z);}catch(err){res[z]={err:String(err).slice(0,100)};continue;}
 await p.waitForTimeout(800);
 const list=await p.evaluate(()=>room.enemies.filter(e=>e.boss||e.midboss).map((e,i)=>({i:room.enemies.indexOf(e),name:e.name,id:e.nativeId,boss:!!e.boss,mid:!!e.midboss,hp:e.maxHp,spawn:e.spawnState})));
 const zr={list,bosses:[]};
 for(const it of list){
  await p.evaluate(ix=>{const e=room.enemies[ix];const bs=[e];
   try{room.activeEncounter='trial';summon3(bs,e.midboss&&!e.boss?'midboss':'boss');}catch(err){}
   e.spawnState='active';e.hidden=false;player.hp=9e8;player.maxHp=9e8;player.invincible=1e9;
   for(const o of room.enemies)if(o!==e&&o.hp>0){o.__park=1;o.x=-999;o.y=-999;o.speed=0;}
   e.x=player.x+2.2;e.y=player.y-1.6;window.__E=e;window.__last=null;
   if(!window.__hook){window.__hook=1;const FX=/r251\/atlas|pixelfx|\/fx|effect|vfx|ring|circle|sigil|shadow|aura|hexagram|blood|flame|r572|r571|dissol|burn/i;
    const de=drawEnemy;drawEnemy=function(e,...a){const c=ctx,st0=Array.isArray(c?.commands)?c.commands.length:-1;const r=de.call(this,e,...a);
     if(e===window.__E&&st0>=0){let fin=null;const all=[];for(let i=st0;i<c.commands.length;i++){const k=c.commands[i];if(k?.kind!=='image'||!Array.isArray(k.points)||k.points.length<4)continue;const s=String(k.sourcePath||k.image?.src||'').replace(/^.*\/m0\//,'');all.push(s);if(FX.test(s))continue;
       const P=k.points,ar=Math.abs((P[1][0]-P[0][0])*(P[3][1]-P[0][1])-(P[1][1]-P[0][1])*(P[3][0]-P[0][0]));if(!fin||ar>fin.ar)fin={ar,P:P.map(q=>[+q[0].toFixed(1),+q[1].toFixed(1)]),src:s,sr:k.sourceRect||null,alpha:k.alpha??k.globalAlpha??null,filter:k.filter||null};}
      const q=project(e.x,e.y);window.__last={fin,all,gy:q.y,gx:q.x,phase:e.phase,state:e.state,att:!!e.attack,hp:e.hp,hit:e.hitTimer||0};}
     return r;};}
  },it.i);
  const seen={};const samples=[];
  for(let k=0;k<14;k++){
   const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+0.4,t0,{timeout:40000}).catch(()=>{});
   const s=await p.evaluate(()=>{const e=window.__E;if(e){e.hp=Math.max(e.hp,e.maxHp*.7);if(e.x<-100){} }const L=window.__last;window.__last=null;return L;});
   if(!s||!s.fin){samples.push({none:true,all:s?.all||null});continue;}
   const SC=await p.evaluate(()=>{const c=document.querySelector('canvas');const r=c.getBoundingClientRect();return {sx:r.width/c.width,sy:r.height/c.height,ox:r.left,oy:r.top};});s.fin.P=s.fin.P.map(q=>[q[0]*SC.sx+SC.ox,q[1]*SC.sy+SC.oy]);s.gy=s.gy*SC.sy+SC.oy;
   const P=s.fin.P,ys=P.map(q=>q[1]),xs=P.map(q=>q[0]);const top=Math.min(...ys),bot=Math.max(...ys);
   const key=s.fin.src+'#'+(s.fin.sr||[]).join(',');
   samples.push({src:key,h:+(bot-top).toFixed(1),w:+(Math.max(...xs)-Math.min(...xs)).toFixed(1),bot:+bot.toFixed(1),gy:+s.gy.toFixed(1),state:s.state,phase:s.phase,att:s.att,hit:s.hit,alpha:s.fin.alpha,filter:s.fin.filter,flip:P[1][0]<P[0][0]});
   if(!seen[key]&&Object.keys(seen).length<6){seen[key]=1;const pad=60;const x=Math.max(0,Math.min(...xs)-pad),y=Math.max(0,top-pad);
    const fn=`${out}/${z}-${it.id||it.i}-${Object.keys(seen).length}.png`;
    await p.screenshot({path:fn,clip:{x,y,width:Math.max(10,Math.min(VW-x,Math.max(...xs)-Math.min(...xs)+pad*2)),height:Math.max(10,Math.min(VH-y,bot-top+pad*2))}}).catch(()=>{});}
  }
  zr.bosses.push({...it,samples,arts:Object.keys(seen)});
  await p.evaluate(()=>{const e=window.__E;if(e){e.x=-999;e.y=-999;e.speed=0;}});
 }
 zr.errs=[...new Set(errs)].slice(0,8);
 res[z]=zr;fs.writeFileSync(out+'/census.json',JSON.stringify(res,null,1));
 console.log(z,list.map(x=>x.id+':'+x.name).join(' | '));
}
await b.close();
