// R1309 심사용 캡처: 3D 슬레이어 대검 전(무기 없음)·후(대기·공격 프레임) 확대 그림. 헤드리스 SwiftShader(그래픽 검증 아님).
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {chromium,boot,go} from '../r444/lib.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url)),OUT=process.env.OUT||HERE;
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:1920,height:1080}});await go(p,process.env.ZONE||'dist00');
await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;}});
await p.evaluate(async d=>{try{await ensureImages(heroPaths('slayer'));}catch(_){}player.hero='slayer';player.moving=false;player.x+=(+(globalThis.__dx??2.5));player.attackAnim=0;player.direction=d;},process.env.DIR||'left');
await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.set(true));
await p.waitForFunction(()=>window.__STORYWORLD_SLAYER_BLADE_R1309__?.inspect().active,null,{timeout:240000});
await p.waitForTimeout(1500);
const pt=await p.evaluate(()=>{const st=window.__STORYWORLD_PHASE1__.controller.state.three,g=st.scene.getObjectByName('r1305-slayer-3d-shared'),T=st.T;const v=new T.Vector3();g.getWorldPosition(v);const top=v.clone();const bb=new T.Box3().setFromObject(g);top.y=bb.max.y;const c=st.camera;const pr=x=>{const q=x.clone().project(c);return [(q.x+1)/2*innerWidth,(1-q.y)/2*innerHeight];};return {foot:pr(v),head:pr(top)};});
const cx=pt.foot[0],clip={x:Math.max(0,cx-200),y:Math.max(0,pt.foot[1]-270),width:400,height:330};
console.log(JSON.stringify({pt,clip}));
const sword=v=>p.evaluate(v=>{window.__STORYWORLD_PHASE1__.controller.state.three.scene.getObjectByName('r1309-slayer-greatsword').visible=v;},v);
const shot=async n=>fs.writeFileSync(path.join(OUT,n+'.png'),await p.screenshot({clip}));
await p.screenshot({path:path.join(OUT,'full.png')});
await sword(false);await p.waitForTimeout(300);await shot('cap-before-idle');await sword(true);await p.waitForTimeout(300);await shot('cap-after-idle');
// 공격 프레임: 게임 시간을 거의 멈추고(tick 배율) 시간 구간별로
for(const [i,ms] of [[0,60],[1,160],[2,260],[3,380]]){await p.evaluate(()=>{player.attackAnim=(+player.attackAnim||0)+1;});await p.waitForTimeout(ms);
 const w=(await p.evaluate(()=>window.__STORYWORLD_SLAYER_BLADE_R1309__.inspect())).lastIkWeight;await shot('cap-atk'+i);console.log('atk',i,w);await p.waitForTimeout(900);}
await b.close();
