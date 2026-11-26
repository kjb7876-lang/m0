// R1329 거미동굴·늪지대 3D — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  ① 자동 검사 기본값 꺼짐 ② ?mob3d29=1 로 모델 있는 종류 모두 읽힘(실패 0)
//  ③ 모델 있는 종류마다 그 몹을 영웅 곁에 두고: 3D 로 보이고 종류가 맞음, 2D 몸 그림 빠짐, 3D 키가 2D 보이는 키의 .75~1.3배
//  ④ 늪 뿌리 추적자: 첫 맵 모델에 2D 늪 그림 색 맞춤 → 3D 평균색×배율이 2D 평균색에 가까워지고(차이 절반 이하), 초록이 가장 큼
//  ⑤ 거미줄에 묶인 수호병·늪에서 되살아난 혼령체는 2D 그대로 ⑥ 모델 대기 종류는 2D 그대로·오류 없음(R1329_FULL=1 이면 Dots 7종 모두 3D 여야 통과)
//  ⑦ 끄기 → 3D 0 ⑧ 페이지 오류 0·오버레이 오류 0. 화면은 r1329-<kind>.png.
// 실행: 정적 서버(http://127.0.0.1:4410/m0/) 뒤 `node r96/qa/r1329/r1329-browser.mjs`
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {chromium,boot,go,skip,URL as BASE} from '../r444/lib.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url));const FULL=process.env.R1329_FULL==='1';
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errs=[];
{const {p,ctx}=await boot(b,{vp:{width:640,height:360}});p.on('pageerror',e=>errs.push(String(e)));await go(p,'dist02');
 ok(await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1329__?.on?.())===false,'자동 검사 기본값 꺼짐');
 await p.waitForTimeout(1500);ok(await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1329__.inspect().shown)===0,'꺼져 있으면 3D 0');await ctx.close();}
const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));
await p.goto(BASE+'?mob3d29=1');await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
const API=()=>p.evaluate(()=>window.__STORYWORLD_MOB3D_R1329__.inspect());
const kinds=await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1329__.kinds);
const ready=Object.keys(kinds).filter(k=>kinds[k]);const pending=Object.keys(kinds).filter(k=>!kinds[k]);
ok(ready.includes('swampStalker')&&ready.includes('bloodHound'),'늪 뿌리 추적자(첫 맵 재사용)·피냄새 추적자(Dots 06) 모델 경로 있음');
if(FULL)ok(!pending.length,'R1329_FULL: Dots 7종 모두 모델 있음(대기 '+pending.join(',')+')');
await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1329__.preload());
await p.waitForFunction(n=>{const I=window.__STORYWORLD_MOB3D_R1329__.inspect();return I.loaded.length+I.failed.length>=n;},ready.length,{timeout:600000}).catch(()=>{});
let I=await API();ok(I.loaded.length===ready.length&&I.failed.length===0,'모델 읽음 '+I.loaded.length+'/'+ready.length+', 실패 '+JSON.stringify(I.failed)+' '+(I.lastError||''));
const CASES=[['dist01','보랏빛 알집지기','eggkeeper'],['dist01','보랏빛 알집지기 우두머리','eggkeeper'],['dist01','중간보스 · 보랏빛 알집지기','eggkeeper'],['dist01','보라검천사','violetAngel'],
 ['dist02','수렁 주문사','swampMage'],['dist02','늪의 뿔악마 군주','hornLord'],['dist02','늪 뿌리 추적자','swampStalker'],['dist03','피냄새 추적자','bloodHound'],['dist03','피냄새 추적자 우두머리','bloodHound'],['dist03','핏빛 수호로 추격자','bloodPursuer'],['dist06','발록 · 지옥의 문지기','balrog'],
 ['dist01','거미줄에 묶인 수호병',null],['dist02','늪에서 되살아난 혼령체',null]];
