// R1360 EGO 3D 기본 공격 — EGO 고유색 베기 궤적 ↔ 실제 3D 칼 궤적, 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  사용자 11-27 06:23Z "ego각성영웅도 절도있게 칼날로 적을 화려하게 베는 느낌 있게 개선".
//  재는 법(r1353-browser 와 같음, 오버레이 API 를 믿지 않고 실제 그린 것을 잰다):
//   · 궤적: 렌더러가 받는 프레임 명령 중 r1360:ego-arc:trail(먹·언주 붓 궤적)·:flash(언주·흰 섬광) 그림의 네 꼭짓점으로 칸→화면 변환을 세워 칼자국 시작·끝·가운데를 구한다.
//   · 칼: 그리는 순간 3D 칼끝(BladeTip) 화면 자리 → 그 공격의 베기 구간(R1353 pure.win: strike-CUT ~ strike+HOLD) 칼끝 길.
//  ① 여덟 동작 모두 붓 궤적 칼자국 방향 ↔ 칼끝 길 방향 차 ≤ 30°.  ② 뚜렷이 휜 길은 같은 쪽으로 휨.  ③ 궤적 가운데 ↔ 칼끝 길 가운데 ≤ max(30px, 길 .6배).
//  ④ 화려하게: 공격마다 붓 궤적 + 섬광 두 겹, 섬광은 가산 합성. 반투명(보이는 알파 .2~.9).  ⑤ 2D 몸 자리 고정 궤적(:r1048s*)은 보이지 않음(겹침 없음).
//  ⑥ 회귀: 끄기 키면 그리지 않음, 환도(3D)에는 그리지 않음, 2D EGO(3D 끔)에는 손대지 않음, 오류 0.
// 실행: 정적 서버 뒤 `SW_URL=… node r96/qa/r1360/r1360-ego-arc-browser.mjs`
import {chromium,boot,go} from '../r444/lib.mjs';
const W=960,H=540;
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:W,height:H}});await go(p,process.env.ZONE||'dist00');
const errs=[];p.on('console',m=>{const t=m.text();if(/Shader Error|WebGLProgram|GL_INVALID/.test(t))errs.push(t.slice(0,160));});
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
await p.evaluate(()=>{player.hp=player.maxHp=99999;window.__STORYWORLD_HWANDO3D_R1302__.set(true);window.__STORYWORLD_SWORD_COMBO_R1347__?.set(true);
 const e=room.enemies.find(e=>e.hp>0);for(const o of room.enemies)if(o!==e){o.visible=false;o.x+=9999;}e.speed=0;e.damage=0;e.hp=e.maxHp=1e9;window.__E=e;
 window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});
