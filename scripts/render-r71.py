"""R71 material-only readability treatment for compiled region surfaces.

The overlay leaves source maps and every geometry/UV/collision record intact.
It assigns a restrained per-theme tint to existing floor, wall, cap, edge and
background materials, and exposes the active colors/luminance in spatial
diagnostics. No work is added to the frame loop.
"""


def once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'R71 renderer source drift ({label}): found {count} anchors')
    return source.replace(old, new, 1)


PALETTE_HELPERS = r'''const REGIONAL_MAP_PALETTES_R71=Object.freeze({
 forest:Object.freeze({floor:0xc2b48f,wall:0x747864,cap:0xb3a581,edge:0x44483d,background:0x626b63}),
 cave:Object.freeze({floor:0xaeb3c0,wall:0x6f7281,cap:0x989eab,edge:0x3f424e,background:0x666d7b}),
 swamp:Object.freeze({floor:0xb5ab84,wall:0x6d7059,cap:0xa59f76,edge:0x42483a,background:0x5b655c}),
 ruin:Object.freeze({floor:0xb8a8ac,wall:0x74616c,cap:0xaa9499,edge:0x4d3d47,background:0x625460}),
 cathedral:Object.freeze({floor:0xc0b4ad,wall:0x75616b,cap:0xad9ba0,edge:0x483b46,background:0x6e5b68}),
 city:Object.freeze({floor:0xbbb0a4,wall:0x6b625d,cap:0xaa9c8d,edge:0x463e3a,background:0x615752}),
 hospital:Object.freeze({floor:0xccd0ca,wall:0x818b8d,cap:0xadb8b5,edge:0x4c5859,background:0x747e82}),
 hotel:Object.freeze({floor:0xc3b5a3,wall:0x776858,cap:0xad9d88,edge:0x4a4137,background:0x6a5e52}),
 machine:Object.freeze({floor:0xb2bdc1,wall:0x6b7a80,cap:0x98a7ac,edge:0x3e4b50,background:0x5c7076}),
 time:Object.freeze({floor:0xb3bdc2,wall:0x6f7c83,cap:0x9aa8ad,edge:0x414c52,background:0x65747b}),
 regional:Object.freeze({floor:0xbab4aa,wall:0x74726c,cap:0xaaa397,edge:0x454441,background:0x62666a})
});
function mapPaletteR71(theme){return REGIONAL_MAP_PALETTES_R71[theme]||REGIONAL_MAP_PALETTES_R71.regional;}
function colorHexR71(material){const value=material?.color?.getHexString?.();return typeof value==='string'?'#'+value:null;}
function colorLuminanceR71(hex){if(!/^#[0-9a-f]{6}$/i.test(hex||''))return null;const linear=n=>{const v=parseInt(n,16)/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;};return .2126*linear(hex.slice(1,3))+.7152*linear(hex.slice(3,5))+.0722*linear(hex.slice(5,7));}
function contrastRatioR71(a,b){const x=colorLuminanceR71(a),y=colorLuminanceR71(b);return x===null||y===null?null:(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function applyMapReadabilityR71(renderer,art){
 const theme=art?.theme||'regional',p=mapPaletteR71(theme),set=(material,color)=>{if(material?.color?.setHex)material.color.setHex(color);};
 set(renderer.stoneMaterial,p.floor);set(renderer.wallMaterial,p.wall);set(renderer.backgroundMaterial,p.background);
 set(renderer.wallCapMaterial61,p.cap);set(renderer.regionalTrimMaterial55,p.edge);
 for(const material of renderer.visualFloorMaterials||[]){set(material,p.floor);if(material?.emissive?.setHex)material.emissive.setHex(p.floor);}
 set(renderer.hospitalWallMaterial,p.wall);set(renderer.visualWardMaterial,p.background);
 const colors={floor:colorHexR71(renderer.stoneMaterial),wall:colorHexR71(renderer.wallMaterial),cap:colorHexR71(renderer.wallCapMaterial61||renderer.stoneMaterial),edge:colorHexR71(renderer.regionalTrimMaterial55||renderer.wallMaterial),background:colorHexR71(renderer.backgroundMaterial),hospitalFloor:colorHexR71(renderer.visualFloorMaterial||null),hospitalWall:colorHexR71(renderer.hospitalWallMaterial)};
 const luminance=Object.fromEntries(Object.entries(colors).map(([key,value])=>[key,colorLuminanceR71(value)]));
 renderer.mapReadabilityR71={revision:'regional-material-roles-r71',theme,colors,luminance,contrast:{floorToWall:contrastRatioR71(colors.floor,colors.wall),capToWall:contrastRatioR71(colors.cap,colors.wall),wallToEdge:contrastRatioR71(colors.wall,colors.edge),floorToBackground:contrastRatioR71(colors.floor,colors.background)},sourceAsset:art?.path||null,materialsOnly:true,threeOnly:true,legacyFallbackPaletteApplied:false,geometryChanged:false,assetsChanged:false,flashlightMaskPreserved:true,pixelVerified:false,GPUVerified:false};
 return renderer.mapReadabilityR71;
}
'''


