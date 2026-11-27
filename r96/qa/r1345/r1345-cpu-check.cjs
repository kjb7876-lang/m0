// R1345 CPU 검사 — 탐식 보스(베엘제붑, b04-boss) '위장의 꿈틀거림': 보스방 전역에서 위장이 꿈틀거리는 프레임 애니메이션 스킬 — gut-writhe-r1345.js
//  사용자 2026-11-26 13:47Z "탐식주방 보스가 보스방전역에서 마치 위장이 꿈틀거리는듯한 프레임애니메이션스킬을 사용하도록"
//  사용자 2026-11-27 00:45Z "조리대를잡자 거대한위장이 꿈틀되는거 같아 물러났다 이거 대사나올때부터 보스가 … 스킬 사용하게" →
//   R450 '거대한 위장처럼 꿈틀거리는' 박자(체력 50% 이하) 대사가 나오는 순간부터 시전(그 전엔 안 씀). 이 검사의 보스 기본 체력은 그래서 50%.
//  규칙: 프레임 시트만(코드 도형 0), 바닥 예고 장판 없음(솟는 그림 자체가 예고), 15세, 피할 틈 있음, R1263 탐식 스킬과 겹치지 않음.
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),F='gut-writhe-r1345.js';let n=0;
const ok=(c,m,d)=>{if(!c)console.log('FAIL '+m,d===undefined?'':JSON.stringify(d).slice(0,400));assert(c,m);n++;console.log('PASS '+m);};
const srcPath=path.join(R,'client-source',F);ok(fs.existsSync(srcPath),'오버레이 파일 있음');
const src=fs.readFileSync(srcPath,'utf8');
ok(src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8'),'runtime-text 사본 같음');
// ---- 빌드 연결 ----
const html=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8'),t=s=>html.indexOf('<script src="./'+s+'"></script>');
ok(t(F)>0&&t(F)>t('sin-skills-r1263.js')&&t(F)<t('boot-lean-r1038.js')&&/\n<script src="\.\/gut-writhe-r1345\.js"><\/script>\n/.test(html),'index.html: 자기 줄, sin-skills-r1263 뒤·boot-lean-r1038 앞');
const ver=fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8');ok(ver.includes("'"+F+"'")&&ver.includes("'assets/r1345/'"),'verify-r96-public 기대 목록(파일·자산)');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1345/r1345-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');ok(man.includes('"'+F+'"')||man.includes('/'+F+'"'),'runtime-manifest 에 들어감');
const idxP=path.join(R,'runtime-text/assets/r1345/index.json');ok(fs.existsSync(idxP),'시트 표 assets/r1345/index.json');
const idx=JSON.parse(fs.readFileSync(idxP,'utf8'));
const SHEETS=['gut-fold12','gut-wall12'];
for(const k of SHEETS){const a='assets/r1345/'+k+'.webp';ok(src.includes(a)&&fs.existsSync(path.join(R,'runtime-text',a))&&man.includes(a),'프레임 시트 있음·manifest: '+a);
 const c=idx[k];ok(c&&c.frames>=12&&c.final===false&&c.source&&c.sha256&&c.bytes>0,'시트 표: '+k+' 12칸 이상·원천·해시·크기·임시 표시',c);
 ok(c.cell[0]*(c.cols||c.frames)<=4096&&c.cell[1]*Math.ceil(c.frames/(c.cols||c.frames))<=4096,'4096 한도: '+k,c);
 const buf=fs.readFileSync(path.join(R,'runtime-text',a));ok(require('crypto').createHash('sha256').update(buf).digest('hex')===c.sha256&&buf.length===c.bytes,'시트 해시·크기 표와 같음: '+k);}
