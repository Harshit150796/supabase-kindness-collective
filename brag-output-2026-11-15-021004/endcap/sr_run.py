"""Upscale a folder of frames with the Real-ESRGAN ONNX graph: x4, then Lanczos down to the delivery width.
Resumable (skips frames already written). Usage: python3 -I sr_run.py <model.onnx> <in_dir> <out_dir> <worker> <workers> <threads> <out_w>"""
import sys, os, time, numpy as np, onnxruntime as ort
from PIL import Image
mp, ind, outd, k, n, th, ow = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5]), int(sys.argv[6]), int(sys.argv[7])
so = ort.SessionOptions(); so.intra_op_num_threads = th; so.inter_op_num_threads = 1
s = ort.InferenceSession(mp, so, providers=['CPUExecutionProvider'])
files = sorted(f for f in os.listdir(ind) if f.endswith('.png'))[k::n]
os.makedirs(outd, exist_ok=True)
t0 = time.time(); done = 0
for f in files:
    o = os.path.join(outd, f)
    if os.path.exists(o):
        continue
    im = np.asarray(Image.open(os.path.join(ind, f)).convert('RGB'), np.float32) / 255
    y = s.run(None, {'input': im.transpose(2, 0, 1)[None]})[0][0]
    up = Image.fromarray((np.clip(y.transpose(1, 2, 0), 0, 1) * 255 + 0.5).astype(np.uint8))
    oh = round(up.height * ow / up.width / 2) * 2
    up.resize((ow, oh), Image.LANCZOS).save(o + '.tmp.png', compress_level=1)
    os.replace(o + '.tmp.png', o)
    done += 1
    if done % 25 == 0:
        print(f'worker {k}: {done}/{len(files)} {(time.time() - t0) / done:.2f}s/frame', flush=True)
print(f'worker {k} finished {done}', flush=True)
