// R523 방 꾸미기(본편 방 이름 지역) — 사용자 2026-11-10 02:55Z "병원맵 가구및조형물및사물 배치처럼 모든맵 배치 잘해서 실제 맵같게 해줘".
//  원인(헤드리스 전수 조사, main 9bce8ba, qa/r523/review.md): 방 이름이 붙은 본편 지역(R171 지도)은 방이 9×10~32×21칸인데 R449 가 방마다 뒤쪽 한 벽에 1~4점만 놓아
//   지역당 8~31점. 23×23칸 주사실에 가구 넉 점, 거실에 소파 한 점 — 벽과 바닥만 보여 방의 쓰임새가 읽히지 않았다. 그 가운데 일부는 정면 3/4 시점 그림이라 바닥 격자와 각도도 안 맞았다.
//  고침(그리기 전용 — 충돌·길찾기·몹·저장·문·목표·서사·room.props 그대로): 병원 본관 R521 의 방식을 방 이름이 있는 지역으로 넓힌다.
//   · 방 모양에서 화면에 보이는 뒤쪽 벽(북·서) 줄을 스스로 찾는다(바닥 칸과 벽 상자만 본다 — 문 틈·튀어나온 벽 덩어리는 줄을 끊는다).
//   · 방 이름 → 쓰임새 → 가구 묶음 줄: 가장 긴 벽에 그 방의 주된 가구(침대 줄·처치대·소파…), 다음 벽에 보조 가구(약장·수납), 안쪽 구석에 키 큰 장.
//   · 모든 가구는 등·머리를 벽에 붙인다(바닥 자리 ft 로 계산, R521 과 같은 식). 방 가운데(전투 공간)·문 틈·출입구·목표·상자·길잡이 길은 비운다.
//   · 각도 맞는 그림만(바닥 윤곽 기울기와 2:1 격자 차이 9.5° 안, 약장만 구석 전용 11.0°). 그림은 그려진 방향을 지키고, 두 방향 그림이 있으면 벽에 맞는 쪽을 쓴다.
//   · 맡은 방의 R449·R224 가구는 그리는 동안만 뺀다(자료는 그대로 — 끄면 예전 배치로 돌아간다). 보스 전투실·중앙 전투실·맘몬(ep1b06)·사몽·병원 본관(R521)은 손대지 않는다.
//  그리는 길: R521 과 같다 — draw() 동안만 room.props 뒤에 덧붙이고, 낮은 가구의 발밑 타원 끄기·밑동 맞춤 되돌리기·바닥 닿는 그림자는 R521 의 drawProp 감싸기(r521Ward 표시)를 그대로 탄다.
//  결정성: 난수 없음. 지도 자료만 보고 방마다 한 번 계획한다(몹·시간·R224 자리 안 봄). 같은 이름 방은 차례 번호로 묶음 순서만 돌린다.
//  끄기: localStorage['storyworld.r523.rooms']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_ROOMS_R523__)return;
const REV='R523-rooms-1',KEY='storyworld.r523.rooms';
const prefs={on:true};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof s?.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={builds:0,rooms:0,placed:0,dropped:0,pushed:0,frames:0,shown:0,rested:0,reloads:0,errors:0};let lastError=null,dropLog=[],lastPlan=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const fin=Number.isFinite,SQ=Math.SQRT1_2,R2=Math.SQRT2,BACK=.5*SQ,RISE=Math.sqrt(3)/2,MW=20,MH=28;

