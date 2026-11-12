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
function world({store={},roomId='last303',with620=false,ready=true,sheets=false,audio=true,between='',pre=''}={}){const timers=[];const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,Symbol,isFinite,RegExp,performance:{now:()=>0},
  setTimeout:(f)=>{timers.push(f);return timers.length;},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};ctx.window=ctx;vm.createContext(ctx);
 vm.runInContext(`var time=0,room={id:${JSON.stringify(roomId)},enemies:[]},player={x:6,y:3},ctx={commands:[]};var __ready=${ready},__sheets=${sheets},__added=[],__snd=[];${audio?"var soundProfiles={boss:[{key:'b',path:'x.ogg',gain:1}]};function sound(k){__snd.push(k);}function setupAudio(){soundProfiles={boss:[]};}var modal=null;":''}
  function addImage(p){__added.push(p);}function readyImage(p){if(String(p).includes('assets/r760/')&&!__ready)return null;if(/sheet-/.test(p)){if(!__sheets)return null;const n=/[/]mid[/]sheet-hit/.test(p)?4:/[/]mid[/]sheet-idle/.test(p)?6:/[/]mid[/]/.test(p)?8:/sheet-(idle|move|idle2)[.]/.test(p)?6:/sheet-hit2?[.]/.test(p)?4:/sheet-death/.test(p)?10:8;return {ready:true,image:{src:'http://x/m0/'+p,naturalWidth:n*512,naturalHeight:512}};}const w=/-p[0-9][.]/.test(p)?393:672,h=/-p[0-9][.]/.test(p)?432:384;return {ready:true,image:{src:'http://x/m0/'+p,naturalWidth:w,naturalHeight:h}};}
  var effects=[],__drawn=[],__base=[];function spawnBurnDeath3(e){effects.push({type:'enemyBurnDeath',x:e.x,y:e.y,age:0,life:e.boss?1.25:e.midboss?.95:.72,sourceId:e.id,bodyHeight:70});return true;}function drawBurnDeath3(f){__base.push(f.sourceId);}
  function drawAssetFrame3(path,frame,x,y,h,opt){if(!readyImage(path))return false;__drawn.push({path,rect:frame.assetFrame.sourceRect,vis:frame.assetFrame.visibleHeight,pivot:frame.assetFrame.pivot,x,y,h,alpha:opt?.alpha??1,flip:!!opt?.flip});return true;}
  var zoom=1;function project(x,y){return {x:100+(x-3)*10*zoom,y:200+(y-3)*5*zoom};}
  // 엔진 몸: 발밑 = project(e), 그림 672x384 전체 사각형. 대기 그림은 키 158.7(발 줄 322/384), 공격 그림은 132.6 으로 그려졌다(실측).
  function drawEnemy(e){const P=project(e.x,e.y);const path=e.__path||(e.attack?'${ATK}':'${IDLE}');const qh=zoom*(path.includes('attack')?132.6:path.includes('mb-last302')?94.5:path.includes('episode1b')?80:158.7);
   const iw=path.includes('mb-last302')?393:path.includes('episode1b')?418:672,ih=path.includes('mb-last302')?432:path.includes('episode1b')?418:384,qw=qh*iw/ih,footRow=path.includes('mb-last302')?406:path.includes('episode1b')?400:(path.includes('idle')?322:352);
   const top=P.y-qh*footRow/ih,L=P.x-qw/2;
   ctx.commands.push({kind:'image',key:'enemy:'+room.id+':'+e.nativeId+':0',order:7,owner:{kind:'enemy'},image:{src:'http://x/m0/'+path,naturalWidth:iw,naturalHeight:ih},imageSize:[iw,ih],sourcePath:path,sourceRect:[0,0,iw,ih],style:{globalAlpha:1},points:[[L,top],[L+qw,top],[L+qw,top+qh],[L,top+qh]]});
   ctx.commands.push({kind:'fill',owner:{kind:'enemy'},style:{fillStyle:'#f00'},paths:[{points:[[80,205],[120,205],[120,208],[80,208]]}]});
   ctx.commands.push({kind:'text',owner:{kind:'enemy'},text:e.name,point:[P.x,P.y-qh*.8],style:{}});}`,ctx);
 if(pre)vm.runInContext(pre,ctx);if(with620)vm.runInContext(src620,ctx);vm.runInContext(src,ctx);if(between)vm.runInContext(between,ctx); // between: 불러온 뒤·바깥 감싸기(setTimeout 0) 전에 끼는 덧씌우기
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
 ok(L2.every(f=>SH(f.b)==='atkB2'),'2nd attack → sheet-atkB2 (R764 r2 replaces r1)');ok(L2.every(f=>f.b.points[1][0]<f.b.points[0][0]),'hero on the left: sheet mirrored');}
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
// ── R762: 불면귀 효과음(ElevenLabs 생성, 그림 스레드가 다듬음 — assets/r761/sfx). 동작이 시작될 때 한 번씩 ──
const SND=c=>run(c,'__snd.slice()');
{// 프로필 등록(엔진이 setupAudio 로 프로필을 다시 만들어도 다시 얹음)
 const c=world();const P=run(c,'soundProfiles');ok(['Wrap','Gaze','Rain','Reveal'].every(k=>P['r761Boss'+k]?.length===2),'boss sfx profiles registered (2 variants each)');
 ok(P.r761BossWrap[0].path==='assets/r761/sfx/bmg-wrap-1.ogg'&&P.r761BossWrap[0].gain===.7&&P.r761BossRain[1].path==='assets/r761/sfx/bmg-rain-2.ogg','sfx paths and gains from index.json');
 ok(P.boss.length===1,'engine boss profile untouched');run(c,'setupAudio()');ok(run(c,'soundProfiles').r761BossReveal?.length===2,'re-registered after setupAudio');}
{// 공격이 시작될 때 한 번: 첫 공격 실 휘감기(atkA) → wrap, 다음 공격 눈빛(atkB) → gaze. 같은 공격 동안 다시 울리지 않음, 대기·걷기는 소리 없음
 const c=world({sheets:true}),e=boss();frames(c,e,.6,{step:(e)=>{e.x+=.03;}});ok(SND(c).length===0,'idle/walk: no boss cue');
 e.attack={elapsed:0,angle:0,shape154:{windup:.35}};frames(c,e,.9,{step:(e)=>{e.attack.elapsed+=1/30;}});ok(JSON.stringify(SND(c))==='["r761BossWrap"]','1st attack → one wrap cue ('+SND(c)+')');
 e.attack=null;frames(c,e,1.2);e.attack={elapsed:0,angle:0,shape154:{windup:.35}};frames(c,e,.5,{step:(e)=>{e.attack.elapsed+=1/30;}});ok(JSON.stringify(SND(c))==='["r761BossWrap","r761BossGaze"]','2nd attack → gaze ('+SND(c)+')');}
{// 시트를 끄거나 못 실려도 소리는 같은 순서(그림과 소리가 어긋나지 않게 같은 번갈이 상태를 씀)
 const c=world({sheets:false}),e=boss();e.attack={elapsed:0,angle:0,shape154:{windup:.35}};frames(c,e,.5,{step:(e)=>{e.attack.elapsed+=1/30;}});ok(JSON.stringify(SND(c))==='["r761BossWrap"]','no sheets: still one wrap cue');}
{// 너무 잦으면 건너뜀(1.2초 안 두 번째 공격은 조용히) — 듣기 거슬리지 않게
 const c=world({sheets:true}),e=boss();e.attack={elapsed:0,angle:0,shape154:{windup:.35}};frames(c,e,.3,{step:(e)=>{e.attack.elapsed+=1/30;}});e.attack={elapsed:0,angle:0,shape154:{windup:.35}};frames(c,e,.3,{step:(e)=>{e.attack.elapsed+=1/30;}});
 ok(SND(c).length===1,'two attacks within 0.6s → one cue ('+SND(c)+')');const sh=frames(c,e,.05)[0].b;ok(/sheet-atkB/.test(sh.sourcePath),'picture still alternates (atkB) even when the cue is skipped');}
{// 실비 → rain, 흩어짐 → reveal, 패턴 동안 한 번
 const c=world({sheets:true}),e=boss({__path:RAIN});frames(c,e,1.5);ok(JSON.stringify(SND(c))==='["r761BossRain"]','rain pattern → one rain cue ('+SND(c)+')');
 const TR=RAIN.replace('35526bcfa1c2_bulmyeongwi_rain','de4c1414da0d_bulmyeongwi_transition');const c2=world({sheets:true}),e2=boss({__path:TR});frames(c2,e2,1.5);ok(JSON.stringify(SND(c2))==='["r761BossReveal"]','transition → one reveal cue');}
{// 다른 적·중간보스·창이 떠 있을 때·끄기 → 소리 없음
 const cm=world({roomId:'last302'}),m=boss({nativeId:'mb-last302-v31231',name:'검은 안개 심장',boss:true,midboss:true,__path:MID});m.attack={elapsed:0,angle:0};frames(cm,m,.3);ok(SND(cm).length===0,'midboss: no cue');
 const cq=world(),eq=boss();run(cq,'modal={}');eq.attack={elapsed:0,angle:0,shape154:{windup:.35}};frames(cq,eq,.3,{step:(e)=>{e.attack.elapsed+=1/30;}});ok(SND(cq).length===0,'modal open: no cue');
 const cf=world({store:{'storyworld.r760.bulmyeongwi':'{"sfx":false}'}}),ef=boss();ef.attack={elapsed:0,angle:0,shape154:{windup:.35}};frames(cf,ef,.3,{step:(e)=>{e.attack.elapsed+=1/30;}});ok(SND(cf).length===0,'sfx off switch');
 const cn=world({audio:false}),en=boss();en.attack={elapsed:0,angle:0,shape154:{windup:.35}};frames(cn,en,.3,{step:(e)=>{e.attack.elapsed+=1/30;}});ok(API(cn).inspect().stats.errors===0,'no audio engine: no errors');}
