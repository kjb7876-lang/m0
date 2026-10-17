#!/usr/bin/env python3
"""R67 presentation-only optimization, applied AFTER the verified R66 overlay.

Only unlit, planar image commands use one transparent pass. Volumetric meshes,
normal-mapped props, authored pixels, alpha/depth/blend rules and simulation are
not changed. Label slots are reused in original painter order and retired as
soon as unused. Unknown mutable canvases keep their existing refresh behavior.
"""
from __future__ import annotations
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_COMMIT = '080ef5a535eb900f9c50900dbc35bf6c81e0ddb4'

def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def replace_once(source: str, old: str, new: str) -> str:
    if source.count(old) != 1:
        raise RuntimeError(f'R67 source drift: expected one anchor, got {source.count(old)}: {old[:100]}')
    return source.replace(old, new, 1)

LABEL_METHOD = r'''  label(c){
    if(!this.createLabelRoot)return;
    this.labelRoot??=this.createLabelRoot();
    const index=this.labelCursorR67||0;this.labelCursorR67=index+1;
    let node=this.labels[index];
    if(!node){
      const document=this.labelRoot.ownerDocument||globalThis.document;
      node=document.createElement('span');this.labelRoot.appendChild(node);this.labels.push(node);
      this.stats.labelNodesCreatedR67=(this.stats.labelNodesCreatedR67||0)+1;
    }else this.stats.labelNodesReusedR67=(this.stats.labelNodesReusedR67||0)+1;
    const s=c.style,matrix=c.matrix.slice(0,4);
    if(node.textContent!==c.text)node.textContent=c.text;
    const values={position:'absolute',left:c.point[0]+'px',top:c.point[1]+'px',whiteSpace:'pre',font:s.font,color:s.fillStyle,opacity:String(s.globalAlpha),transformOrigin:'0 0',transform:`matrix(${matrix.join(',')},0,0) translate(${s.textAlign==='center'?'-50%':s.textAlign==='right'||s.textAlign==='end'?'-100%':'0'},${s.textBaseline==='middle'?'-50%':s.textBaseline==='top'?'0':'-80%'})`,pointerEvents:'none',textShadow:s.shadowBlur?`0 0 ${s.shadowBlur}px ${s.shadowColor}`:'none'};
    const previous=node.__storyworldLabelStyleR67;
    for(const key in values)if(!previous||previous[key]!==values[key])node.style[key]=values[key];
    node.__storyworldLabelStyleR67=values;
  }'''

def transform(source: str) -> str:
    if 'labelCursorR67' in source or 'r67FlatSinglePass' in source:
        raise RuntimeError('R67 already applied')
    # Avoid 14 temporary [key,value] arrays and the map array per style snapshot.
    source = replace_once(source,
        'style(){return Object.fromEntries(this.styleKeys.map(k=>[k,this[k]]));}',
        'style(){return{globalAlpha:this.globalAlpha,globalCompositeOperation:this.globalCompositeOperation,fillStyle:this.fillStyle,strokeStyle:this.strokeStyle,filter:this.filter,font:this.font,textAlign:this.textAlign,textBaseline:this.textBaseline,lineWidth:this.lineWidth,lineCap:this.lineCap,lineJoin:this.lineJoin,shadowBlur:this.shadowBlur,shadowColor:this.shadowColor};}')
    source = replace_once(source,
        'save(){this.stack.push({matrix:this.matrix.slice(),clips:this.clips.slice(),style:Object.fromEntries(this.styleKeys.map(k=>[k,this[k]]))});}',
        'save(){this.stack.push({matrix:this.matrix.slice(),clips:this.clips.slice(),style:this.style()});}')
    # Canvas image commands become planar quads (possibly clipped), not volumes.
    # Exclude MeshStandardMaterial: normal-mapped hospital props are unchanged.
    anchor = "    if(this.spatial&&['ground','exits','objective'].includes(command.owner.kind))attachSight24"
    source = replace_once(source, anchor,
        "    if(command.kind==='image'&&material.isMeshBasicMaterial){material.forceSinglePass=true;material.userData.r67FlatSinglePass=true;}\n" + anchor)
    start = source.find('  label(c){')
    end = source.find('\n  render(commands){', start)
    if start < 0 or end < start or source.count('  label(c){') != 1:
        raise RuntimeError('R67 label method boundary changed')
    source = source[:start] + LABEL_METHOD + source[end:]
    source = replace_once(source,
        "if(this.disposed)throw Error('Disposed command scene');this.clearLabels();const seen=",
        "if(this.disposed)throw Error('Disposed command scene');this.labelCursorR67=0;const seen=")
    source = replace_once(source,
        '    for(const key of this.rows.keys())if(!seen.has(key))this.remove(key);',
        '    while(this.labels.length>this.labelCursorR67)this.labels.pop().remove();\n    for(const key of this.rows.keys())if(!seen.has(key))this.remove(key);')
    source = replace_once(source,
        'clearLabels(){for(const n of this.labels)n.remove();this.labels=[];}',
        'clearLabels(){for(const n of this.labels)n.remove();this.labels=[];this.labelCursorR67=0;}')
    return source