const IDS=['down','rise','thrust','sweep','chop','backsweep','lunge','wrap'];
const MOVES=await p.evaluate(()=>{const P=window.__STORYWORLD_SWORD_COMBO_R1347__?.pure,A=window.__STORYWORLD_HWANDO_ARC_FOLLOW_R1353__?.pure;return P?.MOVES?.map(m=>({id:m.id,win:A?.win?A.win(P,m):[m.windup,m.strike+.18]}))||null;});
ok(!!MOVES&&MOVES.length===8,'R1347 검술 표·R1353 베기 구간 읽음 '+JSON.stringify(MOVES?.map(m=>m.win.map(x=>+x.toFixed(2)))));
const SH=await p.evaluate(()=>window.__STORYWORLD_EGO_ARC_FOLLOW_R1360__?.pure?.SHEETS||null);ok(!!SH,'R1360 EGO 궤적 오버레이 실림');
const pick=async h=>{await p.evaluate(async h=>{try{await ensureImages(heroPaths('hwando'));}catch(_){}player.personaHeroR1113=false;player.egoSovereignR1046=h==='ego';player.hero='hwando';player.attackAnim=0;player.moving=false;
  const e=window.__E;e.x=player.x+1.3;e.y=player.y;},h);
 await p.waitForFunction(h=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return i.shown&&i.hero===h&&!!window.__STORYWORLD_PHASE1__.controller.state.three.scene.getObjectByName('r1305-'+h+'-3d-shared')?.getObjectByName('r1313-'+h+'-weapon');},h,{timeout:240000});await p.waitForTimeout(2500);
 await p.evaluate(h=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,s=r.scene;
  const g=s.getObjectByName('r1305-'+h+'-3d-shared'),m=g.getObjectByName('r1305-'+h+'-3d-model'),w=g.getObjectByName('r1313-'+h+'-weapon');let tip=null;w.traverse(o=>{if(!tip&&/^BladeTip/.test(o.name||''))tip=o;});
  const P2=v=>{const el=r.renderer.domElement,q=v.clone().project(r.camera);return [(q.x+1)/2*(el.clientWidth||el.width),(1-q.y)/2*(el.clientHeight||el.height)];};
  window.__tipLog=[];window.__arcLog=[];
  if(!s.__r1360M){s.__r1360M=true;const prev=s.onAfterRender;s.onAfterRender=function(...a){try{if(window.__rec){const q=window.__rq;const f0=P2(q.m.getWorldPosition(new q.T.Vector3())),b=project(player.x,player.y),t=P2(q.tip.getWorldPosition(new q.T.Vector3()));
   window.__tipLog.push({t:time,xy:[b.x+t[0]-f0[0],b.y+t[1]-f0[1]],move:window.__STORYWORLD_SWORD_COMBO_R1347__?.inspect().last?.[q.h]?.move||null});}}catch(e){window.__recErr=String(e);}return prev?.apply(this,a);};
   const sc=r.commands,cur=sc.render;const wr=function(cmds){const out=cur.apply(this,arguments);try{if(window.__rec)for(const c of cmds){const k=String(c?.key||c?.id||'');
     const isArc=/^r1360:ego-arc:/.test(k),isFix=/:r1048s\d+$/.test(k);if(c?.kind==='image'&&(isArc||isFix))window.__arcLog.push({t:time,key:k,src:isArc?(/:trail:/.test(k)?'trail':'flash'):'fixed',cell:c.sourceRect?.[2]&&/trail|ego_slash/.test(String(c.sourcePath||''))?256:256,frame:Math.floor((c.sourceRect?.[0]||0)/256),sr:c.sourceRect||null,ga:+(c.style?.globalAlpha??1),op:c.style?.globalCompositeOperation||'',pts:c.points});}}catch(e){window.__recErr=String(e);}return out;};
   wr.__r1304=true;wr.__r1336fx=true;sc.render=wr;}
  window.__rq={h,m,tip,T:r.T};},h);};
const run=async n=>{await p.evaluate(()=>{window.__tipLog=[];window.__arcLog=[];window.__starts=[];window.__rec=true;window.__SLOW=.25;let la=-9;
  window.__chain=setInterval(()=>{player.moving=false;if(time-la>.45){la=time;player.attackCD=0;basicAttack(window.__E);window.__starts.push(time);}},5);});
 await p.waitForFunction(n=>(window.__starts||[]).length>=n,n,{timeout:1500000,polling:500});
 return p.evaluate(()=>{clearInterval(window.__chain);window.__rec=false;window.__SLOW=1;return {tip:window.__tipLog,arc:window.__arcLog,err:window.__recErr||null};});};
