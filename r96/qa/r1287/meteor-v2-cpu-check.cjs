'use strict';
// R1287 CPU 검사 — 보스 운석(R241) v2 시트 교체 · 보스 고유색 · 크기 2배 · 쿨타임 2배 · 피해 3배 (사용자 2026-11-21).
//  화면 운석은 R1229 swapMeteors 가 렌더 명령 단계에서 시트 칸으로 바꾼다 → 그 자리에서 v2 로.
//  기존 지면 예고(옛 시트 바닥 고리, 판정 반지름 크기)·판정 반지름·예고 시간·최대 6발은 그대로.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d).slice(0,500):'');}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const V2='assets/r1287/boss-meteor-v2.webp',OLD='assets/r411/fx/boss-meteor.webp';
// ── 자산·연결 ──
{const p=path.join(R,'runtime-text',V2);ok(fs.existsSync(p),'v2 시트 파일 있음',V2);
 if(fs.existsSync(p)){const b=fs.readFileSync(p);ok(b.slice(0,4).toString()==='RIFF'&&b.slice(8,12).toString()==='WEBP','webp 형식');ok(b.length<400000,'v2 시트 400KB 미만(Pages 예산)',b.length);
  // VP8X 캔버스 크기(24비트 -1)
  const i=b.indexOf('VP8X');if(i>0){const w=1+b.readUIntLE(i+12,3),h=1+b.readUIntLE(i+15,3);ok(w===2304&&h===1536,'v2 시트 2304×1536 (384칸 6×4)',{w,h});}else ok(false,'VP8X(알파) 머리 있음');}
 const tp=rd(path.join(R,'runtime-inputs.json'));ok(tp.includes(V2),'runtime-inputs 에 v2 시트');
 ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1287/meteor-v2-cpu-check.cjs'),'pages.yml CPU 검사 줄');
 ok(fs.existsSync(path.join(R,'runtime-text',OLD)),'옛 시트(지면 예고 고리용) 남아 있음');}
// ── R1229: v2 프레임·명령 ──
const N='motion-fx-r1229.js',SRC=rd(path.join(R,'client-source',N));
ok(SRC===rd(path.join(R,'runtime-text',N)),'R1229 runtime-text 사본 같음');
function imgOf(p,w,h){return {src:p,naturalWidth:w,naturalHeight:h,width:w,height:h};}
function boot(ready){const sb={console,Math,JSON,Object,Array,Number,String,Boolean,Error,Set,Map,WeakMap,Promise,RegExp,Date,
 localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>1,time:0,room:{enemies:[]},hazards:[],projectiles:[],actorHeight:()=>60,project:(x,y)=>({x:x*30,y:y*30}),
 readyImage:p=>ready[p]?{image:ready[p]}:null,ensureImages:()=>Promise.resolve()};
 sb.window=sb;sb.tick=function(){};sb.releaseImageMemory=function(){};vm.createContext(sb);vm.runInContext(SRC,sb,{filename:N});return sb;}
