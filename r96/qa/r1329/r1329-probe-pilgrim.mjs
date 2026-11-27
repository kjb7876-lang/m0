// R1329b 조사: 늪지대 보스(dist02 늪의 뿔악마 군주)·소환진 순례악마(dist05) 몹 필드·2D 그림 명령 경로.
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {chromium,boot,go} from '../r444/lib.mjs';
const OUT=path.dirname(fileURLToPath(import.meta.url));
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:960,height:540}});
for(const [zone,re,file] of [['dist02','뿔악마 군주','r1329b-probe-horn.png'],['dist05','순례악마','r1329b-probe-pilgrim.png']]){
 await go(p,zone);await p.waitForTimeout(2000);
 const info=await p.evaluate(src=>{const re=new RegExp(src);player.hp=player.maxHp=1e6;for(const e of room.enemies)e.damage=0;
  const all=room.enemies.filter(e=>re.test(String(e.name)));const s=all.find(e=>e.hp>0)||all[0];if(!s)return {none:room.enemies.map(e=>e.name)};
  s.hp=s.maxHp=1e7;s.speed=0;if('spawnState'in s)s.spawnState='active';s.visible=true;s.x=player.x+1.6;s.y=player.y-0.6;s.homeX=s.x;s.homeY=s.y;s.nav=[];
  for(const o of room.enemies)if(o!==s&&Math.hypot(o.x-player.x,o.y-player.y)<6){o.x+=25;o.homeX=o.x;}
  const f={};for(const k of Object.keys(s)){const v=s[k];if(v==null||typeof v==='function'||typeof v==='object')continue;f[k]=v;}return {n:all.length,f};},re);
 console.log(zone,JSON.stringify(info).slice(0,2500));if(info.none)continue;
 await p.waitForTimeout(3000);
 const id=info.f.id;
 const paths=await p.evaluate(id=>{const h=window.__STORYWORLD_PHASE1__.controller.state.three;return new Promise(res=>{const base=h.commands.render;h.commands.render=function(cmds){const out=base.apply(this,arguments);h.commands.render=base;
  res(cmds.filter(c=>c?.owner&&String(c.owner.id).includes(String(id))&&c.kind==='image').map(c=>[String(c.owner.id),String(c.sourcePath||'').slice(0,140),c.width|0,c.height|0]));return out;};});},id);
 console.log(zone,'cmds',JSON.stringify(paths));
 await p.screenshot({path:path.join(OUT,file),clip:{x:300,y:80,width:360,height:320}});
}
await b.close();
