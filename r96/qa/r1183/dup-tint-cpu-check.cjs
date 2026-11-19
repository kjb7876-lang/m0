// R1183 실패 먼저: 중복 몹(전수조사 2-A 다른 이름 같은 그림 6쌍, 2-B 스토리 그림이 사몽 쪽에 그대로 6건)의 '새로 그릴 쪽'만 몸 그림에 색조를 덧씌운다.
// 사용자 2026-11-19 "중복나오는몹은 닷츠에게 요청하고 어려우면 코드로 색이라도 바꿔". Dots CX-0163DU 그림이 오기 전 임시.
// 검사: ① 대상 몹 몸 그림 drawImage 에만 필터(원래 필터 뒤에 이어 붙임) ② 짝(그대로 둘 몹)·다른 구역·체력 줄 이미지·이펙트는 그대로 ③ 그린 뒤 ctx 원상복구 ④ 빌드 연결
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'../..');let fails=0,n=0;const ok=(c,m)=>{n++;if(!c){fails++;console.log('FAIL '+m);}};
const rd=f=>{try{return fs.readFileSync(path.join(ROOT,f),'utf8');}catch(_){return '';}};
const SRC=rd('client-source/mob-dup-tint-r1183.js');
function world(zone){const store={},log=[];const proto={drawImage(img){log.push({src:img.src,filter:this.filter});},fillRect(){log.push({rect:1,filter:this.filter});}};
 const ctx=Object.create(proto);ctx.filter='none';
 const ivs=[];const C={Math,String,Number,Array,Object,JSON,RegExp,console,setInterval:f=>{ivs.push(f);return 1;},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},ctx,room:/^sz/.test(zone)?{id:'ep1b05',samongR103:{zone}}:{id:zone}};
 C.drawEnemy=function(e){ctx.filter=e.flash?'brightness(1.8)':'none';ctx.drawImage({src:'https://x/'+e.path});ctx.filter='none';ctx.fillRect();ctx.drawImage({src:'https://x/assets/vfx/mark.webp'});};
 C.window=C;vm.createContext(C);if(SRC)vm.runInContext(SRC,C);return {C,log,ctx,ivs};}
const CASES=[
 ['창처럼 날아오는 역십자가','ep1b08','assets/r116/mobs/M032-idle.png',1],['흑마법사의 저주창','ep1b08','assets/r116/mobs/M032-idle.png',0],
 ['전극을 두른 좀비 수호기사','ep1b08','assets/episode1b/generated-v31342-rc39/zombie_guardian_knight_bloodied.webp',1],['전극기계수호기사','ep1b08','assets/episode1b/generated-v31342-rc39/zombie_guardian_knight_bloodied.webp',0],
 ['기계화 감옥 공명기사','kair07','assets/r116/mobs/M041-idle.png',1],['감옥 공명기사','u202','assets/r116/mobs/M041-idle.png',0],
 ['면도날 종이 아이','sz115-S02-8','assets/r99/clean/assets/u2/generated-v350/u2_void_wraith.webp',1],['기억 공백 망령','u204','assets/r99/clean/assets/u2/generated-v350/u2_void_wraith.webp',0],
 ['기운 누더기 골렘','sz115-S01-2','assets/r380/mobs/r200-stitched-golem-v2.webp',1],['꿰맨 아기 인형','sz115-S01-2','assets/r380/mobs/r200-stitched-golem-v2.webp',0],
 ['적 지휘 개체','sz115-S06-3','assets/r380/mobs/s06-commander-v1.webp',1],['적 지휘 기체','sz115-S06-18','assets/r380/mobs/s06-commander-v1.webp',0],
 ['제출되지 못한 문장','sz115-RF-1','assets/r290/mobs/m053.webp',1],['제출되지 못한 문장','murder04','assets/r290/mobs/m053.webp',0],
 ['찢어진 사진의 망령','sz115-RC-3','assets/r290/mobs/m088.webp',1],['찢어진 사진의 망령','ep1b03','assets/r290/mobs/m088.webp',0],
 ['백은 없는 그림자','sz115-S07-3','assets/r290/mobs/m082.webp',1],['백은 없는 그림자','hando03','assets/r290/mobs/m082.webp',0],
 ['부정의 잔영','sz162-P-D','assets/r290/mobs/m066.webp',1],['부정의 잔영','ep1a10','assets/r290/mobs/m066.webp',0],
 ['거짓천국 근위천사','sz115-M-1','assets/r410/mobs/m099.webp',1],['거짓천국 근위천사','ep1a11','assets/r410/mobs/m099.webp',0],
 ['뿌리에서 쏟아진 잔영','sz115-S01-2','assets/r410/mobs/m063.webp',1],['뿌리에서 쏟아진 잔영','sz162-S-01-B','assets/r410/mobs/m063.webp',1],['뿌리에서 쏟아진 잔영','sz115-P-2','assets/r410/mobs/m063.webp',0]];
