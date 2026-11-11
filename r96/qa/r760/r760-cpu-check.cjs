// R760 CPU 검사: 불면귀 보스 연출(bulmyeongwi-r760.js) — 사용자 2026-11-11 "불면귀보스도 모든방면으로 개선 모션이랑 일관성과 불면귀스럽게, 귀비탕영상참고".
//  ① 일관성: 대기(idle 그림)·공격(attack 그림)이 서로 다른 크기(헤드리스 실측 키 158.7 vs 132.6px, 16% 튐)·다른 그림체였다
//     → 같은 인물의 4자세(R104 mb-last302 p1~p4, 먹색·보라 톤 + 호박색 눈빛 사본)로 통일, 크기는 대기 기준 하나로.
//  ② 불면귀다움: 회백 연기 → 먹색·보라(assets/r760/boss), 정본 35장 '겹겹의 잔상' = 몸 뒤 잔상 2겹(체력 절반 이하 3겹), 공격 준비 때 벌어짐.
//  ③ 존재감: 보스 몸 키 = 대기 기준 ×1.3 (중간보스 '검은 안개 심장'보다 확실히 큼).
//  ④ 제외·경계: 일반 몹·다른 보스·죽음·끄기·체력 정확히 50%·dt 0/5·R620(보스 움직임 보간)과 함께 돌 때 자세 번호 인식.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const F=path.join(R,'client-source','bulmyeongwi-r760.js');ok(fs.existsSync(F),'bulmyeongwi-r760.js exists');const src=fs.readFileSync(F,'utf8');
const F620=path.join(R,'client-source','boss-motion-r620.js');const src620=fs.readFileSync(F620,'utf8');
const IDLE='assets/r425/clean/assets/generated-v31224/actors-normalized/692e4ae01c29_bulmyeongwi_idle.webp',ATK='assets/generated-v31224/actors-normalized/115b7fcea51e_bulmyeongwi_attack.webp',
 RAIN='assets/generated-v31224/actors-normalized/35526bcfa1c2_bulmyeongwi_rain.webp',MID='assets/r104/bosses/mb-last302-v31231-p4.webp',MOB='assets/episode1b/generated-v394/bulmyeongwi_b.webp';
function world({store={},roomId='last303',with620=false,ready=true,sheets=false}={}){const timers=[];const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,Symbol,isFinite,RegExp,performance:{now:()=>0},
  setTimeout:(f)=>{timers.push(f);return timers.length;},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};ctx.window=ctx;vm.createContext(ctx);
 vm.runInContext(`var time=0,room={id:${JSON.stringify(roomId)},enemies:[]},player={x:6,y:3},ctx={commands:[]};var __ready=${ready},__sheets=${sheets},__added=[];
  function addImage(p){__added.push(p);}function readyImage(p){if(String(p).includes('assets/r760/')&&!__ready)return null;if(/sheet-/.test(p)){if(!__sheets)return null;const n=/sheet-(idle|move)/.test(p)?6:8;return {ready:true,image:{src:'http://x/m0/'+p,naturalWidth:n*512,naturalHeight:512}};}const w=/-p[0-9][.]/.test(p)?393:672,h=/-p[0-9][.]/.test(p)?432:384;return {ready:true,image:{src:'http://x/m0/'+p,naturalWidth:w,naturalHeight:h}};}
  var zoom=1;function project(x,y){return {x:100+(x-3)*10*zoom,y:200+(y-3)*5*zoom};}
  // 엔진 몸: 발밑 = project(e), 그림 672x384 전체 사각형. 대기 그림은 키 158.7(발 줄 322/384), 공격 그림은 132.6 으로 그려졌다(실측).
  function drawEnemy(e){const P=project(e.x,e.y);const path=e.__path||(e.attack?'${ATK}':'${IDLE}');const qh=zoom*(path.includes('attack')?132.6:path.includes('mb-last302')?94.5:path.includes('episode1b')?80:158.7);
   const iw=path.includes('mb-last302')?393:path.includes('episode1b')?418:672,ih=path.includes('mb-last302')?432:path.includes('episode1b')?418:384,qw=qh*iw/ih,footRow=path.includes('mb-last302')?406:path.includes('episode1b')?400:(path.includes('idle')?322:352);
   const top=P.y-qh*footRow/ih,L=P.x-qw/2;
   ctx.commands.push({kind:'image',key:'enemy:'+room.id+':'+e.nativeId+':0',order:7,owner:{kind:'enemy'},image:{src:'http://x/m0/'+path,naturalWidth:iw,naturalHeight:ih},imageSize:[iw,ih],sourcePath:path,sourceRect:[0,0,iw,ih],style:{globalAlpha:1},points:[[L,top],[L+qw,top],[L+qw,top+qh],[L,top+qh]]});
   ctx.commands.push({kind:'fill',owner:{kind:'enemy'},style:{fillStyle:'#f00'},paths:[{points:[[80,205],[120,205],[120,208],[80,208]]}]});
   ctx.commands.push({kind:'text',owner:{kind:'enemy'},text:e.name,point:[P.x,P.y-qh*.8],style:{}});}`,ctx);
 if(with620)vm.runInContext(src620,ctx);vm.runInContext(src,ctx);
 while(timers.length)timers.shift()();return ctx;}
