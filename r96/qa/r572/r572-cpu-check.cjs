// R572 CPU check — 사몽 발현 중 영웅 고유 테마(오라 문양 + 스킬 적중 문양). 엔진 흉내 무대에 R571·R572 를 싣고 본다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),SRC=path.join(R,'client-source');
const results=[];const check=(name,ok,detail='')=>results.push({name,ok:!!ok,detail});
const FILE='samong-theme-r572.js',HEROES=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner'];
function stage(opt={}){const store=Object.assign({},opt.store||{}),ops=[];
 const ctx=new Proxy({filter:'none',globalAlpha:1,globalCompositeOperation:'source-over',fillStyle:'',strokeStyle:'',lineWidth:1,lineCap:'butt',lineJoin:'miter'},{
  get(t,k){if(k in t&&typeof t[k]!=='function')return t[k];if(k==='scope')return undefined;return (...a)=>{ops.push(String(k));};},
  set(t,k,v){t[k]=v;if(k==='filter')ops.push('filter:'+v);if(k==='fillStyle'||k==='strokeStyle')ops.push('colour:'+v);return true;}});
 const sb={console,JSON,Set,Map,WeakMap,Object,Array,Number,String,Boolean,Symbol,Error,TypeError,Proxy,Reflect,isFinite,performance:{now:()=>0},
  document:{getElementById:()=>null,querySelector:()=>null,createElement:()=>({style:{}}),head:{appendChild(){}},hidden:false},
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};
 sb.window=sb;vm.createContext(sb);
 vm.runInContext(`var started=true,modal=false,loading=false,layer='DREAM',time=100,zoom=1,settings={lowFx:false};var room={enemies:[]};var e568HeroActionContext=null;var ctx=null;var heroDraws=0;
  var player={hero:'hwando',x:10,y:10,hp:100,samong:0,samongCD:0,specialCD:0,blinkCD:0,egoCD:0,attackCD:0,storyWER:{ready:{},buffs:{}}};
  function project(x,y){return{x:(x-y)*64+640,y:(x+y)*32+300};}function actorHeight(){return 66*zoom;}
  function hitEnemy(e,v,s){e.hp-=v;return true;}function tick(dt){time+=dt;player.samong=Math.max(0,player.samong-dt);}
  function drawHero(){heroDraws++;}function delay(){}function special(){}`,sb);
 sb.ctx=ctx;vm.runInContext('ctx=window.ctx',sb);
 for(const f of [FILE,'samong-surge-r571.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),sb,{filename:f});
 return{sb,ops,run:c=>vm.runInContext(c,sb)};}
const draws=o=>o.filter(x=>x==='fill'||x==='stroke'||x==='fillRect'||x==='strokeRect').length;
let S;try{S=stage();}catch(e){check('module loads',false,String(e&&e.stack||e).split('\n').slice(0,3).join(' | '));}
if(S){const {run,sb,ops}=S;const T=sb.__STORYWORLD_SAMONG_THEME_R572__;
 check('module loads with API',T&&typeof T.theme==='function'&&typeof T.marks==='function');
 check('every hero has its own theme name',T&&HEROES.every(h=>T.theme(h)&&T.theme(h).name)&&new Set(HEROES.map(h=>T.theme(h).name)).size===8);
 const sig={};
 for(const h of HEROES){ops.length=0;run('player.hero="'+h+'";player.samong=0;drawHero()');const off=draws(ops);
  ops.length=0;run('player.samong=6;time+=.1;drawHero()');const on=draws(ops);sig[h]=ops.filter(o=>!o.startsWith('colour:')).join(',');
  check('theme motif draws only during 사몽 · '+h,off===0&&on>=4,'off '+on+'/'+off);}
 // R571 의 불꽃 오라도 함께 그려지므로 영웅별 차이는 R572 고유 부분으로 본다
 check('motif draw sequences differ between heroes',new Set(Object.values(sig)).size===8);
 ops.length=0;run('player.hero="hwando";player.samong=6;drawHero()');const hw=ops.filter(o=>o.startsWith('colour:')).join(' ');
 check('환도 수묵: ink-black strokes with silver and gold',/rgba\((1[0-9]|2[0-9]),(1[0-9]|2[0-9]),(1[0-9]|2[0-9]|3[0-9]),/.test(hw)&&/214,222,234/.test(hw)&&/255,198,72/.test(hw),hw.slice(0,200));
 const g=T.crossGeometry(66);check('슬레이어 cross is upright: top arm shorter than bottom (no inverted cross)',g.top<g.bottom&&g.top>0&&g.arm>0,JSON.stringify(g));
 check('never sets ctx.filter',!ops.some(o=>o.startsWith('filter:')));
 // ---- 스킬 적중 문양 ----
 run('player.hero="neon";player.samong=6');run('var en={id:"a",x:12,y:10,hp:999}');
 run('hitEnemy(en,5,{friendly:true,owner:"hero",attackKind9:"basic"})');check('basic attack hit makes no theme mark',T.marks().length===0);
 run('hitEnemy(en,5,{storyWER:true,sourceHero:"neon",friendly:true})');check('W/E/R skill hit during 사몽 makes a theme mark',T.marks().length===1&&T.marks()[0].hero==='neon');
 run('var en2={id:"c",x:13,y:11,hp:999};e568HeroActionContext={kind:"skill"};hitEnemy(en2,5,null);e568HeroActionContext=null');check('Q skill (e568 skill context) hit makes a mark',T.marks().length===2);
 run('time+=.01;hitEnemy(en,5,{attackKind9:"skill",friendly:true})');check('same enemy within .08 s does not stack a mark',T.marks().length===2);
 run('for(let i=0;i<200;i++){time+=.1;hitEnemy({id:"b"+i,x:10+i%5,y:10,hp:9},1,{storyWER:true})}');check('marks capped (≤ 24 live) for lag',T.marks().length<=24,T.marks().length);
 ops.length=0;run('drawHero()');const full=draws(ops);check('per-frame draw budget with full marks ≤ 260',full<=260,full);
 run('time+=5;drawHero()');check('marks expire',T.marks().length===0);
 run('player.samong=0;hitEnemy(en,5,{storyWER:true})');check('no mark outside 사몽',T.marks().length===0);
 run('settings.lowFx=true;player.samong=6;player.hero="lauren"');ops.length=0;run('drawHero()');const lo=draws(ops);run('settings.lowFx=false');ops.length=0;run('drawHero()');const hi=draws(ops);
 check('lowFx draws less',lo<hi,lo+' < '+hi);
 check('hero body drawn once per drawHero',run('heroDraws=0;drawHero();heroDraws')===1);
 check('nothing written to player (save stays clean)',!Object.keys(run('player')).some(k=>/r572|theme/i.test(k)));
}
{let X=null;try{X=stage({store:{'storyworld.r572.theme':JSON.stringify({on:false})}});}catch(e){}
 if(X){X.ops.length=0;X.run('player.hero="seoha";player.samong=6;drawHero()');const n=draws(X.ops);
  const Y=stage();Y.ops.length=0;Y.run('player.hero="seoha";player.samong=6;drawHero()');check('pref off: only the R571 flame aura remains',n>0&&n<draws(Y.ops),n+' vs '+draws(Y.ops));}
 else check('pref-off stage loads',false);}
const idx=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
check('runtime copy matches source',fs.existsSync(path.join(R,'runtime-text',FILE))&&fs.readFileSync(path.join(R,'runtime-text',FILE),'utf8')===fs.readFileSync(path.join(SRC,FILE),'utf8'));
check('index loads R572 right before R571 (R571 is the outer drawHero wrapper, so motifs sit between the flames and the body), before combat-r118',/actor-tone-r453\.js"><\/script>(?:<script src="\.\/hwando-chain-r590\.js"><\/script>)?<script src="\.\/samong-theme-r572\.js"><\/script><script src="\.\/samong-surge-r571\.js"><\/script>(?:<script src="\.\/slayer-sheets-r585\.js"><\/script>)?\s*<script src="\.\/combat-r118\.js">/.test(idx));
check('public verify lists the file',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes(FILE));
const failed=results.filter(r=>!r.ok);for(const r of results)console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.ok||!r.detail?'':' :: '+r.detail));
console.log(JSON.stringify({checks:results.length,failed:failed.length}));process.exit(failed.length?1:0);
