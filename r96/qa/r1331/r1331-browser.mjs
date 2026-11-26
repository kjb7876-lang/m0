// R1331 3D 얼굴 — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  R1322c 사람 얼굴 보스 4종(서윤 ep1b05·세이렌 모르 kair03·호텔 회장 ep1b08·사이보그 회장 ep1b09)을 영웅 곁에 두고 ?boss3d22c=1 에서 face31=0(지금)/1(바뀜) 두 번 찍는다.
//  ① 켜면 데칼이 그 보스 3D 의 머리 뼈에 붙음 ② 먹선 가림 적용 ③ 꺼짐이면 데칼 0 ④ 오류 0. 화면: r1331-<kind>-<0|1>.png(보스 주변 확대).
// 실행: 정적 서버(http://127.0.0.1:4410/m0/) 뒤 `node r96/qa/r1331/r1331-browser.mjs`
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {chromium,go,skip,URL as BASE} from '../r444/lib.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const CASES=[['ep1b05','붉은 하이힐의 서윤','seoyun'],['kair03','세이렌 모르','sirenMor'],['ep1b08','백색 정장의 호텔 그룹 회장','hotelChairman'],['ep1b09','사이보그 회장 · 생체 부트로더','cyborgChairman']];
for(const face of [0,1]){
 const errs=[];const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(BASE+'?boss3d22c=1&face31='+face);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
 ok(await p.evaluate(()=>window.__STORYWORLD_FACE_R1331__?.on?.())===!!face,'face31='+face+' → on '+!!face);
 for(const [zone,name,kind] of CASES){await go(p,zone);
  const id=await p.evaluate(name=>{player.hp=player.maxHp=1e6;for(const e of room.enemies)e.damage=0;
   const s=room.enemies.find(e=>e.hp>0&&String(e.name).replace(/^중간보스 · /,'')===name);if(!s)return null;
   s.hp=s.maxHp=1e7;s.speed=0;if('spawnState'in s)s.spawnState='active';s.visible=true;s.x=player.x-1.4;s.y=player.y-1.0;s.homeX=s.x;s.homeY=s.y;s.nav=[];
   for(const o of room.enemies)if(o!==s&&Math.hypot(o.x-player.x,o.y-player.y)<5){o.x+=25;o.homeX=o.x;}return String(s.id);},name);
  if(!id){ok(false,zone+' '+name+' 찾기');continue;}
  await p.waitForFunction(id=>window.__STORYWORLD_BOSS3D_R1322C__.inspect().instances.some(x=>x.id===id&&x.visible&&x.target>8),id,{timeout:300000}).catch(()=>{});
  await p.waitForTimeout(2500);
  const r=await p.evaluate(id=>{const h=window.__STORYWORLD_PHASE1__.controller.state.three;let g=null;h.scene.traverse(o=>{if(o.name==='r1322c-mob3d:'+id)g=o;});if(!g)return null;
   let decal=null,head=null,masked=0,shells=0;g.traverse(o=>{if(o.name==='r1331-face-decal')decal=o;if(o.isBone&&o.name==='Head')head=o;if(o.userData?.r1322cInk){shells++;if(/r1331-face-mask/.test(o.material.customProgramCacheKey?.()||''))masked++;}});
   const m=window.__STORYWORLD_BOSS3D_R1322C__.measure(id);return {decal:!!decal,parentIsHead:!!decal&&decal.parent===head,layer:decal?.layers.mask,shells,masked,m:m&&{top:m.top,bottom:m.bottom,left:m.left,right:m.right}};},id);
  ok(!!r,zone+' '+name+' 3D 그룹 있음');if(!r)continue;
  if(face){ok(r.decal&&r.parentIsHead&&r.layer===4,zone+' '+name+' 데칼이 머리 뼈에 붙고 층 2');ok(r.shells>0&&r.masked===r.shells,zone+' '+name+' 먹선 껍데기 얼굴 가림 '+r.masked+'/'+r.shells);}
  else{ok(!r.decal&&r.masked===0,zone+' '+name+' 꺼짐 → 데칼·가림 없음');}
  const m=r.m;if(m&&Number.isFinite(m.top)){const cx=(m.left+m.right)/2,w=Math.max(120,(m.right-m.left)*1.3),h=Math.max(200,(m.bottom-m.top)*1.15);
   await p.screenshot({path:path.join(HERE,`r1331-${kind}-${face}.png`),clip:{x:Math.max(0,cx-w/2),y:Math.max(0,m.top-h*.06),width:Math.min(w,960),height:Math.min(h,540)}});}
  else await p.screenshot({path:path.join(HERE,`r1331-${kind}-${face}.png`)});
 }
 const I=await p.evaluate(()=>window.__STORYWORLD_FACE_R1331__.inspect());ok(I.stats.errors===0,'오버레이 오류 0 '+(I.lastError||''));
 const J=await p.evaluate(()=>window.__STORYWORLD_BOSS3D_R1322C__.inspect());ok(J.stats.errors===0,'R1322c 오류 0 '+(J.lastError||''));
 ok(!errs.length,'페이지 오류 0 '+errs.slice(0,2).join(' | '));await ctx.close();}
console.log(fail?'R1331 BROWSER FAIL '+fail:'R1331 BROWSER ALL OK');await b.close();process.exit(fail?1:0);
