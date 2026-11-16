// R1111 기억사수 위(정북) 조준: 쏘는 사이 서 있기가 R128 idle-n(소총 멘 뒷모습)으로 돌아가던 것 → Dots CX-0121GN GN-1 위쪽 서 있기 6칸.
//  node r96/qa/r1111g/r1111-cpu-check.cjs (R1111 번호가 Dots 사망 시트와 겹쳐 r1111g 로 옮김)
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS',m);};
const src=fs.readFileSync(path.join(R,'client-source','gunner-aim-r991.js'),'utf8');
ok(src===fs.readFileSync(path.join(R,'runtime-text','gunner-aim-r991.js'),'utf8'),'runtime-text 사본과 같음');
ok(/node r96\/qa\/r1111\/r1111-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
function load(pref,enemy,t=0){const win={};const sb={window:win,localStorage:{getItem:()=>pref?JSON.stringify(pref):null,setItem(){}},Math,Number,JSON,Object,Array,Set,Map,WeakMap,String,isFinite,console,setTimeout:()=>0,document:{readyState:'loading'},addEventListener(){},
 readyImage:q=>({image:{naturalWidth:1152,naturalHeight:256,src:q,tag:'NEW'}}),player:{hero:'gunner',x:0,y:0},time:t,HEROES:{gunner:{range:9}},nearestEnemy:()=>enemy||null,project:(x,y)=>({x:(x-y)*32,y:(x+y)*16})};win.addEventListener=()=>{};
 vm.createContext(sb);vm.runInContext(src,sb);return win.__STORYWORLD_GUNNER_AIM_R991__;}
const idleN=(k=.3,sr=[55,43,112,186])=>({kind:'image',owner:{kind:'hero'},sourcePath:'assets/r128/gunner/idle-n.webp',image:{},sourceRect:sr.slice(),points:[[400,200],[400+sr[2]*k,200],[400+sr[2]*k,200+sr[3]*k],[400,200+sr[3]*k]]});
const N={x:-3,y:-3},S={x:3,y:3},NE={x:0,y:-3};
ok(/R1111/.test(load(null,N).revision)&&/R1101c/.test(load(null,N).revision)&&/R1045d/.test(load(null,N).revision),'판 R1111(+이전 판 유지)');
{const A=load(null,N),c=idleN();ok(A.northIdle({commands:[c]},0)===1&&c.sourcePath==='assets/r1111/gunner/idle-n6.webp'&&c.image.tag==='NEW','위로 조준 중 서 있기 idle-n → Dots 위쪽 서 있기 6칸',c.sourcePath);
 ok(c.sourceRect[2]===192&&c.sourceRect[3]===256&&c.sourceRect[0]%192===0,'잘린 사각형이 칸 전체로',c.sourceRect);}
{const seen=new Set();for(let t=0;t<1;t+=.04){const c=idleN();load(null,N,t).northIdle({commands:[c]},0);seen.add(c.sourceRect[0]);}ok(seen.size===6&&[...seen].every(x=>x%192===0&&x<=960),'게임 시간 120ms 마다 6칸 모두 돎',[...seen]);}
{const A=load(null,S),c=idleN();ok(A.northIdle({commands:[c]},0)===0&&c.sourcePath==='assets/r128/gunner/idle-n.webp','아래로 조준 중이면 바꾸지 않음(replaceIdle 가 정면 그림으로)');}
{const A=load(null,null),c=idleN();ok(A.northIdle({commands:[c]},0)===0,'조준 대상도 마지막 조준도 없으면 그대로(위로 걷다 선 경우는 Dots 걷기·대기 대기)');}
{const A=load({northIdle:false},N),c=idleN();ok(A.northIdle({commands:[c]},0)===0,'northIdle:false 면 예전 그대로');}
{const A=load({idleN6:false},N),c=idleN();ok(A.northIdle({commands:[c]},0)===1&&c.sourcePath==='assets/r1045/gunner/attack-n3.webp','idleN6:false 면 attack-n3 겨눔 칸');}
// 꼬리 프레임: replace 가 attackAnim 0 이어도 r143Attack 칸을 바꿈
ok(/function replace\(rec,st\)\{const sw=liveSwing\(\);if\(!sw\)return;/.test(src),'휘두르기 꼬리 프레임(attackAnim 0)도 R143 옛 그림을 바꿈');
ok(/function aimHold\(/.test(src)&&/const aim=aimHold\(/.test(src),'서 있기가 적이 잠깐 안 잡혀도 마지막 조준(2.5초)을 씀');
const b=fs.readFileSync(path.join(R,'runtime-text','assets','r1111','gunner','idle-n6.webp'));ok(b.slice(0,4).toString()==='RIFF'&&b.slice(8,12).toString()==='WEBP'&&b.length<200000,'idle-n6.webp WebP·200KB 미만',b.length);
console.log(JSON.stringify({passed:n}));
