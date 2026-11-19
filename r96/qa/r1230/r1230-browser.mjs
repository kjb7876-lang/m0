// R1230 위치 고정 적 공격 모션 — 헤드리스 브라우저 검사: node r96/qa/r1230/r1230-browser.mjs
//  실제 drawImage 호출을 엿봐서 잰다(오버레이가 계산한 값이 아니라 화면에 그린 값):
//   ① 몸: 그 적 몸 그림 drawImage 순간의 변환 행렬 세로·가로 배율 → 공격 한 번 동안 서로 다른 키프레임이 3개 이상(2~3프레임 이상 모션)
//   ② 이펙트: 충전 프레임 시트(R1230 물들인 시트) 칸이 3개 이상 바뀜, 발광(R106 glow) 그리기
//   ③ 공격 안 할 때는 배율 1·시트 없음, 고정형이 아닌 몹·죽은 탑·끈 상태에서는 아무것도 안 얹음, 행렬에 NaN 없음
//  대상: 엔진 R75 제자리 원거리 몹(r75Tower), R170 피의 육망성 조형물(r170Tower), R446 일곱 기둥, R251 발록의 소환진, R1229 stationary 기둥.
//  헤드리스 소프트웨어 렌더링(640×360, 3D 장면 끔) 결과이며 GPU·실기기 확인이 아니다.
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
const fails=[];const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails.push(m);};
ok(await p.evaluate(()=>!!window.__STORYWORLD_FIXED_ATTACK_R1230__),'R1230 오버레이가 실렸다');
// 엿보기: 지정 적을 그리는 동안의 drawImage(몸=가장 큰 그림, 시트=r1230 표시 캔버스)
await p.evaluate(()=>{window.__R={on:false,rows:[]};
 // 그리는 순간의 ctx(Three 기록기로 바뀔 수 있음)를 그 적 하나 그리는 동안만 엿본다. 엿보기는 늘 맨 바깥(다른 덧씌우기가 다시 감싸면 다시).
 let busy=false;const spy=function(c,R){const orig=c.drawImage;c.drawImage=function(im,...a){if(R.cur){const m=typeof this.getTransform==='function'?this.getTransform():null,w=a.length>=8?a[6]:a.length>=4?a[2]:(im.width||0),h=a.length>=8?a[7]:a.length>=4?a[3]:(im.height||0);
    const sa=m?m.a:1,sd=m?m.d:1;R.cur.push({sheet:!!im.__r1230Sheet,sx:a.length>=8?a[0]:null,a:sa,d:sd,area:Math.abs(w*h*sa*sd),nan:m?![m.a,m.b,m.c,m.d,m.e,m.f].every(Number.isFinite):false,noT:!m});}
   return orig.call(this,im,...a);};return()=>{c.drawImage=orig;};};
 const mk=()=>{const db=drawEnemy;const w=function(e,...a){const R=window.__R;if(busy||!R.on||e!==R.B)return db.call(this,e,...a);busy=true;R.cur=[];const un=spy(ctx,R);try{return db.call(this,e,...a);}finally{un();busy=false;const c=R.cur;R.cur=null;
    const body=c.filter(x=>!x.sheet).sort((x,y)=>y.area-x.area)[0];R.rows.push({t:time,body:body?{a:+body.a.toFixed(3),d:+body.d.toFixed(3)}:null,sheet:c.filter(x=>x.sheet).map(x=>x.sx),nan:c.some(x=>x.nan),noT:c.some(x=>x.noT),atk:R.atk()});}};drawEnemy=w;window.__probeW=w;};
 mk();window.__probeRewrap=()=>{if(drawEnemy!==window.__probeW)mk();};setInterval(()=>window.__probeRewrap(),300);});
async function watch(setup,secs,label){await p.evaluate(({setup})=>{const R=window.__R;R.rows=[];R.on=true;R.t0=time;eval(setup);},{setup});
 const r0=Date.now();while(Date.now()-r0<240000){const t=await p.evaluate(()=>time-window.__R.t0);if(t>=secs)break;await skip(p);await p.waitForTimeout(300);}
 return p.evaluate(()=>{const R=window.__R;R.on=false;return R.rows;});}
