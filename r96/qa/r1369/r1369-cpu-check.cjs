// R1369 이펙트 투명도 공통 규칙 CPU 검사 (사용자 2026-11-27 "이펙트 반투명도 더 올려서 몹과 영웅이 더 잘 보이게 — 룰 정비" → 규칙 5개 승인)
//  1) 몸 위 겹침(오라·낙인·피격·버프) ≤ .3   2) 적중 순간(베기 반월·타격·폭발) 첫 .1초 ≤ .6, 그 뒤 빠르게 ≤ .25
//  3) 위험 범위(보스 고유 스킬·메테오 착탄) 테두리 ≤ .7·안쪽 ≤ .3   4) 배경(광폭화 불길·바닥 물결) ≤ .35, 캐릭터 뒤에
//  5) 이펙트가 영웅·몹 몸을 화면 넓이 40% 넘게 가리면 그 이펙트를 더 옅게.  모든 값은 '최대'(이미 더 옅으면 그대로, 올리지 않음).
//  node r96/qa/r1369/r1369-cpu-check.cjs   (실제 화면은 헤드리스로만 봄 — GPU·실기기 미검증)
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS',m);};
const rd=f=>fs.readFileSync(path.join(R,f),'utf8');
const F='fx-alpha-rules-r1369.js';
// ---- 빌드 연결(다섯 곳) ----
ok(fs.existsSync(path.join(R,'client-source',F)),'client-source 원본 있음');
ok(rd('client-source/'+F)===rd('runtime-text/'+F),'runtime-text 사본과 같음');
{const html=rd('runtime-text/index.html'),tag='<script src="./'+F+'"></script>';
 ok(html.split(tag).length===2,'index.html 태그 한 번');
 ok(html.indexOf(tag)>html.indexOf('"./envy-glass-r1343.js"')&&html.indexOf(tag)<html.indexOf('"./combat-guide-r1249.js"'),'태그 자리: envy-glass-r1343 뒤, combat-guide-r1249 앞(자기 줄)');
 ok(html.includes('\n'+tag+'\n'),'자기 줄(앞뒤 줄바꿈)');}
