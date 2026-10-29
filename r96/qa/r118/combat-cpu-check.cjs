// R118 CPU check: 병원 동작 시트 정리본, 체력 곡선, 보스 기술 순환·상태이상 바닥, 영웅 방향 안정, 프레임당 틱 상한,
// 영웅 기본 광역, 길잡이 전투 위주 자동 진행, Drive 보스 회전 무기.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'client-source'),RT=path.join(ROOT,'runtime-text');
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+String(detail).slice(0,300)));};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),png=b=>[b.readUInt32BE(16),b.readUInt32BE(20)];

// ---- 자산 -------------------------------------------------------------------------------------------
const clean=JSON.parse(fs.readFileSync(path.join(RT,'assets/r118/clean/index.json'),'utf8'));
check('5 cleaned hospital sheets, recorded sha, same size, smaller than originals',clean.files.length===5&&clean.files.every(f=>{const b=fs.readFileSync(path.join(RT,'assets/r118/clean',f.path));return sha(b)===f.cleanSha256&&b.length===f.cleanBytes&&f.cleanBytes<f.sourceBytes&&f.faintPixelsCleared>0;}));
check('boss sheet cleared 276,924 faint pixels',clean.files.find(f=>f.path.endsWith('hospital-boss-motion-r53.png'))?.faintPixelsCleared===276924);
const drive=JSON.parse(fs.readFileSync(path.join(RT,'assets/r118/drive/index.json'),'utf8'));
check('8 Drive weapon/manifest images with provenance; Mammon atlas held',drive.tracks.length===8&&drive.tracks.every(t=>{const b=fs.readFileSync(path.join(RT,t.path));return sha(b)===t.sha256&&/^[0-9a-f]{64}$/.test(t.sourceSha256)&&png(b).join('x')===t.size.join('x')&&b.length<200000;})&&drive.hold.some(h=>h.id==='mammon-atlas-512'));

// ---- 모래상자 ----------------------------------------------------------------------------------------
const code=fs.readFileSync(path.join(SRC,'combat-r118.js'),'utf8');
function sandbox(){
 const calls={urls:[],prepare:[],beginMotion:[],shots:[],drawHazard:[],drawProj:[],drawImage:[],hits:[],adv:0,base:[]};
 const sb={console,Math,JSON,Set,Map,WeakMap,Object,Array,Number,String,Boolean,Error,Promise,Date,isFinite,
  performance:{now:()=>sb.__now||0},localStorage:{getItem:()=>null,setItem:()=>{}},requestAnimationFrame:()=>0,setInterval:f=>{sb.__interval=f;return 1;},
  document:{getElementById:()=>null,querySelector:()=>null},calls};
 sb.window=sb;sb.time=0;sb.started=true;sb.loading=false;sb.modal=false;sb.auto=false;sb.guide=false;sb.target=null;sb.storyScene=null;
 sb.player={x:10,y:10,hp:100,maxHp:100,hero:'gunner',level:1,upgrades:{},attackAnim:0,skillAnim:0,ultimateAnim:0};
 sb.room={id:'dist03',engaged:true,enemies:[]};
 sb.regionById={dist00:{index:1,paths:[],bosses:[{id:'dist00-boss'}]},dist01:{index:2,paths:[],bosses:[],midboss:{id:'mb-dist01'}},ep1a08:{index:8,paths:[],bosses:[]},cult04:{index:62,paths:[],bosses:[]},dist03:{index:4,paths:[]}};
 sb.cleanPath=p=>p;sb.urlFor=p=>{calls.urls.push(p);return'/'+p;};
 sb.makeRoom=(id)=>({id,enemies:[{id:'b',boss:true,hp:11066,maxHp:11066},{id:'m',hp:473,maxHp:473},{id:'p',persona:true,boss:true,hp:100,maxHp:100}]});
 sb.tick=function(){calls.base.push('tick');};sb.frame=function(){for(let i=0;i<6;i++)sb.tick(1/60);};
 sb.enterRegion=async()=>true;sb.restoreSave=async()=>true;sb.showSettings=()=>{};
 sb.clearLine=()=>true;sb.readyImage=p=>({image:{naturalWidth:200,naturalHeight:50}});sb.addImage=()=>({promise:Promise.resolve()});sb.register=()=>{};sb.imageInventory=new Set();sb.portable={runtimeAssetHashes:{},assetExists:{},assetMap:{assets:[]}};
 sb.project=(x,y)=>({x:x*10,y:y*10});sb.actorHeight=()=>100;sb.shadow=()=>{};sb.drawImage=(p,...a)=>{calls.drawImage.push(p);return true;};sb.ctx={};sb.sound=()=>{};
 sb.drawHazard=function(h){calls.drawHazard.push(h.type);};sb.drawProjectile=function(p){calls.drawProj.push('base');};
 sb.makeShot=(x,y,a,s,d,o)=>{const p={id:calls.shots.length+1,x,y,asset:o.asset,damage:d};calls.shots.push(p);return p;};
 sb.hitEnemy=function(e,v,s){calls.hits.push([e.id,Math.round(v),s?.kind||null]);e.hp-=v;return true;};
 sb.advanceScene=()=>{calls.adv++;sb.storyScene=null;};
 const actions=new Map();
 sb.__STORYWORLD_FIELDS_R61__={prepare:(e,k)=>{calls.prepare.push(e.id+':'+k);return{kind:k};},activeAction:e=>actions.get(e)||null,state:e=>(e.__r61??={next:0}),
  beginMotion:(e,kind,o)=>{const a={kind,room:sb.room,o};calls.beginMotion.push(kind);return a;}};
 sb.__STORYWORLD_BOSS_FIELDS_R62__={prepare:e=>{calls.prepare.push(e.id+':siege');return{kind:'siege'};},ownerState:e=>(e.__r62??={next:0})};
 sb.__STORYWORLD_CURRENT_HERO__={direction:(p,state,fb)=>'base:'+fb};
 sb.__STORYWORLD_HERO_FX_R102__={tier:()=>0};
 sb.__STORYWORLD_PROGRESSION_R71__={difficultyState:()=>({open:sb.__diffOpen,selected:'hard'}),selectDifficulty:k=>{sb.__diffSel=k;},confirmDifficulty:()=>{sb.__diffOpen=false;}};
 vm.createContext(sb);vm.runInContext(code,sb,{filename:'combat-r118.js'});return sb;}
