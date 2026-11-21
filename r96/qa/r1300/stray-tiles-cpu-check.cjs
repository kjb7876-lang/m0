// R1300 CPU check — 붕괴 의식장(kair10) 통로 한가운데 뜬금없는 바닥 타일(이끼 돌 조각 + 검은 판).
//  사용자 2026-11-21 캡처: 모래 통로 한가운데에 이끼 낀 돌 조각과 검은 사각형 판이 깔림 → "뜬금없는 맵타일 버그 수정".
//  원인: R839 바위턱 표의 kair10 '가운데 바위섬'(5×2·5×2·2×5) — 길 옆 둔덕과 이어지지 않고 통로 한가운데 홀로 선 비바닥 덩어리.
//   얇은 섬은 그림에서 지붕 덮개(이끼 무늬)만 남고 벽면이 비어 바닥 위 조각·검은 판으로 읽힌다.
//  규칙: 어느 지역이든 R839 턱은 원래 지도의 바닥 밖(둔덕·벽)에 한 변 이상 붙어야 한다(홀로 뜬 섬 0개). kair10 은 원래 지도 그대로.
'use strict';const path=require('path');let bad=0,n=0;
const ok=(m,c,x)=>{n++;if(!c){bad++;console.log('FAIL',m,x!==undefined?JSON.stringify(x).slice(0,600):'');}else console.log('ok  ',m);};
(async()=>{const{createHarness}=require(path.join(__dirname,'..','harness.cjs'));const h=createHarness({timeoutMs:300000});await h.boot();
 const r=h.run(`(()=>{const A=__STORYWORLD_OUTCROPS_R839__,X=__STORYWORLD_EXPLORATION__,out={};
  for(const id of Object.keys(A.STYLE)){const L=X.layout(id,'STORY');if(!L)continue;const src=A.source(id,L)||L,S0=new Set(src.floorCells.map(c=>c[0]+':'+c[1])),S=new Set(L.floorCells.map(c=>c[0]+':'+c[1]));
   const O=L.outcropsR839,blocks=O?O.blocks:[],floating=[];
   for(const b of blocks){let touch=false;for(const[x,y,w,d]of b.rects)for(let j=0;j<d;j++)for(let i=0;i<w;i++)for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const k=(x+i+dx)+':'+(y+j+dy);const inside=b.rects.some(([bx,by,bw,bd])=>x+i+dx>=bx&&x+i+dx<bx+bw&&y+j+dy>=by&&y+j+dy<by+bd);if(!inside&&!S0.has(k))touch=true;}
    if(!touch)floating.push(b.key);}
   out[id]={blocks:blocks.length,floating,cells:S.size,src:S0.size,style:O?.style||null};}
  return{out,table:Object.keys(A.TABLE),errors:A.inspect().stats.errors};})()`);
 const k10=r.out.kair10;
 ok('kair10 붕괴 의식장: 통로에 R839 턱이 하나도 없다 — 바닥 칸 수가 원래 지도와 같다',!!k10&&k10.blocks===0&&k10.cells===k10.src,k10);
 ok('kair10 은 굽기 표에 없다',!r.table.includes('kair10'),r.table);
 const fl=Object.entries(r.out).filter(([,v])=>v.floating.length).map(([z,v])=>[z,v.floating]);
 ok('모든 지역: 원래 바닥 밖에 닿지 않고 홀로 뜬 턱(섬) 0개',fl.length===0,fl);
 const kept=['dist03','dist04','dist06','ep1b06b','kair04','kair08','kair09'].filter(z=>!(r.out[z]&&r.out[z].blocks>0));
 ok('회귀: 길 옆에 붙은 다른 7지역 턱은 그대로 들어간다',kept.length===0,kept);
 ok('오버레이 오류 0',r.errors===0,r.errors);
 console.log(`\nR1300 stray tiles CPU: ${n-bad}/${n} passed`);process.exit(bad?1:0);})().catch(e=>{console.log('FAIL boot',String(e).slice(0,300));process.exit(1);});
