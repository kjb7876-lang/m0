// R1383 헤드리스 브라우저 검사(GPU·실기기·손맛 미검증): 뿌리의 문지기 보스전에서 패턴 터짐이 보라 촉수 대신 갈색 뿌리 시트로 그려지고,
//  보스에게 맞으면 가시 속박(걸어서 못 움직임)이 걸리는지 + 스크린샷. 정적 서버: SW_URL(기본 http://127.0.0.1:4410/m0/).
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.env.R1383_OUT||'/tmp/r1383-shots';fs.mkdirSync(OUT,{recursive:true});const SECS=+(process.env.R1383_SECS||24);
let fail=0;const ok=(n,c,d)=>{console.log((c?'PASS ':'FAIL ')+n+(d!==undefined?' '+JSON.stringify(d).slice(0,400):''));if(!c)fail++;};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await go(p,'dist00');
const setup=await p.evaluate(()=>{const e=room.enemies.find(x=>x.nativeId==='dist00-boss');if(!e)return null;room.engaged=true;e.spawnState='active';e.hidden=false;e.x=player.x+3;e.y=player.y-1;
 for(const m of room.enemies)if(m!==e)m.hp=0;window.__boss=e;window.__seen={paths:{},bound:0,held:0,tries:0};
 const X=window.__STORYWORLD_ROOT_BIND_R1383__,A=window.__STORYWORLD_BOSS_IDENTITY_R1346__;return {name:e.name,x:X?.inspect(),burst:A?.burstSheet?.({owner:e.id})?.path,pair:A?.r411Pair?.(e)};});
ok('보스·R1383 설치',!!setup&&setup.x?.installed===true&&setup.burst==='assets/r1383/root-bind24.webp',setup);
const t0=await p.evaluate(()=>time);let shots=0,k=0;
while(true){k++;const r=await p.waitForFunction(a=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);player.hp=Math.max(player.hp,maxHP()*.9);const e=window.__boss;if(e)e.hp=Math.max(e.hp,e.maxHp*.8);
  if(time<a[0]+a[1])return false;const S=window.__seen,F=window.__STORYWORLD_BOSS_PATTERN_FX_R1040__?.inspect?.();for(const q of F?.placed||[])S.paths[q.path]=(S.paths[q.path]||0)+1;
  const bd=window.__STORYWORLD_PAINTED_VFX_R87__?.inspect?.().binding;if(bd){S.bound++;const x=player.x,y=player.y;S.tries++;const moved=moveActor(player,.3,0);if(!moved&&player.x===x&&player.y===y)S.held++;}
  return {t:time,live:F?.live||0,bound:!!bd};},[t0,k*.5],{timeout:300000}).then(h=>h.jsonValue());
 if(shots<6&&(r.live>0||r.bound)&&k%2===0){shots++;await p.screenshot({path:`${OUT}/r1383-dist00-${String(k).padStart(2,'0')}${r.bound?'-bound':''}.png`});}
 if(k*.5>=SECS)break;}
// 블링크 탈출(걷기와 따로): 묶였을 때 S(블링크) → 풀림
let esc=null;for(let i=0;i<40&&!esc;i++){const st=await p.waitForFunction(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);player.hp=Math.max(player.hp,maxHP()*.9);const e=window.__boss;if(e)e.hp=Math.max(e.hp,e.maxHp*.8);return {b:!!window.__STORYWORLD_PAINTED_VFX_R87__?.inspect?.().binding,t:time};},null,{timeout:120000}).then(h=>h.jsonValue());
 if(st.b){const before=await p.evaluate(()=>[player.x,player.y,window.__STORYWORLD_PAINTED_VFX_R87__.inspect().binding.start,time]);await p.keyboard.press('s');await p.waitForFunction(t=>time>=t+.4,st.t,{timeout:120000});esc=await p.evaluate(b=>{const bd=window.__STORYWORLD_PAINTED_VFX_R87__.inspect().binding,m=window.__STORYWORLD_PAINTED_VFX_R87__.inspect().metrics;/* 빠져나온 뒤 다시 맞아 새로 묶일 수 있음 → 같은 속박(시작 시각)이 남아 있는지로 본다 */return {still:!!bd&&bd.start===b[2],rebound:!!bd&&bd.start>=b[3],moved:Math.hypot(player.x-b[0],player.y-b[1]),releases:m.releases};},before);}
 else await p.waitForFunction(t=>time>=t+.3,st.t,{timeout:120000});}
ok('묶인 채 블링크(S)로 빠져나감(같은 속박이 풀림; 다시 맞아 새로 묶이는 건 따로)',!!esc&&!esc.still&&esc.moved>.5,esc);
const seen=await p.evaluate(()=>({...window.__seen,x:window.__STORYWORLD_ROOT_BIND_R1383__.inspect(),r1346:window.__STORYWORLD_BOSS_IDENTITY_R1346__.inspect()}));
const paths=Object.keys(seen.paths);
ok('패턴 터짐이 실제로 그려짐(뿌리 시트)',(seen.paths['assets/r1383/root-bind24.webp']||0)>0,seen.paths);
ok('촉수 시트 0회',!paths.some(q=>/tentacle/.test(q)),seen.paths);
ok('맞으면 가시 속박이 걸리고 그동안 걸어서 못 움직임',seen.bound>0&&seen.held===seen.tries,{bound:seen.bound,held:seen.held,tries:seen.tries});
ok('R1040 그리기 감쌈(1.35배·벽 칸 건너뜀·투명도 상한)이 실제로 탐',seen.x.wrapped===true&&seen.x.draws>0,seen.x);
ok('페이지 오류·R1346 오류 없음',!errs.length&&seen.r1346.errors===0,[errs,seen.r1346.errors]);
await b.close();console.log(fail?`R1383 browser: ${fail} failed`:'R1383 browser: all passed');process.exit(fail?1:0);