for(const [name,zone,p,want] of CASES){const w=world(zone),e={name,path:p,hp:5,maxHp:5};w.C.drawEnemy(e);const body=w.log[0],fx=w.log[2],bar=w.log[1];
 const tinted=!!body&&/hue-rotate|grayscale|saturate/.test(body.filter||'');
 ok(tinted===!!want,'① '+name+' @'+zone+' '+(want?'색조':'그대로')+' ('+(body&&body.filter)+')');
 ok(fx&&fx.filter==='none'&&bar&&bar.filter==='none','② '+name+' 이펙트·체력 줄 그대로');
 ok(!Object.prototype.hasOwnProperty.call(w.ctx,'drawImage'),'③ '+name+' 그린 뒤 ctx.drawImage 원상복구');}
{const w=world('ep1b08'),e={name:'창처럼 날아오는 역십자가',path:'assets/r116/mobs/M032-idle.png',flash:1};w.C.drawEnemy(e);ok(/^brightness\(1\.8\) hue-rotate/.test(w.log[0].filter),'① 맞은 번쩍 필터 뒤에 이어 붙임 ('+w.log[0].filter+')');}
{const w=world('ep1b08');w.C.drawEnemy({name:'창처럼 날아오는 역십자가 2',path:'assets/r116/mobs/M032-idle.png',boss:true});ok(w.log[0].filter==='none','② 보스는 그대로');}
{const w=world('ep1b08');const A=w.C.__STORYWORLD_DUP_TINT_R1183__;ok(A&&A.rules.length===12,'④ 규칙 12건');
 ok(A&&A.rules.every(r=>!/drop-shadow|blur/.test(r.filter)),'④ 기록기가 받는 필터만');A&&A.set(false);w.C.drawEnemy({name:'창처럼 날아오는 역십자가',path:'assets/r116/mobs/M032-idle.png'});ok(w.log[0]&&w.log[0].filter==='none','④ 끄기');}
{const w=world('ep1b08');const outer=w.C.drawEnemy;w.C.drawEnemy=function(e){return outer(e);};/* 다른 덧씌우기가 우리 껍데기를 감쌈 */
 w.ivs.forEach(f=>f());/* 1.5초 다시 감싸기 → 사슬에 우리 껍데기가 두 번 */
 w.C.drawEnemy({name:'전극을 두른 좀비 수호기사',path:'x/zombie_guardian_knight_bloodied.webp'});
 ok((w.log[0].filter.match(/hue-rotate/g)||[]).length===1,'③ 사슬에 두 번 들어가도 한 번만 칠함 ('+w.log[0].filter+')');}
{const w=world('sz115-S02-8');w.C.drawEnemy({name:'면도날 종이 아이',path:'assets/r200/shades/paper-child.webp'});ok(w.log[0].filter==='none','② 종이 아이 전용 그림(paper-child)은 그대로');}
{const w=world('sz115-S01-2');w.C.drawEnemy({name:'뿌리에서 쏟아진 잔영',path:'assets/r161/puppet/puppet-ego-walk-right-8.webp'});ok(w.log[0].filter==='none','② 같은 이름이라도 겹치는 그림이 아니면(R161 인형) 그대로');}
const html=rd('runtime-text/index.html');ok(html.includes('<script src="./mob-dup-tint-r1183.js"></script>'),'④ index.html 스크립트 태그');
ok(rd('runtime-text/mob-dup-tint-r1183.js')===SRC&&SRC.length>0,'④ runtime-text 사본');ok(rd('runtime-inputs.json').includes('mob-dup-tint-r1183.js')&&rd('runtime-manifest.json').includes('mob-dup-tint-r1183.js'),'④ sync 등록');
ok(rd('../scripts/verify-r96-public.py').includes("'mob-dup-tint-r1183.js'"),'④ verify 목록');ok(rd('../.github/workflows/pages.yml').includes('node r96/qa/r1183/dup-tint-cpu-check.cjs'),'④ pages.yml');
console.log(fails?'FAILED '+fails+'/'+n:'ALL PASS '+n);process.exit(fails?1:0);
