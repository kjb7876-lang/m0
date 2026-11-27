// R1347 검술 여덟 동작 미리보기 낱장 찍기(헤드리스 SwiftShader — 그래픽 검증 아님, 모양 확인용).
//  공격을 누른 채(R1302 공격 가중치 1) 동작 번호·진행도를 preview 로 고정하고, 영웅 둘레를 잘라 낱장으로 남긴다. 다리·발은 원래 공격 클립 그대로.
//  실행: node r96/qa/r1347/r1347-capture.mjs <출력 폴더>   (HEROES=hwando,ego,slayer)
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2]||'r1347-frames',HEROES=(process.env.HEROES||'hwando,ego,slayer').split(',');fs.mkdirSync(OUT,{recursive:true});
const W=1280,H=720,STEPS=+process.env.STEPS||12;
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:W,height:H}});await p.evaluate(z=>{window.__r1347Zoom=z;},+process.env.ZOOM||1);await go(p,process.env.ZONE||'dist00');
await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;e.visible=false;e.x+=9999;}window.__STORYWORLD_HWANDO3D_R1302__.set(true);
 const r=window.__STORYWORLD_PHASE1__.controller.state.three,s=r.scene,prev=s.onAfterRender,pb=s.onBeforeRender;window.__r1347N=0;s.onAfterRender=function(...a){window.__r1347N++;return prev?.apply(this,a);};
 // ZOOM: 3D 카메라만 당겨 영웅을 크게(맵 2D 층은 그대로라 배경이 어긋날 수 있음 — 모양 확인용)
 const Z=+window.__r1347Zoom||1;s.onBeforeRender=function(...a){if(Z!==1){const c=r.camera;if(c.zoom!==Z){c.zoom=Z;c.updateProjectionMatrix();}}return pb?.apply(this,a);};});
const frames=n=>p.evaluate(n=>new Promise(r=>{const a=window.__r1347N;const f=()=>window.__r1347N>=a+n?r():requestAnimationFrame(f);f();}),n);
for(const h of HEROES){
 await p.evaluate(async h=>{try{await ensureImages(heroPaths(h==='ego'?'hwando':h));}catch(_){}},h);
 await p.evaluate(h=>{const base=h==='ego'?'hwando':h;player.personaHeroR1113=false;player.egoSovereignR1046=h==='ego';player.hero=base;player.direction='right';},h);
 await p.waitForFunction(h=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return i.hero===h&&i.shown;},h,{timeout:240000});await p.waitForTimeout(3000);
 await p.evaluate(()=>{clearInterval(window.__r1347A);window.__r1347A=setInterval(()=>{player.moving=false;player.attackAnim=.2;},4);});
 await p.waitForFunction(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect().weights.attack>.98,null,{timeout:60000});
 const moves=await p.evaluate(()=>window.__STORYWORLD_SWORD_COMBO_R1347__.moves());
 for(let m=0;m<moves.length;m++)for(let k=0;k<STEPS;k++){const t=.08+.84*k/(STEPS-1);
  await p.evaluate(([m,t])=>window.__STORYWORLD_SWORD_COMBO_R1347__.preview(m,t),[m,t]);await frames(2);
  const box=await p.evaluate(h=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,g=r.scene.getObjectByName('r1305-'+h+'-3d-shared'),T=r.T,v=new T.Vector3();g.getWorldPosition(v);v.project(r.camera);return {x:(v.x+1)/2*innerWidth,y:(1-v.y)/2*innerHeight};},h);
  const S=+process.env.CROP||230;await p.screenshot({path:`${OUT}/${h}_${String(m).padStart(2,'0')}_${String(k).padStart(2,'0')}.png`,clip:{x:Math.max(0,Math.min(W-S,box.x-S/2)),y:Math.max(0,Math.min(H-S,box.y-S*.72)),width:S,height:S}});}
 await p.evaluate(()=>{window.__STORYWORLD_SWORD_COMBO_R1347__.preview(null);clearInterval(window.__r1347A);player.attackAnim=0;});
 fs.writeFileSync(`${OUT}/moves.json`,JSON.stringify(moves));console.log('captured',h);
}
await b.close();
