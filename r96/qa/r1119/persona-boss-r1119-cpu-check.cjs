// R1119 실패 먼저: 구글 드라이브 11-16·11-17 Dots 검토본으로 페르소나 '순수악의' 보스 마무리(사용자 2026-11-17 04:38Z
//  "구글드라이브 페르소나 어제오늘 올라온거 기반으로 개선적용해서 페르소나영웅및 보스완성"). 드라이브 '01_먼저읽기' 지시를 따른다.
// 검사(R1104 몸 그림 + R1119 탄 그림 + R1096 검은 우물별):
//  ① 각성형도 걸을 때 기본형 걷기 시트 칸(코드 걸음 조각 아님) ② 각성 걷기에만 구슬·망토 가장자리 국소 발광(lighter, 몸과 다른 key) — 기본형 걷기·서 있기엔 없음, 전신 필터 없음
//  ③ 피격(hp 감소) → 방향·형태 맞는 피격 4칸이 차례로, 0.375초 뒤 원래 그림 ④ 0.6초 안 연타는 다시 시작 안 함 ⑤ 시전 중엔 피격 그림 안 씀(시전 끊김 방지)
//  ⑥ 시전(rangedWindup·tell) 중 구슬 발광 한 개(얼굴 아님: 정면 구슬 자리 부근), 평소엔 없음 ⑦ 결전 끝(hp 0·completed) → 마지막 몸 자리에 빛 소멸 16칸, 끝나면 아무것도 없음
//  ⑧ 탄 그림: clock·diamond·star·lance·shield·vortex 는 비행 칸이 시간 따라 넘어감, 사라지면 접촉·소멸 6칸 뒤 끝. small-orb·eye·eclipse 는 그대로
//  ⑨ 탄 칸 크기·회전: 원래 탄 사각형의 축을 따른다(lance 는 384칸이라 1.5배) ⑩ 끄기 ⑪ 빌드 연결(자산·runtime-inputs·index·verify·pages.yml) ⑫ 검은 우물별 PM-2 r2 시트
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'../..'),FILE=path.join(ROOT,'client-source/persona-stride-r1104.js'),FX=path.join(ROOT,'client-source/persona-skill-fx-r1119.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const SRC=fs.readFileSync(FILE,'utf8'),FXSRC=fs.existsSync(FX)?fs.readFileSync(FX,'utf8'):'';
function world(o={}){
 const persona={id:'cult04:inner-evil-rc133',persona:true,boss:true,hp:100,x:10,y:10,spawnState:'active'};
 let seen=null;const proto={render(frame){seen=frame.commands.map(c=>({...c,points:c.points&&c.points.map(p=>Array.isArray(p)?[...p]:p),sourceRect:c.sourceRect&&[...c.sourceRect]}));}};
 const store={},timers=[],images=[];
 const ctx2d=cv=>({drawImage(){},getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4),width:w,height:h}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4),width:w,height:h}),putImageData(){},clearRect(){},save(){},restore(){},scale(){},translate(){},fillRect(){},
  createRadialGradient:()=>({addColorStop(){}}),set filter(v){},get filter(){return 'none';},set globalCompositeOperation(v){},set fillStyle(v){},set globalAlpha(v){}});
 const document={createElement:t=>{const cv={tagName:t,width:300,height:150};cv.getContext=()=>ctx2d(cv);return cv;},baseURI:'http://x/'};
 class Img{constructor(){images.push(this);this.naturalWidth=0;this.naturalHeight=0;}set src(v){this._src=v;}get src(){return this._src;}}
 const C={Math,Number,JSON,Object,Array,Map,Set,WeakMap,WeakSet,String,Error,URL,console,Uint8ClampedArray,time:0,room:{id:'cult04',enemies:[persona],persona:{phase:'fight'}},
  setInterval:()=>0,setTimeout:(f)=>{timers.push(f);return timers.length;},StoryPhase1:{ThreeRenderer:{prototype:proto}},
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};
 C.performance={now:()=>C.time*1000};
 if(!o.noDom){C.document=document;C.Image=Img;}
 C.window=C;vm.createContext(C);vm.runInContext(SRC,C);if(FXSRC)vm.runInContext(FXSRC,C);
 const body=(dir=0,kind='base',extra={})=>({kind:'image',key:'cult04:inner-evil-rc133:0',order:5,owner:{kind:'enemy',id:'cult04:inner-evil-rc133'},sourcePath:`assets/rc133/art/${kind}-${dir}.png`,image:{},sourceRect:[0,0,344,400],imageSize:[344,400],style:{globalAlpha:1},
  points:[[500,150],[586,150],[586,250],[500,250]],...extra});
 const frame=cmds=>{proto.render.call({}, {commands:cmds});return seen;};
 const load=()=>{for(let n=0;n<400;n++){let did=false;for(const im of images)if(im._src&&!im._done&&typeof im.onload==='function'){im._done=true;im.naturalWidth=8192;im.naturalHeight=512;im.width=8192;im.height=512;im.onload();did=true;}
   while(timers.length){timers.shift()();did=true;}if(!did)break;}};
 const walk=(sec,dir,{sx=0,sy=0,v=2.4,dt=1/30,kind='base',each}={})=>{let out=null;const n=Math.hypot(sx,sy)||1;
  for(let t=0;t<sec-1e-9;t+=dt){C.time+=dt;const ex=(sx/n+sy/n)/2*Math.SQRT2,ey=(sy/n-sx/n)/2*Math.SQRT2;persona.x+=v*dt*ex;persona.y+=v*dt*ey;out=frame([body(dir,kind)]);if(each)each(out);}return out;};
 const stand=(sec,dir=0,kind='base',each,extra)=>{let out=null;for(let t=0;t<sec-1e-9;t+=1/30){C.time+=1/30;out=frame(extra?[body(dir,kind),...extra()]:[body(dir,kind)]);if(each)each(out);}return out;};
 return {C,persona,body,frame,walk,stand,load,images,api:()=>C.__STORYWORLD_PERSONA_STRIDE_R1104__,fx:()=>C.__STORYWORLD_PERSONA_SKILL_FX_R1119__};}
