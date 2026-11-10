// R541 브라우저 검사(헤드리스 — 소리가 실제로 풀려 재생 경로에 올라가는지만 본다. 귀로 듣는 확인이 아니다).
//  SW_OFF=1 이면 storyworld.r541.sfx=0(옛 동작: 줍기 무음). SW_URL 기본 http://127.0.0.1:4410/m0/.
import {chromium,boot,go} from '../r444/lib.mjs';
const off=!!process.env.SW_OFF;let errs=0;
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const {p}=await boot(b,{vp:{width:640,height:360},init:off?{'storyworld.r541.sfx':'0'}:null});
p.on('pageerror',()=>errs++);await go(p,'dist01');
const r=await p.evaluate(async()=>{const C=window.__STORYWORLD_SFX_COMFORT__,S=window.__STORYWORLD_SFX_R541__,wait=ms=>new Promise(r=>setTimeout(r,ms));
 try{await unlockAudio();}catch(_){}await wait(300);settings.sound=true;if(!(settings.volume>0))settings.volume=.8;
 const plays=()=>C.inspect().audit.filter(a=>a.kind==='play').map(a=>({role:a.role,path:a.path,level:a.level}));
 const before=plays().length,doors=(room.exploration?.worldR74?.doors||[]).map(d=>({id:d.id,open:!!window.__STORYWORLD_WORLD_R74__.isOpen(room,d)}));
 sound('pickup');await wait(900);sound('pickup');await wait(900);
 const mobs=room.enemies.filter(e=>e.hp>0&&!e.boss&&!e.midboss).slice(0,6);const kill=e=>{e.hp=0;killEnemy(e);};// hitEnemy 와 같은 순서(hp 0 → killEnemy)
 for(const e of mobs.slice(0,5))kill(e);await wait(1200);if(mobs[5])kill(mobs[5]);await wait(900);
 // 문: 실제 상호작용(R74 use)으로 닫힌 문 하나를 연다 → 0.16초 주기 관찰이 열림을 잡아야 한다.
 const W=window.__STORYWORLD_WORLD_R74__;let door=null;for(const d of room.exploration.worldR74.doors){if(W.isOpen(room,d))continue;for(const s of[-1,1]){player.x=d.axis==='x'?d.x+s*.9:d.x;player.y=d.axis==='y'?d.y+s*.9:d.y;
   const t=W.interactions().find(t=>t.id===d.id);if(t&&W.canUse(t)){W.use(t);break;}}if(W.isOpen(room,d)){door=d.id;break;}}
 await wait(700);const doorOpen=door?W.isOpen(room,{id:door}):false;await wait(900);
 const failed=audioStats.failed;
 return {ctx:audioContext?.state,unlocked:audioUnlocked,profiles:S.inspect().profiles,stats:S.inspect().stats,plays:plays().slice(before),failed,doors,door,doorOpen,killed:mobs.length,
  peakBound:C.inspect().conservativePeakBound};});
console.log(JSON.stringify(r));let fail=0;const ok=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)fail++;};
ok('오디오 컨텍스트 running·잠금 해제('+r.ctx+')',r.ctx==='running'&&r.unlocked);
const pk=r.plays.filter(x=>x.role==='pickup'),de=r.plays.filter(x=>x.role==='r541Death');
if(off){ok('끄면 옛 동작: 줍기 무음·소멸음 없음',pk.length===0&&de.length===0&&!r.plays.some(x=>x.role==='r541Door')&&!r.profiles.pickup.length);}
else{ok('줍기 2회 재생, 두 변주가 번갈아('+pk.map(x=>x.path.split('/').pop())+')',pk.length===2&&pk[0].path!==pk[1].path&&pk.every(x=>/assets\/r541\/sfx\/pickup-/.test(x.path)));
 ok('몹 5마리 동시 처치 → 소멸음 1회, 1.2초 뒤 처치 → 1회 더('+de.length+')',r.killed>=6&&de.length===2&&de.every(x=>/death-/.test(x.path)));
 const dr=r.plays.filter(x=>x.role==='r541Door');ok('닫힌 문('+r.door+')을 실제로 열면 문 소리 1회('+dr.length+')',!!r.door&&r.doorOpen&&dr.length===1&&/door-1/.test(dr[0].path));
 ok('재생 음량이 기존 공격음 상한(0.30×음량) 아래('+r.plays.map(x=>x.level.toFixed(3))+')',r.plays.every(x=>x.level<=.30*.6+1e-6));
 ok('오버레이 오류 0·해독 실패 0',r.stats.errors===0&&r.failed===0);}
ok('페이지 오류 0',errs===0);
await b.close();process.exit(fail?1:0);
