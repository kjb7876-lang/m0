// R544 브라우저 검사(헤드리스 — 재생 경로·음량 수치만 본다. 귀로 듣는 확인이 아니다). SW_OFF=1 이면 R544 만 끈 동작.
import {chromium,boot,go} from '../r444/lib.mjs';
const off=!!process.env.SW_OFF;let errs=0;
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const {p}=await boot(b,{vp:{width:640,height:360},init:off?{'storyworld.r544.sfx':'0'}:null});
p.on('pageerror',e=>{errs++;console.log('pageerror',String(e).slice(0,120));});
const THEMES=['body','machine','beast','slime','glass','spirit'],HEROES=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner'];
const zones=await p.evaluate(()=>Object.keys(regionById).filter(z=>!regionById[z].safe));const got={};let level=null;
for(const z of zones){if(THEMES.every(t=>got[t]))break;try{await go(p,z);}catch(_){continue;}
 const res=await p.evaluate(async([need])=>{const C=window.__STORYWORLD_SFX_COMFORT__,S=window.__STORYWORLD_SFX_R541__,wait=ms=>new Promise(r=>setTimeout(r,ms));
  try{await unlockAudio();}catch(_){}settings.sound=true;if(!(settings.volume>0))settings.volume=.8;player.hp=9e6;room.engaged=true;const out={};
  const plays=()=>C.inspect().audit.filter(a=>a.kind==='play').map(a=>({role:a.role,path:a.path.split('/').pop(),level:a.level}));
  for(const t of need){for(const x of room.enemies){x.speed=0;x.damage=0;}
   // 실제로 맞는 적만 고른다(등장 전이거나 무적인 적은 hitEnemy 가 받지 않는다)
   let e=null;for(const c of room.enemies){if(!(c.hp>0)||c.boss||c.deadRecorded||S.themeOf(c.name)!==t)continue;c.hp=c.maxHp=1e6;const h0=c.hp;hitEnemy(c,1);if(c.hp<h0){e=c;break;}}if(!e)continue;
   await wait(1300);const n0=plays().length;let calls=0;
   while(calls<14&&!plays().slice(n0).some(x=>x.role==='enemyHit')){hitEnemy(e,1);calls++;await wait(60);}   // 엔진은 7번에 1번만 울린다
   await wait(700);const d0=S.inspect().stats.themeDeath;e.hp=1;hitEnemy(e,5);if(!e.deadRecorded)killEnemy(e);
   // 엔진은 처음 쓰는 음원을 다듬느라 늦으면 그 한 번을 버릴 수 있다(기존 동작) → 재생 기록을 2.5초까지 기다린다. 모듈이 그 죽음에 테마 소리를 골랐는지는 집계로 따로 본다.
   const t0=performance.now();while(performance.now()-t0<2500&&!plays().slice(n0).some(x=>x.role==='r541Death'))await wait(100);
   out[t]={name:e.name,calls,hit:plays().slice(n0).filter(x=>x.role==='enemyHit'),death:plays().slice(n0).filter(x=>x.role==='r541Death'),picked:S.inspect().stats.themeDeath-d0,dead:!!e.deadRecorded};}
  return out;},[THEMES.filter(t=>!got[t])]);
 for(const[t,v]of Object.entries(res)){got[t]={zone:z,...v};console.log(t,JSON.stringify(got[t]));}}
