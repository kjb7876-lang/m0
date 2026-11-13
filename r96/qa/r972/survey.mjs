// R972 조사: 영웅마다 Q·W·E·R 를 눌러 hitEnemy 로 들어오는 출처(source)·호출 파일을 모은다.
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360},init:{'storyworld.r663.skillgrowth':'{"on":false}'}});
await go(p,process.env.ZONE||'dist00');if(process.env.DIRECT)await p.evaluate(()=>{window.__DIRECT=1;});
await p.evaluate(()=>{window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};
 window.__log=[];const base=hitEnemy;hitEnemy=function(e,v,src,...a){try{const st=String(new Error().stack).split('\n').slice(2,7).map(l=>(l.match(/([a-z0-9-]+\.js|index\.html)/)||[''])[0]).join('>');
  window.__log.push({hero:player.hero,key:window.__key,v:Math.round(v),kind:src?.kind||'',ak:src?.attackKind9||'',slot:src?.sourceSlot||'',id:String(src?.attackId9||'').slice(0,30),st,mid:Object.keys(src||{}).filter(k=>/^r\d|story|rc/.test(k)).join(',')});}catch(_){}
  return base.call(this,e,v,src,...a);};});
const heroes=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner'];
const out={};
for(const h of heroes){
 await p.evaluate(async h=>{await ensureImages(heroPaths(h));player.hero=h;player.hp=player.maxHp=99999;},h);
 for(const k of (process.env.KEYS||'q,w,e,r').split(',')){
  await p.evaluate(k=>{const live=room.enemies.filter(e=>!e.boss).slice(0,10);room.enemies.filter(e=>!live.includes(e)).forEach(e=>{e.hp=0;e.dead=true;});
   live.forEach((e,i)=>{const a=i*2.4,r=1.2+i*.3;e.x=player.x+Math.cos(a)*r;e.y=player.y+Math.sin(a)*r;e.dead=false;e.spawnState='active';e.hp=e.maxHp=99999;e.damage=0;e.speed=0;});
   room.engaged=true;player.specialCD=0;if(player.storyWER)player.storyWER.ready={};window.__log=[];window.__key=k;
   window.__castRet=null;if(window.__DIRECT&&k!=='q'){window.__castRet=window.__STORYWORLD_WER__.cast(k);return;}const code='Key'+k.toUpperCase();window.dispatchEvent(new KeyboardEvent('keydown',{key:k,code,bubbles:true}));setTimeout(()=>window.dispatchEvent(new KeyboardEvent('keyup',{key:k,code,bubbles:true})),80);},k);
  if(process.env.DIRECT)await p.evaluate(()=>{});const t0=await p.evaluate(()=>time);await p.waitForFunction(t0=>time-t0>=3.5,t0,{timeout:120000});
  const log=await p.evaluate(()=>window.__log);
  const agg={};for(const r of log){const kk=[r.kind,r.ak,r.slot,r.mid,r.st].join('|');(agg[kk]||(agg[kk]={n:0,sum:0,ex:r.id}));agg[kk].n++;agg[kk].sum+=r.v;}
  out[h+':'+k]=agg;console.log(h,k,log.length,await p.evaluate(()=>window.__castRet),JSON.stringify(agg));
 }}
import fs from 'node:fs';fs.writeFileSync(process.env.OUT||'/tmp/claude-0/survey.json',JSON.stringify(out,null,1));
await b.close();
