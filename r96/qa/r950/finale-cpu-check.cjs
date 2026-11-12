// R950 최종보스(교주의 사몽) 마무리 CPU 검사 — vm 안에서 엔진 전역을 흉내 내 모듈을 실제로 돌린다.
//  ① 최종 형태 체력: 1형태가 받은 체력 값을 이어받아 68% 에서 시작(정확히 한 번), 기록이 없으면 손대지 않음, 다른 지역·DREAM·꺼짐에서는 그대로
//  ② 정본 박자: 여섯 박자 모두 정본(cult04) 문장 그대로 찾아짐, 단계별로 한 번씩
//  ③ 연출: 지배 연결 끊김 6회, 최종 소환 꿰매기 1회, 최종 처치 뒤 꿰매기 실패 1회, 마지막 서사 창 2.6초 미룸(글·목록 그대로, 한 번만)
//  ④ 연결: index.html 태그(combat-r118 앞), runtime-inputs, verify 목록, pages.yml
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),SRC=fs.readFileSync(path.join(R,'client-source','finale-r950.js'),'utf8');
const CANON=fs.readFileSync(path.join(R,'client-source','story-canon-r106-data.js'),'utf8');
let pass=0,total=0;const ok=(n,c,d)=>{total++;if(c)pass++;else console.log('FAIL',n,d===undefined?'':JSON.stringify(d).slice(0,300));};
function world(opt={}){const store={...(opt.store||{})};if(opt.off)store['storyworld.r950.finale']='{"on":false}';
 const g={console,Math,Number,Object,JSON,Map,WeakMap,Set,String,Array,Error,performance:{now:()=>0},matchMedia:()=>({matches:false}),
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},store,
  document:{body:{appendChild(){}},createElement:()=>({style:{},setAttribute(){},isConnected:true}),getElementById:()=>null}};
 g.window=g;vm.createContext(g);vm.runInContext(CANON,g);
 vm.runInContext(`var time=0,layer=${JSON.stringify(opt.layer||'STORY')},storyScene=null,modal=false,TILE=34,zoom=1,effects=[],ctx={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fill(){},arc(){},ellipse(){},scope(o,f){f();}};
  var player={x:15,y:14,hp:100,finalAwakening:false};var log=[];
  var room={id:${JSON.stringify(opt.zone||'cult04')},layer:${JSON.stringify(opt.layer||'STORY')},difficultyR63:'normal',objective:{x:16,y:12},enemies:[],activeEncounter:'',encounterStage:'field',engaged:false,cosmicIndex:0,finalStage:0};
  function project(x,y){return{x:(x-y)*34,y:(x+y)*17};}
  function tick(dt){time+=dt;}
  function drawEffect(e){log.push('base-draw:'+e.type);}
  function playScenes(list,done){log.push({scenes:list.map(s=>s.part),t:time});if(done)done();}
  function enterRegion(){log.push('enter');}
  function spawnCosmic3(){if(room.cosmicIndex>=6){const e={nativeId:'c104-boss',id:'cult04:final-boss',maxHp:40945.56,hp:40945.56*.68,difficultyBaseHpR63:96815,difficultyFactorR63:.25,healthR71Adjusted:true,healthR71VisibleMaxHp:40945.56,spawnState:'summoning',x:17,y:10};room.enemies.push(e);room.activeEncounter='finalBoss';room.encounterStage='summoning';room.engaged=true;return;}
   room.enemies.push({cosmic:true,nativeId:'kair-great-0'+(room.cosmicIndex+1),maxHp:40945.56,hp:40945.56,spawnState:'active',x:15,y:9});room.activeEncounter='cosmic';room.engaged=true;}
  window.spawnCosmic3=spawnCosmic3;`,g);
 vm.runInContext(SRC,g);return g;}
