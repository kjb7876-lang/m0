// R1229: 적 탄과 관련된 그리기 명령(경로에 projectile·r912·r116tint·core·orb 가 들어간 것, 또는 owner 가 projectile)을 모은다
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const [zone,re]=process.argv.slice(2);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await p.evaluate(()=>{player.hero='hunter';});await go(p,zone);
await p.evaluate(re=>{const R=new RegExp(re);const keep=room.enemies.filter(e=>R.test(e.name||''));for(const e of room.enemies)if(!keep.includes(e))e.hp=0;for(const k of keep.slice(1))k.hp=0;const e=keep[0];player.x=e.x+5;player.y=e.y+1;room.engaged=true;e.spawnState='active';e.visible=true;e.hp=e.maxHp=1e8;setInterval(()=>{try{player.hp=maxHP();player.invincible=99;}catch(_){}},300);},re);
await p.waitForFunction(()=>(projectiles||[]).some(x=>!x.friendly&&x.age>.15),null,{timeout:300000,polling:50});
const R=await p.evaluate(async()=>{const three=window.__STORYWORLD_PHASE1__.controller.state.three,base=three.render;let o=null;
 three.render=function(f){if(!o){const pr=projectiles.find(x=>!x.friendly);const q=pr&&project(pr.x,pr.y);o={q,cmds:(f.commands||[]).filter(c=>{const s=String(c.sourcePath||'')+' '+String(c.owner?.id||'')+' '+c.owner?.kind;return /projectile|r912|r116tint|core|orb|bullet|shot/i.test(s);}).map(c=>[c.owner?.kind,String(c.owner?.id).slice(0,60),c.kind,String(c.sourcePath||'').slice(-60),c.points?c.points[0].map(Math.round):null])};}return base.apply(this,arguments);};
 await new Promise(r=>setTimeout(r,800));three.render=base;return o;});
console.log(JSON.stringify(R,null,0).slice(0,4000));await b.close();
