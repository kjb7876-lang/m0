// R1113 실패 먼저: 페르소나 보스(사몽 결전 '순수악의')를 쓰러뜨리면 9번째 영웅 '페르소나' 해금. 라우렌 기술 위 형상, 몸 그림만 페르소나(정지 4방향·각성형·걷기 3방향), 영웅 이펙트 언주색.
// 검사: ① 결전 전엔 잠김 ② room.persona.completed → 해금·저장 ③ 777 이면 보임 ④ 형상은 라우렌일 때만, 다른 영웅이면 꺼짐 ⑤ 형상일 때 영웅 몸 그림 → rc133 방향 그림(정면0·왼2·뒤4·오른6)
//       ⑥ 발이 몸 위치(project)에, 키가 영웅 키×배율 ⑦ 궁극기 동안 각성형 ⑧ 걸으면 걷기 시트(가로 → 옆, 오른쪽 뒤집기, 아래 → 정면, 위 → 뒷모습), 칸이 앞으로 넘어감
//       ⑨ 영웅 이펙트에 언주 색 돌리기, 적·몸·다른 것은 그대로 ⑩ 형상이 아니면 아무것도 안 바꿈 ⑪ 저장·불러오기 ⑫ 빌드 연결
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'../..'),FILE=path.join(ROOT,'client-source/persona-hero-r1113.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
if(!fs.existsSync(FILE)){ok(false,'persona-hero-r1113.js 가 있음');console.log('R1113 persona-hero FAILED '+fails);process.exit(1);}
const SRC=fs.readFileSync(FILE,'utf8');
function world(o={}){
 const store=o.store||{},images=[];let seen=null;const proto={render(frame){seen=frame.commands.map(c=>({...c,points:c.points&&c.points.map(p=>[...p]),style:c.style&&{...c.style}}));}};
 const document={createElement:t=>({tagName:t,width:0,height:0,getContext:()=>({drawImage(){},fillRect(){},createRadialGradient:()=>({addColorStop(){}})})}),baseURI:'http://x/m0/',getElementById:id=>id==='panel'&&o.secret?{classList:{contains:c=>c==='r1057secret'}}:null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},head:{appendChild(){}}};
 class Img{constructor(){images.push(this);}set src(v){this._src=v;}get src(){return this._src;}}
 const player={hero:'lauren',x:10,y:10,hp:100,direction:'front',attackAnim:0,skillAnim:0,ultimateAnim:0};
 const C={Math,Number,JSON,Object,Array,Map,Set,WeakMap,WeakSet,String,Error,URL,console,Date,time:0,player,room:{id:'cult04',persona:{phase:'fight'}},loading:false,storyScene:null,modal:false,started:true,
  zoom:1,actorHeight:()=>66,project:(x,y)=>({x:500+(x-y)*16,y:300+(x+y)*8}),toast:(m)=>{C.toasts.push(m);},toasts:[],
  setInterval:()=>0,setTimeout:()=>0,StoryPhase1:{ThreeRenderer:{prototype:proto}},document,Image:Img,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};
 C.hud={};C.setHudTextR63R2=(id,v)=>{C.hud[id]=String(v);};C.tick=function(){};C.serializeSave=()=>({player:{hero:player.hero}});C.restoreSave=async raw=>{player.hero=raw.player.hero;};
 if(o.cheat)C.__STORYWORLD_CHEAT777__={active:()=>true};
 C.window=C;vm.createContext(C);vm.runInContext(SRC,C);
 const load=()=>{for(const im of images)if(im._src&&!im._done&&im.onload){im._done=true;im.naturalWidth=/walk/.test(im._src)?4096:344;im.naturalHeight=/walk/.test(im._src)?512:400;im.onload();}};
 const body=()=>({kind:'image',key:'hero:2:0',order:5,owner:{id:'hero:2',kind:'hero'},sourcePath:'r409:outline:hero:u:http://x/m0/assets/r130/lauren/directions-lauren-front.webp:181,55,150,421:20',sourceRect:[0,0,192,463],style:{filter:'saturate(.5) contrast(1.08)'},points:[[480,240],[506,240],[506,301],[480,301]]});
 const fx=()=>({kind:'image',owner:{id:'r101:aura-back:hero',kind:'effect'},sourcePath:'r106fx:glow:164.98.255:226.232.242',sourceRect:[0,0,128,128],style:{filter:'none'},points:[[0,0],[9,0],[9,9],[0,9]]});
 const skillFx=()=>({kind:'image',owner:{id:'fx:77',kind:'effect',pxfSide:'hero'},sourcePath:'assets/r946/x.webp',sourceRect:[0,0,192,192],style:{},points:[[0,0],[9,0],[9,9],[0,9]]});
 const enemy=()=>({kind:'image',owner:{id:'enemy:3',kind:'enemy'},sourcePath:'assets/x/mob.png',sourceRect:[0,0,100,100],style:{filter:'none'},points:[[0,0],[50,0],[50,50],[0,50]]});
 const efx=()=>({kind:'image',owner:{id:'fx:9',kind:'effect',pxfSide:'enemy'},sourcePath:'assets/x/e.webp',sourceRect:[0,0,10,10],style:{},points:[[0,0],[9,0],[9,9],[0,9]]});
 const frame=(cmds=[body(),fx(),skillFx(),enemy(),efx()])=>{proto.render.call({}, {commands:cmds});return seen;};
 const step=(dt=1/30)=>{C.time+=dt;C.tick();};
 return {C,player,store,frame,load,step,body,api:()=>C.__STORYWORLD_PERSONA_HERO_R1113__};}
