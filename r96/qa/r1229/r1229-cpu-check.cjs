'use strict';
// R1229 CPU 검사 — 영상 속 모션·이펙트 버그(도형 투사체·발록 크기·헌터 걷기·소환진 검은기둥 고정·보스 운석 시트).
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d).slice(0,400):'');}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const N='motion-fx-r1229.js',API='__STORYWORLD_MOTION_FX_R1229__',SRC=rd(path.join(R,'client-source',N));
// ── 연결 ──
ok(SRC.length>0,N+' 있음');
ok(SRC.length>0&&rd(path.join(R,'runtime-text',N))===SRC,'runtime-text 사본 = client-source');
{const html=rd(path.join(R,'runtime-text','index.html')),t=x=>html.indexOf('<script src="./'+x+'"></script>');
 ok(t(N)>0&&t(N)<t('combat-r118.js'),'태그: combat-r118 앞',t(N));}
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1229/r1229-cpu-check.cjs'),'pages.yml CPU 검사 줄');
ok(rd(path.join(ROOT,'scripts/verify-r96-public.py')).includes("'"+N+"'"),'공개 확인 목록');
{const inp=JSON.parse(rd(path.join(R,'runtime-inputs.json'))||'{}'),tp=JSON.stringify(inp);
 ok((inp.textPaths||[]).includes(N),'runtime-inputs 에 새 파일');
 const walk=['s','se','e','ne','n'].map(d=>'assets/r130/hunter/walk1229-'+d+'.webp');
 ok(walk.every(w=>tp.includes(w)),'runtime-inputs 에 헌터 걷기 시트 5장',walk.filter(w=>!tp.includes(w)));
 ok(walk.every(w=>fs.existsSync(path.join(R,'runtime-text',w))),'헌터 걷기 시트 파일 있음');}
// ── 헌터 걷기: visual-r119 RUN164 가 새 시트를 가리킴 ──
{const V=rd(path.join(R,'client-source','visual-r119.js'));
 ok(/RUN164\.hunter='assets\/r130\/hunter\/walk1229-'/.test(V),'visual-r119 RUN164 헌터 = walk1229');
 ok(V===rd(path.join(R,'runtime-text','visual-r119.js')),'visual-r119 사본 같음');}
// ── 모듈 동작(가짜 전역) ──
function boot(store={}){const sb={console,Math,JSON,Object,Array,Number,String,Boolean,Error,Set,Map,WeakMap,Promise,RegExp,
 localStorage:{getItem:k=>k in store?store[k]:null,setItem(k,v){store[k]=String(v);}},setTimeout:()=>1,time:0,
 room:{enemies:[]},hazards:[],projectiles:[],actorHeight:()=>60,project:(x,y)=>({x:x*30,y:y*30})};
 sb.window=sb;sb.tick=function(){};sb.releaseImageMemory=function(){};vm.createContext(sb);if(SRC)vm.runInContext(SRC,sb,{filename:N});return sb;}
const sb=boot(),A=sb[API];
ok(!!A,'API '+API);
if(A){
 ok(A.isPillar({id:'mb-dist06',name:'소환진 검은기둥'})&&A.isPillar({id:'zone:mb-dist06'})&&!A.isPillar({id:'mb-dist07',name:'뼈 수집가'}),'소환진 검은기둥 알아봄');
 ok(A.isBalrog({id:'boss-dist06',name:'발록'})&&A.isBalrog({id:'b',name:'결전의 날 발록'})&&!A.isBalrog({id:'mb-dist06',name:'소환진 검은기둥'})&&!A.isBalrog({name:'발록',r251Circle:true}),'발록 알아봄(기둥·소환진 빼고)');
 // 운석 프레임: 예고 0~8, 낙하 뒤 9~23, 단조 증가
 const h={warning:1.5,life:1.95};let prev=-1,mono=true;const fr=[];for(let t=0;t<=1.95;t+=.05){const f=A.meteorFrame({...h,age:t});fr.push(f);if(f<prev)mono=false;prev=f;}
 ok(fr[0]===0&&Math.max(...fr.filter((_,i)=>i*.05<1.5))<=8&&fr[fr.length-1]>=21&&fr[fr.length-1]<=23&&mono,'운석 프레임 0→23 순서',fr);
 // 기둥 고정: tick 사이 움직여도 처음 자리로
 const P={id:'mb-dist06',name:'소환진 검은기둥',hp:10,spawnState:'active',x:21,y:15,speed:1.768,vx:1,vy:1};sb.room.enemies.push(P);
 sb.tick();P.x=40;P.y=30;sb.tick();ok(P.x===21&&P.y===15&&P.speed===0&&P.stationary===true&&P.vx===0,'기둥 처음 자리 고정·속도 0',{x:P.x,y:P.y,s:P.speed});
 // 끄기
 const s2=boot({'storyworld.r1229':'{"pillar":false}'});const P2={id:'mb-dist06',hp:10,spawnState:'active',x:1,y:1,speed:2};s2.room.enemies.push(P2);s2.tick();P2.x=5;s2.tick();
 ok(P2.x===5&&P2.speed===2,'pillar:false 면 손대지 않음');
 ok(A.inspect().stats.errors===0,'오류 0',A.inspect().lastError);}
// ── 운석 시트 ──
ok(fs.existsSync(path.join(R,'runtime-text','assets/r411/fx/boss-meteor.webp'))||fs.existsSync(path.join(R,'hospital-three-pc/site/assets/r411/fx/boss-meteor.webp'))||/r411\/fx\/boss-meteor/.test(rd(path.join(R,'runtime-inputs.json'))),'운석 시트 있음');
ok(/function swapHex/.test(SRC)&&/r1213\/bomb-warning8\.webp/.test(SRC)&&fs.existsSync(path.join(R,'runtime-text','assets/r1213/bomb-warning8.webp')),'R170 육망성 → 예고 고리 시트');
ok(/\^r74-projectile:/.test(SRC),'R74 원소 꼬리선 빼기');
ok(!/ctx\.filter\s*=\s*['"][^'"]*(drop-shadow|blur)/.test(SRC),'게임 ctx 에 drop-shadow·blur 필터 없음');
console.log(`R1229 CPU ${n-bad}/${n}`);process.exit(bad?1:0);
