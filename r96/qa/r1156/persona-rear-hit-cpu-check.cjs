// R1156 실패 먼저: Dots CX-0136 A5 페르소나 보스(기본형) 뒤 피격 r2 적용(사용자 2026-11-18 08:22Z "주기적으로 구글드라이브 이용해서 닷츠랑 상호작용해서 필요한 자산생성및 개선적용해").
// 검사: ① 기본형 뒤 피격 시트를 새 r2 그림으로 읽음(각성형·정면·옆은 그대로) ② 새 그림을 못 읽으면 예전 R1119 그림으로 다시 읽음(게임이 안 멈춤)
//  ③ 뒤(4) 피격 → 4칸 차례, 끝나면 원래 그림, 실제 좌표 그대로 ④ 자산: 2048×512 webp, runtime-inputs 등록, 출처 표 ⑤ 빌드 연결(runtime-text 사본·pages.yml·공개 검사 접두)
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'../..'),FILE=path.join(ROOT,'client-source/persona-stride-r1104.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const SRC=fs.readFileSync(FILE,'utf8'),NEW='assets/r1156/persona-hit-base-rear-r2.webp',OLD='assets/r1119/persona-hit-base-rear.webp';
function world(){
 const persona={id:'cult04:inner-evil-rc133',persona:true,boss:true,hp:100,x:10,y:10,spawnState:'active'};
 let seen=null;const proto={render(frame){seen=frame.commands.map(c=>({...c,points:c.points&&c.points.map(p=>[...p])}));}};
 const store={},timers=[],images=[];
 const ctx2d=()=>({drawImage(){},getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4),width:w,height:h}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4),width:w,height:h}),putImageData(){},clearRect(){},save(){},restore(){},scale(){},translate(){},fillRect(){},
  createRadialGradient:()=>({addColorStop(){}}),set filter(v){},get filter(){return 'none';},set globalCompositeOperation(v){},set fillStyle(v){},set globalAlpha(v){}});
 const document={createElement:t=>{const cv={tagName:t,width:300,height:150};cv.getContext=()=>ctx2d();return cv;},baseURI:'http://x/'};
 class Img{constructor(){images.push(this);this.naturalWidth=0;this.naturalHeight=0;}set src(v){this._src=v;this._done=false;this.srcs=(this.srcs||[]).concat(v);}get src(){return this._src;}}
 const C={Math,Number,JSON,Object,Array,Map,Set,WeakMap,WeakSet,String,Error,URL,console,Uint8ClampedArray,time:0,room:{id:'cult04',enemies:[persona],persona:{phase:'fight'}},
  setInterval:()=>0,setTimeout:f=>{timers.push(f);return timers.length;},StoryPhase1:{ThreeRenderer:{prototype:proto}},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};
 C.performance={now:()=>C.time*1000};C.document=document;C.Image=Img;C.window=C;vm.createContext(C);vm.runInContext(SRC,C);
 const body=(dir=0,kind='base')=>({kind:'image',key:'cult04:inner-evil-rc133:0',order:5,owner:{kind:'enemy',id:'cult04:inner-evil-rc133'},sourcePath:`assets/rc133/art/${kind}-${dir}.png`,image:{},sourceRect:[0,0,344,400],imageSize:[344,400],style:{globalAlpha:1},points:[[500,150],[586,150],[586,250],[500,250]]});
 const frame=cmds=>{proto.render.call({},{commands:cmds});return seen;};
 const load=(fail=()=>false)=>{for(let n=0;n<400;n++){let did=false;for(const im of images)if(im._src&&!im._done){im._done=true;did=true;if(fail(im._src)){if(typeof im.onerror==='function')im.onerror();continue;}
   if(typeof im.onload==='function'){im.naturalWidth=8192;im.naturalHeight=512;im.width=8192;im.height=512;im.onload();}}while(timers.length){timers.shift()();did=true;}if(!did)break;}};
 const stand=(sec,dir=0,kind='base',each)=>{let out=null;for(let t=0;t<sec-1e-9;t+=1/30){C.time+=1/30;out=frame([body(dir,kind)]);if(each)each(out);}return out;};
 return {C,persona,stand,load,images,api:()=>C.__STORYWORLD_PERSONA_STRIDE_R1104__};}
