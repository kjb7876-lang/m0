// R1080 시네마틱 영상 → 선 그림 장면 대체 · R1081 선 그림 컷씬 수묵화풍 CPU 검사
//  사용자 2026-11-15 "모든시네마틱영상 실로그린영상그걸로 대체생성하고 그것돌도 수묵화풍으로 개선"
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),CS=path.join(R,'client-source');
const rd=p=>{try{return fs.readFileSync(p,'utf8');}catch(_){return null;}};
let pass=0,total=0;const ok=(n,c,d)=>{total++;if(c)pass++;else console.log('FAIL',n,d===undefined?'':JSON.stringify(d).slice(0,500));};
const ENGINE='lineart-cine-r880.js',VID='lineart-video-r1080.js',INKF='lineart-ink-r1081.js';
const SCENES=['lineart-scenes-r881.js','lineart-scenes-r882.js','lineart-scenes-r883.js','lineart-scenes-r884.js','lineart-scenes-r885.js','lineart-scenes-r886.js','lineart-scenes-r887.js'];
const SRC=rd(path.join(CS,ENGINE)),SC=SCENES.map(f=>rd(path.join(CS,f))),VSRC=rd(path.join(CS,VID)),ISRC=rd(path.join(CS,INKF));
ok('R1080 file exists',!!VSRC);ok('R1081 file exists',!!ISRC);
if(!SRC||!SC.every(Boolean)||!VSRC||!ISRC){console.log(`R1080 CPU ${pass}/${total}`);process.exit(1);}
// 영상 일곱 편: [장면 id, 영상 루트 id, 영상 파일, 길이(초, ffprobe 실측)]
const CLIPS=[['opening','r309v','assets/r372/opening-book.mp4',9.458],['rootgate','r372v','assets/r372/root-gate.mp4',9.458],['poison','r369v','assets/r369/poison-city.mp4',10],
 ['betrayal','r368v','assets/r368/betrayal.mp4',10],['knight','r617v','assets/r617/knight.mp4',8],['fall','r617v','assets/r617/fall.mp4',5],['beach','r617v','assets/r617/beach.mp4',8]];