const mapPt=(pts,u,v,sr,C)=>{const x0=sr?sr[0]%C:0,y0=sr?sr[1]:0,w=sr?sr[2]:C,h=sr?sr[3]:C;u=(u-x0)/w;v=(v-y0)/h;return [pts[0][0]+(pts[1][0]-pts[0][0])*u+(pts[3][0]-pts[0][0])*v,pts[0][1]+(pts[1][1]-pts[0][1])*u+(pts[3][1]-pts[0][1])*v];};
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),dir=(a,b)=>Math.atan2(b[1]-a[1],b[0]-a[0]),adiff=(x,y)=>{let t=Math.abs(x-y)%(2*Math.PI);return Math.min(t,2*Math.PI-t)*180/Math.PI;};
const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);const r1=x=>+x.toFixed(1);const med=a=>{const b=[...a].sort((x,y)=>x-y);return b.length?b[b.length>>1]:NaN;};
await pick('ego');
{const R=await run(+process.env.N||11);if(R.err)ok(false,'측정 오류 '+R.err);
 const tr=R.arc.filter(a=>a.src==='trail'),fl=R.arc.filter(a=>a.src==='flash'),fx=R.arc.filter(a=>a.src==='fixed');
 const keyT=a=>+(a.key.match(/^r1360:ego-arc:[a-z]+:(-?[\d.]+)/)||[])[1];const swT=new Set(tr.map(keyT)),swF=new Set(fl.map(keyT));
 ok(swT.size>=8&&[...swT].filter(t=>swF.has(t)).length>=swT.size*.8&&fl.every(a=>a.op==='lighter')&&tr.every(a=>a.op!=='lighter'),`④ 화려하게: 공격마다 붓 궤적+섬광 두 겹 (궤적 ${swT.size}회, 섬광 함께 ${[...swT].filter(t=>swF.has(t)).length}회, 섬광 가산 합성)`);
 const gT=med(tr.filter(a=>a.frame>=1&&a.frame<=3).map(a=>a.ga)),gF=med(fl.map(a=>a.ga));ok(gT>=.2&&gT<=.9&&gF>=.2&&gF<=.9,`④ 반투명: 보이는 알파 중앙값 붓 궤적 ${gT?.toFixed?.(2)}·섬광 ${gF?.toFixed?.(2)} (.2~.9)`);
 ok(fx.every(a=>!(a.ga>0)),`⑤ 2D 몸 자리 고정 궤적은 안 보임 (명령 ${fx.length}, 보이는 것 ${fx.filter(a=>a.ga>0).length})`);
 const by=new Map();for(const a of tr){if(!a.pts||a.pts.length<4)continue;const t0=keyT(a);if(!Number.isFinite(t0))continue;let o=by.get(t0);if(!o)by.set(t0,o={t0,cmds:[]});o.cmds.push(a);}
 const per={},St=SH.trail.stroke;
 for(const o of [...by.values()].sort((x,y)=>x.t0-y.t0)){const best=o.cmds.filter(c=>c.frame>=1&&c.frame<=3).sort((x,y)=>Math.abs(x.frame-2)-Math.abs(y.frame-2))[0];if(!best)continue;
  const tl=R.tip.filter(x=>x.t>=o.t0-.01&&x.t<=o.t0+.5);const mv=tl.find(x=>x.move)?.move;const M0=MOVES.find(m=>m.id===mv);if(!M0)continue;
  const seg=tl.filter(x=>x.t>=o.t0+(M0.win[0]-.02)*.5&&x.t<=o.t0+(M0.win[1]+.02)*.5).map(x=>x.xy);if(seg.length<4)continue;
  const A=seg[0],B=seg[seg.length-1];let area=0;for(const q of seg)area+=cr(A,B,q);let P=seg[seg.length>>1],bd=-1;for(const q of seg){const d=Math.sign(area||1)*cr(A,B,q);if(d>bd){bd=d;P=q;}}
  const L=dist(A,B),bend=Math.abs(cr(A,B,P))/Math.max(1,L*L);
  const s=mapPt(best.pts,...St.S,best.sr,256),e=mapPt(best.pts,...St.E,best.sr,256),m=mapPt(best.pts,...St.M,best.sr,256);
  (per[mv]||(per[mv]=[])).push({mv,L:r1(L),bend:+bend.toFixed(3),dA:r1(L>=18?adiff(dir(s,e),dir(A,B)):0),side:Math.sign(cr(s,e,m))===Math.sign(cr(A,B,P)),mid:r1(dist([(s[0]+e[0])/2,(s[1]+e[1])/2],[(A[0]+B[0])/2,(A[1]+B[1])/2])),lim:r1(Math.max(30,L*.6))});}
 ok(IDS.every(id=>per[id]?.length),`ego: 여덟 동작 모두 궤적·칼끝 길을 잼 (${IDS.map(id=>id+':'+(per[id]?.length||0)).join(' ')})`);
 for(const id of IDS){const L=per[id]||[];if(!L.length)continue;const w=L.reduce((a,c)=>c.dA>a.dA?c:a,L[0]);
  ok(L.every(c=>c.dA<=30),`① ego ${id}: 궤적 방향 ↔ 칼끝 길 방향 차 ≤ 30° (가장 큰 ${w.dA}°, 길 ${w.L}px)`);
  const bent=L.filter(c=>c.bend>.08&&c.L>=18);if(bent.length)ok(bent.every(c=>c.side),`② ego ${id}: 휘는 쪽이 칼끝 길과 같음 (${bent.filter(c=>c.side).length}/${bent.length}, 휨 ${bent[0].bend})`);
  ok(L.every(c=>c.mid<=c.lim),`③ ego ${id}: 궤적 가운데 ↔ 칼끝 길 가운데 ${Math.max(...L.map(c=>c.mid))}px (기준 ${L[0].lim}px)`);}
 if(process.env.DUMP)console.log(JSON.stringify(per));}
