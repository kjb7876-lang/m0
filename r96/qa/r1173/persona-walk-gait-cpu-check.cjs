// R1173 실패 먼저(사용자 11-18 14:31Z "페르소나영웅 위랑 좌우움직일때 다리가 너무빠르고 좌우다리특히 허벅지랑허리연결이 좀부자연스러움").
// 원인: R1120 이 칸 넘김을 엔진 영웅과 같은 '세계 거리 1당 3.2칸'으로 맞췄는데, 영웅 기본 속도 4.75칸/초에선 초당 15.2칸 = 한 주기 0.53초(초당 3.8걸음, 달리기 박자).
//  게다가 위·아래 이동은 화면에서 옆 이동의 절반만 움직이므로(project: 가로 (x-y)·TILE, 세로 (x+y)·TILE/2) 같은 박자라도 화면 거리 대비 다리가 2배 빨라 보인다.
// 검사: G1 옆 걷기 거리 1당 1.6~2.2칸 G2 위·아래 1.2~1.7칸 G3 기본 속도 4.75 에서 한 주기(8칸) 옆 0.8~1.3초·위아래 1.0~1.6초
//       G4 화면 거리 대비 위아래 박자 / 옆 박자 ≤ 1.6(예전 2.0) G5 빠르게(6/초) 걸어도 렌더마다 1칸 이하 G6 API walkRate G7 새 시트 빌드 연결
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'../..'),FILE=path.join(ROOT,'client-source/persona-hero-r1113.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const SRC=fs.readFileSync(FILE,'utf8');
const hooks=fs.readFileSync(path.join(ROOT,'client-source/ego-sovereign-r1046.js'),'utf8');
function world(o={}){
 const store=o.store||{},images=[];let seen=null;const proto={render(frame){seen=frame.commands.map(c=>({...c,points:c.points&&c.points.map(p=>[...p]),style:c.style&&{...c.style}}));}};
 const document={createElement:t=>({tagName:t,width:0,height:0,getContext:()=>({drawImage(){},fillRect(){},createRadialGradient:()=>({addColorStop(){}})})}),baseURI:'http://x/m0/',getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},head:{appendChild(){}}};
 class Img{constructor(){images.push(this);}set src(v){this._src=v;}get src(){return this._src;}}
 const player={hero:'lauren',x:10,y:10,hp:100,direction:'front',attackAnim:0,skillAnim:0,ultimateAnim:0};
 const C={Math,Number,JSON,Object,Array,Map,Set,WeakMap,WeakSet,String,Error,URL,console,Date,time:0,player,room:{id:'cult04'},loading:false,storyScene:null,modal:false,started:true,
  zoom:1,actorHeight:()=>66,project:(x,y)=>({x:500+(x-y)*16,y:300+(x+y)*8}),toast:()=>{},
  setInterval:()=>0,setTimeout:()=>0,StoryPhase1:{ThreeRenderer:{prototype:proto}},document,Image:Img,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};
 C.setHudTextR63R2=()=>{};C.tick=function(){};C.serializeSave=()=>({player:{}});C.restoreSave=async()=>{};C.__STORYWORLD_CHEAT777__={active:()=>true};
 C.pfx=[];C.__STORYWORLD_PIXELFX_R163__=Object.freeze({has:()=>true,play:(n,x,y,o)=>{C.pfx.push(o);return 1;},frameAt:(n,u,x,y,o)=>{C.pfxF.push(o);return 1;}});C.pfxF=[];
 C.window=C;vm.createContext(C);vm.runInContext(hooks,C);vm.runInContext(SRC,C);
 const load=()=>{for(const im of images)if(im._src&&!im._done&&im.onload){im._done=true;const s=im._src;im.naturalWidth=/walk/.test(s)?4096:/persona-idle/.test(s)?1152:/r1119\/fx-[a-z-]+-flight/.test(s)?2048:/r1119\/fx-[a-z-]+-contact/.test(s)?1536:344;im.naturalHeight=/walk/.test(s)?512:/r1119|persona-idle/.test(s)?256:400;im.onload();}};
 const frame=cmds=>{proto.render.call({}, {commands:cmds});return seen;};
 const step=(dt=1/30)=>{C.time+=dt;C.tick();};
 return {C,player,frame,load,step,api:()=>C.__STORYWORLD_PERSONA_HERO_R1113__};}
