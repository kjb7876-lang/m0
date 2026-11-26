// R1343 금이 간 안경(ep1b03) 브라우저 검사(헤드리스 Chromium + SwiftShader — 그래픽 검증 아님).
//  ① 지역 몹 5종이 3D 로 나온다(설정 기본, 7대죄 규칙). ② 보스 레비아탄이 3D 로 나온다(Dots GLB 가 와야 통과).
//  ③ 보스 '유리 조각 폭풍': 시전하면 조각이 사방(8방위 모두)으로 날고, 벽에 닿은 조각은 벽에 박혀 남는다(벽 곁 자리),
//     시전이 끝나고 20초 뒤에도 남고, 다른 지역으로 가면 비운다. 피해 합은 보스 근접 1.4대 이하. 그림은 r1343 시트 3종만.
// 실행: 정적 서버 뒤 `SW_URL=... node r96/qa/r1343/r1343-browser.mjs` (SKIP_BOSS3D=1 이면 ② 건너뜀)
import {chromium,boot,go,skip} from '../r444/lib.mjs';
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const waitGame=async(p,sec)=>{const t0=await p.evaluate(()=>time);for(let n=0;n<400;n++){await skip(p);if(await p.evaluate(t=>time>t,t0+sec))break;await p.waitForTimeout(400);}};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errs=[];const {p}=await boot(b,{vp:{width:640,height:360}});p.on('pageerror',e=>errs.push(String(e)));
await go(p,'ep1b03');await skip(p);
const api=await p.evaluate(()=>!!window.__STORYWORLD_ENVY_GLASS_R1343__);ok(api,'유리 조각 오버레이 있음');
const pin=async(name,boss)=>p.evaluate(([name,boss])=>{player.hp=player.maxHp=1e7;for(const e of room.enemies)e.damage=e.damage||1;
  const s=room.enemies.find(e=>(!!e.boss===boss)&&e.hp>0&&String(e.name)===name);if(!s)return null;
  s.hp=s.maxHp=1e8;s.speed=0;s.visible=true;if('spawnState'in s)s.spawnState='active';
  for(const o of room.enemies)if(o!==s&&Math.hypot(o.x-player.x,o.y-player.y)<12){o.x+=40;o.homeX=o.x;}
  window.__s=s;window.__pin=()=>{s.x=player.x+2.2;s.y=player.y-.5;s.homeX=s.x;s.homeY=s.y;s.nav=[];};window.__pin();return String(s.id);},[name,boss]);
const vis3d=id=>p.evaluate(id=>Object.keys(window).filter(k=>/^__STORYWORLD_(MOB3D|BOSS3D)_R13/.test(k)&&!/ZONE/.test(k)).some(k=>{try{return window[k].inspect?.()?.instances?.some(x=>x.id===id&&x.visible);}catch(_){return false;}}),id);
// ① 몹 5종
for(const [name,boss] of [['질투로 얼룩진 망령',false],['긴 뱀의 그림자',false],['추녀의 한탄',false],['유리 망령',false],['금이 간 비교잔영',false]]){
 const id=await pin(name,boss);if(!id){ok(false,name+' 찾음');continue;}
 let v=false;for(let k=0;k<40&&!v;k++){await waitGame(p,.3);await p.evaluate(()=>window.__pin());v=await vis3d(id);}
 ok(v,name+' 3D');await p.evaluate(()=>{const s=window.__s;s.x+=40;s.homeX=s.x;});}