// ── R764: 불면귀 보스 2페이즈 대기(idle2)·피격(hit4)·죽음(death10), 중간보스 '검은 안개 심장' 시트(대기6·공격8·피격4·죽음8) ──
const MIDP='assets/r104/bosses/mb-last302-v31231-p4.webp',MVIS=400,MENG=94.5*400/432; // 중간보스: 엔진 p4 보이는 키(400/432)
const mid=o=>boss({id:'M',nativeId:'mb-last302-v31231',name:'검은 안개 심장 · 불면의 기억',midboss:true,__path:MIDP,...o});
{// 보스 체력 절반 이하로 서 있으면 2페이즈 대기(실타래가 풀려 흐트러짐), 크기·발은 대기와 같다. 걷기는 move 그대로
 const c=world({sheets:true}),e=boss();frames(c,e,.4);const idleH=svis(frames(c,e,.05)[0].b);e.hp=500;const L=frames(c,e,1.2);const f=L[L.length-1];
 ok(L.every(x=>SH(x.b)==='idle2'),'hp 50% standing → sheet-idle2 ('+[...new Set(L.map(x=>SH(x.b)))]+')');ok(JSON.stringify(f.b.imageSize)==='[3072,512]','idle2 imageSize 3072x512');
 ok(new Set(L.map(x=>FR(x.b))).size>=5,'idle2 frames cycle');ok(Math.abs(svis(f.b)-idleH)<.5,'idle2 keeps the idle size');
 const fy=f.b.points[0][1]+H(f.b)*469.33/512;ok(Math.abs(fy-200)<.6,'idle2: foot on the ground');
 e.hp=501;ok(SH(frames(c,e,.1).pop().b)==='idle','hp just above 50% → idle');e.hp=400;ok(SH(frames(c,e,.8,{step:(e)=>{e.x+=.06;}}).pop().b)==='move','phase 2 walking → move');
 ok(/sheet-idle2\.webp$/.test(f.b.sourcePath)&&f.ghosts.length===3&&f.ghosts.every(g=>g.sourcePath===f.b.sourcePath),'phase 2: 3 afterimages share the idle2 frame');}
{// 보스 피격: 서 있을 때 맞으면 hit 4칸(움찔) 한 번, 1.5초 안 연타는 다시 움찔하지 않음(떨림 방지), 공격·패턴 중에는 공격 그림 유지
 const c=world({sheets:true}),e=boss();frames(c,e,.4);e.hitTimer=.2;const L=frames(c,e,.4,{step:(e)=>{e.hitTimer=Math.max(0,e.hitTimer-1/30);}});
 const hs=L.filter(x=>SH(x.b)==='hit').map(x=>FR(x.b));ok(hs.length>=4&&hs[0]===0&&hs.every((v,i)=>!i||v>=hs[i-1])&&hs[hs.length-1]===3,'hit → sheet-hit 0→3 ('+hs.join('')+')');
 ok(SH(L[L.length-1].b)==='idle','after the flinch → idle');ok(JSON.stringify(L.find(x=>SH(x.b)==='hit').b.imageSize)==='[2048,512]','hit imageSize 2048x512');
 e.hitTimer=.2;const L2=frames(c,e,.3,{step:(e)=>{e.hitTimer=Math.max(0,e.hitTimer-1/30);}});ok(L2.every(x=>SH(x.b)!=='hit'),'second hit within 1.5s → no new flinch');
 frames(c,e,1.5);e.hitTimer=.2;ok(SH(frames(c,e,.05)[0].b)==='hit','hit after 1.5s → flinch again');
 const cw=world({sheets:true}),ew=boss();frames(cw,ew,.8,{step:(e)=>{e.x+=.06;}});ew.hitTimer=.2;ok(SH(frames(cw,ew,.05,{step:(e)=>{e.x+=.06;}})[0].b)==='hit','hit while walking → flinch');
 const c2=world({sheets:true}),e2=boss({hitTimer:.3});e2.attack={elapsed:.1,angle:0,shape154:{windup:.35}};ok(frames(c2,e2,.2).every(x=>/^atk/.test(SH(x.b))),'hit during attack → attack frames kept');}
{// 중간보스: 엔진 4자세 대신 Dots 시트(512칸·발 (256,470)), 보이는 키는 지금 엔진 대기와 같게, 잔상 1겹이 같은 칸을 따라감
 const c=world({sheets:true,roomId:'last302'}),m=mid();const L=frames(c,m,1.2);const f=L[L.length-1];
 ok(L.every(x=>/assets\/r760\/mid\/sheet-idle\.webp$/.test(x.b.sourcePath)),'midboss idle → mid/sheet-idle ('+f.b.sourcePath+')');ok(JSON.stringify(f.b.imageSize)==='[3072,512]','mid idle imageSize');
 ok(new Set(L.map(x=>FR(x.b))).size>=5,'mid idle frames cycle');const fy=f.b.points[0][1]+H(f.b)*470/512,fx=f.b.points[0][0]+(f.b.points[1][0]-f.b.points[0][0])*.5;
 ok(Math.abs(fy-200)<.6&&Math.abs(fx-100)<.6,'mid: pivot on the ground point ('+fx.toFixed(2)+','+fy.toFixed(2)+')');
 ok(Math.abs(H(f.b)*MVIS/512/MENG-1)<.02,'mid: visible height = engine idle ('+(H(f.b)*MVIS/512/MENG).toFixed(3)+')');
 ok(f.ghosts.length===1&&f.ghosts[0].sourcePath===f.b.sourcePath&&String(f.ghosts[0].sourceRect)===String(f.b.sourceRect),'mid: one afterimage on the same frame');
 m.attack={elapsed:0,angle:0,shape154:{windup:.35}};const A=frames(c,m,1.0,{step:(e)=>{e.attack.elapsed+=1/30;}});const fr=A.map(x=>FR(x.b));
 ok(A.every(x=>/mid\/sheet-atk/.test(x.b.sourcePath))&&fr[0]===0&&fr[fr.length-1]===7&&fr.every((v,i)=>!i||v>=fr[i-1]),'mid attack → mid/sheet-atk 0→7 ('+fr.join('')+')');
 ok(A.every(x=>Math.abs(H(x.b)-H(f.b))<.5),'mid attack keeps the idle size');m.attack=null;
 frames(c,m,.3);m.hitTimer=.2;ok(/mid\/sheet-hit/.test(frames(c,m,.05)[0].b.sourcePath),'mid hit → mid/sheet-hit');m.hitTimer=0;
 run(c,'player.x=0');ok(frames(c,m,.05)[0].b.points[1][0]<frames(c,m,.05)[0].b.points[0][0],'mid: hero on the left → mirrored');
 // 회귀(헤드리스 실측): 엔진·덧씌우기가 중간보스 몸을 안쪽에서 그린 뒤 바깥에서 다시 키운다(안쪽 키 44~57px, 최종 94.5px) → 시트는 최종 몸 크기 기준으로, 바깥에서.
 //  안쪽에서 바꾸면 죽음 크기(안쪽 기준)와 살아 있을 때 크기(바깥에서 키운 것)가 두 배 넘게 어긋났다.
 const cz=world({sheets:true,roomId:'last302',between:`const de0=drawEnemy;drawEnemy=function(e,...a){const s0=ctx.commands.length;const r=de0.call(this,e,...a);for(let i=s0;i<ctx.commands.length;i++){const k=ctx.commands[i];if(k.kind==='image'&&!k.r760Ghost){const P=k.points,fy=P[2][1];k.points=P.map(q=>[q[0],fy+(q[1]-fy)*2]);}}return r;};`});
 const mz=mid();frames(cz,mz,.5);const fz=frames(cz,mz,.05)[0];ok(Math.abs(H(fz.b)*MVIS/512/(MENG*2)-1)<.03,'mid: sized from the engine body as finally drawn ('+(H(fz.b)*MVIS/512/(MENG*2)).toFixed(3)+')');
 mz.hp=0;cz.spawnBurnDeath3(mz);const fxz=run(cz,'effects')[0];fxz.age=.2;cz.drawBurnDeath3(fxz);const dz=run(cz,'__drawn').pop();ok(Math.abs(dz.h-H(fz.b)*MVIS/512)<1,'mid death: same visible height as the last alive frame ('+dz.h.toFixed(1)+' vs '+(H(fz.b)*MVIS/512).toFixed(1)+')');
 // 회귀(헤드리스 실측): R205 최소 크기 맞춤은 바깥 감싸기보다도 늦게 감싸 몸을 키운다 → 죽음 크기도 그 최종 크기로
 const cl=world({sheets:true,roomId:'last302'});run(cl,`const de1=drawEnemy;drawEnemy=function(e,...a){const s0=ctx.commands.length;const r=de1.call(this,e,...a);for(let i=s0;i<ctx.commands.length;i++){const k=ctx.commands[i];if(k.kind==='image'){const P=k.points,fy=P[2][1],fx=(P[2][0]+P[3][0])/2;k.points=P.map(q=>[fx+(q[0]-fx)*2.1,fy+(q[1]-fy)*2.1]);}}return r;};`);
 const ml=mid();frames(cl,ml,.5);const fl=frames(cl,ml,.05)[0];ml.hp=0;cl.spawnBurnDeath3(ml);const fxl=run(cl,'effects')[0];fxl.age=.2;cl.drawBurnDeath3(fxl);const dl=run(cl,'__drawn').pop();
 ok(Math.abs(dl.h-H(fl.b)*MVIS/512)<1,'mid death after a later outer resize: same visible height as alive ('+dl.h.toFixed(1)+' vs '+(H(fl.b)*MVIS/512).toFixed(1)+')');
 const cg=world({sheets:true,roomId:'last302',with620:true}),mg=mid();frames(cg,mg,.5);const G=frames(cg,mg,.5,{step:(e,t)=>{e.__path=t<.25?MIDP:MIDP.replace('-p4','-p2');}});
 ok(G.every(f=>f.cm.every(k=>!/mb-last302-v31231-p/.test(k.sourcePath||''))),'mid with R620: no engine pose (or its cross-fade ghost) left on screen');
 const c3=world({sheets:false,roomId:'last302'}),m3=mid();ok(frames(c3,m3,.2).pop().b.sourcePath===MIDP,'mid sheet not ready → engine pose kept');}
{// 죽음: 보스는 death10(실타래가 풀려 흩어짐) 0→8칸, 중간보스는 death8 0→6칸(빈 마지막 칸은 안 씀), 엔진 불꽃 대신, 끝에서만 옅어짐. 크기는 살아 있을 때와 같다
 const c=world({sheets:true}),e=boss();frames(c,e,.5);const vis=svis(frames(c,e,.05)[0].b);e.hp=0;c.spawnBurnDeath3(e);const fx=run(c,'effects')[0];
 ok(fx.r764?.who==='boss'&&fx.life>=1.8,'boss death fx tagged and lengthened ('+fx.life+')');const seq=[];
 for(let a=0;a<fx.life;a+=.05){fx.age=a;run(c,'__drawn.length=0');c.drawBurnDeath3(fx);seq.push(run(c,'__drawn')[0]);}
 ok(run(c,'__base').length===0,'engine burn not drawn for the boss');ok(seq.every(d=>/boss\/sheet-death\.webp$/.test(d.path)),'boss death sheet');
 const fs2=seq.map(d=>d.rect[0]/512);ok(fs2[0]===0&&fs2.every((v,i)=>!i||v>=fs2[i-1])&&Math.max(...fs2)===8,'boss death frames 0→8, never the empty 9 ('+fs2.join('')+')');
 ok(seq[5].alpha===1&&seq[seq.length-1].alpha<.3,'fades only at the end');ok(Math.abs(seq[0].h-vis)<.6&&seq[0].vis===383&&seq[0].x===100&&seq[0].y===200,'same visible size and spot as alive ('+seq[0].h.toFixed(1)+' vs '+vis.toFixed(1)+')');
 const cm=world({sheets:true,roomId:'last302'}),m=mid();frames(cm,m,.5);const mv=H(frames(cm,m,.05)[0].b)*MVIS/512;m.hp=0;cm.spawnBurnDeath3(m);const mf=run(cm,'effects')[0];const ms=[];
 for(let a=0;a<mf.life;a+=.05){mf.age=a;run(cm,'__drawn.length=0');cm.drawBurnDeath3(mf);ms.push(run(cm,'__drawn')[0]);}
 const mfs=ms.map(d=>d.rect[0]/512);ok(ms.every(d=>/mid\/sheet-death/.test(d.path))&&mfs[0]===0&&Math.max(...mfs)===6&&mfs.every((v,i)=>!i||v>=mfs[i-1]),'mid death frames 0→6 ('+mfs.join('')+')');
 ok(Math.abs(ms[0].h-mv)<.6&&ms[0].vis===MVIS,'mid death: same visible size');
 const co=world({sheets:true}),o=boss({id:'X',nativeId:'l303-e2',name:'다른 적',boss:false});o.hp=0;co.spawnBurnDeath3(o);co.drawBurnDeath3(run(co,'effects')[0]);ok(run(co,'__base').length===1,'other enemies: engine death unchanged');
 const cn=world({sheets:false}),en=boss();frames(cn,en,.3);en.hp=0;cn.spawnBurnDeath3(en);cn.drawBurnDeath3(run(cn,'effects')[0]);ok(run(cn,'__base').length===1,'death sheet not ready → engine death');
 ok(API(c).inspect().stats.errors===0&&API(cm).inspect().stats.errors===0,'no errors');}
{// 미리 불러오기: 보스 구역은 새 보스 시트, 중간보스 구역은 중간보스 시트
 const c=world({sheets:false}),e=boss();frames(c,e,.05);ok(['idle2','hit','death'].every(k=>run(c,'__added').some(p=>p.endsWith('boss/sheet-'+k+'.webp'))),'boss phase2/hit/death sheets requested');
 ok(['idle','atk','hit','death'].every(k=>run(c,'__added').some(p=>p.endsWith('mid/sheet-'+k+'.webp'))),'mid sheets requested');}
{// R764 넷째 묶음: 눈빛 공격은 예비 동작이 생긴 atkB8_r2(sheet-atkB2) — 준비 동안 0→4칸(1~3 움츠림·4 쏠림), 준비 끝에 5번째 칸(4)이 시선 발사, 뒤로 7칸까지
 const c=world({sheets:true}),e=boss();e.attack={elapsed:0,angle:0,shape154:{windup:.35}};frames(c,e,.3,{step:(e)=>{e.attack.elapsed+=1/30;}});e.attack=null;frames(c,e,1.3);
 e.attack={elapsed:0,angle:0,shape154:{windup:.5}};const L=frames(c,e,1.2,{step:(e)=>{e.attack.elapsed+=1/30;}});const fr=L.map(f=>FR(f.b));
 ok(L.every(f=>/sheet-atkB2\.webp$/.test(f.b.sourcePath)),'2nd attack → sheet-atkB2 (r2 with anticipation)');
 const iw=Math.round(.5*30);ok(fr[0]===0&&fr.every((v,i)=>!i||v>=fr[i-1])&&fr[iw-2]<=3&&fr[iw+1]===4&&fr[fr.length-1]===7,'atkB2: windup 0..3, gaze 4 at windup end, back to 7 ('+fr.join('')+')');
 const ca=world({sheets:true}),ea=boss();ea.attack={elapsed:0,angle:0,shape154:{windup:.5}};const A=frames(ca,ea,.6,{step:(e)=>{e.attack.elapsed+=1/30;}}).map(f=>FR(f.b));ok(A[16]===3,'atkA keeps strike frame 3 at windup end ('+A.join('')+')');}
{// 회귀(헤드리스 실측): 엔진은 보스가 맞으면 공격 그림을 준다(피격 그림이 없음) → 공격이 아닌데 공격 칸·공격 소리(wrap/gaze)가 나왔다. 맞은 동안 공격 그림은 피격으로
 const c=world({sheets:true}),e=boss();frames(c,e,.4);e.__path=ATK;e.state='idle';e.hitTimer=.2;const L=frames(c,e,.3,{step:(e)=>{e.hitTimer=Math.max(0,e.hitTimer-1/30);if(!(e.hitTimer>0))e.__path=null;}});
 ok(L.slice(0,4).every(f=>SH(f.b)==='hit'),'engine attack art while hit (no attack) → hit sheet ('+L.slice(0,4).map(f=>SH(f.b))+')');ok(SND(c).length===0,'no attack cue on a hit ('+SND(c)+')');
 e.__path=null;e.attack={elapsed:0,angle:0,shape154:{windup:.35}};const A=frames(c,e,.2,{step:(e)=>{e.attack.elapsed+=1/30;}});ok(SH(A[0].b)==='atkA'&&JSON.stringify(SND(c))==='["r761BossWrap"]','next real attack is still the first (atkA + wrap)');}
{// 2단계 피격: 체력 절반 이하에서 맞으면 hit2nd4(핵 빛이 번쩍), 위면 hit
 const c=world({sheets:true}),e=boss({hp:400});frames(c,e,.4);e.hitTimer=.2;const L=frames(c,e,.3,{step:(e)=>{e.hitTimer=Math.max(0,e.hitTimer-1/30);}});
 ok(L.slice(0,3).every(f=>/sheet-hit2\.webp$/.test(f.b.sourcePath)),'phase 2 hit → sheet-hit2 ('+L[0].b.sourcePath+')');}
