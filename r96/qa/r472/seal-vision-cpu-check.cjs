// R472 CPU 검사: 회장(ep1b08 b08-boss)이 광폭화(R205)하면 정본 "회장은 … 눈과 몸을 봉인했다" 처럼 영웅 둘레만 남기고 시야를 잠시 봉인하는지.
// 첫 봉인은 광폭화 순간, 다음부터 22초마다 예고(0.9초) 뒤 봉인. 보스가 쓰러지거나 방을 떠나거나 서사 장면·영화 모드·협동이면 바로 걷힌다. 판정은 바꾸지 않는다.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const F='seal-vision-r472.js';const exists=fs.existsSync(path.join(R,'client-source',F));ok(F+' exists',exists);
if(exists){
 ok(F+' runtime copy matches source',fs.existsSync(path.join(R,'runtime-text',F))&&C(F)===RT(F));try{new vm.Script(C(F));ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
 ok('script tag once',RT('index.html').split('"./'+F+'"').length===2);
 ok('listed in verify-r96-public.py',new RegExp("'"+F.replace(/\./g,'\\.')+"'").test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
 ok('CI runs this check',/qa\/r472\/seal-vision-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
 const src=C(F);ok('no gameplay writes',!/\.hp\s*=[^=]|\.damage\s*=|saveGame|\.attack\s*=|\.speed\s*=|player\.(x|y)\s*=[^=]/.test(src));
 ok('no ctx.filter blur/drop-shadow (Three.js legacy trap)',!/drop-shadow|blur\(/.test(src));
 ok('Mammon zones not touched',!/ep1b06/.test(src));
 function env(){const nodes=[];const doc={createElement:()=>{const n={style:{},setAttribute(){},isConnected:true};nodes.push(n);return n;},body:{appendChild(){}},getElementById:id=>id==='game'?{getBoundingClientRect:()=>({left:0,top:0,width:1280,height:720})}:null};
  const g={localStorage:{_s:{},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},document:doc,console,nodes};g.window=g;vm.createContext(g);
  vm.runInContext('var time=0,started=true,loading=false,modal=null,storyScene=null,layer="STORY",W=1280,H=720,TILE=34,zoom=1,ticks=0;function project(x,y){return{x:(x-y)*TILE+W/2,y:(x+y)*TILE*.5+H*.52-300};}function tick(){ticks++;}',g);
  vm.runInContext('var player={x:10,y:10,hp:10,maxHp:10},room={id:"ep1b08",enemies:[]};',g);vm.runInContext(src,g);return g;}
 let g=env();const A=()=>g.__STORYWORLD_SEAL_VISION_R472__;ok('API exposed',!!A()&&typeof A().inspect==='function');
 const boss={nativeId:'b08-boss',boss:true,hp:100,maxHp:100,x:14,y:12,spawnState:'active'};g.room.enemies.push(boss);
 const step=(n=1,dt=.1)=>{for(let i=0;i<n;i++){g.time=+(g.time+dt).toFixed(4);vm.runInContext('time='+g.time+';tick()',g);}};
 const alpha=()=>A().inspect().alpha,el=()=>g.nodes[0];
 step(50);ok('no seal before enrage',A().inspect().stats.seals===0&&alpha()===0);
 boss.hp=25;boss.r205Enraged={at:g.time};step(2);ok('seal starts at the enrage moment',A().inspect().stats.seals===1);
 step(8);ok('sealed: dark ≥ .85 around hero at hold ('+alpha().toFixed(2)+')',alpha()>=.85);
 const bg=String(el()?.style?.background||'');ok('gradient centred on hero screen point (640px)',/radial-gradient\(/.test(bg)&&/640(\.\d+)?px/.test(bg));
 ok('clear circle around hero ≥ 2.2 tiles',A().inspect().clearRadiusPx>=2.2*34);
 step(30);ok('seal lifts after ~3.6 s',alpha()===0&&A().inspect().phase==='idle');
 const t0=A().inspect().nextAt;ok('next seal scheduled ~22 s after first',Math.abs(t0-(boss.r205Enraged.at+22))<.31);
 g.time=t0-1.5;step(7);ok('warning pulse before repeat seal (low, ≤ .35)',A().inspect().phase==='warn'&&alpha()>0&&alpha()<=.35);
 step(12);ok('second seal fires',A().inspect().stats.seals===2&&A().inspect().stats.warnings>=1);
 step(5);boss.hp=0;step(1);ok('boss down → seal cleared at once',alpha()===0&&A().inspect().phase==='idle');
 // 서사 장면·영화 모드·협동·다른 지역·끄기
 g=env();const b2={...boss,hp:20,r205Enraged:{at:0}};g.room.enemies.push(b2);g.storyScene={};vm.runInContext('storyScene={}',g);step(10);ok('story scene → no seal',A().inspect().stats.seals===0&&alpha()===0);
 vm.runInContext('storyScene=null',g);g.__STORYWORLD_CINEMA_MODE_R370__={prefs:()=>({on:true})};step(10);ok('cinema mode → no seal',A().inspect().stats.seals===0);
 delete g.__STORYWORLD_CINEMA_MODE_R370__;g.__STORYWORLD_COOP_SIM_R62__={mode:()=>'host'};step(10);ok('co-op → no seal',A().inspect().stats.seals===0);
 delete g.__STORYWORLD_COOP_SIM_R62__;step(3);ok('then seals once nothing blocks',A().inspect().stats.seals===1);
 step(10);vm.runInContext('storyScene={}',g);step(1);ok('scene opening mid-seal clears at once',alpha()===0);
 g=env();g.room.id='ep1b07';g.room.enemies.push({...boss,r205Enraged:{at:0},hp:10});step(20);ok('other zone untouched',A().inspect().stats.seals===0);
 g=env();g.room.enemies.push({...boss,nativeId:'mb-ep1b08',r205Enraged:{at:0},hp:10});step(20);ok('mid-boss untouched',A().inspect().stats.seals===0);
 g=env();g.localStorage.setItem('storyworld.r472.seal','{"on":false}');g.room.enemies.push({...boss,r205Enraged:{at:0},hp:10});step(20);ok('switch off → none',A().inspect().stats.seals===0&&alpha()===0);
 g=env();g.room.enemies.push({...boss,r205Enraged:{at:0},hp:10});step(5);vm.runInContext('room={id:"ep1b07",enemies:[]}',g);step(1);ok('leaving the room clears',alpha()===0);
}
console.log(`R472 seal-vision cpu check: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
