// R1174 화면 찍기 전용(검사 아님, 헤드리스 소프트웨어 렌더링). 각성 컷인은 실제 시간 타이머라 느린 헤드리스에서 찍기 전에 내려가므로
//  호출과 같은 순간에 애니메이션·게임 시간을 멈춘다. 실행: node r1174-shots.mjs <출력 폴더>
import {chromium,boot,go} from '../r444/lib.mjs';
const OUT=process.argv[2]||'.';const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await p.evaluate(()=>{player.hero='lauren';__STORYWORLD_PERSONA_HERO_R1113__.setForm(true);});
await go(p,'murder01');await p.waitForTimeout(1500);
await p.evaluate(()=>{player.maxHp=player.hp=99999;for(const e of room.enemies){e.x+=30;e.y+=30;}});
for(const [tag,ms] of [['a',250],['b',600],['c',1100]]){
 await p.evaluate(()=>{const W=window.setTimeout;window.__st=W;window.setTimeout=(f,t,...a)=>W(f,(t||0)+1e7,...a);});
 await p.evaluate(ms=>{showAwakening('samong');const tb=tick;window.__tb=tb;tick=function(dt,...a){return tb.call(this,dt*1e-4,...a);};
  for(const a of document.getAnimations()){const t=a.effect&&a.effect.target;if(t&&t.closest?.('#r1174Awake,#sw8Awakening,#cutin')){a.pause();a.currentTime=Math.min(ms,1400);}}},ms);
 await p.waitForTimeout(500);await p.screenshot({path:`${OUT}/awake-persona-${tag}.png`});
 await p.evaluate(()=>{window.setTimeout=window.__st;tick=window.__tb;for(const a of document.getAnimations())if(a.playState==='paused')a.play();document.getElementById('r1174Awake')?.classList.remove('on');document.getElementById('sw8Awakening')?.classList.remove('on');});await p.waitForTimeout(2500);}
await b.close();
