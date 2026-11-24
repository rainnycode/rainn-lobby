# Construye rainn-hd.glb desde el modelo de Tripo: quita la tela suelta de atrás, aplana su raíz contra el wrap
# (sin hueco), y agrega el atributo _FACE (zona de la cara) para las sombras estilo anime del shader.
import sys,io,json,base64,numpy as np,trimesh
from trimesh import graph
from PIL import Image
sys.path.insert(0,sys.argv[1]); import glbtex
S,OUT=sys.argv[2],sys.argv[3]
J,B=glbtex.read(S); B=bytearray(B)
prim=J['meshes'][0]['primitives'][0]
pa=J['accessors'][prim['attributes']['POSITION']]; pv=J['bufferViews'][pa['bufferView']]; po=pv.get('byteOffset',0)+pa.get('byteOffset',0)
pos=np.frombuffer(bytes(B[po:po+pa['count']*12]),np.float32).reshape(-1,3).copy()
ia=J['accessors'][prim['indices']]; iv=J['bufferViews'][ia['bufferView']]
dt={5123:np.uint16,5125:np.uint32}[ia['componentType']]
idx=np.frombuffer(bytes(B[iv.get('byteOffset',0)+ia.get('byteOffset',0):]),dt,ia['count']).reshape(-1,3)
m=trimesh.Trimesh(pos,idx,process=False); m.merge_vertices(merge_tex=True,merge_norm=True)
cc=graph.connected_components(m.face_adjacency,nodes=np.arange(len(idx)),min_len=1)
cut=np.zeros(len(idx),bool); headv=np.zeros(len(pos),bool)
for comp in cc:
  vi=np.unique(idx[comp].reshape(-1)); v=pos[vi]; lo,hi=v.min(0),v.max(0); n=len(comp)
  if hi[1]>.2 and lo[0]<-.15 and n<1000: cut[comp]=True              # loose tail / knot
  if lo[1]>.21 and n>5000: headv[vi]=True
# flatten the tail root onto the back of the wrap instead of deleting it (no hole)
root=headv&(pos[:,0]<-.175)&(pos[:,1]>.37); pos[root,0]=-.175-(pos[root,0]+.175)*.08
def sm(a,b,x): x=np.clip((x-a)/(b-a),0,1); return x*x*(3-2*x)
face=(headv*sm(-.11,-.05,pos[:,0])*(1-sm(.37,.39,pos[:,1]))).astype(np.float32)
B[po:po+pa['count']*12]=pos.astype(np.float32).tobytes()
keep=~cut; new=idx[keep].astype(np.uint32).tobytes()
def add_view(data,target=None):
  while len(B)%4: B.append(0)
  off=len(B); B.extend(data); v={'buffer':0,'byteOffset':off,'byteLength':len(data)}
  if target: v['target']=target
  J['bufferViews'].append(v); return len(J['bufferViews'])-1
J['accessors'].append({'bufferView':add_view(new,34963),'componentType':5125,'count':int(keep.sum()*3),'type':'SCALAR'}); prim['indices']=len(J['accessors'])-1
J['accessors'].append({'bufferView':add_view(face.tobytes(),34962),'componentType':5126,'count':len(face),'type':'SCALAR'}); prim['attributes']['_FACE']=len(J['accessors'])-1
rep={}
for i,im in enumerate(J['images']):
  sz=2048 if i==glbtex.base_image_index(J) else 1024; img=Image.open(io.BytesIO(glbtex.get_image(J,bytes(B),i))).convert('RGB').resize((sz,sz),Image.LANCZOS)
  buf=io.BytesIO(); img.save(buf,'JPEG',quality=88); rep[i]=(buf.getvalue(),'image/jpeg')
glbtex.write(OUT,J,bytes(B),rep); print('cut',cut.sum(),'root verts',root.sum(),'face verts',(face>0).sum())
