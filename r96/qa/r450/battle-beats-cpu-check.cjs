// R450 CPU 검사: 보스 싸움 박자(마주침·절반·광폭화·쓰러짐)에 정본 문장을 그대로 한 줄 띄우는지, 영화 모드·서사 장면에서는 쉬는지, 분노의 귀 순서(곰→늑대 무리→용).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
for(const f of ['battle-beats-r450.js','combat-r118.js']){ok(f+' runtime copy matches source',C(f)===RT(f));try{new vm.Script(C(f));ok(f+' syntax',true);}catch(e){ok(f+' syntax '+e.message,false);}}
const html=RT('index.html');ok('battle-beats-r450 script tag once, after intro-video-r309',html.split('"./battle-beats-r450.js"').length===2&&html.indexOf('"./intro-video-r309.js"')<html.indexOf('"./battle-beats-r450.js"'));
ok('listed in verify-r96-public.py',/'battle-beats-r450\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
const src=C('battle-beats-r450.js');
ok('no gameplay writes (hp/damage/save/AI)',!/\.hp\s*=[^=]|\.damage\s*=|saveGame|\.attack\s*=|r431Next\s*=/.test(src));
ok('Mammon zones (ep1b06, ep1b06b) not touched',!/\['ep1b06b?'/.test(src));
// 환경
function env(){const nodes=[];const doc={createElement:()=>{const n={style:{},setAttribute(){},isConnected:true,textContent:''};nodes.push(n);return n;},body:{appendChild(){}}};
 const g={window:{},localStorage:{getItem:()=>null,setItem(){}},document:doc,matchMedia:()=>({matches:false}),performance:{now:()=>0},console,nodes};
 g.window=g;vm.createContext(g);vm.runInContext(C('story-canon-r106-data.js'),g);
 vm.runInContext('var time=0,started=true,loading=false,modal=null,storyScene=null,layer="STORY",ticks=0;function tick(){ticks++;}',g);
 vm.runInContext(C('battle-beats-r450.js'),g);return g;}
const g=env(),B=g.__STORYWORLD_BATTLE_BEATS_R450__;
const all=B.resolveAll();ok('every beat resolves to a canon sentence ('+all.length+')',all.length>=20&&all.every(r=>r.text&&r.text.length>8));
// 문장은 정본 문단 안에 그대로 있다
const Z=g.__STORYWORLD_STORY_CANON_R106__.zones;ok('every shown sentence is verbatim in its zone canon text',all.every(r=>Z[r.zone].blocks.some(b=>b.paras.some(p=>p.replace(/\s*\n\s*/g,' ').includes(r.text)))));
// 분노 보스 싸움 흉내
const boss={nativeId:'b07-boss',boss:true,hp:100,maxHp:100,x:5,y:5,spawnState:'active'};
vm.runInContext('var player={x:30,y:30,hp:10},room={id:"ep1b07",engaged:false,enemies:[]};',g);g.room.enemies.push(boss);
const step=(n=1,dt=.1)=>{for(let i=0;i<n;i++){g.time+=dt;vm.runInContext('time='+g.time+';tick()',g);}};
const box=()=>g.nodes[0];
step(5);ok('nothing before engage',!box()&&B.inspect().stats.shown===0);
g.player.x=7;g.player.y=6;g.room.engaged=true;step(2);ok('engage line = bear/wolves/dragon canon sentence',box()&&/곰의 모습으로/.test(box().textContent)&&box().style.opacity==='1');
step(80);ok('line fades after hold',box().style.opacity==='0');
boss.hp=45;step(2);ok('half line',/차가운 말이 반복되는/.test(box().textContent));
step(80);boss.hp=40;step(5);ok('each beat once per fight',B.inspect().stats.shown===2);
g.storyScene={};boss.hp=0;boss.deadRecorded=true;g.room.enemies.length=0;step(3);ok('dead beat waits/skips during story scene',B.inspect().stats.shown===2);
// 장면이 늦게 끝나면 대기 문장은 버린다(6초)
step(80);g.storyScene=null;step(3);ok('stale queued line dropped after story scene',B.inspect().stats.shown===2);
// 쓰러짐 줄(서사 장면 없이)
{const g4=env();vm.runInContext('var player={x:6,y:5,hp:10},room={id:"ep1b04",engaged:true,enemies:[{nativeId:"b04-boss",boss:true,hp:100,maxHp:100,x:5,y:5,spawnState:"active"}]};for(let i=0;i<3;i++){time+=.1;tick();}time+=20;tick();var e=room.enemies[0];e.hp=0;e.deadRecorded=true;room.enemies.length=0;for(let i=0;i<3;i++){time+=.1;tick();}',g4);
 ok('dead line after a real fight (Beelzebub collapses)',/베엘제붑이 무너져 내렸다/.test(g4.nodes[0].textContent));}
// 영화 모드
const g2=env(),B2=g2.__STORYWORLD_BATTLE_BEATS_R450__;g2.__STORYWORLD_CINEMA_MODE_R370__={prefs:()=>({on:true})};
vm.runInContext('var player={x:6,y:5,hp:10},room={id:"ep1b05",engaged:true,enemies:[{nativeId:"b05-boss",boss:true,hp:100,maxHp:100,x:5,y:5,spawnState:"active"}]};',g2);
for(let i=0;i<5;i++)vm.runInContext('time+=.1;tick()',g2);ok('silent in cinema mode',B2.inspect().stats.shown===0);
// 끄기
const g3=env();g3.__STORYWORLD_BATTLE_BEATS_R450__.set({on:false});vm.runInContext('var player={x:6,y:5,hp:10},room={id:"ep1b05",engaged:true,enemies:[{nativeId:"b05-boss",boss:true,hp:100,maxHp:100,x:5,y:5,spawnState:"active"}]};for(let i=0;i<5;i++){time+=.1;tick();}',g3);ok('off switch',g3.__STORYWORLD_BATTLE_BEATS_R450__.inspect().stats.shown===0);
// 분노의 귀 순서
const cs=C('combat-r118.js'),iD=cs.indexOf('"wrath-dragon-manifest"'),iB=cs.indexOf('"wrath-bear-manifest"'),iW=cs.indexOf('"wrath-wolf-manifest"');
ok('wrath list order dragon,bear,wolf → throws (step from 1) bear → wolves → dragon',iD>0&&iD<iB&&iB<iW);
ok('wolves come as a pack of three',/n=w\.mode==='flutter'\|\|w\.id==='wrath-wolf-manifest'\?3:1/.test(cs));
console.log(`R450 battle beats: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