const bodyOf=out=>out.find(c=>c.owner?.kind==='hero');
const at=(c,u,v)=>{const P=c.points,W=c.sourceRect[2],H=c.sourceRect[3],a=u/W,b=v/H;const L=(p,q,k)=>[p[0]+(q[0]-p[0])*k,p[1]+(q[1]-p[1])*k];return L(L(P[0],P[1],a),L(P[3],P[2],a),b);};
// ①②
{const w=world();const a=w.api();ok(a&&a.unlocked()===false,'① 결전 전에는 잠김');w.step();ok(!a.unlocked(),'① 결전 중(fight)에도 잠김');
 w.C.room.persona.phase='complete';w.C.room.persona.completed=true;w.step();ok(a.unlocked()===true,'② 결전이 끝나면 해금');
 ok(/"on":true/.test(w.store['storyworld.r1113.personaHero']||''),'② 해금이 저장됨');ok(w.C.toasts.some(t=>/페르소나/.test(t)),'② 해금 알림');
 const w2=world({store:w.store});ok(w2.api().unlocked(),'② 다시 켜도 해금 유지');}
// ③
{const w=world({cheat:true});ok(w.api().unlocked(),'③ 777 시험 중이면 보임');}
// ④
{const w=world({cheat:true});const a=w.api();ok(a.setForm(true)===true&&a.formActive(),'④ 라우렌이면 형상 켜짐');w.player.hero='hwando';w.step();ok(!a.formActive()&&w.player.personaHeroR1113===false,'④ 다른 영웅으로 바꾸면 꺼짐');
 const w2=world();ok(w2.api().setForm(true)===false,'④ 잠겨 있으면 못 켬');}
// ⑤⑥⑦
{const w=world({cheat:true});const a=w.api();a.setForm(true);w.frame();w.load();
 for(const [d,i] of [['front',0],['left',2],['back',4],['right',6]]){w.player.direction=d;w.step();const b=bodyOf(w.frame());ok(b&&new RegExp('rc133/art/base-'+i+'\\.png').test(b.sourcePath),'⑤ '+d+' → base-'+i+' ('+(b&&b.sourcePath)+')');}
 w.player.direction='front';w.step();const b=bodyOf(w.frame()),A=a.art;const foot=at(b,A.ax,A.ground),g=w.C.project(10,10),top=at(b,A.ax,A.ground-A.height);
 ok(Math.hypot(foot[0]-g.x,foot[1]-g.y)<.5,'⑥ 발이 몸 위치에('+foot.map(v=>v.toFixed(1))+' vs '+g.x+','+g.y+')');ok(Math.abs((foot[1]-top[1])-66*a.scale)<.5,'⑥ 키 = 영웅 키×'+a.scale+' ('+(foot[1]-top[1]).toFixed(1)+')');
 w.player.ultimateAnim=.5;w.step();const u=bodyOf(w.frame());ok(u&&/rc133\/art\/awake-0\.png/.test(u.sourcePath),'⑦ 궁극기 동안 각성형('+(u&&u.sourcePath)+')');}
