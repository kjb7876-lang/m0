// R1370b CPU 검사 — Dots SW-R1370 고품질 보라 암흑 구체(비행 12·적중 10·예고 8칸) 적용
//  사용자 2026-11-27 07:03Z "...프레임이펙트면 더 좋고" → Dots 납품(07:59Z) 적용
//  ① 시트 3장 배포·Dots 원본 SHA  ② 비행: 12칸 돌아가며, 머리(+x)가 진행 방향 4° 안, 회전 기준 (154,128)이 탄 자리 1.5px 안
//  ③ 예고: cast8 이 겨누기 진행(0→1)에 따라 0칸→7칸, 회전·도형 없음  ④ 적중: impact10  ⑤ 판정 그대로
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),F='dys-ranged-r1210.js';let n=0;
const ok=(c,m,d)=>{if(!c)console.log('FAIL '+m,d===undefined?'':JSON.stringify(d).slice(0,600));assert(c,m);n++;console.log('PASS '+m);};
const src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
ok(src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8'),'runtime-text 사본 같음');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1370b/r1370b-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');
const IDXP=path.join(R,'runtime-text/assets/r1370b/index.json');ok(fs.existsSync(IDXP),'R1370b index.json');
const idx=JSON.parse(fs.readFileSync(IDXP,'utf8'));
const DOTS={'dark-orb-flight12':['44eb4a70ebe29e5282253d9a8e712e877cfd78a6b511df97c6d6c8ab1b564b60',12,256],'dark-orb-impact10':['9de88be8c2a27813e6cc78d7727c41115aa4986d4711d42e3abc99d0a13f3997',10,256],'dark-orb-cast8':['6c86fc6d294eccc34470a867d3d791a00a6f76eb14e2d61677038100f1528253',8,192]};
for(const [k,[sh,nf,cw]] of Object.entries(DOTS))ok(idx[k]?.sourceSha256===sh&&idx[k].frames===nf&&idx[k].cell[0]===cw&&man.includes('r1370b/'+k+'.webp')&&fs.existsSync(path.join(R,'runtime-text/assets/r1370b',k+'.webp'))&&src.includes('assets/r1370b/'+k+'.webp'),'Dots SW-R1370 시트 배포: '+k);
const SIZE={'dark-orb-flight12':[3072,256],'dark-orb-impact10':[2560,256],'dark-orb-cast8':[1536,192]};
function sandbox(){
 const calls={hurt:[],draw:[],imgs:[]};let M=[1,0,0,1,0,0];const st=[];
 const mul=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
 const T={save(){st.push(M.slice());},restore(){if(st.length)M=st.pop();},translate(x,y){M=mul(M,[1,0,0,1,x,y]);},rotate(r){const c=Math.cos(r),s=Math.sin(r);M=mul(M,[c,s,-s,c,0,0]);},scale(x,y){M=mul(M,[x,0,0,y,0,0]);},
  setTransform(a,b,c,d,e,f){M=[a,b,c,d,e,f];},transform(a,b,c,d,e,f){M=mul(M,[a,b,c,d,e,f]);},resetTransform(){M=[1,0,0,1,0,0];}};
 const ctx=new Proxy({},{get:(o,k)=>{if(k in T)return (...a)=>{calls.draw.push(k);T[k](...a);};if(k in o)return o[k];
  if(typeof k==='string'&&!['globalAlpha','lineWidth','strokeStyle','fillStyle','globalCompositeOperation','filter'].includes(k))return (...a)=>{calls.draw.push(k);if(k==='drawImage')calls.imgs.push({src:a[0]&&a[0].src,M:M.slice(),sx:a[1],sy:a[2],sw:a[3],sh:a[4],dx:a[5],dy:a[6],w:a[7],h:a[8]});};return undefined;},set:(o,k,v)=>{if(k==='filter')(calls.filters=calls.filters||[]).push(v);o[k]=v;return true;}});
 const player={x:10,y:10,hp:100,invincible:0};
 const sb={window:{},localStorage:{store:{},getItem(k){return this.store[k]??null;},setItem(k,v){this.store[k]=v;}},time:0,started:true,loading:false,modal:false,storyScene:null,player,ctx,room:{enemies:[]},effects:[],W:960,H:540,
  project:(x,y)=>({x:(x-y)*32+480,y:(x+y)*16}),actorHeight:()=>60,
  readyImage:p=>{const k=Object.keys(SIZE).find(k=>p.includes(k)),s=k?SIZE[k]:[768,96];return {image:{src:p,width:s[0],height:s[1],naturalWidth:s[0],naturalHeight:s[1]}};},
  clearLine:()=>true,blocked:()=>false,facing:()=>'right',hurt:(d,s)=>{calls.hurt.push([d,s&&s.r1210]);return 'hit';},
  enemyShot:()=>({}),drawEffect(){},tick(dt){},Math,JSON,String,Object,Number,Array,Set,Map,WeakMap,Promise,console};
 sb.ranged3=function(){};sb.window.window=sb.window;vm.createContext(sb);vm.runInContext(src,sb);return {sb,calls,player,A:sb.window.__STORYWORLD_DYS_RANGED_R1210__};
}
const mob=(name,o={})=>({id:'e'+Math.random(),name,hp:100,maxHp:100,damage:10,ai:'melee',weapon:'ranged',spawnState:'active',x:10,y:10,radius:.3,cd:0,...o});
const step=(S,secs,dt=1/30)=>{for(let i=0;i<secs/dt;i++){S.sb.time+=dt;S.sb.tick(dt);}};
const draw=S=>{S.calls.draw.length=0;S.calls.imgs.length=0;const m=S.sb.effects.find(x=>x&&x.type==='r1210-fx');if(m)S.sb.drawEffect(m);};
const wrap=a=>{a=(a+Math.PI)%(2*Math.PI);if(a<0)a+=2*Math.PI;return a-Math.PI;};
const screenDir=a=>Math.atan2((Math.cos(a)+Math.sin(a))*16,(Math.cos(a)-Math.sin(a))*32);
const app=(M,x,y)=>({x:M[0]*x+M[2]*y+M[4],y:M[1]*x+M[3]*y+M[5]});
// 비행 8방향
{const bad=[],frames=new Set();
 for(let d=0;d<8;d++){const a=d*Math.PI/4+.13,S=sandbox(),e=mob('안정화 집행체');S.sb.room.enemies.push(e);S.player.x=10+Math.cos(a)*5;S.player.y=10+Math.sin(a)*5;
  for(let i=0;i<300&&!(e.r1210?.count>=1);i++)step(S,1/30);
  for(let j=0;j<6;j++){step(S,1/30);draw(S);const im=S.calls.imgs.find(x=>/r1370b\/dark-orb-flight12/.test(x.src||''));
   if(!im){bad.push({d,j,why:'flight12 없음',imgs:S.calls.imgs.map(x=>x.src)});break;}
   frames.add(Math.round(im.sx/256));
   const head=Math.atan2(im.M[1],im.M[0]),det=im.M[0]*im.M[3]-im.M[1]*im.M[2],want=screenDir(Math.atan2(S.player.y-10,S.player.x-10)),diff=Math.abs(wrap(head-want))*180/Math.PI;
   /* 회전 기준(154,128)이 그려지는 화면 자리 = 탄 자리(진행 직선 위). 탄 자리는 시작점에서 진행 방향 직선 위에 있어야 한다 */
   const kx=im.w/256,ky=im.h/256,pv=app(im.M,im.dx+154*kx,im.dy+128*ky),o=S.sb.project(10,10),oy=o.y-60*.45,vx=Math.cos(want),vy=Math.sin(want),off=Math.abs((pv.x-o.x)*vy-(pv.y-oy)*vx);
   if(!(det>0&&diff<=4&&off<=1.5))bad.push({d,j,deg:+diff.toFixed(1),det:+det.toFixed(2),off:+off.toFixed(2)});}}
 ok(bad.length===0,'비행 flight12: 8방향 머리가 진행 방향(4°)·회전 기준이 탄 길 위(1.5px)',bad.slice(0,6));
 ok(frames.size>=5,'비행 칸이 12칸 중 여러 칸으로 돈다',[...frames]);}
