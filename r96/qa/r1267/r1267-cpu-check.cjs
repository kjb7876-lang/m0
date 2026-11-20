// R1267 CPU 검사: 미카엘라 이펙트 밝기 기울기 제한(광과민 — 1초에 3번 넘는 번쩍임 금지) + 제네시스 고급화(시트만).
//  정상 경로·경계값·회귀를 함께 본다. 브라우저 화면 측정은 qa/r1267/flicker-probe.mjs (헤드리스 소프트웨어 렌더, GPU 미검증).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c,info)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n,info===undefined?'':JSON.stringify(info).slice(0,400));}};
const F='michaela-flashguard-r1267.js';const exists=fs.existsSync(path.join(R,'client-source',F));ok(F+' exists',exists);
if(!exists){console.log(JSON.stringify({pass,fail}));process.exit(1);}
const src=C(F);
ok('runtime copy matches source',fs.existsSync(path.join(R,'runtime-text',F))&&src===RT(F));
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
const html=RT('index.html');
ok('script tag once',html.split('"./'+F+'"').length===2);
ok('own line right after michaela-hitfx-r1235 (hooks render/tick/drawEffect lazily, order-free)',html.includes('<script src="./michaela-hitfx-r1235.js"></script>\n<script src="./'+F+'"></script>\n'));
ok('listed in verify-r96-public.py',new RegExp("'"+F.replace(/\./g,'\\.')+"'").test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
ok('CI runs this check',/qa\/r1267\/r1267-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
ok('no new key bindings / no save writes / no hp writes',!/addEventListener\(\s*['"]key/.test(src)&&!/saveGame/.test(src)&&!/player\.hp\s*=[^=]/.test(src));
ok('no ctx.filter blur/drop-shadow, no code-drawn shapes (arc/ellipse/lineTo/fillRect)',!/drop-shadow|blur\(/.test(src)&&!/\.(arc|ellipse|lineTo|fillRect|strokeRect)\(/.test(src));
ok('no cross sprite / rotate (upright-cross rule)',!/'cross'|"cross"|\.rotate\(/.test(src));
ok('Mammon zones not touched',!/ep1b06|mammon/i.test(src));
const RING='assets/r1041/fx-c4-ground-ring.webp';
ok('genesis ring sheet shipped',fs.existsSync(path.join(R,'runtime-text',RING)));

function env(hero='michaela',store={}){const g={localStorage:{_s:{...store},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,Math,Date,Number,String,Array,Map,Set,WeakSet,Object,JSON,Infinity,NaN,isFinite};g.window=g;vm.createContext(g);
 vm.runInContext(`var time=0,started=true,zoom=1;var player={hero:${JSON.stringify(hero)},x:10,y:10,hp:100};var room={id:'z1'};var effects=[];
 var drawn=[],scopes=[];var IMG_ON=true;function readyImage(p){return IMG_ON?{image:{src:p}}:null;}function addImage(){}
 function project(x,y){return{x:(x-y)*34+480,y:(x+y)*17};}function actorHeight(){return 66;}
 var ctx={globalAlpha:1,globalCompositeOperation:'source-over',save(){this._s=[this.globalAlpha,this.globalCompositeOperation];},restore(){[this.globalAlpha,this.globalCompositeOperation]=this._s;},
  drawImage(im,sx,sy,sw,sh,dx,dy,dw,dh){drawn.push({src:im.src,sx,sy,sw,sh,dx,dy,dw,dh,a:this.globalAlpha,op:this.globalCompositeOperation,scope:this._scope});},scope(o,f){scopes.push(o);const p=this._scope;this._scope=o;try{f();}finally{this._scope=p;}}};
 function tick(){}function drawEffect(e){if(window.__fd)window.__fd(e);}
 var G563={rCasts:0};window.__STORYWORLD_MICHAELA_GENESIS_R563__={inspect:()=>({stats:{rCasts:G563.rCasts}})};
 var renders=[];window.StoryPhase1={ThreeRenderer:function(){}};window.StoryPhase1.ThreeRenderer.prototype.render=function(frame){renders.push(frame.commands.map(c=>c.style.globalAlpha));};`,g);
 vm.runInContext(src,g);return g;}
const API=g=>g.__STORYWORLD_FLASH_GUARD_R1267__;
const W=960,H=540,VA=W*H;
// 화면 넓이 비 a 를 덮는 정사각 명령
function cmd(id,frac,alpha=1,op='lighter',kind='image'){const s=Math.sqrt(frac*VA);const P=[[100,100],[100+s,100],[100+s,100+s],[100,100+s]];return {kind,owner:{id,kind:'effect'},points:kind==='image'?P:undefined,paths:kind==='fill'?[{points:P}]:undefined,style:{globalAlpha:alpha,globalCompositeOperation:op}};}
// 프레임 하나를 기록기→렌더로: time 을 올리고 render(frame) 를 부른다(엔진처럼). 돌려준 값 = 렌더가 받은 알파.
function frame(g,cmds,dt=1/60,dpr=1,vp=true){g.time=+(g.time+dt).toFixed(6);vm.runInContext('time='+g.time+';tick()',g);const fr={commands:cmds};if(vp)fr.viewport={width:W,height:H,dpr};const r=new g.StoryPhase1.ThreeRenderer();r.renderer={domElement:{width:W*dpr,height:H*dpr}};g.devicePixelRatio=dpr;r.render(fr);return cmds.map(c=>c.style.globalAlpha);}
const energy=(cmds)=>cmds.reduce((s,c)=>{const P=c.points||c.paths[0].points;const a=(P[1][0]-P[0][0])*(P[2][1]-P[1][1])/VA;return s+a*c.style.globalAlpha*(/lighter|screen/.test(c.style.globalCompositeOperation)?1:.5);},0);
let g=env();ok('API exposed',!!API(g)&&typeof API(g).inspect==='function');
// 1) 큰 이펙트가 툭 켜짐(화면 30%, 알파 1, 덧셈) → 첫 프레임 밝기는 기울기 한도 안, 0.5초 안에 다 차오름
{g=env();const seq=[];for(let i=0;i<40;i++){const c=[cmd('r563:pillar:1.000:3.0:sheet',.3,1)];frame(g,c);seq.push(energy(c));}
 const T1=API(g).tuning,raw=.3*.35;const first=seq[0],lim=raw/60/T1.OWN_RAMP*1.001+1e-9;
 ok('pop: first frame energy ≤ per-effect slew limit',first<=lim,{first,lim});
 ok('pop: never rises faster than limit per frame',seq.every((v,i)=>i===0||v-seq[i-1]<=lim+1e-9),seq.slice(0,6));
 const target=.3*.35;/* R563 기둥 시트는 제네시스 조율 ×.35 */ok('pop: reaches ≥95% of (tuned) target within 0.5 s',seq[29]>=target*.95,{at30:seq[29],target});
 ok('pop: per-frame luminance step < WCAG .1 (energy step ≤ .02 view)',seq.every((v,i)=>i===0?v<=.02:Math.abs(v-seq[i-1])<=.02));}
// 2) 10Hz 깜빡임(3프레임 켜짐·3프레임 꺼짐, 화면 25%) → 출력에서 .1 넘게 오르는 횟수 1초당 3 이하
{g=env();const seq=[];for(let i=0;i<120;i++){const on=Math.floor(i/3)%2===0;const c=on?[cmd('r948:tower:2.00',.25,1)]:[];frame(g,c);seq.push(energy(c));}
 let rises=0;for(let i=1;i<seq.length;i++)if(seq[i]-seq[i-1]>=.1)rises++;ok('strobe 10 Hz: output rises ≥.1 view at most 3 per second (2 s → ≤6)',rises<=6,{rises,max:Math.max(...seq)});
 {let sw=0;for(let i=1;i<seq.length;i++)sw=Math.max(sw,Math.abs(seq[i]-seq[i-1]));ok('strobe 10 Hz: frame-to-frame swing ≤ .05 view (on/off smoothed into a glow)',sw<=.05,{sw,max:Math.max(...seq),seq:seq.map(v=>+v.toFixed(3)).join(' ')});}}
// 3) 여섯 기술이 같은 프레임에 겹침 → 전체 첫 프레임 오름 ≤ 전체 한도
{g=env();const ids=['r563:sky:1.00','r948:volley:1.00','r106d2s:5','r101:9','r102:4','r247-x'];const c=ids.map(id=>cmd(id,.12,1));frame(g,c);const T1=API(g).tuning;
 ok('stack: all-effects first-frame energy ≤ ALL_FLOOR + raw·dt/ALL_RAMP (≤ 1/10 of raw)',energy(c)<=T1.ALL_FLOOR+(.12*5+.12*.85)/60/T1.ALL_RAMP*1.001&&energy(c)<=.072,energy(c));}
// 4) 오래 켜져 있어도 덧셈 합성 합은 ALL_CAP 이하(하얗게 타지 않음)
{g=env();let c;for(let i=0;i<240;i++){c=['r106d2s:1','r106d2s:2','r106d2s:3','r948:bloom:1','r948:bloom:cloud:1'].map(id=>cmd(id,.5,1));frame(g,c);}
 ok('cap: steady additive total ≤ ALL_CAP',energy(c)<=API(g).tuning.ALL_CAP+1e-9,energy(c));ok('cap: steady effects still clearly visible (≥ .6 of cap)',energy(c)>=API(g).tuning.ALL_CAP*.6,energy(c));}
// 5) 작은 적중 불꽃(화면 .5%)은 첫 프레임부터 그대로(반응 늦추지 않음)
{g=env();const c=[cmd('r101:77',.005,1)];frame(g,c);ok('small hit spark not delayed (alpha 1 on first frame)',c[0].style.globalAlpha===1);}
// 6) 대상 아님: 기본탄 하트(R1232/R912), 후광 aura, 다른 그림, 다른 영웅, 끔
{g=env();const c=[cmd('r1232:shot:1',.3),cmd('r912:pj03:1',.3),cmd('r101:aura-front:hero',.3),cmd('hero',.3,1,'source-over'),cmd('r160:laser:1:0',.3)];frame(g,c);
 ok('basic heart shot, aura, body, other owners untouched',c.every(x=>x.style.globalAlpha===1));}
{g=env('neon');const c=[cmd('r106d2s:1',.4)];frame(g,c);ok('other hero → untouched',c[0].style.globalAlpha===1);}
// 6b) R160 기본공격 적중 섬광(모든 적중마다 flare·5타 폭발): 미카엘라는 여러 적을 한 번에 맞혀 몹 무리 위가 함께 번쩍인다 → 같은 기울기 제한. 다른 영웅은 그대로.
{g=env();for(let i=0;i<3;i++)frame(g,[]);const c=[cmd('r160:12',.08)];frame(g,c);ok('R160 combo burst flare (michaela) ramps in (alpha ≤ .3 first frame)',c[0].style.globalAlpha<=.3,c[0].style.globalAlpha);
 g=env('hunter');const d=[cmd('r160:12',.08)];frame(g,d);ok('R160 for other hero untouched',d[0].style.globalAlpha===1);}
{g=env('michaela',{'storyworld.r1267.flashGuard':'off','storyworld.r1267.genesis':'off'});const c=[cmd('r563:pillar:1:2:sheet',.4)];frame(g,c);ok('switches off → untouched',c[0].style.globalAlpha===1);}
{g=env('michaela',{'storyworld.r1267.flashGuard':'off'});const c=[cmd('r563:pillar:1:2:sheet',.4),cmd('r948:tower:1',.4)];frame(g,c);ok('guard off, genesis on → only genesis tuning (.35), heart untouched',Math.abs(c[0].style.globalAlpha-.35)<1e-9&&c[1].style.globalAlpha===1);}
// 7) 경계값: 넓이 0·NaN 좌표·알파 0·NaN 알파·빈 프레임·같은 프레임 두 번 렌더
{g=env();const bad=cmd('r106d2s:9',.2);bad.points[1]=[NaN,NaN];const z=cmd('r106d2s:8',0);const a0=cmd('r106d2s:7',.3,0);const an=cmd('r106d2s:6',.3,NaN);const c=[bad,z,a0,an];
 let threw=false;try{frame(g,c);frame(g,[]);}catch(e){threw=true;}ok('edge: no throw, finite alphas (NaN alpha left alone)',!threw&&[bad,z,a0].every(x=>Number.isFinite(x.style.globalAlpha)),c.map(x=>x.style.globalAlpha));
 const one=[cmd('r563:pillar:9:9:beam',.2,1)];/* 같은 프레임 두 번 */g.time+=1/60;const r=new g.StoryPhase1.ThreeRenderer();r.renderer={domElement:{width:W,height:H}};const fr={commands:one};r.render(fr);const a1=one[0].style.globalAlpha;r.render(fr);
 ok('edge: rendering the same frame twice applies once',one[0].style.globalAlpha===a1);}
// 8) 지역 이동(시간 되감기·큰 점프) 뒤 기록 초기화 → 다시 천천히 차오름(갑자기 밝게 남지 않음)
{g=env();for(let i=0;i<60;i++)frame(g,[cmd('r106d2s:1',.3)]);const c=[cmd('r106d2s:1',.3)];frame(g,c,5);ok('time jump resets history (re-ramps)',energy(c)<=.3/60/.2*1.01,energy(c));}
// 9) 제네시스: 하늘 기둥 층 조율 + 성역 고리 시트
{g=env();ok('tune: R563 pillar sheet ×.35, M7 beam ×.75, sky ×.85, others ×1',API(g).tune('r563:pillar:1:2:sheet')===.35&&API(g).tune('r563:pillar:1:2:beam')===.75&&API(g).tune('r563:sky:1.00')===.85&&API(g).tune('r948:tower:1')===1);
 vm.runInContext('G563.rCasts=1',g);frame(g,[]);/* 처음 본 값은 기준만 */vm.runInContext('G563.rCasts=2',g);frame(g,[]);
 const drawRun=()=>{vm.runInContext('drawn.length=0;for(const e of effects.slice())drawEffect(e)',g);return vm.runInContext('drawn.slice()',g);};
 ok('ring: no ring before 0.2 s',drawRun().length===0);
 let maxA=0,first=null,frames=0,lastA=0,maxStep=0;for(let i=0;i<140;i++){frame(g,[]);const d=drawRun();if(d.length){frames++;const a=d[0].a;if(first==null)first=a;maxStep=Math.max(maxStep,Math.abs(a-lastA));lastA=a;maxA=Math.max(maxA,a);}else if(lastA>0){maxStep=Math.max(maxStep,lastA);lastA=0;}}
 const d0=(()=>{g.time=0;return null;})();
 ok('ring: drawn from C4 sheet cells (256×128, 8 frames) on the ground scope',frames>60&&API(g).inspect().stats.genesisRings===1);
 ok('ring: fades in from ~0 and out to ~0, no step > .05 per frame',first!=null&&first<.05&&maxStep<=.05,{first,maxStep,maxA});
 ok('ring: gone after ~2.1 s (sentinel removed)',vm.runInContext('effects.filter(e=>e.r1267Sentinel).length',g)===0);}
{g=env();vm.runInContext('G563.rCasts=1',g);frame(g,[]);vm.runInContext('G563.rCasts=2',g);let d=[];for(let i=0;i<40;i++){frame(g,[]);vm.runInContext('for(const e of effects.slice())drawEffect(e)',g);}d=vm.runInContext('drawn',g);
 ok('ring: sheet path + lighter + groundAligned scope + cell aligned',d.length>0&&d.every(x=>x.src==='assets/r1041/fx-c4-ground-ring.webp'&&x.op==='lighter'&&x.scope&&x.scope.groundAligned===true&&x.sw===256&&x.sh===128&&x.sx%256===0&&x.sx<2048&&[x.dx,x.dy,x.dw,x.dh].every(Number.isFinite)));}
{g=env('neon');vm.runInContext('G563.rCasts=1',g);frame(g,[]);vm.runInContext('G563.rCasts=2',g);for(let i=0;i<40;i++)frame(g,[]);ok('ring: other hero → none',API(g).inspect().stats.genesisRings===0);}
{g=env();vm.runInContext('G563.rCasts=1',g);frame(g,[]);vm.runInContext('G563.rCasts=2',g);frame(g,[]);vm.runInContext("room={id:'z2'}",g);frame(g,[]);ok('ring: room change clears',API(g).inspect().rings===0);}
{g=env();vm.runInContext('IMG_ON=false',g);vm.runInContext('G563.rCasts=1',g);frame(g,[]);vm.runInContext('G563.rCasts=2',g);for(let i=0;i<40;i++){frame(g,[]);vm.runInContext('for(const e of effects.slice())drawEffect(e)',g);}
 ok('ring: sheet not loaded yet → nothing drawn (no code fallback shape)',vm.runInContext('drawn.length',g)===0);}
// 9b) M7 빛기둥이 하늘 끝까지 늘어난 하얀 벽 → 영웅 키 4.2배·1:2 비율, 발 자리 그대로. 다른 시트·작은 기둥은 그대로
{g=env();const tall={kind:'image',owner:{id:'r563:pillar:1.000:3.0:beam'},sourcePath:'assets/r1041/fx-m7-michaela-sky-pillar.webp',points:[[200,-600],[700,-600],[700,400],[200,400]],style:{globalAlpha:1,globalCompositeOperation:'lighter'}};
 const small={kind:'image',owner:{id:'r563:pillar:2.000:3.0:beam'},sourcePath:'assets/r1041/fx-m7-michaela-sky-pillar.webp',points:[[400,200],[450,200],[450,300],[400,300]],style:{globalAlpha:1,globalCompositeOperation:'lighter'}};
 const other={kind:'image',owner:{id:'r563:pillar:1.000:3.0:sheet'},sourcePath:'assets/r563/dots/michaela-pillar.webp',points:[[200,-600],[700,-600],[700,400],[200,400]],style:{globalAlpha:1,globalCompositeOperation:'lighter'}};
 frame(g,[tall,small,other]);const P=tall.points,h=P[3][1]-P[0][1],w=P[1][0]-P[0][0];
 ok('beam reshape: height = 4.2×actor (277), width = height/2, foot (450,400) kept',Math.abs(h-66*4.2)<1e-6&&Math.abs(w-h/2)<1e-6&&Math.abs((P[2][0]+P[3][0])/2-450)<1e-6&&P[2][1]===400,P);
 ok('beam reshape: short beam and other sheets keep their quads',small.points[0][1]===200&&small.points[1][0]===450&&other.points[0][1]===-600);}
// 9c) 같은 상자에서 시트 칸만 번쩍이는 칸으로 바뀜(칸 0: 덮음 .1 → 칸 1: 덮음 .9) → 칸 밝기를 재서 오름을 잡는다
{g=env();vm.runInContext(`var document={createElement(){let rx=0;return{width:12,height:12,getContext(){return{clearRect(){},drawImage(im,sx){rx=sx;},getImageData(){const v=rx>=256?230:26;const d=new Uint8ClampedArray(12*12*4);for(let i=0;i<d.length;i+=4){d[i]=v;d[i+1]=v;d[i+2]=v;d[i+3]=255;}return{data:d};}};}};}};`,g);
 const mk=(fr)=>({kind:'image',owner:{id:'r948:tower:boom:1.00:3:4'},image:{src:'x'},sourcePath:'assets/r948/heart-burst16.webp',sourceRect:[fr*256,0,256,256],points:[[100,100],[300,100],[300,300],[100,300]],style:{globalAlpha:1,globalCompositeOperation:'lighter'}});
 for(let i=0;i<40;i++)frame(g,[mk(0)]);const c=[mk(1)];frame(g,c);
 {const c0=26/255,c1=230/255,step=c[0].style.globalAlpha*c1-c0;ok('flash cell in the same box: 9× brighter cell held to one ramp step (alpha ≤ (c0+c1/12)/c1, luminance step < .1)',c[0].style.globalAlpha<=(c0+c1/12)/c1+.01&&step<.1,{a:c[0].style.globalAlpha,step});}
 const seq=[];for(let i=0;i<30;i++){const d=[mk(1)];frame(g,d);seq.push(d[0].style.globalAlpha);}ok('flash cell: then ramps up to full within .5 s',seq[29]>.99,seq.slice(-3));}
// 9d) 큰 이펙트가 통째로 사라짐 → .18초 동안 옅어지는 잔광(마지막 모습 그대로), 작은 것은 잔광 없음
{g=env();for(let i=0;i<40;i++)frame(g,[cmd('r948:bloom:2.00',.2,1),cmd('r101:5',.003,1)]);const fr=[];for(let i=0;i<16;i++){const c=[];frame(g,c);fr.push(c.filter(x=>/r1267g$/.test(x.key||'')).map(x=>[x.owner.id,x.style.globalAlpha]));}
 const big=fr.map(f=>f.filter(x=>x[0]==='r948:bloom:2.00').map(x=>x[1])[0]||0);
 ok('fade-out: vanished big effect leaves a ghost that decays each frame and is gone by .2 s',big[0]>.85&&big.every((v,i)=>i===0||v<=big[i-1]+1e-9)&&big[11]===0&&big.slice(0,8).every((v,i)=>i===0||big[i-1]-v<.1),big.map(v=>+v.toFixed(2)));
 ok('fade-out: small spark leaves no ghost',fr.every(f=>!f.some(x=>x[0]==='r101:5')));}
// 9e) 한 이펙트(같은 owner) 안에서 하트 하나는 계속, 다른 하나가 먼 자리에서 툭 터짐 → 화면 칸 제한으로 새 하트는 차오름
{g=env();const at=(x,y,s)=>({kind:'image',owner:{id:'r948:tower:3.00'},points:[[x,y],[x+s,y],[x+s,y+s],[x,y+s]],style:{globalAlpha:1,globalCompositeOperation:'lighter'}});
 for(let i=0;i<60;i++)frame(g,[at(100,100,200),at(100,100,10)]);const c=[at(100,100,200),at(700,380,90)];frame(g,c);
 ok('tile: new heart burst inside a steady effect starts dim (alpha ≤ .2), steady one unchanged (≥ .95)',c[1].style.globalAlpha<=.2&&c[0].style.globalAlpha>=.95,c.map(x=>x.style.globalAlpha));}
// 11) 몹 적중 번쩍임: 1/60 초마다 엔진처럼 맞으면 flash=.12, 매 틱 감소. 몹마다 꺼짐→켜짐이 0.4초에 한 번 이하.
function hitRun(store,hitEvery){const g=env('michaela',store);vm.runInContext('room.enemies=[{hp:100,flash:0},{hp:100,flash:0}];',g);let starts=0,prev=0,on=0;
 for(let i=0;i<120;i++){g.time=+(g.time+1/60).toFixed(6);vm.runInContext(`time=${g.time};for(const e of room.enemies)e.flash=Math.max(0,e.flash-1/60);if(${i}%${hitEvery}===0)for(const e of room.enemies)e.flash=.12;tick();`,g);
  const f=vm.runInContext('room.enemies[0].flash',g);if(f>0&&prev<=0)starts++;if(f>0)on++;prev=f;}return{g,starts,on};}
{const r=hitRun({},10);ok('hit flash: 6 Hz hits → body flashes ≤ 3 per second (2 s → ≤6 starts)',r.starts<=6&&r.starts>=4,r);
 ok('hit flash: still visible feedback (flash on ≥ 25% of frames)',r.on>=30,r);ok('hit flash: errors 0',API(r.g).inspect().stats.errors===0);}
{const r=hitRun({},45);ok('hit flash: slow hits (1.3 Hz) never cut',API(r.g).inspect().stats.hitFlashCut===0&&r.starts===3,r.starts);}
{const r=hitRun({'storyworld.r1267.hitFlash':'off'},10);ok('hit flash: switch off → engine flashes untouched (12 starts)',r.starts===12,r.starts);}
{const g=env();vm.runInContext('room.enemies=[null,{flash:NaN},{flash:Infinity},5];',g);frame(g,[]);ok('hit flash: odd enemy entries do not throw',API(g).inspect().stats.errors===0,API(g).inspect().stats.lastError);}
// 12) R247 Z·X 는 scope 없이 그린다(owner 'scene') → 그 그림만 같은 kind 의 owner id 'r247:fx' 로 씌워 기울기 제한을 받는다. 다른 scene 명령은 그대로.
{g=env();vm.runInContext(`ctx.owner={id:'scene',kind:'scene'};ctx.scope=function(o,f){const p=this.owner;this.owner=o;try{return f();}finally{this.owner=p;}};
 window.__fd=e=>{if(e.type==='r247-fx')window.__seen={...ctx.owner};};`,g);vm.runInContext('drawEffect({type:"r247-fx"});',g);const o=vm.runInContext('window.__seen',g);
 ok('R247 untagged Z/X draw → owner id r247:fx, kind kept (scene)',o&&o.id==='r247:fx'&&o.kind==='scene',o);ok('R247: owner restored after draw',vm.runInContext('ctx.owner.id',g)==='scene');
 // 실제 순서: michaela-r247 는 이 오버레이 뒤에 실려 drawEffect 바깥을 감싸고 제 효과는 안쪽을 부르지 않는다 → 다음 틱에 다시 바깥을 감싸야 한다.
 g=env();vm.runInContext(`ctx.owner={id:'scene',kind:'scene'};ctx.scope=function(o,f){const p=this.owner;this.owner=o;try{return f();}finally{this.owner=p;}};window.__seen=null;
  {const b=drawEffect;drawEffect=function(e,...a){if(e&&e.type==='r247-fx'){window.__seen={...ctx.owner};return;}return b.apply(this,[e,...a]);};}`,g);frame(g,[]);vm.runInContext('drawEffect({type:"r247-fx"});',g);
 ok('R247 loaded later (outer wrapper) → re-wrapped outside on next tick, owner r247:fx',vm.runInContext('window.__seen&&window.__seen.id',g)==='r247:fx');
 vm.runInContext('window.__depth=0;{const b=drawEffect;}',g);for(let i=0;i<10;i++)frame(g,[]);const f1=vm.runInContext('drawEffect',g);frame(g,[]);ok('re-wrap stops once outermost (same function next tick)',vm.runInContext('drawEffect',g)===f1&&API(g).inspect().stats.errors===0);
 g=env();for(let i=0;i<3;i++)frame(g,[]);const c=[cmd('r247:fx',.12)];c[0].owner.kind='scene';frame(g,c);ok('R247 r247:fx commands ramp in (alpha ≤ .3)',c[0].style.globalAlpha<=.3,c[0].style.globalAlpha);}
// 13) 칸별 섬광 예산: 한 칸에서 5Hz 로 켜졌다 꺼지는 이펙트(화면 1%) → 그 칸 밝기의 '오름 FL_D→내림 FL_D' 섬광이 어느 1초에도 3번 이하, 툭 끊김 없음
{g=env();const seq=[];for(let i=0;i<180;i++){const on=Math.floor(i/6)%2===0;const c=on?[cmd('r1235:hit:'+Math.floor(i/12),.01,1)]:[];frame(g,c);seq.push(energy(c));}
 const D=.0015,fl=[];let st=0,ref=seq[0];for(let i=1;i<seq.length;i++){const v=seq[i];if(st!==1){if(v-ref>=D){st=1;ref=v;}else if(v<ref)ref=v;}else if(v>ref)ref=v;else if(ref-v>=D){fl.push(i/60);st=-1;ref=v;}}
 let worst=0;for(const a of fl)worst=Math.max(worst,fl.filter(b=>b>=a&&b<a+1).length);
 ok('tile budget: 5 Hz pulsing effect → ≤ 3 flashes in any 1 s (WCAG 2.3.1)',worst<=3,{worst,n:fl.length});
 let sw=0;for(let i=1;i<seq.length;i++)sw=Math.max(sw,seq[i-1]-seq[i]);ok('tile budget: no hard cut when held (frame drop ≤ .004)',sw<=.004,sw);
 ok('tile budget: effect still visible at times (peak ≥ .004)',Math.max(...seq)>=.004,Math.max(...seq));}
// 14) DPR(R1267b, PR #928 리뷰): 명령 좌표는 논리 픽셀 → DPR 1·1.5·2·3, viewport 없을 때(캔버스÷DPR)도 같은 효과의 첫 알파·칸이 같아야 한다.
{const first=(dpr,vp)=>{const g=env();for(let i=0;i<3;i++)frame(g,[],1/60,dpr,vp);const c=[cmd('r106d2s:7',.05),cmd('r1235:hit:1',.01)];frame(g,c,1/60,dpr,vp);return c.map(x=>+x.style.globalAlpha.toFixed(6));};
 const base=first(1,true);const rows=[[1.5,true],[2,true],[3,true],[1.5,false],[2,false]].map(([d,v])=>({d,v,a:first(d,v)}));
 ok('DPR 1/1.5/2/3 (+ no viewport): same first alpha for the same effect',rows.every(r=>r.a.every((x,i)=>Math.abs(x-base[i])<1e-9)),{base,rows});
 ok('DPR: big effect still ramps at DPR 1.5 (first alpha < .3)',rows[0].a[0]<.3,rows[0].a);}
{const g=env();vm.runInContext('function actorHeight(){return 66;}',g);g.devicePixelRatio=2;const P=[[0,-600],[300,-600],[300,0],[0,0]];const c={kind:'image',owner:{id:'r563:pillar:1:1:beam'},sourcePath:'assets/r1041/fx-m7-michaela-sky-pillar.webp',points:P.map(q=>[q[0]+100,q[1]+500]),style:{globalAlpha:1,globalCompositeOperation:'lighter'}};
 frame(g,[c],1/60,2);const h=c.points[3][1]-c.points[0][1];ok('DPR 2: beam height = actor 66 × 4.2 in logical px (not × DPR)',Math.abs(h-66*4.2)<1e-6,h);}
// 10) 성능: 400 명령 프레임 240번
{g=env();const t0=process.hrtime.bigint();for(let i=0;i<240;i++){const c=[];for(let k=0;k<400;k++)c.push(cmd((k%3?'r106d2s:':'scene:')+(k%40),.002));frame(g,c);}const ms=Number(process.hrtime.bigint()-t0)/1e6;console.log('  240 frames × 400 cmds: '+ms.toFixed(1)+' ms');ok('cheap (< 400 ms in vm)',ms<400);}
ok('errors stay 0',API(g).inspect().stats.errors===0,API(g).inspect().stats.lastError);
console.log(JSON.stringify({pass,fail}));process.exit(fail?1:0);
