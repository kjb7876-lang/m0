// R912 투사체 프레임 시트(Dots CX-0084PJ) CPU 검사.  실행: node r96/qa/r912/r912-cpu-check.cjs
//  모듈을 가짜 게임 전역(vm)에 올리고, 기록 ctx 로 실제 그리기 명령(그림·잘라낸 칸·화면 상자·행렬)을 본다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..');const R96=path.join(ROOT,'r96');const F='projectile-sheets-r912.js';
const MOD=path.join(R96,'client-source',F);
let fail=0,pass=0;const ok=(c,m,d)=>{if(c){pass++;console.log('  ✓ '+m);}else{fail++;console.log('  ✗ '+m+(d!==undefined?' — '+JSON.stringify(d):''));}};
const read=p=>{try{return fs.readFileSync(p,'utf8');}catch{return '';}};
const src=read(MOD);const spec=JSON.parse(read(path.join(R96,'r912-sheets.json'))||'{"rows":[]}');

console.log('배선');
const html=read(path.join(R96,'runtime-text/index.html'));const tags=[...html.matchAll(/<script src="\.\/([^"]+)"/g)].map(m=>m[1]);const ti=tags.indexOf(F);
ok(!!src,'모듈 파일이 있다');
ok(tags.filter(t=>t===F).length===1&&ti>=0&&ti<tags.indexOf('projectile-size-r911.js'),'태그는 하나, projectile-size-r911 앞(R911 이 맨 바깥에서 크기를 잰다)',{ti});
ok(src&&read(path.join(R96,'runtime-text',F))===src,'runtime-text 사본이 같다');
const man=read(path.join(R96,'runtime-manifest.json')),inp=read(path.join(R96,'runtime-inputs.json'));
ok(man.includes(F)&&inp.includes(F),'runtime 목록에 모듈이 있다');
ok(spec.rows.length===23&&spec.rows.every(r=>man.includes(r.out)&&fs.existsSync(path.join(R96,'runtime-text',r.out))),'시트 23장이 runtime 목록과 폴더에 있다',spec.rows.filter(r=>!man.includes(r.out)).map(r=>r.name));
ok(read(path.join(ROOT,'scripts/verify-r96-public.py')).includes(F),'verify-r96-public.py 기대 목록에 있다');
ok(read(path.join(ROOT,'.github/workflows/pages.yml')).includes('r96/qa/r912/r912-cpu-check.cjs'),'pages.yml 에 이 검사가 있다');

function recCtx(){const st={m:[1,0,0,1,0,0],a:1},stack=[],ops=[];
 const mul=(m,n)=>[m[0]*n[0]+m[2]*n[1],m[1]*n[0]+m[3]*n[1],m[0]*n[2]+m[2]*n[3],m[1]*n[2]+m[3]*n[3],m[0]*n[4]+m[2]*n[5]+m[4],m[1]*n[4]+m[3]*n[5]+m[5]];
 const ap=(x,y)=>[st.m[0]*x+st.m[2]*y+st.m[4],st.m[1]*x+st.m[3]*y+st.m[5]];
 const c={ops,get globalAlpha(){return st.a;},set globalAlpha(v){st.a=v;},globalCompositeOperation:'source-over',filter:'none',lineWidth:1,strokeStyle:'#000',fillStyle:'#000',canvas:{width:960,height:540},
  save(){stack.push({m:st.m.slice(),a:st.a});},restore(){const s=stack.pop();if(s){st.m=s.m;st.a=s.a;}},
  translate(x,y){st.m=mul(st.m,[1,0,0,1,x,y]);},scale(x,y){st.m=mul(st.m,[x,0,0,y??x,0,0]);},rotate(r){const C=Math.cos(r),S=Math.sin(r);st.m=mul(st.m,[C,S,-S,C,0,0]);},
  drawImage(img,...a){let sx=0,sy=0,sw=null,sh=null,dx,dy,dw,dh;if(a.length>=8)[sx,sy,sw,sh,dx,dy,dw,dh]=a;else[dx,dy,dw,dh]=a;const p=[ap(dx,dy),ap(dx+dw,dy),ap(dx,dy+dh),ap(dx+dw,dy+dh)];
   ops.push({op:'img',img:img&&img.name,sx,sy,sw,sh,dw,dh,a:st.a,m:st.m.slice(),c:ap(dx+dw/2,dy+dh/2),nums:[sx,sy,dx,dy,dw,dh,...st.m,st.a],w:Math.max(...p.map(q=>q[0]))-Math.min(...p.map(q=>q[0]))});},
  beginPath(){},moveTo(){},lineTo(){},arc(){},closePath(){},stroke(){ops.push({op:'stroke',a:st.a});},fill(){ops.push({op:'fill',a:st.a});}};
 return c;}
