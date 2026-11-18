'use strict';
// R1176 히든 영웅 EGO — '2D EGO'·'3D EGO' 두 모습과 겹침 정리 CPU 검사
//  (사용자 2026-11-18 14:47Z "히든영웅에고도 모션이나 이펙트 및 공격모션특히 뭔가 자연스럽지않고 겹치는 느낌 … 2d화랑 3d화 두개로해서 영웅창에서 … 계속넘나들수 있게 … 스킬이펙트랑 적중이펙트는 완전동일").
//  실패 먼저: ego-form-r1176.js 가 없으면 실패한다.
//  완료 조건: ① 모습 '2d'|'3d' 저장·전환(한 영웅, 형태 선택만 저장) ② 3D 모습 = 몸 전부 3D 렌더 시트(수묵 굽기·Dots 가로 베기 교체 표식으로 건너뜀)
//   ③ 두 모습 공통: 공격 잔상 몸 0, 분신(겹친 영웅 그리기) 몫 궤적·광륜 0 ④ 2D 모습: 다른 인물 그림끼리 섞어 넘기기 0 ⑤ 이펙트 명령은 두 모습이 완전히 같다 ⑥ 판정·수치 안 건드림.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d).slice(0,400):'');}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const N='ego-form-r1176.js',SRC=rd(path.join(R,'client-source',N));
ok(SRC.length>0,N+' 있음');
ok(SRC.length>0&&rd(path.join(R,'runtime-text',N))===SRC,N+' runtime-text 사본 = client-source');
{const html=rd(path.join(R,'runtime-text','index.html'));ok(html.includes('<script src="./ego-summon-r1157.js"></script>\n<script src="./ego-form-r1176.js"></script>'),'태그: ego-summon-r1157 바로 뒤');}
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1176/r1176-cpu-check.cjs'),'pages.yml CPU 검사 줄');
ok(/'ego-form-r1176\.js'/.test(rd(path.join(ROOT,'scripts','verify-r96-public.py'))),'공개 확인 목록');
ok(!/attackPower|\.hp\s*[-+*]?=|specialCD\s*=|attackCD\s*=|saveGame\s*=|\btick\s*=\s*function/.test(SRC),'판정·피해·대기·저장 함수에 손대지 않음');
function load(store){const ls={m:new Map(Object.entries(store||{})),getItem(k){return this.m.has(k)?this.m.get(k):null;},setItem(k,v){this.m.set(k,String(v));},removeItem(k){this.m.delete(k);}};
 const w={localStorage:ls,setInterval(){return 0;},addEventListener(){}};w.window=w;const cx=vm.createContext(w);try{vm.runInContext(SRC,cx,{filename:N});}catch(e){return{err:String(e),ls};}return{A:w.__STORYWORLD_EGO_FORM_R1176__,ls,w};}