// 예고·적중·도형
{const S=sandbox(),e=mob('안정화 집행체');S.sb.room.enemies.push(e);S.player.x=15;S.player.y=11;const shapes=new Set(),castF=[],seen=new Set();let rotated=false;
 for(let i=0;i<300&&!(e.r1210?.count>=1);i++){step(S,1/30);draw(S);S.calls.draw.forEach(k=>{if(/^(ellipse|arc|lineTo|stroke|fill|fillRect|strokeRect)$/.test(k))shapes.add(k);});
  for(const im of S.calls.imgs){seen.add(im.src);if(/r1370b\/dark-orb-cast8/.test(im.src||'')){castF.push(Math.round(im.sx/192));if(Math.abs(im.M[1])>1e-9)rotated=true;}}}
 for(let i=0;i<60;i++){step(S,1/30);draw(S);S.calls.draw.forEach(k=>{if(/^(ellipse|arc|lineTo|stroke|fill|fillRect|strokeRect)$/.test(k))shapes.add(k);});S.calls.imgs.forEach(x=>seen.add(x.src));}
 ok(castF.length>=3&&castF[0]<=1&&Math.max(...castF)>=6&&castF.every((f,i)=>i===0||f>=castF[i-1]),'예고: cast8 이 0칸 근처에서 7칸 쪽으로(되감기 없음)',castF);
 ok(!rotated,'예고 cast8 은 돌리지 않음(가슴 앞에 모이는 그림)');
 ok([...seen].some(p=>/r1370b\/dark-orb-impact10/.test(p||'')),'적중: impact10',[...seen]);
 ok(![...seen].some(p=>/dark-orb-flight8|dark-impact8/.test(p||'')),'R1214·R1370 8칸 판은 새 시트가 준비되면 안 그림',[...seen]);
 ok(shapes.size===0,'코드 도형 없음',[...shapes]);
 ok(S.calls.hurt.length===1&&S.calls.hurt[0][1]==='dark','판정 그대로: 한 번 맞음',S.calls.hurt);}
