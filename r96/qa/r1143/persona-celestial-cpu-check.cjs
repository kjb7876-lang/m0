// R1143 실패 먼저 — 페르소나 영웅의 확률 패시브 '(진) 천체 공명' (사용자 2026-11-18 05:41Z
//  "이름앞에 (진) 을 붙이고 모두 척력은 언주색 인력은 흑색으로 합친건 검빨색해서 기존이펙트에 색만얹어").
//  페르소나 형상(라우렌 몸)일 때만: 이름 앞에 '(진) ', 척력(항성 반발·은빛 거성) = 언주, 인력(심연 왜성) = 흑, 합친 것(쌍성 소멸·유성 궤도) = 검빨.
//  기존 그림 모양·판정·수치는 그대로, 색만 얹는다(Three.js 기록기가 받는 필터만: saturate·hue-rotate·brightness·contrast·grayscale). 라우렌 본인은 그대로.
//  형상일 때 R946 그림은 이미 통째로 언주로 구워지고 있었다(R1140 영웅 이펙트 굽기) → 갈래별 명암표로 나눠 굽는다. R946 파일은 손대지 않는다.
// 검사: ① 색 표·명암표(형상 꺼지면 null) ② 이름 (진) 한 번만(되풀이 안전) ③ 해금 알림 글 ④ 장면 명령: 갈래별 굽기·선 색·캐시·라우렌은 그대로
//       ⑤ 던지는 조형물 그림은 물들이지 않음 ⑥ 굽지 못하면 필터 ⑦ R946 판정·수치 그대로 ⑧ CI 연결
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'../..'),FILE=path.join(ROOT,'client-source/persona-hero-r1113.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const SRC=fs.readFileSync(FILE,'utf8'),CEL=fs.readFileSync(path.join(ROOT,'client-source/lauren-celestial-r946.js'),'utf8');
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
  zoom:1,actorHeight:()=>66,project:(x,y)=>({x:500+(x-y)*16,y:300+(x+y)*8}),toasts:[],toast:function(t){C.toasts.push(String(t));},HEROES:{lauren:{name:'라우렌'}},
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


const KINDS=['repulse','red','blue','violet','meteor'];
// ① 색 표
{const w=world();const T=A(w).celestialTone;ok(typeof T==='function','① celestialTone 함수 있음');
 if(typeof T==='function'){ok(KINDS.every(k=>T(k)===null),'① 형상 아님(라우렌 본인) → 모두 null');on(w);
  const f=Object.fromEntries(KINDS.map(k=>[k,T(k)]));
  ok(f.repulse==='eonju'&&f.red==='eonju','① 척력(항성 반발·은빛 거성) = 언주');ok(f.blue==='black','① 인력(심연 왜성) = 흑');ok(f.violet==='darkred'&&f.meteor==='darkred','① 합친 것(쌍성 소멸·유성 궤도) = 검빨');
  ok(T('nope')===null&&T()===null,'① 모르는 갈래 → null');
  const R=A(w).celestialRamp;if(typeof R!=='function')ok(false,'① celestialRamp 함수 있음');else{
   const bk=[0,64,128,200,255].map(v=>R('black',v,v,v)),dr=[0,64,128,200,255].map(v=>R('darkred',v,v,v));
   ok(bk.every(c=>Math.max(...c)-Math.min(...c)<=12&&Math.max(...c)<=150)&&Math.max(...bk[2])<=30&&bk[0].every(v=>v===0),'① 흑 명암: 무채색에 가깝고 어둡다 ('+JSON.stringify(bk)+')');
   ok(dr.slice(1).every(c=>c[0]>c[1]*2&&c[0]>c[2]*2)&&dr[4][0]<=210&&dr[2][0]<=130&&dr[0].every(v=>v===0),'① 검빨 명암: 붉고 어둡다, 흰 꼬리 없음 ('+JSON.stringify(dr)+')');
   const mono=a=>a.every((c,i)=>!i||c[0]>=a[i-1][0]);ok(mono(bk)&&mono(dr),'① 밝기 따라 단조');
   const e=A(w).ramp(128,128,128);ok(dr[2][0]<e[0],'① 검빨은 같은 밝기의 언주보다 어둡다 ('+dr[2][0]+' < '+e[0]+')');}
  A(w).setForm(false);ok(KINDS.every(k=>T(k)===null),'① 형상 끄면 다시 null');}}
// ② 이름
{const w=world(),R=A(w).relabel;
 for(const n of ['천체 공명','항성 반발','은빛 거성','심연 왜성','쌍성 소멸','유성 궤도'])ok(R(n)==='(진) '+n,'② '+n+' → (진) '+n+' ('+R(n)+')');
 ok(R(R(R('천체 공명 1/7')))==='(진) 천체 공명 1/7','② 되풀이해도 (진) 한 번만 ('+R(R(R('천체 공명 1/7')))+')');
 ok(R('특수 패시브 해금 · 은빛 거성·심연 왜성 (Lv.15)')==='특수 패시브 해금 · (진) 은빛 거성·(진) 심연 왜성 (Lv.15)','② 한 줄에 여럿');
 ok(R('수묵 의협(묵월·칠묵영·삼협묵희)')==='수묵 의협(묵월·칠묵영·삼협묵희)'&&R('독전 회로')==='독전 회로','② 다른 영웅 패시브 이름은 그대로');
 const N=A(w).celestialNames;ok(N&&N.passive==='(진) 천체 공명'&&N.repulse==='(진) 항성 반발'&&N.red==='(진) 은빛 거성'&&N.blue==='(진) 심연 왜성'&&N.violet==='(진) 쌍성 소멸'&&N.meteor==='(진) 유성 궤도','② celestialNames 표');}
// ③ 해금 알림
{const w=world();w.C.toast('특수 패시브 해금 · 항성 반발 (Lv.5)');ok(w.C.toasts.at(-1)==='특수 패시브 해금 · 항성 반발 (Lv.5)','③ 라우렌 본인 알림은 그대로');
 on(w);w.C.toast('특수 패시브 해금 · 항성 반발 (Lv.5)');ok(w.C.toasts.at(-1)==='특수 패시브 해금 · (진) 항성 반발 (Lv.5)','③ 형상이면 알림에 (진) ('+w.C.toasts.at(-1)+')');
 w.C.toast('문이 열렸습니다.',3);ok(w.C.toasts.at(-1)==='문이 열렸습니다.','③ 무관한 알림 그대로');}
// ④~⑦ 장면 명령 색 얹기(R946 은 그대로, 그릴 때 페르소나 쪽에서 갈래별로 굽는다)
const cel=(id,sp,image,extra={})=>fx(id,sp,image,{owner:{pxfSide:'hero'},style:{globalCompositeOperation:'source-over'},...extra});
const vec=(id,color)=>({kind:'fill',order:9,owner:{id,kind:'effect',pxfSide:'hero'},style:{fillStyle:color,strokeStyle:color,globalAlpha:1},points:Q(400,200,40,40)});
const rgb=s=>(/rgba?\((\d+),(\d+),(\d+)/.exec(String(s))||[]).slice(1,4).map(Number);
const frames=(w,mk,n=6)=>{let r;for(let i=0;i<n;i++)r=w.frame(mk());return r;};
{const w=world();on(w);const I={red:img(8,8,[200,200,210,255]),blue:img(8,8,[120,60,200,255]),disk:img(8,8,[120,60,200,255]),violet:img(8,8,[170,110,230,255]),aura:img(8,8,[170,110,230,255]),prop:img(8,8,[90,160,90,255])};
 const mk=()=>[body(),cel('r946:red:1.00:orb','http://x/m0/assets/r946/lauren-red.webp',I.red),cel('r946:blue:1.00:orb','http://x/m0/assets/r946/lauren-blue.webp',I.blue),cel('r946:blue:1.00:disk','http://x/m0/assets/r946/lauren-blue-disk.webp',I.disk),
  cel('r946:violet:1.00:orb','http://x/m0/assets/r946/lauren-violet.webp',I.violet),cel('r946:meteor:rock0:1.00','http://x/m0/assets/r946/lauren-aura.webp',I.aura),cel('r946:meteor:rock0:1.00','http://x/m0/assets/props/vase.webp',I.prop),
  vec('r946:repulse:1.00:ring','rgba(232,226,244,.8)'),vec('r946:blue:1.00:orb','rgba(190,150,240,.9)'),vec('r946:violet:1.00:trail','rgba(150,84,220,.8)'),vec('r946:meteor:boom:1.00:3.0','rgba(232,226,244,.8)')];
 const s=frames(w,mk,8),by=(id,sp)=>s.find(c=>c.owner?.id===id&&(!sp||String(c.sourcePath).includes(sp)||c.image===sp));
 const red=s[1],blue=s[2],disk=s[3],vio=s[4],aura=s[5],prop=s[6];
 ok(/^r1140:eonju:/.test(red.sourcePath)&&red.image!==I.red,'④ 은빛 거성 시트 → 언주 굽기 ('+red.sourcePath+')');
 ok(/^r1140:black:/.test(blue.sourcePath)&&/^r1140:black:/.test(disk.sourcePath),'④ 심연 왜성 구·원반 시트 → 흑 굽기 ('+blue.sourcePath+')');
 {const d=blue.image&&blue.image._pixels;ok(d&&Math.max(d[0],d[1],d[2])-Math.min(d[0],d[1],d[2])<=12&&d[0]<=60&&d[3]===255,'④ 흑 굽기 화소: 무채색·어둡다·알파 그대로 ('+(d&&[d[0],d[1],d[2],d[3]])+')');}
 ok(/^r1140:darkred:/.test(vio.sourcePath)&&/^r1140:darkred:/.test(aura.sourcePath),'④ 쌍성 소멸·유성 궤도 고리 시트 → 검빨 굽기 ('+vio.sourcePath+')');
 {const d=vio.image&&vio.image._pixels;ok(d&&d[0]>d[1]*2&&d[0]>d[2]*2&&d[0]<=140,'④ 검빨 굽기 화소: 붉고 어둡다 ('+(d&&[d[0],d[1],d[2]])+')');}
 ok([red,blue,disk,vio,aura].every(c=>!/hue-rotate|grayscale/.test(c.style.filter||'')),'④ 구운 그림에는 색 필터를 겹치지 않음');
 ok([red,blue,vio].every(c=>c.points&&JSON.stringify(c.points)===JSON.stringify(Q(400,200,40,40))&&JSON.stringify(c.sourceRect)===JSON.stringify([0,0,8,8])),'④ 자리·크기·시트 칸은 그대로(모양 그대로, 색만)');
 ok(prop.image===I.prop&&String(prop.sourcePath).endsWith('assets/props/vase.webp')&&(prop.style.filter||'none')==='none','⑤ 유성 궤도가 던지는 조형물 그림은 물들이지 않음');
 const c7=rgb(s[7].style.fillStyle),c8=rgb(s[8].style.fillStyle),c9=rgb(s[9].style.fillStyle),c10=rgb(s[10].style.strokeStyle);
 ok(c8.length===3&&Math.max(...c8)-Math.min(...c8)<=12&&Math.max(...c8)<=150,'④ 심연 왜성 선·채우기 → 흑 ('+c8+')');
 ok(c9[0]>c9[1]*2&&c9[0]>c9[2]*2&&c9[0]<=140&&c10[0]>c10[1]*2&&c10[0]<=210,'④ 쌍성 소멸 꼬리·유성 폭발 고리 → 검빨 ('+c9+' / '+c10+')');
 ok(c7[0]>c7[2],'④ 항성 반발 고리 → 언주 계열(붉은 쪽) ('+c7+')');
 ok(/,\.9\)$/.test(s[8].style.fillStyle)&&/,\.8\)$/.test(s[9].style.fillStyle),'④ 알파 그대로');
 // 캐시: 같은 그림을 다시 굽지 않음
 const g0=w.stat.get;frames(w,mk,4);ok(w.stat.get===g0,'④ 한 번 구운 그림은 다시 굽지 않음');
 ok(!A(w).inspect().stats.lastError,'④ 오류 없음 ('+A(w).inspect().stats.lastError+')');
 // 라우렌 본인
 A(w).setForm(false);const L=w.frame(mk());ok(L[2].image===I.blue&&L[4].image===I.violet&&L[8].style.fillStyle==='rgba(190,150,240,.9)'&&L[9].style.fillStyle==='rgba(150,84,220,.8)','④ 형상 끄면(라우렌 본인) 그림·색 그대로');}
