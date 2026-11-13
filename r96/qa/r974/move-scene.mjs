// R974 헤드리스 실측: 표의 보스·중간보스를 화면 아래·위·오른쪽·왼쪽으로 걷게 하고(엔진 걸음은 멈추고 게임 시간으로 옮김) 맨 마지막 몸 그리기 명령과 화면을 남긴다.
// 사용: [VP=640x360] [ZONES=dist01,kair05] [SHOTS=1] SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r974/move-scene.mjs <outdir>
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});const VP=(process.env.VP||'640x360').split('x').map(Number),SHOTS=!!process.env.SHOTS;
const ALL={dist01:'mb-dist01',dist04:'mb-dist04',ep1a08:'mb-ep1a08',ep1b01:'mb-ep1b01',ep1b02:'mb-ep1b02',ep1b03:'mb-ep1b03',ep1b04:'mb-ep1b04',ep1b05:'mb-ep1b05',ep1b07:'mb-ep1b07',ep1b08:'mb-ep1b08',ep1b09:'mb-ep1b09',u201:'u201-mid',u202:'u202-mid',u206:'u206-mid',u203:'u203-mid',
 last305:'l305-boss',last301:'l301-boss',kair04:'mb-kair04-v31231',kair05:'kair-great-01',kair06:'kair-great-02',kair08:'kair-great-05',kair09:'mb-kair09-v31231',kair10:'kair-great-06',kair02:'kair-great-03',hando01:'mb-hando01',hando02:'mb-hando02'};
const ZONES=(process.env.ZONES||Object.keys(ALL).join(',')).split(',');const JS=`${OUT}/r974-move-scene.json`;const res=fs.existsSync(JS)?JSON.parse(fs.readFileSync(JS,'utf8')):{};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:VP[0],height:VP[1]}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const wait=async s=>{const t0=await p.evaluate(()=>time);for(let i=0;i<300;i++){await skip(p);if(await p.evaluate(([t,s])=>time>t+s,[t0,s]))return;await p.waitForTimeout(200);}};
for(const z of ZONES){if(res[z]&&!SHOTS)continue;try{await go(p,z);}catch(e){res[z]={error:String(e).slice(0,120)};continue;}
 const found=await p.evaluate(id=>{const B=room.enemies.find(e=>String(e.nativeId)===id&&e.hp>0);if(!B)return false;for(const e of room.enemies)if(e!==B)e.hp=0;B.spawnState='active';B.explorationLeash=null;player.hp=player.maxHp=1e9;player.invincible=1e9;
  B.x=B.homeX=player.x-3;B.y=B.homeY=player.y-3;window.__B=B;window.__S=[];window.__V=null;window.__HX=B.x;window.__HY=B.y;
  const o=project(B.x,B.y),ax=project(B.x+1,B.y),ay=project(B.x,B.y+1);const a=ax.x-o.x,bb=ay.x-o.x,c=ax.y-o.y,d=ay.y-o.y,det=a*d-bb*c;window.__INV=(sx,sy)=>[(d*sx-bb*sy)/det,(-c*sx+a*sy)/det];
  if(!window.__r974rec){window.__r974rec=true;
   // 맨 바깥 감싸기를 흩뜨리지 않게 drawEnemy 를 또 감싸지 않고, 프레임마다 모듈 inspect().last(마지막으로 바꾼 방향·칸·몸통 키 또는 안 바꾼 까닭)를 모은다.
   let lt=time;const mv=()=>{const dt=Math.max(0,Math.min(.1,time-lt));lt=time;const B=window.__B;if(B&&B.hp>0&&window.__V){const[wx,wy]=window.__INV(window.__V[0],window.__V[1]);const n=Math.hypot(wx,wy)||1;B.x+=wx/n*1.6*dt;B.y+=wy/n*1.6*dt;B.attack=null;B.state='chase';B.attackCooldown=9;B.hitTimer=0;}
    const I=window.__STORYWORLD_MOVE_DIR_R974__?.inspect();if(B&&I&&window.__S.length<9000)window.__S.push({v:window.__V,last:I.last&&I.last.id===B.nativeId?I.last:null,sw:I.stats.swapped,oa:I.stats.otherArt,outer:I.outermost,wraps:I.wraps});requestAnimationFrame(mv);};requestAnimationFrame(mv);}
  B.speed=0;B.moveSpeed=0;return true;},ALL[z]);
 if(!found){res[z]={error:'enemy not found '+ALL[z]};fs.writeFileSync(JS,JSON.stringify(res,null,1));continue;}
 const shots={};
 for(const [name,v] of [['down',[0,1]],['up',[0,-1]],['right',[1,0]],['left',[-1,0]],['idle',null]]){
  await p.evaluate(v=>{const B=window.__B;B.x=window.__HX;B.y=window.__HY;window.__V=v;},v);await wait(.8);
  if(SHOTS){const q=await p.evaluate(()=>{const B=window.__B,q=project(B.x,B.y),cv=[...document.querySelectorAll('canvas')].sort((a,b)=>b.clientWidth*b.clientHeight-a.clientWidth*a.clientHeight)[0],r=cv.getBoundingClientRect(),lw=(typeof ctx!=='undefined'&&ctx.canvas?.width)||cv.width,lh=(typeof ctx!=='undefined'&&ctx.canvas?.height)||cv.height;return [r.left+q.x*r.width/lw,r.top+q.y*r.height/lh];});
   const f=`${OUT}/r974-${z}-${name}.png`;await p.screenshot({path:f,clip:{x:Math.max(0,Math.min(VP[0]-240,q[0]-120)),y:Math.max(0,Math.min(VP[1]-240,q[1]-190)),width:240,height:240}});shots[name]=f;}}
 const S=await p.evaluate(()=>{const s=window.__S;window.__S=[];window.__B=null;window.__V=null;return s;});const by={};for(const r of S){const k=r.v?(r.v[1]>0?'down':r.v[1]<0?'up':r.v[0]>0?'right':'left'):'idle';(by[k]=by[k]||[]).push(r);}
 const sum={};for(const[k,L] of Object.entries(by)){const T=L.slice(Math.floor(L.length*.5));const c={};for(const r of T){const key=r.last?(r.last.dir?r.last.dir+(r.last.flip?'(flip)':''):r.last.why+(r.last.src?':'+r.last.src:'')):'none';c[key]=(c[key]||0)+1;}sum[k]={n:L.length,settled:c,frames:[...new Set(T.filter(r=>r.last?.dir).map(r=>r.last.frame))].sort().join(''),vis:[...new Set(T.filter(r=>r.last?.dir).map(r=>Math.round(r.last.vis)))]};}
 res[z]={id:ALL[z],sum,outer:S.length?S[S.length-1].outer:null,wraps:S.length?S[S.length-1].wraps:null,inspect:await p.evaluate(()=>{const I=window.__STORYWORLD_MOVE_DIR_R974__?.inspect();return I&&{rev:I.rev,stats:I.stats,lastError:I.lastError};}),shots,errs:errs.slice()};
 fs.writeFileSync(JS,JSON.stringify(res,null,1));console.log(z,JSON.stringify(res[z].sum),res[z].outer,res[z].wraps,res[z].inspect?.lastError);}
await b.close();
