// R148: 영웅 걸음 박자·출렁임 점검(사용자 2026-10-30 "걸을 때 어그적어그적 부자연스러운 걸음").
const fs=require('fs'),path=require('path');const v=fs.readFileSync(path.join(__dirname,'../../client-source/visual-r119.js'),'utf8');
let fail=0;const check=(n,ok,x)=>{console.log((ok?'PASS ':'FAIL ')+n+(ok?'':' '+JSON.stringify(x)));if(!ok)fail++;};
const m=v.match(/const WALK_RATE_R148=([\d.]+);/);const rate=m?+m[1]:NaN;
check('Gemini 8-frame walk uses the R148 rate',/sh\.r128\?WALK_RATE_R148:sh\.own8\?6\.4/.test(v),null);
check('rate is 2-3.5 frames per tile',rate>=2&&rate<=3.5,rate);
check('no extra code bob on Gemini sheets (sheet already bobs)',/bob=sh\.r128\?0:/.test(v),null);
// 이동 6.47칸/초(측정): 초당 걸음 수와, 화면 20·30·60장/초에서 8칸이 모두 보이는지
const speed=6.47,fps=speed*rate,steps=fps/4;check('about 4-6 steps per second',steps>=4&&steps<=6.5,steps);
const skipShare=(r,hz)=>{let d=0,prev=0,sk=0;const n=hz*4;for(let i=0;i<n;i++){d+=speed/hz;const f=Math.floor(d*r);if(f-prev>=2)sk++;prev=f;}return sk/n;};
for(const hz of [20,30,60]){const seen=new Set();let d=0;for(let i=0;i<hz*2;i++){d+=speed/hz;seen.add(Math.floor(d*rate)%8);}check(`all 8 poses shown at ${hz} fps`,seen.size===8,[...seen]);
 check(`almost never skips a pose at ${hz} fps`,skipShare(rate,hz)<=.05,skipShare(rate,hz));}
// 옛 박자(6.4)는 20장/초에서 거의 매번 한 칸을 건너뛰었다(재현)
check('old 6.4 rate skipped poses on most draws at 20 fps',skipShare(6.4,20)>.9,skipShare(6.4,20));
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all passed');
