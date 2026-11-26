// R1326 브라우저 검사 + 전후 사진(헤드리스 Chromium + SwiftShader — 그래픽 검증 아님).
//  3D 몹 설정은 모두 기본(R1316·R1317·R1322·R1322c 꺼짐)으로 두고:
//  ① ep1b07(분노): 분노의 사냥개(R1316)·개와 늑대의 시간(R1322) 이 3D 로 나옴
//  ② ep1b09(7대죄 밖): 3D 안 나옴(설정 그대로 꺼짐)
//  ③ last302(불면귀 마을): R1317 을 켜도 잠식된 약방 아낙 3D 안 나옴
// 실행: 정적 서버 뒤 `node r96/qa/r1326/r1326-browser.mjs` (SW_URL 로 주소, OUT 으로 사진 위치)
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url)),OUT=process.env.OUT||HERE;
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const waitGame=async(p,sec)=>{const t0=await p.evaluate(()=>time);for(let n=0;n<200;n++){await skip(p);if(await p.evaluate(t=>time>t,t0+sec))break;await p.waitForTimeout(800);}};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errs=[];const {p}=await boot(b,{vp:{width:960,height:540},init:{}});p.on('pageerror',e=>errs.push(String(e)));
const place=names=>p.evaluate(names=>{player.hp=player.maxHp=1e6;for(const e of room.enemies)e.damage=0;const got=[];
 names.forEach((n,k)=>{const s=room.enemies.find(e=>!e.boss&&e.hp>0&&String(e.name)===n);if(!s)return;s.hp=s.maxHp=1e7;s.speed=0;s.visible=true;if('spawnState'in s)s.spawnState='active';
  const dx=[-1.3,1.3,0][k]||0,dy=[-1,-1,-2][k]||-1;s.x=player.x+dx;s.y=player.y+dy;s.homeX=s.x;s.homeY=s.y;s.nav=[];got.push([String(s.id),dx,dy]);});
 window.__pin=()=>{for(const [id,dx,dy] of got){const s=room.enemies.find(e=>String(e.id)===id);if(s){s.x=player.x+dx;s.y=player.y+dy;}}};
 for(const o of room.enemies)if(!got.some(g=>g[0]===String(o.id))&&Math.hypot(o.x-player.x,o.y-player.y)<7){o.x+=30;o.homeX=o.x;}return got.map(g=>g[0]);},names);
const vis=(A,id)=>p.evaluate(([A,id])=>!!window[A]?.inspect?.().instances?.some(x=>x.id===id&&x.visible),[A,id]);
const waitVis=(A,id,ms)=>p.waitForFunction(([A,id])=>window[A]?.inspect?.().instances?.some(x=>x.id===id&&x.visible),[A,id],{timeout:ms}).then(()=>true).catch(()=>false);
const Z=()=>p.evaluate(()=>window.__STORYWORLD_MOB3D_ZONE_R1326__);
// ① ep1b07
await go(p,'ep1b07');await skip(p);
const ids=await place(['분노의 사냥개','개와 늑대의 시간']);ok(ids.length===2,'ep1b07 분노의 사냥개·개와 늑대의 시간 찾음');
const off=await p.evaluate(()=>({a:window.__STORYWORLD_MOB3D_R1316__.inspect().on,b:window.__STORYWORLD_MOB3D_R1322__.inspect().on}));ok(!off.a&&!off.b,'3D 몹 설정은 기본 꺼짐 그대로');
await p.evaluate(()=>window.__STORYWORLD_MOB3D_ZONE_R1326__.set(false));await waitGame(p,1);await p.evaluate(()=>window.__pin());await p.waitForTimeout(800);await p.screenshot({path:OUT+'/r1326-ep1b07-before.png'});
ok(!(await vis('__STORYWORLD_MOB3D_R1316__',ids[0])),'규칙 끄면 2D(전)');
await p.evaluate(()=>window.__STORYWORLD_MOB3D_ZONE_R1326__.set(true));
ok(await waitVis('__STORYWORLD_MOB3D_R1316__',ids[0],200000),'분노의 사냥개 3D(R1316) 나옴');
ok(await waitVis('__STORYWORLD_MOB3D_R1322__',ids[1],200000),'개와 늑대의 시간 3D(R1322) 나옴');
await waitGame(p,1);await p.evaluate(()=>window.__pin());await p.waitForTimeout(800);await p.screenshot({path:OUT+'/r1326-ep1b07-after.png'});
// ② ep1b09
await go(p,'ep1b09');await skip(p);const i2=await place(['걸어다니는 소형 로봇']);ok(i2.length===1,'ep1b09 걸어다니는 소형 로봇 찾음');
await waitGame(p,1.5);ok(!(await vis('__STORYWORLD_MOB3D_R1316__',i2[0])),'7대죄 밖(ep1b09)은 설정대로 2D');
// ③ last302
await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1317__.set(true));
await go(p,'last302');await skip(p);const i3=await place(['잠식된 약방 아낙']);ok(i3.length===1,'last302 잠식된 약방 아낙 찾음');
await waitGame(p,1.5);await p.waitForTimeout(4000);ok(!(await vis('__STORYWORLD_MOB3D_R1317__',i3[0])),'불면귀 마을은 R1317 켜도 2D');
const ins=await p.evaluate(()=>window.__STORYWORLD_MOB3D_ZONE_R1326__.inspect());ok(ins.forced==='2d','inspect forced=2d '+JSON.stringify(ins));
ok(!errs.length,'페이지 오류 0 '+(errs[0]||''));
await b.close();console.log(fail?'R1326 browser FAIL '+fail:'R1326 browser ALL OK');process.exit(fail?1:0);
