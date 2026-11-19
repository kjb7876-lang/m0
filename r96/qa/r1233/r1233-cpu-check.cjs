// R1233 CPU 검사 — 임시로 얹은 R248 이름 시트가 사몽 잔영·채택 그림을 덮던 몹 바로잡기(mob-art-restore-r1233.js). 브라우저 없이 실제 모듈을 가짜 전역에서 돌린다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),NAME='mob-art-restore-r1233.js',SRC=path.join(R,'client-source',NAME);
let pass=0;const ok=(c,m)=>{assert.ok(c,m);pass++;};
ok(fs.existsSync(SRC),'오버레이 파일 있음');const code=fs.readFileSync(SRC,'utf8');
// ---- 정적 ----
const html=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8');
ok((html.match(/\n<script src="\.\/mob-art-restore-r1233\.js"><\/script>\n/g)||[]).length===1,'index.html 자기 줄 한 번');
const t=f=>html.indexOf('src="./'+f+'"');
ok(t(NAME)>t('dream-mob-art-r1193.js')&&t(NAME)>t('samong-face-r1098.js')&&t(NAME)<t('boot-lean-r1038.js'),'태그: R1193·R1098 뒤, boot-lean 앞(R248·R380·R200 은 그 뒤 긴 줄 — 설치는 DOMContentLoaded·1초마다)');
ok(fs.readFileSync(path.join(R,'../scripts/verify-r96-public.py'),'utf8').includes("'"+NAME+"'"),'공개 확인 기대 목록');
ok(fs.existsSync(path.join(R,'runtime-text',NAME))&&fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8').includes(NAME)&&fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8').includes(NAME),'runtime-text 사본·inputs·manifest 등록(sync)');
ok(!/m015|안정화 집행체/.test(code.replace(/^\s*\/\/.*$/gm,'')),'안정화 집행체(R1226 몫)는 코드 대상 아님');
ok(!/drop-shadow|blur\(/.test(code),'Three.js 기록기를 떨어뜨리는 필터 없음');
// 그림 줄이 실제로 있는지(오타 방지)
const idx=JSON.parse(fs.readFileSync(path.join(R,'runtime-text/assets/r380/mobs/index.json'),'utf8'));
for(const id of ['samong-s05-wraith-officer-v2','r200-stitched-golem-v2','false-heaven-guard-v1','samong-m066-v3'])ok(idx.mobs.some(m=>m.id===id&&fs.existsSync(path.join(R,'runtime-text',m.path))||idx.mobs.some(m=>m.id===id)),'R380 표 줄 있음 '+id);
// ---- 동작(가짜 전역) ----
function boot(store={}){
 const ROWS=Object.fromEntries(idx.mobs.map(m=>[m.id,m]));const own=new Map();let frames=0;
 const A={revision:'fake',assign:e=>own.get(e)||null,frameOf:(e,m,id)=>{frames++;return {path:m.path,id};},cellFor:()=>0};
 const S={frameFor:(e,f)=>({path:'base'})};
 const SH={assign:e=>e.r200Shade==='extra-informant'?{id:'extra-informant',name:'호외 신문의 밀고자 잔영',path:'assets/r200/shades/extra-informant.webp',attack:[5,6]}:e.r200Shade==='mannequin'?{id:'mannequin',name:'식탁의 마네킹 잔영',path:'assets/r1188/shades/mannequin.webp',attack:[5]}:null};
 const timers=[];
 const w={localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},document:{readyState:'complete'},
  fetch:u=>Promise.resolve({ok:true,json:()=>Promise.resolve(u.includes('r380')?idx:{})}),setInterval:(f)=>{timers.push(f);return 1;},setTimeout:(f,ms)=>setTimeout(f,ms),
  readyImage:()=>({image:{}}),ensureImages:()=>Promise.resolve(),room:{id:'sz115-S05-2',samongR103:{zone:'S-05',key:'x'}},layer:'DREAM',
  __STORYWORLD_MOB_UNIQUE_R248_DATA__:Object.freeze({sheets:{m044:{name:'피리 고블린',file:'m044.webp',path:'assets/r410/mobs/m044.webp',body:214},m099:{name:'다른 이름',path:'assets/r410/mobs/m099.webp',body:200}},byName:{}}),
  __STORYWORLD_APPROVED_MOBS_R380__:A,__STORYWORLD_STORY_COMBAT_R54__:S,__STORYWORLD_SAMONG_SHADES_R200__:SH};
 w.window=w;vm.createContext(w);vm.runInContext(code,w);return {w,own,ROWS,frames:()=>frames,tick:()=>timers.forEach(f=>f())};}
