// R691 CPU 검사(Codex 리뷰 #420 P2, 사용자 2026-11-11 03:46Z "동시에 많은 사망 효과가 남을 때 렉이 생길 수 있다는 검토 지적").
//  R690 조각 모음(atlas)은 LRU 48칸에만 들어 있어, 죽는 중인 몹이 48마리를 넘으면 매 프레임 같은 순서로 그리며 서로 밀어내
//   프레임마다 캔버스를 새로 만들고 조각을 다시 자르고 텍스처를 다시 올렸다(49마리: 49→98→147).
//  고침: 조각 모음을 그 죽음(효과)과 사체가 직접 들고 있게 한다(캐시에서 밀려나도 다시 만들지 않음). 사체는 구운 뒤 조각 모음을 놓는다.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c,extra)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n,extra===undefined?'':JSON.stringify(extra).slice(0,600));}};
// ---------------------------------------------------------------- R462 환경(r660 검사와 같은 틀 + 캔버스 공장)
function env(o={}){const calls=[];let made=0;const g={window:{},localStorage:{getItem:()=>o.prefs?JSON.stringify(o.prefs):null,setItem(){}},setTimeout(){},Date,console,calls,Math,JSON};g.window=g;
 const mkCtx=id=>({id,stack:[],save(){this.stack.push(this.filter);calls.push({k:'save',c:id});},restore(){this.filter=this.stack.pop();calls.push({k:'restore',c:id});},translate(){},scale(){},rotate(){},setTransform(){},clearRect(){},
  beginPath(){},moveTo(){},lineTo(){},closePath(){},clip(){calls.push({k:'clip',c:id});},stroke(){},fill(){},ellipse(){},arc(){},fillRect(){},
  drawImage(im,...a){calls.push({k:'drawImage',c:id,src:im.src||im.id,a,filter:this.filter,alpha:this.globalAlpha});},globalAlpha:1,filter:'none',owner:{id:'scene',kind:'scene'}});
 if(!o.noCanvas)g.document={createElement(t){if(t!=='canvas')return{};made++;const cv={id:'bake'+made,width:0,height:0,getContext(){return this._c||(this._c=mkCtx(this.id));}};return cv;}};
 g.made=()=>made;g.mkCtx=mkCtx;vm.createContext(g);g.ready=o.ready!==false;
 vm.runInContext(`var time=0,zoom=1,settings={lowFx:${!!o.low}},room={id:'plaza'},effects=[],VFX={burnFlame:'assets/vfx/burn.png'};var ctx=mkCtx('main');
 ${o.recorder?"ctx.scope=function(owner,fn){calls.push({k:'scope',id:owner.id,kind:owner.kind});return fn();};ctx.commands=[];":""}
 function project(x,y){return{x:x*10,y:y*10};}function actorHeight(){return 60;}
 function readyImage(p){if(/own-/.test(p)&&!ready)return null;return{image:{src:p,naturalWidth:1536,naturalHeight:1024},crop:{w:80,h:100}};}
 function sprite(p,x,y,h,opt){opt=opt||{};calls.push({k:'sprite',p,opt,c:ctx.id,ctxFilter:ctx.filter});return true;}
 function drawAssetFrame3(p,f,x,y,h,opt){return false;}
 function texture(){}
 function drawEnemy(e){sprite(e.drawn,0,0,60,{flip:false});}
 function drawBurnDeath3(fx){}
 function drawObjective(){}
 function enterRegion(){return 1;}`,g);
 vm.runInContext(C('mob-death-r462.js'),g);return g;}
const api=g=>g.window.__STORYWORLD_MOB_DEATH_R462__;
function see(g,e){vm.runInContext('drawEnemy',g)(e);}
// 한 몹을 보이게 그린 뒤 죽음 1.8초 + 사체 frames 프레임(60fps)
function play(g,name,{frames=120,between}={}){const e={id:'m-'+name,name,hp:10,drawn:'assets/r380/mobs/own-'+name+'.webp'};see(g,e);
 const fx={type:'enemyBurnDeath',sourceId:e.id,x:3,y:4,age:0,life:.72};const draw=vm.runInContext('drawBurnDeath3',g),obj=vm.runInContext('drawObjective',g);
 for(let f=0;f<=108;f++){fx.age=f/60;vm.runInContext('time='+(f/60),g);if(fx.age<=fx.life)draw(fx);obj();}
 const per=[];for(let f=0;f<frames;f++){if(between)between(f);vm.runInContext('time='+(2+f/60),g);g.calls.length=0;obj();per.push(g.calls.slice());}return{e,per};}