// ---- 그림 ------------------------------------------------------------------------------------------
//  qa/r523/mkart.py 가 그림에서 잰 표(손으로 고치지 않는다). h = 그림 높이(px, zoom 전 — 영웅 키 66) · face = 그림이 등을 댄 벽('w' 서 / 'n' 북 / 's' 방향 없음)
//  ang 'iso' = 바닥 모서리가 2:1 격자와 맞는 가구(ft = 바닥 자리 [왼쪽·오른쪽·맨 아래 꼭짓점 가로 자리], 단위 = 화면 칸) · 'pole' = 기둥·더미처럼 방향이 없는 것(d = 벽에서 발까지)
//  r = 불투명한 부분의 사각형 [왼쪽, 오른쪽, 아래, 위](발 기준) · m = 그 안 20×28 알파 칸(16진수) · up = 그림 아래 여백(키에 대한 비) · pair = 다른 벽용으로 따로 그려진 짝
const ART=Object.freeze(/*ART*/{
 bed:{path:'assets/hospital-maze/bed.png',h:88,face:'w',ang:'iso',flat:true,up:0.018,ft:[-1.061,1.055,0.284],r:[-1.061,1.055,0,1.78],m:'0c0001c0003d8007fc00ff200ffb00ffc80ffe40fff20fffd0fffe07fff03fffb3ffff7ffff6ffff67fff63fff03fff007fe003fe003fc001f4000c4000c0000c0000c0000c0'},
 stretcher:{path:'assets/hospital-maze/stretcher.png',h:64,face:'n',ang:'iso',flat:true,up:0.011,ft:[-0.946,0.946,0.258],r:[-0.946,0.946,0,1.301],m:'02000118003cc007e200ff900ff840ffe607ff107ff883ffc01ffe01fff837ffc3fffc3afff6d7ff26bff237fe01bfe00dfc007f8003ec001cc0008c000c8000c0000c0000c0'},
 overbed:{path:'assets/r521/overbed-table.webp',h:48,face:'w',ang:'iso',flat:true,up:0.007,ft:[-0.411,0.533,0.15],r:[-0.533,0.533,0,0.985],m:'3c0007f000ffc00fff00fffc03fff00fffc03ffe00ffe003fc000f800038000180001c0001c01e1c03f1806dd81c0f83803c3001f3001f1001f00071000e0000c0000c0000c0'},
 medcab:{path:'assets/r521/medicine-cabinet.webp',h:86,face:'n',ang:'iso',flat:true,up:0.006,ft:[-0.489,0.495,0.224],r:[-0.495,0.495,0,1.766],m:'0f0003fe007ffc0ffff8ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffcffff00ff8001f000030'},
 trolley:{path:'assets/r521/surgical-cart.webp',h:50,face:'n',ang:'iso',flat:true,up:0.006,ft:[-0.476,0.47,0.156],r:[-0.476,0.476,0,1.027],m:'0e0001a000730004f8005fe00fff00fffc07ffe65ffff47fff43fff47fff5ffff7fff9fffe1fffc1fffe1cfff9c7fff01fff00fff007ff001f3000e30006000060000e000040'},
 wheelchair:{path:'assets/hospital-maze/chair.png',h:52,face:'w',ang:'pole',up:0.01,d:0.9,r:[-0.459,0.459,0,1.062],m:'0180001c000040001c00c7c007fe001ff801ffc01fff01fff01ffe83fff87fff8ffff8ffff8ffff8ffff8fffbcffffcffefc7fe1c6763e37e1f3fe1f1ef3c00ff000fe000cc0'},
 monitor:{path:'assets/hospital-maze/monitor.png',h:60,face:'s',ang:'pole',up:0.01,d:0.55,r:[-0.278,0.278,0,1.222],m:'01e000ffc01fff01fff81fff83fff83fff83fff03dff03cff03cfc034f003cf803cf0018e0008e000de000de000760000e0000f0007ff07fffee0387e0187001800038000380'},
 iv:{path:'assets/hospital-maze/iv.png',h:74,face:'s',ang:'pole',up:0.013,d:0.5,r:[-0.303,0.303,0,1.499],m:'0060017f001866800630006fc006fc006fc006fc00ffc0067c00630006300063000620007100071000710006700060000600186301fff81ffb0ffffee0607e06030060000700'},
 stool:{path:'assets/hospital-maze/stool.png',h:32,face:'s',ang:'pole',up:0.016,d:1.5,r:[-0.256,0.258,0,0.645],m:'03fc00fff01fff81fff83fffc3fffc1fff81fff80ffe000f0000680007c0006c000600007000670007f040fffe0fffe7ffc7ffff7e0cfee0c1ce0c0e60c0e01e0e01e0e00c00'},
 lamp:{path:'assets/r521/exam-lamp.webp',h:74,face:'s',ang:'pole',up:0.006,d:0.6,r:[-0.604,0.608,0,1.52],m:'003000078000dc0019fc030fe060ff0e0ff0603f0401e04000040000e00004000040000400004000040000400004000278007f8007f8003fe0076300c2300c20000300002000'},
 crutches:{path:'assets/r521/crutches.webp',h:46,face:'s',ang:'pole',up:0.006,d:0.35,r:[-0.22,0.22,0,0.945],m:'780007ff003ffc030dff309ff2199c21b0c61b0861b187f6186ff10637f063cf026c603c6603c6c03c78078f0078f0078f0079e0031e0071e0061c00f1800f38000380003800'},
 curtain:{path:'assets/r523/curtain.webp',h:80,face:'w',ang:'pole',d:1.2,r:[-0.598,0.598,0,1.664],m:'20000380003c0003f0003fc003ff003ffc83fff83fff83fff83fff83fff83fff83fff83fff83fff83fff87fff8e3ff8c1ff8c07f8001f8000ff0003f0003f000300003000030'},
 chair145:{path:'assets/world-r80/r80-145.webp',h:56,face:'w',ang:'iso',flat:true,up:0.006,ft:[-0.358,0.388,-0.048],r:[-0.388,0.388,0,1.151],m:'00f8007f801ff803ffc07ffc0fffc0fffc0fff80ffc80fe080781c040fe043ff86fffe7ffff3ffff7ffff6fffb43fe140f0140c01408014080100c0100c0000c0000c0000c00'},
 table146:{path:'assets/world-r80/r80-146.webp',h:69,face:'n',ang:'iso',flat:true,up:0.008,ft:[-0.657,0.654,0.011],r:[-0.699,0.699,0,1.413],m:'00e0001f8003fc00fff01fff83fffefffffffffffffffffffffffffdfffbcfff3c3fc3c1f83c0702c0602c06024060240602c060200600006000060000600006000060000200'},
 sofa_sloth:{path:'assets/r523/sloth-sofa.webp',h:84,face:'n',ang:'iso',flat:true,ft:[-0.985,0.971,0.571],r:[-1.075,1.075,0,1.747],m:'0f0001f8001fc001fe001ff003ffc07fff0ffff8ffffeffffeffffeffffe7ffff7ffff7ffff7ffff7ffff7fffe7fffe1fffe03ffe01ffe00ffe003fe001f8000780001000010'},
 bed_sloth:{path:'assets/r523/sloth-bed.webp',h:89,face:'w',ang:'iso',flat:true,ft:[-1.042,1.042,0.368],r:[-1.049,1.049,0,1.851],m:'0100001000070001f0003f0003f000ff800ffc00fffc0fffe0fffe0ffff0ffff9ffffffffffffffffffffbffff1ffff0ffff03fff01fff00ffc00ff8001f0000e00004000040'},
 fridge_sloth:{path:'assets/r523/sloth-fridge.webp',h:97,face:'n',ang:'iso',flat:true,ft:[-0.579,0.579,-0.024],r:[-0.579,0.579,0,2.017],m:'01e0007fe03fff8ffffcffffcffffcffffcffffcffffcffffcffffcffffcffffcffffcffffcffffcffffcffffcffffcffffcffffcffffcffffcffffcffffe7ffff0fffe01e18'},
 tv_sloth:{path:'assets/r523/sloth-tv.webp',h:69,face:'n',ang:'iso',flat:true,ft:[-0.706,0.712,0.362],r:[-0.729,0.729,0,1.435],m:'038000fe001ff801ffc01ffe01ffe01fff01fff03fff03fff07ffe0fffe0ffffcffffefffffffffffffffffffffffff7ffff5ffff07fff01ffe007fe001f8000700003000010'},
 wardrobe_n:{path:'assets/r523/wardrobe-n.webp',h:104,face:'n',ang:'iso',flat:true,ft:[-0.473,0.49,0.182],pair:'wardrobe_w',r:[-0.49,0.49,0,2.163],m:'0f0007fe00fffc0ffff8ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7ffff7fffffffff7ffff0ffff01fff003f800060'},
 wardrobe_w:{path:'assets/r523/wardrobe-w.webp',h:98,face:'w',ang:'iso',flat:true,ft:[-0.474,0.49,-0.231],pair:'wardrobe_n',r:[-0.498,0.498,0,2.038],m:'001f001ffe1fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc01fc000e000'},
 table_n:{path:'assets/r523/table-n.webp',h:60,face:'n',ang:'iso',flat:true,ft:[-0.724,0.724,0.29],pair:'table_w',r:[-0.742,0.742,0,1.248],m:'060000f0001f8003fc007fe00fff00fffc0fffe0ffff0ffff8dfffccffffc7fffc7fffc4fffc07ffc03ffc01fb00073000630006300063000630006200060000600006000060'},
 table_w:{path:'assets/r523/table-w.webp',h:60,face:'w',ang:'iso',flat:true,ft:[-0.785,0.792,-0.421],pair:'table_n',r:[-0.811,0.811,0,1.248],m:'00030000f8001f8007fc00ffe03ffe07fff1ffff3ffffffffffffffffffbffff3ffff3fff33ffe03df803de003cc003cc003cc000cc000cc0000c0000c0000c0000c0000c000'},
 suitcase_w:{path:'assets/r523/suitcase-w.webp',h:32,face:'w',ang:'iso',flat:true,ft:[-0.328,0.328,-0.236],pair:'suitcase_n',r:[-0.328,0.328,0,0.666],m:'0001c0033c00fff01fff03fff03fff0ffff3ffff7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeffff8fffe0fff80ffe00ff8007e00038000'},
 suitcase_n:{path:'assets/r523/suitcase-n.webp',h:32,face:'n',ang:'iso',flat:true,ft:[-0.308,0.308,0.199],pair:'suitcase_w',r:[-0.308,0.308,0,0.666],m:'180003c0007fe00fff00fff80fffc0ffff0ffff8ffffeffffffffffffffffffffffffffffffffffffffffffffffffff7ffff1ffff07fff03fff00fff003ff000fe0003c0001c'},
 trash:{path:'assets/world-r80/r80-025.webp',h:35,face:'s',ang:'pole',up:0.008,d:0.7,r:[-0.502,0.502,0,0.716],m:'00180001800078000f8001fc001fc003fc007ff80fff83fff83fffc3fffc3fffe7fffe7fffffffffffffffffffffffe7fffe7fffe3fffe3ffff3fffc0fffc07ff403fc003600'},
 chair_n:{path:'assets/r523/chair-n.webp',h:45,face:'n',ang:'iso',flat:true,ft:[-0.272,0.26,-0.012],pair:'chair_w',r:[-0.272,0.272,0,0.936],m:'00300003e0003f80033f0030f007c3007fb0061f006070060601f0607fe61fffeffffeffffe7fffc7fffe63fc66ff06fbe06e0e06c07fec06e6c078300602006000060000600'},
 chair_w:{path:'assets/r523/chair-w.webp',h:45,face:'w',ang:'iso',flat:true,ft:[-0.26,0.272,-0.012],pair:'chair_n',r:[-0.272,0.272,0,0.936],m:'00c0007c001fc00fcc00f0c00c3e00dfe00f8600e06006060060f0067fe07fff87ffff7ffff3fffe7fffe63fc660ff6607ff607077fe0367603c1e0340600006000060000600'},
 chairb_n:{path:'assets/r523/chair-back-n.webp',h:38,face:'n',ang:'iso',flat:true,ft:[-0.257,0.272,0.002],pair:'chairb_w',r:[-0.272,0.272,0,0.79],m:'c0000e0000f8000fe000dfc00c7c0060e0078f807ffe06fff87fffefffff7fffe3fffe7fffe63fe663f866f70679f036078f603ffc03e3c03c34030300300003000030000200'},
 chairb_w:{path:'assets/r523/chair-back-w.webp',h:38,face:'w',ang:'iso',flat:true,ft:[-0.272,0.257,-0.022],pair:'chairb_n',r:[-0.272,0.272,0,0.79],m:'00003000070001f0007f003fb003e30070601f1e07ffe1fffe7fffefffff7fffe7fffc7fffe67fc661fc660ef6c0f9ef1e06ffc06c7c03c3c03c0c0200c0000c0000c0000400'},
 sofa_n:{path:'assets/r524/sofa-n.webp',h:69,face:'n',ang:'iso',flat:true,ft:[-1.013,0.999,0.538],pair:'sofa_w',r:[-1.013,1.013,0,1.435],m:'0c0000e0000f8001fc003ff003ff807ffe0ffff0ffffcffffeffffeffffeffffffffffffffffffffffffffffff1ffff0ffff03fff01fff007ff003fc000f8000780001000010'},
 sofa_w:{path:'assets/r524/sofa-w.webp',h:80,face:'w',ang:'iso',flat:true,ft:[-0.984,0.991,-0.565],pair:'sofa_n',r:[-0.998,0.998,0,1.664],m:'0003000070001f0003f0007f801ffc03ffe07fff1ffff3ffff7ffffffffffffffffffffffffffffffffffffff8ffff0fffc0fff80fff00ffc00ff8003f0001c0000800008000'},
 range_n:{path:'assets/r524/range-n.webp',h:62,face:'n',ang:'iso',flat:true,ft:[-0.489,0.484,0.037],pair:'range_w',r:[-0.501,0.501,0,1.289],m:'0070001fc003fe00fff81fffe7ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffa0fff003fe000f800030000300'},
 range_w:{path:'assets/r524/range-w.webp',h:56,face:'w',ang:'iso',flat:true,ft:[-0.471,0.486,-0.172],pair:'range_n',r:[-0.497,0.497,0,1.165],m:'0038001fc00fff07fff8ffffcffffefffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1ffff0ffe007f000380003000'},
 mirror:{path:'assets/world-r80/r80-026.webp',h:77,face:'s',ang:'pole',up:0.006,d:0.45,r:[-0.444,0.441,0,1.583],m:'0060001f8007fc00ffe00ffe00ffe00ffe00fff00fff01fff81fff01fff01fff01fff01fff01fff01fff81fff81fff81fff81fffc1fffe3ff96ff807de000060000300003800'},
 machine:{path:'assets/world-r80/r80-001.webp',h:88,face:'n',ang:'iso',flat:true,up:0.01,ft:[-0.785,0.785,0.104],r:[-0.785,0.785,0,1.794],m:'01c0003e000ff801ffe01fff81fff81fff80fff80fffe0fffe1fffe1fffe3fffe3fffe7fffe3fffe3fffe3fffe3fffc7fffcffffcffffe7ffff1ffff03ffe01ff0007c000380'},
 vent:{path:'assets/world-r80/r80-058.webp',h:82,face:'w',ang:'iso',flat:true,up:0.007,ft:[-0.777,0.819,-0.104],r:[-0.959,0.959,0,1.683],m:'0078001fe003ff80fffc1fffe3fffe7fffffffff9fffc1fffc1fffc1fffc1fffc1fffc1fff81fff81fff81fff81fff81fff81fff83fffc1fffc0fff807fe003f8001f0000c00'},
 cooler:{path:'assets/r406/props/server-cooler.webp',h:95,face:'w',ang:'iso',flat:true,ft:[-0.777,0.756,-0.167],r:[-0.782,0.782,0,1.965],m:'00020000f0003f801ffe07fff3ffff7ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0fffc03fe001fc000f800'},
 kiosk:{path:'assets/world-r80/r80-054.webp',h:72,face:'n',ang:'iso',flat:true,up:0.006,ft:[-0.459,0.483,0.11],r:[-0.483,0.483,0,1.48],m:'03c0007f000ffe00fffc0ffff1ffff1ffff1ffff3ffff7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7ffff0fffc03ff800fe0001c0'},
 alarm:{path:'assets/world-r80/r80-056.webp',h:53,face:'n',ang:'iso',flat:true,up:0.006,ft:[-0.243,0.243,0.109],r:[-0.243,0.245,0,1.089],m:'00fc007ff81fff87ffff7ffffffffffffffffffffffff7ffff3ffff1ffff0ffff7ffffffffffffffffffffffffffffffffffffffffffffffffffffff7ffff03fff00ff8001f0'},
 steps:{path:'assets/world-r80/r80-055.webp',h:100,face:'w',ang:'iso',flat:true,up:0.005,ft:[-1.238,1.238,-0.11],clear:1.4,r:[-1.243,1.243,0,2.055],m:'0080000c0000b000098000cc000a6000d7001ed807fcc1ffe43ffd2fffc9fffe5ffffeffffaffff8ffff8fffffffffffffff7ffff3ffff1fffc0fff807fe003f8001f0000c00'},
 shelf_n:{path:'assets/r528/bookshelf-n.webp',h:110,face:'n',ang:'iso',flat:true,ft:[-0.438,0.429,0.21],pair:'shelf_w',r:[-0.438,0.438,0,2.288],m:'3e000ffc00fff80ffff0ffffefffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff5ffff01fff001ff00030'},
 shelf_w:{path:'assets/r528/bookshelf-w.webp',h:110,face:'w',ang:'iso',flat:true,ft:[-0.469,0.46,-0.268],pair:'shelf_n',r:[-0.469,0.469,0,2.288],m:'0007c003ff01fff0ffff7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0fff00ff8001c000'},
 flamp:{path:'assets/r529/floor-lamp.webp',h:88,face:'s',ang:'pole',d:0.5,r:[-0.265,0.265,0,1.83],m:'07fe00fff01fff83fffc7fffeffffffffff00f0000700007000070000700007000070000700007000070000700007000070000700007000070000700007000fff03fffc1fff8'},
 rig:{path:'assets/r527/body-rig.webp',h:74,face:'n',ang:'iso',flat:true,ft:[-0.929,0.929,0.134],r:[-0.929,0.929,0,1.539],m:'040000e0001f0001f0001f8001f8001f0001f0781f0fc1f0fc1f07c1fc7c1fc3c3fc3c3ff7c3fffc7fffcffffcffffc5fffc07ffe01ffe00fff00fff007fe003f0003e0001a0'},
 pod:{path:'assets/r527/pod.webp',h:57,face:'n',ang:'iso',flat:true,ft:[-0.937,0.937,0.34],r:[-0.937,0.937,0,1.185],m:'0300007c0007f0007f8007fc011fe03eff0bfff8ffffcffdfc7fcfeffe3efff9efffce7ffe63fff63fffe1fffe1ffff1ffff0ffff03fff01fff00fff007fe001fe000fc00078'},
 tank:{path:'assets/r527/gothic-tank.webp',h:63,face:'n',ang:'iso',flat:true,ft:[-0.726,0.726,0.332],r:[-0.726,0.726,0,1.31],m:'00000380003c0003e0003e0007f8003fc003ff0e3ffde7fffe3fffe3fffe3fffe3ffff7fffe7ffffffffeffffe7fffe3fffe1fffe03fff01fff00fff007ff003fc001f800030'},
 lanterns:{path:'assets/r527/lantern-steps.webp',h:78,face:'w',ang:'iso',flat:true,ft:[-0.707,0.707,-0.349],r:[-0.707,0.707,0,1.622],m:'000100001c0003c0003c0003c001fc001fc001fc003fe01ffe01ffe01ffe01ffe0bffe1fffe1fffe1ffff3ffff3ffff3fffb3ffe07ff80ffe00ffc00df0000c0000c0000c000'},
 barrier:{path:'assets/r527/stone-barrier.webp',h:79,face:'n',ang:'iso',flat:true,ft:[-0.77,0.751,0.427],r:[-0.77,0.77,0,1.643],m:'700007c0007f0007fc007ff007ffc07fff07fff87fffc7fffe7ffff7ffff7ffff7ffff7ffff7ffffffffffffff7ffff31fff00fff003ff000ff0007e0007f000ff0007e00038'},
 vitals:{path:'assets/world-r80/r80-151.webp',h:63,face:'s',ang:'pole',up:0.006,d:0.55,r:[-0.376,0.379,0,1.295],m:'03e001ffe07fffc7ffffffffffffffffffffffffffffffffffffffefffff7ffff0fffb01ff30ffc33ffe63fffc3fffe03ffe3fff87fffce1ffee070e4070e0070600f0000600'},
 lotus:{path:'assets/world-r80/r80-061.webp',h:59,face:'s',ang:'pole',up:0.006,d:0.9,r:[-0.663,0.666,0,1.211],m:'0200003060078e0078e007df027df03fffc3fffc3fffc1fff81fff83fffc7fffe7fffe7fffe7fffe7fffe7fffefffffffffffffff0fff00fff007fe00fff00f0f00e07004020'},
 reliq:{path:'assets/world-r80/r80-065.webp',h:71,face:'s',ang:'pole',up:0.006,d:0.8,r:[-0.622,0.622,0,1.459],m:'00100003000078001f8003bc003fc003fe007ff007ff00fff00fff80fffc1fffc1fffc1fffc3fffc3fffe3fffe7fffffffffffff25ffc00ff8007f0003c0003c0003c0001800'}
}/*ART*/);
const sampMemo=new Map();
// 불투명 칸 → 발 기준 3D 점 [dx,dy,z] — 조형물 그림은 발을 지나 카메라를 향해 서고 위로 갈수록 뒤(-x·-y)로 30° 눕는 판(R412·R521 과 같은 식)
function samplesOf(key,flip){const k=key+(flip?'|f':'');let S=sampMemo.get(k);if(S)return S;S=[];const cols=new Map();const s=ART[key];if(s&&s.m){const[x0,x1,y0,y1]=s.r;
 for(let j=0;j<MH;j++)for(let i=0;i<MW;i++){const u=flip?MW-1-i:i,n=j*MW+u;if(!((parseInt(s.m[n>>2],16)>>(3-(n&3)))&1))continue;const sx=x0+(i+.5)/MW*(x1-x0),h=y1-(j+.5)/MH*(y1-y0);if(h<0)continue;S.push([sx*SQ-BACK*h,-sx*SQ-BACK*h,RISE*h]);
  let c=cols.get(i);if(!c){c={ax:sx*SQ,ay:-sx*SQ,pts:[],bmax:0};cols.set(i,c);}c.pts.push([BACK*h,RISE*h]);if(BACK*h>c.bmax)c.bmax=BACK*h;}}
 S.cols=[...cols.values()];/* 세로줄 묶음: 같은 줄의 점은 바닥에서 한 대각선 위에 있다(앞벽 가림 계산용) */sampMemo.set(k,S);return S;}
