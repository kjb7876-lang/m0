// R425 CPU check: 전투 연출 — 몹 크기 띠·타격 눌림·창끝 기운·거미 X자·발 딛기·헌터 7프레임·정방향 십자가·기억사수 120°·슬레이어 자세/새 R/Q·
//  환도 공격 좌·우만·광폭화 보스 체력바 머리 위·적 공격 예고 표시 기본 꺼짐. 가짜 전역(기록기 흉내)으로 돌린다 — GPU·실기기·자연 플레이 아님.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=path.join(R,'runtime-text');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const FILES=['slayer-blood-r425.js','combat-flow-r425.js','fx-sprites-r106.js','attack-anim-r143.js','slayer-r351.js','slayer-r-tornado-r366.js','hwando-r277.js'];
ok('runtime copies match client-source',FILES.every(f=>fs.readFileSync(path.join(RT,f),'utf8')===C(f)),FILES.filter(f=>fs.readFileSync(path.join(RT,f),'utf8')!==C(f)));
const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');
ok('script tags once, right after combat-read-r409 and before combat-r118',/<script src="\.\/combat-read-r409\.js"><\/script><script src="\.\/slayer-blood-r425\.js"><\/script><script src="\.\/combat-flow-r425\.js"><\/script>(?:<script src="\.\/neon-lauren-r437\.js"><\/script>)?(?:<script src="\.\/perf-r441\.js"><\/script>)?(?:<script src="\.\/skill-attack-r440\.js"><\/script>)?(?:<script src="\.\/enemy-skill-pose-r442\.js"><\/script>)?(?:<script src="\.\/depth-overlap-r448\.js"><\/script>)?(?:<script src="\.\/cinema-run-r461\.js"><\/script>)?(?:<script src="\.\/mob-death-r462\.js"><\/script>)?(?:<script src="\.\/sin-boss-art-r463-data\.js"><\/script><script src="\.\/sin-boss-art-r463\.js"><\/script>)?(<script src="\.\/samong-rooms-r511\.js"><\/script>)?(?:<script src="\.\/weather-r450\.js"><\/script><script src="\.\/local-light-r451\.js"><\/script><script src="\.\/ground-fringe-r452\.js"><\/script><script src="\.\/actor-tone-r453\.js"><\/script>(?:<script src="\.\/hwando-chain-r590\.js"><\/script>)?(?:<script src="\.\/[a-z-]+-r56[1-4]\.js"><\/script>)*(?:<script src="\.\/samong-theme-r572\.js"><\/script>)?(?:<script src="\.\/samong-surge-r571\.js"><\/script>)?(?:<script src="\.\/survival-r600\.js"><\/script>)?(?:<script src="\.\/slayer-sheets-r585\.js"><\/script>)?(?:<script src="\.\/slayer-berserk-r586\.js"><\/script>)?(?:<script src="\.\/enemy-attack-tempo-r601\.js"><\/script>)?)?\s*<script src="\.\/combat-r118\.js">/.test(html)&&html.split('"./combat-flow-r425.js"').length===2&&html.split('"./slayer-blood-r425.js"').length===2);
const ver=fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8');{let comp=true;try{require('child_process').execFileSync('python3',['-m','py_compile',path.join(R,'..','scripts','verify-r96-public.py')],{stdio:'pipe'});}catch(_){comp=false;}ok('listed inside the expected list of verify-r96-public.py, and it compiles',comp&&/'slayer-blood-r425\.js',/.test(ver)&&/'combat-flow-r425\.js',/.test(ver));}
ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r425/r425-cpu-check.cjs'));
const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')),M=new Map(man.files.map(f=>[f.path,f.sha256]));const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(RT,p))).digest('hex');
const ASSETS=['assets/r425/hunter/attack-l.webp','assets/r425/hunter/attack-r.webp','assets/r425/hunter/index.json'];
ok('runtime-manifest hashes match (scripts + hunter sheets)',[...FILES,...ASSETS].every(f=>M.get(f)===sha(f)),[...FILES,...ASSETS].filter(f=>M.get(f)!==sha(f)));
const HI=JSON.parse(fs.readFileSync(path.join(RT,'assets/r425/hunter/index.json'),'utf8'));
ok('hunter 7-frame sheets: left/right, release frame 5, 7 timings, no Drive ids',HI.anims?.l?.file==='attack-l.webp'&&HI.anims?.r?.file==='attack-r.webp'&&HI.release===4&&Array.isArray(HI.ms)&&HI.ms.length===7&&!/drive\.google|(?<![A-Za-z0-9_-])(?=[A-Za-z0-9_-]*[A-Z])[A-Za-z0-9_-]{25,44}(?![A-Za-z0-9_-])/.test(JSON.stringify(HI)));