// ⑥ 회귀
{const api='window.__STORYWORLD_EGO_ARC_FOLLOW_R1360__';
 await p.evaluate(()=>window.__STORYWORLD_EGO_ARC_FOLLOW_R1360__.set(false));{const R=await run(3);ok(!R.arc.some(a=>a.src!=='fixed'),`⑥ 끄기 키: 그리지 않음 (${R.arc.filter(a=>a.src!=='fixed').length}), 2D 고정 궤적 보임 ${R.arc.filter(a=>a.src==='fixed'&&a.ga>0).length}`);}
 await p.evaluate(()=>window.__STORYWORLD_EGO_ARC_FOLLOW_R1360__.set(true));
 await pick('hwando');{const R=await run(3);ok(!R.arc.some(a=>a.src!=='fixed'),`⑥ 환도(3D): 그리지 않음 (${R.arc.filter(a=>a.src!=='fixed').length})`);}
 await pick('ego');await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.set(false));await p.waitForTimeout(800);
 {const d0=await p.evaluate(()=>window.__STORYWORLD_EGO_ARC_FOLLOW_R1360__.inspect().hidden);const R=await run(3);const d1=await p.evaluate(()=>window.__STORYWORLD_EGO_ARC_FOLLOW_R1360__.inspect().hidden);
  ok(!R.arc.some(a=>a.src!=='fixed')&&d1===d0,`⑥ 2D EGO(3D 끔): 손대지 않음 (그림 ${R.arc.filter(a=>a.src!=='fixed').length}, 끈 고정 궤적 ${d1-d0}, 2D 고정 궤적 명령 ${R.arc.filter(a=>a.src==='fixed').length})`);}
 const i=await p.evaluate(()=>window.__STORYWORLD_EGO_ARC_FOLLOW_R1360__.inspect());ok(i.errors===0&&i.drawn>0,'⑥ R1360 오류 0, 그림 '+i.drawn+' (섬광 '+i.flash+', 짧은 길 '+i.fallback+', 뒤집기 '+i.mirrored+')'+(i.lastError?' '+i.lastError:''));
 ok(errs.length===0,'⑥ 셰이더·WebGL 오류 0 '+errs.slice(0,2).join(' | '));}
await b.close();console.log(fail?`\nR1360 EGO 궤적 FAIL ${fail}`:'\nR1360 EGO 궤적 PASS');process.exit(fail?1:0);