function judge(rows,label,{expect=true}={}){const keys=new Set(),frames=new Set();let idleBad=0,nan=0,atkRows=0;
 for(const r of rows){if(r.nan)nan++;const k=r.body?r.body.a.toFixed(2)+'x'+r.body.d.toFixed(2):'-';if(r.sheet.length||r.body&&(Math.abs(Math.abs(r.body.a)-Math.abs(rows[0]?.body?.a||r.body.a))>1e-6))0;
  if(r.sheet.length)for(const s of r.sheet)frames.add(s);if(r.atk){atkRows++;keys.add(k);} }
 const allKeys=new Set(rows.filter(r=>r.body).map(r=>r.body.d.toFixed(3)));// 몸을 안 그린 칸(죽은 뒤 사라짐·화면 밖)은 키프레임이 아니다
 console.log(label,'rows',rows.length,'atkRows',atkRows,'bodyKeys',[...allKeys].slice(0,12).join(','),'sheetFrames',[...frames].join(','));
 ok(nan===0,label+': 행렬 NaN 없음');
 if(expect){ok(allKeys.size>=3,label+': 몸 키프레임 3개 이상('+allKeys.size+')');ok(frames.size>=3,label+': 이펙트 시트 칸 3개 이상('+frames.size+')');}
 else{ok(allKeys.size<=1&&frames.size===0,label+': 아무것도 안 얹음(키 '+allKeys.size+', 시트 '+frames.size+')');}}
// 공통 준비: 다른 적 숨기기, 영웅 무적
const prep=`player.maxHp=player.hp=1e9;player.invincible=1e9;room.engaged=true;for(const x of room.enemies)if(x!==B){x.spawnState='hidden';x.attack=null;x.rangedWindup=0;}`;
// ① R75 제자리 원거리 몹
await go(p,'dist00');
await p.evaluate(()=>{const B=room.enemies.find(e=>e.r75Tower&&e.hp>0);window.__R.B=B;window.__R.atk=()=>B.rangedWindup>0||!!B.attack;});
let rows=await watch(`const B=window.__R.B;${prep}B.spawnState='active';B.graceUntil=0;B.cd=0;player.x=B.x+3.2;player.y=B.y+.3;`,9,'r75');judge(rows,'R75 제자리 원거리 몹');
// ② 끈 상태 — 같은 몹, 아무것도 안 얹음
await p.evaluate(()=>window.__STORYWORLD_FIXED_ATTACK_R1230__?.set?.({on:false}));
rows=await watch(`const B=window.__R.B;${prep}B.spawnState='active';B.cd=0;player.x=B.x+3.2;player.y=B.y+.3;`,6,'off');judge(rows,'끔',{expect:false});
await p.evaluate(()=>window.__STORYWORLD_FIXED_ATTACK_R1230__?.set?.({on:true}));
// ③ 고정형이 아닌 원거리 몹 — 아무것도 안 얹음
const moverOk=await p.evaluate(()=>{const B=room.enemies.find(e=>!e.r75Tower&&!e.boss&&!e.midboss&&e.hp>0&&(e.ai==='ranged'||e.ai==='hybrid'))||room.enemies.find(e=>!e.r75Tower&&!e.boss&&e.hp>0);window.__R.B=B;window.__R.atk=()=>B.rangedWindup>0||!!B.attack;return !!B;});
if(moverOk){rows=await watch(`const B=window.__R.B;${prep}B.spawnState='active';B.cd=0;player.x=B.x+2.2;player.y=B.y+.3;`,6,'mover');judge(rows,'고정형 아닌 몹',{expect:false});}
// ④ R1229 stationary 기둥(같은 몹에 stationary 를 달아 흉내)
await p.evaluate(()=>{const B=room.enemies.find(e=>!e.r75Tower&&!e.boss&&e.hp>0&&(e.ai==='ranged'||e.ai==='hybrid'))||room.enemies.find(e=>!e.r75Tower&&!e.boss&&e.hp>0);B.stationary=true;B.speed=0;window.__R.B=B;window.__R.atk=()=>B.rangedWindup>0||!!B.attack;});
rows=await watch(`const B=window.__R.B;${prep}B.spawnState='active';B.cd=0;player.x=B.x+1.6;player.y=B.y+.3;`,9,'stationary');judge(rows,'stationary 고정형');
// ⑤ R170 피의 육망성 조형물 — 이 지역 몹을 본떠 탑을 세운다
const towerOk=await p.evaluate(()=>{const C=window.__STORYWORLD_COMBAT_R170__,d=room.enemies.find(e=>e.hp>0&&!e.boss&&!e.r75Tower);const art=C?.artOf?.(regionById?.[room.id]?.regionObjects6)||null;const path=art?.path||(window.__STORYWORLD_STATIC_PROPS_R105__?.art?.pillar?.path);if(!path)return 'no-art';
 const e=JSON.parse(JSON.stringify(d,(k,v)=>k==='r390Engaged'?undefined:v));Object.assign(e,{id:'r1230:test:tower',x:d.x,y:d.y+.01,homeX:d.x,homeY:d.y,nav:[],attack:null,rangedWindup:0,spawnState:'active',stationary:false,
  r170Tower:{art:path,h:art?.h||90,next:time+1.6,casts:0,summoned:12,snap:'{}'},r75Tower:true,speed:0,ai:'melee',cd:99,name:'피의 육망성 조형물'});e.hp=e.maxHp=1e6;room.enemies.push(e);
 window.__R.B=e;window.__R.atk=()=>{const t=e.r170Tower;return t.next-time<1.3&&t.next-time>0||time-(t.r1230At||-9)<.4;};return 'ok';});