const bodies=cmds=>cmds.filter(c=>/rc133\/art\/|r1097:ink|r1104b:walk|r1119:(hit|death)/.test(String(c.sourcePath)));
const glows=cmds=>cmds.filter(c=>/^r1119:glow/.test(String(c.sourcePath)));
const sheetOf=c=>{const m=/^r1104b:walk:(front|rear|side):(\d):(raw|ink)$/.exec(String(c.sourcePath));return m?{sheet:m[1],f:+m[2],kind:m[3]}:null;};
const hitOf=c=>{const m=/^r1119:hit:(base|awake)-(front|side|rear):(\d+):(raw|ink)$/.exec(String(c.sourcePath));return m?{form:m[1],dir:m[2],f:+m[3]}:null;};
// ① ② 각성 걷기
{const w=world();w.walk(.2,2,{sx:-1,kind:'awake'});w.load();const out=w.walk(.6,2,{sx:-1,kind:'awake'});const b=bodies(out),s=b[0]&&sheetOf(b[0]);
 ok(b.length===1&&s&&s.sheet==='side','① 각성형 옆 걸음도 기본형 걷기 시트 칸 한 장('+(b[0]&&b[0].sourcePath)+', 몸 명령 '+b.length+')');
 const g=glows(out);ok(g.some(c=>/cape/.test(c.sourcePath))&&g.some(c=>/orb/.test(c.sourcePath)),'② 각성 걷기: 망토 가장자리·구슬 발광 명령('+g.map(c=>c.sourcePath)+')');
 ok(g.length>0&&g.every(c=>c.style&&c.style.globalCompositeOperation==='lighter'&&c.key!==b[0].key&&c.owner&&c.owner.kind==='effect'),'② 발광은 lighter·몸과 다른 key·이펙트 소유');
 ok(b[0]&&(!b[0].style||!b[0].style.filter||b[0].style.filter==='none'),'② 몸 그림에 전신 필터 없음');
 const w2=world();w2.walk(.2,2,{sx:-1});w2.load();const o2=w2.walk(.6,2,{sx:-1});ok(glows(o2).length===0,'② 기본형 걷기엔 발광 없음');
 const w3=world();w3.load();const o3=w3.stand(.5,0,'awake');ok(glows(o3).length===0,'② 각성 서 있기(시전 아님)엔 걷기 발광 없음');}
