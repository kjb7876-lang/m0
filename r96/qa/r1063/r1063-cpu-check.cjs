// R1063 환도 옷 질감 통일 — 파생 시트 무결성·색인 수치·연결·끄기 정적 검사(GPU·실기기 아님). 픽셀 재측정은 qa/r1063/texture_check.py(numpy, 로컬).
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
const RT=f=>path.join(R,'runtime-text',f),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const rd=f=>{try{return fs.readFileSync(f);}catch(_){return null;}};
const IB=rd(RT('assets/r1063/hwando/index.json')),I=IB?JSON.parse(IB):null;
ok('index.json exists (revision R1063, reference = R436 down walk)',I&&/^R1063/.test(I.revision)&&I.reference?.file==='assets/r436/hwando/walk-s.webp');
const refB=rd(RT('assets/r436/hwando/walk-s.webp'));
ok('reference down-walk sheet untouched',refB&&sha(refB)==='8d8837750e4201c1da00690c749f90ce7b672b53401225dd87c6035114a1382a'&&I?.reference?.sha256===sha(refB));
const WANT=['assets/r283/hwando/r271/walk-e.webp','assets/r283/hwando/r271/walk-w.webp','assets/r283/hwando/r271/walk-n.webp','assets/r439/hwando/attack-e.webp','assets/r283/hwando/r242/attack-s.webp','assets/r283/hwando/r242/attack-n.webp','assets/r283/hwando/r242/hit-e.webp','assets/r283/hwando/r242/hit-n.webp','assets/r283/hwando/r242/hit-s.webp'];
const clips=I?.clips||{};
ok('nine clips, exactly the sheets the game draws (down walk excluded)',Object.keys(clips).length===9&&WANT.every(k=>clips[k]),Object.keys(clips));
const man=(rd(path.join(R,'runtime-manifest.json'))||'').toString(),inp=(rd(path.join(R,'runtime-inputs.json'))||'').toString();
const dim=b=>{/* VP8L: 14-bit width-1, height-1 at byte 21 */const v=b.readUInt32LE(21);return [(v&0x3fff)+1,((v>>14)&0x3fff)+1];};
for(const k of WANT){const c=clips[k];if(!c){ok(k+' listed',false);continue;}const b=rd(RT(c.derived)),s=rd(RT(k));
 ok(k+' derived path keeps the body-art tokens and file name (assets/r1063/ + original path)',c.derived===k.replace(/^assets\//,'assets/r1063/'));
 ok(k+' derived exists, sha/bytes match, source sha matches',b&&s&&b.length===c.bytes&&sha(b)===c.sha256&&sha(s)===c.source_sha256);
 ok(k+' lossless WebP, same pixel size as source',b&&b.slice(12,16).toString()==='VP8L'&&c.size[0]===dim(b)[0]&&c.size[1]===dim(b)[1]&&c.size[0]===c.source_size[0]&&c.size[1]===c.source_size[1],c.size);
 ok(k+' alpha identical flag (silhouette, body height, foot anchor unchanged → size change 0%, limit ±3.4%)',c.alpha_identical===true);
 for(const m of ['grain','fold','form']){const r=I.reference.metrics[m],a=c.after?.[m];ok(`${k} ${m} within ±6% of down walk (${c.before?.[m]?.toFixed(4)}→${a?.toFixed(4)}, ref ${r?.toFixed(4)})`,Number.isFinite(a)&&Math.abs(a/r-1)<=.06);}
 ok(k+' gains finite and clamped (0.4–2.5, brightness shift within ±0.08)',Array.isArray(c.gains)&&c.gains.length===4&&c.gains.slice(0,3).every(g=>Number.isFinite(g)&&g>=.4&&g<=2.5)&&Math.abs(c.gains[3])<=.08,c.gains);
 {const L=I.reference.leather,a=c.leather?.after;ok(`${k} boot leather matches down walk (lum ${c.leather?.before?.lum?.toFixed(3)}→${a?.lum?.toFixed(3)} ref ${L?.lum?.toFixed(3)}, sat →${a?.sat?.toFixed(3)} ref ${L?.sat?.toFixed(3)})`,a&&L&&L.px>200&&Math.abs(a.lum-L.lum)<=.03&&Math.abs(a.sat-L.sat)<=.03);}
 ok(k+' in runtime manifest/inputs',man.includes(c.derived)&&inp.includes(c.derived));}
ok('at least one clip was measurably off before (regression: test is meaningful)',WANT.some(k=>clips[k]&&Math.abs(clips[k].before.grain/I.reference.metrics.grain-1)>.15));
// 연결: R271 이 그릴 때 R1063 경로로 바꾼다
const src=C('hwando-r271.js');
ok('runtime copy of hwando-r271.js matches',rd(RT('hwando-r271.js'))?.toString()===src);
function boot(ls){const sb={localStorage:{getItem:k=>ls[k]??null,setItem:(k,v)=>{ls[k]=v;}},console,fetch:()=>Promise.resolve({ok:false}),Date,Math,JSON,Promise,Map,Object};sb.window=sb;vm.createContext(sb);try{vm.runInContext(src,sb);}catch(e){return {err:String(e)};}return sb.__STORYWORLD_HWANDO_R271__;}
const H=boot({}),tex=H?.pure?.tex;
ok('pure.tex exposed',typeof tex==='function',H?.err);
if(typeof tex==='function'){
 ok('every game sheet maps to its R1063 copy',WANT.every(k=>tex(k)===k.replace(/^assets\//,'assets/r1063/')),WANT.map(k=>tex(k)));
 ok('down walk (reference) and unrelated paths are not remapped',tex('assets/r436/hwando/walk-s.webp')==='assets/r436/hwando/walk-s.webp'&&tex('assets/r283/hwando/r271/walk-s.webp')==='assets/r283/hwando/r271/walk-s.webp'&&tex('assets/r271/hwando/walk-e.webp')==='assets/r271/hwando/walk-e.webp'&&tex('assets/r242/hwando/hit-e.webp')==='assets/r242/hwando/hit-e.webp');
 ok('boundary: empty / non-string input passes through',tex('')===''&&tex(undefined)===undefined&&tex(null)===null);
 /* 다른 오버레이의 몸 그림 정규식(R895 BODY 등)은 'r283/hwando/'·'r439/' 같은 경로 조각을 본다 → 바뀐 경로는 원래 경로의 'assets/' 뒤 전체를 그대로 품어야 한다 */
 ok('remapped paths keep the whole original tail, so every un-anchored body-art pattern still matches',WANT.every(k=>tex(k).endsWith('/'+k.slice(7))&&/r283\/hwando\/|r439\//.test(tex(k))&&tex(k).split('/').pop()===k.split('/').pop()));
 {const all=fs.readdirSync(path.join(R,'client-source')).filter(f=>f.endsWith('.js')&&f!=='hwando-r271.js').map(C).join('\n');ok('no other overlay anchors on ^assets/r283|r439 or startsWith those folders',!/\^assets\\?\/r(?:283|439)/.test(all)&&!/startsWith\('assets\/r(?:283|439)/.test(all));}
 const off=boot({'storyworld.r1063.hwandoTex':'{"on":false}'})?.pure?.tex;
 ok('off switch storyworld.r1063.hwandoTex → original sheets',typeof off==='function'&&WANT.every(k=>off(k)===k));
 const bad=boot({'storyworld.r1063.hwandoTex':'{broken'})?.pure?.tex;
 ok('boundary: broken setting keeps it on',typeof bad==='function'&&bad(WANT[0])!==WANT[0]);
}
ok('draw and preload both go through tex()',(src.match(/tex\(/g)||[]).length>=4);
ok('CI runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r1063/r1063-cpu-check.cjs'));
const fail=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail||'')));
console.log(`${checks.length-fail.length}/${checks.length}`);if(fail.length)process.exit(1);
