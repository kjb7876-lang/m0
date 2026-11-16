// R1112 헤드리스 확인: 히든 영웅 EGO 가 사몽각성·사몽 오라·수묵 몸 그림 어디서도 환도로 보이지 않는가(헤드리스 소프트웨어 렌더링 — GPU·실기기·자연 플레이 확인 아님).
//  실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1112/r1112-browser.mjs [스크린샷 폴더]
//  ① 사몽각성(F 7회 → 死夢覺醒) 컷인 그림·이름이 EGO(환도 초상·'환도' 아님), 가운데 큰 컷인(sw8)도 EGO 그림
//  ② 사몽 불꽃 오라 색이 EGO 고유색(언주+흰) — 환도 은·금 아님
//  ③ 수묵 켜진 EGO 가 시작부터 원본 3D 칸(r1048 몸 그림)을 한 번도 그리지 않는다(굽기 전 원본↔수묵 섞임 없음), 48장 미리 구운 그림이 짧은 시간 안에 준비됨
//  ④ 얼굴 조각은 앞쪽(s·se·sw)에만 — 옆(e·w)에 가면 덩어리 없음
import {createRequire} from 'node:module';import fs from 'node:fs';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',SH=process.argv[2]||'';if(SH)fs.mkdirSync(SH,{recursive:true});
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,400):''));};
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('.heroRowR101 button[data-hero="hwando"]').waitFor({timeout:30000});await p.waitForTimeout(800);
await p.evaluate(()=>{const E=window.__STORYWORLD_EGO_SOVEREIGN_R1046__;E.unlock?.('qa');E.refresh?.();});await p.waitForTimeout(600);
await p.locator('#panel [data-ego-r1046]').first().click();await p.waitForTimeout(300);
// ⑤ 영웅 선택 칸: HIDDEN 표가 EGO 그림 위쪽(머리·광륜)을 덮지 않는다
{const r=await p.evaluate(()=>{const c=document.querySelector('#panel [data-ego-r1046]'),t=c?.querySelector('.r1046tag'),im=c?.querySelector('img');if(!t||!im)return null;const a=t.getBoundingClientRect(),b=im.getBoundingClientRect();return{tagTop:a.top,tagBottom:a.bottom,imgTop:b.top,imgBottom:b.bottom};});
 ok(r&&r.tagTop>r.imgTop+(r.imgBottom-r.imgTop)*.6,'HIDDEN 표가 EGO 칸 그림 위쪽을 덮지 않음',r);if(SH)await p.screenshot({path:SH+'/select.png'});}
