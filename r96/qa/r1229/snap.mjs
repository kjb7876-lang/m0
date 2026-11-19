// R1229: 지역·이름 정규식의 적과 싸우는 장면을 몇 장 찍는다(헤드리스 소프트웨어 렌더)
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const [zone,re,out='/tmp/claude-0/r1229/snap',boss]=process.argv.slice(2);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await p.evaluate(()=>{player.hero='hunter';});await go(p,zone);
await p.evaluate(re=>{const R=new RegExp(re);const keep=room.enemies.filter(e=>R.test(e.name||''));for(const e of room.enemies)if(!keep.includes(e))e.hp=0;const e=keep[0];player.x=e.x+3.5;player.y=e.y+1;room.engaged=true;for(const k of keep){k.spawnState='active';k.visible=true;k.disabled=false;k.hp=k.maxHp=1e8;}setInterval(()=>{try{player.hp=maxHP();player.invincible=99;player.x=keep[0].x+3.5;player.y=keep[0].y+1;}catch(_){}},300);},re);
const t0=await p.evaluate(()=>time);
for(let i=0;i<6;i++){await p.waitForFunction(t=>time>=t,t0+1.5+i*1.3,{timeout:300000,polling:200});await p.screenshot({path:`${out}-${i}.png`});}
await b.close();
