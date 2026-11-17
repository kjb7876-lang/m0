// R1104b 실패 먼저: 페르소나 '순수악의' 보스 걷기를 Dots CX-0120PW 3방향 8칸 시트(아래·위·옆, 다듬은 webp)로 바꾼다.
//  R1104 코드 걸음(몸 그림을 상체·하체 조각으로 나눠 흔들기)은 시트를 못 읽었을 때·각성형(awake)일 때만 남는다.
// 검사: ① 서 있으면 그대로 ② 옆(base-2)으로 걸으면 몸 그림 한 장이 옆 시트 칸으로 바뀜(조각 없음) ③ 발 기준점(시트 발선 가운데)이 원래 그림 발 자리에 붙음
//       ④ 2초 걸으면 8칸 중 6칸 이상이 앞으로 차례로 넘어감 ⑤ 바라보는 쪽과 반대로 움직이면 칸이 거꾸로 ⑥ base-6 은 옆 시트 좌우 뒤집기
//       ⑦ 방향 표: 0·1 아래, 7 아래 뒤집기, 3·4 위, 5 위 뒤집기 ⑧ 각성형은 코드 걸음 그대로 ⑨ 시트 못 읽으면 코드 걸음 ⑩ 수묵(R1097) 켜짐이면 수묵으로 구운 칸
//       ⑪ 끄기 ⑫ 빌드 연결(자산 3장·runtime-inputs·다듬기 스크립트)
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'../..'),FILE=path.join(ROOT,'client-source/persona-stride-r1104.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const SRC=fs.readFileSync(FILE,'utf8');
function world(o={}){
 const persona={id:'cult04:inner-evil-rc133',persona:true,boss:true,hp:100,x:10,y:10,spawnState:'active'};
 let seen=null;const proto={render(frame){seen=frame.commands.map(c=>({...c,points:c.points&&c.points.map(p=>Array.isArray(p)?[...p]:p),sourceRect:c.sourceRect&&[...c.sourceRect]}));}};
 const store={},timers=[],images=[];
 const ctx2d=cv=>({drawImage(){},getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4),width:w,height:h}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4),width:w,height:h}),putImageData(){},clearRect(){},save(){},restore(){},scale(){},translate(){}});
 const document={createElement:t=>{const cv={tagName:t,width:300,height:150};cv.getContext=()=>ctx2d(cv);return cv;},baseURI:'http://x/'};
 class Img{constructor(){images.push(this);this.naturalWidth=0;this.naturalHeight=0;}set src(v){this._src=v;}get src(){return this._src;}}
 const C={Math,Number,JSON,Object,Array,Map,Set,WeakMap,WeakSet,String,Error,URL,console,Uint8ClampedArray,time:0,room:{id:'cult04',enemies:[persona]},
  setInterval:()=>0,setTimeout:(f)=>{timers.push(f);return timers.length;},StoryPhase1:{ThreeRenderer:{prototype:proto}},
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};
 if(!o.noDom){C.document=document;C.Image=Img;}
 if(o.ink){C.__STORYWORLD_PERSONA_INK_R1097__={inspect:()=>({half:false}),inkify:(d,w,h,opt)=>{const p=opt.pad|0;return {data:new Uint8ClampedArray((w+2*p)*(h+2*p)*4),width:w+2*p,height:h+2*p,pad:p,solid:true};},
  process:cmds=>{for(const c of cmds){const m=/rc133\/art\/(base|awake)-(\d)/.exec(c.sourcePath||'');if(!m||c.r1097)continue;const P=c.points,k=26*86/344;
   c.r1097=true;c.sourcePath='r1097:ink:'+m[1]+'-'+m[2];c.sourceRect=[0,0,396,452];c.imageSize=[396,452];c.points=[[P[0][0]-k,P[0][1]-k],[P[1][0]+k,P[1][1]-k],[P[2][0]+k,P[2][1]+k],[P[3][0]-k,P[3][1]+k]];}}};}
 C.window=C;vm.createContext(C);vm.runInContext(SRC,C);
 const body=(dir=2,kind='base',extra={})=>({kind:'image',owner:{kind:'enemy'},sourcePath:`assets/rc133/art/${kind}-${dir}.png`,image:{},sourceRect:[0,0,344,400],imageSize:[344,400],style:{globalAlpha:1},
  points:[[500,150],[586,150],[586,250],[500,250]],...extra});
 const frame=cmds=>{proto.render.call({}, {commands:cmds});return seen;};
 // 시트 그림 읽기 끝내기(가짜 Image onload) + 대기 중인 굽기 모두 돌리기
 const load=()=>{for(let n=0;n<200;n++){let did=false;for(const im of images)if(im._src&&!im._done&&typeof im.onload==='function'){im._done=true;im.naturalWidth=4096;im.naturalHeight=512;im.width=4096;im.height=512;im.onload();did=true;}
   while(timers.length){timers.shift()();did=true;}if(!did)break;}};
 // 걷기: 화면 방향(sx: +오른쪽, sy: +아래)으로 v 칸/초
 const walk=(sec,dir,{sx=0,sy=0,v=2.4,dt=1/30,kind='base',each}={})=>{let out=null;const n=Math.hypot(sx,sy)||1;
  for(let t=0;t<sec-1e-9;t+=dt){C.time+=dt;const ex=(sx/n+sy/n)/2*Math.SQRT2,ey=(sy/n-sx/n)/2*Math.SQRT2;persona.x+=v*dt*ex;persona.y+=v*dt*ey;out=frame([body(dir,kind)]);if(each)each(out);}return out;};
 return {C,persona,body,frame,walk,load,images,api:()=>C.__STORYWORLD_PERSONA_STRIDE_R1104__};}
