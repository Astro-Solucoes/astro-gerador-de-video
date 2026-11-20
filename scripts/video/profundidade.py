"""Mapa de profundidade de uma ou mais fotos (MiDaS small, ONNX, CPU).

    python3 scripts/video/profundidade.py modelo.onnx foto1.jpg saida1.png [foto2.jpg saida2.png ...]

Claro = perto, escuro = longe. Bem suavizado: o mapa é grosseiro, e borda
dura no mapa entorta a foto quando a câmera anda. Usado pelo gerador de
vídeo (`src/lib/video/modelo/renderizarModelo.ts`); se este script falhar, o
gerador usa um mapa liso e o vídeo sai sem o efeito de profundidade.

O modelo (66 MB) NÃO fica no repositório: o workflow baixa de
https://github.com/isl-org/MiDaS/releases (licença MIT).
"""
import sys

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageFilter

MEDIA = np.array([0.485, 0.456, 0.406], dtype=np.float32)
DESVIO = np.array([0.229, 0.224, 0.225], dtype=np.float32)


def main():
    modelo, pares = sys.argv[1], sys.argv[2:]
    if not pares or len(pares) % 2:
        sys.exit("uso: profundidade.py modelo.onnx foto saida [foto saida ...]")
    sessao = ort.InferenceSession(modelo, providers=["CPUExecutionProvider"])
    entrada = sessao.get_inputs()[0].name
    for foto, saida in zip(pares[::2], pares[1::2]):
        img = Image.open(foto).convert("RGB")
        x = np.asarray(img.resize((256, 256), Image.BICUBIC), dtype=np.float32) / 255.0
        x = ((x - MEDIA) / DESVIO).transpose(2, 0, 1)[None]
        d = sessao.run(None, {entrada: x})[0][0]
        d = (d - d.min()) / (d.max() - d.min() + 1e-6)
        # Metade do tamanho da foto basta: o mapa é suave por natureza.
        mapa = Image.fromarray((d * 255).astype(np.uint8)).resize((max(2, img.width // 2), max(2, img.height // 2)), Image.BICUBIC)
        mapa.filter(ImageFilter.GaussianBlur(16)).save(saida)
        print(saida)


if __name__ == "__main__":
    main()