function embedOf(S,x,y,hit,stop){if(!S.length)return 0;const lim=stop>=0?stop*S.length:Infinity;let n=0;for(let i=0;i<S.length;i++){if(hit(x+S[i][0],y+S[i][1])&&++n>lim)return 1;/* 한도를 넘으면 더 세지 않는다 */}return n/S.length;}
// 앞벽(카메라 쪽 +x·+y)에 가린 비율 — R521 과 같은 값(벽 2.85칸 + 윗면 덮개까지 3.5칸, 4.5칸 앞까지)
const WALL_LOW=3.5,VIEW_RISE=.816,VIEW_FAR=4.5;
//  그림 점 (높이 z, 뒤로 누운 만큼 b)에서 카메라 쪽으로 t(.25~4.5칸) 나아간 바닥에 벽이 있고 그 벽이 점보다 높으면(z+.816t<3.5) 가린 것.
//  같은 세로줄의 점은 한 대각선을 같이 쓰므로 그 선을 .125칸 간격으로 한 번만 짚는다(점마다 따로 짚던 것의 1/7 질의).
const DU=.125,hitBuf=new Uint8Array(64),nextBuf=new Int16Array(65);
function hiddenOf(S,x,y,hit){if(!S.length)return 0;const C=S.cols;if(!C)return 0;let n=0;
 for(let ci=0;ci<C.length;ci++){const c=C[ci],u0=.25-c.bmax,K=Math.min(64,Math.floor((VIEW_FAR-u0)/DU)+1);let kmax=-1;
  for(let i=0;i<c.pts.length;i++){const b=c.pts[i][0],z=c.pts[i][1],k1=Math.min(K-1,Math.ceil((Math.min(VIEW_FAR,(WALL_LOW-z)/VIEW_RISE)-b-u0)/DU)-1);if(k1>kmax)kmax=k1;}
  if(kmax<0)continue;for(let k=0;k<=kmax;k++){const u=u0+k*DU;hitBuf[k]=hit(x+c.ax+u,y+c.ay+u)?1:0;}
  nextBuf[kmax+1]=32767;for(let k=kmax;k>=0;k--)nextBuf[k]=hitBuf[k]?k:nextBuf[k+1];
  for(let i=0;i<c.pts.length;i++){const b=c.pts[i][0],z=c.pts[i][1],k0=Math.max(0,Math.ceil((.25-b-u0)/DU-1e-9)),k1=Math.min(kmax,Math.ceil((Math.min(VIEW_FAR,(WALL_LOW-z)/VIEW_RISE)-b-u0)/DU)-1);if(k0<=k1&&nextBuf[k0]<=k1)n++;}}
 return n/S.length;}
const WALL_GAP=.06,EMBED_MAX=.01,HIDDEN_MAX=.2,PUSH_STEP=.1,PUSH_MAX=1.2;

