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
const A16='__STORYWORLD_MOB3D_R1316__',A17='__STORYWORLD_MOB3D_R1317__';
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
ok(!errs.length,'페이지 오류 0 '+(errs[0]||''));
await b.close();console.log(fail?'R1342 browser FAIL '+fail:'R1342 browser ALL OK');process.exit(fail?1:0);
