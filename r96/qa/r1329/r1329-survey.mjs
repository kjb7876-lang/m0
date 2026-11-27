// R1329 조사: 거미동굴(dist01) 몹 이름·그림 경로와 알집지기·보라검천사 2D 화면 캡처(기준 그림).
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {chromium,boot,go} from '../r444/lib.mjs';
const OUT=process.env.OUT||path.dirname(fileURLToPath(import.meta.url));
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:960,height:540}});await go(p,'dist01');await p.waitForTimeout(2000);
const list=await p.evaluate(()=>room.enemies.map(e=>({id:e.id,name:e.name,boss:!!e.boss,mini:e.miniBoss||e.elite||null,hp:e.maxHp,spawn:e.spawnState,key:e.key||e.type||null,assetPath:e.assetPath||e.sprite||null})));
console.log(JSON.stringify(list,null,0));
async function shot(match,file){
 const id=await p.evaluate(src=>{const re=new RegExp(src);player.hp=player.maxHp=1e6;for(const e of room.enemies)e.damage=0;
  const s=room.enemies.find(e=>e.hp>0&&re.test(String(e.name)));if(!s)return null;
  s.hp=s.maxHp=1e7;s.speed=0;if('spawnState'in s)s.spawnState='active';s.visible=true;s.x=player.x+1.6;s.y=player.y-0.6;s.homeX=s.x;s.homeY=s.y;s.nav=[];
  for(const o of room.enemies)if(o!==s&&Math.hypot(o.x-player.x,o.y-player.y)<6){o.x+=25;o.homeX=o.x;}return String(s.id);},match);
 if(!id){console.log('없음',match);return;}
 await p.waitForTimeout(2500);
 const paths=await p.evaluate(id=>{const h=window.__STORYWORLD_PHASE1__.controller.state.three;return new Promise(res=>{const base=h.commands.render;h.commands.render=function(cmds){const out=base.apply(this,arguments);h.commands.render=base;
  res(cmds.filter(c=>c?.owner&&(c.owner.id==='enemy:'+id||c.owner.id==='r248:mob:'+id)&&c.kind==='image').map(c=>String(c.sourcePath||'').slice(0,120)));return out;};});},id);
 console.log(match,id,JSON.stringify(paths));
 await p.screenshot({path:path.join(OUT,file)});
}
await shot('^보랏빛 알집지기$','egg.png');await shot('알집지기 우두머리','egg-leader.png');await shot('중간보스 · 보랏빛 알집지기','egg-mid.png');
await shot('보라검','angel.png');
await b.close();
