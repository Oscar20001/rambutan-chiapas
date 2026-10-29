# Escribe las preguntas frecuentes de cada página como datos estructurados (FAQPage) para Google.
# Uso: python3 tools/faq.py   (después de tools/traducir.py)
import html, json, pathlib, re

raiz = pathlib.Path(__file__).resolve().parent.parent
for ruta in [raiz / 'index.html', raiz / 'en' / 'index.html']:
    s = ruta.read_text(encoding='utf-8')
    lista = s[s.index('<div class="faq__list"'):s.index('<div class="faq__actions"')]
    preguntas = []
    for q, a in re.findall(r'<summary>(.*?)</summary>\s*<p>(.*?)</p>', lista, re.S):
        limpio = lambda t: html.unescape(re.sub(r'<[^>]+>', '', t)).strip()
        preguntas.append({'@type': 'Question', 'name': limpio(q), 'acceptedAnswer': {'@type': 'Answer', 'text': limpio(a)}})
    datos = json.dumps({'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': preguntas}, ensure_ascii=False, indent=1)
    bloque = f'<script type="application/ld+json" id="faq-ld">\n{datos}\n</script>'
    if 'id="faq-ld"' in s:
        s = re.sub(r'<script type="application/ld\+json" id="faq-ld">.*?</script>', lambda m: bloque, s, flags=re.S)
    else:
        s = s.replace('<link rel="icon"', bloque + '\n<link rel="icon"', 1)
    ruta.write_text(s, encoding='utf-8')
    print(ruta.relative_to(raiz), len(preguntas), 'preguntas')