// ② 보스 3D
const bid=await pin('호텔 부매니저 · 레비아탄',true);ok(!!bid,'보스 레비아탄 찾음');
if(process.env.SKIP_BOSS3D!=='1'){let v=false;for(let k=0;k<40&&!v;k++){await waitGame(p,.3);await p.evaluate(()=>window.__pin());v=await vis3d(bid);}ok(v,'보스 레비아탄 3D');}
// ③ 유리 조각 폭풍
if(api){
 await p.evaluate(()=>{for(const e of room.enemies)if(e!==window.__s){e.x+=60;e.homeX=e.x;e.speed=0;}});
 const dmg0=await p.evaluate(()=>Number(window.__s.damage)||0);
 const c=await p.evaluate(()=>window.__STORYWORLD_ENVY_GLASS_R1343__.cast(true));ok(c,'시전 시작');
 let st=null;for(let k=0;k<60;k++){await waitGame(p,.25);await p.evaluate(()=>window.__pin());st=await p.evaluate(()=>window.__STORYWORLD_ENVY_GLASS_R1343__.inspect());if(st.fired>0&&!st.casting)break;}
 ok(st.fired>=36,'조각 수 ≥36 ('+st.fired+')');
 ok(st.octants===8,'8방위 모두로 날아감 ('+st.octants+')');
 ok(st.stuck>=12,'벽에 박힌 조각 ≥12 ('+st.stuck+')');
 const wall=await p.evaluate(()=>{const L=window.__STORYWORLD_ENVY_GLASS_R1343__.stuckList();let near=0;for(const q of L){let w=false;for(let d=.05;d<=.5001&&!w;d+=.05)w=blocked(q.x+Math.cos(q.a)*d,q.y+Math.sin(q.a)*d,.08);if(w)near++;}return {n:L.length,near};});
 ok(wall.n>0&&wall.near===wall.n,'박힌 조각은 모두 벽 곁(진행 방향 .5 안에 벽) '+wall.near+'/'+wall.n);
 ok(st.dealt<=dmg0*1.4+1e-6,'피해 합 ≤ 1.4대 ('+st.dealt.toFixed(1)+' / '+(dmg0*1.4).toFixed(1)+')');
 ok(st.drawn.fly>0&&st.drawn.burst>0&&st.drawn.embed>0,'시트 3종 모두 그림 '+JSON.stringify(st.drawn));
 ok(st.otherDraw===0,'도형(선·원) 그리기 0');
 const L0=await p.evaluate(()=>window.__STORYWORLD_ENVY_GLASS_R1343__.stuckList());
 await waitGame(p,20);const st2=await p.evaluate(()=>window.__STORYWORLD_ENVY_GLASS_R1343__.inspect());
 const kept=await p.evaluate(L0=>{const L=window.__STORYWORLD_ENVY_GLASS_R1343__.stuckList();return L0.filter(a=>L.some(b=>b.x===a.x&&b.y===a.y)).length;},L0);
 ok(kept===L0.length&&st2.stuck>=st.stuck,'20초 뒤에도 앞서 박힌 조각 그대로(다음 시전 몫은 더해짐) '+kept+'/'+L0.length+', 지금 '+st2.stuck);
 const d1=st2.drawn.embed;await waitGame(p,.5);const d2=(await p.evaluate(()=>window.__STORYWORLD_ENVY_GLASS_R1343__.inspect())).drawn.embed;ok(d2>d1,'박힌 조각 계속 그려짐');
 // 자연 시전(강제 아님): 보스 곁에서 기다리면 스스로 쓴다
 await p.evaluate(()=>window.__STORYWORLD_ENVY_GLASS_R1343__.reset(true));
 let nat=false;for(let k=0;k<80&&!nat;k++){await waitGame(p,.3);await p.evaluate(()=>window.__pin());nat=(await p.evaluate(()=>window.__STORYWORLD_ENVY_GLASS_R1343__.inspect())).casts>0;}
 ok(nat,'보스가 스스로 시전');
 await go(p,'ep1b02');await waitGame(p,.3);const st3=await p.evaluate(()=>window.__STORYWORLD_ENVY_GLASS_R1343__.inspect());
 ok(st3.stuck===0&&!st3.casting,'다른 지역에서는 비움');
 const ins=await p.evaluate(()=>window.__STORYWORLD_ENVY_GLASS_R1343__.inspect());ok(!ins.lastError,'오버레이 오류 0 '+(ins.lastError||''));}
ok(!errs.length,'페이지 오류 0 '+(errs[0]||''));
await b.close();console.log(fail?'R1343 browser FAIL '+fail:'R1343 browser ALL OK');process.exit(fail?1:0);