def transform(renderer_string: str) -> str:
    source = once(
        renderer_string,
        'function configureRegionalWallFinish61(renderer,art){',
        PALETTE_HELPERS + '\nfunction configureRegionalWallFinish61(renderer,art){',
        'palette helper insertion',
    )
    source = once(
        source,
        'if(source.r55PhysicalUV)configureRegionalWallFinish61(this,source);for(const material',
        'if(source.r55PhysicalUV)configureRegionalWallFinish61(this,source);this.mapReadabilitySourceR71=source;applyMapReadabilityR71(this,source);for(const material',
        'initial map material application',
    )
    source = once(
        source,
        'this.visualFloorMaterials=[this.visualFloorMaterial,blood];for(const m of this.visualFloorMaterials)attachSight24(m,this.sightState24);',
        'this.visualFloorMaterials=[this.visualFloorMaterial,blood];for(const m of this.visualFloorMaterials)attachSight24(m,this.sightState24);applyMapReadabilityR71(this,this.mapReadabilitySourceR71);',
        'hospital floor material update',
    )
    source = once(
        source,
        'this.spatialResources.add(this.hospitalWallMaterial);',
        'this.spatialResources.add(this.hospitalWallMaterial);applyMapReadabilityR71(this,this.mapReadabilitySourceR71);',
        'hospital wall material update',
    )
    source = once(
        source,
        'attachSight24(this.visualWardMaterial,this.sightState24);this.spatialResources.add(this.visualWardMaterial);',
        'attachSight24(this.visualWardMaterial,this.sightState24);this.spatialResources.add(this.visualWardMaterial);applyMapReadabilityR71(this,this.mapReadabilitySourceR71);',
        'hospital backing material update',
    )
    source = once(
        source,
        "collisionStructures:'authored exploration wall AABBs; decorative background rim excluded from collision'};}",
        "collisionStructures:'authored exploration wall AABBs; decorative background rim excluded from collision',mapReadabilityR71:this.mapReadabilityR71||null};}",
        'map readability diagnostics',
    )
    source = once(
        source,
        'window.StoryPhase1=Object.freeze({wallCapArt61,',
        'window.StoryPhase1=Object.freeze({mapPaletteR71,applyMapReadabilityR71,wallCapArt61,',
        'public pure palette API',
    )
    source = once(
        source,
        'this.wallCapMaterial61=null;this.regionalDetails55=null;',
        'this.wallCapMaterial61=null;this.mapReadabilitySourceR71=null;this.mapReadabilityR71=null;this.regionalDetails55=null;',
        'map diagnostic teardown',
    )
    return source


def transform_html(html: str) -> str:
    return once(html, 'dist/phase1.js?r70=1', 'dist/phase1.js?r71=1', 'renderer cache key')
