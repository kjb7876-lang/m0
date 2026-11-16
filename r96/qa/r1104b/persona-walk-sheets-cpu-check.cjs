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
// ④ 칸 넘어감 · ⑤ 거꾸로
{const seq=(sx,dir=2)=>{const w=world();w.walk(.2,dir,{sx});w.load();const fs=[];w.walk(2,dir,{sx,each:o=>{const s=bodies(o)[0]&&sheetOf(bodies(o)[0]);if(s)fs.push(s.f);}});return fs;};
 const steps=fs=>{let fw=0,bw=0;for(let i=1;i<fs.length;i++){const d=(fs[i]-fs[i-1]+8)%8;if(d>0&&d<4)fw++;else if(d>4)bw++;}return {fw,bw};};
 const f=seq(-1),st=steps(f);ok(new Set(f).size>=6&&st.fw>=8&&st.bw===0,'④ 2초에 '+new Set(f).size+'칸, 앞으로 '+st.fw+'번·뒤로 '+st.bw+'번');
 const r=seq(1),sr=steps(r);ok(sr.bw>=8&&sr.fw===0,'⑤ 반대로 움직이면 칸이 거꾸로(뒤로 '+sr.bw+'번·앞으로 '+sr.fw+'번)');}
// ⑥ ⑦ 방향 표
{const want={0:['front',0,{sy:1}],1:['front',0,{sy:1}],7:['front',1,{sy:1}],2:['side',0,{sx:-1}],6:['side',1,{sx:1}],3:['rear',0,{sy:-1}],4:['rear',0,{sy:-1}],5:['rear',1,{sy:-1}]};
 for(const [d,[sh,mir,mv]] of Object.entries(want)){const w=world();w.walk(.2,+d,mv);w.load();const b=bodies(w.walk(.3,+d,mv))[0],s=b&&sheetOf(b);const flipped=b&&b.points[1][0]<b.points[0][0];
  ok(s&&s.sheet===sh&&flipped===!!mir,(d==='6'?'⑥':'⑦')+' base-'+d+' → '+sh+(mir?' 뒤집기':'')+' (받은: '+(s?s.sheet:b&&b.sourcePath)+(flipped?' 뒤집기':'')+')');}}
// ⑧ 각성형
{const w=world();w.walk(.2,2,{sx:-1,kind:'awake'});w.load();const out=w.walk(.6,2,{sx:-1,kind:'awake'});const b=bodies(out);ok(b.length>=3&&b.every(c=>!sheetOf(c)),'⑧ 각성형은 코드 걸음 조각('+b.length+')');}
// ⑨ 못 읽음
{const w=world();const out=w.walk(.8,2,{sx:-1});const b=bodies(out);ok(b.length>=3&&b.every(c=>!sheetOf(c)),'⑨ 시트를 아직 못 읽으면 코드 걸음 조각('+b.length+')');
 const w2=world({noDom:true});const b2=bodies(w2.walk(.8,2,{sx:-1}));ok(b2.length>=3,'⑨ document·Image 없는 곳에서도 오류 없이 코드 걸음');}
// ⑩ 수묵
{const w=world({ink:true});w.walk(.2,2,{sx:-1});w.load();w.walk(.1,2,{sx:-1});w.load();const out=w.walk(.4,2,{sx:-1});const b=bodies(out),s=b[0]&&sheetOf(b[0]);
 ok(b.length===1&&s&&s.kind==='ink'&&b[0].r1097===true,'⑩ 수묵 켜짐이면 수묵으로 구운 칸('+(b[0]&&b[0].sourcePath)+')');
 if(s){const a=w.api(),ws=a.walkSheets.side,pad=b[0].r1104bPad,foot=at(b[0],ws.ax+pad,ws.ground+pad),P=w.body().points,want=[P[0][0]+(P[1][0]-P[0][0])*a.art.ax/344,P[0][1]+(P[3][1]-P[0][1])*a.art.ground/400];
  ok(Number.isFinite(pad)&&pad>0&&Math.hypot(foot[0]-want[0],foot[1]-want[1])<.75,'⑩ 수묵 칸도 발 자리 같음(여백 '+pad+')');}}
// ⑪ 끄기
{const w=world();w.api().set(false);w.walk(.2,2,{sx:-1});w.load();const b=bodies(w.walk(.6,2,{sx:-1}));ok(b.length===1&&b[0].sourcePath==='assets/rc133/art/base-2.png','⑪ 끄면 바꾸지 않음');}
// ⑫ 빌드 연결
{const inputs=fs.readFileSync(path.join(ROOT,'runtime-inputs.json'),'utf8');
 for(const k of ['front','rear','side']){const p='assets/r1104b/persona-walk-'+k+'.webp',f=path.join(ROOT,'runtime-text',p);ok(fs.existsSync(f)&&fs.statSync(f).size>20000&&inputs.includes(p),'⑫ '+p+' 있음·runtime-inputs 등록');
  ok(SRC.includes(p),'⑫ 코드가 '+p+' 를 씀');}
 ok(fs.existsSync(path.join(__dirname,'build-walk-sheets.py')),'⑫ 다듬기 스크립트 남김');
 ok(fs.readFileSync(path.join(ROOT,'runtime-text/persona-stride-r1104.js'),'utf8')===SRC,'⑫ runtime-text 사본 같음');}
console.log(fails?'R1104b persona-walk-sheets FAILED '+fails:'R1104b persona-walk-sheets PASSED');process.exit(fails?1:0);
