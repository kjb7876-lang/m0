// R1339 동작 중 '끌려옴' 검사 — 배포되는 GLB 를 그대로 읽어 스킨을 직접 계산한다(Blender·브라우저 없이 CI 에서 돈다).
// 사용자 지적(11-27): "닷츠로 만든 건 품질은 낮아도 이미지가 끌려오는 게 없는데, 허깅페이스로 만든 건 끌려와서 이상하다".
//  - 끌려옴 = 동작하는 동안 면(삼각형 변)이 늘어나 그림이 잡아당겨지는 것. 변이 두 배 넘게 늘어나면서 그 증가가 모델 키의 1% 를 넘는 변의
//    비율(slab%)과, 변 길이 증가(키 대비)의 99.9 백분위(p99.9)로 잰다. drag%(두 배 조건 없이 키 1% 넘게 는 변)는 참고값으로만 찍는다 —
//    출렁이게 만든 예전 Dots 검은 소화액도 drag% 2.4 라서, 의도한 출렁임과 끌려옴을 가르지 못한다.
//  - 벌어짐 = 쉬는 자세에서 한 점에 붙어 있던 꼭짓점이 동작 중 떨어지는 거리(gap, 키 대비). 통째 조각으로 자를 때 생기는 틈·떠다니는 조각을 잡는다.
//  - 모든 클립을 8 순간씩(죽음은 앞 절반만: 무너지는 연출이라) 본다.
// 기준: 새 GLB 는 slab% ≤ 0.6, p99.9 ≤ 0.05, gap ≤ 0.02(키의 2%). 예전 Dots 모델은 slab% 0~0.29, p99.9 0.004~0.046 이다(약 2배 여유).
// node r96/qa/r1339/stretch-check.mjs [--report] [glb …]   (인자 없으면 R1339 바꿔치기 표의 새 GLB 전부 + 옛 GLB 참고값)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const RT = path.join(ROOT, 'runtime-text');
const { MeshoptDecoder } = await import(pathToFileURL(path.join(RT, 'vendor/three/examples/jsm/libs/meshopt_decoder.module.js')).href);
await MeshoptDecoder.ready;
const SLAB_MAX = 0.6, P999_MAX = 0.05, GAP_MAX = 0.02;

function readGlb(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt32LE(0) !== 0x46546c67) throw Error(file + ' 는 GLB 가 아님');
  const jn = b.readUInt32LE(12), j = JSON.parse(b.toString('utf8', 20, 20 + jn));
  const bo = 20 + jn, bin = b.subarray(bo + 8, bo + 8 + b.readUInt32LE(bo));
  const views = j.bufferViews.map(v => {
    const ext = v.extensions && v.extensions.EXT_meshopt_compression;
    if (ext) {
      const src = new Uint8Array(bin.buffer, bin.byteOffset + (ext.byteOffset || 0), ext.byteLength);
      const out = new Uint8Array(ext.count * ext.byteStride);
      MeshoptDecoder.decodeGltfBuffer(out, ext.count, ext.byteStride, src, ext.mode, ext.filter || 'NONE');
      return { u8: out, stride: ext.byteStride };
    }
    return { u8: new Uint8Array(bin.buffer, bin.byteOffset + (v.byteOffset || 0), v.byteLength), stride: v.byteStride };
  });
  const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
  const acc = i => {
    const a = j.accessors[i], n = NC[a.type], out = new Float64Array(a.count * n);
    if (a.bufferView === undefined) return { n, a: out };
    const v = views[a.bufferView], cs = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }[a.componentType];
    const stride = v.stride || cs * n, dv = new DataView(v.u8.buffer, v.u8.byteOffset, v.u8.byteLength), base = a.byteOffset || 0;
    const rd = { 5120: o => dv.getInt8(o), 5121: o => dv.getUint8(o), 5122: o => dv.getInt16(o, true), 5123: o => dv.getUint16(o, true), 5125: o => dv.getUint32(o, true), 5126: o => dv.getFloat32(o, true) }[a.componentType];
    const nz = a.normalized ? { 5120: x => Math.max(x / 127, -1), 5121: x => x / 255, 5122: x => Math.max(x / 32767, -1), 5123: x => x / 65535 }[a.componentType] : x => x;
    for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) out[k * n + c] = nz(rd(base + k * stride + c * cs));
    return { n, a: out };
  };
  return { j, acc };
}