// ⑧
{const run=(sx,sy)=>{const w=world({cheat:true});w.api().setForm(true);w.frame();w.load();const fs=[],sh=[];
  for(let i=0;i<60;i++){w.player.x+=2.4/30*(sx+sy)/2*Math.SQRT2;w.player.y+=2.4/30*(sy-sx)/2*Math.SQRT2;w.step();const b=bodyOf(w.frame());const m=/persona-walk-(\w+)\.webp:(\d)/.exec(b.sourcePath||'');if(m){fs.push(+m[2]);sh.push(m[1]+(b.points[1][0]<b.points[0][0]?':flip':''));}}
  let fw=0,bw=0;for(let i=1;i<fs.length;i++){const d=(fs[i]-fs[i-1]+8)%8;if(d>0&&d<4)fw++;else if(d>4)bw++;}return {sh:[...new Set(sh)],n:fs.length,fw,bw,distinct:new Set(fs).size};};
 const L=run(-1,0),R=run(1,0),D=run(0,1),U=run(0,-1);
 ok(L.sh.join()==='side'&&L.n>40,'⑧ 왼쪽 → 옆 시트('+L.sh+', '+L.n+'칸)');ok(R.sh.join()==='side:flip','⑧ 오른쪽 → 옆 뒤집기('+R.sh+')');ok(D.sh.join()==='front','⑧ 아래 → 정면('+D.sh+')');ok(U.sh.join()==='rear','⑧ 위 → 뒷모습('+U.sh+')');
 ok(L.distinct>=6&&L.fw>=8&&L.bw===0,'⑧ 칸이 앞으로 넘어감('+L.distinct+'칸, 앞 '+L.fw+'·뒤 '+L.bw+')');}
// ⑨⑩
{const w=world({cheat:true});const a=w.api();let out=w.frame();ok(out.every(c=>!/hue-rotate/.test(c.style?.filter||''))&&!/rc133/.test(bodyOf(out).sourcePath),'⑩ 형상이 아니면 아무것도 안 바꿈');
 a.setForm(true);out=w.frame();const T=a.tint;
 const aura=out.find(c=>c.owner.id==='r101:aura-back:hero'),sk=out.find(c=>c.owner.id==='fx:77'),en=out.find(c=>c.owner.id==='enemy:3'),ef=out.find(c=>c.owner.id==='fx:9');
 ok(aura.style.filter.includes(T)&&sk.style.filter.includes(T),'⑨ 영웅 이펙트(오라·스킬) 언주 색 돌리기');ok(en.style.filter==='none'&&!ef.style.filter,'⑨ 적·적 이펙트는 그대로');
 ok(!/hue-rotate/.test(bodyOf(out).style?.filter||''),'⑨ 몸 그림에는 색 돌리기 없음');}
// ⑬ 아래 HUD 이름: 형상이면 '페르소나 · Lv.N', 아니면 그대로
{const w=world({cheat:true});const a=w.api();w.C.setHudTextR63R2('heroName','라우렌 · Lv.9');ok(w.C.hud.heroName==='라우렌 · Lv.9','⑬ 형상 아니면 HUD 이름 그대로');
 a.setForm(true);w.C.setHudTextR63R2('heroName','라우렌 · Lv.9');ok(w.C.hud.heroName==='페르소나 · Lv.9','⑬ 형상이면 HUD 이름 페르소나('+w.C.hud.heroName+')');
 w.C.setHudTextR63R2('hpText','라우렌');ok(w.C.hud.hpText==='라우렌','⑬ 다른 HUD 칸은 그대로');}