const L=load();const A=L.A;ok(!!A&&!L.err,'문서·게임 없이도 실림(API 열림)',L.err);
if(!A){console.log(`\nR1176 cpu: ${n-bad}/${n} 통과`);process.exit(1);}
// ① 모습 저장·전환
ok(A.look()==='2d','기본 모습 = 2d(지금 공개판과 같은 그림)',A.look());
ok(A.set('3d')==='3d'&&A.look()==='3d'&&L.ls.getItem(A.storageKey)==='3d','set(3d) → 저장');
ok(A.toggle()==='2d'&&A.toggle()==='3d'&&A.toggle()==='2d','toggle 은 2d↔3d 를 계속 오감');
for(const v of ['4d','',null,undefined,3,{},'3D ']){const b=A.look();ok(A.set(v)===b&&A.look()===b,'잘못된 값은 무시: '+JSON.stringify(v));}
ok(A.set('3D')==='3d','대문자 3D 도 받음');
ok(load({'storyworld.r1176.egoLook':'3d'}).A.look()==='3d','저장된 3d 로 시작');
ok(load({'storyworld.r1176.egoLook':'garbage'}).A.look()==='2d','깨진 저장값이면 2d');
ok(A.storageKey==='storyworld.r1176.egoLook'&&!/egoSovereignR1046\s*=|localStorage\.setItem\((?!KEY)/.test(SRC),'저장은 모습 열쇠 하나뿐(해금·형상·수치 저장 안 건드림)');
ok(A.LOOKS&&A.LOOKS['2d'].name==='2D EGO'&&A.LOOKS['3d'].name==='3D EGO','이름: 2D EGO · 3D EGO');
// ② ~ ⑤ 명령 손질(shape) — R1048 이 만든 영웅 몫 명령 모양
const own={kind:'hero',id:'hero:1'};
const body=(clip,dir,frame,key,alpha,extra)=>({kind:'image',owner:{...own},key:key||'hero',r1048:clip,sourcePath:'assets/r1048/ego/'+clip+'-'+dir+'.webp',sourceRect:[frame*160,0,160,160],points:[[0,0],[10,0],[10,10],[0,10]],style:{globalAlpha:alpha==null?1:alpha,...(extra||{})}});
const fx=(name,key,alpha)=>({kind:'image',owner:{...own,r1048fx:true},key,r1048:'fx',sourcePath:'assets/r1048/fx/'+name+'.webp',sourceRect:[0,0,256,256],points:[[0,0],[10,0],[10,10],[0,10]],style:{globalAlpha:alpha==null?1:alpha,globalCompositeOperation:'lighter'}});
const other=()=>({kind:'image',owner:{kind:'enemy'},key:'e1',sourcePath:'assets/mobs/a.webp',style:{globalAlpha:1}});
const swing=()=>[other(),fx('ego_halo','hero:r1048h',.85),body('idle','se',3,'hero:r1048f',.5),body('attack','se',4,'hero:r1048g0',.38,{globalCompositeOperation:'lighter'}),body('attack','se',5,'hero:r1048g1',.25,{globalCompositeOperation:'lighter'}),
 body('attack','se',6,'hero'),fx('ego_slash','hero:r1048s0',1),fx('ego_slash','hero:r1048s1',.55)];
const isBody=c=>c.owner?.kind==='hero'&&c.r1048&&c.r1048!=='fx',isFx=c=>c.r1048==='fx';
const strip=c=>JSON.stringify({k:c.key,p:c.sourcePath,r:c.sourceRect,pt:c.points,s:c.style});
for(const look of ['2d','3d']){const c=swing(),r=A.shape(c,1,{look,nested:false,basicNow:true,basicWas:false});
 ok(c.filter(x=>/r1048g\d+$/.test(x.key)).length===0,look+': 공격 잔상 몸 0(겹쳐 보이던 반투명 몸)',c.map(x=>x.key));
 ok(c.filter(isBody).filter(x=>x.key==='hero').length===1&&c[0].owner.kind==='enemy','본체 한 장 남음 · 영웅 몫 앞 명령은 그대로');
 ok(c.filter(isFx).length===3,look+': 본체 궤적·광륜은 그대로',c.filter(isFx).map(x=>x.key));
 ok(r&&r.ghosts===2,look+': 손질 수를 돌려줌',r);}
{const c2=swing(),c3=swing();A.shape(c2,1,{look:'2d',nested:false,basicNow:true,basicWas:false});A.shape(c3,1,{look:'3d',nested:false,basicNow:true,basicWas:false});
 ok(JSON.stringify(c2.filter(isFx).map(strip))===JSON.stringify(c3.filter(isFx).map(strip)),'⑤ 이펙트 명령(주소·칸·자리·알파·합성)은 두 모습이 완전히 같다');
 const b3=c3.filter(isBody),b2=c2.filter(isBody);
 ok(b3.length>0&&b3.every(x=>x.r1099===true&&x.egoDotsR1139b===true&&x.r1176==='3d'&&/^assets\/r1048\/ego\//.test(x.sourcePath)),'② 3D: 몸 명령마다 수묵 굽기·가로 베기 교체 건너뜀 표식 · 3D 렌더 시트 그대로',b3.map(x=>[x.key,x.r1099,x.egoDotsR1139b]));
 ok(b3.every(x=>typeof x.style.filter==='string'&&/brightness\(/.test(x.style.filter)),'3D: 어두운 맵에서 묻히지 않게 밝기 올림',b3.map(x=>x.style.filter));
 ok(b2.every(x=>x.r1099===undefined&&x.egoDotsR1139b===undefined&&x.r1176==='2d'),'2D: 몸은 기존 길(수묵·Dots 가로 베기) 그대로',b2.map(x=>[x.key,x.r1099]));
 ok(c2.filter(x=>/r1048f$/.test(x.key)).length===0,'④ 2D: 기본 공격(가로 베기 인물) ↔ 대기(다른 인물) 섞어 넘기기 뺌');
 ok(c3.filter(x=>/r1048f$/.test(x.key)).length===1,'3D: 같은 인물이라 섞어 넘기기 유지');}
{const c=swing();A.shape(c,1,{look:'2d',nested:false,basicNow:false,basicWas:false});ok(c.filter(x=>/r1048f$/.test(x.key)).length===1,'2D: 스킬 시전(같은 인물 그림)은 섞어 넘기기 유지');}
{const c=[body('attack','e',14,'hero:r1048f',.6),body('idle','e',0,'hero')];A.shape(c,0,{look:'2d',nested:false,basicNow:false,basicWas:true});ok(c.length===1&&c[0].key==='hero','2D: 가로 베기가 끝나 대기로 돌아올 때도 섞지 않음');}
{const c=[body('attack','e',3,'hero:r1048f',.6),body('attack','e',0,'hero')];A.shape(c,0,{look:'2d',nested:false,basicNow:true,basicWas:true});ok(c.length===2,'2D: 가로 베기 → 가로 베기(같은 인물) 연속 휘두름 섞기는 유지');}
{const c=[body('run','e',2,'hero:r1048g0',.38),body('run','e',3,'hero')];A.shape(c,0,{look:'3d',nested:false,basicNow:false,basicWas:false});ok(c.length===2,'회귀: 대시 잔상은 남김(공격 잔상만 뺌)');}
for(const look of ['2d','3d']){const c=swing();const r=A.shape(c,1,{look,nested:true,basicNow:true,basicWas:false});
 ok(c.filter(isFx).length===0,look+': ③ 분신(겹쳐 부른 영웅 그리기) 몫 궤적·광륜 0',c.map(x=>x.key));ok(c.filter(isBody).filter(x=>x.key==='hero').length===1,look+': 분신 몸은 남김');ok(r.fx===3,'뺀 이펙트 수',r);}
// 경계
ok(A.shape(null,0,{look:'3d'}).ghosts===0&&A.shape([],5,{look:'3d'}).ghosts===0&&A.shape([null,1,'x',{}],0,{}).ghosts===0,'빈·깨진 입력에 오류 없음');
{const c=swing();A.shape(c,-3,{look:'3d',nested:false});ok(c[0].r1176===undefined&&c[0].owner.kind==='enemy','영웅 아닌 명령은 st 가 음수여도 안 건드림');}
{const c=swing(),keep=JSON.stringify(c[0]);A.shape(c,6,{look:'3d',nested:false,basicNow:true});ok(c.length===8&&JSON.stringify(c[0])===keep&&c[3].r1176===undefined,'st 앞(다른 영웅·이전 그리기 몫)은 손대지 않음');}
{const c=[body('attack','se',6,'hero',NaN)];A.shape(c,0,{look:'3d'});ok(c.length===1&&c[0].r1176==='3d','알파 NaN 이어도 본체는 남김');}
{const c=swing();A.shape(c,1,{look:'nonsense'});ok(c.filter(isBody).every(x=>x.r1176==='2d'),'모르는 모습 값은 2d 로');}
{const c=swing();A.shape(c,1,{look:'3d'});const f=c.find(x=>x.key==='hero').style.filter;A.shape(c,1,{look:'3d'});ok(c.find(x=>x.key==='hero').style.filter===f,'두 번 불러도 밝기 필터가 쌓이지 않음',f);}
// ⑥ 2D 몸 = Dots 붓 그림 전신 세트(그림이 받아졌을 때)
{const IM={naturalWidth:2048,naturalHeight:256},img=()=>IM,none=()=>null;
 const T=(clip,dir,f,basic)=>A.target2d(body(clip,dir,f,'hero'),basic);
 ok(T('idle','s',0).path==='assets/r1176/ego2d/idle-front.webp'&&T('walk','e',0).path==='assets/r1176/ego2d/walk-right.webp'&&T('run','n',0).path==='assets/r1176/ego2d/run-rear.webp'&&T('hit','se',0).path==='assets/r1176/ego2d/hit-right.webp','동작·방향 → 시트 주소');
 ok(T('walk','w',0).flip===true&&T('walk','sw',0).flip===true&&T('walk','nw',0).flip===true&&T('walk','nw',0).path.endsWith('walk-rear.webp')&&T('walk','e',0).flip===false,'왼쪽 세 방향은 좌우 뒤집기');
 ok(T('attack','e',6,true).path==='assets/r1139/ego/slash-right.webp'&&T('attack','e',6,true).frame===3&&T('attack','e',6,false).path==='assets/r1176/ego2d/cast-right.webp'&&T('attack','e',6,false).frame===3,'기본 공격 = 가로 베기 시트 · 스킬 = 시전 시트');
 ok(T('discard','s',10).path==='assets/r1176/ego2d/discard-front.webp'&&T('discard','e',10).path==='assets/r1176/ego2d/discard-right.webp'&&T('discard','n',10).path==='assets/r1176/ego2d/discard-rear.webp'&&T('discard','w',10).path==='assets/r1176/ego2d/discard-right.webp'&&T('discard','w',10).flip===true&&T('discard','e',10).flip===false&&T('discard','s',19).frame===11&&T('discard','s',0).frame===0,'관측 폐기도 방향별 그림(앞·오른쪽·뒤, 왼쪽은 뒤집기 · 20칸 → 12칸) — Dots CX-0155EG-6 오른쪽·뒤 추가(R1176b)');
 const all=[];for(const [k,N,M] of [['idle',12,8],['walk',12,8],['run',10,8],['hit',8,4],['attack',16,8],['discard',20,12]])for(let f=0;f<N+3;f++){const t=T(k,'s',f,false);all.push(t.frame>=0&&t.frame<M&&Number.isInteger(t.frame));}
 ok(all.every(Boolean)&&T('idle','s',11).frame===7&&T('hit','s',7).frame===3,'칸 번호는 늘 시트 안(넘치는 칸도 마지막 칸으로)');
 ok(A.target2d({sourcePath:'assets/hero/hwando.webp',sourceRect:[0,0,160,160]},false)===null&&A.target2d(body('idle','xx',0,'hero'),false)===null&&A.target2d(body('dance','s',0,'hero'),false)===null&&A.target2d({sourcePath:'assets/r1048/ego/idle-s.webp'},false)===null&&A.target2d(null,false)===null,'모르는 그림·방향·동작·칸 없는 명령은 건드리지 않음');
 const q=A.quad2d([[100,50],[260,50],[260,210],[100,210]],false),qf=A.quad2d([[100,50],[260,50],[260,210],[100,210]],true);
 const k2=96/150*1.1;ok(q&&Math.abs((q[0][0]+q[1][0])/2-180)<1e-6&&Math.abs(q[0][1]+220*k2-(50+140.8))<1e-6&&Math.abs((q[1][0]-q[0][0])-256*k2)<1e-6,'새 칸은 발 자리(가로 가운데·세로 발 줄)와 몸 키를 옛 칸에 맞춤',q);
 ok(qf&&qf[0][0]===q[1][0]&&qf[1][0]===q[0][0]&&qf[0][1]===q[0][1],'뒤집기는 좌우 점만 바꿈');
 ok(A.quad2d(null,false)===null&&A.quad2d([[0,0],[0,0],[0,0],[0,0]],false)===null&&A.quad2d([[NaN,0],[1,0],[1,1],[0,1]],false)===null,'깨진 네 점이면 바꾸지 않음');
 {const c=swing(),r=A.shape(c,1,{look:'2d',nested:false,basicNow:false,basicWas:false,img});const b=c.filter(isBody);
  ok(r.body2d===2&&b.length===2&&b.every(x=>x.image===IM&&/r1176\/ego2d\/|r1139\/ego\/slash-/.test(x.sourcePath)&&x.egoDotsR1139b===true&&x.r1099===true&&x.r1090===true&&x.owner.r409===true&&x.sourceRect[2]===256),'2D: 본체·섞는 칸 모두 Dots 시트로 · 수묵 굽기·담묵·테 건너뜀 표식',b.map(x=>[x.key,x.sourcePath]));
  ok(/brightness\(1\.32\)/.test(c.find(x=>x.key==='hero').style.filter),'가로 베기와 같은 밝기 올림');
  const d=swing(),r2=A.shape(d,1,{look:'2d',nested:false,basicNow:true,basicWas:false,img}),h=d.filter(isBody);
  ok(h.length===1&&h[0].sourcePath==='assets/r1139/ego/slash-right.webp'&&h[0].sourceRect[0]===3*256&&r2.body2d===1&&r2.noImage===0,'기본 공격 본체는 가로 베기 시트(대기와 섞는 칸은 뺌)',r2);
  ok(c[0].image===undefined&&c.filter(isFx).every(x=>x.image===undefined&&/^assets\/r1048\/fx\//.test(x.sourcePath)),'이펙트·다른 주인 명령은 그림을 바꾸지 않음');}
 {const c2=swing(),c3=swing();A.shape(c2,1,{look:'2d',nested:false,basicNow:true,basicWas:false,img});A.shape(c3,1,{look:'3d',nested:false,basicNow:true,basicWas:false,img});
  ok(JSON.stringify(c2.filter(isFx).map(strip))===JSON.stringify(c3.filter(isFx).map(strip)),'⑤ 그림이 받아진 뒤에도 이펙트 명령은 두 모습이 완전히 같다');
  ok(c3.filter(isBody).every(x=>x.image===undefined&&/^assets\/r1048\/ego\//.test(x.sourcePath)),'3D 는 img 가 있어도 3D 렌더 시트 그대로');}
 {const c=swing(),keep=c.filter(isBody).map(x=>x.sourcePath),r=A.shape(c,1,{look:'2d',nested:false,basicNow:false,basicWas:false,img:none});
  ok(r.body2d===0&&r.noImage===2&&c.filter(isBody).every(x=>x.egoDotsR1139b===undefined&&x.r1099===undefined&&/^assets\/r1048\/ego\//.test(x.sourcePath)),'그림이 아직 없으면 그 칸은 예전 길 그대로(빈 몸 없음)',[r,keep]);}
 {const c=swing();A.shape(c,1,{look:'2d',nested:false,basicNow:false,basicWas:false,img});const f=c.find(x=>x.key==='hero'),p0=JSON.stringify(f.points),s0=f.style.filter;A.shape(c,1,{look:'2d',nested:false,basicNow:false,basicWas:false,img});
  ok(JSON.stringify(f.points)===p0&&f.style.filter===s0&&f.sourcePath==='assets/r1176/ego2d/cast-right.webp','두 번 불러도 자리·필터가 다시 바뀌지 않음(스킬 = 시전 시트)',f.sourcePath);}
 {const c=swing();A.shape(c,1,{look:'2d',nested:true,basicNow:false,basicWas:false,img});ok(c.filter(isBody).every(x=>/r1176\/ego2d\//.test(x.sourcePath)),'분신 몸도 같은 Dots 인물');}
 ok(Array.isArray(A.D2_ALL)&&A.D2_ALL.length===21&&A.D2_ALL.every(x=>fs.existsSync(path.join(ROOT,'r96/runtime-text',x))),'2D 시트 21장이 저장소에 있음',A.D2_ALL.filter(x=>!fs.existsSync(path.join(ROOT,'r96/runtime-text',x))));}
// 칸 UI 순수 계산
ok(A.cellLabel('EGO','2d')==='2D EGO'&&A.cellLabel('EGO','3d')==='3D EGO'&&A.cellLabel('2D EGO','3d')==='3D EGO'&&A.cellLabel('','3d')==='3D EGO','칸 이름 붙이기(되풀이해도 한 번만)');
console.log(`\nR1176 cpu: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
