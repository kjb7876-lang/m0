// R710 영웅 대기 6칸·피격 4칸(남쪽) 연결 CPU 검사(GPU·실기기 아님).
//  · 대기: visual-r119 __STORYWORLD_HERO_SHEETS__.idleItem 이 남쪽(idle-s) 칸을 줄 때만 R710 6칸 시트로 바꾼다(그림 준비 전·끄기·다른 방향·보류 영웅은 그대로).
//  · 피격: attack-anim-r143 이 남쪽 피격 시트 주소를 고를 때 R710 4칸 시트(준비됐을 때만)를 쓰고, 맞은 시간에 따라 4칸을 차례로 그린다.
//  usage: node r96/qa/r710/r710-cpu-check.cjs
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c,extra)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n,extra===undefined?'':JSON.stringify(extra).slice(0,500));}};
const F='hero-idle-hit-r710.js';const has=fs.existsSync(path.join(R,'client-source',F));ok('overlay exists',has);
if(!has){console.log(`\nR710 CPU check: ${pass} pass, ${fail} fail`);process.exit(1);}
ok('runtime copy matches source',C(F)===RT(F));
const APPLY=['hunter','lauren','michaela','seoha','gunner','neon'];
function env(o={}){const asked=[];const g={console,Math,JSON,Date,Promise,asked,performance:{now:()=>0}};g.window=g;
 const store=new Map();if(o.prefs)store.set('storyworld.r710.idleHit',JSON.stringify(o.prefs));g.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
 g.ready=new Set(o.ready||[]);g.readyImage=p=>g.ready.has(p)?{image:{src:p,naturalWidth:/idle/.test(p)?1152:768,naturalHeight:256}}:null;
 g.ensureImages=ps=>{asked.push(...ps);return Promise.resolve();};
 const BASE={s:{path:'assets/r130/HERO/idle-s.webp',frames:4,cellW:192,cellH:256,footX:96,footY:226,refBody:182},e:{path:'assets/r130/HERO/idle-e.webp',frames:4,cellW:192,cellH:256,footX:96,footY:226,refBody:182},ne:{path:'assets/r130/HERO/idle-ne.webp',frames:4,cellW:192,cellH:256,footX:96,footY:226,refBody:183},se:{path:'assets/r130/HERO/idle-se.webp',frames:4,cellW:192,cellH:256,footX:96,footY:226,refBody:182},n:{path:'assets/r130/HERO/idle-n.webp',frames:4,cellW:192,cellH:256,footX:96,footY:226,refBody:182}};// 실제 색인처럼 s·se·e·ne·n
 const OPP={e:'w',w:'e',se:'sw',sw:'se',ne:'nw',nw:'ne',s:'s',n:'n'};
 g.__STORYWORLD_HERO_SHEETS__=Object.freeze({idleItem(h,dir,m){const k=m?OPP[dir]||dir:dir,it=BASE[k]||BASE.s;return{...it,path:it.path.replace('HERO',h),image:{src:'old'}};},heroes:()=>['gunner','michaela','seoha','lauren','neon','hunter','slayer','hwando']});
 vm.createContext(g);vm.runInContext(C(F),g);return g;}
