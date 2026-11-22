# Project a photo of the face onto the model's baseColor texture.
import sys,json,io,numpy as np,trimesh
from PIL import Image,ImageOps,ImageFilter
sys.path.insert(0,sys.argv[1]); import glbtex
GLB,PHOTO,OUT,YAW,PITCH=sys.argv[2],sys.argv[3],sys.argv[4],float(sys.argv[5]),float(sys.argv[6])
CROP=(1100,950)
# landmarks: model view px (700 render) -> photo crop px
L=json.loads(sys.argv[7])
sc=trimesh.load(GLB,process=False); g=list(sc.geometry.values())[0]
V=g.vertices; F=g.faces; UV=g.visual.uv; N=g.vertex_normals
J,B=glbtex.read(GLB); bi=glbtex.base_image_index(J)
tex=np.asarray(Image.open(io.BytesIO(glbtex.get_image(J,B,bi))).convert('RGB')).astype(np.float32); TH,TW=tex.shape[:2]
photo=np.asarray(ImageOps.exif_transpose(Image.open(PHOTO)).convert('RGB')).astype(np.float32)
# camera (same as facecam.py)
sel=(V[:,1]>0.32)&(V[:,0]>0.02); n=N[sel].mean(0); n/=np.linalg.norm(n)
up0=np.array([0,1,0.]); fwd=-n; r=np.cross(fwd,up0); r/=np.linalg.norm(r); u=np.cross(r,fwd)
def rot(v,ax,a): ax=ax/np.linalg.norm(ax); return v*np.cos(a)+np.cross(ax,v)*np.sin(a)+ax*(ax@v)*(1-np.cos(a))
fwd=rot(fwd,u,np.radians(YAW)); fwd=rot(fwd,r,np.radians(PITCH)); r=np.cross(fwd,up0); r/=np.linalg.norm(r); u=np.cross(r,fwd)
c=V[sel].mean(0); cx,cy=c@r,c@u; half=0.13; R=700
def scr(P): return np.stack([((P@r)-cx+half)/(2*half)*R,(half-((P@u)-cy))/(2*half)*R],-1)
depth=lambda P:-(P@fwd)
# z-buffer of the view (for occlusion)
S2=scr(V); Z=depth(V); zb=np.full((R,R),-1e9)
for f in F:
  if V[f,1].min()<0.15: continue
  a,b,cc=S2[f]; x0,x1=int(max(0,min(a[0],b[0],cc[0]))),int(min(R-1,max(a[0],b[0],cc[0]))+1); y0,y1=int(max(0,min(a[1],b[1],cc[1]))),int(min(R-1,max(a[1],b[1],cc[1]))+1)
  if x1<=x0 or y1<=y0: continue
  gx,gy=np.meshgrid(np.arange(x0,x1)+.5,np.arange(y0,y1)+.5); d=(b[1]-cc[1])*(a[0]-cc[0])+(cc[0]-b[0])*(a[1]-cc[1])
  if abs(d)<1e-12: continue
  w0=((b[1]-cc[1])*(gx-cc[0])+(cc[0]-b[0])*(gy-cc[1]))/d; w1=((cc[1]-a[1])*(gx-cc[0])+(a[0]-cc[0])*(gy-cc[1]))/d; w2=1-w0-w1; m=(w0>=0)&(w1>=0)&(w2>=0)
  z=w0*Z[f[0]]+w1*Z[f[1]]+w2*Z[f[2]]; ys,xs=np.nonzero(m); zz=z[m]; Y,X=ys+y0,xs+x0; ok=zz>zb[Y,X]; zb[Y[ok],X[ok]]=zz[ok]