const bodies=cmds=>cmds.filter(c=>/rc133\/art\/|r1097:ink|r1104b:walk/.test(String(c.sourcePath)));
const sheetOf=c=>{const m=/^r1104b:walk:(front|rear|side):(\d):(raw|ink)$/.exec(String(c.sourcePath));return m?{sheet:m[1],f:+m[2],kind:m[3]}:null;};
const at=(c,u,v)=>{const P=c.points,W=c.sourceRect[2],H=c.sourceRect[3],a=u/W,b=v/H;const L=(p,q,k)=>[p[0]+(q[0]-p[0])*k,p[1]+(q[1]-p[1])*k];return L(L(P[0],P[1],a),L(P[3],P[2],a),b);};
// 0
{const w=world();const a=w.api();ok(a&&typeof a.sheets==='function'&&a.walkSheets&&a.walkSheets.front&&a.walkSheets.rear&&a.walkSheets.side,'0) API(sheets()·walkSheets 3방향)');}
// ① 서 있음
{const w=world();w.load();let out;for(let i=0;i<30;i++){w.C.time+=1/30;out=w.frame([w.body(2)]);w.load();}const b=bodies(out);ok(b.length===1&&b[0].sourcePath==='assets/rc133/art/base-2.png'&&JSON.stringify(b[0].points)===JSON.stringify(w.body().points),'① 서 있으면 몸 그림 그대로');}
// ② ③ 옆 걷기
{const w=world();w.walk(.2,2,{sx:-1});w.load();const out=w.walk(.6,2,{sx:-1});const b=bodies(out),s=b[0]&&sheetOf(b[0]);
 ok(b.length===1&&s&&s.sheet==='side'&&s.kind==='raw','② 옆(base-2) 걸음 = 옆 시트 칸 한 장('+(b[0]&&b[0].sourcePath)+', 몸 명령 '+b.length+')');
 ok(b.length===1&&!b[0].r1104,'② 코드 걸음 조각 없음');
 if(s){const a=w.api(),ws=a.walkSheets.side,foot=at(b[0],ws.ax,ws.ground),P=w.body().points,want=[P[0][0]+(P[1][0]-P[0][0])*a.art.ax/344,P[0][1]+(P[3][1]-P[0][1])*a.art.ground/400];
  ok(Math.hypot(foot[0]-want[0],foot[1]-want[1])<.75,'③ 시트 발 기준점이 원래 그림 발 자리에('+foot.map(v=>v.toFixed(2))+' vs '+want.map(v=>v.toFixed(2))+')');
  const top=at(b[0],ws.ax,ws.ground-a.art.sheetH),wantTop=P[0][1]+(P[3][1]-P[0][1])*(a.art.ground-a.art.height)/400;ok(Math.abs(top[1]-wantTop)<1,'③ 키가 원래 그림 키와 같음');}}
