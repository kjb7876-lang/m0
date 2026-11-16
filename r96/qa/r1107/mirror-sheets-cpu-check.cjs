// R1107 실패 먼저: Dots CX-0118PM r1 페르소나 '거울 천체' 시트(PM-1 붉은 거울별, PM-3 자아 월식)를 R1096 임시 그림(라우렌 시트 hue-rotate) 대신 쓴다.
// 검사: ① 시트 파일 자리 ② 붉은 거울별은 PM-1 시트를 색 필터 없이 그림(라우렌 시트 안 씀) ③ 자아 월식 예고(충전)는 PM-3 앞 12칸(0~11)이 차례로,
//       발동(관통탄)은 뒤 12칸(12~23) ④ 왼쪽으로 날면 좌우 뒤집기(그림은 오른쪽 진행) ⑤ 시트가 아직 안 읽혔으면 예전 임시 그림으로 ⑥ 빌드 연결(자산 목록).
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'../..');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const SRC=fs.readFileSync(path.join(ROOT,'client-source/persona-gravity-r1096.js'),'utf8');
const RED='assets/r1107/persona-red-star.webp',ECL='assets/r1107/persona-eclipse.webp';
for(const f of [RED,ECL])ok(fs.existsSync(path.join(ROOT,'runtime-text',f)),'① 시트 파일 '+f);
function world(o={}){
 const persona={id:7,name:'페르소나',persona:true,boss:true,hp:500,x:10,y:10,damage:20,spawnState:'active'};
 const player={x:15,y:10,hp:500,invincible:0,invReason:''};const effects=[];const draws=[];
 const imgs={};const mk=(w,h)=>({naturalWidth:w,naturalHeight:h});
 if(o.ready!==false){imgs[RED]=mk(1152,768);imgs[ECL]=mk(1152,768);}
 for(const k of ['lauren-red','lauren-blue','lauren-blue-disk','lauren-fuse','lauren-violet'])imgs['assets/r946/'+k+'.webp']=mk(1152,k==='lauren-fuse'?384:768);
 const noop=()=>{};const state={filter:'none'};
 const ctx=new Proxy({globalAlpha:1,globalCompositeOperation:'source-over',lineWidth:1,fillStyle:'',strokeStyle:'',scope:(o,f)=>f(),
  save(){},restore(){state.filter='none';},drawImage:(im,sx,sy,sw,sh,dx,dy,dw,dh)=>draws.push({path:im.__p,sx,sy,filter:state.filter,flip:state.flip}),
  scale:(x,y)=>{if(x<0)state.flip=true;}},{get:(t,k)=>k==='filter'?state.filter:(k in t?t[k]:noop),set:(t,k,v)=>{if(k==='filter')state.filter=v;else t[k]=v;return true;},has:(t,k)=>k==='filter'||k in t});
 for(const [p,im] of Object.entries(imgs))im.__p=p;
 const C={Math,Number,JSON,Object,Array,Map,Set,WeakMap,String,Date,Error,console,setTimeout:()=>0,time:100,player,modal:false,loading:false,storyScene:null,started:true,effects,
  room:{activeEncounter:'persona',enemies:[persona]},liveEnemies:()=>[persona].filter(e=>e.hp>0),blocked:()=>false,clearLine:()=>true,moveActor(a,dx,dy){a.x+=dx;a.y+=dy;},hurt:()=> 'hit',
  project:(x,y)=>({x:(x-y)*34+480,y:(x+y)*17+280}),TILE:34,zoom:1,ctx,readyImage:p=>imgs[p]?{image:imgs[p]}:null,ensureImages:()=>null,sound(){},tick(){},drawEffect(){},
  localStorage:{getItem:()=>null,setItem(){}}};
 C.window=C;vm.createContext(C);vm.runInContext(SRC,C);const api=C.__STORYWORLD_PERSONA_GRAVITY_R1096__;api.qaRandom(()=>.99);
 const step=(sec,dt=1/30)=>{for(let t=0;t<sec;t+=dt){C.time+=dt;C.tick(dt);}};
 const paint=()=>{draws.length=0;const s=effects.find(e=>e&&e.r1096Sentinel);if(s)C.drawEffect(s);return draws.slice();};
 return {C,api,step,paint,persona,player};}
const cell=d=>Math.round(d.sy/192)*6+Math.round(d.sx/192);
// ② 붉은 거울별
{const w=world();w.api.qaForce('crimson');w.step(.3);let d=w.paint();ok(d.some(x=>x.path===RED),'② 예고 중 붉은 거울별 = PM-1 시트');
 w.step(.6);d=w.paint();const s=d.filter(x=>x.path===RED);ok(s.length>0&&s.every(x=>x.filter==='none'||x.filter===''),'② 발동 중 PM-1 시트, 색 필터 없음 ('+JSON.stringify(s.map(x=>x.filter))+')');
 ok(!d.some(x=>/lauren-red/.test(x.path)),'② 라우렌 시트(lauren-red) 안 씀');}
// ③ 자아 월식 프레임
{const w=world();w.api.qaCombo(true);w.api.qaForce('eclipse');const cs=[];for(let i=0;i<8;i++){w.step(.1);const d=w.paint().filter(x=>x.path===ECL);if(d.length)cs.push(cell(d[0]));}
 ok(cs.length>=7&&cs.every(c=>c>=0&&c<=11)&&cs.every((c,i)=>i===0||c>=cs[i-1])&&cs.at(-1)>=8,'③ 충전 예고는 0~11칸이 차례로 '+JSON.stringify(cs));
 w.step(.2);const ls=[];for(let i=0;i<6;i++){w.step(.08);const d=w.paint().filter(x=>x.path===ECL);if(d.length)ls.push(cell(d[0]));}
 ok(ls.length>=4&&ls.every(c=>c>=12&&c<=23),'③ 발동 관통탄은 12~23칸 '+JSON.stringify(ls));
 ok(!w.paint().some(x=>/lauren-(violet|fuse)/.test(x.path)),'③ 라우렌 시트(violet·fuse) 안 씀');}
// ④ 왼쪽으로
{const w=world();w.player.x=5;w.api.qaForce('crimson');w.step(.9);const d=w.paint().filter(x=>x.path===RED);ok(d.length&&d.every(x=>x.flip),'④ 왼쪽으로 날면 뒤집음');
 const w2=world();w2.api.qaForce('crimson');w2.step(.9);const d2=w2.paint().filter(x=>x.path===RED);ok(d2.length&&d2.every(x=>!x.flip),'④ 오른쪽으로 날면 그대로');}
// ⑤ 시트 안 읽힘
{const w=world({ready:false});w.api.qaForce('crimson');w.step(.9);const d=w.paint();ok(!d.some(x=>x.path===RED)&&d.some(x=>/lauren-red/.test(x.path)),'⑤ PM-1 이 안 읽혔으면 예전 임시 그림');}
// ⑥ 빌드
{const inp=fs.readFileSync(path.join(ROOT,'runtime-inputs.json'),'utf8');ok(inp.includes(RED)&&inp.includes(ECL),'⑥ runtime-inputs 에 두 시트');
 ok(fs.readFileSync(path.join(ROOT,'runtime-text/persona-gravity-r1096.js'),'utf8')===SRC,'⑥ runtime-text 사본 같음');}
console.log(fails?'R1107 mirror-sheets FAILED '+fails:'R1107 mirror-sheets PASSED');process.exit(fails?1:0);
