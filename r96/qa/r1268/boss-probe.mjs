// R1268 보스 탐침 — 보스 하나만 깨워(나머지 숨김) 영웅이 2.0칸 둘레를 0.8 rad/s 로 돌 때(영웅 자리는 틱 안에서 정함)
//  보스 기본 공격 시작(e.attack 새로·rangedWindup 0→+)이 '이 틱이나 직전 0.1초 안에 걸은' 뒤였는지 센다. 끔(off)→켬(on) 같은 자리.
//  고유 패턴(서사 스킬·소환·장판)은 기본 공격이 아니라 세지 않는다. 헤드리스 소프트웨어 렌더링 결과.
import {chromium,boot,go} from '../r444/lib.mjs';
const ZONES=(process.env.ZONES||'last303,kair05,dist00,last305,cult03,ep1b07').split(',');const SEC=+(process.env.SEC||10);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
const res=[];let fail=0;
for(const z of ZONES){try{await go(p,z);}catch(e){res.push({z,err:String(e).slice(0,60)});fail++;continue}
 for(const on of [false,true]){
  await p.evaluate(on=>{window.__STORYWORLD_STILL_ATTACK_R1268__.set({on,enemy:on});const B=room.enemies.find(e=>e.boss&&!e.persona);window.__B=B;
   for(const e of room.enemies)if(e!==B){e.spawnState='hidden';e.attack=null;e.rangedWindup=0;}
   B.spawnState='active';B.hidden=false;B.graceUntil=0;B.attack=null;B.rangedWindup=0;B.hp=B.maxHp=1e8;B.explorationLeash=null;room.engaged=true;
   player.maxHp=player.hp=1e9;player.invincible=1e9;const cx=B.x,cy=B.y;
   const L=window.__L={starts:0,bad:0,kinds:{},samples:[],t0:time,moveAt:-9,walkTicks:0};
   const base=window.__TB||(window.__TB=tick);window.tick=tick=function(dt){const u=time-L.t0;player.x=B.x+Math.cos(.8*u)*2.0;player.y=B.y+Math.sin(.8*u)*2.0;
    const a=B.attack,rw=+B.rangedWindup||0,x=B.x,y=B.y;const r=base.apply(this,arguments);player.hp=player.maxHp;
    const moved=!!B.moving&&Math.hypot(B.x-x,B.y-y)>.004;if(moved){L.moveAt=time;L.walkTicks++;}
    const kind=(!a&&B.attack)?'melee':(rw<=0&&(+B.rangedWindup||0)>0)?'ranged':null;
    if(kind){L.starts++;L.kinds[kind]=(L.kinds[kind]||0)+1;if(moved||time-L.moveAt<.1){L.bad++;if(L.samples.length<4)L.samples.push({kind,moved,ago:+(time-L.moveAt).toFixed(3)})}}return r};},on);
  const t0=await p.evaluate(()=>time);for(let i=0;i<600;i++){const t=await p.evaluate(()=>{if(storyScene)for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);return time});if(t>t0+SEC)break;await p.waitForTimeout(200);}
  const r=await p.evaluate(()=>{window.tick=tick=window.__TB;const B=window.__B;return {name:B.name,ai:B.ai,...window.__L}});
  res.push({z,on,...r});console.log(JSON.stringify({z,on,name:r.name,ai:r.ai,starts:r.starts,bad:r.bad,kinds:r.kinds,walkTicks:r.walkTicks,samples:r.samples}));
  if(on&&r.bad>0){fail++;console.log('FAIL',z,'보스 걷다 바로 공격',r.bad,'/',r.starts)}
 }
}
await b.close();console.log(fail?'RESULT FAIL '+fail:'RESULT PASS');process.exit(fail?1:0);
