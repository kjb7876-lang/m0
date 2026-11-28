// R1393 브라우저 검사(헤드리스 — GPU·실기기 아님): 몹 둘레 붉은 테가 사라지고 먹빛 테는 남는지.
//  A) R409 굽기 실물: 회색 몸 칸을 적 테로 구운 캔버스에서 붉은 픽셀 0, 어두운 테 픽셀 있음(끄면 붉은 픽셀이 생김 = 검사가 회귀를 잡음).
//  B) 첫 몹 맵 dist00(3D 켬): 보이는 3D 껍질 중 붉은 재질 0, 안쪽 먹 껍질은 보임. 화면 몹 둘레 붉은 픽셀이 끔 대비 절반 이하.
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1393/r1393-browser.mjs <shots dir>
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2]||'/tmp/r1393';fs.mkdirSync(OUT,{recursive:true});let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(d!==undefined?' '+JSON.stringify(d):''));};
const b=await chromium.launch();
const nc=b.newContext.bind(b);b.newContext=async o=>{const c=await nc(o);await c.addInitScript(()=>{Object.defineProperty(Navigator.prototype,'webdriver',{get:()=>false});});return c;};
const {p}=await boot(b,{init:{'storyworld.r619.videopause':'{"on":false}','storyworld.r1036.entryvideo':'{"on":false}','storyworld.r309.opening':'{"on":false}','storyworld.r372.rootgate':'{"on":false}'}});
// A
const A=await p.evaluate(()=>{const R=window.__STORYWORLD_COMBAT_READ_R409__,X=window.__STORYWORLD_ENEMY_RIM_R1393__;
 const src=document.createElement('canvas');src.width=40;src.height=80;const g=src.getContext('2d');g.fillStyle='rgb(90,90,90)';g.fillRect(6,6,28,68);
 const count=()=>{const row=R.bakeRaw(src,0,0,40,80,6,'enemy','fast');const c=row.canvas,d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let red=0,ring=0;
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4,inBody=x-row.pad>=6&&x-row.pad<34&&y-row.pad>=6&&y-row.pad<74;if(inBody)continue;const a=d[i+3];if(a<20)continue;ring++;if(d[i]-Math.max(d[i+1],d[i+2])>30)red++;}
  return {red,ring};};
 const on=count();X.set('off');const off=count();X.set('on');return {on,off,rev:X.inspect().revision};});
ok(A.on.red===0,'A 켬: 적 테 붉은 픽셀 0',A.on);ok(A.on.ring>50,'A 켬: 먹빛 테는 남음(테 픽셀 >50)',A.on);ok(A.off.red>50,'A 끔: 예전 핏빛 테(검사가 회귀를 잡음)',A.off);
// B
await go(p,'dist00');
const place=()=>p.evaluate(()=>{player.hp=player.maxHp=1e9;player.invincible=1e9;let i=0;for(const e of room.enemies){if(!(e.hp>0))continue;if(i<7){e.spawnState='active';e.hidden=false;e.engaged=true;e.hp=e.maxHp=1e8;e.speed=0;e.attackCooldown=99;e.x=player.x+(i-3)*1.5;e.y=player.y-1.6;}else{e.x=player.x+300;e.y=player.y+300;}i++;}});
await place();for(let i=0;i<10;i++){await p.waitForTimeout(1200);await skip(p);await place();}
const red=async tag=>{const buf=await p.screenshot({path:`${OUT}/dist00-${tag}.png`});return p.evaluate(async b64=>{const im=new Image();im.src='data:image/png;base64,'+b64;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);
 const w=im.width,h=Math.round(im.height*.45),d=g.getImageData(0,Math.round(im.height*.25),w,h).data;let r=0;
 /* 체력바(가로로 12px 넘게 이어진 붉은 줄)는 UI 라 뺀다 — 몹 둘레 테만 센다 */
 for(let y=0;y<h;y++){let x=0;while(x<w){const i=(y*w+x)*4;if(d[i]-Math.max(d[i+1],d[i+2])>60&&d[i]>90){let e=x;while(e<w){const j=(y*w+e)*4;if(!(d[j]-Math.max(d[j+1],d[j+2])>60&&d[j]>90))break;e++;}if(e-x<12)r+=e-x;x=e;}else x++;}}return r;},buf.toString('base64'));};
const B=await p.evaluate(()=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three;let vis=0,visRed=0,inner=0;const SH=/^r13\d\d[a-z]?-ink-shell$/;
 r.scene.traverse(o=>{if(!SH.test(o.name)||/^r130/.test(o.name))return;const m=o.material;if(!m?.color)return;const red=m.color.r>.1&&m.color.r>m.color.g*2.2;if(m.visible!==false&&o.visible!==false){vis++;if(red)visRed++;else inner++;}});
 const mods=Object.keys(window).filter(k=>/^__STORYWORLD_(MOB3D|BOSS3D)_R1312/.test(k)).map(k=>window[k].inspect?.().shown);return {vis,visRed,inner,mods,rim:window.__STORYWORLD_ENEMY_RIM_R1393__.inspect()};});
ok(B.visRed===0,'B 보이는 3D 붉은 바깥 껍질 0',B);ok(B.inner>0||B.mods.every(s=>!s),'B 안쪽 먹 껍질은 보임(3D 몹이 있을 때)',B);
const rOn=await red('on');await p.evaluate(()=>window.__STORYWORLD_ENEMY_RIM_R1393__.set('off'));for(let i=0;i<3;i++){await p.waitForTimeout(1500);await place();}
const rOff=await red('off');await p.evaluate(()=>window.__STORYWORLD_ENEMY_RIM_R1393__.set('on'));
ok(rOff>60,'B 끔 장면에 붉은 테 픽셀이 실제로 있음(비교 의미, 체력바 뺌)',rOff);ok(rOn<=rOff*.5,'B 몹 둘레 붉은 픽셀 켬 ≤ 끔의 절반',{rOn,rOff});
const E=await p.evaluate(()=>({r409:window.__STORYWORLD_COMBAT_READ_R409__.inspect().stats.errors,rim:window.__STORYWORLD_ENEMY_RIM_R1393__.inspect().stats.errors}));ok(E.r409===0&&E.rim===0,'오류 0',E);
console.log(`R1393 browser ${n-bad}/${n} passed`);await b.close();process.exit(bad?1:0);