// ④ 칸 넘어감 · ⑤ 걷는 쪽으로 시트(몸 그림이 다른 쪽을 봐도)
{const seq=(sx,dir=2,sy=0)=>{const w=world();w.walk(.2,dir,{sx,sy});w.load();const fs=[],sh=[];w.walk(2,dir,{sx,sy,each:o=>{const b=bodies(o)[0],s=b&&sheetOf(b);if(s){fs.push(s.f);sh.push(s.sheet+(b.points[1][0]<b.points[0][0]?':flip':''));}}});return {fs,sh};};
 const steps=fs=>{let fw=0,bw=0;for(let i=1;i<fs.length;i++){const d=(fs[i]-fs[i-1]+8)%8;if(d>0&&d<4)fw++;else if(d>4)bw++;}return {fw,bw};};
 const a=seq(-1),st=steps(a.fs);ok(new Set(a.fs).size>=6&&st.fw>=8&&st.bw===0,'④ 2초에 '+new Set(a.fs).size+'칸, 앞으로 '+st.fw+'번·뒤로 '+st.bw+'번');
 const b=seq(-1,0),sb=steps(b.fs);ok(b.sh.length&&b.sh.every(v=>v==='side')&&sb.fw>=8&&sb.bw===0,'⑤ 정면(base-0)을 봐도 왼쪽으로 걸으면 옆 시트로 앞으로 걷기('+[...new Set(b.sh)]+', 앞 '+sb.fw+'·뒤 '+sb.bw+')');
 const c=seq(1,2),sc=steps(c.fs);ok(c.sh.length&&c.sh.every(v=>v==='side:flip')&&sc.fw>=8&&sc.bw===0,'⑤ 왼쪽(base-2)을 봐도 오른쪽으로 걸으면 옆 시트 뒤집어 앞으로 걷기('+[...new Set(c.sh)]+', 앞 '+sc.fw+'·뒤 '+sc.bw+')');}
// ⑥ ⑦ 걷는 방향 표(몸 그림 방향과 상관없이)
{const want=[[6,{sx:1},'side',1],[2,{sx:-1},'side',0],[4,{sy:1},'front',0],[2,{sy:1},'front',0],[0,{sy:-1},'rear',0],[6,{sy:-1},'rear',0],[0,{sx:-1,sy:.4},'side',0],[0,{sx:.2,sy:1},'front',0]];
 for(const [d,mv,sh,mir] of want){const w=world();w.walk(.2,d,mv);w.load();const b=bodies(w.walk(.3,d,mv))[0],s=b&&sheetOf(b);const flipped=b&&b.points[1][0]<b.points[0][0];
  ok(s&&s.sheet===sh&&flipped===!!mir,(d===6&&mv.sx?'⑥':'⑦')+' base-'+d+' 화면 '+JSON.stringify(mv)+' → '+sh+(mir?' 뒤집기':'')+' (받은: '+(s?s.sheet:b&&b.sourcePath)+(flipped?' 뒤집기':'')+')');}}
// ⑧ 각성형 — R1119 사용자 지시(2026-11-17, 드라이브 '01_먼저읽기': 각성 중 걷기도 기본형 걷기 시트 + 국소 발광, 사용자 04:53Z 검사 수정 허락)로 기대값 변경: 코드 걸음 조각 → 기본형 옆 시트 칸 한 장
{const w=world();w.walk(.2,2,{sx:-1,kind:'awake'});w.load();const out=w.walk(.6,2,{sx:-1,kind:'awake'});const b=bodies(out),s=b[0]&&sheetOf(b[0]);ok(b.length===1&&s&&s.sheet==='side','⑧ 각성형도 기본형 걷기 시트 칸('+b.length+', '+(b[0]&&b[0].sourcePath)+')');}
// ⑨ 못 읽음
{const w=world();const out=w.walk(.8,2,{sx:-1});const b=bodies(out);ok(b.length>=3&&b.every(c=>!sheetOf(c)),'⑨ 시트를 아직 못 읽으면 코드 걸음 조각('+b.length+')');
 const w2=world({noDom:true});const b2=bodies(w2.walk(.8,2,{sx:-1}));ok(b2.length>=3,'⑨ document·Image 없는 곳에서도 오류 없이 코드 걸음');}
// ⑩ 수묵
{const w=world({ink:true});w.walk(.2,2,{sx:-1});w.load();w.walk(.1,2,{sx:-1});w.load();const out=w.walk(.4,2,{sx:-1});const b=bodies(out),s=b[0]&&sheetOf(b[0]);
 ok(b.length===1&&s&&s.kind==='ink'&&b[0].r1097===true,'⑩ 수묵 켜짐이면 수묵으로 구운 칸('+(b[0]&&b[0].sourcePath)+')');
 if(s){const a=w.api(),ws=a.walkSheets.side,pad=b[0].r1104bPad,foot=at(b[0],ws.ax+pad,ws.ground+pad),P=w.body().points,want=[P[0][0]+(P[1][0]-P[0][0])*a.art.ax/344,P[0][1]+(P[3][1]-P[0][1])*a.art.ground/400];
  ok(Number.isFinite(pad)&&pad>0&&Math.hypot(foot[0]-want[0],foot[1]-want[1])<.75,'⑩ 수묵 칸도 발 자리 같음(여백 '+pad+')');}}