const run=(g,code)=>vm.runInContext(code,g);
const A=g=>g.__STORYWORLD_FINALE_R950__;
const first={nativeId:'c104-boss',id:'c104-boss',boss:true,maxHp:160465.56,hp:160465.56,difficultyBaseHpR63:96815,difficultyFactorR63:1,healthR71Adjusted:true,healthR71CanonicalBaseHp:96815,healthR71CanonicalMaxHp:96815,healthR71DifficultyFactor:1,healthR71VisibleMaxHp:160465.56,spawnState:'active',x:17,y:10};
function fullRun(g){
 run(g,`room.activeEncounter='boss';room.engaged=true;room.enemies=[${JSON.stringify(first)}];for(let i=0;i<10;i++)tick(.1);`);
 run(g,`room.enemies[0].hp=room.enemies[0].maxHp*.2;tick(.1);room.enemies[0].hp=0;room.enemies=[];room.engaged=false;room.finalStage=2;player.finalAwakening=true;room.encounterStage='cosmicReady';tick(.1);`);
 for(let i=0;i<6;i++)run(g,`spawnCosmic3();for(let k=0;k<30;k++)tick(.1);room.enemies.forEach(e=>{if(e.cosmic)e.hp=0;});room.enemies=room.enemies.filter(e=>e.hp>0);room.cosmicIndex++;room.engaged=false;room.encounterStage='cosmicReady';for(let k=0;k<5;k++)tick(.1);`);
 run(g,`spawnCosmic3();tick(.1);room.enemies[0].spawnState='active';for(let k=0;k<30;k++)tick(.1);`);
}
// ① 체력
{const g=world();fullRun(g);const e=run(g,`room.enemies.find(e=>e.nativeId==='c104-boss')`);
 ok('final max = first form max',Math.abs(e.maxHp-first.maxHp)<1e-6,e.maxHp);
 ok('final starts at 68%',Math.abs(e.hp/e.maxHp-.68)<1e-9,e.hp/e.maxHp);
 ok('difficulty/R71 fields follow the first form (save/restore stays consistent)',e.difficultyFactorR63===1&&e.difficultyBaseHpR63===96815&&e.healthR71VisibleMaxHp===first.maxHp&&e.healthR71CanonicalMaxHp===96815,e);
 ok('fixed exactly once',A(g).inspect().stats.hpFixed===1,A(g).inspect().stats);
 run(g,`for(let k=0;k<20;k++)tick(.1);`);ok('later ticks do not refix or heal',Math.abs(run(g,`room.enemies[0].hp`)/first.maxHp-.68)<1e-9&&A(g).inspect().stats.hpFixed===1);
 ok('record persisted per tier',JSON.parse(g.store['storyworld.r950.finale.rec']).normal.maxHp===first.maxHp);
 const cos=run(g,`log`);ok('no errors',A(g).inspect().stats.errors===0,A(g).inspect().lastError);}
// 저장에서 이어 하기(1형태 기록은 localStorage 에만)
{const g=world({store:{'storyworld.r950.finale.rec':JSON.stringify({normal:first})}});run(g,`room.finalStage=2;room.cosmicIndex=6;room.encounterStage='cosmicReady';spawnCosmic3();tick(.1);`);
 const e=run(g,`room.enemies[0]`);ok('resume from save uses stored record',Math.abs(e.maxHp-first.maxHp)<1e-6&&Math.abs(e.hp/e.maxHp-.68)<1e-9,e);
 const g2=world({store:{'storyworld.r950.finale.rec':JSON.stringify({hard:first})}});run(g2,`room.cosmicIndex=6;spawnCosmic3();tick(.1);`);
 ok('record of another difficulty is not used',run(g2,`room.enemies[0].maxHp`)===40945.56&&A(g2).inspect().stats.hpNoRecord===1);}
// 기록 없음 / 꺼짐 / 다른 지역 / DREAM: 손대지 않음
for(const [n,o] of [['no record',{}],['off',{off:true,store:{'storyworld.r950.finale.rec':JSON.stringify({normal:first})}}],['other zone',{zone:'cult03',store:{'storyworld.r950.finale.rec':JSON.stringify({normal:first})}}],['DREAM',{layer:'DREAM',store:{'storyworld.r950.finale.rec':JSON.stringify({normal:first})}}]]){
 const g=world(o);run(g,`room.cosmicIndex=6;spawnCosmic3();for(let k=0;k<5;k++)tick(.1);`);const e=run(g,`room.enemies[0]`);
 ok(n+': final hp untouched',e.maxHp===40945.56&&Math.abs(e.hp/e.maxHp-.68)<1e-9,e);if(n!=='no record')ok(n+': nothing drawn',run(g,`effects.length`)===0);else ok(n+': stitch still shown (only hp left alone)',A(g).inspect().stats.stitch===1);}