const bodies=cmds=>cmds.filter(c=>/rc133\/art\/|r1097:ink|r1104b:walk|r1119:(hit|death)/.test(String(c.sourcePath)));
const hitOf=c=>{const m=/^r1119:hit:(base|awake)-(front|side|rear):(\d+):(raw|ink)$/.exec(String(c.sourcePath));return m?{form:m[1],dir:m[2],f:+m[3]}:null;};
const srcs=w=>w.images.flatMap(im=>im.srcs||[]).map(s=>String(s).replace(/^http:\/\/x\//,''));
// ① 새 그림으로 읽음
{const w=world();w.stand(.1);const s=srcs(w);
 ok(s.includes(NEW),'① 기본형 뒤 피격 시트 = 새 r2 그림('+s.filter(x=>/rear/.test(x)).join(',')+')');
 ok(!s.includes(OLD),'① 새 그림이 있으면 예전 R1119 뒤 피격은 안 받음');
 ok(['assets/r1119/persona-hit-awake-rear.webp','assets/r1119/persona-hit-base-front.webp','assets/r1119/persona-hit-base-side.webp'].every(p=>s.includes(p)),'① 각성형 뒤·기본형 정면·옆은 그대로 R1119');}
// ② 새 그림을 못 읽으면 예전 그림
{const w=world();w.stand(.1);w.load(src=>/r1156/.test(src));const s=srcs(w),st=w.api().sheets()['hit-base-rear'];
 const im=w.images.find(x=>(x.srcs||[]).some(v=>/r1156/.test(v))),seq=im?(im.srcs||[]).map(v=>String(v).replace(/^http:\/\/x\//,'')):[];
 ok(seq[0]===NEW&&seq[1]===OLD&&st&&st.state==='ready','② 새 그림 실패 → 같은 시트를 예전 R1119 그림으로 다시 읽어 준비됨('+seq.join(' → ')+', '+(st&&st.state)+')');}
// ③ 뒤 피격 4칸
{const w=world();w.load();w.stand(.3,4,'base');w.load();w.persona.hp-=5;const seen=[];w.stand(1,4,'base',o=>{const b=bodies(o);seen.push(b.length===1?(hitOf(b[0])||b[0].sourcePath):'n'+b.length);});
 const h=seen.filter(x=>typeof x==='object'),fr=[...new Set(h.map(x=>x.f))];
 ok(h.length>=6&&h.every(x=>x.form==='base'&&x.dir==='rear')&&fr.join()==='0,1,2,3','③ 뒤 피격 → base-rear 4칸 차례('+fr+', '+h.length+'장)');
 ok(seen.slice(-3).every(x=>x==='assets/rc133/art/base-4.png'),'③ 끝나면 원래 그림');ok(w.persona.x===10&&w.persona.y===10,'③ 실제 좌표·넉백 없음');
 ok(w.api().sheets()['hit-base-rear'].state==='ready','③ 새 시트 준비됨');}
// ④ 자산
{const f=path.join(ROOT,'runtime-text',NEW),ex=fs.existsSync(f),b=ex?fs.readFileSync(f):Buffer.alloc(0);let W=0,Hh=0;
 if(b.length>30&&b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'){const k=b.toString('ascii',12,16);
  if(k==='VP8X'){W=1+b.readUIntLE(24,3);Hh=1+b.readUIntLE(27,3);}else if(k==='VP8L'){const v=b.readUInt32LE(21);W=1+(v&0x3fff);Hh=1+((v>>14)&0x3fff);}else if(k==='VP8 '){W=b.readUInt16LE(26)&0x3fff;Hh=b.readUInt16LE(28)&0x3fff;}}
 ok(ex&&W===2048&&Hh===512,'④ 새 그림 2048×512 webp ('+W+'×'+Hh+')');
 const inputs=fs.existsSync(path.join(ROOT,'runtime-inputs.json'))?fs.readFileSync(path.join(ROOT,'runtime-inputs.json'),'utf8'):'';ok(inputs.includes(NEW),'④ runtime-inputs 등록');
 const idx=path.join(ROOT,'runtime-text/assets/r1156/index.json');let J=null;try{J=JSON.parse(fs.readFileSync(idx,'utf8'));}catch(_){}
 const e=J&&J.assets&&J.assets.find(a=>a.file===NEW);ok(!!e&&/CX-0136/.test(e.source)&&/^[0-9a-f]{64}$/.test(e.sourceSha256||'')&&e.sha256===require('crypto').createHash('sha256').update(b).digest('hex'),'④ 출처 표(원본·해시) 맞음');
 ok(fs.readFileSync(FILE,'utf8').includes(OLD),'④ 예전 R1119 그림 경로는 대체용으로 남음');}
// ⑤ 빌드 연결
{const a=fs.readFileSync(FILE,'utf8'),b=fs.readFileSync(path.join(ROOT,'runtime-text/persona-stride-r1104.js'),'utf8');ok(a===b,'⑤ runtime-text 사본 같음');
 ok(fs.readFileSync(path.join(ROOT,'../.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1156/persona-rear-hit-cpu-check.cjs'),'⑤ pages.yml CPU 검사 줄');
 ok(fs.readFileSync(path.join(ROOT,'../scripts/verify-r96-public.py'),'utf8').includes("'assets/r1156/'"),'⑤ 공개 검사가 assets/r1156/ 를 봄');}
console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
