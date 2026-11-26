// R1342 브라우저 검사 + 전후 사진(헤드리스 Chromium + SwiftShader — 그래픽 검증 아님).
//  3D 몹 설정은 모두 기본(R1316·R1317 꺼짐)으로 두고 ep1b01(솔로몬의 봉인식, 이야기 층):
//  ① 이름 없던 공포 → R1317 nameless(봉인구 GLB) 3D, ② 유리 망령 → R1316 glass 3D,
//  ③ 제72문 보스는 어느 3D 오버레이에도 인스턴스 없음(2D 유지), ④ R1326 규칙을 끄면 2D 로 돌아감.
// 실행: 정적 서버 뒤 `node r96/qa/r1342/r1342-browser.mjs` (SW_URL 로 주소, OUT 으로 사진 위치)
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url)),OUT=process.env.OUT||HERE;
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const waitGame=async(p,sec)=>{const t0=await p.evaluate(()=>time);for(let n=0;n<200;n++){await skip(p);if(await p.evaluate(t=>time>t,t0+sec))break;await p.waitForTimeout(800);}};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errs=[];const {p}=await boot(b,{vp:{width:960,height:540},init:{}});p.on('pageerror',e=>errs.push(String(e)));
const place=names=>p.evaluate(names=>{player.hp=player.maxHp=1e6;for(const e of room.enemies)e.damage=0;const got=[];
 names.forEach((n,k)=>{const s=room.enemies.find(e=>e.hp>0&&String(e.name)===n);if(!s)return;s.hp=s.maxHp=1e7;s.speed=0;s.visible=true;if('spawnState'in s)s.spawnState='active';
  const dx=[-1.5,1.5,0][k]||0,dy=[-1,-1,-2.4][k]||-1;s.x=player.x+dx;s.y=player.y+dy;s.homeX=s.x;s.homeY=s.y;s.nav=[];got.push([String(s.id),dx,dy]);});
 window.__pin=()=>{for(const [id,dx,dy] of got){const s=room.enemies.find(e=>String(e.id)===id);if(s){s.x=player.x+dx;s.y=player.y+dy;}}};
 for(const o of room.enemies)if(!got.some(g=>g[0]===String(o.id))&&Math.hypot(o.x-player.x,o.y-player.y)<7){o.x+=30;o.homeX=o.x;}return got.map(g=>g[0]);},names);
const inst=(A,id)=>p.evaluate(([A,id])=>window[A]?.inspect?.().instances?.find(x=>x.id===id)||null,[A,id]);
const waitVis=(A,id,ms)=>p.waitForFunction(([A,id])=>window[A]?.inspect?.().instances?.some(x=>x.id===id&&x.visible),[A,id],{timeout:ms}).then(()=>true).catch(()=>false);
const A16='__STORYWORLD_MOB3D_R1316__',A17='__STORYWORLD_MOB3D_R1317__',FR=['idle','move','atkA','atkB','cast','hit','death','reveal'];
await go(p,'ep1b01');await skip(p);
const names=await p.evaluate(()=>[...new Set(room.enemies.map(e=>String(e.name)))]);console.log('ep1b01 몹:',names.join(' / '));
const boss=await p.evaluate(()=>{const e=room.enemies.find(e=>e.nativeId==='mb-ep1b01'||/제72문/.test(String(e.name)));return e?String(e.id):null;});
ok(!!boss,'제72문 보스 찾음');
const ids=await place(['이름 없던 공포','유리 망령','교만의 잔향 · 제72문']);ok(ids.length===3,'이름 없던 공포·유리 망령·보스 옆에 둠 '+ids.length);
const off=await p.evaluate(([a,b])=>({a:window[a].inspect().on,b:window[b].inspect().on}),[A16,A17]);ok(!off.a&&!off.b,'3D 몹 설정은 기본 꺼짐 그대로');
await p.evaluate(()=>window.__STORYWORLD_MOB3D_ZONE_R1326__.set(false));await waitGame(p,1);await p.evaluate(()=>window.__pin());await p.waitForTimeout(800);await p.screenshot({path:OUT+'/r1342-ep1b01-before.png'});
ok(!(await inst(A17,ids[0]))?.visible,'규칙 끄면 이름 없던 공포 2D(전)');
await p.evaluate(()=>window.__STORYWORLD_MOB3D_ZONE_R1326__.set(true));
ok(await waitVis(A17,ids[0],240000),'이름 없던 공포 3D(R1317) 나옴');
const k=await p.evaluate(([a,id])=>window[a].kindOf(id),[A17,ids[0]]);ok(k==='nameless','종류 nameless '+k);
ok(await waitVis(A16,ids[1],240000),'유리 망령 3D(R1316) 나옴');
await waitGame(p,1.5);await p.evaluate(()=>window.__pin());await p.waitForTimeout(1200);await p.screenshot({path:OUT+'/r1342-ep1b01-after.png'});
const bossAny=await p.evaluate(id=>Object.keys(window).filter(k=>/^__STORYWORLD_MOB3D_R13/.test(k)).some(k=>window[k]?.inspect?.().instances?.some(x=>x.id===id)),ids[2]);
ok(!bossAny,'제72문 보스 3D 인스턴스 없음(2D 유지)');
const ins=await p.evaluate(()=>window.__STORYWORLD_MOB3D_ZONE_R1326__.inspect());ok(ins.forced==='3d','inspect forced=3d '+JSON.stringify(ins));
const m=await p.evaluate(([a,id])=>window[a].measure?.(id),[A17,ids[0]]);console.log('이름 없던 공포 3D 측정',JSON.stringify(m));