// ③ ④ ⑤ 피격
{const seqHit=(dir,kind,{cast=false}={})=>{const w=world();w.load();w.stand(.3,dir,kind);w.load();if(cast)w.persona.rangedWindup=.6;w.persona.hp-=5;const seen=[];
  const pts=[];w.stand(1,dir,kind,o=>{const b=bodies(o);seen.push(b.length===1?(hitOf(b[0])||b[0].sourcePath):'n'+b.length);pts.push(b[0]&&b[0].points);});return {w,seen,pts};};
 // 정면·뒤 = 4칸(0.375초), 옆 = 사용자 확정(11-17 04:56Z) 한 발 후퇴 6칸(0.58초) + 끝 자세 오프셋 0.15초 되돌림
 for(const [dir,kind,want,n] of [[0,'base','base-front',4],[2,'awake','awake-side',6],[4,'base','base-rear',4],[6,'awake','awake-side',6]]){
  const {w,seen,pts}=seqHit(dir,kind),h=seen.filter(x=>typeof x==='object');const fr=[...new Set(h.map(x=>x.f))];
  ok(h.length>=n+2&&h.every(x=>x.form+'-'+x.dir===want)&&fr.join()===[...Array(n).keys()].join(),'③ '+kind+'-'+dir+' 피격 → '+want+' '+n+'칸 차례('+fr+', '+h.length+'장)');
  const last=seen.slice(-3);ok(last.every(x=>x==='assets/rc133/art/'+kind+'-'+dir+'.png'),'③ 끝나면 원래 그림('+JSON.stringify(last[0])+')');
  const P0=w.body().points,lastP=pts.at(-1);ok(lastP&&Math.abs(lastP[0][0]-P0[0][0])<.01,'③ 마지막엔 원래 자리(실제 좌표 그대로: x '+w.persona.x.toFixed(2)+')');
  if(n===6){const i=seen.findIndex((x,j)=>j>0&&typeof seen[j-1]==='object'&&typeof x!=='object'),dx=pts[i]&&pts[i][0][0]-P0[0][0],side=dir===2?1:-1,unit=(P0[1][0]-P0[0][0])/344;
   ok(i>0&&dx*side>0&&Math.abs(dx)<=8*Math.abs(unit)+.01,'③ 옆 피격 끝 → 원래 그림이 뒤쪽 오프셋에서 0 으로 되돌아감(첫 칸 '+(dx||0).toFixed(2)+'px)');
   ok(w.persona.x===10&&w.persona.y===10,'③ 실제 좌표·넉백 없음');}}
 {const w=world();w.load();w.stand(.3,6,'base');w.load();w.persona.hp-=5;const o=w.stand(.1,6,'base'),b=bodies(o)[0];ok(b&&hitOf(b)&&b.points[1][0]<b.points[0][0],'③ 오른쪽(6)은 옆 피격 시트 좌우 뒤집기');}
 {const w=world();w.load();w.stand(.3,0,'base');w.load();w.persona.hp-=5;w.stand(.3,0,'base');w.persona.hp-=5;const o=w.stand(.12,0,'base'),b=bodies(o)[0];
  ok(b&&b.sourcePath==='assets/rc133/art/base-0.png','④ 0.8초 안 연타는 다시 시작 안 함(0.42초째 '+(b&&b.sourcePath)+')');}
 {const {seen}=seqHit(0,'base',{cast:true});ok(seen.every(x=>typeof x!=='object'),'⑤ 시전 중 피격은 피격 그림 안 씀');}}
