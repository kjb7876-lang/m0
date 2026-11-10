# mkart.py 가 만든 그림 표(art*.json)를 client-source/rooms-r523.js 의 /*ART*/ … /*ART*/ 사이에 넣는다.
#  쓰기: python3 apply-art.py art1.json art2.json   (그 뒤 runtime-text/rooms-r523.js 로 복사하고 sync·빌드)
import json,sys,re,os
P=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','client-source','rooms-r523.js'))
src=open(P,encoding='utf-8').read();art={}
for f in sys.argv[1:]: art.update(json.load(open(f)))
def js(v):
    if isinstance(v,dict): return '{'+','.join(k+':'+js(x) for k,x in v.items())+'}'
    if isinstance(v,list): return '['+','.join(js(x) for x in v)+']'
    if isinstance(v,bool): return 'true' if v else 'false'
    if isinstance(v,str): return "'"+v+"'"
    return repr(v).rstrip('0').rstrip('.') if isinstance(v,float) and v==v else repr(v)
body='/*ART*/{\n'+',\n'.join(' '+k+':'+js(v) for k,v in art.items())+'\n}/*ART*/'
out,n=re.subn(r'/\*ART\*/.*?/\*ART\*/',lambda m:body,src,flags=re.S)
assert n==1,'ART 표 자리를 찾지 못함'
open(P,'w',encoding='utf-8').write(out);print(len(out),'bytes',len(art),'arts')