// ---- R1342b: Dots 새 3D(인장 잔류체·외부 신호) + 제72문 보스 2D 모션 시트 ----
const i2=await place(['일흔두 번째 인장 잔류체','검은 실의 외부 신호']);ok(i2.length===2,'인장 잔류체·외부 신호 옆에 둠');
ok(await waitVis(A17,i2[0],240000),'인장 잔류체 3D 나옴');ok(await waitVis(A17,i2[1],240000),'외부 신호 3D 나옴');
const k2=await p.evaluate(([a,x,y])=>[window[a].kindOf(x),window[a].kindOf(y)],[A17,i2[0],i2[1]]);ok(k2[0]==='seal'&&k2[1]==='extSignal','종류 seal·extSignal '+k2);
await waitGame(p,1.5);await p.evaluate(()=>window.__pin());await p.waitForTimeout(1200);await p.screenshot({path:OUT+'/r1342b-ep1b01-new3d.png'});
for(const id of i2){const mm=await p.evaluate(([a,id])=>window[a].measure?.(id),[A17,id]);ok(mm&&mm.h>0&&Math.abs(mm.h/mm.target-1)<.12,'3D 키 2D 목표와 12% 안 '+JSON.stringify(mm&&{h:Math.round(mm.h),t:Math.round(mm.target)}));}
// 보스: 상태별 시트·배율 고정
const BM='__STORYWORLD_BOSS72_MOTION_R1342__';
const bid=await p.evaluate(()=>{for(const e of room.enemies)if(e.hp>0&&!/제72문/.test(String(e.name))&&Math.hypot(e.x-player.x,e.y-player.y)<6){e.x+=30;e.homeX=e.x;}
 const b=room.enemies.find(e=>e.nativeId==='mb-ep1b01');b.spawnState='active';b.visible=true;b.hp=b.maxHp=1e8;b.x=player.x+1.6;b.y=player.y-1.2;return String(b.id);});
const rec=()=>p.evaluate(()=>window.__STORYWORLD_BOSS72_MOTION_R1342__.inspect().lastPick);
const seen={},hs={};let lastT=null;
const sample=async(n)=>{for(let i=0;i<n;i++){await p.waitForTimeout(350);const r=await rec();if(r&&r.src&&r.t!==lastT){lastT=r.t;const m=String(r.src).split('/').pop().replace('.webp','');seen[m]=(seen[m]||0)+1;(hs[m]||(hs[m]=[])).push(r.h);}}};
const bm0=await p.evaluate(()=>({...window.__STORYWORLD_BOSS72_MOTION_R1342__.inspect().stats.byMotion}));
await sample(12);
await p.evaluate(()=>window.__STORYWORLD_BOSS72_SHADOWS_R1241__.cast(true));await sample(6);
await p.evaluate(()=>{const b=room.enemies.find(e=>e.nativeId==='mb-ep1b01');b.hitTimer=.35;});await sample(3);
await p.evaluate(()=>{const b=room.enemies.find(e=>e.nativeId==='mb-ep1b01');b.x=player.x+4.5;b.y=player.y-3.5;b.speed=Math.max(1.2,b.speed||0);b.nav=[];});await sample(24);
const bm1=await p.evaluate(()=>({...window.__STORYWORLD_BOSS72_MOTION_R1342__.inspect().stats.byMotion}));for(const [m,n] of Object.entries(bm1))if(n>(bm0[m]||0))seen[m]=Math.max(seen[m]||0,n-(bm0[m]||0));
console.log('보스 시트 본 횟수',JSON.stringify(seen),'키',JSON.stringify(Object.fromEntries(Object.entries(hs).map(([k,v])=>[k,[Math.min(...v).toFixed(1),Math.max(...v).toFixed(1)]]))));
ok(!seen['mb-ep1b01-p4']&&!seen['mb-ep1b01-p1'],'보스 옛 열쇠 자세(p1·p4) 몸 그림이 남지 않음');
ok(Object.keys(seen).filter(m=>FR.includes(m)).length>=3,'보스 시트 3종 이상 씀(모션 다양) '+Object.keys(seen));
ok(!!seen.cast,'시전(72 그림자) 시트 씀');
const allH=Object.values(hs).flat();ok(allH.length>5&&Math.max(...allH)/Math.min(...allH)<1.06,'보스 화면 키 흔들림 6% 안 '+(allH.length?(Math.max(...allH)/Math.min(...allH)).toFixed(3):''));
await p.screenshot({path:OUT+'/r1342b-ep1b01-boss.png'});
const bi=await p.evaluate(()=>window.__STORYWORLD_BOSS72_MOTION_R1342__.inspect());ok(bi.outermost&&!bi.stats.errors,'보스 모션 오버레이 바깥 자리·오류 0 '+JSON.stringify(bi.stats));
ok(!errs.length,'페이지 오류 0 '+(errs[0]||''));
await b.close();console.log(fail?'R1342 browser FAIL '+fail:'R1342 browser ALL OK');process.exit(fail?1:0);
