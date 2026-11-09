// R493 CPU check: 렉 개선 — 같은 셰이더 프로그램을 버렸다 다시 컴파일하지 않게 붙잡아 두기
//  three r186 WebGLPrograms.acquireProgram/releaseProgram(three.module.js 7929~7966)과 같은 규칙의 모의 프로그램 캐시로 본다:
//  ① 재질이 모두 버려져도 프로그램이 살아 있고 같은 열쇠의 새 재질은 다시 링크하지 않음 ② 이미 있던 프로그램도 붙잡음
//  ③ 상한(256)을 넘으면 더 붙잡지 않음(예전처럼 동작) ④ 렌더러가 바뀌면 새 목록에 붙음 ⑤ 끄기 ⑥ 스크립트·목록 연결
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),RT=path.join(R,'runtime-text'),F='perf-r493.js';
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const file=path.join(R,'client-source',F),src=fs.existsSync(file)?fs.readFileSync(file,'utf8'):null;ok(F+' exists',!!src);
if(src){
 ok(F+' runtime copy matches',fs.existsSync(path.join(RT,F))&&fs.readFileSync(path.join(RT,F),'utf8')===src);
 const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')),M=new Map(man.files.map(f=>[f.path,f.sha256]));
 ok(F+' runtime-manifest hash matches',fs.existsSync(path.join(RT,F))&&M.get(F)===crypto.createHash('sha256').update(fs.readFileSync(path.join(RT,F))).digest('hex'));
 ok(F+' loaded by index.html',fs.readFileSync(path.join(RT,'index.html'),'utf8').includes('<script src="./'+F+'"></script>'));
 ok(F+' listed in verify-r96-public.py',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"));
 ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r493/r493-cpu-check.cjs'));
 const ENGINE=`function Programs(){const programs=[],map=new Map();let links=0,destroyed=0;
   function acquire(key){let p=map.get(key);if(p!==undefined){++p.usedTimes;}else{links++;p={cacheKey:key,usedTimes:1,alive:true,destroy(){this.alive=false;destroyed++;}};programs.push(p);map.set(key,p);}return p;}
   function release(p){if(--p.usedTimes===0){const i=programs.indexOf(p);programs[i]=programs[programs.length-1];programs.pop();map.delete(p.cacheKey);p.destroy();}}
   return {programs,acquire,release,stats:()=>({links,destroyed,live:programs.length})};}
  function Renderer(){this.cache=Programs();this.info={programs:this.cache.programs};}
  var three={renderer:new Renderer()};window.__STORYWORLD_PHASE1__={controller:{state:{three}}};`;
 const mk=(store={})=>{const ctx={console,setInterval:()=>0};ctx.window=ctx;ctx.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}};vm.createContext(ctx);vm.runInContext(ENGINE,ctx);vm.runInContext(src,ctx,{filename:F});return ctx;};
 const ctx=mk(),api=ctx.__STORYWORLD_PERF_R493__,run=s=>vm.runInContext(s,ctx);ok('api exposed',api&&String(api.revision).startsWith('R493'));
 run(`var C=three.renderer.cache,pre=C.acquire('basic,pre');`);api.tick();
 ok('existing program pinned on attach',run('pre.usedTimes')===2&&api.inspect().pinned===1);
 // 이펙트 재질이 생겼다 사라지기를 20번(같은 열쇠) — 예전엔 20번 링크·19번 파괴
 run(`for(let i=0;i<20;i++){const p=C.acquire('basic,fx');C.release(p);}`);
 ok('same-key material churn: linked once, never destroyed',run('C.stats().links')===2&&run('C.stats().destroyed')===0&&run("C.programs.some(p=>p.cacheKey==='basic,fx'&&p.alive)"),run('C.stats()'));
 run(`C.release(pre);`);ok('pre-existing program survives its last material',run('pre.alive&&pre.usedTimes===1'));
 // 동시에 여럿 쓰는 경우 — 엔진 refcount 그대로
 run(`var a=C.acquire('k2'),b=C.acquire('k2');`);ok('engine refcount kept (+1 pin)',run('a===b&&a.usedTimes===3'));
 // 상한
 run(`for(let i=0;i<400;i++){const p=C.acquire('cap'+i);C.release(p);}`);const ins=api.inspect();
 ok('cap: at most 256 pinned, programs past the cap behave as before (destroyed when unused)',ins.pinned===256&&run("C.programs.filter(p=>p.cacheKey.startsWith('cap')).length")===256-3&&run('C.stats().destroyed')===400-(256-3),{ins,st:run('C.stats()')});
 // 직접 짠 셰이더 열쇠('12,13,…')는 번호가 매번 새로워 붙잡지 않음(상한 낭비 방지)
 {const c=mk();vm.runInContext(`var C=three.renderer.cache;`,c);c.__STORYWORLD_PERF_R493__.tick();vm.runInContext(`var q=C.acquire('12,13,highp,srgb');C.release(q);`,c);
  ok('custom ShaderMaterial keys (shader-id prefix) not pinned',vm.runInContext('!q.alive',c)&&c.__STORYWORLD_PERF_R493__.inspect().pinned===0&&c.__STORYWORLD_PERF_R493__.inspect().skipped===1);}
 // ⑦ 그림자 띠(그라디언트) ShaderMaterial: 셰이더 글 번호가 재질이 다 사라질 때마다 새로 붙던 것 — 지킴이 재질 하나로 번호를 고정
 {const G=`function Stages(){const by=new Map();let next=8;return {get(code){let s=by.get(code);if(!s){s={id:next++,code,usedTimes:0};by.set(code,s);}return s;},drop(s){if(--s.usedTimes===0)by.delete(s.code);}};}
   function R2(){const st=Stages(),cache=Programs();this.cache=cache;this.info={programs:cache.programs};const props=new WeakMap();this.properties={get:m=>{let v=props.get(m);if(!v){v={};props.set(m,v);}return v;}};
    this.use=m=>{const v=st.get(m.vertexShader),f=st.get(m.fragmentShader);if(!m.__st){m.__st=[v,f];v.usedTimes++;f.usedTimes++;}const p=cache.acquire(v.id+','+f.id+',highp');this.properties.get(m).currentProgram=p;m.__p=p;return p;};
    this.dispose=m=>{cache.release(m.__p);for(const s of m.__st)st.drop(s);};
    this.compile=(scene)=>{for(const o of scene.children)this.use(o.material);};}
   var GV='attribute vec2 screenPosition; void main(){}',GF='precision highp float; uniform vec4 colors[12]; void main(){}';
   var T={Scene:function(){this.children=[];this.add=o=>this.children.push(o);},Mesh:function(g,m){this.geometry=g;this.material=m;},BufferGeometry:function(){},OrthographicCamera:function(){}};
   three.renderer=new R2();three.T=three.renderer.T=T;three.camera=new T.OrthographicCamera();three.commands={gradientMaterial:g=>({isShaderMaterial:true,vertexShader:GV,fragmentShader:GF,g})};`;
  const runG=(store)=>{const c=mk(store);vm.runInContext(G,c);c.__STORYWORLD_PERF_R493__.tick();c.__STORYWORLD_PERF_R493__.tick();
   vm.runInContext(`for(let i=0;i<30;i++){const m=three.commands.gradientMaterial({});three.renderer.use(m);three.renderer.dispose(m);}`,c);return c;};
  const on=runG({}),off=runG({'storyworld.r493.perf':'{"pinPrograms":false}'});
  const lo=vm.runInContext('three.renderer.cache.stats().links',on),lf=vm.runInContext('three.renderer.cache.stats().links',off);
  ok('gradient ShaderMaterial churn: keeper fixes the shader ids → one program, no relinks (engine: 30)',lo===1&&lf===30&&on.__STORYWORLD_PERF_R493__.inspect().keepers===1,{on:lo,off:lf,ins:on.__STORYWORLD_PERF_R493__.inspect()});}
 // 새 렌더러
 run(`three.renderer=new Renderer();var C2=three.renderer.cache;`);api.tick();run(`for(let i=0;i<5;i++){const p=C2.acquire('basic,fx');C2.release(p);}`);
 ok('new renderer: its program list gets pinned too',run('C2.stats().links')===1&&run('C2.stats().destroyed')===0);
 // 끄기
 const off=mk({'storyworld.r493.perf':'{"pinPrograms":false}'});vm.runInContext(`var C=three.renderer.cache;`,off);off.__STORYWORLD_PERF_R493__.tick();vm.runInContext(`for(let i=0;i<5;i++){const p=C.acquire('x');C.release(p);}`,off);
 ok('pinPrograms:false → engine behaviour (relinks every time)',vm.runInContext('C.stats().links',off)===5&&off.__STORYWORLD_PERF_R493__.inspect().pinned===0);
 const store={};const c3=mk(store);c3.__STORYWORLD_PERF_R493__.set({pinPrograms:false});ok('set() persists',JSON.parse(store['storyworld.r493.perf']).pinPrograms===false);
 ok('no errors',api.inspect().errors===0,api.inspect());
}
const fail=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass||c.detail===undefined?'':' '+JSON.stringify(c.detail)));
console.log(JSON.stringify({check:'r493',total:checks.length,failed:fail.length}));if(fail.length)process.exit(1);
