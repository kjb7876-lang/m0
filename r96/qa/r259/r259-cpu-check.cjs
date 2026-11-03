// R259 — 플레이어 적중 이펙트를 적 그림 가운데로 + R248 몹은 영웅 8칸 안에서 영웅 쪽을 본다.
//  실측(헤드리스 dist02): 진흙등 거미 몸 그림 가운데 ≈ 발 위 64px, 엔진 적중 그림은 영웅 키×0.3 ≈ 16px(다리) → 옮긴 뒤 자동 전투에서 적중 그림 10건·기술 끝점 5건이 그림 가운데로.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');const src=C('hit-center-r259.js');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
ok('runtime copies match',RT('hit-center-r259.js')===src&&RT('hero-fx-r102.js')===C('hero-fx-r102.js')&&RT('mob-unique-r248.js')===C('mob-unique-r248.js'));
const idx=RT('index.html');ok('loads after mob-unique-r248 and mob-preload-r260 (outermost drawEnemy: measures the body that is actually painted)',idx.indexOf('hit-center-r259.js')>idx.indexOf('mob-preload-r260.js')&&idx.indexOf('mob-preload-r260.js')>idx.indexOf('"./mob-unique-r248.js"'));
function make(){const ctx={localStorage:{getItem:()=>null,setItem:()=>{}},console,Math,JSON,String,Array,Set,WeakMap,Map,Object,Number,Promise,performance:{now:()=>1000}};ctx.window=ctx;
 const log=[];let T={a:1,b:0,c:0,d:1,e:0,f:0};const c2d={getTransform:()=>({...T}),drawImage(){},translate(x,y){log.push(['t',x,y]);},save(){},restore(){}};
 const img={width:100,height:100,naturalWidth:100,naturalHeight:100,src:'assets/mobs/x.webp'};
 Object.assign(ctx,{ctx:c2d,time:1,effects:[],room:{enemies:[]},actorHeight:()=>50,project:(x,y)=>({x:x*10,y:y*10}),
  drawEnemy:e=>{c2d.drawImage(img,0,0,100,100,e.x*10-30,e.y*10-120,60,120);},drawEffect:f=>{log.push(['d',f.type]);},fx:(type,x,y,o={})=>{ctx.effects.push({type,x,y,...o});}});
 ctx.document={createElement:()=>({getContext:()=>({clearRect(){},drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(40*40*4).fill(255)})})})};
 vm.createContext(ctx);vm.runInContext(src,ctx);return {ctx,log};}
{const {ctx,log}=make();const e={id:'a',hp:10,x:5,y:5};ctx.room.enemies.push(e);ctx.drawEnemy(e);const H=ctx.__STORYWORLD_HIT_CENTER_R259__;const v=H.centreOf(e);
 ok('measures the painted body box of the enemy (outermost drawEnemy)',v&&Math.abs(v.cy-(50-60))<1&&Math.abs(v.top-(-70))<1,v);
 ctx.fx('burst',5,5);const f=ctx.effects[0];ok('an engine hit burst at the enemy feet is linked to that enemy',f.r259E===e);
 log.length=0;ctx.drawEffect(f);const t=log.find(x=>x[0]==='t');ok('it is drawn at the body centre (translated from feet+0.3×hero height to the centre)',t&&Math.abs(t[2]-(v.cy-(50-15)))<1e-6,t);
 ctx.fx('text',5,5,{text:'9'});log.length=0;ctx.drawEffect(ctx.effects[1]);const t2=log.find(x=>x[0]==='t');ok('damage numbers go just above the head',t2&&Math.abs(t2[2]-((v.top-6)-(50-50*.65)))<1e-6,t2);
 const a=H.aim(5,5);ok('aim() at an enemy foot returns its body centre; elsewhere the plain projected point',Math.abs(a.y-v.cy)<1e-6&&H.aim(9,9).y===90);
 ctx.fx('burst',1,1);log.length=0;ctx.drawEffect(ctx.effects[2]);ok('effects that are not on an enemy are untouched',!log.some(x=>x[0]==='t'));}
const hf=C('hero-fx-r102.js');ok('hero-fx-r102: air end points (bolt, x-slash, shatter, petals) use the aimed centre; ground glyphs (rune, shock, pillar) stay at the feet',(hf.match(/qt\.cy\?\?/g)||[]).length===5&&/qt=project\(e\.tx,e\.ty\)/.test(hf)&&/aim\?\.\(e\.tx,e\.ty\)/.test(hf)&&/runeCircle\(qt\.x,qt\.y,/.test(hf));
const mu=C('mob-unique-r248.js');ok('R248 own sheets: within 8 tiles of the hero the mob faces the hero while walking or circling; far away it faces where it walks',/if\(hd<8\)\{if\(Math\.abs\(sdH\)>\.05\)m\.face=sdH<0\?-1:1;\}else if\(Math\.abs\(sx\)>\.001\)m\.face=sx<0\?-1:1;/.test(mu));
try{new vm.Script(src);new vm.Script(hf);new vm.Script(mu);ok('syntax',true);}catch(e){ok('syntax',false,String(e));}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R259 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
