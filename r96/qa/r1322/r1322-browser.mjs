// R1322 CX-3D-LQ 3D 몹·중간보스 29종 — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  ① 기본 꺼짐 ② ?mob3d22=1 로 29종 GLB 모두 읽힘(실패 0)
//  ③ 지역마다 대상 몹 하나를 영웅 곁에 두고: 3D 로 보이고 그 종류가 맞음, 2D 몸 그림 빠짐, 3D 키가 2D 보이는 키의 .75~1.3배
//     (cult02 과열 시냅스·cult03 SUPER EGO·cult04 아마겟돈·cult04 태엽 수집자 우두머리·cult05 ID 배양·u206 연결자·u206 코어·u205 역전 관리자·u204 기억 검열기·last304 중립초원·cult06 태엽 수집자, u206 입양기억 청람잔영·murder02 CCTV·호텔·murder03 옥상·추락·murder04 제출되지 못한 문장·ep1b07 개와 늑대의 시간·u203 수호 프레임)
//  ④ HOLD: cult05 'ID 배양 점액체 우두머리' 는 2D 그대로, 다른 몹의 '우두머리'(아마겟돈 계산결정 우두머리)는 기본 몹 모델
//  ⑤ 끄기 → 3D 0 ⑥ 페이지 오류 0·오버레이 오류 0. 화면은 r1322-<kind>.png 로 남김.
// 실행: 정적 서버(http://127.0.0.1:4410/m0/) 뒤 `node r96/qa/r1322/r1322-browser.mjs`
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {chromium,boot,go,URL as BASE} from '../r444/lib.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errs=[];
{const {p,ctx}=await boot(b,{vp:{width:640,height:360}});p.on('pageerror',e=>errs.push(String(e)));await go(p,'cult04');
 ok(await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1322__?.on?.())===false,'기본값 꺼짐');
 await p.waitForTimeout(1500);ok(await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1322__.inspect().shown)===0,'꺼져 있으면 3D 0');await ctx.close();}
const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));
await p.goto(BASE+'?mob3d22=1');await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
const API=()=>p.evaluate(()=>window.__STORYWORLD_MOB3D_R1322__.inspect());
await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1322__.preload());
await p.waitForFunction(()=>{const I=window.__STORYWORLD_MOB3D_R1322__.inspect();return I.loaded.length+I.failed.length>=29;},null,{timeout:600000}).catch(()=>{});
let I=await API();ok(I.loaded.length===29&&I.failed.length===0,'29종 GLB 읽음 '+I.loaded.length+'/29, 실패 '+JSON.stringify(I.failed)+' '+(I.lastError||''));
const CASES=[['cult02','과열 시냅스 점액체','slimeSynapse'],['cult03','SUPER EGO 절개결정','superEgo'],['cult04','아마겟돈 계산결정','armageddon'],['cult04','아마겟돈 계산결정 우두머리','armageddon'],
 ['cult04','태엽 수집자 우두머리','clockworkLeader'],['cult05','ID 배양 점액체','slimeCulture'],['cult05','ID 배양 점액체 우두머리',null],['cult06','태엽 수집자','clockwork'],
 ['u206','기계화 기억이주 연결자','connector'],['u206','제17단계 중앙이주 코어','core'],['u205','제14단계 역전 관리자','reversal'],['u204','기계화 제12단계 기억 검열기','censor'],['last304','중립초원 슬라임','slimeMeadow'],
 ['u206','입양기억 청람잔영','remnantAdoption'],['murder02','지워진 CCTV 기록의 잔향 3','remnantCctv'],['murder02','새빛호텔 화재 기록의 잔향 1','remnantHotel'],['murder03','옥상으로 돌아온 기억 잔향 5','remnantRooftop'],
 ['murder03','반복된 추락의 인과 잔향 3','remnantFall'],['murder04','제출되지 못한 문장','manuscript'],['ep1b07','개와 늑대의 시간','dogWolf'],['u203','기억의 문 수호 프레임','gateFrame']];
for(const [zone,name,kind] of CASES){
 await go(p,zone);
 const id=await p.evaluate(name=>{player.hp=player.maxHp=1e6;for(const e of room.enemies)e.damage=0;
  const s=room.enemies.find(e=>!e.boss&&e.hp>0&&String(e.name).replace(/^중간보스 · /,'')===name);if(!s)return null;
  s.hp=s.maxHp=1e7;s.speed=0;if('spawnState'in s)s.spawnState='active';s.visible=true;s.x=player.x-1.4;s.y=player.y-1.0;s.homeX=s.x;s.homeY=s.y;s.nav=[];
  for(const o of room.enemies)if(o!==s&&Math.hypot(o.x-player.x,o.y-player.y)<5){o.x+=25;o.homeX=o.x;}window.__s=s;return String(s.id);},name);
 if(!id){ok(false,zone+' '+name+' 찾기');continue;}
 if(kind===null){await p.waitForTimeout(4000);const J=await API();const k=await p.evaluate(id=>window.__STORYWORLD_MOB3D_R1322__.kindOf(id),id);
  ok(!J.instances.some(x=>x.id===id&&x.visible)&&!k,zone+' '+name+' 는 HOLD → 2D 그대로('+k+')');continue;}
 await p.waitForFunction(id=>window.__STORYWORLD_MOB3D_R1322__.inspect().instances.some(x=>x.id===id&&x.visible&&x.target>8),id,{timeout:150000}).catch(()=>{});
 await p.waitForTimeout(2500);
 const J=await API();const it=J.instances.find(x=>x.id===id);ok(it&&it.visible&&it.kind===kind,zone+' '+name+' → '+kind+' 3D ('+(it&&it.kind)+')');
 const body=await p.evaluate(id=>{const h=window.__STORYWORLD_PHASE1__.controller.state.three;return new Promise(res=>{const base=h.commands.render;h.commands.render=function(cmds){const out=base.apply(this,arguments);h.commands.render=base;
  res(cmds.filter(c=>c?.owner&&!c.owner.r350&&(c.owner.id==='enemy:'+id||c.owner.id==='r248:mob:'+id)&&c.kind==='image'&&!/(^|[\/_.-])(fx|sigil|smoke|shadow|bar|spark|aura|halo|proj)([\/_.-]|$)/i.test(String(c.sourcePath||''))).length);return out;};});},id);
 ok(body===0,zone+' '+name+' 2D 몸 그림 빠짐('+body+')');
 const m=await p.evaluate(id=>window.__STORYWORLD_MOB3D_R1322__.measure(id),id);
 ok(m&&m.target>8&&m.h>=m.target*.75&&m.h<=m.target*1.3,zone+' '+name+' 3D 키 '+Math.round(m?.h)+'px / 2D 보이는 키 '+Math.round(m?.target)+'px');
 await p.screenshot({path:path.join(HERE,'r1322-'+kind+(name.endsWith('우두머리')&&kind==='armageddon'?'-leader':'')+'.png')});
}
await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1322__.set(false));await p.waitForTimeout(1200);I=await API();ok(I.shown===0,'끄기 → 3D 0 ('+I.shown+')');
ok(!errs.length,'페이지 오류 0 '+errs.slice(0,2).join(' | '));ok(I.stats.errors===0,'오버레이 오류 0 '+(I.lastError||''));
await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1322__.set(true));
console.log(fail?'R1322 BROWSER FAIL '+fail:'R1322 BROWSER ALL OK');await b.close();process.exit(fail?1:0);
