// R542 브라우저 검사(헤드리스 — 재생 경로·음량 수치만 본다. 귀로 듣는 확인이 아니다). SW_OFF=1 이면 옛 동작.
import {chromium,boot,go} from '../r444/lib.mjs';
const off=!!process.env.SW_OFF;let errs=0;
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const {p}=await boot(b,{vp:{width:640,height:360},init:off?{'storyworld.r541.sfx':'0'}:null});
p.on('pageerror',()=>errs++);
// 부술 수 있는 상자(R108)가 있는 지역을 찾는다
const zones=await p.evaluate(()=>Object.keys(regionById).filter(z=>!regionById[z].safe).slice(0,14));let crateZone=null;
for(const z of zones){await go(p,z);if(await p.evaluate(()=>(room.props||[]).some(o=>window.__STORYWORLD_CRATES_R108__.eligible(o)))){crateZone=z;break;}}
if(!crateZone)await go(p,'dist01');console.log('crate zone',crateZone);
const r=await p.evaluate(async()=>{const C=window.__STORYWORLD_SFX_COMFORT__,wait=ms=>new Promise(r=>setTimeout(r,ms));
 try{await unlockAudio();}catch(_){}await wait(300);settings.sound=true;if(!(settings.volume>0))settings.volume=.8;
 const plays=()=>C.inspect().audit.filter(a=>a.kind==='play').map(a=>({role:a.role,path:a.path.split('/').pop(),level:a.level})),n0=plays().length,hero0=player.hero;
 player.hero='hunter';sound('attack');await wait(700);player.hero='hwando';sound('attack');await wait(700);player.hero=hero0;
 sound('swHeal');await wait(1200);
 const nb=soundProfiles.boss.length;for(let i=0;i<nb;i++){sound('boss');await wait(1900);}
 // 상자: 실제 상자 소품을 부순다(R108)
 const X=window.__STORYWORLD_CRATES_R108__,crate=(room.props||[]).find(o=>X.eligible(o));let broke=null;
 if(crate){player.x=crate.x+.5;player.y=crate.y;await wait(300);const n1=X.inspect().boxes.length;interact();await wait(1000);broke=X.inspect().boxes.length<n1;}
 return {plays:plays().slice(n0),boss:soundProfiles.boss.map(r=>r.path.split('/').pop()),heal:soundProfiles.swHeal.map(r=>r.path.split('/').pop()),crate:!!crate,api:X?Object.keys(X):null,broke,failed:audioStats.failed,st:window.__STORYWORLD_SFX_R541__.inspect().stats};});
console.log(JSON.stringify(r));let fail=0;const ok=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)fail++;};const has=f=>r.plays.some(x=>x.path===f);
if(off){ok('끄면 옛 동작: 새 음원 재생 없음',!r.plays.some(x=>/^(bow|heal|crush|roar)-1\.ogg$/.test(x.path))&&r.boss.every(f=>f!=='roar-1.ogg'));}
else{ok('헌터 평타 → bow-1 재생, 환도 평타는 다른 소리',has('bow-1.ogg')&&r.plays.filter(x=>x.path==='bow-1.ogg').length===1&&r.st.bow===1);
 ok('회복 → heal-1 재생',has('heal-1.ogg'));ok('보스 포효를 돌리면 변주 roar-1 도 재생('+r.boss.length+'개 중)',has('roar-1.ogg')&&r.boss.at(-1)==='roar-1.ogg');
 ok('상자를 실제로 부수면 crush-1 재생(상자 있음 '+r.crate+', 부서짐 '+r.broke+')',r.crate&&r.broke===true&&has('crush-1.ogg'));
 ok('새 음원 재생 음량이 기존 공격음 상한(0.30×음량) 아래('+r.plays.filter(x=>/-1\.ogg$/.test(x.path)&&/^(bow|heal|crush|roar)/.test(x.path)).map(x=>x.level.toFixed(3))+')',r.plays.filter(x=>/^(bow|heal|crush|roar)-1/.test(x.path)).every(x=>x.level<=.30*.6*1.1+1e-6));
 ok('해독 실패 0·오버레이 오류 0',r.failed===0&&r.st.errors===0);}
ok('페이지 오류 0',errs===0);
await b.close();process.exit(fail?1:0);
