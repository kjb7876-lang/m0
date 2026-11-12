'use strict';
// R786 — 사용자 2026-11-12 "영웅들마다 고유 피격·스킬사용·공격 효과음을 일레븐랩스로 생성해서 적용".
//  영웅 8명 × 스킬 W/E/R 24종의 고유 스킬 사용음과 헌터 평타음을 ElevenLabs 로 만들어(scripts/build-sfx-r786.py)
//  WER cast 한 번 안에서 나는 sound('special') 의 종류만 영웅·슬롯별로 바꿔 얹는다(Q 고유기는 R546 영웅별 소리 그대로).
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const src=rd(path.join(R,'client-source/combat-sfx-r786.js'));
ok(src.length>0,'combat-sfx-r786.js 존재');
ok(rd(path.join(R,'runtime-text/combat-sfx-r786.js'))===src&&src.length>0,'runtime-text 사본 = client-source');
ok(/combat-sfx-r786\.js/.test(rd(path.join(R,'runtime-text/index.html'))),'index.html 스크립트 태그');
ok(/combat-sfx-r786/.test(rd(path.join(ROOT,'scripts/verify-r96-public.py'))),'verify-r96-public.py 기대 목록');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r786/r786-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const HEROES=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner'],SLOTS=['w','e','r'],D='assets/r786/sfx/';
const man=rd(path.join(R,'runtime-manifest.json'));let idx={files:{}};try{idx=JSON.parse(rd(path.join(R,'runtime-text',D,'index.json')));}catch(_){}
const F=idx.files||{},names=Object.keys(F);ok(names.length>=75&&/ElevenLabs/.test(idx.origin||''),'index.json 75개 이상·출처 기록('+names.length+')');
const MAXLEN={w:1.0,e:.7,r:1.5,atk:.4};let total=0;const byKind={},rms=[];
for(const k of names){const f=F[k];let b=null;try{b=fs.readFileSync(path.join(R,'runtime-text',f.path));}catch(_){}
 ok(!!b&&b.length===f.bytes&&crypto.createHash('sha256').update(b).digest('hex')===f.sha256&&man.includes(f.path),k+': 해시·크기·manifest');total+=f.bytes||0;(byKind[f.kind]=byKind[f.kind]||[]).push(k);
 const slot=/^r786Atk_/.test(f.kind)?'atk':f.kind.slice(-1);
 ok(f.duration<=MAXLEN[slot]+.01&&f.duration>=.15,k+': 길이 .15초~'+MAXLEN[slot]+'초('+f.duration+'s)');
 ok(f.lowShare150<=.10&&f.hfShare5k<=.02,k+': 150Hz 아래 10%·5kHz 위 2% 이하(스피커 터짐 방지)');
 ok(f.peakDb<=-6&&f.peakDb>=-16&&f.tailDb<=-30,k+': 피크 -6~-16dB·끝 닫힘('+f.peakDb+','+f.tailDb+')');
 ok(f.riseMs<=({w:180,e:90,r:180,atk:20})[slot],k+': 올라오는 시간('+f.riseMs+'ms)');rms.push(f.rmsDb);}
ok(rms.length>0&&Math.max(...rms)-Math.min(...rms)<=4,'RMS 정규화: 전체 편차 4dB 이하('+(rms.length?(Math.max(...rms)-Math.min(...rms)).toFixed(1):'-')+')');
ok(total>0&&total<=900000,'음원 합계 900KB 이하('+total+')');
for(const h of HEROES)for(const s of SLOTS)ok((byKind['r786Sk_'+h+'_'+s]||[]).length>=3,h+' '+s.toUpperCase()+': 스킬 사용음 변주 3개 이상');
ok((byKind.r786Atk_hunter||[]).length>=3,'헌터 평타음 변주 3개 이상');
ok(new Set(Object.values(F).map(f=>f.sourceSha256)).size>=40,'서로 다른 원본 40개 이상');
function mk(opt={}){const played=[],timers=[];const aliases={};const roles={special:{gain:.3},attack:{gain:.3}};
 const ctx={window:{__STORYWORLD_SFX_COMFORT__:{aliases,roles}},localStorage:{getItem:k=>k==='storyworld.r786.sfx'?(opt.pref??null):null,setItem(){}},performance:{now:()=>0},console,Math,Promise,setInterval:()=>0,setTimeout:(f,ms)=>{timers.push([f,ms]);return 1;},
  soundProfiles:{special:[{path:'sp.ogg'}],attack:[{path:'atk.ogg'}]},setupAudio:()=>'base',audioUnlocked:true,player:{hp:10,hero:opt.hero||'hwando'}};
 ctx.sound=function(kind){const rows=ctx.soundProfiles[kind]||[];played.push({kind,n:rows.length});return Promise.resolve();};
 const calls=[];ctx.window.__STORYWORLD_WER__=Object.freeze({defs:{},cast(slot,auto){calls.push([slot,auto]);if(opt.refuse)return false;if(!opt.silent)ctx.sound('special');return true;}});
 ctx.window.window=ctx.window;vm.createContext(ctx);let err=null;try{vm.runInContext('var window=this.window;'+src,ctx);}catch(e){err=e;}
 return{ctx,played,calls,timers,err,api:ctx.window.__STORYWORLD_SFX_R786__,aliases,wer:()=>ctx.window.__STORYWORLD_WER__,last:()=>played[played.length-1]};}