// ⑥ 굽지 못할 때(화소 읽기 막힘) → 필터로
{const w=world({pixels:false});on(w);const B=img(8,8,[120,60,200,255]),V=img(8,8,[170,110,230,255]),Rr=img(8,8,[200,200,210,255]);
 const s=frames(w,()=>[body(),cel('r946:blue:1.00:orb','http://x/m0/assets/r946/lauren-blue.webp',B),cel('r946:violet:1.00:orb','http://x/m0/assets/r946/lauren-violet.webp',V),cel('r946:red:1.00:orb','http://x/m0/assets/r946/lauren-red.webp',Rr)],6);
 const OKF=/^(?:(?:saturate|hue-rotate|brightness|contrast|grayscale)\([\d.]+(?:deg)?\)\s*)+$/;
 ok(s[1].image===B&&/grayscale\(1\)/.test(s[1].style.filter)&&!/hue-rotate/.test(s[1].style.filter),'⑥ 굽지 못하면 흑은 무채색 필터 ('+s[1].style.filter+')');
 ok(/hue-rotate/.test(s[2].style.filter)&&/hue-rotate/.test(s[3].style.filter)&&s[2].style.filter!==s[3].style.filter&&s[2].style.filter.startsWith(s[3].style.filter),'⑥ 검빨은 언주 색 돌리기에 어둡게를 더함 ('+s[2].style.filter+')');
 ok([1,2,3].every(i=>OKF.test(s[i].style.filter)),'⑥ 기록기가 받는 필터 함수만');}
