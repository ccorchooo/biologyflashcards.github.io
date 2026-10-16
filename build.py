"""Build a portable HTML edition with embedded CSS, cards, scripts and font."""
from pathlib import Path
import base64

ROOT = Path(__file__).resolve().parent
html = (ROOT / 'index.html').read_text(encoding='utf-8')
css = (ROOT / 'styles.css').read_text(encoding='utf-8')
font = base64.b64encode((ROOT / 'assets/Manrope-Variable.ttf').read_bytes()).decode('ascii')
css = css.replace("url('assets/Manrope-Variable.ttf')", f"url('data:font/ttf;base64,{font}')")
html = html.replace('<link rel="stylesheet" href="styles.css">', f'<style>\n{css}\n</style>')
for name in ['metadata.js', 'cards.js', 'app.js']:
    script = (ROOT / name).read_text(encoding='utf-8').replace('</script', '<\\/script')
    html = html.replace(f'<script src="{name}"></script>', f'<script>\n{script}\n</script>')
target = ROOT.parent / 'biology-flashcards.html'
target.write_text(html, encoding='utf-8')
print(f'Created {target.name}: {target.stat().st_size:,} bytes')
