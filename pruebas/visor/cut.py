# Quita piezas sueltas de un GLB reescribiendo solo los índices (no toca texturas ni normales).
import json,struct,sys,numpy as np,trimesh
from trimesh import graph
src,dst=sys.argv[1],sys.argv[2]
raw=open(src,'rb').read()
jl=struct.unpack_from('<I',raw,12)[0]; J=json.loads(raw[20:20+jl]); bo=20+jl; bl=struct.unpack_from('<I',raw,bo)[0]; B=bytearray(raw[bo+8:bo+8+bl])
prim=J['meshes'][0]['primitives'][0]; acc=J['accessors'][prim['indices']]; bv=J['bufferViews'][acc['bufferView']]
dt={5123:np.uint16,5125:np.uint32}[acc['componentType']]
idx=np.frombuffer(bytes(B),dt,acc['count'],bv.get('byteOffset',0)+acc.get('byteOffset',0)).reshape(-1,3)
pa=J['accessors'][prim['attributes']['POSITION']]; pv=J['bufferViews'][pa['bufferView']]
pos=np.frombuffer(bytes(B),np.float32,pa['count']*3,pv.get('byteOffset',0)+pa.get('byteOffset',0)).reshape(-1,3)
m=trimesh.Trimesh(pos,idx,process=False); m.merge_vertices(merge_tex=True,merge_norm=True)
keep=np.ones(len(idx),bool)
for c in graph.connected_components(m.face_adjacency,nodes=np.arange(len(idx)),min_len=1):
  v=m.vertices[m.faces[c].reshape(-1)]; lo,hi=v.min(0),v.max(0)
  if (hi[0]<-0.1 and lo[1]>0.15) or (hi[1]<-0.15 and lo[0]<-0.3): keep[c]=False; print('quito',len(c))
new=idx[keep].astype(np.uint32).tobytes()
while len(B)%4: B.append(0)
off=len(B); B+=new
J['bufferViews'].append({'buffer':0,'byteOffset':off,'byteLength':len(new),'target':34963})
J['accessors'].append({'bufferView':len(J['bufferViews'])-1,'componentType':5125,'count':int(keep.sum()*3),'type':'SCALAR'})
prim['indices']=len(J['accessors'])-1
while len(B)%4: B.append(0)
J['buffers'][0]['byteLength']=len(B)
js=json.dumps(J).encode(); js+=b' '*((4-len(js)%4)%4)
out=struct.pack('<III',0x46546C67,2,12+8+len(js)+8+len(B))+struct.pack('<II',len(js),0x4E4F534A)+js+struct.pack('<II',len(B),0x004E4942)+B
open(dst,'wb').write(out); print('caras',int(keep.sum()),'bytes',len(out))