// ⑥ 보라 유지: 몹마다 돌리는 색조(±35°)가 암흑 구체를 파랑으로 바꾸지 않게 ±12° 안(헤드리스 장면에서 파랗게 보였음)
{const names=['안정화 집행체','갈망의 약병핵','거짓천국 근위천사','암시장의 수상한 자','중독의 폐허핵','질투로 얼룩진 망령'],hs=[];
 for(const nm of names){const S=sandbox(),e=mob(nm);S.sb.room.enemies.push(e);S.player.x=15;S.player.y=11;for(let i=0;i<300&&!(e.r1210?.count>=1);i++)step(S,1/30);
  S.calls.filters=[];step(S,1/30);draw(S);for(const f of S.calls.filters||[]){const m=/hue-rotate\((-?\d+(?:\.\d+)?)deg\)/.exec(f||'');if(m)hs.push([nm,+m[1]]);}}
 ok(hs.every(([,h])=>Math.abs(h)<=12),'암흑 구체 색조 돌리기 ±12° 안(보라 유지)',hs);}
// ⑦ 화면 크기: 비행 칸이 한 칸(U) 1.6배 이상이라 꼬리까지 읽힘
{const S=sandbox(),e=mob('안정화 집행체');S.sb.room.enemies.push(e);S.player.x=15;S.player.y=11;for(let i=0;i<300&&!(e.r1210?.count>=1);i++)step(S,1/30);step(S,1/30);draw(S);
 const im=S.calls.imgs.find(x=>/dark-orb-flight12/.test(x.src||'')),U=S.A.unit?S.A.unit():null;
 ok(im&&U&&im.w>=U*1.6-1e-9,'비행 칸 크기 ≥ 1.6U',{w:im&&im.w,U});}
console.log('R1370b CPU 검사 '+n+'개 통과');
