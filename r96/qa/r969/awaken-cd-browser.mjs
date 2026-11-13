// R969 브라우저 검사(헤드리스, 소프트웨어 렌더링): 실제 빌드에서 EGO·사몽 진입 전·중·후 Q·S·W 재사용 대기를 잰다. GPU·실기기·자연 플레이 아님.
import {chromium,boot,skip} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360},init:process.env.R969_OFF?{'storyworld.r571.surge':JSON.stringify({ego:false})}:null});
const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await p.evaluate(()=>enterRegion('dist01',null,{layer:'DREAM',restore:true}));await p.waitForFunction(()=>!loading&&layer==='DREAM',null,{timeout:150000});await skip(p);
const r=await p.evaluate(async()=>{const S=window.__STORYWORLD_SAMONG_SURGE_R571__,W=window.__STORYWORLD_WER__;
 const wait=s=>new Promise(res=>{const t0=time;const f=()=>time>=t0+s?res():setTimeout(f,30);f();});
 player.hp=player.maxHp=99999;for(const e of room.enemies)e.damage=0;
 const reset=()=>{player.specialCD=0;player.blinkCD=0;if(player.storyWER)player.storyWER.ready={};};
 const cast=async tag=>{reset();await wait(.05);special();blink();W.cast('w');await wait(.02);
  return{tag,ego:+(player.ego||0).toFixed(2),samong:+(player.samong||0).toFixed(2),factor:S.cdFactor(),q:+player.specialCD.toFixed(3),s:+player.blinkCD.toFixed(3),w:+(((player.storyWER?.ready?.[player.hero+':w'])??time)-time).toFixed(3)};};
 const out={rev:S.inspect().revision};
 player.ego=0;player.egoCD=0;player.samong=0;player.samongCD=50;player.egoCount=0;
 out.before=await cast('before');
 // EGO 진입: 돌던 대기 ×.77
 reset();await wait(.05);special();const q0=player.specialCD;player.resonance=99;player.egoCD=0;ego();await wait(.01);out.egoEntry={qBefore:+q0.toFixed(3),qAfter:+player.specialCD.toFixed(3),ratio:+(player.specialCD/q0).toFixed(3),egoCD:+player.egoCD.toFixed(3),ego:player.ego};
 out.ego=await cast('during EGO');
 player.ego=.05;await wait(.2);out.afterEgo=await cast('after EGO');
 // 사몽 진입: 돌던 대기 ×.60
 reset();await wait(.05);special();const q1=player.specialCD;player.samongCD=0;awaken('story');await wait(.01);out.samongEntry={qBefore:+q1.toFixed(3),qAfter:+player.specialCD.toFixed(3),ratio:+(player.specialCD/q1).toFixed(3)};
 out.samong=await cast('during 사몽');
 player.samong=.05;await wait(.2);out.after=await cast('after 사몽');out.inspect=S.inspect();return out;});
console.log(JSON.stringify({...r,errors:errs.slice(0,8)},null,1));
await b.close();
