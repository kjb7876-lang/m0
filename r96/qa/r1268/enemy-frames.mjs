// R1268 적 전환 프레임 검사 — 걷기→멈춤→공격, 공격→걷기 전환에서 실제 그려진 몸 그림(drawEnemy 안 가장 큰 drawImage: 그림·칸·좌우)을 매 렌더 프레임 적는다.
//  E1 깜빡임: 같은 그림 A 사이에 다른 그림 B 가 딱 한 프레임만 끼면(A B A) 위반.
//  E2 걷는 공격: 적이 이번 프레임에 걸었는데(공격 상태 아님) 몸 그림이 공격 칸(atk/attack)이면 위반.
//  끔(OFF=1)·켬 같은 시나리오. 영웅은 무적, 0.9초마다 멈춤/걷기 번갈아(방향키). 헤드리스 소프트웨어 렌더링 결과.
import {chromium,boot,go} from '../r444/lib.mjs';
const ZONES=(process.env.ZONES||'cult03,kair04,dist01').split(',');const SEC=+(process.env.SEC||8);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
if(!process.env.OFF)await p.evaluate(()=>window.__STORYWORLD_STILL_ATTACK_R1268__?.set({enemy:true}));/* 몹 규칙은 기본 끔 — 탐침에선 켬 */
if(process.env.OFF)await p.evaluate(()=>window.__STORYWORLD_STILL_ATTACK_R1268__.set({on:false}));
const out=[];let fail=0;
for(const z of ZONES){await go(p,z);
 await p.evaluate(()=>{const L=liveEnemies().filter(e=>!e.boss&&!e.persona).sort((a,b)=>distance(a,player)-distance(b,player));const keep=L.slice(0,4);
  for(const e of room.enemies)if(!keep.includes(e)){e.spawnState='hidden';}
  for(const e of keep){e.graceUntil=0;e.spawnState='active';}const t=keep[0];if(t){player.x=t.x-3;player.y=t.y;}room.engaged=true;player.maxHp=player.hp=1e9;player.invincible=1e9;
  const R=window.__EF={rec:new Map(),keep,t0:time,last:new Map()};
  if(!window.__efWrapped){window.__efWrapped=1;const base=drawEnemy;window.drawEnemy=drawEnemy=function(e,...a){const R=window.__EF;if(!R||!R.keep.includes(e))return base.call(this,e,...a);
    const c=ctx,orig=c.drawImage;let best=null;c.drawImage=function(im,...q){try{const w=q.length>=8?q[6]:q.length>=4?q[2]:(im.width||0),h=q.length>=8?q[7]:q.length>=4?q[3]:(im.height||0),A=Math.abs(w*h);if(!best||A>best.A){const tf=c.getTransform?.();best={A,src:String(im.src||im.__src||im.currentSrc||'canvas').split('/').slice(-2).join('/'),sx:q.length>=8?Math.round(q[0]):-1,sy:q.length>=8?Math.round(q[1]):-1,flip:tf?Math.sign(tf.a):0};}}catch(_){}return orig.call(this,im,...q);};
    try{return base.call(this,e,...a);}finally{c.drawImage=orig;if(best){const L=R.last.get(e);const moved=L?Math.hypot(e.x-L.x,e.y-L.y)>.004:false;R.last.set(e,{x:e.x,y:e.y});
     const atk=!!e.attack||+e.rangedWindup>0;const arr=R.rec.get(e)||[];if(!arr.length||arr[arr.length-1].time!==time)arr.push({time,key:best.src+'#'+best.sx+','+best.sy+(best.flip<0?'L':'R'),img:best.src,moved,atk});R.rec.set(e,arr);}}};}
  window.__EFI=setInterval(()=>{const ph=Math.floor((time-R.t0)/.9)%2;for(const k of ['ArrowRight','ArrowLeft'])keys.delete(k);if(ph)keys.add(Math.floor((time-R.t0)/1.8)%2?'ArrowLeft':'ArrowRight');},50);});
 const t0=await p.evaluate(()=>time);for(let i=0;i<900;i++){const t=await p.evaluate(()=>{if(storyScene)for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);return time});if(t>t0+SEC)break;await p.waitForTimeout(150);}
 const r=await p.evaluate(()=>{clearInterval(window.__EFI);keys.clear();const R=window.__EF;window.__EF=null;const res=[];for(const [e,arr] of R.rec){let e1=0,e2=0,frames=arr.length,atkFrames=0;const ex=[];
   for(let i=0;i<arr.length;i++){const f=arr[i];if(f.atk)atkFrames++;if(f.moved&&!f.atk&&/atk|attack|strike|cast/i.test(f.img)){e2++;if(ex.length<3)ex.push('E2 '+f.key)}
    if(i>=2&&arr[i-2].key===f.key&&arr[i-1].key!==f.key&&arr[i-1].img!==f.img){e1++;if(ex.length<3)ex.push('E1 '+arr[i-2].key+' > '+arr[i-1].key)}}
   res.push({name:e.name,frames,atkFrames,e1,e2,ex});}return res});
 for(const x of r){out.push({z,...x});console.log(JSON.stringify({z,...x}));if(x.e2>0&&!process.env.OFF){fail++;}}
}
await b.close();const s=out.reduce((a,x)=>({e1:a.e1+x.e1,e2:a.e2+x.e2,f:a.f+x.frames,atk:a.atk+x.atkFrames}),{e1:0,e2:0,f:0,atk:0});console.log('SUM',JSON.stringify(s));console.log(fail?'RESULT FAIL '+fail:'RESULT PASS');process.exit(fail?1:0);