const run=(c,s)=>vm.runInContext(s,c);const API=c=>c.__STORYWORLD_BULMYEONGWI_R760__;
const H=k=>Math.abs(k.points[3][1]-k.points[0][1]);
function frames(c,e,secs,{dt=1/30,step=null}={}){const out=[];for(let t=0;t<secs-1e-9;t+=dt){run(c,`time+=${dt}`);if(step)step(e,t);run(c,'ctx.commands.length=0');c.drawEnemy(e);
  const cm=run(c,'ctx.commands').filter(k=>k.kind==='image');const body=cm.filter(k=>!k.r760Ghost&&!k.r620Ghost);const b=body[body.length-1];out.push({cm,b,ghosts:cm.filter(k=>k.r760Ghost),bi:cm.indexOf(b)});}return out;}
const boss=o=>({id:'B',nativeId:'l303-boss',name:'불면귀',boss:true,midboss:false,x:3,y:3,hp:1000,maxHp:1000,hitTimer:0,...o});
const VIS=400; // 4자세 그림의 보이는 키(px, R104 visibleHeight)
const visH=k=>H(k)*VIS/432; // 4자세 그림 사각형 키 → 보이는 몸 키
const UNIT=158.7*257/384; // 지금 엔진이 그리는 대기 그림의 보이는 몸 키(보이는 영역 257/384)
ok(typeof API(world())?.inspect==='function','API inspect');
{// ① 대기: 4자세 톤 사본(p4)으로, 발은 그대로, 보이는 키 = 대기 기준 ×1.3
 const c=world(),e=boss();const L=frames(c,e,1);const f=L[L.length-1];
 ok(/assets\/r760\/boss\/bulmyeongwi-p4\.webp$/.test(f.b.sourcePath),'idle → toned p4 ('+f.b.sourcePath+')');
 ok(JSON.stringify(f.b.sourceRect)==='[0,0,393,432]','idle: source rect is the whole pose image');
 const fy=f.b.points[0][1]+H(f.b)*406/432;ok(Math.abs(fy-200)<.6,'idle: foot (pivot row 406) on the ground point ('+fy.toFixed(2)+')');
 const fx=f.b.points[0][0]+(f.b.points[1][0]-f.b.points[0][0])*193/393;ok(Math.abs(fx-100)<.6,'idle: pivot x on the ground point ('+fx.toFixed(2)+')');
 // 회귀(헤드리스 실측): 그림만 바꾸고 imageSize(672x384)를 그대로 두면 렌더러가 칸 좌표를 옛 크기로 나눠 왼쪽 58%만 늘여 그렸다
 ok(JSON.stringify(f.b.imageSize)==='[393,432]','idle: imageSize follows the new image ('+JSON.stringify(f.b.imageSize)+')');
 ok(Math.abs(visH(f.b)/UNIT-1.3)<.02,'idle: visible height = 1.3 × engine idle ('+(visH(f.b)/UNIT).toFixed(3)+')');}
{// ① 공격: 준비 p1 → 타격 p2 → 이어짐 p3, 크기는 대기와 같다(지금은 16% 작아짐)
 const c=world(),e=boss();frames(c,e,.3);const idleH=visH(frames(c,e,.05)[0].b);
 e.attack={elapsed:0,angle:0,shape154:{windup:.35}};const L=frames(c,e,.9,{step:(e)=>{e.attack.elapsed+=1/30;}});
 const poses=L.map(f=>(/bulmyeongwi-p(\d)\.webp/.exec(f.b.sourcePath)||[])[1]);
 ok(poses.slice(0,9).every(p=>p==='1'),'attack windup → p1 ('+poses.slice(0,9).join('')+')');
 ok(poses.slice(11,15).every(p=>p==='2'),'strike → p2 ('+poses.slice(10,16).join('')+')');ok(poses.slice(-5).every(p=>p==='3'),'follow-through → p3');
 ok(L.every(f=>Math.abs(visH(f.b)-idleH)<.5),'attack keeps the idle size (no 16% jump)');
 // 영웅이 오른쪽(+x)이면 그대로, 왼쪽이면 좌우 뒤집기(사각형 x 순서가 바뀜)
 ok(L.every(f=>f.b.points[1][0]>f.b.points[0][0]),'hero on the right: not mirrored');
 const c2=world(),e2=boss();run(c2,'player.x=0;player.y=3');e2.attack={elapsed:.5,angle:Math.PI,shape154:{windup:.35}};const L2=frames(c2,e2,.1);ok(L2.every(f=>f.b.points[1][0]<f.b.points[0][0]),'hero on the left: mirrored');}
{// 회귀(헤드리스 실측): 공격 때 카메라가 당겨지면(zoom) 자세마다 크기가 튀었다(p1 4.4 vs p3 5.0 칸당) → 칸 길이 기준으로 같은 크기
 const c=world(),e=boss();frames(c,e,.5);const tl=()=>Math.hypot(10,5)*run(c,'zoom');const per0=visH(frames(c,e,.05)[0].b)/tl();
 e.attack={elapsed:0,angle:0,shape154:{windup:.35}};const zs=[];const L=frames(c,e,.9,{step:(e,t)=>{e.attack.elapsed+=1/30;const z=1+Math.min(.15,t*.3);zs.push(z);run(c,'zoom='+z);}});
 ok(L.every((f,i)=>Math.abs(visH(f.b)/(Math.hypot(10,5)*zs[i])-per0)<.02*per0),'zoom during attack: size per tile stays constant');}
{// 회귀(헤드리스 실측): 엔진이 e.attack 없이 state 'attack' 으로 공격 그림만 줄 때도 대기 자세(p4)가 아니라 공격 자세로
 const c=world(),e=boss({state:'attack',stateAge:0,__path:ATK});const L=frames(c,e,.7,{step:(e)=>{e.stateAge+=1/30;}});
 const ps=L.map(f=>(/bulmyeongwi-p(\d)\.webp/.exec(f.b.sourcePath)||[])[1]).join('');ok(/^1+2+3+$/.test(ps),'state attack without e.attack: p1→p2→p3 ('+ps+')');}
{// ② 패턴 그림(실비)도 톤 사본, 크기는 대기 기준 ×1.3 에 맞춰 키움(발 줄 유지)
 const c=world(),e=boss();frames(c,e,.2);e.__path=RAIN;const f=frames(c,e,.1).pop();
 ok(/assets\/r760\/boss\/bulmyeongwi-rain\.webp$/.test(f.b.sourcePath),'rain pattern → toned rain');ok(JSON.stringify(f.b.imageSize)==='[672,384]','rain: imageSize 672x384');
 ok(Math.abs(H(f.b)/158.7-1.3)<.02,'rain: scaled with the idle unit ×1.3 ('+(H(f.b)/158.7).toFixed(3)+')');
 const fy=f.b.points[0][1]+H(f.b)*353/384;ok(Math.abs(fy-200)<.8,'rain: foot row stays on the ground ('+fy.toFixed(2)+')');}
{// ② 겹겹의 잔상: 몸 뒤(명령 순서 앞)에 2겹, 같은 그림·옅은 알파, 움직임이 있음
 const c=world(),e=boss();const L=frames(c,e,2);const f=L[L.length-1];
 ok(f.ghosts.length===2,'2 afterimages at full health ('+f.ghosts.length+')');
 ok(f.ghosts.every(g=>f.cm.indexOf(g)<f.bi),'afterimages are drawn behind the body');
 ok(f.ghosts.every(g=>g.sourcePath===f.b.sourcePath),'afterimages use the same pose image');
 // 회귀: 잔상이 몸과 같은 key 면 렌더러가 같은 메시로 보고 하나만 그린다 → 서로 다른 key
 const keys=[f.b.key,...f.ghosts.map(g=>g.key)];ok(new Set(keys).size===keys.length&&f.ghosts.every(g=>String(g.key).startsWith(String(f.b.key))),'afterimages get their own keys ('+keys.join(' | ')+')');
 const al=f.ghosts.map(g=>g.style.globalAlpha);ok(al.every(a=>a>=.08&&a<=.32)&&al[0]>al[1],'afterimage alpha .08..32, fading outward ('+al.map(a=>a.toFixed(2))+')');
 const dx=L.slice(10).map(f=>f.ghosts[0].points[0][0]-f.b.points[0][0]);ok(Math.max(...dx)-Math.min(...dx)>2,'afterimages drift (not frozen)');
 ok(L.slice(10).every(f=>f.ghosts.every(g=>Math.abs(g.points[0][0]-f.b.points[0][0])<H(f.b)*.25)),'afterimages stay near the body');
 // 공격 준비 때 잔상이 더 벌어짐(잠을 빼앗는 시선의 압박)
 const spread=fr=>Math.max(...fr.map(f=>Math.max(...f.ghosts.map(g=>Math.hypot(g.points[0][0]-f.b.points[0][0],g.points[0][1]-f.b.points[0][1])))));
 const idleSp=spread(L.slice(10));e.attack={elapsed:0,angle:0,shape154:{windup:.6}};const W=frames(c,e,.5,{step:(e)=>{e.attack.elapsed+=1/30;}});ok(spread(W.slice(6))>idleSp*1.4,'windup: afterimages spread ('+spread(W.slice(6)).toFixed(1)+' > 1.4×'+idleSp.toFixed(1)+')');}
{// 회귀(헤드리스 실측): 몸이 커지자 엔진이 옛 키에 맞춰 둔 이름표가 가면(얼굴)을 덮었다 → 이름표를 몸 위로
 const c=world(),e=boss();frames(c,e,.3);run(c,'ctx.commands.length=0');c.drawEnemy(e);const cm=run(c,'ctx.commands');const b=cm.filter(k=>k.kind==='image'&&!k.r760Ghost).pop(),t=cm.find(k=>k.kind==='text');
 const top=Math.min(...b.points.map(q=>q[1]));ok(t.point[1]<=top+H(b)*.03-4,'name label above the body top ('+t.point[1].toFixed(1)+' <= '+(top+H(b)*.03-4).toFixed(1)+')');
 const cm2=world({roomId:'last302'}),m=boss({nativeId:'l302-e1',name:'포구 검은 안개',boss:false,__path:MOB});run(cm2,'ctx.commands.length=0');cm2.drawEnemy(m);const t2=run(cm2,'ctx.commands').find(k=>k.kind==='text');ok(Math.abs(t2.point[1]-(200-80*.8))<1e-9,'normal mob label untouched');}
{// 경계: 체력 정확히 50% 는 3겹(2단계), 50% 초과는 2겹
 const c=world(),e=boss({hp:500});ok(frames(c,e,.2).pop().ghosts.length===3,'hp = 50%: 3 afterimages');
 const c2=world(),e2=boss({hp:501});ok(frames(c2,e2,.2).pop().ghosts.length===2,'hp 50.1%: 2 afterimages');}
{// 중간보스 '검은 안개 심장 · 불면의 기억'(last302): 그림·크기는 그대로(불면귀의 기억 조각), 잔상 1겹만
 const c=world({roomId:'last302'}),e=boss({nativeId:'mb-last302-v31231',name:'검은 안개 심장 · 불면의 기억',boss:false,midboss:true,__path:MID});const f=frames(c,e,1).pop();
 ok(f.b.sourcePath===MID&&Math.abs(H(f.b)-94.5)<.01,'midboss: image and size untouched');ok(f.ghosts.length===1,'midboss: one afterimage');}
{// 제외: 일반 몹(같은 저승사자 그림)·다른 지역 보스·죽음·끄기
 const c=world({roomId:'last302'}),m=boss({nativeId:'l302-e1',name:'포구 검은 안개',boss:false,__path:MOB});const fm=frames(c,m,.5).pop();ok(fm.b.sourcePath===MOB&&fm.ghosts.length===0&&Math.abs(H(fm.b)-80)<.01,'normal mob untouched');
 const co=world({roomId:'last301'}),eo=boss({nativeId:'l301-boss',name:'타락천사 기사'});const fo=frames(co,eo,.5).pop();ok(fo.b.sourcePath===IDLE&&fo.ghosts.length===0,'other region boss untouched');
 const cd=world(),ed=boss({hp:0});const fd=frames(cd,ed,.3).pop();ok(fd.b.sourcePath===IDLE&&fd.ghosts.length===0,'dead boss untouched (death art chain keeps its own frames)');
 const cf=world({store:{'storyworld.r760.bulmyeongwi':'{"on":false}'}}),ef=boss();const ff=frames(cf,ef,.3).pop();ok(ff.b.sourcePath===IDLE&&ff.ghosts.length===0,'off switch: untouched');
 const fb=frames(world(),boss(),.3).pop();ok(run(world(),'1')&&fb.cm.length===3,'only body + afterimages (health bar is a fill command, left alone)');}
{// 그림이 아직 안 실렸으면 원본 그대로 그리고 불러오기만 요청(빈 화면 금지)
 const c=world({ready:false}),e=boss();const f=frames(c,e,.2).pop();ok(f.b.sourcePath===IDLE,'not loaded yet: original kept');ok(run(c,'__added').some(p=>/bulmyeongwi-p4\.webp$/.test(p)),'toned pose requested');}
{// 회귀(헤드리스 실측): 지역에 들어가자마자 보스가 나오면 첫 0.3초 동안 원본(회백 저승사자)이 비쳤다 → 불면귀 지역에 들어와 아무 적이나 그려지면 미리 청한다
 const c=world({roomId:'dist01',ready:false});run(c,'__added.length=0;room.id="last303"');const m=boss({nativeId:'l302-e1',name:'주민에게서 떨어진 검은 안개',boss:false,__path:MOB});frames(c,m,.05);
 ok(['p1','p2','p3','p4','rain','transition'].every(k=>run(c,'__added').some(p=>p.endsWith('bulmyeongwi-'+k+'.webp'))),'entering last303: all toned images requested');
 run(c,'__added.length=0');frames(c,m,.05);ok(run(c,'__added').length===0,'requested once per visit (not every frame)');}
{// R620 과 함께: R620 이 4자세 번호(-p1~-p4)를 알아보고 교차 보간, 잔상은 R620 이 고른 몸을 따라감
 const c=world({with620:true}),e=boss();frames(c,e,.5);e.attack={elapsed:0,angle:0,shape154:{windup:.35}};const L=frames(c,e,.9,{step:(e)=>{e.attack.elapsed+=1/30;}});
 ok(c.__STORYWORLD_BOSS_MOTION_R620__.inspect().stats.xfades>=1,'R620 cross-fades the R760 poses');
 ok(L.every(f=>f.ghosts.length===2&&f.ghosts.every(g=>g.sourcePath===f.b.sourcePath)),'afterimages follow the R620-shaped body');
 ok(L.every(f=>f.ghosts.every(g=>f.cm.indexOf(g)<f.bi)),'afterimages behind body with R620');}
{// 경계값: dt 0·큰 dt 에서 유한, 오류 0
 const c=world(),e=boss();frames(c,e,.3);run(c,'ctx.commands.length=0');c.drawEnemy(e);c.drawEnemy(e);run(c,'time+=5;ctx.commands.length=0');c.drawEnemy(e);
 ok(run(c,'ctx.commands').filter(k=>k.kind==='image').every(k=>k.points.flat().every(Number.isFinite)),'finite points after dt=0 and dt=5');ok(API(c).inspect().stats.errors===0,'no errors');}
