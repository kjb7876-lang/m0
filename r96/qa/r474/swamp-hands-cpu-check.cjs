// R474 CPU 검사: 늪(dist02)의 뿔악마 군주(mb-dist02)와 싸우는 동안 정본 "물속에서 올라온 손들이 발목을 붙잡았다"처럼
// 영웅 발밑에서 물속 손이 올라오고(0.95초 예고), 그때까지 그 자리에 있으면 속박(R61 'bind', 이동 0.48배 2.2초)이 걸리는지.
// 비키면 안 걸림, 13초 간격, 보스가 깨어 있고 12칸 안일 때만, 장면·영화 모드·협동·끄기 땐 없음. 피해는 주지 않는다.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const F='swamp-hands-r474.js';const exists=fs.existsSync(path.join(R,'client-source',F));ok(F+' exists',exists);
if(exists){
 ok('runtime copy matches source',fs.existsSync(path.join(R,'runtime-text',F))&&C(F)===RT(F));try{new vm.Script(C(F));ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
 ok('script tag once',RT('index.html').split('"./'+F+'"').length===2);
 ok('listed in verify-r96-public.py',new RegExp("'"+F.replace(/\./g,'\\.')+"'").test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
 ok('CI runs this check',/qa\/r474\/swamp-hands-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
 const src=C(F);ok('no damage/hp/save writes',!/\.hp\s*=[^=]|\.damage\s*=|saveGame|hurt\(/.test(src));ok('uses approved R105 hands art',/assets\/r105\/props\/dist02-hands\.webp/.test(src));
 ok('Mammon zones not touched',!/ep1b06/.test(src));ok('no ctx.filter blur/drop-shadow',!/drop-shadow|blur\(/.test(src));
 function env(){const draws=[],status=[];const g={localStorage:{_s:{},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,draws,status};g.window=g;vm.createContext(g);
  vm.runInContext('var time=0,started=true,loading=false,modal=null,storyScene=null,zoom=1,TILE=34,player={x:20,y:16,hp:10},room={id:"dist02",enemies:[]},effects=[];function tick(){}function drawEffect(e){}function project(x,y){return{x:(x-y)*34+480,y:(x+y)*17};}var scopes=[];var document={createElement(){return{width:0,height:0,r474Copy:true,getContext(){return{drawImage(){}};}};}};var ctx={globalAlpha:1,save(){},restore(){},translate(){},rotate(){},scale(){},beginPath(){},ellipse(){},fill(){},stroke(){},scope(o,f){scopes.push(o);f();},drawImage(im,x,y,w,h){draws.push({p:im&&im.r474Copy?"assets/r105/props/dist02-hands.webp(copy)":String(im),w,h,o:{alpha:this.globalAlpha}});}};function readyImage(p){return{image:{naturalWidth:512,naturalHeight:441}};}function drawImage(p,x,y,w,h,o){draws.push({p,x,y,w,h,o});}',g);
  g.__STORYWORLD_FIELDS_R61__={applyStatus:(k,e)=>{status.push({k,e:e&&e.nativeId});return true;}};vm.runInContext(src,g);return g;}
 const boss=()=>({id:'dist02:mb-dist02',nativeId:'mb-dist02',midboss:true,hp:100,maxHp:100,x:16,y:12,spawnState:'active'});
 let g=env();const A=()=>g.__STORYWORLD_SWAMP_HANDS_R474__;ok('API exposed',!!A()&&typeof A().inspect==='function');
 const step=(n=1,dt=.1)=>{for(let i=0;i<n;i++){g.time=+(g.time+dt).toFixed(4);vm.runInContext('time='+g.time+';tick();for(const e of effects.slice())drawEffect(e)',g);}};
 const b=boss();step(30);ok('no hands before the boss is awake',A().inspect().stats.rises===0);
 g.room.enemies.push(b);step(5);ok('rises under the hero once the fight is on (first within 5 s)',A().inspect().stats.rises===1);
 const spot=A().inspect().active;ok('spot is the hero feet at warning start',spot&&Math.hypot(spot.x-20,spot.y-16)<.01);
 ok('drawn in the effect stage (one marker effect while hands are up)',vm.runInContext('effects.filter(e=>e&&e.r474Sentinel).length',g)===1);
 ok('warning draws the hands (two clusters beside the feet, from a canvas copy)',g.draws.filter(d=>/dist02-hands/.test(d.p)).length>=2);
 ok('3D owners: pool ground-aligned + hands, both enemy-side at the spot',(()=>{const sc=vm.runInContext('scopes',g);const pool=sc.find(o=>/:pool$/.test(o.id)),h=sc.find(o=>/:hands$/.test(o.id));return pool&&h&&pool.groundAligned===true&&pool.pxfSide==='enemy'&&h.pxfSide==='enemy'&&Math.hypot(h.x-20,h.y-16)<.01;})());
 step(12);ok('standing still → bind applied once by the boss',g.status.length===1&&g.status[0].k==='bind'&&g.status[0].e==='mb-dist02');
 step(20);ok('hands sink and clear',!A().inspect().active);
 // 비켜서면 안 걸림
 const t1=A().inspect().nextAt;g.time=t1-.05;step(2);ok('second rise at ~13 s',A().inspect().stats.rises===2);g.player.x+=1.6;step(12);ok('stepping away dodges (no new bind)',g.status.length===1&&A().inspect().stats.dodged===1);
 // 보스 멀리·쓰러짐
 g=env();const far=boss();g.room.enemies.push(far);g.player.x=40;step(60);ok('hero 12+ tiles away → none',A().inspect().stats.rises===0);
 g=env();const dead=boss();dead.hp=0;g.room.enemies.push(dead);step(60);ok('boss down → none',A().inspect().stats.rises===0);
 g=env();const hid=boss();hid.spawnState='hidden';g.room.enemies.push(hid);step(60);ok('boss hidden → none',A().inspect().stats.rises===0);
 // 장면·영화·협동·다른 지역·끄기
 g=env();g.room.enemies.push(boss());vm.runInContext('storyScene={}',g);step(60);ok('story scene → none',A().inspect().stats.rises===0);
 g=env();g.room.enemies.push(boss());g.__STORYWORLD_CINEMA_MODE_R370__={prefs:()=>({on:true})};step(60);ok('cinema mode → none',A().inspect().stats.rises===0);
 g=env();g.room.enemies.push(boss());g.__STORYWORLD_COOP_SIM_R62__={mode:()=>'guest'};step(60);ok('co-op → none',A().inspect().stats.rises===0);
 g=env();g.room.id='dist03';g.room.enemies.push(boss());step(60);ok('other zone → none',A().inspect().stats.rises===0);
 g=env();g.localStorage.setItem('storyworld.r474.hands','{"on":false}');g.room.enemies.push(boss());step(60);ok('switch off → none',A().inspect().stats.rises===0&&g.draws.length===0&&vm.runInContext('effects.length',g)===0);
 // 장면이 예고 중 열리면 손이 걷히고 속박 없음
 g=env();g.room.enemies.push(boss());step(5);vm.runInContext('storyScene={}',g);step(15);ok('scene opening mid-warning cancels (no bind)',g.status.length===0&&!A().inspect().active);
}
console.log(`R474 swamp-hands cpu check: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
