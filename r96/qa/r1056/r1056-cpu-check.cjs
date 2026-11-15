// R1056 — 동양 테마 지역에 상업 사용 가능한 국악 BGM(사용자 2026-11-15 11:38Z "동양쪽은 동양전통음악 상업적 사용가능한거 넣은것도 좋아보이는데", 11:40Z "ㄱㄱ 개선진행").
// 공유마당 '국악 BGM'(주식회사 아이티앤, CC BY 4.0) 여러 곡을 이어 붙여 동양 지역(환도 자아의 탄생·잠들지 못하는 마을·사몽 경성의 밤 절정)에만 배정한다.
// 검사: 라이선스·출처(곡마다 공유마당 글 번호)·파일 해시·길이, 배정 범위(동양 지역만 바뀜, 나머지 그대로), R353 목록, 크레딧, 소리 규칙 문서.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..'),read=p=>fs.readFileSync(path.join(R,p),'utf8');
let n=0;const ok=(name,c)=>{if(!c)throw new Error('FAIL: '+name);n++;console.log('ok -',name);};
const IX=JSON.parse(read('runtime-text/assets/r308/bgm/index.json'));
const NEW=Object.entries(IX.tracks).filter(([,t])=>t.origin==='R1056');
ok('국악 곡 5개 이상 ('+NEW.length+')',NEW.length>=5);
for(const[id,t]of NEW){
 ok(id+' CC BY 4.0',t.license==='CC BY 4.0'&&t.licenseUrl==='https://creativecommons.org/licenses/by/4.0/');
 ok(id+' 저작자 주식회사 아이티앤',/아이티앤/.test(t.performer)&&/아이티앤/.test(t.composer));
 ok(id+' 출처 공유마당',/^https:\/\/gongu\.copyright\.or\.kr\/gongu\/wrt\/wrt\/view\.do\?wrtSn=\d+/.test(t.source)&&/CC BY/.test(t.licenseEvidence||'')&&(t.licenseEvidence||'').length>40);
 ok(id+' 이어 붙인 원곡 2개 이상, 곡마다 글 번호·원본 해시',Array.isArray(t.parts)&&t.parts.length>=2&&t.parts.every(p=>/^\d{8}$/.test(String(p.wrtSn))&&/^국악 BGM #\d+$/.test(p.title)&&/^[0-9a-f]{64}$/.test(p.originalSha256||'')));
 ok(id+' 원본 해시',/^[0-9a-f]{64}$/.test(t.originalSha256||''));
 const b=fs.readFileSync(path.join(R,'runtime-text',t.path));
 ok(id+' ogg·크기·해시',/^assets\/r1056\/bgm\/[a-z0-9-]+\.ogg$/.test(t.path)&&b.length===t.bytes&&crypto.createHash('sha256').update(b).digest('hex')===t.sha256);
 ok(id+' 길이 110~300초('+t.durationSec+')',t.durationSec>=110&&t.durationSec<=300);
 ok(id+' 음량 −18 LUFS 근처·gain 0.5~0.7',Math.abs((t.lufs??-99)+18)<=1.5&&t.gain>=.5&&t.gain<=.7);
 ok(id+' 가공 기록',/LUFS/.test(t.changes||'')&&/교차/.test(t.changes||''));}
// 배정: 동양 지역만
const EAST={restU2:'main',last304:'main',last305:'main',last301:'climax',last302:'main',last303:'climax'};
const isNew=id=>IX.tracks[id]?.origin==='R1056';
for(const[z,role]of Object.entries(EAST))ok(z+' → 국악('+IX.maps[z].track+')',isNew(IX.maps[z].track)&&IX.maps[z].role===role);
ok('환도 탐색 3맵은 같은 곡(맵 이동 때 이어 틀기)',new Set(['restU2','last304','last305'].map(z=>IX.maps[z].track)).size===1);
ok('절정 곡은 탐색 곡과 다름',IX.maps.last301.track!==IX.maps.restU2.track&&IX.maps.last303.track!==IX.maps.last302.track);
const others=Object.keys(IX.maps).filter(z=>!EAST[z]);
ok('다른 맵 '+others.length+'곳은 국악 아님',others.every(z=>!isNew(IX.maps[z].track)));
const S=IX.samong.episodes;ok('사몽 경성의 밤 절정 → 국악',isNew(S['S-05'].climax));
ok('경성의 밤 탐색은 그대로(녹턴 Op.48-1)',S['S-05'].main==='nocturne-c-minor');
ok('다른 사몽 장은 국악 아님',Object.entries(S).filter(([k])=>k!=='S-05').every(([,e])=>!isNew(e.main)&&!isNew(e.climax))&&!isNew(IX.samong.fallback.main)&&!isNew(IX.fallbackTrack));
ok('바꾸기 전 배정 기록',IX.r1056?.was?.maps?.restU2==='winter'&&IX.r1056.was.maps.last303==='chopin-cello-largo'&&IX.r1056.was.samong?.['S-05|climax']==='mozart40');
const ep=id=>IX.episodes.find(e=>e.id===id);
ok('에피소드 표도 같은 곡',ep('m6').main===IX.maps.restU2.track&&ep('m6').climax.last301===IX.maps.last301.track&&ep('m7').main===IX.maps.last302.track&&ep('m7').climax.last303===IX.maps.last303.track);
ok('라이선스 정책에 NC·ND 금지 그대로',/NC·ND/.test(IX.licensePolicy));
// R353 설정 목록
const pick=read('client-source/bgm-pick-r353.js');
for(const[id]of NEW)ok('R353 목록에 '+id,new RegExp("\\['"+id+"','[^']*[가-힣][^']*','아이티앤'\\]").test(pick));
// 크레딧·문서
const cr=read('runtime-text/assets/r1056/bgm/CREDITS.md');
for(const[id,t]of NEW)for(const p of t.parts)ok('크레딧에 '+id+' '+p.title,cr.includes(String(p.wrtSn))&&cr.includes(p.title));
ok('크레딧 CC BY 4.0·저작자',/CC BY 4\.0/.test(cr)&&/주식회사 아이티앤/.test(cr)&&/공유마당/.test(cr));
const doc=fs.readFileSync(path.join(ROOT,'docs/sound-rules.md'),'utf8');
ok('소리 규칙 문서에 BGM 규칙(R1056)',/R1056/.test(doc)&&/공공누리 제?3유형|공공누리 3유형/.test(doc)&&/NC/.test(doc));
console.log('\nR1056 CPU '+n+'/'+n);