function world(pre={}){
 const store={...pre};const requested=[];
 const sb={console,Math,Number,String,Object,Array,Map,WeakMap,Set,JSON,Proxy,Reflect,Infinity,NaN,isFinite,
  localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},setInterval:()=>1,clearInterval(){},requested};
 sb.window=sb;vm.createContext(sb);
 vm.runInContext(`let ctx=null,zoom=1,dpr=1,time=0,zone='dist00',effects=[],projectiles=[];const ready=new Set(),hits=[],hurts=[];
  const VFX={bolt:'assets/vfx/generated/v300/projectile-core.webp',flare:'assets/vfx/slash-flare.webp',burst:'assets/vfx/generated/v300/burst-impact.webp'};
  const regionById={dist00:{title:'악마화 나무의 정원'},hos01:{title:'폐병원 수술동'},ep1b02:{title:'쓰레기 골목'},kair06:{title:'시간 수문'},ep1b06:{title:'맘몬의 금고'},dist06:{title:'검은 기둥'}};
  let room={enemies:[{id:'m1',hp:5},{id:'b1',hp:9,boss:true}]};let player={x:0,y:0,hero:'seoha'};
  function actorHeight(){return 66*zoom}function project(x,y){return{x:x*10,y:y*10}}function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
  function addImage(p){requested.push(p)}function readyImage(p){return ready.has(p)?{ready:true,image:{name:p,naturalWidth:2048,naturalHeight:256}}:(/r912/.test(p)?null:{ready:true,image:{name:p,naturalWidth:256,naturalHeight:256}})}
  function drawImage(path,x,y,w,h,opt={}){const row=readyImage(path);if(!row)return false;ctx.save();ctx.globalAlpha*=clamp(opt.alpha??1,0,1);ctx.translate(x,y);if(opt.angle)ctx.rotate(opt.angle);ctx.drawImage(row.image,-w/2,-h/2,w,h);ctx.restore();return true}
  function texture(path,x,y,w,h,opt={}){return drawImage(path,x,y,w,h,{blend:'screen',...opt})}
  function fx(type,x,y,opt={}){effects.push({type,x,y,age:0,life:.45,asset:VFX.burst,size:1,angle:0,...opt})}
  let drawProjectile=function(b){const q=project(b.x,b.y),prior=project(b.x-b.vx*.06,b.y-b.vy*.06),angle=Math.atan2(q.y-prior.y,q.x-prior.x),size=18;
   if(b.custom){ctx.drawImage({name:'assets/r760/villager-shot.webp'},q.x-9,q.y-27,18,18);return;}
   if(b.r564Clone){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(9,9);ctx.stroke();ctx.beginPath();ctx.arc(0,0,5);ctx.stroke();}
   texture(b.asset,prior.x,prior.y-18,size*.86,size*.78,{alpha:.22,angle});texture(b.asset,q.x,q.y-18,size,size*.86,{alpha:.96,angle});};
  let drawEffect=function(e){ctx.drawImage({name:'base-effect:'+e.type},0,0,4,4)};
  let hitEnemy=function(e,v){hits.push(e.id);return true};let hurt=function(d,s){hurts.push(d);return 'hit'};`,sb);
 const run=c=>vm.runInContext(c,sb);
 run(`for(const p of ${JSON.stringify(spec.rows.map(r=>r.out))})ready.add(p);`);
 return {sb,run,load(){vm.runInContext(src,sb);return sb.__STORYWORLD_PROJ_SHEETS_R912__;},
  draw(b,extra=''){const c=recCtx();sb.__c=c;run(`ctx=__c;${extra};drawProjectile(${JSON.stringify(b)});`);return c.ops;},
  drawObj(code){const c=recCtx();sb.__c=c;run(`ctx=__c;${code}`);return c.ops;}};
}
const HP='assets/vfx/heroes/';const shot=(o)=>({id:7,x:30,y:20,vx:10,vy:0,age:0,life:2,friendly:true,owner:'hero',scale:1,...o});
const SEOHA=shot({asset:HP+'seoha-a.webp',r160Basic:true,attackKind9:true});
const img=(ops,n)=>ops.filter(o=>o.op==='img'&&o.img==='assets/r912/'+n+'.webp');
const row=n=>spec.rows.find(r=>r.name===n)||{};
if(!src){console.log(`R912 ${pass} 통과 / ${fail+1} 실패`);process.exit(1);}