ok(!/drop-shadow|blur\(/.test(src),'게임 ctx.filter 에 drop-shadow·blur 안 씀');
ok(!/setTransform|resetTransform/.test(src),'게임 ctx 변환 직접 덮어쓰기 없음(Three.js 기록기 안전)');
// ---- 샌드박스 ----
const SHAPES=['arc','ellipse','fillRect','strokeRect','lineTo','stroke','fill','rect','quadraticCurveTo','bezierCurveTo'];
const BB=[4,4,30,26];
function sandbox(o={}){
 const calls={hurt:[],imgs:[],shapes:0,perFrame:[],scopes:[]};
 const ctx=new Proxy({},{get:(ob,k)=>k in ob?ob[k]:(typeof k==='string'&&!['globalAlpha','lineWidth','strokeStyle','fillStyle','globalCompositeOperation','filter'].includes(k)?((...a)=>{if(SHAPES.includes(k))calls.shapes++;if(k==='drawImage')calls.imgs.push(a[0]&&a[0].src);}):undefined),set:(ob,k,v)=>{ob[k]=v;return true;}});
 ctx.scope=(q,fn)=>{calls.scopes.push(q);fn();};
 const player={x:12,y:12,hp:100};const walls=o.walls||(()=>false);
 const room={id:'ep1b04',enemies:[],exploration:o.noBounds?{}:{worldWardR81:{bossBounds:BB.slice()}}};
 const sb={window:{},localStorage:{store:{},getItem(k){return this.store[k]??null;},setItem(k,v){this.store[k]=v;}},time:0,started:true,loading:false,modal:false,storyScene:null,player,ctx,room,effects:[],W:960,H:540,TILE:34,zoom:.667,
  project:(x,y)=>({x:(x-y)*22+480,y:(x+y)*11+270}),actorHeight:()=>60,readyImage:p=>({image:{src:p,width:3072,height:256,naturalWidth:3072,naturalHeight:256}}),
  blocked:(x,y,r=.27)=>x-r<1||y-r<1||x+r>39||y+r>39||walls(x,y),hurt:(d,s)=>{calls.hurt.push([d,s&&s.r1345,s&&s.kind]);return o.hurtRet?o.hurtRet(d,s):'hit';},
  drawEffect(){},tick(dt){},settings:{},Math,JSON,String,Object,Number,Array,Set,Map,WeakMap,Promise,console};
 if(o.r1263)sb.window.__STORYWORLD_SIN_SKILLS_R1263__=o.r1263;
 if(o.r450)sb.window.__STORYWORLD_BATTLE_BEATS_R450__=o.r450;
 if(o.beatText!==undefined)sb.document={getElementById:id=>id==='r450Beat'?{textContent:o.beatText,style:{opacity:o.beatOpacity??'1'},isConnected:true}:null};
 sb.window.window=sb.window;vm.createContext(sb);vm.runInContext(src,sb);return {sb,calls,player,room,A:sb.window.__STORYWORLD_GUT_WRITHE_R1345__};}
const boss=(o={})=>({id:'Bg',boss:true,hp:500,maxHp:1000,damage:20,spawnState:'active',x:14,y:12,radius:.6,nativeId:'b04-boss',name:'최고급 호텔의 총주방장 · 탐식의 귀 베엘제붑',...o});
const run=(S,secs,dt=1/30,each)=>{for(let i=0;i<Math.round(secs/dt);i++){S.sb.time+=dt;S.sb.tick(dt);const m=S.sb.effects.find(x=>x&&x.type==='r1345-fx');if(m){const i0=S.calls.imgs.length;S.sb.drawEffect(m);S.calls.perFrame.push(S.calls.imgs.length-i0);}if(each&&each(S,i)===false)break;}};
const A0=sandbox().A;ok(!!A0&&typeof A0.which==='function'&&typeof A0.inspect==='function'&&typeof A0.set==='function','API window.__STORYWORLD_GUT_WRITHE_R1345__');
ok(A0.which(boss())==='gluttony','탐식 보스(b04-boss) 알아봄');ok(A0.which({name:'탐식의 귀 베엘제붑'})==='gluttony','이름으로도 알아봄');
for(const e of [{nativeId:'mb-ep1b04',name:'폐기주방 감독'},{nativeId:'b05-boss',name:'붉은 하이힐'},{nativeId:'b07-boss',name:'불을 지른 청소부 · 분노의 귀'},{nativeId:'b04-boss',r61Clone:true},{name:'유리망령'},null])
 ok(A0.which(e)===null,'다른 보스·중간보스·분신은 아님: '+(e&&(e.name||e.nativeId)));
const U=A0.tune;ok(U.cd>=12,'재사용 12초 이상',U.cd);ok(U.cap<=1.2,'한 시전 총 피해 ≤ 보스 근접 1.2대',U.cap);ok(U.beatDelay>=.3&&U.beatDelay<=1,'대사 뒤 .3~1초에 첫 시전(대사를 먼저 읽게)',U.beatDelay);const FIRST=1.2;
// ---- 서 있는 영웅: 시전·피해 상한·시트만·바닥 장판 없음 ----
{const S=sandbox(),A=S.A,b=boss();S.room.enemies.push(b);S.player.x=b.x+1.2;S.player.y=b.y;
 let folds=null,walls=null,dur=0,t0=null;run(S,FIRST+12,1/30,()=>{const i=A.inspect();if(i.casting){t0=t0??S.sb.time;if(!folds&&i.folds.length){folds=i.folds;walls=i.walls;}}else if(t0!==null&&!dur)dur=S.sb.time-t0;});
 const ins=A.inspect();ok(ins.casts>=1,'교전 뒤 시전',ins);
 ok(dur>0&&dur<=6,'한 시전 6초 이하(R1263 과 겹치지 않을 길이)',dur);
 const tot=S.calls.hurt.reduce((s,h)=>s+h[0],0);ok(S.calls.hurt.length>=1&&S.calls.hurt.every(h=>h[1]==='gut'&&h[2]==='r1345-gut'),'서 있으면 맞음(자기 스킬 이름표)',S.calls.hurt);
 ok(tot<=b.damage*U.cap*ins.casts+1e-6,'시전당 총 피해 ≤ 상한',{tot,casts:ins.casts});
 ok(S.calls.shapes===0,'코드 도형(원·선·사각형) 0 — 프레임 시트만',S.calls.shapes);
 const used=new Set(S.calls.imgs.map(p=>String(p).replace(/^.*r1345\//,'').replace('.webp','')));ok(SHEETS.every(s=>used.has(s)),'위장 주름·위벽 시트 모두 그림',[...used]);
 ok(Math.max(...S.calls.perFrame)<=100,'한 화면 그림 호출 ≤ 100(R1345c Dots 바닥 꿈틀 층 포함)',Math.max(...S.calls.perFrame));
 ok(S.calls.scopes.length>0&&S.calls.scopes.every(q=>q.kind==='effect'&&q.groundAligned===false&&q.enemy===true&&q.ownerType==='enemy'),'바닥 예고 장판 없음(모두 세워 그림)·적 이펙트 표시',S.calls.scopes.filter(q=>q.groundAligned!==false).slice(0,3));
 // 보스방 전역
 ok(folds&&folds.length>=16&&folds.length<=40,'위장 주름 16~40개',folds&&folds.length);
 const xs=folds.map(f=>f.x),ys=folds.map(f=>f.y),W=BB[2]-BB[0],H=BB[3]-BB[1];
 ok(Math.max(...xs)-Math.min(...xs)>=.7*W&&Math.max(...ys)-Math.min(...ys)>=.7*H,'주름이 보스방 전역에 퍼짐(가로·세로 70% 이상)',{w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)});
 ok(folds.every(f=>f.x>=BB[0]&&f.x<=BB[2]&&f.y>=BB[1]&&f.y<=BB[3]&&!S.sb.blocked(f.x,f.y,.2)),'주름은 보스방 안·벽 밖');
 // 파도: 보스에서 바깥으로 번지는 연동(꿈틀) — 3파 이상, 늦은 파일수록 멀다
 const waves=[...new Set(folds.map(f=>f.wave))].sort((a,c)=>a-c);ok(waves.length>=3,'연동 파도 3파 이상',waves);
 const md=waves.map(w=>{const q=folds.filter(f=>f.wave===w);return q.reduce((s,f)=>s+Math.hypot(f.x-b.x,f.y-b.y),0)/q.length;});
 ok(md.every((d,i)=>i===0||d>md[i-1]),'파도가 보스에서 바깥으로 번짐',md);
 const wt=waves.map(w=>Math.min(...folds.filter(f=>f.wave===w).map(f=>f.t0)));ok(wt.every((x,i)=>i===0||x>wt[i-1]),'파도 시각이 차례로 늦어짐',wt);
 // 피할 틈: 주름 명중 반경이 보스방 넓이의 45% 이하
 let cov=0,all=0;for(let x=BB[0]+.25;x<BB[2];x+=.5)for(let y=BB[1]+.25;y<BB[3];y+=.5){all++;if(folds.some(f=>Math.hypot(f.x-x,f.y-y)<=ins.foldR))cov++;}
 ok(cov/all<=.45&&cov/all>=.12,'명중 범위 12~45%(피할 틈 있음·전역 위협)',cov/all);
 ok(walls&&walls.length>=8&&walls.every(w=>Math.min(w.x-BB[0],BB[2]-w.x,w.y-BB[1],BB[3]-w.y)<=1.6),'위벽 꿈틀 8곳 이상이 보스방 가장자리를 따라',walls&&walls.length);}
// ---- 틈에 서 있으면 안 맞음 ----
{const S=sandbox(),A=S.A,b=boss();S.room.enemies.push(b);S.player.x=b.x+1;S.player.y=b.y+1;let moved=false;
 run(S,FIRST+10,1/30,()=>{const i=A.inspect();if(i.casting&&i.folds.length&&!moved){moved=true;let best=null;
  for(let x=BB[0]+1;x<BB[2]-1;x+=.25)for(let y=BB[1]+1;y<BB[3]-1;y+=.25){const d=Math.min(...i.folds.map(f=>Math.hypot(f.x-x,f.y-y)));if(d>i.foldR+.4&&Math.hypot(x-b.x,y-b.y)<=8&&(!best||d>best.d))best={x,y,d};}
  S.player.x=best.x;S.player.y=best.y;S.gap=best;}if(moved&&!i.casting)return false;});
 ok(moved&&S.gap,'시전 중 틈 찾음',S.gap);ok(S.calls.hurt.length===0,'주름 사이 틈에 서 있으면 안 맞음',S.calls.hurt);}
// ---- 거절된 피해(무적·패링)는 상한 몫을 안 씀 ----
{const S=sandbox({hurtRet:()=> 'invulnerable'}),A=S.A,b=boss();S.room.enemies.push(b);S.player.x=b.x+1.2;S.player.y=b.y;run(S,FIRST+8);ok(A.inspect().hits===0&&A.inspect().casts>=1,'무적이면 명중 0',A.inspect());}
// ---- R1263 탐식 스킬과 겹치지 않음 ----
{const S=sandbox({r1263:{inspect:()=>({casting:true,next:0})}}),A=S.A,b=boss();S.room.enemies.push(b);run(S,FIRST+8);ok(A.inspect().casts===0,'R1263 시전 중이면 기다림');}
{let nx=0;const S=sandbox({r1263:{inspect:()=>({casting:false,next:nx})}}),A=S.A,b=boss();S.room.enemies.push(b);
 run(S,FIRST+U.cd+8,1/30,()=>{nx=S.sb.time+2;});ok(A.inspect().casts===1,'대사 순간 첫 시전 뒤로는 R1263 이 곧(6초 안) 시전하면 기다림',A.inspect().casts);}
{const S=sandbox({r1263:{inspect:()=>({casting:false,next:1e9})}}),A=S.A,b=boss();S.room.enemies.push(b);run(S,FIRST+3);ok(A.inspect().casts>=1,'R1263 이 한참 뒤면 시전');}
// ---- 멀면·끄면·죽으면·서사 장면·다른 보스 ----
{const S=sandbox(),A=S.A,b=boss({x:35,y:35});S.room.enemies.push(b);S.player.x=3;S.player.y=3;run(S,FIRST+6);ok(A.inspect().casts===0&&S.calls.hurt.length===0,'멀면 시전 안 함');}
{const S=sandbox(),A=S.A,b=boss();S.room.enemies.push(b);A.set({on:false});run(S,FIRST+6);ok(A.inspect().casts===0,'끄면 안 함');}
{const S=sandbox(),A=S.A,b=boss();S.room.enemies.push(b);run(S,FIRST+.4);ok(A.inspect().casting,'시전 중');b.hp=0;run(S,.2);ok(!A.inspect().casting,'보스 죽으면 즉시 멈춤');}
{const S=sandbox(),A=S.A,b=boss();S.room.enemies.push(b);S.sb.storyScene={};run(S,FIRST+6);ok(A.inspect().casts===0,'서사 장면 중엔 멈춤');}
{const S=sandbox(),A=S.A,b=boss({nativeId:'b05-boss',name:'붉은 하이힐'});S.room.enemies.push(b);run(S,FIRST+6);ok(A.inspect().casts===0,'다른 7대죄 보스는 안 씀');}
// ---- 보스방 틀이 없을 때: 보스 둘레로 대신 ----
{const S=sandbox({noBounds:true}),A=S.A,b=boss();S.room.enemies.push(b);let folds=null;run(S,FIRST+2,1/30,()=>{const i=A.inspect();if(i.folds?.length&&!folds)folds=i.folds;});
 ok(folds&&folds.length>=10&&folds.every(f=>Math.hypot(f.x-b.x,f.y-b.y)<=10),'틀 없으면 보스 둘레 10칸 안에 주름',folds&&folds.length);}
// ---- 시간 되감기(새 판) ----
{const S=sandbox(),A=S.A,b=boss();S.room.enemies.push(b);run(S,FIRST+.5);ok(A.inspect().casting,'되감기 전 시전 중');S.sb.time=0;run(S,.1);ok(!A.inspect().casting,'시간 되감기면 시전 비움');}
// ---- R1345b: '거대한 위장처럼 꿈틀거리는' 대사가 나오는 순간부터 ----
{const S=sandbox(),A=S.A,b=boss({hp:1000});S.room.enemies.push(b);run(S,25);ok(A.inspect().casts===0,'체력 50% 넘고 대사 없으면 25초 동안 안 씀',A.inspect().casts);
 b.hp=499;let at=null;const t1=S.sb.time;run(S,3,1/30,()=>{if(A.inspect().casting&&at===null)at=S.sb.time-t1;});ok(at!==null&&at>=U.beatDelay-.05&&at<=1.1,'50% 아래로(대사 박자) 떨어지면 1.1초 안 시전',at);}
{const S=sandbox({beatText:'조리대를 붙잡으려다 그것마저 거대한 위장처럼 꿈틀거리는 것을 보고 물러났다.'}),A=S.A,b=boss({hp:800});S.room.enemies.push(b);let at=null;
 run(S,3,1/30,()=>{if(A.inspect().casting&&at===null)at=S.sb.time;});ok(at!==null&&at<=1.2,'화면에 그 대사가 떠 있으면(R450) 체력과 상관없이 바로 시전',at);ok(A.inspect().beat===true,'inspect().beat 표시');}
{const S=sandbox({beatText:'돼지와 두꺼비를 닮은 베엘제붑이 식칼과 프라이팬을 마구 던졌다.'}),A=S.A,b=boss({hp:800});S.room.enemies.push(b);run(S,10);ok(A.inspect().casts===0,'다른 대사(식칼·프라이팬)로는 시작 안 함');}
{const S=sandbox({beatText:'조리대를 붙잡으려다 그것마저 거대한 위장처럼 꿈틀거리는 것을 보고 물러났다.',beatOpacity:'0'}),A=S.A,b=boss({hp:800});S.room.enemies.push(b);run(S,10);ok(A.inspect().casts===0,'사라진(투명) 대사는 안 셈');}
{const S=sandbox(),A=S.A,b=boss({hp:499});S.room.enemies.push(b);let first=null,second=null;run(S,U.cd+8,1/30,()=>{const i=A.inspect();if(i.casts>=1&&first===null)first=S.sb.time;if(i.casts>=2&&second===null)second=S.sb.time;if(S.sb.time>2)b.hp=900;});
 ok(first!==null&&second!==null&&second-first>=U.cd,'한 번 시작되면 체력이 회복돼도 재사용 간격마다 계속',{first,second});}
{const S=sandbox({r1263:{inspect:()=>({casting:S0.c,next:0})}}),A=S.A,b=boss();S.room.enemies.push(b);var S0={c:true};let at=null;run(S,6,1/30,()=>{if(S.sb.time>=3)S0.c=false;if(A.inspect().casting&&at===null)at=S.sb.time;});
 ok(at!==null&&at>=3&&at<=4,'대사 순간 R1263 시전 중이면 그것만 끝나고 바로',at);}
// R450 이 켜져 있으면 체력 50% 순간이 아니라 '대사가 실제로 화면에 뜨는' 순간(앞 대사 뒤 줄 서기)에 맞춘다. 7초 안에 안 뜨면 그냥 시작.
{const box={textContent:'',style:{opacity:'0'},isConnected:true};const S=sandbox({r450:{inspect:()=>({on:true})},beatText:''}),A=S.A,b=boss({hp:499});S.sb.document={getElementById:id=>id==='r450Beat'?box:null};S.room.enemies.push(b);
 run(S,3);ok(A.inspect().casts===0,'R450 켜짐: 대사 아직 줄 서 있으면(3초) 기다림');box.textContent='조리대를 붙잡으려다 그것마저 거대한 위장처럼 꿈틀거리는 것을 보고 물러났다.';box.style.opacity='1';
 const t1=S.sb.time;let at=null;run(S,2,1/30,()=>{if(A.inspect().casting&&at===null)at=S.sb.time-t1;});ok(at!==null&&at>=U.beatDelay-.05&&at<=1.1,'대사가 뜨면 그 순간부터(.5초 뒤) 시전',at);}
{const S=sandbox({r450:{inspect:()=>({on:true})},beatText:'',beatOpacity:'0'}),A=S.A,b=boss({hp:499});S.room.enemies.push(b);let at=null;run(S,9,1/30,()=>{if(A.inspect().casting&&at===null)at=S.sb.time;});
 ok(at!==null&&at>=6.9&&at<=7.6,'대사가 7초 안에 안 뜨면(영화 모드 등) 그냥 시작',at);}
{const S=sandbox({r450:{inspect:()=>({on:false})}}),A=S.A,b=boss({hp:499});S.room.enemies.push(b);let at=null;run(S,2,1/30,()=>{if(A.inspect().casting&&at===null)at=S.sb.time;});ok(at!==null&&at<=1.1,'R450 꺼져 있으면 50% 순간 바로',at);}
// ---- R1345c: Dots 정식 시트 SW-R1352-D01 gastric_floor_ripple(24칸) 를 주름 자리 바닥 꿈틀로 ----
{const c=idx['gastric-ripple24'],a='assets/r1345/gastric-ripple24.webp';ok(c&&c.frames===24&&c.cols===12&&c.final===true&&/SW-R1352-D01/.test(c.source)&&/2b639de4/.test(c.dotsSha256||'')&&c.peak===10,'Dots D01 시트 표: 24칸·12×2 격자·정식·원본 SHA·정점 10칸',c);
 ok(src.includes(a)&&fs.existsSync(path.join(R,'runtime-text',a))&&man.includes(a),'Dots 시트 파일·코드·manifest');
 ok(c.cell[0]*c.cols<=4096&&c.cell[1]*Math.ceil(c.frames/c.cols)<=4096,'Dots 시트 4096 한도');
 const buf=fs.readFileSync(path.join(R,'runtime-text',a));ok(require('crypto').createHash('sha256').update(buf).digest('hex')===c.sha256,'Dots 시트 해시 표와 같음');
 const S=sandbox(),A=S.A,b=boss();S.room.enemies.push(b);const rip=[];S.calls.scopes=[];run(S,FIRST+5,1/30,()=>{});
 const used=S.calls.imgs.filter(p=>/gastric-ripple24/.test(p)).length;ok(used>=20,'주름마다 Dots 바닥 꿈틀을 실제로 그림',used);
 ok(A.gw.hitFrame/A.gw.fps>=10/A.gw.rippleFps-.05&&A.gw.hitFrame/A.gw.fps<=10/A.gw.rippleFps+.15,'명중 시각이 Dots 정점(10칸)과 맞음',A.gw);
 ok(Math.max(...S.calls.perFrame)<=100,'Dots 층을 더해도 한 화면 그림 호출 ≤ 100',Math.max(...S.calls.perFrame));}
console.log('R1345 CPU '+n+' PASS');
