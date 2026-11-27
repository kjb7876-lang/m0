// R1382 HF 보스 3D 7종 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님, GPU·실기기 미검증).
//  ① R1339 표 hq6 로 바뀐 3종(베엘제붑 R1315·레비아탄 R1343·주사기 환영체 R1322c)이 새 GLB 로 3D 로 보이고 오류 0.
//  ② ?hq39=0 이면 옛 GLB(바꿔치기 0).
//  ③ R1382 새 오버레이: 분노의 귀·나태 남자는 게임이 그리는 2D 모습(청소부·왕좌 덩어리)이 3D 모델 모습과 달라 2D 그대로(인스턴스 안 보임),
//     루시퍼(천사의 가면, 2D 지역)는 기본 꺼짐이라 2D, ?boss3d81=1 이면 3D.
// 실행: 정적 서버 뒤 `SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1382/r1382-browser.mjs [kind…]`
import {chromium,URL as BASE} from '../r444/lib.mjs';
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
// [zone, 이름, API, kind, 옛 GLB(바꿔치기 대상, 없으면 R1382 새 오버레이), 3D 기대(hq 모드)]
const ALL=[['ep1b04','최고급 호텔의 총주방장 · 탐식의 귀 베엘제붑','__STORYWORLD_MOB3D_R1315__','glutton','assets/r1315/boss-gluttony-demon-3d.glb',true],
 ['ep1b03','호텔 부매니저 · 레비아탄','__STORYWORLD_MOB3D_R1343__','leviathan','assets/r1343/leviathan.glb',true],
 ['ep1a09','중독을 부르는 주사기 환영체','__STORYWORLD_BOSS3D_R1322C__','syringe','assets/r1322c/boss-ep1a09-syringe-apparition-3d.glb',true],
 ['ep1b07','불을 지른 청소부 · 분노의 귀','__STORYWORLD_MOB3D_R1382__','wrathEar',null,false],
 ['ep1b02','나태에 잠식된 남자','__STORYWORLD_MOB3D_R1382__','slothMan',null,false],
 ['ep1a11','루시퍼 · 가면 벗은 초천사','__STORYWORLD_MOB3D_R1382__','lucifer',null,'opt']];
const want=process.argv.slice(2);const CASES=want.length?ALL.filter(c=>want.includes(c[3])):ALL;
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
for(const mode of ['hq','old','opt']){
 const cases=CASES.filter(c=>mode==='opt'?c[5]==='opt':mode==='old'?!!c[4]:true);if(!cases.length)continue;
 const errs=[];const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(BASE+'?boss3d22c=1&mob3d15=1&envy3d43=1&hq39='+(mode==='old'?0:1)+(mode==='opt'?'&boss3d81=1':''));
 await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
 const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
 for(const [zone,name,api,kind,oldGlb,expect] of cases){
  await p.evaluate(z=>{if(room?.id!==z)enterRegion(z,null,{layer:'STORY',restore:true});},zone);await p.waitForFunction(z=>!loading&&room?.id===z,zone,{timeout:150000});await skip();
  const id=await p.evaluate(name=>{player.hp=player.maxHp=1e6;for(const e of room.enemies)e.damage=0;
   const s=room.enemies.find(e=>e.hp>0&&String(e.name).replace(/^중간보스 · /,'')===name);if(!s)return null;
   s.hp=s.maxHp=1e7;s.speed=0;if('spawnState'in s)s.spawnState='active';s.visible=true;s.x=player.x-1.4;s.y=player.y-1.0;s.homeX=s.x;s.homeY=s.y;s.nav=[];
   for(const o of room.enemies)if(o!==s&&Math.hypot(o.x-player.x,o.y-player.y)<5){o.x+=25;o.homeX=o.x;}return String(s.id);},name);
  if(!id){ok(false,mode+' '+zone+' '+name+' 찾기');continue;}
  const on3d=mode==='opt'||(expect===true);
  if(on3d)await p.waitForFunction(([api,id])=>window[api]?.inspect().instances.some(x=>x.id===id&&x.visible),[api,id],{timeout:240000}).catch(()=>{});
  else await p.waitForTimeout(8000);
  await p.waitForTimeout(1500);
  const it=await p.evaluate(([api,id])=>window[api]?.inspect().instances.find(x=>x.id===id)||null,[api,id]);
  const hq=await p.evaluate(()=>window.__STORYWORLD_MOB3D_HQ_R1339__.inspect());
  if(on3d)ok(!!it?.visible&&it.kind===kind,mode+' '+name+' 3D 보임 '+JSON.stringify(it));
  else ok(!it?.visible,mode+' '+name+' 2D 그대로(게임 그림 모습이 3D 와 다름) '+JSON.stringify(it));
  if(oldGlb)ok(mode==='old'?!hq.seen.includes(oldGlb):hq.seen.includes(oldGlb),mode+' '+name+' '+(mode==='old'?'옛 GLB 그대로':'새 GLB 로 바꿔 읽음'));
 }
 ok(errs.length===0,mode+' 페이지 오류 0 '+errs.slice(0,2).join(' | '));
 await ctx.close();
}
await b.close();console.log(fail?'R1382 browser FAIL '+fail:'R1382 browser PASS');process.exit(fail?1:0);
