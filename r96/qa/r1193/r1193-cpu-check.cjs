// R1193 CPU 검사(헤드리스 브라우저 아님): 꿈 층(스토리 사몽) R248 임시 도트 몹 12종 → 스토리 층과 같은 칠한 그림, R385 화염술사·호위병 꿈 층,
//  R1177 칠한 pixelfx 칸 모든 모드. 사용자 2026-11-19 전수조사 뒤 "응"(코디네이터 전달: 코드로 처리할 꿈 층 몹 12종 + 두 결정 + 도트 이펙트 9종 모든 모드).
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const CS=f=>fs.readFileSync(path.join(root,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(root,'runtime-text',f),'utf8');
const FILE='dream-mob-art-r1193.js';const src=CS(FILE);
for(const f of [FILE,'mob-moves-r385.js','samong-pixel-art-r1177.js'])assert.strictEqual(CS(f),RT(f),f);ok('client-source and runtime copies agree');
const html=RT('index.html');assert(/<script src="\.\/samong-pixel-art-r1177\.js"><\/script>\n<script src="\.\/dream-mob-art-r1193\.js"><\/script>\n/.test(html));ok('index.html tag on its own line right after R1177');
assert(fs.readFileSync(path.join(root,'..','scripts','verify-r96-public.py'),'utf8').includes("'dream-mob-art-r1193.js'"));
assert(fs.readFileSync(path.join(root,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r1193/r1193-cpu-check.cjs'));
const man=JSON.parse(fs.readFileSync(path.join(root,'runtime-inputs.json'),'utf8'));assert(JSON.stringify(man).includes(FILE));ok('verify list, pages.yml, runtime-inputs');
// 표 줄이 실제 index.json 에 있고 그림 파일이 있다
const site=f=>path.join(root,'hospital-three-pc','site',f);const idx={r380:'assets/r380/mobs/index.json',r374:'assets/r374/mobs/index.json'};
const asset=f=>{for(const p of [path.join(root,'..',f),path.join(root,f),site(f)])if(fs.existsSync(p))return p;return null;};
const ctx0={window:{},localStorage:{getItem:()=>null,setItem(){}},document:{readyState:'complete',addEventListener(){}},setInterval(){},fetch:undefined};
vm.createContext(ctx0);vm.runInContext(src,ctx0);const API=ctx0.window.__STORYWORLD_DREAM_MOB_ART_R1193__;assert(API&&/R1193/.test(API.revision));
assert.strictEqual(API.map.length,11);const names=API.map.map(r=>r[0]);
for(const nm of ['재 나방','되살아난 방패동료','치료거부의 가면','육망성의 흑마술 실험체','기억이주 연결자','이동문 공허잔영','최종문 공명기사','학대기록 공허체','관리자 추적견','역전기록 수집가','얼굴 없는 남자의 박수'])assert(names.includes(nm),nm);
for(const nm of ['보라검 부활자','갈망의 도시짐승','미뤄 둔 시간의 형상','칼날과 유리 조각','인간의 뇌를 닮은 투명 연산 장치','중앙이주 공명기사','시간핵의 명령 잔류','포구 검은 안개'])assert(!names.includes(nm),'Dots 몫은 표에 없음 '+nm);
ok('11 name rows (+ R385 화염술사 = 12 code fixes); Dots CX-0161DR eight are not here');
const runtimeInputs=fs.readFileSync(path.join(root,'runtime-inputs.json'),'utf8');
for(const [nm,k,id] of API.map){if(k==='r208')continue;const ip=asset(idx[k]);if(!ip){assert(runtimeInputs.includes(idx[k]),'index listed '+idx[k]);continue;}
 const j=JSON.parse(fs.readFileSync(ip,'utf8'));const m=j.mobs.find(x=>x.id===id);assert(m,'row '+id);assert.strictEqual(m.actor.layer,'STORY',id);
 assert(m.cell&&m.pivot&&m.move?.length&&m.attack?.length&&m.path,'row fields '+id);assert(runtimeInputs.includes(m.path)||asset(m.path),'art present '+m.path);}
ok('every mapped row exists in the story table with cell/pivot/move/attack/path');
// pick: 꿈 층에서만, 사몽 에피소드·보스·탑 제외, 기본 이름(증원·우두머리·번호) 무시
{const row={id:'reborn-shieldmate-v4',path:'assets/r380/mobs/reborn-shieldmate-v4.webp',cell:[256,256],pivot:[128,240],move:[0],attack:[1]};
 const sb={window:{},localStorage:{getItem:()=>null,setItem(){}},document:{readyState:'complete',addEventListener(){}},setInterval(){},layer:'DREAM',
  fetch:async u=>({ok:true,json:async()=>({mobs:u.includes('r380')?[row]:[]})})};vm.createContext(sb);vm.runInContext(src,sb);await0();
 async function await0(){}
 setTimeout(()=>{const P=sb.window.__STORYWORLD_DREAM_MOB_ART_R1193__;
  assert(P.pick({name:'되살아난 방패동료 증원'}),'dream reinforcement');assert(P.pick({name:'되살아난 방패동료 우두머리'}),'dream leader');
  assert(!P.pick({name:'되살아난 방패동료',boss:true}),'boss');assert(!P.pick({name:'되살아난 방패동료',samongR103:'S-01'}),'samong episode');assert(!P.pick({name:'되살아난 방패동료',r170Tower:true}),'tower');
  assert(!P.pick({name:'보라검 부활자'}),'Dots row');sb.layer='STORY';assert(!P.pick({name:'되살아난 방패동료'}),'story layer untouched');sb.layer='DREAM';
  P.set({on:false});assert(!P.pick({name:'되살아난 방패동료'}),'off');P.set({on:true});
  // R380 assign 감싸기: R248 이 묻는 window 객체가 꿈 층 대상에 줄을 돌려주고, 나머지는 원래 assign
  const orig={assign:e=>e.name==='x'?{id:'orig'}:null,frameOf:(e,m,id)=>({path:m.path,id})};sb.window.__STORYWORLD_APPROVED_MOBS_R380__=Object.freeze(orig);
  sb.window.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({frameFor:(e,f)=>f});sb.readyImage=p=>({image:{src:p}});P.install();
  const A=sb.window.__STORYWORLD_APPROVED_MOBS_R380__;assert.strictEqual(A.assign({name:'되살아난 방패동료'}).id,'reborn-shieldmate-v4');assert.strictEqual(A.assign({name:'x'}).id,'orig');assert.strictEqual(A.assign({name:'y'}),null);
  const F=sb.window.__STORYWORLD_STORY_COMBAT_R54__;assert.strictEqual(F.frameFor({name:'되살아난 방패동료'},'fb').path,row.path);assert.strictEqual(F.frameFor({name:'유리 망령'},'fb'),'fb');
  P.install();assert.strictEqual(sb.window.__STORYWORLD_APPROVED_MOBS_R380__,A,'install idempotent');
  sb.layer='STORY';assert.strictEqual(F.frameFor({name:'되살아난 방패동료'},'fb'),'fb');assert.strictEqual(P.inspect().stats.errors,0);
  ok('pick only in DREAM (not episodes/boss/tower/Dots rows/story), R380 assign wrap for R248 yield, frameFor wrap draws story row, idempotent, no errors');
  // R385: 꿈 층은 dream 줄 두 개만
  const r385=CS('mob-moves-r385.js');assert(r385.includes("const DREAM_KINDS=k=>(k[0]==='dist06'&&k[3]==='검은기둥 주문사')||(k[0]==='dist05'&&k[3]==='검은기둥 가고일 수호자');"));
  assert(r385.includes("KINDS.filter(k=>k[0]===id&&(!dreamL||DREAM_KINDS(k)))")&&r385.includes('if(id===z&&!dreamL)'));ok('R385: only the 화염술사·호위병 rows run in DREAM; renames/atlas rows stay story-only');
  // R1177: 모든 모드
  const r1177=CS('samong-pixel-art-r1177.js');assert(r1177.includes("ep=prefs.on&&(isEpisode(z)||prefs.everywhere!==false)")&&r1177.includes("if(!isEpisode(zoneOf(r))&&prefs.everywhere===false)return null;"));
  ok('R1177 painted pixelfx rows apply in every mode by default (switch everywhere:false keeps the old episode-only path)');
  console.log(`\nR1193 CPU ${n}/${n}`);},30);}
