// R1309 3D 슬레이어 대검 — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  ① 3D 꺼짐: 대검 GLB 요청 0. ② 3D 슬레이어: 대검 GLB 1번, 무기 부모에 붙음, 오류 0.
//  ③ 공격 중 왼손 IK 가 켜지고(가중 > .5) 손-칼자루 오차가 작다. 대기에서는 꺼짐(원래 모션).
//  ④ 전후 자르기 그림(r1309-before-after.png, 참고용).
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1309/r1309-browser.mjs`
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {chromium,boot,go} from '../r444/lib.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url));
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:960,height:540}});await go(p,process.env.ZONE||'dist00');
const req=[];p.on('request',r=>{if(/\/assets\/r1309\/slayer-greatsword\.glb/.test(r.url()))req.push(r.url());});
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const B=()=>p.evaluate(()=>window.__STORYWORLD_SLAYER_BLADE_R1309__.inspect());
await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;}});
await p.evaluate(async()=>{try{await ensureImages(heroPaths('slayer'));}catch(_){}player.hero='slayer';player.moving=false;player.attackAnim=0;player.direction='left';});
await p.waitForTimeout(2500);ok(req.length===0,'① 3D 꺼짐: 대검 GLB 요청 0 ('+req.length+')');
await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.set(true));
await p.waitForFunction(()=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return i.hero==='slayer'&&i.ready&&i.shown;},null,{timeout:240000}).catch(()=>null);
await p.waitForFunction(()=>window.__STORYWORLD_SLAYER_BLADE_R1309__.inspect().active,null,{timeout:120000}).catch(()=>null);
await p.waitForTimeout(1500);
let s=await B();ok(s.active&&s.loaded&&s.ik,'② 대검 붙음·왼팔 뼈 찾음 '+JSON.stringify({active:s.active,ik:s.ik,scale:s.mountScale,loadMs:s.loadMs}));
ok(req.length===1,'② 대검 GLB 1번만 요청 ('+req.length+')');
ok(await p.evaluate(()=>{const g=window.__STORYWORLD_PHASE1__.controller.state.three.scene.getObjectByName('r1309-slayer-greatsword');return !!g&&/Weapon|Socket|slayer/i.test(g.parent?.name+' '+g.parent?.parent?.name);}),'② 무기 부모(소켓 아래)에 붙음');
const idleW=s.lastIkWeight;ok(idleW<.05,'③ 대기: 왼손 IK 꺼짐(원래 모션) w='+idleW);
const box=async()=>{const m=await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.measure());const pad=26;return m&&m.ink?{x:Math.max(0,m.left-pad),y:Math.max(0,m.top-pad),width:Math.min(960,m.right-m.left+pad*2),height:Math.min(540,m.bottom-m.top+pad*2)}:{x:330,y:120,width:300,height:300};};
const shots={};const clip=await box();
shots.idle=await p.screenshot({clip});
await p.evaluate(()=>{window.__STORYWORLD_PHASE1__.controller.state.three.scene.getObjectByName('r1309-slayer-greatsword').visible=false;});await p.waitForTimeout(400);
shots.before=await p.screenshot({clip});
await p.evaluate(()=>{window.__STORYWORLD_PHASE1__.controller.state.three.scene.getObjectByName('r1309-slayer-greatsword').visible=true;});
// 공격: attackAnim 을 올려 R1302 공격 포즈를 켜고, 가중·오차를 모은다.
let maxW=0,bestErr=null,atkShot=null,worse=0,n=0,worstErr=0;
for(let k=0;k<3;k++){await p.evaluate(()=>{player.attackAnim=(+player.attackAnim||0)+1;});
 for(let i=0;i<14;i++){await p.waitForTimeout(90);const v=await B();if(v.lastIkWeight>maxW)maxW=v.lastIkWeight;if(v.lastIkWeight>=.9&&v.lastIkError!=null){n++;if(bestErr===null||v.lastIkError<bestErr)bestErr=v.lastIkError;if(v.lastIkError>worstErr)worstErr=v.lastIkError;if(v.lastIkError>v.lastPre+1e-3)worse++;}if(!atkShot&&v.lastIkWeight>.9)atkShot=await p.screenshot({clip});}}
ok(maxW>.5,'③ 공격: 왼손 IK 켜짐 최대 가중 '+maxW);ok(bestErr!==null&&bestErr<.03,'③ 두 손이 모이는 내려베기에서 왼손이 칼자루에 닿음(최소 오차, 칼 길이 비율) '+bestErr);ok(n>0&&worstErr<=.01,'③ R1313: 공격 내내 왼손이 칼자루에 붙음(최대 오차 '+worstErr+' ≤ .01, 못 닿으면 오른손을 당김)');ok(n>0&&worse===0,'③ IK 가 왼손을 칼자루에서 더 멀게 만든 프레임 0 ('+worse+'/'+n+', 팔이 짧아 못 닿는 들어올림 구간은 가장 가까이까지만)');
s=await B();ok(s.errors===0,'오류 0 ('+s.errors+(s.lastError?' '+s.lastError:'')+')');
const h3=await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect());ok(h3.errors===0,'R1305 3D 오류 0 ('+h3.errors+')');
for(const [k,v] of Object.entries({before:shots.before,idle:shots.idle,attack:atkShot}))if(v)fs.writeFileSync(path.join(HERE,'shot-'+k+'.png'),v);
await b.close();console.log(fail?'R1309 browser FAIL '+fail:'R1309 browser ALL OK');process.exit(fail?1:0);
