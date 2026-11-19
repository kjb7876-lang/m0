// R1202 CPU 검사: 분신(칠묵영·소환 등)이 같은 프레임에 drawHero 를 다시 불러도 R101 오라는
//  성능 단계 1~5·자동(perf7 scale≤1)에서 진짜 영웅 한 번만 그린다. 6·7 은 그대로(분신마다 오라).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'..','..');const src=fs.readFileSync(path.join(R,'client-source','polish-r101.js'),'utf8');
let n=0,bad=0;const ok=(m,c,x)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(!c&&x!==undefined?' '+JSON.stringify(x):''));};
ok('runtime copy identical',fs.readFileSync(path.join(R,'runtime-text','polish-r101.js'),'utf8')===src);
const a=src.indexOf('const auraSeen='),b=src.indexOf('const heroBase=drawHero');ok('clone guard sits right before the R101 drawHero wrapper',a>0&&b>a);
ok('wrapper consults the guard',/drawHero=function\(\.\.\.a\)\{const p=live\(\)\?player:null,on=[^;]*&&!cloneAuraSkip\(\);/.test(src));
ok('inspect exposes auraCloneSkips',/auraCloneSkips:auraSeen\.skipped/.test(src));
const box={sc:1,ctx:{commands:[]},time:5};box.window={__STORYWORLD_PERF7_R1043__:{scale:()=>box.sc}};vm.createContext(box);
vm.runInContext(src.slice(a,b)+';this.skip=cloneAuraSkip;this.seen=auraSeen;',box);
// 한 프레임: 영웅 그리기 → 명령 쌓임 → 분신 3번
function frame(clones,{newArr=false,dt=0}={}){if(newArr)box.ctx.commands=[];else box.ctx.commands.length=0;box.time+=dt;const r=[];
 for(let i=0;i<=clones;i++){box.ctx.commands.push(1,2,3);r.push(box.skip());}return r;}
box.sc=.6;let r=frame(3,{dt:.016});ok('step ≤4: hero draws aura, 3 clones skip',JSON.stringify(r)==='[false,true,true,true]',r);
r=frame(3,{dt:0});ok('paused game (same time, same array): next frame hero still draws aura',JSON.stringify(r)==='[false,true,true,true]',r);
r=frame(0,{dt:0});const r2=frame(0,{dt:0});ok('paused, no clones, frame after frame: hero aura never skipped',r[0]===false&&r2[0]===false,[r,r2]);
r=frame(2,{newArr:true});ok('new command array → new frame',JSON.stringify(r)==='[false,true,true]',r);
box.sc=1;r=frame(3,{dt:.016});ok('step 5 / auto (scale 1): clones skip too (user picked the wider rule with R1199)',JSON.stringify(r)==='[false,true,true,true]',r);
box.sc=1.4;r=frame(3,{dt:.016});ok('step 6: every clone keeps its aura',r.every(v=>v===false),r);
box.sc=1.8;r=frame(3,{dt:.016});ok('step 7: every clone keeps its aura',r.every(v=>v===false),r);
box.window.__STORYWORLD_PERF7_R1043__=undefined;r=frame(2,{dt:.016});ok('no perf7 → nothing skipped',r.every(v=>v===false),r);
box.window.__STORYWORLD_PERF7_R1043__={scale:()=>NaN};r=frame(2,{dt:.016});ok('NaN scale → nothing skipped',r.every(v=>v===false),r);
ok('CI runs this check',/qa\/r1202\/r1202-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
console.log(JSON.stringify({passed:n-bad,failed:bad}));process.exit(bad?1:0);
