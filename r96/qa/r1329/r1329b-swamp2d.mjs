// R1329b 늪지대 보스(dist02 늪의 뿔악마 군주, mb-dist02) = 소환진 순례악마 2D 자산(M008 늪 악마 대기·걷기·공격·피격 시트) 브라우저 검사.
// 사용자 11-26 10:33Z "늪지대보스를 소환진순례악마자산을 사용하게해" + "2d". 헤드리스 SwiftShader(그래픽 검증 아님).
//  ① 자동 검사(webdriver) 기본값은 꺼짐(기존 2D 검사 기준선 보존) ② 켜면 보스 몸 그림이 M008 시트로 바뀌고 r104 보스 그림은 0
//  ③ 키 = 원래 2D 보스의 보이는 키(±12%) ④ 자세: 쉬기 idle·걷기 walk·공격 attack·피격 hit 시트 ⑤ 방향: 영웅 쪽/걷는 쪽을 봄 ⑥ 다른 늪 몹은 그대로 ⑦ 오류 0
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {chromium,boot,go} from '../r444/lib.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ID='dist02:mb-dist02';
const bossCmds=p=>p.evaluate(id=>{const h=window.__STORYWORLD_PHASE1__.controller.state.three;return new Promise(res=>{const base=h.commands.render;h.commands.render=function(cmds){const out=base.apply(this,arguments);h.commands.render=base;
 res(cmds.filter(c=>c?.kind==='image'&&String(c.owner?.id||'')==='enemy:'+id&&c.spatialRole==='body').map(c=>({sp:String(c.sourcePath||''),src:String(c.image?.src||c.image?.__r1329bSrc||''),pts:c.points})));return out;};});},ID);
const place=(p,dx,dy)=>p.evaluate(([id,dx,dy])=>{player.hp=player.maxHp=1e6;const s=room.enemies.find(e=>e.id===id);s.hp=s.maxHp=1e7;s.damage=0;s.speed=0;if('spawnState'in s)s.spawnState='active';s.visible=true;
 s.x=player.x+dx;s.y=player.y+dy;s.homeX=s.x;s.homeY=s.y;s.nav=[];for(const o of room.enemies)if(o!==s&&Math.hypot(o.x-player.x,o.y-player.y)<6){o.x+=25;o.homeX=o.x;o.speed=0;}},[ID,dx,dy]);
{const {p,ctx}=await boot(b,{vp:{width:640,height:360}});await go(p,'dist02');await place(p,1.6,-.6);await p.waitForTimeout(2500);
 ok(await p.evaluate(()=>window.__STORYWORLD_SWAMP_BOSS_R1329B__?.on?.())===false,'자동 검사 기본값 꺼짐');
 const c=await bossCmds(p);ok(c.length>0&&c.every(x=>/mb-dist02/.test(x.sp+x.src)),'꺼져 있으면 원래 2D 보스 그림('+c.map(x=>x.sp.slice(-60)).join(',')+')');await ctx.close();}
