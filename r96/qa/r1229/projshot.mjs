// R1229: 적 탄이 날아가는 순간 그 자리 화면을 잘라 찍는다
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const [zone,re,out]=process.argv.slice(2);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await p.evaluate(()=>{player.hero='hunter';});await go(p,zone);
await p.evaluate(re=>{const R=new RegExp(re);const keep=room.enemies.filter(e=>R.test(e.name||''));for(const e of room.enemies)if(!keep.includes(e))e.hp=0;for(const k of keep.slice(1))k.hp=0;const e=keep[0];player.x=e.x+5;player.y=e.y+1;room.engaged=true;e.spawnState='active';e.visible=true;e.hp=e.maxHp=1e8;setInterval(()=>{try{player.hp=maxHP();player.invincible=99;}catch(_){}},300);window.__keepTick=tick;},re);
for(let i=0;i<4;i++){
 await p.waitForFunction(()=>(projectiles||[]).some(x=>!x.friendly&&x.age>.15),null,{timeout:300000,polling:50});
 await p.evaluate(()=>{const t=tick;window.__slow=t;tick=function(dt,...a){return t.call(this,dt*1e-4,...a);};});await p.waitForTimeout(400);
 const q=await p.evaluate(()=>{const pr=projectiles.find(x=>!x.friendly&&x.age>.15);const q=project(pr.x,pr.y);const c=document.querySelector('#game');const r=c.getBoundingClientRect();return {x:q.x*r.width/(c.width/devicePixelRatio)/ (devicePixelRatio||1)*1, y:q.y, W:c.width,cw:r.width,asset:String(pr.asset?.src||pr.asset)};});
 console.log(JSON.stringify(q));await p.screenshot({path:`${out}-${i}.png`});
 await p.evaluate(()=>{tick=window.__slow;});await p.waitForTimeout(1500);}
await b.close();