// 영웅 피격·버튼
const rest=await p.evaluate(async HEROES=>{const C=window.__STORYWORLD_SFX_COMFORT__,S=window.__STORYWORLD_SFX_R541__,wait=ms=>new Promise(r=>setTimeout(r,ms));
 const plays=()=>C.inspect().audit.filter(a=>a.kind==='play').map(a=>({role:a.role,path:a.path.split('/').pop(),level:a.level}));
 for(const x of room.enemies){x.speed=0;x.damage=0;}const hero0=player.hero,out={hurt:{}};
 for(const h of HEROES){await wait(450);player.hero=h;player.hp=9e6;player.invincible=0;player.guard=false;const n0=plays().length;let res=null,tries=0;
  // 엔진은 처음 쓰는 음원을 다듬는 동안 늦으면 그 한 번을 버릴 수 있다(기존 동작) → 두 번까지 맞아 본다. 틀린 소리가 한 번이라도 나면 실패.
  while(tries<2&&!plays().slice(n0).some(x=>x.role==='hurt')){player.invincible=0;player.hp=9e6;res=hurt(3,{x:player.x+1,y:player.y});tries++;await wait(600);}
  out.hurt[h]={res,tries,plays:plays().slice(n0).filter(x=>x.role==='hurt')};}
 player.hero=hero0;player.hp=9e6;await wait(400);let n0=plays().length;const btn=document.createElement('button');btn.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px;opacity:0';document.body.appendChild(btn);btn.click();await wait(700);btn.remove();out.click=plays().slice(n0).filter(x=>x.role==='r544Click');
 out.st=S.inspect().stats;out.failed=audioStats.failed;out.roles=C.roles;return out;},HEROES);
console.log(JSON.stringify(rest));let fail=0;const ok=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)fail++;};
const found=THEMES.filter(t=>got[t]);
if(off){ok('R544 끄면 피격·죽음·아군 피격이 옛 소리, 버튼 소리 없음',found.every(t=>got[t].hit.every(x=>!/^hit-/.test(x.path))&&got[t].death.every(x=>/^death-[12]\.ogg$/.test(x.path)))&&HEROES.every(h=>rest.hurt[h].plays.every(x=>!/^hurt-/.test(x.path)))&&rest.click.length===0);}
else{ok('실제 맵의 적에서 테마 6개를 모두 찾음('+found.map(t=>t+'='+got[t].name+'@'+got[t].zone).join(', ')+')',found.length===6);
 for(const t of found){const g=got[t];ok(t+' 피격: 실제 hitEnemy '+g.calls+'번 중 재생된 소리가 hit-'+t+'('+g.hit.map(x=>x.path)+')',g.hit.length>=1&&g.hit.every(x=>x.path==='hit-'+t+'.ogg'));
  ok(t+' 죽음: 모듈이 테마 소리를 고름('+g.picked+'), 재생 기록 death-'+t+'('+g.death.map(x=>x.path)+')',g.dead&&g.picked===1&&g.death.length===1&&g.death[0].path==='death-'+t+'.ogg');}
 ok('피격음 음량이 바꾸기 전 피격음(0.119) 이하('+found.flatMap(t=>got[t].hit.map(x=>x.level.toFixed(3))).join()+')',found.every(t=>got[t].hit.every(x=>x.level<=rest.roles.enemyHit.gain*.7+1e-6)));
 ok('죽음음 음량이 특수음 역할 상한의 절반 아래',found.every(t=>got[t].death.every(x=>x.level<=rest.roles.special.gain*.5+1e-6)));
 for(const h of HEROES){const v=rest.hurt[h];ok(h+' 피격: 실제 hurt() 가 hurt-'+h+' 로('+v.res+', '+v.tries+'번째 → '+v.plays.map(x=>x.path+'@'+x.level.toFixed(3))+')',v.plays.length>=1&&v.plays.every(x=>x.path==='hurt-'+h+'.ogg')&&v.plays[0].level<=rest.roles.hurt.gain*.7+1e-6);}
 ok('버튼 누름: 버튼 소리('+rest.click.map(x=>x.path+'@'+x.level.toFixed(3))+')',rest.click.length===1&&rest.click[0].path==='click-1.ogg');
 ok('해독 실패 0·오버레이 오류 0',rest.failed===0&&rest.st.errors===0);}
ok('페이지 오류 0',errs===0);
await b.close();process.exit(fail?1:0);
