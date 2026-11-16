'use strict';
// R1094 EGO 히든 영웅 손질 — CPU 검사(사용자 2026-11-16 01:52Z).
//  ① 빌드 연결 ② 협주 기술(환도 기술 + 페르소나 보스 기술, 키 그대로): 배분표·탄 각도·기본 공격/특수/F/W·E·R 이어 붙이기, RC151·형상 아님·끄기면 0
//  ③ 관측 폐기 7단계 강화(R62 카드, ×1.07·상한 ×1.40): 0단계는 그대로(지연 .7·대기 16), 7단계는 지연 .5·대기 11.4, 카드는 해금 뒤에만
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d).slice(0,300):'');}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const N='ego-kit-r1094.js',SRC=rd(path.join(R,'client-source',N));
// ① 빌드 연결
{const html=rd(path.join(R,'runtime-text/index.html')),man=rd(path.join(R,'runtime-manifest.json')),inp=rd(path.join(R,'runtime-inputs.json'));
 ok(SRC.length>0&&rd(path.join(R,'runtime-text',N))===SRC,N+' runtime-text 사본 = client-source');
 for(const f of ['ego-sovereign-r1046.js','ego-motion-r1048.js'])ok(rd(path.join(R,'runtime-text',f))===rd(path.join(R,'client-source',f)),f+' 사본 = client-source');
 ok(rd(path.join(ROOT,'scripts/verify-r96-public.py')).includes("'"+N+"'"),'verify-r96-public.py 기대 목록');ok(man.includes(N)&&inp.includes(N),'runtime-manifest·inputs');
 const t=x=>html.indexOf('<script src="./'+x+'"></script>');ok(t(N)>t('ego-motion-r1048.js')&&t('ego-motion-r1048.js')>t('ego-sovereign-r1046.js')&&t(N)>0,'태그: ego-motion-r1048 바로 뒤(EGO 형상 API 뒤)');
 ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1094/r1094-cpu-check.cjs'),'pages.yml CPU 검사 줄');
 for(const k of ['lance','small-orb','star','vortex','eye','eclipse','diamond','clock','shield'])ok(man.includes('assets/rc134/persona-skills/'+k+'.png'),'페르소나 기술 그림 '+k+' 매니페스트에 있음(새 자산 없이 재사용)');}