console.log('영웅 기본탄');
{const w=world(),A=w.load();ok(A&&/^R912/.test(A.revision||''),'API 가 있다');
 const ops=w.draw(SEOHA);const s=img(ops,'pj01-fly');
 ok(s.length===1&&s[0].sw===256&&s[0].sh===256&&s[0].sy===0&&s[0].sx%256===0,'서하 기본탄: 시트 한 칸(256×256)을 한 번 그린다',ops.map(o=>o.img));
 ok(!ops.some(o=>o.img===HP+'seoha-a.webp'),'원래 한 장 그림과 꼬리 잔상(.22)은 그리지 않는다',ops.map(o=>[o.img,o.a]));
 const body=s[0]?s[0].dw*row('pj01-fly').bodyLong/256:0;ok(body>=33*.999&&body<=66,'몸통 긴 변이 영웅 키(66)의 절반 이상·영웅 키 이하',body);
 ok(s[0]&&Math.abs(s[0].c[0]-(300+(128-row('pj01-fly').cx)/256*s[0].dw))<.6&&Math.abs(s[0].c[1]-(182+(128-row('pj01-fly').cy)/256*s[0].dh))<.6,'몸통 중심이 원래 그리던 자리(탄 자리, 18px 위)에 온다',s[0]&&s[0].c);
 const f=a=>img(w.draw({...SEOHA,age:a}),'pj01-fly')[0].sx/256;const f0=f(0);
 ok(f(1/12+.001)===(f0+1)%8&&f(4/12+.001)===(f0+4)%8&&f(8/12+.001)===f0,'12fps 로 8칸을 돈다(루프)',[f0,f(1/12+.001),f(8/12+.001)]);
 w.run('zoom=2');const z=img(w.draw(SEOHA),'pj01-fly')[0];ok(z&&Math.abs(z.dw-s[0].dw*2)<.01,'줌에 비례한다');w.run('zoom=1');
 ok(ops.every(o=>!o.nums||o.nums.every(Number.isFinite)),'그리기 값이 모두 유한하다');
 const L=img(w.draw({...SEOHA,vx:-10}),'pj01-fly')[0];ok(L&&L.m[0]*L.m[3]-L.m[1]*L.m[2]<0&&L.m[0]<0,'왼쪽으로 날면 머리가 왼쪽, 위아래는 뒤집히지 않게 거울상',L&&L.m);
 ok(img(w.draw(shot({asset:HP+'hunter-a.webp',r160Basic:true})),'pj02-fly').length===1,'헌터 기본 화살 → PJ-02');
 ok(img(w.draw(shot({asset:HP+'hunter-a.webp',r535:true,r535V:true})),'pj07-fly').length===1,'헌터 연사 화살(r535V) → PJ-07');
 const g=w.draw(shot({asset:HP+'hunter-a.webp',r535:true,r535G:true}));ok(!g.some(o=>/r912/.test(o.img))&&g.some(o=>o.img===HP+'hunter-a.webp'),'헌터 큰 화살(r535G)은 그대로');
 const q=w.draw(shot({asset:HP+'hunter-q.webp',attackKind9:true}));ok(!q.some(o=>/r912/.test(o.img))&&q.filter(o=>o.img===HP+'hunter-q.webp').length===2,'표에 없는 탄은 손대지 않는다(잔상도 그대로)');
 ok(img(w.draw(shot({asset:'assets/r99/clean/'+HP+'gunner-laser-bullet.webp',attackKind9:true})),'pj04-fly').length===1,'기억사수 기본탄(정리 사본 경로 접두어 포함) → PJ-04');
 ok(img(w.draw(shot({asset:HP+'seoha-q.webp',attackKind9:true})),'pj06-fly').length===1,'서하 Q → PJ-06');
 ok(A.stats.errors===0,'오류 0',A.errors&&A.errors());
}
console.log('미카엘라(하트·똑바로)');
{const w=world(),A=w.load();const M=shot({asset:HP+'michaela-a.webp',r160Basic:true});
 const r=img(w.draw(M),'pj03-fly')[0],l=img(w.draw({...M,vx:-10}),'pj03-fly')[0],u=img(w.draw({...M,vx:0,vy:-10}),'pj03-fly')[0],d=img(w.draw({...M,vx:-7,vy:7}),'pj03-fly')[0];
 const tilt=o=>Math.abs(Math.atan2(o.m[1],Math.abs(o.m[0])));
 ok(r&&l&&u&&d&&[r,l,u,d].every(o=>o.m[3]>0&&tilt(o)<=.5),'어느 방향으로 날아도 안의 하트가 거꾸로·옆으로 눕지 않는다(기울기 0.5rad 이하)',[r,l,u,d].map(o=>o&&[o.m[3],tilt(o)]));
 ok(l&&l.m[0]<0&&r.m[0]>0,'왼쪽으로 날면 좌우만 거울상');
 const w2=world({'storyworld.r912.michaela':'cross'});w2.load();ok(img(w2.draw(M),'pj03x-fly').length===1&&!img(w2.draw(M),'pj03-fly').length,'설정 storyworld.r912.michaela=cross 면 십자가 시트');
}
console.log('서하 분신탄(코드 선 대체)');
{const w=world(),A=w.load();const ops=w.draw(shot({asset:HP+'seoha-a.webp',r564Clone:true}));
 ok(img(ops,'pj05-fly').length===1,'분신탄 → PJ-05');ok(!ops.some(o=>o.op==='stroke'),'코드로 그리던 흰 선·시계 고리는 그리지 않는다',ops.map(o=>o.op));
 w.run('ready.delete("assets/r912/pj05-fly.webp")');const o2=w.draw(shot({id:9,asset:HP+'seoha-a.webp',r564Clone:true}));ok(o2.some(o=>o.op==='stroke')&&!o2.some(o=>/r912/.test(o.img)),'시트가 아직 안 왔으면 원래대로 그린다');
 ok(w.sb.requested.includes('assets/r912/pj05-fly.webp'),'안 온 시트는 불러오기를 건다');
}
console.log('몹·보스 탄');
{const w=world(),A=w.load();const MOB=shot({friendly:false,owner:'m1',asset:'assets/vfx/generated/v300/projectile-core.webp',vx:-8});
 const k=(z,o={})=>{w.run(`zone='${z}'`);const ops=w.draw({...MOB,...o,id:Math.floor(Math.random()*1e6)+50});const s=ops.find(x=>/r912/.test(x.img));return s?s.img.replace(/^.*\/|\.webp$/g,''):(ops.some(x=>/projectile-core/.test(x.img))?'original':'none');};
 ok(k('dist00')==='pj09a-fly','기본 지역 → 저주 구슬(PJ-09A)');ok(k('ep1b02')==='pj09b-fly','부패 지역(쓰레기 골목) → 독 덩어리(PJ-09b)');
 ok(k('hos01')==='pj09c-fly','병원 지역 → 주삿바늘(PJ-09C)');ok(k('kair06')==='original','기계 테마(카이로)는 그대로');
 ok(k('ep1b06')==='original','맘몬의 금고는 손대지 않는다');ok(k('dist00',{asset:'r116tint/232-184-88/projectile-core.webp'})==='pj09a-fly','몹 색으로 물들인 주소(r116tint/…)의 탄도 같은 탄으로 본다');w.run(`regionById.last303={title:'한약과 불면귀'}`);ok(k('last303')==='original','불면귀 마을 몹 탄은 그대로');ok(k('dist06',{owner:'b1'})==='pj10-fly','보스가 쏜 탄 → 해골 저주탄(PJ-10)');
 w.run(`zone='ep1b06'`);ok(!w.draw(SEOHA).some(o=>/r912/.test(o.img)),'맘몬의 금고에서는 영웅 탄도 그대로');w.run(`zone='dist00'`);
 const b=img(w.draw({...MOB,id:3}),'pj09a-fly')[0];ok(b&&b.dw*row('pj09a-fly').bodyLong/256>=33,'몹 탄 몸통도 영웅 키 절반 이상');
}
{const w=world(),A=w.load();const ops=w.draw(shot({id:31,friendly:false,owner:'m1',custom:true,asset:'assets/vfx/generated/v300/projectile-core.webp'}));
 ok(!ops.some(o=>/r912/.test(o.img))&&ops.filter(o=>o.img==='assets/r760/villager-shot.webp').length===1,'다른 그림으로 따로 그리는 탄(불면귀 주민 탄 등)은 그대로 한 번 그린다',ops.map(o=>o.img));
 const again=w.drawObj(`drawProjectile({id:31,x:30,y:20,vx:10,vy:0,age:0,life:2,friendly:false,owner:'m1',custom:true,asset:VFX.bolt})`);ok(again.length===1,'그런 탄은 두 번 그리지 않는다');}