// 4x4 열 우선(glTF) 행렬
const mul = (A, B) => { const C = new Float64Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += A[k * 4 + r] * B[c * 4 + k]; C[c * 4 + r] = s; } return C; };
const trs = (t, q, s) => { const [x, y, z, w] = q; const M = new Float64Array(16);
  M[0] = (1 - 2 * (y * y + z * z)) * s[0]; M[1] = 2 * (x * y + z * w) * s[0]; M[2] = 2 * (x * z - y * w) * s[0];
  M[4] = 2 * (x * y - z * w) * s[1]; M[5] = (1 - 2 * (x * x + z * z)) * s[1]; M[6] = 2 * (y * z + x * w) * s[1];
  M[8] = 2 * (x * z + y * w) * s[2]; M[9] = 2 * (y * z - x * w) * s[2]; M[10] = (1 - 2 * (x * x + y * y)) * s[2];
  M[12] = t[0]; M[13] = t[1]; M[14] = t[2]; M[15] = 1; return M; };
const slerp = (a, b, t) => { let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]; const bb = d < 0 ? b.map(x => -x) : b; d = Math.abs(d);
  let k0 = 1 - t, k1 = t; if (d < 0.9995) { const th = Math.acos(d), s = Math.sin(th); k0 = Math.sin((1 - t) * th) / s; k1 = Math.sin(t * th) / s; }
  const r = a.map((x, i) => x * k0 + bb[i] * k1), l = Math.hypot(...r); return r.map(x => x / l); };

