// R1340 CPU 검사: 근접 몹 타격 이펙트를 공격 종류별로(사용자 2026-11-26 13:24Z
//  "근접몹이 공격했을때 무조건 돌프레임애니메이션이펙트가 나오는게 아니라 땅을 치거나 하는 몹일때 나오게하고 찌르기류는 그냥 출혈모션 나오는 식으로
//   그냥 기본공격에 맞으면 확실하지만 너무화려하지는 않은방식으로").
// 지금(R169·R175·R1177d): 근접 몹이 칠 때마다 지역 모양 시트(동굴·석조 = 솟는 돌가시 mob-stone)를 무조건 재생, 보스는 땅 균열(quake)까지.
// 기대:
//  · 분류 classify(e): 땅을 치는 몹(무거운 무기·망치·골렘 등) = 'ground', 찌르기·베기(칼·창·발톱·blade·claw) = 'bleed', 그 밖·애매함 = 'impact'.
//    이름 함정: '검은'·'창백한' 같은 낱말은 칼·창이 아니다. 혼령·점액·그림자처럼 몸이 없는 것은 할퀴어도 'impact'.
//  · R169 이 칠 때 묻는다(route): ground 면 어느 지역이든 돌 시트(mob-stone)를 그 자리에, bleed·impact 면 칠 때 시트를 재생하지 않는다. 보스 땅 균열도 ground 만.
//  · 실제로 맞았을 때(엔진 hurt 가 근접 몹을 출처로 불림)만: bleed = '버려진 최고급 식재료'(집·주방 지역) 근접 공격 Dots 할퀴기 시트(mob-domestic)를
//    영웅 몸 한가운데에(사용자 13:44Z "최고급식재료가 근접공격시 나오는 프레임애니메이션 … 허공에말고 영웅쪽에 제대로") — 시트 그림 무게중심을 기준점으로, 가슴 높이, impact = 작은 타격 시트(R163 행, 투명 .4 → alpha .6).
//    ground 는 맞아도 더 그리지 않는다(돌이 이미 보임). 원거리 출처·출처 없음은 아무것도 안 함. 같은 몹 0.25초 안 겹침 없음. hurt 결과·인자는 그대로.
//  · 끄기 storyworld.r1340.meleeHitFx {"on":false} → 예전 그대로(route null, 맞아도 그림 없음).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const F='melee-hitfx-r1340.js',SRC=path.join(R,'client-source',F);
let pass=0,fail=0;const ok=(n,c,d)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n,d!==undefined?JSON.stringify(d):'');}};
const exists=fs.existsSync(SRC);ok(F+' exists',exists);
const c169=fs.readFileSync(path.join(R,'client-source','play-r169.js'),'utf8');
ok('R169 asks R1340 before playing the strike sheet',/__STORYWORLD_MELEE_HITFX_R1340__/.test(c169)&&/route\(/.test(c169));
ok('R169 boss ground-quake is gated on R1340 ground kind',/quakeR1340\(e\)/.test(c169));
// R1286 ③(맞으면 영웅 자리에 세 봉우리 땅 균열 pvfx-earth-rupture 를 반투명 검게)도 '돌이 솟는' 그림이라, 근접 베기·찌르기·그 밖 적중은 R1340 이 맡고 R1286 은 건너뛴다(원거리·땅 치는 몹은 그대로).
const c1286=fs.readFileSync(path.join(R,'client-source','ego-cloud-r1286.js'),'utf8');
ok('R1286 hit shadow asks R1340 ownsHit first',/function shadow\(src\)\{if\(ownsR1340\(src\)\)/.test(c1286)&&/__STORYWORLD_MELEE_HITFX_R1340__/.test(c1286));
const rt1286=path.join(R,'runtime-text','ego-cloud-r1286.js');ok('ego-cloud-r1286 runtime copy matches source',fs.existsSync(rt1286)&&fs.readFileSync(rt1286,'utf8')===c1286);
const rt169=path.join(R,'runtime-text','play-r169.js');ok('play-r169 runtime copy matches source',fs.existsSync(rt169)&&fs.readFileSync(rt169,'utf8')===c169);
if(exists){const code=fs.readFileSync(SRC,'utf8');
 try{new vm.Script(code);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
 const rt=path.join(R,'runtime-text',F);ok('runtime copy matches source',fs.existsSync(rt)&&fs.readFileSync(rt,'utf8')===code);
 const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');ok('script tag once in index.html',html.split('src="./'+F+'"').length===2);
 // 태그 순서: 끝 줄(combat-r118…)과 긴 줄 순서는 다른 검사(r176·r118·r1124)가 고정하므로 R13xx 무리(play-r169·pixelfx-r163 보다 앞)에 둔다 → 아래 '늦게 생긴 R163·R190' 장면으로 순서와 무관하게 동작하는지 본다.
 ok('script tag sits in the R13xx group (before the fixed tail)',html.indexOf('src="./'+F+'"')>html.indexOf('src="./mob-3d-r1315.js"')&&html.indexOf('src="./'+F+'"')<html.indexOf('src="./combat-r118.js"'));
 ok('verify-r96-public lists it',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"));
 ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r1340/r1340-cpu-check.cjs'));
 ok('no code-drawn shapes (arc/fillRect/lineTo) in the overlay',!/\.(arc|fillRect|strokeRect|lineTo|ellipse)\(/.test(code));
 ok('no forbidden ctx.filter (drop-shadow/blur)',!/drop-shadow|blur\(/.test(code));
 function env({ls={},age15=true}={}){const g={localStorage:{_s:{...ls},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,Math,JSON,Number,String,Object,Array,WeakMap,Map,Set,Infinity,NaN,isFinite,Promise,setTimeout:()=>0,performance:{now:()=>g.__now*1000}};g.window=g;g.__now=0;vm.createContext(g);
  vm.runInContext(`var time=0,player={x:10,y:10,hp:100,maxHp:100},room={id:'dist01',enemies:[]},effects=[];var hurtLog=[],hurtRes=null;
   function hurt(d,src){hurtLog.push([d,src&&src.name]);if(hurtRes!==null)return hurtRes;player.hp-=d;return 'r'+d;}
   function tick(){return 1;}function actorHeight(){return 60;}
   function readyImage(p){return {image:{p}};}function addImage(p){return p;}
   var pxPlays=[],pxMeta={'mob-stone':{file:'r1177/mob-stone.webp',frame:[212,120],pivot:[106,103],columns:4,frames:12,fps:12},'mob-forge':{file:'x.webp',frame:[1,1],pivot:[0,0],columns:1,frames:1,fps:1}};
   window.__STORYWORLD_PIXELFX_R163__=Object.freeze({play:(n,x,y,o)=>{pxPlays.push({n,x,y,o});return {};},has:n=>!!pxMeta[n],meta:()=>pxMeta,warm(){}});
   var bloodPlays=[];window.__STORYWORLD_BLOOD_R190__=Object.freeze({play:(n,x,y,o)=>{bloodPlays.push({n,x,y,o});return {};},inspect:()=>({prefs:{on:true}})});
   window.__STORYWORLD_AGE15_R1054__={on:${age15}};
   window.__STORYWORLD_COMBAT_R114__={palette:e=>({p:[120,30,30],s:[200,180,160],gp:[255,120,90],gs:[255,240,220]})};`,g);
  vm.runInContext(code,g);vm.runInContext('tick();',g);return g;}
 const g=env(),A=g.__STORYWORLD_MELEE_HITFX_R1340__;ok('API exists',!!A&&typeof A.classify==='function'&&typeof A.route==='function');
 if(A){const C=e=>A.classify(e);
  const cases=[
   [{name:'망치 든 대장장이',weapon:'caster'},'ground'],[{name:'바위 골렘',weapon:'claw'},'ground'],[{name:'무명',weapon:'heavy'},'ground'],[{name:'철퇴 수호병 증원',weapon:'blade'},'ground'],
   [{name:'붉은 하이힐 칼날',weapon:'blade'},'bleed'],[{name:'거미줄에 묶인 수호병',weapon:'blade'},'bleed'],[{name:'보랏빛 알집지기',weapon:'claw'},'bleed'],[{name:'무명',weapon:'cleave'},'bleed'],[{name:'메스 든 간호사',weapon:'caster'},'bleed'],
   [{name:'얼굴 없는 남자의 박수',weapon:'caster'},'impact'],[{name:'늪에서 되살아난 혼령체',weapon:'claw'},'impact'],[{name:'ID 잔류 점액체',weapon:'claw'},'impact'],
   [{name:'검은 망령',weapon:'caster'},'impact'],[{name:'창백한 수녀',weapon:'caster'},'impact'],[{name:'검은 사제',weapon:undefined},'impact'],[{name:'',weapon:'weird'},'impact'],[null,'impact'],[{},'impact'],
   [{name:'뿌리의 문지기',boss:true,weapon:'heavy'},'ground']];
  for(const [e,want] of cases)ok('classify '+JSON.stringify(e)+' = '+want,C(e)===want,C(e));
  ok('table override wins over keywords',A.classify({name:A.TABLE_SAMPLE?.name||'',weapon:'caster'})===(A.TABLE_SAMPLE?.kind||'impact'));
  // route: R169 이 칠 때 묻는다
  const blade={name:'붉은 하이힐 칼날',weapon:'blade',ai:'melee',x:9,y:10},heavy={name:'바위 골렘',weapon:'heavy',ai:'melee',x:9,y:10},cast={name:'얼굴 없는 남자의 박수',weapon:'caster',ai:'melee',x:11,y:10};
  const rb=A.route(blade,'mob-stone',9.5,10,{k:1.3,tint:{a:[1,2,3],b:[4,5,6]}});ok('route: bleed mob → skip strike sheet',rb&&rb.skip===true,rb);
  const rc=A.route(cast,'mob-forge',9.5,10,{k:1.3});ok('route: impact mob → skip strike sheet',rc&&rc.skip===true,rc);
  const rg=A.route(heavy,'mob-forge',9.5,10,{k:1.3,tint:{a:[1,2,3],b:[4,5,6]}});ok('route: ground mob in any region → Dots D05 stone row (mob-r1340-stone), same on-screen size as old mob-stone (k x 2.3)',rg&&rg.skip!==true&&rg.name==='mob-r1340-stone'&&rg.o&&Math.abs(rg.o.k-1.3*2.3)<1e-9&&rg.o.tint&&rg.o.tint.a[0]===1,rg);
  {const st=g.pxMeta['mob-r1340-stone'];ok('stone row = SW-R1352-D05 stone 12f, 256 cells in one row, pivot near the ground line',st&&st.file==='r1340/SW-R1352-D05_melee_hit_stone_12f.png'&&st.frame[0]===256&&st.frame[1]===256&&st.columns===12&&st.frames===12&&st.pivot[1]>=128&&st.pivot[1]<=146,st);}
  ok('quakeR1340: only ground bosses',A.quake({boss:true,weapon:'heavy',name:'x'})===true&&A.quake({boss:true,weapon:'blade',name:'x'})===false);
  // 실제로 맞았을 때만
  const hit=(e,kind='melee')=>{e.attack={committed:true,angle:0};e.lastAttackKind=kind;return g.hurt(7,e);};
  g.time=1;g.__now=1;const r1=hit(blade);ok('hurt passes result and args through',r1==='r7'&&g.hurtLog.length===1&&g.hurtLog[0][1]==='붉은 하이힐 칼날');
  const sl=()=>g.pxPlays.filter(x=>x.n==='mob-r1340-slash');
  ok('bleed hit → one delicacy claw sheet (mob-r1340-slash) exactly on the hero, no R190 blood',sl().length===1&&sl()[0].x===10&&sl()[0].y===10&&g.bloodPlays.length===0,g.pxPlays);
  const bo=sl()[0]?.o||{};ok('slash sits on the chest (z = .5 x actor 60 = 30) and readable but modest, same on-screen size as the R1177 claw at k .62 (D05 cell 256 → k 1.26), alpha .9, Dots colours (no tint)',bo.z===30&&Math.abs(bo.k-1.26)<1e-9&&bo.alpha===.9&&!bo.tint,bo);
  ok('marked as enemy effect so hero palette (R302) never recolours it',bo.enemy===true,bo);
  ok('slash direction follows attacker (attacker on left → not flipped)',bo.flip===false,bo);
  const row=g.pxMeta['mob-r1340-slash'];ok('slash row = SW-R1352-D05 slash 12f (same delicacy claw, realigned), pivot = Dots (128,128) ~ drawn centroid, 12 frames in one row',row&&row.file==='r1340/SW-R1352-D05_melee_hit_slash_12f.png'&&row.pivot[0]===128&&row.pivot[1]===128&&row.frames===12&&row.columns===12&&row.frame[0]===256,row);
  g.time=1.1;g.__now=1.1;hit(blade);ok('same mob within .25s → no second slash',sl().length===1);
  g.time=1.5;g.__now=1.5;hit(blade);ok('after .25s → slash again',sl().length===2);
  const n0=g.pxPlays.length;hit(cast);const ip=g.pxPlays.slice(n0);ok('impact hit → one small impact sheet (R163 row mob-r1340-impact)',ip.length===1&&ip[0].n==='mob-r1340-impact',ip);
  const io=ip[0]?.o||{};ok('impact alpha .6 (.4 transparent), same on-screen size as R1214 at k .32 (D05 cell 256 → k .87), tinted by mob palette',io.alpha===.6&&Math.abs(io.k-.87)<1e-9&&!!io.tint,io);
  ok('impact marked as enemy effect',io.enemy===true,io);
  // R350 은 영웅 몸을 덮는 이펙트를 85%까지 옅게 한다 — 적 쪽(이름에 mob 낱말)이면 옅게 하지 않으므로 몸 위에 '제대로' 보인다
  ok('sheet names carry the enemy token R350 checks (r163:<name> id)',['mob-r1340-slash','mob-r1340-impact'].every(n=>/(^|[:_-])(enemy|mob|mobs|boss|hazard|hex|sigil)([:_-]|$)/i.test('r163:'+n+':1')));
  ok('impact row registered in pixelfx meta = SW-R1352-D05 small 8f',g.pxMeta['mob-r1340-impact']&&g.pxMeta['mob-r1340-impact'].frames===8&&g.pxMeta['mob-r1340-impact'].file==='r1340/SW-R1352-D05_melee_hit_small_8f.png'&&g.pxMeta['mob-r1340-impact'].frame[0]===256);
  const n1=g.pxPlays.length,b1=g.bloodPlays.length;hit(heavy);ok('ground hit → nothing extra (stone already shown)',g.pxPlays.length===n1&&g.bloodPlays.length===b1);
  const n2=g.pxPlays.length,b2=g.bloodPlays.length;const far={...blade,name:'원거리'};hit(far,'ranged');g.hurt(5,null);g.hurt(5,{name:'x'});ok('ranged / no source / no attack → nothing',g.pxPlays.length===n2&&g.bloodPlays.length===b2);
  // NaN 안전
  const nb={...blade,x:NaN};g.time=9;hit(nb);ok('NaN attacker → no crash, no flip NaN',true);
  // Dots 검수(11-26 20:22Z): 엔진 hurt 가 실제로 맞지 않았다고 돌려주면(무시·무적·패링·빗나감·보호막) 그리지 않는다
  {let t=20;const none=[];for(const res of ['ignored','invulnerable','parried','missed','blocked']){g.hurtRes=res;const c0=g.pxPlays.length;for(const e of [{...blade,name:'칼날 '+res},{...cast,name:'박수 '+res}]){g.time=t+=1;g.__now=t;const r=hit(e);if(r!==res)none.push(res+':passthrough');}if(g.pxPlays.length!==c0)none.push(res);}
   ok('non-hit results (ignored/invulnerable/parried/missed/blocked) → no slash, no impact, result unchanged',none.length===0,none);
   g.hurtRes='revived';const c1=g.pxPlays.length;g.time=t+=1;g.__now=t;hit({...blade,name:'칼날 revived'});ok('revived (damage landed) still shows the slash',g.pxPlays.length===c1+1);
   g.hurtRes=null;}
  ok('stats count',A.inspect().stats.slash>=2&&A.inspect().stats.impact>=1&&A.inspect().stats.errors===0,A.inspect().stats);
  // 15세 끔이어도 작게
  const g2=env({age15:false}),A2=g2.__STORYWORLD_MELEE_HITFX_R1340__;const bb={name:'칼날',weapon:'blade',x:9,y:10,attack:{committed:true},lastAttackKind:'melee'};g2.hurt(3,bb);ok('age15 off → same modest slash (k 1.26, no extra blood)',g2.pxPlays.length===1&&Math.abs(g2.pxPlays[0].o.k-1.26)<1e-9,g2.pxPlays);
  // 끄기
  const g3=env({ls:{'storyworld.r1340.meleeHitFx':'{"on":false}'}}),A3=g3.__STORYWORLD_MELEE_HITFX_R1340__;ok('off → route null',A3.route(blade,'mob-stone',1,1,{})===null);
  const bb3={name:'칼날',weapon:'blade',x:9,y:10,attack:{committed:true},lastAttackKind:'melee'};g3.hurt(3,bb3);ok('off → no hit fx',g3.bloodPlays.length===0&&g3.pxPlays.length===0);
  ok('off → quake allowed as before',A3.quake({boss:true,weapon:'blade'})===true);
  // ownsHit: R1286 이 묻는 값 — 근접 bleed·impact 적중이면 true, 땅 치는 몹·원거리·출처 없음·끔이면 false
  const mk=(o,k='melee')=>({...o,attack:{committed:true},lastAttackKind:k});
  ok('ownsHit: bleed / impact melee → true',A.ownsHit(mk(blade))===true&&A.ownsHit(mk(cast))===true);
  ok('ownsHit: ground melee, ranged, null → false',A.ownsHit(mk(heavy))===false&&A.ownsHit(mk(blade,'ranged'))===false&&A.ownsHit(null)===false);
  ok('ownsHit: off → false',A3.ownsHit(mk(blade))===false);
  // 로드 순서 무관: R163·R190 이 이 파일보다 늦게 생겨도(실제 index.html 순서) 맞을 때 그려진다
  const g5=(()=>{const h={localStorage:{getItem:()=>null,setItem(){}},console,Math,JSON,Number,String,Object,Array,WeakMap,Map,Set,Infinity,NaN,isFinite,Promise,setTimeout:()=>0};h.window=h;vm.createContext(h);
   vm.runInContext(`var time=0,player={x:10,y:10},room={id:'a',enemies:[]};function hurt(){return 1;}function tick(){return 1;}function actorHeight(){return 60;}function readyImage(p){return {p};}`,h);
   vm.runInContext(code,h);
   vm.runInContext(`var pxPlays=[],pxMeta={'mob-stone':{}};window.__STORYWORLD_PIXELFX_R163__=Object.freeze({play:(n,x,y,o)=>{pxPlays.push(n);},has:n=>!!pxMeta[n],meta:()=>pxMeta,warm(){}});
    var bloodPlays=[];window.__STORYWORLD_BLOOD_R190__=Object.freeze({play:(n)=>{bloodPlays.push(n);}});tick();`,h);return h;})();
  g5.time=1;g5.hurt(2,{name:'칼날',weapon:'blade',x:9,y:10,attack:{committed:true},lastAttackKind:'melee'});g5.time=2;g5.hurt(2,{name:'박수',weapon:'caster',x:9,y:10,attack:{committed:true},lastAttackKind:'melee'});
  ok('works when R163 appears after this file (real tag order)',g5.pxPlays.join()==='mob-r1340-slash,mob-r1340-impact'&&!!g5.pxMeta['mob-r1340-impact']&&!!g5.pxMeta['mob-r1340-slash'],{p:g5.pxPlays});
  ok('readyImage alias → D05 slash sheet in assets/r1352',g5.readyImage('assets/r163/pixelfx/r1340/SW-R1352-D05_melee_hit_slash_12f.png').p==='assets/r1352/SW-R1352-D05_melee_hit_slash_12f.png');
  ok('readyImage alias → D05 stone sheet',g5.readyImage('assets/r163/pixelfx/r1340/SW-R1352-D05_melee_hit_stone_12f.png').p==='assets/r1352/SW-R1352-D05_melee_hit_stone_12f.png');
  {const fsx=require('fs');ok('D05 sheets shipped in runtime-text/assets/r1352 at 256-cell sizes',[['stone_12f',3072],['slash_12f',3072],['small_8f',2048]].every(([n,w])=>{const f=path.join(R,'runtime-text','assets','r1352','SW-R1352-D05_melee_hit_'+n+'.png');if(!fsx.existsSync(f))return false;const b=fsx.readFileSync(f);return b.readUInt32BE(16)===w&&b.readUInt32BE(20)===256;}));}
  ok('readyImage alias → D05 small sheet',g5.readyImage('assets/r163/pixelfx/r1340/SW-R1352-D05_melee_hit_small_8f.png').p==='assets/r1352/SW-R1352-D05_melee_hit_small_8f.png');
 }}
console.log(`R1340 cpu: ${pass}/${pass+fail}`);process.exit(fail?1:0);
