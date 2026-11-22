// R1302 3D 환도 시험 — 브라우저 검사(헤드리스, SwiftShader). 실패 먼저 확인 뒤 오버레이를 붙인다.
//  ① 기본(꺼짐): 환도 2D 몸 그림이 그려지고 공유 장면 3D 모델은 안 보임.
//  ② 켬 + 환도: 2D 환도 몸 명령이 빠지고, 공유 장면 3D 모델의 발 기준점 오차가 ≤ 6px.
//  ③ 켬 + 다른 영웅(네온): 2D 몸 그대로, 3D 모델 숨김.
//  ④ 켬 + 걷기·공격: 3D 자세가 walk/attack 으로 바뀜. ⑤ 다시 끔: 2D 몸 돌아옴.
//  ⑥ 프레임 시간: 2D 대비 3D 켬(같은 장면) 보고(기준 아님, 기록용).
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:960,height:540}});await go(p,process.env.ZONE||'dist00');
await p.evaluate(async()=>{for(const h of ['hwando','neon'])await ensureImages(heroPaths(h));player.hero='hwando';player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;}});
const frame=()=>p.evaluate(()=>new Promise(res=>{const r3=window.__STORYWORLD_PHASE1__?.controller?.state?.three;const api=window.__STORYWORLD_HWANDO3D_R1302__;
 requestAnimationFrame(()=>requestAnimationFrame(()=>{const last=window.__r1302last||null;res({hero:player.hero,api:!!api,state:api?.inspect?.()||null,q:project(player.x,player.y)});}));}));
// 프레임마다 영웅 몸 명령 수를 세는 감시(오버레이보다 바깥에서 세도록 렌더 직전 마지막 명령을 본다)
await p.evaluate(()=>{const r3=window.__STORYWORLD_PHASE1__.controller.state.three;const base=r3.renderer.render.bind(r3.renderer);window.__r1302cnt={body:0,frames:0};
 const C=r3.constructor.prototype;});
const bodyCount=(any=false)=>p.evaluate(any=>new Promise(res=>{const r3=window.__STORYWORLD_PHASE1__.controller.state.three;const orig=r3.render;let done=false;
 r3.render=function(f){const arr=f&&f.commands;if(!done&&Array.isArray(arr)){done=true;r3.render=orig;const n=arr.filter(c=>c?.kind==='image'&&c.owner?.kind==='hero'&&c.owner.x===player.x&&c.owner.y===player.y&&(any||c.spatialRole==='body'||c.r350Lifted)).length;res(n);}return orig.apply(this,arguments);};}),any);
