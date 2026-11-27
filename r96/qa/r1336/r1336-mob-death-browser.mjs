// R1336 3D 몹이 죽을 때 2D 그림이 나오는 문제(사용자 2026-11-26 영상) — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  원인(실측): 엔진은 hp 0 이 되는 순간 적을 room.enemies 에서 빼고 죽음 효과(drawBurnDeath3)만 남긴다. R462(15세 R1054)는 그 효과에서
//   '살아 있을 때 마지막으로 그린 그 몹의 2D 그림'을 주인 'scene' 으로 검게 그려 연기·재로 흩는데, 3D 몹 오버레이는 enemy 주인 몸 명령만 빼므로
//   3D 는 그 순간 사라지고 2D 그림이 1초 남짓 화면에 남았다.
//  기대: ① 3D 로 그려지던 몹이 죽으면 0~1.5초 동안 그 몹의 2D 몸 그림 명령이 화면(렌더 직전 명령)에 하나도 남지 않는다.
//        ② 그동안 3D 몸이 죽음 동작(pose death)으로 0.8초 이상 보인다. ③ 15세 연기·재(R462 smoke 시트)는 그대로 그린다.
//        ④ 2.5초 뒤 3D 는 숨는다(죽은 몸이 남지 않음). ⑤ 회귀: 3D 를 끈 몹(2D)은 원래대로 R462 2D 실루엣이 나온다.
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1336/r1336-mob-death-browser.mjs`
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:960,height:540},init:{'storyworld.r1312.mob3d':'on'}});await go(p,'dist00');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;}});
await p.evaluate(()=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,sc=r.commands,base=sc.render;
 const key=s=>(String(s||'').match(/^.*?\.(webp|png)/i)||[String(s||'')])[0].replace(/^.*\/assets\//,'assets/');
 const w=function(cmds){const q=window.__r1336D;const out=base.apply(this,arguments);if(q){const M=window.__STORYWORLD_MOB3D_R1312__.inspect().instances.find(i=>i.id===q.id);
   q.log.push({t:time,body:cmds.filter(c=>c?.kind==='image'&&key(c.sourcePath)===q.path).length,smoke:cmds.filter(c=>c?.kind==='image'&&/smoke/i.test(String(c.sourcePath||''))).length,vis:!!M?.visible,pose:M?.pose||null});}return out;};
 w.__r1304=true;sc.render=w;});
const kill=async kind=>{await p.waitForFunction(kind=>window.__STORYWORLD_MOB3D_R1312__.inspect().instances.some(i=>i.kind===kind),kind,{timeout:120000}).catch(()=>{});
 const id=await p.evaluate(kind=>{const ids=new Set(window.__STORYWORLD_MOB3D_R1312__.inspect().instances.filter(i=>i.kind===kind).map(i=>i.id));const e=room.enemies.find(e=>e.hp>0&&!e.boss&&ids.has(String(e.id)))||room.enemies.find(e=>e.hp>0&&!e.boss);e.x=player.x+1.5;e.y=player.y-1.2;return e.id;},kind);
 await p.waitForFunction(id=>window.__STORYWORLD_MOB3D_R1312__.inspect().instances.some(i=>i.id===id&&i.visible),id,{timeout:120000}).catch(()=>{});
 // 그 몹의 2D 몸 경로: 3D 가 빼기 전 명령에서 읽는다
 const p2=await p.evaluate(id=>new Promise(res=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three;const sc=r.commands,base=sc.render;const w=function(cmds){const c=cmds.find(c=>c?.kind==='image'&&String(c.owner?.id||'')==='enemy:'+id&&!c.owner.r350);if(c){sc.render=base;res((String(c.sourcePath||'').match(/^.*?\.(webp|png)/i)||[''])[0].replace(/^.*\/assets\//,'assets/'));}return base.apply(this,arguments);};w.__r1304=true;sc.render=w;}),id);
 const shown=await p.evaluate(id=>window.__STORYWORLD_MOB3D_R1312__.inspect().instances.some(i=>i.id===id&&i.visible),id);
 await p.evaluate(([id,path])=>{window.__r1336D={id,path,log:[]};const e=room.enemies.find(e=>e.id===id);window.__r1336D.t0=time;hitEnemy(e,e.hp+99999,{});},[id,p2]);
 await p.waitForFunction(()=>time-window.__r1336D.t0>2.6,null,{timeout:180000});
 const q=await p.evaluate(()=>{const q=window.__r1336D;window.__r1336D=null;return q;});return {id,path:p2,shown,q};};
for(const kind of ['guard','stalker']){
 const {id,path,shown,q}=await kill(kind);const L=q.log.map(x=>({...x,a:x.t-q.t0}));
 ok(shown&&!!path,`준비 ${kind}: 죽기 전 3D 로 보임 (${shown}, 2D 경로 ${path})`);
 const early=L.filter(x=>x.a<=1.5),bodyFrames=early.filter(x=>x.body>0).length;
 ok(early.length>3&&bodyFrames===0,`① ${kind}: 죽은 뒤 1.5초 동안 2D 몸 그림 0 (${bodyFrames}/${early.length} 프레임에 남음)`);
 const dv=L.filter(x=>x.vis&&x.pose==='death'),span=dv.length?dv[dv.length-1].a-dv[0].a:0;
 ok(span>=.8,`② ${kind}: 3D 몸이 죽음 동작으로 보임 (${span.toFixed(2)}초)`);
 ok(L.some(x=>x.smoke>0),`③ ${kind}: 15세 연기·재 그대로 (${L.filter(x=>x.smoke>0).length} 프레임)`);
 const last=L[L.length-1];ok(last&&last.a>=2.5&&!last.vis,`④ ${kind}: 2.5초 뒤 3D 숨김 (${last?.a?.toFixed(2)}초 보임 ${last?.vis})`);}
// ⑤ 회귀: 3D 끄면 2D 실루엣 그대로
await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1312__.set(false));await p.waitForTimeout(800);
{const id=await p.evaluate(()=>{const e=room.enemies.find(e=>e.hp>0&&!e.boss);e.x=player.x+1.5;e.y=player.y-1.2;return e.id;});await p.waitForTimeout(800);
 const path=await p.evaluate(id=>new Promise(res=>{const sc=window.__STORYWORLD_PHASE1__.controller.state.three.commands,base=sc.render;const w=function(cmds){const c=cmds.find(c=>c?.kind==='image'&&String(c.owner?.id||'')==='enemy:'+id&&!c.owner.r350);if(c){sc.render=base;res((String(c.sourcePath||'').match(/^.*?\.(webp|png)/i)||[''])[0].replace(/^.*\/assets\//,'assets/'));}return base.apply(this,arguments);};w.__r1304=true;sc.render=w;}),id);
 await p.evaluate(([id,path])=>{window.__r1336D={id,path,log:[]};const e=room.enemies.find(e=>e.id===id);window.__r1336D.t0=time;hitEnemy(e,e.hp+99999,{});},[id,path]);
 await p.waitForFunction(()=>time-window.__r1336D.t0>1.2,null,{timeout:180000});const q=await p.evaluate(()=>window.__r1336D);
 ok(q.log.filter(x=>x.t-q.t0<.6).some(x=>x.body>0),`⑤ 회귀 3D 끈 몹: 원래 2D 실루엣이 그려짐 (${q.log.filter(x=>x.body>0).length} 프레임)`);}
console.log(fail?`R1336 몹 죽음 실패 ${fail}`:'R1336 몹 죽음 통과');await b.close();process.exit(fail?1:0);
