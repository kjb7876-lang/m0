// R1363 EGO(각성 영웅) 3D 몸이 깜빡이지 않음 — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  사용자 11-27 "각성영웅 ego 몸체 깜빡임문제도 개선". 그리는 순간마다(scene.onAfterRender) 3D 몸 묶음의 보임·몸 재질 불투명도를 적는다.
//  대기 → 걷기 → 공격(연속) 각 구간에서: ① 몸이 보이는 프레임 비율 = 100%(중간에 사라지는 프레임 없음). ② 몸 불투명도 프레임 사이 변화 ≤ .15, 가장 낮은 값 ≥ .9.
//  비교로 환도(같은 몸 틀)도 같은 방식으로 잰다. ③ 오류 0.
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1363/r1363-browser.mjs` (HEROES=ego, DUMP=1)
import {chromium,boot,go} from '../r444/lib.mjs';
const HEROES=(process.env.HEROES||'ego,hwando').split(','),SEC=+(process.env.SEC||1.2);
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:640,height:400}});await go(p,process.env.ZONE||'dist00');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;e.hp=e.maxHp=1e9;}window.__STORYWORLD_HWANDO3D_R1302__.set(true);});
const pick=async h=>{await p.evaluate(async h=>{const base=h==='ego'?'hwando':h;try{await ensureImages(heroPaths(base));}catch(_){}player.personaHeroR1113=false;player.egoSovereignR1046=h==='ego';player.hero=base;player.moving=false;player.attackAnim=0;},h);
 await p.waitForFunction(h=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return i.hero===h&&i.shown;},h,{timeout:240000});await p.waitForTimeout(2000);};
const hook=h=>p.evaluate(h=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,s=r.scene;if(!s.__r1363){s.__r1363=true;const prev=s.onAfterRender;s.onAfterRender=function(...a){try{window.__r1363F?.();}catch(e){window.__r1363E=String(e);}return prev?.apply(this,a);};}
 window.__r1363F=()=>{if(!window.__r1363On)return;const g=s.getObjectByName('r1305-'+h+'-3d-shared');let body=null;g?.traverse(x=>{if(!body&&x.isSkinnedMesh&&!/^r13/.test(x.name||'')&&!x.material?.userData?.r1305Ink)body=x;});
  let vis=!!g;for(let q=body;q;q=q.parent)if(q.visible===false){vis=false;break;}const m=body?(Array.isArray(body.material)?body.material[0]:body.material):null;
  const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();window.__r1363L.push({t:time,vis,op:m?m.opacity:null,iop:i.opacity,shown:i.shown,mode:window.__r1363M});};},h);
const seg=(mode,sec)=>p.evaluate(async([mode,sec])=>{window.__r1363L=[];window.__r1363M=mode;clearInterval(window.__r1363A);route.length=0;player.moving=false;player.attackAnim=0;target=null;
 const es=room.enemies.filter(e=>e.hp>0&&!e.boss);es.forEach((e,i)=>{if(i){e.x=player.x+999;e.y=player.y+999;}});
 if(mode==='walk'){const x0=player.x,y0=player.y;let k=0;window.__r1363A=setInterval(()=>{if(route.length<2){k++;route.length=0;route.push({x:x0+(k%2?2.5:-2.5),y:y0});player.moving=true;}},60);}
 if(mode==='attack'){const e=es[0];e.x=player.x+.9;e.y=player.y;window.__r1363A=setInterval(()=>{player.attackCD=0;try{basicAttack(true);}catch(_){}},120);}
 window.__r1363On=true;const t0=time;await new Promise(r=>{const f=()=>{if(time-t0>sec)r();else setTimeout(f,40);};f();});window.__r1363On=false;clearInterval(window.__r1363A);route.length=0;player.moving=false;return window.__r1363L;},[mode,sec]);
for(const h of HEROES){await pick(h);await hook(h);
 for(const mode of ['idle','walk','attack']){const L=await seg(mode,SEC);const n=L.length,vis=L.filter(x=>x.vis).length,ops=L.filter(x=>x.vis&&x.op!=null).map(x=>x.op);
  let jump=0,at=-1;for(let i=1;i<L.length;i++){const a=L[i-1],c=L[i];const d=Math.abs((a.vis?a.op:0)-(c.vis?c.op:0));if(d>jump){jump=d;at=i;}}const mn=ops.length?Math.min(...ops):0;
  console.log(`info ${h} ${mode}: 프레임 ${n}, 보임 ${vis}, 불투명도 최소 ${mn.toFixed(3)}·최대 ${ops.length?Math.max(...ops).toFixed(3):'-'}, 프레임 사이 최대 변화 ${jump.toFixed(3)}`);
  if(process.env.DUMP&&at>0)L.slice(Math.max(0,at-4),at+4).forEach((x,i)=>console.log('  ',JSON.stringify(x)));
  ok(n>=20&&vis===n,`① ${h} ${mode}: 몸이 모든 프레임에 보임 (${vis}/${n})`);
  ok(jump<=.15&&mn>=.9,`② ${h} ${mode}: 불투명도 최소 ${mn.toFixed(3)} ≥ .9, 프레임 사이 최대 변화 ${jump.toFixed(3)} ≤ .15`);}}
{const e=await p.evaluate(()=>window.__r1363E||null);ok(!e,'③ 오류 0 '+(e||''));}
await b.close();console.log(fail?`\nR1363 브라우저 FAIL ${fail}`:'\nR1363 브라우저 PASS');process.exit(fail?1:0);
