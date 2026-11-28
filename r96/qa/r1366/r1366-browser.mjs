// R1366 헤드리스 브라우저 측정(소프트웨어 렌더 — 그래픽·GPU·실기기 검증 아님).
//  지역마다 들어가 R204 거르기가 끝난 뒤: ① 실내에 바깥 그림 장식 0 ② 기준 맵 밖에서 같은 그림 장식 상한(장면 2·가구 3) ③ 계단은 전환 자리 3.5칸 안
//  ④ 판정(solid) 소품은 하나도 안 숨김 ⑤ R204 둥근 그늘 판 없음 ⑥ 윤하람: 아스팔트 바닥 + 도로 표시, 옥상: 표시 ⑦ 페이지 오류 0. SHOT=폴더 면 화면도 찍음.
//  사용: SW_URL=http://127.0.0.1:4411/m0/ node r96/qa/r1366/r1366-browser.mjs [지역…]
import {chromium,boot,skip,go} from '../r444/lib.mjs';import fs from 'fs';
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(d!==undefined?' '+JSON.stringify(d).slice(0,300):''));};
const zones=process.argv.slice(2).length?process.argv.slice(2):['murder01','murder02','murder03','ep1a09','murder04','kair04'];
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
const SHOT=process.env.SHOT;if(SHOT)fs.mkdirSync(SHOT,{recursive:true});
for(const z of zones){await go(p,z);await p.waitForFunction(()=>room.r1062Props===true,null,{timeout:30000}).catch(()=>{});await p.waitForTimeout(3000);
 const r=await p.evaluate(()=>{const M=window.__STORYWORLD_PROPS_DECLUTTER_R1366__,ins=M.inspect(),art=q=>String(q.r303Skin?.path||q.r81NativeSkin?.path||q.path||'');
  const decor=q=>!q.solid&&!q.name&&!q.label&&!q.interactive&&!q.r74Door&&!q.r406Boss&&(q.r74Prop||q.r80Dressing||q.r224Furniture||q.r449Furniture||q.kind==='regional-scene-prop'||q.sourceZoneProp);
  const shown=(room.props||[]).filter(q=>q&&q.visible!==false&&!q.r303Hide&&decor(q)).map(q=>({id:q.id,a:art(q).split('/').pop(),f:!!(q.r224Furniture||q.r449Furniture),x:q.x,y:q.y}));
  const L=room.exploration,T=[...(L.worldR74?.doors||[]),L.entry,L.entrance,room.altar].filter(t=>t&&Number.isFinite(t.x+t.y));
  let blob=0,marks=0;
  const roots=[];try{const t=window.__STORYWORLD_PHASE1__.controller.state.three;if(t?.spatialRoot)roots.push(t.spatialRoot);}catch(_){}
  for(const rt of roots)rt.traverse(o=>{if(o.name==='r204-prop-shadows')blob++;if(o.name==='r1366-road-marks')marks++;});
  return {ins,shown,T,blob,marks,roots:roots.length,solidHidden:(room.props||[]).filter(q=>q.solid&&String(q.r303Hide||'').startsWith('r1366')).length,
   tile:(()=>{try{return window.__STORYWORLD_TILES_R118__.inspect().current?.file||null;}catch(_){return null;}})(),ref:M.reference(room.id),indoor:M.indoor.includes(room.id)};});
 const OUT=/^(ruined_market|broken_street_lamp|moss_boulders|dead_tree|broken_gate|village_well|collapsed_pillar|blank_memorial)\./;
 if(r.indoor)ok(!r.shown.some(q=>OUT.test(q.a)),z+': 실내에 바깥 그림 장식 없음',r.shown.filter(q=>OUT.test(q.a)).map(q=>q.a));
 if(!r.ref){const c={};for(const q of r.shown){const k=q.a;c[k]=c[k]||{n:0,f:false};c[k].n++;c[k].f||=q.f;}const over=Object.entries(c).filter(([k,v])=>v.n>(v.f?3:2));ok(!over.length,z+': 같은 그림 상한(장면 2·가구 3)',over);
  const st=r.shown.filter(q=>/stair|r80-032\.|r80-055\./i.test(q.a));ok(st.every(q=>r.T.some(t=>Math.hypot(t.x-q.x,t.y-q.y)<=3.5)),z+': 계단은 전환 자리 곁에만',st);}
 ok(r.solidHidden===0,z+': 판정 있는 소품은 안 숨김');ok(r.blob===0,z+': R204 둥근 그늘 판 없음',r.blob);
 if(z==='murder01'){ok(r.tile==='asphalt',z+': 바닥 아스팔트',r.tile);ok(r.marks>=1,z+': 횡단보도·차선 표시',r.marks);}
 if(z==='murder03')ok(r.marks>=1,z+': 옥상 고리 표시',r.marks);
 console.log('  '+z+' 남은 장식 '+r.shown.length+' · 숨김 '+(r.ins.room?.hidden?.length||0)+' · 접촉 그림자 '+r.ins.stats.contact+' · '+JSON.stringify(r.ins.room?.hidden?.map(h=>h[2]+':'+h[1].replace('r1366-',''))).slice(0,400));
 if(SHOT){await p.evaluate(()=>{const W=window.__STORYWORLD_PROPS_DECLUTTER_R1366__;});await p.screenshot({path:SHOT+'/'+z+'.png'});}}
ok(!errs.length,'페이지 오류 0',errs.slice(0,3));console.log('\nR1366 browser: '+(n-bad)+'/'+n);await b.close();process.exit(bad?1:0);
