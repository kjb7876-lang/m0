// R1263 CPU 검사 — 7대죄 보스 스킬을 서사 문장대로(프레임 애니메이션 이펙트만) — sin-skills-r1263.js
//  사용자 2026-11-20 03:27Z: 탐식(주방 살점·식칼·프라이팬·독가스) / 색욕(하이힐 공격·매혹의 빛·칼끝이 내 목으로) /
//   분노(불길·곰→늑대 무리→용) / 생체 부트로더(설원 아래 검은 전선·죽은 동료 환영) "텍스트에 맞게 7대죄 보스들 스킬 연출 프레임애니메이션이펙트로"
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),F='sin-skills-r1263.js';let n=0;
const ok=(c,m,d)=>{if(!c)console.log('FAIL '+m,d===undefined?'':JSON.stringify(d).slice(0,400));assert(c,m);n++;console.log('PASS '+m);};
const srcPath=path.join(R,'client-source',F);ok(fs.existsSync(srcPath),'오버레이 파일 있음');
const src=fs.readFileSync(srcPath,'utf8');
ok(src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8'),'runtime-text 사본 같음');
// ---- 빌드 연결 ----
const html=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8'),t=s=>html.indexOf('<script src="./'+s+'"></script>');
ok(t(F)>0&&t(F)>t('boss72-shadows-r1241.js')&&t(F)<t('boot-lean-r1038.js')&&/\n<script src="\.\/sin-skills-r1263\.js"><\/script>\n/.test(html),'index.html: 자기 줄, boss72-shadows-r1241 뒤·boot-lean-r1038 앞');
ok(fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'"+F+"'"),'verify-r96-public 기대 목록');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1263/r1263-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');ok(man.includes('"'+F+'"')||man.includes('/'+F+'"'),'runtime-manifest 에 들어감');
const idx=JSON.parse(fs.readFileSync(path.join(R,'runtime-text/assets/r1263/index.json'),'utf8'));
const SHEETS=['utensils8','gas24','charm-orb8','charm-mark12','bear8','wolf8','dragon8','fire24','wire9','phantom12','bill8','coin12'];
for(const k of SHEETS){const a='assets/r1263/'+k+'.webp';ok(src.includes(a)&&fs.existsSync(path.join(R,'runtime-text',a))&&man.includes(a),'프레임 시트 있음·manifest: '+a);
 ok(idx[k]&&idx[k].frames>=6&&idx[k].final===false&&idx[k].source,'시트 표: '+k+' 6칸 이상·원천 기록·임시(최종 아님) 표시',idx[k]);}
ok(!/drop-shadow|blur\(/.test(src),'게임 ctx.filter 에 drop-shadow·blur 안 씀');
// ---- 샌드박스 ----
const SHAPES=['arc','ellipse','fillRect','strokeRect','lineTo','stroke','fill','rect','quadraticCurveTo','bezierCurveTo'];
function sandbox(o={}){
 const calls={hurt:[],imgs:[],shapes:0,perFrame:[]};
 const ctx=new Proxy({},{get:(ob,k)=>k in ob?ob[k]:(typeof k==='string'&&!['globalAlpha','lineWidth','strokeStyle','fillStyle','globalCompositeOperation','filter'].includes(k)?((...a)=>{if(SHAPES.includes(k))calls.shapes++;if(k==='drawImage')calls.imgs.push(a[0]&&a[0].src);}):undefined),set:(ob,k,v)=>{ob[k]=v;return true;}});
 calls.scopes=[];ctx.scope=(q,fn)=>{calls.scopes.push(q);fn();};
 const player={x:10,y:10,hp:100,invincible:0};const walls=o.walls||(()=>false);
 const sb={window:{},localStorage:{store:{},getItem(k){return this.store[k]??null;},setItem(k,v){this.store[k]=v;}},time:0,started:true,loading:false,modal:false,storyScene:null,player,ctx,room:{id:'ep1b04',enemies:[]},effects:[],W:960,H:540,TILE:34,zoom:.667,
  project:(x,y)=>({x:(x-y)*22+480,y:(x+y)*11+270}),actorHeight:()=>60,readyImage:p=>({image:{src:p,width:2048,height:256,naturalWidth:2048,naturalHeight:256}}),
  blocked:(x,y,r=.27)=>x-r<1||y-r<1||x+r>39||y+r>39||walls(x,y),hurt:(d,s)=>{calls.hurt.push([d,s&&s.r1263]);player.hp-=0;return 'hit';},
  drawEffect(){},tick(dt){},settings:{},Math,JSON,String,Object,Number,Array,Set,Map,WeakMap,Promise,console};
 sb.window.window=sb.window;vm.createContext(sb);vm.runInContext(src,sb);return {sb,calls,player,A:sb.window.__STORYWORLD_SIN_SKILLS_R1263__};}
const BOSSES={gluttony:{nativeId:'b04-boss',name:'최고급 호텔의 총주방장 · 탐식의 귀 베엘제붑',room:'ep1b04'},lust:{nativeId:'b05-boss',name:'붉은 하이힐',room:'ep1b05'},
 wrath:{nativeId:'b07-boss',name:'불을 지른 청소부 · 분노의 귀',room:'ep1b07'},boot:{nativeId:'b09-boss',name:'사이보그 회장 · 생체 부트로더',room:'ep1b09'},
 greed:{nativeId:'b06-boss',name:'회장에게 고용된 총지배인 · 맘몬',room:'ep1b06'}};
const boss=(k,o={})=>({id:'B'+k,boss:true,hp:1000,maxHp:1000,damage:20,spawnState:'active',x:14,y:12,radius:.6,...BOSSES[k],...o});
const run=(S,secs,dt=1/30,each)=>{for(let i=0;i<Math.round(secs/dt);i++){S.sb.time+=dt;S.sb.tick(dt);const m=S.sb.effects.find(x=>x&&x.type==='r1263-fx');if(m){const i0=S.calls.imgs.length;S.sb.drawEffect(m);S.calls.perFrame.push(S.calls.imgs.length-i0);}if(each)each(S,i);}};
{const S=sandbox(),A=S.A;ok(!!A&&typeof A.which==='function'&&typeof A.inspect==='function','API window.__STORYWORLD_SIN_SKILLS_R1263__');
 for(const k of Object.keys(BOSSES))ok(A.which(boss(k))===k,'보스 알아봄: '+k);
 for(const e of [{nativeId:'b06b-boss',name:'소년이 된 총지배인 · 맘몬'},{nativeId:'b02-boss',name:'나태에 잠식된 남자'},{nativeId:'mb-ep1b04',name:'폐기주방 감독'},{nativeId:'b08-boss',name:'백색 정장의 호텔 그룹 회장'},{name:'유리망령'},null])
  ok(A.which(e)===null,'다른 적·소년 맘몬(다른 장)·나태(R1258)는 아님: '+(e&&e.name));
 const U=A.tune;ok(U.cd>=11,'재사용 11초 이상',U.cd);ok(U.cap<=1.5,'한 시전 총 피해 ≤ 보스 근접 1.5대',U.cap);ok(U.first>=3,'교전 뒤 첫 시전 3초 이상',U.first);}
for(const k of Object.keys(BOSSES)){
 // 가만히 서 있는 영웅: 맞되 상한 안, 시트만 그림(도형 0), 자기 시트 씀
 {const S=sandbox(),A=S.A,b=boss(k);S.sb.room.id=b.room;S.sb.room.enemies.push(b);
  run(S,A.tune.first+9);const ins=A.inspect();ok(ins.casts>=1,k+': 교전 뒤 시전',ins);
  const tot=S.calls.hurt.reduce((s,h)=>s+h[0],0);ok(S.calls.hurt.length>=1&&S.calls.hurt.every(h=>h[1]===k),k+': 서 있으면 맞음(자기 스킬 이름표)',S.calls.hurt);
  ok(tot<=b.damage*A.tune.cap*ins.casts+1e-6,k+': 시전당 총 피해 ≤ 상한',{tot,casts:ins.casts});
  ok(S.calls.shapes===0,k+': 코드 도형(원·선·사각형) 0 — 프레임 시트만',S.calls.shapes);
  const used=new Set(S.calls.imgs.map(p=>String(p).replace(/^.*r1263\//,'').replace('.webp','')));
  const need={gluttony:['utensils8','gas24'],lust:['charm-orb8','charm-mark12'],wrath:['bear8','wolf8','dragon8','fire24'],boot:['wire9','phantom12'],greed:['bill8','coin12']}[k];
  ok(need.every(s=>used.has(s)),k+': 서사 장면 시트 모두 그림 '+need.join('·'),[...used]);
  ok(Math.max(...S.calls.perFrame)<=70,k+': 한 화면 그림 호출 ≤ 70',Math.max(...S.calls.perFrame));
  ok(S.calls.scopes.every(q=>q.kind==='effect'&&q.groundAligned===false),k+': 바닥 예고 장판 없음(모두 세워 그림)',S.calls.scopes.filter(q=>q.groundAligned!==false).slice(0,3));}
 // 멀리 있으면 시전 안 함
 {const S=sandbox(),A=S.A,b=boss(k,{x:35,y:35});S.sb.room.enemies.push(b);S.player.x=3;S.player.y=3;run(S,A.tune.first+6);ok(A.inspect().casts===0&&S.calls.hurt.length===0,k+': 멀면 시전 안 함');}
 // 끄기·죽음·서사 장면 멈춤
 {const S=sandbox(),A=S.A,b=boss(k);S.sb.room.enemies.push(b);A.set({on:false});run(S,A.tune.first+6);ok(A.inspect().casts===0,k+': 끄면 안 함');}
 {const S=sandbox(),A=S.A,b=boss(k);S.sb.room.enemies.push(b);run(S,A.tune.first+.3);ok(A.inspect().casting,k+': 시전 중');b.hp=0;run(S,.2);ok(!A.inspect().casting,k+': 보스 죽으면 즉시 멈춤');}
 {const S=sandbox(),A=S.A,b=boss(k);S.sb.room.enemies.push(b);S.sb.storyScene={};run(S,A.tune.first+6);ok(A.inspect().casts===0,k+': 서사 장면 중엔 멈춤');}
}
// 색욕: 매혹의 빛에 맞으면 보스 쪽으로 끌려가되(칼끝이 내 목으로) 벽은 못 뚫고 2초 안에 풀림
{const S=sandbox({walls:(x,y)=>x>11.6&&x<12.4&&y>6&&y<9}),A=S.A,b=boss('lust',{x:14,y:7.5});S.sb.room.id='ep1b05';S.sb.room.enemies.push(b);S.player.x=9;S.player.y=7.5;
 let charmedAt=null,maxCharm=0,inWall=false;const d0=Math.hypot(b.x-9,b.y-7.5);let minD=d0;
 run(S,A.tune.first+6,1/30,()=>{const c=A.inspect().charm;if(c>0){charmedAt=charmedAt??S.sb.time;maxCharm=Math.max(maxCharm,c);}minD=Math.min(minD,Math.hypot(b.x-S.player.x,b.y-S.player.y));if(S.sb.blocked(S.player.x,S.player.y,.27))inWall=true;});
 ok(charmedAt!==null,'색욕: 매혹의 빛에 맞으면 매혹 걸림');ok(maxCharm<=2,'색욕: 매혹 2초 이하',maxCharm);ok(minD<d0-.3,'색욕: 보스 쪽으로 끌려감',{d0,minD});ok(!inWall,'색욕: 끌려가도 벽 안으로 안 들어감');}
// 분노: 곰 → 늑대 무리 → 용 순서
{const S=sandbox(),A=S.A,b=boss('wrath');S.sb.room.id='ep1b07';S.sb.room.enemies.push(b);const seq=[];
 run(S,A.tune.first+8,1/30,()=>{const ph=A.inspect().phase;if(ph&&seq[seq.length-1]!==ph)seq.push(ph);});
 ok(seq.join('>').includes('bear>wolves>dragon'),'분노: 곰 → 늑대 무리 → 용 순서',seq);}
// 부트로더: 전선이 보스에서 영웅 쪽으로 이어 솟고, 동료 환영 3명이 영웅 둘레에 나타남
{const S=sandbox(),A=S.A,b=boss('boot');S.sb.room.id='ep1b09';S.sb.room.enemies.push(b);let wires=0,ph=0;
 run(S,A.tune.first+6,1/30,()=>{const i=A.inspect();wires=Math.max(wires,i.wires||0);ph=Math.max(ph,i.phantoms||0);});
 ok(wires>=5,'부트로더: 검은 전선 5마디 이상',wires);ok(ph===3,'부트로더: 죽은 동료 환영 3',ph);}
// 맘몬: 지폐 6장 → 같은 뒷면 동전 11개(영웅 자리 1 + 둘레 10), 동전 사이에 피할 틈
{const S=sandbox(),A=S.A,b=boss('greed');S.sb.room.id='ep1b06';S.sb.room.enemies.push(b);let bills=0,coins=0;
 run(S,A.tune.first+6,1/30,()=>{const i=A.inspect();bills=Math.max(bills,i.bills||0);coins=Math.max(coins,i.coins||0);});
 ok(bills===6,'맘몬: 지폐 6장',bills);ok(coins===11,'맘몬: 동전 11개',coins);}
// 피하면 덜 맞음: 시전 시작 뒤 영웅이 멀리 비키면 피해 0
for(const k of Object.keys(BOSSES)){const S=sandbox(),A=S.A,b=boss(k);S.sb.room.enemies.push(b);run(S,A.tune.first+.1);
 S.player.x=30;S.player.y=36;run(S,6);ok(S.calls.hurt.length===0,k+': 시전 뒤 멀리 비키면 안 맞음',S.calls.hurt);}
console.log('R1263 CPU 검사 통과 '+n);
