// R425 CPU check: 전투 연출 — 몹 크기 띠·타격 눌림·창끝 기운·거미 X자·발 딛기·헌터 7프레임·정방향 십자가·기억사수 120°·슬레이어 자세/새 R/Q·
//  환도 공격 좌·우만·광폭화 보스 체력바 머리 위·적 공격 예고 표시 기본 꺼짐. 가짜 전역(기록기 흉내)으로 돌린다 — GPU·실기기·자연 플레이 아님.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=path.join(R,'runtime-text');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const FILES=['slayer-blood-r425.js','combat-flow-r425.js','fx-sprites-r106.js','attack-anim-r143.js','slayer-r351.js','slayer-r-tornado-r366.js','hwando-r277.js'];
ok('runtime copies match client-source',FILES.every(f=>fs.readFileSync(path.join(RT,f),'utf8')===C(f)),FILES.filter(f=>fs.readFileSync(path.join(RT,f),'utf8')!==C(f)));
const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');
ok('script tags once, right after combat-read-r409 and before combat-r118',/<script src="\.\/combat-read-r409\.js"><\/script><script src="\.\/slayer-blood-r425\.js"><\/script><script src="\.\/combat-flow-r425\.js"><\/script>\s*<script src="\.\/combat-r118\.js">/.test(html)&&html.split('"./combat-flow-r425.js"').length===2&&html.split('"./slayer-blood-r425.js"').length===2);
const ver=fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8');ok('listed in verify-r96-public.py',ver.includes("'slayer-blood-r425.js'")&&ver.includes("'combat-flow-r425.js'"));
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
function makeEnv(store={}){const env={console,Math,JSON,Number,String,Array,Object,Set,Map,WeakMap,WeakSet,Promise,Error,Uint8ClampedArray,isFinite,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},document:{createElement:()=>fakeCanvas(),getElementById:()=>null},requestAnimationFrame:()=>0,
 time:1,ctx:new Rec(),room:{id:'test-room',enemies:[]},player:{x:0,y:0,hero:'lauren',hp:10,attackAnim:0},VFX:{mark:'assets/vfx/generated/v300/target-mark.webp'},settings:{}};
 env.window=env;env.actorHeight=()=>54;env.project=(x,y)=>({x:640+x*32,y:360+y*16});env.moveActor=(a,dx,dy)=>{a.x+=dx;a.y+=dy;};
 env.baseCalls={effects:0};
 env.drawEnemy=function(e){const R=env.ctx,q=env.project(e.x,e.y),H=54*(e.k||1.4),bh=H/FR,bw=bh*2/3;
  R.scope({id:'enemy:'+e.id,kind:'enemy'},()=>{R.commands.push({kind:'image',owner:{...R.owner},image:IMG,sourceRect:[0,0,200,300],sourcePath:'assets/mobs/test-mob.webp',points:[R.pt(q.x-bw/2,q.y-bh*.95),R.pt(q.x+bw/2,q.y-bh*.95),R.pt(q.x+bw/2,q.y+bh*.05),R.pt(q.x-bw/2,q.y+bh*.05)]});
   const W=55,y=q.y+6;for(const col of ['#302926','#795a50'])R.commands.push({kind:'fill',owner:{...R.owner},style:{fillStyle:col},paths:[{points:[R.pt(q.x-W/2,y),R.pt(q.x+W/2,y),R.pt(q.x+W/2,y+2),R.pt(q.x-W/2,y+2)]}]});
   R.commands.push({kind:'text',owner:{...R.owner},text:e.name,point:R.pt(q.x,q.y-H-8),matrix:R.m.slice(),style:{}});
   if(e.tell)R.commands.push({kind:'image',owner:{...R.owner},image:IMG,sourcePath:'assets/vfx/generated/v300/target-mark.webp',points:[R.pt(q.x-9,q.y-40),R.pt(q.x+9,q.y-40),R.pt(q.x+9,q.y-22),R.pt(q.x-9,q.y-22)]});});
  if(e.tele){const to=env.project(env.player.x,env.player.y);R.commands.push({kind:'stroke',owner:{...R.owner},style:{strokeStyle:'rgba(12,10,12,.92)'},paths:[{points:[R.pt(q.x,q.y),R.pt(to.x,to.y)]}]});
   R.commands.push({kind:'fill',owner:{...R.owner},style:{fillStyle:'rgba(14,13,15,.92)'},paths:[{points:[R.pt(q.x-30,q.y-H-20),R.pt(q.x+30,q.y-H-20),R.pt(q.x+30,q.y-H-3),R.pt(q.x-30,q.y-H-3)]}]});
   R.commands.push({kind:'text',owner:{...R.owner},text:'원거리 조준',point:R.pt(q.x,q.y-H-11),matrix:R.m.slice(),style:{}});}};
 env.hitEnemy=(e,a)=>{e.hp-=a;};env.tick=()=>{};env.drawHero=()=>{};env.drawEffect=()=>{env.baseCalls.effects++;};
 vm.createContext(env);vm.runInContext(C('combat-flow-r425.js'),env);return env;}