// ② 협주 기술 — 샌드박스
function kit(opt={}){const iv=[];const sb={console,JSON,Object,Array,Number,String,Math,Set,Map,Date,isFinite,setInterval:f=>{iv.push(f);return iv.length;},localStorage:{getItem:k=>opt.store?.[k]??null,setItem(){}}};sb.window=sb;vm.createContext(sb);
 vm.runInContext(`var time=10,shots=[],delays=[],floats=[];var player={hero:'hwando',x:0,y:0,hp:100,combo:0,specialCD:0,ego:0,shield:0,storyWER:{ready:{}}};
  function makeShot(x,y,a,sp,dmg,o){const s={x,y,a,sp,dmg,...o};shots.push(s);return s;}
  function delay(s,fn){delays.push({at:time+s,fn});}
  function flush(){const d=delays.splice(0);for(const q of d)q.fn();if(delays.length)flush();}
  function attackPower(){return 10;} function rank(){return 0;} function nearestEnemy(){return {x:5,y:0};} function floatText(s){floats.push(s);}
  function basicAttack(){player.combo++;} function special(){if(player.specialCD>0)return;player.specialCD=10;} function ego(){if(player.ego>0)return;player.ego=3;}
  function tick(){time+=1/60;}
  ${opt.pre||''}
  var FORM=${opt.form!==false},RC=${!!opt.rc};window.__STORYWORLD_EGO_SOVEREIGN_R1046__={formActive:()=>FORM,inspect:()=>({rc151:RC})};`,sb);
 vm.runInContext(SRC,sb,{filename:N});return{sb,iv,run:c=>vm.runInContext(c,sb),K:sb.__STORYWORLD_EGO_KIT_R1094__};}
{const{K}=kit();ok(!!K&&/^R1094-ego-kit-/.test(K.revision),'모듈');
 ok(JSON.stringify(K.basicPlan(3))==='["lance"]'&&JSON.stringify(K.basicPlan(5))==='["orb"]'&&JSON.stringify(K.basicPlan(15))==='["lance","orb"]'&&K.basicPlan(1).length===0&&K.basicPlan(NaN).length===0,'기본 공격 배분: 3타 관통·5타 씨앗·15타 둘 다');
 ok([0,1,2,3,4].map(k=>K.cyclePick('special',k)[0]).join()==='star,vortex,eye,eclipse,star','Q 순환: 분기→소용돌이→시선→일식→처음으로');
 ok(K.cyclePick('r',0).join()==='clock,shield'&&K.cyclePick('w',3).join()==='diamond'&&K.cyclePick('e',0).join()==='eye'&&K.cyclePick('ego',1).join()==='eclipse','W·E·R·F 배분');
 const ring=K.angles(K.SKILL.clock,0);ok(ring.length===6&&Math.abs(ring[3]-Math.PI)<1e-9,'시계: 사방 6갈래');
 const fan=K.angles(K.SKILL.lance,1);ok(fan.length===3&&Math.abs(fan[1]-1)<1e-9&&fan[0]<1&&fan[2]>1,'창: 겨눈 쪽 가운데 부채꼴');ok(K.angles(K.SKILL.lance,NaN).every(Number.isFinite),'각 NaN 안전');
 const names=new Set(Object.values(K.SKILL).map(s=>s.key));ok(names.size===9,'페르소나 보스 9가지 기술 모두 배분');
 ok(Object.values(K.SKILL).every(s=>s.factor>0&&s.factor<=.7),'탄 하나 피해 ≤ 공격력 70%(보수적)');}
{const{sb,run,K}=kit();run('basicAttack();basicAttack();flush()');ok(sb.shots.length===0,'1·2타: 페르소나 탄 없음');
 run('basicAttack();flush()');ok(sb.shots.length===3&&sb.shots.every(s=>s.friendly===true&&s.owner==='hero'&&/persona-skills\/lance\.png$/.test(s.asset)&&Math.abs(s.dmg-2.2)<1e-9),'3타: 악의의 관통 3발(아군 탄·원본 그림·공격력 22%)',sb.shots[0]);
 run('shots.length=0;special();flush()');ok(sb.shots.length===6&&sb.shots.every(s=>/star\.png$/.test(s.asset)),'Q: 환도 특수 뒤 순수악의의 분기 6발');
 run('shots.length=0;special();flush()');ok(sb.shots.length===0,'Q 대기 중 다시 누름: 이어 붙이지 않음');
 run('shots.length=0;player.specialCD=0;special();flush()');ok(sb.shots.length===5&&/vortex\.png$/.test(sb.shots[0].asset),'다음 Q: 내면의 소용돌이 5발');
 run('shots.length=0;ego();flush()');ok(sb.shots.length===2&&/eclipse\.png$/.test(sb.shots[0].asset),'F EGO 각성: 욕망의 일식 2발');
 run('shots.length=0;tick();player.storyWER.ready["hwando:r"]=time+13;tick();flush()');ok(sb.shots.length===10&&sb.player.shield>=15,'R EGO 환수검: 끝없는 갈망 6 + 되비친 집착 4 + 보호막',{n:sb.shots.length,sh:sb.player.shield});
 run('shots.length=0;tick();tick();flush()');ok(sb.shots.length===0,'R 대기 중: 다시 안 나감');
 run('shots.length=0;player.storyWER.ready["hwando:w"]=time+5;tick();flush()');ok(sb.shots.length===3&&/diamond\.png$/.test(sb.shots[0].asset),'W 월섬 회천: 감춘 충동 3발');
 run('shots.length=0;player.storyWER.ready["hwando:e"]=time+1e6;tick();for(let i=0;i<30;i++){player.storyWER.ready["hwando:e"]=time+1e6;tick();}flush()');ok(sb.shots.length===0,'막힌 칸(ready=time+1e6 를 매 프레임 밀어 올림)은 쓴 것으로 안 봄');
 ok(K.castJump(0,4.5)&&!K.castJump(4.4,4.5)&&!K.castJump(NaN,1e6)&&!K.castJump(1e6,1e6+.1)&&!K.castJump(0,.3),'재사용 대기 점프 판정');
 ok(K.inspect().stats.errors===0,'내부 오류 0',K.inspect().lastError);}
{const{sb,iv,run}=kit();/* 다른 오버레이가 나중에 바깥을 감싼 뒤 1초 재설치가 돌아도 한 번만 */run('var o1=special;special=function(){return o1.apply(this,arguments)};var o2=basicAttack;basicAttack=function(){return o2.apply(this,arguments)};var o3=tick;tick=function(){return o3.apply(this,arguments)}');
 for(const f of iv)f();for(const f of iv)f();run('special();flush()');ok(sb.shots.length===6,'바깥에 감싼 뒤 재설치해도 Q 뒤 페르소나 기술은 한 번(겹쳐 감싸기 없음)',sb.shots.length);
 run('shots.length=0;basicAttack();basicAttack();basicAttack();flush()');ok(sb.shots.length===3,'기본 공격도 한 번',sb.shots.length);}
{const{sb,run}=kit({rc:true});run('basicAttack();basicAttack();basicAttack();special();ego();flush()');ok(sb.shots.length===0,'RC151 변신 중엔 0(그쪽 기술표)');}
{const{sb,run}=kit({form:false});run('basicAttack();basicAttack();basicAttack();special();ego();player.storyWER.ready["hwando:r"]=time+13;tick();flush()');ok(sb.shots.length===0,'일반 환도(형상 아님)는 0 — 기존 영웅 회귀 없음');}
{const{sb,run}=kit({store:{'storyworld.r1094.egoKit':'{"on":false}'}});run('basicAttack();basicAttack();basicAttack();flush()');ok(sb.shots.length===0,'끄기 설정이면 0');}
// ③ 관측 폐기 7단계
function sov(rank){const store={'storyworld.r1046.ego':'{"on":true}'};const calls={float:[]};
 const sb={console,JSON,Date,Set,Map,Object,Array,Number,String,Math,Promise,isFinite,setTimeout,clearTimeout,setInterval:()=>0,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};sb.window=sb;vm.createContext(sb);
 vm.runInContext(`var started=true,modal=false,loading=false,storyScene=null,layer='STORY',zone='dist00',time=100;var RANK=${rank};
  var player={hero:'hwando',x:1,y:1,hp:100,storyStatus150:null,heroSlowUntil150:0};function floatText(s){__calls.float.push(s);}function toast(){}function tick(dt){time+=dt;}
  window.__STORYWORLD_PROGRESSION_R62__={defs:[],ranks:(id,p)=>id==='egoDiscardR1094'?RANK:0};`,Object.assign(sb,{__calls:calls}));
 for(const f of ['ego-sovereign-r1046-data.js','ego-sovereign-r1046.js'])vm.runInContext(rd(path.join(R,'client-source',f)),sb,{filename:f});
 const A=sb.__STORYWORLD_EGO_SOVEREIGN_R1046__;A.setForm(true);return{sb,A,run:c=>vm.runInContext(c,sb),adv:(s)=>{for(let i=0;i<Math.round(s*100);i++)vm.runInContext('tick(.01)',sb);}};}
{const S=sov(0);S.adv(.6);const card=S.sb.__STORYWORLD_PROGRESSION_R62__.defs.find(d=>d.id==='egoDiscardR1094');
 ok(!!card&&card.maxRank===7&&card.cost===1&&/관측 폐기/.test(card.name)&&/16\.0초/.test(card.text),'해금 뒤 P 창 카드(7단계, 비용 = 다음 단계)',card&&{name:card.name,text:card.text});
 const T=S.A.tier();ok(T.rank===0&&T.cooldown===16&&Math.abs(T.delay-.7)<1e-9,'0단계: 지금과 같음(지연 .7·대기 16)',T);
 S.run('player.storyStatus150={key:"slow",until:time+30};player.heroSlowUntil150=time+30');S.adv(.68);ok(S.sb.player.storyStatus150!==null,'0단계 0.68초: 그대로');S.adv(.05);ok(S.sb.player.storyStatus150===null,'0단계 0.73초: 걷힘');
 const at=S.A.inspect().discardAt;ok(Number.isFinite(at)&&Math.abs(at-S.sb.time)<.1,'폐기 시각을 inspect 로 알림(동작 그림이 씀)');}
{const S=sov(7);const T=S.A.tier();ok(T.rank===7&&Math.abs(T.mult-1.4)<1e-9&&Math.abs(T.cooldown-16/1.4)<1e-9&&Math.abs(T.delay-.5)<1e-9,'7단계: 효율 ×1.40 상한(대기 11.4초·지연 0.5초)',T);
 ok(Math.abs(S.A.tierMult(6)-1.4)<1e-9&&Math.abs(S.A.tierMult(3)-1.21)<1e-9&&S.A.tierMult(99)===1.4&&S.A.tierMult(NaN)===1,'단계 배율 1+0.07·단계, 상한 1.40, 이상값 안전');
 S.run('player.storyStatus150={key:"slow",until:time+60};player.heroSlowUntil150=time+60');S.adv(.47);ok(S.sb.player.storyStatus150!==null,'7단계 0.47초: 그대로');S.adv(.06);ok(S.sb.player.storyStatus150===null,'7단계 0.53초: 걷힘');
 S.run('player.storyStatus150={key:"slow",until:time+60};player.heroSlowUntil150=time+60');S.adv(10.5);ok(S.sb.player.storyStatus150!==null,'7단계 대기 중(10.5초)엔 그대로');S.adv(1.6);ok(S.sb.player.storyStatus150===null,'7단계 11.4초 대기 뒤 다시 걷음');
 S.run('player.hp=0;player.storyStatus150={key:"slow",until:time+60}');const d0=S.A.inspect().stats.discards;S.adv(13);ok(S.A.inspect().stats.discards===d0,'7단계여도 죽음은 폐기하지 못함');}
{const store={};const sb={console,JSON,Date,Set,Map,Object,Array,Number,String,Math,Promise,isFinite,setTimeout,clearTimeout,setInterval:()=>0,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};sb.window=sb;vm.createContext(sb);
 vm.runInContext(`var started=true,modal=false,loading=false,time=1;var player={hero:'hwando',x:1,y:1,hp:100};function tick(dt){time+=dt;}window.__STORYWORLD_PROGRESSION_R62__={defs:[],ranks:()=>0};`,sb);
 for(const f of ['ego-sovereign-r1046-data.js','ego-sovereign-r1046.js'])vm.runInContext(rd(path.join(R,'client-source',f)),sb,{filename:f});for(let i=0;i<100;i++)vm.runInContext('tick(.01)',sb);
 ok(sb.__STORYWORLD_PROGRESSION_R62__.defs.length===0,'잠긴 동안엔 카드 없음(EGO 를 모르는 사람에게 안 보임)');}