// ⑥ 시전 구슬 발광
{const w=world();w.load();w.stand(.3,0,'base');let o=w.stand(.1,0,'base');ok(glows(o).length===0,'⑥ 평소엔 구슬 발광 없음');
 w.persona.rangedWindup=.5;o=w.stand(.2,0,'base');const g=glows(o);ok(g.length===1&&/cast/.test(g[0].sourcePath)&&g[0].style.globalCompositeOperation==='lighter','⑥ 시전 중 구슬 발광 한 개('+g.map(c=>c.sourcePath)+')');
 if(g[0]){const cx=(g[0].points[0][0]+g[0].points[2][0])/2,cy=(g[0].points[0][1]+g[0].points[2][1])/2,P=w.body().points,ox=P[0][0]+(P[1][0]-P[0][0])*102/344,oy=P[0][1]+(P[3][1]-P[0][1])*156/400;
  ok(Math.hypot(cx-ox,cy-oy)<4,'⑥ 정면 구슬 자리(102,156)에 ('+cx.toFixed(1)+','+cy.toFixed(1)+' vs '+ox.toFixed(1)+','+oy.toFixed(1)+')');
  const faceY=P[0][1]+(P[3][1]-P[0][1])*82/400;ok(cy>faceY,'⑥ 얼굴(위 82px) 아래');}
 w.persona.rangedWindup=0;w.persona.tell=.4;o=w.stand(.1,0,'base');ok(glows(o).length===1,'⑥ tell 예고 중에도');
 const w2=world();w2.persona.rangedWindup=.5;w2.walk(.2,2,{sx:-1,kind:'awake'});w2.load();const o2=w2.walk(.4,2,{sx:-1,kind:'awake'});ok(glows(o2).filter(c=>/orb|cast/.test(c.sourcePath)).length===1,'⑥ 각성 걷기 + 시전이 겹쳐도 구슬 빛은 한 개');}
// ⑦ 사망 빛 소멸
{const w=world();w.load();w.stand(.3,0,'awake');w.load();w.persona.hp=0;w.C.room.persona.completed=true;const seen=[];
 for(let i=0;i<90;i++){w.C.time+=1/30;const o=w.frame([]);const d=o.filter(c=>/^r1119:death:/.test(String(c.sourcePath)));seen.push(d.length?+/:(\d+):/.exec(d[0].sourcePath)[1]:-1);if(i===3)w.C.__d0=d[0];}
 const fr=[...new Set(seen.filter(f=>f>=0))];ok(fr.length>=14&&fr[0]===0&&fr.at(-1)===15,'⑦ 빛 소멸 16칸 차례('+fr.length+'칸, '+fr[0]+'→'+fr.at(-1)+')');
 ok(seen.slice(-5).every(f=>f<0),'⑦ 끝나면 아무것도 없음');
 const d0=w.C.__d0;ok(d0&&/awake/.test(d0.sourcePath),'⑦ 각성형이었으면 각성 소멸 그림');
 if(d0){const P=w.body().points,fx=P[0][0]+(P[1][0]-P[0][0])*172/344,fy=P[0][1]+(P[3][1]-P[0][1])*385/400,L=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k],u=96/192,v=218.5/256,Q=d0.points,f=L(L(Q[0],Q[1],u),L(Q[3],Q[2],u),v);
  ok(Math.hypot(f[0]-fx,f[1]-fy)<1.5,'⑦ 발 자리 맞춤('+f.map(x=>x.toFixed(1))+')');}
 const w2=world();w2.load();w2.stand(.3,0,'base');w2.C.room={id:'cult03',enemies:[],persona:{}};let any=false;for(let i=0;i<30;i++){w2.C.time+=1/30;if(w2.frame([]).some(c=>/r1119:death/.test(String(c.sourcePath))))any=true;}ok(!any,'⑦ 결전 아닌데 페르소나가 사라지면(지역 이동) 소멸 안 그림');}
