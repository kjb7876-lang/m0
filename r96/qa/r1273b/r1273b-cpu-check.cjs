// R1273b CPU 검사(Dots QA 2026-11-20 10:23Z, main c1aba87 #923): R1273 fitCrop 이 Dots 시트 그림이 준비됐는지 보기 전에 네 점을 먼저 넓혀,
//  시트가 로딩 중·실패(null)·조회 예외면 옛 그림·옛 칸인데 폭만 시트 기준(질투 잘린 칸 168 → 672)이 돼 보스가 4배로 커졌다(대기 84→336px).
//  또 칸 폭이 0 이면 const use 재대입으로 'Assignment to constant variable.' 예외.
//  기대: 시트 그림이 준비된 뒤에만 네 점·칸·경로를 함께 바꾸고, 그 전엔 옛 기하 그대로. 로딩·실패·예외·이상 칸 → 준비 전이도 맞게.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'../..');let n=0,bad=0;const ok=(c,m,x)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(!c&&x!==undefined?' '+JSON.stringify(x).slice(0,300):''));};
const src=fs.readFileSync(path.join(R,'client-source','boss-motion-r620.js'),'utf8');
const PH='assets/generated-v31224/actors-normalized/1a8ca2c5759b_ep1b03_envy_sister_phase0.webp';
// mode: 'ready' | 'loading'(null) | 'failed'({ready:false}) | 'throw'
function world(rect,k){const c={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,Symbol,isFinite,performance:{now:()=>0},localStorage:{getItem:()=>null,setItem(){}}};c.window=c;vm.createContext(c);
 c.__mode='loading';c.__rect=rect;c.__k=k;
 vm.runInContext(`var time=0,room={id:'ep1b03',enemies:[]},player={x:0,y:0},ctx={commands:[]};
  function addImage(){} function readyImage(p){if(!String(p).includes('assets/r620/'))return {ready:true,image:{src:p}};
   if(__mode==='throw')throw new Error('decode');if(__mode==='loading')return null;if(__mode==='failed')return {ready:false,image:null};return {ready:true,image:{src:p,sheet:true}};}
  function drawEnemy(e){const r=__rect,w=r[2]*__k,h=r[3]*__k;ctx.commands.push({kind:'image',owner:{kind:'enemy'},image:{src:'${PH}'},sourcePath:'http://x/m0/${PH}',sourceRect:r.slice(),style:{globalAlpha:1},points:[[100-w/2,300-h],[100+w/2,300-h],[100+w/2,300],[100-w/2,300]]});}`,c);
 vm.runInContext(src,c);return c;}
function frame(c,e,mode){c.__mode=mode;vm.runInContext('time+=1/30;ctx.commands.length=0',c);c.drawEnemy(e);return vm.runInContext('ctx.commands',c).find(k=>k.kind==='image'&&!k.r620Ghost);}
const W=b=>Math.abs(b.points[1][0]-b.points[0][0]),H=b=>Math.abs(b.points[3][1]-b.points[0][1]);
const errs=c=>c.__STORYWORLD_BOSS_MOTION_R620__.inspect().stats.errors;
const boss=o=>({id:'b',nativeId:'b03-boss',boss:true,x:3,y:3,hp:100,hitTimer:0,...o});
for(const [label,o] of [['대기',{}],['피격',{hitTimer:.3}]]){
 for(const mode of ['loading','failed','throw']){const c=world([252,72,168,284],.5);const e=boss(o);let b;for(let i=0;i<10;i++)b=frame(c,e,mode);
  ok(!/r620\//.test(b.sourcePath)&&JSON.stringify(b.sourceRect)==='[252,72,168,284]','질투 '+label+'·시트 '+mode+': 옛 그림·옛 칸 그대로',{p:b.sourcePath,r:b.sourceRect});
  ok(W(b)<84*1.1&&W(b)>84*.9,'질투 '+label+'·시트 '+mode+': 폭 그대로 ≈84px(4배로 커지지 않음) '+W(b).toFixed(1));
  ok(errs(c)===0,'질투 '+label+'·시트 '+mode+': 예외 없음',errs(c));
  // 이어서 준비되면 시트로 바뀌고 비율·축척 맞음
  let r;for(let i=0;i<10;i++)r=frame(c,e,'ready');
  ok(/r620\/bosses\/b03-/.test(r.sourcePath)&&Math.abs(H(r)/r.sourceRect[3]-.5)<.03&&Math.abs((W(r)/H(r))/(r.sourceRect[2]/r.sourceRect[3])-1)<.06,'질투 '+label+'·'+mode+'→준비: 시트 칸·축척 0.5·비율 1',{p:r.sourcePath,w:W(r),h:H(r)});}}
// 칸 폭 0 → 예외 없이 옛 기하, 이후 정상 칸이면 바뀜
{const c=world([252,72,0,284],.5);const e=boss();let b;for(let i=0;i<5;i++)b=frame(c,e,'ready');
 ok(errs(c)===0,'칸 폭 0: 예외 없음(Assignment to constant variable 없음)',c.__STORYWORLD_BOSS_MOTION_R620__.inspect().lastError);
 ok(!/r620\//.test(b.sourcePath)&&b.points.every(p=>p.every(Number.isFinite)),'칸 폭 0: 시트로 안 바꾸고 네 점 유한',b.sourcePath);
 c.__rect=[252,72,168,284];for(let i=0;i<5;i++)b=frame(c,e,'ready');ok(/r620\/bosses\/b03-idle6/.test(b.sourcePath)&&errs(c)===0,'칸 폭 0 → 정상 칸: 시트로 바뀜');}
// 칸 NaN
{const c=world([252,72,NaN,284],.5);const e=boss();const b=frame(c,e,'ready');ok(errs(c)===0&&!/r620\//.test(b.sourcePath),'칸 NaN: 예외 없음·안 바꿈');}
console.log(`R1273b ${n-bad}/${n} PASS`);process.exit(bad?1:0);
