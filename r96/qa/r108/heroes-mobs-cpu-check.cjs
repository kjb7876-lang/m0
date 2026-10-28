// R108 CPU check: hero-select portrait cards (heroes-r108.js + assets/r108/heroes) and the mob tuning
// overlay (mobs-tune-r108.js: steady facing, ward champions limited to illusion/prop/charge/melee
// without statuses). Both load before audio-r98.js and change no save, health or damage numbers.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'../../..'),R=p=>path.join(root,p);
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+detail));};
const html=fs.readFileSync(R('r96/runtime-text/index.html'),'utf8');
for(const f of ['heroes-r108.js','mobs-tune-r108.js']){
 check(f+' runtime copy identical',fs.existsSync(R('r96/runtime-text/'+f))&&fs.readFileSync(R('r96/runtime-text/'+f),'utf8')===fs.readFileSync(R('r96/client-source/'+f),'utf8'));
 check(f+' loaded after play-r106.js and before audio-r98.js',new RegExp('play-r106\\.js"></script>[\\s\\S]*'+f.replace('.','\\.')+'"></script>[\\s\\S]*audio-r98\\.js"></script>').test(html));}
// ---- portraits
const dir=R('r96/runtime-text/assets/r108/heroes'),meta=JSON.parse(fs.readFileSync(path.join(dir,'meta.json'),'utf8'));
const HEROES=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner'];
const webp=b=>{if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')return null;const t=b.toString('ascii',12,16);
 if(t==='VP8X')return[1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];if(t==='VP8 ')return[b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];if(t==='VP8L'){const v=b.readUInt32LE(21);return[(v&0x3fff)+1,((v>>14)&0x3fff)+1];}return null;};
const bad=[];for(const[h,m]of Object.entries(meta.portraits)){const b=fs.readFileSync(path.join(dir,h+'.webp')),s=webp(b);if(!s||s[0]!==384||s[1]!==512)bad.push(h+' size '+s);if(b.length!==m.bytes||crypto.createHash('sha256').update(b).digest('hex')!==m.sha256)bad.push(h+' hash');}
check('every listed portrait is a 384x512 webp with the recorded bytes and sha256',!bad.length,bad.join(', '));
check('portraits only for the eight heroes',Object.keys(meta.portraits).every(h=>HEROES.includes(h))&&Object.keys(meta.portraits).length>=2,Object.keys(meta.portraits).join(','));
const hsrc=fs.readFileSync(R('r96/client-source/heroes-r108.js'),'utf8');
check('missing portrait falls back to the sprite the card showed before',hsrc.includes("p.onerror=()=>{p.onerror=null;stats.fallbacks++;p.classList.add('sprite');p.src=sprite;}"));
check('hero select keeps the native dialog and hero change',hsrc.includes('const r=showBase.apply(this,arguments)')&&!/newGame\(|player\.hero\s*=/.test(hsrc));
check('every hero has a calling line',HEROES.every(h=>new RegExp(h+":'[^']+'").test(hsrc)));
// ---- mob tuning: behaviour in a sandbox
const src=fs.readFileSync(R('r96/client-source/mobs-tune-r108.js'),'utf8');
check('no damage, health, reward or placement writes',!/\.(hp|maxHp|damage|x|y)\s*[+\-*]?=[^=]/.test(src.replace(/e\.x-ox|e\.y-oy/g,''))&&!/gainXP|room\.kills/.test(src));
let t=0;const shots=[],hurts=[],moved=[];const champ={id:'c1',wardChampionR81:true,hp:10,ai:'ranged',x:0,y:0,spawnState:'active',combatProfile:{attackShape:{range:1.2},bodyBlock:{r:.4}},rest:0,cd:1};
const mob={id:'m1',hp:5,direction:'left',x:3,y:0};const boss={id:'b1',hp:5,boss:true,wardChampionR81:true,ai:'ranged'};
const flips=[];let flipOut=true;const drawn=[];
const sb={window:{__STORYWORLD_ENEMY_MOTION_R51__:{flip:()=>flipOut}},localStorage:{getItem(){return null;},setItem(){}},
 get time(){return t;},room:{enemies:[champ,mob,boss]},player:{x:4.5,y:0,hp:10},modal:false,loading:false,hazards:[{owner:'c1',r58Affliction:{key:'bind'}}],
 tickEnemies(){},drawEnemy(e){drawn.push(e.direction);},makeShot(x,y,a,s,d,o){shots.push(o);return{};},hurt(v,s){hurts.push(s.r58Affliction?.key+'/'+s.r61Tag);return'hit';},
 moveActor(e,dx,dy){e.x+=dx;e.y+=dy;moved.push([dx,dy]);},clearLine:()=>true,facing:()=> 'right',fx(){},VFX:{mark:'m'},Object,Math,Number,String,JSON,WeakMap,Map};
vm.createContext(sb);vm.runInContext(src,sb);const T=sb.window.__STORYWORLD_MOBS_TUNE_R108__;
check('installs',!!T&&typeof sb.makeShot==='function');
sb.tickEnemies(.016);check('champion held at melee, boss untouched',champ.ai==='melee'&&boss.ai==='ranged'&&champ.r108OriginalAi==='ranged');
check('champion-owned hazard loses its status',!sb.hazards[0].r58Affliction);
sb.makeShot(0,0,0,1,1,{owner:'c1',r58Affliction:{key:'bind'}});sb.makeShot(0,0,0,1,1,{owner:'m1',r58Affliction:{key:'bind'}});
check('champion shots carry no status, other mobs keep theirs',!shots[0].r58Affliction&&shots[1].r58Affliction?.key==='bind');
const src1={owner:'c1',r58Affliction:{key:'bind'},r61Tag:'bind'};sb.hurt(5,src1);sb.hurt(5,{owner:'m1',r58Affliction:{key:'bleed'}});
check('champion hit reaches hurt with an unknown status key and the source is restored',hurts[0]==='r108-none/r108-none'&&src1.r58Affliction.key==='bind'&&src1.r61Tag==='bind'&&hurts[1].startsWith('bleed'));
// charge: wind up, dash toward the locked point, stop in reach
t=5;sb.tickEnemies(.016);const st=()=>T.inspect().champions[0].charge;
check('charge winds up at mid range',st()==='wind'&&champ.rest===0);
t=5.6;sb.tickEnemies(.05);check('dash phase after the wind-up',st()==='dash');
for(let i=0;i<20&&st();i++){t+=.05;sb.tickEnemies(.05);}check('dash moves toward the hero and ends in reach',moved.length>0&&Math.hypot(sb.player.x-champ.x,sb.player.y-champ.y)<=1.2*.85+.6&&st()===null);
// facing: a one-frame flip is ignored, a lasting one is taken after .28 s
const M=sb.window.__STORYWORLD_ENEMY_MOTION_R51__;t=10;flipOut=true;M.flip(mob,{});t=10.1;flipOut=false;const a1=M.flip(mob,{});t=10.12;flipOut=true;const a2=M.flip(mob,{});
check('single-frame flip is held',a1===true&&a2===true);
flipOut=false;t=10.2;M.flip(mob,{});t=10.45;const b1=M.flip(mob,{});t=10.52;const b2=M.flip(mob,{});
check('lasting flip is taken after the hold',b1===true&&b2===false);
sb.drawEnemy(mob);mob.direction='right';t=11;sb.drawEnemy(mob);
check('drawn direction is held for a moment and the real one restored',drawn.at(-1)==='left'&&mob.direction==='right');
console.log((failed?'FAIL ':'PASS ')+(n-failed)+'/'+n+' r108 hero/mob checks');process.exit(failed?1:0);
