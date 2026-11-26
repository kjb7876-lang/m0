// R1330 브라우저 검사 + 2D/3D 비교 사진(헤드리스 Chromium + SwiftShader — 그래픽 검증 아님).
//  3D 몹 설정은 기본(꺼짐) 그대로. 7대죄 지역 R1326 규칙으로 20종이 3D 로 나오는지 하나씩 본다.
//  사진: 규칙 끔(2D) / 켬(3D) 을 같은 자리에서 찍어 OUT/r1330-<번호>-{2d,3d}.png.
// 실행: 정적 서버 뒤 `SW_URL=... node r96/qa/r1330/r1330-browser.mjs`
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url)),OUT=process.env.OUT||HERE;
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const waitGame=async(p,sec)=>{const t0=await p.evaluate(()=>time);for(let n=0;n<200;n++){await skip(p);if(await p.evaluate(t=>time>t,t0+sec))break;await p.waitForTimeout(700);}};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errs=[];const {p}=await boot(b,{vp:{width:960,height:540},init:{}});p.on('pageerror',e=>errs.push(String(e)));
const L=[['01','ep1b02','나태의 껍데기 파수'],['02','ep1b03','긴 뱀의 그림자'],['03','ep1b03','추녀의 한탄'],['04','ep1b03','금이 간 비교잔영'],['05','ep1b04','살아 있는 거대한 위장'],['06','ep1b04','끓어오르는 검은 소화액'],['07','ep1b04','폐기주방 감독'],
 ['08','ep1b05','공중을 가르는 립스틱 탄환'],['09','ep1b05','심장빛 무대감독'],['10','ep1b06','칼날이 된 지폐'],['11','ep1b06','박제된 여우의 악마'],['12','ep1b06','모든 면이 뒷면인 동전'],['13','ep1b06','금고 장부감시자'],['14','ep1b06','B:회장에게 고용된 총지배인 · 맘몬'],
 ['15','ep1b07','불길 속의 늑대'],['16','ep1b07','불길 속의 용'],['17','ep1b07','호텔 화염기사'],['18','ep1b08','흑마법사의 저주창'],['19','ep1b08','육망성의 흑마술 실험체'],['20','ep1b08','흑마법사의 시체경호체']];
let zone=null;
for(const [nn,z,raw] of L){const boss=raw.startsWith('B:'),name=raw.replace(/^B:/,'');
 if(z!==zone){await go(p,z);await skip(p);zone=z;}
 const id=await p.evaluate(([name,boss])=>{player.hp=player.maxHp=1e6;for(const e of room.enemies)e.damage=0;
  const s=room.enemies.find(e=>(!!e.boss===boss)&&e.hp>0&&String(e.name)===name);if(!s)return null;
  s.hp=s.maxHp=1e7;s.speed=0;s.visible=true;if('spawnState'in s)s.spawnState='active';
  for(const o of room.enemies)if(o!==s&&Math.hypot(o.x-player.x,o.y-player.y)<9){o.x+=30;o.homeX=o.x;}
  window.__s=s;window.__pin=()=>{s.x=player.x+2.0;s.y=player.y-.6;s.homeX=s.x;s.homeY=s.y;s.nav=[];};window.__pin();return String(s.id);},[name,boss]);
 if(!id){ok(false,nn+' '+name+' 찾음');continue;}
 await p.evaluate(()=>window.__STORYWORLD_MOB3D_ZONE_R1326__.set(false));await waitGame(p,.5);await p.evaluate(()=>window.__pin());await p.waitForTimeout(500);
 await p.screenshot({path:`${OUT}/r1330-${nn}-2d.png`,clip:{x:400,y:90,width:360,height:330}});
 await p.evaluate(()=>window.__STORYWORLD_MOB3D_ZONE_R1326__.set(true));
 const v=await p.waitForFunction(id=>window.__STORYWORLD_MOB3D_R1330__.inspect().instances.some(x=>x.id===id&&x.visible),id,{timeout:240000}).then(()=>true).catch(()=>false);
 ok(v,nn+' '+name+' 3D 나옴(설정 꺼짐, 7대죄 규칙)');
 await waitGame(p,.8);await p.evaluate(()=>window.__pin());await p.waitForTimeout(500);
 await p.screenshot({path:`${OUT}/r1330-${nn}-3d.png`,clip:{x:400,y:90,width:360,height:330}});
 await p.evaluate(()=>{const s=window.__s;if(s){s.x+=30;s.homeX=s.x;s.speed=0;}});}
const ins=await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1330__.inspect());
ok(!(ins.failed||[]).length,'GLB 읽기 실패 0 '+JSON.stringify(ins.failed));ok(!ins.lastError,'오버레이 오류 0 '+(ins.lastError||''));
ok(!errs.length,'페이지 오류 0 '+(errs[0]||''));
await b.close();console.log(fail?'R1330 browser FAIL '+fail:'R1330 browser ALL OK');process.exit(fail?1:0);
