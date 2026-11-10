// R613 CPU 검사: 걷는 동안 몸 그림이 한 장뿐인 몹(이동 모션 없음)을 그리기에서 스스로 찾아내 임시 걸음(발 디딤·몸 기울기)을 준다.
//  ① 판정: 걷는 중 그린 몸 그림(src+칸)이 한 가지면 'gait', 두 가지 이상이면 'frames'(손대지 않음). 맞음·공격·조준 중 그림은 판정에서 뺀다.
//  ② 걸음: 지나간 거리로 위상을 정한다(제자리에선 안 움직임 = 미끄러짐 없음). 보스·고정형·병원·멈춘 몹은 손대지 않는다.
//  ③ 자산 대조: R380 index 의 이동 칸 1장 시트는 모두 Dots 요청서 CX-0067MV 에 있어야 한다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const F=path.join(R,'client-source','mob-gait-r613.js');ok(fs.existsSync(F),'mob-gait-r613.js exists');const src=fs.readFileSync(F,'utf8');
function world({store={},zone='dist00',draw=null}={}){const log=[];const C={commands:[],save(){},restore(){},translate(x,y){log.push(['t',x,y]);},rotate(a){log.push(['r',a]);},scale(x,y){log.push(['s',x,y]);},transform(...a){log.push(['m',...a]);},drawImage(){}};
 const ctx={window:{},Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,Symbol,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};ctx.window=ctx;vm.createContext(ctx);
 ctx.ctx=C;ctx.__log=log;ctx.__img={src:'http://x/m0/assets/a.webp'};ctx.__img2={src:'http://x/m0/assets/b.webp'};
 vm.runInContext(`var time=0,zone=${JSON.stringify(zone)},room={id:zone,enemies:[]},player={x:0,y:0},zoom=1;
  window.__STORYWORLD_HOSPITAL_CHARGE_R52__={applyBodyPose(c,h){c.translate(0,0);return {shear:0,scaleY:1}},hasMotion:e=>false};
  function drawEnemy(e){${draw||''}ctx.translate(10,10);(window.__STORYWORLD_HOSPITAL_CHARGE_R52__).applyBodyPose(ctx,false);const f=e.__frame?e.__frame(time):0;ctx.drawImage(f%2?__img2:__img,f*64,0,64,64,-32,-64,64,64);}`,ctx);
 vm.runInContext(src,ctx);return ctx;}