// ③ R1094b 타격 섬광: EGO 형상일 때 환도 무채색(흰 덩어리) 대신 주홍·먹빛, 보통 합성, 알파 .65
{const pre=`var imgs=[],heroSeen=[];function drawImage(p,x,y,w,h,o){imgs.push({p,o:o||{}});return true;}
  function drawEffect(e){const hero=e.sourceHero||'hwando';heroSeen.push(hero);drawImage(e.asset,0,0,1,1,{blend:'screen',alpha:.8,...(hero==='hwando'?{filter:'grayscale(1)'}:{})});}`;
 let{sb,run,K}=kit({pre});const o=K.hitOpt({alpha:.8,blend:'screen',filter:'grayscale(1)'});
 ok(Math.abs(o.alpha-.52)<1e-9&&o.blend==='source-over'&&o.filter===K.HIT_FILTER&&!/grayscale|blur|drop-shadow|sepia/.test(K.HIT_FILTER)&&K.hitOpt({alpha:NaN}).alpha===.65&&K.hitOpt(null).alpha===.65,'hitOpt: 알파 ×.65·보통 합성·허용 필터만(NaN → .65)');
 run("var b={type:'burst',asset:'assets/vfx/generated/v300/burst-impact.webp'};drawEffect(b);");
 let last=run('imgs[imgs.length-1]');ok(last.o.filter===K.HIT_FILTER&&last.o.blend==='source-over'&&Math.abs(last.o.alpha-.52)<1e-9&&run('heroSeen[heroSeen.length-1]')==='ego-r1094','EGO 형상: 타격 섬광은 주홍·먹빛(무채색 규칙 비켜 감)');
 ok(run("!Object.prototype.hasOwnProperty.call(b,'sourceHero')")&&K.inspect().stats.hitTint===1,'섬광 그린 뒤 sourceHero 원래대로(없던 값은 지움)·hitTint 1');
 run("var b2={type:'burst',asset:'x',sourceHero:'hwando'};drawEffect(b2);");ok(run('b2.sourceHero')==='hwando','있던 sourceHero 는 되돌림');
 run("drawEffect({type:'slash',asset:'s'});");last=run('imgs[imgs.length-1]');ok(last.o.filter==='grayscale(1)'&&last.o.blend==='screen','섬광 아닌 효과(베기 등)는 그대로');
 run("drawImage('plain',0,0,1,1,{alpha:1});");ok(run('imgs[imgs.length-1]').o.alpha===1,'효과 밖 drawImage 는 그대로');
 ({run,K}=kit({pre,form:false}));run("drawEffect({type:'burst',asset:'x'});");last=run('imgs[imgs.length-1]');ok(last.o.filter==='grayscale(1)'&&K.inspect().stats.hitTint===0,'EGO 형상이 아니면 환도 섬광 그대로');
 {const k2=kit({pre});({run,K}=k2);run("var o4=drawEffect;drawEffect=function(){return o4.apply(this,arguments)};var o5=drawImage;drawImage=function(){return o5.apply(this,arguments)};");for(const f of k2.iv)f();}run("drawEffect({type:'burst',asset:'x'})");ok(K.inspect().stats.hitTint===1,'다른 오버레이가 겉을 감싸도 한 번만');}
