// R972 CPU 검사: 영웅 스킬을 종류에 맞게 지속 피해(도트)·다단히트로 나누고 틱·타 효과음을 낸다(사용자 2026-11-13 00:50Z
// "스킬종류에 맞게 도트,다단히트도 넣어서 다양한 느낌들게 그거에 맞게 효과음도 들어가고").
// 총피해는 지금과 같게(나눌 뿐), 막타는 나누지 않음, 분류 밖 스킬·평타·패시브는 그대로, 소리는 종류마다 간격 제한.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const F='skill-style-r972.js';const exists=fs.existsSync(path.join(R,'client-source',F));ok(F+' exists',exists);
const TYPES=['burn','poison','bleed','shock','holy','slash','gravity','echo'];
for(const t of TYPES)for(const i of [1,2])ok('sound file '+t+'-'+i+'.ogg (ElevenLabs, scripts/build-sfx-r972.py)',fs.existsSync(path.join(R,'runtime-text','assets','r972','sfx',t+'-'+i+'.ogg')));
if(exists){
 const src=C(F);
 ok('runtime copy matches source',fs.existsSync(path.join(R,'runtime-text',F))&&src===RT(F));
 try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
 const h=RT('index.html');
 ok('script tag once',h.split('<script src="./'+F+'"></script>').length===2);
 ok('loads after survival-passives-r962 (outside every hitEnemy wrapper) and before combat-r118',(()=>{const i=h.indexOf('./'+F+'"');return i>h.indexOf('./survival-passives-r962.js"')&&i>h.indexOf('./slayer-blood-passive-r947.js"')&&i<h.indexOf('<script src="./combat-r118.js"');})());
 ok('listed in verify-r96-public.py',new RegExp("'"+F.replace(/\./g,'\\.')+"'").test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
 ok('CI runs this check',/qa\/r972\/r972-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
 {const inp=JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8')));ok('in runtime-inputs.json (js + 16 sounds)',inp.includes(F)&&TYPES.every(t=>inp.includes('assets/r972/sfx/'+t+'-1.ogg')&&inp.includes('assets/r972/sfx/'+t+'-2.ogg')));}
 ok('no new key bindings',!/addEventListener\(\s*['"]key/.test(src));
 ok('no save writes / hero hp writes',!/saveGame|player\.hp\s*=[^=]|\.hp\s*\+=/.test(src));
 ok('Mammon zones not touched',!/ep1b06|mammon/i.test(src));
 ok('Hwando E dash not in the table (user: E dash itself must not change)',!/hwando\s*:\s*\{[^}]*\be\s*:/.test(src));

 function env(hero='hwando',store={}){const hits=[],sounds=[],errors=[];const g={localStorage:{_s:{...store},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,hits,sounds,errors,Math,performance:{now:()=>g.time*1000}};g.window=g;vm.createContext(g);
  vm.runInContext(`var time=0,started=true,loading=false,modal=null;var player={hero:${JSON.stringify(hero)},x:10,y:10,hp:100,specialCD:0};
  var room={id:'z1',engaged:true,enemies:[]};var delayed=[];var soundProfiles={};var sfxCooldown=new Map();
  function delay(s,fn,owner=null){delayed.push({at:time+s,fn,owner});}
  function hitEnemy(e,v,s){if(!e||e.hp<=0||!(v>0)||!Number.isFinite(v)||e.boss&&!room.engaged)return false;const a=Math.min(e.hp,v);hits.push({id:e.id,v,a,s,t:time});e.hp-=a;return true;}
  function sound(k){if(!soundProfiles[k])return;const now=performance.now()/1000;if(now<(sfxCooldown.get(k)||0))return;sfxCooldown.set(k,now+.38);sounds.push({k,t:time});}
  function setupAudio(){return true;}
  function tick(dt){time+=dt;for(const d of delayed.filter(d=>d.at<=time)){delayed.splice(delayed.indexOf(d),1);d.fn();}}
  var castQ=[];function special(){player.specialCD=10;for(const [d,e,v] of castQ){if(d<=0)hitEnemy(e,v);else delay(d,()=>hitEnemy(e,v),'hero');}}`,g);
  try{vm.runInContext(src,g);}catch(e){errors.push(String(e));}vm.runInContext('setupAudio()',g);return g;}
 const mob=(id,extra={})=>({id,x:11,y:10,hp:1000,maxHp:1000,radius:.3,spawnState:'active',...extra});
 const step=(g,sec,dt=.05)=>{for(let i=0;i<Math.round(sec/dt);i++)vm.runInContext('tick('+dt+')',g);};
 const A=g=>g.__STORYWORLD_SKILL_STYLE_R972__;
 const wer=(g,id,v,hero,slot)=>vm.runInContext(`hitEnemy(room.enemies.find(e=>e.id===${JSON.stringify(id)}),${v},{kind:'story-wer',friendly:true,owner:'hero',storyWER:true,sourceHero:${JSON.stringify(hero)},sourceSlot:${JSON.stringify(slot)},attackId9:'wer:1'})`,g);
 const raw=(g,id,v,s)=>vm.runInContext(`hitEnemy(room.enemies.find(e=>e.id===${JSON.stringify(id)}),${v}${s?','+JSON.stringify(s):''})`,g);
 const sum=(g,id)=>g.hits.filter(x=>x.id===id).reduce((a,b)=>a+b.a,0);
 let g=env();ok('loads without error',g.errors.length===0&&!!A(g));
 ok('API: revision · table · inspect · set · qaReset',!!A(g)&&A(g).revision==='R972'&&typeof A(g).inspect==='function'&&typeof A(g).set==='function'&&typeof A(g).qaReset==='function'&&!!A(g).table);
 if(A(g)){
 const T=A(g).table;
 ok('table: hwando Q·W slash, seoha Q·R echo, neon Q shock · R poison, michaela Q·R holy, lauren Q gravity, hunter Q·W burn, slayer Q slash · R bleed',
  T.hwando.q==='slash'&&T.hwando.w==='slash'&&T.seoha.q==='echo'&&T.seoha.r==='echo'&&T.neon.q==='shock'&&T.neon.r==='poison'&&T.michaela.q==='holy'&&T.michaela.r==='holy'&&T.lauren.q==='gravity'&&T.hunter.q==='burn'&&T.hunter.w==='burn'&&T.slayer.q==='slash'&&T.slayer.r==='bleed');
 ok('table: single-hit skills stay single (hwando E/R, lauren R execute, every gunner slot, dashes)',!T.hwando.e&&!T.hwando.r&&!T.lauren.r&&!T.lauren.e&&Object.keys(T.gunner||{}).length===0&&!T.neon.e&&!T.slayer.e);
 const K=A(g).kinds;
 ok('kinds: 5 DoT (ticks ≥3, gap .3–.6 s) + 3 multi-hit (2–3 hits, gap ≤ .2 s)',['burn','poison','bleed','shock','holy'].every(t=>K[t].dot&&K[t].ticks>=3&&K[t].gap>=.3&&K[t].gap<=.6&&K[t].share>0&&K[t].share<.5)&&['slash','gravity','echo'].every(t=>!K[t].dot&&K[t].n>=2&&K[t].n<=3&&K[t].gap<=.2));

 // ---- 다단히트: 총피해 그대로 ----
 g=env('hwando');g.room.enemies.push(mob('a'));wer(g,'a',300,'hwando','w');
 ok('multi-hit: first hit only a part at once (hwando W 300 → <300 immediately)',g.hits.length===1&&g.hits[0].a<300&&g.hits[0].a>0);
 step(g,1);{const hs=g.hits.filter(x=>x.id==='a');ok('multi-hit: hwando W → 2 hits, total 300 exactly',hs.length===2&&Math.abs(sum(g,'a')-300)<1e-6);
 ok('multi-hit: follow-up marked r972-multi with type, hero and slot',hs[1].s&&hs[1].s.kind==='r972-multi'&&hs[1].s.r972==='slash'&&hs[1].s.sourceHero==='hwando'&&hs[1].s.sourceSlot==='w'&&hs[1].s.friendly===true);
 ok('multi-hit: spacing = kind gap',Math.abs((hs[1].t-hs[0].t)-K.slash.gap)<.051);}
 g=env('lauren');g.room.enemies.push(mob('a'));raw(g,'a',300,{kind:'r561-collapse',sourceHero:'lauren',r561:true});step(g,1);
 ok('lauren Q gravity collapse → 3 hits, total 300',g.hits.length===3&&Math.abs(sum(g,'a')-300)<1e-6);
 g=env('seoha');g.room.enemies.push(mob('a'));raw(g,'a',200,{attackKind9:'skill',attackId9:'special:2',sourceProjectile5:true});step(g,1);
 ok('seoha Q (special:N projectile) → echo 2 hits, total 200',g.hits.length===2&&Math.abs(sum(g,'a')-200)<1e-6&&g.hits[1].s.r972==='echo');

 // ---- 도트 ----
 g=env('slayer');g.room.enemies.push(mob('a'));wer(g,'a',400,'slayer','r');
 {const first=g.hits[0].a;ok('DoT: slayer R bleed — immediate part = (1-share)×400',Math.abs(first-400*(1-K.bleed.share))<1e-6);}
 step(g,K.bleed.gap*K.bleed.ticks+.5);{const hs=g.hits.filter(x=>x.id==='a');ok('DoT: bleed ticks = kind ticks, total 400 exactly',hs.length===1+K.bleed.ticks&&Math.abs(sum(g,'a')-400)<1e-6);
 ok('DoT: ticks marked r972-dot · bleed · slayer',hs.slice(1).every(x=>x.s&&x.s.kind==='r972-dot'&&x.s.r972==='bleed'&&x.s.sourceHero==='slayer'));
 const gaps=hs.slice(2).map((x,i)=>x.t-hs[i+1].t);ok('DoT: tick spacing = kind gap',gaps.every(d=>Math.abs(d-K.bleed.gap)<.051));}
 g=env('slayer');g.room.enemies.push(mob('a',{hp:5000,maxHp:5000}));wer(g,'a',400,'slayer','r');step(g,.2);wer(g,'a',400,'slayer','r');step(g,5);
 {const hs=g.hits.filter(x=>x.s&&x.s.kind==='r972-dot');ok('DoT refresh: second application merges into one stream (no double ticks at once), total 800',Math.abs(sum(g,'a')-800)<1e-6&&hs.length<=2*K.bleed.ticks&&new Set(hs.map(x=>x.t.toFixed(3))).size===hs.length);}
 g=env('neon');g.room.enemies.push(mob('a'),mob('b'));wer(g,'a',300,'neon','r');step(g,5);ok('neon R → poison DoT total 300',Math.abs(sum(g,'a')-300)<1e-6&&g.hits.some(x=>x.s&&x.s.r972==='poison'));
 g=env('hunter');g.room.enemies.push(mob('a'));wer(g,'a',100,'hunter','w');step(g,5);ok('hunter W → burn DoT total 100',Math.abs(sum(g,'a')-100)<1e-6&&g.hits.some(x=>x.s&&x.s.r972==='burn'));
 g=env('michaela');g.room.enemies.push(mob('a'));raw(g,'a',150,{kind:'r563-q-pillar',sourceHero:'michaela',r563:true});step(g,5);ok('michaela Q pillar → holy DoT total 150',Math.abs(sum(g,'a')-150)<1e-6&&g.hits.some(x=>x.s&&x.s.r972==='holy'));

 // ---- Q 문맥: 출처 없는 엔진 고유기 타격 ----
 g=env('neon');g.room.enemies.push(mob('a'));g.castQ=[[0,g.room.enemies[0],200],[.2,g.room.enemies[0],200]];vm.runInContext('special()',g);step(g,5);
 ok('Q context: unsourced hits inside special() and its delay() callbacks → neon shock DoT, total 400',Math.abs(sum(g,'a')-400)<1e-6&&g.hits.filter(x=>x.s&&x.s.r972==='shock').length>=2);
 g=env('neon');g.room.enemies.push(mob('a'));raw(g,'a',200);step(g,3);ok('outside Q: unsourced hit stays one hit',g.hits.length===1&&g.hits[0].a===200);
 g=env('slayer');g.room.enemies.push(mob('a'));g.castQ=[[0,g.room.enemies[0],0]];vm.runInContext(`castQ=[];special=(b=>function(){const r=b.apply(this,arguments);hitEnemy(room.enemies[0],300,{kind:'r425',sourceHero:'slayer',r425:true});return r;})(special)`,g);
 // R425 피의 낙인은 Q 안에서 부르면 출혈로(위 special 은 R972 감싸기보다 안쪽이 아니라 바깥이라 Q 문맥이 아님 → 그대로여야 함)
 vm.runInContext('special()',g);step(g,3);ok('hit after special() returns (outer wrapper) is not treated as Q',g.hits.length===1);

 // ---- 슬레이어: R425 가 엔진 대신 낸 Q 회오리·R 십자가 폭발 ----
 g=env('slayer');g.room.enemies.push(mob('a'));raw(g,'a',300,{kind:'r425',friendly:true,owner:'hero',r425:'q-tornado',sourceHero:'slayer',r118Splash:true});step(g,1);
 ok('slayer Q tornado (R425 q-tornado) → slash 2 hits, total 300',g.hits.length===2&&Math.abs(sum(g,'a')-300)<1e-6&&g.hits[1].s.r972==='slash');
 g=env('slayer');g.room.enemies.push(mob('a'));raw(g,'a',500,{kind:'r425',friendly:true,owner:'hero',r425:'r-burst',sourceHero:'slayer',r118Splash:true});step(g,4);
 ok('slayer R cross burst (R425 r-burst) → bleed DoT, total 500',Math.abs(sum(g,'a')-500)<1e-6&&g.hits.filter(x=>x.s&&x.s.r972==='bleed').length===K.bleed.ticks);
 g=env('slayer');g.room.enemies.push(mob('a'));raw(g,'a',30,{kind:'r425',r425:'aura',sourceHero:'slayer'});step(g,1);ok('other R425 hits (aura chain) unchanged',g.hits.length===1);
 // ---- 이미 있던 도트: 피해 그대로, 틱 소리만 ----
 g=env('neon');g.room.enemies.push(mob('a'));raw(g,'a',20,{kind:'r562-poison',sourceHero:'neon',r562:true});
 ok('existing DoT tick (R562 poison) unchanged but plays poison tick sound',g.hits.length===1&&g.hits[0].a===20&&g.sounds.some(x=>x.k==='r972_poison'));
 g=env('slayer');g.room.enemies.push(mob('a'));raw(g,'a',20,{kind:'r425',r425:'q-bleed',sourceHero:'slayer'});ok('existing slayer Q bleed tick unchanged + bleed sound',g.hits.length===1&&g.sounds.some(x=>x.k==='r972_bleed'));
 g=env('hunter');g.room.enemies.push(mob('a'));raw(g,'a',20,{kind:'r535-burn',r535:true});ok('existing hunter burn tick unchanged + burn sound',g.hits.length===1&&g.sounds.some(x=>x.k==='r972_burn'));
 // ---- 총량 계측 ----
 g=env('neon');g.room.enemies.push(mob('a'));wer(g,'a',300,'neon','r');step(g,5);{const s=A(g).inspect().stats;ok('stats: received = delivered after queue drains (300)',Math.abs(s.received-300)<1e-6&&Math.abs(s.delivered-300)<1e-6);}
 g=env('hwando');g.room.enemies.push(mob('a'));raw(g,'a',100,{kind:'story-hwando-chain-r590',r590:'flash',sourceHero:'hwando',sourceSlot:'q',r975Multi:true,multiHit:{i:0,n:7}});step(g,1);ok('hits already marked multi-hit by another overlay (R975 r975Multi / multiHit) are never re-split',g.hits.length===1);
 // ---- 바꾸지 않는 것 ----
 g=env('hwando');g.room.enemies.push(mob('a'));wer(g,'a',300,'hwando','e');step(g,2);ok('hwando E dash unchanged (one hit, full value)',g.hits.length===1&&g.hits[0].a===300);
 g=env('lauren');g.room.enemies.push(mob('a'));wer(g,'a',300,'lauren','r');step(g,2);ok('lauren R execute unchanged',g.hits.length===1&&g.hits[0].a===300);
 g=env('gunner');g.room.enemies.push(mob('a'));raw(g,'a',300,{kind:'hero-skill-r561',attackKind9:'skill',sourceHero:'gunner'});step(g,2);ok('gunner skills unchanged',g.hits.length===1);
 g=env('hwando');g.room.enemies.push(mob('a'));raw(g,'a',50,{kind:'basic',sourceHero:'hwando'});raw(g,'a',50,{kind:'r562-poison',sourceHero:'neon',r562:true});step(g,2);ok('basic attacks and existing passive DoTs unchanged',g.hits.length===2);
 g=env('slayer');g.room.enemies.push(mob('a',{hp:300}));wer(g,'a',400,'slayer','r');step(g,3);ok('lethal hit is not split (kill lands at once)',g.hits.length===1&&g.hits[0].a===300&&g.room.enemies[0].hp===0);
 g=env('slayer',{'storyworld.r972.skillstyle':'{"on":false}'});g.room.enemies.push(mob('a'));wer(g,'a',400,'slayer','r');step(g,3);ok('switch off → unchanged',g.hits.length===1&&g.hits[0].a===400);

 // ---- 끊기·안전 ----
 g=env('slayer');g.room.enemies.push(mob('a'));wer(g,'a',400,'slayer','r');step(g,.3);vm.runInContext("room={id:'z2',engaged:true,enemies:[]}",g);step(g,3);ok('room change drops pending ticks',g.hits.length<=2&&A(g).inspect().pending===0);
 g=env('slayer');g.room.enemies.push(mob('a'));wer(g,'a',400,'slayer','r');g.room.enemies[0].hp=0;step(g,3);ok('dead target: no more ticks, no error',g.hits.length===1&&A(g).inspect().stats.errors===0);
 g=env('slayer');g.room.enemies.push(mob('a'));raw(g,'a',NaN,{kind:'story-wer',sourceHero:'slayer',sourceSlot:'r'});raw(g,'a',Infinity,{kind:'story-wer',sourceHero:'slayer',sourceSlot:'r'});step(g,3);ok('NaN / Infinity never scheduled',g.hits.every(x=>Number.isFinite(x.v))&&A(g).inspect().pending===0);
 g=env('slayer');g.room.enemies.push(mob('a',{hp:1e9,maxHp:1e9}));for(let i=0;i<60;i++)wer(g,'a',100,'slayer','r');ok('pending queue capped',A(g).inspect().pending<=A(g).inspect().cap);

 // ---- 가장 바깥 감싸기: 긴 줄의 뒤 스크립트(R425 등)가 hitEnemy 를 다시 감싸도 R972 가 먼저 출처를 본다 ----
 {const h2=[];const g2={localStorage:{getItem(){return null;},setItem(){}},console,Math,performance:{now:()=>0},h2};g2.window=g2;let ready=null;
  g2.document={readyState:'loading',addEventListener(n,f){if(n==='DOMContentLoaded')ready=f;}};vm.createContext(g2);
  vm.runInContext(`var time=0,started=true,loading=false,modal=null;var player={hero:'slayer'};var room={enemies:[{id:'a',hp:1000}]};var soundProfiles={};
   function hitEnemy(e,v,s){h2.push({v,s});e.hp-=v;return true;}function tick(){}`,g2);
  vm.runInContext(src,g2);
  // 뒤에 올라오는 스크립트: 슬레이어 본편 R 을 자기 출처(r425)로 바꿔 아래로 넘긴다
  vm.runInContext(`hitEnemy=(b=>function(e,v,s){if(s&&s.kind==='story-wer'&&s.sourceHero==='slayer')return b(e,v,{kind:'r425',sourceHero:'slayer',r425:true});return b(e,v,s);})(hitEnemy)`,g2);
  ok('waits for DOMContentLoaded while the page is still loading',typeof ready==='function'&&g2.__STORYWORLD_SKILL_STYLE_R972__.inspect().installed===false);
  ready&&ready();vm.runInContext(`hitEnemy(room.enemies[0],400,{kind:'story-wer',sourceHero:'slayer',sourceSlot:'r'})`,g2);
  ok('installed after all scripts → outermost: later rerouting wrapper does not hide the story-wer source (first part split)',g2.h2.length===1&&Math.abs(g2.h2[0].v-240)<1e-6);}
 // ---- 소리 ----
 g=env('slayer');ok('16 sounds registered as 8 profiles with gain ≤ .45',TYPES.every(t=>Array.isArray(g.soundProfiles['r972_'+t])&&g.soundProfiles['r972_'+t].length===2&&g.soundProfiles['r972_'+t].every(r=>r.gain<=.45&&/assets\/r972\/sfx\//.test(r.path))));
 g=env('slayer');for(let i=0;i<20;i++)g.room.enemies.push(mob('m'+i));for(let i=0;i<20;i++)wer(g,'m'+i,300,'slayer','r');step(g,2.4);
 {const s=g.sounds.filter(x=>x.k==='r972_bleed');ok('20 bleeding mobs → bleed tick sound rate-limited (≤ 1 per '+K.bleed.sgap+' s)',s.length>=2&&s.length<=Math.ceil(2.4/K.bleed.sgap)+1);}
 g=env('hwando');g.room.enemies.push(mob('a',{hp:1e6,maxHp:1e6}));wer(g,'a',300,'hwando','w');step(g,.5);ok('multi-hit follow-up plays slash sound',g.sounds.some(x=>x.k==='r972_slash'));
 ok('multi-hit sounds may be faster than engine .38 s gap (own gate)',K.slash.sgap<.38&&K.slash.sgap>=.06);
 g=env('neon');g.room.enemies.push(mob('a'));wer(g,'a',300,'neon','r');vm.runInContext('modal={}',g);step(g,3);ok('no ticks while modal (game paused)',g.hits.length===1);
 }
}
console.log(`\nR972 CPU check: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
