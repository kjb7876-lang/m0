// R1362 칼끝 전후 낱장(헤드리스, 그래픽 검증 아님). OUT=<폴더> node r96/qa/r1362/r1362-capture.mjs — 환도·EGO·슬레이어 칼끝 둘레를 잘라 8배로 키운다.
import {chromium,boot,go} from '../r444/lib.mjs';
const OUT=process.env.OUT||'.',TAG=process.env.TAG||'now';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:960,height:540}});await go(p,process.env.ZONE||'dist00');
await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.x=player.x+999;e.y=player.y+999;e.speed=0;e.damage=0;}window.__STORYWORLD_HWANDO3D_R1302__.set(true);});
for(const h of (process.env.HEROES||'hwando,ego,slayer').split(',')){
 await p.evaluate(async h=>{const base=h==='ego'?'hwando':h;try{await ensureImages(heroPaths(base));}catch(_){}player.egoSovereignR1046=h==='ego';player.personaHeroR1113=false;player.hero=base;player.moving=false;player.attackAnim=0;player.direction='right';},h);
 await p.waitForFunction(h=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();if(!(i.hero===h&&i.shown))return false;let t=null;window.__STORYWORLD_PHASE1__.controller.state.three.scene.getObjectByName('r1305-'+h+'-3d-shared')?.traverse(x=>{if(/^BladeTip/.test(x.name))t=x;});return !!t;},h,{timeout:240000});await p.waitForTimeout(2500);
 const c=await p.evaluate(h=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,T=r.T;let t=null;r.scene.getObjectByName('r1305-'+h+'-3d-shared').traverse(x=>{if(!t&&/^BladeTip/.test(x.name))t=x;});
  const v=t.getWorldPosition(new T.Vector3()).project(r.camera),cv=r.renderer.domElement.getBoundingClientRect();return {x:cv.left+(v.x+1)/2*cv.width,y:cv.top+(1-v.y)/2*cv.height};},h);
 const R=22;await p.screenshot({path:`${OUT}/${h}-${TAG}.png`,clip:{x:Math.max(0,c.x-R),y:Math.max(0,c.y-R),width:2*R,height:2*R}});console.log(h,JSON.stringify(c));}
await b.close();
