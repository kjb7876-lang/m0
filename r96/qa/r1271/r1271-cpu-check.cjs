// R1271 적중 이펙트 반투명 CPU 검사 (사용자 2026-11-20 "공격 적중시 이펙트 반투명하게 해서 유닛들 잘 보이게")
//  적중(피격) 이펙트(burst·slash·e568HeroImpact·r912hit·접촉·영웅 피격)를 그릴 때 ctx.globalAlpha 를 낮춰 아래 몹·영웅이 비쳐 보이게 한다.
//  피해·판정·효과 목록·텍스트·스킬 이펙트는 그대로. 끄기 storyworld.r1271.hitAlpha {"on":false}
//  node r96/qa/r1271/r1271-cpu-check.cjs   (실제 화면은 헤드리스로만 봄 — GPU·실기기 미검증)
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS',m);};
const rd=f=>fs.readFileSync(path.join(R,f),'utf8');
const F='hit-translucent-r1271.js';
ok(rd('client-source/'+F)===rd('runtime-text/'+F),'runtime-text 사본과 같음');
ok(/node r96\/qa\/r1271\/r1271-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
ok(/<script src="\.\/play-log-r1250\.js"><\/script>\n<script src="\.\/hit-translucent-r1271\.js"><\/script>\n<script src="\.\/reward-throw-r1262\.js"><\/script>/.test(rd('runtime-text/index.html')),'index.html 태그(play-log-r1250 뒤 자기 줄)');
ok((rd('runtime-text/index.html').match(/hit-translucent-r1271\.js/g)||[]).length===1,'index.html 에 한 번만');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'hit-translucent-r1271.js'"),'공개 확인 목록');
ok(/"hit-translucent-r1271\.js"/.test(rd('runtime-inputs.json'))&&/"hit-translucent-r1271\.js"/.test(rd('runtime-manifest.json')),'runtime-inputs·manifest 목록');
const src=rd('client-source/'+F);
const HIT=['burst','slash','e568HeroImpact','r912hit','contactR61','regionalContactR58','hospitalBossContact14','playerHitR43','heroHit'];
const KEEP=['text','sigil','ghost','link','damageText','bloodR52','threadSlashR63','storySourceSkill','actorWarpR61'];
const sbDoc=()=>{const kids=[];const mk=t=>({tag:t,children:[],append(...c){this.children.push(...c);},appendChild(c){this.children.push(c);},set textContent(v){this.text=v;},get textContent(){return this.text;}});return {readyState:'complete',kids,createElement:mk,getElementById:id=>grid.children.flatMap(l=>l.children).find(k=>k.id===id)||null,querySelector:()=>grid};};
const grid={children:[],appendChild(c){this.children.push(c);}};
function load(pref,{boom=false}={}){const win={};const ctx={globalAlpha:1};const seen=[];
 const store={};const sb={window:win,store,localStorage:{getItem:k=>k==='storyworld.r1271.hitAlpha'&&pref?JSON.stringify(pref):(store[k]??null),setItem(k,v){store[k]=v;}},Math,Number,JSON,Object,Array,Set,Map,WeakMap,String,isFinite,console,document:sbDoc(),showSettings:undefined,addEventListener(){},ctx};
 /* 엔진 drawEffect 흉내: 그리는 순간의 ctx.globalAlpha 를 기록 */
 sb.StoryPhase1={ThreeRenderer:function(){}};sb.StoryPhase1.ThreeRenderer.prototype.render=function(f){sb.lastFrame=f;return 'rendered';};
 sb.drawEffect=function(e){if(boom&&e.boom)throw new Error('boom');seen.push({type:e.type,a:ctx.globalAlpha});return 'drawn';};
 vm.createContext(sb);vm.runInContext(src,sb);return{A:win.__STORYWORLD_HIT_TRANSLUCENT_R1271__,sb,ctx,seen};}
{const {sb,ctx,seen}=load(null);
 for(const t of HIT){ctx.globalAlpha=1;const r=sb.drawEffect({type:t,size:1});
  const a=seen[seen.length-1].a;ok(r==='drawn','반환값 그대로 '+t);ok(a<=.65&&a>=.3,t+' 그릴 때 반투명(.3~.65)',a);ok(ctx.globalAlpha===1,t+' 그린 뒤 알파 복원');}
 for(const t of KEEP){ctx.globalAlpha=1;sb.drawEffect({type:t,size:1});ok(seen[seen.length-1].a===1,t+' 는 그대로(스킬·텍스트·비적중)');}
 ctx.globalAlpha=.5;sb.drawEffect({type:'burst',size:1});ok(Math.abs(seen[seen.length-1].a-.5*seen[0].a)<1e-9||seen[seen.length-1].a<.5,'이미 낮은 알파에는 곱해서 더 낮춤(올리지 않음)',seen[seen.length-1].a);
 ctx.globalAlpha=1;sb.drawEffect({type:'burst',size:2.4});const big=seen[seen.length-1].a;ctx.globalAlpha=1;sb.drawEffect({type:'burst',size:.5});const small=seen[seen.length-1].a;
 ok(big<=small,'유닛을 덮는 큰 이펙트가 작은 것보다 같거나 더 투명',{big,small});
 ok(big>=.3,'큰 이펙트도 너무 사라지지 않음(≥.3)',big);}
{const {sb,ctx,seen}=load({on:false});ctx.globalAlpha=1;sb.drawEffect({type:'burst',size:1});ok(seen[0].a===1,'끄기 설정이면 예전 그대로');}
{const {sb,ctx,seen}=load(null,{boom:true});ctx.globalAlpha=1;let threw=false;try{sb.drawEffect({type:'burst',boom:true});}catch(_){threw=true;}
 ok(threw&&ctx.globalAlpha===1,'그리기가 던져도 알파 복원(finally)');}
{const {sb,ctx,seen}=load(null);ctx.globalAlpha=NaN;sb.drawEffect({type:'burst',size:1});ok(Number.isFinite(seen[0].a),'NaN 알파에서도 유한값',seen[0].a);
 ctx.globalAlpha=1;sb.drawEffect({type:'burst'});ok(Number.isFinite(seen[1].a),'size 없는 효과도 안전');}
{const {A}=load(null);ok(A&&typeof A.inspect==='function'&&A.inspect().stats,'inspect 노출');}
{const {A,sb,ctx,seen}=load(null);
 ok(A.level()===.6,'기본 투명도(불투명도) .6');
 A.set({level:.4});ctx.globalAlpha=1;sb.drawEffect({type:'burst',size:1});ok(Math.abs(seen[0].a-.4)<1e-9,'사용자 값 .4 가 그리기에 반영',seen[0].a);
 ctx.globalAlpha=1;sb.drawEffect({type:'burst',size:2.4});ok(Math.abs(seen[1].a-.3)<1e-9,'큰 이펙트는 값의 .75배(.3)',seen[1].a);
 A.set({level:5});ok(A.level()===1,'상한 1(예전 그대로 불투명)');A.set({level:-3});ok(A.level()>=.2,'하한 .2(이펙트가 사라지지 않음)',A.level());A.set({level:'abc'});ok(A.level()>=.2&&A.level()<=1,'잘못된 값 무시');
 A.set({level:.35});ok(/"level":0?\.35/.test(sb.store['storyworld.r1271.hitAlpha']),'값 저장됨',sb.store);}
{const {A}=load({level:.8});ok(A.level()===.8,'저장된 값 불러옴');}
{const {A,sb}=load(null);let base=0;sb.showSettings=function(){base++;return 'ok';};A.install();
 const r=sb.showSettings();ok(r==='ok'&&base===1,'설정창 감싸기: 원래 창 그대로');
 const inp=grid.children.flatMap(l=>l.children).find(c=>c.id==='hitAlphaR1271');ok(!!inp&&inp.type==='range'&&inp.min==='20'&&inp.max==='100','설정창에 20~100% 슬라이더');
 sb.showSettings();ok(grid.children.length===1,'다시 열어도 한 번만');
 inp.value='45';inp.oninput();ok(A.level()===.45,'슬라이더가 값을 바꿈');}
{const {A,sb,ctx,seen}=load(null);const first=sb.drawEffect;A.install();A.install();ok(sb.drawEffect===first,'install 을 다시 불러도 두 번 감싸지 않음');
 /* 뒤에 다른 모듈이 감싼 뒤 load 때 다시 install 해도 중복 안 됨 */
 const outer=sb.drawEffect;sb.drawEffect=function(e){return outer.call(this,e);};A.install();ctx.globalAlpha=1;sb.drawEffect({type:'burst',size:1});ok(Math.abs(seen[seen.length-1].a-.6)<1e-9,'다른 모듈이 감싼 뒤 install 해도 .6 한 번만',seen[seen.length-1].a);}
/* 시전 소용돌이(R100 sig-aura·sig-gather, 모든 색) — Three 기록기 명령의 알파를 낮춤 */
{const {A,sb}=load(null);sb.window.StoryPhase1=sb.StoryPhase1;A.install();
 const cmd=(p,a)=>({kind:'image',sourcePath:p,style:{globalAlpha:a}});
 const frame={commands:[cmd('assets/r100/sig-aura-red.webp',1),cmd('assets/r100/sig-gather-blue.webp',.8),cmd('assets/r100/sig-aura-gold.webp',1),cmd('assets/r100/sig-hit-red.webp',1),cmd('assets/r380/mobs/swamp-goat.webp',1),{kind:'image',sourcePath:'assets/r100/sig-aura-red.webp'}]};
 const r=new sb.StoryPhase1.ThreeRenderer().render(frame);
 ok(r==='rendered','render 반환값 그대로');
 const a=frame.commands.map(c=>c.style&&c.style.globalAlpha);
 ok(Math.abs(a[0]-.6)<1e-9&&Math.abs(a[1]-.48)<1e-9&&Math.abs(a[2]-.6)<1e-9,'sig-aura·sig-gather 모든 색 반투명(.6배)',a);
 ok(a[3]===1&&a[4]===1,'sig-hit·몹 그림은 그대로',a);
 ok(Math.abs(frame.commands[5].style.globalAlpha-.6)<1e-9,'style 없는 명령도 처리');
 new sb.StoryPhase1.ThreeRenderer().render(frame);ok(Math.abs(frame.commands[0].style.globalAlpha-.6)<1e-9,'같은 명령 배열을 다시 그려도 한 번만 곱함(엔진은 frame 재사용)',frame.commands[0].style.globalAlpha);
 A.set({level:.3});const f2={commands:[cmd('assets/r100/sig-aura-teal.webp',1)]};new sb.StoryPhase1.ThreeRenderer().render(f2);ok(Math.abs(f2.commands[0].style.globalAlpha-.3)<1e-9,'슬라이더 값 반영');
 A.set({on:false});const f3={commands:[cmd('assets/r100/sig-aura-teal.webp',1)]};new sb.StoryPhase1.ThreeRenderer().render(f3);ok(f3.commands[0].style.globalAlpha===1,'끄면 그대로');
 const f4={commands:null};ok(new sb.StoryPhase1.ThreeRenderer().render(f4)==='rendered','commands 없어도 안전');}
console.log('총 PASS',n);
