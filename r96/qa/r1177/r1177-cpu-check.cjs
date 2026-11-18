// R1177 사몽 에피소드 픽셀 잔존 자산 → 칠한 그림 CPU 검사(헤드리스 브라우저 아님).
// 사용자 2026-11-18 "사몽에피소드쪽에 픽셀몹 및 픽셀자산 남아있던데 디스토피아 … 이미지 잘 적용".
// ① S-06 디스토피아 임시 픽셀 몹 시트 3종(R184 침공병·상대 초인·지휘 개체)을 칠한 시트(assets/r1177)로 — R161 표, 같은 칸 규격
// ② 사몽 에피소드 모든 구역에서 pixelfx 도트 시트(기억 조각 파괴·균열 문·나방·중간보스 손, R976 6종)를 칠한 시트로, 나가면 원래대로
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const CS=f=>fs.readFileSync(path.join(root,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(root,'runtime-text',f),'utf8');
const FILE='samong-pixel-art-r1177.js',A='assets/r1177/';
assert(fs.existsSync(path.join(root,'client-source',FILE)),'overlay '+FILE+' exists');
const src=CS(FILE);assert.strictEqual(src,RT(FILE));ok('client-source and runtime copies agree');
const webpSize=b=>{assert.strictEqual(b.toString('ascii',0,4),'RIFF');const t=b.toString('ascii',12,16);
 if(t==='VP8X')return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];if(t==='VP8 ')return [b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];
 if(t==='VP8L'){const v=b.readUInt32LE(21);return [1+(v&0x3fff),1+((v>>14)&0x3fff)];}throw new Error('webp '+t);};
// ① R161 S-06 표
{const r161=CS('samong-r161.js');assert.strictEqual(r161,RT('samong-r161.js'));
 const m=/S06='([^']+)'/.exec(r161);assert(m,'S06 dir');assert.strictEqual(m[1],A,'S-06 sheets come from '+A+' not the R184 pixel dir');
 for(const k of ['invader','rival','commander']){const p=path.join(root,'runtime-text',A,'s06-'+k+'-walk-right-8.webp');assert(fs.existsSync(p),k);
  const b=fs.readFileSync(p);assert.deepStrictEqual(webpSize(b),[1024,640],k+' keeps the 4x2 256x320 sheet size R161 slices');
  assert(b.length>40000,k+' is a painted sheet, not a few-colour pixel sheet ('+b.length+'B; R184 pixel sheets were 1-2KB)');}
 for(const f of ['s06-invader-walk-right-8.webp','s06-rival-walk-right-8.webp','s06-commander-walk-right-8.webp'])assert(fs.existsSync(path.join(root,'runtime-text/assets/r184/s06',f)),'R184 original kept '+f);
 ok('R161 S-06 table points to painted 1024x640 sheets in assets/r1177; R184 originals preserved');}
// 자산 표
{const ix=JSON.parse(RT(A+'index.json'));let total=0;
 for(const [k,r] of Object.entries(ix.files)){const b=fs.readFileSync(path.join(root,'runtime-text',A,r.file));assert.strictEqual(b.length,r.bytes,k);
  assert.strictEqual(crypto.createHash('sha256').update(b).digest('hex'),r.sha256,k);assert(r.source&&!/r184|r163\/pixelfx/.test(r.source),k+' source is painted art');total+=b.length;}
 assert(total<2500000,'r1177 assets '+total);ok('asset table matches files, painted sources, total '+total+'B');}