const lum=h=>{const m=/^#([0-9a-f]{6})$/i.exec(h||'');if(!m)return NaN;const v=parseInt(m[1],16);return(0.2126*(v>>16&255)+0.7152*(v>>8&255)+0.0722*(v&255))/255;};
const rgbLum=s=>{const m=/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/.exec(s||'');if(m)return(0.2126*+m[1]+0.7152*+m[2]+0.0722*+m[3])/255;return lum(s);};
// ---- 가짜 DOM(r880 검사와 같은 방식): 속성 값을 모두 적어 둔다 ----
function fakeDom(){const attrs=[];const byId=new Map();
 const node=tag=>{const n={tagName:tag,children:[],attrs:{},style:{setProperty(k,v){n.style[k]=v;},removeProperty(k){delete n.style[k];}},dataset:{},listeners:{},parentNode:null,textContent:'',hidden:false,
   classList:{set:new Set(),add(...c){c.forEach(x=>n.classList.set.add(x));},remove(...c){c.forEach(x=>n.classList.set.delete(x));},toggle(c,f){const on=f===undefined?!n.classList.set.has(c):!!f;on?n.classList.set.add(c):n.classList.set.delete(c);return on;},contains:c=>n.classList.set.has(c)},
   setAttribute(k,v){v=String(v);n.attrs[k]=v;attrs.push([tag,k,v]);if(k==='id')byId.set(v,n);},getAttribute:k=>n.attrs[k]??null,removeAttribute(k){delete n.attrs[k];},hasAttribute:k=>k in n.attrs,
   appendChild(c){if(c.parentNode)c.parentNode.children=c.parentNode.children.filter(x=>x!==c);n.children.push(c);c.parentNode=n;return c;},
   insertBefore(c,ref){if(c.parentNode)c.parentNode.children=c.parentNode.children.filter(x=>x!==c);const i=n.children.indexOf(ref);if(i<0)n.children.push(c);else n.children.splice(i,0,c);c.parentNode=n;return c;},
   removeChild(c){n.children=n.children.filter(x=>x!==c);c.parentNode=null;return c;},remove(){if(n.parentNode)n.parentNode.removeChild(n);},
   get firstChild(){return n.children[0]||null;},querySelector(){return null;},querySelectorAll(){return[];},
   addEventListener(t,f){(n.listeners[t]=n.listeners[t]||[]).push(f);},removeEventListener(){},focus(){},getScreenCTM(){return null;},getBoundingClientRect(){return{left:0,top:0,width:1280,height:720};}};
  let id='';Object.defineProperty(n,'id',{get:()=>id,set(v){id=String(v);byId.set(id,n);}});return n;};
 const body=node('body'),head=node('head');
 const document={hidden:false,body,head,activeElement:null,createElement:t=>node(t),createElementNS:(_,t)=>node(t),getElementById:id=>{const n=byId.get(id);return n&&(n.parentNode||n===body)?n:null;}};
 return{document,attrs,body,byId};}
function world(opt={}){const store={...(opt.store||{})};const dom=fakeDom();const frames=[];let nowMs=1000;
 const g={console,Math,Number,Object,JSON,Map,WeakMap,Set,WeakSet,String,Array,Date,Error,RegExp,Symbol,Promise,isFinite,parseFloat,parseInt,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},store,dom,document:dom.document,
  navigator:{webdriver:false},location:{search:''},innerWidth:1280,innerHeight:720,devicePixelRatio:1,performance:{now:()=>nowMs},
  requestAnimationFrame(f){frames.push(f);return frames.length;},cancelAnimationFrame(){},setTimeout(f,ms){g.timers.push([nowMs+(ms||0),f]);return g.timers.length;},clearTimeout(){},setInterval(){return 0;},clearInterval(){},timers:[],
  matchMedia:()=>({matches:!!opt.reduced}),winListeners:{},addEventListener(t,f){(g.winListeners[t]=g.winListeners[t]||[]).push(f);},removeEventListener(){},DOMPoint:function(){},
  started:true,loading:false,modal:null,storyScene:null,layer:'STORY',zone:'hub',time:0,keys:new Set(),settings:{reducedMotion:!!opt.reduced},
  player:{hp:100,hero:'ego',x:0,y:0},room:{id:'hub',layer:'STORY',enemies:[]},regionById:{},baseTicks:0};
 g.window=g;g.globalThis=g;g.completed=()=>false;g.__STORYWORLD_COOP_SIM_R62__={mode:()=>'off'};
 if(opt.wash)g.__STORYWORLD_INK_WASH_R1055__=opt.wash;
 vm.createContext(g);
 vm.runInContext('var tick=function(){baseTicks++;};var enterRegion=async function(id){zone=id;room={id,layer,enemies:[]};return true;};',g);
 vm.runInContext(SRC,g,{filename:ENGINE});SC.forEach((s,i)=>vm.runInContext(s,g,{filename:SCENES[i]}));
 vm.runInContext(VSRC,g,{filename:VID});vm.runInContext(ISRC,g,{filename:INKF});
 g.A=g.__STORYWORLD_LINEART_R880__;g.V=g.__STORYWORLD_LINEART_VIDEO_R1080__;g.I=g.__STORYWORLD_LINEART_INK_R1081__;
 g.raf=(ms=16.7)=>{nowMs+=ms;const fs2=frames.splice(0);fs2.forEach(f=>f(nowMs));};
 // 영상 모듈이 만드는 것과 같은 루트: <div id=rootId><video src=…></video><div class=cap></div></div>
 g.videoRoot=(rootId,src,t=0)=>{const root=dom.document.createElement('div');root.id=rootId;const v=dom.document.createElement('video');v.src='https://x.test/m0/'+src;v.currentTime=t;v.duration=NaN;
  const cap=dom.document.createElement('div');root.appendChild(v);root.appendChild(cap);dom.document.body.appendChild(root);return{root,v,cap};};
 return g;}
const walk=(n,fn)=>{fn(n);for(const c of n.children||[])walk(c,fn);};
const bad=dom=>dom.attrs.filter(([,k,v])=>/NaN|Infinity|undefined|null/.test(v)&&k!=='class');
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').split('\n').filter(l=>!/^\s*\/\//.test(l)).join('\n');
const svgOf=root=>root.children.find(c=>c.tagName==='svg');

