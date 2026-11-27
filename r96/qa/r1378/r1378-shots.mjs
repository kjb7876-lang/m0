// R1378 전후 장면(헤드리스 SwiftShader — 그래픽 검증 아님). 같은 순간을 창 있음/없음으로 찍어 나란히 붙인다.
// 실행: 정적 서버 뒤 `node r96/qa/r1378/r1378-shots.mjs` → r96/qa/r1378/r1378-before-after.jpg
import {chromium,boot,go} from '../r444/lib.mjs';import {createRequire} from 'node:module';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:960,height:540}});await go(p,process.env.ZONE||'dist00');
await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;e.visible=false;e.x+=9999;}window.__STORYWORLD_HWANDO3D_R1302__.set(true);});
const shots=[];
const shoot=async(h,label,persona=false)=>{
 const id=persona?'persona':h;
 const box=await p.evaluate(id=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,g=r.scene.getObjectByName('r1305-'+id+'-3d-shared'),T=r.T;const v=g.getWorldPosition(new T.Vector3());v.y+=1.0*g.getWorldScale(new T.Vector3()).y;v.project(r.camera);return {x:(v.x+1)/2*innerWidth,y:(1-v.y)/2*innerHeight};},id);
 const clip={x:Math.max(0,box.x-70),y:Math.max(0,box.y-55),width:140,height:140};
 const set=on=>p.evaluate(([id,on])=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,g=r.scene.getObjectByName('r1305-'+id+'-3d-shared');const w=g?.getObjectByName('r1313-'+id+'-weapon');if(w)w.visible=on;window.__r1378Slow=on;},[id,on]);
 await p.evaluate(()=>{window.__r1378TS=window.__r1378TS??1;});
 await set(false);await p.waitForTimeout(250);const a=await p.screenshot({clip});await set(true);await p.waitForTimeout(250);const c=await p.screenshot({clip});shots.push({label,a,c});};
const pick=async(h,persona=false)=>{await p.evaluate(async([h,persona])=>{try{await ensureImages(heroPaths(h));}catch(_){}clearInterval(window.__r1378A);player.personaHeroR1113=persona;player.egoSovereignR1046=false;player.hero=h;player.moving=false;player.attackAnim=0;route.length=0;player.direction='front';},[h,persona]);
 await p.waitForFunction(id=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return i.hero===id&&i.shown;},persona?'persona':h,{timeout:240000});await p.waitForTimeout(2500);};
const attack=async()=>{await p.evaluate(()=>{window.__r1378A=setInterval(()=>{player.moving=false;player.attackAnim=.2;},8);});await p.waitForFunction(()=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return i.action==='attack'&&i.weights.attack>.97;},null,{timeout:60000});};
for(const h of ['neon','lauren']){await pick(h);await shoot(h,h+' idle');await attack();await shoot(h,h+' attack');await p.evaluate(()=>clearInterval(window.__r1378A));}
await pick('lauren',true);await shoot('lauren','persona idle',true);
await b.close();
const req=createRequire(import.meta.url);const fs=req('fs');const out=new URL('./r1378-before-after.jpg',import.meta.url).pathname;
fs.writeFileSync('/tmp/claude-0/r1378-shots.json',JSON.stringify(shots.map(s=>({label:s.label,a:s.a.toString('base64'),c:s.c.toString('base64')}))));
console.log('shots',shots.length,'→ python 합치기',out);
