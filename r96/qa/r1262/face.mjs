// 걸음은 영웅이 화면 바로 위쪽 약 14칸 밖(세계 −10,−10)에 있을 때 잰다(세계 y 차이가 화면 x 를 바꾸므로 영웅 쪽 보기와 섞이지 않게).
// R1262 7대죄 보스 좌우: 영웅이 왼쪽/오른쪽에 있을 때 서기, 몹 걸음 왼쪽/오른쪽(AI 걸음 멈춤, 게임 시간으로 이동) 동안 몸 그림 좌우 뒤집힘 기록.
//  node face.mjs 지역:id
import {chromium,boot,go} from '../r444/lib.mjs';
const [z,id]=process.argv[2].split(':');
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360},init:{'storyworld.r790.npc':'{"on":false}'}});await go(p,z);
await p.evaluate(id=>{const e=room.enemies.find(x=>x.nativeId===id);room.engaged=true;e.spawnState='active';e.hidden=false;player.invincible=1e9;player.hp=9e8;player.maxHp=9e8;
 for(const o of room.enemies)if(o!==e&&o.hp>0){o.x=-999;o.y=-999;o.speed=0;}e.speed=0;e.x=player.x+3;e.y=player.y;window.__F={e,vx:0,t:null,f:[]};
 const FX=/r251\/atlas|pixelfx|\/fx[\/-]|effect|vfx|\bring\b|circle|sigil|shadow|aura|blood|flame|r572|r571|dissol|burn|smoke|ink-bleed|r106fx|ember|ash|spark|glow|wreath/i;
 const de=drawEnemy;drawEnemy=function(x,...a){const F=window.__F;if(x===F.e){x.attack=null;x.cd=99;if(F.vx){const t=time,dt=Math.max(0,Math.min(.1,t-(F.t??t)));F.t=t;x.x+=F.vx*dt;}}
  const s0=ctx.commands.length;const r=de.call(this,x,...a);if(x===F.e){let best=null,ba=0;for(const k of ctx.commands.slice(s0)){if(k?.kind!=='image'||!Array.isArray(k.points)||FX.test(String(k.sourcePath||'')))continue;const P=k.points,ar=Math.abs((P[1][0]-P[0][0])*(P[3][1]-P[0][1]));if(ar>ba){ba=ar;best=k;}}
   if(best)F.f.push((best.points[1][0]<best.points[0][0]?'F':'n'));}return r;};},id);
const res={};
async function seg(name,setup,dur){await p.evaluate(setup);await p.evaluate(()=>{window.__F.f=[];window.__F.t=null;});const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+.8,t0,{timeout:60000}).catch(()=>{});res[name]=await p.evaluate(()=>window.__F.f.join(''));}
await seg('서기·영웅왼쪽',()=>{const F=window.__F;F.vx=0;F.e.x=player.x+3;F.e.y=player.y;},.8);
await seg('서기·영웅오른쪽',()=>{const F=window.__F;F.vx=0;F.e.x=player.x-3;F.e.y=player.y;},.8);
await seg('걸음왼쪽·영웅화면위멀리',()=>{const F=window.__F;F.e.x=player.x-10+.6;F.e.y=player.y-10;F.vx=-1.5;},.8);
await seg('걸음오른쪽·영웅화면위멀리',()=>{const F=window.__F;F.e.x=player.x-10-.6;F.e.y=player.y-10;F.vx=1.5;},.8);
const sum=s=>{const F=(s.match(/F/g)||[]).length,n=s.length;return n?(F/n>.8?'F':F/n<.2?'n':'섞임')+'('+n+')':'없음';};
console.log(id,JSON.stringify(Object.fromEntries(Object.entries(res).map(([k,v])=>[k,sum(v)]))),JSON.stringify(res));await b.close();
