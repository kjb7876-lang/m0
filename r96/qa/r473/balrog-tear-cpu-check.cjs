// R473 CPU 검사: 발록(dist06 dist06-boss)의 운석(R241)이 정본 "발록의 검이 공간을 가르고, 불덩이가 하늘을 뒤덮었다"처럼
// 흩어지지 않고 검이 가른 한 줄(발록 → 영웅 → 그 너머)을 따라 발록 쪽부터 차례로 떨어지는지. 다른 보스·막힌 칸·끄기는 그대로.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const F='balrog-tear-r473.js';const exists=fs.existsSync(path.join(R,'client-source',F));ok(F+' exists',exists);
if(exists){
 ok('runtime copy matches source',fs.existsSync(path.join(R,'runtime-text',F))&&C(F)===RT(F));try{new vm.Script(C(F));ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
 ok('script tag once',RT('index.html').split('"./'+F+'"').length===2);
 ok('tick wrapper installed after R241 wraps (deferred) and scans before+after the engine tick',/__STORYWORLD_BOSS_METEOR_R241__/.test(C(F))&&/go\(\);const r=base\.apply\(this,a\);go\(\);/.test(C(F)));
 ok('listed in verify-r96-public.py',new RegExp("'"+F.replace(/\./g,'\\.')+"'").test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
 ok('CI runs this check',/qa\/r473\/balrog-tear-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
 const src=C(F);ok('no damage/hp/AI writes',!/\.hp\s*=[^=]|\.damage\s*=|saveGame|\.attack\s*=|\.warning\s*=|\.life\s*=/.test(src));
 ok('Mammon zones not touched',!/ep1b06/.test(src));
 function env(blockedFn){const g={localStorage:{_s:{},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,Math};g.window=g;vm.createContext(g);
  g.blocked=blockedFn||(()=>false);vm.runInContext('var time=0,started=true,loading=false,modal=null,hazards=[],player={x:22,y:16,hp:10},room={id:"dist06",engaged:true,enemies:[]};function tick(){}',g);vm.runInContext(src,g);return g;}
 const mk=(g,owner,n=6)=>{const cast=Math.random();for(let k=0;k<n;k++)g.hazards.push({id:100+k,type:'meteor-r241',owner,x:10+k*3,y:30-k*2,radius:1.25,age:0,warning:1.25+k*.12,life:1.7+k*.12,damage:30,r241Meteor:{cast,k}});};
 let g=env();const boss={id:'dist06:dist06-boss',nativeId:'dist06-boss',boss:true,hp:900,maxHp:1000,x:16,y:12,spawnState:'active'};g.room.enemies.push(boss);
 mk(g,boss.id);const before=g.hazards.map(h=>({w:h.warning,l:h.life,d:h.damage,r:h.radius}));vm.runInContext('tick()',g);
 const H=g.hazards,ang=Math.atan2(g.player.y-boss.y,g.player.x-boss.x);
 const along=H.map(h=>(h.x-boss.x)*Math.cos(ang)+(h.y-boss.y)*Math.sin(ang)),side=H.map(h=>-(h.x-boss.x)*Math.sin(ang)+(h.y-boss.y)*Math.cos(ang));
 ok('all six on the slash line (|side| ≤ .45): '+side.map(v=>v.toFixed(2)).join(','),side.every(v=>Math.abs(v)<=.45));
 ok('ordered from Balrog outward by fall order (k)',along.every((v,i)=>i===0||v>along[i-1]));
 const D=Math.hypot(g.player.x-boss.x,g.player.y-boss.y);ok('first lands ≥1.2 tiles from Balrog, line runs past the hero',along[0]>=1.2&&along[5]>=D+1.5);
 ok('neighbours 1.2–2.4 tiles apart (a continuous tear)',along.every((v,i)=>i===0||(v-along[i-1]>=1.2&&v-along[i-1]<=2.4)));
 ok('one meteor within 1.25 of hero (same threat as before)',H.some(h=>Math.hypot(h.x-g.player.x,h.y-g.player.y)<=1.25));
 ok('timing/damage/radius unchanged',H.every((h,i)=>h.warning===before[i].w&&h.life===before[i].l&&h.damage===before[i].d&&h.radius===before[i].r));
 ok('tagged once',H.every(h=>h.r473Tear));const xs=H.map(h=>h.x);vm.runInContext('tick()',g);ok('not moved again next tick',H.every((h,i)=>h.x===xs[i]));
 ok('inspect counts the cast',g.__STORYWORLD_BALROG_TEAR_R473__.inspect().stats.casts===1);
 // 이미 떨어지기 시작한(age>0.3) 운석은 안 옮김
 g=env();g.room.enemies.push(boss);mk(g,boss.id);g.hazards.forEach(h=>h.age=.5);const x0=g.hazards.map(h=>h.x);vm.runInContext('tick()',g);ok('meteors already warning for a while are left alone',g.hazards.every((h,i)=>h.x===x0[i]));
 // 막힌 칸은 원래 자리 유지
 g=env((x,y)=>x>19.5&&x<21.5);g.room.enemies.push(boss);mk(g,boss.id);const o=g.hazards.map(h=>[h.x,h.y]);vm.runInContext('tick()',g);
 ok('a spot on a blocked cell keeps its original place',g.hazards.every((h,i)=>!(h.x>19.5&&h.x<21.5))&&g.hazards.some((h,i)=>h.x===o[i][0]&&h.y===o[i][1]));
 // 다른 보스·다른 지역·끄기
 g=env();const other={...boss,id:'z',nativeId:'dist03-boss'};g.room.enemies.push(other);mk(g,'z');const ox=g.hazards.map(h=>h.x);vm.runInContext('tick()',g);ok('other boss meteors untouched',g.hazards.every((h,i)=>h.x===ox[i]));
 g=env();g.room.id='dist03';g.room.enemies.push(boss);mk(g,boss.id);const oy=g.hazards.map(h=>h.x);vm.runInContext('tick()',g);ok('other zone untouched',g.hazards.every((h,i)=>h.x===oy[i]));
 g=env();g.localStorage.setItem('storyworld.r473.tear','{"on":false}');g.room.enemies.push(boss);mk(g,boss.id);const oz=g.hazards.map(h=>h.x);vm.runInContext('tick()',g);ok('switch off → scattered as before',g.hazards.every((h,i)=>h.x===oz[i]));
 g=env();g.room.enemies.push(boss);mk(g,boss.id,3);vm.runInContext('tick()',g);ok('partial cast (3) still lined up',g.hazards.every(h=>h.r473Tear));
}
console.log(`R473 balrog-tear cpu check: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
