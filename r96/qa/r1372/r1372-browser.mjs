// R1372 기계화 복종 봉인구만 기본 3D — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  ① 기본(설정·주소 없음, 자동 검사)으로 cult01 봉인구가 3D(orb), 같은 몹 2D 몸 30프레임 0, 키가 2D 보이는 키의 .75~1.3배
//  ② 기본에서 거짓천국 근위천사(ep1a11, R1317 다른 8종)는 3D 아님 ③ ?orb3d=0 이면 봉인구도 2D ④ 페이지·오버레이 오류 0
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1372/r1372-browser.mjs`
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {chromium,skip,go,URL as BASE} from '../r444/lib.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const API=p=>p.evaluate(()=>window.__STORYWORLD_MOB3D_R1317__.inspect());
const near=(p,name)=>p.evaluate(name=>{player.hp=player.maxHp=1e6;for(const e of room.enemies)e.damage=0;const strip=n=>String(n).replace(/^중간보스 · /,'').replace(/ (후속 증원|우두머리|증원|추격대)$/,'');
 const s=room.enemies.find(e=>!e.boss&&e.hp>0&&strip(e.name)===name);if(!s)return null;s.hp=s.maxHp=1e6;window.__t={s:s.id};s.x=player.x-1.4;s.y=player.y-1.0;s.homeX=s.x;s.homeY=s.y;s.nav=[];return String(s.id);},name);
async function run(query){const errs=[];const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();await p.goto(BASE+(query?'?'+query:''));await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);p.on('pageerror',e=>errs.push(String(e)));return {p,errs};}
// ①②④ 기본
{const {p,errs}=await run('');
 ok(await p.evaluate(()=>navigator.webdriver===true),'자동 검사 환경(webdriver)');
 ok(await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1317__.on()===false),'9종 시험 설정은 기본 꺼짐 그대로');
 await go(p,'cult01');const id=await near(p,'기계화 복종 봉인구');ok(!!id,'cult01 에서 기계화 복종 봉인구 찾음');
 if(id){await p.waitForFunction(id=>window.__STORYWORLD_MOB3D_R1317__.inspect().instances.some(x=>x.id===id&&x.visible),id,{timeout:180000}).catch(()=>{});
  await p.waitForTimeout(2000);let I=await API(p);ok(I.instances.some(x=>x.id===id&&x.kind==='orb'&&x.visible),'기본으로 봉인구 → orb 3D');
  const left=await p.evaluate(()=>{const h=window.__STORYWORLD_PHASE1__.controller.state.three;return new Promise(res=>{let n=0,bad=[];const base=h.commands.render;h.commands.render=function(cmds){const out=base.apply(this,arguments);
   for(const c of cmds)if(c?.kind==='image'&&!c.owner?.r350&&(c.owner?.id==='enemy:'+__t.s||c.owner?.id==='r248:mob:'+__t.s)&&!/(^|[\/_.-])(fx|sigil|smoke|shadow|bar)([\/_.-]|$)/i.test(String(c.sourcePath||'')))bad.push(String(c.sourcePath||'').slice(-60));
   if(++n>=30){h.commands.render=base;res(bad);}return out;};});});
  ok(left.length===0,'봉인구 2D 몸 30프레임 동안 0 '+JSON.stringify(left.slice(0,3)));
  const bs=await p.evaluate(id=>window.__STORYWORLD_MOB3D_R1317__.measure(id),id);
  ok(bs&&bs.target>8&&bs.h>=bs.target*.75&&bs.h<=bs.target*1.3,'봉인구 3D 키 '+Math.round(bs?.h)+'px / 2D 보이는 키 '+Math.round(bs?.target)+'px');
  await p.screenshot({path:path.join(HERE,'r1372-cult01-orb.png')});}
 await go(p,'ep1a11');const gid=await near(p,'거짓천국 근위천사');
 if(gid){await p.waitForTimeout(4000);const I=await API(p);ok(!I.instances.some(x=>x.id===gid&&x.visible),'기본에서 거짓천국 근위천사(다른 8종)는 2D');}
 else ok(false,'ep1a11 에서 거짓천국 근위천사 찾음');
 const I=await API(p);ok(!errs.length,'페이지 오류 0 '+errs.slice(0,3).join(' | '));ok(I.stats.errors===0,'오버레이 오류 0 '+(I.lastError||''));
 await p.close();}
// ③ ?orb3d=0
{const {p,errs}=await run('orb3d=0');await go(p,'cult01');const id=await near(p,'기계화 복종 봉인구');
 if(id){await p.waitForTimeout(5000);const I=await API(p);ok(!I.instances.some(x=>x.id===id&&x.visible),'?orb3d=0 이면 봉인구 2D');}else ok(false,'cult01 봉인구 찾음(orb3d=0)');
 ok(!errs.length,'페이지 오류 0(orb3d=0)');await p.close();}
console.log(fail?'R1372 BROWSER FAIL '+fail:'R1372 BROWSER ALL OK');await b.close();process.exit(fail?1:0);
