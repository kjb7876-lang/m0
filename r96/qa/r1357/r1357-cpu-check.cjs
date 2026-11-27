// R1357 CPU 검사: Dots SW-R1352-D07 보스 광폭화 오라 시트를 R205 광폭화 보스 몸 뒤에 깐다(코드 붉은 타원 대체).
//  시트 규격·연결(index.html 순서·sync·verify·pages) + 그리기(기록기 명령 몸 앞 삽입·크기·피벗·반복·끄기·광폭화 아닐 때 안 그림).
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL '+m+(d!==undefined?' '+JSON.stringify(d):''));}else console.log('ok   '+m);};
const rd=p=>fs.readFileSync(p,'utf8');
const N='enrage-aura-r1357.js',SHEET='assets/r1357/boss-enrage-aura-d07-16.webp';
const S=rd(path.join(R,'client-source',N));ok(S===rd(path.join(R,'runtime-text',N)),'runtime-text 사본 같음');
// 시트
const buf=fs.readFileSync(path.join(R,'runtime-text',SHEET));
const sz=(()=>{const t=buf.toString('ascii',12,16);if(t==='VP8X')return[1+buf.readUIntLE(24,3),1+buf.readUIntLE(27,3)];if(t==='VP8L'){const b=buf.readUInt32LE(21);return[(b&0x3fff)+1,((b>>14)&0x3fff)+1];}return[buf.readUInt16LE(26)&0x3fff,buf.readUInt16LE(28)&0x3fff];})();
ok(buf.toString('ascii',0,4)==='RIFF'&&buf.toString('ascii',8,12)==='WEBP'&&sz[0]===4096&&sz[1]===256,'시트 webp 4096×256(16칸×256)',sz);
ok(buf.length<600000,'시트 600KB 미만',buf.length);
// 연결
const html=rd(path.join(R,'runtime-text','index.html'));const i205=html.indexOf('src="./boss-r205.js"'),iN=html.indexOf('src="./'+N+'"'),i118=html.indexOf('src="./combat-r118.js"');
ok(iN>0&&i205>0&&iN<i118&&/<script src="\.\/envy-glass-r1343\.js"><\/script>\n<script src="\.\/enrage-aura-r1357\.js"><\/script>\n/.test(html),'index.html: 자기 줄(envy-glass-r1343 다음), combat-r118 앞 — R205 가 바깥에서 감싸도 몸 바로 뒤에 깔림',{i205,iN,i118});
ok(rd(path.join(ROOT,'scripts','verify-r96-public.py')).includes(N),'공개 확인 기대 목록에 있음');
ok(rd(path.join(ROOT,'.github','workflows','pages.yml')).includes('r1357-cpu-check.cjs'),'pages.yml CPU 줄');
const man=rd(path.join(R,'runtime-manifest.json'));ok(man.includes(N)&&man.includes(SHEET),'runtime-manifest 에 js·시트');
const B205=rd(path.join(R,'client-source','boss-r205.js'));ok(/__STORYWORLD_ENRAGE_AURA_R1357__/.test(B205),'R205 붉은 타원은 R1357 오라가 그릴 때 건너뜀');
// 그리기
function world(store,have){const cmds=[];const sb={console,Date,Math,JSON,localStorage:{getItem:()=>store||null,setItem(){}},started:true,loading:false,time:0,zoom:1,ctx:{commands:cmds},
  project:(x,y)=>({x:x*32,y:y*16}),actorHeight:()=>60,readyImage:p=>(have===false?null:{image:{src:p,naturalWidth:4096,naturalHeight:256}}),ensureImages:()=>Promise.resolve()};sb.window=sb;
 sb.drawEnemy=function(e){/* 몸 그림 1장: 좌상(300,100) 폭 80 높이 120 → 발 y=220 *//* 몸 아래 바닥 고리(다른 owner, 더 아래까지) — 크기 재기에서 빠져야 함 */cmds.push({kind:'image',key:'ring:'+e.id,owner:{id:'r434:rank:'+e.id},image:{src:'ring.webp'},sourceRect:[0,0,256,256],imageSize:[256,256],points:[[280,190],[400,190],[400,260],[280,260]],clips:[],style:{globalAlpha:.6}});
 cmds.push({kind:'image',key:'body:'+e.id,owner:{id:'enemy:'+e.id,kind:'enemy'},image:{src:'body.webp'},sourceRect:[0,0,80,120],imageSize:[80,120],points:[[300,100],[380,100],[380,220],[300,220]],clips:[],style:{globalAlpha:1,filter:'none'},order:5});};
 vm.createContext(sb);vm.runInContext(S,sb);return sb;}
