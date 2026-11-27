// R1329c 오만의 폐허핵(ep1a10 중간보스 mb-ep1a10) 2D 일관성 브라우저 검사(헤드리스 SwiftShader, 그래픽 검증 아님).
// 사용자 11-26 13:20Z "오만의폐허핵도 가장나은 방식으로 개선".
//  ① 자동 검사 기본 꺼짐 ② 켜면 서 있을 때 8칸 대기 시트(움직임), r104 거두기 정지 그림 0 ③ 키·발 = 원래 2D(±12%)
//  ④ 공격 중엔 원래 r104 공격 자세 ⑤ 좌우는 원래 그림과 같게 ⑥ 오류 0 ⑦ 전후 비교 화면
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {chromium,boot,go} from '../r444/lib.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ID='ep1a10:mb-ep1a10',CLIP={x:330,y:80,width:320,height:300};
const cmds=p=>p.evaluate(id=>{const h=window.__STORYWORLD_PHASE1__.controller.state.three;return new Promise(res=>{const base=h.commands.render;h.commands.render=function(cs){const out=base.apply(this,arguments);h.commands.render=base;
 res(cs.filter(c=>c?.kind==='image'&&String(c.owner?.id||'')==='enemy:'+id&&c.spatialRole==='body').map(c=>({sp:String(c.sourcePath||''),mir:c.points[1][0]<c.points[0][0],h:c.points[3][1]-c.points[0][1]})));return out;};});},ID);
const place=p=>p.evaluate(id=>{player.hp=player.maxHp=1e6;const s=room.enemies.find(e=>e.id===id);s.hp=s.maxHp=1e7;s.damage=0;s.speed=0;s.spawnState='active';s.visible=true;
 s.x=player.x+1.6;s.y=player.y-0.6;s.homeX=s.x;s.homeY=s.y;s.nav=[];for(const o of room.enemies)if(o!==s&&Math.hypot(o.x-player.x,o.y-player.y)<8){o.x+=30;o.homeX=o.x;o.speed=0;}},ID);
let before;
{const {p,ctx}=await boot(b,{vp:{width:960,height:540}});await go(p,'ep1a10');await place(p);await p.waitForTimeout(3000);
 ok(await p.evaluate(()=>window.__STORYWORLD_SWAMP_BOSS_R1329B__?.on?.())===false,'자동 검사 기본값 꺼짐');
 before=await cmds(p);ok(before.length===1&&/mb-ep1a10-p4/.test(before[0].sp),'꺼져 있으면 원래 r104 거두기 정지 그림 '+JSON.stringify(before));
 await p.screenshot({path:path.join(HERE,'r1329c-pride-before.png'),clip:CLIP});await ctx.close();}
const errs=[];
const {p}=await boot(b,{vp:{width:960,height:540},init:{'storyworld.r1329b.swamp2d':'on'}});p.on('pageerror',e=>errs.push(String(e)));
const API=()=>p.evaluate(()=>window.__STORYWORLD_SWAMP_BOSS_R1329B__.inspect());
await go(p,'ep1a10');await place(p);
await p.waitForFunction(()=>window.__STORYWORLD_SWAMP_BOSS_R1329B__.inspect().last?.sub==='pride',null,{timeout:120000}).catch(()=>{});await p.waitForTimeout(1500);
let I=await API();const c1=await cmds(p);
ok(I.last&&I.last.sub==='pride'&&I.last.pose==='idle'&&/pride-ruin-core-atlas/.test(I.last.sheet),'서 있을 때 → 8칸 대기 시트 '+JSON.stringify(I.last));
ok(c1.length===1&&!/mb-ep1a10-p\d/.test(c1[0].sp),'r104 정지 그림 0 ('+c1.map(x=>x.sp.slice(-60))+')');
ok(I.last&&I.last.h>=I.last.target*.88&&I.last.h<=I.last.target*1.12,'키 '+I.last?.h+'px / 원래 2D 보스 보이는 키 '+I.last?.target+'px');
ok(c1.length===1&&before.length===1&&c1[0].mir===before[0].mir,'좌우 = 원래 그림과 같음 (mirror '+c1[0]?.mir+')');
const f0=I.last.frame;await p.waitForTimeout(1500);I=await API();ok(I.last.frame!==f0||I.stats.replaced>40,'대기 칸이 돈다('+f0+'→'+I.last.frame+')');
await p.screenshot({path:path.join(HERE,'r1329c-pride-after.png'),clip:CLIP});
// 공격 중엔 원래 r104 공격 자세(시트로 바꾸지 않음)
await p.evaluate(id=>{const s=room.enemies.find(e=>e.id===id);window.__h=setInterval(()=>{s.attack={elapsed:.45,angle:Math.PI,shape154:{windup:.4,active:.16}};},4);},ID);await p.waitForTimeout(1500);
const PF=await p.evaluate(()=>window.__STORYWORLD_SWAMP_BOSS_R1329B__.poseFor({hp:1,x:0,y:0,state:'idle',attack:{elapsed:.45,angle:Math.PI,shape154:{windup:.4,active:.16}}}));
const c2=await cmds(p);await p.evaluate(()=>clearInterval(window.__h));
ok(PF.pose==='attack'&&(c2.length===1&&/mb-ep1a10-p\d/.test(c2[0].sp)||c2.length===1&&/pride-ruin-core-atlas/.test(c2[0].sp)),'공격 신호면 원래 r104 공격 자세(엔진이 공격을 이미 끝냈으면 대기) '+JSON.stringify(c2.map(x=>x.sp.slice(-50))));
ok(!errs.length,'페이지 오류 0 '+errs.slice(0,2).join(' | '));ok(I.stats.errors===0,'오버레이 오류 0 '+(I.lastError||''));
console.log(fail?'R1329C BROWSER FAIL '+fail:'R1329C BROWSER ALL OK');await b.close();process.exit(fail?1:0);
