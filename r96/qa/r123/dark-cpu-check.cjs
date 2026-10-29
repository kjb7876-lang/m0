// R123 CPU check: 다크 판타지 호러 톤(dark-r123.js). R114 호러 색보정 필터 끝에 녹·피 색이 붙는지(세기별·끄기),
// 화로·횃불·제단 소품과 뒷벽 횃불 자리에서만 붉은 불빛을 그리는지(문·몹 그림은 제외, 화면 안 8개 상한),
// 설정 저장, 새 파일 등록을 본다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'client-source'),RT=path.join(ROOT,'runtime-text'),REPO=path.join(ROOT,'..');
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+String(detail).slice(0,400)));};
const el=()=>{const e={style:{},children:[],setAttribute(){},appendChild(c){e.children.push(c);return c;},querySelector:()=>el(),querySelectorAll:()=>[],getContext:()=>null,getBoundingClientRect:()=>({left:0,top:0,width:1280,height:800}),isConnected:true,after(){},classList:{toggle(){}}};return e;};
const canvases={game:el(),'phase1-webgl':el(),stage:el()};
const store=new Map();
const sb={console,Math,JSON,Date,Set,Map,WeakMap,WeakSet,Object,Array,Number,String,Boolean,Symbol,Error,TypeError,Promise,performance:{now:()=>0},
 document:{getElementById:id=>canvases[id]||null,createElement:()=>el(),head:{appendChild(){}},querySelector:()=>null},getComputedStyle:()=>({position:'relative'}),
 localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},settings:{lowFx:false,reducedMotion:false}};
sb.window=sb;vm.createContext(sb);
const ALLOWED=['save','restore','transform','translate','rotate','scale','beginPath','moveTo','lineTo','closePath','rect','ellipse','arc','quadraticCurveTo','bezierCurveTo','fill','stroke','fillRect','fillText','createRadialGradient','createLinearGradient','scope'];
const cmds=[];const ctx={commands:cmds};for(const m of ALLOWED)ctx[m]=function(...a){if(['fill','stroke','fillRect','fillText'].includes(m))cmds.push(m);if(m.startsWith('create'))return{addColorStop(){}};if(m==='scope')return a[1]();};
sb.ctx=new Proxy(ctx,{get(t,k){if(k in t)return t[k];if(typeof k==='string'&&/^[a-z][A-Za-z]+$/.test(k)&&!['fillStyle','strokeStyle','lineWidth','globalAlpha','then'].includes(k))throw new TypeError('ctx.'+k+' is not a function');},set(t,k,v){t[k]=v;return true;}});
Object.assign(sb,{shadow(){},TILE:34,zoom:1,W:1280,H:800,time:3,started:true,player:{x:5,y:5},cam:{x:5,y:5},project:(x,y)=>({x:(x-y)*34+640,y:(x+y-10)*17+416}),drawExits(){},showSettings(){}});
for(const f of['cinema-r114.js','dark-r123.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),sb,{filename:f});
const C=sb.__STORYWORLD_CINEMA_R114__,D=sb.__STORYWORLD_DARK_R123__;
check('modules load (cinema R114 + dark R123)',C&&D&&D.revision==='R123-dark-1');
check('levels 끔/약/보통/강, default 보통',D.levels.join()==='off,low,mid,high'&&D.prefs().tone==='mid');
const sep=k=>+(/sepia\(([\d.]+)\)/.exec(D.tones[k].filter)||[])[1];
check('colour leans to rust/blood and grows with level (sepia + hue toward red + lower saturation)',D.tones.off===null&&sep('low')<sep('mid')&&sep('mid')<sep('high')&&['low','mid','high'].every(k=>/hue-rotate\(-\d+deg\)/.test(D.tones[k].filter)&&/contrast/.test(D.tones[k].filter)));
const W=()=>canvases['phase1-webgl'].style.filter;
C.set({horror:'mid'});C.applyGrade(true);const midCinema='contrast(1.1) saturate(.8) brightness(.95)';
check('R114 grade + R123 tone are chained on the world canvases',W()===midCinema+D.tones.mid.filter&&canvases.game.style.filter===W(),W());
D.set({tone:'off'});check('tone off → only the R114 grade remains',W()===midCinema,W());
C.set({horror:'off'});D.set({tone:'high'});check('horror off but tone on → the tone alone',W()===D.tones.high.filter.trim(),W());
D.set({tone:'off'});check('both off → no filter',W()==='',W());
C.set({horror:'mid'});D.set({tone:'mid'});
// 불빛
const isL=D.isLight;
check('fire props light up; doors, fire beasts and effects do not',isL({r74Prop:'brazier'})&&isL({path:'new_assets/props-part01-batch01/p12_ritual_fire_brazier.png'})&&isL({path:'assets/x/blood_altar.webp'})&&!isL({path:'new_assets/props-part02-batch01/ep1b07-burned-firedoor.png'})&&!isL({path:'assets/episode1b/wrath_fire_beast.webp'})&&!isL({r74Prop:'crate'})&&!isL({r74Prop:'brazier',visible:false}));
const cells=[];for(let x=0;x<40;x++)for(let y=0;y<40;y++)cells.push([x,y]);
sb.room={props:[{id:'b1',x:6,y:6,r74Prop:'brazier'},{id:'d',x:8,y:8,path:'a/ep1b07-burned-firedoor.png'}],exploration:{floorCells:cells}};
cmds.length=0;const lit=D.drawLights();
check('torch pools: brazier + back-wall sconces, at most 8 drawn a frame, one fill each',lit>=2&&lit<=8&&cmds.length===lit,lit+' '+cmds.length);
D.set({torches:false});cmds.length=0;check('설정: 불빛 끄기 → 그리지 않음',D.drawLights()===0&&cmds.length===0);D.set({torches:true});
D.set({tone:'off'});check('tone off → no torch pools',D.drawLights()===0);D.set({tone:'mid'});
check('설정 저장(r123.dark)',JSON.parse([...store.entries()].find(([k])=>k.endsWith('r123.dark'))[1]).tone==='mid');
check('no failures recorded',D.inspect().failures===0,D.inspect().lastError);
const src=fs.readFileSync(path.join(SRC,'dark-r123.js'),'utf8'),html=fs.readFileSync(path.join(RT,'index.html'),'utf8');
check('code-only: no new image files referenced',!/assets\//.test(src));
check('runtime copies match sources; dark-r123 loads after cinema-r114 and before audio-r98',fs.readFileSync(path.join(RT,'dark-r123.js'),'utf8')===src&&fs.readFileSync(path.join(RT,'cinema-r114.js'),'utf8')===fs.readFileSync(path.join(SRC,'cinema-r114.js'),'utf8')&&html.indexOf('dark-r123.js')>html.indexOf('cinema-r114.js')&&html.indexOf('dark-r123.js')<html.indexOf('src="./audio-r98.js"'));
const pub=fs.readFileSync(path.join(REPO,'scripts','verify-r96-public.py'),'utf8'),ci=fs.readFileSync(path.join(REPO,'.github','workflows','pages.yml'),'utf8'),inputs=JSON.parse(fs.readFileSync(path.join(ROOT,'runtime-inputs.json'),'utf8'));
check('registered in runtime inputs, public verify list and CI',inputs.textPaths.includes('dark-r123.js')&&pub.includes("'dark-r123.js'")&&ci.includes('r96/qa/r123/dark-cpu-check.cjs'));
console.log(`\n${n-failed}/${n} passed`);process.exit(failed?1:0);