// ── R763: 불면귀에 잠식된 주민(Dots CX-0070BM vil1 어부·vil2 약방 아낙, 256칸·발 (128,234.67)·오른쪽 봄) — last302·last303 일반몹 그림·이름 교체 ──
function vworld({roomId='last302',store={},ready=true}={}){const timers=[];const c={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,Symbol,isFinite,RegExp,Promise,performance:{now:()=>0},
  setTimeout:(f)=>{timers.push(f);return timers.length;},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};c.window=c;vm.createContext(c);
 vm.runInContext(`var time=0,room={id:${JSON.stringify(roomId)},enemies:[]},player={x:6,y:3,hero:'hwando'},ctx={commands:[],__ops:[],save(){this.__ops.push(['s'])},restore(){this.__ops.push(['x'])},translate(x,y){this.__ops.push(['t',x,y])},rotate(r){this.__ops.push(['r',r])},drawImage(im,...a){this.__ops.push(['d',...a])}},modal=null,zoom=1,W=1280,H=720,__proj=[],projectiles=[],effects=[],__ready=${ready},__ens=[],__snd=[],__drawn=[],__base=[];
  var soundProfiles={};function sound(k){__snd.push(k);}function setupAudio(){}
  function drawProjectile(b){__proj.push(b.id);}
  function readyImage(p){if((String(p).includes('assets/r763/')||String(p).includes('assets/r769/')||String(p).includes('assets/r770/'))&&!__ready)return null;if(/herbwife-proj6/.test(p))return {ready:true,image:{naturalWidth:768,naturalHeight:128}};const n=/-(walk|atk|death|float)\\./.test(p)?8:/-hit\\./.test(p)?4:6;return {ready:true,image:{naturalWidth:n*256,naturalHeight:256}};}
  function ensureImages(ps){__ens.push(...ps);return Promise.resolve();}
  function project(x,y){return {x:100+(x-3)*10,y:200+(y-3)*5};}
  function drawAssetFrame3(path,frame,x,y,h,opt){__drawn.push({path,rect:frame.assetFrame.sourceRect,x,y,h,alpha:opt?.alpha??1,flip:!!opt?.flip});return true;}
  function spawnBurnDeath3(e){effects.push({type:'enemyBurnDeath',x:e.x,y:e.y,age:0,life:.72,sourceId:e.id,bodyHeight:60});return true;}
  function drawBurnDeath3(f){__base.push(f.sourceId);}
  function makeRoom(id,l){return {id,enemies:[{id:id+':l302-e3:1',nativeId:'l302-e3',name:'귀비탕 공명 안개핵 1',hp:5},{id:id+':l302-e1:2',nativeId:'l302-e1',name:'포구 검은 안개 증원 2',hp:5},{id:id+':b',nativeId:'l303-boss',name:'불면귀',boss:true,hp:5}]};}
  function hitEnemy(e){sound('enemyHit');}function killEnemy(e){e.hp=0;spawnBurnDeath3(e);sound('r541Death');}
  window.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({frameFor(e,f){return {path:'old/'+e.nativeId+'.webp',assetFrame:{sourceRect:[0,0,10,10],pivot:[5,10],visibleHeight:10}};}});`,c);
 vm.runInContext(src,c);for(let i=0;i<40&&timers.length;i++)timers.shift()();return c;}