// ⑦ R946(판정·수치)은 손대지 않음
{const rd=f=>fs.readFileSync(path.join(ROOT,f),'utf8');ok(/const REV='R946-celestial-4-ego'/.test(CEL)&&/REP_R=2\.8,REP_K=1\.2/.test(CEL)&&/VIO_K=3\.0,VIO_BOSS_K=1\.8/.test(CEL)&&/CHANCE=\.10/.test(CEL),'⑦ lauren-celestial-r946.js 는 그대로(판·수치)');
 ok(/names:Object\.freeze\(\{passive:'천체 공명'/.test(CEL),'⑦ 라우렌 쪽 이름 표 그대로');}
// ⑧ 연결
{const rd=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
 for(const n of ['persona-hero-r1113.js','lauren-celestial-r946.js'])ok(rd('runtime-text/'+n)===rd('client-source/'+n),'⑧ '+n+' runtime-text 사본 = client-source');
 ok(fs.readFileSync(path.join(ROOT,'../.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1143/persona-celestial-cpu-check.cjs'),'⑧ pages.yml CPU 검사 줄');
 ok(/R1113-persona-hero-\d+-.*r1143/.test(SRC),'⑧ 판 이름');}
console.log(fails?('FAILED '+fails):'ALL PASS');process.exit(fails?1:0);
