// R1002 최종보스 연출 Dots 시트(CX-0088FB FB-01~06) CPU 검사 — vm 안에서 엔진 전역을 흉내 내 R950 + R1002 를 실제로 돌리고,
// 그리기 호출(drawImage 와 변환 행렬, 코드 선 그림 횟수)을 기록해 본다.
//  ① 시트가 읽혔으면: 지배 연결·끊김·꿰매기·꿰매기 실패·코어·고리가 모두 시트로 그려지고 코드 선 그림(stroke·ellipse)은 0
//  ② 좌표: 가닥은 코어→끝 방향으로 정확히 놓이고 그림 윗면이 늘 화면 위, 발밑·제단·영웅 발 기준점이 맞음, 원본 칸을 벗어나지 않음
//  ③ 한 번짜리(끊김·꿰매기 실패)는 마지막 빈 칸 뒤로 그리지 않음, 반복(가닥·코어·고리)은 끊김 없이 돎(고리 경계 2.7°)
//  ④ 시트가 없거나 꺼졌으면 R950 원래 코드 그림 그대로, 다른 지역·DREAM 에서는 아무것도 안 그림
//  ⑤ 연결: index.html 태그(finale-r950 뒤), runtime-inputs·manifest, verify 목록, pages.yml, 자산 파일
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),rd=(...p)=>fs.readFileSync(path.join(R,...p),'utf8');
const SRC950=rd('client-source','finale-r950.js'),CANON=rd('client-source','story-canon-r106-data.js');
const FXP=path.join(R,'client-source','finale-fx-r1002.js'),SRC1002=fs.existsSync(FXP)?fs.readFileSync(FXP,'utf8'):null;
let pass=0,total=0;const ok=(n,c,d)=>{total++;if(c)pass++;else console.log('FAIL',n,d===undefined?'':JSON.stringify(d).slice(0,400));};
const SHEET={link:'assets/r1002/fb-nerve-link-loop.webp',snap:'assets/r1002/fb-nerve-link-snap.webp',stitch:'assets/r1002/fb-nerve-stitch.webp',unstitch:'assets/r1002/fb-nerve-unstitch-fail.webp',core:'assets/r1002/fb-core-pulse.webp',ring:'assets/r1002/fb-samong-ring.webp'};
const DIM={link:[2048,768,512,128,24],snap:[2048,384,512,128,12],stitch:[1024,2048,256,512,16],unstitch:[1024,2048,256,512,16],core:[1024,1024,256,256,16],ring:[1024,768,256,128,24]};
const kindOf=p=>Object.keys(SHEET).find(k=>SHEET[k]===p);
function world(opt={}){const store={...(opt.store||{})};
 const g={console,Math,Number,Object,JSON,Map,WeakMap,Set,String,Array,Error,Promise,Date,performance:{now:()=>0},matchMedia:()=>({matches:false}),
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},store,
  document:{body:{appendChild(){}},createElement:()=>({style:{},setAttribute(){},isConnected:true}),getElementById:()=>null}};
 g.window=g;vm.createContext(g);vm.runInContext(CANON,g);
 vm.runInContext(`var time=0,layer=${JSON.stringify(opt.layer||'STORY')},storyScene=null,modal=false,TILE=34,zoom=1,effects=[];
  var ops=[],lines=0,asks=[],loaded=new Set(${JSON.stringify(opt.loaded===false?[]:Object.values(SHEET))}),imgs={};
  var M=[1,0,0,1,0,0],GA=1,stack=[];
  function mul(a,b){return[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];}
  var ctx={save(){stack.push([M.slice(),this.globalAlpha]);},restore(){const s=stack.pop();M=s[0];this.globalAlpha=s[1];},globalAlpha:1,
   translate(x,y){M=mul(M,[1,0,0,1,x,y]);},rotate(a){const c=Math.cos(a),s=Math.sin(a);M=mul(M,[c,s,-s,c,0,0]);},scale(x,y){M=mul(M,[x,0,0,y,0,0]);},
   beginPath(){},moveTo(){},lineTo(){},stroke(){lines++;},fill(){lines++;},arc(){},ellipse(){},scope(o,f){this._scope=o.id;f();this._scope=null;},
   drawImage(im,sx,sy,sw,sh,dx,dy,dw,dh){const P=(x,y)=>({x:M[0]*x+M[2]*y+M[4],y:M[1]*x+M[3]*y+M[5]});
    ops.push({path:im.path,src:[sx,sy,sw,sh],dst:[dx,dy,dw,dh],m:M.slice(),alpha:this.globalAlpha,scope:this._scope,pass:pass_,t:time,
     at:(lx,ly)=>P(dx+lx*dw/sw,dy+ly*dh/sh)});}};
  var pass_='effect';
  function readyImage(p){if(!loaded.has(p))return null;return imgs[p]||(imgs[p]={image:{path:p}});}
  function ensureImages(l){asks.push(...l);return Promise.resolve();}
  function actorHeight(){return 80;}
  var player={x:15,y:14,hp:100,finalAwakening:false};
  var room={id:${JSON.stringify(opt.zone||'cult04')},layer:${JSON.stringify(opt.layer||'STORY')},difficultyR63:'normal',objective:{x:16,y:12},enemies:[],activeEncounter:'',encounterStage:'field',engaged:false,cosmicIndex:0,finalStage:0};
  function project(x,y){return{x:400+(x-y)*34,y:100+(x+y)*17};}
  function tick(dt){time+=dt;}
  var heroDraws=0;function drawHero(){heroDraws++;}
  function drawEffect(e){}
  function playScenes(list,done){if(done)done();}
  function killEnemy(e){e.hp=0;e.deadRecorded=true;return true;}
  function spawnCosmic3(){if(room.cosmicIndex>=6){const e={nativeId:'c104-boss',id:'cult04:final-boss',maxHp:40945.56,hp:40945.56*.68,spawnState:'active',x:19,y:9,defScale:1,combatProfile:{spriteRect:{height:1.5}}};room.enemies.push(e);room.activeEncounter='finalBoss';room.engaged=true;return;}
   room.enemies.push({cosmic:true,nativeId:'kair-great-0'+(room.cosmicIndex+1),maxHp:1000,hp:1000,spawnState:'active',x:15,y:9});room.activeEncounter='cosmic';room.engaged=true;}
  window.spawnCosmic3=spawnCosmic3;
  // 한 프레임: 엔진처럼 영웅을 먼저 그리고 이펙트 차례를 돈다
  function frame(dt,hero){tick(dt);ops.length=0;lines=0;if(hero!==false){pass_='hero';drawHero();}pass_='effect';for(const e of effects.slice())drawEffect(e);return ops.slice();}`,g);
 vm.runInContext(SRC950,g);if(SRC1002&&opt.noFx!==true)vm.runInContext(SRC1002,g);return g;}
