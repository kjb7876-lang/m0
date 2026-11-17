// R1120b 실패 먼저(사용자 11-17 10:12Z "문제 다 고쳐" — R1120 에서 남긴 것: 하단 스킬 아이콘·이름이 라우렌 것, 중력 우물 가운데 원반이 코드로 그린 보라 구).
// 검사: ① 형상일 때 하단 아이콘(기본 공격·블링크·공명 방어·Q·EGO·본편 W·E) → 페르소나 Dots 탄 시트(R1119) 칸으로 만든 아이콘
//       ② Q 이름 '잔향 결계' → '내면의 소용돌이'(Q 그림 = 소용돌이 시트), 본편 E 제목 → '욕망의 일식'(E 그림 = 일식 시트), 초상 테 색 → 언주
//       ③ 형상을 끄면(라우렌) 아이콘·이름·테 색 원래대로 ④ 시트 준비 전엔 아이콘 그대로(빈 그림 없음)
//       ⑤ 중력 우물 코어(r561 …:core 선·채우기, 코드로 그린 구)는 빼고 그 자리에 일식 비행 시트 칸 하나(언주 Dots 그림, 열쇠·순서는 몸·우물과 다르게)
//       ⑥ 우물 원반(바닥 …:disk)은 언주 색으로 남김 ⑦ 형상이 아니면 코어 그대로 ⑧ CI 연결
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'../..'),FILE=path.join(ROOT,'client-source/persona-hero-r1113.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const SRC=fs.readFileSync(FILE,'utf8');
function el(id,attrs={},text=''){const a={...attrs};return {id,dataset:{},textContent:text,style:{_p:{},setProperty(k,v){this._p[k]=v;},getPropertyValue(k){return this._p[k]||'';}},
 getAttribute:k=>a[k]??null,setAttribute:(k,v)=>{a[k]=String(v);},get src(){return a.src;},set src(v){a.src=String(v);},get title(){return a.title;},set title(v){a.title=String(v);},_a:a};}
function world(){
 const images=[];let seen=null;const proto={render(frame){seen=frame.commands.map(c=>({...c,points:c.points&&c.points.map(p=>[...p]),style:c.style&&{...c.style}}));}};
 const E={attackIcon:el('attackIcon',{src:'./assets/vfx/generated/v300/slash-impact.webp'}),blinkIcon:el('blinkIcon',{src:'./assets/vfx/blink-afterimage.webp'}),guardIcon:el('guardIcon',{src:'./assets/x/barrier-sigil.webp'}),
  specialIcon:el('specialIcon',{src:'./assets/vfx/ultimate-crown.webp'}),egoIcon:el('egoIcon',{src:'./assets/x/time-ring.webp'}),specialLabel:el('specialLabel',{},'잔향 결계'),r376Pf:el('r376Pf'),
  'story-wer-w':el('story-wer-w',{title:'거짓 분리','aria-label':'거짓 분리 · W'}),'story-wer-e':el('story-wer-e',{title:'심문자의 전이','aria-label':'심문자의 전이 · E'}),heroName:el('heroName',{},'라우렌 · Lv.9'),portrait:el('portrait',{src:'x'})};
 E.r376Pf.style.setProperty('--hc','#c8a0df');const wImg=el('wimg',{src:'./assets/vfx/heroes/lauren-w.webp'}),eImg=el('eimg',{src:'./assets/vfx/heroes/lauren-e.webp'});
 const sel={'#story-wer-w img':wImg,'#story-wer-e img':eImg};
 const document={createElement:t=>({tagName:t,width:0,height:0,getContext:()=>({drawImage(){},fillRect(){},clearRect(){},createRadialGradient:()=>({addColorStop(){}})}),toDataURL(){return 'data:image/png;base64,'+(this.__id||'ICON');}}),
  baseURI:'http://x/m0/',getElementById:id=>E[id]||null,querySelector:s=>sel[s]||null,querySelectorAll:()=>[],addEventListener(){},head:{appendChild(){}}};
 class Img{constructor(){images.push(this);}set src(v){this._src=v;}get src(){return this._src;}}
 const player={hero:'lauren',x:10,y:10,hp:100,direction:'front',attackAnim:0,skillAnim:0,ultimateAnim:0};
 const C={Math,Number,JSON,Object,Array,Map,Set,WeakMap,WeakSet,String,Error,URL,console,Date,time:0,player,room:{id:'cult04'},loading:false,storyScene:null,modal:false,started:true,
  zoom:1,actorHeight:()=>66,project:(x,y)=>({x:500+(x-y)*16,y:300+(x+y)*8}),toast:()=>{},HEROES:{lauren:{name:'라우렌'}},
  setInterval:()=>0,setTimeout:()=>0,StoryPhase1:{ThreeRenderer:{prototype:proto}},document,Image:Img,localStorage:{getItem:()=>null,setItem(){}}};
 C.hudW={};C.setHudTextR63R2=(id,v)=>{C.hudW[id]=String(v);};C.tick=function(){};C.serializeSave=()=>({player:{}});C.restoreSave=async()=>{};C.__STORYWORLD_CHEAT777__={active:()=>true};
 C.window=C;vm.createContext(C);vm.runInContext(SRC,C);
 const load=()=>{for(const im of images)if(im._src&&!im._done&&im.onload){im._done=true;const s=im._src;im.naturalWidth=/walk/.test(s)?4096:/persona-idle/.test(s)?1152:/flight/.test(s)?2048:/contact/.test(s)?1536:344;im.naturalHeight=/walk/.test(s)?512:/r1119|persona-idle/.test(s)?256:400;im.onload();}};
 const frame=cmds=>{proto.render.call({}, {commands:cmds});return seen;};
 return {C,E,wImg,eImg,player,frame,load,api:()=>C.__STORYWORLD_PERSONA_HERO_R1113__};}
const Q=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const body=()=>({kind:'image',key:'hero:2:0',order:5,owner:{id:'hero:2',kind:'hero'},sourcePath:'http://x/m0/assets/r130/lauren/idle-s.webp',sourceRect:[0,0,192,463],style:{filter:'none'},points:Q(480,240,26,61)});
const ring=(cx,cy,r,n=64)=>Array.from({length:n+1},(_,i)=>[cx+r*Math.cos(i/n*6.283),cy+r*.5*Math.sin(i/n*6.283)]);
const circ=(cx,cy,r,n=64)=>Array.from({length:n+1},(_,i)=>[cx+r*Math.cos(i/n*6.283),cy+r*Math.sin(i/n*6.283)]);
const own=k=>({id:'r561:well:1.15:'+k,kind:'effect',pxfSide:'hero'});
const disk=()=>({kind:'fill',key:'r561:well:1.15:disk:0',order:128,owner:own('disk'),paths:[{points:ring(480,314,18),closed:true}],clips:[],style:{globalAlpha:.82,fillStyle:'rgba(74,26,120,.55)',strokeStyle:'#000',filter:'none'}});
const core=(i,kind='fill')=>({kind,key:'r561:well:1.15:core:'+i,order:135+i,owner:own('core'),paths:[{points:circ(480,290,9),closed:true}],clips:[],style:{globalAlpha:1,fillStyle:'rgba(4,0,10,.96)',strokeStyle:'rgba(240,216,255,.9)',filter:'none'}});
const tickUi=w=>{w.api().refresh();};
// ①②④
{const w=world();const a=w.api();a.setForm(true);tickUi(w);
 ok(w.E.attackIcon.src==='./assets/vfx/generated/v300/slash-impact.webp','④ 시트 준비 전엔 아이콘 그대로');
 w.frame([body()]);w.load();tickUi(w);
 const ids=['attackIcon','blinkIcon','guardIcon','specialIcon','egoIcon'];
 ok(ids.every(i=>/^data:image\/png/.test(w.E[i].src)),'① 하단 아이콘 5개 → 페르소나 시트 아이콘 '+ids.map(i=>String(w.E[i].src).slice(0,22)).join(' '));
 ok(/^data:image\/png/.test(w.wImg.src)&&/^data:image\/png/.test(w.eImg.src),'① 본편 W·E 아이콘 → 페르소나');
 ok(new Set(ids.map(i=>w.E[i].src).concat([w.wImg.src,w.eImg.src])).size>=5,'① 아이콘이 서로 다름(시트별)');
 ok(w.E.specialLabel.textContent==='내면의 소용돌이','② Q 이름 → 내면의 소용돌이 ('+w.E.specialLabel.textContent+')');
 w.C.setHudTextR63R2('specialLabel','잔향 결계');ok(w.C.hudW.specialLabel==='내면의 소용돌이','② 엔진이 매 프레임 쓰는 Q 이름(setHudTextR63R2)도 → 내면의 소용돌이 ('+w.C.hudW.specialLabel+')');
 ok(w.E['story-wer-e'].title==='욕망의 일식'&&/욕망의 일식/.test(w.E['story-wer-e'].getAttribute('aria-label')),'② 본편 E 제목 → 욕망의 일식');
 ok(w.E.r376Pf.style.getPropertyValue('--hc')==='#cc3428','② 초상 테 색 → 언주 '+w.E.r376Pf.style.getPropertyValue('--hc'));
 // ③
 a.setForm(false);tickUi(w);
 ok(w.E.attackIcon.src==='./assets/vfx/generated/v300/slash-impact.webp'&&w.E.specialIcon.src==='./assets/vfx/ultimate-crown.webp'&&w.wImg.src==='./assets/vfx/heroes/lauren-w.webp','③ 형상 끄면 아이콘 원래대로');
 ok(w.E.specialLabel.textContent==='잔향 결계'&&w.E['story-wer-e'].title==='심문자의 전이'&&w.E.r376Pf.style.getPropertyValue('--hc')==='#c8a0df','③ 이름·테 색 원래대로');}
// ⑤⑥
{const w=world();w.api().setForm(true);w.frame([body()]);w.load();w.frame([body()]);w.load();
 const out=w.frame([body(),disk(),core(0,'stroke'),core(23),core(24,'stroke')]);
 const cores=out.filter(c=>/:core:\d+$/.test(c.key||'')),ecl=out.filter(c=>c.kind==='image'&&/fx-eclipse-flight/.test(String(c.sourcePath||''))),dk=out.find(c=>c.key==='r561:well:1.15:disk:0');
 ok(cores.length===0,'⑤ 코드로 그린 코어 선·채우기 빠짐(남은 '+cores.length+')');
 const e=ecl[0];ok(ecl.length===1&&e.key!=='hero:2:0'&&!/:core:\d+$/.test(e.key)&&e.order===135,'⑤ 일식 시트 칸 하나(열쇠 '+(e&&e.key)+', 순서 '+(e&&e.order)+')');
 const cx=e?(e.points[0][0]+e.points[2][0])/2:0,cy=e?(e.points[0][1]+e.points[2][1])/2:0,wd=e?e.points[1][0]-e.points[0][0]:0;
 ok(e&&Math.abs(cx-480)<.5&&Math.abs(cy-290)<.5&&wd>18&&wd<60,'⑤ 코어 자리·크기에 맞춤(가운데 '+cx.toFixed(1)+','+cy.toFixed(1)+' 폭 '+wd.toFixed(1)+')');
 ok(e&&e.sourceRect[2]===256&&!/hue-rotate/.test(e.style?.filter||''),'⑤ 256칸 한 칸, 언주 색 돌리기 안 함');
 ok(dk&&/rgba\((\d+),/.test(dk.style.fillStyle)&&+/rgba\((\d+),(\d+),(\d+)/.exec(dk.style.fillStyle)[1]>+/rgba\((\d+),(\d+),(\d+)/.exec(dk.style.fillStyle)[3],'⑥ 바닥 원반은 언주 색으로 남음 '+(dk&&dk.style.fillStyle));}
// ⑦
{const w=world();const out=w.frame([body(),core(23)]);ok(out.some(c=>c.key==='r561:well:1.15:core:23'),'⑦ 형상이 아니면 코어 그대로');}
// ⑧
{const y=fs.readFileSync(path.join(ROOT,'../.github/workflows/pages.yml'),'utf8');ok(y.includes('node r96/qa/r1120/persona-hero-hud-well-cpu-check.cjs'),'⑧ CI(pages.yml)에 이 검사 줄');}
console.log(fails?'R1120b persona-hero-hud-well FAILED '+fails:'R1120b persona-hero-hud-well OK');process.exit(fails?1:0);
