import json, sys
from PIL import Image
base = sys.argv[1]
meta = json.load(open(f'{base}/frames/full-page-tiles/tiles.json'))
H = meta['height']
out = Image.new('RGB', (1920, H), 'white')
for t in meta['tiles']:
    if not t.get('file'): continue
    out.paste(Image.open(t['file']).convert('RGB'), (0, t['y']))
out.save(f'{base}/00-homepage-full.png', optimize=True)
out.resize((480, round(H * 480 / 1920))).save(sys.argv[2])
print(out.size)
