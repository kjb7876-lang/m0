// R292 CPU 검사: 영웅 버튼별 손그림 프레임 이펙트 띠(skill-fx-r292.js + assets/r292/fx).
//  ① 파일·크기(칸 수×384 × 384)·sha256·매니페스트 등록 ② 표(index.json) = 생성 스크립트 ROWS ③ 미카엘라 제외
//  ④ 가짜 엔진에서 동작(basicAttack·blink·special·W/E/R)마다 띠 재생·일반 그림 숨김, 피해·쿨다운·판정은 오버레이 있을 때와 없을 때 같음
//  ⑤ 끄기 ⑥ ctx.filter 안 씀 ⑦ 스크립트 순서·CI 등록.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('assert');
const R=path.join(__dirname,'../..'),ROOT=path.join(R,'..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f));
let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const SRC=C('skill-fx-r292.js');ok(RT('skill-fx-r292.js').toString()===SRC,'runtime copy matches client-source');
const IDX=JSON.parse(RT('assets/r292/fx/index.json'));const T=IDX.effects;
// ① 파일
function webpSize(b){ok(b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP','RIFF/WEBP');const k=b.toString('ascii',12,16);
 if(k==='VP8L'){ok(b[20]===0x2f,'VP8L signature');const v=b.readUInt32LE(21);return{w:(v&0x3fff)+1,h:((v>>14)&0x3fff)+1,lossless:true};}
 if(k==='VP8X'){return{w:(b.readUIntLE(24,3))+1,h:(b.readUIntLE(27,3))+1,lossless:b.indexOf('VP8L')>0};}throw new Error('unexpected webp chunk '+k);}
const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')),rows=new Map(man.files.map(r=>[r.path,r]));
const inputs=JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8'));
let count=0;
for(const [hero,acts] of Object.entries(T))for(const [action,r] of Object.entries(acts)){count++;const rel='assets/r292/fx/'+r.file,b=RT(rel),sz=webpSize(b);
 ok(sz.w===r.frames*384&&sz.h===384&&r.size[0]===sz.w&&r.size[1]===384,`${rel} is ${r.frames}x384 × 384 (got ${sz.w}x${sz.h})`);ok(sz.lossless,rel+' lossless');
 ok(r.frames>=8&&r.frames<=12,rel+' 8~12 frames');ok(crypto.createHash('sha256').update(b).digest('hex')===r.sha256&&b.length===r.bytes,rel+' sha/bytes match index');
 ok(/^[0-9a-f]{64}$/.test(r.sourceSha256)&&/_v[12](_review)?\.png$/.test(r.driveName)&&r.reason==='dots 생성 → 사용자 승인 2026-11-04',rel+' provenance');
 ok(['dir','radial','target'].includes(r.anchor)&&Array.isArray(r.origin)&&r.dur>0&&r.dur<=1.2&&r.scale>0&&['screen','source-over','lighter'].includes(r.blend),rel+' anchor/origin/dur/scale/blend');
 ok(r.anchor!=='radial'||(r.origin[0]===192&&(r.origin[1]===192||r.lift===0)),rel+' radial origin centred (or ground pivot with lift 0)');
 ok(['basic','blink','special','w','e','r'].includes(action),rel+' action key');
 const m=rows.get(rel);ok(m&&m.sha256===r.sha256&&m.bytes===r.bytes&&inputs.textPaths.includes(rel),rel+' in runtime manifest/inputs');}
ok(count===19,'19 approved strips ('+count+')');ok(rows.get('assets/r292/fx/index.json')?.sha256===crypto.createHash('sha256').update(RT('assets/r292/fx/index.json')).digest('hex'),'index.json in manifest');
ok(rows.get('skill-fx-r292.js')?.sha256===crypto.createHash('sha256').update(RT('skill-fx-r292.js')).digest('hex'),'overlay in manifest');
// ② 생성 스크립트 ROWS = index
const PY=fs.readFileSync(path.join(ROOT,'scripts','r292-fx-strips.py'),'utf8');
for(const [hero,acts] of Object.entries(T))for(const [action,r] of Object.entries(acts))ok(PY.includes(`('${hero}', '${action}', `)&&PY.includes(r.sourceSha256),`generator row ${hero}/${action}`);
const want={gunner:['w','e','r','blink'],hwando:['basic','blink','special','w','e','r'],seoha:['basic','w','e'],neon:['basic','special','blink','w'],lauren:['basic','blink']};
ok(JSON.stringify(Object.fromEntries(Object.entries(T).map(([h,a])=>[h,Object.keys(a).sort()])))===JSON.stringify(Object.fromEntries(Object.entries(want).map(([h,a])=>[h,[...a].sort()]))),'table = approved list');
// ③ 미카엘라
ok(!T.michaela,'no michaela strips in index');ok(/h==='michaela'\)return null/.test(SRC),'overlay refuses michaela');
// ⑥ 필터
const CODE=SRC.split('\n').filter(l=>!/^\s*\/\//.test(l)).join('\n');ok(!/ctx\.filter|drop-shadow|blur\(/.test(CODE),'no ctx.filter / drop-shadow / blur');
ok(!/hitEnemy\s*=|attackCD\s*=|blinkCD\s*=|specialCD\s*=|\.ready\[|attackPower\s*=/.test(CODE),'no damage/cooldown assignments in overlay');
// ⑦ 순서·등록
const html=RT('index.html').toString();ok(/<script src="\.\/skill-fx-r292\.js"><\/script>(<script src="\.\/hero-palette-r302\.js"><\/script>)?(<script src="\.\/terrain-readability-r323\.js"><\/script>(?:<script src="\.\/prop-shadow-r329\.js"><\/script>)?(?:<script src="\.\/disaster-r330\.js"><\/script>)?(?:<script src="\.\/mob-foot-r332\.js"><\/script>)?(?:<script src="\.\/hud-bossbar-r334\.js"><\/script>)?(?:<script src="\.\/hero-facing-r336\.js"><\/script>)?(?:<script src="\.\/samong-gate-r338\.js"><\/script>)?(?:<script src="\.\/hud-menu-r339\.js"><\/script>)?(?:<script src="\.\/enemy-hexagram-r341\.js"><\/script>)?(?:<script src="\.\/hwando-arc-r349\.js"><\/script>)?(?:<script src="\.\/wave-orphans-r352\.js"><\/script>)?(?:<script src="\.\/slayer-r351\.js"><\/script>)?(?:<script src="\.\/bgm-pick-r353\.js"><\/script>)?(?:<script src="\.\/hwando-w-cross-r348\.js"><\/script>)?(?:<script src="\.\/hero-visibility-r350\.js"><\/script>)?(?:<script src="\.\/samong-wide-r355\.js"><\/script>)?(?:<script src="\.\/kairo-homage-r356\.js"><\/script>)?(?:<script src="\.\/perf-r360\.js"><\/script>)?(?:<script src="\.\/mob-legacy-r363\.js"><\/script>)?(?:<script src="\.\/mob-legacy-r363\.js"><\/script>)?(?:<script src="\.\/guide-fragment-r365\.js"><\/script>)?(?:<script src="\.\/perf-r367\.js"><\/script>)?(?:<script src="\.\/slayer-r-tornado-r366\.js"><\/script>)?(?:<script src="\.\/betrayal-video-r368\.js"><\/script><script src="\.\/poison-city-video-r369\.js"><\/script>)?(?:<script src="\.\/cinema-mode-r370\.js"><\/script>)?(?:<script src="\.\/root-gate-video-r372\.js"><\/script>)?)?\s*<script src="\.\/combat-r118\.js">/.test(html),'script tag is the last overlay before combat-r118');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r292/r292-cpu-check.cjs'),'CI step');
ok(fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'skill-fx-r292.js'"),'public verify list');
// ④ 가짜 엔진
const ENGINE=`var time=0,started=true,modal=false,loading=false,TILE=32,zoom=1,W=800,H=600,effects=[],dealt=[],cds=[];
var VFX={slash:'v/slash',flare:'v/flare',blink:'v/blink',burst:'v/burst',glitch:'v/glitch'};
var player={hero:'hwando',x:5,y:5,hp:100,combo:0,attackCD:0,blinkCD:0,specialCD:0,direction:'front'};
var foe={x:8,y:5,hp:999};
function project(x,y){return{x:(x-y)*TILE*zoom+W/2,y:(x+y)*TILE*.5*zoom+H*.52}}
function actorHeight(){return 66*zoom}
function storyAim22(){return 0}function nearestEnemy(){return foe}
function readyImage(p){return{image:{p,naturalWidth:3072,naturalHeight:384},ready:true}}function ensureImages(){return Promise.resolve(1)}
function fx(type,x,y,opt={}){effects.push({type,x,y,age:0,life:.45,...opt})}
function makeShot(x,y,a){dealt.push(['shot',a])}
function hitEnemy(e,v){dealt.push(v);return true}
function basicAttack(){if(player.attackCD>0)return;const a=Math.atan2(foe.y-player.y,foe.x-player.x);player.combo++;player.attackCD=.48;
 if(player.hero==='seoha')makeShot(player.x,player.y,a,12,30);else{fx('slash',player.x,player.y,{asset:VFX.slash,angle:a,size:3.15,life:.3});hitEnemy(foe,36);}}
function blink(){if(player.blinkCD>0)return;const old={x:player.x,y:player.y};player.x+=2.7;player.y-=2.7;player.blinkCD=4;fx('ghost',old.x,old.y,{life:.45});fx('sigil',player.x,player.y,{asset:VFX.blink,size:1.3,life:.4})}
function special(){if(player.specialCD>0)return;player.specialCD=10;fx('slash',player.x,player.y,{asset:VFX.flare,angle:0,size:4.2,life:.3});hitEnemy(foe,90)}
function cue(slot,stage,x,y,opt={}){fx('storySourceSkill',x,y,{asset:'src/'+slot,storyWER:true,castId:'wer:'+player.hero+':'+slot,sourceSlot:slot,sourceHero:player.hero,visualWorldAngle35:Math.PI/2,stage,...opt})}
var drawn=[];function drawEffect(e){drawn.push(e.type)}
function tick(dt){time+=dt;for(const k of ['attackCD','blinkCD','specialCD'])player[k]=Math.max(0,player[k]-dt)}
async function enterRegion(){}
var calls=[];var ctx={save(){},restore(){},translate(x,y){calls.push(['t',x,y])},rotate(a){calls.push(['r',a])},scale(a,b){calls.push(['s',a,b])},drawImage(im,sx,sy,sw,sh){calls.push(['d',im.p,sx,sy,sw,sh])},set globalCompositeOperation(v){calls.push(['b',v])}};`;
const SCEN=`basicAttack();tick(.5);blink();special();cue('w','warning',player.x,player.y);cue('w','release',player.x,player.y);cue('e','flight',player.x,player.y,{tx:player.x+3,ty:player.y});cue('r','warning',player.x,player.y);cue('w','hit',foe.x,foe.y);`;
function world(withOverlay,store={}){const c={window:{},Math,JSON,Object,Array,String,Number,Promise,Date,Map,Set,console,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},
 fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve(IDX)})};c.window=c;vm.createContext(c);vm.runInContext(ENGINE,c);if(withOverlay)vm.runInContext(SRC,c);return c;}
const run=(c,s)=>vm.runInContext(s,c);const settle=()=>new Promise(r=>setImmediate(r));
(async()=>{
 const a=world(false),b=world(true);await settle();const X=b.__STORYWORLD_SKILL_FX_R292__;ok(X.inspect().ready&&X.table().hwando.basic.frames===8,'index loaded into table');
 for(const hero of ['hwando','seoha','neon','lauren','gunner','michaela']){
  for(const c of [a,b])run(c,`player.hero='${hero}';player.attackCD=player.blinkCD=player.specialCD=0;dealt=[];effects=[];`+SCEN);
  ok(JSON.stringify(run(a,'[dealt,player.attackCD,player.blinkCD,player.specialCD,player.x,player.y,player.combo]'))===JSON.stringify(run(b,'[dealt,player.attackCD,player.blinkCD,player.specialCD,player.x,player.y,player.combo]')),hero+': damage, cooldowns, position identical with overlay');
  ok(run(a,'effects.length')===run(b,"effects.filter(e=>e.type!=='r292-skill-fx').length"),hero+': generic effect objects still created (hooks downstream still fire)');}
 // plays per hero
 const plays=X.inspect().stats.plays;
 for(const [h,acts] of Object.entries(want))for(const act of acts){if(h+':'+act==='lauren:basic'){ok(!plays['lauren:basic'],'R304: lauren basic strip off');continue;}ok(plays[h+':'+act]>=1,`played ${h}:${act}`);}
 ok(!Object.keys(plays).some(k=>k.startsWith('michaela:')),'michaela never plays');ok(!plays['gunner:basic']&&!plays['seoha:blink'],'no strip → no play');
 const sup=X.inspect().stats.suppressed;ok(sup['basic-slash']>=1&&sup['blink-sigil']>=1&&sup['special-flare']>=1&&sup['wer-w-warning']>=1&&sup['wer-e-flight']>=1,'generic duplicates suppressed: '+JSON.stringify(sup));
 // Codex #195: strip image not decoded yet → keep the generic effect (no suppression, nothing lost)
 {const c=world(true);await settle();run(c,`readyImage=()=>null;player.hero='hwando';player.attackCD=0;effects=[];basicAttack();drawn=[];for(const e of effects)drawEffect(e)`);
  const s2=c.__STORYWORLD_SKILL_FX_R292__.inspect().stats.suppressed;ok(!(s2['basic-slash']>0),'no suppression while strip image not ready: '+JSON.stringify(s2));
  ok(run(c,"drawn.includes('slash')"),'generic slash still drawn while strip image not ready');}
 // 'hit' stage kept
 run(b,`player.hero='hwando';effects=[];cue('w','hit',1,1);drawn=[];for(const e of effects)drawEffect(e)`);ok(run(b,'drawn').includes('storySourceSkill'),'storySourceSkill hit stage still drawn');
 // drawing: frame advance, crop, rotation, anchor
 run(b,`time+=3;tick(0);player.hero='hwando';player.x=5;player.y=5;foe.x=8;foe.y=5;player.attackCD=0;effects=[];calls=[];basicAttack();`);const e1=run(b,`effects.find(e=>e.type==='r292-skill-fx')`);ok(!!e1,'sentinel effect armed');
 run(b,`calls=[];drawEffect(effects.find(e=>e.type==='r292-skill-fx'))`);let d=run(b,'calls').filter(c=>c[0]==='d').pop();ok(d&&/assets\/r292\/fx\/hwando\/basic\.webp$/.test(d[1])&&d[2]===0&&d[4]===384&&d[5]===384,'frame 0 crop from strip');
 const t0=run(b,'calls').find(c=>c[0]==='t'),q=run(b,'project(5,5)');ok(Math.abs(t0[1]-q.x)<1e-9&&Math.abs(t0[2]-(q.y-66*.3))<1e-9,'anchored at hero body height');
 const rot=run(b,'calls').find(c=>c[0]==='r');const p2=run(b,'project(6,5)');ok(Math.abs(rot[1]-Math.atan2(p2.y-q.y,p2.x-q.x))<1e-9,'rotated to screen aim angle');
 run(b,`time+=.16;calls=[];drawEffect(effects.find(e=>e.type==='r292-skill-fx'))`);d=run(b,'calls').filter(c=>c[0]==='d').pop();ok(d[2]===4*384,'frame advances (t=.16/.30 → frame 4)');
 run(b,`time+=.2;tick(0)`);ok(X.inspect().active.length===0,'finished strip removed');
 // left-facing → mirrored, path fit
 run(b,`foe.x=2;foe.y=5;player.attackCD=0;calls=[];basicAttack();drawEffect(effects.find(e=>e.type==='r292-skill-fx'))`);const s=run(b,'calls').find(c=>c[0]==='s');ok(s[2]<0&&s[1]>0,'left aim mirrored vertically');
 // ground pivot (neon W: origin (192,290), lift 0 → pivot at the feet)
 run(b,`time+=30;tick(0);player.hero='neon';player.x=5;player.y=5;calls=[];window.__STORYWORLD_SKILL_FX_R292__.play('neon','w',{x:5,y:5});time+=.2;drawEffect(effects.find(e=>e.type==='r292-skill-fx'))`);
 {const tr=run(b,'calls').find(c=>c[0]==='t'),q2=run(b,'project(5,5)'),dd=run(b,'calls').find(c=>c[0]==='d');ok(Math.abs(tr[2]-q2.y)<1e-9&&Math.abs(tr[1]-q2.x)<1e-9,'neon W pivot at feet (lift 0)');ok(/neon\/w\.webp$/.test(dd[1]),'neon W strip drawn');}
 run(b,`time+=30;tick(0);player.hero='hwando';foe.x=8;foe.y=5;`);
 // cap
 run(b,`for(let i=0;i<30;i++){player.attackCD=0;basicAttack();}`);ok(X.inspect().active.filter(e=>e.key==='hwando:basic').length<=2&&X.inspect().active.length<=8,'concurrency capped');
 // ⑤ 끄기
 const store={};const c2=world(true,store);await settle();c2.__STORYWORLD_SKILL_FX_R292__.set(false);ok(store['storyworld.r292.fx']==='{"on":false}','toggle persisted');
 run(c2,`player.hero='hwando';`+SCEN);ok(Object.keys(c2.__STORYWORLD_SKILL_FX_R292__.inspect().stats.plays).length===0,'off: no plays');
 run(c2,`drawn=[];for(const e of effects)drawEffect(e)`);ok(run(c2,'drawn').filter(t=>t==='slash').length===2&&run(c2,'drawn').includes('sigil'),'off: generic effects drawn');
 const c3=world(true,{'storyworld.r292.fx':'{"on":false}'});await settle();ok(!c3.__STORYWORLD_SKILL_FX_R292__.on(),'stored off respected on load');
 // R269 still owns michaela; R269 untouched
 ok(!/michaela/.test(JSON.stringify(IDX)),'index has no michaela');
 console.log('R292 CPU check: '+n+' checks passed');
})().catch(e=>{console.error(e);process.exit(1);});

assert.ok(fs.readFileSync(path.join(__dirname,"../../runtime-text/index.html"),"utf8").includes('<script src="./hud-bgm-hwando-w-r313.js"></script><script src="./maps-palace-slum-r317.js"></script><script src="./save-transition-r320.js"></script><script src="./bgm-map-r308.js"></script><script src="./mobile-perf-r298.js"></script>'),"R313 registered before R298; late hook waits for R292");