// ---- 가구 묶음 --------------------------------------------------------------------------------------
//  묶음 = 벽을 따라 w 칸을 차지하는 한 자리. it = [그림, 묶음 시작에서 가운데까지, 벽에서 띄움(가구: 등과 벽 사이, 기본 0 = 붙임 / 기둥류: 발까지), 'p' = 벽과 직각으로 돌려 세움]
//  첫 줄이 그 묶음의 주인 — 주인이 못 놓이면(벽에 묻힘·가림·비울 자리) 딸린 것도 놓지 않는다(침대 없는 수액대가 남지 않게).
//  크기 기준 1칸 ≈ 1m: 침대 1.1×1.9, 들것 1.7×1.0, 약장 1.0×.4, 수레 .9×.45, 소파 2.2, 옷장 .95, 냉장고 .8.
const SCREEN_D=3.4;
const G=Object.freeze({
 // 의원
 bedMon:{w:2.25,it:[['bed',.62],['monitor',1.75]]},
 bedIv:{w:2.25,it:[['bed',.62],['iv',1.75]]},
 bedTray:{w:2.45,it:[['bed',.62],['overbed',1.75]]},
 bedScreen:{w:3.0,it:[['bed',.62],['monitor',1.75],['curtain',2.45],['curtain',.62,SCREEN_D,'p']]},
 treat:{w:3.0,it:[['stretcher',.95],['iv',2.15],['stool',2.3,1.45]]},
 treatLamp:{w:3.1,it:[['stretcher',.95],['lamp',2.2],['stool',1.2,1.75]]},
 cart:{w:1.1,it:[['trolley',.5]]},
 cab:{w:1.15,it:[['medcab',.55]]},
 cab2:{w:2.3,it:[['medcab',.55],['medcab',1.67]]},
 cabCart:{w:2.35,it:[['medcab',.55],['trolley',1.72]]},
 seats:{w:2.4,it:[['chair145',.4],['chair145',1.17],['chair145',1.94]]},
 seatsTable:{w:3.3,it:[['chair145',.4],['chair145',1.17],['table146',2.4,.15]]},
 wheel:{w:1.2,it:[['wheelchair',.55,1.0]]},
 crutch:{w:.7,it:[['crutches',.3]]},
 ivs:{w:1.4,it:[['iv',.35],['iv',.95,.62]]},
 parked:{w:2.1,it:[['stretcher',.95]]},
 // 집(나태): 낡은 소파·깨진 TV·때 묻은 침대·녹슨 냉장고(칠죄 방 그림 시트의 칸), 옷장·식탁(Dots 두 방향), 여행가방(Dots 두 방향), 나무 의자(드라이브 3D 모델을 등각으로 렌더)
 sofa:{w:2.5,lim:{sofa:1},it:[['sofa_sloth',1.15]]},
 sofaTrash:{w:3.4,lim:{sofa:1,trash:1},it:[['sofa_sloth',1.15],['trash',2.85,.75]]},
 dine:{w:2.1,lim:{table:1},it:[['table_n',.95],['chairb_n',.55,.78],['chairb_n',1.35,.78]]},
 tv:{w:1.8,lim:{tv:1},it:[['tv_sloth',.85]]},
 bedHome:{w:1.5,lim:{bed:1},it:[['bed_sloth',.6]]},
 bedCase:{w:2.4,lim:{bed:1,case:1},it:[['bed_sloth',.6],['suitcase_n',1.75]]},
 bedChair:{w:2.2,lim:{bed:1,chair:1},it:[['bed_sloth',.6],['chair_n',1.65]]},
 wardrobe:{w:1.15,lim:{wardrobe:1},it:[['wardrobe_n',.55]]},
 wardrobe2:{w:2.2,lim:{wardrobe:2},it:[['wardrobe_n',.55],['wardrobe_n',1.6]]},
 // R528: 서재 책장(Dots CX-0066RM r1, 바닥 각도를 2:1 로 바로잡음) — 하나 또는 둘 나란히
 shelf1:{w:1.05,lim:{shelf:1},it:[['shelf_n',.5]]},
 shelf2:{w:2.05,lim:{shelf:2},it:[['shelf_n',.5],['shelf_n',1.52]]},
 fridge:{w:1.05,lim:{fridge:1},it:[['fridge_sloth',.5]]},
 fridgeTrash:{w:2.3,lim:{fridge:1,trash:1},it:[['fridge_sloth',.5],['trash',1.6,.7]]},
 cases:{w:1.9,lim:{case:2},it:[['suitcase_n',.45],['suitcase_n',1.3,.25]]},
 case1:{w:1.0,lim:{case:1},it:[['suitcase_n',.45]]},
 chairs2:{w:1.5,lim:{chair:2},it:[['chair_n',.35],['chair_n',1.05]]},
 trash:{w:1.3,lim:{trash:1},it:[['trash',.6,.7]]},
 // 질투의 집(R524): 가죽 소파(두 방향)·세워 둔 거울·벽에 붙인 책상(탁자 + 당겨 앉은 의자) / 폭식의 주방: 화구(Dots 두 방향)·준비 탁자·식재료 냉장고 둘
 sofaL:{w:2.5,lim:{sofa:1},it:[['sofa_n',1.15]]},
 // R529: 소파 곁에 서 있는 전등 하나(Dots CX-0066RM r1) — 응접실·읽는 서재
 sofaLamp:{w:2.9,lim:{sofa:1,flamp:1},it:[['sofa_n',1.15],['flamp',2.6]]},
 mirror1:{w:1.1,lim:{mirror:1},it:[['mirror',.5]]},
 mirror2:{w:2.5,lim:{mirror:2},it:[['mirror',.55],['mirror',1.85]]},
 desk:{w:1.9,lim:{table:1},it:[['table_n',.95],['chairb_n',.95,.78]]},
 prepT:{w:1.9,lim:{table:1},it:[['table_n',.95]]},
 range1:{w:1.05,lim:{range:1},it:[['range_n',.5]]},
 range2:{w:2.1,lim:{range:2},it:[['range_n',.5],['range_n',1.56]]},
 fridge2:{w:2.1,lim:{fridge:2},it:[['fridge_sloth',.5],['fridge_sloth',1.55]]},
 // 건물 안(R525 — 불난 층·7층·공동 주택): 계단·경보함·배관 기계·환기구·냉각기·단말기. 기존 게임 그림을 한 방향 그림으로 쓴다(반대쪽 벽에서는 거울)
 steps1:{w:2.2,lim:{steps:1},it:[['steps',1.1]]},
 alarm1:{w:.8,lim:{alarm:1},it:[['alarm',.4]]},
 machine1:{w:1.5,lim:{machine:1},it:[['machine',.75]]},
 cooler1:{w:1.55,lim:{cooler:1},it:[['cooler',.78]]},
 vent1:{w:1.55,lim:{vent:1},it:[['vent',.78]]},
 kiosk1:{w:1.0,lim:{kiosk:1},it:[['kiosk',.5]]},
 kioskDesk:{w:3.0,lim:{kiosk:1,table:1},it:[['kiosk',.5],['table_n',2.0],['chairb_n',2.0,.78]]},
 // 넷째 묶음(R527 — 관리자 권한·중앙 코어 이주실·사몽의 문턱): 캡슐 + 심박 모니터, 기계 육체 거치대, 고딕 수조, 연꽃 코어 받침, 돌 방벽, 등불 계단, 성물함
 //  거치대·캡슐·수조·방벽·등불은 기존 게임 그림의 바닥 모서리를 2:1 로 바로잡은 한 방향 그림(반대쪽 벽에서는 거울). 모니터·연꽃 받침·성물함은 방향 없는 그림
 podMon:{w:2.9,lim:{pod:1,vitals:1},it:[['pod',1.0],['vitals',2.45]]},
 mon1:{w:.9,lim:{vitals:1},it:[['vitals',.45]]},
 tank1:{w:1.6,lim:{tank:1},it:[['tank',.8]]},
 rig1:{w:2.0,lim:{rig:1},it:[['rig',1.0]]},
 rig2:{w:4.1,lim:{rig:2},it:[['rig',1.0],['rig',3.05]]},
 rigMon:{w:2.9,lim:{rig:1,vitals:1},it:[['rig',1.0],['vitals',2.45]]},
 lotus1:{w:1.5,lim:{lotus:1},it:[['lotus',.75]]},
 lotusTank:{w:3.2,lim:{lotus:1,tank:1},it:[['lotus',.75],['tank',2.35]]},
 barrier1:{w:1.7,lim:{barrier:1},it:[['barrier',.85]]},
 barrier2:{w:3.5,lim:{barrier:2},it:[['barrier',.85],['barrier',2.6]]},
 lantern1:{w:1.6,lim:{lanterns:1},it:[['lanterns',.8]]},
 reliq1:{w:1.4,lim:{reliq:1},it:[['reliq',.7]]}
});
// 한 방에 같은 물건이 되풀이되지 않게(사용자 2026-11-09 "같은 물건이 같은 간격으로 반복되는 현상은 줄이고"): 묶음의 lim 이 방마다 이 수를 넘으면 그 묶음은 건너뛴다
//  쓰임새가 lim 을 따로 가지면 그 방에서는 그 수를 쓴다(거울 회랑의 거울, 화구 구획의 화구처럼 되풀이가 그 방의 뜻인 곳)
const LIMIT=Object.freeze({tv:1,sofa:2,table:1,trash:1,wardrobe:3,fridge:2,bed:3,case:3,chair:3,mirror:1,range:2,shelf:3,flamp:1,steps:1,alarm:1,machine:2,cooler:2,vent:1,kiosk:2,pod:3,vitals:3,tank:1,rig:2,lotus:1,barrier:2,lanterns:1,reliq:1});
const fits=(g,cnt,U)=>!g.lim||Object.keys(g.lim).every(k=>(cnt[k]||0)+g.lim[k]<=((U&&U.lim&&U.lim[k])||LIMIT[k]));
const take=(g,cnt,s)=>{if(g.lim)for(const k in g.lim)cnt[k]=(cnt[k]||0)+s*g.lim[k];};
// 쓰임새 = [큰 벽 줄(차례로 돌려 가며 채움), 옆 벽 줄, 안쪽 구석 가구, 큰 벽·옆 벽에 놓을 묶음 상한]
const USE=Object.freeze({
 inject:{main:['treat','cart','treatLamp','ivs','treat','cabCart'],side:['cab2','wheel','cart'],corner:'medcab',cap:[6,3]},
 wait:{main:['seats','seatsTable','seats','wheel'],side:['seats','crutch','wheel'],corner:null,cap:[6,4]},
 observe:{main:['bedScreen','bedIv','bedMon','bedTray'],side:['cabCart','wheel','parked'],corner:'medcab',cap:[6,3]},
 drug:{main:['cab2','cart','cab2','ivs','cab2','cart'],side:['cab2','parked','cab'],corner:'medcab',cap:[6,3]},
 ante:{main:['parked','wheel','crutch'],side:['wheel'],corner:null,cap:[3,1]},
 lobby:{main:['seats','seatsTable','wheel'],side:['seats','crutch'],corner:null,cap:[3,2]},/* 의원 입구 = 접수 앞 대기 자리 */
 living:{main:['sofaTrash','dine','sofa','chairs2'],side:['tv','wardrobe','case1'],corner:null,cap:[6,4]},
 bedroom:{main:['bedCase','wardrobe','bedChair','trash'],side:['wardrobe2','case1','chairs2'],corner:'wardrobe_n',cap:[5,3]},
 store:{main:['fridgeTrash','wardrobe2','cases','fridge','trash'],side:['wardrobe','cases','trash'],corner:'wardrobe_n',cap:[6,4]},
 foyer:{main:['case1','wardrobe','chairs2'],side:['trash','case1'],corner:null,cap:[3,2]},
 // 이름이 같은 '앞방' 아홉 곳은 세 가지로 돌려 쓴다: 앉는 방(소파·식탁·TV 한 대) / 짐 방(옷장·여행가방) / 남는 침실(침대·의자)
 den:{main:['sofa','dine','sofaTrash','wardrobe','chairs2'],side:['tv','case1','chairs2'],corner:null,cap:[6,4]},
 den2:{main:['wardrobe2','cases','chairs2','trash','case1'],side:['case1','wardrobe','chairs2'],corner:'wardrobe_n',cap:[6,4]},
 den3:{main:['bedChair','wardrobe','case1','bedCase','trash'],side:['chairs2','case1','wardrobe'],corner:null,cap:[5,3]},
 // 질투의 집 ep1b03: 정돈된 집 — 쓰레기·침대·TV 없음. 서재 여덟 곳은 책상 방 / 읽는 방 두 가지로 돌려 쓴다. 거울 회랑만 거울을 줄지어 세운다
 parlor:{main:['sofaLamp','dine','wardrobe','sofaL'],side:['mirror1','chairs2','wardrobe'],corner:null,cap:[4,3]},
 study:{main:['desk','shelf2','chairs2','shelf1'],side:['shelf1','mirror1','chairs2'],corner:'wardrobe_n',cap:[5,3]},
 study2:{main:['shelf2','sofaLamp','desk'],side:['chairs2','shelf1','mirror1'],corner:null,cap:[5,3]},
 mirrors:{main:['mirror2','sofaL','mirror2','mirror1'],side:['mirror2','chairs2','mirror1'],corner:null,cap:[6,4],lim:{mirror:8}},
 vestibule:{main:['wardrobe','chairs2','mirror1'],side:['chairs2','wardrobe'],corner:null,cap:[3,2]},
 // 폭식의 주방 ep1b04: 화구 구획엔 화구 줄, 준비대엔 작업 탁자, 식재료 보관실 여덟 곳은 냉장고 방 / 찬장 방으로 돌려 쓴다, 앞방·입구는 일꾼 식탁
 prep:{main:['prepT','range1','prepT','wardrobe'],side:['fridge','prepT','wardrobe'],corner:null,cap:[4,3],lim:{table:3}},
 pantry:{main:['fridge2','wardrobe2','fridgeTrash','wardrobe'],side:['wardrobe','fridge','trash'],corner:'wardrobe_n',cap:[5,3],lim:{fridge:4}},
 pantry2:{main:['wardrobe2','prepT','wardrobe','fridge'],side:['trash','wardrobe','prepT'],corner:null,cap:[5,3]},
 ranges:{main:['range2','prepT','range2','range1'],side:['range2','fridge','range1'],corner:null,cap:[6,4],lim:{range:8,table:2}},
 mess:{main:['dine','chairs2','wardrobe'],side:['chairs2','wardrobe'],corner:null,cap:[3,2]},
 // 길목(방과 방 사이): 긴 벽 한 줄에 한 묶음만 — 지나는 길은 비운다
 // 건물 안(R525): 계단실 = 계단 한 줄 + 경보함, 방화 전실 = 경보함·장비 장·버리고 간 짐, 그을린 복도·입구 = 흩어진 짐, 설비실 = 기계 줄, 보안실 = 단말기 + 책상, 빈 방 = 남은 짐 한두 점
 stairs:{main:['steps1','alarm1'],side:['alarm1'],corner:null,cap:[2,1],more:false},
 landing:{main:['alarm1','trash'],side:['trash'],corner:null,cap:[1,1],more:false},
 firelobby:{main:['alarm1','wardrobe','chairs2','case1'],side:['case1','trash','chairs2'],corner:null,cap:[3,2]},
 evac:{main:['case1','trash','cases'],side:['case1','chairs2'],corner:null,cap:[2,1],more:false},
 plant:{main:['machine1','cooler1','machine1','vent1'],side:['cooler1','wardrobe','vent1'],corner:'wardrobe_n',cap:[4,3]},
 security:{main:['kioskDesk','wardrobe2','kiosk1','chairs2'],side:['wardrobe','kiosk1','chairs2'],corner:'wardrobe_n',cap:[4,3]},
 lobby7:{main:['chairs2','case1','wardrobe','alarm1','cases'],side:['chairs2','case1','trash'],corner:null,cap:[3,2]}/* 호텔 층 전실: 의자와 투숙객 짐 */,
 vacant:{main:['case1','trash'],side:['case1'],corner:null,cap:[2,1],more:false},
 // 넷째 묶음(R527): 기억의 방·중앙 이주실 = 캡슐 + 모니터 짝과 수조, 보호 구획 = 캡슐 + 냉각기, 기계 육체실 = 거치대 줄, 닫힌 구획·연결실 = 기계·냉각기, 기억 전실 = 단말기
 //  사몽의 문턱: 수확실 = 연꽃 코어 받침 + 수조, 방벽 구획 = 돌 방벽 줄, 코어 전실 = 받침 + 성물함 + 등불. 빈 복도·연결 회랑·길목은 손대지 않는다
 memory:{main:['podMon','tank1','podMon','kiosk1'],side:['kiosk1','mon1','cooler1'],corner:null,cap:[4,2]},
 memhall:{main:['kiosk1','cooler1','kiosk1'],side:['kiosk1','cooler1'],corner:null,cap:[2,1]},
 sealed:{main:['machine1','rig1','cooler1','machine1'],side:['cooler1','vent1'],corner:null,cap:[4,2]},
 gate:{main:['kiosk1','cooler1'],side:['cooler1','kiosk1'],corner:null,cap:[2,2]},/* 입구: 단말기와 냉각기 두세 점 */
 annex:{main:['kiosk1','cooler1','machine1'],side:['kiosk1','cooler1'],corner:null,cap:[2,1],more:false},
 link:{main:['machine1','cooler1','vent1'],side:['cooler1','machine1'],corner:null,cap:[3,2]},
 ward:{main:['podMon','cooler1','podMon'],side:['mon1','kiosk1'],corner:null,cap:[3,2]},
 bodies:{main:['rig2','mon1','rig2','rig1'],side:['rig1','mon1'],corner:null,cap:[4,2],lim:{rig:4}},
 transfer:{main:['podMon','tank1','podMon','kiosk1'],side:['podMon','mon1'],corner:null,cap:[4,2]},
 harvest:{main:['lotusTank','lantern1','tank1'],side:['lantern1','lotus1'],corner:null,cap:[3,2]},
 bulwark:{main:['barrier2','lantern1','barrier1'],side:['barrier1','lantern1'],corner:null,cap:[3,2],lim:{barrier:4}},
 corehall:{main:['lotus1','reliq1','lantern1'],side:['reliq1','lantern1'],corner:null,cap:[3,2]},
 narthex:{main:['lantern1','reliq1'],side:['lantern1','reliq1'],corner:null,cap:[2,1],more:false},
 hall:{main:['parked','wheel','crutch'],side:[],corner:null,cap:[1,0],min:5,more:false},
 passage:{main:['trash','case1'],side:[],corner:null,cap:[1,0],min:5,more:false}
});
// 지역 → [방 이름, 쓰임새]. 여기에 없는 방(길목·갈림길·마당·보스 전투실·중앙 전투실·입구·다음 구역 문)은 손대지 않는다.
const REGION=Object.freeze({
 ep1a09:[[/주사실/,'inject'],[/처치 대기실/,'wait'],[/관찰실/,'observe'],[/약품 보관실/,'drug'],[/^앞방$/,'ante'],[/^입구$/,'lobby'],[/^길목$/,'hall']],
 ep1b02:[[/거실/,'living'],[/작은 방/,'bedroom'],[/물품 보관실/,'store'],[/현관/,'foyer'],[/^앞방$/,['den','den2','den3']],[/^입구$/,'foyer'],[/^길목$/,'passage']],
 ep1b03:[[/정돈된 거실/,'parlor'],[/서재/,['study','study2']],[/거울 회랑/,'mirrors'],[/^앞방$/,'parlor'],[/^입구$/,'vestibule']],/* 복도 42곳은 손대지 않는다 */
 ep1b04:[[/준비대/,'prep'],[/식재료 보관실/,['pantry','pantry2']],[/화구 구획/,'ranges'],[/^앞방$/,'mess'],[/^입구$/,'mess']],
 ep1b07:[[/피난 계단/,'stairs'],[/방화 전실/,'firelobby'],[/설비실/,'plant'],[/그을린 복도/,'evac'],[/^앞방$/,'firelobby'],[/^입구$/,'evac']],/* 길목 26곳은 손대지 않는다 */
 murder02:[[/계단참/,'stairs'],[/보안실/,'security'],[/설비실/,'plant'],[/7층 전실/,'lobby7'],[/^앞방$/,'lobby7'],[/^입구$/,'lobby7']],
 murder04:[[/공동 계단/,'stairs'],[/계단참/,'landing'],[/빈 방/,'vacant'],[/^앞방$/,['den','den2','den3']],[/^입구$/,'foyer']],/* 공동 복도·길목은 손대지 않는다 */
 u205:[[/기억의 방/,'memory'],[/기억 전실/,'memhall'],[/닫힌 구획/,'sealed'],[/^앞방$/,'annex'],[/^입구$/,'gate']],/* 빈 복도·길목은 손대지 않는다 */
 u206:[[/연결실/,'link'],[/보호 구획/,'ward'],[/기계 육체실/,'bodies'],[/중앙 이주실/,'transfer'],[/^앞방$/,'annex'],[/^입구$/,'gate']],
 cult03:[[/수확실/,'harvest'],[/방벽 구획/,'bulwark'],[/코어 전실/,'corehall'],[/^앞방$/,'narthex'],[/^입구$/,'narthex']]/* 연결 회랑·길목은 손대지 않는다 */
});
const SKIP=/보스|전투실|다음 구역|갈림길|순환로|마당|쉼길/;
const enabled=r=>!!(prefs.on&&r&&REGION[r.id]&&(!r.layer||r.layer==='STORY')&&r.exploration&&Array.isArray(r.exploration.r224Rooms)&&Array.isArray(r.props)&&!r.exploration.samongR103&&!r.exploration.samongR115);
const useOf=(id,name,k=1)=>{name=String(name||'');if(!name||SKIP.test(name))return null;for(const[re,u]of REGION[id]||[])if(re.test(name))return Array.isArray(u)?u[(Math.max(1,k|0)-1)%u.length]:u;return null;};

