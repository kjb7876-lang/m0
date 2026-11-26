// R1323 브라우저 검사(헤드리스 SwiftShader, 그래픽 검증 아님):
//  ① 3D 몹 몸 재질에 맵 수묵(R1055)·국지 조명(R451)이 안 걸림(캐시 키에 |r1055·r451 없음)
//  ② #1022 Codex P2: 공격 각이 정해진 채 영웅이 반대편으로 가도 3D 몸은 공격 각을 봄(영웅 쪽으로 안 돎), 공격이 끝나면 다시 영웅 쪽
// 실행: 정적 서버(http://127.0.0.1:4410/m0/) 뒤 `node r96/qa/r1323/r1323-browser.mjs`
import {chromium,boot,go,skip} from '../r444/lib.mjs';
// 게임 시간으로 기다림(헤드리스는 느림). 이야기 장면·창이 뜨면 시간이 멈추므로 기다리는 동안 넘긴다.
const waitGame=async(p,sec)=>{const t0=await p.evaluate(()=>time);for(let n=0;n<240;n++){await skip(p);if(await p.evaluate(t=>time>t,t0+sec))break;await p.waitForTimeout(1000);}return [t0,await p.evaluate(()=>time)];};
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errs=[];const {p}=await boot(b,{vp:{width:640,height:360},init:{'storyworld.r1322.mob3d':'on'}});p.on('pageerror',e=>errs.push(String(e)));
await go(p,'cult04');await skip(p);
const id=await p.evaluate(()=>{player.hp=player.maxHp=1e6;for(const e of room.enemies)e.damage=0;const s=room.enemies.find(e=>!e.boss&&e.hp>0&&e.name==='태엽 수집자');if(!s)return null;
 s.hp=s.maxHp=1e7;s.speed=0;s.visible=true;if('spawnState'in s)s.spawnState='active';s.x=player.x-1.4;s.y=player.y-1.0;s.homeX=s.x;s.homeY=s.y;
 for(const o of room.enemies)if(o!==s&&Math.hypot(o.x-player.x,o.y-player.y)<6){o.x+=25;o.homeX=o.x;}window.__s=s;return String(s.id);});
ok(!!id,'cult04 태엽 수집자 찾음');
await p.waitForFunction(id=>window.__STORYWORLD_MOB3D_R1322__.inspect().instances.some(x=>x.id===id&&x.visible),id,{timeout:200000}).catch(()=>{});
const keys=await p.evaluate(()=>{const h=window.__STORYWORLD_PHASE1__.controller.state.three;const out=[];h.scene.traverse(o=>{if(!/^r1322-/.test(String(o.name)))return;o.traverse(m=>{if(m.isMesh&&!m.userData.r1322Ink)for(const mt of [].concat(m.material))out.push(mt.customProgramCacheKey?.()||'');});});return out;});
ok(keys.length>0&&keys.every(k=>!k.includes('|r1055')&&!k.includes('r451')),'몸 재질에 R1055·R451 없음 ('+keys.length+'개)');
// 공격 각 0(+x 쪽)으로 고정하고 영웅을 몹의 -x 쪽으로: 몸 yaw 는 atan2(cos0,sin0)=π/2 근처여야(영웅 쪽이면 -π/2 근처).
await p.evaluate(()=>{const s=window.__s;const fix=(k,v)=>Object.defineProperty(s,k,{configurable:true,get:()=>v,set(){}});fix('attack',{angle:0,elapsed:0,committed:true});fix('state','attack');fix('moveDX',0);fix('moveDY',0);player.x=s.x-2.5;player.y=s.y;});
console.log('  game time',...await waitGame(p,1.5));
const yaw=await p.evaluate(id=>window.__STORYWORLD_MOB3D_R1322__.inspect().instances.find(x=>x.id===id)?.yaw,id);
ok(Number.isFinite(yaw)&&Math.abs(yaw-Math.PI/2)<.5,'공격 중 몸은 공격 각(+x)을 봄 yaw='+yaw+' (영웅 쪽이면 약 -1.57)');
await p.evaluate(()=>{const s=window.__s;for(const k of ['attack','state','moveDX','moveDY'])delete s[k];s.attack=null;s.state='idle';s.moveDX=s.moveDY=0;const fix=(k,v)=>Object.defineProperty(s,k,{configurable:true,get:()=>v,set(){}});fix('attack',null);fix('state','idle');fix('moveDX',0);fix('moveDY',0);});
console.log('  game time',...await waitGame(p,1.5),JSON.stringify(await p.evaluate(()=>({px:player.x,py:player.y,sx:window.__s.x,sy:window.__s.y}))));
const y2=await p.evaluate(id=>{const s=window.__s;return {yaw:window.__STORYWORLD_MOB3D_R1322__.inspect().instances.find(x=>x.id===id)?.yaw,want:Math.atan2(player.x-s.x,player.y-s.y)};},id);
let d2=Math.abs((y2.yaw??NaN)-y2.want);if(d2>Math.PI)d2=Math.PI*2-d2;
ok(Number.isFinite(d2)&&d2<.35,'공격이 없으면 영웅 쪽 yaw='+y2.yaw+' / 영웅 쪽 '+y2.want.toFixed(3));
ok(!errs.length,'페이지 오류 0 '+errs.slice(0,2).join(' | '));
console.log(fail?'R1323 BROWSER FAIL '+fail:'R1323 BROWSER ALL OK');await b.close();process.exit(fail?1:0);
