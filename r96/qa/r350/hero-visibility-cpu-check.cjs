// R350 CPU 검사: 영웅 위 스킬 그림 옅게(veil)·영웅 다시 보이기(ghost)·피격 피 튐(blood). 그림만 바꾸고 판정·피해는 그대로인지.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..');
const src=fs.readFileSync(path.join(R,'client-source','hero-visibility-r350.js'),'utf8');
let ok=0,bad=0;const t=(c,m)=>{if(c){ok++;console.log('ok  ',m);}else{bad++;console.log('FAIL',m);}};
function load(prefs){
 const store={};if(prefs)store['storyworld.r350.heroVisibility']=JSON.stringify(prefs);
 const frames=[],draws=[],scopes=[];
 const C=function(){};C.prototype.render=function(frame){frames.push(frame);return 'rendered';};
 const ctx={globalAlpha:1,globalCompositeOperation:'source-over',filter:'none',save(){},restore(){},translate(){},scale(){},rotate(){},
  drawImage(...a){draws.push({a,filter:this.filter,alpha:this.globalAlpha,comp:this.globalCompositeOperation,owner:this._owner});},
  scope(o,fn){scopes.push(o);const p=this._owner;this._owner=o;try{return fn();}finally{this._owner=p;}}};
 const g={console,performance:{now:()=>0},setTimeout:()=>0,setInterval:()=>0,Date,Math,JSON,Promise,WeakSet,Map,Set,Number,String,Array,Object,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},
  ctx,time:10,started:true,loading:false,modal:null,effects:[],player:{x:5,y:5,hp:100,hero:'hwando'},room:{enemies:[{x:6,y:5,hp:10}]},
  maxHP:()=>100,actorHeight:()=>60,project:(x,y)=>({x:x*40,y:y*20}),readyImage:p=>({image:{naturalWidth:512,naturalHeight:512,path:p}}),ensureImages:()=>Promise.resolve(),
  hurtCalls:[],tickCalls:0,drawEffectCalls:0};
 g.window=g;g.StoryPhase1={ThreeRenderer:C};
 g.hurt=function(d,s){g.hurtCalls.push([d,s]);if(g.player.invincible>0)return 'invulnerable';g.player.hp-=d*.65;return 'hit';};
 g.tick=function(dt){g.tickCalls++;return 'ticked';};g.drawEffect=function(e){g.drawEffectCalls++;};g.enterRegion=async function(){return 'entered';};
 vm.createContext(g);vm.runInContext(src,g);
 return {g,C,frames,draws,scopes,store,A:g.__STORYWORLD_HERO_VISIBILITY_R350__};}