const both={[V2]:imgOf(V2,2304,1536),[OLD]:imgOf(OLD,1536,1024)};
const sb=boot(both),A=sb.__STORYWORLD_MOTION_FX_R1229__;
ok(!!A&&typeof A.meteorV2Frame==='function'&&typeof A.meteorCmds==='function'&&typeof A.meteorTint==='function','API meteorV2Frame·meteorCmds·meteorTint');
if(A&&typeof A.meteorV2Frame==='function'&&typeof A.meteorCmds==='function'&&typeof A.meteorTint==='function'){
 // 프레임: 낙하 0~11 은 착탄 직전 0.5초, 12 는 h.age>=h.warning 에서 첫 표시, 12~23 은 0.45초, 단조 증가
 const h={warning:1.5,life:1.95};const F=t=>A.meteorV2Frame({...h,age:t});
 ok(F(0)===-1&&F(.99)===-1,'예고 앞부분(낙하 0.5초 전)에는 운석 없음(-1)',[F(0),F(.99)]);
 ok(F(1.0)===0&&F(1.499)===11,'낙하 0→11 은 착탄 직전 0.5초',[F(1.0),F(1.499)]);
 ok(F(1.5)===12&&F(1.95)===23&&F(1.9499)>=22,'착탄 순간 12, 끝 23',[F(1.5),F(1.9499),F(1.95)]);
 let prev=-2,mono=true;for(let t=0;t<=1.95;t+=.01){const f=F(t);if(f<prev)mono=false;prev=f;}ok(mono,'프레임 단조 증가');
 ok(A.meteorV2Frame({warning:.3,life:.75,age:0})===0,'예고가 0.5초보다 짧으면 처음부터 낙하');
 // 명령
 const tpl={kind:'image',owner:{id:'r241:x'},style:{globalAlpha:.5},order:3};
 const mk=(age,pal)=>({id:7,x:10,y:10,radius:1.25,warning:1.5,life:1.95,age,r241Meteor:{pal:{main:{a:[150,24,30],b:pal||[255,150,110]},sub:{a:[70,14,20],b:[200,90,80]}}}});
 const q={x:300,y:300},unit=30,dia=Math.max(60*.9,2*1.25*unit);
 // 예고 앞부분: 지면 고리만
 let cs=A.meteorCmds(mk(.5),tpl);
 ok(Array.isArray(cs)&&cs.length===1&&cs[0].sourcePath===OLD,'예고 앞부분: 옛 시트 지면 고리 하나만',cs&&cs.map(c=>c.sourcePath));
 if(cs&&cs[0]){const c=cs[0],[sx,sy,sw,sh]=c.sourceRect;ok(sw===256&&sy%256>=150&&sy%256+sh<=236&&sx%256===0,'고리는 옛 칸 아래 띠만(옛 운석 바위 안 섞임)',c.sourceRect);
  const w=c.points[1][0]-c.points[0][0];ok(Math.abs(w-256*dia/104)<1e-6,'고리 크기 = 판정 지름 그대로(2배 아님)',{w,want:256*dia/104});}
 // 낙하 중: 고리 + v2
 cs=A.meteorCmds(mk(1.3),tpl);const v=cs&&cs.find(c=>c.sourcePath===V2),ring=cs&&cs.find(c=>c.sourcePath===OLD);
 ok(cs&&cs.length===2&&!!v&&!!ring&&cs.indexOf(ring)<cs.indexOf(v),'낙하 중: 고리(아래) + v2 운석(위)',cs&&cs.map(c=>c.sourcePath));
 if(v){const [sx,sy,sw,sh]=v.sourceRect,fr=A.meteorV2Frame(mk(1.3)),cx=(fr%6)*384,cy=Math.floor(fr/6)*384;/* 칸 384 행 우선, 투명 여백은 잘라 그린다(모바일 채우기 비용) */
  ok(sx>=cx&&sy>=cy&&sx+sw<=cx+384&&sy+sh<=cy+384&&sw>40&&sh>40,'v2 칸 384 행 우선 안에서만 자름',{r:v.sourceRect,cx,cy});
  const s=(v.points[1][0]-v.points[0][0])/sw,s2=(v.points[2][1]-v.points[1][1])/sh;ok(Math.abs(s-dia/56)<1e-9&&Math.abs(s2-dia/56)<1e-9,'v2 크기 = 기존(옛 시트) 보이는 운석의 2배(칸 1px = 판정지름/56)',{s,s2,want:dia/56});
  const px=v.points[0][0]+(cx+163-sx)*s,py=v.points[0][1]+(cy+276-sy)*s;ok(Math.abs(px-q.x)<1e-6&&Math.abs(py-q.y)<1e-6,'착탄 피벗 (163,276) = 월드 착탄점',{px,py});
  ok(v.key==='r1229:meteor:7'&&v.owner.id==='r241:7'&&v.style.globalAlpha===1&&v.style.globalCompositeOperation==='source-over','키·owner·알파 고정(메시 재사용)');}
 // 착탄 뒤: v2 만(고리 사라짐)
 cs=A.meteorCmds(mk(1.7),tpl);ok(cs&&cs.length===1&&cs[0].sourcePath===V2&&cs[0].sourceRect[1]>=768,'착탄 뒤: 고리 없이 v2 폭발(12~23)',cs&&cs.map(c=>[c.sourcePath,c.sourceRect]));
 // 고유색: 주황(원색) = 필터 없음, 푸른 보스 = hue-rotate, 무채색 = grayscale, 검은(어두운 보라 발광) = hue-rotate+어둡게
 const tOr=A.meteorTint([255,150,110]),tBl=A.meteorTint([150,200,255]),tGr=A.meteorTint([225,225,225]),tDk=A.meteorTint([150,96,190]);
 ok(tOr==='none','주황 보스: 필터 없음',tOr);
 ok(/hue-rotate\(-?\d+deg\)/.test(tBl)&&!/grayscale/.test(tBl),'푸른 보스: hue-rotate',tBl);
 ok(/grayscale\(/.test(tGr)&&!/hue-rotate/.test(tGr),'무채색 보스: grayscale(색 돌리기 없음)',tGr);
 ok(/hue-rotate/.test(tDk)&&/brightness\(0?\.\d+\)/.test(tDk),'검은 보스(보라 발광): hue-rotate + 어둡게',tDk);
 ok([tOr,tBl,tGr,tDk].every(t=>!/drop-shadow|blur/.test(t)),'기록기 허용 필터만');
 cs=A.meteorCmds(mk(1.3,[150,200,255]),tpl);ok(cs&&cs.length===2&&cs.every(c=>c.style.filter===tBl),'고리·운석 같은 고유색 필터',cs&&cs.map(c=>c.style.filter));
 // v2 못 받았으면 예전(옛 시트 24칸) 그대로
 const sb2=boot({[OLD]:both[OLD]}),A2=sb2.__STORYWORLD_MOTION_FX_R1229__;const c2=A2.meteorCmds(mk(1.3),tpl);
 ok(c2&&c2.length===1&&c2[0].sourcePath===OLD&&c2[0].sourceRect[2]===256&&c2[0].sourceRect[3]===256,'v2 미로드: 옛 시트 24칸 fallback',c2&&c2.map(c=>c.sourceRect));
 ok(A.inspect().stats.errors===0,'오류 0',A.inspect().lastError);}
// ── R241: 피해 3배·쿨타임 2배, 판정 그대로 ──
{const src=rd(path.join(R,'client-source','boss-meteor-r241.js'));ok(src===rd(path.join(R,'runtime-text','boss-meteor-r241.js')),'R241 사본 같음');
 function mk(){const s={console,Math,JSON,Number,String,Object,Array,WeakMap,Map,Date,localStorage:{getItem:()=>null,setItem(){}},window:{},setTimeout:()=>0,time:10,uid:100,hazards:[],
  player:{x:20,y:20},room:{engaged:true,enemies:[]},modal:null,loading:false,blocked:()=>false,clearLine:()=>true,maxHP:()=>777,project:(x,y)=>({x:x*10,y:y*10}),actorHeight:()=>60,sound(){},tick(){},effects:[],drawEffect(){},drawHazard(){}};
  s.window.__STORYWORLD_BOSS_FIELDS_R62__=Object.freeze({prepare:()=>({native:true}),ownerState:()=>({next:11})});vm.createContext(s);vm.runInContext(src,s);return s;}
 const s=mk(),B=s.window.__STORYWORLD_BOSS_FIELDS_R62__;const boss={id:'b',boss:true,hp:100,maxHp:100,spawnState:'active',damage:30,x:22,y:20};
 B.prepare(boss);const hz=s.hazards.filter(h=>h.r241Meteor);
 ok(hz.length===6&&hz.every(h=>h.radius===1.25&&h.warning>=1.25&&h.warning<=1.95&&Math.abs(h.life-h.warning-.45)<1e-9),'6발·반지름 1.25·예고·수명 그대로',hz.map(h=>h.radius));
 ok(hz.every(h=>Math.abs(h.damage-3*Math.max(27,777*.06))<1e-9),'피해 3배 = 3×max(보스×0.9, 최대체력 6%)',hz.map(h=>h.damage));
 const hpLow={...boss,id:'c',damage:1};const s3=mk();s3.window.__STORYWORLD_BOSS_FIELDS_R62__.prepare(hpLow);ok(s3.hazards.every(h=>Math.abs(h.damage-3*777*.06)<1e-9),'피해 바닥값도 3배',s3.hazards.map(h=>h.damage));
 s.time=21.9;ok(!B.prepare(boss),'12초 안 다시 시전 안 함(쿨 6→12초)');s.time=22.1;ok(!!B.prepare(boss),'12초 뒤 시전');
 // 자체 순환: 다음 시전 = (8-2×분노)×2 초 뒤
 const s4=mk();const b4={id:'d',boss:true,hp:100,maxHp:100,spawnState:'active',x:22,y:20};s4.room.enemies.push(b4);s4.time=20;s4.tick(1/30);s4.time=26;s4.tick(1/30);const n1=s4.hazards.length;
 s4.time=26+15.9;s4.tick(1/30);const n2=s4.hazards.length;s4.time=26+16.1;s4.tick(1/30);const n3=s4.hazards.length;
 ok(n1===6&&n2===6&&n3===12,'자체 순환 체력 가득 16초(예전 8초)',{n1,n2,n3});
 const s5=mk();const b5={id:'e',boss:true,hp:1,maxHp:100,spawnState:'active',x:22,y:20};s5.room.enemies.push(b5);s5.time=20;s5.tick(1/30);s5.time=26;s5.tick(1/30);s5.time=26+11.9;s5.tick(1/30);const m2=s5.hazards.length;s5.time=26+12.1;s5.tick(1/30);
 ok(m2===6&&s5.hazards.length===12,'체력 바닥 12초(예전 6초)',{m2,m3:s5.hazards.length});}
console.log(`R1287 CPU ${n-bad}/${n}`);process.exit(bad?1:0);
