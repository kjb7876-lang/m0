// R1329 2D↔3D 같은 자리 비교 화면(헤드리스 SwiftShader, 그래픽 검증 아님). 사용: node r1329-compare.mjs <zone> <이름> <파일 접두>
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url));const [zone,name,out]=process.argv.slice(2);
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:960,height:540}});await p.evaluate(()=>{for(const k of ['__STORYWORLD_ENTRY_VIDEO_R1036__','__STORYWORLD_LINEART_VIDEO_R1080__'])try{window[k]?.set({on:false});}catch(_){}});await go(p,zone);
const id=await p.evaluate(name=>{player.hp=player.maxHp=1e6;const s=room.enemies.find(e=>e.hp>0&&String(e.name).replace(/\s+(후속 증원|증원|추격대|\d+)$/,'')===name);if(!s)return null;
 s.hp=s.maxHp=1e7;s.speed=0;s.damage=0;if('spawnState'in s)s.spawnState='active';s.visible=true;s.x=player.x+1.3;s.y=player.y-0.4;s.homeX=s.x;s.homeY=s.y;s.nav=[];
 for(const o of room.enemies)if(o!==s){o.x=player.x+40;o.y=player.y+40;o.homeX=o.x;o.homeY=o.y;o.speed=0;}return String(s.id);},name);
if(!id){console.log('없음');process.exit(1);}
const W=window=>0;
for(const [mode,v] of [['3d',true],['2d',false]]){await p.evaluate(v=>window.__STORYWORLD_MOB3D_R1329__.set(v),v);
 if(v)await p.waitForFunction(id=>window.__STORYWORLD_MOB3D_R1329__.inspect().instances.some(x=>x.id===id&&x.visible),id,{timeout:120000}).catch(()=>{});
 await p.waitForTimeout(3000);await skip(p);await p.waitForTimeout(400);await p.screenshot({path:path.join(HERE,out+'-'+mode+'.png'),clip:{x:330,y:140,width:300,height:240}});}
console.log(JSON.stringify(await p.evaluate(id=>window.__STORYWORLD_MOB3D_R1329__.tintOf(id),id)));await b.close();
