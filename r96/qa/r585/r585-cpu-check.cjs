// R585 CPU check: 슬레이어 스킬 이펙트를 Dots 협업 프레임 시트(CX-0055 SL01~SL10, Claude 보정)로 바꾼다.
//  R 십자가·피 폭발·적혈 오라 / Q 시전 고리·토네이도·출혈 / W 피의 희생 / E 피의 대시 / D 공명방어 / F EGO.
//  판정·피해·재사용 대기·시간은 그대로(그림만). 가짜 전역(기록기 흉내)으로 돌린다 — GPU·실기기·자연 플레이 아님.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=path.join(R,'runtime-text');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const has=f=>fs.existsSync(path.join(R,'client-source',f));
const FILE='slayer-sheets-r585.js';
ok('overlay exists and runtime copy matches client-source',has(FILE)&&fs.existsSync(path.join(RT,FILE))&&fs.readFileSync(path.join(RT,FILE),'utf8')===C(FILE));
const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');
{const at=n=>html.indexOf('"./'+n+'"'),me=at(FILE);const INNER=['slayer-blood-r425.js','fx-d2s-r106.js','skills-r209.js','hero-fx-r102.js','hero-skills-r269.js','fx-blood-r190.js','slayer-r-tornado-r366.js'];
 ok('script tag once, last overlay before combat-r118 — outside R425 and every W/E/D procedural layer (d2s·R209·R102·R269) so their fx/draw wrappers are inner',/<script src="\.\/slayer-sheets-r585\.js"><\/script>(?:<script src="\.\/enemy-attack-tempo-r601\.js"><\/script>)?\s*<script src="\.\/combat-r118\.js">/.test(html)&&html.split('"./'+FILE+'"').length===2&&INNER.every(n=>at(n)>0&&at(n)<me)&&me<at('combat-r118.js'),INNER.map(n=>[n,at(n)<me]));}