def main() -> None:
    parser=argparse.ArgumentParser()
    parser.add_argument('--site',type=Path,required=True)
    args=parser.parse_args()
    site=args.site.resolve()
    if site==(ROOT/'docs').resolve():
        raise RuntimeError('Do not modify pinned build inputs in place')
    r66=load_module('r66_for_r67',ROOT/'scripts/apply-r66.py')
    r66render=load_module('r66render_for_r67',ROOT/'scripts/render-r66.py')
    expected_html=r66.transform((ROOT/'docs/index.html').read_text(encoding='utf-8')).encode()
    expected_renderer=r66render.transform((ROOT/'docs/dist/phase1.js').read_text(encoding='utf-8')).encode()
    original_html=(site/'index.html').read_bytes()
    original_renderer=(site/'dist/phase1.js').read_bytes()
    if original_html!=expected_html or original_renderer!=expected_renderer:
        raise RuntimeError('R67 requires exact reviewed R66 bytes; input drift or duplicate application')
    manifest_path=site/'web-manifest-r62.json'
    manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
    if manifest.get('r67') or manifest.get('r66',{}).get('optimized') is not True:
        raise RuntimeError('Unexpected overlay lineage')
    html=replace_once(original_html.decode(),'dist/phase1.js?r66=1','dist/phase1.js?r67=1').encode()
    renderer=transform(original_renderer.decode()).encode()
    edits={'index.html':(original_html,html),'dist/phase1.js':(original_renderer,renderer)}
    for filename,(before,after) in edits.items():
        rows=[row for row in manifest['files'] if row['path']==filename]
        if len(rows)!=1 or rows[0]['sha256']!=digest(before) or rows[0]['bytes']!=len(before):
            raise RuntimeError('R67 manifest mismatch: '+filename)
        rows[0].update(bytes=len(after),sha256=digest(after))
    manifest['webHTMLSha256']=digest(html)
    manifest['totalBytes']=sum(row['bytes'] for row in manifest['files'])
    manifest['r67']={'revision':'R67-RENDER-PERF','baselineCommit':BASE_COMMIT,'flatUnlitSpritesSinglePass':True,'retainedTextLabels':True,'directStyleSnapshots':True,'simulationChanged':False,'mediaChanged':False,'resolutionChanged':False,'unknownMutableCanvasesStillRefreshed':True,'changedFiles':list(edits)}
    for filename,(_,after) in edits.items():
        (site/filename).write_bytes(after)
    manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('R67_OVERLAY_APPLIED',json.dumps({'htmlSHA256':digest(html),'rendererSHA256':digest(renderer),'files':len(manifest['files']),'mediaChanged':False,'simulationChanged':False}))

if __name__=='__main__':
    main()