// ── R761: Dots CX-0070BM 불면귀 보스 시트(실타래 형상·호박 눈·보라 핵, 512칸·발 (256,469.33)) ──
const SH=k=>(/sheet-(\w+)\.webp$/.exec(k.sourcePath)||[])[1],FR=k=>Math.round(k.sourceRect[0]/512),SVIS=383; // 시트 보이는 키(768칸 약 575px → 512칸)
const svis=k=>H(k)*SVIS/512;
{// 대기: idle 시트 6칸이 돌고, 발이 땅점에, 크기는 엔진 대기 ×1.3(4자세 때와 같은 기준)
 const c=world({sheets:true}),e=boss();const L=frames(c,e,1.2);const f=L[L.length-1];
 ok(SH(f.b)==='idle','idle → sheet-idle ('+f.b.sourcePath+')');ok(JSON.stringify(f.b.imageSize)==='[3072,512]','idle sheet imageSize 3072x512');
 ok(f.b.sourceRect[1]===0&&f.b.sourceRect[2]===512&&f.b.sourceRect[3]===512&&f.b.sourceRect[0]%512===0,'idle: one 512 cell ('+f.b.sourceRect+')');
 ok(new Set(L.map(x=>FR(x.b))).size>=5,'idle: frames cycle ('+[...new Set(L.map(x=>FR(x.b)))].join('')+')');
 const fy=f.b.points[0][1]+H(f.b)*469.33/512,fx=f.b.points[0][0]+(f.b.points[1][0]-f.b.points[0][0])*.5;ok(Math.abs(fy-200)<.6&&Math.abs(fx-100)<.6,'idle sheet: pivot on the ground point ('+fx.toFixed(2)+','+fy.toFixed(2)+')');
 ok(Math.abs(svis(f.b)/UNIT-1.3)<.02,'idle sheet: visible height = 1.3 × engine idle ('+(svis(f.b)/UNIT).toFixed(3)+')');
 ok(f.ghosts.length===2&&f.ghosts.every(g=>g.sourcePath===f.b.sourcePath&&String(g.sourceRect)===String(f.b.sourceRect)&&String(g.imageSize)===String(f.b.imageSize)),'afterimages share the sheet frame');}
{// 공격: 첫 공격은 실 팔 휘감기(atkA), 다음 공격은 눈빛(atkB). 준비 동안 0→3칸, 타격 뒤 7칸까지, 크기는 대기와 같다
 const c=world({sheets:true}),e=boss();frames(c,e,.3);const idleH=svis(frames(c,e,.05)[0].b);
 e.attack={elapsed:0,angle:0,shape154:{windup:.35}};const L=frames(c,e,1.0,{step:(e)=>{e.attack.elapsed+=1/30;}});
 ok(L.every(f=>SH(f.b)==='atkA'),'1st attack → sheet-atkA ('+[...new Set(L.map(f=>SH(f.b)))]+')');const fr=L.map(f=>FR(f.b));
 ok(fr.every((v,i)=>!i||v>=fr[i-1]),'attack frames move forward ('+fr.join('')+')');ok(fr[0]===0&&fr[9]<=3&&fr[11]>=3&&fr[fr.length-1]===7,'windup 0..2, strike 3 at windup end, ends on 7 ('+fr.join('')+')');
 ok(L.every(f=>Math.abs(svis(f.b)-idleH)<.5),'attack sheet keeps the idle size');ok(JSON.stringify(L[0].b.imageSize)==='[4096,512]','attack sheet imageSize 4096x512');
 ok(L.every(f=>f.b.points[1][0]>f.b.points[0][0]),'hero on the right: sheet not mirrored');
 e.attack=null;frames(c,e,.3);e.attack={elapsed:0,angle:Math.PI,shape154:{windup:.35}};run(c,'player.x=0');const L2=frames(c,e,.3,{step:(e)=>{e.attack.elapsed+=1/30;}});
 ok(L2.every(f=>SH(f.b)==='atkB'),'2nd attack → sheet-atkB');ok(L2.every(f=>f.b.points[1][0]<f.b.points[0][0]),'hero on the left: sheet mirrored');}
{// 엔진이 e.attack 없이 state 'attack' 만 줄 때도 공격 시트가 앞으로 감
 const c=world({sheets:true}),e=boss({state:'attack',stateAge:0,__path:ATK});const L=frames(c,e,.9,{step:(e)=>{e.stateAge+=1/30;}});
 const fr=L.map(f=>FR(f.b));ok(L.every(f=>/^atk/.test(SH(f.b)))&&fr[0]===0&&fr[fr.length-1]===7&&fr.every((v,i)=>!i||v>=fr[i-1]),'state attack: atk sheet 0→7 ('+fr.join('')+')');}
{// 걷기 → move 시트, 멈추면 idle
 const c=world({sheets:true}),e=boss();const L=frames(c,e,.8,{step:(e)=>{e.x+=.06;}});ok(SH(L[L.length-1].b)==='move','walking → sheet-move ('+SH(L[L.length-1].b)+')');
 const L2=frames(c,e,.8);ok(SH(L2[L2.length-1].b)==='idle','stopped → sheet-idle');}
{// 실비 패턴 → 두 팔을 들어 올리는 cast(4~6칸 되풀이), 흩어짐 → 핵이 드러나는 reveal(마지막 칸 유지)
 const c=world({sheets:true}),e=boss({__path:RAIN});const L=frames(c,e,1.6);const fr=L.map(f=>FR(f.b));
 ok(L.every(f=>SH(f.b)==='cast'),'rain → sheet-cast');ok(fr[0]===0&&fr.slice(-15).every(v=>v>=4&&v<=6),'cast: rises then loops 4..6 ('+fr.join('')+')');
 ok(L.every(f=>{const fy=f.b.points[0][1]+H(f.b)*469.33/512;return Math.abs(fy-200)<.6;}),'cast: foot on the ground');
 const TR=RAIN.replace('35526bcfa1c2_bulmyeongwi_rain','de4c1414da0d_bulmyeongwi_transition');const c2=world({sheets:true}),e2=boss({__path:TR});const L2=frames(c2,e2,1.6);const fr2=L2.map(f=>FR(f.b));
 ok(L2.every(f=>SH(f.b)==='reveal')&&fr2[0]===0&&fr2.slice(-5).every(v=>v===7),'transition → sheet-reveal, holds the core-revealed frame ('+fr2.join('')+')');}
{// 시트가 안 실렸으면 톤 4자세로(빈 화면·원본 비침 없음), 지역에 들어오면 시트도 미리 청함
 const c=world({sheets:false}),e=boss();const f=frames(c,e,.2).pop();ok(/bulmyeongwi-p4\.webp$/.test(f.b.sourcePath),'sheet not ready: toned p4 fallback');
 ok(['idle','move','atkA','atkB','cast','reveal'].every(k=>run(c,'__added').some(p=>p.endsWith('sheet-'+k+'.webp'))),'sheets requested');}
{// R620 과 함께: 시트를 바꿀 때 R620 교차 보간 잔상은 옛 그림의 imageSize 를 가져야(안 그러면 3칸 동안 엉뚱하게 잘림)
 const c=world({sheets:true,with620:true}),e=boss();frames(c,e,.5);for(let i=0;i<60&&FR(frames(c,e,1/30)[0].b)!==0;i++);e.attack={elapsed:0,angle:0,shape154:{windup:.35}};let bad=0,xf=0;
 frames(c,e,.9,{step:(e)=>{e.attack.elapsed+=1/30;}}).forEach(f=>f.cm.filter(k=>k.r620Ghost).forEach(g=>{xf++;const n=/sheet-(idle|move)/.test(g.sourcePath)?6:8;if(/sheet-/.test(g.sourcePath)&&g.imageSize[0]!==n*512)bad++;}));
 ok(xf>0,'R620 cross-fades idle frame 0 → atkA frame 0 ('+xf+')');ok(bad===0,'R620 cross-fade ghost keeps its own imageSize ('+xf+' ghosts, '+bad+' bad)');ok(API(c).inspect().stats.errors===0,'no errors with R620 + sheets');}
console.log('R760 CPU check OK ('+n+' assertions)');
