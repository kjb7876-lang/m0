// R1305 영웅 10명 3D 캡처(헤드리스 SwiftShader — 그래픽 검증 아님, 7분야 심사 자료).
// 윗줄 3D 대기, 아랫줄 3D 공격. 맨 앞 칸은 2D 환도(3D 끔) 기준. 화면 가운데(카메라가 영웅을 따름)를 자른다.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium,boot,go} from '../r444/lib.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url)),W=960,H=540;
const HEROES=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner','persona','ego'];
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:W,height:H}});await go(p,process.env.ZONE||'dist00');
await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;}});
const center=async()=>({x:W/2,y:H/2});// 카메라가 영웅을 화면 가운데에 둔다(뷰포트 기준 고정 자르기)
const clipAt=(c,dy=-40)=>({x:Math.round(c.x-110),y:Math.round(c.y+dy-150),width:220,height:250});
const shots=[];const c0=await center();
await p.evaluate(async()=>{await ensureImages(heroPaths('hwando'));player.hero='hwando';});await p.waitForTimeout(1500);
shots.push({h:'2D hwando',idle:await p.screenshot({clip:clipAt(c0),timeout:180000}),atk:null});
await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.set(true));
for(const h of HEROES){
 await p.evaluate(async h=>{const base=h==='persona'?'lauren':h==='ego'?'hwando':h;try{await ensureImages(heroPaths(base));}catch(_){}player.personaHeroR1113=h==='persona';player.egoSovereignR1046=h==='ego';player.hero=base;player.moving=false;player.attackAnim=0;},h);
 await p.waitForFunction(h=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return i.hero===h&&i.shown;},h,{timeout:240000}).catch(()=>null);
 await p.waitForTimeout(1500);const idle=await p.screenshot({clip:clipAt(c0),timeout:180000});
 await p.evaluate(()=>{clearInterval(window.__r1305A);window.__r1305A=setInterval(()=>{player.moving=false;player.attackAnim=.2;},8);});
 await p.waitForFunction(()=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return i.action==='attack'&&i.weights.attack>.8;},null,{timeout:60000}).catch(()=>null);
 const atk=await p.screenshot({clip:clipAt(c0),timeout:180000});await p.evaluate(()=>{clearInterval(window.__r1305A);player.attackAnim=0;});
 shots.push({h,idle,atk});console.log(new Date().toISOString().slice(11,19),'shot',h);
}
const png=await p.evaluate(async list=>{const load=s=>s?new Promise(r=>{const im=new Image();im.onload=()=>r(im);im.src='data:image/png;base64,'+s;}):null;
 const rows=await Promise.all(list.map(async s=>({h:s.h,i:await load(s.idle),a:await load(s.atk)})));const cw=220,ch=250,c=document.createElement('canvas');c.width=cw*rows.length;c.height=ch*2+22;const g=c.getContext('2d');g.fillStyle='#111';g.fillRect(0,0,c.width,c.height);g.font='14px sans-serif';g.fillStyle='#eee';
 rows.forEach((r,k)=>{g.drawImage(r.i,k*cw,0);if(r.a)g.drawImage(r.a,k*cw,ch);g.fillText(r.h,k*cw+6,ch*2+16);});return c.toDataURL('image/png').split(',')[1];},shots.map(s=>({h:s.h,idle:s.idle.toString('base64'),atk:s.atk?.toString('base64')||null})));
fs.writeFileSync(path.join(HERE,'heroes-3d.png'),Buffer.from(png,'base64'));console.log('saved heroes-3d.png');await b.close();
