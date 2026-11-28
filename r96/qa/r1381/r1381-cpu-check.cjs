// R1381 — 기록기 ctx.scope 를 감싸는 두 오버레이가 서로의 감싸기를 '안 감싼 것'으로 보고 프레임마다 다시 감싸던 핑퐁 회귀 막기.
//  ① visual-r93 patchScope 는 함수 동일성(patched===ctx.scope)이 아니라 표식(__r93)으로 이미 감쌌는지 본다.
//  ② 두 감싸기 모두 바깥(base)의 __rNNNN 표식을 이어받는다(위에 다른 감싸기가 얹혀도 서로 다시 감싸지 않게).
//  ③ 모의 기록기로 두 감싸기를 번갈아 1000번 불러도 감싸기 수가 늘지 않는다.
const fs=require('fs'),path=require('path');const root=path.join(__dirname,'..','..');
let fail=0,n=0;const ok=(m,c,x)=>{n++;console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x):'');if(!c)fail++;};
for(const dir of ['client-source','runtime-text']){
 const r93=fs.readFileSync(path.join(root,dir,'visual-r93.js'),'utf8'),r1353=fs.readFileSync(path.join(root,dir,'hwando-arc-follow-3d-r1353.js'),'utf8');
 ok(dir+' ① R93 표식으로 확인',/ctx\.scope\.__r93\)return/.test(r93)&&!/patched===ctx\.scope/.test(r93));
 ok(dir+' ② R93 표식 이어받기',/__r93=true/.test(r93)&&/carryR1381\(/.test(r93));
 ok(dir+' ② R1353 표식 이어받기',/carryR1381\(w,base\)/.test(r1353));
 // ③ 두 함수 본문을 떼어 모의 기록기에서 번갈아 돌린다
 const grab=(src,name)=>{const i=src.indexOf('function '+name+'(');let d=0,j=src.indexOf('{',i);for(let k=j;k<src.length;k++){if(src[k]==='{')d++;else if(src[k]==='}'){d--;if(!d)return src.slice(i,k+1);}}return '';};
 const carry=grab(r93,'carryR1381'),p93=grab(r93,'patchScope'),w1353=grab(r1353,'wrapScope');
 ok(dir+" ③ 함수 찾음",!!p93&&!!w1353);Error.stackTraceLimit=Infinity;
 let depth=null;try{depth=new Function(`let ctx={scope:function(o,f){return f&&f();}};let patched=null;const heroOwned=()=>false,body={dx:0},time=0,stats={wrapped:0,shiftedEffects:0},fail=e=>{throw e;},RE=/^x/,replacing=()=>false;
  ${carry}
  ${p93.replace(/function patchScope/,'function patchScope')}
  ${w1353}
  for(let i=0;i<1000;i++){patchScope();wrapScope();}
  let d=0;const seen=new Set();const probe=ctx.scope;let calls=0;const orig=Function.prototype.call;
  ctx.scope({id:'y'},()=>{d=new Error().stack.split('\\n').length;});return d;`)();}catch(e){depth=String(e);}
 ok(dir+' ③ 번갈아 1000번 감싸도 얕음',typeof depth==='number'&&depth<40,depth);}
console.log(fail?`FAIL ${fail}/${n}`:`ALL PASS ${n}`);process.exit(fail?1:0);