zb=np.maximum(zb, np.asarray(Image.fromarray(zb.astype(np.float32)).filter(ImageFilter.MaxFilter(5))))
# affine fit model px -> photo px
A=np.array([[p[0],p[1],1] for p,q in L]); Bq=np.array([q for p,q in L],float)
M,res,_,_=np.linalg.lstsq(A,Bq,rcond=None); print('fit residual px',np.sqrt(((A@M-Bq)**2).sum(1)).round(1))
# face mask in view px: ellipse + below wrap edge
E=json.loads(sys.argv[8])  # {cx,cy,rx,ry,wrap_y}
out=tex.copy(); wsum=np.zeros((TH,TW),np.float32); acc=np.zeros((TH,TW,3),np.float32)
for f in F:
  P3=V[f]
  if P3[:,1].min()<0.2: continue
  t=UV[f].copy(); t[:,0]=(t[:,0]%1)*TW; t[:,1]=(1-(t[:,1]%1))*TH
  x0,x1=int(max(0,t[:,0].min())),int(min(TW-1,t[:,0].max())+1); y0,y1=int(max(0,t[:,1].min())),int(min(TH-1,t[:,1].max())+1)
  if x1<=x0 or y1<=y0: continue
  a,b,cc=t; gx,gy=np.meshgrid(np.arange(x0,x1)+.5,np.arange(y0,y1)+.5); d=(b[1]-cc[1])*(a[0]-cc[0])+(cc[0]-b[0])*(a[1]-cc[1])
  if abs(d)<1e-9: continue
  w0=((b[1]-cc[1])*(gx-cc[0])+(cc[0]-b[0])*(gy-cc[1]))/d; w1=((cc[1]-a[1])*(gx-cc[0])+(a[0]-cc[0])*(gy-cc[1]))/d; w2=1-w0-w1
  m=(w0>=-.02)&(w1>=-.02)&(w2>=-.02)
  if not m.any(): continue
  W=np.stack([w0[m],w1[m],w2[m]],1); P=W@P3; Nn=W@N[f]; Nn/=np.linalg.norm(Nn,axis=1,keepdims=True)
  facing=np.clip((Nn@(-fwd)-0.15)/0.35,0,1)
  sp=scr(P); xi=np.clip(sp[:,0].astype(int),0,R-1); yi=np.clip(sp[:,1].astype(int),0,R-1)
  vis=(depth(P)>=zb[yi,xi]-0.004).astype(np.float32)
  ex=((sp[:,0]-E['cx'])/E['rx'])**2+((sp[:,1]-E['cy'])/E['ry'])**2; em=np.clip((1-ex)/0.35,0,1)
  wm=np.clip((sp[:,1]-E['wrap_y'])/18,0,1)*np.clip((sp[:,0]-E['xmin'])/30,0,1)*np.clip((E['xmax']-sp[:,0])/40,0,1)
  w=facing*vis*em*wm
  if w.max()<=0: continue
  q=np.c_[sp,np.ones(len(sp))]@M; px=q[:,0]+CROP[0]; py=q[:,1]+CROP[1]
  px=np.clip(px,0,photo.shape[1]-2); py=np.clip(py,0,photo.shape[0]-2)
  ix,iy=px.astype(int),py.astype(int); fx,fy=(px-ix)[:,None],(py-iy)[:,None]
  col=photo[iy,ix]*(1-fx)*(1-fy)+photo[iy,ix+1]*fx*(1-fy)+photo[iy+1,ix]*(1-fx)*fy+photo[iy+1,ix+1]*fx*fy
  ys,xs=np.nonzero(m); Y,X=ys+y0,xs+x0
  acc[Y,X]=col*w[:,None]; wsum[Y,X]=w
mask=wsum>0
# match the photo's skin tone to the model around the face edge (keeps detail, avoids a visible border)
ring=(wsum>0.02)&(wsum<0.5); core=wsum>0.8
pc=acc[core]/wsum[core][:,None]; tc=tex[ring]
if len(pc)>50 and len(tc)>50:
  gain=tc.mean(0)/np.maximum(pc.mean(0),1); gain=1+(gain-1)*float(sys.argv[9]); print('tone gain',gain.round(3))
else: gain=np.ones(3)
colp=np.where(mask[...,None],acc/np.maximum(wsum,1e-6)[...,None]*gain,0)
out=tex*(1-wsum[...,None])+np.clip(colp,0,255)*wsum[...,None]
fc=(np.clip(colp,0,255)[core]).mean(0)
hsv=np.asarray(Image.fromarray(tex.astype(np.uint8)).convert('HSV')).astype(np.float32)/255
skin=(hsv[...,0]>0.02)&(hsv[...,0]<0.11)&(hsv[...,1]>0.38)&(hsv[...,2]>0.45)&(wsum<0.05)
sk=tex[skin].mean(0); sg=1+(fc/sk-1)*float(sys.argv[10]); print('skin texels',skin.sum(),'skin gain',sg.round(3))
soft=np.asarray(Image.fromarray((skin*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32)/255
out=out*(1-soft[...,None])+np.clip(out*sg,0,255)*soft[...,None]
Image.fromarray((soft*255).astype(np.uint8)).save(OUT+'.skin.png')
img=Image.fromarray(out.clip(0,255).astype(np.uint8)); buf=io.BytesIO(); img.save(buf,'PNG',optimize=True)
Image.fromarray((wsum*255).astype(np.uint8)).save(OUT+'.mask.png')
glbtex.write(OUT,J,B,{bi:(buf.getvalue(),'image/png')}); print('ok', mask.sum())
