// R1314 브라우저 검사(헤드리스·SwiftShader — 그래픽·실기기·자연 플레이 검증 아님): 3D 영웅이 바라보는 방향.
//  사용자 2026-11-25 "모든 3D 영웅이 미카엘라 쪽(사몽 NPC)을 바라보면서 움직이는 버그". 재는 값 = 화면에서 3D 몸이 향하는 방향
//  (모델 앞 +Z 를 장면 카메라로 투영) 과 화면 이동 방향의 각 차이. 프레임마다 게임 시간으로 잰다.
//  ① 맨 걷기 8방향: 구간마다 마지막 걷는 프레임(돌아서기 끝난 뒤) 오차 ≤ 3° — 예전 공식은 축 방향에서 13° 남음
//  ② 근처 적을 치는 중(A 오토·반자동처럼 공격 자세가 남은 채) 적 반대쪽으로 걷기: 오차 ≤ 30° 인 프레임 ≥ 85%
//  ③ 서서 공격: 공격 대상(target) 쪽 ≤ 30°
//  ④ 사몽 미카엘라 NPC 옆에서 NPC 반대쪽으로 걷기: 오차 ≤ 30° 인 프레임 ≥ 85%
//  ⑥ 걷다 멈춘 뒤 몸이 엔진 4방향으로 꺾이지 않음 ≤ 3°
//  ⑤ 오류 0. OFF=1 이면 R1314 를 끈 채(고치기 전 동작) 돈다. HEROES=slayer 기본, HEROES=slayer,michaela,... 로 여러 영웅.
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const HEROES=(process.env.HEROES||'slayer').split(',');let fail=0;
const ok=(c,m,x)=>{console.log((c?'PASS':'FAIL')+' '+m+(x!==undefined?' '+JSON.stringify(x).slice(0,900):''));if(!c)fail++;};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:640,height:360},init:{'storyworld.r1302.hwando3d':'on',...(process.env.OFF?{'storyworld.r1314.face3d':'off'}:{})}});
const A=(f,a)=>p.evaluate(f,a);
// 페이지 안 도구: 3D 몸 화면 방향, 이동 방향, 걷기/공격 기록
await A(()=>{window.__r1314={
 face(){const r3=window.__STORYWORLD_PHASE1__.controller.state.three,T=r3.T;let m=null;r3.scene.traverse(o=>{if(/-3d-model$/.test(o.name)&&o.parent?.visible)m=o;});if(!m)return null;m.updateMatrixWorld(true);
  const pos=new T.Vector3().setFromMatrixPosition(m.matrixWorld),fw=new T.Vector3(0,0,1).transformDirection(m.matrixWorld),k=r3.projection.height/r3.projection.width;
  const a=pos.clone().project(r3.camera),b=pos.clone().addScaledVector(fw,1).project(r3.camera);return Math.atan2(-(b.y-a.y)*k,b.x-a.x);},
 scr(dx,dy){const a=project(0,0),b=project(dx,dy);return Math.atan2(b.y-a.y,b.x-a.x);},
 diff(a,b){let d=a-b;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return Math.abs(d)*180/Math.PI;},
 // 경로 걷기: 프레임마다(그린 뒤) 이번 프레임 변위의 화면 방향과 몸 방향 비교
 walk(tx,ty,secs,hold){return new Promise(res=>{route=[{x:tx,y:ty}];const t0=time,out=[];let px=player.x,py=player.y;
  const f=()=>{requestAnimationFrame(()=>{if(hold)hold();const mx=player.x-px,my=player.y-py;px=player.x;py=player.y;const fc=this.face();
   if(fc!=null&&player.moving&&Math.hypot(mx,my)>.02&&time>t0+.25)out.push(+this.diff(fc,this.scr(mx,my)).toFixed(1));
   if(time>t0+secs||(!route.length&&!player.moving&&time>t0+.3)){route=[];res(out);}else f();});};f();});}};});