(async()=>{
 if(!src){console.log('FAIL 모듈 없음 — 동작 검사 생략');process.exit(1);}
 let m=mk();ok(!m.err&&!!m.api,'모듈 로드('+(m.err&&m.err.message)+')');
 for(const h of HEROES)for(const s of SLOTS){m=mk({hero:h});const r=m.wer().cast(s,false);const l=m.last();
  ok(r===true&&l&&l.kind==='r786Sk_'+h+'_'+s&&l.n>=3,h+' '+s+': WER cast 의 special 이 r786Sk_'+h+'_'+s+' 로 바뀜('+(l&&l.kind)+', rows '+(l&&l.n)+')');
  ok(m.aliases['r786Sk_'+h+'_'+s]==='special','r786Sk_'+h+'_'+s+' 는 special 역할(쿨다운·우선순위 공유)');}
 m=mk({hero:'slayer'});m.wer().cast('R',true);ok(m.last().kind==='r786Sk_slayer_r','대문자 슬롯도 r 로 처리·자동 시전 인자 전달('+JSON.stringify(m.calls[0])+')');
 m=mk();m.ctx.sound('special');ok(m.last().kind==='special','WER 밖(Q 고유기 등)의 special 은 그대로');
 m=mk();m.wer().cast('q');ok(m.last().kind==='special','q 슬롯은 영웅별 R546 소리 그대로(바꾸지 않음)');
 m=mk({refuse:true});const rr=m.wer().cast('w');ok(rr===false&&m.played.length===0,'cast 가 거절되면 소리도 없고 반환값 유지');
 m=mk();m.wer().cast('w');m.ctx.sound('special');ok(m.last().kind==='special','cast 가 끝난 뒤 나는 special 은 새지 않음');
 // 기억사수처럼 cast 안에서 special 을 내지 않는 스킬
 m=mk({hero:'gunner',silent:true});m.wer().cast('w');m.ctx.sound('special');ok(m.last().kind==='r786Sk_gunner_w'&&m.timers.length===1,'cast 뒤 곧 나는 special 한 번은 그 스킬 소리(late)');m.ctx.sound('special');ok(m.last().kind==='special','그다음 special 은 그대로');
 m=mk({hero:'gunner',silent:true});m.wer().cast('e');ok(m.played.length===0&&m.timers.length===1,'special 이 없으면 140ms 뒤 직접 내기를 예약');m.timers[0][0]();ok(m.last().kind==='r786Sk_gunner_e','예약이 풀리면 그 스킬 소리를 직접 한 번');
 m=mk({hero:'gunner',silent:true});m.wer().cast('e');m.ctx.sound('special');m.timers[0][0]();ok(m.played.filter(p=>p.kind==='r786Sk_gunner_e').length===1,'늦은 special 로 이미 냈으면 직접 내기는 건너뜀(두 번 나지 않음)');
 m=mk({hero:'gunner',silent:true,refuse:true});m.wer().cast('e');ok(m.timers.length===0,'cast 가 거절되면 예약도 없음');
 m=mk({hero:'hwando'});{const W=m.wer(),b=W.cast;m.ctx.window.__STORYWORLD_WER__=Object.freeze({...W,cast(...a){return b.apply(this,a);}});m.api.wrap();}m.wer().cast('w');ok(m.played.filter(p=>p.kind==='r786Sk_hwando_w').length===1&&m.timers.length===0,'감싸기가 겹쳐도(다시 감싸기) 소리는 한 번, 직접 내기 예약 없음');
 m=mk({hero:'hunter'});m.ctx.sound('attack');ok(m.last().kind==='r786Atk_hunter'&&m.last().n>=3,'헌터 평타음이 r786Atk_hunter 로 바뀜');
 ok(m.aliases.r786Atk_hunter==='attack','r786Atk_hunter 는 attack 역할');
 m=mk({hero:'hwando'});m.ctx.sound('attack');ok(m.last().kind==='attack','헌터 외 영웅의 attack 은 그대로(R546 담당)');
 m=mk({pref:'0',hero:'hwando'});m.wer().cast('w');ok(m.last().kind==='special','storyworld.r786.sfx=0 이면 원래 소리');
 m=mk();const w0=m.wer();ok(w0.defs!==undefined&&Object.isFrozen(w0),'WER 의 다른 멤버를 유지하고 동결 상태로 되돌림');
 ok(m.api&&HEROES.every(h=>m.api.heroes.includes(h)),'공개 API 에 영웅 목록');
 console.log(`\nR786 CPU: ${n-bad}/${n}`);process.exit(bad?1:0);
})();
