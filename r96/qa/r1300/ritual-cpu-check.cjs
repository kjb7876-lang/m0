// R1300 CPU check — 붕괴 의식장 보스방: 나가는 보스 문 앞 '여섯 고리' + 기둥 머리 검은 모래 솟구침(kair10-ritual-r1300.js).
'use strict';const fs=require('fs'),path=require('path');const R=path.join(__dirname,'..','..'),rd=f=>fs.readFileSync(path.join(R,f),'utf8');let bad=0,n=0;
const ok=(m,c,x)=>{n++;if(!c){bad++;console.log('FAIL',m,x!==undefined?JSON.stringify(x).slice(0,600):'');}else console.log('ok  ',m);};
const F='kair10-ritual-r1300.js';let src='';try{src=rd('client-source/'+F);}catch(e){}
ok('client-source 가 있고 runtime-text 사본이 같다',!!src&&fs.existsSync(path.join(R,'runtime-text',F))&&rd('runtime-text/'+F)===src);
const inputs=JSON.parse(rd('runtime-inputs.json')),man=JSON.parse(rd('runtime-manifest.json'));
ok('runtime-inputs·manifest 에 스크립트와 새 시트가 있다',inputs.textPaths.includes(F)&&man.files.some(f=>f.path===F)&&man.files.some(f=>f.path==='assets/r1300/sand-geyser.webp'));
ok('스크립트 태그 한 번, 자기 줄(mob-hit-r1156 바로 뒤 — 끝줄 순서 검사 r1038·r1097·r1269 를 건드리지 않는 자리)',rd('runtime-text/index.html').split('<script src="./'+F+'"></script>').length===2&&rd('runtime-text/index.html').includes('<script src="./mob-hit-r1156.js"></script>\n<script src="./'+F+'"></script>\n'));
ok('verify-r96-public.py 기대 목록·CI 검사 줄',/'kair10-ritual-r1300\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8'))&&/node r96\/qa\/r1300\/ritual-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
ok('그리기 규칙: ctx.filter·도형(arc/ellipse/fillRect/lineTo) 없음',!!src&&!/ctx\.filter\s*=|\.arc\(|\.ellipse\(|fillRect\(|lineTo\(/.test(src));
{const p=path.join(R,'runtime-text','assets','r1300','sand-geyser.webp');ok('시트 파일(webp, 1152×768 = 192×384 칸 6열×2행)',fs.existsSync(p)&&fs.statSync(p).size>20000&&(()=>{const b=fs.readFileSync(p);return b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP';})());}
(async()=>{let h=null;try{const{createHarness}=require(path.join(R,'qa','harness.cjs'));h=createHarness({timeoutMs:300000});await h.boot();}catch(e){ok('사이트가 CPU 하네스에서 뜬다 '+String(e).slice(0,200),false);}
 if(h){const r=h.run(`(()=>{const A=window.__STORYWORLD_KAIR10_RITUAL_R1300__;if(!A)return{missing:true};const L=__STORYWORLD_EXPLORATION__.layout('kair10','STORY');
   const F=new Set(L.floorCells.map(c=>c[0]+':'+c[1])),B=A.bossRect(L),P=A.pillars(L),D=A.exitDoor(L),S=A.ringSpots(L);
   const st={seenAlive:true,deadAt:10},seq=[0,1,2,3,4,5].map(i=>[9,10.6+i*.5+.05,10.6+i*.5+.2,10.6+i*.5+.3,10.6+i*.5+.6,10.6+i*.5+.9].map(t=>{const l=A.ringLook(st,i,t);return l?l.frame+(l.drop>0?'d':''):'x';}));
   const other=['kair09','kair04','dist03'].map(z=>{const M=__STORYWORLD_EXPLORATION__.layout(z,'STORY');return M?A.ringSpots(M).length+A.pillars(M).length:0;});
   return{B,P,D:D&&{id:D.id,name:D.name,boss:!!D.r78BossDoor},S,onFloor:S.every(q=>F.has(Math.floor(q.x)+':'+Math.floor(q.y))),inBoss:P.every(q=>q.x>B[0]&&q.x<B[2]&&q.y>B[1]&&q.y<B[3]),
    pillarSolid:P.every(q=>!F.has(Math.floor(q.x)+':'+Math.floor(q.y))),seq,fresh:A.ringLook({seenAlive:false,deadAt:-1},0,5),alive:A.ringLook({seenAlive:true,deadAt:-1},3,99),err:A.inspect().stats.errors};})()`);
  ok('오버레이가 실제 빌드에 실린다',!r.missing,r);
  if(!r.missing){
   ok('보스방 1×1 돌기둥 6개를 찾고 모두 보스방 안·바닥 아닌 칸',r.P.length===6&&r.inBoss&&r.pillarSolid,r.P);
   ok('나가는 보스 문 = 보스 구역 입구가 아닌 "다음 구역 문"',!!r.D&&r.D.id==='door-2'&&!r.D.boss,r.D);
   ok('고리 여섯이 문 앞 바닥 위(보스방 쪽)에 선다',r.S.length===6&&r.onFloor,r.S);
   ok('보스 쓰러짐 전: 고리 온전(그림 0) · 보스를 본 적 없이 들어옴(이미 처치): 고리 없음',r.alive&&r.alive.frame===0&&r.alive.drop===0&&r.fresh===null,[r.alive,r.fresh]);
   ok('보스 쓰러진 뒤: 고리 하나씩 차례로 금(1)→갈라짐(2)→끊김(3)→떨어짐→사라짐',r.seq.every((s,i)=>s.join(',')==='0,1,2,3,3d,x'),r.seq);
   ok('다른 지역(kair09·kair04·dist03)에서는 아무것도 하지 않는다 — 보스방 기준 자리 계산은 순수 함수지만 그리기는 kair10 만',src.includes("ZONE='kair10'")&&/room\.id!==ZONE/.test(src));
   ok('오버레이 오류 0',r.err===0,r.err);}}
 console.log(`\nR1300 ritual CPU: ${n-bad}/${n} passed`);process.exit(bad?1:0);})();
