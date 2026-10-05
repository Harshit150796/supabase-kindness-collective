import sys, glob, os
from PIL import Image, ImageDraw
files = sorted(glob.glob('stills/t-*.png'), key=lambda f: float(f.split('t-')[1][:-4]))
os.makedirs('sheets', exist_ok=True)
for s in range(0, len(files), 4):
    sheet = Image.new('RGB', (1920, 1080), 'black')
    for i, f in enumerate(files[s:s+4]):
        im = Image.open(f).convert('RGB').resize((960, 540), Image.LANCZOS)
        d = ImageDraw.Draw(im); d.rectangle([0, 0, 120, 34], fill='black'); d.text((8, 8), f.split('t-')[1][:-4], fill='white')
        sheet.paste(im, ((i % 2) * 960, (i // 2) * 540))
    sheet.save(f'sheets/sheet-{s//4}.jpg', quality=88)
print(len(files))
