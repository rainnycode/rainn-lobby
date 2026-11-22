# Read / replace the baseColor texture inside a GLB, keeping everything else byte-identical.
import json,struct,io
def read(path):
  raw=open(path,'rb').read(); jl=struct.unpack_from('<I',raw,12)[0]; J=json.loads(raw[20:20+jl]); bo=20+jl; bl=struct.unpack_from('<I',raw,bo)[0]
  return J, raw[bo+8:bo+8+bl]
def base_image_index(J):
  m=J['materials'][J['meshes'][0]['primitives'][0]['material']]; t=m['pbrMetallicRoughness']['baseColorTexture']['index']; return J['textures'][t]['source']
def get_image(J,B,img):
  bv=J['bufferViews'][J['images'][img]['bufferView']]; o=bv.get('byteOffset',0); return B[o:o+bv['byteLength']]
def write(path,J,B,replace):  # replace: {image_index: (bytes, mime)}
  views=J['bufferViews']; repl_views={J['images'][i]['bufferView']:(d,m) for i,(d,m) in replace.items()}
  out=bytearray()
  for k,bv in enumerate(views):
    o=bv.get('byteOffset',0); data=repl_views[k][0] if k in repl_views else B[o:o+bv['byteLength']]
    while len(out)%4: out.append(0)
    bv['byteOffset']=len(out); bv['byteLength']=len(data); out+=data
  for i,(d,m) in replace.items(): J['images'][i]['mimeType']=m
  while len(out)%4: out.append(0)
  J['buffers'][0]['byteLength']=len(out)
  js=json.dumps(J).encode(); js+=b' '*((4-len(js)%4)%4)
  open(path,'wb').write(struct.pack('<III',0x46546C67,2,12+8+len(js)+8+len(out))+struct.pack('<II',len(js),0x4E4F534A)+js+struct.pack('<II',len(out),0x004E4942)+bytes(out))