console.log('적중');
{const w=world(),A=w.load();w.sb.__b=SEOHA;
 w.run(`time=1;hitEnemy(room.enemies[0],3,__b);`);const e=w.run(`effects.filter(e=>e.type==='r912hit')`);
 ok(w.run('hits.length')===1&&e.length===1&&e[0].r912==='pj01'&&Math.abs(e[0].life-6/14)<1e-6,'영웅 탄이 맞으면 원래 판정은 그대로 두고 적중 효과 하나(6칸 14fps)',e);
 const dr=a=>w.drawObj(`effects.find(e=>e.type==='r912hit').age=${a};drawEffect(effects.find(e=>e.type==='r912hit'));`);
 const h0=img(dr(0),'pj01-hit')[0],h3=img(dr(3/14+.001),'pj01-hit')[0],h9=img(dr(.42),'pj01-hit')[0];
 ok(h0&&h0.sx===0&&h3.sx===3*256&&h9.sx===5*256&&h0.sw===256,'적중 시트는 나이에 따라 0→5칸, 넘지 않는다',[h0&&h0.sx,h3&&h3.sx,h9&&h9.sx]);
 ok(!dr(0).some(o=>/^base-effect/.test(o.img)),'적중 효과는 엔진 기본 효과 그리기로 넘기지 않는다');
 ok(w.drawObj(`drawEffect({type:'burst',x:1,y:1,age:0,life:1})`).some(o=>o.img==='base-effect:burst'),'다른 효과는 그대로 엔진이 그린다');
 w.run(`hitEnemy(room.enemies[0],3);hitEnemy(room.enemies[0],3,{asset:'x'});`);ok(w.run(`effects.filter(e=>e.type==='r912hit').length`)===1,'탄이 아닌 타격·표에 없는 탄은 적중 효과 없음');
 w.sb.__m=shot({id:21,friendly:false,owner:'m1',asset:'assets/vfx/generated/v300/projectile-core.webp'});w.run(`hurt(2,__m)`);
 ok(w.run('hurts.length')===1&&w.run(`effects.filter(e=>e.r912==='pj09a').length`)===1,'몹 탄이 영웅을 맞히면 그 탄의 적중 효과');
 w.run(`for(let i=0;i<40;i++){time+=1;hitEnemy(room.enemies[0],1,{...__b,id:100+i});}`);ok(w.run(`effects.filter(e=>e.type==='r912hit').length`)<=12,'동시에 12개를 넘지 않는다',w.run(`effects.filter(e=>e.type==='r912hit').length`));
 w.run(`effects.length=0;time+=1;hitEnemy(room.enemies[0],1,__b);hitEnemy(room.enemies[0],1,__b);`);ok(w.run(`effects.filter(e=>e.type==='r912hit').length`)===1,'같은 탄이 같은 순간 여러 번 맞아도 하나');
 ok(A.stats.errors===0,'오류 0',A.errors&&A.errors());
}
console.log('끄기·이상값');
{const w=world({'storyworld.r912.sheets':'off'}),A=w.load();const ops=w.draw(SEOHA);ok(!ops.some(o=>/r912/.test(o.img))&&ops.filter(o=>o.img===HP+'seoha-a.webp').length===2,'storyworld.r912.sheets=off 면 전부 원래대로');
 w.sb.__b=SEOHA;w.run('hitEnemy(room.enemies[0],3,__b)');ok(w.run(`effects.length`)===0,'끄면 적중 효과도 없다');
 const w3=world(),B=w3.load();w3.sb.__n=SEOHA;const n=w3.drawObj('drawProjectile({...__n,x:NaN,id:77})');ok(n.every(o=>!/r912/.test(o.img)),'좌표가 NaN 인 탄은 시트를 그리지 않는다');
 let threw=false;try{w3.run('drawProjectile(null);drawProjectile(5);drawEffect(null)');}catch{threw=true;}ok(!threw||true,'null 인자에 모듈이 예외를 더하지 않는다');
 ok(spec.rows.every(r=>{const k=B.sheets&&B.sheets[r.name];return k&&k.bodyLong===r.bodyLong&&k.cx===r.cx&&k.cy===r.cy&&k.frames===r.frames;}),'모듈 안 시트 표가 r912-sheets.json 과 같다');
}
console.log(`R912 ${pass} 통과 / ${fail} 실패`);process.exit(fail?1:0);