// 1) 등록·API
{const g=world(),V=g.V,I=g.I;
 ok('R1080 API exposed',!!V&&typeof V.scan==='function'&&typeof V.clips==='function'&&typeof V.set==='function'&&typeof V.inspect==='function'&&typeof V.preview==='function');
 ok('R1081 API exposed',!!I&&typeof I.dress==='function'&&typeof I.map==='function'&&typeof I.palette==='function'&&typeof I.set==='function'&&typeof I.inspect==='function');
 ok('R880 exports its stage for the video stand-in and keeps its API',typeof g.A.stage==='function'&&['play','skip','seek','add','zones','scene','inspect','set','kit'].every(k=>k in g.A));
 const cl=V?V.clips():[];ok('seven clips registered, one per cinematic video',JSON.stringify(cl.map(c=>c.id).sort())===JSON.stringify(CLIPS.map(c=>c[0]).sort()),cl.map(c=>c.id));
 for(const [id,root,src,D] of CLIPS){const c=cl.find(x=>x.id===id)||{};ok(`clip ${id}: length matches the video (${D}s) and root ${root}`,Math.abs(c.D-D)<=0.06&&c.root===root&&src.includes(c.match),c);}
 ok('zone cutscene list is untouched (video scenes are not zone scenes)',g.A.zones().length===54&&!g.A.zones().some(z=>CLIPS.some(c=>c[0]===z)),g.A.zones().length);
 ok('default on, nothing active',V.inspect().on===true&&V.inspect().active.length===0&&I.inspect().on===true);
 ok('revisions',/^R1080-/.test(V.revision)&&/^R1081-/.test(I.revision));}
// 2) 영상 루트가 뜨면 그 위에 선 그림을 얹고, 영상은 지우지 않는다(시계·소리로 계속 쓴다)
for(const [id,rootId,src,D] of CLIPS){const g=world({store:{'storyworld.r1081.lineartInk':'{"on":false}'}}),V=g.V;const {root,v,cap}=g.videoRoot(rootId,src);const n=V.scan();
 const svg=svgOf(root);ok(`${id}: scan attaches one svg`,n===1&&!!svg&&V.inspect().active.join()===id,[n,V.inspect()]);
 if(!svg)continue;
 ok(`${id}: svg sits right after the video, below the module's own caption`,root.children.indexOf(svg)===root.children.indexOf(v)+1&&root.children.indexOf(cap)>root.children.indexOf(svg));
 ok(`${id}: video element kept in place with its source`,v.parentNode===root&&v.src.endsWith(src)&&root.classList.contains('r1080on'));
 ok(`${id}: svg is not clickable and hidden from readers`,svg.attrs['aria-hidden']==='true'&&/0 [\d.]+ 640 [\d.]+/.test(svg.attrs.viewBox||''),svg.attrs);
 ok(`${id}: scanning twice does not attach twice`,V.scan()===0&&root.children.filter(c=>c.tagName==='svg').length===1);
 // 영상 시간을 따라 그린다: 처음부터 끝까지 0.2초 걸음, 그리기 값에 NaN·Infinity 없음
 const snap=()=>{const a=[];walk(svg,x=>{if(x.attrs.d)a.push(x.attrs.d);if(x.attrs.transform)a.push(x.attrs.transform);});return a.join('|');};
 const seen=new Set();let errs=0;for(let t=0;t<=D+0.3;t+=0.2){v.currentTime=t;g.raf();seen.add(snap().length+':'+snap().slice(0,4000));if(V.inspect().lastError)errs++;}
 ok(`${id}: follows the video clock without errors`,errs===0&&V.inspect().active.join()===id,V.inspect().lastError);
 ok(`${id}: no NaN/Infinity/undefined reaches a drawing attribute`,bad(g.dom).length===0,bad(g.dom).slice(0,3));
 ok(`${id}: the picture moves (at least 20 distinct frames over ${D}s)`,seen.size>=20,seen.size);
 ok(`${id}: scene clock equals the video clock (clamped to its length)`,Math.abs(V.inspect().t[id]-D)<0.02,V.inspect().t);
 v.currentTime=1.0;g.raf();ok(`${id}: rewinding rebuilds from the start`,Math.abs(V.inspect().t[id]-1.0)<0.02&&!V.inspect().lastError&&bad(g.dom).length===0,V.inspect());
 let texts=0;walk(svg,x=>{if(x.tagName==='text'||x.textContent)texts++;});ok(`${id}: draws no text of its own (captions stay the module's canon lines)`,texts===0&&cap.textContent==='');
 // 경계값: 시간 값이 깨져도 그리기는 안전
 for(const t of [NaN,-3,Infinity,1e9,undefined]){v.currentTime=t;g.raf();}
 ok(`${id}: broken clock values are clamped`,!V.inspect().lastError&&bad(g.dom).length===0&&V.inspect().t[id]>=0&&V.inspect().t[id]<=D+1e-6,V.inspect());
 // 영상 루트가 닫히면 같이 끝난다
 root.remove();g.raf();g.raf();ok(`${id}: ends when the module closes its root`,V.inspect().active.length===0&&!V.inspect().lastError);}