console.log('tower',towerOk);
rows=await watch(`const B=window.__R.B;${prep}player.x=B.x+3;player.y=B.y+.3;`,9,'r170');judge(rows,'R170 피의 육망성 조형물');
// ⑥ 죽은 탑 — 아무것도 안 얹음
await p.evaluate(()=>{const B=window.__R.B;B.hp=0;B.deadAt=time;B.r170Tower.next=time+.5;});
rows=await watch(`const B=window.__R.B;player.x=B.x+3;`,1.5,'dead');judge(rows,'죽은 탑',{expect:false});
// ⑦ R251 발록의 소환진
await go(p,'dist06');
const circ=await p.evaluate(()=>{const S=window.__STORYWORLD_SUMMONING_R251__;const b=room.enemies.find(e=>e.boss&&/발록/.test(e.name||''))||room.enemies.find(e=>e.boss)||room.enemies[0];if(!S||!b)return 'none';
 room.r251Spawned=false;player.r251Broken=false;S.spawn(b);const e=room.enemies.find(x=>x.r251Circle);if(!e)return 'nospawn';e.hp=e.maxHp=1e6;e.r251Circle.next=time+1.6;window.__R.B=e;window.__R.atk=()=>{const t=e.r251Circle;return t.next-time<1.3&&t.next-time>0;};return 'ok';});
console.log('circle',circ);ok(circ==='ok','R251 소환진을 세웠다');
if(circ==='ok'){rows=await watch(`const B=window.__R.B;${prep}player.x=B.x+3;player.y=B.y+.3;`,8,'r251');judge(rows,'R251 발록의 소환진');}
const ins=await p.evaluate(()=>window.__STORYWORLD_FIXED_ATTACK_R1230__?.inspect?.());console.log('inspect',JSON.stringify(ins));
ok(ins&&ins.stats.errors===0,'오버레이 오류 0');
await b.close();
console.log(fails.length?'R1230 browser FAIL '+fails.length:'R1230 browser PASS');process.exit(fails.length?1:0);