const place=(name)=>p.evaluate(name=>{player.hp=player.maxHp=1e6;for(const e of room.enemies)e.damage=0;
  const s=room.enemies.find(e=>e.hp>0&&String(e.name).replace(/\s+(후속 증원|증원|추격대|\d+)$/,'')===name);if(!s)return null;
  s.hp=s.maxHp=1e7;s.speed=0;if('spawnState'in s)s.spawnState='active';s.visible=true;s.x=player.x-1.4;s.y=player.y-1.0;s.homeX=s.x;s.homeY=s.y;s.nav=[];
  for(const o of room.enemies)if(o!==s&&Math.hypot(o.x-player.x,o.y-player.y)<6){o.x+=25;o.homeX=o.x;}return String(s.id);},name);
const body2D=id=>p.evaluate(id=>{const h=window.__STORYWORLD_PHASE1__.controller.state.three;return new Promise(res=>{const base=h.commands.render;h.commands.render=function(cmds){const out=base.apply(this,arguments);h.commands.render=base;
  res(cmds.filter(c=>c?.owner&&!c.owner.r350&&(c.owner.id==='enemy:'+id||c.owner.id==='r248:mob:'+id)&&c.kind==='image'&&!/(^|[\/_.-])(fx|sigil|smoke|shadow|bar|spark|aura|halo|proj)([\/_.-]|$)/i.test(String(c.sourcePath||''))).length);return out;};});},id);
for(const [zone,name,kind] of CASES){
 await go(p,zone);const id=await place(name);
 if(!id){ok(false,zone+' '+name+' 찾기');continue;}
 if(kind===null||pending.includes(kind)){await p.waitForTimeout(4000);const J=await API();
  ok(!J.instances.some(x=>x.id===id&&x.visible)&&(await body2D(id))>0,zone+' '+name+' → 2D 그대로'+(kind?'(모델 대기)':''));continue;}
 await p.waitForFunction(id=>window.__STORYWORLD_MOB3D_R1329__.inspect().instances.some(x=>x.id===id&&x.visible&&x.target>8),id,{timeout:150000}).catch(()=>{});
 await p.waitForTimeout(2500);
 const J=await API();const it=J.instances.find(x=>x.id===id);ok(it&&it.visible&&it.kind===kind,zone+' '+name+' → '+kind+' 3D ('+(it&&it.kind)+')');
 const n=await body2D(id);ok(n===0,zone+' '+name+' 2D 몸 그림 빠짐('+n+')');
 const m=await p.evaluate(id=>window.__STORYWORLD_MOB3D_R1329__.measure(id),id);
 ok(m&&m.target>8&&m.h>=m.target*.75&&m.h<=m.target*1.3,zone+' '+name+' 3D 키 '+Math.round(m?.h)+'px / 2D 보이는 키 '+Math.round(m?.target)+'px');
 const tn=await p.evaluate(id=>window.__STORYWORLD_MOB3D_R1329__.tintOf(id),id);
 if(tn){const d0=Math.hypot(...tn.a2.map((v,c)=>v-tn.a3[c])),d1=Math.hypot(...tn.a2.map((v,c)=>v-tn.a3[c]*tn.t[c]));
  ok(d1<=d0*.5+.02,zone+' '+name+' 색 맞춤: 2D 와 색 차 '+d0.toFixed(3)+' → '+d1.toFixed(3));
  if(kind==='swampStalker')ok(tn.a2[1]>tn.a2[0]&&tn.a2[1]>tn.a2[2]&&tn.a3[1]*tn.t[1]>tn.a3[0]*tn.t[0]&&tn.a3[1]*tn.t[1]>tn.a3[2]*tn.t[2],'늪 뿌리 추적자 3D 색이 초록 늪색('+JSON.stringify(tn)+')');}
 else ok(false,zone+' '+name+' 색 맞춤 값 없음');
 await p.screenshot({path:path.join(HERE,'r1329-'+kind+(name.endsWith('우두머리')?'-leader':name.startsWith('중간보스')?'-mid':'')+'.png')});
}
await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1329__.set(false));await p.waitForTimeout(1200);I=await API();ok(I.shown===0,'끄기 → 3D 0 ('+I.shown+')');
ok(!errs.length,'페이지 오류 0 '+errs.slice(0,2).join(' | '));ok(I.stats.errors===0,'오버레이 오류 0 '+(I.lastError||''));
await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1329__.set(true));
console.log(fail?'R1329 BROWSER FAIL '+fail:'R1329 BROWSER ALL OK');await b.close();process.exit(fail?1:0);