const frame=(env,e)=>{env.ctx.commands.length=0;env.time+=.1;env.drawEnemy(e);return env.ctx.commands;};
const bbox=c=>{const P=c.points||c.paths[0].points;const xs=P.map(p=>p[0]),ys=P.map(p=>p[1]);return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];};
const near=(a,b,t=.6)=>Math.abs(a-b)<=t;
{const env=makeEnv(),F=env.__STORYWORLD_COMBAT_FLOW_R425__;
 ok('combat-flow loads; telegraphs default OFF, boss bar on, settings API exposed',F&&F.inspect().prefs.tele===false&&F.inspect().prefs.bossBar===true&&typeof F.teleSet==='function'&&F.revision==='R425-flow-2');
 // 큰 일반 몹(원래 키 영웅 2.5배) → 일반 띠 상한 1.55 로
 const e={id:'m1',name:'시험 몹',x:0,y:-1,hp:10,maxHp:10,k:2.5};let cs;for(let i=0;i<4;i++)cs=frame(env,e);
 const body=cs.find(c=>c.kind==='image'),opaque=(bbox(body)[3]-bbox(body)[1])*FR,bars=cs.filter(c=>c.kind==='fill'),q=env.project(e.x,e.y),txt=cs.find(c=>c.kind==='text');
 ok('size band: oversized normal mob drawn at 1.55× hero height',near(opaque,1.55*54,1),opaque);
 ok('HP bar keeps native width and place under the feet when the body is rescaled',bars.length===2&&bars.every(b=>{const bb=bbox(b);return near(bb[2]-bb[0],55)&&near(bb[1],q.y+6);}),bars.map(bbox));
 ok('name label keeps its font size (matrix scale 1) while following the scaled head',txt&&near(txt.matrix[0],1,.01)&&near(txt.matrix[3],1,.01),txt?.matrix);
 // 예고 표시 기본 꺼짐
 const t={id:'m2',name:'원거리 몹',x:3,y:0,hp:10,maxHp:10,k:2.5,tele:true,tell:1};for(let i=0;i<3;i++)cs=frame(env,t);
 ok('telegraphs OFF by default: aim lane, label box, label text and tell mark removed; body and bar stay',!cs.some(c=>c.kind==='stroke'||c.style?.fillStyle==='rgba(14,13,15,.92)'||c.text==='원거리 조준'||/target-mark/.test(c.sourcePath||''))&&cs.some(c=>c.kind==='image')&&cs.filter(c=>c.kind==='fill').length===2);
 F.teleSet(true);cs=frame(env,t);const lane=cs.find(c=>c.kind==='stroke'),to=env.project(0,0);
 ok('telegraphs ON: shown, and the aim lane still ends on the real target (rescale undone)',lane&&near(lane.paths[0].points[1][0],to.x)&&near(lane.paths[0].points[1][1],to.y)&&cs.some(c=>c.text==='원거리 조준'),lane?.paths?.[0]?.points);
 F.teleSet(false);let eff=env.baseCalls.effects;env.drawEffect({type:'sigil',asset:env.VFX.mark});const skipped=env.baseCalls.effects===eff;env.drawEffect({type:'sigil',asset:'assets/other.webp'});
 ok('R116 charge target sigil (VFX.mark) hidden when OFF; other sigils still drawn',skipped&&env.baseCalls.effects===eff+1);}
{const env=makeEnv();env.__STORYWORLD_BOSS_R205__={inspect:()=>({prefs:{enrage:true}}),constants:{ENRAGE_SIZE:2}};
 const b={id:'b1',name:'시험 보스',boss:true,x:0,y:0,hp:100,maxHp:100,k:2.1};let cs;for(let i=0;i<4;i++)cs=frame(env,b);const q=env.project(0,0);
 const bar0=cs.filter(c=>c.kind==='fill').map(bbox);ok('boss before enrage: bar under the feet',bar0.length===2&&bar0.every(bb=>near(bb[1],q.y+6)),bar0);
 b.r205Enraged={at:1};b.hp=25;b.k=4.2;for(let i=0;i<12;i++)cs=frame(env,b);
 const body=cs.find(c=>c.kind==='image'),bb=bbox(body),opaque=(bb[3]-bb[1])*FR,head=bb[1]+(bb[3]-bb[1])*TOP,bars=cs.filter(c=>c.kind==='fill').map(bbox),txt=cs.find(c=>c.text==='시험 보스');
 ok('enraged boss keeps the R205 2× size (boss band × 2, not shrunk back)',opaque>=1.9*2*54-2&&opaque<=2.3*2*54+2,opaque/54);
 ok('enraged boss: HP bar moves above the head (8 px over the sheet head line), not in the middle of the body',bars.length===2&&bars.every(x=>x[3]<=head-7&&x[3]>=head-12),{head,bars});
 ok('enraged boss: name label sits right above the bar',txt&&near(txt.point[1],bars[0][1]-5,1),{name:txt?.point,bar:bars[0]});}
ok('gameplay untouched: no damage/cooldown/save writes in combat-flow (only visuals, positions of walking mobs and the hero plant)',!/attackCD\s*=|\.damage\s*=|saveGame|localStorage\.setItem\((?!KEY)/.test(C('combat-flow-r425.js')));
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(JSON.stringify({ok:pass===checks.length,checks:checks.length,pass,method:'CPU fake globals and a fake command recorder; headless screenshots separately; no GPU or device'}));
if(pass!==checks.length)process.exit(1);