// 빌드 연결
{const idx=RT('index.html'),at=k=>idx.indexOf('"./'+k+'"');assert.strictEqual(idx.split('"./'+FILE+'"').length,2,'loaded once');
 assert(at(FILE)>0&&at(FILE)<at('combat-r118.js'),'before combat-r118');/* R976 와의 앞뒤는 아래 '두 가지 실림 순서' 검사가 확인(태그 순서 정규식이 없는 자리에 둔다) */
 assert(fs.readFileSync(path.join(root,'..','scripts','verify-r96-public.py'),'utf8').includes("'"+FILE+"'"));
 assert(fs.readFileSync(path.join(root,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r1177/r1177-cpu-check.cjs'));
 const spec=JSON.parse(fs.readFileSync(path.join(root,'runtime-inputs.json'),'utf8'));
 for(const p of [FILE,A+'index.json',A+'s06-invader-walk-right-8.webp',A+'s06-rival-walk-right-8.webp',A+'s06-commander-walk-right-8.webp',A+'void-implosion-blood.webp',A+'rift-blood.webp',A+'choir-moths-blood.webp'])assert(spec.textPaths.includes(p),'runtime inputs '+p);
 ok('index.html once (before combat-r118), public verify, Pages CPU step, runtime inputs');}
// ---- 가짜 엔진(R976 과 함께) ----
const R976=CS('samong-p-art-r976.js');
function engine(order='976-first'){const row=(file,frame,cols,frames,fps,loop)=>({file,frame,pivot:[frame[0]/2,frame[1]*.8],columns:cols,frames,fps,loop});
 const meta={'core-orb-teal':row('core-orb-teal.webp',[136,112],6,36,15,true),'portal-teal':row('portal-teal.webp',[152,116],6,36,15,true),
  'tendrils-blood':row('tendrils-blood.webp',[208,130],6,44,15,false),'meteor':row('meteor.webp',[272,232],8,72,15,false),
  'dark-explosion-blood':row('dark-explosion-blood.webp',[280,248],7,55,15,false),'collect-burst':row('collect-burst.webp',[112,108],5,17,15,false),
  'hands-blood':row('hands-blood.webp',[200,116],5,42,15,false),'pvfx-void-implosion':row('pvfx-void-implosion.webp',[192,192],5,14,20,false),
  'pvfx-rift-portal':row('pvfx-rift-portal.webp',[192,192],5,16,20,true),'pvfx-choir-moths':row('pvfx-choir-moths.webp',[192,192],5,60,20,true),
  'crit-hit':row('crit-hit.webp',[216,136],5,11,15,false),'pvfx-frost-nova':row('pvfx-frost-nova.webp',[192,192],5,13,20,false)};
 const orig=JSON.parse(JSON.stringify(meta));const ready=new Set(),added=[];
 const g={window:{},document:{getElementById:()=>null,addEventListener(){}},localStorage:{getItem:()=>null,setItem(){}},meta,orig,ready,added};
 g.window.__STORYWORLD_PIXELFX_R163__=Object.freeze({meta:()=>meta,has:k=>!!meta[k],dir:'assets/r163/pixelfx/'});
 globalThis.room=null;globalThis.time=0;globalThis.started=true;globalThis.player={x:0,y:0};globalThis.actorHeight=()=>60;
 globalThis.addImage=p=>{added.push(p);};globalThis.readyImage=p=>ready.has(p)?{image:{src:p,width:1,height:1}}:null;globalThis.tick=()=>{};
 const run=s=>new Function('window','document','localStorage',s).call(globalThis,g.window,g.document,g.localStorage);
 if(order==='976-first'){run(R976);run(src);}else{run(src);run(R976);}g.A=g.window.__STORYWORLD_SAMONG_PIXEL_ART_R1177__;g.P=g.window.__STORYWORLD_SAMONG_P_ART_R976__;return g;}
const go=(r)=>{globalThis.room=r;globalThis.tick();};
const S06={id:'u203',layer:'DREAM',samongR103:{zone:'sz115-S06-1',key:'S-06'},props:[]},RA={id:'ep1a10',layer:'DREAM',samongR103:{zone:'sz115-RA-3',key:'RA'},props:[]},
 PZ={id:'dist05',layer:'DREAM',samongR103:{zone:'sz115-P-2',key:'P'},props:[]},STORY={id:'dist05',layer:'STORY',props:[]},DREAMW={id:'dist01',layer:'DREAM',props:[]};
const OWN=['pvfx-void-implosion','pvfx-rift-portal','pvfx-choir-moths','hands-blood'],P6=['core-orb-teal','portal-teal','tendrils-blood','meteor','dark-explosion-blood','collect-burst'];
{const g=engine();assert(g.A&&/R1177/.test(g.A.revision),'api');go(STORY);
 for(const k of Object.keys(g.orig))assert.deepStrictEqual(g.meta[k],g.orig[k],'story untouched '+k);ok('story mode: pixelfx table untouched');
 go(DREAMW);for(const k of Object.keys(g.orig))assert.deepStrictEqual(g.meta[k],g.orig[k],'samong-world (non-episode) untouched '+k);ok('samong world DREAM layer (not an episode zone) untouched');
 go(S06);const real=k=>g.A.resolve('assets/r163/pixelfx/'+g.meta[k].file)||g.P.resolve('assets/r163/pixelfx/'+g.meta[k].file);
 for(const k of OWN){const r=real(k);assert(r&&r.startsWith(A),k+' -> '+r);assert(!g.meta[k].file.includes('..'),k);}
 for(const k of P6){const r=real(k);assert(r&&!/r163\/pixelfx/.test(r),k+' painted in S-06: '+r);}
 for(const k of ['crit-hit','pvfx-frost-nova'])assert.deepStrictEqual(g.meta[k],g.orig[k],'hero fx untouched '+k);
 ok('S-06: memory-break/rift/moths/hands use r1177 painted sheets, R976 six painted too, hero fx untouched');
 for(const k of [...OWN,...P6]){const o=g.orig[k],r=g.meta[k];assert.strictEqual(!!r.loop,!!o.loop,k+' loop');
  if(!o.loop){const d0=o.frames/o.fps,d1=r.frames/r.fps;assert(Math.abs(d0-d1)/d0<.08,k+' duration '+d0+' vs '+d1);}
  assert(r.columns>0&&r.frames>0&&r.frame[0]>0&&r.frame[1]>0&&Number.isFinite(r.pivot[0]+r.pivot[1])&&Number.isFinite(r.fps)&&r.fps>0,k+' sane');}
 ok('same play length (±8%) for one-shots, loop flag kept, finite frame/pivot/fps');
 g.ready.add(A+'void-implosion-blood.webp');const row=globalThis.readyImage('assets/r163/pixelfx/'+g.meta['pvfx-void-implosion'].file);assert(row&&row.image.src===A+'void-implosion-blood.webp');
 globalThis.addImage('assets/r163/pixelfx/'+g.meta['pvfx-rift-portal'].file);assert(g.added.includes(A+'crimson-fissure-12.webp'));/* R1177c(사용자 밤샘 지시 'Dots 결과 적용'): 균열 문은 Dots C2 시트 */globalThis.addImage('assets/x.webp');assert(g.added.includes('assets/x.webp'));
 ok('aliases resolve through engine readyImage/addImage; other paths pass through');
 go(PZ);for(const k of OWN)assert((g.A.resolve('assets/r163/pixelfx/'+g.meta[k].file)||'').startsWith(A),'P own '+k);
 for(const k of P6)assert(g.meta[k].r976Path&&!/r163/.test(g.meta[k].r976Path),'P: R976 row '+k);ok('P: own keys swapped, R976 keeps its six');
 go(RA);go(PZ);go(S06);go(STORY);for(const k of Object.keys(g.orig))assert.deepStrictEqual(g.meta[k],g.orig[k],'restored '+k);
 ok('S-06→P→RA→P→S-06→story: every pixelfx entry restored exactly');
 go(S06);g.A.set({on:false});for(const k of Object.keys(g.orig))if(!P6.includes(k))assert.deepStrictEqual(g.meta[k],g.orig[k],'off '+k);ok('off switch restores');
 g.A.set({on:true});go(null);go({});go({samongR103:{zone:null}});ok('null/odd rooms do not throw');assert.strictEqual(g.A.inspect().stats.errors,0,'no errors');}
// 회귀: 다른 덧씌우기(R1028)가 이미 칠한 시트로 바꾼 칸은 사몽 구역에서도 그대로, 나와도 그대로
{const g=engine();const r28={...g.meta['tendrils-blood'],file:'r1028/tendrils-blood.webp'};g.meta['tendrils-blood']=r28;
 go(STORY);go(S06);assert.strictEqual(g.meta['tendrils-blood'],r28,'R1028 row kept in S-06');go(STORY);assert.strictEqual(g.meta['tendrils-blood'],r28,'R1028 row kept after');
 assert((g.A.resolve('assets/r163/pixelfx/'+(go(S06),g.meta['pvfx-void-implosion'].file))||'').startsWith(A),'others still swapped');go(STORY);
 ok('rows another overlay already painted (R1028 tendrils) are left alone in and out of episodes');}
// 두 가지 실림 순서(R1177 이 R976 보다 먼저 실려도) — 몇 틱 안에 같은 상태로 모이고, 본편으로 나오면 원래 행
{for(const order of ['976-first','1177-first']){const g=engine(order);const tk=r=>{for(let i=0;i<3;i++)go(r);};
  tk(STORY);tk(S06);const s06={...Object.fromEntries(Object.keys(g.meta).map(k=>[k,g.meta[k].file]))};
  for(const k of OWN)assert(/^r1177\//.test(s06[k]),order+' S-06 '+k);for(const k of P6)assert(/^r976\//.test(s06[k]),order+' S-06 '+k);
  tk(PZ);for(const k of P6)assert(g.meta[k].r976Path&&!g.meta[k].r1177,order+' P R976 row '+k);for(const k of OWN)assert(/^r1177\//.test(g.meta[k].file),order+' P own '+k);
  tk(S06);for(const k of P6)assert(/^r976\//.test(g.meta[k].file),order+' back to S-06 '+k);
  tk(PZ);tk(STORY);for(const k of Object.keys(g.orig))assert.deepStrictEqual(g.meta[k],g.orig[k],order+' restored '+k);}
 ok('either load order (R976 first or R1177 first) settles to the same rows and restores exactly');}
// R976 단독 동작 그대로(R1177 없이 P 밖에서는 R976 이 되돌림) — R976 검사가 따로 확인
console.log(`\n${n} checks passed`);
