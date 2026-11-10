// R543 브라우저 검사(헤드리스 — 재생 경로·음량 수치만 본다. 귀로 듣는 확인이 아니다). SW_OFF=1 이면 옛 동작.
import {chromium,boot,go} from '../r444/lib.mjs';
const off=!!process.env.SW_OFF;let errs=0;
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const {p}=await boot(b,{vp:{width:640,height:360},init:off?{'storyworld.r541.sfx':'0'}:null});
p.on('pageerror',()=>errs++);
const RX='짐승|추적견|사냥개|늑대|곰(?!팡)|여우|고블린';
// 짐승형 적·피리 고블린이 실제로 있는 지역을 찾는다(지역 명단이 아니라 만들어진 방의 적 이름으로)
const zones=await p.evaluate(()=>Object.keys(regionById).filter(z=>!regionById[z].safe));let zone=null,found=null;
for(const z of zones){const hit=await p.evaluate(([z,RX])=>{const s=JSON.stringify(regionById[z]);return new RegExp(RX).test(s);},[z,RX]);if(!hit)continue;await go(p,z);
 found=await p.evaluate(RX=>room.enemies.filter(e=>e.hp>0&&new RegExp(RX).test(e.name||'')).map(e=>e.name).slice(0,3),RX);if(found.length){zone=z;break;}}
console.log('zone',zone,found);
const r=zone?await p.evaluate(async RX=>{const C=window.__STORYWORLD_SFX_COMFORT__,S=window.__STORYWORLD_SFX_R541__,wait=ms=>new Promise(r=>setTimeout(r,ms));
 try{await unlockAudio();}catch(_){}await wait(300);settings.sound=true;if(!(settings.volume>0))settings.volume=.8;
 const plays=()=>C.inspect().audit.filter(a=>a.kind==='play').map(a=>({role:a.role,path:a.path.split('/').pop(),level:a.level})),n0=plays().length;
 const e=room.enemies.find(e=>e.hp>0&&new RegExp(RX).test(e.name||''));e.spawnState='active';player.hp=player.maxHp=9e6;const t0=performance.now();let attacked=false;
 while(performance.now()-t0<90000&&S.inspect().stats.voice<1){player.x=e.x+.9;player.y=e.y;player.hp=9e6;if(room.enemies.some(x=>x&&x.attack&&new RegExp(RX).test(x.name||'')))attacked=true;await wait(30);}
 await wait(900);return {name:e.name,attacked,plays:plays().slice(n0).filter(x=>/^r543/.test(x.role)),st:S.inspect().stats,failed:audioStats.failed};},RX):null;
console.log(JSON.stringify(r));
// 비·폭풍 구역: 먼 천둥(첫 12~30초)
const rain=await p.evaluate(()=>{const W=window.__STORYWORLD_WEATHER_R450__;return Object.keys(W.zones||{}).find(z=>/^(rain|storm)$/.test(W.zones[z]?.kind)&&regionById[z])||null;});
let th=null;if(rain){await go(p,rain);th=await p.evaluate(async()=>{const C=window.__STORYWORLD_SFX_COMFORT__,S=window.__STORYWORLD_SFX_R541__,W=window.__STORYWORLD_WEATHER_R450__,wait=ms=>new Promise(r=>setTimeout(r,ms));
 settings.sound=true;if(!(settings.volume>0))settings.volume=.8;player.hp=player.maxHp=9e6;for(const e of room.enemies){e.speed=0;e.damage=0;}
 const kind=W.pick(room).kind,t0=performance.now();while(performance.now()-t0<45000&&S.inspect().stats.thunder<1){player.hp=9e6;await wait(500);}await wait(600);
 return {kind,waited:Math.round((performance.now()-t0)/1000),thunder:S.inspect().stats.thunder,plays:C.inspect().audit.filter(a=>a.kind==='play'&&a.role==='r543Thunder').map(a=>({path:a.path.split('/').pop(),level:a.level})),errors:S.inspect().stats.errors};});}
console.log('rain',rain,JSON.stringify(th));let fail=0;const ok=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)fail++;};
if(off){ok('끄면 옛 동작: 적 목소리·천둥 없음',(!r||r.plays.length===0)&&(!th||th.thunder===0));}
else{ok('짐승형 적·고블린이 있는 지역을 찾음('+zone+': '+(found||[]).join(', ')+')',!!zone);
 ok('그 적이 실제로 공격을 시작하자 목소리 재생('+(r?.name)+' → '+(r?.plays.map(x=>x.path))+')',!!r&&r.attacked&&r.st.voice>=1&&r.plays.length>=1&&r.plays.every(x=>/^(growl|goblin)-/.test(x.path)));
 ok('목소리 재생 음량이 기존 공격음 상한의 절반 아래('+(r?.plays.map(x=>x.level.toFixed(3)))+')',!!r&&r.plays.every(x=>x.level<=.30*.5+1e-6));
 ok('비·폭풍 구역('+rain+', 날씨 '+th?.kind+')에서 '+th?.waited+'초 안에 먼 천둥 1회',!!th&&/^(rain|storm)$/.test(th.kind)&&th.thunder===1&&th.plays.length===1&&th.waited>=12);
 ok('해독 실패 0·오버레이 오류 0',!!r&&r.failed===0&&r.st.errors===0&&th?.errors===0);}
ok('페이지 오류 0',errs===0);
await b.close();process.exit(fail?1:0);
