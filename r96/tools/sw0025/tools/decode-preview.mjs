import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const [input,out,decoder]=process.argv.slice(2);
assert.ok(input&&out&&decoder&&!fs.existsSync(out));
const {MeshoptDecoder}=await import(pathToFileURL(path.resolve(decoder)));
await MeshoptDecoder.ready;
const src=fs.readFileSync(input),n=src.readUInt32LE(12);
const j=JSON.parse(src.subarray(20,20+n)), b=src.subarray(28+n);
let len=b.length;const bins=[b];
for(const v of j.bufferViews){
 const x=v.extensions?.EXT_meshopt_compression;if(!x)continue;
 assert.equal(x.buffer,0);
 const d=Buffer.alloc(x.count*x.byteStride);
 MeshoptDecoder.decodeGltfBuffer(d,x.count,x.byteStride,b.subarray(x.byteOffset,x.byteOffset+x.byteLength),x.mode,x.filter||'NONE');
 assert.equal(d.length,v.byteLength);
 const pad=(-len)&3;if(pad){bins.push(Buffer.alloc(pad));len+=pad;}
 v.buffer=0;v.byteOffset=len;
 bins.push(d);len+=d.length;
 delete v.extensions.EXT_meshopt_compression;if(!Object.keys(v.extensions).length)delete v.extensions;
}
const pad=(-len)&3;if(pad){bins.push(Buffer.alloc(pad));len+=pad;}
j.buffers=[{byteLength:len}];
j.extensionsUsed=j.extensionsUsed.filter(e=>e!=='EXT_meshopt_compression');j.extensionsRequired=j.extensionsRequired.filter(e=>e!=='EXT_meshopt_compression');
let js=Buffer.from(JSON.stringify(j));js=Buffer.concat([js,Buffer.alloc((-js.length)&3,32)]);
const h=Buffer.alloc(20),ih=Buffer.alloc(8);h.write('glTF');h.writeUInt32LE(2,4);h.writeUInt32LE(28+js.length+len,8);h.writeUInt32LE(js.length,12);h.write('JSON',16);ih.writeUInt32LE(len);ih.write('BIN\0',4);
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,Buffer.concat([h,js,ih,...bins]));
console.log(out,len);