// ---- 벽 줄 찾기 -------------------------------------------------------------------------------------
//  방 사각형 안 바닥 칸마다 북쪽(-y)·서쪽(-x)으로 반 칸 안에 벽(바닥 밖·벽 상자)이 있는지 본다. 벽 면 좌표가 같은 칸이 이어진 것이 한 줄.
//  끝이 안쪽 구석(옆 칸이 벽)이면 corner, 문 틈·바깥 모서리면 open(그쪽은 OPEN_KEEP 만큼 비운다).
const OPEN_KEEP=1.1,OPEN_SHORT=.6,RUN_MIN=2.4,DEPTH_NEED=3,GAP=.35,HIT_R=.02;/* HIT_R: 엔진 벽 판정은 반지름 0 이면 얇은 벽(두께 .24)을 못 본다 → 아주 작은 반지름으로 묻는다 */
function faceOf(hit,x,y,dx,dy){/* (x,y) 는 칸 가운데. (dx,dy) 쪽으로 .62칸 안의 첫 벽 면 */for(let t=.1;t<=.62;t+=.1)if(hit(x+dx*t,y+dy*t)){let u=t;while(u>t-.1&&hit(x+dx*(u-.02),y+dy*(u-.02)))u-=.02;return dx?x+dx*u:y+dy*u;}return null;}
function runsOf(q,hit){const out=[];
 for(const wall of['n','w']){const A0=wall==='n'?q.x0:q.y0,A1=wall==='n'?q.x1:q.y1,B0=wall==='n'?q.y0:q.x0,B1=wall==='n'?q.y1:q.x1;
  const P=(a,b)=>wall==='n'?[a,b]:[b,a];/* (줄 방향, 깊이 방향) → (x,y) */
  for(let b=B0;b<B1;b++){let cur=null;const close=()=>{if(cur){out.push(cur);cur=null;}};
   for(let a=A0;a<A1;a++){const[cx,cy]=P(a+.5,b+.5);let f=null,deep=0;
    if(!hit(cx,cy)){f=wall==='n'?faceOf(hit,cx,cy,0,-1):faceOf(hit,cx,cy,-1,0);
     if(f!=null)for(deep=1;deep<4;deep++){const[px,py]=P(a+.5,b+.5+deep);if(hit(px,py)||(wall==='n'?faceOf(hit,px,py,0,-1):faceOf(hit,px,py,-1,0))!=null)break;}}
    if(f==null||deep<DEPTH_NEED){close();continue;}
    if(cur&&[.3,.9,1.5,2.1].some(t=>{const[px,py]=P(a,f+t);return hit(px,py);}))close();/* 칸 사이에 가로지르는 얇은 벽: 줄을 끊는다 */
    if(cur&&Math.abs(cur.at-f)<.03)cur.a1=a+1;else{close();cur={wall,at:f,a0:a,a1:a+1,row:b,c0:null,c1:null};}}
   close();}}
 for(const r of out){const P=(a,b)=>r.wall==='n'?[a,b]:[b,a],[sx,sy]=P(r.a0+.5,r.row+.5),[ex,ey]=P(r.a1-.5,r.row+.5);
  r.c0=r.wall==='n'?faceOf(hit,sx,sy,-1,0):faceOf(hit,sx,sy,0,-1);r.c1=r.wall==='n'?faceOf(hit,ex,ey,1,0):faceOf(hit,ex,ey,0,1);r.len=r.a1-r.a0;}
 return out.filter(r=>r.len>=RUN_MIN).sort((p,q2)=>q2.len-p.len||p.row-q2.row||(p.wall<q2.wall?-1:1));}

