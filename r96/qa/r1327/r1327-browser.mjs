// R1327 영웅 3D 기본 켜짐 — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님). 사용자 11-26 "영웅은 3d를 기본으로하고".
//  ① 새 사용자(3D 키를 정한 적 없음): 아무 설정도 안 건드려도 3D 영웅이 켜져 보이고, 3D 키가 'on' 으로 저장된다.
//  ② 이미 끈 사람(3D 키 'off'): 3D 가 꺼진 채(2D 영웅), 키는 'off' 그대로.
//  ③ 설정 창: 체크 상자가 켜져 있고 설명이 "기본은 켬". 체크를 끄면 키가 'off' 로 저장된다(다음부터 꺼짐 — ② 와 같은 길).
//  ④ 경계: 되돌리기 키(storyworld.r1327.default3d=off)면 예전처럼 기본 끔. 영웅을 바꿔도 3D 유지. 오류 0.
//  (무한생존 배치 2D 타워형 영웅은 qa/r1305/r1305-tower-browser.mjs 가 본다 — R1302 active() 가 배치·소환 영웅을 3D 에서 뺀다.)
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1327/r1327-browser.mjs`
import {chromium,boot,go} from '../r444/lib.mjs';
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};const KEY='storyworld.r1302.hwando3d';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const open=async init=>{const {p}=await boot(b,{vp:{width:640,height:400},init});await go(p,process.env.ZONE||'dist00');return p;};
const state=p=>p.evaluate(K=>({key:localStorage.getItem(K),on:window.__STORYWORLD_HWANDO3D_R1302__.on(),i:window.__STORYWORLD_HWANDO3D_R1302__.inspect(),d:window.__STORYWORLD_HERO3D_DEFAULT_R1327__?.inspect?.(),hero:player.hero}),KEY);
const shown=(p,want)=>p.waitForFunction(w=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return w?i.shown&&i.hero===player.hero:!i.shown;},want,{timeout:240000}).then(()=>true).catch(()=>false);
// ① 새 사용자
{const p=await open(null);const s0=await state(p);
 ok(s0.key==='on'&&s0.on===true&&s0.d?.applied===true&&s0.d.before===null,'① 새 사용자: 3D 키 on, 켜짐 '+JSON.stringify({key:s0.key,on:s0.on,d:s0.d}));
 ok(await shown(p,true),'① 설정을 건드리지 않아도 3D 영웅이 보임('+s0.hero+')');
 // ④ 영웅 바꿔도 3D
 await p.evaluate(async()=>{const h=player.hero==='hwando'?'slayer':'hwando';try{await ensureImages(heroPaths(h));}catch(_){}player.hero=h;});ok(await shown(p,true),'④ 영웅을 바꿔도 3D 유지');
 // ③ 설정 창
 const ui=await p.evaluate(async()=>{showSettings();await new Promise(r=>setTimeout(r,1500));const d=document.getElementById('hwando3dR1302Row'),el=document.getElementById('hwando3dR1302Toggle');return d?{checked:el?.checked,text:d.textContent}:null;});
 ok(ui&&ui.checked===true&&/기본은 켬/.test(ui.text)&&!/시험|기본은 끔/.test(ui.text),'③ 설정 창: 체크 켜짐, 설명 "기본은 켬" '+JSON.stringify(ui));
 const off=await p.evaluate(K=>{const el=document.getElementById('hwando3dR1302Toggle');el.click();return {key:localStorage.getItem(K),on:window.__STORYWORLD_HWANDO3D_R1302__.on(),checked:el.checked};},KEY);
 ok(off.key==='off'&&off.on===false&&off.checked===false,'③ 체크를 끄면 키 off 저장 '+JSON.stringify(off));
 const s1=await state(p);ok(s1.i.errors===0&&s1.d.errors===0,'④ 오류 0');await p.context().close();}
// ② 이미 끈 사람
{const p=await open({[KEY]:'off'});await p.waitForTimeout(3000);const s=await state(p);
 ok(s.key==='off'&&s.on===false&&s.d?.applied===false&&s.d.before==='off','② 끈 사람: 키 off 그대로, 꺼짐 '+JSON.stringify({key:s.key,on:s.on}));
 ok(await shown(p,false)&&s.i.requests===0,'② 3D 영웅 안 보임, 모델 요청 0');await p.context().close();}
// ④ 되돌리기 키
{const p=await open({'storyworld.r1327.default3d':'off'});await p.waitForTimeout(2000);const s=await state(p);
 ok(s.key===null&&s.on===false&&s.d?.applied===false,'④ 되돌리기 키: 예전처럼 기본 끔 '+JSON.stringify({key:s.key,on:s.on}));await p.context().close();}
await b.close();console.log(fail?'\nR1327 브라우저 FAIL '+fail:'\nR1327 브라우저 PASS');process.exit(fail?1:0);
