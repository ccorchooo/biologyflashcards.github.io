"""Build a portable HTML edition with embedded CSS, cards, scripts and font."""
from pathlib import Path
import base64
import mimetypes
import re

ROOT = Path(__file__).resolve().parent
html = (ROOT / 'index.html').read_text(encoding='utf-8')
css = (ROOT / 'styles.css').read_text(encoding='utf-8')
font = base64.b64encode((ROOT / 'assets/Manrope-Variable.ttf').read_bytes()).decode('ascii')
css = css.replace("url('assets/Manrope-Variable.ttf')", f"url('data:font/ttf;base64,{font}')")
html = html.replace('<link rel="stylesheet" href="styles.css">', f'<style>\n{css}\n</style>')
for name in ['metadata.js', 'cards.js', 'graphs-data.js', 'diagrams-data.js', 'graphs.js', 'diagrams.js', 'app.js']:
    script = (ROOT / name).read_text(encoding='utf-8').replace('</script', '<\\/script')
    if name == 'diagrams-data.js':
        def embed_image(match):
            asset = ROOT / match.group(0)
            mime = mimetypes.guess_type(asset.name)[0]
            if mime not in {'image/svg+xml', 'image/jpeg', 'image/png', 'image/webp'}:
                raise ValueError(f'Unsupported diagram image: {asset.name}')
            encoded = base64.b64encode(asset.read_bytes()).decode('ascii')
            return f'data:{mime};base64,{encoded}'
        script = re.sub(r'assets/diagrams/[a-z0-9-]+\.(?:svg|jpg|png|webp)', embed_image, script)
    html = html.replace(f'<script src="{name}"></script>', f'<script>\n{script}\n</script>')
target = ROOT.parent / 'biology-flashcards.html'
target.write_text(html, encoding='utf-8')
print(f'Created {target.name}: {target.stat().st_size:,} bytes')
