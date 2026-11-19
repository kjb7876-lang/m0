// R1230 CPU 검사 — 위치 고정 적 공격 모션(fixed-attack-r1230.js)
//  가짜 ctx·drawEnemy 로 실제 그리기 호출(scale 인자·drawImage 칸)을 받아 본다. 시간은 게임 time 을 직접 넘긴다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),SRC=path.join(R,'client-source/fixed-attack-r1230.js');
let pass=0;const ok=(c,m)=>{assert.ok(c,m);pass++;};
ok(fs.existsSync(SRC),'오버레이 파일 있음');
const code=fs.readFileSync(SRC,'utf8');
// ---- 정적 연결 ----
const html=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8');
ok(/\n<script src="\.\/fixed-attack-r1230\.js"><\/script>\n/.test(html),'index.html 스크립트 태그(따로 한 줄)');
ok(html.indexOf('fixed-attack-r1230.js')<html.indexOf('./combat-r118.js'),'combat-r118 보다 앞');
ok(fs.readFileSync(path.join(R,'../scripts/verify-r96-public.py'),'utf8').includes("'fixed-attack-r1230.js'"),'공개 확인 기대 목록');
ok(fs.readFileSync(path.join(R,'../.github/workflows/pages.yml'),'utf8').includes('r96/qa/r1230/r1230-cpu-check.cjs'),'pages.yml 검사 줄');
ok(fs.existsSync(path.join(R,'runtime-text/fixed-attack-r1230.js')),'runtime-text 사본(sync)');
ok(fs.readFileSync(path.join(R,'runtime-text/fixed-attack-r1230.js'),'utf8')===code,'runtime-text 사본이 같음');
ok(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8').includes('fixed-attack-r1230.js'),'runtime-inputs 등록');
ok(fs.existsSync(path.join(R,'runtime-text/assets/r1210/laser-charge8.webp')),'쓰는 프레임 시트(Dots MR-01 충전 소용돌이) 있음');
ok(!/ctx\.filter\s*=/.test(code),'ctx.filter 안 씀(Three 기록기 안전)');
ok(!/drop-shadow|blur\(/.test(code),'drop-shadow·blur 없음');
ok(!/\b(arc|ellipse|lineTo|fillRect)\s*\(/.test(code),'코드로 그린 원·선·사각형 없음(시트·R106 glow 만)');
ok(!/\.(hp|damage|x|y|next|casts|rangedWindup|cd)\s*=[^=]/.test(code.replace(/s\.\w+=|c\.width=|c\.height=|px\[i\]=|px\[i\+\d\]=/g,'')),'적의 판정·위치·시간 값을 쓰지 않음(읽기만)');
// ---- 판정·그리기 ----
function sandbox(){const calls=[];const img={width:1024,height:128,naturalWidth:1024,naturalHeight:128};
 const g2={drawImage(){},getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4).fill(200)}),putImageData(){}};
 const ctx={stack:[],sx:1,sy:1,globalAlpha:1,save(){this.stack.push([this.sx,this.sy,this.globalAlpha]);},restore(){[this.sx,this.sy,this.globalAlpha]=this.stack.pop();},
  translate(){},scale(a,b){calls.push({k:'scale',a,b});this.sx*=a;this.sy*=b;},drawImage(im,...a){calls.push({k:'img',sheet:!!im.__r1230Sheet,sx:a[0],w:a[6],alpha:this.globalAlpha,nan:!a.every(Number.isFinite)});}};
 const glows=[];
 const sb={localStorage:{v:{},getItem(k){return this.v[k]??null;},setItem(k,v){this.v[k]=String(v);}},setInterval:()=>0,
  document:{createElement:()=>({width:0,height:0,getContext:()=>g2})},Math,Date,Map,Set,WeakMap,Array,Uint8ClampedArray,Number,String,Object,Promise,console,
  time:0,zoom:1,ctx,player:{x:3,y:0},project:(x,y)=>({x:100+x*10,y:200+y*10}),actorHeight:()=>60,readyImage:p=>p==='assets/r1210/laser-charge8.webp'?{image:img}:null,ensureImages:()=>{}};
 sb.drawEnemy=function(e){calls.push({k:'body',sx:ctx.sx,sy:ctx.sy,id:e.id});};
 sb.window=sb;sb.__STORYWORLD_FX_SPRITES_R106__={on:()=>true,draw:(n,F,x,y,w,h,o)=>glows.push({n,F,alpha:o.alpha,nan:![x,y,w,h,o.alpha].every(Number.isFinite)})};
 vm.createContext(sb);vm.runInContext(code,sb);return{sb,calls,glows,ctx};}
