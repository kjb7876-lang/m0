// R860 적 공격이 맞는 자리 CPU 검사(정적·vm 모의 — 브라우저 그래픽 검증 아님. 브라우저 검사는 r860-core-hit.mjs·r860-hit-target.mjs)
//  ① enemy-hit-place-r860.js: 코어 hitAt 이 바뀐 순간 코어 자리에 적중 그림·피해 숫자, 안 바뀌면 없음, 지역 전환 직후 가짜 없음, 끄기, 그리기 높이
//  ② hit-center-r259.js: 영웅 피격(hurt 안·영웅 자리) 그림은 겹친 몹에 붙이지 않고, 몹 자리(영웅 → 몹)는 그대로 붙인다
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),SRC=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
let pass=0,total=0;const ok=(n,c,d)=>{total++;if(c)pass++;else console.log('FAIL',n,d===undefined?'':JSON.stringify(d));};
// ── ① 코어 적중 ──
function world(opt={}){const store={};if(opt.off)store['storyworld.r860.corehit']='{"on":false}';
 const g={console,Math,Number,Object,JSON,Map,WeakMap,Set,String,Array,localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;}},store};g.window=g;
 g.TILE=64;g.zoom=1;g.VFX={burst:'B',slash:'S'};g.actorHeight=()=>70;
 g.effects=[];g.texts=[];g.draws=[];
 g.fx=(t,x,y,o={})=>{g.effects.push({type:t,x,y,age:0,life:.45,...o});};
 g.floatText=(t,x,y,c)=>{g.texts.push({t,x,y,c});};
 g.project=(x,y)=>({x:x*10,y:y*5});
 g.texture=(a,x,y,w,h,o)=>{g.draws.push({a,x,y,w,h,o});};
 g.drawEffect=f=>{g.draws.push({base:f.type});};
 g.tick=()=>{};
 g.S={active:true,here:true,core:{hp:100,hitAt:-9},over:false};
 g.room={id:'dist00',survivalR600:{centre:{x:50,y:50}},enemies:[{id:'a',x:50.9,y:50,hp:5,r600Core:true,r600CoreAt:-9,damage:10}]};
 g.window.__STORYWORLD_SURVIVAL_R600__={active:()=>g.S.active,here:()=>g.S.here,state:()=>({core:{...g.S.core},over:g.S.over})};
 vm.createContext(g);vm.runInContext(SRC('enemy-hit-place-r860.js')+'\n;globalThis.__tick=()=>tick();globalThis.__draw=f=>drawEffect(f);',g);return g;}
