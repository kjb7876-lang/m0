// R1145 실패 먼저 — 페르소나 형상 기본 공격에 라우렌 흔적이 남지 않게(사용자 2026-11-18 06:43Z "이제 페르소나에서 라우렌 흔적은 안나오게해 기본공격관련해서 검사해서").
//  헤드리스 전수 조사(qa/r1145/probe-basic.mjs): 형상인데도 ① R411 영웅 적중 그림 hit-teleport(라우렌 고유 보랏빛 균열) ② R302 가 라우렌 바이올렛 2색으로
//  칠한 엔진 기본 공격 탄·착탄 사본(owner fx:N, 경로 없음, __r302Path='r302-tint')이 물들지 않고 보라로 그려졌다. → 형상일 때 둘 다 언주로 굽는다(모양·판정 그대로).
//  보스 쪽 R411 그림·다른 엔진 그림·라우렌 본인은 그대로.
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


const frames=(w,mk,n=6)=>{let r;for(let i=0;i<n;i++)r=w.frame(mk());return r;};
const eonjuish=c=>/^r1140:eonju:/.test(c.sourcePath||'')&&c.image&&c.image._pixels&&c.image._pixels[0]>c.image._pixels[2]*1.5;
// ① R411 영웅 적중 그림(라우렌 hit-teleport)
{const w=world();on(w);const T=img(8,8,[150,130,170,255]),B=img(8,8,[150,130,170,255]);
 const mk=()=>[body(),fx('r411:hero-hit:hit-teleport:12.300','http://x/m0/assets/r411/fx/hit-teleport.webp',T,{owner:{r411:true},style:{globalCompositeOperation:'source-over'}}),
  fx('r411:boss:boss-x:12.300','http://x/m0/assets/r411/fx/hit-teleport.webp',B,{owner:{r411:true,enemy:true}})];
 const s=frames(w,mk,6);ok(eonjuish(s[1]),'① R411 영웅 적중 그림(라우렌 보랏빛 균열) → 언주 굽기 ('+s[1].sourcePath+')');
 ok(s[2].image===B&&!hue(s[2]),'① 보스 쪽 R411 그림은 그대로');
 A(w).setForm(false);const L=w.frame(mk());ok(L[1].image===T&&!hue(L[1]),'① 형상 끄면(라우렌 본인) 그대로');}
// ② R302 가 라우렌 바이올렛으로 칠한 엔진 기본 공격 탄·착탄 사본
{const w=world();on(w);const P=img(8,8,[196,171,242,255],{__r302Path:'r302-tint',__storyworldStaticTint:true}),N=img(8,8,[196,171,242,255]);
 const mk=()=>[body(),fx('fx:41','',P,{cmd:{mutable:true}}),fx('fx:42','',N,{cmd:{mutable:true}}),fx('fx:43','http://x/m0/assets/vfx/generated/v300/burst-impact.webp',N)];
 const s=frames(w,mk,6);ok(eonjuish(s[1]),'② R302 라우렌 2색 탄·착탄 사본 → 언주 굽기 ('+s[1].sourcePath+')');
 ok(s[2].image===N&&!hue(s[2])&&s[3].image===N&&!hue(s[3]),'② 표시 없는 엔진 그림은 그대로');
 A(w).setForm(false);const L=w.frame(mk());ok(L[1].image===P&&!hue(L[1]),'② 형상 끄면(라우렌 본인) 그대로');}
// ③ 연결
{const rd=f=>fs.readFileSync(path.join(ROOT,f),'utf8');ok(rd('runtime-text/persona-hero-r1113.js')===rd('client-source/persona-hero-r1113.js'),'③ runtime-text 사본 = client-source');
 ok(fs.readFileSync(path.join(ROOT,'../.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1145/persona-basic-cpu-check.cjs'),'③ pages.yml CPU 검사 줄');
 ok(/R1113-persona-hero-\d+-.*r1145/.test(SRC),'③ 판 이름');}
console.log(fails?('FAILED '+fails):'ALL PASS');process.exit(fails?1:0);