// ---- 한 점 놓기 -------------------------------------------------------------------------------------
//  가구(iso): 바닥 자리 네모를 벽에 붙인다 — 벽 'n' 은 네모의 -y 변, 'w' 는 -x 변이 벽 면에서 WALL_GAP+d. 발(그림 아래 가운데)은 네모의 맨 아래 꼭짓점에서 구한다.
//  기둥류(pole): 발이 벽에서 d. 그림 점의 1% 넘게 벽 안이면 .1칸씩 띄우고(낮은 가구 .2칸, 키 큰 가구 .8칸, 기둥류 1.2칸까지), 그래도 묻히거나 앞벽에 20% 넘게 가리면 놓지 않는다.
function seat(key,wall,at,ac,d,perp,hit,cornerAt){let a=ART[key];if(!a)return null;if(a.pair&&a.face!==wall&&!perp&&ART[a.pair]){key=a.pair;a=ART[key];}
 const iso=a.ang==='iso'&&Array.isArray(a.ft),flip=a.face==='n'||a.face==='w'?(a.face!==wall)!==!!perp:false,S=samplesOf(key,flip);
 let sL=0,sR=0,sB=0,lenA=0,lenD=0;if(iso){[sL,sR,sB]=a.ft;if(flip)[sL,sR,sB]=[-sR,-sL,-sB];const lx=(sB-sL)*R2,ly=(sR-sB)*R2;lenA=wall==='n'?lx:ly;lenD=wall==='n'?ly:lx;}
 const d0=iso?WALL_GAP+(fin(+d)?+d:0):(fin(+d)?+d:a.d||.5),lim=iso?(a.h>80?.8:.2):PUSH_MAX,steps=Math.round(lim/PUSH_STEP),corner=fin(cornerAt)&&iso,cs=corner?steps:0;
 const a0=corner?cornerAt+WALL_GAP+lenA/2:ac;let x=0,y=0,dd=d0,ok=false,fr=null;
 search:for(let sum=0;sum<=steps+cs;sum++)for(let j=Math.min(sum,cs);j>=0;j--){const i=sum-j;if(i>steps)continue;dd=d0+i*PUSH_STEP;const al=a0+j*PUSH_STEP;
  if(iso){const bA=al+lenA/2,bD=at+dd+lenD,bx=wall==='n'?bA:bD,by=wall==='n'?bD:bA;x=bx-sB*SQ;y=by+sB*SQ;fr=[bx-(sB-sL)*R2,by-(sR-sB)*R2,bx,by];}
  else{x=wall==='n'?al:at+dd;y=wall==='n'?at+dd:al;}
  if(!fin(x+y))break search;if(embedOf(S,x,y,hit,EMBED_MAX)<=EMBED_MAX){ok=true;break search;}}
 return{key,a,flip,S,x,y,d:dd,pushed:dd>d0+1e-9,ok,fr,lenA,iso};}

// ---- 계획 ------------------------------------------------------------------------------------------
const DOORISH=p=>!!(p&&(p.r74Door||p.r81WardDoor||/portal|door/i.test(String(p.kind||''))));
const KEYISH=p=>!!(p&&(p.interactive||p.interact||p.npc||p.r75NPC||p.r75NarrativeNPC||p.chestR103||p.growthR103||p.r162Frag||p.r169Note||p.r161Sculpture||p.r115Clue||p.r105Record||p.objective||/chest|note|memory|clue|altar|shard/i.test(String(p.kind||'')+' '+String(p.id||''))));
const FURN=p=>!!(p&&(p.r224Furniture||p.r449Furniture));
// 비워 둘 자리(반지름 칸): 문·출입구·시작 자리·목표·제단 + 방에 이미 서 있는 다른 조형물(문 1.6, 상자·단서 1.5, 그 밖 1.1)
function keepClear(r){const L=r.exploration||{},out=[];
 for(const d of L.worldR74?.doors||[])if(fin(d.x+d.y))out.push([d.x,d.y,Math.max(2.6,(+d.width||6)/2+.6)]);
 for(const s of L.starts||[])if(s&&fin(s.x+s.y))out.push([s.x,s.y,3]);
 for(const q of[L.entry,L.entrance,L.gate,r.objective,r.altar])if(q&&fin(q.x+q.y))out.push([q.x,q.y,2.6]);
 const FB=fightOf(L),UB=usedOf(r);for(const p of r.props)if(p&&!rests(p,FB,UB)&&p.visible!==false&&!p.r303Hide&&fin(p.x+p.y))out.push([+p.x,+p.y,DOORISH(p)?1.6:KEYISH(p)?1.5:1.1]);
 return out;}
const sigOf=r=>{let n=0;for(const p of r.props)if(p&&!FURN(p)&&p.visible!==false&&!p.r303Hide)n++;return n;};
function hitOf(r){const L=r.exploration,E=window.StoryPhase1&&typeof window.StoryPhase1.explorationBlocked==='function'?window.StoryPhase1.explorationBlocked:null;
 if(E)return(x,y)=>{try{return !!E(L,x,y,HIT_R);}catch(_){return true;}};
 if(typeof blocked==='function')return(x,y)=>{try{return !!blocked(x,y,HIT_R,r);}catch(_){return true;}};return()=>false;}
const capOf=(run,max)=>Math.min(max,Math.max(1,Math.round(run.len/2.4)));/* 벽 길이 2.4칸에 한 묶음 꼴 */
// 전투 구역: 보스 구역·모이는 방 테두리(±.5)와 이름이 보스/전투실인 방 사각형(±.5). 여기는 손대지 않는다(R438·R449 세트 그대로).
const FIGHT=/보스|전투실/,fightMemo=new WeakMap();
function fightOf(L){let f=fightMemo.get(L);if(f)return f;f=[];const W=L.worldWardR81||{};for(const b of[W.bossBounds,W.gatherBounds])if(Array.isArray(b)&&b.length===4&&fin(b[0]+b[1]+b[2]+b[3]))f.push([b[0]-.5,b[1]-.5,b[2]+.5,b[3]+.5]);
 const names=new Map((L.worldR74?.rooms||[]).map(q=>[q.id,q.name||q.purpose||'']));for(const q of L.r224Rooms||[])if(FIGHT.test(names.get(q.id)||''))f.push([q.x0-.5,q.y0-.5,q.x1+.5,q.y1+.5]);fightMemo.set(L,f);return f;}
// 이 덧씌우기가 꾸미는 방(쓰임새가 정해진 방)의 사각형 — 손대지 않는 방(복도 등)의 각도 맞는 예전 가구는 그대로 둔다
const usedMemo=new WeakMap();
function usedOf(r){const L=r.exploration;let u=usedMemo.get(L);if(u)return u;u=[];const names=new Map((L.worldR74?.rooms||[]).map(q=>[q.id,q.name||q.purpose||'']));const ord={};
 for(const q of L.r224Rooms||[]){const name=names.get(q.id)||'';if(useOf(r.id,name,ord[name]=(ord[name]||0)+1))u.push([q.x0-.5,q.y0-.5,q.x1+.5,q.y1+.5]);}usedMemo.set(L,u);return u;}
const inFight=(F,x,y)=>{for(let i=0;i<F.length;i++){const b=F[i];if(x>b[0]&&x<b[2]&&y>b[1]&&y<b[3])return true;}return false;};
// 바닥 자리 네모의 테두리와 가운데 십자를 .12칸 간격으로 짚어 본다 — 얇은 벽이 가구 밑을 지나가면 놓지 않는다
function footHit(fr,hit){const[x0,y0,x1,y1]=fr,nx=Math.max(2,Math.ceil((x1-x0)/.12)),ny=Math.max(2,Math.ceil((y1-y0)/.12)),mx=(x0+x1)/2,my=(y0+y1)/2;
 for(let i=0;i<=nx;i++){const x=x0+(x1-x0)*i/nx;if(hit(x,y0)||hit(x,y1)||hit(x,my))return true;}for(let j=0;j<=ny;j++){const y=y0+(y1-y0)*j/ny;if(hit(x0,y)||hit(x1,y)||hit(mx,y))return true;}return false;}
function plan(r){const L=r.exploration,hit=hitOf(r),W=L.worldWardR81||{},F=fightOf(L),names=new Map((L.worldR74?.rooms||[]).map(q=>[q.id,q.name||q.purpose||'']));
 let path=null;try{path=window.__STORYWORLD_PLAY_R169__?.pathCells?.(r)||null;}catch(e){fail(e);}
 const onPath=(x,y)=>{if(!path)return false;const cx=Math.floor(x),cy=Math.floor(y);for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)if(path.has((cx+dx)+','+(cy+dy))&&Math.hypot(cx+dx+.5-x,cy+dy+.5-y)<1.3)return true;return false;};
 const cand=[],rooms=[],log=[],nth={},ord={};let dropped=0,pushed=0,n=0;
 for(const q of L.r224Rooms){const name=names.get(q.id)||'',use=useOf(r.id,name,ord[name]=(ord[name]||0)+1);if(!use)continue;
  const b=[q.x0,q.y0,q.x1,q.y1];if([W.bossBounds,W.gatherBounds].some(B=>Array.isArray(B)&&B.length===4&&!(b[2]<=B[0]||b[0]>=B[2]||b[3]<=B[1]||b[1]>=B[3])))continue;
  const U=USE[use],k=nth[use]=(nth[use]||0)+1,runs=U?runsOf(q,hit).filter(x=>x.len>=(U.min||0)):[];if(!U||!runs.length){rooms.push({id:q.id,name,use,rect:b,count:0});continue;}
  const main=runs[0],side=runs.find(x=>x.wall!==main.wall)||null,rest=U.more===false?[]:runs.filter(x=>x!==main&&x!==side&&x.len>=3).slice(0,5),before=cand.length,taken=[],cnt={};
  // 한 점: 지도만 보고 정해지는 탈락(벽에 묻힘·발이 벽·보스 구역·길잡이 길·앞벽에 가림·다른 가구와 겹침)은 여기서, 조형물·문·상자 곁은 resolve 에서 가린다
  const put=(key,wall,at,ac,d,perp,cornerAt,tag,lead)=>{const s=seat(key,wall,at,ac,d,perp,hit,cornerAt);n++;if(!s)return-1;
   const box=s.fr||[s.x-.22,s.y-.22,s.x+.22,s.y+.22];
   const why=!s.ok?'wall':hit(s.x,s.y)||(s.fr&&footHit(s.fr,hit))?'foot':inFight(F,s.x,s.y)?'boss':onPath(s.x,s.y)?'path':hiddenOf(s.S,s.x,s.y,hit)>HIDDEN_MAX?'hidden':taken.some(t=>box[0]<t[2]+.03&&box[2]>t[0]-.03&&box[1]<t[3]+.03&&box[3]>t[1]-.03)?'overlap':'';
   if(why){dropped++;log.push(q.id+':'+tag+' '+key+'/'+wall+' '+why);return-1;}if(s.pushed)pushed++;taken.push(box);
   const a=s.a,p={id:'r523:'+r.id+':'+q.id+':'+n,path:a.path,x:+s.x.toFixed(3),y:+s.y.toFixed(3),height:a.h,solid:false,visible:true,enabled:true,presentationOnly:true,autoTargetEligible6:false,
    r521Ward:true,r521Flat:!!a.flat,r521Foot:a.flat&&s.fr?Object.freeze(s.fr.map(v=>+v.toFixed(3))):null,r521Up:a.up||0,r523Room:true,r523:Object.freeze({room:q.id,use,wall,art:s.key,d:+s.d.toFixed(2),tag,len:+s.lenA.toFixed(2)})};
   if(s.flip)p.r303Flip=true;cand.push({p,lead:fin(lead)?lead:-1});return cand.length-1;};
  const fill=(run,list,cap,withCorner,from,tag,shift=0,alt=null)=>{if(!run||!list.length)return;const keep=run.len<5?OPEN_SHORT:OPEN_KEEP;/* 짧은 벽 토막은 끝을 덜 비운다 */let a=Math.max(run.a0+(run.c0!=null?.15:keep),from||-1e9);const end=run.a1-(run.c1!=null?.15:keep);
   if(withCorner&&U.corner&&run.c0!=null&&!(from>run.a0)){const i=put(U.corner,run.wall,run.at,0,0,false,run.c0,'corner');if(i>=0){a=Math.max(a,run.c0+cand[i].p.r523.len+.5);if(/^wardrobe/.test(U.corner))cnt.wardrobe=(cnt.wardrobe||0)+1;}}
   // 들어갈 묶음을 먼저 세고, 남는 길이는 묶음 사이에 고르게(.35~.95칸) 나눈다 — 한쪽에 몰리지도, 띄엄띄엄 흩어지지도 않게
   const pick=[];let need=0;for(let i=0;pick.length<cap&&i<list.length*3;i++){const g=G[list[(i+k-1+shift)%list.length]];if(!g||need+g.w>end-a||!fits(g,cnt,U))continue;pick.push(g);take(g,cnt,1);need+=g.w+GAP;}
   if(!pick.length&&alt)for(let i=0;pick.length<cap&&i<alt.length;i++){const g=G[alt[i]];if(!g||need+g.w>end-a||!fits(g,cnt,U))continue;pick.push(g);take(g,cnt,1);need+=g.w+GAP;}/* 큰 묶음이 안 들어가는 짧은 벽: 다른 줄의 작은 묶음이라도 */
   if(!pick.length)return;const spare=Math.max(0,end-a-need+GAP),gap=GAP+Math.min(.4,spare/pick.length);let at0=a+Math.min(.5,spare/(pick.length+1));
   for(const g of pick){let lead=-2;for(const it of g.it){if(lead===-1)break;const i=put(it[0],run.wall,run.at,at0+it[1],it[2],it[3]==='p',undefined,tag,lead>=0?lead:undefined);if(lead===-2)lead=i;}if(lead===-1)take(g,cnt,-1);/* 첫 점이 못 놓였으면 그 몫은 다음 벽 줄에 돌려준다 */at0+=g.w+gap;}};
  // 옆 벽 줄이 큰 벽 줄과 같은 구석에서 만나면 큰 벽 가구의 깊이(침대 1.9칸)만큼 물려서 시작한다
  const meet=side&&main.c0!=null&&side.c0!=null&&Math.abs(main.c0-side.at)<.3&&Math.abs(side.c0-main.at)<.3;
  fill(main,U.main,capOf(main,U.cap[0]),true,0,'main',0,U.side);fill(side,U.side,side?capOf(side,U.cap[1]):0,!(main.c0!=null),meet?side.c0+2.6:0,'side',0,U.main);
  rest.forEach((run,i)=>fill(run,i%2?U.side:U.main,capOf(run,3),false,0,'more',i+1));/* 튀어나온 벽 덩어리 때문에 끊긴 나머지 벽 줄(3칸 이상, 다섯까지)에도 길이에 맞춰 세 묶음까지 */
  rooms.push({id:q.id,name,use,rect:b,count:cand.length-before,main:main.wall+'@'+main.at.toFixed(2)+':'+main.a0+'-'+main.a1,side:side?side.wall+'@'+side.at.toFixed(2)+':'+side.a0+'-'+side.a1:null});}
 stats.builds++;stats.rooms=rooms.length;stats.dropped=dropped;stats.pushed=pushed;dropLog=log;lastPlan={region:r.id,rooms};return{cand,rooms};}