const run=(S,e,t)=>{S.sb.time=t;const n=S.calls.length,g=S.glows.length;S.sb.drawEnemy(e);return{c:S.calls.slice(n),g:S.glows.slice(g)};};
const bodyOf=r=>r.c.find(x=>x.k==='body');const sheetOf=r=>r.c.filter(x=>x.k==='img'&&x.sheet);
// 1) R170 탑: 충전 1.3초 → 발사(casts+1) → 되돌림 → 제자리
{const S=sandbox(),API=S.sb.__STORYWORLD_FIXED_ATTACK_R1230__;ok(API&&typeof API.phase==='function','전역 API');
 const e={id:'t',x:0,y:0,hp:100,maxHp:100,r170Tower:{next:10,casts:0,h:90,pal:{main:{a:[90,12,20],b:[255,120,110]}}},r75Tower:true};
 const keys=new Set(),frames=new Set();let idle=run(S,e,5);ok(bodyOf(idle).sx===1&&bodyOf(idle).sy===1&&sheetOf(idle).length===0&&idle.g.length===0,'충전 전(1.3초 밖)엔 몸 배율 1·이펙트 없음');
 for(let t=8.75;t<10;t+=.05){const r=run(S,e,t);const b=bodyOf(r);keys.add(b.sx+'x'+b.sy);for(const s of sheetOf(r))frames.add(s.sx);ok(r.g.length>=1,'충전 중 발광 t='+t.toFixed(2));}
 ok(keys.size===2,'충전 동안 몸 키프레임 2개(모음·웅크림) '+[...keys]);ok(frames.size>=6,'충전 동안 시트 칸 6개 이상 넘어감 '+frames.size);
 e.r170Tower.casts=1;e.r170Tower.next=16;let r=run(S,e,10.01);ok(bodyOf(r).sy>1.05&&bodyOf(r).sx<1,'발사 순간 뻗음(세로↑) '+JSON.stringify(bodyOf(r)));ok(sheetOf(r).length===1&&sheetOf(r)[0].sx===7*128,'발사 순간 마지막 칸');
 ok(r.g.some(x=>x.alpha>.5),'발사 순간 번쩍');
 r=run(S,e,10.01+.15);ok(bodyOf(r).sy<1&&bodyOf(r).sx>1&&bodyOf(r).sy>.95,'되돌림 키프레임 '+JSON.stringify(bodyOf(r)));
 r=run(S,e,10.01+.3);ok(bodyOf(r).sx===1&&bodyOf(r).sy===1&&sheetOf(r).length===0,'0.26초 뒤 제자리');
 // 경계: 충전 창 바로 바깥(1.3초 + ε) / 안쪽
 e.r170Tower.next=20;r=run(S,e,20-1.3-.001);ok(bodyOf(r).sx===1,'경계: 1.3초+ε 앞은 충전 아님');r=run(S,e,20-1.3+.001);ok(bodyOf(r).sx!==1,'경계: 1.3초 안쪽은 충전');
 // 영웅이 11칸 밖이면 충전 모션 없음(탑도 쏘지 않음)
 S.sb.player.x=30;r=run(S,e,19.5);ok(bodyOf(r).sx===1&&sheetOf(r).length===0,'영웅 11칸 밖이면 모션 없음');S.sb.player.x=3;
 // 죽은 탑
 e.hp=0;r=run(S,e,19.5);ok(bodyOf(r).sx===1&&sheetOf(r).length===0&&r.g.length===0,'죽은 탑엔 아무것도 없음');e.hp=100;
 // 끔
 API.set({on:false});r=run(S,e,19.5);ok(bodyOf(r).sx===1&&sheetOf(r).length===0,'끄면 아무것도 없음');API.set({on:true});
 ok(S.calls.every(x=>!x.nan)&&S.glows.every(x=>!x.nan),'NaN 없음');ok(API.inspect().stats.errors===0,'오류 0 '+API.inspect().lastError);}