// ⑧ ⑨ 탄
{const shot=(key,id='p1',pts=[[300,300],[340,300],[340,340],[300,340]])=>({kind:'image',key:'proj:'+id,order:3,owner:{kind:'effect',id:'proj:'+id},sourcePath:'assets/rc134/persona-skills/'+key+'.png',image:{},sourceRect:[0,0,256,256],imageSize:[256,256],points:pts,style:{}});
 for(const key of ['clock','diamond','star','lance','shield','vortex']){const w=world();w.load();const fs_=[];let last=null;
  for(let i=0;i<20;i++){w.C.time+=1/30;const o=w.frame([shot(key)]),c=o.find(c=>c.key==='proj:p1');last=c;const m=/^r1119:fx:(\w+)-flight:(\d+)$/.exec(String(c&&c.sourcePath));fs_.push(m&&m[1]===key?+m[2]:-1);}
  w.load();for(let i=0;i<10;i++){w.C.time+=1/30;const o=w.frame([shot(key)]),c=o.find(c=>c.key==='proj:p1'),m=/^r1119:fx:(\w+)-flight:(\d+)$/.exec(String(c&&c.sourcePath));fs_.push(m?+m[2]:-1);last=c;}
  const got=fs_.slice(-10);ok(got.every(f=>f>=0)&&new Set(got).size>=3,'⑧ '+key+' 비행 칸이 넘어감('+[...new Set(got)]+')');
  if(last&&/r1119/.test(last.sourcePath)){const cx=(last.points[0][0]+last.points[2][0])/2,cy=(last.points[0][1]+last.points[2][1])/2,wd=Math.hypot(last.points[1][0]-last.points[0][0],last.points[1][1]-last.points[0][1]);
   const want=key==='lance'?60:40;ok(Math.abs(wd-want)<.6&&Math.hypot(cx-320,cy-320)<(key==='star'?5:.6),'⑨ '+key+' 크기 '+wd.toFixed(1)+'(원하는 '+want+')·가운데 맞춤');}
  const tail=[];for(let i=0;i<20;i++){w.C.time+=1/30;const o=w.frame([]),c=o.find(c=>/^r1119:fx:\w+-contact:/.test(String(c.sourcePath)));tail.push(c?+/:(\d+)$/.exec(c.sourcePath)[1]:-1);}
  const cf=[...new Set(tail.filter(f=>f>=0))];ok(cf.length>=5&&cf[0]===0&&cf.at(-1)===5&&tail.at(-1)===-1,'⑧ '+key+' 사라지면 접촉·소멸 6칸 뒤 끝('+cf+')');}
 {const w=world();w.load();const rot=[[300,300],[328.28,328.28],[300,356.57],[271.72,328.28]];let c;for(let i=0;i<10;i++){w.C.time+=1/30;c=w.frame([shot('lance','r',rot)]).find(c=>c.key==='proj:r');}
  const ux=[c.points[1][0]-c.points[0][0],c.points[1][1]-c.points[0][1]];ok(Math.abs(Math.atan2(ux[1],ux[0])-Math.PI/4)<.01,'⑨ 회전한 탄 사각형의 축을 따름');}
 for(const key of ['small-orb','eye','eclipse']){const w=world();w.load();let c;for(let i=0;i<10;i++){w.C.time+=1/30;c=w.frame([shot(key)]).find(c=>c.key==='proj:p1');}ok(c&&c.sourcePath==='assets/rc134/persona-skills/'+key+'.png','⑧ '+key+' 는 그대로(새 시트 없음)');}
 {const w=world();w.load();let c;const s=shot('clock');s.sourcePath='r409:outline:effect:u:http://x/m0/assets/rc134/persona-skills/clock.png:0,0,256,256:6:effect';s.sourceRect=[0,0,268,268];
  for(let i=0;i<10;i++){w.C.time+=1/30;c=w.frame([{...s}]).find(c=>c.key==='proj:p1');}ok(c&&/^r1119:fx:clock-flight/.test(c.sourcePath),'⑧ R409 테두리판 탄 경로도 알아봄('+(c&&c.sourcePath)+')');}}
