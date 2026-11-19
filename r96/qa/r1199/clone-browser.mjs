// R1199 ② 브라우저 검사(헤드리스, 소프트웨어 렌더링): 사몽 중 환도 칠묵영 분신 7체를 띄우고 장면당 그리기 횟수를 센다.
//  기대: 적중 문양(R572 markPasses) 장면당 1번(분신 수와 무관), 성능 5단계는 분신 오라 그대로(R571 auraDraws 장면당 > 2), 4단계는 조종 영웅만(장면당 2).
//  STEP=4|5 (기본 5). GPU·실기기·자연 플레이 아님.
import {chromium,boot,skip} from '../r444/lib.mjs';
const STEP=+(process.env.STEP||5);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360},init:{'storyworld.r1043.perf7':JSON.stringify({step:STEP})}});
const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await p.evaluate(()=>enterRegion('dist01',null,{layer:'DREAM',restore:true}));await p.waitForFunction(()=>!loading&&layer==='DREAM',null,{timeout:150000});await skip(p);
const r=await p.evaluate(async()=>{const wait=s=>new Promise(res=>{const t0=time;const f=()=>time>=t0+s?res():setTimeout(f,30);f();});
 player.hero='hwando';player.hp=player.maxHp=1e7;player.samongCD=0;for(const e of room.enemies){e.damage=0;}
 const I=window.__STORYWORLD_HWANDO_INK_R945__,S=window.__STORYWORLD_SAMONG_SURGE_R571__,T=window.__STORYWORLD_SAMONG_THEME_R572__;
 awaken('story');await wait(.3);
 for(let i=0;i<120&&!(I.inspect().stats.cloneCasts>0);i++){I.force('clones');const e=room.enemies.find(x=>x.hp>0);if(e){player.x=e.x-.6;player.y=e.y;try{target=e.id;}catch(_){}}player.attackCD=0;player.samong=Math.max(player.samong,6);basicAttack(true);await wait(.06);}
 const casts=I.inspect().stats.cloneCasts;await wait(.3);
 const a0=S.inspect().stats.auraDraws,m0=T.inspect().stats.markPasses,c0=I.inspect().stats.cloneDraws;let frames=0;
 await new Promise(res=>{const t0=performance.now();const f=()=>{frames++;if(frames>=20)res();else requestAnimationFrame(f);};requestAnimationFrame(f);});
 return{step:window.__STORYWORLD_PERF7_R1043__.step(),casts,samong:+player.samong.toFixed(2),frames,auraPerFrame:+((S.inspect().stats.auraDraws-a0)/frames).toFixed(2),markPassesPerFrame:+((T.inspect().stats.markPasses-m0)/frames).toFixed(2),cloneDrawsPerFrame:+((I.inspect().stats.cloneDraws-c0)/frames).toFixed(2),cloneSkips:T.inspect().stats.cloneSkips};});
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log(c?'PASS':'FAIL',m);};
console.log(JSON.stringify(r));
ok(r.casts>0&&r.cloneDrawsPerFrame>=7&&r.samong>0,'사몽 중 분신이 떠 있음(분신 그리기 장면당 '+r.cloneDrawsPerFrame+')');
ok(r.markPassesPerFrame<=1.05,'적중 문양 장면당 1번 이하('+r.markPassesPerFrame+')');
if(STEP<=4)ok(r.auraPerFrame<=2.05,'성능 '+STEP+'단계: 분신 오라 생략 — 오라는 조종 영웅 앞·뒤만(장면당 '+r.auraPerFrame+')');
else ok(r.auraPerFrame>2.5,'성능 '+STEP+'단계: 분신 오라 그대로(장면당 '+r.auraPerFrame+')');
ok(!errs.length,'페이지 오류 없음 '+JSON.stringify(errs.slice(0,3)));
console.log(`R1199 clone browser STEP=${STEP} ${n-bad}/${n}`);await b.close();process.exit(bad?1:0);
