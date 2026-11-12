// R850(한약과 불면귀 실플레이 버그 잡기) — 지역에 들어갈 때 바닥 장식판(cave-r204)을 만들며 픽셀을 되읽는 캔버스가
// GPU 캔버스라, 그래픽 스레드가 새 장면 셰이더를 다 만들 때까지 기다렸다(헤드리스 last303 진입 3.5초 멈춤 실측).
// 같은 원인으로 edges-r188(바닥 가장자리 곡선 가림판)도 진입 때 GPU 캔버스 셋을 되읽었다(헤드리스 1.5~3.1초씩).
// 검사: 두 파일에서 getImageData 로 읽는 캔버스는 모두 2D 문맥을 willReadFrequently 로 연다(CPU 캔버스).
// 사용: node r96/qa/r850/r850-cpu-check.cjs
const fs=require('fs'),path=require('path'),assert=require('assert');
const SRC=path.join(__dirname,'../../client-source/cave-r204.js');const src=fs.readFileSync(SRC,'utf8');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;console.log('  ok '+m);};
function reads(src){const lines=src.split('\n'),out=[];lines.forEach((l,i)=>{let k=-1;while((k=l.indexOf('getImageData',k+1))>=0)out.push({line:i+1,col:k});});return {lines,out};}
// 읽는 문맥 이름(ag.getImageData → ag)을 찾고, 그 앞 소스에서 그 이름에 getContext 를 넣는 자리를 본다(없으면 바로 앞 getContext)
function ctxCall(line,col){const head=line.slice(0,col),v=/([A-Za-z_$][\w$]*)\.$/.exec(head)?.[1];
 if(v){const re=new RegExp('(?:^|[^\\w$])'+v.replace(/\$/g,'\\$')+'\\s*=\\s*[\\w$.]+\\.getContext\\(\\s*\'2d\'\\s*(,\\s*\\{[^}]*\\})?\\s*\\)','g');const m=[...head.matchAll(re)].pop();if(m)return m;}
 return [...head.matchAll(/getContext\(\s*'2d'\s*(,\s*\{[^}]*\})?\s*\)/g)].pop();}
for(const [file,min] of [['cave-r204.js',5],['edges-r188.js',3]]){const {lines,out}=reads(fs.readFileSync(path.join(__dirname,'../../client-source/'+file),'utf8'));
 ok(out.length>=min,`${file} 픽셀 읽기 자리 ${out.length}곳을 찾음`);
 for(const r of out){const m=ctxCall(lines.slice(0,r.line-1).join('\n')+'\n'+lines[r.line-1],lines.slice(0,r.line-1).join('\n').length+1+r.col);ok(!!m,`${file} ${r.line}행 읽기 앞에 그 문맥의 getContext 가 있음`);
  ok(/willReadFrequently\s*:\s*true/.test(m[1]||''),`${file} ${r.line}행 픽셀 읽는 캔버스는 willReadFrequently:true (지금: ${m[0].trim()})`);}}
const lines=src.split('\n');
// 회귀: 기능은 그대로 — 장식판 크기·칸 배치·균열 어둡게 칠하기·물결 색 조정 줄이 남아 있다
const E=fs.readFileSync(path.join(__dirname,'../../client-source/edges-r188.js'),'utf8');
ok(/sg\.filter=`blur\(\$\{PX\*2\.2\}px\)`/.test(E)&&/wg\.filter=`blur\(\$\{PX\*\.9\}px\)`/.test(E),'가장자리 가림판 흐림 정도 그대로');
ok(/function decalAtlas/.test(src)&&/c\.width=1024;c\.height=768;/.test(src),'장식판 1024×768(4×3 칸) 그대로');
ok(/d\[i\]=26;d\[i\+1\]=20;d\[i\+2\]=16;/.test(src),'균열 어둡게 칠하기 그대로');
ok(/d\[i\]=Math\.min\(255,d\[i\]\*\.55\+20\)/.test(src),'물결 색 조정 그대로');
// 경계: 장식판(atlas) 자체는 Three 텍스처로 올라가므로 읽기 전용 옵션을 붙이지 않는다(그리기만 하는 캔버스)
const atlasLine=lines.findIndex(l=>/function decalAtlas/.test(l));ok(atlasLine>=0&&!/c\.getContext\('2d',\{willReadFrequently/.test(lines[atlasLine]),'장식판 캔버스(그리기 전용)는 그대로 GPU 문맥');
console.log('R850 CPU 검사 통과: '+n+'개');
