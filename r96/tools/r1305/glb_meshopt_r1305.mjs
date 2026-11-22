// R1305 — 3D 영웅 GLB 의 정점·인덱스 bufferView 를 EXT_meshopt_compression 으로 무손실 압축한다(Pages 1.1GB 예산).
// 사용: node r96/tools/r1305/glb_meshopt_r1305.mjs <meshoptimizer 패키지 폴더> <in.glb> <out.glb>
//  - 정점 속성(target 34962, byteStride 4의 배수)은 ATTRIBUTES, 인덱스(34963)는 TRIANGLES(디코드가 바이트까지 같지 않으면 INDICES).
//  - 필터(oct·quat·exp)는 쓰지 않는다 → 디코드 결과는 원래 bufferView 와 바이트가 같다(이 스크립트가 직접 디코드해 비교, 다르면 실패).
//  - 이미지·애니메이션·스킨 행렬 같은 작은 view 는 그대로 둔다. 압축한 view 는 바이트 없는 대체 버퍼(fallback)를 가리킨다.
//  - 런타임: hwando-3d-r1302.js 가 vendor/three/examples/jsm/libs/meshopt_decoder.module.js 로 setMeshoptDecoder 한다.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [pkg, src, dst] = process.argv.slice(2);
const { MeshoptEncoder } = await import(pathToFileURL(path.join(pkg, 'meshopt_encoder.module.js')).href);
const { MeshoptDecoder } = await import(pathToFileURL(path.join(pkg, 'meshopt_decoder.module.js')).href);
await MeshoptEncoder.ready; await MeshoptDecoder.ready;

const b = fs.readFileSync(src);
if (b.toString('latin1', 0, 4) !== 'glTF') throw Error('not glb');
const jn = b.readUInt32LE(12), j = JSON.parse(b.toString('utf8', 20, 20 + jn));
const bo = 20 + jn, bn = b.readUInt32LE(bo), bin = b.subarray(bo + 8, bo + 8 + bn);
if (j.buffers.length !== 1) throw Error('expected one buffer');
if ((j.extensionsUsed || []).includes('EXT_meshopt_compression')) throw Error('already compressed');

const out = []; let len = 0; const put = u8 => { const pad = (4 - len % 4) % 4; if (pad) { out.push(new Uint8Array(pad)); len += pad; } const off = len; out.push(u8); len += u8.length; return off; };
let before = 0, after = 0;
for (const v of j.bufferViews) {
  const raw = new Uint8Array(bin.buffer, bin.byteOffset + (v.byteOffset || 0), v.byteLength);
  let enc = null;
  if (v.target === 34962 && v.byteStride && v.byteStride % 4 === 0 && v.byteLength % v.byteStride === 0) enc = { mode: 'ATTRIBUTES', stride: v.byteStride };
  else if (v.target === 34963 && v.byteLength % 2 === 0) {
    const size = j.accessors.find(a => a.bufferView === j.bufferViews.indexOf(v))?.componentType === 5125 ? 4 : 2;
    enc = { mode: (v.byteLength / size) % 3 === 0 ? 'TRIANGLES' : 'INDICES', stride: size };
  }
  if (!enc) { v.byteOffset = put(raw); v.buffer = 0; continue; }
  const count = v.byteLength / enc.stride;
  const tryMode = mode => {
    const data = MeshoptEncoder.encodeGltfBuffer(raw, count, enc.stride, mode);
    const back = new Uint8Array(count * enc.stride);
    MeshoptDecoder.decodeGltfBuffer(back, count, enc.stride, data, mode);
    return Buffer.compare(Buffer.from(back), Buffer.from(raw)) === 0 ? data : null;
  };
  let mode = enc.mode, data = tryMode(mode);
  if (!data && mode === 'TRIANGLES') { mode = 'INDICES'; data = tryMode(mode); }
  if (!data) throw Error('round-trip mismatch for bufferView ' + j.bufferViews.indexOf(v));
  const off = put(data);
  v.extensions = { ...(v.extensions || {}), EXT_meshopt_compression: { buffer: 0, byteOffset: off, byteLength: data.length, byteStride: enc.stride, mode, count } };
  v.buffer = 1; v.byteOffset = 0; // fallback 버퍼 안에서 원래 크기 자리만 차지
  before += raw.length; after += data.length;
}
// fallback 버퍼: 바이트 없음, 압축된 view 들이 차례로 자리를 차지
let fb = 0; for (const v of j.bufferViews) if (v.buffer === 1) { fb += (4 - fb % 4) % 4; v.byteOffset = fb; fb += v.byteLength; }
const pad = (4 - len % 4) % 4; if (pad) { out.push(new Uint8Array(pad)); len += pad; }
j.buffers = [{ byteLength: len }, { byteLength: fb, extensions: { EXT_meshopt_compression: { fallback: true } } }];
j.extensionsUsed = [...new Set([...(j.extensionsUsed || []), 'EXT_meshopt_compression'])];
j.extensionsRequired = [...new Set([...(j.extensionsRequired || []), 'EXT_meshopt_compression'])];
let js = Buffer.from(JSON.stringify(j), 'utf8'); js = Buffer.concat([js, Buffer.alloc((4 - js.length % 4) % 4, 0x20)]);
const head = Buffer.alloc(12); head.write('glTF', 0, 'latin1'); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + len, 8);
const ch = (n, t) => { const h = Buffer.alloc(8); h.writeUInt32LE(n, 0); h.write(t, 4, 'latin1'); return h; };
fs.writeFileSync(dst, Buffer.concat([head, ch(js.length, 'JSON'), js, ch(len, 'BIN\0'), ...out.map(u => Buffer.from(u.buffer, u.byteOffset, u.length))]));
console.log(`${path.basename(src)}: geometry ${before.toLocaleString()} -> ${after.toLocaleString()} bytes, file ${b.length.toLocaleString()} -> ${fs.statSync(dst).size.toLocaleString()}`);
