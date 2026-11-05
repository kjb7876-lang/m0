// R324 보스 운석(fx-boss-r105 낙하·착지) 도형 제거 검사 — 원판·호·직선·점 원·타원 고리 없이 R106 칠한 스프라이트만.
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const src=fs.readFileSync(path.join(root,'client-source/fx-boss-r105.js'),'utf8');
assert.strictEqual(src,fs.readFileSync(path.join(root,'runtime-text/fx-boss-r105.js'),'utf8'));ok('client-source and runtime copies agree');
function body(name){const i=src.indexOf('function '+name+'(');assert(i>=0,name);let d=0,j=src.indexOf('{',i);for(let k=j;k<src.length;k++){if(src[k]==='{')d++;else if(src[k]==='}'){d--;if(!d)return src.slice(j,k+1);}}throw new Error(name);}
const flight=body('flight'),burst=body('burst');
for(const[nm,b]of[['flight',flight],['burst',burst]]){
 assert(!/ctx\.arc\(/.test(b),nm+' has ctx.arc');
 assert(!/lineTo\(/.test(b),nm+' has lineTo');
 assert(!/ellipse\([^)]*\);ctx\.stroke\(\)/.test(b),nm+' strokes an ellipse ring');
 ok(nm+': no circle, line or ring strokes');}
for(const s of["'smoke'","'flame'","'spark'"])assert(flight.includes(s),'flight uses '+s);ok('flight draws painted smoke, flame and spark sprites');
for(const s of["'flare'","'smoke'","'crack'","'spark'"])assert(burst.includes(s),'burst uses '+s);ok('burst draws painted flare, smoke, crack and spark sprites');
// 실행 검사: 가짜 ctx 로 flight·burst 를 돌려 arc/lineTo 호출이 0 인지, 스프라이트 draw 가 불리는지
const calls={arc:0,lineTo:0,stroke:0,sprite:[]};
const ctx=new Proxy({},{get:(o,k)=>k in o?o[k]:(k==='arc'?()=>calls.arc++:k==='lineTo'?()=>calls.lineTo++:k==='stroke'?()=>calls.stroke++:k==='createRadialGradient'?()=>({addColorStop(){}}):()=>{}),set:(o,k,v)=>(o[k]=v,true)});
const sandbox={window:{__STORYWORLD_FX_SPRITES_R106__:{draw:(name)=>calls.sprite.push(name),addFilter(){}}},ctx,time:1,zoom:1,TILE:32,W:800,H:600,project:(x,y)=>({x:x*32,y:y*32}),Math,Number,JSON,Object,Array,Set,Map,String,Boolean,console,performance:{now:()=>0},localStorage:{getItem:()=>null,setItem(){}},document:{createElement:()=>({getContext:()=>ctx,style:{}})},Image:function(){},setTimeout(){},requestAnimationFrame(){}};
const pre=src.slice(0,src.indexOf('function flight('));
const helpers=['rgba','glow','ellipse','hash','texture','drawImg','drawCell','hue'].filter(h=>new RegExp('(function|const|let) '+h+'\\b').test(src));
const fn=new Function(...Object.keys(sandbox),`const rgba=(c,a)=>'rgba(0,0,0,'+a+')',glow=()=>{},ellipse=()=>{},hash=s=>String(s).length*7,texture=()=>{},drawImg=()=>{},drawCell=()=>{},hue=()=>0,FAMILY={fire:0,frost:0,corruption:0},DIR='',VFX={bolt:null};\n${flight.replace(/^/,'function flight(m,k,lo)')}\n${burst.replace(/^/,'function burst(m,kb,lo)')}\nreturn {flight,burst};`);
const F=fn(...Object.values(sandbox));
for(const style of['meteor','comet','fireball']){const m={P:{a:[200,60,40],b:[255,200,160],style,elem:'fire'},cx:3,cy:3,ext:3,mode:'drop',dir:1,seed:5,from:{x:0,y:0}};
 for(const k of[.2,.6,.95])F.flight(m,k,false);for(const kb of[.1,.5,.9])F.burst(m,kb,false);}
assert.strictEqual(calls.arc,0,'arc calls');assert.strictEqual(calls.lineTo,0,'lineTo calls');ok('runtime flight/burst for meteor, comet and fireball make 0 arc and 0 lineTo calls');
assert(calls.sprite.includes('flame')&&calls.sprite.includes('crack')&&calls.sprite.includes('flare'),JSON.stringify([...new Set(calls.sprite)]));ok('runtime draws sprites: '+[...new Set(calls.sprite)].join(','));
console.log(JSON.stringify({ok:true,checks:n,method:'static + CPU fake-ctx; no WebGL or device'}));
