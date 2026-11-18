'use strict';
// R1139b EGO 히든 영웅 — Dots 최종 인계 그림(EGO-R1139 A·B·C, 사용자 선택) 연결 CPU 검사(사용자 2026-11-18 05:32Z "에고히든영웅 구글드라이브확인").
//  인계 지침: ① 기본 공격 1~5타 몸 동작 = 가로 베기 3방향(앞·뒤·오른쪽, 왼쪽은 좌우 뒤집기), Q·W·R 은 그대로 ② 찌르기는 기존 오른쪽 찌르기 길이 없으면 연결하지 않음
//  ③ 가로 붓 궤적은 가로 베기에만 ④ 적중은 실제 타격 자리에 한 번 ⑤ 보호막 고리는 '되비친 집착'에만 ⑥ 아이콘 7은 EGO 칸에만. 판정·피해·시간·쿨다운·키는 그대로.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d).slice(0,400):'');}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const N='ego-dots-r1139b.js',SRC=rd(path.join(R,'client-source',N));
ok(SRC.length>0,N+' 있음');
ok(SRC.length>0&&rd(path.join(R,'runtime-text',N))===SRC,N+' runtime-text 사본 = client-source');
{const html=rd(path.join(R,'runtime-text','index.html'));ok(html.includes('<script src="./ego-polish-r1139.js"></script>\n<script src="./ego-dots-r1139b.js"></script>'),'태그: ego-polish-r1139 바로 뒤');}
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1139b/r1139b-cpu-check.cjs'),'pages.yml CPU 검사 줄');
ok(/'ego-dots-r1139b\.js'/.test(rd(path.join(ROOT,'scripts','verify-r96-public.py'))),'공개 확인 목록');
ok(!/\btick\s*=\s*function|\bsaveGame\s*=\s*function|\bdrawHero\s*=\s*function/.test(SRC)&&/__STORYWORLD_POST_HOOKS__\.register\(/.test(SRC),'tick·drawHero 는 직접 감싸지 않고 POST_HOOKS.register 로');
// 자산
const AD=path.join(R,'runtime-text','assets','r1139','ego');let IDX=null;try{IDX=JSON.parse(rd(path.join(AD,'index.json')));}catch(_){}
const WANT={'slash-front.webp':[256,8],'slash-rear.webp':[256,8],'slash-right.webp':[256,8],'trail-horizontal.webp':[256,6],'impact.webp':[128,8],'shield.webp':[256,8],'icons.webp':[128,7]};
function webpSize(f){try{const b=fs.readFileSync(f);if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')return null;const t=b.toString('ascii',12,16);
 if(t==='VP8X')return[1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];if(t==='VP8L'){const v=b.readUInt32LE(21);return[1+(v&0x3fff),1+((v>>14)&0x3fff)];}if(t==='VP8 ')return[b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];}catch(_){}return null;}
for(const k in WANT){const s=webpSize(path.join(AD,k)),[c,f]=WANT[k];ok(!!s&&s[0]===c*f&&s[1]===c,'자산 '+k+' = '+c*f+'×'+c,s);}
ok(!!IDX&&Array.isArray(IDX.files)&&Object.keys(WANT).every(k=>IDX.files.some(r=>r.file===k&&/^[0-9a-f]{64}$/.test(r.sourceSha256)&&r.frames===WANT[k][1]&&r.cell===WANT[k][0])),'자산 표(index.json): 원본 해시·칸·칸 수');
ok(!fs.existsSync(path.join(AD,'trail-straight.webp'))&&!fs.readdirSync(fs.existsSync(AD)?AD:R).some(f=>/thrust/.test(f)),'찌르기(오른쪽 전용)는 싣지 않음 — 기존 오른쪽 찌르기 길 없음');
{const inp=rd(path.join(R,'runtime-inputs.json'));ok(inp.includes('assets/r1139/ego/slash-front.webp')&&inp.includes('ego-dots-r1139b.js'),'runtime-inputs 에 새 파일');}
function boot(opt={}){const iv=[];const floats=[];
 const sb={console,JSON,Object,Array,Number,String,Math,Set,Map,WeakMap,WeakSet,Date,RegExp,isFinite,setInterval:f=>{iv.push(f);return iv.length;},setTimeout:f=>{iv.push(f);return 0;},localStorage:{getItem:()=>opt.off?'{"on":false}':null,setItem(){}}};
 const cls=new Set();sb.document={readyState:'complete',head:{appendChild(e){sb.__style=e;}},body:{classList:{add:c=>cls.add(c),remove:c=>cls.delete(c),contains:c=>cls.has(c),toggle:(c,v)=>{v?cls.add(c):cls.delete(c);}}},createElement:()=>({}),getElementById:()=>null};
 sb.window=sb;vm.createContext(sb);sb.__floats=floats;sb.__cls=cls;
 vm.runInContext(`var time=10,room={enemies:[]};var player={hero:'hwando',x:0,y:0,hp:100,shield:0};
  function floatText(t,x,y,c){__floats.push({t,x,y,c});}
  function project(x,y){return{x:400+(x-y)*40,y:300+(x+y)*20};}
  function actorHeight(){return 60;}
  var __noImg=${!!opt.noImages};function readyImage(p){return __noImg?null:{image:{naturalWidth:/icons/.test(p)?896:/impact/.test(p)?1024:/trail/.test(p)?1536:2048,naturalHeight:/icons|impact/.test(p)?128:256,src:p}};}
  function addImage(){}
  window.__STORYWORLD_POST_HOOKS__={register(mark,h){window.__hooks=window.__hooks||{};window.__hooks[mark]=h;}};
  window.__form=${opt.form!==false};window.__rc=${!!opt.rc151};
  window.__STORYWORLD_EGO_SOVEREIGN_R1046__={formActive:()=>window.__form,inspect:()=>({rc151:window.__rc})};
  window.__mot={input:{basic:true,at:1},state:{clip:'attack',frame:6,dir:'e'}};
  window.__STORYWORLD_EGO_MOTION_R1048__={inspect:()=>window.__mot};
  window.__STORYWORLD_EGO_POLISH_R1139__={isCloneInk:f=>typeof f==='string'&&/grayscale\\(1\\)/.test(f)};`,sb);
 if(SRC)vm.runInContext(SRC,sb,{filename:N});return{sb,iv,floats,cls,A:sb.__STORYWORLD_EGO_DOTS_R1139B__,run:c=>vm.runInContext(c,sb)};}
// 옛 EGO 몸 칸(160칸, 발 80·140.8, 몸 96px)을 화면 발 (fx,fy)·배율 k 로 놓은 명령
const oldBody=(dir,f,fx=500,fy=400,k=.6,extra={})=>({kind:'image',image:{src:'old'},sourcePath:'assets/r1048/ego/attack-'+dir+'.webp',sourceRect:[f*160,0,160,160],imageSize:[2560,160],r1048:'attack',key:'hero:1',order:5,
 points:[[fx-80*k,fy-140.8*k],[fx+80*k,fy-140.8*k],[fx+80*k,fy+19.2*k],[fx-80*k,fy+19.2*k]],owner:{kind:'hero',id:1},style:{globalAlpha:1},...extra});
const oldSlash=(flip,core)=>({kind:'image',image:{src:'s'},sourcePath:'assets/r1048/fx/ego_slash.webp',sourceRect:[512,0,256,256],imageSize:[1536,256],r1048:'fx',key:'hero:1:r1048s'+(core?1:0),order:6,
 points:flip?[[600,300],[400,300],[400,500],[600,500]]:[[400,300],[600,300],[600,500],[400,500]],owner:{kind:'hero',id:1,r409:true},style:{globalAlpha:core?.55:1,globalCompositeOperation:'lighter'}});
const barrier=(filter)=>({kind:'image',image:{src:'b'},sourcePath:'http://x/m0/assets/r1027/barrier.webp',sourceRect:[320,160,160,160],imageSize:[960,640],key:'hero:1:b',order:4,points:[[470,340],[530,340],[530,400],[470,400]],owner:{kind:'hero',id:1},style:{globalAlpha:.4,...(filter?{filter}:{})}});
const B=boot(),A=B.A;
ok(!!A&&/^R1139b/.test(String(A?.revision)),'API 열림(__STORYWORLD_EGO_DOTS_R1139B__)');
if(A){
 // ① 방향 → 시트
 const S=d=>A.sheetFor(d);
 ok(S('s')?.sheet==='front'&&!S('s').flip&&S('n')?.sheet==='rear'&&!S('n').flip&&S('e')?.sheet==='right'&&!S('e').flip,'앞 s → front, 뒤 n → rear, 오른쪽 e → right');
 ok(S('w')?.sheet==='right'&&S('w').flip===true&&S('sw')?.flip===true&&S('nw')?.flip===true&&S('se')?.flip===false&&S('ne')?.flip===false,'왼쪽(w·sw·nw)은 좌우 뒤집기, 오른쪽은 그대로');
 ok(['s','se','e','ne','n','nw','w','sw'].every(d=>['front','rear','right'].includes(S(d)?.sheet)),'8방향 모두 3시트 안');
 ok(S('x')===null&&S(undefined)===null&&S(7)===null,'모르는 방향은 null(기존 동작 유지)');
 // 칸 대응
 const bf=[...Array(16)].map((_,i)=>A.bodyFrame(i));
 ok(bf[0]===0&&bf[15]===7&&bf.every((v,i)=>Number.isInteger(v)&&v>=0&&v<=7&&(!i||v>=bf[i-1])),'몸 16칸 → 8칸: 0→0, 15→7, 뒤로 가지 않음',bf);
 ok(bf[5]>=3&&bf[5]<=4&&bf[10]>=4,'타격 구간(5~10)이 휘두르는 칸(3~5)',bf);
 ok(A.bodyFrame(NaN)===0&&A.bodyFrame(-3)===0&&A.bodyFrame(99)===7&&A.bodyFrame('a')===0,'칸 경계·NaN 안전');
 const tf=[...Array(16)].map((_,i)=>A.trailFrame(i));
 ok(tf.slice(0,3).every(v=>v===-1)&&tf.slice(12).every(v=>v===-1)&&tf[5]>=0&&tf.every(v=>v>=-1&&v<=5),'궤적: 예비·여운 끝에는 없음, 타격에 있음',tf);
 ok(tf.filter(v=>v>=0).every((v,i,a)=>!i||v>=a[i-1]),'궤적 칸도 뒤로 가지 않음');
 // 몸 상자: 발 자리·몸 크기 보존
 const o=oldBody('e',6),q=A.bodyQuad(o.points,false),k=.6;
 const k2=(q[1][0]-q[0][0])/256,footX=q[0][0]+128*k2,footY=q[0][1]+220*k2;
 ok(Math.abs(footX-500)<1e-6&&Math.abs(footY-400)<1e-6,'발 자리 그대로(새 칸 발 128·220)',[footX,footY]);
 ok(Math.abs(150*k2-96*k)<96*k*.12,'몸 키 화면 크기 ±12% 안',[150*k2,96*k]);
 const qf=A.bodyQuad(o.points,true);ok(qf[0][0]>qf[1][0]&&Math.abs((qf[0][0]+qf[1][0])/2-(q[0][0]+q[1][0])/2)<1e-6,'뒤집기는 좌우 점만 바꿈(발 중심 같음)');
 ok(A.bodyQuad([[NaN,0],[1,0],[1,1],[0,1]],false)===null&&A.bodyQuad(null,false)===null&&A.bodyQuad([[0,0],[0,0],[0,0],[0,0]],false)===null,'NaN·빈 상자·0 크기는 null');
 // 기본 공격: 몸·궤적 바꿈
 {const c=[oldBody('e',6),oldSlash(true,false),oldSlash(true,true),oldBody('w',6,300,400,.6,{style:{globalAlpha:.3,globalCompositeOperation:'lighter'},key:'g'})];const r=A.process(c);
  ok(c[0].sourcePath==='assets/r1139/ego/slash-right.webp'&&c[0].sourceRect[0]===A.bodyFrame(6)*256&&c[0].sourceRect[2]===256&&c[0].imageSize[0]===2048,'기본 공격 e: 오른쪽 가로 베기 칸',c[0].sourceRect);
  ok(c[0].points.every(p=>p.every(Number.isFinite))&&c[0].points[0][0]<c[0].points[1][0],'e 는 뒤집지 않음');
  ok(/brightness\(1\.32\)/.test(c[0].style.filter)&&!/saturate/.test(c[0].style.filter),'몸: 대기 몸과 같은 밝기 올림(밤 맵에서 어두워 보이지 않게)',c[0].style.filter);
  {const side=Math.abs(c[1].points[1][0]-c[1].points[0][0]);ok(side<=200*.7&&side>=200*.4,'궤적 크기: 옛 궤적 칸의 40~70%(몸 세 배로 화면을 덮지 않게)',side);}
  ok(c[0].r1090===true&&c[0].owner.r409===true,'몸: R1090 담묵·R409 테두리를 겹치지 않게 표시(언주색 유지)');
  ok(c[3].sourcePath==='assets/r1139/ego/slash-right.webp'&&c[3].points[0][0]>c[3].points[1][0]&&c[3].style.globalAlpha===.3,'잔상(w)도 같은 그림·뒤집기, 알파 그대로');
  ok(c[1].sourcePath==='assets/r1139/ego/trail-horizontal.webp'&&c[1].style.globalCompositeOperation!=='lighter'&&c[1].sourceRect[0]===A.trailFrame(6)*256,'검 궤적 → 가로 붓 궤적(가산 합성 아님 — 먹선이 남게)',c[1].sourceRect);
  ok(c[1].points[0][0]<c[1].points[1][0],'궤적 방향: 옛 그림(왼쪽 보기)과 반대 원본이라 뒤집기도 반대');
  ok(+c[2].style.globalAlpha===0,'옛 흰 심 겹은 끔(흰 과다 방지)');
  ok(r>=3&&A.process(c)===0,'같은 명령 두 번 바꾸지 않음',r);}
 // 회귀: Q·W·R(스킬 진행도) 은 기존 동작
 {B.sb.__mot={input:{basic:false,at:1},state:{clip:'attack',frame:6,dir:'e'}};const c=[oldBody('e',6),oldSlash(true,false)];A.process(c);
  ok(c[0].sourcePath==='assets/r1048/ego/attack-e.webp'&&c[1].sourcePath==='assets/r1048/fx/ego_slash.webp','Q·W·R(기본 공격 아님): 몸·궤적 그대로');
  B.sb.__mot={input:{basic:true,at:1},state:{clip:'attack',frame:6,dir:'e'}};}
 {const c=[{...oldBody('e',3),sourcePath:'assets/r1048/ego/walk-e.webp',r1048:'walk'},{...oldBody('e',3),sourcePath:'assets/r1048/ego/idle-e.webp',r1048:'idle'},{...oldBody('e',3),owner:{kind:'enemy'}}];A.process(c);
  ok(c[0].sourcePath.includes('walk-e')&&c[1].sourcePath.includes('idle-e')&&c[2].sourcePath.includes('r1048'),'걷기·대기·영웅 아닌 명령은 그대로');}
 {B.sb.__form=false;const c=[oldBody('e',6)];A.process(c);ok(c[0].sourcePath.includes('r1048'),'EGO 형상 아님: 그대로');B.sb.__form=true;
  B.sb.__rc=true;const d=[oldBody('e',6)];A.process(d);ok(d[0].sourcePath.includes('r1048'),'RC151 변신 중: 그대로');B.sb.__rc=false;}
 ok(A.process(null)===0&&A.process([null,3,{kind:'image'}])===0,'빈 입력 안전');
 // ⑤ 보호막: 되비친 집착만
 {const c=[barrier()];B.run('player.shield=20');A.process(c);ok(c[0].sourcePath.includes('r1027/barrier'),'다른 보호막(되비친 집착 아님): 기존 그림');
  B.run("floatText('되비친 집착',0,0,'#fff')");const d=[barrier(),barrier('grayscale(1) contrast(1.5) brightness(0.92)')];A.process(d);
  ok(d[0].sourcePath==='assets/r1139/ego/shield.webp'&&d[0].sourceRect[2]===256&&d[0].sourceRect[0]%256===0&&d[0].sourceRect[0]<2048,'되비친 집착: 고리 그림',d[0].sourceRect);
  const w=d[0].points[1][0]-d[0].points[0][0],cx=(d[0].points[0][0]+d[0].points[2][0])/2,cy=(d[0].points[0][1]+d[0].points[2][1])/2;
  ok(Math.abs(cx-500)<1e-6&&Math.abs(cy-370)<1e-6,'고리 중심 = 옛 보호막 중심',[cx,cy]);
  ok(w*130/512>=60*.5,'빈 가운데 반지름(130/512)이 몸 반 키 이상 — 몸을 덮지 않음',w*130/512);
  ok(d[1].sourcePath.includes('r1027/barrier'),'분신(먹 필터) 몫은 건드리지 않음');
  ok(B.floats.length===1&&B.floats[0].t==='되비친 집착','글자 띄우기는 그대로 지나감');
  B.run('player.shield=0');B.sb.__hooks.__r1139b.tick();B.run('player.shield=9');const e=[barrier()];A.process(e);ok(e[0].sourcePath.includes('r1027/barrier'),'보호막이 꺼진 뒤 다른 보호막엔 다시 기존 그림');
  ok([0,.1,1,7.99,NaN,-1,1e9].every(t=>{const f=A.shieldFrame(t);return Number.isInteger(f)&&f>=0&&f<8;})&&A.shieldFrame(0)===0&&A.shieldFrame(8/A.FX.shield.fps)===0,'고리 8칸 반복(8→1 이음)');}
 // ④ 적중
 ok(A.impactFrame(10,10)===0&&A.impactFrame(10,9.9)===-1&&A.impactFrame(10,10+8/A.FX.impact.fps+.01)===-1&&A.impactFrame(NaN,1)===-1&&A.impactFrame(10,10+7.5/A.FX.impact.fps)===7,'적중 8칸 한 번(끝나면 없음)');
 {const H=A.pickHit([{x:1,y:0,drop:5},{x:.5,y:0,drop:0},{x:9,y:9,drop:50},{x:2,y:0,drop:3}],0,0);ok(H&&H.x===1,'가장 가까운 실제 피해 적(범위 안)만',H);
  ok(A.pickHit([{x:9,y:9,drop:50}],0,0)===null&&A.pickHit([],0,0)===null&&A.pickHit(null,0,0)===null&&A.pickHit([{x:NaN,y:0,drop:5}],0,0)===null,'범위 밖·빈 입력·NaN 은 없음');}
 {const T=B.sb.__hooks.__r1139b.tick;B.run('room.enemies=[{x:1,y:0,hp:50},{x:1.5,y:.5,hp:50}];time=20;');T();/* 첫 기록 */
  const c0=[oldBody('e',6)];A.process(c0);ok(c0.length===1,'피해 없으면 적중 그림 없음');
  B.run('room.enemies[0].hp=40;room.enemies[1].hp=45;time=20.02;');T();const c=[oldBody('e',6)];A.process(c);
  const im=c.filter(x=>x.sourcePath==='assets/r1139/ego/impact.webp');
  ok(im.length===1&&im[0].points.every(p=>p.every(Number.isFinite))&&im[0].sourceRect[2]===128&&im[0].order>c[0].order,'한 휘두름에 적중 그림 하나(여럿 맞아도), 맨 위 순서',im.length);
  const pr=B.sb.project(1,0),cx=(im[0]?.points[0][0]+im[0]?.points[2][0])/2;ok(Math.abs(cx-pr.x)<1,'가장 가까운 적 자리에',[cx,pr.x]);
  B.run('room.enemies[1].hp=30;time=20.05;');T();const c2=[oldBody('e',6)];A.process(c2);ok(c2.filter(x=>x.sourcePath==='assets/r1139/ego/impact.webp').length===1,'같은 휘두름에서 또 맞아도 새로 터지지 않음');
  B.run('time=21.5;');T();const c3=[oldBody('e',6)];A.process(c3);ok(c3.length===1,'끝난 뒤엔 사라짐');
  B.sb.__mot={input:{basic:false,at:0},state:{clip:'idle',frame:0,dir:'e'}};B.run('time=21.6');T();B.run('room.enemies[0].hp=10;time=21.7;');T();const c4=[oldBody('e',6)];A.process(c4);ok(c4.length===1,'기본 공격이 아닐 때 줄어든 체력(탄·독)은 적중 그림 없음');
  B.sb.__mot={input:{basic:true,at:1},state:{clip:'attack',frame:6,dir:'e'}};B.run('time=21.8');T();B.run('room.enemies[0].hp=5;time=21.82;');T();const c5=[oldBody('e',6)];A.process(c5);ok(c5.filter(x=>x.sourcePath==='assets/r1139/ego/impact.webp').length===1,'다음 휘두름에는 다시 한 번');}
 // ⑥ 아이콘
 {const css=String(A.iconCss());ok(['#attackIcon','#blinkIcon','#guardIcon','#specialIcon','#egoIcon','story-wer-w','story-wer-r'].every(s=>css.includes(s))&&css.includes('assets/r1139/ego/icons.webp'),'아이콘 7칸 CSS(기존 EGO 칸만)');
  ok(!/autoIcon/.test(css),'전투 보조 등 다른 칸은 건드리지 않음');
  ok((css.match(/body\.ego-dots-r1139b/g)||[]).length>=7&&!/(^|\})\s*#/.test(css),'모든 규칙이 EGO 표시 클래스 아래(다른 영웅 아이콘 불변)');
  B.sb.__hooks.__r1139b.tick();ok(B.cls.has('ego-dots-r1139b'),'EGO 형상: 표시 클래스 켜짐');B.sb.__form=false;B.sb.__hooks.__r1139b.tick();ok(!B.cls.has('ego-dots-r1139b'),'형상 풀리면 꺼짐');B.sb.__form=true;}
 ok(A.THRUST&&A.THRUST.connected===false&&typeof A.THRUST.why==='string'&&A.THRUST.why.length>10,'찌르기: 연결하지 않음 + 까닭 기록');
 // 그림 못 받음 → 기존 동작
 {const N2=boot({noImages:true});const c=[oldBody('e',6),oldSlash(true,false)];N2.A.process(c);ok(c[0].sourcePath.includes('r1048/ego')&&c[1].sourcePath.includes('ego_slash'),'새 그림을 아직 못 받았으면 기존 동작·궤적 유지(투명 영웅 없음)');}
 // 끄기
 {const O=boot({off:true});const c=[oldBody('e',6)];O.A.process(c);O.sb.__hooks?.__r1139b?.tick();ok(c[0].sourcePath.includes('r1048')&&!O.cls.has('ego-dots-r1139b')&&O.A.inspect().on===false,'끄기(storyworld.r1139b.egoDots on:false): 아무것도 안 함');}
 ok(A.inspect().stats.errors===0,'오류 0',A.inspect().lastError);
}
console.log(`\nR1139b CPU 검사: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