const errs=[];
const {p}=await boot(b,{vp:{width:960,height:540},init:{'storyworld.r1329b.swamp2d':'on'}});p.on('pageerror',e=>errs.push(String(e)));
const API=()=>p.evaluate(()=>window.__STORYWORLD_SWAMP_BOSS_R1329B__.inspect());
ok(await p.evaluate(()=>window.__STORYWORLD_SWAMP_BOSS_R1329B__.on()),'설정으로 켜짐');
await go(p,'dist02');await place(p,1.6,-.6);
await p.waitForFunction(()=>{const I=window.__STORYWORLD_SWAMP_BOSS_R1329B__.inspect();return I.last&&I.last.pose==='idle';},null,{timeout:120000}).catch(()=>{});await p.waitForTimeout(1500);
let I=await API();let c=await bossCmds(p);
ok(I.last&&I.last.id===ID&&I.last.pose==='idle'&&/M008-idle/.test(I.last.sheet),'쉬기 → 소환진 순례악마 대기 시트 '+JSON.stringify(I.last));
ok(c.length===1&&!c.some(x=>/mb-dist02/.test(x.sp+x.src)),'보스 몸 그림 1장·r104 보스 그림 0 ('+c.map(x=>x.sp.slice(-70)).join(',')+')');
ok(I.last&&I.last.target>40&&I.last.h>=I.last.target*.88&&I.last.h<=I.last.target*1.12,'키 '+Math.round(I.last?.h)+'px / 원래 2D 보스 보이는 키 '+Math.round(I.last?.target)+'px');
ok(I.last&&I.last.faceLeft===true,'영웅(왼쪽)을 봄 faceLeft='+I.last?.faceLeft);
await p.screenshot({path:path.join(HERE,'r1329b-swamp-idle.png'),clip:{x:330,y:120,width:320,height:260}});
// 공격
// 공격: 엔진 공격 신호(e.attack.elapsed, R104 보스 자세와 같은 신호)로 들기(0)·내려치기(1) 칸
await p.evaluate(id=>{const s=room.enemies.find(e=>e.id===id);window.__r1329bHold=setInterval(()=>{s.attack={elapsed:.1,angle:Math.PI,shape154:{windup:.4,active:.16}};},4);},ID);await p.waitForTimeout(2000);
I=await API();ok(I.last&&I.last.pose==='attack'&&/M008-attack/.test(I.last.sheet)&&I.last.frame===0,'공격 준비 → 공격 시트 들기 칸 '+JSON.stringify(I.last));
await p.screenshot({path:path.join(HERE,'r1329b-swamp-attack.png'),clip:{x:330,y:120,width:320,height:260}});
await p.evaluate(id=>{clearInterval(window.__r1329bHold);const s=room.enemies.find(e=>e.id===id);s.attack=null;},ID);
// 자세·방향 고르기(그리기와 같은 함수)를 엔진 신호로 직접 확인 — 헤드리스는 게임 시간이 느려 실제 공격 진행 칸을 맞춰 찍기 어렵다.
const PF=await p.evaluate(()=>{const F=window.__STORYWORLD_SWAMP_BOSS_R1329B__.poseFor,b={hp:10,x:10,y:10,state:'idle',flash:0};const sh={windup:.4,active:.16};
 return {w0:F({...b,attack:{elapsed:.1,angle:Math.PI,shape154:sh}}),w1:F({...b,attack:{elapsed:.45,angle:Math.PI,shape154:sh}}),w2:F({...b,attack:{elapsed:.6,angle:Math.PI,shape154:sh}}),w3:F({...b,attack:{elapsed:.75,angle:Math.PI,shape154:sh}}),
  rw:F({...b,rangedWindup:.3}),walkR:F({...b,state:'move',moving:true,moveDX:.02,moveDY:0}),walkL:F({...b,state:'move',moving:true,moveDX:-.02,moveDY:0}),idle:F({...b})};});
ok(PF.w0.pose==='attack'&&PF.w0.frame===0&&PF.w1.frame===1&&PF.w2.frame===2&&PF.w3.frame===3&&PF.rw.frame===0,'공격 칸 = R104 보스 자세와 같은 시간 나눔(들기·내려치기·따라가기·거두기) '+JSON.stringify([PF.w0,PF.w1,PF.w2,PF.w3,PF.rw]));
ok(PF.walkR.pose==='walk'&&PF.walkL.pose==='walk'&&PF.idle.pose==='idle','걷기·쉬기 자세 '+JSON.stringify([PF.walkR,PF.walkL,PF.idle]));
// 피격
await p.evaluate(id=>{const s=room.enemies.find(e=>e.id===id);s.state='idle';s.moving=false;s.moveDX=0;s.moveDY=0;s.flash=.25;},ID);await p.waitForTimeout(400);
I=await API();ok(I.hitSeen>0,'피격 → 피격 시트 '+I.hitSeen+' '+JSON.stringify(I.last));
// 다른 늪 몹(수렁 주문사 등)은 손대지 않음
ok(I.stats.replaced>0&&I.stats.others===0,'바꾼 몸 그림은 늪지대 보스뿐 '+JSON.stringify(I.stats));
ok(!errs.length,'페이지 오류 0 '+errs.slice(0,2).join(' | '));ok(I.stats.errors===0,'오버레이 오류 0 '+(I.lastError||''));
// 다른 지역에서는 꺼짐
await go(p,'dist05');await p.waitForTimeout(2000);const J=await API();ok(J.stats.replaced===I.stats.replaced||J.last?.zone!=='dist05','다른 지역은 그대로');
console.log(fail?'R1329B BROWSER FAIL '+fail:'R1329B BROWSER ALL OK');await b.close();process.exit(fail?1:0);