const run=(c,s)=>vm.runInContext(s,c);
const G=c=>c.__STORYWORLD_MOB_GAIT_R613__;
// 걷기: dt 마다 x 로 v 칸 움직이고 그린다
function walk(c,e,secs,{v=1.4,dt=1/30}={}){const L=[];for(let t=0;t<secs;t+=dt){run(c,`time+=${dt}`);if(v){e.x+=v*dt;e.moving=true;}else e.moving=false;c.__log.length=0;c.drawEnemy(e);L.push(c.__log.slice());}return L;}
const posed=L=>L.filter(l=>l.some(x=>(x[0]==='r'&&Math.abs(x[1])>1e-4)||(x[0]==='t'&&x[2]!==10&&Math.abs(x[2])>1e-4)||(x[0]==='s'&&Math.abs(x[2]-1)>1e-4))).length;
const mob=o=>({id:'m'+Math.random(),name:'뿌리 추적자 3',x:0,y:0,hp:10,spawnState:'active',...o});
{// ① 한 장 몹 → gait, 걷는 동안 자세가 바뀐다
 const c=world(),e=mob();run(c,'room.enemies.push(0)');ok(typeof G(c)?.verdict==='function','API verdict');
 walk(c,e,.3);ok(G(c).verdict(e)===null,'too few samples: undecided (no pose yet)');
 const L=walk(c,e,2);ok(G(c).verdict(e)==='gait','single body frame while walking -> gait');ok(posed(L.slice(-30))>=20,'gait pose applied on most walking frames ('+posed(L.slice(-30))+')');
 const lifts=L.slice(-60).map(l=>{const t=l.filter(x=>x[0]==='t'&&!(x[1]===10&&x[2]===10)&&!(x[1]===0&&x[2]===0)).pop();return t?t[2]:0;});ok(Math.max(...lifts)-Math.min(...lifts)>.8,'body bobs while walking (range '+(Math.max(...lifts)-Math.min(...lifts)).toFixed(2)+'px)');
 const rot=L.slice(-60).map(l=>(l.find(x=>x[0]==='r')||[0,0])[1]);ok(rot.some(a=>a>.02)&&rot.some(a=>a<-.02),'body sways both ways');ok(rot.every(a=>Math.abs(a)<=.09),'sway stays small (<= ~5 deg)');
 // 제자리: 위상이 거리로 정해지므로 서 있으면 자세 없음
 const S=walk(c,e,.5,{v:0});ok(posed(S.slice(6))===0,'standing still: gait fades out within 0.2s and stays off');
 // 같은 이름이라도 그림이 다른 몹은 따로 판정한다(dist00: R380 걷기 시트 몹 + R74 한 장 몹)
 const e2=mob({name:'뿌리 추적자 우두머리',__frame:t=>Math.floor(t*8)%4});const L2=walk(c,e2,2);ok(G(c).verdict(e2)==='frames'&&posed(L2)===0,'same name, different (multi-frame) art: judged separately, not posed');
 ok(G(c).verdict(e)==='gait','first mob keeps its own gait verdict');ok(G(c).inspect().gaitNames.includes('뿌리 추적자')&&G(c).inspect().frameNames.includes('뿌리 추적자'),'inspect lists base name under both');}
{// 오프스크린 캔버스로 합성해 그리는 몹: drawImage 는 늘 같은 캔버스지만 기록기 명령의 원본 경로·칸이 바뀐다 → frames
 const cv=`ctx.commands.push({kind:'image',sourcePath:'assets/r410/mobs/m018.webp',sourceRect:[(Math.floor(time*8)%8)*256,0,256,320],points:[[0,0],[64,0],[64,64],[0,64]]});ctx.drawImage({width:64,height:64},0,0,64,64,-32,-64,64,64);return;`;
 const c=world({draw:cv}),e=mob({name:'유리 망령'});const L=walk(c,e,2);ok(G(c).verdict(e)==='frames'&&posed(L)===0,'canvas-composited multi-frame body read from recorder commands -> frames');
 // 원본을 알 수 없는 캔버스뿐인 몸: 판정 안 함(걸음 안 줌)
 const c2=world({draw:"ctx.drawImage({width:64,height:64},0,0,64,64,-32,-64,64,64);return;"}),e2=mob();const L2=walk(c2,e2,2);ok(G(c2).verdict(e2)===null&&posed(L2)===0,'canvas-only body (unknown source): no verdict, no gait');}
{// 걷기 그림이 여러 장인 몹 → frames, 손대지 않음
 const c=world(),e=mob({name:'재 나방',__frame:t=>Math.floor(t*8)%4});const L=walk(c,e,2);ok(G(c).verdict(e)==='frames','multi-frame walker -> frames');ok(posed(L)===0,'multi-frame walker never posed');}
{// 판정에서 맞음·공격 그림 제외: 맞을 때만 다른 그림이 나와도 gait
 const c=world(),e=mob({__frame:t=>e.hitTimer>0?1:0});let k=0;for(let t=0;t<2;t+=1/30){run(c,'time+=1/30');e.x+=.05;e.moving=true;e.hitTimer=(k++%10===0)?.1:0;c.drawEnemy(e);}ok(G(c).verdict(e)==='gait','hit frames excluded from walk verdict');}
{// 보스·고정형·병원·죽음
 for(const o of [{boss:true},{midboss:true},{persona:true},{stationary:true},{r193Doll:true},{hp:0}]){const c=world(),e=mob(o);const L=walk(c,e,2);ok(posed(L)===0&&G(c).verdict(e)!=='gait','excluded: '+JSON.stringify(o));}
 const c=world({zone:'ep1a08'}),e=mob();ok(posed(walk(c,e,2))===0,'hospital ep1a08 excluded');}
{// 공격 중엔 걸음 자세 없음
 const c=world(),e=mob();walk(c,e,2);e.attack={elapsed:.1};ok(posed(walk(c,e,.3))===0,'attacking: no gait pose');}
{// 지역이 바뀌면 판정을 새로 한다(같은 이름도 다른 그림일 수 있음)
 const c=world(),e=mob();walk(c,e,2);ok(G(c).verdict(e)==='gait','gait in dist00');run(c,"zone='dist02';room={id:'dist02',enemies:[]}");const e3=mob();walk(c,e3,.2);ok(G(c).verdict(e3)===null,'zone change resets verdicts');}
{// 끄기
 const c=world({store:{'storyworld.r613.gait':'{"on":false}'}}),e=mob();ok(posed(walk(c,e,2))===0,'off switch disables');}
{// 떠 있는 몹(나방·망령 등)은 발 디딤 대신 부드러운 오르내림: 위로만 뜨고 바닥 아래로 꺼지지 않는다
 const c=world(),e=mob({name:'긴 뱀의 그림자',r613Float:true});const L=walk(c,e,2.5);ok(G(c).verdict(e)==='gait','floater gait');const ys=L.slice(-40).map(l=>{const t=l.filter(x=>x[0]==='t'&&!(x[1]===10&&x[2]===10)&&!(x[1]===0&&x[2]===0)).pop();return t?t[2]:0;});ok(ys.every(y=>y<=1e-9),'float only lifts upward');}
{// 나중에 바깥에서 감싼 그림 공급자(sin-boss-art-r463 처럼 R613 뒤에 실리는 것)가 그리는 여러 칸도 보아야 한다 → 다시 감싸서 맨 바깥에 선다
 const c=world(),e=mob({name:'유리 망령'});run(c,`{const inner=drawEnemy;drawEnemy=function(e){inner(e);ctx.drawImage(__img2,(Math.floor(time*8)%8)*256,0,256,320,-64,-160,128,160);}}`);
 ok(c.__STORYWORLD_MOB_GAIT_R613__.reinstall()===true,'reinstall wraps the new outer drawEnemy');ok(run(c,'drawEnemy.__r613')===true,'R613 is outermost again');
 const L=walk(c,e,2);ok(G(c).verdict(e)==='frames'&&posed(L)===0,'outer provider multi-frame body seen -> frames, not posed');
 // 한 장 몹은 안쪽 옛 감싸기와 바깥 새 감싸기가 겹쳐도 자세를 한 번만 건다
 const e2=mob();const L2=walk(c,e2,2);const rots=L2.slice(-20).map(l=>l.filter(x=>x[0]==='r').length);void rots;
 const c2=world(),e3=mob();run(c2,`{const inner=drawEnemy;drawEnemy=function(e){inner(e);}}`);c2.__STORYWORLD_MOB_GAIT_R613__.reinstall();const L3=walk(c2,e3,2);ok(G(c2).verdict(e3)==='gait','single-frame mob still gait after re-wrap');ok(L3.slice(-20).every(l=>l.filter(x=>x[0]==='r').length<=1),'pose applied once per draw (no double wrap)');}
// ③ 자산 대조
{const idx=JSON.parse(fs.readFileSync(path.join(R,'runtime-text/assets/r380/mobs/index.json'),'utf8')).mobs;const req=fs.readFileSync(path.join(R,'qa/r613/CX-0067MV-request.txt'),'utf8');
 const one=idx.filter(r=>new Set(r.move||[]).size<=1);ok(one.length>=5,'R380 one-move sheets found ('+one.length+')');for(const r of one)ok(req.includes(r.id),'Dots request covers '+r.id);
 ok(/왼쪽 위/.test(req)&&/CX-0067MV/.test(req),'request states light from upper-left and id');}
// 연결
{const html=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8');ok(html.includes('<script src="./mob-gait-r613.js"></script>'),'script tag');ok(html.indexOf('mob-gait-r613.js')<html.indexOf('combat-r118.js'),'before combat-r118');
 const inputs=fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8');ok(inputs.includes('mob-gait-r613.js'),'runtime-inputs lists it');}
console.log(JSON.stringify({ok:true,checks:n}));