export function measure(file) {
  const { j, acc } = readGlb(file);
  const skin = j.skins && j.skins[0];
  if (!skin) throw Error(file + ' 스킨 없음');
  const meshNodes = j.nodes.map((n, i) => i).filter(i => j.nodes[i].mesh !== undefined && j.nodes[i].skin !== undefined);
  const parent = new Int32Array(j.nodes.length).fill(-1); j.nodes.forEach((n, i) => (n.children || []).forEach(c => { parent[c] = i; }));
  const base = j.nodes.map(n => ({ t: n.translation || [0, 0, 0], r: n.rotation || [0, 0, 0, 1], s: n.scale || [1, 1, 1], m: n.matrix }));
  const ibm = skin.inverseBindMatrices !== undefined ? acc(skin.inverseBindMatrices).a : null;
  // 프리미티브 모으기
  const prims = [];
  for (const ni of meshNodes) for (const p of j.meshes[j.nodes[ni].mesh].primitives) {
    const P = acc(p.attributes.POSITION).a, J = acc(p.attributes.JOINTS_0).a, W = acc(p.attributes.WEIGHTS_0).a;
    const nv = P.length / 3; let I;
    if (p.indices !== undefined) I = acc(p.indices).a; else { I = new Float64Array(nv); for (let k = 0; k < nv; k++) I[k] = k; }
    const es = new Set(), E = [];
    for (let k = 0; k + 2 < I.length; k += 3) for (const [a, b] of [[I[k], I[k + 1]], [I[k + 1], I[k + 2]], [I[k + 2], I[k]]]) { const key = a < b ? a * 4194304 + b : b * 4194304 + a; if (!es.has(key)) { es.add(key); E.push(a < b ? a : b, a < b ? b : a); } }
    prims.push({ P, J, W, nv, E: Int32Array.from(E) });
  }
  const world = pose => { const Wm = new Array(j.nodes.length); const get = i => { if (Wm[i]) return Wm[i]; const b = pose[i]; const L = b.m ? Float64Array.from(b.m) : trs(b.t, b.r, b.s); return (Wm[i] = parent[i] < 0 ? L : mul(get(parent[i]), L)); }; for (let i = 0; i < j.nodes.length; i++) get(i); return Wm; };
  const skinned = pose => { const Wm = world(pose); const JM = skin.joints.map((ji, k) => ibm ? mul(Wm[ji], ibm.subarray(k * 16, k * 16 + 16)) : Wm[ji]);
    return prims.map(pr => { const out = new Float64Array(pr.nv * 3);
      for (let v = 0; v < pr.nv; v++) { const x = pr.P[v * 3], y = pr.P[v * 3 + 1], z = pr.P[v * 3 + 2]; let ox = 0, oy = 0, oz = 0, ws = 0;
        for (let c = 0; c < 4; c++) { const w = pr.W[v * 4 + c]; if (!w) continue; const M = JM[pr.J[v * 4 + c]]; ws += w;
          ox += w * (M[0] * x + M[4] * y + M[8] * z + M[12]); oy += w * (M[1] * x + M[5] * y + M[9] * z + M[13]); oz += w * (M[2] * x + M[6] * y + M[10] * z + M[14]); }
        if (ws > 0) { ox /= ws; oy /= ws; oz /= ws; } out[v * 3] = ox; out[v * 3 + 1] = oy; out[v * 3 + 2] = oz; }
      return out; }); };
  const rest = skinned(base);
  let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (const r of rest) for (let k = 0; k < r.length; k += 3) for (let c = 0; c < 3; c++) { mn[c] = Math.min(mn[c], r[k + c]); mx[c] = Math.max(mx[c], r[k + c]); }
  const H = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]);
  const len = (Q, E) => { const L = new Float64Array(E.length / 2); for (let k = 0; k < L.length; k++) { const a = E[2 * k] * 3, b = E[2 * k + 1] * 3; L[k] = Math.hypot(Q[a] - Q[b], Q[a + 1] - Q[b + 1], Q[a + 2] - Q[b + 2]); } return L; };
  const L0 = prims.map((pr, i) => len(rest[i], pr.E));
  // 쉬는 자세에서 같은 자리(키의 1e-5 이내)에 있는 꼭짓점 짝(잘린 이음매)
  const seams = prims.map((pr, i) => { const q = H * 1e-5, first = new Map(), S = []; const r = rest[i];
    for (let v = 0; v < pr.nv; v++) { const key = Math.round(r[v * 3] / q) + ',' + Math.round(r[v * 3 + 1] / q) + ',' + Math.round(r[v * 3 + 2] / q); if (first.has(key)) S.push(first.get(key), v); else first.set(key, v); }
    return Int32Array.from(S); });
  const clips = {};
  for (const an of j.animations || []) {
    let t1 = 0; for (const s of an.samplers) { const inp = acc(s.input).a; t1 = Math.max(t1, inp[inp.length - 1]); }
    if (/^death/i.test(an.name)) t1 *= 0.5;
    const samp = an.samplers.map(s => ({ inp: acc(s.input).a, out: acc(s.output), interp: s.interpolation || 'LINEAR' }));
    let dragN = 0, slabN = 0, edgeN = 0, gap = 0, drag999 = [];
    for (let si = 0; si < 8; si++) {
      const t = t1 * si / 7, pose = base.map(b => ({ ...b }));
      for (const ch of an.channels) { const sm = samp[ch.sampler], n = ch.target.node, pth = ch.target.path; if (pth === 'weights') continue;
        const inp = sm.inp, o = sm.out, w = o.n, cubic = sm.interp === 'CUBICSPLINE'; let k = 0; while (k < inp.length - 1 && inp[k + 1] <= t) k++;
        const val = idx => { const off = cubic ? (idx * 3 + 1) * w : idx * w; return Array.from(o.a.subarray(off, off + w)); };
        let v; if (k >= inp.length - 1 || sm.interp === 'STEP' || t <= inp[0]) v = val(t <= inp[0] ? 0 : k);
        else { const f = (t - inp[k]) / (inp[k + 1] - inp[k]), a = val(k), b = val(k + 1); v = pth === 'rotation' ? slerp(a, b, f) : a.map((x, i) => x + (b[i] - x) * f); }
        pose[n] = { ...pose[n], m: undefined, [pth === 'translation' ? 't' : pth === 'rotation' ? 'r' : 's']: v }; }
      const Q = skinned(pose);
      prims.forEach((pr, i) => { const L = len(Q[i], pr.E); for (let k = 0; k < L.length; k++) { const d = (L[k] - L0[i][k]) / H; edgeN++; if (d > 0.01) { dragN++; if (L[k] > 2 * L0[i][k]) slabN++; } drag999.push(d); }
        const S = seams[i], q = Q[i]; for (let k = 0; k < S.length; k += 2) { const a = S[k] * 3, b = S[k + 1] * 3; gap = Math.max(gap, Math.hypot(q[a] - q[b], q[a + 1] - q[b + 1], q[a + 2] - q[b + 2]) / H); } });
    }
    drag999.sort((a, b) => a - b);
    clips[an.name] = { drag_pct: +(dragN / edgeN * 100).toFixed(3), slab_pct: +(slabN / edgeN * 100).toFixed(3), drag_p999: +drag999[Math.floor(drag999.length * 0.999)].toFixed(4), gap: +gap.toFixed(4) };
  }
  const vals = Object.values(clips);
  return { file: path.relative(RT, file), H: +H.toFixed(4), drag_pct: Math.max(...vals.map(v => v.drag_pct)), slab_pct: Math.max(...vals.map(v => v.slab_pct)), drag_p999: Math.max(...vals.map(v => v.drag_p999)), gap: Math.max(...vals.map(v => v.gap)), clips };
}

