// R1329 조사(일반): node r1329-survey2.mjs <zone> <정규식...> — 몹 이름 목록과 각 대상의 2D 그림 경로, 화면 캡처(OUT 폴더).
import path from 'node:path';import {chromium,boot,go} from '../r444/lib.mjs';
const [zone,...res]=process.argv.slice(2);const OUT=process.env.OUT||'.';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:960,height:540}});await go(p,zone);await p.waitForTimeout(1500);
console.log(JSON.stringify([...new Set(await p.evaluate(()=>room.enemies.map(e=>e.name+(e.boss?' [boss]':'')+' '+e.id)))]));
for(const src of res){const id=await p.evaluate(src=>{const re=new RegExp(src);player.hp=player.maxHp=1e6;const s=room.enemies.find(e=>e.hp>0&&re.test(String(e.name)));if(!s)return null;
 s.hp=s.maxHp=1e7;s.speed=0;s.damage=0;if('spawnState'in s)s.spawnState='active';s.visible=true;s.x=player.x+1.3;s.y=player.y-0.4;s.homeX=s.x;s.homeY=s.y;s.nav=[];
 for(const o of room.enemies)if(o!==s){o.x=player.x+40;o.y=player.y+40;o.homeX=o.x;o.homeY=o.y;}return String(s.id);},src);
 if(!id){console.log('없음',src);continue;}await p.waitForTimeout(2500);
 const paths=await p.evaluate(id=>{const h=window.__STORYWORLD_PHASE1__.controller.state.three;return new Promise(res=>{const base=h.commands.render;h.commands.render=function(cmds){const out=base.apply(this,arguments);h.commands.render=base;
  res(cmds.filter(c=>c?.owner&&(c.owner.id==='enemy:'+id||c.owner.id==='r248:mob:'+id)&&c.kind==='image').map(c=>String(c.sourcePath||'').slice(0,160)+' f='+(c.style?.filter||'')));return out;};});},id);
 console.log(src,id,JSON.stringify(paths));await p.screenshot({path:path.join(OUT,zone+'-'+src.replace(/\W/g,'')+'.png'),clip:{x:330,y:140,width:300,height:240}});}
await b.close();
