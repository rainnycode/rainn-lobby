# Render the model's face with an orthographic camera (pure numpy) so landmarks can be picked.
import trimesh,numpy as np,json,sys
from PIL import Image
GLB=sys.argv[1]; OUT=sys.argv[2]; YAW=float(sys.argv[3]) if len(sys.argv)>3 else 0; PITCH=float(sys.argv[4]) if len(sys.argv)>4 else 0
sc=trimesh.load(GLB,process=False); g=list(sc.geometry.values())[0]
V=g.vertices; F=g.faces; UV=g.visual.uv; N=g.vertex_normals
tex=np.asarray(g.visual.material.baseColorTexture.convert('RGB'))
TH,TW=tex.shape[:2]
sel=(V[:,1]>0.32)&(V[:,0]>0.02)
n=N[sel].mean(0); n/=np.linalg.norm(n)
fwd=-n; up0=np.array([0,1,0.]); r=np.cross(fwd,up0); r/=np.linalg.norm(r); u=np.cross(r,fwd)
def rot(v,ax,a):
  ax=ax/np.linalg.norm(ax); return v*np.cos(a)+np.cross(ax,v)*np.sin(a)+ax*(ax@v)*(1-np.cos(a))
fwd=rot(fwd,u,np.radians(YAW)); fwd=rot(fwd,r,np.radians(PITCH))
r=np.cross(fwd,up0); r/=np.linalg.norm(r); u=np.cross(r,fwd)
P=np.stack([V@r, V@u, -(V@fwd)],1)   # x,y, depth (bigger = closer)
c=V[sel].mean(0); cx,cy=c@r,c@u; half=0.13; R=700
def to_px(p): return np.stack([(p[:,0]-cx+half)/(2*half)*R, (half-(p[:,1]-cy))/(2*half)*R],1)
S2=to_px(P); Z=P[:,2]
img=np.full((R,R,3),40,np.uint8); zb=np.full((R,R),-1e9)
for f in F:
  if V[f,1].min()<0.15: continue
  a,b,cc=S2[f]; xs=[a[0],b[0],cc[0]]; ys=[a[1],b[1],cc[1]]
  x0,x1=int(max(0,min(xs))),int(min(R-1,max(xs))+1); y0,y1=int(max(0,min(ys))),int(min(R-1,max(ys))+1)
  if x1<=x0 or y1<=y0: continue
  gx,gy=np.meshgrid(np.arange(x0,x1)+.5,np.arange(y0,y1)+.5)
  d=(b[1]-cc[1])*(a[0]-cc[0])+(cc[0]-b[0])*(a[1]-cc[1])
  if abs(d)<1e-9: continue
  w0=((b[1]-cc[1])*(gx-cc[0])+(cc[0]-b[0])*(gy-cc[1]))/d; w1=((cc[1]-a[1])*(gx-cc[0])+(a[0]-cc[0])*(gy-cc[1]))/d; w2=1-w0-w1
  m=(w0>=0)&(w1>=0)&(w2>=0)
  if not m.any(): continue
  z=w0*Z[f[0]]+w1*Z[f[1]]+w2*Z[f[2]]
  uv=w0[...,None]*UV[f[0]]+w1[...,None]*UV[f[1]]+w2[...,None]*UV[f[2]]
  ys_,xs_=np.nonzero(m); Y=ys_+y0; X=xs_+x0; zz=z[m]
  ok=zz>zb[Y,X]; Y,X=Y[ok],X[ok]; zb[Y,X]=zz[ok]
  uu=uv[m][ok]; tx=np.clip((uu[:,0]%1)*TW,0,TW-1).astype(int); ty=np.clip((1-(uu[:,1]%1))*TH,0,TH-1).astype(int)
  img[Y,X]=tex[ty,tx]
Image.fromarray(img).save(OUT)
json.dump({'r':r.tolist(),'u':u.tolist(),'fwd':fwd.tolist(),'cx':cx,'cy':cy,'half':half,'R':R},open(OUT+'.json','w'))
print('ok',n)
