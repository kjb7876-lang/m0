// R1328 3D 영웅 대각선 공격 방향 — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  사용자 11-26 07:25Z "근데 영웅 공격모션 대각선은 왜 안됨?"
//  적 하나를 화면 8방향(45° 간격)에 두고 대상을 찍지 않은 채 엔진 basicAttack 을 부른 뒤, 게임 시간 0.3초 뒤 3D 몸 방향과 적 방향 차이를 잰다.
//  ① 대상 없음: 8방향(벽에 막힌 쪽 빼고 6방향 이상) 차이 ≤ 8°(고치기 전 대각선 35~45°). 과녁은 일반 몹(교전 전 보스는 엔진이 치지 않음). 근접(환도)·원거리(기억사수).
//  ② 대상 찍음: 8방향 모두 ≤ 8°(회귀).
//  ③ 경계: 사거리 밖 적만 있으면 그 적을 보지 않음(엔진 방향 그대로), 공격이 끝난 뒤에도 그 적 쪽 유지(4방향으로 꺾이지 않음), 오류 0.
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1328/r1328-browser.mjs`
import {chromium,boot,go} from '../r444/lib.mjs';
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:640,height:400}});await go(p,process.env.ZONE||'dist00');
await p.evaluate(()=>{player.hp=player.maxHp=99999;window.__STORYWORLD_HWANDO3D_R1302__.set(true);});
const pick=async h=>{await p.evaluate(async h=>{try{await ensureImages(heroPaths(h));}catch(_){}player.personaHeroR1113=false;player.egoSovereignR1046=false;player.hero=h;player.moving=false;player.attackAnim=0;},h);
 await p.waitForFunction(h=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return i.hero===h&&i.shown;},h,{timeout:240000});await p.waitForTimeout(1500);};
// 한 번 재기: k = 화면 방향(45° 단위), far = 사거리 배수, after = 공격이 끝난 뒤 더 기다릴 게임 시간
const shot=(k,setT,far=.6,after=0)=>p.evaluate(async({k,setT,far,after})=>{const ang=k*Math.PI/4,R=HEROES[player.hero].range*far;
 const sx=Math.cos(ang),sy=Math.sin(ang)*.5,dx=(sx+2*sy)/2,dy=(2*sy-sx)/2,n=Math.hypot(dx,dy);
 const es=room.enemies.filter(e=>e.hp>0&&!e.boss);/* 교전 전 보스는 엔진이 치지 않는다 */es.forEach((e,i)=>{e.speed=0;e.damage=0;e.hp=e.maxHp=1e9;if(i){e.x=player.x+999;e.y=player.y+999;}});const e=es[0];e.x=player.x+dx/n*R;e.y=player.y+dy/n*R;
 const open=clearLine(player,e);target=setT?e.id:null;player.moving=false;player.attackCD=0;player.attackAnim=0;basicAttack(false);const fired=player.attackAnim>0,t0=time;
 await new Promise(r=>{const f=()=>{if(time-t0>.3)r();else{player.attackAnim=Math.max(player.attackAnim,.1);setTimeout(f,30);}};f();});
 if(after>0){player.attackAnim=0;const t1=time;await new Promise(r=>{const f=()=>{if(time-t1>after)r();else setTimeout(f,30);};f();});}
 const g=window.__STORYWORLD_PHASE1__.controller.state.three.scene.children.find(c=>/3d-shared/.test(c.name)&&c.visible);
 const want=Math.atan2(e.x-player.x,e.y-player.y);let d=g.rotation.y-want;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;
 return {fired,open,dist:Math.hypot(e.x-player.x,e.y-player.y),range:HEROES[player.hero].range,aim:window.__STORYWORLD_FACE3D_R1314__.inspect().last?.aim,eid:e.id,err:Math.abs(d)*180/Math.PI,mode:window.__STORYWORLD_FACE3D_R1314__.inspect().last?.mode};},{k,setT,far,after});
for(const h of (process.env.HEROES||'hwando,gunner').split(',')){await pick(h);
 for(const setT of [false,true]){const errs=[];let fired=0;for(let k=0;k<8;k++){const r=await shot(k,setT,.45);if(!r.open||!r.fired){errs.push('벽');continue;}/* 길이 막힌 쪽은 엔진도 치지 않는다 */errs.push(Math.round(r.err));fired++;await p.waitForTimeout(300);}
  ok(fired>=6&&Math.max(...errs.filter(Number.isFinite))<=8,`${setT?'②':'①'} ${h} ${setT?'대상 찍음':'대상 없음'}: 8방향 몸·적 방향 차이 ${JSON.stringify(errs)}° (≤8°)`);}
 const out=await shot(1,false,1.6);if(!(out.dist>out.range))console.log('skip ③ '+h+': 이 맵에서는 적을 사거리('+out.range+') 밖에 둘 수 없어 재지 못함('+out.dist.toFixed(2)+') — 사거리 경계는 CPU 검사 ③ 이 본다');else ok(out.dist>out.range&&!out.fired&&out.aim!==out.eid,'③ '+h+': 사거리 밖 적('+out.dist.toFixed(2)+' > '+out.range+')은 치지도 보지도 않음(mode '+out.mode+', aim '+out.aim+')');
 const keep=await shot(1,false,.45,.8);ok(keep.err<=8,'③ '+h+': 공격이 끝난 뒤에도 그 적 쪽 유지 '+keep.err.toFixed(1)+'°');}
const i=await p.evaluate(()=>window.__STORYWORLD_FACE3D_R1314__.inspect());ok(i.errors===0&&i.hit>0,'③ 방향 오버레이 오류 0, 적 쪽 보기 '+i.hit+'프레임');
await b.close();console.log(fail?'\nR1328 브라우저 FAIL '+fail:'\nR1328 브라우저 PASS');process.exit(fail?1:0);