// ⑭ 라우렌 창끝 빛(r425:spear-tip)은 페르소나에 창이 없으니 형상일 때 뺌, 접지 그림자(contact)는 색 그대로
{const w=world({cheat:true});const a=w.api();const tip=()=>({kind:'image',owner:{id:'r425:spear-tip',kind:'effect'},sourcePath:'r106fx:glow:120.50.200:214.170.255',sourceRect:[0,0,9,9],style:{},points:[[0,0],[9,0],[9,9],[0,9]]});
 const con=()=>({kind:'image',owner:{id:'hero:2',kind:'contact'},sourcePath:'',sourceRect:[0,0,9,9],style:{},points:[[0,0],[9,0],[9,9],[0,9]]});
 let out=w.frame([w.body(),tip(),con()]);ok(out.some(c=>c.owner.id==='r425:spear-tip'),'⑭ 형상 아니면 창끝 빛 그대로');
 a.setForm(true);out=w.frame([w.body(),tip(),con()]);ok(!out.some(c=>c.owner.id==='r425:spear-tip'),'⑭ 형상이면 창끝 빛 뺌');
 const cc=out.find(c=>c.owner.kind==='contact');ok(cc&&!/hue-rotate/.test(cc.style?.filter||''),'⑭ 접지 그림자는 색 돌리기 없음');}
// ⑮ 꼬리표 없는 영웅 스킬 이펙트(R102 영웅 이펙트 id, 라우렌 보라색 r106fx)도 언주색, 다른 색 이펙트는 그대로
{const w=world({cheat:true});const a=w.api();a.setForm(true);const mk=(id,src)=>({kind:'image',owner:{id,kind:'effect'},sourcePath:src,sourceRect:[0,0,9,9],style:{},points:[[0,0],[9,0],[9,9],[0,9]]});
 const out=w.frame([w.body(),mk('r102:1','assets/r100/sig-gather-violet.webp'),mk('r106d2s:1','r106fx:cross:164.98.255:226.232.242'),mk('r106d2s:2','r106fx:cross:90.200.120:226.232.242')]);
 const f=id=>out.find(c=>c.owner.id===id).style?.filter||'';ok(f('r102:1').includes(a.tint),'⑮ R102 영웅 이펙트 언주색');ok(f('r106d2s:1').includes(a.tint),'⑮ 라우렌 보라 r106fx 언주색');ok(!/hue-rotate/.test(f('r106d2s:2')),'⑮ 다른 색 이펙트는 그대로');}
