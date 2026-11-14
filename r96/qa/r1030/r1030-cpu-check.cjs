// R1030 CPU 검사: 영웅 그림 장면 맞춤 — 밝은 옷 영웅만 몸 노출을 장면 기준 쪽으로(가독성 하한 지킴), 어두운 옷 영웅·모르는 영웅은 그대로,
//  NaN·Infinity 빛에서도 유한한 보정, 그린 뒤 필터 되돌림, 몹·이펙트·바닥 붙은 그림은 건드리지 않음, 발 닿음 그림자 1번(R821 방 제외),
//  런타임 사본·매니페스트·스크립트 순서·공개 검증 목록·CI 줄.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),RT=path.join(R,'runtime-text'),FILE='hero-harmony-r1030.js';
const checks=[];const ok=(n,p,d)=>checks.push({n,p:!!p,d});
const src=fs.existsSync(path.join(R,'client-source',FILE))?fs.readFileSync(path.join(R,'client-source',FILE),'utf8'):'';
ok('client-source file exists',!!src);
// ---- 연결 ----
{const rt=path.join(RT,FILE);ok('runtime copy matches client-source',fs.existsSync(rt)&&fs.readFileSync(rt,'utf8')===src);
 const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')),M=new Map(man.files.map(f=>[f.path,f.sha256]));
 ok('runtime-manifest hash matches',fs.existsSync(rt)&&M.get(FILE)===crypto.createHash('sha256').update(fs.readFileSync(rt)).digest('hex'));
 ok('listed in runtime-inputs textPaths',JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8')).textPaths.includes(FILE));
 const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');
 ok('index.html loads it exactly once, after auto-move-r1022 and before the big overlay line (actor-tone-r453 · combat-r118)',html.split('./'+FILE).length===2&&
  html.indexOf('auto-move-r1022.js')<html.indexOf(FILE)&&html.indexOf(FILE)<html.indexOf('actor-tone-r453.js')&&html.indexOf(FILE)<html.indexOf('combat-r118.js')&&
  /<script src="\.\/hero-harmony-r1030\.js"><\/script>\n/.test(html));
 ok('listed in verify-r96-public.py',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'"+FILE+"'"));
 ok('CPU check wired in pages.yml',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r1030/r1030-cpu-check.cjs'));}
// ---- 브라우저 대역 ----
function world(opt={}){const store={};if(opt.pref)store['storyworld.r1030.heroHarmony']=JSON.stringify(opt.pref);const log=[];
 const g={console,Math,Number,Object,JSON,Map,WeakMap,Set,String,Array,Error,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},
  setInterval:()=>0,clearInterval:()=>{},listeners:{},addEventListener(n,f){g.listeners[n]=f;},player:{hero:opt.hero||'hwando',x:5,y:5},log,store};
 g.window=g;
 if(opt.r821)g.__STORYWORLD_HERO_GROUND_R821__={active:()=>true};
 if(opt.light)g.__STORYWORLD_LOCAL_LIGHT_R451__={owns:()=>true,lightAt:()=>opt.light};
 g.shadow=function(x,y,radius,o){log.push({op:'shadow',x,y,radius,o:o?{...o}:o});};
 g.drawHero=function(){g.shadow(50,60,20,{lift:0});log.push({op:'body'});g.shadow(70,80,9,{alpha:.5});};
 vm.createContext(g);vm.runInContext(src+'\n;globalThis.__dh=()=>drawHero();',g);return g;}
const api=g=>g.__STORYWORLD_HERO_HARMONY_R1030__;
let G=null;try{G=world();}catch(e){ok('loads in vm',false,String(e));}
const A=G&&api(G),P=A?.pure;
ok('api exposed (revision R1030, pure gradeOf/apply, setEnabled)',!!(A&&/^R1030/.test(A.revision)&&P&&typeof P.gradeOf==='function'&&typeof P.apply==='function'&&typeof A.setEnabled==='function'));
if(P){
 const lum=v=>v/255,T=P.TARGET/255;
 // 밝은 옷 영웅: 평균 밝기가 내려가되 장면 기준(TARGET) 아래로는 안 간다(가독성 하한)
 for(const h of ['hwando','michaela','gunner','seoha']){const m=lum(P.MEAN[h]),gr=P.gradeOf(h,1),after=P.apply(gr,m);
  ok(h+': pale body mean comes down',after<m-.02,{m,after});
  ok(h+': never below the scene key (readable)',after>=T-.03,{after,T});
  ok(h+': absolute readability floor 84/255 (above the 45~80 mob/floor band)',after>=84/255,{after:after*255});}
 ok('hwando (palest) is pulled down the most',(lum(132)-P.apply(P.gradeOf('hwando',1),lum(132)))>(lum(98)-P.apply(P.gradeOf('seoha',1),lum(98))));
 // 대비: 몸 안 명암 폭(밝은 0.8 − 어두운 0.3)이 순수 노출 내림보다 덜 줄어든다(납작해지지 않게)
 {const gr=P.gradeOf('hwando',1),span=P.apply(gr,.8)-P.apply(gr,.3),g0=Math.max(P.GMIN,P.TARGET/132);ok('contrast restores part of the shading span',span>g0*.5+.01,{span,pure:g0*.5});}
 // 어두운 옷 영웅·모르는 영웅·빈 값은 그대로
 for(const h of ['neon','lauren','hunter','slayer','nobody','',undefined,null]){const gr=P.gradeOf(h,1);ok('identity for '+String(h),gr.a===1&&gr.b===0,gr);}
 // 경계값: 아주 밝은 등불 밑은 덜 내린다, NaN·Infinity·음수 빛도 유한
 {const dim=P.gradeOf('hwando',1),lamp=P.gradeOf('hwando',2.5);ok('bright lamp light softens the pull-down',lamp.a>dim.a,{dim,lamp});
  ok('hero own aura light (~1.2) does not cancel the grade',P.gradeOf('hwando',1.2).a===dim.a);}
 for(const L of [NaN,Infinity,-Infinity,-5,1e9,undefined]){const gr=P.gradeOf('michaela',L);ok('finite grade for light '+String(L),Number.isFinite(gr.a)&&Number.isFinite(gr.b)&&gr.a>0&&gr.a<=1.2,gr);}
 ok('apply clamps to 0..1',P.apply({a:2,b:.5},1)===1&&P.apply({a:1,b:-2},.3)===0);
}
// ---- 그리기 경로: 영웅 몸 재질 필터에만 곱하고, 그린 뒤 되돌림 ----
function fakeThree(g){
 const mk=(kind,opt={})=>({geometryState:{owner:{kind,x:5,y:5,groundAligned:!!opt.ground}},mesh:{visible:true,layers:{mask:8},material:{map:{},blending:opt.blend??1,userData:{filter:{m:{elements:[1,0,0,0,1,0,0,0,1]},offset:{x:0,y:0,z:0}}}}}});
 const rows=new Map([['hero:2:8',mk('hero')],['enemy:1',mk('enemy')],['fx:1',mk('effect')],['r350:ghost:1',mk('effect')],['hero:ground',mk('hero',{ground:true})],['hero:add',mk('hero',{blend:2})]]);
 const seen=[];const camera={layers:{mask:8}},scene={};
 const renderer={render(){for(const [k,r] of rows)seen.push({k,e0:r.mesh.material.userData.filter.m.elements[0],o:r.mesh.material.userData.filter.offset.x});}};
 g.__STORYWORLD_PHASE1__={controller:{state:{three:{renderer,scene,camera,commands:{rows}}}}};return{rows,seen,camera,scene,renderer};}
if(src){const g=world({hero:'hwando'});const F=fakeThree(g);vm.runInContext(src.replace("if(window.__STORYWORLD_HERO_HARMONY_R1030__)return;",""),g);
 F.renderer.render(F.scene,F.camera);const at=k=>F.seen.find(s=>s.k===k);
 ok('hero body filter scaled during render',at('hero:2:8')?.e0<1&&at('hero:2:8')?.o<0,at('hero:2:8'));
 ok('R350/R448 hero ghost copy graded the same',at('r350:ghost:1')?.e0<1);
 ok('mob, effect, ground-aligned and additive rows untouched',['enemy:1','fx:1','hero:ground','hero:add'].every(k=>at(k)?.e0===1&&at(k)?.o===0),F.seen);
 ok('filter restored after render',[...F.rows.values()].every(r=>r.mesh.material.userData.filter.m.elements[0]===1&&r.mesh.material.userData.filter.offset.x===0));
 // 끄기 스위치
 F.seen.length=0;api(g).setEnabled(false);F.renderer.render(F.scene,F.camera);ok('setEnabled(false) → no grade',F.seen.find(s=>s.k==='hero:2:8')?.e0===1);api(g).setEnabled(true);
 // 어두운 옷 영웅은 재질을 건드리지 않는다
 F.seen.length=0;g.player.hero='slayer';F.renderer.render(F.scene,F.camera);ok('dark hero (slayer) untouched',F.seen.every(s=>s.e0===1&&s.o===0));
}
// 렌더 안에서 예외가 나도 필터가 되돌아오는지
if(src){const g=world({hero:'michaela'});const F=fakeThree(g);F.renderer.render=function(){throw Error('boom');};
 vm.runInContext(src.replace("if(window.__STORYWORLD_HERO_HARMONY_R1030__)return;",""),g);let threw=false;try{F.renderer.render(F.scene,F.camera);}catch(_){threw=true;}
 ok('filter restored even when the engine render throws',threw&&F.rows.get('hero:2:8').mesh.material.userData.filter.m.elements[0]===1);}
// ---- 발 닿음 그림자 ----
if(src){const g=world();g.__dh();const sh=g.log.filter(l=>l.op==='shadow');
 ok('contact shadow: exactly one extra shadow per hero draw, at the first shadow spot, narrower',sh.length===3&&sh[1].x===50&&sh[1].y===60&&sh[1].o.scale<1&&sh[1].o.alpha>.5,sh);
 const g2=world({r821:true});g2.__dh();ok('no extra shadow where R821 already darkens it',g2.log.filter(l=>l.op==='shadow').length===2);
 const g3=world({pref:{contact:false}});g3.__dh();ok('contact off by pref',g3.log.filter(l=>l.op==='shadow').length===2);
 const g4=world({pref:{on:false}});g4.__dh();ok('all off by pref',g4.log.filter(l=>l.op==='shadow').length===2);
 const g6=world();g6.drawHero=function(){g6.shadow(NaN,60,20,{});g6.shadow(50,60,20,{});};vm.runInContext('drawHero.__r1030=undefined;',g6);
 api(g6).rewrap();vm.runInContext('drawHero()',g6);const s6=g6.log.filter(l=>l.op==='shadow');ok('NaN position never gets an extra shadow (first finite one does)',s6.length===3&&s6.slice(1).every(s=>Number.isFinite(s.x)),s6);
 api(g).rewrap();api(g).rewrap();g.log.length=0;g.__dh();ok('rewrap is idempotent (still one extra)',g.log.filter(l=>l.op==='shadow').length===3);
 ok('drawHero returns base result and restores shadow',(()=>{const g7=world();const sBefore=g7.shadow;g7.__dh();return g7.shadow===sBefore;})());}
// ---- 금지 사항 ----
ok('does not touch assets, gameplay or R54 frameFor; no ctx.filter drop-shadow/blur',src&&!/frameFor|STORY_COMBAT_R54|drop-shadow|blur\(|player\.hp\s*=|\.damage\s*=/.test(src.replace(/\/\/.*$/gm,'')));
const bad=checks.filter(c=>!c.p);for(const c of checks)console.log((c.p?'PASS ':'FAIL ')+c.n+(c.p||c.d===undefined?'':' '+JSON.stringify(c.d).slice(0,300)));
console.log('R1030 '+(checks.length-bad.length)+'/'+checks.length);if(bad.length)process.exit(1);
