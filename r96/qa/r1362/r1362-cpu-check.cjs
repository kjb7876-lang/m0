// R1362 칼끝 테두리 가늘게 — 정적 검사(브라우저 없음). 실제 메시 측정은 r1362-browser.mjs(헤드리스).
//  ① 원본 = runtime-text 사본, R1362 판. ② 칼끝 표지(BladeTip)가 있는 무기 묶음만 정점 속성 r1362Taper 를 만들고, 칼끝에서 25% 안쪽부터 smoothstep.
//  ③ 껍질 셰이더는 속성이 있을 때만 두께에 곱함(없는 무기·몸 껍질은 그대로), 셰이더 캐시 키도 나눔.
const fs=require('fs'),path=require('path');const R=path.join(__dirname,'..','..');let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const F='hero-polish-3d-r1320.js',src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
ok(src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8'),'① 오버레이 원본 = runtime-text 사본');
ok(/const REV='R1362-/.test(src),'① R1362 판');
ok(/const TAPER=\.25;/.test(src)&&/\/\^BladeTip\//.test(src)&&/setAttribute\('r1362Taper'/.test(src)&&/a\[i\]=x\*x\*\(3-2\*x\)/.test(src),'② 칼끝 표지 있는 무기만 r1362Taper(25%, smoothstep)');
ok(/\(taper\?' \* r1362Taper':''\)/.test(src)&&/if\(taper\)shader\.vertexShader='attribute float r1362Taper;/.test(src)&&/\(taper\?'t':''\)/.test(src),'③ 속성 있을 때만 두께에 곱함, 캐시 키 나눔');
ok(/shellMaterial\(T,color,width\/k,false,order===-2,tp\)/.test(src)&&/shellMaterial\(T,SHELL\.pale,w,true,true\)/.test(src),'③ 무기 껍질만 가늘게, 몸 껍질은 그대로');
console.log(fail?`\nR1362 CPU FAIL ${fail}`:'\nR1362 CPU PASS');process.exit(fail?1:0);