// ⑯ 공격·스킬(사용자 11-16): 새 시트 대신 걷기 칸 + 빨간 구슬 빛(뒤 오라는 몸 뒤) — 방향별 시트, 구슬 자리, 칸 흐름, 끝나면 원래대로
{const w=world({cheat:true});const a=w.api();a.setForm(true);w.frame();w.load();w.frame();w.load();
 const idx=(out,id)=>out.findIndex(c=>c.owner?.id===id);
 for(const [d,k,fl] of [['front','front',false],['left','side',false],['right','side',true],['back','rear',false]]){w.player.direction=d;w.player.attackAnim=.3;w.step();const out=w.frame(),b=bodyOf(out);
  const m=new RegExp('persona-walk-'+k+'\\.webp').test(b?.sourcePath||'');ok(m&&((b.points[1][0]<b.points[0][0])===fl),'⑯ 공격 '+d+' → 걷기 '+k+(fl?' 뒤집기':'')+' ('+(b&&b.sourcePath)+')');
  const bi=out.indexOf(b),oi=idx(out,'r1113:orb'),ai=idx(out,'r1113:aura');ok(oi>bi&&ai>=0&&ai<bi,'⑯ '+d+' 구슬 빛은 몸 앞, 오라는 몸 뒤('+ai+'<'+bi+'<'+oi+')');
  const o=out[oi],au=out[ai];ok(o&&au&&o.key!==b.key&&au.key!==b.key&&o.key!==au.key&&o.order>b.order&&au.order<b.order,'⑯ '+d+' 빛 명령은 몸과 다른 key·앞뒤 order(같은 key 면 렌더러가 몸 메시를 빼앗아 몸이 사라짐)');
  ok(o&&o.style.globalCompositeOperation==='lighter'&&o.style.globalAlpha>0&&o.style.globalAlpha<=1,'⑯ '+d+' 구슬 빛 더하기 섞기');
  if(o&&k!=='rear'){const f=+/:(\d)$/.exec(b.sourcePath)[1],O=a.orb[k][f],want=at(b,O[0],O[1]),c=[(o.points[0][0]+o.points[2][0])/2,(o.points[0][1]+o.points[2][1])/2];ok(Math.hypot(c[0]-want[0],c[1]-want[1])<1,'⑯ '+d+' 구슬 빛이 손의 구슬 자리에('+c.map(v=>v.toFixed(1))+' vs '+want.map(v=>v.toFixed(1))+')');}}
 w.player.direction='front';const seen=new Set();for(let i=0;i<30;i++){w.player.attackAnim=.3;w.step();const b=bodyOf(w.frame());seen.add(b.sourcePath);}ok(seen.size>=5,'⑯ 공격 동안 칸이 흐름('+seen.size+'칸)');
 w.player.attackAnim=0;w.step();let out=w.frame();ok(/rc133\/art\/base-0/.test(bodyOf(out).sourcePath)&&idx(out,'r1113:orb')<0&&idx(out,'r1113:aura')<0,'⑯ 공격이 끝나면 정지 그림, 빛 없음');
 w.player.skillAnim=.4;w.step();out=w.frame();ok(/persona-walk-front/.test(bodyOf(out).sourcePath)&&idx(out,'r1113:orb')>=0,'⑯ 스킬도 걷기 칸 + 구슬 빛');w.player.skillAnim=0;
 w.player.ultimateAnim=.5;w.step();out=w.frame();ok(/awake-0/.test(bodyOf(out).sourcePath)&&idx(out,'r1113:aura')>=0,'⑯ 궁극기는 각성형 + 오라');w.player.ultimateAnim=0;
 a.setForm(false);w.player.attackAnim=.3;w.step();out=w.frame();ok(idx(out,'r1113:orb')<0,'⑯ 형상이 아니면 빛 없음');}
// ⑰ 영웅창 777(R1057 비밀 입력, 모바일 제목 7연타)이 발동하면 페르소나도 해금(사용자 11-16 12:08Z: EGO 까지 10명)
{const w=world();const a=w.api();w.step();ok(!a.unlocked(),'⑰ 777 전에는 잠김');
 const w2=world({secret:true});w2.step();ok(w2.api().unlocked()&&/"on":true/.test(w2.store['storyworld.r1113.personaHero']||'')&&w2.api().inspect().stats.unlockReason==='secret-777','⑰ 영웅창 777 발동하면 해금·저장('+w2.api().inspect().stats.unlockReason+')');}
// ⑪
{const w=world({cheat:true});const a=w.api();a.setForm(true);const d=w.C.serializeSave();ok(d.player.personaHeroR1113===true,'⑪ 저장에 형상 기록');
 w.player.personaHeroR1113=false;(async()=>{await w.C.restoreSave(d);ok(w.player.personaHeroR1113===true,'⑪ 불러오면 형상 복원');
 // ⑫
 const html=fs.readFileSync(path.join(ROOT,'runtime-text/index.html'),'utf8');ok(html.includes('<script src="./persona-hero-r1113.js"></script>'),'⑫ index.html 스크립트 태그');
 ok(fs.existsSync(path.join(ROOT,'runtime-text/persona-hero-r1113.js'))&&fs.readFileSync(path.join(ROOT,'runtime-text/persona-hero-r1113.js'),'utf8')===SRC,'⑫ runtime-text 사본 같음');
 ok(fs.readFileSync(path.join(ROOT,'runtime-inputs.json'),'utf8').includes('"persona-hero-r1113.js"'),'⑫ runtime-inputs 등록');
 ok(fs.readFileSync(path.join(ROOT,'..','scripts/verify-r96-public.py'),'utf8').includes("'persona-hero-r1113.js'"),'⑫ 공개 확인 목록');
 console.log(fails?'R1113 persona-hero FAILED '+fails:'R1113 persona-hero PASSED');process.exit(fails?1:0);})();}
