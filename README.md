# Gerador de vídeo da Astro

Este repositório existe só para rodar o gerador de vídeo do CRM da Astro no
GitHub Actions. Ele é público porque repositório público tem minutos de
Actions gratuitos; o CRM em si fica num repositório privado.

**Nada aqui é editado à mão.** Tudo é saída do empacotador
(`scripts/video/gerador/empacotar.mjs`) no repositório do CRM:

- `worker.mjs`: o gerador, num arquivo só;
- `scripts/video/modelos/`: os modelos de vídeo (HTML animado);
- `scripts/video/profundidade.py`: o mapa de profundidade das fotos;
- `.github/workflows/render-video.yml`: quando e como ele roda.

## Configuração (uma vez)

Em Settings → Secrets and variables → Actions, criar dois segredos:

- `SUPABASE_SECRET_KEY`: a chave de serviço do banco;
- `NEXT_PUBLIC_SUPABASE_URL`: o endereço do projeto no Supabase.

## Cuidado

Os registros de execução de um repositório público são públicos. O gerador
imprime só o identificador do pedido, o modelo e o tempo.