// ---- 정방향 십자가(사용자 09:47 상시 규칙): 십자가 그림은 평면 회전하지 않고 세로축(가로 폭)으로만 돈다 ----
const fxs=C('fx-sprites-r106.js');
ok('fx-sprites: cross/runecross never plane-rotated — Y-axis spin (x scale only), others rotate',/const UPRIGHT=new Set\(\['cross','runecross'\]\)/.test(fxs)&&/if\(o\.angle\)\{if\(UPRIGHT\.has\(name\)\)\{[^}]*ctx\.scale\(\(k<0\?-1:1\)\*Math\.max\(\.18,Math\.abs\(k\)\),1\);[^}]*\}else ctx\.rotate\(o\.angle\);\}/.test(fxs));
const sb=C('slayer-blood-r425.js');
ok('slayer R crosses drawn upright (angle 0), no flipY / vertical negative scale',(sb.match(/'cross'/g)||[]).length>=1&&!/scale\([^)]*,\s*-/.test(sb)&&/angle:0/.test(sb));
// ---- 기억사수 120° · 슬레이어 자세 ----
ok('gunner: left/right attack art each covers ±60° (|angle|≤60 → e, ≥120 → w)',/d<=60\?'e':d>=120\?'w':ang<0\?'n':'s'/.test(C('attack-anim-r143.js')));
const sl=C('slayer-r351.js');
ok('slayer: right art mirrored for left attack, old left only as auxiliary pose, idle mirrored, down idle = natural walk-S frame',/const MIRROR_E=true,auxClip=\(\)=>rawClip\('attack','w'\)/.test(sl)&&/a==='attack'&&d==='w'&&MIRROR_E/.test(sl)&&/IDLE_S_FRAME=2/.test(sl)&&/rawClip\('walk','e'\)/.test(sl));
ok('slayer ultimate spin = left/right flip, not a paper squeeze',/k=\(cs<0\?-1:1\)/.test(C('slayer-r-tornado-r366.js')));
ok('slayer new R: native R damage blocked, 1 big + 4 small crosses, blood burst, 7 s aura with chase and chained splashes',/sourceSlot==='r'/.test(sb)&&/storySourceSkill/.test(sb)&&/function startR/.test(sb)&&/function chase/.test(sb)&&/function chainBurst/.test(sb)&&/'blood-death'/.test(sb));
ok('slayer Q = old hurricane as a piercing blood whirlwind with bleed, native cooldown formula kept',/function castQ/.test(sb)&&/specialCD=10\*\(1-\.05\*rk\)/.test(sb)&&/bleedTick\(/.test(sb));
// ---- 환도: 공격은 늘 좌·우(사용자 10:20) ----
{const W={};new Function('window','localStorage',C('hwando-r277.js'))(W,{getItem:()=>null,setItem(){}});const P=W.__STORYWORLD_HWANDO_R277__;
 const out=[P.attackDir('n',0),P.attackDir('n',-9),P.attackDir('n',9),P.attackDir('s',-9),P.attackDir('s',0),P.attackDir('w',0),P.attackDir('e',0)];
 ok('hwando attack dirs only left/right — up/down use the enemy side (else last side)',out.join()==='e,w,e,w,w,w,e',out);}

// ---- combat-flow-r425: 가짜 기록기로 drawEnemy 를 돌린다 ----
class Rec{constructor(){this.commands=[];this.m=[1,0,0,1,0,0];this.st=[];this.owner={id:'scene',kind:'scene'};}
 save(){this.st.push(this.m.slice());}restore(){this.m=this.st.pop();}
 translate(x,y){const m=this.m;m[4]+=m[0]*x+m[2]*y;m[5]+=m[1]*x+m[3]*y;}scale(x,y){const m=this.m;m[0]*=x;m[1]*=x;m[2]*=y;m[3]*=y;}
 pt(x,y){const m=this.m;return [m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];}scope(o,fn){const p=this.owner;this.owner=o;try{return fn();}finally{this.owner=p;}}}
const IMG={naturalWidth:200,naturalHeight:300};
// 칸 48×48 훑기: 10~40 줄이 불투명 → 시트 대표 키 31/48, 머리 윗선 10/48
const fakeCanvas=()=>({width:48,height:48,getContext:()=>({clearRect(){},drawImage(){},getImageData(){const d=new Uint8ClampedArray(48*48*4);for(let y=10;y<=40;y++)for(let x=0;x<48;x++)d[(y*48+x)*4+3]=255;return{data:d};}})});
const FR=31/48,TOP=10/48;
function makeEnv(store={},table=null,pre=null){const env={fetch:table?(()=>Promise.resolve({ok:true,json:()=>({classes:table})})):undefined,console,Math,JSON,Number,String,Array,Object,Set,Map,WeakMap,WeakSet,Promise,Error,Uint8ClampedArray,isFinite,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},document:{createElement:()=>fakeCanvas(),getElementById:()=>null},requestAnimationFrame:()=>0,
 time:1,ctx:new Rec(),room:{id:'test-room',enemies:[]},player:{x:0,y:0,hero:'lauren',hp:10,attackAnim:0},VFX:{mark:'assets/vfx/generated/v300/target-mark.webp'},settings:{}};
 env.window=env;env.actorHeight=()=>54;env.project=(x,y)=>({x:640+x*32,y:360+y*16});env.moveActor=(a,dx,dy)=>{a.x+=dx;a.y+=dy;};
 env.baseCalls={effects:0};
 env.drawEnemy=function(e){const R=env.ctx,q=env.project(e.x,e.y),H=54*(e.k||1.4),bh=H/FR,bw=bh*2/3;
  R.scope({id:'enemy:'+e.id,kind:'enemy'},()=>{const xl=e.mir?q.x+bw/2:q.x-bw/2,xr=e.mir?q.x-bw/2:q.x+bw/2;R.commands.push({kind:'image',owner:{...R.owner},image:IMG,sourceRect:[0,0,200,300],sourcePath:e.art||'assets/mobs/test-mob.webp',points:[R.pt(xl,q.y-bh*.95),R.pt(xr,q.y-bh*.95),R.pt(xr,q.y+bh*.05),R.pt(xl,q.y+bh*.05)]});
   const W=55,y=q.y+6;for(const col of ['#302926','#795a50'])R.commands.push({kind:'fill',owner:{...R.owner},style:{fillStyle:col},paths:[{points:[R.pt(q.x-W/2,y),R.pt(q.x+W/2,y),R.pt(q.x+W/2,y+2),R.pt(q.x-W/2,y+2)]}]});
   R.commands.push({kind:'text',owner:{...R.owner},text:e.name,point:R.pt(q.x,q.y-H-8),matrix:R.m.slice(),style:{}});
   if(e.tell)R.commands.push({kind:'image',owner:{...R.owner},image:IMG,sourcePath:'assets/vfx/generated/v300/target-mark.webp',points:[R.pt(q.x-9,q.y-40),R.pt(q.x+9,q.y-40),R.pt(q.x+9,q.y-22),R.pt(q.x-9,q.y-22)]});});
  if(e.tele){const to=env.project(env.player.x,env.player.y);R.commands.push({kind:'stroke',owner:{...R.owner},style:{strokeStyle:'rgba(12,10,12,.92)'},paths:[{points:[R.pt(q.x,q.y),R.pt(to.x,to.y)]}]});
   R.commands.push({kind:'fill',owner:{...R.owner},style:{fillStyle:'rgba(14,13,15,.92)'},paths:[{points:[R.pt(q.x-30,q.y-H-20),R.pt(q.x+30,q.y-H-20),R.pt(q.x+30,q.y-H-3),R.pt(q.x-30,q.y-H-3)]}]});
   R.commands.push({kind:'text',owner:{...R.owner},text:'원거리 조준',point:R.pt(q.x,q.y-H-11),matrix:R.m.slice(),style:{}});}};
 env.hitEnemy=(e,a)=>{e.hp-=a;};env.tick=()=>{if(typeof env.__engine==='function')env.__engine();};env.drawHero=()=>{};env.drawEffect=()=>{env.baseCalls.effects++;};
 if(pre)pre(env);vm.createContext(env);vm.runInContext(C('combat-flow-r425.js'),env);return env;}
