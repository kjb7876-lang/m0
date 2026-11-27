import {chromium,boot,go,skip} from '../r444/lib.mjs';
const ZONES=(process.env.ZONES).split(','),SECS=+(process.env.SECS||30);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
for(const z of ZONES){try{await go(p,z);}catch(e){console.log(z,'go fail');continue;}
const r=await p.evaluate(async([secs])=>{auto=false;guide=false;command=null;route=[];
 const ms=room.enemies.filter(e=>e.hp>0&&(e.boss||e.midboss||e.persona||/중간보스/.test(e.name||''))).slice(0,2);
 if(!ms.length)return {zone:room.id,none:true};
 const B=ms[0];player.x=B.x+5;player.y=B.y;try{if(typeof blocked==='function'&&blocked(player.x,player.y,.3,room)){player.x=B.x-5;}}catch(_){}
 room.enemies.filter(e=>!ms.includes(e)).forEach(e=>{e.hp=0;e.spawnState='dead';});ms.forEach(e=>{e.hp=e.maxHp=1e9;e.spawnState='active';e.hidden=false;});room.engaged=true;
 const hits=[];const px=player.x,py=player.y,t0=time;
 for(const e of ms){let X=e.x,Y=e.y,lt=time,lx=X,ly=Y;
  const chk=(nx,ny)=>{};
  Object.defineProperty(e,'x',{get(){return X;},set(v){if(Math.abs(v-X)>.12&&hits.length<40)hits.push({n:e.name,t:+(time-t0).toFixed(2),d:+(v-X).toFixed(2),st:new Error().stack.split('\n').slice(2,6).map(s=>s.trim().replace(/^at /,'').replace(/https?:\/\/[^/]+\/m0\//,'').replace(/\(([^)]*)\)/,'$1')).join(' < ')});X=v;},configurable:true,enumerable:true});
  Object.defineProperty(e,'y',{get(){return Y;},set(v){if(Math.abs(v-Y)>.12&&hits.length<40)hits.push({n:e.name,t:+(time-t0).toFixed(2),d:+(v-Y).toFixed(2),st:new Error().stack.split('\n').slice(2,6).map(s=>s.trim().replace(/^at /,'').replace(/https?:\/\/[^/]+\/m0\//,'').replace(/\(([^)]*)\)/,'$1')).join(' < ')});Y=v;},configurable:true,enumerable:true});}
 await new Promise(r=>{const f=()=>{player.hp=player.maxHp=1e9;player.invincible=99;player.x=px;player.y=py;if(time>t0+secs)r();else setTimeout(f,30);};f();});
 // 출처별 묶기
 const by={};for(const h of hits){const k=h.st.split(' < ')[0].replace(/:\d+$/,'');by[k]=(by[k]||0)+1;}
 return {zone:room.id,mobs:ms.map(e=>e.name),by,sample:hits.slice(0,6)};},[SECS]);
console.log(JSON.stringify(r).slice(0,2500));}
await b.close();