// 조형물·문·상자가 바뀌면(개수) 이 가림만 다시 한다 — 벽 줄 찾기·묻힘 계산은 지역에 들어올 때 한 번
function resolve(r,cand){const clear=keepClear(r),keep=[],rows=[];for(let i=0;i<cand.length;i++){const{p,lead}=cand[i],big=(ART[p.r523.art]||{}).clear||0/* 큰 그림(계단)은 둘레를 더 비운다 */,ok=(lead<0||keep[lead])&&!clear.some(([cx,cy,cr])=>Math.hypot(cx-p.x,cy-p.y)<cr+big);keep.push(ok);if(ok)rows.push(p);}
 stats.placed=rows.length;return rows;}
const memo=new WeakMap();
function state(r){if(!enabled(r))return null;const L=r.exploration;let m=memo.get(r);
 if(!m||m.L!==L){m={L,sig:-1,cand:[],rows:[],diag:null};try{const res=plan(r);m.cand=res.cand;m.diag={plan:lastPlan,rooms:stats.rooms,dropped:stats.dropped,pushed:stats.pushed,log:dropLog};}catch(e){fail(e);}memo.set(r,m);}
 const sig=sigOf(r);if(m.sig!==sig){m.sig=sig;try{m.rows=resolve(r,m.cand);}catch(e){fail(e);m.rows=[];}}
 /* 진단 값은 지금 지역 것으로 맞춘다(계획은 캐시에서 나오므로 다른 지역을 다녀오면 마지막으로 짠 지역 값이 남았다) */
 const d=m.diag;if(d&&lastPlan!==d.plan){lastPlan=d.plan;stats.rooms=d.rooms;stats.dropped=d.dropped;stats.pushed=d.pushed;dropLog=d.log;}stats.placed=m.rows.length;return m;}
const list=r=>state(r)?.rows||[];

// ---- 그림 읽기 --------------------------------------------------------------------------------------
let asked=0;
function prime(r,rows){try{const paths=[...new Set(rows.map(p=>p.path))],reg=typeof regionById!=='undefined'?regionById?.[r.id]:null;if(reg?.paths)for(const p of paths)if(!reg.paths.includes(p))reg.paths.push(p);
 if(typeof readyImage!=='function')return;const want=paths.filter(p=>!readyImage(p));if(!want.length)return;const t=Date.now();if(t-asked<1500)return;asked=t;stats.reloads+=want.length;
 if(typeof ensureImages==='function')Promise.resolve(ensureImages(want)).catch(()=>{});else if(typeof addImage==='function')for(const p of want)addImage(p,'R523 rooms');}catch(e){fail(e);}}

// ---- 그리기 ----------------------------------------------------------------------------------------
//  가구는 화면 밖이어도 모두 덧붙인다: 벽 장식(R91)이 그리기 목록의 조형물 수가 바뀔 때마다 벽 장식을 다시 짜서, 카메라를 따라 수가 바뀌면 벽 장식이 계속 다시 만들어졌다(측정: 한 지역에서 23번).
//  그래서 목록에는 늘 모두 넣되, 화면 밖 가구는 visible=false 로만 둔다 — 엔진 drawProp 이 첫 줄에서 돌아가므로 그리는 일은 화면 근처 것만 한다(모두 그리면 헤드리스에서 프레임당 약 10ms 더 들었다).
function sight(rows){if(typeof project!=='function'||typeof W!=='number'||typeof H!=='number'){for(let i=0;i<rows.length;i++)rows[i].visible=true;return rows.length;}let n=0;
 for(let i=0;i<rows.length;i++){const p=rows[i],q=project(p.x,p.y),v=q.x>-130&&q.x<W+130&&q.y>-40&&q.y<H+150;p.visible=v;if(v)n++;}return n;}
// 쉬게 할 것(이 그리기 동안만): 이 덧씌우기가 꾸미는 방 안의 R449·R224 가구(보스 전투실·중앙 전투실 제외, 방 사각형 변에 놓여 실제 벽과 떨어져 있었다)와, 정면 3/4 시점이라 바닥과 각도가 안 맞는 지역 장식 가구(R80·R81 장식과 R74 장식의 소파·장 그림)
const OFF_ANGLE=/world-r80\/(?:refined-r85-)?r80-(?:024|027|051|144|148)\.webp$/;
const skinOf=p=>String(p.path||(p.r81NativeSkin&&p.r81NativeSkin.path)||'');/* R74 장식은 path 없이 r81NativeSkin 그림으로 그려진다 */
const rests=(p,F,U)=>!!p&&fin(p.x+p.y)&&((FURN(p)&&inFight(U,p.x,p.y))||((p.r80Dressing===true||!!p.r74Prop)&&OFF_ANGLE.test(skinOf(p))))&&!inFight(F,p.x,p.y);
try{if(typeof draw==='function'){const base=draw;draw=function(...a){let r=null,m=null,rows=null;try{r=typeof room!=='undefined'?room:null;m=r?state(r):null;if(m&&m.rows.length){prime(r,m.rows);rows=m.rows;stats.shown=sight(rows);}}catch(e){fail(e);m=null;}
 if(!m||!m.rows.length)return base.apply(this,a);
 const original=r.props,FB=fightOf(r.exploration),UB=usedOf(r);let kept=original,rested=0;try{kept=original.filter(p=>!rests(p,FB,UB)||(rested++,false));}catch(e){fail(e);kept=original;}stats.rested=rested;
 r.props=kept.concat(rows);stats.frames++;try{return base.apply(this,a);}finally{r.props=original;}};}}catch(e){fail(e);}

function set(o){if(o&&typeof o.on==='boolean')prefs.on=o.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_ROOMS_R523__=Object.freeze({revision:REV,ART,G,USE,REGION,LIMIT,samplesOf,embedOf,hiddenOf,runsOf,seat,useOf,enabled,plan,resolve,list,set,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,dropLog:dropLog.slice(),plan:lastPlan,collisionChanged:false,savesTouched:false,
  room:typeof room!=='undefined'&&room&&enabled(room)?list(room).map(p=>({id:p.id,art:p.r523.art,use:p.r523.use,x:p.x,y:p.y,flip:!!p.r303Flip})):null})});
})();

