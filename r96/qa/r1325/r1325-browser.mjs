// R1325 브라우저 검사 + 전후 사진(헤드리스 Chromium + SwiftShader — 그래픽 검증 아님).
//  cult05: 'ID 배양 점액체'(3D, R1322) 옆에 'ID 배양 점액체 우두머리'(HOLD → 2D 그대로)를 두고
//  ① 2D 만(3D 끔) ② 3D(R1325 끔) ③ 3D + R1325 를 같은 자리에서 찍는다.
//  검사: 자세 끊기(held>0), 몸·먹 재질 손질됨, 끄면 원래대로, 오류 0.
// 실행: 정적 서버(http://127.0.0.1:4410/m0/) 뒤 `node r96/qa/r1325/r1325-browser.mjs` (OUT=디렉터리 로 사진 위치 지정)
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url)),OUT=process.env.OUT||HERE;
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const waitGame=async(p,sec)=>{const t0=await p.evaluate(()=>time);for(let n=0;n<240;n++){await skip(p);if(await p.evaluate(t=>time>t,t0+sec))break;await p.waitForTimeout(1000);}};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errs=[];const {p}=await boot(b,{vp:{width:960,height:540},init:{'storyworld.r1322.mob3d':'on','storyworld.r1325.mobstyle':'off'}});p.on('pageerror',e=>errs.push(String(e)));
await go(p,'cult05');await skip(p);
const ids=await p.evaluate(()=>{player.hp=player.maxHp=1e6;for(const e of room.enemies)e.damage=0;
 const a=room.enemies.find(e=>!e.boss&&e.hp>0&&e.name==='ID 배양 점액체'),c=room.enemies.find(e=>e.hp>0&&String(e.name).replace(/^중간보스 · /,'')==='ID 배양 점액체 우두머리');if(!a||!c)return null;
 const put=(s,dx,dy)=>{s.hp=s.maxHp=1e7;s.speed=0;s.visible=true;if('spawnState'in s)s.spawnState='active';s.x=player.x+dx;s.y=player.y+dy;s.homeX=s.x;s.homeY=s.y;s.nav=[];};
 put(a,1.7,-2.3);put(c,.5,-1.3);for(const o of room.enemies)if(o!==a&&o!==c&&Math.hypot(o.x-player.x,o.y-player.y)<7){o.x+=30;o.homeX=o.x;}
 window.__pin=()=>{for(const [s,dx,dy] of [[a,1.7,-2.3],[c,.5,-1.3]]){s.x=player.x+dx;s.y=player.y+dy;}};return [String(a.id),String(c.id)];});
ok(!!ids,'cult05 ID 배양 점액체(3D)·우두머리(2D) 찾음');
await p.waitForFunction(id=>window.__STORYWORLD_MOB3D_R1322__.inspect().instances.some(x=>x.id===id&&x.visible),ids[0],{timeout:200000}).catch(()=>{});
const shot=async(name)=>{await p.evaluate(()=>window.__pin());await waitGame(p,.6);await p.evaluate(()=>window.__pin());await p.waitForTimeout(800);await p.screenshot({path:path.join(OUT,name)});};
await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1322__.set(false));await shot('r1325-a-2d-only.png');
await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1322__.set(true));await waitGame(p,1);await shot('r1325-b-3d-before.png');
let S=await p.evaluate(()=>window.__STORYWORLD_MOB3D_STYLE_R1325__.inspect());ok(S.on===false&&S.patched.body===0,'끈 상태: 손질 0');
// R1325b 뒤 기본은 색 맞춤만 → 이 검사는 효과 넷을 모두 켜고 전체 동작을 본다.
await p.evaluate(()=>window.__STORYWORLD_MOB3D_STYLE_R1325__.setParts('fbit'));
await p.evaluate(()=>window.__STORYWORLD_MOB3D_STYLE_R1325__.set(true));await waitGame(p,1.5);await shot('r1325-c-3d-after.png');
S=await p.evaluate(()=>window.__STORYWORLD_MOB3D_STYLE_R1325__.inspect());
ok(S.patched.body>0&&S.patched.ink>0,'몸·먹 재질 손질 '+JSON.stringify(S.patched));
ok((S.stats.tinted||0)>0&&S.lastTint,'2D 평균색 맞춤 '+JSON.stringify(S.lastTint));
// 헤드리스는 프레임 사이 게임 시간이 길어(약 .1초) 붙잡는 비율로는 못 잰다 → 같은 함수에 시간을 직접 넣어 본다.
const H=await p.evaluate(()=>{const h=window.__STORYWORLD_MOB3D_STYLE_R1325__.hold,i={pose:'idle'};return [h(i,10),h(i,10.04),h(i,10.09),h(i,10.1),h(i,10.15),(i.pose='attack',h(i,10.16))];});
ok(JSON.stringify(H)==='[false,true,true,false,true,false]','자세 끊기: 1/10초 안은 붙잡고, 지나거나 자세가 바뀌면 새로 '+JSON.stringify(H));
ok(S.stats.held>0&&S.stats.applied>0,'게임 중에도 붙잡기·적용 둘 다 일어남 held '+S.stats.held+' / applied '+S.stats.applied);
const keys=await p.evaluate(()=>{const h=window.__STORYWORLD_PHASE1__.controller.state.three;const out=[];for(const g of h.scene.children)if(/^r1322-mob3d:/.test(String(g.name||'')))g.traverse(o=>{if(o.isMesh)for(const m of [].concat(o.material))out.push(m.customProgramCacheKey?.()||'');});return out;});
ok(keys.some(k=>k.includes('|r1325-body'))&&keys.some(k=>k.includes('|r1325-ink')),'캐시 키에 r1325 몸·먹');
await p.evaluate(()=>window.__STORYWORLD_MOB3D_STYLE_R1325__.set(false));await waitGame(p,.5);
S=await p.evaluate(()=>window.__STORYWORLD_MOB3D_STYLE_R1325__.inspect());ok(S.patched.body===0&&S.patched.ink===0,'끄면 원래 재질');
const I=await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1322__.inspect());
ok(!errs.length,'페이지 오류 0 '+errs.slice(0,2).join(' | '));ok(S.stats.errors===0&&I.stats.errors===0,'오버레이 오류 0 '+(S.lastError||I.lastError||''));
console.log(fail?'R1325 BROWSER FAIL '+fail:'R1325 BROWSER ALL OK');await b.close();process.exit(fail?1:0);
