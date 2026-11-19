// R1225 CPU check (사용자 2026-11-19 10:32Z "스토리모드 모든 몹과 보스들 현재 체력 난이도 상관없이 모든데미지 반감해서 받게해줘"):
//  스토리 모드(스토리 사몽 세계 포함)에서 일반 몹·보스가 받는 모든 피해 ×0.5 — 고정·확률 패시브·최대 체력 비례 피해 모두.
//  일반 몹 '즉사'(남은 체력 이상으로 지우는 효과: 페르소나 쌍성 소멸 레이저·사몽선·사몽 궁극기·사몽 십자가)는 피해가 아니라 즉사라 그대로.
//  사몽 에피소드·무한생존·영화 모드는 그대로. 협동(멀티) 체력 배수·광폭화 등 다른 배율과는 곱.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
const FILE='story-half-dmg-r1225.js';
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});const near=(a,b,t=1e-9)=>Math.abs(a-b)<=t;
const read=p=>{try{return fs.readFileSync(p,'utf8');}catch(_){return null;}};
const src=read(path.join(R,'client-source',FILE));
ok('overlay source exists',!!src);
ok('runtime copy matches',src!==null&&read(path.join(R,'runtime-text',FILE))===src);
const html=read(path.join(R,'runtime-text','index.html'))||'';
ok('index.html loads overlay once',(html.match(/<script src="\.\/story-half-dmg-r1225\.js"><\/script>/g)||[]).length===1);
ok('public verify expects overlay',/story-half-dmg-r1225\.js/.test(read(path.join(ROOT,'scripts','verify-r96-public.py'))||''));
ok('CI workflow runs this check',/qa\/r1225\/r1225-cpu-check\.cjs/.test(read(path.join(ROOT,'.github','workflows','pages.yml'))||''));
ok('runtime manifest lists overlay',/story-half-dmg-r1225\.js/.test(read(path.join(R,'runtime-manifest.json'))||''));

function env(opt={}){
 const store={};if(opt.pref)store['storyworld.r1225.half']=JSON.stringify(opt.pref);
 const sb={console,Math,JSON,Set,Map,WeakMap,Number,String,Object,Array,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},window:{}};
 if(opt.survival)sb.window.__STORYWORLD_SURVIVAL_R600__={active:()=>true};
 if(opt.cinema)sb.window.__STORYWORLD_CINEMA_MODE_R370__={prefs:()=>({on:true})};
 if(opt.coop)sb.window.__STORYWORLD_COOP_SIM_R62__={mode:()=>'host'};
 vm.createContext(sb);
 vm.runInContext(`var started=true,loading=false,modal=null,layer=${JSON.stringify(opt.layer||'STORY')};var room=${JSON.stringify(opt.room||{id:'dist03',enemies:[]})};
  var applied=[];function hitEnemy(e,v,src){if(!e||e.hp<=0||!(v>0)||!Number.isFinite(v))return false;const a=Math.min(e.hp,v);e.hp-=a;applied.push(a);return true;}`,sb);
 // 다른 층의 배율(예: 광폭화 ÷1.66) — 먼저 감싼 안쪽 층
 if(opt.inner)vm.runInContext(`{const b=hitEnemy;hitEnemy=function(e,v,...a){return b.call(this,e,v/${opt.inner},...a);};}`,sb);
 if(src)vm.runInContext(src,sb);
 if(opt.twice&&src)vm.runInContext(src,sb);
 sb.hit=(e,v,s)=>vm.runInContext('hitEnemy',sb)(e,v,s);
 sb.last=()=>vm.runInContext('applied[applied.length-1]',sb);
 sb.API=sb.window.__STORYWORLD_STORY_HALF_DMG_R1225__;
 return sb;}
const mob=o=>({id:'m',hp:1000,maxHp:1000,...o});
const boss=o=>({id:'b',boss:true,hp:10000,maxHp:10000,...o});

