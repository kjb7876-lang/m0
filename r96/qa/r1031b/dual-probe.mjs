// 같은 프레임을 두 자리에서 본다: 부팅 직후 감싼 안쪽 기록기(bossflip 과 같은 자리) vs 지역 들어간 뒤 맨 바깥 기록기.
// 안쪽만 옛 그림을 보면 측정 도구가 '그리기 사슬 중간'을 읽은 것(화면 아님), 바깥도 보면 실제 화면.
import {chromium,boot,go} from '../r444/lib.mjs';
const secs=+process.argv[2]||25,outFile=process.argv[3]||'dual.json';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
const hook=(tag)=>p.evaluate((tag)=>{const OLD=/bulmyeongwi_(idle|attack|rain|transition)\.webp/i;window.__dual=window.__dual||{};const P=window.__dual[tag]=[];
 const top=(c,st)=>{let fin=null;for(let i=st;i<c.commands.length;i++){const k=c.commands[i];if(k?.kind!=='image'||!Array.isArray(k.points)||k.points.length<4)continue;if(k.owner&&k.owner.kind&&k.owner.kind!=='enemy')continue;
  const src=String(k.sourcePath||k.image?.src||'');if(/r251\/atlas|pixelfx|\/fx|effect|vfx|\bring|circle|sigil/i.test(src))continue;const Q=k.points,area=Math.abs((Q[1][0]-Q[0][0])*(Q[3][1]-Q[0][1])-(Q[1][1]-Q[0][1])*(Q[3][0]-Q[0][0]));if(!fin||area>fin.area)fin={area,src,flip:(Q[1][0]-Q[0][0])<0};}return fin;};
 const base=drawEnemy;drawEnemy=function(e,...a){if(!e||!(e.hp>0)||!e.boss||!ctx||!Array.isArray(ctx.commands))return base.call(this,e,...a);const c=ctx,st0=c.commands.length;
  try{return base.call(this,e,...a);}finally{try{const f=top(c,st0);if(f&&typeof room!=='undefined'&&room.id==='last303')P.push({t:+time.toFixed(3),old:OLD.test(f.src),src:f.src.replace(/^.*\//,''),flip:f.flip,n:c.commands.length-st0});}catch(_){}}};},tag);
await hook('early');
for(const z of (process.env.SEQ||'dist03,last303').split(',')){await go(p,z);await p.waitForTimeout(3000);}
await hook('late');
await p.evaluate(()=>{player.invincible=999;player.hp=9e8;auto=true;guide=false;const B=room.enemies.find(e=>e.hp>0&&e.boss);if(B){B.hp=B.maxHp=1e7;B.spawnState='active';room.engaged=true;for(const e of room.enemies)if(e!==B&&!e.boss)e.hp=0;
 for(let j=0;j<16;j++){const a=j*Math.PI/8;const tx=B.x+Math.cos(a)*3.5,ty=B.y+Math.sin(a)*3.5;if(!blocked(tx,ty,.3)){player.x=tx;player.y=ty;break;}}}window.__t0=time;window.__dual.early.length=0;window.__dual.late.length=0;
 const tb=tick;tick=function(dt,...a){player.hp=Math.max(player.hp,9e8);return tb.call(this,dt,...a);};});
await p.waitForFunction(s=>time-window.__t0>=s,secs,{timeout:2400000,polling:500});
const D=await p.evaluate(()=>window.__dual);(await import('node:fs')).writeFileSync(outFile,JSON.stringify(D));
const cnt=a=>a.filter(r=>r.old).length;console.log('early frames',D.early.length,'old',cnt(D.early),'| late frames',D.late.length,'old',cnt(D.late));
// 같은 t 에서 비교
const L=new Map(D.late.map(r=>[r.t,r]));let both=0,earlyOnly=0;for(const r of D.early)if(r.old){const l=L.get(r.t);if(l&&l.old)both++;else earlyOnly++;}console.log('old frames seen by both',both,'early only',earlyOnly);
console.log(D.early.filter(r=>r.old).slice(0,5).map(r=>r.t+':'+r.src+' late='+(L.get(r.t)?.src)).join('\n'));
await b.close();
