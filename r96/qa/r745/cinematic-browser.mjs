// R745 브라우저 재생 확인(헤드리스 Chromium): 다시 만든 시네마틱 9편이 열리고, 크기·길이가 맞고, 실제로 재생되며 프레임이 나오는지.
// 쓰기: (r96/runtime-text 를 정적 서버로) node r96/qa/r745/cinematic-browser.mjs http://127.0.0.1:4396/
// 헤드리스 소프트웨어 재생이므로 '그래픽 검증 완료'가 아니라 '헤드리스 재생 확인'이다.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:4396/';
const V = [
  ['assets/r309/intro/opening-hapil.mp4', 1280, 720], ['assets/r372/opening-book.mp4', 1280, 720], ['assets/r372/root-gate.mp4', 1280, 720],
  ['assets/r369/poison-city.mp4', 1280, 720], ['assets/r368/betrayal.mp4', 1280, 548], ['assets/r617/knight.mp4', 1280, 720],
  ['assets/r617/beach.mp4', 1280, 720], ['assets/r617/fall.mp4', 1280, 720], ['assets/r667/title-video/loop.mp4', 960, 540],
];
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
await page.goto(base + 'assets/r372/index.json'); // 같은 출처(캔버스로 프레임 읽기)
await page.setContent('<html><body style="margin:0;background:#000"></body></html>');
let pass = 0, fail = 0;
for (const [src, w, h] of V) {
  const r = await page.evaluate(async ([url, w, h]) => {
    const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.src = url; document.body.replaceChildren(v);
    const ev = (n, t) => new Promise((res, rej) => { const to = setTimeout(() => rej(new Error(n + ' timeout')), t); v.addEventListener(n, () => { clearTimeout(to); res(); }, { once: true }); v.addEventListener('error', () => { clearTimeout(to); rej(new Error('media error ' + (v.error && v.error.code))); }, { once: true }); });
    try {
      await ev('loadeddata', 20000);
      const meta = { w: v.videoWidth, h: v.videoHeight, d: v.duration };
      await v.play(); const t0 = v.currentTime; await new Promise(r => setTimeout(r, 1500)); const t1 = v.currentTime; v.pause();
      const c = document.createElement('canvas'); c.width = 64; c.height = 36; const g = c.getContext('2d'); g.drawImage(v, 0, 0, 64, 36);
      const px = g.getImageData(0, 0, 64, 36).data; let sum = 0; for (let i = 0; i < px.length; i += 4) sum += px[i] + px[i + 1] + px[i + 2];
      return { ok: true, ...meta, advanced: t1 - t0, mean: sum / (px.length / 4) / 3 };
    } catch (e) { return { ok: false, err: String(e) }; }
  }, [base + src, w, h]);
  const good = r.ok && r.w === w && r.h === h && r.advanced > 0.05 && r.mean > 1;
  good ? pass++ : fail++;
  console.log((good ? 'PASS ' : 'FAIL ') + src + ' ' + JSON.stringify(r));
}
await browser.close();
console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