// ② 정본 박자
{const g=world();const bt=A(g).beatTexts();const canon=run(g,`__STORYWORLD_STORY_CANON_R106__.zones.cult04.blocks.flatMap(b=>b.paras).join(' ')`).replace(/\s*\n\s*/g,' ');
 for(const [k,v] of Object.entries(bt))ok('beat '+k+' is a whole canon sentence',typeof v==='string'&&v.length>10&&canon.includes(v)&&/[.?!…]$/.test(v),v);
 ok('six beats',Object.keys(bt).length===6);
 fullRun(g);run(g,`room.enemies[0].hp=room.enemies[0].maxHp*.4;for(let k=0;k<20;k++)tick(.1);room.enemies[0].hp=room.enemies[0].maxHp*.2;for(let k=0;k<60;k++)tick(.1);`);
 const st=A(g).inspect().stats;ok('all six beats fired once and shown',st.beatsShown===6&&st.beatsSkipped===0&&st.beatsMissing===0,st);
 run(g,`for(let k=0;k<50;k++)tick(.1);`);ok('no beat repeats',A(g).inspect().stats.beatsShown===6);
 const g2=world();run(g2,`modal=true;`);fullRun(g2);ok('beats not shown while a window is open',A(g2).inspect().stats.beatsShown===0&&A(g2).inspect().stats.beatsSkipped>=3,A(g2).inspect().stats);}
// ③ 연출 + 서사 미루기
{const g=world();fullRun(g);const st=A(g).inspect().stats;
 ok('six link snaps',st.linkSnaps===6,st);ok('final stitch once',st.stitch===1,st);
 ok('links shown during cosmic only (0 at final)',A(g).inspect().links===0);
 ok('sentinel armed while awakened',run(g,`effects.length`)===1);
 run(g,`drawEffect(effects[0]);`);ok('sentinel drawn by R950 (not base)',A(g).inspect().stats.draws===1&&!run(g,`log`).includes('base-draw:r950-finale'),run(g,`log`));
 run(g,`drawEffect({type:'other'});`);ok('other effects pass to base',run(g,`log`).includes('base-draw:other'));
 run(g,`room.enemies[0].hp=0;room.enemies[0].deadRecorded=true;tick(.05);var DONE=0;playScenes([{part:'post'},{part:'finale.core-preserved'}],()=>{DONE++;});`);
 ok('unstitch on final death',A(g).inspect().stats.unstitched===1);
 ok('post scene deferred (not yet shown)',!run(g,`log`).some(r=>r.scenes)&&A(g).inspect().pending===true);
 run(g,`playScenes([{part:'post'},{part:'finale.core-preserved'}],()=>{DONE+=10;});`);ok('altar interact during the wait does not open a second post scene',!run(g,`log`).some(r=>r.scenes)&&A(g).inspect().stats.swallowed===1);
 ok('hero kept safe during the short wait',run(g,`player.invincible`)>=2.6);
 run(g,`for(let k=0;k<20;k++)tick(.1);`);ok('still waiting at 2.0s',!run(g,`log`).some(r=>r.scenes));
 run(g,`for(let k=0;k<8;k++)tick(.1);`);const sc=run(g,`log`).filter(r=>r.scenes);
 ok('post scene shown once after ~2.6s with the same list and callback',sc.length===1&&JSON.stringify(sc[0].scenes)==='["post","finale.core-preserved"]'&&run(g,`DONE`)===1,sc);
 run(g,`playScenes([{part:'post'}],()=>{});`);ok('a second post call is not deferred again',run(g,`log`).filter(r=>r.scenes).length===2);}
{const g=world();fullRun(g);run(g,`room.enemies[0].hp=0;tick(.05);playScenes([{part:'post'}],()=>{});enterRegion('village');`);
 ok('leaving the region flushes the deferred scene first',JSON.stringify(run(g,`log`).filter(r=>r.scenes||r==='enter').map(r=>r.scenes?'scene':r))==='["scene","enter"]',run(g,`log`));}
{const g=world();run(g,`room.activeEncounter='boss';playScenes([{part:'post'}],()=>{});`);ok('only the finalBoss post is deferred',run(g,`log`).some(r=>r.scenes));}
// ④ 연결
const idx=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok('index.html tag before combat-r118',/<script src="\.\/finale-r950\.js"><\/script>[\s\S]*combat-r118\.js/.test(idx));
ok('runtime-inputs lists finale-r950.js',/finale-r950\.js/.test(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8')));
ok('verify list has finale-r950.js',/'finale-r950\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
ok('pages.yml runs this check',/r96\/qa\/r950\/finale-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
console.log(`R950 finale CPU check ${pass}/${total}`);process.exit(pass===total?0:1);