const mob=(o)=>({id:'last302:l302-e3:3',nativeId:'l302-e3',name:'귀비탕 공명 안개핵 3',x:3,y:3,hp:100,maxHp:100,hitTimer:0,moving:false,attack:null,...o});
const FF=(c,e)=>c.__STORYWORLD_STORY_COMBAT_R54__.frameFor(e,null);const VAPI=c=>c.__STORYWORLD_VILLAGERS_R763__;
{// 배정·이름: l302-e3(근거리) → 어부, l302-e1(거리 둠) → 약방 아낙. 꼬리(번호·우두머리·중간보스 접두)는 그대로, 효과 키는 옛 이름
 const c=vworld(),a=mob(),b=mob({id:'last302:l302-e1:7',nativeId:'l302-e1',name:'포구 검은 안개 우두머리 7'}),w=mob({id:'w',nativeId:'l302-e1',name:'중간보스 · 포구 검은 안개',wardChampionR81:true}),g=mob({id:'g',nativeId:'l302-e1',name:'유리 망령 2',r74Monster:'glass'});
 const fa=FF(c,a),fb=FF(c,b);FF(c,w);FF(c,g);ok(/assets\/r763\/villagers\/fisher-idle\.webp$/.test(fa.path),'l302-e3 → fisher ('+fa.path+')');ok(/herbwife-idle\.webp$/.test(fb.path),'l302-e1 → herbwife');
 ok(a.name==='잠식된 어부 3'&&b.name==='잠식된 약방 아낙 우두머리 7'&&w.name==='중간보스 · 잠식된 약방 아낙'&&g.name==='잠식된 약방 아낙 2','renamed with suffix/prefix kept ('+[a.name,b.name,w.name,g.name].join(' / ')+')');
 ok(a.r248Key==='귀비탕 공명 안개핵'&&b.r248Key==='포구 검은 안개 우두머리','effect key keeps the old name ('+a.r248Key+' / '+b.r248Key+')');
 ok(fa.assetFrame.sourceRect[0]%256===0&&JSON.stringify(fa.assetFrame.sourceRect.slice(1))==='[0,256,256]'&&JSON.stringify(fa.assetFrame.pivot)==='[128,234.67]'&&fa.assetFrame.visibleHeight>200&&fa.assetFrame.visibleHeight<215,'frame: 256 cell, foot pivot, visible ~208');
 FF(c,a);ok(a.name==='잠식된 어부 3','renamed once');}
{// 지역·대상 밖은 그대로: 보스·중간보스(mb-)·안개 잔영·다른 지역
 const c=vworld({roomId:'last303'}),bo=mob({nativeId:'l303-boss',name:'불면귀',boss:true}),sh=mob({nativeId:'l302-e1',name:'불면귀의 안개 잔영'}),md=mob({nativeId:'mb-last302-v31231',name:'검은 안개 심장 · 불면의 기억',midboss:true});
 ok([bo,sh,md].every(e=>/^old\//.test(FF(c,e).path)),'boss / boss shade / midboss untouched');ok(sh.name==='불면귀의 안개 잔영','boss shade name untouched');
 const co=vworld({roomId:'last301'}),o=mob();ok(/^old\//.test(FF(co,o).path)&&o.name==='귀비탕 공명 안개핵 3','other region untouched');
 const cf=vworld({store:{'storyworld.r763.villagers':'{"on":false}'}}),of=mob();ok(/^old\//.test(FF(cf,of).path)&&of.name==='귀비탕 공명 안개핵 3','off switch: untouched');}
{// last303 은 모두 l302-e1 → 번호로 어부·아낙을 나눔(남녀·근원거리 섞임)
 const c=vworld({roomId:'last303'});const ks=[...Array(10)].map((_,i)=>{const e=mob({id:'last303:l302-e1:'+i,nativeId:'l302-e1',name:'주민에게서 떨어진 검은 안개 '+i});FF(c,e);return e.name.startsWith('잠식된 어부')?'F':e.name.startsWith('잠식된 소복')?'S':'H';}).join('');
 ok(ks==='HFSHFSHFSH','last303 split herbwife/fisher/sobok by number ('+ks+')');}
{// 동작: 대기 6칸 돌고, 걷기 8칸, 공격은 준비 0→2(갈고리 치켜듦)·타격 3·뒤 4→7, 피격(어부) hit 시트, 왼쪽이면 뒤집기
 const c=vworld(),e=mob();const fr=[];for(let i=0;i<30;i++){vm.runInContext('time+=1/15',c);fr.push(FF(c,e).assetFrame.sourceRect[0]/256);}ok(new Set(fr).size>=5,'idle cycles ('+[...new Set(fr)].join('')+')');
 e.moving=true;const fw=FF(c,e);ok(/fisher-walk/.test(fw.path),'moving → walk');
 // 분석 스레드 실측: 어부 걷기 8번 칸이 1번 칸과 같은 넓은 걸음이라 돌 때마다 멈칫 → 0..6,3 순서(8번 칸 자리에 4번 칸)
 const wk=[];for(let i=0;i<40;i++){vm.runInContext('time+=1/10',c);wk.push(FF(c,e).assetFrame.sourceRect[0]/256);}ok(!wk.includes(7)&&new Set(wk).size===7,'fisher walk skips the duplicate wide step 7 ('+wk.join('')+')');
 const hw=mob({id:'hw',nativeId:'l302-e1',name:'포구 검은 안개 9',moving:true});const hk=[];for(let i=0;i<40;i++){vm.runInContext('time+=1/10',c);hk.push(FF(c,hw).assetFrame.sourceRect[0]/256);}ok(hk.includes(7),'herbwife walk uses all 8 frames');e.moving=false;
 e.attack={elapsed:0,shape154:{windup:.6,active:.15,recovery:.6}};const at=[];for(let t=0;t<1.35;t+=.05){e.attack.elapsed=t;const f=FF(c,e);ok(/fisher-atk/.test(f.path),'attack sheet');at.push(f.assetFrame.sourceRect[0]/256);}
 ok(at[0]===0&&at.every((v,i)=>!i||v>=at[i-1])&&at[11]<=2&&at[13]===3&&at[at.length-1]===7,'attack frames: windup 0..2, strike 3, recover to 7 ('+at.join('')+')');e.attack=null;
 e.hitTimer=.14;const h=FF(c,e);ok(/fisher-hit/.test(h.path),'hit → fisher hit sheet');e.hitTimer=0;
 const b=mob({id:'b1',nativeId:'l302-e1',name:'포구 검은 안개 1',hitTimer:.14});{const hs=[];for(let i=0;i<5;i++){const q=FF(c,b);hs.push(q);vm.runInContext('time+=1/16',c);}ok(hs.every(q=>/assets\/r770\/villagers\/herbwife-hit\.webp$/.test(q.path)),'R770 herbwife hit → Dots hit4 sheet ('+hs[0].path+')');const hf=hs.map(q=>q.assetFrame.sourceRect[0]/256);ok(hf.join('')==='01233','R770 herbwife hit 16fps 0→3 then hold ('+hf.join('')+')');}
 vm.runInContext('player.x=0',c);ok(FF(c,e).flip===true,'hero on the left → flipped');vm.runInContext('player.x=9',c);ok(FF(c,e).flip===false,'hero on the right → not flipped');}
{// 그림이 아직 안 실렸으면 옛 그림 + 불러오기 요청(빈 화면 없음). 지역에 들어오면 8장 모두 한 번 청함
 const c=vworld({ready:false}),e=mob();ok(/^old\//.test(FF(c,e).path),'not loaded: old art kept');const ens=vm.runInContext('__ens',c);ok(['fisher-idle','fisher-walk','fisher-atk','fisher-hit','fisher-death','herbwife-idle','herbwife-walk','herbwife-atk','herbwife-hit','herbwife-death'].every(k=>ens.some(p=>p.endsWith(k+'.webp'))),'all villager sheets requested');}
{// 죽음: 어부는 death8 로 쓰러져 잠듦(R462 불·피 연출 대신), 아낙은 대기 그림이 가라앉으며 사라짐. 잠드는 소리, 피격 신음
 const c=vworld(),e=mob(),b=mob({id:'b2',nativeId:'l302-e1',name:'포구 검은 안개 2',x:5});FF(c,e);FF(c,b);
 c.hitEnemy(e);ok(JSON.stringify(vm.runInContext('__snd',c))==='["r761VillagerGroan"]','hit villager → groan ('+vm.runInContext('__snd',c)+')');
 c.killEnemy(e);ok(vm.runInContext('__snd',c).slice(-1)[0]==='r761VillagerSleep','death → sleep sound');
 const fx=vm.runInContext('effects',c)[0];ok(fx.r763?.k==='fisher'&&fx.life>=2,'death fx tagged and lengthened ('+fx.life+')');ok(fx.r462===null,'R770 villager death opts out of R462 burn/shatter (fx.r462 null → R462 adopt hands it back)');
 const seq=[];for(let a=0;a<fx.life;a+=.1){fx.age=a;vm.runInContext('__drawn.length=0',c);c.drawBurnDeath3(fx);const d=vm.runInContext('__drawn',c)[0];seq.push(d);}
 ok(vm.runInContext('__base',c).length===0,'R462/engine burn not drawn for villagers');ok(seq.every(d=>/fisher-death/.test(d.path)),'fisher death sheet');
 const fs=seq.map(d=>d.rect[0]/256);ok(fs[0]===0&&fs.every((v,i)=>!i||v>=fs[i-1])&&fs[fs.length-1]===7,'death frames 0→7 then hold ('+fs.join('')+')');ok(seq[seq.length-1].alpha<.35&&seq[3].alpha===1,'fades only at the end');
 ok(Math.abs(seq[0].h-60)<1e-9&&seq[0].x===100&&seq[0].y===200,'drawn at the death spot with the engine body height');
 c.killEnemy(b);const fb=vm.runInContext('effects',c)[1];ok(fb.life>=2,'R770 herbwife death lengthened ('+fb.life+')');const sb=[];for(let a=0;a<fb.life;a+=.05){fb.age=a;vm.runInContext('__drawn.length=0',c);c.drawBurnDeath3(fb);sb.push(vm.runInContext('__drawn',c)[0]);}
 ok(sb.every(d=>/assets\/r770\/villagers\/herbwife-death\.webp$/.test(d.path)),'R770 herbwife death8 sheet');const bf=sb.map(d=>d.rect[0]/256);ok(bf[0]===0&&bf.every((v,i)=>!i||v>=bf[i-1])&&bf.indexOf(7)===14&&bf[bf.length-1]===7,'R770 herbwife death 10fps 0→7, no loop ('+bf.join('')+')');ok(sb[10].alpha===1&&sb[sb.length-1].alpha<.35&&sb.every(d=>d.h===60),'R770 herbwife death fades only at the end, no sinking');
 {const cw=vworld(),w=mob({id:'w9',nativeId:'l302-e1',name:'포구 검은 안개 9'});FF(cw,w);vm.runInContext("var __rd=readyImage;readyImage=function(p){return /herbwife-death/.test(p)?null:__rd(p);}",cw);cw.killEnemy(w);const fw=vm.runInContext('effects',cw).slice(-1)[0];fw.age=.5;vm.runInContext('__drawn.length=0;__ens.length=0',cw);cw.drawBurnDeath3(fw);const dw=vm.runInContext('__drawn',cw)[0];
  ok(dw&&/herbwife-idle/.test(dw.path)&&dw.alpha<1,'R770 herbwife death sheet not loaded yet → idle frame sinks (no empty spot)');ok(vm.runInContext('__ens',cw).some(p=>/herbwife-death/.test(p)),'R770 and the death sheet is requested');}
 const c2=vworld({roomId:'last301'}),o=mob();c2.killEnemy(o);c2.drawBurnDeath3(vm.runInContext('effects',c2)[0]);ok(vm.runInContext('__base',c2).length===1&&vm.runInContext('__snd',c2)[0]==='r541Death','other mobs: engine death + sound unchanged');
 ok(VAPI(c).inspect().stats.errors===0,'no errors');ok(vm.runInContext('soundProfiles',c).r761VillagerSleep?.length===2&&vm.runInContext('soundProfiles',c).r761VillagerGroan[0].path==='assets/r761/sfx/bmg-groan-1.ogg','villager sfx profiles');}
{// 지역을 만들 때 모든 일반몹 이름을 바로 바꿈(아직 화면에 안 그려진 몹·숨은 증원 포함 — 이름표·목록이 섞이지 않게). 꿈 층·다른 지역은 그대로
 const c=vworld({roomId:'dist01'});const r=c.makeRoom('last302','STORY');ok(r.enemies[0].name==='잠식된 어부 1'&&r.enemies[1].name==='잠식된 약방 아낙 증원 2'&&r.enemies[2].name==='불면귀','renamed at room creation ('+r.enemies.map(e=>e.name).join(' / ')+')');
 ok(c.makeRoom('last302','DREAM').enemies[0].name==='귀비탕 공명 안개핵 1'&&c.makeRoom('last301','STORY').enemies[0].name==='귀비탕 공명 안개핵 1','dream layer / other zone untouched');
 vm.runInContext('room=null',c);ok(c.window.__STORYWORLD_VILLAGERS_R763__.kindFor(r.enemies[0],'last302')==='fisher','kindFor with explicit zone');}
{// 회귀(헤드리스 실측): R74 순찰은 지역을 만든 뒤에 '유리 망령'으로 이름이 바뀐다 → 아니라고 기억한 몹도 이름이 바뀌면 다시 본다
 const c=vworld(),e=mob({id:'last302:r74-patrol:1',nativeId:'l302-e3',name:'순찰 1'});ok(c.window.__STORYWORLD_VILLAGERS_R763__.kindFor(e)===null,'unknown name: not a villager');e.name='유리 망령 우두머리';
 ok(/fisher/.test(FF(c,e).path)&&e.name==='잠식된 어부 우두머리','renamed patrol picked up later ('+e.name+')');}
{// 회귀(헤드리스 실측): R74 순찰(r74Monster 'glass')은 지도 괴물 그림으로 그려지고 이름이 되돌아갔다 → 표시를 떼고(r763Atlas 에 기억) 이름이 되돌아가도 다시 바꿈
 const c=vworld(),e=mob({id:'last302:r74-patrol:2',nativeId:'l302-e1',name:'유리 망령',r74Monster:'glass'});FF(c,e);ok(e.r74Monster===undefined&&e.r763Atlas==='glass'&&e.name==='잠식된 약방 아낙','r74 patrol: atlas mark removed, renamed');
 e.name='유리 망령';e.r74Monster='glass';FF(c,e);ok(e.name==='잠식된 약방 아낙'&&e.r763From==='유리 망령'&&e.r74Monster===undefined,'R191 re-applied glass patrol → renamed and detached again');}
{// 회귀(헤드리스 실측): R248 픽셀몹 시트 표가 옛 이름 키(r248Key)로 주민 위에 옛 안개·유리 망령 그림을 덮어 그렸다 → R248 이 주민이면 비켜 줌
 const r248=fs.readFileSync(path.join(R,'client-source','mob-unique-r248.js'),'utf8');ok(r248.includes('if(s&&window.__STORYWORLD_VILLAGERS_R763__?.kindFor?.(e))s=null;'),'R248 yields to R763 villagers');}
{// R768(사용자 2026-11-11 "불면귀 일반몹들이 예고공격 자동으로 나오는거 이거 끌 수 있도록"):
 // 헤드리스 실측 — 불면귀(last302) 일반몹 원거리 준비 때 R58 이 drawEnemy 안에서 strokeFootprint154(capsule 7.4칸, 'warning', '#c6b59b') 조준 띠를 그렸고,
 // R425 '적 공격·돌진 예고 표시'(기본 꺼짐)가 이 선은 못 거른다 → 불면귀 지역 일반몹의 'warning' 띠만 그 설정을 따르게.
 const PRE=(tele,coop='off')=>`var __sf=[],__tele=${tele};window.__STORYWORLD_COMBAT_FLOW_R425__=${tele===null?'undefined':'{inspect:()=>({prefs:{tele:__tele}})}'};window.__STORYWORLD_COOP_SIM_R62__={mode:()=>${JSON.stringify(coop)}};
  function strokeFootprint154(g,stage,color){__sf.push(stage+'|'+(color||''));return true;}
  const r58=drawEnemy;drawEnemy=function(e,...a){const r=r58.call(this,e,...a);if(e.__boom)throw new Error('boom');if(e.rangedWindup>0)strokeFootprint154({shape:'capsule'},'warning','#c6b59b');if(e.__active)strokeFootprint154({shape:'capsule'},'active','#c6b59b');return r;};`;
 const W=(o,e)=>{const c=world({sheets:true,...o});run(c,'__sf.length=0');c.drawEnemy(e);return run(c,'__sf.slice()');};
 const mob=(o={})=>({id:'last302:m1',nativeId:'l302-e1',name:'잠식된 약방 아낙',x:5,y:3,hp:30,maxHp:30,rangedWindup:.4,__path:MOB,...o});
 ok(W({roomId:'last302',pre:PRE(false)},mob()).length===0,'R768 불면귀 normal mob ranged windup, tele off → no warning lane');
 ok(W({roomId:'last303',pre:PRE(false)},mob({nativeId:'l303-e2'})).length===0,'R768 last303 normal mob → hidden too');
 ok(W({roomId:'last302',pre:PRE(true)},mob()).join()==='warning|#c6b59b','R768 tele on (setting checked) → lane drawn');
 ok(W({roomId:'last302',pre:PRE(false)},mob({__active:true})).join()==='active|#c6b59b','R768 only the warning stage is hidden (active kept)');
 ok(W({roomId:'last303',pre:PRE(false)},boss({rangedWindup:.4})).join()==='warning|#c6b59b','R768 boss warning kept');
 ok(W({roomId:'last302',pre:PRE(false)},mob({midboss:true,nativeId:'mb-last302',__path:MID})).join()==='warning|#c6b59b','R768 midboss warning kept');
 ok(W({roomId:'ep1a01',pre:PRE(false)},mob()).join()==='warning|#c6b59b','R768 other zones untouched');
 ok(W({roomId:'last302',pre:PRE(null)},mob()).join()==='warning|#c6b59b','R768 R425 missing → nothing hidden');
 ok(W({roomId:'last302',pre:PRE(false,'local')},mob()).join()==='warning|#c6b59b','R768 co-op (not solo) → kept like R425');
 {const c=world({sheets:true,roomId:'last302',pre:PRE(false)});run(c,'__sf.length=0;strokeFootprint154({shape:"circle"},"warning","#e4c6ea")');ok(run(c,'__sf.join()')==='warning|#e4c6ea','R768 hazard warning outside drawEnemy kept');
  try{c.drawEnemy(mob({__boom:true}));}catch(_){}run(c,'__sf.length=0;strokeFootprint154({shape:"circle"},"warning","#e4c6ea")');ok(run(c,'__sf.length')===1,'R768 scope resets after a throwing drawEnemy');
  const I=c.__STORYWORLD_TELE_R768__;ok(I&&I.inspect().stats.hidden>=0&&I.inspect().wrapped===true,'R768 inspect exposed');}
 {const c=world({sheets:true,roomId:'last302',pre:PRE(false)});run(c,'__sf.length=0');const e=mob();c.drawEnemy(e);c.drawEnemy(e);ok(run(c,'__sf.length')===0&&c.__STORYWORLD_TELE_R768__.inspect().stats.hidden===2,'R768 counts hidden lanes');}
}
{// R769→R770: 소복 처녀(vil3)는 Dots 부유 이동 float8(사용자 검수: 걷기 대신 부유, 120ms)과 같은 인물 r1 대기6·공격8. 부유 그림은 발끝이 바닥에서 떠 있음(y316~332/352)
 //  → 대기·공격도 같은 높이로 띄우고 같은 박자(0.96초)로 오르내린다(움직였다 멈출 때 툭 떨어지지 않게). 피격 시트는 없어 대기 첫 칸, 죽음은 대기 첫 칸이 가라앉음.
 const c=vworld(),s=mob({id:'last302:r75-pack:10',name:'귀비탕 공명 안개핵 5'}),f=mob({id:'last302:r75-pack:13',name:'귀비탕 공명 안개핵 4'});const fs=FF(c,s),ff=FF(c,f);
 ok(/assets\/r770\/villagers\/sobok-idle\.webp$/.test(fs.path)&&s.name==='잠식된 소복 처녀 5','R769 l302-e3 even slot → sobok ('+fs.path+' / '+s.name+')');ok(/fisher-/.test(ff.path),'R769 other l302-e3 stay fisher');
 {const real=[1,4,10,13,16,19,22,25,28].map(n=>{const m=mob({id:'last302:r75-pack:'+n,name:'귀비탕 공명 안개핵'});return /sobok/.test(FF(c,m).path)?'S':'F';}).join('');ok(/S/.test(real)&&/F/.test(real)&&!/SSS|FFF/.test(real),'R769 real last302 l302-e3 slots (step 3) mix fisher/sobok ('+real+')');}
 ok(fs.assetFrame.visibleHeight===193&&fs.assetFrame.pivot[0]===128,'R770 sobok frame: visible 193 (r1 idle body)');
 const idle=[],lift=[];for(let i=0;i<20;i++){vm.runInContext('time+=.1',c);const q=FF(c,s);idle.push(q.assetFrame.sourceRect[0]/256);lift.push(q.assetFrame.pivot[1]-234.67);ok(/sobok-idle/.test(q.path),'R770 sobok idle sheet');
  ok(Math.abs(q.normalizedFullRectangleExtents[1]+q.assetFrame.pivot[1]/193)<1e-9,'R770 extents follow the lifted pivot');}
 ok(new Set(idle).size===6,'R770 sobok idle uses 6 frames ('+idle.join('')+')');ok(Math.min(...lift)>=10&&Math.max(...lift)<=26&&Math.max(...lift)-Math.min(...lift)>=6,'R770 sobok idle hovers like the float sheet ('+Math.min(...lift).toFixed(1)+'~'+Math.max(...lift).toFixed(1)+')');
 s.moving=true;const wk=[];for(let i=0;i<30;i++){vm.runInContext('time+=1/30',c);const q=FF(c,s);ok(/assets\/r770\/villagers\/sobok-float\.webp$/.test(q.path)&&q.assetFrame.pivot[1]===234.67,'R770 sobok moves with the float sheet (lift already drawn)');wk.push(q.assetFrame.sourceRect[0]/256);}
 const ch=wk.filter((v,i)=>i&&v!==wk[i-1]).length;ok(ch>=7&&ch<=9,'R770 sobok float 120ms (~8 changes/s, '+wk.join('')+')');s.moving=false;
 s.attack={elapsed:0,shape154:{windup:.6,active:.15,recovery:.6}};const at=[];for(let t=0;t<1.35;t+=.05){s.attack.elapsed=t;const q=FF(c,s);ok(/sobok-atk/.test(q.path)&&q.assetFrame.pivot[1]>234.67+9,'R770 sobok attack sheet, hovering');at.push(q.assetFrame.sourceRect[0]/256);}
 ok(at.every((v,i)=>!i||v>=at[i-1])&&at[0]===0&&at[at.length-1]===7,'R770 sobok attack frames 0→7 ('+at.join('')+')');s.attack=null;
 s.hitTimer=.3;{const hs=[];for(let i=0;i<5;i++){hs.push(FF(c,s));vm.runInContext('time+=1/16',c);}ok(hs.every(q=>/assets\/r770\/villagers\/sobok-hit\.webp$/.test(q.path)),'R771 sobok hit → Dots vil3 hit4 sheet ('+hs[0].path+')');const hf=hs.map(q=>q.assetFrame.sourceRect[0]/256);ok(hf.join('')==='01233','R771 sobok hit 16fps 0→3 then hold ('+hf.join('')+')');ok(hs.every(q=>q.assetFrame.pivot[1]===234.67),'R771 sobok hit sheet already hovers (no extra lift)');}s.hitTimer=0;
 c.killEnemy(s);const fx=vm.runInContext('effects',c).slice(-1)[0];ok(fx.r763?.k==='sobok','R769 sobok death tagged');fx.age=.5;vm.runInContext('__drawn.length=0',c);c.drawBurnDeath3(fx);const d=vm.runInContext('__drawn',c)[0];
 ok(d&&/sobok-idle/.test(d.path)&&d.rect[0]===0&&d.alpha<1,'R770 sobok death: idle frame 0 sinking/fading');
 const co=vworld({store:{'storyworld.r763.villagers':'{"sobok":false}'}}),s2=mob({id:'last302:r75-pack:10',name:'귀비탕 공명 안개핵 5'});ok(/fisher-/.test(FF(co,s2).path)&&s2.name==='잠식된 어부 5','R769 sobok:false → fisher');
 const cr=vworld({ready:false});FF(cr,mob());const ens=vm.runInContext('__ens',cr);ok(['r770/villagers/sobok-float','r770/villagers/sobok-idle','r770/villagers/sobok-atk','r770/villagers/sobok-hit','herbwife-proj6'].every(k=>ens.some(p=>p.endsWith(k+'.webp'))),'R770 sobok + projectile sheets requested');ok(!ens.some(p=>/sobok-walk/.test(p)),'R770 temp walk sheet no longer loaded');}
{// R769 투사체: 약방 아낙이 쏜 적 투사체는 proj6 시트(128칸 6, 오른쪽으로 날아가는 그림)를 날아가는 쪽으로 돌려 그림. 다른 몹·영웅·지역·꺼짐·안 실림은 엔진 그대로
 const c=vworld(),hw=mob({id:'last302:l302-e1:2',nativeId:'l302-e1',name:'포구 검은 안개 2'}),fi=mob();FF(c,hw);FF(c,fi);c.room.enemies.push(hw,fi);
 const shot=(o)=>({id:'s'+Math.random(),owner:hw.id,friendly:false,x:4,y:3,vx:-3,vy:0,age:0,life:2,scale:1,...o});
 const P=(cc,b)=>{vm.runInContext('ctx.__ops.length=0;__proj.length=0',cc);cc.drawProjectile(b);return {ops:vm.runInContext('ctx.__ops.slice()',cc),base:vm.runInContext('__proj.slice()',cc)};};
 const r=P(c,shot());const dr=r.ops.find(o=>o[0]==='d'),ro=r.ops.find(o=>o[0]==='r');
 ok(dr&&r.base.length===0,'R769 herbwife shot drawn from proj6 sheet, engine art skipped');ok(dr[1]%128===0&&dr[3]===128&&dr[4]===128&&dr[7]===dr[8]&&dr[7]>30,'R769 one 128 cell, square, sized ('+dr.slice(1).map(v=>Math.round(v)).join(',')+')');
 ok(Math.abs(Math.abs(ro[1])-Math.PI)<.05,'R769 flying left → rotated ~π ('+ro[1].toFixed(2)+')');
 const fr=new Set();for(let a=0;a<.6;a+=.05)fr.add(P(c,shot({id:'x',age:a})).ops.find(o=>o[0]==='d')[1]/128);ok(fr.size>=5,'R769 projectile animates ('+[...fr].join('')+')');
 ok(P(c,shot({owner:fi.id})).base.length===1,'R769 fisher shot → engine');ok(P(c,shot({friendly:true})).base.length===1,'R769 friendly shot → engine');ok(P(c,shot({owner:'nobody'})).base.length===1,'R769 unknown owner → engine');
 const cn=vworld({ready:false});cn.room.enemies.push(hw);ok(P(cn,shot()).base.length===1,'R769 sheet not loaded → engine');
 const cz=vworld({roomId:'last301'});cz.room.enemies.push(hw);ok(P(cz,shot()).base.length===1,'R769 other region → engine');
 const cf=vworld({store:{'storyworld.r763.villagers':'{"proj":false}'}});cf.room.enemies.push(hw);ok(P(cf,shot()).base.length===1,'R769 proj:false → engine');}
console.log('R760 CPU check OK ('+n+' assertions)');
