// R1353 환도 기본 공격 하얀 반월 ↔ 3D 칼 궤적 — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  사용자 11-27 01:28Z "환도 기본공격시 나오는 하얀반월이펙트 환도 휘두르는각도와궤적에 맞게 적용".
//  재는 법(오버레이 API 를 믿지 않고 실제 그린 것을 잰다):
//   · 반월: 렌더러가 받는 프레임 명령(CommandScene.render) 중 환도 기본 베기 띠 그림(key r292:hwando:basic:… 원래 / r1353:arc:… 칼 길)의 네 꼭짓점(칸 좌상·우상·우하·좌하)으로
//     칸→화면 변환을 세워, 띠 칼자국(칸 (57,194)→(364,143), 가운데 (211,208))이 화면 어디에 어떤 방향으로 그려졌는지 구한다(가장 많이 자란 칸 = 3~5칸).
//   · 칼: 그리는 순간(scene.onAfterRender, R1347 이 뼈를 되돌리기 전) 3D 칼끝(BladeTip)을 화면 좌표로 매 프레임 기록 → 그 공격의
//     휘두름 구간(windup~strike+.18, 공격 .5초 기준) 칼끝 길의 시작·끝·가운데.
//  ① 여덟 동작 모두: 반월 칼자국 방향과 칼끝 길 방향의 차 ≤ 30°.
//  ② 휘는 쪽: 칼끝 길이 뚜렷이 휜 동작(가운데가 줄에서 길이의 8% 넘게 벗어남)은 반월도 같은 쪽으로 휨.
//  ③ 자리: 반월 칼자국 가운데가 칼끝 길 가운데에서 max(30px, 길 길이 .6배) 안.
//  ④ 회귀: 끄기 키면 원래 R292 그리기(반월 여전히 그려짐), 2D 영웅(3D 끔)에서는 손대지 않음, 오류 0.
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1353/r1353-browser.mjs` (HEROES=hwando,ego)
import {chromium,boot,go} from '../r444/lib.mjs';
const W=960,H=540,HEROES=(process.env.HEROES||'hwando,ego').split(',');
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:W,height:H}});await go(p,process.env.ZONE||'dist00');
const errs=[];p.on('console',m=>{const t=m.text();if(/Shader Error|WebGLProgram|GL_INVALID/.test(t))errs.push(t.slice(0,160));});
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
await p.evaluate(()=>{player.hp=player.maxHp=99999;window.__STORYWORLD_HWANDO3D_R1302__.set(true);window.__STORYWORLD_SWORD_COMBO_R1347__?.set(true);
 const e=room.enemies.find(e=>e.hp>0);for(const o of room.enemies)if(o!==e){o.visible=false;o.x+=9999;}e.speed=0;e.damage=0;e.hp=e.maxHp=1e9;window.__E=e;
 window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});
const IDS=['down','rise','thrust','sweep','chop','backsweep','lunge','wrap'];
// R1360(사용자 11-27 "절도 있게"): 검술이 움츠림 → 짧은 베기 → 멈춤 → 거두기로 시간을 접으면 칼이 실제로 베는 구간은 R1353 pure.win(strike-CUT ~ strike+HOLD) —
//  예전 고정 구간(windup ~ strike+.18)은 움츠림 끝·거두기까지 섞여 칼끝 길이 휘어 보였다 → 오버레이와 같은 구간을 잰다(접기가 없으면 win 은 예전 구간과 같음).
const MOVES=await p.evaluate(()=>{const P=window.__STORYWORLD_SWORD_COMBO_R1347__?.pure,A=window.__STORYWORLD_HWANDO_ARC_FOLLOW_R1353__?.pure;return P?.MOVES?.map(m=>({id:m.id,windup:m.windup,strike:m.strike,win:A?.win?A.win(P,m):[m.windup,Math.min(1,m.strike+.18)]}))||null;});
ok(!!MOVES&&MOVES.length===8,'R1347 검술 표 읽음');
const pick=async h=>{await p.evaluate(async h=>{try{await ensureImages(heroPaths('hwando'));}catch(_){}player.personaHeroR1113=false;player.egoSovereignR1046=h==='ego';player.hero='hwando';player.attackAnim=0;player.moving=false;
  const e=window.__E;e.x=player.x+1.3;e.y=player.y;},h);
 await p.waitForFunction(h=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return i.shown&&i.hero===h&&!!window.__STORYWORLD_PHASE1__.controller.state.three.scene.getObjectByName('r1305-'+h+'-3d-shared')?.getObjectByName('r1313-'+h+'-weapon');},h,{timeout:240000});await p.waitForTimeout(2500);
 await p.evaluate(h=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,s=r.scene,T=r.T;
  const g=s.getObjectByName('r1305-'+h+'-3d-shared'),m=g.getObjectByName('r1305-'+h+'-3d-model'),w=g.getObjectByName('r1313-'+h+'-weapon');let tip=null;w.traverse(o=>{if(!tip&&/^BladeTip/.test(o.name||''))tip=o;});
  const P2=v=>{const el=r.renderer.domElement,q=v.clone().project(r.camera);return [(q.x+1)/2*(el.clientWidth||el.width),(1-q.y)/2*(el.clientHeight||el.height)];};
  window.__tipLog=[];window.__arcLog=[];
  if(!s.__r1353M){s.__r1353M=true;const prev=s.onAfterRender;s.onAfterRender=function(...a){try{if(window.__rec){const q=window.__rq;const f0=P2(q.m.getWorldPosition(new q.T.Vector3())),b=project(player.x,player.y),t=P2(q.tip.getWorldPosition(new q.T.Vector3()));
   window.__tipLog.push({t:time,xy:[b.x+t[0]-f0[0],b.y+t[1]-f0[1]],move:window.__STORYWORLD_SWORD_COMBO_R1347__?.inspect().last?.[q.h]?.move||null});}}catch(e){window.__recErr=String(e);}return prev?.apply(this,a);};
   const sc=r.commands,cur=sc.render;const wr=function(cmds){const out=cur.apply(this,arguments);/* 다른 손질(R350 가림 등)이 끝난 뒤의 명령을 잰다 */try{if(window.__rec)for(const c of cmds){const k=String(c?.key||'');if(c?.kind==='image'&&/^(r292:hwando:basic|r1353:arc):/.test(k))window.__arcLog.push({t:time,key:k,src:/^r1353/.test(k)?'r1353':'r292',frame:Math.floor((c.sourceRect?.[0]||0)/384),sr:c.sourceRect||null,ga:c.style?.globalAlpha??1,pts:c.points});}}catch(e){window.__recErr=String(e);}return out;};
   wr.__r1304=true;wr.__r1336fx=true;sc.render=wr;}
  window.__rq={h,m,tip,T};},h);};
// 이어 치기(게임 시간 .45초마다 basicAttack, 시간을 .25배로 늦춰 프레임을 촘촘히)
const run=async n=>{await p.evaluate(()=>{window.__tipLog=[];window.__arcLog=[];window.__starts=[];window.__rec=true;window.__SLOW=.25;let la=-9;
  window.__chain=setInterval(()=>{player.moving=false;if(time-la>.45){la=time;player.attackCD=0;basicAttack(window.__E);window.__starts.push(time);}},5);});
 await p.waitForFunction(n=>(window.__starts||[]).length>=n,n,{timeout:1500000,polling:500});
 return p.evaluate(()=>{clearInterval(window.__chain);window.__rec=false;window.__SLOW=1;return {tip:window.__tipLog,arc:window.__arcLog,err:window.__recErr||null};});};
const S=[57,194],E=[364,143],M=[211,208],C=384;
// points = 그린 사각형 네 모서리. 칸 일부(sourceRect)만 그렸으면 그 사각형 안 좌표로 바꿔 잰다(R1353 은 칼자국 있는 곳만 잘라 그림).
const mapPt=(pts,u,v,sr)=>{const x0=sr?sr[0]%C:0,y0=sr?sr[1]:0,w=sr?sr[2]:C,h=sr?sr[3]:C;u=(u-x0)/w;v=(v-y0)/h;return [pts[0][0]+(pts[1][0]-pts[0][0])*u+(pts[3][0]-pts[0][0])*v,pts[0][1]+(pts[1][1]-pts[0][1])*u+(pts[3][1]-pts[0][1])*v];};
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),dir=(a,b)=>Math.atan2(b[1]-a[1],b[0]-a[0]),adiff=(x,y)=>{let t=Math.abs(x-y)%(2*Math.PI);return Math.min(t,2*Math.PI-t)*180/Math.PI;};
const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);const r1=x=>+x.toFixed(1);
const GA=[],med=a=>{const b=[...a].sort((x,y)=>x-y);return b.length?b[b.length>>1]:NaN;};
for(const h of HEROES){await pick(h);
 const R=await run(+process.env.N||11);if(R.err)ok(false,'측정 오류 '+R.err);
 // EGO: R1265 가 흰 환도 베기를 일부러 지운다(사용자 11-20) → R1353 은 그리지 않고, 원래 띠는 여전히 안 보임(알파 0)
 if(h==='ego'){ok(!R.arc.some(a=>a.src==='r1353')&&R.arc.filter(a=>a.src==='r292').every(a=>!(a.ga>0)),`ego: 반월 바꿔 그리지 않음, 원래 흰 띠도 R1265 대로 안 보임 (칼 길 ${R.arc.filter(a=>a.src==='r1353').length}·원래 ${R.arc.filter(a=>a.src==='r292').length}, 보이는 것 ${R.arc.filter(a=>a.src==='r292'&&a.ga>0).length})`);continue;}
 // 띠 시작 시각별로 묶기
 ok(R.arc.some(a=>a.src==='r1353')&&!R.arc.some(a=>a.src==='r292'),`${h}: 3D 검술 중엔 칼 길 반월만, 원래 고정 방향 반월은 안 그림 (칼 길 ${R.arc.filter(a=>a.src==='r1353').length}·원래 ${R.arc.filter(a=>a.src==='r292').length})`);
 const byKey=new Map();for(const a of R.arc){if(!a.pts||a.pts.length<4)continue;const t0=+(a.key.match(/^(?:r292:hwando:basic|r1353:arc):(-?[\d.]+)/)||[])[1];if(!Number.isFinite(t0))continue;let o=byKey.get(t0);if(!o)byKey.set(t0,o={t0,cmds:[]});o.cmds.push(a);}
 const per={};GA.push(...R.arc.filter(a=>a.src==='r1353'&&a.frame>=2&&a.frame<=5).map(a=>a.ga));
 for(const o of [...byKey.values()].sort((x,y)=>x.t0-y.t0)){
  const best=o.cmds.filter(c=>c.frame>=3&&c.frame<=5).sort((x,y)=>Math.abs(x.frame-4)-Math.abs(y.frame-4))[0];if(!best)continue;
  const tl=R.tip.filter(x=>x.t>=o.t0-.01&&x.t<=o.t0+.5);const mv=tl.find(x=>x.move)?.move;const M0=MOVES.find(m=>m.id===mv);if(!M0)continue;
  const seg=tl.filter(x=>x.t>=o.t0+M0.win[0]*.5&&x.t<=o.t0+M0.win[1]*.5).map(x=>x.xy);if(seg.length<4)continue;
  const A=seg[0],B=seg[seg.length-1],P=seg[seg.length>>1],L=dist(A,B),bend=Math.abs(cr(A,B,P))/Math.max(1,L*L);
  const s=mapPt(best.pts,...S,best.sr),e=mapPt(best.pts,...E,best.sr),m=mapPt(best.pts,...M,best.sr);
  const rec={mv,L:r1(L),bend:+bend.toFixed(3),dA:r1(L>=18?adiff(dir(s,e),dir(A,B)):0),side:Math.sign(cr(s,e,m))===Math.sign(cr(A,B,P)),mid:r1(dist([(s[0]+e[0])/2,(s[1]+e[1])/2],[(A[0]+B[0])/2,(A[1]+B[1])/2])),lim:r1(Math.max(30,L*.6))};
  (per[mv]||(per[mv]=[])).push(rec);}
 ok(IDS.every(id=>per[id]?.length),`${h}: 여덟 동작 모두 반월·칼끝 길을 잼 (${IDS.map(id=>id+':'+(per[id]?.length||0)).join(' ')})`);
 for(const id of IDS){const L=per[id]||[];if(!L.length)continue;const w=L.reduce((a,c)=>c.dA>a.dA?c:a,L[0]);
  ok(L.every(c=>c.dA<=30),`① ${h} ${id}: 반월 방향 ↔ 칼끝 길 방향 차 ≤ 30° (가장 큰 ${w.dA}°, 길 ${w.L}px)`);
  const bent=L.filter(c=>c.bend>.08&&c.L>=18);if(bent.length)ok(bent.every(c=>c.side),`② ${h} ${id}: 휘는 쪽이 칼끝 길과 같음 (${bent.filter(c=>c.side).length}/${bent.length}, 휨 ${bent[0].bend})`);
  ok(L.every(c=>c.mid<=c.lim),`③ ${h} ${id}: 반월 가운데 ↔ 칼끝 길 가운데 ${Math.max(...L.map(c=>c.mid))}px (기준 ${L[0].lim}px)`);}
 if(process.env.DUMP)console.log(JSON.stringify(per));
}
if(HEROES.at(-1)!=='hwando')await pick('hwando');
// ④ 회귀: 끄기 키 → 원래 R292 그리기(반월은 그려짐), 2D 영웅에선 손대지 않음
{const api=await p.evaluate(()=>!!window.__STORYWORLD_HWANDO_ARC_FOLLOW_R1353__);ok(api,'④ R1353 오버레이 실림');
 if(api){await p.evaluate(()=>window.__STORYWORLD_HWANDO_ARC_FOLLOW_R1353__.set(false));const d0=await p.evaluate(()=>window.__STORYWORLD_HWANDO_ARC_FOLLOW_R1353__.inspect().drawn);
  const R=await run(3);const d1=await p.evaluate(()=>window.__STORYWORLD_HWANDO_ARC_FOLLOW_R1353__.inspect().drawn);ok(d1===d0&&R.arc.filter(a=>a.src==='r292').length>5,`④ 끄기 키: 원래 R292 반월 그대로 (원래 그림 ${R.arc.length}회, 바꿔 그림 ${d1-d0})`);
  if(process.env.DUMP)console.log('GA',JSON.stringify(GA.map(x=>+(+x).toFixed(2))),'R292',JSON.stringify(R.arc.filter(a=>a.src==='r292').map(a=>[a.frame,+(+a.ga).toFixed(2)])));
  {const g0=med(R.arc.filter(a=>a.src==='r292'&&a.frame>=2&&a.frame<=5).map(a=>a.ga)),g1=med(GA);ok(g0>0&&g1>=g0*.8&&g1<=Math.max(.6,g0*1.4),`④ 보이는 세기: 칼 길 반월 알파 중앙값 ${g1?.toFixed?.(2)} ↔ 원래 띠 ${g0?.toFixed?.(2)} (×.8 이상, R350 영웅 가림에 원래보다 더 깎이지 않음 · 너무 세지도 않음)`);}
  await p.evaluate(()=>{window.__STORYWORLD_HWANDO_ARC_FOLLOW_R1353__.set(true);window.__STORYWORLD_HWANDO3D_R1302__.set(false);});await p.waitForTimeout(800);
  const e0=await p.evaluate(()=>window.__STORYWORLD_HWANDO_ARC_FOLLOW_R1353__.inspect().drawn);const R2=await run(3);const e1=await p.evaluate(()=>window.__STORYWORLD_HWANDO_ARC_FOLLOW_R1353__.inspect().drawn);
  ok(e1===e0&&R2.arc.filter(a=>a.src==='r292').length>5,`④ 2D 영웅(3D 끔): 손대지 않음 (원래 그림 ${R2.arc.length}회, 바꿔 그림 ${e1-e0})`);
  const i=await p.evaluate(()=>window.__STORYWORLD_HWANDO_ARC_FOLLOW_R1353__.inspect());ok(i.errors===0&&i.drawn>0,'④ R1353 오류 0, 바꿔 그림 '+i.drawn+' (짧은 길 '+i.fallback+', 뒤집기 '+i.mirrored+')'+(i.lastError?' '+i.lastError:''));}
 ok(errs.length===0,'④ 셰이더·WebGL 오류 0 '+errs.slice(0,2).join(' | '));}
await b.close();console.log(fail?`\nR1353 반월 FAIL ${fail}`:'\nR1353 반월 PASS');process.exit(fail?1:0);