const modelBox=()=>p.evaluate(()=>{const api=window.__STORYWORLD_HWANDO3D_R1302__,state=api?.inspect?.();if(!state?.shown)return {shown:false,ink:0};return {shown:true,...(api.measure?.()||{ink:0})};});
const set=v=>p.evaluate(v=>window.__STORYWORLD_HWANDO3D_R1302__?.set?.(v),v);
const wait3d=()=>p.waitForFunction(()=>window.__STORYWORLD_HWANDO3D_R1302__?.inspect?.().ready===true,null,{timeout:180000}).catch(()=>null);
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const api=await p.evaluate(()=>!!window.__STORYWORLD_HWANDO3D_R1302__);ok(api,'① API 있음');
const def=await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__?.on?.());ok(def===false,'① 기본값 꺼짐 ('+def+')');
let n=await bodyCount();ok(n>0,'① 꺼짐: 2D 환도 몸 명령 '+n);
let ink=await modelBox();ok(!ink.shown||ink.ink===0,'① 꺼짐: 3D 모델 숨김 '+JSON.stringify(ink));
// 프레임 시간(2D)
const ft=async()=>p.evaluate(()=>new Promise(res=>{const a=[];let last=performance.now();const f=t=>{a.push(t-last);last=t;if(a.length<40)requestAnimationFrame(f);else{a.sort((x,y)=>x-y);res({med:+a[20].toFixed(1),p90:+a[36].toFixed(1)});}};requestAnimationFrame(f);}));
const ft2d=await ft();
await set(true);await wait3d();await p.waitForTimeout(800);
n=await bodyCount();ok(n===0,'② 켬: 2D 환도 몸 명령 빠짐 '+n);
ink=await modelBox();const q=await p.evaluate(()=>project(player.x,player.y));
ok(ink.shown&&ink.ink>400,'② 켬: 공유 장면 3D 환도 정점 측정 '+JSON.stringify(ink));
ok(ink.bottom!=null&&Math.abs(ink.bottom-q.y)<=6,'② 발 기준점 오차 '+(ink.bottom-q.y).toFixed(1)+'px');
ok(ink.cx!=null&&Math.abs(ink.cx-q.x)<=14,'② 가로 중심 오차 '+(ink.cx-q.x).toFixed(1)+'px');
const hgt=await p.evaluate(()=>actorHeight());ok(ink.bottom-ink.top>hgt*.75&&ink.bottom-ink.top<hgt*1.5,'② 키 '+(ink.bottom-ink.top).toFixed(1)+'px (2D 기준 '+hgt.toFixed(1)+')');
const ft3d=await ft();
await p.screenshot({path:'/tmp/claude-0/qa/r1302-3d.png'});
await set(false);await p.waitForTimeout(400);await p.screenshot({path:'/tmp/claude-0/qa/r1302-2d.png'});await set(true);await p.waitForTimeout(300);
// 걷기·공격
await p.evaluate(()=>{player.moving=true;player.moveVX150=1;player.moveVY150=-1;});await p.waitForTimeout(200);
let st=await p.evaluate(()=>{player.moving=true;return window.__STORYWORLD_HWANDO3D_R1302__.inspect();});
await p.keyboard.down('ArrowRight');
const walkSeen=await p.evaluate(()=>new Promise(res=>{let k=0,seen=false;const f=()=>{if(window.__STORYWORLD_HWANDO3D_R1302__.inspect().action==='walk')seen=true;if(++k<60&&!seen)requestAnimationFrame(f);else res(seen);};f();}));
await p.keyboard.up('ArrowRight');
ok(walkSeen,'④ 걷기 자세');
const atkSeen=await p.evaluate(()=>new Promise(res=>{let k=0,seen=false;player.moving=false;const f=()=>{player.attackAnim=.2;if(window.__STORYWORLD_HWANDO3D_R1302__.inspect().action==='attack')seen=true;if(++k<20&&!seen)requestAnimationFrame(f);else res(seen);};f();}));
ok(atkSeen,'④ 공격 자세');
await p.evaluate(()=>{player.moving=false;player.attackAnim=0;});
// 다른 영웅
await p.evaluate(()=>{player.hero='neon';});await p.waitForTimeout(500);
n=await bodyCount(true);ok(n>0,'③ 켬+네온: 2D 몸 그대로 '+n);ink=await modelBox();ok(!ink.shown||ink.ink===0,'③ 켬+네온: 3D 모델 숨김 '+ink.ink);
await p.evaluate(()=>{player.hero='hwando';});await set(false);await p.waitForTimeout(400);
n=await bodyCount();ok(n>0,'⑤ 다시 끔: 2D 몸 돌아옴 '+n);ink=await modelBox();ok(!ink.shown||ink.ink===0,'⑤ 다시 끔: 3D 모델 숨김');
const saved=await p.evaluate(()=>localStorage.getItem('storyworld.r1302.hwando3d'));ok(saved==='off','⑤ 저장값 off ('+saved+')');
const errs=await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__?.inspect?.().errors??-1);ok(errs===0,'오류 0 ('+errs+')');
console.log('⑥ 프레임 시간(ms, 헤드리스 SwiftShader) 2D',JSON.stringify(ft2d),'3D',JSON.stringify(ft3d));
await b.close();console.log(fail?`RESULT FAIL ${fail}`:'RESULT PASS');process.exit(fail?1:0);
