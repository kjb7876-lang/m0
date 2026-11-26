// R1322c CX-3D-LQ 보스·중간보스 10종 3D — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  ① 기본 꺼짐 ② ?boss3d22c=1 로 10종 GLB 모두 읽힘 ③ 지역마다 보스를 영웅 곁에 두고 3D·종류·2D 몸 빠짐·키 .75~1.3배
//  ④ 요청 밖 보스(cult04 적그리스도 배양좌)는 2D 그대로 ⑤ 끄기 → 3D 0 ⑥ 오류 0. 화면은 r1322c-<kind>.png.
// 실행: 정적 서버(http://127.0.0.1:4410/m0/) 뒤 `node r96/qa/r1322c/r1322c-browser.mjs`
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {chromium,boot,go,URL as BASE} from '../r444/lib.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errs=[];
{const {p,ctx}=await boot(b,{vp:{width:640,height:360}});p.on('pageerror',e=>errs.push(String(e)));await go(p,'cult04');
 ok(await p.evaluate(()=>window.__STORYWORLD_BOSS3D_R1322C__?.on?.())===false,'기본값 꺼짐');
 await p.waitForTimeout(1500);ok(await p.evaluate(()=>window.__STORYWORLD_BOSS3D_R1322C__.inspect().shown)===0,'꺼져 있으면 3D 0');await ctx.close();}
const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));
await p.goto(BASE+'?boss3d22c=1');await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
const API=()=>p.evaluate(()=>window.__STORYWORLD_BOSS3D_R1322C__.inspect());
await p.evaluate(()=>window.__STORYWORLD_BOSS3D_R1322C__.preload());
await p.waitForFunction(()=>{const I=window.__STORYWORLD_BOSS3D_R1322C__.inspect();return I.loaded.length+I.failed.length>=10;},null,{timeout:600000}).catch(()=>{});
let I=await API();ok(I.loaded.length===10&&I.failed.length===0,'10종 GLB 읽음 '+I.loaded.length+'/10, 실패 '+JSON.stringify(I.failed)+' '+(I.lastError||''));
const CASES=[['u203','컨트롤러 · 기억의 문','controller'],['ep1b05','붉은 하이힐의 서윤','seoyun'],['ep1b08','백색 정장의 호텔 그룹 회장','hotelChairman'],
 ['ep1b09','사이보그 회장 · 생체 부트로더','cyborgChairman'],['kair08','대수문장 05','greatGatekeeper05'],['kair03','세이렌 모르','sirenMor'],
 ['ep1a08','병원 심부의 집도의','surgeon'],['ep1a09','중독을 부르는 주사기 환영체','syringe'],['cult05','ID 생체조 관리자','cultivationManager'],
 ['cult06','기계재판 집행핵','judicialCore'],['cult04','적그리스도 배양좌',null]];
for(const [zone,name,kind] of CASES){
 await go(p,zone);
 const id=await p.evaluate(name=>{player.hp=player.maxHp=1e6;for(const e of room.enemies)e.damage=0;
  const s=room.enemies.find(e=>e.hp>0&&String(e.name).replace(/^중간보스 · /,'')===name);if(!s)return null;
  s.hp=s.maxHp=1e7;s.speed=0;if('spawnState'in s)s.spawnState='active';s.visible=true;s.x=player.x-1.4;s.y=player.y-1.0;s.homeX=s.x;s.homeY=s.y;s.nav=[];
  for(const o of room.enemies)if(o!==s&&Math.hypot(o.x-player.x,o.y-player.y)<5){o.x+=25;o.homeX=o.x;}window.__s=s;return String(s.id);},name);
 if(!id){ok(false,zone+' '+name+' 찾기');continue;}
 if(kind===null){await p.waitForTimeout(4000);const J=await API();const k=await p.evaluate(id=>window.__STORYWORLD_BOSS3D_R1322C__.kindOf(id),id);
  ok(!J.instances.some(x=>x.id===id&&x.visible)&&!k,zone+' '+name+' 는 요청 밖 보스 → 2D 그대로('+k+')');continue;}
 await p.waitForFunction(id=>window.__STORYWORLD_BOSS3D_R1322C__.inspect().instances.some(x=>x.id===id&&x.visible&&x.target>8),id,{timeout:150000}).catch(()=>{});
 await p.waitForTimeout(2500);
 const J=await API();const it=J.instances.find(x=>x.id===id);ok(it&&it.visible&&it.kind===kind,zone+' '+name+' → '+kind+' 3D ('+(it&&it.kind)+')');
 const body=await p.evaluate(id=>{const h=window.__STORYWORLD_PHASE1__.controller.state.three;return new Promise(res=>{const base=h.commands.render;h.commands.render=function(cmds){const out=base.apply(this,arguments);h.commands.render=base;
  res(cmds.filter(c=>c?.owner&&!c.owner.r350&&(c.owner.id==='enemy:'+id||c.owner.id==='r248:mob:'+id)&&c.kind==='image'&&!/(^|[\/_.-])(fx|sigil|smoke|shadow|bar|spark|aura|halo|proj)([\/_.-]|$)/i.test(String(c.sourcePath||''))).length);return out;};});},id);
 ok(body===0,zone+' '+name+' 2D 몸 그림 빠짐('+body+')');
 const m=await p.evaluate(id=>window.__STORYWORLD_BOSS3D_R1322C__.measure(id),id);
 ok(m&&m.target>8&&m.h>=m.target*.75&&m.h<=m.target*1.3,zone+' '+name+' 3D 키 '+Math.round(m?.h)+'px / 2D 보이는 키 '+Math.round(m?.target)+'px');
 await p.screenshot({path:path.join(HERE,'r1322c-'+kind+'.png')});
}
await p.evaluate(()=>window.__STORYWORLD_BOSS3D_R1322C__.set(false));await p.waitForTimeout(1200);I=await API();ok(I.shown===0,'끄기 → 3D 0 ('+I.shown+')');
ok(!errs.length,'페이지 오류 0 '+errs.slice(0,2).join(' | '));ok(I.stats.errors===0,'오버레이 오류 0 '+(I.lastError||''));
await p.evaluate(()=>window.__STORYWORLD_BOSS3D_R1322C__.set(true));
console.log(fail?'R1322c BROWSER FAIL '+fail:'R1322c BROWSER ALL OK');await b.close();process.exit(fail?1:0);
