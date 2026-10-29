# © MrJackDee™. All rights reserved.
# Builds every site icon from one letter or symbol: a brand-colored mark on a white tile.
# Usage (Windows, needs Pillow):  python calendar/tools/make-icons.py calendar/public "Σ" 164f90
# Writes favicon.ico, favicon-32.png, icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png.
import sys
from PIL import Image, ImageDraw, ImageFont

out, mark, color = sys.argv[1], sys.argv[2], sys.argv[3]
BRAND = tuple(int(color[i:i + 2], 16) for i in (0, 2, 4)) + (255,)
WHITE = (255, 255, 255, 255)
FONT = 'C:/Windows/Fonts/georgiab.ttf'  # Georgia Bold has Greek letters; Michroma does not


def make(size, rounded=True, glyph=0.66):
    # Draw at 4x and scale down for smooth edges
    s = size * 4
    im = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if rounded:
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.22), fill=WHITE)
    else:
        d.rectangle([0, 0, s, s], fill=WHITE)
    f = ImageFont.truetype(FONT, int(s * glyph))
    b = d.textbbox((0, 0), mark, font=f)
    d.text(((s - (b[2] - b[0])) / 2 - b[0], (s - (b[3] - b[1])) / 2 - b[1]), mark, font=f, fill=BRAND)
    return im.resize((size, size), Image.LANCZOS)


make(192).save(f'{out}/icon-192.png')
make(512).save(f'{out}/icon-512.png')
make(512, rounded=False, glyph=0.48).save(f'{out}/icon-maskable-512.png')  # full bleed; mark inside Android's safe zone
make(180, rounded=False, glyph=0.6).convert('RGB').save(f'{out}/apple-touch-icon.png')  # iOS rounds the corners itself
make(32).save(f'{out}/favicon-32.png')
make(48).save(f'{out}/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
print('icons written to', out)