(async()=>{
 const B=boot();await new Promise(r=>setTimeout(r,20));B.tick();
 const W=B.w,A=()=>W.__STORYWORLD_APPROVED_MOBS_R380__,F=()=>W.__STORYWORLD_STORY_COMBAT_R54__;
 ok(A().__r1233&&F().__r1233,'R380 assign·R54 frameFor 사슬에 설치');
 const api=W.__STORYWORLD_MOB_ART_RESTORE_R1233__;ok(api&&api.inspect().rows.length===4,'채택 그림 줄 4개 읽음');
 // ① 사몽 잔영
 const sh={name:'호외 신문의 밀고자 잔영 3',r200Shade:'extra-informant',samongR103:{},hp:5};
 ok(A().assign(sh)?.path==='assets/r200/shades/extra-informant.webp','잔영이 정해진 몹 → R380 assign 이 잔영 줄을 돌려줌(R248 물러남)');
 ok(F().frameFor(sh,null).path==='base','잔영 그림은 R200 frameFor(안쪽 사슬)가 그대로 그림');
 // ② 같은 이름 채택 그림 — slot 밖 몹
 const tw={name:'찢긴 호외의 잔향 2',samongR103:{},hp:5};
 ok(A().assign(tw)?.id==='samong-s05-wraith-officer-v2','S-05 찢긴 호외의 잔향(slot 밖) → 장교 잔향 줄');
 ok(F().frameFor(tw,null).path==='assets/r380/mobs/samong-s05-wraith-officer-v2.webp','그림도 R380 frameOf 로 장교 잔향');
 const tw2={name:'찢긴 호외의 잔향 · 짙은 형상',samongR103:{},hp:5};ok(A().assign(tw2)?.id==='samong-s05-wraith-officer-v2','짙은 형상도 같은 이름 → 같은 그림');
 // 경계: R380 이 이미 맡은 몹(slot 안)은 그 줄 그대로
 const slot={name:'찢긴 호외의 잔향 1',samongR103:{},hp:5};B.own.set(slot,B.ROWS['samong-s05-wraith-jihyeon-v2']);
 ok(A().assign(slot).id==='samong-s05-wraith-jihyeon-v2'&&F().frameFor(slot,null).path==='base','R380 이 이미 맡은 몹은 바꾸지 않음(지현 잔향 그대로)');
 // 경계: 보스·중간보스·탑은 손대지 않음
 ok(A().assign({name:'중간보스 · 찢긴 호외의 잔향',samongR103:{},hp:5})===null,'중간보스 이름 → 손대지 않음');
 ok(A().assign({name:'찢긴 호외의 잔향',boss:true,samongR103:{},hp:5})===null,'보스 → 손대지 않음');
 ok(A().assign({name:'찢긴 호외의 잔향',r170Tower:true,samongR103:{},hp:5})===null,'탑 → 손대지 않음');
 // 경계: 다른 구역(S-04)의 같은 이름은 아님
 W.room={id:'sz115-S04-2',samongR103:{zone:'S-04'}};ok(A().assign({name:'찢긴 호외의 잔향',samongR103:{},hp:5})===null,'S-05 밖 구역 → 손대지 않음');
 W.room={id:'sz115-S01-3',samongR103:{zone:'S-01'}};ok(A().assign({name:'꿰맨 아기 인형 2',samongR103:{},hp:5})?.id==='r200-stitched-golem-v2','S-01 꿰맨 아기 인형 → 꿰맨 골렘 채택 그림');
 ok(A().assign({name:'꿰맨 아기 인형 3',r200Shade:'mannequin',samongR103:{},hp:5})?.id==='r200-stitched-golem-v2','회귀: 이웃 잔영(식탁의 마네킹) 그림이 붙은 꿰맨 아기 인형 → 이웃 그림이 아니라 꿰맨 골렘');
 ok(A().assign({name:'식탁의 마네킹 잔영 2',r200Shade:'mannequin',samongR103:{},hp:5})?.id==='mannequin','제 이름 잔영(식탁의 마네킹) → 잔영 그림 그대로');
 // 꿈 층(스토리 사몽): 사몽 에피소드 몹이 아닌 것만
 W.room={id:'ep1a11'};W.layer='DREAM';ok(A().assign({name:'거짓천국 근위천사 증원',hp:5})?.id==='false-heaven-guard-v1','꿈 층 ep1a11 거짓천국 근위천사 → 스토리와 같은 채택 그림');
 W.room={id:'ep1a10'};ok(A().assign({name:'부정의 잔영 우두머리',hp:5})?.id==='samong-m066-v3','꿈 층 부정의 잔영 → 사몽판 채택 그림');
 ok(A().assign({name:'부정의 잔영',samongR103:{},hp:5})===null,'사몽 에피소드 -P- 부정의 잔영(R1187 DU-10 몫) → 손대지 않음');
 W.layer='STORY';ok(A().assign({name:'거짓천국 근위천사',hp:5})===null&&A().assign({name:'부정의 잔영',hp:5})===null,'스토리 층 → 손대지 않음(원래 그림 그대로)');
 ok(A().assign({name:'규칙을 어기지 않는 마네킹',hp:5})===null,'대상 아닌 이름 → 손대지 않음');
 // ③ 시트 줄(피리 고블린)
 const D=W.__STORYWORLD_MOB_UNIQUE_R248_DATA__;ok(D.sheets.m044.path==='assets/r1233/mobs/m044.webp'&&D.sheets.m044.body===196,'피리 고블린 R248 시트 줄 → r1233 고블린 시트(R410 상자머리 후보 대신)');
 ok(D.sheets.m099.path==='assets/r410/mobs/m099.webp','다른 줄은 그대로');
 api.set({on:false});ok(D.sheets.m044.path==='assets/r410/mobs/m044.webp'&&D.sheets.m044.body===214,'끄면 원래 줄로 되돌림');api.set({on:true});ok(D.sheets.m044.path==='assets/r1233/mobs/m044.webp','다시 켜면 다시 얹음');
 const six=JSON.parse(fs.readFileSync(path.join(R,'runtime-text/assets/r1233/mobs/index.json'),'utf8'));const row=six.mobs.find(m=>m.id==='m044');
 ok(row&&row.body===196&&row.name==='피리 고블린'&&fs.existsSync(path.join(R,'runtime-text/assets/r1233/mobs/m044.webp')),'시트 파일·index.json(body 196) 있음');
 const crypto=require('crypto');ok(crypto.createHash('sha256').update(fs.readFileSync(path.join(R,'runtime-text/assets/r1233/mobs/m044.webp'))).digest('hex')===row.sha256,'시트 해시가 index.json 과 같음');
 // 끄기
 const B2=boot({'storyworld.r1233.restore':'{"on":false}'});await new Promise(r=>setTimeout(r,20));B2.tick();
 B2.w.room={id:'sz115-S05-2',samongR103:{zone:'S-05'}};ok(B2.w.__STORYWORLD_APPROVED_MOBS_R380__.assign({name:'찢긴 호외의 잔향',samongR103:{},hp:5})===null,'끄면 아무것도 바꾸지 않음');
 // 다시 감싸기: 다른 덧씌우기가 {...A} 로 감싸도 플래그가 따라가 이중 설치 없음
 const before=W.__STORYWORLD_APPROVED_MOBS_R380__;W.__STORYWORLD_APPROVED_MOBS_R380__=Object.freeze({...before,other:1});B.tick();ok(W.__STORYWORLD_APPROVED_MOBS_R380__.other===1,'남이 다시 감싼 객체를 덮어쓰지 않음');
 console.log('R1233 cpu check '+pass+' PASS');
})().catch(e=>{console.error('FAIL',e.message);process.exit(1);});
