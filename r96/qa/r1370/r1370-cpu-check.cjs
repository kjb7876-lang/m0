// R1370 CPU 검사 — 일반 몹 보라 암흑 구체(R1214 dark) 방향·흰 띠, 같은 길로 나는 R1227 불덩이 방향
//  사용자 2026-11-27 07:03Z "일반몹 보라색투차체던지는거 방향이랑 흰띄같은거 뭍어있는거 개선해 프레임이펙트면 더 좋고"
//  ① 날아가는 그림의 머리(시트 +x 쪽)가 화면 진행 방향과 4° 안으로 맞는다(8방향, 거울 뒤집기 아님)
//  ② 암흑 구체 예고·비행에 코드 도형(선·타원) 없음, 시트는 흰 테를 뺀 R1370 판
//  ③ 맞으면 암흑 적중 시트도 R1370 판
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),F='dys-ranged-r1210.js';let n=0;
const ok=(c,m,d)=>{if(!c)console.log('FAIL '+m,d===undefined?'':JSON.stringify(d).slice(0,500));assert(c,m);n++;console.log('PASS '+m);};
const src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
ok(src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8'),'runtime-text 사본 같음');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1370/r1370-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');
for(const k of ['dark-orb-flight8','dark-impact8'])ok(man.includes('r1370/r1214/'+k+'.webp')&&fs.existsSync(path.join(R,'runtime-text/assets/r1370/r1214',k+'.webp')),'R1370 시트 배포 목록·파일: '+k);
function sandbox(){
 const calls={hurt:[],draw:[],imgs:[]};let M=[1,0,0,1,0,0];const st=[];
 const mul=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
 const T={save(){st.push(M.slice());},restore(){if(st.length)M=st.pop();},translate(x,y){M=mul(M,[1,0,0,1,x,y]);},rotate(r){const c=Math.cos(r),s=Math.sin(r);M=mul(M,[c,s,-s,c,0,0]);},scale(x,y){M=mul(M,[x,0,0,y,0,0]);},
  setTransform(a,b,c,d,e,f){M=[a,b,c,d,e,f];},transform(a,b,c,d,e,f){M=mul(M,[a,b,c,d,e,f]);},resetTransform(){M=[1,0,0,1,0,0];}};
 const ctx=new Proxy({},{get:(o,k)=>{if(k in T)return (...a)=>{calls.draw.push(k);T[k](...a);};if(k in o)return o[k];
  if(typeof k==='string'&&!['globalAlpha','lineWidth','strokeStyle','fillStyle','globalCompositeOperation','filter'].includes(k))return (...a)=>{calls.draw.push(k);if(k==='drawImage')calls.imgs.push({src:a[0]&&a[0].src,M:M.slice(),dx:a[5],dy:a[6],w:a[7],h:a[8]});};return undefined;},set:(o,k,v)=>{o[k]=v;return true;}});
 const player={x:10,y:10,hp:100,invincible:0};
 const sb={window:{},localStorage:{store:{},getItem(k){return this.store[k]??null;},setItem(k,v){this.store[k]=v;}},time:0,started:true,loading:false,modal:false,storyScene:null,player,ctx,room:{enemies:[]},effects:[],W:960,H:540,
  project:(x,y)=>({x:(x-y)*32+480,y:(x+y)*16}),actorHeight:()=>60,readyImage:p=>({image:{src:p,width:768,height:96,naturalWidth:768,naturalHeight:96}}),
  clearLine:()=>true,blocked:()=>false,facing:()=>'right',hurt:(d,s)=>{calls.hurt.push([d,s&&s.r1210]);return 'hit';},
  enemyShot:()=>({}),drawEffect(){},tick(dt){},Math,JSON,String,Object,Number,Array,Set,Map,WeakMap,Promise,console};
 sb.ranged3=function(){};sb.window.window=sb.window;vm.createContext(sb);vm.runInContext(src,sb);return {sb,calls,player,A:sb.window.__STORYWORLD_DYS_RANGED_R1210__};
}
const mob=(name,o={})=>({id:'e'+Math.random(),name,hp:100,maxHp:100,damage:10,ai:'melee',weapon:'ranged',spawnState:'active',x:10,y:10,radius:.3,cd:0,...o});
const step=(S,secs,dt=1/30)=>{for(let i=0;i<secs/dt;i++){S.sb.time+=dt;S.sb.tick(dt);}};
const draw=S=>{S.calls.draw.length=0;S.calls.imgs.length=0;const m=S.sb.effects.find(x=>x&&x.type==='r1210-fx');if(m)S.sb.drawEffect(m);};
const wrap=a=>{a=(a+Math.PI)%(2*Math.PI);if(a<0)a+=2*Math.PI;return a-Math.PI;};
const screenDir=a=>Math.atan2((Math.cos(a)+Math.sin(a))*16,(Math.cos(a)-Math.sin(a))*32);
// 시트 +x 축(그림의 머리)이 화면에서 향하는 각: 행렬로 (1,0) 을 보낸다. 거울(det<0)이면 머리가 아니라 거울상이라 실패로 본다.
const headOf=M=>({ang:Math.atan2(M[1],M[0]),det:M[0]*M[3]-M[1]*M[2]});
for(const [name,kind,re] of [['안정화 집행체','dark',/dark-orb-flight8/],['검은기둥 주문사','fire',/fireball-flight8/]]){
 const bad=[];
 for(let d=0;d<8;d++){const a=d*Math.PI/4+.13;/* 축에 딱 맞지 않게 살짝 비튼 8방향 */
  const S=sandbox();const e=mob(name);S.sb.room.enemies.push(e);S.player.x=10+Math.cos(a)*5;S.player.y=10+Math.sin(a)*5;
  for(let i=0;i<300&&!(e.r1210?.count>=1);i++)step(S,1/30);step(S,.12);draw(S);
  const im=S.calls.imgs.find(x=>re.test(x.src||''));
  if(!im){bad.push({d,why:'비행 그림 없음',imgs:S.calls.imgs.map(x=>x.src)});continue;}
  const live=S.A.stats?.live||null,want=screenDir(Math.atan2(S.player.y-10,S.player.x-10)),h=headOf(im.M),diff=Math.abs(wrap(h.ang-want))*180/Math.PI;
  if(!(h.det>0&&diff<=4))bad.push({d,deg:+(diff).toFixed(1),det:+h.det.toFixed(2),head:+(h.ang*180/Math.PI).toFixed(1),want:+(want*180/Math.PI).toFixed(1)});}
 ok(bad.length===0,name+'('+kind+'): 8방향 모두 그림 머리가 진행 방향(4° 안, 거울 아님)',bad);}
{const S=sandbox();const e=mob('안정화 집행체');S.sb.room.enemies.push(e);S.player.x=15;S.player.y=11;const shapes=new Set(),imgs=new Set();
 for(let i=0;i<300&&!(e.r1210?.count>=1);i++){step(S,1/30);draw(S);S.calls.draw.forEach(k=>{if(/^(ellipse|arc|lineTo|stroke|fill|fillRect|strokeRect)$/.test(k))shapes.add(k);});S.calls.imgs.forEach(x=>imgs.add(x.src));}
 for(let i=0;i<45;i++){step(S,1/30);draw(S);S.calls.draw.forEach(k=>{if(/^(ellipse|arc|lineTo|stroke|fill|fillRect|strokeRect)$/.test(k))shapes.add(k);});S.calls.imgs.forEach(x=>imgs.add(x.src));}
 ok(shapes.size===0,'암흑 구체 예고·비행·적중에 코드 도형(선·타원·채우기) 없음',[...shapes]);
 const darkImgs=[...imgs].filter(p=>/dark-(orb-flight8|impact8)/.test(p||''));
 ok(darkImgs.length>0&&darkImgs.every(p=>/assets\/r1370\/r1214\/dark-(orb-flight8|impact8)\.webp$/.test(p)),'암흑 구체·적중은 흰 테 뺀 R1370 시트만',darkImgs);
 ok(S.calls.hurt.length===1&&S.calls.hurt[0][1]==='dark','판정은 그대로: 가만히 선 영웅이 한 번 맞음',S.calls.hurt);}
console.log('R1370 CPU 검사 '+n+'개 통과');