const boss={id:'b1',boss:true,x:10.625,y:13.75,hp:10,maxHp:100,r205Enraged:{at:0}};
{const sb=world(),A=sb.__STORYWORLD_ENRAGE_AURA_R1357__;ok(!!A&&typeof A.covers==='function','API');
 sb.drawEnemy(boss);const cs=sb.ctx.commands,a=cs.find(c=>c.sourcePath===SHEET),bi=cs.findIndex(c=>c.key==='body:b1');
 ok(!!a&&cs.indexOf(a)<bi,'광폭화 보스: 오라를 몸 그림 앞(뒤쪽 층)에 넣음',cs.map(c=>c.key));
 if(a){const [sx,sy,sw,sh]=a.sourceRect;ok(sx%256===0&&sw===256&&sh===256&&sy===0,'칸 256 하나',a.sourceRect);
  const s=(a.points[1][0]-a.points[0][0])/256;ok(Math.abs(s-120*1.1/139)<1e-9,'크기: 오라 불길 높이(139px) = 몸 높이 × 1.1',{s});
  const fx=a.points[0][0]+128*s,fy=a.points[0][1]+208*s;ok(Math.abs(fx-340)<1e-6&&Math.abs(fy-220)<1e-6,'피벗: 칸 (128,208) = 몸 가운데 발',{fx,fy});
  ok(a.style.globalAlpha<=1&&/saturate\(1\.[3-9]/.test(a.style.filter)&&/brightness\(1\.[3-9]/.test(a.style.filter)&&!/drop-shadow|blur/.test(a.style.filter),'시트 알파(≤144) 그대로 반투명, 어두운 바닥에서 보이게 채도·밝기만 올림(기록기 허용 필터)',a.style);
  ok(a.owner&&/^r1357:/.test(a.owner.id)&&a.owner.kind==='effect','owner 는 이펙트(몸 owner 와 다름)',a.owner);}
 ok(A.covers(boss)===true,'covers: 광폭화+시트 준비 → R205 붉은 타원 대신');
 const f=t=>{sb.time=t;sb.ctx.commands.length=0;sb.drawEnemy(boss);const c=sb.ctx.commands.find(c=>c.sourcePath===SHEET);return c?c.sourceRect[0]/256:-1;};
 const seen=new Set();for(let t=0;t<2;t+=.02)seen.add(f(t));ok(seen.size===16,'2초 안에 16칸 모두 돎(반복)',[...seen].sort((a,b)=>a-b));
 ok(f(0)===f(16/A.FPS),'16칸 뒤 처음 칸으로 이어짐(빈 칸 없음)');
 // 발록: R1229 가 렌더 단계에서 몸을 영웅 키 × 2.04(×1.66 크게) 로 다시 놓는다 → 오라도 그 키에 맞춤
 sb.__STORYWORLD_MOTION_FX_R1229__={isBalrog:e=>/발록/.test(e.name||''),inspect:()=>({prefs:{balrog:true,balrogBig:true}})};
 const bal={...boss,id:'bal',name:'발록 · 지옥의 문지기'};sb.ctx.commands.length=0;sb.drawEnemy(bal);const ab=sb.ctx.commands.find(c=>c.sourcePath===SHEET);
 if(ab){const s2=(ab.points[1][0]-ab.points[0][0])/256;ok(Math.abs(s2-60*2.04*1.66*1.1/139)<1e-9,'발록: 몸 키 = 영웅 키(60) × 2.04 × 1.66 기준',{s2});}else ok(false,'발록 오라 있음');
 sb.__STORYWORLD_MOTION_FX_R1229__=undefined;
 const calm={...boss,id:'b2',r205Enraged:null};sb.ctx.commands.length=0;sb.drawEnemy(calm);ok(!sb.ctx.commands.some(c=>c.sourcePath===SHEET)&&!A.covers(calm),'광폭화 아니면 안 그림');
 const dead={...boss,id:'b3',hp:0};sb.ctx.commands.length=0;sb.drawEnemy(dead);ok(!sb.ctx.commands.some(c=>c.sourcePath===SHEET),'죽은 보스는 안 그림');
 ok(A.inspect().errors===0,'오류 0',A.inspect().lastError);}
{const sb=world('{"on":false}'),A=sb.__STORYWORLD_ENRAGE_AURA_R1357__;sb.drawEnemy(boss);ok(!sb.ctx.commands.some(c=>c.sourcePath===SHEET)&&!A.covers(boss),'끄기 {on:false}: 안 그리고 R205 붉은 타원 그대로');}
{const sb=world(null,false),A=sb.__STORYWORLD_ENRAGE_AURA_R1357__;sb.drawEnemy(boss);ok(!sb.ctx.commands.some(c=>c.sourcePath===SHEET)&&!A.covers(boss),'시트 못 받으면 R205 붉은 타원 그대로');}
console.log(bad?`R1357 CPU FAIL ${bad}/${n}`:`R1357 CPU ${n}/${n}`);process.exit(bad?1:0);