// ⑩ 끄기
{const w=world();w.fx()&&w.fx().set(false);w.load();let c;for(let i=0;i<10;i++){w.C.time+=1/30;c=w.frame([{kind:'image',key:'proj:x',owner:{kind:'effect'},sourcePath:'assets/rc134/persona-skills/clock.png',sourceRect:[0,0,256,256],points:[[0,0],[1,0],[1,1],[0,1]]}])[0];}
 ok(w.fx()&&c.sourcePath==='assets/rc134/persona-skills/clock.png','⑩ 탄 그림 끄면 그대로');
 const w2=world();w2.api().set(false);w2.load();w2.stand(.3,0,'base');w2.persona.hp-=5;const b=bodies(w2.stand(.1,0,'base'))[0];ok(b&&b.sourcePath==='assets/rc133/art/base-0.png','⑩ 몸 그림 끄면 피격 그림도 안 씀');}
// ⑪ 빌드 연결
{const inputs=fs.readFileSync(path.join(ROOT,'runtime-inputs.json'),'utf8'),idx=fs.readFileSync(path.join(ROOT,'runtime-text/index.html'),'utf8');
 const want=['persona-hit-base-front','persona-hit-base-side','persona-hit-base-rear','persona-hit-awake-front','persona-hit-awake-side','persona-hit-awake-rear','persona-death-base','persona-death-awake',
  ...['clock','diamond','star','lance','shield','vortex'].flatMap(k=>['fx-'+k+'-flight','fx-'+k+'-contact']),'well-orb','well-floor'].map(n=>'assets/r1119/'+n+'.webp');
 const miss=want.filter(p=>{const f=path.join(ROOT,'runtime-text',p);return !(fs.existsSync(f)&&fs.statSync(f).size>10000&&inputs.includes(p));});ok(!miss.length,'⑪ 자산 '+want.length+'장 있음·runtime-inputs 등록(빠짐 '+miss.length+(miss.length?': '+miss.slice(0,3):'')+')');
 const all=SRC+FXSRC+fs.readFileSync(path.join(ROOT,'client-source/persona-gravity-r1096.js'),'utf8');const unused=want.filter(p=>!all.includes(p.replace(/\.webp$/,''))&&!all.includes(p.split('/').pop().replace(/\.webp$/,'')));ok(!unused.length,'⑪ 코드가 자산을 모두 씀(안 씀 '+unused+')');
 ok(/<script src="\.\/persona-stride-r1104\.js"><\/script>\n<script src="\.\/persona-skill-fx-r1119\.js"><\/script>/.test(idx),'⑪ index 스크립트 태그(stride 바로 뒤)');
 ok(fs.readFileSync(path.join(ROOT,'../scripts/verify-r96-public.py'),'utf8').includes('persona-skill-fx-r1119.js'),'⑪ 공개 검사 기대 목록');
 ok(fs.readFileSync(path.join(ROOT,'../.github/workflows/pages.yml'),'utf8').includes('r96/qa/r1119/persona-boss-r1119-cpu-check.cjs'),'⑪ pages.yml CPU 검사 줄');
 for(const f of ['persona-stride-r1104.js','persona-skill-fx-r1119.js','persona-gravity-r1096.js']){const a=path.join(ROOT,'client-source',f),b=path.join(ROOT,'runtime-text',f);ok(fs.existsSync(a)&&fs.existsSync(b)&&fs.readFileSync(a,'utf8')===fs.readFileSync(b,'utf8'),'⑪ runtime-text 사본 같음 '+f);}}
// ⑫ 검은 우물별 PM-2 r2
{const G=fs.readFileSync(path.join(ROOT,'client-source/persona-gravity-r1096.js'),'utf8');
 ok(/well:\s*\{[^}]*assets\/r1119\/well-orb\.webp/.test(G)&&/wellFloor:\s*\{[^}]*assets\/r1119\/well-floor\.webp/.test(G),'⑫ DSHEETS 에 PM-2 구·바닥 원반');
 const ab=(/function drawAbyss[\s\S]*?\n(?=function )/.exec(G)||[''])[0];ok(/dsheet\('wellFloor'/.test(ab)&&/dsheet\('well'/.test(ab),'⑫ drawAbyss 가 PM-2 시트를 먼저 그림(임시 라우렌 그림은 못 읽었을 때만)');}
console.log(fails?'R1119 persona-boss FAILED '+fails:'R1119 persona-boss PASSED');process.exit(fails?1:0);
