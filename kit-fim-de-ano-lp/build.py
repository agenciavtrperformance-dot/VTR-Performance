#!/usr/bin/env python3
"""Gera a versão otimizada do site para publicar no Cloudflare Pages.

Uso:  python3 build.py

O que faz (os arquivos originais não são alterados):
  1. Minifica o CSS e coloca direto dentro de cada página (<style>), sem
     arquivo extra bloqueando a primeira exibição.
  2. Minifica o assets/main.js.
  3. Põe um código de versão (?v=...) em cada arquivo de /assets. Assim o
     cache de 1 ano funciona: quando um arquivo muda, o código muda junto e o
     navegador baixa a versão nova.
  4. Copia só os arquivos usados para dist/ e gera dist/_headers com cache
     de 1 ano (immutable) para /assets.
  5. Cria o kit-vtr-site.zip, que é o arquivo enviado ao Cloudflare.

Meta Pixel, GTM, textos, links e botões ficam exatamente como estão nas
páginas originais.
"""
import hashlib
import pathlib
import re
import shutil
import subprocess
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent
DIST = ROOT / "dist"
ZIP = ROOT / "kit-vtr-site.zip"
PAGES = ["index.html", "obrigado/index.html", "termos/index.html", "privacidade/index.html"]
ALWAYS_COPY = ["assets/img/og-image.jpg"]  # usada pelo Instagram/WhatsApp ao compartilhar o link
ESBUILD = ["npx", "-y", "esbuild@0.28.2"]

HEADERS = """/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
"""


def minify(path: pathlib.Path, loader: str) -> str:
    out = subprocess.run(ESBUILD + [f"--loader={loader}", "--minify", "--legal-comments=none"],
                         input=path.read_text(encoding="utf-8"), capture_output=True,
                         text=True, check=True, cwd="/")
    return out.stdout.strip()


def version(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()[:10]


def main() -> None:
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()
    built = {}  # caminho "/assets/..." -> conteúdo final (bytes)

    def asset(url: str) -> str:
        """Copia o arquivo para dist/ (se ainda não copiou) e devolve a URL com versão."""
        rel = url.lstrip("/")
        if url not in built:
            src = ROOT / rel
            if not src.is_file():
                raise SystemExit(f"Arquivo referenciado não existe: {url}")
            built[url] = src.read_bytes()
        return f"{url}?v={version(built[url])}"

    # JS minificado (o original continua legível em assets/main.js)
    built["/assets/main.js"] = minify(ROOT / "assets/main.js", "js").encode() + b"\n"

    # CSS minificado, com as fontes versionadas
    css = minify(ROOT / "assets/styles.css", "css")
    css = re.sub(r'url\((["\']?)(/assets/[^"\')?]+)\1\)', lambda m: f'url("{asset(m.group(2))}")', css)

    for page in PAGES:
        html = (ROOT / page).read_text(encoding="utf-8")
        link = '<link rel="stylesheet" href="/assets/styles.css">'
        if html.count(link) != 1:
            raise SystemExit(f"{page}: não encontrei o link do CSS")
        html = html.replace(link, f"<style>{css}</style>")
        # todas as referências locais a /assets entre aspas (src, href, data-src, data-poster)
        html = re.sub(r'"(/assets/[^"?#]+)"', lambda m: f'"{asset(m.group(1))}"', html)
        out = DIST / page
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(html, encoding="utf-8")

    for rel in ALWAYS_COPY:
        built.setdefault("/" + rel, (ROOT / rel).read_bytes())

    for url, data in built.items():
        out = DIST / url.lstrip("/")
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(data)

    (DIST / "_headers").write_text(HEADERS, encoding="utf-8")

    if ZIP.exists():
        ZIP.unlink()
    with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(DIST.rglob("*")):
            if f.is_file():
                z.write(f, f.relative_to(DIST).as_posix())

    total = sum(f.stat().st_size for f in DIST.rglob("*") if f.is_file())
    print(f"dist/ pronto: {sum(1 for f in DIST.rglob('*') if f.is_file())} arquivos, {total / 1024:.0f} KB")
    print(f"zip para o Cloudflare: {ZIP.name} ({ZIP.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
