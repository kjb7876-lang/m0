// R1278 불을 지른 남자(ep1b07) 쓰러진 흰 대리석 기둥(r80-021) 제거 — CPU/정적 검사(실제 런타임 하네스, 그래픽·실기기 미검증).
//  사용자 2026-11-20: "불을지른 남자 맵에 이거 조형물 있는거 제거". 이 맵에서만 뺀다(다른 지역 기둥은 그대로), 충돌은 원래 비고체(solid:false)라 길막 없음.
'use strict';
const path=require('path'),assert=require('assert/strict');const R=path.resolve(__dirname,'../..');
let n=0,failed=0;const check=(name,f)=>{try{f();n++;console.log('PASS '+name);}catch(e){failed++;n++;console.log('FAIL '+name+' :: '+String(e.message||e).slice(0,500));}};
(async()=>{
const {createHarness}=require(path.join(R,'qa/harness.cjs')),h=createHarness({timeoutMs:120000});const b=await h.boot();assert.ok(b.booted&&!b.errors.length,JSON.stringify(b.errors));
const COL='world-r80/r80-021.webp';
await h.run('ensureImages(["assets/world-r80/r80-021.webp","assets/world-r80/r80-022.webp"])');
const probe=id=>JSON.parse(h.run(`(()=>{const r=makeRoom(${JSON.stringify(id)},'STORY');try{__STORYWORLD_ENVIRONMENT_R81__.dress(r);}catch(e){}
 const isCol=p=>/r80-021\\.webp$/.test(String(p.path||''))||/r80-021\\.webp$/.test(String(p.r81NativeSkin?.path||''))||p.r80Art==='r80-021';
 const cols=r.props.filter(isCol),prev=ctx;let drawn=0,braz=0;
 for(const p of r.props){if(p.visible===false)continue;player.x=p.x;player.y=p.y;cam.x=p.x;cam.y=p.y;const rec=new StoryPhase1.DrawCommands();ctx=rec;try{drawProp(p);const c=rec.finish();if(c.some(q=>q.kind==='image'&&/r80-021\\.webp$/.test(String(q.sourcePath))))drawn++;if(c.some(q=>q.kind==='image'&&/r80-022\\.webp$/.test(String(q.sourcePath))))braz++;}catch(e){}finally{ctx=prev;}}
 return JSON.stringify({total:r.props.length,cols:cols.length,colsVisible:cols.filter(p=>p.visible!==false).length,solidCols:cols.filter(p=>p.solid).length,drawn,braz,scene:r.props.filter(p=>p.r80Dressing).length});})()`));
const a=probe('ep1b07'),c=probe('ep1a09b'),d=probe('ep1a09');
check('ep1b07: 기둥 조형물이 화면에 그려지지 않음(실제 drawProp 기록)',()=>assert.equal(a.drawn,0,JSON.stringify(a)));
check('ep1b07: 기둥 조형물은 모두 숨김(visible:false) — 데이터는 남겨 장면 소품 8개 관문 유지',()=>{assert.equal(a.colsVisible,0,JSON.stringify(a));assert.ok(a.scene>=8,JSON.stringify(a));});
check('ep1b07: 기둥은 비고체였음(길막·충돌 판정 변화 없음)',()=>assert.equal(a.solidCols,0));
check('ep1b07: 다른 장면 소품(의식 화로 r80-022)은 그대로 그려짐(회귀)',()=>assert.ok(a.braz>=1,JSON.stringify(a)));
check('다른 지역(ep1a09b 결전의 날)의 기둥은 그대로 그려짐(회귀)',()=>assert.ok(c.drawn>=1,JSON.stringify(c)));
check('다른 지역(ep1a09)은 영향 없음',()=>assert.equal(d.colsVisible,d.cols,JSON.stringify(d)));
console.log('\nR1278: '+(n-failed)+'/'+n);process.exit(failed?1:0);})();