const api=g=>g.__STORYWORLD_IDLE_HIT_R710__;
// ---- 대기
{const g=env({ready:APPLY.map(h=>`assets/r710/${h}/idle-s.webp`)}),S=g.__STORYWORLD_HERO_SHEETS__;
 ok('API published with revision',/^R710-/.test(api(g)?.revision||''));
 ok('heroes() list kept',JSON.stringify(S.heroes())===JSON.stringify(['gunner','michaela','seoha','lauren','neon','hunter','slayer','hwando']));
 for(const h of APPLY){const it=S.idleItem(h,'s',false);ok(`${h} idle south → R710 6-frame sheet`,it&&it.path===`assets/r710/${h}/idle-s.webp`&&it.frames===6&&it.cellW===192&&it.cellH===256&&it.footX===96&&it.footY===226&&it.image?.src===it.path,it);
  const ix=JSON.parse(RT('assets/r710/index.json')).heroes[h];ok(`${h} idle refBody = scripts/r710 index (${ix.refBody}) and hit body/foot match`,it&&it.refBody===ix.refBody&&api(g).hitSheet(h,'s').body===ix.hitBody&&api(g).hitSheet(h,'s').foot[1]===ix.hit.foot[1],[it&&it.refBody,ix.refBody]);
  const m=S.idleItem(h,'s',true);ok(`${h} idle south mirrored draw also R710`,m&&m.path===`assets/r710/${h}/idle-s.webp`);
  const e=S.idleItem(h,'e',false);ok(`${h} idle east unchanged (4 frames old sheet)`,e&&e.path===`assets/r130/${h}/idle-e.webp`&&e.frames===4);
  const sw=S.idleItem(h,'sw',true);ok(`${h} idle south-west (mirrored se) unchanged`,sw&&sw.path===`assets/r130/${h}/idle-se.webp`);
  const nn=S.idleItem(h,'n',false);ok(`${h} idle north unchanged`,nn&&nn.path===`assets/r130/${h}/idle-n.webp`);}
 for(const h of ['slayer','hwando']){const it=S.idleItem(h,'s',false);ok(`${h} (hold) idle south unchanged`,it&&it.path===`assets/r130/${h}/idle-s.webp`&&it.frames===4);}
 // 6칸 순환: r93 은 f=floor(time/.42)%frames 로 칸을 고른다
 const it=S.idleItem('hunter','s',false),seen=new Set();for(let t=0;t<6*.42;t+=.05)seen.add(Math.floor(t/.42)%it.frames);ok('r93 cycle visits all 6 idle frames',seen.size===6,[...seen]);}
{const g=env({ready:[]}),S=g.__STORYWORLD_HERO_SHEETS__;const it=S.idleItem('hunter','s',false);
 ok('idle sheet not ready → old sheet (no blank body), load requested',it.path==='assets/r130/hunter/idle-s.webp'&&g.asked.includes('assets/r710/hunter/idle-s.webp'),{p:it.path,a:g.asked});}
{const g=env({ready:['assets/r710/hunter/idle-s.webp'],prefs:{on:false}}),S=g.__STORYWORLD_HERO_SHEETS__;ok('pref on:false → old idle',S.idleItem('hunter','s',false).path==='assets/r130/hunter/idle-s.webp');}
// ---- 피격 시트 표(R143 이 R437 넓은 칸 시트와 같은 길로 칸·발·몸 키를 받는다)
{const g=env({}),A=api(g);
 for(const h of APPLY){const t=A.hitSheet(h,'s');ok(`${h} hit south → R710 4-frame sheet spec`,t&&t.path===`assets/r710/${h}/hit-s.webp`&&t.cell[0]===192&&t.cell[1]===256&&t.foot[0]===96&&t.foot[1]>=225&&t.foot[1]<=227&&t.body>=170&&t.body<=210,t);
  ok(`${h} hit other dirs unchanged`,['se','e','ne','n'].every(d=>A.hitSheet(h,d)==null));}
 for(const h of ['slayer','hwando'])ok(`${h} (hold) hit unchanged`,A.hitSheet(h,'s')==null);}
{const g=env({prefs:{on:false}});ok('pref on:false → no hit sheet',api(g).hitSheet('hunter','s')==null);}
// ---- attack-anim-r143 이 실제로 4칸을 맞은 시간 순서로 그리는가
const r143=C('attack-anim-r143.js');ok('R143 place() asks R710 for hit sheets (alt path)',/act==='hit'\?window\.__STORYWORLD_IDLE_HIT_R710__\?\.hitSheet\?\.\(h,sd\)/.test(r143));
ok('R143 preloads R710 hit sheet',/__STORYWORLD_IDLE_HIT_R710__\?\.hitSheet\?\.\(h,'s'\)/.test(r143.match(/function preload\(\)[\s\S]*?\n/)?.[0]||''));
ok('R143 marks r437Attack only for attacks',/r437Attack:alt&&act==='attack'\?/.test(r143));ok('R143 runtime copy matches source',r143===RT('attack-anim-r143.js'));
function r143env(ready){const g=env({ready});vm.runInContext(`var time=0,room={enemies:[]},player={hero:'hunter',x:0,y:0,direction:'front',hurtAnim:0,attackAnim:0,skillAnim:0,dashAnim:0,ultimateAnim:0,guard:false,hp:10};
 function project(x,y){return{x:x*10,y:y*10};}function actorHeight(){return 60;}var ctx={commands:[]};
 function drawHero(){ctx.commands.push({kind:'image',owner:{kind:'hero'},sourcePath:'assets/r130/hunter/idle-s.webp',image:{src:'native'},points:[[0,0],[10,0],[10,60],[0,60]]});}`,g);
 vm.runInContext(r143,g);return g;}
{const g=r143env(['assets/r710/hunter/hit-s.webp','assets/r143/hit/hunter/hit-s.webp']);const frames=[];
 for(const a of [.4,.3,.2,.1,.02]){vm.runInContext(`player.hurtAnim=${a};ctx.commands.length=0;drawHero();`,g);const c=vm.runInContext('ctx.commands[0]',g);frames.push([c.sourcePath,c.sourceRect&&c.sourceRect[0]/192,c.points]);}
 ok('R143 hit draws R710 south sheet',frames.every(f=>f[0]==='assets/r710/hunter/hit-s.webp'),frames.map(f=>f[0]));
 ok('hit frames advance 0→3 through the hurt time',JSON.stringify(frames.map(f=>f[1]))===JSON.stringify([0,1,2,3,3]),frames.map(f=>f[1]));
 const t=vm.runInContext('__STORYWORLD_IDLE_HIT_R710__.hitSheet("hunter","s")',g),p=frames[0][2],k=(p[3][1]-p[0][1])/256,footY=p[0][1]+t.foot[1]*k;
 ok('hit sheet foot lands on the hero foot point (y 0) and body scale = stand height/body',Math.abs(footY)<1e-6&&Math.abs(k-60*.98/t.body)<1e-6,{footY,k});}
{const g=r143env(['assets/r143/hit/hunter/hit-s.webp']);/* 그림 준비 전 */vm.runInContext(`player.hurtAnim=.3;ctx.commands.length=0;drawHero();`,g);const c=vm.runInContext('ctx.commands[0]',g);
 ok('R710 sheet not ready → R143 old 2-frame hit, R710 load requested',c.sourcePath==='assets/r143/hit/hunter/hit-s.webp'&&g.asked.includes('assets/r710/hunter/hit-s.webp'),{p:c.sourcePath,a:g.asked});}
// ---- 다른 연결
ok('R93 reads __STORYWORLD_HERO_SHEETS__ at draw time (wrapped object is seen)',/const sheets=window\.__STORYWORLD_HERO_SHEETS__;/.test(C('visual-r93.js')));
ok('R151 death treats R710 sheets as hero body art',/r710\\\//.test(C('death-r151.js').match(/const BODY_ART=.*$/m)?.[0]||''));
ok('CI runs this check',fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8').includes('r96/qa/r710/r710-cpu-check.cjs'));
console.log(`\nR710 idle/hit CPU check: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