const img=(o,pts,extra={})=>({kind:'image',owner:o,points:pts,style:{globalAlpha:1,globalCompositeOperation:'source-over',filter:'none'},order:0,key:o.id+':0',...extra});
const rect=(x0,y0,x1,y1)=>[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
const heroBody=()=>img({id:'hero',kind:'hero',x:5,y:5,bodyPath:'h.png'},rect(180,40,220,100),{spatialRole:'body',mutable:true,sourcePath:'original-actor-canvas'});
function frameOf(...cs){cs.forEach((c,i)=>c.order=i);return{commands:cs};}

{const {A,C,frames}=load();
 t(A&&A.revision==='R350-hero-visibility-1','API 노출·revision');
 t(typeof C.prototype.render==='function'&&C.prototype.render.__r350===true,'ThreeRenderer.prototype.render 감싸기(인스턴스 감싸기는 setInterval wrapInst)');
 // 영웅 쪽 큰 스킬 그림이 몸을 다 덮는다 → 옅게, 적 그림·R106·바닥·탄환은 그대로
 const hero=heroBody(),skill=img({id:'r292:hw-q:1',kind:'effect',x:5,y:5},rect(150,20,250,120),{style:{globalAlpha:1,globalCompositeOperation:'lighter',filter:'none'}}),
  enemy=img({id:'pxf-enemy-melee:dist01:3',kind:'effect',x:6,y:5},rect(170,30,230,110)),
  r106=img({id:'scene',kind:'effect'},rect(170,30,230,110),{sourcePath:'r106fx:glow:1.2.3:4.5.6'}),
  ground=img({id:'r292:hw-q:g',kind:'effect',groundAligned:true},rect(150,20,250,120)),
  proj=img({id:'p1',kind:'projectile'},rect(170,30,230,110)),
  tiny=img({id:'r292:spark',kind:'effect'},rect(218,95,224,104)),
  text={kind:'text',owner:{id:'t',kind:'effect'},point:[200,60],style:{globalAlpha:1}};
 const f=frameOf(hero,skill,enemy,r106,ground,proj,tiny,text);const r=C.prototype.render.call({},f);
 t(r==='rendered'&&frames[0]===f,'원래 render 를 같은 frame 으로 부르고 결과를 돌려줌');
 t(skill.style.globalAlpha<.5&&skill.style.globalAlpha>=.149,'영웅 몸을 다 덮는 영웅 쪽 스킬 그림 옅게(최대 85%): '+skill.style.globalAlpha.toFixed(3));
 t(enemy.style.globalAlpha===1,'적 공격 그림(pxf-enemy-*)은 옅게 안 함(위협 신호)');
 t(r106.style.globalAlpha===1,'R106 스프라이트는 R106 heroVeil·overHero 가 맡으므로 그대로');
 t(ground.style.globalAlpha===1&&proj.style.globalAlpha===1,'바닥에 붙은 그림·탄환은 그대로');
 t(tiny.style.globalAlpha===1,'몸 상자의 4% 미만만 덮는 작은 불꽃은 그대로');
 t(hero.style.globalAlpha===1&&hero.spatialRole==='body','영웅 몸 명령 자체는 그대로');
 const ghosts=f.commands.filter(c=>c.owner?.r350&&String(c.owner.id).startsWith('r350:ghost:'));
 t(ghosts.length===1&&ghosts[0].owner.kind==='effect'&&ghosts[0].spatialRole===null&&ghosts[0].order>7&&ghosts[0].style.globalAlpha>0&&ghosts[0].style.globalAlpha<=.6&&ghosts[0].image===hero.image&&ghosts[0].key!==hero.key,'남은 가림(적·R106)이 크면 영웅 몸을 이펙트 패스 맨 뒤에 반투명(≤60%)으로 한 번 더(새 key, 같은 그림·좌표)');
 const ins=A.inspect();t(ins.recent.length===1&&ins.recent[0].before>ins.recent[0].after&&ins.recent[0].veiled===1,'측정값(옅게 전/후 가림 양) 기록');
 t(ins.contributors.some(([k])=>k.startsWith('r292'))&&ins.contributors.some(([k])=>k==='r106:glow'),'가리는 그림 출처별 합 기록');}
{const {C}=load();// 화면 대부분을 덮는 아주 큰 그림은 최대 55%만
 const hero=heroBody(),huge=img({id:'r111:ego-front',kind:'effect'},rect(-400,-400,800,600));const f=frameOf(hero,huge);C.prototype.render.call({},f);
 t(huge.style.globalAlpha>=.449&&huge.style.globalAlpha<.6,'아주 큰 그림은 최대 55%까지만 옅게: '+huge.style.globalAlpha.toFixed(3));
 {const gh=f.commands.filter(c=>c.owner?.r350);t(gh.length===1&&gh[0].style.globalAlpha<.2,'옅게 한 뒤 남은 가림만큼만 유령(작으면 옅게): '+gh[0]?.style.globalAlpha.toFixed(3));}
 {const hero=heroBody(),half=img({id:'r292:y',kind:'effect'},rect(150,20,200,60),{style:{globalAlpha:.5,globalCompositeOperation:'lighter',filter:'none'}});const f2=frameOf(hero,half);C.prototype.render.call({},f2);t(!f2.commands.some(c=>c.owner?.r350),'남은 가림이 작으면(≤0.3) 유령을 넣지 않음');}}
{const {C}=load();// 영웅 몸이 없으면(죽음·숨김) 아무것도 안 함
 const skill=img({id:'r292:x',kind:'effect'},rect(150,20,250,120));const f=frameOf(skill);C.prototype.render.call({},f);t(skill.style.globalAlpha===1&&f.commands.length===1,'영웅 몸 명령이 없으면 그대로');}
{const {C}=load({veil:false,ghost:false,blood:false});const hero=heroBody(),skill=img({id:'r292:x',kind:'effect'},rect(150,20,250,120)),r106=img({id:'s',kind:'effect'},rect(150,20,250,120),{sourcePath:'r106fx:glow:x'});
 const f=frameOf(hero,skill,r106);C.prototype.render.call({},f);t(skill.style.globalAlpha===1&&f.commands.length===3,'끄기(localStorage) → 옅게·유령 없음');}

// 피 튐
{const {g,A,C,draws,scopes}=load();
 const r=g.hurt(20,{x:6,y:5,name:'t'});t(r==='hit'&&g.hurtCalls.length===1&&g.hurtCalls[0][0]===20,'hurt: 원래 함수에 같은 인자, 같은 결과(피해·무적은 엔진 그대로)');
 const hp=g.player.hp;g.tick(.016);t(g.tickCalls===1,'tick 원래 함수 호출');
 t(A.inspect().stats.bloodSpawned===1&&g.effects.length===1&&g.player.hp===hp,'체력이 깎이면 피 튐 1회(효과 목록에 표지 1개), 체력은 건드리지 않음');
 t(A.inspect().active===4,'큰 피해(5% 이상): 뿌림+터짐+흐름+발밑 핏자국 4장');
 const SENT=g.effects[0];g.time=10.1;g.drawEffect(SENT);t(g.drawEffectCalls===0,'표지는 원래 drawEffect 로 넘기지 않음');
 t(draws.length>=2&&draws.every(d=>/^brightness\([\d.]+\) saturate\(1\.3\)$/.test(d.filter)&&d.comp==='source-over'),'기록기 허용 필터(brightness·saturate)만, 보통 섞기: '+draws[0]?.filter);
 t(scopes.every(o=>o.kind==='effect'&&o.r350blood===true&&o.r350===true),'피 튐은 r350blood 표시 범위로 그림');
 t(draws.some(d=>/brightness\(1\.[5-9]/.test(d.filter)),'처음 프레임은 밝은 선혈(brightness ≥1.5)');
 // 맞은 반대쪽: 근원(6,5) → 영웅(5,5): 화면 왼쪽(π) 으로 뿌림 → 회전 = π − π/4
 const sp=A.inspect();t(sp.lastError===null,'오류 없음');
 // 피 튐 명령은 이펙트 패스 맨 뒤(유령보다 뒤)
 const hero=heroBody(),cover=img({id:'s',kind:'effect'},rect(150,20,250,120),{sourcePath:'r106fx:glow:x'}),blood=img({id:'r350:blood:1:splash:0',kind:'effect',r350:true,r350blood:true},rect(190,40,210,60));
 const f=frameOf(hero,blood,cover);C.prototype.render.call({},f);const gh=f.commands.find(c=>String(c.owner.id).startsWith('r350:ghost:'));
 t(blood.style.globalAlpha===1&&gh&&blood.order>gh.order&&blood.order>cover.order,'피 튐은 옅게 안 하고 유령·다른 이펙트보다 뒤(위)에 칠함');
 // 무적(피해 없음) → 피 없음
 g.player.invincible=1;g.time=11;const before=A.inspect().stats.bloodSpawned;g.hurt(20,{x:6,y:5});g.tick(.016);t(A.inspect().stats.bloodSpawned===before,'무적·막기로 체력이 안 깎이면 피 없음');
 // 동시 6장 제한
 g.player.invincible=0;for(let i=0;i<10;i++){g.time=12+i*.1;g.player.hp-=10;g.tick(.016);}t(A.inspect().active<=6,'동시에 최대 6장');
 // 지역 이동 시 비움
 g.enterRegion('x').then(()=>{t(A.inspect().active===0,'지역 이동하면 비움');finish();});}
function finish(){
 const {g,A}=load({blood:false});g.player.hp-=30;g.tick(.016);t(A.inspect().stats.bloodSpawned===0,'blood:false 면 피 튐 없음');
 t(!/drop-shadow|blur\(/.test(src.replace(/\/\/.*$/gm,'').replace(/\/\*[\s\S]*?\*\//g,'')),'기록기에서 Legacy 로 떨어지는 필터(drop-shadow·blur) 안 씀');
 t(!/\b(rune|runecross)\b/.test(src),'영웅 쪽 파일: 마법진(rune·runecross) 안 씀');
 t(!/player\.(hp|invincible|hurtAnim|x|y)\s*[-+*]?=(?!=)/.test(src),'플레이어 판정 값(hp·무적·위치)을 쓰지 않음');
 const meta=JSON.parse(fs.readFileSync(path.join(R,'runtime-text','assets','r190','blood','index.json'),'utf8')).effects;
 t(meta['blood-splash'].frames===15&&meta['blood-burst'].frames===14&&meta['blood-death'].frames===15&&[meta['blood-splash'],meta['blood-burst'],meta['blood-death']].every(m=>m.frame[0]===128&&m.columns===4),'R190 시트 칸 수·크기(15/14/15, 128px, 4열)와 코드 상수 일치');
 for(const d of['client-source','runtime-text'])t(fs.readFileSync(path.join(R,d,'hero-visibility-r350.js'),'utf8')===src,`${d} 사본 일치`);
 const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
 t(/enemy-hexagram-r341\.js"><\/script>(?:<script src="\.\/[a-z0-9-]+\.js"><\/script>)*<script src="\.\/hero-visibility-r350\.js"><\/script>(?:<script src="\.\/[a-z0-9-]+\.js"><\/script>)*\s*<script src="\.\/combat-r118\.js">/.test(html)&&html.split('"./hero-visibility-r350.js"').length===2,'index.html 스크립트 태그(enemy-hexagram-r341 뒤, combat-r118 앞, 한 번)');
 const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')),inp=JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8'));
 t(man.files.some(f=>f.path==='hero-visibility-r350.js')&&inp.textPaths.includes('hero-visibility-r350.js'),'runtime-manifest·runtime-inputs 에 등록');
 t(/'hero-visibility-r350\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')),'verify-r96-public.py 기대 목록');
 t(/node r96\/qa\/r350\/hero-visibility-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')),'pages.yml CPU 검사 줄');
 console.log(`R350 ${ok}/${ok+bad}`);process.exit(bad?1:0);}
