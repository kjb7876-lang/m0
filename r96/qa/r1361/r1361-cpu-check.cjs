// R1361 CPU 검사 — 탐식 베엘제붑(b04-boss) R1263 '탐식의 만찬' 프라이팬이 떨어진 자리에 Dots SW-R1352 D10-04 팬 먹 튐(24칸)을 재생
//  코디네이터 배정 2026-11-27 06:25Z(Dots D 이펙트 시트는 게임 적용 — 사용자 지시). D10-04 는 날아가는 팬이 아니라 팬이 떨어진 자리의 기름빛 먹결 튐(target-side, 판정 없음).
//  비행 그림(pan8)은 그대로, 바닥 예고 없음(떨어진 뒤에만), 피해·판정 그대로.
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),F='sin-skills-r1263.js';let n=0;
const ok=(c,m,d)=>{if(!c)console.log('FAIL '+m,d===undefined?'':JSON.stringify(d).slice(0,400));assert(c,m);n++;console.log('PASS '+m);};
const src=fs.readFileSync(path.join(R,'client-source',F),'utf8');ok(src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8'),'runtime-text 사본 같음');
const A='assets/r1361/pan-splash24.webp',man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');
ok(src.includes(A)&&fs.existsSync(path.join(R,'runtime-text',A))&&man.includes(A),'Dots 팬 먹 튐 시트 파일·코드·manifest');
const idxP=path.join(R,'runtime-text/assets/r1361/index.json');ok(fs.existsSync(idxP),'시트 표 있음');const c=JSON.parse(fs.readFileSync(idxP,'utf8'))['pan-splash24'];
ok(c&&c.frames===24&&c.cols===12&&c.final===true&&/SW-R1352-D10-04/.test(c.source)&&/574f0db5/.test(c.dotsSha256||''),'시트 표: 24칸·12×2·정식·Dots 원본 SHA',c);
ok(c.cell[0]*c.cols<=4096&&c.cell[1]*Math.ceil(c.frames/c.cols)<=4096,'4096 한도');
{const b=fs.readFileSync(path.join(R,'runtime-text',A));ok(crypto.createHash('sha256').update(b).digest('hex')===c.sha256&&b.length===c.bytes,'시트 해시·크기 표와 같음');}
ok(fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'assets/r1361/'"),'verify-r96-public 자산 접두사');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1361/r1361-cpu-check.cjs'),'pages.yml CPU 검사 줄');
// ---- 샌드박스(R1263 검사와 같은 틀) ----
const SHAPES=['arc','ellipse','fillRect','strokeRect','lineTo','stroke','fill','rect','quadraticCurveTo','bezierCurveTo'];
function sandbox(o={}){const calls={hurt:[],imgs:[],shapes:0,scopes:[],perFrame:[]};
 const ctx=new Proxy({},{get:(ob,k)=>k in ob?ob[k]:(typeof k==='string'&&!['globalAlpha','lineWidth','strokeStyle','fillStyle','globalCompositeOperation','filter'].includes(k)?((...a)=>{if(SHAPES.includes(k))calls.shapes++;if(k==='drawImage')calls.imgs.push({src:a[0]&&a[0].src,t:sb.time,sx:a[1],sy:a[2]});}):undefined),set:(ob,k,v)=>{ob[k]=v;return true;}});
 ctx.scope=(q,fn)=>{calls.scopes.push(q);fn();};const player={x:10,y:10,hp:100};
 const sb={window:{},localStorage:{store:{},getItem(k){return this.store[k]??null;},setItem(k,v){this.store[k]=v;}},time:0,started:true,loading:false,modal:false,storyScene:null,player,ctx,room:{id:'ep1b04',enemies:[]},effects:[],TILE:34,zoom:.667,
  project:(x,y)=>({x:(x-y)*22+480,y:(x+y)*11+270}),actorHeight:()=>60,readyImage:p=>({image:{src:p,width:3072,height:512,naturalWidth:3072,naturalHeight:512}}),
  blocked:(x,y,r=.27)=>x-r<1||y-r<1||x+r>39||y+r>39,hurt:(d,s)=>{calls.hurt.push([d,s&&s.r1263part]);return 'hit';},drawEffect(){},tick(){},settings:{},Math,JSON,String,Object,Number,Array,Set,Map,WeakMap,Promise,console};
 sb.window.window=sb.window;vm.createContext(sb);vm.runInContext(src,sb);return {sb,calls,player,A:sb.window.__STORYWORLD_SIN_SKILLS_R1263__};}
const boss=()=>({id:'Bg',boss:true,hp:1000,maxHp:1000,damage:20,spawnState:'active',x:14,y:12,radius:.6,nativeId:'b04-boss',name:'최고급 호텔의 총주방장 · 탐식의 귀 베엘제붑'});
const run=(S,secs,dt=1/30,each)=>{for(let i=0;i<Math.round(secs/dt);i++){S.sb.time+=dt;S.sb.tick(dt);const m=S.sb.effects.find(x=>x&&x.type==='r1263-fx');if(m){const i0=S.calls.imgs.length;S.sb.drawEffect(m);S.calls.perFrame.push(S.calls.imgs.length-i0);}if(each)each(S,i);}};
{const S=sandbox(),A=S.A,b=boss();S.sb.room.enemies.push(b);S.player.x=b.x-6;S.player.y=b.y;let land=null;
 run(S,A.tune.first+9,1/30,()=>{const i=A.inspect();if(land===null&&i.panSplashes>0)land=S.sb.time;});
 const sp=S.calls.imgs.filter(d=>/pan-splash24/.test(d.src));
 ok(land!==null&&sp.length>=20,'프라이팬이 떨어진 자리마다 Dots 먹 튐을 그림',{land,n:sp.length});
 ok(sp.every(d=>d.t>=land-1e-9),'떨어지기 전에는 그리지 않음(바닥 예고 없음)');
 const cells=new Set(sp.map(d=>d.sx+','+d.sy));ok(cells.size>=12,'24칸 격자에서 여러 칸을 차례로 재생(12×2)',cells.size);
 ok(S.calls.imgs.some(d=>/pan8/.test(d.src)),'날아가는 팬 그림(pan8)은 그대로');
 ok(S.calls.shapes===0,'코드 도형 0');ok(Math.max(...S.calls.perFrame)<=70,'한 화면 그림 호출 ≤ 70(R1263 상한)',Math.max(...S.calls.perFrame));
 ok(S.calls.scopes.filter(q=>/pansplash/.test(q.id)).every(q=>q.kind==='effect'&&q.groundAligned===false&&q.enemy===true),'적 이펙트·세워 그림');
 ok(A.inspect().casts>=1&&!A.inspect().casting,'시전이 튐 재생까지 마치고 정리됨',A.inspect());}
// 식칼(blade)은 튐 없음 — 프라이팬만
{const S=sandbox(),A=S.A,b=boss();S.sb.room.enemies.push(b);S.player.x=b.x-6;S.player.y=b.y;let maxS=0;run(S,A.tune.first+3,1/30,()=>{maxS=Math.max(maxS,A.inspect().panSplashes||0);});
 ok(maxS>=1&&maxS<=3,'팬 수(5자루 중 홀수 칸 2개)만큼만 튐',maxS);}
console.log('R1361 CPU '+n+' PASS');