// ④ R1094b R101 타격 시트(sig-hit-pale, 3D 화면 큰 흰 별): EGO 형상이면 붉은 시트로 바꿔 언주·먹·흰, 알파 .65 — 그 한 번만
{const pre=`var drew=[];function Ctx(){this.filter='none';this.globalAlpha=1;}Ctx.prototype.drawImage=function(im){drew.push({src:im.src,filter:this.filter,alpha:this.globalAlpha});};var ctx=new Ctx();
  function readyImage(p){return {image:{src:p,naturalWidth:1920}};}
  function drawEffect(e){if(e.type==='r101-air'){ctx.filter='grayscale(1) brightness(1.12)';ctx.globalAlpha=1;ctx.drawImage({src:'assets/r100/sig-hit-pale.webp'});ctx.filter='none';ctx.drawImage({src:'assets/r100/sig-slash-gold.webp'});}
   if(e.type==='r945-hwando-ink'){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1;ctx.filter='none';ctx.drawImage({src:'assets/r945/hwando-ink-burst.webp'});ctx.globalCompositeOperation='source-over';ctx.drawImage({src:'assets/r945/hwando-ink-burst.webp'});ctx.globalCompositeOperation='lighter';ctx.drawImage({src:'assets/mobs/x.webp'});}}`;
 let{run,K}=kit({pre});run("drawEffect({type:'r101-air'})");let d=run('drew');
 ok(d[0].src==='assets/r100/sig-hit-red.webp'&&d[0].filter===K.SIG_FILTER&&Math.abs(d[0].alpha-.65)<1e-9&&!/grayscale|blur|drop-shadow/.test(K.SIG_FILTER),'EGO: 흰 타격 시트 → 붉은 시트·언주 필터·알파 .65',d);
 ok(d[1].src==='assets/r100/sig-slash-gold.webp'&&d[1].filter==='none'&&run("!Object.prototype.hasOwnProperty.call(ctx,'drawImage')")&&run('ctx.filter')==='none'&&K.inspect().stats.sigTint===1,'다른 그림은 그대로·그린 뒤 ctx 원래대로',d);
 run("drew.length=0;drawEffect({type:'r945-hwando-ink'})");d=run('drew');
 ok(Math.abs(d[0].alpha-.7)<1e-9&&d[0].filter===K.SOFT_FILTER&&d[1].alpha===1&&d[1].filter==='none'&&d[2].alpha===1&&K.inspect().stats.softTint===1&&!/grayscale|blur|drop-shadow/.test(K.SOFT_FILTER),'EGO: 환도 수묵 이펙트 더하기 합성만 알파 .7·명도 눌러 날림 줄임(보통 합성·환도 아닌 그림은 그대로)',d);
 ({run,K}=kit({pre,form:false}));run("drawEffect({type:'r101-air'})");d=run('drew');ok(d[0].src==='assets/r100/sig-hit-pale.webp'&&d[0].filter==='grayscale(1) brightness(1.12)','EGO 형상 아니면 환도 흰 시트 그대로');}
