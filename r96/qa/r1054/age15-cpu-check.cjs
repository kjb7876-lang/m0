// R1054 CPU 검사 — 15세 이용가 기본 연출(사용자 2026-11-15 11:00Z 표·체크리스트: "몬스터 사망 = 어둠으로 소멸·재가 되어 사라짐",
//  "피 = 짧은 혈흔·제한적 피격 효과", "시체 = 천으로 덮거나 실루엣", "숨겨진 챕터·모드까지 동일 기준").
//  ① 15세 정책(age15-r1054.js)이 켜져 있으면 일반 몹 죽음은 찢김·피 터짐·피 웅덩이·조각 사체 없이 몸이 어두워지며 재·연기로 사라진다.
//  ② 사체 대신 옅은 재 자국만 잠깐(≤10초) 남는다. 몸 그림은 사체로 남지 않는다.
//  ③ 몹 피격 피 튐(R190)은 작고 어둡게, 같은 몹 0.6초에 한 번만. 죽을 때 큰 피 터짐은 없다.
//  ④ 설정 창 '몹 죽음 연출'에 찢김(gore) 고르기가 없다. 예전에 저장된 'gore' 도 무시한다.
//  ⑤ 정책이 없으면(옛 단독 검사 환경) 예전 그대로 — 다른 검사가 지킨다. 여기서는 정책 끔일 때 gore 로 돌아가는지만 본다.
//  ⑥ NaN 나이·좌표에도 그리기에 NaN 이 들어가지 않는다.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c,extra)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n,extra===undefined?'':JSON.stringify(extra).slice(0,400));}};
const has=f=>fs.existsSync(path.join(R,'client-source',f));
ok('overlay age15-r1054.js exists',has('age15-r1054.js'));
const A15=has('age15-r1054.js')?C('age15-r1054.js'):'';
for(const f of ['age15-r1054.js','mob-death-r462.js','fx-blood-r190.js'])ok('runtime copy matches source '+f,has(f)&&fs.existsSync(path.join(R,'runtime-text',f))&&C(f)===RT(f));
ok('index.html loads age15-r1054.js once',(RT('index.html').match(/<script src="\.\/age15-r1054\.js"><\/script>/g)||[]).length===1);
ok('no gameplay writes in overlay',!/\.hp\s*=[^=]|damage\s*=|killEnemy\s*\(|saveGame|gainXP|room\.kills/.test(A15));
ok('policy is a fixed default (not a settings toggle)',/on:\s*true/.test(A15)&&!/localStorage/.test(A15));
function env(o={}){const calls=[];const g={window:{},localStorage:{getItem:k=>o.prefs&&/r462/.test(k)?JSON.stringify(o.prefs):null,setItem(){}},setTimeout(){},Date,console,calls,Math,JSON,performance:{now:()=>g.__now*1000},__now:0,fetch:()=>({then:()=>({then:()=>({catch(){}})})})};g.window=g;vm.createContext(g);
 vm.runInContext(`var time=0,zoom=1,settings={lowFx:${!!o.low}},room={id:${JSON.stringify(o.zone||'dist01')}},effects=[],VFX={burnFlame:'assets/vfx/burn.png'};
 var ctx={depth:0,save(){this.depth++;calls.push({k:'save'});},restore(){this.depth--;calls.push({k:'restore'});},translate(x,y){calls.push({k:'translate',x,y});},scale(x,y){calls.push({k:'scale',x,y});},rotate(a){calls.push({k:'rotate',a});},
  beginPath(){calls.push({k:'beginPath'});},moveTo(x,y){calls.push({k:'moveTo',x,y});},lineTo(x,y){calls.push({k:'lineTo',x,y});},closePath(){},clip(){calls.push({k:'clip'});},stroke(){},fill(){},
  ellipse(){},arc(){},fillRect(){},drawImage(im,...a){calls.push({k:'drawImage',src:im.src,a,filter:this.filter,alpha:this.globalAlpha});},globalAlpha:1,filter:'none',strokeStyle:'#000',fillStyle:'#000',lineWidth:1,globalCompositeOperation:'source-over'};
 function project(x,y){return{x:x*10,y:y*10};}function actorHeight(){return 60;}function readyImage(p){return{image:{src:p,naturalWidth:1536,naturalHeight:1024},crop:{w:80,h:100}};}
 function sprite(p,x,y,h,opt){calls.push({k:'sprite',p,x,y,h,opt:opt||{},filter:ctx.filter,alpha:ctx.globalAlpha});return true;}
 function drawAssetFrame3(p,f,x,y,h,opt){if(!f)return false;calls.push({k:'frame',p,x,y,h,opt:opt||{}});return true;}
 function texture(){calls.push({k:'texture'});}
 function drawEnemy(e){sprite(e.drawn,0,0,60,{flip:!!e.flipDraw});}
 function drawBurnDeath3(fx){calls.push({k:'base',p:fx.bodyPath||'none'});}
 function drawObjective(){calls.push({k:'objective'});}
 function drawEffect(){}
 function hitEnemy(e,v){e.hp-=v;return true;}
 function enterRegion(){return 1;}`,g);
 if(o.age15!==false&&A15)vm.runInContext(A15,g);
 vm.runInContext(C('mob-death-r462.js'),g);
 vm.runInContext(C('fx-blood-r190.js'),g);
 return g;}
const g=env(),M=g.__STORYWORLD_MOB_DEATH_R462__,P=g.__STORYWORLD_AGE15_R1054__;
ok('policy global on',!!P&&P.on===true&&/R1054/.test(P.revision||''));
ok('R462 reports ash style under age15',M.inspect().prefs.style==='ash'||M.inspect().style==='ash',M.inspect());
const own=c=>(c.k==='sprite'||c.k==='frame')&&/own-/.test(c.p);
const num=(f,k)=>{const m=new RegExp(k+'\\(([0-9.]+)').exec(f||'');return m?+m[1]:1;};
function run(G,fx,ages){const res=[];for(const a of ages){fx.age=a;G.calls.length=0;vm.runInContext('drawBurnDeath3',G)(fx);res.push({a,calls:G.calls.slice()});}return res;}
const BAD=/boss-corpse-explosion|blood-death|r190\/blood/;
for(const [nm,kind] of [['망각의 거미 1','blood'],['유리 망령','fire']]){
 const e={id:'m-'+kind,name:nm,hp:10,drawn:'assets/r380/mobs/own-'+kind+'.webp'};vm.runInContext('drawEnemy',g)(e);
 const fx={type:'enemyBurnDeath',sourceId:e.id,x:3,y:4,age:0,life:.72,bodyPath:'assets/other/foreign.png'};
 const S=run(g,fx,[.02,.1,.25,.5,.8,1.1,1.6]);
 ok(`${kind}: no blood/gore sheets while dying`,S.every(r=>!r.calls.some(c=>c.k==='drawImage'&&BAD.test(c.src))));
 ok(`${kind}: body never torn (no clip)`,S.every(r=>!r.calls.some(c=>c.k==='clip')));
 ok(`${kind}: own art only`,S.every(r=>!r.calls.some(c=>(c.k==='sprite'||c.k==='frame')&&/foreign/.test(c.p))));
 const dk=S.find(r=>r.a===.5).calls.filter(own);
 ok(`${kind}: body darkened to silhouette by .5s (brightness ≤.25, saturate ≤.3)`,dk.length>=1&&dk.every(c=>num(c.opt.filter||c.filter,'brightness')<=.25&&num(c.opt.filter||c.filter,'saturate')<=.3),dk.map(c=>c.opt.filter));
 const end=S.find(r=>r.a===1.6).calls.filter(own);
 ok(`${kind}: body gone (or alpha ≤.05) by 1.6s`,end.every(c=>(c.opt.alpha??1)<=.05),end.map(c=>c.opt.alpha));
 ok(`${kind}: dark smoke/ash frame sheet drawn (existing sheet, darkened)`,S.some(r=>r.calls.some(c=>c.k==='drawImage'&&/r108\/eden\/smoke|r976\/ash-flakes/.test(c.src)&&num(c.filter,'brightness')<=.35)));
 ok(`${kind}: no engine flame body`,S.every(r=>!r.calls.some(c=>c.k==='base'&&c.p!=='none')));
 ok(`${kind}: life ≥1.1 so ash finishes`,fx.life>=1.1,fx.life);}
// 사체: 몸 그림 없음, 재 자국만, 10초 안에 사라짐
vm.runInContext('time=3',g);g.calls.length=0;vm.runInContext('drawObjective',g)();
ok('corpse: no body art drawn on the ground',!g.calls.some(own),g.calls.filter(own).length);
ok('corpse: only a dark ash mark (pool frame, brightness ≤.2, saturate 0)',g.calls.some(c=>c.k==='drawImage')&&g.calls.filter(c=>c.k==='drawImage').every(c=>num(c.filter,'brightness')<=.2&&/saturate\(0\)/.test(c.filter)),g.calls.filter(c=>c.k==='drawImage').map(c=>c.filter));
vm.runInContext('time=14',g);g.calls.length=0;vm.runInContext('drawObjective',g)();
ok('ash mark gone within 10s',!g.calls.some(c=>c.k==='drawImage'),M.inspect().corpses);
// 불 지역(불탐): 화염벽은 허용, 그래도 찢김·사체 없음
{const G=env({zone:'ep1b07'}),e={id:'f1',name:'망각의 거미 2',hp:3,drawn:'assets/r380/mobs/own-f.webp'};vm.runInContext('drawEnemy',G)(e);
 const fx={type:'enemyBurnDeath',sourceId:'f1',x:1,y:1,age:0,life:.72};const S=run(G,fx,[.1,.4,.8]);
 ok('fire zone: burns (fire wall) but no clip pieces, no blood',S.some(r=>r.calls.some(c=>c.k==='drawImage'&&/boss-fire-wall/.test(c.src)))&&S.every(r=>!r.calls.some(c=>c.k==='clip'||c.k==='drawImage'&&BAD.test(c.src))));}
// 예전에 저장된 gore 도 무시
{const G=env({prefs:{style:'gore'}});ok('stored gore pref ignored under age15',G.__STORYWORLD_MOB_DEATH_R462__.inspect().style==='ash'||G.__STORYWORLD_MOB_DEATH_R462__.inspect().prefs.style==='ash');}
// 정책 끔이면 예전(gore)
{const G=env({age15:false});ok('without policy: old gore default kept',G.__STORYWORLD_MOB_DEATH_R462__.inspect().prefs.style==='gore');}
// 보스는 그대로(엔진)
{const G=env(),fx={type:'enemyBurnDeath',sourceId:'b1',boss:true,x:1,y:1,age:.3,life:1};G.calls.length=0;vm.runInContext('drawBurnDeath3',G)(fx);ok('boss death untouched (engine path)',G.calls.some(c=>c.k==='base'));}
// 설정 창 고르기: gore 없음
ok('settings select has no gore option under age15',/age15|A15/.test(C('mob-death-r462.js'))&&/어둠|재/.test(C('mob-death-r462.js')));
// R190 피 튐
{const G=env(),B=G.__STORYWORLD_BLOOD_R190__;vm.runInContext('fetch',G);
 const e={id:'h1',x:2,y:2,hp:100};const hit=vm.runInContext('hitEnemy',G);
 // meta 를 강제로 채운다(fetch 흉내가 비어 있음)
 ok('R190 exposes age15 policy view',typeof B.inspect().age15==='object',B.inspect());
 const pol=B.inspect().age15||{};
 ok('R190 hit spray small/dark/sparse under age15',pol.on===true&&pol.k<=.45&&pol.alpha<=.6&&pol.interval>=.6&&num(pol.filter,'saturate')<=.6&&num(pol.filter,'brightness')<=.65,pol);
 ok('R190 death burst off under age15',pol.death===false,pol);}
// NaN 안전
{const G=env(),e={id:'n1',name:'망각의 거미 3',hp:3,drawn:'assets/r380/mobs/own-n.webp'};vm.runInContext('drawEnemy',G)(e);
 const fx={type:'enemyBurnDeath',sourceId:'n1',x:2,y:2,age:NaN,life:.72};let threw=false;try{run(G,fx,[NaN,Infinity,-1]);}catch(err){threw=String(err);}
 const bad=G.calls.some(c=>['translate','scale'].includes(c.k)&&!(Number.isFinite(c.x)&&Number.isFinite(c.y))||c.k==='drawImage'&&c.a.some(v=>typeof v==='number'&&!Number.isFinite(v))||own(c)&&!Number.isFinite(+(c.opt.alpha??1)));
 ok('NaN/Infinity age: no throw, no non-finite draw args',!threw&&!bad,threw||G.calls.filter(c=>c.k==='translate').slice(0,3));}
// ---- 서사 4곳 순화(사용자 2026-11-15 11:18Z "4곳 모두 순화 암시정도로") ----
{const has2=has('age15-text-r1054.js');ok('text patch age15-text-r1054.js exists',has2);
 for(const f of ['age15-text-r1054.js','lineart-scenes-r881.js'])ok('runtime copy matches source '+f,has(f)&&fs.existsSync(path.join(R,'runtime-text',f))&&C(f)===RT(f));
 const idx=RT('index.html'),i0=idx.indexOf('story-canon-r106-data.js"'),i1=idx.indexOf('age15-text-r1054.js"'),i2=idx.indexOf('story-canon-r106.js"'),i3=idx.indexOf('samong-text-r103.js"');
 ok('text patch loads after canon data, before story-canon-r106.js copies text and before samong text',i1>i0&&i1<i2&&i1<i3&&i0>0,[i0,i1,i2,i3]);
 const G={window:{}};G.window=G;vm.createContext(G);for(const f of ['story-canon-r106-data.js','samong-text-r103.js'])vm.runInContext(C(f),G);
 const flat=o=>{const out=[];const w=x=>{if(typeof x==='string')out.push(x);else if(x&&typeof x==='object')for(const k of Object.keys(x))w(x[k]);};w(o);return out;};
 const before=flat(G.__STORYWORLD_STORY_CANON_R106__).concat(flat(G.__STORYWORLD_SAMONG_TEXT_R103__));
 const H={window:{}};H.window=H;vm.createContext(H);vm.runInContext(C('story-canon-r106-data.js'),H);if(has2)vm.runInContext(C('age15-text-r1054.js'),H);vm.runInContext(C('samong-text-r103.js'),H);const G0=G;
 ok('samong data still readable through the patch (same frozen object, sections intact)',!!H.__STORYWORLD_SAMONG_TEXT_R103__&&Object.isFrozen(H.__STORYWORLD_SAMONG_TEXT_R103__)&&Object.keys(H.__STORYWORLD_SAMONG_TEXT_R103__.sections).length===Object.keys(G0.__STORYWORLD_SAMONG_TEXT_R103__.sections).length);
 const after=flat(H.__STORYWORLD_STORY_CANON_R106__).concat(flat(H.__STORYWORLD_SAMONG_TEXT_R103__)),all=after.join('\n');
 const BANNED=[/죽은 수호자들의 머리/,/주사기에 손을 대/,/펜타닐이라고 적힌 약병/,/자기 절단의 광경/,/자해의 흉터/,/이름의 글자를 피가 나도록/,/뼈를 꺾어/];
 for(const re of BANNED)ok('patched text no longer has '+re.source,!re.test(all));
 const changed=after.filter((t,i)=>t!==before[i]).length;ok('only the 4 approved paragraphs change (3~6 strings)',changed>=3&&changed<=6,changed);
 ok('patched paragraphs keep the story beat (약병·유혹·흉터·수호자·오열)',/작은 약병/.test(all)&&/유혹을 이기지 못했다/.test(all)&&/오래된 흉터/.test(all)&&/쓰러진 수호자들이 남긴/.test(all)&&/오열했다/.test(all));
 ok('captions kept by lineart remain in patched canon (몸은 약을 원했고…)',/몸은 약을 원했고, 천사는 그 약액을 성수라고 믿게 했다\./.test(all)&&/뿔 끝마다 둥근 것이 매달려 흔들리고 있었다\./.test(all));
 const r881=C('lineart-scenes-r881.js');ok('cutscene captions/labels no longer name the drug or the heads',!/펜타닐/.test(r881)&&!/죽은 수호자들의 머리/.test(r881));
 const P2=has2?vm.runInContext('__STORYWORLD_AGE15_TEXT_R1054__.inspect()',H):{};ok('text patch reports 4 applied, 0 missed',P2.applied===4&&P2.missed===0,P2);}
// ---- R1054-2 "자막이랑 모든것도 맞춰야해": 예전 판 데이터·음성까지 ----
{const idx=RT('index.html');const grab=id=>{const m=new RegExp('<script[^>]*id="'+id+'"[^>]*>([\\s\\S]*?)</script>').exec(idx);return m?m[1]:'';};
 const portable=grab('portable-data'),r54=grab('story-campaign-data-r54'),r75=grab('story-data-r75');
 ok('found the three older story data blocks in index.html',portable.length>1000&&r54.length>1000&&r75.length>1000,[portable.length,r54.length,r75.length]);
 const el={textContent:portable};const K={window:{},document:{getElementById:id=>id==='portable-data'?el:null},TextEncoder};K.window=K;vm.createContext(K);
 vm.runInContext(r54,K);vm.runInContext(r75,K);vm.runInContext(C('story-canon-r106-data.js'),K);
 const OLDRE=[/죽은 수호자들의 머리/,/주사기에 손을 대/,/펜타닐이라는 이름이 적혀/,/펜타닐이라고 적힌/,/고통이 멀어지고/,/이내 고통이 줄어들었다/,/자기 절단의 광경/,/자해의 흉터/];
 ok('older data had the old wording before the patch (test is meaningful)',OLDRE.slice(0,3).every(re=>re.test(portable)&&re.test(JSON.stringify(K.__STORYWORLD_STORY_DATA_R75__))));
 if(has('age15-text-r1054.js'))vm.runInContext(C('age15-text-r1054.js'),K);
 vm.runInContext(C('samong-text-r103.js'),K);vm.runInContext(C('voice-r381-data.js'),K);
 const blob=[el.textContent,JSON.stringify(K.__STORYWORLD_CAMPAIGN_DATA_R54__),JSON.stringify(K.__STORYWORLD_STORY_DATA_R75__),JSON.stringify(K.__STORYWORLD_STORY_CANON_R106__),JSON.stringify(K.__STORYWORLD_SAMONG_TEXT_R103__)].join('\n');
 for(const re of OLDRE)ok('all data sources (portable·R54·R75·canon·samong) free of '+re.source,!re.test(blob));
 ok('portable-data still valid JSON after the patch',(()=>{try{JSON.parse(el.textContent);return true;}catch(_){return false;}})());
 ok('older versions carry the same softened wording',/쓰러진 수호자들이 남긴 흔적이 매달려/.test(blob)&&/끝내 그 유혹을 이기지 못했다/.test(blob));
 const T=K.__STORYWORLD_AGE15_TEXT_R1054__,crypto=require('crypto'),sha=t=>crypto.createHash('sha1').update(t.trim()).digest('hex').slice(0,16);
 ok('sha1 id matches voice-r381 idOf',!!T&&['기억이 거의 남아 있지 않았다.','그것들은 죽은 수호자들의 머리였다.','가나다 abc …'].every(s=>T.idOf(s)===sha(s)));
 const ids=new Set(K.__STORYWORLD_VOICE_R381_DATA__.ids),D0={window:{}};D0.window=D0;vm.createContext(D0);vm.runInContext(C('voice-r381-data.js'),D0);const ids0=new Set(D0.__STORYWORLD_VOICE_R381_DATA__.ids);
 const oldLines=['그것들은 죽은 수호자들의 머리였다.','서랍 깊은 곳에서 펜타닐이라고 적힌 약병을 찾았다.','이내 고통이 줄어들었다.','나는 그 참혹한 자기 절단의 광경을 제단 아래에서 피가 식는 기분으로 올려다보았다.'];
 const recorded=oldLines.filter(s=>ids0.has(sha(s)));
 ok('some old lines had recordings before (test is meaningful)',recorded.length>=2,recorded);
 ok('old-wording recordings are removed from the voice list (never played)',recorded.every(s=>!ids.has(sha(s))),recorded.filter(s=>ids.has(sha(s))));
 ok('unchanged lines keep their recordings',['손끝이 떨리고 혀가 말랐다.','몸은 약을 원했고, 천사는 그 약액을 성수라고 믿게 했다.'].every(s=>!ids0.has(sha(s))||ids.has(sha(s))));
 const removed=[...ids0].filter(i=>!ids.has(i)).length;ok('only a handful of recordings blocked (1..30)',removed>=1&&removed<=30,removed);
 // 서사 창 안전망
 const Q={window:{},TextEncoder,seen:null};Q.window=Q;vm.createContext(Q);vm.runInContext('function playScenes(list){seen=list.map(s=>s.text);}',Q);if(has('age15-text-r1054.js'))vm.runInContext(C('age15-text-r1054.js'),Q);
 vm.runInContext("playScenes([{text:'늪을 지배하는 악마의 뿔에는 죽은 수호자들의 머리가 매달려 있었다.'},{text:'평범한 문장.'}])",Q);
 ok('scene window safety net rewrites old wording, leaves others',Array.isArray(Q.seen)&&!/죽은 수호자들의 머리/.test(Q.seen[0])&&Q.seen[1]==='평범한 문장.',Q.seen);}
// ---- R1054-3 순화 문장 새 녹음(사용자 11:43Z "변경본으로 다시 녹음 및 생성해서 적용") ----
{const lines=fs.readFileSync(path.join(__dirname,'voice-lines.tsv'),'utf8').trim().split('\n').slice(1).map(l=>l.split('\t'));
 const crypto=require('crypto'),sha=t=>crypto.createHash('sha1').update(t.trim()).digest('hex').slice(0,16);
 const D={window:{}};D.window=D;vm.createContext(D);vm.runInContext(C('voice-r381-data.js'),D);const ids=new Set(D.__STORYWORLD_VOICE_R381_DATA__.ids);
 ok('14 softened lines listed with sha1 ids',lines.length===14&&lines.every(([i,t])=>sha(t)===i));
 ok('every softened line now has a recording in the voice list',lines.every(([i])=>ids.has(i)),lines.filter(([i])=>!ids.has(i)).map(l=>l[1]));
 ok('every recording file exists in runtime assets (mp3, 10~150KB)',lines.every(([i])=>{const f=path.join(R,'runtime-text','assets','r381','voice',i+'.mp3');return fs.existsSync(f)&&fs.statSync(f).size>10000&&fs.statSync(f).size<150000;}));
 const K2={window:{},TextEncoder};K2.window=K2;vm.createContext(K2);vm.runInContext(C('story-canon-r106-data.js'),K2);vm.runInContext(C('age15-text-r1054.js'),K2);vm.runInContext(C('samong-text-r103.js'),K2);vm.runInContext(C('voice-r381-data.js'),K2);
 const live=new Set(K2.__STORYWORLD_VOICE_R381_DATA__.ids);ok('new recordings survive the old-wording block (not removed)',lines.every(([i])=>live.has(i)));
 ok('old-wording recordings still blocked',!live.has(sha('그것들은 죽은 수호자들의 머리였다.'))&&!live.has(sha('이내 고통이 줄어들었다.')));}
console.log(`\nR1054 age15: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