const frame=(env,e)=>{env.ctx.commands.length=0;env.time+=.1;env.drawEnemy(e);return env.ctx.commands;};
const bbox=c=>{const P=c.points||c.paths[0].points;const xs=P.map(p=>p[0]),ys=P.map(p=>p[1]);return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];};
const near=(a,b,t=.6)=>Math.abs(a-b)<=t;
{const env=makeEnv(),F=env.__STORYWORLD_COMBAT_FLOW_R425__;
 ok('combat-flow loads; telegraphs default OFF, boss bar on, settings API exposed',F&&F.inspect().prefs.tele===false&&F.inspect().prefs.bossBar===true&&typeof F.teleSet==='function'&&F.revision==='R425-flow-8');
 // 큰 일반 몹(원래 키 영웅 2.5배) → 일반 띠 상한 1.55 로
 const e={id:'m1',name:'시험 몹',x:0,y:-1,hp:10,maxHp:10,k:2.5};let cs;for(let i=0;i<4;i++)cs=frame(env,e);
 const body=cs.find(c=>c.kind==='image'),opaque=(bbox(body)[3]-bbox(body)[1])*FR,bars=cs.filter(c=>c.kind==='fill'),q=env.project(e.x,e.y),txt=cs.find(c=>c.kind==='text');
 ok('size band: oversized normal mob drawn at 1.55× hero height',near(opaque,1.55*54,1),opaque);
 /* R596(사용자 2026-11-10 "아래 이런 예고선이 아직도 나오는 문제"): 일반 몹 발밑 체력 선이 바닥 예고선으로 읽혀 머리 위로 옮김 → 이 항목의 기대(발밑)가 바뀜. 발밑 배치는 mobBar 끄기에서 아래 항목으로 계속 검사 */
 ok('HP bar keeps native width and sits over the head (R596) when the body is rescaled',bars.length===2&&bars.every(b=>{const bb=bbox(b);return near(bb[2]-bb[0],55)&&bb[3]<bbox(body)[1]+(bbox(body)[3]-bbox(body)[1])*.25;}),bars.map(bbox));
 {const env2=makeEnv({'storyworld.r425.flow':'{"mobBar":false}'});let c2;const e2={id:'m1b',name:'시험 몹',x:0,y:-1,hp:10,maxHp:10,k:2.5};for(let i=0;i<4;i++)c2=frame(env2,e2);const q2=env2.project(e2.x,e2.y),b2=c2.filter(c=>c.kind==='fill');
  ok('mobBar off: HP bar keeps native width and place under the feet when the body is rescaled (old behaviour)',b2.length===2&&b2.every(b=>{const bb=bbox(b);return near(bb[2]-bb[0],55)&&near(bb[1],q2.y+6);}),b2.map(bbox));}
 ok('name label keeps its font size (matrix scale 1) while following the scaled head',txt&&near(txt.matrix[0],1,.01)&&near(txt.matrix[3],1,.01),txt?.matrix);
 // 예고 표시 기본 꺼짐
 const t={id:'m2',name:'원거리 몹',x:3,y:0,hp:10,maxHp:10,k:2.5,tele:true,tell:1};for(let i=0;i<3;i++)cs=frame(env,t);
 ok('telegraphs OFF by default: aim lane, label box, label text and tell mark removed; body and bar stay',!cs.some(c=>c.kind==='stroke'||c.style?.fillStyle==='rgba(14,13,15,.92)'||c.text==='원거리 조준'||/target-mark/.test(c.sourcePath||''))&&cs.some(c=>c.kind==='image')&&cs.filter(c=>c.kind==='fill').length===2);
 F.teleSet(true);cs=frame(env,t);const lane=cs.find(c=>c.kind==='stroke'),to=env.project(0,0);
 ok('telegraphs ON: shown, and the aim lane still ends on the real target (rescale undone)',lane&&near(lane.paths[0].points[1][0],to.x)&&near(lane.paths[0].points[1][1],to.y)&&cs.some(c=>c.text==='원거리 조준'),lane?.paths?.[0]?.points);
 F.teleSet(false);let eff=env.baseCalls.effects;env.drawEffect({type:'sigil',asset:env.VFX.mark,size:1.15});const skipped=env.baseCalls.effects===eff;env.drawEffect({type:'sigil',asset:'assets/other.webp'});env.drawEffect({type:'sigil',asset:env.VFX.mark,size:.62});env.drawEffect({type:'sigil',asset:env.VFX.mark,size:1});
 ok('R116 charge target sigil (VFX.mark, size 1.15) hidden when OFF; other sigils and the click-move/select markers (size .62/1) still drawn',skipped&&env.baseCalls.effects===eff+3);}
{const env=makeEnv();env.__STORYWORLD_BOSS_R205__={inspect:()=>({prefs:{enrage:true}}),constants:{ENRAGE_SIZE:2}};
 const b={id:'b1',name:'시험 보스',boss:true,x:0,y:0,hp:100,maxHp:100,k:2.1};let cs;for(let i=0;i<4;i++)cs=frame(env,b);const q=env.project(0,0);
 const bar0=cs.filter(c=>c.kind==='fill').map(bbox);ok('boss before enrage: bar under the feet',bar0.length===2&&bar0.every(bb=>near(bb[1],q.y+6)),bar0);
 b.r205Enraged={at:1};b.hp=25;b.k=4.2;for(let i=0;i<12;i++)cs=frame(env,b);
 const body=cs.find(c=>c.kind==='image'),bb=bbox(body),opaque=(bb[3]-bb[1])*FR,head=bb[1]+(bb[3]-bb[1])*TOP,bars=cs.filter(c=>c.kind==='fill').map(bbox),txt=cs.find(c=>c.text==='시험 보스');
 ok('enraged boss keeps the R205 2× size (boss band × 2, not shrunk back)',opaque>=1.9*2*54-2&&opaque<=2.3*2*54+2,opaque/54);
 ok('enraged boss: HP bar moves above the head (8 px over the sheet head line), not in the middle of the body',bars.length===2&&bars.every(x=>x[3]<=head-7&&x[3]>=head-12),{head,bars});
 ok('enraged boss: name label sits right above the bar',txt&&near(txt.point[1],bars[0][1]-5,1),{name:txt?.point,bar:bars[0]});}