const LB='r409:outline:hero:u:http://x/m0/assets/r130/lauren/directions-lauren-front.webp:181,55,150,421:20';
const Q=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const body=(sp=LB,q=Q(480,240,26,61))=>({kind:'image',key:'hero:2:0',order:5,owner:{id:'hero:2',kind:'hero'},sourcePath:sp,sourceRect:[0,0,192,463],style:{filter:'none'},points:q});
const ready=(o)=>{const w=world(o);w.api().setForm(true);w.frame([body()]);w.load();w.step();w.frame([body()]);w.load();return w;};
// 방향: 화면 왼쪽 = 세계 (-1,+1), 화면 위 = (-1,-1), 화면 아래 = (+1,+1)
const DIRS={left:[-1,1],right:[1,-1],up:[-1,-1],down:[1,1]};
function run(dir,speed,sec=3){const w=ready();const [ux,uy]=DIRS[dir];w.player.direction=dir==='up'?'back':dir==='down'?'front':dir;let dist=0,adv=0,maxJ=0,prev=null,sheet=null;const n=Math.round(sec*30);
 for(let i=0;i<n;i++){const d=speed/30;w.player.x+=ux*d*Math.SQRT1_2;w.player.y+=uy*d*Math.SQRT1_2;w.step();const b=w.frame([body()]).find(c=>c.owner.kind==='hero');const m=/persona-walk-(\w+)\.webp:(\d)/.exec(b.sourcePath||'');
  if(m){sheet=m[1];const f=+m[2];if(prev!=null){const j=(f-prev+8)%8;adv+=j;maxJ=Math.max(maxJ,j);if(i>12)dist+=d;else adv-=j;}prev=f;}else prev=null;}
 const rate=adv/(dist||1e-9);return {rate,maxJ,sheet,cycle:8/(rate*speed)};}
const R={};for(const dir of Object.keys(DIRS))for(const sp of [2.4,4.75])R[dir+sp]=run(dir,sp);
const f2=v=>v.toFixed(2);
for(const dir of ['left','right']){const a=R[dir+2.4],b=R[dir+4.75];ok(a.sheet==='side'&&a.rate>=1.6&&a.rate<=2.2&&b.rate>=1.6&&b.rate<=2.2,'G1 '+dir+' 옆 걷기 거리 1당 '+f2(a.rate)+'·'+f2(b.rate)+'칸 (1.6~2.2, 예전 3.2) 시트 '+a.sheet);}
for(const dir of ['up','down']){const a=R[dir+2.4],b=R[dir+4.75];ok(a.rate>=1.2&&a.rate<=1.7&&b.rate>=1.2&&b.rate<=1.7,'G2 '+dir+' 걷기 거리 1당 '+f2(a.rate)+'·'+f2(b.rate)+'칸 (1.2~1.7) 시트 '+a.sheet);}
{const s=R['left4.75'].cycle,u=R['up4.75'].cycle;ok(s>=.8&&s<=1.3,'G3 기본 속도 4.75 옆 한 주기 '+f2(s)+'초 (0.8~1.3, 예전 0.53)');ok(u>=1.0&&u<=1.6,'G3 기본 속도 4.75 위 한 주기 '+f2(u)+'초 (1.0~1.6)');}
// 화면 거리: 옆 1칸 = √2·TILE, 위 1칸 = √2·TILE/2 → 화면 px 당 칸 수 비 = (위 rate·2)/(옆 rate)
{const q=(R['up4.75'].rate*2)/R['left4.75'].rate;ok(q<=1.6,'G4 화면 거리 대비 위 박자/옆 박자 = '+f2(q)+' ≤ 1.6 (예전 2.0)');}
{const a=run('left',6,2),b=run('up',6,2);ok(a.maxJ<=1&&b.maxJ<=1,'G5 빠르게(6/초) 걸어도 렌더마다 최대 '+Math.max(a.maxJ,b.maxJ)+'칸');}
{const w=ready(),wr=w.api().walkRate;ok(wr&&wr.side>=1.6&&wr.side<=2.2&&wr.vertical>=1.2&&wr.vertical<=1.7,'G6 API walkRate '+JSON.stringify(wr));}
{const man=fs.readFileSync(path.join(ROOT,'runtime-manifest.json'),'utf8'),inp=fs.readFileSync(path.join(ROOT,'runtime-inputs.json'),'utf8');ok(man.includes('assets/r1173/persona-walk-side.webp')&&inp.includes('assets/r1173/persona-walk-side.webp'),'G7 새 시트가 runtime-manifest·runtime-inputs 에 있음');}
console.log('R1173 persona-walk-gait '+(fails?'FAILED '+fails:'OK'));process.exit(fails?1:0);
