// R441 CPU check: 렉 개선(그림·판정 결과는 그대로, 계산 비용만 줄임)
//  ⓪ perf-r441: blocked() 를 tick 한 번 안에서만 같은 질문이면 다시 쓰기(숫자 해시 표), 문 세대·방 바뀌면 비움
//  ① R302 영웅 색: play-r111 호출은 4칸 스택으로 판정 끝(전체 스택 다시 잡기 없음), 소유 정보가 있으면 스택을 잡지 않음 — 판정 결과 동일
//  ② R409 테두리 굽기: 장면당 6ms 를 넘으면 나머지 새 굽기를 다음 장면으로(장면마다 적어도 1장), 주소가 같은 그림은 지역을 옮겨도 다시 굽지 않음, 픽셀 합계 상한
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=path.join(R,'runtime-text');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')),M=new Map(man.files.map(f=>[f.path,f.sha256]));
for(const F of ['perf-r441.js','hero-palette-r302.js','combat-read-r409.js']){const src=C(F);ok(F+' runtime copy matches',fs.readFileSync(path.join(RT,F),'utf8')===src);
 ok(F+' runtime-manifest hash matches',M.get(F)===crypto.createHash('sha256').update(fs.readFileSync(path.join(RT,F))).digest('hex'));}
const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');
ok('perf-r441 loads after combat-flow-r425 (outermost blocked/tick wrapper) and right before combat-r118',/<script src="\.\/combat-flow-r425\.js"><\/script><script src="\.\/perf-r441\.js"><\/script>(?:<script src="\.\/skill-attack-r440\.js"><\/script>)?(?:<script src="\.\/enemy-skill-pose-r442\.js"><\/script>)?(?:<script src="\.\/depth-overlap-r448\.js"><\/script>)?(?:<script src="\.\/cinema-run-r461\.js"><\/script>)?(?:<script src="\.\/mob-death-r462\.js"><\/script>)?(?:<script src="\.\/sin-boss-art-r463-data\.js"><\/script><script src="\.\/sin-boss-art-r463\.js"><\/script>)?(<script src="\.\/samong-rooms-r511\.js"><\/script>)?(?:<script src="\.\/weather-r450\.js"><\/script><script src="\.\/local-light-r451\.js"><\/script><script src="\.\/ground-fringe-r452\.js"><\/script><script src="\.\/actor-tone-r453\.js"><\/script>(?:<script src="\.\/[a-z-]+-r56[1-4]\.js"><\/script>)*)?\s*<script src="\.\/combat-r118\.js">/.test(html)&&html.split('perf-r441.js').length===2&&html.indexOf('cave-r204.js')<html.indexOf('perf-r441.js'));
ok('perf-r441 listed in verify-r96-public.py',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'perf-r441.js'"));
{const mk=()=>{const ctx={console,performance,Math,JSON,Map,Set,String,Number,Array,Object,Error,Float64Array,Int32Array,Uint32Array,Uint8Array};ctx.window=ctx;const store={};ctx.store=store;ctx.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}};vm.createContext(ctx);return ctx;};
 const ctx=mk();let g=0;ctx.__gen=()=>g;ctx.__bump=()=>{g++;};
 vm.runInContext(`var calls=0,walls=new Set(['1,1']),room={id:'a'},roomB={id:'b'},inner=[];
  function blocked(x,y,rad=.27,where=room){calls++;return walls.has(Math.floor(x)+','+Math.floor(y))||where===roomB&&x>5;}
  function tick(dt){inner.push(blocked(1.5,1.5),blocked(1.5,1.5),blocked(2.5,2.5),blocked(2.5,2.5,.27),blocked(2.5,2.5,.4,room),blocked(2.5,2.5,.4,room));return 7;}
  window.__STORYWORLD_WORLD_R74__={generation:()=>__gen()};`,ctx);
 vm.runInContext(C('perf-r441.js'),ctx,{filename:'perf-r441.js'});const api=ctx.__STORYWORLD_PERF_R441__;ok('perf-r441 api exposed',api&&api.revision.startsWith('R441'));
 const v=vm.runInContext('blocked(1.5,1.5)',ctx);vm.runInContext('blocked(1.5,1.5)',ctx);ok('outside tick: no memo',v===true&&vm.runInContext('calls',ctx)===2&&api.inspect().stats.hits===0);
 vm.runInContext('calls=0',ctx);ok('tick result passed through',vm.runInContext('tick(1)',ctx)===7);
 ok('inside tick: same (x,y,rad,room) computed once',vm.runInContext('calls',ctx)===4&&api.inspect().stats.hits===2,{calls:vm.runInContext('calls',ctx),st:api.inspect().stats});
 ok('answers identical to unmemoized',JSON.stringify(vm.runInContext('inner',ctx))==='[true,true,false,false,false,false]');
 ok('memo emptied when tick ends',api.inspect().used===0&&!api.inspect().inTick);
 // 많은 칸(해시 충돌·표 가득) — 답은 늘 같은 규칙
 vm.runInContext(`tick=(b=>function(){var bad=0;for(var i=0;i<9000;i++){var x=(i%97)+.5,y=Math.floor(i/97)+.25;var a=blocked(x,y),b2=blocked(x,y);var want=walls.has(Math.floor(x)+','+Math.floor(y));if(a!==want||b2!==want)bad++;}window.__bad=bad;return b.apply(this,arguments);})(tick);walls.add('3,4');walls.add('50,20');`,ctx);
 vm.runInContext('tick(1)',ctx);ok('9,000 cells × 2 queries in one tick: no wrong answer (collisions / full table)',vm.runInContext('__bad',ctx)===0);
 const c3=mk();let g3=0;c3.__gen=()=>g3;c3.__bump=()=>{g3++;};
 vm.runInContext(`var walls=new Set(),room={id:'a'},roomB={id:'b'},seq=[];
  function blocked(x,y,rad=.27,where=room){return walls.has(Math.floor(x)+','+Math.floor(y))||where===roomB&&x>5;}
  function tick(){seq.push(blocked(3.5,3.5));walls.add('3,3');__bump();seq.push(blocked(3.5,3.5));seq.push(blocked(6.5,1.5,.27,roomB));seq.push(blocked(6.5,1.5));seq.push(blocked(6.5,1.5,.27,roomB));}
  window.__STORYWORLD_WORLD_R74__={generation:()=>__gen()};`,c3);
 vm.runInContext(C('perf-r441.js'),c3);vm.runInContext('tick()',c3);
 ok('door generation change inside a tick → recomputed',JSON.stringify(vm.runInContext('seq.slice(0,2)',c3))==='[false,true]');
 ok('room is part of the key',JSON.stringify(vm.runInContext('seq.slice(2)',c3))==='[true,false,true]');
 api.set({blockedMemo:false});vm.runInContext('calls=0;inner=[];tick=function(){inner.push(blocked(1.5,1.5),blocked(1.5,1.5))}',ctx);
 const c4=mk();vm.runInContext(`var calls=0;function blocked(){calls++;return false}function tick(){blocked(1,1);blocked(1,1);}`,c4);c4.localStorage.setItem('storyworld.r441.perf','{"blockedMemo":false}');vm.runInContext(C('perf-r441.js'),c4);vm.runInContext('tick()',c4);
 ok('blockedMemo:false turns memo off',vm.runInContext('calls',c4)===2&&JSON.parse(ctx.store['storyworld.r441.perf']).blockedMemo===false);}
ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r441/r441-cpu-check.cjs'));
// ① 전제: play-r111 threadSlash 는 스프라이트를 직접 또는 안쪽 cut 화살표로만 부른다(그래서 4칸 = remapF·감싸기·cut·threadSlash 안에 들어온다)
{const s=C('play-r111.js'),a=s.indexOf('function threadSlash('),b=s.indexOf('stats.threadSlashes++;return true;}',a);const body=a>=0&&b>a?s.slice(a,b):'';
 const helpers=[...body.matchAll(/const (\w+)=\([^)]*\)=>\{/g)].map(m=>m[1]);
 const calls=[...body.matchAll(/(?<![.\w])([A-Za-z_]\w*)\(/g)].map(m=>m[1]).filter(n=>!/^(S|SPR|actorHeight|clamp|project|finite|rnd|Math|cut|if|for|function|threadSlash|sin|cos|atan2|min|max)$/.test(n));
 ok('play-r111 threadSlash draws directly or via its own cut arrow only',body.length>200&&helpers.join()==='cut'&&/S\.along\(/.test(body)&&calls.length===0,{helpers,calls});}
{const ctx={console,performance,Math,JSON,Map,Set,WeakMap,WeakSet,String,Number,Array,Object};ctx.window=ctx;ctx.localStorage={getItem:()=>null,setItem(){}};ctx.player={hero:'neon'};vm.createContext(ctx);
 vm.runInContext(`window.__STORYWORLD_FX_SPRITES_R106__={pal:(a,b)=>b?{a,b}:a,draw:(n,F)=>F,along:(n,F)=>F,poly:F=>F,warm:F=>F,ready:(n,F)=>F,parseColour:()=>null};`,ctx);
 const src=C('hero-palette-r302.js');ok('R302 play-r111 short stack is decisive + lazy stack when ownership known',/const shortOk=\(file,stack\)=>!!file;/.test(src)&&/isHero\(o,h,lazyStack\)/.test(src)&&/isHero\(opt\|\|\{\},h,lazyStack\)/.test(src));
 vm.runInContext(src,ctx,{filename:'http://x/m0/hero-palette-r302.js'});
 const S='window.__STORYWORLD_FX_SPRITES_R106__';
 vm.runInContext(`function heroFx(F){return ${S}.draw('s',F)}`,ctx,{filename:'http://x/m0/hero-fx-r102.js'});
 vm.runInContext(`function mobFx(F){return ${S}.draw('s',F)}`,ctx,{filename:'http://x/m0/mob-style-r199.js'});
 vm.runInContext(`function threadSlash(F){const cut=()=>${S}.along('a',F);return [${S}.draw('s',F),cut()]} function bossArt(F){return ${S}.draw('s',F)}`,ctx,{filename:'http://x/m0/play-r111.js'});
 vm.runInContext(`function deep(n,f,F){return n?deep(n-1,f,F):f(F)}`,ctx,{filename:'http://x/m0/index.html'});
 const F={a:[255,0,0],b:[10,10,10]},J=x=>JSON.stringify(x),run=e=>J(vm.runInContext(e,ctx));
 const hero=run(`heroFx(${J(F)})`),mob=run(`mobFx(${J(F)})`),th=JSON.parse(run(`threadSlash(${J(F)})`)),boss=run(`bossArt(${J(F)})`);
 ok('hero file → hero 2 colours (mint·silver)',[J({a:[226,232,242],b:[62,230,193]}),J({a:[62,230,193],b:[226,232,242]})].includes(hero),hero);
 ok('mob file → untouched',mob===J(F));ok('play-r111 boss art → untouched',boss===J(F));
 ok('play-r111 threadSlash (direct and via cut) → thread palette',J(th[0])!==J(F)&&J(th[1])!==J(F)&&J(th[0])===J(th[1]),th);
 ok('deep call chains give the same answers',run(`deep(8,heroFx,${J(F)})`)===hero&&run(`deep(8,mobFx,${J(F)})`)===J(F)&&run(`deep(8,bossArt,${J(F)})`)===J(F)&&run(`deep(8,threadSlash,${J(F)})`)===J([th[0],th[1]]));
 for(let i=0;i<20;i++)vm.runInContext(`bossArt(${J(F)})`,ctx);
 const st=vm.runInContext('window.__STORYWORLD_HERO_PALETTE_R302__.inspect().stats',ctx);ok('play-r111 boss art no longer re-grabs the full stack',(st.spFull||0)===0&&st.errors===0,st);}
// ② R409 굽기 나누기 — 가짜 캔버스로 한 장면 안 여러 새 그림: 6ms 넘으면 미룸, 다음 장면에 굽기
{const src=C('combat-read-r409.js');ok('R409 bake budget source (6ms, ≥1 per frame, deferred count, frame reset)',/BAKE_BUDGET_MS=6/.test(src)&&/bakeFrame\.n>0&&bakeFrame\.ms>=BAKE_BUDGET_MS/.test(src)&&/stats\.bakeDeferred/.test(src)&&/bakeFrame\.n=0;bakeFrame\.ms=0;bakeFrame\.at=performance\.now\(\)/.test(src));
 let clock=0;const perf={now:()=>clock};
 const mkCanvas=()=>({width:0,height:0,getContext:()=>({drawImage(){clock+=0.05;},getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4).fill(255)}),putImageData(){},fillRect(){},set fillStyle(v){},set globalCompositeOperation(v){}})});
 const ctx={console,Math,JSON,Map,Set,WeakMap,WeakSet,String,Number,Array,Object,performance:perf,setInterval:()=>0,document:{createElement:()=>mkCanvas()}};ctx.window=ctx;
 /* 이 가짜 시계는 drawImage 한 번에 0.05ms 를 센다 — 예전 불리기 길(drawImage 수십 번)로 예산 나누기를 본다. R492 거리 변환 길은 r492 검사가 따로 본다. */
 ctx.localStorage={getItem:k=>k==='storyworld.r409.combatRead'?'{"fastBake":false}':null,setItem(){}};vm.createContext(ctx);
 vm.runInContext(src,ctx);const api=ctx.__STORYWORLD_COMBAT_READ_R409__;const img={width:200,height:200};
 api.process([{kind:'image'}]);/* 장면 시작 */let made=0,nul=0;for(let i=0;i<10;i++){const r=api.bake(img,i*10,0,60,80,4,'enemy');if(r)made++;else nul++;}
 const st1=api.inspect().stats;ok('one frame: bakes stop after the 6ms budget, rest deferred',made>=1&&made<10&&nul===10-made&&st1.bakeDeferred===nul,{made,nul,st:st1});
 api.process([{kind:'image'}]);/* 다음 장면 */const again=api.bake(img,90,0,60,80,4,'enemy');ok('next frame: deferred picture gets baked',!!again);
 const cached=api.bake(img,0,0,60,80,4,'enemy');ok('already baked picture comes from cache even over budget',!!cached);
 api.process([{kind:'image'}]);const u1={width:200,height:200,src:'http://x/m0/assets/mob/a.webp'},u2={width:200,height:200,src:'http://x/m0/assets/mob/a.webp'};
 const b1=api.bake(u1,0,0,60,80,4,'enemy'),n1=api.inspect().stats.baked;api.process([{kind:'image'}]);const b2=api.bake(u2,0,0,60,80,4,'enemy');
 ok('same image address (new Image object after zone change) reuses the baked outline',b1&&b2===b1&&api.inspect().stats.baked===n1);
 const c1={width:200,height:200},c2={width:200,height:200};api.process([{kind:'image'}]);const d1=api.bake(c1,0,0,60,80,4,'enemy');api.process([{kind:'image'}]);const d2=api.bake(c2,0,0,60,80,4,'enemy');
 ok('canvases without address stay keyed per object',d1&&d2&&d1!==d2);
 ok('cache bounded by pixel total (7M) as well as count',/CACHE_PX=7000000/.test(src)&&/cachePx>CACHE_PX/.test(src)&&typeof api.inspect().cachedPx==='number');}
const passed=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail??'')));
console.log(JSON.stringify({passed,total:checks.length}));if(passed!==checks.length)process.exit(1);