// ---- ④ 시선 3부류: 엔진 걸음 흉내(벽 없음)로 걸음 방향을 본다 ----
async function gazeChecks(){
 // 가짜 R53(R230 이 이미 감싼 꼴): 근접 준비 때 R230 처럼 2.4초 간격 안이면 건너뛰고, 아니면 가로 옆자리 블링크를 셈
 const r230={flanks:0,skipped:0};
 const env=makeEnv({},{'mobs/x-mob.webp':'x','mobs/p-mob.webp':'plus','mobs/M030-move.png':'plus','mobs/M031-idle.png':'x'},en=>{en.__STORYWORLD_MOB_FLANK_R230__={flank:()=>{r230.flanks++;return true;}};
  en.__STORYWORLD_HOSPITAL_MOTION_R53__=Object.freeze({__r230:true,canPrepare(e,kind){if(kind==='melee'&&!e.attack){if(e.r230At!=null&&en.time-e.r230At<2.4)r230.skipped++;else r230.flanks++;}return true;}});
  en.blocked=()=>false;en.clearLine=()=>true;en.facing=()=>'right';}),F=env.__STORYWORLD_COMBAT_FLOW_R425__;
 const mk=(id,art,name)=>({id,name:name||'시험 몹',art,x:0,y:0,hp:10,maxHp:10,k:1.4,spawnState:'active'});
 const ex=mk('gx','assets/mobs/x-mob.webp'),ep=mk('gp','assets/mobs/p-mob.webp'),eb=mk('gb','assets/mobs/b-mob.webp'),sp=mk('gs','assets/mobs/b-mob.webp','동굴 거미');
 env.room.enemies=[ex,ep,eb,sp];env.player.x=-60;env.player.y=60;
 for(const e of env.room.enemies)frame(env,e);env.tick(1/60);for(let i=0;i<3;i++)await new Promise(r=>setImmediate(r));
 ok('gaze table loads; class from the drawn body art (x / plus / unknown → both, spiders → x)',F.gazeOf(ex)==='x'&&F.gazeOf(ep)==='plus'&&F.gazeOf(eb)==='both'&&F.gazeOf(sp)==='x',[F.gazeOf(ex),F.gazeOf(ep),F.gazeOf(eb),F.gazeOf(sp),F.artOf(ex)]);
 const ef1=mk('gfa','assets/mobs/M030-attack.png'),ef2=mk('gfb','assets/mobs/M031-move.png');frame(env,ef1);frame(env,ef2);const st0=F.gazeOf(ex);ex.art='assets/mobs/unknown-pose.webp';frame(env,ex);
 ok('unknown pose sheet → same mob family class (M030-attack → plus from -move, M031-move → x from -idle); unknown art keeps the class last seen',F.gazeOf(ef1)==='plus'&&F.gazeOf(ef2)==='x'&&st0==='x'&&F.gazeOf(ex)==='x',[F.gazeOf(ef1),F.gazeOf(ef2),F.gazeOf(ex)]);ex.art='assets/mobs/x-mob.webp';frame(env,ex);
 ok('allowed directions in tile angles: x = tile edges (screen 2:1 diagonals ≈27°), plus = screen horizontal/vertical',F.ALLOW.x.map(a=>Math.round(F.screenAngle(Math.cos(a*Math.PI/180),Math.sin(a*Math.PI/180)))).join()==='27,153,207,333'&&F.ALLOW.plus.map(a=>Math.round(F.screenAngle(Math.cos(a*Math.PI/180),Math.sin(a*Math.PI/180)))).join()==='90,180,270,0');
 const sAng=(dx,dy)=>{const sx=dx-dy,sy=(dx+dy)*.5;return ((Math.atan2(sy,sx)*180/Math.PI)%360+360)%360;};
 const wAng=(dx,dy)=>((Math.atan2(dy,dx)*180/Math.PI)%360+360)%360;
 const wdir=a=>{const vx=Math.cos(a*Math.PI/180),vy=Math.sin(a*Math.PI/180),X=vy+vx/2,Y=vy-vx/2,m=Math.hypot(X,Y);return [X/m,Y/m];};
 function walk(e,deg,secs,v=2){const [ux,uy]=wdir(deg),seen=new Set();let len=0,top=0;const x0=e.x,y0=e.y;env.room.enemies=[e];
  env.__engine=()=>{e.x+=ux*v/60;e.y+=uy*v/60;};for(let i=0;i<secs*60;i++){const px=e.x,py=e.y;env.time+=1/60;env.tick(1/60);const st=Math.hypot(e.x-px,e.y-py);seen.add(Math.round(sAng(e.x-px,e.y-py))%360);len+=st;top=Math.max(top,st*60/v);}
  env.__engine=null;const prog=((e.x-x0)*ux+(e.y-y0)*uy)/(v*secs);return {seen:[...seen].sort((a,b)=>a-b),len:+len.toFixed(3),top:+top.toFixed(3),prog:+prog.toFixed(3),net:+sAng(e.x-x0,e.y-y0).toFixed(1)};}
 const dA=(a,b)=>{const d=Math.abs(((a-b)%360+360)%360);return d>180?360-d:d;};
 let w=walk(ex,0,3);ok('x-class walking screen-right zig-zags on the two tile-edge diagonals (X), same arrival (progress ≥ 0.9), leg speed ≤ 1.35×, average heading kept',w.seen.join()==='27,333'&&w.prog>=.9&&w.top<=1.351&&dA(w.net,0)<10,w);
 w=walk(ex,90,2);ok('x-class walking screen-down zig-zags on the lower X legs',w.seen.join()==='27,153'&&w.prog>=.9&&dA(w.net,90)<10,w);
 {/* R441: 지그재그 다리마다 실제 화면 좌·우로 본다(거미가 왼쪽 아래를 보고 오른쪽 아래로 가던 문제) */const ff=env.facing;env.facing=(x,y)=>{const sx=x-y,sy=(x+y)*.5;return Math.abs(sx)>Math.abs(sy)*1.35?(sx>0?'right':'left'):sy>0?'front':'back';};
  const [ux,uy]=wdir(90);env.room.enemies=[ex];ex.direction='front';env.__engine=()=>{ex.x+=ux*2/60;ex.y+=uy*2/60;};let good=0,bad=0;
  for(let i=0;i<120;i++){const px=ex.x,py=ex.y;env.time+=1/60;env.tick(1/60);const sx=(ex.x-px)-(ex.y-py);if(Math.abs(sx)<1e-4)continue;if(ex.direction===(sx>0?'right':'left'))good++;else bad++;}
  env.__engine=null;env.facing=ff;ok('R441 x-class zig-zag legs face their own screen side (down-right leg → right, down-left leg → left)',good>20&&bad===0&&F.inspect().prefs.face===true,{good,bad});}
 w=walk(ep,45,3);ok('plus-class walking diagonally goes in horizontal/vertical legs (+), arrival kept, average heading kept',w.seen.join()==='0,90'&&w.prog>=.9&&dA(w.net,45)<10,w);
 w=walk(eb,20,3);ok('both-class: 8 directions — screen 20° walks as 0°/27° legs, average ≈ 20°',w.seen.join()==='0,27'&&w.prog>=.95&&dA(w.net,20)<8,w);
 w=walk(eb,97,1);ok('both-class within ~8° (tile angle) of an allowed direction snaps to it (no zig-zag, no speed change)',w.seen.join()==='90'&&Math.abs(w.len-2)<.02,w);
 w=walk(eb,93,1);ok('engine step already within 2° (tile angle) of an allowed direction is kept as is',w.seen.join()==='93'&&Math.abs(w.len-2)<.02,w);
 w=walk(sp,180,2);ok('spiders walk the X legs',w.seen.join()==='153,207',w);
 // 공격 자리: 화면 오른쪽(0°) 2.6칸에서 영웅에게 다가오는 x 몹 → X자 줄(칸 0°/270°) 위에서 멈춘다
 const ea=mk('ga','assets/mobs/x-mob.webp');frame(env,ea);env.player.x=0;env.player.y=0;const [rx,ry]=wdir(0);ea.x=rx*2.6;ea.y=ry*2.6;env.room.enemies=[ea];
 env.__engine=()=>{const dx=-ea.x,dy=-ea.y,d=Math.hypot(dx,dy);if(d>.85){ea.x+=dx/d*2/60;ea.y+=dy/d*2/60;}};let reach=null;for(let i=0;i<240;i++){env.time+=1/60;env.tick(1/60);if(reach==null&&Math.hypot(ea.x,ea.y)<=.86)reach=i/60;}env.__engine=null;
 const wb=wAng(ea.x,ea.y);ok('attack slot: an x-class mob approaching from the screen side ends on an X line from the hero (attack goes along X) within 2.6 s',(dA(wb,0)<12||dA(wb,270)<12)&&Math.hypot(ea.x,ea.y)<1.3&&reach!=null&&reach<2.6,{wb,screen:sAng(ea.x,ea.y),dist:Math.hypot(ea.x,ea.y),reach});
 // 공격 시작 자리: 영웅 바로 아래(화면 90° = 칸 45°)에서 근접 준비 → R230 가로 블링크 대신 X자 자리로, R230 은 건너뜀
 const M=env.__STORYWORLD_HOSPITAL_MOTION_R53__;const ef=mk('gf','assets/mobs/x-mob.webp');frame(env,ef);ef.x=Math.SQRT1_2;ef.y=Math.SQRT1_2;env.time+=5;
 const f0=r230.flanks;M.canPrepare(ef,'melee');const fb=wAng(ef.x,ef.y);
 ok('x-class melee start off the X lines → moved to the nearest X spot (R230 range), R230 sideways blink not used',M.__r425===true&&(dA(fb,0)<1||dA(fb,90)<1)&&Math.abs(Math.hypot(ef.x,ef.y)-1.05)<.01&&r230.flanks===f0&&F.inspect().stats.flankX===1,{fb,d:Math.hypot(ef.x,ef.y),r230,stats:F.inspect().stats.flankX});
 const pf=mk('gpf','assets/mobs/p-mob.webp');frame(env,pf);pf.x=Math.SQRT1_2;pf.y=Math.SQRT1_2;const f1=r230.flanks;M.canPrepare(pf,'melee');
 ok('plus-class melee start → R230 unchanged (sideways is a + direction)',r230.flanks===f1+1&&pf.x===Math.SQRT1_2,r230);
 const eg=mk('gg','assets/mobs/x-mob.webp');frame(env,eg);eg.x=1;eg.y=0;const x1=eg.x;M.canPrepare(eg,'melee');
 ok('x-class already on an X line → no move',eg.x===x1&&eg.y===0);
 // 벽: moveActor 가 막으면 엔진 걸음 그대로
 const eW=mk('gw','assets/mobs/x-mob.webp');frame(env,eW);env.player.x=-60;env.player.y=60;env.room.enemies=[eW];const mv=env.moveActor;env.moveActor=()=>{};
 const [ux,uy]=wdir(0);env.__engine=()=>{eW.x+=ux*2/60;eW.y+=uy*2/60;};const x0=eW.x;for(let i=0;i<30;i++){env.time+=1/60;env.tick(1/60);}env.__engine=null;env.moveActor=mv;
 ok('blocked X leg (moveActor cannot move) → keeps the engine step, never stuck',Math.abs(eW.x-x0-ux*1)<1e-6,eW.x-x0);
 ok('gaze stats counted, no errors',F.inspect().stats.gazeSteps>0&&F.inspect().stats.errors===0,F.inspect().stats);}
