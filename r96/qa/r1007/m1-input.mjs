// R1007 사몽 대면 구역(기본 M-1 미카엘라: 매듭 4개 끊기, 처치하지 않음. 인자로 다른 대면 구역 id) — 실제 입력(방향키·C·Space)만으로 다음 구역에 넘어가는지 본다.
//  사용: node r96/qa/r1007/m1-input.mjs [sz115-M-1|sz115-S04-14]   (SW_URL 기본 http://127.0.0.1:4410/m0/)
//  완료 조건: (1) 보스 등장 (2) 매듭 4/4 (3) 문 열림(portal) (4) 문에서 C → M-2 진입 (5) 페이지 오류 0 (6) 미카엘라는 처치되지 않고 해제(r115Released)
import {chromium,boot,skip} from '../r444/lib.mjs';
import {walkTo,readScenes,waitGame,release} from './lib-input.mjs';
const ZONE=process.argv[2]||'sz115-M-1';
const b=await chromium.launch();
const {p}=await boot(b,{vp:{width:800,height:450},init:{'storyworld.r790.npc':'{"on":false}'}});
const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,240)));
const res={};const ok=(k,v,info)=>{res[k]={pass:!!v,info};console.log((v?'PASS ':'FAIL ')+k+(info!==undefined?' · '+JSON.stringify(info):''));};
const NEXT=await p.evaluate(z=>{const Z=window.__STORYWORLD_SAMONG_ZONES_R115__,l=Object.values(Z.chapters).find(l=>l.some(q=>q.id===z));return l[l.findIndex(q=>q.id===z)+1]?.id||null;},ZONE);
await p.evaluate(z=>window.__STORYWORLD_SAMONG_R103__.goZone(z),ZONE);
await p.waitForFunction(z=>!loading&&room?.samongR103?.zone===z,ZONE,{timeout:150000});await skip(p);
await p.evaluate(z=>{player.invincible=1e9;window.__qaZone=z;},ZONE);// 피해만 막는다(입력·진행 판정은 그대로)
const dais=await p.evaluate(()=>({...room.exploration.samongR103.dais}));
// 1) 단상 가까이 걸어가면 보스가 깬다
let w=await walkTo(p,{x:dais.x,y:dais.y+6},{near:3});await readScenes(p);await waitGame(p,1.5);await readScenes(p);
let I=await p.evaluate(()=>{const x=room.samongR103;return{bossUp:!!x.bossUp,boss:x.boss}});ok('boss up by walking',I.bossUp,{w,I});
await p.keyboard.press('Space');// 자동 공격 켜기(사람이 하듯)
// 2) 매듭 4개 — 표식 차례대로 걸어가 C
const z=await p.evaluate(()=>window.__STORYWORLD_SAMONG_ZONES_R115__.zone(window.__qaZone));
const N=z.solve.statements.length;const log=[];
for(let i=0;i<N;i++){const pr=await p.evaluate(i=>{const q=room.props.find(q=>q.r115Stmt===i);return q?{x:q.x,y:q.y}:null},i);
 if(!pr){log.push({i,missing:true});break;}
 // 사람처럼: 표식까지 걸어가 C. 보스 공격에 밀려나면 다시 걸어가 누른다(최대 3번).
 let wk,tries=0;for(;tries<3;tries++){wk=await walkTo(p,pr,{near:1.0});await readScenes(p);await p.keyboard.press('KeyC');await waitGame(p,.4);await readScenes(p);
  if(await p.evaluate(i=>window.__STORYWORLD_SAMONG_ZONES_R115__.solveOf(window.__STORYWORLD_SAMONG_ZONES_R115__.zone(window.__qaZone)).stmt>i,i))break;}
 wk.tries=tries+1;
 const s=await p.evaluate(()=>({...window.__STORYWORLD_SAMONG_ZONES_R115__.solveOf(window.__STORYWORLD_SAMONG_ZONES_R115__.zone(window.__qaZone))}));const diag=await p.evaluate(()=>({modal:!!modal,scene:!!storyScene,loading:!!loading,toast:(document.getElementById('toast')?.textContent||'').slice(0,80),near:room.props.filter(q=>q.samongR103&&Math.hypot(q.x-player.x,q.y-player.y)<1.9).map(q=>q.id.slice(-12)),ego:typeof egoState!=='undefined'?1:0,hp:player.hp>0}));log.push({i,wk,stmt:s.stmt,diag});
}
const s=await p.evaluate(()=>({...window.__STORYWORLD_SAMONG_ZONES_R115__.solveOf(window.__STORYWORLD_SAMONG_ZONES_R115__.zone(window.__qaZone))}));
ok('knots 4/4',s.stmt>=N,{stmt:s.stmt,N,log});
await waitGame(p,1.5);await readScenes(p);
I=await p.evaluate(()=>{const x=room.samongR103,b=room.enemies.find(e=>e.id===x.boss);return{portal:x.portal?{x:x.portal.x,y:x.portal.y}:null,released:!!b?.r115Released,bossHp:b?.hp,zoneDone:window.__STORYWORLD_SAMONG_R103__.state().zoneDone.includes(window.__qaZone),quest:document.getElementById('questText')?.textContent}});
ok('door opened',!!I.portal,I);ok('michaela released (not slain)',I.released,I);
// 3) 문까지 걸어가 C
if(I.portal){const wk=await walkTo(p,I.portal,{near:1.2});await p.keyboard.press('KeyC');
 try{await p.waitForFunction(([z,n])=>!loading&&room?.samongR103&&(n?room.samongR103.zone===n:room.samongR103.zone!==z),[ZONE,NEXT],{timeout:120000});}catch(e){}
 const zz=await p.evaluate(()=>({zone:room?.samongR103?.zone||null,stage:room?.samongR103?.stage||null,id:room?.id}));ok('entered next ('+(NEXT||'next chapter')+')',NEXT?zz.zone===NEXT:zz.zone!==ZONE&&!!zz.id,{zz,wk});}
else ok('entered next',false,'no portal');
await release(p);ok('page errors 0',errs.length===0,errs.slice(0,5));
const fails=Object.entries(res).filter(([k,v])=>!v.pass).map(([k])=>k);console.log(fails.length?'RESULT FAIL '+fails.join(', '):'RESULT PASS');
await b.close();process.exit(fails.length?1:0);
