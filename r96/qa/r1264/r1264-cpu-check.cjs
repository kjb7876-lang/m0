// R1264 영웅 공격 때 옛 그림 끼어듦 CPU 검사 (사용자 2026-11-20 "기억사수 공격시 예전 이미지 나오는문제", "공격모션전수검토", "기본공격일때도 옛그림")
//  node r96/qa/r1264/r1264-cpu-check.cjs   — 실제 화면 전수는 census.mjs(헤드리스)
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS',m);};
const rd=f=>fs.readFileSync(path.join(R,f),'utf8');
for(const f of ['gunner-aim-r991.js','hero-art-hold-r1264.js'])ok(fs.existsSync(path.join(R,'runtime-text',f))&&rd('client-source/'+f)===rd('runtime-text/'+f),f+' runtime-text 사본과 같음');
ok(/node r96\/qa\/r1264\/r1264-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
ok(/<script src="\.\/save-guard-r1248\.js"><\/script>\n<script src="\.\/hero-art-hold-r1264\.js"><\/script>/.test(rd('runtime-text/index.html')),'index.html 스크립트 태그');
ok(/'hero-art-hold-r1264\.js'/.test(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8')),'공개 확인 기대 목록');

// ① 기억사수 Q·W·E·R(R440 이 공격 모션을 빌려 R143 옛 공격 칸을 그림, 기본 공격 조준 기록 없음) → 지금 칸으로 바뀜
const g991=rd('client-source/gunner-aim-r991.js');
function gunner(pref,enemy,{skill=.5,attack=0}={}){const win={addEventListener(){}};const P={hero:'gunner',x:0,y:0,combo:0,skillAnim:skill,attackAnim:attack,ultimateAnim:0};
 const sb={window:win,localStorage:{getItem:()=>pref?JSON.stringify(pref):null,setItem(){}},Math,Number,JSON,Object,Array,Set,Map,WeakMap,String,isFinite,console,setTimeout:()=>0,document:{readyState:'complete'},
  readyImage:q=>({image:{naturalWidth:1536,naturalHeight:256,src:q}}),ensureImages:()=>Promise.resolve(),player:P,time:5,TILE:64,zoom:1,HEROES:{gunner:{range:9}},nearestEnemy:r=>enemy&&r>=4?enemy:null,
  project:(x,y)=>({x:(x-y)*64,y:(x+y)*32}),actorHeight:()=>66,blocked:()=>false,ctx:{commands:[]},basicAttack(){},makeShot(){return{};}};
 sb.drawHero=function(){const mir=sb.mirror;sb.ctx.commands.push({kind:'image',owner:{kind:'hero'},r143Attack:true,sourcePath:'assets/r143/attack/gunner/attack-'+(sb.sheet||'e')+'.webp',image:{src:'x'},sourceRect:[192,0,192,256],points:mir?[[96,0],[0,0],[0,128],[96,128]]:[[0,0],[96,0],[96,128],[0,128]]});};
 vm.createContext(sb);vm.runInContext(g991,sb);return sb;}
const body=sb=>{sb.ctx.commands=[];sb.drawHero();return sb.ctx.commands[0];};
{const sb=gunner(null,null);const c=body(sb);ok(!/r143\/attack/.test(c.sourcePath)&&/r1045c\/gunner\/attack-e4/.test(c.sourcePath),'스킬 중·적 없음·R143 attack-e → 지금 동쪽 칸(R1045c attack-e4)',c.sourcePath);}
{const sb=gunner(null,{x:-3,y:-3});const c=body(sb);ok(/r1045\/gunner\/attack-n3/.test(c.sourcePath),'스킬 중 적이 화면 위쪽 → 위 겨눔 칸(R1045 attack-n3)',c.sourcePath);}
{const sb=gunner(null,null);sb.sheet='se';const c=body(sb);ok(/r1101c\/gunner\/attack-se9/.test(c.sourcePath),'R143 attack-se(시선 반대 옛 대각) → R1101c attack-se9',c.sourcePath);}
{const sb=gunner(null,null);sb.mirror=true;const c=body(sb);ok(/attack-e4/.test(c.sourcePath)&&c.points[1][0]<c.points[0][0],'왼쪽(반전) 그림은 반전 그대로',c.points);}
{const sb=gunner(null,null,{skill:0,attack:.2});const c=body(sb);ok(!/r143\/attack/.test(c.sourcePath),'기본 공격 중 조준 기록이 없을 때(패시브·메아리 등)도 R143 옛 칸이 남지 않음',c.sourcePath);}
{const sb=gunner({skillBody:false},null);const c=body(sb);ok(/r143\/attack\/gunner\/attack-e/.test(c.sourcePath),'{"skillBody":false} 면 예전 그대로');}
ok(/const REV='R1264-gunner-skill-body\+[^']*R1003/.test(g991),'R991 판 이름에 R1264 추가(R1003 문자열 유지)');

// ② 그림 기억 붙잡기·마지막 안전장치
const hold=rd('client-source/hero-art-hold-r1264.js');
function holdBox(pref){const win={addEventListener(){}},store={};if(pref)store['storyworld.r1264.heroArt']=JSON.stringify(pref);
 const P={hero:'gunner',x:0,y:0,attackAnim:0,skillAnim:0,ultimateAnim:0};const calls=[];
 const sb={window:win,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},Math,Number,JSON,Object,Array,Set,Map,WeakMap,String,Promise,isFinite,console,document:{readyState:'complete'},Date,
  player:P,time:1,project:(x,y)=>({x:(x-y)*64,y:(x+y)*32}),ctx:{commands:[]},cleanPath:p=>String(p).replace(/^\.\//,''),
  heroPaths:id=>['assets/heroes/'+id+'.webp'],ensureImages:(list)=>{calls.push(list.slice());return list.some(p=>/missing/.test(p))?Promise.reject(new Error('missing')):Promise.resolve(list.length);}};
 sb.drawHero=function(){sb.ctx.commands.push({kind:'image',owner:{kind:'hero'},sourcePath:sb.src,image:{src:sb.src},sourceRect:[0,0,192,256],imageSize:[1152,256],points:[[0,0],[60,0],[60,80],[0,80]]});};
 vm.createContext(sb);vm.runInContext(hold,sb);return{sb,H:win.__STORYWORLD_HERO_ART_HOLD_R1264__,calls,store};}
{const {sb,H}=holdBox();const hp=sb.heroPaths('gunner');
 ok(hp[0]==='assets/heroes/gunner.webp'&&hp.some(p=>/r1045c\/gunner\/attack-e4\.webp$/.test(p))&&hp.some(p=>/r1101b\/gunner\/idle-e6\.webp$/.test(p)),'heroPaths(기억사수) = 엔진 그림 + 지금 공격·서 있기 그림(지역 진입·영웅 변경 때 함께 받고 비우기에서 남김)',hp.slice(0,6));
 for(const h of ['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner'])ok(H.pathsFor(h).length>=3,h+' 지금 몸 그림 3장 이상 붙잡음',H.pathsFor(h).length);}
{const {sb,calls}=holdBox();sb.heroPaths('gunner');let rej=null;
 return Promise.resolve().then(async()=>{
  const extra=sb.heroPaths('gunner').slice(1);
  // 더한 그림이 없어도(실패) 지역 진입은 막지 않음
  const {sb:s2}=holdBox();const hp2=s2.heroPaths('gunner');
  await sb.ensureImages(['assets/a.webp',...extra]);ok(calls.length===2&&calls.some(l=>l.length===1&&l[0]==='assets/a.webp')&&calls.some(l=>l.length===extra.length),'원래 목록과 더한 몫을 나눠 함께 기다림',calls.map(l=>l.length));
  // 원래 필수 그림 실패는 그대로 알림
  try{await sb.ensureImages(['assets/missing.webp',...extra]);}catch(e){rej=e;}ok(!!rej,'원래 필수 그림 실패는 그대로 실패');
  // 더한 그림 실패는 삼킴
  const {sb:s3,H:H3}=holdBox();const hp3=s3.heroPaths('gunner');s3.ensureImages=s3.ensureImages;let r3='ok';
  const ex=hp3.slice(1);const base=s3.ensureImages;
  try{await base(['assets/ok.webp',...ex.map(p=>p)]);}catch(e){r3=e;}ok(r3==='ok','더한 그림만 섞여 있으면 성공');
  // 마지막 안전장치
  const {sb:G,H:HG}=holdBox();G.src='assets/r1045c/gunner/attack-e4.webp';G.player.attackAnim=.2;G.ctx.commands=[];G.drawHero();
  G.time=1.2;G.player.x=1;G.src='assets/r128/gunner/g-e.webp';G.ctx.commands=[];G.drawHero();let c=G.ctx.commands[0];
  ok(/attack-e4/.test(c.sourcePath)&&Math.abs(c.points[0][0]-64)<1e-6&&Math.abs(c.points[0][1]-32)<1e-6,'공격 중 옛 정지 그림(g-e) → 1.5초 안 지금 그림, 자리는 지금 발로 옮김',{s:c.sourcePath,p:c.points[0]});
  G.src='assets/r130/neon/g-e.webp';G.player.hero='gunner';G.ctx.commands=[];G.drawHero();ok(/attack-e4/.test(G.ctx.commands[0].sourcePath),'R130 정지 자세 g-* 도 옛 그림으로 봄');
  G.src='assets/r143/attack/gunner/attack-e.webp';G.ctx.commands=[];G.drawHero();ok(/attack-e4/.test(G.ctx.commands[0].sourcePath),'기억사수 R143 옛 공격 칸도 옛 그림으로 봄');
  G.src='assets/r130/hunter/directions-hunter-right.webp';G.ctx.commands=[];G.drawHero();ok(/attack-e4/.test(G.ctx.commands[0].sourcePath),'R130 directions-* 옛 방향 시트도 옛 그림으로 봄');
  G.src='assets/r128/gunner/g-dash.webp';G.ctx.commands=[];G.drawHero();ok(/g-dash/.test(G.ctx.commands[0].sourcePath),'대시 그림(g-dash)은 건드리지 않음');
  G.player.attackAnim=0;G.src='assets/r128/gunner/g-e.webp';G.ctx.commands=[];G.drawHero();ok(/g-e\.webp/.test(G.ctx.commands[0].sourcePath),'공격·스킬 아닐 때는 그대로');
  G.player.skillAnim=.4;G.time=3;G.ctx.commands=[];G.drawHero();ok(/g-e\.webp/.test(G.ctx.commands[0].sourcePath),'1.5초 넘게 지난 그림으로는 바꾸지 않음');
  G.player.hero='neon';G.time=1.3;G.src='assets/r130/neon/g-e.webp';G.ctx.commands=[];G.drawHero();ok(/r130\/neon\/g-e/.test(G.ctx.commands[0].sourcePath),'다른 영웅의 지금 그림을 빌리지 않음');
  const {sb:Z}=holdBox({on:false});ok(Z.heroPaths('gunner').length===1,'{"on":false} 면 엔진 그대로');
  console.log(JSON.stringify({passed:n}));
 }).catch(e=>{console.error(e);process.exit(1);});}