// ==== R730 불면귀 구역을 마을답게 — 사용자 2026-11-11 "불면귀쪽 부터 우선 개선 … 특히 분위기랑 조형물", "귀비탕영상 + 동양몽세 진입 시네마틱과 서사에 맞게".
//  실측(헤드리스, main da9d322): last302 '잠들지 못하는 마을'은 4503칸에 조형물 25개뿐이고 집이 한 채도 없었다(기와집 그림 r80-010 은 배정만 되고 안 놓임).
//  정본: 부서진 기와·붉은 부적·장승, 포구 마을, 방문 앞 신발, 안개 속 한약 한 잔. 영상: 어두운 한옥, 등롱의 호박색 빛, 창살 너머 남색 달빛.
//  · 집: 길 뒤쪽(-x·-y) 끝 너머 언덕 위에 기와집을 줄지어 세운다. 화면에서 집 그림이 덮는 범위에 바닥 칸이 하나도 없는 자리만 쓴다(영웅·몹·보스를 가리지 않음).
//    언덕 높이만큼 그림을 올린다(visualLiftPx). -x 끝 뒤에서는 정면이 길을 보게 좌우를 뒤집는다(R414 와 같은 규칙).
//  · 길 가: 뒤쪽 끝에 붙여 석등(8칸 넘게 띄움)·향로·서낭나무·기와 더미. 보스 구역·모이는 방·문·입구·이미 있는 조형물 곁은 비운다.
//  · 그리기 전용: 충돌·바닥·몹·보스 자리·저장을 건드리지 않는다. 난수·시계를 쓰지 않는다(지도만으로 정해짐). 끄기: localStorage['storyworld.r730.village']={"on":false}.
//  · 몹·보스는 R760(bulmyeongwi-r760.js) 스레드가 맡는다. 등롱·부적 줄·댓돌 신발·장독대·약방은 Dots 그림이 오면 2차로 더한다(지금은 기존 그림만).
(()=>{'use strict';
if(window.__STORYWORLD_VILLAGE_R730__)return;
const REV='R730-village-1',KEY='storyworld.r730.village',PX=34,SUM=17,BACK=3.6,MARGIN=1;
const prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof s?.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={rooms:0,placed:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,400);};
const HOUSE=Object.freeze([
 Object.freeze({path:'assets/world-r80/r80-010.webp',height:200,aspect:512/367}),
 Object.freeze({path:'assets/world-r80/r80-010.webp',height:184,aspect:512/367}),
 Object.freeze({path:'assets/r414/buildings/waterside-house.webp',height:172,aspect:600/356})]);
const LAMP=Object.freeze({path:'assets/r92/lights/lights_regional_03.png',height:84}),CENSER=Object.freeze({path:'assets/r92/lights/lights_regional_02.png',height:52}),
 TREE=Object.freeze({path:'assets/r299/tree.webp',height:150}),GIWA=Object.freeze({path:'assets/world-r80/r80-007.webp',height:44});
const ZONE=Object.freeze({last302:Object.freeze({houses:26,lamps:20,yards:/작은 마당|외곽 쉼길/,giwa:3}),last303:Object.freeze({houses:12,lamps:14,yards:/작은 마당|외곽 쉼길/,giwa:5})});
function h32(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
// fx: {id, floorCells, rooms[{name,x,y}], doors[{x,y}], ward{boss,gather}, entry{x,y}, props[{x,y}], route?[{x,y}]} → [{id,kind,path,height,aspect?,lift?,x,y,side?}]
function plan(fx){const Z=ZONE[fx.id];if(!Z)return[];const F=new Set(),diag=new Map();
 for(const[x,y]of fx.floorCells){F.add(x+','+y);const k=x-y;let a=diag.get(k);if(!a)diag.set(k,a=[]);a.push(x+y);}
 const has=(x,y)=>F.has(x+','+y),W=fx.ward||{},inB=(B,x,y,m)=>Array.isArray(B)&&x>B[0]-m&&x<B[2]+m&&y>B[1]-m&&y<B[3]+m;
 const edges=[];for(const[x,y]of fx.floorCells){if(!has(x,y-1))edges.push({x,y,side:'-y'});if(!has(x-1,y))edges.push({x,y,side:'-x'});}
 edges.sort((a,b)=>a.y-b.y||a.x-b.x||(a.side<b.side?-1:1));
 const route=(fx.route&&fx.route.length?fx.route:[fx.entry,...(fx.doors||[]),...(fx.rooms||[])]).filter(q=>q&&Number.isFinite(q.x+q.y)),near=(x,y)=>{let b=1e9;for(const q of route){const d=Math.hypot(q.x-x,q.y-y);if(d<b)b=d;}return b;};
 // 집: 그림이 덮는 화면 범위(대각선 s0±D, 깊이 발 뒤 top ~ 발 앞 MARGIN)에 바닥 칸이 없어야 한다
 const covers=(fx_,fy,D,top)=>{const c=fx_+fy,s0=fx_-fy;for(let k=Math.floor(s0-D-1);k<=Math.ceil(s0+D+1);k++){const a=diag.get(k);if(a)for(let i=0;i<a.length;i++)if(a[i]+1>c-top&&a[i]<c+MARGIN+1)return true;}return false;};
 const cand=[];for(const e of edges){const fx_=e.side==='-y'?e.x+.5:e.x-BACK,fy=e.side==='-y'?e.y-BACK:e.y+.5;if(fx_<-6||fy<-6)continue;
  const v=HOUSE[h32(fx.id+':'+e.x+','+e.y+e.side)%HOUSE.length],D=v.height*v.aspect/2/PX,lift=Math.round(v.height*.35);
  if(covers(fx_,fy,D,(v.height+lift)/SUM))continue;if((fx.doors||[]).some(d=>Math.hypot(d.x-fx_,d.y-fy)<4+D))continue;
  cand.push({k:near(e.x+.5,e.y+.5)+(h32('k'+e.x+','+e.y+e.side)%100)/50,e,v,D,lift,x:+fx_.toFixed(2),y:+fy.toFixed(2)});}
 cand.sort((a,b)=>a.k-b.k||a.e.y-b.e.y||a.e.x-b.e.x);
 const out=[],houses=[];for(const c of cand){if(houses.length>=Z.houses)break;const s0=c.x-c.y,sm=c.x+c.y;if(houses.some(h=>Math.abs(h.s0-s0)<h.D+c.D+.5&&Math.abs(h.sm-sm)<9))continue;
  houses.push({s0,sm,D:c.D,e:c.e});out.push({id:'r730:'+fx.id+':house:'+c.e.x+'_'+c.e.y+c.e.side,kind:'house',path:c.v.path,height:c.v.height,aspect:c.v.aspect,lift:c.lift,x:c.x,y:c.y,side:c.e.side});}
 // 길 가: 뒤쪽 끝 칸 안쪽 .75칸
 const taken=[],clear=(x,y,r)=>!inB(W.boss,x,y,1.5)&&!inB(W.gather,x,y,1.5)&&!(fx.doors||[]).some(d=>Math.hypot(d.x-x,d.y-y)<3.5)&&Math.hypot(fx.entry.x-x,fx.entry.y-y)>=3.5&&!(fx.props||[]).some(q=>Math.hypot(q.x-x,q.y-y)<2.4)&&!taken.some(t=>Math.hypot(t.x-x,t.y-y)<(t.r>r?t.r:r));
 const spotOf=e=>e.side==='-y'?{x:e.x+.5,y:e.y+.75}:{x:e.x+.75,y:e.y+.5},inner=e=>e.side==='-y'?has(e.x,e.y+1)&&has(e.x-1,e.y)&&has(e.x+1,e.y):has(e.x+1,e.y)&&has(e.x,e.y-1)&&has(e.x,e.y+1);/* 모서리·한 칸 턱이 아닌 반듯한 끝 */
 const put=(e,kind,a,r,tag)=>{const s=spotOf(e);if(!inner(e)||!clear(s.x,s.y,r))return false;taken.push({x:s.x,y:s.y,r});out.push({id:'r730:'+fx.id+':'+kind+':'+tag,kind,path:a.path,height:a.height,x:s.x,y:s.y,side:e.side});return true;};
 // 마당·쉼길: 방 자리에서 가장 가까운 뒤쪽 끝에 서낭나무, 그 곁에 향로
 let yn=0;for(const q of fx.rooms||[]){if(!Z.yards.test(String(q.name||''))||yn>=6)continue;const es=edges.filter(e=>Math.hypot(e.x-q.x,e.y-q.y)<9).sort((a,b)=>Math.hypot(a.x-q.x,a.y-q.y)-Math.hypot(b.x-q.x,b.y-q.y)||a.y-b.y||a.x-b.x);
  for(const e of es)if(put(e,'tree',TREE,5,'r'+q.id)){yn++;for(const e2 of es)if(Math.hypot(e2.x-e.x,e2.y-e.y)>=2.5&&put(e2,'censer',CENSER,2.4,'r'+q.id))break;break;}}
 // 집 앞 기와 더미(집 Z.giwa 채마다 하나)
 houses.forEach((h,i)=>{if(i%Z.giwa)return;const es=edges.filter(e=>e.side===h.e.side&&Math.abs(e.x-h.e.x)+Math.abs(e.y-h.e.y)<=3);for(const e of es)if(put(e,'giwa',GIWA,2.4,'h'+i))break;});
 // 석등: 길에서 가까운 뒤쪽 끝부터, 서로 8칸 넘게
 let ln=0;const le=edges.map(e=>({e,k:near(e.x+.5,e.y+.5)+(h32('l'+e.x+','+e.y+e.side)%100)/25})).sort((a,b)=>a.k-b.k||a.e.y-b.e.y||a.e.x-b.e.x);
 for(const{e}of le){if(ln>=Z.lamps)break;if(put(e,'lamp',LAMP,8.2,e.x+'_'+e.y+e.side))ln++;}
 return out;}
const done=new WeakMap();
function routeOf(r){const out=[];try{const s=window.__STORYWORLD_PLAY_R169__?.pathCells?.(r);if(s&&typeof s.forEach==='function'){let i=0;s.forEach(k=>{if(i++%3)return;const[x,y]=String(k).split(',').map(Number);if(Number.isFinite(x+y))out.push({x:x+.5,y:y+.5});});}}catch(e){fail(e);}return out;}
function apply(r){if(!prefs.on||!r||!ZONE[r.id]||!(!r.layer||r.layer==='STORY')||!r.exploration||!Array.isArray(r.props)||!Array.isArray(r.exploration.floorCells))return;const L=r.exploration;if(L.samongR103||L.samongR115||done.get(r)===L)return;done.set(r,L);
 const W=L.worldWardR81||{},rows=plan({id:r.id,floorCells:L.floorCells,rooms:(L.worldR74?.rooms||[]).map(q=>({id:q.id,name:q.name||q.purpose||'',x:q.x,y:q.y})),doors:L.worldR74?.doors||[],ward:{boss:W.bossBounds,gather:W.gatherBounds},entry:L.entry||{x:-99,y:-99},
  props:r.props.filter(p=>p&&!p.r730&&p.visible!==false&&Number.isFinite(p.x+p.y)).map(p=>({x:p.x,y:p.y})),route:routeOf(r)});
 const have=new Set(r.props.map(p=>p&&p.id));stats.rooms++;
 for(const s of rows){if(have.has(s.id))continue;const q={id:s.id,x:s.x,y:s.y,path:s.path,height:s.height,visible:true,enabled:true,interactive:false,presentationOnly:true,autoTargetEligible6:false,r730:s.kind,r412Wall:1,r412Face:1};
  if(s.kind==='house'){q.visualLiftPx=s.lift;if(s.side==='-x')q.r303Flip=true;}else if(s.kind==='lamp')q.r115Prop='lantern';else if(s.kind==='censer')q.r115Prop='brazier';
  r.props.push(q);try{if(typeof addImage==='function')addImage(s.path,'R730 village');}catch(_){}stats.placed++;}}
const live=()=>typeof started!=='undefined'&&started&&typeof room!=='undefined'&&!!room&&!(typeof loading!=='undefined'&&loading);
function install(){if(typeof draw!=='function')return false;const db=draw;draw=function(...a){try{if(live())apply(room);}catch(e){fail(e);}return db.apply(this,a);};
 if(typeof drawProp==='function'){const dp=drawProp;drawProp=function(p,...a){try{if(p&&p.r730&&typeof readyImage==='function'&&!readyImage(p.path)&&typeof addImage==='function'&&!(typeof imageCache!=='undefined'&&imageCache.get(p.path)?.error))addImage(p.path,'R730 village');}catch(e){fail(e);}return dp.apply(this,[p,...a]);};}
 return true;}
let installed=install(),tries=0;if(!installed&&typeof setInterval==='function'){const t=setInterval(()=>{if(installed||(installed=install())||++tries>200)clearInterval(t);},100);}
function set(o={}){if(typeof o.on==='boolean')prefs.on=o.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_VILLAGE_R730__=Object.freeze({revision:REV,plan,apply,set,ZONE,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,room:typeof room!=='undefined'&&room&&Array.isArray(room.props)?room.props.filter(p=>p&&p.r730).map(p=>({id:p.id,kind:p.r730,x:p.x,y:p.y})):null})});
})();
