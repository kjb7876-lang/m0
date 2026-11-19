// R1235 미카엘라 기본탄 적중 그림 정리 CPU 검사 (사용자 2026-11-19 11:50Z "미카엘라적에게 공격적중시 … 일정공격이 나왔다가 사라지기를 빠르게 반복해 이거 이미지 번잡스럽지 않게 개선",
//  11:34Z "미카엘라 영웅 이펙트중 아직 프레임애니메이션 아닌 이펙트는 프레임애니메이션으로 개선적용")
//  헤드리스 측정(qa/r1235/hitlog.mjs): 기본탄 한 발 적중마다 한 장짜리 그림 burst(0.2초)·e568HeroImpact(0.24초) + R912 하트 적중 시트(6칸 0.43초)가 겹쳐 0.47초마다 번쩍임.
//  node r96/qa/r1235/r1235-cpu-check.cjs   — 실제 화면 측정은 r1235-browser.mjs(헤드리스)
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS',m);};
const rd=f=>fs.readFileSync(path.join(R,f),'utf8');
ok(rd('client-source/michaela-hitfx-r1235.js')===rd('runtime-text/michaela-hitfx-r1235.js'),'runtime-text 사본과 같음');
ok(/node r96\/qa\/r1235\/r1235-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
ok(/<script src="\.\/hunter-aim-r1102\.js"><\/script>\n(?:<script src="\.\/michaela-shot-r1232\.js"><\/script>\n)?<script src="\.\/michaela-hitfx-r1235\.js"><\/script>/.test(rd('runtime-text/index.html')),'index.html 태그(헌터 R1102 뒤)');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'michaela-hitfx-r1235.js'"),'공개 확인 목록');
const src=rd('client-source/michaela-hitfx-r1235.js');
function load(pref,{hero='michaela'}={}){const win={};const sb={window:win,localStorage:{getItem:k=>k==='storyworld.r1235.michaelaHitFx'&&pref?JSON.stringify(pref):null,setItem(){}},Math,Number,JSON,Object,Array,Set,Map,WeakMap,String,isFinite,console,
  document:{readyState:'complete'},addEventListener(){},player:{hero,samong:0},time:0,effects:[]};
 sb.fx=function(type,x,y,o){const e={type,x,y,life:o?.life??.3,age:0,...(o||{})};sb.effects.push(e);return e;};
 /* 엔진 적중: 그 안에서 한 장짜리 burst·e568HeroImpact 를 만들고, R912 가 감싸 하트 시트 적중(r912hit)을 더한다 */
 sb.hitEnemy=function(e,v,s){if(e.boom)throw new Error('boom');sb.fx('burst',e.x,e.y,{life:.2,asset:'assets/vfx/generated/v300/burst-impact.webp'});sb.fx('e568HeroImpact',e.x,e.y,{life:.24,asset:'assets/vfx/generated/v31307/hero-impacts/michaela-seraph-spark.webp'});sb.fx('damageText',e.x,e.y,{life:.8});if(s&&s.friendly)sb.fx('r912hit',e.x,e.y,{life:6/14});e.hp-=v;return true;};
 vm.createContext(sb);vm.runInContext(src,sb);return{A:win.__STORYWORLD_MICHAELA_HITFX_R1235__,sb};}
const shot=(o={})=>({friendly:true,owner:'hero',asset:'assets/vfx/heroes/michaela-a.webp',r160Basic:true,attackKind9:'basic',...o});
const types=sb=>sb.effects.map(e=>e.type);
{const {A,sb}=load(null);const e={x:1,y:2,hp:100};const out=sb.hitEnemy(e,10,shot());
 ok(out===true&&e.hp===90,'피해·반환값 그대로');
 ok(!types(sb).includes('burst')&&!types(sb).includes('e568HeroImpact'),'기본탄 적중: 한 장짜리 burst·e568HeroImpact 안 만듦',types(sb));
 ok(types(sb).includes('r912hit'),'하트 적중 프레임 시트(r912hit)는 남김',types(sb));
 ok(types(sb).includes('damageText'),'다른 효과(피해 숫자 등)는 그대로',types(sb));
 ok(A.inspect().stats.dropped===2,'뺀 수 기록',A.inspect().stats);}
// 0.47초마다 9발: 한 장짜리 그림이 하나도 생기지 않음(번쩍임 없음)
{const {sb}=load(null);const e={x:1,y:2,hp:1e6};for(let i=0;i<9;i++){sb.time=i*.47;sb.hitEnemy(e,1,shot());}ok(sb.effects.filter(x=>x.type==='burst'||x.type==='e568HeroImpact').length===0&&sb.effects.filter(x=>x.type==='r912hit').length===9,'연속 9발에도 한 장짜리 번쩍임 0, 하트 시트 9');}
// 하트 패시브(R948) 적중: 같은 한 장짜리 둘을 뺌(헤드리스에서 오르골탑 적중에 남은 것을 찾음)
{const {sb}=load(null);sb.hitEnemy({x:0,y:0,hp:9},1,{kind:'r948-tower',friendly:true,owner:'hero',sourceHero:'michaela',r948:true});ok(!types(sb).includes('burst')&&!types(sb).includes('e568HeroImpact'),'하트 패시브 적중: 한 장짜리 둘 안 만듦',types(sb));}
{const {sb}=load(null);sb.hitEnemy({x:0,y:0,hp:9},1,{kind:'r949-epoch',friendly:true,owner:'hero',sourceHero:'michaela'});ok(types(sb).includes('burst'),'다른 패시브 적중은 그대로');}
// 경계·회귀
{const {sb}=load(null);sb.hitEnemy({x:0,y:0,hp:9},1,shot({asset:'assets/vfx/heroes/hunter-a.webp'}));ok(types(sb).includes('burst'),'다른 영웅 탄은 그대로');}
{const {sb}=load(null);sb.hitEnemy({x:0,y:0,hp:9},1,shot({r160Basic:false,attackKind9:'skill'}));ok(types(sb).includes('burst')&&types(sb).includes('e568HeroImpact'),'스킬 탄은 그대로(스킬 이펙트는 따로)');}
{const {sb}=load(null);sb.hitEnemy({x:0,y:0,hp:9},1,{kind:'melee'});ok(types(sb).includes('burst'),'탄이 아닌 적중은 그대로');}
{const {sb}=load(null,{hero:'hunter'});sb.hitEnemy({x:0,y:0,hp:9},1,shot());ok(types(sb).includes('burst'),'조종 영웅이 미카엘라가 아니면 그대로(EGO 소환 등)');}
{const {sb}=load({on:false});sb.hitEnemy({x:0,y:0,hp:9},1,shot());ok(types(sb).includes('burst')&&types(sb).includes('e568HeroImpact'),'끄면(storyworld.r1235.michaelaHitFx on:false) 예전 그대로');}
{const {sb}=load(null);sb.hitEnemy({x:0,y:0,hp:9},1,shot());sb.fx('burst',0,0,{});ok(sb.effects.filter(x=>x.type==='burst').length===1,'적중 밖에서 만든 burst 는 그대로(표시가 새지 않음)');}
{const {sb}=load(null);let threw=false;try{sb.hitEnemy({boom:true,x:0,y:0,hp:1},1,shot());}catch(_){threw=true;}sb.fx('burst',0,0,{});ok(threw&&types(sb).includes('burst'),'안쪽 적중이 오류를 내도 표시가 남지 않음(뒤 burst 그대로)');}
console.log(JSON.stringify({passed:n}));