// ⑨ 이름: 실검무 · 츠바메가에시 → 실검무 · 바람베기(사용자 11:50)
{const env=makeEnv({},null,env=>{env.__STORYWORLD_PROGRESSION_R62__={defs:[{id:'threadClawR64',name:'실검무 · 발톱 세선'},{id:'threadTsubameR64',name:'실검무 · 츠바메가에시',text:'비용 1점'}]};env.openPanel=html=>{env.lastPanel=html;};});
 const D=env.__STORYWORLD_PROGRESSION_R62__.defs;ok('rename: threadTsubameR64 card name is now 실검무 · 바람베기 (siblings untouched)',D[1].name==='실검무 · 바람베기'&&D[0].name==='실검무 · 발톱 세선',D.map(d=>d.name));
 env.openPanel('<p class="small muted">반복 강화에 단계 제한은 없습니다. 실검무 모티프는 전투 연출이며, 추가 프랙털·츠바메가에시·일도양단 효과는 각 패시브 설명과 같습니다.</p>');
 ok('rename: passive panel note says 바람베기 and no 츠바메가에시 is left',/프랙털·바람베기·일도양단/.test(env.lastPanel)&&!/츠바메가에시/.test(env.lastPanel),env.lastPanel);
 ok('rename: engine source keeps the original text (overlay only)',/name:'실검무 · 츠바메가에시'/.test(fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8')));}
// ⑧ 사몽 레이저 십자가(사용자 11:49)
{const hits=[];const env=makeEnv({},null,env=>{env.effects=[];env.xs=[];env.attackPower=()=>100;env.floatText=()=>{};env.room.engaged=true;
  env.hitEnemy=(e,v,src)=>{hits.push({id:e.id,v,kind:src?.kind});const a=Math.min(e.hp,v);e.hp-=a;return true;};
  env.__STORYWORLD_HERO_FX_R102__={PALETTE:{lauren:{a:[150,90,220],b:[220,190,255]}}};
  env.__STORYWORLD_FX_SPRITES_R106__={on:()=>true,warm(){},pal:c=>({a:c,b:c}),draw:(nm,F,x,y,w,h,o)=>{env.xs.push({nm,F,x,y,w,h,o:o||{}});return true;},along(){return true;}};});
 const F=env.__STORYWORLD_COMBAT_FLOW_R425__,X=F.samongCross,sent=()=>env.effects.find(e=>e.r425Sentinel);
 const mob={id:'mob',name:'몹',x:2,y:1,hp:50,maxHp:50,spawnState:'active'},boss={id:'boss',name:'보스',x:5,y:2,hp:5000,maxHp:5000,boss:true,spawnState:'active'};env.room.enemies.push(mob,boss);
 const r1=env.hitEnemy(mob,5.5,{kind:'hero-samong-storm-r75',hero:'lauren'}),r2=env.hitEnemy(boss,5.5,{kind:'hero-samong-storm-r114',hero:'lauren'});
 ok('laser touch (R75 line / R114 extra line) is taken over: no instant hit, a cross is planted on the mob and on the boss',r1===true&&r2===true&&hits.length===0&&mob.hp===50&&boss.hp===5000&&X.live().length===2&&!!sent(),X.live());
 const r3=env.hitEnemy(mob,9999,{kind:'hero-samong-ultimate-r139'});ok('R139 pulse yields to a standing cross on a normal mob (the cross removes it)',r3===false&&mob.hp===50);
 env.time+=.1;env.tick();env.xs.length=0;env.drawEffect(sent());const cr=env.xs.filter(s=>s.nm==='cross');
 ok('cross drawn upright in the hero colour: no angle, no flip, positive size, Latin cross proportions (256×384)',cr.length===4&&cr.every(s=>!s.o.angle&&!s.o.flip&&s.w>0&&s.h>0&&Math.abs(s.w/s.h-256/384)<1e-6)&&cr.filter(s=>s.F.a[0]===150).length===2,cr.map(s=>[s.w,s.h,s.F.a]));
 ok('cross centred on the body: crossing point above the body centre (short top, long bottom)',cr.every(s=>{const e=[mob,boss].find(e=>Math.abs(env.project(e.x,e.y).x-s.x)<1e-6),q=e&&env.project(e.x,e.y);return !!q&&s.y<q.y;})&&new Set(cr.map(s=>s.x)).size===2,cr.map(s=>[s.x,s.y]));
 ok('base draw untouched for other effects',(()=>{const n=env.baseCalls.effects;env.drawEffect({type:'burst'});return env.baseCalls.effects===n+1;})());
 env.time+=.1;env.tick();
 ok('after the flash (0.18 s) the normal mob vanishes (lethal hit through the engine hitEnemy)',mob.hp<=0&&hits.find(h=>h.id==='mob')?.kind==='hero-samong-cross-r425'&&hits.find(h=>h.id==='mob').v>=50+50,hits);
 ok('boss is not removed: it takes attack × 0.55 through the engine hitEnemy',boss.hp===5000-55&&hits.filter(h=>h.id==='boss').length===1,boss.hp);
 env.xs.length=0;env.drawEffect(sent());ok('flash: crossing-point glint, not rotated',env.xs.some(s=>s.nm==='flare'&&!s.o.angle));
 env.hitEnemy(boss,5.5,{kind:'hero-samong-storm-r75',hero:'lauren'});ok('boss: one laser cross per 0.6 s',X.live().filter(c=>c.enemy==='boss').length===1&&boss.hp===5000-55);
 env.time+=.6;env.tick();env.hitEnemy(boss,5.5,{kind:'hero-samong-storm-r75',hero:'lauren'});env.time+=.2;env.tick();ok('boss: a later laser plants a new cross and deals the damage again',boss.hp===5000-110,boss.hp);
 const r4=env.hitEnemy(boss,10,{kind:'basic'});ok('other hits pass straight through',r4===true&&boss.hp===5000-120);
 env.time+=1;env.tick();ok('crosses cleared after their life, sentinel removed',X.live().length===0&&!sent());
 const late={id:'b2',name:'보스2',x:0,y:4,hp:900,maxHp:900,boss:true,spawnState:'active'};env.room.enemies.push(late);env.room.engaged=false;env.hitEnemy(late,5.5,{kind:'hero-samong-storm-r75',hero:'lauren'});env.time+=.3;env.tick();
 ok('boss not engaged yet: no cross, no damage (engine boss rule)',late.hp===900&&X.live().length===0);
 F.set('samongCross',false);const n0=hits.length;env.hitEnemy(boss,5.5,{kind:'hero-samong-storm-r75',hero:'lauren'});ok('samongCross off: laser calls go to the old path',hits.length===n0+1&&hits[n0].kind==='hero-samong-storm-r75');
 // 뭉친 몹: 거의 같은 자리 둘 → 십자가 하나 + 번짐 하나(가로대 둘처럼 보이지 않게)
 F.set('samongCross',true);env.room.engaged=true;const m1={id:'c1',name:'몹',x:8,y:8,hp:20,maxHp:20,spawnState:'active'},m2={id:'c2',name:'몹',x:8.02,y:7.7,hp:20,maxHp:20,spawnState:'active'};env.room.enemies.push(m1,m2);
 env.hitEnemy(m1,1,{kind:'hero-samong-storm-r75',hero:'lauren'});env.hitEnemy(m2,1,{kind:'hero-samong-storm-r75',hero:'lauren'});env.time+=.1;env.tick();env.xs.length=0;env.drawEffect(sent());
 ok('tight cluster: overlapping crosses merge into one cross (no double crossbar), the other mob gets a glow',env.xs.filter(s=>s.nm==='cross').length===2&&env.xs.filter(s=>s.nm==='glow').length===2&&F.inspect().stats.xMerged>=1,env.xs.map(s=>s.nm));
 env.time+=.1;env.tick();ok('tight cluster: both mobs still vanish',m1.hp<=0&&m2.hp<=0);
 ok('samong cross: no errors',F.inspect().stats.errors===0,F.inspect().lastError);}
// ---- 슬레이어 Q 핏빛 휠윈드(사용자 12:53, 분위기 참고만): 그림만 바뀌고 피해·시간·재사용 대기는 그대로 ----
function slayerQChecks(){
 class Rec2 extends Rec{constructor(){super();this.globalAlpha=1;this.globalCompositeOperation='source-over';this.st2=[];}
  save(){super.save();this.st2.push([this.globalAlpha,this.globalCompositeOperation]);}restore(){super.restore();const s=this.st2.pop();if(s)[this.globalAlpha,this.globalCompositeOperation]=s;}
  drawImage(im,sx,sy,sw,sh,dx,dy,dw,dh){this.commands.push({kind:'image',owner:{...this.owner},image:im,op:this.globalCompositeOperation,alpha:this.globalAlpha,src:[sx,sy,sw,sh],points:[this.pt(dx,dy),this.pt(dx+dw,dy),this.pt(dx+dw,dy+dh),this.pt(dx,dy+dh)]});}}
 const hits=[],foe={id:'f1',name:'몹',x:4,y:0,hp:5000,maxHp:5000,spawnState:'active',radius:.3};
 const env={console,Math,JSON,Number,String,Array,Object,Set,Map,WeakMap,Promise,Error,isFinite,localStorage:{getItem:()=>null,setItem(){}},
  time:5,ctx:new Rec2(),room:{id:'q-room',enemies:[foe]},player:{x:0,y:0,hero:'slayer',hp:100,specialCD:0,direction:'e'},effects:[],settings:{},shake:0,started:true,modal:null,loading:false};
 env.window=env;env.actorHeight=()=>54;env.project=(x,y)=>({x:640+x*32,y:360+y*16});
 env.attackPower=()=>50;env.rank=()=>0;env.nearestEnemy=()=>foe;env.facing=()=>'e';env.sound=()=>{};env.blocked=()=>false;env.readyImage=()=>({image:IMG});env.ensureImages=()=>{};
 env.hitEnemy=(e,a,s)=>{hits.push([e.id,+a.toFixed(3),s?.r425]);e.hp-=a;return true;};env.special=()=>{env.nativeSpecial=(env.nativeSpecial||0)+1;};env.fx=()=>null;
 env.tick=dt=>{env.time+=dt;for(const f of env.effects)f.age=(f.age||0)+dt;env.effects=env.effects.filter(f=>f.age<f.life);};env.drawEffect=()=>{};
 env.drawHero=()=>{const R=env.ctx,q=env.project(env.player.x,env.player.y);R.scope({id:'hero',kind:'hero'},()=>R.commands.push({kind:'image',owner:{...R.owner},image:IMG,sourcePath:'assets/heroes/slayer/attack-e.webp',points:[R.pt(q.x-10,q.y-54),R.pt(q.x+30,q.y-54),R.pt(q.x+30,q.y),R.pt(q.x-10,q.y)]}));};
 const draws=[];env.__STORYWORLD_FX_SPRITES_R106__={pal:F=>F,warm:()=>{env.warmCalls=(env.warmCalls||0)+1;},
  draw:(nm,F,x,y,w,h,o={})=>{const c={kind:'sprite',owner:{...env.ctx.owner},nm,F,x,y,w,h,o};draws.push(c);env.ctx.commands.push(c);return true;},
  along:(nm,F,x0,y0,x1,y1,th,o={})=>{const c={kind:'sprite',owner:{...env.ctx.owner},nm,F,x:x0,y:y0,w:th,h:th,o};draws.push(c);env.ctx.commands.push(c);return true;}};
 env.__STORYWORLD_SLAYER_R_TORNADO_R366__={index:()=>({layers:{back:{file:'tornado-back.webp'},front:{file:'tornado-front.webp'}},frames:12,cell:[256,320],origin:[128,286],height_px:250,loop_s:.5})};
 vm.createContext(env);vm.runInContext(C('slayer-blood-r425.js'),env);const SB=env.__STORYWORLD_SLAYER_BLOOD_R425__,DT=1/60,step=()=>env.tick(DT);
 env.special();const s0=SB.state();
 ok('slayer Q: cast through special() (native special not called), cooldown 10 s at rank 0, windup first, sprites warmed',!env.nativeSpecial&&env.player.specialCD===10&&s0.Q&&!s0.Q.launched&&env.warmCalls>=2,{s0,warm:env.warmCalls});
 // 시전 0.32초: 몸은 0.05초마다 좌·우 반전(가로 폭·세로 그대로), 베기 고리 뒤쪽 반은 몸 앞에, 앞쪽 반은 몸 뒤에 그려진다
 const mir=[],order=[],shape=[],backY=[],frontY=[],spinNames=new Set();
 for(let i=0;i<18;i++){step();env.ctx.commands.length=0;env.drawHero();const cmds=env.ctx.commands,hi=cmds.findIndex(c=>c.owner?.kind==='hero'),hc=cmds[hi],xs=hc.points.map(p=>p[0]),ys=hc.points.map(p=>p[1]);
  mir.push(Math.min(...xs)<620?1:0);shape.push(Math.round(Math.max(...xs)-Math.min(...xs))===40&&Math.min(...ys)===306&&Math.max(...ys)===360);
  const bi=cmds.flatMap((c,j)=>c.owner?.id==='r425:spin-back'?[j]:[]),fi=cmds.flatMap((c,j)=>c.owner?.id==='r425:spin-front'?[j]:[]);order.push(bi.length>0&&fi.length>0&&Math.max(...bi)<hi&&Math.min(...fi)>hi);
  for(const c of cmds)if(c.kind==='sprite'){spinNames.add(c.nm);if(c.nm==='spark')(c.owner.id==='r425:spin-back'?backY:frontY).push(c.y);}}
 const flipsN=mir.slice(1).filter((v,i)=>v!==mir[i]).length,avg=a=>a.reduce((s,v)=>s+v,0)/Math.max(1,a.length);
 ok('slayer Q windup: body mirrored left/right every 0.05 s (≥5 turns in 0.3 s), never squeezed — width 40 px and height kept',flipsN>=5&&mir.includes(1)&&mir.includes(0)&&shape.every(Boolean),{mir:mir.join(''),flipsN});
 ok('slayer Q windup: blood slash ring — back half drawn before the body, front half after; back half sits higher on screen',order.every(Boolean)&&backY.length>0&&frontY.length>0&&avg(backY)<avg(frontY),{order,back:avg(backY),front:avg(frontY)});
 ok('slayer Q windup: no cross sprite (crosses stay with R, upright); streaks = dark blood body (petal) + bright edge (spark)',!spinNames.has('cross')&&spinNames.has('spark')&&spinNames.has('petal'),[...spinNames]);
 // 날아가는 회오리
 let launchAt=null,maxDraw=0;const ops=new Set(),names=new Set(),sizes=[];
 const fly=n=>{for(let i=0;i<n;i++){step();const s=SB.state();if(s.Q?.launched&&launchAt==null)launchAt=+(env.time-5).toFixed(3);const f=env.effects.find(f=>f.type==='r425-tornado');
  if(f){env.ctx.commands.length=0;draws.length=0;env.drawEffect(f);const im=env.ctx.commands.filter(c=>c.kind==='image');ops.add(im.map(c=>c.op).join());if(im[0])sizes.push(Math.round(im[0].points[2][1]-im[0].points[0][1]));maxDraw=Math.max(maxDraw,draws.length);for(const d of draws)names.add(d.nm);}}};
 fly(90);
 ok('slayer Q launch timing kept: whirlwind leaves at 0.32–0.35 s',launchAt>=.32&&launchAt<.35,launchAt);
 ok('slayer Q whirlwind: R366 painted layers back+front, each with a half-beat-offset additive pass (wet sheen), ≈2× hero height at full size',[...ops].some(o=>o==='source-over,lighter,source-over,lighter')&&Math.max(...sizes)>=Math.round(320*54*2.05/250)-1,{ops:[...ops],max:Math.max(...sizes)});
 ok('slayer Q whirlwind: spiral slash streaks, blood mist, flung droplets, ground pool/ring, trail — no cross',['spark','petal','smoke','orb','slashwide','glow','slashline'].every(n=>names.has(n))&&!names.has('cross')&&maxDraw>=40,{names:[...names],maxDraw});
 fly(300);
 ok('slayer Q damage unchanged: one pierce hit ×0.9 of attack×2.4 (=108), then 5 bleed ticks ×0.07 (=8.4)',JSON.stringify(hits)===JSON.stringify([['f1',108,'q-tornado'],...Array(5).fill(['f1',8.4,'q-bleed'])]),hits);
 // 저사양: 같은 회오리를 더 적은 그림으로
 env.settings.lowFx=true;env.player.specialCD=0;const full=maxDraw;maxDraw=0;names.clear();env.special();fly(60);
 ok('slayer Q lowFx: fewer draws (≤65% of full) with the same parts',maxDraw>0&&maxDraw<=full*.65&&names.has('spark')&&names.has('orb'),{full,low:maxDraw});
 ok('slayer Q: no errors',SB.inspect().stats.errors===0&&SB.inspect().revision==='R425-slayer-blood-2',SB.inspect());}
// ---- ⑩ 적 공격 그림 방향(사용자 13:12·13:20 전수조사): 표에 오른 그림만, 공격 중일 때만, 대상 쪽을 보게 좌우만 ----
function atkFaceChecks(){const src=C('combat-flow-r425.js'),m=/const ATK_FACE=Object\.freeze\((\{[^)]*\})\);/.exec(src);let tbl={};try{tbl=JSON.parse((m?.[1]||'{}').replace(/'/g,'"'));}catch(_){tbl=null;}
 const keys=Object.keys(tbl||{});
 ok('attack-facing table parsed: census entries are L/R only, no Mammon art',tbl&&keys.length>0&&keys.every(k=>/^[LR]$/.test(tbl[k]))&&!keys.some(k=>/mammon/i.test(k)),keys.length);
 const k=keys.find(x=>!/#/.test(x));if(!k){ok('attack-facing: a path-level entry to test with',false);return;}const nat=tbl[k];
 const env=makeEnv(),F=env.__STORYWORLD_COMBAT_FLOW_R425__;
 const mk=(id,art,ang,mir)=>({id,name:'시험 몹',x:0,y:-1,hp:10,maxHp:10,k:1.4,art:'assets/'+art,mir,attack:ang==null?null:{elapsed:.2,angle:ang}});
 const body=cs=>cs.filter(c=>c.kind==='image').sort((a,b)=>(bbox(b)[3]-bbox(b)[1])-(bbox(a)[3]-bbox(a)[1]))[0];
 const leftOf=(cs,n)=>{const b=body(cs);return (n==='L')!==(b.points[1][0]<b.points[0][0]);};
 const res=[];for(const [ang,wantLeft] of [[0,false],[Math.PI,true]])for(const mir of [false,true]){const e=mk('af'+ang+mir,k,ang,mir);let cs;for(let i=0;i<2;i++)cs=frame(env,e);const bb=bbox(body(cs)),q=env.project(e.x,e.y);
  res.push({ang,mir,ok:leftOf(cs,nat)===wantLeft,foot:near((bb[0]+bb[2])/2,q.x,1.5)});}
 ok('attack facing: listed art ('+nat+'-native) faces the attack side in all 4 cases (target left/right × drawn plain/mirrored), feet stay put',res.every(r=>r.ok&&r.foot),res);
 // 공격 중이 아니면 / 표에 없는 그림이면 / 끄면 그대로
 const idle=mk('af-idle',k,null,false);let cs;for(let i=0;i<2;i++)cs=frame(env,idle);const p0=body(cs).points[1][0]>body(cs).points[0][0];
 const other=mk('af-other','mobs/not-listed-attack.webp',0,true);for(let i=0;i<2;i++)cs=frame(env,other);const p1=body(cs).points[1][0]<body(cs).points[0][0];
 F.set('atkFace',false);const off=mk('af-off',k,nat==='L'?0:Math.PI,false);for(let i=0;i<2;i++)cs=frame(env,off);const p2=body(cs).points[1][0]>body(cs).points[0][0];F.set('atkFace',true);
 ok('attack facing leaves alone: not attacking, art not in the table, switched off',p0&&p1&&p2,{p0,p1,p2});
 ok('attack facing: no errors, fixes counted',F.inspect().stats.errors===0&&F.inspect().stats.faceFixed>=2,F.inspect().stats);}
function cleanChecks(){const fs=require('fs'),path=require('path'),crypto=require('crypto'),R=path.join(__dirname,'..','..');const src=C('combat-flow-r425.js'),m=/const CLEAN425=new Set\((\[[^\]]*\])\)/.exec(src);let list=[];try{list=JSON.parse(m[1]);}catch(_){}
 const spec=JSON.parse(fs.readFileSync(path.join(R,'r425-mob-clean.json'),'utf8')),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
 const rows=spec.images.map(r=>{const out=path.join(R,'runtime-text',r.output||'-');const ok=fs.existsSync(out)&&sha(fs.readFileSync(out))===r.outputSha256;return{p:r.path,ok,listed:list.includes(r.path)};});
 ok('background cleanup: every cleaned copy exists with its recorded hash, is redirected by combat-flow, originals untouched, no Mammon art',rows.length>0&&rows.every(r=>r.ok&&r.listed)&&list.length===rows.length&&spec.originalsModified===false&&!list.some(x=>/mammon/i.test(x)),rows.filter(r=>!r.ok||!r.listed));}
function reviewChecks(){/* R425 리뷰 회귀: 연쇄 폭발이 R118 퍼짐으로 무리 전체에 번지지 않음 · Q 재사용 대기 R26/R62 · 표식·탑·네온 */
 const foes=[0,1,2,3,4,5].map(i=>({id:'r'+i,name:'몹',x:.5+i*.25,y:0,hp:1e6,maxHp:1e6,spawnState:'active',radius:.3}));let chains=0;
 const env={console,Math,JSON,Number,String,Array,Object,Set,Map,WeakMap,Promise,Error,isFinite,localStorage:{getItem:()=>null,setItem(){}},time:5,ctx:new Rec(),room:{id:'rv',enemies:foes},
  player:{x:0,y:0,hero:'slayer',hp:100,specialCD:0,direction:'e',storyWER:{ready:{'slayer:r':25}}},effects:[],settings:{},shake:0,started:true,modal:null,loading:false,COMBAT_RHYTHM_R26:1.18};
 env.window=env;env.actorHeight=()=>54;env.project=(x,y)=>({x:640+x*32,y:360+y*16});env.attackPower=()=>50;env.rank=()=>0;env.nearestEnemy=()=>foes[0];env.facing=()=>'e';env.sound=()=>{};env.blocked=()=>false;
 env.readyImage=()=>null;env.ensureImages=()=>{};env.delay=(t,f)=>f();env.liveEnemies=()=>foes.filter(e=>e.hp>0);env.fx=()=>null;env.special=()=>{};env.tick=()=>{};env.drawEffect=()=>{};env.drawHero=()=>{};
 env.__STORYWORLD_PROGRESSION_R62__={factors:()=>({cooldown:.5})};
 env.hitEnemy=(e,a,s)=>{e.hp-=a;return true;};
 vm.createContext(env);vm.runInContext(C('slayer-blood-r425.js'),env);
 /* R118 모양 바깥 퍼짐: 맞은 적 주변 1.5칸에 r118Splash 피해, 소스가 r118Splash 면 퍼지지 않음 */
 const inner=env.hitEnemy;env.hitEnemy=function(e,a,s){const r=inner(e,a,s);if(!(s&&s.r118Splash))for(const o of foes)if(o!==e&&Math.hypot(o.x-e.x,o.y-e.y)<1.5)inner(o,a*.3,{r118Splash:true,friendly:true,kind:'hero-splash-r118'});return r;};
 const S=env.__STORYWORLD_SLAYER_BLOOD_R425__;const st0=S?.inspect?.().stats?.chains||0;
 env.fx('storySourceSkill',0,0,{storyWER:true,sourceHero:'slayer',sourceSlot:'r',stage:'warning',castId:77});
 const rcd=env.player.storyWER.ready['slayer:r'];
 env.time+=1.0;env.hitEnemy(foes[0],40,{friendly:true,kind:'hero-basic'});
 chains=(S?.inspect?.().stats?.chains||0)-st0;
 ok('review: one hero hit during the aura sets off at most 2 chain bursts even with an R118-style splash (no pack-wide cascade)',chains>=1&&chains<=2,{chains});
 ok('review: R warning cue still gets the R62 cooldown shortening',Math.abs(rcd-(5+20*.5))<1e-6,{rcd});
 env.player.specialCD=0;env.time+=20;env.special();ok('review: Q cooldown = 10 × R26 1.18 × R62 factor',Math.abs(env.player.specialCD-10*1.18*.5)<1e-6,{cd:env.player.specialCD});
 const cf=C('combat-flow-r425.js');
 ok('review: selected-target marker and small move/select sigils are kept with telegraphs off; R170/R75 towers are not resized; Neon tip aura removed',/target-mark\/\.test\(srcOf\(c\)\)&&!\(typeof target!=='undefined'&&e\?\.id===target\)/.test(cf)&&/\(\+fe\.size\|\|1\)>1\.02/.test(cf)&&/e\.r170Tower\|\|e\.r75Tower/.test(cf)&&(!/neon:\{F:/.test(cf)||/neon:\{F:\{[^}]*\},k:[\d.]+,needR437:true\}/.test(cf))/* R437: 칸마다 잰 창끝이 있는 새 공격 칸에서만 다시 켬 */);}
(async()=>{await gazeChecks();slayerQChecks();atkFaceChecks();cleanChecks();reviewChecks();
ok('gameplay untouched except ⑧ (user-asked laser cross, through the engine hitEnemy): no damage/cooldown/save writes in combat-flow',!/attackCD\s*=|\.damage\s*=|saveGame|localStorage\.setItem\((?!KEY)/.test(C('combat-flow-r425.js')));
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(JSON.stringify({ok:pass===checks.length,checks:checks.length,pass,method:'CPU fake globals and a fake command recorder; headless screenshots separately; no GPU or device'}));
if(pass!==checks.length)process.exit(1);})().catch(e=>{console.error(e);process.exit(1);});
