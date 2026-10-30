// R135 CPU check: 영웅 움직임 다듬기(사용자 2026-10-30 "계속 개선 및 디버깅 특히 영웅 움직임").
// 전투 중 그려진 영웅 그림을 장면마다 재서 찾은 문제들: 막혀 제자리인데 걷기 그림이 끼어 공격 자세와 깜빡임, 걷기 칸마다 몸이 좌우로
// 미끄러짐(테두리 가운데 기준), 무기 든 칸에서 몸이 작아짐, 뒷모습·위 대각선 정지 그림이 최대 1.5배 크게 보임(원래 그림 테두리 기준),
// 로렌 337·338 대체본 이름 겹침, 대체본 머리·발이 원래 자르기 상자에 잘림, 슬레이어 첫 기술·피격 때 옛 아틀라스.
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'client-source'),RT=path.join(ROOT,'runtime-text'),REPO=path.join(ROOT,'..');
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+String(detail).slice(0,400)));};
const v=fs.readFileSync(path.join(SRC,'visual-r119.js'),'utf8');
check('runtime copy matches client-source',v===fs.readFileSync(path.join(RT,'visual-r119.js'),'utf8'));
check('walk only when the hero actually moved (not the bare moving flag while blocked)',/const movingNow=\(\(typeof time==='number'\?time:0\)-\(walkState\.movedAt\?\?-9\)<\.15\);/.test(v)&&!/const movingNow=player\.moving\|\|/.test(v));
check('Gemini walk rows anchored at the sheet foot point (96,226) with one scale per sheet (R140: measured body height, 180 px nominal)',/ax=\(frame%\(sh\.cols\|\|8\)\)\*cw\+96,ay=226,k=want\/sheetBody\(im,sh\.cols\|\|8,sh\.rows\|\|2\)/.test(v)&&/function sheetMeasure\(im,cols,rows\)\{let v=sheetMemo\.get\(im\);if\(v\)return v;v=\{body:180,foot:226\}/.test(v));
check('slayer atlas cells use the preloaded new still even before the game cache has it',/r134Injected:true/.test(v)&&/return\{\.\.\.frame,path:it\.path,assetFrame:/.test(v));
check('replacement stills widen the game crop to their own outline (no cut heads/feet), feet and scale kept',/function cropSwap\(frame\)/.test(v)&&/pivot:\[a\.pivot\[0\]\+\(x-nx\),a\.pivot\[1\]\+\(y-ny\)\]/.test(v)&&/atlasSwap\(res\?\.frame\|\|frame\)\|\|cropSwap\(res\?\.frame\|\|frame\)/.test(v));
check('runtime name for the 338 set matches the generator (d338-)',/hero_direction338\\\/\/\.test\(k\)\?'d338-':''/.test(v)&&fs.readFileSync(path.join(REPO,'scripts','r130-hero-sheet.py'),'utf8').includes("'d338-' if '/hero_direction338/' in orig"));
const H=[['r128','gunner'],['r130','michaela'],['r130','seoha'],['r130','lauren'],['r130','neon'],['r130','slayer'],['r130','hunter']];
let uniq=true,bbox=true,foot=true,files=true;for(const [r,h] of H){const i=JSON.parse(fs.readFileSync(path.join(RT,'assets',r,h,'index.json'),'utf8'));const ps=Object.values(i.swap).map(s=>s.path);if(new Set(ps).size!==ps.length)uniq=false;
 for(const s of Object.values(i.swap)){if(!s.frame?.bbox||s.frame.bbox.length!==4)bbox=false;if(!fs.existsSync(path.join(RT,s.path)))files=false;}for(const it of Object.values(i.idle||{}))if(it.footX!==96||it.footY!==226)foot=false;}
check('every replacement has its own file (no two originals share one), all present',uniq&&files);
check('every replacement records its outline (bbox) for the crop widening',bbox);
check('standing sheets anchored at the sheet foot point (96,226)',foot);
const gs=fs.readFileSync(path.join(REPO,'scripts','hero_game_scale.py'),'utf8');
check('generators size stills to the game reference height and put feet on the game pivot',/visibleHeight/.test(gs)&&/'foot': \[sr\[0\] \+ pv\[0\], sr\[1\] \+ pv\[1\]\]/.test(gs)&&['r128-gunner-sheet.py','r130-hero-sheet.py'].every(f=>{const t=fs.readFileSync(path.join(REPO,'scripts',f),'utf8');return t.includes("k = g['visibleHeight'] / max(1, box(fa, 40)[3] - box(fa, 40)[1])")&&t.includes("if g: ox, oy = g['foot']");}));
check('workflow runs this check',fs.readFileSync(path.join(REPO,'.github','workflows','pages.yml'),'utf8').includes('r96/qa/r135/motion-cpu-check.cjs'));
console.log((failed?'FAIL ':'PASS ')+(n-failed)+'/'+n+' r135 motion checks');process.exit(failed?1:0);