ok('runtime copy matches source mob-death-r462.js',C('mob-death-r462.js')===RT('mob-death-r462.js'));
ok('R462 revision mentions R691',/REV='[^']*R691-/.test(C('mob-death-r462.js')));
function deaths(g,n,{prefix='m'}={}){const fxs=[];for(let i=0;i<n;i++){const e={id:prefix+i,name:'거미',hp:10,drawn:'assets/r380/mobs/own-'+prefix+i+'.webp'};see(g,e);fxs.push({type:'enemyBurnDeath',sourceId:e.id,x:i%10,y:Math.floor(i/10),age:0,life:.72});}return fxs;}
const draw=g=>vm.runInContext('drawBurnDeath3',g),obj=g=>vm.runInContext('drawObjective',g);
for(const n of [49,60,120]){const g=env({recorder:true});const fxs=deaths(g,n);const d=draw(g),seen=[];
 for(let f=0;f<4;f++){const age=.2+f/60;vm.runInContext('time='+age,g);for(const fx of fxs){fx.age=age;d(fx);}seen.push(api(g).inspect().stats.atlases||0);}
 ok(`${n} deaths at once: one piece sheet per death, never rebuilt across frames`,seen.every(v=>v===n),seen);
 ok(`${n} deaths at once: canvases made = deaths (no per-frame canvas)`,g.made()===n,g.made());}
// 사체로 넘어간 뒤: 구운 사체는 조각 모음 없이 그린다, 굽기 수 = 남은 사체 수, 그 뒤 프레임엔 새 캔버스 0
{const g=env({recorder:true});const fxs=deaths(g,60);const d=draw(g),o=obj(g);
 for(let f=0;f<=70;f++){const age=f/60;vm.runInContext('time='+age,g);for(const fx of fxs){fx.age=age;if(age<=fx.life)d(fx);}}
 vm.runInContext('time=1.3',g);o();const m1=g.made();for(let f=0;f<10;f++){vm.runInContext('time='+(1.31+f/60),g);o();}
 const s=api(g).inspect();ok('corpse phase: no new canvases on later frames',g.made()===m1,{m1,m2:g.made()});
 ok('corpse phase: kept corpses (cap 24) baked once each',s.corpses===24&&s.stats.bakes===24,{c:s.corpses,b:s.stats.bakes});
 ok('piece sheets built once per death (60), not per frame',s.stats.atlases===60,s.stats.atlases);}
// 회귀: 한 마리 죽음은 그대로 조각 모음 1장 · 사체 굽기 1장
{const g=env({recorder:true});const fxs=deaths(g,1);const d=draw(g),o=obj(g);for(let f=0;f<=80;f++){const age=f/60;vm.runInContext('time='+age,g);fxs[0].age=age;if(age<=fxs[0].life)d(fxs[0]);o();}
 const s=api(g).inspect();ok('single death: 1 piece sheet + 1 corpse bake',s.stats.atlases===1&&s.stats.bakes===1&&g.made()===2,{a:s.stats.atlases,b:s.stats.bakes,m:g.made()});}
// 경계: 캐시는 무한히 자라지 않는다(죽음 300번)
{const g=env({recorder:true});const fxs=deaths(g,300);const d=draw(g);vm.runInContext('time=.2',g);for(const fx of fxs){fx.age=.2;d(fx);}
 const s=api(g).inspect();ok('shared cache stays bounded (≤48) even after 300 deaths',typeof s.atlasCache==='number'&&s.atlasCache<=48,s.atlasCache);}
console.log(`\nR691 mob-death atlas retention CPU check: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