const foe=(id,x,y,o={})=>({id,x,y,hp:100,maxHp:100,spawnState:'active',radius:.3,damage:10,...o});

(async()=>{
 const sb=sandbox(),C=sb.__STORYWORLD_COMBAT_R118__;
 check('defaults: director/facing/perf/splash/balance on, combat run off',JSON.stringify(C.prefs())===JSON.stringify({director:true,facing:true,perf:true,splash:true,balance:true,combatRun:false}));
 sb.urlFor('assets/visual-test/hospital-boss-motion-r53.png');sb.urlFor('assets/visual-test/hospital-floor-material-atlas.png');
 check('only the 5 cleaned sheets are redirected; originals untouched elsewhere',sb.calls.urls[0]==='assets/r118/clean/assets/visual-test/hospital-boss-motion-r53.png'&&sb.calls.urls[1]==='assets/visual-test/hospital-floor-material-atlas.png'&&C.clean().length===5);

 // ⑦ 체력 곡선
 const maj=[],min=[];for(let i=1;i<=62;i++){maj.push(C.hpCurve(i,true));min.push(C.hpCurve(i,false));}
 check('curve: first root boss .42, ep1a08 unchanged 1.0, rises every region after',Math.abs(maj[0]-.42)<1e-9&&Math.abs(maj[7]-1)<1e-9&&maj.every((v,i)=>i===0||v>maj[i-1])&&min.every((v,i)=>i===0||v>min[i-1])&&maj[61]>1.2&&min[0]===.7);
 const r0=sb.makeRoom('dist00');
 check('dist00 room: stored HP untouched (native contract), toughness k .42 boss / .70 mob, persona none',r0.enemies[0].maxHp===11066&&r0.enemies[0].hp===11066&&r0.enemies[1].maxHp===473&&Math.abs(r0.enemies[0].r118Hp-.42)<1e-9&&Math.abs(r0.enemies[1].r118Hp-.7)<1e-9&&r0.enemies[2].r118Hp===undefined,JSON.stringify(r0.enemies.map(e=>[e.maxHp,e.r118Hp])));
 {sb.calls.hits.length=0;const b=r0.enemies[0];sb.hitEnemy(b,420,{friendly:true,kind:'probe'});const r62=sb.makeRoom('cult04').enemies[0];sb.hitEnemy(r62,1000,{friendly:true,kind:'probe'});C.set({balance:false});const r1=sb.makeRoom('dist00').enemies[0];sb.hitEnemy(r1,420,{friendly:true,kind:'probe'});C.set({balance:true});
  check('hit on dist00 boss counts 1/.42 (420 → 1,000 = 11,066 effective → 4,648); cult04 boss takes less; balance off = native',b.hp===10066&&r62.hp>11066-1000&&r1.hp===11066-420,JSON.stringify([b.hp,r62.hp,r1.hp]));}
 check('unknown/unindexed rooms unchanged',sb.makeRoom('sz115-S01-1').enemies[0].maxHp===11066);

 // ② 보스 기술 순환
 const b=foe('mb-ep1a08',10,12,{midboss:true,nativeId:'mb-ep1a08'});sb.room={id:'ep1a08',engaged:true,enemies:[b]};
 for(let t=0;t<=40;t+=.25){sb.time=t;sb.tick(1/60);}
 const kinds=sb.calls.prepare.filter(x=>x.startsWith('mb-ep1a08')).map(x=>x.split(':')[1]);
 check('hospital boss rotates siege(독병)·field·echo·prop with siege every other cast',kinds.length>=8&&kinds.filter(k=>k==='siege').length>=kinds.length*.35&&new Set(kinds).size===4,kinds.join(','));
 check('cast gap 2.6–4.4 s (about 9–15 casts per 40 s)',kinds.length>=9&&kinds.length<=16,kinds.length);
 check('native R61/R62 schedules pushed behind the rotation',b.__r61.next>sb.time&&b.__r62.next>sb.time);
 sb.calls.prepare.length=0;sb.room.engaged=false;for(let t=41;t<50;t+=.25){sb.time=t;sb.tick(1/60);}check('no casts outside an engaged fight',sb.calls.prepare.length===0);
 sb.room.engaged=true;sb.window.__STORYWORLD_COOP_SIM_R62__={mode:()=>'host'};for(let t=50;t<60;t+=.25){sb.time=t;sb.tick(1/60);}check('no casts in co-op (host owns judgement)',sb.calls.prepare.length===0);delete sb.window.__STORYWORLD_COOP_SIM_R62__;
 sb.calls.drawHazard.length=0;sb.drawHazard({type:'field',r62Field:{},r62Tag:'pollution'});sb.drawHazard({type:'field',owner:'x'});
 check('status fields: original ground drawn first, then the boss-colour field; plain fields once',JSON.stringify(sb.calls.drawHazard)===JSON.stringify(['r118-status-ground','field','field']));

 // ⑧ Drive 무기
 const w=foe('mb-dist01',10,12,{midboss:true,nativeId:'mb-dist01'});sb.room={id:'dist01',engaged:true,enemies:[w]};sb.calls.prepare.length=0;sb.calls.beginMotion.length=0;
 for(let t=60;t<90;t+=.25){sb.time=t;sb.tick(1/60);}
 check('보라검천사 throws its violet sword in the rotation (beginMotion prop windup)',sb.calls.beginMotion.length>=3,sb.calls.beginMotion.length);
 const a={room:sb.room};const begin=sb.__STORYWORLD_FIELDS_R61__.beginMotion;let last=null;sb.__STORYWORLD_FIELDS_R61__.beginMotion=(e,k,o)=>(last=begin(e,k,o));
 sb.calls.shots.length=0;sb.time=95;w.__dummy=1;
 // 직접 한 번 던져 투사체 확인
 const st=JSON.parse(JSON.stringify(C.inspect().stats.casts));
 for(let t=95;t<110&&!sb.calls.shots.length;t+=.25){sb.time=t;sb.tick(1/60);if(last?.onRelease){last.onRelease();last=null;}}
 const shot=sb.calls.shots[0];
 check('release makes an enemy shot with the Drive sword art',shot&&shot.asset==='assets/r118/drive/violet-sword.png'&&shot.r118Weapon?.mode==='spin'&&shot.damage===7,JSON.stringify(shot));
 sb.calls.drawImage.length=0;sb.drawProjectile(shot);sb.drawProjectile({id:9});
 check('weapon shots are drawn with their own spinning art; other shots untouched',sb.calls.drawImage[0]==='assets/r118/drive/violet-sword.png'&&sb.calls.drawProj.includes('base'));
 check('사탄 has the three wrath manifests, 루시퍼 the mask shard',(()=>{const t=JSON.parse(fs.readFileSync(path.join(RT,'assets/r118/drive/index.json'),'utf8')).tracks;return t.filter(x=>x.owner==='b07-boss').length===3&&t.find(x=>x.id==='lucifer-shard').owner==='a11-boss';})());

 // ③ 영웅 방향
 const H=sb.__STORYWORLD_CURRENT_HERO__;sb.window.__STORYWORLD_COOP_SIM_R62__=undefined;
 const L=foe('L',7,7.2),R=foe('R',13.5,13.8);sb.room={id:'dist03',engaged:true,enemies:[L,R]};sb.player.x=10;sb.player.y=10;sb.auto=true;
 const seq=[];for(let i=0;i<60;i++){sb.time=100+i/30;L.x=7+((i%2)?.15:-.15);seq.push(H.direction(sb.player,'idle','front'));}
 check('jittering foe: one stable facing for 2 s (no 도리도리)',new Set(seq).size===1,[...new Set(seq)].join(','));
 sb.room.enemies=[R];const after=[];for(let i=0;i<20;i++){sb.time=103+i/30;after.push(H.direction(sb.player,'idle','front'));}
 check('foe really on the other side: turns once and stays',new Set(after.slice(3)).size===1&&after.at(-1)!==seq[0],after.join(','));
 check('attack frames get an 8-way sector for gunner, 4-way for swords',/^(e|se|s|sw|w|nw|n|ne)$/.test(H.direction(sb.player,'attack','front'))&&(sb.player.hero='hwando',['left','right','front','back'].includes(H.direction(sb.player,'attack','front'))));
 sb.room.enemies=[];sb.auto=false;check('no foe: native direction',H.direction(sb.player,'move','left')==='base:left');sb.player.hero='gunner';

 // ④ 프레임당 틱 상한
 sb.calls.base.length=0;sb.frame(0);const inFrame=sb.calls.base.length;sb.calls.base.length=0;for(let i=0;i<6;i++)sb.tick(1/60);
 check('inside a frame at most 3 ticks; direct tick calls unlimited',inFrame===3&&sb.calls.base.length===6,inFrame+'/'+sb.calls.base.length);
 C.set({perf:false});sb.calls.base.length=0;sb.frame(0);check('perf off: native 6',sb.calls.base.length===6);C.set({perf:true});

 // ⑥ 영웅 기본 광역
 const t0=foe('t0',20,20),t1=foe('t1',20.5,20),t2=foe('t2',21.1,20),far=foe('far',26,20);sb.room={id:'dist03',engaged:true,enemies:[t0,t1,t2,far]};sb.calls.hits.length=0;sb.time=200;
 sb.hitEnemy(t0,100,{friendly:true,attackKind9:'basic'});
 const sp=sb.calls.hits.filter(h=>h[2]==='hero-splash-r118');
 check('basic hit splashes 20% (기억사수 특성 ×1.15 = 23) to neighbours inside the radius only',sp.length===1&&sp[0][0]==='t1'&&sp[0][1]===23,JSON.stringify(sb.calls.hits));
 sb.calls.hits.length=0;sb.time=201;sb.__STORYWORLD_HERO_FX_R102__.tier=()=>6;sb.player.level=50;
 sb.hitEnemy(t0,100,{friendly:true,attackKind9:'skill'});const sp2=sb.calls.hits.filter(h=>h[2]==='hero-splash-r118');
 check('tier 6 skill: wider and stronger (reaches 1.1 tiles, > 50%)',sp2.length===2&&sp2.every(h=>h[1]>50),JSON.stringify(sp2));
 sb.calls.hits.length=0;sb.time=202;sb.hitEnemy(t0,100,{kind:'samong-line'});sb.hitEnemy(t0,100,{friendly:false});
 check('no splash from 사몽선 or hostile sources',sb.calls.hits.every(h=>h[2]!=='hero-splash-r118'));

 // ⑤ 전투 위주 자동 진행
 sb.storyScene={key:'a'};sb.__diffOpen=true;sb.__now=10000;sb.tick(1/60);
 check('combat run off: scenes and difficulty left alone',sb.calls.adv===0&&sb.__diffOpen===true);
 C.set({combatRun:true});sb.__now=20000;sb.tick(1/60);
 check('combat run on: scene skipped, current difficulty confirmed, guide+auto on',sb.calls.adv===1&&sb.storyScene===null&&sb.__diffOpen===false&&sb.__diffSel==='hard'&&sb.guide===true&&sb.auto===true);
 sb.storyScene={key:'b'};sb.__now=30000;sb.__interval();check('scenes opened while paused are skipped by the timer too',sb.storyScene===null);

 check('no runtime errors',C.inspect().stats.errors===0,C.inspect().stats.lastError);
 const html=fs.readFileSync(path.join(RT,'index.html'),'utf8'),ver=fs.readFileSync(path.join(ROOT,'..','scripts','verify-r96-public.py'),'utf8');
 check('runtime copy matches source, loaded last in index.html, in the public verify list',fs.readFileSync(path.join(RT,'combat-r118.js'),'utf8')===code&&/combat-r118\.js"><\/script>\s*$/.test(html)&&ver.includes("'combat-r118.js'")&&ver.includes("'assets/r118/'"));
 const r78=fs.readFileSync(path.join(SRC,'world-combat-r78.js'),'utf8');check('R78 region check cached per region',r78.includes('plainRegion')&&fs.readFileSync(path.join(RT,'world-combat-r78.js'),'utf8')===r78);
 console.log(`\n${n-failed}/${n} passed`);process.exit(failed?1:0);})().catch(e=>{console.log('FAIL crashed',e);process.exit(1);});