// 3) 대체하지 않는 경우
{const g=world({store:{'storyworld.r1080.lineartVideo':'{"on":false}'}}),V=g.V;const {root}=g.videoRoot('r369v','assets/r369/poison-city.mp4');
 ok('off: nothing attached, video shown as before',V.scan()===0&&!svgOf(root)&&!root.classList.contains('r1080on')&&V.inspect().on===false);
 V.set({on:true});ok('set on: persists and attaches at the next scan',JSON.parse(g.store['storyworld.r1080.lineartVideo']).on===true&&V.scan()===1&&!!svgOf(root));
 V.set({on:false});g.raf();ok('set off while playing: stand-in removed, video shown again',!svgOf(root)&&!root.classList.contains('r1080on')&&V.inspect().active.length===0);}
{const g=world(),V=g.V;const a=g.videoRoot('r309v','assets/r309/intro/opening-hapil.mp4');
 ok('unknown video file in a known root is left alone',V.scan()===0&&!svgOf(a.root));
 const b=g.videoRoot('otherRoot','assets/r369/poison-city.mp4');ok('known file in an unknown root is left alone',V.scan()===0&&!svgOf(b.root));
 const c=g.dom.document.createElement('div');c.id='r368v';g.dom.document.body.appendChild(c);ok('root without a video is left alone',V.scan()===0&&!V.inspect().lastError);}
{const g=world({store:{'storyworld.r1080.lineartVideo':'{broken'}});ok('corrupt setting falls back to on',g.V.inspect().on===true);}
{const g=world({reduced:true,store:{'storyworld.r1081.lineartInk':'{"on":false}'}}),V=g.V;const {root,v}=g.videoRoot('r617v','assets/r617/knight.mp4');V.scan();v.currentTime=3;g.raf();
 let filt=0;walk(svgOf(root),x=>{if(x.tagName==='g'&&x.attrs.filter&&/ink/.test(x.attrs.filter))filt++;});ok('reduced motion: light mode (no line-wobble filter)',filt===0&&V.inspect().lite===true,[filt,V.inspect().lite]);}
{const g=world(),V=g.V;const a=g.videoRoot('r617v','assets/r617/fall.mp4'),b=g.videoRoot('r369v','assets/r369/poison-city.mp4');
 ok('two roots at once each get their own scene',V.scan()===2&&V.inspect().active.sort().join()==='fall,poison');
 const p=V.preview('beach',{at:4});ok('preview draws a still without a video',!!p&&!!svgOf(p)&&!V.inspect().lastError&&bad(g.dom).length===0);
 ok('preview of an unknown clip is refused',V.preview('nope')===null);}
// 4) 서사·원본 보존
{const code=strip(VSRC)+strip(ISRC);ok('no Korean text literal in code (no new story text, labels or captions)',!/[가-힣]/.test(code),(code.match(/[^\n]*[가-힣][^\n]*/)||[''])[0].slice(0,120));
 for(const [,,src] of CLIPS)ok('original video kept: '+src,fs.existsSync(path.join(R,'runtime-text',src)));
 const mods={'intro-video-r309.js':["SRC='assets/r372/opening-book.mp4'"],'root-gate-video-r372.js':["SRC='assets/r372/root-gate.mp4'"],'poison-city-video-r369.js':["SRC='assets/r369/poison-city.mp4'",'그의 목소리가 들릴 때마다 나는 항상 약을 갈망했다.'],
  'betrayal-video-r368.js':["SRC='assets/r368/betrayal.mp4'",'CUES=Object.freeze([[3.4,6.3,0],[6.3,8.2,1],[8.2,11,2]])'],'hwando-fall-video-r617.js':['거센 폭풍이 몸을 밀어내어 발 디딜 곳부터 찾아야 했다.','눈을 뜨니 젖은 모래 해안에 누워 있었다.']};
 for(const f in mods){const s=rd(path.join(CS,f))||'';ok('video module untouched (source, captions, timing): '+f,mods[f].every(x=>s.includes(x)));}
 ok('no cross-like halo: knight halo is a ring',!/십자/.test(VSRC.replace(/^\s*\/\/.*$/gm,'')));}