const A=g=>g.__STORYWORLD_ENEMY_HIT_PLACE_R860__;
{const g=world();g.__tick();// 첫 tick: 기준만 잡음
 ok('baseline tick spawns nothing',g.effects.length===0&&g.texts.length===0);
 g.S.core.hp=89;g.S.core.hitAt=5;g.room.enemies[0].r600CoreAt=5;g.__tick();
 ok('core hit spawns one picture exactly at the core',g.effects.length===1&&g.effects[0].type==='r860-core-hit'&&g.effects[0].x===50&&g.effects[0].y===50,g.effects);
 ok('damage number at the core, rounded',g.texts.length===1&&g.texts[0].t==='-11'&&g.texts[0].x===50&&g.texts[0].y===50,g.texts);
 ok('slash comes from the mob toward the core (screen angle)',Math.abs(g.effects[0].angle-Math.atan2((50-50)*5,(50-50.9)*10))<1e-9&&g.effects[0].r259E===null,g.effects[0]);
 g.__tick();g.__tick();ok('same hit is not repeated',g.effects.length===1&&g.texts.length===1);
 g.S.core.hp=80;g.S.core.hitAt=6.2;g.room.enemies[0].r600CoreAt=6.2;g.__tick();ok('second hit (1.2 s later) spawns again',g.effects.length===2&&g.texts.length===2&&g.texts[1].t==='-9',g.texts);
 g.S.core.hp=80.3;g.__tick();ok('regen without a hit spawns nothing',g.effects.length===2);
 // 경계: 코어 파괴 순간(hp 0·over) 에도 그림은 한 번 남는다(맞은 마지막 타) — 중복 없음
 g.S.core.hp=0;g.S.core.hitAt=7.5;g.S.over=true;g.room.enemies[0].r600CoreAt=7.5;g.__tick();ok('final lethal hit still shows exactly one picture',g.effects.length===3,g.effects.length);
 ok('no errors',A(g).inspect().stats.errors===0,A(g).inspect());
 // 그리기: 코어 몸 가운데 높이(발 위) — 발 y(=50*5)보다 위
 const f=g.effects[0];f.age=f.life*.4;g.draws.length=0;g.__draw(f);
 ok('draw: flash + slash, both above the core base (body height), not drawn by the engine default',g.draws.length===2&&g.draws.every(d=>d.y<50*5&&d.y>50*5-70)&&g.draws[0].a==='B'&&g.draws[1].a==='S'&&!g.draws.some(d=>d.base),g.draws);}
{const g=world();g.__tick();g.room={...g.room,id:'dist01'};g.S.core.hitAt=3;g.S.core.hp=90;g.__tick();// 지역 바뀜: 기준만
 ok('room change re-baselines instead of spawning a fake hit',g.effects.length===0);}
{const g=world();g.__tick();g.S.here=false;g.S.core.hitAt=3;g.S.core.hp=50;g.__tick();ok('outside the survival map: nothing',g.effects.length===0);
 g.S.active=false;g.__tick();ok('survival inactive: nothing',g.effects.length===0);}
{const g=world({off:true});g.__tick();g.S.core.hitAt=3;g.S.core.hp=90;g.__tick();ok('off switch: nothing',g.effects.length===0&&A(g).inspect().on===false);}
{const g=world();ok('non-core effects fall through to the engine draw',(g.__draw({type:'burst'}),g.draws[0].base==='burst'));}
// ── ② R259 ──
function w259(){const store={};const g={console,Math,Number,Object,JSON,Map,WeakMap,Set,String,Array,localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;}},performance:{now:()=>1000}};g.window=g;
 g.effects=[];g.player={x:10,y:10,hp:99};g.room={enemies:[{id:'m',x:10.05,y:10.03,hp:5},{id:'far',x:20,y:20,hp:5}]};g.time=0;
 g.fx=(t,x,y,o={})=>{g.effects.push({type:t,x,y,age:0,life:.45,...o});};
 g.hurt=(d,s)=>{g.fx('text',g.player.x,g.player.y,{text:'-'+d});g.fx('burst',g.player.x,g.player.y);return 'hit';};
 g.drawEffect=()=>{};g.drawEnemy=()=>{};
 vm.createContext(g);vm.runInContext(SRC('hit-center-r259.js')+'\n;globalThis.__hurt=(...a)=>hurt(...a);globalThis.__fx=(...a)=>fx(...a);',g);return g;}
{const g=w259();g.__hurt(7,g.room.enemies[0]);
 ok('hero hurt number+burst are not pinned to the overlapping mob',g.effects.length===2&&g.effects.every(f=>!f.r259E),g.effects.map(f=>[f.type,!!f.r259E]));
 g.effects.length=0;g.__fx('text',10.05,10.03,{text:'x'});// 같은 자리의 영웅 → 몹 적중이지만 영웅 자리(.2칸) 안이면 붙이지 않는 경계(원래도 영웅 곁에서 같은 곳)
 ok('boundary: a spawn inside the hero spot (.2) is hero-side, not pinned',!g.effects[0].r259E,g.effects[0]);
 g.effects.length=0;g.player.x=15;g.player.y=15;g.__fx('text',10.05,10.03,{text:'-9'});
 ok('regression: spawn on a mob away from the hero is still pinned to that mob',g.effects[0].r259E&&g.effects[0].r259E.id==='m',g.effects[0]);
 g.effects.length=0;g.__fx('burst',20,20);ok('regression: burst pinned too',g.effects[0].r259E&&g.effects[0].r259E.id==='far');
 g.effects.length=0;g.__fx('sigil',20,20);ok('regression: only burst/slash/text types',!g.effects[0].r259E);
 g.effects.length=0;g.player.x=10;g.player.y=10;g.__hurt(3,g.room.enemies[0]);g.__fx('text',20,20,{text:'ok'});
 ok('hurt depth resets after the call (a later hero→mob hit is pinned again)',g.effects[2].r259E&&g.effects[2].r259E.id==='far',g.effects.map(f=>[f.type,!!f.r259E]));
 ok('no errors',g.__STORYWORLD_HIT_CENTER_R259__.inspect().stats.errors===0,g.__STORYWORLD_HIT_CENTER_R259__.inspect());}
// 정적: 새 태그와 공개 검증 목록
const idx=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8'),ver=fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8');
ok('index.html loads the overlay after npc-r790',/npc-r790\.js"><\/script>\s*<script src=".\/enemy-hit-place-r860\.js"><\/script>/.test(idx));
ok('verify-r96-public.py expects the overlay',/enemy-hit-place-r860\.js/.test(ver));
console.log(pass+'/'+total+' passed');process.exit(pass===total?0:1);