function hqMap() {
  const win = { location: { search: '', href: 'https://x.test/m0/' }, document: { baseURI: 'https://x.test/m0/', getElementById: () => null }, localStorage: { getItem: () => null, setItem() {} }, fetch: () => Promise.resolve({}), Request: class {} };
  win.window = win; vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'client-source', 'mob-3d-hq-r1339.js'), 'utf8'), win);
  return win.__STORYWORLD_MOB3D_HQ_R1339__.map();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--')), report = process.argv.includes('--report');
  const fmt = r => `${r.file.padEnd(62)} drag%=${String(r.drag_pct).padStart(6)} slab%=${String(r.slab_pct).padStart(6)} p99.9=${r.drag_p999.toFixed(4)} gap=${r.gap.toFixed(4)}`;
  if (args.length) { for (const a of args) console.log(fmt(measure(path.resolve(a)))); process.exit(0); }
  const map = hqMap(); let bad = 0, n = 0;
  for (const [oldp, newp] of Object.entries(map)) {
    const o = measure(path.join(RT, oldp)), r = measure(path.join(RT, newp));
    console.log('old ' + fmt(o)); console.log('new ' + fmt(r));
    const why = []; if (r.slab_pct > SLAB_MAX) why.push(`끌려옴 slab ${r.slab_pct}% > ${SLAB_MAX}%`); if (r.drag_p999 > P999_MAX) why.push(`끌려옴 p99.9 ${r.drag_p999} > ${P999_MAX}`); if (r.gap > GAP_MAX) why.push(`조각 벌어짐 ${r.gap} > ${GAP_MAX}`);
    if (why.length) { bad++; console.log('  FAIL ' + newp + ': ' + why.join(', ') + (report ? '\n  ' + JSON.stringify(r.clips) : '')); } else { n++; console.log('  ok'); }
  }
  if (bad) { console.log(`R1339 stretch-check FAIL ${bad}/${bad + n}`); process.exit(1); }
  console.log(`R1339 stretch-check PASS ${n}`);
}