const wait3d=()=>p.waitForFunction(()=>{const s=window.__STORYWORLD_HWANDO3D_R1302__?.inspect?.();return s?.ready&&s.shown;},null,{timeout:240000});
const pct=(a,lim)=>a.length?a.filter(v=>v<=lim).length/a.length:0;
for(const H of HEROES){
 await go(p,'dist00');
 await A(async h=>{await ensureImages(heroPaths(h));player.hero=h;player.hp=player.maxHp=1e9;player.invincible=9999;for(const e of room.enemies){e.speed=0;e.damage=0;e.x+=60;}},H);await wait3d();
 // ① 맨 걷기
 let all=[];for(const [dx,dy] of [[3,0],[0,3],[-3,0],[0,-3],[2,2],[-2,-2],[2,-2],[-2,2]]){const r=await A(([dx,dy])=>window.__r1314.walk(player.x+dx,player.y+dy,1.2),[dx,dy]);if(r.length)all.push(r.at(-1));}
 ok(all.length===8&&Math.max(...all)<=3,`${H} ① 맨 걷기 8방향: 다 돈 뒤(구간 마지막 걷는 프레임) 몸 방향 오차 ≤ 3°`,{n:all.length,max:Math.max(...all),all});
 // ⑥ 걷다 멈추면 마지막 이동 방향 유지(엔진 4방향으로 45° 꺾이지 않음)
 const stop=await A(async()=>{await window.__r1314.walk(player.x+3,player.y,1.2);const t0=time;await new Promise(r=>{const f=()=>requestAnimationFrame(()=>time>t0+.6?r():f());f();});return +window.__r1314.diff(window.__r1314.face(),window.__r1314.scr(1,0)).toFixed(1);});
 ok(stop<=3,`${H} ⑥ +x 로 걷다 멈춘 뒤 0.6초: 몸은 그대로 이동 방향 ≤ 3°`,stop);
 // ② 근처 적과 싸우던 자세가 남은 채(공격 판정이 이어지는 동안) 적 반대쪽으로 걷기
 await A(()=>{const e=room.enemies.find(e=>e.hp>0&&!e.boss);e.x=player.x+1.6;e.y=player.y-1.6;e.hp=e.maxHp=1e9;target=e.id;window.__r1314e=e;});
 const fight=await A(()=>window.__r1314.walk(player.x-3,player.y+3,1.4,()=>{const e=window.__r1314e;target=e.id;player.attackAnim=Math.max(player.attackAnim||0,.2);if(typeof facing==='function')player.direction=facing(e.x-player.x,e.y-player.y);}));
 ok(fight.length>=4&&pct(fight,30)>=.85,`${H} ② 싸우는 자세로 적 반대쪽 걷기: 이동 방향 ≤ 30° 프레임 ≥ 85%`,{n:fight.length,ok:+pct(fight,30).toFixed(2),sample:fight.slice(0,10)});
 // ③ 서서 공격: 공격 대상 쪽
 const stand=await A(()=>new Promise(res=>{const e=window.__r1314e;route=[];player.moving=false;e.x=player.x-1.8;e.y=player.y-.2;target=e.id;if(typeof facing==='function')player.direction=facing(e.x-player.x,e.y-player.y);
  const t0=time,out=[];const f=()=>requestAnimationFrame(()=>{player.attackAnim=.2;target=e.id;const fc=window.__r1314.face();if(fc!=null&&time>t0+.35)out.push(+window.__r1314.diff(fc,window.__r1314.scr(e.x-player.x,e.y-player.y)).toFixed(1));if(time>t0+.8)res(out);else f();});f();}));
 ok(stand.length>=2&&Math.max(...stand)<=30,`${H} ③ 서서 공격: 공격 대상 쪽 ≤ 30°`,{n:stand.length,max:Math.max(...stand)});
 await A(()=>{player.attackAnim=0;target=null;const e=window.__r1314e;e.x+=60;});
}
// ④ 사몽 + 미카엘라 NPC
await A(()=>window.__STORYWORLD_CHEAT777__.goSamong(0,0,{force:true}));await p.waitForFunction(()=>!loading&&layer==='DREAM',null,{timeout:180000});await skip(p);
await A(async h=>{await ensureImages(heroPaths(h));player.hero=h;player.hp=player.maxHp=1e9;player.invincible=9999;for(const e of room.enemies){e.speed=0;e.damage=0;e.x+=60;}
 if(!room.props.some(q=>q.growthR103==='michaela'))room.props.push({id:'r103michaela:qa',x:player.x-2,y:player.y-2,solid:false,autoTargetEligible6:false,visible:true,path:'assets/hero_direction337/michaela/s.webp',height:64,label:'미카엘라',growthR103:'michaela',samongR103:'michaela'});},HEROES[0]);
await wait3d();
let sam=[];for(const [dx,dy] of [[2.5,0],[0,2.5],[2,2]]){const r=await A(([dx,dy])=>window.__r1314.walk(player.x+dx,player.y+dy,1.2),[dx,dy]);sam.push(...r);}
ok(sam.length>=6&&pct(sam,30)>=.85,'④ 사몽 미카엘라 NPC 반대쪽 걷기: 이동 방향 ≤ 30° 프레임 ≥ 85%',{n:sam.length,ok:+pct(sam,30).toFixed(2),max:Math.max(...sam)});
const errs=await A(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect().errors);ok(errs===0,'⑤ 3D 오류 0',errs);
await b.close();console.log(fail?`RESULT FAIL ${fail}`:'RESULT PASS');process.exit(fail?1:0);
