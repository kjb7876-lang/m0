// R1376 교만의 사이보그 교주(cult04 c104-boss, 2D) 그림 일관성 헤드리스 검사(그래픽·GPU 검증 아님).
//  사용자 2026-11-27 07:23Z "교만의사이보그 교주(교주의사몽최종보스몹)일관성 엄청낮은것도 개선해주고".
//  실측(고치기 전): 1) 체력 76%/50%/25% 아래로 몸이 전혀 다른 인물 그림 4종(정장 노인·날개 천사·갑옷 기사·의식 보스)으로 바뀜.
//                  2) 1단계 안에서도 R104 자세 4장(p1~p4)이 0.05초 간격으로 번갈아 깜빡임.
//  실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1376/cult-consist-browser.mjs [off]
import {chromium,boot,go} from '../r444/lib.mjs';
const OFF=process.argv[2]==='off',BASE=process.argv[2]==='baseline';// baseline: 끈 채로 아래 검사를 모두 돌려 고치기 전 실패를 확인
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,600):''));};
const b=await chromium.launch();
const {p}=await boot(b,{vp:{width:640,height:360},init:{'storyworld.r790.npc':'{"on":false}',...(OFF||BASE?{'storyworld.r1376.cultConsist':'0'}:{})}});
const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,240)));
await go(p,'cult04');
await p.evaluate(()=>{for(let k=0;k<200&&storyScene;k++)advanceScene();if(modal)closePanel(true);
 room.enemies=room.enemies.filter(e=>!Number.isInteger(e.fieldWaveIndex6)&&e.boss&&!e.midboss);room.minionKills=3;room.encounterStage='bossReady';room.engaged=false;
 player.invincible=1e9;player.hp=9e8;auto=false;guide=false;player.x=room.objective.x+.6;player.y=room.objective.y+.6;interact();
 const R=window.__rows=[];const F=()=>window.__STORYWORLD_ENEMY_FACE_R444__;
 const base=drawEnemy;drawEnemy=function(e,...a){const c=ctx,st=Array.isArray(c.commands)?c.commands.length:-1;const r=base.call(this,e,...a);
  try{if(e&&e.nativeId==='c104-boss'&&!e.r61Clone&&!e.echo&&e.hp>0&&e.spawnState==='active'&&st>=0){let fin=null;for(let i=st;i<c.commands.length;i++){const k=c.commands[i];if(k?.kind!=='image'||!Array.isArray(k.points)||k.points.length<4)continue;const src=String(k.sourcePath||k.image?.src||'').replace(/^.*\/m0\//,'');if(/atlas|pixelfx|r106fx|\/fx|effect|vfx|ring|circle|sigil|r1358|r1002/i.test(src))continue;const Q=k.points,ys=Q.map(q=>q[1]),xs=Q.map(q=>q[0]);const w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys);if(!fin||w*h>fin.w*fin.h)fin={src,w,h,flip:(Q[1][0]-Q[0][0])<0};}
   if(fin){const atk=!!(e.attack||e.rangedWindup>0||(e.r61Action&&time<e.r61Action.endAt));const ps=(player.x-player.y)-(e.x-e.y);
    R.push({id:e.id,t:time,ratio:e.hp/e.maxHp,rage:!!e.r205Enraged,src:fin.src,h:fin.h,w:fin.w,flip:fin.flip,atk,hit:e.hitTimer>0,mv:!!e.moving,side:F()?.state?.(e)?.side||null,hero:Math.abs(ps)<.3?null:ps>0?'right':'left',ps:+ps.toFixed(2),ph:e.attack?'m'+(e.attack.elapsed||0).toFixed(2):e.rangedWindup>0?'r':'61'});}}}catch(_){ }return r;};});
// 체력 네 구간마다 게임 시간 6초씩: 영웅이 교주 둘레를 돌며(무적) 교주가 걷고·준비하고·때리게 둔다
for(const ratio of [.9,.65,.4,.2]){
 await p.evaluate(r=>{const e=room.enemies.find(e=>e.nativeId==='c104-boss'&&e.hp>0);if(e){e.hp=e.maxHp*r;}window.__seg=r;},ratio);
 for(let i=0;i<12;i++)await p.evaluate(r=>{for(let k=0;k<10;k++){for(let j=0;j<40&&storyScene;j++)advanceScene();if(modal&&!storyScene)try{closePanel(true)}catch(_){}
  const e=room.enemies.find(e=>e.nativeId==='c104-boss'&&e.hp>0);if(e){e.hp=Math.max(e.hp,e.maxHp*(r-.04));e.hp=Math.min(e.hp,e.maxHp*r);player.hp=9e8;const a=time*.6;const tx=e.x+Math.cos(a)*2.4,ty=e.y+Math.sin(a)*2.4;if(!blocked(tx,ty,.3)){player.x=tx;player.y=ty;}}tick(.05);try{draw();}catch(_){}}},ratio);
}
// 경계: 저장 뒤 낮은 체력에서 불러온 것처럼(v17 기준 배율 없음) 곧바로 옛 형상 자리에서 그려도 같은 키
await p.evaluate(()=>{window.__STORYWORLD_CULT_CONSIST_R1376__?.forgetScale?.();window.__mark=time;});
for(let i=0;i<8;i++)await p.evaluate(()=>{for(let k=0;k<10;k++){const e=room.enemies.find(e=>e.nativeId==='c104-boss'&&e.hp>0);if(e){e.hp=e.maxHp*.2;e.attack=null;e.rangedWindup=0;}player.x=room.objective.x+.6;player.y=room.objective.y+.6;tick(.05);try{draw();}catch(_){}}});
const mark=await p.evaluate(()=>window.__mark);
const rows=await p.evaluate(()=>window.__rows);
const api=await p.evaluate(()=>window.__STORYWORLD_CULT_CONSIST_R1376__?.inspect?.()||null);
await b.close();
const main=rows.filter(r=>r.id===rows[0]?.id);
const srcs=[...new Set(main.map(r=>r.src))];
const segs=[.9,.65,.4,.2].map(s=>main.filter(r=>r.ratio<=s+.001&&r.ratio>s-.05));
console.log('rows',main.length,'segs',segs.map(s=>s.length).join(','),'srcs',srcs.join(' | '));
if(OFF){ok(srcs.some(s=>/generated-v31224|cult-v3123/.test(s)),'끄기: 예전처럼 체력 구간별 다른 인물 그림',srcs);ok(errs.length===0,'페이지 오류 0',errs);console.log(`\n${n-bad}/${n} 통과`);process.exit(bad?1:0);}
ok(main.length>200&&segs.every(s=>s.length>20),'네 체력 구간 모두 교주 몸 그리기 기록',segs.map(s=>s.length));
// ① 몸 그림은 처음부터 끝까지 같은 인물(R104 Drive v17 교만의 사이보그 교주 자세 4장)만
ok(srcs.length>0&&srcs.every(s=>/assets\/r104\/bosses\/c104-boss-p[1-4]\.webp/.test(s)),'모든 체력 구간에서 같은 인물(R104 v17 자세 4장)만 — 다른 인물 그림 0',srcs);
// ② 크기: 그림 칸 상자가 아니라 '보이는 몸'의 키(상자 키 × 그림 속 몸 비율, 알파>24 실측)로 잰다 — v17 자세 4장은 같은 칸에 몸 크기가 달라(웅크린 타격 p2 는 칸의 86%),
//   엔진·R104 가 몸 키를 맞추려고 상자를 키우므로 상자 키로 재면 자세 차이가 크기 차이로 잘못 잡힌다.
//   평소(공격 아님) 몸 키가 네 체력 구간 사이에서 거의 같다(최대/최소 ≤ 1.10, R205 광폭화 1.06배는 나눠 뺌), 공격 자세 포함해도 ≤ 1.20
const VIS={'c104-boss-p1':.984,'c104-boss-p2':.859,'c104-boss-p3':.897,'c104-boss-p4':.929};
// R205 광폭화(체력 30% 이하, 사용자 R1150 지시로 그림 1.06배)는 의도된 커짐이라 키에서 나눠 뺀다
const vh=r=>{const k=Object.keys(VIS).find(k=>r.src.includes(k));return (k?r.h*VIS[k]:r.h)/(r.rage?1.06:1);};
const idleH=main.filter(r=>!r.atk).map(vh),allH=main.map(vh);
if(process.env.DBG)for(const [i,sg] of segs.entries()){const by={};for(const r of sg){const k=r.src.slice(-7,-5)+(r.atk?'a':'i');(by[k]=by[k]||[]).push(vh(r));}console.log('seg',i,Object.entries(by).map(([k,v])=>k+':'+Math.round(Math.min(...v))+'-'+Math.round(Math.max(...v))+'('+v.length+')').join(' '));}
const rng=a=>a.length?Math.max(...a)/Math.max(1e-6,Math.min(...a)):99;
ok(idleH.length>20&&rng(idleH)<=1.10,'평소 보이는 몸 키 일정(최대/최소 ≤ 1.10)',{ratio:+rng(idleH).toFixed(3),n:idleH.length});
ok(rng(allH)<=1.20,'공격 자세 포함 몸 키 변화 ≤ 1.20',{ratio:+rng(allH).toFixed(3)});
// ③ 깜빡임: 자세 그림이 바뀐 뒤 최소 0.15초(게임 시간)는 유지, 초당 그림 바뀜 ≤ 4
let changes=0,short=0;const runs=[];let cur=null,t0=0;
for(const r of main){if(cur===null){cur=r.src;t0=r.t;continue;}if(r.src!==cur){runs.push(r.t-t0);changes++;cur=r.src;t0=r.t;}}
for(const d of runs)if(d<.15-1e-6)short++;
const span=main.length?main[main.length-1].t-main[0].t:1;
ok(short===0,'자세 그림이 0.15초도 안 돼 바뀌는 깜빡임 0',{short,changes,minRun:runs.length?+Math.min(...runs).toFixed(3):null});
ok(changes/span<=4,'초당 자세 그림 바뀜 ≤ 4',{perSec:+(changes/span).toFixed(2)});
// ④ 맞는 순간(피격)에 자세 그림이 바뀌지 않는다(피격 = 몸 흔들림·번쩍임만)
let hitSwap=0;for(let i=1;i<main.length;i++)if(main[i].hit&&!main[i].atk&&!main[i-1].atk&&main[i].src!==main[i-1].src)hitSwap++;
ok(hitSwap===0,'피격만으로 자세 그림이 바뀌지 않음',{hitSwap});
// ⑤ 공격할 때 영웅 쪽을 본다(R444 판정 기준)
// ⑤ 공격할 때 영웅 쪽을 본다(R444 판정 기준). 근접 공격·원거리 준비만 잰다. R61 환영 시전(1초 넘게 처음 겨눈 쪽을 유지)은
//   2D 몹·보스 방향 전수(R1371) 몫이라 여기서는 참고값으로만 찍는다.
const atk=main.filter(r=>r.atk&&r.hero&&r.side&&r.ph!=='61');const face=atk.filter(r=>r.side===r.hero).length;
{const c61=main.filter(r=>r.atk&&r.hero&&r.side&&r.ph==='61');console.log('참고(R61 환영 시전 중 영웅 쪽 비율, 검사 아님):',c61.length?(c61.filter(r=>r.side===r.hero).length/c61.length).toFixed(2):'-',c61.length);}
if(process.env.DBG)console.log('miss',JSON.stringify(atk.filter(r=>r.side!==r.hero).map(r=>[+r.t.toFixed(2),r.ps,r.ph,r.side])).slice(0,1500));
ok(atk.length>10&&face/atk.length>=.9,'근접 공격·원거리 준비 중 영웅 쪽을 봄(≥90%)',{face,n:atk.length});
if(!BASE){const cold=main.filter(r=>r.t>=mark&&!r.atk).slice(0,12).map(vh),warm=main.filter(r=>r.t<mark&&!r.atk).map(vh).sort((x,y)=>x-y),med=warm[warm.length>>1]||1;
 ok(cold.length>=3&&cold.every(v=>Math.abs(v/med-1)<=.10),'경계: 기준 배율 없이(불러오기 직후) 낮은 체력에서 그려도 평소 키와 ±10%',{cold:cold.map(v=>+v.toFixed(1)),med:+med.toFixed(1)});}
ok(api&&api.installed&&api.stats.errors===0,'R1376 API·오류 0',api);
ok(errs.length===0,'페이지 오류 0',errs.slice(0,3));
console.log(`\n${n-bad}/${n} 통과`);process.exit(bad?1:0);
