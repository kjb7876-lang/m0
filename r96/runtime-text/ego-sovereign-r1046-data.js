/* R1046 히든 영웅 '마지막 수호자 EGO' — 데이터(사용자 2026-11-15 06:53Z "이 자산으로 … 히든영웅 넣어줘", 후속 지시 우선).
 * 데이터만 둔다(그리기·판정 코드 없음). ego-sovereign-r1046.js 가 읽는다.
 *  · profile: 영웅 선택창·해금 컷인 글. 게임 밖 사정(만든 사람·다른 작품·이 세계가 만들어진 것)은 직접 말하지 않는다 — 암시만.
 *  · abilities: 능력 표. 새 능력은 이 표에 한 줄을 더하는 것으로 시작한다(id·이름·발동 조건·효과·대기·지연·몸짓·이펙트를 따로 둔다).
 *    몸짓(anim)은 2D 그림 이름이고, 3D 로 바꿀 때도 같은 id 로 같은 판정을 쓴다.
 *  · dispel: '관측 폐기'가 걷어낼 수 있는 상태와 걷어내지 않는 상태를 이름으로 나눈 표.
 * 해금·형상 판정은 오버레이가 한다. 서사 원문(S-07)은 바꾸지 않는다. */
(()=>{'use strict';
if(window.__STORYWORLD_EGO_SOVEREIGN_R1046_DATA__)return;
const F=Object.freeze;
const profile=F({
 id:'ego',base:'hwando',
 name:'EGO',title:'마지막 수호자 EGO',role:'몽세의 군주',
 color:'#c8323f',
 tags:F(['근거리','히든','환도의 계보']),
 // 영웅 선택창 무대(기록). 지나치게 설명하지 않는다.
 record:F([
  '페르소나의 식탁에서 가면을 내려놓은 뒤, 환도를 쥔 몸 안에서 눈을 뜬 자아.',
  '그는 자기 안의 악의를 지우지 않았고, 남의 탓으로 돌리지도, 잊은 척하지도 않았다. 모두 자기 것이라 인정하고 그 책임을 졌다.',
  '그 뒤로 몽세는 그의 뜻에 따라 다시 짜인다. 그래도 그는 자기 자신을 구원하지는 못한다.'
 ]),
 passive:'관측 폐기 — 해로운 상태에 걸리면 0.7초 뒤, 그 일을 일어나지 않은 가능성으로 돌린다. 이미 입은 상처와 죽음은 폐기하지 못한다.',
 special:'정화 연참(환도의 검) — 뒤이어 페르소나의 기술이 돌아가며 따라 나간다',
 sealed:'아직 이름 붙이지 않은 것들이 그의 안에서 기다린다. 그는 그것들을 서두르지 않는다.',
 // 해금 컷인 — 합일1 원문(사용자 자산, 바꾸지 않음).
 cutin:F({image:'assets/r1046/ego-cutin.webp',caption:'진정한 합일을 이루어 마침내 완성된 ego 몽세를 완전히 평정하기 위한 여행을 떠난다. 내면의 악의,욕망 또한 나의 일부분이었음을... 인간은 스스로를 구원할 수 없다...',seconds:5.5}),
 portrait:'assets/r1046/ego-portrait.webp',
 // 아주 드물게(형상을 고른 직후 한 번) — 정체를 확정하지 않는 한 줄.
 hint:'나는 이 꿈의 바깥을 모른다. 다만 이 꿈이 어디서 시작되었는지는 기억한다.'
});
const abilities=F([
 F({id:'observe-discard',name:'관측 폐기',kind:'passive',key:null,
  trigger:F({on:'debuff',requires:'dispellable'}),
  delay:.7,cooldown:16,
  effect:F({type:'dispel',table:'dispel',refundDamage:false,undoDeath:false}),
  anim:'ego-discard',tiers:F({id:'egoDiscardR1094',max:7,step:.07,cap:1.4,scales:F(['cooldown','delay'])}),fx:F({sheet:'assets/r100/sig-gather-red.webp',size:192,frames:12,life:.9}),
  lines:F(['그런 일이 있었던가.','그것은 지나간 일이 아니다. 애초에 도래하지 않은 가능성이었다.','나는 그것을 기억한다. 다만 현실이었다고 인정하지 않을 뿐.']),
  desc:'해로운 상태를 일어나지 않은 가능성으로 돌린다.'}),
 // 기존 RC151 '마지막 수호자 EGO'(페르소나 처치 뒤 변신) 능력 — 지우거나 바꾸지 않고, 같은 근원(심상세계의 현실 재구성)으로 표에만 적는다. 판정은 RC151 코드 그대로.
 F({id:'rc151-lance',name:'악의의 관통',kind:'existing',source:'RC151',key:'A',desc:'붉은 창탄. 세 번째·다섯 번째 공격에서 정화 장판과 갈래 탄으로 번진다.'}),
 F({id:'rc151-fusion',name:'융합 정화',kind:'existing',source:'RC151',key:'Q',desc:'아홉 갈래 창탄과 봉인 — 보호막과 회복.'}),
 F({id:'rc151-red-time',name:'적색 시간',kind:'existing',source:'RC151',key:'F',desc:'EGO 진입 뒤 시계가 붉게 멈추면, 받는 공격이 확률로 닿지 않은 일이 된다.'}),
 // R1094 협주(사용자 11-16 01:52Z "페르소나보스 공격과스킬 환도영웅공격과스킬 콜라보"): 환도의 기술 뒤에 페르소나 보스의 기술이 따라 나간다. 판정·배분은 ego-kit-r1094.js. 키는 늘리지 않는다.
 F({id:'collab-basic',name:'베기와 관통',kind:'collab',source:'R1094',key:'A',hwando:'기본 베기',persona:F(['악의의 관통','욕망의 씨앗']),desc:'세 번째 베기마다 붉은 창 셋, 다섯 번째마다 욕망의 씨앗 셋이 따라 나간다.'}),
 F({id:'collab-special',name:'정화 연참 · 악의의 순환',kind:'collab',source:'R1094',key:'Q',hwando:'정화 연참',persona:F(['순수악의의 분기','내면의 소용돌이','악의 시선','욕망의 일식']),desc:'연참 뒤 페르소나의 기술 넷이 차례로 돌아가며 이어진다.'}),
 F({id:'collab-w',name:'월섬 회천 · 감춘 충동',kind:'collab',source:'R1094',key:'W',hwando:'월섬 회천',persona:F(['감춘 충동']),desc:'회천 뒤 마름모 셋이 시차를 두고 뻗는다.'}),
 F({id:'collab-e',name:'백은 유영보 · 악의 시선',kind:'collab',source:'R1094',key:'E',hwando:'백은 유영보',persona:F(['악의 시선']),desc:'내디딘 자리에서 눈 셋이 적을 겨눈다.'}),
 F({id:'collab-r',name:'EGO 환수검 · 끝없는 갈망',kind:'collab',source:'R1094',key:'R',hwando:'EGO 환수검',persona:F(['끝없는 갈망','되비친 집착']),desc:'환수검 뒤 사방으로 시계 여섯이 퍼지고, 되비친 집착이 몸을 감싼다.'}),
 F({id:'collab-f',name:'EGO 각성 · 욕망의 일식',kind:'collab',source:'R1094',key:'F',hwando:'EGO 각성',persona:F(['욕망의 일식']),desc:'각성하는 순간 느리고 무거운 일식 둘이 앞으로 굴러간다.'}),
 F({id:'collab-celestial',name:'적·청·무라사키(라우렌의 천체 공명)',kind:'collab',source:'R1094',key:null,proc:F({chance:.1,crowdBonus:.04,max:.35,cooldown:5}),persona:F([]),lauren:F(['은빛 거성','심연 왜성','쌍성 소멸']),desc:'자기 타격에서 확률로 붉은 구와 먹빛 구가 번갈아 나가고, 둘이 다 나간 뒤엔 둘이 합쳐 꿰뚫는다. 빛은 주홍과 먹으로 물든다.'}),
 // 봉인된 칸: 이름도 효과도 아직 없다(같은 표에 채워 넣는다). 판정 코드는 이 칸을 건너뛴다.
 F({id:'sealed-1',name:'봉인된 개념',kind:'sealed',sealed:true}),
 F({id:'sealed-2',name:'봉인된 개념',kind:'sealed',sealed:true}),
 F({id:'sealed-3',name:'봉인된 개념',kind:'sealed',sealed:true})
]);
// '관측 폐기'가 다루는 상태. 걷어내도 다른 판정(적의 공격·보스 연출·저장)이 깨지지 않는 것만 dispellable 로 둔다.
const dispel=F({
 dispellable:F([
  F({id:'story150',label:'이야기 보스 상태(둔화·공명 고갈·재사용 지연·잔향)',note:'상태만 걷는다. 이미 빠진 공명·늘어난 대기는 돌려주지 않는다.'}),
  F({id:'regional58',label:'지역 상태이상(출혈·중독·화상·냉기·감전·저주·쇠약·속박)',note:'R58 상태 표만 비운다.'}),
  F({id:'wounds53',label:'병원 상처(남은 지속 피해·흡혈 저하)',note:'아직 들어오지 않은 지속 피해만 사라진다. 이미 깎인 체력은 그대로.'}),
  F({id:'bleed71',label:'출혈(R71)',note:'남은 출혈만 멈춘다.'}),
  F({id:'healblock9',label:'회복 봉쇄',note:'봉쇄 시각만 지금으로.'})
 ]),
 nonDispellable:F([
  F({id:'fields61',label:'원소 장판 상태(R61)',why:'장판·투사체 판정과 한 묶음이라, 걷으면 적의 공격까지 사라진다.'}),
  F({id:'persona-red',label:'페르소나 붉은 시간',why:'보스 연출 고유 규칙.'}),
  F({id:'binding87',label:'연출 속박(R87)',why:'보스 패턴·이야기 연출이 쥐고 있다.'}),
  F({id:'damage',label:'이미 받은 피해',why:'관측 폐기는 상처를 되돌리지 않는다.'}),
  F({id:'death',label:'죽음',why:'자기 자신은 구원하지 못한다.'})
 ])
});
window.__STORYWORLD_EGO_SOVEREIGN_R1046_DATA__=F({revision:'R1046-data-1',profile,abilities,dispel});
})();
