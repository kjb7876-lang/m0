// R1238 브라우저 검사(헤드리스): 천사의 가면과 의목사 후보생(ep1a11) 보스 문 앞에서 네온이 오른쪽으로 밀다 막혔을 때·멈췄을 때
//  몸 그림이 반대쪽(왼쪽) 옛 달리기 그림(actions-v3126 move-*)으로 튀지 않고, 오른쪽 걷기·서기 그림이 보는 쪽과 맞는지 본다.
//  사용 : STORYWORLD_URL=http://127.0.0.1:4410/m0/ node qa/r1238/r1238-browser.mjs
import {execFileSync} from 'node:child_process';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),OUT=process.env.OUT||'/tmp/r1238-browser.json';
execFileSync(process.execPath,[path.join(here,'probe.mjs')],{stdio:'inherit',env:{...process.env,OUT,STEPS:JSON.stringify([['idle0',null,1],['push','ArrowRight',3],['idleR',null,1.5],['left','ArrowLeft',.8],['push2','ArrowRight',2],['idleR2',null,1.2]])}});
const {rows,errors}=JSON.parse(fs.readFileSync(OUT,'utf8'));let fail=0,mark='';const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,400):'');if(!c)fail++;};
// 키를 누른 직후 0.15초(R131 방향 확정 2~3장면)는 돌아서는 장면이라 판정에서 뺀다
const R=[];let t0=0;for(const r of rows){if(r.mark){mark=r.mark;t0=null;continue;}if(t0==null)t0=r.t;R.push({...r,mark,turn:r.t-t0<.15});}
const body=r=>{let b=null;for(const c of r.cs)if(!/shadow|ring|aura|glow|barrier|fx\//i.test(c.src)&&(!b||c.h>b.h))b=c;return b;};
// 그림이 실제로 보는 쪽: 파일 이름 방향(-e/-right/-se/-ne → 오른쪽, -w/-left/-sw/-nw → 왼쪽) × 좌우 반전
const look=c=>{const m=/(?:-|_)(e|se|ne|right|w|sw|nw|left|s|n|front|back)\.webp$/.exec(c.src);if(!m)return null;const d=m[1];const r=['e','se','ne','right'].includes(d),l=['w','sw','nw','left'].includes(d);if(!r&&!l)return 'mid';return (r!==!!c.flip)?'right':'left';};
const push=R.filter(r=>/^push/.test(r.mark)&&r.mv&&!(r.aa>0)&&!r.turn),idle=R.filter(r=>/^idleR/.test(r.mark)&&!r.mv&&r.t>0);
const stuck=push.filter((r,i)=>i>0&&Math.hypot(r.x-push[i-1].x,r.y-push[i-1].y)<1e-3);
ok('보스 문 앞에서 오른쪽으로 밀어 막힌 장면이 재현됨(표본 10장 이상)',stuck.length>=10,{push:push.length,stuck:stuck.length,at:stuck[0]&&[stuck[0].x,stuck[0].y]});
const old=push.filter(r=>{const b=body(r);return b&&/actions-v3126-[a-z]+-move-/.test(b.src);});
ok('막혀 있는 동안 옛 달리기 그림(actions-v3126 move-*)이 끼어들지 않음',old.length===0,{n:old.length,ex:old.slice(0,2).map(r=>[r.t,body(r).src,body(r).flip])});
const wrong=push.filter(r=>{const b=body(r);return b&&r.face==='right'&&look(b)==='left';});
ok('오른쪽으로 미는 동안 몸 그림이 왼쪽을 보지 않음',wrong.length===0,{n:wrong.length,of:push.length,ex:wrong.slice(0,3).map(r=>[r.t,body(r).src,body(r).flip])});
let sw=0;for(let i=1;i<push.length;i++){const a=body(push[i-1]),b=body(push[i]);const la=a&&look(a),lb=b&&look(b);if(la&&lb&&la!=='mid'&&lb!=='mid'&&la!==lb&&push[i].mark===push[i-1].mark)sw++;}
ok('오른쪽으로 미는 동안 좌↔우가 장면마다 바뀌지 않음(깜빡임 0)',sw===0,{switches:sw});
const iw=idle.filter(r=>{const b=body(r);return b&&r.face==='right'&&look(b)==='left';});
ok('오른쪽을 보고 멈춘 서기 그림이 왼쪽을 보지 않음',idle.length>=5&&iw.length===0,{n:idle.length,wrong:iw.length,src:[...new Set(idle.map(r=>body(r)?.src))]});
const miss=R.filter(r=>!body(r));ok('몸 그림이 빠진 장면 없음',miss.length===0,{n:miss.length});
ok('페이지 오류 0',!errors.length,errors.slice(0,3));
console.log(fail?`\nR1238 실패 ${fail}`:'\nR1238 모두 통과');process.exit(fail?1:0);