// ⑤ R1094c 환도 난초(r945, 보통 합성 흰 꽃잎): EGO 형상이면 영웅 1.2칸 안만 옅게(영웅 위 .45 → 1.2칸 1)
{const pre=`var drew=[],TILE=34,zoom=1;function Ctx(){this.filter='none';this.globalAlpha=1;this.globalCompositeOperation='source-over';}Ctx.prototype.drawImage=function(im){drew.push({src:im.src,alpha:this.globalAlpha});};Ctx.prototype.translate=function(){};var ctx=new Ctx();
  function project(x,y){return {x:x*34,y:y*34};}function readyImage(p){return {image:{src:p,naturalWidth:1}};}
  function drawEffect(e){if(e.type!=='r945-hwando-ink')return;for(const [x,y] of e.at){ctx.translate(x*34,y*34);ctx.drawImage({src:'assets/r945/hwando-orchid-slash.webp'});}ctx.drawImage({src:'assets/r945/hwando-ink-cloud.webp'});}`;
 let{run,K}=kit({pre});const A=K.orchidAlpha;
 ok(Math.abs(A(0)-.45)<1e-9&&A(1.2)===1&&A(3)===1&&A(NaN)===1&&A(.6)>.45&&A(.6)<1,'orchidAlpha: 영웅 위 .45, 1.2칸 이상 1, NaN → 1');
 run("drawEffect({type:'r945-hwando-ink',at:[[0,0],[.6,0],[3,0]]})");let d=run('drew');
 ok(Math.abs(d[0].alpha-.45)<1e-9&&Math.abs(d[1].alpha-A(.6))<1e-9&&d[2].alpha===1&&d[3].alpha===1&&K.inspect().stats.orchidSoft===2&&run("!Object.prototype.hasOwnProperty.call(ctx,'translate')&&!Object.prototype.hasOwnProperty.call(ctx,'drawImage')"),'EGO: 영웅 가까운 난초만 옅게·먼 난초·다른 그림 그대로·ctx 원래대로',d);
 ({run,K}=kit({pre,form:false}));run("drawEffect({type:'r945-hwando-ink',at:[[0,0]]})");ok(run('drew')[0].alpha===1,'EGO 형상 아니면 난초 그대로');}
console.log(`\nR1094 CPU ${n-bad}/${n} 통과`);process.exitCode=bad?1:0;
