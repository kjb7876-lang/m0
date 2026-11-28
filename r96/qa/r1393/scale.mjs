// R1393 3D 몹 배율(g.scale) 흔들림 실측: 크기 고침 켬/끔에서 같은 몹 무리의 걷기·대기 중 배율 변동폭(최대-최소)/평균.
// 화면 키(h/target)는 동작 자체로도 변하므로 배율로 잰다. 사용: SW_URL=... node scale.mjs <zone> <on|off>
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const [Z,MODE]=process.argv.slice(2);
const b=await chromium.launch();const nc=b.newContext.bind(b);b.newContext=async o=>{const c=await nc(o);await c.addInitScript(()=>{Object.defineProperty(Navigator.prototype,'webdriver',{get:()=>false});});return c;};
const {p}=await boot(b,{vp:{width:960,height:540},init:{'storyworld.r1393.mob3dSize':MODE,'storyworld.r619.videopause':'{"on":false}','storyworld.r1036.entryvideo':'{"on":false}','storyworld.r309.opening':'{"on":false}','storyworld.r372.rootgate':'{"on":false}'}});
await go(p,Z);
await p.evaluate(()=>{player.hp=player.maxHp=1e9;player.invincible=1e9;let i=0;for(const e of room.enemies){if(!(e.hp>0))continue;if(i<8){e.spawnState='active';e.hidden=false;e.engaged=true;e.hp=e.maxHp=1e8;const a=i/8*Math.PI*2;e.x=player.x+Math.cos(a)*2.5;e.y=player.y+Math.sin(a)*2.5;}else{e.x=player.x+300;e.y=player.y+300;e.speed=0;}i++;}
 window.__S93=new Map();});
const t0=Date.now();
while(Date.now()-t0<60000){await p.waitForTimeout(500);await skip(p);
 await p.evaluate(()=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three;const SH=/^r13\d\d[a-z]?-ink-shell$/;
  const E=room.enemies.filter(e=>e.hp>0);r.scene.traverse(o=>{if(!o.isSkinnedMesh||/ink|shell/i.test(o.name))return;const m=o.matrixWorld.elements;const x=m[12],z=m[14];if(!E.some(e=>Math.hypot(e.x-x,e.y-z)<.6))return;const s=Math.hypot(m[0],m[1],m[2]);if(!(s>0))return;const a=window.__S93.get(o)||[];a.push(s);window.__S93.set(o,a);});});}
const R=await p.evaluate(()=>[...window.__S93.values()].filter(a=>a.length>=20).map(a=>{const t=a.slice(Math.floor(a.length/3));const m=t.reduce((x,y)=>x+y,0)/t.length;return +((Math.max(...t)-Math.min(...t))/m).toFixed(4);}));
console.log(JSON.stringify((await p.evaluate(()=>[...window.__S93.values()].filter(a=>a.length>=20).map(a=>a.map(v=>+v.toFixed(3))))).filter((_,k)=>k%3==0)));console.log(Z,MODE,'n',await p.evaluate(()=>[...window.__S93.values()].map(a=>a.length).join(',')),'spread per mob(after first third):',JSON.stringify(R));await b.close();