// 2) 엔진 원거리(r75Tower): rangedWindup .55 → 0 이 되는 순간이 발사
{const S=sandbox();const e={id:'m',x:0,y:0,hp:50,maxHp:50,r75Tower:true,ai:'ranged',rangedWindup:0};const keys=new Set(),frames=new Set();
 let t=1;run(S,e,t);for(let w=.55;w>0;w-=.05){t+=.05;e.rangedWindup=w;const r=run(S,e,t);keys.add(bodyOf(r).sy);for(const s of sheetOf(r))frames.add(s.sx);}
 e.rangedWindup=0;t+=.05;let r=run(S,e,t);keys.add(bodyOf(r).sy);ok(bodyOf(r).sy>1.05,'윈드업 끝 = 뻗음');t+=.15;r=run(S,e,t);keys.add(bodyOf(r).sy);t+=.2;r=run(S,e,t);keys.add(bodyOf(r).sy);
 ok(keys.size>=4,'엔진 원거리 공격 한 번에 몸 키프레임 4개 이상(1 포함) '+[...keys]);ok(frames.size>=3,'시트 칸 3개 이상 '+frames.size);ok(bodyOf(r).sy===1,'끝나면 제자리');}
// 3) R251 소환진·stationary·turret 는 고정형, 고정형 아닌 몹·영웅은 아님
{const S=sandbox(),API=S.sb.__STORYWORLD_FIXED_ATTACK_R1230__;
 ok(API.fixed({r251Circle:{}})&&API.fixed({stationary:true})&&API.fixed({turret:true})&&API.fixed({r75Tower:true})&&API.fixed({r170Tower:{}}),'고정형 판정');
 ok(!API.fixed({ai:'ranged'})&&!API.fixed({hero:true,stationary:true})&&!API.fixed({rooted:true})&&!API.fixed(null),'고정형 아님(일반 몹·영웅·잠깐 묶인 몹·null)');
 const m={id:'n',x:0,y:0,hp:50,ai:'ranged',rangedWindup:.3};const r=run(S,m,1);ok(bodyOf(r).sx===1&&sheetOf(r).length===0,'고정형 아닌 몹은 그대로');
 const c={id:'c',x:0,y:0,hp:50,r251Circle:{next:2,casts:0},r75Tower:true};const r2=run(S,c,1.5);ok(bodyOf(r2).sx!==1&&sheetOf(r2).length===1,'소환진 충전 모션');
 // 시간이 거꾸로 가면(저장 불러오기·지역 이동) 발사 기억을 지움
 c.r251Circle.casts=1;c.r251Circle.next=8;run(S,c,2.01);const r3=run(S,c,.5);ok(bodyOf(r3).sx===1,'시간이 되감기면 남은 발사 모션 없음');
 // 시트가 아직 안 읽혔으면 몸 모션·발광만(오류 없이)
 S.sb.readyImage=()=>null;const r4=run(S,c,7.5);ok(bodyOf(r4).sx!==1&&sheetOf(r4).length===0&&r4.g.length>0,'시트 없을 때 몸·발광만');ok(API.inspect().stats.errors===0,'오류 0');}
console.log('R1230 CPU PASS',pass);