// 5) R1081 수묵 색 옮김
{const g=world(),I=g.I,P=I.palette();
 ok('palette: dark ink, mid wash, light paper',rgbLum(P.inkCss)<0.2&&rgbLum(P.midCss)>0.25&&rgbLum(P.midCss)<0.55&&rgbLum(P.papCss)>0.62,P);
 const m=(c,r)=>I.map(c,r);
 ok('dark mass fill becomes a mid wash (lines stay readable on it)',[ '#060508','#0d0a15','#15121d','#040306','#2a2630'].every(c=>{const l=lum(m(c,'fill'));return l>=0.24&&l<=0.5;}),['#060508','#0d0a15','#15121d','#040306'].map(c=>m(c,'fill')));
 ok('darker source stays darker after mapping',lum(m('#040306','fill'))<lum(m('#2a2630','fill')));
 ok('white and coloured fills keep their colour',m('#ece7df','fill')==='#ece7df'&&m('#7a2f2a','fill')==='#7a2f2a'&&m('#ece7f5','fill')==='#ece7f5');
 ok('light explicit line colours are darkened, hue kept',lum(m('#fff3d6','stroke'))<0.42&&lum(m('#ff5a48','stroke'))<0.42&&(()=>{const v=parseInt(m('#ff5a48','stroke').slice(1),16);return(v>>16&255)>(v>>8&255)+30;})(),[m('#fff3d6','stroke'),m('#ff5a48','stroke')]);
 ok('dark line colours are kept',m('#6d6585','stroke')==='#6d6585');
 ok('non-colour values pass through',['none','currentColor','url(#r880sky)','',null,undefined,'transparent'].every(c=>m(c,'fill')===c&&m(c,'stroke')===c));
 ok('mapping is stable when applied twice',['#060508','#15121d','#ece7df','#fff3d6','#ff5a48','#6d6585','#000','#fff','#123'].every(c=>['fill','stroke'].every(r=>m(m(c,r),r)===m(c,r))));
 ok('short hex and odd input do not break',/^#[0-9a-f]{6}$/i.test(m('#123','fill'))&&m('#12','fill')==='#12'&&m('#zzzzzz','stroke')==='#zzzzzz');}
{const wash={styles:{jg:{ink:[.07,.085,.11],mid:[.35,.37,.395],pap:[.80,.78,.70]},song:{ink:[.15,.13,.10],mid:[.40,.36,.29],pap:[.74,.68,.54]}},prefs:()=>({mode:'all',style:'song'})};
 const g=world({wash}),P=g.I.palette();ok('palette follows the map ink-wash style the player picked (R1055)',Math.abs(P.pap[0]-.74)<.07&&Math.abs(P.pap[2]-.54)<.1&&P.style==='song',P);
 const g2=world({wash:{styles:{jg:{ink:[NaN,1,2],mid:null,pap:[Infinity,.5,.5]}},prefs:()=>({style:'jg'})}}),P2=g2.I.palette();
 ok('broken map palette values fall back to safe numbers',[...P2.ink,...P2.mid,...P2.pap].every(v=>Number.isFinite(v)&&v>=0&&v<=1)&&rgbLum(P2.papCss)>0.62&&rgbLum(P2.inkCss)<0.2,P2);
 const g3=world({wash:{styles:{},prefs:()=>{throw Error('x');}}});ok('a throwing map module does not break the palette',rgbLum(g3.I.palette().papCss)>0.62&&!g3.I.inspect().lastError);}
// 6) 기존 지역 컷씬(54곳)도 수묵으로 — 장면을 지은 뒤 색을 옮긴다
{const g=world(),A=g.A,I=g.I;let worst=null,cnt=0;
 for(const z of A.zones()){A.play({zone:z,at:6});const root=g.dom.document.getElementById('r880');if(!root){worst=[z,'no root'];break;}const svg=svgOf(root);const n=I.dress(svg);cnt++;
  const st=svg.style,ink=st.color,pap=st['--paper'];if(!(rgbLum(ink)<0.2&&rgbLum(pap)>0.62)){worst=[z,'root',ink,pap];break;}
  let badF=null;walk(svg,x=>{if(x===svg)return;const fl=x.attrs.fill,sk=x.attrs.stroke,sc=x.attrs['stop-color'];
   if(fl&&/^#/.test(fl)&&lum(fl)<0.235&&!(/^#0{3,6}$/.test(fl)&&x.tagName!=='rect'&&+x.attrs.opacity<=0.5))badF=badF||['fill',x.tagName,fl,x.attrs.opacity];
   if(sk&&/^#/.test(sk)&&lum(sk)>0.5)badF=badF||['stroke',x.tagName,sk];
   if(sc&&x.parentNode&&x.parentNode.attrs.id==='r880sky'&&lum(sc)<0.5)badF=badF||['sky',sc];
   const sty=x.attrs.style||'';if(/mix-blend-mode:\s*screen/.test(sty))badF=badF||['blend',sty];});
  if(badF){worst=[z,...badF];break;}if(!root.classList.contains('r1081')){worst=[z,'class'];break;}
  A.skip();g.timers.splice(0).forEach(t=>t[1]());}
 ok('every zone cutscene: dark ink on light paper, dark masses to wash, light lines darkened, glow not screen-blended',!worst&&cnt===54,worst||cnt);
 ok('no NaN/Infinity written while dressing',bad(g.dom).length===0,bad(g.dom).slice(0,3));ok('no error while dressing',!I.inspect().lastError,I.inspect().lastError);}
{const g=world(),V=g.V,I=g.I;const {root,v}=g.videoRoot('r372v','assets/r372/root-gate.mp4');V.scan();v.currentTime=5;g.raf();const svg=svgOf(root);
 ok('video stand-in is dressed in ink too',rgbLum(svg.style.color)<0.2&&rgbLum(svg.style['--paper'])>0.62&&root.classList.contains('r1081'),[svg.style.color,svg.style['--paper']]);
 let dk=0;walk(svg,x=>{const fl=x.attrs.fill;if(x!==svg&&fl&&/^#/.test(fl)&&lum(fl)<0.235&&!(/^#0{3,6}$/.test(fl)&&x.tagName!=='rect'&&+x.attrs.opacity<=0.5))dk++;});
 for(let t=5;t<9.4;t+=0.25){v.currentTime=t;g.raf();}let dk2=0;walk(svg,x=>{const fl=x.attrs.fill;if(x!==svg&&fl&&/^#/.test(fl)&&lum(fl)<0.235&&!(/^#0{3,6}$/.test(fl)&&x.tagName!=='rect'&&+x.attrs.opacity<=0.5))dk2++;});
 ok('colours set while the scene runs are mapped as well',dk===0&&dk2===0,[dk,dk2]);}
{const g=world({store:{'storyworld.r1081.lineartInk':'{"on":false}'}}),A=g.A,I=g.I;A.play({zone:'dist01',at:6});const root=g.dom.document.getElementById('r880'),svg=svgOf(root),c0=svg.style.color;
 ok('ink off: scene keeps its own colours',I.dress(svg)===0&&svg.style.color===c0&&!root.classList.contains('r1081')&&I.inspect().on===false);
 I.set({on:true});ok('ink set: persists',JSON.parse(g.store['storyworld.r1081.lineartInk']).on===true&&I.inspect().on===true);I.set({on:'yes'});ok('ink set ignores non-boolean',I.inspect().on===true);}
{const g=world({store:{'storyworld.r1081.lineartInk':'[1,2'}});ok('corrupt ink setting falls back to on',g.I.inspect().on===true);}
// 7) 빌드 연결
{const html=rd(path.join(R,'runtime-text','index.html'))||'',ver=rd(path.join(ROOT,'scripts','verify-r96-public.py'))||'',yml=rd(path.join(ROOT,'.github','workflows','pages.yml'))||'';
 ok('script tags: r1080 then r1081 right after the line-art voice table',html.includes('<script src="./lineart-voice-r888-data.js"></script>\n<script src="./lineart-video-r1080.js"></script>\n<script src="./lineart-ink-r1081.js"></script>\n'));
 ok('public verify expects both files',ver.includes("'lineart-video-r1080.js'")&&ver.includes("'lineart-ink-r1081.js'"));
 ok('CI runs this check',yml.includes('node r96/qa/r1080/r1080-cpu-check.cjs'));
 for(const f of ['runtime-inputs.json','runtime-manifest.json']){const s=rd(path.join(R,f))||'';ok(f+' lists both files',s.includes('lineart-video-r1080.js')&&s.includes('lineart-ink-r1081.js'));}}
console.log(`R1080 CPU ${pass}/${total}`);process.exit(pass===total?0:1);
