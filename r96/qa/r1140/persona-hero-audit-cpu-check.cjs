// R1140 실패 먼저(사용자 2026-11-18 03:20Z "페르소나영웅관련 모든것 전수조사 디버깅 및 개선").
// 전수 조사(qa/r1140/audit.mjs·probe2.mjs, 헤드리스)에서 재현한 것:
//  A. 본편 W·E·R 칸: 엔진 updateHUD 가 매 프레임 라우렌 아이콘·제목을 다시 써서 0.2초마다 고치는 R1120b 가 진다(R 칸은 대응도 없음) → 보라 라우렌 아이콘·'거짓 분리/심문자의 전이/진명 심판'
//  B. P 창·영웅 선택 무대 글: 'Q · 잔향 결계', '라우렌 · 고유 잔향', 패시브 '세 번째 공격에 잔향 마력진이 남는다.'
//  C. 색: 영웅 이펙트를 hue-rotate 로만 돌려 밝은 심이 흰·분홍으로 남음(Q 큰 폭발·블링크 연기) → 밝기 따라 언주 명암(70,14,10 / 204,52,40 / 255,176,140)으로 굽기
//  D. 막기: 은청색 방벽(r1027/barrier.webp)·테두리 복제·금빛 막기 빛(r111:guard-*)·블링크 잔광이 색 그대로
// 검사: ① W·E·R 칸은 엔진이 쓴 직후(같은 updateHUD 호출 안)에도 페르소나 아이콘·이름 ② 형상 끄면 엔진 값 그대로 ③ 글 바꾸기 표(경계·되풀이·무관한 글)
//       ④ 언주 명암 기준점·단조 ⑤ 픽셀 굽기(알파·투명 칸) ⑥ 정지 그림 이펙트는 구운 캔버스로(색 돌리기 필터 없음, 캐시, 프레임당 1장)
//       ⑦ 굽지 못하는 그림(바뀌는 캔버스·너무 큰 그림·읽기 막힘)은 예전 색 돌리기 그대로 ⑧ 막기·블링크 그림도 언주 ⑨ 회귀(몸·적·형상 끔·Dots 시트) ⑩ CI 연결
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'../..'),FILE=path.join(ROOT,'client-source/persona-hero-r1113.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const SRC=fs.readFileSync(FILE,'utf8');
const hooks=fs.readFileSync(path.join(ROOT,'client-source/ego-sovereign-r1046.js'),'utf8');
function el(id,attrs={},text=''){const a={...attrs};return {id,dataset:{},textContent:text,style:{_p:{},setProperty(k,v){this._p[k]=v;},getPropertyValue(k){return this._p[k]||'';}},
 getAttribute:k=>a[k]??null,setAttribute:(k,v)=>{a[k]=String(v);},get src(){return a.src;},set src(v){a.src=String(v);},get title(){return a.title;},set title(v){a.title=String(v);},_a:a};}
function world({pixels=true}={}){
 const images=[];let seen=null;const proto={render(frame){seen=frame.commands.map(c=>({...c,points:c.points&&c.points.map(p=>[...p]),style:c.style&&{...c.style}}));}};
 const E={attackIcon:el('attackIcon',{src:'a'}),blinkIcon:el('blinkIcon',{src:'b'}),guardIcon:el('guardIcon',{src:'g'}),specialIcon:el('specialIcon',{src:'s'}),egoIcon:el('egoIcon',{src:'e'}),specialLabel:el('specialLabel',{},'잔향 결계'),r376Pf:el('r376Pf'),
  'story-wer-w':el('story-wer-w',{title:'거짓 분리','aria-label':'거짓 분리 · W'}),'story-wer-e':el('story-wer-e',{title:'심문자의 전이','aria-label':'심문자의 전이 · E'}),'story-wer-r':el('story-wer-r',{title:'진명 심판','aria-label':'진명 심판 · R'}),heroName:el('heroName',{},'라우렌 · Lv.9'),portrait:el('portrait',{src:'x'})};
 const L={w:'./assets/vfx/heroes/lauren-w.webp',e:'./assets/vfx/heroes/lauren-e.webp',r:'./assets/r911/clean/assets/vfx/heroes/lauren-r.webp'},T={w:'거짓 분리',e:'심문자의 전이',r:'진명 심판'};
 const im={w:el('wimg',{src:L.w}),e:el('eimg',{src:L.e}),r:el('rimg',{src:L.r})};
 const sel={'#story-wer-w img':im.w,'#story-wer-e img':im.e,'#story-wer-r img':im.r};
 const stat={get:0};
 const mkCanvas=()=>({tagName:'canvas',width:0,height:0,getContext(){const cv=this;return {drawImage(img){cv._from=img;},fillRect(){},clearRect(){},createRadialGradient:()=>({addColorStop(){}}),
   getImageData(){stat.get++;if(!pixels)throw new Error('no pixels');const s=cv._from;if(!s||s._taint)throw new Error('tainted');return {data:new Uint8ClampedArray(s._pixels),width:cv.width,height:cv.height};},putImageData(d){cv._pixels=d.data;}};},
   toDataURL(){return 'data:image/png;base64,'+(this.__id||'ICON');}});
 const document={createElement:t=>t==='canvas'?mkCanvas():{tagName:t},baseURI:'http://x/m0/',getElementById:id=>E[id]||null,querySelector:s=>sel[s]||null,querySelectorAll:()=>[],addEventListener(){},head:{appendChild(){}}};
 class Img{constructor(){images.push(this);}set src(v){this._src=v;}get src(){return this._src;}}
 const player={hero:'lauren',x:10,y:10,hp:100,direction:'front',attackAnim:0,skillAnim:0,ultimateAnim:0};
 const C={Math,Number,JSON,Object,Array,Map,Set,WeakMap,WeakSet,String,Error,URL,console,Date,Uint8ClampedArray,time:0,player,room:{id:'cult04'},loading:false,storyScene:null,modal:false,started:true,
  zoom:1,actorHeight:()=>66,project:(x,y)=>({x:500+(x-y)*16,y:300+(x+y)*8}),toast:()=>{},HEROES:{lauren:{name:'라우렌'}},
  setInterval:()=>0,setTimeout:()=>0,StoryPhase1:{ThreeRenderer:{prototype:proto}},document,Image:Img,localStorage:{getItem:()=>null,setItem(){}}};
 // 엔진 updateHUD(index.html 6024줄과 같은 일): 매번 라우렌 아이콘·제목을 다시 쓴다
 C.updateHUD=function(){for(const s of ['w','e','r']){const b=E['story-wer-'+s];if(im[s].getAttribute('src')!==L[s])im[s].src=L[s];b.title=T[s];b.setAttribute('aria-label',T[s]+' · '+s.toUpperCase());}return 'hud';};
 C.hudW={};C.setHudTextR63R2=(id,v)=>{C.hudW[id]=String(v);};C.tick=function(){};C.serializeSave=()=>({player:{}});C.restoreSave=async()=>{};C.__STORYWORLD_CHEAT777__={active:()=>true};
 C.window=C;vm.createContext(C);vm.runInContext(hooks,C);vm.runInContext(SRC,C);
 const load=()=>{for(const i of images)if(i._src&&!i._done&&i.onload){i._done=true;const s=i._src;i.naturalWidth=/walk/.test(s)?4096:/persona-idle/.test(s)?1152:/lance-flight/.test(s)?3072:/lance-contact/.test(s)?2304:/flight/.test(s)?2048:/contact/.test(s)?1536:344;i.naturalHeight=/walk/.test(s)?512:/lance/.test(s)?384:/r1119|persona-idle/.test(s)?256:400;i._pixels=new Uint8ClampedArray(4);i.onload();}};
 const frame=cmds=>{C.time+=.016;proto.render.call({}, {commands:cmds});return seen;};
 return {C,E,im,L,T,player,frame,load,stat,api:()=>C.__STORYWORLD_PERSONA_HERO_R1113__};}
const Q=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const body=()=>({kind:'image',key:'hero:2:0',order:5,owner:{id:'hero:2',kind:'hero'},sourcePath:'http://x/m0/assets/r130/lauren/idle-s.webp',sourceRect:[0,0,192,463],style:{filter:'none'},points:Q(480,240,26,61)});
const px=(w,h,rgba)=>{const d=new Uint8ClampedArray(w*h*4);for(let i=0;i<w*h;i++)d.set(rgba,i*4);return d;};
const img=(w,h,rgba,extra={})=>({width:w,height:h,naturalWidth:w,naturalHeight:h,_pixels:px(w,h,rgba),...extra});
const fx=(id,sp,image,extra={})=>({kind:'image',key:id+':0',order:9,owner:{id,kind:'effect',...(extra.owner||{})},sourcePath:sp,image,sourceRect:[0,0,image?.width||8,image?.height||8],imageSize:[image?.width||8,image?.height||8],style:{filter:'none',globalAlpha:.8,globalCompositeOperation:'lighter',...(extra.style||{})},points:Q(400,200,40,40),...(extra.cmd||{})});
const hue=c=>/hue-rotate/.test(c?.style?.filter||'');
const A=w=>w.api();
const on=w=>{A(w).unlock('silent');A(w).setForm(true);w.frame([body()]);w.load();};

// ① W·E·R 칸
{const w=world();on(w);A(w).refresh();w.load();A(w).refresh();
 const r=w.C.updateHUD();
 ok(r==='hud','① updateHUD 원래 결과 그대로 돌려줌');
 for(const [s,name] of [['w','순수악의의 분기'],['e','욕망의 일식'],['r','악의의 관통']]){const b=w.E['story-wer-'+s];
  ok(/^data:image\/png/.test(w.im[s].src),'① 엔진이 쓴 직후에도 본편 '+s.toUpperCase()+' 아이콘 = 페르소나 ('+String(w.im[s].src).slice(0,30)+')');
  ok(b.title===name&&b.getAttribute('aria-label')===name+' · '+s.toUpperCase(),'① 본편 '+s.toUpperCase()+' 제목 = '+name+' ('+b.title+' / '+b.getAttribute('aria-label')+')');}
 ok(new Set(['w','e','r'].map(s=>w.im[s].src)).size===3,'① W·E·R 아이콘이 서로 다름');
 w.C.updateHUD();w.C.updateHUD();ok(/^data:/.test(w.im.r.src)&&w.E['story-wer-r'].title==='악의의 관통','① 여러 번 불러도 유지(깜빡임 없음)');
 const d=A(w).dock;ok(d&&d.w&&d.e&&d.r&&d.r.icon==='lance'&&d.w.icon==='star'&&d.e.icon==='eclipse','① 표(dock) W star · E eclipse · R lance');
 // ② 형상 끄면
 A(w).setForm(false);A(w).refresh();w.C.updateHUD();
 ok(w.im.w.src===w.L.w&&w.im.e.src===w.L.e&&w.im.r.src===w.L.r,'② 형상 끄면 엔진 아이콘 그대로');
 ok(w.E['story-wer-w'].title==='거짓 분리'&&w.E['story-wer-r'].title==='진명 심판'&&w.E['story-wer-r'].getAttribute('aria-label')==='진명 심판 · R','② 형상 끄면 엔진 제목 그대로');}
{const w=world();on(w);w.C.updateHUD();ok(w.im.r.src===w.L.r||/^data:/.test(w.im.r.src),'① 시트 준비 전에도 빈 그림 없음('+String(w.im.r.src).slice(0,24)+')');
 ok(w.E['story-wer-r'].title==='악의의 관통','① 시트 준비 전에도 이름은 페르소나');}

// ③ 글 바꾸기
{const w=world(),R=A(w).relabel;ok(typeof R==='function','③ relabel 함수 있음');
 if(typeof R==='function'){const P=A(w).profile;
  ok(R('Q · 잔향 결계')==='Q · 내면의 소용돌이','③ Q 이름 ('+R('Q · 잔향 결계')+')');
  ok(R('W · 거짓 분리')==='W · 순수악의의 분기'&&R('E · 심문자의 전이')==='E · 욕망의 일식'&&R('R · 진명 심판')==='R · 악의의 관통','③ W·E·R 이름');
  ok(R('라우렌 · 고유 패시브 진화')==='페르소나 · 고유 패시브 진화'&&R('라우렌 · 고유 잔향')==='페르소나 · 고유 잔향','③ 영웅 이름');
  ok(R('세 번째 공격에 잔향 마력진이 남는다.')===P.passive,'③ 패시브 문장 → 페르소나 소개 ('+R('세 번째 공격에 잔향 마력진이 남는다.')+')');
  ok(R('잔향의 마법사')!=='잔향의 마법사'&&!/라우렌|잔향의 마법사/.test(R('잔향의 마법사')),'③ 칭호');
  ok(R('환도 · 고유 패시브')==='환도 · 고유 패시브'&&R('')===''&&R('공명 방어')==='공명 방어','③ 무관한 글·빈 글 그대로');
  const once=R('Q · 잔향 결계 / 라우렌');ok(R(once)===once,'③ 두 번 바꿔도 같음(되풀이 안전)');
  ok(R(null)===null&&R(undefined)===undefined&&R(7)===7,'③ 글이 아니면 그대로');
  ok(!/라우렌 계보/.test(P.tags.join(' '))&&!/라우렌/.test(P.special)&&!/라우렌/.test(P.passive),'③ 소개 꼬리표·문장에 라우렌 없음 ('+P.tags.join(',')+' / '+P.special+')');}}

// ④ 언주 명암
{const w=world(),ramp=A(w).ramp;ok(typeof ramp==='function','④ ramp 함수 있음');
 if(typeof ramp==='function'){const g=v=>ramp(v,v,v);
  ok(g(Math.round(.22*255)).every((v,i)=>Math.abs(v-[70,14,10][i])<=3),'④ 어두운 기준 70,14,10 ('+g(Math.round(.22*255))+')');
  ok(g(Math.round(.5*255)).every((v,i)=>Math.abs(v-[204,52,40][i])<=4),'④ 가운데 기준 204,52,40 ('+g(Math.round(.5*255))+')');
  ok(g(Math.round(.82*255)).every((v,i)=>Math.abs(v-[255,176,140][i])<=4),'④ 밝은 기준 255,176,140 ('+g(Math.round(.82*255))+')');
  const k=g(0),wv=g(255);ok(k[0]<=10&&k[1]<=4&&k[2]<=4,'④ 검정은 검정에 가깝게 ('+k+')');ok(wv[0]===255&&wv[1]>=220&&wv[1]<255&&wv[2]<wv[1],'④ 흰 심은 살구빛 흰색(순백 아님) ('+wv+')');
  let mono=true,red=true;for(let v=1;v<=255;v++){const a=g(v-1),b=g(v);if(b[0]<a[0])mono=false;if(b[0]<b[1]||b[0]<b[2])red=false;}ok(mono,'④ 밝기 따라 빨강이 줄지 않음(단조)');ok(red,'④ 모든 밝기에서 빨강이 가장 큼');
  const v=ramp(164,98,255);ok(v[0]>v[2]&&v[0]>v[1]&&v[0]>=150,'④ 라우렌 보라 164,98,255 → 붉은 언주 ('+v+')');
  ok(ramp(-5,300,NaN).every(Number.isFinite),'④ 범위 밖·NaN 입력도 유한한 값');}}

// ⑤ 픽셀 굽기
{const w=world(),RP=A(w).rampPixels;ok(typeof RP==='function','⑤ rampPixels 함수 있음');
 if(typeof RP==='function'){const d=new Uint8ClampedArray([164,98,255,200, 9,9,9,0, 255,255,255,255, 0,0,0,128]);const n=RP(d);
  ok(d[3]===200&&d[7]===0&&d[11]===255&&d[15]===128,'⑤ 알파 그대로');ok(d[4]===9&&d[5]===9&&d[6]===9,'⑤ 완전 투명 칸은 손대지 않음');
  ok(d[0]>d[2]&&d[0]>d[1],'⑤ 보라 → 붉게 ('+[d[0],d[1],d[2]]+')');ok(d[8]===255&&d[9]<255,'⑤ 흰색 → 살구빛');ok(n===3,'⑤ 바꾼 칸 수 3 ('+n+')');
  ok(RP(new Uint8ClampedArray(0))===0,'⑤ 빈 배열 0');}}

// ⑥ 정지 그림 이펙트 → 구운 캔버스
{const w=world();on(w);const I1=img(8,8,[164,98,255,255]),I2=img(8,8,[120,50,200,255]);
 const mk=()=>[body(),fx('r102:1','',I1,{cmd:{immutableTint:{path:'r102:lauren-q'}}}),fx('r561:lauren:blink:1.2','http://x/m0/assets/r302/fx/lauren/blink.webp',I2,{style:{filter:'saturate(.5)'}})];
 let out=w.frame(mk());const a=out.find(c=>c.owner.id==='r102:1'),b=out.find(c=>c.owner.id.startsWith('r561:lauren:blink'));
 ok(a.image!==I1&&a.image&&a.image._pixels&&/^r1140:eonju:/.test(a.sourcePath)&&!hue(a),'⑥ 첫 그림은 구운 캔버스로(경로 '+a.sourcePath+', 필터 '+a.style.filter+')');
 ok(a.image._pixels[0]>a.image._pixels[2],'⑥ 구운 픽셀이 붉음 ('+[...a.image._pixels.slice(0,4)]+')');
 ok(a.mutable===false&&a.immutableTint&&a.immutableTint.path===a.sourcePath&&a.sourceRect.join()==='0,0,8,8'&&a.style.globalAlpha===.8&&a.style.globalCompositeOperation==='lighter','⑥ 자리·투명도·섞기 방식 그대로, 정지 그림 표식');
 ok(b.image===I2&&hue(b)&&/saturate\(\.5\)/.test(b.style.filter),'⑥ 같은 프레임 둘째 그림은 굽지 않고 예전 색 돌리기(프레임당 1장, 원래 필터 유지)');
 out=w.frame(mk());const a2=out.find(c=>c.owner.id==='r102:1'),b2=out.find(c=>c.owner.id.startsWith('r561:lauren:blink'));
 ok(a2.image===a.image,'⑥ 같은 그림은 캐시(같은 캔버스)');ok(b2.image!==I2&&!hue(b2)&&/saturate\(\.5\)/.test(b2.style.filter)&&/^r1140:eonju:/.test(b2.sourcePath)&&b2.sourcePath!==a2.sourcePath,'⑥ 다음 프레임에 둘째 그림도 굽고 원래 필터는 유지 ('+b2.style.filter+')');
 const g0=w.stat.get;w.frame(mk());w.frame(mk());ok(w.stat.get===g0,'⑥ 다 구운 뒤엔 픽셀 읽기 없음');
 ok((A(w).inspect().stats.baked||0)===2,'⑥ 구운 수 2 ('+A(w).inspect().stats.baked+')');}

// ⑦ 굽지 못하는 그림
{const w=world();on(w);const M=img(8,8,[164,98,255,255]);let out=w.frame([body(),fx('r102:2','',M,{cmd:{mutable:true}})]);const c=out.find(x=>x.owner.id==='r102:2');
 ok(c.image===M&&hue(c),'⑦ 바뀌는 캔버스(mutable)는 예전 색 돌리기');}
{const w=world();on(w);const B=img(8,8,[164,98,255,255],{naturalWidth:4096,naturalHeight:2048,width:4096,height:2048});let out=w.frame([body(),fx('r102:3','big',B)]);const c=out.find(x=>x.owner.id==='r102:3');
 ok(c.image===B&&hue(c),'⑦ 너무 큰 그림(4096×2048)은 예전 색 돌리기');}
{const w=world();on(w);const X=img(8,8,[164,98,255,255],{_taint:true});const mk=()=>[body(),fx('r102:4','taint',X)];let out=w.frame(mk());const g=w.stat.get;w.frame(mk());out=w.frame(mk());const c=out.find(x=>x.owner.id==='r102:4');
 ok(c.image===X&&hue(c),'⑦ 읽기 막힌 그림은 예전 색 돌리기');ok(w.stat.get===g&&g===1,'⑦ 실패한 그림은 다시 읽지 않음(읽기 '+w.stat.get+'번)');ok(A(w).inspect().stats.errors===0,'⑦ 오류로 세지 않음');}
{const w=world({pixels:false});on(w);const I=img(8,8,[164,98,255,255]);const out=w.frame([body(),fx('r102:5','',I)]);ok(hue(out.find(x=>x.owner.id==='r102:5')),'⑦ 픽셀을 못 읽는 환경에선 예전 색 돌리기');}
{const w=world();on(w);const out=w.frame([body(),{...fx('r102:6','',null),image:undefined}]);ok(hue(out.find(x=>x.owner.id==='r102:6')),'⑦ 그림 객체가 없는 명령은 예전 색 돌리기');}

// ⑧ 막기·블링크
{const w=world();on(w);const BR='http://x/m0/assets/r1027/barrier.webp';
 const IB=img(8,8,[200,210,230,255]),IO=img(8,8,[200,210,230,255]),IG=img(8,8,[255,214,120,255]),IA=img(8,8,[180,200,255,255]); // 게임처럼 같은 그림 객체를 프레임마다 다시 씀
 const mk=()=>[body(),fx('fx:11',BR,IB,{style:{globalCompositeOperation:'source-over'}}),
  {...fx('hero:2','r409:outline:hero:u:'+BR+':0,0,160,160:1:hero:lauren',IO),owner:{id:'hero:2',kind:'hero'},key:'hero:2:o'},
  fx('r111:guard-back','r106fx:glow:255.214.120:255.248.226',IG),fx('r111:guard-front','r106fx:glow:255.214.120:255.248.226',IG),
  fx('fx:12','http://x/m0/assets/vfx/blink-afterimage.webp',IA,{style:{globalCompositeOperation:'screen'}})];
 let out;for(let i=0;i<8;i++)out=w.frame(mk());
 const red=c=>c&&c.image&&c.image._pixels&&c.image._pixels[0]>c.image._pixels[2]+20&&c.image._pixels[1]<200&&!hue(c)&&/^r1140:eonju:/.test(String(c.sourcePath));
 ok(red(out.find(c=>c.owner.id==='fx:11')),'⑧ 방벽 그림 → 언주');ok(red(out.find(c=>c.key==='hero:2:o')),'⑧ 방벽 테두리 복제(영웅 소유) → 언주');
 ok(red(out.find(c=>c.owner.id==='r111:guard-back'))&&red(out.find(c=>c.owner.id==='r111:guard-front')),'⑧ 막기 빛(금빛) → 언주');ok(red(out.find(c=>c.owner.id==='fx:12')),'⑧ 블링크 잔광 → 언주');
 const bd=out.find(c=>c.key==='hero:2:0');ok(bd&&bd.r1113===true&&!hue(bd)&&!/^r1140:/.test(bd.sourcePath),'⑨ 몸 그림은 페르소나 칸 그대로(굽지 않음)');
 // 형상 끔
 A(w).setForm(false);out=w.frame(mk());ok(out.every(c=>!hue(c)&&!/^r1140:/.test(String(c.sourcePath))),'⑨ 형상 끄면 아무것도 안 바꿈');}
{const w=world();on(w);const EI=img(8,8,[164,98,255,255]);const mk=()=>[body(),{...fx('enemy:5','http://x/m0/assets/r1027/barrier.webp',EI),owner:{id:'enemy:5',kind:'enemy'}},fx('r900:boss','x',img(8,8,[164,98,255,255]),{owner:{pxfSide:'enemy'}}),
  {...fx('r561:collapse:1','http://x/m0/assets/r561/lauren/lauren-collapse.webp',img(8,8,[1,1,1,255])),sourceRect:[0,0,256,256]}];
 let out;for(let i=0;i<4;i++)out=w.frame(mk());
 ok(out[1].image===EI&&!hue(out[1]),'⑨ 적 소유 그림은 그대로');ok(!hue(out[2])&&!/^r1140:/.test(out[2].sourcePath),'⑨ 적 쪽 이펙트는 그대로');
 ok(/^r1113:r1119\/fx-eclipse/.test(out[3].sourcePath)&&!hue(out[3]),'⑨ Dots 시트로 바꾼 스킬 그림은 다시 굽지 않음 ('+out[3].sourcePath+')');}

// ⑪ 쓰러짐(R151·R1117d): 체력 0 이면 엔진은 몸을 안 그리고 R151 이 쓰러짐 시트 칸을 'hero:p:r151' 로 그린다 — 그 칸을 대기 그림으로 덮으면 안 된다(브라우저에서 재현: sourcePath 가 r1113:…persona-idle-s 로 바뀜)
{const w=world();on(w);const DP='http://x/m0/assets/r151/death/persona/death-e.webp';
 const dead=()=>({kind:'image',key:'hero:p:r151:0',order:5,owner:{id:'hero:p:r151',kind:'hero',alive:false,bodyPath:'assets/r151/death/persona/death-e.webp'},sourcePath:DP,sourceRect:[384,0,192,256],imageSize:[1152,256],style:{filter:'saturate(.5) contrast(1.08)',globalAlpha:1},points:Q(445,164,70,95)});
 w.player.hp=0;let out=w.frame([dead()]);let c=out[0];
 ok(c.sourcePath===DP&&c.sourceRect.join()==='384,0,192,256'&&c.points[0][0]===445&&c.points[2][1]===259&&c.r1113!==true,'⑪ 체력 0: 쓰러짐 시트 칸 그대로 ('+String(c.sourcePath).slice(-40)+')');
 ok(out.length===1&&!hue(c),'⑪ 체력 0: 덧붙는 빛·색 돌리기 없음');
 w.player.hp=-5;out=w.frame([dead()]);ok(out[0].sourcePath===DP,'⑪ 체력이 음수여도 그대로');
 w.player.hp=100;out=w.frame([{...dead(),r151Death:true},body()]);ok(out[0].sourcePath===DP&&out[1].r1113===true,'⑪ 쓰러짐 표식(r151Death) 칸은 살아 있는 프레임에도 덮지 않고, 몸 그림은 페르소나로');
 w.player.hp=1;out=w.frame([body()]);ok(out[0].r1113===true,'⑪ 체력 1(경계)은 평소처럼 페르소나 몸');}

// ⑩ CI
{const y=fs.readFileSync(path.join(ROOT,'../.github/workflows/pages.yml'),'utf8');ok(y.includes('node r96/qa/r1140/persona-hero-audit-cpu-check.cjs'),'⑩ CI(pages.yml)에 이 검사 줄');
 ok(y.includes('node r96/qa/r1120/persona-hero-hud-well-cpu-check.cjs')&&y.includes('node r96/qa/r1113/persona-hero-cpu-check.cjs'),'⑩ 예전 페르소나 검사 줄 유지');}
console.log(fails?('\nFAILED '+fails):'\nALL PASS');process.exit(fails?1:0);
