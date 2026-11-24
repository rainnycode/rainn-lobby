# Oscurece en la textura solo la cara de rainn (pieza de la cabeza, mitad del frente, debajo del wrap).
import sys,io,json,base64,numpy as np,trimesh
from trimesh import graph
from PIL import Image,ImageDraw,ImageFilter
sys.path.insert(0,sys.argv[1]); import glbtex
src,dst,k=sys.argv[2],sys.argv[3],float(sys.argv[4])
sc=trimesh.load(src,process=False); g=list(sc.geometry.values())[0]
V,F,UV=g.vertices,g.faces,g.visual.uv
m=g.copy(); m.merge_vertices(merge_tex=True,merge_norm=True)
cc=graph.connected_components(m.face_adjacency,nodes=np.arange(len(F)),min_len=1)
head=[c for c in cc if len(c)>5000 and V[F[c].reshape(-1)][:,1].min()>.2][0]
c=V[F[head]].mean(1)
def sm(a,b,x): x=np.clip((x-a)/(b-a),0,1); return x*x*(3-2*x)
wt=sm(-.13,-.06,c[:,0])*(1-sm(.37,.40,c[:,1])); sel=np.array(head)[wt>0.01]; wsel=wt[wt>0.01]
J,B=glbtex.read(dst if dst!=src else src); bi=glbtex.base_image_index(J)
tex=Image.open(io.BytesIO(glbtex.get_image(J,B,bi))).convert('RGB'); W,H=tex.size
mask=Image.new('L',(W,H),0); d=ImageDraw.Draw(mask)
order=np.argsort(wsel)
for f,w in zip(sel[order],wsel[order]):
  t=UV[F[f]]; d.polygon([(u%1*W,(1-v%1)*H) for u,v in t],fill=int(255*w))
mask=mask.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(3))
a=np.asarray(tex).astype(np.float32); mk=np.asarray(mask).astype(np.float32)[...,None]/255
out=a*(1-mk*(1-k))
buf=io.BytesIO(); Image.fromarray(out.clip(0,255).astype(np.uint8)).save(buf,'JPEG',quality=88)
glbtex.write(dst,J,B,{bi:(buf.getvalue(),'image/jpeg')}); print('face faces',len(sel))
