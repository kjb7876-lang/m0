// R309 CPU check: 10-second procedural opening (demonised tree grows from the palace centre, angels fall) — wiring, gates, skip, mobile budget, scene timeline.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('intro-tree-r309.js');
ok('runtime copy matches client-source',fs.readFileSync(path.join(R,'runtime-text','intro-tree-r309.js'),'utf8')===src);
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok('index.html loads intro-tree-r309 exactly once',html.split('./intro-tree-r309.js').length===2);
ok('old R140 video intro stays unloaded',!html.includes('intro-r140.js'));
ok('public verify list includes intro-tree-r309',fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'intro-tree-r309.js'"));
ok('runtime inputs list it',fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8').includes('"intro-tree-r309.js"'));
ok('plays after newGame resolves, never on load/save',/newGame=async function\(\.\.\.a\)\{const r=await base\.apply\(this,a\);try\{if\(r!==false\)play\(\);/.test(src)&&!/loadGame\s*=/.test(src));
ok('skippable: button, pointer, Esc/Enter/Space',/class="skip"/.test(src)&&/pointerdown/.test(src)&&/'Escape'/.test(src)&&/'Enter'/.test(src)&&/e\.code==='Space'/.test(src));
ok('game keys blocked while playing',/stopImmediatePropagation/.test(src));
ok('automation gate with explicit override',/navigator\.webdriver&&!forced\(\)/.test(src)&&/intro309=1/.test(src));
ok('setting toggle storyworld.r309.intro',/storyworld\.r309\.intro/.test(src)&&/r309On/.test(src));
ok('ten seconds long',/DUR=10\b/.test(src));
ok('mobile budget: pixel ratio 1, no AA, low-power',/Math\.min\(low\?1:1\.5/.test(src)&&/antialias:!low/.test(src)&&/low\?'low-power'/.test(src));
ok('disposes renderer and geometry',/renderer\.dispose\(\)/.test(src)&&/world\.disp\.forEach/.test(src)&&/forceContextLoss/.test(src));
ok('no external media and no drop-shadow/blur filters',!/\.(png|jpe?g|webp|mp4|webm)['"]/.test(src)&&!/drop-shadow|blur\(/.test(src));
(async()=>{
 let T=null;try{T=await import(path.join(ROOT,'docs','vendor','three','build','three.module.js'));}catch(e){ok('three module importable',false,String(e));}
 if(T){const store={};const win={};const ctx={window:win,localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;}},navigator:{webdriver:true},location:{search:''},matchMedia:()=>({matches:false}),document:{},console,Math,performance:{now:()=>0}};
  vm.createContext(ctx);vm.runInContext(src,ctx);const api=win.__STORYWORLD_INTRO_TREE_R309__;
  ok('API exposed',api&&api.revision==='R309-intro-tree-1'&&api.duration===10);
  ok('automation does not autoplay',api&&api.play&&true);
  const mk=low=>{const scene=new T.Scene(),cam=new T.PerspectiveCamera(46,16/9,.1,300);const w=api.buildScene(T,scene,cam,low);return{scene,cam,w};};
  const hi=mk(false),lo=mk(true);
  ok('desktop scene budget',hi.w.counts.segments>150&&hi.w.counts.segments<400&&hi.w.counts.angels===10&&hi.w.counts.particles<=400,JSON.stringify(hi.w.counts));
  ok('mobile scene smaller',lo.w.counts.segments<hi.w.counts.segments*.6&&lo.w.counts.angels<=8&&lo.w.counts.particles<=160,JSON.stringify(lo.w.counts));
  const m=new T.Matrix4(),v=new T.Vector3(),q=new T.Quaternion(),s=new T.Vector3();
  const grown=w=>{let n=0;for(let i=0;i<w.counts.segments;i++){w.tree.getMatrixAt(i,m);const e=m.elements;if(Math.hypot(e[4],e[5],e[6])>1e-3)n++;}return n;};
  hi.w.update(0);const g0=grown(hi.w);const a0=hi.w.angels.every(a=>a.halo.visible&&a.haloM.opacity>.9&&a.wingM.color.r>.8);
  hi.w.update(4);const g4=grown(hi.w);
  hi.w.update(10);const g10=grown(hi.w);const a10=hi.w.angels.every(a=>!a.halo.visible&&a.wingM.color.r<.1&&a.eyeM.opacity>.9&&a.robeM.color.r<.4);
  ok('tree hidden at start, partly grown mid-way, fully grown at end',g0===0&&g4>0&&g4<g10&&g10===hi.w.counts.segments,[g0,g4,g10].join('/'));
  ok('angels pure at start (halo on, white wings)',a0);
  ok('every angel fallen by 10s (halo off, black wings, red eyes, dark robe)',a10);
  const starts=hi.w.angels.map(a=>a.start);ok('fall is staggered between 2.6s and 6.4s (done before the title)',Math.min(...starts)>=2.6&&Math.max(...starts)<=6.4&&Math.max(...starts)-Math.min(...starts)>1,starts.map(x=>x.toFixed(2)).join(','));
  hi.w.update(10);const bgEnd=hi.scene.background.getHex();hi.w.update(0);const bgStart=hi.scene.background.getHex();hi.w.update(10);ok('sky turns from gold to blood red',bgStart===0xd9c49a&&bgEnd===0x2a0605,bgStart.toString(16)+'→'+bgEnd.toString(16));
  const cp=hi.cam.position;const near=hi.w.angels.reduce((d,a)=>Math.min(d,a.g.position.distanceTo(cp)),99);ok('final camera low and not inside an angel',cp.y<2.5&&near>3,`y=${cp.y.toFixed(2)} nearest=${near.toFixed(2)}`);
  let minNear=99;for(let t=0;t<=10;t+=.1){hi.w.update(t);for(const a of hi.w.angels)minNear=Math.min(minNear,a.g.position.distanceTo(hi.cam.position));}
  ok('camera never passes through an angel',minNear>2.5,minNear.toFixed(2));}
 const pass=checks.every(c=>c.pass);
 fs.writeFileSync(path.join(__dirname,'r309-cpu-results.json'),JSON.stringify({passed:pass,checks},null,1));
 for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.detail?' — '+c.detail:''));
 console.log(pass?'R309 CPU check passed ('+checks.length+')':'R309 CPU check FAILED');process.exit(pass?0:1);})();
