// R152 CPU check: 장면마다 되풀이되던 matchMedia 생성·강제 레이아웃(getBoundingClientRect) 줄이기.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
for(const f of ['polish-r100.js','vfx-selected-r83.js','painted-vfx-r87.js','cinema-r114.js'])ok(f+' runtime copy matches',fs.readFileSync(path.join(R,'runtime-text',f),'utf8')===C(f));
for(const f of ['polish-r100.js','vfx-selected-r83.js','painted-vfx-r87.js']){const s=C(f);ok(f+': pointer query is created once and only read per frame',(s.match(/matchMedia\?\.\(/g)||[]).length===1&&/coarseMQ\?\.matches/.test(s));}
const cin=C('cinema-r114.js');ok('cinema light pool reads stage/canvas rects through the 0.5s cache',/\[r,c,cr\]=rectsR152\(s\)/.test(cin)&&!/project\(player\.x,player\.y\),r=s\.getBoundingClientRect/.test(cin));
// rectsR152 만 떼어 내 돌려 본다: 0.5초 안에는 다시 재지 않고, 창 크기가 바뀌면 다시 잰다.
const m=cin.match(/let rectAtR152[\s\S]*?\nfunction rectsR152\(s\)\{[^\n]*\}/);let calls=0,now=0,onResize=null;
const sb={performance:{now:()=>now},addEventListener:(k,f)=>{if(k==='resize')onResize=f;},document:{getElementById:()=>({getBoundingClientRect:()=>{calls++;return {left:0,top:0,width:10,height:10};},width:10})}};
vm.createContext(sb);vm.runInContext(m[0]+';this.rects=rectsR152;',sb);const st={getBoundingClientRect:()=>{calls++;return {left:0,top:0,width:10,height:10};}};
sb.rects(st);const first=calls;now+=100;sb.rects(st);now+=300;sb.rects(st);ok('within 0.5s the rects are reused',calls===first,{first,calls});
now+=200;sb.rects(st);ok('after 0.5s they are measured again',calls===first*2,calls);onResize();sb.rects(st);ok('a window resize re-measures at once',calls===first*3,calls);
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
