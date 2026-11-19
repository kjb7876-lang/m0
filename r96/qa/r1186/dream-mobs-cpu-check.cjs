// R1186 실패 먼저: 꿈 층 R248 임시 도트 몹 2종(m032 인간의 뇌를 닮은 투명 연산 장치·m049 시간핵의 명령 잔류)을 Dots CX-0161DR 칠한 시트로(R1179 방식).
// 사용자 2026-11-18 22:06Z "부족한거 닷츠랑계속협업" + 전수조사 요청안. 그림만, 판정·체력·보상 그대로.
// 검사: ① R248 표가 새 경로·body 로 바뀜(이름이 같을 때만) ② 시트 무손실 1024×960·sha·등록 ③ 원래 임시 시트 남김 ④ 끄기 → 원래 값 ⑤ 기존 m077·m081 그대로 ⑥ 빌드 연결
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.join(__dirname,'../..');let fails=0,n=0;const ok=(c,m)=>{n++;if(!c){fails++;console.log('FAIL '+m);}};
const rd=f=>{try{return fs.readFileSync(path.join(ROOT,f),'utf8');}catch(_){return '';}};
const L={};const w={localStorage:{getItem:()=>null,setItem(){}},document:{readyState:'loading',addEventListener:(k,f)=>{(L[k]=L[k]||[]).push(f);}},addEventListener(){},setTimeout:f=>f()};w.window=w;vm.createContext(w);
for(const f of ['mob-art-r1179.js','mob-unique-r248-data.js','mob-art-r290.js','mob-art-r410.js'])vm.runInContext(rd('client-source/'+f),w);
w.document.readyState='interactive';for(const f of (L.DOMContentLoaded||[]))f();
const D=w.__STORYWORLD_MOB_UNIQUE_R248_DATA__,A=w.__STORYWORLD_MOB_ART_R1179__;let J=null;try{J=JSON.parse(rd('runtime-text/assets/r1186/mobs/index.json'));}catch(_){}
const T={m032:'인간의 뇌를 닮은 투명 연산 장치',m049:'시간핵의 명령 잔류'};const orig={};
for(const [id,name] of Object.entries(T)){const s=D.sheets[id],m=J&&J.assets.find(a=>a.id===id);
 ok(s&&s.name===name&&s.path==='assets/r1186/mobs/'+id+'.webp','① '+id+' → r1186 시트 ('+(s&&s.path)+')');ok(m&&s&&s.body===m.body&&s.body>=100&&s.body<=300,'① '+id+' body = index ('+(s&&s.body)+')');
 const b=fs.existsSync(path.join(ROOT,'runtime-text/assets/r1186/mobs/'+id+'.webp'))?fs.readFileSync(path.join(ROOT,'runtime-text/assets/r1186/mobs/'+id+'.webp')):Buffer.alloc(0);
 let W=0,H=0;if(b.length&&b.toString('ascii',12,16)==='VP8L'){const x=b.readUInt32LE(21);W=(x&0x3fff)+1;H=((x>>14)&0x3fff)+1;}
 ok(W===1024&&H===960,'② '+id+' 무손실 1024×960 ('+W+'×'+H+')');ok(m&&crypto.createHash('sha256').update(b).digest('hex')===m.sha256&&rd('runtime-inputs.json').includes(m.file)&&rd('runtime-manifest.json').includes(m.file),'② '+id+' sha·등록');
 ok(fs.existsSync(path.join(ROOT,'runtime-text/assets/r248/mobs/'+id+'.webp')),'③ '+id+' 원래 임시 시트 남김');}
A.set(false);ok(D.sheets.m032.path!=='assets/r1186/mobs/m032.webp'&&D.sheets.m049.path!=='assets/r1186/mobs/m049.webp'&&D.sheets.m032.body===198&&D.sheets.m049.body===234,'④ 끄면 원래 값');A.set(true);ok(D.sheets.m032.path==='assets/r1186/mobs/m032.webp','④ 다시 켜면 적용');
ok(D.sheets.m077.path==='assets/r1179/mobs/m077.webp'&&D.sheets.m081.path==='assets/r1179/mobs/m081.webp','⑤ m077·m081 그대로');
ok(A.paths().includes('assets/r1186/mobs/m049.webp')&&A.paths().includes('assets/r1179/mobs/m077.webp'),'⑤ paths() 새 경로 포함');
ok(rd('runtime-text/mob-art-r1179.js')===rd('client-source/mob-art-r1179.js'),'⑥ runtime-text 사본');ok(rd('../scripts/verify-r96-public.py').includes("'assets/r1186/'"),'⑥ verify 접두');ok(rd('../.github/workflows/pages.yml').includes('node r96/qa/r1186/dream-mobs-cpu-check.cjs'),'⑥ pages.yml');
console.log(fails?'FAILED '+fails+'/'+n:'ALL PASS '+n);process.exit(fails?1:0);
