"""Rebuild Real-ESRGAN's realesr-general-x4v3 (SRVGGNetCompact: 64 features, 32 convs, PReLU, x4 pixel shuffle) as an
ONNX graph from the published .pth weights, without torch. DN blends the denoising model with the no-denoise one
(Real-ESRGAN's own "denoise strength"). Usage: python3 -I build_onnx.py <x4v3.pth> <wdn.pth> <dn> <out.onnx>"""
import sys, zipfile, pickle, io
import numpy as np
import onnx
from onnx import helper, TensorProto, numpy_helper

def load_pth(path):
    zf = zipfile.ZipFile(path)
    names = zf.namelist()
    root = names[0].split('/')[0]
    class Storage:
        def __init__(self, dtype, key): self.dtype, self.key = dtype, key
    def rebuild(storage, offset, size, stride, *a):
        raw = zf.read(f'{root}/data/{storage.key}')
        arr = np.frombuffer(raw, dtype=storage.dtype)
        n = int(np.prod(size)) if len(size) else 1
        return np.lib.stride_tricks.as_strided(arr[offset:], shape=size, strides=[s * arr.itemsize for s in stride]).copy() if n else np.zeros(size, storage.dtype)
    class U(pickle.Unpickler):
        def find_class(self, mod, name):
            if name == '_rebuild_tensor_v2': return rebuild
            if name == 'FloatStorage': return np.float32
            if name == 'HalfStorage': return np.float16
            if mod == 'collections' and name == 'OrderedDict':
                import collections; return collections.OrderedDict
            if name == '_rebuild_parameter': return lambda d, *a: d
            raise pickle.UnpicklingError(f'{mod}.{name}')
        def persistent_load(self, pid):
            _, dtype, key, loc, n = pid
            return Storage(dtype if isinstance(dtype, type) and dtype in (np.float32, np.float16) else np.float32, key)
    obj = U(io.BytesIO(zf.read(f'{root}/data.pkl'))).load()
    return obj.get('params', obj)

a, b, dn, out = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
A, B = load_pth(a), load_pth(b)
W = {k: (dn * A[k] + (1 - dn) * B[k]).astype(np.float32) for k in A}
keys = sorted({int(k.split('.')[1]) for k in W}, key=int)
inits, nodes = [], []
x = 'input'
for i in keys:
    w, bias = f'body.{i}.weight', f'body.{i}.bias'
    if w in W and W[w].ndim == 4:
        inits += [numpy_helper.from_array(W[w], w), numpy_helper.from_array(W[bias], bias)]
        nodes.append(helper.make_node('Conv', [x, w, bias], [f'c{i}'], pads=[1, 1, 1, 1], kernel_shape=[3, 3])); x = f'c{i}'
    elif w in W:  # PReLU: slope per channel
        slope = W[w].reshape(-1, 1, 1)
        inits.append(numpy_helper.from_array(slope, w))
        nodes.append(helper.make_node('PRelu', [x, w], [f'p{i}'])); x = f'p{i}'
nodes.append(helper.make_node('DepthToSpace', [x], ['up'], blocksize=4, mode='CRD'))
inits.append(numpy_helper.from_array(np.array([1, 1, 4, 4], np.float32), 'scales'))
nodes.append(helper.make_node('Resize', ['input', '', 'scales'], ['base'], mode='nearest'))
nodes.append(helper.make_node('Add', ['up', 'base'], ['output']))
g = helper.make_graph(nodes, 'srvgg', [helper.make_tensor_value_info('input', TensorProto.FLOAT, [1, 3, None, None])],
                      [helper.make_tensor_value_info('output', TensorProto.FLOAT, [1, 3, None, None])], inits)
m = helper.make_model(g, opset_imports=[helper.make_opsetid('', 17)]); m.ir_version = 8
onnx.checker.check_model(m); onnx.save(m, out)
print('convs', sum(1 for n in nodes if n.op_type == 'Conv'), 'prelu', sum(1 for n in nodes if n.op_type == 'PRelu'), '->', out)
