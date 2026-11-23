// R1305 — EXT_meshopt_compression GLB 를 압축 없는 GLB 로 풀어 stdout 으로 낸다(정적 검사용).
// 배포본과 같은 vendor/three/examples/jsm/libs/meshopt_decoder.module.js 로 푼다 → 런타임 디코더 회귀도 같이 잡힌다.
// 사용: node r96/qa/r1305/glb-unpack.mjs <glb>   (압축이 없으면 입력 바이트를 그대로 낸다)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const R = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const b = fs.readFileSync(process.argv[2]);
const jn = b.readUInt32LE(12), j = JSON.parse(b.toString('utf8', 20, 20 + jn).replace(/[\u0000 ]+$/, ''));
if (!(j.extensionsUsed || []).includes('EXT_meshopt_compression')) { process.stdout.write(b); process.exit(0); }
const { MeshoptDecoder } = await import(pathToFileURL(path.join(R, 'runtime-text/vendor/three/examples/jsm/libs/meshopt_decoder.module.js')).href);
await MeshoptDecoder.ready;
const bo = 20 + jn, bin = b.subarray(bo + 8, bo + 8 + b.readUInt32LE(bo));
const parts = []; let len = 0;
for (const v of j.bufferViews) {
  const e = v.extensions?.EXT_meshopt_compression; let data;
  if (e) { data = new Uint8Array(e.count * e.byteStride); MeshoptDecoder.decodeGltfBuffer(data, e.count, e.byteStride, bin.subarray(e.byteOffset || 0, (e.byteOffset || 0) + e.byteLength), e.mode, e.filter); delete v.extensions.EXT_meshopt_compression; if (!Object.keys(v.extensions).length) delete v.extensions; }
  else data = bin.subarray(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength);
  const pad = (4 - len % 4) % 4; if (pad) { parts.push(Buffer.alloc(pad)); len += pad; }
  v.buffer = 0; v.byteOffset = len; v.byteLength = data.length; parts.push(Buffer.from(data.buffer, data.byteOffset, data.length)); len += data.length;
}
const pad = (4 - len % 4) % 4; if (pad) { parts.push(Buffer.alloc(pad)); len += pad; }
j.buffers = [{ byteLength: len }];
j.extensionsUsed = j.extensionsUsed.filter(x => x !== 'EXT_meshopt_compression');
j.extensionsRequired = (j.extensionsRequired || []).filter(x => x !== 'EXT_meshopt_compression');
let js = Buffer.from(JSON.stringify(j)); js = Buffer.concat([js, Buffer.alloc((4 - js.length % 4) % 4, 0x20)]);
const h = Buffer.alloc(12); h.write('glTF', 0, 'latin1'); h.writeUInt32LE(2, 4); h.writeUInt32LE(28 + js.length + len, 8);
const ch = (n, t) => { const c = Buffer.alloc(8); c.writeUInt32LE(n, 0); c.write(t, 4, 'latin1'); return c; };
process.stdout.write(Buffer.concat([h, ch(js.length, 'JSON'), js, ch(len, 'BIN\0'), ...parts]));