// ⑬ R409 테두리판(게임에서 실제로 오는 몸 그림 경로)
{const w=world();const r=6,mk=()=>w.body(2,'base',{sourcePath:'r409:outline:enemy:u:http://x/m0/assets/rc133/art/base-2.png:0,0,344,400:'+r+':enemy',sourceRect:[0,0,344+2*r,400+2*r],imageSize:[344+2*r,400+2*r]});
 const walk=(sec,each)=>{let out;for(let t=0;t<sec;t+=1/30){w.C.time+=1/30;w.persona.x-=2.4/30*Math.SQRT1_2;w.persona.y+=2.4/30*Math.SQRT1_2;out=w.frame([mk()]);}return out;};
 walk(.2);w.load();const out=walk(.5),b=out.filter(c=>/r409|r1104b/.test(String(c.sourcePath))),s=b[0]&&sheetOf(b[0]);
 ok(b.length===1&&s&&s.sheet==='side','⑬ R409 테두리판 몸 그림도 옆 시트로('+(b[0]&&b[0].sourcePath)+', '+b.length+')');
 if(s){const a=w.api(),ws=a.walkSheets.side,foot=at(b[0],ws.ax,ws.ground),P=mk().points,cw=344+2*r,ch=400+2*r,want=[P[0][0]+(P[1][0]-P[0][0])*(a.art.ax+r)/cw,P[0][1]+(P[3][1]-P[0][1])*(a.art.ground+r)/ch];
  ok(Math.hypot(foot[0]-want[0],foot[1]-want[1])<.75,'⑬ 테두리 여백을 빼고 발 자리 맞춤');}}
// ⑭ 보스 공통 R620 걸음 출렁임(몸 그림 네 점을 들었다 놓음)은 시트에서는 빼서 발이 땅에 붙음
{const w=world();w.C.project=(x,y)=>({x:543+(x-y)*16-(10-10)*0,y:250+(x+y)*8-160});let bob=0;
 const mk=()=>{const b=w.body(2);if(bob)b.points=b.points.map(p=>[p[0],p[1]-bob]);return b;};
 // 서 있을 때(발 자리 재기) — 몸 그림 사각형을 project 에 묶어 둔다
 const place=b=>{const g=w.C.project(w.persona.x,w.persona.y),dx=g.x-543,dy=g.y-250;b.points=b.points.map(p=>[p[0]+dx,p[1]+dy]);return b;};
 for(let i=0;i<20;i++){w.C.time+=1/30;w.frame([place(mk())]);}
 w.load();const offs=[];
 for(let i=0;i<45;i++){w.C.time+=1/30;bob=3*Math.abs(Math.sin(i*.7));w.persona.x-=2.4/30*Math.SQRT1_2;w.persona.y+=2.4/30*Math.SQRT1_2;const out=w.frame([place(mk())]),b=bodies(out)[0],s=b&&sheetOf(b);
  if(s){const ws=w.api().walkSheets[s.sheet],f=at(b,ws.ax,ws.ground),g=w.C.project(w.persona.x,w.persona.y);offs.push(f[1]-g.y);}}
 const P=w.body().points,base=250+(385/400)*100-250;const rng=offs.length?Math.max(...offs)-Math.min(...offs):99;
 ok(offs.length>20&&rng<.5,'⑭ R620 출렁임(최대 3px)을 빼서 발 자리 높이 흔들림 '+rng.toFixed(2)+'px < 0.5px');}
// ⑪ 끄기
{const w=world();w.api().set(false);w.walk(.2,2,{sx:-1});w.load();const b=bodies(w.walk(.6,2,{sx:-1}));ok(b.length===1&&b[0].sourcePath==='assets/rc133/art/base-2.png','⑪ 끄면 바꾸지 않음');}
// ⑫ 빌드 연결
{const inputs=fs.readFileSync(path.join(ROOT,'runtime-inputs.json'),'utf8');
 for(const k of ['front','rear','side']){const p='assets/r1104b/persona-walk-'+k+'.webp',f=path.join(ROOT,'runtime-text',p);ok(fs.existsSync(f)&&fs.statSync(f).size>20000&&inputs.includes(p),'⑫ '+p+' 있음·runtime-inputs 등록');
  ok(SRC.includes(p),'⑫ 코드가 '+p+' 를 씀');}
 ok(fs.existsSync(path.join(__dirname,'build-walk-sheets.py')),'⑫ 다듬기 스크립트 남김');
 ok(fs.readFileSync(path.join(ROOT,'runtime-text/persona-stride-r1104.js'),'utf8')===SRC,'⑫ runtime-text 사본 같음');}
console.log(fails?'R1104b persona-walk-sheets FAILED '+fails:'R1104b persona-walk-sheets PASSED');process.exit(fails?1:0);