const ver=fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8');
ok('listed in verify-r96-public.py expected list',/'slayer-sheets-r585\.js',/.test(ver));
ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r585/r585-cpu-check.cjs'));
// ---- 시트 자산: 15장, webp, 셀 192, 장당 400KB 이하·합계 3.2MB 이하, 프레임 수·타격 프레임·루프 표시 ----
const IDXP=path.join(RT,'assets/r585/index.json');let IDX=null;try{IDX=JSON.parse(fs.readFileSync(IDXP,'utf8'));}catch(_){}
const NAMES=['slayer-r-cross','slayer-burst-big','slayer-burst-small','slayer-r-aura-back','slayer-r-aura-front','slayer-q-spin-back','slayer-q-spin-front','slayer-q-tornado-back','slayer-q-tornado-front','slayer-bleed','slayer-w-sacrifice','slayer-e-dash','slayer-d-guard','slayer-ego-enter','slayer-ego-loop'];
ok('index.json lists the 15 CX-0055 sheets (SL01~SL10)',IDX&&NAMES.every(n=>IDX.sheets?.[n]),IDX&&NAMES.filter(n=>!IDX.sheets?.[n]));
const webpSize=b=>{if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')return null;const k=b.toString('ascii',12,16);if(k==='VP8X')return[1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];if(k==='VP8L'){const v=b.readUInt32LE(21);return[1+(v&0x3fff),1+((v>>14)&0x3fff)];}if(k==='VP8 ')return[b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];return null;};
let total=0;const bad=[];
if(IDX)for(const n of NAMES){const s=IDX.sheets[n];if(!s){bad.push(n+':missing');continue;}const p=path.join(RT,'assets/r585',s.file);if(!fs.existsSync(p)){bad.push(n+':file');continue;}const b=fs.readFileSync(p);total+=b.length;
 const wh=webpSize(b);if(!wh||wh[0]!==s.cols*s.cell||wh[1]!==s.rows*s.cell)bad.push(n+':dims '+wh);if(s.cell!==192)bad.push(n+':cell');if(b.length>400000)bad.push(n+':bytes '+b.length);
 if(crypto.createHash('sha256').update(b).digest('hex')!==s.sha256)bad.push(n+':sha');if(!(s.frames>=18&&s.frames<=24))bad.push(n+':frames');}
ok('sheets: webp, 192 px cells, sizes/sha match index, each ≤400 KB, total ≤3.2 MB',bad.length===0&&total>0&&total<=3200000,{bad,total});
ok('timing fixes recorded: R cross hit frame 13, small burst hit 3, big burst hit 5, W hit 8, E hit 12, loops for aura/spin/tornado/guard/ego',IDX&&IDX.sheets['slayer-r-cross']?.hit===13&&IDX.sheets['slayer-burst-small']?.hit===3&&IDX.sheets['slayer-burst-big']?.hit===5&&IDX.sheets['slayer-w-sacrifice']?.hit===8&&IDX.sheets['slayer-e-dash']?.hit===12&&['slayer-r-aura-back','slayer-r-aura-front','slayer-q-spin-back','slayer-q-spin-front','slayer-q-tornado-back','slayer-q-tornado-front','slayer-d-guard','slayer-ego-loop'].every(n=>IDX.sheets[n]?.loop===true));
ok('no Drive ids or private links in the sheet index',IDX&&!/drive\.google|(?<![A-Za-z0-9_-])(?=[A-Za-z0-9_-]*[A-Z])(?=[A-Za-z0-9_-]*[0-9])[A-Za-z0-9_-]{25,44}(?![A-Za-z0-9_-])/.test(JSON.stringify(IDX)));
ok('in-code sheet table matches index.json (frames, loop, pivot, hit)',(()=>{try{const src=C(FILE);return IDX&&NAMES.every(n=>{const s=IDX.sheets[n],re=new RegExp("'"+n+"':\\{frames:"+s.frames+",fps:[0-9.]+,pivot:\\["+s.pivot.join(',')+"\\]"+(s.hit!=null?',hit:'+s.hit:'')+(s.loop?',loop:true':''));return re.test(src);});}catch(_){return false;}})());
const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')),M=new Map(man.files.map(f=>[f.path,f.sha256]));const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(RT,p))).digest('hex');
const ASSETS=IDX?['assets/r585/index.json',...NAMES.map(n=>'assets/r585/'+IDX.sheets[n]?.file)]:[];
ok('runtime-manifest hashes match (script + 15 sheets + index)',has(FILE)&&[FILE,...ASSETS].every(f=>{try{return M.get(f)===sha(f);}catch(_){return false;}}),[FILE,...ASSETS].filter(f=>{try{return M.get(f)!==sha(f);}catch(_){return true;}}));

// ---- 가짜 실행 환경 -----------------------------------------------------------------------------------------
class Rec{constructor(){this.commands=[];this.m=[1,0,0,1,0,0];this.st=[];this.owner={id:'scene',kind:'scene'};this.globalAlpha=1;this.globalCompositeOperation='source-over';}
 save(){this.st.push([this.m.slice(),this.globalAlpha,this.globalCompositeOperation]);}restore(){const s=this.st.pop();if(s)[this.m,this.globalAlpha,this.globalCompositeOperation]=s;}
 translate(x,y){const m=this.m;m[4]+=m[0]*x+m[2]*y;m[5]+=m[1]*x+m[3]*y;}scale(x,y){const m=this.m;m[0]*=x;m[1]*=x;m[2]*=y;m[3]*=y;}
 rotate(a){const m=this.m,c=Math.cos(a),s=Math.sin(a),[a0,b0,c0,d0]=m;m[0]=a0*c+c0*s;m[1]=b0*c+d0*s;m[2]=-a0*s+c0*c;m[3]=-b0*s+d0*c;}
 pt(x,y){const m=this.m;return [m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];}scope(o,fn){const p=this.owner;this.owner=o;try{return fn();}finally{this.owner=p;}}
 drawImage(im,sx,sy,sw,sh,dx,dy,dw,dh){this.commands.push({kind:'image',owner:{...this.owner},image:im,src:[sx,sy,sw,sh],op:this.globalCompositeOperation,alpha:this.globalAlpha,points:[this.pt(dx,dy),this.pt(dx+dw,dy),this.pt(dx+dw,dy+dh),this.pt(dx,dy+dh)]});}}
const IMG={naturalWidth:200,naturalHeight:300,src:'hero'};
function makeEnv(o={}){
 const hits=[],foe={id:'f1',name:'몹',x:4,y:0,hp:5000,maxHp:5000,spawnState:'active',radius:.3},foe2={id:'f2',name:'몹',x:1.2,y:.4,hp:5000,maxHp:5000,spawnState:'active',radius:.3};
 const env={console,Math,JSON,Number,String,Array,Object,Set,Map,WeakMap,Promise,Error,isFinite,localStorage:{_s:{},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},
  time:5,ctx:new Rec(),room:{id:'room-a',enemies:[foe,foe2]},player:{x:0,y:0,hero:o.hero||'slayer',hp:100,specialCD:0,direction:'e',ego:0},effects:[],settings:{lowFx:!!o.lowFx},shake:0,started:true,modal:null,loading:false,keys:new Set(),joystickVector:{x:0,y:0},route:[],command:null};
 if(o.ls)Object.assign(env.localStorage._s,o.ls);
 env.window=env;env.actorHeight=()=>54;env.project=(x,y)=>({x:640+x*32,y:360+y*16});env.TILE=34;env.zoom=1;
 env.attackPower=()=>50;env.rank=()=>0;env.nearestEnemy=()=>foe;env.facing=()=>'e';env.sound=()=>{};env.blocked=()=>false;env.liveEnemies=()=>env.room.enemies.filter(e=>e.hp>0);env.clearLine=()=>true;env.damageable3=e=>e.hp>0;
 env.requested=[];env.ready=o.ready!==false;const SHEET={naturalWidth:1152,naturalHeight:768,src:'sheet'};
 env.readyImage=p=>/assets\/r585\//.test(p)?(env.ready?{image:SHEET}:null):{image:IMG};env.ensureImages=a=>{env.requested.push(...a);};
 env.hitEnemy=(e,a,s)=>{hits.push([e.id,+a.toFixed(3),s?.r425||s?.kind]);e.hp-=a;return true;};env.special=()=>{env.nativeSpecial=(env.nativeSpecial||0)+1;};
 env.fxBase=[];env.fx=(type,x,y,opt)=>{env.fxBase.push([type,opt?.sourceHero,opt?.sourceSlot,opt?.stage]);return null;};
 env.tick=dt=>{env.time+=dt;for(const f of env.effects)f.age=(f.age||0)+dt;env.effects=env.effects.filter(f=>f.age<f.life);};
 env.baseDrawn=[];env.drawEffect=e=>{env.baseDrawn.push(e?.type);};
 env.drawHero=()=>{const Rr=env.ctx,q=env.project(env.player.x,env.player.y);Rr.scope({id:'hero',kind:'hero'},()=>Rr.commands.push({kind:'image',owner:{...Rr.owner},image:IMG,sourcePath:'assets/heroes/slayer/attack-e.webp',points:[Rr.pt(q.x-10,q.y-54),Rr.pt(q.x+30,q.y-54),Rr.pt(q.x+30,q.y),Rr.pt(q.x-10,q.y)]}));};
 env.ego=()=>{env.player.ego=10;env.egoActive=true;};env.__STORYWORLD_EGO151__={inspect:()=>({state:{active:!!env.egoActive&&!o.egoBlocksR425}})};
 env.sprites=[];env.__STORYWORLD_FX_SPRITES_R106__={pal:F=>F,warm:()=>{},draw:(nm,F,x,y,w,h,oo={})=>{const c={kind:'sprite',owner:{...env.ctx.owner},nm,x,y,w,h,o:oo};env.sprites.push(c);env.ctx.commands.push(c);return true;},along:(nm)=>{env.sprites.push({nm,owner:{...env.ctx.owner}});return true;}};
 env.__STORYWORLD_SLAYER_R_TORNADO_R366__={index:()=>({layers:{back:{file:'tornado-back.webp'},front:{file:'tornado-front.webp'}},frames:12,cell:[256,320],origin:[128,286],height_px:250,loop_s:.5})};
 env.r190=[];env.__STORYWORLD_BLOOD_R190__=Object.freeze({revision:'R190-test',play:(n,x,y,oo)=>{env.r190.push([n,x,y,oo?.k]);return {n};},set(){},inspect:()=>({})});
 env.delay=(s,fn)=>{env.delays=(env.delays||[]);env.delays.push([env.time+s,fn]);};
 env.hits=hits;env.foe=foe;env.foe2=foe2;
 vm.createContext(env);
 vm.runInContext(C('slayer-blood-r425.js'),env);
 if(has(FILE))vm.runInContext(C(FILE),env);
 env.idx=IDX;env.S=env.__STORYWORLD_SLAYER_SHEETS_R585__;
 if(env.S&&IDX)env.S.__setIndex?.(IDX);
 return env;}
const sheetDraws=(env,pred=()=>true)=>env.ctx.commands.filter(c=>c.kind==='image'&&c.owner?.r585&&c.op!=='lighter'&&pred(c));
const glossDraws=(env,pred=()=>true)=>env.ctx.commands.filter(c=>c.kind==='image'&&c.owner?.r585&&c.op==='lighter'&&pred(c));
const DT=1/60;
function frameOf(env,c){const s=IDX.sheets[c.owner.sheet];const col=Math.round(c.src[0]/s.cell),row=Math.round(c.src[1]/s.cell);return row*s.cols+col;}
function upright(c){const [p0,p1,p2,p3]=c.points;return Math.abs(p0[1]-p1[1])<1e-6&&p3[1]>p0[1]&&p1[0]>p0[0];}

(()=>{
 if(!has(FILE)||!IDX){ok('overlay loads in a fake world',false,'missing file or index');return;}
 // ---- R: 십자가 5개(큰 1 + 작은 4)를 시트로, 정방향, 0.55초에 타격 프레임 13 ----
 {const env=makeEnv();const S=env.S;ok('overlay loads, revision R585, exposes inspect/set/claims',S&&/^R585-/.test(S.revision||'')&&typeof S.inspect==='function'&&typeof S.set==='function'&&typeof S.claims==='function',S&&S.revision);
  env.fx('storySourceSkill',0,0,{storyWER:true,sourceHero:'slayer',sourceSlot:'r',stage:'warning',castId:11});
  let atHit=null,cross=0,uprightAll=true,procCross=0,widths=new Set();
  for(let i=0;i<70;i++){env.tick(DT);env.ctx.commands.length=0;env.sprites.length=0;env.drawHero();
   const ds=sheetDraws(env,c=>c.owner.sheet==='slayer-r-cross');cross=Math.max(cross,ds.length);for(const c of ds){if(!upright(c))uprightAll=false;widths.add(Math.round(c.points[1][0]-c.points[0][0]));}
   procCross+=env.sprites.filter(s=>s.nm==='cross').length;const age=env.time-5;if(atHit==null&&age>=.55&&ds.length)atHit=frameOf(env,ds[0]);}
  ok('R crosses: 5 sheet crosses (1 big + 4 small), no procedural cross sprite',cross===5&&procCross===0,{cross,procCross});
  ok('R crosses upright: no rotation, no vertical flip (rule: short top, long bottom)',uprightAll);
  ok('R crosses: two sizes (big ≈2× small)',widths.size>=2&&Math.max(...widths)>=Math.min(...widths)*1.8,[...widths]);
  ok('R cross timing: at the 0.55 s burst the sheet is on its hit frame 13 (±1)',atHit!=null&&Math.abs(atHit-13)<=1,atHit);
  // 피 폭발: R190 대신 큰·작은 폭발 시트
  const bigs=env.r190.filter(r=>r[0]==='blood-death').length,smalls=env.r190.filter(r=>r[0]==='blood-burst').length;
  env.ctx.commands.length=0;env.drawHero();const bursts=env.effects.filter(f=>f.type==='r585-sheet'&&/burst/.test(f.sheet));
  ok('R burst: big+small blood burst sheets replace R190 bursts (R190 not called when sheets ready)',bigs===0&&smalls===0&&bursts.filter(f=>f.sheet==='slayer-burst-big').length===1&&bursts.filter(f=>f.sheet==='slayer-burst-small').length===4,{bigs,smalls,bursts:bursts.map(f=>f.sheet)});
  ok('R burst damage unchanged (big ×2.6, small ×1.1 of 50)',env.hits.some(h=>h[1]===130&&h[2]==='r-burst'),env.hits);
  // 오라: 뒤층은 몸 앞서, 앞층은 몸 뒤에 — 불꽃·가시 코드 그림 없음
  env.time+=.5;env.ctx.commands.length=0;env.sprites.length=0;env.drawHero();const cmds=env.ctx.commands,hi=cmds.findIndex(c=>c.owner?.kind==='hero');
  const back=cmds.findIndex(c=>c.owner?.sheet==='slayer-r-aura-back'),front=cmds.findIndex(c=>c.owner?.sheet==='slayer-r-aura-front');
  ok('R aura: back sheet before the hero body, front sheet after',back>=0&&front>hi&&back<hi,{back,hi,front});
  ok('R aura: no procedural flame/spike sprites while sheets are drawn',!env.sprites.some(s=>s.nm==='flame'||s.nm==='spike'),env.sprites.map(s=>s.nm));
  // 오라 연쇄 폭발: 작은 폭발 시트
  const n0=env.effects.filter(f=>f.sheet==='slayer-burst-small').length;env.hitEnemy(env.foe,10,{kind:'basic'});
  ok('R aura chain burst uses the small burst sheet',env.effects.filter(f=>f.sheet==='slayer-burst-small').length===n0+1);
  ok('R: no errors',S.inspect().stats.errors===0,S.inspect().lastError);}
 // ---- Q: 시전 고리(뒤·앞) + 토네이도 시트, 출혈 시트. 피해는 R425 그대로 ----
 {const env=makeEnv();env.foe2.hp=0;const S=env.S;env.special();let order=true,ring=0,proc=0,tor=new Set(),bleedSheets=0;
  for(let i=0;i<20;i++){env.tick(DT);env.ctx.commands.length=0;env.sprites.length=0;env.drawHero();const c=env.ctx.commands,hi=c.findIndex(x=>x.owner?.kind==='hero');
   const b=c.findIndex(x=>x.owner?.sheet==='slayer-q-spin-back'),f=c.findIndex(x=>x.owner?.sheet==='slayer-q-spin-front');if(b>=0&&f>=0){ring++;if(!(b<hi&&f>hi))order=false;}proc+=env.sprites.filter(s=>s.nm==='spark'||s.nm==='petal').length;}
  ok('Q windup: spin ring back sheet before body, front after; no procedural spark/petal streaks',ring>=15&&order&&proc===0,{ring,order,proc});
  for(let i=0;i<60;i++){env.tick(DT);env.ctx.commands.length=0;env.sprites.length=0;for(const f of env.effects)env.ctx.scope({id:'fx',kind:'effect'},()=>env.drawEffect(f));for(const x of sheetDraws(env))tor.add(x.owner.sheet);}
  {const gl=new Set();for(let i=0;i<20;i++){env.tick(DT);env.ctx.commands.length=0;for(const f of env.effects)env.ctx.scope({id:'fx',kind:'effect'},()=>env.drawEffect(f));for(const x of glossDraws(env))gl.add(x.owner.sheet);}ok('readability: Q tornado sheets get the wet-sheen pass too; crosses stay single-pass',gl.has('slayer-q-tornado-back')&&!gl.has('slayer-r-cross'),[...gl]);}
  ok('Q whirlwind: tornado back+front sheets, no R366/procedural layers',tor.has('slayer-q-tornado-back')&&tor.has('slayer-q-tornado-front')&&!env.sprites.some(s=>['spark','petal','slashwide'].includes(s.nm)),[...tor]);
  for(let i=0;i<300;i++){env.tick(DT);}bleedSheets=env.effects.filter(f=>f.sheet==='slayer-bleed').length+(S.inspect().stats.spawn?.['slayer-bleed']||0);
  ok('Q bleed ticks show the bleed sheet (R190 splash not called)',bleedSheets>0&&!env.r190.some(r=>r[0]==='blood-splash'),{bleedSheets,r190:env.r190.length});
  ok('Q damage unchanged: pierce ×0.9 of attack×2.4 (=108) then 5 bleed ticks (=8.4)',JSON.stringify(env.hits.filter(h=>h[0]==='f1'))===JSON.stringify([['f1',108,'q-tornado'],...Array(5).fill(['f1',8.4,'q-bleed'])]),env.hits);
  ok('Q: no errors',S.inspect().stats.errors===0,S.inspect().lastError);}
 // ---- W 피의 희생·E 피의 대시: 원천 연출·코드 문양 대신 시트. 다른 영웅은 그대로 ----
 {const env=makeEnv();env.fxBase.length=0;for(const st of ['warning','release','end'])env.fx('storySourceSkill',0,0,{storyWER:true,sourceHero:'slayer',sourceSlot:'w',stage:st,castId:20});
  ok('W held (2026-11-10 headless: CX-0055 W sheet reads weaker than the old W and its cross looks like a small figure) → old W effect stays until Dots SL-07b; no W sheet, claims(w)=false',env.fxBase.length===3&&!env.effects.some(f=>f.sheet==='slayer-w-sacrifice')&&env.S.claims('w')===false,{fx:env.fxBase.length});
  env.fxBase.length=0;for(const st of ['warning','flight','end'])env.fx('storySourceSkill',0,0,{storyWER:true,sourceHero:'slayer',sourceSlot:'e',stage:st,castId:19,tx:3.8,ty:0});
  ok('E held too (2026-11-10 headless: thin dark trail unreadable during the dash) → old E stays until a Dots redraw; no E sheet, claims(e)=false',env.fxBase.length===3&&!env.effects.some(f=>f.sheet==='slayer-e-dash')&&env.S.claims('e')===false&&env.S.claims('r')===true,{fx:env.fxBase.length});}
 {const env=makeEnv({ls:{'storyworld.r585.w-sheet':'on','storyworld.r585.e-sheet':'on'}});const S=env.S;env.fxBase.length=0;
  for(const st of ['warning','release','end'])env.fx('storySourceSkill',0,0,{storyWER:true,sourceHero:'slayer',sourceSlot:'w',stage:st,castId:21});
  ok('W (opt-in storyworld.r585.w-sheet=on): slayer W cues do not reach the procedural layers (R209/d2s/r102) — swallowed',env.fxBase.length===0,env.fxBase);
  const w=env.effects.find(f=>f.type==='r585-sheet'&&f.sheet==='slayer-w-sacrifice');ok('W: blood sacrifice sheet spawned at the hero feet',!!w&&w.x===0&&w.y===0);
  env.ctx.commands.length=0;env.tick(.3);env.drawEffect(w);const wd=sheetDraws(env,c=>c.owner.sheet==='slayer-w-sacrifice');ok('W: drawn upright from the sheet',wd.length===1&&upright(wd[0]),wd.length);
  {const g=glossDraws(env,c=>c.owner.sheet==='slayer-w-sacrifice');ok('readability: dark W sheet gets one wet-sheen pass (lighter, alpha .3~.6, same place) so it reads on dark floors (headless 2026-11-10: W/Q sheets nearly invisible)',g.length===1&&g[0].alpha>=.3&&g[0].alpha<=.6&&JSON.stringify(g[0].points)===JSON.stringify(wd[0].points),g.map(c=>c.alpha));}
  env.fx('storySourceSkill',0,0,{storyWER:true,sourceHero:'slayer',sourceSlot:'w',stage:'hit',castId:21});ok('W/E hit sparks still pass to the engine (stage hit)',env.fxBase.some(r=>r[3]==='hit'));
  env.fxBase.length=0;env.fx('storySourceSkill',0,0,{storyWER:true,sourceHero:'slayer',sourceSlot:'e',stage:'warning',castId:22});env.fx('storySourceSkill',0,0,{storyWER:true,sourceHero:'slayer',sourceSlot:'e',stage:'flight',castId:22,tx:3.8,ty:0});
  const e=env.effects.find(f=>f.sheet==='slayer-e-dash');ok('E: dash trail sheet spawned along origin→end, cues swallowed',!!e&&e.tx===3.8&&env.fxBase.length===0,{e,fx:env.fxBase});
  env.ctx.commands.length=0;env.tick(.5);env.drawEffect(e);const ed=sheetDraws(env,c=>c.owner.sheet==='slayer-e-dash')[0];
  const len=ed?Math.hypot(ed.points[1][0]-ed.points[0][0],ed.points[1][1]-ed.points[0][1]):0;ok('E: trail stretched to the dash length on screen (3.8 tiles ≈ 122 px ±40%)',ed&&len>122*.6/0.9&&len<122*1.4/0.9,len);
  {env.fx('storySourceSkill',0,0,{storyWER:true,sourceHero:'slayer',sourceSlot:'e',stage:'flight',castId:29,tx:3.8,ty:0});const e3=env.effects.find(f=>f.castId===29);env.tick(.3);env.ctx.commands.length=0;env.drawEffect(e3);const d3=sheetDraws(env,c=>c.owner.sheet==='slayer-e-dash')[0],g3=glossDraws(env,c=>c.owner.sheet==='slayer-e-dash');
   ok('E readability (headless 2026-11-10: trail barely visible while the ~0.2s dash ran): by 0.3s the trail is at full length (frame ≥ 8) and has the wet-sheen pass',!!d3&&frameOf(env,d3)>=8&&g3.length===1,{f:d3&&frameOf(env,d3),g:g3.length});}
  env.fx('storySourceSkill',0,0,{storyWER:true,sourceHero:'slayer',sourceSlot:'e',stage:'flight',castId:23,tx:0,ty:3.8});env.ctx.commands.length=0;const e2=env.effects.find(f=>f.castId===23);env.tick(.2);env.drawEffect(e2);const ed2=sheetDraws(env,c=>c.owner.sheet==='slayer-e-dash')[0];
  ok('E: trail turned toward a different dash direction',ed2&&Math.abs((ed2.points[1][1]-ed2.points[0][1]))>5,ed2?.points);
  env.player.hero='hwando';env.fxBase.length=0;env.fx('storySourceSkill',0,0,{storyWER:true,sourceHero:'hwando',sourceSlot:'w',stage:'release',castId:24});ok('other heroes unchanged (hwando W passes through)',env.fxBase.length===1);
  ok('W/E: no errors',S.inspect().stats.errors===0,S.inspect().lastError);}
 // ---- D 공명방어: R269 코드 문양 대신 막 시트 / F EGO: 진입 시트 + 지속 루프(몸 뒤) ----
 {const env=makeEnv();const S=env.S;env.player.guard=true;const SENT={type:'r269-guard',x:0,y:0,age:0,life:Infinity};env.baseDrawn.length=0;env.ctx.commands.length=0;env.drawEffect(SENT);
  ok('D guard: slayer guard drawn from the shell sheet, R269 procedural rim skipped',sheetDraws(env,c=>c.owner.sheet==='slayer-d-guard').length===1&&!env.baseDrawn.includes('r269-guard'),env.baseDrawn);
  env.player.hero='hunter';env.baseDrawn.length=0;env.drawEffect(SENT);ok('D guard: other heroes keep R269',env.baseDrawn.includes('r269-guard'));env.player.hero='slayer';
  env.ego();const en=env.effects.find(f=>f.sheet==='slayer-ego-enter');ok('F EGO: entering spawns the enter sheet',!!en);
  env.ctx.commands.length=0;env.tick(.4);env.drawHero();const c=env.ctx.commands,hi=c.findIndex(x=>x.owner?.kind==='hero'),lp=c.findIndex(x=>x.owner?.sheet==='slayer-ego-loop');
  ok('F EGO: loop sheet behind the body while EGO is active',lp>=0&&lp<hi,{lp,hi});
  let fr=[];for(let i=0;i<60;i++){env.tick(.1);env.ctx.commands.length=0;env.drawHero();const d=sheetDraws(env,x=>x.owner.sheet==='slayer-ego-loop')[0];if(d)fr.push(frameOf(env,d));}
  const jumps=fr.slice(1).map((v,i)=>Math.abs(v-fr[i]));ok('F EGO loop plays ping-pong (no 23→0 jump)',fr.length>40&&Math.max(...jumps)<=2,{fr:fr.join(',')});
  ok('D/F: no errors',S.inspect().stats.errors===0,S.inspect().lastError);}
 // ---- 시트가 아직 없으면 예전 그림 그대로, 끄기 스위치, 다른 영웅은 시트를 받지 않음, 렉 상한 ----
 {const env=makeEnv({ready:false});env.fx('storySourceSkill',0,0,{storyWER:true,sourceHero:'slayer',sourceSlot:'r',stage:'warning',castId:31});
  for(let i=0;i<40;i++){env.tick(DT);env.ctx.commands.length=0;env.sprites.length=0;env.drawHero();}
  ok('fallback: sheets not loaded → R425 procedural cross + R190 bursts as before, sheets requested',env.r190.some(r=>r[0]==='blood-death')&&env.requested.some(p=>/assets\/r585\/slayer-r-cross\.webp/.test(p)),{r190:env.r190.length,req:env.requested.length});
  env.fxBase.length=0;env.fx('storySourceSkill',0,0,{storyWER:true,sourceHero:'slayer',sourceSlot:'w',stage:'warning',castId:32});ok('fallback: W cue passes through when sheets are not ready',env.fxBase.length===1);}
 {const env=makeEnv({ready:false});const n=()=>env.requested.filter(p=>/slayer-r-cross/.test(p)).length;env.tick(DT);const a=n();for(let i=0;i<20;i++)env.tick(DT);const b=n();for(let i=0;i<60;i++)env.tick(.05);const c=n();env.ready=true;for(let i=0;i<80;i++)env.tick(.05);const d=n();
  ok('reload: the engine image cache was dropped (new game / region load) → sheets are asked for again after 2s of game time, not every tick, and no more once ready',a===1&&b===1&&c===2&&d===2,{a,b,c,d});}
 {const env=makeEnv({hero:'hwando'});env.tick(DT);env.drawHero();ok('lazy: sheets are requested only while the hero is the slayer',!env.requested.some(p=>/r585/.test(p)),env.requested);}
 {const env=makeEnv();env.S.set(false);env.fxBase.length=0;env.fx('storySourceSkill',0,0,{storyWER:true,sourceHero:'slayer',sourceSlot:'w',stage:'warning',castId:41});env.fx('storySourceSkill',0,0,{storyWER:true,sourceHero:'slayer',sourceSlot:'r',stage:'warning',castId:42});
  for(let i=0;i<40;i++){env.tick(DT);env.ctx.commands.length=0;env.sprites.length=0;env.drawHero();}
  ok('off switch: everything back to R425/R209 originals',env.fxBase.length===1&&env.sprites.some(s=>s.nm==='cross')&&sheetDraws(env).length===0&&env.S.claims('w')===false,{fx:env.fxBase.length});}
 for(const lowFx of [false,true]){const env=makeEnv({lowFx});const S=env.S;env.fx('storySourceSkill',0,0,{storyWER:true,sourceHero:'slayer',sourceSlot:'r',stage:'warning',castId:51});for(let i=0;i<50;i++)env.tick(DT);
  for(let i=0;i<200;i++){env.foe.hp=5000;env.time+=.3;env.hitEnemy(env.foe,1,{kind:'basic'});}
  const n=env.effects.filter(f=>f.type==='r585-sheet').length,cap=lowFx?8:20;ok(`lag guard (${lowFx?'lowFx':'full'}): live sheet effects capped at ${cap}`,n<=cap&&n>0,n);}
 ok('gameplay untouched: overlay writes no damage, cooldowns or saves',!/hitEnemy\(|specialCD\s*=|attackCD\s*=|\.hp\s*[-+]?=|serializeSave|localStorage\.setItem\((?!KEY)/.test(C(FILE)));
 ok('no forbidden canvas filters (drop-shadow/blur break the Three recorder)',!/drop-shadow|blur\(/.test(C(FILE)));
})();
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(JSON.stringify({ok:pass===checks.length,checks:checks.length,pass,method:'CPU fake globals and a fake command recorder; headless screenshots separately; no GPU or device'}));
if(pass!==checks.length)process.exit(1);