// 시작 순간부터 렌더러가 받는 영웅 몸 명령을 센다(원본 3D 칸 = r1048 경로 그대로, 수묵 = r1099:ink)
await p.evaluate(()=>{window.__r1112={raw:0,ink:0,rawAt:[],frames:0};const tag=()=>{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(!r||r.__r1112)return;r.__r1112=true;const base=r.render;
  r.render=function(f){const out=base.apply(this,arguments);try{if(window.__STORYWORLD_EGO_SOVEREIGN_R1046__?.formActive?.()&&window.__STORYWORLD_EGO_INK_R1099__?.active?.()){window.__r1112.frames++;
   for(const c of f?.commands||[]){if(c?.kind!=='image'||c.owner?.kind!=='hero'||c.owner?.r1048fx)continue;const sp=String(c.sourcePath||'');if(!(c.style?.globalAlpha>0.05))continue;
    if(/^r1099:ink:/.test(sp))window.__r1112.ink++;else if(/assets\/r1048\/ego\/(idle|walk|run|attack|hit|discard)-/.test(sp)){window.__r1112.raw++;if(window.__r1112.rawAt.length<5)window.__r1112.rawAt.push(sp.replace(/^.*r1048\/ego\//,'').slice(0,40));}}}}catch(_){}return out;};};
 setInterval(tag,50);});
await p.locator('#slotConfirmR73').click();await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
const waitG=s=>p.evaluate(async s=>{const t0=time;for(let i=0;i<4000&&time-t0<s;i++)await new Promise(r=>setTimeout(r,25));},s);
await p.evaluate(()=>{player.invincible=1e6;});
// ③ 시작 직후 걷기·공격·방향 바꾸기(처음 보는 동작이 곧바로 나오게)
for(const d of [[1,0],[0,1],[-1,0],[0,-1]]){await p.evaluate(([dx,dy])=>{window.__w=setInterval(()=>{player.x+=dx*.04;player.y+=dy*.04;},16);},d);await waitG(.4);await p.evaluate(()=>clearInterval(window.__w));
 await p.keyboard.press('KeyA');await p.evaluate(()=>{if(!(player.attackAnim>0))player.attackAnim=.35;});await waitG(.3);}
const mix=await p.evaluate(()=>({...window.__r1112,st:window.__STORYWORLD_EGO_INK_R1099__.inspect()}));
ok(mix.frames>20&&mix.ink>0,'수묵 EGO 몸이 그려짐',{frames:mix.frames,ink:mix.ink});
ok(mix.raw===0,'수묵 켬 상태에서 원본 3D 칸이 섞여 그려지지 않음(시작부터)',{raw:mix.raw,at:mix.rawAt});
ok(mix.st.ready>=48,'수묵 시트 48장 모두 준비',{ready:mix.st.ready,queued:mix.st.queued});
// ④ 얼굴 방향
const fd=await p.evaluate(()=>window.__STORYWORLD_EGO_INK_R1099__.faceDirs?.()||null);
ok(Array.isArray(fd)&&fd.every(d=>['s','se','sw'].includes(d))&&fd.includes('s'),'얼굴 조각은 앞쪽(s·se·sw)만',fd);
// ① 사몽각성
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
await p.evaluate(()=>window.__STORYWORLD_CHEAT777__.goSamong(5,'survival',{force:true}));await p.waitForFunction(()=>!loading&&layer==='DREAM',null,{timeout:200000});await skip();
await p.evaluate(()=>{player.invincible=1e6;player.hp=maxHP();player.egoCount=6;player.resonance=100;player.egoCD=0;player.ego=0;});
const form=await p.evaluate(()=>window.__STORYWORLD_EGO_SOVEREIGN_R1046__.formActive());ok(form===true,'사몽 세계에서도 EGO 형상',form);
await p.keyboard.press('KeyF');
const cut=await p.evaluate(async()=>{for(let i=0;i<40&&!(player.samong>0);i++)await new Promise(r=>setTimeout(r,50));const sw=document.querySelector('#sw8Awakening img');
 return {samong:player.samong,src:document.getElementById('awakeImage')?.getAttribute('src')||'',name:document.getElementById('awakeHero')?.textContent||'',sw8:sw?.getAttribute('src')||'',sw8on:!!document.getElementById('sw8Awakening')?.classList.contains('on')};});
if(SH)await p.screenshot({path:SH+'/samong-cutin.png'});
ok(cut.samong>0,'F 일곱 번째 → 사몽각성',cut.samong);
ok(/r1046\/ego-cutin/.test(cut.src)&&!/hwando|r108\/heroes|rc91/.test(cut.src),'사몽각성 컷인 그림 = EGO',cut.src);
ok(/^마지막 수호자 EGO/.test(cut.name)&&!/환도/.test(cut.name),'사몽각성 컷인 이름 = EGO(환도 아님)',cut.name);
ok(!cut.sw8on||/r1046\/ego-cutin/.test(cut.sw8),'가운데 큰 컷인도 EGO 그림',cut);
// ② 오라 색
const pal=await p.evaluate(()=>window.__STORYWORLD_SAMONG_SURGE_R571__.palette('hwando'));
ok(pal&&pal.main[0]>150&&pal.main[1]<90&&pal.main[2]<90,'사몽 오라 바깥색 = 언주(붉음), 환도 은빛 아님',pal);
ok(pal&&Math.min(...pal.sub)>200,'사몽 오라 안쪽색 = 흰빛',pal);
await waitG(.6);if(SH)await p.screenshot({path:SH+'/samong-aura.png'});
// 형상을 끄면(환도) 환도 색·환도 컷인으로 돌아감 — 회귀
await p.evaluate(()=>{player.samong=0;window.__STORYWORLD_EGO_SOVEREIGN_R1046__.setForm(false);});await waitG(.2);
const pal2=await p.evaluate(()=>window.__STORYWORLD_SAMONG_SURGE_R571__.palette('hwando'));
ok(pal2&&pal2.main[2]>200,'EGO 끄면 환도 오라 색(은빛) 그대로',pal2);
ok(errs.length===0,'페이지 오류 0',errs);
await b.close();console.log(`\nR1112 browser: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
