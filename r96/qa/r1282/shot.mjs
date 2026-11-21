// R1282 화면: 나태의 집 남쪽 앞방 구석 상자까지 실제로 걸어가(findPath) 닫힘 → E → 열림·구슬 → 줍기
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});await go(p,'ep1b02');
const wait=async s=>{const t=await p.evaluate(()=>time);await p.waitForFunction(([t,s])=>time>t+s,[t,s],{timeout:300000});};await wait(.3);
await p.evaluate(()=>{for(const e of room.enemies||[]){e.x=-999;e.y=-999;e.speed=0;}player.invincible=1e9;window.__c=room.props.find(q=>q.cornerChestR1282&&q.x>40&&q.x<57&&q.y>78&&q.y<92);route=findPath(player,{x:47,y:81})||[];target=null;});
await p.waitForFunction(()=>Math.hypot(player.x-47,player.y-81)<1,null,{timeout:600000});await wait(.5);
await p.screenshot({path:'shots/4-walk-closed.png'});
const r=await p.evaluate(()=>{const c=window.__c;const d=Math.hypot(c.x-player.x,c.y-player.y);return {d,c:[c.x,c.y]};});
// 더블클릭과 같은 길: 상자까지 1.9칸 안으로
await p.evaluate(()=>{route=findPath(player,{x:window.__c.x+1,y:window.__c.y-1})||[];});await p.waitForFunction(()=>Math.hypot(player.x-window.__c.x,player.y-window.__c.y)<1.9,null,{timeout:300000});
await p.evaluate(()=>interact());await wait(.9);await p.screenshot({path:'shots/5-open-orbs.png'});
console.log(JSON.stringify({...r,state:await p.evaluate(()=>window.__STORYWORLD_CORNER_CHESTS_R1282__.inspect().stats)}));await b.close();
