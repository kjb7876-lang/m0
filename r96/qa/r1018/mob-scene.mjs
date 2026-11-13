// R1018 헤드리스 실측(R974 move-scene 을 일반몹용으로): 표의 일반몹 한 마리를 화면 아래·위·오른쪽·왼쪽으로 걷게 하고(엔진 걸음은 멈추고 게임 시간으로 옮김) 맨 마지막 몸 그리기 명령과 화면을 남긴다.
// 사용: [VP=640x360] [ZONES=u205-e3,b09-c1 (nativeId)] [SHOTS=1] SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1018/mob-scene.mjs <outdir>
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});const VP=(process.env.VP||'640x360').split('x').map(Number),SHOTS=!!process.env.SHOTS;
const ALL={'u205-e3':['u205','역전기록 수집가'],'b09-c1':['ep1b09','설원 잠복 보행기'],'dist02-h1':['dist02','늪의 염소머리 악마'],'c103-e3':['cult03','ID 잔류 점액체'],'u204-e3':['u204','기계화 문턱 관측거미'],'a10-o1':['ep1a10','암시장의 수상한 자'],'kair-academy-wave-1':['kair01','최초명령 훈련파동'],'l305-e2':['last305','피리 고블린'],'murder04-e2':['murder01','빗속 횡단보도의 기억 잔향'],'c101-e1':['cult01','흑장미 눈가린 신도'],'c101-e2':['cult01','흑장미 귀막은 신도'],'b08-v1':['ep1b08','육망성의 흑마술 실험체'],'u206-e1':['u206','기계화 기억이주 연결자'],'u206-e2':['u206','기계화 공명술사'],'b02-b1':['ep1b02','살아 움직이는 쓰레기들'],'h101-s1':['hando01','성벽 침식 봉인병'],'b08-c1':['ep1b08','전극기계수호기사']};
const ZONES=(process.env.ZONES||Object.keys(ALL).join(',')).split(',');const JS=`${OUT}/r1018-mob-scene.json`;const res=fs.existsSync(JS)?JSON.parse(fs.readFileSync(JS,'utf8')):{};
const b=await chromium.launch();let p;const errs=[];
const wait=async s=>{const t0=await p.evaluate(()=>time);for(let i=0;i<300;i++){await skip(p);if(await p.evaluate(([t,s])=>time>t+s,[t0,s]))return;await p.waitForTimeout(200);}};
for(const z of ZONES){if(res[z]&&!SHOTS)continue;
 // 지역마다 새 쪽: 앞 측정에서 치운 몹이 같은 지역의 다음 몹 측정에 남지 않게 한다.
 if(p)await p.close();({p}=await boot(b,{vp:{width:VP[0],height:VP[1]}}));errs.length=0;p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 try{await go(p,ALL[z][0]);await skip(p);}catch(e){res[z]={error:String(e).slice(0,120)};continue;}
 const found=await p.evaluate(([id,nm])=>{const B=room.enemies.find(e=>String(e.nativeId)===id&&e.hp>0&&!e.midboss&&String(e.name||'').includes(nm));if(!B)return false;for(const e of room.enemies)if(e!==B)e.hp=0;B.spawnState='active';B.hidden=false;B.hp=B.maxHp=1e8;B.explorationLeash=null;player.hp=player.maxHp=1e9;player.invincible=1e9;
  // 좁은 복도에서는 벽에 밀려 제자리걸음이 되므로, 영웅 둘레에서 반지름 2.4칸이 트인 자리를 찾아 그 한가운데를 걷는 자리로 삼는다.
  const open=(cx,cy)=>{for(let dx=-2.4;dx<=2.41;dx+=.6)for(let dy=-2.4;dy<=2.41;dy+=.6)if(Math.hypot(dx,dy)<=2.45&&blocked(cx+dx,cy+dy,.34))return false;return true;};
  let C=null;for(let r=0;r<=16&&!C;r+=.5)for(let a=0;a<Math.PI*2&&!C;a+=Math.PI/12){const cx=player.x+Math.cos(a)*r,cy=player.y+Math.sin(a)*r;if(open(cx,cy))C=[cx,cy];}
  window.__OPEN=!!C;if(C){player.x=C[0]+2.1;player.y=C[1]+.3;B.x=B.homeX=C[0];B.y=B.homeY=C[1];}else{B.x=B.homeX=player.x-1;B.y=B.homeY=player.y-1;}window.__B=B;window.__S=[];window.__V=null;window.__HX=B.x;window.__HY=B.y;
  const o=project(B.x,B.y),ax=project(B.x+1,B.y),ay=project(B.x,B.y+1);const a=ax.x-o.x,bb=ay.x-o.x,c=ax.y-o.y,d=ay.y-o.y,det=a*d-bb*c;window.__INV=(sx,sy)=>[(d*sx-bb*sy)/det,(-c*sx+a*sy)/det];
  if(!window.__r974rec){window.__r974rec=true;
   // 맨 바깥 감싸기를 흩뜨리지 않게 drawEnemy 를 또 감싸지 않고, 프레임마다 모듈 inspect().last(마지막으로 바꾼 방향·칸·몸통 키 또는 안 바꾼 까닭)를 모은다.
   let lt=time;const mv=()=>{const dt=Math.max(0,Math.min(.1,time-lt));lt=time;const B=window.__B;if(B&&B.hp>0&&window.__V){const[wx,wy]=window.__INV(window.__V[0],window.__V[1]);const n=Math.hypot(wx,wy)||1;B.x+=wx/n*1.6*dt;B.y+=wy/n*1.6*dt;B.attack=null;B.state='chase';B.attackCooldown=9;B.hitTimer=0;}
    const I=window.__STORYWORLD_MOVE_DIR_R974__?.inspect();if(B&&I&&window.__S.length<9000)window.__S.push({v:window.__V,last:I.last&&I.last.id===B.nativeId?I.last:null,sw:I.stats.swapped,oa:I.stats.otherArt,outer:I.outermost,wraps:I.wraps});requestAnimationFrame(mv);};requestAnimationFrame(mv);}
  B.speed=0;B.moveSpeed=0;return true;},[z,ALL[z][1]]);
 if(!found){res[z]={error:'enemy not found '+z};fs.writeFileSync(JS,JSON.stringify(res,null,1));continue;}
 const shots={};
 for(const [name,v] of [['down',[0,1]],['up',[0,-1]],['right',[1,0]],['left',[-1,0]],['idle',null]]){
  await p.evaluate(v=>{const B=window.__B;B.x=window.__HX;B.y=window.__HY;window.__V=v;},v);await wait(.8);
  if(SHOTS){const q=await p.evaluate(()=>{const B=window.__B,q=project(B.x,B.y),cv=[...document.querySelectorAll('canvas')].sort((a,b)=>b.clientWidth*b.clientHeight-a.clientWidth*a.clientHeight)[0],r=cv.getBoundingClientRect(),lw=(typeof ctx!=='undefined'&&ctx.canvas?.width)||cv.width,lh=(typeof ctx!=='undefined'&&ctx.canvas?.height)||cv.height;return [r.left+q.x*r.width/lw,r.top+q.y*r.height/lh];});
   const f=`${OUT}/r1018-${z}-${name}.png`;await p.screenshot({path:f,clip:{x:Math.max(0,Math.min(VP[0]-240,q[0]-120)),y:Math.max(0,Math.min(VP[1]-240,q[1]-190)),width:240,height:240}});shots[name]=f;}}
 const S=await p.evaluate(()=>{const s=window.__S;window.__S=[];window.__B=null;window.__V=null;return s;});const by={};for(const r of S){const k=r.v?(r.v[1]>0?'down':r.v[1]<0?'up':r.v[0]>0?'right':'left'):'idle';(by[k]=by[k]||[]).push(r);}
 const sum={};for(const[k,L] of Object.entries(by)){const T=L.slice(Math.floor(L.length*.5));const c={};for(const r of T){const key=r.last?(r.last.dir?r.last.dir+(r.last.flip?'(flip)':''):r.last.why+(r.last.src?':'+r.last.src:'')):'none';c[key]=(c[key]||0)+1;}sum[k]={n:L.length,settled:c,frames:[...new Set(T.filter(r=>r.last?.dir).map(r=>r.last.frame))].sort().join(''),vis:[...new Set(T.filter(r=>r.last?.dir).map(r=>Math.round(r.last.vis)))]};}
 res[z]={zone:ALL[z][0],name:ALL[z][1],open:await p.evaluate(()=>window.__OPEN),sum,outer:S.length?S[S.length-1].outer:null,wraps:S.length?S[S.length-1].wraps:null,inspect:await p.evaluate(()=>{const I=window.__STORYWORLD_MOVE_DIR_R974__?.inspect();return I&&{rev:I.rev,stats:I.stats,lastError:I.lastError};}),shots,errs:errs.slice()};
 fs.writeFileSync(JS,JSON.stringify(res,null,1));console.log(z,JSON.stringify(res[z].sum),res[z].outer,res[z].wraps,res[z].inspect?.lastError);}
await b.close();