{const g=env();ok('API exposed with factor 0.5',g.API&&g.API.FACTOR===.5,g.API&&g.API.FACTOR);}
// 정상 경로
{const g=env(),e=mob();g.hit(e,100,{kind:'hero-basic'});ok('story: normal mob takes 50 from 100',near(e.hp,950),e.hp);}
{const g=env(),e=boss();g.hit(e,400,{kind:'hero-skill'});ok('story: boss takes 200 from 400',near(e.hp,9800),e.hp);}
{const g=env(),e=mob({midboss:true});g.hit(e,80);ok('story: midboss half, no source object',near(e.hp,960),e.hp);}
{const g=env(),e=mob({persona:true});g.hit(e,60);ok('story: persona-class boss half',near(e.hp,970),e.hp);}
// 체력 비례(쌍성 소멸 보스 7%) 도 절반 → 3.5%
{const g=env(),e=boss();g.hit(e,e.maxHp*.07,{kind:'r1144-laser',r1144:'laser'});ok('story: twin-star laser on boss 7% → 3.5% of max HP',near(e.hp,10000-350),e.hp);}
// 확률 패시브(예: R946 천체 공명) 도 절반
{const g=env(),e=mob();g.hit(e,90,{kind:'r946-violet',r946:true});ok('story: proc passive damage halved',near(e.hp,955),e.hp);}
// 즉사(일반 몹) 는 그대로
for(const kind of ['r1144-laser','hero-samong-storm-r114','hero-samong-storm-r75','hero-samong-ultimate-r139','hero-samong-cross-r425']){
 const g=env(),e=mob({hp:700});g.hit(e,e.hp+1,{kind});ok('story: instakill '+kind+' still kills a normal mob',e.hp<=0,e.hp);}
{const g=env(),e=mob({hp:700});g.hit(e,700+1000,{kind:'hero-samong-ultimate-r139'});ok('story: samong ult hp+maxHp instakill kills',e.hp<=0,e.hp);}
// 즉사 종류라도 보스엔 반감(보스는 즉사가 아니라 계수 피해)
{const g=env(),e=boss();g.hit(e,500,{kind:'hero-samong-ultimate-r139'});ok('story: samong ult on boss halved (not instakill)',near(e.hp,9750),e.hp);}
// 경계: 즉사 종류가 아닌 큰 한 방(남은 체력 이상)은 반감 → 살아남을 수 있음
{const g=env(),e=mob({hp:30});g.hit(e,40,{kind:'hero-basic'});ok('story: lethal-looking normal hit is halved (30hp, 40 → 20)',near(e.hp,10),e.hp);}
{const g=env(),e=mob({hp:30});g.hit(e,60,{kind:'hero-basic'});ok('story: 60 on 30hp still kills (30 after half)',e.hp<=0,e.hp);}
// 경계: 0·음수·NaN·Infinity 는 손대지 않고 원래 거절
{const g=env(),e=mob();const r0=g.hit(e,0),rn=g.hit(e,-5),rN=g.hit(e,NaN);ok('story: 0/negative/NaN rejected unchanged',r0===false&&rn===false&&rN===false&&e.hp===1000,[r0,rn,rN,e.hp]);}
{const g=env(),e=mob({hp:0});ok('story: dead enemy rejected',g.hit(e,100)===false);}
// 사몽 세계(스토리 DREAM 층, 에피소드 방 아님) 포함
{const g=env({layer:'DREAM',room:{id:'dist04',enemies:[]}}),e=mob();g.hit(e,100);ok('story samong world (DREAM layer) halved',near(e.hp,950),e.hp);}
// 제외 모드
{const g=env({room:{id:'sz01-a',samongR103:{zone:'sz01'},enemies:[]},layer:'DREAM'}),e=mob();g.hit(e,100);ok('samong episode room (samongR103) unchanged',near(e.hp,900),e.hp);}
{const g=env({room:{id:'sz02',samongR115:true,enemies:[]}}),e=mob();g.hit(e,100);ok('samong episode zone (samongR115) unchanged',near(e.hp,900),e.hp);}
{const g=env({room:{id:'x',exploration:{type:'r103-samong'},enemies:[]}}),e=mob();g.hit(e,100);ok('samong episode map (r103-samong) unchanged',near(e.hp,900),e.hp);}
{const g=env({survival:true}),e=boss();g.hit(e,400);ok('survival unchanged',near(e.hp,9600),e.hp);}
{const g=env({room:{id:'dist03',survivalR600:true,enemies:[]}}),e=mob();g.hit(e,100);ok('survival room flag unchanged',near(e.hp,900),e.hp);}
{const g=env(),e=mob({survivalR600:true});g.hit(e,100);ok('survival-spawned enemy unchanged',near(e.hp,900),e.hp);}
{const g=env({cinema:true}),e=mob();g.hit(e,100);ok('cinema mode unchanged',near(e.hp,900),e.hp);}
// 협동(멀티) 스토리도 반감
{const g=env({coop:true}),e=mob();g.hit(e,100);ok('story coop also halved',near(e.hp,950),e.hp);}
// 다른 배율과 곱(광폭화 ÷1.66)
{const g=env({inner:1.66}),e=boss();g.hit(e,332);ok('multiplies with enrage ÷1.66 → 332×0.5/1.66 = 100',near(e.hp,9900,1e-6),e.hp);}
// 두 번 불려도 한 번만 감쌈
{const g=env({twice:true}),e=mob();g.hit(e,100);ok('loaded twice → still ×0.5 once',near(e.hp,950),e.hp);}
// 설정으로 끄기
{const g=env({pref:{on:false}}),e=mob();g.hit(e,100);ok('pref off → unchanged',near(e.hp,900),e.hp);}
{const g=env(),e=mob();g.API&&g.API.set({on:false});g.hit(e,100);g.API&&g.API.set({on:true});g.hit(e,100);ok('API set toggles (100 then 50)',near(e.hp,850),e.hp);}
// 통계
{const g=env(),e=mob();g.hit(e,100);g.hit(e,e.hp+1,{kind:'r1144-laser'});const s=g.API?g.API.inspect().stats:{};ok('stats: halved 1, instakill kept 1',s.halved===1&&s.instakill===1,s);}

const fails=checks.filter(c=>!c.pass);
for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' :: '+JSON.stringify(c.detail)));
console.log(`R1225: ${checks.length-fails.length}/${checks.length} passed`);
if(fails.length)process.exit(1);
