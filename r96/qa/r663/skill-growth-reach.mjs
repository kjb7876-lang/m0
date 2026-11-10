// R663 범위 실측(헤드리스): 전투 지역에서 몹을 고리 모양(거리 2~12)으로 세우고 Q 를 쏴서 맞은 몹의 최대 거리를 1단계 vs 7단계로 비교. 영웅마다 Q 가 달라 영웅별로 표를 낸다.
import {chromium,boot,skip} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await p.evaluate(()=>enterRegion('dist01',null,{layer:'DREAM',restore:true}));await p.waitForFunction(()=>!loading&&layer==='DREAM',null,{timeout:150000});await skip(p);
const heroes=process.env.HEROES?process.env.HEROES.split(','):[null];const out={};
for(const h of heroes){
 if(h)await p.evaluate(h=>{if(typeof setHero==='function')setHero(h);else player.hero=h;},h);
 const row={};
 for(const r of [1,4,7]){
  row[r]=await p.evaluate(async r=>{window.__STORYWORLD_PROGRESSION_R62__.state(player).ranks.skillQR663=r;auto=false;guide=false;player.hp=player.maxHp=99999;
   const hits=new Map();const base=hitEnemy;hitEnemy=function(e,...a){if(e&&player)hits.set(e,Math.hypot(e.x-player.x,e.y-player.y));return base.apply(this,[e,...a]);};
   const live=room.enemies.filter(e=>e.hp>0).slice(0,40);live.forEach((e,i)=>{const a=i/live.length*Math.PI*2,d=2+(i%10)*1.1;e.x=player.x+Math.cos(a)*d;e.y=player.y+Math.sin(a)*d;e.hp=e.maxHp=99999;e.damage=0;e.spawnState='active';e.speed=0;});
   room.engaged=true;player.specialCD=0;player.x=player.x;special();
   await new Promise(res=>{const t0=time;const f=()=>time>=t0+2.5?res():setTimeout(f,30);f();});hitEnemy=base;
   const ds=[...hits.values()];return{n:live.length,hit:hits.size,max:ds.length?Math.max(...ds):0,hero:player.hero};},r);
 }
 out[h||'current']=row;
}
console.log(JSON.stringify(out));await b.close();
