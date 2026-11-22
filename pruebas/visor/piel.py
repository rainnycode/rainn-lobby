# Baja el naranja/brillo de la piel en la textura del GLB (todo lo demás queda igual).
import sys,io,numpy as np
from PIL import Image,ImageFilter
sys.path.insert(0,sys.argv[1]); import glbtex
src,dst=sys.argv[2],sys.argv[3]
J,B=glbtex.read(src); bi=glbtex.base_image_index(J)
im=Image.open(io.BytesIO(glbtex.get_image(J,B,bi))).convert('RGB')
hsv=np.asarray(im.convert('HSV')).astype(np.float32)
h,s,v=hsv[...,0]/255,hsv[...,1]/255,hsv[...,2]/255
skin=(h>0.02)&(h<0.11)&(s>0.38)&(v>0.45)
soft=np.asarray(Image.fromarray((skin*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))).astype(np.float32)/255
s2=s*(1-0.22*soft); v2=v*(1-0.06*soft)
out=Image.fromarray(np.stack([hsv[...,0],s2*255,v2*255],-1).clip(0,255).astype(np.uint8),'HSV').convert('RGB')
buf=io.BytesIO(); out.save(buf,'JPEG',quality=90)
glbtex.write(dst,J,B,{bi:(buf.getvalue(),'image/jpeg')}); print('skin px',int(skin.sum()))
