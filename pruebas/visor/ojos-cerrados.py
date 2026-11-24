# Pinta párpados cerrados sobre los ojos de rainn en la textura (posiciones medidas en una vista frontal ortográfica).
import sys,io,numpy as np,trimesh
from PIL import Image,ImageFilter
sys.path.insert(0,sys.argv[1]); import glbtex
GLB=sys.argv[2]; ZB=np.load(sys.argv[3])
Z0,Y0,HALF,R=0.0,.32,.09,800
EYES=[(290,207,78,24),(545,190,74,24)]   # cx, cy, rx, ry in front-view px
g=list(trimesh.load(GLB,process=False).geometry.values())[0]; V,F,UV=g.vertices,g.faces,g.visual.uv
J,B=glbtex.read(GLB); bi=glbtex.base_image_index(J)
tex=np.asarray(Image.open(io.BytesIO(glbtex.get_image(J,B,bi))).convert('RGB')).astype(np.float32); TH,TW=tex.shape[:2]
def scr(P): return np.stack([(Z0-P[...,2]+HALF)/(2*HALF)*R,(Y0-P[...,1]+HALF)/(2*HALF)*R],-1)
out=tex.copy(); hit=np.zeros((TH,TW),bool); sk_acc=[[],[]]
lid=np.zeros((TH,TW),np.float32); lash=np.zeros((TH,TW),np.float32); skin=np.zeros((TH,TW,3),np.float32)
for f in F:
  P=V[f]
  if P[:,1].min()<.22 or P[:,0].max()<-.06: continue
  s=scr(P)
  if not any(abs(s[:,0].mean()-e[0])<e[2]*1.6 and abs(s[:,1].mean()-e[1])<e[3]*3 for e in EYES): continue
  t=UV[f].copy(); t[:,0]=(t[:,0]%1)*TW; t[:,1]=(1-(t[:,1]%1))*TH
  x0,x1=int(max(0,t[:,0].min())),int(min(TW-1,t[:,0].max())+1); y0,y1=int(max(0,t[:,1].min())),int(min(TH-1,t[:,1].max())+1)
  if x1<=x0 or y1<=y0: continue
  a,b,c=t; gx,gy=np.meshgrid(np.arange(x0,x1)+.5,np.arange(y0,y1)+.5); d=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
  if abs(d)<1e-12: continue
  w0=((b[1]-c[1])*(gx-c[0])+(c[0]-b[0])*(gy-c[1]))/d; w1=((c[1]-a[1])*(gx-c[0])+(a[0]-c[0])*(gy-c[1]))/d; w2=1-w0-w1; m=(w0>=-.02)&(w1>=-.02)&(w2>=-.02)
  if not m.any(): continue
  W=np.stack([w0[m],w1[m],w2[m]],1); Q=W@P; sp=scr(Q)
  xi=np.clip(sp[:,0].astype(int),0,R-1); yi=np.clip(sp[:,1].astype(int),0,R-1); vis=Q[:,0]>=ZB[yi,xi]-.004
  ys,xs=np.nonzero(m); Y,X=ys+y0,xs+x0
  for e in EYES:
    dx=(sp[:,0]-e[0])/e[2]; dy=(sp[:,1]-e[1])/e[3]
    r=dx*dx+dy*dy; wl=np.clip((1.15-r)/.3,0,1)*vis        # lid (soft edge)
    curve=e[1]+5*(1-dx*dx)                                   # closed-lid line, bowed slightly down
    dl=np.abs(sp[:,1]-curve); wa=np.clip((3.2-dl)/1.6,0,1)*np.clip((1-np.abs(dx))/.12,0,1)*vis*(np.abs(dx)<1.02)
    lid[Y,X]=np.maximum(lid[Y,X],wl); lash[Y,X]=np.maximum(lash[Y,X],wa)
    below=vis&(dy>2.2)&(dy<3.4)&(np.abs(dx)<.7)
    if below.any(): sk_acc[EYES.index(e)].append(tex[Y[below],X[below]])
lid=np.asarray(Image.fromarray((lid*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1))).astype(np.float32)/255
lash=np.asarray(Image.fromarray((lash*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.7))).astype(np.float32)/255
cols=[np.concatenate(a).mean(0) if a else np.array([150,105,85.]) for a in sk_acc]
skc=np.mean(cols,0)*np.array([.92,.9,.9])   # lids a touch darker than the cheek
noise=(np.random.RandomState(3).rand(TH,TW,1)-.5)*8
lidc=np.clip(skc+noise,0,255)
o=out*(1-lid[...,None])+lidc*lid[...,None]
o=o*(1-lash[...,None]*.85)+np.array([38,26,22.])*lash[...,None]*.85
buf=io.BytesIO(); Image.fromarray(o.clip(0,255).astype(np.uint8)).save(buf,'JPEG',quality=90)
glbtex.write(GLB,J,B,{bi:(buf.getvalue(),'image/jpeg')}); print('lid texels',int((lid>0).sum()),'skin',np.round(skc))