const run=(g,code)=>vm.runInContext(code,g);
const A=g=>g.__STORYWORLD_FINALE_R950__,F=g=>g.__STORYWORLD_FINALE_FX_R1002__;
const toLinks=g=>run(g,`room.finalStage=2;player.finalAwakening=true;room.encounterStage='cosmicReady';room.cosmicIndex=0;`);
const of=(ops,k)=>ops.filter(o=>o.path===SHEET[k]);
const inSheet=o=>{const k=kindOf(o.path);if(!k)return false;const [W,H,cw,ch]=DIM[k],[sx,sy,sw,sh]=o.src;const cx=Math.floor(sx/cw),cy=Math.floor(sy/ch);
 return sx>=0&&sy>=0&&sw>0&&sh>0&&sx+sw<=W&&sy+sh<=H&&sx+sw<=(cx+1)*cw&&sy+sh<=(cy+1)*ch;};
const frameOf=o=>{const k=kindOf(o.path),[W,,cw,ch]=DIM[k];return Math.floor(o.src[1]/ch)*(W/cw)+Math.floor(o.src[0]/cw);};
const near=(a,b,e=.6)=>Math.abs(a-b)<=e;

ok('module file exists',!!SRC1002);
if(SRC1002){
// ---- ① 지배 연결: 여섯 가닥 + 코어 + 고리, 코드 선 0 ----
{const g=world();toLinks(g);const ops=run(g,`frame(.1)`);const L=of(ops,'link');
 ok('six link strands from the sheet',L.length===6,L.length);
 ok('core heart drawn once from the sheet',of(ops,'core').length===1);
 ok('ring drawn from the sheet (back half before hero + front half after)',of(ops,'ring').length===2&&of(ops,'ring')[0].pass==='hero'&&of(ops,'ring')[1].pass==='effect',of(ops,'ring').map(o=>o.pass));
 ok('no code-drawn lines while sheets are ready',run(g,`lines`)===0,run(g,`lines`));
 ok('every source rect stays inside one sheet cell',ops.length>0&&ops.every(inSheet),ops.filter(o=>!inSheet(o)).map(o=>o.src));
 ok('alpha within 0..1',ops.every(o=>o.alpha>0&&o.alpha<=1));
 // 좌표: 가닥의 다발 왼쪽 끝(12,64.9)=코어, 오른쪽 끝(500,64.9)=연결 끝. 그림 윗면(작은 y)이 화면 위쪽
 const u=34,c=run(g,`project(16,12)`),cs={x:c.x,y:c.y-u*2.75};let geo=true,up=true,dirs=0;
 for(let k=0;k<6;k++){const a=-Math.PI/2+k*Math.PI*2/6+.35,p=run(g,`project(${16+Math.cos(a)*3.4},${12+Math.sin(a)*3.4})`),end={x:p.x,y:p.y-u*1.4};
  const o=L[k],s=o.at(12-o.src[0],64.9-o.src[1]),e=o.at(500-o.src[0],64.9-o.src[1]);if(!(near(s.x,cs.x)&&near(s.y,cs.y)&&near(e.x,end.x)&&near(e.y,end.y)))geo=false;
  const top=o.at(256-o.src[0],0-o.src[1]),bot=o.at(256-o.src[0],128-o.src[1]);if(!(top.y<bot.y||Math.abs(end.x-cs.x)<1))up=false;if(end.x<cs.x)dirs++;}
 ok('strands run exactly core → link end',geo);ok('strand art keeps its lit top side up (left-going strands are mirrored, not turned upside down)',up&&dirs>=2,{up,dirs});
 const thick=L.map(o=>{const a=o.at(0,29-o.src[1]),b=o.at(0,101-o.src[1]);return Math.hypot(a.x-b.x,a.y-b.y);});
 ok('strand thickness is fixed (stretch is horizontal only)',thick.every(t=>near(t,u*.62,.1)),thick);
 const co=of(ops,'core')[0],tip=co.at(128,240),topc=co.at(128,41);ok('core floats over the altar (tip 2 tiles up, 1.5 tiles tall)',near(tip.x,c.x)&&near(tip.y,c.y-u*2)&&near(tip.y-topc.y,u*1.5,1),{tip,c});
 const pq=run(g,`project(player.x,player.y)`),rb=of(ops,'ring')[0],rf=of(ops,'ring')[1],cen=rb.at(128,64),cen2=rf.at(128,64-64);
 ok('ring is centred on the hero feet, back half = upper half, front half = lower half',near(cen.x,pq.x)&&near(cen.y,pq.y)&&near(cen2.x,pq.x)&&near(cen2.y,pq.y)&&rb.src[3]===64&&rf.src[3]===64&&rb.src[1]%128===0&&rf.src[1]%128===64,{rb:rb.src,rf:rf.src});
 const rr=rb.at(228,64);ok('ring radius 1.45 tiles',near(rr.x-pq.x,u*1.45,.5));
 ok('same ring frame in both halves',frameOf(rb)===frameOf(rf));
 // 영웅을 안 그리는 프레임이면 고리 전체를 이펙트 차례에
 const o2=run(g,`frame(.1,false)`);ok('without a hero pass the whole ring is drawn in the effect pass',of(o2,'ring').length===1&&of(o2,'ring')[0].src[3]===128);
 // 반복: 24장 모두, 가닥마다 4장씩 어긋남
 const seen=new Set();let stag=true;for(let i=0;i<60;i++){const o=of(run(g,`frame(.04)`),'link');o.forEach(x=>seen.add(frameOf(x)));if(((frameOf(o[1])-frameOf(o[0]))%24+24)%24!==4)stag=false;}
 ok('link loop uses all 24 frames',seen.size===24,seen.size);ok('strands pulse 4 frames apart',stag);
 const cseen=new Set();for(let i=0;i<60;i++)of(run(g,`frame(.04)`),'core').forEach(x=>cseen.add(frameOf(x)));ok('core loop uses all 16 frames',cseen.size===16,cseen.size);
 ok('no errors',A(g).inspect().stats.errors===0&&F(g).inspect().stats.errors===0,[A(g).inspect().lastError,F(g).inspect().stats.lastError]);}
// ---- 고리 반복: 19장만, 경계 포함 한 걸음이 6.5° 이하(빛점 간격 60° 기준) ----
{const g=world();const fx=F(g),ang=fx.SHEETS.ring.ang;let maxStep=0,prev=null;const used=new Set();
 for(let t=0;t<10;t+=1/60){const f=fx.ringFrame(t);used.add(f);if(prev!==null&&f!==prev){let d=Math.abs(ang[f]-ang[prev]);d=Math.min(d,60-d);maxStep=Math.max(maxStep,d);}prev=f;}
 ok('ring uses only frames 1..19',Math.max(...used)<=18&&used.size>=16,[...used]);ok('ring never jumps more than 6.5° (sheet wrap was 18.9°)',maxStep<=6.5,maxStep);
 ok('ring angle table is monotonic and ends 2.7° before a full dot spacing',ang.length===19&&ang.every((a,i)=>i===0||a>=ang[i-1])&&near(60-ang[18],2.7,.05));}
// ---- 끊김: 대수문장을 쓰러뜨릴 때마다 한 번, 0..10번 장 순서대로, 빈 칸 뒤로는 안 그림 ----
{const g=world();toLinks(g);run(g,`frame(.1)`);run(g,`room.cosmicIndex=1;`);const fr=[];let linksDuring=null,strokes=0;
 for(let i=0;i<40;i++){const ops=run(g,`frame(.04)`);const s=of(ops,'snap');if(s.length)fr.push(frameOf(s[0]));if(i===0){linksDuring=of(ops,'link').length;
   const u=34,c=run(g,`project(16,12)`),cs={x:c.x,y:c.y-u*2.75},a=-Math.PI/2+.35,p=run(g,`project(${16+Math.cos(a)*3.4},${12+Math.sin(a)*3.4})`),end={x:p.x,y:p.y-u*1.4},o=s[0],sa=o.at(102-o.src[0],50.5-o.src[1]),sb=o.at(412-o.src[0],50.5-o.src[1]);
   ok('snap sits on the cut strand (bundle ends = strand ends)',near(sa.x,cs.x)&&near(sa.y,cs.y)&&near(sb.x,end.x)&&near(sb.y,end.y),{sa,cs,sb,end});
   const th=Math.hypot(o.at(0,23-o.src[1]).x-o.at(0,79-o.src[1]).x,o.at(0,23-o.src[1]).y-o.at(0,79-o.src[1]).y);ok('snap bundle is as thick as the live strand',near(th,u*.62,.1),th);}
  strokes+=run(g,`lines`);}
 ok('five strands remain after one is cut',linksDuring===5,linksDuring);
 ok('snap plays frames 0..10 in order, once',fr[0]===0&&fr[fr.length-1]===10&&fr.every((f,i)=>i===0||f>=fr[i-1])&&new Set(fr).size===11,fr);
 ok('snap never draws the empty last cell or loops',!fr.includes(11));ok('snap: no code lines',strokes===0,strokes);
 ok('R950 still counts the cut',A(g).inspect().stats.linkSnaps===1);}
// ---- 꿰매기(최종 형태 등장) → 꿰매기 실패(최종 처치) ----
{const g=world();toLinks(g);run(g,`room.cosmicIndex=6;spawnCosmic3();`);const st=[],reach=[];let strokes=0,anchor=null,hgt=null,fade=null;
 for(let i=0;i<70;i++){const ops=run(g,`frame(.04)`);const s=of(ops,'stitch'),l=of(ops,'link');strokes+=run(g,`lines`);if(l.length)reach.push(l[0].src[2]);
  if(s.length){st.push(frameOf(s[0]));const o=s[0];anchor=o.at(128-o.src[0]%256,496-o.src[1]%512);hgt=anchor.y-o.at(128-o.src[0]%256,179-o.src[1]%512).y;fade=o.alpha;}}
 const bq=run(g,`project(19,9)`);
 ok('stitch plays all 16 frames in order and holds the last',st[0]===0&&Math.max(...st)===15&&st.every((f,i)=>i===0||f>=st[i-1])&&new Set(st).size===16,st);
 ok('stitch rises from the boss feet to body height',anchor&&near(anchor.x,bq.x)&&near(anchor.y,bq.y)&&near(hgt,80*1.5,1),{anchor,bq,hgt});
 ok('a strand grows from the core to the feet first',reach[0]<200&&reach.some(r=>r===512)&&reach.every((r,i)=>i===0||r>=reach[i-1]),reach.slice(0,20));
 ok('stitch fades out at the end',fade<1&&fade>0,fade);ok('stitch: no code lines',strokes===0,strokes);
 ok('no link strands of the six remain in the final fight',of(run(g,`frame(.04)`),'link').length===0);
 ok('stitch is gone after 2.8s',of(run(g,`frame(.2)`),'stitch').length===0);
 // 최종 처치
 run(g,`killEnemy(room.enemies.find(e=>e.nativeId==='c104-boss'));`);const un=[],sn=[];let s2=0,an2=null,partial=true;
 for(let i=0;i<80;i++){const ops=run(g,`frame(.04)`);const u_=of(ops,'unstitch');s2+=run(g,`lines`);if(u_.length){un.push(frameOf(u_[0]));const o=u_[0];an2=o.at(128-o.src[0]%256,495-o.src[1]%512);}
  of(ops,'snap').forEach(o=>sn.push(frameOf(o)));of(ops,'link').forEach(o=>{if(o.src[2]>12+488*.65+2)partial=false;});if(of(ops,'stitch').length)partial=false;}
 ok('unstitch plays 0..14 in order, once, never the empty last cell',un[0]===0&&Math.max(...un)===14&&un.every((f,i)=>i===0||f>=un[i-1]),un);
 ok('unstitch happens where the boss fell',an2&&near(an2.x,bq.x)&&near(an2.y,bq.y),an2);
 ok('core strand stops short (≤65%) and then snaps',partial&&sn.length>0&&sn[0]===0&&!sn.includes(11),sn);
 ok('unstitch: no code lines',s2===0,s2);
 const after=run(g,`frame(.5)`);ok('nothing of the fail effect remains afterwards',of(after,'unstitch').length+of(after,'snap').length+of(after,'link').length===0);
 ok('core stays on the altar after the fight (canon: the core is preserved)',of(after,'core').length===1);
 run(g,`room.encounterStage='complete';`);ok('ring ends with the region',of(run(g,`frame(.1)`),'ring').length===0);
 ok('R950 counters unchanged in meaning',A(g).inspect().stats.stitch===1&&A(g).inspect().stats.unstitched===1,A(g).inspect().stats);
 ok('no errors (full run)',A(g).inspect().stats.errors===0&&F(g).inspect().stats.errors===0,[A(g).inspect().lastError,F(g).inspect().stats.lastError]);}
// ---- ④ 시트 없음 / 꺼짐 / 모듈 없음: R950 코드 그림 그대로 ----
for(const [n,o] of [['sheets not loaded',{loaded:false}],['switched off',{store:{'storyworld.r1002.finaleFx':'{"on":false}'}}],['module absent',{noFx:true}]]){
 const g=world(o);toLinks(g);const ops=run(g,`frame(.1)`);ok(n+': no sheet draws',ops.length===0,ops.length);ok(n+': code-drawn links still shown',run(g,`lines`)>=20,run(g,`lines`));
 if(n==='sheets not loaded')ok('missing sheets are requested',Object.values(SHEET).every(p=>run(g,`asks`).includes(p)),run(g,`asks`));
 if(n==='switched off')ok('switched off: nothing requested',run(g,`asks`).length===0);
 run(g,`room.cosmicIndex=6;spawnCosmic3();`);let l=0;for(let i=0;i<10;i++){run(g,`frame(.1)`);l+=run(g,`lines`);}ok(n+': code-drawn stitch still shown',l>0);
 ok(n+': no errors',A(g).inspect().stats.errors===0,A(g).inspect().lastError);}
// 일부만 읽힘: 읽힌 것만 시트, 나머지는 코드
{const g=world();run(g,`loaded.delete(${JSON.stringify(SHEET.ring)});`);toLinks(g);const ops=run(g,`frame(.1)`);ok('partly loaded: links by sheet, ring by code',of(ops,'link').length===6&&of(ops,'ring').length===0&&run(g,`lines`)>0);}
// 다른 지역 / DREAM / 각성 전
for(const [n,o] of [['other zone',{zone:'cult03'}],['DREAM',{layer:'DREAM'}]]){const g=world(o);toLinks(g);const ops=run(g,`frame(.1)`);ok(n+': nothing drawn',ops.length===0&&run(g,`lines`)===0&&run(g,`effects.length`)===0);}
{const g=world();const ops=run(g,`frame(.1)`);ok('before the awakening: nothing drawn',ops.length===0&&run(g,`heroDraws`)===1);}
}
// ---- ⑤ 연결 ----
{const html=rd('runtime-text','index.html'),i950=html.indexOf('<script src="./finale-r950.js"></script>'),i1002=html.indexOf('<script src="./finale-fx-r1002.js"></script>'),iEnd=html.indexOf('<script src="./combat-r118.js"></script>');
 ok('index.html: finale-fx-r1002 tag after finale-r950 and before combat-r118',i950>0&&i1002>i950&&iEnd>i1002,{i950,i1002,iEnd});
 const inputs=rd('runtime-inputs.json'),man=rd('runtime-manifest.json');
 ok('runtime-inputs/manifest list the module',inputs.includes('finale-fx-r1002.js')&&man.includes('finale-fx-r1002.js'));
 for(const p of Object.values(SHEET)){ok('asset file exists: '+p,fs.existsSync(path.join(R,'runtime-text',p))&&fs.statSync(path.join(R,'runtime-text',p)).size>50000);ok('manifest lists '+p,man.includes(p)&&inputs.includes(p));}
 ok('runtime-text copy matches client-source',fs.existsSync(path.join(R,'runtime-text','finale-fx-r1002.js'))&&rd('runtime-text','finale-fx-r1002.js')===SRC1002&&rd('runtime-text','finale-r950.js')===SRC950);
 const ver=fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8');ok('verify list has module and assets',ver.includes("'finale-fx-r1002.js'")&&ver.includes("'assets/r1002/'"));
 const yml=fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8');ok('pages.yml runs this check',yml.includes('node r96/qa/r1002/finale-fx-cpu-check.cjs'));
 ok('R950 comment no longer calls the sheets pending',!/CX-0085FN 요청/.test(SRC950));}
console.log(`${pass}/${total} checks passed`);
fs.writeFileSync(path.join(__dirname,'finale-fx-cpu-results.json'),JSON.stringify({pass,total,at:new Date().toISOString()},null,1));
process.exit(pass===total?0:1);
