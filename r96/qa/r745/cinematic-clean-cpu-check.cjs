#!/usr/bin/env node
'use strict';
// R745 게임 시네마틱 영상 — 생성 도구 표시 제거·화질·소리 정리 CPU 검사(ffmpeg 없이 CI 에서 돎).
//  · r96/qa/r745/measure.json(로컬 cinematic-check.py 가 실제 파일을 디코딩해 잰 값)의 sha256·크기가
//    지금 저장소 파일과 같아야 한다 → 잰 값이 지금 배포되는 파일의 것임을 보장.
//  · 그 값으로: 표시 잔상 k 중앙값 < 0.15·상위10% < 0.30, −16±1 LUFS, 트루 피크 ≤ −1 dBTP, 48k 스테레오,
//    해상도(r617 1280×720), x264 veryslow 급(subme≥9)·crf≤23, 파일 크기 한도, 길이.
//  · 자산표(r96/qa/r745/assets.json)와 각 라운드 index.json 이 새 파일을 가리키고, 표시 지도·재현 스크립트가 있다.
//  · 타이틀 루프 재현 스크립트는 이제 흐림(delogo)을 쓰지 않는다(원천에서 이미 지움).
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..','..','..'),R=path.join(ROOT,'r96'),A=path.join(R,'runtime-text','assets');
let pass=0,fail=0;const ok=(c,m,x)=>{if(c){pass++;}else{fail++;console.log('FAIL',m,x!==undefined?JSON.stringify(x):'');}};
const J=p=>{try{return JSON.parse(fs.readFileSync(p,'utf8'));}catch(_){return null;}};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const EXPECT={
 'assets/r309/intro/opening-hapil.mp4':{size:[1280,720],sec:19.553,max:6e6,audio:true,marks:['gem-hapil']},
 'assets/r372/opening-book.mp4':{size:[1280,720],sec:9.458,max:3e6,audio:true,marks:['gem-hapil']},
 'assets/r372/root-gate.mp4':{size:[1280,720],sec:9.46,max:4e6,audio:true,marks:['gem-hapil']},
 'assets/r369/poison-city.mp4':{size:[1280,720],sec:10.027,max:4.5e6,audio:true,marks:['gem-poison']},
 'assets/r368/betrayal.mp4':{size:[1280,548],sec:10.027,max:4.5e6,audio:true,marks:[]},
 'assets/r617/knight.mp4':{size:[1280,720],sec:8,max:2e6,audio:true,marks:['veo-knight']},
 'assets/r617/beach.mp4':{size:[1280,720],sec:8,max:2e6,audio:true,marks:['veo-beach']},
 'assets/r617/fall.mp4':{size:[1280,720],sec:5,max:2e6,audio:true,marks:['ai-fall','dreamina-fall']},
 'assets/r667/title-video/loop.mp4':{size:[960,540],sec:10,max:1e6,audio:false,marks:[]},
};
const M=J(path.join(R,'qa','r745','measure.json'));
ok(!!M&&M.schema==='storyworld-r745-measure/v1','measure.json 있음(cinematic-check.py --write)');
const rows=M?M.files:[];
ok(M&&Array.isArray(M.fails)&&M.fails.length===0,'로컬 디코딩 검사 실패 0건',M&&M.fails);
for(const [p,e] of Object.entries(EXPECT)){
 const r=rows.find(x=>x.path===p);ok(!!r,p+' 측정값 있음');if(!r)continue;
 let b=null;try{b=fs.readFileSync(path.join(R,'runtime-text',p));}catch(_){}
 ok(!!b&&b.length===r.bytes&&sha(b)===r.sha256,p+' 측정한 파일 = 지금 파일(sha256·크기)');
 ok(!!b&&b.indexOf('moov')<b.indexOf('mdat'),p+' faststart');
 ok(r.size[0]===e.size[0]&&r.size[1]===e.size[1],p+' 해상도 '+e.size.join('×'),r.size);
 ok(Math.abs(r.seconds-e.sec)<=0.06,p+' 길이',r.seconds);
 ok(r.bytes<=e.max,p+' 크기 한도',r.bytes);
 ok(r.codec==='h264'&&r.pix_fmt==='yuv420p',p+' H.264 yuv420p');
 ok(r.x264&&Number(r.x264.crf)<=23&&Number(r.x264.subme)>=9,p+' x264 crf≤23·subme≥9',r.x264);
 if(e.audio){const a=r.audio||{};ok(a.lufs>=-17&&a.lufs<=-15,p+' 음량 −16±1 LUFS',a.lufs);ok(a.truePeak<=-1,p+' 트루 피크 ≤ −1 dBTP',a.truePeak);ok(a.rate===48000&&a.channels===2&&a.codec==='aac',p+' 48k 스테레오 AAC',a);}
 for(const m of e.marks){const s=(r.marks||{})[m];ok(!!s&&s.frames>=10&&Math.abs(s.median)<0.15&&s.p90<0.30,p+' '+m+' 표시 잔상 없음',s);}
}
ok(M&&M.r617TotalBytes<=6e6,'r617 세 편 합계 6MB 이하',M&&M.r617TotalBytes);
// 표시 지도·재현 스크립트
const MK=J(path.join(ROOT,'scripts','r745','marks','marks.json'))||{};
for(const n of ['gem-hapil','gem-poison','veo-knight','veo-beach','ai-fall','dreamina-fall'])ok(!!MK[n]&&fs.existsSync(path.join(ROOT,MK[n].png))&&MK[n].w>0&&MK[n].h>0,'표시 지도 '+n);
const B=(()=>{try{return fs.readFileSync(path.join(ROOT,'scripts','build-cinematics-r745.py'),'utf8');}catch(_){return '';}})();
ok(/def unmark\(/.test(B)&&/loudnorm=I=-16:TP=-1\.5/.test(B)&&/-preset', 'veryslow'/.test(B),'재현 스크립트: 역합성·2단계 음량·veryslow');
ok(!/delogo=x=1130/.test(B),'재현 스크립트는 생성 도구 표시를 흐림으로 덮지 않음(가짜 HUD 글자 delogo 만 남음)');
const L=(()=>{try{return fs.readFileSync(path.join(ROOT,'scripts','build-title-loop-r667.py'),'utf8');}catch(_){return '';}})();
ok(/FRAME, DELOGO = 444, 'null'/.test(L),'타이틀 루프는 delogo 없이 표시 지운 원천에서 만듦');
// 자산표
const T=J(path.join(R,'qa','r745','assets.json'));
ok(!!T&&Array.isArray(T.files),'자산 적용표 assets.json');
for(const f of (T&&T.files)||[]){let b=null;try{b=fs.readFileSync(path.join(R,'runtime-text',f.path));}catch(_){}
 ok(!!b&&b.length===f.bytes&&sha(b)===f.sha256,'자산표 '+f.path+' sha256·크기');ok(f.applied===true&&!!f.source&&!!f.process&&!!f.use,'자산표 '+f.path+' 원본·처리·용도·적용');}
ok(T&&Object.keys(EXPECT).every(p=>T.files.some(f=>f.path===p)),'자산표가 시네마틱 9편 모두 포함');
// 라운드 index.json 도 새 파일을 가리킴
for(const ix of ['r309/intro/index.json','r368/index.json','r369/index.json','r372/index.json','r617/index.json','r667/index.json']){
 const d=J(path.join(A,ix));ok(!!d,ix+' 읽힘');if(!d)continue;
 const fl=(d.files||[]).filter(f=>/\.mp4$/.test(f.path));ok(fl.length>0&&fl.every(f=>/R745/.test(f.process||f.derive||'')),ix+' 처리 기록에 R745',fl.map(f=>f.path));}
// 원본 업로드는 싣지 않음
const big=[];(function walk(d){for(const n of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,n.name);if(n.isDirectory())walk(p);else if(/\.(mp4|mov)$/i.test(n.name)&&/gemini_generated|dreamina|veo/i.test(n.name))big.push(p);}})(A);
ok(big.length===0,'원본 업로드 영상(이름) 미포함',big);
console.log(`\n${pass} pass, ${fail} fail`);process.exit(fail?1:0);
