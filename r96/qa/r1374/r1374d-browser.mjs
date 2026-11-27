// R1374d 브라우저 검사(헤드리스 Chromium + SwiftShader — 그래픽·실기기·자연 플레이 검증 아님).
//  사용자 11-27 "모든 경우 3D 영웅, 2D 는 스킬 이펙트·소환용만", "무한생존도 플레이어는 3d", "배치영웅만 2d".
//  A 스토리: 설정에서 3D 를 껐던 사람('off', R1327 되돌리기 키까지) → 조종 영웅 3D 켜짐·보임, 설정 창 체크 잠김·"항상 켬", 눌러도·set(false) 해도 다시 켜짐.
//  B 무한생존: 'off' 로 시작 → 조종 영웅 3D 보임, 배치 영웅 몸은 2D 그림(3D 아님). 오류 0.
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1374/r1374d-browser.mjs`
import {chromium,boot,go,URL} from '../r444/lib.mjs';
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};const KEY='storyworld.r1302.hwando3d';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const shown=(p,ms=240000)=>p.waitForFunction(()=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return i.shown&&i.hero===player.hero;},null,{timeout:ms}).then(()=>true).catch(()=>false);
const I=p=>p.evaluate(K=>({key:localStorage.getItem(K),on:window.__STORYWORLD_HWANDO3D_R1302__.on(),a:window.__STORYWORLD_HERO3D_ALWAYS_R1374D__?.inspect?.()||null,err:window.__STORYWORLD_HWANDO3D_R1302__.inspect().errors}),KEY);
// A
{const {ctx,p}=await boot(b,{vp:{width:640,height:400},init:{[KEY]:'off','storyworld.r1327.default3d':'off'}});await go(p,process.env.ZONE||'dist00');
 const s=await I(p);ok(s.key==='on'&&s.on===true,'A 껐던 사람도 3D 켜짐 '+JSON.stringify(s));
 ok(await shown(p),'A 조종 영웅 3D 보임');
 const ui=await p.evaluate(async()=>{showSettings();await new Promise(r=>setTimeout(r,1500));const d=document.getElementById('hwando3dR1302Row'),el=document.getElementById('hwando3dR1302Toggle');return d?{checked:el?.checked,disabled:el?.disabled,text:d.textContent}:null;});
 ok(ui&&ui.checked===true&&ui.disabled===true&&/항상 켬/.test(ui.text)&&!/끄면 2D|시험/.test(ui.text),'A 설정 창: 체크 켜진 채 잠김, "항상 켬" '+JSON.stringify(ui));
 await p.evaluate(()=>{const el=document.getElementById('hwando3dR1302Toggle');el.disabled=false;el.click();});await p.waitForTimeout(1200);
 let t=await I(p);ok(t.on===true&&t.key==='on','A 체크를 억지로 눌러도 다시 켜짐 '+JSON.stringify({on:t.on,key:t.key}));
 await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.set(false));await p.waitForTimeout(1200);
 t=await I(p);ok(t.on===true&&await shown(p,60000),'A set(false) 해도 다시 켜지고 보임');
 ok(t.err===0&&(t.a?.errors||0)===0,'A 오류 0 '+JSON.stringify({r1302:t.err,r1374d:t.a?.errors}));await ctx.close();}
// B
{const ctx=await b.newContext({viewport:{width:640,height:360}});
 await ctx.addInitScript(K=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem(K,'off');},KEY);
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:180000});
 await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="hwando"]').click();await p.locator('#r600Go').click();
 await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
 await p.evaluate(()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration());
 ok(await shown(p),'B 무한생존 조종 영웅 3D 보임(껐던 사람도)');
 const placed=await p.evaluate(()=>{window.__AL=0;window.__AL3=0;const base=drawHero;drawHero=function(...a){const pl=player;if(!pl||!pl.r720Ally)return base.apply(this,a);const st=Array.isArray(ctx.commands)?ctx.commands.length:-1;const r=base.apply(this,a);
   if(st>=0)for(let i=st;i<ctx.commands.length;i++){const c=ctx.commands[i];if(c.kind==='image'&&c.owner?.kind==='hero'){window.__AL++;break;}}return r;};
  const D=window.__STORYWORLD_HERO_DEFENSE_R720__;D.qaGive(5000);const z=room.survivalR600.centre;player.x=z.x+1.6;player.y=z.y+1.2;const res=D.buy('slayer');player.x=z.x;player.y=z.y+2;return res;});
 ok(placed&&placed.ok&&placed.placed,'B 배치 영웅 1명(슬레이어) '+JSON.stringify(placed));
 const t0=await p.evaluate(()=>time);await p.waitForFunction(a=>time>=a,t0+2,{timeout:600000});
 const r=await p.evaluate(()=>({al:window.__AL,h3:window.__STORYWORLD_HWANDO3D_R1302__.inspect(),hero:player.hero,ally:!!player.r720Ally}));
 ok(r.al>=10,'B 배치 영웅 몸은 2D 그림으로 그려짐(그린 횟수 '+r.al+')');
 ok(r.h3.on===true&&r.h3.shown===true&&r.h3.hero==='hwando'&&r.hero==='hwando'&&!r.ally,'B 3D 는 조종 환도 하나(배치 몸은 3D 아님) '+JSON.stringify({on:r.h3.on,shown:r.h3.shown,hero:r.h3.hero}));
 ok(errs.length===0&&r.h3.errors===0,'B 오류 0 '+JSON.stringify(errs.slice(0,3)));await ctx.close();}
await b.close();console.log(fail?'\nR1374d 브라우저 FAIL '+fail:'\nR1374d 브라우저 PASS');process.exit(fail?1:0);
