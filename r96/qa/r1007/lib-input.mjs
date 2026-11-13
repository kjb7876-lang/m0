// R1007 실제 입력 도우미 — 방향키(누르고 떼기)·C(상호작용)·Space(자동 공격)만으로 움직인다.
//  길은 게임의 findPath 로 미리 구하고(사람이 지도를 보는 것), 몸은 키 입력으로만 옮긴다. 위치·체력을 직접 바꾸지 않는다.
export const KEYSET=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
// 화면 화살표 → 월드 방향: v=norm(sx+2sy, 2sy-sx)  ⇒ sx=(wx-wy)/2, sy=(wx+wy)/4
export function keysFor(wx,wy){const sx=(wx-wy)/2,sy=(wx+wy)/4,m=Math.max(Math.abs(sx),Math.abs(sy))||1,out=[];
 if(sx/m>.38)out.push('ArrowRight');else if(sx/m<-.38)out.push('ArrowLeft');if(sy/m>.38)out.push('ArrowDown');else if(sy/m<-.38)out.push('ArrowUp');return out;}
export async function release(p){for(const k of KEYSET)await p.keyboard.up(k).catch(()=>{});}
// 게임 시간 dt 만큼 기다린다(헤드리스는 실제 시간보다 느림).
export async function waitGame(p,dt,maxMs=60000){const t0=await p.evaluate(()=>time);const end=Date.now()+maxMs;while(Date.now()<end){const t=await p.evaluate(()=>time);if(t-t0>=dt)return t-t0;await new Promise(r=>setTimeout(r,60));}return -1;}
// 장면(서사)이 떠 있으면 Enter 로 넘긴다(사람처럼). 반환: 넘긴 수.
export async function readScenes(p,max=400){let n=0;for(;n<max;n++){const s=await p.evaluate(()=>!!storyScene);if(!s)break;await p.keyboard.press('Enter');await new Promise(r=>setTimeout(r,25));}return n;}
// 목표 점까지 키로 걸어간다. 반환 {ok, dist, steps}
export async function walkTo(p,target,{near=1.2,maxSteps=260,slice=.22}={}){let last=null,stuck=0;
 for(let s=0;s<maxSteps;s++){await readScenes(p);
  const st=await p.evaluate(([tx,ty])=>{const path=findPath({x:player.x,y:player.y},{x:tx,y:ty});const w=path&&path.length?path[0]:{x:tx,y:ty};return{x:player.x,y:player.y,d:Math.hypot(tx-player.x,ty-player.y),wx:w.x-player.x,wy:w.y-player.y,modal:!!modal,np:path?path.length:-1};},[target.x,target.y]);
  if(st.d<near){await release(p);return{ok:true,dist:st.d,steps:s};}
  if(st.modal){await release(p);await p.evaluate(()=>{try{closePanel(true)}catch(_){}});continue;}
  const ks=keysFor(st.wx,st.wy);await release(p);for(const k of ks)await p.keyboard.down(k);
  await waitGame(p,slice,15000);
  if(last&&Math.hypot(st.x-last.x,st.y-last.y)<.03){if(++stuck>12){await release(p);return{ok:false,dist:st.d,steps:s,stuck:true,np:st.np};}}else stuck=0;last=st;}
 await release(p);const d=await p.evaluate(([tx,ty])=>Math.hypot(tx-player.x,ty-player.y),[target.x,target.y]);return{ok:d<near,dist:d,steps:maxSteps};}