ok(/node r96\/qa\/r1369\/r1369-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"),'공개 확인 목록');
ok(rd('runtime-inputs.json').includes('"'+F+'"')&&rd('runtime-manifest.json').includes('"'+F+'"'),'runtime-inputs·manifest 목록');

// ---- 모래상자: 엔진 전역 흉내 ----
const src=rd('client-source/'+F);
function load({pref=null,r1271=null,game={}}={}){
 const win={},store={};if(pref)store['storyworld.r1369.fxAlpha']=JSON.stringify(pref);
 const sb={window:win,store,localStorage:{getItem:k=>store[k]??null,setItem(k,v){store[k]=v;}},Math,Number,JSON,Object,Array,Set,Map,WeakMap,WeakSet,String,RegExp,isFinite,console,setInterval(){},performance:{now:()=>0},
  document:{readyState:'complete'},addEventListener(){},time:0,W:960,H:540,TILE:34,zoom:1,
  player:{x:0,y:0,hp:100,visible:true},room:{enemies:[]},
  project:(x,y)=>({x:x*100+480,y:y*100+300}),actorHeight:()=>60,ctx:{globalAlpha:1},...game};
 if(r1271)win.__STORYWORLD_HIT_TRANSLUCENT_R1271__=r1271;
 // CommandScene: 마지막으로 그리기 명령을 받는 곳(인스턴스 render 가 따로 있는 경우까지)
 function CommandScene(){this.projection={width:960,height:540};this.got=null;}
 CommandScene.prototype.render=function(cmds){this.got=cmds.map(c=>({...c,style:{...c.style},owner:{...c.owner}}));return 'drawn';};
 const scene=new CommandScene();scene.render=function(cmds){return CommandScene.prototype.render.call(this,cmds);};
 win.__STORYWORLD_PHASE1__={controller:{state:{three:{commands:scene}}}};
 sb.drawEffect=function(e){const c=sb.ctx;if(Array.isArray(c.commands))c.commands.push(...(e.cmds||[]));return 'fx';};
 vm.createContext(sb);vm.runInContext(src,sb);const A=win.__STORYWORLD_FX_ALPHA_R1369__;try{A&&A.install();}catch(_){}
 return {A,sb,scene,win};}
const quad=(x0,y0,x1,y1)=>[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
let K=0;const img=(kind,id,sp,a=1,box=[0,0,10,10],extra={})=>({kind:'image',key:id+':'+(K++),owner:{kind,id},sourcePath:sp,points:quad(...box),clips:[],order:K,style:{globalAlpha:a},...extra});
const fill=(kind,id,a=1,box=[0,0,10,10],k='fill')=>({kind:k,key:id+':'+(K++),owner:{kind,id},paths:[{points:quad(...box),closed:true}],clips:[],order:K,style:{globalAlpha:a}});
const run=(L,cmds)=>{const r=L.scene.render(cmds);return {r,out:L.scene.got};};
const al=c=>c.style.globalAlpha;const near=(a,b)=>Math.abs(a-b)<1e-6;
// 화면 밖 멀리(몸 가림 규칙이 끼지 않게)
const FAR=[2000,2000,2010,2010];

{const L=load();ok(!!L.A&&typeof L.A.classify==='function'&&typeof L.A.inspect==='function','API 노출(classify·inspect)');}

// 1) 몸 위 겹침 ≤ .3
{const L=load();const C=[img('effect','r101:aura-back:hero','assets/r100/fx-c1-ground-ring.webp',1,FAR),img('effect','r62:passive-aura:hero:resonance','assets/auras-r62/resonance-petals.webp',.9,FAR),
  img('effect','r1358:brand:hero','assets/r1358/brand-sheet.webp',1,FAR),img('effect','r111:ego-front','assets/ego/x.webp',1,FAR),img('scene','scene','assets/r100/sig-aura-red.webp',1,FAR),img('effect','r1359:herohit:1','assets/r1359/d09-hero-hit.webp',1,FAR),
  img('effect','r571:aura-front:hero','assets/r571/buff.webp',.2,FAR)];
 const {r,out}=run(L,C);ok(r==='drawn','render 반환값 그대로');
 for(let i=0;i<6;i++)ok(al(out[i])<=.3+1e-9,'몸 위 겹침 ≤.3: '+C[i].owner.id+' '+C[i].sourcePath,al(out[i]));
 ok(near(al(out[6]),.2),'이미 .3 보다 옅은 오라는 그대로(올리지 않음)',al(out[6]));
 for(let i=0;i<6;i++)ok(L.A.classify(C[i])==='body','분류 body: '+C[i].owner.id,L.A.classify(C[i]));}

// 2) 적중 순간: 첫 .1초 ≤ .6, 그 뒤 ≤ .25 (엔진 drawEffect 효과는 e.age, 따로 그린 효과는 처음 본 게임 시각 기준)
{const L=load();const mk=age=>({type:'burst',age,life:.45,size:1,cmds:[img('scene','scene','assets/vfx/burst.webp',1,FAR)]});
 const cmds=[];const fake={globalAlpha:1,commands:cmds};L.sb.ctx=fake;
 L.sb.drawEffect(mk(.05));L.sb.drawEffect(mk(.3));L.sb.drawEffect({type:'slash',age:0,life:.3,cmds:[img('scene','scene','assets/vfx/slash.webp',.35,FAR)]});
 ok(cmds.length===3,'drawEffect 로 쌓인 명령 3개');
 const {out}=run(L,cmds);
 ok(al(out[0])<=.6+1e-9&&al(out[0])>.3,'적중 첫 .1초: ≤.6 (너무 사라지지도 않음 >.3)',al(out[0]));
 ok(al(out[1])<=.25+1e-9,'적중 .1초 뒤: ≤.25',al(out[1]));
 ok(near(al(out[2]),.35),'이미 옅은 적중은 그대로',al(out[2]));
 ok(L.A.classify(cmds[0])==='hit','burst 분류 hit');}
{const L=load();// 따로 그린 적중(반월·타격): 처음 본 시각부터 나이 계산
 const a=img('effect','r1353:crescent:7','assets/r1353/hwando-crescent.webp',1,FAR);
 L.sb.time=10;let o=run(L,[a]).out;ok(al(o[0])<=.6+1e-9&&al(o[0])>.3,'반월 처음 프레임 ≤.6',al(o[0]));
 L.sb.time=10.05;o=run(L,[{...a,style:{globalAlpha:1}}]).out;ok(al(o[0])<=.6+1e-9&&al(o[0])>.25,'반월 .05초 ≤.6',al(o[0]));
 L.sb.time=10.3;o=run(L,[{...a,style:{globalAlpha:1}}]).out;ok(al(o[0])<=.25+1e-9,'반월 .3초 ≤.25',al(o[0]));
 const b=img('effect','r1340:mob-strike:3','assets/r1340/stone-hit.webp',1,FAR);L.sb.time=20;o=run(L,[b]).out;ok(al(o[0])<=.6+1e-9,'근접몹 타격 첫 프레임 ≤.6',al(o[0]));
 ok(L.A.classify(b)==='hit','근접몹 타격 분류 hit');}
// 2-경계) 정확히 .1초는 아직 '처음' 구간, 감쇠는 .16초에 .25 도달
{const L=load();ok(near(L.A.hitCap(0),.6)&&near(L.A.hitCap(.1),.6),'hitCap(0)=hitCap(.1)=.6');ok(near(L.A.hitCap(.16),.25)&&near(L.A.hitCap(5),.25),'hitCap(.16)=.25, 오래돼도 .25');
 const m=L.A.hitCap(.13);ok(m<.6&&m>.25,'.1~.16초 사이는 부드럽게 줄어듦',m);ok(Number.isFinite(L.A.hitCap(NaN))&&L.A.hitCap(NaN)<=.6,'NaN 나이도 안전');}

// 3) 위험 범위: 범위 그림(테두리·예고 고리) ≤.7 로 또렷하게, 그 안에 선 몸 자리만 ≤.3 (몸 상자 구멍 클립으로 나눔). 선 ≤.7, 면 ≤.3
{const L=load();const met=img('hazard','r1229:meteor:3','assets/r1229/meteor-impact.webp',1,FAR),
  boss=img('effect','r1358:boss:sig:9','assets/r1358/leviathan-glass.webp',.9,FAR),warn=img('effect','r1287:ring:2','assets/r411/fx/boss-meteor.webp',1,FAR),
  ring=fill('effect','r105:field:2',1,FAR,'stroke'),pool=fill('effect','r105:field:3',1,FAR,'fill');
 const {out}=run(L,[met,boss,warn,ring,pool]);
 ok([met,boss,warn,ring].every(c=>L.A.classify(c)==='danger'),'메테오·보스 고유 스킬·예고 고리·보스 장판 분류 danger');
 ok(out.length===5,'몸이 안 겹치면 덧그림 없음',out.length);
 ok(al(out[0])<=.7+1e-9&&al(out[0])>=.6&&al(out[2])>=.6&&al(out[2])<=.7+1e-9,'몸 없는 위험 그림은 ≤.7 로 또렷하게(≥.6)',[al(out[0]),al(out[2])]);
 ok(al(out[1])<=.7+1e-9,'원래 .9 → ≤.7',al(out[1]));
 ok(al(out[3])<=.7+1e-9&&al(out[3])>=.6,'위험 선(stroke) ≤.7',al(out[3]));
 ok(al(out[4])<=.3+1e-9,'위험 면(fill) ≤.3',al(out[4]));}
{// 몹 둘(서로 겹침)이 메테오 착탄 그림 안에 섬: 그림은 몸 자리를 뚫고 ≤.7, 몸 자리엔 ≤.3 한 벌 — 겹친 몸은 구멍 하나로 합침
 const L=load({game:{room:{enemies:[{id:'m1',x:0,y:0,hp:10,radius:.4},{id:'m2',x:.1,y:0,hp:10,radius:.4}]},player:{x:50,y:50,hp:100,visible:true}}});
 const met=img('hazard','r1229:meteor:7','assets/r1229/meteor-impact.webp',1,[400,200,560,340]);
 const {out}=run(L,[met]);const main=out.find(c=>c.key===met.key),inn=out.find(c=>/r1369in/.test(c.key));
 ok(out.length===2&&!!inn,'몸 자리용 한 벌 더(2)',out.length);
 const cl=main.clips[main.clips.length-1];ok(cl&&cl.rule==='evenodd'&&cl.paths.length===2,'본 그림: 바깥 상자 + 합쳐진 몸 구멍 1개 evenodd',cl&&cl.paths.length);
 ok(al(main)<=.7+1e-9&&al(main)>=.6,'범위 그림 ≤.7 (가림 배율로 더 옅어지지 않음)',al(main));
 ok(al(inn)<=.3+1e-9&&al(inn)>0,'몸 자리 ≤.3',al(inn));
 const ic=inn.clips[inn.clips.length-1];ok(ic.paths.length===1&&ic.rule==='nonzero','몸 자리 클립 = 구멍 상자',ic);
 const h=ic.paths[0].points;ok(h.every(p=>p[0]>=400-1e-9&&p[0]<=560+1e-9&&p[1]>=200-1e-9&&p[1]<=340+1e-9),'구멍은 그림 상자 안으로 잘림');
 ok(L.A.classify(inn)===null,'덧그린 한 벌은 다시 분류하지 않음');}
// 4) 배경: ≤ .35, 캐릭터(몸) 뒤로
{const L=load();const body=img('enemy','enemy:1','assets/mobs/x.webp',1,[100,100,140,180],{spatialRole:'body',order:50});
 const enr=img('effect','r1357:enrage:boss1','assets/r1357/d07-crimson-flame.webp',1,FAR,{order:90}),rip=img('effect','r1222:floor-ripple:2','assets/r1222/swamp-ripple.webp',.8,FAR,{order:91});
 const {out}=run(L,[body,enr,rip]);const e=out.find(c=>c.owner.id==='r1357:enrage:boss1'||c.key===enr.key),r=out.find(c=>c.key===rip.key);
 ok(L.A.classify(enr)==='background'&&L.A.classify(rip)==='background','광폭화 불길·바닥 물결 분류 background');
 ok(al(e)<=.35+1e-9&&al(r)<=.35+1e-9,'배경 ≤.35',[al(e),al(r)]);
 ok(e.owner.kind==='scene'&&e.order<50&&r.owner.kind==='scene'&&r.order<50,'배경은 첫 몸 그림보다 앞 순서의 배경 패스로(캐릭터 뒤)',[e.owner.kind,e.order,r.order]);}

// 5) 몸 가림 40% 넘으면 더 옅게(경계 40% 정확히는 그대로)
{const L=load({game:{room:{enemies:[{id:'m1',x:0,y:0,hp:10,radius:.4}]},player:{x:50,y:50,hp:100,visible:true}}});
 // 몹 몸 상자: 중심 (480,300) 높이 60 → 대략 x 462~498, y 240~300
 const big=img('effect','r999:skill:1','assets/r999/cast.webp',.5,[440,220,520,320]);// 몸 전체 덮음
 const small=img('effect','r999:skill:2','assets/r999/cast.webp',.5,[440,220,470,250]);// 귀퉁이만
 let {out}=run(L,[big,small]);ok(al(out[0])<.5-1e-6,'몸 40% 넘게 가린 이펙트는 더 옅게',al(out[0]));ok(near(al(out[1]),.5),'조금만 겹친 이펙트는 그대로',al(out[1]));
 const cov=L.A.coverOf({x0:0,y0:0,x1:10,y1:10},[{x0:0,y0:0,x1:4,y1:10}]);ok(Math.abs(cov-.4)<.07,'가림 비율 계산(40%)',cov);
 ok(near(L.A.coverFactor(.4),1)&&L.A.coverFactor(.41)<1&&L.A.coverFactor(1)>=.45&&L.A.coverFactor(1)<=.55,'가림 배율: 40% 그대로, 넘으면 줄고 100% 약 .5',[L.A.coverFactor(.41),L.A.coverFactor(1)]);
 ok(L.A.coverFactor(NaN)===1,'NaN 가림은 그대로');}

// 제외: 그림자·영웅/몹 몸·조형물·바닥·투사체·글자·R448 실루엣·발 접촉
{const L=load();const keep=[img('effect','r80:shadow:r80:dist00:tree','assets/r80/tree.webp',.21,FAR),img('enemy','enemy:1','assets/mobs/a.webp',1,FAR,{spatialRole:'body'}),img('hero','hero:1','assets/heroes/h.webp',1,FAR,{spatialRole:'body'}),
  img('prop','prop:1','assets/props/p.webp',1,FAR),img('ground','ground','assets/g.webp',1,FAR),img('projectile','proj:1','assets/proj/bolt.webp',1,FAR),
  {kind:'text',key:'t'+(K++),owner:{kind:'effect',id:'dmg'},text:'12',point:[0,0],matrix:[1,0,0,1],clips:[],order:1,style:{globalAlpha:1}},
  img('effect','r448:ghost:hero','assets/heroes/h.webp',.58,FAR,{owner:{kind:'effect',id:'r448:ghost:hero',r448:true}}),fill('contact','enemy:1',.58,FAR),img('exits','r1:portal','assets/props/portal.webp',.82,FAR)];
 const {out}=run(L,keep);for(let i=0;i<keep.length;i++)ok(near(al(out[i]),al(keep[i]))&&out[i].owner.kind===keep[i].owner.kind,'그대로: '+keep[i].owner.kind+' '+keep[i].owner.id,al(out[i]));
 ok(out.length===keep.length,'명령 수 그대로');}

// 헤드리스 실측에서 찾은 회귀(R1369 점검): 정예 몹 표식 고리는 몸 위 겹침, 발 접촉 그림자 채우기는 제외
{const L=load();const rank=img('effect','r300:rank:dist06:ward-champion-r300:dist06-c2','r300fx:ring:1.0.0:0.5.5',1,FAR),cont=fill('effect','r521:contact:r521:ep1b03:3:4',.42,FAR);
 ok(L.A.classify(rank)==='body','정예 표식(rank) 고리 = body',L.A.classify(rank));ok(L.A.classify(cont)===null,'r521 발 접촉 채우기 = 제외',L.A.classify(cont));
 ok(L.A.classify(img('effect','blood-contact-r52','assets/r52/blood.webp',1,FAR))==='hit','핏자국 적중(blood-contact) 은 계속 hit');}
// 헤드리스 실측 회귀 2: r350·r448 표시는 영웅 이펙트(피 튐·회복·EGO 적중)에도 붙음 → 표시가 아니라 실루엣 id 로만 뺀다
{const L=load();const heal=img('effect','r438:hero:hero-healing:1.6','assets/r438/fx/hero-healing.webp',.8,FAR,{owner:{kind:'effect',id:'r438:hero:hero-healing:1.6',r350:true}}),
  blood=img('effect','r350:blood:3:splash:2','assets/r190/blood/blood-splash.webp',1,FAR,{owner:{kind:'effect',id:'r350:blood:3:splash:2',r350:true,r350blood:true}}),
  ego=img('effect','r1139b:impact:2','assets/r1139/ego-impact.webp',1,FAR,{owner:{kind:'effect',id:'r1139b:impact:2',r350:true,r448:true}}),
  ghost=img('effect','r350:ghost:hero:1','assets/heroes/h.webp',.4,FAR,{owner:{kind:'effect',id:'r350:ghost:hero:1',r350:true}}),
  over=img('effect','r448:over:prop:7','assets/props/tree.webp',.86,FAR,{owner:{kind:'effect',id:'r448:over:prop:7',r350:true,r448:true}});
 ok(L.A.classify(heal)==='body','R438 영웅 회복(r350 표시) = body',L.A.classify(heal));ok(L.A.classify(blood)==='hit','R350 영웅 피 튐 = hit',L.A.classify(blood));ok(L.A.classify(ego)==='hit','EGO 적중(r448 표시) = hit',L.A.classify(ego));
 ok(L.A.classify(ghost)===null&&L.A.classify(over)===null,'영웅 실루엣·조형물 덮개는 계속 제외');}
// main 병합 뒤(묶음 11) 실제 이름: R1346/R1358 보스 고유 스킬(중간보스 시트 이름엔 boss 가 없음)·R1383 뿌리 속박·R1345 위장 = danger, R1357 광폭화 = background
{const L=load();const C=[img('effect','r1346:b12:41.2:3.10:4.00','assets/r1358/c101-mid-firewall-flames.webp',1,FAR),img('effect','r1346:m3:12:1.00:2.00','assets/r1358/c105-mid-bio-tendrils.webp',1,FAR),
  img('effect','r1383:bind:3','assets/r1383/root-bind24.webp',1,FAR),img('effect','r1345:gut:1','assets/r1345/gut-wall12.webp',1,FAR)];
 for(const c of C)ok(L.A.classify(c)==='danger','danger: '+c.sourcePath,L.A.classify(c));
 ok(L.A.classify(img('scene','scene','assets/r1357/boss-enrage-aura-d07-16.webp',1,FAR))==='background','R1357 광폭화 오라 = background');}
// 같은 명령 배열을 두 번 그려도 한 번만(엔진이 frame 재사용)
{const L=load();const c=[img('effect','r101:aura-back:hero','assets/r100/fx-c1-ground-ring.webp',1,FAR),img('hazard','r1229:meteor:4','assets/r1229/meteor-impact.webp',1,FAR)];
 L.scene.render(c);const n1=c.length,a1=al(c[0]);L.scene.render(c);ok(c.length===n1&&near(al(c[0]),a1),'두 번 그려도 한 번만 처리',[n1,c.length]);}
// 끄기·NaN·스타일 없음·설정 슬라이더(R1271) 배율
{const L=load({pref:{on:false}});const c=img('effect','r101:aura-back:hero','assets/r100/fx-c1-ground-ring.webp',1,FAR);const {out}=run(L,[c]);ok(al(out[0])===1,'끄기 설정이면 예전 그대로');}
{const L=load();const c=img('effect','r101:aura-back:hero','x.webp',NaN,FAR);const d={...img('effect','r101:aura-front:hero','x.webp',1,FAR)};delete d.style;
 const {out}=run(L,[c,d]);ok(Number.isFinite(al(out[0]))&&al(out[0])<=.3,'NaN 알파도 유한값·규칙 적용',al(out[0]));ok(out[1].style&&al(out[1])<=.3,'style 없는 명령도 처리');}
{const L=load({r1271:{level:()=>1}});const c=img('effect','r101:aura-back:hero','x.webp',1,FAR);const {out}=run(L,[c]);ok(al(out[0])>.3&&al(out[0])<=.75,'적중·시전 불투명도 슬라이더 100%(예전)면 규칙값도 함께 올라감(상한 있음)',al(out[0]));}
{const L=load({r1271:{level:()=>.2}});const c=img('effect','r101:aura-back:hero','x.webp',1,FAR);const {out}=run(L,[c]);ok(al(out[0])<.3&&al(out[0])>=.1,'슬라이더를 낮추면 더 옅게',al(out[0]));}
// R1271 의 drawEffect .4 곱은 R1369 가 켜져 있으면 겹치지 않게 비켜 준다(대체)
{const L=load();ok(typeof L.A.active==='function'&&L.A.active()===true,'active() 켜짐 알림');
 const r1271=rd('client-source/hit-translucent-r1271.js');ok(/__STORYWORLD_FX_ALPHA_R1369__/.test(r1271),'R1271 이 R1369 켜짐을 보고 적중 .4 곱을 건너뜀(규칙 대체)');}
// 감싸기: 인스턴스 render·프로토타입 render 한 번만, 다시 install 해도 두 번 감싸지 않음
{const L=load();const f=L.scene.render;L.A.install();L.A.install();ok(L.scene.render===f,'install 두 번 불러도 다시 감싸지 않음');
 const c=[img('effect','r101:aura-back:hero','x.webp',1,FAR)];L.scene.render(c);ok(L.A.inspect().stats.frames>=1,'inspect 통계');}
console.log('R1369 CPU 검사 통과',n);
